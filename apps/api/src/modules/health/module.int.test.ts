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
  test("GET / returns 200 with db ok and the time of this check on an empty table, without writing", async () => {
    const before = Date.now();
    const res = await health.routes.request("/");

    expect(res.status).toBe(200);
    const body = (await res.json()) as { lastCheck: string };
    expect(body).toMatchObject({ api: "ok", db: "ok" });
    const lastCheck = Date.parse(body.lastCheck);
    expect(lastCheck).toBeGreaterThanOrEqual(before);
    expect(lastCheck).toBeLessThanOrEqual(Date.now());
    expect(await prisma.systemCheck.count()).toBe(0);
  });

  test("polling GET / does not grow the system_check table", async () => {
    await prisma.systemCheck.createMany({ data: [{ status: "ok" }, { status: "degraded" }] });

    for (let call = 0; call < 3; call += 1) {
      const res = await health.routes.request("/");
      expect(res.status).toBe(200);
      expect(await res.json()).toMatchObject({ api: "ok", db: "ok" });
    }

    expect(await prisma.systemCheck.count()).toBe(2);
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
