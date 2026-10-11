// Passes every guardrail: own internals, another module's index.ts, shared code, the module's own client.
import type { Logger } from "../../logger.ts";
import { createUnitOfWork } from "../../shared/persistence/unit-of-work.ts";
import { type AcademicService, createAcademicModule } from "../academic/index.ts";
import { TaskService } from "./application/task-service.ts";
import { createWorkPrismaClient } from "./infrastructure/work-prisma-client.ts";
import { PrismaTaskRepository } from "./infrastructure/prisma-task-repository.ts";

export type Deps = { logger: Logger; academic: AcademicService };
export const parts = [createUnitOfWork, createAcademicModule, TaskService, createWorkPrismaClient, PrismaTaskRepository];
