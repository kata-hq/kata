import { Hono } from "hono";
import type { HealthService } from "../application/health-service.ts";
import type { DbStatus, HealthStatus } from "../domain/health-status.ts";

/** Mounted at `/api/health`. `GET /` → 200 when the database is up, 503 when it is down. */
export function createHealthRoutes(health: HealthService) {
  return new Hono().get("/", async (c) => {
    const status = await health.check();
    return status.ok ? c.json(toBody(status.value), 200) : c.json(toBody(status.error), 503);
  });
}

export type HealthRoutes = ReturnType<typeof createHealthRoutes>;

function toBody<Db extends DbStatus>(status: HealthStatus<Db>) {
  return { api: status.api, db: status.db, lastCheck: status.lastCheck.toISOString() };
}
