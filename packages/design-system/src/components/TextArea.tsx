import { Field } from "@base-ui/react/field";
import * as stylex from "@stylexjs/stylex";
import { FieldFrame, type FieldProps, fieldStyles } from "./FieldFrame.tsx";

export type TextAreaProps = FieldProps & {
  /** Visible lines. Default 4. */
  rows?: number;
  placeholder?: string;
  /** Controlled value. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
};

const styles = stylex.create({
  textarea: { resize: "vertical" },
});

/** Multi-line text field with label, description and error. Built on Base UI Field. */
export const TextArea = ({
  label,
  description,
  error,
  disabled,
  name,
  rows = 4,
  onValueChange,
  ...rest
}: TextAreaProps) => (
  <FieldFrame label={label} description={description} error={error} disabled={disabled} name={name}>
    <Field.Control
      {...rest}
      render={<textarea rows={rows} />}
      onValueChange={(value) => onValueChange?.(value)}
      {...stylex.props(fieldStyles.control, styles.textarea)}
    />
  </FieldFrame>
);
