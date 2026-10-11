// `bun run e2e`: picks free ports for a dedicated instance (`e2e-<worktree>`, database `kata_e2e_<worktree>`),
// then runs Playwright. Playwright starts that instance itself (see `webServer` in playwright.config.ts).
// Extra arguments go to `playwright test`, e.g. `bun run e2e --headed`.
import { instanceName, resolveInstance } from "../../scripts/lib/instance.ts";

const name = `e2e-${instanceName(process.env)}`;
// Ports from the shell or `.env` are ignored: e2e must not collide with a running dev server.
const instance = await resolveInstance(name, {});

const playwright = Bun.spawn(["bun", "x", "playwright", "test", ...process.argv.slice(2)], {
  cwd: import.meta.dir,
  env: {
    ...process.env,
    KATA_E2E_INSTANCE: instance.name,
    KATA_E2E_API_PORT: String(instance.apiPort),
    KATA_E2E_WEB_PORT: String(instance.webPort),
  },
  stdio: ["inherit", "inherit", "inherit"],
});
process.on("SIGINT", () => playwright.kill("SIGINT"));
process.exit(await playwright.exited);
