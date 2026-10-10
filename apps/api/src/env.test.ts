import { describe, expect, test } from "bun:test";
import { loadEnv, parseEnv } from "./env.ts";
import { createLogger } from "./logger.ts";

const valid = { DATABASE_URL: "postgres://kata:kata@localhost:5432/kata" };

class Exit extends Error {
  constructor(readonly code: number) {
    super(`exit ${code}`);
  }
}

describe("parseEnv", () => {
  test("applies defaults", () => {
    expect(parseEnv(valid)).toEqual({
      ok: true,
      value: { DATABASE_URL: valid.DATABASE_URL, API_PORT: 3000, LOG_LEVEL: "info" },
    });
  });

  test("reads every variable", () => {
    const env = parseEnv({ ...valid, API_PORT: "3018", LOG_LEVEL: "debug" });
    expect(env).toEqual({
      ok: true,
      value: { DATABASE_URL: valid.DATABASE_URL, API_PORT: 3018, LOG_LEVEL: "debug" },
    });
  });

  test("names a missing variable", () => {
    expect(parseEnv({})).toEqual({ ok: false, error: [{ name: "DATABASE_URL", problem: "missing" }] });
  });

  test("names each invalid variable without its value", () => {
    const env = parseEnv({ DATABASE_URL: "mysql://secret@host/db", API_PORT: "http", LOG_LEVEL: "loud" });

    expect(env).toEqual({
      ok: false,
      error: [
        { name: "DATABASE_URL", problem: "must be a postgres:// URL" },
        { name: "API_PORT", problem: "must be a port number" },
        { name: "LOG_LEVEL", problem: "must be one of debug, info, warn, error" },
      ],
    });
  });

  test("rejects a port out of range", () => {
    expect(parseEnv({ ...valid, API_PORT: "70000" })).toEqual({
      ok: false,
      error: [{ name: "API_PORT", problem: "must be a port number" }],
    });
  });
});

describe("loadEnv", () => {
  test("returns the env when it is valid", () => {
    const exit = (code: number): never => {
      throw new Exit(code);
    };
    expect(loadEnv(valid, createLogger({ write: () => {} }), exit).API_PORT).toBe(3000);
  });

  test("logs one JSON error naming each variable and exits with code 1", () => {
    const lines: string[] = [];
    const exit = (code: number): never => {
      throw new Exit(code);
    };

    expect(() =>
      loadEnv({ API_PORT: "0" }, createLogger({ write: (line) => lines.push(line) }), exit),
    ).toThrow(new Exit(1));
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0] ?? "")).toMatchObject({
      level: "error",
      msg: "invalid environment",
      variables: [
        { name: "DATABASE_URL", problem: "missing" },
        { name: "API_PORT", problem: "must be a port number" },
      ],
    });
  });
});
