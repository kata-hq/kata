import * as stylex from "@stylexjs/stylex";
import { color, radius, shadow, space } from "../tokens.stylex.ts";
import type { CommonProps, SpaceToken } from "../types.ts";

export type CardVariant = "outlined" | "elevated";

export type CardProps = CommonProps & {
  /** Default "div". */
  as?: "div" | "section" | "article";
  /** Default "outlined". */
  variant?: CardVariant;
  /** Default "lg". */
  padding?: SpaceToken;
};

const paddings = stylex.create({
  none: { padding: space.none },
  xxs: { padding: space.xxs },
  xs: { padding: space.xs },
  sm: { padding: space.sm },
  md: { padding: space.md },
  lg: { padding: space.lg },
  xl: { padding: space.xl },
  xxl: { padding: space.xxl },
  xxxl: { padding: space.xxxl },
});

const variants = stylex.create({
  outlined: { borderStyle: "solid", borderWidth: "1px", borderColor: color.border, boxShadow: shadow.none },
  elevated: { borderStyle: "solid", borderWidth: "1px", borderColor: "transparent", boxShadow: shadow.md },
});

const styles = stylex.create({
  base: {
    boxSizing: "border-box",
    minWidth: 0,
    backgroundColor: color.surface,
    color: color.text,
    borderRadius: radius.lg,
  },
});

/** Surface that groups related content. */
export const Card = ({ as: Element = "div", variant = "outlined", padding = "lg", ...rest }: CardProps) => (
  <Element {...rest} {...stylex.props(styles.base, variants[variant], paddings[padding])} />
);
