// "Learn" pages: short tutorials linked into a graph, plus an index of them.
import { AREAS, UNITS, SKILL, TUTORIALS, TUTORIAL, resolveTutorial, tutorialDependents, GENERATORS_BY_SKILL } from '../registry.js';
import { generateSafely } from '../core.js';
import { state, save, points } from './state.js';
import { esc, math, gradeBadge, higherBadge, areaStyle, AREA, STATUS, randomSeed } from './ui.js';
import { mountQuestion } from './question.js';
import { isSecure, hasQuestions } from './plan.js';
import { skillStatus } from './state.js';
import { syncAchievements } from './awards.js';
import { backButtonHTML } from './trail.js';

let tryCtl = null;
let searchTerm = '';

/** Unit a tutorial belongs to: the unit of its first skill. */
const unitOf = (t) => SKILL[t.skills?.[0]]?.unit;
const gradeOf = (t) => Math.min(...(t.skills || []).map((s) => SKILL[s]?.grade ?? 9));

const readCount = () => Object.keys(state.read || {}).length;

function tutorialCard(t) {
  const area = SKILL[t.skills?.[0]]?.area;
  const read = state.read?.[t.id];
  return `<a class="learn-card ${read ? 'read' : ''}" href="#/learn/${t.id}" style="${areaStyle(area)}">
    ${gradeBadge(gradeOf(t))}<span class="lc-main"><b>${esc(t.title)}</b><small>${esc(t.summary || '')}</small></span>${read ? '<span class="lc-read" title="You have opened this page">✓</span>' : ''}
  </a>`;
}

export function renderLearnIndex(root) {
  root.innerHTML = `
    <section class="panel learn-index">
      <h1>📖 Learn</h1>
      <p class="lead">Short explanations of every topic, each with worked examples and a question to try. Pages link to the ideas they build on, so if something is new you can always step back.</p>
      <div class="catalogue-tools"><input type="search" class="search" placeholder="Search… e.g. sine rule, ratio" value="${esc(searchTerm)}" aria-label="Search the Learn pages"><span class="muted small">${TUTORIALS.length} pages · ${readCount()} opened</span></div>
      <div class="learn-areas"></div>
    </section>`;
  const draw = () => {
    const term = searchTerm.trim().toLowerCase();
    const match = (t) => !term || `${t.title} ${t.summary} ${(t.skills || []).map((s) => SKILL[s]?.title).join(' ')}`.toLowerCase().includes(term);
    root.querySelector('.learn-areas').innerHTML = AREAS.map((area) => {
      const units = UNITS.filter((u) => u.area === area.id).map((u) => {
        const ts = TUTORIALS.filter((t) => unitOf(t) === u.id && match(t)).sort((a, b) => gradeOf(a) - gradeOf(b));
        return ts.length ? `<div class="learn-unit"><h3>${esc(u.title)}</h3><div class="learn-grid">${ts.map(tutorialCard).join('')}</div></div>` : '';
      }).join('');
      return units ? `<section class="area" style="${areaStyle(area.id)}"><h2 class="area-title"><span class="area-icon">${esc(area.icon)}</span>${esc(area.title)}</h2>${units}</section>` : '';
    }).join('') || '<p class="empty">No pages match your search.</p>';
  };
  root.querySelector('.search').addEventListener('input', (e) => { searchTerm = e.target.value; draw(); });
  draw();
}

function prereqList(t) {
  const items = (t.prereqs || []).map((id) => {
    const pt = resolveTutorial(id);
    const skillId = SKILL[id] ? id : pt?.skills?.[0];
    const secure = skillId && isSecure(skillId);
    if (!pt) return '';
    return `<li class="${secure ? 'ok' : ''}"><a href="#/learn/${pt.id}">${esc(pt.title)}</a>${secure ? ' <span class="status st-secure" title="You look secure in this">✓</span>' : ''}</li>`;
  }).filter(Boolean);
  return items.length ? `<div class="t-before"><b>Before you start</b> – this page builds on:<ul>${items.join('')}</ul></div>` : '';
}

export function renderTutorial(root, id) {
  const t = TUTORIAL[id] || resolveTutorial(id);
  if (!t) { root.innerHTML = '<p class="empty">Page not found. <a href="#/learn">All Learn pages</a></p>'; return; }
  if (t.id !== id) { history.replaceState(null, '', `#/learn/${t.id}`); }
  state.read = state.read || {};
  state.read[t.id] = Date.now();
  save();
  syncAchievements();
  const skills = (t.skills || []).map((s) => SKILL[s]).filter(Boolean);
  const main = skills[0];
  const unit = UNITS.find((u) => u.id === main?.unit);
  const next = tutorialDependents(t.id).sort((a, b) => gradeOf(a) - gradeOf(b));
  const practiceButtons = skills.filter((s) => hasQuestions(s.id)).map((s) => `<a class="btn primary" href="#/skill/${s.id}">Practise: ${esc(s.title)} →</a>`).join('');
  root.innerHTML = `
    <article class="panel tutorial" style="${areaStyle(main?.area)}">
      <nav class="crumbs"><a href="#/learn">Learn</a>${unit ? ` › ${esc(AREA[unit.area]?.short || AREA[unit.area]?.title)} › ${esc(unit.title)}` : ''}</nav>
      <header class="t-head">
        <h1>${esc(t.title)}</h1>
        <p class="lead">${math(t.summary || '')}</p>
        <div class="t-skills">${skills.map((s) => `<span class="t-skill">${gradeBadge(s.grade)} ${esc(s.title)} ${higherBadge(s)}</span>`).join('')}</div>
      </header>
      ${prereqList(t)}
      <div class="t-body">${math(t.body)}</div>
      ${main && hasQuestions(main.id) ? `
        <section class="t-try">
          <h2>Try one</h2>
          <div class="q-area"></div>
          <div class="btn-row"><button class="btn another">Another question</button>${practiceButtons}</div>
        </section>` : (practiceButtons ? `<div class="btn-row">${practiceButtons}</div>` : '')}
      ${next.length ? `<section class="t-next"><h2>Where next?</h2><div class="learn-grid">${next.map(tutorialCard).join('')}</div></section>` : ''}
      ${backButtonHTML() ? `<div class="back-bar bottom">${backButtonHTML('primary')}</div>` : ''}
    </article>`;
  if (main && hasQuestions(main.id)) {
    const tryOne = () => {
      const gens = GENERATORS_BY_SKILL[main.id];
      const g = gens[Math.floor(Math.random() * gens.length)];
      const q = generateSafely(g, randomSeed(), { difficulty: points(main.id) > 50 ? 'medium' : 'easy' });
      tryCtl = mountQuestion(root.querySelector('.t-try .q-area'), q, { mode: state.settings.answerMode, dontKnow: false, learn: false });
    };
    root.querySelector('.another').addEventListener('click', tryOne);
    tryOne();
  }
}

export function learnKey(e) {
  return tryCtl ? tryCtl.key(e) : false;
}
void STATUS; void skillStatus;
