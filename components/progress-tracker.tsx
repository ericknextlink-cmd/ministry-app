"use client";

import { motion } from "framer-motion";
import { 
  Check, 
  FilePlus, 
  Layers, 
  CreditCard, 
  Building2, 
  Users, 
  FileText, 
  ClipboardCheck 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Application } from "@/lib/types";

interface ProgressTrackerProps {
  application: Application;
}

const STEPS = [
  { id: 1, label: "Apply", Icon: FilePlus },
  { id: 2, label: "Select Class", Icon: Layers },
  { id: 3, label: "Make Payment", Icon: CreditCard },
  { id: 4, label: "Company Info", Icon: Building2 },
  { id: 5, label: "Directors", Icon: Users },
  { id: 6, label: "Documents", Icon: FileText },
  { id: 7, label: "Review", Icon: ClipboardCheck },
];

export function ProgressTracker({ application }: ProgressTrackerProps) {
  const getTheme = (type: string) => {
    switch (type) {
      case "electrical":
        return {
          bg: "bg-red-500",
          text: "text-red-500",
          border: "border-red-500",
          ring: "ring-red-500",
          line: "bg-red-200 dark:bg-red-900/30",
          lineActive: "bg-red-500",
          title: "Electrical Works Application",
        };
      case "building":
      case "civil":
        return {
          bg: "bg-green-500",
          text: "text-green-500",
          border: "border-green-500",
          ring: "ring-green-500",
          line: "bg-green-200 dark:bg-green-900/30",
          lineActive: "bg-green-500",
          title: "Building & Civil Works Application",
        };
      case "plumbing":
        return {
          bg: "bg-blue-500",
          text: "text-blue-500",
          border: "border-blue-500",
          ring: "ring-blue-500",
          line: "bg-blue-200 dark:bg-blue-900/30",
          lineActive: "bg-blue-500",
          title: "Plumbing Works Application",
        };
      default:
        return {
          bg: "bg-blue-500",
          text: "text-blue-500",
          border: "border-blue-500",
          ring: "ring-blue-500",
          line: "bg-blue-200 dark:bg-blue-900/30",
          lineActive: "bg-blue-500",
          title: "Application Progress",
        };
    }
  };

  const theme = getTheme(application.certificate_type);
  const currentStep = application.current_step;

  return (
    <div className="w-full space-y-6">
        <div className="flex items-center justify-between">
            <h3 className={cn("text-lg font-bold", theme.text)}>
                {theme.title}
            </h3>
            <span className="text-sm text-muted-foreground">
                Step {currentStep} of {STEPS.length}
            </span>
        </div>

      <div className="relative">
        {/* Progress Line Background */}
        <div className={cn("absolute top-1/2 left-0 w-full h-1 -translate-y-1/2 rounded-full", theme.line)} />

        {/* Active Progress Line */}
        <motion.div
          className={cn("absolute top-1/2 left-0 h-1 -translate-y-1/2 rounded-full", theme.lineActive)}
          initial={{ width: "0%" }}
          animate={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />

        {/* Steps */}
        <div className="relative flex justify-between">
          {STEPS.map((step) => {
            const isCompleted = step.id < currentStep;
            const isActive = step.id === currentStep;
            // const isPending = step.id > currentStep;

            return (
              <div key={step.id} className="flex flex-col items-center gap-2 relative group">
                <motion.div
                  initial={false}
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    // backgroundColor handled by className
                  }}
                  className={cn(
                    "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                    isCompleted || isActive
                      ? `${theme.bg} ${theme.border} text-white shadow-md`
                      : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-400"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <step.Icon className={cn("h-5 w-5", isActive && "animate-pulse")} />
                  )}
                </motion.div>

                <span
                  className={cn(
                    "absolute top-12 text-[10px] md:text-xs font-medium text-center w-24 -left-7 md:-left-7 transition-colors duration-300",
                    isActive ? theme.text : "text-gray-500 dark:text-gray-400"
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Spacer for labels */}
      <div className="h-8" />
    </div>
  );
}
