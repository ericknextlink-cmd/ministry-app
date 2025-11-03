"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

type ApplicationStep = 
  | "apply" 
  | "select-class" 
  | "payment" 
  | "company-info" 
  | "directors-info" 
  | "upload-docs" 
  | "review";

interface ApplicationProgress {
  applicationId: string;
  steps: {
    apply: boolean;
    "select-class": boolean;
    payment: boolean;
    "company-info": boolean;
    "directors-info": boolean;
    "upload-docs": boolean;
    review: boolean;
  };
  lastCompletedStep: ApplicationStep | null;
}

interface ApplicationContextType {
  progress: Record<string, ApplicationProgress>;
  updateProgress: (applicationId: string, step: ApplicationStep, completed: boolean) => void;
  getProgressForApp: (applicationId: string) => ApplicationProgress | null;
  getCompletionPercentage: (applicationId: string) => number;
}

const ApplicationContext = createContext<ApplicationContextType | undefined>(undefined);

export function ApplicationProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<Record<string, ApplicationProgress>>({});

  const updateProgress = useCallback((applicationId: string, step: ApplicationStep, completed: boolean) => {
    setProgress((prev) => {
      const existing = prev[applicationId];
      
      const steps = {
        apply: false,
        "select-class": false,
        payment: false,
        "company-info": false,
        "directors-info": false,
        "upload-docs": false,
        review: false,
        ...existing?.steps,
      };

      steps[step] = completed;

      // Determine last completed step
      const stepOrder: ApplicationStep[] = [
        "apply",
        "select-class",
        "payment",
        "company-info",
        "directors-info",
        "upload-docs",
        "review",
      ];

      let lastCompletedStep: ApplicationStep | null = null;
      for (let i = 0; i < stepOrder.length; i++) {
        if (steps[stepOrder[i]]) {
          lastCompletedStep = stepOrder[i];
        }
      }

      return {
        ...prev,
        [applicationId]: {
          applicationId,
          steps,
          lastCompletedStep,
        },
      };
    });
  }, []);

  const getProgressForApp = useCallback((applicationId: string): ApplicationProgress | null => {
    return progress[applicationId] || null;
  }, [progress]);

  const getCompletionPercentage = useCallback((applicationId: string): number => {
    const appProgress = progress[applicationId];
    if (!appProgress) return 0;

    const totalSteps = Object.keys(appProgress.steps).length;
    const completedSteps = Object.values(appProgress.steps).filter(Boolean).length;
    
    return Math.round((completedSteps / totalSteps) * 100);
  }, [progress]);

  return (
    <ApplicationContext.Provider
      value={{
        progress,
        updateProgress,
        getProgressForApp,
        getCompletionPercentage,
      }}
    >
      {children}
    </ApplicationContext.Provider>
  );
}

export function useApplication() {
  const context = useContext(ApplicationContext);
  if (!context) {
    throw new Error("useApplication must be used within an ApplicationProvider");
  }
  return context;
}

