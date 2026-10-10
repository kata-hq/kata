import * as stylex from "@stylexjs/stylex";
import { color, shadow } from "../tokens.stylex.ts";

// Forced themes. Without a theme, the token defaults follow the system color scheme.
// Keep these values in sync with the light / dark branches in tokens.stylex.ts.

export const lightTheme = stylex.createTheme(color, {
  bg: "#ffffff",
  bgSubtle: "#f5f6f8",
  surface: "#ffffff",
  border: "#dde1e7",
  borderStrong: "#c3c9d3",
  text: "#15171c",
  textMuted: "#5b6270",
  accent: "#3358d4",
  accentHover: "#2a49b3",
  accentSubtle: "#eef2ff",
  accentText: "#ffffff",
  danger: "#c4362f",
  dangerSubtle: "#fdecea",
  dangerText: "#ffffff",
  success: "#1f7a4d",
  successText: "#ffffff",
  warning: "#a15c00",
  warningText: "#ffffff",
  focusRing: "#3358d4",
  overlay: "rgba(15, 18, 25, 0.5)",
});

export const darkTheme = stylex.createTheme(color, {
  bg: "#101217",
  bgSubtle: "#171a21",
  surface: "#1c2029",
  border: "#2c313b",
  borderStrong: "#3d4451",
  text: "#ecedf1",
  textMuted: "#9aa1ad",
  accent: "#7c9bff",
  accentHover: "#96afff",
  accentSubtle: "#1b2340",
  accentText: "#0b1020",
  danger: "#ff8078",
  dangerSubtle: "#3a1513",
  dangerText: "#2a0b09",
  success: "#5fd39a",
  successText: "#06210f",
  warning: "#f5b453",
  warningText: "#2a1800",
  focusRing: "#7c9bff",
  overlay: "rgba(0, 0, 0, 0.6)",
});

export const lightShadowTheme = stylex.createTheme(shadow, {
  none: "none",
  sm: "0 1px 2px rgba(15, 18, 25, 0.08)",
  md: "0 4px 16px rgba(15, 18, 25, 0.12)",
  lg: "0 12px 32px rgba(15, 18, 25, 0.16)",
});

export const darkShadowTheme = stylex.createTheme(shadow, {
  none: "none",
  sm: "0 1px 2px rgba(0, 0, 0, 0.4)",
  md: "0 4px 16px rgba(0, 0, 0, 0.5)",
  lg: "0 12px 32px rgba(0, 0, 0, 0.6)",
});
