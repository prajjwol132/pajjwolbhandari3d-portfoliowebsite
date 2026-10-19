import { expect, test } from "@playwright/test";
import { fallbackProjects } from "../../src/data/portfolio-projects";

test.beforeEach(async ({ page }) => {
  await page.route("https://*.supabase.co/**", route => route.abort());
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".character-stage")).toHaveAttribute("data-reduced-motion", "true");
  await page.evaluate(() => document.fonts.ready);
});

test("five projects appear initially and the full gallery remains unchanged", async ({ page }, info) => {
  await expect(page.locator(".calendar-row strong")).toHaveText(fallbackProjects.slice(0, 5).map(project => project.title));
  await expect(page.locator(".showcase-card")).toHaveCount(fallbackProjects.length);
  const toggle = page.getByRole("button", { name: "Show All", exact: true });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toHaveAttribute("aria-controls", "creative-work-list");
  await page.locator("#calendar").evaluate(section => window.scrollTo({ top: scrollY + section.getBoundingClientRect().top, behavior: "instant" }));
  await page.screenshot({ path: info.outputPath("five-project-index.png"), scale: "css" });
  await toggle.scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath("show-all-button.png"), scale: "css" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("show all opens the remaining work, projects still play, and show less returns to five", async ({ page, isMobile }) => {
  const expand = page.getByRole("button", { name: "Show All", exact: true });
  if (isMobile) await expand.tap();
  else await expand.click();
  await expect(page.locator(".calendar-row")).toHaveCount(fallbackProjects.length);
  await expect(page.locator(".calendar-row").nth(5)).toBeFocused();
  const collapse = page.getByRole("button", { name: "Show Less", exact: true });
  await expect(collapse).toHaveAttribute("aria-expanded", "true");
  await page.locator(".calendar-row").nth(5).click();
  await expect(page.getByRole("dialog").getByRole("heading", { name: fallbackProjects[5].title, exact: true })).toBeVisible();
  await expect(page.getByRole("dialog").locator("video")).toHaveAttribute("src", fallbackProjects[5].video_url!);
  await page.getByRole("button", { name: "Close project modal" }).click();
  await collapse.click();
  await expect(page.locator(".calendar-row")).toHaveCount(5);
  await expect(expand).toBeFocused();
  await expect(expand).toBeInViewport();
  await expect(page.locator("#calendar").getByRole("status")).toHaveText(`Showing 5 of ${fallbackProjects.length} projects`);
});

test("keyboard activation works and resizing does not lose expanded work", async ({ page }) => {
  const expand = page.getByRole("button", { name: "Show All", exact: true });
  await expand.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".calendar-row")).toHaveCount(fallbackProjects.length);
  await expect(page.locator(".calendar-row").nth(5)).toBeFocused();
  await page.setViewportSize({ width: 320, height: 740 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const collapse = page.getByRole("button", { name: "Show Less", exact: true });
  await collapse.focus();
  await page.keyboard.press("Space");
  await expect(page.locator(".calendar-row")).toHaveCount(5);
  await expect(expand).toBeFocused();
  await expect(expand).toBeInViewport();
});

test("small and empty CMS collections do not offer unnecessary expansion", async ({ page }) => {
  await page.route("https://*.supabase.co/rest/v1/categories*", route => route.fulfill({ json: [] }));
  for (const count of [3, 5, 0]) {
    await page.route("https://*.supabase.co/rest/v1/projects*", route => route.fulfill({ json: fallbackProjects.slice(0, count) }));
    await page.reload();
    await expect(page.locator(".calendar-row")).toHaveCount(count);
    await expect(page.locator(".calendar-toggle")).toHaveCount(0);
    if (count === 0) await expect(page.locator("#calendar .empty-projects")).toBeVisible();
  }
});

test("smooth scrolling stays usable after expanding and collapsing the index", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/lenis/);
  const expand = page.getByRole("button", { name: "Show All", exact: true });
  await expand.click();
  await expect(page.locator(".calendar-row")).toHaveCount(fallbackProjects.length);
  await expect(page.locator(".calendar-row").nth(5)).toBeFocused();
  await page.getByRole("button", { name: "Show Less", exact: true }).click();
  await expect(page.locator(".calendar-row")).toHaveCount(5);
  await expect(expand).toBeInViewport();
  await page.locator("#gallery").scrollIntoViewIfNeeded();
  await expect(page.locator(".gallery-print-center")).toBeInViewport();
});
