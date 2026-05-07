import { test, expect } from "@playwright/test";

test("manifest.json is served", async ({ request }) => {
  const res = await request.get("/manifest.json");
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.name).toMatch(/Chunky Tazzies/);
  expect(Array.isArray(body.icons)).toBe(true);
});
