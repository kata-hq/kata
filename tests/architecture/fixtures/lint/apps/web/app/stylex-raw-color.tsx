// Breaks: stylex-tokens-only.grit (hex, rgb(), hsl(), named color)
import * as stylex from "@stylexjs/stylex";

export const styles = stylex.create({
  hex: { color: "#ff0000" },
  rgb: { backgroundColor: "rgb(0 0 0 / 50%)" },
  hsl: { borderColor: "hsl(210, 50%, 40%)" },
  named: { outlineColor: "rebeccapurple" },
});
