import type { Config } from "@react-router/dev/config";

// SPA mode: the build is static files in build/client and data loads in the browser (`clientLoader`).
export default {
  appDirectory: "app",
  ssr: false,
} satisfies Config;
