import { err, ok, type Result } from "@kata/shared";
import type { HealthStatus } from "../domain/health-status.ts";
import type { SystemCheckRepository } from "../domain/system-check.ts";

/** Public service of the health module. Other modules and the routes depend on this interface. */
export interface HealthService {
  /** `Ok` when the database answers, `Err` with `db: "down"` when it does not. Never throws. */
  check(): Promise<Result<HealthStatus<"ok">, HealthStatus<"down">>>;
}

/** Checks the database by recording a `system_check` row. */
export class SystemCheckHealthService implements HealthService {
  constructor(
    private readonly systemChecks: SystemCheckRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async check(): Promise<Result<HealthStatus<"ok">, HealthStatus<"down">>> {
    try {
      const recorded = await this.systemChecks.record({ status: "ok" });
      if (recorded.ok) return ok({ api: "ok", db: "ok", lastCheck: recorded.value.checkedAt });
    } catch {
      // An outage (connection refused, timeout) is thrown by the repository; for this check it means "down".
    }
    return err({ api: "ok", db: "down", lastCheck: this.now() });
  }
}
