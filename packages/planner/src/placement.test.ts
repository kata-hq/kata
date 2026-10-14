import { describe, expect, test } from "bun:test";
import { DEFAULT_PLANNER_SETTINGS, type PlannerInput, type PlannerSettings, plan } from "./index.ts";
import { targetLength } from "./placement.ts";
import { at, block, input, ranges, rule, task } from "./test-support.ts";

// Now: Monday 2026-10-12 08:00 Paris. Deadlines are local Paris times.
const weekdays = (start: string, end: string) => ([1, 2, 3, 4, 5] as const).map((d) => rule(d, start, end));
const settings = (fields: Partial<PlannerSettings>) => ({ ...DEFAULT_PLANNER_SETTINGS, ...fields });

/** Each block as "task range code remainingMin". */
function run(fields: Partial<PlannerInput>) {
  const result = plan(input(fields));
  if (!result.ok) throw new Error(result.error.message);
  const { blocks, unplaced, removedBlockIds } = result.value;
  return {
    blocks: blocks.map(
      (b) => `${b.taskId} ${ranges([b])[0]} ${b.reason.code} ${b.reason.params.remainingMin}`,
    ),
    unplaced,
    removedBlockIds,
    raw: blocks,
  };
}

describe("order (S2) and window (S1, S15)", () => {
  test("the earliest deadline gets the earliest free time", () => {
    const { blocks } = run({
      freeTime: weekdays("18:00", "19:00"),
      tasks: [
        task("later", { deadline: at("2026-10-16T23:59") }),
        task("sooner", { deadline: at("2026-10-14T23:59") }),
      ],
    });

    expect(blocks).toEqual([
      "sooner 2026-10-12T18:00–19:00 deadline 60",
      "later 2026-10-13T18:00–19:00 deadline 60",
    ]);
  });

  test("same deadline: higher priority first, then task id", () => {
    const deadline = at("2026-10-16T23:59");
    const { blocks } = run({
      freeTime: weekdays("18:00", "19:00"),
      tasks: [
        task("b", { deadline }),
        task("low", { deadline, priority: 1 }),
        task("high", { deadline, priority: 2 }),
        task("a", { deadline }),
      ],
    });

    expect(blocks.map((b) => b.split(" ")[0])).toEqual(["high", "low", "a", "b"]);
  });

  test("a task without a deadline is not planned (K-R6)", () => {
    expect(run({ freeTime: weekdays("18:00", "19:00"), tasks: [task("someday")] }).blocks).toEqual([]);
  });

  test("no block before notBefore (S15)", () => {
    const { blocks } = run({
      freeTime: weekdays("18:00", "19:00"),
      tasks: [task("rev", { deadline: at("2026-10-16T23:59"), notBefore: at("2026-10-14T00:00") })],
    });

    expect(blocks).toEqual(["rev 2026-10-14T18:00–19:00 deadline 60"]);
  });

  test("blocks avoid sessions and end before the deadline (S1)", () => {
    const { blocks, unplaced } = run({
      freeTime: weekdays("18:00", "21:00"),
      sessions: [{ id: "s1", start: at("2026-10-12T18:00"), end: at("2026-10-12T19:00") }],
      tasks: [task("t1", { deadline: at("2026-10-12T20:00"), remainingMin: 90 })],
    });

    expect(blocks).toEqual(["t1 2026-10-12T19:00–20:00 deadline_tight 90"]);
    expect(unplaced).toEqual([{ taskId: "t1", missingMin: 30 }]);
  });

  test("free time shorter than the minimum block is skipped", () => {
    const { blocks } = run({
      freeTime: [rule(1, "18:00", "18:20"), rule(2, "18:00", "19:00")],
      tasks: [task("t1", { deadline: at("2026-10-16T23:59") })],
    });

    expect(blocks).toEqual(["t1 2026-10-13T18:00–19:00 deadline 60"]);
  });
});

describe("block size (S3) and daily maximum (S4)", () => {
  test("long work is split, one block per day, no block under the minimum", () => {
    const { blocks } = run({
      freeTime: weekdays("18:00", "22:00"),
      tasks: [task("dm", { deadline: at("2026-10-16T23:59"), remainingMin: 200 })],
    });

    expect(blocks).toEqual([
      "dm 2026-10-12T18:00–19:30 deadline 200",
      "dm 2026-10-13T18:00–19:20 deadline 110",
      "dm 2026-10-14T18:00–18:30 deadline 30",
    ]);
  });

  test("work shorter than the minimum gets one minimum block", () => {
    expect(
      run({
        freeTime: weekdays("18:00", "22:00"),
        tasks: [task("t1", { deadline: at("2026-10-16T23:59"), remainingMin: 20 })],
      }).blocks,
    ).toEqual(["t1 2026-10-12T18:00–18:30 deadline 20"]);
  });

  test("blockMaxMin from the settings sets the split", () => {
    const { blocks } = run({
      settings: settings({ blockMaxMin: 60 }),
      freeTime: weekdays("18:00", "22:00"),
      tasks: [task("t1", { deadline: at("2026-10-16T23:59"), remainingMin: 120 })],
    });

    expect(blocks).toEqual([
      "t1 2026-10-12T18:00–19:00 deadline 120",
      "t1 2026-10-13T18:00–19:00 deadline 60",
    ]);
  });

  test("targetLength never leaves a remainder under the minimum", () => {
    const s = settings({ blockMinMin: 30, blockMaxMin: 45 });

    expect([10, 30, 40, 45, 50, 70, 100].map((need) => targetLength(need, s))).toEqual([
      30, 30, 40, 45, 30, 40, 45,
    ]);
  });

  test("a day never holds more than maxMinPerDay of blocks, fixed blocks included", () => {
    const { raw } = run({
      settings: settings({ maxMinPerDay: 90 }),
      freeTime: weekdays("17:00", "22:00"),
      tasks: [
        task("a", { deadline: at("2026-10-16T23:59"), remainingMin: 90 }),
        task("b", { deadline: at("2026-10-16T23:59"), remainingMin: 90 }),
        task("c", { deadline: at("2026-10-16T23:59"), remainingMin: 30 }),
      ],
      blocks: [block("pin", "c", "2026-10-12T17:00", "2026-10-12T18:00", { pinned: true })],
    });
    const perDay = new Map<string, number>();
    for (const b of raw) {
      const day = ranges([b])[0]?.slice(0, 10) ?? "";
      perDay.set(
        day,
        (perDay.get(day) ?? 0) + (b.end.epochMilliseconds - b.start.epochMilliseconds) / 60_000,
      );
    }

    expect(Object.fromEntries(perDay)).toEqual({ "2026-10-12": 90, "2026-10-13": 90, "2026-10-14": 60 });
  });

  test("a lower daily maximum spreads the same work over more days", () => {
    const tasks = [task("t1", { deadline: at("2026-10-16T23:59"), remainingMin: 180 })];
    const freeTime = weekdays("18:00", "22:00");

    expect(run({ freeTime, tasks, settings: settings({ maxMinPerDay: 60 }) }).blocks).toEqual([
      "t1 2026-10-12T18:00–19:00 deadline 180",
      "t1 2026-10-13T18:00–19:00 deadline 120",
      "t1 2026-10-14T18:00–19:00 deadline 60",
    ]);
  });
});

describe("per task per day (S13) and buffer (S14)", () => {
  test("extra blocks of the same day only when the work does not fit, on the last days", () => {
    const { blocks, unplaced } = run({
      settings: settings({ maxMinPerDay: 240 }),
      freeTime: weekdays("18:00", "22:00"),
      tasks: [task("t1", { deadline: at("2026-10-14T23:59"), remainingMin: 300 })],
    });

    expect(blocks).toEqual([
      "t1 2026-10-12T18:00–19:30 deadline 300",
      "t1 2026-10-13T18:00–19:30 deadline 210",
      "t1 2026-10-14T18:00–19:30 deadline_tight 120",
      "t1 2026-10-14T19:30–20:00 deadline_tight 30",
    ]);
    expect(unplaced).toEqual([]);
  });

  test("maxBlocksPerTaskPerDay from the settings allows several blocks a day", () => {
    const { blocks } = run({
      settings: settings({ maxBlocksPerTaskPerDay: 2 }),
      freeTime: weekdays("18:00", "22:00"),
      tasks: [task("t1", { deadline: at("2026-10-16T23:59"), remainingMin: 180 })],
    });

    expect(blocks).toEqual([
      "t1 2026-10-12T18:00–19:30 deadline 180",
      "t1 2026-10-12T19:30–21:00 deadline 90",
    ]);
  });

  test("work goes into the buffer day only when it does not fit before (deadline_tight)", () => {
    const tasks = [task("t1", { deadline: at("2026-10-14T23:59"), remainingMin: 180 })];
    const freeTime = weekdays("18:00", "19:00");

    expect(run({ freeTime, tasks }).blocks).toEqual([
      "t1 2026-10-12T18:00–19:00 deadline 180",
      "t1 2026-10-13T18:00–19:00 deadline 120",
      "t1 2026-10-14T18:00–19:00 deadline_tight 60",
    ]);
    expect(run({ freeTime, tasks, settings: settings({ bufferDays: 0 }) }).blocks.at(-1)).toBe(
      "t1 2026-10-14T18:00–19:00 deadline 60",
    );
  });

  test("work that does not fit before the deadline is reported as unplaced", () => {
    const { blocks, unplaced } = run({
      freeTime: [rule(1, "18:00", "20:00")],
      tasks: [task("t1", { deadline: at("2026-10-12T23:59"), remainingMin: 300 })],
    });

    expect(blocks).toEqual([
      "t1 2026-10-12T18:00–19:30 deadline_tight 300",
      "t1 2026-10-12T19:30–20:00 deadline_tight 210",
    ]);
    expect(unplaced).toEqual([{ taskId: "t1", missingMin: 180 }]);
  });
});

describe("plan output", () => {
  test("fixed blocks keep their id and count for the task's work; invalid and dropped blocks are removed", () => {
    const { raw, blocks, removedBlockIds } = run({
      freeTime: weekdays("18:00", "22:00"),
      tasks: [task("t1", { deadline: at("2026-10-16T23:59"), remainingMin: 150 })],
      blocks: [
        block("pin", "t1", "2026-10-13T20:00", "2026-10-13T21:00", { pinned: true }),
        block("old", "t1", "2026-10-15T16:00", "2026-10-15T17:00"), // outside free time: invalid
        block("orphan", "gone", "2026-10-15T20:00", "2026-10-15T21:00"),
      ],
    });

    expect(blocks).toEqual([
      "t1 2026-10-12T18:00–19:30 deadline 150",
      "t1 2026-10-13T20:00–21:00 deadline 60",
    ]);
    expect(raw.map((b) => [b.blockId, b.pinned])).toEqual([
      [null, false],
      ["pin", true],
    ]);
    expect(raw[0]?.reason.params.deadline).toBe(at("2026-10-16T23:59").toString());
    expect(removedBlockIds).toEqual(["orphan", "old"]);
  });
});
