"use client";

import { Float } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import type { Group, Mesh } from "three";

export function DeveloperShowcaseModel() {
  const { viewport } = useThree();
  const groupRef = useRef<Group>(null);
  const ringRef = useRef<Mesh>(null);
  const isNarrow = viewport.width < 5;
  const modelPosition: [number, number, number] = isNarrow
    ? [0.95, -1.58, -0.45]
    : [1.72, -0.04, 0];
  const modelScale = isNarrow ? 0.42 : 0.88;

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();

    if (groupRef.current) {
      groupRef.current.rotation.y = elapsed * 0.26;
      groupRef.current.rotation.x = Math.sin(elapsed * 0.42) * 0.08;
    }

    if (ringRef.current) {
      ringRef.current.rotation.z = elapsed * -0.34;
    }
  });

  return (
    <Float
      floatIntensity={0.9}
      position={modelPosition}
      rotationIntensity={0.18}
      scale={modelScale}
      speed={1.6}
    >
      <group ref={groupRef}>
        <mesh>
          <icosahedronGeometry args={[1.08, 2]} />
          <meshStandardMaterial
            color="#8beeff"
            emissive="#0d7787"
            emissiveIntensity={0.34}
            metalness={0.28}
            roughness={0.2}
          />
        </mesh>
        <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.64, 0.012, 12, 96]} />
          <meshBasicMaterial color="#38e8ff" opacity={0.72} transparent />
        </mesh>
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[1.92, 0.008, 12, 96]} />
          <meshBasicMaterial color="#ffb84a" opacity={0.42} transparent />
        </mesh>
      </group>
    </Float>
  );
}
