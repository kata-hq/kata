import { describe, expect, test } from "bun:test";
import {
  DEFAULT_PLANNER_SETTINGS,
  type ExistingBlock,
  type PlannerInput,
  type PlannerOutput,
  type PlannerSettings,
  plan,
} from "./index.ts";
import { at, block, input, ranges, rule, task } from "./test-support.ts";

// Now: Monday 2026-10-12 08:00 Paris; the 24 h window ends Tuesday 08:00, so blocks from Wednesday are movable.
const weekdays = (start: string, end: string) => ([1, 2, 3, 4, 5] as const).map((d) => rule(d, start, end));
const settings = (fields: Partial<PlannerSettings>) => ({ ...DEFAULT_PLANNER_SETTINGS, ...fields });
const friday = at("2026-10-16T23:59");

function run(fields: Partial<PlannerInput>): PlannerOutput {
  const result = plan(input({ freeTime: weekdays("18:00", "22:00"), ...fields }));
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}

const show = (output: PlannerOutput) =>
  output.blocks.map((b) => `${b.blockId ?? "new"} ${b.taskId} ${ranges([b])[0]}`);

/** The output passed back as the next input's blocks; new blocks get ids n0, n1, … */
function saved(output: PlannerOutput): ExistingBlock[] {
  return output.blocks.map((b, i) => ({
    id: b.blockId ?? `n${i}`,
    taskId: b.taskId,
    start: b.start,
    end: b.end,
    status: "planned",
    pinned: b.pinned,
  }));
}

describe("replanning the same situation changes nothing (S7)", () => {
  const tasks = [
    task("dm", { deadline: friday, remainingMin: 200 }),
    task("tp", { deadline: at("2026-10-14T23:59"), remainingMin: 300 }),
    task("rev", { deadline: friday, remainingMin: 60, notBefore: at("2026-10-15T00:00") }),
  ];
  const fields = { tasks, settings: settings({ maxMinPerDay: 240 }) };

  test.each([
    ["the same now", at("2026-10-12T08:00")],
    ["a later now the same day", at("2026-10-12T12:00")],
  ])("%s: same blocks, same ids, nothing removed", (_name, now) => {
    const first = run(fields);
    const blocks = saved(first);
    const again = run({ ...fields, now, blocks });

    expect(again.blocks.map((b) => [b.blockId, b.taskId, b.start, b.end])).toEqual(
      blocks.map((b) => [b.id, b.taskId, b.start, b.end]),
    );
    expect(again.removedBlockIds).toEqual([]);
  });
});

describe("a movable block stays while it is valid", () => {
  test("a valid block stays even when an earlier slot is free", () => {
    const output = run({
      tasks: [task("t1", { deadline: friday })],
      blocks: [block("b", "t1", "2026-10-15T18:00", "2026-10-15T19:00")],
    });

    expect(show(output)).toEqual(["b t1 2026-10-15T18:00–19:00"]);
    expect(output.removedBlockIds).toEqual([]);
  });

  const wednesday = block("b", "t1", "2026-10-14T18:00", "2026-10-14T19:00");
  const cases: [string, Partial<PlannerInput>, string[]][] = [
    [
      "it overlaps a new session",
      { sessions: [{ id: "s", start: at("2026-10-14T18:30"), end: at("2026-10-14T19:30") }] },
      ["new t1 2026-10-12T18:00–19:00"],
    ],
    [
      "it is outside free time",
      { blocks: [block("b", "t1", "2026-10-14T16:00", "2026-10-14T17:00")] },
      ["new t1 2026-10-12T18:00–19:00"],
    ],
    [
      "it ends after a changed deadline",
      { tasks: [task("t1", { deadline: at("2026-10-14T18:30") })] },
      ["new t1 2026-10-12T18:00–19:00"],
    ],
    [
      "it starts before a new notBefore",
      { tasks: [task("t1", { deadline: friday, notBefore: at("2026-10-15T00:00") })] },
      ["new t1 2026-10-15T18:00–19:00"],
    ],
    [
      "its task's work is already covered",
      {
        blocks: [wednesday, block("pin", "t1", "2026-10-13T18:00", "2026-10-13T19:00", { pinned: true })],
      },
      ["pin t1 2026-10-13T18:00–19:00"],
    ],
    [
      "its day would exceed the daily maximum",
      {
        settings: settings({ maxMinPerDay: 60 }),
        blocks: [wednesday, block("done", "x", "2026-10-14T20:00", "2026-10-14T20:30", { status: "done" })],
      },
      ["new t1 2026-10-12T18:00–19:00"],
    ],
    [
      "its task already has a block that day",
      {
        tasks: [task("t1", { deadline: friday, remainingMin: 120 })],
        blocks: [wednesday, block("c", "t1", "2026-10-14T19:00", "2026-10-14T20:00")],
      },
      ["new t1 2026-10-12T18:00–19:00", "b t1 2026-10-14T18:00–19:00"],
    ],
    [
      "its length is outside the block size settings",
      { settings: settings({ blockMaxMin: 45 }) },
      ["new t1 2026-10-12T18:00–18:30", "new t1 2026-10-13T18:00–18:30"],
    ],
  ];

  test.each(cases)("removed when %s", (_name, fields, expected) => {
    const output = run({ tasks: [task("t1", { deadline: friday })], blocks: [wednesday], ...fields });

    expect(show(output)).toEqual(expected);
    expect(output.removedBlockIds).toContain(expected.some((b) => b.startsWith("b ")) ? "c" : "b");
  });
});

describe("safeguards", () => {
  test("blocks kept for a later deadline give way when earlier work would not fit (S2)", () => {
    const output = run({
      freeTime: [rule(1, "18:00", "19:00"), rule(3, "18:00", "19:00"), rule(4, "18:00", "19:00")],
      tasks: [
        task("urgent", { deadline: at("2026-10-14T23:59"), remainingMin: 120 }),
        task("later", { deadline: friday }),
      ],
      blocks: [block("late", "later", "2026-10-14T18:00", "2026-10-14T19:00")],
    });

    expect(show(output)).toEqual([
      "new urgent 2026-10-12T18:00–19:00",
      "new urgent 2026-10-14T18:00–19:00",
      "new later 2026-10-15T18:00–19:00",
    ]);
    expect(output.removedBlockIds).toEqual(["late"]);
    expect(output.unplaced).toEqual([]);
  });

  test("keeping blocks wins when giving them up does not place more work", () => {
    const output = run({
      freeTime: [rule(3, "18:00", "19:00")],
      tasks: [
        task("urgent", { deadline: at("2026-10-14T23:59"), remainingMin: 300 }),
        task("later", { deadline: friday }),
      ],
      blocks: [block("late", "later", "2026-10-14T18:00", "2026-10-14T19:00")],
    });

    expect(show(output)).toEqual(["late later 2026-10-14T18:00–19:00"]);
    expect(output.unplaced).toEqual([{ taskId: "urgent", missingMin: 300 }]);
  });

  test("a new block identical to a removed one keeps its id", () => {
    // Two blocks of t1 on Wednesday break the per-day limit; with no other free day the extra block comes back.
    const output = run({
      freeTime: [rule(3, "18:00", "22:00")],
      settings: settings({ maxMinPerDay: 240 }),
      tasks: [task("t1", { deadline: at("2026-10-14T23:59"), remainingMin: 120 })],
      blocks: [
        block("b1", "t1", "2026-10-14T18:00", "2026-10-14T19:00"),
        block("b2", "t1", "2026-10-14T19:00", "2026-10-14T20:00"),
      ],
    });

    expect(show(output)).toEqual(["b1 t1 2026-10-14T18:00–19:00", "b2 t1 2026-10-14T19:00–20:00"]);
    expect(output.removedBlockIds).toEqual([]);
  });
});
