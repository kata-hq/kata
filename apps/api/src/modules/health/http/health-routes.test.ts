import { describe, expect, test } from "bun:test";
import { err, ok } from "@kata/shared";
import type { HealthService } from "../application/health-service.ts";
import { createHealthRoutes } from "./health-routes.ts";

const lastCheck = new Date("2026-10-10T08:00:00.000Z");

const up: HealthService = { check: async () => ok({ api: "ok", db: "ok", lastCheck }) };
const down: HealthService = { check: async () => err({ api: "ok", db: "down", lastCheck }) };

describe("health routes", () => {
  test("GET / returns 200 when the database is up", async () => {
    const res = await createHealthRoutes(up).request("/");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ api: "ok", db: "ok", lastCheck: "2026-10-10T08:00:00.000Z" });
  });

  test("GET / returns 503 when the database is down", async () => {
    const res = await createHealthRoutes(down).request("/");

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ api: "ok", db: "down", lastCheck: "2026-10-10T08:00:00.000Z" });
  });
});
