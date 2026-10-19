import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const videos = JSON.parse(await readFile("src/data/video-projects.json", "utf8"));
await mkdir("artifacts/selected-videos", { recursive: true });
const browser = await chromium.launch();
const reports = [];
try {
  for (const [width, height] of [[1880, 900], [1440, 900], [768, 1024], [390, 844], [320, 740]]) {
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: "reduce" });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.route("https://*.supabase.co/**", route => route.abort());
    await page.goto(process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3001");
    await page.locator('[data-reduced-motion="true"]').waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.locator("#projects").evaluate(element => window.scrollTo(0, element.getBoundingClientRect().top + scrollY));
    await page.locator(".showcase-card img").evaluateAll(images => Promise.all(images.filter(image => image.getBoundingClientRect().left < innerWidth).map(image => image.decode())));
    const cards = await page.locator(".showcase-card").evaluateAll(elements => ({
      count: elements.length,
      textFits: elements.every(element => element.querySelector("h3").scrollWidth <= element.clientWidth),
      posters: elements.filter(element => element.getBoundingClientRect().left < innerWidth).every(element => element.querySelector("img").naturalWidth > 0),
      overflow: document.documentElement.scrollWidth > innerWidth,
    }));
    await page.screenshot({ path: `artifacts/selected-videos/projects-${width}.png`, scale: "css" });
    for (const orientation of ["landscape", "portrait"]) {
      const project = videos.find(video => orientation === "landscape" ? video.width > video.height : video.height > video.width);
      await page.getByRole("button", { name: `View ${project.title}`, exact: true }).click();
      await page.waitForFunction(() => {
        const dialog = document.querySelector('[role="dialog"]');
        return dialog && getComputedStyle(dialog).opacity === "1";
      });
      const video = page.locator(".project-film");
      await video.evaluate(element => element.readyState >= 1 ? undefined : new Promise((resolve, reject) => {
        element.addEventListener("loadedmetadata", resolve, { once: true });
        element.addEventListener("error", reject, { once: true });
      }));
      await page.screenshot({ path: `artifacts/selected-videos/${orientation}-${width}.png`, scale: "css" });
      const player = await video.evaluate(element => ({ width: element.videoWidth, height: element.videoHeight, fit: getComputedStyle(element).objectFit, overflow: document.documentElement.scrollWidth > innerWidth }));
      reports.push({ width, height, orientation, ...cards, player, errors });
      await page.getByRole("button", { name: "Close project modal" }).click();
      await page.getByRole("dialog").waitFor({ state: "detached" });
    }
    await page.close();
  }
  await writeFile("artifacts/selected-videos/audit.json", JSON.stringify(reports, null, 2));
  console.log(JSON.stringify(reports, null, 2));
  if (reports.some(report => report.count !== videos.length + 3 || !report.textFits || !report.posters || report.overflow || report.player.overflow || report.player.fit !== "contain" || report.errors.length)) process.exitCode = 1;
} finally { await browser.close(); }
