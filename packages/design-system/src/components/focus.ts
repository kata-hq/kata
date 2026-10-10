import * as stylex from "@stylexjs/stylex";
import { color } from "../tokens.stylex.ts";

/** Keyboard focus ring shared by every interactive component. */
export const focus = stylex.create({
  ring: {
    outlineColor: color.focusRing,
    outlineOffset: "2px",
    outlineStyle: { default: "none", ":focus-visible": "solid" },
    outlineWidth: "2px",
  },
});
