import { describe, expect, test } from "bun:test";
import { err, ok } from "@kata/shared";
import { hc } from "hono/client";
import { type AppType, buildApp } from "./app.ts";
import { createLogger } from "./logger.ts";
import { createHealthRoutes, type HealthService } from "./modules/health/index.ts";

const lastCheck = new Date("2026-10-10T08:00:00.000Z");

function setup(check: HealthService["check"]) {
  const lines: string[] = [];
  const logger = createLogger({ write: (line) => lines.push(line) });
  const app = buildApp(logger, { health: createHealthRoutes({ check }) });
  const logs = () => lines.map((line) => JSON.parse(line) as Record<string, unknown>);
  return { app, logs };
}

describe("GET /api/health", () => {
  test("returns 200 with db ok", async () => {
    const { app } = setup(async () => ok({ api: "ok", db: "ok", lastCheck }));
    const res = await app.request("/api/health");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ api: "ok", db: "ok", lastCheck: "2026-10-10T08:00:00.000Z" });
  });

  test("returns 503 with db down", async () => {
    const { app } = setup(async () => err({ api: "ok", db: "down", lastCheck }));
    const res = await app.request("/api/health");

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ api: "ok", db: "down", lastCheck: "2026-10-10T08:00:00.000Z" });
  });
});

describe("request log", () => {
  test("logs one JSON line per request and returns the request id", async () => {
    const { app, logs } = setup(async () => ok({ api: "ok", db: "ok", lastCheck }));
    const res = await app.request("/api/health?email=someone@example.com", {
      headers: { authorization: "Bearer secret", "user-agent": "test" },
    });

    const requestId = res.headers.get("x-request-id");
    expect(requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(logs()).toHaveLength(1);
    const [line] = logs();
    expect(line).toEqual({
      time: expect.any(String),
      level: "info",
      msg: "request",
      method: "GET",
      route: "/api/health",
      status: 200,
      durationMs: expect.any(Number),
      requestId,
    });
    // No query string, header or other request data in the log.
    expect(JSON.stringify(line)).not.toContain("example.com");
    expect(JSON.stringify(line)).not.toContain("secret");
  });

  test("gives each request its own id", async () => {
    const { app } = setup(async () => ok({ api: "ok", db: "ok", lastCheck }));
    const first = await app.request("/api/health");
    const second = await app.request("/api/health");

    expect(first.headers.get("x-request-id")).not.toBe(second.headers.get("x-request-id"));
  });
});

describe("errors", () => {
  test("an unknown route returns 404 in the shared error format", async () => {
    const { app, logs } = setup(async () => ok({ api: "ok", db: "ok", lastCheck }));
    const res = await app.request("/api/nothing-here");

    expect(res.status).toBe(404);
    expect(res.headers.get("x-request-id")).not.toBeNull();
    expect(await res.json()).toEqual({ error: { code: "not_found", message: "Route not found" } });
    expect(logs()).toMatchObject([{ msg: "request", route: "unmatched", status: 404 }]);
  });

  test("an unknown error returns 500 without the stack and logs it", async () => {
    const { app, logs } = setup(async () => {
      throw new TypeError("internal detail");
    });
    const res = await app.request("/api/health");

    expect(res.status).toBe(500);
    const requestId = res.headers.get("x-request-id");
    const text = await res.text();
    expect(JSON.parse(text)).toEqual({ error: { code: "internal_error", message: "Internal server error" } });
    expect(text).not.toContain("internal detail");
    expect(text).not.toContain("health-routes");

    const [errorLine, requestLine] = logs();
    expect(errorLine).toMatchObject({
      level: "error",
      msg: "unhandled error",
      error: "TypeError",
      requestId,
    });
    expect(String(errorLine?.["stack"])).toContain("internal detail");
    expect(requestLine).toMatchObject({ msg: "request", route: "/api/health", status: 500, requestId });
  });
});

describe("AppType", () => {
  test("a Hono RPC client sees the health route and its status codes", async () => {
    const { app } = setup(async () => err({ api: "ok", db: "down", lastCheck }));
    const client = hc<AppType>("http://localhost", {
      fetch: (input: Request | URL | string, init?: RequestInit) => app.request(input, init),
    });

    const res = await client.api.health.$get();
    if (res.status !== 503) throw new Error("expected 503");
    const body = await res.json();
    // Compile-time check: the 503 body has `db: "down"`.
    const db: "down" = body.db;
    expect(db).toBe("down");
  });
});
