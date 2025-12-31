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
            certificate_type: newAppType as any,
            description: `New ${newAppType} application` 
        });
        toast.success("Application created successfully!");
        setIsNewAppModalOpen(false);
        setNewAppType("");
        setSelectedApplicationId(newApp.id);
    } catch (err: any) {
        const errorMessage = err.message || "Failed to create application";
        if (errorMessage.includes("already have an active application")) {
            toast.warning("Active Application Found", {
                description: `You already have an active application for this certificate type. Please complete that one first.`,
                duration: 5000,
            });
        } else {
            toast.error("Application Error", { description: errorMessage });
        }
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

  if (!isAuthenticated && !loading) return null;

  const visibleApplications = applications.filter(app => app.status !== 'cancelled');
  const totalApplications = visibleApplications.length;
  const inProgressApplications = visibleApplications.filter(app => ["in_review", "draft", "pending_payment", "submitted"].includes(app.status)).length;
  const approvedApplications = visibleApplications.filter(app => app.status === "approved").length;
  const activeAppsList = visibleApplications.filter(app => ["draft", "submitted", "pending_payment", "in_review", "approved"].includes(app.status));

  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-900 relative">
      <DashboardSidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className={`flex flex-1 flex-col transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            {!selectedApplicationId ? (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8 max-w-7xl mx-auto"
              >
                {/* Header Action Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 dark:border-gray-800 pb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Applicant Dashboard</h1>
                        <p className="text-gray-500 dark:text-gray-400">Manage your classification certificates</p>
                    </div>
                    <Button 
                        onClick={() => setIsNewAppModalOpen(true)}
                        className="bg-[#033783] hover:bg-[#022555] text-white w-full sm:w-auto px-6 py-6 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-900/10"
                    >
                        <Plus className="h-5 w-5" />
                        Start New Application
                    </Button>
                </div>

                {/* Stats Cards - Responsive Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <StatCard label="Total Applications" value={totalApplications.toString()} />
                  <StatCard label="In Progress" value={inProgressApplications.toString()} />
                  <StatCard label="Approved" value={approvedApplications.toString()} />
                </div>

                {/* Main List Section */}
                {activeAppsList.length > 0 ? (
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-[#033783]" />
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Active Applications</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {activeAppsList.map((app) => (
                                <div key={app.id}>
                                    <ApplicationCard
                                        application={app}
                                        onClick={() => handleCardClick(app.id)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 text-gray-500">
                        <div className="h-16 w-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 shadow-sm">
                            <Plus className="h-8 w-8 text-gray-300" />
                        </div>
                        <p className="text-lg font-medium">No applications found</p>
                        <p className="text-sm">Click "Start New Application" to begin your journey.</p>
                    </div>
                )}

                {/* Process Trackers - Only show on tablets and above, or simplify for mobile */}
                {activeApplications.length > 0 && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold">Progress Timeline</h2>
                        <div className="space-y-4">
                            {activeApplications.map(app => (
                                <div key={app.id} className="p-4 md:p-6 bg-white dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-x-auto">
                                    <div className="min-w-[600px] md:min-w-0">
                                        <ProgressTracker application={app} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Bottom Section - Responsive Stacking */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Status Circle */}
                  <div className="rounded-2xl border bg-white p-8 dark:bg-gray-950 shadow-sm flex flex-col items-center">
                    <h3 className="mb-8 text-lg font-bold text-center">Current Progress Overview</h3>
                    <div className="relative">
                      <svg className="h-48 w-48" viewBox="0 0 200 200">
                        <circle cx="100" cy="100" r="80" fill="none" stroke="#E5E7EB" strokeWidth="16" className="dark:stroke-gray-800" />
                        <circle
                          cx="100" cy="100" r="80" fill="none" stroke="#4ADE80" strokeWidth="16"
                          strokeDasharray="502"
                          strokeDashoffset={502 * (1 - (getCompletionPercentage(applications[0]?.id || 0) / 100))}
                          strokeLinecap="round"
                          transform="rotate(-90 100 100)"
                          className="transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">
                            {getCompletionPercentage(applications[0]?.id || 0)}%
                        </span>
                        <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Complete</span>
                      </div>
                    </div>
                  </div>

                  {/* Pending Payment Action Card */}
                  {pendingPaymentApps.length > 0 ? (
                      <div className="relative rounded-2xl border bg-[#033783] p-8 text-white shadow-xl flex flex-col justify-between overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Activity className="h-32 w-32" />
                        </div>
                        
                        <div className="space-y-6 z-10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 p-2 rounded-lg">
                                        <Activity className="h-6 w-6 text-yellow-400" />
                                    </div>
                                    <h3 className="text-xl font-bold">
                                        {pendingPaymentApps[currentPaymentIndex].status === 'draft' ? 'Continue Application' : 'Payment Required'}
                                    </h3>
                                </div>
                                {pendingPaymentApps.length > 1 && (
                                    <span className="text-xs font-bold bg-white/10 px-3 py-1 rounded-full border border-white/10">
                                        {currentPaymentIndex + 1} of {pendingPaymentApps.length}
                                    </span>
                                )}
                            </div>
                            
                            <AnimatePresence mode="wait">
                                <motion.div 
                                    key={pendingPaymentApps[currentPaymentIndex].id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-4"
                                >
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-blue-200 uppercase font-bold tracking-wider">Service Type</p>
                                            <p className="text-lg font-medium capitalize truncate">{pendingPaymentApps[currentPaymentIndex].certificate_type.replace("-", " ")}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-blue-200 uppercase font-bold tracking-wider">Application ID</p>
                                            <p className="text-lg font-mono truncate">#{pendingPaymentApps[currentPaymentIndex].id}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        <div className="mt-8 space-y-4 z-10">
                            <Button 
                                className="w-full bg-white hover:bg-blue-50 text-[#033783] font-bold py-6 text-lg rounded-xl transition-all active:scale-[0.98]"
                                onClick={() => {
                                    const app = pendingPaymentApps[currentPaymentIndex];
                                    if (app.status === 'pending_payment') {
                                        router.push(`/dashboard/payment?id=${app.id}`);
                                    } else {
                                        router.push(`/dashboard?id=${app.id}`);
                                    }
                                }}
                            >
                                {pendingPaymentApps[currentPaymentIndex].status === 'draft' ? 'Continue Setup' : 'Pay Invoice Now'}
                            </Button>
                            
                            {pendingPaymentApps.length > 1 && (
                                <div className="flex justify-center gap-4">
                                    <Button variant="ghost" size="sm" onClick={prevPayment} className="hover:bg-white/10 text-white rounded-full h-10 w-10 p-0">
                                        <ChevronLeft className="h-5 w-5" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={nextPayment} className="hover:bg-white/10 text-white rounded-full h-10 w-10 p-0">
                                        <ChevronRight className="h-5 w-5" />
                                    </Button>
                                </div>
                            )}
                        </div>
                      </div>
                  ) : (
                      <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/20 p-8 flex items-center justify-center text-gray-400">
                          <p className="font-medium">No urgent tasks pending</p>
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
                className="max-w-4xl mx-auto pb-20"
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-800"
            >
                <div className="p-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">New Certification</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8">Choose the classification type you wish to apply for.</p>
                    
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <Label htmlFor="cert-type" className="text-xs font-bold uppercase tracking-widest text-gray-400">Certificate Category</Label>
                            <Select onValueChange={setNewAppType} value={newAppType}>
                                <SelectTrigger id="cert-type" className="h-14 rounded-xl border-gray-200 dark:border-gray-800">
                                    <SelectValue placeholder="Select type..." />
                                </SelectTrigger>
                                <SelectContent className="z-[110]">
                                    <SelectItem value="electrical">Electrical Works</SelectItem>
                                    <SelectItem value="building">General Building & Civil</SelectItem>
                                    <SelectItem value="plumbing">Plumbing Works</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 mt-10">
                        <Button 
                            onClick={handleCreateApplication}
                            disabled={!newAppType || isCreating}
                            className="bg-[#033783] text-white hover:bg-[#022555] h-14 rounded-xl text-lg font-bold"
                        >
                            {isCreating ? "Initializing..." : "Proceed to Application"}
                        </Button>
                        <Button 
                            variant="ghost" 
                            onClick={() => setIsNewAppModalOpen(false)}
                            disabled={isCreating}
                            className="h-12 rounded-xl text-gray-500"
                        >
                            Cancel
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
        <Suspense fallback={<div className="flex h-screen items-center justify-center text-gray-500">Loading your profile...</div>}>
            <DashboardContent />
        </Suspense>
    );
}

function StatCard({ label, value }: { label: string; value: string; }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border bg-white p-6 shadow-sm dark:bg-gray-950 border-gray-100 dark:border-gray-800">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-extrabold text-[#033783] dark:text-blue-400">{value}</p>
    </div>
  );
}