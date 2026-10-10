import { describe, expect, test } from "bun:test";
import { createLogger } from "./logger.ts";

function capture(level?: "debug" | "info" | "warn" | "error") {
  const lines: string[] = [];
  const logger = createLogger({
    ...(level === undefined ? {} : { level }),
    write: (line) => lines.push(line),
    now: () => new Date("2026-10-10T08:00:00.000Z"),
  });
  return { logger, lines };
}

describe("createLogger", () => {
  test("writes one JSON line with time, level, msg and fields", () => {
    const { logger, lines } = capture();
    logger.info("api started", { port: 3000 });

    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe(
      '{"time":"2026-10-10T08:00:00.000Z","level":"info","msg":"api started","port":3000}',
    );
  });

  test("drops lines below the minimum level", () => {
    const { logger, lines } = capture("warn");
    logger.debug("a");
    logger.info("b");
    logger.warn("c");
    logger.error("d");

    expect(lines.map((line) => JSON.parse(line).level)).toEqual(["warn", "error"]);
  });

  test("defaults to info", () => {
    const { logger, lines } = capture();
    logger.debug("hidden");
    logger.info("shown");

    expect(lines.map((line) => JSON.parse(line).msg)).toEqual(["shown"]);
  });

  test("a field cannot overwrite time, level or msg", () => {
    const { logger, lines } = capture();
    logger.error("real", { msg: "fake", level: "debug", time: "never", extra: true });

    expect(JSON.parse(lines[0] ?? "")).toEqual({
      time: "2026-10-10T08:00:00.000Z",
      level: "error",
      msg: "real",
      extra: true,
    });
  });
});
