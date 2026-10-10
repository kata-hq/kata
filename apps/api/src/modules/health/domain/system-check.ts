import type { Option, Result } from "@kata/shared";
import type { RepositoryError } from "../../../shared/persistence/repository-error.ts";

export const SYSTEM_CHECK_STATUSES = ["ok", "degraded", "down"] as const;
export type SystemCheckStatus = (typeof SYSTEM_CHECK_STATUSES)[number];

/** The result of one health check, kept for history. */
export type SystemCheck = {
  readonly id: string;
  readonly status: SystemCheckStatus;
  readonly checkedAt: Date;
};

export function isSystemCheckStatus(value: string): value is SystemCheckStatus {
  return (SYSTEM_CHECK_STATUSES as readonly string[]).includes(value);
}

export type RecordSystemCheck = {
  readonly status: SystemCheckStatus;
  readonly checkedAt?: Date;
};

export interface SystemCheckRepository {
  record(input: RecordSystemCheck): Promise<Result<SystemCheck, RepositoryError>>;
  /** `Err` of type `not-found` when no check has this id. */
  findById(id: string): Promise<Result<SystemCheck, RepositoryError>>;
  findLatest(): Promise<Result<Option<SystemCheck>, RepositoryError>>;
}
