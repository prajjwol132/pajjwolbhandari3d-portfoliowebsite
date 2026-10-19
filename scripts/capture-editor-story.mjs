import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

await mkdir("artifacts/editor-story", { recursive: true });
const browser = await chromium.launch();
const report = [];
try {
  for (const [width, height] of [[1880, 900], [1440, 900], [1024, 768], [768, 1024], [390, 844], [320, 740]]) {
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: "reduce" });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.route("https://*.supabase.co/**", route => route.abort());
    await page.goto(process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3001");
    await page.locator('[data-reduced-motion="true"]').waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.locator("#chapter-1").evaluate(e => window.scrollTo(0, e.getBoundingClientRect().top + scrollY));
    await page.locator("#chapter-1 img").evaluate(img => img.decode());
    await page.screenshot({ path: `artifacts/editor-story/foundation-${width}.png`, scale: "css" });
    const layout = await page.locator("#chapter-1").evaluate(e => {
      const title = e.querySelector(".history-title").getBoundingClientRect();
      const photo = e.querySelector(".history-photo").getBoundingClientRect();
      const copy = e.querySelector(".history-copy").getBoundingClientRect();
      return {
        overflow: document.documentElement.scrollWidth > innerWidth,
        ordered: innerWidth > 767 ? title.right < photo.left && photo.right < copy.left : title.bottom < photo.top && photo.bottom < copy.top,
        imageLoaded: e.querySelector("img").naturalWidth > 0,
        titleFits: e.querySelector("h3").scrollWidth <= e.querySelector("h3").clientWidth,
        square: Math.abs(photo.width - photo.height) < 1,
      };
    });
    report.push({ width, height, ...layout, errors });
    if (width === 1440) {
      await page.locator("#projects").evaluate(e => window.scrollTo(0, e.getBoundingClientRect().top + scrollY));
      await page.locator("#projects img").evaluateAll(images => Promise.all(images
        .filter(image => image.getBoundingClientRect().left < innerWidth)
        .map(image => image.decode())));
      await page.screenshot({ path: "artifacts/editor-story/video-work.png", scale: "css" });
    }
    await page.close();
  }
  console.log(JSON.stringify(report, null, 2));
  await writeFile("artifacts/editor-story/audit.json", JSON.stringify(report, null, 2));
  if (report.some(r => r.overflow || !r.ordered || !r.imageLoaded || !r.titleFits || !r.square || r.errors.length)) process.exitCode = 1;
} finally { await browser.close(); }
