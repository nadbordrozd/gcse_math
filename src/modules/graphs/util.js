// Small formatting helpers shared by the graphs module generators.
import { Frac, frac, terms, tnum, num, gcd, gen, buildOptions } from '../../core.js';

/**
 * gen() with a built-in retry loop: if build throws, or its options could not be built, try again with the
 * (advanced) rng. Keeps generators deterministic while letting them reject unsuitable random parameters.
 */
export function G(id, skill, build, meta = {}) {
  return gen(id, skill, (rng, d) => {
    let last;
    for (let i = 0; i < 100; i += 1) {
      try {
        const data = build(rng, d);
        // core's numeric fillers mangle negative TeX answers ("$-25$" -> "$--24$"), so supply our own.
        const neg = String(data.answer).match(/^\$(-\d+(?:\.\d+)?)\$(.*)$/);
        if (neg && data.fill !== false) {
          const v = Number(neg[1]); const dp = (neg[1].split('.')[1] || '').length; const step = 10 ** -dp;
          const extra = [1, -1, 2, -2, 3, -3, 4, 5].map((k) => `$${tnum(Number((v + k * step).toFixed(dp)))}$${neg[2]}`);
          data.distractors = [...(data.distractors || []), ...extra];
        }
        buildOptions(() => 0.5, data.answer, data.distractors || [], {
          count: data.count ?? 5, allowEquivalent: data.allowEquivalent, keepOrder: data.keepOrder, fill: data.fill ?? true,
        });
        return data;
      } catch (e) { last = e; }
    }
    throw last;
  }, meta);
}

/** Number or Frac -> Frac. */
export const F = (x) => (x instanceof Frac ? x : frac(x));
/** Number or Frac -> TeX (fractions as \frac). */
export const ftex = (x) => (x instanceof Frac ? x.tex() : tnum(x));
/** Number or Frac -> plain value. */
export const fval = (x) => (x instanceof Frac ? x.value() : x);
/** Coordinate pair as TeX (no $): (3, -2). */
export const pt = (x, y) => `(${ftex(x)}, ${ftex(y)})`;
/** Coordinate pair wrapped in $ for prompts/options. */
export const P = (x, y) => `$${pt(x, y)}$`;
/** Linear expression mx + c as TeX. */
export const lin = (m, c, v = 'x') => terms([[F(m), v], [F(c), '']]);
/** y = mx + c as TeX (no $). */
export const yeq = (m, c, v = 'x') => `y = ${lin(m, c, v)}`;
/** Simplest fraction n/d as Frac. */
export const fr = (n, d = 1) => frac(n, d);

/** Plain-text renderings of a Frac/number for typed accept lists. */
function plainForms(c) {
  const f = F(c);
  const out = [f.d === 1 ? String(f.n) : `${f.n}/${f.d}`];
  const v = f.value();
  if (f.d !== 1 && Number.isFinite(v) && String(v).length <= 6) out.push(String(v));
  return out;
}

/**
 * Accept list for a linear expression m·v + c (typed 'text' answers), with an optional left-hand side like 'y='.
 * Produces forms like 3x+2, 2+3x, y=3x+2, x/2+3, 0.5x+3, -x+4, 4-x.
 */
export function linAccept(m, c, v = 'x', lhs = '') {
  const M = F(m); const C = F(c);
  const coefForms = [];
  if (M.n === 0) coefForms.push(null);
  else if (M.eq(1)) coefForms.push(v);
  else if (M.eq(-1)) coefForms.push(`-${v}`);
  else {
    for (const s of plainForms(M)) coefForms.push(`${s}${v}`);
    if (M.d !== 1) {
      const a = Math.abs(M.n);
      const sg = M.n < 0 ? '-' : '';
      coefForms.push(`${sg}${a === 1 ? '' : a}${v}/${M.d}`);
      coefForms.push(`${sg}(${a}/${M.d})${v}`);
    }
  }
  const out = new Set();
  for (const mt of coefForms) {
    for (const cs of plainForms(C)) {
      const cNum = C.n;
      let a; let b;
      if (mt === null) { a = cs; b = cs; } else if (cNum === 0) { a = mt; b = mt; } else {
        a = `${mt}${cNum > 0 ? '+' : ''}${cs}`;
        b = mt.startsWith('-') ? `${cs}${mt}` : `${cs}+${mt}`;
      }
      for (const form of [a, b]) {
        out.add(form);
        if (lhs) out.add(`${lhs}${form}`);
      }
    }
  }
  return [...out];
}

/** TeX for a fraction-or-int gradient written in lowest terms, from rise/run integers. */
export const ratio = (rise, run) => fr(rise, run);

/** True when a fraction has a short terminating decimal (for sensible decimal forms). */
export const terminates = (f) => {
  let d = F(f).d;
  for (const p of [2, 5]) while (d % p === 0) d /= p;
  return d === 1;
};

/** Format a list of numbers as plain text for options: 3, 7, 11 */
export const listText = (vals) => vals.map((v) => num(v)).join(', ');
/** Format a list in TeX: $3, 7, 11$ */
export const listTex = (vals) => `$${vals.map((v) => tnum(v)).join(',\\ ')}$`;

export { gcd };

/** \frac{n}{d} = simplified, skipping the "=" when nothing simplifies (no $). */
export const fracEq = (n, d) => { const f = frac(n, d); const raw = `\\frac{${n}}{${d}}`; return f.n === n && f.d === d ? raw : `${raw} = ${f.tex()}`; };

/** TeX option for a number or Frac: T(-3) -> "$-3$". */
export const T = (x) => `$${ftex(x)}$`;
/** Distinct strings, excluding the answer. */
export const uniq = (arr, answer = null) => [...new Set(arr.filter((x) => x !== null && x !== undefined).map(String))].filter((x) => x !== String(answer));
/** Display a sequence in TeX: $7,\quad 10,\quad 13,\quad \dots$ */
export const seqTex = (vals, { dots = true, gap = '\\quad ' } = {}) => `$${vals.map((v) => (typeof v === 'string' ? v : ftex(v))).join(`,\\ ${gap}`)}${dots ? `,\\ ${gap}\\dots` : ''}$`;
/** Typed accept forms for a quadratic an^2 + bn + c in variable v (integer coefficients). */
export function quadAccept(a, b, c, v = 'n') {
  const out = new Set();
  const lead = (k) => (k === 1 ? '' : k === -1 ? '-' : String(k));
  const tail = (k, s) => (k === 0 ? '' : `${k > 0 ? '+' : '-'}${Math.abs(k) === 1 && s ? '' : Math.abs(k)}${s}`);
  for (const sq of [`${v}^2`, `${v}²`]) {
    out.add(`${lead(a)}${sq}${tail(b, v)}${tail(c, '')}`);
    out.add(`${lead(a)}${sq}${tail(c, '')}${tail(b, v)}`);
  }
  return [...out];
}
