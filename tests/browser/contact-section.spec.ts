import { expect, test } from "@playwright/test";
import { defaultProfile } from "../../src/data/portfolio-profile";

test.beforeEach(async ({ page }) => {
  await page.route("https://*.supabase.co/**", route => route.abort());
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".character-stage")).toHaveAttribute("data-reduced-motion", "true");
  await page.evaluate(() => document.fonts.ready);
  await page.locator("#contact").evaluate(section => window.scrollTo({ top: scrollY + section.getBoundingClientRect().top, behavior: "instant" }));
});

test("reference contact layout fits desktop, tablet and mobile", async ({ page }, info) => {
  await expect(page.locator(".contact-panel")).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(page.locator(".contact-backdrop")).toHaveAttribute("aria-hidden", "true");
  await expect(page.getByRole("form", { name: "Contact", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit", exact: true })).toHaveCSS("background-color", "rgb(255, 214, 10)");
  for (const width of [1886, 1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.locator("#contact").evaluate(section => window.scrollTo({ top: scrollY + section.getBoundingClientRect().top, behavior: "instant" }));
    const layout = await page.locator("#contact").evaluate(section => {
      const panel = section.querySelector(".contact-panel")!.getBoundingClientRect();
      const intro = section.querySelector(".contact-intro")!.getBoundingClientRect();
      const form = section.querySelector("form")!.getBoundingClientRect();
      const logo = document.querySelector(".portfolio-logo")!.getBoundingClientRect();
      const menu = document.querySelector(".menu-trigger")!.getBoundingClientRect();
      const first = section.querySelector("#contact-first-name")!.getBoundingClientRect();
      const last = section.querySelector("#contact-last-name")!.getBoundingClientRect();
      return {
        overflow: document.documentElement.scrollWidth > innerWidth,
        panelInside: panel.left >= 0 && panel.right <= innerWidth,
        ordered: innerWidth > 767 ? intro.right < form.left : intro.bottom < form.top,
        namesOrdered: innerWidth >= 480 ? first.right < last.left : first.bottom < last.top,
        navClear: Math.max(logo.bottom, menu.bottom) < panel.top,
        fieldsInside: Array.from(section.querySelectorAll("input, textarea, form button")).every(element => {
          const rect = element.getBoundingClientRect();
          return rect.left >= panel.left && rect.right <= panel.right && rect.bottom <= panel.bottom;
        }),
      };
    });
    expect(layout).toEqual({ overflow: false, panelInside: true, ordered: true, namesOrdered: true, navClear: true, fieldsInside: true });
    await page.screenshot({ path: info.outputPath(`contact-${width}.png`), scale: "css" });
  }
});

test("required fields, keyboard order and existing email-draft submission work", async ({ page }) => {
  const form = page.getByRole("form", { name: "Contact", exact: true });
  const submit = form.getByRole("button", { name: "Submit", exact: true });
  await submit.click();
  expect(await form.evaluate((element: HTMLFormElement) => element.checkValidity())).toBe(false);
  await expect(form.getByRole("status")).toHaveCount(0);
  await page.getByLabel("First Name", { exact: true }).fill("Test");
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Last Name", { exact: true })).toBeFocused();
  await page.keyboard.type("Visitor");
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Email", { exact: true })).toBeFocused();
  await page.keyboard.type("invalid-email");
  expect(await form.evaluate((element: HTMLFormElement) => element.checkValidity())).toBe(false);
  await page.getByLabel("Email", { exact: true }).fill("visitor@example.com");
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Message", { exact: true })).toBeFocused();
  await page.keyboard.type("I have a video editing project to discuss.");
  await page.keyboard.press("Tab");
  await expect(submit).toBeFocused();
  expect(await form.evaluate((element: HTMLFormElement) => element.checkValidity())).toBe(true);
  await page.keyboard.press("Enter");
  await expect(form.getByRole("status")).toContainText("Your email draft is ready");
  await expect(page.locator(".footer-email > a")).toHaveAttribute("href", `mailto:${defaultProfile.email}`);
});

test("fixed menu opens from contact, returns focus and navigates", async ({ page }) => {
  const trigger = page.getByRole("button", { name: "Open menu", exact: true });
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.getByRole("navigation", { name: "Main navigation", exact: true }).getByRole("link", { name: /About/ }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).toHaveURL(/#about$/);
  await expect(page.getByRole("button", { name: "Open menu", exact: true })).toHaveCount(1);
});

test("CMS email still controls contact submission availability", async ({ page }) => {
  await page.route("https://*.supabase.co/rest/v1/profiles*", route => route.fulfill({ json: { ...defaultProfile, id: "cms-profile", email: "" } }));
  await page.reload();
  await expect(page.getByRole("button", { name: "Submit", exact: true })).toBeDisabled();
  await expect(page.locator(".footer-email")).toHaveCount(0);
});

test("white footer retains readable links and leaves the contact section dark", async ({ page }, info) => {
  const footer = page.locator(".portfolio-footer");
  await footer.scrollIntoViewIfNeeded();
  await expect(footer).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(footer).toHaveCSS("color", "rgb(17, 17, 17)");
  await expect(page.locator(".footer-bottom")).toHaveCSS("color", "rgb(102, 102, 102)");
  await expect(page.locator("#contact")).toHaveCSS("background-color", "rgb(0, 0, 0)");
  await expect(footer.getByRole("navigation", { name: "Footer navigation" }).getByRole("link")).toHaveCount(6);
  await expect(footer.locator(".footer-email > a")).toHaveAttribute("href", `mailto:${defaultProfile.email}`);
  const backToTop = footer.getByRole("link", { name: "Back to top" });
  await backToTop.focus();
  await expect(backToTop).toHaveCSS("outline-color", "rgb(17, 17, 17)");
  await footer.screenshot({ path: info.outputPath("white-footer.png"), scale: "css" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await backToTop.click();
  await expect(page).toHaveURL(/#profile$/);
});
