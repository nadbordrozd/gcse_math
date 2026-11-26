// Home page: greeting, recommendations and the full topic catalogue.
import { AREAS, UNITS, UNIT, SKILL, TUTORIALS_BY_SKILL } from '../registry.js';
import { state, save, points, skillStatus, dayStreak, answeredToday, markOf } from './state.js';
import { esc, gradeBadge, higherBadge, STATUS, MARK, progressBar, areaStyle, AREA } from './ui.js';
import { visibleUnitSkills, recommendations, unitSummary, overallSummary, hasQuestions, todoSkills } from './plan.js';
import { markToggleHTML, onMarkChange } from './marks.js';
import { returnTo } from './trail.js';

let searchTerm = '';
let todoOnly = false;
const DOTS = {
  todo: { label: 'To do', icon: '📌', cls: 'dot-todo' },
  mastered: { label: 'Mastered', icon: '★', cls: 'dot-mastered' },
  know: { label: 'I know this', icon: '✓', cls: 'dot-know' },
  progress: { label: 'In progress', icon: '◐', cls: 'dot-progress' },
  none: { label: 'Not started', icon: '', cls: '' },
};
const openUnits = new Set(JSON.parse(sessionStorage.getItem('gcse_open_units') || '[]'));

/** focus: { unit, skill } – open that topic, scroll to it and highlight a skill (#/topic/<unit>/<skill>). */
export function renderHome(root, focus = {}) {
  if (focus.unit) { searchTerm = ''; openUnits.add(focus.unit); sessionStorage.setItem('gcse_open_units', JSON.stringify([...openUnits])); }
  const o = overallSummary();
  const recs = recommendations(4);
  const streak = dayStreak();
  const today = answeredToday();
  const firstVisit = state.tally.attempted === 0 && !Object.keys(state.checks).length;
  root.innerHTML = `
    <section class="hero">
      <div class="hero-text">
        <h1>${firstVisit ? 'Welcome! Pick a topic and start practising.' : `${greeting()}${state.settings.name ? `, ${esc(state.settings.name)}` : ''}!`}</h1>
        <p class="lead">${firstVisit
    ? 'Every topic is open – dive in anywhere. Not sure where you stand? A <b>quick check</b> takes about 5 minutes and tells you where to start in a topic.'
    : 'Short, focused practice adds up. Here is what to do next.'}</p>
        <div class="stats">
          <div class="stat"><b>${today}</b><span>questions today</span></div>
          <div class="stat"><b>${streak}</b><span>day streak${streak ? ' 🔥' : ''}</span></div>
          <div class="stat"><b>${o.mastered}<small>/${o.total}</small></b><span>skills mastered</span></div>
          <a class="stat stat-link todo-stat" href="#/todo"><b>${todoSkills().length}</b><span>📌 to do</span></a>
        </div>
      </div>
      <div class="hero-cards">
        ${firstVisit || !recs.length ? `
          <a class="tile" href="#/check-pick"><span class="tile-icon">⏱</span><span><b>Start with a quick check</b><small>About 5 minutes on one topic. Find out where you are and what to practise first.</small></span></a>` : ''}
        ${recs.length ? `<h2 class="small-title">${firstVisit ? 'Or start from the very beginning' : 'Up next'}</h2>${recs.slice(0, firstVisit ? 2 : 4).map((r) => recCard(r)).join('')}` : ''}
        <div class="tile-row">
          <a class="tile mini" href="#/learn"><span class="tile-icon">📖</span><span><b>Learn</b><small>Explanations &amp; examples</small></span></a>
          <a class="tile mini" href="#/check-pick"><span class="tile-icon">⏱</span><span><b>Quick check</b><small>5-minute level test</small></span></a>
          <a class="tile mini" href="#/mixed"><span class="tile-icon">🔀</span><span><b>Mixed practice</b><small>Review what you've learned</small></span></a>
          <a class="tile mini" href="#/mock"><span class="tile-icon">📝</span><span><b>Mock exam</b><small>Timed exam-style paper</small></span></a>
        </div>
      </div>
    </section>
    <section class="catalogue">
      <div class="catalogue-head">
        <h2>All topics</h2>
        <div class="catalogue-tools">
          <input type="search" class="search" placeholder="Search skills… e.g. surds, bearings" value="${esc(searchTerm)}" aria-label="Search skills">
          <button type="button" class="btn small todo-filter ${todoOnly ? 'on' : ''}" aria-pressed="${todoOnly}" title="Show only skills marked To do">📌 To do only</button>
          <div class="seg" role="radiogroup" aria-label="Tier">
            <button type="button" data-tier="foundation" class="${state.settings.tier === 'foundation' ? 'on' : ''}" title="Hide Higher-only skills">Foundation</button>
            <button type="button" data-tier="higher" class="${state.settings.tier === 'higher' ? 'on' : ''}" title="Show everything">Higher</button>
          </div>
        </div>
      </div>
      <div class="legend">${['todo', 'know', 'mastered', 'progress'].map((k) => `<span><i class="dot ${DOTS[k].cls}"></i>${DOTS[k].label}</span>`).join('')}<span class="legend-grade">${gradeBadge(5)} typical grade</span><span><span class="tier-badge">H</span> Higher only</span><span>Mark skills yourself with <b>✓</b> / <b>📌</b></span></div>
      <div class="areas"></div>
    </section>`;
  renderAreas(root.querySelector('.areas'));
  root.querySelector('.search').addEventListener('input', (e) => { searchTerm = e.target.value; renderAreas(root.querySelector('.areas')); });
  root.querySelector('.todo-filter').addEventListener('click', (e) => {
    todoOnly = !todoOnly;
    e.currentTarget.classList.toggle('on', todoOnly);
    e.currentTarget.setAttribute('aria-pressed', String(todoOnly));
    renderAreas(root.querySelector('.areas'));
  });
  onMarkChange((id) => {
    const unitEl = root.querySelector(`details.unit[data-unit="${SKILL_UNIT(id)}"]`);
    if (unitEl) unitEl.querySelector('summary').innerHTML = summaryHTML(UNIT[unitEl.dataset.unit]);
    const stat = root.querySelector('.todo-stat b');
    if (stat) stat.textContent = todoSkills().length;
  });
  root.querySelectorAll('[data-tier]').forEach((b) => b.addEventListener('click', () => {
    state.settings.tier = b.dataset.tier; save(); renderHome(root);
  }));
  const unitEl = focus.unit && root.querySelector(`details.unit[data-unit="${focus.unit}"]`);
  if (unitEl) {
    requestAnimationFrame(() => unitEl.scrollIntoView({ block: 'start', behavior: 'smooth' }));
    const row = focus.skill && unitEl.querySelector(`a.skill[href="#/skill/${focus.skill}"]`);
    row?.classList.add(skillStatus(focus.skill) === 'mastered' ? 'just-mastered' : 'just-here');
  }
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

function recCard({ skill, why }) {
  const st = STATUS[skillStatus(skill.id)];
  return `<a class="rec" href="#/skill/${skill.id}" style="${areaStyle(skill.area)}">
    <span class="rec-area">${esc(AREA[skill.area]?.short || AREA[skill.area]?.title)}</span>
    <span class="rec-title">${gradeBadge(skill.grade)} ${esc(skill.title)}</span>
    <span class="rec-why">${esc(why)}</span>
    ${points(skill.id) ? progressBar(points(skill.id)) : ''}
    <span class="rec-go">${st && points(skill.id) ? 'Continue' : 'Start'} →</span>
  </a>`;
}

function renderAreas(el) {
  const term = searchTerm.trim().toLowerCase();
  el.innerHTML = AREAS.map((area) => {
    const units = UNITS.filter((u) => u.area === area.id);
    const unitHTML = units.map((u) => unitCard(u, term)).filter(Boolean).join('');
    if (!unitHTML) return '';
    return `<section class="area" style="${areaStyle(area.id)}" id="area-${area.id}">
      <h3 class="area-title"><span class="area-icon">${esc(area.icon)}</span>${esc(area.title)}</h3>
      <div class="units">${unitHTML}</div>
    </section>`;
  }).join('') || `<p class="empty">${todoOnly && !term ? 'Nothing on your to-do list. Mark a skill with 📌 or take a quick check to fill it.' : 'No skills match your search.'}</p>`;
  el.querySelectorAll('.row-learn').forEach((b) => {
    const go = (e) => {
      e.preventDefault(); e.stopPropagation();
      const skill = SKILL[b.closest('.skill-li')?.querySelector('a.skill')?.getAttribute('href')?.split('/')[2]];
      if (skill) returnTo(`#/topic/${skill.unit}/${skill.id}`, `Back to ${UNIT[skill.unit].title}`); // come back to this row
      location.hash = `#/learn/${b.dataset.learn}`;
    };
    b.addEventListener('click', go);
    b.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(e); });
  });
  el.querySelectorAll('details.unit').forEach((d) => d.addEventListener('toggle', () => {
    if (d.open) openUnits.add(d.dataset.unit); else openUnits.delete(d.dataset.unit);
    sessionStorage.setItem('gcse_open_units', JSON.stringify([...openUnits]));
  }));
}

const SKILL_UNIT = (id) => SKILL[id]?.unit;

function summaryHTML(unit) {
  const sum = unitSummary(unit);
  const check = sum.check;
  const chips = [
    check ? `<span class="chip chip-check" title="Quick check taken ${new Date(check.at).toLocaleDateString('en-GB')}">⏱ Checked ${new Date(check.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}${check.level ? ` · ≈ grade ${check.level}` : ''}</span>` : '',
    sum.know ? `<span class="chip ${MARK.know.cls}">✓ ${sum.know} known</span>` : '',
    sum.todo ? `<span class="chip ${MARK.todo.cls}">📌 ${sum.todo} to do</span>` : '',
    sum.mastered ? `<span class="chip chip-mastered">★ ${sum.mastered} mastered</span>` : '',
  ].filter(Boolean).join('');
  return `<div class="unit-head">
        <span class="unit-title">${esc(unit.title)}</span>
        <span class="unit-blurb">${esc(unit.blurb)}</span>
        ${chips ? `<span class="unit-chips">${chips}</span>` : ''}
      </div>
      <div class="unit-side">
        <span class="unit-grades">Grades ${sum.minGrade}–${sum.maxGrade}</span>
        <span class="dots">${sum.statuses.map((st) => `<i class="dot ${DOTS[st].cls}" title="${DOTS[st].label}"></i>`).join('')}</span>
      </div>`;
}

function unitCard(unit, term) {
  let skills = visibleUnitSkills(unit);
  if (term) skills = skills.filter((s) => `${s.title} ${s.summary} ${unit.title}`.toLowerCase().includes(term));
  if (todoOnly) skills = skills.filter((s) => markOf(s.id) === 'todo');
  if (!skills.length) return '';
  const sum = unitSummary(unit);
  const open = term || todoOnly || openUnits.has(unit.id);
  return `<details class="unit" data-unit="${unit.id}" ${open ? 'open' : ''}>
    <summary>${summaryHTML(unit)}</summary>
    <div class="unit-body">
      <div class="unit-actions">
        <a class="btn small" href="#/check/${unit.id}">⏱ ${sum.check ? 'Retake' : 'Take'} quick check</a>
        <span class="muted">${sum.total} skills · ${sum.mastered} mastered</span>
      </div>
      <ol class="skills">${skills.map((s) => skillRow(s)).join('')}</ol>
    </div>
  </details>`;
}

function skillRow(s) {
  const st = STATUS[skillStatus(s.id)];
  const ready = hasQuestions(s.id);
  const p = points(s.id);
  return `<li class="skill-li"><a class="skill ${st.cls} ${ready ? '' : 'disabled'}" href="${ready ? `#/skill/${s.id}` : '#/'}" ${ready ? '' : 'aria-disabled="true" tabindex="-1"'}>
    ${gradeBadge(s.grade)}
    <span class="skill-main"><span class="skill-title">${esc(s.title)} ${higherBadge(s)}</span><span class="skill-sum">${esc(s.summary)}</span></span>
    <span class="skill-side">${st.icon ? `<span class="status ${st.cls}" title="${st.label}">${st.icon} <span class="status-label">${st.label}</span></span>` : ''}${p ? progressBar(p) : ready ? '' : '<span class="muted small">coming soon</span>'}</span>
    ${TUTORIALS_BY_SKILL[s.id] ? `<span class="row-learn" role="link" tabindex="0" data-learn="${TUTORIALS_BY_SKILL[s.id][0].id}" title="Learn: ${esc(TUTORIALS_BY_SKILL[s.id][0].title)}">📖</span>` : ''}
  </a>${markToggleHTML(s.id)}</li>`;
}
