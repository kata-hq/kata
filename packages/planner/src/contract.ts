// The planner contract (spec §7.1, figure 3): what goes in, what comes out.
// Instants are `Temporal.Instant` (UTC); free-time rules are local times in `timeZone` (spec §10.2 "Temps").

/** Bumped when the planner's behavior changes. Stored in `PlanRun.plannerVersion`. */
export const PLANNER_VERSION = "0.1.0";

/** ISO weekday: 1 = Monday … 7 = Sunday (same as `Temporal.PlainDate#dayOfWeek`). */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** The `PlannerSettings` table (spec §9.2). Defaults in `DEFAULT_PLANNER_SETTINGS`. */
export type PlannerSettings = {
  /** S4: most minutes of work blocks in one local day. */
  readonly maxMinPerDay: number;
  /** S3: shortest block. */
  readonly blockMinMin: number;
  /** S3: longest block; longer work gets several blocks. */
  readonly blockMaxMin: number;
  /** S13: blocks of one task in one local day (exception in the last days before the deadline). */
  readonly maxBlocksPerTaskPerDay: number;
  /** S14: the planner tries to finish a task this many days before its deadline. */
  readonly bufferDays: number;
  /** S6: planned blocks starting in the next N hours do not move. */
  readonly stabilityWindowH: number;
};

/** The spec's "proposition" values (S3, S4, S6, S13, S14). Settings are inputs: the logic never reads these. */
export const DEFAULT_PLANNER_SETTINGS: PlannerSettings = {
  maxMinPerDay: 180,
  blockMinMin: 30,
  blockMaxMin: 90,
  maxBlocksPerTaskPerDay: 1,
  bufferDays: 1,
  stabilityWindowH: 24,
};

/** A weekly free-time rule (`FreeTimeRule`, A4): local times in the input's `timeZone`. */
export type FreeTimeRule = {
  readonly weekday: Weekday;
  readonly startLocal: Temporal.PlainTime;
  readonly endLocal: Temporal.PlainTime;
};

/** A class session that takes place (cancelled sessions are not passed). Blocks never overlap it (S1). */
export type ClassSession = {
  readonly id: string;
  readonly start: Temporal.Instant;
  readonly end: Temporal.Instant;
};

/** A task to plan. Done tasks are not passed. */
export type PlannerTask = {
  readonly id: string;
  /** No deadline: the task is not planned (K-R6). A deadline without a time is passed as 23:59 local (K-R7). */
  readonly deadline: Temporal.Instant | null;
  /** S15: no block before this instant. */
  readonly notBefore: Temporal.Instant | null;
  /** K-R2: estimate minus the time of done blocks. Planned blocks are not subtracted. */
  readonly remainingMin: number;
  /** S2: tie-break after the deadline; higher goes first. */
  readonly priority: number;
};

export type BlockStatus = "planned" | "done" | "skipped" | "missed";

/** A block of the previous plan (`WorkBlock`). */
export type ExistingBlock = {
  readonly id: string;
  readonly taskId: string;
  readonly start: Temporal.Instant;
  readonly end: Temporal.Instant;
  readonly status: BlockStatus;
  /** S5: a pinned block never moves. */
  readonly pinned: boolean;
};

export type PlannerInput = {
  /** The planner never reads the clock (A6). */
  readonly now: Temporal.Instant;
  /** IANA time zone of the person (`User.timezone`), for free-time rules and days. */
  readonly timeZone: string;
  readonly settings: PlannerSettings;
  readonly freeTime: readonly FreeTimeRule[];
  readonly sessions: readonly ClassSession[];
  readonly tasks: readonly PlannerTask[];
  readonly blocks: readonly ExistingBlock[];
  /** S6 exceptions (a block skipped or moved, a session in the window changed): blocks in the window may move. */
  readonly releaseStabilityWindow: boolean;
};

export type ReasonCode =
  /** Placed for its deadline (S10). */
  | "deadline"
  /** Placed in the buffer before the deadline (S14) or as an extra block the same day (S13). */
  | "deadline_tight";

/** S10: the reason of a block, as a code and parameters; the UI writes the text. JSON-friendly. */
export type BlockReason = {
  readonly code: ReasonCode;
  readonly params: {
    /** The task's deadline, ISO instant. */
    readonly deadline: string;
    /** Work left on the task when this block starts (this block included), in minutes. */
    readonly remainingMin: number;
  };
};

/** A planned block of the new plan. */
export type PlannedBlock = {
  /** The existing block kept in place, or `null` for a new block. */
  readonly blockId: string | null;
  readonly taskId: string;
  readonly start: Temporal.Instant;
  readonly end: Temporal.Instant;
  readonly pinned: boolean;
  readonly reason: BlockReason;
};

/** Work of a task that did not fit before its deadline. */
export type UnplacedWork = {
  readonly taskId: string;
  readonly missingMin: number;
};

/** S9: for a deadline, the work due before it is larger than the free time before it. */
export type DeadlineRisk = {
  readonly deadline: Temporal.Instant;
  /** Tasks with exactly this deadline. */
  readonly taskIds: readonly string[];
  /** Remaining work of every task due at or before the deadline. */
  readonly dueMin: number;
  /** Free time from `now` to the deadline (daily maximum applied). */
  readonly freeMin: number;
  readonly missingMin: number;
};

export type PlannerOutput = {
  readonly plannerVersion: string;
  /** Every planned block from `now` on, sorted by start then task id. */
  readonly blocks: readonly PlannedBlock[];
  /** Planned blocks of the input that the new plan drops. */
  readonly removedBlockIds: readonly string[];
  readonly unplaced: readonly UnplacedWork[];
  readonly risks: readonly DeadlineRisk[];
};

/** Input the planner refuses. `field` is a path into `PlannerInput`, e.g. `tasks[2].remainingMin`. */
export type PlannerInputError = {
  readonly field: string;
  readonly message: string;
};
