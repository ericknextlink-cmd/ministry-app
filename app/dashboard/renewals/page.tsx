"use client";

import { useEffect, useState } from "react";
import { useApplication } from "@/contexts/ApplicationContext";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { ApplicationCard } from "@/components/application-card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function RenewalsPage() {
  const { applications, isAuthenticated, fetchApplications } = useApplication();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth");
    } else {
        fetchApplications();
    }
  }, [isAuthenticated, router, fetchApplications]);

  // Filter for Expired Applications
  const expiredApplications = applications.filter(app => {
      if (app.status !== "approved") return false;
      if (!app.expiry_date) return false;
      return new Date(app.expiry_date) < new Date();
  });

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-900 relative">
      <DashboardSidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className={`flex flex-1 flex-col overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Certificate Renewals</h1>
            
            <AnimatePresence>
                {expiredApplications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                        <p className="text-lg">No certificates currently require renewal.</p>
                        <p className="text-sm mt-2">Certificates only appear here when they have expired.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {expiredApplications.map((app) => (
                            <ApplicationCard
                                key={app.id}
                                application={app}
                                onClick={() => {}} // No detail view needed for expired specifically, or could open details
                            />
                        ))}
                    </div>
                )}
            </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
