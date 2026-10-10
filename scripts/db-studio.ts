// Opens Prisma Studio for one module: `bun run db:studio <module> [studio flags]` (e.g. `bun run db:studio health`).
import { persistenceModules, requireEnv, runPrisma } from "./lib/db.ts";

const name = process.argv[2];
const module = persistenceModules.find((candidate) => candidate.name === name);
if (module === undefined) {
  const names = persistenceModules.map((candidate) => candidate.name).join(", ");
  console.error(`Usage: bun run db:studio <module>. Modules: ${names}`);
  process.exit(1);
}
await runPrisma(module, ["studio", ...process.argv.slice(3)], requireEnv("DATABASE_URL"));
