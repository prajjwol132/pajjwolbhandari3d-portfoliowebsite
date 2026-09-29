"use client";

import { AdaptiveDpr, ContactShadows, Environment, PerformanceMonitor, Preload } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { PCFSoftShadowMap, type WebGLRenderer } from "three";
import { HeroModel, HeroModelProgress } from "@/components/3d/hero-model";
import { ResponsiveViewController } from "@/components/3d/responsive-view-controller";
import { ScrollController } from "@/components/3d/scroll-controller";
import { WebGLSupportGate } from "@/components/3d/webgl-fallback";
import { usePerformanceSettings, type ModelLOD } from "@/hooks/use-performance-settings";
import { disposeRenderer } from "@/lib/three/asset-cleanup";
import { cn } from "@/lib/utils";

type Vector3Tuple = [number, number, number];

interface DeviceSettings {
  cameraPosition: Vector3Tuple;
  contactBlur: number;
  contactFar: number;
  contactOpacity: number;
  contactScale: number;
  fov: number;
  isMobile: boolean;
  isLowTier: boolean;
  isWeakTouchDevice: boolean;
  modelLOD: ModelLOD;
  shadowMapSize: number;
}

interface SceneCanvasProps {
  className?: string;
  mode?: "hero" | "scroll";
  scrollProgressRef?: MutableRefObject<number>;
}

function getSceneDeviceSettings({
  isLowTier,
  isMobile,
  isTouchDevice,
  modelLOD,
  shadowMapSize,
}: {
  isLowTier: boolean;
  isMobile: boolean;
  isTouchDevice: boolean;
  modelLOD: ModelLOD;
  shadowMapSize: number;
}): DeviceSettings {
  const isWeakTouchDevice = isTouchDevice && isMobile;

  if (isLowTier || isMobile) {
    return {
      cameraPosition: [0, 0, 8],
      contactBlur: isWeakTouchDevice ? 1.2 : 1.75,
      contactFar: isWeakTouchDevice ? 2.1 : 2.6,
      contactOpacity: isWeakTouchDevice ? 0.28 : 0.38,
      contactScale: isWeakTouchDevice ? 4.8 : 5.8,
      fov: 52,
      isMobile,
      isLowTier,
      isWeakTouchDevice,
      modelLOD,
      shadowMapSize,
    };
  }

  return {
    cameraPosition: [0, 0, 5],
    contactBlur: 2.5,
    contactFar: 4,
    contactOpacity: 0.6,
    contactScale: 10,
    fov: 45,
    isMobile,
    isLowTier,
    isWeakTouchDevice,
    modelLOD,
    shadowMapSize,
  };
}

function HeroLights({ settings }: { settings: DeviceSettings }) {
  return (
    <>
      <ambientLight color="#6f7480" intensity={settings.isMobile ? 0.42 : 0.34} />
      <directionalLight
        castShadow
        color="#ffffff"
        intensity={settings.isMobile ? 1.45 : 1.85}
        position={[4.5, 5.2, 4.8]}
        shadow-bias={-0.0003}
        shadow-mapSize-height={settings.shadowMapSize}
        shadow-mapSize-width={settings.shadowMapSize}
      />
      <directionalLight color="#ff1935" intensity={settings.isMobile ? 0.62 : 0.86} position={[-4.2, 1.2, 2.4]} />
      <pointLight color="#49edff" intensity={settings.isMobile ? 4.5 : 6.5} position={[1.6, 2.2, 2.4]} />
    </>
  );
}

export function SceneCanvas({ className, mode = "hero", scrollProgressRef }: SceneCanvasProps) {
  const performanceSettings = usePerformanceSettings();
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const settings = useMemo(
    () =>
      getSceneDeviceSettings({
        isLowTier: performanceSettings.isLowTier,
        isMobile: performanceSettings.isMobile,
        isTouchDevice: performanceSettings.isTouchDevice,
        modelLOD: performanceSettings.modelLOD,
        shadowMapSize: performanceSettings.shadowMapSize,
      }),
    [
      performanceSettings.isLowTier,
      performanceSettings.isMobile,
      performanceSettings.isTouchDevice,
      performanceSettings.modelLOD,
      performanceSettings.shadowMapSize,
    ],
  );
  const [performanceDpr, setPerformanceDpr] = useState(performanceSettings.dpr[1]);

  useEffect(() => {
    setPerformanceDpr(performanceSettings.dpr[1]);
  }, [performanceSettings.dpr]);

  useEffect(() => {
    return () => {
      disposeRenderer(rendererRef.current);
      rendererRef.current = null;
    };
  }, []);

  const camera = useMemo(
    () => ({
      far: 1000,
      fov: settings.fov,
      near: 0.1,
      position: settings.cameraPosition,
    }),
    [settings],
  );

  return (
    <WebGLSupportGate
      className={cn("pointer-events-auto absolute inset-0 z-0 h-full w-full", className)}
      fallbackClassName={cn("pointer-events-none absolute inset-0 z-0 h-full w-full", className)}
    >
      <div
        aria-hidden="true"
        className={cn("pointer-events-auto absolute inset-0 z-0 h-full w-full", className)}
      >
      <Canvas
        camera={camera}
        dpr={[1, performanceDpr]}
        gl={{
          alpha: true,
          antialias: !settings.isLowTier && !settings.isWeakTouchDevice,
          depth: true,
          powerPreference: "high-performance",
          stencil: false,
        }}
        onCreated={({ gl }) => {
          rendererRef.current = gl;
        }}
        shadows={{ enabled: true, type: PCFSoftShadowMap }}
      >
        <PerformanceMonitor
          bounds={(refreshRate) => (refreshRate > 90 ? [50, 90] : [45, 60])}
          onDecline={() => setPerformanceDpr((current) => Math.max(1, current - 0.25))}
          onIncline={() =>
            setPerformanceDpr((current) => Math.min(performanceSettings.dpr[1], current + 0.25))
          }
        />
        <ResponsiveViewController enabled={mode === "hero"} />
        <HeroLights settings={settings} />
        <Suspense fallback={<HeroModelProgress />}>
          {mode === "scroll" && scrollProgressRef ? (
            <ScrollController
              isMobile={settings.isMobile}
              isWeakTouchDevice={settings.isWeakTouchDevice}
              modelLOD={settings.modelLOD}
              scrollProgressRef={scrollProgressRef}
            />
          ) : (
            <HeroModel isMobile={settings.isMobile} modelLOD={settings.modelLOD} />
          )}
        </Suspense>
        <ContactShadows
          blur={settings.contactBlur}
          far={settings.contactFar}
          frames={settings.isMobile || settings.isWeakTouchDevice ? 1 : Infinity}
          opacity={settings.contactOpacity}
          position={[0, -1.5, 0]}
          resolution={settings.isWeakTouchDevice ? 192 : settings.isMobile ? 256 : 512}
          scale={settings.contactScale}
        />
        <Suspense fallback={null}>
          <Environment preset="city" />
        </Suspense>
        <AdaptiveDpr pixelated />
        <Preload all />
      </Canvas>
      </div>
    </WebGLSupportGate>
  );
}
