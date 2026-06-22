import React, { useEffect, useMemo, useState } from 'react';
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

const FALLBACK_MAJORS = [
  { id: 'computer-science', name: 'Computer Science', faculty: 'School of Computing' },
  { id: 'business-analytics', name: 'Business Analytics', faculty: 'School of Computing' },
  { id: 'information-systems', name: 'Information Systems', faculty: 'School of Computing' },
  { id: 'data-science-analytics', name: 'Data Science & Analytics', faculty: 'College of Humanities and Sciences' },
  { id: 'business-administration', name: 'Business Administration', faculty: 'NUS Business School' },
];

const Icons = {
  map: <svg viewBox="0 0 24 24"><path d="m3 6 5-2 8 3 5-2v13l-5 2-8-3-5 2zM8 4v13m8-10v13"/></svg>,
};

function App() {
  const [majors, setMajors] = useState(FALLBACK_MAJORS);
  const [major, setMajor] = useState('computer-science');
  const [exchangeSemester, setExchangeSemester] = useState('6');
  const [plan, setPlan] = useState(null);
  const [moduleStats, setModuleStats] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson('/api/majors')
      .then((data) => setMajors(data.majors))
      .catch(() => setMajors(FALLBACK_MAJORS));

    getJson('/api/modules/stats')
      .then(setModuleStats)
      .catch(() => setModuleStats(null));
  }, []);

  async function generatePlan() {
    setLoading(true);
    setError('');
    try {
      const generatedPlan = await postJson('/api/plans/generate', {
        major,
        exchangeSemester: Number(exchangeSemester),
      });
      setPlan(generatedPlan);
    } catch (requestError) {
      setError('The roadmap could not be generated. Check that the database and backend are running.');
    } finally {
      setLoading(false);
    }
  }

  const moduleByCode = useMemo(
    () => new Map((plan?.modules || []).map((item) => [item.moduleCode, item])),
    [plan],
  );

  const counts = useMemo(() => {
    const local = plan?.semesters.reduce((sum, semester) => sum + (plan.plan[semester]?.length || 0), 0) || 0;
    const exchange = plan?.exchangeSemester ? 5 : 0;
    const credits = (plan?.modules || []).reduce((sum, item) => sum + Number(item.modularCredits || 4), 0);
    return { modules: local + exchange, credits: credits + (plan?.exchangeCredits || 0) };
  }, [plan]);

  const majorGroups = useMemo(() => majors.reduce((groups, item) => {
    const faculty = item.faculty || 'Other programmes';
    if (!groups[faculty]) groups[faculty] = [];
    groups[faculty].push(item);
    return groups;
  }, {}), [majors]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><strong>Course<span>Compass</span></strong></div>
        <nav>
          <a className="active" href="#roadmap">{Icons.map}<span>Roadmap</span></a>
        </nav>
        <div className="student"><span>NS</span><div><b>NUS Student</b><small>Undergraduate plan</small></div></div>
      </aside>

      <main>
        <header className="topbar"><span>Your plan&nbsp;&nbsp; / &nbsp;&nbsp;<b>Roadmap</b></span></header>
        <div className="content">
          <section className="hero" id="overview">
            <div><span className="eyebrow">PERSONALISED FOR YOU</span><h1>Your study roadmap</h1><p>A clear semester-by-semester path, built around your goals.</p></div>
            <div className="track-pill"><i>✓</i> Prerequisites on track</div>
          </section>

          <section className="planner-panel">
            <div className="panel-heading"><span>01</span><div><h2>Shape your journey</h2><p>Choose your programme and tell us when you’ll be away.</p></div></div>
            <div className="controls">
              <label><span>Your major</span><div className="select-field"><i>⌘</i><select aria-label="Your major" value={major} onChange={(event) => setMajor(event.target.value)}>{Object.entries(majorGroups).map(([faculty, programmes]) => <optgroup key={faculty} label={faculty}>{programmes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</optgroup>)}</select></div></label>
              <label><span>Exchange semester</span><div className="select-field"><i>✈</i><select aria-label="Exchange semester" value={exchangeSemester} onChange={(event) => setExchangeSemester(event.target.value)}><option value="0">No exchange planned</option>{Array.from({ length: 8 }, (_, index) => <option key={index + 1} value={index + 1}>Year {Math.floor(index / 2) + 1}, Semester {(index % 2) + 1}</option>)}</select></div></label>
              <button className="generate" onClick={generatePlan} disabled={loading}>{loading ? 'Building your plan…' : 'Generate roadmap'}<span>→</span></button>
            </div>
            {error && <p className="error-message">{error}</p>}
          </section>

          <section className="roadmap-section" id="roadmap">
            <div className="roadmap-heading">
              <div className="panel-heading"><span>02</span><div><h2>Your recommended plan</h2><p>{plan?.major.name || majors.find((item) => item.id === major)?.name} · {plan?.major.faculty || majors.find((item) => item.id === major)?.faculty} · 4 years</p></div></div>
              <div className="data-status"><i />{moduleStats ? `${moduleStats.moduleCount.toLocaleString()} live NUS modules` : 'NUSMods catalogue'}</div>
            </div>

            <div className="roadmap-grid">
              <div className="timeline">
                {!plan && !error && <div className="empty-state">Choose your preferences to build a roadmap.</div>}
                {plan?.semesters.map((semester, index) => {
                  const isExchange = plan.exchangeSemester === index + 1;
                  return <article className={`semester ${isExchange ? 'exchange' : ''}`} key={semester}>
                    <div className="node"><i /></div>
                    <div className="semester-name"><b>{semester}</b><small>Year {Math.floor(index / 2) + 1} · Semester {(index % 2) + 1}</small></div>
                    {isExchange ? <div className="exchange-card"><span>✈</span><div><b>Semester abroad</b><small>20 exchange units mapped to degree requirements</small></div></div> :
                      <div className="module-row">{(plan.plan[semester] || []).map((code) => { const item = moduleByCode.get(code); return <button className="module-card" key={code} onClick={() => setSelectedModule(item)}><b>{code}</b><span>{item?.title}</span><small>{item?.modularCredits || 4} units</small></button>; })}</div>}
                  </article>;
                })}
              </div>

              <aside className="summary-card">
                <div className="summary-title"><h3>At a glance</h3><span><b>4</b><small>years</small></span></div>
                <div className="stats"><div><small>Total modules</small><b>{counts.modules || '—'}</b></div><div><small>Modular units</small><b>{counts.credits || '—'}</b></div><div><small>Semesters</small><b>8</b></div><div><small>Exchange</small><b>{plan?.exchangeSemester ? '1 sem' : 'None'}</b></div></div>
              </aside>
            </div>
          </section>
        </div>
      </main>

      {selectedModule && <div className="modal-backdrop" role="presentation" onClick={() => setSelectedModule(null)}><section className="module-modal" role="dialog" aria-modal="true" aria-label="Module details" onClick={(event) => event.stopPropagation()}><button className="close" onClick={() => setSelectedModule(null)}>×</button><span className="module-tag">{selectedModule.moduleCode} · {selectedModule.modularCredits} units</span><h2>{selectedModule.title}</h2><p>{selectedModule.description || 'No description is currently available.'}</p><h3>Prerequisites</h3><p>{selectedModule.prerequisiteText || 'No formal prerequisites listed.'}</p>{selectedModule.nusmodsUrl && <a href={selectedModule.nusmodsUrl} target="_blank" rel="noreferrer">View on NUSMods ↗</a>}</section></div>}
    </div>
  );
}

window.__COURSECOMPASS_REACT_READY__ = true;

createRoot(document.getElementById('root')).render(<App />);
