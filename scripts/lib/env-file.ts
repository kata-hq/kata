import { existsSync, readFileSync } from "node:fs";

/**
 * Reads a `.env` file (KEY=VALUE lines, `#` comments, optional quotes). Missing file → `{}`.
 * Used by scripts that run with `bun --no-env-file`, to tell `.env` values from shell overrides.
 */
export function readEnvFile(path: string): Record<string, string> {
  if (!existsSync(path)) return {};
  const values: Record<string, string> = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (match === null) continue;
    const [, key = "", raw = ""] = match;
    const quoted = /^(["'])(.*)\1$/.exec(raw);
    values[key] = quoted === null ? raw.replace(/\s+#.*$/, "") : (quoted[2] ?? "");
  }
  return values;
}
