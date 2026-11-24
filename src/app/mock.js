// Mock exams: a timed paper of mixed questions, easiest first, marked at the end.
import { SKILLS, SKILL, GENERATORS_BY_SKILL } from '../registry.js';
import { generateSafely, checkTyped } from '../core.js';
import { state, save } from './state.js';
import { esc, math, gradeBadge, areaStyle, AREA, randomSeed, typedHelp } from './ui.js';
import { questionBodyHTML, solutionHTML } from './question.js';
import { hasQuestions } from './plan.js';

// Approximate share of marks by content area in the real papers.
const WEIGHTS = {
  foundation: { number: 25, algebra: 20, ratio: 25, geometry: 15, probability: 7, statistics: 8 },
  higher: { number: 15, algebra: 30, ratio: 20, geometry: 20, probability: 7, statistics: 8 },
};
// Rough grade boundaries as a percentage of marks (based on typical recent boundaries).
const BOUNDARIES = {
  foundation: [[5, 72], [4, 55], [3, 40], [2, 25], [1, 12]],
  higher: [[9, 80], [8, 66], [7, 51], [6, 38], [5, 25], [4, 13], [3, 8]],
};
const LENGTHS = { short: { n: 10, minutes: 15, label: 'Short – 10 questions, 15 minutes' }, half: { n: 20, minutes: 40, label: 'Half paper – 20 questions, 40 minutes' }, full: { n: 30, minutes: 75, label: 'Full paper – 30 questions, 75 minutes' } };
const marksFor = (grade) => 1 + Math.floor(grade / 3);

let exam = null;
let timer = null;

export function renderMockSetup(root) {
  clearInterval(timer);
  const last = state.mocks.slice(-5).reverse();
  const tier = state.settings.tier;
  root.innerHTML = `
    <section class="panel narrow mock-setup">
      <h1>📝 Mock exam</h1>
      <p class="lead">A paper of exam-style questions across all topics, easiest first, like the real thing. Answers are marked at the end, with full solutions.</p>
      <p class="muted small">Real papers have longer, multi-step questions where you show working. These are single-answer versions of the same skills, so treat the grade estimate as a rough guide.</p>
      <form class="mock-form">
        <fieldset><legend>Tier</legend>
          <label><input type="radio" name="tier" value="foundation" ${tier === 'foundation' ? 'checked' : ''}> Foundation <span class="muted small">(grades 1–5)</span></label>
          <label><input type="radio" name="tier" value="higher" ${tier === 'higher' ? 'checked' : ''}> Higher <span class="muted small">(grades 4–9)</span></label>
        </fieldset>
        <fieldset><legend>Paper</legend>
          <label><input type="radio" name="paper" value="noncalc" checked> Non-calculator</label>
          <label><input type="radio" name="paper" value="calc"> Calculator allowed</label>
        </fieldset>
        <fieldset><legend>Length</legend>
          ${Object.entries(LENGTHS).map(([k, v], i) => `<label><input type="radio" name="length" value="${k}" ${i === 0 ? 'checked' : ''}> ${v.label}</label>`).join('')}
        </fieldset>
        <fieldset><legend>Options</legend>
          <label><input type="checkbox" name="timed" checked> Show a countdown timer</label>
        </fieldset>
        <button class="btn primary big" type="submit">Start the paper</button>
      </form>
      ${last.length ? `<h2>Previous papers</h2><table class="qtable history"><tr><th>Date</th><th>Paper</th><th>Score</th><th>Estimate</th></tr>${last.map((m) => `<tr><td>${new Date(m.at).toLocaleDateString('en-GB')}</td><td>${m.tier === 'higher' ? 'Higher' : 'Foundation'}, ${m.paper === 'calc' ? 'calculator' : 'non-calculator'}, ${m.n} q</td><td>${m.score}/${m.total} (${Math.round((100 * m.score) / m.total)}%)</td><td>${m.grade ? `grade ${m.grade}` : 'below grade 1'}</td></tr>`).join('')}</table>` : ''}
    </section>`;
  root.querySelector('.mock-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    startExam(root, { tier: f.get('tier'), paper: f.get('paper'), length: f.get('length'), timed: f.get('timed') === 'on' });
  });
}

function weightedPick(weights) {
  const entries = Object.entries(weights).filter(([, w]) => w > 0);
  let r = Math.random() * entries.reduce((t, [, w]) => t + w, 0);
  for (const [k, w] of entries) { r -= w; if (r <= 0) return k; }
  return entries[0][0];
}

function buildPaper({ tier, paper, length }) {
  const n = LENGTHS[length].n;
  const pool = SKILLS.filter((s) => hasQuestions(s.id) && (tier === 'foundation' ? !s.higher : s.grade >= 3));
  const [gLo, gHi] = tier === 'foundation' ? [1, 5] : [4, 9];
  const used = new Set();
  const questions = [];
  for (let i = 0; i < n * 4 && questions.length < n; i += 1) {
    const k = questions.length;
    const target = gLo + ((gHi - gLo) * k) / Math.max(1, n - 1);
    const area = weightedPick(WEIGHTS[tier]);
    const candidates = pool.filter((s) => s.area === area && !used.has(s.id) && Math.abs(s.grade - target) <= 1.5);
    if (!candidates.length) continue;
    const skill = candidates[Math.floor(Math.random() * candidates.length)];
    const gens = GENERATORS_BY_SKILL[skill.id];
    let q = null;
    for (let t = 0; t < 12 && !q; t += 1) {
      const g = gens[Math.floor(Math.random() * gens.length)];
      const difficulty = skill.grade < target - 0.5 ? 'hard' : skill.grade > target + 0.5 ? 'easy' : 'medium';
      const cand = generateSafely(g, randomSeed(), { difficulty });
      if (paper === 'noncalc' && cand.calculator) continue;
      q = cand;
    }
    if (!q) continue;
    used.add(skill.id);
    questions.push({ q, skill, marks: marksFor(skill.grade), response: null, flagged: false });
  }
  questions.sort((a, b) => a.skill.grade - b.skill.grade);
  return questions;
}

function startExam(root, cfg) {
  const questions = buildPaper(cfg);
  exam = { ...cfg, questions, index: 0, start: Date.now(), minutes: LENGTHS[cfg.length].minutes, finished: false };
  root.innerHTML = `
    <section class="exam">
      <header class="exam-head">
        <span class="exam-title">${cfg.tier === 'higher' ? 'Higher' : 'Foundation'} · ${cfg.paper === 'calc' ? 'Calculator' : 'Non-calculator'}</span>
        <span class="exam-timer" ${cfg.timed ? '' : 'hidden'}></span>
        <button class="btn small finish-exam">Finish &amp; mark</button>
      </header>
      <nav class="palette"></nav>
      <div class="exam-q"></div>
      <div class="exam-nav">
        <button class="btn prev">← Previous</button>
        <button class="btn ghost flag">⚑ Flag for review</button>
        <button class="btn primary next">Next →</button>
      </div>
    </section>`;
  root.querySelector('.prev').addEventListener('click', () => go(root, exam.index - 1));
  root.querySelector('.next').addEventListener('click', () => go(root, exam.index + 1));
  root.querySelector('.flag').addEventListener('click', () => { const item = exam.questions[exam.index]; item.flagged = !item.flagged; drawPalette(root); drawFlag(root); });
  root.querySelector('.finish-exam').addEventListener('click', () => {
    const unanswered = exam.questions.filter((x) => x.response === null || x.response === '').length;
    if (unanswered && !confirm(`You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}. Finish and mark the paper anyway?`)) return;
    markExam(root);
  });
  if (cfg.timed) {
    const tick = () => {
      const left = exam.minutes * 60 - Math.floor((Date.now() - exam.start) / 1000);
      const el = root.querySelector('.exam-timer');
      if (!el) { clearInterval(timer); return; }
      el.textContent = `⏱ ${Math.floor(Math.max(0, left) / 60)}:${String(Math.max(0, left) % 60).padStart(2, '0')}`;
      el.classList.toggle('low', left < 300);
      if (left <= 0) { clearInterval(timer); alert("Time's up! Your paper will now be marked."); markExam(root); }
    };
    tick();
    timer = setInterval(tick, 1000);
  }
  go(root, 0);
}

function drawPalette(root) {
  root.querySelector('.palette').innerHTML = exam.questions.map((x, i) => `<button class="pal ${i === exam.index ? 'now' : ''} ${x.response !== null && x.response !== '' ? 'done' : ''} ${x.flagged ? 'flagged' : ''}" data-i="${i}" title="Question ${i + 1}">${i + 1}</button>`).join('');
  root.querySelectorAll('.pal').forEach((b) => b.addEventListener('click', () => go(root, Number(b.dataset.i))));
}
function drawFlag(root) { root.querySelector('.flag').textContent = exam.questions[exam.index].flagged ? '⚑ Flagged' : '⚑ Flag for review'; }

function go(root, i) {
  if (i < 0 || i >= exam.questions.length) return;
  exam.index = i;
  const item = exam.questions[i];
  const { q } = item;
  const typed = Boolean(q.typed);
  root.querySelector('.exam-q').innerHTML = `
    <article class="question">
      ${questionBodyHTML(q, { number: i + 1, marks: item.marks })}
      ${typed ? `<div class="typed"><input type="text" class="typed-input" aria-label="Your answer" placeholder="Your answer" value="${esc(item.response ?? '')}" spellcheck="false" autocomplete="off"><p class="typed-help">${esc(typedHelp(q.typed))}</p></div>`
    : `<div class="options">${q.options.map((o) => `<button type="button" class="option ${item.response === o.id ? 'selected' : ''}" data-id="${o.id}"><span class="opt-key">${o.id}</span><span class="opt-text">${math(o.text)}</span></button>`).join('')}</div>`}
    </article>`;
  root.querySelectorAll('.exam-q .option').forEach((b) => b.addEventListener('click', () => {
    item.response = item.response === b.dataset.id ? null : b.dataset.id;
    root.querySelectorAll('.exam-q .option').forEach((o) => o.classList.toggle('selected', o.dataset.id === item.response));
    drawPalette(root);
  }));
  const input = root.querySelector('.exam-q .typed-input');
  if (input) {
    input.addEventListener('input', () => { item.response = input.value; drawPalette(root); });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(root, exam.index + 1); });
    setTimeout(() => input.focus({ preventScroll: true }), 30);
  }
  root.querySelector('.prev').disabled = i === 0;
  root.querySelector('.next').textContent = i === exam.questions.length - 1 ? 'Last question' : 'Next →';
  root.querySelector('.next').disabled = i === exam.questions.length - 1;
  drawPalette(root);
  drawFlag(root);
  window.scrollTo({ top: 0 });
}

function markExam(root) {
  clearInterval(timer);
  const items = exam.questions.map((x) => {
    const correct = x.q.typed ? checkTyped(x.q.typed, x.response ?? '') : x.response === x.q.answer;
    return { ...x, correct };
  });
  const total = items.reduce((t, x) => t + x.marks, 0);
  const score = items.reduce((t, x) => t + (x.correct ? x.marks : 0), 0);
  const pct = total ? (100 * score) / total : 0;
  const grade = (BOUNDARIES[exam.tier].find(([, p]) => pct >= p) || [0])[0];
  const minutes = Math.round((Date.now() - exam.start) / 60000);
  state.mocks.push({ at: Date.now(), tier: exam.tier, paper: exam.paper, n: items.length, score, total, grade, minutes });
  save();
  const byArea = {};
  for (const x of items) {
    const a = (byArea[x.skill.area] ||= { got: 0, total: 0 });
    a.total += x.marks; if (x.correct) a.got += x.marks;
  }
  const weak = [...new Map(items.filter((x) => !x.correct).map((x) => [x.skill.id, x.skill])).values()];
  root.innerHTML = `
    <section class="panel results">
      <h1>Paper marked</h1>
      <div class="stats">
        <div class="stat"><b>${score}<small>/${total}</small></b><span>marks</span></div>
        <div class="stat"><b>${Math.round(pct)}%</b><span>score</span></div>
        <div class="stat"><b>${grade || '–'}</b><span>rough grade</span></div>
        <div class="stat"><b>${minutes}</b><span>minutes</span></div>
      </div>
      <p class="muted small">The grade is a rough estimate using typical grade boundaries. These questions are single-answer, so the real exam (with method marks and longer questions) may feel different.</p>
      <h2>By topic area</h2>
      <div class="area-bars">${Object.entries(byArea).map(([a, v]) => `<div class="area-bar" style="${areaStyle(a)}"><span>${esc(AREA[a].short || AREA[a].title)}</span><div class="bar"><span style="width:${(100 * v.got) / v.total}%"></span></div><span>${v.got}/${v.total}</span></div>`).join('')}</div>
      ${weak.length ? `<h2>Practise next</h2><div class="chips">${weak.map((s) => `<a class="chip" href="#/skill/${s.id}" style="${areaStyle(s.area)}">${gradeBadge(s.grade)} ${esc(s.title)}</a>`).join('')}</div>` : '<p>🎉 Full marks – amazing!</p>'}
      <h2>Review your answers</h2>
      <ol class="review">${items.map((x, i) => reviewItem(x, i)).join('')}</ol>
      <div class="btn-row"><a class="btn primary" href="#/mock" onclick="setTimeout(()=>location.reload())">Another paper</a><a class="btn" href="#/">Back to topics</a></div>
    </section>`;
  exam = null;
}

function reviewItem(x, i) {
  const { q } = x;
  const yours = x.response === null || x.response === '' ? '<i>no answer</i>'
    : q.typed ? esc(x.response) : math(q.options.find((o) => o.id === x.response)?.text ?? '');
  return `<li class="review-item ${x.correct ? 'good' : 'bad'}">
    <details>
      <summary><span class="ri-mark">${x.correct ? '✓' : '✗'}</span> <span class="ri-n">Q${i + 1}</span> <span class="ri-skill">${esc(x.skill.title)}</span> <span class="ri-marks">${x.correct ? x.marks : 0}/${x.marks}</span></summary>
      <div class="question">${questionBodyHTML(q, { number: i + 1, marks: x.marks })}
        <p>Your answer: ${yours}</p><p>Correct answer: ${math(q.answerText)}</p>
        ${solutionHTML(q)}
        <a class="btn small" href="#/skill/${x.skill.id}">Practise ${esc(x.skill.title)} →</a>
      </div>
    </details>
  </li>`;
}

export const examActive = () => Boolean(exam && !exam.finished);
void SKILL;
