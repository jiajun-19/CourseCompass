const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({ message: "CourseCompass backend running" });
});

app.get("/db-test", async (req, res) => {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows[0]);
});

app.get("/api/courses", async (req, res) => {
    const result = await pool.query(
        `SELECT
            profile_id AS id,
            major || ' Year ' || year_of_study || ' (' || target_graduation_year || ')' AS name
         FROM student_profiles
         ORDER BY profile_id`
    );

    res.json({ courses: result.rows });
});

app.get("/api/modules/stats", async (req, res) => {
    const result = await pool.query(
        `SELECT
            COUNT(*)::INTEGER AS "moduleCount",
            COUNT(*) FILTER (WHERE prerequisite_text IS NOT NULL)::INTEGER AS "modulesWithPrerequisiteText",
            COUNT(*) FILTER (WHERE prereq_tree IS NOT NULL)::INTEGER AS "modulesWithPrerequisiteTree",
            acad_year AS "acadYear",
            MAX(last_synced_at) AS "lastSyncedAt"
         FROM modules
         GROUP BY acad_year
         ORDER BY acad_year DESC NULLS LAST
         LIMIT 1`
    );

    res.json(result.rows[0] || {
        moduleCount: 0,
        modulesWithPrerequisiteText: 0,
        modulesWithPrerequisiteTree: 0,
        acadYear: null,
        lastSyncedAt: null,
    });
});

app.get("/api/modules", async (req, res) => {
    const search = String(req.query.search || "").trim();
    const params = [];
    let whereClause = "";

    if (search) {
        params.push(`%${search}%`);
        whereClause = `WHERE module_code ILIKE $1 OR module_name ILIKE $1`;
    }

    const result = await pool.query(
        `SELECT
            module_code AS "moduleCode",
            module_name AS title,
            modular_credits AS "modularCredits",
            faculty,
            department,
            semesters,
            prerequisite_text AS "prerequisiteText",
            preclusion,
            nusmods_url AS "nusmodsUrl"
         FROM modules
         ${whereClause}
         ORDER BY module_code
         LIMIT 50`,
        params
    );

    res.json({ modules: result.rows });
});

app.get("/api/modules/:moduleCode", async (req, res) => {
    const result = await pool.query(
        `SELECT
            module_code AS "moduleCode",
            module_name AS title,
            modular_credits AS "modularCredits",
            faculty,
            department,
            description,
            semesters,
            semester_available AS "semesterAvailable",
            prerequisite_text AS "prerequisiteText",
            prereq_tree AS "prereqTree",
            preclusion,
            nusmods_url AS "nusmodsUrl",
            last_synced_at AS "lastSyncedAt"
         FROM modules
         WHERE module_code = UPPER($1)`,
        [req.params.moduleCode]
    );

    if (!result.rows[0]) {
        res.status(404).json({ error: "Module not found" });
        return;
    }

    res.json(result.rows[0]);
});

app.post("/api/plans/generate", async (req, res) => {
    const { courseId } = req.body;
    const result = await pool.query(
        `SELECT
            sp.semester,
            m.module_code AS "moduleCode",
            m.module_name AS title
         FROM study_plans p
         JOIN semester_plans sp ON sp.plan_id = p.plan_id
         JOIN semester_plan_modules spm ON spm.semester_plan_id = sp.semester_plan_id
         JOIN modules m ON m.module_code = spm.module_code
         WHERE p.profile_id = $1
         ORDER BY sp.year_no, sp.semester_no, spm.position`,
        [courseId]
    );

    const semesters = [];
    const plan = {};
    const modules = [];

    for (const row of result.rows) {
        if (!plan[row.semester]) {
            semesters.push(row.semester);
            plan[row.semester] = [];
        }

        plan[row.semester].push(row.moduleCode);
        modules.push({ moduleCode: row.moduleCode, title: row.title });
    }

    res.json({ courseId, semesters, plan, modules });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});