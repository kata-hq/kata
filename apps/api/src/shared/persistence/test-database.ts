import { assertTestDatabase } from "./database-url.ts";

/**
 * For `*.int.test.ts` files: the test database URL. `bun run test:int` creates and migrates it first.
 * Throws when TEST_DATABASE_URL is missing or its name does not end in `_test`.
 */
export function testDatabaseUrl(): string {
  const url = process.env["TEST_DATABASE_URL"];
  if (url === undefined || url === "") throw new Error("Missing environment variable TEST_DATABASE_URL");
  assertTestDatabase(url);
  return url;
}
