"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "#about", label: "About the Certification" },
    { href: "#requirements", label: "Requirements" },
    { href: "/verify", label: "Verify Certificate" },
    { href: "/auth", label: "Login" },
  ];

  return (
    <>
      <header className="w-full border-b" style={{ backgroundColor: "#033783" }}>
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          {/* Logo and Text as a single button */}
          <Link 
            href="/" 
            className="flex items-center gap-2 transition-opacity hover:opacity-80 md:gap-3"
          >
            <div className="relative h-8 w-8 md:h-10 md:w-10">
              <Image
                src="/ministry-1.png"
                alt="Ministry Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-sm font-semibold text-white md:text-base lg:text-xl">
              Ministry of WHWR
            </span>
          </Link>

          {/* Desktop Navigation Items */}
          <nav className="hidden items-center gap-3 lg:flex xl:gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-white transition-colors hover:text-white/80 xl:text-sm"
              >
                {link.label}
              </Link>
            ))}
            <ThemeToggle />
            <Button
              asChild
              size="sm"
              className="rounded-full bg-white text-[#033783] hover:bg-white/90"
            >
              <Link href="/auth">Apply Now</Link>
            </Button>
          </nav>

          {/* Mobile/Tablet Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white hover:text-white/80"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 z-50 h-full w-64 border-l bg-white shadow-xl dark:bg-gray-950 lg:hidden"
            >
              <div className="flex h-16 items-center justify-between border-b px-4" style={{ backgroundColor: "#033783" }}>
                <span className="text-lg font-semibold text-white">Menu</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white hover:text-white/80"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <nav className="flex flex-col gap-2 p-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    {link.label}
                  </Link>
                ))}
                <Button
                  asChild
                  className="mt-4 w-full rounded-full bg-[#033783] text-white hover:bg-[#022555]"
                >
                  <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                    Apply Now
                  </Link>
                </Button>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

