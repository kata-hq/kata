import { Field } from "@base-ui/react/field";
import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";
import { color, font, motion, radius, space } from "../tokens.stylex.ts";

/** Props shared by the labelled text and choice fields (Input, TextArea, Select). */
export type FieldProps = {
  /** Visible label, also the accessible name of the control. */
  label: string;
  /** Help text under the control, linked with `aria-describedby`. */
  description?: string;
  /** Error message. When set the control is `aria-invalid` and the message is linked with `aria-describedby`. */
  error?: string;
  disabled?: boolean;
  required?: boolean;
  /** Form field name. */
  name?: string;
  /** Id of the control element. */
  id?: string;
  /** Test id of the control element. */
  "data-testid"?: string;
};

export const fieldStyles = stylex.create({
  root: {
    display: "flex",
    flexDirection: "column",
    fontFamily: font.familySans,
    gap: space.xs,
    minWidth: 0,
  },
  label: {
    color: color.text,
    fontSize: font.sizeSm,
    fontWeight: font.weightMedium,
    lineHeight: font.lineHeightNormal,
  },
  description: {
    color: color.textMuted,
    fontSize: font.sizeSm,
    lineHeight: font.lineHeightNormal,
    margin: 0,
  },
  error: {
    color: color.danger,
    fontSize: font.sizeSm,
    lineHeight: font.lineHeightNormal,
  },
  /** Box of a text-like control (input, textarea, select trigger). */
  control: {
    backgroundColor: { default: color.surface, ":is([data-disabled])": color.bgSubtle },
    borderColor: {
      default: color.borderStrong,
      ":is([data-invalid])": color.danger,
      ":focus-visible": color.focusRing,
    },
    borderRadius: radius.md,
    borderStyle: "solid",
    borderWidth: "1px",
    boxSizing: "border-box",
    color: color.text,
    cursor: { default: null, ":is([data-disabled])": "not-allowed" },
    fontFamily: font.familySans,
    fontSize: font.sizeMd,
    lineHeight: font.lineHeightNormal,
    margin: 0,
    opacity: { default: 1, ":is([data-disabled])": 0.6 },
    outlineColor: { default: color.focusRing, ":is([data-invalid])": color.danger },
    outlineOffset: "0px",
    outlineStyle: { default: "none", ":focus-visible": "solid" },
    outlineWidth: "1px",
    paddingBlock: space.sm,
    paddingInline: space.md,
    transitionDuration: motion.durationFast,
    transitionProperty: "border-color",
    width: "100%",
    "::placeholder": { color: color.textMuted },
  },
});

type FieldFrameProps = {
  label: string;
  description: string | undefined;
  error: string | undefined;
  disabled: boolean | undefined;
  name: string | undefined;
  children: ReactNode;
};

/** Field.Root with label, description and error around a control. Internal. */
export const FieldFrame = ({
  label,
  description,
  error,
  disabled = false,
  name,
  children,
}: FieldFrameProps) => (
  <Field.Root
    name={name}
    disabled={disabled}
    invalid={error !== undefined}
    {...stylex.props(fieldStyles.root)}
  >
    <Field.Label {...stylex.props(fieldStyles.label)}>{label}</Field.Label>
    {children}
    {description !== undefined && (
      <Field.Description {...stylex.props(fieldStyles.description)}>{description}</Field.Description>
    )}
    {error !== undefined && (
      <Field.Error match {...stylex.props(fieldStyles.error)}>
        {error}
      </Field.Error>
    )}
  </Field.Root>
);
