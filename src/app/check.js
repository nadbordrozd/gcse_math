// Quick checks: a short adaptive test on one unit that maps out what is secure and where to start.
//
// Algorithm: the unit's skills are ordered by grade. We always test the undecided skill in the middle
// of what is still undecided. A correct answer marks that skill secure and infers that its in-unit
// prerequisites and anything two or more grades easier are secure too; a wrong answer (or "not learned
// yet") marks it for practice and infers that its in-unit dependents and anything two or more grades
// harder are not secure yet. So a 6-skill unit takes about 3–5 questions.
import { UNITS, UNIT, SKILL, GENERATORS_BY_SKILL, TUTORIALS_BY_SKILL, ancestors, descendants } from '../registry.js';
import { generateSafely } from '../core.js';
import { state, save, isMastered } from './state.js';
import { esc, gradeBadge, higherBadge, areaStyle, AREA, randomSeed, STATUS } from './ui.js';
import { mountQuestion } from './question.js';
import { visibleUnitSkills, hasQuestions, unitLevel, unitSummary } from './plan.js';

let run = null;

export function renderCheckPicker(root) {
  const areas = [...new Set(UNITS.map((u) => u.area))];
  root.innerHTML = `
    <section class="panel">
      <h1>⏱ Quick checks</h1>
      <p class="lead">Pick a topic. You'll get a few questions – usually 3 to 6 – that zoom in on where you are. Nothing is locked: the check just tells you what to practise first.</p>
      ${areas.map((a) => `
        <h2 class="area-mini" style="${areaStyle(a)}">${esc(AREA[a].title)}</h2>
        <div class="check-grid">${UNITS.filter((u) => u.area === a).map((u) => {
    const s = unitSummary(u);
    const n = s.skills.filter((sk) => hasQuestions(sk.id)).length;
    return `<a class="check-card ${n ? '' : 'disabled'}" style="${areaStyle(a)}" href="${n ? `#/check/${u.id}` : '#/check-pick'}">
            <b>${esc(u.title)}</b><span class="muted small">Grades ${s.minGrade}–${s.maxGrade} · ${n} skills</span>
            ${s.check ? `<span class="checked">✓ Level ${s.check.level ? `≈ grade ${s.check.level}` : 'just starting'}</span>` : '<span class="small">Not checked yet</span>'}
          </a>`;
  }).join('')}</div>`).join('')}
    </section>`;
}

export function renderCheck(root, unitId) {
  const unit = UNIT[unitId];
  if (!unit) { root.innerHTML = '<p class="empty">Topic not found.</p>'; return; }
  const skills = visibleUnitSkills(unit).filter((s) => hasQuestions(s.id)).sort((a, b) => a.grade - b.grade);
  if (!skills.length) { root.innerHTML = `<p class="empty">Questions for this topic are coming soon. <a href="#/">Back</a></p>`; return; }
  run = { unit, skills, status: {}, source: {}, asked: [], current: null };
  root.innerHTML = `
    <section class="panel narrow check" style="${areaStyle(unit.area)}">
      <nav class="crumbs"><a href="#/">Topics</a> › <a href="#/check-pick">Quick checks</a></nav>
      <h1>⏱ Quick check: ${esc(unit.title)}</h1>
      <p class="lead">${esc(unit.blurb)}</p>
      <ul class="check-intro">
        <li>About <b>${estimate(skills.length)} questions</b> – roughly 5 minutes.</li>
        <li>Each question tests a different skill. They adapt: get one right and you skip ahead; get one wrong and it eases off.</li>
        <li>If a question is on something you haven't learned yet, just press <b>“I haven't learned this”</b>. That's useful information, not a failure!</li>
      </ul>
      <button class="btn primary big start-btn">Start the check</button>
    </section>`;
  root.querySelector('.start-btn').addEventListener('click', () => {
    root.querySelector('.check').innerHTML = `
      <div class="check-top"><span class="check-title">${esc(unit.title)}</span><span class="check-count"></span></div>
      <div class="check-progress"></div>
      <div class="q-area"></div>
      <div class="next-bar" hidden><span class="delta"></span><button class="btn primary next-btn">Next →</button></div>`;
    root.querySelector('.next-btn').addEventListener('click', () => step(root));
    step(root);
  });
}

const estimate = (n) => (n <= 3 ? `${n}` : n <= 5 ? '3–4' : '4–6');

function undecided() { return run.skills.filter((s) => !run.status[s.id]); }

function step(root) {
  const left = undecided();
  if (!left.length) { finish(root); return; }
  const skill = left[Math.floor((left.length - 1) / 2)];
  const gens = GENERATORS_BY_SKILL[skill.id];
  const g = gens[Math.floor(Math.random() * gens.length)];
  const q = generateSafely(g, randomSeed(), { difficulty: 'medium' });
  run.current = { skill, q };
  root.querySelector('.next-bar').hidden = true;
  const n = run.asked.length + 1;
  root.querySelector('.check-count').textContent = `Question ${n}`;
  root.querySelector('.check-progress').innerHTML = `<div class="pips">${run.skills.map((s) => `<i class="pip ${run.status[s.id] ? `pip-${run.status[s.id]}` : ''} ${s.id === skill.id ? 'pip-now' : ''}" title="${esc(s.title)}"></i>`).join('')}</div>`;
  const ctl = mountQuestion(root.querySelector('.q-area'), q, {
    mode: state.settings.answerMode,
    hint: false,
    dontKnow: true,
    dontKnowLabel: "I haven't learned this",
    onAnswer: ({ outcome }) => {
      const good = outcome === 'correct';
      record(skill, good ? 'secure' : outcome === 'skip' ? 'new' : 'practice');
      run.asked.push({ skill: skill.id, outcome });
      const nb = root.querySelector('.next-bar');
      nb.hidden = false;
      nb.querySelector('.next-btn').textContent = undecided().length ? 'Next →' : 'See my results →';
      nb.querySelector('.next-btn').focus({ preventScroll: true });
    },
  });
  // Solutions start collapsed in a check so it stays quick.
  run.ctl = ctl;
  root.querySelector('.q-area .question').insertAdjacentHTML('afterbegin', `<div class="q-skill-tag">${gradeBadge(skill.grade)} ${esc(skill.title)} ${higherBadge(skill)}</div>`);
}

function record(skill, status) {
  run.status[skill.id] = status;
  run.source[skill.id] = 'tested';
  const inUnit = new Set(run.skills.map((s) => s.id));
  if (status === 'secure') {
    const anc = ancestors(skill.id);
    for (const s of run.skills) {
      if (run.status[s.id]) continue;
      if ((anc.has(s.id) && inUnit.has(s.id)) || s.grade <= skill.grade - 2) { run.status[s.id] = 'secure'; run.source[s.id] = 'inferred'; }
    }
  } else {
    const desc = descendants(skill.id);
    for (const s of run.skills) {
      if (run.status[s.id]) continue;
      if ((desc.has(s.id) && inUnit.has(s.id)) || s.grade >= skill.grade + 2) { run.status[s.id] = status === 'new' ? 'new' : 'practice'; run.source[s.id] = 'inferred'; }
    }
  }
}

function finish(root) {
  const { unit, skills, status, source } = run;
  const now = Date.now();
  for (const s of skills) {
    if (isMastered(s.id)) continue;
    const st = status[s.id];
    // An inferred "not yet" should not overwrite a skill the learner has already shown elsewhere.
    if (source[s.id] === 'inferred' && st !== 'secure' && state.assess[s.id]?.status === 'secure' && state.assess[s.id]?.source !== 'inferred') continue;
    state.assess[s.id] = { status: st, source: source[s.id], at: now };
  }
  const level = unitLevel(unit);
  state.checks[unit.id] = { at: now, level, results: { ...status } };
  save();
  const start = skills.find((s) => status[s.id] !== 'secure' && !isMastered(s.id));
  const rows = skills.map((s) => {
    const st = isMastered(s.id) ? 'mastered' : status[s.id];
    const label = { secure: source[s.id] === 'tested' ? 'Secure – you got it right' : 'Probably fine (skipped)', practice: source[s.id] === 'tested' ? 'Practise this' : 'Practise this (follows on from one you missed)', new: 'Not learned yet', mastered: 'Mastered' }[st];
    const tut = (st === 'new' || st === 'practice') && TUTORIALS_BY_SKILL[s.id]?.[0];
    return `<li class="${STATUS[st === 'secure' ? 'secure' : st].cls}"><a href="#/skill/${s.id}">${gradeBadge(s.grade)} <span>${esc(s.title)}</span></a><span class="res">${tut ? `<a class="small" href="#/learn/${tut.id}">📖 Learn it</a> · ` : ''}${STATUS[st === 'secure' ? 'secure' : st].icon} ${label}</span></li>`;
  }).join('');
  const correct = run.asked.filter((a) => a.outcome === 'correct').length;
  root.querySelector('.check').innerHTML = `
    <nav class="crumbs"><a href="#/">Topics</a> › <a href="#/check-pick">Quick checks</a></nav>
    <h1>Results: ${esc(unit.title)}</h1>
    <p class="lead">You answered ${correct} of ${run.asked.length} correctly. ${level ? `You look secure up to about <b>grade ${level}</b> in this topic.` : 'This topic looks fairly new to you – a great place to start.'}</p>
    ${start ? `<a class="btn primary big" href="#/skill/${start.id}">Start practising: ${esc(start.title)} →</a>` : '<p>🎉 Everything in this topic looks secure! Try mixed practice or another topic.</p>'}
    <ol class="check-results">${rows}</ol>
    <p class="muted small">Your study plan has been updated. A single question can't tell everything – if something marked “probably fine” feels shaky, practise it anyway.</p>
    <div class="btn-row"><a class="btn" href="#/check-pick">Check another topic</a><a class="btn" href="#/plan">See study plan</a></div>`;
  run = null;
}

export function checkKey(e) {
  if (!run?.ctl) return false;
  if (run.ctl.key(e)) return true;
  const next = document.querySelector('.next-bar:not([hidden]) .next-btn');
  if (next && (e.key === 'Enter' || e.key === ' ') && document.activeElement?.tagName !== 'INPUT') { next.click(); return true; }
  return false;
}
void SKILL;
