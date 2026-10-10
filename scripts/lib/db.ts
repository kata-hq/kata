import {
  apiRoot,
  type PersistenceModule,
  persistenceModules,
} from "../../apps/api/src/persistence-modules.ts";

export { persistenceModules };

/** Reads a required env var (Bun loads the root `.env`). Exits naming the var when it is missing. */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    console.error(`Missing environment variable ${name}. Copy .env.example to .env.`);
    process.exit(1);
  }
  return value;
}

/** Runs the Prisma CLI (installed in apps/api) for one module, against `databaseUrl`. */
export async function runPrisma(
  module: PersistenceModule,
  args: readonly string[],
  databaseUrl: string | undefined,
): Promise<void> {
  const env: Record<string, string | undefined> = { ...process.env, PRISMA_HIDE_UPDATE_MESSAGE: "1" };
  if (databaseUrl !== undefined) env["DATABASE_URL"] = databaseUrl;
  const child = Bun.spawn(["bun", "x", "prisma", ...args, "--config", module.prismaConfig], {
    cwd: apiRoot,
    env,
    stdio: ["inherit", "inherit", "inherit"],
  });
  const code = await child.exited;
  if (code !== 0) throw new Error(`prisma ${args.join(" ")} failed for module ${module.name} (exit ${code})`);
}

/** Only local databases can be dropped by the dev scripts. */
export function assertLocalDatabase(databaseUrl: string): void {
  const host = new URL(databaseUrl).hostname;
  if (!["localhost", "127.0.0.1", "::1", "[::1]"].includes(host)) {
    console.error(`Refusing to change database on host "${host}": only local databases are allowed.`);
    process.exit(1);
  }
}
