"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useApplication } from "@/contexts/ApplicationContext"; // Import useApplication

type AuthMode = "login" | "register";

export default function AuthPage() {
  const router = useRouter();
  const { login, register, isAuthenticated, loading, error, user } = useApplication(); // Get user
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  
  // Login State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Register State
  const [regCompanyName, setRegCompanyName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regConfirmEmail, setRegConfirmEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);


  /*
  useEffect(() => {
    if (isAuthenticated && user) {
        if (user.is_superuser) {
            router.push("/admin");
        } else {
            router.push("/dashboard");
        }
    }
  }, [isAuthenticated, user, router]);
  */

  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const loggedInUser = await login(email, password);
      console.log("Logged in user:", loggedInUser); // Debug log
      toast.success("Login successful!");
      
      const isAdmin = loggedInUser && (
          loggedInUser.is_superuser || 
          loggedInUser.role === 'admin' || 
          loggedInUser.role === 'super_admin'
      );

      if (isAdmin) {
          console.log("Redirecting to Admin");
          router.push("/admin");
      } else {
          console.log("Redirecting to Dashboard");
          router.push("/dashboard");
      }
    } catch (err: any) {
       toast.error(err.message || "Login failed");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (regPassword !== regConfirmPassword) {
        toast.error("Passwords do not match");
        return;
    }
    if (regEmail !== regConfirmEmail) {
        toast.error("Emails do not match");
        return;
    }

    try {
      await register({
          email: regEmail, 
          password: regPassword,
          companyName: regCompanyName,
          phone: regPhone
      });
      toast.success("Registration successful!");
      // Context will auto-login and useEffect will redirect
    } catch (err: any) {
        toast.error(err.message || "Registration failed");
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
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
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
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
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
                        <div className="text-right">
                          <Link
                            href="/auth/forgot-password"
                            className="text-sm font-medium text-[#0062FF] hover:underline dark:text-blue-400"
                          >
                            Forgot Password?
                          </Link>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="h-12 w-full bg-[#033783] text-white hover:bg-[#022555]"
                        disabled={loading}
                      >
                        {loading ? "Signing In..." : "Sign in"}
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
                          value={regCompanyName}
                          onChange={(e) => setRegCompanyName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        {/* <Label htmlFor="email">Email Address</Label> */}
                        <Input
                          id="email"
                          type="email"
                          placeholder="Email Address"
                          className="h-12"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        {/* <Label htmlFor="confirmEmail">Confirm Email Address</Label> */}
                        <Input
                          id="confirmEmail"
                          type="email"
                          placeholder="Confirm Email Address"
                          className="h-12"
                          value={regConfirmEmail}
                          onChange={(e) => setRegConfirmEmail(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        {/* <Label htmlFor="phone">Phone Number</Label> */}
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="Phone Number"
                          className="h-12"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          required
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
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            required
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
                            value={regConfirmPassword}
                            onChange={(e) => setRegConfirmPassword(e.target.value)}
                            required
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
                        disabled={loading} // Disable during registration attempt
                      >
                        {loading ? "Registering..." : "Register"}
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


