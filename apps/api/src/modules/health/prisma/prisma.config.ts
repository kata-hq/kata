import { defineConfig } from "prisma/config";
import { prismaConfigUrl } from "../../../shared/persistence/database-url.ts";

// Run through the root scripts (db:migrate, db:generate, db:studio), which pass DATABASE_URL.
export default defineConfig({
  schema: "schema.prisma",
  migrations: { path: "migrations" },
  datasource: { url: prismaConfigUrl("health") },
});
