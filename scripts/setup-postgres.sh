#!/usr/bin/env bash
set -euo pipefail

DATABASE_URL="${DATABASE_URL:-postgres://localhost:5432/coursecompass}"

find_psql() {
  for candidate in \
    /opt/homebrew/bin/psql \
    /usr/local/bin/psql \
    /Applications/Postgres.app/Contents/Versions/latest/bin/psql
  do
    if [[ -x "$candidate" ]]; then
      echo "$candidate"
      return 0
    fi
  done

  local resolved
  resolved="$(command -v psql || true)"
  if [[ -n "$resolved" && "$resolved" != *"/node_modules/.bin/psql" ]]; then
    echo "$resolved"
    return 0
  fi

  return 1
}

PSQL_BIN="$(find_psql || true)"
if [[ -z "$PSQL_BIN" ]]; then
  cat >&2 <<'EOF'
Could not find the real PostgreSQL psql command.

Install PostgreSQL first, for example:
  brew install postgresql@16
  brew services start postgresql@16

Then create the database:
  /opt/homebrew/bin/createdb coursecompass

If psql is installed somewhere else, add it to PATH or update scripts/setup-postgres.sh.
EOF
  exit 1
fi

"$PSQL_BIN" "$DATABASE_URL" -f db/schema.sql
"$PSQL_BIN" "$DATABASE_URL" -f db/seed.sql

echo "PostgreSQL schema and seed data loaded into ${DATABASE_URL}"
