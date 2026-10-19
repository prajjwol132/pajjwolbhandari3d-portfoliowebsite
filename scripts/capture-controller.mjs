import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const browser = await chromium.launch();
await mkdir("artifacts", { recursive: true });
const reports = [];
try {
  for (const width of [1440, 1880, 1024, 768, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.route("https://*.supabase.co/**", route => route.abort());
    await page.goto(new URL("/#tools", process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000").href);
    await page.locator("#tools").scrollIntoViewIfNeeded();
    await page.locator('[data-controller-loaded="true"]').waitFor({ timeout: 90000 });
    const canvas = page.locator(".controller-stage canvas");
    await canvas.waitFor();
    await page.waitForTimeout(1500);
    const buffer = await canvas.screenshot({ path: `artifacts/controller-${width}-canvas.png` });
    const stats = await sharp(buffer).stats();
    await page.locator("#tools").screenshot({ path: `artifacts/controller-${width}-section.png` });
    const layout = await page.evaluate(() => {
      const stage = document.querySelector(".controller-stage").getBoundingClientRect();
      const marks = [...document.querySelectorAll(".technology-mark")];
      return {
        logos: marks.map(mark => mark.textContent),
        imagesLoaded: marks.every(mark => mark.querySelector("img").naturalWidth > 0),
        overlap: marks.some(mark => {
          const rect = mark.getBoundingClientRect();
          return rect.left < stage.right && rect.right > stage.left && rect.top < stage.bottom && rect.bottom > stage.top;
        }),
        overflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    reports.push({ width, ...layout, pixelVariation: stats.channels[0].stdev, errors });
    await page.close();
  }
  await writeFile("artifacts/controller-audit.json", JSON.stringify(reports, null, 2));
  console.log(JSON.stringify(reports, null, 2));
  if (reports.some(report => report.pixelVariation < 10 || !report.imagesLoaded || report.overlap || report.overflow || report.errors.length)) process.exitCode = 1;
} finally { await browser.close(); }
