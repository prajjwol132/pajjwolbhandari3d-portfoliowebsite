import { expect, test } from "@playwright/test";
import sharp from "sharp";

const tools = ["Tailwind CSS", "Django", "Python", "Next.js", "React", "MySQL", "HTML", "DaVinci Resolve", "Premiere Pro", "Vercel", "GitHub", "MongoDB"];

test.beforeEach(async ({ page }) => {
  await page.route("https://*.supabase.co/**", route => route.abort());
  await page.goto("/#tools");
  await page.locator("#tools").scrollIntoViewIfNeeded();
  await expect(page.locator(".controller-stage")).toHaveAttribute("data-controller-loaded", "true", { timeout: 45000 });
  await page.locator(".controller-stage").scrollIntoViewIfNeeded();
});

test("requested logos load and the controller animates without clipping", async ({ page }) => {
  test.setTimeout(90000);
  await expect(page.locator(".technology-mark span")).toHaveText(tools);
  expect(await page.locator(".technology-mark img").evaluateAll(images =>
    images.every(image => (image as HTMLImageElement).naturalWidth > 0),
  )).toBe(true);
  const canvas = page.locator(".controller-stage canvas");
  await page.waitForTimeout(1000);
  const first = await canvas.screenshot();
  const bounds = await canvas.boundingBox();
  if (bounds) await page.mouse.move(bounds.x + bounds.width * 0.8, bounds.y + bounds.height * 0.3);
  await page.evaluate(() => window.scrollBy(0, 80));
  await page.waitForTimeout(700);
  const second = await canvas.screenshot({ path: test.info().outputPath("controller-motion.png") });
  const { channels } = await sharp(first).stats();
  expect(channels[0].stdev).toBeGreaterThan(10);
  expect(first.equals(second)).toBe(false);
  const { data, info } = await sharp(second).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const croppedPixels: Array<{ x: number; y: number }> = [];
  // Fractional mobile crops may include one CSS pixel of browser padding.
  const inset = Math.ceil(info.width / (bounds?.width ?? info.width)) + 1;
  for (let y = inset; y < info.height - inset; y++) {
    for (const x of [inset, info.width - inset - 1]) {
      const offset = (y * info.width + x) * 4;
      if (data[offset + 3] > 100 && Math.min(data[offset], data[offset + 1], data[offset + 2]) < 230) croppedPixels.push({ x, y });
    }
  }
  expect(croppedPixels).toEqual([]);

  const layout = await page.evaluate(() => {
    const frame = document.querySelector(".controller-stage")!.getBoundingClientRect();
    const overlap = Array.from(document.querySelectorAll(".technology-mark")).some(mark => {
      const bounds = mark.getBoundingClientRect();
      return bounds.left < frame.right && bounds.right > frame.left && bounds.top < frame.bottom && bounds.bottom > frame.top;
    });
    return { overlap, overflow: document.documentElement.scrollWidth > innerWidth };
  });
  expect(layout).toEqual({ overlap: false, overflow: false });
  await page.locator("#contact").scrollIntoViewIfNeeded();
  await expect(page.locator(".controller-stage")).toHaveAttribute("data-controller-active", "false");
});

test("reduced motion is static and context loss uses the controller poster", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".controller-stage")).toHaveAttribute("data-controller-active", "false");
  const canvas = page.locator(".controller-stage canvas");
  await page.waitForTimeout(1000);
  const first = await canvas.screenshot();
  await page.waitForTimeout(500);
  expect((await canvas.screenshot()).equals(first)).toBe(true);
  await canvas.evaluate(element => element.dispatchEvent(new Event("webglcontextlost")));
  await expect(canvas).toHaveCount(0);
  const poster = page.locator(".controller-stage .controller-poster img");
  await expect(poster).toBeVisible();
  await expect(poster).toHaveJSProperty("complete", true);
  expect(await poster.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(100);
  await expect(page.locator(".technology-mark")).toHaveCount(12);
});

test("Controller playback can be explicitly enabled with reduced motion", async ({ page }) => {
  const stage = page.locator(".controller-stage");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(stage).toHaveAttribute("data-controller-active", "false");
  await page.getByRole("button", { name: "Play controller animation", exact: true }).click();
  await expect(stage).toHaveAttribute("data-controller-active", "true");
  const angle = await stage.getAttribute("data-model-angle");
  await expect.poll(() => stage.getAttribute("data-model-angle")).not.toBe(angle);
  await page.getByRole("button", { name: "Pause controller animation", exact: true }).click();
  await expect(stage).toHaveAttribute("data-controller-active", "false");
  await page.waitForTimeout(300);
  const paused = await stage.getAttribute("data-model-angle");
  await page.waitForTimeout(500);
  expect(await stage.getAttribute("data-model-angle")).toBe(paused);
});

test("Controller enters at the end of the introduction, before the logo section", async ({ page }) => {
  await page.goto("/#about");
  await page.evaluate(() => document.fonts.ready);
  const stage = page.locator(".controller-stage");
  // The pop begins when the spot below the text reaches 85% of the viewport.
  const boundary = await page.locator("#about-heading").evaluate(element =>
    element.getBoundingClientRect().bottom + window.scrollY + 120 - window.innerHeight * 0.85,
  );
  await page.evaluate(y => window.scrollTo(0, y), boundary - 50);
  await expect(stage).toHaveAttribute("data-controller-loaded", "true", { timeout: 45000 });
  await expect(stage).toHaveAttribute("data-controller-entered", "false");
  await page.evaluate(y => window.scrollTo(0, y), boundary + 50);
  await expect(stage).toHaveAttribute("data-controller-entered", "true");
  expect(await page.locator("#tools").evaluate(element =>
    element.getBoundingClientRect().top > window.innerHeight * 0.65,
  )).toBe(true);

  await page.locator("#about-heading").evaluate(element => {
    window.scrollTo(0, element.getBoundingClientRect().bottom + window.scrollY - window.innerHeight * 0.44);
  });
  await expect(stage).toHaveAttribute("data-controller-active", "true");
  await page.waitForTimeout(1000);
  const placement = await page.evaluate(() => {
    const heading = document.querySelector("#about-heading")!.getBoundingClientRect();
    const canvas = document.querySelector(".controller-stage")!.getBoundingClientRect();
    return { gap: canvas.top + canvas.height / 2 - heading.bottom, headingBottom: heading.bottom };
  });
  expect(placement.gap).toBeCloseTo(120, 0);
  const screenshot = await page.screenshot({ path: test.info().outputPath("controller-entry.png"), scale: "css" });
  const metadata = await sharp(screenshot).metadata();
  const cropWidth = Math.min(260, metadata.width! - 20);
  const crop = await sharp(screenshot).extract({
    left: Math.floor((metadata.width! - cropWidth) / 2),
    top: Math.ceil(placement.headingBottom + 15),
    width: cropWidth,
    height: 220,
  }).stats();
  expect(crop.channels[0].stdev).toBeGreaterThan(10);

  await page.evaluate(y => window.scrollTo(0, y), boundary - 50);
  await expect(stage).toHaveAttribute("data-controller-entered", "false");
});
