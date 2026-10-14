import { describe, expect, test } from "bun:test";
import { createLogger } from "../../../logger.ts";
import { authLog } from "./better-auth.ts";

function setup() {
  const lines: string[] = [];
  const log = authLog(createLogger({ level: "debug", write: (line) => lines.push(line) }));
  const logs = () => lines.map((line) => JSON.parse(line) as Record<string, unknown>);
  return { log, logs, lines };
}

class APIError extends Error {
  override name = "APIError";
}

describe("authLog", () => {
  test("logs errors and warnings with the error class only, never the message or arguments", () => {
    const { log, logs, lines } = setup();

    log("error", "Failed to sign in lea@example.com", new APIError("lea@example.com"), {
      email: "lea@example.com",
    });
    log("warn", "Rate limit for lea@example.com");

    expect(logs()).toEqual([
      expect.objectContaining({ level: "error", msg: "auth error", error: "APIError" }),
      expect.objectContaining({ level: "warn", msg: "auth warning" }),
    ]);
    expect(lines.join("\n")).not.toContain("lea@example.com");
  });

  test("drops debug and info lines", () => {
    const { log, lines } = setup();

    log("info", "session created");
    log("debug", "query");

    expect(lines).toEqual([]);
  });
});
