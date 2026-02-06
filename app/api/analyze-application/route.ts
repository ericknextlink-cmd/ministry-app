import { NextResponse } from 'next/server';
import { adminApi } from '@/lib/api';
import { analyzeDocumentFallback } from '@/lib/analysis-fallbacks';

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
      parseInt(appId),
      token
    );

    const documents = applicationDetails.documents || [];
    if (documents.length === 0) {
      return NextResponse.json({
        success: true,
        analysis: {
          verdict: 'needs_review',
          confidence: 0,
          summary: 'No documents found for analysis.',
          detailedReport: {
            documents: {
              status: 'incomplete',
              findings: ['No documents uploaded for this application.'],
              documentAnalysis: [],
            },
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
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Failed to analyze ${doc.filename}`);
          }

          return await response.json();
        } catch (primaryError) {
          console.warn(`[Analyze Application API] Primary analysis failed for ${doc.filename}, trying fallbacks:`, primaryError instanceof Error ? primaryError.message : primaryError);
          const fallback = await analyzeDocumentFallback(
            doc.file_url,
            doc.document_type,
            doc.filename,
            token
          );
          if (fallback.success && fallback.analysis) {
            return {
              success: true,
              analysis: fallback.analysis,
              extracted_text: '',
              tables: [],
              forms: [],
              metadata: { source: 'fallback' },
            };
          }
          return {
            success: false,
            error: fallback.error ?? (primaryError instanceof Error ? primaryError.message : 'Unknown error'),
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

    const analysisResult = {
      verdict: anyCompanyMismatch
        ? 'needs_review'
        : allDocumentsValid
          ? 'approve'
          : hasFailures
            ? 'needs_review'
            : 'approve',
      confidence: allDocumentsValid ? 0.9 : hasFailures ? 0.5 : 0.7,
      summary: combinedAnalysis || 'Document analysis completed. Review individual document findings for details.',
      detailedReport: {
        companyInfo: {
          status: applicationDetails.company_info ? 'complete' : 'incomplete',
          findings: applicationDetails.company_info ? [] : ['Company information not provided'],
        },
        directors: {
          status: (applicationDetails.directors || []).length > 0 ? 'complete' : 'incomplete',
          findings: (applicationDetails.directors || []).length > 0 ? [] : ['No directors information provided'],
        },
        documents: {
          status: allDocumentsValid ? 'complete' : hasFailures ? 'issues' : 'complete',
          findings: failedAnalyses.map((f) => f.error || 'Analysis failed'),
          documentAnalysis: documentAnalysisResults,
        },
        compliance: {
          status: allDocumentsValid ? 'compliant' : 'partial',
          findings: [],
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
