import { expect, test } from "@playwright/test";
import sharp from "sharp";

test.beforeEach(async ({ page }) => {
  await page.route("https://*.supabase.co/**", route => route.abort());
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/lenis/);
  await expect(page.locator(".character-stage")).toHaveAttribute("data-portrait-loaded", "true");
});

test("whole seated character renders without layout collisions", async ({ page }, info) => {
  const stage = page.locator(".character-stage");
  const stats = await sharp(await stage.screenshot({ scale: "css" })).stats();
  expect(stats.channels[0].stdev).toBeGreaterThan(15);
  await expect(page.locator(".seated-head")).toHaveCount(0);
  await expect(page.getByRole("group", { name: "Character rotation", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Rotate character|Face cursor/ })).toHaveCount(0);
  const pixels = await page.locator(".portrait-figure").evaluate((canvas: HTMLCanvasElement) => {
    const data = canvas.getContext("2d")!.getImageData(0, 0, 480, 720).data;
    let painted = 0, yellow = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 200) painted++;
      if (data[i] > 190 && data[i + 1] > 130 && data[i + 2] < 80 && data[i + 3] > 200) yellow++;
    }
    return { painted, yellow };
  });
  expect(pixels.painted).toBeGreaterThan(60000);
  expect(pixels.yellow).toBeGreaterThan(2000);
  const bounds = await page.evaluate(() => {
    const intro = document.querySelector(".character-intro")!.getBoundingClientRect();
    const stats = document.querySelector(".character-stats")!.getBoundingClientRect();
    const stage = document.querySelector(".character-subject-viewport")!.getBoundingClientRect();
    return { overflow: document.documentElement.scrollWidth > innerWidth, gap: stats.top - intro.bottom,
      mobileGap: innerWidth <= 900 ? stage.top - intro.bottom : 0,
      nextSection: document.querySelector("#about")!.getBoundingClientRect().top < innerHeight };
  });
  expect(bounds.overflow).toBe(false);
  expect(bounds.gap).toBeGreaterThan(0);
  expect(bounds.mobileGap).toBeGreaterThanOrEqual(0);
  expect(bounds.nextSection).toBe(true);
  await page.screenshot({ path: info.outputPath("character-hero.png"), scale: "css" });
});

test("cursor selects complete gaze frames on both axes and returns to neutral", async ({ page, isMobile }) => {
  test.skip(isMobile, "Touch keeps the neutral gaze.");
  const canvas = page.locator(".portrait-figure");
  const value = async (axis: string) => Number(await canvas.getAttribute(`data-gaze-${axis}`));
  const body = () => canvas.evaluate((canvas: HTMLCanvasElement) => {
    const data = canvas.getContext("2d")!.getImageData(0, 320, 480, 400).data;
    return Array.from(data).reduce((sum, value, index) => (sum + value * (index % 17 + 1)) % 2147483647, 0);
  });
  await page.mouse.move(12, 20);
  await expect.poll(() => value("x")).toBeLessThan(-.95);
  await expect.poll(() => value("y")).toBeLessThan(-.3);
  const before = await canvas.screenshot();
  const bodyBefore = await body();
  await page.mouse.move(1420, 660);
  await expect.poll(() => value("x")).toBeGreaterThan(.95);
  await expect.poll(() => value("y")).toBeGreaterThan(.95);
  expect((await canvas.screenshot()).equals(before)).toBe(false);
  // Lossy WebP can change a few pixels at block edges, not the seated pose.
  expect(Math.abs(await body() - bodyBefore) / bodyBefore).toBeLessThan(.02);
  await page.mouse.move(100, 895);
  await expect.poll(() => value("x")).toBe(0);
  await expect.poll(() => value("y")).toBe(0);
  const frames = await canvas.getAttribute("data-rendered-frames");
  await page.waitForTimeout(300);
  expect(await canvas.getAttribute("data-rendered-frames")).toBe(frames);
  expect(Number(await canvas.getAttribute("data-cached-frames"))).toBeLessThanOrEqual(28);
});

test("touch and reduced motion keep the gaze neutral and navigation functional", async ({ page, isMobile }) => {
  if (isMobile) await page.touchscreen.tap(12, 340);
  else await page.emulateMedia({ reducedMotion: "reduce" });
  await page.mouse.move(12, 100);
  await page.waitForTimeout(300);
  await expect(page.locator(".portrait-figure")).toHaveAttribute("data-frame-index", "2112");
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("failed first frame retains the original artwork and navigation", async ({ page }) => {
  await page.route("**/frames-v3/gaze/2112.webp", route => route.abort());
  await page.reload();
  await expect(page.locator(".character-stage")).toHaveAttribute("data-character-fallback", "true");
  await expect(page.locator(".seated-original > img")).toBeVisible();
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
});
