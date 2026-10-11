// Claude Code Stop hook: runs `bun run check` and blocks the stop (exit 2, summary on stderr) when it fails.
// Exits 0 at once when Claude is already continuing because of this hook (`stop_hook_active`),
// and when the worktree has nothing to check (clean tree, no commit ahead of origin/main).

import { stopHookActive, tail } from "./lib.ts";

const root = process.env["CLAUDE_PROJECT_DIR"] ?? process.cwd();

const input: unknown = await Bun.stdin.json().catch(() => null);
if (stopHookActive(input)) process.exit(0);

function git(...args: string[]): { code: number; out: string } {
  const proc = Bun.spawnSync(["git", ...args], { cwd: root, stderr: "ignore" });
  return { code: proc.exitCode, out: proc.stdout.toString().trim() };
}

const status = git("status", "--porcelain");
const ahead = git("rev-list", "--count", "origin/main..HEAD");
if (status.code === 0 && status.out === "" && ahead.code === 0 && ahead.out === "0") process.exit(0);

const proc = Bun.spawn(["bun", "run", "check"], {
  cwd: root,
  stdout: "pipe",
  stderr: "pipe",
  env: { ...process.env, NO_COLOR: "1" },
});
const [out, err, code] = await Promise.all([
  new Response(proc.stdout).text(),
  new Response(proc.stderr).text(),
  proc.exited,
]);
if (code === 0) process.exit(0);

console.error(`bun run check failed. Fix it before you stop.\n${tail(`${err}${out}`, 80)}`);
process.exit(2);
