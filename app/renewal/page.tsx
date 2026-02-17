"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useApplication } from "@/contexts/ApplicationContext";
import { applicationsApi } from "@/lib/api";

const RENEWAL_TOKEN_KEY = "renewal_token";

function RenewalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, userToken, fetchApplications, loading: authLoading } = useApplication();
  const [renewalLoading, setRenewalLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "no-token" | "redirecting" | "renewing" | "done" | "error">("idle");

  const tokenFromUrl = searchParams.get("token");
  const applicationIdParam = searchParams.get("application_id") ?? searchParams.get("application_uid");
  const applicationId = applicationIdParam ?? null;

  const ensureRenewalToken = useCallback(async (): Promise<string | null> => {
    if (tokenFromUrl) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(RENEWAL_TOKEN_KEY, tokenFromUrl);
      }
      return tokenFromUrl;
    }
    if (applicationId) {
      try {
        const { token } = await applicationsApi.getRenewalToken(applicationId);
        if (typeof window !== "undefined") {
          sessionStorage.setItem(RENEWAL_TOKEN_KEY, token);
        }
        return token;
      } catch (e) {
        console.error("Failed to get renewal token", e);
        toast.error("Invalid or expired renewal link.");
        return null;
      }
    }
    if (typeof window !== "undefined") {
      return sessionStorage.getItem(RENEWAL_TOKEN_KEY);
    }
    return null;
  }, [tokenFromUrl, applicationId]);

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    const run = async () => {
      const renewalToken = await ensureRenewalToken();
      if (cancelled) return;

      if (!renewalToken) {
        setStatus("no-token");
        return;
      }

      if (!isAuthenticated || !userToken) {
        setStatus("redirecting");
        router.replace(`/auth?returnUrl=${encodeURIComponent("/renewal")}`);
        return;
      }

      setStatus("renewing");
      setRenewalLoading(true);
      try {
        await applicationsApi.renewFromToken(renewalToken, userToken);
        if (cancelled) return;
        if (typeof window !== "undefined") {
          sessionStorage.removeItem(RENEWAL_TOKEN_KEY);
        }
        await fetchApplications();
        setStatus("done");
        toast.success("Renewal started. You can complete the new application in your dashboard.");
        router.replace("/dashboard/renewals");
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        const msg = err instanceof Error ? err.message : "Renewal failed.";
        toast.error(msg);
      } finally {
        if (!cancelled) setRenewalLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, userToken, ensureRenewalToken, fetchApplications, router]);

  if (authLoading || status === "redirecting" || status === "renewing") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            {status === "renewing" ? "Starting renewal…" : "Loading…"}
          </p>
        </div>
      </div>
    );
  }

  if (status === "no-token") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-xl font-semibold">Invalid or missing renewal link</h1>
          <p className="text-muted-foreground">
            Use the renewal link from your certificate, or go to your dashboard to renew from there.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-xl font-semibold">Renewal failed</h1>
          <p className="text-muted-foreground">
            The renewal could not be started. You can try again or go to your dashboard.
          </p>
          <div className="flex gap-2 justify-center">
            <Link
              href="/renewal"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Try again
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function RenewalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      }
    >
      <RenewalContent />
    </Suspense>
  );
}
