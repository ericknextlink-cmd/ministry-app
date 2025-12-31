"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/header";
import { Chatbot } from "@/components/chatbot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { QRCodeGenerator } from "@/components/qr-code-generator";
import { toast } from "sonner";

type VerificationStatus = "valid" | "expired" | "revoked";

const statusIcons = {
  valid: "/certificate-valid.svg",
  expired: "/certificate-valid.svg",
  revoked: "/certificate-gray.svg",
};

const statusBadges = {
  valid: { icon: "/Approval.svg", color: "text-green-600" },
  expired: { icon: "/Expired.svg", color: "text-orange-600" },
  revoked: { icon: "/revoked.svg", color: "text-red-600" },
};

const mockCertificateData = {
  type: "Electrical Works",
  companyName: "Nexlink Technologies",
  companyAddress: "No.23 Mango Street, Accra, Ghana",
  expiryDate: "12.12.2025",
  certificateNumber: "MWHE1-2025-00018",
  status: "valid" as VerificationStatus,
};

function VerifyPageContent() {
  const searchParams = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<typeof mockCertificateData | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  // OTP & Form State
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");
  
  // Controlled Inputs
  const [name, setName] = useState("");
  const [certNumber, setCertNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  
  // Check if modal should open from query param
  useEffect(() => {
    const openModal = searchParams.get("form");
    if (openModal === "true") {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  // Generate QR code URL on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const currentUrl = window.location.origin + "/verify?form=true";
      setQrCodeUrl(currentUrl);
    }
  }, []);

  const handleVerifyClick = () => {
    setIsModalOpen(true);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newPhone = e.target.value;
      setPhone(newPhone);
      
      // If user edits phone after sending/verifying, reset status
      if (otpSent || otpVerified) {
          setOtpSent(false);
          setOtpVerified(false);
          setVerificationToken("");
          setOtpCode("");
      }
  };

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
        toast.error("Invalid Phone", { description: "Please enter a valid mobile number." });
        return;
    }
    setIsLoading(true);

    try {
        const res = await fetch(`${API_URL}/api/v1/applications/public/otp/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone_number: phone })
        });
        
        if (res.ok) {
            setOtpSent(true);
            toast.success("OTP Sent", { description: "Please check your phone for the code." });
        } else {
            toast.error("Error", { description: "Failed to send OTP." });
        }
    } catch (e) {
        toast.error("Error", { description: "Network error." });
    } finally {
        setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
     if (!otpCode) return;
     setIsLoading(true);
     try {
        const res = await fetch(`${API_URL}/api/v1/applications/public/otp/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone_number: phone, otp: otpCode })
        });
        
        if (res.ok) {
            const data = await res.json();
            setVerificationToken(data.token);
            setOtpVerified(true);
            toast.success("Verified", { description: "Phone number verified successfully." });
        } else {
            toast.error("Invalid OTP", { description: "Please try again." });
        }
    } catch (e) {
        toast.error("Error", { description: "Network error." });
    } finally {
        setIsLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!verificationToken) {
         toast.error("Verification Required", { description: "Please verify your phone number first." });
         return;
    }

    setIsLoading(true);
    setVerificationResult(null);
    
    // Clean ID
    const certId = certNumber.replace(/\D/g, ''); 

    if (!certId) {
        toast.error("Invalid Input", { description: "Please enter a valid certificate number." });
        setIsLoading(false);
        return;
    }

    try {
        const res = await fetch(`${API_URL}/api/v1/applications/public/verify/${certId}?token=${verificationToken}`);
        
        if (!res.ok) {
            if (res.status === 404) {
                 toast.error("Certificate Invalid", { description: "No valid certificate found with this number." });
            } else if (res.status === 401) {
                 toast.error("Session Expired", { description: "OTP session expired. Please verify again." });
                 setOtpVerified(false);
                 setVerificationToken("");
            } else {
                 toast.error("Verification Failed", { description: "System error. Please try again later." });
            }
            setIsLoading(false);
            return;
        }

        const data = await res.json();
        
        let status: VerificationStatus = "valid";
        if (data.status === "suspended" || data.status === "cancelled") {
            status = "revoked";
        } else if (data.expiry_date && new Date(data.expiry_date) < new Date()) {
            status = "expired";
        }

        setVerificationResult({
            type: data.certificate_type.replace(/_/g, " ").toUpperCase(),
            companyName: data.company_name,
            companyAddress: data.company_address || "N/A",
            expiryDate: data.expiry_date ? new Date(data.expiry_date).toLocaleDateString() : "N/A",
            certificateNumber: `MWHE-${new Date().getFullYear()}-${data.id.toString().padStart(5, '0')}`,
            status: status
        });
        
        toast.success("Certificate Verified", { description: "Certificate details retrieved successfully." });

    } catch (err) {
        console.error(err);
        toast.error("Network Error", { description: "Could not connect to verification server." });
    } finally {
        setIsLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setVerificationResult(null);
    // Reset state on close
    setOtpSent(false);
    setOtpVerified(false);
    setVerificationToken("");
    setPhone("");
    setOtpCode("");
    setName("");
    setCertNumber("");
  };

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="bg-linear-to-b from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 py-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left Side - Verify Button */}
            <div className="space-y-6">
              <h1 className="text-4xl font-bold text-[#033783] dark:text-blue-400 md:text-5xl">
                Verify Certification Authenticity
              </h1>
              <p className="text-lg text-gray-700 dark:text-gray-300">
                Welcome to the official certificate verification portal of the
                Ministry of Works, Housing & Water Resources. This service
                allows you to confirm the authenticity of certificates issued by
                the Ministry. To verify a certificate: Enter the Full Name
                exactly as it appears on the certificate and provide the
                Certificate Number.
              </p>

              <Button
                onClick={handleVerifyClick}
                size="lg"
                className="bg-[#033783] text-white hover:bg-[#022555]"
              >
                Verify Now
              </Button>
            </div>

            {/* Right Side - QR Code */}
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="rounded-lg bg-[#C6DCF2] p-6 shadow-lg dark:bg-gray-950">
                {qrCodeUrl ? (
                  <QRCodeGenerator url={qrCodeUrl} width={200} />
                ) : (
                  <div className="h-[200px] w-[200px] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                )}
              </div>
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                Scan QR Code
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About This Page */}
      <section className="py-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-12 lg:grid-cols-2">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                About This Page
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                The Ministry of Housing Verification Portal provides a secure
                way to confirm the authenticity of certifications issued under
                our professional licensing programs.
              </p>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>Electrical Works Certification</li>
                <li>Civil & Construction Certification</li>
                <li>Plumbing Certification</li>
              </ul>
            </div>

            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Support & Contact
              </h2>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Need Help ?
              </p>
              <div className="space-y-2 text-gray-700 dark:text-gray-300">
                <p className="flex items-center gap-2">
                  <Image src="/Call.svg" alt="Phone" width={20} height={20} />
                  <span>+233 542 260 789</span>
                </p>
                <p className="flex items-center gap-2">
                  <Image src="/email.svg" alt="Email" width={20} height={20} />
                  <span>support@moh.gov.gh</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-950">
        <div className="container px-4 py-8 md:px-6">
          <div className="flex flex-col items-center gap-1 text-center text-sm font-semibold text-black dark:text-gray-400 relative xl:-left-98 lg:-left-65 md:-left-28 -left-28">
            <p>Copyright © 2025 Ministry of Housing</p>
            <div className="flex gap-1 relative -left-8">
              <Link href="/privacy-policy" className="hover:text-gray-900 dark:hover:text-gray-100">
                Privacy Policy
              </Link>
              <span className="text-black">|</span>
              <Link href="/terms-of-use" className="hover:text-gray-900 dark:hover:text-gray-100">
                Terms of Use
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Verification Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50"
              onClick={closeModal}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-8 shadow-xl dark:bg-gray-950"
              onClick={(e) => e.stopPropagation()}
            >
              <AnimatePresence mode="wait">
                {!verificationResult ? (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* Loading State */}
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center space-y-4 py-12">
                        <Loader2 className="h-12 w-12 animate-spin text-[#033783]" />
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                          Processing...
                        </p>
                      </div>
                    ) : (
                      <>
                        <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">
                          Enter the Required Details to Verify
                        </h2>

                        <form onSubmit={handleVerifySubmit} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Name as Appears on the Certificate</Label>
                            <Input
                              id="name"
                              placeholder="Enter full name"
                              className="h-12"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="certNumber">Certificate Number</Label>
                            <Input
                              id="certNumber"
                              placeholder="Enter certificate number"
                              className="h-12"
                              value={certNumber}
                              onChange={(e) => setCertNumber(e.target.value)}
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="mobile">Verifier Mobile Number</Label>
                            <div className="flex gap-2">
                                <Input
                                id="mobile"
                                type="tel"
                                placeholder="Enter mobile number"
                                className="h-12 flex-1"
                                value={phone}
                                onChange={handlePhoneChange}
                                required
                                />
                                {!otpVerified && (
                                    <Button 
                                        type="button" 
                                        onClick={handleSendOTP} 
                                        disabled={otpSent}
                                        className="h-12 bg-[#033783] text-white"
                                    >
                                        {otpSent ? "Sent" : "Get OTP"}
                                    </Button>
                                )}
                                {otpVerified && (
                                    <div className="h-12 flex items-center px-3 bg-green-100 text-green-700 rounded-md whitespace-nowrap">
                                        Verified
                                    </div>
                                )}
                            </div>
                          </div>

                          {otpSent && !otpVerified && (
                              <div className="space-y-2">
                                <Label htmlFor="otp">Enter OTP Code</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="otp"
                                        placeholder="123456"
                                        className="h-12 tracking-widest text-center text-lg"
                                        maxLength={6}
                                        value={otpCode}
                                        onChange={(e) => setOtpCode(e.target.value)}
                                        required
                                    />
                                    <Button 
                                        type="button"
                                        onClick={handleVerifyOTP}
                                        className="h-12 bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        Verify Code
                                    </Button>
                                </div>
                                <p className="text-xs text-gray-500">
                                    Please check your console logs (local) or SMS for the code.
                                </p>
                              </div>
                          )}

                          <div className="flex items-start gap-2 pt-2">
                            <Checkbox id="terms" required />
                            <Label
                              htmlFor="terms"
                              className="cursor-pointer text-sm leading-none pt-1"
                            >
                              By ticking this box you accept the Terms & Condition of use.
                            </Label>
                          </div>

                          <Button
                            type="submit"
                            size="lg"
                            disabled={!otpVerified}
                            className="w-full bg-[#033783] text-white hover:bg-[#022555] disabled:opacity-50"
                          >
                            Verify Certificate
                          </Button>
                        </form>
                      </>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* Certificate Status Header */}
                    <div className="mb-6 flex items-center gap-3">
                      <div className="relative h-16 w-16">
                        <Image
                          src={statusIcons[verificationResult.status]}
                          alt="Certificate"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Certificate Status:
                        </p>
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-bold capitalize ${statusBadges[verificationResult.status].color}`}>
                            {verificationResult.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Certificate Details */}
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Certificate Type
                        </p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {verificationResult.type}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Company Name
                        </p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {verificationResult.companyName}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Company Address
                        </p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {verificationResult.companyAddress}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Expiry Date
                        </p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {verificationResult.expiryDate}
                        </p>
                      </div>

                      <div className="border-t pt-4">
                        <div className="flex items-center gap-2">
                          <div className="relative h-5 w-5">
                            <Image
                              src={statusBadges[verificationResult.status].icon}
                              alt={verificationResult.status}
                              fill
                              className="object-contain"
                            />
                          </div>
                          <span className={`text-lg font-bold capitalize ${statusBadges[verificationResult.status].color}`}>
                            Certificate Status: {verificationResult.status}
                          </span>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Certificate No.
                        </p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {verificationResult.certificateNumber}
                        </p>
                      </div>

                      <div className="border-t pt-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Verified By the Ministry of Works, Housing & Water Resources
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={closeModal}
                      className="mt-6 w-full bg-[#033783] text-white hover:bg-[#022555]"
                    >
                      Close
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Chatbot */}
      <Chatbot />
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    }>
      <VerifyPageContent />
    </Suspense>
  );
}