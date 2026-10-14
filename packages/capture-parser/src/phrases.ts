// Matching of known phrases (task type aliases, course names) against the input's free words.
import { tokenize } from "./text.ts";

export type Phrase<T> = { readonly words: readonly string[]; readonly value: T };

export type PhraseMatch<T> = {
  readonly value: T;
  /** Token range [start, end) of the match. */
  readonly start: number;
  readonly end: number;
};

/** The input's words, normalised; `null` for a word already used (by the date, the type…). */
export type FreeWords = readonly (string | null)[];

/** The normalised words of a phrase written in the data ("Compte rendu" → ["compte", "rendu"]). */
export function wordsOf(text: string): string[] {
  return tokenize(text).map((token) => token.norm);
}

/**
 * The first position of `words` where a phrase matches, with the longest phrase at that position.
 * Used words never match. A phrase of several words also matches them joined by hyphens
 * ("compte-rendu"). With `plural`, a one-word phrase also matches the word followed by "s".
 */
export function findPhrase<T>(
  words: FreeWords,
  phrases: readonly Phrase<T>[],
  options: { readonly plural: boolean },
): PhraseMatch<T> | null {
  for (let start = 0; start < words.length; start++) {
    const [first] = phrasesAt(words, start, phrases, options);
    if (first !== undefined) return first;
  }
  return null;
}

/** Every phrase of the longest length that matches at `start` (several when phrases share words). */
export function phrasesAt<T>(
  words: FreeWords,
  start: number,
  phrases: readonly Phrase<T>[],
  options: { readonly plural: boolean },
): PhraseMatch<T>[] {
  const matches = phrases
    .filter((phrase) => phrase.words.length > 0)
    .flatMap((phrase) =>
      phrase.words.length > 1 ? [phrase, { words: [phrase.words.join("-")], value: phrase.value }] : [phrase],
    )
    .filter((phrase) => matchesAt(words, start, phrase.words, options.plural))
    .map((phrase) => ({ value: phrase.value, start, end: start + phrase.words.length }));
  const longest = Math.max(0, ...matches.map((match) => match.end));
  return matches.filter((match) => match.end === longest);
}

function matchesAt(words: FreeWords, start: number, phrase: readonly string[], plural: boolean): boolean {
  return phrase.every((expected, offset) => {
    const word = words[start + offset];
    if (word === null || word === undefined) return false;
    return word === expected || (plural && phrase.length === 1 && word === `${expected}s`);
  });
}
