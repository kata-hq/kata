import { describe, expect, test } from "bun:test";
import { err, none, ok, type Result } from "@kata/shared";
import type { RepositoryError } from "../../../shared/persistence/repository-error.ts";
import type { RecordSystemCheck, SystemCheck, SystemCheckRepository } from "../domain/system-check.ts";
import { SystemCheckHealthService } from "./health-service.ts";

const checkedAt = new Date("2026-10-10T08:00:00.000Z");
const now = () => new Date("2026-10-10T09:00:00.000Z");

/** In-memory repository. `record` answers with `outcome`. */
class FakeSystemCheckRepository implements SystemCheckRepository {
  readonly recorded: RecordSystemCheck[] = [];

  constructor(private readonly outcome: "ok" | "err" | "throw") {}

  async record(input: RecordSystemCheck): Promise<Result<SystemCheck, RepositoryError>> {
    if (this.outcome === "throw") throw new Error("connection refused");
    this.recorded.push(input);
    if (this.outcome === "err") return err({ type: "unique-violation", constraint: undefined });
    return ok({ id: "01990000-0000-7000-8000-000000000001", status: input.status, checkedAt });
  }

  async findById(): Promise<Result<SystemCheck, RepositoryError>> {
    return err({ type: "not-found" });
  }

  async findLatest() {
    return ok(none());
  }
}

describe("SystemCheckHealthService", () => {
  test("records an ok check and reports db ok with the check time", async () => {
    const repository = new FakeSystemCheckRepository("ok");
    const result = await new SystemCheckHealthService(repository, now).check();

    expect(result).toEqual({ ok: true, value: { api: "ok", db: "ok", lastCheck: checkedAt } });
    expect(repository.recorded).toEqual([{ status: "ok" }]);
  });

  test("reports db down when the repository throws", async () => {
    const result = await new SystemCheckHealthService(new FakeSystemCheckRepository("throw"), now).check();

    expect(result).toEqual({ ok: false, error: { api: "ok", db: "down", lastCheck: now() } });
  });

  test("reports db down when the repository returns Err", async () => {
    const result = await new SystemCheckHealthService(new FakeSystemCheckRepository("err"), now).check();

    expect(result).toEqual({ ok: false, error: { api: "ok", db: "down", lastCheck: now() } });
  });
});
