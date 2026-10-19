import { readFile, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

const videos = JSON.parse(await readFile("src/data/video-projects.json", "utf8"));
if (!videos.length || new Set(videos.map(video => video.slug)).size !== videos.length) throw new Error("Empty or duplicate video catalog");
let totalBytes = 0;
for (const video of videos) {
  for (const url of [video.video_url, video.preview_url, video.poster_url]) {
    const file = path.join("public", url);
    const size = (await stat(file)).size;
    if (!size) throw new Error(`Empty asset: ${url}`);
    totalBytes += size;
    if (!url.endsWith(".mp4")) continue;
    const result = spawnSync("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", file], { encoding: "utf8", windowsHide: true });
    if (result.status !== 0) throw new Error(`Unreadable output: ${url}`);
    const metadata = JSON.parse(result.stdout);
    const stream = metadata.streams.find(item => item.codec_type === "video");
    if (stream.codec_name !== "h264" || stream.pix_fmt !== "yuv420p") throw new Error(`Unsupported browser encoding: ${url}`);
    if (url === video.video_url) {
      if (Math.abs(Number(metadata.format.duration) - video.duration) > 0.3) throw new Error(`Truncated film: ${url}`);
      if (stream.width !== video.width || stream.height !== video.height) throw new Error(`Incorrect dimensions: ${url}`);
      if (!metadata.streams.some(item => item.codec_name === "aac")) throw new Error(`Missing audio: ${url}`);
      if (size > 100_000_000) throw new Error(`Oversized film: ${url}`);
    } else {
      if (Number(metadata.format.duration) > 6.1 || metadata.streams.some(item => item.codec_type === "audio")) throw new Error(`Preview is not short and silent: ${url}`);
    }
    // Fast-start MP4s keep the index ahead of the video payload for progressive playback.
    const data = await readFile(file);
    let offset = 0;
    const boxes = [];
    while (offset + 8 <= data.length) {
      let length = data.readUInt32BE(offset);
      const type = data.toString("ascii", offset + 4, offset + 8);
      if (length === 1) length = Number(data.readBigUInt64BE(offset + 8));
      if (length < 8) break;
      boxes.push(type);
      offset += length;
    }
    if (boxes.indexOf("moov") < 0 || boxes.indexOf("mdat") < boxes.indexOf("moov")) throw new Error(`MP4 is not fast-start: ${url}`);
  }
}
console.log(`Validated ${videos.length} films, ${videos.length} silent previews, and ${videos.length} posters (${(totalBytes / 1e6).toFixed(1)} MB total).`);
