import { describe, expect, test } from "bun:test";
import * as stylex from "@stylexjs/stylex";
import { render, screen } from "@testing-library/react";
import type { color } from "../tokens.stylex.ts";
import { ThemeProvider } from "./ThemeProvider.tsx";
import { darkTheme, lightTheme } from "./themes.ts";

const themeClasses = (theme: stylex.Theme<typeof color>): string[] =>
  (stylex.props(theme).className ?? "").split(" ").filter(Boolean);

const root = () => screen.getByText("app").closest("[data-theme]") as HTMLElement;

describe("ThemeProvider", () => {
  test("follows the system scheme by default", () => {
    render(<ThemeProvider>app</ThemeProvider>);
    expect(root().getAttribute("data-theme")).toBe("system");
  });

  test("light, dark and system produce different classes", () => {
    const classes = (["light", "dark", "system"] as const).map((theme) => {
      const { unmount } = render(<ThemeProvider theme={theme}>app</ThemeProvider>);
      const className = root().className;
      unmount();
      return className;
    });
    expect(new Set(classes).size).toBe(3);
  });

  test("dark applies the dark theme and not the light one", () => {
    render(<ThemeProvider theme="dark">app</ThemeProvider>);
    const classes = root().classList;
    const dark = themeClasses(darkTheme);
    // Both themes share the var group's marker class; only compare the theme-specific ones.
    const lightOnly = themeClasses(lightTheme).filter((c) => !dark.includes(c));
    expect(lightOnly.length).toBeGreaterThan(0);
    expect(dark.every((c) => classes.contains(c))).toBe(true);
    expect(lightOnly.some((c) => classes.contains(c))).toBe(false);
  });
});
