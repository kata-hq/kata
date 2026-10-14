---
name: review-pr
description: Use to review a kata-hq/kata PR against its issue and the project rules in docs/, and post the result as a comment review. Also used non-interactively by the GitHub Action. Never pushes fixes.
---

# Review a PR

This skill lists what to check in Kata. The PR author merges it when CI passes, so a review only blocks with "Changes needed".

## Review format

Check out the PR detached (`gh pr checkout <n> --detach`; another worktree may own the branch) and validate each criterion yourself; do not trust the PR body. Post a comment review (`gh pr review --comment`; the shared account cannot approve its own PRs):

- First line "Ready for merge" or "Changes needed" (a criterion or scenario fails, a bug, or a broken convention).
- One line per acceptance criterion and scenario, with how you validated it; one "Conventions" line (branch, commit, PR title, `Closes #`).
- Then problems and notes. On "Changes needed", set the issue back to "In Progress". Do not delete branches you did not create.

## Non-interactive

Do not ask the user anything. When you cannot decide (a product question, an architecture change the issue did not plan), write it under the problems, add the label `needs-human` to the PR (create the label once if it does not exist) and post the review anyway.

## Setup

Check out the PR detached in your own worktree, copy `.env` from the main checkout if needed, `bun install`, then run `bun run check` and `bun run e2e`. Use `bun run dev:isolated` and Chrome to validate UI criteria.

## Checklist

- **Issue**: every acceptance criterion and scenario holds; nothing outside "Modules touched" or listed in "Out of scope".
- **Architecture** (`docs/architecture.md`): imports between modules only through `index.ts` and along the allowed directions; a new module is in `module-graph.ts`, `persistence-modules.ts` and the docs; services injected through `module.ts` / `app.ts`.
- **Repository rule** (`docs/module-pattern.md`): `domain/` and `application/` never touch Prisma or Hono; services take repository interfaces; expected failures are `Result`s; routes map errors to the standard error body.
- **Design system** (`docs/design-system.md`): apps use only `@kata/design-system` components; no CSS, `style=`, string `className=`, raw values in `stylex.create`; new components have typed variants, tests and a preview entry.
- **Migrations** (`docs/database.md`): one folder per module, migrations in order, foreign keys only to modules earlier in the migration order and written in SQL, no edit of a merged migration, seed updated.
- **Tests** (`docs/testing.md`): new behavior has unit tests, repositories have integration tests, visible flows have e2e; no file excluded from the 90% coverage gate; no skipped tests.
- **RGPD**: new personal data is in the register in `docs/database.md`; nothing personal in logs (paths, bodies, ids, emails).
- **Guardrails**: any `biome-ignore` has a reason and is justified; no guardrail weakened to make the PR pass.
- **Docs**: `docs/` and `CLAUDE.md` still agree with the code.
