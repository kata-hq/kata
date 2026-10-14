import { describe, expect, test } from "bun:test";
import { at, ranges } from "./test-support.ts";
import { ceilToStep, mergeIntervals, subtractIntervals } from "./time.ts";

const span = (start: string, end: string) => ({ start: at(`2026-10-12T${start}`), end: at(`2026-10-12T${end}`) });

describe("interval math", () => {
  test("merge sorts and joins overlapping and touching intervals", () => {
    expect(ranges(mergeIntervals([span("12:00", "13:00"), span("09:00", "10:00"), span("09:30", "12:00")]))).toEqual([
      "2026-10-12T09:00–13:00",
    ]);
  });

  test("subtract removes every busy part, including busy intervals that span several free ones", () => {
    const free = [span("08:00", "10:00"), span("11:00", "13:00"), span("14:00", "15:00")];
    const busy = [span("07:00", "08:30"), span("09:00", "11:30"), span("12:00", "12:15"), span("16:00", "17:00")];

    expect(ranges(subtractIntervals(free, busy))).toEqual([
      "2026-10-12T08:30–09:00",
      "2026-10-12T11:30–12:00",
      "2026-10-12T12:15–13:00",
      "2026-10-12T14:00–15:00",
    ]);
  });

  test("ceilToStep rounds up to the step and keeps exact steps", () => {
    expect(ceilToStep(at("2026-10-12T08:00:01"), 5)).toEqual(at("2026-10-12T08:05"));
    expect(ceilToStep(at("2026-10-12T08:10"), 5)).toEqual(at("2026-10-12T08:10"));
  });
});
