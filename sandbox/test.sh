#!/bin/sh
# Checks sandbox/index.html. Exits 0 when all checks pass, 1 when a check fails.
# Usage: sh sandbox/test.sh

dir=$(dirname "$0")
page="$dir/index.html"
failed=0

check() {
  name=$1
  shift
  if "$@" >/dev/null 2>&1; then
    echo "PASS: $name"
  else
    echo "FAIL: $name"
    failed=1
  fi
}

check "page exists" test -f "$page"
check "page has doctype" grep -qi '<!doctype html>' "$page"
check "page has heading \"Hello, kata\"" grep -q '<h1>Hello, kata</h1>' "$page"

exit "$failed"
