import { expect, test } from "@playwright/test";
import { existsSync } from "node:fs";
import path from "node:path";
import videos from "../../src/data/video-projects.json";

test.beforeEach(async ({ page }) => {
  await page.route("https://*.supabase.co/**", route => route.abort());
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#projects");
  await expect(page.locator(".character-stage")).toHaveAttribute("data-reduced-motion", "true");
  await page.locator("#projects").scrollIntoViewIfNeeded();
});

test("all playable selections have real assets and no videos load before interaction", async ({ page }) => {
  expect(videos).toHaveLength(31);
  expect(new Set(videos.map(video => video.slug)).size).toBe(videos.length);
  for (const video of videos) {
    for (const asset of [video.video_url, video.preview_url, video.poster_url]) {
      expect(existsSync(path.join(process.cwd(), "public", asset))).toBe(true);
    }
    expect(video.bytes).toBeLessThan(100_000_000);
  }
  await expect(page.locator(".showcase-card")).toHaveCount(34);
  await expect(page.locator(".showcase-card video")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Video Editing \[31\]/ })).toBeVisible();
  await page.getByRole("button", { name: /Web Apps \[03\]/ }).click();
  await expect(page.locator(".showcase-card h3")).toHaveText(["Expense Tracker", "E-Commerce Store", "Hotel Booking"]);
  await page.getByRole("button", { name: /Video Editing \[31\]/ }).click();
  await expect(page.locator(".showcase-card")).toHaveCount(31);
  await expect(page.locator(".showcase-card img").first()).toHaveJSProperty("complete", true);
});

test("full video plays with sound available, seeking, and uncropped portrait framing", async ({ page }, info) => {
  const project = videos.find(video => video.height > video.width)!;
  const opener = page.getByRole("button", { name: `View ${project.title}`, exact: true });
  await opener.click();
  const video = page.getByRole("dialog").locator("video");
  await expect(video).toHaveAttribute("src", project.video_url);
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.readyState)).toBeGreaterThanOrEqual(1);
  const properties = await video.evaluate((element: HTMLVideoElement) => ({
    muted: element.muted, paused: element.paused, controls: element.controls, autoplay: element.autoplay,
    width: element.videoWidth, height: element.videoHeight, fit: getComputedStyle(element).objectFit,
  }));
  expect(properties).toEqual({ muted: false, paused: true, controls: true, autoplay: false, width: project.width, height: project.height, fit: "contain" });
  await video.evaluate(async (element: HTMLVideoElement) => { element.muted = true; await element.play(); });
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(0.1);
  await video.evaluate((element: HTMLVideoElement) => { element.pause(); element.currentTime = element.duration / 2; });
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.seeking)).toBe(false);
  await page.screenshot({ path: info.outputPath("vertical-video.png"), scale: "css" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Close project modal" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".project-film")).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test("MCS Admissions leads the showcase without reordering other work", async ({ page }, info) => {
  const lead = videos.find(video => video.slug === "mcs-admissions")!;
  const orderedVideos = [lead, ...videos.filter(video => video.slug !== lead.slug)];
  const titles = page.locator(".showcase-card h3");
  const firstCard = page.locator(".showcase-card").first();
  await expect(titles).toHaveText([...orderedVideos.map(video => video.title), "Expense Tracker", "E-Commerce Store", "Hotel Booking"]);
  await expect(firstCard.locator(".showcase-duration")).toHaveText("0:21");
  await expect(firstCard.locator("img")).toHaveAttribute("alt", lead.title);
  await expect.poll(() => firstCard.locator("img").evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  await expect(page.locator(".calendar-row strong").first()).toHaveText(videos[0].title);
  await expect(page.locator(".feature-video-film")).toHaveAttribute("poster", videos[0].poster_url);
  await page.getByRole("button", { name: /Video Editing \[31\]/ }).click();
  await expect(titles).toHaveText(orderedVideos.map(video => video.title));
  await page.getByRole("button", { name: /All projects \[34\]/ }).click();
  await expect(titles.first()).toHaveText(lead.title);
  await page.locator("#projects").screenshot({ path: info.outputPath("mcs-admissions-first.png"), scale: "css" });
  await firstCard.getByRole("button").click();
  await expect(page.getByRole("dialog").getByRole("heading", { name: lead.title, exact: true })).toBeVisible();
  await expect(page.getByRole("dialog").locator("video")).toHaveAttribute("src", lead.video_url);
});

test("hover uses only a short muted preview and releases it on leave", async ({ page, isMobile }) => {
  test.skip(isMobile, "Touch opens the full player without a hover preview.");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const card = page.locator(".showcase-card").first();
  await card.hover();
  const video = card.locator("video");
  await expect(video).toHaveAttribute("src", videos.find(video => video.slug === "mcs-admissions")!.preview_url);
  await expect(video).toHaveClass("is-playing");
  expect(await video.evaluate((element: HTMLVideoElement) => element.muted)).toBe(true);
  expect(await video.evaluate((element: HTMLVideoElement) => element.duration)).toBeLessThanOrEqual(6.1);
  await page.mouse.move(10, 10);
  await expect(card.locator("video")).toHaveCount(0);
  await card.hover();
  await expect(card.locator("video")).toHaveCount(1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(card.locator("video")).toHaveCount(0);
});

test("video files support range requests and failed playback offers a direct link", async ({ page, request }) => {
  const response = await request.get(videos[0].video_url, { headers: { Range: "bytes=0-1023" } });
  expect(response.status()).toBe(206);
  expect(response.headers()["content-type"]).toContain("video/mp4");
  expect((await response.body()).length).toBe(1024);
  await page.route(`**${videos[0].video_url}`, route => route.abort());
  await page.getByRole("button", { name: `View ${videos[0].title}`, exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("could not be loaded");
  await expect(page.getByRole("link", { name: "Open the video directly" })).toHaveAttribute("href", videos[0].video_url);
});
