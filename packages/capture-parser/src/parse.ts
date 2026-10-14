// parseCapture: one line of quick capture → course, type, deadline and title (spec §7.4, rules C1–C7).
// A pure function: the reference instant, time zone, courses and task types are inputs.
import { err, ok, type Result } from "@kata/shared";
import type { Capture, CaptureContext, CaptureError } from "./types.ts";

export function parseCapture(input: string, context: CaptureContext): Result<Capture, CaptureError> {
  const now = referenceIn(context);
  if (!now.ok) return now;
  return ok({ input, title: input.trim(), course: null, taskType: null, deadline: null });
}

/** The reference instant in the person's time zone, or why the context is invalid. */
function referenceIn(context: CaptureContext): Result<Temporal.ZonedDateTime, CaptureError> {
  let instant: Temporal.Instant;
  try {
    instant = Temporal.Instant.from(context.reference);
  } catch {
    return err({
      code: "invalid-reference",
      message: `reference "${context.reference}" is not an ISO 8601 instant with an offset (e.g. 2026-10-14T09:00:00Z)`,
    });
  }
  try {
    return ok(instant.toZonedDateTimeISO(context.timeZone));
  } catch {
    return err({
      code: "invalid-time-zone",
      message: `time zone "${context.timeZone}" is not an IANA time zone (e.g. Europe/Paris)`,
    });
  }
}
