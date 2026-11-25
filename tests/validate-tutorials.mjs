// Validates the Learn pages: links resolve, no prerequisite cycles, KaTeX renders, markup balanced,
// and reports which skills have no page yet.
// Usage: node tests/validate-tutorials.mjs [module ...] [--strict]   (--strict fails on missing coverage)
import katex from 'katex';
import { SKILLS, SKILL, TUTORIALS, TUTORIAL, resolveTutorial, GENERATORS, LOAD_ERRORS } from '../src/registry.js';
import { generateSafely } from '../src/core.js';

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const mods = args.filter((a) => !a.startsWith('--'));
const failures = [];
const warnings = [];
const inScope = (t) => !mods.length || mods.includes(t.module);

for (const [k, e] of Object.entries(LOAD_ERRORS)) failures.push(`module ${k} failed to load: ${e?.message || e}`);

const LINK = /\[\[([^\]|]+)(?:\|([^\]]*))?\]\]/g;
function checkText(where, str) {
  const s = String(str ?? '');
  const parts = s.split('$');
  if (parts.length % 2 === 0) return [`${where}: unbalanced $`];
  const errs = [];
  for (let i = 1; i < parts.length; i += 2) {
    { const lost = String(parts[i]).replace(/\\(text|mathrm|textbf|operatorname)\{[^}]*\}/g, '').match(/(^|[^\\a-zA-Z])(circ|frac|dfrac|tfrac|sqrt|times|div|theta|cdot|leqslant|geqslant|pi|alpha|neq)(?![a-zA-Z])/);
      if (lost && !/^(pi)$/.test(lost[2]) ) { const msg = `${where}: TeX command without backslash ("${lost[2]}") in "${String(parts[i]).slice(0, 60)}"`; errs.push(msg); } }
    try { katex.renderToString(parts[i], { throwOnError: true }); } catch (e) { errs.push(`${where}: KaTeX error in "${parts[i].slice(0, 60)}": ${e.message.slice(0, 120)}`); }
    if (/\[\[/.test(parts[i])) errs.push(`${where}: [[link]] inside maths`);
  }
  for (let i = 0; i < parts.length; i += 2) {
    for (const m of parts[i].matchAll(LINK)) {
      if (!resolveTutorial(m[1])) {
        if (SKILL[m[1]] && !strict) warnings.push(`${where}: link [[${m[1]}]] points at a skill with no page yet`);
        else errs.push(`${where}: link [[${m[1]}]] does not resolve to any page`);
      }
    }
  }
  // A [[link|label]] whose label contains $ would be split by the maths renderer.
  for (const m of s.matchAll(LINK)) if ((m[2] || '').includes('$')) errs.push(`${where}: link label contains $: ${m[0]}`);
  if (/\bNaN\b|undefined|\[object/.test(s)) errs.push(`${where}: contains NaN/undefined`);
  return errs;
}
function tagBalance(html) {
  const stack = [];
  const voids = new Set(['br', 'hr', 'img', 'input', 'wbr', 'col']);
  for (const m of html.replace(/<svg[\s\S]*?<\/svg>/g, '').matchAll(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*?(\/?)>/g)) {
    const [full, tag, self] = m; const t = tag.toLowerCase();
    if (self || voids.has(t)) continue;
    if (full.startsWith('</')) { if (stack.pop() !== t) return `mismatched </${t}>`; } else stack.push(t);
  }
  return stack.length ? `unclosed <${stack.pop()}>` : null;
}

const ids = new Set();
for (const t of TUTORIALS) {
  if (!inScope(t)) continue;
  const w = `tutorial ${t.id}`;
  if (ids.has(t.id)) failures.push(`${w}: duplicate id`);
  ids.add(t.id);
  if (!t.title) failures.push(`${w}: missing title`);
  if (!t.summary) warnings.push(`${w}: missing summary`);
  if (!Array.isArray(t.skills) || !t.skills.length) failures.push(`${w}: skills must list at least one skill`);
  for (const s of t.skills || []) if (!SKILL[s]) failures.push(`${w}: unknown skill ${s}`);
  for (const p of t.prereqs || []) {
    const r = resolveTutorial(p);
    if (!r) (SKILL[p] && !strict ? warnings : failures).push(`${w}: prerequisite ${p} has no page${SKILL[p] ? ' yet' : ' (unknown id)'}`);
    else if (r.id === t.id) failures.push(`${w}: lists itself as a prerequisite`);
  }
  if (typeof t.body !== 'string' || t.body.length < 400) failures.push(`${w}: body missing or very short`);
  failures.push(...checkText(`${w} summary`, t.summary), ...checkText(`${w} body`, t.body));
  const tb = tagBalance(t.body || ''); if (tb) failures.push(`${w}: markup ${tb}`);
  if (!/t-example/.test(t.body || '')) warnings.push(`${w}: no worked example`);
  const words = String(t.body || '').replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, ' ').replace(/\$[^$]*\$/g, ' x ').split(/\s+/).filter(Boolean).length;
  if (words < 150) warnings.push(`${w}: only ${words} words`);
  if (words > 2500) warnings.push(`${w}: ${words} words – probably too long for one page`);
}

// Prerequisite cycles (across all tutorials).
const state = {};
function visit(id, path) {
  if (state[id] === 2) return;
  if (state[id] === 1) { failures.push(`prerequisite cycle: ${[...path, id].join(' → ')}`); return; }
  state[id] = 1;
  for (const p of TUTORIAL[id]?.prereqs || []) { const r = resolveTutorial(p); if (r) visit(r.id, [...path, id]); }
  state[id] = 2;
}
for (const t of TUTORIALS) visit(t.id, []);

// Archetype learn lists and [[links]] inside generated solutions.
for (const g of GENERATORS) {
  if (mods.length && !TUTORIALS.some((t) => inScope(t) && t.skills?.includes(g.skillId)) && !(g.learn || []).length) continue;
  for (const id of g.learn || []) if (!resolveTutorial(id)) (SKILL[id] && !strict ? warnings : failures).push(`${g.id}: learn id ${id} has no page${SKILL[id] ? ' yet' : ''}`);
  for (const d of ['easy', 'hard']) {
    for (let seed = 1; seed <= 15; seed += 1) {
      let q; try { q = generateSafely(g, seed * 101, { difficulty: d }); } catch { continue; }
      for (const s of [q.prompt, ...q.solution, q.hint || '']) {
        for (const m of String(s).matchAll(LINK)) if (!resolveTutorial(m[1])) (SKILL[m[1]] && !strict ? warnings : failures).push(`${g.id}: solution link [[${m[1]}]] does not resolve`);
      }
    }
  }
}

const covered = new Set(TUTORIALS.flatMap((t) => t.skills || []));
const missing = SKILLS.filter((s) => !covered.has(s.id) && (!mods.length || mods.includes(s.module)));
console.log(`${TUTORIALS.length} tutorials; ${covered.size}/${SKILLS.length} skills have a Learn page.`);
if (missing.length) (strict ? failures : warnings).push(`skills without a Learn page (${missing.length}): ${missing.map((s) => s.id).join(', ')}`);
const uniqFail = [...new Set(failures)];
if (warnings.length) { console.log(`\nWarnings (${warnings.length}):`); [...new Set(warnings)].forEach((x) => console.log(`  ⚠ ${x}`)); }
if (uniqFail.length) { console.log(`\nFailures (${uniqFail.length}):`); uniqFail.forEach((x) => console.log(`  ✗ ${x}`)); process.exit(1); }
console.log('\nAll tutorial checks passed.');
