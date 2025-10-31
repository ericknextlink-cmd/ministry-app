import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />

      {/* Get Classified Now Section */}
      <section className="container mx-auto px-4 py-16 md:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Side - Content */}
          <div className="space-y-8">
            <h1 className="text-4xl font-bold text-[#033783] dark:text-blue-400 md:text-5xl">
              Get Classified Now
            </h1>

            <div className="relative h-64 w-full md:h-80">
              <Image
                src="/awards.png"
                alt="Certification Badges"
                fill
                className="object-contain"
              />
            </div>

            <div className="flex gap-4">
              <div className="h-2 w-2 rounded-full bg-gray-800 dark:bg-gray-300"></div>
              <div className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-600"></div>
              <div className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-600"></div>
            </div>

            <div className="space-y-4">
              <p className="text-lg text-gray-700 dark:text-gray-300">
                Submit your application for Ministry of Housing certification
                with ease.
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Whether you&apos;re an electrician, builder, or plumber, our
                digital platform ensures a smooth, transparent, and efficient
                process — from submission to approval.
              </p>
            </div>
          </div>

          {/* Right Side - Info */}
          <div className="space-y-6 lg:pt-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Welcome to the Ministry of Works, Housing & Water Resources
              Classification Application Portal
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300">
              Official portal for Classification Certificate Application
            </p>

            <Link
              href="#"
              className="inline-block text-lg text-gray-500 underline hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Download Certification Guidelines Paper
            </Link>
          </div>
        </div>
      </section>

      {/* Verify Certification Section */}
      <section
        className="py-16"
        style={{ backgroundColor: "#C6DCF2" }}
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left Side - Content */}
            <div className="space-y-6">
              <h2 className="text-4xl font-bold text-[#033783] md:text-5xl">
                Verify Certification Authenticity
              </h2>
              <p className="text-lg text-gray-700">
                Welcome to the official certificate verification portal of the
                Ministry of Works, Housing & Water Resources. This service
                allows you to confirm the authenticity of certificates issued by
                the Ministry. To verify a certificate: Enter the Full Name
                exactly as it appears on the certificate and provide the
                Certificate Number.
              </p>
              <Button
                asChild
                size="lg"
                className="rounded-md bg-[#033783] text-white hover:bg-[#022555]"
              >
                <Link href="/verify">Verify Now</Link>
              </Button>
            </div>

            {/* Right Side - QR Code */}
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="rounded-lg bg-white p-6 shadow-lg">
                <Image
                  src="/qr-code.png"
                  alt="QR Code"
                  width={200}
                  height={200}
                />
              </div>
              <p className="text-lg font-medium text-gray-700">Scan QR Code</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Footer */}
      <footer className="border-t bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4 py-8 md:px-6">
          <div className="space-y-4 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>
              For inquiries, please contact the Classification Office of the
              Ministry.
            </p>
            <p>Phone: 00 2337478758</p>
            <p>Email: info@mofh.gov.gh</p>
            <p>Office Hours: Monday – Friday, 8:30 AM – 4:30 PM</p>
          </div>
          <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-500">
            <p>
              This website is an official service of the Ministry of Works,
              Housing & Water Resources. All rights reserved. Unauthorized use
              is prohibited
            </p>
            <p className="mt-2">Copyright © 2025 Ministry of Housing</p>
            <p>Privacy Policy | Terms of Use</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
