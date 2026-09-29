"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useState, type RefObject } from "react";
import {
  MathUtils,
  Object3D,
  PerspectiveCamera,
  Vector3,
} from "three";

type Vector3Tuple = [number, number, number];

export interface ResponsiveViewState {
  aspect: number;
  cameraPosition: Vector3Tuple;
  fov: number;
  isPortrait: boolean;
  modelScale: number;
}

interface ResponsiveViewControllerProps {
  debounceMs?: number;
  enabled?: boolean;
  modelRef?: RefObject<Object3D | null>;
}

function getViewportSize() {
  if (typeof window === "undefined") {
    return { height: 900, width: 1440 };
  }

  return {
    height: Math.max(window.innerHeight, 1),
    width: Math.max(window.innerWidth, 1),
  };
}

export function calculateResponsiveViewState(width: number, height: number): ResponsiveViewState {
  const aspect = width / Math.max(height, 1);
  const isPortrait = aspect < 1;

  if (isPortrait) {
    return {
      aspect,
      cameraPosition: [0, 0, 8],
      fov: 52,
      isPortrait,
      modelScale: 0.7,
    };
  }

  return {
    aspect,
    cameraPosition: [0, 0, 5],
    fov: 45,
    isPortrait,
    modelScale: 1,
  };
}

export function ResponsiveViewController({
  debounceMs = 150,
  enabled = true,
  modelRef,
}: ResponsiveViewControllerProps) {
  const { camera, size } = useThree();
  const [viewState, setViewState] = useState<ResponsiveViewState>(() =>
    calculateResponsiveViewState(size.width || getViewportSize().width, size.height || getViewportSize().height),
  );
  const targetPosition = useMemo(() => new Vector3(), []);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let debounceId: number | undefined;

    const updateViewState = () => {
      window.clearTimeout(debounceId);
      debounceId = window.setTimeout(() => {
        const { height, width } = getViewportSize();
        setViewState(calculateResponsiveViewState(width, height));
      }, debounceMs);
    };

    updateViewState();
    window.addEventListener("resize", updateViewState, { passive: true });
    window.addEventListener("orientationchange", updateViewState, { passive: true });

    return () => {
      window.clearTimeout(debounceId);
      window.removeEventListener("resize", updateViewState);
      window.removeEventListener("orientationchange", updateViewState);
    };
  }, [debounceMs, enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    setViewState(calculateResponsiveViewState(size.width, size.height));
  }, [enabled, size.height, size.width]);

  useFrame((_, delta) => {
    if (!enabled) {
      return;
    }

    const damping = 1 - Math.exp(-8 * delta);
    const perspectiveCamera = camera as PerspectiveCamera;

    targetPosition.set(...viewState.cameraPosition);
    camera.position.lerp(targetPosition, damping);

    if ("fov" in perspectiveCamera) {
      perspectiveCamera.fov = MathUtils.lerp(perspectiveCamera.fov, viewState.fov, damping);
      perspectiveCamera.near = 0.1;
      perspectiveCamera.far = 1000;
      perspectiveCamera.updateProjectionMatrix();
    }

    if (modelRef?.current) {
      const nextScale = MathUtils.lerp(modelRef.current.scale.x, viewState.modelScale, damping);
      modelRef.current.scale.setScalar(nextScale);
    }
  });

  return null;
}
