"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ChevronDown, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Application } from "@/lib/types";
import { useApplication } from "@/contexts/ApplicationContext";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { api } from "@/lib/api";
import { getClassesUpgradeTo, isHighestClass, type CertificateType } from "@/lib/certificate-classes";

interface ApplicationDetailsProps {
  application: Application;
  onApplicationChange: (appId: string | null) => void;
  onSubmitApplication: () => void;
  /** When set (e.g. from Upgrade flow), only classes the user can upgrade to are shown. */
  upgradeFromClass?: string | null;
}

// Data mapping for certificate classes and fees
const certificateData = {
  "building": {
    category: "DK",
    classes: [
      { id: "D1K1", label: "D1K1", registration: "¢3500", renewal: "¢2010", financialClass: "Over $500,000", requiresLLC: true },
      { id: "D2K2", label: "D2K2", registration: "¢2500", renewal: "¢410", financialClass: "$200,000 - $500,000", requiresLLC: true },
      { id: "D3K3", label: "D3K3", registration: "¢600", renewal: "¢210", financialClass: "$75,000 - $200,000", requiresLLC: false },
    ],
  },
  "civil": { // Reuse building data for civil for now as they share DK category
    category: "DK",
    classes: [
      { id: "D1K1", label: "D1K1", registration: "¢3500", renewal: "¢2010", financialClass: "Over $500,000", requiresLLC: true },
      { id: "D2K2", label: "D2K2", registration: "¢2500", renewal: "¢410", financialClass: "$200,000 - $500,000", requiresLLC: true },
      { id: "D3K3", label: "D3K3", registration: "¢600", renewal: "¢210", financialClass: "$75,000 - $200,000", requiresLLC: false },
    ],
  },
  "electrical": {
    category: "E",
    classes: [
      { id: "E1", label: "E1", registration: "¢1500", renewal: "¢410", financialClass: "Over $200,000", requiresLLC: false },
      { id: "E2", label: "E2", registration: "¢1000", renewal: "¢210", financialClass: "$75,000 - $200,000", requiresLLC: false },
      { id: "E3", label: "E3", registration: "¢300", renewal: "¢50", financialClass: "Up to $75,000", requiresLLC: false },
    ],
  },
  "plumbing": {
    category: "G",
    classes: [
      { id: "G1", label: "G1", registration: "¢1000", renewal: "¢210", financialClass: "Over $200,000", requiresLLC: false },
      { id: "G2", label: "G2", registration: "¢400", renewal: "¢50", financialClass: "Up to $50,000", requiresLLC: false },
    ],
  },
};

export function ApplicationDetails({
  application,
  onApplicationChange,
  onSubmitApplication,
  upgradeFromClass,
}: ApplicationDetailsProps) {
  const router = useRouter();
  const { updateApplication, cancelApplication, renewApplication, createApplication, fetchApplications, userToken, applications } = useApplication();

  // For upgrade flow: disable the class the user already has for this type (from another application)
  const otherSameType = applications.filter(
    (a) => a.id !== application.id && (a.certificate_type === application.certificate_type || (a.certificate_type === "civil" && application.certificate_type === "building") || (a.certificate_type === "building" && application.certificate_type === "civil"))
  );
  const existingClassToDisable = (() => {
    const withClass = otherSameType.filter((a) => a.certificate_class).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    return withClass[0]?.certificate_class ?? null;
  })();
  
  // Get data for this certificate type
  const certData = certificateData[application.certificate_type as keyof typeof certificateData] || certificateData["building"];
  const certType = application.certificate_type as CertificateType;
  const upgradeClassIds = upgradeFromClass ? getClassesUpgradeTo(certType, upgradeFromClass) : [];
  const classesToShow = upgradeClassIds.length > 0
    ? certData.classes.filter((c) => upgradeClassIds.includes(c.id))
    : certData.classes;
  const effectiveClasses = classesToShow.length > 0 ? classesToShow : certData.classes;
  const defaultClass = effectiveClasses[0]?.id ?? certData.classes[0].id;
  
  // State for class selection
  const [selectedClass, setSelectedClass] = useState(application.certificate_class || defaultClass);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Update selected class if application changes (or upgradeFromClass: use first upgrade class when no class set)
  useEffect(() => {
    if (application.certificate_class) {
      setSelectedClass(application.certificate_class);
    } else {
      setSelectedClass(defaultClass);
    }
  }, [application, certData, defaultClass]);
  
  const handleSubmit = async () => {
    if (isConfirmed) {
      setIsSubmitting(true);
      try {
        await updateApplication(String(application.id), {
            certificate_class: selectedClass,
            status: "draft",
            current_step: 2, // Next step is company info (3), then payment (4)
        });
        toast.success("Class selected. Next: company information.");
        onSubmitApplication();
      } catch (error) {
        toast.error("Failed to update application.");
        console.error(error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleCancelClick = () => {
      setShowCancelDialog(true);
  };

  const handleConfirmCancel = async () => {
      setIsCancelling(true);
      try {
          await cancelApplication(String(application.id));
          toast.success("Application cancelled successfully.");
          onApplicationChange(null);
      } catch (error: any) {
          toast.error(error.message || "Failed to cancel application.");
      } finally {
          setIsCancelling(false);
          setShowCancelDialog(false);
      }
  };

  const handleDownloadCertificate = async () => {
    if (isDownloading) return;
    if (!userToken) {
        toast.error("Not authenticated.");
        return;
    }

    setIsDownloading(true);
    try {
        const company = (application.company_name || "Company").replace(/\s+/g, "_");
        const type = application.certificate_type.replace(/\s+/g, "_");
        const certClass = (application.certificate_class || "N/A").replace(/\s+/g, "_");
        const filename = `${company}_${type}_${certClass}_${application.id}.pdf`;

        toast.info("Preparing download...");
        await api.download(
            `/applications/${application.id}/certificate`,
            filename, 
            userToken
        );
        toast.success("Certificate download initiated!");
    } catch (error: any) {
        console.error("Download failed:", error);
        toast.error(error.message || "Failed to download certificate.");
    } finally {
        setIsDownloading(false);
    }
  };

  const handleRenew = async () => {
      setIsRenewing(true);
      try {
          await renewApplication(String(application.id));
          toast.success("Renewal started! You can now continue the application.");
          // Ideally trigger a refresh or callback here, for now relying on context update
      } catch (error: any) {
          toast.error(error.message || "Failed to start renewal.");
      } finally {
          setIsRenewing(false);
      }
  };

  const handleUpgrade = async () => {
      setIsUpgrading(true);
      try {
          const newApp = await createApplication({ certificate_type: application.certificate_type });
          await fetchApplications();
          toast.success("Upgrade application started. Select your new class to continue.");
          const fromClass = application.certificate_class ? encodeURIComponent(application.certificate_class) : "";
          router.push(`/dashboard?id=${newApp.id}${fromClass ? `&upgradeFrom=${fromClass}` : ""}`);
      } catch (error: any) {
          toast.error(error?.message || "Failed to start upgrade.");
      } finally {
          setIsUpgrading(false);
      }
  };

  const handleContinueApplication = () => {
      // Determine the correct path based on the current step
      // Step 4: Company Info
      // Step 5: Directors
      // Step 6: Documents
      // Step 7: Review
      
      const baseUrl = "/dashboard";
      const params = `?id=${application.id}`;
      
      let path = "/company"; // Default to company info
      
      if (application.current_step === 5) {
          path = "/directors";
      } else if (application.current_step === 6) {
          path = "/documents";
      } else if (application.current_step >= 7) {
          path = "/review";
      }
      
      router.push(`${baseUrl}${path}${params}`);
  };

  const selectedClassData = certData.classes.find(c => c.id === selectedClass) || certData.classes[0];

  // Helper for display assets
  const getDisplayData = (type: string) => {
    switch (type) {
      case "building":
      case "civil":
        return { name: "General Building & Civil Works", shape: "/green-shape.svg" };
      case "electrical":
        return { name: "Electrical Works", shape: "/red-shape.svg" };
      case "plumbing":
        return { name: "Plumbing Works", shape: "/blue-shape.svg" };
      default:
        return { name: "Unknown Certification", shape: "/blue-shape.svg" };
    }
  };
  
  const { name, shape } = getDisplayData(application.certificate_type);
  const shapeLarge = shape.replace(".svg", "-large.svg");

  const isExpired = application.expiry_date ? new Date(application.expiry_date) < new Date() : false;
  const isSuspended = application.status === "suspended";
  const canUpgradeExpired = Boolean(isExpired && application.certificate_class && !isHighestClass(certType, application.certificate_class));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Certification Type and Category Bars */}
      <div className="grid grid-cols-2 gap-4">
        {/* Certification Type Bar - Read Only */}
        <div className="flex items-center rounded-full border bg-white px-6 py-3 shadow-sm dark:bg-gray-950 opacity-80 cursor-not-allowed">
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Certification Type:</span>
                <span className="text-sm font-bold ml-2">{name}</span>
            </div>
        </div>

        {/* Category Bar */}
        <div className="flex items-center rounded-full border bg-white px-6 py-3 shadow-sm dark:bg-gray-950">
          <span className="text-sm font-medium">Category:</span>
          <span className="ml-2 text-sm font-bold text-gray-900 dark:text-gray-100">
            {certData.category}
          </span>
        </div>
      </div>

      {/* Large Shape Card */}
      <motion.div
        layout
        className="relative"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="relative h-[169px] w-full max-w-[720px]">
          <Image
            src={shapeLarge}
            alt={name}
            fill
            className="object-contain object-left"
          />

          {/* Content Overlay */}
          <div className="absolute inset-0 flex items-center justify-between p-6">
            <div className="relative top-0 lg:-top-10 md:top-0 left-0 lg:left-2 md:left-0 scale-[0.8] lg:scale-[1.0] md:scale-[0.7]">
              <h3 className="text-xl font-semibold text-white">
                {name}
              </h3>
            </div>
            <div className="relative top-0 lg:-top-14  md:top-0 left-0 lg:-left-4 md:left-0 scale-[0.8] lg:scale-[1.0] md:scale-[0.7]">
              <Image src="/circle-check.png" alt="Approved" width={24} height={24} className="h-8 w-8" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Class Type Dropdown */}
      <Select value={selectedClass} onValueChange={setSelectedClass} disabled={application.status !== "draft" || application.current_step >= 3}>
        <SelectTrigger className="flex w-full items-center justify-between rounded-full border bg-white px-6 py-8 h-10 shadow-sm dark:bg-gray-950 [&>svg]:hidden">
          <span className="text-base font-medium">
             {application.status !== "draft" || application.current_step >= 3 ? selectedClassData.label : "Select Class Type"}
          </span>
          <div className="flex items-center gap-3">
            <SelectValue className="relaive -left-40" />
            <div className="pointer-events-none flex h-8 w-8 items-center justify-center rounded-md bg-white dark:bg-gray-800">
              <ChevronDown className="h-8 w-8" />
            </div>
          </div>
        </SelectTrigger>
        <SelectContent>
          {effectiveClasses.map((classItem) => (
            <SelectItem
              key={classItem.id}
              value={classItem.id}
              disabled={!upgradeFromClass && existingClassToDisable != null && (classItem.id || "").trim().toUpperCase() === (existingClassToDisable || "").trim().toUpperCase()}
            >
              {classItem.label}
              {!upgradeFromClass && existingClassToDisable != null && (classItem.id || "").trim().toUpperCase() === (existingClassToDisable || "").trim().toUpperCase() ? " (current class)" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Certificate Information */}
      <div className="rounded-lg border bg-white p-6 dark:bg-gray-950">
        <h3 className="mb-4 text-xl font-bold">Certificate Information:</h3>
        <div className="space-y-3 text-gray-700 dark:text-gray-300">
          {application.status === "approved" || isExpired || isSuspended ? (
            <>
              <p>
                <span className="font-medium">Certificate Number:</span>{" "}
                {application.certificate_number || `MWHWR-CC-25-${application.certificate_class || "X"}-${application.id.toString().padStart(3, "0")}`}
              </p>
              <p>
                <span className="font-medium">Financial Class:</span> {selectedClassData.financialClass}
              </p>
              <p>
                <span className="font-medium">Class:</span> {selectedClassData.label}
              </p>
              <p>
                <span className="font-medium">Category:</span> {certData.category}
              </p>
              <p>
                <span className="font-medium">Expiry Date:</span>{" "}
                {application.expiry_date ? new Date(application.expiry_date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric"
                }) : "N/A"}
              </p>
              <p className="flex items-center gap-2">
                <span className="font-medium">Certificate Status:</span>{" "}
                {isSuspended ? (
                  <span className="font-bold text-orange-600">Suspended</span>
                ) : isExpired ? (
                  <span className="font-bold text-red-600">Expired</span>
                ) : (
                  <span className="font-bold text-green-600">Active</span>
                )}
              </p>
            </>
          ) : (
            <>
              <p>
                <span className="font-medium">Financial Class:</span> {selectedClassData.financialClass}
              </p>
              <p>
                <span className="font-medium">Class:</span> {selectedClassData.label}
              </p>
              <p>
                <span className="font-medium">Category:</span> {certData.category}
              </p>
              <p>
                <span className="font-medium">New registration:</span> {selectedClassData.registration}
              </p>
              <p>
                <span className="font-medium">Renewal:</span> {selectedClassData.renewal}
              </p>
              {selectedClassData.requiresLLC && (
                <p className="pt-2 italic text-blue-600 dark:text-blue-400">
                  * Limited Liability Company registration required
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Confirmation Checkbox - Only show if in draft mode and selection phase */}
      {application.status === "draft" && application.current_step < 3 && (
        <div className="flex items-start gap-3">
            <Checkbox
            id="confirm"
            checked={isConfirmed}
            onCheckedChange={(checked) => setIsConfirmed(checked as boolean)}
            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
            />
            <Label
            htmlFor="confirm"
            className="cursor-pointer text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
            I confirm the Selected Certificate Type and Class is accurate
            </Label>
        </div>
      )}

      {/* Submit Button - Only show if in draft mode and selection phase */}
      {application.status === "draft" && application.current_step < 3 && (
        <div className="flex justify-end">
            <Button
            size="lg"
            disabled={!isConfirmed || isSubmitting}
            onClick={handleSubmit}
            className="rounded-full bg-blue-600 px-12 text-white hover:bg-blue-700 disabled:opacity-50"
            >
            {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
        </div>
      )}
      
      {/* Action Buttons based on Status */}
      {(application.status === "approved" || isSuspended || isExpired) && (
          <div className="flex justify-end gap-4">
              {/* Suspended State */}
              {isSuspended && (
                  <>
                      <div className="flex-1 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30 rounded-lg flex items-center gap-3 text-orange-700 dark:text-orange-400">
                          <AlertCircle className="h-5 w-5 text-orange-600" />
                          <p className="text-sm font-medium">Your certificate has been suspended. Please contact the ministry for assistance.</p>
                      </div>
                      {/* mailto: protocol requires <a> tag - cannot use Next.js Link for external protocols */}
                      <a
                        href="mailto:info@mwh.gov.gh"
                        className="inline-flex h-11 items-center justify-center rounded-full bg-orange-600 px-8 text-white hover:bg-orange-700 transition-colors"
                      >
                        Contact Ministry
                      </a>
                  </>
              )}

              {/* Expired State */}
              {!isSuspended && isExpired && (
                  <>
                      <div className="flex-1 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg flex items-center gap-3 text-red-700 dark:text-red-400">
                          <AlertCircle className="h-5 w-5 text-red-600" />
                          <p className="text-sm font-medium">Your certificate has expired. Please renew to continue operations.</p>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <Button
                          size="lg"
                          onClick={handleRenew}
                          disabled={isRenewing}
                          className="rounded-full bg-red-600 px-12 text-white hover:bg-red-700 flex items-center gap-2"
                        >
                           {isRenewing ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Starting Renewal...
                              </>
                            ) : (
                              "Renew Certificate"
                            )}
                        </Button>
                        {canUpgradeExpired && (
                          <Button
                            size="lg"
                            onClick={handleUpgrade}
                            disabled={isUpgrading}
                            variant="outline"
                            className="rounded-full px-12 border-2 border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                          >
                            {isUpgrading ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Starting...
                              </>
                            ) : (
                              "Upgrade Class"
                            )}
                          </Button>
                        )}
                      </div>
                  </>
              )}

              {/* Active (Approved) State */}
              {!isSuspended && !isExpired && (
                  <>
                      <div className="flex-1 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-lg flex items-center gap-3 text-blue-700 dark:text-blue-400">
                          <Image src="/circle-check.png" alt="Approved" width={20} height={20} />
                          <p className="text-sm font-medium">Application Approved. You can now download your certificate.</p>
                      </div>
                      <Button
                        size="lg"
                        onClick={handleDownloadCertificate}
                        disabled={isDownloading}
                        className="rounded-full bg-[#033783] px-12 text-white hover:bg-[#022555] flex items-center gap-2"
                      >
                         {isDownloading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Wait...
                            </>
                          ) : (
                            "Download Certificate"
                          )}
                      </Button>
                  </>
              )}
          </div>
      )}

      {/* If paid already but NOT approved/suspended/expired, show Continue to Company Info */}
      {application.current_step >= 4 && application.status !== "approved" && !isSuspended && !isExpired && (
          <div className="flex justify-end gap-4">
              <div className="flex-1 p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 rounded-lg flex items-center gap-3 text-green-700 dark:text-green-400">
                  <Image src="/circle-check.png" alt="Paid" width={20} height={20} />
                  <p className="text-sm font-medium">Payment confirmed. You can now complete your company profile.</p>
              </div>
              <Button
                size="lg"
                onClick={handleContinueApplication}
                className="rounded-full bg-[#033783] px-12 text-white hover:bg-[#022555]"
              >
                Continue Application
              </Button>
          </div>
      )}

      {/* If already past draft, maybe show a status message or "Proceed to Payment" if pending */}
      {/* After class selected (step 2): next is company info. After company (step 4): next is payment. */}
      {(application.current_step >= 2 && application.current_step < 4) && (
         <div className="flex justify-end gap-4">
            <Button
                variant="destructive"
                onClick={handleCancelClick}
                disabled={isCancelling}
            >
                {isCancelling ? "Cancelling..." : "Cancel Application"}
            </Button>
            <Button
            size="lg"
            onClick={onSubmitApplication}
            className="rounded-full bg-green-600 px-12 text-white hover:bg-green-700"
            >
            {application.current_step === 2 ? "Continue to Company Info" : "Continue"}
            </Button>
        </div>
      )}
      {application.current_step === 4 && (
         <div className="flex justify-end gap-4">
            <Button
                variant="destructive"
                onClick={handleCancelClick}
                disabled={isCancelling}
            >
                {isCancelling ? "Cancelling..." : "Cancel Application"}
            </Button>
            <Button
            size="lg"
            onClick={() => router.push(`/dashboard/payment?id=${application.id}`)}
            className="rounded-full bg-green-600 px-12 text-white hover:bg-green-700"
            >
            Proceed to Payment
            </Button>
        </div>
      )}

      {/* Show Cancel for other statuses too (Draft, Submitted, In Review) */}
      {(application.status === "draft" || application.status === "submitted" || application.status === "in_review") && (
          <div className="mt-8 pt-4 border-t flex justify-between items-center">
              <p className="text-sm text-gray-500">Need to stop this application?</p>
              <Button 
                variant="ghost" 
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleCancelClick}
                disabled={isCancelling}
              >
                  {isCancelling ? "Cancelling..." : "Cancel Application"}
              </Button>
          </div>
      )}
      <ConfirmationDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleConfirmCancel}
        title="Cancel Application"
        description="Are you sure you want to cancel this application? This action cannot be undone and you will need to start a new application if you wish to proceed later."
        confirmLabel="Yes, Cancel Application"
        isLoading={isCancelling}
      />
    </motion.div>
  );
}

