import type { ErrorHandler, NotFoundHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { Logger } from "../../logger.ts";
import type { AppEnv } from "./app-env.ts";

/** The body of every error response. */
export type ApiError = { readonly error: { readonly code: string; readonly message: string } };

export function apiError(code: string, message: string): ApiError {
  return { error: { code, message } };
}

const CODES: Partial<Record<number, string>> = {
  400: "bad_request",
  401: "unauthorized",
  403: "forbidden",
  404: "not_found",
  409: "conflict",
  422: "unprocessable",
};

/**
 * `HTTPException` → its status, in the shared format. Anything else is a bug: logged with its stack,
 * answered with a generic 500 (no stack or message leaks to the client).
 */
export function errorHandler(logger: Logger): ErrorHandler<AppEnv> {
  return (error, c) => {
    if (error instanceof HTTPException) {
      const status = error.status as ContentfulStatusCode;
      return c.json(apiError(CODES[status] ?? "http_error", error.message || "Request failed"), status);
    }
    logger.error("unhandled error", {
      requestId: c.get("requestId") ?? null,
      error: error.name,
      stack: error.stack ?? null,
    });
    return c.json(apiError("internal_error", "Internal server error"), 500);
  };
}

export const notFound: NotFoundHandler<AppEnv> = (c) => c.json(apiError("not_found", "Route not found"), 404);
