import { Select as BaseSelect } from "@base-ui/react/select";
import * as stylex from "@stylexjs/stylex";
import { color, font, radius, shadow, space, zIndex } from "../tokens.stylex.ts";
import { FieldFrame, type FieldProps, fieldStyles } from "./FieldFrame.tsx";
import { Icon } from "./Icon.tsx";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type SelectProps = FieldProps & {
  options: readonly SelectOption[];
  /** Shown while no option is selected. */
  placeholder?: string;
  /** Controlled value. `null` means no selection. */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
};

const styles = stylex.create({
  trigger: {
    alignItems: "center",
    cursor: { default: "pointer", ":is([data-disabled])": "not-allowed" },
    display: "flex",
    gap: space.sm,
    justifyContent: "space-between",
    textAlign: "start",
  },
  value: {
    color: { default: color.text, ":is([data-placeholder])": color.textMuted },
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  icon: { color: color.textMuted, display: "flex" },
  positioner: { outline: "none", zIndex: zIndex.dropdown },
  popup: {
    backgroundColor: color.surface,
    borderColor: color.border,
    borderRadius: radius.md,
    borderStyle: "solid",
    borderWidth: "1px",
    boxShadow: shadow.md,
    boxSizing: "border-box",
    color: color.text,
    fontFamily: font.familySans,
    maxHeight: "var(--available-height)",
    minWidth: "var(--anchor-width)",
    outline: "none",
    overflowY: "auto",
    padding: space.xs,
  },
  item: {
    alignItems: "center",
    backgroundColor: { default: "transparent", ":is([data-highlighted])": color.accentSubtle },
    borderRadius: radius.sm,
    cursor: { default: "pointer", ":is([data-disabled])": "not-allowed" },
    display: "flex",
    fontSize: font.sizeMd,
    gap: space.sm,
    justifyContent: "space-between",
    lineHeight: font.lineHeightNormal,
    opacity: { default: 1, ":is([data-disabled])": 0.5 },
    outline: "none",
    paddingBlock: space.xs,
    paddingInline: space.sm,
    userSelect: "none",
  },
  indicator: { color: color.accent, display: "flex" },
});

/** Single-choice dropdown with label, description and error. Built on Base UI Select and Field. */
export const Select = ({
  label,
  description,
  error,
  disabled,
  name,
  required,
  options,
  placeholder,
  value,
  defaultValue,
  onValueChange,
  id,
  "data-testid": testId,
}: SelectProps) => (
  <FieldFrame label={label} description={description} error={error} disabled={disabled} name={name}>
    <BaseSelect.Root<string>
      items={options}
      value={value}
      defaultValue={defaultValue}
      onValueChange={(next) => onValueChange?.(next)}
      required={required}
    >
      <BaseSelect.Trigger id={id} data-testid={testId} {...stylex.props(fieldStyles.control, styles.trigger)}>
        <BaseSelect.Value placeholder={placeholder} {...stylex.props(styles.value)} />
        <BaseSelect.Icon {...stylex.props(styles.icon)}>
          <Icon name="chevron-down" size="sm" />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner
          sideOffset={4}
          alignItemWithTrigger={false}
          {...stylex.props(styles.positioner)}
        >
          <BaseSelect.Popup {...stylex.props(styles.popup)}>
            <BaseSelect.List>
              {options.map((option) => (
                <BaseSelect.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled ?? false}
                  {...stylex.props(styles.item)}
                >
                  <BaseSelect.ItemText>{option.label}</BaseSelect.ItemText>
                  <BaseSelect.ItemIndicator {...stylex.props(styles.indicator)}>
                    <Icon name="check" size="sm" />
                  </BaseSelect.ItemIndicator>
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  </FieldFrame>
);
