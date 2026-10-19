import { expect, test } from "@playwright/test";
import { fallbackProjects, selectedVideoProjects } from "../../src/data/portfolio-projects";

test.beforeEach(async ({ page }) => {
  // Repeatable local preview: exercise the established offline content path.
  await page.route("https://*.supabase.co/**", (route) => route.abort());
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Prajjwol Bhandari", exact: true }),
  ).toBeVisible();
  // A dev-server restart can stream HTML before React has attached handlers.
  await expect(page.locator("html")).toHaveClass(/lenis/);
});

test("complete page, loaded assets and responsive bounds", async ({
  page,
}, testInfo) => {
  for (const id of [
    "profile",
    "about",
    "history",
    "projects",
    "calendar",
    "gallery",
    "contact",
  ]) {
    await expect(page.locator(`#${id}`)).toBeAttached();
  }
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
  await page.locator("#gallery").scrollIntoViewIfNeeded();
  await expect(page.locator(".gallery-print-center img")).toHaveJSProperty(
    "complete",
    true,
  );
  expect(
    await page
      .locator(".gallery-print-center img")
      .evaluate((img: HTMLImageElement) => img.naturalWidth),
  ).toBeGreaterThan(0);
  await page.screenshot({
    path: `artifacts/${testInfo.project.name}-gallery.png`,
  });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
  await page.screenshot({
    path: `artifacts/${testInfo.project.name}-hero.png`,
  });
});

test("menu opens, Escape restores focus, section navigation works", async ({
  page,
}) => {
  const trigger = page.getByRole("button", { name: "Open menu", exact: true });
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Gallery" })
    .click();
  await expect(page).toHaveURL(/#gallery$/);
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect
    .poll(async () =>
      Math.abs(
        await page
          .locator("#gallery")
          .evaluate((el) => el.getBoundingClientRect().top),
      ),
    )
    .toBeLessThan(5);
});

test("project categories, case study and calendar buttons work", async ({
  page,
}) => {
  await page.locator("#projects").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: /Video Editing \[/ }).click();
  await expect(page.locator(".showcase-card")).toHaveCount(selectedVideoProjects.length);
  await page
    .getByRole("button", {
      name: `View ${selectedVideoProjects[0].title}`,
      exact: true,
    })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("heading", { name: selectedVideoProjects[0].title, exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close project modal" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("button", { name: /All projects \[/ }).click();
  await expect(page.locator(".showcase-card")).toHaveCount(fallbackProjects.length);
  await page.locator(".calendar-row").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test("gallery next, previous, keyboard and lightbox work", async ({ page }) => {
  await page.locator("#gallery").scrollIntoViewIfNeeded();
  const activeImage = page.locator(".gallery-print-center img");
  const original = await activeImage.getAttribute("alt");
  await page
    .getByRole("button", { name: "Next gallery item", exact: true })
    .click();
  await expect(activeImage).not.toHaveAttribute("alt", original!);
  await page
    .getByRole("button", { name: "Previous gallery item", exact: true })
    .click();
  await expect(activeImage).toHaveAttribute("alt", original!);
  await page.locator(".gallery-stage").focus();
  await page.keyboard.press("ArrowRight");
  await expect(activeImage).not.toHaveAttribute("alt", original!);
  await page.locator(".gallery-print-center").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Next enlarged photograph" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.locator(".gallery-print-center")).toBeFocused();
});

test("contact validates before opening an email draft", async ({ page }) => {
  await page.locator("#contact").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  expect(
    await page
      .locator(".contact-form")
      .evaluate((form: HTMLFormElement) => form.checkValidity()),
  ).toBe(false);
  await page.getByLabel("First Name", { exact: true }).fill("Test");
  await page.getByLabel("Last Name", { exact: true }).fill("Visitor");
  await page
    .getByLabel("Email", { exact: true })
    .fill("visitor@example.com");
  await page
    .getByLabel("Message", { exact: true })
    .fill("I would like to discuss a new project.");
  expect(
    await page
      .locator(".contact-form")
      .evaluate((form: HTMLFormElement) => form.checkValidity()),
  ).toBe(true);
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(page.locator(".contact-form").getByRole("status")).toContainText("email draft");
});

test("reduced motion keeps content and navigation accessible", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await page.locator(".hero-next").click();
  await expect
    .poll(() =>
      page
        .locator("#about")
        .evaluate((el) => Math.abs(el.getBoundingClientRect().top)),
    )
    .toBeLessThan(5);
  await page.locator("#history").scrollIntoViewIfNeeded();
  await expect(page.locator(".history-copy").first()).toHaveCSS(
    "visibility",
    "visible",
  );
  await expect(page.locator(".character-stage")).toHaveAttribute("data-reduced-motion", "true");
});

test("cursor turns the character's head", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Touch gaze is covered by the dedicated character tests.");
  const stage = page.locator(".character-stage");
  await expect(stage).toHaveAttribute("data-character-ready", "true", { timeout: 60000 });
  await page.mouse.move(50, 400);
  await expect.poll(async () => Number(await stage.locator("canvas").getAttribute("data-gaze-x"))).toBeLessThan(-0.3);
  await page.mouse.move(1380, 400);
  await expect.poll(async () => Number(await stage.locator("canvas").getAttribute("data-gaze-x"))).toBeGreaterThan(0.3);
});

test("an empty CMS category stays empty instead of showing sample work", async ({
  page,
}) => {
  await page.route("https://*.supabase.co/rest/v1/categories*", (route) =>
    route.fulfill({
      json: [
        { id: "empty", name: "New work", slug: "new-work", display_order: 1 },
      ],
    }),
  );
  await page.route("https://*.supabase.co/rest/v1/projects*", (route) =>
    route.fulfill({ json: [] }),
  );
  await page.reload();
  await page.locator("#projects").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: /New work \[00\]/ }).click();
  await expect(page.locator(".showcase-card")).toHaveCount(0);
  await expect(page.locator("#projects").getByRole("status")).toContainText(
    "No projects",
  );
  await expect(page.locator(".character-project-count")).toHaveText("00");
});
