"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function CompanyInformationPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const [formData, setFormData] = useState({
    companyName: "",
    formOfBusiness: "",
    region: "",
    city: "",
    district: "",
    gpsAddress: "",
    smsNotificationNumber: "",
    postalAddress: "",
    streetName: "",
    emailAddress: "",
    companyTIN: "",
    companyRegistrationNumber: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Company information saved!");
    router.push("/dashboard/directors");
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
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
              Company Information
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Left Column */}
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => handleInputChange("companyName", e.target.value)}
                      className="h-12"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="formOfBusiness">Form of Business</Label>
                    <Select
                      value={formData.formOfBusiness}
                      onValueChange={(value) => handleInputChange("formOfBusiness", value)}
                    >
                      <SelectTrigger className="h-12 w-full">
                        <SelectValue placeholder="Select form of business" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sole-proprietorship">Sole Proprietorship</SelectItem>
                        <SelectItem value="partnership">Partnership</SelectItem>
                        <SelectItem value="llc">Limited Liability Company</SelectItem>
                        <SelectItem value="corporation">Corporation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="region">Region</Label>
                    <Select
                      value={formData.region}
                      onValueChange={(value) => handleInputChange("region", value)}
                    >
                      <SelectTrigger className="h-12 w-full">
                        <SelectValue placeholder="Select region" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="greater-accra">Greater Accra</SelectItem>
                        <SelectItem value="ashanti">Ashanti</SelectItem>
                        <SelectItem value="eastern">Eastern</SelectItem>
                        <SelectItem value="western">Western</SelectItem>
                        <SelectItem value="northern">Northern</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      className="h-12"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="district">District</Label>
                    <Input
                      id="district"
                      value={formData.district}
                      onChange={(e) => handleInputChange("district", e.target.value)}
                      className="h-12"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="gpsAddress">GPS Address</Label>
                    <Input
                      id="gpsAddress"
                      value={formData.gpsAddress}
                      onChange={(e) => handleInputChange("gpsAddress", e.target.value)}
                      className="h-12"
                      required
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="smsNotificationNumber">SMS Notification Number</Label>
                    <Input
                      id="smsNotificationNumber"
                      type="tel"
                      value={formData.smsNotificationNumber}
                      onChange={(e) => handleInputChange("smsNotificationNumber", e.target.value)}
                      className="h-12"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="postalAddress">Postal Address</Label>
                    <Input
                      id="postalAddress"
                      value={formData.postalAddress}
                      onChange={(e) => handleInputChange("postalAddress", e.target.value)}
                      className="h-12"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="streetName">Street Name</Label>
                    <Input
                      id="streetName"
                      value={formData.streetName}
                      onChange={(e) => handleInputChange("streetName", e.target.value)}
                      className="h-12"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="emailAddress">Email Address</Label>
                    <Input
                      id="emailAddress"
                      type="email"
                      value={formData.emailAddress}
                      onChange={(e) => handleInputChange("emailAddress", e.target.value)}
                      className="h-12"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="companyTIN">Company TIN</Label>
                    <Input
                      id="companyTIN"
                      value={formData.companyTIN}
                      onChange={(e) => handleInputChange("companyTIN", e.target.value)}
                      className="h-12"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="companyRegistrationNumber">Company Registration Number</Label>
                    <Input
                      id="companyRegistrationNumber"
                      value={formData.companyRegistrationNumber}
                      onChange={(e) => handleInputChange("companyRegistrationNumber", e.target.value)}
                      className="h-12"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="px-8"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  className="rounded-full bg-blue-600 px-12 text-white hover:bg-blue-700"
                >
                  Next: Directors Information
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

