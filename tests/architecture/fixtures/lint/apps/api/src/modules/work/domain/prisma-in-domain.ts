// Breaks: no-prisma-in-core.grit (a domain type built on the generated Prisma row)
import type { Task as TaskRow } from "../prisma/generated/client.ts";

export type Task = TaskRow;
