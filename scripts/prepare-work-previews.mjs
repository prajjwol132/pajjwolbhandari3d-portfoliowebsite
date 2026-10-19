import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

await mkdir("public/media/work", { recursive: true });
const thumbnail = await fetch("https://i.ytimg.com/vi/jUHXvdFIdhA/hq2.jpg");
if (!thumbnail.ok) throw new Error(`YouTube thumbnail: ${thumbnail.status}`);
await sharp(Buffer.from(await thumbnail.arrayBuffer())).webp({ quality: 94 }).toFile("public/media/work/documentary-short.webp");

const browser = await chromium.launch();
try {
  for (const [slug, url] of [
    ["expense-tracker", "https://daily-expenses-trackerr.netlify.app/"],
    ["e-commerce-store", "https://bhandariecommerceshopandservice.netlify.app/"],
    ["hotel-booking", "https://react-js-proffessional-class-projec.vercel.app/"],
  ]) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" });
    const response = await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
    if (!response?.ok()) throw new Error(`${slug}: ${response?.status()}`);
    await page.evaluate(() => document.fonts.ready);
    await sharp(await page.screenshot()).webp({ quality: 90 }).toFile(`public/media/work/${slug}.webp`);
    console.log(`${slug}: captured ${url}`);
    await page.close();
  }
} finally {
  await browser.close();
}
