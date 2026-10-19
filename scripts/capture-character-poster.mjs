import { chromium } from "@playwright/test";
import sharp from "sharp";

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1.5 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("https://*.supabase.co/**", route => route.abort());
  await page.goto(process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000/");
  await page.locator('[data-character-ready="true"]').waitFor({ timeout: 60000 });
  await page.addStyleTag({ content: ".character-hero > :not(.character-stage) { visibility: hidden !important; }" });
  await page.waitForTimeout(1000);
  const capture = await page.locator(".character-stage canvas").screenshot();
  const stats = await sharp(capture).stats();
  if (stats.channels[0].stdev < 15) throw new Error("Character render is blank");
  await sharp(capture).webp({ quality: 92 }).toFile("public/media/character/room-poster-v2.webp");
  console.log("Saved a matching poster from the live 3D scene.");
} finally {
  await browser.close();
}
