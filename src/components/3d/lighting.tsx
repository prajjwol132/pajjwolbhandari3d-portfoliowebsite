"use client";

export function LightingRig() {
  return (
    <>
      <ambientLight intensity={0.38} />
      <directionalLight color="#b7f7ff" intensity={1.1} position={[4, 5, 6]} />
      <pointLight color="#3ee7ff" intensity={14} position={[-3.2, 1.6, 2.4]} />
      <pointLight color="#ffb84a" intensity={9} position={[3.5, -1.2, 2.2]} />
    </>
  );
}
