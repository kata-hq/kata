import type { MiddlewareHandler } from "hono";
import type { Logger } from "../../logger.ts";
import type { AppEnv } from "./app-env.ts";

export const REQUEST_ID_HEADER = "x-request-id";

/**
 * Gives each request an id (`c.var.requestId`, `x-request-id` header) and logs one line when it ends:
 * method, path, status, durationMs, requestId. The path has no query string; headers, IP and bodies
 * are never logged (no personal data).
 */
export function requestLog(logger: Logger): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const requestId = crypto.randomUUID();
    const start = performance.now();
    c.set("requestId", requestId);
    c.header(REQUEST_ID_HEADER, requestId);

    await next();

    logger.info("request", {
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      durationMs: Math.round((performance.now() - start) * 100) / 100,
      requestId,
    });
  };
}
