import { useRender } from "@base-ui/react/use-render";
import * as stylex from "@stylexjs/stylex";
import type { ReactElement } from "react";
import { color, motion } from "../tokens.stylex.ts";
import type { CommonProps } from "../types.ts";
import { focus } from "./focus.ts";

export type LinkTone = "accent" | "muted";

export type LinkProps = CommonProps & {
  /** Target of the default `<a>`. Ignored when `render` gives an element with its own target. */
  href?: string;
  /**
   * Element to render instead of `<a>`, for example a router link: `render={<RouterLink to="/sign-up" />}`.
   * It receives the link's classes and children.
   */
  render?: ReactElement;
  /** Default "accent". */
  tone?: LinkTone;
};

const tones = stylex.create({
  accent: { color: { default: color.accent, ":hover": color.accentHover } },
  muted: { color: { default: color.textMuted, ":hover": color.text } },
});

const styles = stylex.create({
  base: {
    borderRadius: "2px",
    cursor: "pointer",
    textDecorationLine: { default: "underline", ":hover": "underline" },
    textDecorationThickness: { default: "1px", ":hover": "2px" },
    textUnderlineOffset: "0.2em",
    transitionDuration: motion.durationFast,
    transitionProperty: "color",
    transitionTimingFunction: motion.easingStandard,
  },
});

/** Inline text link. Renders an `<a>`, or the element given in `render` (a router link). */
export const Link = ({ href, render, tone = "accent", children, ...rest }: LinkProps) =>
  useRender({
    defaultTagName: "a",
    render,
    props: {
      ...rest,
      ...(href === undefined ? {} : { href }),
      children,
      ...stylex.props(focus.ring, styles.base, tones[tone]),
    },
  });
