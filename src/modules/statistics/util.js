// Small statistics helpers shared by the statistics generators.
import { gen, num, tidy, roundTo, decimals, int, pick, shuffle, frac } from '../../core.js';

/**
 * TeX fraction distractors: the valid proper fractions among `cands` (Frac objects, or functions returning one),
 * padded with near misses so that there are always enough options.
 */
export function fracDistractors(ans, cands) {
  const out = []; const seen = new Set([`${ans.n}/${ans.d}`]);
  const add = (g) => {
    if (!g || g.n <= 0 || g.d <= 1 || g.n >= g.d) return;
    const key = `${g.n}/${g.d}`;
    if (seen.has(key)) return;
    seen.add(key); out.push(`$${g.tex()}$`);
  };
  const tryAdd = (c) => { try { add(typeof c === 'function' ? c() : c); } catch (e) { /* invalid candidate */ } };
  cands.forEach(tryAdd);
  const N = ans.n; const D = ans.d;
  [[N + 1, D], [N, D + 1], [N - 1, D], [N + 2, D], [N, D + 2], [N + 1, D + 1], [2 * N + 1, 2 * D]].forEach(([a, b]) => tryAdd(() => frac(a, b)));
  return out;
}

export const sum = (a) => tidy(a.reduce((s, v) => s + v, 0));
export const mean = (a) => tidy(sum(a) / a.length);
export const sorted = (a) => [...a].sort((x, y) => x - y);
export function median(a) {
  const s = sorted(a); const n = s.length;
  return n % 2 ? s[(n - 1) / 2] : tidy((s[n / 2 - 1] + s[n / 2]) / 2);
}
/** Unique mode or null. */
export function modeOf(a) {
  const c = new Map();
  for (const v of a) c.set(v, (c.get(v) || 0) + 1);
  const best = Math.max(...c.values());
  const tops = [...c.entries()].filter(([, k]) => k === best);
  return tops.length === 1 && best > 1 ? tops[0][0] : null;
}
export const countOf = (a, v) => a.filter((x) => x === v).length;
export const rangeOf = (a) => tidy(Math.max(...a) - Math.min(...a));
/** Quartiles by the (n+1)/4 rule (exact when n ≡ 3 mod 4). */
export function quartiles(a) {
  const s = sorted(a); const n = s.length;
  const at = (p) => { const i = Math.floor(p); const fr = p - i; return fr === 0 ? s[i - 1] : tidy(s[i - 1] + fr * (s[i] - s[i - 1])); };
  return { min: s[0], q1: at((n + 1) / 4), med: median(s), q3: at((3 * (n + 1)) / 4), max: s[n - 1] };
}
/** Is x a short terminating decimal (≤ dp places)? */
export const isClean = (x, dp = 2) => Number.isFinite(x) && decimals(x) <= dp;
/** Format a number to match an answer with `dp` decimal places (rounded). */
export const fmtDp = (x, dp) => num(roundTo(x, dp), dp);

/**
 * Turn raw distractor values into display strings: drops invalid ones, ones equal or too close to the answer,
 * and (optionally) negatives or non-integers. fmt formats a value.
 */
export function numDistractors(answer, values, { fmt = (v) => num(v), minGap = 0, allowNeg = false, integer = false, dp = null } = {}) {
  const out = [];
  for (let v of values) {
    if (v === null || v === undefined || !Number.isFinite(v)) continue;
    v = tidy(v);
    if (dp !== null) v = roundTo(v, dp);
    else if (!isClean(v, 2)) v = roundTo(v, 1);
    if (!allowNeg && v < 0) continue;
    if (integer && !Number.isInteger(v)) continue;
    if (Math.abs(v - answer) < 1e-9 || Math.abs(v - answer) < minGap) continue;
    out.push(fmt(v));
  }
  return out;
}

/** TeX class interval, e.g. ineq(20, 30, 't') -> "20 < t \\leqslant 30"; style 'le-lt' gives 20 ⩽ t < 30. */
export function ineq(a, b, v = 'x', style = 'lt-le') {
  // \lt rather than a raw "<" so the HTML around the maths can never be mistaken for a tag.
  return style === 'le-lt' ? `${num(a).replace(/,/g, '{,}')} \\leqslant ${v} \\lt ${num(b).replace(/,/g, '{,}')}`
    : `${num(a).replace(/,/g, '{,}')} \\lt ${v} \\leqslant ${num(b).replace(/,/g, '{,}')}`;
}

/** Random frequencies f[0..k-1] that sum to N, each ≥ min, with a single-peaked shape. */
export function peakedFreqs(rng, k, N, { min = 1, peak = null } = {}) {
  const p = peak ?? int(rng, 1, k - 2);
  const w = Array.from({ length: k }, (_, i) => (k - Math.abs(i - p)) ** 1.6 * (0.6 + rng()));
  const tot = w.reduce((a, b) => a + b, 0);
  const f = w.map((x) => Math.max(min, Math.round((x / tot) * N)));
  let diff = N - f.reduce((a, b) => a + b, 0);
  let guard = 0;
  while (diff !== 0 && guard < 500) {
    const i = int(rng, 0, k - 1);
    if (diff > 0) { f[i] += 1; diff -= 1; } else if (f[i] > min) { f[i] -= 1; diff += 1; }
    guard += 1;
  }
  if (diff !== 0) throw new Error('peakedFreqs failed');
  return f;
}

/** n random integers in [lo, hi]. */
export const randInts = (rng, n, lo, hi) => Array.from({ length: n }, () => int(rng, lo, hi));
/** Shuffle until the list is not sorted (so ordering is needed). */
export function unsortedOrder(rng, a) {
  for (let i = 0; i < 20; i += 1) {
    const s = shuffle(rng, a);
    if (s.some((v, j) => j && v < s[j - 1]) && s.some((v, j) => j && v > s[j - 1])) return s;
  }
  return shuffle(rng, a);
}
export const listText = (a, fmt = num) => a.map((v) => fmt(v)).join(', ');
export const listTex = (a) => a.map((v) => num(v).replace('−', '-').replace(/,/g, '{,}')).join(',\\ ');
/** Spaced list for prompts, like the papers: "5   6   1   3". */
export const spaced = (a, fmt = num) => `<div class="datalist" style="margin:6px 0;word-spacing:0.9em">${a.map((v) => fmt(v)).join(' ')}</div>`;
export { pick };

/**
 * gen() with built-in retries: the build may throw when a random parameter set is unsuitable, and we simply
 * draw again from the same (deterministic) rng, so the validator never sees the throw.
 */
export function sgen(id, skill, build, meta = {}) {
  return gen(id, skill, (rng, d) => {
    let last;
    for (let i = 0; i < 300; i += 1) {
      try { return build(rng, d); } catch (e) { last = e; }
    }
    throw last;
  }, meta);
}
