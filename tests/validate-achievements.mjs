// Achievements: every topic has a creature, every achievement has a badge recipe, and evaluation works
// for an empty and a complete learner on both tiers.  Usage: node tests/validate-achievements.mjs
import { readFileSync } from 'node:fs';
import { UNITS, AREAS, SKILLS, GENERATORS_BY_SKILL } from '../src/registry.js';
import { ACHIEVEMENTS, evaluateAchievements } from '../src/achievements.js';

const problems = [];
const recipes = JSON.parse(readFileSync(new URL('../tools/badges/recipes.json', import.meta.url))).badges;
const ids = new Set(ACHIEVEMENTS.map((a) => a.id));
if (ids.size !== ACHIEVEMENTS.length) problems.push('duplicate achievement ids');
for (const u of UNITS) if (!ids.has(`unit_${u.id}`)) problems.push(`no creature for topic ${u.id}`);
for (const a of ACHIEVEMENTS) {
  if (!recipes[a.id]) problems.push(`no badge recipe for ${a.id}`);
  if (!a.icon) problems.push(`no emoji for ${a.id}`);
  if (a.unitId && !UNITS.some((u) => u.id === a.unitId)) problems.push(`${a.id}: unknown topic`);
}
for (const id of Object.keys(recipes)) if (!ids.has(id)) problems.push(`recipe without achievement: ${id}`);

for (const tier of ['foundation', 'higher']) {
  const skills = SKILLS.filter((s) => GENERATORS_BY_SKILL[s.id]?.length && (tier === 'higher' || !s.higher));
  const empty = { skills, units: UNITS, areas: AREAS, completions: {}, days: {}, attempted: 0, checks: {}, mocks: [], read: {} };
  const none = evaluateAchievements(empty);
  if (none.some((a) => a.met)) problems.push(`${tier}: achievements met with no progress: ${none.filter((a) => a.met).map((a) => a.id)}`);
  const day = (i) => new Date(2026, 0, 3 + i).toISOString().slice(0, 10); // 3 Jan 2026 is a Saturday
  const full = {
    ...empty,
    completions: Object.fromEntries(skills.map((s, i) => [s.id, { at: new Date(2026, 0, 3 + Math.floor(i / 3), 12).getTime(), wrong: i % 7 }])),
    days: Object.fromEntries(Array.from({ length: 40 }, (_, i) => [day(i), 5])),
    attempted: 5000, checks: Object.fromEntries(UNITS.map((u) => [u.id, {}])), mocks: [{ grade: tier === 'higher' ? 8 : 5 }],
    read: Object.fromEntries(Array.from({ length: 60 }, (_, i) => [`p${i}`, 1])),
  };
  const all = evaluateAchievements(full);
  const unmet = all.filter((a) => !a.met).map((a) => a.id);
  if (unmet.length) problems.push(`${tier}: not met by a complete learner: ${unmet}`);
  for (const a of all) if (/undefined|NaN|\[object/.test(`${a.requirement} ${a.flavour}`)) problems.push(`${a.id}: bad text`);
  console.log(`${tier}: ${all.length} achievements (${all.filter((a) => a.group === 'bestiary').length} creatures)`);
}
console.log(problems.length ? problems.join('\n') : 'achievements OK');
process.exitCode = problems.length ? 1 : 0;
