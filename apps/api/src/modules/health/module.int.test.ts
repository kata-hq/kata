import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { createLogger } from "../../logger.ts";
import { resetTestDatabase } from "../../shared/persistence/database-admin.ts";
import { testDatabaseUrl } from "../../shared/persistence/test-database.ts";
import { createHealthModule, createHealthPrismaClient } from "./index.ts";

const url = testDatabaseUrl();
const prisma = createHealthPrismaClient(url);
const logger = createLogger({ write: () => {} });
const health = createHealthModule({ prisma, logger });

beforeEach(() => resetTestDatabase(url, ["health"]));
afterAll(() => prisma.$disconnect());

describe("health module", () => {
  test("GET / records a system check and returns 200 with db ok", async () => {
    const res = await health.routes.request("/");

    expect(res.status).toBe(200);
    const body = (await res.json()) as { lastCheck: string };
    expect(body).toMatchObject({ api: "ok", db: "ok" });
    const row = await prisma.systemCheck.findFirstOrThrow();
    expect(row.status).toBe("ok");
    expect(body.lastCheck).toBe(row.checkedAt.toISOString());
  });

  test("GET / returns 503 with db down when Postgres cannot be reached", async () => {
    const unreachable = createHealthPrismaClient("postgres://kata:kata@127.0.0.1:1/kata_test");
    try {
      const res = await createHealthModule({ prisma: unreachable, logger }).routes.request("/");

      expect(res.status).toBe(503);
      expect(await res.json()).toMatchObject({ api: "ok", db: "down" });
    } finally {
      await unreachable.$disconnect();
    }
  });
});
