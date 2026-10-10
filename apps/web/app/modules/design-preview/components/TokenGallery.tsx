import { Stack, Text } from "@kata/design-system";
import { color, font, motion, radius, shadow, space, zIndex } from "@kata/design-system/tokens.stylex";
import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";
import { Section } from "./ComponentGallery.tsx";

// Every value below is a design token: the preview draws the tokens themselves.
// StyleX needs static keys, so each token gets its own entry.

const colorSwatch = stylex.create({
  bg: { backgroundColor: color.bg },
  bgSubtle: { backgroundColor: color.bgSubtle },
  surface: { backgroundColor: color.surface },
  border: { backgroundColor: color.border },
  borderStrong: { backgroundColor: color.borderStrong },
  text: { backgroundColor: color.text },
  textMuted: { backgroundColor: color.textMuted },
  accent: { backgroundColor: color.accent },
  accentHover: { backgroundColor: color.accentHover },
  accentSubtle: { backgroundColor: color.accentSubtle },
  accentText: { backgroundColor: color.accentText },
  danger: { backgroundColor: color.danger },
  dangerSubtle: { backgroundColor: color.dangerSubtle },
  dangerText: { backgroundColor: color.dangerText },
  success: { backgroundColor: color.success },
  successText: { backgroundColor: color.successText },
  warning: { backgroundColor: color.warning },
  warningText: { backgroundColor: color.warningText },
  focusRing: { backgroundColor: color.focusRing },
  overlay: { backgroundColor: color.overlay },
});

const spaceBar = stylex.create({
  none: { width: space.none },
  xxs: { width: space.xxs },
  xs: { width: space.xs },
  sm: { width: space.sm },
  md: { width: space.md },
  lg: { width: space.lg },
  xl: { width: space.xl },
  xxl: { width: space.xxl },
  xxxl: { width: space.xxxl },
});

const radiusTile = stylex.create({
  none: { borderRadius: radius.none },
  sm: { borderRadius: radius.sm },
  md: { borderRadius: radius.md },
  lg: { borderRadius: radius.lg },
  full: { borderRadius: radius.full },
});

const shadowTile = stylex.create({
  none: { boxShadow: shadow.none },
  sm: { boxShadow: shadow.sm },
  md: { boxShadow: shadow.md },
  lg: { boxShadow: shadow.lg },
});

const fontSample = stylex.create({
  familySans: { fontFamily: font.familySans },
  familyMono: { fontFamily: font.familyMono },
  sizeXs: { fontSize: font.sizeXs },
  sizeSm: { fontSize: font.sizeSm },
  sizeMd: { fontSize: font.sizeMd },
  sizeLg: { fontSize: font.sizeLg },
  sizeXl: { fontSize: font.sizeXl },
  sizeXxl: { fontSize: font.sizeXxl },
  sizeXxxl: { fontSize: font.sizeXxxl },
  weightRegular: { fontWeight: font.weightRegular },
  weightMedium: { fontWeight: font.weightMedium },
  weightSemibold: { fontWeight: font.weightSemibold },
  weightBold: { fontWeight: font.weightBold },
  lineHeightTight: { lineHeight: font.lineHeightTight },
  lineHeightNormal: { lineHeight: font.lineHeightNormal },
  lineHeightRelaxed: { lineHeight: font.lineHeightRelaxed },
});

const zIndexChip = stylex.create({
  base: { zIndex: zIndex.base },
  dropdown: { zIndex: zIndex.dropdown },
  sticky: { zIndex: zIndex.sticky },
  overlay: { zIndex: zIndex.overlay },
  modal: { zIndex: zIndex.modal },
  popover: { zIndex: zIndex.popover },
  toast: { zIndex: zIndex.toast },
  tooltip: { zIndex: zIndex.tooltip },
});

const motionChip = stylex.create({
  durationFast: { transitionDuration: motion.durationFast },
  durationNormal: { transitionDuration: motion.durationNormal },
  durationSlow: { transitionDuration: motion.durationSlow },
  durationSpin: { transitionDuration: motion.durationSpin },
  easingStandard: { transitionTimingFunction: motion.easingStandard },
  easingEnter: { transitionTimingFunction: motion.easingEnter },
  easingExit: { transitionTimingFunction: motion.easingExit },
});

const styles = stylex.create({
  swatch: {
    borderColor: color.borderStrong,
    borderRadius: radius.sm,
    borderStyle: "solid",
    borderWidth: space.xxs,
    height: space.xxl,
    width: space.xxxl,
  },
  bar: { backgroundColor: color.accent, height: space.md },
  tile: {
    backgroundColor: color.surface,
    borderColor: color.border,
    borderStyle: "solid",
    borderWidth: space.xxs,
    height: space.xxxl,
    width: space.xxxl,
  },
  chip: {
    backgroundColor: color.accentSubtle,
    borderRadius: radius.md,
    color: color.text,
    paddingBlock: space.xs,
    paddingInline: space.sm,
    position: "relative",
  },
  // Hover a motion chip: its color change runs with that duration / easing.
  motion: {
    backgroundColor: { default: color.accentSubtle, ":hover": color.accent },
    color: { default: color.text, ":hover": color.accentText },
    transitionDuration: motion.durationNormal,
    transitionProperty: "background-color, color",
    transitionTimingFunction: motion.easingStandard,
  },
});

const keys = <T extends object>(group: T) => Object.keys(group) as (keyof T & string)[];

const Token = ({ name, children }: { name: string; children: ReactNode }) => (
  <Stack gap="xs" align="start">
    {children}
    <Text size="xs" tone="muted" as="code">
      {name}
    </Text>
  </Stack>
);

/** Every token group of `@kata/design-system/tokens.stylex`, drawn with the token itself. */
export const TokenGallery = () => (
  <Stack gap="xl">
    <Section title="color">
      <Stack direction="row" gap="md" wrap>
        {keys(colorSwatch).map((name) => (
          <Token key={name} name={name}>
            <div {...stylex.props(styles.swatch, colorSwatch[name])} />
          </Token>
        ))}
      </Stack>
    </Section>

    <Section title="space">
      {keys(spaceBar).map((name) => (
        <Stack key={name} direction="row" gap="md" align="center">
          <Text size="xs" tone="muted" as="code">
            {name}
          </Text>
          <div {...stylex.props(styles.bar, spaceBar[name])} />
        </Stack>
      ))}
    </Section>

    <Section title="radius">
      <Stack direction="row" gap="md" wrap>
        {keys(radiusTile).map((name) => (
          <Token key={name} name={name}>
            <div {...stylex.props(styles.tile, radiusTile[name])} />
          </Token>
        ))}
      </Stack>
    </Section>

    <Section title="shadow">
      <Stack direction="row" gap="lg" wrap>
        {keys(shadowTile).map((name) => (
          <Token key={name} name={name}>
            <div {...stylex.props(styles.tile, radiusTile.md, shadowTile[name])} />
          </Token>
        ))}
      </Stack>
    </Section>

    <Section title="font">
      {keys(fontSample).map((name) => (
        <span key={name} {...stylex.props(fontSample[name])}>
          {name}: The quick brown fox
        </span>
      ))}
    </Section>

    <Section title="zIndex">
      <Text size="sm" tone="muted">
        Lowest to highest.
      </Text>
      <Stack direction="row" gap="sm" wrap>
        {keys(zIndexChip).map((name) => (
          <span key={name} {...stylex.props(styles.chip, zIndexChip[name])}>
            {name}
          </span>
        ))}
      </Stack>
    </Section>

    <Section title="motion">
      <Text size="sm" tone="muted">
        Hover a chip to run a transition with that token.
      </Text>
      <Stack direction="row" gap="sm" wrap>
        {keys(motionChip).map((name) => (
          <span key={name} {...stylex.props(styles.chip, styles.motion, motionChip[name])}>
            {name}
          </span>
        ))}
      </Stack>
    </Section>
  </Stack>
);
