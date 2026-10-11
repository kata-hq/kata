// Claude Code PostToolUse hook (Edit|Write): runs Biome on the changed file and the typecheck of its package.
// Exit 2 with the errors on stderr feeds them back to Claude. Anything else (skipped file, bad input) exits 0.

import { existsSync } from "node:fs";
import { editedFile, planEdit, tail } from "./lib.ts";

const root = process.env["CLAUDE_PROJECT_DIR"] ?? process.cwd();
const MAX_LINES = 60;

const input: unknown = await Bun.stdin.json().catch(() => null);
const file = editedFile(input);
if (file === null) process.exit(0);

const plan = planEdit(root, file);
if (plan.kind === "skip" || !existsSync(`${root}/${plan.file}`)) process.exit(0);

async function run(cmd: string[], cwd: string): Promise<string | null> {
  const proc = Bun.spawn(cmd, {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env, NO_COLOR: "1" },
  });
  const [out, err, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  return code === 0 ? null : tail(`${out}${err}`, MAX_LINES);
}

// Local binaries only: without `bun install` there is nothing to check against, and bunx would download.
const bin = (name: string) => `${root}/node_modules/.bin/${name}`;
if (!existsSync(bin("biome"))) process.exit(0);

const biome = run([bin("biome"), "check", "--no-errors-on-unmatched", "--colors=off", plan.file], root);
const { typecheck } = plan;
async function runTypecheck(): Promise<string | null> {
  if (typecheck === null) return null;
  if (typecheck.kind === "project") return run([bin("tsc"), "--noEmit", "-p", typecheck.tsconfig], root);
  const pkg: { scripts?: Record<string, string> } = await Bun.file(
    `${root}/${typecheck.dir}/package.json`,
  ).json();
  if (pkg.scripts?.["typecheck"] === undefined) return null;
  return run(["bun", "run", "typecheck"], `${root}/${typecheck.dir}`);
}
const types = runTypecheck();

const [biomeErrors, typeErrors] = await Promise.all([biome, types]);
if (biomeErrors === null && typeErrors === null) process.exit(0);

const where = typecheck === null ? "" : typecheck.kind === "package" ? typecheck.dir : typecheck.tsconfig;
if (biomeErrors !== null) {
  console.error(
    `biome check ${plan.file} failed (\`bun run format\` applies the safe fixes):\n${biomeErrors}`,
  );
}
if (typeErrors !== null) console.error(`typecheck of ${where} failed:\n${typeErrors}`);
process.exit(2);
