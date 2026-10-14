import { describe, expect, test } from "bun:test";
import { DEFAULT_PLANNER_SETTINGS, type PlannerInput, plan } from "./index.ts";
import { at, block, input, local, rule, task } from "./test-support.ts";

// Now: Monday 2026-10-12 08:00 Paris.
const weekdays = (start: string, end: string) => ([1, 2, 3, 4, 5] as const).map((d) => rule(d, start, end));
const monday = at("2026-10-12T23:59");
const tuesday = at("2026-10-13T23:59");

function risks(fields: Partial<PlannerInput>) {
  const result = plan(input(fields));
  if (!result.ok) throw new Error(result.error.message);
  return result.value.risks.map((r) => ({ ...r, deadline: local(r.deadline) }));
}

describe("risk report (S9)", () => {
  test("no risk when the free time before each deadline covers the work", () => {
    expect(
      risks({
        freeTime: weekdays("18:00", "22:00"),
        tasks: [task("t1", { deadline: at("2026-10-16T23:59"), remainingMin: 300 })],
      }),
    ).toEqual([]);
  });

  test("an overloaded deadline and a later deadline that inherits the overload are reported", () => {
    expect(
      risks({
        freeTime: weekdays("18:00", "19:00"),
        tasks: [
          task("a", { deadline: monday, remainingMin: 120 }),
          task("a2", { deadline: monday, remainingMin: 30 }),
          task("b", { deadline: tuesday, remainingMin: 60 }),
          task("c", { deadline: at("2026-10-16T23:59"), remainingMin: 60 }),
        ],
      }),
    ).toEqual([
      { deadline: "2026-10-12T23:59", taskIds: ["a", "a2"], dueMin: 150, freeMin: 60, missingMin: 90 },
      { deadline: "2026-10-13T23:59", taskIds: ["b"], dueMin: 210, freeMin: 120, missingMin: 90 },
    ]);
  });

  test("the daily maximum caps the free time of a day", () => {
    expect(
      risks({
        settings: { ...DEFAULT_PLANNER_SETTINGS, maxMinPerDay: 60 },
        freeTime: weekdays("18:00", "22:00"),
        tasks: [task("t1", { deadline: monday, remainingMin: 120 })],
      }),
    ).toEqual([{ deadline: "2026-10-12T23:59", taskIds: ["t1"], dueMin: 120, freeMin: 60, missingMin: 60 }]);
  });

  test("sessions and fixed blocks of other tasks reduce the free time", () => {
    expect(
      risks({
        freeTime: weekdays("18:00", "22:00"),
        sessions: [{ id: "s1", start: at("2026-10-12T18:00"), end: at("2026-10-12T20:00") }],
        tasks: [
          task("t1", { deadline: monday, remainingMin: 120 }),
          task("other", { deadline: tuesday, remainingMin: 0 }),
        ],
        blocks: [block("pin", "other", "2026-10-12T20:00", "2026-10-12T21:00", { pinned: true })],
      }),
    ).toEqual([{ deadline: "2026-10-12T23:59", taskIds: ["t1"], dueMin: 120, freeMin: 60, missingMin: 60 }]);
  });

  test("fixed blocks of the due task count as free time for it", () => {
    expect(
      risks({
        freeTime: [rule(1, "18:00", "19:30")],
        tasks: [task("t1", { deadline: monday, remainingMin: 120 })],
        blocks: [block("pin", "t1", "2026-10-12T18:00", "2026-10-12T19:00", { pinned: true })],
      }),
    ).toEqual([{ deadline: "2026-10-12T23:59", taskIds: ["t1"], dueMin: 120, freeMin: 90, missingMin: 30 }]);
  });

  test("the buffer days count: S9 uses the real deadline", () => {
    expect(
      risks({
        freeTime: weekdays("18:00", "19:00"),
        tasks: [task("t1", { deadline: tuesday, remainingMin: 120 })],
      }),
    ).toEqual([]);
  });
});
