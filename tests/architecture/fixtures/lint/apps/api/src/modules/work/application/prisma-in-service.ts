// Breaks: no-prisma-in-core.grit (@prisma/*, own generated client, own Prisma infrastructure in a service)
import type { Prisma } from "@prisma/client";
import type { PrismaClient } from "../prisma/generated/client.ts";
import { PrismaTaskRepository } from "../infrastructure/prisma-task-repository.ts";

export type Deps = { db: PrismaClient; input: Prisma.TaskCreateInput; repository: PrismaTaskRepository };
