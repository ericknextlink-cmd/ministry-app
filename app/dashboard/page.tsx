"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { Activity, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useApplication } from "@/contexts/ApplicationContext";
import { ApplicationCard } from "@/components/application-card";
import { ApplicationDetails } from "@/components/application-details";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

import { ProgressTracker } from "@/components/progress-tracker";

// Define the type for an application as returned by the backend
interface Application {
  id: number;
  certificate_type: "electrical" | "building" | "plumbing" | "civil";
  certificate_class?: string;
  description?: string;
  status: "draft" | "submitted" | "pending_payment" | "in_review" | "approved" | "rejected" | "suspended" | "cancelled";
  current_step: number;
  expiry_date?: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, applications, fetchApplications, createApplication, loading, error, getCompletionPercentage } = useApplication();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(null);
  
  // New Application Modal State
  const [isNewAppModalOpen, setIsNewAppModalOpen] = useState(false);
  const [newAppType, setNewAppType] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth");
    } else {
      fetchApplications();
    }
  }, [isAuthenticated, router, fetchApplications]);

  // Handle URL ID parameter
  useEffect(() => {
    const idParam = searchParams.get("id");
    if (idParam && applications.length > 0) {
        const id = parseInt(idParam);
        if (!isNaN(id)) {
            setSelectedApplicationId(id);
        }
    }
  }, [searchParams, applications]);

  // Find all active applications for progress tracking
  const activeApplications = [...applications]
    .filter(app => ["draft", "pending_payment", "submitted", "in_review"].includes(app.status))
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  const handleCardClick = (appId: number) => {
    setSelectedApplicationId(appId);
  };

  const handleApplicationChange = (appId: number) => {
    setSelectedApplicationId(appId);
  };
  
  const handleSubmitApplication = () => {
    // Navigate to payment page
    router.push("/dashboard/payment");
  };

  const handleCreateApplication = async () => {
    if (!newAppType) {
        toast.error("Please select a certificate type.");
        return;
    }
    
    setIsCreating(true);
    try {
        const newApp = await createApplication({
            certificate_type: newAppType as any, // Type cast as backend expects specific strings
            description: `New ${newAppType} application` 
        });
        toast.success("Application created successfully!");
        setIsNewAppModalOpen(false);
        setNewAppType("");
        setSelectedApplicationId(newApp.id); // Redirect to details view
    } catch (err: any) {
        const errorMessage = err.message || "Failed to create application";
        
        if (errorMessage.includes("already have an active application")) {
            toast.warning("Active Application Found", {
                description: `You already have an active application for this certificate type. Please complete that one first.`,
                duration: 5000,
            });
        } else {
            toast.error("Application Error", {
                description: errorMessage
            });
        }
        console.error(err);
    } finally {
        setIsCreating(false);
    }
  };

  const selectedApp = applications.find((app) => app.id === selectedApplicationId);
  
  // Find all applications pending payment
  const pendingPaymentApps = applications.filter(app => 
    app.status === "pending_payment" || 
    (app.status === "draft" && app.current_step < 4)
  );
  const [currentPaymentIndex, setCurrentPaymentIndex] = useState(0);

  const nextPayment = () => {
    setCurrentPaymentIndex((prev) => (prev + 1) % pendingPaymentApps.length);
  };

  const prevPayment = () => {
    setCurrentPaymentIndex((prev) => (prev - 1 + pendingPaymentApps.length) % pendingPaymentApps.length);
  };

  if (loading && applications.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading applications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center text-red-500">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!isAuthenticated && !loading) {
      return null;
  }

  // Filter out cancelled applications completely
  const visibleApplications = applications.filter(app => app.status !== 'cancelled');
  
  const totalApplications = visibleApplications.length;
  const inProgressApplications = visibleApplications.filter(app => ["in_review", "draft", "pending_payment", "submitted"].includes(app.status)).length;
  const approvedApplications = visibleApplications.filter(app => app.status === "approved").length;

  // Show active and approved applications in the main list
  const activeAppsList = visibleApplications.filter(app => ["draft", "submitted", "pending_payment", "in_review", "approved"].includes(app.status));


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

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <AnimatePresence mode="wait">
            {!selectedApplicationId ? (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Action Bar */}
                <div className="flex justify-end mb-4">
                    <Button 
                        onClick={() => setIsNewAppModalOpen(true)}
                        className="bg-[#033783] hover:bg-[#022555] text-white flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        New Application
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3 scale-[0.8] md:scale-[0.8] lg:scale-[0.95]">
                  <StatCard
                    label="Applications"
                    value={totalApplications.toString()}
                  />
                  <StatCard
                    label="In progress"
                    value={inProgressApplications.toString()}
                  />
                  <StatCard
                    label="Approved"
                    value={approvedApplications.toString()}
                  />
                </div>

                {/* Application Cards - Active */}
                {activeAppsList.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Active Applications</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {activeAppsList.map((app) => (
                                <div key={app.id} className="w-full">
                                    <ApplicationCard
                                        application={app}
                                        onClick={() => handleCardClick(app.id)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {visibleApplications.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <p>No applications yet.</p>
                        <p className="text-sm">Click "New Application" to get started.</p>
                    </div>
                )}

                {/* Dynamic Progress Trackers */}
                {activeApplications.length > 0 && (
                    <div className="mt-12 mb-8 space-y-8">
                        {activeApplications.map(app => (
                            <div key={app.id} className="p-6 bg-white dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                <ProgressTracker application={app} />
                            </div>
                        ))}
                    </div>
                )}

                {/* Bottom Section */}
                <div className="grid gap-6 md:grid-cols-2 mt-20">
                  {/* Application Process Status */}
                  <div className="rounded-lg border bg-white p-6 dark:bg-gray-950 shadow-sm h-full">
                    <h3 className="mb-4 text-center text-lg font-semibold">
                      Application Process Status
                    </h3>
                    <div className="flex justify-center items-center h-[200px]">
                      <svg className="h-48 w-48" viewBox="0 0 200 200">
                        <circle
                          cx="100"
                          cy="100"
                          r="80"
                          fill="none"
                          stroke="#E5E7EB"
                          strokeWidth="20"
                          className="dark:stroke-gray-700"
                        />
                        <circle
                          cx="100"
                          cy="100"
                          r="80"
                          fill="none"
                          stroke="#4ADE80"
                          strokeWidth="20"
                          strokeDasharray="502"
                          strokeDashoffset={502 * (1 - (getCompletionPercentage(applications[0]?.id || 0) / 100))}
                          strokeLinecap="round"
                          transform="rotate(-90 100 100)"
                          className="transition-all duration-1000"
                        />
                        <text
                          x="100"
                          y="110"
                          textAnchor="middle"
                          fontSize="36"
                          fontWeight="bold"
                          className="fill-gray-900 dark:fill-gray-100"
                        >
                          {getCompletionPercentage(applications[0]?.id || 0)}%
                        </text>
                      </svg>
                    </div>
                  </div>

                  {/* Pending Payment Card (Dynamic) */}
                  {pendingPaymentApps.length > 0 ? (
                      <div className="relative rounded-lg border bg-black p-6 text-white shadow-lg h-full flex flex-col justify-between overflow-hidden group">
                        
                        <div className="flex items-center gap-4 mb-4 z-10">
                            <div className="bg-white rounded-full p-2 text-yellow-500">
                                <Activity className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-semibold">
                                {pendingPaymentApps[currentPaymentIndex].status === 'draft' ? 'Continue Application' : 'Pending Payment'}
                            </h3>
                            {pendingPaymentApps.length > 1 && (
                                <span className="ml-auto text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded-full">
                                    {currentPaymentIndex + 1} / {pendingPaymentApps.length}
                                </span>
                            )}
                        </div>
                        
                        <AnimatePresence mode="wait">
                            <motion.div 
                                key={pendingPaymentApps[currentPaymentIndex].id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-3 mb-6 z-10 flex-1"
                            >
                                <div>
                                    <p className="text-sm text-gray-400">Application Type</p>
                                    <p className="text-lg font-medium capitalize">{pendingPaymentApps[currentPaymentIndex].certificate_type.replace("-", " ")}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Application ID</p>
                                    <p className="text-base font-mono">#{pendingPaymentApps[currentPaymentIndex].id}</p>
                                </div>
                                {pendingPaymentApps[currentPaymentIndex].certificate_class && (
                                    <div>
                                        <p className="text-sm text-gray-400">Class</p>
                                        <p className="text-base">{pendingPaymentApps[currentPaymentIndex].certificate_class}</p>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        <div className="space-y-3 z-10">
                            <Button 
                                className="w-full bg-[#0062FF] hover:bg-blue-700 text-white font-medium py-6 text-lg transition-colors"
                                onClick={() => {
                                    const app = pendingPaymentApps[currentPaymentIndex];
                                    if (app.status === 'pending_payment') {
                                        router.push(`/dashboard/payment?id=${app.id}`);
                                    } else {
                                        router.push(`/dashboard?id=${app.id}`);
                                    }
                                }}
                            >
                                {pendingPaymentApps[currentPaymentIndex].status === 'draft' ? 'Continue' : 'Pay Now'}
                            </Button>
                            
                            {pendingPaymentApps.length > 1 && (
                                <div className="flex justify-between items-center px-1">
                                    <Button variant="ghost" size="icon" onClick={prevPayment} className="h-8 w-8 rounded-full hover:bg-white/10 text-white">
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <div className="flex gap-1">
                                        {pendingPaymentApps.map((_, idx) => (
                                            <div 
                                                key={idx} 
                                                className={`h-1.5 rounded-full transition-all ${idx === currentPaymentIndex ? 'w-4 bg-[#0062FF]' : 'w-1.5 bg-gray-600'}`}
                                            />
                                        ))}
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={nextPayment} className="h-8 w-8 rounded-full hover:bg-white/10 text-white">
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                      </div>
                  ) : (
                      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 flex items-center justify-center text-gray-400 h-full">
                          <p>No payments pending</p>
                      </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="details"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {selectedApp && (
                  <ApplicationDetails
                    application={selectedApp}
                    onApplicationChange={handleApplicationChange}
                    onSubmitApplication={handleSubmitApplication}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* New Application Modal */}
      {isNewAppModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-800"
            >
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Start New Application</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">Select the type of classification certificate you wish to apply for.</p>
                    
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="cert-type">Certificate Type</Label>
                            <Select onValueChange={setNewAppType} value={newAppType}>
                                <SelectTrigger id="cert-type">
                                    <SelectValue placeholder="Select type..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="electrical">Electrical Works</SelectItem>
                                    <SelectItem value="building">General Building & Civil Works</SelectItem>
                                    <SelectItem value="plumbing">Plumbing Works</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-8">
                        <Button 
                            variant="outline" 
                            onClick={() => setIsNewAppModalOpen(false)}
                            disabled={isCreating}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleCreateApplication}
                            disabled={!newAppType || isCreating}
                            className="bg-[#033783] text-white hover:bg-[#022555]"
                        >
                            {isCreating ? "Creating..." : "Start Application"}
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<div>Loading Dashboard...</div>}>
            <DashboardContent />
        </Suspense>
    );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center rounded-full border bg-white px-6 py-2 dark:bg-gray-950">
      <p className="text-sm text-gray-700 dark:text-gray-300">{label} :</p>
      <p className="text-sm text-gray-900 dark:text-gray-100 ml-2">
        {value}
      </p>
    </div>
  );
}