import { test, expect, type Page } from "@playwright/test";
import { signInFixtureUser } from "./helpers/auth";

// Many pages redirect to /dashboard if there's no active tazzle in the cookie.
// Cookies don't persist across Playwright test contexts, so seed one by
// creating a tazzle (createTazzleAction sets the cookie via a server action).
async function ensureActiveTazzle(page: Page) {
  await page.goto("/chunky-tazzles/new");
  await page.getByLabel(/tazzle name/i).fill(`Sched ${Date.now().toString(36)}`);
  await page.getByRole("button", { name: /^create$/i }).click();
  await page.waitForURL(/\/chunky-tazzles\/[0-9a-f-]+\/members/);
}

test("schedule page renders the week or an empty-state CTA", async ({ page }) => {
  await signInFixtureUser(page);
  await ensureActiveTazzle(page);
  await page.goto("/workouts/schedule");

  await expect(page.getByRole("heading", { name: /weekly schedule/i })).toBeVisible();

  // Brand-new tazzle has no templates → empty-state CTA. With templates, the
  // 7 day rows render. Either path is a passing render.
  const hasTemplates = await page
    .getByText("Sunday")
    .first()
    .isVisible()
    .catch(() => false);

  if (hasTemplates) {
    for (const name of [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ]) {
      await expect(page.getByText(name).first()).toBeVisible();
    }
  } else {
    await expect(
      page.getByRole("link", { name: /create a template first/i }),
    ).toBeVisible();
  }
});

test("schedule page links from /workouts header", async ({ page }) => {
  await signInFixtureUser(page);
  await ensureActiveTazzle(page);
  await page.goto("/workouts");
  await page.getByRole("link", { name: /schedule/i }).click();
  await expect(page).toHaveURL(/\/workouts\/schedule$/);
});
