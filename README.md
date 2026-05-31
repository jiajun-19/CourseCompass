# CourseCompass Milestone 1 Proof of Concept

CourseCompass is a personalised module planning web app for NUS students. The product is designed to support different NUS courses, while this proof of concept currently implements Computer Science as the available demo course. It demonstrates the core user flow proposed in the poster:

- choose the course the student is interested in
- choose degree goals and constraints
- generate a semester-by-semester roadmap
- generate a generic 160 MC roadmap
- check prerequisite ordering
- explore the sample module catalogue

## Run the prototype

```bash
npm start
```

Then open:

```text
http://127.0.0.1:4182
```

The current prototype has a React frontend connected to a backend API and PostgreSQL. The database is pre-seeded with sample student profiles, CS-coded modules, and a pre-mapped Computer Science academic pathway.

Create a PostgreSQL database, then load the schema and seed data:

```bash
createdb coursecompass
export DATABASE_URL="postgres://localhost:5432/coursecompass"
npm install
npm run db:setup
```

Run the app:

```bash
npm start
```

`npm start` builds the React frontend with Vite, then serves the built app and backend API from the Node server.

Inspect the seeded database:

```bash
npm run db:inspect
```

Backend endpoints demonstrated:

- `GET /api/health`
- `GET /api/courses`
- `GET /api/courses/Computer%20Science/modules`
- `GET /api/students`
- `POST /api/plans/generate`

Local database:

- PostgreSQL database: `coursecompass`
- Core tables: `student_profiles`, `constraints`, `study_plans`, `semester_plans`, `semester_plan_modules`, `modules`, `prerequisites`
- Module fields: `module_code`, `module_name`, `modular_credits`, `faculty`, `semester_available`
- POC module bank uses sample CS-coded modules.
- The generated course plan comes from pre-mapped `study_plans` and `semester_plans` rows, not frontend hardcoding.

## Suggested Milestone 1 Notes

Problem statement: NUS students often rely on generic study plans that do not account for goals such as minors, prerequisites, and workload balance.

Solution: CourseCompass generates a personalised roadmap from student goals and constraints, then visualises the plan and flags requirement issues.

Proof of concept scope: This version demonstrates a working React planner UI, frontend-backend API calls, course selection, a pre-seeded PostgreSQL module bank, sample student profiles, constraints, prerequisites, pre-mapped study plans, module search, and a generic 160 MC visual roadmap. Computer Science is the only selectable course for now, and the roadmap is generated only after the user chooses that course.

Next data needed:

- official CS degree requirement rules for your cohort
- full module list with prerequisites and semester availability
- target user profile for the demo scenario
- final tech stack decision for backend, database, and authentication
- exact Milestone 1 submission format required by the course
