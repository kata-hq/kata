export type DbStatus = "ok" | "down";

/** What the health check reports. `lastCheck` is the time of this check. */
export type HealthStatus<Db extends DbStatus = DbStatus> = {
  readonly api: "ok";
  readonly db: Db;
  readonly lastCheck: Date;
};
