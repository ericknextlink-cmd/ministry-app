"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { ApplicationCard, ApplicationType } from "@/components/application-card";
import { ApplicationDetails } from "@/components/application-details";
import { Activity } from "lucide-react";

const applications: ApplicationType[] = [
  {
    id: "general-building",
    name: "General Building & Civil Works",
    status: "approved",
    shape: "/green-shape.svg",
    color: "#7CB342",
  },
  {
    id: "electrical",
    name: "Electrical Works",
    status: "in-progress",
    shape: "/red-shape.svg",
    color: "#E53935",
  },
  {
    id: "plumbing",
    name: "Plumbing Works",
    status: "not-started",
    shape: "/blue-shape.svg",
    color: "#1E88E5",
  },
];

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<string | null>(null);

  const handleCardClick = (appId: string) => {
    setSelectedApplication(appId);
  };

  const handleApplicationChange = (appId: string) => {
    setSelectedApplication(appId);
  };

  const selectedApp = applications.find((app) => app.id === selectedApplication);

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-900">
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
            {!selectedApplication ? (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3 scale-[0.8] md:scale-[0.8] lg:scale-[0.95]">
                  <StatCard
                    label="Applications"
                    value="3"
                  />
                  <StatCard
                    label="In progress"
                    value="1"
                  />
                  <StatCard
                    label="Applied"
                    value="1"
                  />
                </div>

                {/* Application Cards */}
                <div className="grid grid-cols-3 gap-2 md:gap-4 lg:gap-6">
                  {applications.map((app) => (
                    <div key={app.id} className="scale-[0.8] md:scale-[0.8] lg:scale-[0.9] xl:scale-100">
                      <ApplicationCard
                        application={app}
                        onClick={() => handleCardClick(app.id)}
                      />
                    </div>
                  ))}
                </div>

                {/* Progress Tracker */}
                <div className="mt-18">
                  <div className="relative">
                    {/* Progress Line */}
                    <div className="absolute -left-12 right-0 top-1/2 h-1 -translate-y-1/2 bg-gray-300 dark:bg-gray-700 w-[80%] mx-auto" />

                    {/* Progress Steps */}
                    <div className="relative flex justify-evenly">
                      {[
                        { label: "Apply", icon: "/apply.png" },
                        { label: "Select Class", icon: "/select.png" },
                        { label: "Make Payment", icon: "/payment.png" },
                        { label: "Company Information", icon: "/company.png" },
                        { label: "Director(s) Information", icon: "/directors-white.png" },
                        { label: "Upload Documents", icon: "/upload-white.png" },
                      ].map((step, index) => (
                        <div
                          key={index}
                          className="flex flex-col items-center gap-2"
                        >
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-400 text-white shadow-lg dark:bg-gray-600 relative top-2">
                            <div className="relative h-6 w-6">
                              <Image
                                src={step.icon}
                                alt={step.label}
                                fill
                                className="object-contain"
                              />
                            </div>
                          </div>
                          <span className="text-center text-xs font-medium text-gray-700 dark:text-gray-300 md:text-sm relative top-2">
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Section */}
                <div className="grid gap-6 md:grid-cols-2 mt-20">
                  {/* Application Process Status */}
                  <div className="rounded-lg border bg-white p-6 dark:bg-gray-950">
                    <h3 className="mb-4 text-center text-lg font-semibold">
                      Application Process Status
                    </h3>
                    <div className="flex justify-center">
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
                          strokeDashoffset="421"
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
                          16%
                        </text>
                      </svg>
                    </div>
                  </div>

                  {/* Pending Payment */}
                  <div className="rounded-lg border bg-black p-6 text-white w-[55%] h-[80%] relative lg:left-30 md:left-20 left-0">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="relative top-1 lg:-top-4 md:-top-1 bg-white rounded-full p-2 scale-[0.7] lg:scale-[0.7] md:scale-[0.6] left-0 lg:-left-4 md:left-0">
                        <Activity className="h-8 w-8 text-yellow-400" />
                      </div>
                      <div className="relative top-1 lg:-top-4 md:-top-1 left-0 lg:-left-4 md:left-0">
                        <h3 className="text-xl text-nowrap font-semibold">Pending Payment</h3>
                      </div>
                    </div>
                    <div className="mb-6 space-y-2 text-gray-200 text-nowrap relative -top-6">
                      <p className="text-base">Electrical Works Certification</p>
                      <p className="text-sm text-nowrap text-gray-400">Application ID: MOH/EL/2025/00215</p>
                      <p className="text-sm text-nowrap text-gray-400">Certification Fee: GHS 350.00</p>
                    </div>
                    <button className="w-full rounded-md bg-[#0062FF] px-4 py-3 font-medium text-white hover:bg-blue-700 relative -top-8">
                      Pay GHS 1500 Now
                    </button>
                  </div>
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
                    applications={applications}
                    onApplicationChange={handleApplicationChange}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
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

