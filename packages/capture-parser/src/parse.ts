// parseCapture: one line of quick capture → course, type, deadline and title (spec §7.4, rules C1–C7).
// A pure function: the reference instant, time zone, courses and task types are inputs.
import { err, ok, type Result } from "@kata/shared";
import { findCourse } from "./courses.ts";
import { type DateMatch, findDate } from "./dates.ts";
import { findTaskType } from "./task-types.ts";
import { type Token, tokenize } from "./text.ts";
import type { Capture, CaptureContext, CaptureError, Deadline } from "./types.ts";

/** Rule K-R7: a deadline without a time is the end of that day, 23:59 local time. */
const END_OF_DAY = new Temporal.PlainTime(23, 59);

export function parseCapture(input: string, context: CaptureContext): Result<Capture, CaptureError> {
  const now = referenceIn(context);
  if (!now.ok) return now;
  const tokens = tokenize(input);
  /** The normalised words still free; a word read as a date, type or course becomes null. */
  const free: (string | null)[] = tokens.map((token) => token.norm);
  const use = (start: number, end: number) => free.fill(null, start, end);

  const date = findDate(tokens, now.value);
  if (date !== null) use(date.start, date.end);
  const type = findTaskType(free, context.taskTypes);
  if (type !== null) use(type.start, type.end);
  const course = findCourse(free, context.courses);
  if (course !== null) use(course.start, course.end);

  return ok({
    input,
    title: input.trim(),
    course:
      course === null
        ? null
        : {
            id: course.value.id,
            name: course.value.name,
            matched: spanText(input, tokens, course.start, course.end),
          },
    taskType:
      type === null
        ? null
        : {
            key: type.value.key,
            label: type.value.label,
            matched: spanText(input, tokens, type.start, type.end),
          },
    deadline: date === null ? null : deadline(input, tokens, date, context.timeZone),
  });
}

function deadline(input: string, tokens: readonly Token[], match: DateMatch, timeZone: string): Deadline {
  const instant = match.date.toZonedDateTime({ timeZone, plainTime: match.time ?? END_OF_DAY }).toInstant();
  return {
    date: match.date.toString(),
    time: match.time === null ? null : match.time.toString({ smallestUnit: "minute" }),
    instant: instant.toString(),
    matched: spanText(input, tokens, match.start, match.end),
  };
}

/** The input text from token `start` to token `end - 1`, as typed. */
function spanText(input: string, tokens: readonly Token[], start: number, end: number): string {
  const first = tokens[start];
  const last = tokens[end - 1];
  if (first === undefined || last === undefined) return "";
  return input.slice(first.index, last.index + last.text.length);
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
