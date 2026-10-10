import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { err, ok } from "@kata/shared";
import { resetTestDatabase } from "../../../shared/persistence/database-admin.ts";
import { testDatabaseUrl } from "../../../shared/persistence/test-database.ts";
import { createHealthPrismaClient } from "./health-prisma-client.ts";
import { createHealthUnitOfWork } from "./health-unit-of-work.ts";

const url = testDatabaseUrl();
const db = createHealthPrismaClient(url);
const unitOfWork = createHealthUnitOfWork(db);

beforeEach(() => resetTestDatabase(url, ["health"]));
afterAll(() => db.$disconnect());

describe("health unit of work", () => {
  test("commits every repository call when the work returns Ok", async () => {
    const result = await unitOfWork.run(async ({ systemChecks }) => {
      await systemChecks.record({ status: "ok" });
      await systemChecks.record({ status: "degraded" });
      return ok("done");
    });

    expect(result).toEqual({ ok: true, value: "done" });
    expect(await db.systemCheck.count()).toBe(2);
  });

  test("rolls back every repository call when the work returns Err", async () => {
    const result = await unitOfWork.run(async ({ systemChecks }) => {
      const first = await systemChecks.record({ status: "ok" });
      if (!first.ok) return first;
      await systemChecks.record({ status: "degraded" });
      // Inside the transaction the rows exist.
      const latest = await systemChecks.findLatest();
      expect(latest.ok && latest.value.some).toBe(true);
      return err({ type: "not-found" } as const);
    });

    expect(result).toEqual({ ok: false, error: { type: "not-found" } });
    expect(await db.systemCheck.count()).toBe(0);
  });

  test("rolls back and rethrows when the work throws", async () => {
    const failure = new Error("boom");
    await expect(
      unitOfWork.run(async ({ systemChecks }) => {
        await systemChecks.record({ status: "ok" });
        throw failure;
      }),
    ).rejects.toBe(failure);

    expect(await db.systemCheck.count()).toBe(0);
  });
});
