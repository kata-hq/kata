---
name: plan-issue
description: Use to turn an idea or a request into a ready kata-hq/kata issue (problem, acceptance criteria, modules touched, RGPD impact, out of scope, test plan). Also used non-interactively by the GitHub Action.
---

# Plan an issue

Process (duplicates, title, type, epic, project fields, Status) is in "Issues, branches and PRs" in `docs/workflow.md`. This skill adds what a Kata issue must say so `build-issue` can run without questions.

## Non-interactive

Do not ask the user anything. When the idea is too vague to write acceptance criteria, or it needs a product decision that `docs/product/` does not answer: record it as an idea (Status "Backlog", only "Context"), comment on it with the open questions, add the label `needs-human` (create the label once if it does not exist), and stop.

## Before writing

- Read `CLAUDE.md` and the doc for the area (table "Which doc to read").
- Check the product spec (`docs/product/mvp-spec-fr.html`) for the feature. Where it conflicts with the kickoff decisions, `docs/product/README.md` wins.
- Find the modules touched and check the dependency directions in `docs/architecture.md`. A change that needs a forbidden direction or a new module is an architecture decision: say so in the issue and add `needs-human`.
- Size: 8 points or fewer. Split by module or by layer (API first, then web) when larger.

## Body

Use the `.github/ISSUE_TEMPLATE/issue.md` body and add these sections after "What to do":

- `## Modules touched`: backend and frontend modules, packages (`design-system`, `shared`), docs.
- `## Data / RGPD impact`: new tables or columns, which hold personal data, and the row to add to the RGPD register in `docs/database.md` (the PR must update it). New migrations: which module, and any foreign key (only to modules earlier in the migration order). "None" when nothing changes.
- `## Test plan`: unit tests (services with fake repositories, components), integration tests (`*.int.test.ts` for repositories), e2e (Playwright) for visible flows, manual Chrome steps if any.

Acceptance criteria are checkable results, not tasks. UI criteria name the design-system components to use; a missing component or variant is part of the issue (or a separate issue in the `design-system` package first).

`## Out of scope` lists what a builder could be tempted to add (other modules, polish, the next issue).
