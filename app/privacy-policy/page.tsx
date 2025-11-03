import Link from "next/link";
import { Header } from "@/components/header";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-16 md:px-6">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-8 text-4xl font-bold text-gray-900 dark:text-gray-100">
            Privacy Policy
          </h1>

          <div className="space-y-6 text-gray-700 dark:text-gray-300">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Introduction
              </h2>
              <p>
                The Ministry of Works, Housing & Water Resources (&quot;we,&quot; &quot;our,&quot;
                or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy
                explains how we collect, use, disclose, and safeguard your information when you
                visit our Classification Certificate Application Portal.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Information We Collect
              </h2>
              <p>We collect information that you provide directly to us, including:</p>
              <ul className="list-inside list-disc space-y-2">
                <li>Company information and registration details</li>
                <li>Director and stakeholder information</li>
                <li>Contact information (email, phone, address)</li>
                <li>Business documents and certifications</li>
                <li>Payment information for application and renewal fees</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                How We Use Your Information
              </h2>
              <p>We use the collected information to:</p>
              <ul className="list-inside list-disc space-y-2">
                <li>Process and evaluate certification applications</li>
                <li>Maintain official records of certified contractors</li>
                <li>Communicate with you regarding your application status</li>
                <li>Verify certificate authenticity</li>
                <li>Comply with legal obligations and regulations</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Data Security
              </h2>
              <p>
                We implement appropriate technical and organizational measures to protect your
                personal information against unauthorized access, alteration, disclosure, or
                destruction.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Your Rights
              </h2>
              <p>You have the right to:</p>
              <ul className="list-inside list-disc space-y-2">
                <li>Access your personal information</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your information (subject to legal requirements)</li>
                <li>Withdraw consent where processing is based on consent</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Contact Us
              </h2>
              <p>
                If you have questions about this Privacy Policy, please contact us at:
              </p>
              <div className="space-y-2">
                <p>Email: info@mofh.gov.gh</p>
                <p>Phone: 00 23378478758</p>
                <p>Office Hours: Monday - Friday, 8:30 AM - 4:30 PM</p>
              </div>
            </section>

            <section className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Last updated: January 2025
              </p>
            </section>
          </div>

          <div className="mt-12 flex justify-center">
            <Link
              href="/"
              className="rounded-md bg-[#033783] px-6 py-2 text-white hover:bg-[#022555]"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4 py-8 md:px-6">
          <div className="flex flex-col items-center gap-3 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>Copyright © 2025 Ministry of Housing</p>
            <div className="flex gap-4">
              <Link href="/privacy-policy" className="hover:text-gray-900 dark:hover:text-gray-100">
                Privacy Policy
              </Link>
              <span className="text-gray-400">|</span>
              <Link href="/terms-of-use" className="hover:text-gray-900 dark:hover:text-gray-100">
                Terms of Use
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

