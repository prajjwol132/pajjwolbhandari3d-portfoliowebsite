import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const browser = await chromium.launch();
const reports = [];
await mkdir("artifacts/character-preview", { recursive: true });
try {
  for (const [width, height] of [[1880, 900], [1440, 900], [1024, 768], [768, 1024], [390, 844], [320, 740], [844, 390], [667, 375]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (/THREE.WebGLProgram: Shader Error/.test(message.text())) errors.push(message.text()); });
    await page.route("https://*.supabase.co/**", route => route.abort());
    await page.goto(new URL("/", process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3001").href);
    await page.locator('[data-portrait-loaded="true"]').waitFor({ timeout: 90000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);
    await page.screenshot({ path: `artifacts/character-preview/neutral-${width}.png`, scale: "css" });
    const stats = await sharp(await page.locator(".portrait-stage").screenshot()).stats();
    const layout = await page.evaluate(() => {
      const intro = document.querySelector(".character-intro").getBoundingClientRect();
      const stage = document.querySelector(".character-subject-viewport").getBoundingClientRect();
      const hero = document.querySelector(".character-hero").getBoundingClientRect();
      const room = document.querySelector(".character-room-backdrop img").getBoundingClientRect();
      const stats = document.querySelector(".character-stats").getBoundingClientRect();
      return { overflow: document.documentElement.scrollWidth > innerWidth,
        mobileGap: innerWidth <= 900 && innerHeight > innerWidth ? stage.top - intro.bottom : 0,
        stageHeight: stage.height,
        statsGap: stats.top - intro.bottom,
        roomCoversHero: room.left <= hero.left && room.top <= hero.top && room.right >= hero.right && room.bottom >= hero.bottom,
        nextSectionVisible: document.querySelector("#about").getBoundingClientRect().top < innerHeight };
    });
    reports.push({ width, height, ...layout, pixels: stats.channels[0].stdev, errors });
    if (width === 1440) {
      for (const [name, x, y] of [["left-up", 150, 140], ["right-down", 1300, 650]]) {
        await page.mouse.move(x, y);
        await page.waitForFunction(({ x, y }) => {
          const canvas = document.querySelector(".portrait-figure");
          const box = canvas.getBoundingClientRect();
          const hero = document.querySelector(".character-hero").getBoundingClientRect();
          const clamp = value => Math.max(-1, Math.min(1, value));
          const targetX = clamp((x - box.left - box.width * .5) / (hero.width * .38));
          const targetY = clamp((y - box.top - box.height * .18) / (hero.height * .4));
          return Math.abs(Number(canvas.dataset.gazeX) - targetX) < .002
            && Math.abs(Number(canvas.dataset.gazeY) - targetY) < .002;
        }, { x, y }, { timeout: 15000 });
        await page.screenshot({ path: `artifacts/character-preview/${name}.png`, scale: "css" });
        await page.locator(".portrait-figure").screenshot({ path: `artifacts/character-preview/character-${name}.png` });
      }
    }
    await page.close();
  }
  await writeFile("artifacts/character-preview/audit.json", JSON.stringify(reports, null, 2));
  console.log(JSON.stringify(reports, null, 2));
  if (reports.some(report => report.overflow || !report.roomCoversHero || report.mobileGap < 0 || report.statsGap < 0 || report.stageHeight < 100 || !report.nextSectionVisible || report.pixels < 15 || report.errors.length)) process.exitCode = 1;
} finally { await browser.close(); }
