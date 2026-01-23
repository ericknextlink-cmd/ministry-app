import { NextResponse } from 'next/server';
import { analyzeApplication } from '@/lib/ai-analytics';
import { adminApi } from '@/lib/api';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { applicationId, token } = body;

    if (!applicationId) {
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
        parseInt(applicationId),
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
    });

    return NextResponse.json(
      {
        error: error.message || 'Failed to analyze application',
        details: 'Please ensure OpenAI API key is configured and try again',
      },
      { status: 500 }
    );
  }
}
