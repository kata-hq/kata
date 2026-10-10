import type { MiddlewareHandler } from "hono";
import type { Logger } from "../../logger.ts";
import type { AppEnv } from "./app-env.ts";

export const REQUEST_ID_HEADER = "x-request-id";

/**
 * Gives each request an id (`c.var.requestId`, `x-request-id` header) and logs one line when it ends:
 * method, route, status, durationMs, requestId. `route` is the matched route pattern (`/api/users/:id`),
 * never the real path, so ids or personal data in a path do not reach the logs; `unmatched` when no route
 * matched. Headers, query strings, IP and bodies are never logged.
 */
export function requestLog(logger: Logger): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const requestId = crypto.randomUUID();
    const start = performance.now();
    // Before `next()`, `routePath` is this middleware's own pattern. After it, the pattern of the last
    // handler that ran; still the same one when no route matched.
    const ownRoute = c.req.routePath;
    c.set("requestId", requestId);
    c.header(REQUEST_ID_HEADER, requestId);

    await next();

    logger.info("request", {
      method: c.req.method,
      route: c.req.routePath === ownRoute ? "unmatched" : c.req.routePath,
      status: c.res.status,
      durationMs: Math.round((performance.now() - start) * 100) / 100,
      requestId,
    });
  };
}
