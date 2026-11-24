// Number module – unit "Powers, roots and standard form".
import {
  pick, int, sample, shuffle, size, chance, frac, Frac, num, tnum, tidy, roundTo, roundSf, stdForm,
} from '../../core.js';
import { gen, uniq, F, dpOf } from './util.js';

const T = (f) => Frac.of(f).tex();
const P = (b, e) => `$${b}^{${e}}$`;
const powText = (b, e) => ({ kind: 'text', accept: [`${b}^${e}`, `${b}^(${e})`, `${b}^{${e}}`] });
const SF = (x, s = 6) => `$${stdForm(x, s)}$`;
/** Standard form TeX from mantissa and exponent (mantissa need not be normalised). */
const sfm = (m, e) => `$${tnum(m)} \\times 10^{${e}}$`;
const norm = (m, e) => { let mm = tidy(m); let ee = e; while (Math.abs(mm) >= 10) { mm = tidy(mm / 10); ee += 1; } while (Math.abs(mm) < 1 && mm !== 0) { mm = tidy(mm * 10); ee -= 1; } return [mm, ee]; };

/* ================================================================== */
/* num-squares-roots                                                   */
/* ================================================================== */

export const sqEvaluate = gen('num-sq-evaluate', 'num-squares-roots', (rng, d) => {
  const type = pick(rng, size(d, ['sq', 'cube', 'sqrt', 'cbrt'], ['sumSq', 'sqrtMinusCube', 'cube', 'tenPow'], ['decSq', 'decSqrt', 'fracCube', 'decCbrt', 'sumSq']));
  let tex; let ans; let wrongs; let steps;
  if (type === 'sq') { const a = int(rng, 4, 15); tex = `${a}^{2}`; ans = a * a; wrongs = [2 * a, a * 10 + 2, a * a + a, a + 2]; steps = [`$${a}^{2} = ${a} \\times ${a} = ${ans}$ (not $${a} \\times 2$)`]; }
  else if (type === 'cube') { const a = int(rng, 2, 6); tex = `${a}^{3}`; ans = a ** 3; wrongs = [3 * a, a * a, a ** 3 + a, a * a * 2]; steps = [`$${a}^{3} = ${a} \\times ${a} \\times ${a} = ${ans}$`]; }
  else if (type === 'sqrt') { const a = int(rng, 4, 13); tex = `\\sqrt{${a * a}}`; ans = a; wrongs = [a * a / 2, a + 1, a - 1, a * 2]; steps = [`$${a} \\times ${a} = ${a * a}$, so $\\sqrt{${a * a}} = ${a}$`]; }
  else if (type === 'cbrt') { const a = pick(rng, [2, 3, 4, 5, 10]); tex = `\\sqrt[3]{${tnum(a ** 3)}}`; ans = a; wrongs = [a ** 3 / 3, Math.round(Math.sqrt(a ** 3)), a + 1, a * 3]; steps = [`$${a} \\times ${a} \\times ${a} = ${tnum(a ** 3)}$, so the cube root is ${a}`]; }
  else if (type === 'sumSq') { const a = int(rng, 2, 9); const b = int(rng, 2, 9); tex = `${a}^{2} + ${b}^{2}`; ans = a * a + b * b; wrongs = [(a + b) ** 2, 2 * a + 2 * b, a * a * b * b, ans + 2]; steps = [`$${a}^{2} = ${a * a}$ and $${b}^{2} = ${b * b}$`, `$${a * a} + ${b * b} = ${ans}$ (not $(${a} + ${b})^{2} = ${(a + b) ** 2}$)`]; }
  else if (type === 'sqrtMinusCube') { const b = int(rng, 2, 3); const a = int(rng, b ** 3 + 1, 15); tex = `\\sqrt{${a * a}} - ${b}^{3}`; ans = a - b ** 3; wrongs = [a - 3 * b, a * a / 2 - b ** 3, a + b ** 3, a - b * b]; steps = [`$\\sqrt{${a * a}} = ${a}$ and $${b}^{3} = ${b ** 3}$`, `$${a} - ${b ** 3} = ${ans}$`]; }
  else if (type === 'tenPow') { const e = int(rng, 3, 6); tex = `10^{${e}}`; ans = 10 ** e; wrongs = [10 * e, 10 ** (e - 1), 10 ** (e + 1), e * 100]; steps = [`$10^{${e}}$ is 1 followed by ${e} zeros: $${tnum(ans)}$`]; }
  else if (type === 'decSq') { const a = pick(rng, [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.1, 1.2]); tex = `${tnum(a)}^{2}`; ans = tidy(a * a); wrongs = [tidy(2 * a), tidy(a * a * 10), tidy(a * a / 10), tidy(a / 2)]; steps = [`$${tnum(a)}^{2} = ${tnum(a)} \\times ${tnum(a)}$`, `$${Math.round(a * 10)} \\times ${Math.round(a * 10)} = ${Math.round(a * 10) ** 2}$, and there are 2 decimal places: $${tnum(ans)}$`]; }
  else if (type === 'decSqrt') { const a = pick(rng, [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.1, 1.2]); tex = `\\sqrt{${tnum(tidy(a * a))}}`; ans = a; wrongs = [tidy(a * a / 2), tidy(a / 10), tidy(a * 10), tidy(Math.round(Math.sqrt(a * a * 100) * 10) / 1000)]; steps = [`$${tnum(a)} \\times ${tnum(a)} = ${tnum(tidy(a * a))}$`, `So $\\sqrt{${tnum(tidy(a * a))}} = ${tnum(a)}$`]; }
  else if (type === 'decCbrt') { const a = pick(rng, [0.1, 0.2, 0.3, 0.5]); tex = `\\sqrt[3]{${tnum(tidy(a ** 3))}}`; ans = a; wrongs = [tidy(a ** 3 / 3), tidy(a / 10), tidy(a * 10), tidy(a * a)]; steps = [`$${tnum(a)} \\times ${tnum(a)} \\times ${tnum(a)} = ${tnum(tidy(a ** 3))}$`, `So the cube root is $${tnum(a)}$`]; }
  else { const f = pick(rng, [frac(1, 2), frac(2, 3), frac(1, 3), frac(3, 4), frac(2, 5)]); tex = `\\left(${T(f)}\\right)^{3}`; ans = frac(f.n ** 3, f.d ** 3); wrongs = [frac(3 * f.n, 3 * f.d === 3 * f.n ? 1 : f.d), frac(f.n ** 3, f.d), frac(f.n * 3, f.d ** 3), frac(f.n ** 2, f.d ** 2)]; steps = [`Cube the top and the bottom: $\\frac{${f.n}^{3}}{${f.d}^{3}} = ${T(ans)}$`]; }
  const isF = ans instanceof Frac;
  const fmt = (v) => (isF ? F(v) : num(v));
  return {
    prompt: `Work out $${tex}$`,
    answer: fmt(ans),
    distractors: uniq(wrongs.filter((v) => (isF ? !Frac.of(v).eq(ans) : v !== ans && Number.isFinite(v) && dpOf(v) <= 3)).map(fmt), fmt(ans)),
    typed: { kind: 'number', value: ans },
    solution: [...steps, `Answer: ${fmt(ans)}`],
  };
}, { title: 'Squares, cubes and roots without a calculator' });

export const sqEstimate = gen('num-sq-estimate', 'num-squares-roots', (rng, d) => {
  const cube = d === 'hard' && chance(rng, 0.5);
  let n;
  do { n = int(rng, size(d, 10, 20, 30), size(d, 99, 150, cube ? 900 : 300)); } while (Number.isInteger(Math.sqrt(n)) || Number.isInteger(Math.cbrt(n)));
  const r = cube ? Math.cbrt(n) : Math.sqrt(n);
  const lo = Math.floor(r);
  const pair = (a) => `${a} and ${a + 1}`;
  const sym = cube ? `\\sqrt[3]{${n}}` : `\\sqrt{${n}}`;
  const pw = cube ? 3 : 2;
  return {
    prompt: `$${sym}$ lies between which two consecutive whole numbers?`,
    answer: pair(lo),
    distractors: uniq([pair(lo - 1), pair(lo + 1), pair(Math.floor(n / pw) - 1), pair(Math.floor(n / pw)), pair(lo + 2), pair(Math.max(1, lo - 2))], pair(lo)),
    solution: [
      `Find the ${cube ? 'cube' : 'square'} numbers either side of ${n}.`,
      `$${lo}^{${pw}} = ${lo ** pw}$ and $${lo + 1}^{${pw}} = ${(lo + 1) ** pw}$, and ${n} is between them.`,
      `So $${sym}$ is between ${lo} and ${lo + 1}. (It is not $${n} \\div ${pw}$!)`,
      `Answer: ${pair(lo)}`,
    ],
  };
}, { title: 'Estimate a square or cube root' });

export const sqPowerOf = gen('num-sq-power-of', 'num-squares-roots', (rng, d) => {
  const base = pick(rng, size(d, [2, 3, 10], [2, 3, 5, 4], [2, 3, 5, 6, 7]));
  const e = int(rng, size(d, 3, 3, 4), size(d, 5, 6, base === 2 ? 10 : 5));
  const n = base ** e;
  if (n > 100000) throw new Error('retry');
  const askN = d !== 'easy' && chance(rng, 0.5);
  if (askN) {
    return {
      prompt: `$${base}^{n} = ${tnum(n)}$<br>Work out the value of $n$.`,
      answer: num(e),
      distractors: uniq([n / base, e + 1, e - 1, Math.round(n / e) === e ? e + 2 : e * 2, Math.round(Math.sqrt(n))].filter((v) => Number.isInteger(v) && v > 0 && v !== e && v < 1000).map((v) => num(v)), num(e)),
      typed: { kind: 'number', value: e },
      solution: [
        `Keep multiplying by ${base}: ${Array.from({ length: e }, (_, i) => tnum(base ** (i + 1))).join(', ')}.`,
        `That is ${e} lots of ${base} multiplied together, so $n = ${e}$.`,
        `Answer: ${e}`,
      ],
    };
  }
  return {
    prompt: `Write ${num(n)} as a power of ${base}.`,
    answer: P(base, e),
    distractors: uniq([P(base, e + 1), P(base, e - 1), P(base, n / base), P(base * base, e), P(base, e * 2)].filter((s) => !/\{\d+\.\d/.test(s)), P(base, e)),
    typed: powText(base, e),
    solution: [
      `Repeatedly divide by ${base}: ${Array.from({ length: e }, (_, i) => tnum(n / base ** i)).join(' → ')} → 1.`,
      `That is ${e} divisions, so $${tnum(n)} = ${base}^{${e}}$.`,
      `Answer: ${P(base, e)}`,
    ],
  };
}, { title: 'Write as a power' });

/* ================================================================== */
/* num-index-laws                                                      */
/* ================================================================== */

export const idxMulDiv = gen('num-idx-mul-div', 'num-index-laws', (rng, d) => {
  const alg = d !== 'easy' && chance(rng, 0.5);
  const div = chance(rng, 0.45);
  let m = int(rng, 2, 9); let n = int(rng, 2, 8);
  if (div && m <= n) m = n + int(rng, 1, 6);
  if (!alg) {
    const b = pick(rng, [2, 3, 5, 7, 10]);
    const e = div ? m - n : m + n;
    const op = div ? '\\div' : '\\times';
    return {
      prompt: `Write $${b}^{${m}} ${op} ${b}^{${n}}$ as a single power of ${b}.`,
      answer: P(b, e),
      distractors: uniq([P(b, div ? m / n : m * n), P(b, div ? m + n : m - n), P(b * b, e), `$${b * b}^{${div ? m / n : m * n}}$`, P(b, e + 1)].filter((s) => !/\{\d+\.\d/.test(s) && !/\{-|\{0\}/.test(s)), P(b, e)),
      typed: powText(b, e),
      solution: [
        div ? 'When you divide powers of the same number, <b>subtract</b> the indices.' : 'When you multiply powers of the same number, <b>add</b> the indices.',
        `$${b}^{${m}} ${op} ${b}^{${n}} = ${b}^{${m} ${div ? '-' : '+'} ${n}} = ${b}^{${e}}$`,
        `Don't ${div ? 'divide' : 'multiply'} the indices, and the base stays as ${b}.`,
        `Answer: ${P(b, e)}`,
      ],
    };
  }
  const v = pick(rng, ['p', 'x', 'a', 'y', 't']);
  const c1 = int(rng, 2, 6); let c2 = int(rng, 2, 6);
  if (div && c1 % c2) c2 = pick(rng, [1, 2, 3].filter((x) => (c1 * 6) % x === 0));
  const C1 = div ? c1 * c2 : c1;
  const coef = div ? C1 / c2 : C1 * c2;
  const e = div ? m - n : m + n;
  const term = (c, ex) => `$${c === 1 ? '' : c}${v}^{${ex}}$`;
  const ans = term(coef, e);
  return {
    prompt: `Simplify fully $${div ? `\\dfrac{${C1}${v}^{${m}}}{${c2 === 1 ? '' : c2}${v}^{${n}}}` : `${C1}${v}^{${m}} \\times ${c2}${v}^{${n}}`}$`,
    answer: ans,
    distractors: uniq([term(div ? C1 - c2 : C1 + c2, e), term(coef, div ? m / n : m * n), term(div ? C1 - c2 : C1 + c2, div ? m / n : m * n), term(coef, div ? m + n : m - n), term(coef + 1, e)].filter((s) => !/\d\.\d|\{-|\{0\}|\$0/.test(s)), ans),
    typed: { kind: 'text', accept: [`${coef === 1 ? '' : coef}${v}^${e}`, `${coef === 1 ? '' : coef}${v}^(${e})`] },
    solution: [
      div ? 'Divide the numbers, then subtract the powers of the letter.' : 'Multiply the numbers, then add the powers of the letter.',
      div ? `$${C1} \\div ${c2} = ${coef}$ and $${v}^{${m}} \\div ${v}^{${n}} = ${v}^{${e}}$` : `$${C1} \\times ${c2} = ${coef}$ and $${v}^{${m}} \\times ${v}^{${n}} = ${v}^{${e}}$`,
      `Answer: ${ans}`,
    ],
  };
}, { title: 'Multiply and divide powers' });

export const idxPowerPower = gen('num-idx-power-of-power', 'num-index-laws', (rng, d) => {
  const m = int(rng, 2, 6); const k = int(rng, 2, 4);
  if (d === 'easy' || (d === 'medium' && chance(rng))) {
    const b = pick(rng, [2, 3, 5, 7, 10]);
    return {
      prompt: `Write $(${b}^{${m}})^{${k}}$ as a single power of ${b}.`,
      answer: P(b, m * k),
      distractors: uniq([P(b, m + k), P(b, m ** k), P(b ** k, m), P(b, m * k + 1), P(b, m * k - 1)].filter((s) => !/\{\d{4,}/.test(s)), P(b, m * k)),
      typed: powText(b, m * k),
      solution: [
        'A power of a power: <b>multiply</b> the indices.',
        `$(${b}^{${m}})^{${k}} = ${b}^{${m} \\times ${k}} = ${b}^{${m * k}}$`,
        `Answer: ${P(b, m * k)}`,
      ],
    };
  }
  const c = int(rng, 2, 5); const v = pick(rng, ['x', 'a', 'y', 'm']);
  const two = d === 'hard' && chance(rng);
  const n2 = int(rng, 1, 4); const w = v === 'y' ? 'x' : 'y';
  const coef = c ** k;
  const ans = `$${coef}${v}^{${m * k}}${two ? `${w}^{${n2 * k}}` : ''}$`;
  const mk = (cc, e1, e2) => `$${cc}${v}^{${e1}}${two ? `${w}^{${e2}}` : ''}$`;
  return {
    prompt: `Simplify fully $(${c}${v}^{${m}}${two ? `${w}^{${n2 === 1 ? '' : n2}}`.replace('^{}', '') : ''})^{${k}}$`,
    answer: ans,
    distractors: uniq([mk(c * k, m * k, n2 * k), mk(c, m * k, n2 * k), mk(coef, m + k, n2 + k), mk(c * k, m + k, n2 + k), mk(coef, m * k, n2)], ans),
    typed: { kind: 'text', accept: [two ? `${coef}${v}^${m * k}${w}^${n2 * k}` : `${coef}${v}^${m * k}`] },
    solution: [
      `Everything inside the bracket is raised to the power ${k}.`,
      `Number: $${c}^{${k}} = ${coef}$ (not $${c} \\times ${k}$).`,
      `Letters: multiply the indices: $(${v}^{${m}})^{${k}} = ${v}^{${m * k}}$${two ? ` and $(${w}^{${n2}})^{${k}} = ${w}^{${n2 * k}}$` : ''}.`,
      `Answer: ${ans}`,
    ],
  };
}, { title: 'Power of a power' });

export const idxFindN = gen('num-idx-find-n', 'num-index-laws', (rng, d) => {
  const type = pick(rng, size(d, ['mulMissing', 'divMissing'], ['mulMissing', 'powMissing', 'convert'], ['convert', 'convertDiv', 'powMissing']));
  let prompt; let n; let wrongs; let steps;
  if (type === 'mulMissing') {
    const b = pick(rng, [2, 3, 5, 7]); const a = int(rng, 2, 9); n = int(rng, 2, 9);
    prompt = `$${b}^{${a}} \\times ${b}^{n} = ${b}^{${a + n}}$<br>Work out the value of $n$.`;
    wrongs = [a + n + a, (a + n) / a, a * n === a + n ? n + 1 : a + n, n + 1, n - 1];
    steps = [`Multiplying: add the indices, so $${a} + n = ${a + n}$.`, `$n = ${a + n} - ${a} = ${n}$`];
  } else if (type === 'divMissing') {
    const b = pick(rng, [2, 3, 5, 7]); n = int(rng, 2, 7); const a = n + int(rng, 2, 8);
    prompt = `$${b}^{${a}} \\div ${b}^{n} = ${b}^{${a - n}}$<br>Work out the value of $n$.`;
    wrongs = [a + (a - n), a / (a - n), a - n, n + 1, n - 1];
    steps = [`Dividing: subtract the indices, so $${a} - n = ${a - n}$.`, `$n = ${a} - ${a - n} = ${n}$`];
  } else if (type === 'powMissing') {
    const b = pick(rng, [2, 3, 5, 7]); n = int(rng, 2, 6); const k = int(rng, 2, 4);
    prompt = `$(${b}^{n})^{${k}} = ${b}^{${n * k}}$<br>Work out the value of $n$.`;
    wrongs = [n * k - k, n * k * k, n * k + k, n + 1, n - 1];
    steps = [`A power of a power multiplies the indices: $n \\times ${k} = ${n * k}$.`, `$n = ${n * k} \\div ${k} = ${n}$`];
  } else {
    const b = 2; const big = pick(rng, [[4, 2], [8, 3], [16, 4], [32, 5]]); const e1 = int(rng, 2, 5); const other = int(rng, 2, 9);
    const div = type === 'convertDiv';
    n = div ? big[1] * e1 - other : big[1] * e1 + other;
    if (n <= 0) throw new Error('retry');
    prompt = div ? `$${big[0]}^{${e1}} \\div ${b}^{${other}} = ${b}^{n}$<br>Work out the value of $n$.` : `$${big[0]}^{${e1}} \\times ${b}^{${other}} = ${b}^{n}$<br>Work out the value of $n$.`;
    wrongs = [div ? e1 - other : e1 + other, big[0] * e1 + (div ? -other : other), div ? big[1] * e1 + other : big[1] * e1 - other, n + 1, n - 1, big[1] + e1 + other];
    steps = [`Write ${big[0]} as a power of 2: $${big[0]} = 2^{${big[1]}}$, so $${big[0]}^{${e1}} = (2^{${big[1]}})^{${e1}} = 2^{${big[1] * e1}}$.`, `$2^{${big[1] * e1}} ${div ? '\\div' : '\\times'} 2^{${other}} = 2^{${big[1] * e1} ${div ? '-' : '+'} ${other}} = 2^{${n}}$`];
  }
  return {
    prompt,
    answer: num(n),
    distractors: uniq(wrongs.filter((v) => Number.isInteger(v) && v > 0 && v !== n).map((v) => num(v)), num(n)),
    typed: { kind: 'number', value: n },
    solution: [...steps, `Answer: $n = ${n}$`],
  };
}, { title: 'Find a missing index' });

export const idxEvaluate = gen('num-idx-evaluate', 'num-index-laws', (rng, d) => {
  const b = pick(rng, size(d, [2, 3, 10], [2, 3, 5], [2, 3, 5, 7]));
  let m; let n; let k;
  for (;;) {
    m = int(rng, 3, 9); n = int(rng, 2, 8); k = int(rng, 2, 9);
    const e = m + n - k;
    if (e >= 1 && e <= (b === 2 ? 6 : 3) && k > 1) break;
  }
  const e = m + n - k;
  const ans = b ** e;
  return {
    prompt: `Work out the value of $\\dfrac{${b}^{${m}} \\times ${b}^{${n}}}{${b}^{${k}}}$`,
    answer: num(ans),
    distractors: uniq([b * e, b ** (m * n - k) > 1e6 ? b ** (e + 1) : b ** (m * n - k), e, b ** (e + 1), b ** (e - 1) || 1, (b * b) ** e].filter((v) => Number.isInteger(v) && v > 0 && v !== ans && v < 1e7).map((v) => num(v)), num(ans)),
    typed: { kind: 'number', value: ans },
    solution: [
      `Top: $${b}^{${m}} \\times ${b}^{${n}} = ${b}^{${m + n}}$ (add the indices).`,
      `Divide: $${b}^{${m + n}} \\div ${b}^{${k}} = ${b}^{${e}}$ (subtract the indices).`,
      `$${b}^{${e}} = ${tnum(ans)}$${e > 1 ? ` (not $${b} \\times ${e}$)` : ''}`,
      `Answer: ${num(ans)}`,
    ],
  };
}, { title: 'Evaluate using index laws' });

/* ================================================================== */
/* num-negative-zero-indices                                           */
/* ================================================================== */

export const nziEvaluate = gen('num-nzi-evaluate', 'num-negative-zero-indices', (rng, d) => {
  const type = pick(rng, size(d, ['zero', 'neg1', 'negInt'], ['negInt', 'zero', 'neg1', 'ten'], ['fracNeg', 'negInt', 'fracNeg', 'mixed']));
  let tex; let ans; let wrongs; let steps;
  if (type === 'zero') { const b = int(rng, 2, 50); tex = `${b}^{0}`; ans = frac(1); wrongs = [frac(0), frac(b), frac(1, b), frac(-1)]; steps = [`Any non-zero number to the power 0 is 1 (e.g. $${b}^{2} \\div ${b}^{2} = ${b}^{0} = 1$).`]; }
  else if (type === 'neg1') { const b = int(rng, 2, 12); tex = `${b}^{-1}`; ans = frac(1, b); wrongs = [frac(-b), frac(-1, b), frac(b), frac(1, b * b)]; steps = ['A power of $-1$ means the reciprocal.', `$${b}^{-1} = \\frac{1}{${b}}$`]; }
  else if (type === 'negInt') { const b = pick(rng, [2, 3, 4, 5, 10]); const e = int(rng, 2, b === 2 ? 5 : 3); tex = `${b}^{-${e}}`; ans = frac(1, b ** e); wrongs = [frac(-(b ** e)), frac(-1, b ** e), frac(1, b * e), frac(-b * e), frac(b ** e)]; steps = ['A negative power means "one over" the positive power.', `$${b}^{-${e}} = \\frac{1}{${b}^{${e}}} = \\frac{1}{${b ** e}}$`]; }
  else if (type === 'ten') { const e = int(rng, 1, 4); tex = `10^{-${e}}`; ans = frac(1, 10 ** e); wrongs = [frac(-(10 ** e)), frac(1, 10 * e), frac(-10 * e), frac(10 ** e)]; steps = [`$10^{-${e}} = \\frac{1}{10^{${e}}} = \\frac{1}{${tnum(10 ** e)}}$ $(= ${tnum(10 ** -e)})$`]; }
  else if (type === 'fracNeg') { const f = pick(rng, [frac(2, 3), frac(3, 4), frac(1, 2), frac(2, 5), frac(3, 5), frac(4, 3), frac(5, 2)]); const e = pick(rng, [1, 2, 2, 3]); if (e === 3 && f.d > 3) throw new Error('retry'); tex = `\\left(${T(f)}\\right)^{-${e}}`; ans = frac(f.d ** e, f.n ** e); wrongs = [frac(f.n ** e, f.d ** e), frac(-(f.d ** e), f.n ** e), frac(f.d * e, f.n * e === f.d * e ? 1 : f.n), frac(-(f.n ** e), f.d ** e)]; steps = ['A negative power: flip the fraction, then use the positive power.', `$\\left(${T(f)}\\right)^{-${e}} = \\left(${T(f.inv())}\\right)^{${e}} = ${T(ans)}$`]; }
  else { const b = pick(rng, [2, 3, 5]); const e = int(rng, 1, 2); const c = int(rng, 2, 9); tex = `${c}^{0} + ${b}^{-${e}}`; ans = frac(1).add(frac(1, b ** e)); wrongs = [frac(1, b ** e), frac(c).add(frac(1, b ** e)), frac(1 - b ** e), frac(0).sub(frac(1, b ** e)).add(1).add(frac(1, b ** e)).eq(ans) ? frac(c + 1, b ** e) : frac(1, b)]; steps = [`$${c}^{0} = 1$ and $${b}^{-${e}} = \\frac{1}{${b ** e}}$`, `$1 + \\frac{1}{${b ** e}} = ${T(ans)}$`]; }
  const fmt = (f) => (Frac.of(f).isInt ? `$${tnum(Frac.of(f).n)}$` : F(f));
  return {
    prompt: `Work out the value of $${tex}$`,
    answer: fmt(ans),
    distractors: uniq(wrongs.filter((f) => !f.eq(ans)).map(fmt), fmt(ans)),
    typed: { kind: 'number', value: ans },
    solution: [...steps, `Answer: ${fmt(ans)}`],
  };
}, { title: 'Evaluate zero and negative powers', longDecimalsOk: true });

export const nziWritePower = gen('num-nzi-write-power', 'num-negative-zero-indices', (rng, d) => {
  const type = pick(rng, size(d, ['fracPow', 'decimal'], ['fracPow', 'decimal', 'simplify'], ['simplify', 'simplify2', 'fracPow']));
  if (type === 'simplify' || type === 'simplify2') {
    const b = pick(rng, [2, 3, 5, 7]);
    const a = int(rng, -6, 6); const c = int(rng, -5, 5); const k = int(rng, -4, 6);
    const e = type === 'simplify2' ? a * 2 - k : a + c - k;
    if (a === 0 || c === 0 || k === 0 || e === 0) throw new Error('retry');
    const tex = type === 'simplify2' ? `\\dfrac{(${b}^{${a}})^{2}}{${b}^{${k}}}` : `\\dfrac{${b}^{${a}} \\times ${b}^{${c}}}{${b}^{${k}}}`;
    const wrongE = type === 'simplify2' ? [a + 2 - k, a * 2 + k, -e] : [a + c + k, a * c - k, -e, a - c - k];
    return {
      prompt: `Write $${tex}$ as a single power of ${b}.`,
      answer: P(b, e),
      distractors: uniq([...wrongE, e + 1, e - 1].filter((x) => x !== e).map((x) => P(b, x)), P(b, e)),
      typed: powText(b, e),
      solution: [
        type === 'simplify2' ? `Power of a power: $(${b}^{${a}})^{2} = ${b}^{${2 * a}}$.` : `Top: add the indices: $${a} + (${c}) = ${a + c}$, giving $${b}^{${a + c}}$.`,
        `Divide: subtract the indices: $${type === 'simplify2' ? 2 * a : a + c} - (${k}) = ${e}$.`,
        `Answer: ${P(b, e)}`,
      ],
    };
  }
  if (type === 'decimal') {
    const e = int(rng, 1, size(d, 3, 4, 5));
    const v = tidy(10 ** -e);
    return {
      prompt: `Write ${num(v)} as a power of 10.`,
      answer: P(10, -e),
      distractors: uniq([P(10, e), P(10, -(e + 1)), e > 1 ? P(10, -(e - 1)) : P(10, 0), `$-10^{${e}}$`, e > 1 ? P(10, `\\frac{1}{${e}}`) : P(10, -10)], P(10, -e)),
      typed: powText(10, -e),
      solution: [
        `$${tnum(v)} = \\frac{1}{${tnum(10 ** e)}} = \\frac{1}{10^{${e}}}$`,
        `One over a power is a negative power: $\\frac{1}{10^{${e}}} = 10^{-${e}}$`,
        `Answer: ${P(10, -e)}`,
      ],
    };
  }
  const b = pick(rng, [2, 3, 4, 5]); const e = int(rng, 2, b === 2 ? 6 : 3);
  return {
    prompt: `Write $\\frac{1}{${b ** e}}$ as a power of ${b}.`,
    answer: P(b, -e),
    distractors: uniq([P(b, e), P(-b, e), P(b, -(e + 1)), P(b, `\\frac{1}{${e}}`), P(b, -(b ** e) / b)].filter((s) => !/\.\d/.test(s)), P(b, -e)),
    typed: powText(b, -e),
    solution: [
      `$${b ** e} = ${b}^{${e}}$, so $\\frac{1}{${b ** e}} = \\frac{1}{${b}^{${e}}}$`,
      `One over a power is the negative power: $${b}^{-${e}}$`,
      `Answer: ${P(b, -e)}`,
    ],
  };
}, { title: 'Write as a negative power', longDecimalsOk: true });

export const nziOrder = gen('num-nzi-order', 'num-negative-zero-indices', (rng, d) => {
  const pool = [[2, -1], [2, -2], [2, -3], [3, -1], [3, -2], [4, -1], [5, -1], [10, -1], [10, -2], [4, 0], [7, 0], [2, 0], [5, -2], [4, -2], [3, 0]].map(([b, e]) => ({ tex: `$${b}^{${e}}$`, v: b ** e }));
  extra(pool, d);
  for (;;) {
    const set = sample(rng, pool, 5);
    const vals = set.map((s) => s.v);
    if (new Set(vals.map((v) => roundTo(v, 9))).size < 5) continue;
    const wantMax = chance(rng);
    const target = set.reduce((b, s) => ((wantMax ? s.v > b.v : s.v < b.v) ? s : b));
    return {
      prompt: `Which of these has the <b>${wantMax ? 'largest' : 'smallest'}</b> value?<br>${set.map((s) => s.tex).join(",&nbsp;&nbsp; ")}`,
      answer: target.tex,
      distractors: set.filter((s) => s !== target).map((s) => s.tex),
      solution: [
        'Work out each value: a power of 0 is 1 and a negative power is a fraction ("one over").',
        set.map((s) => `${s.tex} $= ${Frac.of(frac(Math.round(s.v * 1e6), 1e6)).tex()}$`).join(', '),
        `Answer: ${target.tex}`,
      ],
    };
  }
}, { title: 'Compare zero and negative powers' });
function extra(pool, d) {
  if (d === 'hard') pool.push({ tex: '$\\left(\\frac{1}{2}\\right)^{-2}$', v: 4 }, { tex: '$\\left(\\frac{2}{3}\\right)^{-1}$', v: 1.5 }, { tex: '$\\left(\\frac{1}{3}\\right)^{2}$', v: 1 / 9 });
}

/* ================================================================== */
/* num-fractional-indices                                              */
/* ================================================================== */

const ROOT_BASES = [[4, 2], [9, 2], [16, 2], [25, 2], [36, 2], [49, 2], [64, 2], [81, 2], [100, 2], [121, 2], [144, 2], [169, 2], [196, 2], [225, 2], [400, 2], [8, 3], [27, 3], [64, 3], [125, 3], [216, 3], [343, 3], [1000, 3], [16, 4], [81, 4], [625, 4], [32, 5], [243, 5]];

export const fiUnit = gen('num-fi-unit', 'num-fractional-indices', (rng, d) => {
  const [n, k] = pick(rng, ROOT_BASES.filter(([, kk]) => (d === 'easy' ? kk === 2 : true)));
  const neg = d === 'hard' || (d === 'medium' && chance(rng, 0.4));
  const r = Math.round(n ** (1 / k));
  const ans = neg ? frac(1, r) : frac(r);
  const fmt = (f) => (f.isInt ? `$${tnum(f.n)}$` : F(f));
  return {
    prompt: `Work out the value of $${n}^{${neg ? '-' : ''}\\frac{1}{${k}}}$`,
    answer: fmt(ans),
    distractors: uniq([neg ? frac(-r) : frac(1, r), frac(n, k), neg ? frac(r) : frac(-r), neg ? frac(-1, r) : frac(n * k), neg ? frac(k, n) : frac(r * r === n ? r + 1 : r * r), frac(1, n)].filter((f) => !f.eq(ans)).map(fmt), fmt(ans)),
    typed: { kind: 'number', value: ans },
    solution: [
      `A power of $\\frac{1}{${k}}$ means the ${k === 2 ? 'square' : k === 3 ? 'cube' : `${k}th`} root: $${n}^{\\frac{1}{${k}}} = ${k === 2 ? `\\sqrt{${n}}` : `\\sqrt[${k}]{${n}}`} = ${r}$ (not $${n} \\div ${k}$).`,
      ...(neg ? [`The negative sign means take the reciprocal: $\\frac{1}{${r}}$.`] : []),
      `Answer: ${fmt(ans)}`,
    ],
  };
}, { title: 'Unit fractional indices' });

export const fiGeneral = gen('num-fi-general', 'num-fractional-indices', (rng, d) => {
  for (;;) {
    const fracBase = d === 'hard' && chance(rng, 0.5);
    let base; let k; let r;
    if (fracBase) {
      const pairs = [[frac(4, 9), 2], [frac(9, 16), 2], [frac(8, 27), 3], [frac(27, 64), 3], [frac(16, 25), 2], [frac(1, 8), 3], [frac(25, 4), 2], [frac(27, 8), 3]];
      [base, k] = pick(rng, pairs);
      r = frac(Math.round(base.n ** (1 / k)), Math.round(base.d ** (1 / k)));
    } else {
      const [n, kk] = pick(rng, ROOT_BASES.filter(([nn, x]) => x <= 3 && nn <= (d === 'easy' ? 64 : 1000)));
      base = frac(n); k = kk; r = frac(Math.round(n ** (1 / k)));
    }
    const m = int(rng, 2, k === 2 ? 3 : 2) + (k === 2 && chance(rng, 0.3) ? 0 : 0);
    if (m % k === 0) continue;
    const neg = d !== 'easy' && chance(rng, d === 'hard' ? 0.7 : 0.4);
    const pos = frac(r.n ** m, r.d ** m);
    const ans = neg ? pos.inv() : pos;
    if (ans.n > 5000 || ans.d > 5000) continue;
    const fmt = (f) => (f.isInt ? `$${tnum(f.n)}$` : F(f));
    const baseTex = base.isInt ? `${base.n}` : `\\left(${T(base)}\\right)`;
    const wrongs = [neg ? pos : pos.inv(), neg ? pos.neg() : pos.neg(), base.mul(m).div(k), frac(r.n * m, r.d), base.isInt ? frac(base.n ** m > 1e6 ? 7 : Math.round(Math.sqrt(base.n ** m)), 1) : base.inv(), frac(r.n ** (m + 1), r.d ** (m + 1))];
    return {
      prompt: `Work out the value of $${baseTex}^{${neg ? '-' : ''}\\frac{${m}}{${k}}}$`,
      answer: fmt(ans),
      distractors: uniq(wrongs.filter((f) => !f.eq(ans) && Math.abs(f.n) < 1e6).map(fmt), fmt(ans)),
      typed: { kind: 'number', value: ans },
      solution: [
        `The denominator ${k} means the ${k === 2 ? 'square' : 'cube'} root; the numerator ${m} means ${m === 2 ? 'square' : 'cube'} it. Root first – the numbers stay small.`,
        `$${k === 2 ? `\\sqrt{${T(base)}}` : `\\sqrt[3]{${T(base)}}`} = ${T(r)}$, then $\\left(${T(r)}\\right)^{${m}} = ${T(pos)}$`,
        ...(neg ? [`The negative index means "one over" (flip it): $${T(ans)}$`] : []),
        `Answer: ${fmt(ans)}`,
      ],
    };
  }
}, { title: 'General fractional indices' });

export const fiSolve = gen('num-fi-solve', 'num-fractional-indices', (rng, d) => {
  // a^x = b where a and b are powers of a common base c: a = c^p, b = c^q, x = q/p
  const c = pick(rng, [2, 3, 5]);
  const maxP = c === 2 ? 5 : 3;
  for (;;) {
    const p = int(rng, 2, maxP); const q = int(rng, size(d, 1, -3, -4), size(d, 4, 4, 5));
    if (q === 0 || q % p === 0 && d !== 'easy') continue;
    const a = c ** p;
    const bVal = frac(q > 0 ? c ** q : 1, q > 0 ? 1 : c ** -q);
    if (bVal.n > 1000 || bVal.d > 1000) continue;
    const x = frac(q, p);
    const bTex = bVal.isInt ? `${bVal.n}` : T(bVal);
    const fmt = (f) => (f.isInt ? `$${tnum(f.n)}$` : F(f));
    return {
      prompt: `Work out the value of $x$.<br>$${a}^{x} = ${bTex}$`,
      answer: fmt(x),
      distractors: uniq([x.inv(), x.neg(), frac(bVal.isInt ? bVal.n : -bVal.d, a), frac(p, q).neg(), x.add(frac(1, p)), frac(q, p + 1)].filter((f) => !f.eq(x) && f.d !== 0).map(fmt), fmt(x)),
      typed: { kind: 'number', value: x },
      solution: [
        `Write both numbers as powers of ${c}: $${a} = ${c}^{${p}}$ and $${bTex} = ${c}^{${q}}$.`,
        `So $(${c}^{${p}})^{x} = ${c}^{${q}}$, i.e. $${c}^{${p}x} = ${c}^{${q}}$.`,
        `Compare the indices: $${p}x = ${q}$, so $x = ${T(x)}$`,
        `Answer: ${fmt(x)}`,
      ],
    };
  }
}, { title: 'Solve a^x = b with fractional/negative x' });

/* ================================================================== */
/* num-standard-form                                                   */
/* ================================================================== */

function sfNumber(rng, d, small) {
  const sig = size(d, int(rng, 1, 2), int(rng, 2, 3), int(rng, 2, 4));
  let m;
  do { m = tidy(int(rng, 10 ** (sig - 1), 10 ** sig - 1) / 10 ** (sig - 1)); } while (m === 1 && sig === 1 && false);
  const e = small ? -int(rng, 1, size(d, 3, 5, 7)) : int(rng, 2, size(d, 5, 7, 9));
  return [m, e];
}

export const sfWrite = gen('num-sf-write', 'num-standard-form', (rng, d) => {
  const small = chance(rng, d === 'easy' ? 0.3 : 0.5);
  const [m, e] = sfNumber(rng, d, small);
  const x = tidy(m * 10 ** e);
  const words = !small && d !== 'easy' && chance(rng, 0.3) && e >= 6;
  const shown = small ? num(x).replace(/(\d{3})(?=\d)/g, '$1 ') : num(x);
  const ans = sfm(m, e);
  const digits = String(m).replace('.', '');
  return {
    prompt: words ? `Write the number ${wordsBig(x)} in standard form.` : `Write ${small ? `$${tnum(x)}$` : `$${tnum(x)}$`} in standard form.`,
    answer: ans,
    distractors: uniq([sfm(m, e + 1), sfm(m, e - 1), sfm(m, -e), sfm(Number(digits), e - (digits.length - 1)), sfm(tidy(m / 10), e + 1), sfm(m, small ? e + 2 : e - 2)].filter((s) => !s.includes('{0}')), ans),
    allowEquivalent: true,
    typed: { kind: 'number', value: x },
    solution: [
      `Standard form is $A \\times 10^{n}$ with $1 \\leqslant A < 10$. Here $A = ${tnum(m)}$.`,
      small ? `Count how many places the digits move to get from ${tnum(m)} to ${num(x)}: ${-e} places to the right, so the power is $-${-e}$.` : `From ${tnum(m)} to ${num(x)} the digits move ${e} places to the left, so the power is ${e}.`,
      `Answer: ${ans}`,
    ],
  };
}, { title: 'Write in standard form', longDecimalsOk: true });
function wordsBig(x) {
  const mil = x / 1e6;
  if (x >= 1e9 && Number.isInteger(x / 1e9 * 10)) return `${num(x / 1e9)} billion`;
  return Number.isInteger(mil * 100) ? `${num(mil)} million` : num(x);
}

export const sfToOrdinary = gen('num-sf-ordinary', 'num-standard-form', (rng, d) => {
  const small = chance(rng, d === 'easy' ? 0.3 : 0.6);
  const [m, e] = sfNumber(rng, d, small);
  if (small && dpOf(tidy(m * 10 ** e)) > 7) throw new Error('retry');
  const x = tidy(m * 10 ** e);
  const fmt = (v) => num(tidy(v));
  return {
    prompt: `Write ${sfm(m, e)} as an ordinary number.`,
    answer: fmt(x),
    distractors: uniq([x * 10, x / 10, m * 10 ** -e, x * 100, x / 100].filter((v) => dpOf(tidy(v)) <= 9).map(fmt), fmt(x)),
    typed: { kind: 'number', value: x },
    longDecimalsOk: true,
    solution: [
      `$10^{${e}}$ means ${e > 0 ? `multiply by ${num(10 ** e)}` : `divide by ${num(10 ** -e)}`}: move the digits ${Math.abs(e)} place${Math.abs(e) > 1 ? 's' : ''} to the ${e > 0 ? 'left' : 'right'}.`,
      `$${tnum(m)} \\times 10^{${e}} = ${tnum(x)}$`,
      `Answer: ${fmt(x)}`,
    ],
  };
}, { title: 'Standard form to ordinary number' });

export const sfOrder = gen('num-sf-order', 'num-standard-form', (rng, d) => {
  const small = chance(rng);
  const baseE = small ? -int(rng, 2, 5) : int(rng, 3, 7);
  const items = [];
  const seen = new Set();
  while (items.length < 5) {
    const e = baseE + int(rng, -1, 1);
    const m = tidy(int(rng, 11, 99) / 10);
    const v = tidy(m * 10 ** e);
    if (seen.has(v)) continue;
    seen.add(v);
    const ordinary = d !== 'easy' && items.length === 4 && chance(rng, 0.7) && dpOf(v) <= 7;
    items.push({ v, text: ordinary ? `$${tnum(v)}$` : sfm(m, e) });
  }
  const wantMax = chance(rng);
  const target = items.reduce((b, it) => ((wantMax ? it.v > b.v : it.v < b.v) ? it : b));
  return {
    prompt: `Which of these numbers is the <b>${wantMax ? 'largest' : 'smallest'}</b>?<br>${items.map((it) => it.text).join(",&nbsp;&nbsp; ")}`,
    answer: target.text,
    distractors: items.filter((it) => it !== target).map((it) => it.text),
    longDecimalsOk: true,
    solution: [
      `Compare the powers of 10 first – ${small ? 'with negative powers, a more negative power means a smaller number' : 'a bigger power means a bigger number'}.`,
      'If the powers are equal, compare the numbers in front.',
      `In order: ${[...items].sort((a, b) => a.v - b.v).map((it) => it.text).join(', ')}`,
      `Answer: ${target.text}`,
    ],
  };
}, { title: 'Order numbers in standard form' });

export const sfFix = gen('num-sf-fix', 'num-standard-form', (rng, d) => {
  const big = chance(rng);
  const m = big ? tidy(int(rng, 11, 990) / (chance(rng) ? 1 : 10)) : tidy(int(rng, 1, 99) / 100);
  if (m >= 1 && m < 10) throw new Error('retry');
  const e = int(rng, -6, 8);
  if (e === 0) throw new Error('retry');
  const [mm, ee] = norm(m, e);
  const ans = sfm(mm, ee);
  const shift = ee - e;
  return {
    prompt: `The number $${tnum(m)} \\times 10^{${e}}$ is not in standard form.<br>Write it in standard form.`,
    answer: ans,
    distractors: uniq([sfm(mm, e - shift), sfm(mm, e), sfm(mm, ee + 1), sfm(mm, ee - 1), sfm(mm, -ee)].filter((s) => s !== ans && !s.includes('{0}')), ans),
    allowEquivalent: true,
    typed: { kind: 'number', value: tidy(m * 10 ** e) },
    solution: [
      `Write $${tnum(m)}$ in standard form first: $${tnum(m)} = ${tnum(mm)} \\times 10^{${shift}}$.`,
      `So $${tnum(m)} \\times 10^{${e}} = ${tnum(mm)} \\times 10^{${shift}} \\times 10^{${e}} = ${tnum(mm)} \\times 10^{${ee}}$ (add the powers).`,
      `Answer: ${ans}`,
    ],
  };
}, { title: 'Correct into standard form' });

/* ================================================================== */
/* num-standard-form-calc                                              */
/* ================================================================== */

export const sfcMulDiv = gen('num-sfc-mul-div', 'num-standard-form-calc', (rng, d) => {
  const div = chance(rng, 0.45);
  let a; let b; let e1; let e2;
  for (;;) {
    a = int(rng, 2, 9); b = int(rng, 2, 9);
    if (d === 'easy' && (div ? a % b !== 0 : a * b >= 10)) continue;
    if (d === 'medium' && (div ? (a * 10) % b !== 0 : false)) continue;
    if (d === 'hard') { a = tidy(int(rng, 12, 96) / 10); b = tidy(int(rng, 2, 9) * (chance(rng) ? 1 : 0.5)); if (b < 1) continue; if (div && !Number.isInteger(tidy(a * 100 / b))) continue; }
    if (div && dpOf(tidy(a / b)) > 2) continue;
    break;
  }
  e1 = int(rng, d === 'easy' ? 2 : -5, 9); e2 = int(rng, d === 'easy' ? 1 : -4, 8);
  if (e1 === 0 || e2 === 0) e1 += 3;
  const rawM = div ? tidy(a / b) : tidy(a * b); const rawE = div ? e1 - e2 : e1 + e2;
  const [m, e] = norm(rawM, rawE);
  if (dpOf(m) > 3 || e === 0 || rawM <= 0) throw new Error('retry');
  const ans = sfm(m, e);
  const op = div ? '\\div' : '\\times';
  return {
    prompt: `Work out $(${tnum(a)} \\times 10^{${e1}}) ${op} (${tnum(b)} \\times 10^{${e2}})$<br>Give your answer in standard form.`,
    answer: ans,
    distractors: uniq([sfm(m, div ? e1 + e2 : e1 * e2), sfm(norm(div ? tidy(a - b) || 1 : tidy(a + b), rawE)[0], norm(div ? tidy(a - b) || 1 : tidy(a + b), rawE)[1]), sfm(m, e + 1), sfm(m, e - 1), sfm(m, rawE), sfm(m, -e)].filter((s) => s !== ans && !/\{0\}|-0|\$0 |\$-/.test(s)), ans),
    allowEquivalent: true,
    typed: { kind: 'number', value: tidy(m * 10 ** e) },
    solution: [
      `${div ? 'Divide' : 'Multiply'} the numbers: $${tnum(a)} ${op} ${tnum(b)} = ${tnum(rawM)}$`,
      `${div ? 'Subtract' : 'Add'} the powers: $10^{${e1}} ${op} 10^{${e2}} = 10^{${rawE}}$`,
      rawM >= 1 && rawM < 10 ? `This is already in standard form.` : `$${tnum(rawM)} \\times 10^{${rawE}}$ is not in standard form: $${tnum(rawM)} = ${tnum(m)} \\times 10^{${e - rawE}}$, so the answer is $${tnum(m)} \\times 10^{${e}}$.`,
      `Answer: ${ans}`,
    ],
  };
}, { title: 'Multiply/divide in standard form' });

export const sfcAddSub = gen('num-sfc-add-sub', 'num-standard-form-calc', (rng, d) => {
  for (;;) {
    const e1 = int(rng, d === 'hard' ? -6 : 3, 8); const gap = int(rng, size(d, 1, 1, 1), size(d, 1, 2, 2));
    const e2 = e1 - gap;
    const a = tidy(int(rng, 11, 95) / 10); const b = tidy(int(rng, 11, 95) / 10);
    const sub = chance(rng, d === 'easy' ? 0.3 : 0.5);
    const x = tidy(a * 10 ** e1); const y = tidy(b * 10 ** e2);
    const v = sub ? tidy(x - y) : tidy(x + y);
    const [m, e] = norm(tidy(v / 10 ** e1), e1);
    if (dpOf(m) > 3) continue;
    const ans = sfm(m, e);
    return {
      prompt: `Work out $${tnum(a)} \\times 10^{${e1}} ${sub ? '-' : '+'} ${tnum(b)} \\times 10^{${e2}}$<br>Give your answer in standard form.`,
      answer: ans,
      distractors: uniq([sfm(...norm(sub ? tidy(a - b) : tidy(a + b), e1)), sfm(...norm(sub ? Math.abs(tidy(a - b)) || 1 : tidy(a + b), e1 + e2)), sfm(m, e + 1), sfm(m, e - 1), sfm(...norm(tidy((sub ? x + y : x - y) / 10 ** e1), e1))].filter((s) => s !== ans && !/\{0\}|\$0 |\$-/.test(s)), ans),
      allowEquivalent: true,
      typed: { kind: 'number', value: v },
      longDecimalsOk: e < -3,
      solution: [
        'You cannot just add the front numbers – the powers of 10 are different. Make the powers the same first (or write both as ordinary numbers).',
        `$${tnum(b)} \\times 10^{${e2}} = ${tnum(tidy(b / 10 ** gap))} \\times 10^{${e1}}$`,
        `$${tnum(a)} ${sub ? '-' : '+'} ${tnum(tidy(b / 10 ** gap))} = ${tnum(tidy(v / 10 ** e1))}$, giving $${tnum(tidy(v / 10 ** e1))} \\times 10^{${e1}}$${e !== e1 ? ` $= ${tnum(m)} \\times 10^{${e}}$` : ''}`,
        `Answer: ${ans}`,
      ],
    };
  }
}, { title: 'Add/subtract in standard form' });

export const sfcOrdinary = gen('num-sfc-ordinary', 'num-standard-form-calc', (rng, d) => {
  const type = pick(rng, size(d, ['mul', 'div'], ['mul', 'div', 'square'], ['square', 'cube', 'div']));
  let tex; let v; let steps;
  if (type === 'mul') { const a = int(rng, 2, 9) * 10 ** int(rng, 2, 4); const b = int(rng, 2, 9) * 10 ** int(rng, 3, 5); tex = `${tnum(a)} \\times ${tnum(b)}`; v = a * b; steps = [`$${tnum(a)} = ${stdForm(a)}$ and $${tnum(b)} = ${stdForm(b)}$`, `Multiply the numbers and add the powers: $${tidy(a / 10 ** Math.floor(Math.log10(a))) * tidy(b / 10 ** Math.floor(Math.log10(b)))} \\times 10^{${Math.floor(Math.log10(a)) + Math.floor(Math.log10(b))}}$`]; }
  else if (type === 'div') { const q = int(rng, 2, 9); const b = int(rng, 2, 8) * 10 ** int(rng, 1, 3); const a = q * b * 10 ** int(rng, 2, 4); tex = `${tnum(a)} \\div ${tnum(b)}`; v = a / b; steps = [`$${tnum(a)} = ${stdForm(a)}$ and $${tnum(b)} = ${stdForm(b)}$`, `Divide the numbers and subtract the powers.`]; }
  else if (type === 'square') { const m = pick(rng, [1.1, 1.2, 1.5, 2, 2.5, 3, 3.1, 4, 6, 7, 9]); const e = pick(rng, [-8, -7, -6, -5, -4, -3, 3, 4, 5, 6, 7, 8, 9]); tex = `(${tnum(m)} \\times 10^{${e}})^{2}`; v = tidy(m * m) * 10 ** (2 * e); steps = [`Square the number: $${tnum(m)}^{2} = ${tnum(tidy(m * m))}$`, `Square the power of 10 – multiply the index by 2: $(10^{${e}})^{2} = 10^{${2 * e}}$`]; }
  else { const m = pick(rng, [1.1, 1.2, 1.5, 2, 3, 4]); const e = pick(rng, [-4, -3, -2, 2, 3, 4, 5]); tex = `(${tnum(m)} \\times 10^{${e}})^{3}`; v = tidy(m ** 3) * 10 ** (3 * e); steps = [`Cube the number: $${tnum(m)}^{3} = ${tnum(tidy(m ** 3))}$`, `$(10^{${e}})^{3} = 10^{${3 * e}}$`]; }
  const [m, e] = norm(tidy(v / 10 ** Math.floor(Math.log10(v))), Math.floor(Math.log10(v)));
  const ans = sfm(m, e);
  const calc = type === 'square' || type === 'cube';
  return {
    prompt: `Work out $${tex}$<br>Give your answer in standard form.`,
    answer: ans,
    distractors: uniq([sfm(m, e + 1), sfm(m, e - 1), type === 'square' ? sfm(...norm(tidy(Math.sqrt(m * 10 ** (e % 2 === 0 ? 0 : 1)) * 2), Math.round(e / 2))) : sfm(m, e + 2), type === 'square' ? sfm(...norm(tidy(m), e - Math.round(e / 2))) : sfm(m, e - 2), sfm(...norm(tidy(m * 10), e - 2))].filter((s) => s !== ans && !/\{0\}/.test(s)), ans),
    allowEquivalent: true,
    calculator: calc,
    typed: { kind: 'number', value: tidy(m * 10 ** e) },
    solution: [...steps, `Answer: ${ans}`],
  };
}, { title: 'Calculate and give the answer in standard form' });

const SF_WORD = [
  (rng) => { const m = int(rng, 2, 9); const e = -int(rng, 3, 5); const tot = int(rng, 2, 9); return { p: `The mass of one grain of sand is $${m} \\times 10^{${e}}$ grams. Work out the number of grains of sand in ${tot * m} kg of sand. Give your answer in standard form.`, v: (tot * m * 1000) / (m * 10 ** e), steps: [`${tot * m} kg = ${num(tot * m * 1000)} g`, `$${tnum(tot * m * 1000)} \\div (${m} \\times 10^{${e}})$`] }; },
  (rng) => { const n = int(rng, 2, 8); const e = int(rng, 6, 9); const k = pick(rng, [2, 3, 4, 5]); return { p: `A computer does $${n} \\times 10^{${e}}$ calculations every second. How many calculations does it do in ${k} minutes? Give your answer in standard form.`, v: n * 10 ** e * k * 60, steps: [`${k} minutes = ${k * 60} seconds`, `$${n} \\times 10^{${e}} \\times ${k * 60}$`] }; },
  (rng) => { const m = pick(rng, [1.5, 2, 2.5, 3, 4, 6]); const e = int(rng, 6, 8); const k = pick(rng, [2, 4, 5, 10]); return { p: `The population of a country is $${tnum(m)} \\times 10^{${e}}$. One in every ${k} people lives in the capital city. How many people live in the capital? Give your answer in standard form.`, v: tidy(m * 10 ** e / k), steps: [`$${tnum(m)} \\times 10^{${e}} \\div ${k}$`] }; },
  (rng) => { const d1 = pick(rng, [1.5, 2.3, 4.2, 5.8, 7.7]); const e = int(rng, 7, 9); const s = 3; return { p: `Light travels at $${s} \\times 10^{5}$ km per second. A star is $${tnum(d1 * s)} \\times 10^{${e}}$ km from Earth. How many seconds does light take to reach Earth from the star? Give your answer in standard form.`, v: tidy(d1 * 10 ** (e - 5)), steps: [`time = distance ÷ speed`, `$(${tnum(d1 * s)} \\times 10^{${e}}) \\div (${s} \\times 10^{5})$`] }; },
  (rng) => { const n = int(rng, 2, 9); const e = int(rng, 3, 6); const k = int(rng, 2, 8); return { p: `A bacteria colony has $${n} \\times 10^{${e}}$ cells. The number of cells is multiplied by ${k * 10}. How many cells are there now? Give your answer in standard form.`, v: n * 10 ** e * k * 10, steps: [`$${n} \\times 10^{${e}} \\times ${k * 10} = ${n * k * 10} \\times 10^{${e}}$`] }; },
  (rng) => { const m = int(rng, 2, 8); const e = int(rng, 9, 12); const p = pick(rng, [4, 5, 8]); return { p: `A hard drive stores $${m * p} \\times 10^{${e}}$ bytes. Each film uses $${p} \\times 10^{9}$ bytes. How many films can be stored? Give your answer in standard form.`, v: m * 10 ** (e - 9), steps: [`$(${m * p} \\times 10^{${e}}) \\div (${p} \\times 10^{9}) = ${m} \\times 10^{${e - 9}}$`] }; },
  (rng) => { const m = int(rng, 2, 9); const e = -int(rng, 5, 8); const n = int(rng, 2, 9); return { p: `The width of a human hair is about $${m} \\times 10^{${e}}$ metres. ${n} hundred hairs are laid side by side. What is their total width in metres? Give your answer in standard form.`, v: tidy(m * n * 100 * 10 ** e), steps: [`$${n * 100} \\times ${m} \\times 10^{${e}} = ${m * n * 100} \\times 10^{${e}}$`] }; },
  (rng) => { const a = pick(rng, [1.2, 2.4, 3.6, 4.8]); const e = int(rng, 10, 12); const p = pick(rng, [6, 8, 12]); return { p: `A government spends £$${tnum(a)} \\times 10^{${e}}$ in a year. This is shared equally over ${p} areas of spending. How much is spent on each area? Give your answer in standard form.`.replace('£$', '£$'), v: tidy(a * 10 ** e / p), steps: [`$${tnum(a)} \\times 10^{${e}} \\div ${p}$`] }; },
  (rng) => { const m = int(rng, 2, 9); const e = -int(rng, 20, 24); const n = int(rng, 2, 9); return { p: `The mass of an atom is $${m} \\times 10^{${e}}$ grams. Work out the mass of $${n} \\times 10^{5}$ of these atoms. Give your answer in standard form.`, v: m * n * 10 ** (e + 5), steps: [`Multiply: $${m} \\times ${n} = ${m * n}$ and $10^{${e}} \\times 10^{5} = 10^{${e + 5}}$`] }; },
  (rng) => { const m = pick(rng, [1.5, 2.5, 3.5, 4.5]); const e = int(rng, 4, 6); const t = pick(rng, [20, 40, 60]); return { p: `A river carries $${tnum(m)} \\times 10^{${e}}$ litres of water past a bridge every minute. How many litres pass in ${t} hours? Give your answer in standard form.`, v: tidy(m * 10 ** e * t * 60), steps: [`${t} hours = ${t * 60} minutes`, `$${tnum(m)} \\times 10^{${e}} \\times ${t * 60}$`] }; },
  (rng) => { const r = int(rng, 4, 6); const e = int(rng, 6, 7); const per = int(rng, 2, 9); return { p: `There are about $${r} \\times 10^{${e}}$ red blood cells in 1 ml of blood. A blood sample is ${per * 10} ml. About how many red blood cells are in the sample? Give your answer in standard form.`, v: r * per * 10 * 10 ** e, steps: [`$${r} \\times 10^{${e}} \\times ${per * 10}$`] }; },
  (rng) => { const a = int(rng, 2, 9); const b = int(rng, 2, 9); const e1 = int(rng, 5, 8); const e2 = e1 - int(rng, 1, 2); return { p: `Factory A makes $${a} \\times 10^{${e1}}$ bottles a year. Factory B makes $${b} \\times 10^{${e2}}$ bottles a year. How many bottles do they make altogether? Give your answer in standard form.`, v: a * 10 ** e1 + b * 10 ** e2, steps: [`Write both as ordinary numbers: $${tnum(a * 10 ** e1)} + ${tnum(b * 10 ** e2)}$`] }; },
  (rng) => { const p = pick(rng, [6.4, 6.8, 7.2, 8.4]); const e = 7; const k = pick(rng, [2, 4, 8]); return { p: `The population of a country is $${tnum(p)} \\times 10^{${e}}$. The population is expected to ${k === 2 ? 'double' : `increase by a factor of ${k}`} in the next century. What will the population be? Give your answer in standard form.`, v: tidy(p * k * 10 ** e), steps: [`$${tnum(p)} \\times ${k} = ${tnum(tidy(p * k))}$, so $${tnum(tidy(p * k))} \\times 10^{${e}}$`] }; },
];

export const sfcWord = gen('num-sfc-word', 'num-standard-form-calc', (rng) => {
  const c = pick(rng, SF_WORD)(rng);
  const e = Math.floor(Math.log10(c.v));
  const m = roundSf(c.v / 10 ** e, 4);
  const [mm, ee] = norm(m, e);
  if (dpOf(mm) > 3) throw new Error('retry');
  const ans = sfm(mm, ee);
  return {
    prompt: c.p,
    answer: ans,
    distractors: uniq([sfm(mm, ee + 1), sfm(mm, ee - 1), sfm(mm, ee + 2), sfm(mm, ee - 3), sfm(...norm(tidy(mm * 6), ee)), sfm(mm, -ee)].filter((s) => s !== ans && !/\{0\}/.test(s)), ans),
    allowEquivalent: true,
    calculator: true,
    typed: { kind: 'number', value: tidy(mm * 10 ** ee) },
    solution: [...c.steps, `$= ${tnum(mm)} \\times 10^{${ee}}$`, `Answer: ${ans}`],
  };
}, { title: 'Standard form in context', word: true });

export const generators = [
  sqEvaluate, sqEstimate, sqPowerOf,
  idxMulDiv, idxPowerPower, idxFindN, idxEvaluate,
  nziEvaluate, nziWritePower, nziOrder,
  fiUnit, fiGeneral, fiSolve,
  sfWrite, sfToOrdinary, sfOrder, sfFix,
  sfcMulDiv, sfcAddSub, sfcOrdinary, sfcWord,
];

void [shuffle, roundTo, SF];
