// Number module – unit "Surds" (Higher).
import { pick, int, sample, shuffle, size, chance, gcd, lcm, frac, Frac, largestSquareFactor, tnum } from '../../core.js';
import { gen, uniq } from './util.js';

const SQUAREFREE = [2, 3, 5, 6, 7, 10, 11, 13, 14, 15];

/** TeX for p + q√b (p, q integers or Fracs), e.g. "3 - 2\sqrt{5}", "\frac{4 + \sqrt{3}}{2}". */
export function surdTex(p, q, b) {
  p = Frac.of(p); q = Frac.of(q);
  const D = lcm(p.d, q.d);
  const P = p.n * (D / p.d); const Q = q.n * (D / q.d);
  const qTerm = (Qv, lead) => {
    if (Qv === 0) return '';
    const a = Math.abs(Qv);
    const body = `${a === 1 ? '' : a}\\sqrt{${b}}`;
    if (lead) return Qv < 0 ? `-${body}` : body;
    return Qv < 0 ? ` - ${body}` : ` + ${body}`;
  };
  let top;
  if (P === 0 && Q === 0) top = '0';
  else if (P === 0) top = qTerm(Q, true);
  else top = `${tnum(P)}${qTerm(Q, false)}`;
  if (D === 1) return top;
  if (P === 0 && Q !== 0 && Q > 0) return `\\frac{${top}}{${D}}`;
  return `\\frac{${top}}{${D}}`;
}
const S = (p, q, b) => `$${surdTex(p, q, b)}$`;
const kRoot = (k, b) => (k === 1 ? `\\sqrt{${b}}` : `${k}\\sqrt{${b}}`);

/* ================================================================== */
/* num-surds-simplify                                                  */
/* ================================================================== */

export const simplifySurd = gen('num-surds-simplify-basic', 'num-surds-simplify', (rng, d) => {
  const k = size(d, pick(rng, [2, 3, 4, 5]), pick(rng, [4, 5, 6, 7, 8]), pick(rng, [4, 5, 6, 7, 10]));
  const inner = pick(rng, size(d, [2, 3, 5, 6, 7], [2, 3, 5, 6, 7], [2, 3, 5, 6, 7, 10, 11]));
  const n = k * k * inner;
  const coef = d === 'hard' ? pick(rng, [2, 3]) : 1;
  const ans = `$${coef * k}\\sqrt{${inner}}$`;
  const expr = coef === 1 ? `\\sqrt{${n}}` : `${coef}\\sqrt{${n}}`;
  // Plausible slips: halving instead of square-rooting, forgetting the coefficient, a smaller square factor.
  const other = largestSquareFactor(n) !== k ? largestSquareFactor(n) : 1;
  const partial = [2, 3].find((s) => k % s === 0 && s < k);
  return {
    prompt: `Write $${expr}$ in the form $a\\sqrt{b}$, where $a$ and $b$ are integers and $b$ is as small as possible.`,
    answer: ans,
    distractors: uniq([
      `$${coef * k * k}\\sqrt{${inner}}$`, `$${coef * inner}\\sqrt{${k * k}}$`, coef > 1 ? `$${k}\\sqrt{${inner}}$` : null,
      partial ? `$${coef * partial}\\sqrt{${n / (partial * partial)}}$` : null, `$${coef * k}\\sqrt{${inner * 2}}$`, `$${coef * other}\\sqrt{${n / (other * other)}}$`,
      `$${inner}\\sqrt{${k}}$`, `$${coef * k + 1}\\sqrt{${inner}}$`, `$${coef * (k * k) / 2}\\sqrt{${inner}}$`, `$${coef * k}\\sqrt{${inner + k}}$`,
    ].filter((t) => t && !/\.|sqrt\{1\}|^\$1\\sqrt/.test(t)), ans),
    solution: [
      `Look for the largest <b>square number</b> that divides ${n}: it is ${k * k}.`,
      `$\\sqrt{${n}} = \\sqrt{${k * k} \\times ${inner}} = \\sqrt{${k * k}} \\times \\sqrt{${inner}} = ${k}\\sqrt{${inner}}$`,
      ...(coef > 1 ? [`Multiply by the ${coef} in front: $${coef} \\times ${k}\\sqrt{${inner}} = ${coef * k}\\sqrt{${inner}}$`] : []),
      ...(partial ? [`(Using a smaller square such as ${partial * partial} leaves a surd that can still be simplified.)`] : []),
      `Answer: ${ans}`,
    ],
  };
}, { title: 'Simplify √n to a√b' });

export const surdInside = gen('num-surds-simplify-inside', 'num-surds-simplify', (rng, d) => {
  const k = int(rng, 2, size(d, 5, 7, 9)); const b = pick(rng, SQUAREFREE.slice(0, size(d, 5, 7, 10)));
  const n = k * k * b;
  const ans = `$\\sqrt{${n}}$`;
  return {
    prompt: `Write $${k}\\sqrt{${b}}$ in the form $\\sqrt{n}$.`,
    answer: ans,
    distractors: uniq([`$\\sqrt{${k * b}}$`, `$\\sqrt{${2 * k * b}}$`, `$\\sqrt{${k + b}}$`, `$\\sqrt{${k * b * b}}$`, `$\\sqrt{${k * k + b}}$`, `$\\sqrt{${(k + 1) * (k + 1) * b}}$`], ans),
    typed: { kind: 'text', accept: [`sqrt${n}`, `sqrt(${n})`, `√${n}`, `√(${n})`] },
    solution: [
      `Write ${k} as a square root: $${k} = \\sqrt{${k * k}}$.`,
      `$${k}\\sqrt{${b}} = \\sqrt{${k * k}} \\times \\sqrt{${b}} = \\sqrt{${k * k} \\times ${b}} = \\sqrt{${n}}$`,
      `Answer: ${ans} (not $\\sqrt{${k * b}}$ – the ${k} must be squared to go inside)`,
    ],
  };
}, { title: 'Write a√b as √n' });

export const surdCompare = gen('num-surds-compare', 'num-surds-simplify', (rng, d) => {
  for (;;) {
    const items = [];
    const seen = new Set();
    const target = int(rng, size(d, 20, 40, 60), size(d, 60, 120, 250));
    while (items.length < 5) {
      const b = pick(rng, SQUAREFREE.slice(0, 8)); const k = int(rng, 1, 7);
      const sq = k * k * b;
      if (Math.abs(sq - target) > target * 0.5 || seen.has(sq)) continue;
      seen.add(sq); items.push({ k, b, sq, tex: `$${kRoot(k, b)}$` });
    }
    const wantMax = chance(rng);
    const best = items.reduce((p, c) => ((wantMax ? c.sq > p.sq : c.sq < p.sq) ? c : p));
    if (items.filter((it) => it.k === 1).length > 2) continue;
    return {
      prompt: `Which of these numbers is the <b>${wantMax ? 'largest' : 'smallest'}</b>?<br>${items.map((it) => it.tex).join(",&nbsp;&nbsp; ")}`,
      answer: best.tex,
      distractors: items.filter((it) => it !== best).map((it) => it.tex),
      solution: [
        'Write each number as a single square root by moving the whole number inside: $a\\sqrt{b} = \\sqrt{a^{2}b}$.',
        items.map((it) => `${it.tex} $= \\sqrt{${it.sq}}$`).join(', '),
        `The ${wantMax ? 'largest' : 'smallest'} is $\\sqrt{${best.sq}}$ = ${best.tex}.`,
        `Answer: ${best.tex}`,
      ],
    };
  }
}, { title: 'Compare surds' });

/* ================================================================== */
/* num-surds-operations                                                */
/* ================================================================== */

export const surdAdd = gen('num-surds-add', 'num-surds-operations', (rng, d) => {
  const b = pick(rng, size(d, [2, 3, 5], [2, 3, 5, 6, 7], [2, 3, 5, 6, 7, 10]));
  const k1 = int(rng, 2, size(d, 4, 5, 7)); let k2 = int(rng, 1, size(d, 3, 4, 6));
  if (k1 === k2) k2 += 1;
  const three = d === 'hard' && chance(rng, 0.5);
  const k3 = three ? int(rng, 1, 4) : 0;
  const sub = chance(rng, 0.4);
  const c1 = d === 'hard' ? int(rng, 1, 3) : 1;
  const total = c1 * k1 + (sub ? -k2 : k2) + k3;
  if (total <= 0) throw new Error('retry');
  const n1 = k1 * k1 * b; const n2 = k2 * k2 * b; const n3 = k3 * k3 * b;
  const ans = `$${kRoot(total, b)}$`;
  const naive = Math.round(Math.sqrt(n1 + (sub ? -n2 : n2) + n3));
  return {
    prompt: `Simplify $${c1 > 1 ? c1 : ''}\\sqrt{${n1}} ${sub ? '-' : '+'} \\sqrt{${n2}}${three ? ` + \\sqrt{${n3}}` : ''}$<br>Give your answer in the form $a\\sqrt{b}$.`,
    answer: ans,
    distractors: uniq([`$\\sqrt{${n1 + (sub ? -n2 : n2) + n3}}$`, `$${kRoot(c1 * k1 + (sub ? k2 : -k2) + k3, b)}$`, `$${kRoot(total + 1, b)}$`, `$${kRoot(total, b * 2)}$`, `$${kRoot(Math.max(2, total - 1), b)}$`, naive * naive === n1 + n2 ? null : `$${kRoot(c1 * k1 * k2, b)}$`].filter((s) => s && !/\{-|\$-|\$0/.test(s)), ans),
    solution: [
      'You can only add or subtract surds when the number under the root is the same, so simplify each one first.',
      [`$\\sqrt{${n1}} = ${kRoot(k1, b)}$`, `$\\sqrt{${n2}} = ${kRoot(k2, b)}$`, three ? `$\\sqrt{${n3}} = ${kRoot(k3, b)}$` : null].filter(Boolean).join(', '),
      `$${c1 > 1 ? `${c1} \\times ` : ''}${kRoot(k1, b)} ${sub ? '-' : '+'} ${kRoot(k2, b)}${three ? ` + ${kRoot(k3, b)}` : ''} = ${kRoot(total, b)}$ (collect them like $x$ terms)`,
      `Answer: ${ans}.${c1 === 1 && !three && !sub ? ` Note $\\sqrt{${n1}} + \\sqrt{${n2}}$ is <b>not</b> $\\sqrt{${n1 + n2}}$.` : ''}`,
    ],
  };
}, { title: 'Add and subtract surds' });

export const surdMultiply = gen('num-surds-multiply', 'num-surds-operations', (rng, d) => {
  const type = pick(rng, size(d, ['same', 'simple', 'square'], ['simple', 'square', 'coef'], ['coef', 'triple', 'coef']));
  let prompt; let p = 0; let q = 0; let b = 1; let wrongs = []; let steps;
  if (type === 'same') { const n = pick(rng, SQUAREFREE); const c = int(rng, 2, 5); prompt = `$${c}\\sqrt{${n}} \\times \\sqrt{${n}}$`; p = c * n; wrongs = [[c * n * n, 0], [0, c], [c, 0], [2 * c * n, 0]]; steps = [`$\\sqrt{${n}} \\times \\sqrt{${n}} = ${n}$`, `$${c} \\times ${n} = ${p}$`]; }
  else if (type === 'square') { const c = int(rng, 2, 6); const n = pick(rng, SQUAREFREE); prompt = `$(${c}\\sqrt{${n}})^{2}$`; p = c * c * n; wrongs = [[c * n, 0], [2 * c * n, 0], [c * c, 0], [0, c * c]]; b = n; steps = [`$(${c}\\sqrt{${n}})^{2} = ${c}^{2} \\times (\\sqrt{${n}})^{2}$`, `$= ${c * c} \\times ${n} = ${p}$ (don't forget to square the ${c})`]; }
  else {
    // √x × √y = k√r
    for (;;) {
      const x = pick(rng, [2, 3, 5, 6, 7, 10, 12, 15, 14, 21]); const y = pick(rng, [2, 3, 5, 6, 8, 10, 12, 15, 20, 18]);
      const c1 = type === 'coef' ? int(rng, 2, 4) : 1; const c2 = type === 'coef' ? int(rng, 1, 3) : 1;
      const z = type === 'triple' ? pick(rng, [2, 3, 5, 6, 10]) : 1;
      const prod = x * y * z;
      const k = largestSquareFactor(prod); const r = prod / (k * k);
      if (k === 1 || x === y) continue;
      b = r; q = c1 * c2 * k;
      if (r === 1) { p = q; q = 0; }
      prompt = type === 'triple' ? `$\\sqrt{${x}} \\times \\sqrt{${y}} \\times \\sqrt{${z}}$` : `$${c1 > 1 ? c1 : ''}\\sqrt{${x}} \\times ${c2 > 1 ? c2 : ''}\\sqrt{${y}}$`;
      wrongs = [[0, c1 * c2 * k + 1], [0, (c1 + c2) * k], [c1 * c2 * prod, 0], [0, c1 * c2]];
      steps = [`Multiply under the root: $\\sqrt{${x}} \\times \\sqrt{${y}}${z > 1 ? ` \\times \\sqrt{${z}}` : ''} = \\sqrt{${prod}}$${c1 * c2 > 1 ? `, and the numbers in front: $${c1} \\times ${c2} = ${c1 * c2}$` : ''}.`,
        `Simplify: $\\sqrt{${prod}} = \\sqrt{${k * k} \\times ${r}} = ${r === 1 ? k : kRoot(k, r)}$${c1 * c2 > 1 ? `, so the answer is $${c1 * c2} \\times ${r === 1 ? k : kRoot(k, r)}$` : ''}`];
      wrongs.push([0, 0], [0, 0]);
      break;
    }
  }
  const fmt = (pp, qq) => (qq === 0 || b === 1 ? `$${tnum(b === 1 ? pp + qq : pp)}$` : `$${surdTex(pp, qq, b)}$`);
  const ans = fmt(p, q);
  return {
    prompt: `Work out ${prompt}<br>Give your answer in its simplest form.`,
    answer: ans,
    distractors: uniq([...wrongs.filter(([pp, qq]) => pp > 0 || qq > 0).map(([pp, qq]) => fmt(pp, qq)), fmt(p + 1, q), q ? fmt(0, q * 2) : fmt(p * 2, 0), q ? fmt(q, 0) : fmt(p - 1, 0)].filter((s) => !/\$0\$|\$-/.test(s)), ans),
    solution: [...steps, `Answer: ${ans}`],
  };
}, { title: 'Multiply surds' });

export const surdExpand = gen('num-surds-expand', 'num-surds-operations', (rng, d) => {
  const b = pick(rng, size(d, [2, 3, 5], [2, 3, 5, 7], [2, 3, 5, 6, 7, 10]));
  const type = pick(rng, size(d, ['single', 'diffSq'], ['double', 'square', 'diffSq'], ['double', 'square', 'coefDouble']));
  let a; let c; let s1 = 1; let s2 = 1; let m1 = 1; let m2 = 1; let prompt; let p; let q;
  if (type === 'single') {
    a = int(rng, 2, 6); c = int(rng, 1, 5) * (chance(rng) ? 1 : -1);
    const cAbs = Math.abs(c); const cT = cAbs === 1 ? '' : cAbs;
    prompt = `$\\sqrt{${b}}(${a} ${c < 0 ? '-' : '+'} ${cT}\\sqrt{${b}})$`;
    p = c * b; q = a;
    return finish(`Multiply each term in the bracket by $\\sqrt{${b}}$: $${a} \\times \\sqrt{${b}} = ${a}\\sqrt{${b}}$ and $${c < 0 ? '-' : ''}${cT}\\sqrt{${b}} \\times \\sqrt{${b}} = ${c < 0 ? '-' : ''}${cT ? `${cAbs} \\times ` : ''}${b}${cT ? ` = ${c < 0 ? '-' : ''}${cAbs * b}` : ''}$`, [[p, -q], [a + c, 0], [0, a + c], [c * b * b, q], [c, q]]);
  }
  a = int(rng, 1, 7); c = int(rng, 1, 7);
  if (type === 'diffSq') { prompt = `$(${a} + \\sqrt{${b}})(${a} - \\sqrt{${b}})$`; p = a * a - b; q = 0; return finish(`The $\\sqrt{${b}}$ terms cancel: $${a}\\sqrt{${b}} - ${a}\\sqrt{${b}} = 0$. You are left with $${a}^{2} - (\\sqrt{${b}})^{2} = ${a * a} - ${b}$`, [[a * a + b, 0], [a * a - b, 2 * a], [a * a - b * b, 0], [a * a, -b]]); }
  if (type === 'square') { s1 = chance(rng) ? 1 : -1; prompt = `$(${a} ${s1 < 0 ? '-' : '+'} \\sqrt{${b}})^{2}$`; p = a * a + b; q = 2 * a * s1; return finish(`$(${a} ${s1 < 0 ? '-' : '+'} \\sqrt{${b}})(${a} ${s1 < 0 ? '-' : '+'} \\sqrt{${b}}) = ${a * a} ${s1 < 0 ? '-' : '+'} ${a}\\sqrt{${b}} ${s1 < 0 ? '-' : '+'} ${a}\\sqrt{${b}} + ${b}$`, [[a * a + b, 0], [a * a + b * b, q], [a * a + b, q / 2], [a * a - b, q]]); }
  s1 = chance(rng) ? 1 : -1; s2 = chance(rng) ? 1 : -1;
  if (type === 'coefDouble') { m1 = int(rng, 1, 3); m2 = int(rng, 2, 3); }
  // (a + s1 m1 √b)(c + s2 m2 √b) = ac + s1 s2 m1 m2 b + (a s2 m2 + c s1 m1)√b
  p = a * c + s1 * s2 * m1 * m2 * b; q = a * s2 * m2 + c * s1 * m1;
  if (q === 0) throw new Error('retry');
  const term = (s, m) => `${s < 0 ? '-' : '+'} ${m === 1 ? '' : m}\\sqrt{${b}}`;
  prompt = `$(${a} ${term(s1, m1)})(${c} ${term(s2, m2)})$`;
  return finish(`Multiply every term: $${a} \\times ${c} = ${a * c}$, $${a} \\times ${s2 < 0 ? '-' : ''}${m2 === 1 ? '' : m2}\\sqrt{${b}} = ${s2 * a * m2}\\sqrt{${b}}$, $${s1 < 0 ? '-' : ''}${m1 === 1 ? '' : m1}\\sqrt{${b}} \\times ${c} = ${s1 * c * m1}\\sqrt{${b}}$, and $${s1 < 0 ? '-' : ''}${m1 === 1 ? '' : m1}\\sqrt{${b}} \\times ${s2 < 0 ? '-' : ''}${m2 === 1 ? '' : m2}\\sqrt{${b}} = ${s1 * s2 * m1 * m2 * b}$`,
    [[a * c - s1 * s2 * m1 * m2 * b, q], [a * c + s1 * s2 * m1 * m2, q], [a * c + s1 * s2 * m1 * m2 * b, -q], [a * c, s1 * s2 * m1 * m2 * b + q], [a * c + s1 * s2 * m1 * m2 * b * b, q]]);

  function finish(step, wrongPairs) {
    const fmt = (pp, qq) => `$${surdTex(pp, qq, b)}$`;
    const ans = fmt(p, q);
    return {
      prompt: `Expand and simplify ${prompt}<br>Give your answer in the form $a + b\\sqrt{${b}}$${q === 0 ? ' (where $b$ may be zero)' : ''}.`,
      answer: ans,
      distractors: uniq([...wrongPairs.map(([x, y]) => fmt(x, y)), fmt(p + 1, q), fmt(p, q + 1), fmt(-p, q)], ans),
      solution: [
        'Expand the brackets as in algebra, remembering that $\\sqrt{' + b + '} \\times \\sqrt{' + b + '} = ' + b + '$.',
        step,
        `Collect the whole numbers and the surds: ${ans}`,
        `Answer: ${ans}`,
      ],
    };
  }
}, { title: 'Expand brackets with surds' });

export const surdDivide = gen('num-surds-divide', 'num-surds-operations', (rng, d) => {
  for (;;) {
    const b = pick(rng, SQUAREFREE.slice(0, 6));
    const k = int(rng, 2, 6); const c1 = d === 'easy' ? 1 : int(rng, 1, 4) * 2; const c2 = d === 'easy' ? 1 : pick(rng, [1, 2]);
    const r = pick(rng, [1, 1, 2, 3, 5].filter((x) => x !== b && gcd(x, b) === 1));
    // (c1 √(k² b r)) / (c2 √b) = (c1/c2) k √r
    const top = k * k * b * r;
    const coef = frac(c1 * k, c2);
    if (!coef.isInt) continue;
    const ans = r === 1 ? `$${coef.n}$` : `$${kRoot(coef.n, r)}$`;
    return {
      prompt: `Work out $\\dfrac{${c1 > 1 ? c1 : ''}\\sqrt{${top}}}{${c2 > 1 ? c2 : ''}\\sqrt{${b}}}$<br>Give your answer in its simplest form.`,
      answer: ans,
      distractors: uniq([r === 1 ? `$${kRoot(coef.n, b)}$` : `$${coef.n * k}$`, `$\\sqrt{${top / b}}$`.replace(/.*/, r === 1 ? `$${k * k * c1}$` : `$\\sqrt{${(top / b) * c1}}$`), r === 1 ? `$${coef.n + 1}$` : `$${kRoot(coef.n + 1, r)}$`, r === 1 ? `$${coef.n * 2}$` : `$${kRoot(coef.n, r * 2)}$`, `$${tnum(top / b)}$`, r === 1 ? `$${Math.max(2, coef.n - 1)}$` : `$${kRoot(k, r)}$`], ans),
      solution: [
        'Divide the numbers under the root signs: $\\dfrac{\\sqrt{x}}{\\sqrt{y}} = \\sqrt{\\dfrac{x}{y}}$.',
        `$\\dfrac{\\sqrt{${top}}}{\\sqrt{${b}}} = \\sqrt{${top / b}}${r === 1 ? ` = ${k}` : ` = ${kRoot(k, r)}`}$`,
        ...(c1 > 1 || c2 > 1 ? [`Then the numbers in front: $${c1} \\div ${c2} = ${tnum(c1 / c2)}$, giving $${tnum(c1 / c2)} \\times ${r === 1 ? k : kRoot(k, r)}$`] : []),
        `Answer: ${ans}`,
      ],
    };
  }
}, { title: 'Divide surds' });

/* ================================================================== */
/* num-surds-rationalise                                               */
/* ================================================================== */

export const ratSimple = gen('num-surds-rat-simple', 'num-surds-rationalise', (rng, d) => {
  const b = pick(rng, SQUAREFREE.slice(0, 7));
  const m = d === 'hard' ? int(rng, 2, 3) : 1;
  const kNum = size(d, b * int(rng, 1, 4), int(rng, 1, 12), int(rng, 2, 20));
  // kNum / (m √b) = kNum √b / (m b)
  const coef = frac(kNum, m * b);
  const ans = S(0, coef, b);
  return {
    prompt: `Rationalise the denominator of $\\dfrac{${kNum}}{${m > 1 ? m : ''}\\sqrt{${b}}}$<br>Give your answer in its simplest form.`,
    answer: ans,
    distractors: uniq([S(0, frac(kNum, m), b), S(0, frac(kNum * b, m), b), S(0, coef.mul(2), b), S(0, frac(kNum, m * b * b), b), S(0, frac(kNum + 1, m * b), b), S(0, coef.add(1), b)], ans),
    solution: [
      `Multiply the top and bottom by $\\sqrt{${b}}$ (this does not change the value, because $\\frac{\\sqrt{${b}}}{\\sqrt{${b}}} = 1$).`,
      `$\\dfrac{${kNum}}{${m > 1 ? m : ''}\\sqrt{${b}}} \\times \\dfrac{\\sqrt{${b}}}{\\sqrt{${b}}} = \\dfrac{${kNum}\\sqrt{${b}}}{${m * b}}$`,
      ...(coef.n !== kNum || coef.d !== m * b ? [`Simplify: $${surdTex(0, coef, b)}$`] : []),
      `Answer: ${ans}`,
    ],
  };
}, { title: 'Rationalise k/√b' });

export const ratConjugate = gen('num-surds-rat-conjugate', 'num-surds-rationalise', (rng, d) => {
  for (;;) {
    const b = pick(rng, size(d, [2, 3, 5], [2, 3, 5, 6, 7], [2, 3, 5, 6, 7, 10, 11]));
    const a = int(rng, 1, 5);
    const sgn = chance(rng) ? 1 : -1;
    const den = a * a - b; // (a + s√b)(a - s√b)
    if (den === 0) continue;
    const kNum = d === 'easy' ? Math.abs(den) * int(rng, 1, 3) : int(rng, 1, 12);
    // k/(a + s√b) = k(a - s√b)/den
    const p = frac(kNum * a, den); const q = frac(-sgn * kNum, den);
    if (d === 'medium' && (!p.isInt || !q.isInt) && chance(rng, 0.5)) continue;
    const ans = S(p, q, b);
    const conj = `${a} ${sgn > 0 ? '-' : '+'} \\sqrt{${b}}`;
    return {
      prompt: `Rationalise the denominator and simplify $\\dfrac{${kNum}}{${a} ${sgn > 0 ? '+' : '-'} \\sqrt{${b}}}$`,
      answer: ans,
      distractors: uniq([S(p, q.neg(), b), S(frac(kNum * a, a * a + b), q.mul(frac(den, a * a + b)), b), S(frac(kNum, a), frac(-sgn * kNum, b), b), S(p.neg(), q.neg(), b), S(frac(kNum * a, Math.abs(den) === 1 ? 2 * den : -den), q, b), S(p.add(1), q, b)], ans),
      solution: [
        `Multiply top and bottom by $${conj}$ (change the sign in the middle of the denominator).`,
        `Bottom: $(${a} ${sgn > 0 ? '+' : '-'} \\sqrt{${b}})(${conj}) = ${a}^{2} - ${b} = ${den}$ (the surds cancel).`,
        `Top: $${kNum}(${conj}) = ${surdTex(kNum * a, -sgn * kNum, b)}$, so the fraction is $\\dfrac{${surdTex(kNum * a, -sgn * kNum, b)}}{${den}}$`,
        `Simplify: ${ans}`,
      ],
    };
  }
}, { title: 'Rationalise k/(a ± √b)' });

export const ratCombined = gen('num-surds-rat-combined', 'num-surds-rationalise', (rng, d) => {
  for (;;) {
    // easy: (√(k²b) + c)/√b; medium: also minus signs and b = 5, 6, 7; hard: denominator m√b
    const b = pick(rng, size(d, [2, 3], [2, 3, 5, 6, 7], [2, 3, 5, 6, 7]));
    const m = d === 'hard' ? pick(rng, [2, 3]) : 1;
    const k = m * int(rng, 1, size(d, 4, 5, 3)); const c = int(rng, 1, 9) * (d !== 'easy' && chance(rng) ? -1 : 1);
    if (k < 2) continue;
    const top = k * k * b;
    // (√top + c)/(m√b) = (k b + c√b)/(m b) = k/m + (c/(m b))√b
    const a = k / m;
    const q = frac(c, m * b);
    if (q.isInt) continue;
    const form = (av, f) => {
      const s = f.n < 0 ? '-' : '+'; const fa = f.n < 0 ? f.neg() : f;
      return fa.isInt ? `$${av} ${s} ${kRoot(fa.n, b)}$` : `$${av} ${s} \\dfrac{${fa.n === 1 ? '' : fa.n}\\sqrt{${b}}}{${fa.d}}$`;
    };
    const ans = form(a, q);
    const den = `${m > 1 ? m : ''}\\sqrt{${b}}`;
    const cs = c < 0 ? '-' : '+'; const ca = Math.abs(c);
    return {
      prompt: `Simplify $\\dfrac{\\sqrt{${top}} ${cs} ${ca}}{${den}}$<br>Give your answer in the form $a ${cs} \\dfrac{p\\sqrt{${b}}}{q}$ where $a$, $p$ and $q$ are integers.`,
      answer: ans,
      distractors: uniq([form(a, frac(c, m)), form(k * b, q), form(a, frac(c, m * b * b)), form(a + 1, q), form(a, q.neg()), form(k * k, q), form(k, q)].filter((s) => s !== ans), ans),
      solution: [
        `Simplify the surd on top first: $\\sqrt{${top}} = ${kRoot(k, b)}$.`,
        `Multiply top and bottom by $\\sqrt{${b}}$: $\\dfrac{(${kRoot(k, b)} ${cs} ${ca})\\sqrt{${b}}}{${m * b}} = \\dfrac{${k * b} ${cs} ${ca}\\sqrt{${b}}}{${m * b}}$`,
        `Split the fraction and simplify each part: $\\dfrac{${k * b}}{${m * b}} = ${a}$ and $\\dfrac{${ca}\\sqrt{${b}}}{${m * b}}${Math.abs(q.n) !== ca || q.d !== m * b ? ` = ${surdTex(0, q.n < 0 ? q.neg() : q, b)}` : ''}$`,
        `Answer: ${ans}`,
      ],
    };
  }
}, { title: 'Simplify (√n + c)/√b' });

export const generators = [
  simplifySurd, surdInside, surdCompare,
  surdAdd, surdMultiply, surdExpand, surdDivide,
  ratSimple, ratConjugate, ratCombined,
];

void [sample, shuffle];
