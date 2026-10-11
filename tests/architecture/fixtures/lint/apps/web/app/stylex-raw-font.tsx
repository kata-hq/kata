// Breaks: stylex-tokens-only.grit (font family and weight literals)
import * as stylex from "@stylexjs/stylex";

export const styles = stylex.create({
  family: { fontFamily: "Inter, sans-serif" },
  weight: { fontWeight: 700 },
});
