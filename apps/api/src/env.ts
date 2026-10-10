import { err, ok, type Result } from "@kata/shared";
import { z } from "zod";
import { LOG_LEVELS, type Logger } from "./logger.ts";

/** Every environment variable the API reads. Parsed once at startup, in `server.ts`. */
const envSchema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/, error: "must be a postgres:// URL" }),
  API_PORT: z.coerce
    .number({ error: "must be a port number" })
    .int({ error: "must be a port number" })
    .min(1, { error: "must be a port number" })
    .max(65_535, { error: "must be a port number" })
    .default(3000),
  LOG_LEVEL: z.enum(LOG_LEVELS, { error: `must be one of ${LOG_LEVELS.join(", ")}` }).default("info"),
});

export type Env = z.infer<typeof envSchema>;

/** One bad variable. `problem` never contains the value (it can be a secret). */
export type EnvProblem = { readonly name: string; readonly problem: string };

export function parseEnv(source: Readonly<Record<string, string | undefined>>): Result<Env, EnvProblem[]> {
  const parsed = envSchema.safeParse(source);
  if (parsed.success) return ok(parsed.data);
  return err(
    parsed.error.issues.map((issue) => {
      const name = String(issue.path[0] ?? "(env)");
      return { name, problem: source[name] === undefined ? "missing" : issue.message };
    }),
  );
}

/** Parses the environment. On a missing or invalid variable, logs each one by name and exits with code 1. */
export function loadEnv(
  source: Readonly<Record<string, string | undefined>>,
  logger: Logger,
  exit: (code: number) => never = process.exit,
): Env {
  const env = parseEnv(source);
  if (env.ok) return env.value;
  logger.error("invalid environment", { variables: env.error });
  return exit(1);
}
