import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";

const root = process.cwd();
const publicDir = resolve(root, "public");
const sourceFiles = [
  "src/components/3d/hero-model.tsx",
  "src/hooks/use-projects.ts",
  "src/components/sections/reference-portfolio-page.tsx",
];
const assetPattern = /["'`]\/((?:models|media|textures|videos|assets)\/[^"'`)]+)/g;
const errors = [];
const warnings = [];

function assertFile(path, label) {
  if (!existsSync(path)) {
    errors.push(`Missing ${label}: ${path}`);
    return;
  }

  const stats = statSync(path);

  if (!stats.isFile()) {
    errors.push(`${label} is not a file: ${path}`);
    return;
  }

  if (stats.size === 0) {
    errors.push(`${label} is empty: ${path}`);
  }
}

for (const relativeFile of sourceFiles) {
  const absoluteFile = resolve(root, relativeFile);

  if (!existsSync(absoluteFile)) {
    warnings.push(`Skipped missing source scan file: ${relativeFile}`);
    continue;
  }

  const source = readFileSync(absoluteFile, "utf8");
  const matches = source.matchAll(assetPattern);

  for (const match of matches) {
    assertFile(resolve(publicDir, match[1]), `public asset referenced by ${relativeFile}`);
  }
}

const gltfPath = resolve(publicDir, "models/developer-workstation.gltf");
assertFile(gltfPath, "hero GLTF model");

if (existsSync(gltfPath) && extname(gltfPath) === ".gltf") {
  try {
    const gltf = JSON.parse(readFileSync(gltfPath, "utf8"));
    const linkedUris = [
      ...(Array.isArray(gltf.buffers) ? gltf.buffers : []),
      ...(Array.isArray(gltf.images) ? gltf.images : []),
    ]
      .map((entry) => entry?.uri)
      .filter((uri) => typeof uri === "string" && !uri.startsWith("data:"));

    for (const uri of linkedUris) {
      assertFile(join(publicDir, "models", uri), `GLTF linked asset ${uri}`);
    }
  } catch (error) {
    errors.push(
      `Unable to parse hero GLTF model: ${error instanceof Error ? error.message : "unknown error"}`,
    );
  }
}

if (errors.length > 0) {
  console.error("Asset validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log("Asset validation passed.");

if (warnings.length > 0) {
  console.warn("Warnings:");
  warnings.forEach((warning) => console.warn(`- ${warning}`));
}
