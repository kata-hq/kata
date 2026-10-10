import * as stylex from "@stylexjs/stylex";

// Design tokens. Every component styles itself only from these vars.
// StyleX only recognizes these vars when the import path ends in `.stylex` / `.stylex.ts`,
// so apps import them from "@kata/design-system/tokens.stylex".

const DARK = "@media (prefers-color-scheme: dark)";

// Defaults follow the system color scheme. `lightTheme` / `darkTheme` (theme/themes.ts) force one.
// Keep the light and dark values here in sync with theme/themes.ts.
export const color = stylex.defineVars({
  bg: { default: "#ffffff", [DARK]: "#101217" },
  bgSubtle: { default: "#f5f6f8", [DARK]: "#171a21" },
  surface: { default: "#ffffff", [DARK]: "#1c2029" },
  border: { default: "#dde1e7", [DARK]: "#2c313b" },
  borderStrong: { default: "#c3c9d3", [DARK]: "#3d4451" },
  text: { default: "#15171c", [DARK]: "#ecedf1" },
  textMuted: { default: "#5b6270", [DARK]: "#9aa1ad" },
  accent: { default: "#3358d4", [DARK]: "#7c9bff" },
  accentHover: { default: "#2a49b3", [DARK]: "#96afff" },
  accentSubtle: { default: "#eef2ff", [DARK]: "#1b2340" },
  accentText: { default: "#ffffff", [DARK]: "#0b1020" },
  danger: { default: "#c4362f", [DARK]: "#ff8078" },
  dangerSubtle: { default: "#fdecea", [DARK]: "#3a1513" },
  dangerText: { default: "#ffffff", [DARK]: "#2a0b09" },
  success: { default: "#1f7a4d", [DARK]: "#5fd39a" },
  successText: { default: "#ffffff", [DARK]: "#06210f" },
  warning: { default: "#a15c00", [DARK]: "#f5b453" },
  warningText: { default: "#ffffff", [DARK]: "#2a1800" },
  focusRing: { default: "#3358d4", [DARK]: "#7c9bff" },
  overlay: { default: "rgba(15, 18, 25, 0.5)", [DARK]: "rgba(0, 0, 0, 0.6)" },
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
  sm: { default: "0 1px 2px rgba(15, 18, 25, 0.08)", [DARK]: "0 1px 2px rgba(0, 0, 0, 0.4)" },
  md: { default: "0 4px 16px rgba(15, 18, 25, 0.12)", [DARK]: "0 4px 16px rgba(0, 0, 0, 0.5)" },
  lg: { default: "0 12px 32px rgba(15, 18, 25, 0.16)", [DARK]: "0 12px 32px rgba(0, 0, 0, 0.6)" },
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
