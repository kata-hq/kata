// Rule C6: the words that are neither a date, nor a type, nor a course form the title.
import type { FreeWords } from "./phrases.ts";
import { SHORT_WORDS, type Token } from "./text.ts";

const HAS_TEXT = /[\p{L}\p{N}]/u;

/**
 * The free words as typed, in order. A group of consecutive free words made only of short words or
 * punctuation is dropped (the "de" left in "DM de compta"). When nothing is left, the line without its
 * date words; when that is empty too, the whole line.
 */
export function buildTitle(
  input: string,
  tokens: readonly Token[],
  free: FreeWords,
  date: { readonly start: number; readonly end: number } | null,
): string {
  const kept = freeGroups(tokens, free).filter((group) =>
    group.some((token) => HAS_TEXT.test(token.text) && !SHORT_WORDS.has(token.norm)),
  );
  const title = join(kept.flat());
  if (title !== "") return title;
  const withoutDate = join(tokens.filter((_, i) => date === null || i < date.start || i >= date.end));
  return withoutDate !== "" ? withoutDate : input.trim();
}

/** The runs of consecutive free tokens. */
function freeGroups(tokens: readonly Token[], free: FreeWords): Token[][] {
  const groups: Token[][] = [];
  let current: Token[] = [];
  tokens.forEach((token, i) => {
    if (free[i] !== null) {
      current.push(token);
      return;
    }
    if (current.length > 0) groups.push(current);
    current = [];
  });
  if (current.length > 0) groups.push(current);
  return groups;
}

/** The tokens as typed, without punctuation-only tokens at either end. */
function join(tokens: readonly Token[]): string {
  const first = tokens.findIndex((token) => HAS_TEXT.test(token.text));
  const last = tokens.findLastIndex((token) => HAS_TEXT.test(token.text));
  if (first === -1) return "";
  return tokens
    .slice(first, last + 1)
    .map((token) => token.text)
    .join(" ");
}
