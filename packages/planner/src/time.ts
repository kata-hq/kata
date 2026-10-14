// Time math of the planner: half-open intervals [start, end) of UTC instants, and local dates.

export type Interval = { readonly start: Temporal.Instant; readonly end: Temporal.Instant };

const MS_PER_MIN = 60_000;

export function minutesBetween(start: Temporal.Instant, end: Temporal.Instant): number {
  return (end.epochMilliseconds - start.epochMilliseconds) / MS_PER_MIN;
}

export function durationMin(interval: Interval): number {
  return minutesBetween(interval.start, interval.end);
}

export function addMinutes(instant: Temporal.Instant, minutes: number): Temporal.Instant {
  return instant.add({ minutes });
}

export function isBefore(a: Temporal.Instant, b: Temporal.Instant): boolean {
  return Temporal.Instant.compare(a, b) < 0;
}

export function maxInstant(a: Temporal.Instant, b: Temporal.Instant): Temporal.Instant {
  return isBefore(a, b) ? b : a;
}

export function minInstant(a: Temporal.Instant, b: Temporal.Instant): Temporal.Instant {
  return isBefore(a, b) ? a : b;
}

/** Rounds up to the next multiple of `stepMin` minutes (UTC epoch; same as local time for whole-quarter offsets). */
export function ceilToStep(instant: Temporal.Instant, stepMin: number): Temporal.Instant {
  const step = stepMin * MS_PER_MIN;
  const ms = instant.epochMilliseconds;
  return Temporal.Instant.fromEpochMilliseconds(Math.ceil(ms / step) * step);
}

function byStart(a: Interval, b: Interval): number {
  return Temporal.Instant.compare(a.start, b.start) || Temporal.Instant.compare(a.end, b.end);
}

/** Sorted, non-overlapping intervals; touching or overlapping ones are joined. */
export function mergeIntervals(intervals: readonly Interval[]): Interval[] {
  const merged: Interval[] = [];
  for (const interval of [...intervals].sort(byStart)) {
    const last = merged.at(-1);
    if (last && !isBefore(last.end, interval.start)) {
      merged[merged.length - 1] = { start: last.start, end: maxInstant(last.end, interval.end) };
    } else {
      merged.push(interval);
    }
  }
  return merged;
}

/** The parts of `from` that no `busy` interval covers, sorted and merged. */
export function subtractIntervals(from: readonly Interval[], busy: readonly Interval[]): Interval[] {
  const taken = mergeIntervals(busy);
  const result: Interval[] = [];
  for (const interval of mergeIntervals(from)) {
    let start = interval.start;
    for (const b of taken) {
      if (!isBefore(start, interval.end)) break;
      if (!isBefore(start, b.end) || !isBefore(b.start, interval.end)) continue;
      if (isBefore(start, b.start)) result.push({ start, end: b.start });
      start = maxInstant(start, b.end);
    }
    if (isBefore(start, interval.end)) result.push({ start, end: interval.end });
  }
  return result;
}

/** Clips intervals to [start, end), dropping the empty ones. */
export function clipIntervals(intervals: readonly Interval[], start: Temporal.Instant, end: Temporal.Instant): Interval[] {
  return intervals
    .map((i) => ({ start: maxInstant(i.start, start), end: minInstant(i.end, end) }))
    .filter((i) => isBefore(i.start, i.end));
}

export function localDate(instant: Temporal.Instant, timeZone: string): Temporal.PlainDate {
  return instant.toZonedDateTimeISO(timeZone).toPlainDate();
}

/** The instant of a local date and time (DST gaps resolve forward, as Temporal's "compatible"). */
export function atLocal(date: Temporal.PlainDate, time: Temporal.PlainTime, timeZone: string): Temporal.Instant {
  return date.toZonedDateTime({ timeZone, plainTime: time }).toInstant();
}

/** Every local date from `first` to `last`, both included. */
export function datesBetween(first: Temporal.PlainDate, last: Temporal.PlainDate): Temporal.PlainDate[] {
  const dates: Temporal.PlainDate[] = [];
  for (let d = first; Temporal.PlainDate.compare(d, last) <= 0; d = d.add({ days: 1 })) dates.push(d);
  return dates;
}
