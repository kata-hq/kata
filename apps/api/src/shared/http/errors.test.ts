import { describe, expect, test } from "bun:test";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { createLogger } from "../../logger.ts";
import type { AppEnv } from "./app-env.ts";
import { errorHandler } from "./errors.ts";

function appThrowing(error: Error) {
  const app = new Hono<AppEnv>();
  app.onError(errorHandler(createLogger({ write: () => {} })));
  app.get("/", () => {
    throw error;
  });
  return app;
}

describe("errorHandler", () => {
  test("an HTTPException keeps its status and gets a code in the shared format", async () => {
    const res = await appThrowing(new HTTPException(409, { message: "Already exists" })).request("/");

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: { code: "conflict", message: "Already exists" } });
  });

  test("an HTTPException with an unlisted status and no message gets generic values", async () => {
    const res = await appThrowing(new HTTPException(418)).request("/");

    expect(res.status).toBe(418);
    expect(await res.json()).toEqual({ error: { code: "http_error", message: "Request failed" } });
  });
});
