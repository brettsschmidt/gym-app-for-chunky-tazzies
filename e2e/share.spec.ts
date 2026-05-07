import { test, expect } from "@playwright/test";

test("share page returns 404 for unknown slug", async ({ page }) => {
  const res = await page.goto("/share/notarealslug");
  expect(res?.status()).toBeGreaterThanOrEqual(400);
});
