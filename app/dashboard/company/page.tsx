"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApplication } from "@/contexts/ApplicationContext";
import { CompanyInfoForm } from "@/components/company-info-form";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard-sidebar";

export default function CompanyInfoPage() {
  const router = useRouter();
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

  console.log("CompanyInfoPage Debug:", { loading, applicationsCount: applications.length, apps: applications });

  // Find the active application that needs company info
  // Logic: Most recent one that is not 'draft' (passed step 1 & 2)
  // Sort by created_at desc to get latest first
  const activeApplication = [...applications]
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
                 <CompanyInfoForm 
                    application={activeApplication} 
                    onSuccess={() => router.push("/dashboard/directors")} // Next step
                 />
             ) : (
                 <div className="text-center p-12 bg-white rounded-lg shadow dark:bg-gray-800">
                     <h2 className="text-xl font-semibold mb-2">No Active Application Found</h2>
                     <p className="text-gray-500">Please start an application from the dashboard first.</p>
                     
                     <div className="mt-4 text-xs text-left bg-gray-100 p-4 rounded text-black dark:text-black">
                         <p className="font-bold">Debug Info:</p>
                         <p>Total Apps: {applications.length}</p>
                         <ul className="list-disc pl-4">
                             {applications.map(app => (
                                 <li key={app.id}>ID: {app.id}, Status: {app.status}, Type: {app.certificate_type}, Step: {app.current_step}</li>
                             ))}
                         </ul>
                     </div>

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