"use client";

import { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { authApi } from "@/lib/api";
import { Eye, EyeOff, Lock, CheckCircle } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
        toast.error("Invalid or missing reset token.");
        return;
    }

    if (password !== confirmPassword) {
        toast.error("Passwords do not match.");
        return;
    }

    if (password.length < 8) {
        toast.error("Password must be at least 8 characters long.");
        return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setIsSuccess(true);
      toast.success("Password reset successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to reset password. Link may be expired.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
      return (
          <div className="text-center">
              <div className="mb-4 text-red-500">
                  <p>Invalid Reset Link</p>
              </div>
              <Link href="/auth/forgot-password" className="text-blue-600 hover:underline">
                  Request a new link
              </Link>
          </div>
      );
  }

  if (isSuccess) {
      return (
          <div className="text-center space-y-6">
              <div className="flex justify-center">
                  <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Password Reset!</h2>
              <p className="text-gray-500">
                  Your password has been successfully updated. You can now log in with your new password.
              </p>
              <Button 
                onClick={() => router.push("/auth")}
                className="w-full h-12 bg-[#033783] hover:bg-[#022555]"
              >
                  Back to Login
              </Button>
          </div>
      );
  }

  return (
      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="New Password"
                className="h-12 pl-10 pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Confirm New Password"
                className="h-12 pl-10 pr-10"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <Button
          type="submit"
          className="h-12 w-full bg-[#033783] text-white hover:bg-[#022555]"
          disabled={loading}
        >
          {loading ? "Resetting..." : "Set new password"}
        </Button>
      </form>
  );
}

export default function ResetPasswordPage() {
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
                    width={120}
                    height={120}
                    className="object-contain"
                  />
                </div>
              </Link>
            </div>

            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                Set new password
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Your new password must be different to previously used passwords.
              </p>
            </div>
            
            <Suspense fallback={<div>Loading...</div>}>
                <ResetPasswordForm />
            </Suspense>
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
