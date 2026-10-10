import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import * as stylex from "@stylexjs/stylex";
import type { ReactElement, ReactNode } from "react";
import { color, font, motion, radius, shadow, space, zIndex } from "../tokens.stylex.ts";
import { Button, type ButtonSize, type ButtonVariant } from "./Button.tsx";
import { focus } from "./focus.ts";
import { Icon } from "./Icon.tsx";

export type DialogSize = "sm" | "md" | "lg";

export type DialogProps = {
  /** Heading of the dialog, also its accessible name. */
  title: string;
  /** Text under the title, also the accessible description. */
  description?: string;
  /** Element that opens the dialog, usually a `<Button>`. Omit it to control the dialog with `open`. */
  trigger?: ReactElement;
  /** Controlled open state. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Max width. Default "md". */
  size?: DialogSize;
  /** Buttons at the bottom, end-aligned. Use `DialogClose` for a button that closes the dialog. */
  actions?: ReactNode;
  /** Accessible name of the close (x) button. Default "Close". */
  closeLabel?: string;
  /** Test id of the dialog popup. */
  "data-testid"?: string;
  children?: ReactNode;
};

export type DialogCloseProps = {
  /** Default "secondary". */
  variant?: ButtonVariant;
  /** Default "md". */
  size?: ButtonSize;
  "data-testid"?: string;
  children?: ReactNode;
};

const sizes = stylex.create({
  sm: { maxWidth: "400px" },
  md: { maxWidth: "560px" },
  lg: { maxWidth: "720px" },
});

const styles = stylex.create({
  backdrop: {
    backgroundColor: color.overlay,
    inset: 0,
    opacity: { default: 1, ":is([data-starting-style])": 0, ":is([data-ending-style])": 0 },
    position: "fixed",
    transitionDuration: motion.durationNormal,
    transitionProperty: "opacity",
    transitionTimingFunction: motion.easingStandard,
    zIndex: zIndex.overlay,
  },
  viewport: {
    alignItems: "center",
    boxSizing: "border-box",
    display: "flex",
    inset: 0,
    justifyContent: "center",
    padding: space.lg,
    position: "fixed",
    zIndex: zIndex.modal,
  },
  popup: {
    backgroundColor: color.surface,
    borderColor: color.border,
    borderRadius: radius.lg,
    borderStyle: "solid",
    borderWidth: "1px",
    boxShadow: shadow.lg,
    boxSizing: "border-box",
    color: color.text,
    display: "flex",
    flexDirection: "column",
    fontFamily: font.familySans,
    gap: space.lg,
    maxHeight: "100%",
    opacity: { default: 1, ":is([data-starting-style])": 0, ":is([data-ending-style])": 0 },
    outline: "none",
    overflowY: "auto",
    padding: space.xl,
    transform: {
      default: "none",
      ":is([data-starting-style])": "scale(0.96)",
      ":is([data-ending-style])": "scale(0.96)",
    },
    transitionDuration: motion.durationNormal,
    transitionProperty: "opacity, transform",
    transitionTimingFunction: motion.easingStandard,
    width: "100%",
  },
  header: { alignItems: "flex-start", display: "flex", gap: space.md, justifyContent: "space-between" },
  headings: { display: "flex", flexDirection: "column", gap: space.xs, minWidth: 0 },
  title: {
    fontSize: font.sizeXl,
    fontWeight: font.weightSemibold,
    lineHeight: font.lineHeightTight,
    margin: 0,
  },
  description: {
    color: color.textMuted,
    fontSize: font.sizeSm,
    lineHeight: font.lineHeightNormal,
    margin: 0,
  },
  close: {
    alignItems: "center",
    backgroundColor: { default: "transparent", ":hover": color.bgSubtle },
    borderRadius: radius.md,
    borderStyle: "none",
    color: color.textMuted,
    cursor: "pointer",
    display: "inline-flex",
    flexShrink: 0,
    justifyContent: "center",
    margin: 0,
    padding: space.xs,
  },
  actions: { display: "flex", flexWrap: "wrap", gap: space.sm, justifyContent: "flex-end" },
});

/** Modal dialog with a title, optional description, content and actions. Built on Base UI Dialog. */
export const Dialog = ({
  title,
  description,
  trigger,
  open,
  defaultOpen,
  onOpenChange,
  size = "md",
  actions,
  closeLabel = "Close",
  "data-testid": testId,
  children,
}: DialogProps) => (
  <BaseDialog.Root open={open} defaultOpen={defaultOpen} onOpenChange={(next) => onOpenChange?.(next)}>
    {trigger !== undefined && <BaseDialog.Trigger render={trigger} />}
    <BaseDialog.Portal>
      <BaseDialog.Backdrop {...stylex.props(styles.backdrop)} />
      <BaseDialog.Viewport {...stylex.props(styles.viewport)}>
        <BaseDialog.Popup data-testid={testId} {...stylex.props(styles.popup, sizes[size])}>
          <div {...stylex.props(styles.header)}>
            <div {...stylex.props(styles.headings)}>
              <BaseDialog.Title {...stylex.props(styles.title)}>{title}</BaseDialog.Title>
              {description !== undefined && (
                <BaseDialog.Description {...stylex.props(styles.description)}>
                  {description}
                </BaseDialog.Description>
              )}
            </div>
            <BaseDialog.Close aria-label={closeLabel} {...stylex.props(focus.ring, styles.close)}>
              <Icon name="x" />
            </BaseDialog.Close>
          </div>
          {children}
          {actions !== undefined && <div {...stylex.props(styles.actions)}>{actions}</div>}
        </BaseDialog.Popup>
      </BaseDialog.Viewport>
    </BaseDialog.Portal>
  </BaseDialog.Root>
);

/** A `Button` that closes the surrounding `Dialog`. */
export const DialogClose = ({ variant = "secondary", size = "md", children, ...rest }: DialogCloseProps) => (
  <BaseDialog.Close {...rest} render={<Button variant={variant} size={size} />}>
    {children}
  </BaseDialog.Close>
);
