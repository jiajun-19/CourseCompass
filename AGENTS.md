# AGENTS.md

## Cursor Cloud specific instructions

CourseCompass is a 3-tier app: React/Vite frontend (`frontend/`, dev port `5173`), Node/Express backend (`backend/`, port `3000`), and PostgreSQL (`database/`). Standard run/build commands live in the root `README.md` and the `scripts` blocks of `backend/package.json` and `frontend/package.json`.

### Services & how to run them
- Backend: `cd backend && npm run dev` (uses `node --watch`, hot-reloads on file save). Requires `backend/.env` and a running PostgreSQL.
- Frontend: `cd frontend && npm run dev` (Vite). Talks to the backend at `http://localhost:3000` (override via `VITE_API_URL`).
- Frontend build check: `cd frontend && npm run build`.
- There are NO lint or test scripts defined in either package (no ESLint/Jest config). Don't look for `npm test`/`npm run lint` — they don't exist.

### PostgreSQL (must be started manually each session)
The update script does NOT start Postgres or set up the DB. PostgreSQL 16 is installed at the system level. Each session:
1. Start the server: `sudo pg_ctlcluster 16 main start`
2. The dev DB uses role `ubuntu` (password `coursecompass`) and database `coursecompass`. If they don't exist (fresh VM), recreate:
   - `sudo -u postgres psql -c "CREATE ROLE ubuntu WITH LOGIN SUPERUSER PASSWORD 'coursecompass';"`
   - `sudo -u postgres psql -c "CREATE DATABASE coursecompass OWNER ubuntu;"`
3. Load schema: `PGPASSWORD=coursecompass psql -h localhost -U ubuntu -d coursecompass -f database/schema.sql`

### backend/.env (gitignored)
The backend needs `backend/.env` (not committed). Recreate if missing:
```
PORT=3000
DATABASE_URL=postgresql://ubuntu:coursecompass@localhost:5432/coursecompass
```

### Seed / demo data (non-obvious)
`database/seed.sql` was intentionally deleted from the repo (commit `2a75c48`), so `student_profiles`, `study_plans`, and `semester_plans` start EMPTY. With no data, `/api/courses` and the roadmap UI are blank. To get the course→roadmap proof-of-concept working, load the historical seed from git history:
```
git show 2a22d82:database/seed.sql > /tmp/seed.sql
PGPASSWORD=coursecompass psql -h localhost -U ubuntu -d coursecompass -f /tmp/seed.sql
```
This inserts 2 CS profiles, 40 modules, and a full Y1S1–Y4S2 study plan.

### NUSMods import caveat
`backend/src/importNusmods.js` is meant to populate `modules` from the live NUSMods API, but: there is no `import:nusmods` npm script (README references one that doesn't exist), the file does `require("../db")` which resolves to a non-existent path, and it fetches thousands of modules over the network. It is not needed for local development — the historical seed above covers the `modules` table.
