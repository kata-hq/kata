import { fileURLToPath } from "node:url";
import { reactRouter } from "@react-router/dev/vite";
import stylex from "@stylexjs/unplugin";
import { defineConfig, loadEnv } from "vite";
import { parseWebEnv } from "./web-env.ts";

// Monorepo root: the shared `.env` lives here, and StyleX needs it to resolve
// `@kata/design-system` tokens across the workspace boundary.
const rootDir = fileURLToPath(new URL("../..", import.meta.url));

export default defineConfig(({ mode }) => {
  // A missing or invalid variable stops the dev server / build with an error naming it.
  const env = parseWebEnv(loadEnv(mode, rootDir, ""));

  // `dev:isolated` sets INSTANCE: each instance gets its own dependency cache, so two dev servers of the
  // same worktree (for example `dev:isolated` and `e2e`) do not rewrite the same folder at the same time.
  const instance = process.env["INSTANCE"]?.replace(/[^\w-]/g, "_");

  return {
    ...(instance === undefined ? {} : { cacheDir: `node_modules/.vite/${instance}` }),
    plugins: [
      // StyleX must run before the React Router (React) plugin to keep Fast Refresh working.
      stylex.vite({ useCSSLayers: true, unstable_moduleResolution: { type: "commonJS", rootDir } }),
      reactRouter(),
    ],
    // Scan the app and the design system at startup, so Vite optimizes every dependency before the first page
    // load. Otherwise the first load gets "504 Outdated Optimize Dep" and can stay on "Loading…".
    optimizeDeps: {
      entries: ["app/**/*.{ts,tsx}", "../../packages/design-system/src/**/*.{ts,tsx}", "!**/*.test.{ts,tsx}"],
    },
    // The SPA build prerenders index.html through Vite's preview server. Bind it to IPv4 explicitly: in a Linux
    // container `localhost` resolves to ::1 first and the prerender request (to 127.0.0.1) is refused.
    preview: { host: "127.0.0.1" },
    server: {
      port: env.WEB_PORT,
      strictPort: true,
      proxy: { "/api": { target: env.API_URL, changeOrigin: true } },
    },
  };
});
