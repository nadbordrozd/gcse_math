// Practice sessions: one skill (#/skill/<id>) or mixed review (#/mixed).
import { SKILL, UNIT, GENERATORS_BY_SKILL, GENERATOR, DEPENDENTS, TUTORIALS_BY_SKILL } from '../registry.js';
import { generateSafely } from '../core.js';
import { state, save, points, recordAnswer, difficultyFor, skillStatus, MASTERY_POINTS, CORRECT_POINTS, HINT_POINTS } from './state.js';
import { esc, gradeBadge, higherBadge, progressBar, STATUS, areaStyle, AREA, isDev, randomSeed, toast } from './ui.js';
import { mountQuestion } from './question.js';
import { playSound } from './sounds.js';
import { celebrateMastery, celebrating, syncAchievements } from './awards.js';
import { visibleSkills, hasQuestions, isSecure, readyToLearn, todoSkills } from './plan.js';
import { markToggleHTML } from './marks.js';

let session = null;

function pickArchetype(skillId, avoid) {
  const gens = GENERATORS_BY_SKILL[skillId] || [];
  if (!gens.length) return null;
  if (session?.forceArchetype && GENERATOR[session.forceArchetype]?.skillId === skillId) return GENERATOR[session.forceArchetype];
  const rec = state.skills[skillId]?.archetypes || {};
  // Prefer archetypes seen least; never the same one twice in a row when there is a choice.
  const pool = gens.filter((g) => gens.length === 1 || g.id !== avoid);
  const weights = pool.map((g) => 1 / (1 + (rec[g.id]?.a || 0) * 0.35));
  let r = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i += 1) { r -= weights[i]; if (r <= 0) return pool[i]; }
  return pool[pool.length - 1];
}

function mixedPool(todo = session?.todo) {
  if (todo) return todoSkills().filter((s) => hasQuestions(s.id));
  let pool = visibleSkills().filter((s) => hasQuestions(s.id) && (points(s.id) > 0 || isSecure(s.id)));
  if (pool.length < 4) pool = [...pool, ...readyToLearn().slice(0, 6 - pool.length)];
  return pool;
}
function pickMixedSkill() {
  const pool = mixedPool();
  if (!pool.length) return null;
  const now = Date.now();
  // Weight towards skills not seen for a while and not yet mastered.
  const weights = pool.map((s) => {
    const r = state.skills[s.id];
    const days = r?.lastSeen ? (now - r.lastSeen) / 864e5 : 3;
    return (1 + Math.min(days, 14)) * (points(s.id) >= MASTERY_POINTS ? 0.6 : 1) * (s.id === session?.lastSkill ? 0.15 : 1);
  });
  let x = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i += 1) { x -= weights[i]; if (x <= 0) return pool[i]; }
  return pool[0];
}

export function renderPractice(root, skillId, { todo = false } = {}) {
  const mixed = skillId === null;
  const skill = mixed ? null : SKILL[skillId];
  if (!mixed && !skill) { root.innerHTML = '<p class="empty">Skill not found. <a href="#/">Back to topics</a></p>'; return; }
  if (!mixed && !hasQuestions(skillId)) { root.innerHTML = `<p class="empty">Questions for “${esc(skill.title)}” are coming soon. <a href="#/">Back to topics</a></p>`; return; }
  if (mixed && todo && !mixedPool(true).length) {
    root.innerHTML = '<section class="panel narrow"><h1>📌 To-do practice</h1><p>Your to-do list is empty. Mark skills with 📌 on the Topics page, or take a quick check.</p><a class="btn primary" href="#/">Choose a topic</a></section>';
    return;
  }
  if (mixed && !todo && !mixedPool(false).length) {
    root.innerHTML = '<section class="panel narrow"><h1>Mixed practice</h1><p>Mixed practice reviews skills you have already started. Practise a few topics first (or take a quick check), then come back!</p><a class="btn primary" href="#/">Choose a topic</a></section>';
    return;
  }
  session = { skillId, mixed, todo: mixed && todo, answered: 0, correct: 0, streak: 0, best: 0, gained: 0, lastArchetype: null, lastSkill: null, forceArchetype: session?.skillId === skillId ? session.forceArchetype : null, current: null, ctl: null };
  const unit = skill ? UNIT[skill.unit] : null;
  root.innerHTML = `
    <section class="practice" style="${skill ? areaStyle(skill.area) : ''}">
      <header class="practice-head">
        <nav class="crumbs"><a href="#/">Topics</a>${unit ? ` › <a href="#/topic/${unit.id}">${esc(unit.title)}</a>` : ''}</nav>
        <div class="practice-title">
          ${mixed ? (todo ? '<h1>📌 To-do practice</h1><p class="muted">Questions from everything on your <a href="#/todo">to-do list</a>.</p>' : '<h1>🔀 Mixed practice</h1><p class="muted">Questions from skills you have started – great for keeping them fresh.</p>')
    : `<div class="practice-mark">${markToggleHTML(skill.id)}</div><h1>${gradeBadge(skill.grade)} ${esc(skill.title)} ${higherBadge(skill)}</h1><p class="muted">${esc(skill.summary)}</p>${(TUTORIALS_BY_SKILL[skill.id] || []).slice(0, 2).map((t) => `<a class="btn small learn-btn" href="#/learn/${t.id}">📖 Learn: ${esc(t.title)}</a>`).join(' ')}`}
        </div>
        ${mixed ? '' : `<div class="skill-progress">
          <div class="sp-row"><span class="sp-status"></span><span class="sp-points"></span><span class="sp-level"></span></div>
          <div class="sp-bar"></div>
        </div>`}
      </header>
      ${isDev() && !mixed ? devPanel(skillId) : ''}
      <div class="q-area"></div>
      <div class="next-bar" hidden>
        <span class="delta"></span>
        <button type="button" class="btn ghost flag-btn" title="Report a problem with this question">⚑ Report</button>
        <button type="button" class="btn keep-btn" hidden>Keep practising</button>
        <button type="button" class="btn primary next-btn">Next question →</button>
      </div>
      <footer class="session-bar">
        <span class="sess-stats"></span>
        <span class="spacer"></span>
        ${mixed ? '' : relatedLinks(skill)}
        <button type="button" class="btn ghost finish-btn">Finish</button>
      </footer>
    </section>`;
  root.querySelector('.next-btn').addEventListener('click', () => {
    if (session.returnTo) backToTopic(session.returnTo); else nextQuestion(root);
  });
  root.querySelector('.keep-btn').addEventListener('click', () => { session.returnTo = null; nextQuestion(root); });
  root.querySelector('.finish-btn').addEventListener('click', () => finishSession(root));
  root.querySelector('.flag-btn').addEventListener('click', (e) => flagCurrent(e.currentTarget));
  root.querySelector('.dev-arch')?.addEventListener('change', (e) => { session.forceArchetype = e.target.value || null; nextQuestion(root); });
  updateHeader(root);
  nextQuestion(root);
}

function devPanel(skillId) {
  const gens = GENERATORS_BY_SKILL[skillId] || [];
  return `<div class="dev-panel"><label>Question type (dev): <select class="dev-arch"><option value="">All types (mixed)</option>${gens.map((g) => `<option value="${g.id}" ${session?.forceArchetype === g.id ? 'selected' : ''}>${esc(g.title || g.id)}</option>`).join('')}</select></label> <span class="muted small">Press X to skip with points · difficulty follows points</span> <select class="dev-diff"><option value="">auto</option><option>easy</option><option>medium</option><option>hard</option></select></div>`;
}

function relatedLinks(skill) {
  const link = (s) => `<a href="#/skill/${s.id}" class="${STATUS[skillStatus(s.id)].cls}">${esc(s.title)}</a>`;
  const pre = skill.prereqs.map((id) => SKILL[id]).filter((s) => s && hasQuestions(s.id));
  const next = (DEPENDENTS[skill.id] || []).map((id) => SKILL[id]).filter((s) => s && hasQuestions(s.id)).slice(0, 4);
  return `<span class="related">${pre.length ? `Builds on: ${pre.map(link).join(', ')}` : ''}${pre.length && next.length ? '<br>' : ''}${next.length ? `Leads to: ${next.map(link).join(', ')}` : ''}</span>`;
}

function updateHeader(root) {
  const s = session;
  root.querySelector('.sess-stats').innerHTML = `This session: <b>${s.correct}</b>/${s.answered} correct${s.streak >= 3 ? ` · 🔥 ${s.streak} in a row` : ''}`;
  if (s.mixed) return;
  const p = points(s.skillId);
  const st = STATUS[skillStatus(s.skillId)];
  root.querySelector('.sp-status').innerHTML = st.icon ? `<span class="status ${st.cls}">${st.icon} ${st.label}</span>` : '<span class="status">Not started</span>';
  root.querySelector('.sp-points').textContent = `${p} / ${MASTERY_POINTS} points`;
  const level = difficultyFor(s.skillId);
  root.querySelector('.sp-level').innerHTML = `<span class="level level-${level}" title="Questions get harder as your points go up">${{ easy: 'Level 1 · warm-up', medium: 'Level 2 · standard', hard: 'Level 3 · challenge' }[level]}</span>`;
  root.querySelector('.sp-bar').innerHTML = progressBar(p, MASTERY_POINTS, 'big');
}

function nextQuestion(root) {
  const s = session;
  const skillId = s.mixed ? pickMixedSkill()?.id : s.skillId;
  if (!skillId) return;
  const g = pickArchetype(skillId, s.lastArchetype);
  const devDiff = root.querySelector('.dev-diff')?.value;
  const difficulty = devDiff || difficultyFor(skillId);
  let q;
  try { q = generateSafely(g, randomSeed(), { difficulty }); } catch (e) {
    console.error(e);
    root.querySelector('.q-area').innerHTML = `<p class="empty">Sorry – this question type failed to generate (${esc(g.id)}). <button class="btn" onclick="location.reload()">Try again</button></p>`;
    return;
  }
  s.current = q; s.lastArchetype = g.id; s.lastSkill = skillId;
  root.querySelector('.next-bar').hidden = true;
  root.querySelector('.keep-btn').hidden = true;
  root.querySelector('.next-btn').textContent = 'Next question →';
  const area = root.querySelector('.q-area');
  const skill = SKILL[skillId];
  if (s.mixed) area.dataset.skill = skillId;
  s.ctl = mountQuestion(area, q, {
    mode: state.settings.answerMode,
    dontKnow: true,
    onAnswer: ({ outcome }) => answered(root, q, outcome),
  });
  if (s.mixed) {
    area.querySelector('.q-meta').insertAdjacentHTML('afterbegin', `<a class="q-skill" href="#/skill/${skill.id}" style="${areaStyle(skill.area)}">${gradeBadge(skill.grade)} ${esc(skill.title)}</a>`);
  }
  if (isDev()) area.querySelector('.q-meta').insertAdjacentHTML('beforeend', `<span class="muted small dev-id">${esc(q.archetype_id)} · ${q.difficulty} · seed ${q.seed}</span>`);
  window.scrollTo({ top: Math.min(window.scrollY, root.querySelector('.q-area').offsetTop - 80), behavior: 'smooth' });
}

function answered(root, q, outcome) {
  const s = session;
  const before = points(q.skill_id);
  const { delta, mastered, first } = recordAnswer(q.skill_id, q.archetype_id, outcome);
  const good = outcome === 'correct' || outcome === 'hint';
  if (!mastered && outcome !== 'skip') playSound(good ? 'correct' : 'wrong');
  s.answered += 1;
  if (good) { s.correct += 1; s.streak += 1; s.best = Math.max(s.best, s.streak); } else s.streak = 0;
  s.gained += delta;
  const nb = root.querySelector('.next-bar');
  nb.hidden = false;
  const label = outcome === 'correct' ? `+${CORRECT_POINTS} points` : outcome === 'hint' ? `+${HINT_POINTS} points (hint used)` : delta < 0 ? `${delta} points` : before >= MASTERY_POINTS ? 'Mastered skills keep their star' : '';
  nb.querySelector('.delta').innerHTML = `<span class="${good ? 'pos' : 'neg'}">${label}</span>`;
  updateHeader(root);
  nb.querySelector('.next-btn').focus({ preventScroll: true });
  if (mastered) celebrate(root, SKILL[q.skill_id], first);
  else syncAchievements();
}

/** The first time a skill reaches 100 points the learner goes back to its topic to pick the next one. */
async function celebrate(root, skill, first) {
  const s = session;
  const choice = await celebrateMastery(skill, { first, mixed: s.mixed });
  if (choice === 'topic') { backToTopic(skill); return; }
  if (choice === 'stay' && first && !s.mixed && session === s) {
    s.returnTo = skill;
    const nb = root.querySelector('.next-bar');
    nb.hidden = false;
    nb.querySelector('.next-btn').textContent = `Back to ${UNIT[skill.unit].title} →`;
    nb.querySelector('.keep-btn').hidden = false;
    nb.querySelector('.next-btn').focus({ preventScroll: true });
  }
}

function backToTopic(skill) {
  location.hash = `#/topic/${skill.unit}/${skill.id}`;
}

function finishSession(root) {
  const s = session;
  if (!s.answered) { location.hash = '#/'; return; }
  const pct = Math.round((100 * s.correct) / s.answered);
  root.querySelector('.practice').innerHTML = `
    <section class="panel narrow summary">
      <h1>${pct >= 80 ? '🎉 Great session!' : pct >= 50 ? '👍 Good effort!' : '💪 Keep going!'}</h1>
      <div class="stats">
        <div class="stat"><b>${s.answered}</b><span>questions</span></div>
        <div class="stat"><b>${pct}%</b><span>correct</span></div>
        <div class="stat"><b>${s.best}</b><span>best streak</span></div>
        <div class="stat"><b>${s.gained >= 0 ? '+' : ''}${s.gained}</b><span>points</span></div>
      </div>
      <div class="btn-row">
        <a class="btn primary" href="#/">Back to topics</a>
        ${s.mixed ? `<a class="btn" href="#/mixed${s.todo ? '/todo' : ''}" onclick="location.reload()">More ${s.todo ? 'to-do' : 'mixed'} practice</a>` : `<a class="btn" href="#/skill/${s.skillId}" onclick="setTimeout(()=>location.reload())">Keep practising</a>`}
      </div>
    </section>`;
  session = null;
}

function flagCurrent(btn) {
  const q = session?.current;
  if (!q) return;
  const note = prompt('What looks wrong with this question? (optional)') ?? null;
  if (note === null) return;
  state.flagged.push({ archetype: q.archetype_id, seed: q.seed, difficulty: q.difficulty, note, at: new Date().toISOString() });
  save();
  btn.disabled = true;
  btn.textContent = '⚑ Reported';
  toast('Thanks – saved. You can see reports in Settings.');
}

export function practiceKey(e) {
  if (!session?.ctl || celebrating()) return false;
  if (session.ctl.key(e)) return true;
  const next = document.querySelector('.next-bar:not([hidden]) .next-btn');
  if (next && (e.key === 'Enter' || e.key === ' ') && document.activeElement?.tagName !== 'INPUT') { next.click(); return true; }
  if (isDev() && (e.key === 'x' || e.key === 'X') && !session.ctl.done && session.current) {
    const { mastered, first } = recordAnswer(session.current.skill_id, session.current.archetype_id, 'correct');
    session.answered += 1; session.correct += 1;
    updateHeader(document);
    if (mastered) celebrate(document, SKILL[session.current.skill_id], first);
    else { syncAchievements(); nextQuestion(document); }
    return true;
  }
  return false;
}
void AREA;
