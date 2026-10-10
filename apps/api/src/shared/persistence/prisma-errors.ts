import { err, ok, type Result } from "@kata/shared";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import type { RepositoryError } from "./repository-error.ts";

/** The one place that turns Prisma error codes into `RepositoryError`s. */
export function toRepositoryError(error: unknown): RepositoryError | undefined {
  if (!(error instanceof PrismaClientKnownRequestError)) return undefined;
  switch (error.code) {
    case "P2002":
      return { type: "unique-violation", constraint: constraintName(error.meta) };
    case "P2025":
      return { type: "not-found" };
    case "P2003":
      return { type: "foreign-key-violation", constraint: constraintName(error.meta) };
    default:
      return undefined;
  }
}

/** Runs a Prisma query. Mapped errors become `Err`; every other error is thrown again. */
export async function runQuery<T>(query: () => Promise<T>): Promise<Result<T, RepositoryError>> {
  try {
    return ok(await query());
  } catch (error) {
    const repositoryError = toRepositoryError(error);
    if (repositoryError === undefined) throw error;
    return err(repositoryError);
  }
}

type Meta = Record<string, unknown> | undefined;

// With a driver adapter, Prisma puts the constraint under `driverAdapterError.cause.constraint`
// as `{ index }` or `{ fields }`. Without one, it uses `target` (P2002) or `field_name` (P2003).
function constraintName(meta: Meta): string | undefined {
  const fromAdapter = record(record(record(meta?.["driverAdapterError"])?.["cause"])?.["constraint"]);
  return (
    nameOf(fromAdapter?.["index"]) ??
    nameOf(fromAdapter?.["fields"]) ??
    nameOf(meta?.["target"]) ??
    nameOf(meta?.["field_name"])
  );
}

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : undefined;
}

function nameOf(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) return value.join(",");
  return undefined;
}
