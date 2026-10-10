import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { resetTestDatabase } from "../../../shared/persistence/database-admin.ts";
import { runQuery } from "../../../shared/persistence/prisma-errors.ts";
import { testDatabaseUrl } from "../../../shared/persistence/test-database.ts";
import { createHealthPrismaClient } from "./health-prisma-client.ts";
import { PrismaSystemCheckRepository } from "./prisma-system-check-repository.ts";

const url = testDatabaseUrl();
const db = createHealthPrismaClient(url);
const repository = new PrismaSystemCheckRepository(db);

beforeEach(() => resetTestDatabase(url, ["health"]));
afterAll(() => db.$disconnect());

describe("PrismaSystemCheckRepository", () => {
  test("record stores a check with a database-generated UUIDv7 and timestamp", async () => {
    const before = Date.now();
    const result = await repository.record({ status: "ok" });

    if (!result.ok) throw new Error("expected Ok");
    expect(result.value.status).toBe("ok");
    expect(result.value.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(result.value.checkedAt.getTime()).toBeGreaterThanOrEqual(before - 5_000);
  });

  test("findById returns the stored check", async () => {
    const recorded = await repository.record({
      status: "degraded",
      checkedAt: new Date("2026-10-01T08:00:00Z"),
    });
    if (!recorded.ok) throw new Error("expected Ok");

    expect(await repository.findById(recorded.value.id)).toEqual({
      ok: true,
      value: { id: recorded.value.id, status: "degraded", checkedAt: new Date("2026-10-01T08:00:00Z") },
    });
  });

  test("findById returns not-found for an unknown id", async () => {
    expect(await repository.findById("01990000-0000-7000-8000-000000000000")).toEqual({
      ok: false,
      error: { type: "not-found" },
    });
  });

  test("findLatest returns none on an empty table", async () => {
    expect(await repository.findLatest()).toEqual({ ok: true, value: { some: false } });
  });

  test("findLatest returns the most recent check", async () => {
    await repository.record({ status: "ok", checkedAt: new Date("2026-10-01T08:00:00Z") });
    await repository.record({ status: "down", checkedAt: new Date("2026-10-02T08:00:00Z") });
    await repository.record({ status: "ok", checkedAt: new Date("2026-09-30T08:00:00Z") });

    const latest = await repository.findLatest();
    if (!latest.ok || !latest.value.some) throw new Error("expected Ok(Some)");
    expect(latest.value.value.status).toBe("down");
  });

  test("a duplicate id maps to unique-violation", async () => {
    const recorded = await repository.record({ status: "ok" });
    if (!recorded.ok) throw new Error("expected Ok");
    const duplicate = await runQuery(() =>
      db.systemCheck.create({ data: { id: recorded.value.id, status: "ok" } }),
    );

    expect(duplicate).toEqual({
      ok: false,
      error: { type: "unique-violation", constraint: "system_check_pkey" },
    });
  });
});
