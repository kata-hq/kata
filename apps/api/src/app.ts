import { Hono } from "hono";
import type { Env } from "./env.ts";
import type { Logger } from "./logger.ts";
import { createHealthModule, createHealthPrismaClient, type HealthRoutes } from "./modules/health/index.ts";
import type { AppEnv } from "./shared/http/app-env.ts";
import { errorHandler, notFound } from "./shared/http/errors.ts";
import { requestLog } from "./shared/http/request-log.ts";

export type AppRoutes = {
  readonly health: HealthRoutes;
};

/** The HTTP app: request log, shared error format, module routes under `/api/<module>`. */
export function buildApp(logger: Logger, routes: AppRoutes) {
  const app = new Hono<AppEnv>();
  app.use(requestLog(logger));
  app.onError(errorHandler(logger));
  app.notFound(notFound);
  // Keep `.route()` chained: the return type carries every route for Hono RPC (`AppType`).
  return app.route("/api/health", routes.health);
}

/** Type of the API for the web client: `hc<AppType>(baseUrl)`. */
export type AppType = ReturnType<typeof buildApp>;

export type RunningApp = {
  readonly app: AppType;
  /** Closes every database client. Call it on shutdown. */
  readonly close: () => Promise<void>;
};

/** The app-level composition root: database clients → modules → app. The only place that wires modules. */
export function createApp(env: Env, logger: Logger): RunningApp {
  const healthPrisma = createHealthPrismaClient(env.DATABASE_URL);
  const health = createHealthModule({ prisma: healthPrisma });

  return {
    app: buildApp(logger, { health: health.routes }),
    close: async () => {
      await healthPrisma.$disconnect();
    },
  };
}
