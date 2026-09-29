"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, type MutableRefObject } from "react";
import {
  Group,
  MathUtils,
  Material,
  Mesh,
  PerspectiveCamera,
  Vector3,
} from "three";
import { HeroModel } from "@/components/3d/hero-model";
import type { ModelLOD } from "@/hooks/use-performance-settings";

type Vector3Tuple = [number, number, number];

interface ScrollMotionState {
  cameraFov: number;
  cameraLookAt: Vector3Tuple;
  cameraPosition: Vector3Tuple;
  emissivePulse: number;
  modelOpacity: number;
  modelPosition: Vector3Tuple;
  modelRotation: Vector3Tuple;
  modelScale: number;
  progress: number;
}

interface ScrollControllerProps {
  isMobile: boolean;
  isWeakTouchDevice: boolean;
  modelLOD?: ModelLOD;
  scrollProgressRef: MutableRefObject<number>;
}

const DESKTOP_MOTION_STATES: ScrollMotionState[] = [
  {
    progress: 0,
    modelPosition: [0, 0, 0],
    modelRotation: [-0.08, 0.18, 0],
    modelScale: 1,
    modelOpacity: 1,
    emissivePulse: 0.38,
    cameraPosition: [0, 0.16, 4.45],
    cameraLookAt: [0, -0.08, 0],
    cameraFov: 45,
  },
  {
    progress: 0.25,
    modelPosition: [-2.5, -0.5, 0],
    modelRotation: [-0.04, Math.PI / 4, 0.02],
    modelScale: 0.94,
    modelOpacity: 1,
    emissivePulse: 0.46,
    cameraPosition: [0.45, 0.16, 5.45],
    cameraLookAt: [-1.12, -0.28, 0],
    cameraFov: 45,
  },
  {
    progress: 0.5,
    modelPosition: [0, -3.0, -1],
    modelRotation: [-Math.PI / 6, 0.24, 0],
    modelScale: 1.28,
    modelOpacity: 0.92,
    emissivePulse: 0.62,
    cameraPosition: [0, 0.62, 6.05],
    cameraLookAt: [0, -1.65, -0.65],
    cameraFov: 50,
  },
  {
    progress: 1,
    modelPosition: [0, -0.72, 2.0],
    modelRotation: [-0.02, Math.PI * 1.18, -0.02],
    modelScale: 1.38,
    modelOpacity: 0.68,
    emissivePulse: 0.9,
    cameraPosition: [0, 0.08, 4.1],
    cameraLookAt: [0, -0.52, 1.25],
    cameraFov: 39,
  },
];

const WEAK_TOUCH_STATE: ScrollMotionState = {
  progress: 0,
  modelPosition: [0.76, -1.55, 0.15],
  modelRotation: [-0.1, 0.28, 0],
  modelScale: 0.58,
  modelOpacity: 0.86,
  emissivePulse: 0.52,
  cameraPosition: [0.1, 0.18, 6.25],
  cameraLookAt: [0.28, -0.96, 0],
  cameraFov: 52,
};

function interpolateTuple(start: Vector3Tuple, end: Vector3Tuple, progress: number): Vector3Tuple {
  return [
    MathUtils.lerp(start[0], end[0], progress),
    MathUtils.lerp(start[1], end[1], progress),
    MathUtils.lerp(start[2], end[2], progress),
  ];
}

function interpolateMotionState(progress: number, states: ScrollMotionState[]): ScrollMotionState {
  const clampedProgress = MathUtils.clamp(progress, 0, 1);
  const endState = states.find((state) => clampedProgress <= state.progress) ?? states[states.length - 1];
  const endIndex = states.indexOf(endState);
  const startState = states[Math.max(0, endIndex - 1)];
  const segmentLength = endState.progress - startState.progress || 1;
  const localProgress = MathUtils.smoothstep(
    (clampedProgress - startState.progress) / segmentLength,
    0,
    1,
  );

  return {
    progress: clampedProgress,
    modelPosition: interpolateTuple(startState.modelPosition, endState.modelPosition, localProgress),
    modelRotation: interpolateTuple(startState.modelRotation, endState.modelRotation, localProgress),
    modelScale: MathUtils.lerp(startState.modelScale, endState.modelScale, localProgress),
    modelOpacity: MathUtils.lerp(startState.modelOpacity, endState.modelOpacity, localProgress),
    emissivePulse: MathUtils.lerp(startState.emissivePulse, endState.emissivePulse, localProgress),
    cameraPosition: interpolateTuple(startState.cameraPosition, endState.cameraPosition, localProgress),
    cameraLookAt: interpolateTuple(startState.cameraLookAt, endState.cameraLookAt, localProgress),
    cameraFov: MathUtils.lerp(startState.cameraFov, endState.cameraFov, localProgress),
  };
}

function applyMaterialState(root: Group, opacity: number, emissivePulse: number) {
  root.traverse((object) => {
    const mesh = object as Mesh;

    if (!mesh.isMesh) {
      return;
    }

    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

    materials.forEach((material: Material) => {
      const isNeon = material.name.includes("Neon");
      const isGlass = material.name.includes("Glass");
      const baseOpacity = isGlass ? 0.82 : 1;

      material.transparent = true;
      material.opacity = MathUtils.clamp(
        baseOpacity * opacity + (isNeon ? emissivePulse * 0.1 : 0),
        0.22,
        1,
      );
      material.needsUpdate = true;
    });
  });
}

function getReducedMobileMotionState(progress: number, elapsed: number): ScrollMotionState {
  const contactProgress = MathUtils.smoothstep(progress, 0.72, 1);

  return {
    ...WEAK_TOUCH_STATE,
    progress,
    modelPosition: [
      MathUtils.lerp(0.82, 0.32, contactProgress),
      WEAK_TOUCH_STATE.modelPosition[1] + Math.sin(elapsed * 0.72) * 0.08,
      MathUtils.lerp(0.15, 1.15, contactProgress),
    ],
    modelOpacity: MathUtils.lerp(0.88, 0.66, contactProgress),
    emissivePulse: MathUtils.lerp(0.46, 0.82, contactProgress),
  };
}

export function ScrollController({
  isMobile,
  isWeakTouchDevice,
  modelLOD = "high",
  scrollProgressRef,
}: ScrollControllerProps) {
  const modelRef = useRef<Group>(null);
  const lookAtRef = useRef(new Vector3(0, 0, 0));
  const targetLookAtRef = useRef(new Vector3(0, 0, 0));
  const { camera, pointer } = useThree();
  const motionStates = useMemo(() => DESKTOP_MOTION_STATES, []);

  useFrame((state, delta) => {
    const model = modelRef.current;

    if (!model) {
      return;
    }

    const elapsed = state.clock.getElapsedTime();
    const progress = MathUtils.clamp(scrollProgressRef.current, 0, 1);
    const targetState = isWeakTouchDevice
      ? getReducedMobileMotionState(progress, elapsed)
      : interpolateMotionState(progress, motionStates);
    const damping = (speed: number) => 1 - Math.exp(-speed * delta);
    const deviceScale = isMobile && !isWeakTouchDevice ? 0.68 : 1;
    const cursorStrength = isWeakTouchDevice ? 0 : isMobile ? 0.06 : 0.18;
    const floatY = isWeakTouchDevice ? 0 : Math.sin(elapsed * 0.82) * 0.08;
    const finalScale = targetState.modelScale * deviceScale;

    model.position.x = MathUtils.lerp(
      model.position.x,
      targetState.modelPosition[0] + pointer.x * cursorStrength,
      damping(4.4),
    );
    model.position.y = MathUtils.lerp(
      model.position.y,
      targetState.modelPosition[1] + pointer.y * cursorStrength * 0.65 + floatY,
      damping(4.2),
    );
    model.position.z = MathUtils.lerp(model.position.z, targetState.modelPosition[2], damping(4));

    model.rotation.x = MathUtils.lerp(
      model.rotation.x,
      targetState.modelRotation[0] + pointer.y * cursorStrength * 0.26,
      damping(isWeakTouchDevice ? 2.2 : 4),
    );
    model.rotation.y = MathUtils.lerp(
      model.rotation.y,
      targetState.modelRotation[1] + pointer.x * cursorStrength * 0.48,
      damping(isWeakTouchDevice ? 2.2 : 4.4),
    );
    model.rotation.z = MathUtils.lerp(model.rotation.z, targetState.modelRotation[2], damping(3.4));
    model.scale.setScalar(MathUtils.lerp(model.scale.x, finalScale, damping(4.6)));

    const perspectiveCamera = camera as PerspectiveCamera;
    const targetCameraPosition = targetState.cameraPosition;
    const targetLookAt = targetState.cameraLookAt;
    const targetFov = isMobile ? Math.max(targetState.cameraFov, 50) : targetState.cameraFov;

    camera.position.x = MathUtils.lerp(camera.position.x, targetCameraPosition[0], damping(3.8));
    camera.position.y = MathUtils.lerp(camera.position.y, targetCameraPosition[1], damping(3.8));
    camera.position.z = MathUtils.lerp(camera.position.z, targetCameraPosition[2], damping(3.8));

    targetLookAtRef.current.set(targetLookAt[0], targetLookAt[1], targetLookAt[2]);
    lookAtRef.current.lerp(targetLookAtRef.current, damping(4));
    camera.lookAt(lookAtRef.current);

    if ("fov" in perspectiveCamera) {
      perspectiveCamera.fov = MathUtils.lerp(perspectiveCamera.fov, targetFov, damping(3.2));
      perspectiveCamera.updateProjectionMatrix();
    }

    const pulse = targetState.emissivePulse + Math.sin(elapsed * 4.2) * 0.06 * progress;
    applyMaterialState(model, targetState.modelOpacity, pulse);
  });

  return (
    <group ref={modelRef}>
      <HeroModel isMobile={isMobile} modelLOD={modelLOD} scrollDriven />
    </group>
  );
}
