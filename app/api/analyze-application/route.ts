import { NextResponse } from 'next/server';
import { analyzeApplication } from '@/lib/ai-analytics';
import { adminApi } from '@/lib/api';

// Explicitly export route config to ensure POST is allowed
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
      console.error('Error fetching application details:', apiError);
      return NextResponse.json(
        { error: apiError.message || 'Failed to fetch application details' },
        { status: 500 }
      );
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('Analysis API Error:', {
      message: error.message,
      stack: error.stack,
      applicationId,
    });

    // Provide more specific error messages based on error type
    let errorMessage = error.message || 'Failed to analyze application';
    let errorDetails = 'Please ensure OpenAI API key is configured and try again';
    
    if (error.message.includes('API key')) {
      errorDetails = 'OpenAI API key is missing or invalid. Please configure OPENAI_API_KEY environment variable.';
    } else if (error.message.includes('timeout')) {
      errorDetails = 'The analysis request timed out. This may happen with large applications. Please try again.';
    } else if (error.message.includes('rate limit') || error.message.includes('quota')) {
      errorDetails = 'OpenAI API rate limit exceeded. Please try again in a few minutes.';
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      errorDetails = 'Network error occurred. Please check your connection and try again.';
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
      },
      { status: 500 }
    );
  }
}
