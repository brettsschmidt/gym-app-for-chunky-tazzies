import { test, expect } from "@playwright/test";
import {
  FIXTURE_EMAIL,
  FIXTURE_PASSWORD,
  signIn,
  signOut,
  expectAuthenticated,
} from "./helpers/auth";

test.describe("public pages", () => {
  test("landing links to sign in/up + shows logo", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /get started/i })).toBeVisible();
    await expect(page.getByAltText(/chunky tazzies/i).first()).toBeVisible();
  });

  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/^password$/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("signup page renders", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByLabel(/display name/i)).toBeVisible();
    await expect(page.getByLabel(/^password$/i)).toBeVisible();
    await expect(page.getByLabel(/confirm/i)).toBeVisible();
  });
});

test.describe("auth flow", () => {
  test("signin → dashboard, signout → public, signin again", async ({ page }) => {
    await signIn(page, FIXTURE_EMAIL, FIXTURE_PASSWORD);
    await expectAuthenticated(page);

    await signOut(page);
    await expect(page).toHaveURL(/\/(login|$|^\/$)/);

    await signIn(page, FIXTURE_EMAIL, FIXTURE_PASSWORD);
    await expectAuthenticated(page);
  });
});
