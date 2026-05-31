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

  useEffect(() => {
    getJson('/api/courses')
      .then((data) => setCourses(data.courses))
      .catch(() => setCourses([]));
  }, []);

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
      <select value={course} onChange={handleCourseChange}>
        <option value="">Select course</option>
        {courses.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>

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
    </main>
  );
}

window.__COURSECOMPASS_REACT_READY__ = true;

createRoot(document.getElementById('root')).render(<App />);
