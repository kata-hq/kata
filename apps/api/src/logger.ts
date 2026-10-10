/**
 * Structured logs: one JSON object per line on stdout, `{ time, level, msg, ...fields }`.
 * Never put personal data in `msg` or `fields` (no emails, names, tokens, request bodies, query strings).
 */

export const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

export type LogValue =
  | string
  | number
  | boolean
  | null
  | readonly LogValue[]
  | { readonly [key: string]: LogValue };
export type LogFields = { readonly [key: string]: LogValue };

export interface Logger {
  debug(msg: string, fields?: LogFields): void;
  info(msg: string, fields?: LogFields): void;
  warn(msg: string, fields?: LogFields): void;
  error(msg: string, fields?: LogFields): void;
}

export type LoggerOptions = {
  /** Lines below this level are dropped. Default `info`. */
  readonly level?: LogLevel;
  /** Receives each line without the trailing newline. Default: stdout. */
  readonly write?: (line: string) => void;
  readonly now?: () => Date;
};

export function createLogger(options: LoggerOptions = {}): Logger {
  const minimum = LOG_LEVELS.indexOf(options.level ?? "info");
  const write = options.write ?? ((line: string) => process.stdout.write(`${line}\n`));
  const now = options.now ?? (() => new Date());

  const log = (level: LogLevel) => (msg: string, fields?: LogFields) => {
    if (LOG_LEVELS.indexOf(level) < minimum) return;
    const base = { time: now().toISOString(), level, msg };
    // `base` again last: a field can never overwrite `time`, `level` or `msg` (key order stays base first).
    write(JSON.stringify({ ...base, ...fields, ...base }));
  };

  return { debug: log("debug"), info: log("info"), warn: log("warn"), error: log("error") };
}
