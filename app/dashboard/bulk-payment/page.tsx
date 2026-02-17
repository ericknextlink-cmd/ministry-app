"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApplication } from "@/contexts/ApplicationContext";
import { applicationsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { CreditCard, Loader2 } from "lucide-react";
import { formatCurrency, formatApplicationId } from "@/lib/utils"; 
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";

export default function BulkPaymentPage() {
  const router = useRouter();
  const { userToken, refreshApplications } = useApplication();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [payableApps, setPayableApps] = useState<any[]>([]);
  const [incompleteApps, setIncompleteApps] = useState<any[]>([]); // New state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Layout State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Fee configuration
  const FEE_STRUCTURE: Record<string, number> = {
    "D1K1": 3500,
    "D2K2": 2500,
    "D3K3": 600,
    "E1": 1500,
    "E2": 1000,
    "E3": 300,
    "G1": 1000,
    "G2": 400,
    "default": 0
  };

  const getFee = (certClass?: string) => {
      if (!certClass) return 0;
      // Handle "Financial Class 1" etc matching
      const key = Object.keys(FEE_STRUCTURE).find(k => certClass.includes(k));
      return key ? FEE_STRUCTURE[key] : FEE_STRUCTURE["default"];
  };

  useEffect(() => {
    const fetchApps = async () => {
      if (!userToken) return;
      try {
        const apps = await applicationsApi.list(userToken);
        
        // Filter applications that are pending (draft or pending_payment) and NOT fully submitted
        const pending = apps.filter(app => 
            (app.status === 'draft' || app.status === 'pending_payment') && 
            app.current_step < 4
        );

        // Split into Payable (Has Class) vs Incomplete (No Class)
        const ready = [];
        const notReady = [];

        for (const app of pending) {
            if (app.certificate_class) {
                ready.push(app);
            } else {
                notReady.push(app);
            }
        }

        setPayableApps(ready);
        setIncompleteApps(notReady);
        
        // Default select all payable
        setSelectedIds(ready.map(app => app.id));
      } catch (error) {
        console.error("Failed to fetch applications", error);
        toast.error("Failed to load payable applications");
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, [userToken]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkPay = async () => {
    if (selectedIds.length === 0) return;
    setProcessing(true);
    
    try {
        await applicationsApi.bulkPay(selectedIds, userToken!);
        toast.success("Payment successful!");
        await refreshApplications(); // Update context
        router.push("/dashboard"); // Redirect to dashboard
    } catch (error: any) {
        console.error("Payment failed", error);
        const msg = error.message || "Payment processing failed";
        toast.error(msg);
    } finally {
        setProcessing(false);
    }
  };

  // Calculate Total dynamically
  const totalAmount = selectedIds.reduce((sum, id) => {
      const app = payableApps.find(a => a.id === id);
      return sum + (app ? getFee(app.certificate_class) : 0);
  }, 0);

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-900 relative">
      {/* Sidebar */}
      <DashboardSidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <div className={`flex flex-1 flex-col overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50/50 dark:bg-gray-900">
            <div className="container mx-auto max-w-5xl space-y-6">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <CreditCard className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Consolidated Payment</h1>
                    <p className="text-gray-500 dark:text-gray-400">Pay for multiple applications in a single transaction</p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {/* List of Applications */}
                <div className="md:col-span-2 space-y-8">
                    {/* Payable Section */}
                    <Card className="border-none shadow-sm dark:bg-gray-800">
                        <CardHeader>
                            <CardTitle>Ready for Payment</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {payableApps.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">No applications ready for payment.</p>
                            ) : (
                                payableApps.map(app => (
                                    <div key={app.id} className="flex items-center space-x-4 p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors bg-white dark:bg-gray-800">
                                        <Checkbox 
                                            checked={selectedIds.includes(app.id)}
                                            onCheckedChange={() => toggleSelection(app.id)}
                                        />
                                        <div className="flex-1">
                        <p className="font-medium capitalize">{app.certificate_type.replace("-", " ")}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{formatApplicationId(app.id, app.created_at)} • {app.certificate_class}</p>
                      </div>
                                        <div className="font-mono font-medium text-gray-900 dark:text-gray-100">
                                            {formatCurrency(getFee(app.certificate_class))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    {/* Incomplete Section */}
                    {incompleteApps.length > 0 && (
                        <Card className="border-none shadow-sm dark:bg-gray-800 opacity-90">
                            <CardHeader>
                                <CardTitle className="text-amber-600 dark:text-amber-500">Action Required</CardTitle>
                                <p className="text-sm text-gray-500">Select a class for these applications to proceed with payment.</p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {incompleteApps.map(app => (
                                    <div key={app.id} className="flex items-center justify-between p-4 border border-amber-200 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/10 rounded-lg">
                                        <div>
                                            <h3 className="font-semibold capitalize text-gray-900 dark:text-gray-100">{app.certificate_type.replace('_', ' ')}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{formatApplicationId(app.id, app.created_at)} • Class Not Selected</p>
                                        </div>
                                        <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => router.push(`/dashboard?id=${app.id}`)} // Redirect to dashboard to resume
                                        >
                                            Complete Setup
                                        </Button>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Payment Summary */}
                <div>
                    <Card className="sticky top-6 border-none shadow-sm dark:bg-gray-800">
                        <CardHeader>
                            <CardTitle>Payment Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2 text-gray-600 dark:text-gray-300">
                                <div className="flex justify-between text-sm">
                                    <span>Selected Items</span>
                                    <span>{selectedIds.length}</span>
                                </div>
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between font-bold text-lg text-gray-900 dark:text-white">
                                    <span>Total</span>
                                    <span>{formatCurrency(totalAmount)}</span>
                                </div>
                            </div>

                            <Button 
                                className="w-full bg-[#033783] hover:bg-[#022555] text-white" 
                                size="lg"
                                disabled={selectedIds.length === 0 || processing}
                                onClick={handleBulkPay}
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    `Pay ${formatCurrency(totalAmount)}`
                                )}
                            </Button>
                            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                <CreditCard className="h-3 w-3" />
                                Secured by Ghana.gov Payment Portal
                            </div>
                        </CardContent>
                    </Card>
                </div>
              </div>
            </div>
        </main>
      </div>
    </div>
  );
}
