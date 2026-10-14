// Stability (S7): outside the window, a block stays where it is while it is still valid.
import type { Calendar } from "./calendar.ts";
import type { ExistingBlock, PlannerInput } from "./contract.ts";
import { compareIds, plannedTasks } from "./placement.ts";
import { durationMin, isBefore, localDate, subtractIntervals } from "./time.ts";

export type Stable = {
  /** The calendar without the kept blocks' time (free slots and daily use). */
  readonly calendar: Calendar;
  readonly kept: readonly ExistingBlock[];
  readonly removed: readonly ExistingBlock[];
};

/** Keeps each movable block, in start order, while it is valid; the others are removed. */
export function keepValidBlocks(input: PlannerInput, calendar: Calendar): Stable {
  const { settings, timeZone } = input;
  const tasks = new Map(plannedTasks(input.tasks).map((t) => [t.id, t]));
  let free = [...calendar.freeSlots];
  const dayUse = new Map(calendar.dayUseMin);
  const covered = new Map<string, number>();
  const perDay = new Map<string, number>();
  const count = (block: ExistingBlock) => {
    const key = `${block.taskId}|${localDate(block.start, timeZone).toString()}`;
    covered.set(block.taskId, (covered.get(block.taskId) ?? 0) + durationMin(block));
    perDay.set(key, (perDay.get(key) ?? 0) + 1);
  };
  calendar.fixed.forEach(count);

  const kept: ExistingBlock[] = [];
  const removed: ExistingBlock[] = [];
  const movable = [...calendar.movable].sort(
    (a, b) => Temporal.Instant.compare(a.start, b.start) || compareIds(a.id, b.id),
  );
  for (const block of movable) {
    const task = tasks.get(block.taskId);
    const length = durationMin(block);
    const day = localDate(block.start, timeZone).toString();
    const valid =
      task !== undefined &&
      !isBefore(task.deadline, block.end) &&
      (task.notBefore === null || !isBefore(block.start, task.notBefore)) &&
      length >= settings.blockMinMin &&
      length <= settings.blockMaxMin &&
      (covered.get(task.id) ?? 0) < task.remainingMin &&
      (dayUse.get(day) ?? 0) + length <= settings.maxMinPerDay &&
      (perDay.get(`${task.id}|${day}`) ?? 0) < settings.maxBlocksPerTaskPerDay &&
      free.some((slot) => !isBefore(block.start, slot.start) && !isBefore(slot.end, block.end));
    if (!valid) {
      removed.push(block);
      continue;
    }
    kept.push(block);
    count(block);
    dayUse.set(day, (dayUse.get(day) ?? 0) + length);
    free = subtractIntervals(free, [block]);
  }
  return { calendar: { ...calendar, freeSlots: free, dayUseMin: dayUse }, kept, removed };
}
