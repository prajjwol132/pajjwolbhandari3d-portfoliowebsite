import { expect, test, type Page } from "@playwright/test";

async function focusPhoto(page: Page, chapter: number) {
  await page.locator(`#chapter-${chapter} .history-photo`).evaluate(element => {
    const rect = element.getBoundingClientRect();
    window.scrollTo({ top: scrollY + rect.top + rect.height / 2 - innerHeight / 2, behavior: "instant" });
  });
  await expect(page.locator("[data-history-active]")).toHaveCount(1);
  await expect(page.locator(`#chapter-${chapter} .history-photo`)).toHaveAttribute("data-history-active", "true");
}

async function expectOnlyPhotoInColor(page: Page, chapter: number) {
  await expect(page.locator(`#chapter-${chapter} .history-photo img`)).toHaveCSS("filter", "grayscale(0)");
  for (let index = 1; index <= 5; index += 1) {
    if (index !== chapter) {
      await expect(page.locator(`#chapter-${index} .history-photo img`)).toHaveCSS("filter", "grayscale(1)");
    }
  }
}

test.beforeEach(async ({ page }) => {
  await page.route("https://*.supabase.co/**", route => route.abort());
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
});

test("chapters are compact and the three-column or stacked layout stays collision-free", async ({ page }, info) => {
  await focusPhoto(page, 1);
  const layout = await page.locator("#history").evaluate(section => {
    const rows = Array.from(section.querySelectorAll<HTMLElement>(".history-chapter"));
    return {
      desktop: innerWidth > 767,
      sectionHeight: section.getBoundingClientRect().height,
      overflow: document.documentElement.scrollWidth > innerWidth,
      rows: rows.map(row => {
        const title = row.querySelector("h3")!.getBoundingClientRect();
        const photo = row.querySelector(".history-photo")!.getBoundingClientRect();
        const copy = row.querySelector(".history-copy")!.getBoundingClientRect();
        return {
          height: row.getBoundingClientRect().height,
          photoWidth: photo.width,
          ordered: innerWidth > 767
            ? title.right < photo.left && photo.right < copy.left
            : title.bottom < photo.top && photo.bottom < copy.top,
        };
      }),
    };
  });
  expect(layout.overflow).toBe(false);
  expect(layout.sectionHeight).toBeLessThan(layout.desktop ? 2200 : 3800);
  for (const row of layout.rows) {
    expect(row.ordered).toBe(true);
    expect(row.height).toBeLessThan(layout.desktop ? 440 : 760);
    expect(row.photoWidth).toBeLessThanOrEqual(layout.desktop ? 320 : 260);
  }
  await page.locator("#history").evaluate(section => window.scrollTo({ top: scrollY + section.getBoundingClientRect().top, behavior: "instant" }));
  await page.locator("#history img").evaluateAll(images => Promise.all(images.map(image => (image as HTMLImageElement).decode())));
  await page.screenshot({ path: info.outputPath("compact-history.png"), scale: "css" });
});

test("only the focused photo is colored, including scrolling backward and leaving the section", async ({ page }) => {
  for (const chapter of [1, 2, 4, 5, 3, 1]) {
    await focusPhoto(page, chapter);
    await expectOnlyPhotoInColor(page, chapter);
  }
  await page.locator("#projects").evaluate(section => window.scrollTo({ top: scrollY + section.getBoundingClientRect().top, behavior: "instant" }));
  await expect(page.locator("[data-history-active]")).toHaveCount(0);
  await focusPhoto(page, 2);
  await expectOnlyPhotoInColor(page, 2);
  await expect(page.locator("#chapter-2 .history-photo")).toHaveCSS("transform", "none");
  await expect(page.locator("#chapter-2 .history-photo img")).toHaveCSS("transition-property", "none");
});

test("photo pop and color transitions work without shifting the surrounding content", async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.reload();
  await expect(page.locator(".character-stage")).toHaveAttribute("data-reduced-motion", "false");
  await page.evaluate(() => document.fonts.ready);
  await focusPhoto(page, 2);
  const photo = page.locator("#chapter-2 .history-photo");
  await expect(photo).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
  await expect(photo).toHaveCSS("transition-duration", "0.55s");
  const heightBefore = await page.locator("#history").evaluate(section => section.getBoundingClientRect().height);
  await focusPhoto(page, 3);
  await expectOnlyPhotoInColor(page, 3);
  await expect(photo).toHaveCSS("transform", "matrix(0.94, 0, 0, 0.94, 0, 0)");
  expect(await page.locator("#history").evaluate(section => section.getBoundingClientRect().height)).toBe(heightBefore);
  await focusPhoto(page, 2);
  await expectOnlyPhotoInColor(page, 2);
  await expect(photo).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
  await photo.locator("img").evaluate((image: HTMLImageElement) => image.decode());
  await page.screenshot({ path: info.outputPath("active-photo.png"), scale: "css" });
});

test("resizing between desktop and mobile keeps exactly one focal photo", async ({ page }) => {
  for (const width of [1880, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await focusPhoto(page, 3);
    await expectOnlyPhotoInColor(page, 3);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
