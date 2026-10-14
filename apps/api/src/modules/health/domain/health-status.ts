export type DbStatus = "ok" | "down";

/**
 * What the health check reports. `lastCheck` is the time this check ran (API clock), not the time of
 * a stored `system_check` row: the check only reads.
 */
export type HealthStatus<Db extends DbStatus = DbStatus> = {
  readonly api: "ok";
  readonly db: Db;
  readonly lastCheck: Date;
};
