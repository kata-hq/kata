import { fileURLToPath } from "node:url";

/** A module that owns a Postgres schema, a Prisma schema and a migrations folder. */
export type PersistenceModule = {
  readonly name: string;
  /** Postgres schema of the module. Also holds its `_prisma_migrations` table. */
  readonly schema: string;
  /** Absolute path of the module's `prisma.config.ts`. */
  readonly prismaConfig: string;
  /** Writes realistic dev data. Runs in this list's order. */
  readonly seed: (databaseUrl: string) => Promise<number>;
};

/**
 * Migration order. A module may reference (foreign key) only modules listed before it.
 * Future order: health, identity, academic, work, planning, notes, platform.
 */
export const persistenceModules: readonly PersistenceModule[] = [
  {
    name: "health",
    schema: "health",
    prismaConfig: fileURLToPath(new URL("./modules/health/prisma/prisma.config.ts", import.meta.url)),
    // Lazy: `db:generate` reads this list before the generated client exists.
    seed: async (url) => (await import("./modules/health/prisma/seed.ts")).seedHealth(url),
  },
  {
    name: "identity",
    schema: "identity",
    prismaConfig: fileURLToPath(new URL("./modules/identity/prisma/prisma.config.ts", import.meta.url)),
    seed: async (url) => (await import("./modules/identity/prisma/seed.ts")).seedIdentity(url),
  },
];

export const apiRoot = fileURLToPath(new URL("..", import.meta.url));
