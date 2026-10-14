// Builders for planner tests. Times are written as local Paris wall-clock strings to keep tests readable.
import {
  DEFAULT_PLANNER_SETTINGS,
  type ExistingBlock,
  type FreeTimeRule,
  type PlannerInput,
  type PlannerTask,
  type Weekday,
} from "./contract.ts";

export const TZ = "Europe/Paris";

/** A local Paris date-time ("2026-10-12T08:00") as an instant. */
export function at(local: string): Temporal.Instant {
  return Temporal.PlainDateTime.from(local).toZonedDateTime(TZ).toInstant();
}

export function rule(weekday: Weekday, start: string, end: string): FreeTimeRule {
  return { weekday, startLocal: Temporal.PlainTime.from(start), endLocal: Temporal.PlainTime.from(end) };
}

export function task(id: string, fields: Partial<Omit<PlannerTask, "id">> = {}): PlannerTask {
  return { id, deadline: null, notBefore: null, remainingMin: 60, priority: 0, ...fields };
}

export function block(
  id: string,
  taskId: string,
  start: string,
  end: string,
  fields: Partial<ExistingBlock> = {},
): ExistingBlock {
  return { id, taskId, start: at(start), end: at(end), status: "planned", pinned: false, ...fields };
}

/** Monday 2026-10-12 08:00 Paris, no free time, nothing to plan. */
export function input(fields: Partial<PlannerInput> = {}): PlannerInput {
  return {
    now: at("2026-10-12T08:00"),
    timeZone: TZ,
    settings: DEFAULT_PLANNER_SETTINGS,
    freeTime: [],
    sessions: [],
    tasks: [],
    blocks: [],
    releaseStabilityWindow: false,
    ...fields,
  };
}

/** An instant as a local Paris date-time, "2026-10-12T08:00". */
export function local(instant: Temporal.Instant): string {
  return instant.toZonedDateTimeISO(TZ).toPlainDateTime().toString({ smallestUnit: "minute" });
}

/** Intervals as local Paris ranges, "2026-10-12T18:00–21:00" (end date shown only when it differs). */
export function ranges(intervals: readonly { start: Temporal.Instant; end: Temporal.Instant }[]): string[] {
  return intervals.map(({ start, end }) => {
    const [s, e] = [local(start), local(end)];
    return `${s}–${s.slice(0, 10) === e.slice(0, 10) ? e.slice(11) : e}`;
  });
}
