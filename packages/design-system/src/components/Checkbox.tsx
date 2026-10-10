import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { Field } from "@base-ui/react/field";
import * as stylex from "@stylexjs/stylex";
import { color, font, motion, radius, space } from "../tokens.stylex.ts";
import { fieldStyles } from "./FieldFrame.tsx";
import { focus } from "./focus.ts";
import { Icon } from "./Icon.tsx";

export type CheckboxProps = {
  /** Visible label next to the box, also its accessible name. */
  label: string;
  /** Help text under the label, linked with `aria-describedby`. */
  description?: string;
  /** Controlled state. */
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  required?: boolean;
  /** Form field name. */
  name?: string;
  /** Value submitted with the form when checked. */
  value?: string;
  /** Id of the checkbox element. */
  id?: string;
  /** Test id of the checkbox element. */
  "data-testid"?: string;
};

/** Side of the box. The description is indented by it so it lines up with the label. */
const BOX_SIZE = "18px";

const styles = stylex.create({
  row: { alignItems: "center", display: "flex", gap: space.sm },
  label: {
    color: color.text,
    cursor: { default: "pointer", ":is([data-disabled])": "not-allowed" },
    fontFamily: font.familySans,
    fontSize: font.sizeMd,
    lineHeight: font.lineHeightNormal,
    opacity: { default: 1, ":is([data-disabled])": 0.6 },
  },
  box: {
    alignItems: "center",
    backgroundColor: { default: color.surface, ":is([data-checked])": color.accent },
    borderColor: { default: color.borderStrong, ":is([data-checked])": color.accent },
    borderRadius: radius.sm,
    borderStyle: "solid",
    borderWidth: "1px",
    boxSizing: "border-box",
    color: color.accentText,
    cursor: { default: "pointer", ":is([data-disabled])": "not-allowed" },
    display: "inline-flex",
    margin: 0,
    opacity: { default: 1, ":is([data-disabled])": 0.6 },
    padding: 0,
    flexShrink: 0,
    height: BOX_SIZE,
    justifyContent: "center",
    transitionDuration: motion.durationFast,
    transitionProperty: "background-color, border-color",
    width: BOX_SIZE,
  },
  indicator: { display: "flex" },
  description: { paddingInlineStart: `calc(${BOX_SIZE} + ${space.sm})` },
});

/** Checkbox with a label. Built on Base UI Checkbox and Field. */
export const Checkbox = ({
  label,
  description,
  disabled = false,
  name,
  onCheckedChange,
  ...rest
}: CheckboxProps) => (
  <Field.Root name={name} disabled={disabled} {...stylex.props(fieldStyles.root)}>
    <div {...stylex.props(styles.row)}>
      {/* Native button + sibling label: the pattern Base UI recommends when the label does not wrap the box. */}
      <BaseCheckbox.Root
        {...rest}
        nativeButton
        render={<button type="button" />}
        onCheckedChange={(checked) => onCheckedChange?.(checked)}
        {...stylex.props(focus.ring, styles.box)}
      >
        <BaseCheckbox.Indicator {...stylex.props(styles.indicator)}>
          <Icon name="check" size="sm" />
        </BaseCheckbox.Indicator>
      </BaseCheckbox.Root>
      <Field.Label {...stylex.props(styles.label)}>{label}</Field.Label>
    </div>
    {description !== undefined && (
      <Field.Description {...stylex.props(fieldStyles.description, styles.description)}>
        {description}
      </Field.Description>
    )}
  </Field.Root>
);
