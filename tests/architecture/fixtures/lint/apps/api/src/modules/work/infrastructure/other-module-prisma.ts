// Breaks: module-prisma-isolation.grit (another module's generated client and Prisma client factory)
import type { PrismaClient } from "../../academic/prisma/generated/client.ts";
import { createAcademicPrismaClient } from "../../academic/infrastructure/academic-prisma-client.ts";

export type Client = PrismaClient;
export const create = createAcademicPrismaClient;
