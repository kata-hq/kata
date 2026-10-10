import { Client } from "pg";
import { assertTestDatabase, databaseName } from "./database-url.ts";

/** Tooling only (scripts and tests): creates, drops and resets whole databases. */

export async function ensureDatabase(databaseUrl: string): Promise<void> {
  const name = databaseName(databaseUrl);
  await withMaintenanceClient(databaseUrl, async (client) => {
    const found = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [name]);
    if (found.rowCount === 0) await client.query(`CREATE DATABASE ${quoteIdentifier(name)}`);
  });
}

export async function dropDatabase(databaseUrl: string): Promise<void> {
  const name = databaseName(databaseUrl);
  await withMaintenanceClient(databaseUrl, async (client) => {
    await client.query(`DROP DATABASE IF EXISTS ${quoteIdentifier(name)} WITH (FORCE)`);
  });
}

/**
 * Empties every table of the given module schemas, keeping the migration history.
 * Refuses any database whose name does not end in `_test`.
 */
export async function resetTestDatabase(databaseUrl: string, schemas: readonly string[]): Promise<void> {
  assertTestDatabase(databaseUrl);
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const tables = await client.query<{ schemaname: string; tablename: string }>(
      "SELECT schemaname, tablename FROM pg_tables WHERE schemaname = ANY($1) AND tablename <> '_prisma_migrations'",
      [schemas],
    );
    if (tables.rows.length === 0) return;
    const names = tables.rows.map(
      (row) => `${quoteIdentifier(row.schemaname)}.${quoteIdentifier(row.tablename)}`,
    );
    await client.query(`TRUNCATE ${names.join(", ")} RESTART IDENTITY CASCADE`);
  } finally {
    await client.end();
  }
}

// CREATE/DROP DATABASE cannot run inside the target database, so connect to `postgres` on the same server.
async function withMaintenanceClient(
  databaseUrl: string,
  fn: (client: Client) => Promise<void>,
): Promise<void> {
  const url = new URL(databaseUrl);
  url.pathname = "/postgres";
  url.search = "";
  const client = new Client({ connectionString: url.toString() });
  await client.connect();
  try {
    await fn(client);
  } finally {
    await client.end();
  }
}

function quoteIdentifier(name: string): string {
  return `"${name.replaceAll('"', '""')}"`;
}
