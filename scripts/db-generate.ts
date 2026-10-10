// Generates every module's Prisma client (gitignored). Needs no database. Runs on `bun install`.
import { persistenceModules, runPrisma } from "./lib/db.ts";

for (const module of persistenceModules) {
  await runPrisma(module, ["generate"], undefined);
}
