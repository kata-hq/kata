import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";

// Set by run.ts (`bun run e2e`), which picks free ports for the e2e instance.
const required = (name: string): string => {
  const value = process.env[name];
  if (value === undefined || value === "")
    throw new Error(`${name} is not set. Run the tests with \`bun run e2e\`.`);
  return value;
};

const instance = required("KATA_E2E_INSTANCE");
const apiPort = required("KATA_E2E_API_PORT");
const webPort = required("KATA_E2E_WEB_PORT");
const webUrl = `http://localhost:${webPort}`;
const rootDir = fileURLToPath(new URL("../..", import.meta.url));
const ci = process.env["CI"] !== undefined;

export default defineConfig({
  testDir: "tests",
  forbidOnly: ci,
  retries: ci ? 1 : 0,
  reporter: ci ? [["list"], ["html", { open: "never" }]] : "list",
  // The first page load waits for Vite to optimize dependencies.
  timeout: 90_000,
  use: { baseURL: webUrl, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // A fresh isolated instance: database dropped, migrated and seeded, then api + web on the chosen ports.
  webServer: {
    command: "bun --no-env-file scripts/dev-isolated.ts --reset",
    cwd: rootDir,
    env: { INSTANCE: instance, API_PORT: apiPort, WEB_PORT: webPort },
    url: webUrl,
    reuseExistingServer: false,
    timeout: 180_000,
    stdout: "pipe",
    gracefulShutdown: { signal: "SIGTERM", timeout: 10_000 },
  },
});
