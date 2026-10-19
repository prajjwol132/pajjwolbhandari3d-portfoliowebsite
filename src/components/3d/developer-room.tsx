"use client";

import { RoundedBox } from "@react-three/drei";

export function DeveloperRoom({ compact }: { compact: boolean }) {
  return <group>
    {!compact && <group position={[1.3, 0, -1.8]}>
      <mesh position={[0, 3, -0.3]}>
        <boxGeometry args={[30, 6, 0.2]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
      <RoundedBox args={[1.8, 4.7, 0.13]} radius={0.035} position={[1, 2.4, -0.12]} receiveShadow>
        <meshBasicMaterial color="#ffd60a" toneMapped={false} />
      </RoundedBox>
      <group position={[2.05, 0, 0.27]}>
        <RoundedBox args={[2.1, 0.11, 0.85]} radius={0.035} position={[0, 1.12, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#ffffff" roughness={0.72} />
        </RoundedBox>
        {[-0.9, 0.9].map(x => <mesh key={x} position={[x, 0.55, 0]} castShadow>
          <boxGeometry args={[0.08, 1.1, 0.68]} /><meshStandardMaterial color="#e6e6e6" />
        </mesh>)}
        <group position={[-0.15, 1.2, 0]} rotation={[0, -0.25, 0]}>
          <RoundedBox args={[0.85, 0.035, 0.52]} radius={0.016} castShadow>
            <meshStandardMaterial color="#aeb1b2" metalness={0.6} roughness={0.4} />
          </RoundedBox>
          <group position={[0, 0.29, -0.20]} rotation={[-0.13, 0, 0]}>
            <RoundedBox args={[0.85, 0.57, 0.032]} radius={0.025} castShadow>
              <meshStandardMaterial color="#303333" />
            </RoundedBox>
            <mesh position={[0, 0, 0.019]}>
              <planeGeometry args={[0.77, 0.48]} /><meshStandardMaterial color="#161919" />
            </mesh>
            {[0.45, 0.29, 0.51, 0.34, 0.40].map((width, index) => <mesh key={index} position={[-0.08, 0.13 - index * 0.065, 0.022]}>
              <planeGeometry args={[width, 0.013]} />
              <meshBasicMaterial color={index % 2 === 0 ? "#ffd60a" : "#b9c7c4"} />
            </mesh>)}
          </group>
        </group>
        <mesh position={[0.69, 1.32, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.085, 0.26, 24]} /><meshStandardMaterial color="#ffd60a" roughness={0.4} />
        </mesh>
      </group>
    </group>}
    {compact && <mesh position={[1.35, 2, -1.4]}>
      <boxGeometry args={[0.65, 4, 0.1]} /><meshBasicMaterial color="#ffd60a" toneMapped={false} />
    </mesh>}
  </group>;
}
