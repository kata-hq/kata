import { describe, expect, test } from "bun:test";
import { err, none, ok, type Result } from "@kata/shared";
import { createLogger } from "../../../logger.ts";
import type { RepositoryError } from "../../../shared/persistence/repository-error.ts";
import type { RecordSystemCheck, SystemCheck, SystemCheckRepository } from "../domain/system-check.ts";
import { SystemCheckHealthService } from "./health-service.ts";

const checkedAt = new Date("2026-10-10T08:00:00.000Z");
const now = () => new Date("2026-10-10T09:00:00.000Z");

type Outcome = "ok" | "err" | { readonly throw: unknown };

/** In-memory repository. `record` answers with `outcome`. */
class FakeSystemCheckRepository implements SystemCheckRepository {
  readonly recorded: RecordSystemCheck[] = [];

  constructor(private readonly outcome: Outcome) {}

  async record(input: RecordSystemCheck): Promise<Result<SystemCheck, RepositoryError>> {
    if (typeof this.outcome === "object") throw this.outcome.throw;
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

function setup(outcome: Outcome) {
  const lines: string[] = [];
  const repository = new FakeSystemCheckRepository(outcome);
  const logger = createLogger({ write: (line) => lines.push(line) });
  const service = new SystemCheckHealthService(repository, logger, now);
  const logs = () => lines.map((line) => JSON.parse(line) as Record<string, unknown>);
  return { service, repository, logs };
}

const down = err({ api: "ok", db: "down", lastCheck: now() } as const);

describe("SystemCheckHealthService", () => {
  test("records an ok check and reports db ok with the check time", async () => {
    const { service, repository, logs } = setup("ok");

    expect(await service.check()).toEqual({ ok: true, value: { api: "ok", db: "ok", lastCheck: checkedAt } });
    expect(repository.recorded).toEqual([{ status: "ok" }]);
    expect(logs()).toEqual([]);
  });

  test("reports db down and logs the error name and code when the repository throws", async () => {
    const outage = Object.assign(new Error("connect ECONNREFUSED 127.0.0.1:5432 user=someone"), {
      code: "ECONNREFUSED",
    });
    const { service, logs } = setup({ throw: outage });

    expect(await service.check()).toEqual(down);
    expect(logs()).toEqual([
      {
        time: expect.any(String),
        level: "warn",
        msg: "health check failed",
        error: "Error",
        code: "ECONNREFUSED",
      },
    ]);
    expect(JSON.stringify(logs())).not.toContain("someone");
  });

  test("logs only the error name when the thrown error has no code", async () => {
    const { service, logs } = setup({ throw: new TypeError("bug with data") });

    expect(await service.check()).toEqual(down);
    expect(logs()).toMatchObject([{ level: "warn", error: "TypeError" }]);
    expect(logs()[0]).not.toHaveProperty("code");
  });

  test("reports db down and logs the error type when the repository returns Err", async () => {
    const { service, logs } = setup("err");

    expect(await service.check()).toEqual(down);
    expect(logs()).toMatchObject([{ level: "warn", msg: "health check failed", error: "unique-violation" }]);
  });
});
