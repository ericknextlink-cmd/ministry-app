"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api";

export interface TutorialStep {
  id: string;
  title: string;
  body: string;
  target?: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "welcome",
    title: "Welcome",
    body: "This short guide highlights key parts of the app. Follow along to get started.",
  },
  {
    id: "sidebar",
    title: "Navigation",
    body: "Use the sidebar to move between Dashboard, Company, Directors, Documents, Payments, and Renewals.",
    target: "[data-tutorial=\"tutorial-sidebar\"]",
  },
  {
    id: "apply",
    title: "New application",
    body: "Start a new certification application from the Dashboard when you're ready.",
    target: "[data-tutorial=\"tutorial-apply\"]",
  },
  {
    id: "profile",
    title: "Profile & settings",
    body: "Update your profile and account settings here.",
    target: "[data-tutorial=\"tutorial-profile\"]",
  },
  {
    id: "done",
    title: "You're all set",
    body: "You can revisit any section from the sidebar. Skip this guide anytime with Skip.",
  },
];

interface AppTutorialsProps {
  userToken: string;
  onComplete: () => void;
}

export function AppTutorials({ userToken, onComplete }: AppTutorialsProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [busy, setBusy] = useState(false);

  const step = TUTORIAL_STEPS[stepIndex];
  const isLast = stepIndex === TUTORIAL_STEPS.length - 1;

  const scrollToTarget = useCallback((selector?: string) => {
    if (!selector) return;
    const el = document.querySelector<HTMLElement>(selector);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  useEffect(() => {
    scrollToTarget(step?.target);
  }, [step?.target, scrollToTarget]);

  const markCompleteAndFinish = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      await authApi.updateProfile({ tutorials_completed: true }, userToken);
      onComplete();
    } catch (e) {
      console.warn("AppTutorials: failed to mark complete", e);
      onComplete();
    } finally {
      setBusy(false);
    }
  }, [userToken, onComplete, busy]);

  const handleNext = () => {
    if (isLast) {
      markCompleteAndFinish();
      return;
    }
    setStepIndex((i) => i + 1);
  };

  const handleSkip = () => {
    markCompleteAndFinish();
  };

  if (!step) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-end md:justify-center pb-24 md:pb-12 px-4"
      aria-modal="true"
      role="dialog"
      aria-label="App tutorial"
    >
      <div
        className="absolute inset-0 bg-black/50"
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-md rounded-xl border bg-white p-5 shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
          Step {stepIndex + 1} of {TUTORIAL_STEPS.length}
        </p>
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          {step.title}
        </h3>
        <p className="mb-5 text-sm text-gray-600 dark:text-gray-300">
          {step.body}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleNext}
            disabled={busy}
            className="bg-[#033783] hover:bg-[#022555] text-white"
          >
            {isLast ? "Done" : "Next"}
          </Button>
          <Button
            variant="ghost"
            onClick={handleSkip}
            disabled={busy}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            Skip
          </Button>
        </div>
      </div>
    </div>
  );
}
