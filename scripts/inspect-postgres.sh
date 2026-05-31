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
  echo "Could not find the real PostgreSQL psql command." >&2
  exit 1
fi

"$PSQL_BIN" "$DATABASE_URL" <<'SQL'
SELECT COUNT(*) AS module_count FROM modules;
SELECT module_code, module_name, modular_credits
FROM modules
WHERE module_code LIKE 'CS%'
ORDER BY module_code
LIMIT 10;
SELECT sp.semester, COUNT(*) AS planned_modules, SUM(m.modular_credits) AS planned_mcs
FROM semester_plans sp
JOIN semester_plan_modules spm ON spm.semester_plan_id = sp.semester_plan_id
JOIN modules m ON m.module_code = spm.module_code
GROUP BY sp.year_no, sp.semester_no, sp.semester
ORDER BY sp.year_no, sp.semester_no;
SQL
