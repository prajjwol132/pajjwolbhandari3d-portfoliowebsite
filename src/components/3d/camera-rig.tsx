"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { MathUtils } from "three";

export function CameraRig() {
  const { camera, pointer } = useThree();

  useFrame(() => {
    camera.position.x = MathUtils.lerp(camera.position.x, pointer.x * 0.28, 0.045);
    camera.position.y = MathUtils.lerp(camera.position.y, 0.4 + pointer.y * 0.18, 0.045);
    camera.lookAt(0, 0, 0);
  });

  return null;
}
