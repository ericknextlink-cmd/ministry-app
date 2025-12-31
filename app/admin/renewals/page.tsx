"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";
import { Application } from "@/contexts/ApplicationContext";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Clock, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function AdminRenewalsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [expiringCerts, setExpiringCerts] = useState<Application[]>([]);
  const [renewalRequests, setRenewalRequests] = useState<Application[]>([]);
  const [activeTab, setActiveTab] = useState<"expiring" | "requests">("expiring");

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem("access_token");
    if (!token) {
        router.push("/auth");
        return;
    }

    try {
        const [expiring, allApps] = await Promise.all([
            adminApi.getExpiringCertificates(token, 90), // Get next 90 days
            adminApi.getApplications(token)
        ]);
        
        setExpiringCerts(expiring);
        
        // Filter for active renewal requests
        const activeRenewalStatuses = ["draft", "submitted", "pending_payment", "in_review", "suspended"];
        const renewals = allApps.filter(app => 
            app.description?.startsWith("Renewal of Application") && 
            activeRenewalStatuses.includes(app.status)
        );
        setRenewalRequests(renewals);

    } catch (error: any) {
        console.error("Failed to fetch renewal data", error);
        toast.error("Failed to fetch renewal data.");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Renewals Management</h1>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 rounded-xl bg-gray-100 dark:bg-gray-800 p-1 w-fit">
        <button
          onClick={() => setActiveTab("expiring")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium leading-5 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 ${
            activeTab === "expiring"
              ? "bg-white shadow text-blue-700 dark:bg-gray-700 dark:text-blue-100"
              : "text-gray-600 hover:bg-white/[0.12] hover:text-blue-800 dark:text-gray-400"
          }`}
        >
            <Clock className="h-4 w-4" />
            Expiring Soon (90 Days)
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium leading-5 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 ${
            activeTab === "requests"
              ? "bg-white shadow text-blue-700 dark:bg-gray-700 dark:text-blue-100"
              : "text-gray-600 hover:bg-white/[0.12] hover:text-blue-800 dark:text-gray-400"
          }`}
        >
            <RefreshCw className="h-4 w-4" />
            Active Renewal Applications
        </button>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company / Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {activeTab === "expiring" ? "Expiry Date" : "Submitted Date"}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {(activeTab === "expiring" ? expiringCerts : renewalRequests).length === 0 ? (
                    <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                            {activeTab === "expiring" ? "No certificates expiring soon." : "No active renewal applications found."}
                        </td>
                    </tr>
                ) : (
                    (activeTab === "expiring" ? expiringCerts : renewalRequests).map((app) => (
                        <tr key={app.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">#{app.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {app.description || "No description"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{app.certificate_type}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {activeTab === "expiring" 
                                    ? (app.expiry_date ? format(new Date(app.expiry_date), "MMM d, yyyy") : "-")
                                    : format(new Date(app.created_at), "MMM d, yyyy")
                                }
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                    ${app.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                      'bg-yellow-100 text-yellow-800'}`}>
                                    {app.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <Link href={`/admin/applications/${app.id}`} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200">
                                    View Details
                                </Link>
                            </td>
                        </tr>
                    ))
                )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}
