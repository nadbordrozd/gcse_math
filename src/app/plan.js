// Study-plan logic: which skills are visible for the chosen tier, which are secure, what to do next.
import { SKILLS, SKILL, UNITS, GENERATORS_BY_SKILL } from '../registry.js';
import { state, points, isMastered, skillStatus } from './state.js';

export const hasQuestions = (id) => (GENERATORS_BY_SKILL[id]?.length ?? 0) > 0;

export function visibleSkills() {
  const foundation = state.settings.tier === 'foundation';
  return SKILLS.filter((s) => (!foundation || !s.higher));
}
export function visibleUnitSkills(unit) {
  const foundation = state.settings.tier === 'foundation';
  return unit.skills.map((s) => SKILL[s.id]).filter((s) => s && (!foundation || !s.higher));
}

export const isSecure = (id) => isMastered(id) || state.assess[id]?.status === 'secure';

/** Prerequisites the learner has not shown yet (only ones that have questions). */
export const missingPrereqs = (id) => (SKILL[id]?.prereqs || []).filter((p) => hasQuestions(p) && !isSecure(p));

const byGrade = (a, b) => a.grade - b.grade || SKILLS.indexOf(a) - SKILLS.indexOf(b);

export function needsPractice() {
  return visibleSkills().filter((s) => hasQuestions(s.id) && !isMastered(s.id) && state.assess[s.id]?.status === 'practice').sort(byGrade);
}
export function inProgress() {
  return visibleSkills().filter((s) => hasQuestions(s.id) && !isMastered(s.id) && points(s.id) > 0 && state.assess[s.id]?.status !== 'practice')
    .sort((a, b) => (state.skills[b.id]?.lastSeen || 0) - (state.skills[a.id]?.lastSeen || 0));
}
/** Skills not yet secure whose prerequisites are all secure – the natural next things to learn. */
export function readyToLearn() {
  return visibleSkills().filter((s) => hasQuestions(s.id) && !isSecure(s.id) && points(s.id) === 0
    && state.assess[s.id]?.status !== 'practice' && missingPrereqs(s.id).length === 0).sort(byGrade);
}

/** A short, ordered list of recommendations for the home page. */
export function recommendations(limit = 4) {
  const out = [];
  const seen = new Set();
  const add = (s, why) => { if (s && !seen.has(s.id) && out.length < limit) { seen.add(s.id); out.push({ skill: s, why }); } };
  if (state.last && SKILL[state.last] && !isMastered(state.last) && hasQuestions(state.last)) add(SKILL[state.last], 'Carry on where you left off');
  needsPractice().slice(0, 2).forEach((s) => add(s, 'A quick check showed this needs practice'));
  inProgress().slice(0, 1).forEach((s) => add(s, 'You have started this'));
  readyToLearn().slice(0, limit).forEach((s) => add(s, s.prereqs.length ? 'Ready to learn: you know what it builds on' : 'A good place to start'));
  return out;
}

export function unitSummary(unit) {
  const skills = visibleUnitSkills(unit);
  const mastered = skills.filter((s) => isMastered(s.id)).length;
  const secure = skills.filter((s) => isSecure(s.id)).length;
  const pts = skills.reduce((t, s) => t + Math.min(100, points(s.id)), 0);
  const grades = skills.map((s) => s.grade);
  return {
    skills, mastered, secure, total: skills.length,
    progress: skills.length ? pts / skills.length : 0,
    minGrade: Math.min(...grades), maxGrade: Math.max(...grades),
    check: state.checks[unit.id] || null,
    statuses: skills.map((s) => skillStatus(s.id)),
  };
}

export function overallSummary() {
  const skills = visibleSkills().filter((s) => hasQuestions(s.id));
  return {
    total: skills.length,
    mastered: skills.filter((s) => isMastered(s.id)).length,
    secure: skills.filter((s) => isSecure(s.id)).length,
    unitsChecked: UNITS.filter((u) => state.checks[u.id]).length,
  };
}

/** Estimated working grade in a unit: highest grade g such that every skill up to g is secure. */
export function unitLevel(unit) {
  const skills = visibleUnitSkills(unit).filter((s) => hasQuestions(s.id)).sort(byGrade);
  let level = 0;
  for (const s of skills) {
    if (isSecure(s.id)) level = Math.max(level, s.grade);
    else break;
  }
  return level;
}
