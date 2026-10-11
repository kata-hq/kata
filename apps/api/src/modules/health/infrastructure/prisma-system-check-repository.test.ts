import { describe, expect, mock, test } from "bun:test";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { type HealthDb, PrismaSystemCheckRepository } from "./prisma-system-check-repository.ts";

// Unit tests of the row ↔ domain mapping with a fake client. The queries themselves run against
// Postgres in prisma-system-check-repository.int.test.ts.

const checkedAt = new Date("2026-10-10T08:00:00.000Z");
const row = { id: "0192f000-0000-7000-8000-000000000001", status: "ok", checkedAt };

function fakeDb(systemCheck: Record<string, (args: unknown) => Promise<unknown>>) {
  return new PrismaSystemCheckRepository({ systemCheck } as unknown as HealthDb);
}

const notFound = () =>
  new PrismaClientKnownRequestError("No record found", { code: "P2025", clientVersion: "7.10.0" });

describe("PrismaSystemCheckRepository (mapping)", () => {
  test("record sends the status, omits an absent checkedAt, and returns the domain check", async () => {
    const create = mock(async (_args: unknown) => row);
    const result = await fakeDb({ create }).record({ status: "ok" });

    expect(create).toHaveBeenCalledWith({ data: { status: "ok" } });
    expect(result).toEqual({ ok: true, value: { id: row.id, status: "ok", checkedAt } });
  });

  test("record passes checkedAt when given", async () => {
    const create = mock(async (_args: unknown) => row);
    await fakeDb({ create }).record({ status: "degraded", checkedAt });

    expect(create).toHaveBeenCalledWith({ data: { status: "degraded", checkedAt } });
  });

  test("findById maps Prisma's not-found error to a not-found Err", async () => {
    const result = await fakeDb({
      findUniqueOrThrow: async () => {
        throw notFound();
      },
    }).findById("missing");

    expect(result).toEqual({ ok: false, error: { type: "not-found" } });
  });

  test("findLatest returns none when the table is empty and some(check) otherwise", async () => {
    const empty = await fakeDb({ findFirst: async () => null }).findLatest();
    const found = await fakeDb({ findFirst: async () => row }).findLatest();

    expect(empty).toEqual({ ok: true, value: { some: false } });
    expect(found).toEqual({
      ok: true,
      value: { some: true, value: { id: row.id, status: "ok", checkedAt } },
    });
  });

  test("an unknown status in the table is a bug and throws", async () => {
    const repository = fakeDb({ findUniqueOrThrow: async () => ({ ...row, status: "exploded" }) });

    await expect(repository.findById(row.id)).rejects.toThrow('Unknown system check status "exploded"');
  });
});
