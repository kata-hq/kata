// Rule C2: relative and absolute dates with an optional time, read from the normalised tokens.
// Every date is computed from the reference instant in the person's time zone (no clock, rule A6).
import type { Token } from "./text.ts";

export type DateMatch = {
  readonly date: Temporal.PlainDate;
  readonly time: Temporal.PlainTime | null;
  /** Token range [start, end) that holds the date, its time and its connectors. */
  readonly start: number;
  readonly end: number;
};

/** A date read at a token: the date and the number of tokens it spans. */
type DateAt = { readonly date: Temporal.PlainDate; readonly length: number };

const WEEKDAYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
const TODAY = new Set(["aujourd'hui", "aujourdhui", "auj"]);
const NEXT = new Set(["prochain", "prochaine"]);
/** Words that belong to the date that follows them: "pour demain", "avant vendredi", "la semaine prochaine". */
const CONNECTORS = new Set(["pour", "avant", "d'ici", "ce", "le", "la"]);
const AT = new Set(["a", "vers"]);
const NUMBER_WORDS: Readonly<Record<string, number>> = {
  un: 1,
  une: 1,
  deux: 2,
  trois: 3,
  quatre: 4,
  cinq: 5,
};
const DAY_UNITS = new Set(["jour", "jours", "j"]);
const WEEK_UNITS = new Set(["semaine", "semaines", "sem"]);
const SLASH_DATE = /^(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{4}|\d{2}))?$/;
const TIME = /^(\d{1,2})(?:h(\d{2})?|:(\d{2}))$/;
const DAY_NUMBER = /^\d{1,2}$/;

/** The first date of the tokens (with its time, if any), or a time alone, or null. */
export function findDate(tokens: readonly Token[], now: Temporal.ZonedDateTime): DateMatch | null {
  const words = tokens.map((token) => token.norm);
  const today = now.toPlainDate();
  for (let i = 0; i < words.length; i++) {
    const found = dateAt(words, i, today);
    if (found === null) continue;
    let start = i;
    while (start > 0 && CONNECTORS.has(words[start - 1] ?? "")) start--;
    const end = i + found.length;
    const after = timeAt(words, end);
    if (after !== null) return { date: found.date, time: after.time, start, end: end + after.length };
    const before = timeBefore(words, start);
    if (before !== null) return { date: found.date, time: before.time, start: start - before.length, end };
    return { date: found.date, time: null, start, end };
  }
  for (let i = 0; i < words.length; i++) {
    const found = timeAt(words, i);
    if (found === null) continue;
    const todayAt = today.toZonedDateTime({ timeZone: now.timeZoneId, plainTime: found.time });
    const date = Temporal.ZonedDateTime.compare(todayAt, now) > 0 ? today : today.add({ days: 1 });
    return { date, time: found.time, start: i, end: i + found.length };
  }
  return null;
}

function dateAt(words: readonly string[], i: number, today: Temporal.PlainDate): DateAt | null {
  const word = words[i] ?? "";
  const next = words[i + 1] ?? "";
  if (TODAY.has(word)) return { date: today, length: 1 };
  if (word === "demain") return { date: today.add({ days: 1 }), length: 1 };
  if (word === "apres-demain") return { date: today.add({ days: 2 }), length: 1 };
  if (word === "apres" && next === "demain") return { date: today.add({ days: 2 }), length: 2 };
  const weekday = WEEKDAYS.indexOf(word) + 1;
  if (weekday > 0) {
    const days = ((weekday - today.dayOfWeek + 6) % 7) + 1;
    return { date: today.add({ days }), length: NEXT.has(next) ? 2 : 1 };
  }
  if (WEEK_UNITS.has(word) && NEXT.has(next)) {
    return { date: today.add({ days: 8 - today.dayOfWeek }), length: 2 };
  }
  if (word === "dans") return inDays(words, i, today);
  if (word === "le") {
    const day = dayOfMonth(next, today);
    if (day !== null) return { date: day, length: 2 };
    const slash = slashDate(next, today);
    return slash === null ? null : { date: slash, length: 2 };
  }
  const slash = slashDate(word, today);
  return slash === null ? null : { date: slash, length: 1 };
}

/** "dans 3 jours", "dans un jour", "dans 2 semaines". */
function inDays(words: readonly string[], i: number, today: Temporal.PlainDate): DateAt | null {
  const count = words[i + 1] ?? "";
  const n = /^\d{1,3}$/.test(count) ? Number(count) : NUMBER_WORDS[count];
  if (n === undefined) return null;
  const unit = words[i + 2] ?? "";
  if (DAY_UNITS.has(unit)) return { date: today.add({ days: n }), length: 3 };
  if (WEEK_UNITS.has(unit)) return { date: today.add({ weeks: n }), length: 3 };
  return null;
}

/** "le 12": that day of this month if not past, otherwise of the next month that has it. */
function dayOfMonth(word: string, today: Temporal.PlainDate): Temporal.PlainDate | null {
  if (!DAY_NUMBER.test(word)) return null;
  const day = Number(word);
  if (day < 1 || day > 31) return null;
  for (let month = today.toPlainYearMonth(); ; month = month.add({ months: 1 })) {
    if (day > month.daysInMonth) continue;
    const date = month.toPlainDate({ day });
    if (Temporal.PlainDate.compare(date, today) >= 0) return date;
  }
}

/** "12/10": this year if not past, otherwise next year. "12/10/2026", "12/10/26" as written. */
function slashDate(word: string, today: Temporal.PlainDate): Temporal.PlainDate | null {
  const match = SLASH_DATE.exec(word);
  if (match === null) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const yearText = match[3];
  if (yearText !== undefined) {
    const year = yearText.length === 2 ? 2000 + Number(yearText) : Number(yearText);
    return validDate(year, month, day);
  }
  const thisYear = validDate(today.year, month, day);
  if (thisYear !== null && Temporal.PlainDate.compare(thisYear, today) >= 0) return thisYear;
  return validDate(today.year + 1, month, day);
}

function validDate(year: number, month: number, day: number): Temporal.PlainDate | null {
  try {
    return Temporal.PlainDate.from({ year, month, day }, { overflow: "reject" });
  } catch {
    return null;
  }
}

type TimeAt = { readonly time: Temporal.PlainTime; readonly length: number };

/** "14h", "14h30", "14:30", optionally after "à" / "vers", starting at token i. */
function timeAt(words: readonly string[], i: number): TimeAt | null {
  const at = AT.has(words[i] ?? "") ? 1 : 0;
  const match = TIME.exec(words[i + at] ?? "");
  if (match === null) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2] ?? match[3] ?? 0);
  if (hour > 23 || minute > 59) return null;
  return { time: new Temporal.PlainTime(hour, minute), length: at + 1 };
}

/** A time that ends right before token `end` ("14h demain", "à 14h demain"). */
function timeBefore(words: readonly string[], end: number): TimeAt | null {
  for (const length of [2, 1]) {
    const found = end - length >= 0 ? timeAt(words, end - length) : null;
    if (found?.length === length) return found;
  }
  return null;
}
