"use client";

import { Html, useGLTF, useProgress } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Color,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  Object3D,
} from "three";
import type { GLTF } from "three-stdlib";
import type { ModelLOD } from "@/hooks/use-performance-settings";
import { disposeObject3D } from "@/lib/three/asset-cleanup";

const HERO_MODEL_PATH = "/models/developer-workstation.gltf";

interface HeroModelProps {
  isMobile?: boolean;
  modelLOD?: ModelLOD;
  scrollDriven?: boolean;
}

interface RuntimeMaterials {
  darkMetal: MeshPhysicalMaterial;
  glassPanel: MeshPhysicalMaterial;
  keyboard: MeshPhysicalMaterial;
  redNeon: MeshBasicMaterial;
  cyanNeon: MeshBasicMaterial;
}

function createRuntimeMaterials(): RuntimeMaterials {
  return {
    darkMetal: new MeshPhysicalMaterial({
      name: "DarkMetal",
      color: new Color("#090b10"),
      metalness: 0.82,
      opacity: 1,
      roughness: 0.24,
      transparent: true,
      clearcoat: 0.72,
      clearcoatRoughness: 0.18,
      envMapIntensity: 1.25,
    }),
    glassPanel: new MeshPhysicalMaterial({
      name: "GlassPanel",
      color: new Color("#101823"),
      emissive: new Color("#111827"),
      emissiveIntensity: 0.22,
      metalness: 0.42,
      opacity: 0.82,
      roughness: 0.12,
      transmission: 0.28,
      transparent: true,
      clearcoat: 0.9,
      clearcoatRoughness: 0.08,
      envMapIntensity: 1.5,
    }),
    keyboard: new MeshPhysicalMaterial({
      name: "KeyboardMetal",
      color: new Color("#08090d"),
      metalness: 0.66,
      opacity: 1,
      roughness: 0.34,
      transparent: true,
      clearcoat: 0.5,
      clearcoatRoughness: 0.2,
      envMapIntensity: 0.9,
    }),
    redNeon: new MeshBasicMaterial({
      name: "RedNeon",
      color: new Color("#ff182f"),
      opacity: 1,
      toneMapped: false,
      transparent: true,
    }),
    cyanNeon: new MeshBasicMaterial({
      name: "CyanNeon",
      color: new Color("#55ecff"),
      opacity: 1,
      toneMapped: false,
      transparent: true,
    }),
  };
}

function materialForNode(name: string, materials: RuntimeMaterials) {
  if (name.includes("RedAccent")) {
    return materials.redNeon;
  }

  if (name.includes("CyanAccent")) {
    return materials.cyanNeon;
  }

  if (name.includes("Glass")) {
    return materials.glassPanel;
  }

  if (name.startsWith("Key_")) {
    return materials.keyboard;
  }

  return materials.darkMetal;
}

export function HeroModel({
  isMobile = false,
  modelLOD = "high",
  scrollDriven = false,
}: HeroModelProps) {
  const gltf = useGLTF(HERO_MODEL_PATH) as GLTF;
  const groupRef = useRef<Group>(null);
  const hoverTargetRef = useRef(0);
  const [isHovered, setIsHovered] = useState(false);
  const { pointer, viewport } = useThree();

  const materials = useMemo(() => createRuntimeMaterials(), []);

  const modelScene = useMemo(() => {
    const scene = gltf.scene.clone(true);
    const isLowLOD = modelLOD === "low";
    let meshIndex = 0;

    scene.traverse((object: Object3D) => {
      const mesh = object as Mesh;

      if (!mesh.isMesh) {
        return;
      }

      mesh.geometry = mesh.geometry.clone();
      mesh.castShadow = !isLowLOD;
      mesh.receiveShadow = !isLowLOD;
      mesh.frustumCulled = true;
      mesh.material = materialForNode(mesh.name, materials);

      if (isLowLOD && mesh.name.startsWith("Key_")) {
        mesh.visible = meshIndex % 2 === 0;
      }

      meshIndex += 1;
    });

    return scene;
  }, [gltf.scene, materials, modelLOD]);

  useEffect(() => {
    return () => {
      disposeObject3D(modelScene);
      Object.values(materials).forEach((material) => material.dispose());
    };
  }, [materials, modelScene]);

  useEffect(() => {
    document.body.style.cursor = isHovered ? "grab" : "";

    return () => {
      document.body.style.cursor = "";
    };
  }, [isHovered]);

  useFrame((state, delta) => {
    const group = groupRef.current;

    if (!group || scrollDriven) {
      return;
    }

    const elapsed = state.clock.getElapsedTime();
    const baseX = isMobile ? 1.08 : viewport.width < 8 ? 1.55 : 2.22;
    const baseY = isMobile ? -2.16 : -0.12;
    const damping = (speed: number) => 1 - Math.exp(-speed * delta);
    const targetX = MathUtils.clamp(pointer.x * (isMobile ? 0.22 : 0.42), -0.6, 0.6);
    const targetY = MathUtils.clamp(pointer.y * (isMobile ? 0.16 : 0.26), -0.34, 0.34);
    const targetRotationY = pointer.x * (isMobile ? 0.2 : 0.36) + hoverTargetRef.current * 0.08;
    const targetRotationX =
      -0.08 + pointer.y * (isMobile ? 0.08 : 0.14) + Math.sin(elapsed * 0.72) * 0.018;

    group.position.x = MathUtils.lerp(group.position.x, baseX + targetX, damping(3.8));
    group.position.y = MathUtils.lerp(group.position.y, baseY + targetY, damping(3.2));
    group.rotation.y = MathUtils.lerp(group.rotation.y, targetRotationY, damping(3.4));
    group.rotation.x = MathUtils.lerp(group.rotation.x, targetRotationX, damping(3.1));
    group.rotation.z = MathUtils.lerp(group.rotation.z, pointer.x * -0.035, damping(2.8));

    const lodScale = modelLOD === "low" ? 0.92 : 1;
    const targetScale = (isHovered ? 1.035 : 1) * (isMobile ? 0.56 : viewport.width < 8 ? 0.78 : 0.9) * lodScale;
    group.scale.setScalar(MathUtils.lerp(group.scale.x, targetScale, damping(4)));
  });

  return (
    <group
      ref={groupRef}
      onPointerEnter={() => {
        if (scrollDriven) {
          return;
        }

        hoverTargetRef.current = 1;
        setIsHovered(true);
      }}
      onPointerLeave={() => {
        if (scrollDriven) {
          return;
        }

        hoverTargetRef.current = 0;
        setIsHovered(false);
      }}
      position={scrollDriven ? [0, 0, 0] : isMobile ? [1.08, -2.16, 0] : [2.22, -0.12, 0]}
      rotation={scrollDriven ? [0, 0, 0] : [-0.08, 0.2, 0]}
      scale={scrollDriven ? 1 : undefined}
    >
      <primitive object={modelScene} />
      <pointLight
        color="#ff1838"
        intensity={modelLOD === "low" ? 2.2 : isMobile ? 4.2 : 7.4}
        position={[-1.2, 0.16, 1.2]}
      />
      <pointLight
        color="#49e7ff"
        intensity={modelLOD === "low" ? 1.5 : isMobile ? 2.8 : 4.6}
        position={[1.35, 0.82, 1.1]}
      />
    </group>
  );
}

export function HeroModelProgress() {
  const { progress } = useProgress();

  return (
    <Html center>
      <div className="flex items-center gap-3 rounded-md border border-red-500/40 bg-black/70 px-4 py-3 font-mono text-xs font-semibold uppercase text-red-100 shadow-[0_0_40px_rgba(255,24,47,0.22)] backdrop-blur-md">
        <span className="size-3 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
        {Math.round(progress)}%
      </div>
    </Html>
  );
}

useGLTF.preload(HERO_MODEL_PATH);
