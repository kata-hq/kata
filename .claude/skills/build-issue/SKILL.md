---
name: build-issue
description: Use to implement a ready kata-hq/kata issue end to end, from reading it to its squash-merged PR. Also used non-interactively by the GitHub Action.
---

# Build an issue

Process (pick up, claim, branch, commits, validate, PR, merge, Status) is in "Issues, branches and PRs" in `docs/workflow.md`. This skill adds the Kata specifics.

## Non-interactive

Do not ask the user anything. When you are blocked (unclear or contradicting acceptance criteria, a needed dependency that is not in the repo, a forbidden module direction, a product decision), comment on the issue with what blocks you and what you need, add the label `needs-human` (create the label once if it does not exist), push what you have if it is useful, and stop. Do not guess a product decision.

## Steps

1. Read the issue, its parent epic and the docs it touches (`CLAUDE.md`, table "Which doc to read"). Check it is not blocked.
2. Plan: the files per layer (`domain/`, `application/`, `infrastructure/`, `http/`, `prisma/`, web module, design system) and the tests per acceptance criterion. Stay inside "Modules touched" and "Out of scope".
3. Work in your own git worktree, never in the main checkout. Copy `.env` from the main checkout if the worktree has none, run `bun install`, and use `bun run dev:isolated` (own ports and database) and `bun run e2e` (own instance).
4. Implement with small one-line commits. The post-edit hook runs Biome and the package typecheck after each edit: fix what it reports before moving on.
5. Validate: `bun run check` and `bun run e2e` must pass. Check each acceptance criterion yourself; for UI, open the isolated instance in Chrome and take screenshots.
6. `git fetch && git rebase origin/main`, run `bun run check` again, push, open the PR (`Closes #<n>`, summary, each criterion with how you validated it, screenshots for UI changes), set Status "In Review".
7. Wait for CI (`gh pr checks --watch`). When `check`, `e2e` and `docker` pass and no `review-pr` review says "Changes needed", squash-merge (`gh pr merge --squash --delete-branch`). A failing CI job is yours to fix, never to skip.

## Gotchas

- New dependency: only when the issue allows it; otherwise it is a blocker (see above).
- UI: only `@kata/design-system` components. A missing variant goes into the design system, with its tests and the preview page, not into the app.
- Services get repository interfaces from `domain/`; Prisma only in `infrastructure/`; return `Result`s. See `docs/module-pattern.md`.
- New module: add it to `tests/architecture/module-graph.ts`, `apps/api/src/persistence-modules.ts` (migration order) and `docs/architecture.md`.
- Migrations: one folder per module (`prisma/migrations/`), cross-module foreign keys only downward and written by hand in SQL. Personal data: add the row to the RGPD register in `docs/database.md` in the same PR. Update the seed.
- Coverage gate is 90% lines per file loaded by unit tests: test new files, do not exclude them.
- Integration tests need Postgres (`bun run db:up`); the test database is created by `bun run test:int`.
- The Stop hook runs `bun run check`: you cannot finish with a red check.
