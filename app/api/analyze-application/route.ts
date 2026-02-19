import { NextResponse } from 'next/server';
import { adminApi } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req: Request) {
  let applicationId: number | undefined;
  try {
    const body = await req.json();
    const { applicationId: appId, token } = body;
    applicationId = appId;

    if (!appId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication token is required' },
        { status: 401 }
      );
    }

    const applicationDetails = await adminApi.getAdminApplicationDetails<any>(
      appId,
      token
    );

    const documents = applicationDetails.documents || [];
    if (documents.length === 0) {
      const companyInfo = applicationDetails.company_info as Record<string, string> | null | undefined;
      const directorsList = (applicationDetails.directors || []) as Array<{ name: string; position?: string }>;
      const companyFindings: string[] = companyInfo
        ? [
            companyInfo.company_name && `Company name: ${companyInfo.company_name}`,
            companyInfo.registration_number && `Registration number: ${companyInfo.registration_number}`,
            (companyInfo.address || companyInfo.city) && `Address: ${[companyInfo.address, companyInfo.city, companyInfo.country].filter(Boolean).join(', ')}`,
            companyInfo.phone_number && `Phone: ${companyInfo.phone_number}`,
            companyInfo.email && `Email: ${companyInfo.email}`,
          ].filter(Boolean) as string[]
        : ['Company information not provided'];
      const directorsFindings: string[] = directorsList.length > 0
        ? directorsList.map((d) => `${d.name}${d.position ? ` — ${d.position}` : ''}`)
        : ['No directors information provided'];
      return NextResponse.json({
        success: true,
        analysis: {
          verdict: 'needs_review',
          confidence: 0,
          summary: 'No documents found for analysis.',
          briefSummary: 'No documents found for analysis.',
          detailedReport: {
            companyInfo: { status: companyInfo ? 'complete' : 'incomplete', findings: companyFindings },
            directors: { status: directorsList.length > 0 ? 'complete' : 'incomplete', findings: directorsFindings },
            documents: {
              status: 'incomplete',
              findings: ['No documents uploaded for this application.'],
              documentAnalysis: [],
            },
            compliance: { status: 'partial', findings: ['No documents to assess.'] },
          },
          recommendations: ['Please upload required documents before analysis.'],
        },
      });
    }

    const applicationCompanyName =
      (applicationDetails.company_info as { company_name?: string } | null)?.company_name?.trim() || undefined;

    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    const backendUrl = baseUrl.endsWith('/api/v1') 
      ? baseUrl 
      : baseUrl.endsWith('/api/v1/') 
        ? baseUrl.slice(0, -1)
        : `${baseUrl}/api/v1`;
    
    const documentAnalyses = await Promise.allSettled(
      documents.map(async (doc: any) => {
        try {
          const response = await fetch(`${backendUrl}/analyze/document`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              document_url: doc.file_url,
              document_type: doc.document_type,
              strategy: 'hi_res',
              use_ocr: true,
              extract_tables: true,
              extract_forms: false,
              languages: ['eng'],
              application_company_name: applicationCompanyName,
              thread_id: String(applicationId),
              // Analyzer should derive company name from document content, not from filename.
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Failed to analyze ${doc.filename}`);
          }

          return await response.json();
        } catch (error) {
          console.warn(`[Analyze Application API] Primary analysis failed for ${doc.filename}:`, error instanceof Error ? error.message : error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            filename: doc.filename,
            document_type: doc.document_type,
          };
        }
      })
    );

    const successfulAnalyses = documentAnalyses
      .filter((result) => result.status === 'fulfilled' && result.value.success)
      .map((result) => (result as PromiseFulfilledResult<any>).value);

    const failedAnalyses = documentAnalyses
      .filter((result) => result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success))
      .map((result) => 
        result.status === 'rejected' 
          ? { error: result.reason?.message || 'Unknown error' }
          : result.value
      );

    const combinedAnalysis = successfulAnalyses
      .map((analysis) => analysis.analysis)
      .join('\n\n');

    interface DocumentAnalysisResult {
      filename: string;
      documentType: string;
      status: 'valid' | 'needs_review';
      findings: string[];
    }

    const documentAnalysisResults: DocumentAnalysisResult[] = documents.map((doc: any, index: number) => {
      const analysisResult = documentAnalyses[index];
      if (analysisResult.status === 'fulfilled' && analysisResult.value.success) {
        const value = analysisResult.value as { analysis: string; company_match?: boolean; company_match_detail?: string };
        const companyMismatch = value.company_match === false;
        return {
          filename: doc.filename,
          documentType: doc.document_type,
          status: companyMismatch ? ('needs_review' as const) : ('valid' as const),
          findings: companyMismatch && value.company_match_detail
            ? [value.company_match_detail, value.analysis]
            : [value.analysis],
        };
      } else {
        return {
          filename: doc.filename,
          documentType: doc.document_type,
          status: 'needs_review' as const,
          findings: [
            analysisResult.status === 'rejected'
              ? `Analysis failed: ${analysisResult.reason?.message || 'Unknown error'}`
              : (analysisResult as PromiseFulfilledResult<{ error?: string }>).value?.error || 'Analysis unavailable',
          ],
        };
      }
    });

    const anyCompanyMismatch = documentAnalyses.some(
      (r) => r.status === 'fulfilled' && (r.value as { company_match?: boolean }).company_match === false
    );
    const allDocumentsValid = documentAnalysisResults.every((doc: DocumentAnalysisResult) => doc.status === 'valid');
    const hasFailures = failedAnalyses.length > 0;

    const fullSummary = combinedAnalysis || (hasFailures ? 'Some documents could not be analyzed. Please try again later.' : 'Document analysis completed.');
    const briefSummaryMaxLen = 320;
    const briefSummary = fullSummary.length <= briefSummaryMaxLen
      ? fullSummary
      : fullSummary.slice(0, briefSummaryMaxLen).trim().replace(/\s+\S*$/, '') + '…';

    const companyInfo = applicationDetails.company_info as Record<string, string> | null | undefined;
    const companyFindings: string[] = companyInfo
      ? [
          companyInfo.company_name && `Company name: ${companyInfo.company_name}`,
          companyInfo.registration_number && `Registration number: ${companyInfo.registration_number}`,
          (companyInfo.address || companyInfo.city) && `Address: ${[companyInfo.address, companyInfo.city, companyInfo.country].filter(Boolean).join(', ')}`,
          companyInfo.phone_number && `Phone: ${companyInfo.phone_number}`,
          companyInfo.email && `Email: ${companyInfo.email}`,
        ].filter(Boolean) as string[]
      : ['Company information not provided'];

    const directorsList = (applicationDetails.directors || []) as Array<{ name: string; position?: string }>;
    const directorsFindings: string[] = directorsList.length > 0
      ? directorsList.map((d) => `${d.name}${d.position ? ` — ${d.position}` : ''}`)
      : ['No directors information provided'];

    const validCount = documentAnalysisResults.filter((d) => d.status === 'valid').length;
    const totalCount = documentAnalysisResults.length;
    const complianceFindings: string[] = totalCount > 0
      ? [
          `${validCount} of ${totalCount} document(s) passed review.`,
          ...(validCount < totalCount ? ['One or more documents need review or had analysis errors.'] : []),
        ]
      : ['No documents to assess.'];

    const analysisResult = {
      verdict: anyCompanyMismatch
        ? 'needs_review'
        : allDocumentsValid
          ? 'approve'
          : hasFailures
            ? 'needs_review'
            : 'approve',
      confidence: allDocumentsValid ? 0.9 : hasFailures ? 0.5 : 0.7,
      summary: fullSummary,
      briefSummary,
      detailedReport: {
        companyInfo: {
          status: companyInfo ? 'complete' : 'incomplete',
          findings: companyFindings,
        },
        directors: {
          status: directorsList.length > 0 ? 'complete' : 'incomplete',
          findings: directorsFindings,
        },
        documents: {
          status: allDocumentsValid ? 'complete' : hasFailures ? 'issues' : 'complete',
          findings: failedAnalyses.length > 0 ? failedAnalyses.map((f: { error?: string }) => f.error || 'Analysis failed') : ['All submitted documents were analyzed.'],
          documentAnalysis: documentAnalysisResults,
        },
        compliance: {
          status: allDocumentsValid ? 'compliant' : 'partial',
          findings: complianceFindings,
        },
      },
      recommendations: anyCompanyMismatch
        ? ['One or more documents do not belong to the application company. Do not approve until documents match the applicant company.']
        : failedAnalyses.length > 0
          ? ['Some documents could not be analyzed. Please verify document quality and try again.']
          : [],
    };

    // Persist analysis so the page can load it on next visit and avoid duplicate runs
    try {
      await fetch(`${backendUrl}/admin/applications/${applicationId}/analysis`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ analysis: analysisResult }),
      });
    } catch (saveErr) {
      console.warn('[Analyze Application API] Failed to save analysis:', saveErr);
    }

    return NextResponse.json({
      success: true,
      analysis: analysisResult,
    });
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    
    console.error('[Analyze Application API] Unexpected error:', {
      message: error.message,
      stack: error.stack,
      applicationId,
    });

    return NextResponse.json(
      {
        error: 'An unexpected error occurred during analysis. Please try again or contact support if the issue persists.',
        code: 'UNKNOWN_ERROR',
        retryable: true,
        details: error.message,
      },
      { status: 500 }
    );
  }
}