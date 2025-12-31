"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { authApi } from "@/lib/api";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setIsSent(true);
      toast.success("Recovery email sent!");
    } catch (error: any) {
      toast.error(error.message || "Failed to send recovery email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left Side - Form */}
        <div className="flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-8">
            {/* Logo */}
            <div className="flex justify-center">
              <Link href="/" className="block">
                <div className="relative h-20 w-20">
                  <Image
                    src="/ministry-1.png"
                    alt="Ministry Logo"
                    fill
                    className="object-contain"
                  />
                </div>
              </Link>
            </div>

            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                Forgot password?
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                No worries, we'll send you reset instructions.
              </p>
            </div>

            {!isSent ? (
              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <div className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      className="h-12 pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full bg-[#033783] text-white hover:bg-[#022555]"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Reset password"}
                </Button>

                <div className="text-center">
                  <Link
                    href="/auth"
                    className="flex items-center justify-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to log in
                  </Link>
                </div>
              </form>
            ) : (
              <div className="mt-8 space-y-6 text-center">
                <div className="rounded-lg bg-green-50 p-4 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                  <p className="font-medium">Check your email</p>
                  <p className="text-sm mt-1">
                    We've sent a password reset link to <strong>{email}</strong>.
                  </p>
                </div>
                
                <p className="text-sm text-gray-500">
                  Didn't receive the email? Check your spam folder or{" "}
                  <button 
                    onClick={() => { setIsSent(false); setLoading(false); }}
                    className="text-[#0062FF] hover:underline"
                  >
                    try again
                  </button>.
                </p>

                <Link
                  href="/auth"
                  className="inline-flex items-center justify-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to log in
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Image */}
        <div className="relative hidden bg-gray-100 dark:bg-gray-900 lg:block">
          <Image
            src="/auth-image.png"
            alt="Background"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>
    </div>
  );
}
