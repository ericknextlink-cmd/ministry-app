"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // Assuming Textarea component exists
import { useApplication } from "@/contexts/ApplicationContext";
import { toast } from "sonner";
import { ApplicationType } from "./application-card";

interface CompanyInfoFormProps {
  application: ApplicationType;
  onSuccess: () => void;
}

export function CompanyInfoForm({ application, onSuccess }: CompanyInfoFormProps) {
  const { saveCompanyInfo, updateApplication, getLatestCompanyInfo } = useApplication();
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    company_name: "",
    registration_number: "",
    address: "",
    city: "",
    country: "Ghana",
    phone_number: "",
    email: "",
  });

  useEffect(() => {
      // Check if we should pre-fill
      const prefill = async () => {
          // Only if this is a fresh application (no data yet)
          // We can check if formData is empty, but better is to rely on user intent or just auto-fill if empty.
          // Since we mount this component, we can try fetching current app's info first (maybe user saved partial).
          // If that is empty, try fetch latest.
          
          // Actually, let's just try fetching latest if the local state is empty.
          if (!formData.company_name) {
              const latest = await getLatestCompanyInfo();
              if (latest) {
                  setFormData({
                      company_name: latest.company_name || "",
                      registration_number: latest.registration_number || "",
                      address: latest.address || "",
                      city: latest.city || "",
                      country: latest.country || "Ghana",
                      phone_number: latest.phone_number || "",
                      email: latest.email || "",
                  });
                  toast.info("We found your previous company details and pre-filled the form.");
              }
          }
      };
      prefill();
  }, [getLatestCompanyInfo]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Save Company Info
      await saveCompanyInfo(application.id, {
          ...formData,
          application_id: application.id
      });
      
      // 2. Update Application Step/Status
      // Move to next step (Director Info)
      await updateApplication(application.id, {
          current_step: 5, // 5 = Directors Info
          status: "draft" 
      });

      toast.success("Company information saved!");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to save company information");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800"
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Company Information</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Please provide the official details of your company.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Company Name */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="company_name">Company Name</Label>
            <Input
              id="company_name"
              name="company_name"
              placeholder="Enter official company name"
              value={formData.company_name}
              onChange={handleChange}
              required
            />
          </div>

          {/* Registration Number */}
          <div className="space-y-2">
            <Label htmlFor="registration_number">Registration Number</Label>
            <Input
              id="registration_number"
              name="registration_number"
              placeholder="e.g. CS12345678"
              value={formData.registration_number}
              onChange={handleChange}
              required
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phone_number">Phone Number</Label>
            <Input
              id="phone_number"
              name="phone_number"
              placeholder="+233..."
              value={formData.phone_number}
              onChange={handleChange}
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="email">Company Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="company@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* Address */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input // Using Input instead of Textarea if Textarea is not available, but user can change
              id="address"
              name="address"
              placeholder="Street address, P.O. Box..."
              value={formData.address}
              onChange={handleChange}
              required
            />
          </div>

          {/* City */}
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              name="city"
              placeholder="Accra"
              value={formData.city}
              onChange={handleChange}
              required
            />
          </div>

          {/* Country */}
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              name="country"
              placeholder="Ghana"
              value={formData.country}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="flex justify-end pt-6">
          <Button
            type="submit"
            className="bg-[#033783] text-white hover:bg-[#022555] px-8"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save & Continue"}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
