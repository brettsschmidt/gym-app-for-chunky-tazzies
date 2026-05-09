import { test, expect } from "@playwright/test";
import { signInFixtureUser } from "./helpers/auth";

test("create tazzle from /chunky-tazzles/new lands on members page", async ({
  page,
}) => {
  await signInFixtureUser(page);

  await page.goto("/chunky-tazzles/new");
  await expect(page.getByLabel(/tazzle name/i)).toBeVisible();

  const tazzleName = `Test Tazzle ${Date.now().toString(36)}`;
  await page.getByLabel(/tazzle name/i).fill(tazzleName);
  await page.getByRole("button", { name: /^create$/i }).click();

  await page.waitForURL(/\/chunky-tazzles\/[0-9a-f-]+\/members/, {
    timeout: 15_000,
  });
  await expect(page.getByText(tazzleName).first()).toBeVisible();
});

test("create tazzle from /chunky-tazzles list page", async ({ page }) => {
  await signInFixtureUser(page);

  await page.goto("/chunky-tazzles");
  await page.getByRole("link", { name: /new/i }).click();
  await page.waitForURL("**/chunky-tazzles/new");

  const tazzleName = `From-list ${Date.now().toString(36)}`;
  await page.getByLabel(/tazzle name/i).fill(tazzleName);
  await page.getByRole("button", { name: /^create$/i }).click();

  await page.waitForURL(/\/chunky-tazzles\/[0-9a-f-]+\/members/, {
    timeout: 15_000,
  });
});
