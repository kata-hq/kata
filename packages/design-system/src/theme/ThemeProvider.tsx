import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";
import { color, font } from "../tokens.stylex.ts";
import { darkShadowTheme, darkTheme, lightShadowTheme, lightTheme } from "./themes.ts";

export type ThemeMode = "light" | "dark" | "system";

export type ThemeProviderProps = {
  /** "system" (default) follows `prefers-color-scheme`; "light" / "dark" force a theme. */
  theme?: ThemeMode;
  children?: ReactNode;
};

const styles = stylex.create({
  root: {
    backgroundColor: color.bg,
    color: color.text,
    fontFamily: font.familySans,
    fontSize: font.sizeMd,
    lineHeight: font.lineHeightNormal,
    minHeight: "100%",
  },
  system: { colorScheme: "light dark" },
  light: { colorScheme: "light" },
  dark: { colorScheme: "dark" },
});

/** Root of every app: applies the theme and base typography to its subtree. */
export const ThemeProvider = ({ theme = "system", children }: ThemeProviderProps) => (
  <div
    data-theme={theme}
    {...stylex.props(
      theme === "light" && lightTheme,
      theme === "light" && lightShadowTheme,
      theme === "dark" && darkTheme,
      theme === "dark" && darkShadowTheme,
      styles.root,
      styles[theme],
    )}
  >
    {children}
  </div>
);
