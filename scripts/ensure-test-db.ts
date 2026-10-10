// Creates and migrates the integration test database (TEST_DATABASE_URL, name must end in `_test`).
// Preloaded by `bun run test:int` (bunfig.int.toml), so integration tests always start on the latest schema.
import { assertTestDatabase } from "../apps/api/src/shared/persistence/database-url.ts";
import { migrateAll } from "./db-migrate-all.ts";
import { requireEnv } from "./lib/db.ts";

const testDatabaseUrl = requireEnv("TEST_DATABASE_URL");
assertTestDatabase(testDatabaseUrl);
await migrateAll(testDatabaseUrl);
