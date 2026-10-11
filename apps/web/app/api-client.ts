import type { AppType } from "@kata/api";
import { hc } from "hono/client";

/** Typed client for the whole API (Hono RPC). Only the API's types are imported, never its code. */
export type ApiClient = ReturnType<typeof hc<AppType>>;

/**
 * The app calls the API on its own origin (`window.location.origin`): in dev, Vite proxies `/api` to it.
 * Tests pass a fake `fetch`.
 */
export function createApiClient(baseUrl: string, fetch?: typeof globalThis.fetch): ApiClient {
  return hc<AppType>(baseUrl, fetch ? { fetch } : {});
}
