import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const browser = await chromium.launch();
const results = [];
await mkdir("artifacts", { recursive: true });
try {
  for (const width of [1880, 1440, 1024, 768, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    await page.goto("http://localhost:3001/#about", { waitUntil: "networkidle" });
    await page.locator(".manifesto-composition").evaluate(async element => {
      const images = [...element.querySelectorAll("img")];
      images.forEach(image => { image.loading = "eager"; });
      await Promise.all(images.map(image => image.decode()));
      window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - 24);
    });
    await page.screenshot({ path: `artifacts/about-${width}-viewport.png` });
    await page.locator(".manifesto-composition").screenshot({ path: `artifacts/about-${width}-full.png` });
    const audit = await page.evaluate(() => {
      const heading = document.querySelector("#about-heading").getBoundingClientRect();
      const photos = [...document.querySelectorAll(".manifesto-photo")];
      const overlap = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
      const rects = photos.map(photo => photo.getBoundingClientRect());
      return {
        width: innerWidth,
        count: photos.length,
        loaded: photos.every(photo => photo.querySelector("img").naturalWidth > 0),
        overlap: rects.some(rect => overlap(rect, heading)) || rects.some((rect, index) => rects.slice(index + 1).some(other => overlap(rect, other))),
        overflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    results.push(audit);
    await page.close();
  }
  await writeFile("artifacts/about-photos-audit.json", JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
  if (results.some(result => !result.loaded || result.overlap || result.overflow)) process.exitCode = 1;
} finally { await browser.close(); }
