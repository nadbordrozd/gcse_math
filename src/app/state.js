// Persistent learner state (localStorage) and the scoring rules.
export const STORAGE_KEY = 'gcse_maths_state_v1';
export const CORRECT_POINTS = 7;
export const HINT_POINTS = 3;
export const WRONG_POINTS = 10;
export const SKIP_POINTS = 4;
export const MASTERY_POINTS = 100;

function defaultState() {
  return {
    schema: 1,
    settings: { tier: 'higher', answerMode: 'choice', theme: 'auto', name: '' },
    skills: {}, // id -> { points, attempts, correct, lastSeen, archetypes: {id: {a, c}} }
    assess: {}, // id -> { status: 'secure'|'practice'|'new', source: 'tested'|'inferred'|'mastered', at }
    checks: {}, // unitId -> { at, level, results: {skillId: status} }
    mocks: [], // history of mock exam results
    flagged: [], // questions the learner reported
    tally: { attempted: 0, correct: 0 },
    days: {}, // 'YYYY-MM-DD' -> questions answered (for the streak)
    last: null, // last skill practised
    completions: {}, // skillId -> { at, wrong } the first time the skill reached 100 points
    achievements: {}, // achievementId -> time earned (kept even when progress is reset)
  };
}

export let state = load();

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.schema === 1) {
      const d = defaultState();
      return { ...d, ...saved, settings: { ...d.settings, ...saved.settings } };
    }
  } catch { /* ignore */ }
  return defaultState();
}
export function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* storage full or disabled */ }
}
export function replaceState(next) {
  state = { ...defaultState(), ...next, settings: { ...defaultState().settings, ...next.settings } };
  save();
}
/** Earned achievements and settings survive a reset: they were really earned. */
export function resetState() {
  const { achievements, settings } = state;
  state = { ...defaultState(), achievements, settings };
  save();
}

export const skillRecord = (id) => (state.skills[id] ||= { points: 0, attempts: 0, correct: 0, lastSeen: 0, archetypes: {} });
export const points = (id) => state.skills[id]?.points ?? 0;
export const isMastered = (id) => points(id) >= MASTERY_POINTS;

export function difficultyFor(id) {
  const p = points(id);
  if (p < 25) return 'easy';
  if (p <= 75) return 'medium';
  return 'hard';
}

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Record an answer. outcome: 'correct' | 'hint' (correct after hint) | 'wrong' | 'skip'.
 * Returns { delta, mastered, first }: mastered when this answer took the skill to 100 points, first when
 * that has never happened before (so the app celebrates in full and sends the learner back to the topic).
 */
export function recordAnswer(skillId, archetypeId, outcome) {
  const r = skillRecord(skillId);
  const before = r.points;
  const wasMastered = before >= MASTERY_POINTS;
  r.attempts += 1;
  r.lastSeen = Date.now();
  const a = (r.archetypes[archetypeId] ||= { a: 0, c: 0 });
  a.a += 1;
  if (outcome === 'correct' || outcome === 'hint') { r.correct += 1; a.c += 1; }
  const delta = outcome === 'correct' ? CORRECT_POINTS : outcome === 'hint' ? HINT_POINTS : outcome === 'skip' ? -SKIP_POINTS : -WRONG_POINTS;
  // Once mastered, a skill stays mastered; points can still wobble within 100 for display.
  r.points = Math.max(0, Math.min(MASTERY_POINTS, before + delta));
  if (wasMastered && r.points < MASTERY_POINTS) r.points = MASTERY_POINTS;
  if (r.points >= MASTERY_POINTS) state.assess[skillId] = { status: 'secure', source: 'mastered', at: Date.now() };
  state.tally.attempted += 1;
  if (outcome === 'correct' || outcome === 'hint') state.tally.correct += 1;
  state.days[today()] = (state.days[today()] || 0) + 1;
  state.last = skillId;
  const mastered = before < MASTERY_POINTS && r.points >= MASTERY_POINTS;
  const first = mastered && !state.completions[skillId];
  if (first) state.completions[skillId] = { at: Date.now(), wrong: r.attempts - r.correct };
  save();
  return { delta: r.points - before, mastered, first };
}

/** Skills mastered before completions were recorded still count. */
export function backfillCompletions() {
  let changed = false;
  for (const [id, r] of Object.entries(state.skills)) {
    if (r.points >= MASTERY_POINTS && !state.completions[id]) {
      state.completions[id] = { at: r.lastSeen || Date.now(), wrong: r.attempts - r.correct };
      changed = true;
    }
  }
  if (changed) save();
}

/** Consecutive days (ending today or yesterday) with at least one answer. */
export function dayStreak() {
  let n = 0;
  const d = new Date();
  if (!state.days[today()]) d.setDate(d.getDate() - 1);
  for (;;) {
    const key = d.toISOString().slice(0, 10);
    if (!state.days[key]) break;
    n += 1;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
export const answeredToday = () => state.days[today()] || 0;

/** Status shown on skill cards. */
export function skillStatus(id) {
  if (isMastered(id)) return 'mastered';
  const a = state.assess[id];
  if (a?.status === 'practice') return 'practice';
  if (a?.status === 'new') return 'new';
  if (points(id) > 0) return 'progress';
  if (a?.status === 'secure') return 'secure';
  return 'none';
}
