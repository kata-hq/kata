// Starts one isolated instance of the app: own ports, own database on the shared Postgres container.
//   bun run dev:isolated            name = git worktree folder (or INSTANCE), database kata_<name>
//   bun run dev:isolated --reset    drop the database first, then migrate and seed it again
// API_PORT / WEB_PORT set in the shell force the ports. Values in `.env` do not (they are the main
// checkout's ports), so this script runs with `bun --no-env-file` and reads `.env` itself.
import { fileURLToPath } from "node:url";
import { dropDatabase, isServerReachable } from "../apps/api/src/shared/persistence/database-admin.ts";
import { migrateAll } from "./db-migrate-all.ts";
import { seedAll } from "./db-seed.ts";
import { assertLocalDatabase } from "./lib/db.ts";
import { readEnvFile } from "./lib/env-file.ts";
import { type Instance, instanceName, resolveInstance } from "./lib/instance.ts";

const rootDir = fileURLToPath(new URL("..", import.meta.url));
const READY_TIMEOUT_MS = 120_000;

type Child = { readonly label: string; readonly process: Bun.Subprocess };

const reset = process.argv.includes("--reset");
const fileEnv = readEnvFile(`${rootDir}.env`);
// `.env` gives the Postgres server; the shell can change anything except the ports (see above).
const dbEnv = { ...fileEnv, ...process.env };
const instance = await resolveInstance(instanceName(process.env), {
  ...dbEnv,
  API_PORT: process.env["API_PORT"],
  WEB_PORT: process.env["WEB_PORT"],
});

assertLocalDatabase(instance.databaseUrl);
console.log(`▸ instance ${instance.name}: database ${new URL(instance.databaseUrl).pathname.slice(1)}`);
await prepareDatabase(instance, dbEnv);

const childEnv = {
  ...dbEnv,
  INSTANCE: instance.name,
  DATABASE_URL: instance.databaseUrl,
  TEST_DATABASE_URL: instance.testDatabaseUrl,
  API_PORT: String(instance.apiPort),
  WEB_PORT: String(instance.webPort),
  API_URL: `http://localhost:${instance.apiPort}`,
};
const children: Child[] = [
  start("api", ["bun", "--hot", "src/server.ts"], `${rootDir}apps/api`),
  start("web", ["bun", "--bun", "react-router", "dev"], `${rootDir}apps/web`),
];

let stopping = false;
process.on("SIGINT", () => void stop(130));
process.on("SIGTERM", () => void stop(143));
for (const child of children) {
  void child.process.exited.then((code) => {
    if (stopping) return;
    console.error(`✖ ${child.label} exited with code ${code}; stopping the instance`);
    void stop(code === 0 ? 1 : code);
  });
}

await Promise.all([
  waitFor(`http://localhost:${instance.apiPort}/api/health`),
  waitFor(`http://localhost:${instance.webPort}/`),
]);
console.log(`
✔ instance ${instance.name} is running (Ctrl+C to stop)
  web       http://localhost:${instance.webPort}
  api       http://localhost:${instance.apiPort}/api/health
  database  ${instance.databaseUrl}
  tests     TEST_DATABASE_URL=${instance.testDatabaseUrl}
`);

/** Starts Postgres if needed, then creates, migrates and (when new or reset) seeds the database. */
async function prepareDatabase(target: Instance, env: Record<string, string | undefined>): Promise<void> {
  if (!(await isServerReachable(target.databaseUrl))) {
    console.log("▸ Postgres is not reachable: starting it (docker compose up postgres)");
    const up = Bun.spawn(["docker", "compose", "up", "-d", "--wait", "postgres"], {
      cwd: rootDir,
      env,
      stdio: ["inherit", "inherit", "inherit"],
    });
    if ((await up.exited) !== 0) throw new Error("docker compose up failed: is Docker running?");
  }
  if (reset) await dropDatabase(target.databaseUrl);
  const created = await migrateAll(target.databaseUrl);
  if (created) await seedAll(target.databaseUrl);
}

function start(label: string, command: string[], cwd: string): Child {
  // Own process group per child is not needed: Ctrl+C reaches them, and `stop` forwards SIGTERM.
  return {
    label,
    process: Bun.spawn(command, { cwd, env: childEnv, stdio: ["ignore", "inherit", "inherit"] }),
  };
}

async function stop(code: number): Promise<never> {
  if (!stopping) {
    stopping = true;
    console.log(`\n▸ stopping instance ${instance.name}`);
    for (const child of children) child.process.kill("SIGTERM");
    const timeout = setTimeout(() => {
      for (const child of children) child.process.kill("SIGKILL");
    }, 5_000);
    await Promise.all(children.map((child) => child.process.exited));
    clearTimeout(timeout);
  }
  process.exit(code);
}

async function waitFor(url: string): Promise<void> {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (stopping) return;
    try {
      const response = await fetch(url);
      if (response.status < 500) return;
    } catch {
      // Not listening yet.
    }
    await Bun.sleep(250);
  }
  console.error(`✖ ${url} did not answer within ${READY_TIMEOUT_MS / 1000}s`);
  await stop(1);
}
