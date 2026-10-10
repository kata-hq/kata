import * as stylex from "@stylexjs/stylex";
import { color, radius as radiusVars, space } from "../tokens.stylex.ts";
import type { CommonProps, LayoutElement, RadiusToken, SpaceToken } from "../types.ts";

export type BoxBackground = "bg" | "bgSubtle" | "surface";

export type BoxProps = CommonProps & {
  as?: LayoutElement;
  padding?: SpaceToken;
  paddingX?: SpaceToken;
  paddingY?: SpaceToken;
  background?: BoxBackground;
  radius?: RadiusToken;
  /** Draws a 1px border in `color.border`. */
  border?: boolean;
  /** Takes the remaining space in a flex parent (e.g. a Stack). */
  grow?: boolean;
};

const padding = stylex.create({
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

const paddingX = stylex.create({
  none: { paddingInline: space.none },
  xxs: { paddingInline: space.xxs },
  xs: { paddingInline: space.xs },
  sm: { paddingInline: space.sm },
  md: { paddingInline: space.md },
  lg: { paddingInline: space.lg },
  xl: { paddingInline: space.xl },
  xxl: { paddingInline: space.xxl },
  xxxl: { paddingInline: space.xxxl },
});

const paddingY = stylex.create({
  none: { paddingBlock: space.none },
  xxs: { paddingBlock: space.xxs },
  xs: { paddingBlock: space.xs },
  sm: { paddingBlock: space.sm },
  md: { paddingBlock: space.md },
  lg: { paddingBlock: space.lg },
  xl: { paddingBlock: space.xl },
  xxl: { paddingBlock: space.xxl },
  xxxl: { paddingBlock: space.xxxl },
});

const background = stylex.create({
  bg: { backgroundColor: color.bg },
  bgSubtle: { backgroundColor: color.bgSubtle },
  surface: { backgroundColor: color.surface },
});

const radii = stylex.create({
  none: { borderRadius: radiusVars.none },
  sm: { borderRadius: radiusVars.sm },
  md: { borderRadius: radiusVars.md },
  lg: { borderRadius: radiusVars.lg },
  full: { borderRadius: radiusVars.full },
});

const styles = stylex.create({
  base: { boxSizing: "border-box", minWidth: 0 },
  list: { listStyle: "none", margin: 0, padding: 0 },
  border: { borderStyle: "solid", borderWidth: "1px", borderColor: color.border },
  grow: { flexGrow: 1 },
});

/** Generic container: padding, background, radius and border from tokens. */
export const Box = ({
  as: Element = "div",
  padding: p,
  paddingX: px,
  paddingY: py,
  background: bg,
  radius,
  border = false,
  grow = false,
  ...rest
}: BoxProps) => (
  <Element
    {...rest}
    {...stylex.props(
      styles.base,
      (Element === "ul" || Element === "ol") && styles.list,
      p !== undefined && padding[p],
      px !== undefined && paddingX[px],
      py !== undefined && paddingY[py],
      bg !== undefined && background[bg],
      radius !== undefined && radii[radius],
      border && styles.border,
      grow && styles.grow,
    )}
  />
);
