"use client";

import { useState } from "react";
import { DashboardCard } from "@/components/admin/kpi-card";
import { ActivityChart } from "@/components/admin/activity-chart";
import { RecentApplicationsTable } from "@/components/admin/data-table";
import { ProgressBars } from "@/components/admin/progress-bars";
import { kpiData, activityData, progressData, applicationsData, KpiData, ApplicationData } from "@/lib/admin-data";

export default function AdminDashboard() {
  const [period, setPeriod] = useState("all-time");
  const [certificateType, setCertificateType] = useState("all");
  const [certificateClass, setCertificateClass] = useState("all");

  const filteredKpiData = kpiData; // TODO: Filter data based on period
  const filteredActivityData = activityData; // TODO: Filter data based on period
  const filteredProgressData = progressData; // TODO: Filter data based on certificate type
  const filteredApplicationsData = applicationsData.filter((app: ApplicationData) => {
    if (certificateType === "all") return true;
    return app.certificateType === certificateType;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center space-y-4 md:space-y-0 md:space-x-4">
        <div>
          <label htmlFor="period" className="block text-xs font-medium text-gray-500 mb-1">
            Period: All-time
          </label>
          <select
            id="period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-full sm:w-40 p-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          >
            <option value="all-time">All-time</option>
            <option value="last-30-days">Last 30 Days</option>
            <option value="last-quarter">Last Quarter</option>
          </select>
        </div>

        <div>
          <label htmlFor="type" className="block text-xs font-medium text-gray-500 mb-1">
            Certificate Type: All
          </label>
          <select
            id="type"
            value={certificateType}
            onChange={(e) => setCertificateType(e.target.value)}
            className="w-full sm:w-40 p-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          >
            <option value="all">All</option>
            <option value="Electrical">Electrical</option>
            <option value="Plumbing">Plumbing</option>
            <option value="Construct & Civil">Civil</option>
          </select>
        </div>

        <div>
          <label htmlFor="class" className="block text-xs font-medium text-gray-500 mb-1">
            Class: All
          </label>
          <select
            id="class"
            value={certificateClass}
            onChange={(e) => setCertificateClass(e.target.value)}
            className="w-full sm:w-40 p-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          >
            <option value="all">All</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {filteredKpiData.map((data: KpiData, index: number) => (
          <DashboardCard key={index} title={data.title} value={data.value} trend={data.trend} bgColor={data.bgColor} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActivityChart data={filteredActivityData} />
        </div>
        <div>
          <ProgressBars data={filteredProgressData} />
        </div>
      </div>
      <div>
        <RecentApplicationsTable data={filteredApplicationsData} />
      </div>
    </div>
  );
}
