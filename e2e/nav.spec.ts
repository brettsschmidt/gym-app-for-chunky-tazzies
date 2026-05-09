import { test, expect, type Page } from "@playwright/test";
import { signInFixtureUser } from "./helpers/auth";

// Both the BottomNav and the (md+) SideNav contain a "Home" link.
// On mobile only BottomNav is visible — but both render in the DOM.
// Scope queries to the labelled <nav aria-label="Primary"> = BottomNav.
const bottomNav = (page: Page) =>
  page.getByRole("navigation", { name: /primary/i });

const AUTHED_ROUTES = [
  "/dashboard",
  "/chunky-tazzles",
  "/sessions",
  "/workouts",
  "/nutrition",
  "/metrics",
  "/exercises",
  "/programs",
  "/cardio",
  "/wellness",
  "/settings",
];

test("mobile bottom-nav is visible on every authenticated route", async ({
  page,
}) => {
  await signInFixtureUser(page);

  for (const route of AUTHED_ROUTES) {
    await page.goto(route);
    await expect(
      bottomNav(page).getByRole("link", { name: /^home$/i }),
      `bottom-nav Home link missing on ${route}`,
    ).toBeVisible();
    await expect(
      bottomNav(page).getByRole("link", { name: /^train$/i }),
      `bottom-nav Train link missing on ${route}`,
    ).toBeVisible();
  }
});

test("bottom-nav Home link returns to dashboard from a tazzle page", async ({
  page,
}) => {
  await signInFixtureUser(page);

  await page.goto("/chunky-tazzles");
  await expect(page).toHaveURL(/\/chunky-tazzles$/);

  // Programmatic .click() bypasses the Next.js dev-tools floating widget
  // that overlaps the bottom-left of the BottomNav in dev mode.
  await bottomNav(page)
    .getByRole("link", { name: /^home$/i })
    .evaluate((el) => (el as HTMLElement).click());
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("user menu trigger is reachable from any authed page", async ({ page }) => {
  await signInFixtureUser(page);
  await page.goto("/chunky-tazzles");
  await expect(page.getByRole("button", { name: /user menu/i })).toBeVisible();
});
