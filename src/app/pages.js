// Study plan, settings and the "how it works" page.
import { UNITS, SKILL, GENERATORS, SKILLS } from '../registry.js';
import { state, save, replaceState, resetState, points } from './state.js';
import { esc, gradeBadge, higherBadge, progressBar, areaStyle, AREA, STATUS, isDev, toast } from './ui.js';
import { needsPractice, inProgress, readyToLearn, unitLevel, overallSummary, visibleSkills, hasQuestions, isSecure } from './plan.js';

const skillChip = (s, extra = '') => `<a class="plan-skill" href="#/skill/${s.id}" style="${areaStyle(s.area)}">${gradeBadge(s.grade)}<span class="ps-main"><b>${esc(s.title)} ${higherBadge(s)}</b><small>${esc(AREA[s.area].short || AREA[s.area].title)}${extra}</small></span>${points(s.id) ? progressBar(points(s.id)) : ''}</a>`;

export function renderPlan(root) {
  const np = needsPractice();
  const ip = inProgress();
  const ready = readyToLearn();
  const o = overallSummary();
  const unchecked = UNITS.filter((u) => !state.checks[u.id]);
  root.innerHTML = `
    <section class="panel plan">
      <h1>🧭 Study plan</h1>
      <p class="lead">Built from your quick checks and practice. Everything stays open – this is just a suggestion of what to do next.</p>
      <div class="stats">
        <div class="stat"><b>${o.mastered}</b><span>mastered</span></div>
        <div class="stat"><b>${o.secure}</b><span>secure (incl. mastered)</span></div>
        <div class="stat"><b>${o.total}</b><span>skills in ${state.settings.tier === 'foundation' ? 'Foundation' : 'Higher'}</span></div>
      </div>
      <div class="plan-cols">
        <div>
          <h2>1. Needs practice <span class="count">${np.length}</span></h2>
          ${np.length ? `<div class="plan-list">${np.slice(0, 12).map((s) => skillChip(s)).join('')}</div>${np.length > 12 ? `<p class="muted small">…and ${np.length - 12} more.</p>` : ''}` : '<p class="muted">Nothing flagged yet. Quick checks find these for you.</p>'}
          <h2>2. In progress <span class="count">${ip.length}</span></h2>
          ${ip.length ? `<div class="plan-list">${ip.slice(0, 10).map((s) => skillChip(s)).join('')}</div>` : '<p class="muted">Skills you have started appear here.</p>'}
        </div>
        <div>
          <h2>3. Ready to learn <span class="count">${ready.length}</span></h2>
          <p class="muted small">You're secure in everything these build on.</p>
          ${ready.length ? `<div class="plan-list">${ready.slice(0, 10).map((s) => skillChip(s)).join('')}</div>` : '<p class="muted">Take a quick check or master a few skills to unlock suggestions.</p>'}
          <h2>Topic levels</h2>
          <table class="qtable levels"><tr><th>Topic</th><th>Level</th><th></th></tr>
            ${UNITS.map((u) => {
    const c = state.checks[u.id];
    const lvl = unitLevel(u);
    return `<tr style="${areaStyle(u.area)}"><td><span class="area-dot"></span>${esc(u.title)}</td><td>${c || lvl ? (lvl ? `≈ grade ${lvl}` : 'starting') : '<span class="muted">–</span>'}</td><td><a href="#/check/${u.id}" class="small">${c ? 'retake' : 'check'}</a></td></tr>`;
  }).join('')}
          </table>
          ${unchecked.length ? `<p class="muted small">${unchecked.length} topics not checked yet.</p>` : ''}
        </div>
      </div>
    </section>`;
}

export function renderSettings(root) {
  const s = state.settings;
  const flagged = state.flagged;
  root.innerHTML = `
    <section class="panel narrow settings">
      <h1>⚙️ Settings</h1>
      <form class="settings-form">
        <label class="field"><span>Your name (optional)</span><input name="name" value="${esc(s.name)}" maxlength="30" placeholder="Used for the greeting"></label>
        <fieldset><legend>Tier</legend>
          <label><input type="radio" name="tier" value="foundation" ${s.tier === 'foundation' ? 'checked' : ''}> Foundation – hide Higher-only skills</label>
          <label><input type="radio" name="tier" value="higher" ${s.tier === 'higher' ? 'checked' : ''}> Higher – show everything</label>
        </fieldset>
        <fieldset><legend>Answering</legend>
          <label><input type="radio" name="answerMode" value="choice" ${s.answerMode === 'choice' ? 'checked' : ''}> Choose from options</label>
          <label><input type="radio" name="answerMode" value="typed" ${s.answerMode === 'typed' ? 'checked' : ''}> Type my answer when possible <span class="muted small">(more like the real exam)</span></label>
        </fieldset>
        <fieldset><legend>Theme</legend>
          ${['auto', 'light', 'dark'].map((t) => `<label><input type="radio" name="theme" value="${t}" ${s.theme === t ? 'checked' : ''}> ${t[0].toUpperCase()}${t.slice(1)}</label>`).join('')}
        </fieldset>
      </form>
      <h2>Your progress</h2>
      <p class="muted small">Progress is saved in this browser only. Export it to move to another device.</p>
      <div class="btn-row">
        <button class="btn export">Export progress</button>
        <label class="btn import">Import progress<input type="file" accept="application/json" hidden></label>
        <button class="btn danger reset">Reset everything</button>
      </div>
      <h2>Reported questions <span class="count">${flagged.length}</span></h2>
      ${flagged.length ? `<ul class="flagged">${flagged.slice().reverse().map((f) => `<li><code>${esc(f.archetype)}</code> · ${esc(f.difficulty)} · seed ${f.seed}${f.note ? ` – “${esc(f.note)}”` : ''} <span class="muted small">${esc(f.at.slice(0, 10))}</span></li>`).join('')}</ul><button class="btn small clear-flags">Clear reports</button>` : '<p class="muted">Use “⚑ Report” under a question if something looks wrong.</p>'}
      ${isDev() ? devStats() : ''}
    </section>`;
  const form = root.querySelector('.settings-form');
  form.addEventListener('change', () => {
    const f = new FormData(form);
    state.settings = { ...state.settings, name: f.get('name').trim(), tier: f.get('tier'), answerMode: f.get('answerMode'), theme: f.get('theme') };
    save();
    applyTheme();
    toast('Saved');
  });
  root.querySelector('.export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `gcse-maths-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  });
  root.querySelector('.import input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (data.schema !== 1) throw new Error('Not a progress file');
      replaceState(data); toast('Progress imported'); renderSettings(root);
    } catch (err) { alert(`Could not import: ${err.message}`); }
  });
  root.querySelector('.reset').addEventListener('click', () => {
    if (confirm('Delete all progress, quick-check results and mock exam history? This cannot be undone.')) { resetState(); applyTheme(); toast('Progress reset'); renderSettings(root); }
  });
  root.querySelector('.clear-flags')?.addEventListener('click', () => { state.flagged = []; save(); renderSettings(root); });
}

function devStats() {
  const covered = new Set(GENERATORS.map((g) => g.skillId));
  const missing = SKILLS.filter((s) => !covered.has(s.id));
  return `<h2>Developer</h2><p>${GENERATORS.length} question types across ${covered.size}/${SKILLS.length} skills.</p>${missing.length ? `<p class="small">Without questions: ${missing.map((s) => esc(s.id)).join(', ')}</p>` : ''}`;
}

export function applyTheme() {
  const t = state.settings.theme;
  document.documentElement.dataset.theme = t === 'auto' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : t;
}

export function renderAbout(root) {
  const nSkills = visibleSkills().filter((s) => hasQuestions(s.id)).length;
  root.innerHTML = `
    <section class="panel narrow about">
      <h1>How this works</h1>
      <h2>Topics and skills</h2>
      <p>The GCSE maths course is split into six areas (Number, Algebra, Ratio, Geometry, Probability, Statistics), then into topics, then into ${nSkills} skills. Each skill has a badge like ${gradeBadge(4)} showing roughly which GCSE grade it belongs to, and ${higherBadge({ higher: true })} marks Higher-tier-only skills.</p>
      <h2>Practising</h2>
      <p>Every skill is open from the start. Each correct answer earns <b>7 points</b> (3 if you used a hint); a wrong answer loses <b>10</b>. At <b>100 points</b> a skill is <span class="status st-mastered">★ Mastered</span>. As your points rise, questions move from Level 1 (warm-up) to Level 2 (standard) to Level 3 (challenge, the hardest exam style).</p>
      <p>Every question has a worked solution under <b>How to solve it</b>. Keyboard: <kbd>1</kbd>–<kbd>5</kbd> pick an answer, <kbd>Enter</kbd> for the next question, <kbd>H</kbd> for a hint.</p>
      <h2>Quick checks</h2>
      <p>A quick check is a short adaptive test on one topic – usually 3 to 6 questions. It works out which skills already look secure and which need practice, and builds your study plan. It never locks anything.</p>
      <h2>Mock exams</h2>
      <p>An optional timed paper across all topics, ordered from easiest to hardest like a real paper, with a rough grade estimate. Real papers include longer questions where you show working – these single-answer questions test the same skills.</p>
      <h2>Where the questions come from</h2>
      <p>Question types are modelled on real GCSE papers. Every question is generated fresh with new numbers, so you can practise as much as you like. Spot a problem? Use <b>⚑ Report</b>.</p>
    </section>`;
}
void SKILL; void isSecure; void STATUS;
