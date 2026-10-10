// Public API of the health module. Code outside `modules/health/` imports only this file.
export type { HealthService } from "./application/health-service.ts";
export type { DbStatus, HealthStatus } from "./domain/health-status.ts";
export { createHealthRoutes, type HealthRoutes } from "./http/health-routes.ts";
export {
  createHealthPrismaClient,
  type HealthPrismaClient,
} from "./infrastructure/health-prisma-client.ts";
export { createHealthModule, type HealthModule, type HealthModuleDeps } from "./module.ts";
