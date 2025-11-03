import Link from "next/link";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen">
      <Header />

      <main className="flex flex-col items-center justify-center px-4 py-24 md:px-6">
        <div className="max-w-2xl text-center">
          <h1 className="mb-4 text-6xl font-bold text-gray-900 dark:text-gray-100">
            404
          </h1>
          <h2 className="mb-4 text-3xl font-semibold text-gray-800 dark:text-gray-200">
            Page Not Found
          </h2>
          <p className="mb-8 text-lg text-gray-600 dark:text-gray-400">
            The page you are looking for might have been removed, had its name
            changed, or is temporarily unavailable.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="bg-[#033783] text-white hover:bg-[#022555]">
              <Link href="/">
                <Home className="mr-2 h-5 w-5" />
                Return Home
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/verify">Verify Certificate</Link>
            </Button>
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

