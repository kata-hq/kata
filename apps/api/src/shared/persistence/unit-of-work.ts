import type { Result } from "@kata/shared";

/** The part of a module's Prisma client the unit of work needs. */
export type TransactionalClient<Tx> = {
  $transaction<R>(fn: (tx: Tx) => Promise<R>): Promise<R>;
};

export type UnitOfWork<Repositories> = {
  /** Runs `work` in one transaction. Commits on `Ok`, rolls back on `Err` or on a thrown error. */
  run<T, E>(work: (repositories: Repositories) => Promise<Result<T, E>>): Promise<Result<T, E>>;
};

/**
 * Builds a unit of work for one module: `repositories` creates that module's repositories bound to the
 * transaction client. A transaction never spans two modules (each module has its own client).
 */
export function createUnitOfWork<Tx, Repositories>(
  client: TransactionalClient<Tx>,
  repositories: (tx: Tx) => Repositories,
): UnitOfWork<Repositories> {
  return {
    async run<T, E>(work: (repositories: Repositories) => Promise<Result<T, E>>): Promise<Result<T, E>> {
      const rollback = new Rollback();
      try {
        return await client.$transaction(async (tx) => {
          const result = await work(repositories(tx));
          // Prisma rolls back only when the callback throws.
          if (!result.ok) {
            rollback.result = result;
            throw rollback;
          }
          return result;
        });
      } catch (error) {
        if (error === rollback && rollback.result !== undefined) return rollback.result as Result<T, E>;
        throw error;
      }
    },
  };
}

class Rollback extends Error {
  result: Result<unknown, unknown> | undefined;

  constructor() {
    super("Unit of work rolled back");
  }
}
