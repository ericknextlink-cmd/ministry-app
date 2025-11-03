import Link from "next/link";
import { Header } from "@/components/header";

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-16 md:px-6">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-8 text-4xl font-bold text-gray-900 dark:text-gray-100">
            Terms of Use
          </h1>

          <div className="space-y-6 text-gray-700 dark:text-gray-300">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Acceptance of Terms
              </h2>
              <p>
                By accessing and using the Ministry of Works, Housing & Water Resources
                Classification Certificate Application Portal, you accept and agree to be
                bound by these Terms of Use.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Use of the Portal
              </h2>
              <p>You agree to:</p>
              <ul className="list-inside list-disc space-y-2">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Use the portal only for lawful purposes</li>
                <li>Not attempt to gain unauthorized access to the system</li>
                <li>Respect the intellectual property rights of the Ministry</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Certificate Application Process
              </h2>
              <p>
                Certification applications are subject to review and approval by the Ministry.
                Submission of an application does not guarantee certification. The Ministry
                reserves the right to approve, reject, or request additional information for
                any application.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Fees and Payments
              </h2>
              <p>
                All application fees and renewal fees are non-refundable unless otherwise
                stated. Payment must be made through the official payment channels specified
                on the portal.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Limitation of Liability
              </h2>
              <p>
                The Ministry shall not be liable for any indirect, incidental, special,
                consequential, or punitive damages arising from your use of or inability to
                use the portal.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Changes to Terms
              </h2>
              <p>
                The Ministry reserves the right to modify these Terms of Use at any time. We
                will notify users of any material changes through the portal or via email.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Contact Information
              </h2>
              <p>
                For questions regarding these Terms of Use, please contact us at:
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

