// Reasons (S10, P2): every block says which deadline it serves and how much work is left on its task.
import type { PlannedBlock, PlannerInput } from "./contract.ts";
import { compareIds, type DatedTask, plannedTasks, type Slot, softDeadline } from "./placement.ts";
import { durationMin, isBefore, localDate } from "./time.ts";

export type UnreasonedBlock = Slot & { readonly blockId: string | null; readonly pinned: boolean };

/**
 * Adds the reason of each block and sorts the plan by start, then task id. Blocks of a task without a deadline
 * are not expected (the calendar drops them).
 * `deadline_tight`: the block ends inside the buffer (S14) or is an extra block of its task that day (S13).
 */
export function withReasons(blocks: readonly UnreasonedBlock[], input: PlannerInput): PlannedBlock[] {
  const tasks = new Map<string, DatedTask>(plannedTasks(input.tasks).map((t) => [t.id, t]));
  const sorted = [...blocks].sort(
    (a, b) =>
      Temporal.Instant.compare(a.start, b.start) ||
      compareIds(a.taskId, b.taskId) ||
      compareIds(a.blockId ?? "", b.blockId ?? ""),
  );
  const doneMin = new Map<string, number>();
  const perDay = new Map<string, number>();
  return sorted.flatMap((block) => {
    const task = tasks.get(block.taskId);
    if (!task) return [];
    const before = doneMin.get(task.id) ?? 0;
    doneMin.set(task.id, before + durationMin(block));
    const dayKey = `${task.id}|${localDate(block.start, input.timeZone).toString()}`;
    const indexInDay = perDay.get(dayKey) ?? 0;
    perDay.set(dayKey, indexInDay + 1);
    const tight =
      isBefore(softDeadline(task, input), block.end) || indexInDay >= input.settings.maxBlocksPerTaskPerDay;
    return [
      {
        ...block,
        reason: {
          code: tight ? "deadline_tight" : "deadline",
          params: {
            deadline: task.deadline.toString(),
            remainingMin: Math.max(0, Math.ceil(task.remainingMin - before)),
          },
        },
      },
    ];
  });
}
