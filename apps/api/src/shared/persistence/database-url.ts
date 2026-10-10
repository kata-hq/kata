/** Helpers for the one shared database URL. Each module selects its own Postgres schema. */

const PLACEHOLDER_URL = "postgres://unset@localhost:1/unset";

/** Returns the URL with `schema=<name>`. Prisma migrate uses it to keep `_prisma_migrations` in that schema. */
export function withSchema(databaseUrl: string, schema: string): string {
  const url = new URL(databaseUrl);
  url.searchParams.set("schema", schema);
  return url.toString();
}

/** The database name, taken from the URL path. */
export function databaseName(databaseUrl: string): string {
  const name = decodeURIComponent(new URL(databaseUrl).pathname.replace(/^\//, ""));
  if (name === "") throw new Error("The database URL has no database name");
  return name;
}

/** Test databases must end in `_test`. Destructive test helpers refuse every other name. */
export function isTestDatabase(databaseUrl: string): boolean {
  return databaseName(databaseUrl).endsWith("_test");
}

export function assertTestDatabase(databaseUrl: string): void {
  if (!isTestDatabase(databaseUrl)) {
    throw new Error(`Refusing to use database "${databaseName(databaseUrl)}": the name must end in "_test"`);
  }
}

/**
 * URL for a module's `prisma.config.ts`. `prisma generate` does not connect, so a missing
 * DATABASE_URL falls back to a placeholder; migrate and studio fail on it with a clear connection error.
 */
export function prismaConfigUrl(schema: string): string {
  return withSchema(process.env["DATABASE_URL"] ?? PLACEHOLDER_URL, schema);
}
