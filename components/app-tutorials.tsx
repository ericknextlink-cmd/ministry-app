"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

const SPOTLIGHT_PADDING = 8;
const TOOLTIP_GAP = 12;
const ARROW_SIZE = 10;
const TOOLTIP_MAX_WIDTH = 384; // max-w-sm = 24rem

export function AppTutorials({ userToken, onComplete }: AppTutorialsProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = TUTORIAL_STEPS[stepIndex];
  const isLast = stepIndex === TUTORIAL_STEPS.length - 1;
  const hasTarget = Boolean(step?.target);

  const measureTarget = useCallback(() => {
    if (!step?.target) {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector<HTMLElement>(step.target);
    if (!el) {
      setTargetRect(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    setTargetRect(
      new DOMRect(
        rect.left - SPOTLIGHT_PADDING,
        rect.top - SPOTLIGHT_PADDING,
        rect.width + SPOTLIGHT_PADDING * 2,
        rect.height + SPOTLIGHT_PADDING * 2
      )
    );
  }, [step?.target]);

  const scrollToTarget = useCallback((selector?: string) => {
    if (!selector) return;
    const el = document.querySelector<HTMLElement>(selector);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  useEffect(() => {
    measureTarget();
  }, [measureTarget, stepIndex]);

  useEffect(() => {
    if (!hasTarget) return;
    scrollToTarget(step?.target);
    const t = setTimeout(measureTarget, 400);
    return () => clearTimeout(t);
  }, [hasTarget, step?.target, scrollToTarget, measureTarget]);

  useEffect(() => {
    if (!hasTarget) return;
    const onResizeOrScroll = () => measureTarget();
    window.addEventListener("resize", onResizeOrScroll);
    window.addEventListener("scroll", onResizeOrScroll, true);
    return () => {
      window.removeEventListener("resize", onResizeOrScroll);
      window.removeEventListener("scroll", onResizeOrScroll, true);
    };
  }, [hasTarget, measureTarget]);

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

  const overlayClipPath =
    hasTarget && targetRect
      ? `polygon(evenodd, 0 0, 100vw 0, 100vw 100vh, 0 100vh, ${targetRect.left}px ${targetRect.top}px, ${targetRect.right}px ${targetRect.top}px, ${targetRect.right}px ${targetRect.bottom}px, ${targetRect.left}px ${targetRect.bottom}px)`
      : undefined;

  return (
    <div
      className="fixed inset-0 z-100 overflow-hidden"
      aria-modal="true"
      role="dialog"
      aria-label="App tutorial"
    >
      {/* Dark overlay with clip-path cutout at target (spotlight hole); blocks clicks on dimmed area */}
      <div
        className="absolute inset-0 bg-black/75"
        aria-hidden="true"
        style={{
          clipPath: overlayClipPath,
          pointerEvents: "auto",
        }}
      />

      {/* Instruction tooltip: below spotlight, centered, with arrow pointing up */}
      {hasTarget && targetRect ? (
        <div
          ref={tooltipRef}
          className="absolute z-10 w-full max-w-sm rounded-xl border bg-white p-5 shadow-xl dark:bg-gray-900 dark:border-gray-700"
          style={{
            left: Math.max(16, Math.min(targetRect.left + targetRect.width / 2 - TOOLTIP_MAX_WIDTH / 2, window.innerWidth - TOOLTIP_MAX_WIDTH - 16)),
            top: targetRect.bottom + TOOLTIP_GAP + ARROW_SIZE,
          }}
        >
          {/* Arrow pointing up at the spotlight */}
          <div
            className="absolute left-1/2 -translate-x-1/2 w-0 h-0 border-l-10 border-l-transparent border-r-10 border-r-transparent border-b-10 border-b-white dark:border-b-gray-900"
            style={{ bottom: "100%" }}
          />
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
      ) : (
        /* No target: centered modal (welcome / done) */
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 pointer-events-none bottom-10">
          <div className="pointer-events-auto w-full max-w-md rounded-xl border bg-white p-5 shadow-xl dark:bg-gray-900 dark:border-gray-700">
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
      )}
    </div>
  );
}
