import { Result } from "@kata/shared";
import {
  PLANNER_VERSION,
  type PlannerInput,
  type PlannerInputError,
  type PlannerOutput,
} from "./contract.ts";
import { validateInput } from "./validate.ts";

/**
 * The planner (spec §7.1): a pure function. Same input, same output; it reads neither the clock
 * nor the database (`now` is an input, A6).
 */
export function plan(input: PlannerInput): Result<PlannerOutput, PlannerInputError> {
  return Result.map(validateInput(input), () => ({
    plannerVersion: PLANNER_VERSION,
    blocks: [],
    removedBlockIds: [],
    unplaced: [],
    risks: [],
  }));
}
