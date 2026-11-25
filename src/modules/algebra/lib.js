// Small expression toolkit for the algebra generators.
// Polynomials in one variable are coefficient arrays, highest power first: [1, -3, 2] = x² − 3x + 2.
import { Frac, frac, poly, terms, tnum, gcd, gen, buildOptions } from '../../core.js';

/* ------------------------------------------------------------------ */
/* Archetype registration with internal retries                        */
/* ------------------------------------------------------------------ */

/** Retry statistics (id -> {calls, retries}) so a developer script can spot archetypes that reject too often. */
export const RETRY_STATS = new Map();

/** In prose (outside $…$ and outside HTML tags), write negative numbers with a true minus sign: "-3" -> "−3". */
function proseMinus(s) {
  if (typeof s !== 'string') return s;
  return s.split(/(\$[^$]*\$|<[^>]*>)/).map((part, i) => (i % 2 ? part : part.replace(/(^|[\s(\[,;:"])-(?=\d)/g, '$1−'))).join('');
}
function tidyProse(q) {
  return {
    ...q,
    prompt: proseMinus(q.prompt),
    answer: proseMinus(q.answer),
    distractors: (q.distractors || []).map(proseMinus),
    solution: (q.solution || []).map(proseMinus),
    hint: q.hint && proseMinus(q.hint),
  };
}

/**
 * Like core gen(), but the build may `throw` (or produce too few distinct options) and is simply re-run with the
 * same rng stream, so an unlucky parameter set never surfaces. Deterministic for a given seed.
 */
export function G(id, skill, build, meta = {}) {
  const wrapped = (rng, d) => {
    const st = RETRY_STATS.get(id) || { calls: 0, retries: 0 };
    RETRY_STATS.set(id, st);
    st.calls += 1;
    let last;
    for (let i = 0; i < 80; i += 1) {
      try {
        const q = tidyProse(build(rng, d));
        // Make sure enough distinct options exist before handing over.
        buildOptions(() => 0.5, q.answer, q.distractors || [], { count: q.count ?? 5, allowEquivalent: q.allowEquivalent, fill: q.fill ?? false });
        return q;
      } catch (e) { last = e; st.retries += 1; }
    }
    throw last;
  };
  return gen(id, skill, wrapped, meta);
}

/* ------------------------------------------------------------------ */
/* Polynomial arithmetic                                               */
/* ------------------------------------------------------------------ */

const isF = (c) => c instanceof Frac;
const addC = (a, b) => (isF(a) || isF(b) ? Frac.of(a).add(b) : a + b);
const mulC = (a, b) => (isF(a) || isF(b) ? Frac.of(a).mul(b) : a * b);
const zeroC = (c) => (isF(c) ? c.n === 0 : c === 0);
const valC = (c) => (isF(c) ? c.value() : c);

/** Strip leading zero coefficients (keeps at least one). */
export function trim(p) {
  let i = 0;
  while (i < p.length - 1 && zeroC(p[i])) i += 1;
  return p.slice(i);
}
export function padd(a, b) {
  const n = Math.max(a.length, b.length);
  const A = [...Array(n - a.length).fill(0), ...a];
  const B = [...Array(n - b.length).fill(0), ...b];
  return trim(A.map((c, i) => addC(c, B[i])));
}
export const pscale = (a, k) => trim(a.map((c) => mulC(c, k)));
export const psub = (a, b) => padd(a, pscale(b, -1));
export function pmul(a, b) {
  const out = Array(a.length + b.length - 1).fill(0);
  a.forEach((x, i) => b.forEach((y, j) => { out[i + j] = addC(out[i + j], mulC(x, y)); }));
  return trim(out);
}
/** Product of many polynomials. */
export const pprod = (...ps) => ps.reduce((acc, p) => pmul(acc, p), [1]);
export const peval = (p, x) => p.reduce((acc, c) => acc * x + valC(c), 0);
export const peq = (a, b) => {
  const A = trim(a); const B = trim(b);
  return A.length === B.length && A.every((c, i) => Math.abs(valC(c) - valC(B[i])) < 1e-9);
};
/** TeX for a polynomial array. */
export const P = (p, v = 'x') => poly(trim(p), v);

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

/** "ax + b" */
export const lin = (a, b, v = 'x') => poly([a, b], v);
/** "(ax + b)" */
export const br = (a, b, v = 'x') => `(${poly([a, b], v)})`;
/** Coefficient in front of a bracket: 1 -> "", -1 -> "-", 3 -> "3". */
export const coefTex = (k) => (k === 1 ? '' : k === -1 ? '-' : tnum(k));
/**
 * Factorised form: k × (a1 x + b1)(a2 x + b2)… ; repeated identical factors become (..)^{2}.
 * factors: [[a, b], ...]. A factor [1, 0] prints as "x".
 */
export function factored(k, factors, v = 'x') {
  const parts = [];
  const seen = [];
  for (const f of factors) {
    const key = f.join(',');
    const prev = seen.find((s) => s.key === key);
    if (prev) prev.n += 1; else seen.push({ key, f, n: 1 });
  }
  // Monomial factors (x) go first, as people write them.
  seen.sort((a, b) => (a.f[1] === 0 ? -1 : 0) - (b.f[1] === 0 ? -1 : 0));
  for (const { f, n } of seen) {
    const isMono = f[1] === 0;
    const body = isMono ? poly([f[0], 0], v) : br(f[0], f[1], v);
    if (isMono) parts.push(n > 1 ? `${body}^{${n}}` : body);
    else parts.push(n > 1 ? `${body}^{${n}}` : body);
  }
  return `${coefTex(k)}${parts.join('')}`;
}
/** Plain typed form of TeX: "x^{2} - 3x" -> "x^2-3x". */
export const plainTyped = (tex) => tex.replace(/\^\{(\d+)\}/g, '^$1').replace(/\s+/g, '');
/** typed spec for a factorised answer, accepting the factors in any order (and (x+a)(x+a) for squares). */
export function typedFactors(k, factors, v = 'x') {
  const perms = (arr) => (arr.length <= 1 ? [arr] : arr.flatMap((f, i) => perms([...arr.slice(0, i), ...arr.slice(i + 1)]).map((p) => [f, ...p])));
  const accept = new Set();
  for (const p of perms(factors)) {
    const body = p.map((f) => (f[1] === 0 ? poly([f[0], 0], v) : br(f[0], f[1], v))).join('');
    accept.add(plainTyped(`${coefTex(k)}${body}`));
    accept.add(plainTyped(`${coefTex(k)}${body.replace(/\)\(/g, ')*(')}`));
  }
  accept.add(plainTyped(factored(k, factors, v)));
  return { kind: 'text', accept: [...accept] };
}
/** Expand k·Π(a x + b) to a coefficient array. */
export const expandFactors = (k, factors) => pscale(pprod(...factors), k);

/** Monomial: mono(3, [['x', 2], ['y', 1]]) -> "3x^{2}y". */
export function monoVars(vars) {
  return vars.filter(([, p]) => p !== 0).map(([l, p]) => (p === 1 ? l : `${l}^{${p}}`)).join('');
}
export const mono = (c, vars) => terms([[c, monoVars(vars)]]);
/** Sum of monomials: [[c, [['x',2]]], ...] */
export const monos = (list) => terms(list.map(([c, vars]) => [c, monoVars(vars)]));

/** TeX number or Frac. */
export const tv = (v) => (v instanceof Frac ? v.tex() : tnum(v));
/** $...$ wrapper */
export const $ = (s) => `$${s}$`;
/** \frac{a}{b} */
export const tf = (a, b) => `\\frac{${a}}{${b}}`;
/** Fraction value as TeX with a leading variable: "x = 3" etc. */
export const eqv = (v, x = 'x') => `${x} = ${tv(v)}`;
/** Answer "x = a or x = b" (sorted, larger first optional). */
export function rootsText(roots, v = 'x') {
  const rs = [...roots];
  if (rs.length === 1) return `$${v} = ${tv(rs[0])}$`;
  return rs.map((r) => `$${v} = ${tv(r)}$`).join(' or ');
}
/** Make a rational or integer value from n/d (reduced, integer if possible). */
export const rat = (n, d = 1) => {
  const f = frac(n, d);
  return f.isInt ? f.n : f;
};
export const ratVal = (v) => (v instanceof Frac ? v.value() : v);

/** Signed term for working: "+ 3x" / "- 3x" */
export const sgn = (c, v = '') => (c < 0 ? `- ${c === -1 && v ? '' : tnum(-c)}${v}` : `+ ${c === 1 && v ? '' : tnum(c)}${v}`);

/** Format an integer coefficient times a variable, no leading +: kx(3,'x') -> "3x", kx(-1,'x') -> "-x". */
export const kx = (c, v = 'x') => terms([[c, v]]);

/** Distinct non-zero integer values. */
export const distinctInts = (xs) => [...new Set(xs)];

/** HCF of a list of integers (absolute). */
export const hcfList = (xs) => xs.reduce((g, x) => gcd(g, x), 0);

/** Remove distractor strings equal to the answer or each other (buildOptions does this too, but this also lets
 * callers drop candidates by a predicate). */
export const keep = (list, pred = () => true) => list.filter((x) => x !== undefined && x !== null && pred(x));

/** Inequality symbols in TeX. */
export const INEQ = { '<': '<', '>': '>', '<=': '\\leq', '>=': '\\geq' };
export const flipIneq = { '<': '>', '>': '<', '<=': '>=', '>=': '<=' };
export const strictOf = { '<': '<', '>': '>', '<=': '<', '>=': '>' };
export const nonStrictOf = { '<': '<=', '>': '>=', '<=': '<=', '>=': '>=' };

/** Pretty list of numbers for prose: "−2, −1, 0 and 1" */
export function listTex(values) {
  return values.map((v) => tnum(v)).join(', ');
}

/** Square-root simplification: sqrt(n) = k√m. Returns [k, m]. */
export function surd(n) {
  let k = 1;
  for (let d = 2; d * d <= n; d += 1) while (n % (d * d) === 0) { n /= d * d; k *= d; }
  return [k, n];
}
