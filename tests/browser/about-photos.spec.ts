import { expect, test } from "@playwright/test";
import photos from "../../src/data/about-photos.json";

test.beforeEach(async ({ page }) => {
  await page.route("https://*.supabase.co/**", (route) => route.abort());
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/lenis/);
});

test("only four selected portraits frame the manifesto without overlap", async ({ page }) => {
  const tiles = page.locator(".manifesto-photo");
  await expect(tiles).toHaveCount(4);
  const ids = await tiles.evaluateAll((elements) =>
    elements.map((element) => (element as HTMLElement).dataset.photoId),
  );
  expect(ids).toEqual([
    "1b2f4686abf5",
    "d462b6136b07",
    "5a2d5930e3aa",
    "d0142608e030",
  ]);
  for (const ratio of [0, 0.35, 0.7]) {
    await page
      .locator(".manifesto-composition")
      .evaluate((element, progress) => {
        window.scrollTo(
          0,
          element.getBoundingClientRect().top +
            window.scrollY +
            element.clientHeight * progress,
        );
      }, ratio);
    const layout = await page.evaluate(() => {
      const heading = document
        .querySelector("#about-heading")!
        .getBoundingClientRect();
      const rects = Array.from(document.querySelectorAll(".manifesto-photo")).map(
        (element) => element.getBoundingClientRect(),
      );
      const overlaps = (a: DOMRect, b: DOMRect) =>
        a.left < b.right &&
        a.right > b.left &&
        a.top < b.bottom &&
        a.bottom > b.top;
      return {
        overlapsText: rects.some((rect) => overlaps(rect, heading)),
        overlapsPhotos: rects.some((rect, index) =>
          rects.slice(index + 1).some((other) => overlaps(rect, other)),
        ),
        overflow: document.documentElement.scrollWidth > window.innerWidth,
      };
    });
    expect(layout).toEqual({
      overlapsText: false,
      overlapsPhotos: false,
      overflow: false,
    });
  }
});

test("photos open in original resolution and restore keyboard focus", async ({
  page,
}) => {
  const tile = page.locator(".manifesto-photo").first();
  await tile.scrollIntoViewIfNeeded();
  await tile.click();
  const dialog = page.getByRole("dialog", {
    name: "Personal photo collection",
  });
  await expect(dialog).toBeVisible();
  const image = dialog.locator(".lightbox-image img");
  await expect(image).toHaveJSProperty("complete", true);
  const src = await image.getAttribute("src");
  const original = photos.find((photo) => photo.src === src)!;
  expect(original).toBeTruthy();
  expect(
    await image.evaluate((element: HTMLImageElement) => element.naturalWidth),
  ).toBe(original.width);
  await page.keyboard.press("ArrowRight");
  await expect(image).not.toHaveAttribute("src", src!);
  const download = dialog.getByRole("link", {
    name: "Download original photograph",
  });
  await expect(download).toHaveAttribute(
    "href",
    (await image.getAttribute("src")) as string,
  );
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(tile).toBeFocused();
});
