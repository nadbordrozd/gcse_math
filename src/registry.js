// Combines the module taxonomies and generators into one catalogue.
import { units as numberUnits } from './modules/number/skills.js';
import { units as algebraUnits } from './modules/algebra/skills.js';
import { units as graphsUnits } from './modules/graphs/skills.js';
import { units as ratioUnits } from './modules/ratio/skills.js';
import { units as geometryUnits } from './modules/geometry/skills.js';
import { units as trigUnits } from './modules/trig/skills.js';
import { units as probabilityUnits } from './modules/probability/skills.js';
import { units as statisticsUnits } from './modules/statistics/skills.js';
import { generators as numberGens } from './modules/number/generators.js';
import { generators as algebraGens } from './modules/algebra/generators.js';
import { generators as graphsGens } from './modules/graphs/generators.js';
import { generators as ratioGens } from './modules/ratio/generators.js';
import { generators as geometryGens } from './modules/geometry/generators.js';
import { generators as trigGens } from './modules/trig/generators.js';
import { generators as probabilityGens } from './modules/probability/generators.js';
import { generators as statisticsGens } from './modules/statistics/generators.js';

export const AREAS = [
  { id: 'number', title: 'Number', color: '#2f5bd3', tint: '#eaf0ff', icon: '#' },
  { id: 'algebra', title: 'Algebra', color: '#7c3aed', tint: '#f3edff', icon: 'x' },
  { id: 'ratio', title: 'Ratio, proportion and rates of change', short: 'Ratio & proportion', color: '#c2410c', tint: '#fff1e6', icon: ':' },
  { id: 'geometry', title: 'Geometry and measures', short: 'Geometry', color: '#0f7b5f', tint: '#e5f6f0', icon: '△' },
  { id: 'probability', title: 'Probability', color: '#be185d', tint: '#fdebf3', icon: 'P' },
  { id: 'statistics', title: 'Statistics', color: '#0e7490', tint: '#e3f5f9', icon: 'σ' },
];

export const MODULES = {
  number: { units: numberUnits, generators: numberGens },
  algebra: { units: algebraUnits, generators: algebraGens },
  graphs: { units: graphsUnits, generators: graphsGens },
  ratio: { units: ratioUnits, generators: ratioGens },
  geometry: { units: geometryUnits, generators: geometryGens },
  trig: { units: trigUnits, generators: trigGens },
  probability: { units: probabilityUnits, generators: probabilityGens },
  statistics: { units: statisticsUnits, generators: statisticsGens },
};

const areaOrder = AREAS.map((a) => a.id);
export const UNITS = Object.entries(MODULES)
  .flatMap(([module, m]) => m.units.map((u) => ({ ...u, module })))
  .sort((a, b) => areaOrder.indexOf(a.area) - areaOrder.indexOf(b.area));

export const SKILLS = UNITS.flatMap((u) => u.skills.map((s) => ({
  ...s, unit: u.id, area: u.area, module: u.module, higher: s.higher ?? s.grade >= 6,
})));
export const SKILL = Object.fromEntries(SKILLS.map((s) => [s.id, s]));
export const UNIT = Object.fromEntries(UNITS.map((u) => [u.id, u]));

export const GENERATORS = Object.values(MODULES).flatMap((m) => m.generators);
export const GENERATOR = Object.fromEntries(GENERATORS.map((g) => [g.id, g]));
export const GENERATORS_BY_SKILL = {};
for (const g of GENERATORS) (GENERATORS_BY_SKILL[g.skillId] ||= []).push(g);

/** Skills that list `id` as a prerequisite. */
export const DEPENDENTS = {};
for (const s of SKILLS) for (const p of s.prereqs) (DEPENDENTS[p] ||= []).push(s.id);

/** All prerequisites of a skill, transitively. */
export function ancestors(id, seen = new Set()) {
  for (const p of SKILL[id]?.prereqs || []) if (!seen.has(p)) { seen.add(p); ancestors(p, seen); }
  return seen;
}
export function descendants(id, seen = new Set()) {
  for (const d of DEPENDENTS[id] || []) if (!seen.has(d)) { seen.add(d); descendants(d, seen); }
  return seen;
}
