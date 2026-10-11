// `bun run check`: every gate a change must pass, in order, stopping at the first failure.
// Prints one summary line per step so the failing gate is obvious at the end of a long log.

type Step = { readonly name: string; readonly script: string; readonly fix: string };

const STEPS: readonly Step[] = [
  {
    name: "biome (lint + format + guardrail plugins)",
    script: "lint",
    fix: "bun run format, then fix the rest by hand",
  },
  { name: "typecheck", script: "typecheck", fix: "fix the type errors above" },
  {
    name: "unit tests + coverage gate (90% lines per file)",
    script: "test:coverage",
    fix: "fix the failing tests, or add tests for the files listed under 90% lines",
  },
  {
    name: "integration tests",
    script: "test:int",
    fix: "needs Postgres: bun run db:up; then fix the failing tests",
  },
  { name: "architecture tests", script: "test:arch", fix: "follow the fix in each failure message" },
  { name: "script tests", script: "test:scripts", fix: "fix the failing tests in scripts/" },
];

const results: { step: Step; ok: boolean; seconds: number }[] = [];

for (const step of STEPS) {
  console.log(`\n▶ ${step.name} (bun run ${step.script})`);
  const started = performance.now();
  const proc = Bun.spawn(["bun", "run", step.script], { stdout: "inherit", stderr: "inherit" });
  const ok = (await proc.exited) === 0;
  results.push({ step, ok, seconds: (performance.now() - started) / 1000 });
  if (!ok) break;
}

console.log("\ncheck summary");
for (const { step, ok, seconds } of results) {
  console.log(`  ${ok ? "✓" : "✗"} ${step.name} (${seconds.toFixed(1)}s)`);
}
for (const step of STEPS.slice(results.length)) console.log(`  - ${step.name} (skipped)`);

const failed = results.find((result) => !result.ok);
if (failed) {
  console.log(`\ncheck failed at "${failed.step.name}". Fix: ${failed.step.fix}.`);
  process.exit(1);
}
console.log("\ncheck passed");
