"use client";

import { Grid } from "@react-three/drei";
import { CameraRig } from "@/components/3d/camera-rig";
import { LightingRig } from "@/components/3d/lighting";
import { DeveloperShowcaseModel } from "@/components/3d/models";

export function DeveloperScene() {
  return (
    <>
      <CameraRig />
      <LightingRig />
      <DeveloperShowcaseModel />
      <Grid
        args={[8, 8]}
        cellColor="#1d3d46"
        cellSize={0.55}
        cellThickness={0.45}
        fadeDistance={8}
        fadeStrength={1}
        position={[0, -1.85, 0]}
        sectionColor="#38e8ff"
        sectionSize={2.2}
      />
    </>
  );
}
