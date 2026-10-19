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

const SmoothScrollContext = createContext<SmoothScrollContextValue | null>(
  null,
);

interface SmoothScrollProviderProps {
  children: ReactNode;
}

export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  const lenisRef = useRef<Lenis | null>(null);
  const frameRef = useRef<number | null>(null);
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let instance: Lenis | null = null;
    let destroyScrollTriggerBridge: (() => void) | null = null;

    const stopFrameLoop = () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };

    const tick = (time: number) => {
      if (!instance || document.visibilityState !== "visible") {
        frameRef.current = null;
        return;
      }
      instance.raf(time);
      frameRef.current = window.requestAnimationFrame(tick);
    };

    const startFrameLoop = () => {
      if (instance && frameRef.current === null && document.visibilityState === "visible") {
        frameRef.current = window.requestAnimationFrame(tick);
      }
    };

    const destroy = () => {
      stopFrameLoop();
      destroyScrollTriggerBridge?.();
      destroyScrollTriggerBridge = null;
      instance?.destroy();
      instance = null;
      lenisRef.current = null;
      setLenis(null);
    };

    const initialize = () => {
      if (instance || motionPreference.matches) return;
      instance = new Lenis({
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
      destroyScrollTriggerBridge = syncLenisWithScrollTrigger(instance);
      startFrameLoop();
    };

    const handleMotionPreference = () => {
      if (motionPreference.matches) destroy();
      else initialize();
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") startFrameLoop();
      else stopFrameLoop();
    };

    motionPreference.addEventListener("change", handleMotionPreference);
    document.addEventListener("visibilitychange", handleVisibility);
    initialize();

    return () => {
      motionPreference.removeEventListener("change", handleMotionPreference);
      document.removeEventListener("visibilitychange", handleVisibility);
      destroy();
    };
  }, []);

  const scrollTo = useCallback(
    (target: LenisScrollTarget, options?: LenisScrollOptions) => {
      if (lenisRef.current) {
        lenisRef.current.scrollTo(target, options);
      } else if (typeof target === "number") {
        window.scrollTo({ top: target, behavior: "instant" });
      } else {
        const element =
          typeof target === "string" ? document.querySelector(target) : target;
        element?.scrollIntoView({ behavior: "instant" });
      }
    },
    [],
  );

  useEffect(() => {
    let anchorFrame = 0;
    const onAnchorClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>('a[href^="#"]')
          : null;
      const hash = anchor?.getAttribute("href");
      if (!hash || hash === "#" || anchor?.target === "_blank") return;
      const target = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (!target) return;
      event.preventDefault();
      window.history.pushState(null, "", hash);
      cancelAnimationFrame(anchorFrame);
      anchorFrame = requestAnimationFrame(() => {
        lenisRef.current?.start();
        scrollTo(target, { offset: 0, duration: 1.1 });
      });
    };
    document.addEventListener("click", onAnchorClick);
    return () => {
      document.removeEventListener("click", onAnchorClick);
      cancelAnimationFrame(anchorFrame);
    };
  }, [scrollTo]);

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
    throw new Error(
      "useSmoothScroll must be used inside SmoothScrollProvider.",
    );
  }

  return context;
}
