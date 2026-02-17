"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApplication } from "@/contexts/ApplicationContext";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Button } from "@/components/ui/button";
import { applicationsApi } from "@/lib/api";
import { Loader2, CheckCircle2, FileText } from "lucide-react";

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  const { isAuthenticated, userToken } = useApplication();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const invoiceUrlRef = useRef<string | null>(null);

  const applicationId = idParam ?? null;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!applicationId || !userToken || !isAuthenticated) return;
    let revoked = false;
    applicationsApi
      .getInvoiceBlob(applicationId, userToken)
      .then(({ blob }) => {
        if (revoked) return;
        const url = URL.createObjectURL(blob);
        invoiceUrlRef.current = url;
        setInvoiceUrl(url);
        setInvoiceError(null);
      })
      .catch((err) => {
        if (!revoked) setInvoiceError(err?.message || "Invoice not available yet.");
      });
    return () => {
      revoked = true;
      if (invoiceUrlRef.current) {
        URL.revokeObjectURL(invoiceUrlRef.current);
        invoiceUrlRef.current = null;
      }
    };
  }, [applicationId, userToken, isAuthenticated]);

  const handleDone = () => {
    if (invoiceUrlRef.current) {
      URL.revokeObjectURL(invoiceUrlRef.current);
      invoiceUrlRef.current = null;
    }
    setInvoiceUrl(null);
    router.push(applicationId ? `/dashboard?id=${applicationId}` : "/dashboard");
  };

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-900">
      <DashboardSidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className={`flex flex-1 flex-col overflow-hidden transition-all duration-300 ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"}`}>
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-8 w-8 shrink-0" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment successful</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Your invoice has been sent to your email. You can preview it below and then continue your application.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#033783]" />
                <span className="font-medium text-gray-900 dark:text-white">Invoice preview</span>
              </div>
              <div className="min-h-[400px] bg-gray-100 dark:bg-gray-900/50 flex items-center justify-center">
                {invoiceUrl ? (
                  <iframe
                    src={invoiceUrl}
                    title="Invoice"
                    className="w-full h-[70vh] min-h-[500px] border-0"
                  />
                ) : invoiceError ? (
                  <div className="p-4 text-center space-y-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{invoiceError}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      If you just paid, the invoice may still be generating or was sent to your email. You can continue below.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-500">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span>Loading invoice…</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={handleDone}
                className="bg-[#033783] hover:bg-[#022555] text-white px-8"
              >
                Done — continue application
              </Button>
            </div>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Click Done to return to the dashboard and continue with directors and documents.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#033783]" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
