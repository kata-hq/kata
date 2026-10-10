import * as stylex from "@stylexjs/stylex";
import { font } from "../tokens.stylex.ts";
import type { CommonProps, Tone } from "../types.ts";
import { tones } from "./tone.ts";

export type TextSize = "xs" | "sm" | "md" | "lg" | "xl";
export type TextWeight = "regular" | "medium" | "semibold" | "bold";
export type TextElement = "span" | "p" | "div" | "strong" | "em" | "small" | "code";

export type TextProps = CommonProps & {
  /** Default "span". */
  as?: TextElement;
  /** Default "md". */
  size?: TextSize;
  /** Default "regular". */
  weight?: TextWeight;
  /** Default "default". */
  tone?: Tone;
  align?: "start" | "center" | "end";
  /** Cuts the text to one line with an ellipsis. */
  truncate?: boolean;
};

const sizes = stylex.create({
  xs: { fontSize: font.sizeXs, lineHeight: font.lineHeightNormal },
  sm: { fontSize: font.sizeSm, lineHeight: font.lineHeightNormal },
  md: { fontSize: font.sizeMd, lineHeight: font.lineHeightNormal },
  lg: { fontSize: font.sizeLg, lineHeight: font.lineHeightNormal },
  xl: { fontSize: font.sizeXl, lineHeight: font.lineHeightTight },
});

const weights = stylex.create({
  regular: { fontWeight: font.weightRegular },
  medium: { fontWeight: font.weightMedium },
  semibold: { fontWeight: font.weightSemibold },
  bold: { fontWeight: font.weightBold },
});

const aligns = stylex.create({
  start: { textAlign: "start" },
  center: { textAlign: "center" },
  end: { textAlign: "end" },
});

const styles = stylex.create({
  base: { margin: 0, fontFamily: font.familySans },
  code: { fontFamily: font.familyMono },
  truncate: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
});

/** Body text with a size, weight and tone from tokens. */
export const Text = ({
  as: Element = "span",
  size = "md",
  weight = "regular",
  tone = "default",
  align,
  truncate = false,
  ...rest
}: TextProps) => (
  <Element
    {...rest}
    {...stylex.props(
      styles.base,
      Element === "code" && styles.code,
      sizes[size],
      weights[weight],
      tones[tone],
      align !== undefined && aligns[align],
      truncate && styles.truncate,
    )}
  />
);
