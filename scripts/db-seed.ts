// Writes dev data: each module's seed function, in migration order. Local databases only.
import { assertLocalDatabase, persistenceModules, requireEnv } from "./lib/db.ts";

export async function seedAll(databaseUrl: string): Promise<void> {
  assertLocalDatabase(databaseUrl);
  for (const module of persistenceModules) {
    const rows = await module.seed(databaseUrl);
    console.log(`seeded ${module.name}: ${rows} rows`);
  }
}

if (import.meta.main) {
  await seedAll(requireEnv("DATABASE_URL"));
}
