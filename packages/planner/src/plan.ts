import { Result } from "@kata/shared";
import { buildCalendar, type Calendar } from "./calendar.ts";
import {
  type ExistingBlock,
  PLANNER_VERSION,
  type PlannerInput,
  type PlannerInputError,
  type PlannerOutput,
  type UnplacedWork,
} from "./contract.ts";
import { placeTasks, type Slot } from "./placement.ts";
import { type UnreasonedBlock, withReasons } from "./reasons.ts";
import { riskReport } from "./risk.ts";
import { keepValidBlocks } from "./stability.ts";
import { validateInput } from "./validate.ts";

/**
 * The planner (spec §7.1): a pure function. Same input, same output; it reads neither the clock
 * nor the database (`now` is an input, A6).
 */
export function plan(input: PlannerInput): Result<PlannerOutput, PlannerInputError> {
  return Result.map(validateInput(input), planValid);
}

type Attempt = {
  readonly existing: readonly ExistingBlock[];
  readonly added: readonly Slot[];
  readonly removed: readonly ExistingBlock[];
  readonly unplaced: readonly UnplacedWork[];
};

function planValid(input: PlannerInput): PlannerOutput {
  const calendar = buildCalendar(input);
  const stable = keepValidBlocks(input, calendar);
  let attempt = place(input, stable.calendar, [...calendar.fixed, ...stable.kept], stable.removed);
  // S2: blocks kept for a later deadline must not leave earlier work unplaced.
  if (stable.kept.length > 0 && totalMin(attempt.unplaced) > 0) {
    const fresh = place(input, calendar, calendar.fixed, calendar.movable);
    if (totalMin(fresh.unplaced) < totalMin(attempt.unplaced)) attempt = fresh;
  }
  const { blocks, removed } = reuseIds(attempt);
  return {
    plannerVersion: PLANNER_VERSION,
    blocks: withReasons(blocks, input),
    removedBlockIds: [...calendar.droppedBlockIds, ...removed.map((b) => b.id)],
    unplaced: attempt.unplaced,
    risks: riskReport(input, calendar),
  };
}

function place(
  input: PlannerInput,
  calendar: Calendar,
  existing: readonly ExistingBlock[],
  removed: readonly ExistingBlock[],
): Attempt {
  const placement = placeTasks(input, calendar, existing);
  return { existing, added: placement.added, removed, unplaced: placement.unplaced };
}

/** No churn: a new block identical to a removed one (task, start, end) keeps that block's id. */
function reuseIds(attempt: Attempt): { blocks: UnreasonedBlock[]; removed: ExistingBlock[] } {
  const removed = [...attempt.removed];
  const blocks: UnreasonedBlock[] = attempt.existing.map((b) => ({
    ...slotOf(b),
    blockId: b.id,
    pinned: b.pinned,
  }));
  for (const slot of attempt.added) {
    const index = removed.findIndex(
      (b) => b.taskId === slot.taskId && b.start.equals(slot.start) && b.end.equals(slot.end),
    );
    const same = removed[index];
    if (same) removed.splice(index, 1);
    blocks.push({ ...slot, blockId: same ? same.id : null, pinned: false });
  }
  return { blocks, removed };
}

function slotOf(block: ExistingBlock): Slot {
  return { taskId: block.taskId, start: block.start, end: block.end };
}

function totalMin(unplaced: readonly UnplacedWork[]): number {
  return unplaced.reduce((sum, u) => sum + u.missingMin, 0);
}
