"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AlertCircle, Loader2 } from "lucide-react";
import { useApplication } from "@/contexts/ApplicationContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Application } from "@/lib/types";
import { isHighestClass, type CertificateType } from "@/lib/certificate-classes";

export type ApplicationCardCertificateType = "electrical" | "building" | "plumbing";

interface ApplicationCardProps {
  /** Latest application for this type, or null to show "Apply" card. */
  application: Application | null;
  certificateType: ApplicationCardCertificateType;
  onClick: () => void;
}

export function ApplicationCard({ application, certificateType, onClick }: ApplicationCardProps) {
  const { userToken, renewApplication, createApplication, fetchApplications } = useApplication();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isReapplying, setIsReapplying] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const router = useRouter();
  
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

  const typeForDisplay = application ? application.certificate_type : certificateType;
  const { name, shape, icon } = getDisplayData(typeForDisplay);

  // "Apply" card when no application for this type
  if (!application) {
    return (
      <motion.div
        layout
        className="relative w-full max-w-full flex flex-col"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <div className="relative w-full min-w-0 h-[160px] sm:h-[180px] md:h-[200px] lg:aspect-[390/217] lg:h-auto lg:min-h-[200px] cursor-pointer shrink-0" onClick={onClick}>
          <div className="absolute inset-0 w-full h-full">
            <Image src={shape} alt={name} fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-contain object-center w-full h-full" />
          </div>
          <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-5 md:p-5 lg:p-6">
            <div className={`flex-1 min-w-0 overflow-hidden ${certificateType === "building" ? "scale-[0.82] sm:scale-[0.88] md:scale-[0.85] lg:scale-[0.88] xl:scale-[0.95] origin-top-left" : "scale-[0.9] sm:scale-[0.95] md:scale-[0.92] lg:scale-[0.95] xl:scale-[1] origin-top-left"}`}>
              <h3 className="text-sm sm:text-lg md:text-lg font-semibold text-white flex items-center gap-2">
                <span className="truncate max-w-[85%] sm:max-w-none">{name}</span>
                <div className="relative h-4 w-4 sm:h-5 sm:w-5 shrink-0">
                  <Image src={icon} alt="" fill className="object-contain" sizes="(max-width: 640px) 16px, 20px" />
                </div>
              </h3>
            </div>
            <div className="flex items-end justify-start w-full">
              <button type="button" className="gradient-border-button rounded-full px-4 py-2.5 sm:px-4 md:px-6 lg:px-4 xl:px-6 sm:py-2.5 text-white font-medium min-w-fit shrink-0" onClick={(e) => { e.stopPropagation(); onClick(); }}>
                <span className="font-semibold whitespace-nowrap text-sm sm:text-sm md:text-base">Apply</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  const isApproved = application.status === "approved";
  const isSuspended = application.status === "suspended";
  const isCancelled = application.status === "cancelled";
  const isRejected = application.status === "rejected";
  const isExpired = application.expiry_date ? new Date(application.expiry_date) < new Date() : false;
  const isInProgress = ["submitted", "pending_payment", "in_review", "draft"].includes(application.status);
  const certTypeForClass = application.certificate_type as CertificateType;
  const canUpgrade = Boolean(
    isExpired &&
    application.certificate_class &&
    !isHighestClass(certTypeForClass, application.certificate_class)
  );
  
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
      } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          toast.error(err.message || "Failed to start renewal.");
      }
  };

  const handleReapply = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isReapplying) return;
      setIsReapplying(true);
      try {
          const newApp = await createApplication({ certificate_type: application.certificate_type });
          await fetchApplications();
          toast.success("New application started. You can continue from the dashboard.");
          router.push(`/dashboard?id=${newApp.id}`);
      } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          toast.error(err.message || "Failed to start new application.");
      } finally {
          setIsReapplying(false);
      }
  };

  const handleUpgrade = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isUpgrading) return;
      setIsUpgrading(true);
      try {
          const newApp = await createApplication({ certificate_type: application.certificate_type });
          await fetchApplications();
          toast.success("Upgrade application started. Select your new class to continue.");
          const upgradeFrom = application.certificate_class ? encodeURIComponent(application.certificate_class) : "";
          router.push(`/dashboard?id=${newApp.id}${upgradeFrom ? `&upgradeFrom=${upgradeFrom}` : ""}`);
      } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          toast.error(err.message || "Failed to start upgrade.");
      } finally {
          setIsUpgrading(false);
      }
  };

  const getStatusButton = () => {
    let label = "";
    let onClickHandler: ((e: React.MouseEvent) => void) | undefined;
    let buttonStyle: React.CSSProperties = {};
    let isDisabled = false;
    let showUpgradeButton = false;

    if (isSuspended) {
      label = "Suspended";
      buttonStyle = { background: "#F97316", border: "none" };
    } else if (isExpired) {
      label = "Renew";
      onClickHandler = handleRenew;
      showUpgradeButton = canUpgrade;
    } else if (isApproved) {
      label = "Approved";
      onClickHandler = onClick;
    } else if (isCancelled) {
      label = "Cancelled";
      buttonStyle = { background: "#9CA3AF", border: "none", cursor: "default" };
      isDisabled = true;
    } else if (isRejected) {
      label = isReapplying ? "Starting…" : "Reapply";
      onClickHandler = handleReapply;
      buttonStyle = { background: "#EF4444", border: "none" };
      isDisabled = isReapplying;
    } else if (application.status === "submitted" || application.status === "in_review") {
      label = "Pending Approval";
      buttonStyle = { opacity: 0.8, cursor: "default" };
      isDisabled = true;
    } else {
      label = "Continue";
      onClickHandler = onClick;
    }

    const isLongLabel = label === "Pending Approval";
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          className="gradient-border-button rounded-full px-4 py-2.5 sm:px-4 md:px-6 lg:px-4 xl:px-6 sm:py-2.5 text-white font-medium min-w-fit shrink-0"
          onClick={onClickHandler}
          style={buttonStyle}
          disabled={isDisabled}
        >
          <span className={`font-semibold whitespace-nowrap ${isLongLabel ? "text-xs sm:text-xs md:text-sm lg:text-base" : "text-sm sm:text-sm md:text-base"}`}>
            {label}
          </span>
        </button>
        {showUpgradeButton && (
          <button
            type="button"
            className="gradient-border-button rounded-full px-4 py-2.5 sm:px-4 md:px-6 lg:px-4 xl:px-6 sm:py-2.5 text-white font-medium min-w-fit shrink-0"
            onClick={handleUpgrade}
            disabled={isUpgrading}
            style={{ border: "none" }}
          >
            <span className="font-semibold whitespace-nowrap text-sm sm:text-sm md:text-base">
              {isUpgrading ? "Starting…" : "Upgrade"}
            </span>
          </button>
        )}
      </div>
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
      className="relative w-full max-w-full flex flex-col"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      {/* Shape: fixed height on mobile/tablet; aspect ratio on desktop - always fill container width */}
      <div className="relative w-full min-w-0 h-[160px] sm:h-[180px] md:h-[200px] lg:aspect-[390/217] lg:h-auto lg:min-h-[200px] cursor-pointer shrink-0" onClick={!isApproved ? onClick : undefined}>
        <div className="absolute inset-0 w-full h-full">
          <Image
            src={shape}
            alt={name}
            fill
            sizes="(max-width: 1024px) 100vw, 33vw"
            className="object-contain object-center w-full h-full"
          />
        </div>

        {/* Content Overlay - consistent placement like desktop */}
        <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-5 md:p-5 lg:p-6">
          {/* Top: title + checkmark — same baseline on mobile, checkmark slightly right */}
          <div className="flex items-center justify-between gap-2 min-h-0 pt-1 sm:pt-0">
            <div
              className={`flex-1 min-w-0 overflow-hidden ${
                application.certificate_type === "building" || application.certificate_type === "civil"
                  ? "scale-[0.82] sm:scale-[0.88] md:scale-[0.85] lg:scale-[0.88] xl:scale-[0.95] origin-top-left"
                  : "scale-[0.9] sm:scale-[0.95] md:scale-[0.92] lg:scale-[0.95] xl:scale-[1] origin-top-left"
              }`}
            >
              <h3 className="text-sm sm:text-lg md:text-lg font-semibold text-white flex items-center gap-2">
                <span className="truncate max-w-[85%] sm:max-w-none">{name}</span>
                <div className="relative h-4 w-4 sm:h-5 sm:w-5 shrink-0">
                  <Image
                    src={icon}
                    alt=""
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 16px, 20px"
                  />
                </div>
              </h3>
              {application.certificate_class && (
                <p className="text-white/90 text-xs sm:text-sm mt-0.5 font-medium">{application.certificate_class}</p>
              )}
            </div>
            <div className="shrink-0 w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center ml-1">
              <Image
                src="/circle-check.png"
                alt=""
                width={28}
                height={28}
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Bottom: status button — scaled on mobile so it stays inside card */}
          <div className="flex items-end justify-start w-full pb-0.5 sm:pb-0">
            <div className="scale-[0.85] sm:scale-90 md:scale-95 lg:scale-100 origin-bottom-left">
              {getStatusButton()}
            </div>
          </div>
        </div>
      </div>

      {/* Status label or Download - always below card, no overlap */}
      <div className="mt-3 sm:mt-4 w-full px-0 shrink-0">
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
