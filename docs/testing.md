# Testing

All tests use `bun:test`. Run everything a change must pass with one command:

```sh
bun run check
```

It runs, in order, and stops at the first failure with a summary of which step failed and how to fix it:

1. `bun run lint`: Biome check (lint, format, import order, guardrail plugins).
2. `bun run typecheck`: `tsc` for every workspace, `scripts/` and `tests/architecture/`.
3. `bun run test:coverage`: unit tests of every workspace with the coverage gate (90% lines per file).
4. `bun run test:int`: integration tests (needs Postgres: `bun run db:up`).
5. `bun run test:arch`: architecture tests.
6. `bun run test:scripts`: unit tests of the root `scripts/` (no coverage gate).

## Unit tests

- Files: `*.test.ts` / `*.test.tsx` next to the code.
- `bun run test` (or `bun run test:unit`) runs `bun test` in each workspace. Each workspace has its own `bunfig.toml` (the design system and the web app preload happy-dom and the StyleX compiler from `test/`).
- No database, no network. Fake the dependencies through the constructor (a fake repository, a fake Prisma delegate, a logger that collects lines).

### Quick capture parser (`packages/capture-parser`)

- Table tests per rule (`dates.test.ts`, `task-types.test.ts`, `courses.test.ts`, `title.test.ts`) and one end-to-end table, `src/cases.test.ts`: a line and its full expected result (course, type, date, time, title), with a fixed reference instant and time zone.
- Property tests (`src/properties.test.ts`): lines generated from a seeded pseudo-random generator; the rules (C1, C6, K-R7, never throws) must hold for each. A failure prints the seed, the run and the line: add that line to `cases.test.ts`.
- Rule C7, every parsing error found in the beta becomes a case: add the reported line to `cases.test.ts` with the result it should give, see it fail, then fix the parser. Never delete a row to make the table pass; change a row only when the expected result was wrong (say why in the PR).

## Integration tests

- Files: `*.int.test.ts`, in `apps/api`. They use a real Postgres database: `TEST_DATABASE_URL`, whose name must end in `_test`.
- `bun run test:int` (root `bunfig.int.toml`) first creates and migrates the test database (`scripts/ensure-test-db.ts`). `resetTestDatabase` empties the tables between tests and refuses any database whose name does not end in `_test`.

## Coverage

- Gate: **90% of lines in every file** the unit tests load. `bun run test:coverage` runs `bun test --coverage` in each workspace; each `bunfig.toml` sets `coverageThreshold = { lines = 0.9, functions = 0 }`. Bun checks the threshold file by file (a file at 68% fails the run even when the workspace total is 92%) and exits non-zero without a message: look for the file under 90% in the coverage table. `functions = 0` because Bun otherwise applies the threshold to functions too.
- The gate counts unit tests only. In `apps/api`, Prisma repositories also get a unit test of their mapping with a fake client; their queries are covered by the integration tests.
- Excluded from coverage (`coveragePathIgnorePatterns`), and why:
  - `apps/api`: `**/generated/**` (generated Prisma client), `src/server.ts` (entry file), `src/shared/persistence/database-admin.ts` and `test-database.ts` (database tooling for scripts and test setup, exercised by the integration run).
  - `apps/web`: `test/**` (test setup), `app/entry.server.tsx` (entry file).
  - `packages/design-system`: `test/**` (test setup).
  - Each workspace also ignores the other workspaces' files it loads, so each file counts once, in its own workspace.
- Bun only measures files that the tests load. A file that no test imports does not lower the number, so add a test with every new module or component.

## Architecture tests

`bun run test:arch` runs `tests/architecture/*.test.ts`. They check the rules that Biome cannot (see [architecture.md](architecture.md#guardrails)) and test the Biome guardrails themselves.

## Guardrails

Every architecture and styling rule is enforced by a tool, and each has a fixture that breaks it:

- `tests/architecture/fixtures/lint/`: one file per Biome rule (GritQL plugin or `noRestrictedImports`), laid out like the repo (`apps/web/app/…`, `apps/api/src/modules/work/…`) so the plugins' path scoping applies, plus `allowed.*` files that must stay clean. `lint-rules.test.ts` lints them with the real `biome.json` (copied to a temp dir without the fixtures exclusion) and checks each expected diagnostic and its fix message.
- `tests/architecture/fixtures/arch/`: a small fake repo per architecture test (stray stylesheets, modules that break the graph, a pure package with I/O). `architecture.test.ts` runs each rule on the real repo (no violation) and on its fixture (each violation reported).
- The fixtures are excluded from `bun run lint` (`files.includes` in `biome.json`) and from `tsc` (`tests/architecture/tsconfig.json`).

To add a guardrail: write the rule (a `.grit` file registered in `biome.json`, or a function in `tests/architecture/rules.ts`), add a fixture that breaks it, add the expected diagnostic to the test, and list the rule in [architecture.md](architecture.md#guardrails). The failure message must say how to fix the problem.

## End-to-end tests

Playwright 1.64, Chromium only, in `apps/e2e` (`@kata/e2e`). Specs: `apps/e2e/tests/*.spec.ts`.

```sh
bun run e2e:install   # once per machine (and in CI): download Chromium for Playwright
bun run e2e           # extra arguments go to `playwright test`, e.g. bun run e2e --headed
```

- Nothing needs to be running except Docker. `bun run e2e` (`apps/e2e/run.ts`) picks free ports for the instance `e2e-<worktree>`, then runs Playwright. Its `webServer` starts that instance with `dev:isolated --reset`: database `kata_e2e_<worktree>` dropped, migrated and seeded, then the API and the web dev server. Playwright stops it at the end. See [workflow.md](workflow.md#worktrees-and-isolated-instances).
- Run Playwright through `bun run e2e`, not `playwright test` directly: the config reads the ports that `run.ts` chose.
- The smoke test (`tests/smoke.spec.ts`) opens `/` and expects "API ok", "Database ok" and the last system check time, read from the database.
- The first page load can take a few seconds (Vite optimizes dependencies), so the first assertion waits up to 60 s.
- `apps/e2e` has no `test` / `test:coverage` script and the root `bunfig.toml` ignores `apps/e2e/**`, so `bun test`, `bun run test` and the coverage gate never run Playwright specs. `bun run check` does not run e2e; run it before a PR that changes the app.
- Failures keep a trace in `apps/e2e/test-results/` (`bun x playwright show-trace <file>` from `apps/e2e`).
