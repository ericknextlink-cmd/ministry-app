"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { Activity, Plus, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useApplication } from "@/contexts/ApplicationContext";
import { ApplicationCard } from "@/components/application-card";
import { ApplicationDetails } from "@/components/application-details";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatApplicationId } from "@/lib/utils";
import { applicationsApi } from "@/lib/api";

import { ProgressTracker } from "@/components/progress-tracker";
import { Application } from "@/lib/types";

/** Highest class per certificate type (user cannot start new app for this type if already at highest). */
const HIGHEST_CLASS_BY_TYPE: Record<string, string> = {
  electrical: "E1",
  building: "D1K1",
  plumbing: "G1",
};

function getLatestAppByType(apps: Application[], type: "electrical" | "building" | "plumbing"): Application | null {
  const normalized = type === "building"
    ? apps.filter((a) => a.certificate_type === "building" || a.certificate_type === "civil")
    : apps.filter((a) => a.certificate_type === type);
  if (normalized.length === 0) return null;
  const sorted = [...normalized].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  return sorted[0] ?? null;
}

function isAtHighestClass(type: "electrical" | "building" | "plumbing", certificateClass: string | undefined): boolean {
  const highest = HIGHEST_CLASS_BY_TYPE[type];
  if (!highest || !certificateClass) return false;
  return (certificateClass || "").trim().toUpperCase() === highest.trim().toUpperCase();
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, applications, fetchApplications, createApplication, loading, error, getCompletionPercentage, userToken } = useApplication();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  
  // New Application Modal State
  const [isNewAppModalOpen, setIsNewAppModalOpen] = useState(false);
  const [newAppType, setNewAppType] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const [reusableApplications, setReusableApplications] = useState<Application[]>([]);
  /** When reusable apps exist: null = not yet chosen, 'fresh' = start fresh, number = reuse from that app id */
  const [reuseChoice, setReuseChoice] = useState<null | "fresh" | string>(null);
  const [loadingReusable, setLoadingReusable] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth");
    } else {
      fetchApplications();
    }
  }, [isAuthenticated, router]); // Removed fetchApplications from deps to prevent loops

  // Handle URL ?id= — application ID to focus (e.g. after payment). Do not run when new-app modal is open so user can finish choosing reuse/fresh.
  useEffect(() => {
    if (isNewAppModalOpen) return;
    const idParam = searchParams.get("id");
    if (idParam && applications.length > 0) {
        const id = idParam;
        if (id) {
          setSelectedApplicationId(id);
        }
    }
  }, [searchParams, applications, isNewAppModalOpen]);

  // Applications that are started or in progress (for progress bars: one bar per such application)
  const applicationsWithProgress = [...applications]
    .filter(app => ["draft", "pending_payment", "submitted", "in_review", "approved"].includes(app.status))
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  const handleCardClick = (appId: string) => {
    setSelectedApplicationId(appId);
  };

  const handleApplicationChange = (appId: string | null) => {
    setSelectedApplicationId(appId);
  };

  const handleSubmitApplication = () => {
    if (!selectedApp) return;
    router.push(`/dashboard/company?id=${selectedApp.id}`);
  };

  // Fetch reusable applications when modal opens
  useEffect(() => {
    if (isNewAppModalOpen && userToken) {
      setLoadingReusable(true);
      applicationsApi.getReusable(userToken)
        .then(setReusableApplications)
        .catch((err) => {
          console.error("Failed to fetch reusable applications:", err);
          setReusableApplications([]);
        })
        .finally(() => setLoadingReusable(false));
    }
  }, [isNewAppModalOpen, userToken]);

  // Require explicit reuse choice when previous applications exist; reset when certificate type changes
  useEffect(() => {
    setReuseChoice(null);
  }, [newAppType]);

  const handleCreateApplication = async () => {
    if (!newAppType) {
        toast.error("Please select a certificate type.");
        return;
    }
    
    setIsCreating(true);
    try {
        const newApp = await createApplication({
            certificate_type: newAppType as Application["certificate_type"],
            description: `New ${newAppType} application` 
        });
        
        // If user chose to reuse data, clone it
        const sourceAppId = reuseChoice !== null && reuseChoice !== "fresh" ? reuseChoice : null;
        if (sourceAppId && userToken) {
          try {
            await applicationsApi.cloneData(newApp.id, sourceAppId, userToken);
            toast.success("Application created with data from previous application!");
            await fetchApplications();
            router.push(`/dashboard/review?id=${newApp.id}`);
          } catch (cloneErr: any) {
            console.error("Failed to clone data:", cloneErr);
            toast.warning("Application created, but failed to copy data. You can fill it manually.");
            setSelectedApplicationId(newApp.id);
          }
        } else {
          toast.success("Application created successfully!");
          setSelectedApplicationId(newApp.id);
        }
        
        setIsNewAppModalOpen(false);
        setNewAppType("");
        setReuseChoice(null);
    } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        const errorMessage = error.message || "Failed to create application";
        
        if (errorMessage.includes("already have an active application")) {
            toast.warning("Active Application Found", {
                description: `You already have an active application for this certificate type. Please complete that one first.`,
                duration: 5000,
            });
        } else if (errorMessage.includes("already have the highest class")) {
            toast.warning("Highest class already", {
                description: errorMessage,
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
  
  // Find all applications pending payment (company done = step 4, payment next)
  const pendingPaymentApps = applications.filter(app =>
    app.status === "pending_payment" ||
    (app.status === "draft" && app.current_step === 4)
  );
  const [currentPaymentIndex, setCurrentPaymentIndex] = useState(0);

  const nextPayment = () => {
    setCurrentPaymentIndex((prev) => (prev + 1) % pendingPaymentApps.length);
  };

  const prevPayment = () => {
    setCurrentPaymentIndex((prev) => (prev - 1 + pendingPaymentApps.length) % pendingPaymentApps.length);
  };

  // State for Progress Circular Carousel
  const [currentProgressIndex, setCurrentProgressIndex] = useState(0);
  const progressApplications = [...applications]
    .filter(app => ["draft", "submitted", "pending_payment", "in_review", "approved"].includes(app.status))
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  const nextProgress = () => {
    setCurrentProgressIndex((prev) => (prev + 1) % progressApplications.length);
  };

  const prevProgress = () => {
    setCurrentProgressIndex((prev) => (prev - 1 + progressApplications.length) % progressApplications.length);
  };

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

  // Show active, approved, and rejected applications in the main list (rejected so user can Reapply)
  const activeAppsList = visibleApplications.filter(app => ["draft", "submitted", "pending_payment", "in_review", "approved", "suspended", "rejected"].includes(app.status));

  // Determine if we should show the "New Application" button
  // Rule: If applicant has applied for all 3 types (Building, Electrical, Plumbing), hide the button.
  // Note: Civil is usually part of Building in this system.
  const uniqueTypesApplied = new Set(visibleApplications.map(app => app.certificate_type)).size;
  const canApplyMore = uniqueTypesApplied < 3; // Building, Electrical, Plumbing

  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-900 relative">
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
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            {!selectedApplicationId ? (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6 sm:space-y-8"
              >
                {/* Action Bar */}
                {canApplyMore && (
                    <div className="flex justify-end mb-4" data-tutorial="tutorial-apply">
                        <Button 
                            onClick={() => setIsNewAppModalOpen(true)}
                            className="bg-[#033783] hover:bg-[#022555] text-white flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            New Application
                        </Button>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
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

                {/* Application Cards - only show a card for each type the user has applied for (no "Apply" card for types not applied) */}
                <div className="space-y-4 w-full max-w-full">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Applications</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 w-full max-w-full">
                        {(["building", "electrical", "plumbing"] as const)
                            .map((type) => ({ type, latest: getLatestAppByType(visibleApplications, type) }))
                            .filter(({ latest }) => latest != null)
                            .map(({ type, latest }) => (
                                <div key={type} className="w-full min-w-0 max-w-full">
                                    <ApplicationCard
                                        application={latest!}
                                        certificateType={type}
                                        onClick={() => handleCardClick(latest!.id)}
                                    />
                                </div>
                            ))}
                    </div>
                </div>

                {visibleApplications.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <p>No applications yet.</p>
                        <p className="text-sm">{`Click "New Application" to get started.`}</p>
                    </div>
                )}

                {/* Dynamic Progress Trackers - one bar per application that is started or in progress */}
                {applicationsWithProgress.length > 0 && (
                    <div className="mt-12 mb-8 space-y-8">
                        {applicationsWithProgress.map(app => (
                            <div key={app.id} className="p-6 bg-white dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                <div className="min-w-[600px]">
                                    <ProgressTracker application={app} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Bottom Section - Responsive Stacking */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-12">
                  {/* Sliding Application Process Status */}
                  <div className="rounded-lg border bg-white p-6 dark:bg-gray-950 shadow-sm h-full flex flex-col items-center justify-center relative group">
                    <h3 className="mb-4 text-center text-lg font-semibold">
                      Application Process Status
                    </h3>
                    
                    {progressApplications.length > 0 ? (
                        <div className="w-full flex flex-col items-center">
                            <AnimatePresence mode="wait">
                                <motion.div 
                                    key={progressApplications[currentProgressIndex]?.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="flex flex-col items-center"
                                >
                                    <div className="flex justify-center items-center h-[200px] relative">
                                        <svg className="h-40 w-40 sm:h-48 sm:w-48" viewBox="0 0 200 200">
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
                                            strokeDashoffset={502 * (1 - (getCompletionPercentage(progressApplications[currentProgressIndex]?.id) / 100))}
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
                                            {getCompletionPercentage(progressApplications[currentProgressIndex]?.id)}%
                                            </text>
                                        </svg>
                                    </div>
                                    <div className="mt-2 text-center">
                                        <p className="text-sm font-bold text-[#033783] dark:text-blue-400 capitalize">
                                            {progressApplications[currentProgressIndex]?.certificate_type.replace("-", " ")}
                                        </p>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                                            {formatApplicationId(progressApplications[currentProgressIndex]?.id, progressApplications[currentProgressIndex]?.created_at)}
                                        </p>
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {/* Controls for Multiple Progress Circles */}
                            {progressApplications.length > 1 && (
                                <div className="flex items-center gap-4 mt-6">
                                    <Button variant="ghost" size="icon" onClick={prevProgress} className="h-8 w-8 rounded-full">
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <div className="flex gap-1">
                                        {progressApplications.map((_, idx) => (
                                            <div 
                                                key={idx} 
                                                className={`h-1 rounded-full transition-all ${idx === currentProgressIndex ? 'w-4 bg-[#033783]' : 'w-1 bg-gray-300'}`}
                                            />
                                        ))}
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={nextProgress} className="h-8 w-8 rounded-full">
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-[200px] flex items-center justify-center text-gray-400">
                            No active progress
                        </div>
                    )}
                  </div>

                  {/* Enhanced Pending Payment Card (Dynamic & Responsive) */}
                  {pendingPaymentApps.length > 0 ? (
                      <div className="relative rounded-2xl border bg-[#033783] p-6 sm:p-8 text-white shadow-xl flex flex-col justify-between overflow-hidden min-h-[320px]">
                        
                        <div className="flex items-center gap-4 mb-6 z-10">
                            <div className="bg-white/20 rounded-xl p-2.5 text-yellow-400">
                                <Activity className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl sm:text-2xl font-bold">
                                {pendingPaymentApps[currentPaymentIndex].status === 'draft' ? 'Continue Setup' : 'Payment Due'}
                            </h3>
                            {pendingPaymentApps.length > 1 && (
                                <span className="ml-auto text-xs font-bold bg-white/10 px-3 py-1 rounded-full border border-white/10">
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
                                className="space-y-4 mb-8 z-10 flex-1"
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-blue-200 uppercase font-bold tracking-wider mb-1">Service Type</p>
                                        <p className="text-base sm:text-lg font-medium capitalize truncate">{pendingPaymentApps[currentPaymentIndex].certificate_type.replace("-", " ")}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-blue-200 uppercase font-bold tracking-wider mb-1">Application ID</p>
                                        <p className="text-base sm:text-lg font-mono truncate">{formatApplicationId(pendingPaymentApps[currentPaymentIndex].id, pendingPaymentApps[currentPaymentIndex].created_at)}</p>
                                    </div>
                                </div>
                                {pendingPaymentApps[currentPaymentIndex].certificate_class && (
                                    <div>
                                        <p className="text-xs text-blue-200 uppercase font-bold tracking-wider mb-1">Class</p>
                                        <p className="text-base font-medium">{pendingPaymentApps[currentPaymentIndex].certificate_class}</p>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        <div className="space-y-4 z-10 mt-auto">
                            <Button 
                                className="w-full bg-white hover:bg-blue-50 text-[#033783] font-bold py-6 text-lg rounded-xl shadow-lg transition-all active:scale-[0.98]"
                                onClick={() => {
                                    const app = pendingPaymentApps[currentPaymentIndex];
                                    router.push(`/dashboard/payment?id=${app.id}`);
                                }}
                            >
                                Pay Now
                            </Button>
                            
                            {pendingPaymentApps.length > 1 && (
                                <div className="flex justify-between items-center px-1">
                                    <Button variant="ghost" size="icon" onClick={prevPayment} className="h-10 w-10 rounded-full hover:bg-white/10 text-white">
                                        <ChevronLeft className="h-5 w-5" />
                                    </Button>
                                    <div className="flex gap-1.5">
                                        {pendingPaymentApps.map((_, idx) => (
                                            <div 
                                                key={idx} 
                                                className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentPaymentIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/30'}`}
                                            />
                                        ))}
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={nextPayment} className="h-10 w-10 rounded-full hover:bg-white/10 text-white">
                                        <ChevronRight className="h-5 w-5" />
                                    </Button>
                                </div>
                            )}
                        </div>
                      </div>
                  ) : (
                      <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 dark:bg-gray-900/20 p-8 flex items-center justify-center text-gray-400 h-full">
                          <p className="font-medium">No actions pending</p>
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
                    onSubmitApplication={() => handleSubmitApplication()}
                    upgradeFromClass={searchParams.get("upgradeFrom")}
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
                className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl overflow-hidden border border-gray-200 dark:border-gray-800"
            >
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Start New Application</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">Select the type of classification certificate you wish to apply for.</p>
                    
                    {/* Certificate Type Selection Cards - disable type when user already has highest class */}
                    {(() => {
                        const electricalDisabled = (() => { const a = getLatestAppByType(applications, "electrical"); return a ? isAtHighestClass("electrical", a.certificate_class) : false; })();
                        const buildingDisabled = (() => { const a = getLatestAppByType(applications, "building"); return a ? isAtHighestClass("building", a.certificate_class) : false; })();
                        const plumbingDisabled = (() => { const a = getLatestAppByType(applications, "plumbing"); return a ? isAtHighestClass("plumbing", a.certificate_class) : false; })();
                        return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {/* Electrical Works */}
                        <button
                            type="button"
                            onClick={() => !electricalDisabled && setNewAppType("electrical")}
                            disabled={electricalDisabled}
                            title={electricalDisabled ? "You already have the highest class for Electrical Works." : undefined}
                            className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                                electricalDisabled ? "border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 cursor-not-allowed opacity-60" :
                                newAppType === "electrical"
                                    ? "border-[#033783] bg-blue-50 dark:bg-blue-900/20 shadow-md"
                                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800"
                            }`}
                        >
                            {newAppType === "electrical" && !electricalDisabled && (
                                <div className="absolute top-2 right-2">
                                    <div className="h-6 w-6 rounded-full bg-[#033783] flex items-center justify-center">
                                        <Check className="h-4 w-4 text-white" />
                                    </div>
                                </div>
                            )}
                            <div className="space-y-2">
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Electrical Works</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{electricalDisabled ? "Highest class already" : "Category E"}</p>
                            </div>
                        </button>

                        {/* Building & Civil Works */}
                        <button
                            type="button"
                            onClick={() => !buildingDisabled && setNewAppType("building")}
                            disabled={buildingDisabled}
                            title={buildingDisabled ? "You already have the highest class for Building & Civil Works." : undefined}
                            className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                                buildingDisabled ? "border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 cursor-not-allowed opacity-60" :
                                newAppType === "building"
                                    ? "border-[#033783] bg-blue-50 dark:bg-blue-900/20 shadow-md"
                                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800"
                            }`}
                        >
                            {newAppType === "building" && !buildingDisabled && (
                                <div className="absolute top-2 right-2">
                                    <div className="h-6 w-6 rounded-full bg-[#033783] flex items-center justify-center">
                                        <Check className="h-4 w-4 text-white" />
                                    </div>
                                </div>
                            )}
                            <div className="space-y-2">
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Building & Civil Works</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{buildingDisabled ? "Highest class already" : "Category DK"}</p>
                            </div>
                        </button>

                        {/* Plumbing Works */}
                        <button
                            type="button"
                            onClick={() => !plumbingDisabled && setNewAppType("plumbing")}
                            disabled={plumbingDisabled}
                            title={plumbingDisabled ? "You already have the highest class for Plumbing Works." : undefined}
                            className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                                plumbingDisabled ? "border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 cursor-not-allowed opacity-60" :
                                newAppType === "plumbing"
                                    ? "border-[#033783] bg-blue-50 dark:bg-blue-900/20 shadow-md"
                                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800"
                            }`}
                        >
                            {newAppType === "plumbing" && !plumbingDisabled && (
                                <div className="absolute top-2 right-2">
                                    <div className="h-6 w-6 rounded-full bg-[#033783] flex items-center justify-center">
                                        <Check className="h-4 w-4 text-white" />
                                    </div>
                                </div>
                            )}
                            <div className="space-y-2">
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Plumbing Works</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{plumbingDisabled ? "Highest class already" : "Category G"}</p>
                            </div>
                        </button>
                    </div>
                        );
                    })()}

                    {/* Reuse Data Option - require explicit choice before proceeding */}
                    {reusableApplications.length > 0 && newAppType && (
                        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                                Reuse Data from Previous Application
                            </h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                                Choose one option below before continuing. You can reuse company information, directors, and documents from a previous application to skip filling the form.
                            </p>
                            {loadingReusable ? (
                                <p className="text-sm text-gray-500">Loading previous applications...</p>
                            ) : (
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="reuseOption"
                                            checked={reuseChoice === "fresh"}
                                            onChange={() => setReuseChoice("fresh")}
                                            className="w-4 h-4 text-[#033783]"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Start fresh (fill all information)</span>
                                    </label>
                                    {reusableApplications.map((app) => (
                                        <label key={app.id} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="reuseOption"
                                                checked={reuseChoice === app.id}
                                                onChange={() => setReuseChoice(app.id)}
                                                className="w-4 h-4 text-[#033783]"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                                Reuse from {app.certificate_type} application 
                                                {app.company_name && ` (${app.company_name})`}
                                            </span>
                                        </label>
                                    ))}
                                    {reuseChoice === null && (
                                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                                            Please select an option above to continue.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 mt-6">
                        <Button 
                            variant="outline" 
                            onClick={() => {
                                setIsNewAppModalOpen(false);
                                setNewAppType("");
                                setReuseChoice(null);
                            }}
                            disabled={isCreating}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleCreateApplication}
                            disabled={
                              !newAppType ||
                              isCreating ||
                              Boolean(reusableApplications.length > 0 && newAppType && reuseChoice === null)
                            }
                            className="bg-[#033783] text-white hover:bg-[#022555]"
                        >
                            {isCreating
                              ? "Creating..."
                              : (reuseChoice !== null && reuseChoice !== "fresh")
                                ? "Create & Reuse Data"
                                : "Start Application"}
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