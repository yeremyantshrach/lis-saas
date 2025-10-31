#!/bin/sh
set -eu

node ./scripts/run-migrations.mjs
pnpm promote-admin

exec "$@"
