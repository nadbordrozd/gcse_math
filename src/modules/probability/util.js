// Shared helpers for probability generators: formatting probabilities and building
// distinct, same-form distractor lists.
import { Frac, frac, tnum, pick, num, gen } from '../../core.js';

/** gen() whose build may throw for an unsuitable random draw: it simply draws again (same rng, so deterministic). */
export function pgen(id, skill, build, meta = {}) {
  return gen(id, skill, (rng, d) => {
    let last;
    for (let i = 0; i < 80; i += 1) {
      try { return build(rng, d); } catch (e) { last = e; }
    }
    throw last;
  }, meta);
}

/** TeX for a fraction value (simplest form). */
export const ft = (f) => `$${Frac.of(f).tex()}$`;

/** True when f is a decimal with at most `dp` decimal places. */
export const shortDecimal = (f, dp = 3) => {
  const x = Frac.of(f).value() * 10 ** dp;
  return Math.abs(x - Math.round(x)) < 1e-9;
};

/** Display a probability (Frac) as 'frac' | 'dec' | 'pct'. */
export function pf(f, form = 'frac') {
  f = Frac.of(f);
  if (form === 'dec') return `$${tnum(f.value())}$`;
  if (form === 'pct') return `$${tnum(f.value() * 100)}\\%$`;
  return `$${f.tex()}$`;
}
/** Inline TeX (without $) for a probability in a form. */
export function pt(f, form = 'frac') {
  f = Frac.of(f);
  if (form === 'dec') return tnum(f.value());
  if (form === 'pct') return `${tnum(f.value() * 100)}\\%`;
  return f.tex();
}
/** Typed spec for a probability. */
export function typedP(f, form = 'frac') {
  f = Frac.of(f);
  if (form === 'pct') return { kind: 'number', value: f.mul(100), percent: true };
  return { kind: 'number', value: f };
}

/**
 * Distractor strings for a probability answer, all in the same form, distinct in value from the answer,
 * strictly between 0 and 1 (unless allowOver / allowZero), followed by near-miss fallbacks.
 * cands: Frac | [n, d] | number (decimal) entries; invalid ones are dropped silently.
 */
export function probOpts(ans, cands, form = 'frac', { allowOver = false, allowZero = false, fallback = true } = {}) {
  ans = Frac.of(ans);
  const seen = new Set([`${ans.n}/${ans.d}`]);
  const out = [];
  const push = (c) => {
    let f;
    try {
      if (c instanceof Frac) f = c;
      else if (Array.isArray(c)) f = frac(c[0], c[1]);
      else if (typeof c === 'number' && Number.isFinite(c)) f = frac(Math.round(c * 10000), 10000);
      else return;
    } catch { return; }
    if (f.n < 0 || (f.n === 0 && !allowZero)) return;
    if (!allowOver && f.value() >= 1 && !(f.n === f.d && allowZero)) return;
    if (form === 'frac' && f.d === 1) return;
    if (form === 'dec' && !shortDecimal(f, 3)) return;
    if (form === 'pct' && !shortDecimal(f, 3)) return;
    const k = `${f.n}/${f.d}`;
    if (seen.has(k)) return;
    seen.add(k);
    out.push(pf(f, form));
  };
  cands.forEach(push);
  if (fallback) {
    const { n, d } = ans;
    if (form === 'frac') {
      [[n + 1, d], [n - 1, d], [n, d + 1], [n, d - 1], [d - n, d], [n + 2, d], [n, d + 2], [n + 1, d + 1], [n - 1, d - 1], [n + 3, d], [1, d], [n, 2 * d]].forEach(push);
    } else {
      const v = ans;
      [frac(1, 10), frac(1, 20), frac(1, 100), frac(2, 10), frac(3, 100), frac(15, 100), frac(5, 100)].forEach((s) => { push(v.add(s)); push(v.sub(s)); });
    }
  }
  return out;
}

/** Plain number distractors (counts), positive integers distinct from ans. */
export function countOpts(ans, cands) {
  const seen = new Set([ans]);
  const out = [];
  const push = (v) => {
    if (!Number.isFinite(v) || v < 0 || !Number.isInteger(Math.round(v * 1e6) / 1e6)) return;
    v = Math.round(v);
    if (seen.has(v)) return;
    seen.add(v); out.push(num(v));
  };
  cands.forEach(push);
  [1, -1, 2, -2, 5, -5, 10, -10, 3, -3].forEach((s) => push(ans + s));
  return out;
}

/** Pick a / an. */
export const an = (word) => (/^([aeiou]|8|11\b|18\b|11[^\d]|18[^\d])/i.test(String(word)) || /^(8\d*|11|18)$/.test(String(word)) ? 'an' : 'a');
/** 'a 7', 'an 8', 'an orange' */
export const aWord = (w) => `${an(w)} ${w}`;

/** Random choice of probability form, biased by difficulty. */
export const pickForm = (rng, forms) => pick(rng, forms);

/** Join a list in English: a, b and c. */
export const listAnd = (xs, last = 'and') => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} ${last} ${xs[xs.length - 1]}`);

