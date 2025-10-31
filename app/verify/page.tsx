import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function VerifyPage() {
  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="bg-linear-to-b from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 py-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left Side - Form */}
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

              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    placeholder="Enter full name as on certificate"
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="certNumber">Certificate Number</Label>
                  <Input
                    id="certNumber"
                    placeholder="Enter certificate number"
                    className="h-12"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-[#033783] text-white hover:bg-[#022555] md:w-auto"
                >
                  Verify Now
                </Button>
              </form>
            </div>

            {/* Right Side - QR Code */}
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-950">
                <Image
                  src="/qr-code.png"
                  alt="QR Code"
                  width={200}
                  height={200}
                />
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
                  <span className="text-xl">📞</span>
                  <span>+233 542 260 789</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-xl">💬</span>
                  <span>support@moh.gov.gh</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4 py-8 md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Copyright © 2025 Ministry of Housing
            </p>
            <div className="flex gap-6 text-sm text-gray-600 dark:text-gray-400">
              <Link href="#" className="hover:text-gray-900 dark:hover:text-gray-100">
                Privacy Policy
              </Link>
              <Link href="#" className="hover:text-gray-900 dark:hover:text-gray-100">
                Terms of Use
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

