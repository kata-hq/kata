import { describe, expect, test } from "bun:test";
import { DEFAULT_PLANNER_SETTINGS, PLANNER_VERSION, type PlannerInput, plan } from "./index.ts";
import { at, block, input, rule, task } from "./test-support.ts";

describe("plan contract", () => {
  test("valid input gives Ok with the planner version", () => {
    const result = plan(input({ freeTime: [rule(1, "09:00", "12:00")], tasks: [task("t1")] }));

    expect(result).toEqual({
      ok: true,
      value: { plannerVersion: PLANNER_VERSION, blocks: [], removedBlockIds: [], unplaced: [], risks: [] },
    });
  });

  test("the same input gives a deep-equal output (now is an input, not the clock)", () => {
    const full = input({
      freeTime: [rule(1, "09:00", "12:00")],
      sessions: [{ id: "s1", start: at("2026-10-12T10:00"), end: at("2026-10-12T11:00") }],
      tasks: [task("t1", { deadline: at("2026-10-16T23:59") })],
      blocks: [block("b1", "t1", "2026-10-12T09:00", "2026-10-12T10:00")],
    });

    expect(plan(full)).toEqual(plan(full));
  });

  test("the default settings are the spec's proposition values", () => {
    expect(DEFAULT_PLANNER_SETTINGS).toEqual({
      maxMinPerDay: 180,
      blockMinMin: 30,
      blockMaxMin: 90,
      maxBlocksPerTaskPerDay: 1,
      bufferDays: 1,
      stabilityWindowH: 24,
    });
  });
});

describe("invalid input gives Err naming the field", () => {
  const settings = (fields: Partial<PlannerInput["settings"]>) => ({
    ...DEFAULT_PLANNER_SETTINGS,
    ...fields,
  });
  const cases: [string, PlannerInput, string][] = [
    ["unknown time zone", input({ timeZone: "Mars/Olympus" }), "timeZone"],
    ["maxMinPerDay 0", input({ settings: settings({ maxMinPerDay: 0 }) }), "settings.maxMinPerDay"],
    [
      "blockMinMin not an integer",
      input({ settings: settings({ blockMinMin: 1.5 }) }),
      "settings.blockMinMin",
    ],
    ["blockMaxMin negative", input({ settings: settings({ blockMaxMin: -1 }) }), "settings.blockMaxMin"],
    ["blockMaxMin < blockMinMin", input({ settings: settings({ blockMaxMin: 20 }) }), "settings.blockMaxMin"],
    [
      "maxBlocksPerTaskPerDay 0",
      input({ settings: settings({ maxBlocksPerTaskPerDay: 0 }) }),
      "settings.maxBlocksPerTaskPerDay",
    ],
    ["bufferDays negative", input({ settings: settings({ bufferDays: -1 }) }), "settings.bufferDays"],
    [
      "stabilityWindowH negative",
      input({ settings: settings({ stabilityWindowH: -2 }) }),
      "settings.stabilityWindowH",
    ],
    [
      "free-time rule ending before it starts",
      input({ freeTime: [rule(2, "12:00", "09:00")] }),
      "freeTime[0]",
    ],
    ["free-time rule of zero length", input({ freeTime: [rule(2, "09:00", "09:00")] }), "freeTime[0]"],
    [
      "session ending before it starts",
      input({ sessions: [{ id: "s1", start: at("2026-10-12T11:00"), end: at("2026-10-12T10:00") }] }),
      "sessions[0]",
    ],
    [
      "block of zero length",
      input({ blocks: [block("b1", "t1", "2026-10-12T09:00", "2026-10-12T09:00")] }),
      "blocks[0]",
    ],
    [
      "negative remaining work",
      input({ tasks: [task("t1"), task("t2", { remainingMin: -5 })] }),
      "tasks[1].remainingMin",
    ],
  ];

  test.each(cases)("%s", (_name, bad, field) => {
    const result = plan(bad);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.field).toBe(field);
      expect(result.error.message.length).toBeGreaterThan(0);
    }
  });
});
