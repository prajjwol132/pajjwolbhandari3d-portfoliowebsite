import { createHash } from "node:crypto";
import {
  copyFile,
  mkdir,
  readdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const source = process.argv[2];
if (!source)
  throw new Error("Pass the folder containing the About section photos.");
const root = path.resolve(source);
const output = path.resolve("public/media/about");
await mkdir(output, { recursive: true });
await mkdir("src/data", { recursive: true });

async function findPhotos(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await findPhotos(file)));
    else if (/\.(jpe?g|png|webp|avif|tiff?)$/i.test(entry.name))
      files.push(file);
  }
  return files;
}

const files = (await findPhotos(root)).sort();
if (!files.length) throw new Error("No supported photographs were found.");
const photos = [];
for (const input of files) {
  const bytes = await readFile(input);
  const relative = path.relative(root, input).replaceAll("\\", "/");
  const id = createHash("sha256").update(relative).digest("hex").slice(0, 12);
  const contentHash = createHash("sha256")
    .update(bytes)
    .digest("hex")
    .slice(0, 10);
  const metadata = await sharp(bytes).metadata();
  if (!metadata.width || !metadata.height)
    throw new Error(`Cannot read dimensions: ${relative}`);
  const rotated = metadata.orientation >= 5 && metadata.orientation <= 8;
  const width = rotated ? metadata.height : metadata.width;
  const height = rotated ? metadata.width : metadata.height;
  const extension = path.extname(input).toLowerCase();
  const requiresConversion = /\.tiff?$/.test(extension);
  const filename = `${id}-${contentHash}${requiresConversion ? ".png" : extension}`;
  if (requiresConversion)
    await sharp(bytes).rotate().png().toFile(path.join(output, filename));
  else await copyFile(input, path.join(output, filename));
  photos.push({
    id,
    src: `/media/about/${filename}`,
    width,
    height,
    sourceName: path.basename(input),
  });
}

// A stable shuffled order avoids layout changes between server render and hydration.
photos.sort((a, b) => a.id.localeCompare(b.id));
await writeFile(
  "src/data/about-photos.json",
  `${JSON.stringify(photos, null, 2)}\n`,
);
console.log(
  JSON.stringify(
    {
      imported: photos.length,
      nativeDimensions: photos.map(({ width, height }) => `${width}x${height}`),
      manifest: "src/data/about-photos.json",
    },
    null,
    2,
  ),
);
