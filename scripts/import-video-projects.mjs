import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile, stat, rename, readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const source = process.argv[2];
if (!source) throw new Error('Usage: node scripts/import-video-projects.mjs "path/to/Video projects"');
const root = process.cwd();
const ffmpeg = process.env.FFMPEG_BIN || "ffmpeg";
const output = path.join(root, "public/media/video-projects");
const artifacts = path.join(root, "artifacts/video-projects");
const catalog = JSON.parse(await readFile(path.join(root, "assets/video-projects/catalog.json"), "utf8"));
const files = await readdir(source);
const unknown = files.filter(file => /\.mp4$/i.test(file) && !catalog.some(item => item.file === file));
if (unknown.length) throw new Error(`Add titles and descriptions to the catalog for: ${unknown.join(", ")}`);
await mkdir(output, { recursive: true });
await mkdir(artifacts, { recursive: true });

function run(command, args) {
  if (command === "ffmpeg") command = ffmpeg;
  const result = spawnSync(command, args, { windowsHide: true, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(result.error?.message || result.stderr || `${command} failed`);
  return result.stdout;
}
function probe(file) {
  const data = JSON.parse(run("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", file]));
  const video = data.streams.find(stream => stream.codec_type === "video");
  if (!video || !Number.isFinite(Number(data.format.duration))) throw new Error("Missing video stream or duration");
  return { width: video.width, height: video.height, duration: Number(data.format.duration), fps: video.avg_frame_rate };
}
function dimensions(width, height, edge) {
  const ratio = Math.min(1, edge / Math.max(width, height));
  return [Math.max(2, Math.round(width * ratio / 2) * 2), Math.max(2, Math.round(height * ratio / 2) * 2)];
}
const nvenc = spawnSync(ffmpeg, ["-v", "error", "-f", "lavfi", "-i", "color=s=640x360", "-t", "0.1", "-c:v", "h264_nvenc", "-f", "null", "-"], { windowsHide: true }).status === 0;
const encoder = nvenc ? ["-c:v", "h264_nvenc", "-preset", "p5", "-rc", "vbr", "-cq", "21", "-b:v", "0"]
  : ["-c:v", "libx264", "-preset", "veryfast", "-crf", "21", "-threads", "8"];
console.log(`Importing with ${nvenc ? "NVIDIA H.264" : "software H.264"}; originals remain untouched.`);
const imported = [];
const rejected = [];
const tiles = [];
let sourceBytes = 0;
let outputBytes = 0;
for (const [index, entry] of catalog.entries()) {
  const input = path.join(source, entry.file);
  let info;
  try { info = probe(input); }
  catch (error) {
    rejected.push({ file: entry.file, reason: error.message.trim() });
    console.warn(`SKIPPED ${entry.file}: unreadable input`);
    continue;
  }
  const sourceStat = await stat(input);
  sourceBytes += sourceStat.size;
  const dir = path.join(output, entry.slug);
  await mkdir(dir, { recursive: true });
  const [width, height] = dimensions(info.width, info.height, 1920);
  const posterName = entry.poster_time === undefined ? "poster.webp" : `poster-${entry.poster_time}.webp`;
  const fingerprint = JSON.stringify({ bytes: sourceStat.size, modified: sourceStat.mtimeMs, version: 1 });
  let cached = false;
  try {
    cached = await readFile(path.join(artifacts, `${entry.slug}.cache`), "utf8") === fingerprint;
    for (const file of ["film.mp4", "preview.mp4", "poster.webp"]) if (!(await stat(path.join(dir, file))).size) cached = false;
    if ((await stat(path.join(dir, "film.mp4"))).size > 90_000_000) cached = false;
  } catch { cached = false; }
  if (!cached) {
    const base = ["-y", "-v", "error", "-xerror", "-threads", "4", "-i", input];
    const temporary = path.join(dir, "film.part.mp4");
    run("ffmpeg", [...base, "-map", "0:v:0", "-map", "0:a:0?", "-sn", "-dn", "-map_metadata", "-1",
      "-vf", `scale=${width}:${height}:flags=lanczos,setsar=1`, ...encoder, "-maxrate", "7M", "-bufsize", "14M", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-ac", "2",
      "-movflags", "+faststart", temporary]);
    const encoded = probe(temporary);
    if (Math.abs(encoded.duration - info.duration) > 0.3) throw new Error(`Truncated output: ${entry.file}`);
    await rename(temporary, path.join(dir, "film.mp4"));
    const sampleTime = Math.min(5, info.duration * 0.25);
    const [previewWidth, previewHeight] = dimensions(info.width, info.height, 640);
    run("ffmpeg", ["-y", "-v", "error", "-ss", String(sampleTime), "-i", path.join(dir, "film.mp4"), "-t", "6",
      "-an", "-vf", `scale=${previewWidth}:${previewHeight}:flags=lanczos,setsar=1,fps=24`, "-c:v", "libx264", "-preset", "fast", "-crf", "25", "-threads", "4",
      "-pix_fmt", "yuv420p", "-movflags", "+faststart", path.join(dir, "preview.mp4")]);
    run("ffmpeg", ["-y", "-v", "error", "-ss", String(sampleTime), "-i", input, "-frames:v", "1",
      "-vf", "scale=960:960:force_original_aspect_ratio=decrease", "-c:v", "libwebp", "-quality", "90", path.join(dir, "poster.webp")]);
    await writeFile(path.join(artifacts, `${entry.slug}.cache`), fingerprint);
  }
  if (entry.poster_time !== undefined) {
    run("ffmpeg", ["-y", "-v", "error", "-ss", String(entry.poster_time), "-i", input, "-frames:v", "1",
      "-vf", "scale=960:960:force_original_aspect_ratio=decrease", "-c:v", "libwebp", "-quality", "90", path.join(dir, posterName)]);
  }
  const url = `/media/video-projects/${entry.slug}`;
  const bytes = (await stat(path.join(dir, "film.mp4"))).size;
  outputBytes += bytes;
  imported.push({ ...entry, featured: entry.featured ?? false, video_url: `${url}/film.mp4`, preview_url: `${url}/preview.mp4`, poster_url: `${url}/${posterName}`,
    width, height, duration: info.duration, bytes });
  const tile = await sharp(path.join(dir, posterName)).resize(240, 180, { fit: "contain", background: "#161616" }).toBuffer();
  tiles.push({ input: tile, left: ((imported.length - 1) % 4) * 240, top: Math.floor((imported.length - 1) / 4) * 180 });
  console.log(`[${index + 1}/${catalog.length}] ${entry.title}: ${width}x${height}, ${(bytes / 1e6).toFixed(1)} MB${cached ? " (cached)" : ""}`);
}
if (!imported.length) throw new Error("No playable videos were imported");
await sharp({ create: { width: 960, height: Math.ceil(imported.length / 4) * 180, channels: 3, background: "#161616" } })
  .composite(tiles).jpeg({ quality: 90 }).toFile(path.join(artifacts, "contact-sheet.jpg"));
await writeFile(path.join(root, "src/data/video-projects.json"), JSON.stringify(imported, null, 2) + "\n");
await writeFile(path.join(artifacts, "import-report.json"), JSON.stringify({ imported: imported.length, sourceBytes, outputBytes, rejected }, null, 2) + "\n");
console.log(JSON.stringify({ imported: imported.length, sourceGB: sourceBytes / 1e9, deliveryMB: outputBytes / 1e6, rejected: rejected.map(entry => entry.file) }));
