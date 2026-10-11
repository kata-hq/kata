# syntax=docker/dockerfile:1
# API image. Build from the repository root: docker build -f apps/api/Dockerfile -t kata-api .
#   docker run kata-api           starts the API (default)
#   docker run kata-api migrate   applies every module's migrations, in order, then exits
# Config comes from env only: DATABASE_URL (required), API_PORT (default 3000), LOG_LEVEL.

# Debian slim (glibc): the Prisma schema engine used by `migrate` is a glibc binary.
FROM oven/bun:1.4.2-slim AS base
WORKDIR /app

# Only the lockfile and every workspace's package.json, so the install layers stay cached until they change.
# (Copies all workspaces: a frozen install needs each package.json the lockfile names.)
FROM base AS manifests
COPY . .
RUN find . -type f ! -name package.json ! -name bun.lock -delete && find . -type d -empty -delete

# All dependencies of the api workspace, dev ones included, to generate the Prisma clients.
FROM base AS deps
COPY --from=manifests /app ./
# --ignore-scripts: the root postinstall needs the sources. The Prisma engines download runs below instead.
RUN bun install --frozen-lockfile --ignore-scripts --filter @kata/api

FROM deps AS build
COPY packages/config ./packages/config
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
COPY scripts ./scripts
RUN bun run db:generate && find apps packages scripts -name '*.test.ts' -delete

# Production dependencies only. `prisma` (CLI + schema engine) is one of them: `migrate` runs in this image.
FROM base AS prod-deps
COPY --from=manifests /app ./
RUN bun install --frozen-lockfile --ignore-scripts --production --filter @kata/api \
  && (cd node_modules/.bun/@prisma+engines@*/node_modules/@prisma/engines && bun run --bun postinstall) \
  # Parts of the Prisma CLI that `migrate deploy` never loads: `prisma dev` (PGlite), TypeScript (optional peer).
  && rm -rf node_modules/.bun/@electric-sql+* \
    node_modules/.bun/typescript@* node_modules/.bun/@typescript+*

FROM base AS runtime
ENV NODE_ENV=production \
  CHECKPOINT_DISABLE=1 \
  PRISMA_HIDE_UPDATE_MESSAGE=1
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=prod-deps /app/packages/shared/node_modules* ./packages/shared/node_modules/
COPY --from=build /app/package.json ./
COPY --from=build /app/packages/shared/package.json ./packages/shared/
COPY --from=build /app/packages/shared/src ./packages/shared/src
COPY --from=build /app/apps/api/package.json ./apps/api/
COPY --from=build /app/apps/api/src ./apps/api/src
COPY --from=build /app/scripts/db-migrate-all.ts ./scripts/
COPY --from=build /app/scripts/lib ./scripts/lib
COPY apps/api/docker-entrypoint.sh /usr/local/bin/kata-api
# Non-root user shipped with the bun image.
USER bun
EXPOSE 3000
ENTRYPOINT ["kata-api"]
CMD ["start"]
