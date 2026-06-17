import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function getJson(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) throw new Error('Request failed');
  return response.json();
}

async function postJson(path, payload) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Request failed');
  return response.json();
}

function App() {
  const [courses, setCourses] = useState([]);
  const [course, setCourse] = useState('');
  const [plan, setPlan] = useState(null);
  const [moduleStats, setModuleStats] = useState(null);
  const [moduleSearch, setModuleSearch] = useState('CS2103T');
  const [modules, setModules] = useState([]);

  useEffect(() => {
    getJson('/api/courses')
      .then((data) => setCourses(data.courses))
      .catch(() => setCourses([]));

    getJson('/api/modules/stats')
      .then(setModuleStats)
      .catch(() => setModuleStats(null));
  }, []);

  useEffect(() => {
    const trimmedSearch = moduleSearch.trim();
    if (!trimmedSearch) {
      setModules([]);
      return;
    }

    const timeout = window.setTimeout(() => {
      getJson(`/api/modules?search=${encodeURIComponent(trimmedSearch)}`)
        .then((data) => setModules(data.modules))
        .catch(() => setModules([]));
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [moduleSearch]);

  function getModuleTitle(code) {
    return plan?.modules.find((module) => module.moduleCode === code)?.title || '';
  }

  async function handleCourseChange(event) {
    const value = event.target.value;
    setCourse(value);
    setPlan(null);

    if (!value) return;

    try {
      const generatedPlan = await postJson('/api/plans/generate', { courseId: value });
      setPlan(generatedPlan);
    } catch {
      setPlan(null);
    }
  }

  return (
    <main>
      <div className="controls">
        <label>
          <span>Study roadmap proof of concept</span>
          <select value={course} onChange={handleCourseChange}>
            <option value="">Select course</option>
            {courses.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>NUSMods module catalogue</span>
          <input
            value={moduleSearch}
            onChange={(event) => setModuleSearch(event.target.value)}
            placeholder="Search module code or title"
          />
        </label>
      </div>

      {moduleStats && (
        <p className="catalogue-status">
          {moduleStats.moduleCount} NUSMods modules imported for {moduleStats.acadYear}.
          {' '}
          {moduleStats.modulesWithPrerequisiteTree} modules include structured prerequisite trees.
        </p>
      )}

      {plan && (
        <section>
          {plan.semesters.map((semester) => (
            <div key={semester} className="semester">
              <h2>{semester}</h2>
              <ul>
                {plan.plan[semester].map((code) => (
                  <li key={code}>
                    <span>{code}</span>
                    <span>{getModuleTitle(code)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {modules.length > 0 && (
        <section>
          <h2>Module catalogue results</h2>
          <ul className="module-results">
            {modules.map((module) => (
              <li key={module.moduleCode}>
                <span>{module.moduleCode}</span>
                <div>
                  <strong>{module.title}</strong>
                  <small>
                    {module.modularCredits} MCs
                    {module.semesters.length > 0 ? ` · Sem ${module.semesters.join(', ')}` : ''}
                  </small>
                  {module.prerequisiteText && <p>{module.prerequisiteText}</p>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

window.__COURSECOMPASS_REACT_READY__ = true;

createRoot(document.getElementById('root')).render(<App />);