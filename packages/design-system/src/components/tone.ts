import * as stylex from "@stylexjs/stylex";
import { color } from "../tokens.stylex.ts";

/** Text color per `Tone`. Shared by Text, Heading and Icon. */
export const tones = stylex.create({
  default: { color: color.text },
  muted: { color: color.textMuted },
  accent: { color: color.accent },
  danger: { color: color.danger },
  success: { color: color.success },
  warning: { color: color.warning },
});
