import { Button as BaseButton } from "@base-ui/react/button";
import * as stylex from "@stylexjs/stylex";
import type { MouseEvent } from "react";
import { color, font, motion, radius, space } from "../tokens.stylex.ts";
import type { CommonProps } from "../types.ts";
import { focus } from "./focus.ts";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

export type ButtonProps = CommonProps & {
  /** Default "primary". */
  variant?: ButtonVariant;
  /** Default "md". */
  size?: ButtonSize;
  disabled?: boolean;
  /** Shows a spinner, sets `aria-busy` and ignores clicks. The button stays focusable. */
  loading?: boolean;
  /** Default "button". */
  type?: "button" | "submit" | "reset";
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
};

const spin = stylex.keyframes({
  from: { transform: "rotate(0deg)" },
  to: { transform: "rotate(360deg)" },
});

const variants = stylex.create({
  primary: {
    backgroundColor: { default: color.accent, ":hover:not([data-disabled])": color.accentHover },
    borderColor: "transparent",
    color: color.accentText,
  },
  secondary: {
    backgroundColor: { default: color.surface, ":hover:not([data-disabled])": color.bgSubtle },
    borderColor: color.borderStrong,
    color: color.text,
  },
  ghost: {
    backgroundColor: { default: "transparent", ":hover:not([data-disabled])": color.bgSubtle },
    borderColor: "transparent",
    color: color.text,
  },
  danger: {
    backgroundColor: color.danger,
    borderColor: "transparent",
    color: color.dangerText,
    opacity: { default: 1, ":hover:not([data-disabled])": 0.9 },
  },
});

const sizes = stylex.create({
  sm: {
    fontSize: font.sizeSm,
    gap: space.xs,
    paddingBlock: space.xs,
    paddingInline: space.md,
  },
  md: {
    fontSize: font.sizeMd,
    gap: space.sm,
    paddingBlock: space.sm,
    paddingInline: space.lg,
  },
});

const styles = stylex.create({
  base: {
    alignItems: "center",
    borderRadius: radius.md,
    borderStyle: "solid",
    borderWidth: "1px",
    boxSizing: "border-box",
    cursor: "pointer",
    display: "inline-flex",
    fontFamily: font.familySans,
    fontWeight: font.weightMedium,
    justifyContent: "center",
    lineHeight: font.lineHeightNormal,
    margin: 0,
    transitionDuration: motion.durationFast,
    transitionProperty: "background-color, opacity",
    transitionTimingFunction: motion.easingStandard,
    userSelect: "none",
    whiteSpace: "nowrap",
  },
  disabled: { cursor: "not-allowed", opacity: 0.5 },
  loading: { cursor: "progress" },
  spinner: {
    animationDuration: {
      default: motion.durationSpin,
      "@media (prefers-reduced-motion: reduce)": `calc(${motion.durationSpin} * 3)`,
    },
    animationIterationCount: "infinite",
    animationName: spin,
    animationTimingFunction: "linear",
    borderColor: "currentColor",
    borderRadius: radius.full,
    borderStyle: "solid",
    borderTopColor: "transparent",
    borderWidth: "2px",
    boxSizing: "border-box",
    display: "inline-block",
    flexShrink: 0,
    height: "1em",
    width: "1em",
  },
});

/** Action button. Built on Base UI Button. */
export const Button = ({
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  type = "button",
  children,
  ...rest
}: ButtonProps) => (
  <BaseButton
    {...rest}
    type={type}
    disabled={disabled || loading}
    focusableWhenDisabled={loading && !disabled}
    aria-busy={loading || undefined}
    {...stylex.props(
      focus.ring,
      styles.base,
      variants[variant],
      sizes[size],
      disabled && styles.disabled,
      loading && styles.loading,
    )}
  >
    {loading && <span aria-hidden="true" data-testid="button-spinner" {...stylex.props(styles.spinner)} />}
    {children}
  </BaseButton>
);
