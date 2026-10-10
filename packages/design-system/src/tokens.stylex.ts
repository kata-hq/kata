import * as stylex from "@stylexjs/stylex";
import { dark, darkShadow, light, lightShadow } from "./palette.stylex.ts";

// Design tokens. Every component styles itself only from these vars.
// StyleX only recognizes these vars when the import path ends in `.stylex` / `.stylex.ts`,
// so apps import them from "@kata/design-system/tokens.stylex".

const DARK = "@media (prefers-color-scheme: dark)";

// Defaults follow the system color scheme. ThemeProvider forces light or dark (theme/themes.ts).
export const color = stylex.defineVars({
  bg: { default: light.bg, [DARK]: dark.bg },
  bgSubtle: { default: light.bgSubtle, [DARK]: dark.bgSubtle },
  surface: { default: light.surface, [DARK]: dark.surface },
  border: { default: light.border, [DARK]: dark.border },
  borderStrong: { default: light.borderStrong, [DARK]: dark.borderStrong },
  text: { default: light.text, [DARK]: dark.text },
  textMuted: { default: light.textMuted, [DARK]: dark.textMuted },
  accent: { default: light.accent, [DARK]: dark.accent },
  accentHover: { default: light.accentHover, [DARK]: dark.accentHover },
  accentSubtle: { default: light.accentSubtle, [DARK]: dark.accentSubtle },
  accentText: { default: light.accentText, [DARK]: dark.accentText },
  danger: { default: light.danger, [DARK]: dark.danger },
  dangerSubtle: { default: light.dangerSubtle, [DARK]: dark.dangerSubtle },
  dangerText: { default: light.dangerText, [DARK]: dark.dangerText },
  success: { default: light.success, [DARK]: dark.success },
  successText: { default: light.successText, [DARK]: dark.successText },
  warning: { default: light.warning, [DARK]: dark.warning },
  warningText: { default: light.warningText, [DARK]: dark.warningText },
  focusRing: { default: light.focusRing, [DARK]: dark.focusRing },
  overlay: { default: light.overlay, [DARK]: dark.overlay },
});

export const space = stylex.defineVars({
  none: "0px",
  xxs: "2px",
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "24px",
  xxl: "32px",
  xxxl: "48px",
});

export const radius = stylex.defineVars({
  none: "0px",
  sm: "4px",
  md: "8px",
  lg: "12px",
  full: "9999px",
});

export const font = stylex.defineVars({
  familySans:
    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  familyMono: "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
  sizeXs: "0.75rem",
  sizeSm: "0.875rem",
  sizeMd: "1rem",
  sizeLg: "1.125rem",
  sizeXl: "1.25rem",
  sizeXxl: "1.5rem",
  sizeXxxl: "1.875rem",
  weightRegular: "400",
  weightMedium: "500",
  weightSemibold: "600",
  weightBold: "700",
  lineHeightTight: "1.25",
  lineHeightNormal: "1.5",
  lineHeightRelaxed: "1.75",
});

export const shadow = stylex.defineVars({
  none: "none",
  sm: { default: lightShadow.sm, [DARK]: darkShadow.sm },
  md: { default: lightShadow.md, [DARK]: darkShadow.md },
  lg: { default: lightShadow.lg, [DARK]: darkShadow.lg },
});

export const zIndex = stylex.defineVars({
  base: "0",
  dropdown: "1000",
  sticky: "1100",
  overlay: "1200",
  modal: "1300",
  popover: "1400",
  toast: "1500",
  tooltip: "1600",
});

export const motion = stylex.defineVars({
  durationFast: "100ms",
  durationNormal: "200ms",
  durationSlow: "300ms",
  easingStandard: "cubic-bezier(0.2, 0, 0, 1)",
  easingEnter: "cubic-bezier(0, 0, 0, 1)",
  easingExit: "cubic-bezier(0.3, 0, 1, 1)",
});
