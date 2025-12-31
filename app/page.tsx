"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/header";
import { Chatbot } from "@/components/chatbot";
import { ChevronLeft, ChevronRight, Phone, Mail, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const carouselItems = [
  {
    id: "get-certified",
    title: "Get Certified Now",
    image: "/get-certified.png",
    description: "The Ministry of Works and Housing issues official Classification Certificates for qualified contractors in General Building & Civil, Electrical, and Plumbing works. This certification ensures that all contractors meet the Ministry's standards for technical competence, financial capacity, and professional integrity.",
  },
  {
    id: "general-building",
    title: "General Building & Civil Works",
    image: "/general-building.png",
    description: "Gain national recognition as an approved Civil Works Contractor. Your classification certificate from the Ministry validates your capacity to undertake projects in construction, road works, drainage systems, and infrastructure development.",
  },
  {
    id: "electrical",
    title: "Electrical Works",
    image: "/electrical.png",
    description: "The Electrical Works Classification Certificate demonstrates your company's qualification to handle electrical installations, maintenance, and public infrastructure projects under the Ministry's supervision. Be part of Ghana's sustainable energy and electrification drive.",
  },
  {
    id: "plumbing",
    title: "Plumbing Works",
    image: "/plumbing.png",
    description: "The Plumbing Works Classification Certificate recognizes your capability in providing water supply systems, sanitary installations, and maintenance services that meet the Ministry's professional benchmarks. Let your certification speak for your credibility.",
  },
];

export default function Home() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselItems.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const goToSlide = (index: number) => setCurrentIndex(index);
  const goToPrevious = () => setCurrentIndex((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);
  const goToNext = () => setCurrentIndex((prev) => (prev + 1) % carouselItems.length);

  const currentItem = carouselItems[currentIndex];

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-gray-950">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Column: Carousel */}
            <div className="space-y-8 order-2 lg:order-1">
              <div className="space-y-4 text-center lg:text-left">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#033783] dark:text-blue-400 leading-tight">
                  {currentItem.title}
                </h1>
              </div>

              {/* Carousel Container */}
              <div className="relative group">
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-0"
                    >
                      <Image
                        src={currentItem.image}
                        alt={currentItem.title}
                        fill
                        className="object-cover"
                        priority
                      />
                    </motion.div>
                  </AnimatePresence>

                  {/* Navigation Arrows */}
                  <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={goToPrevious}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-md hover:bg-white"
                    >
                      <ChevronLeft className="h-6 w-6 text-gray-900 dark:text-white" />
                    </button>
                    <button
                      onClick={goToNext}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-md hover:bg-white"
                    >
                      <ChevronRight className="h-6 w-6 text-gray-900 dark:text-white" />
                    </button>
                  </div>
                </div>

                {/* Carousel Indicators */}
                <div className="mt-6 flex justify-center lg:justify-start gap-2">
                  {carouselItems.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={`h-1.5 rounded-full transition-all ${
                        index === currentIndex
                          ? "w-8 bg-[#033783] dark:bg-blue-400"
                          : "w-2 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border border-gray-100 dark:border-gray-800">
                <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 leading-relaxed italic">
                  "{currentItem.description}"
                </p>
              </div>
            </div>

            {/* Right Column: Welcome & CTA */}
            <div className="space-y-10 order-1 lg:order-2">
              <div className="space-y-6">
                <div className="inline-block px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-[#033783] dark:text-blue-300 text-sm font-semibold tracking-wide uppercase">
                  Official Government Portal
                </div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white leading-[1.1]">
                  Welcome to the <span className="text-[#033783] dark:text-blue-400 text-nowrap">MWHWR</span> Classification Portal
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-400 max-w-lg">
                  Simplifying certification for contractors in Ghana. Apply, renew, and verify your status online.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/auth"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-[#033783] hover:bg-[#022555] text-white font-bold text-lg transition-transform hover:scale-105 shadow-lg shadow-blue-900/20"
                >
                  Start Your Application
                </Link>
                <a
                  href="/documents/Guideline-MWHWR.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-full border-2 border-gray-200 dark:border-gray-800 hover:border-[#033783] dark:hover:border-blue-400 text-gray-700 dark:text-gray-300 font-semibold transition-colors"
                >
                  View Guidelines
                </a>
              </div>

              {/* Contact Information Card */}
              <div className="pt-10 border-t border-gray-100 dark:border-gray-800">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Contact the Classification Office</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    <div className="h-10 w-10 rounded-lg bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                        <Phone className="h-5 w-5 text-[#033783]" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-400">Call Us</p>
                        <p className="text-sm font-bold">+233 30 223 1234</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    <div className="h-10 w-10 rounded-lg bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-[#033783]" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-400">Email Us</p>
                        <p className="text-sm font-bold">info@mwh.gov.gh</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    <div className="h-10 w-10 rounded-lg bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-[#033783]" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-400">Office Hours</p>
                        <p className="text-sm font-bold">Mon - Fri, 8:30am - 4:30pm</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-100 dark:border-gray-900 py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="space-y-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Official service of the Ministry of Works, Housing & Water Resources.
                </p>
                <p className="text-xs text-gray-400">
                  © {new Date().getFullYear()} All rights reserved.
                </p>
            </div>
            <div className="flex gap-6 text-sm font-medium">
              <Link href="/privacy-policy" className="text-gray-600 hover:text-[#033783] dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms-of-use" className="text-gray-600 hover:text-[#033783] dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
                Terms of Use
              </Link>
            </div>
          </div>
        </div>
      </footer>

      <Chatbot />
    </div>
  );
}