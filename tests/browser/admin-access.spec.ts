import { expect, test } from "@playwright/test";

test("the admin dashboard redirects visitors without an authenticated session", async ({ page }) => {
  await page.goto("/admin/dashboard");
  await expect(page).toHaveURL(/\/admin\/login(?:\?|$)/);
  await expect(page.getByRole("heading", { name: /admin/i })).toBeVisible();
});
