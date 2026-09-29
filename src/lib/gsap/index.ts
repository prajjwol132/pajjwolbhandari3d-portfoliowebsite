"use client";

import type Lenis from "@studio-freight/lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type ScrollTriggerVars = Parameters<typeof ScrollTrigger.create>[0];
type GsapTickerCallback = Parameters<typeof gsap.ticker.add>[0];

interface LenisScrollTriggerSyncOptions {
  driveLenisWithGsapTicker?: boolean;
  refreshOnInit?: boolean;
}

interface ScrubbedTimelineOptions {
  defaults?: GSAPTimelineVars["defaults"];
  scrollTrigger: ScrollTriggerVars;
}

type GSAPTimelineVars = NonNullable<Parameters<typeof gsap.timeline>[0]>;

let isScrollTriggerRegistered = false;

export function registerScrollTrigger() {
  if (typeof window === "undefined") {
    return null;
  }

  if (!isScrollTriggerRegistered) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({
      ignoreMobileResize: true,
    });
    isScrollTriggerRegistered = true;
  }

  return ScrollTrigger;
}

export function syncLenisWithScrollTrigger(
  lenis: Lenis,
  options: LenisScrollTriggerSyncOptions = {},
) {
  const ScrollTriggerPlugin = registerScrollTrigger();

  if (!ScrollTriggerPlugin) {
    return () => undefined;
  }

  const updateScrollTrigger = () => {
    ScrollTriggerPlugin.update();
  };

  let tickerCallback: GsapTickerCallback | null = null;

  lenis.on("scroll", updateScrollTrigger);

  if (options.driveLenisWithGsapTicker) {
    tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);
  }

  if (options.refreshOnInit ?? true) {
    window.requestAnimationFrame(() => ScrollTriggerPlugin.refresh());
  }

  return () => {
    lenis.off("scroll", updateScrollTrigger);

    if (tickerCallback) {
      gsap.ticker.remove(tickerCallback);
    }
  };
}

export function createScrubbedTimeline({
  defaults,
  scrollTrigger,
}: ScrubbedTimelineOptions) {
  const ScrollTriggerPlugin = registerScrollTrigger();

  return gsap.timeline({
    defaults,
    scrollTrigger: ScrollTriggerPlugin
      ? {
          scrub: 1,
          invalidateOnRefresh: true,
          ...scrollTrigger,
        }
      : undefined,
  });
}

export function pinElement(
  element: HTMLElement | null,
  scrollTrigger: ScrollTriggerVars = {},
) {
  const ScrollTriggerPlugin = registerScrollTrigger();

  if (!ScrollTriggerPlugin || !element) {
    return null;
  }

  return ScrollTriggerPlugin.create({
    trigger: element,
    start: "top top",
    end: "+=100%",
    pin: element,
    pinSpacing: false,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    ...scrollTrigger,
  });
}

export { gsap, ScrollTrigger };
