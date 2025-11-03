"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { QRCodeGenerator } from "@/components/qr-code-generator";

type VerificationStatus = "valid" | "expired" | "revoked";

const statusIcons = {
  valid: "/Approval.svg",
  expired: "/Expired.svg",
  revoked: "/revoked.svg",
};

const statusBadges = {
  valid: { icon: "/certificate-valid.svg", color: "text-green-600" },
  expired: { icon: "/certificate-valid.svg", color: "text-orange-600" },
  revoked: { icon: "/certificate-gray.svg", color: "text-red-600" },
};

const mockCertificateData = {
  type: "Electrical Works",
  companyName: "Nexlink Technologies",
  companyAddress: "No.23 Mango Street, Accra, Ghana",
  expiryDate: "12.12.2025",
  certificateNumber: "MWHE1-2025-00018",
  status: "valid" as VerificationStatus,
};

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<typeof mockCertificateData | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  
  // Check if modal should open from query param
  useEffect(() => {
    const openModal = searchParams.get("form");
    if (openModal === "true") {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  // Generate QR code URL on mount
  useEffect(() => {
    const currentUrl = window.location.origin + "/verify?form=true";
    // For now, we'll use a placeholder. You can integrate a QR code library
    setQrCodeUrl(currentUrl);
  }, []);

  const handleVerifyClick = () => {
    setIsModalOpen(true);
  };

  const handleVerifySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setVerificationResult(mockCertificateData);
    setIsLoading(false);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setVerificationResult(null);
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
                <QRCodeGenerator url={qrCodeUrl} width={200} />
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
          <div className="flex flex-col items-center gap-1 text-center text-sm font-semibold text-black dark:text-gray-400 relative -left-98">
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
                          Verifying certificate...
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
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="certNumber">Certificate Number</Label>
                            <Input
                              id="certNumber"
                              placeholder="Enter certificate number"
                              className="h-12"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="mobile">Verifier Mobile Number</Label>
                            <Input
                              id="mobile"
                              type="tel"
                              placeholder="Enter mobile number"
                              className="h-12"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="token">Enter Token</Label>
                            <Input
                              id="token"
                              placeholder="Enter verification token"
                              className="h-12"
                              required
                            />
                          </div>

                          <div className="flex items-start gap-2">
                            <Checkbox id="terms" required />
                            <Label
                              htmlFor="terms"
                              className="cursor-pointer text-sm leading-none"
                            >
                              By ticking this box you accept the Terms & Condition of use.
                            </Label>
                          </div>

                          <Button
                            type="submit"
                            size="lg"
                            className="w-full bg-[#033783] text-white hover:bg-[#022555]"
                          >
                            Verify
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
    </div>
  );
}
