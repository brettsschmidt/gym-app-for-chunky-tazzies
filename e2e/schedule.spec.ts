import { test, expect } from "@playwright/test";
import { signInFixtureUser } from "./helpers/auth";

test("schedule page renders with all 7 days", async ({ page }) => {
  await signInFixtureUser(page);
  await page.goto("/workouts/schedule");

  await expect(page.getByRole("heading", { name: /weekly schedule/i })).toBeVisible();
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
});

test("schedule page links from /workouts header", async ({ page }) => {
  await signInFixtureUser(page);
  await page.goto("/workouts");
  await page.getByRole("link", { name: /schedule/i }).click();
  await expect(page).toHaveURL(/\/workouts\/schedule$/);
});
