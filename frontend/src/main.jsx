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
  return response.json();
}

const FALLBACK_MAJORS = [
  { id: 'computer-science', name: 'Computer Science', faculty: 'School of Computing' },
  { id: 'business-analytics', name: 'Business Analytics', faculty: 'School of Computing' },
  { id: 'information-systems', name: 'Information Systems', faculty: 'School of Computing' },
  { id: 'data-science-analytics', name: 'Data Science & Analytics', faculty: 'College of Humanities and Sciences' },
  { id: 'business-administration', name: 'Business Administration', faculty: 'NUS Business School' },
];

const GRAD_TARGETS = [
  { value: 160, label: '160 Units', note: 'Standard' },
  { value: 140, label: '140 Units', note: 'Poly exemption' },
];

const INTERNSHIP_UNITS = [4, 8, 10, 12];

// Mirror of the backend timeline: 8 semesters interleaved with winter/summer breaks.
function buildSlots() {
  const slots = [];
  for (let index = 1; index <= 8; index += 1) {
    const year = Math.ceil(index / 2);
    const part = index % 2 || 2;
    slots.push({ id: `Y${year}S${part}`, kind: 'sem', year, part, label: `Year ${year}, Semester ${part}` });
    if (part === 1) {
      slots.push({ id: `WIN${year}`, kind: 'winter', year, label: `Year ${year} Winter break` });
    } else if (index < 8) {
      slots.push({ id: `SUM${year}`, kind: 'summer', year, label: `Year ${year} Summer (Special Term)` });
    }
  }
  return slots;
}

const SLOTS = buildSlots();
const ELIGIBLE_INTERNSHIP_SLOTS = ['Y2S2', 'Y3S1', 'Y3S2', 'Y4S1', 'SUM2', 'SUM3'];

// Persist the student's selections and generated roadmap in the browser so the page
// is restored exactly as they left it on their next visit.
const STORAGE_KEY = 'coursecompass:state:v1';

function loadSavedState() {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

const SAVED = loadSavedState();

const Icons = {
  map: <svg viewBox="0 0 24 24"><path d="m3 6 5-2 8 3 5-2v13l-5 2-8-3-5 2zM8 4v13m8-10v13" /></svg>,
};

function App() {
  const [majors, setMajors] = useState(FALLBACK_MAJORS);
  const [moduleStats, setModuleStats] = useState(null);

  // Draft controls (applied when "Generate roadmap" is pressed). Restored from the
  // student's last visit when available.
  const [major, setMajor] = useState(SAVED.major ?? 'computer-science');
  const [totalCredits, setTotalCredits] = useState(SAVED.totalCredits ?? 160);
  const [exchangeSemester, setExchangeSemester] = useState(SAVED.exchangeSemester ?? 0);
  const [internshipSlot, setInternshipSlot] = useState(SAVED.internshipSlot ?? '');
  const [internshipUnits, setInternshipUnits] = useState(SAVED.internshipUnits ?? 10);

  // Applied state that produced the current plan.
  const [committed, setCommitted] = useState(SAVED.committed ?? null);
  const [targets, setTargets] = useState(SAVED.targets ?? {});
  const [locked, setLocked] = useState(SAVED.locked ?? {});
  const [editValues, setEditValues] = useState({});
  const [adds, setAdds] = useState(SAVED.adds ?? []);
  const [removes, setRemoves] = useState(SAVED.removes ?? []);

  const [plan, setPlan] = useState(SAVED.plan ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedModule, setSelectedModule] = useState(null);
  const [adder, setAdder] = useState({ open: false, query: '', results: [], slot: '', busy: false });

  useEffect(() => {
    getJson('/api/majors').then((data) => setMajors(data.majors)).catch(() => setMajors(FALLBACK_MAJORS));
    getJson('/api/modules/stats').then(setModuleStats).catch(() => setModuleStats(null));
  }, []);

  // Save the current selections and roadmap so the page restores on the next visit.
  useEffect(() => {
    const snapshot = { major, totalCredits, exchangeSemester, internshipSlot, internshipUnits, committed, targets, locked, adds, removes, plan };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      /* ignore storage write failures (e.g. private mode) */
    }
  }, [major, totalCredits, exchangeSemester, internshipSlot, internshipUnits, committed, targets, locked, adds, removes, plan]);

  function buildBody(base, overrides) {
    const internship = base.internshipSlot ? { slot: base.internshipSlot, units: base.internshipUnits } : null;
    return {
      major: base.major,
      totalCredits: base.totalCredits,
      exchangeSemester: base.exchangeSemester,
      internship,
      semesterTargets: overrides.targets && Object.keys(overrides.targets).length ? overrides.targets : null,
      addModules: overrides.adds || [],
      removeModules: overrides.removes || [],
    };
  }

  // Generates a fresh roadmap from the draft controls, resetting manual edits.
  async function generate() {
    setLoading(true);
    setError('');
    const base = { major, totalCredits, exchangeSemester, internshipSlot, internshipUnits };
    try {
      const result = await postJson('/api/plans/generate', buildBody(base, { targets: null, adds: [], removes: [] }));
      if (!result.ok) {
        setError(result.errors.join(' '));
        return;
      }
      const nextTargets = {};
      result.regularSemesters.forEach((semester) => { nextTargets[semester.id] = semester.credits; });
      setCommitted(base);
      setTargets(nextTargets);
      setLocked({});
      setEditValues({});
      setAdds([]);
      setRemoves([]);
      setPlan(result);
    } catch {
      setError('The roadmap could not be generated. Check that the database and backend are running.');
    } finally {
      setLoading(false);
    }
  }

  // Re-runs the planner for a post-generation edit, reverting the edit if it is blocked.
  async function applyEdit(next) {
    if (!committed) return;
    setLoading(true);
    setError('');
    try {
      const result = await postJson('/api/plans/generate', buildBody(committed, next));
      if (!result.ok) {
        setError(result.errors.join(' '));
        return false;
      }
      if (next.targets) setTargets(next.targets);
      if (next.adds) setAdds(next.adds);
      if (next.removes) setRemoves(next.removes);
      setEditValues({});
      setPlan(result);
      return true;
    } catch {
      setError('That change could not be applied.');
      return false;
    } finally {
      setLoading(false);
    }
  }

  // Distribute a total across the regular semesters, keeping locked semesters fixed and
  // spreading the remainder evenly across the unlocked ones.
  function distributeTargets(total, baseTargets, lockedMap, ids) {
    const lockedIds = ids.filter((id) => lockedMap[id]);
    const unlocked = ids.filter((id) => !lockedMap[id]);
    const lockedSum = lockedIds.reduce((sum, id) => sum + (baseTargets[id] ?? 0), 0);
    const next = {};
    lockedIds.forEach((id) => { next[id] = baseTargets[id] ?? 0; });
    if (unlocked.length === 0) return next;
    const budget = Math.max(total - lockedSum, 0);
    const base = Math.floor(budget / unlocked.length);
    const remainder = budget - base * unlocked.length;
    unlocked.forEach((id, index) => { next[id] = base + (index < remainder ? 1 : 0); });
    return next;
  }

  // Set one semester's target and rebalance the unlocked others so the regular total is
  // preserved. Locked semesters are never changed.
  function setSemesterTarget(id, rawValue) {
    if (locked[id]) return;
    const ids = plan.regularSemesters.map((semester) => semester.id);
    const total = plan.regularTargetTotal;
    let desired = Math.round(Number(rawValue));
    if (!Number.isFinite(desired)) return;
    desired = Math.max(0, Math.min(40, desired));
    const lockedSumOthers = ids.filter((other) => other !== id && locked[other]).reduce((sum, other) => sum + (targets[other] ?? 0), 0);
    const unlocked = ids.filter((other) => other !== id && !locked[other]);
    if (unlocked.length === 0) { setError('Unlock another semester so this change can be balanced.'); return; }
    if (desired > total - lockedSumOthers) desired = Math.max(0, total - lockedSumOthers);
    const budget = total - desired - lockedSumOthers;
    const base = Math.floor(budget / unlocked.length);
    const remainder = budget - base * unlocked.length;
    const next = { ...targets };
    next[id] = desired;
    unlocked.forEach((other, index) => { next[other] = base + (index < remainder ? 1 : 0); });
    applyEdit({ targets: next, adds, removes });
  }

  function toggleLock(id) {
    setLocked((current) => ({ ...current, [id]: !current[id] }));
  }

  function isBreakSlot(slot) {
    return slot.startsWith('WIN') || slot.startsWith('SUM');
  }

  async function removeModule(code) {
    setSelectedModule(null);
    const addedEntry = adds.find((item) => item.code === code);
    if (addedEntry) {
      let nextTargets = targets;
      if (isBreakSlot(addedEntry.slot) && plan) {
        const module = (plan.modules || []).find((item) => item.moduleCode === code);
        const credits = Number(module?.modularCredits || 4);
        const ids = plan.regularSemesters.map((semester) => semester.id);
        nextTargets = distributeTargets(plan.regularTargetTotal + credits, targets, locked, ids);
      }
      await applyEdit({ targets: nextTargets, adds: adds.filter((item) => item.code !== code), removes });
      return;
    }
    if (removes.includes(code)) return;
    await applyEdit({ targets, adds, removes: [...removes, code] });
  }

  async function searchModules(query) {
    setAdder((state) => ({ ...state, query }));
    if (!query.trim()) { setAdder((state) => ({ ...state, results: [] })); return; }
    try {
      const data = await getJson(`/api/modules?search=${encodeURIComponent(query.trim())}`);
      setAdder((state) => ({ ...state, results: data.modules.slice(0, 6) }));
    } catch {
      setAdder((state) => ({ ...state, results: [] }));
    }
  }

  async function confirmAdd(code) {
    if (!adder.slot) { setError('Choose a semester or break to add the module to.'); return; }
    let nextTargets = targets;
    if (isBreakSlot(adder.slot) && plan) {
      const module = adder.results.find((item) => item.moduleCode === code);
      const credits = Number(module?.modularCredits || 4);
      const ids = plan.regularSemesters.map((semester) => semester.id);
      nextTargets = distributeTargets(plan.regularTargetTotal - credits, targets, locked, ids);
    }
    setAdder((state) => ({ ...state, busy: true }));
    const ok = await applyEdit({ targets: nextTargets, adds: [...adds, { code, slot: adder.slot }], removes });
    setAdder({ open: false, query: '', results: [], slot: '', busy: false });
    if (ok) setError('');
  }

  const moduleByCode = useMemo(
    () => new Map((plan?.modules || []).map((item) => [item.moduleCode, item])),
    [plan],
  );

  const addSlotOptions = useMemo(() => SLOTS.filter((slot) => {
    if (!plan) return false;
    if (slot.id === plan.exchangeSlotId) return false;
    if (plan.internship && slot.id === plan.internship.slot) return false;
    return true;
  }), [plan]);

  const majorGroups = useMemo(() => majors.reduce((groups, item) => {
    const faculty = item.faculty || 'Other programmes';
    if (!groups[faculty]) groups[faculty] = [];
    groups[faculty].push(item);
    return groups;
  }, {}), [majors]);

  const stats = useMemo(() => {
    if (!plan) return { modules: 0, credits: 0 };
    const moduleCount = plan.timeline.reduce((sum, slot) => sum + slot.modules.length, 0);
    return { modules: moduleCount, credits: plan.scheduledCredits };
  }, [plan]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><strong>Course<span>Compass</span></strong></div>
        <nav><a className="active" href="#roadmap">{Icons.map}<span>Roadmap</span></a></nav>
        <div className="student"><span>NS</span><div><b>NUS Student</b><small>Undergraduate plan</small></div></div>
      </aside>

      <main>
        <header className="topbar"><span>Your plan&nbsp;&nbsp; / &nbsp;&nbsp;<b>Roadmap</b></span></header>
        <div className="content">
          <section className="hero" id="overview">
            <div><span className="eyebrow">PERSONALISED FOR YOU</span><h1>Your study roadmap</h1><p>A clear semester-by-semester path, built around your goals and constraints.</p></div>
            <div className="track-pill"><i>✓</i> Prerequisites on track</div>
          </section>

          <section className="planner-panel">
            <div className="panel-heading"><span>01</span><div><h2>Shape your journey</h2><p>Choose your programme and add the constraints that matter to you.</p></div></div>

            <div className="controls">
              <label><span>Your major</span><div className="select-field"><i>⌘</i>
                <select aria-label="Your major" value={major} onChange={(event) => setMajor(event.target.value)}>
                  {Object.entries(majorGroups).map(([faculty, programmes]) => (
                    <optgroup key={faculty} label={faculty}>
                      {programmes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div></label>

              <label><span>Exchange semester</span><div className="select-field"><i>✈</i>
                <select aria-label="Exchange semester" value={exchangeSemester} onChange={(event) => setExchangeSemester(Number(event.target.value))}>
                  <option value="0">No exchange planned</option>
                  {Array.from({ length: 8 }, (_, index) => (
                    <option key={index + 1} value={index + 1}>Year {Math.floor(index / 2) + 1}, Semester {(index % 2) + 1}</option>
                  ))}
                </select>
              </div></label>

              <button className="generate" onClick={generate} disabled={loading}>{loading ? 'Building…' : 'Generate roadmap'}<span>→</span></button>
            </div>

            <div className="constraint-row">
              <div className="constraint">
                <span className="constraint-label">Graduation requirement</span>
                <div className="seg" role="group" aria-label="Graduation requirement">
                  {GRAD_TARGETS.map((option) => (
                    <button key={option.value} type="button" className={totalCredits === option.value ? 'on' : ''} onClick={() => setTotalCredits(option.value)}>
                      {option.label}<small>{option.note}</small>
                    </button>
                  ))}
                </div>
              </div>

              <div className="constraint">
                <span className="constraint-label">Internship (single, Year 2 Sem 2 – Year 4 Sem 1)</span>
                <div className="intern-controls">
                  <div className="select-field slim"><i>💼</i>
                    <select aria-label="Internship period" value={internshipSlot} onChange={(event) => setInternshipSlot(event.target.value)}>
                      <option value="">No internship</option>
                      {ELIGIBLE_INTERNSHIP_SLOTS.map((id) => (
                        <option key={id} value={id}>{SLOTS.find((slot) => slot.id === id)?.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="select-field slim"><i>⏱</i>
                    <select aria-label="Internship units" value={internshipUnits} disabled={!internshipSlot} onChange={(event) => setInternshipUnits(Number(event.target.value))}>
                      {INTERNSHIP_UNITS.map((units) => <option key={units} value={units}>{units} Units</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {error && <p className="error-message">{error}</p>}
          </section>

          {plan && (
            <section className="planner-panel workload-panel">
              <div className="panel-heading"><span>02</span><div><h2>Balance your workload</h2><p>Type a value or use −/+ (1 unit at a time). Lock a semester to fix it; the rest rebalance automatically.</p></div></div>
              <div className="workload">
                {plan.regularSemesters.map((semester) => {
                  const isLocked = !!locked[semester.id];
                  const value = editValues[semester.id] ?? String(targets[semester.id] ?? semester.credits);
                  return (
                    <div className={`wl-item ${isLocked ? 'locked' : ''}`} key={semester.id}>
                      <div className="wl-head">
                        <b>{semester.id}</b>
                        <button type="button" className="lock-btn" onClick={() => toggleLock(semester.id)} aria-pressed={isLocked} title={isLocked ? 'Unlock this semester' : 'Fix this semester'}>{isLocked ? '🔒' : '🔓'}</button>
                      </div>
                      <div className="stepper">
                        <button type="button" onClick={() => setSemesterTarget(semester.id, (targets[semester.id] ?? 0) - 1)} disabled={loading || isLocked} aria-label={`Decrease ${semester.id}`}>−</button>
                        <input
                          type="number"
                          min="0"
                          max="40"
                          inputMode="numeric"
                          value={value}
                          disabled={isLocked || loading}
                          onChange={(event) => setEditValues((current) => ({ ...current, [semester.id]: event.target.value }))}
                          onBlur={(event) => setSemesterTarget(semester.id, event.target.value)}
                          onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }}
                          aria-label={`${semester.id} units`}
                        />
                        <button type="button" onClick={() => setSemesterTarget(semester.id, (targets[semester.id] ?? 0) + 1)} disabled={loading || isLocked} aria-label={`Increase ${semester.id}`}>+</button>
                      </div>
                      <small>units</small>
                    </div>
                  );
                })}
                {plan.timeline.filter((slot) => slot.kind !== 'sem' && slot.modules.length > 0).map((slot) => (
                  <div className="wl-item special" key={slot.id}>
                    <div className="wl-head"><b>{slot.id}</b><span className="wl-tag">{slot.kind === 'winter' ? 'Winter' : 'Summer'}</span></div>
                    <div className="wl-readonly">{slot.credits}<small>units</small></div>
                  </div>
                ))}
              </div>
              <div className="workload-total"><span>Total planned</span><b>{plan.scheduledCredits} / {plan.totalCredits} units</b></div>
            </section>
          )}

          <section className="roadmap-section" id="roadmap">
            <div className="roadmap-heading">
              <div className="panel-heading"><span>{plan ? '03' : '02'}</span><div><h2>Your recommended plan</h2><p>{plan?.major.name || majors.find((item) => item.id === major)?.name} · {plan?.major.faculty || majors.find((item) => item.id === major)?.faculty} · 4 years</p></div></div>
              <div className="roadmap-tools">
                {plan && <button type="button" className="add-toggle" onClick={() => setAdder((state) => ({ ...state, open: !state.open }))}>{adder.open ? 'Close' : '+ Add module'}</button>}
                <div className="data-status"><i />{moduleStats ? `${moduleStats.moduleCount.toLocaleString()} live NUS modules` : 'NUSMods catalogue'}</div>
              </div>
            </div>

            {plan && adder.open && (
              <div className="adder">
                <input autoFocus value={adder.query} placeholder="Search a module code or title (e.g. MA1521)" onChange={(event) => searchModules(event.target.value)} />
                <div className="select-field slim adder-slot"><i>📍</i>
                  <select aria-label="Add to slot" value={adder.slot} onChange={(event) => setAdder((state) => ({ ...state, slot: event.target.value }))}>
                    <option value="">Choose semester / break…</option>
                    {addSlotOptions.map((slot) => <option key={slot.id} value={slot.id}>{slot.label}</option>)}
                  </select>
                </div>
                <div className="adder-results">
                  {adder.results.map((module) => (
                    <button type="button" key={module.moduleCode} className="adder-result" disabled={adder.busy} onClick={() => confirmAdd(module.moduleCode)}>
                      <b>{module.moduleCode}</b><span>{module.title}</span><small>{module.modularCredits} units · add →</small>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {plan && plan.warnings.length > 0 && (
              <div className="notice warn">
                {plan.warnings.map((warning, index) => <p key={index}>{warning}</p>)}
              </div>
            )}
            {plan && (
              <div className={`notice ${plan.graduation.meetsTarget ? 'good' : 'warn'}`}>
                <p>{plan.graduation.meetsTarget
                  ? `On track to graduate — ${plan.graduation.scheduledCredits} / ${plan.graduation.targetCredits} Units planned.`
                  : `${plan.graduation.scheduledCredits} / ${plan.graduation.targetCredits} Units planned.`}</p>
              </div>
            )}

            <div className="roadmap-grid">
              <div className="timeline">
                {!plan && !error && <div className="empty-state">Choose your preferences and generate a roadmap.</div>}
                {plan?.timeline.map((slot) => {
                  const kindClass = slot.isExchange ? 'exchange' : slot.isInternship ? 'internship' : slot.kind !== 'sem' ? 'break' : '';
                  return (
                    <article className={`semester ${kindClass}`} key={slot.id}>
                      <div className="node"><i /></div>
                      <div className="semester-name"><b>{slot.id}</b><small>{slot.sublabel}</small></div>
                      {slot.isExchange ? (
                        <div className="exchange-card"><span>✈</span><div><b>Semester abroad</b><small>20 exchange units mapped to degree requirements</small></div></div>
                      ) : slot.isInternship ? (
                        <div className="intern-card"><span>💼</span><div><b>Internship · {slot.internshipUnits} units</b><small>Full-time industry attachment{slot.kind !== 'sem' ? ' (Special Term)' : ''}</small></div></div>
                      ) : (
                        <div className="module-row">
                          {slot.modules.map((code) => {
                            const item = moduleByCode.get(code);
                            const isAdded = adds.some((entry) => entry.code === code);
                            return (
                              <button className={`module-card ${isAdded ? 'added' : ''}`} key={code} onClick={() => setSelectedModule(item)}>
                                <b>{code}</b><span>{item?.title}</span><small>{item?.modularCredits || 4} units</small>
                              </button>
                            );
                          })}
                          {slot.modules.length === 0 && <span className="slot-empty">Open semester</span>}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>

              <aside className="summary-card">
                <div className="summary-title"><h3>At a glance</h3><span><b>4</b><small>years</small></span></div>
                <div className="stats">
                  <div><small>Total modules</small><b>{stats.modules || '—'}</b></div>
                  <div><small>Units planned</small><b>{stats.credits || '—'}</b></div>
                  <div><small>Exchange</small><b>{plan?.exchangeSemester ? '1 sem' : 'None'}</b></div>
                  <div><small>Internship</small><b>{plan?.internship ? `${plan.internship.units}u` : 'None'}</b></div>
                </div>
              </aside>
            </div>
          </section>
        </div>
      </main>

      {selectedModule && (
        <div className="modal-backdrop" role="presentation" onClick={() => setSelectedModule(null)}>
          <section className="module-modal" role="dialog" aria-modal="true" aria-label="Module details" onClick={(event) => event.stopPropagation()}>
            <button className="close" onClick={() => setSelectedModule(null)}>×</button>
            <span className="module-tag">{selectedModule.moduleCode} · {selectedModule.modularCredits} units</span>
            <h2>{selectedModule.title}</h2>
            <p>{selectedModule.description || 'No description is currently available.'}</p>
            <h3>Prerequisites</h3>
            <p>{selectedModule.prerequisiteText || 'No formal prerequisites listed.'}</p>
            <div className="modal-actions">
              <button type="button" className="danger" onClick={() => removeModule(selectedModule.moduleCode)} disabled={loading}>Remove from plan</button>
              {selectedModule.nusmodsUrl && <a href={selectedModule.nusmodsUrl} target="_blank" rel="noreferrer">View on NUSMods ↗</a>}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

window.__COURSECOMPASS_REACT_READY__ = true;

createRoot(document.getElementById('root')).render(<App />);
