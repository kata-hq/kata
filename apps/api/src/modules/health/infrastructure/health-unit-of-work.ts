import { createUnitOfWork, type UnitOfWork } from "../../../shared/persistence/unit-of-work.ts";
import type { SystemCheckRepository } from "../domain/system-check.ts";
import type { HealthPrismaClient } from "./health-prisma-client.ts";
import { PrismaSystemCheckRepository } from "./prisma-system-check-repository.ts";

export type HealthRepositories = {
  readonly systemChecks: SystemCheckRepository;
};

/** Health repositories bound to one transaction of the health client. */
export function createHealthUnitOfWork(client: HealthPrismaClient): UnitOfWork<HealthRepositories> {
  return createUnitOfWork(client, (tx) => ({ systemChecks: new PrismaSystemCheckRepository(tx) }));
}
