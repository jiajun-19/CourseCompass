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
function selectBaseModules(major, modules, moduleByCode, localModuleCredits, excludeCodes = new Set()) {
    const candidates = modules
        .filter((module) => major.prefixes.some((prefix) => module.moduleCode.startsWith(prefix)))
        .sort((a, b) => moduleLevel(a.moduleCode) - moduleLevel(b.moduleCode) || a.moduleCode.localeCompare(b.moduleCode));
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
    for (const module of candidates) {
        if (credits >= localModuleCredits) break;
        // NUS offers several mutually exclusive introductory programming variants.
        // The major's curated core already chooses the appropriate one.
        if (/^CS(?:1010[A-Z]*|1101S|1231)$/.test(module.moduleCode)) continue;
        includeModule(module.moduleCode);
    }
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
    const autoBudget = Math.max(localModuleCredits - pinnedCredits, 0);
    const pinnedCodes = new Set(pinSlot.keys());

    // --- Module set: deterministic base (excluding pinned), then apply removals ---
    const baseSelected = selectBaseModules(major, modules, moduleByCode, autoBudget, pinnedCodes);
    const planned = new Set([...baseSelected].filter((code) => !removeSet.has(code)));
    for (const code of pinSlot.keys()) planned.add(code);

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
    const remainingAuto = new Set([...planned].filter((code) => !placed.has(code)));
    const autoOrder = [...remainingAuto].sort((a, b) => {
        const aPriority = corePriority.has(a) ? corePriority.get(a) : 1000 + moduleLevel(a);
        const bPriority = corePriority.has(b) ? corePriority.get(b) : 1000 + moduleLevel(b);
        return aPriority - bPriority || a.localeCompare(b);
    });
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
        for (const code of slotModules.get(slot.id)) allModules.push(moduleByCode.get(code));
    }

    return {
        ok: true,
        major: { id: major.id, name: major.name, faculty: major.faculty },
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
