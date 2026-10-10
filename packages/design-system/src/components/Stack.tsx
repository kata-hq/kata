import * as stylex from "@stylexjs/stylex";
import { space } from "../tokens.stylex.ts";
import type { CommonProps, LayoutElement, SpaceToken } from "../types.ts";

export type StackDirection = "row" | "column";
export type StackAlign = "start" | "center" | "end" | "stretch" | "baseline";
export type StackJustify = "start" | "center" | "end" | "between" | "around" | "evenly";

export type StackProps = CommonProps & {
  as?: LayoutElement;
  /** Default "column". */
  direction?: StackDirection;
  /** Space between children. Default "none". */
  gap?: SpaceToken;
  align?: StackAlign;
  justify?: StackJustify;
  wrap?: boolean;
};

const gaps = stylex.create({
  none: { gap: space.none },
  xxs: { gap: space.xxs },
  xs: { gap: space.xs },
  sm: { gap: space.sm },
  md: { gap: space.md },
  lg: { gap: space.lg },
  xl: { gap: space.xl },
  xxl: { gap: space.xxl },
  xxxl: { gap: space.xxxl },
});

const directions = stylex.create({
  row: { flexDirection: "row" },
  column: { flexDirection: "column" },
});

const aligns = stylex.create({
  start: { alignItems: "flex-start" },
  center: { alignItems: "center" },
  end: { alignItems: "flex-end" },
  stretch: { alignItems: "stretch" },
  baseline: { alignItems: "baseline" },
});

const justifies = stylex.create({
  start: { justifyContent: "flex-start" },
  center: { justifyContent: "center" },
  end: { justifyContent: "flex-end" },
  between: { justifyContent: "space-between" },
  around: { justifyContent: "space-around" },
  evenly: { justifyContent: "space-evenly" },
});

const styles = stylex.create({
  base: { display: "flex", boxSizing: "border-box", minWidth: 0 },
  list: { listStyle: "none", margin: 0, padding: 0 },
  wrap: { flexWrap: "wrap" },
});

/** Flex layout: lays children out in a row or column with a token gap. */
export const Stack = ({
  as: Element = "div",
  direction = "column",
  gap = "none",
  align,
  justify,
  wrap = false,
  ...rest
}: StackProps) => (
  <Element
    {...rest}
    {...stylex.props(
      styles.base,
      (Element === "ul" || Element === "ol") && styles.list,
      directions[direction],
      gaps[gap],
      align !== undefined && aligns[align],
      justify !== undefined && justifies[justify],
      wrap && styles.wrap,
    )}
  />
);
