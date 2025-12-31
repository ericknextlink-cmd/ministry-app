"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApplication } from "@/contexts/ApplicationContext";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReviewPage() {
  const router = useRouter();
  const { isAuthenticated, fetchApplications } = useApplication();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth");
    } else {
      fetchApplications(); // Refresh to get updated status
    }
  }, [isAuthenticated, router, fetchApplications]);

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
          <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg text-center border border-gray-100 dark:border-gray-700">
             <div className="flex justify-center mb-6">
                 <div className="h-20 w-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                     <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
                 </div>
             </div>
             <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Application Submitted!</h2>
             <p className="text-gray-500 dark:text-gray-400 mb-8">
                 Your application has been successfully submitted to the Ministry. We will review your documents and get back to you shortly.
             </p>
             <Button 
                onClick={() => router.push("/dashboard")}
                className="w-full bg-[#033783] hover:bg-[#022555] h-12 text-base"
             >
                 Return to Dashboard
             </Button>
          </div>
        </main>
      </div>
    </div>
  );
}