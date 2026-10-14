import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";
import { color, space } from "../tokens.stylex.ts";

export type AppShellProps = {
  /** Top of the menu (app name, logo). */
  brand?: ReactNode;
  /** Menu entries, usually `NavItem`s. Rendered in a `<nav>` named by `navLabel`. */
  nav?: ReactNode;
  /** Bottom of the menu (user name, sign out). */
  actions?: ReactNode;
  /** Accessible name of the `<nav>`. Default "Main". */
  navLabel?: string;
  /** Fills the viewport height and keeps the menu in view (sticky). Default true; false for an embedded preview. */
  fullHeight?: boolean;
  /** The page. Rendered in `<main>`. */
  children?: ReactNode;
  "data-testid"?: string;
};

const NARROW = "@media (max-width: 768px)";

const styles = stylex.create({
  root: {
    backgroundColor: color.bg,
    boxSizing: "border-box",
    display: "flex",
    flexDirection: { default: "row", [NARROW]: "column" },
  },
  rootFull: { minHeight: "100vh" },
  sidebar: {
    backgroundColor: color.bgSubtle,
    borderColor: color.border,
    borderStyle: "solid",
    borderWidth: { default: "0 1px 0 0", [NARROW]: "0 0 1px 0" },
    boxSizing: "border-box",
    display: "flex",
    flexDirection: { default: "column", [NARROW]: "row" },
    flexShrink: 0,
    gap: { default: space.lg, [NARROW]: space.sm },
    alignItems: { default: "stretch", [NARROW]: "center" },
    padding: { default: space.lg, [NARROW]: space.sm },
    width: { default: "240px", [NARROW]: "100%" },
  },
  sidebarFull: {
    height: { default: "100vh", [NARROW]: "auto" },
    position: { default: "sticky", [NARROW]: "static" },
    top: 0,
  },
  brand: { paddingInline: { default: space.md, [NARROW]: space.sm } },
  nav: {
    display: "flex",
    flexDirection: { default: "column", [NARROW]: "row" },
    flexGrow: 1,
    gap: space.xxs,
    overflowX: { default: "visible", [NARROW]: "auto" },
  },
  actions: { display: "flex", flexDirection: "column", gap: space.xs },
  main: { boxSizing: "border-box", flexGrow: 1, minWidth: 0 },
});

/** Page layout of the app: a menu (sidebar, or a top bar on narrow screens) and the main content. */
export const AppShell = ({
  brand,
  nav,
  actions,
  navLabel = "Main",
  fullHeight = true,
  children,
  ...rest
}: AppShellProps) => (
  <div {...rest} {...stylex.props(styles.root, fullHeight && styles.rootFull)}>
    <aside {...stylex.props(styles.sidebar, fullHeight && styles.sidebarFull)}>
      {brand !== undefined && <div {...stylex.props(styles.brand)}>{brand}</div>}
      <nav aria-label={navLabel} {...stylex.props(styles.nav)}>
        {nav}
      </nav>
      {actions !== undefined && <div {...stylex.props(styles.actions)}>{actions}</div>}
    </aside>
    <main {...stylex.props(styles.main)}>{children}</main>
  </div>
);
