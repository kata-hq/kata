import { Box, Heading, Stack, type ThemeMode, ThemeProvider } from "@kata/design-system";
import { ComponentGallery } from "../modules/design-preview/components/ComponentGallery.tsx";
import { TokenGallery } from "../modules/design-preview/components/TokenGallery.tsx";

// Dev only (see app/routes.ts): every design-system component and token, light and dark side by side.

const ThemeColumn = ({ theme }: { theme: Exclude<ThemeMode, "system"> }) => (
  <Box grow>
    <ThemeProvider theme={theme}>
      <Box padding="xl">
        <Stack gap="xxl">
          <Heading level={2}>{theme === "light" ? "Light" : "Dark"} theme</Heading>
          <ComponentGallery idPrefix={theme} />
          <TokenGallery />
        </Stack>
      </Box>
    </ThemeProvider>
  </Box>
);

export default function DevPreview() {
  return (
    <Stack as="main">
      <Box padding="xl">
        <Heading level={1}>Design system preview</Heading>
      </Box>
      <Stack direction="row" align="stretch">
        <ThemeColumn theme="light" />
        <ThemeColumn theme="dark" />
      </Stack>
    </Stack>
  );
}
