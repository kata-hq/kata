# Kata

Kata is a "second brain" for Licence (bachelor) students: courses, timetable, tasks, exams, study planning and notes in one place. The product spec (French) is in `docs/product/`. The project is at the **foundation** stage: tooling, guardrails and the module pattern exist; product features do not yet.

## Stack

Bun 1.4 workspaces, TypeScript 7 strict. API: Hono 4 + Hono RPC, Zod, Prisma 7 with PostgreSQL 18 (one schema per module). Web: React 19, React Router 8 (SPA mode), Vite 8, StyleX, Base UI. Tooling: Biome 2 with GritQL guardrail plugins, `bun:test`, Playwright.

## Module map

- `apps/api/src/modules/<module>/`: backend modules (`domain/`, `application/`, `infrastructure/`, `http/`, `prisma/`, `module.ts`, `index.ts`). Today: `health` (reference implementation).
- Planned backend modules and what each may depend on: `platform` (nothing), `identity` → platform, `academic` → identity, platform, `work` → academic, platform, `notes` → academic, platform, `planning` → work, academic, platform. Any other direction is forbidden. Graph in `tests/architecture/module-graph.ts`.
- `apps/web/app/modules/<module>/`: frontend modules (components, API calls through `app/api-client.ts`).
- `apps/e2e`: Playwright tests.
- `packages/shared` (Result, Option, common types), `packages/design-system` (tokens, themes, components), `packages/config` (tsconfig, Biome base, GritQL plugins), `packages/planner` (the pure planner: no database, no clock, no network; `now` is an input), `packages/capture-parser` (pure quick capture parser: no I/O, "now" and data are inputs), `packages/time` (Temporal and the local time ↔ UTC helpers, spec M7).
- `scripts/`: root Bun scripts (check, db, isolated instances, Claude Code hooks). `tests/architecture/`: architecture tests.

## Commands

| Command | Does |
|---|---|
| `bun run dev` | API + web with the ports and database of `.env` |
| `bun run dev:isolated` | API + web for this worktree: own ports, own database (`--reset` to recreate it) |
| `bun run check` | Biome, typecheck, unit tests + 90% coverage gate, integration tests, architecture tests. Must pass before a PR. |
| `bun run e2e` | Playwright against its own isolated instance |
| `bun run db:up` / `db:migrate` / `db:reset` / `db:seed` / `db:studio` / `db:generate` | Postgres container, migrations of every module in order, reset, dev data, Prisma Studio, Prisma clients |
| `bun run docker:build` / `docker:up` / `docker:down` | production images of the API and web, run them with compose |
| `bun run format` | Biome safe fixes and formatting |

## Hard rules

- **Design system.** Apps style only through `@kata/design-system` components. No CSS files, CSS modules, Tailwind, CSS-in-JS, `style=` or string `className=`. Apps may call `stylex.create` only with token values. Need a new look? Add a variant or a component to the design system. Enforced by Biome and architecture tests.
- **Repositories.** Services (`application/`) depend on repository interfaces declared in `domain/`. Prisma is used only in `infrastructure/`. Expected failures are returned as `Result`s, not thrown.
- **Module boundaries.** Import another module only through its `index.ts`, along the allowed directions. A module uses only its own Prisma client and schema. Cross-module foreign keys go downward only (migration order), written in SQL.
- **Web → API.** `apps/web` imports `@kata/api` with `import type` only.
- A guardrail failure message says how to fix it. Do not silence a guardrail without a reason and a reviewer's agreement.

## Process

Follow "Issues, branches and PRs" in `docs/workflow.md`: one issue per PR, branch `<type>/<issue title>`, one-line commits `type(scope): description` with no body or trailers, `bun run check` (and `bun run e2e` for visible changes) before the PR. There is no human review: squash-merge your own PR once CI (`check`, `e2e`, `docker`) passes. Skills `plan-issue`, `build-issue` and `review-pr` cover each step for agents. Work in your own git worktree and use `bun run dev:isolated`.

Hooks (`.claude/settings.json`): after each edit, Biome and the package typecheck run on the changed file; before you stop, `bun run check` must pass. See `docs/workflow.md`.

Personal data (RGPD): any new table or column with personal data must be added to the register in `docs/database.md`.

## Which doc to read

| Task | Read |
|---|---|
| Module boundaries, dependency graph, guardrails | `docs/architecture.md` |
| Add or change a backend or frontend module | `docs/module-pattern.md` |
| Any UI work, a new component or variant | `docs/design-system.md` |
| Tables, migrations, seeds, RGPD register | `docs/database.md` |
| Writing tests, coverage, e2e | `docs/testing.md` |
| Worktrees, isolated instances, Docker images, agent hooks and skills | `docs/workflow.md` |
| What the product should do | `docs/product/` |
