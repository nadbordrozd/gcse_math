// Small helpers shared by the Number module's generator files.
import { Frac, frac, tnum, num, tidy, primeFactors, gcd, gen as coreGen, buildOptions } from '../../core.js';

/** TeX option for a number: T(-3.5) -> "$-3.5$". */
export const T = (x, dp = null) => `$${tnum(x, dp)}$`;
/** TeX option for a fraction (mixed numbers optional). */
export const F = (f, mixed = false) => `$${Frac.of(f).tex({ mixed })}$`;
/** Remove duplicates (by string) and anything equal to the answer. */
export const uniq = (arr, answer = null) => [...new Set(arr.map(String))].filter((x) => x !== String(answer));
/** Integer range [a, b]. */
export const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
/** True if n/d terminates as a decimal (denominator in lowest terms only has 2s and 5s). */
export const terminates = (n, d) => primeFactors(d / gcd(n, d)).every((p) => p === 2 || p === 5);
/** Product of prime factors in index form, TeX: 2^{3} \times 3 \times 5^{2}. */
export function indexForm(n, { times = ' \\times ' } = {}) {
  const pf = primeFactors(n);
  const counts = new Map();
  pf.forEach((p) => counts.set(p, (counts.get(p) || 0) + 1));
  return [...counts].map(([p, k]) => (k === 1 ? `${p}` : `${p}^{${k}}`)).join(times);
}
/** Index form from a map {prime: power}. */
export function indexFormMap(m) {
  return Object.keys(m).map(Number).sort((a, b) => a - b).filter((p) => m[p] > 0)
    .map((p) => (m[p] === 1 ? `${p}` : `${p}^{${m[p]}}`)).join(' \\times ');
}
export function primeMap(n) {
  const m = {};
  primeFactors(n).forEach((p) => { m[p] = (m[p] || 0) + 1; });
  return m;
}
export const valueOfMap = (m) => Object.entries(m).reduce((acc, [p, k]) => acc * Number(p) ** k, 1);
/** Plain decimal string with fixed dp (for TeX). */
export const fixed = (x, dp) => tnum(x, dp);
/** "2 hours 15 minutes" style durations. */
export function hm(mins) {
  const h = Math.floor(mins / 60); const m = mins % 60;
  const parts = [];
  if (h) parts.push(`${h} hour${h === 1 ? '' : 's'}`);
  if (m || !h) parts.push(`${m} minute${m === 1 ? '' : 's'}`);
  return parts.join(' ');
}
/** 24h clock time text from minutes after midnight: "9:45 am". */
export function clock(mins) {
  mins = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(mins / 60); const m = mins % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
}
/** Safe rounding of float noise. */
export const t = (x) => tidy(x);
/** Number of decimal places of x. */
export const dpOf = (x) => (String(tidy(x)).split('.')[1] || '').length;
/** Numbers in words (up to the millions), e.g. 6005200 -> "six million five thousand two hundred". */
const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
function under1000(n, andWord = true) {
  const h = Math.floor(n / 100); const r = n % 100;
  const out = [];
  if (h) out.push(`${ONES[h]} hundred`);
  if (r) {
    const words = r < 20 ? ONES[r] : TENS[Math.floor(r / 10)] + (r % 10 ? `-${ONES[r % 10]}` : '');
    out.push(h && andWord ? `and ${words}` : words);
  }
  return out.join(' ');
}
export function inWords(n) {
  if (n === 0) return 'zero';
  const parts = [];
  const m = Math.floor(n / 1e6); const th = Math.floor((n % 1e6) / 1000); const r = n % 1000;
  if (m) parts.push(`${under1000(m)} million`);
  if (th) parts.push(`${under1000(th)} thousand`);
  if (r) parts.push((parts.length && r < 100) ? `and ${under1000(r)}` : under1000(r));
  return parts.join(' ');
}
/** Fraction of two ints as Frac. */
export const fr = (n, d) => frac(n, d);
/** Pick k distinct values from a generator function (retries). */
export function distinct(rng, k, make, { maxTries = 200 } = {}) {
  const out = []; const seen = new Set();
  for (let i = 0; i < maxTries && out.length < k; i += 1) {
    const v = make(rng);
    const key = JSON.stringify(v);
    if (!seen.has(key)) { seen.add(key); out.push(v); }
  }
  if (out.length < k) throw new Error('distinct: not enough values');
  return out;
}
export { num, tnum };

/**
 * Same as core gen(), but the build function is retried (with the rng moving on) when it throws,
 * so an unsuitable random parameter set never surfaces as an error.
 */
/** Developer statistics: how often each archetype had to retry (bad parameters or too few options). */
export const retryStats = {};
export function gen(id, skill, build, meta = {}) {
  const robust = (rng, d) => {
    let err;
    for (let i = 0; i < 60; i += 1) {
      try {
        const data = build(rng, d);
        if (meta.longDecimalsOk) data.longDecimalsOk = true;
        // Make sure there are enough genuine distractors, so the core never pads with generic fillers.
        if (i >= 40) retryStats[`${id} FALLBACK`] = (retryStats[`${id} FALLBACK`] || 0) + 1;
        if (i < 40) buildOptions(() => 0.5, data.answer, data.distractors || [], { count: data.count ?? 5, allowEquivalent: data.allowEquivalent, fill: false });
        return data;
      } catch (e) { err = e; retryStats[id] = (retryStats[id] || 0) + 1; }
    }
    throw err;
  };
  return coreGen(id, skill, robust, meta);
}
