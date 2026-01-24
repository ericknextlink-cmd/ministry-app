"use client";

import { useEffect, useState } from "react";
import { useApplication } from "@/contexts/ApplicationContext";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";
import { Loader } from "@/components/ui/loader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, DollarSign, CheckCircle, XCircle, Clock } from "lucide-react";

interface Payment {
  id: number;
  application_id: number;
  amount: number;
  status: string;
  payment_method?: string;
  transaction_id?: string;
  created_at: string;
  application?: {
    id: number;
    certificate_type: string;
    certificate_class?: string;
    company_name?: string;
  };
}

export default function AdminPaymentsPage() {
  const { userToken, user } = useApplication();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userToken) return;
    fetchPayments();
  }, [userToken]);

  const fetchPayments = async () => {
    if (!userToken) return;
    
    setLoading(true);
    try {
      // Use the API route proxy instead of calling backend directly
      const response = await fetch('/api/payments', {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to fetch payments: ${response.statusText}`);
      }

      const data = await response.json();
      // API route returns { success: true, payments: [...], count: number }
      setPayments(data.payments || []);
    } catch (error: any) {
      console.error('Error fetching payments:', error);
      toast.error(error.message || 'Failed to load payments');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'paid':
      case 'success':
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        );
      case 'pending':
      case 'processing':
        return (
          <Badge className="bg-yellow-500 text-white">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'failed':
      case 'cancelled':
        return (
          <Badge className="bg-red-500 text-white">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return <Loader text="Loading payments..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <CreditCard className="h-8 w-8" />
            Payment Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            View and manage all payment transactions
          </p>
        </div>
      </div>

      {payments.length === 0 ? (
        <Card className="p-12 text-center">
          <CreditCard className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No Payments Found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {userToken 
              ? "The payment endpoint is not yet available or there are no payments to display."
              : "Please log in to view payments."
            }
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {payments.map((payment) => (
            <Card key={payment.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                      <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        GHS {payment.amount.toLocaleString()}
                      </span>
                    </div>
                    {getStatusBadge(payment.status)}
                  </div>
                  
                  {payment.application && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <span className="font-medium">Application:</span> {payment.application.certificate_type}
                      {payment.application.certificate_class && ` (${payment.application.certificate_class})`}
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    <span>Transaction ID: {payment.transaction_id || 'N/A'}</span>
                    <span className="mx-2">•</span>
                    <span>{new Date(payment.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
