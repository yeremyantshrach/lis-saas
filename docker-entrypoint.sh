#!/bin/sh
set -eu

node ./scripts/run-migrations.mjs

exec "$@"
