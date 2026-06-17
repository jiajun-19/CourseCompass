DROP TABLE IF EXISTS semester_plan_modules CASCADE;
DROP TABLE IF EXISTS semester_plans CASCADE;
DROP TABLE IF EXISTS study_plans CASCADE;
DROP TABLE IF EXISTS constraints CASCADE;
DROP TABLE IF EXISTS prerequisites CASCADE;
DROP TABLE IF EXISTS modules CASCADE;
DROP TABLE IF EXISTS student_profiles CASCADE;

CREATE TABLE IF NOT EXISTS student_profiles (
  profile_id SERIAL PRIMARY KEY,
  major TEXT NOT NULL,
  year_of_study INTEGER NOT NULL CHECK (year_of_study BETWEEN 1 AND 4),
  target_graduation_year INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS modules (
  module_code TEXT PRIMARY KEY,
  module_name TEXT NOT NULL,
  modular_credits INTEGER NOT NULL CHECK (modular_credits > 0),
  faculty TEXT NOT NULL,
  semester_available TEXT NOT NULL,
  acad_year TEXT,
  description TEXT,
  department TEXT,
  semesters INTEGER[] NOT NULL DEFAULT '{}',
  prerequisite_text TEXT,
  prereq_tree JSONB,
  preclusion TEXT,
  nusmods_url TEXT,
  last_synced_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prerequisites (
  prerequisite_id SERIAL PRIMARY KEY,
  module_code TEXT NOT NULL REFERENCES modules(module_code) ON DELETE CASCADE,
  prerequisite_module_code TEXT NOT NULL REFERENCES modules(module_code) ON DELETE CASCADE,
  UNIQUE (module_code, prerequisite_module_code)
);

CREATE TABLE IF NOT EXISTS constraints (
  constraint_id SERIAL PRIMARY KEY,
  profile_id INTEGER NOT NULL REFERENCES student_profiles(profile_id) ON DELETE CASCADE,
  constraint_type TEXT NOT NULL,
  semester TEXT NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS study_plans (
  plan_id SERIAL PRIMARY KEY,
  profile_id INTEGER NOT NULL REFERENCES student_profiles(profile_id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS semester_plans (
  semester_plan_id SERIAL PRIMARY KEY,
  plan_id INTEGER NOT NULL REFERENCES study_plans(plan_id) ON DELETE CASCADE,
  year_no INTEGER NOT NULL CHECK (year_no BETWEEN 1 AND 4),
  semester_no INTEGER NOT NULL CHECK (semester_no BETWEEN 1 AND 2),
  semester TEXT NOT NULL,
  UNIQUE (plan_id, year_no, semester_no)
);

CREATE TABLE IF NOT EXISTS semester_plan_modules (
  semester_plan_module_id SERIAL PRIMARY KEY,
  semester_plan_id INTEGER NOT NULL REFERENCES semester_plans(semester_plan_id) ON DELETE CASCADE,
  module_code TEXT NOT NULL REFERENCES modules(module_code),
  position INTEGER NOT NULL CHECK (position > 0),
  UNIQUE (semester_plan_id, module_code)
);

CREATE INDEX IF NOT EXISTS idx_student_profiles_major ON student_profiles(major);
CREATE INDEX IF NOT EXISTS idx_modules_code ON modules(module_code);
CREATE INDEX IF NOT EXISTS idx_prerequisites_module ON prerequisites(module_code);
CREATE INDEX IF NOT EXISTS idx_constraints_profile ON constraints(profile_id);
CREATE INDEX IF NOT EXISTS idx_study_plans_profile ON study_plans(profile_id);
CREATE INDEX IF NOT EXISTS idx_semester_plans_plan ON semester_plans(plan_id);
CREATE INDEX IF NOT EXISTS idx_semester_plan_modules_semester ON semester_plan_modules(semester_plan_id);