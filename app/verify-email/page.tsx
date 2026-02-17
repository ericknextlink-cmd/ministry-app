"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email address...");

  const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api/v1";

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Verification token is missing.");
        return;
      }

      try {
        const res = await fetch(`${API_URL}/users/verify-email/${token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        const data = await res.json();

        if (res.ok) {
          setStatus("success");
          setMessage("Your email has been verified successfully! You can now sign in to your account.");
        } else {
          setStatus("error");
          setMessage(data.detail || "Verification failed. The link may have expired.");
        }
      } catch (err) {
        setStatus("error");
        setMessage("A network error occurred. Please try again later.");
      }
    };

    verify();
  }, [token, API_URL]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        {/* Header/Logo */}
        <div className="bg-[#033783] p-8 flex justify-center">
          <Link href="/">
            <div className="relative h-20 w-20 bg-white rounded-full p-2">
              <Image
                src="/ministry-1.png"
                alt="Ministry Logo"
                width={120}
                height={120}
                className="object-contain p-2"
              />
            </div>
          </Link>
        </div>

        <div className="p-8 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {status === "loading" && (
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Verifying...</h2>
                <p className="text-gray-500 dark:text-gray-400">{message}</p>
              </div>
            )}

            {status === "success" && (
              <div className="flex flex-col items-center space-y-4">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Email Verified!</h2>
                <p className="text-gray-600 dark:text-gray-400">{message}</p>
                <Button 
                  onClick={() => router.push("/auth")}
                  className="w-full bg-[#033783] hover:bg-[#022555] text-white mt-4"
                >
                  Sign In to Your Account <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {status === "error" && (
              <div className="flex flex-col items-center space-y-4">
                <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="h-10 w-10 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Verification Failed</h2>
                <p className="text-gray-600 dark:text-gray-400">{message}</p>
                <div className="flex flex-col w-full gap-3 mt-4">
                    <Button 
                    onClick={() => router.push("/auth")}
                    variant="outline"
                    className="w-full"
                    >
                    Back to Login
                    </Button>
                    <Link href="mailto:support@mwh.gov.gh" className="text-sm text-blue-600 hover:underline">
                        Contact Support
                    </Link>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
      
      <p className="mt-8 text-sm text-gray-500 dark:text-gray-400">
        © 2026 Ministry of Works, Housing & Water Resources
      </p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
