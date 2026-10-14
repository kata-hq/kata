import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import type { Logger } from "../../../logger.ts";
import type { IdentityPrismaClient } from "./identity-prisma-client.ts";

export type AuthConfig = {
  /** Signs cookies and tokens (`BETTER_AUTH_SECRET`). */
  readonly secret: string;
  /** Public origin of the app (`BETTER_AUTH_URL`). Requests from another origin are refused. */
  readonly baseURL: string;
};

export type AuthDeps = AuthConfig & {
  readonly prisma: IdentityPrismaClient;
  readonly logger: Logger;
};

/** Where Better Auth's endpoints live: `/api/auth/sign-up/email`, `/api/auth/sign-in/email`, … */
export const AUTH_BASE_PATH = "/api/auth";

export const MIN_PASSWORD_LENGTH = 8;

/**
 * Better Auth with email + password, on the identity Prisma client (spec 10.2, M11).
 * Sessions are cookies; Postgres generates the ids (UUIDv7).
 */
export function createAuth({ prisma, logger, secret, baseURL }: AuthDeps) {
  return betterAuth({
    secret,
    baseURL,
    basePath: AUTH_BASE_PATH,
    database: prismaAdapter(prisma, { provider: "postgresql" }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: MIN_PASSWORD_LENGTH,
      maxPasswordLength: 128,
      autoSignIn: true,
    },
    user: {
      additionalFields: {
        // Database defaults (Europe/Paris, fr); not settable at sign-up.
        timezone: { type: "string", required: false, input: false },
        locale: { type: "string", required: false, input: false },
      },
    },
    session: { modelName: "authSession" },
    account: { modelName: "authAccount" },
    verification: { modelName: "authVerification" },
    advanced: {
      database: { generateId: false },
    },
    telemetry: { enabled: false },
    logger: { level: "warn", log: authLog(logger) },
  });
}

export type Auth = ReturnType<typeof createAuth>;

/**
 * Better Auth's log handler. Its messages can quote user input (an email), so only the level and the
 * error class reach our logs.
 */
export function authLog(logger: Logger) {
  return (level: "debug" | "info" | "warn" | "error", _message: string, ...args: unknown[]): void => {
    const error = args.find((arg): arg is Error => arg instanceof Error);
    const fields = error === undefined ? {} : { error: error.name };
    if (level === "error") logger.error("auth error", fields);
    else if (level === "warn") logger.warn("auth warning", fields);
  };
}
