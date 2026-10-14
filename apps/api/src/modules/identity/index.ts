// Public API of the identity module. Code outside `modules/identity/` imports only this file.
export { type AuthHandler, type AuthRoutes, createAuthRoutes } from "./http/auth-routes.ts";
export { AUTH_BASE_PATH, type Auth, type AuthConfig } from "./infrastructure/better-auth.ts";
export {
  createIdentityPrismaClient,
  type IdentityPrismaClient,
} from "./infrastructure/identity-prisma-client.ts";
export { createIdentityModule, type IdentityModule, type IdentityModuleDeps } from "./module.ts";
