# syntax=docker/dockerfile:1
# Web image: the static SPA build served by apps/web/server/serve.ts, which also proxies `/api` to the API.
# Build from the repository root: docker build -f apps/web/Dockerfile -t kata-web .
# Config comes from env only: API_URL (required, for example http://api:3000), WEB_PORT (default 8080).

FROM oven/bun:1.4.2-slim AS base
WORKDIR /app

# Only the lockfile and every workspace's package.json, so the install layer stays cached until they change.
FROM base AS manifests
COPY . .
RUN find . -type f ! -name package.json ! -name bun.lock -delete && find . -type d -empty -delete

FROM base AS deps
COPY --from=manifests /app ./
# --ignore-scripts: the root postinstall (Prisma generate) is for the API, the web build does not need it.
RUN bun install --frozen-lockfile --ignore-scripts --filter @kata/web

FROM deps AS build
COPY packages ./packages
COPY apps/web ./apps/web
RUN bun run --filter @kata/web build

# The server uses Bun APIs only: no node_modules in the runtime image.
FROM oven/bun:1.4.2-distroless AS runtime
WORKDIR /app
COPY --from=build /app/apps/web/build/client ./build/client
COPY apps/web/server/serve.ts ./server/serve.ts
# Non-root (the distroless image has no named user).
USER 65532:65532
EXPOSE 8080
CMD ["server/serve.ts"]
