"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/header";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const carouselItems = [
  {
    id: "get-certified",
    title: "Get Certified Now",
    image: "/awards.png",
    description: "The Ministry of Works and Housing issues official Classification Certificates for qualified contractors in General Building & Civil, Electrical, and Plumbing works. This certification ensures that all contractors meet the Ministry's standards for technical competence, financial capacity, and professional integrity.",
  },
  {
    id: "general-building",
    title: "General Building & Civil Works",
    image: "/general-building.jpg",
    description: "Gain national recognition as an approved Civil Works Contractor. Your classification certificate from the Ministry validates your capacity to undertake projects in construction, road works, drainage systems, and infrastructure development.",
  },
  {
    id: "electrical",
    title: "Electrical Works",
    image: "/electrical.jpg",
    description: "The Electrical Works Classification Certificate demonstrates your company's qualification to handle electrical installations, maintenance, and public infrastructure projects under the Ministry's supervision. Be part of Ghana's sustainable energy and electrification drive.",
  },
  {
    id: "plumbing",
    title: "Plumbing Works",
    image: "/plumbing.jpg",
    description: "The Plumbing Works Classification Certificate recognizes your capability in providing water supply systems, sanitary installations, and maintenance services that meet the Ministry's professional benchmarks. Let your certification speak for your credibility.",
  },
  {
    id: "apply",
    title: "Get Classified Now",
    image: "/awards.png",
    description: "Submit your application for Ministry of Housing certification with ease. Whether you're an electrician, builder, or plumber, our digital platform ensures a smooth, transparent, and efficient process — from submission to approval.",
  },
];

export default function Home() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselItems.length);
    }, 10000); // 10 seconds

    return () => clearInterval(timer);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % carouselItems.length);
  };

  const currentItem = carouselItems[currentIndex];

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header />

      {/* Main Content - Carousel */}
      <section className="flex flex-1 overflow-hidden">
        <div className="container mx-auto grid h-full grid-cols-1 gap-8 px-4 py-8 lg:grid-cols-2 lg:px-6">
          {/* Left Column - Carousel Content */}
          <div className="flex flex-col justify-center space-y-8 relative scale-[0.9] -top-6">
            {/* Title */}
            <h1 className="text-3xl font-bold text-[#033783] dark:text-blue-400 lg:text-4xl">
              {currentItem.title}
            </h1>

            {/* Carousel Image Container */}
            <div className="relative aspect-video w-full overflow-hidden rounded-lg">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.5 }}
                  className="relative h-full w-full"
                >
                  <Image
                    src={currentItem.image}
                    alt={currentItem.title}
                    fill
                    className="object-cover"
                  />
                </motion.div>
              </AnimatePresence>

              {/* Navigation Arrows */}
              <button
                onClick={goToPrevious}
                className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-lg transition-all hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-lg transition-all hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800"
                aria-label="Next slide"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>

            {/* Carousel Indicators */}
            <div className="flex justify-center gap-3">
              {carouselItems.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-2 w-2 rounded-full transition-all ${
                    index === currentIndex
                      ? "w-8 bg-gray-900 dark:bg-gray-300"
                      : "bg-gray-400 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-400"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Description */}
            <div className="space-y-4 relative scale-[0.65] -left-20 -top-6">
              <p className="text-base text-black dark:text-gray-300 lg:text-2xl">
                {currentItem.description}
              </p>
            </div>
          </div>

          {/* Right Column - Fixed Content */}
          <div className="flex flex-col justify-center space-y-6 relative scale-[0.9] -top-20 left-38">
            <div className="space-y-6">
              <h2 className="text-2xl text-gray-900 leading-normal dark:text-gray-100 lg:text-3xl">
                Welcome to the Ministry of Works, Housing & Water Resources
                Classification Application Portal
              </h2>
              <div className="relative scale-[0.65] -left-26 -top-6">
                <p className="text-base text-black dark:text-gray-300 lg:text-2xl">
                  Official portal for Classification Certificate Application
                </p>
              </div>

              <div className="relative scale-[0.6] -left-30 -top-16">
                <Link
                  href="#"
                  className="inline-block text-base text-[#8E8EAF] hover:text-gray-400 dark:text-gray-400 dark:hover:text-gray-200 lg:text-5xl"
                >
                  Download Certification Guidelines Paper
                </Link>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-1 border-t border-black text-sm text-black dark:text-gray-400 text-left top-32 relative w-[80%]">
              <p>
                For inquiries, please contact the Classification Office of the
                Ministry.
              </p>
              <p>Phone: 00 23378478758</p>
              <p>Email: info@mofh.gov.gh</p>
              <p>Office Hours: Monday - Friday, 8:30 AM - 4:30 PM</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Fixed at Bottom */}
      <footer className="bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4 py-4 md:px-6">
          <div className="flex flex-col items-center gap-3 text-center text-xs dark:text-gray-500 lg:text-sm relative scale-[0.8] text-black">
            <p>
              This website is an official service of the Ministry of Works,
              Housing & Water Resources. All rights reserved. Unauthorized use
              is prohibited
            </p>
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
