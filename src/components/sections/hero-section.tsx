"use client";

import { motion } from "framer-motion";
import { ArrowDown, ArrowUpRight, FileText } from "lucide-react";
import { useSmoothScroll } from "@/components/providers/smooth-scroll-provider";
import { Button } from "@/components/ui/button";

const stats = [
  { value: "10+", label: "Projects Built" },
  { value: "3+", label: "Years Exp" },
  { value: "100%", label: "Custom Code" },
];

export function HeroSection() {
  const { scrollTo } = useSmoothScroll();

  return (
    <div className="relative min-h-screen">
      <div className="container relative z-10 grid min-h-screen items-center py-20 sm:py-24 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <div className="max-w-4xl">
          <div className="mb-5 inline-flex skew-x-[-12deg] border border-red-500/50 bg-red-600/12 px-4 py-2">
            <span className="skew-x-[12deg] font-mono text-xs font-black uppercase tracking-normal text-red-300 sm:text-sm">
              FULL-STACK & 3D DEVELOPER
            </span>
          </div>

          <h1 className="max-w-[10ch] text-balance font-sans text-[clamp(3.2rem,14vw,8.5rem)] font-black uppercase leading-[0.82] tracking-normal text-white drop-shadow-[0_0_28px_rgba(255,255,255,0.08)]">
            PRAJJWOL
            <span className="block text-white/92">BHANDARI</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base font-medium leading-7 text-zinc-300 sm:text-lg">
            High-performance developer portfolio engineered like a racing cockpit:
            precise motion, immersive 3D, sharp project storytelling, and a
            Supabase-backed content pipeline.
          </p>

          <div className="mt-8 grid max-w-3xl grid-cols-3 gap-2 sm:gap-3">
            {stats.map((stat) => (
              <div
                className="border border-white/12 bg-black/42 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md sm:px-4 sm:py-4"
                key={stat.label}
              >
                <div className="font-mono text-xl font-black leading-none text-white sm:text-2xl">
                  {stat.value}
                </div>
                <div className="mt-2 text-[0.62rem] font-bold uppercase leading-tight tracking-normal text-red-300 sm:text-xs">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:flex sm:flex-row">
            <Button
              className="h-12 rounded-none border-red-500 bg-red-600 px-3 text-xs font-black uppercase text-white shadow-[0_0_32px_rgba(220,38,38,0.32)] hover:bg-red-500 sm:px-6 sm:text-sm"
              onClick={() => scrollTo("#projects", { offset: -72 })}
              type="button"
            >
              Explore Projects
              <ArrowUpRight />
            </Button>
            <Button
              asChild
              className="h-12 rounded-none border-white/16 bg-black/35 px-3 text-xs font-black uppercase text-white hover:border-red-500/70 hover:bg-red-600/12 sm:px-6 sm:text-sm"
              variant="outline"
            >
              <a href="/resume">
                <FileText />
                View Resume
              </a>
            </Button>
          </div>
        </div>
      </div>

      <button
        aria-label="Scroll to projects"
        className="absolute bottom-7 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-3 text-white/70 transition-colors hover:text-white"
        onClick={() => scrollTo("#projects", { offset: -72 })}
        type="button"
      >
        <span className="relative h-10 w-6 rounded-full border border-white/40">
          <motion.span
            animate={{ opacity: [0.25, 1, 0.25], y: [0, 13, 0] }}
            className="absolute left-1/2 top-2 size-1.5 -translate-x-1/2 rounded-full bg-red-500"
            transition={{ duration: 1.6, ease: "easeInOut", repeat: Infinity }}
          />
        </span>
        <motion.span
          animate={{ y: [0, 5, 0] }}
          className="flex size-8 items-center justify-center rounded-full border border-white/15 bg-black/30 backdrop-blur"
          transition={{ duration: 1.6, ease: "easeInOut", repeat: Infinity }}
        >
          <ArrowDown className="size-4" />
        </motion.span>
      </button>
    </div>
  );
}
