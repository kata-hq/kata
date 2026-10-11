import { Box, Button, Card, Heading, Icon, Stack, Text } from "@kata/design-system";
import { useRevalidator } from "react-router";
import type { HealthState } from "../api/health-api.ts";

export type HealthViewProps = {
  /** Result of the route's `clientLoader`. */
  health: HealthState;
};

/** Formats the last `system_check` time in the reader's time zone. */
export const formatCheckTime = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "medium" });

const StatusLine = ({ label, up }: { label: string; up: boolean }) => (
  <Stack direction="row" gap="sm" align="center">
    <Icon name={up ? "check" : "alert"} tone={up ? "success" : "danger"} />
    <Text weight="medium" tone={up ? "success" : "danger"}>
      {label} {up ? "ok" : "down"}
    </Text>
  </Stack>
);

/** API and database status. "Refresh" runs the route's `clientLoader` again. */
export const HealthView = ({ health }: HealthViewProps) => {
  const revalidator = useRevalidator();

  return (
    <Box as="main" padding="xl">
      <Card as="section" aria-labelledby="health-title">
        <Stack gap="lg">
          <Heading level={1} id="health-title">
            System status
          </Heading>
          {health.kind === "reachable" ? (
            <Stack gap="sm">
              <StatusLine label="API" up />
              <StatusLine label="Database" up={health.db === "ok"} />
              <Text size="sm" tone="muted">
                Last system check: {formatCheckTime(health.lastCheck)}
              </Text>
            </Stack>
          ) : (
            <Stack direction="row" gap="sm" align="center" role="alert">
              <Icon name="alert" tone="danger" />
              <Text tone="danger">{health.message}</Text>
            </Stack>
          )}
          <Stack direction="row">
            <Button
              variant="secondary"
              loading={revalidator.state === "loading"}
              onClick={() => void revalidator.revalidate()}
            >
              Refresh
            </Button>
          </Stack>
        </Stack>
      </Card>
    </Box>
  );
};
