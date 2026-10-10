import { describe, expect, test } from "bun:test";
import { resetTestDatabase } from "./database-admin.ts";
import { assertTestDatabase, databaseName, isTestDatabase, withSchema } from "./database-url.ts";

describe("database URL helpers", () => {
  test("withSchema sets the schema parameter and keeps the others", () => {
    expect(withSchema("postgres://kata:kata@localhost:5432/kata?sslmode=disable", "health")).toBe(
      "postgres://kata:kata@localhost:5432/kata?sslmode=disable&schema=health",
    );
  });

  test("databaseName reads the path", () => {
    expect(databaseName("postgres://kata:kata@localhost:5432/kata_test?schema=health")).toBe("kata_test");
  });

  test("databaseName rejects a URL without a database", () => {
    expect(() => databaseName("postgres://kata:kata@localhost:5432")).toThrow("no database name");
  });

  test("only names ending in _test are test databases", () => {
    expect(isTestDatabase("postgres://localhost/kata_test")).toBe(true);
    expect(isTestDatabase("postgres://localhost/kata")).toBe(false);
    expect(isTestDatabase("postgres://localhost/kata_test_backup")).toBe(false);
    expect(() => assertTestDatabase("postgres://localhost/kata")).toThrow('Refusing to use database "kata"');
  });
});

describe("resetTestDatabase", () => {
  test("refuses a database whose name does not end in _test, before connecting", async () => {
    await expect(resetTestDatabase("postgres://kata:kata@localhost:1/kata", ["health"])).rejects.toThrow(
      'Refusing to use database "kata"',
    );
  });
});
