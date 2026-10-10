import { Box, Heading, Stack, Text, ThemeProvider } from "@kata/design-system";
import type { ReactNode } from "react";
import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import type { Route } from "./+types/root";

// StyleX CSS has no source file to import.
// - Build: the StyleX plugin writes it to `assets/stylex.css` because the app has no other CSS asset.
// - Dev: the plugin serves it at `/virtual:stylex.css`. Its runtime replaces that link with a `<style>`
//   it reloads on change; it may disable the link before hydration, hence suppressHydrationWarning.
export const links: Route.LinksFunction = () =>
  import.meta.env.DEV ? [] : [{ rel: "stylesheet", href: "/assets/stylex.css" }];

if (import.meta.env.DEV && typeof document !== "undefined") {
  void import("virtual:stylex:runtime");
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Kata</title>
        <Meta />
        <Links />
        {import.meta.env.DEV && <link rel="stylesheet" href="/virtual:stylex.css" suppressHydrationWarning />}
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

/** Shown while the first `clientLoader` runs (SPA mode). */
export function HydrateFallback() {
  return (
    <Box as="main" padding="xl">
      <Text tone="muted">Loading…</Text>
    </Box>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : "Unknown error";
  return (
    <Box as="main" padding="xl">
      <Stack gap="sm">
        <Heading level={1}>Something went wrong</Heading>
        <Text tone="danger">{message}</Text>
      </Stack>
    </Box>
  );
}
