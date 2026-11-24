// Combines the module taxonomies and generators into one catalogue.
// Modules load independently so a broken module (e.g. mid-edit) cannot take down the others.
const MODULE_NAMES = ['number', 'algebra', 'graphs', 'ratio', 'geometry', 'trig', 'probability', 'statistics'];
export const LOAD_ERRORS = {};
const loaded = await Promise.all(MODULE_NAMES.map(async (name) => {
  let units = [];
  let generators = [];
  try { ({ units } = await import(`./modules/${name}/skills.js`)); } catch (e) { LOAD_ERRORS[`${name}/skills`] = e; }
  try { ({ generators } = await import(`./modules/${name}/generators.js`)); } catch (e) { LOAD_ERRORS[`${name}/generators`] = e; }
  return [name, { units, generators }];
}));
for (const [k, e] of Object.entries(LOAD_ERRORS)) console.error(`Failed to load module ${k}:`, e?.message || e);

export const AREAS = [
  { id: 'number', title: 'Number', color: '#2f5bd3', tint: '#eaf0ff', icon: '#' },
  { id: 'algebra', title: 'Algebra', color: '#7c3aed', tint: '#f3edff', icon: 'x' },
  { id: 'ratio', title: 'Ratio, proportion and rates of change', short: 'Ratio & proportion', color: '#c2410c', tint: '#fff1e6', icon: ':' },
  { id: 'geometry', title: 'Geometry and measures', short: 'Geometry', color: '#0f7b5f', tint: '#e5f6f0', icon: '△' },
  { id: 'probability', title: 'Probability', color: '#be185d', tint: '#fdebf3', icon: 'P' },
  { id: 'statistics', title: 'Statistics', color: '#0e7490', tint: '#e3f5f9', icon: 'σ' },
];

export const MODULES = Object.fromEntries(loaded);

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
