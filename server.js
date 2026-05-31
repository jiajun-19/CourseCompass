const http = require('node:http');
const fsSync = require('node:fs');
const fs = require('node:fs/promises');
const path = require('node:path');
const { Pool } = require('pg');

const ROOT = __dirname;
const DIST_ROOT = path.join(ROOT, 'dist');

function loadEnvFile() {
  const envPath = path.join(ROOT, '.env');
  if (!fsSync.existsSync(envPath)) return;

  const lines = fsSync.readFileSync(envPath, 'utf-8').split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) return;

    const index = trimmed.indexOf('=');
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, '');
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
}

loadEnvFile();

const PORT = Number(process.env.PORT || 4182);
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://localhost:5432/coursecompass';

const pool = new Pool({ connectionString: DATABASE_URL });

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

function sendText(response, statusCode, message, contentType = 'text/plain; charset=utf-8') {
  response.writeHead(statusCode, {
    'Cache-Control': 'no-store',
    'Content-Type': contentType,
  });
  response.end(message);
}

function normalizeMajor(value) {
  return value === 'cs' ? 'Computer Science' : value;
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf-8');
  return raw ? JSON.parse(raw) : {};
}

async function serveStatic(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const requestedPath = url.pathname === '/' ? '/index.html' : url.pathname;
  const staticRoot = DIST_ROOT;

  try {
    await fs.access(staticRoot);
  } catch {
    sendText(response, 500, 'React build folder is missing. Run npm run build, then restart npm start.');
    return;
  }

  const resolvedPath = path.normalize(path.join(staticRoot, requestedPath));

  if (!resolvedPath.startsWith(staticRoot)) {
    sendText(response, 403, 'Forbidden');
    return;
  }

  try {
    const file = await fs.readFile(resolvedPath);
    response.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Type': mimeTypes[path.extname(resolvedPath)] || 'application/octet-stream',
    });
    response.end(file);
  } catch {
    if (path.extname(resolvedPath)) {
      sendText(response, 404, `Static asset not found: ${url.pathname}`);
      return;
    }

    const fallbackPath = path.join(staticRoot, 'index.html');
    try {
      const fallback = await fs.readFile(fallbackPath);
      response.writeHead(200, {
        'Cache-Control': 'no-store',
        'Content-Type': 'text/html; charset=utf-8',
      });
      response.end(fallback);
    } catch {
      sendText(response, 404, 'Not found');
    }
  }
}

async function getStaticDebugInfo() {
  const files = await fs.readdir(path.join(DIST_ROOT, 'assets')).catch(() => []);
  return {
    staticRoot: DIST_ROOT,
    indexHtml: path.join(DIST_ROOT, 'index.html'),
    assets: files,
  };
}

function maskDatabaseUrl(value) {
  try {
    const url = new URL(value);
    if (url.password) url.password = '***';
    return url.toString();
  } catch {
    return value.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');
  }
}

async function getDatabaseDebugInfo() {
  const client = await pool.connect();
  try {
    const connection = await client.query(`
      SELECT current_database() AS database, current_user AS "user", inet_server_port() AS port
    `);
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    return {
      ok: true,
      connection: connection.rows[0],
      databaseUrl: maskDatabaseUrl(DATABASE_URL),
      tables: tables.rows.map((row) => row.table_name),
    };
  } finally {
    client.release();
  }
}

function courseFromRow(row) {
  return {
    id: row.major,
    name: row.major,
    award: row.major,
    totalMCs: 160,
    semesters: 8,
    coreCheckLabel: 'CS-coded modules retrieved from PostgreSQL',
  };
}

function moduleFromRow(row) {
  return {
    moduleCode: row.module_code,
    title: row.module_name,
    mcs: row.modular_credits,
    type: row.faculty,
  };
}

async function getDatabaseStats() {
  const { rows } = await pool.query(`
    SELECT
      (SELECT COUNT(*)::int FROM student_profiles) AS student_count,
      (SELECT COUNT(*)::int FROM modules) AS module_count,
      (SELECT COUNT(*)::int FROM study_plans) AS plan_count,
      (SELECT COUNT(*)::int FROM semester_plan_modules) AS mapped_module_count
  `);
  return rows[0];
}

async function getCourses() {
  const { rows } = await pool.query(`
    SELECT DISTINCT major
    FROM student_profiles
    ORDER BY major
  `);
  return rows.map(courseFromRow);
}

async function getCourse(courseId) {
  const major = normalizeMajor(courseId);
  const { rows } = await pool.query(`
    SELECT DISTINCT major
    FROM student_profiles
    WHERE major = $1
  `, [major]);
  return rows[0] ? courseFromRow(rows[0]) : null;
}

async function getStudentProfiles() {
  const { rows } = await pool.query(`
    SELECT
      sp.profile_id AS "profileId",
      sp.major,
      sp.year_of_study AS "yearOfStudy",
      sp.target_graduation_year AS "targetGraduationYear"
    FROM student_profiles sp
    ORDER BY sp.profile_id
  `);
  return rows;
}

async function getModulesForCourse(courseId) {
  if (normalizeMajor(courseId) !== 'Computer Science') return [];

  const { rows } = await pool.query(`
    SELECT module_code, module_name, modular_credits, faculty
    FROM modules
    WHERE module_code LIKE 'CS%'
    ORDER BY module_code
  `);
  return rows.map(moduleFromRow);
}

async function getDefaultPlan(courseId) {
  const major = normalizeMajor(courseId);
  const { rows } = await pool.query(`
    SELECT
      plan.plan_id,
      plan.profile_id,
      plan.plan_name,
      plan.created_at,
      profile.major
    FROM study_plans plan
    JOIN student_profiles profile ON profile.profile_id = plan.profile_id
    WHERE profile.major = $1
    ORDER BY plan.plan_id
    LIMIT 1
  `, [major]);
  return rows[0] || null;
}

async function getPlanRows(planId) {
  const { rows } = await pool.query(`
    SELECT
      sp.semester,
      sp.year_no,
      sp.semester_no,
      spm.position,
      m.module_code,
      m.module_name,
      m.modular_credits,
      m.faculty
    FROM semester_plans sp
    JOIN semester_plan_modules spm ON spm.semester_plan_id = sp.semester_plan_id
    JOIN modules m ON m.module_code = spm.module_code
    WHERE sp.plan_id = $1
    ORDER BY sp.year_no, sp.semester_no, spm.position
  `, [planId]);
  return rows;
}

function buildPlanFromRows(rows) {
  const semesters = [];
  const plan = {};
  const modulesByCode = new Map();

  rows.forEach((row) => {
    if (!plan[row.semester]) {
      plan[row.semester] = [];
      semesters.push(row.semester);
    }
    plan[row.semester].push(row.module_code);
    modulesByCode.set(row.module_code, moduleFromRow(row));
  });

  return {
    semesters,
    plan,
    plannedModules: Array.from(modulesByCode.values()),
    totalMCs: rows.reduce((sum, row) => sum + row.modular_credits, 0),
  };
}

async function generatePlan(courseId) {
  const course = await getCourse(courseId);
  const studyPlan = await getDefaultPlan(courseId);
  if (!course || !studyPlan) return null;

  const rows = await getPlanRows(studyPlan.plan_id);
  const courseModules = await getModulesForCourse(courseId);
  const mapped = buildPlanFromRows(rows);
  const stats = await getDatabaseStats();

  return {
    course,
    pathway: {
      id: studyPlan.plan_id,
      name: studyPlan.plan_name,
      description: 'Pre-mapped academic pathway from STUDY_PLANS and SEMESTER_PLANS.',
      totalMCs: 160,
    },
    semesters: mapped.semesters,
    plan: mapped.plan,
    modules: courseModules,
    analysis: {
      warnings: mapped.totalMCs === course.totalMCs ? [] : [`Mapped study plan has ${mapped.totalMCs} MCs, expected ${course.totalMCs} MCs.`],
      stats: { mc: mapped.totalMCs },
    },
    database: {
      type: 'PostgreSQL',
      tables: ['student_profiles', 'constraints', 'study_plans', 'semester_plans', 'semester_plan_modules', 'modules', 'prerequisites'],
      moduleCount: stats.module_count,
      mappedModuleCount: stats.mapped_module_count,
      source: 'pre-seeded sample CS module bank',
    },
  };
}

async function handleRequest(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === 'GET' && url.pathname === '/api/health') {
    const stats = await getDatabaseStats();
    sendJson(response, 200, {
      ok: true,
      service: 'CourseCompass API',
      database: {
        type: 'PostgreSQL',
        moduleCount: stats.module_count,
        studentCount: stats.student_count,
        planCount: stats.plan_count,
        mappedModuleCount: stats.mapped_module_count,
      },
    });
    return;
  }

  if (request.method === 'GET' && url.pathname === '/debug/static') {
    sendJson(response, 200, await getStaticDebugInfo());
    return;
  }

  if (request.method === 'GET' && url.pathname === '/debug/db') {
    sendJson(response, 200, await getDatabaseDebugInfo());
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/courses') {
    sendJson(response, 200, { courses: await getCourses() });
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/students') {
    sendJson(response, 200, { students: await getStudentProfiles() });
    return;
  }

  if (request.method === 'GET' && url.pathname.match(/^\/api\/courses\/[^/]+\/modules$/)) {
    const courseId = url.pathname.split('/')[3];
    const course = await getCourse(courseId);
    if (!course) {
      sendJson(response, 404, { error: 'Course not found' });
      return;
    }
    sendJson(response, 200, { course, modules: await getModulesForCourse(courseId) });
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/plans/generate') {
    try {
      const body = await readBody(request);
      const result = await generatePlan(body.courseId);
      if (!result) {
        sendJson(response, 404, { error: 'Course or pathway not found' });
        return;
      }
      sendJson(response, 200, result);
    } catch (error) {
      sendJson(response, 400, { error: error.message || 'Invalid request body' });
    }
    return;
  }

  await serveStatic(request, response);
}

http.createServer((request, response) => {
  handleRequest(request, response).catch((error) => {
    console.error(error);
    sendJson(response, 500, {
      error: 'Internal server error',
      detail: error.message,
      databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
    });
  });
}).listen(PORT, '127.0.0.1', () => {
  console.log(`CourseCompass frontend and API running at http://127.0.0.1:${PORT}`);
  console.log(`PostgreSQL connection: ${DATABASE_URL}`);
});
