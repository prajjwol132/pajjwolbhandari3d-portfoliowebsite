"use client";

import Lenis from "@studio-freight/lenis";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { syncLenisWithScrollTrigger } from "@/lib/gsap/smooth-scroll";

type LenisScrollTarget = Parameters<Lenis["scrollTo"]>[0];
type LenisScrollOptions = Parameters<Lenis["scrollTo"]>[1];

interface SmoothScrollContextValue {
  lenis: Lenis | null;
  scrollTo: (target: LenisScrollTarget, options?: LenisScrollOptions) => void;
  start: () => void;
  stop: () => void;
}

const SmoothScrollContext = createContext<SmoothScrollContextValue | null>(null);

interface SmoothScrollProviderProps {
  children: ReactNode;
}

export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  const lenisRef = useRef<Lenis | null>(null);
  const frameRef = useRef<number | null>(null);
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      return undefined;
    }

    const instance = new Lenis({
      duration: 1.14,
      easing: (time: number) => Math.min(1, 1.001 - 2 ** (-10 * time)),
      gestureOrientation: "vertical",
      smoothWheel: true,
      syncTouch: false,
      touchMultiplier: 1.15,
      wheelMultiplier: 0.82,
    });

    lenisRef.current = instance;
    setLenis(instance);

    const destroyScrollTriggerBridge = syncLenisWithScrollTrigger(instance);

    const raf = (time: number) => {
      instance.raf(time);
      frameRef.current = window.requestAnimationFrame(raf);
    };

    frameRef.current = window.requestAnimationFrame(raf);

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }

      destroyScrollTriggerBridge();
      instance.destroy();
      lenisRef.current = null;
      setLenis(null);
    };
  }, []);

  const scrollTo = useCallback(
    (target: LenisScrollTarget, options?: LenisScrollOptions) => {
      lenisRef.current?.scrollTo(target, options);
    },
    [],
  );

  const start = useCallback(() => {
    lenisRef.current?.start();
  }, []);

  const stop = useCallback(() => {
    lenisRef.current?.stop();
  }, []);

  const value = useMemo<SmoothScrollContextValue>(
    () => ({
      lenis,
      scrollTo,
      start,
      stop,
    }),
    [lenis, scrollTo, start, stop],
  );

  return (
    <SmoothScrollContext.Provider value={value}>
      {children}
    </SmoothScrollContext.Provider>
  );
}

export function useSmoothScroll() {
  const context = useContext(SmoothScrollContext);

  if (!context) {
    throw new Error("useSmoothScroll must be used inside SmoothScrollProvider.");
  }

  return context;
}
