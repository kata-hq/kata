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

Follow the `agile-workflow` skill (`.claude/skills/agile-workflow/SKILL.md`): one issue per PR, branch `<type>/<issue title>`, one-line commits `type(scope): description`, `bun run check` (and `bun run e2e` when the change is visible in the app) before the PR, and the user does the squash merge.
