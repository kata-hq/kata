// The time the planner may use (S1, S5, S6): free time minus sessions, fixed blocks and done blocks.
import type { ExistingBlock, PlannerInput } from "./contract.ts";
import {
  addMinutes,
  atLocal,
  ceilToStep,
  clipIntervals,
  datesBetween,
  durationMin,
  type Interval,
  isBefore,
  localDate,
  maxInstant,
  mergeIntervals,
  subtractIntervals,
} from "./time.ts";

/** Blocks start on multiples of this many minutes after `now` (readable times, not 08:03:27). */
export const START_STEP_MIN = 5;

export type Calendar = {
  /** `now` rounded up to START_STEP_MIN: nothing is placed before it. */
  readonly start: Temporal.Instant;
  /** The latest task deadline (or `start` when no task has one): nothing is placed after it. */
  readonly horizon: Temporal.Instant;
  /** Free time minus sessions, fixed blocks and done blocks, from `start` to `horizon`. Sorted, merged. */
  readonly freeSlots: readonly Interval[];
  /** Planned blocks that keep their place: pinned (S5), in the stability window (S6), in progress. */
  readonly fixed: readonly ExistingBlock[];
  /** Other future planned blocks; stability (S7) decides whether they stay. */
  readonly movable: readonly ExistingBlock[];
  /** Planned blocks of an unknown task or of a task without a deadline (K-R6). */
  readonly droppedBlockIds: readonly string[];
  /** Minutes of fixed and done blocks per local date (`PlainDate#toString()`), for the daily maximum (S4). */
  readonly dayUseMin: ReadonlyMap<string, number>;
};

export function buildCalendar(input: PlannerInput): Calendar {
  const { now, timeZone, settings } = input;
  const start = ceilToStep(now, START_STEP_MIN);
  const deadlines = new Map(input.tasks.map((t) => [t.id, t.deadline]));
  const horizon = input.tasks.reduce((h, t) => (t.deadline ? maxInstant(h, t.deadline) : h), start);
  const windowEnd = addMinutes(now, settings.stabilityWindowH * 60);

  const fixed: ExistingBlock[] = [];
  const movable: ExistingBlock[] = [];
  const droppedBlockIds: string[] = [];
  const done: ExistingBlock[] = [];
  for (const block of input.blocks) {
    if (block.status === "done") done.push(block);
    if (block.status !== "planned" || !isBefore(now, block.end)) continue;
    if (!deadlines.get(block.taskId)) droppedBlockIds.push(block.id);
    else if (isFixed(block, now, windowEnd, input.releaseStabilityWindow)) fixed.push(block);
    else movable.push(block);
  }

  const busy = [...input.sessions, ...fixed, ...done].map(({ start, end }) => ({ start, end }));
  const freeSlots = clipIntervals(subtractIntervals(freeTime(input, start, horizon), busy), start, horizon);

  const dayUseMin = new Map<string, number>();
  for (const block of [...fixed, ...done]) {
    const day = localDate(block.start, timeZone).toString();
    dayUseMin.set(day, (dayUseMin.get(day) ?? 0) + durationMin(block));
  }

  return { start, horizon, freeSlots, fixed, movable, droppedBlockIds, dayUseMin };
}

function isFixed(
  block: ExistingBlock,
  now: Temporal.Instant,
  windowEnd: Temporal.Instant,
  release: boolean,
): boolean {
  const inProgress = isBefore(block.start, now);
  const inWindow = isBefore(block.start, windowEnd) && !release;
  return block.pinned || inProgress || inWindow;
}

/** The free-time rules expanded on every local date from `start` to `horizon`, clipped to them. */
function freeTime(input: PlannerInput, start: Temporal.Instant, horizon: Temporal.Instant): Interval[] {
  const { timeZone, freeTime: rules } = input;
  const intervals = datesBetween(localDate(start, timeZone), localDate(horizon, timeZone)).flatMap((date) =>
    rules
      .filter((rule) => rule.weekday === date.dayOfWeek)
      .map((rule) => ({
        start: atLocal(date, rule.startLocal, timeZone),
        end: atLocal(date, rule.endLocal, timeZone),
      })),
  );
  return clipIntervals(mergeIntervals(intervals), start, horizon);
}
