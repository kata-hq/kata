import { createApiClient } from "../api-client.ts";
import { fetchHealth } from "../modules/health/api/health-api.ts";
import { HealthView } from "../modules/health/components/HealthView.tsx";
import type { Route } from "./+types/home";

// Runs in the browser on load and on each revalidation ("Refresh").
export const clientLoader = () => fetchHealth(createApiClient(window.location.origin));

export default function Home({ loaderData }: Route.ComponentProps) {
  return <HealthView health={loaderData} />;
}
