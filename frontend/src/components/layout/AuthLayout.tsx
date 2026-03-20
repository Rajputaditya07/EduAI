import React from "react";
import { motion } from "framer-motion";

interface AuthLayoutProps {
  children: React.ReactNode;
}

const prefersReduced =
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const pageVariants = prefersReduced
  ? {}
  : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0 } };

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Left branded panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-foreground p-12 relative overflow-hidden">
        {/* Geometric pattern */}
        <div className="absolute inset-0 opacity-[0.04]">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10">
          <h1 className="font-serif text-2xl text-background">EduAI</h1>
        </div>

        <div className="relative z-10">
          <h2 className="font-serif text-2xl text-background leading-tight max-w-md">
            Intelligent grading that gives every student a voice.
          </h2>
          <p className="mt-4 text-sm text-background/60 max-w-sm">
            Teachers create. Students submit. AI provides structured, criterion-level feedback in seconds.
          </p>
        </div>

        <div className="relative z-10">
          <p className="text-xs text-background/40">© {new Date().getFullYear()} EduAI</p>
        </div>
      </div>

      {/* Right form area */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-12 bg-background">
        <motion.div
          className="w-full max-w-md"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
