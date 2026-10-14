// Matching of known phrases (task type aliases, course names) against the input's free words.
import { tokenize } from "./text.ts";

export type Phrase<T> = { readonly words: readonly string[]; readonly value: T };

export type PhraseMatch<T> = {
  readonly value: T;
  /** Token range [start, end) of the match. */
  readonly start: number;
  readonly end: number;
};

/** The normalised words of a phrase written in the data ("Compte rendu" → ["compte", "rendu"]). */
export function wordsOf(text: string): string[] {
  return tokenize(text).map((token) => token.norm);
}

/**
 * The first position of `words` where a phrase matches, with the longest phrase at that position.
 * `null` words are already used (by the date) and never match. A phrase of several words also matches
 * them joined by hyphens ("compte-rendu"). With `plural`, a one-word phrase also matches the word followed by "s".
 */
export function findPhrase<T>(
  words: readonly (string | null)[],
  phrases: readonly Phrase<T>[],
  options: { readonly plural: boolean },
): PhraseMatch<T> | null {
  const longestFirst = phrases
    .filter((phrase) => phrase.words.length > 0)
    .flatMap((phrase) =>
      phrase.words.length > 1 ? [phrase, { words: [phrase.words.join("-")], value: phrase.value }] : [phrase],
    )
    .toSorted((a, b) => b.words.length - a.words.length);
  for (let start = 0; start < words.length; start++) {
    for (const phrase of longestFirst) {
      if (matchesAt(words, start, phrase.words, options.plural)) {
        return { value: phrase.value, start, end: start + phrase.words.length };
      }
    }
  }
  return null;
}

function matchesAt(
  words: readonly (string | null)[],
  start: number,
  phrase: readonly string[],
  plural: boolean,
): boolean {
  return phrase.every((expected, offset) => {
    const word = words[start + offset];
    if (word === null || word === undefined) return false;
    return word === expected || (plural && phrase.length === 1 && word === `${expected}s`);
  });
}
