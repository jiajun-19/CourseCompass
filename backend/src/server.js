const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");

const app = express();

const CURATED_MAJORS = [
    {
        id: "computer-science",
        name: "Computer Science",
        faculty: "School of Computing",
        prefixes: ["CS"],
        core: ["CS1010S", "CS1231S", "MA1521", "MA2001", "CS2030S", "CS2040S", "CS2100", "CS2101", "CS2102", "CS2103T", "CS2106", "CS2109S", "CS3230", "CS3219", "CS3235", "CS3243", "CS3244", "CS3263", "CS4211", "CS4225", "CS4231", "CS4248", "CS4347"],
    },
    {
        id: "business-analytics",
        name: "Business Analytics",
        faculty: "School of Computing",
        prefixes: ["BT"],
        core: ["BT1101", "CS1010S", "MA1521", "ST2334", "BT2101", "BT2102", "BT3102", "BT3103", "BT4012", "BT4013", "BT4015", "BT4103", "BT4222", "BT4240"],
    },
    {
        id: "information-systems",
        name: "Information Systems",
        faculty: "School of Computing",
        prefixes: ["IS"],
        core: ["CS1010J", "IS1108", "IS1128", "IS2101", "IS2102", "IS2103", "IS2104", "IS3103", "IS3106", "IS4103", "IS4100", "IS4241", "IS4242"],
    },
    {
        id: "data-science-analytics",
        name: "Data Science & Analytics",
        faculty: "College of Humanities and Sciences",
        prefixes: ["DSA", "ST", "MA"],
        core: ["DSA1101", "CS1010S", "MA2001", "MA2002", "ST2131", "ST2132", "DSA2101", "DSA2102", "DSA3101", "DSA3102", "DSA4211", "ST3131", "ST3132", "ST3248", "ST4248"],
    },
    {
        id: "business-administration",
        name: "Business Administration",
        faculty: "NUS Business School",
        prefixes: ["ACC", "BSP", "DAO", "FIN", "MKT", "MNO"],
        core: ["BSP1702", "ACC1701", "DAO1704", "FIN2704", "MKT1705", "MNO1706", "BSP2701", "DAO2702", "DAO2703", "FIN3701", "MKT3701", "MNO3701"],
    },
];

const GENERIC_MAJORS = [
    ["computer-engineering", "Computer Engineering", "College of Design and Engineering", ["CG", "CS", "EE"]],
    ["accountancy", "Accountancy", "NUS Business School", ["ACC"]],
    ["real-estate", "Real Estate", "NUS Business School", ["RE"]],
    ["economics", "Economics", "College of Humanities and Sciences", ["EC"]],
    ["psychology", "Psychology", "College of Humanities and Sciences", ["PL"]],
    ["political-science", "Political Science", "College of Humanities and Sciences", ["PS"]],
    ["sociology", "Sociology", "College of Humanities and Sciences", ["SC"]],
    ["communications-new-media", "Communications & New Media", "College of Humanities and Sciences", ["NM"]],
    ["geography", "Geography", "College of Humanities and Sciences", ["GE"]],
    ["history", "History", "College of Humanities and Sciences", ["HY"]],
    ["philosophy", "Philosophy", "College of Humanities and Sciences", ["PH"]],
    ["english-literature", "English Literature", "College of Humanities and Sciences", ["EN"]],
    ["linguistics", "English Language & Linguistics", "College of Humanities and Sciences", ["EL"]],
    ["social-work", "Social Work", "College of Humanities and Sciences", ["SW"]],
    ["mathematics", "Mathematics", "College of Humanities and Sciences", ["MA"]],
    ["statistics", "Statistics", "College of Humanities and Sciences", ["ST"]],
    ["physics", "Physics", "College of Humanities and Sciences", ["PC"]],
    ["chemistry", "Chemistry", "College of Humanities and Sciences", ["CM"]],
    ["life-sciences", "Life Sciences", "College of Humanities and Sciences", ["LSM"]],
    ["food-science-technology", "Food Science & Technology", "College of Humanities and Sciences", ["FST"]],
    ["pharmaceutical-science", "Pharmaceutical Science", "College of Humanities and Sciences", ["PHS", "PR"]],
    ["environmental-studies", "Environmental Studies", "College of Humanities and Sciences", ["ENV"]],
    ["architecture", "Architecture", "College of Design and Engineering", ["AR"]],
    ["biomedical-engineering", "Biomedical Engineering", "College of Design and Engineering", ["BN"]],
    ["chemical-engineering", "Chemical Engineering", "College of Design and Engineering", ["CN"]],
    ["civil-engineering", "Civil Engineering", "College of Design and Engineering", ["CE"]],
    ["electrical-engineering", "Electrical Engineering", "College of Design and Engineering", ["EE"]],
    ["industrial-design", "Industrial Design", "College of Design and Engineering", ["ID"]],
    ["industrial-systems-engineering", "Industrial & Systems Engineering", "College of Design and Engineering", ["IE", "ISE"]],
    ["landscape-architecture", "Landscape Architecture", "College of Design and Engineering", ["LA"]],
    ["materials-science-engineering", "Materials Science & Engineering", "College of Design and Engineering", ["MLE"]],
    ["mechanical-engineering", "Mechanical Engineering", "College of Design and Engineering", ["ME"]],
    ["law", "Law", "Faculty of Law", ["LAW"]],
    ["medicine", "Medicine", "Yong Loo Lin School of Medicine", ["MD"]],
    ["nursing", "Nursing", "Yong Loo Lin School of Medicine", ["NUR"]],
    ["dentistry", "Dentistry", "Faculty of Dentistry", ["DEN"]],
    ["public-health", "Public Health", "Saw Swee Hock School of Public Health", ["SPH"]],
].map(([id, name, faculty, prefixes]) => ({ id, name, faculty, prefixes, core: [] }));

const MAJORS = [...CURATED_MAJORS, ...GENERIC_MAJORS]
    .sort((a, b) => a.faculty.localeCompare(b.faculty) || a.name.localeCompare(b.name));

const COMMON_MODULES = ["GEA1000", "ES2660", "CFG1002", "GEC1015", "GEN2001"];

function moduleLevel(code) {
    const match = code.match(/\d/);
    return match ? Number(code.slice(match.index, match.index + 1)) : 9;
}

function moduleCredits(module) {
    const credits = Number(module?.modularCredits || 4);
    return Number.isFinite(credits) && credits > 0 ? credits : 4;
}

function moduleFamily(code) {
    const match = code.match(/^([A-Z]{2,5}\d{4})[A-Z]+$/);
    return match ? match[1] : code;
}

function normalizedTitle(title) {
    return String(title || "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .replace(/[^a-z0-9 ]/g, "")
        .trim();
}

function isNonstandardRecommendation(module) {
    return /independent study|special topics?|topics in |research project|directed study|dissertation|thesis|internship|undergraduate research opportunity|\burop\b/i
        .test(module.title || "");
}

function limitedElectiveCategory(module) {
    const prefix = module.moduleCode.match(/^[A-Z]+/)?.[0] || "";
    if (/^lab(?:oratory)? in /i.test(module.title || "")) return `${prefix}:laboratory-elective`;
    return null;
}

function buildRoadmap(major, modules, prerequisiteRows, exchangeSemester) {
    const moduleByCode = new Map(modules.map((module) => [module.moduleCode, module]));
    const prerequisites = new Map();

    for (const row of prerequisiteRows) {
        if (!prerequisites.has(row.moduleCode)) prerequisites.set(row.moduleCode, new Set());
        prerequisites.get(row.moduleCode).add(row.prerequisiteModuleCode);
    }

    const candidates = modules
        .filter((module) => major.prefixes.some((prefix) => module.moduleCode.startsWith(prefix)))
        .sort((a, b) => moduleLevel(a.moduleCode) - moduleLevel(b.moduleCode) || a.moduleCode.localeCompare(b.moduleCode));
    const selected = new Set();
    const selectedFamilies = new Set();
    const selectedTitles = new Set();
    const selectedCategories = new Set();
    const corePriority = new Map(major.core.map((code, index) => [code, index]));
    const targetLocalCredits = exchangeSemester ? 140 : 160;
    let selectedCredits = 0;

    function includeModule(code, curated = false) {
        if (!moduleByCode.has(code) || selected.has(code) || selectedCredits >= targetLocalCredits) return;
        const module = moduleByCode.get(code);
        const credits = moduleCredits(module);
        if (selectedCredits + credits > targetLocalCredits) return;
        const family = moduleFamily(code);
        const title = normalizedTitle(module.title);
        const category = limitedElectiveCategory(module);
        if (selectedFamilies.has(family) || (title && selectedTitles.has(title))) return;
        if (!curated && category && selectedCategories.has(category)) return;
        if (!curated && isNonstandardRecommendation(module)) return;
        selected.add(code);
        selectedCredits += credits;
        selectedFamilies.add(family);
        if (title) selectedTitles.add(title);
        if (category) selectedCategories.add(category);
    }

    major.core.forEach((code) => includeModule(code, true));
    COMMON_MODULES.forEach((code) => includeModule(code));
    for (const module of candidates) {
        if (selectedCredits >= targetLocalCredits) break;
        // NUS offers several mutually exclusive introductory programming variants.
        // The major's curated core already chooses the appropriate one.
        if (/^CS(?:1010[A-Z]*|1101S|1231)$/.test(module.moduleCode)) continue;
        includeModule(module.moduleCode);
    }

    // Fill sparse catalogues with useful general-education modules from the database.
    for (const module of modules) {
        if (selectedCredits >= targetLocalCredits) break;
        if (/^(GE|CFG|ES)/.test(module.moduleCode) && moduleLevel(module.moduleCode) <= 2) {
            includeModule(module.moduleCode);
        }
    }

    // Complete odd 1–2 MC gaps with a suitable lower-level unrestricted elective.
    // This keeps the graduation total exact when a programme contains non-4-MC modules.
    const unrestrictedCandidates = [...modules]
        .filter((module) => moduleLevel(module.moduleCode) <= 2)
        .sort((a, b) => moduleCredits(a) - moduleCredits(b) || a.moduleCode.localeCompare(b.moduleCode));
    for (const module of unrestrictedCandidates) {
        if (selectedCredits >= targetLocalCredits) break;
        includeModule(module.moduleCode);
    }

    const unscheduled = new Set(selected);
    const completed = new Set();
    const semesters = [];
    const plan = {};

    for (let semester = 1; semester <= 8; semester += 1) {
        const label = `Y${Math.ceil(semester / 2)}S${semester % 2 || 2}`;
        semesters.push(label);

        if (semester === exchangeSemester) {
            plan[label] = [];
            continue;
        }

        const scheduled = [];
        let scheduledCredits = 0;
        const offeredIn = semester % 2 || 2;
        const maxLevel = semester <= 2 ? 2 : semester <= 4 ? 3 : 4;
        const available = [...unscheduled].sort((a, b) => {
            const aPriority = corePriority.get(a) ?? 1000 + moduleLevel(a);
            const bPriority = corePriority.get(b) ?? 1000 + moduleLevel(b);
            return aPriority - bPriority || a.localeCompare(b);
        });

        for (const code of available) {
            if (scheduledCredits >= 20) break;
            const module = moduleByCode.get(code);
            const credits = moduleCredits(module);
            if (scheduledCredits + credits > 20) continue;
            if (moduleLevel(code) > maxLevel) continue;
            const includedPrereqs = [...(prerequisites.get(code) || [])].filter((item) => selected.has(item));
            const ready = includedPrereqs.every((item) => completed.has(item));
            const offered = !module.semesters?.length || module.semesters.includes(offeredIn);
            if (ready && offered) {
                scheduled.push(code);
                scheduledCredits += credits;
            }
        }

        // If semester availability is incomplete in NUSMods, keep the plan moving while
        // still preserving prerequisite order.
        if (scheduledCredits < 20) {
            for (const code of available) {
                if (scheduledCredits >= 20 || scheduled.includes(code)) continue;
                const credits = moduleCredits(moduleByCode.get(code));
                if (scheduledCredits + credits > 20) continue;
                const includedPrereqs = [...(prerequisites.get(code) || [])].filter((item) => selected.has(item));
                if (includedPrereqs.every((item) => completed.has(item))) {
                    scheduled.push(code);
                    scheduledCredits += credits;
                }
            }
        }

        for (const code of scheduled) {
            unscheduled.delete(code);
            completed.add(code);
        }
        plan[label] = scheduled;
    }

    // Modules with unusual 1–3 MC weights do not always pack into exact 20-MC
    // semesters. Place any residual module in the latest home semester with room,
    // keeping larger professional-programme blocks intact where necessary.
    for (const code of [...unscheduled]) {
        const credits = moduleCredits(moduleByCode.get(code));
        const homeSemesters = semesters
            .filter((_, index) => index + 1 !== exchangeSemester)
            .reverse();

        const destination = homeSemesters.find((label) => {
            const currentCredits = plan[label]
                .reduce((sum, moduleCode) => sum + moduleCredits(moduleByCode.get(moduleCode)), 0);
            return currentCredits + credits <= 32;
        });

        if (destination) {
            plan[destination].push(code);
            unscheduled.delete(code);
        }
    }

    return {
        major: { id: major.id, name: major.name, faculty: major.faculty },
        exchangeSemester,
        exchangeCredits: exchangeSemester ? 20 : 0,
        localCredits: selectedCredits,
        totalCredits: selectedCredits + (exchangeSemester ? 20 : 0),
        semesters,
        plan,
        modules: [...selected].map((code) => moduleByCode.get(code)),
    };
}

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

app.get("/api/majors", (req, res) => {
    res.json({ majors: MAJORS.map(({ id, name, faculty }) => ({ id, name, faculty })) });
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
    const major = MAJORS.find((item) => item.id === req.body.major);
    const exchangeSemester = Number(req.body.exchangeSemester || 0);

    if (!major) {
        res.status(400).json({ error: "Please select a supported major." });
        return;
    }
    if (!Number.isInteger(exchangeSemester) || exchangeSemester < 0 || exchangeSemester > 8) {
        res.status(400).json({ error: "Exchange semester must be between 1 and 8." });
        return;
    }

    const [moduleResult, prerequisiteResult] = await Promise.all([
        pool.query(
            `SELECT module_code AS "moduleCode", module_name AS title,
                    modular_credits AS "modularCredits", description, faculty,
                    semesters, prerequisite_text AS "prerequisiteText",
                    nusmods_url AS "nusmodsUrl"
             FROM modules ORDER BY module_code`
        ),
        pool.query(
            `SELECT module_code AS "moduleCode",
                    prerequisite_module_code AS "prerequisiteModuleCode"
             FROM prerequisites`
        ),
    ]);

    res.json(buildRoadmap(major, moduleResult.rows, prerequisiteResult.rows, exchangeSemester));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
