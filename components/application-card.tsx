"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AlertCircle, Loader2 } from "lucide-react";
import { useApplication } from "@/contexts/ApplicationContext"; // Import useApplication
import { api } from "@/lib/api"; // Import api for download
import { toast } from "sonner"; // Import toast for feedback

// Define the type to match the backend data + frontend needs
export interface ApplicationType {
  id: number;
  certificate_type: "electrical" | "building" | "plumbing" | "civil";
  certificate_class?: string;
  description?: string;
  status: "draft" | "submitted" | "pending_payment" | "in_review" | "approved" | "rejected" | "suspended" | "cancelled";
  current_step: number;
  expiry_date?: string;
  company_name?: string;
  user_email?: string;
  created_at: string;
  certificate_number?: string;
}

interface ApplicationCardProps {
  application: ApplicationType;
  onClick: () => void;
}

export function ApplicationCard({ application, onClick }: ApplicationCardProps) {
  const { userToken, user, renewApplication } = useApplication(); // Get userToken and user from context
  const [isDownloading, setIsDownloading] = useState(false);
  const router = useRouter();
  
  // Helper to map certificate type to display data
  const getDisplayData = (type: string) => {
    switch (type) {
      case "building":
      case "civil":
        return {
          name: "General Building & Civil Works",
          shape: "/green-shape.svg",
          color: "#7CB342",
          icon: "/Building With Rooftop Terrace.svg",
        };
      case "electrical":
        return {
          name: "Electrical Works",
          shape: "/red-shape.svg",
          color: "#E53935",
          icon: "/Electricity.svg",
        };
      case "plumbing":
        return {
          name: "Plumbing Works",
          shape: "/blue-shape.svg",
          color: "#1E88E5",
          icon: "/Piping.svg",
        };
      default:
        return {
          name: "Unknown Certification",
          shape: "/blue-shape.svg",
          color: "#9E9E9E",
          icon: "/Electricity.svg",
        };
    }
  };

  const { name, shape, icon } = getDisplayData(application.certificate_type);

  // Helper to map backend status to UI status
  const isApproved = application.status === "approved";
  const isSuspended = application.status === "suspended";
  const isCancelled = application.status === "cancelled";
  const isRejected = application.status === "rejected";
  const isExpired = application.expiry_date ? new Date(application.expiry_date) < new Date() : false;
  const isInProgress = ["submitted", "pending_payment", "in_review", "draft"].includes(application.status);
  
  const handleDownloadCertificate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDownloading) return;

    if (isSuspended) {
        toast.error("This certificate has been suspended. Please contact the ministry.");
        return;
    }
    if (!userToken) {
        toast.error("Not authenticated.");
        return;
    }

    setIsDownloading(true);
    try {
        // Construct requested filename: Name of Company_Certificate type_Class_Certificate Number.pdf
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
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error("Download failed:", err);
        toast.error(err.message || "Failed to download certificate.");
    } finally {
        setIsDownloading(false);
    }
  };

  const handleRenew = async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
          await renewApplication(application.id);
          toast.success("Renewal started! You can now continue the application.");
          // Ideally trigger a refresh or callback here
      } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          toast.error(err.message || "Failed to start renewal.");
      }
  }; // This closes the handleRenew function

  const getStatusButton = () => {
    let label = "";
    let onClickHandler: ((e: React.MouseEvent) => void) | undefined;
    let buttonStyle: React.CSSProperties = {};
    let isDisabled = false;

    if (isSuspended) {
      label = "Suspended";
      buttonStyle = { background: "#F97316", border: "none" };
    } else if (isExpired) {
      label = "Renew";
      onClickHandler = handleRenew;
    } else if (isApproved) {
      label = "Approved";
      onClickHandler = onClick;
    } else if (isCancelled) {
      label = "Cancelled";
      buttonStyle = { background: "#9CA3AF", border: "none", cursor: "default" };
      isDisabled = true;
    } else if (isRejected) {
      label = "Rejected";
      buttonStyle = { background: "#EF4444", border: "none", cursor: "default" };
      isDisabled = true;
    } else if (application.status === "submitted" || application.status === "in_review") {
      label = "Pending Approval";
      buttonStyle = { opacity: 0.8, cursor: "default" };
      isDisabled = true;
    } else {
      label = "Continue";
      onClickHandler = onClick;
    }

    return (
      <button
        type="button"
        className="gradient-border-button rounded-full px-4 sm:px-6 md:px-8 lg:px-12 py-2 sm:py-2.5 text-xs sm:text-sm md:text-base font-medium text-white whitespace-nowrap min-w-fit"
        onClick={onClickHandler}
        style={buttonStyle}
        disabled={isDisabled}
      >
        <span className="font-semibold">{label}</span>
      </button>
    );
  };

  const getStatusLabel = () => {
    if (isSuspended) {
         return (
          <div className="mt-3 flex items-center gap-2 text-orange-600 dark:text-orange-400">
            <span className="text-xs sm:text-sm font-semibold">Suspended</span>
            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" /> 
          </div>
        );
    } else if (isExpired) {
         return (
          <div className="mt-3 flex items-center gap-2 text-red-600 dark:text-red-400">
            <span className="text-xs sm:text-sm font-semibold">Expired</span>
            <Image src="/badge-expired.png" alt="Expired" width={16} height={16} className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
          </div>
        );
    } else if (isCancelled) {
         return (
          <div className="mt-3 flex items-center gap-2 text-gray-500">
            <span className="text-xs sm:text-sm font-semibold">Cancelled</span>
            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
          </div>
        );
    } else if (isRejected) {
         return (
          <div className="mt-3 flex items-center gap-2 text-red-600">
            <span className="text-xs sm:text-sm font-semibold">Rejected</span>
            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
          </div>
        );
    } else if (isApproved) {
        return null; // Show download certificate instead
    } else {
        return (
          <div className="mt-3 flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <span className="text-xs sm:text-sm">In process</span>
            <Image src="/pending.png" alt="Hourglass" width={16} height={16} className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
          </div>
        );
    }
  };

  return (
    <motion.div
      layout
      className="relative w-full"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      {/* Shape Background */}
      <div className="relative h-[140px] sm:h-[160px] md:h-[169px] w-full cursor-pointer" onClick={!isApproved ? onClick : undefined}>
        <Image
          src={shape}
          alt={name}
          fill
          className="object-contain"
        />

        {/* Content Overlay */}
        <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-5 md:p-6">
          {/* Top Section */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base md:text-lg font-semibold text-white flex items-center gap-1.5 sm:gap-2 truncate">
                <span className="truncate">{name}</span>
                <div className="relative h-3 w-3 sm:h-4 sm:w-4 shrink-0">
                  <Image
                    src={icon}
                    alt={`${name} icon`}
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 12px, 16px"
                  />
                </div>
              </h3>
            </div>
            <div className="shrink-0">
              <Image 
                src="/circle-check.png" 
                alt="Check" 
                width={16} 
                height={16} 
                className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" 
              />
            </div>
          </div>

          {/* Bottom Section */}
          <div className="flex items-end justify-start w-full">
            {getStatusButton()}
          </div>
        </div>
      </div>

      {/* Status or Download Certificate */}
      <div className="mt-2 sm:mt-3 px-2 sm:px-0">
        {isApproved && !isExpired ? (
          <button 
              type="button"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleDownloadCertificate} 
              disabled={isDownloading}
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 shrink-0 animate-spin" />
            ) : (
              <div className="relative h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 shrink-0">
                  <Image
                  src="/certificate.png"
                  alt="Certificate"
                  fill
                  className="object-contain"
                  sizes="(max-width: 640px) 16px, (max-width: 768px) 20px, 24px"
                  />
              </div>
            )}
            <span className="text-xs sm:text-sm font-medium">
              {isDownloading ? "Preparing..." : "Download Certificate"}
            </span>
          </button>
        ) : (
          getStatusLabel()
        )}
      </div>
    </motion.div>
  );
}

