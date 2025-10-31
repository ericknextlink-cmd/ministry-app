"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { CheckCircle2, Clock, Hourglass } from "lucide-react";

export type ApplicationType = {
  id: string;
  name: string;
  status: "approved" | "not-started" | "in-progress";
  shape: string;
  color: string;
  category?: string;
};

interface ApplicationCardProps {
  application: ApplicationType;
  onClick: () => void;
}

export function ApplicationCard({ application, onClick }: ApplicationCardProps) {
  const getStatusButton = () => {
    switch (application.status) {
      case "approved":
        return (
          <button className="gradient-border-button rounded-full px-8 py-2.5 text-base font-medium text-white relative left-6 w-[60%]">
            <div className="relative top-0 lg:top-0 md:top-0 left-0 lg:-left-6 md:left-0 scale-[0.8] lg:scale-[1.5] md:scale-[0.7]">
            Approved
            </div>
          </button>
        );
      case "not-started":
        return (
          <button
            onClick={onClick}
            className="gradient-border-button rounded-full px-8 py-2.5 text-base font-medium text-white relative left-6 w-[60%]"
          >
            <div className="relative top-0 lg:top-0 md:top-0 left-0 lg:-left-10 md:left-0 scale-[0.8] lg:scale-[1.6] md:scale-[0.7]">
            Apply
            </div>
          </button>
        );
      case "in-progress":
        return (
          <button
            onClick={onClick}
            className="gradient-border-button rounded-full px-8 py-2.5 text-base font-medium text-white relative left-6 w-[60%]"
          >
            <div className="relative top-0 lg:top-0 md:top-0 left-0 lg:-left-6 md:left-0 scale-[0.8] lg:scale-[1.6] md:scale-[0.7]">
            Continue
            </div>
          </button>
        );
    }
  };

  const getStatusLabel = () => {
    switch (application.status) {
      case "approved":
        return null; // Show download certificate instead
      case "not-started":
        return (
          <div className="mt-3 flex items-center gap-2 text-gray-600 dark:text-gray-400 relative left-16">
            <span className="text-sm">Not started</span>
            <Image src="/hourglass.png" alt="Hourglass" width={16} height={16} className="h-4 w-4" />
          </div>
        );
      case "in-progress":
        return (
          <div className="mt-3 flex items-center gap-2 text-gray-600 dark:text-gray-400 relative left-16">
            <span className="text-sm">In process</span>
            <Image src="/pending.png" alt="Hourglass" width={16} height={16} className="h-4 w-4" />
          </div>
        );
    }
  };

  return (
    <motion.div
      layout
      className="relative"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      {/* Shape Background */}
      <div className="relative h-[169px] w-full cursor-pointer" onClick={application.status !== "approved" ? onClick : undefined}>
        <Image
          src={application.shape}
          alt={application.name}
          fill
          className="object-contain"
        />

        {/* Content Overlay */}
        <div className="absolute inset-0 flex flex-col justify-between p-6">
          {/* Top Section */}
          <div className="flex items-start justify-between">
            <div className="relative top-0 lg:top-0 md:top-0 left-0 lg:left-8 md:left-0 scale-[0.8] lg:scale-[1.0] md:scale-[0.7]">
              <h3 className="max-w-[60%] text-xs text-nowrap font-semibold text-white">
                {application.name}
              </h3>
            </div>
            <div className="relative top-0 lg:top-0 md:top-0 left-0 lg:-left-6 md:left-0 scale-[0.8] lg:scale-[1.0] md:scale-[0.7]">
              <Image src="/circle-check.png" alt="Approved" width={16} height={16} className="h-6 w-6 text-white" />
            </div>
          </div>

          {/* Bottom Section */}
          <div className="flex items-end justify-start">
            {getStatusButton()}
          </div>
        </div>
      </div>

      {/* Status or Download Certificate */}
      {application.status === "approved" ? (
        <button className="mt-3 flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors relative left-12">
          <div className="relative h-6 w-6 shrink-0">
            <Image
              src="/certificate.png"
              alt="Certificate"
              fill
              className="object-contain"
            />
          </div>
          <span className="text-sm font-medium">Download Certificate</span>
        </button>
      ) : (
        getStatusLabel()
      )}
    </motion.div>
  );
}

