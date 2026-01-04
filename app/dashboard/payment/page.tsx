"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useApplication } from "@/contexts/ApplicationContext";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CreditCard, ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import { applicationsApi } from "@/lib/api";
import { formatCurrency, formatApplicationId } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  
  const { isAuthenticated, applications, fetchApplications, loading, updateApplication, refreshApplications } = useApplication();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // State for consolidated payment
  const [otherPendingApps, setOtherPendingApps] = useState<any[]>([]);
  const [payMode, setPayMode] = useState<"single" | "all">("single");

  // Fee configuration
  const FEE_STRUCTURE: Record<string, number> = {
    "Class 1": 2000,
    "Class 2": 1500,
    "Class 3": 1000,
    "Class 4": 500,
    "default": 500
  };

  const getFeeAmount = (certClass?: string) => {
      if (!certClass) return 0;
      const key = Object.keys(FEE_STRUCTURE).find(k => certClass.includes(k));
      return key ? FEE_STRUCTURE[key] : FEE_STRUCTURE["default"];
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth");
    } else {
      fetchApplications();
    }
  }, [isAuthenticated, router, fetchApplications]);

  // Determine the active application based on ID param or fallback to latest pending
  // Exclude drafts that are already past payment (step >= 4)
  const activeApplication = idParam 
    ? applications.find(app => app.id === parseInt(idParam)) 
    : [...applications]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .find(app => 
          app.status === "pending_payment" || 
          (app.status === "draft" && app.current_step < 4)
        );

  // Find ALL pending applications with classes selected (excluding active one)
  useEffect(() => {
      if (!applications.length) return;
      
      const others = applications.filter(app => 
          app.id !== activeApplication?.id && // Not the current one
          (app.status === 'pending_payment' || (app.status === 'draft' && app.current_step < 4)) && 
          app.certificate_class // Must have class selected
      );
      setOtherPendingApps(others);
      
      // Only default to "all" if the user didn't explicitly select a specific ID
      // If they came from a specific "Pay Now" button (idParam exists), keep it single initially
      if (others.length > 0 && !idParam) {
          setPayMode("all");
      } else {
          setPayMode("single");
      }
      
  }, [applications, activeApplication, idParam]);

  const handlePayment = async () => {
      if (!activeApplication) return;
      setIsProcessing(true);
      
      try {
          const token = localStorage.getItem("access_token");
          if (!token) throw new Error("No access token found");

          if (payMode === "all" && otherPendingApps.length > 0) {
              // Consolidated Payment
              const allIds = [activeApplication.id, ...otherPendingApps.map(a => a.id)];
              await applicationsApi.bulkPay(allIds, token);
              toast.success("Consolidated Payment Successful!", {
                  description: `Paid for ${allIds.length} applications.`
              });
              await refreshApplications();
              router.push("/dashboard"); 
          } else {
              // Single Payment
              await updateApplication(activeApplication.id, {
                  current_step: 4, 
                  status: "draft" 
              });
              toast.success("Payment Successful!");
              await refreshApplications();
              // Take directly to the forms for THIS application
              router.push(`/dashboard?id=${activeApplication.id}`);
          }
      } catch (error: any) {
          console.error(error);
          toast.error(error.message || "Payment failed");
      } finally {
          setIsProcessing(false);
      }
  };

  // If active app is found but not in a payable state
  // Check if it's pending OR a draft < step 4
  const isPayable = activeApplication && (
      activeApplication.status === 'pending_payment' || 
      (activeApplication.status === 'draft' && activeApplication.current_step < 4)
  );

  const currentFee = activeApplication ? getFeeAmount(activeApplication.certificate_class) : 0;
  const otherFees = otherPendingApps.reduce((sum, app) => sum + getFeeAmount(app.certificate_class), 0);
  const totalConsolidated = currentFee + otherFees;

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-900">
      <DashboardSidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className={`flex flex-1 flex-col overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          {loading && applications.length === 0 ? (
              <div>Loading payment details...</div>
          ) : isPayable ? (
              <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Payment Invoice Card */}
                  <div className="space-y-4">
                      {otherPendingApps.length > 0 && (
                          <Alert className={`cursor-pointer transition-colors ${payMode === 'all' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}`} onClick={() => setPayMode("all")}>
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>Consolidated Payment Available</AlertTitle>
                              <AlertDescription>
                                  You have {otherPendingApps.length} other pending applications. 
                                  Pay for all together?
                              </AlertDescription>
                          </Alert>
                      )}

                      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                          <div className="bg-[#033783] p-6 text-white text-center">
                              <div className="mx-auto h-16 w-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
                                  <CreditCard className="h-8 w-8" />
                              </div>
                              <h2 className="text-xl font-bold">Secure Payment</h2>
                              <p className="text-blue-100 text-sm">Ghana.gov Payment Portal</p>
                          </div>
                          
                          <div className="p-8 space-y-6">
                              {payMode === "all" && otherPendingApps.length > 0 ? (
                                  // Consolidated View
                                  <div className="space-y-4">
                                      <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Payment Breakdown</div>
                                      <div className="space-y-2">
                                          <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-900/50 rounded">
                                              <div>
                                                  <p className="font-medium">Current Application (#{activeApplication.id})</p>
                                                  <p className="text-xs text-gray-500">{activeApplication.certificate_type}</p>
                                              </div>
                                              <span>{formatCurrency(currentFee)}</span>
                                          </div>
                                          {otherPendingApps.map(app => (
                                              <div key={app.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-900/50 rounded">
                                                  <div>
                                                      <p className="font-medium">{formatApplicationId(app.id, app.created_at)}</p>
                                                      <p className="text-xs text-gray-500">{app.certificate_type}</p>
                                                  </div>
                                                  <span>{formatCurrency(getFeeAmount(app.certificate_class))}</span>
                                              </div>
                                          ))}
                                      </div>
                                      <div className="flex justify-end text-sm text-blue-600 hover:underline cursor-pointer" onClick={() => setPayMode("single")}>
                                          Switch to pay for current application only
                                      </div>
                                  </div>
                              ) : (
                                  // Single View
                                  <div className="space-y-4">
                                      <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                                          <span className="text-gray-500">Service</span>
                                          <span className="font-medium">Contractor Classification</span>
                                      </div>
                                      <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                                          <span className="text-gray-500">Type</span>
                                          <span className="font-medium capitalize">{activeApplication.certificate_type}</span>
                                      </div>
                                      <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                                          <span className="text-gray-500">Class</span>
                                          <span className="font-medium">{activeApplication.certificate_class || "N/A"}</span>
                                      </div>
                                      <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                                          <span className="text-gray-500">Application ID</span>
                                          <span className="font-mono text-sm">{activeApplication.id}</span>
                                      </div>
                                      {otherPendingApps.length > 0 && (
                                          <div className="flex justify-end text-sm text-blue-600 hover:underline cursor-pointer" onClick={() => setPayMode("all")}>
                                              Switch to pay for all {otherPendingApps.length + 1} applications
                                          </div>
                                      )}
                                  </div>
                              )}

                              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl flex justify-between items-center">
                                  <span className="text-gray-600 font-medium">Total Amount</span>
                                  <span className="text-2xl font-bold text-[#033783] dark:text-blue-400">
                                      {formatCurrency(payMode === 'all' ? totalConsolidated : currentFee)}
                                  </span>
                              </div>

                              <Button 
                                className="w-full h-12 text-base bg-[#033783] hover:bg-[#022555]"
                                onClick={handlePayment}
                                disabled={isProcessing}
                              >
                                  {isProcessing ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing Payment...
                                      </>
                                  ) : (
                                      `Pay ${formatCurrency(payMode === 'all' ? totalConsolidated : currentFee)}`
                                  )}
                              </Button>
                              
                              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                                  <ShieldCheck className="h-4 w-4" />
                                  Secured by Ghana.gov Platform
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Instructions / Brand */}
                  <div className="hidden md:flex flex-col justify-center space-y-6">
                      <div className="relative h-20 w-20">
                        <Image
                            src="/ministry-1.png"
                            alt="Ministry Logo"
                            fill
                            className="object-contain"
                        />
                      </div>
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                          Complete your application payment securely.
                      </h1>
                      <div className="space-y-4 text-gray-600 dark:text-gray-400">
                          <p>
                              You are about to make a payment for your Contractor Classification Certificate.
                          </p>
                          <ul className="list-disc list-inside space-y-2">
                              <li>Verify the application class and amount.</li>
                              <li>Use Mobile Money or Card via the Ghana.gov portal.</li>
                              <li>Instant receipt generation upon success.</li>
                          </ul>
                      </div>
                  </div>
              </div>
          ) : activeApplication ? (
              <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow">
                  <h3 className="text-lg font-medium mb-2">Payment Not Required</h3>
                  <p className="text-gray-500 mb-4">
                      This application ({activeApplication.status}) does not have a pending payment.
                  </p>
                  <Button onClick={() => router.push("/dashboard")}>Return to Dashboard</Button>
              </div>
          ) : (
             <div className="text-center p-8">
                  <p className="text-gray-500 mb-4">No pending payment found.</p>
                  <Button onClick={() => router.push("/dashboard")}>Return to Dashboard</Button>
             </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function PaymentPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
            </div>
        }>
            <PaymentContent />
        </Suspense>
    );
}