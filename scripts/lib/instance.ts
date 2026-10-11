import { createServer } from "node:net";
import { basename } from "node:path";

/** Ports are picked by hashing the instance name into these ranges, then moving up to the next free port. */
const API_PORT_RANGE = { first: 3100, size: 800 } as const;
const WEB_PORT_RANGE = { first: 5200, size: 800 } as const;
const PORT_ATTEMPTS = 50;

/** One isolated instance: its own ports and its own databases on the shared Postgres server. */
export type Instance = {
  readonly name: string;
  readonly apiPort: number;
  readonly webPort: number;
  readonly databaseUrl: string;
  readonly testDatabaseUrl: string;
};

type Source = Readonly<Record<string, string | undefined>>;

/** Instance name: `INSTANCE`, else the name of the git worktree folder. */
export function instanceName(env: Source = process.env): string {
  const fromEnv = env["INSTANCE"];
  if (fromEnv !== undefined && fromEnv !== "") return fromEnv;
  const toplevel = Bun.spawnSync(["git", "rev-parse", "--show-toplevel"], { stderr: "ignore" });
  const path = toplevel.stdout.toString().trim();
  return toplevel.exitCode === 0 && path !== "" ? basename(path) : "kata";
}

/** Lowercase letters, digits and `_` only: safe in a database name. */
export function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  if (slug === "") throw new Error(`Instance name "${name}" has no letters or digits`);
  return slug;
}

/** FNV-1a: a small stable hash, so the same instance gets the same ports on every run. */
export function hash(text: string): number {
  let value = 0x811c9dc5;
  for (const char of text) {
    value ^= char.codePointAt(0) ?? 0;
    value = Math.imul(value, 0x01000193) >>> 0;
  }
  return value;
}

/**
 * Deterministic plan, without checking that the ports are free. `API_PORT` / `WEB_PORT` override the ports.
 * The databases live on the server of `DATABASE_URL` (else localhost:`POSTGRES_PORT`), named `kata_<slug>`.
 */
export function planInstance(name: string, env: Source = process.env): Instance {
  const slug = slugify(name);
  const offset = hash(slug);
  const database = `kata_${slug}`;
  return {
    name,
    apiPort: portOverride(env, "API_PORT") ?? API_PORT_RANGE.first + (offset % API_PORT_RANGE.size),
    webPort: portOverride(env, "WEB_PORT") ?? WEB_PORT_RANGE.first + (offset % WEB_PORT_RANGE.size),
    databaseUrl: databaseUrlFor(database, env),
    testDatabaseUrl: databaseUrlFor(`${database}_test`, env),
  };
}

/** `planInstance`, then moves each port that is not overridden up to the next free one. */
export async function resolveInstance(name: string, env: Source = process.env): Promise<Instance> {
  const plan = planInstance(name, env);
  const apiPort = portOverride(env, "API_PORT") ?? (await nextFreePort(plan.apiPort, []));
  const webPort = portOverride(env, "WEB_PORT") ?? (await nextFreePort(plan.webPort, [apiPort]));
  return { ...plan, apiPort, webPort };
}

/** The Postgres server of `DATABASE_URL` (or localhost:`POSTGRES_PORT`), with another database name. */
export function databaseUrlFor(database: string, env: Source = process.env): string {
  const base = env["DATABASE_URL"] ?? `postgres://kata:kata@localhost:${env["POSTGRES_PORT"] ?? "5432"}/kata`;
  const url = new URL(base);
  url.pathname = `/${database}`;
  return url.toString();
}

function portOverride(env: Source, name: string): number | undefined {
  const value = env[name];
  if (value === undefined || value === "") return undefined;
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) throw new Error(`${name} must be a port number`);
  return port;
}

async function nextFreePort(start: number, taken: readonly number[]): Promise<number> {
  for (let port = start; port < start + PORT_ATTEMPTS; port++) {
    if (!taken.includes(port) && (await isPortFree(port))) return port;
  }
  throw new Error(`No free port between ${start} and ${start + PORT_ATTEMPTS - 1}`);
}

/** Free when nothing listens on it, on IPv4 or IPv6 (Vite listens on `localhost`, which can be `::1`). */
export async function isPortFree(port: number): Promise<boolean> {
  for (const host of ["0.0.0.0", "127.0.0.1", "::", "::1"]) {
    if (!(await canListen(port, host))) return false;
  }
  return true;
}

function canListen(port: number, host: string): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", (error: NodeJS.ErrnoException) => resolve(error.code === "EADDRNOTAVAIL"));
    server.listen({ port, host, exclusive: true }, () => server.close(() => resolve(true)));
  });
}
