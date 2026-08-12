import { describe, it, expect } from "vitest";
import server from "../src/server.js";
import catalogue from "./fixtures/catalogue.json";

// The planner is a pure function: (major, catalogue, prerequisites, constraints) -> plan.
// These regression tests run it against a snapshot of the real NUSMods catalogue so the
// classes of bugs listed in the README can never silently reappear.
const { buildRoadmap, MAJORS } = server;
const { modules, prerequisites } = catalogue;

const majorById = (id) => {
    const major = MAJORS.find((item) => item.id === id);
    if (!major) throw new Error(`Unknown major in test: ${id}`);
    return major;
};

const generate = (id, options = {}) =>
    buildRoadmap(majorById(id), modules, prerequisites, { totalCredits: 160, ...options });

const prereqEdges = new Map();
for (const { moduleCode, prerequisiteModuleCode } of prerequisites) {
    if (!prereqEdges.has(moduleCode)) prereqEdges.set(moduleCode, new Set());
    prereqEdges.get(moduleCode).add(prerequisiteModuleCode);
}

// Every module in a plan appears exactly once across the whole timeline.
function expectNoDuplicateModules(plan) {
    const seen = new Set();
    for (const slot of plan.timeline) {
        for (const code of slot.modules) {
            expect(seen.has(code), `${code} appears more than once in the plan`).toBe(false);
            seen.add(code);
        }
    }
}

// Any prerequisite that is itself in the plan must be scheduled in an earlier slot.
function expectPrerequisiteOrder(plan) {
    const planned = new Set();
    const slotIndex = new Map();
    plan.timeline.forEach((slot, index) => {
        for (const code of slot.modules) {
            planned.add(code);
            slotIndex.set(code, index);
        }
    });
    for (const code of planned) {
        for (const prereq of prereqEdges.get(code) || []) {
            if (!planned.has(prereq)) continue;
            expect(
                slotIndex.get(prereq),
                `${prereq} (a prerequisite of ${code}) is not scheduled before ${code}`,
            ).toBeLessThan(slotIndex.get(code));
        }
    }
}

describe("roadmap invariants", () => {
    it("generates a valid 160-unit Computer Science plan", () => {
        const plan = generate("computer-science");
        expect(plan.ok).toBe(true);
        expect(plan.scheduledCredits).toBe(160);
        expectNoDuplicateModules(plan);
        expectPrerequisiteOrder(plan);
    });

    it("never schedules a module before its in-plan prerequisite (all faculties)", () => {
        for (const id of ["computer-science", "finance", "psychology", "mechanical-engineering", "economics"]) {
            const plan = generate(id);
            expect(plan.ok, `${id} failed to generate`).toBe(true);
            expectPrerequisiteOrder(plan);
        }
    });

    it("never lets the planned total exceed the graduation target", () => {
        for (const totalCredits of [160, 140]) {
            for (const id of ["computer-science", "business-analytics", "psychology"]) {
                const plan = generate(id, { totalCredits });
                expect(plan.ok).toBe(true);
                expect(plan.scheduledCredits).toBeLessThanOrEqual(totalCredits);
            }
        }
    });

    it("packs exactly to the poly (140) and standard (160) targets for CS", () => {
        expect(generate("computer-science", { totalCredits: 140 }).scheduledCredits).toBe(140);
        expect(generate("computer-science", { totalCredits: 160 }).scheduledCredits).toBe(160);
    });
});

describe("bug regression: shared add-on modules are not duplicated", () => {
    it("does not duplicate modules shared by the degree, minor and second major", () => {
        const plan = generate("computer-science", { minor: "statistics", secondMajor: "marketing" });
        expect(plan.ok).toBe(true);
        expectNoDuplicateModules(plan);
        expectPrerequisiteOrder(plan);
    });
});

describe("bug regression: adding a module must not inflate the total past the target", () => {
    it("does not push the total past 160 when a Special-Term module is added", () => {
        const base = generate("computer-science");
        expect(base.scheduledCredits).toBe(160);
        const withAdd = generate("computer-science", { addModules: [{ code: "MA1521", slot: "WIN1" }] });
        expect(withAdd.ok).toBe(true);
        // The added module consumes the budget instead of inflating the total (the old bug
        // produced 164). It is never above the graduation target.
        expect(withAdd.scheduledCredits).toBeLessThanOrEqual(160);
        const win1 = withAdd.timeline.find((slot) => slot.id === "WIN1");
        expect(win1.modules).toContain("MA1521");
    });
});

describe("bug regression: prerequisite-aware placement and removal", () => {
    it("blocks adding a module before its in-plan prerequisite", () => {
        // CS3230 needs CS2040S, which is scheduled much later than a Year-1 winter break.
        const plan = generate("computer-science", { addModules: [{ code: "CS3230", slot: "WIN1" }] });
        expect(plan.ok).toBe(false);
        expect(plan.errors.join(" ")).toMatch(/CS3230/);
    });

    it("blocks removing a core module that is required to graduate", () => {
        const plan = generate("computer-science", { removeModules: ["CS2103T"] });
        expect(plan.ok).toBe(false);
        expect(plan.errors.join(" ")).toMatch(/core module/i);
    });

    it("blocks removing an OR-prerequisite that a dependant still relies on", () => {
        // EC1101E is the only in-plan option satisfying EC2102's OR prerequisite.
        const plan = generate("economics", { removeModules: ["EC1101E"] });
        expect(plan.ok).toBe(false);
        expect(plan.errors.join(" ")).toMatch(/EC1101E/);
    });
});

describe("constraints", () => {
    it("leaves the exchange semester free of local modules", () => {
        const plan = generate("computer-science", { exchangeSemester: 6 }); // Y3S2
        expect(plan.ok).toBe(true);
        const exchangeSlot = plan.timeline.find((slot) => slot.id === "Y3S2");
        expect(exchangeSlot.isExchange).toBe(true);
        expect(exchangeSlot.modules.length).toBe(0);
    });

    it("blocks an internship placed before the 70-unit eligibility threshold", () => {
        const plan = generate("computer-science", { internship: { slot: "Y2S2", units: 8 } });
        expect(plan.ok).toBe(false);
        expect(plan.errors.join(" ")).toMatch(/70 MCs/);
    });
});

describe("faculty graduation requirements", () => {
    it("marks every requirement satisfied for a freshly generated School of Computing plan", () => {
        for (const id of ["computer-science", "business-analytics", "information-systems"]) {
            const plan = generate(id);
            expect(plan.requirements).toBeTruthy();
            const unmet = plan.requirements.checks.filter((check) => !check.satisfied);
            expect(unmet, `${id} has unmet requirements: ${unmet.map((c) => c.label).join(", ")}`).toHaveLength(0);
        }
    });

    it("ties the BBA Work/Global Experience milestones to internship and exchange", () => {
        const withMilestones = generate("finance", {
            internship: { slot: "Y3S1", units: 10 },
            exchangeSemester: 4,
        });
        const checks = Object.fromEntries(withMilestones.requirements.checks.map((c) => [c.key, c.satisfied]));
        expect(checks.wem).toBe(true);
        expect(checks.gem).toBe(true);
    });

    it("exposes no faculty requirements for excluded programmes (Pharmacy)", () => {
        expect(generate("pharmaceutical-science").requirements).toBeNull();
    });
});
