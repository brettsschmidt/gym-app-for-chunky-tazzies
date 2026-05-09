import { test, expect } from "@playwright/test";
import { signInFixtureUser } from "./helpers/auth";

test("FAB logs a hot dog and the count appears on /hotdogs", async ({ page }) => {
  await signInFixtureUser(page);

  // Make sure the fixture user has at least one tazzle so an active one is set.
  await page.goto("/chunky-tazzles/new");
  await page.getByLabel(/tazzle name/i).fill(`HotDog ${Date.now().toString(36)}`);
  await page.getByRole("button", { name: /^create$/i }).click();
  await page.waitForURL(/\/chunky-tazzles\/[0-9a-f-]+\/members/);

  // FAB lives in the (app) layout so it's reachable from any authed page.
  await page.goto("/dashboard");
  await page.getByRole("button", { name: /log hot dog/i }).click();

  // Default count is 1; submit.
  await page.getByRole("button", { name: /^log 1/i }).click();

  // Stats page should reflect the new log.
  await page.goto("/hotdogs");
  await expect(page.getByRole("heading", { name: /hot dog tracker/i })).toBeVisible();
  await expect(page.getByText(/tazzle total/i)).toBeVisible();
  await expect(page.getByText(/leaderboard/i)).toBeVisible();
});

test("FAB is reachable from chunky-tazzles and other authed routes", async ({
  page,
}) => {
  await signInFixtureUser(page);
  for (const route of ["/dashboard", "/chunky-tazzles", "/sessions"]) {
    await page.goto(route);
    await expect(page.getByRole("button", { name: /log hot dog/i })).toBeVisible();
  }
});
