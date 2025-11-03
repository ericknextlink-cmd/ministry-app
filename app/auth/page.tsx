"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

type AuthMode = "login" | "register";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login");
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple state-based auth for now
    toast.success("Login successful!");
    router.push("/dashboard");
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple state-based auth for now
    toast.success("Registration successful!");
    router.push("/dashboard");
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
                <div className="relative h-30 w-30 scale-[1.5]">
                  <Image
                    src="/ministry-1.png"
                    alt="Ministry Logo"
                    fill
                    className="object-contain"
                  />
                </div>
              </Link>
            </div>

            {/* Animated Form Container */}
            <div className="relative overflow-hidden">
              <AnimatePresence mode="wait">
                {mode === "login" ? (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h2 className="text-3xl text-center font-bold text-gray-900 dark:text-gray-100">
                      Sign in
                    </h2>

                    <form onSubmit={handleLogin} className="mt-8 space-y-6">
                      <div className="space-y-2">
                        {/* <Label htmlFor="loginEmail">Email Address</Label> */}
                        <Input
                          id="loginEmail"
                          type="email"
                          placeholder="Email Address"
                          className="h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        {/* <Label htmlFor="loginPassword">Password</Label> */}
                        <div className="relative">
                          <Input
                            id="loginPassword"
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            className="h-12 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="h-12 w-full bg-[#033783] text-white hover:bg-[#022555]"
                      >
                        Sign in
                      </Button>

                      <div className="flex justify-center mt-20 relative">
                        <p className="text-center font-medium text-sm text-black dark:text-gray-400">
                          Don&apos;t have an account?{" "}
                          <button
                            type="button"
                            onClick={toggleMode}
                            className="font-medium text-[#0062FF] hover:underline dark:text-blue-400"
                          >
                            Register
                          </button>
                        </p>
                      </div>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="register"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h2 className="text-3xl text-center font-bold text-gray-900 dark:text-gray-100">
                      Register Now
                    </h2>

                    <form onSubmit={handleRegister} className="mt-8 space-y-6">
                      <div className="space-y-2">
                        {/* <Label htmlFor="companyName">Company Name</Label> */}
                        <Input
                          id="companyName"
                          placeholder="Company Name"
                          className="h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        {/* <Label htmlFor="email">Email Address</Label> */}
                        <Input
                          id="email"
                          type="email"
                          placeholder="Email Address"
                          className="h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        {/* <Label htmlFor="confirmEmail">Confirm Email Address</Label> */}
                        <Input
                          id="confirmEmail"
                          type="email"
                          placeholder="Confirm Email Address"
                          className="h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        {/* <Label htmlFor="phone">Phone Number</Label> */}
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="Phone Number"
                          className="h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        {/* <Label htmlFor="password">Password</Label> */}
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            className="h-12 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {/* <Label htmlFor="confirmPassword">Confirm Password</Label> */}
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm Password"
                            className="h-12 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="h-12 w-full bg-[#033783] text-white hover:bg-[#022555]"
                      >
                        Register
                      </Button>

                      <p className="text-center font-medium text-sm text-black dark:text-gray-400">
                        Already have an account?{" "}
                        <button
                          type="button"
                          onClick={toggleMode}
                          className="font-medium text-[#0062FF] hover:underline dark:text-blue-400"
                        >
                          Login
                        </button>
                      </p>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Side - Image */}
        <div className="relative hidden bg-gray-100 dark:bg-gray-900 lg:block">
          <Image
            src="/auth-image.png"
            alt="Bridge"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>
    </div>
  );
}

