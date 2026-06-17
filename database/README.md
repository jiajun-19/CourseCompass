# NUSMods Module Catalogue Import Spec

## Goal

CourseCompass should store the real NUSMods module catalogue in PostgreSQL so roadmap generation can use current module metadata instead of hand-written proof-of-concept rows.

## Source

- Academic year: `2025-2026`
- Module list: `https://api.nusmods.com/v2/2025-2026/moduleList.json`
- Module detail: `https://api.nusmods.com/v2/2025-2026/modules/{moduleCode}.json`

The NUSMods course page uses this public data source. The backend imports from the JSON API rather than scraping HTML.

## Data To Store

For every module returned by the module list:

- Module code
- Title
- Modular credits
- Faculty
- Department
- Description
- Semester availability
- Human-readable prerequisite text
- Structured prerequisite tree when NUSMods provides it
- Preclusion text
- NUSMods course URL
- Last synced timestamp

## Database Rules

- Importing modules must be repeatable.
- Existing student profiles and study plans should not be deleted by the import.
- Module rows should be upserted by `module_code`.
- The `prerequisites` edge table should be rebuilt from structured `prereqTree` leaves where available.
- Complex prerequisite logic must remain available in `modules.prereq_tree` even when the edge table stores only direct module-code references.

## Acceptance Checks

- Backend connects to PostgreSQL successfully via `/db-test`.
- `npm run import:nusmods` imports the full NUSMods module list into `modules`.
- `/api/modules/stats` returns the imported module count and academic year.
- `/api/modules?search=CS2103T` returns NUSMods metadata for `CS2103T`.
- `/api/modules/CS2103T` includes prerequisite text and structured prerequisite tree data.
- Existing proof-of-concept roadmap generation still works.
