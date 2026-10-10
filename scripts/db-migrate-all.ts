// Applies every module's migrations, in the order of `persistenceModules` (health first).
// Creates the database when it is missing. Safe to run again: applied migrations are skipped.
import { ensureDatabase } from "../apps/api/src/shared/persistence/database-admin.ts";
import { persistenceModules, requireEnv, runPrisma } from "./lib/db.ts";

export async function migrateAll(databaseUrl: string): Promise<void> {
  await ensureDatabase(databaseUrl);
  for (const module of persistenceModules) {
    console.log(`\n▸ migrate ${module.name}`);
    await runPrisma(module, ["migrate", "deploy"], databaseUrl);
  }
}

if (import.meta.main) {
  await migrateAll(requireEnv("DATABASE_URL"));
}
