import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { frameManifestSchema } from "../../src/lib/character-frame-store";

test.beforeEach(async ({ page }) => {
  await page.route("https://*.supabase.co/**", route => route.abort());
});

test("preview room fills the hero and keeps the experimental icon controls", async ({ page }) => {
  const requested: string[] = [];
  page.on("request", request => { if (/frames-v3\/gaze\/.*webp/.test(request.url())) requested.push(request.url()); });
  await page.goto("/character-preview");
  await expect(page.locator(".character-stage")).toHaveAttribute("data-portrait-loaded", "true");
  await expect(page.getByRole("button", { name: "Rotate Character", exact: true })).toHaveCount(0);
  await expect(page.locator(".seated-character-controls button")).toHaveCount(3);
  expect(await page.locator(".seated-character-controls button").evaluateAll(buttons =>
    buttons.map(button => button.getAttribute("aria-label")))).toEqual([
    "Rotate character left", "Face cursor", "Rotate character right",
  ]);
  const left = page.getByRole("button", { name: "Rotate character left", exact: true });
  await left.focus(); await left.press("Tab");
  await expect(page.getByRole("button", { name: "Face cursor", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Rotate character right", exact: true })).toBeFocused();
  const coverage = await page.evaluate(() => {
    const hero = document.querySelector(".character-hero")!.getBoundingClientRect();
    const room = document.querySelector(".character-room-backdrop img")!.getBoundingClientRect();
    return { width: room.width - hero.width, height: room.height - hero.height,
      left: room.left - hero.left, bottom: room.bottom - hero.bottom };
  });
  expect(coverage).toEqual({ width: 0, height: 0, left: 0, bottom: 0 });
  await expect(page.locator(".character-room-backdrop img")).toHaveCSS("object-fit", "cover");
  await page.waitForTimeout(300);
  expect(requested.length).toBeLessThan(20);
});

test("angle controls display all 63 intermediate frames, then stop", async ({ page }) => {
  await page.goto("/character-preview");
  const stage = page.locator(".character-stage"), canvas = stage.locator("canvas");
  await expect(stage).toHaveAttribute("data-portrait-loaded", "true");
  await canvas.evaluate(element => {
    const seen = new Set<string>();
    const observer = new MutationObserver(() => {
      if (element.dataset.frameMode === "turn") seen.add(element.dataset.frameIndex!);
      element.dataset.testTurnFrames = String(seen.size);
    });
    observer.observe(element, { attributes: true, attributeFilter: ["data-frame-index"] });
    setTimeout(() => observer.disconnect(), 10000);
  });
  const right = page.getByRole("button", { name: "Rotate character right", exact: true });
  const controlBounds = await right.boundingBox();
  await right.focus(); await right.press("Enter");
  await expect(stage).toHaveAttribute("data-rotation-status", "paused");
  await expect(canvas).toHaveAttribute("data-frame-index", "64");
  expect(await right.boundingBox()).toEqual(controlBounds);
  expect(Number(await canvas.getAttribute("data-test-turn-frames"))).toBeGreaterThanOrEqual(64);
  const index = await canvas.getAttribute("data-frame-index");
  await page.waitForTimeout(400);
  expect(await canvas.getAttribute("data-frame-index")).toBe(index);
  await page.getByRole("button", { name: "Rotate character left", exact: true }).press("Space");
  await expect(canvas).toHaveAttribute("data-frame-index", "0");
  await page.getByRole("button", { name: "Face cursor", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-frame-mode", "gaze");
  await expect(canvas).toHaveAttribute("data-frame-index", "2112");
  expect(Number(await canvas.getAttribute("data-cached-frames"))).toBeLessThanOrEqual(28);
});

test("reverse angle crosses the loop boundary and returns without autoplay", async ({ page }) => {
  await page.goto("/character-preview");
  const stage = page.locator(".character-stage"), canvas = stage.locator("canvas");
  await expect(stage).toHaveAttribute("data-portrait-loaded", "true");
  await page.getByRole("button", { name: "Rotate character left", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-frame-index", "704");
  await expect(stage).toHaveAttribute("data-rotation-status", "paused");
  await page.getByRole("button", { name: "Face cursor", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-frame-mode", "gaze");
  await expect(canvas).toHaveAttribute("data-frame-index", "2112");
});

test("reduced motion jumps to the requested angle without continuous motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/character-preview");
  const stage = page.locator(".character-stage"), canvas = stage.locator("canvas");
  await expect(stage).toHaveAttribute("data-portrait-loaded", "true");
  await page.getByRole("button", { name: "Rotate character right", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-frame-index", "64");
  await page.waitForTimeout(400);
  await expect(canvas).toHaveAttribute("data-frame-index", "64");
});

test("failed angle download leaves a nonblank character and can retry", async ({ page }) => {
  await page.route("**/frames-v3/turn/0003.webp", route => route.abort());
  await page.goto("/character-preview");
  const stage = page.locator(".character-stage"), canvas = stage.locator("canvas");
  await expect(stage).toHaveAttribute("data-portrait-loaded", "true");
  await page.getByRole("button", { name: "Rotate character right", exact: true }).click();
  await expect(stage).toHaveAttribute("data-rotation-status", "error");
  await expect(canvas).toBeVisible();
  await page.unroute("**/frames-v3/turn/0003.webp");
  await page.getByRole("button", { name: "Rotate character right", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-frame-index", "64");
});

test("dense manifest is chronological and has 31/63 intermediate poses", async () => {
  const manifest = JSON.parse(await readFile("public/media/character/frames-v3/manifest.json", "utf8"));
  expect(frameManifestSchema.safeParse(manifest).success).toBe(true);
  expect(manifest.gaze.frames).toHaveLength(4225);
  expect((manifest.gaze.columns - 1) / 2 - 1).toBe(31);
  expect((manifest.gaze.rows - 1) / 2 - 1).toBe(31);
  expect(manifest.turn.frames).toHaveLength(768);
  expect(manifest.turn.frames.length / 12 - 1).toBe(63);
  expect(frameManifestSchema.safeParse({ ...manifest, width: 4000 }).success).toBe(false);
  expect(frameManifestSchema.safeParse({ ...manifest, turn: { ...manifest.turn, frames: manifest.turn.frames.slice(0, 4) } }).success).toBe(false);
  expect(frameManifestSchema.safeParse({ ...manifest, gaze: { ...manifest.gaze, frames: manifest.gaze.frames.toReversed() } }).success).toBe(false);
});

test("new intermediate files contain distinct image data, not repeated frames", async () => {
  const digest = async (group: string, index: number) => createHash("sha256").update(
    await readFile(`public/media/character/frames-v3/${group}/${String(index).padStart(4, "0")}.webp`),
  ).digest("hex");
  for (const group of ["gaze", "turn"]) {
    const samples = new Set<string>();
    for (let index = 0; index <= 64; index++) {
      samples.add(await digest(group, group === "gaze" ? 32 * 65 + index : index));
    }
    expect(samples.size).toBe(65);
  }
});

test("cursor sweep follows quickly with small, bounded gaze-frame steps", async ({ page, isMobile }) => {
  test.skip(isMobile, "Touch does not track the cursor.");
  await page.goto("/");
  const canvas = page.locator(".portrait-figure");
  await expect(page.locator(".character-stage")).toHaveAttribute("data-portrait-loaded", "true");
  const box = (await canvas.boundingBox())!;
  const hero = (await page.locator(".character-hero").boundingBox())!;
  const faceY = box.y + box.height * .18;
  await page.mouse.move(hero.x + 1, faceY);
  await expect(canvas).toHaveAttribute("data-gaze-x", "-1.0000");
  await canvas.evaluate(element => {
    let previous = Number(element.dataset.frameIndex) % 65;
    const seen = new Set<number>([previous]);
    const observer = new MutationObserver(() => {
      const column = Number(element.dataset.frameIndex) % 65;
      seen.add(column);
      element.dataset.testGazeCount = String(seen.size);
      element.dataset.testGazeJump = String(Math.max(Number(element.dataset.testGazeJump ?? 0), Math.abs(column - previous)));
      previous = column;
    });
    observer.observe(element, { attributes: true, attributeFilter: ["data-frame-index"] });
    setTimeout(() => observer.disconnect(), 15000);
  });
  await page.mouse.move(hero.x + hero.width - 1, faceY);
  await expect(canvas).toHaveAttribute("data-gaze-x", "1.0000");
  expect(Number(await canvas.getAttribute("data-test-gaze-count"))).toBeGreaterThanOrEqual(20);
  expect(Number(await canvas.getAttribute("data-test-gaze-jump"))).toBeLessThanOrEqual(3);
});

test("twelve angle steps complete the full rotation and restore cursor tracking", async ({ page, isMobile }, info) => {
  test.skip(isMobile, "Touch angle steps and reverse wrapping are covered separately.");
  test.setTimeout(90000);
  await page.goto("/character-preview");
  const stage = page.locator(".character-stage"), canvas = stage.locator("canvas");
  const right = page.getByRole("button", { name: "Rotate character right", exact: true });
  await expect(stage).toHaveAttribute("data-portrait-loaded", "true");
  for (let step = 1; step <= 12; step++) {
    await right.press("Enter");
    await expect(stage).toHaveAttribute("data-rotation-status", "paused");
    await expect(canvas).toHaveAttribute("data-frame-index", String(step * 64 % 768));
    if (step % 3 === 0) await canvas.screenshot({ path: info.outputPath(`angle-${step * 30}.png`) });
  }
  await expect(canvas).toHaveAttribute("data-rotation-angle", "0.00");
  await page.getByRole("button", { name: "Face cursor", exact: true }).press("Enter");
  await expect(canvas).toHaveAttribute("data-frame-mode", "gaze");
  await page.mouse.move(1, 40);
  await expect.poll(async () => Number(await canvas.getAttribute("data-gaze-x"))).toBeLessThan(-.95);
});
