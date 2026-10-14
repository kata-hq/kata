import type { Logger } from "../../logger.ts";
import { type AuthRoutes, createAuthRoutes } from "./http/auth-routes.ts";
import { type Auth, type AuthConfig, createAuth } from "./infrastructure/better-auth.ts";
import type { IdentityPrismaClient } from "./infrastructure/identity-prisma-client.ts";

export type IdentityModuleDeps = {
  /** The identity module's own client (`createIdentityPrismaClient`). The caller owns its lifecycle. */
  readonly prisma: IdentityPrismaClient;
  readonly logger: Logger;
  readonly auth: AuthConfig;
};

export type IdentityModule = {
  readonly auth: Auth;
  /** Better Auth's endpoints, mounted at `/api/auth`. */
  readonly authRoutes: AuthRoutes;
};

/** Composition root of the identity module: the only place that creates its objects. */
export function createIdentityModule({ prisma, logger, auth: config }: IdentityModuleDeps): IdentityModule {
  const auth = createAuth({ prisma, logger, ...config });
  return { auth, authRoutes: createAuthRoutes(auth) };
}
