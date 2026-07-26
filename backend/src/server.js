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
];

// The nine NUS Business School (BBA) majors. Cores list the major-specific compulsory
// courses; the shared Business Function/Environment courses, GE pillars, Field Service
// Project and capstone are added by the faculty requirement builder.
const BUSINESS_MAJORS = [
    {
        id: "applied-business-analytics",
        name: "Applied Business Analytics",
        faculty: "NUS Business School",
        prefixes: ["DBA", "DOS", "DAO", "IT"],
        core: ["DBA3702", "DBA3803", "IT3010", "MNO2705A"],
    },
    {
        id: "business-economics",
        name: "Business Economics",
        faculty: "NUS Business School",
        prefixes: ["BSE", "EC"],
        core: ["BSE3702", "BSE3703", "MNO2705A"],
    },
    {
        id: "finance",
        name: "Finance",
        faculty: "NUS Business School",
        prefixes: ["FIN"],
        core: ["FIN3701A", "FIN3702A", "FIN3703A", "MNO2705A"],
    },
    {
        id: "innovation-entrepreneurship",
        name: "Innovation & Entrepreneurship",
        faculty: "NUS Business School",
        prefixes: ["BSN"],
        core: ["BSN3701", "BSN3702", "MNO2705A"],
    },
    {
        id: "leadership-human-capital",
        name: "Leadership & Human Capital Management",
        faculty: "NUS Business School",
        prefixes: ["MNO"],
        core: ["MNO3701", "MNO3702", "MNO3703", "MNO2705A"],
    },
    {
        id: "marketing",
        name: "Marketing",
        faculty: "NUS Business School",
        prefixes: ["MKT"],
        core: ["MKT3701A", "MKT3702A", "MNO2705A"],
    },
    {
        id: "operations-supply-chain",
        name: "Operations & Supply Chain Management",
        faculty: "NUS Business School",
        prefixes: ["DOS", "DBA"],
        core: ["DOS3701", "DOS3703", "DOS3704", "MNO2705A"],
    },
    {
        id: "accountancy",
        name: "Accountancy",
        faculty: "NUS Business School",
        prefixes: ["ACC"],
        core: ["ACC2706", "ACC2707", "ACC2708", "ACC2727", "ACC3702", "ACC3703", "ACC3706", "ACC3727", "ACC4702", "ACC4703"],
    },
    {
        id: "real-estate",
        name: "Real Estate",
        faculty: "NUS Business School",
        prefixes: ["RE"],
        core: ["RE2702", "RE2705", "RE3701", "RE3705", "RE3706"],
    },
];

const GENERIC_MAJORS = [
    ["computer-engineering", "Computer Engineering", "College of Design and Engineering", ["CG", "CS", "EE"]],
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
].map(([id, name, faculty, prefixes]) => ({ id, name, faculty, prefixes, core: [] }));

const MAJORS = [...CURATED_MAJORS, ...BUSINESS_MAJORS, ...GENERIC_MAJORS]
    .sort((a, b) => a.faculty.localeCompare(b.faculty) || a.name.localeCompare(b.name));

const COMMON_MODULES = ["GEA1000", "ES2660", "CFG1002", "GEC1015", "GEN2001"];
const INTEREST_AREAS = {
    broad: ["introduction", "general", "society", "communication", "thinking", "reasoning", "world", "culture"],
    ai: ["artificial intelligence", "machine learning", "deep learning", "natural language", "computer vision", "neural"],
    data: ["data", "analytics", "statistics", "statistical", "database", "mining", "visualisation", "visualization", "optimization", "optimisation"],
    software: ["software", "systems", "programming", "architecture", "distributed", "parallel", "cloud"],
    security: ["security", "privacy", "cryptography", "risk", "fraud", "forensics"],
    product: ["product", "management", "marketing", "entrepreneurship", "innovation", "business", "strategy"],
    finance: ["finance", "financial", "investment", "banking", "capital", "accounting", "economics", "market"],
    healthcare: ["health", "healthcare", "medicine", "medical", "nursing", "patient", "clinical", "public health", "pharmaceutical"],
    lifeScience: ["biology", "biological", "life science", "biochemistry", "genetics", "molecular", "ecology", "physiology"],
    engineering: ["engineering", "design", "mechanics", "materials", "electrical", "electronics", "manufacturing", "systems"],
    builtEnvironment: ["architecture", "urban", "real estate", "landscape", "planning", "building", "environment"],
    sustainability: ["sustainability", "sustainable", "environment", "climate", "energy", "ecology", "conservation"],
    socialScience: ["psychology", "sociology", "political", "policy", "social", "society", "behaviour", "behavior"],
    humanities: ["history", "philosophy", "literature", "language", "linguistics", "culture", "religion", "ethics"],
    mediaDesign: ["media", "communications", "design", "visual", "interaction", "digital", "storytelling", "creative"],
    lawGovernance: ["law", "legal", "governance", "regulation", "policy", "public", "justice"],
    education: ["education", "teaching", "learning", "pedagogy", "curriculum", "student"],
};

// --- School of Computing graduation requirements ---
// These common-curriculum requirements apply to the three School of Computing degrees.
const SOC_MAJOR_IDS = new Set(["computer-science", "business-analytics", "information-systems"]);
const SOC_ETHICS = "IS1108"; // Computing Ethics (4 units)

// Digital Literacy is satisfied by the programming-methodology variant already in each
// degree's core. Data Literacy and Critique & Expression are satisfied by degree-specific
// courses; the remaining pillars are drawn from the NUS General Education pools.
const SOC_DEGREE = {
    "computer-science": { programming: "CS1101S", dataLiteracy: "GEA1000", critique: "ES2660" },
    "information-systems": { programming: "CS1010J", dataLiteracy: "BT1101", critique: "ES2660" },
    "business-analytics": { programming: "CS1010A", dataLiteracy: "BT1101", critique: "ES2660" },
};
const PROGRAMMING_VARIANTS = ["CS1010", "CS1010E", "CS1010J", "CS1010S", "CS1010X", "CS1010A", "CS1101S"];
const PILLAR_PREFIX = { cultures: "GEC", singapore: "GES" };

// Year-long Service Learning pairs (Communities & Engagement). The X course runs in a
// Semester 1 and its matching Y course in the following Semester 2.
const SERVICE_LEARNING_PAIRS = [
    ["GEN2050X", "GEN2050Y"],
    ["GEN2060X", "GEN2060Y"],
    ["GEN2061X", "GEN2061Y"],
    ["GEN2062X", "GEN2062Y"],
    ["GEN2070X", "GEN2070Y"],
];
const SEMESTER_LONG_CE = ["GEN2001", "GEN2050", "GEN2060", "GEN2061", "GEN2062", "GEN2070"];

// Interdisciplinary (ID) course list (Appendix B). Any course from the Chemistry,
// Physics or Biological Sciences departments (CM/PC/LSM/ZB) also counts as ID.
const ID_COURSE_LIST = [
    "DTK1234", "EG1311", "IE2141", "PF1101A", "PF1101", "CDE2501", "EG2501", "CDE2300", "CDE2310", "EG2201A", "EG2310",
    "IS1128", "IS2218", "IS2238",
    "HSH1000", "HSS1000", "HSA1000", "HSI1000", "HSI2001", "HSI2002", "HSI2003", "HSI2004", "HSI2005", "HSI2007",
    "HSI2008", "HSI2009", "HSI2010", "HSI2011", "HSI2013", "HSI2014",
    "ACC1701", "DAO2703", "MNO1706X", "SC1101E", "EL1101E", "PE2101P", "GE2103", "XD3103", "GE3253", "GE3255",
    "GE3256", "SPH2002", "SC2226", "NUR1113A",
];
const ID_PREFIXES = ["PC", "CM", "LSM", "ZB"];
const ID_COURSE_SET = new Set(ID_COURSE_LIST);
const CD_COURSE_SET = new Set(); // Appendix C not yet provided
const IDCD_REQUIRED_UNITS = 12;
const IDCD_MIN_ID = 2;
const IDCD_MAX_CD = 1;

function isIdCourse(code) {
    return ID_COURSE_SET.has(code) || ID_PREFIXES.some((prefix) => code.startsWith(prefix));
}
function isCdCourse(code) {
    return CD_COURSE_SET.has(code);
}

// --- NUS Business School (BBA) graduation requirements ---
const BUSINESS_FACULTY = "NUS Business School";
const BUSINESS_FUNCTION_COURSES = ["ACC1701", "MKT1705", "MNO1706", "DAO2702", "DAO2703", "FIN2704"];
const BUSINESS_ENVIRONMENT_COURSES = ["BSP1702", "BSP1703", "DAO1704", "ES2002", "RE1708", "MNO2708"];
const BBA_DIGITAL_LITERACY = "DAO1704"; // Digital Literacy pillar, also a Business Environment course
const FIELD_SERVICE_PROJECT = "FSP4003"; // Cross-disciplinary consulting practicum (8 units)
const BBA_CAPSTONE = { accountancy: "ACC4701", "real-estate": "RE4701" }; // default BSP4701
const BBA_PILLAR_PREFIX = { data: "GEA", cultures: "GEC", singapore: "GES", critique: "GEX" };

// --- College of Humanities and Sciences (CHS) Common Curriculum ---
// Shared by CHS FASS and Science majors (Bachelor of Pharmacy is the FoS exception).
const CHS_FACULTY = "College of Humanities and Sciences";
const CHS_EXCLUDED_MAJORS = new Set(["pharmaceutical-science"]); // Pharmacy uses a different curriculum
const CHS_DATA_LITERACY_EXEMPT = new Set(["data-science-analytics", "statistics"]); // gateway fulfils Data Literacy
const CHS_WRITING = "FAS1101";
const CHS_DATA_LITERACY = "GEA1000";
const CHS_DIGITAL_LITERACY = "GEI1001";
const CHS_DESIGN_THINKING = "DTK1234";
const CHS_INTEGRATED = { asian: "HSA1000", humanities: "HSH1000", social: "HSS1000", scienceI: "HSI1000" };
const CHS_AI_COURSES = ["HS1501", "HS1502", "HS1503"];

// --- College of Design and Engineering (CDE) common curriculum ---
const CDE_FACULTY = "College of Design and Engineering";
const CDE_DESIGN_MAJORS = new Set(["architecture", "industrial-design", "landscape-architecture"]); // not B.Eng
const CDE_DIGITAL_LITERACY = "GEI1001";
const CDE_COMMON = { designThinking: "DTK1234", makerSpace: "EG1311", ai: "CDE2212", projectManagement: "PF1101A" };
const CDE_ENGINEERING_CORE = ["MA1511", "MA1512", "MA1508E", "EG2401A", "EG3611A"];
const CDE_PILLAR_PREFIX = { data: "GEA", cultures: "GEC", singapore: "GES", critique: "GEX" };

// Resolves a base course code to a catalogue entry, falling back to the first lettered
// variant when only variants exist (e.g. ACC1701 -> ACC1701A, BSP4701 -> BSP4701A).
function resolveCode(base, moduleByCode) {
    if (moduleByCode.has(base)) return base;
    const variant = new RegExp(`^${base}[A-Z]+$`);
    let best = null;
    for (const code of moduleByCode.keys()) {
        if (variant.test(code) && (!best || code < best)) best = code;
    }
    return best;
}

// Chooses and places a year-long Service Learning pair across two contiguous semesters,
// preferring Year 2 (or Year 1 for poly students).
function placeServiceLearning(moduleByCode, totalCredits, blockedSemIndices) {
    const pair = SERVICE_LEARNING_PAIRS.find(([x, y]) => moduleByCode.has(x) && moduleByCode.has(y)) || null;
    const servicePins = new Map();
    let serviceSlots = null;
    if (pair) {
        const preferredYears = totalCredits === 140 ? [1, 2, 3] : [2, 1, 3];
        for (const year of preferredYears) {
            const s1 = 2 * year - 1;
            const s2 = 2 * year;
            if (!blockedSemIndices.has(s1) && !blockedSemIndices.has(s2)) {
                serviceSlots = [SEM_LABELS[s1 - 1], SEM_LABELS[s2 - 1]];
                servicePins.set(pair[0], serviceSlots[0]);
                servicePins.set(pair[1], serviceSlots[1]);
                break;
            }
        }
    }
    return { servicePair: serviceSlots ? pair : null, servicePins, serviceSlots };
}

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

function moduleCategory(code, major, addOnCategoryByCode) {
    if (addOnCategoryByCode.has(code)) return addOnCategoryByCode.get(code);
    if (major.core.includes(code)) return "core";
    if (major.prefixes.some((prefix) => code.startsWith(prefix)) && moduleLevel(code) >= 3) return "specialisation";
    return "elective";
}

function recommendationScore(module, terms, major) {
    const text = `${module.moduleCode} ${module.title || ""} ${module.description || ""}`.toLowerCase();
    const termScore = terms.reduce((sum, term) => sum + (text.includes(term) ? 2 : 0), 0);
    const prefixScore = major.prefixes.some((prefix) => module.moduleCode.startsWith(prefix)) ? 2 : 0;
    const levelScore = moduleLevel(module.moduleCode) >= 2 && moduleLevel(module.moduleCode) <= 4 ? 1 : 0;
    return termScore + prefixScore + levelScore;
}

function prereqStrictlySatisfied(tree, completedBefore) {
    if (!tree) return true;
    if (typeof tree === "string") {
        const code = prereqLeafCode(tree);
        return code ? completedBefore.has(code) : true;
    }
    if (Array.isArray(tree)) return tree.every((item) => prereqStrictlySatisfied(item, completedBefore));
    if (typeof tree === "object") {
        if (Array.isArray(tree.and)) return tree.and.every((item) => prereqStrictlySatisfied(item, completedBefore));
        if (Array.isArray(tree.or)) return tree.or.some((item) => prereqStrictlySatisfied(item, completedBefore));
        if (Array.isArray(tree.nOf)) {
            const [count, items] = tree.nOf;
            return items.filter((item) => prereqStrictlySatisfied(item, completedBefore)).length >= count;
        }
    }
    return true;
}

function recommendElectives(modules, major, planned, slotCredits, slots, activeRegular, slotModules, prereqEdges, prereqTreeByCode, interestArea) {
    const terms = INTEREST_AREAS[interestArea] || INTEREST_AREAS.broad;
    const plannedFamilies = new Set([...planned].map(moduleFamily));
    const completedBeforeBySlot = new Map();
    const completed = new Set();
    for (const slot of slots) {
        completedBeforeBySlot.set(slot.id, new Set(completed));
        for (const code of slotModules.get(slot.id) || []) completed.add(code);
    }
    return modules
        .filter((module) => !planned.has(module.moduleCode))
        .filter((module) => !plannedFamilies.has(moduleFamily(module.moduleCode)))
        .filter((module) => !isNonstandardRecommendation(module))
        .map((module) => {
            const score = recommendationScore(module, terms, major);
            const fitSlot = activeRegular.find((slot) => {
                const offered = !module.semesters?.length || module.semesters.includes(slot.offeredIn);
                if (!offered || slotCredits.get(slot.id) + moduleCredits(module) > 24) return false;
                const completedBefore = completedBeforeBySlot.get(slot.id) || new Set();
                const tree = prereqTreeByCode.get(module.moduleCode);
                if (tree) return prereqStrictlySatisfied(tree, completedBefore);
                const edges = prereqEdges.get(module.moduleCode);
                return !edges || [...edges].every((code) => completedBefore.has(code));
            });
            return {
                moduleCode: module.moduleCode,
                title: module.title,
                modularCredits: moduleCredits(module),
                category: "elective",
                score,
                fitSlot: fitSlot ? fitSlot.id : null,
                label: fitSlot ? `Fits ${fitSlot.id}` : "No eligible semester",
                blocked: !fitSlot,
                prerequisiteText: module.prerequisiteText || "",
                nusmodsUrl: module.nusmodsUrl,
            };
        })
        .filter((item) => item.score > 0 && !item.blocked)
        .sort((a, b) => b.score - a.score || a.moduleCode.localeCompare(b.moduleCode))
        .slice(0, 6);
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

function selectRequirementModules(programme, modules, moduleByCode, requiredCount) {
    const selected = [];
    const seenFamilies = new Set();
    const seenTitles = new Set();

    function include(code, allowNonstandard = false) {
        if (!moduleByCode.has(code) || selected.includes(code) || selected.length >= requiredCount) return;
        const module = moduleByCode.get(code);
        if (!allowNonstandard && isNonstandardRecommendation(module)) return;
        const family = moduleFamily(code);
        const title = normalizedTitle(module.title);
        if (seenFamilies.has(family) || (title && seenTitles.has(title))) return;
        selected.push(code);
        seenFamilies.add(family);
        if (title) seenTitles.add(title);
    }

    programme.core.forEach((code) => include(code, true));
    modules
        .filter((module) => programme.prefixes.some((prefix) => module.moduleCode.startsWith(prefix)))
        .sort((a, b) => moduleLevel(a.moduleCode) - moduleLevel(b.moduleCode) || a.moduleCode.localeCompare(b.moduleCode))
        .forEach((module) => include(module.moduleCode));

    return selected;
}

function buildAddOnSelection(id, type, primaryMajor, modules, moduleByCode) {
    if (!id || id === "none" || id === primaryMajor.id) return null;
    const programme = MAJORS.find((item) => item.id === id);
    if (!programme) return null;
    const requiredCount = type === "secondMajor" ? 10 : 5;
    const required = selectRequirementModules(programme, modules, moduleByCode, requiredCount);
    return {
        id: programme.id,
        name: programme.name,
        type,
        required,
        targetUnits: requiredCount * 4,
    };
}

const SEM_LABELS = ["Y1S1", "Y1S2", "Y2S1", "Y2S2", "Y3S1", "Y3S2", "Y4S1", "Y4S2"];
const ELIGIBLE_INTERNSHIP_SLOTS = new Set(["Y2S2", "Y3S1", "Y3S2", "Y4S1", "SUM2", "SUM3"]);
const VALID_INTERNSHIP_UNITS = new Set([4, 8, 10, 12]);
const MIN_MC_BEFORE_INTERNSHIP = 70;
const MAX_INTERNSHIP_UNITS = 20;
const SEMESTER_CAP = 32;

// The roadmap timeline interleaves the eight regular semesters with the vacation
// Special Terms: a winter break after each Semester 1 and a summer break after each
// Semester 2 (except the final graduating semester). Break slots only surface in the
// output when the student places something in them.
function buildTimelineSlots() {
    const slots = [];
    for (let index = 1; index <= 8; index += 1) {
        const year = Math.ceil(index / 2);
        const part = index % 2 || 2;
        slots.push({
            id: SEM_LABELS[index - 1],
            kind: "sem",
            semIndex: index,
            offeredIn: part,
            year,
            label: SEM_LABELS[index - 1],
            sublabel: `Year ${year} · Semester ${part}`,
        });
        if (part === 1) {
            slots.push({ id: `WIN${year}`, kind: "winter", year, offeredIn: null, label: `Year ${year} Winter`, sublabel: "Winter break · Special Term" });
        } else if (index < 8) {
            slots.push({ id: `SUM${year}`, kind: "summer", year, offeredIn: null, label: `Year ${year} Summer`, sublabel: "Summer break · Special Term" });
        }
    }
    return slots;
}

function prereqLeafCode(leaf) {
    const match = String(leaf).match(/^([A-Z]{2,4}\d{4}[A-Z]{0,3})/);
    return match ? match[1] : null;
}

// Evaluates a NUSMods structured prerequisite tree (and / or / nOf) against the set of
// modules that are present in the student's plan. A module leaf is satisfied only when
// that module is in the plan; non-module conditions (free-text leaves) are treated as
// satisfied because they are not module requirements this tool tracks. Used to decide
// whether removing a module would leave a dependent without a prerequisite it can rely on.
function prereqSatisfiedByPlan(tree, planSet) {
    if (!tree) return true;
    if (typeof tree === "string") {
        const code = prereqLeafCode(tree);
        if (!code) return true;
        return planSet.has(code);
    }
    if (Array.isArray(tree)) return tree.every((item) => prereqSatisfiedByPlan(item, planSet));
    if (typeof tree === "object") {
        if (Array.isArray(tree.and)) return tree.and.every((item) => prereqSatisfiedByPlan(item, planSet));
        if (Array.isArray(tree.or)) return tree.or.some((item) => prereqSatisfiedByPlan(item, planSet));
        if (Array.isArray(tree.nOf)) {
            const [count, items] = tree.nOf;
            return items.filter((item) => prereqSatisfiedByPlan(item, planSet)).length >= count;
        }
    }
    return true;
}

// Tri-state evaluation of a prerequisite tree for a manually placed module.
// Returns "sat" (a required, in-plan prerequisite is completed earlier),
// "unsat" (an in-plan prerequisite exists but is not completed before the slot), or
// "irrelevant" (the requirement is met outside the plan, e.g. A-levels / bridging
// modules the student isn't taking, so it shouldn't block the placement).
function prereqAddStatus(tree, completedBefore, planned) {
    if (!tree) return "irrelevant";
    if (typeof tree === "string") {
        const code = prereqLeafCode(tree);
        if (!code) return "irrelevant";
        if (completedBefore.has(code)) return "sat";
        if (planned.has(code)) return "unsat";
        return "irrelevant";
    }
    const combine = (items, kind, threshold) => {
        const statuses = items.map((item) => prereqAddStatus(item, completedBefore, planned));
        const sat = statuses.filter((status) => status === "sat").length;
        const unsat = statuses.filter((status) => status === "unsat").length;
        if (kind === "and") {
            if (unsat > 0) return "unsat";
            return sat > 0 ? "sat" : "irrelevant";
        }
        if (kind === "or") {
            if (sat > 0) return "sat";
            return unsat > 0 ? "unsat" : "irrelevant";
        }
        // nOf
        if (sat >= threshold) return "sat";
        return unsat > 0 ? "unsat" : "irrelevant";
    };
    if (Array.isArray(tree)) return combine(tree, "and");
    if (typeof tree === "object") {
        if (Array.isArray(tree.and)) return combine(tree.and, "and");
        if (Array.isArray(tree.or)) return combine(tree.or, "or");
        if (Array.isArray(tree.nOf)) return combine(tree.nOf[1], "nOf", tree.nOf[0]);
    }
    return "irrelevant";
}

// Deterministic rule-based module selection for a major up to the local module budget.
// Independent of the student's manual edits so the base plan is stable across requests.
// Codes in excludeCodes are skipped (e.g. modules the student has pinned manually).
function selectBaseModules(major, modules, moduleByCode, localModuleCredits, excludeCodes = new Set(), interestArea = "broad") {
    const candidates = modules
        .filter((module) => major.prefixes.some((prefix) => module.moduleCode.startsWith(prefix)))
        .sort((a, b) => moduleLevel(a.moduleCode) - moduleLevel(b.moduleCode) || a.moduleCode.localeCompare(b.moduleCode));
    const terms = INTEREST_AREAS[interestArea] || INTEREST_AREAS.broad;
    const selected = new Set();
    const selectedFamilies = new Set();
    const selectedTitles = new Set();
    const selectedCategories = new Set();
    let credits = 0;

    function includeModule(code, curated = false) {
        if (!moduleByCode.has(code) || selected.has(code) || excludeCodes.has(code) || credits >= localModuleCredits) return;
        const module = moduleByCode.get(code);
        const moduleCredit = moduleCredits(module);
        if (credits + moduleCredit > localModuleCredits) return;
        const family = moduleFamily(code);
        const title = normalizedTitle(module.title);
        const category = limitedElectiveCategory(module);
        if (selectedFamilies.has(family) || (title && selectedTitles.has(title))) return;
        if (!curated && category && selectedCategories.has(category)) return;
        if (!curated && isNonstandardRecommendation(module)) return;
        selected.add(code);
        credits += moduleCredit;
        selectedFamilies.add(family);
        if (title) selectedTitles.add(title);
        if (category) selectedCategories.add(category);
    }

    major.core.forEach((code) => includeModule(code, true));
    COMMON_MODULES.forEach((code) => includeModule(code));

    const includeInterestModules = () => {
        const ranked = modules
            .filter((module) => moduleLevel(module.moduleCode) <= 4)
            .map((module) => ({ module, score: recommendationScore(module, terms, major) }))
            .filter((item) => item.score > 0)
            .sort((a, b) => b.score - a.score || moduleLevel(a.module.moduleCode) - moduleLevel(b.module.moduleCode) || a.module.moduleCode.localeCompare(b.module.moduleCode));
        for (const { module } of ranked) {
            if (credits >= localModuleCredits) break;
            includeModule(module.moduleCode);
        }
    };

    if (major.core.length > 0) includeInterestModules();

    for (const module of candidates) {
        if (credits >= localModuleCredits) break;
        // NUS offers several mutually exclusive introductory programming variants.
        // The major's curated core already chooses the appropriate one.
        if (/^CS(?:1010[A-Z]*|1101S|1231)$/.test(module.moduleCode)) continue;
        includeModule(module.moduleCode);
    }
    if (major.core.length === 0) includeInterestModules();
    for (const module of modules) {
        if (credits >= localModuleCredits) break;
        if (/^(GE|CFG|ES)/.test(module.moduleCode) && moduleLevel(module.moduleCode) <= 2) {
            includeModule(module.moduleCode);
        }
    }
    const unrestricted = [...modules]
        .filter((module) => moduleLevel(module.moduleCode) <= 2)
        .sort((a, b) => moduleCredits(a) - moduleCredits(b) || a.moduleCode.localeCompare(b.moduleCode));
    for (const module of unrestricted) {
        if (credits >= localModuleCredits) break;
        includeModule(module.moduleCode);
    }

    return selected;
}

function pickPillarCourse(modules, prefix, avoid) {
    const candidate = modules
        .filter((module) => module.moduleCode.startsWith(prefix) && !avoid.has(module.moduleCode))
        .filter((module) => moduleCredits(module) === 4)
        .sort((a, b) => moduleLevel(a.moduleCode) - moduleLevel(b.moduleCode) || a.moduleCode.localeCompare(b.moduleCode));
    return candidate.length ? candidate[0].moduleCode : null;
}

// Builds the School of Computing common-curriculum requirement set for a degree:
// the six university pillars, the computing-ethics course, the year-long Service
// Learning pair, and 12 units of interdisciplinary/cross-disciplinary courses.
function buildComputingRequirements(major, modules, moduleByCode, totalCredits, blockedSemIndices) {
    const degree = SOC_DEGREE[major.id];
    if (!degree) return null;

    const coreSet = new Set(major.core);
    const covered = new Set([...major.core, ...COMMON_MODULES]);
    const avoid = new Set(covered);
    const required = [];
    const addReq = (code) => {
        // Core modules already satisfy their requirement, so they are not added again.
        if (code && moduleByCode.has(code) && !coreSet.has(code) && !required.includes(code)) {
            required.push(code);
            avoid.add(code);
        }
    };
    const coveredByPrefix = (prefix) => [...covered].some((code) => code.startsWith(prefix) && moduleByCode.has(code));

    // Digital Literacy: covered by a programming-methodology variant. If the degree's
    // prescribed variant isn't in the catalogue, add the first available fallback.
    const coreProgramming = major.core.find((code) => /^CS(1010[A-Z]*|1101S)$/.test(code) && moduleByCode.has(code));
    let programming = coreProgramming || null;
    if (!coreProgramming) {
        programming = [degree.programming, ...PROGRAMMING_VARIANTS].find((code) => moduleByCode.has(code)) || null;
        addReq(programming);
    }

    // Pillars
    addReq(degree.dataLiteracy); // Data Literacy
    addReq(degree.critique); // Critique & Expression
    const cultures = coveredByPrefix(PILLAR_PREFIX.cultures)
        ? [...covered].find((code) => code.startsWith(PILLAR_PREFIX.cultures) && moduleByCode.has(code))
        : pickPillarCourse(modules, PILLAR_PREFIX.cultures, avoid);
    if (!coveredByPrefix(PILLAR_PREFIX.cultures)) addReq(cultures);
    const singapore = coveredByPrefix(PILLAR_PREFIX.singapore)
        ? [...covered].find((code) => code.startsWith(PILLAR_PREFIX.singapore) && moduleByCode.has(code))
        : pickPillarCourse(modules, PILLAR_PREFIX.singapore, avoid);
    if (!coveredByPrefix(PILLAR_PREFIX.singapore)) addReq(singapore);

    // Computing Ethics
    addReq(SOC_ETHICS);

    // Interdisciplinary / cross-disciplinary: three 4-unit courses (>= 2 ID, <= 1 CD).
    const idPicked = [];
    for (const code of ID_COURSE_LIST) {
        if (idPicked.length >= 3) break;
        if (!moduleByCode.has(code) || coreSet.has(code) || required.includes(code)) continue;
        idPicked.push(code);
        addReq(code);
    }
    if (idPicked.length < 3) {
        const extra = modules
            .filter((module) => ID_PREFIXES.some((prefix) => module.moduleCode.startsWith(prefix)))
            .filter((module) => moduleCredits(module) === 4 && !coreSet.has(module.moduleCode) && !required.includes(module.moduleCode))
            .sort((a, b) => moduleLevel(a.moduleCode) - moduleLevel(b.moduleCode) || a.moduleCode.localeCompare(b.moduleCode));
        for (const module of extra) {
            if (idPicked.length >= 3) break;
            idPicked.push(module.moduleCode);
            addReq(module.moduleCode);
        }
    }

    // Communities & Engagement via a year-long Service Learning pair placed across two
    // contiguous semesters (Sem 1 -> Sem 2). Prefer Year 2 (or Year 1 for poly students).
    const pair = SERVICE_LEARNING_PAIRS.find(([x, y]) => moduleByCode.has(x) && moduleByCode.has(y)) || null;
    const servicePins = new Map();
    let serviceSlots = null;
    if (pair) {
        const preferredYears = totalCredits === 140 ? [1, 2, 3] : [2, 1, 3];
        for (const year of preferredYears) {
            const s1 = 2 * year - 1;
            const s2 = 2 * year;
            if (!blockedSemIndices.has(s1) && !blockedSemIndices.has(s2)) {
                serviceSlots = [SEM_LABELS[s1 - 1], SEM_LABELS[s2 - 1]];
                servicePins.set(pair[0], serviceSlots[0]);
                servicePins.set(pair[1], serviceSlots[1]);
                break;
            }
        }
    }

    const servicePairValue = serviceSlots ? pair : null;
    const computeChecks = (planned) => {
        const has = (code) => code && planned.has(code);
        const hasPrefix = (prefix) => [...planned].some((code) => code.startsWith(prefix));
        const programmingCovered = [...planned].some((code) => /^CS(1010[A-Z]*|1101S)$/.test(code));
        const ceSatisfied = Boolean(servicePairValue && has(servicePairValue[0]) && has(servicePairValue[1]))
            || [...planned].some((code) => /^GEN2/.test(code) && !/[XY]$/.test(code));
        const idCd = [...planned].filter((code) => isIdCourse(code) || isCdCourse(code));
        const idCount = idCd.filter((code) => isIdCourse(code) && !isCdCourse(code)).length;
        const cdCount = idCd.filter((code) => isCdCourse(code)).length;
        const idCdUnits = idCd.reduce((sum, code) => sum + moduleCredits(moduleByCode.get(code)), 0);
        return [
            { key: "digital-literacy", label: "University Pillar · Digital Literacy", satisfied: programmingCovered, detail: "Programming Methodology" },
            { key: "data-literacy", label: "University Pillar · Data Literacy", satisfied: has(degree.dataLiteracy), detail: degree.dataLiteracy },
            { key: "critique", label: "University Pillar · Critique & Expression", satisfied: has(degree.critique), detail: degree.critique },
            { key: "cultures", label: "University Pillar · Cultures & Connections", satisfied: hasPrefix("GEC"), detail: cultures || "GEC course" },
            { key: "singapore", label: "University Pillar · Singapore Studies", satisfied: hasPrefix("GES"), detail: singapore || "GES course" },
            { key: "community", label: "University Pillar · Communities & Engagement", satisfied: ceSatisfied, detail: servicePairValue ? `${servicePairValue[0]} + ${servicePairValue[1]}` : "Service Learning" },
            { key: "ethics", label: "Computing Ethics", satisfied: has(SOC_ETHICS), detail: SOC_ETHICS },
            { key: "id-cd", label: "Interdisciplinary/Cross-disciplinary (12 units · ≥2 ID · ≤1 CD)", satisfied: idCdUnits >= IDCD_REQUIRED_UNITS && idCount >= IDCD_MIN_ID && cdCount <= IDCD_MAX_CD, detail: `${idCdUnits} units · ${idCount} ID · ${cdCount} CD` },
        ];
    };

    return {
        required,
        idPicked,
        servicePins,
        servicePair: servicePairValue,
        serviceSlots,
        pillars: { programming, dataLiteracy: degree.dataLiteracy, critique: degree.critique, cultures, singapore },
        computeChecks,
    };
}

// Builds the NUS Business School (BBA) common-curriculum and major requirement set:
// Business Function and Business Environment courses, the six university pillars, the
// Field Service Project, the major capstone, and the Work/Global Experience milestones.
function buildBusinessRequirements(major, modules, moduleByCode, totalCredits, blockedSemIndices) {
    const coreSet = new Set(major.core);
    const covered = new Set([...major.core, ...COMMON_MODULES]);
    const avoid = new Set(covered);
    const required = [];
    const addReq = (code) => {
        if (code && moduleByCode.has(code) && !coreSet.has(code) && !required.includes(code)) {
            required.push(code);
            avoid.add(code);
        }
    };
    const coveredByPrefix = (prefix) => [...covered].some((code) => code.startsWith(prefix) && moduleByCode.has(code));
    const resolveAdd = (base) => {
        const code = resolveCode(base, moduleByCode);
        if (code) addReq(code);
        return code;
    };

    const functionResolved = BUSINESS_FUNCTION_COURSES.map((base) => ({ base, code: resolveAdd(base) }));
    const environmentResolved = BUSINESS_ENVIRONMENT_COURSES.map((base) => ({ base, code: resolveAdd(base) }));
    const digitalLiteracy = resolveCode(BBA_DIGITAL_LITERACY, moduleByCode);

    // University pillars from GE pools (skip when a core/common module already covers it).
    const pillarPicks = {};
    for (const [key, prefix] of Object.entries(BBA_PILLAR_PREFIX)) {
        if (coveredByPrefix(prefix)) {
            pillarPicks[key] = [...covered].find((code) => code.startsWith(prefix) && moduleByCode.has(code));
        } else {
            pillarPicks[key] = pickPillarCourse(modules, prefix, avoid);
            addReq(pillarPicks[key]);
        }
    }

    const fieldServiceProject = resolveAdd(FIELD_SERVICE_PROJECT);
    const capstone = resolveAdd(BBA_CAPSTONE[major.id] || "BSP4701");

    const { servicePair, servicePins, serviceSlots } = placeServiceLearning(moduleByCode, totalCredits, blockedSemIndices);

    const computeChecks = (planned, ctx = {}) => {
        const has = (code) => code && planned.has(code);
        const hasPrefix = (prefix) => [...planned].some((code) => code.startsWith(prefix));
        const functionOk = functionResolved.every((item) => item.code && has(item.code));
        const envAvailable = environmentResolved.filter((item) => item.code);
        const envMissing = environmentResolved.filter((item) => !item.code).map((item) => item.base);
        const envOk = envAvailable.length > 0 && envAvailable.every((item) => has(item.code));
        const ceSatisfied = Boolean(servicePair && has(servicePair[0]) && has(servicePair[1]))
            || [...planned].some((code) => /^GEN2/.test(code) && !/[XY]$/.test(code));
        return [
            { key: "business-function", label: "Business Function Courses (24 units)", satisfied: functionOk, detail: functionResolved.map((item) => item.code || item.base).join(", ") },
            { key: "business-environment", label: "Business Environment Courses (20 units)", satisfied: envOk, detail: envMissing.length ? `Not in catalogue: ${envMissing.join(", ")}` : envAvailable.map((item) => item.code).join(", ") },
            { key: "digital-literacy", label: "University Pillar · Digital Literacy", satisfied: has(digitalLiteracy), detail: digitalLiteracy || BBA_DIGITAL_LITERACY },
            { key: "data-literacy", label: "University Pillar · Data Literacy", satisfied: hasPrefix("GEA"), detail: pillarPicks.data || "GEA course" },
            { key: "cultures", label: "University Pillar · Cultures & Connections", satisfied: hasPrefix("GEC"), detail: pillarPicks.cultures || "GEC course" },
            { key: "critique", label: "University Pillar · Critique & Expression", satisfied: hasPrefix("GEX"), detail: pillarPicks.critique || "GEX course" },
            { key: "singapore", label: "University Pillar · Singapore Studies", satisfied: hasPrefix("GES"), detail: pillarPicks.singapore || "GES course" },
            { key: "community", label: "University Pillar · Communities & Engagement", satisfied: ceSatisfied, detail: servicePair ? `${servicePair[0]} + ${servicePair[1]}` : "Service Learning" },
            { key: "field-service-project", label: "Cross-Disciplinary · Field Service Project", satisfied: has(fieldServiceProject), detail: fieldServiceProject || FIELD_SERVICE_PROJECT },
            { key: "capstone", label: "Major Capstone", satisfied: has(capstone), detail: capstone || BBA_CAPSTONE[major.id] || "BSP4701" },
            { key: "wem", label: "Work Experience Milestone", satisfied: Boolean(ctx.hasInternship), detail: ctx.hasInternship ? "Internship planned" : "Add an internship to fulfil WEM" },
            { key: "gem", label: "Global Experience Milestone", satisfied: Boolean(ctx.hasExchange), detail: ctx.hasExchange ? "Exchange planned" : "Add an exchange semester to fulfil GEM" },
        ];
    };

    return { required, servicePins, servicePair, serviceSlots, computeChecks };
}

// Builds the CHS Common Curriculum requirement set (Common Core + Integrated +
// Interdisciplinary courses) shared by CHS FASS and Science majors.
function buildChsRequirements(major, modules, moduleByCode, totalCredits, blockedSemIndices) {
    const coreSet = new Set(major.core);
    const required = [];
    const addReq = (code) => {
        if (code && moduleByCode.has(code) && !coreSet.has(code) && !required.includes(code)) required.push(code);
    };
    const firstAvailable = (list) => list.find((code) => moduleByCode.has(code)) || null;

    const dataExempt = CHS_DATA_LITERACY_EXEMPT.has(major.id);
    const aiCourse = firstAvailable(CHS_AI_COURSES);
    const scienceII = modules
        .filter((module) => /^HSI2/.test(module.moduleCode))
        .map((module) => module.moduleCode)
        .sort()[0] || null;

    // Common Core
    addReq(CHS_WRITING);
    if (!dataExempt) addReq(CHS_DATA_LITERACY);
    addReq(CHS_DIGITAL_LITERACY);
    addReq(CHS_DESIGN_THINKING);
    addReq(aiCourse);
    // Integrated courses (each also fulfils a GE pillar)
    addReq(CHS_INTEGRATED.asian);
    addReq(CHS_INTEGRATED.humanities);
    addReq(CHS_INTEGRATED.social);
    addReq(CHS_INTEGRATED.scienceI);
    addReq(scienceII);

    // Two Interdisciplinary courses, drawn from the interdisciplinary pool but excluding
    // the CHS common/integrated courses themselves.
    const reserved = new Set([CHS_WRITING, CHS_DATA_LITERACY, CHS_DIGITAL_LITERACY, CHS_DESIGN_THINKING, aiCourse, scienceII,
        CHS_INTEGRATED.asian, CHS_INTEGRATED.humanities, CHS_INTEGRATED.social, CHS_INTEGRATED.scienceI, ...major.core]);
    const idPicked = [];
    for (const code of ID_COURSE_LIST) {
        if (idPicked.length >= 2) break;
        if (!moduleByCode.has(code) || reserved.has(code) || required.includes(code)) continue;
        if (/^HS[AHS]\d{4}$/.test(code) || /^HSI/.test(code)) continue; // skip integrated family
        idPicked.push(code);
        addReq(code);
    }

    const { servicePair, servicePins, serviceSlots } = placeServiceLearning(moduleByCode, totalCredits, blockedSemIndices);

    const computeChecks = (planned) => {
        const has = (code) => code && planned.has(code);
        const ceSatisfied = Boolean(servicePair && has(servicePair[0]) && has(servicePair[1]))
            || [...planned].some((code) => /^GEN2/.test(code) && !/[XY]$/.test(code));
        return [
            { key: "writing", label: "Common Core · Writing", satisfied: has(CHS_WRITING), detail: CHS_WRITING },
            { key: "data-literacy", label: "Common Core · Data Literacy", satisfied: dataExempt ? true : has(CHS_DATA_LITERACY), detail: dataExempt ? "Fulfilled by major gateway" : CHS_DATA_LITERACY },
            { key: "digital-literacy", label: "Common Core · Digital Literacy", satisfied: has(CHS_DIGITAL_LITERACY), detail: CHS_DIGITAL_LITERACY },
            { key: "design-thinking", label: "Common Core · Design Thinking", satisfied: has(CHS_DESIGN_THINKING), detail: CHS_DESIGN_THINKING },
            { key: "ai", label: "Common Core · Artificial Intelligence", satisfied: has(aiCourse), detail: aiCourse || "HS15xx" },
            { key: "community", label: "Common Core · Communities & Engagement", satisfied: ceSatisfied, detail: servicePair ? `${servicePair[0]} + ${servicePair[1]}` : "Service Learning" },
            { key: "asian", label: "Integrated · Asian Studies (Cultures & Connections)", satisfied: has(CHS_INTEGRATED.asian), detail: CHS_INTEGRATED.asian },
            { key: "humanities", label: "Integrated · Humanities (Critique & Expression)", satisfied: has(CHS_INTEGRATED.humanities), detail: CHS_INTEGRATED.humanities },
            { key: "social", label: "Integrated · Social Sciences (Singapore Studies)", satisfied: has(CHS_INTEGRATED.social), detail: CHS_INTEGRATED.social },
            { key: "science-1", label: "Integrated · Scientific Inquiry I", satisfied: has(CHS_INTEGRATED.scienceI), detail: CHS_INTEGRATED.scienceI },
            { key: "science-2", label: "Integrated · Scientific Inquiry II", satisfied: has(scienceII), detail: scienceII || "HSI2xxx" },
            { key: "interdisciplinary", label: "Interdisciplinary Courses (2)", satisfied: idPicked.length >= 2 && idPicked.every(has), detail: idPicked.join(", ") || "2 courses" },
        ];
    };

    return { required, servicePins, servicePair, serviceSlots, computeChecks };
}

// Builds the College of Design and Engineering common curriculum: the six GE pillars,
// the CDE common courses (Design Thinking, Maker Space, AI, Project Management), and the
// Engineering Core for the B.Eng majors.
function buildCdeRequirements(major, modules, moduleByCode, totalCredits, blockedSemIndices) {
    const coreSet = new Set(major.core);
    const covered = new Set([...major.core, ...COMMON_MODULES]);
    const avoid = new Set(covered);
    const required = [];
    const addReq = (code) => {
        if (code && moduleByCode.has(code) && !coreSet.has(code) && !required.includes(code)) {
            required.push(code);
            avoid.add(code);
        }
    };
    const coveredByPrefix = (prefix) => [...covered].some((code) => code.startsWith(prefix) && moduleByCode.has(code));

    // GE pillars (Digital Literacy = GEI1001; Communities & Engagement = Service Learning)
    addReq(CDE_DIGITAL_LITERACY);
    const pillarPicks = {};
    for (const [key, prefix] of Object.entries(CDE_PILLAR_PREFIX)) {
        if (coveredByPrefix(prefix)) {
            pillarPicks[key] = [...covered].find((code) => code.startsWith(prefix) && moduleByCode.has(code));
        } else {
            pillarPicks[key] = pickPillarCourse(modules, prefix, avoid);
            addReq(pillarPicks[key]);
        }
    }

    // CDE common courses
    for (const code of Object.values(CDE_COMMON)) addReq(code);

    // Engineering Core (B.Eng majors only)
    const isEngineering = !CDE_DESIGN_MAJORS.has(major.id);
    if (isEngineering) for (const code of CDE_ENGINEERING_CORE) addReq(code);

    const { servicePair, servicePins, serviceSlots } = placeServiceLearning(moduleByCode, totalCredits, blockedSemIndices);

    const computeChecks = (planned) => {
        const has = (code) => code && planned.has(code);
        const hasPrefix = (prefix) => [...planned].some((code) => code.startsWith(prefix));
        const ceSatisfied = Boolean(servicePair && has(servicePair[0]) && has(servicePair[1]))
            || [...planned].some((code) => /^GEN2/.test(code) && !/[XY]$/.test(code));
        const checks = [
            { key: "digital-literacy", label: "University Pillar · Digital Literacy", satisfied: has(CDE_DIGITAL_LITERACY), detail: CDE_DIGITAL_LITERACY },
            { key: "data-literacy", label: "University Pillar · Data Literacy", satisfied: hasPrefix("GEA"), detail: pillarPicks.data || "GEA course" },
            { key: "cultures", label: "University Pillar · Cultures & Connections", satisfied: hasPrefix("GEC"), detail: pillarPicks.cultures || "GEC course" },
            { key: "critique", label: "University Pillar · Critique & Expression", satisfied: hasPrefix("GEX"), detail: pillarPicks.critique || "GEX course" },
            { key: "singapore", label: "University Pillar · Singapore Studies", satisfied: hasPrefix("GES"), detail: pillarPicks.singapore || "GES course" },
            { key: "community", label: "University Pillar · Communities & Engagement", satisfied: ceSatisfied, detail: servicePair ? `${servicePair[0]} + ${servicePair[1]}` : "Service Learning" },
            { key: "design-thinking", label: "CDE Common · Design Thinking", satisfied: has(CDE_COMMON.designThinking), detail: CDE_COMMON.designThinking },
            { key: "maker-space", label: "CDE Common · Maker Space", satisfied: has(CDE_COMMON.makerSpace), detail: CDE_COMMON.makerSpace },
            { key: "ai", label: "CDE Common · Artificial Intelligence", satisfied: has(CDE_COMMON.ai), detail: CDE_COMMON.ai },
            { key: "project-management", label: "CDE Common · Project Management", satisfied: has(CDE_COMMON.projectManagement), detail: CDE_COMMON.projectManagement },
        ];
        if (isEngineering) {
            checks.push({ key: "engineering-core", label: "Engineering Core (Maths, Professionalism, Industrial Attachment)", satisfied: CDE_ENGINEERING_CORE.every((code) => has(code)), detail: CDE_ENGINEERING_CORE.join(", ") });
        }
        return checks;
    };

    return { required, servicePins, servicePair, serviceSlots, computeChecks };
}

// Returns the graduation-requirement builder for the major's faculty, or null.
function buildFacultyRequirements(major, modules, moduleByCode, totalCredits, blockedSemIndices) {
    if (SOC_MAJOR_IDS.has(major.id)) return buildComputingRequirements(major, modules, moduleByCode, totalCredits, blockedSemIndices);
    if (major.faculty === BUSINESS_FACULTY) return buildBusinessRequirements(major, modules, moduleByCode, totalCredits, blockedSemIndices);
    if (major.faculty === CHS_FACULTY && !CHS_EXCLUDED_MAJORS.has(major.id)) return buildChsRequirements(major, modules, moduleByCode, totalCredits, blockedSemIndices);
    if (major.faculty === CDE_FACULTY) return buildCdeRequirements(major, modules, moduleByCode, totalCredits, blockedSemIndices);
    return null;
}

function buildRoadmap(major, modules, prerequisiteRows, options) {
    const moduleByCode = new Map(modules.map((module) => [module.moduleCode, module]));
    const prereqTreeByCode = new Map(modules.map((module) => [module.moduleCode, module.prereqTree || null]));
    const prereqEdges = new Map();
    for (const row of prerequisiteRows) {
        if (!prereqEdges.has(row.moduleCode)) prereqEdges.set(row.moduleCode, new Set());
        prereqEdges.get(row.moduleCode).add(row.prerequisiteModuleCode);
    }

    const errors = [];
    const warnings = [];

    const totalCredits = Number(options.totalCredits) === 140 ? 140 : 160;
    const exchangeSemester = Number(options.exchangeSemester || 0);
    const exchangeCredits = exchangeSemester ? 20 : 0;
    const exchangeSlotId = exchangeSemester ? SEM_LABELS[exchangeSemester - 1] : null;
    const interestArea = INTEREST_AREAS[options.interestArea] ? options.interestArea : "broad";
    const minor = buildAddOnSelection(options.minor, "minor", major, modules, moduleByCode);
    const secondMajor = buildAddOnSelection(options.secondMajor, "secondMajor", major, modules, moduleByCode);
    const addOns = [minor, secondMajor].filter(Boolean);
    const addOnCodes = new Set(addOns.flatMap((item) => item.required));
    const addOnCategoryByCode = new Map();
    if (minor && minor.required.length === 0) warnings.push(`No catalogue-backed modules were found for the ${minor.name} minor.`);
    if (secondMajor && secondMajor.required.length === 0) warnings.push(`No catalogue-backed modules were found for the ${secondMajor.name} second major.`);
    if (minor && secondMajor && minor.id === secondMajor.id) {
        warnings.push(`${minor.name} was selected as both a minor and second major. Shared modules are planned once.`);
    }
    if ((options.minor && options.minor === major.id) || (options.secondMajor && options.secondMajor === major.id)) {
        warnings.push("Selections matching your primary major were ignored.");
    }
    for (const code of secondMajor?.required || []) addOnCategoryByCode.set(code, "specialisation");
    for (const code of minor?.required || []) {
        if (!addOnCategoryByCode.has(code)) addOnCategoryByCode.set(code, "minor");
    }

    const slots = buildTimelineSlots();
    const slotById = new Map(slots.map((slot) => [slot.id, slot]));
    const slotOrder = new Map(slots.map((slot, index) => [slot.id, index]));

    // --- Internship configuration ---
    const internship = options.internship && options.internship.slot ? options.internship : null;
    let internshipSlotId = null;
    let internshipUnits = 0;
    if (internship) {
        internshipSlotId = String(internship.slot);
        internshipUnits = Number(internship.units) || 0;
        if (!slotById.has(internshipSlotId) || !ELIGIBLE_INTERNSHIP_SLOTS.has(internshipSlotId)) {
            errors.push("Internships are only allowed from Year 2 Semester 2 to Year 4 Semester 1, or in the Year 2 / Year 3 summer Special Term.");
        }
        if (!VALID_INTERNSHIP_UNITS.has(internshipUnits)) {
            errors.push("Internship workload must be 4, 8, 10 or 12 Units.");
        } else if (internshipUnits > MAX_INTERNSHIP_UNITS) {
            errors.push(`An internship can contribute at most ${MAX_INTERNSHIP_UNITS} Units.`);
        }
        if (exchangeSlotId && internshipSlotId === exchangeSlotId) {
            errors.push("Your internship can't be placed in the same semester as your exchange.");
        }
    }

    const localModuleCredits = totalCredits - exchangeCredits - internshipUnits;
    if (localModuleCredits < 0) {
        errors.push("Your exchange and internship credits exceed the graduation target. Lower the internship units or remove the exchange.");
    }

    if (errors.length) return { ok: false, errors };

    const internshipSlot = internshipSlotId ? slotById.get(internshipSlotId) : null;
    const blockedSemIndices = new Set();
    if (exchangeSemester) blockedSemIndices.add(exchangeSemester);
    if (internshipSlot && internshipSlot.kind === "sem") blockedSemIndices.add(internshipSlot.semIndex);

    // --- Faculty graduation requirements (School of Computing / NUS Business School) ---
    const facultyReq = buildFacultyRequirements(major, modules, moduleByCode, totalCredits, blockedSemIndices);
    const facultyRequiredCodes = new Set((facultyReq?.required || []).filter((code) => moduleByCode.has(code)));
    const serviceCodes = new Set(facultyReq ? [...facultyReq.servicePins.keys()] : []);

    // --- Student add / remove edits ---
    const removeSet = new Set((options.removeModules || []).filter((code) => moduleByCode.has(code)));
    const pinSlot = new Map();
    for (const add of options.addModules || []) {
        const code = add && add.code;
        if (!code || !moduleByCode.has(code)) {
            if (code) warnings.push(`"${code}" is not in the catalogue and was skipped.`);
            continue;
        }
        if (removeSet.has(code)) continue;
        const targetSlot = String(add.slot || "");
        if (!slotById.has(targetSlot)) {
            errors.push(`Choose a valid slot to add ${code}.`);
            continue;
        }
        if (targetSlot === exchangeSlotId) errors.push(`You can't add ${code} to your exchange semester.`);
        if (internshipSlotId && targetSlot === internshipSlotId) errors.push(`You can't add ${code} to your internship period.`);
        pinSlot.set(code, targetSlot);
    }

    // Default-place the year-long Service Learning pair unless the student has moved it.
    if (facultyReq) {
        for (const [code, slotId] of facultyReq.servicePins) {
            if (!pinSlot.has(code) && !removeSet.has(code) && moduleByCode.has(code)) pinSlot.set(code, slotId);
        }
    }

    if (errors.length) return { ok: false, errors };

    // Manually added modules consume the module budget so the graduation total stays
    // fixed; the auto-generated base shrinks to make room. Modules added to a Special
    // Term (winter/summer break) sit outside the regular semesters.
    let pinnedCredits = 0;
    let breakPinnedCredits = 0;
    for (const [code, slotId] of pinSlot) {
        const credits = moduleCredits(moduleByCode.get(code));
        pinnedCredits += credits;
        if (slotById.get(slotId).kind !== "sem") breakPinnedCredits += credits;
    }
    const pinnedCodes = new Set(pinSlot.keys());
    const primaryRequirementCodes = new Set([...major.core, ...COMMON_MODULES].filter((code) => moduleByCode.has(code)));
    // Add-on and faculty-required modules that are not already core/common and not pinned
    // consume the module budget.
    const mandatoryAutoCodes = new Set([...addOnCodes, ...facultyRequiredCodes].filter((code) => !primaryRequirementCodes.has(code) && !pinnedCodes.has(code)));
    const mandatoryCredits = [...mandatoryAutoCodes].reduce((sum, code) => sum + moduleCredits(moduleByCode.get(code)), 0);
    const autoBudget = Math.max(localModuleCredits - pinnedCredits - mandatoryCredits, 0);

    // For School of Computing, Communities & Engagement is met by the year-long Service
    // Learning pair, so keep the semester-long GEN alternatives out of the auto base.
    const baseExclude = new Set([...pinnedCodes, ...mandatoryAutoCodes]);
    if (facultyReq) for (const code of SEMESTER_LONG_CE) baseExclude.add(code);

    // --- Module set: deterministic base (excluding pinned), then apply removals ---
    const baseSelected = selectBaseModules(major, modules, moduleByCode, autoBudget, baseExclude, interestArea);
    const planned = new Set([...baseSelected].filter((code) => !removeSet.has(code)));

    // Force-include add-on and faculty-required modules; these are protected from removal
    // (but can be moved to another semester).
    const protectedRequired = new Map();
    for (const code of addOnCodes) {
        const source = secondMajor?.required.includes(code) ? `the ${secondMajor.name} second major` : `the ${minor?.name} minor`;
        protectedRequired.set(code, source);
    }
    for (const code of facultyRequiredCodes) protectedRequired.set(code, `${major.faculty} graduation requirements`);
    for (const code of serviceCodes) protectedRequired.set(code, `${major.faculty} graduation requirements`);
    for (const [code, source] of protectedRequired) {
        if (removeSet.has(code)) {
            errors.push(`${code} is required for ${source}, so it can't be removed. You can move it to another semester instead.`);
        } else if (moduleByCode.has(code)) {
            planned.add(code);
        }
    }
    for (const code of pinSlot.keys()) planned.add(code);

    if (errors.length) return { ok: false, errors };

    // --- Per-semester credit targets for the active (non-blocked) regular semesters ---
    // Their total is the module credits that fall inside regular semesters (everything
    // except Special Term additions, exchange and internship units).
    const activeRegular = slots.filter((slot) => slot.kind === "sem" && !blockedSemIndices.has(slot.semIndex));
    const regularTargetTotal = Math.max(localModuleCredits - breakPinnedCredits, 0);
    const providedTargets = options.semesterTargets && typeof options.semesterTargets === "object" ? options.semesterTargets : null;
    const evenTarget = activeRegular.length ? regularTargetTotal / activeRegular.length : 0;
    const targets = new Map();
    for (const slot of activeRegular) {
        const provided = providedTargets ? Number(providedTargets[slot.id]) : NaN;
        targets.set(slot.id, Number.isFinite(provided) && provided >= 0 ? provided : evenTarget);
    }

    // --- Scheduling ---
    const slotModules = new Map(slots.map((slot) => [slot.id, []]));
    const slotCredits = new Map(slots.map((slot) => [slot.id, 0]));
    const placed = new Set();

    for (const [code, slotId] of pinSlot) {
        slotModules.get(slotId).push(code);
        slotCredits.set(slotId, slotCredits.get(slotId) + moduleCredits(moduleByCode.get(code)));
        placed.add(code);
    }

    const corePriority = new Map(major.core.map((code, index) => [code, index]));
    const addOnPriority = new Map([...addOnCodes].map((code, index) => [code, index]));
    const facultyPriority = new Map((facultyReq?.required || []).map((code, index) => [code, index]));
    const priorityOf = (code) => {
        if (corePriority.has(code)) return corePriority.get(code);
        if (addOnPriority.has(code)) return 200 + addOnPriority.get(code);
        if (facultyPriority.has(code)) return 400 + facultyPriority.get(code);
        return 1000 + moduleLevel(code);
    };
    const remainingAuto = new Set([...planned].filter((code) => !placed.has(code)));
    const autoOrder = [...remainingAuto].sort((a, b) => priorityOf(a) - priorityOf(b) || a.localeCompare(b));
    const completed = new Set();

    for (const slot of slots) {
        if (slot.kind === "sem" && !blockedSemIndices.has(slot.semIndex)) {
            const target = Math.max(targets.get(slot.id) || 0, 0);
            const maxLevel = slot.semIndex <= 2 ? 2 : slot.semIndex <= 4 ? 3 : 4;

            const fill = (enforceLevelAndOffer) => {
                for (const code of autoOrder) {
                    if (!remainingAuto.has(code)) continue;
                    if (slotCredits.get(slot.id) >= target) break;
                    const module = moduleByCode.get(code);
                    const credits = moduleCredits(module);
                    if (slotCredits.get(slot.id) + credits > target) continue;
                    if (enforceLevelAndOffer) {
                        if (moduleLevel(code) > maxLevel) continue;
                        const offered = !module.semesters?.length || module.semesters.includes(slot.offeredIn);
                        if (!offered) continue;
                    }
                    const edges = prereqEdges.get(code);
                    const inPlanPrereqs = edges ? [...edges].filter((item) => planned.has(item)) : [];
                    if (!inPlanPrereqs.every((item) => completed.has(item))) continue;
                    slotModules.get(slot.id).push(code);
                    slotCredits.set(slot.id, slotCredits.get(slot.id) + credits);
                    remainingAuto.delete(code);
                }
            };

            fill(true);
            fill(false);
        }
        for (const code of slotModules.get(slot.id)) completed.add(code);
    }

    // Residual placement for modules that did not fit a target slot, latest-first.
    for (const code of [...remainingAuto]) {
        const credits = moduleCredits(moduleByCode.get(code));
        const destination = activeRegular
            .slice()
            .reverse()
            .find((slot) => slotCredits.get(slot.id) + credits <= SEMESTER_CAP);
        if (destination) {
            slotModules.get(destination.id).push(code);
            slotCredits.set(destination.id, slotCredits.get(destination.id) + credits);
            remainingAuto.delete(code);
        }
    }
    if (remainingAuto.size) {
        warnings.push(`${remainingAuto.size} module(s) could not be placed within the 4-year plan.`);
    }

    let scheduledModuleCredits = 0;
    for (const slot of slots) scheduledModuleCredits += slotCredits.get(slot.id);
    const graduationCredits = scheduledModuleCredits + exchangeCredits + internshipUnits;

    // --- Validation: internship 70-MC eligibility ---
    if (internshipSlotId) {
        const internshipIndex = slotOrder.get(internshipSlotId);
        let creditsBefore = 0;
        for (const slot of slots) {
            if (slotOrder.get(slot.id) >= internshipIndex) break;
            creditsBefore += slotCredits.get(slot.id);
            if (slot.id === exchangeSlotId) creditsBefore += 20;
        }
        if (creditsBefore < MIN_MC_BEFORE_INTERNSHIP) {
            errors.push(`You need at least ${MIN_MC_BEFORE_INTERNSHIP} MCs before an internship, but only ${creditsBefore} are planned before ${internshipSlot.label}. Move the internship later or schedule more modules earlier.`);
        }
    }

    // --- Validation: manually added modules must have prerequisites met earlier ---
    for (const [code, slotId] of pinSlot) {
        const slotIndex = slotOrder.get(slotId);
        const completedBefore = new Set();
        for (const slot of slots) {
            if (slotOrder.get(slot.id) >= slotIndex) break;
            for (const earlier of slotModules.get(slot.id)) completedBefore.add(earlier);
        }
        // Only enforce ordering for prerequisites that are actually in the student's
        // plan. Prerequisites absent from the plan are assumed to be satisfied outside
        // it (e.g. A-level subjects or bridging modules the student isn't taking), which
        // NUSMods encodes only as module alternatives.
        const tree = prereqTreeByCode.get(code);
        let satisfied;
        if (tree) {
            satisfied = prereqAddStatus(tree, completedBefore, planned) !== "unsat";
        } else {
            const edges = prereqEdges.get(code);
            satisfied = !edges || ![...edges].some((item) => planned.has(item) && !completedBefore.has(item));
        }
        if (!satisfied) {
            const module = moduleByCode.get(code);
            const detail = module.prerequisiteText ? ` Requires: ${module.prerequisiteText}.` : "";
            errors.push(`${code} can't be placed in ${slotById.get(slotId).label} because its prerequisites are not completed earlier in the plan.${detail}`);
        }
    }

    // --- Validation: removals must not break the plan or graduation ---
    for (const code of removeSet) {
        if (corePriority.has(code)) {
            errors.push(`${code} is a core module for ${major.name} and is required to graduate, so it can't be removed.`);
        }
        const blockedDependents = [];
        for (const dependent of planned) {
            const edges = prereqEdges.get(dependent);
            if (!edges || !edges.has(code)) continue;
            const tree = prereqTreeByCode.get(dependent);
            // Block the removal only if it actually flips the dependent from "prerequisite
            // satisfied by the plan" to "no longer satisfied" — i.e. no other module still
            // in the plan covers the dependent's prerequisite.
            let breaksDependent = true;
            if (tree) {
                const satisfiedBefore = prereqSatisfiedByPlan(tree, new Set([...planned, code]));
                const satisfiedAfter = prereqSatisfiedByPlan(tree, planned);
                breaksDependent = satisfiedBefore && !satisfiedAfter;
            }
            if (breaksDependent) blockedDependents.push(dependent);
        }
        if (blockedDependents.length) {
            const list = blockedDependents.sort().join(", ");
            errors.push(`${code} is a prerequisite for ${list} in your plan. Remove ${blockedDependents.length > 1 ? "those modules" : list} first, or keep ${code}.`);
        }
    }

    if (errors.length) return { ok: false, errors };

    // --- Graduation status (non-blocking) ---
    const missingCore = major.core.filter((code) => moduleByCode.has(code) && !planned.has(code));
    const meetsTarget = graduationCredits >= totalCredits;
    if (!meetsTarget) {
        warnings.push(`Your plan totals ${graduationCredits} of ${totalCredits} MCs. Add ${totalCredits - graduationCredits} more MC to meet the graduation requirement.`);
    }
    if (missingCore.length) {
        warnings.push(`Missing core module(s) for ${major.name}: ${missingCore.join(", ")}.`);
    }
    for (const slot of slots) {
        const credits = slotCredits.get(slot.id) + (slot.id === exchangeSlotId ? 20 : 0) + (slot.id === internshipSlotId ? internshipUnits : 0);
        if (slot.kind === "sem" && credits > 24) {
            warnings.push(`${slot.label} is heavy at ${credits} MCs. Consider moving an elective, minor, or second-major module.`);
        }
        if (slot.kind === "sem" && credits > SEMESTER_CAP) {
            warnings.push(`${slot.label} is likely impossible at ${credits} MCs.`);
        }
    }

    // --- Faculty common-curriculum requirement checks ---
    let requirementSummary = null;
    if (facultyReq) {
        const checks = facultyReq.computeChecks(planned, {
            hasExchange: Boolean(exchangeSemester),
            hasInternship: Boolean(internshipSlotId),
        });
        for (const check of checks) {
            if (!check.satisfied) warnings.push(`Graduation requirement not yet met — ${check.label}.`);
        }
        requirementSummary = { faculty: major.faculty, checks };
    }

    // --- Output timeline (break slots only when populated or holding the internship) ---
    const timeline = slots
        .filter((slot) => slot.kind === "sem" || slotModules.get(slot.id).length > 0 || slot.id === internshipSlotId)
        .map((slot) => {
            const isExchange = slot.id === exchangeSlotId;
            const isInternship = slot.id === internshipSlotId;
            const isActiveRegular = slot.kind === "sem" && !blockedSemIndices.has(slot.semIndex);
            return {
                id: slot.id,
                label: slot.label,
                sublabel: slot.sublabel,
                kind: slot.kind,
                isExchange,
                isInternship,
                internshipUnits: isInternship ? internshipUnits : 0,
                target: isActiveRegular ? Math.round(targets.get(slot.id) || 0) : null,
                credits: slotCredits.get(slot.id) + (isExchange ? 20 : 0) + (isInternship ? internshipUnits : 0),
                modules: slotModules.get(slot.id),
            };
        });

    const allModules = [];
    for (const slot of slots) {
        for (const code of slotModules.get(slot.id)) {
            allModules.push({
                ...moduleByCode.get(code),
                category: moduleCategory(code, major, addOnCategoryByCode),
            });
        }
    }
    const recommendations = recommendElectives(modules, major, planned, slotCredits, slots, activeRegular, slotModules, prereqEdges, prereqTreeByCode, interestArea);

    return {
        ok: true,
        major: { id: major.id, name: major.name, faculty: major.faculty },
        addOn: {
            id: addOns.map((item) => item.id).join("+") || "none",
            name: addOns.map((item) => `${item.type === "minor" ? "Minor" : "Second Major"} in ${item.name}`).join(" · ") || "No minor or second major",
            type: addOns.length === 2 ? "combined" : addOns[0]?.type || "none",
            required: [...addOnCodes],
        },
        minor: minor ? { id: minor.id, name: minor.name, required: minor.required, targetUnits: minor.targetUnits } : null,
        secondMajor: secondMajor ? { id: secondMajor.id, name: secondMajor.name, required: secondMajor.required, targetUnits: secondMajor.targetUnits } : null,
        interestArea,
        totalCredits,
        scheduledCredits: graduationCredits,
        localModuleCredits,
        exchangeSemester,
        exchangeSlotId,
        exchangeCredits,
        internship: internshipSlotId ? { slot: internshipSlotId, units: internshipUnits, label: internshipSlot.label } : null,
        timeline,
        modules: allModules,
        regularSemesters: activeRegular.map((slot) => ({ id: slot.id, label: slot.label, credits: slotCredits.get(slot.id) })),
        regularTargetTotal,
        graduation: { meetsTarget, scheduledCredits: graduationCredits, targetCredits: totalCredits, missingCore },
        requirements: requirementSummary,
        recommendations,
        warnings,
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
        res.status(400).json({ ok: false, errors: ["Please select a supported major."] });
        return;
    }
    if (!Number.isInteger(exchangeSemester) || exchangeSemester < 0 || exchangeSemester > 8) {
        res.status(400).json({ ok: false, errors: ["Exchange semester must be between 1 and 8."] });
        return;
    }

    const [moduleResult, prerequisiteResult] = await Promise.all([
        pool.query(
            `SELECT module_code AS "moduleCode", module_name AS title,
                    modular_credits AS "modularCredits", description, faculty,
                    semesters, prerequisite_text AS "prerequisiteText",
                    prereq_tree AS "prereqTree", nusmods_url AS "nusmodsUrl"
             FROM modules ORDER BY module_code`
        ),
        pool.query(
            `SELECT module_code AS "moduleCode",
                    prerequisite_module_code AS "prerequisiteModuleCode"
             FROM prerequisites`
        ),
    ]);

    const result = buildRoadmap(major, moduleResult.rows, prerequisiteResult.rows, {
        exchangeSemester,
        totalCredits: Number(req.body.totalCredits || 160),
        internship: req.body.internship || null,
        minor: req.body.minor || "none",
        secondMajor: req.body.secondMajor || "none",
        interestArea: req.body.interestArea || "broad",
        semesterTargets: req.body.semesterTargets || null,
        addModules: Array.isArray(req.body.addModules) ? req.body.addModules : [],
        removeModules: Array.isArray(req.body.removeModules) ? req.body.removeModules : [],
    });

    res.json(result);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
