---
name: review-pr
description: Use to review a kata-hq/kata PR against its issue and the project rules in docs/, and post the result as a comment review. Also used non-interactively by the GitHub Action. Never pushes fixes, never merges.
---

# Review a PR

Steps, the review format ("Ready for merge" / "Changes needed") and the Status changes are in `agile-workflow` section 7. This skill lists what to check in Kata.

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
