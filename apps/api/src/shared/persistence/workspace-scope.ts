/**
 * The workspace boundary (spec M3). Every query on a content table (a model with a `workspaceId`
 * column) filters by the workspace and skips soft-deleted rows. Build its `where` with `scoped(...)`
 * (or spread `workspaceScope(...)`): `bun run test:arch` reports a content-model query that does not.
 * Plain objects, no Prisma import: any module's repositories can use them.
 */
export type WorkspaceScope = { readonly workspaceId: string; readonly deletedAt: null };

/** The `where` fragment that keeps the rows of one workspace that are not deleted. */
export function workspaceScope(workspaceId: string): WorkspaceScope {
  return { workspaceId, deletedAt: null };
}

/**
 * `where` merged with the workspace scope. The scope wins over a `workspaceId` or `deletedAt` in `where`,
 * so a caller cannot widen it by mistake.
 */
export function scoped<Where extends object>(
  workspaceId: string,
  where?: Where,
): Omit<Where, keyof WorkspaceScope> & WorkspaceScope {
  return { ...where, ...workspaceScope(workspaceId) } as Omit<Where, keyof WorkspaceScope> & WorkspaceScope;
}
