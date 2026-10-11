# Workflow

## Worktrees and isolated instances

Several worktrees (for example one per agent) can run the app at the same time. They share one Postgres container (`kata-postgres`, see [database.md](database.md)) and isolate by database name and ports.

```sh
bun run dev:isolated          # start this worktree's instance
bun run dev:isolated --reset  # drop its database first, then migrate and seed again
```

`dev:isolated` (`scripts/dev-isolated.ts`):

1. Names the instance after the git worktree folder, or `INSTANCE` when it is set (`INSTANCE=demo bun run dev:isolated`).
2. Picks the ports: a hash of the name gives an API port in 3100–3899 and a web port in 5200–5999; a port in use moves to the next free one. The same worktree gets the same ports on every run (unless they are taken). `API_PORT` / `WEB_PORT` set **in the shell** force a port; the values in `.env` are ignored (they are the main checkout's ports).
3. Uses database `kata_<name>` on the Postgres server of `.env` (`DATABASE_URL`, else `localhost:${POSTGRES_PORT:-5432}`). It starts Postgres (`docker compose up`) when it is not reachable, creates and migrates the database, and seeds it when it is new (or with `--reset`).
4. Starts the API and the web dev server with these values and prints the URLs, the database URL and the matching `TEST_DATABASE_URL` (`kata_<name>_test`, created by `bun run test:int`).
5. Ctrl+C stops both servers. If one of them exits, the other is stopped too.

`bun run dev` still runs the main instance with the ports and database of `.env`.

Run `bun run e2e` the same way: it uses its own instance (`e2e-<worktree>`, database `kata_e2e_<worktree>`), so it does not clash with `dev` or `dev:isolated`. See [testing.md](testing.md#end-to-end-tests).

## Issues, branches and PRs

Follow the `agile-workflow` skill (`.claude/skills/agile-workflow/SKILL.md`): one issue per PR, branch `<type>/<issue title>`, one-line commits `type(scope): description`, `bun run check` (and `bun run e2e` when the change is visible in the app) before the PR, and the user does the squash merge.

## Agent workflow

Claude Code reads `CLAUDE.md` (the map and the hard rules) and the project settings in `.claude/settings.json`.

**Skills** (`.claude/skills/`):

| Skill | Use it to |
|---|---|
| `agile-workflow` | follow the process: issues, branches, commits, validation, PRs, reviews |
| `gh-epics`, `gh-project` | manage epics and sub-issues, set Status / Priority / Points on the `kata-dev` project |
| `plan-issue` | turn an idea into a ready issue |
| `build-issue` | implement an issue end to end, up to an open PR |
| `review-pr` | review a PR against the rules in `docs/` |

`plan-issue`, `build-issue` and `review-pr` also run without a human (GitHub Action): they never ask questions; when blocked, they comment on the issue and add the label `needs-human`.

**Hooks** (`scripts/hooks/`, Bun):

- After each `Edit` or `Write` (`post-edit.ts`): Biome on the changed file and the `typecheck` of its workspace package (or `tsc -p scripts` / `tests/architecture`). Errors are fed back to Claude (exit 2). Non-code files, generated code and files outside the repo are skipped.
- Before Claude stops (`stop-check.ts`): `bun run check`. If it fails, the stop is blocked and Claude gets the summary. It runs once per stop (it respects `stop_hook_active`) and is skipped when the worktree is clean and has no commit ahead of `origin/main`.

**Permissions**: the allow-list in `.claude/settings.json` covers the usual commands (`bun install`, `bun run dev|check|test*|lint|format|typecheck|e2e|db:*|dev:isolated|docker:build`, read-only `git`, `gh` and `docker compose`). Anything else asks.

**Worktrees**: each agent works in its own git worktree with its own instance (`bun run dev:isolated`, see above), so several agents can build and test at the same time.
