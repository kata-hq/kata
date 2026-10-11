import { expect, test } from "@playwright/test";

test("home page shows the API and database status read from the database", async ({ page }) => {
  await page.goto("/");

  // Cold start: Vite optimizes dependencies on the first load, so the first check waits longer.
  await expect(page.getByText("API ok")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText("Database ok")).toBeVisible();
  await expect(page.getByText(/^Last system check:/)).toBeVisible();
});
