// @kata/planner: the pure planner (spec §7.1). No I/O (A6): no database, no clock, no network.
export type {
  BlockReason,
  BlockStatus,
  ClassSession,
  DeadlineRisk,
  ExistingBlock,
  FreeTimeRule,
  PlannedBlock,
  PlannerInput,
  PlannerInputError,
  PlannerOutput,
  PlannerSettings,
  PlannerTask,
  ReasonCode,
  UnplacedWork,
  Weekday,
} from "./contract.ts";
export { DEFAULT_PLANNER_SETTINGS, PLANNER_VERSION } from "./contract.ts";
export { plan } from "./plan.ts";
