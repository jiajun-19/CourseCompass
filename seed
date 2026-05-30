TRUNCATE semester_plan_modules, semester_plans, study_plans, constraints, prerequisites, modules, student_profiles
RESTART IDENTITY CASCADE;

INSERT INTO student_profiles (major, year_of_study, target_graduation_year)
VALUES
  ('Computer Science', 1, 2029),
  ('Computer Science', 2, 2028);

INSERT INTO modules (module_code, module_name, modular_credits, faculty, semester_available)
VALUES
  ('CS1010S', 'Programming Methodology', 4, 'School of Computing', 'Semester 1, Semester 2'),
  ('CS1231S', 'Discrete Structures', 4, 'School of Computing', 'Semester 1, Semester 2'),
  ('CS2030S', 'Programming Methodology II', 4, 'School of Computing', 'Semester 1, Semester 2'),
  ('CS2040S', 'Data Structures and Algorithms', 4, 'School of Computing', 'Semester 1, Semester 2'),
  ('CS2100', 'Computer Organisation', 4, 'School of Computing', 'Semester 1, Semester 2'),
  ('CS2101', 'Effective Communication for Computing Professionals', 4, 'School of Computing', 'Semester 1, Semester 2'),
  ('CS2102', 'Database Systems', 4, 'School of Computing', 'Semester 1, Semester 2'),
  ('CS2103T', 'Software Engineering', 4, 'School of Computing', 'Semester 1, Semester 2'),
  ('CS2105', 'Computer Networks', 4, 'School of Computing', 'Semester 1, Semester 2'),
  ('CS2106', 'Introduction to Operating Systems', 4, 'School of Computing', 'Semester 1, Semester 2'),
  ('CS2107', 'Introduction to Information Security', 4, 'School of Computing', 'Semester 1, Semester 2'),
  ('CS2109S', 'Introduction to AI and Machine Learning', 4, 'School of Computing', 'Semester 1, Semester 2'),
  ('CS2113', 'Software Engineering and Object-Oriented Programming', 4, 'School of Computing', 'Semester 1, Semester 2'),
  ('CS3210', 'Parallel Computing', 4, 'School of Computing', 'Semester 1'),
  ('CS3211', 'Parallel and Concurrent Programming', 4, 'School of Computing', 'Semester 2'),
  ('CS3213', 'Foundations of Software Engineering', 4, 'School of Computing', 'Semester 1'),
  ('CS3216', 'Software Product Engineering for Digital Markets', 4, 'School of Computing', 'Semester 1'),
  ('CS3217', 'Software Engineering on Modern Application Platforms', 4, 'School of Computing', 'Semester 2'),
  ('CS3219', 'Software Engineering Principles and Patterns', 4, 'School of Computing', 'Semester 1, Semester 2'),
  ('CS3223', 'Database Systems Implementation', 4, 'School of Computing', 'Semester 1'),
  ('CS3230', 'Design and Analysis of Algorithms', 4, 'School of Computing', 'Semester 1, Semester 2'),
  ('CS3235', 'Computer Security', 4, 'School of Computing', 'Semester 2'),
  ('CS3236', 'Introduction to Information Theory', 4, 'School of Computing', 'Semester 1'),
  ('CS3240', 'Interaction Design', 4, 'School of Computing', 'Semester 2'),
  ('CS3241', 'Computer Graphics', 4, 'School of Computing', 'Semester 1'),
  ('CS3242', '3D Modeling and Animation', 4, 'School of Computing', 'Semester 2'),
  ('CS3243', 'Introduction to Artificial Intelligence', 4, 'School of Computing', 'Semester 1, Semester 2'),
  ('CS3244', 'Machine Learning', 4, 'School of Computing', 'Semester 1, Semester 2'),
  ('CS3245', 'Information Retrieval', 4, 'School of Computing', 'Semester 2'),
  ('CS3247', 'Game Development', 4, 'School of Computing', 'Semester 1'),
  ('CS3281', 'Thematic Systems Project I', 4, 'School of Computing', 'Semester 1'),
  ('CS3282', 'Thematic Systems Project II', 4, 'School of Computing', 'Semester 2'),
  ('CS4211', 'Formal Methods for Software Engineering', 4, 'School of Computing', 'Semester 1'),
  ('CS4212', 'Compiler Design', 4, 'School of Computing', 'Semester 2'),
  ('CS4215', 'Programming Language Implementation', 4, 'School of Computing', 'Semester 1'),
  ('CS4218', 'Software Testing', 4, 'School of Computing', 'Semester 2'),
  ('CS4222', 'Wireless Networking', 4, 'School of Computing', 'Semester 1'),
  ('CS4225', 'Big Data Systems for Data Science', 4, 'School of Computing', 'Semester 2'),
  ('CS4231', 'Parallel and Distributed Algorithms', 4, 'School of Computing', 'Semester 1'),
  ('CS4248', 'Natural Language Processing', 4, 'School of Computing', 'Semester 2');

INSERT INTO prerequisites (module_code, prerequisite_module_code)
VALUES
  ('CS2030S', 'CS1010S'),
  ('CS2040S', 'CS1010S'),
  ('CS2103T', 'CS2030S'),
  ('CS2105', 'CS2040S'),
  ('CS2106', 'CS2100'),
  ('CS3230', 'CS2040S'),
  ('CS3230', 'CS1231S'),
  ('CS3243', 'CS2040S'),
  ('CS3244', 'CS2040S'),
  ('CS3219', 'CS2103T'),
  ('CS4218', 'CS2103T'),
  ('CS4225', 'CS2102'),
  ('CS4248', 'CS3243');

INSERT INTO constraints (profile_id, constraint_type, semester, description)
VALUES
  (1, 'Workload', 'Y1S1', 'Keep the first semester balanced for transition into university.'),
  (1, 'Graduation', 'Y4S2', 'Complete 160 MCs by the target graduation year.'),
  (2, 'Prerequisites', 'All', 'Respect prerequisite ordering across semesters.');

INSERT INTO study_plans (profile_id, plan_name, created_at)
VALUES
  (1, 'Generic CS 160 MC Roadmap', CURRENT_TIMESTAMP),
  (2, 'Generic CS 160 MC Roadmap', CURRENT_TIMESTAMP);

INSERT INTO semester_plans (plan_id, year_no, semester_no, semester)
SELECT plan_id, item.year_no, item.semester_no, item.semester
FROM study_plans
CROSS JOIN (
  VALUES
    (1, 1, 'Y1S1'),
    (1, 2, 'Y1S2'),
    (2, 1, 'Y2S1'),
    (2, 2, 'Y2S2'),
    (3, 1, 'Y3S1'),
    (3, 2, 'Y3S2'),
    (4, 1, 'Y4S1'),
    (4, 2, 'Y4S2')
) AS item(year_no, semester_no, semester)
WHERE profile_id = 1;

INSERT INTO semester_plan_modules (semester_plan_id, module_code, position)
SELECT sp.semester_plan_id, item.module_code, item.position
FROM semester_plans sp
JOIN study_plans plan ON plan.plan_id = sp.plan_id
JOIN (
  VALUES
    ('Y1S1', 'CS1010S', 1),
    ('Y1S1', 'CS1231S', 2),
    ('Y1S1', 'CS2100', 3),
    ('Y1S1', 'CS2101', 4),
    ('Y1S1', 'CS2107', 5),
    ('Y1S2', 'CS2030S', 1),
    ('Y1S2', 'CS2040S', 2),
    ('Y1S2', 'CS2102', 3),
    ('Y1S2', 'CS2103T', 4),
    ('Y1S2', 'CS2105', 5),
    ('Y2S1', 'CS2106', 1),
    ('Y2S1', 'CS2109S', 2),
    ('Y2S1', 'CS2113', 3),
    ('Y2S1', 'CS3230', 4),
    ('Y2S1', 'CS3243', 5),
    ('Y2S2', 'CS3210', 1),
    ('Y2S2', 'CS3211', 2),
    ('Y2S2', 'CS3213', 3),
    ('Y2S2', 'CS3216', 4),
    ('Y2S2', 'CS3217', 5),
    ('Y3S1', 'CS3219', 1),
    ('Y3S1', 'CS3223', 2),
    ('Y3S1', 'CS3235', 3),
    ('Y3S1', 'CS3236', 4),
    ('Y3S1', 'CS3240', 5),
    ('Y3S2', 'CS3241', 1),
    ('Y3S2', 'CS3242', 2),
    ('Y3S2', 'CS3244', 3),
    ('Y3S2', 'CS3245', 4),
    ('Y3S2', 'CS3247', 5),
    ('Y4S1', 'CS3281', 1),
    ('Y4S1', 'CS3282', 2),
    ('Y4S1', 'CS4211', 3),
    ('Y4S1', 'CS4212', 4),
    ('Y4S1', 'CS4215', 5),
    ('Y4S2', 'CS4218', 1),
    ('Y4S2', 'CS4222', 2),
    ('Y4S2', 'CS4225', 3),
    ('Y4S2', 'CS4231', 4),
    ('Y4S2', 'CS4248', 5)
) AS item(semester, module_code, position)
  ON item.semester = sp.semester
WHERE plan.profile_id = 1;

