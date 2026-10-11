// Applies every module's migrations, in the order of `persistenceModules` (health first).
// Creates the database when it is missing. Safe to run again: applied migrations are skipped.
import { ensureDatabase } from "../apps/api/src/shared/persistence/database-admin.ts";
import { persistenceModules, requireEnv, runPrisma } from "./lib/db.ts";

/** Returns `true` when the database was created by this run. */
export async function migrateAll(databaseUrl: string): Promise<boolean> {
  const created = await ensureDatabase(databaseUrl);
  for (const module of persistenceModules) {
    console.log(`\n▸ migrate ${module.name}`);
    await runPrisma(module, ["migrate", "deploy"], databaseUrl);
  }
  return created;
}

if (import.meta.main) {
  await migrateAll(requireEnv("DATABASE_URL"));
}
