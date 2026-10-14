// Placement (S2–S4, S12–S15): each task, in order, gets blocks in the first valid free time.
import type { Calendar } from "./calendar.ts";
import type { PlannerInput, PlannerSettings, PlannerTask, UnplacedWork } from "./contract.ts";
import {
  datesBetween,
  durationMin,
  type Interval,
  isBefore,
  localDate,
  maxInstant,
  minInstant,
  minutesBetween,
  subtractIntervals,
} from "./time.ts";

/** A block of the plan, before its reason is written. */
export type Slot = {
  readonly taskId: string;
  readonly start: Temporal.Instant;
  readonly end: Temporal.Instant;
};

export type DatedTask = PlannerTask & { readonly deadline: Temporal.Instant };

export type Placement = { readonly added: readonly Slot[]; readonly unplaced: readonly UnplacedWork[] };

/** S2: tasks with a deadline, by deadline, then priority (higher first), then id. K-R6: no deadline, not planned. */
export function plannedTasks(tasks: readonly PlannerTask[]): DatedTask[] {
  return tasks
    .filter((t): t is DatedTask => t.deadline !== null)
    .sort(
      (a, b) =>
        Temporal.Instant.compare(a.deadline, b.deadline) || b.priority - a.priority || compareIds(a.id, b.id),
    );
}

export function compareIds(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** S14: the planner tries to finish `bufferDays` local days before the deadline. */
export function softDeadline(task: DatedTask, input: PlannerInput): Temporal.Instant {
  return task.deadline
    .toZonedDateTimeISO(input.timeZone)
    .subtract({ days: input.settings.bufferDays })
    .toInstant();
}

/** S3: the length to aim for, so that no block of the remaining work is shorter than the minimum. */
export function targetLength(need: number, { blockMinMin, blockMaxMin }: PlannerSettings): number {
  if (need <= blockMinMin) return blockMinMin;
  if (need <= blockMaxMin) return need;
  if (need - blockMaxMin < blockMinMin) return Math.max(blockMinMin, need - blockMinMin);
  return blockMaxMin;
}

/**
 * Places the work of every task (S12) around `existing` blocks (already in the plan: they take no free time
 * from `calendar.freeSlots` again, but count for the task's need, the daily maximum and the per-day limit).
 */
export function placeTasks(input: PlannerInput, calendar: Calendar, existing: readonly Slot[]): Placement {
  const board = new Board(input, calendar, existing);
  const added: Slot[] = [];
  const unplaced: UnplacedWork[] = [];
  for (const task of plannedTasks(input.tasks)) {
    const placed = board.place(task);
    added.push(...placed.slots);
    if (placed.missingMin > 0) unplaced.push({ taskId: task.id, missingMin: placed.missingMin });
  }
  return { added, unplaced };
}

class Board {
  private free: Interval[];
  private readonly dayUse: Map<string, number>;
  private readonly taskDayCount = new Map<string, number>();
  private readonly existingMin = new Map<string, number>();

  constructor(
    private readonly input: PlannerInput,
    private readonly calendar: Calendar,
    existing: readonly Slot[],
  ) {
    this.free = [...calendar.freeSlots];
    this.dayUse = new Map(calendar.dayUseMin);
    for (const slot of existing) {
      this.existingMin.set(slot.taskId, (this.existingMin.get(slot.taskId) ?? 0) + durationMin(slot));
      this.count(slot);
    }
  }

  place(task: DatedTask): { slots: Slot[]; missingMin: number } {
    const { settings } = this.input;
    let need = Math.ceil(task.remainingMin - (this.existingMin.get(task.id) ?? 0));
    const slots: Slot[] = [];
    const start = task.notBefore ? maxInstant(this.calendar.start, task.notBefore) : this.calendar.start;
    const soft = minInstant(softDeadline(task, this.input), task.deadline);
    const passes: [end: Temporal.Instant, cap: number, backward: boolean][] = [
      [soft, settings.maxBlocksPerTaskPerDay, false], // S14: before the buffer, S13 limit
      [task.deadline, settings.maxBlocksPerTaskPerDay, false], // S14: the buffer days too
      [task.deadline, Number.POSITIVE_INFINITY, true], // S13 exception: extra blocks, last days first
    ];
    for (const [end, cap, backward] of passes) {
      if (need <= 0 || !isBefore(start, end)) continue;
      const dates = datesBetween(localDate(start, this.input.timeZone), localDate(end, this.input.timeZone));
      for (const date of backward ? dates.reverse() : dates) {
        need = this.fillDay(task.id, date, { start, end }, cap, need, slots);
        if (need <= 0) break;
      }
    }
    return { slots, missingMin: Math.max(0, need) };
  }

  /** Places blocks of one task on one local date, earliest free time first. Returns the work still to place. */
  private fillDay(
    taskId: string,
    date: Temporal.PlainDate,
    range: Interval,
    cap: number,
    need: number,
    slots: Slot[],
  ): number {
    const { settings, timeZone } = this.input;
    const day = date.toString();
    const window = {
      start: maxInstant(range.start, date.toZonedDateTime({ timeZone }).toInstant()),
      end: minInstant(range.end, date.add({ days: 1 }).toZonedDateTime({ timeZone }).toInstant()),
    };
    let left = need;
    while (left > 0 && (this.taskDayCount.get(`${taskId}|${day}`) ?? 0) < cap) {
      const budget = settings.maxMinPerDay - (this.dayUse.get(day) ?? 0);
      if (budget < settings.blockMinMin) break;
      const segment = this.firstSegment(window, settings.blockMinMin);
      if (!segment) break;
      let length = Math.min(targetLength(left, settings), budget, Math.floor(durationMin(segment)));
      // Do not leave a remainder shorter than the minimum when a shorter block avoids it.
      const remainder = left - length;
      if (
        remainder > 0 &&
        remainder < settings.blockMinMin &&
        length - settings.blockMinMin >= settings.blockMinMin
      ) {
        length = Math.max(settings.blockMinMin, left - settings.blockMinMin);
      }
      const slot = { taskId, start: segment.start, end: segment.start.add({ minutes: length }) };
      this.take(slot);
      slots.push(slot);
      left -= length;
    }
    return left;
  }

  /** The earliest free time inside `window` at least `minMin` minutes long. */
  private firstSegment(window: Interval, minMin: number): Interval | undefined {
    for (const slot of this.free) {
      if (!isBefore(slot.start, window.end)) return undefined;
      const start = maxInstant(slot.start, window.start);
      const end = minInstant(slot.end, window.end);
      if (isBefore(start, end) && minutesBetween(start, end) >= minMin) return { start, end };
    }
    return undefined;
  }

  private take(slot: Slot): void {
    this.free = subtractIntervals(this.free, [slot]);
    const day = localDate(slot.start, this.input.timeZone).toString();
    this.dayUse.set(day, (this.dayUse.get(day) ?? 0) + durationMin(slot));
    this.count(slot);
  }

  private count(slot: Slot): void {
    const key = `${slot.taskId}|${localDate(slot.start, this.input.timeZone).toString()}`;
    this.taskDayCount.set(key, (this.taskDayCount.get(key) ?? 0) + 1);
  }
}
