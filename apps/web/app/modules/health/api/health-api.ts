import type { ApiClient } from "../../../api-client.ts";

/** What the health page shows: the API answered (database up or down), or it could not be reached. */
export type HealthState =
  | { readonly kind: "reachable"; readonly db: "ok" | "down"; readonly lastCheck: string }
  | { readonly kind: "unreachable"; readonly message: string };

/** Calls `GET /api/health`. 200 and 503 both carry a status body; anything else means the API is unreachable. */
export async function fetchHealth(client: ApiClient): Promise<HealthState> {
  try {
    const res = await client.api.health.$get();
    // The API declares only 200 and 503, but a proxy can answer anything (in dev, Vite answers 5xx
    // itself when the API is down).
    const status: number = res.status;
    if (status !== 200 && status !== 503) {
      return { kind: "unreachable", message: `Cannot reach the API (HTTP ${status}).` };
    }
    const body = await res.json();
    return { kind: "reachable", db: body.db, lastCheck: body.lastCheck };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { kind: "unreachable", message: `Cannot reach the API (${reason}).` };
  }
}
