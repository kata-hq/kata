// Risk report (S9): for a deadline, the work due before it is larger than the free time before it.
import type { Calendar } from "./calendar.ts";
import type { DeadlineRisk, PlannerInput } from "./contract.ts";
import { plannedTasks } from "./placement.ts";
import { clipIntervals, durationMin, isBefore, localDate } from "./time.ts";

/** One entry per deadline whose due work exceeds the free time from now to it (the real deadline, not the buffer). */
export function riskReport(input: PlannerInput, calendar: Calendar): DeadlineRisk[] {
  const { settings, timeZone } = input;
  const tasks = plannedTasks(input.tasks);
  const deadlineOf = new Map(tasks.map((t) => [t.id, t.deadline]));
  const deadlines = tasks.map((t) => t.deadline).filter((d, i, all) => i === 0 || !d.equals(all[i - 1] ?? d));

  return deadlines.flatMap((deadline) => {
    const due = tasks.filter((t) => !isBefore(deadline, t.deadline));
    const dueMin = due.reduce((sum, t) => sum + t.remainingMin, 0);

    const freeByDay = new Map<string, number>();
    for (const slot of clipIntervals(calendar.freeSlots, calendar.start, deadline)) {
      const day = localDate(slot.start, timeZone).toString();
      freeByDay.set(day, (freeByDay.get(day) ?? 0) + durationMin(slot));
    }
    let freeMin = 0;
    for (const [day, minutes] of freeByDay) {
      freeMin += Math.min(minutes, Math.max(0, settings.maxMinPerDay - (calendar.dayUseMin.get(day) ?? 0)));
    }
    for (const block of calendar.fixed) {
      const taskDeadline = deadlineOf.get(block.taskId);
      if (taskDeadline && !isBefore(deadline, taskDeadline)) freeMin += durationMin(block);
    }
    freeMin = Math.floor(freeMin);

    const missingMin = dueMin - freeMin;
    if (missingMin <= 0) return [];
    const taskIds = due.filter((t) => t.deadline.equals(deadline)).map((t) => t.id);
    return [{ deadline, taskIds, dueMin, freeMin, missingMin }];
  });
}
