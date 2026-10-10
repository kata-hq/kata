import { none, type Option, Result, some } from "@kata/shared";
import { runQuery } from "../../../shared/persistence/prisma-errors.ts";
import type { RepositoryError } from "../../../shared/persistence/repository-error.ts";
import {
  isSystemCheckStatus,
  type RecordSystemCheck,
  type SystemCheck,
  type SystemCheckRepository,
} from "../domain/system-check.ts";
import type { Prisma, SystemCheck as SystemCheckRow } from "../prisma/generated/client.ts";

/** The module client or a transaction client from the unit of work. */
export type HealthDb = Prisma.TransactionClient;

export class PrismaSystemCheckRepository implements SystemCheckRepository {
  constructor(private readonly db: HealthDb) {}

  async record(input: RecordSystemCheck): Promise<Result<SystemCheck, RepositoryError>> {
    const data = {
      status: input.status,
      ...(input.checkedAt === undefined ? {} : { checkedAt: input.checkedAt }),
    };
    return Result.map(await runQuery(() => this.db.systemCheck.create({ data })), toDomain);
  }

  async findById(id: string): Promise<Result<SystemCheck, RepositoryError>> {
    return Result.map(
      await runQuery(() => this.db.systemCheck.findUniqueOrThrow({ where: { id } })),
      toDomain,
    );
  }

  async findLatest(): Promise<Result<Option<SystemCheck>, RepositoryError>> {
    const row = await runQuery(() => this.db.systemCheck.findFirst({ orderBy: { checkedAt: "desc" } }));
    return Result.map(row, (found) => (found === null ? none() : some(toDomain(found))));
  }
}

function toDomain(row: SystemCheckRow): SystemCheck {
  // Only this repository writes the column, so an unknown status is a bug, not an expected error.
  if (!isSystemCheckStatus(row.status)) throw new Error(`Unknown system check status "${row.status}"`);
  return { id: row.id, status: row.status, checkedAt: row.checkedAt };
}
