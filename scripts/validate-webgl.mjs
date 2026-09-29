import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const checks = [
  {
    file: "src/components/3d/scene-canvas.tsx",
    required: [
      "usePerformanceSettings",
      "WebGLSupportGate",
      "disposeRenderer",
      "PerformanceMonitor",
      "ResponsiveViewController",
    ],
  },
  {
    file: "src/components/3d/hero-model.tsx",
    required: ["modelLOD", "disposeObject3D", "mesh.geometry = mesh.geometry.clone()"],
  },
  {
    file: "src/lib/three/asset-cleanup.ts",
    required: ["disposeObject3D", "disposeMaterial", "disposeTexture", "disposeRenderer"],
  },
  {
    file: "src/components/3d/webgl-fallback.tsx",
    required: ["webgl2", "WebGLFallback", "WebGLSupportGate"],
  },
];

const errors = [];

for (const check of checks) {
  const filePath = resolve(process.cwd(), check.file);

  if (!existsSync(filePath)) {
    errors.push(`Missing required WebGL performance file: ${check.file}`);
    continue;
  }

  const source = readFileSync(filePath, "utf8");

  for (const token of check.required) {
    if (!source.includes(token)) {
      errors.push(`${check.file} is missing required token: ${token}`);
    }
  }
}

if (errors.length > 0) {
  console.error("WebGL performance validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log("WebGL performance validation passed.");
