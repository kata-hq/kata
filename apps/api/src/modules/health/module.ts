import type { Logger } from "../../logger.ts";
import { type HealthService, SystemCheckHealthService } from "./application/health-service.ts";
import { createHealthRoutes, type HealthRoutes } from "./http/health-routes.ts";
import type { HealthPrismaClient } from "./infrastructure/health-prisma-client.ts";
import { PrismaSystemCheckRepository } from "./infrastructure/prisma-system-check-repository.ts";

export type HealthModuleDeps = {
  /** The health module's own client (`createHealthPrismaClient`). The caller owns its lifecycle. */
  readonly prisma: HealthPrismaClient;
  readonly logger: Logger;
};

export type HealthModule = {
  readonly service: HealthService;
  readonly routes: HealthRoutes;
};

/** Composition root of the health module: the only place that creates its classes. */
export function createHealthModule({ prisma, logger }: HealthModuleDeps): HealthModule {
  const service = new SystemCheckHealthService(new PrismaSystemCheckRepository(prisma), logger);
  return { service, routes: createHealthRoutes(service) };
}
