import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../prisma/generated/client.ts";

export type HealthPrismaClient = PrismaClient;

/** A health check must answer even when the database host drops packets, so connecting may not hang. */
const CONNECTION_TIMEOUT_MS = 2_000;

/** The health module's own Prisma client. Same database as every module; its tables live in schema `health`. */
export function createHealthPrismaClient(databaseUrl: string): HealthPrismaClient {
  return new PrismaClient({
    adapter: new PrismaPg(
      { connectionString: databaseUrl, connectionTimeoutMillis: CONNECTION_TIMEOUT_MS },
      { schema: "health" },
    ),
  });
}
