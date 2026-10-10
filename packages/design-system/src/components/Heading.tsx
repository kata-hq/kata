import * as stylex from "@stylexjs/stylex";
import { font } from "../tokens.stylex.ts";
import type { CommonProps, Tone } from "../types.ts";
import { tones } from "./tone.ts";

export type HeadingLevel = 1 | 2 | 3 | 4;

export type HeadingProps = CommonProps & {
  /** Renders `h1`–`h4` with the matching size. */
  level: HeadingLevel;
  /** Default "default". */
  tone?: Tone;
};

const levels = stylex.create({
  1: { fontSize: font.sizeXxxl },
  2: { fontSize: font.sizeXxl },
  3: { fontSize: font.sizeXl },
  4: { fontSize: font.sizeLg },
});

const styles = stylex.create({
  base: {
    margin: 0,
    fontFamily: font.familySans,
    fontWeight: font.weightSemibold,
    lineHeight: font.lineHeightTight,
  },
});

const elements = { 1: "h1", 2: "h2", 3: "h3", 4: "h4" } as const;

/** Section heading. The level sets both the element and the size. */
export const Heading = ({ level, tone = "default", ...rest }: HeadingProps) => {
  const Element = elements[level];
  return <Element {...rest} {...stylex.props(styles.base, levels[level], tones[tone])} />;
};
