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

  return {
    plugins: [
      // StyleX must run before the React Router (React) plugin to keep Fast Refresh working.
      stylex.vite({ useCSSLayers: true, unstable_moduleResolution: { type: "commonJS", rootDir } }),
      reactRouter(),
    ],
    server: {
      port: env.WEB_PORT,
      strictPort: true,
      proxy: { "/api": { target: env.API_URL, changeOrigin: true } },
    },
  };
});
