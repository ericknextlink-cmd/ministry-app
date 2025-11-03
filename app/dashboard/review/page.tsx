"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Edit, CheckCircle2, FileText } from "lucide-react";
import { toast } from "sonner";

export default function ReviewPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Mock data - in production this would come from state/context
  const companyData = {
    businessName: "Nexlink Technologies",
    businessRegistrationNumber: "CS627277828",
    companyTin: "C0004647748",
    emailAddress: "info@nexlink.com",
    mobileNumber: "0265713327",
    address: "P.O Box 225 STC",
    region: "Northern Region",
    district: "Gushegu Municipal",
    gpsAddress: "GN 363-3738",
  };

  const directorData = {
    fullName: "Sam Wheeler",
    tinNumber: "T000123456",
    nationality: "Ghanaian",
    emailAddress: "info@nexlink.com",
    mobileNumber: "0265713327",
    address: "P.O Box 225 STC",
    shares: "500",
  };

  const documents = [
    { name: "Incorporation Certificate", file: "Incorporation.pdf" },
    { name: "Form 3", file: "Form3.pdf" },
    { name: "Ghana Card", file: "Ghanacard.pdf" },
  ];

  const handleEdit = (section: string) => {
    toast.info(`Editing ${section}`);
    // Navigate to appropriate form page
    switch (section) {
      case "Company Information":
        router.push("/dashboard/company");
        break;
      case "Director(s) Information":
        router.push("/dashboard/directors");
        break;
      case "Upload Documents":
        router.push("/dashboard/documents");
        break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConfirmed) {
      toast.error("Please confirm the declaration");
      return;
    }

    toast.success("Application submitted successfully!");
    setTimeout(() => {
      router.push("/dashboard");
    }, 2000);
  };

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

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="mb-8 text-3xl font-bold text-gray-900 dark:text-gray-100">
              Review & Submit
            </h1>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Company Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border bg-white p-6 dark:bg-gray-950"
              >
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Company Information
                  </h2>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit("Company Information")}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Business Name
                      </p>
                      <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        {companyData.businessName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Business Registration Number
                      </p>
                      <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        {companyData.businessRegistrationNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Company TIN
                      </p>
                      <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        {companyData.companyTin}
                      </p>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Email Address
                      </p>
                      <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        {companyData.emailAddress}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Mobile Number
                      </p>
                      <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        {companyData.mobileNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Address
                      </p>
                      <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        {companyData.address}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Region
                      </p>
                      <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        {companyData.region}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        District
                      </p>
                      <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        {companyData.district}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        GPS Address
                      </p>
                      <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        {companyData.gpsAddress}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Director(s) Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-lg border bg-white p-6 dark:bg-gray-950"
              >
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Director(s) Information
                  </h2>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit("Director(s) Information")}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Full Name
                      </p>
                      <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        {directorData.fullName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        TIN Number
                      </p>
                      <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        {directorData.tinNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Nationality
                      </p>
                      <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        {directorData.nationality}
                      </p>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Email Address
                      </p>
                      <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        {directorData.emailAddress}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Mobile Number
                      </p>
                      <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        {directorData.mobileNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Address
                      </p>
                      <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        {directorData.address}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        No. of Shares
                      </p>
                      <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        {directorData.shares}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Upload Documents */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-lg border bg-white p-6 dark:bg-gray-950"
              >
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Upload Documents
                  </h2>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit("Upload Documents")}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </div>

                <div className="space-y-3">
                  {documents.map((doc, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 rounded-md border bg-gray-50 p-4 dark:bg-gray-900"
                    >
                      <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      <a
                        href="#"
                        className="flex-1 text-sm text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {doc.file}
                      </a>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Declaration */}
              <div className="rounded-lg border bg-gray-50 p-6 dark:bg-gray-950">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="declaration"
                    checked={isConfirmed}
                    onCheckedChange={(checked) => setIsConfirmed(checked as boolean)}
                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 mt-1"
                  />
                  <Label
                    htmlFor="declaration"
                    className="cursor-pointer text-base leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I declare that the information provided is true and complete.
                  </Label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6">
                <Button
                  type="submit"
                  size="lg"
                  disabled={!isConfirmed}
                  className="rounded-full bg-blue-600 px-12 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Submit Application
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

