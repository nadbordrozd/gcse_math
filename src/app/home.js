// Home page: greeting, recommendations and the full topic catalogue.
import { AREAS, UNITS } from '../registry.js';
import { state, save, points, skillStatus, dayStreak, answeredToday } from './state.js';
import { esc, gradeBadge, higherBadge, STATUS, progressBar, areaStyle, AREA } from './ui.js';
import { visibleUnitSkills, recommendations, unitSummary, overallSummary, hasQuestions } from './plan.js';

let searchTerm = '';
const openUnits = new Set(JSON.parse(sessionStorage.getItem('gcse_open_units') || '[]'));

export function renderHome(root) {
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
          <div class="stat"><b>${o.unitsChecked}<small>/${UNITS.length}</small></b><span>topics checked</span></div>
        </div>
      </div>
      <div class="hero-cards">
        ${firstVisit || !recs.length ? `
          <a class="tile" href="#/check-pick"><span class="tile-icon">⏱</span><span><b>Start with a quick check</b><small>About 5 minutes on one topic. Find out where you are and what to practise first.</small></span></a>` : ''}
        ${recs.length ? `<h2 class="small-title">${firstVisit ? 'Or start from the very beginning' : 'Up next'}</h2>${recs.slice(0, firstVisit ? 2 : 4).map((r) => recCard(r)).join('')}` : ''}
        <div class="tile-row">
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
          <div class="seg" role="radiogroup" aria-label="Tier">
            <button type="button" data-tier="foundation" class="${state.settings.tier === 'foundation' ? 'on' : ''}" title="Hide Higher-only skills">Foundation</button>
            <button type="button" data-tier="higher" class="${state.settings.tier === 'higher' ? 'on' : ''}" title="Show everything">Higher</button>
          </div>
        </div>
      </div>
      <div class="legend">${['mastered', 'secure', 'progress', 'practice', 'new'].map((k) => `<span class="${STATUS[k].cls}"><i>${STATUS[k].icon}</i>${STATUS[k].label}</span>`).join('')}<span class="legend-grade">${gradeBadge(5)} typical grade</span><span><span class="tier-badge">H</span> Higher only</span></div>
      <div class="areas"></div>
    </section>`;
  renderAreas(root.querySelector('.areas'));
  root.querySelector('.search').addEventListener('input', (e) => { searchTerm = e.target.value; renderAreas(root.querySelector('.areas')); });
  root.querySelectorAll('[data-tier]').forEach((b) => b.addEventListener('click', () => {
    state.settings.tier = b.dataset.tier; save(); renderHome(root);
  }));
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
  }).join('') || '<p class="empty">No skills match your search.</p>';
  el.querySelectorAll('details.unit').forEach((d) => d.addEventListener('toggle', () => {
    if (d.open) openUnits.add(d.dataset.unit); else openUnits.delete(d.dataset.unit);
    sessionStorage.setItem('gcse_open_units', JSON.stringify([...openUnits]));
  }));
}

function unitCard(unit, term) {
  let skills = visibleUnitSkills(unit);
  if (term) skills = skills.filter((s) => `${s.title} ${s.summary} ${unit.title}`.toLowerCase().includes(term));
  if (!skills.length) return '';
  const sum = unitSummary(unit);
  const open = term || openUnits.has(unit.id);
  const check = sum.check;
  return `<details class="unit" data-unit="${unit.id}" ${open ? 'open' : ''}>
    <summary>
      <div class="unit-head">
        <span class="unit-title">${esc(unit.title)}</span>
        <span class="unit-blurb">${esc(unit.blurb)}</span>
      </div>
      <div class="unit-side">
        <span class="unit-grades">Grades ${sum.minGrade}–${sum.maxGrade}</span>
        <span class="dots">${sum.statuses.map((s) => `<i class="dot ${STATUS[s].cls}" title="${STATUS[s].label}"></i>`).join('')}</span>
        ${check ? `<span class="checked" title="Quick check taken">✓ checked</span>` : ''}
      </div>
    </summary>
    <div class="unit-body">
      <div class="unit-actions">
        <a class="btn small" href="#/check/${unit.id}">⏱ ${check ? 'Retake' : 'Take'} quick check</a>
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
  return `<li><a class="skill ${st.cls} ${ready ? '' : 'disabled'}" href="${ready ? `#/skill/${s.id}` : '#/'}" ${ready ? '' : 'aria-disabled="true" tabindex="-1"'}>
    ${gradeBadge(s.grade)}
    <span class="skill-main"><span class="skill-title">${esc(s.title)} ${higherBadge(s)}</span><span class="skill-sum">${esc(s.summary)}</span></span>
    <span class="skill-side">${st.icon ? `<span class="status ${st.cls}" title="${st.label}">${st.icon} <span class="status-label">${st.label}</span></span>` : ''}${p ? progressBar(p) : ready ? '' : '<span class="muted small">coming soon</span>'}</span>
  </a></li>`;
}
