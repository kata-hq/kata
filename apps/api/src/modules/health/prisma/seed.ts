import { createHealthPrismaClient } from "../infrastructure/health-prisma-client.ts";

const HOUR = 60 * 60 * 1000;

/**
 * Dev data: one check per hour over the last three days, with a short degraded period and one outage.
 * Replaces the existing rows, so it can run again.
 */
export async function seedHealth(databaseUrl: string): Promise<number> {
  const db = createHealthPrismaClient(databaseUrl);
  try {
    const now = Date.now();
    const rows = Array.from({ length: 72 }, (_, index) => {
      const hoursAgo = 72 - index;
      return { status: statusFor(hoursAgo), checkedAt: new Date(now - hoursAgo * HOUR) };
    });
    await db.$transaction([db.systemCheck.deleteMany(), db.systemCheck.createMany({ data: rows })]);
    return rows.length;
  } finally {
    await db.$disconnect();
  }
}

function statusFor(hoursAgo: number): string {
  if (hoursAgo === 30) return "down";
  if (hoursAgo >= 27 && hoursAgo <= 33) return "degraded";
  return "ok";
}
