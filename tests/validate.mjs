// Validates every registered generator over many seeds at every difficulty.
// Usage: node tests/validate.mjs [module|skill-id|archetype-id ...] [--seeds=200] [--verbose]
import katex from 'katex';
import { SKILLS, SKILL, GENERATORS, MODULES } from '../src/registry.js';
import { parseValue, checkTyped } from '../src/core.js';

const args = process.argv.slice(2);
const seeds = Number((args.find((a) => a.startsWith('--seeds=')) || '--seeds=200').split('=')[1]);
const verbose = args.includes('--verbose');
const filters = args.filter((a) => !a.startsWith('--'));
const DIFFS = ['easy', 'medium', 'hard'];

const moduleOf = new Map();
for (const [name, m] of Object.entries(MODULES)) for (const g of m.generators) moduleOf.set(g.id, name);

const selected = GENERATORS.filter((g) => !filters.length || filters.some((f) => f === moduleOf.get(g.id) || f === g.skillId || f === g.id));

const failures = [];
const warnings = [];
const fail = (g, msg) => failures.push(`${g.id}: ${msg}`);
const warn = (g, msg) => warnings.push(`${g.id}: ${msg}`);

// --- structural checks on taxonomy ---------------------------------------------------------
const ids = new Set();
for (const s of SKILLS) {
  if (ids.has(s.id)) failures.push(`taxonomy: duplicate skill id ${s.id}`);
  ids.add(s.id);
  for (const p of s.prereqs) if (!SKILL[p]) failures.push(`taxonomy: ${s.id} has unknown prerequisite ${p}`);
  if (!(s.grade >= 1 && s.grade <= 9)) failures.push(`taxonomy: ${s.id} has bad grade ${s.grade}`);
}
const genIds = new Set();
for (const g of GENERATORS) {
  if (genIds.has(g.id)) failures.push(`duplicate archetype id ${g.id}`);
  genIds.add(g.id);
  if (!SKILL[g.skillId]) failures.push(`${g.id}: unknown skill ${g.skillId}`);
}

// --- per-string checks ---------------------------------------------------------------------
const katexCache = new Map();
function checkTex(g, where, str) {
  const s = String(str);
  if (/\bNaN\b|undefined|Infinity|\[object|\bnull\b/.test(s.replace(/<svg[\s\S]*?<\/svg>/g, (m) => m.replace(/clip-path|null/g, '')))) return `${where} contains NaN/undefined/Infinity/null: ${s.slice(0, 140)}`;
  const parts = s.split('$');
  if (parts.length % 2 === 0) return `${where} has unbalanced $: ${s.slice(0, 140)}`;
  for (let i = 1; i < parts.length; i += 2) {
    const tex = parts[i];
    if (katexCache.has(tex)) { if (katexCache.get(tex)) return `${where} KaTeX error: ${katexCache.get(tex)}`; continue; }
    try { katex.renderToString(tex, { throwOnError: true }); katexCache.set(tex, null); } catch (e) { katexCache.set(tex, e.message); return `${where} KaTeX error in "${tex}": ${e.message}`; }
  }
  return null;
}
const plain = (s) => String(s).replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, ' ');
function longDecimal(s) {
  // 4+ decimal places in visible text (ignores SVG coordinates).
  return /\d\.\d{4,}/.test(plain(s).replace(/\\times 10\^\{-?\d+\}/g, ''));
}
function tagBalance(html) {
  const stack = [];
  const re = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*?(\/?)>/g;
  const voids = new Set(['br', 'hr', 'img', 'input', 'wbr', 'col']);
  let m;
  while ((m = re.exec(html))) {
    const [full, tag, selfClose] = m;
    const t = tag.toLowerCase();
    if (selfClose || voids.has(t)) continue;
    if (full.startsWith('</')) { if (stack.pop() !== t) return `mismatched </${t}>`; } else stack.push(t);
  }
  return stack.length ? `unclosed <${stack.pop()}>` : null;
}

// --- generator checks ----------------------------------------------------------------------
const report = [];
for (const g of selected) {
  const prompts = new Set(); const skeletons = new Set(); const answers = new Set(); const letters = {};
  let firstError = null; let count = 0; let calcCount = 0; let typedCount = 0;
  for (const d of DIFFS) {
    for (let seed = 1; seed <= seeds; seed += 1) {
      let q;
      try { q = g(seed * 7919 + 13, { difficulty: d }); } catch (e) { firstError ||= `${d} seed ${seed}: ${e.message}`; continue; }
      count += 1;
      const bad = (msg) => { if (!firstError) firstError = `${d} seed ${seed}: ${msg}`; };
      if (q.skill_id !== g.skillId) bad('skill id mismatch');
      if (!q.prompt || typeof q.prompt !== 'string') bad('missing prompt');
      if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 5) bad(`bad option count ${q.options?.length}`);
      const texts = q.options.map((o) => o.text.replace(/\s+/g, ''));
      if (new Set(texts).size !== texts.length) bad(`duplicate options ${texts.join(' | ')}`);
      const correct = q.options.find((o) => o.id === q.answer);
      if (!correct || correct.text !== q.answerText) bad('answer key does not match answer text');
      if (!Array.isArray(q.solution) || q.solution.length < 2) bad('solution needs at least 2 steps');
      for (const [where, s] of [['prompt', q.prompt], ...q.options.map((o) => [`option ${o.id}`, o.text]), ...q.solution.map((s, i) => [`solution[${i}]`, s]), ...(q.hint ? [['hint', q.hint]] : [])]) {
        const e = checkTex(g, where, s); if (e) bad(e);
        if (!q.longDecimalsOk && longDecimal(s)) bad(`${where} has a long decimal: ${plain(s).slice(0, 120)}`);
      }
      if (q.visual) {
        if (typeof q.visual !== 'string' || !/^\s*<(svg|table|div|figure)/.test(q.visual)) bad('visual must be an SVG/HTML string');
        else {
          if (/NaN|undefined|Infinity/.test(q.visual)) bad('visual contains NaN/undefined');
          const tb = tagBalance(q.visual); if (tb) bad(`visual markup: ${tb}`);
          const e = checkTex(g, 'visual', q.visual.replace(/<svg[\s\S]*?<\/svg>/g, '')); if (e) bad(e);
        }
      }
      const tbp = tagBalance(q.prompt); if (tbp) bad(`prompt markup: ${tbp}`);
      if (/\$\s*\d/.test(plain(q.prompt).replace(/\$[^$]*\$/g, ''))) bad('looks like a dollar amount in the prompt');
      if (q.typed) {
        typedCount += 1;
        const pv = parseValue(q.answerText);
        if (q.typed.kind === 'number') {
          const tv = typeof q.typed.value === 'object' ? q.typed.value.value() : Number(q.typed.value);
          if (!Number.isFinite(tv)) bad('typed value not finite');
          else if (pv && Math.abs(pv.value - tv) > (q.typed.tolerance ?? 1e-6) + 1e-9 && !(pv.unit === '' && Math.abs(pv.value * 100 - tv) < 1e-6)) bad(`typed value ${tv} disagrees with answer ${q.answerText}`);
          // The typed checker must accept the canonical value itself.
          if (!checkTyped(q.typed, String(tv))) bad(`checkTyped rejects its own value ${tv}`);
        } else if (q.typed.kind === 'coord') {
          if (!checkTyped(q.typed, `(${q.typed.x}, ${q.typed.y})`)) bad('coord typed spec rejects itself');
        } else if (q.typed.kind === 'list') {
          if (!checkTyped(q.typed, q.typed.values.join(', '))) bad('list typed spec rejects itself');
        } else if (q.typed.kind === 'text') {
          if (!q.typed.accept?.length) bad('text typed spec needs accept list');
        } else bad(`unknown typed kind ${q.typed.kind}`);
      }
      if (q.calculator) calcCount += 1;
      // Determinism
      if (seed <= 3) {
        const again = g(seed * 7919 + 13, { difficulty: d });
        if (JSON.stringify(again) !== JSON.stringify(q)) bad('not deterministic for the same seed');
      }
      prompts.add(q.prompt + (q.visual || ''));
      skeletons.add(plain(q.prompt).replace(/\$[^$]*\$/g, '#').replace(/[−-]?\d[\d,.]*/g, '#').replace(/\b[A-Z][a-z]+\b/g, 'N'));
      answers.add(q.answerText);
      letters[q.answer] = (letters[q.answer] || 0) + 1;
    }
  }
  if (firstError) fail(g, firstError);
  const total = seeds * DIFFS.length;
  const uniq = prompts.size / Math.max(1, count);
  if (count && prompts.size < Math.min(40, total * 0.3)) warn(g, `low variety: only ${prompts.size} distinct questions in ${count}`);
  if (count && answers.size < Math.min(8, count)) warn(g, `low answer variety: ${answers.size} distinct answers`);
  const nOpts = Object.keys(letters).length;
  if (count && nOpts > 1 && Math.min(...Object.values(letters)) < count / (nOpts * 4)) warn(g, `answer letters unevenly distributed ${JSON.stringify(letters)}`);
  if (g.word && skeletons.size < 12) warn(g, `word problem has only ${skeletons.size} distinct prompt structures (want 12+)`);
  report.push({ id: g.id, skill: g.skillId, ok: !firstError, prompts: prompts.size, skeletons: skeletons.size, answers: answers.size, uniq: uniq.toFixed(2), calc: calcCount ? `${Math.round((100 * calcCount) / count)}%` : '', typed: typedCount ? `${Math.round((100 * typedCount) / count)}%` : '' });
}

// --- coverage ------------------------------------------------------------------------------
const covered = new Set(GENERATORS.map((g) => g.skillId));
const missing = SKILLS.filter((s) => !covered.has(s.id) && (!filters.length || filters.some((f) => f === s.module || f === s.id)));

if (verbose) console.table(report);
console.log(`Checked ${selected.length} archetypes × ${DIFFS.length} difficulties × ${seeds} seeds.`);
console.log(`Skills with generators: ${covered.size}/${SKILLS.length}.`);
if (missing.length) console.log(`Skills without generators (${missing.length}): ${missing.map((s) => s.id).join(', ')}`);
if (warnings.length) { console.log(`\nWarnings (${warnings.length}):`); warnings.forEach((w) => console.log(`  ⚠ ${w}`)); }
if (failures.length) { console.log(`\nFailures (${failures.length}):`); failures.forEach((f) => console.log(`  ✗ ${f}`)); process.exit(1); }
console.log('\nAll generator checks passed.');
