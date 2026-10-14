import { Hono } from "hono";
import type { AppEnv } from "../../../shared/http/app-env.ts";

/** The part of Better Auth the routes need: its fetch handler. */
export type AuthHandler = { readonly handler: (request: Request) => Promise<Response> };

/**
 * Better Auth's endpoints, mounted at `/api/auth` by `app.ts`. Better Auth reads the full request URL,
 * so its base path is `/api/auth` too. The web app calls them with the Better Auth client, not Hono RPC.
 */
export function createAuthRoutes(auth: AuthHandler) {
  return new Hono<AppEnv>().on(["GET", "POST"], "/*", (c) => auth.handler(c.req.raw));
}

export type AuthRoutes = ReturnType<typeof createAuthRoutes>;
