import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../prisma/generated/client.ts";

export type HealthPrismaClient = PrismaClient;

/** The health module's own Prisma client. Same database as every module; its tables live in schema `health`. */
export function createHealthPrismaClient(databaseUrl: string): HealthPrismaClient {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }, { schema: "health" }) });
}
