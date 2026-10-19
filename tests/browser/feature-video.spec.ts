import { expect, test, type Page } from "@playwright/test";

async function scrollToFilm(page: Page, viewportOffset = 0) {
  await page.locator("#featured-film").evaluate((section, offset) => {
    window.scrollTo({ top: scrollY + section.getBoundingClientRect().top - innerHeight * offset, behavior: "instant" });
  }, viewportOffset);
}

test.beforeEach(async ({ page }) => {
  await page.route("https://*.supabase.co/**", route => route.abort());
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".character-stage")).toHaveAttribute("data-reduced-motion", "true", { timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
});

test("edge-to-edge film and controls fit desktop, tablet and mobile", async ({ page }, info) => {
  const film = page.locator(".feature-video-film");
  await expect(film).not.toHaveAttribute("src");
  for (const [width, height] of [[1886, 900], [1440, 900], [768, 1024], [390, 844], [320, 740]]) {
    await page.setViewportSize({ width, height });
    await scrollToFilm(page);
    const layout = await page.locator("#featured-film").evaluate(section => {
      const stage = section.querySelector(".feature-video-stage")!.getBoundingClientRect();
      const video = section.querySelector("video")!.getBoundingClientRect();
      const center = section.querySelector(".feature-video-sound")!.getBoundingClientRect();
      return {
        overflow: document.documentElement.scrollWidth > innerWidth,
        fullWidth: Math.round(stage.width) === document.body.clientWidth, height: Math.round(stage.height),
        cover: getComputedStyle(section.querySelector("video")!).objectFit,
        videoFills: Math.abs(video.width - stage.width) < 1 && Math.abs(video.height - stage.height) < 1,
        centered: Math.abs(center.left + center.width / 2 - (stage.left + stage.width / 2)) < 1 && Math.abs(center.top + center.height / 2 - innerHeight / 2) < 1,
        controlsInside: Array.from(section.querySelectorAll("button")).every(button => {
          const rect = button.getBoundingClientRect();
          return rect.left >= 0 && rect.right <= innerWidth && rect.top >= 0 && rect.bottom <= innerHeight;
        }),
      };
    });
    expect(layout).toEqual({ overflow: false, fullWidth: true, height, cover: "cover", videoFills: true, centered: true, controlsInside: true });
    await expect(page.locator(".feature-video-sound")).toHaveCSS("background-color", "rgb(255, 214, 10)");
    await page.screenshot({ path: info.outputPath(`featured-film-${width}.png`), scale: "css" });
  }
});

test("reduced motion uses manual playback; sound, pause and keyboard controls work", async ({ page }, info) => {
  const film = page.locator(".feature-video-film");
  await scrollToFilm(page);
  await expect(film).not.toHaveAttribute("src");
  await expect(page.locator(".feature-video-stage")).toHaveCSS("transform", "none");
  await page.getByRole("button", { name: "Play video", exact: true }).click();
  await expect.poll(() => film.evaluate((video: HTMLVideoElement) => !video.paused && video.videoWidth > 0)).toBe(true);
  await page.getByRole("button", { name: "Enable video sound", exact: true }).click();
  await expect.poll(() => film.evaluate((video: HTMLVideoElement) => video.muted)).toBe(false);
  const mute = page.getByRole("button", { name: "Mute video", exact: true });
  await mute.focus();
  await page.keyboard.press("Enter");
  await expect.poll(() => film.evaluate((video: HTMLVideoElement) => video.muted)).toBe(true);
  await page.getByRole("button", { name: "Pause video", exact: true }).click();
  await expect.poll(() => film.evaluate((video: HTMLVideoElement) => video.paused)).toBe(true);
  await film.evaluate((video: HTMLVideoElement) => { video.currentTime = 12; });
  await expect.poll(() => film.evaluate((video: HTMLVideoElement) => video.readyState >= 2 && !video.seeking)).toBe(true);
  await page.screenshot({ path: info.outputPath("featured-film-decoded.png"), scale: "css" });
  await page.getByRole("button", { name: "Resume video", exact: true }).click();
  await expect.poll(() => film.evaluate((video: HTMLVideoElement) => video.paused)).toBe(false);
});

test("scroll pop-in fills the viewport and autoplay pauses outside the section", async ({ page }, info) => {
  const film = page.locator(".feature-video-film");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/lenis/);
  await expect(film).not.toHaveAttribute("src");
  await scrollToFilm(page, 0.8);
  await expect.poll(() => page.locator(".feature-video-stage").evaluate(element => element.getBoundingClientRect().width / document.body.clientWidth)).toBeLessThan(0.98);
  await scrollToFilm(page);
  await expect.poll(() => page.locator(".feature-video-stage").evaluate(element => element.getBoundingClientRect().width / document.body.clientWidth)).toBeGreaterThan(0.999);
  await expect.poll(() => film.evaluate((video: HTMLVideoElement) => !video.paused && video.currentTime > 0)).toBe(true);
  await expect(page.getByRole("button", { name: "Enable video sound", exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath("featured-film-playing.png"), scale: "css" });
  await page.getByRole("button", { name: "Enable video sound", exact: true }).click();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect.poll(() => film.evaluate((video: HTMLVideoElement) => video.paused && video.muted)).toBe(true);
  await scrollToFilm(page);
  await expect.poll(() => film.evaluate((video: HTMLVideoElement) => !video.paused && video.muted)).toBe(true);
  await page.getByRole("button", { name: "Pause video", exact: true }).click();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await scrollToFilm(page);
  await expect(film).toHaveJSProperty("paused", true);
  await expect(page.getByRole("button", { name: "Play video", exact: true })).toBeVisible();
});

test("video menu pauses playback and restores focus on close", async ({ page }) => {
  const film = page.locator(".feature-video-film");
  await scrollToFilm(page);
  await page.getByRole("button", { name: "Play video", exact: true }).click();
  await expect(film).toHaveJSProperty("paused", false);
  const trigger = page.getByRole("button", { name: "Open menu", exact: true });
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(film).toHaveJSProperty("paused", true);
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(film).toHaveJSProperty("paused", false);
  await trigger.click();
  await page.getByRole("navigation", { name: "Main navigation", exact: true }).getByRole("link", { name: /Gallery/ }).click();
  await expect(page).toHaveURL(/#gallery$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(film).toHaveJSProperty("paused", true);
});

test("a failed video offers retry and a direct link", async ({ page }) => {
  await page.route("**/freshers-fiesta-highlights/film.mp4", route => route.fulfill({ status: 404, body: "Not found" }));
  await scrollToFilm(page);
  await page.getByRole("button", { name: "Play video", exact: true }).click();
  await expect(page.locator("#featured-film").getByRole("alert")).toContainText("could not be loaded");
  await expect(page.getByRole("link", { name: "Open the video directly" })).toHaveAttribute("href", /film\.mp4$/);
  await page.unroute("**/freshers-fiesta-highlights/film.mp4");
  await page.getByRole("button", { name: "Retry video" }).click();
  await expect(page.locator(".feature-video-film")).toHaveJSProperty("paused", false);
  await expect(page.locator("#featured-film").getByRole("alert")).toHaveCount(0);
});

test("an empty CMS keeps the image fallback and gallery link", async ({ page }) => {
  await page.route("https://*.supabase.co/rest/v1/projects*", route => route.fulfill({ json: [] }));
  await page.route("https://*.supabase.co/rest/v1/categories*", route => route.fulfill({ json: [] }));
  await page.reload();
  await expect(page.locator("#featured-film video")).toHaveCount(0);
  await scrollToFilm(page);
  await expect(page.locator("#featured-film > div > img")).toBeVisible();
  await expect(page.locator("#featured-film").getByRole("link", { name: "Explore the gallery" })).toHaveAttribute("href", "#gallery");
});
