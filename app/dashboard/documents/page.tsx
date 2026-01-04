"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApplication } from "@/contexts/ApplicationContext";
import { DocumentsForm } from "@/components/documents-form";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard-sidebar";

export default function DocumentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");

  const { isAuthenticated, applications, fetchApplications, loading } = useApplication();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth");
    } else {
      fetchApplications();
    }
  }, [isAuthenticated, router, fetchApplications]);

  // Find active application
  // If ID param is present, find THAT specific app.
  // Otherwise, fallback to the most recent active one.
  const activeApplication = idParam 
    ? applications.find(app => app.id === parseInt(idParam))
    : [...applications]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .find(app => 
          ["draft", "pending_payment", "submitted", "in_review", "suspended"].includes(app.status)
        );

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

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-4xl mx-auto">
             {loading ? (
                 <div className="flex justify-center p-12">Loading...</div>
             ) : activeApplication ? (
                 <DocumentsForm 
                    application={activeApplication} 
                    onSuccess={() => router.push("/dashboard/review")} // Go to final review or success page
                 />
             ) : (
                 <div className="text-center p-12 bg-white rounded-lg shadow dark:bg-gray-800">
                     <h2 className="text-xl font-semibold mb-2">No Active Application Found</h2>
                     <button 
                        onClick={() => router.push("/dashboard")}
                        className="mt-4 text-blue-600 hover:underline"
                     >
                        Go to Dashboard
                     </button>
                 </div>
             )}
          </div>
        </main>
      </div>
    </div>
  );
}