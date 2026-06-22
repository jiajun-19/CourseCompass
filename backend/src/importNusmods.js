const pool = require("./db");
require("dotenv").config();

const ACAD_YEAR = process.env.NUSMODS_ACAD_YEAR || "2025-2026";
const API_BASE_URL = `https://api.nusmods.com/v2/${ACAD_YEAR}`;
const CONCURRENCY = Number(process.env.NUSMODS_IMPORT_CONCURRENCY || 8);

function toIntegerCredit(value) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.ceil(parsed) : 4;
}

function semesterLabel(semesters) {
    if (!semesters.length) return "Not listed";
    return semesters.map((semester) => `Semester ${semester}`).join(", ");
}

function nusmodsUrl(moduleCode) {
    return `https://nusmods.com/courses/${encodeURIComponent(moduleCode)}`;
}

function extractPrerequisiteCodes(tree, codes = new Set()) {
    if (!tree) return codes;

    if (typeof tree === "string") {
        const match = tree.match(/^([A-Z]{2,4}\d{4}[A-Z]{0,3})/);
        if (match) codes.add(match[1]);
        return codes;
    }

    if (Array.isArray(tree)) {
        for (const item of tree) extractPrerequisiteCodes(item, codes);
        return codes;
    }

    if (typeof tree === "object") {
        for (const value of Object.values(tree)) extractPrerequisiteCodes(value, codes);
    }

    return codes;
}

async function fetchJson(url, attempts = 3) {
    let lastError;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`NUSMods request failed: ${response.status} ${url}`);
            }
            return await response.json();
        } catch (error) {
            lastError = error;
            if (attempt < attempts) {
                await new Promise((resolve) => setTimeout(resolve, attempt * 500));
            }
        }
    }

    throw lastError;
}

async function mapWithConcurrency(items, concurrency, mapper) {
    const results = new Array(items.length);
    let nextIndex = 0;

    async function worker() {
        while (nextIndex < items.length) {
            const currentIndex = nextIndex;
            nextIndex += 1;
            results[currentIndex] = await mapper(items[currentIndex], currentIndex);
        }
    }

    await Promise.all(
        Array.from({ length: concurrency }, () => worker())
    );

    return results;
}

async function upsertModule(client, module) {
    const semesters = module.semesterData?.map((semester) => semester.semester).sort((a, b) => a - b)
        || module.semesters
        || [];

    await client.query(
        `INSERT INTO modules (
            module_code,
            module_name,
            modular_credits,
            faculty,
            semester_available,
            acad_year,
            description,
            department,
            semesters,
            prerequisite_text,
            prereq_tree,
            preclusion,
            nusmods_url,
            last_synced_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)
         ON CONFLICT (module_code) DO UPDATE SET
            module_name = EXCLUDED.module_name,
            modular_credits = EXCLUDED.modular_credits,
            faculty = EXCLUDED.faculty,
            semester_available = EXCLUDED.semester_available,
            acad_year = EXCLUDED.acad_year,
            description = EXCLUDED.description,
            department = EXCLUDED.department,
            semesters = EXCLUDED.semesters,
            prerequisite_text = EXCLUDED.prerequisite_text,
            prereq_tree = EXCLUDED.prereq_tree,
            preclusion = EXCLUDED.preclusion,
            nusmods_url = EXCLUDED.nusmods_url,
            last_synced_at = EXCLUDED.last_synced_at`,
        [
            module.moduleCode,
            module.title,
            toIntegerCredit(module.moduleCredit),
            module.faculty || "Unknown",
            semesterLabel(semesters),
            ACAD_YEAR,
            module.description || null,
            module.department || null,
            semesters,
            module.prerequisite || null,
            module.prereqTree ? JSON.stringify(module.prereqTree) : null,
            module.preclusion || null,
            nusmodsUrl(module.moduleCode),
        ]
    );
}

async function importNusmods() {
    console.log(`Fetching NUSMods module list for ${ACAD_YEAR}...`);
    const moduleList = await fetchJson(`${API_BASE_URL}/moduleList.json`);

    console.log(`Fetching ${moduleList.length} module detail records...`);
    const fetchedDetails = await mapWithConcurrency(moduleList, CONCURRENCY, async (module, index) => {
        if ((index + 1) % 500 === 0) {
            console.log(`Fetched ${index + 1}/${moduleList.length} module details`);
        }
        try {
            return await fetchJson(`${API_BASE_URL}/modules/${encodeURIComponent(module.moduleCode)}.json`);
        } catch (error) {
            console.warn(`Skipping ${module.moduleCode}: ${error.message}`);
            return null;
        }
    });
    const details = fetchedDetails.filter(Boolean);

    console.log(`Fetched ${details.length}/${moduleList.length} usable module records`);

    const client = await pool.connect();

    try {
        await client.query("BEGIN");
        await client.query("DELETE FROM prerequisites");

        for (const module of details) {
            await upsertModule(client, module);
        }

        const moduleCodes = new Set(details.map((module) => module.moduleCode));
        let prerequisiteEdges = 0;

        for (const module of details) {
            const prerequisiteCodes = extractPrerequisiteCodes(module.prereqTree);

            for (const prerequisiteCode of prerequisiteCodes) {
                if (!moduleCodes.has(prerequisiteCode)) continue;

                await client.query(
                    `INSERT INTO prerequisites (module_code, prerequisite_module_code)
                     VALUES ($1, $2)
                     ON CONFLICT (module_code, prerequisite_module_code) DO NOTHING`,
                    [module.moduleCode, prerequisiteCode]
                );
                prerequisiteEdges += 1;
            }
        }

        await client.query("COMMIT");
        console.log(`Imported ${details.length} modules for ${ACAD_YEAR}`);
        console.log(`Recorded ${prerequisiteEdges} structured prerequisite edges`);
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

importNusmods().catch((error) => {
    console.error(error);
    process.exit(1);
});
