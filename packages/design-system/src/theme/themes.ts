import * as stylex from "@stylexjs/stylex";
import { dark, darkShadow, light, lightShadow } from "../palette.stylex.ts";
import { color, shadow } from "../tokens.stylex.ts";

// Forced themes, applied by ThemeProvider. Without them the token defaults follow the system
// color scheme. Write every key: passing a whole consts object to createTheme emits no CSS.

export const lightTheme = stylex.createTheme(color, {
  bg: light.bg,
  bgSubtle: light.bgSubtle,
  surface: light.surface,
  border: light.border,
  borderStrong: light.borderStrong,
  text: light.text,
  textMuted: light.textMuted,
  accent: light.accent,
  accentHover: light.accentHover,
  accentSubtle: light.accentSubtle,
  accentText: light.accentText,
  danger: light.danger,
  dangerSubtle: light.dangerSubtle,
  dangerText: light.dangerText,
  success: light.success,
  successText: light.successText,
  warning: light.warning,
  warningText: light.warningText,
  focusRing: light.focusRing,
  overlay: light.overlay,
});

export const darkTheme = stylex.createTheme(color, {
  bg: dark.bg,
  bgSubtle: dark.bgSubtle,
  surface: dark.surface,
  border: dark.border,
  borderStrong: dark.borderStrong,
  text: dark.text,
  textMuted: dark.textMuted,
  accent: dark.accent,
  accentHover: dark.accentHover,
  accentSubtle: dark.accentSubtle,
  accentText: dark.accentText,
  danger: dark.danger,
  dangerSubtle: dark.dangerSubtle,
  dangerText: dark.dangerText,
  success: dark.success,
  successText: dark.successText,
  warning: dark.warning,
  warningText: dark.warningText,
  focusRing: dark.focusRing,
  overlay: dark.overlay,
});

export const lightShadowTheme = stylex.createTheme(shadow, {
  none: "none",
  sm: lightShadow.sm,
  md: lightShadow.md,
  lg: lightShadow.lg,
});

export const darkShadowTheme = stylex.createTheme(shadow, {
  none: "none",
  sm: darkShadow.sm,
  md: darkShadow.md,
  lg: darkShadow.lg,
});
