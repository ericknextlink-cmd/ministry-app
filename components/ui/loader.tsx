"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface LoaderProps {
  size?: number; // Size of the logo
  fullScreen?: boolean; // Whether to take up the full screen
  text?: string; // Optional loading text
}

export function Loader({ size = 80, fullScreen = true, text = "Loading..." }: LoaderProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Logo Container with Pulse Effect */}
      <div className="relative flex items-center justify-center">
        {/* Ripple Effect Circles */}
        <motion.div
          className="absolute rounded-full border border-blue-200 dark:border-blue-900"
          initial={{ width: size, height: size, opacity: 0.5 }}
          animate={{
            width: [size, size * 1.5, size * 2],
            height: [size, size * 1.5, size * 2],
            opacity: [0.5, 0.2, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
        <motion.div
          className="absolute rounded-full border border-blue-100 dark:border-blue-900/50"
          initial={{ width: size, height: size, opacity: 0.5 }}
          animate={{
            width: [size, size * 1.8, size * 2.5],
            height: [size, size * 1.8, size * 2.5],
            opacity: [0.3, 0.1, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeOut",
            delay: 0.5,
          }}
        />

        {/* Central Logo */}
        <motion.div
          className="relative z-10"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="relative" style={{ width: size, height: size }}>
            <Image
              src="/ministry-1.png"
              alt="Ministry Logo"
              fill
              sizes={`${size}px`}
              className="object-contain"
              priority
            />
          </div>
        </motion.div>
      </div>

      {/* Loading Text */}
      {text && (
        <motion.p
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-sm font-medium text-gray-500 dark:text-gray-400 tracking-wider uppercase"
        >
          {text}
        </motion.p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
}
