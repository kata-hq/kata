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

## Docker images

Hosting is not decided: the api and the web app build as portable images. Build from the repository root (the images need the workspace lockfile).

```sh
bun run docker:build   # kata-api and kata-web (docker build -f apps/<app>/Dockerfile .)
bun run docker:up      # migrate, api and web (compose profile "app") against the compose Postgres
bun run docker:down    # remove those three containers (Postgres keeps running)
```

| Image | Base | Runs | Config (env only) |
|---|---|---|---|
| `kata-api` (`apps/api/Dockerfile`) | `oven/bun:1.4.2-slim`, user `bun` | `start` (default): `apps/api/src/server.ts`. `migrate`: `scripts/db-migrate-all.ts`, every module in order, then exits. | `DATABASE_URL` (required), `API_PORT` (3000), `LOG_LEVEL` |
| `kata-web` (`apps/web/Dockerfile`) | `oven/bun:1.4.2-distroless`, uid 65532 | `apps/web/server/serve.ts`: serves `build/client`, falls back to `index.html` for client routes, proxies `/api/*` to `API_URL` | `API_URL` (required, the API origin), `WEB_PORT` (8080) |

- Both are multi-stage. The install layer copies only `bun.lock` and the workspaces' `package.json` files, so it stays cached until a dependency changes. No `.env` goes in an image (`.dockerignore`).
- The api runtime has production dependencies only. `prisma` is a production dependency of `@kata/api` because `migrate` runs in this image (CLI + schema engine). The query side needs no engine (driver adapter `@prisma/adapter-pg`).
- Run `migrate` before a new api version starts: `docker run --rm -e DATABASE_URL=... kata-api migrate`. It creates the database when it is missing, so its user needs access to the `postgres` database.
- Static files: hashed `/assets/*` files are cached for a year (`immutable`); `index.html` and unhashed files (`assets/stylex.css`) are revalidated (`no-cache`). A missing `/assets/*` file is a 404, not the SPA. An unreachable API gives 502 with the API error body.
- Compose profile `app`: `migrate` runs first, `api` starts when it succeeds, `web` when the api answers `/api/health`. `docker compose up postgres` and `bun run db:up` do not start them. Override `DOCKER_DATABASE_URL` (default `postgres://kata:kata@postgres:5432/kata`), `DOCKER_API_PORT` (3080) and `DOCKER_WEB_PORT` (8080) in the shell or `.env`, for example a separate `kata_docker` database so `docker:up` does not touch your dev data. The compose project is shared by every worktree: one `app` stack at a time.

## Issues, branches and PRs

Repo `kata-hq/kata`, project `kata-dev` (number `1`, owner `kata-hq`). One issue is one PR.

- **Epic**: one result a user can see, too large for one PR. Type `Epic`, title `[<CODE>-00] <Epic name>` (`<CODE>`: 2 to 4 unique capital letters), body Goal / Scope / Done when; its tasks are sub-issues. Ask the user before creating an epic. Close it when all its sub-issues are closed.
- **Issue**: type Feature (visible), Task (internal) or Bug. Title `<CODE>-<NN>/<short-name>`: `<NN>` is the highest number among all sub-issues of the epic (open and closed) plus one. Every issue is a sub-issue of an epic. Body: `.github/ISSUE_TEMPLATE/issue.md`; Features and Bugs need scenarios, Tasks need acceptance criteria. 8 points or fewer, otherwise split it.
- **Idea**: an issue with only a "Context" section, Status "Backlog", no Points.
- **Project fields** (on the project item, not the issue): Status (Backlog, Todo, In Progress, In Review, Done), Priority (P0 broken and blocking, P1 this cycle, P2 normal, P3 nice to have), Points (1, 2, 3, 5, 8). Sprint is unused. A ready issue is "Todo". The project sets "Done" when the issue closes; never set it by hand.
- **Picking up**: the highest Priority "Todo" issue with no assignee and no open `blocked_by` dependency (lower number first). All agents share one GitHub account, so claim it by creating its branch on GitHub from `main`: if the ref already exists, another agent has it. Then assign it, set "In Progress" (and the epic too).
- **Branch**: `<type>/<issue title>` with type `feature`, `bugfix` or `task` (for example `task/FND-28/agents-merge-docs`).
- **Commits and PR title**: one line `type(scope): description` (`feat`, `fix`, `chore`, `docs`, `refactor`, `test`; scope is the top-level folder, or `kata` for several), lowercase imperative, no body, no trailers.
- **Validate**: each acceptance criterion and scenario yourself; `bun run check`, and `bun run e2e` when the change is visible. New work found on the way becomes a new idea, not part of the issue.
- **PR**: `.github/pull_request_template.md`, with `Closes #<number>` and how each criterion was validated. Set "In Review".
- **Merge**: no human review. When `check`, `e2e` and `docker` pass in CI, the agent squash-merges its own PR (`gh pr merge --squash --delete-branch`). If a `review-pr` review says "Changes needed", fix it first.

## Agent workflow

Claude Code reads `CLAUDE.md` (the map and the hard rules) and the project settings in `.claude/settings.json`.

**Skills** (`.claude/skills/`):

| Skill | Use it to |
|---|---|
| `plan-issue` | turn an idea into a ready issue |
| `build-issue` | implement an issue end to end, up to the merged PR |
| `review-pr` | review a PR against the rules in `docs/` |

`plan-issue`, `build-issue` and `review-pr` also run without a human (GitHub Action): they never ask questions; when blocked, they comment on the issue and add the label `needs-human`.

**Hooks** (`scripts/hooks/`, Bun):

- After each `Edit` or `Write` (`post-edit.ts`): Biome on the changed file and the `typecheck` of its workspace package (or `tsc -p scripts` / `tests/architecture`). Errors are fed back to Claude (exit 2). Non-code files, generated code and files outside the repo are skipped.
- Before Claude stops (`stop-check.ts`): `bun run check`. If it fails, the stop is blocked and Claude gets the summary. It runs once per stop (it respects `stop_hook_active`) and is skipped when the worktree is clean and has no commit ahead of `origin/main`.

**Permissions**: the allow-list in `.claude/settings.json` covers the usual commands (`bun install`, `bun run dev|check|test*|lint|format|typecheck|e2e|db:*|dev:isolated|docker:build`, read-only `git`, `gh` and `docker compose`). Anything else asks.

**Worktrees**: each agent works in its own git worktree with its own instance (`bun run dev:isolated`, see above), so several agents can build and test at the same time.

## GitHub automation

Everything lives in `.github/`:

| File | Runs on | Does |
|---|---|---|
| `workflows/ci.yml` | every PR to `main` and every push to `main` | `check`: install, migrate, `bun run check` (coverage gate included) on a Postgres service. `e2e`: `bun run e2e` (Playwright report uploaded on failure). `docker`: builds `kata-api` and `kata-web` (no push). |
| `workflows/claude.yml` | `@claude` in an issue, comment or review; label `agent` on an issue | Claude answers the mention, or runs `/build-issue <number>` for the `agent` label. 60 turns, 60 minutes, one run at a time per issue/PR. Events from bots are ignored. |
| `workflows/claude-review.yml` | PR opened, pushed or marked ready (not drafts) | Claude runs `/review-pr <number>`. 30 turns, 30 minutes; a new push cancels the review in progress. |
| `ISSUE_TEMPLATE/issue.md`, `pull_request_template.md` | new issue / new PR | The issue body and the PR body. Blank issues stay enabled for epics and ideas. |

The CI env (Postgres service on 5432, `DATABASE_URL`, `TEST_DATABASE_URL`) matches `.env.example`. Postgres is reachable, so `dev:isolated` and `e2e` never start docker compose there.

Labels (recreate them with these commands; `--force` updates an existing label):

```sh
gh label create agent --repo kata-hq/kata --force --color 5319e7 --description "Claude implements this issue (runs /build-issue)"
gh label create needs-human --repo kata-hq/kata --force --color d93f0b --description "An agent stopped: a person must decide or act"
gh label create blocked --repo kata-hq/kata --force --color b60205 --description "Cannot progress until something else is done"
```

Manual steps (an admin does them once):

1. Secret: run `claude setup-token` locally, then `gh secret set CLAUDE_CODE_OAUTH_TOKEN --repo kata-hq/kata` and paste the token. Without it the Claude workflows fail; CI does not need it.
2. Install the Claude GitHub App on the repository: https://github.com/apps/claude.
3. Protect `main` (Settings → Rules → Rulesets, target the default branch): require a pull request, require the status checks `check`, `e2e` and `docker` (branches up to date), block force pushes and deletion. In Settings → General → Pull Requests, allow squash merging only.
