// One-off helper: snapshots the module catalogue and prerequisite edges from the
// database into a JSON fixture so the planner unit tests can run without a database.
const fs = require("fs");
const path = require("path");
const pool = require("../src/db");

async function main() {
    const [moduleResult, prerequisiteResult] = await Promise.all([
        pool.query(
            `SELECT module_code AS "moduleCode", module_name AS title,
                    modular_credits AS "modularCredits", faculty,
                    semesters, prerequisite_text AS "prerequisiteText",
                    prereq_tree AS "prereqTree", nusmods_url AS "nusmodsUrl"
             FROM modules ORDER BY module_code`
        ),
        pool.query(
            `SELECT module_code AS "moduleCode",
                    prerequisite_module_code AS "prerequisiteModuleCode"
             FROM prerequisites ORDER BY module_code, prerequisite_module_code`
        ),
    ]);

    const fixture = { modules: moduleResult.rows, prerequisites: prerequisiteResult.rows };
    const outPath = path.join(__dirname, "..", "test", "fixtures", "catalogue.json");
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(fixture));
    console.log(`Wrote ${fixture.modules.length} modules and ${fixture.prerequisites.length} prerequisite edges to ${outPath}`);
    await pool.end();
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
