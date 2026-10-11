// Breaks: stylex-tokens-only.grit (px, rem, em, bare number size)
import * as stylex from "@stylexjs/stylex";

export const styles = stylex.create({
  px: { padding: "12px" },
  rem: { gap: "1.5rem" },
  em: { marginTop: "2em" },
  number: { width: 240 },
});
