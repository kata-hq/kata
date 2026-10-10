// Writes dev data: each module's seed function, in migration order. Local databases only.
import { assertLocalDatabase, persistenceModules, requireEnv } from "./lib/db.ts";

const databaseUrl = requireEnv("DATABASE_URL");
assertLocalDatabase(databaseUrl);
for (const module of persistenceModules) {
  const rows = await module.seed(databaseUrl);
  console.log(`seeded ${module.name}: ${rows} rows`);
}
