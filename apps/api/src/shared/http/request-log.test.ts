import { describe, expect, test } from "bun:test";
import { Hono } from "hono";
import { createLogger } from "../../logger.ts";
import type { AppEnv } from "./app-env.ts";
import { requestLog } from "./request-log.ts";

function setup() {
  const lines: string[] = [];
  const app = new Hono<AppEnv>();
  app.use(requestLog(createLogger({ write: (line) => lines.push(line) })));
  app.route(
    "/api/users",
    new Hono().get("/me", (c) => c.text("me")).get("/:email", (c) => c.text("user")),
  );
  const logs = () => lines.map((line) => JSON.parse(line) as Record<string, unknown>);
  return { app, logs };
}

describe("requestLog", () => {
  test("logs the route pattern, not the path with its parameters", async () => {
    const { app, logs } = setup();
    await app.request("/api/users/someone@example.com");

    expect(logs()).toMatchObject([
      { msg: "request", method: "GET", route: "/api/users/:email", status: 200 },
    ]);
    expect(JSON.stringify(logs())).not.toContain("example.com");
  });

  test("logs the static route that matched", async () => {
    const { app, logs } = setup();
    await app.request("/api/users/me");

    expect(logs()).toMatchObject([{ route: "/api/users/me" }]);
  });

  test("logs unmatched when no route matched", async () => {
    const { app, logs } = setup();
    await app.request("/api/users/someone@example.com/notes");

    expect(logs()).toMatchObject([{ route: "unmatched", status: 404 }]);
    expect(JSON.stringify(logs())).not.toContain("example.com");
  });
});
