"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardCard } from "@/components/admin/kpi-card";
import { ActivityChart } from "@/components/admin/activity-chart";
import { RecentApplicationsTable } from "@/components/admin/data-table";
import { ProgressBars } from "@/components/admin/progress-bars";
import { activityData, progressData } from "@/lib/admin-data"; // Keep charts for now
import { adminApi } from "@/lib/api";
import { toast } from "sonner";
import { Application } from "@/lib/types"; // Import Application type

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    const loadData = async () => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            router.push("/auth");
            return;
        }

        try {
            const [statsData, appsData] = await Promise.all([
                adminApi.getStats(token),
                adminApi.getApplications(token)
            ]);
            setStats(statsData);
            setApplications(appsData); // appsData is now correctly typed as Application[]
        } catch (error: any) {
            // Don't show error toast for session expiration - it's handled globally
            if (!error.message?.includes("Session expired") && !error.message?.includes("401")) {
            console.error("Failed to load admin data", error);
            toast.error("Failed to load admin data. Are you an admin?");
            }
            // 401 is handled globally, only handle 403 here
            if (error.message?.includes("403")) {
                router.push("/auth");
            }
        } finally {
            setLoading(false);
        }
    };

    loadData();
  }, [router]);

  if (loading) {
      return <div className="p-8 text-center">Loading Admin Dashboard...</div>;
  }

  // Map stats to KPI cards
  const kpiCards = [
      { title: "Total Applications", value: stats?.total_applications || 0, trend: "+12%", bgColor: "bg-blue-500" },
      { title: "Pending Reviews", value: stats?.pending_reviews || 0, trend: "+5%", bgColor: "bg-yellow-500" },
      { title: "Approved", value: stats?.approved_certificates || 0, trend: "+8%", bgColor: "bg-green-500" },
      { title: "Rejected", value: stats?.rejected_applications || 0, trend: "-2%", bgColor: "bg-red-500" },
  ];

  console.log("Admin Stats:", stats); // DEBUG LOG

  // Map type breakdown to Progress Bars
  const total = stats?.total_applications || 1; // Avoid division by zero
  const typeBreakdown = stats?.type_breakdown || {};
  
  const getCount = (key: string) => (typeBreakdown[key] || typeBreakdown[key.toUpperCase()] || typeBreakdown[key.toLowerCase()] || 0);

  console.log("Total Applications:", total);
  console.log("Building Count:", getCount('building'));
  console.log("Electrical Count:", getCount('electrical'));
  console.log("Plumbing Count:", getCount('plumbing'));

  const realProgressData = [
      { 
          title: "General Building & Civil", 
          value: Math.round(((getCount('building') + getCount('civil'))) / total * 100), 
          color: "green" // Use base color name for Tailwind
      },
      { 
          title: "Electrical Works", 
          value: Math.round(getCount('electrical') / total * 100), 
          color: "red" 
      },
      { 
          title: "Plumbing Works", 
          value: Math.round(getCount('plumbing') / total * 100), 
          color: "blue" 
      },
  ];

  return (
    <div className="space-y-8">


      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((data, index) => (
          <DashboardCard key={index} title={data.title} value={data.value.toString()} trend={data.trend} bgColor={data.bgColor} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActivityChart data={activityData} />
        </div>
        <div>
          <ProgressBars data={realProgressData} />
        </div>
      </div>
      <div>
        <RecentApplicationsTable data={applications} />
      </div>
    </div>
  );
}


