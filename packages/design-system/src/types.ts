import type { AriaAttributes, AriaRole, ReactNode } from "react";

/** Keys of the `space` token group. */
export type SpaceToken = "none" | "xxs" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl" | "xxxl";

/** Keys of the `radius` token group. */
export type RadiusToken = "none" | "sm" | "md" | "lg" | "full";

/** Semantic text colors. */
export type Tone = "default" | "muted" | "accent" | "danger" | "success" | "warning";

/** Props every component accepts: identity, ARIA and a test id. Never `style` or `className`. */
export type CommonProps = AriaAttributes & {
  id?: string;
  role?: AriaRole;
  "data-testid"?: string;
  children?: ReactNode;
};

/** Block-level elements a layout component can render as. */
export type LayoutElement =
  | "div"
  | "section"
  | "article"
  | "main"
  | "header"
  | "footer"
  | "nav"
  | "aside"
  | "ul"
  | "ol"
  | "li";
