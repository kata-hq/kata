import { createLogger } from "../../../logger.ts";
import { createAuth } from "../infrastructure/better-auth.ts";
import { createIdentityPrismaClient } from "../infrastructure/identity-prisma-client.ts";

/** The dev account. Local databases only (`db:seed` refuses remote hosts). */
export const DEV_ACCOUNT = { email: "dev@kata.local", password: "kata-dev-password", name: "Dev Student" };

/** Dev data: one account with a hashed password. Replaces the existing dev account, so it can run again. */
export async function seedIdentity(databaseUrl: string): Promise<number> {
  const db = createIdentityPrismaClient(databaseUrl);
  try {
    await db.user.deleteMany({ where: { email: DEV_ACCOUNT.email } });
    // Better Auth hashes the password; the secret only signs cookies, which the seed does not use.
    const auth = createAuth({
      prisma: db,
      logger: createLogger({ level: "error" }),
      secret: "seed-only-secret-not-used-for-cookies-000",
      baseURL: "http://localhost",
    });
    await auth.api.signUpEmail({ body: DEV_ACCOUNT });
    return 1;
  } finally {
    await db.$disconnect();
  }
}
