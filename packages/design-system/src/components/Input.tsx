import { Field } from "@base-ui/react/field";
import * as stylex from "@stylexjs/stylex";
import { FieldFrame, type FieldProps, fieldStyles } from "./FieldFrame.tsx";

export type InputType = "text" | "email" | "password" | "search" | "tel" | "url" | "number";

export type InputProps = FieldProps & {
  /** Default "text". */
  type?: InputType;
  placeholder?: string;
  autoComplete?: string;
  /** Controlled value. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
};

/** Single-line text field with label, description and error. Built on Base UI Field. */
export const Input = ({
  label,
  description,
  error,
  disabled,
  name,
  type = "text",
  onValueChange,
  ...rest
}: InputProps) => (
  <FieldFrame label={label} description={description} error={error} disabled={disabled} name={name}>
    <Field.Control
      {...rest}
      type={type}
      onValueChange={(value) => onValueChange?.(value)}
      {...stylex.props(fieldStyles.control)}
    />
  </FieldFrame>
);
