import { expect, test } from "@playwright/test";
import { defaultProfile } from "../../src/data/portfolio-profile";
import { fallbackProjects, selectedVideoProjects } from "../../src/data/portfolio-projects";

test.beforeEach(async ({ page }) => {
  await page.route("https://*.supabase.co/**", route => route.abort());
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".character-stage")).toHaveAttribute("data-reduced-motion", "true");
  await page.evaluate(() => document.fonts.ready);
});

test("video editing leads the profile, story, and selected work", async ({ page }) => {
  await expect(page.locator(".character-intro .portfolio-eyebrow")).toHaveText("Video editor & motion designer");
  await expect(page.locator(".character-bio")).toContainText("focused on video editing");
  await expect(page.locator(".character-bio")).toContainText("AI-generated video ads for clients and build websites");
  await expect(page.locator(".character-details")).toContainText("AI video creator & web developer");
  await expect(page.locator(".character-stats")).toContainText("21");
  await expect(page.locator(".character-stats")).toContainText("4th");
  await expect(page.locator("#chapter-1 .history-copy")).toContainText("21-year-old IT student in my 4th semester");
  await expect(page.locator(".history-title")).toHaveText(["The foundation", "The edit", "Motion & AI", "Beyond the views", "Beyond the edit"]);
  await expect(page.locator("#chapter-3 .history-copy")).toContainText("AI-generated video ads for clients");
  await expect(page.locator("#chapter-4 .history-copy")).toContainText("analyze video performance");
  await expect(page.locator("#chapter-5 .history-copy")).toContainText("I build responsive websites");
  await expect(page.locator(".history-navigation")).toHaveCount(0);
  await expect(page.locator(".showcase-card h3")).toHaveText([...fallbackProjects]
    .sort((a, b) => Number(b.slug === "mcs-admissions") - Number(a.slug === "mcs-admissions"))
    .map(project => project.title));
  await expect(page.locator(".footer-email > a")).toHaveAttribute("href", "mailto:bhandariprajjwol094@gmail.com");
  await expect(page).toHaveTitle("Prajjwol Bhandari | Video Editing, AI Ads & Websites");
});

test("story follows the heading, image, copy composition without collisions", async ({ page }, info) => {
  await page.locator("#chapter-1").scrollIntoViewIfNeeded();
  await expect.poll(() => page.locator("#chapter-1 img").evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  const layout = await page.locator("#chapter-1").evaluate(chapter => {
    const title = chapter.querySelector("h3")!.getBoundingClientRect();
    const photo = chapter.querySelector(".history-photo")!.getBoundingClientRect();
    const copy = chapter.querySelector(".history-copy")!.getBoundingClientRect();
    return {
      desktop: innerWidth > 767,
      horizontal: title.right < photo.left && photo.right < copy.left,
      vertical: title.bottom < photo.top && photo.bottom < copy.top,
      square: Math.abs(photo.width - photo.height) < 1,
      titleFits: chapter.querySelector("h3")!.scrollWidth <= chapter.querySelector("h3")!.clientWidth,
      overflow: document.documentElement.scrollWidth > innerWidth,
    };
  });
  expect(layout.desktop ? layout.horizontal : layout.vertical).toBe(true);
  expect(layout.square).toBe(true);
  expect(layout.titleFits).toBe(true);
  expect(layout.overflow).toBe(false);
  await page.screenshot({ path: info.outputPath("foundation.png"), scale: "css" });
});

test("video case studies play the selected local videos", async ({ page }) => {
  await page.locator("#projects").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: /Video Editing \[/ }).click();
  await page.getByRole("button", { name: `View ${selectedVideoProjects[0].title}`, exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("video")).toHaveAttribute("src", selectedVideoProjects[0].video_url!);
  await expect(dialog.getByText("Creative breakdown", { exact: true })).toBeVisible();
  await expect(dialog.locator("video")).toHaveCount(1);
  await expect(page.locator(".calendar-row time")).toHaveCount(0);
});

test("CMS profile values still override defaults and education stays in sync", async ({ page }) => {
  await page.route("https://*.supabase.co/rest/v1/profiles*", route => route.fulfill({ json: {
    ...defaultProfile, id: "cms-profile", headline: "Independent film editor", bio: "An updated editing bio from the profile dashboard.",
    metrics: [{ label: "Age", value: "22" }, { label: "Semester", value: "5th" }],
  } }));
  await page.reload();
  await expect(page.locator(".character-intro .portfolio-eyebrow")).toHaveText("Independent film editor");
  await expect(page.locator(".character-bio")).toHaveText("An updated editing bio from the profile dashboard.");
  await expect(page.locator("#chapter-1 .history-copy")).toContainText("22-year-old IT student in my 5th semester");
});
