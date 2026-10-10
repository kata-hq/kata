// Drops the dev database (DATABASE_URL), creates it again and applies every migration. Local databases only.
import { dropDatabase } from "../apps/api/src/shared/persistence/database-admin.ts";
import { migrateAll } from "./db-migrate-all.ts";
import { assertLocalDatabase, requireEnv } from "./lib/db.ts";

const databaseUrl = requireEnv("DATABASE_URL");
assertLocalDatabase(databaseUrl);
await dropDatabase(databaseUrl);
await migrateAll(databaseUrl);
