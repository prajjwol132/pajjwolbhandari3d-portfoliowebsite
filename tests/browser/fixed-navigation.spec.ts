import { expect, test, type Page } from "@playwright/test";
import sharp from "sharp";

async function scrollTo(page: Page, selector: string) {
  await page.locator(selector).evaluate(section => window.scrollTo({
    top: scrollY + section.getBoundingClientRect().top, behavior: "instant",
  }));
}

async function logoLuminance(page: Page) {
  const mask = await sharp("public/media/brand/pb-logo.png")
    .resize(118, 118).extract({ left: 32, top: 32, width: 54, height: 54 })
    .ensureAlpha().raw().toBuffer();
  const pixels = await sharp(await page.locator(".portfolio-logo").screenshot({ scale: "css" }))
    .resize(54, 54, { fit: "fill" }).ensureAlpha().raw().toBuffer();
  let sum = 0, count = 0;
  // Sample inside solid strokes, excluding fractional-position antialiasing.
  for (let y = 1; y < 53; y++) {
    for (let x = 1; x < 53; x++) {
      const solid = [-1, 0, 1].every(dy => [-1, 0, 1].every(dx => mask[((y + dy) * 54 + x + dx) * 4 + 3] >= 250));
      if (!solid) continue;
      const index = (y * 54 + x) * 4;
      sum += (pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3;
      count++;
    }
  }
  expect(count).toBeGreaterThan(100);
  return sum / count;
}

test.beforeEach(async ({ page }) => {
  await page.route("https://*.supabase.co/**", route => route.abort());
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".character-stage")).toHaveAttribute("data-reduced-motion", "true");
  await page.evaluate(() => document.fonts.ready);
});

test("one fixed logo and menu remain in place throughout the portfolio", async ({ page }, info) => {
  const logo = page.locator(".portfolio-logo");
  const menu = page.getByRole("button", { name: "Open menu", exact: true });
  await expect(page.locator(".portfolio-nav")).toHaveCount(1);
  await expect(logo).toHaveCSS("position", "fixed");
  await expect(menu).toHaveCSS("position", "fixed");
  const initialLogo = await logo.boundingBox();
  const initialMenu = await menu.boundingBox();
  for (const selector of ["#profile", "#history", "#projects", "#calendar", "#featured-film", "#contact", ".portfolio-footer"]) {
    await scrollTo(page, selector);
    expect(await logo.boundingBox()).toEqual(initialLogo);
    expect(await menu.boundingBox()).toEqual(initialMenu);
    await expect(menu).toHaveCSS("background-color", "rgb(255, 214, 10)");
    expect(await page.evaluate(() => [".portfolio-logo", ".menu-trigger"].every(selector => {
      const element = document.querySelector(selector)!;
      const rect = element.getBoundingClientRect();
      const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      return rect.left >= 0 && rect.right <= innerWidth && rect.top >= 0 && Boolean(hit && element.contains(hit));
    }))).toBe(true);
    if (["#history", "#projects", ".portfolio-footer"].includes(selector)) {
      expect(await page.locator(selector).evaluate(section => {
        const content = section.querySelector(".history-title, .section-title-row, .footer-name")!.getBoundingClientRect();
        return Array.from(document.querySelectorAll(".portfolio-logo, .menu-trigger")).every(control => {
          const rect = control.getBoundingClientRect();
          return rect.right <= content.left || rect.left >= content.right || rect.bottom <= content.top || rect.top >= content.bottom;
        });
      })).toBe(true);
    }
  }
  await page.screenshot({ path: info.outputPath("fixed-navigation-footer.png"), scale: "css" });
});

test("logo renders dark on white sections and white on dark sections", async ({ page }, info) => {
  await expect(page.locator(".portfolio-logo")).toHaveCSS("mix-blend-mode", "difference");
  await scrollTo(page, "#projects");
  expect(await logoLuminance(page)).toBeLessThan(35);
  await page.screenshot({ path: info.outputPath("fixed-navigation-light.png"), scale: "css" });
  await scrollTo(page, "#history");
  expect(await logoLuminance(page)).toBeGreaterThan(220);
  await page.screenshot({ path: info.outputPath("fixed-navigation-dark.png"), scale: "css" });
  await scrollTo(page, "#projects");
  expect(await logoLuminance(page)).toBeLessThan(35);
});

test("fixed menu supports keyboard navigation and stays behind project dialogs", async ({ page }) => {
  await scrollTo(page, "#history");
  const menu = page.getByRole("button", { name: "Open menu", exact: true });
  await menu.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  await menu.click();
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: /Videos & work/ }).click();
  await expect(page).toHaveURL(/#projects$/);
  await page.getByRole("button", { name: "View MCS Admissions", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(await page.getByRole("dialog").evaluate(dialog => {
    const rect = document.querySelector(".menu-trigger")!.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return Boolean(hit && dialog.contains(hit));
  })).toBe(true);
  await page.getByRole("button", { name: "Close project modal" }).click();
  await page.getByRole("link", { name: "Prajjwol Bhandari home", exact: true }).click();
  await expect(page).toHaveURL(/#profile$/);
  await expect(menu).toBeVisible();
});
