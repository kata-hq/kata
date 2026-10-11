#!/bin/sh
# Entry point of the API image (see apps/api/Dockerfile).
set -e
case "$1" in
  start) exec bun apps/api/src/server.ts ;;
  migrate) exec bun scripts/db-migrate-all.ts ;;
  *) exec "$@" ;;
esac
