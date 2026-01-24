import { NextResponse } from 'next/server';
import { analyzeApplication } from '@/lib/ai-analytics';
import { adminApi } from '@/lib/api';

// Explicitly export route config to ensure POST is allowed
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Handle OPTIONS for CORS preflight
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

    try {
      const applicationDetails = await adminApi.getAdminApplicationDetails<any>(
        parseInt(appId),
        token
      );

      const analysisResult = await analyzeApplication(
        {
          id: applicationDetails.id,
          certificate_type: applicationDetails.certificate_type,
          certificate_class: applicationDetails.certificate_class,
          company_info: applicationDetails.company_info,
          directors: applicationDetails.directors || [],
          documents: applicationDetails.documents || [],
        },
        token
      );

      return NextResponse.json({
        success: true,
        analysis: analysisResult,
      });
    } catch (apiError: any) {
      // Check if it's an AnalysisError with userMessage
      if (apiError.userMessage && apiError.code) {
        console.error('[Analyze Application API] Analysis error:', {
          code: apiError.code,
          message: apiError.message,
          userMessage: apiError.userMessage,
          retryable: apiError.retryable,
          applicationId,
        });
        
        return NextResponse.json(
          {
            error: apiError.userMessage,
            code: apiError.code,
            retryable: apiError.retryable,
            details: apiError.message, // For server logs
          },
          { status: apiError.retryable ? 500 : 503 }
        );
      }
      
      // Regular error from API call
      console.error('[Analyze Application API] Error fetching application details:', {
        message: apiError.message,
        stack: apiError.stack,
        applicationId,
      });
      return NextResponse.json(
        { 
          error: 'Failed to fetch application details. Please try again.',
          code: 'API_ERROR',
          retryable: true,
        },
        { status: 500 }
      );
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    
    // Check if it's an AnalysisError
    if ('userMessage' in error && 'code' in error) {
      const analysisError = error as any;
      console.error('[Analyze Application API] Analysis error:', {
        code: analysisError.code,
        message: analysisError.message,
        userMessage: analysisError.userMessage,
        retryable: analysisError.retryable,
        applicationId,
      });
      
      return NextResponse.json(
        {
          error: analysisError.userMessage,
          code: analysisError.code,
          retryable: analysisError.retryable,
          details: analysisError.message, // For server logs
        },
        { status: analysisError.retryable ? 500 : 503 }
      );
    }
    
    // Generic error
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
        details: error.message, // For server logs
      },
      { status: 500 }
    );
  }
}
