import { Page, expect } from "@playwright/test";

// A persistent test user must exist in auth.users with these credentials.
// Seed it once via SQL (see e2e/README.md or scripts/seed-test-user.sql).
export const FIXTURE_EMAIL = "e2e-fixture@example.com";
export const FIXTURE_PASSWORD = "test-password-123!";

export function uniqueTestEmail(prefix = "e2e") {
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${stamp}-${rand}@example.com`;
}

export async function signIn(page: Page, email: string, password: string) {
  // Suppress the first-load welcome dialog so it doesn't trap focus and
  // hide the rest of the dashboard from accessibility queries.
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem("ct-welcomed-v1", "1");
    } catch {}
  });
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/^password$/i).fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 15_000 });
}

export async function signInFixtureUser(page: Page) {
  await signIn(page, FIXTURE_EMAIL, FIXTURE_PASSWORD);
}

// Use sparingly — Supabase rate-limits signup by IP (~4/hour by default).
// Prefer signInFixtureUser for most tests.
export async function signUpFreshUser(
  page: Page,
  opts: { displayName?: string } = {},
) {
  const email = uniqueTestEmail();
  const displayName = opts.displayName ?? "Tazzle Tester";

  await page.goto("/signup");
  await page.getByLabel(/display name/i).fill(displayName);
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/^password$/i).fill(FIXTURE_PASSWORD);
  await page.getByLabel(/confirm/i).fill(FIXTURE_PASSWORD);
  await page.getByRole("button", { name: /sign up|create account/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 15_000 });
  return { email, password: FIXTURE_PASSWORD, displayName };
}

export async function signOut(page: Page) {
  await page.getByRole("button", { name: /user menu/i }).click();
  await page.getByRole("menuitem", { name: /sign out/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/dashboard"), {
    timeout: 10_000,
  });
}

export async function expectAuthenticated(page: Page) {
  await expect(page).toHaveURL(/\/(dashboard|onboarding)/);
  await expect(page.getByRole("button", { name: /user menu/i })).toBeVisible();
}
