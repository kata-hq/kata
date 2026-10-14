import { describe, expect, test } from "bun:test";
import { parseCapture } from "./parse.ts";
import { context } from "./testing/context.ts";

describe("parseCapture", () => {
  test.each([
    ["compta stats", "compta stats"],
    ["  chap 3  ", "chap 3"],
    ["", ""],
  ])("%p is accepted with %p as title", (input, title) => {
    expect(parseCapture(input, context())).toEqual({
      ok: true,
      value: { input, title, course: null, taskType: null, deadline: null },
    });
  });

  test.each([
    ["2026-10-14", "invalid-reference"],
    ["not a date", "invalid-reference"],
    ["2026-10-14T09:00:00", "invalid-reference"],
  ])("reference %p is an error (%p)", (reference, code) => {
    const result = parseCapture("DM compta", context({ reference }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe(code as "invalid-reference");
  });

  test.each(["Mars/Olympus", "", "Paris"])("time zone %p is an error", (timeZone) => {
    const result = parseCapture("DM compta", context({ timeZone }));
    expect(result).toEqual({
      ok: false,
      error: {
        code: "invalid-time-zone",
        message: `time zone "${timeZone}" is not an IANA time zone (e.g. Europe/Paris)`,
      },
    });
  });

  test("an offset reference and another IANA zone are accepted", () => {
    const result = parseCapture(
      "x",
      context({ reference: "2026-10-14T11:00:00+02:00", timeZone: "America/Montreal" }),
    );
    expect(result.ok).toBe(true);
  });
});
