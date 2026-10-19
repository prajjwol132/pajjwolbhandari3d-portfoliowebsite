import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const source = "assets/character-source/turnaround-cutouts.png";
const output = "public/media/character/rotation";
const frame = { width: 560, height: 840, baseline: 820, bodyHeight: 780 };
// Separate columns and chair axes in the extracted reference, not face positions.
const views = [
  { name: "front", left: 0, right: 525, axis: 263 },
  { name: "three-quarter", left: 525, right: 960, axis: 725 },
  { name: "profile", left: 960, right: 1448, axis: 1240 },
  { name: "back", left: 1448, right: 1942, axis: 1682 },
];

await mkdir(output, { recursive: true });
const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
if (info.width !== 1942 || info.height !== 809 || info.channels !== 4) {
  throw new Error("The source sheet changed; review crop boundaries before exporting.");
}
const manifest = [];
for (const view of views) {
  let top = info.height;
  let bottom = 0;
  let left = view.right;
  let right = view.left;
  // Ignore soft extraction fringe when measuring solid figure bounds.
  for (let y = 0; y < info.height; y++) {
    for (let x = view.left; x < view.right; x++) {
      if (data[(y * info.width + x) * 4 + 3] < 220) continue;
      top = Math.min(top, y); bottom = Math.max(bottom, y);
      left = Math.min(left, x); right = Math.max(right, x);
    }
  }
  if (bottom <= top) throw new Error(`No opaque figure in ${view.name}`);
  const height = bottom - top + 1;
  const width = right - left + 1;
  const scale = Math.min(frame.bodyHeight / height, (frame.width - 20) / width);
  const resizedWidth = Math.round(width * scale);
  const resizedHeight = Math.round(height * scale);
  const x = Math.round(frame.width / 2 - (view.axis - left) * scale);
  const y = frame.baseline - resizedHeight;
  if (x < 0 || x + resizedWidth > frame.width) throw new Error(`Clipped ${view.name}; adjust its chair axis.`);
  const buffer = await sharp(source).extract({ left, top, width, height })
    .resize(resizedWidth, resizedHeight, { kernel: "lanczos3" }).png().toBuffer();
  await sharp({ create: { width: frame.width, height: frame.height, channels: 4, background: "#00000000" } })
    .composite([{ input: buffer, left: x, top: y }]).webp({ quality: 94, alphaQuality: 100 })
    .toFile(`${output}/${view.name}.webp`);
  manifest.push({ ...view, crop: { left, top, width, height }, placement: { x, y, width: resizedWidth, height: resizedHeight } });
}
await sharp("assets/character-source/room-empty.png").webp({ quality: 93 }).toFile(`${output}/room.webp`);
await writeFile(`${output}/frames.json`, JSON.stringify({ frame, views: manifest }, null, 2) + "\n");
console.log(JSON.stringify({ output, frame, views: manifest }, null, 2));
