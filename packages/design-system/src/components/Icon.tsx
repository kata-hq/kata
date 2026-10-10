import * as stylex from "@stylexjs/stylex";
import type { Tone } from "../types.ts";
import { tones } from "./tone.ts";

// 24x24 stroke icons drawn with `currentColor`. Add an icon by adding its path(s) here.
const paths = {
  check: ["M20 6 9 17l-5-5"],
  x: ["M18 6 6 18", "M6 6l12 12"],
  plus: ["M12 5v14", "M5 12h14"],
  "chevron-down": ["m6 9 6 6 6-6"],
  info: ["M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z", "M12 16v-4", "M12 8h.01"],
  alert: [
    "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z",
    "M12 9v4",
    "M12 17h.01",
  ],
  sun: [
    "M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z",
    "M12 2v2",
    "M12 20v2",
    "m4.93 4.93 1.41 1.41",
    "m17.66 17.66 1.41 1.41",
    "M2 12h2",
    "M20 12h2",
    "m6.34 17.66-1.41 1.41",
    "m19.07 4.93-1.41 1.41",
  ],
  moon: ["M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"],
} as const satisfies Record<string, readonly string[]>;

export type IconName = keyof typeof paths;
export const iconNames = Object.keys(paths) as IconName[];

export type IconSize = "sm" | "md" | "lg";

export type IconProps = {
  name: IconName;
  /** Default "md" (20px). */
  size?: IconSize;
  /** Default: inherits the current text color. */
  tone?: Tone;
  /** Accessible name. Without it the icon is decorative and hidden from assistive tech. */
  label?: string;
  "data-testid"?: string;
};

const sizes = stylex.create({
  sm: { width: "16px", height: "16px" },
  md: { width: "20px", height: "20px" },
  lg: { width: "24px", height: "24px" },
});

const styles = stylex.create({
  base: { display: "inline-block", flexShrink: 0, verticalAlign: "middle" },
});

/** Inline SVG icon from the built-in set. */
export const Icon = ({ name, size = "md", tone, label, ...rest }: IconProps) => (
  <svg
    {...rest}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    focusable="false"
    role={label === undefined ? undefined : "img"}
    aria-label={label}
    aria-hidden={label === undefined ? true : undefined}
    {...stylex.props(styles.base, sizes[size], tone !== undefined && tones[tone])}
  >
    {paths[name].map((d) => (
      <path key={d} d={d} />
    ))}
  </svg>
);
