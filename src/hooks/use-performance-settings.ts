"use client";

import { useEffect, useMemo, useState } from "react";

export type HardwareTier = "low" | "high";
export type ModelLOD = "low" | "high";
export type DprTuple = [number, number];

export interface PerformanceSettings {
  dpr: DprTuple;
  enablePostProcessing: boolean;
  hardwareConcurrency: number;
  hardwareTier: HardwareTier;
  isDesktop: boolean;
  isLowTier: boolean;
  isMobile: boolean;
  isTouchDevice: boolean;
  modelLOD: ModelLOD;
  pixelRatio: number;
  shadowMapSize: 512 | 2048;
}

const DEFAULT_HARDWARE_CONCURRENCY = 4;

function getNavigatorHardwareConcurrency() {
  if (typeof navigator === "undefined") {
    return DEFAULT_HARDWARE_CONCURRENCY;
  }

  return navigator.hardwareConcurrency || DEFAULT_HARDWARE_CONCURRENCY;
}

function getNavigatorTouchState() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return navigator.maxTouchPoints > 0;
}

function getViewportWidth() {
  if (typeof window === "undefined") {
    return 1024;
  }

  return window.innerWidth;
}

function getDevicePixelRatio() {
  if (typeof window === "undefined") {
    return 1;
  }

  return window.devicePixelRatio || 1;
}

export function resolvePerformanceSettings(): PerformanceSettings {
  const viewportWidth = getViewportWidth();
  const hardwareConcurrency = getNavigatorHardwareConcurrency();
  const pixelRatio = getDevicePixelRatio();
  const isTouchDevice = getNavigatorTouchState();
  const isMobile = viewportWidth < 768 || isTouchDevice && viewportWidth < 900;
  const isLowTier = viewportWidth < 768 || hardwareConcurrency <= 4;
  const isDesktop = viewportWidth >= 768 && hardwareConcurrency > 4;
  const hardwareTier: HardwareTier = isLowTier ? "low" : "high";

  return {
    dpr: isLowTier ? [1, 1] : [1, Math.min(pixelRatio, 2)],
    enablePostProcessing: isDesktop,
    hardwareConcurrency,
    hardwareTier,
    isDesktop,
    isLowTier,
    isMobile,
    isTouchDevice,
    modelLOD: isLowTier ? "low" : "high",
    pixelRatio,
    shadowMapSize: isLowTier ? 512 : 2048,
  };
}

export function usePerformanceSettings(debounceMs = 150): PerformanceSettings {
  const [settings, setSettings] = useState<PerformanceSettings>(() =>
    resolvePerformanceSettings(),
  );

  useEffect(() => {
    let debounceId: number | undefined;

    const updateSettings = () => {
      window.clearTimeout(debounceId);
      debounceId = window.setTimeout(() => {
        setSettings(resolvePerformanceSettings());
      }, debounceMs);
    };

    updateSettings();
    window.addEventListener("resize", updateSettings, { passive: true });
    window.addEventListener("orientationchange", updateSettings, { passive: true });

    return () => {
      window.clearTimeout(debounceId);
      window.removeEventListener("resize", updateSettings);
      window.removeEventListener("orientationchange", updateSettings);
    };
  }, [debounceMs]);

  return useMemo(() => settings, [settings]);
}
