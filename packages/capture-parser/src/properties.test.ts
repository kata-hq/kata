// Property tests (spec §10.8): lines generated at random from date, type, course and filler words,
// typos, accents and punctuation; the rules must hold for every one. The generator is seeded, so a
// failure is reproducible: the message gives the seed, the run and the line.
import { describe, expect, test } from "bun:test";
import { parseCapture } from "./parse.ts";
import { COURSES, context, TASK_TYPES } from "./testing/context.ts";
import type { Capture, CaptureContext } from "./types.ts";

const SEED = 20261014;
const RUNS = 2000;

const DATE_WORDS = [
  "demain",
  "aujourd'hui",
  "après-demain",
  "apres demain",
  "vendredi",
  "lundi prochain",
  "le 12",
  "le 31",
  "15/11",
  "12/10/2026",
  "3/1/27",
  "semaine prochaine",
  "dans 3 jours",
  "dans 2 semaines",
  "pour demain",
  "avant jeudi",
  "14h",
  "à 8h30",
  "18:45",
  "31/02",
  "25h",
  "le 32",
];
const TYPE_WORDS = [
  ...TASK_TYPES.flatMap((type) => type.aliases),
  "Exposé",
  "RÉVISER",
  "compte-rendu",
  "lectures",
];
const COURSE_WORDS = [
  ...COURSES.flatMap((course) => [course.name, course.shortName ?? "", ...course.aliases]),
  "statis",
  "manag",
  "comtpa",
  "angalis",
  "marketting",
];
const FILLER_WORDS = [
  "chap",
  "3",
  "exercices",
  "de",
  "la",
  "le",
  "pour",
  "rapport",
  "Les Misérables",
  "œuvre",
  "-",
  ",",
  ":",
  "« citation »",
  "(groupe)",
  "QCM",
  "TD",
  "ÉCO",
  "  ",
];
const LETTERS = "abcdefghijklmnopqrstuvwxyzéèêàçôûœ";
const REFERENCES = [
  "2026-10-14T07:00:00Z",
  "2026-10-24T23:30:00Z",
  "2026-12-31T22:59:00Z",
  "2027-03-28T00:30:00Z",
];
const TIME_ZONES = ["Europe/Paris", "America/Montreal", "Asia/Tokyo"];

/** mulberry32: a small seeded pseudo-random generator, so every run sees the same lines. */
function random(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Sample = { readonly line: string; readonly context: CaptureContext };

function sample(next: () => number): Sample {
  const pick = <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)] as T;
  const pools = [DATE_WORDS, TYPE_WORDS, COURSE_WORDS, FILLER_WORDS];
  const words: string[] = [];
  const count = 1 + Math.floor(next() * 7);
  for (let i = 0; i < count; i++) {
    if (next() < 0.15) {
      const length = 1 + Math.floor(next() * 8);
      words.push(Array.from({ length }, () => pick([...LETTERS])).join(""));
    } else {
      words.push(pick(pick(pools)));
    }
  }
  return {
    line: words.join(" "),
    context: context({ reference: pick(REFERENCES), timeZone: pick(TIME_ZONES) }),
  };
}

/** Runs `check` on RUNS generated lines; a failure names the seed, the run and the line. */
function forAll(check: (sample: Sample, capture: Capture) => void): void {
  const next = random(SEED);
  for (let run = 0; run < RUNS; run++) {
    const current = sample(next);
    try {
      const result = parseCapture(current.line, current.context);
      if (!result.ok) throw new Error(`parseCapture returned Err: ${result.error.message}`);
      check(current, result.value);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`seed ${SEED}, run ${run}, line ${JSON.stringify(current.line)}: ${message}`);
    }
  }
}

/** What C1 says must not change with case and accents: the course, the type and the deadline. */
function reading(capture: Capture) {
  return {
    course: capture.course?.id ?? null,
    type: capture.taskType?.key ?? null,
    deadline: capture.deadline === null ? null : { ...capture.deadline, matched: undefined },
  };
}

const withoutAccents = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "");

describe("properties", () => {
  test("parseCapture never throws and always returns Ok for a valid context", () => {
    forAll(() => {});
  });

  test("upper case and missing accents do not change the course, type or deadline (C1)", () => {
    forAll(({ line, context }, capture) => {
      for (const variant of [line.toUpperCase(), withoutAccents(line)]) {
        const other = parseCapture(variant, context);
        if (!other.ok) throw new Error("variant returned Err");
        expect(reading(other.value)).toEqual(reading(capture));
      }
    });
  });

  test("course and type come from the context; the title is input words, in order, never empty", () => {
    const courseIds = new Set(COURSES.map((course) => course.id));
    const typeKeys = new Set(TASK_TYPES.map((type) => type.key));
    forAll(({ line }, capture) => {
      if (capture.course !== null) expect(courseIds.has(capture.course.id)).toBe(true);
      if (capture.taskType !== null) expect(typeKeys.has(capture.taskType.key)).toBe(true);
      if (/[\p{L}\p{N}]/u.test(line)) expect(capture.title).not.toBe("");
      let from = 0;
      for (const word of capture.title.split(/\s+/).filter((w) => w !== "")) {
        const at = line.indexOf(word, from);
        expect(at).toBeGreaterThanOrEqual(0);
        from = at + word.length;
      }
    });
  });

  test("a relative date is never before the reference day; the instant is the date at its time (K-R7)", () => {
    forAll(({ context }, capture) => {
      const { deadline } = capture;
      if (deadline === null) return;
      const today = Temporal.Instant.from(context.reference)
        .toZonedDateTimeISO(context.timeZone)
        .toPlainDate();
      const date = Temporal.PlainDate.from(deadline.date);
      if (!/\d[/.-]\d{1,2}[/.-]\d/.test(deadline.matched)) {
        expect(Temporal.PlainDate.compare(date, today)).toBeGreaterThanOrEqual(0);
      }
      const expected = date
        .toZonedDateTime({ timeZone: context.timeZone, plainTime: deadline.time ?? "23:59" })
        .toInstant()
        .toString();
      expect(deadline.instant).toBe(expected);
    });
  });
});
