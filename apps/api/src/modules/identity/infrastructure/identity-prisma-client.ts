import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../prisma/generated/client.ts";

export type IdentityPrismaClient = PrismaClient;

/** The identity module's own Prisma client. Same database as every module; its tables live in schema `identity`. */
export function createIdentityPrismaClient(databaseUrl: string): IdentityPrismaClient {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }, { schema: "identity" }),
  });
}
