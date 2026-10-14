import { useRender } from "@base-ui/react/use-render";
import * as stylex from "@stylexjs/stylex";
import type { ReactElement } from "react";
import { color, font, motion, radius, space } from "../tokens.stylex.ts";
import type { CommonProps } from "../types.ts";
import { focus } from "./focus.ts";
import { Icon, type IconName } from "./Icon.tsx";

export type NavItemProps = CommonProps & {
  /** Visible label and accessible name. */
  label: string;
  icon?: IconName;
  /** Target of the default `<a>`. */
  href?: string;
  /**
   * Element to render instead of `<a>`, for example `render={<NavLink to="/" end />}`.
   * The entry looks active when the element has `aria-current="page"` (React Router's NavLink sets it).
   */
  render?: ReactElement;
};

const styles = stylex.create({
  base: {
    alignItems: "center",
    backgroundColor: {
      default: "transparent",
      ":hover": color.bgSubtle,
      ":is([aria-current=page])": color.accentSubtle,
    },
    borderRadius: radius.md,
    boxSizing: "border-box",
    color: { default: color.textMuted, ":hover": color.text, ":is([aria-current=page])": color.accent },
    display: "flex",
    fontFamily: font.familySans,
    fontSize: font.sizeMd,
    fontWeight: { default: font.weightMedium, ":is([aria-current=page])": font.weightSemibold },
    gap: space.sm,
    lineHeight: font.lineHeightNormal,
    paddingBlock: space.sm,
    paddingInline: space.md,
    textDecorationLine: "none",
    transitionDuration: motion.durationFast,
    transitionProperty: "background-color, color",
    transitionTimingFunction: motion.easingStandard,
    whiteSpace: "nowrap",
  },
});

/** One entry of the app menu (`AppShell` nav). Renders an `<a>`, or the element given in `render`. */
export const NavItem = ({ label, icon, href, render, ...rest }: NavItemProps) =>
  useRender({
    defaultTagName: "a",
    render,
    props: {
      ...rest,
      ...(href === undefined ? {} : { href }),
      children: (
        <>
          {icon !== undefined && <Icon name={icon} size="md" />}
          <span>{label}</span>
        </>
      ),
      ...stylex.props(focus.ring, styles.base),
    },
  });
