// Rule C4: the course, in three passes (exact, start of the name, close text). Under the threshold, or
// when two courses match equally well, there is no course: a wrong course is worse than no course.
import { type FreeWords, type Phrase, type PhraseMatch, phrasesAt, wordsOf } from "./phrases.ts";
import { SHORT_WORDS } from "./text.ts";
import type { CourseCandidate } from "./types.ts";

/** Minimum similarity (1 - Damerau-Levenshtein distance / longer length) for the close text pass. */
export const CLOSE_TEXT_THRESHOLD = 0.75;
const MIN_PREFIX_LENGTH = 3;
const MIN_CLOSE_LENGTH = 4;

type Match = PhraseMatch<CourseCandidate>;
/** A pass finds one course, finds none (undefined), or finds several equally good ones (ambiguous). */
type PassResult = Match | undefined | "ambiguous";

export function findCourse(words: FreeWords, courses: readonly CourseCandidate[]): Match | null {
  for (const pass of [exactPass, prefixPass, closeTextPass]) {
    const result = pass(words, courses);
    if (result === "ambiguous") return null;
    if (result !== undefined) return result;
  }
  return null;
}

/** Pass 1: an alias, the short name or the full name, as whole words. */
function exactPass(words: FreeWords, courses: readonly CourseCandidate[]): PassResult {
  const phrases: Phrase<CourseCandidate>[] = courses.flatMap((course) =>
    [course.name, course.shortName ?? "", ...course.aliases].map((text) => ({
      words: wordsOf(text),
      value: course,
    })),
  );
  for (let start = 0; start < words.length; start++) {
    const result = unique(phrasesAt(words, start, phrases, { plural: false }));
    if (result !== undefined) return result;
  }
  return undefined;
}

/** Pass 2: consecutive words (3 letters or more) that begin the name or the short name. */
function prefixPass(words: FreeWords, courses: readonly CourseCandidate[]): PassResult {
  const targets = courses.flatMap((course) =>
    [course.name, course.shortName ?? ""].map((text) => ({ text: wordsOf(text).join(" "), course })),
  );
  for (let start = 0; start < words.length; start++) {
    if (!significant(words[start])) continue;
    for (let end = lastFree(words, start); end > start; end--) {
      const typed = words.slice(start, end).join(" ");
      if (typed.length < MIN_PREFIX_LENGTH || !significant(words[end - 1])) continue;
      const found = targets
        .filter((target) => target.text.startsWith(typed))
        .map((target) => ({ value: target.course, start, end }));
      const result = unique(found);
      if (result !== undefined) return result;
    }
  }
  return undefined;
}

/** Pass 3: a word (4 letters or more) close to an alias, the short name or the first word of the name. */
function closeTextPass(words: FreeWords, courses: readonly CourseCandidate[]): PassResult {
  for (let start = 0; start < words.length; start++) {
    const word = words[start];
    if (!significant(word) || word.length < MIN_CLOSE_LENGTH) continue;
    let best = CLOSE_TEXT_THRESHOLD;
    let found: Match[] = [];
    for (const course of courses) {
      const score = Math.max(...closeTargets(course).map((target) => similarity(word, target)));
      if (score < best) continue;
      const match = { value: course, start, end: start + 1 };
      found = score === best ? [...found, match] : [match];
      best = score;
    }
    const result = unique(found);
    if (result !== undefined) return result;
  }
  return undefined;
}

function closeTargets(course: CourseCandidate): string[] {
  const firstWord = wordsOf(course.name).find((word) => !SHORT_WORDS.has(word));
  return [
    firstWord ?? "",
    ...[course.shortName ?? "", ...course.aliases].map((text) => wordsOf(text).join(" ")),
  ];
}

/** One course among the matches: the match, nothing, or "ambiguous" when several courses match. */
function unique(matches: readonly Match[]): PassResult {
  const ids = new Set(matches.map((match) => match.value.id));
  if (ids.size > 1) return "ambiguous";
  return matches[0];
}

/** A free word that can select a course: not a short French word, not a number. */
function significant(word: string | null | undefined): word is string {
  return word !== null && word !== undefined && !SHORT_WORDS.has(word) && !/^\d+$/.test(word);
}

/** End (exclusive) of the run of free words that starts at `start`. */
function lastFree(words: FreeWords, start: number): number {
  let end = start;
  while (end < words.length && words[end] !== null) end++;
  return end;
}

/** 1 - (optimal string alignment distance / longer length): 1 for equal words, 0 for unrelated ones. */
export function similarity(a: string, b: string): number {
  const longer = Math.max(a.length, b.length);
  return longer === 0 ? 1 : 1 - editDistance(a, b) / longer;
}

/** Damerau-Levenshtein distance (optimal string alignment): insert, delete, replace, swap two neighbours. */
function editDistance(a: string, b: string): number {
  const rows: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  const at = (i: number, j: number) => rows[i]?.[j] ?? 0;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let best = Math.min(at(i - 1, j) + 1, at(i, j - 1) + 1, at(i - 1, j - 1) + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
        best = Math.min(best, at(i - 2, j - 2) + 1);
      const row = rows[i];
      if (row !== undefined) row[j] = best;
    }
  }
  return at(a.length, b.length);
}
