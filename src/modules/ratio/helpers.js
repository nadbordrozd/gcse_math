// Small helpers shared by the ratio, percentage, proportion and measures generators.
import { gen, num, tnum, money, tidy, roundTo, gcd, pick } from '../../core.js';

/** Is x (after float tidying) written with at most dp decimal places? */
export const hasDp = (x, dp) => Number.isFinite(x) && Math.abs(roundTo(x, dp) - tidy(x)) < 1e-9;

/** Formatter for a quantity with a unit: withUnit('kg')(2.5) -> "2.5 kg". */
const SINGULAR = {
  minutes: 'minute', hours: 'hour', days: 'day', weeks: 'week', months: 'month', years: 'year', seconds: 'second', litres: 'litre', tonnes: 'tonne',
  miles: 'mile', pence: 'penny', tins: 'tin', bags: 'bag', tiles: 'tile', glasses: 'glass', pieces: 'piece', loaves: 'loaf', doses: 'dose',
  sacks: 'sack', trips: 'trip', posts: 'post', hectares: 'hectare', joules: 'joule', people: 'person', workers: 'worker',
};
export const withUnit = (unit) => (v) => (unit ? `${num(v)} ${Math.abs(v - 1) < 1e-12 && SINGULAR[unit] ? SINGULAR[unit] : unit}` : num(v));
export const pct = (v) => `${num(v)}%`;
/** Money from integer pence. gbp(1250) -> "£12.50", gbp(1200) -> "£12". */
export const gbp = (pence) => money(Math.round(pence) / 100);
/** Money from pence, always with pence shown: gbpF(1200) -> "£12.00". */
export const gbpF = (pence) => money(Math.round(pence) / 100, { forcePence: true });
/** Money inside TeX. */
export const tgbp = (pence) => `\\text{${gbp(pence)}}`;

/** Scale a list of (possibly decimal) numbers up to integers. */
export function toInts(parts) {
  let k = 1;
  while (k < 1e6 && parts.some((p) => !Number.isInteger(tidy(p * k)))) k *= 10;
  return parts.map((p) => Math.round(tidy(p * k)));
}
/** Simplest whole-number form of a ratio (decimals allowed in the input). */
export const simplify = (parts) => {
  const ints = toInts(parts);
  const g = ints.reduce((a, b) => gcd(a, b)) || 1;
  return ints.map((p) => p / g);
};
export const isSimplest = (parts) => parts.every(Number.isInteger) && parts.reduce((a, b) => gcd(a, b)) === 1;
export const sameRatio = (a, b) => a.length === b.length && simplify(a).join(':') === simplify(b).join(':');

/** Ratio for display: ratio([3,5]) -> "$3 : 5$". */
export const ratioTex = (parts) => parts.map((p) => tnum(p)).join(' : ');
export const ratio = (parts) => `$${ratioTex(parts)}$`;
export const ratioTyped = (parts) => ({ kind: 'text', accept: [parts.map((p) => String(tidy(p))).join(':')] });

/**
 * Turn misconception values into formatted distractors: drops non-finite, negative (unless allowed),
 * zero, the answer itself and (unless round) values with more than dp decimal places.
 */
export function dvals(answer, values, fmt, { dp = 2, min = 0, allowZero = false, round = false, integer = false, pad = true, maxRatio = 1000 } = {}) {
  const out = [];
  let fallback = [];
  if (pad && answer > 0) {
    // last-resort nearby values, after all the misconception-based ones
    let step = 10 ** Math.max(0, Math.floor(Math.log10(answer)) - 1);
    if (!Number.isInteger(answer)) step = 10 ** -Math.min(dp ?? 2, (String(tidy(answer)).split('.')[1] || '').length);
    if (Number.isInteger(answer) && answer % 100 === 0 && answer >= 1000) step = 100;
    fallback = [1, -1, 2, -2, 3, -3, 4, 5].map((k) => answer + k * step);
  }
  for (const raw of [...values, ...fallback]) {
    if (raw === null || raw === undefined || !Number.isFinite(raw)) continue;
    let v = tidy(raw);
    if (round) v = roundTo(v, dp);
    if (v < min || (!allowZero && v === 0)) continue;
    if (Math.abs(v - answer) < 1e-9) continue;
    // absurdly large or small values are not believable options
    if (answer > 0 && (v > answer * maxRatio || v < answer / maxRatio)) continue;
    if (integer && !Number.isInteger(v)) continue;
    if (dp !== null && !hasDp(v, dp)) continue;
    out.push(fmt(v));
  }
  return out;
}
/** Money distractors from pence values (rounded to the nearest penny). */
export const pvals = (answerP, values) => dvals(answerP, values.filter(Number.isFinite).map((v) => Math.round(v)), gbp, { dp: 0, pad: false })
  .concat(answerP % 100 === 0
    ? [100, -100, 200, -200, 300, 500].map((k) => answerP + k).filter((v) => v > 0).map(gbp)
    : [10, -10, 20, -20, 50, -50, 1, -1].map((k) => answerP + k).filter((v) => v > 0).map(gbp));

/**
 * Ratio distractors. Drops ratios equivalent to the answer (unless keepEquivalent, used for
 * "not fully simplified" distractors) and exact duplicates.
 */
export function rvals(answer, list, { keepEquivalent = false } = {}) {
  const out = [];
  const seen = new Set([answer.map((x) => tidy(x)).join(':')]);
  for (const r of list) {
    if (!r || r.length !== answer.length || r.some((x) => !Number.isFinite(x) || x <= 0)) continue;
    const t = r.map((x) => tidy(x));
    if (!keepEquivalent && sameRatio(t, answer)) continue;
    const k = t.join(':');
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(ratio(t));
  }
  return out;
}

/**
 * Like core gen(), but switches off core's numeric fillers (they mangle numbers with thousands
 * separators, e.g. "1,600 ml" -> "1700,600 ml"). Use near() for explicit nearby-value fallbacks.
 */
export const rgen = (id, skill, build, meta) => gen(id, skill, (rng, d) => ({ fill: false, ...build(rng, d) }), meta);

/** Nearby values as a last-resort distractor list: ans ± step, ± 2 step … (positive only). */
export function near(ans, fmt, { step = null, dp = 2, k = 4 } = {}) {
  const s = step ?? Math.max(10 ** -dp, 10 ** Math.max(0, Math.floor(Math.log10(Math.abs(ans) || 1)) - 1));
  const out = [];
  for (let i = 1; i <= k; i += 1) for (const v of [ans + i * s, ans - i * s]) if (v > 0) out.push(fmt(roundTo(v, dp)));
  return out;
}

/** Pick one template and call it. */
export const choose = (rng, list, ...args) => pick(rng, list)(...args);

/** "1 hour 30 minutes" style. */
export function hm(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes - 60 * h);
  const hs = h ? `${h} hour${h === 1 ? '' : 's'}` : '';
  const ms = m ? `${m} minute${m === 1 ? '' : 's'}` : '';
  return [hs, ms].filter(Boolean).join(' ') || '0 minutes';
}
/** TeX fraction p/q in lowest terms (whole numbers shown plainly). */
export const ftex = (p, q) => {
  const g = gcd(p, q);
  const a = p / g; const b = q / g;
  return b === 1 ? tnum(a) : `\\frac{${a}}{${b}}`;
};
export const fopt = (p, q) => `$${ftex(p, q)}$`;
/** Fraction distractors from [p, q] pairs: drops equal-valued and invalid ones. */
export function fvals(ans, pairs, { proper = false } = {}) {
  const out = [];
  const seen = new Set([ans[0] / ans[1]]);
  const [a, b] = ans;
  const fallback = [[a, b + 1], [a + 1, b], [a, b - 1], [a + 1, b + 1], [a, b + 2], [a + 2, b + 1], [a - 1, b], [a + 1, b + 2], [a, b + 3], [a + 2, b + 3], [a + 2, b + 5]];
  for (const [p, q] of [...pairs, ...fallback]) {
    if (!(p > 0 && q > 0) || !Number.isInteger(p) || !Number.isInteger(q) || p % q === 0) continue;
    if (proper && p >= q) continue;
    const v = p / q;
    if ([...seen].some((s) => Math.abs(s - v) < 1e-12)) continue;
    seen.add(v);
    out.push(fopt(p, q));
  }
  return out;
}
export { num, tnum };
