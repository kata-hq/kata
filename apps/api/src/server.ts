import { createApp } from "./app.ts";
import { loadEnv } from "./env.ts";
import { createLogger } from "./logger.ts";

// Entry point: env → app → HTTP server. A bad env exits with code 1 before anything starts.
const env = loadEnv(process.env, createLogger());
const logger = createLogger({ level: env.LOG_LEVEL });
const { app, close } = createApp(env, logger);

// `bun --hot` runs this file again on each change and `Bun.serve` then reloads the same server.
// This state survives the reload: close the previous database clients and register signal handlers once.
type Running = { close: () => Promise<void>; stop: () => Promise<void> };
const hot = globalThis as { kataApi?: Running };
await hot.kataApi?.close();

const server = Bun.serve({ port: env.API_PORT, fetch: app.fetch });
logger.info("api started", { port: server.port ?? env.API_PORT });

if (hot.kataApi === undefined) {
  let stopping = false;
  const shutdown = async (signal: string) => {
    if (stopping || hot.kataApi === undefined) return;
    stopping = true;
    logger.info("api stopping", { signal });
    await hot.kataApi.stop();
    await hot.kataApi.close();
    logger.info("api stopped");
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}
hot.kataApi = { close, stop: () => server.stop() };
