## CourseCompass Development Plan

### Overview

CourseCompass is a personalised course planning web application for NUS students. The final product will allow students to generate a study plan, add personal constraints, check prerequisites and graduation requirements, plan for minors or second majors, receive module recommendations, and visualise their academic roadmap.

---

## Milestone 1: Ideation and Technical Proof of Concept

**Deadline:** 1 June 2026, before 2pm SGT

### Goal

Build a technical proof of concept showing that the frontend and backend can work together to generate and display a basic study plan.

### Tasks

#### Project Setup

- Create GitHub repository.
- Set up React frontend.
- Set up Node/Express backend.
- Add README outline.
- Add project log.
- Add GitHub issues for all major features.
- Confirm tech stack:
  - React
  - Node.js / Express
  - PostgreSQL or seed JSON data
  - GitHub
  - Deployment platform

#### System Design

- Design frontend page for programme input.
- Design backend endpoint for generating a study plan.
- Create simple data model for modules and semesters.
- Create architecture diagram.

#### Technical Proof of Concept

- Allow user to select one supported programme, such as Business Analytics.
- Send selected programme from frontend to backend.
- Return a hardcoded or rule-based semester plan from backend.
- Display generated plan in a semester grid or roadmap.
- Add basic error handling.

### Submission Deliverables

- README with:
  - motivation
  - user stories
  - features
  - system design
  - development plan
  - tech stack
  - proof of concept explanation
- Project log showing:
  - who did what
  - hours spent
- Updated poster with proof-of-concept screenshot.
- Video showing:
  - project idea
  - frontend/backend proof-of-concept demo

### Success Condition

A user can select a programme and see a generated study plan returned from the backend.

---

## Milestone 2: Core Prototype

**Deadline:** 29 June 2026, before 2pm SGT

### Goal

Build a usable prototype containing the three core features:

1. Personalised study plan generator
2. Custom constraints input
3. Prerequisite and requirement checking

---

### Week 1: Data Foundations

**Dates:** 2 June to 8 June 2026

#### Tasks

- Create module schema.
- Create programme requirement schema.
- Seed data for at least one full degree path.
- Add module fields:
  - module code
  - title
  - units
  - semester availability
  - prerequisites
  - requirement category
- Add backend tests for data loading.

#### Goal by 8 June

Backend can retrieve modules and programme requirements reliably.

---

### Week 2: Study Plan Generator

**Dates:** 9 June to 15 June 2026

#### Tasks

- Generate a 3-4 year study plan.
- Respect normal workload per semester.
- Separate:
  - core modules
  - electives
  - unrestricted electives
- Avoid obvious invalid module sequencing.
- Display plan clearly in frontend.

#### Goal by 15 June

Feature 1 is meaningfully working and is no longer just hardcoded.

---

### Week 3: Custom Constraints

**Dates:** 16 June to 22 June 2026

#### Tasks

- Add support for exchange semester.
- Add support for internship or lighter workload semester.
- Add support for preferred workload range.
- Add blocked semester if useful.
- Allow users to select constraints from the frontend.

#### Goal by 22 June

Feature 2 works at prototype level.

---

### Week 4: Prerequisite and Requirement Checking

**Dates:** 23 June to 28 June 2026

#### Tasks

- Check that prerequisites appear before dependent modules.
- Warn if a plan violates requirements.
- Show missing requirement categories.
- Add basic system tests.

#### Goal by 28 June

Feature 3 works at prototype level.

---

### Milestone 2 Submission Deliverables

- README updated with:
  - core features developed
  - problems encountered
  - system testing evidence
  - screenshots
- Poster and video showing prototype.
- Updated project log.

### Success Condition

CourseCompass can generate a basic valid study plan while considering user constraints and prerequisite/requirement checks.

---

## Milestone 3: Extension Features

**Deadline:** 27 July 2026, before 2pm SGT

### Goal

Complete all extension features.

Extension features:

1. Minor / second major planner
2. Module recommendation system
3. Visual study roadmap

---

### Week 1: Minor / Second Major Planner

**Dates:** 30 June to 6 July 2026

#### Tasks

- Allow user to select a minor or second major.
- Add required modules to the generated plan.
- Detect overloaded or impossible semesters.
- Show warnings when the plan becomes too heavy.

#### Goal by 6 July

Feature 4 works for at least one minor or second major.

---

### Week 2: Module Recommendations

**Dates:** 7 July to 13 July 2026

#### Tasks

- Recommend electives based on interest areas.
- Recommend modules that fit available semesters.
- Avoid recommending modules with unmet prerequisites.
- Label recommendations clearly.

#### Goal by 13 July

Feature 5 works at a useful prototype level.

---

### Week 3: Visual Roadmap

**Dates:** 14 July to 20 July 2026

#### Tasks

- Build timeline or semester grid.
- Colour-code module categories:
  - core
  - elective
  - minor
  - specialisation
  - exchange
  - internship
- Allow users to inspect module details.
- Make UI presentable and readable.

#### Goal by 20 July

Feature 6 works and visually matches the intended CourseCompass experience.

---

### Week 4: Testing and Cleanup

**Dates:** 21 July to 26 July 2026

#### Tasks

- Perform system testing.
- Conduct user testing with classmates.
- Fix confusing user flows.
- Improve README.
- Update poster and video.
- Document known limitations.

#### Suggested User Testing Tasks

- Generate a plan.
- Add exchange semester.
- Add a minor.
- Inspect prerequisite warning.
- Find recommended elective.
- Understand roadmap without explanation.

---

### Milestone 3 Submission Deliverables

- README updated with:
  - bugs fixed
  - extension features developed
  - user testing
  - problems encountered
- Updated project log.
- Poster and video showing complete system.
- User testing results.

### Success Condition

All six features exist in the app, and users can complete the main CourseCompass planning flow end to end.

---

## Splashdown: Refinement and Final Presentation

**Date:** 26 August 2026

### Goal

Polish, stabilise, and present the final CourseCompass product.

---

### Phase 1: Fix High-Priority Issues

**Dates:** 28 July to 4 August 2026

#### Tasks

- Fix broken study plans.
- Fix prerequisite bugs.
- Improve unclear warnings.
- Resolve overloaded semester issues.
- Fix UI layout problems.
- Handle missing data cases.

---

### Phase 2: Improve Product Quality

**Dates:** 5 August to 11 August 2026

#### Tasks

- Improve loading states.
- Add clearer empty states.
- Improve mobile and responsive layout.
- Add export/share plan feature if feasible.
- Improve roadmap visuals.
- Improve module detail display.

---

### Phase 3: Final Testing

**Dates:** 12 August to 18 August 2026

#### Tasks

- Perform regression testing.
- Conduct second round of user testing.
- Test deployment.
- Clean up README.
- Complete project log.
- Check that both team members have balanced contributions.

---

### Phase 4: Final Presentation Preparation

**Dates:** 19 August to 25 August 2026

#### Tasks

- Prepare final poster.
- Prepare final video.
- Write demo script.
- Prepare backup screenshots.
- Prepare backup local demo.
- Prepare answers for likely questions.

---

### Splashdown Day

**Date:** 26 August 2026

#### Tasks

- Present final CourseCompass.
- Demo full user journey.
- Explain system design and engineering practices.
- Show testing and user feedback.
- Highlight future improvements.

---
