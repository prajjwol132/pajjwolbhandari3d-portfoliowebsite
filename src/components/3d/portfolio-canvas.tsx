"use client";

import { AdaptiveDpr, Preload } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
import type { WebGLRenderer } from "three";
import { DeveloperScene } from "@/components/3d/scene";
import { WebGLSupportGate } from "@/components/3d/webgl-fallback";
import { usePerformanceSettings } from "@/hooks/use-performance-settings";
import { disposeRenderer } from "@/lib/three/asset-cleanup";

export function PortfolioCanvas() {
  const performanceSettings = usePerformanceSettings();
  const rendererRef = useRef<WebGLRenderer | null>(null);

  useEffect(() => {
    return () => {
      disposeRenderer(rendererRef.current);
      rendererRef.current = null;
    };
  }, []);

  return (
    <WebGLSupportGate className="pointer-events-none absolute inset-0 h-full w-full">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full">
        <Canvas
          camera={{ far: 80, fov: performanceSettings.isMobile ? 50 : 42, near: 0.1, position: [0, 0.4, 5.6] }}
          dpr={performanceSettings.dpr}
          gl={{
            alpha: true,
            antialias: !performanceSettings.isLowTier,
            depth: true,
            powerPreference: "high-performance",
            stencil: false,
          }}
          onCreated={({ gl }) => {
            rendererRef.current = gl;
          }}
        >
          <Suspense fallback={null}>
            <DeveloperScene />
            <AdaptiveDpr pixelated />
            <Preload all />
          </Suspense>
        </Canvas>
      </div>
    </WebGLSupportGate>
  );
}
