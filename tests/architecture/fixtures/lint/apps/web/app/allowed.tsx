// Passes every guardrail: design-system components, token-only stylex.create, type-only API import,
// and the dev StyleX stylesheet referenced as a link href (a string, not an import).
import type { AppType } from "@kata/api";
import { Box } from "@kata/design-system";
import { color, space } from "@kata/design-system/tokens.stylex";
import * as stylex from "@stylexjs/stylex";

export type Api = AppType;

const styles = stylex.create({
  panel: {
    backgroundColor: color.surface,
    borderStyle: "solid",
    margin: 0,
    padding: space.md,
    transitionProperty: "background-color, color",
  },
});

export const Panel = () => (
  <>
    <link rel="stylesheet" href="/virtual:stylex.css" />
    <div {...stylex.props(styles.panel)}>
      <Box padding="md">Hello</Box>
    </div>
  </>
);
