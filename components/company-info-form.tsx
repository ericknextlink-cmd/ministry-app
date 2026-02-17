"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // Assuming Textarea component exists
import { useApplication } from "@/contexts/ApplicationContext";
import { toast } from "sonner";
import { Application } from "@/lib/types";

interface CompanyInfoFormProps {
  application: Application;
  onSuccess: () => void;
}

export function CompanyInfoForm({ application, onSuccess }: CompanyInfoFormProps) {
  const { user, saveCompanyInfo, updateApplication, getLatestCompanyInfo } = useApplication();
  const [loading, setLoading] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(true);
  const [prefillDone, setPrefillDone] = useState(false);
  const toastShown = useRef(false);

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
      const prefill = async () => {
          if (prefillDone) return;
          setPrefillLoading(true);
          try {
              // 1) Prefer previous application's company info (so returning users keep their last details)
              const latest = await getLatestCompanyInfo();
              const fromUser = {
                  company_name: user?.full_name ?? "",
                  registration_number: user?.company_registration_number ?? "",
                  phone_number: user?.phone_number ?? "",
                  email: user?.email ?? "",
              };
              if (latest) {
                  setFormData({
                      company_name: latest.company_name?.trim() || fromUser.company_name,
                      registration_number: latest.registration_number?.trim() || fromUser.registration_number,
                      address: latest.address ?? "",
                      city: latest.city ?? "",
                      country: latest.country || "Ghana",
                      phone_number: latest.phone_number?.trim() || fromUser.phone_number,
                      email: latest.email?.trim() || fromUser.email,
                  });
                  if (latest.company_name && !toastShown.current) {
                      toast.info("We found your previous company details and pre-filled the form.");
                      toastShown.current = true;
                  }
                  setPrefillDone(true);
                  return;
              }
              if (fromUser.company_name || fromUser.registration_number || fromUser.phone_number || fromUser.email) {
                  setFormData((prev) => ({
                      ...prev,
                      company_name: prev.company_name || fromUser.company_name,
                      registration_number: prev.registration_number || fromUser.registration_number,
                      phone_number: prev.phone_number || fromUser.phone_number,
                      email: prev.email || fromUser.email,
                      country: prev.country || "Ghana",
                  }));
              }
              setPrefillDone(true);
          } finally {
              setPrefillLoading(false);
          }
      };
      prefill();
  }, [getLatestCompanyInfo, user, prefillDone]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Save Company Info
      await saveCompanyInfo(application.id, formData);
      
      // 2. Update Application Step/Status — next step is Payment
      await updateApplication(application.id, {
          current_step: 4, // 4 = Payment (company before payment)
          status: "draft"
      });

      toast.success("Company information saved! Proceed to payment.");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to save company information");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formDisabled = prefillLoading || loading;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 relative"
    >
      {prefillLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#033783] border-t-transparent" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Loading your details...</p>
          </div>
        </div>
      )}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Company Information</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {formData.company_name && (user?.full_name || user?.company_registration_number)
            ? "Pre-filled from your registration. Add or update address and city as needed."
            : "Please provide the official details of your company."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="company_name">Company Name</Label>
            <Input
              id="company_name"
              name="company_name"
              placeholder="Enter official company name"
              value={formData.company_name}
              onChange={handleChange}
              required
              disabled={formDisabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="registration_number">Registration Number</Label>
            <Input
              id="registration_number"
              name="registration_number"
              placeholder="e.g. CS12345678"
              value={formData.registration_number}
              onChange={handleChange}
              required
              disabled={formDisabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone_number">Phone Number</Label>
            <Input
              id="phone_number"
              name="phone_number"
              placeholder="+233..."
              value={formData.phone_number}
              onChange={handleChange}
              required
              disabled={formDisabled}
            />
          </div>
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
              disabled={formDisabled}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              placeholder="Street address, P.O. Box..."
              value={formData.address}
              onChange={handleChange}
              required
              disabled={formDisabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              name="city"
              placeholder="Accra"
              value={formData.city}
              onChange={handleChange}
              required
              disabled={formDisabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              name="country"
              placeholder="Ghana"
              value={formData.country}
              onChange={handleChange}
              required
              disabled={formDisabled}
            />
          </div>
        </div>

        <div className="flex justify-end pt-6">
          <Button
            type="submit"
            className="bg-[#033783] text-white hover:bg-[#022555] px-8"
            disabled={formDisabled}
          >
            {loading ? "Saving..." : "Save & Continue"}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
