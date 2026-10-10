import { z } from "zod";

const port = z.coerce
  .number({ error: "must be a port number" })
  .int({ error: "must be a port number" })
  .min(1, { error: "must be a port number" })
  .max(65_535, { error: "must be a port number" });

/** Every environment variable the web dev server reads. Parsed once, in `vite.config.ts`. */
const envSchema = z.object({
  WEB_PORT: port.default(5173),
  API_PORT: port.default(3000),
  API_URL: z.url({ protocol: /^https?$/, error: "must be an http(s):// URL" }).optional(),
});

export type WebEnv = {
  /** Port of the Vite dev server. */
  readonly WEB_PORT: number;
  /** Where the dev server proxies `/api`. Defaults to `http://localhost:${API_PORT}`. */
  readonly API_URL: string;
};

/** Parses the environment. Throws one error that names every missing or invalid variable (never its value). */
export function parseWebEnv(source: Readonly<Record<string, string | undefined>>): WebEnv {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((issue) => `${String(issue.path[0])}: ${issue.message}`);
    throw new Error(`Invalid web environment: ${problems.join("; ")}`);
  }
  const env = parsed.data;
  return { WEB_PORT: env.WEB_PORT, API_URL: env.API_URL ?? `http://localhost:${env.API_PORT}` };
}
