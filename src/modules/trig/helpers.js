// Small shared helpers for the trig module: rounding/formatting of lengths and angles, degree-based trig,
// typed-answer specs and Pythagorean triples.
import { num, tnum, roundTo, roundSf, tidy, pick, int } from '../../core.js';

export const D2R = Math.PI / 180;
export const sinD = (x) => Math.sin(x * D2R);
export const cosD = (x) => Math.cos(x * D2R);
export const tanD = (x) => Math.tan(x * D2R);
export const asinD = (x) => Math.asin(x) / D2R;
export const acosD = (x) => Math.acos(x) / D2R;
export const atanD = (x) => Math.atan(x) / D2R;

/** Decimal places needed to show x to sf significant figures. */
export const sfDp = (x, sf) => Math.max(0, sf - 1 - Math.floor(Math.log10(Math.abs(x) || 1)));

/**
 * A rounding rule: { kind: 'dp', n } or { kind: 'sf', n }.
 * r.round(x) rounds, r.fmt(x) formats (keeping trailing zeros), r.text is the instruction.
 */
export function rounding(kind = 'dp', n = 1) {
  const r = {
    kind, n,
    round: (x) => (kind === 'dp' ? roundTo(x, n) : roundSf(x, n)),
    dp: (x) => (kind === 'dp' ? n : sfDp(roundSf(x, n), n)),
    fmt: (x) => num(r.round(x), r.dp(x)),
    tex: (x) => tnum(r.round(x), r.dp(x)),
    text: kind === 'dp' ? `Give your answer to ${n === 1 ? '1 decimal place' : `${n} decimal places`}.` : `Give your answer to ${n} significant figures.`,
    short: kind === 'dp' ? `${n} d.p.` : `${n} s.f.`,
    tol: (x) => 0.5 * 10 ** -r.dp(x),
    typed: (x) => ({ kind: 'number', value: r.round(x), tolerance: 0.5 * 10 ** -r.dp(x) }),
  };
  return r;
}
export const DP1 = rounding('dp', 1);
export const SF3 = rounding('sf', 3);
/** Pick a rounding rule by difficulty (hard sometimes uses 3 s.f.). */
export const roundingFor = (rng, d) => (d === 'hard' && rng() < 0.5 ? SF3 : DP1);

/** Length with unit; dp = null shows the number as is. */
export const L = (x, unit = 'cm', dp = null) => `${num(dp === null ? tidy(x) : roundTo(x, dp), dp)}${unit ? ` ${unit}` : ''}`;
/** Angle in degrees as plain text, e.g. 35°, 35.2° */
export const A = (x, dp = null) => `${num(dp === null ? tidy(x) : roundTo(x, dp), dp)}°`;
/** Angle as TeX: 35^\circ */
export const At = (x) => `${tnum(x)}^\\circ`;

/** Format a list of candidate values with formatter f, dropping non-finite / non-positive values. */
export const fmtVals = (vals, f, { positive = true } = {}) => vals.filter((v) => Number.isFinite(v) && (!positive || v > 0)).map((v) => f(v)).filter((s) => !/\d\.\d{4,}/.test(s));

export const typedInt = (v) => ({ kind: 'number', value: v });

/** Primitive Pythagorean triples (a < b < c). */
export const TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41], [12, 35, 37]];
/** A scaled triple with hypotenuse at most maxC. Returns [a, b, c] with legs in random order. */
export function triple(rng, { maxC = 60, minC = 5, primitives = TRIPLES } = {}) {
  const opts = [];
  for (const t of primitives) for (let m = 1; t[2] * m <= maxC; m += 1) if (t[2] * m >= minC) opts.push(t.map((v) => v * m));
  const t = pick(rng, opts);
  return rng() < 0.5 ? t : [t[1], t[0], t[2]];
}

/** Rotation for right-angled triangle diagrams: a mix of upright, rotated and tilted orientations. */
export const pickRotation = (rng, d = 'medium') => pick(rng, d === 'easy' ? [0, 0, 90, 180, 270] : [0, 90, 180, 270, 25, -20, 200, 155, 115, -65]);

/** Random integer angle in [lo, hi] avoiding 45 (looks ambiguous) and multiples of 30 for calculator questions. */
export function calcAngle(rng, lo = 20, hi = 70) {
  for (let i = 0; i < 50; i += 1) {
    const a = int(rng, lo, hi);
    if (a % 15 !== 0) return a;
  }
  return lo + 1;
}

/** Unit names used for lengths. */
export const UNITS = ['cm', 'm', 'mm'];

/** Show a calculator value with up to 3 dp and an ellipsis if it was cut short: 12.369… */
export function approx(v) {
  const t = Math.trunc(v * 1000) / 1000;
  return Math.abs(t - v) < 1e-9 ? num(tidy(v)) : `${num(t, 3)}…`;
}

/** n = k²s with s square-free. */
export function surd(n) {
  let k = 1;
  for (let f = 2; f * f <= n; f += 1) while (n % (f * f) === 0) { n /= f * f; k *= f; }
  return { k, s: n };
}
export const surdTex = (k, s) => (s === 1 ? tnum(k) : k === 1 ? `\\sqrt{${s}}` : `${k}\\sqrt{${s}}`);
/** TeX for √n in simplest form. */
export const sqrtTex = (n) => { const { k, s } = surd(n); return surdTex(k, s); };
export const isSquare = (n) => Number.isInteger(Math.sqrt(n));

/** All scaled Pythagorean triples [a, b, c] (a < b) with c <= maxC. */
export function allTriples(maxC = 60) {
  const out = [];
  for (const t of TRIPLES) for (let m = 1; t[2] * m <= maxC; m += 1) out.push(t.map((v) => v * m));
  return out;
}
/** TeX version of approx(): 12.369\ldots */
export const approxT = (v) => approx(v).replace(/,/g, '{,}').replace('−', '-').replace('…', '\\ldots{}');
/** True when v is finite and has at most dp decimal places. */
export const nice = (v, dp = 0) => Number.isFinite(v) && Math.abs(v * 10 ** dp - Math.round(v * 10 ** dp)) < 1e-6;
/** TeX for top ÷ bottom: a short decimal if it terminates within 3 dp, otherwise a simplified fraction. */
export function ratioTex(top, bottom) {
  const v = top / bottom;
  if (nice(v, 3)) return tnum(roundTo(v, 3));
  const s = 1000;
  const n = Math.round(top * s); const dd = Math.round(bottom * s);
  let g = n; let h = dd; while (h) [g, h] = [h, g % h];
  return `\\frac{${n / g}}{${dd / g}}`;
}
