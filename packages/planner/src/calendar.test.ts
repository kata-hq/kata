import { describe, expect, test } from "bun:test";
import { buildCalendar } from "./calendar.ts";
import type { PlannerInput } from "./contract.ts";
import { at, block, input, local, ranges, rule, task } from "./test-support.ts";

// Monday 2026-10-12 08:00 Paris; a task due Wednesday 23:59 sets the horizon.
const due = task("t1", { deadline: at("2026-10-14T23:59") });
const evenings = [rule(1, "18:00", "21:00"), rule(2, "18:00", "21:00"), rule(3, "18:00", "21:00")];
const ids = (blocks: readonly { id: string }[]) => blocks.map((b) => b.id);

function calendar(fields: Partial<PlannerInput>) {
  return buildCalendar(input({ tasks: [due], freeTime: evenings, ...fields }));
}

describe("free slots", () => {
  test("free-time rules expand on each local date up to the latest deadline", () => {
    expect(ranges(calendar({}).freeSlots)).toEqual([
      "2026-10-12T18:00–21:00",
      "2026-10-13T18:00–21:00",
      "2026-10-14T18:00–21:00",
    ]);
  });

  test("no task with a deadline: no horizon, no slot", () => {
    const result = calendar({ tasks: [task("t1")] });

    expect(result.freeSlots).toEqual([]);
    expect(result.horizon).toEqual(result.start);
  });

  test("the horizon cuts the last day's free time at the deadline", () => {
    const result = calendar({ tasks: [task("t1", { deadline: at("2026-10-13T19:30") })] });

    expect(ranges(result.freeSlots)).toEqual(["2026-10-12T18:00–21:00", "2026-10-13T18:00–19:30"]);
  });

  test("overlapping and touching rules of the same day merge", () => {
    const freeTime = [rule(1, "09:00", "11:00"), rule(1, "10:00", "12:00"), rule(1, "12:00", "13:00")];

    expect(ranges(calendar({ freeTime }).freeSlots)).toEqual(["2026-10-12T09:00–13:00"]);
  });

  test("sessions are cut out of free time (S1), inside a slot and across its edges", () => {
    const sessions = [
      { id: "s1", start: at("2026-10-12T19:00"), end: at("2026-10-12T19:30") },
      { id: "s2", start: at("2026-10-13T17:00"), end: at("2026-10-13T18:30") },
      { id: "s3", start: at("2026-10-14T20:00"), end: at("2026-10-14T22:00") },
    ];

    expect(ranges(calendar({ sessions }).freeSlots)).toEqual([
      "2026-10-12T18:00–19:00",
      "2026-10-12T19:30–21:00",
      "2026-10-13T18:30–21:00",
      "2026-10-14T18:00–20:00",
    ]);
  });

  test("nothing before now, rounded up to the next 5 minutes", () => {
    const result = calendar({ now: at("2026-10-12T18:41:27"), releaseStabilityWindow: true });

    expect(local(result.start)).toBe("2026-10-12T18:45");
    expect(ranges(result.freeSlots)[0]).toBe("2026-10-12T18:45–21:00");
  });

  test("a now already on a 5-minute step is kept", () => {
    expect(local(calendar({ now: at("2026-10-12T18:40") }).start)).toBe("2026-10-12T18:40");
  });

  test("DST start (2026-03-29, Europe/Paris): the rule keeps its local hours", () => {
    const result = buildCalendar(
      input({
        now: at("2026-03-28T08:00"),
        tasks: [task("t1", { deadline: at("2026-03-29T23:59") })],
        freeTime: [rule(7, "01:00", "05:00")],
      }),
    );

    expect(ranges(result.freeSlots)).toEqual(["2026-03-29T01:00–05:00"]);
    // 02:00–03:00 does not exist that night: 3 hours of real time.
    expect(result.freeSlots.map((s) => (s.end.epochMilliseconds - s.start.epochMilliseconds) / 3_600_000)).toEqual([
      3,
    ]);
  });

  test("DST end (2026-10-25, Europe/Paris): the rule keeps its local hours", () => {
    const result = buildCalendar(
      input({
        now: at("2026-10-24T08:00"),
        tasks: [task("t1", { deadline: at("2026-10-25T23:59") })],
        freeTime: [rule(7, "01:00", "05:00")],
      }),
    );

    expect(ranges(result.freeSlots)).toEqual(["2026-10-25T01:00–05:00"]);
    // 02:00–03:00 happens twice that night: 5 hours of real time.
    expect(result.freeSlots.map((s) => (s.end.epochMilliseconds - s.start.epochMilliseconds) / 3_600_000)).toEqual([
      5,
    ]);
  });
});

describe("fixed, movable and dropped blocks", () => {
  const now = at("2026-10-12T17:00"); // window (24 h) ends Tuesday 17:00
  const pinned = block("pinned", "t1", "2026-10-14T18:00", "2026-10-14T19:00", { pinned: true });
  const inWindow = block("window", "t1", "2026-10-12T18:00", "2026-10-12T19:00");
  const later = block("later", "t1", "2026-10-13T18:00", "2026-10-13T19:00");
  const inProgress = block("progress", "t1", "2026-10-12T16:30", "2026-10-12T17:30");
  const past = block("past", "t1", "2026-10-12T09:00", "2026-10-12T10:00");
  const blocks = [pinned, inWindow, later, inProgress, past];

  test("pinned (S5), in the window (S6) and in progress are fixed; later ones movable; past ones ignored", () => {
    const result = calendar({ now, blocks });

    expect(ids(result.fixed)).toEqual(["pinned", "window", "progress"]);
    expect(ids(result.movable)).toEqual(["later"]);
    expect(result.droppedBlockIds).toEqual([]);
  });

  test("releasing the window makes its blocks movable, but not pinned or in-progress blocks", () => {
    const result = calendar({ now, blocks, releaseStabilityWindow: true });

    expect(ids(result.fixed)).toEqual(["pinned", "progress"]);
    expect(ids(result.movable)).toEqual(["window", "later"]);
  });

  test("the window length comes from the settings", () => {
    const settings = { ...input().settings, stabilityWindowH: 0 };

    expect(ids(calendar({ now, blocks, settings }).fixed)).toEqual(["pinned", "progress"]);
  });

  test("fixed and done blocks are cut out of free time; movable ones are not", () => {
    const done = block("done", "t1", "2026-10-13T20:00", "2026-10-13T20:30", { status: "done" });
    const skipped = block("skipped", "t1", "2026-10-13T19:00", "2026-10-13T19:30", { status: "skipped" });

    expect(ranges(calendar({ now, blocks: [...blocks, done, skipped] }).freeSlots)).toEqual([
      "2026-10-12T19:00–21:00",
      "2026-10-13T18:00–20:00",
      "2026-10-13T20:30–21:00",
      "2026-10-14T19:00–21:00",
    ]);
  });

  test("blocks of an unknown task or a task without a deadline are dropped, even pinned", () => {
    const tasks = [due, task("someday")];
    const result = calendar({
      now,
      tasks,
      blocks: [
        block("unknown", "gone", "2026-10-13T18:00", "2026-10-13T19:00", { pinned: true }),
        block("nodeadline", "someday", "2026-10-12T18:00", "2026-10-12T19:00"),
        block("missed", "gone", "2026-10-12T09:00", "2026-10-12T10:00", { status: "missed" }),
      ],
    });

    expect(result.droppedBlockIds).toEqual(["unknown", "nodeadline"]);
    expect(result.fixed).toEqual([]);
  });

  test("daily use sums fixed and done blocks per local date", () => {
    const done = block("done", "t1", "2026-10-12T08:00", "2026-10-12T08:45", { status: "done" });

    expect(Object.fromEntries(calendar({ now, blocks: [...blocks, done] }).dayUseMin)).toEqual({
      "2026-10-12": 60 + 60 + 45,
      "2026-10-14": 60,
    });
  });
});
