import { Result } from "@kata/shared";
import { buildCalendar } from "./calendar.ts";
import {
  PLANNER_VERSION,
  type PlannerInput,
  type PlannerInputError,
  type PlannerOutput,
} from "./contract.ts";
import { placeTasks } from "./placement.ts";
import { withReasons } from "./reasons.ts";
import { validateInput } from "./validate.ts";

/**
 * The planner (spec §7.1): a pure function. Same input, same output; it reads neither the clock
 * nor the database (`now` is an input, A6).
 */
export function plan(input: PlannerInput): Result<PlannerOutput, PlannerInputError> {
  return Result.map(validateInput(input), planValid);
}

function planValid(input: PlannerInput): PlannerOutput {
  const calendar = buildCalendar(input);
  const fixed = calendar.fixed.map((b) => ({
    blockId: b.id,
    taskId: b.taskId,
    start: b.start,
    end: b.end,
    pinned: b.pinned,
  }));
  const placement = placeTasks(input, calendar, fixed);
  const added = placement.added.map((slot) => ({ ...slot, blockId: null, pinned: false }));
  return {
    plannerVersion: PLANNER_VERSION,
    blocks: withReasons([...fixed, ...added], input),
    removedBlockIds: [...calendar.droppedBlockIds, ...calendar.movable.map((b) => b.id)],
    unplaced: placement.unplaced,
    risks: [],
  };
}
