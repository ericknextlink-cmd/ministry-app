import { NextResponse } from 'next/server';

// Explicitly export route config
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET(req: Request) {
  try {
    // Get authorization token from request headers
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication token is required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    
    // Fetch payments from backend
    const response = await fetch(`${backendUrl}/api/v1/admin/payments`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Handle 404 gracefully
      if (response.status === 404) {
        return NextResponse.json(
          { payments: [], message: 'No payments found' },
          { status: 200 }
        );
      }

      // Handle other errors
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || 'Failed to fetch payments' };
      }

      return NextResponse.json(
        { error: errorData.error || errorData.message || 'Failed to fetch payments' },
        { status: response.status }
      );
    }

    // Parse and transform the response
    const data = await response.json();
    
    // Transform the response to ensure consistent format
    // Handle both array and object responses from backend
    const payments = Array.isArray(data) 
      ? data 
      : (data.payments || data.data || []);

    // Clean and transform payment data to avoid console errors
    const transformedPayments = payments.map((payment: any) => {
      // Remove any undefined or null values that might cause issues
      const cleaned: any = {
        id: payment.id || 0,
        application_id: payment.application_id ?? payment.applicationId ?? "",
        amount: payment.amount || 0,
        status: payment.status || 'unknown',
        created_at: payment.created_at || payment.createdAt || new Date().toISOString(),
      };

      // Add optional fields only if they exist
      if (payment.payment_method) cleaned.payment_method = payment.payment_method;
      if (payment.paymentMethod) cleaned.payment_method = payment.paymentMethod;
      if (payment.transaction_id) cleaned.transaction_id = payment.transaction_id;
      if (payment.transactionId) cleaned.transaction_id = payment.transactionId;
      if (payment.transaction_ref) cleaned.transaction_id = payment.transaction_ref;
      if (payment.transactionRef) cleaned.transaction_id = payment.transactionRef;

      // Include application details if available
      if (payment.application) {
        cleaned.application = {
          id: payment.application.id || 0,
          certificate_type: payment.application.certificate_type || payment.application.certificateType || '',
          certificate_class: payment.application.certificate_class || payment.application.certificateClass,
          company_name: payment.application.company_name || payment.application.companyName,
        };
      }

      return cleaned;
    });

    // Return transformed response
    return NextResponse.json({
      success: true,
      payments: transformedPayments,
      count: transformedPayments.length,
    });

  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('Payments API Error:', {
      message: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      {
        error: 'Failed to fetch payments',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
