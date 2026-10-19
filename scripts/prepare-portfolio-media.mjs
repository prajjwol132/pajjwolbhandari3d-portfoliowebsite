import sharp from "sharp";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const source = process.argv[2];
if (!source)
  throw new Error(
    "Pass the directory containing MAIN image.png and images for website.",
  );
const target = path.resolve("public/media/portraits");
await mkdir(target, { recursive: true });
const photos = (await readdir(path.join(source, "images for website")))
  .filter((name) => /\.jpe?g$/i.test(name))
  .sort();
const tiles = [];
for (const [index, name] of photos.entries()) {
  const input = path.join(source, "images for website", name);
  const output = `${String(index + 1).padStart(2, "0")}.webp`;
  await sharp(input)
    .rotate()
    .resize({ width: 1400, withoutEnlargement: true })
    .webp({ quality: 84 })
    .toFile(path.join(target, output));
  tiles.push({
    input: await sharp(input)
      .rotate()
      .resize(180, 220, { fit: "cover" })
      .toBuffer(),
    left: (index % 5) * 180,
    top: Math.floor(index / 5) * 220,
  });
  console.log(output, name);
}
await mkdir("artifacts", { recursive: true });
await sharp({
  create: {
    width: 900,
    height: Math.ceil(photos.length / 5) * 220,
    channels: 3,
    background: "#fff",
  },
})
  .composite(tiles)
  .png()
  .toFile("artifacts/photo-contact-sheet.png");
await sharp(path.join(source, "MAIN image.png"))
  .resize({ width: 1920, withoutEnlargement: true })
  .webp({ quality: 88 })
  .toFile("public/media/brand/prajjwol-main.webp");

const fontRoot =
  "https://raw.githubusercontent.com/google/fonts/main/ofl/anton/";
for (const [remote, local] of [
  ["Anton-Regular.ttf", "Anton-Regular.ttf"],
  ["OFL.txt", "Anton-OFL.txt"],
]) {
  const response = await fetch(fontRoot + remote);
  if (!response.ok)
    throw new Error(`Unable to download ${remote}: ${response.status}`);
  await writeFile(
    path.join("src/app/fonts", local),
    Buffer.from(await response.arrayBuffer()),
  );
}
