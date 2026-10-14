import { err, ok, type Result } from "@kata/shared";
import type { PlannerInput, PlannerInputError, PlannerSettings } from "./contract.ts";

type Check = readonly [field: string, failed: boolean, message: string];

/** Returns the input unchanged, or the first field the planner refuses. */
export function validateInput(input: PlannerInput): Result<PlannerInput, PlannerInputError> {
  const checks: Check[] = [
    ["timeZone", !isTimeZone(input.timeZone), `unknown time zone "${input.timeZone}"`],
    ...settingsChecks(input.settings),
    ...input.freeTime.map(
      (rule, i): Check => [
        `freeTime[${i}]`,
        Temporal.PlainTime.compare(rule.endLocal, rule.startLocal) <= 0,
        "endLocal must be after startLocal",
      ],
    ),
    ...input.sessions.map((s, i): Check => [`sessions[${i}]`, !isInterval(s), "end must be after start"]),
    ...input.blocks.map((b, i): Check => [`blocks[${i}]`, !isInterval(b), "end must be after start"]),
    ...input.tasks.map(
      (t, i): Check => [`tasks[${i}].remainingMin`, !isMinutes(t.remainingMin), "must be an integer ≥ 0"],
    ),
  ];
  const failed = checks.find(([, isFailed]) => isFailed);
  return failed ? err({ field: failed[0], message: failed[2] }) : ok(input);
}

function settingsChecks(s: PlannerSettings): Check[] {
  const positive = (name: keyof PlannerSettings): Check => [
    `settings.${name}`,
    !isMinutes(s[name]) || s[name] === 0,
    "must be an integer > 0",
  ];
  return [
    positive("maxMinPerDay"),
    positive("blockMinMin"),
    positive("blockMaxMin"),
    ["settings.blockMaxMin", s.blockMaxMin < s.blockMinMin, "must be ≥ settings.blockMinMin"],
    positive("maxBlocksPerTaskPerDay"),
    ["settings.bufferDays", !isMinutes(s.bufferDays), "must be an integer ≥ 0"],
    ["settings.stabilityWindowH", !isMinutes(s.stabilityWindowH), "must be an integer ≥ 0"],
  ];
}

function isMinutes(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

function isInterval(interval: { readonly start: Temporal.Instant; readonly end: Temporal.Instant }): boolean {
  return Temporal.Instant.compare(interval.end, interval.start) > 0;
}

function isTimeZone(timeZone: string): boolean {
  try {
    Temporal.Instant.fromEpochMilliseconds(0).toZonedDateTimeISO(timeZone);
    return true;
  } catch {
    return false;
  }
}
