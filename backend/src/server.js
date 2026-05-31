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
