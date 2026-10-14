// Time helpers (spec M7): instants in UTC, recurring rules in local time + IANA time zone, days as dates.
// Pure: no helper reads the clock; callers pass the instant they mean by "now".
// Temporal comes from the polyfill so the API, the web app and the packages use one implementation.
import { Temporal } from "temporal-polyfill";

export { Temporal };

/** Time zone of a new account (spec 10.2). */
export const DEFAULT_TIME_ZONE = "Europe/Paris";

/** True when `name` is an IANA time zone the runtime knows (`Europe/Paris`, `UTC`). */
export function isValidTimeZone(name: string): boolean {
  try {
    Temporal.ZonedDateTime.from({ year: 2000, month: 1, day: 1, timeZone: name });
    return true;
  } catch {
    return false;
  }
}

/**
 * The instant of a local wall time in `timeZone`.
 * - Gap (spring forward, the time does not exist): moved forward by the gap length (02:30 → 03:30 in Paris).
 * - Overlap (fall back, the time happens twice): the earlier instant (summer time).
 */
export function toInstant(
  date: Temporal.PlainDate,
  time: Temporal.PlainTime,
  timeZone: string,
): Temporal.Instant {
  return date.toZonedDateTime({ timeZone, plainTime: time }).toInstant();
}

/** The instant seen in `timeZone`. */
export function toZoned(instant: Temporal.Instant, timeZone: string): Temporal.ZonedDateTime {
  return instant.toZonedDateTimeISO(timeZone);
}

/** The local calendar day of `instant` in `timeZone`. */
export function localDateOf(instant: Temporal.Instant, timeZone: string): Temporal.PlainDate {
  return toZoned(instant, timeZone).toPlainDate();
}

/** The first instant of the local day `date` in `timeZone` (not always 00:00 where a gap starts at midnight). */
export function startOfLocalDay(date: Temporal.PlainDate, timeZone: string): Temporal.Instant {
  return date.toZonedDateTime({ timeZone }).toInstant();
}

/** The Monday of the ISO week of `date`. */
export function weekStart(date: Temporal.PlainDate): Temporal.PlainDate {
  return date.subtract({ days: date.dayOfWeek - 1 });
}

// Database interop. Prisma reads and writes JS `Date`s:
// - `timestamptz`: a `Date` is an instant.
// - `@db.Date`: Prisma uses the `Date` at 00:00 UTC of that day.
// - `@db.Time`: Prisma uses the `Date` 1970-01-01 at that time, UTC.
// Every conversion reads and writes UTC fields only, so the process time zone never shifts a value.

export function instantFromDate(date: Date): Temporal.Instant {
  return Temporal.Instant.fromEpochMilliseconds(date.getTime());
}

export function instantToDate(instant: Temporal.Instant): Date {
  return new Date(instant.epochMilliseconds);
}

export function plainDateFromDb(date: Date): Temporal.PlainDate {
  return new Temporal.PlainDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

export function plainDateToDb(date: Temporal.PlainDate): Date {
  return new Date(Date.UTC(date.year, date.month - 1, date.day));
}

export function plainTimeFromDb(time: Date): Temporal.PlainTime {
  return new Temporal.PlainTime(
    time.getUTCHours(),
    time.getUTCMinutes(),
    time.getUTCSeconds(),
    time.getUTCMilliseconds(),
  );
}

export function plainTimeToDb(time: Temporal.PlainTime): Date {
  return new Date(Date.UTC(1970, 0, 1, time.hour, time.minute, time.second, time.millisecond));
}
