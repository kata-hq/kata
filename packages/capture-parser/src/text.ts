// Rule C1: matching ignores case and accents. The tokens keep their original text for the title (C6).

/** Lower-case, without accents or ligatures, typographic apostrophes made plain. */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/[’‘`´]/g, "'");
}

export type Token = {
  /** The word as typed. */
  readonly text: string;
  /** The word normalised (C1), without surrounding quotes, brackets or a final full stop. */
  readonly norm: string;
  /** Position of the word in the input. */
  readonly index: number;
};

const WORD = /[^\s,;!?]+/g;
const EDGE_PUNCTUATION = /^["'«(“[]+|["'»)”\].:]+$/g;

/** The words of the input, split on spaces and , ; ! ? (never empty). */
export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  for (const match of input.matchAll(WORD)) {
    const norm = normalize(match[0]).replace(EDGE_PUNCTUATION, "");
    if (norm === "") continue;
    tokens.push({ text: match[0], norm, index: match.index });
  }
  return tokens;
}
