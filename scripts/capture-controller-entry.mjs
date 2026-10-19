import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const browser = await chromium.launch();
const results = [];
await mkdir("artifacts", { recursive: true });
try {
  for (const width of [1880, 1440, 1024, 768, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    await page.route("https://*.supabase.co/**", route => route.abort());
    await page.goto(new URL("/#about", process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000").href);
    await page.evaluate(() => document.fonts.ready);
    await page.locator('[data-controller-loaded="true"]').waitFor({ timeout: 90000 });
    const heading = page.locator("#about-heading");
    await heading.evaluate(element => window.scrollTo(0, element.getBoundingClientRect().bottom + window.scrollY - 396));
    await page.waitForTimeout(1000);
    const screenshot = await page.screenshot({ path: `artifacts/controller-entry-${width}.png`, scale: "css" });
    const layout = await page.evaluate(() => {
      const heading = document.querySelector("#about-heading").getBoundingClientRect();
      const stage = document.querySelector(".controller-stage").getBoundingClientRect();
      return {
        headingBottom: heading.bottom,
        centerGap: stage.top + stage.height / 2 - heading.bottom,
        controllerBeforeLogos: stage.top + stage.height / 2 < document.querySelector("#tools").getBoundingClientRect().top,
        overflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    const cropWidth = Math.min(260, width - 20);
    const stats = await sharp(screenshot).extract({ left: Math.floor((width - cropWidth) / 2), top: Math.ceil(layout.headingBottom + 15), width: cropWidth, height: 220 }).stats();
    results.push({ width, ...layout, pixelVariation: stats.channels[0].stdev });
    await page.close();
  }
  console.log(JSON.stringify(results, null, 2));
  await writeFile("artifacts/controller-entry-audit.json", JSON.stringify(results, null, 2));
  if (results.some(result => Math.abs(result.centerGap - 120) > 2 || !result.controllerBeforeLogos || result.overflow || result.pixelVariation < 10)) process.exitCode = 1;
} finally { await browser.close(); }
