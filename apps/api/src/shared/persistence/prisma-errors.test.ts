import { describe, expect, test } from "bun:test";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { runQuery, toRepositoryError } from "./prisma-errors.ts";

function prismaError(code: string, meta?: Record<string, unknown>) {
  return new PrismaClientKnownRequestError(`Prisma error ${code}`, {
    code,
    clientVersion: "7.10.0",
    ...(meta === undefined ? {} : { meta }),
  });
}

function adapterMeta(constraint: Record<string, unknown>) {
  return { driverAdapterError: { name: "DriverAdapterError", cause: { constraint } } };
}

describe("toRepositoryError", () => {
  test("maps P2002 to unique-violation with the index name from the driver adapter", () => {
    const error = prismaError("P2002", adapterMeta({ index: "system_check_pkey" }));
    expect(toRepositoryError(error)).toEqual({ type: "unique-violation", constraint: "system_check_pkey" });
  });

  test("maps P2002 to unique-violation with the fields from the driver adapter", () => {
    const error = prismaError("P2002", adapterMeta({ fields: ["workspace_id", "name"] }));
    expect(toRepositoryError(error)).toEqual({ type: "unique-violation", constraint: "workspace_id,name" });
  });

  test("maps P2002 without an adapter to unique-violation with the target", () => {
    const error = prismaError("P2002", { target: ["email"] });
    expect(toRepositoryError(error)).toEqual({ type: "unique-violation", constraint: "email" });
  });

  test("maps P2025 to not-found", () => {
    expect(toRepositoryError(prismaError("P2025", { modelName: "SystemCheck" }))).toEqual({
      type: "not-found",
    });
  });

  test("maps P2003 to foreign-key-violation", () => {
    const error = prismaError("P2003", adapterMeta({ index: "task_course_id_fkey" }));
    expect(toRepositoryError(error)).toEqual({
      type: "foreign-key-violation",
      constraint: "task_course_id_fkey",
    });
  });

  test("maps P2003 without an adapter using field_name", () => {
    const error = prismaError("P2003", { field_name: "course_id" });
    expect(toRepositoryError(error)).toEqual({ type: "foreign-key-violation", constraint: "course_id" });
  });

  test("leaves the constraint undefined when Prisma gives no meta", () => {
    expect(toRepositoryError(prismaError("P2002"))).toEqual({
      type: "unique-violation",
      constraint: undefined,
    });
  });

  test("returns undefined for other Prisma codes", () => {
    expect(toRepositoryError(prismaError("P2010"))).toBeUndefined();
  });

  test("returns undefined for errors that are not Prisma errors", () => {
    expect(toRepositoryError(new Error("connection refused"))).toBeUndefined();
    expect(toRepositoryError({ code: "P2002" })).toBeUndefined();
  });
});

describe("runQuery", () => {
  test("wraps the value in Ok", async () => {
    expect(await runQuery(async () => 42)).toEqual({ ok: true, value: 42 });
  });

  test("returns a mapped Prisma error as Err", async () => {
    const result = await runQuery(async () => {
      throw prismaError("P2025");
    });
    expect(result).toEqual({ ok: false, error: { type: "not-found" } });
  });

  test("throws errors it cannot map", async () => {
    const outage = new Error("connection refused");
    await expect(
      runQuery(async () => {
        throw outage;
      }),
    ).rejects.toBe(outage);
  });
});
