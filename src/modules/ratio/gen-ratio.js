// Ratio unit: simplifying, sharing, one part known, ratio and fractions, combining, changing ratios.
import {
  pick, int, chance, sample, shuffle, size, gcd, lcm, names, num, tnum, Frac, tidy, cap, money, terms,
} from '../../core.js';
import {
  withUnit, gbp, pct, ratio, ratioTex, ratioTyped, simplify, isSimplest, rvals, dvals, pvals, hasDp,
  ftex, fopt, fvals, toInts, rgen as gen, near,
} from './helpers.js';

const coprimePair = (rng, max, min = 1) => {
  for (let i = 0; i < 100; i += 1) {
    const a = int(rng, min, max); const b = int(rng, min, max);
    if (a !== b && gcd(a, b) === 1) return [a, b];
  }
  return [2, 3];
};
const coprimeTriple = (rng, max) => {
  for (let i = 0; i < 100; i += 1) {
    const t = [int(rng, 1, max), int(rng, 1, max), int(rng, 1, max)];
    if (new Set(t).size === 3 && t.reduce((a, b) => gcd(a, b)) === 1) return t;
  }
  return [2, 3, 5];
};
const properFactor = (g) => { for (let f = 2; f < g; f += 1) if (g % f === 0) return g / f; return null; };

/* ================================================================== */
/* rat-simplify                                                        */
/* ================================================================== */

export const simplifyBasic = gen('rat-simplify-basic', 'rat-simplify', (rng, d) => {
  const kind = size(d, 'two', pick(rng, ['two', 'three', 'three']), pick(rng, ['decimal', 'fraction', 'three']));
  if (kind === 'fraction') {
    // a/b : c/d  -> multiply by the common denominator
    const fr = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5], [3, 5], [1, 6], [5, 6], [3, 8], [5, 8]];
    let f1; let f2;
    do { [f1, f2] = sample(rng, fr, 2); } while (f1[1] === f2[1]);
    const L = lcm(f1[1], f2[1]);
    const raw = [f1[0] * (L / f1[1]), f2[0] * (L / f2[1])];
    const ans = simplify(raw);
    const q = `$\\frac{${f1[0]}}{${f1[1]}} : \\frac{${f2[0]}}{${f2[1]}}$`;
    return {
      prompt: `Write the ratio ${q} in its simplest form, using whole numbers.`,
      answer: ratio(ans),
      distractors: rvals(ans, [[f1[0], f2[0]], [f1[1], f2[1]], [f2[1], f1[1]], [ans[1], ans[0]], [f1[0] * f2[0], f1[1] * f2[1]], [ans[0] + 1, ans[1]], [ans[0], ans[1] + 1], [f1[0] + f1[1], f2[0] + f2[1]]]),
      typed: ratioTyped(ans),
      solution: [
        `Multiply both fractions by the common denominator, ${L}, to clear the fractions.`,
        `$\\frac{${f1[0]}}{${f1[1]}} \\times ${L} = ${raw[0]}$ and $\\frac{${f2[0]}}{${f2[1]}} \\times ${L} = ${raw[1]}$, so the ratio is $${raw[0]} : ${raw[1]}$.`,
        ...(raw[0] !== ans[0] ? [`Divide both parts by ${raw[0] / ans[0]}: $${ratioTex(ans)}$.`] : []),
        `Answer: ${ratio(ans)}`,
      ],
    };
  }
  if (kind === 'decimal') {
    const base = coprimePair(rng, 9);
    const u = pick(rng, [0.1, 0.2, 0.3, 0.4, 0.5, 0.25, 0.6, 1.5]);
    const shown = base.map((x) => tidy(x * u));
    if (shown.every(Number.isInteger)) throw new Error('no decimals');
    const tens = toInts(shown);
    return {
      prompt: `Write the ratio $${ratioTex(shown)}$ in its simplest form, using whole numbers.`,
      answer: ratio(base),
      distractors: [...rvals(base, [tens], { keepEquivalent: true }), ...rvals(base, [[base[1], base[0]], [tens[0] / 2, tens[1] / 2].every(Number.isInteger) ? [tens[0] / 2, tens[1] / 2] : null, [base[0] + 1, base[1]], [base[0], base[1] + 1], [base[0] * 2, base[1]], [Math.round(shown[0]), Math.round(shown[1])], [base[0], base[1] * 2], [base[0], base[1] - 1], [base[0] + 2, base[1]]], { keepEquivalent: true })],
      typed: ratioTyped(base),
      solution: [
        'First get rid of the decimals by multiplying both parts by the same number.',
        `$${ratioTex(shown)} = ${ratioTex(tens)}$ (multiplying by ${tens[0] / shown[0]})`,
        `The highest common factor of ${tens[0]} and ${tens[1]} is ${gcd(tens[0], tens[1])}, so divide both parts by it: $${ratioTex(base)}$.`,
        `Answer: ${ratio(base)}`,
      ],
    };
  }
  const three = kind === 'three';
  const base = three ? coprimeTriple(rng, size(d, 6, 7, 9)) : coprimePair(rng, size(d, 7, 9, 11));
  const g = three ? pick(rng, size(d, [2, 3, 4, 5], [2, 3, 4, 5, 6, 8], [4, 6, 8, 9, 12])) : pick(rng, size(d, [2, 3, 4, 5, 6, 10], [6, 8, 9, 12, 14, 15], [12, 16, 18, 24, 25]));
  const shown = base.map((x) => x * g);
  const f = properFactor(g);
  const partial = f ? base.map((x) => x * f) : null;
  const wrong = [
    partial, [...base].reverse(),
    base.map((x, i) => (i === 0 ? x + 1 : x)), base.map((x, i) => (i === base.length - 1 ? x + 1 : x)),
    base.map((x, i) => (i === 1 ? x * 2 : x)), shown.map((x) => x / 2).every(Number.isInteger) ? shown.map((x) => x / 2) : null,
    base.map((x, i) => (i === 0 ? x * g : x)), base.map((x, i) => (i === 1 ? x * g : x)), base.map((x, i) => (i === 0 && x > 1 ? x - 1 : x)),
    base.map((x, i) => (i === 1 ? x + 2 : x)),
  ];
  return {
    prompt: pick(rng, [`Write the ratio $${ratioTex(shown)}$ in its simplest form.`, `Simplify fully $${ratioTex(shown)}$.`, `Write $${ratioTex(shown)}$ in its simplest form.`]),
    answer: ratio(base),
    distractors: rvals(base, wrong, { keepEquivalent: true }),
    typed: ratioTyped(base),
    solution: [
      `Find the highest common factor (HCF) of ${shown.map((x) => num(x)).join(three ? ', ' : ' and ').replace(/, ([^,]*)$/, ' and $1')}: it is ${g}.`,
      `Divide every part by ${g}: $${shown.map((x) => `${tnum(x)} \\div ${g}`).join(' : ')} = ${ratioTex(base)}$.`,
      ...(f ? [`If you divide by a smaller common factor first (like ${g / f}), keep going until the parts have no common factor left.`] : []),
      `Answer: ${ratio(base)}`,
    ],
  };
}, { title: 'Simplify a ratio (whole numbers, three parts, decimals, fractions)' });

const UNIT_PAIRS = [
  { small: 'cm', big: 'm', F: 100, bigVals: [1, 2, 3, 4, 5, 1.5, 2.5, 1.2] },
  { small: 'mm', big: 'cm', F: 10, bigVals: [2, 3, 4, 5, 6, 8, 12, 15] },
  { small: 'm', big: 'km', F: 1000, bigVals: [1, 2, 3, 4, 1.5, 2.5, 1.2] },
  { small: 'g', big: 'kg', F: 1000, bigVals: [1, 2, 3, 4, 5, 1.5, 2.5] },
  { small: 'ml', big: 'litres', bigOne: 'litre', F: 1000, bigVals: [1, 2, 3, 4, 1.5, 2.5] },
  { small: 'p', big: '£', F: 100, bigVals: [1, 2, 3, 4, 5, 6, 1.5, 2.5], money: true },
  { small: 'minutes', big: 'hours', bigOne: 'hour', F: 60, bigVals: [1, 2, 3, 4, 1.5, 2.5], wrongF: 100 },
  { small: 'seconds', big: 'minutes', bigOne: 'minute', F: 60, bigVals: [1, 2, 3, 4, 5], wrongF: 100 },
  { small: 'kg', big: 'tonnes', bigOne: 'tonne', F: 1000, bigVals: [1, 2, 3, 1.5, 2.5] },
];
const FRACS = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 6], [5, 6], [1, 8], [3, 8], [5, 8], [3, 10], [7, 10], [1, 10], [3, 20], [7, 20], [9, 20], [1, 12], [5, 12], [7, 12]];

const fmtSmall = (u, v) => (u.money ? `${num(v)}p` : `${num(v)} ${u.small}`);
const fmtBig = (u, v) => (u.money ? money(v, { forcePence: !Number.isInteger(v) }) : `${num(v)} ${v === 1 && u.bigOne ? u.bigOne : u.big}`);
/** a·x + c as TeX, e.g. lin(1, -8) -> "x - 8"; fac(1, e) drops a 1 in front of a bracket. */
const lin = (a, c, v = 'x') => terms([[a, v], [c, '']]);
const fac = (k, e) => (k === 1 ? e : `${k}(${e})`);
/** "…, so 4x = 24 and x = 6" (or just "x = 6" when the coefficient is 1). */
const solveLine = (coef, rhs, sol, v = 'x') => (Math.abs(coef) === 1 ? `$${v} = ${tnum(sol)}$` : `$${Math.abs(coef)}${v} = ${tnum(Math.abs(rhs))}$ and $${v} = ${tnum(sol)}$`);

export const simplifyUnits = gen('rat-simplify-units', 'rat-simplify', (rng, d) => {
  const u = pick(rng, d === 'easy' ? UNIT_PAIRS.filter((x) => x.F !== 60) : UNIT_PAIRS);
  const nonInt = u.bigVals.filter((v) => !Number.isInteger(v));
  const b = pick(rng, d === 'easy' ? u.bigVals.filter(Number.isInteger) : d === 'hard' && nonInt.length && chance(rng, 0.7) ? nonInt : u.bigVals);
  const B = tidy(b * u.F);
  const opts = FRACS.filter(([p, q]) => Number.isInteger(B * p / q) && B * p / q >= 2);
  if (!opts.length) throw new Error('no fraction');
  const [p, q] = pick(rng, opts);
  const a = B * p / q;
  const smallFirst = chance(rng, 0.6);
  const ans = smallFirst ? [p, q] : [q, p];
  const order = (x, y) => (smallFirst ? [x, y] : [y, x]);
  const shown = smallFirst ? `${fmtSmall(u, a)} : ${fmtBig(u, b)}` : `${fmtBig(u, b)} : ${fmtSmall(u, a)}`;
  const wrongF = u.wrongF ?? (u.F === 10 ? 100 : u.F / 10);
  return {
    prompt: pick(rng, [`Write the ratio ${shown} in its simplest form.`, `Simplify the ratio ${shown}.`, `Write ${shown} as a ratio in its simplest form.`]),
    answer: ratio(ans),
    distractors: rvals(ans, [
      simplify(order(a, b)), simplify(order(a, tidy(b * wrongF))), [...ans].reverse(), order(a, B),
      [ans[0] + 1, ans[1]],
    ], { keepEquivalent: true }),
    typed: ratioTyped(ans),
    solution: [
      `Both parts must be in the <b>same units</b> before you simplify. ${cap(fmtBig(u, 1))} = ${fmtSmall(u, u.F)}.`,
      `${fmtBig(u, b)} = ${fmtSmall(u, B)}, so the ratio is $${ratioTex(order(a, B))}$.`,
      `Divide both parts by ${gcd(a, B)}: $${ratioTex(ans)}$.`,
      `Answer: ${ratio(ans)}`,
    ],
  };
}, { title: 'Simplify a ratio with different units' });

export const simplifyOneN = gen('rat-simplify-1-n', 'rat-simplify', (rng, d) => {
  const form = chance(rng, 0.6) ? '1n' : 'n1';
  let a; let b; let unitNote = '';
  let shown;
  if (d === 'hard' && chance(rng, 0.5)) {
    // different units, e.g. 25 cm : 2 m
    const u = pick(rng, UNIT_PAIRS.filter((x) => x.F !== 60 && !x.money));
    const big = pick(rng, u.bigVals.filter(Number.isInteger));
    const B = big * u.F;
    a = pick(rng, [2, 4, 5, 8, 10, 20, 25, 40, 50].map((k) => B / k).filter((x) => Number.isInteger(x) && x < B));
    b = B;
    shown = form === '1n' ? `${fmtSmall(u, a)} : ${fmtBig(u, big)}` : `${fmtBig(u, big)} : ${fmtSmall(u, a)}`;
    unitNote = `First write both in ${u.small}: $${ratioTex([a, b])}$${form === 'n1' ? ` (reversed: $${ratioTex([b, a])}$)` : ''}.`;
    if (form === 'n1') [a, b] = [b, a];
  } else {
    for (let i = 0; i < 100; i += 1) {
      a = pick(rng, size(d, [2, 3, 4, 5, 10], [2, 4, 5, 8, 10, 20], [4, 5, 8, 16, 20, 25, 40]));
      b = int(rng, a + 1, a * size(d, 6, 5, 4));
      const n = b / a;
      if (b % a === 0 ? d === 'easy' : hasDp(n, d === 'hard' ? 3 : 2) && d !== 'easy') break;
    }
    if (form === 'n1') [a, b] = [b, a];
    shown = `$${ratioTex([a, b])}$`;
  }
  const n = form === '1n' ? tidy(b / a) : tidy(a / b);
  if (!hasDp(n, 3)) throw new Error('ugly n');
  const ans = form === '1n' ? [1, n] : [n, 1];
  const inv = form === '1n' ? Math.round((a / b) * 100) / 100 : Math.round((b / a) * 100) / 100;
  const wrong = form === '1n'
    ? [[1, inv], [n, 1], [1, b - a], [1, tidy(n + 1)], [1, Math.round(n)], [1, b], [1, tidy(n - 1)], [1, tidy(n * 2)], [1, tidy(n + 0.5)]]
    : [[inv, 1], [1, n], [a - b, 1], [tidy(n + 1), 1], [Math.round(n), 1], [a, 1], [tidy(n - 1), 1], [tidy(n * 2), 1], [tidy(n + 0.5), 1]];
  return {
    prompt: `Write the ratio ${shown} in the form ${form === '1n' ? '$1 : n$' : '$n : 1$'}.`,
    answer: ratio(ans),
    distractors: wrong.filter((r) => r.every((x) => x > 0 && !(r[0] === 1 && r[1] === 1))).map((r) => ratio(r)).filter((t) => t !== ratio(ans)),
    typed: ratioTyped(ans),
    solution: [
      ...(unitNote ? [unitNote] : []),
      form === '1n' ? `To make the first part 1, divide <b>both</b> parts by ${num(a)}.` : `To make the second part 1, divide <b>both</b> parts by ${num(b)}.`,
      form === '1n' ? `$${tnum(a)} \\div ${tnum(a)} = 1$ and $${tnum(b)} \\div ${tnum(a)} = ${tnum(n)}$` : `$${tnum(a)} \\div ${tnum(b)} = ${tnum(n)}$ and $${tnum(b)} \\div ${tnum(b)} = 1$`,
      `Answer: ${ratio(ans)}`,
    ],
  };
}, { title: 'Write a ratio in the form 1 : n or n : 1' });

/* Context ratios: the student has to find the quantities, then simplify. */
const CONTEXT_RATIOS = [
  (rng, p, q, g) => { const [A] = names(rng, 1); return { prompt: `In a class there are ${p * g} boys and ${q * g} girls. Write the ratio boys : girls in its simplest form.`, ans: [p, q], wrong: [[q, p], [p, p + q]], steps: [`boys : girls $= ${p * g} : ${q * g}$`], who: A }; },
  (rng, p, q) => {
    const [A] = names(rng, 1);
    const units = [40, 50, 60, 70, 80, 90, 120, 140, 160, 180, 240, 300, 320, 360, 400, 450, 500].filter((u) => p * u >= 800 && p * u <= 2200);
    const unit = units.length ? pick(rng, units) : 300;
    const b = p * unit; const o = q * unit;
    return {
      prompt: `${A} earns a basic rate of ${gbp(b)} per hour and an overtime rate of ${gbp(o)} per hour. Work out the ratio basic hourly rate : overtime hourly rate in its simplest form.`,
      ans: [p, q], wrong: [[q, p], [p, q - p], simplify([Math.floor(b / 100), Math.floor(o / 100)])],
      steps: [b % 100 || o % 100 ? `Write both in pence: $${b} : ${o}$` : `basic : overtime $= ${b / 100} : ${o / 100}$`],
      need: (pp, qq) => qq > pp && 2 * qq <= 3 * pp + 1,
    };
  },
  (rng, p, q, g) => { const draws = int(rng, 1, 6); const tot = (p + q) * g + draws; return { prompt: `A football team played ${tot} games. They won ${p * g} games and drew ${draws}. They lost the rest. Work out the ratio wins : losses in its simplest form.`, ans: [p, q], wrong: [simplify([p * g, draws]), simplify([p * g, tot]), simplify([p * g, q * g + draws]), [q, p]], steps: [`Losses $= ${tot} - ${p * g} - ${draws} = ${q * g}$`, `wins : losses $= ${p * g} : ${q * g}$`], need: (pp, qq, gg) => (pp + qq) * gg <= 56 }; },
  (rng, p, q, g) => { const green = int(rng, 3, 20); const tot = (p + q) * g + green; return { prompt: `A bag of ${tot} sweets contains ${p * g} red sweets, ${green} green sweets and the rest are yellow. Write the ratio red : yellow in its simplest form.`, ans: [p, q], wrong: [simplify([p * g, green]), simplify([p * g, tot]), [q, p], simplify([p * g, q * g + green])], steps: [`Yellow $= ${tot} - ${p * g} - ${green} = ${q * g}$`, `red : yellow $= ${p * g} : ${q * g}$`] }; },
  (rng, p, q, g) => ({ prompt: `A cake recipe uses ${p * g * 10} g of butter and ${num(q * g * 10 / 1000)} kg of flour. Write the ratio butter : flour in its simplest form.`, ans: [p, q], wrong: [simplify([p * g * 10, q * g * 10 / 1000]), [q, p], simplify([p * g, q * g * 10])], steps: [`Change to the same unit: ${num(q * g * 10 / 1000)} kg $= ${tnum(q * g * 10)}$ g`, `butter : flour $= ${p * g * 10} : ${tnum(q * g * 10)}$`], need: () => hasDp(q * g * 10 / 1000, 2) && q * g * 10 >= 1000 }),
  (rng, p, q, g) => { const [A] = names(rng, 1); return { prompt: `${A} is ${p * g} years old and ${A === 'Sam' ? 'their' : 'their'} mum is ${q * g} years old. Write the ratio ${A}'s age : mum's age in its simplest form.`, ans: [p, q], wrong: [[q, p], simplify([p * g, q * g - p * g])], steps: [`age : age $= ${p * g} : ${q * g}$`], need: (pp, qq) => qq * g >= 22 && qq * g <= 60 && pp * g >= 3 && qq * g - pp * g >= 18 }; },
  (rng, p, q, g) => ({ prompt: `On a school trip there are ${p * g} teachers and ${q * g} students. Write the ratio teachers : students in its simplest form.`, ans: [p, q], wrong: [[q, p], simplify([p * g, (p + q) * g])], steps: [`teachers : students $= ${p * g} : ${q * g}$`], need: (pp, qq) => qq > 4 * pp }),
  (rng, p, q, g) => { const [A] = names(rng, 1); const hw = p * g * 5; const tv = q * g * 5; return { prompt: `Last night ${A} spent ${hw} minutes doing homework and ${num(tv / 60)} hours watching TV. Write the ratio homework time : TV time in its simplest form.`, ans: [p, q], wrong: [simplify([hw, tv / 60]), simplify([hw, tv / 60 * 100]), [q, p]], steps: [`Change hours to minutes: ${num(tv / 60)} hours $= ${tv}$ minutes`, `homework : TV $= ${hw} : ${tv}$`], need: () => hasDp(tv / 60, 2) && tv >= 60 && Number.isInteger(tv / 30) }; },
  (rng, p, q, g) => ({ prompt: `A school library has ${num(p * g * 12)} fiction books and ${num(q * g * 12)} non-fiction books. Write the ratio fiction : non-fiction in its simplest form.`, ans: [p, q], wrong: [[q, p], simplify([p * g * 12, (p + q) * g * 12]), simplify([p * 6, q * 6]).map((x, i) => (i ? x + 1 : x))], steps: [`fiction : non-fiction $= ${tnum(p * g * 12)} : ${tnum(q * g * 12)}$`] }),
  (rng, p, q, g) => { const [A, B] = names(rng, 2); return { prompt: `${A} has saved ${gbp(p * g * 300)} and ${B} has saved ${gbp(q * g * 300)}. Write the ratio of ${A}'s savings to ${B}'s savings in its simplest form.`, ans: [p, q], wrong: [[q, p], simplify([p * g * 3, (p + q) * g * 3])], steps: [`${A} : ${B} $= ${p * g * 3} : ${q * g * 3}$ (in pounds)`] }; },
  (rng, p, q, g) => { const s = int(rng, 2, 9); const tot = (p + q) * g + s * g; return { prompt: `A T-shirt shop sold ${tot} T-shirts in a day: ${p * g} were small, ${s * g} were medium and the rest were large. Work out the ratio small : large in its simplest form.`, ans: [p, q], wrong: [simplify([p * g, s * g]), [q, p], simplify([p * g, tot])], steps: [`Large $= ${tot} - ${p * g} - ${s * g} = ${q * g}$`, `small : large $= ${p * g} : ${q * g}$`] }; },
  (rng, p, q, g) => ({ prompt: `A password has ${p * g} letters and ${q * g} digits and no other characters. Write the ratio digits : letters in its simplest form.`, ans: [q, p], wrong: [[p, q], simplify([q * g, (p + q) * g])], steps: [`digits : letters $= ${q * g} : ${p * g}$ (careful with the order!)`], need: (pp, qq) => (pp + qq) * g <= 24 }),
  (rng, p, q, g) => ({ prompt: `A garden has a lawn of area ${p * g * 4} m² and a patio of area ${q * g * 4} m². Write the ratio patio area : lawn area in its simplest form.`, ans: [q, p], wrong: [[p, q], simplify([q * g * 4, (p + q) * g * 4])], steps: [`patio : lawn $= ${q * g * 4} : ${p * g * 4}$ (note the order)`] }),
  (rng, p, q, g) => { const ml = p * g * 50; const l = q * g * 50 / 1000; return { prompt: `To make a squash drink, ${ml} ml of cordial is mixed with ${num(l)} litres of water. Write the ratio cordial : water in its simplest form.`, ans: [p, q], wrong: [simplify([ml, l]), simplify([ml, l * 100]), [q, p]], steps: [`${num(l)} litres $= ${tnum(q * g * 50)}$ ml`, `cordial : water $= ${ml} : ${tnum(q * g * 50)}$`], need: (pp, qq) => hasDp(qq * g * 50 / 1000, 2) && qq * g * 50 >= 1000 && qq >= 3 * pp }; },
  (rng, p, q, g) => { const r = int(rng, 1, 7); return { prompt: `A greengrocer’s stall has ${p * g} apples, ${q * g} bananas and ${r * g} oranges. Write the ratio apples : bananas : oranges in its simplest form.`, ans: simplify([p, q, r]), wrong: [[p * g, q * g, r * g], [r, q, p].map((x) => x), simplify([p, q, r]).map((x, i) => (i === 2 ? x + 1 : x))], steps: [`apples : bananas : oranges $= ${p * g} : ${q * g} : ${r * g}$`], need: () => r !== p && r !== q }; },
  (rng, p, q, g) => { const tot = (p + q) * g; return { prompt: `${tot} people went to a film. ${p * g} of them were adults and the rest were children. Write the ratio children : adults in its simplest form.`, ans: [q, p], wrong: [[p, q], simplify([q * g, tot]), simplify([tot, p * g])], steps: [`Children $= ${tot} - ${p * g} = ${q * g}$`, `children : adults $= ${q * g} : ${p * g}$`] }; },
];

export const simplifyContext = gen('rat-simplify-context', 'rat-simplify', (rng, d) => {
  for (let i = 0; i < 60; i += 1) {
    const [p, q] = coprimePair(rng, size(d, 6, 9, 13));
    const g = pick(rng, size(d, [2, 3, 4, 5], [3, 4, 6, 8, 9], [6, 7, 8, 12, 15]));
    const t = pick(rng, CONTEXT_RATIOS);
    const c = t(rng, p, q, g);
    if (c.need && !c.need(p, q, g)) continue;
    const raw = c.steps;
    const shownParts = c.ans.map((x) => x);
    return {
      prompt: c.prompt,
      answer: ratio(c.ans),
      distractors: [...rvals(c.ans, c.wrong), ...rvals(c.ans, [g % 2 === 0 ? c.ans.map((x) => x * 2) : g % 3 === 0 ? c.ans.map((x) => x * 3) : null], { keepEquivalent: true }), ...rvals(c.ans, [c.ans.map((x, j) => (j === 0 ? x + 1 : x)), c.ans.map((x, j) => (j === 1 ? x + 1 : x)), c.ans.map((x, j) => (j === 0 ? x * 2 : x)), c.ans.map((x, j) => (j === 1 ? x + 2 : x)), c.ans.map((x, j) => (j === 0 ? x + 2 : x))])],
      typed: ratioTyped(c.ans),
      solution: [...raw, `Divide every part by the highest common factor to get $${ratioTex(shownParts)}$.`, `Answer: ${ratio(c.ans)}`],
    };
  }
  throw new Error('no context fits');
}, { title: 'Write a ratio from a context and simplify', word: true });

export const ratioEquivalent = gen('rat-simplify-equivalent', 'rat-simplify', (rng, d) => {
  const [p, q] = coprimePair(rng, size(d, 6, 7, 9), 1);
  if (d === 'easy' || chance(rng, 0.5)) {
    const k = int(rng, 2, size(d, 5, 6, 9));
    const ans = [p * k, q * k];
    return {
      prompt: `Which ratio is equivalent to $${ratioTex([p, q])}$?`,
      answer: ratio(ans),
      distractors: rvals(ans, [[p + k, q + k], [q * k, p * k], [p * k, q * k + 1], [p * k, q + k], [p + (k - 1), q * k], [p * k + 1, q * k], [p * k, q * (k + 1)]]),
      typed: undefined,
      solution: [
        'Equivalent ratios come from <b>multiplying (or dividing) both parts by the same number</b>, not adding.',
        `$${tnum(p)} \\times ${k} = ${tnum(p * k)}$ and $${tnum(q)} \\times ${k} = ${tnum(q * k)}$`,
        `Watch out: adding ${k} to both parts gives $${ratioTex([p + k, q + k])}$, which is <b>not</b> equivalent.`,
        `Answer: ${ratio(ans)}`,
      ],
    };
  }
  // decimal form: which is equivalent to 9 : 6 -> 1.5 : 1 (or 1 : 1.5)
  let a; let b;
  for (let i = 0; i < 50; i += 1) {
    [a, b] = coprimePair(rng, 9, 2);
    if (hasDp(a / b, 2) && !Number.isInteger(a / b)) break;
  }
  if (!hasDp(a / b, 2) || Number.isInteger(a / b)) throw new Error('bad');
  const k = int(rng, 2, 5);
  const n = tidy(a / b);
  const ans = [n, 1];
  return {
    prompt: `Which ratio is equivalent to $${ratioTex([a * k, b * k])}$?`,
    answer: ratio(ans),
    distractors: rvals(ans, [[tidy(b / a) > 0 && hasDp(b / a, 2) ? tidy(b / a) : tidy(a - b), 1], [1, n], [a - b, 1].map(Math.abs), [tidy(n + 0.5), 1], [a, b + 1], [a + k, b + k], [b, a]]),
    solution: [
      `Simplify first: divide both parts by ${k} to get $${ratioTex([a, b])}$.`,
      `To make the second part 1, divide both parts by ${b}: $${tnum(a)} \\div ${b} = ${tnum(n)}$.`,
      `So $${ratioTex([a * k, b * k])} = ${ratioTex([a, b])} = ${ratioTex(ans)}$.`,
      `Answer: ${ratio(ans)}`,
    ],
  };
}, { title: 'Recognise an equivalent ratio' });

/* ================================================================== */
/* rat-share                                                           */
/* ================================================================== */

// Quantity kinds: money is held in pence; others in whole units.
const KINDS = {
  money: { fmt: gbp, scale: 100 },
  count: { fmt: (v) => num(v), scale: 1 },
};
const qty = (unit) => ({ fmt: withUnit(unit), scale: 1 });

// Two-way sharing templates. Each gets (A, B, a, b, T, ctx) and returns { prompt, ask: 0|1, kind }.
const SHARE2 = [
  { kind: 'money', t: (A, B, a, b, T, who) => `${A} and ${B} share ${gbp(T)} in the ratio $${a} : ${b}$. How much does ${who === 0 ? A : B} get?` },
  { kind: 'money', t: (A, B, a, b, T, who) => `${A} and ${B} win ${gbp(T)} in a quiz. They split the prize in the ratio ${A} : ${B} $= ${a} : ${b}$. How much prize money does ${who === 0 ? A : B} receive?` },
  { kind: 'count', t: (A, B, a, b, T, who) => `A bag of ${T} sweets is shared between ${A} and ${B} in the ratio $${a} : ${b}$. How many sweets does ${who === 0 ? A : B} get?` },
  { kind: 'ml', t: (A, B, a, b, T, who) => `Green paint is made by mixing blue paint and yellow paint in the ratio blue : yellow $= ${a} : ${b}$. How much ${who === 0 ? 'blue' : 'yellow'} paint is needed to make ${num(T)} ml of green paint?` },
  { kind: 'kg', t: (A, B, a, b, T, who) => `Mortar is made by mixing sand and cement in the ratio sand : cement $= ${a} : ${b}$. A builder makes ${num(T)} kg of mortar. How much ${who === 0 ? 'sand' : 'cement'} does she use?`, need: (a, b) => a > b },
  { kind: 'count', t: (A, B, a, b, T, who) => `There are ${num(T)} students in Year 10. The ratio boys : girls is $${a} : ${b}$. How many ${who === 0 ? 'boys' : 'girls'} are in Year 10?` },
  { kind: 'ml', t: (A, B, a, b, T, who) => `Orange squash is mixed with water in the ratio squash : water $= ${a} : ${b}$. ${A} makes ${num(T)} ml of drink. How much ${who === 0 ? 'squash' : 'water'} does ${A} use?`, need: (a, b) => a < b },
  { kind: 'money', t: (A, B, a, b, T, who) => `A school fair raised ${gbp(T)}. The money is split between a hospice and an animal shelter in the ratio $${a} : ${b}$. How much does the ${who === 0 ? 'hospice' : 'animal shelter'} get?` },
  { kind: 'm²', t: (A, B, a, b, T, who) => `A garden has an area of ${num(T)} m². It is split into lawn and vegetable patch in the ratio lawn : vegetable patch $= ${a} : ${b}$. What is the area of the ${who === 0 ? 'lawn' : 'vegetable patch'}?` },
  { kind: 'minutes', t: (A, B, a, b, T, who) => `${A} spends ${T} minutes revising maths and science in the ratio maths : science $= ${a} : ${b}$. How many minutes does ${A} spend on ${who === 0 ? 'maths' : 'science'}?` },
  { kind: 'count', t: (A, B, a, b, T, who) => `A café sold ${num(T)} hot drinks on Saturday. The ratio tea : coffee was $${a} : ${b}$. How many ${who === 0 ? 'teas' : 'coffees'} were sold?` },
  { kind: 'count', t: (A, B, a, b, T, who) => `In a school council election, ${num(T)} votes were cast for the two candidates, ${A} and ${B}, in the ratio $${a} : ${b}$. How many votes did ${who === 0 ? A : B} get?` },
  { kind: 'cm', t: (A, B, a, b, T, who) => `A piece of rope ${num(T)} cm long is cut into two pieces in the ratio $${a} : ${b}$. How long is the ${(who === 0) === (a < b) ? 'shorter' : 'longer'} piece?` },
  { kind: 'count', t: (A, B, a, b, T, who) => `A necklace has ${T} beads. The ratio of red beads to white beads is $${a} : ${b}$. How many ${who === 0 ? 'red' : 'white'} beads are there?` },
  { kind: 'g', t: (A, B, a, b, T, who) => `Flapjack mixture is made from oats and golden syrup in the ratio oats : syrup $= ${a} : ${b}$ by weight. How many grams of ${who === 0 ? 'oats' : 'syrup'} are in ${num(T)} g of mixture?`, need: (a, b) => a > b },
  { kind: 'money', t: (A, B, a, b, T, who) => `${A} and ${B} run a stall together and make a profit of ${gbp(T)}. They share it in the ratio $${a} : ${b}$. How much does ${who === 0 ? A : B} get?` },
];
// Templates where the ratio itself must first be formed from data (hours worked, ages, money invested).
const SHARE2_DATA = [
  { kind: 'money', t: (A, B, a, b, T, who, g) => `${A} worked for ${a * g} hours and ${B} worked for ${b * g} hours. They share ${gbp(T)} in the ratio of the hours they worked. How much does ${who === 0 ? A : B} get?`, g: [2, 3, 4] },
  { kind: 'money', t: (A, B, a, b, T, who, g) => `A grandmother shares ${gbp(T)} between her grandchildren ${A} and ${B} in the ratio of their ages. ${A} is ${a * g} and ${B} is ${b * g}. How much does ${who === 0 ? A : B} get?`, g: [2, 3, 4], need: (a, b, g) => a * g <= 18 && b * g <= 18 },
  { kind: 'money', t: (A, B, a, b, T, who, g) => `${A} invested ${gbp(a * g * 10000)} in a business and ${B} invested ${gbp(b * g * 10000)}. They share a profit of ${gbp(T)} in the ratio of the amounts they invested. How much does ${who === 0 ? A : B} get?`, g: [2, 4, 5] },
];

function shareKind(kind) { return kind === 'money' ? KINDS.money : kind === 'count' ? KINDS.count : qty(kind); }

export const shareTwo = gen('rat-share-two', 'rat-share', (rng, d) => {
  for (let i = 0; i < 80; i += 1) {
    const useData = d === 'hard' && chance(rng, 0.4);
    const tpl = pick(rng, useData ? SHARE2_DATA : SHARE2);
    const [a, b] = coprimePair(rng, size(d, 5, 9, 11));
    if (tpl.need && !tpl.need(a, b, 2)) continue;
    const g = tpl.g ? pick(rng, tpl.g) : 1;
    if (tpl.need && !tpl.need(a, b, g)) continue;
    const K = shareKind(tpl.kind);
    // value of one part, in base units (pence for money)
    let part;
    if (tpl.kind === 'money') part = size(d, int(rng, 2, 20) * 100, int(rng, 3, 40) * 100, int(rng, 30, 400) * 10 + pick(rng, [0, 5]));
    else part = size(d, int(rng, 2, 12), int(rng, 5, 30), int(rng, 12, 90)) * (['ml', 'g', 'kg', 'cm', 'm²'].includes(tpl.kind) ? pick(rng, [1, 5, 10, 25]) : 1);
    if (tpl.kind === 'minutes' && (a + b) * part > 240) continue;
    const T = (a + b) * part;
    const who = chance(rng, 0.5) ? 0 : 1;
    const [A, B] = names(rng, 2);
    const ans = (who === 0 ? a : b) * part;
    const other = (who === 0 ? b : a) * part;
    const mine = who === 0 ? a : b;
    const fmt = tpl.kind === 'money' ? gbp : K.fmt;
    const vals = [other, part, T / mine, T / 2, T * mine / Math.max(a, b) === ans ? null : T * mine / Math.max(a, b), ans + part, ans - part, T / (a * b) * mine];
    const distractors = tpl.kind === 'money' ? pvals(ans, vals) : dvals(ans, vals, fmt, { dp: 0 });
    const ratioLine = useData ? [`The ratio is $${a * g} : ${b * g}$, which simplifies to $${a} : ${b}$.`] : [];
    return {
      prompt: tpl.t(A, B, a, b, T, who, g),
      answer: fmt(ans),
      distractors,
      typed: { kind: 'number', value: tpl.kind === 'money' ? ans / 100 : ans },
      solution: [
        ...ratioLine,
        `Total number of parts: $${a} + ${b} = ${a + b}$.`,
        `One part: ${fmt(T)} $\\div ${a + b} =$ ${fmt(part)}.`,
        `${cap(fmt === gbp ? 'the share' : 'the amount')} wanted is ${mine} part${mine === 1 ? '' : 's'}: $${mine} \\times$ ${fmt(part)} $=$ ${fmt(ans)}.`,
        `Answer: ${fmt(ans)}`,
      ],
    };
  }
  throw new Error('share: no fit');
}, { title: 'Share an amount in a two-part ratio', word: true });

const SHARE3 = [
  { kind: 'money', names: true, t: (N, r, T, who) => `${N[0]}, ${N[1]} and ${N[2]} share ${gbp(T)} in the ratio $${ratioTex(r)}$. How much does ${N[who]} get?` },
  { kind: 'kg', items: ['cement', 'sand', 'gravel'], t: (N, r, T, who, it) => `Concrete is made by mixing cement, sand and gravel in the ratio $${ratioTex(r)}$. How much ${it[who]} is needed to make ${num(T)} kg of concrete?` },
  { kind: 'count', items: ['orange', 'apple', 'lime'], t: (N, r, T, who, it) => `${num(T)} students chose a juice with their school lunch, in the ratio orange : apple : lime $= ${ratioTex(r)}$. How many students chose ${it[who]}?` },
  { kind: 'count', items: ['small', 'medium', 'large'], t: (N, r, T, who, it) => `A baker sells ${num(T)} cakes in the ratio small : medium : large $= ${ratioTex(r)}$. How many ${it[who]} cakes does she sell?` },
  { kind: 'count', items: ['red', 'blue', 'green'], t: (N, r, T, who, it) => `A box holds ${T} counters. They are red, blue and green in the ratio $${ratioTex(r)}$. How many ${it[who]} counters are there?` },
  { kind: 'money', items: ['the cancer charity', 'the food bank', 'the children’s hospital'], t: (N, r, T, who, it) => `A sponsored walk raised ${gbp(T)}. It is shared between a cancer charity, a food bank and a children’s hospital in the ratio $${ratioTex(r)}$. How much does ${it[who]} receive?` },
  { kind: 'g', items: ['peanuts', 'raisins', 'chocolate chips'], t: (N, r, T, who, it) => `A trail mix contains peanuts, raisins and chocolate chips in the ratio $${ratioTex(r)}$ by weight. How many grams of ${it[who]} are in a ${num(T)} g bag?` },
  { kind: 'minutes', items: ['swimming', 'cycling', 'running'], t: (N, r, T, who, it) => `A triathlete trains for ${num(T)} minutes a week, split between swimming, cycling and running in the ratio $${ratioTex(r)}$. How many minutes does she spend ${it[who]}?` },
  { kind: 'count', items: ['adult', 'child', 'senior'], t: (N, r, T, who, it) => `A theatre sold ${num(T)} tickets. The ratio adult : child : senior tickets was $${ratioTex(r)}$. How many ${it[who]} tickets were sold?` },
  { kind: 'ml', items: ['pineapple juice', 'orange juice', 'lemonade'], t: (N, r, T, who, it) => `A fruit punch is made from pineapple juice, orange juice and lemonade in the ratio $${ratioTex(r)}$. How much ${it[who]} is in ${num(T)} ml of punch?` },
  { kind: 'm²', items: ['grass', 'flower beds', 'paving'], t: (N, r, T, who, it) => `A park of area ${num(T)} m² is divided into grass, flower beds and paving in the ratio $${ratioTex(r)}$. What area is ${it[who]}?` },
  { kind: 'money', names: true, t: (N, r, T, who) => `${N[0]}, ${N[1]} and ${N[2]} buy a lottery syndicate ticket and agree to share any winnings in the ratio $${ratioTex(r)}$. They win ${gbp(T)}. How much does ${N[who]} get?` },
  { kind: 'count', items: ['oak', 'beech', 'birch'], t: (N, r, T, who, it) => `${num(T)} trees are planted in a new wood. Oak, beech and birch trees are planted in the ratio $${ratioTex(r)}$. How many ${it[who]} trees are planted?` },
];

export const shareThree = gen('rat-share-three', 'rat-share', (rng, d) => {
  const tpl = pick(rng, SHARE3);
  const r = coprimeTriple(rng, size(d, 5, 7, 9));
  const n = r.reduce((x, y) => x + y, 0);
  let part = tpl.kind === 'money' ? size(d, int(rng, 2, 15) * 100, int(rng, 4, 30) * 100, int(rng, 20, 300) * 10) : size(d, int(rng, 2, 10), int(rng, 5, 25), int(rng, 10, 60));
  if (['kg', 'g', 'ml', 'm²'].includes(tpl.kind)) part *= pick(rng, [5, 10, 20]);
  if (tpl.kind === 'minutes') part = int(rng, 3, 10) * 5;
  const T = n * part;
  const who = int(rng, 0, 2);
  const N = names(rng, 3);
  const fmt = tpl.kind === 'money' ? gbp : tpl.kind === 'count' ? (v) => num(v) : withUnit(tpl.kind);
  const ans = r[who] * part;
  const vals = [part, T / r[who], ...r.filter((_, i) => i !== who).map((x) => x * part), T / 3, T * r[who] / (n - r[who]), ans + part];
  return {
    prompt: tpl.t(N, r, T, who, tpl.items || N),
    answer: fmt(ans),
    distractors: tpl.kind === 'money' ? pvals(ans, vals) : dvals(ans, vals, fmt, { dp: 0 }),
    typed: { kind: 'number', value: tpl.kind === 'money' ? ans / 100 : ans },
    solution: [
      `Add the parts: $${r.join(' + ')} = ${n}$.`,
      `One part: ${fmt(T)} $\\div ${n} =$ ${fmt(part)}.`,
      `The amount wanted is ${r[who]} part${r[who] === 1 ? '' : 's'}: $${r[who]} \\times$ ${fmt(part)} $=$ ${fmt(ans)}.`,
      `Answer: ${fmt(ans)}`,
    ],
  };
}, { title: 'Share an amount in a three-part ratio', word: true });

const DIFF_CTX = [
  { kind: 'money', t: (A, B, r, T) => `${A} and ${B} share ${gbp(T)} in the ratio ${A} : ${B} $= ${ratioTex(r)}$. How much more than ${B} does ${A} get?` },
  { kind: 'count', t: (A, B, r, T) => `A football club has ${num(T)} members. The ratio senior : junior members is $${ratioTex(r)}$. How many more senior members than junior members are there?` },
  { kind: 'money', big: true, t: (A, B, r, T) => `${A} and ${B} sell a car for ${gbp(T)} and share the money in the ratio $${ratioTex(r)}$, ${A} getting the larger share. How much more does ${A} get than ${B}?` },
  { kind: 'count', t: (A, B, r, T) => `A farm has ${num(T)} sheep and goats in the ratio sheep : goats $= ${ratioTex(r)}$. How many more sheep than goats are there?` },
  { kind: 'ml', t: (A, B, r, T) => `${num(T)} ml of a cleaning solution is made from water and bleach in the ratio $${ratioTex(r)}$. How much more water than bleach is in the solution?` },
  { kind: 'count', t: (A, B, r, T) => `At a concert there were ${num(T)} people. The ratio of people standing to people sitting was $${ratioTex(r)}$. How many more people were standing than sitting?` },
  { kind: 'g', t: (A, B, r, T) => `A bag of mixed nuts weighing ${num(T)} g contains cashews and almonds in the ratio $${ratioTex(r)}$. How many more grams of cashews than almonds are in the bag?` },
  { kind: 'money', t: (A, B, r, T) => `A shop’s takings of ${gbp(T)} were split between card payments and cash in the ratio $${ratioTex(r)}$. How much more was paid by card than in cash?` },
  { kind: 'count', t: (A, B, r, T) => `${num(T)} people voted in a village poll. The ratio of yes votes to no votes was $${ratioTex(r)}$. How many more people voted yes than no?` },
  { kind: 'm', t: (A, B, r, T) => `A ${num(T)} m relay course is split between ${A} and ${B} in the ratio $${ratioTex(r)}$. How much further does ${A} run than ${B}?` },
  { kind: 'count', t: (A, B, r, T) => `A cinema sold ${num(T)} tickets for two films in the ratio comedy : horror $= ${ratioTex(r)}$. How many more tickets were sold for the comedy than for the horror film?` },
  { kind: 'minutes', t: (A, B, r, T) => `${A} spent ${num(T)} minutes on a car journey, split between motorway and town driving in the ratio $${ratioTex(r)}$. How many more minutes were spent on the motorway than in town?` },
  { kind: 'count', t: (A, B, r, T) => `A school has ${num(T)} students who walk or come by bus, in the ratio walk : bus $= ${ratioTex(r)}$. How many more students walk than come by bus?` },
];

export const shareDifference = gen('rat-share-difference', 'rat-share', (rng, d) => {
  const tpl = pick(rng, DIFF_CTX);
  let r; let parts; // parts: integer version for the arithmetic
  if (d === 'hard' && (tpl.kind === 'money' || chance(rng, 0.5))) {
    // decimal ratio such as 2.6 : 1
    r = [pick(rng, [1.5, 2.5, 2.6, 3.5, 1.4, 1.8, 2.4, 3.2]), 1];
    parts = simplify(r);
  } else {
    let a; let b;
    do { [a, b] = coprimePair(rng, size(d, 7, 9, 11)); } while (a === b);
    r = a > b ? [a, b] : [b, a];
    parts = r;
  }
  const n = parts[0] + parts[1];
  let part = tpl.kind === 'money' ? int(rng, size(d, 2, 3, 3), size(d, 15, 30, 40)) * (tpl.big ? 1000 : 100) : int(rng, size(d, 2, 4, 5), size(d, 10, 25, 40)) * (['ml', 'g', 'm'].includes(tpl.kind) ? 10 : 1);
  if (tpl.kind === 'minutes') part = int(rng, 2, 8) * 5;
  if (tpl.kind === 'money' && n > 15) part = int(rng, 1, 6) * 50;
  const T = n * part;
  const big = parts[0] * part; const small = parts[1] * part;
  const ans = big - small;
  const [A, B] = names(rng, 2);
  const fmt = tpl.kind === 'money' ? gbp : tpl.kind === 'count' ? (v) => num(v) : withUnit(tpl.kind);
  const vals = [big, small, part, T / (parts[0] - parts[1]), tpl.big ? null : (parts[0] - parts[1]) * (tpl.kind === 'money' ? 100 : 1), ans / 2, ans + part];
  return {
    prompt: tpl.t(A, B, r, T),
    answer: fmt(ans),
    distractors: tpl.kind === 'money' ? pvals(ans, vals) : dvals(ans, vals, fmt, { dp: 0 }),
    typed: { kind: 'number', value: tpl.kind === 'money' ? ans / 100 : ans },
    solution: [
      ...(r[0] !== parts[0] ? [`Make the ratio whole numbers: $${ratioTex(r)} = ${ratioTex(parts)}$ (multiply by ${parts[1]}).`] : []),
      `Total parts: $${parts[0]} + ${parts[1]} = ${n}$, so one part is ${fmt(T)} $\\div ${n} =$ ${fmt(part)}.`,
      `The difference is $${parts[0]} - ${parts[1]} = ${parts[0] - parts[1]}$ part${parts[0] - parts[1] === 1 ? '' : 's'}.`,
      `$${parts[0] - parts[1]} \\times$ ${fmt(part)} $=$ ${fmt(ans)}`,
      `Answer: ${fmt(ans)}`,
    ],
  };
}, { title: 'Share in a ratio, then find the difference', word: true });

export const shareGeometry = gen('rat-share-geometry', 'rat-share', (rng, d) => {
  const type = pick(rng, size(d, ['line', 'triangle', 'point'], ['triangle', 'quad', 'rect', 'line', 'point'], ['triangle', 'quad', 'rect', 'rect', 'isos']));
  const pickParts = (k, total) => {
    for (let i = 0; i < 200; i += 1) {
      const r = Array.from({ length: k }, () => int(rng, 1, size(d, 6, 9, 12)));
      const s = r.reduce((x, y) => x + y, 0);
      if (total % s === 0 && Math.max(...r) * (total / s) < 180 && new Set(r).size === k && r.reduce((x, y) => gcd(x, y)) === 1) return r;
    }
    throw new Error('no parts');
  };
  if (type === 'rect') {
    const [l, w] = coprimePair(rng, 9); const r = l > w ? [l, w] : [w, l];
    const unit = int(rng, 2, 9);
    const P = 2 * (r[0] + r[1]) * unit;
    const askLen = chance(rng, 0.5);
    const ans = (askLen ? r[0] : r[1]) * unit;
    return {
      prompt: `A rectangle has a perimeter of ${P} cm. The ratio length : width is $${ratioTex(r)}$. Work out the ${askLen ? 'length' : 'width'} of the rectangle.`,
      answer: `${ans} cm`,
      distractors: dvals(ans, [(askLen ? r[0] : r[1]) * 2 * unit, (askLen ? r[1] : r[0]) * unit, P / (r[0] + r[1]), unit, ans + unit], withUnit('cm'), { dp: 1 }),
      typed: { kind: 'number', value: ans },
      solution: [
        `A perimeter goes round two lengths and two widths, so length + width $= ${P} \\div 2 = ${P / 2}$ cm.`,
        `Share ${P / 2} in the ratio $${ratioTex(r)}$: one part $= ${P / 2} \\div ${r[0] + r[1]} = ${unit}$ cm.`,
        `${askLen ? 'Length' : 'Width'} $= ${askLen ? r[0] : r[1]} \\times ${unit} = ${ans}$ cm. (Don't share the whole perimeter!)`,
        `Answer: ${ans} cm`,
      ],
    };
  }
  if (type === 'isos') {
    // isosceles triangle: base angle : apex angle = a : b
    for (let i = 0; i < 100; i += 1) {
      const [a, b] = coprimePair(rng, 9);
      if (180 % (2 * a + b) !== 0) continue;
      const u = 180 / (2 * a + b);
      const ask = chance(rng, 0.5) ? 'apex' : 'base';
      const ans = ask === 'apex' ? b * u : a * u;
      const wrongU = 180 / (a + b);
      return {
        prompt: `In an isosceles triangle, the ratio of one of the two equal angles to the third angle is $${a} : ${b}$. Work out the size of ${ask === 'apex' ? 'the third angle' : 'one of the equal angles'}.`,
        answer: `$${ans}^\\circ$`,
        distractors: dvals(ans, [ask === 'apex' ? b * wrongU : a * wrongU, ask === 'apex' ? a * u : b * u, 180 - ans, u, (180 - ans) / 2, 180 - 2 * ans, ans * 2, ans + u, ans + 10], (v) => `$${tnum(v)}^\\circ$`, { dp: 1 }),
        typed: { kind: 'number', value: ans },
        solution: [
          `The triangle has <b>two</b> equal angles, so the angles are in the ratio $${a} : ${a} : ${b}$.`,
          `Angles in a triangle add up to $180^\\circ$. Total parts $= ${a} + ${a} + ${b} = ${2 * a + b}$, so one part $= 180 \\div ${2 * a + b} = ${u}^\\circ$.`,
          `${ask === 'apex' ? 'Third angle' : 'Equal angle'} $= ${ask === 'apex' ? b : a} \\times ${u} = ${ans}^\\circ$`,
          `Answer: $${ans}^\\circ$`,
        ],
      };
    }
    throw new Error('isos');
  }
  const cfg = { line: { k: 2, total: 180, what: 'Two angles on a straight line', fact: 'Angles on a straight line add up to' }, point: { k: 3, total: 360, what: 'Three angles around a point', fact: 'Angles around a point add up to' }, triangle: { k: 3, total: 180, what: 'The three angles of a triangle', fact: 'Angles in a triangle add up to' }, quad: { k: 4, total: 360, what: 'The four angles of a quadrilateral', fact: 'Angles in a quadrilateral add up to' } }[type];
  const r = pickParts(cfg.k, cfg.total);
  const s = r.reduce((x, y) => x + y, 0);
  const u = cfg.total / s;
  const big = chance(rng, 0.5);
  const ask = cfg.k === 2 ? (big ? 'larger' : 'smaller') : (big ? 'largest' : 'smallest');
  const v = big ? Math.max(...r) : Math.min(...r);
  const ans = v * u;
  const altTotal = cfg.total === 180 ? 360 : 180;
  return {
    prompt: `${cfg.what} are in the ratio $${ratioTex(r)}$. Work out the size of the ${ask} angle.`,
    answer: `$${ans}^\\circ$`,
    distractors: dvals(ans, [v * altTotal / s, u, (big ? Math.min(...r) : Math.max(...r)) * u, cfg.total - ans, ...r.map((x) => x * u), v * 10, (v + 1) * u, (v - 1) * u, cfg.total / r.length, ans + 10, ans - 10, ans + 20], (x) => `$${tnum(x)}^\\circ$`, { dp: 1 }),
    typed: { kind: 'number', value: ans },
    solution: [
      `${cfg.fact} $${cfg.total}^\\circ$.`,
      `Total parts: $${r.join(' + ')} = ${s}$, so one part is $${cfg.total} \\div ${s} = ${u}^\\circ$.`,
      `The ${ask} angle is ${v} parts: $${v} \\times ${u} = ${ans}^\\circ$.`,
      `Answer: $${ans}^\\circ$`,
    ],
  };
}, { title: 'Angles and perimeters shared in a ratio' });

export const shareDivide = gen('rat-share-divide-number', 'rat-share', (rng, d) => {
  let a; let b; let part; let T;
  for (let i = 0; i < 200; i += 1) {
    [a, b] = coprimePair(rng, size(d, 6, 9, 13));
    if (d === 'hard') {
      // whole-number total, one part with one decimal place (e.g. 62 in the ratio 3 : 7)
      T = int(rng, 20, 150);
      part = tidy(T / (a + b));
      if (hasDp(part, 1) && !Number.isInteger(part)) break;
    } else {
      part = size(d, int(rng, 2, 15), int(rng, 13, 60), 0);
      T = (a + b) * part;
      break;
    }
  }
  if (!hasDp(part, 1)) throw new Error('part');
  const x = tidy(a * part); const y = tidy(b * part);
  const pair = (p, q) => `$${tnum(p)}$ and $${tnum(q)}$`;
  const shifts = [[x - part, y + part], [x + part, y - part], [part, tidy(T - part)], [tidy(T / 2), tidy(T / 2)], [x - 2 * part, y + 2 * part], [y, x], [x * 2, T - x * 2], [x + 1, y - 1], [x - 1, y + 1], [x + 2, y - 2], [x - 2, y + 2], [x + 3, y - 3], [x - 3, y + 3]];
  const seen = new Set([`${x}|${y}`]);
  const distractors = [];
  for (const [p, q] of shifts) {
    const P = tidy(p); const Q = tidy(q);
    if (P <= 0 || Q <= 0 || seen.has(`${P}|${Q}`) || (P === y && Q === x && false)) continue;
    seen.add(`${P}|${Q}`);
    distractors.push(pair(P, Q));
  }
  return {
    prompt: `Divide ${num(T)} in the ratio $${a} : ${b}$.`,
    answer: pair(x, y),
    distractors: distractors.filter((t) => t !== pair(y, x)),
    typed: { kind: 'list', values: [x, y] },
    solution: [
      `Total parts: $${a} + ${b} = ${a + b}$.`,
      `One part: $${tnum(T)} \\div ${a + b} = ${tnum(part)}$.`,
      `$${a} \\times ${tnum(part)} = ${tnum(x)}$ and $${b} \\times ${tnum(part)} = ${tnum(y)}$. Check: $${tnum(x)} + ${tnum(y)} = ${tnum(T)}$ ✓`,
      `Answer: ${pair(x, y)}`,
    ],
  };
}, { title: 'Divide a number in a ratio' });

/* ================================================================== */
/* rat-given-part                                                      */
/* ================================================================== */

// Each: labels for the two parts, unit kind, phrasing for knowing one part and asking for the other/total.
const PART_CTX = [
  { kind: 'money', lab: (A, B) => [A, B], t: (A, B, r, kv, ki, ask) => `${A} and ${B} share some money in the ratio $${ratioTex(r)}$. ${[A, B][ki]} gets ${kv}. ${ask === 'total' ? 'How much money did they share altogether?' : `How much does ${[A, B][1 - ki]} get?`}` },
  { kind: 'l', lab: () => ['blue', 'yellow'], t: (A, B, r, kv, ki, ask) => `Green paint is made by mixing blue and yellow paint in the ratio blue : yellow $= ${ratioTex(r)}$. A decorator uses ${kv} of ${['blue', 'yellow'][ki]} paint. ${ask === 'total' ? 'How much green paint does she make?' : `How much ${['blue', 'yellow'][1 - ki]} paint does she need?`}` },
  { kind: 'count', lab: () => ['boys', 'girls'], t: (A, B, r, kv, ki, ask) => `In a drama club the ratio boys : girls is $${ratioTex(r)}$. There are ${kv} ${['boys', 'girls'][ki]}. ${ask === 'total' ? 'How many members does the club have?' : `How many ${['boys', 'girls'][1 - ki]} are there?`}` },
  { kind: 'count', lab: () => ['dogs', 'cats'], t: (A, B, r, kv, ki, ask) => `At an animal rescue centre the ratio dogs : cats is $${ratioTex(r)}$. There are ${kv} ${['dogs', 'cats'][ki]}. ${ask === 'total' ? 'How many dogs and cats are there altogether?' : `How many ${['dogs', 'cats'][1 - ki]} are there?`}` },
  { kind: 'kg', lab: () => ['cement', 'sand'], t: (A, B, r, kv, ki, ask) => `Mortar is made from cement and sand in the ratio cement : sand $= ${ratioTex(r)}$. A builder has ${kv} of ${['cement', 'sand'][ki]}. ${ask === 'total' ? 'How much mortar can she make if she uses all of it?' : `How much ${['cement', 'sand'][1 - ki]} does she need to go with it?`}` },
  { kind: 'count', lab: () => ['adult', 'child'], t: (A, B, r, kv, ki, ask) => `At a zoo one morning, adult and child tickets were sold in the ratio adult : child $= ${ratioTex(r)}$. ${kv} ${['adult', 'child'][ki]} tickets were sold. ${ask === 'total' ? 'How many tickets were sold altogether?' : `How many ${['adult', 'child'][1 - ki]} tickets were sold?`}` },
  { kind: 'g', lab: () => ['flour', 'sugar'], t: (A, B, r, kv, ki, ask) => `A biscuit recipe uses flour and sugar in the ratio flour : sugar $= ${ratioTex(r)}$. ${['', ''][0]}A baker uses ${kv} of ${['flour', 'sugar'][ki]}. ${ask === 'total' ? 'What is the total mass of flour and sugar?' : `How much ${['flour', 'sugar'][1 - ki]} does he use?`}` },
  { kind: 'count', lab: () => ['fiction', 'non-fiction'], t: (A, B, r, kv, ki, ask) => `In a bookshop the ratio of fiction books to non-fiction books is $${ratioTex(r)}$. There are ${kv} ${['fiction', 'non-fiction'][ki]} books. ${ask === 'total' ? 'How many books are there altogether?' : `How many ${['fiction', 'non-fiction'][1 - ki]} books are there?`}` },
  { kind: 'l', scale: 10, lab: () => ['fridge', 'freezer'], t: (A, B, r, kv, ki, ask) => `In a fridge-freezer, fridge capacity : freezer capacity $= ${ratioTex(r)}$. The ${['fridge', 'freezer'][ki]} capacity is ${kv}. ${ask === 'total' ? 'What is the total capacity?' : `What is the ${['fridge', 'freezer'][1 - ki]} capacity?`}` },
  { kind: 'money', scale: 10, lab: () => ['deposit', 'monthly payments'], t: (A, B, r, kv, ki, ask) => `${A} books a family holiday and pays a deposit and then monthly payments in the ratio deposit : total of monthly payments $= ${ratioTex(r)}$. ${ki === 0 ? `The deposit is ${kv}.` : `The monthly payments add up to ${kv}.`} ${ask === 'total' ? 'What is the cost of the holiday?' : (ki === 0 ? 'What is the total of the monthly payments?' : 'How much is the deposit?')}` },
  { kind: 'count', lab: () => ['wins', 'losses'], t: (A, B, r, kv, ki, ask) => `A chess club’s results this season are in the ratio wins : losses $= ${ratioTex(r)}$ (there were no draws). They had ${kv} ${['wins', 'losses'][ki]}. ${ask === 'total' ? 'How many games did they play?' : `How many ${['wins', 'losses'][1 - ki]} did they have?`}` },
  { kind: 'ml', lab: () => ['juice', 'water'], t: (A, B, r, kv, ki, ask) => `${A} mixes juice and water in the ratio juice : water $= ${ratioTex(r)}$. She uses ${kv} of ${['juice', 'water'][ki]}. ${ask === 'total' ? 'How much drink does she make?' : `How much ${['juice', 'water'][1 - ki]} does she use?`}` },
  { kind: 'count', lab: () => ['red', 'green'], t: (A, B, r, kv, ki, ask) => `A greengrocer has red apples and green apples in the ratio red : green $= ${ratioTex(r)}$. He has ${kv} ${['red', 'green'][ki]} apples. ${ask === 'total' ? 'How many apples does he have altogether?' : `How many ${['red', 'green'][1 - ki]} apples does he have?`}` },
  { kind: 'money', lab: (A, B) => [A, B], t: (A, B, r, kv, ki, ask) => `The money in ${A}'s and ${B}'s savings accounts is in the ratio ${A} : ${B} $= ${ratioTex(r)}$. ${[A, B][ki]} has ${kv}. ${ask === 'total' ? 'How much do they have altogether?' : `How much does ${[A, B][1 - ki]} have?`}` },
];

export const partKnown = gen('rat-part-known', 'rat-given-part', (rng, d) => {
  const tpl = pick(rng, PART_CTX);
  const [a, b] = coprimePair(rng, size(d, 6, 9, 12));
  const r = [a, b];
  const ki = int(rng, 0, 1);
  const ask = chance(rng, 0.5) ? 'other' : 'total';
  let part;
  if (tpl.kind === 'money') part = size(d, int(rng, 2, 20) * 100, int(rng, 3, 30) * 100, int(rng, 21, 250) * 10 + pick(rng, [0, 5])) * (tpl.scale || 1);
  else part = size(d, int(rng, 2, 10), int(rng, 3, 20), int(rng, 6, 40)) * (['g', 'ml'].includes(tpl.kind) ? pick(rng, [5, 10, 25]) : 1) * (tpl.scale && d !== 'hard' ? tpl.scale : 1);
  const fmt = tpl.kind === 'money' ? gbp : tpl.kind === 'count' ? (v) => num(v) : withUnit(tpl.kind === 'l' ? 'litres' : tpl.kind);
  const known = r[ki] * part; const other = r[1 - ki] * part; const total = known + other;
  const ans = ask === 'total' ? total : other;
  const [A, B] = names(rng, 2);
  const L = tpl.lab(A, B);
  const scale = tpl.kind === 'money' ? 100 : 1;
  const vals = ask === 'total'
    ? [other, known * (a + b), known / r[ki] * r[1 - ki], known + (a + b) * scale, known * r[1 - ki] / r[ki] + known * 2, (known / r[1 - ki]) * (a + b)]
    : [known * r[ki] / r[1 - ki], total, known + (r[1 - ki] - r[ki]) * scale, known * r[1 - ki], part, known / r[ki]];
  return {
    prompt: tpl.t(A, B, r, fmt(known), ki, ask),
    answer: fmt(ans),
    distractors: tpl.kind === 'money' ? pvals(ans, vals) : dvals(ans, vals, fmt, { dp: 1 }),
    typed: { kind: 'number', value: ans / scale },
    solution: [
      `${cap(L[ki])} is ${r[ki]} part${r[ki] === 1 ? '' : 's'}, so one part $=$ ${fmt(known)} $\\div ${r[ki]} =$ ${fmt(part)}.`,
      ask === 'total'
        ? `Total parts $= ${a} + ${b} = ${a + b}$, so the total is $${a + b} \\times$ ${fmt(part)} $=$ ${fmt(total)}.`
        : `${cap(L[1 - ki])} is ${r[1 - ki]} parts: $${r[1 - ki]} \\times$ ${fmt(part)} $=$ ${fmt(other)}.`,
      `Answer: ${fmt(ans)}`,
    ],
  };
}, { title: 'Ratio with one share known: find the other share or the total', word: true });

const DIFFK_CTX = [
  { kind: 'money', t: (A, B, r, dv, ask) => `${A} and ${B} share some money in the ratio $${ratioTex(r)}$. ${B} gets ${dv} more than ${A}. ${ask === 'total' ? 'How much money did they share?' : `How much does ${A} get?`}` },
  { kind: 'count', t: (A, B, r, dv, ask) => `The ratio of boys to girls in a school choir is $${ratioTex(r)}$. There are ${dv} more girls than boys. ${ask === 'total' ? 'How many people are in the choir?' : 'How many boys are in the choir?'}` },
  { kind: 'count', t: (A, B, r, dv, ask) => `In a car park the ratio of red cars to silver cars is $${ratioTex(r)}$. There are ${dv} more silver cars than red cars. ${ask === 'total' ? 'How many red and silver cars are there altogether?' : 'How many red cars are there?'}` },
  { kind: 'g', t: (A, B, r, dv, ask) => `A cereal mix contains raisins and oats in the ratio $${ratioTex(r)}$ by weight. A box contains ${dv} more oats than raisins. ${ask === 'total' ? 'What is the total weight of raisins and oats?' : 'What weight of raisins is in the box?'}` },
  { kind: 'count', t: (A, B, r, dv, ask) => `${A} and ${B} collect football stickers in the ratio $${ratioTex(r)}$. ${B} has ${dv} more stickers than ${A}. ${ask === 'total' ? 'How many stickers do they have altogether?' : `How many stickers does ${A} have?`}` },
  { kind: 'count', t: (A, B, r, dv, ask) => `On a train the ratio of first-class to standard passengers is $${ratioTex(r)}$. There are ${dv} more standard passengers than first-class passengers. ${ask === 'total' ? 'How many passengers are on the train?' : 'How many first-class passengers are there?'}` },
  { kind: 'money', t: (A, B, r, dv, ask) => `A charity splits its donations between local and overseas projects in the ratio $${ratioTex(r)}$. Overseas projects get ${dv} more than local projects. ${ask === 'total' ? 'What was the total amount donated?' : 'How much do local projects get?'}` },
  { kind: 'ml', t: (A, B, r, dv, ask) => `A smoothie is made from yoghurt and fruit juice in the ratio $${ratioTex(r)}$. A jug of smoothie has ${dv} more fruit juice than yoghurt. ${ask === 'total' ? 'How much smoothie is in the jug?' : 'How much yoghurt is in the jug?'}` },
  { kind: 'count', t: (A, B, r, dv, ask) => `A garden centre has roses and tulips in the ratio $${ratioTex(r)}$. It has ${dv} more tulips than roses. ${ask === 'total' ? 'How many roses and tulips are there altogether?' : 'How many roses are there?'}` },
  { kind: 'money', t: (A, B, r, dv, ask) => `The weekly pocket money of ${A} and ${B} is in the ratio $${ratioTex(r)}$. ${B} gets ${dv} more each week than ${A}. ${ask === 'total' ? 'How much do they get altogether each week?' : `How much does ${A} get each week?`}`, small: true },
  { kind: 'count', t: (A, B, r, dv, ask) => `At a wedding the ratio of guests choosing chicken to guests choosing fish is $${ratioTex(r)}$. ${dv} more guests chose fish than chicken. ${ask === 'total' ? 'How many guests chose chicken or fish?' : 'How many guests chose chicken?'}` },
  { kind: 'count', t: (A, B, r, dv, ask) => `A survey asked people whether they prefer summer or winter. The ratio summer : winter was $${ratioTex(r)}$ with ${dv} more people choosing winter. ${ask === 'total' ? 'How many people answered the survey?' : 'How many people chose summer?'}` },
  { kind: 'cm', t: (A, B, r, dv, ask) => `A plank is cut into two pieces in the ratio $${ratioTex(r)}$. One piece is ${dv} longer than the other. ${ask === 'total' ? 'How long was the plank?' : 'How long is the shorter piece?'}` },
];

export const diffKnown = gen('rat-diff-known', 'rat-given-part', (rng, d) => {
  const tpl = pick(rng, DIFFK_CTX);
  let a; let b;
  do { [a, b] = coprimePair(rng, size(d, 7, 9, 13)); } while (a >= b || (d !== 'easy' && b - a === 1));
  const r = [a, b];
  const ask = chance(rng, 0.5) ? 'small' : 'total';
  let part;
  if (tpl.kind === 'money') part = tpl.small ? int(rng, 1, 8) * 50 : size(d, int(rng, 2, 20) * 100, int(rng, 3, 30) * 100, int(rng, 21, 250) * 10);
  else part = size(d, int(rng, 2, 10), int(rng, 3, 25), int(rng, 6, 40)) * (['g', 'ml', 'cm'].includes(tpl.kind) ? pick(rng, [5, 10]) : 1);
  const fmt = tpl.kind === 'money' ? gbp : tpl.kind === 'count' ? (v) => num(v) : withUnit(tpl.kind);
  const diff = (b - a) * part; const small = a * part; const big = b * part; const total = small + big;
  const ans = ask === 'total' ? total : small;
  const [A, B] = names(rng, 2);
  const vals = ask === 'total'
    ? [diff * (a + b), big, diff * b, total - part, small + diff, diff * 2]
    : [diff * a, big, diff, part, diff / a, total];
  return {
    prompt: tpl.t(A, B, r, fmt(diff), ask),
    answer: fmt(ans),
    distractors: tpl.kind === 'money' ? pvals(ans, vals) : dvals(ans, vals, fmt, { dp: 1 }),
    typed: { kind: 'number', value: tpl.kind === 'money' ? ans / 100 : ans },
    solution: [
      `The difference between the shares is $${b} - ${a} = ${b - a}$ part${b - a === 1 ? '' : 's'}.`,
      `${b - a} part${b - a === 1 ? '' : 's'} $=$ ${fmt(diff)}, so one part $=$ ${fmt(diff)} $\\div ${b - a} =$ ${fmt(part)}.`,
      ask === 'total' ? `Total $= ${a + b}$ parts $= ${a + b} \\times$ ${fmt(part)} $=$ ${fmt(total)}.` : `The smaller share is ${a} part${a === 1 ? '' : 's'} $= ${a} \\times$ ${fmt(part)} $=$ ${fmt(small)}.`,
      `Answer: ${fmt(ans)}`,
    ],
  };
}, { title: 'Ratio with the difference known', word: true });

const divTex = (x, y) => (hasDp(x / y, 2) ? tnum(tidy(x / y)) : `${tnum(Math.round((x / y) * 100) / 100)}\\ldots`);
const LIMIT_CTX = [
  { a: 'red paint', b: 'blue paint', prod: 'purple paint', unit: 'litres', t: (r, x, y) => `Purple paint is made by mixing red paint and blue paint in the ratio $${ratioTex(r)}$. Yan has ${x} litres of red paint and ${y} litres of blue paint. What is the greatest amount of purple paint he can make?` },
  { a: 'cement', b: 'sand', prod: 'mortar', unit: 'kg', t: (r, x, y) => `Mortar is made by mixing cement and sand in the ratio $${ratioTex(r)}$. A builder has ${x} kg of cement and ${y} kg of sand. What is the greatest amount of mortar she can make?` },
  { a: 'squash', b: 'water', prod: 'drink', unit: 'ml', t: (r, x, y) => `A drink is made by mixing squash and water in the ratio $${ratioTex(r)}$. There are ${x} ml of squash and ${y} ml of water. What is the greatest amount of drink that can be made?` },
  { a: 'white paint', b: 'black paint', prod: 'grey paint', unit: 'litres', t: (r, x, y) => `Grey paint is mixed from white and black paint in the ratio white : black $= ${ratioTex(r)}$. A decorator has ${x} litres of white and ${y} litres of black. What is the most grey paint he can mix?` },
  { a: 'compost', b: 'sand', prod: 'potting mix', unit: 'kg', t: (r, x, y) => `A gardener makes potting mix from compost and sand in the ratio $${ratioTex(r)}$. She has ${x} kg of compost and ${y} kg of sand. What is the maximum amount of potting mix she can make?` },
  { a: 'orange juice', b: 'lemonade', prod: 'punch', unit: 'ml', t: (r, x, y) => `Fruit punch is made from orange juice and lemonade in the ratio $${ratioTex(r)}$. There are ${x} ml of orange juice and ${y} ml of lemonade. What is the largest amount of punch that can be made?` },
  { a: 'flour', b: 'butter', prod: 'pastry', unit: 'g', t: (r, x, y) => `Pastry is made with flour and butter in the ratio $${ratioTex(r)}$ by weight. A chef has ${x} g of flour and ${y} g of butter. What is the greatest mass of pastry he can make?` },
  { a: 'copper', b: 'zinc', prod: 'brass', unit: 'kg', t: (r, x, y) => `Brass is an alloy of copper and zinc in the ratio $${ratioTex(r)}$ by mass. A foundry has ${x} kg of copper and ${y} kg of zinc. What is the greatest mass of brass it can make?` },
  { a: 'oats', b: 'honey', prod: 'granola', unit: 'g', t: (r, x, y) => `Granola is made from oats and honey in the ratio $${ratioTex(r)}$ by weight. ${'Mia'} has ${x} g of oats and ${y} g of honey. What is the most granola she can make?` },
  { a: 'rice', b: 'lentils', prod: 'mix', unit: 'g', t: (r, x, y) => `A kedgeree mix uses rice and lentils in the ratio $${ratioTex(r)}$. A cook has ${x} g of rice and ${y} g of lentils. What is the greatest mass of mix he can make?` },
  { a: 'yellow paint', b: 'blue paint', prod: 'green paint', unit: 'litres', t: (r, x, y) => `Green paint is mixed from yellow and blue paint in the ratio $${ratioTex(r)}$. A painter has ${x} litres of yellow and ${y} litres of blue. How many litres of green paint can she make at most?` },
  { a: 'cordial', b: 'sparkling water', prod: 'drink', unit: 'ml', t: (r, x, y) => `A café mixes elderflower cordial with sparkling water in the ratio $${ratioTex(r)}$. It has ${x} ml of cordial and ${y} ml of sparkling water. What is the greatest amount of drink it can make?` },
  { a: 'gravel', b: 'cement', prod: 'concrete mix', unit: 'kg', t: (r, x, y) => `A dry concrete mix uses gravel and cement in the ratio $${ratioTex(r)}$. A builder has ${x} kg of gravel and ${y} kg of cement. What is the greatest amount of mix he can make?` },
];

export const partLimiting = gen('rat-part-limiting', 'rat-given-part', (rng, d) => {
  const tpl = pick(rng, LIMIT_CTX);
  let a; let b;
  do { [a, b] = coprimePair(rng, size(d, 5, 7, 9)); } while (a === b);
  const r = [a, b];
  const mult = ['ml', 'g'].includes(tpl.unit) ? pick(rng, [10, 20, 25, 50]) : 1;
  const k = int(rng, size(d, 3, 4, 5), size(d, 8, 12, 15)) * mult; // size of one part when limited
  const limitA = chance(rng, 0.5);
  // the limiting ingredient is fully used: x = a*k (if limitA) ; the other has a bit more than needed
  let x; let y;
  if (limitA) { x = a * k; y = b * k + int(rng, 1, Math.max(2, b * k / 2 | 0)); } else { y = b * k; x = a * k + int(rng, 1, Math.max(2, a * k / 2 | 0)); }
  if (mult > 1) { if (limitA) y = Math.ceil(y / mult) * mult; else x = Math.ceil(x / mult) * mult; }
  // make sure the other ingredient really is in excess
  if (limitA ? y / b <= k : x / a <= k) throw new Error('not excess');
  const ans = (a + b) * k;
  const fmt = withUnit(tpl.unit);
  const wrongK = limitA ? y / b : x / a; // using the excess ingredient as the limit
  return {
    prompt: tpl.t(r, num(x), num(y)),
    answer: fmt(ans),
    distractors: dvals(ans, [x + y, (a + b) * wrongK, limitA ? x + x * b / a + 0 : y + y * a / b, limitA ? x * (a + b) : y * (a + b), Math.max(x, y) / Math.max(a, b) * (a + b), limitA ? y + y * a / b : x + x * b / a], fmt, { dp: 1, round: true }),
    typed: { kind: 'number', value: ans },
    solution: [
      `How many "parts" does each ingredient allow? ${cap(tpl.a)}: $${tnum(x)} \\div ${a} = ${divTex(x, a)}$. ${cap(tpl.b)}: $${tnum(y)} \\div ${b} = ${divTex(y, b)}$.`,
      `The smaller value, ${num(k)}, is the limit: the ${limitA ? tpl.a : tpl.b} runs out first.`,
      `Total made $= (${a} + ${b}) \\times ${tnum(k)} = ${tnum(ans)}$ ${tpl.unit}. (Some ${limitA ? tpl.b : tpl.a} is left over, so you can't just add the amounts.)`,
      `Answer: ${fmt(ans)}`,
    ],
  };
}, { title: 'Limiting ingredient: the most that can be made', word: true });

const RANGE_CTX = [
  { g: ['adults', 'children'], where: (lo, hi) => `On a train there are between ${lo} and ${hi} people.` },
  { g: ['boys', 'girls'], where: (lo, hi) => `A youth club has between ${lo} and ${hi} members.` },
  { g: ['cars', 'vans'], where: (lo, hi) => `A car park holds between ${lo} and ${hi} vehicles, all cars or vans.` },
  { g: ['red counters', 'blue counters'], where: (lo, hi) => `A bag contains between ${lo} and ${hi} counters, all red or blue.` },
  { g: ['hardbacks', 'paperbacks'], where: (lo, hi) => `A shelf has between ${lo} and ${hi} books, all hardbacks or paperbacks.` },
  { g: ['sheep', 'cows'], where: (lo, hi) => `A farmer has between ${lo} and ${hi} animals, all sheep or cows.` },
  { g: ['violinists', 'other players'], where: (lo, hi) => `An orchestra has between ${lo} and ${hi} players.` },
  { g: ['women', 'men'], where: (lo, hi) => `At a party there are between ${lo} and ${hi} guests.` },
  { g: ['seated fans', 'standing fans'], where: (lo, hi) => `A small concert venue has between ${lo} and ${hi} fans inside.` },
  { g: ['dogs', 'cats'], where: (lo, hi) => `A vet saw between ${lo} and ${hi} animals last week, all dogs or cats.` },
  { g: ['milk chocolates', 'dark chocolates'], where: (lo, hi) => `A tin contains between ${lo} and ${hi} chocolates, all milk or dark.` },
  { g: ['walkers', 'cyclists'], where: (lo, hi) => `Between ${lo} and ${hi} people used a canal path one morning, all walkers or cyclists.` },
  { g: ['Year 7 students', 'Year 8 students'], where: (lo, hi) => `Between ${lo} and ${hi} students from Years 7 and 8 went on a trip.` },
];

export const totalRange = gen('rat-total-range', 'rat-given-part', (rng, d) => {
  const tpl = pick(rng, RANGE_CTX);
  let a; let b;
  do { [a, b] = coprimePair(rng, size(d, 5, 8, 11)); } while (a + b < 5);
  const n = a + b;
  const k = int(rng, size(d, 3, 4, 5), size(d, 8, 10, 14));
  const total = n * k;
  // a window of width < n containing exactly one multiple of n
  const lo = total - int(rng, 1, n - 2 > 1 ? n - 2 : 1);
  const hi = lo + n - (d === 'hard' ? 0 : 1);
  if (hi - lo < 4) throw new Error('window too narrow');
  // check exactly one multiple of n in (lo, hi)
  let count = 0; for (let v = lo + 1; v < hi; v += 1) if (v % n === 0) count += 1;
  if (count !== 1) throw new Error('window');
  const ask = d === 'easy' ? 'total' : pick(rng, ['total', 'first', 'second']);
  const ans = ask === 'total' ? total : ask === 'first' ? a * k : b * k;
  const inRange = []; for (let v = lo + 1; v < hi; v += 1) if (v !== total && (v % a === 0 || v % b === 0 || v % 2 === 0)) inRange.push(v);
  const q = ask === 'total' ? 'How many are there altogether?' : `How many ${tpl.g[ask === 'first' ? 0 : 1]} are there?`;
  return {
    prompt: `${tpl.where(lo, hi)} The ratio ${tpl.g[0]} : ${tpl.g[1]} is $${a} : ${b}$. ${ask === 'total' ? `Work out the total number.` : q}`,
    answer: num(ans),
    distractors: dvals(ans, ask === 'total' ? [...inRange, a * b * 2] : [total, ask === 'first' ? b * k : a * k, a * (k + 1), b * (k - 1), ans + 1, ...inRange.slice(0, 2)], (v) => num(v), { dp: 0 }),
    typed: { kind: 'number', value: ans },
    solution: [
      `The total must be a multiple of $${a} + ${b} = ${n}$, because every group is made of ${n} parts.`,
      `The only multiple of ${n} between ${lo} and ${hi} is ${total} $(= ${n} \\times ${k})$.`,
      ...(ask === 'total' ? [] : [`One part $= ${k}$, so the number of ${tpl.g[ask === 'first' ? 0 : 1]} is $${ask === 'first' ? a : b} \\times ${k} = ${ans}$.`]),
      `Answer: ${num(ans)}`,
    ],
  };
}, { title: 'Total must be a multiple of the parts (between two numbers)', word: true });

/* ================================================================== */
/* rat-ratio-fractions                                                 */
/* ================================================================== */

// [x, y, things, where]: where completes "the {things} {where}".
const PAIR_ITEMS = [
  ['red', 'blue', 'buttons', 'in a jar'], ['green', 'red', 'pens', 'in a box'], ['milk', 'dark', 'chocolates', 'in a tin'],
  ['boys', 'girls', 'students', 'in a class'], ['cats', 'dogs', 'pets', 'at a rescue centre'], ['strawberry', 'lemon', 'sweets', 'in a bag'],
  ['fiction', 'non-fiction', 'books', 'on a shelf'], ['white', 'brown', 'eggs', 'in a tray'], ['silver', 'black', 'cars', 'in a car park'],
  ['adults', 'children', 'people', 'at a cinema'],
];
const isGroup = (x) => ['boys', 'girls', 'cats', 'dogs', 'adults', 'children'].includes(x);
const groupName = (x, things) => (isGroup(x) ? x : `${x} ${things}`);

export const ratioToFraction = gen('rat-ratio-to-fraction', 'rat-ratio-fractions', (rng, d) => {
  const [x, y, things, where] = pick(rng, PAIR_ITEMS);
  const mode = size(d, 'whole', pick(rng, ['whole', 'whole', 'of-other']), pick(rng, ['three', 'of-other', 'three']));
  if (mode === 'three') {
    const r = coprimeTriple(rng, 9);
    const n = r[0] + r[1] + r[2];
    const ci = int(rng, 0, 2);
    const cols = pick(rng, [['orange', 'apple', 'lime'], ['red', 'yellow', 'green'], ['gold', 'silver', 'bronze'], ['walk', 'bus', 'car']]);
    const ans = [r[ci], n];
    return {
      prompt: `Students choose ${cols[0]}, ${cols[1]} or ${cols[2]} in the ratio $${ratioTex(r)}$. What fraction of the students choose ${cols[ci]}?`,
      answer: fopt(...ans),
      distractors: fvals(ans, [[r[ci], n - r[ci]], [r[ci], r[(ci + 1) % 3]], [r[ci], n + 1], [n - r[ci], n], [1, 3], [r[ci], 10]], { proper: true }),
      typed: { kind: 'number', value: new Frac(r[ci], n) },
      solution: [`Total parts: $${r.join(' + ')} = ${n}$.`, `${cap(cols[ci])} is ${r[ci]} of these ${n} parts, so the fraction is $\\frac{${r[ci]}}{${n}}$${gcd(r[ci], n) > 1 ? `, which simplifies to $${ftex(r[ci], n)}$` : ''}.`, `Answer: $${ftex(...ans)}$`],
    };
  }
  let [a, b] = coprimePair(rng, size(d, 7, 9, 11), 2);
  if (mode === 'of-other') {
    if (a > b) [a, b] = [b, a];
    return {
      prompt: `The ratio of ${groupName(x, things)} to ${groupName(y, things)} ${where} is $${a} : ${b}$. The number of ${groupName(x, things)} is what fraction of the number of ${groupName(y, things)}?`,
      answer: fopt(a, b),
      distractors: fvals([a, b], [[a, a + b], [b, a], [b, a + b], [a, b + 1], [a + 1, b]]),
      typed: { kind: 'number', value: new Frac(a, b) },
      solution: [`Compare ${x} with ${y} (not with the total): for every ${a} ${x} there are ${b} ${y}.`, `So ${x} $= \\frac{${a}}{${b}}$ of ${y}. (The fraction of <i>all</i> the ${things} would be $\\frac{${a}}{${a + b}}$.)`, `Answer: $${ftex(a, b)}$`],
    };
  }
  const which = int(rng, 0, 1);
  const ans = [[a, b][which], a + b];
  return {
    prompt: isGroup(x)
      ? `The ${things} ${where} are ${x} or ${y} in the ratio ${x} : ${y} $= ${a} : ${b}$. What fraction of the ${things} are ${[x, y][which]}?`
      : `The ${things} ${where} are ${x} or ${y} in the ratio ${x} : ${y} $= ${a} : ${b}$. What fraction of the ${things} are ${[x, y][which]}?`,
    answer: fopt(...ans),
    distractors: fvals(ans, [[a, b], [b, a], [[b, a][which], a + b], [ans[0], ans[1] + 1], [ans[0] + 1, ans[1]]], { proper: true }),
    typed: { kind: 'number', value: new Frac(...ans) },
    solution: [`Total parts: $${a} + ${b} = ${a + b}$.`, `${cap([x, y][which])} is ${ans[0]} of the ${a + b} parts, so the fraction is $\\frac{${ans[0]}}{${a + b}}$ (not $\\frac{${a}}{${b}}$, which compares the two groups).`, `Answer: $${ftex(...ans)}$`],
  };
}, { title: 'Ratio to fraction' });

export const fractionToRatio = gen('rat-fraction-to-ratio', 'rat-ratio-fractions', (rng, d) => {
  const [x, y, things, where] = pick(rng, PAIR_ITEMS);
  if (d === 'hard') {
    // 3/8 are x; the rest are split p : q between two other kinds.
    for (let i = 0; i < 100; i += 1) {
      const den = pick(rng, [5, 7, 8, 9, 10, 12]);
      const num1 = int(rng, 1, den - 2);
      if (gcd(num1, den) !== 1) continue;
      const [p, q] = coprimePair(rng, 5);
      const rest = den - num1;
      // scale so that rest splits in p:q
      const s = (p + q) / gcd(rest, p + q);
      const parts = simplify([num1 * s, rest * s * p / (p + q), rest * s * q / (p + q)]);
      if (!parts.every(Number.isInteger)) continue;
      const cols = pick(rng, [['red', 'blue', 'green'], ['gold', 'silver', 'bronze'], ['pink', 'white', 'black'], ['yellow', 'purple', 'orange']]);
      return {
        prompt: `A box contains ${cols[0]}, ${cols[1]} and ${cols[2]} beads. $\\frac{${num1}}{${den}}$ of the beads are ${cols[0]}. The rest are ${cols[1]} and ${cols[2]} in the ratio $${p} : ${q}$. Work out the ratio ${cols[0]} : ${cols[1]} : ${cols[2]} in its simplest form.`,
        answer: ratio(parts),
        distractors: rvals(parts, [[num1, p, q], [num1, rest, den], simplify([num1, rest * p, rest * q]).map((v, j) => (j === 0 ? v + 1 : v)), [num1 * (p + q), p * den, q * den].map((v) => v), simplify([num1, den - num1 - 1, 1]), [parts[0], parts[2], parts[1]]]),
        typed: ratioTyped(parts),
        solution: [
          `The rest is $1 - \\frac{${num1}}{${den}} = \\frac{${rest}}{${den}}$ of the beads.`,
          `Split $\\frac{${rest}}{${den}}$ in the ratio $${p} : ${q}$: ${cols[1]} $= \\frac{${p}}{${p + q}} \\times \\frac{${rest}}{${den}}$, ${cols[2]} $= \\frac{${q}}{${p + q}} \\times \\frac{${rest}}{${den}}$.`,
          `Write all three over a common denominator and compare numerators: $${ratioTex([num1 * (p + q), rest * p, rest * q])}$${[num1 * (p + q), rest * p, rest * q].join() !== parts.join() ? `, which simplifies to $${ratioTex(parts)}$` : ''}.`,
          `Answer: ${ratio(parts)}`,
        ],
      };
    }
    throw new Error('hard frac');
  }
  let n; let den;
  do { den = int(rng, 3, size(d, 8, 12, 12)); n = int(rng, 1, den - 1); } while (gcd(n, den) !== 1);
  const ans = [n, den - n];
  const flip = chance(rng, 0.3);
  const asked = flip ? [den - n, n] : ans;
  return {
    prompt: `$\\frac{${n}}{${den}}$ of the ${things} ${where} are ${x}. The rest are ${y}. Write down the ratio ${flip ? `${y} : ${x}` : `${x} : ${y}`}.`,
    answer: ratio(asked),
    distractors: rvals(asked, [flip ? [den, n] : [n, den], [...asked].reverse(), flip ? [den - n, den] : [den, n], [n, den + n], [asked[0] + 1, asked[1]], [asked[0], asked[1] + 1]]),
    typed: ratioTyped(asked),
    solution: [
      `If $\\frac{${n}}{${den}}$ are ${x}, then $\\frac{${den - n}}{${den}}$ are ${y}.`,
      `Think of ${den} equal parts: ${n} part${n === 1 ? '' : 's'} ${x} and ${den - n} part${den - n === 1 ? '' : 's'} ${y}.`,
      `So ${flip ? `${y} : ${x}` : `${x} : ${y}`} $= ${ratioTex(asked)}$ (not $${ratioTex([n, den])}$ – the ${den} is the total).`,
      `Answer: ${ratio(asked)}`,
    ],
  };
}, { title: 'Fraction to ratio' });

export const ratioPercent = gen('rat-ratio-percent', 'rat-ratio-fractions', (rng, d) => {
  const type = size(d, pick(rng, ['pct-of-ratio', 'pct-of-ratio', 'more-than']), pick(rng, ['more-than', 'pct-of-ratio', 'find-n', 'rest-equal']), pick(rng, ['find-n', 'rest-equal', 'more-than']));
  if (type === 'pct-of-ratio') {
    const opts = [[1, 4], [3, 2], [2, 3], [1, 3], [3, 7], [1, 9], [7, 13], [9, 11], [2, 23], [1, 19], [3, 1], [4, 1], [1, 1], [11, 9], [7, 3], [17, 3]];
    let a; let b;
    do { [a, b] = pick(rng, opts); } while (!hasDp(100 * a / (a + b), 1) || (a === b));
    const [x, y, things, where] = pick(rng, PAIR_ITEMS);
    const which = int(rng, 0, 1);
    const ans = 100 * [a, b][which] / (a + b);
    return {
      prompt: `The ratio of ${groupName(x, things)} to ${groupName(y, things)} ${where} is $${a} : ${b}$. What percentage of the ${things} are ${[x, y][which]}?`,
      answer: pct(ans),
      distractors: dvals(ans, [100 * [a, b][which] / [b, a][which], 100 - ans, [a, b][which] * 10, [a, b][which], 100 * [a, b][which] / (a + b + 1)], pct, { dp: 1, round: true }),
      typed: { kind: 'number', value: ans },
      solution: [`Total parts: $${a} + ${b} = ${a + b}$, so ${[x, y][which]} is $\\frac{${[a, b][which]}}{${a + b}}$ of them.`, `$\\frac{${[a, b][which]}}{${a + b}} \\times 100 = ${tnum(ans)}\\%$`, `Answer: ${pct(ans)}`],
    };
  }
  if (type === 'more-than') {
    const p = pick(rng, [10, 20, 25, 50, 30, 40, 5, 60, 75]);
    const more = chance(rng, 0.7);
    const big = simplify([100 + (more ? p : -p), 100]);
    const ans = big;
    const ex = pick(rng, [['a', 'b'], ['x', 'y'], ['p', 'q']]);
    const swap = chance(rng, 0.4);
    const ansR = swap ? [ans[1], ans[0]] : ans;
    return {
      prompt: `$${ex[0]}$ is ${p}% ${more ? 'more' : 'less'} than $${ex[1]}$. Write the ratio $${swap ? `${ex[1]} : ${ex[0]}` : `${ex[0]} : ${ex[1]}`}$ in its simplest form.`,
      answer: ratio(ansR),
      distractors: rvals(ansR, [[...ansR].reverse(), simplify(swap ? [100, p] : [p, 100]), simplify(swap ? [p, 100] : [100, p]), simplify(swap ? [100, 100 - (more ? p : -p)] : [100 - (more ? p : -p), 100]), simplify(swap ? [100 + p, 100] : [100, 100 + p]), [ansR[0] + 1, ansR[1]]]),
      typed: ratioTyped(ansR),
      solution: [
        `Let $${ex[1]} = 100$. Then $${ex[0]} = 100 ${more ? '+' : '-'} ${p} = ${100 + (more ? p : -p)}$.`,
        `$${swap ? `${ex[1]} : ${ex[0]}` : `${ex[0]} : ${ex[1]}`} = ${swap ? `100 : ${100 + (more ? p : -p)}` : `${100 + (more ? p : -p)} : 100`}$, which simplifies to $${ratioTex(ansR)}$.`,
        `Answer: ${ratio(ansR)}`,
      ],
    };
  }
  if (type === 'find-n') {
    for (let i = 0; i < 100; i += 1) {
      const a = int(rng, 2, 12);
      const p = pick(rng, [5, 10, 15, 20, 25, 30, 35, 40, 45, 60, 12.5, 37.5]);
      const tot = a * 100 / p;
      if (!Number.isInteger(tot) || tot <= a) continue;
      const n = tot - a;
      if (n === a) continue;
      const [A, B] = names(rng, 2);
      return {
        prompt: `${A} and ${B} share some money in the ratio $${a} : n$. ${A} gets ${num(p)}% of the money. Work out the value of $n$.`,
        answer: `$${n}$`,
        distractors: dvals(n, [tot, 100 - p, (100 - p) / 10, a * (100 - p) / 100, n + a, p - a, n - 1], (v) => `$${tnum(v)}$`, { dp: 1 }),
        typed: { kind: 'number', value: n },
        solution: [
          `${A}'s ${a} parts are ${num(p)}% of the total, so the total is $${a} \\div ${tnum(p / 100)} = ${tot}$ parts.`,
          `$n = ${tot} - ${a} = ${n}$`,
          `Check: $\\frac{${a}}{${tot}} = ${num(p)}\\%$ ✓`,
          `Answer: $n = ${n}$`,
        ],
      };
    }
    throw new Error('find n');
  }
  // rest-equal: 68% from Spain, France = Germany. Spain : France
  for (let i = 0; i < 100; i += 1) {
    const p = int(rng, 10, 45) * 2;
    const other = (100 - p) / 2;
    const ans = simplify([p, other]);
    if (ans[0] > 30 || ans[1] > 30) continue;
    const set = pick(rng, [['Spain', 'France', 'Germany', 'people at a conference'], ['Wales', 'Scotland', 'Ireland', 'runners in a race'], ['rock', 'pop', 'jazz', 'albums in a collection'], ['bus', 'car', 'bike', 'ways students travel to school']]);
    const subject = set[3].startsWith('ways') ? `Students travel to school by ${set[0]}, ${set[1]} or ${set[2]}. ${p}% travel by ${set[0]} and the same number travel by ${set[1]} as by ${set[2]}.` : `The ${set[3]} are from ${set[0]}, ${set[1]} or ${set[2]}. ${p}% are from ${set[0]} and the number from ${set[1]} equals the number from ${set[2]}.`;
    const subj2 = set[3].startsWith('albums') ? `The ${set[3]} are ${set[0]}, ${set[1]} or ${set[2]}. ${p}% are ${set[0]} and there are equal numbers of ${set[1]} and ${set[2]} albums.` : subject;
    return {
      prompt: `${subj2} Work out the ratio ${set[0]} : ${set[1]} in its simplest form.`,
      answer: ratio(ans),
      distractors: rvals(ans, [simplify([p, 100 - p]), simplify([p, 100]), [...ans].reverse(), simplify([p, other * 2]), simplify([p, (100 - p) / 3 > 0 && Number.isInteger((100 - p) / 3) ? (100 - p) / 3 : other + 1]), [ans[0] + 1, ans[1]]]),
      typed: ratioTyped(ans),
      solution: [`The other two share $100 - ${p} = ${100 - p}\\%$ equally, so each is $${other}\\%$.`, `${set[0]} : ${set[1]} $= ${p} : ${other}$`, `Simplify: $${ratioTex(ans)}$`, `Answer: ${ratio(ans)}`],
    };
  }
  throw new Error('rest');
}, { title: 'Ratios and percentages' });

// [x, y, intro (before the ratio), all (for the question), act, who]
const CLUB_CTX = [
  ['boys', 'girls', 'In a youth club', 'the members', 'play tennis', 'who'],
  ['adults', 'children', 'At a swimming pool', 'the people at the pool', 'are wearing goggles', 'who'],
  ['men', 'women', 'In a community choir', 'the singers', 'can read music', 'who'],
  ['cats', 'dogs', 'At a vet’s surgery one day', 'the animals', 'are microchipped', 'that'],
  ['Year 10s', 'Year 11s', 'On a school trip', 'the students on the trip', 'bring a packed lunch', 'who'],
  ['red apples', 'green apples', 'In a crate of apples', 'the apples', 'are bruised', 'that'],
];

export const ratioFractionWord = gen('rat-ratio-fraction-of-parts', 'rat-ratio-fractions', (rng, d) => {
  for (let i = 0; i < 200; i += 1) {
    const [a, b] = coprimePair(rng, size(d, 5, 7, 9));
    const [x, y, intro, all, act, who] = pick(rng, CLUB_CTX);
    const fx = pick(rng, [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5]]);
    const fy = pick(rng, [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5]]);
    if (fx[0] === fy[0] && fx[1] === fy[1]) continue;
    // Use a total of a*b*... parts: fraction = (a*fx + b*fy)/(a+b)
    const top = new Frac(a * fx[0], fx[1]).add(new Frac(b * fy[0], fy[1]));
    const ans = top.div(a + b);
    if (ans.d > 60) continue;
    const ansP = [ans.n, ans.d];
    const naive = new Frac(fx[0], fx[1]).add(new Frac(fy[0], fy[1])).div(2);
    return {
      prompt: `${intro}, the ratio ${x} : ${y} is $${a} : ${b}$. $\\frac{${fx[0]}}{${fx[1]}}$ of the ${x} and $\\frac{${fy[0]}}{${fy[1]}}$ of the ${y} ${act}. What fraction of ${all} ${act}?`,
      answer: fopt(...ansP),
      distractors: fvals(ansP, [[naive.n, naive.d], [fx[0] + fy[0], fx[1] + fy[1]], [new Frac(fx[0], fx[1]).add(new Frac(fy[0], fy[1])).n, new Frac(fx[0], fx[1]).add(new Frac(fy[0], fy[1])).d], [top.n, top.d * (a + b) + 1], [top.n + top.d, top.d * (a + b)], [a * fx[0] + b * fy[0], a + b]], { proper: true }),
      typed: { kind: 'number', value: ans },
      solution: (() => {
        // Work with a convenient whole number: m of each "part", so every fraction gives a whole number.
        const m = lcm(fx[1], fy[1]);
        const X = a * m; const Y = b * m; const ax = X * fx[0] / fx[1]; const ay = Y * fy[0] / fy[1];
        return [
          `Pick a convenient number: imagine ${X} ${x} and ${Y} ${y} (this is in the ratio $${a} : ${b}$, and works with both fractions).`,
          `${cap(x)} ${who} ${act}: $\\frac{${fx[0]}}{${fx[1]}} \\times ${X} = ${ax}$. ${cap(y)} ${who} ${act}: $\\frac{${fy[0]}}{${fy[1]}} \\times ${Y} = ${ay}$.`,
          `That is ${ax + ay} out of ${X + Y}, so the fraction is $\\frac{${ax + ay}}{${X + Y}}${ans.d !== X + Y ? ` = ${ans.tex()}` : ''}$. (You can't just add or average the two fractions.)`,
          `Answer: $${ans.tex()}$`,
        ];
      })(),
    };
  }
  throw new Error('club');
}, { title: 'Fractions of the parts of a ratio' });

/* ================================================================== */
/* rat-combine                                                         */
/* ================================================================== */

function combineParams(rng, d) {
  for (let i = 0; i < 200; i += 1) {
    const [p, q] = coprimePair(rng, size(d, 5, 7, 9));
    const [r, s] = coprimePair(rng, size(d, 5, 7, 9));
    const L = lcm(q, r);
    const abc = simplify([p * L / q, L, s * L / r]);
    if (q === r) continue;
    if (d === 'easy' && !(r % q === 0 || q % r === 0)) continue;
    if (d === 'hard' && (r % q === 0 || q % r === 0)) continue;
    if (Math.max(...abc) > 60) continue;
    return { p, q, r, s, L, abc };
  }
  throw new Error('combine');
}

export const combineABC = gen('rat-combine-abc', 'rat-combine', (rng, d) => {
  const { p, q, r, s, L, abc } = combineParams(rng, d);
  const letters = pick(rng, [['a', 'b', 'c'], ['x', 'y', 'z'], ['p', 'q', 'r']]);
  const [A, B, C] = letters;
  return {
    prompt: `$${A} : ${B} = ${p} : ${q}$ and $${B} : ${C} = ${r} : ${s}$. Write $${A} : ${B} : ${C}$ in its simplest form.`,
    answer: ratio(abc),
    distractors: rvals(abc, [[p, q, s], [p, r, s], [p, q + r, s], [p * r, q * r, s], [p, q * r, s * q], [p * s, q * r, r * s], [p * r, q * s, s * q], [abc[0] + 1, abc[1], abc[2]]]),
    typed: ratioTyped(abc),
    solution: [
      `$${B}$ appears in both ratios, so make its parts the same. The LCM of ${q} and ${r} is ${L}.`,
      `$${A} : ${B} = ${p} : ${q} = ${p * L / q} : ${L}$ (×${L / q}) and $${B} : ${C} = ${r} : ${s} = ${L} : ${s * L / r}$ (×${L / r}).`,
      `So $${A} : ${B} : ${C} = ${p * L / q} : ${L} : ${s * L / r}$${simplify([p * L / q, L, s * L / r]).join() !== [p * L / q, L, s * L / r].join() ? `, which simplifies to $${ratioTex(abc)}$` : ''}.`,
      `Answer: ${ratio(abc)}`,
    ],
  };
}, { title: 'Combine two ratios into a : b : c' });

export const combineAC = gen('rat-combine-fraction', 'rat-combine', (rng, d) => {
  const { p, q, r, s, L, abc } = combineParams(rng, d === 'easy' ? 'medium' : d);
  const set = pick(rng, [
    { n: ['D', 'E', 'F'], s: (x) => `A road has three sections, D, E and F. The lengths are in the ratios D : E $= ${p} : ${q}$ and E : F $= ${r} : ${s}$.`, q: (k) => `What fraction of the length of the road is section ${k}?` },
    { n: ['red', 'blue', 'green'], s: () => `A bag holds red, blue and green counters. red : blue $= ${p} : ${q}$ and blue : green $= ${r} : ${s}$.`, q: (k) => `What fraction of the counters are ${k}?` },
    { n: ['Ali', 'Bev', 'Cal'], s: () => `Ali, Bev and Cal share some money. Ali : Bev $= ${p} : ${q}$ and Bev : Cal $= ${r} : ${s}$.`, q: (k) => `What fraction of the money does ${k} get?` },
    { n: ['lions', 'tigers', 'bears'], s: () => `In a wildlife park, lions : tigers $= ${p} : ${q}$ and tigers : bears $= ${r} : ${s}$. There are no other animals in that section.`, q: (k) => `What fraction of the animals in that section are ${k}?` },
  ]);
  const mode = d === 'easy' ? 'ac' : pick(rng, ['frac', 'frac', 'ac']);
  if (mode === 'ac') {
    const ac = simplify([abc[0], abc[2]]);
    return {
      prompt: `$a : b = ${p} : ${q}$ and $b : c = ${r} : ${s}$. Find the ratio $a : c$ in its simplest form.`,
      answer: ratio(ac),
      distractors: rvals(ac, [[p, s], [s, p], simplify([p * r, q * s]), [ac[1], ac[0]], simplify([p * q, r * s]), [ac[0] + 1, ac[1]], simplify([abc[0], abc[1]]), simplify([abc[1], abc[2]]), simplify([p + r, q + s]), [ac[0], ac[1] + 1]]),
      typed: ratioTyped(ac),
      solution: [`Match the $b$ parts using the LCM of ${q} and ${r}, which is ${L}.`, `$a : b : c = ${p * L / q} : ${L} : ${s * L / r}$`, `So $a : c = ${p * L / q} : ${s * L / r}${ac[0] !== p * L / q ? ` = ${ratioTex(ac)}` : ''}$.`, `Answer: ${ratio(ac)}`],
    };
  }
  const k = int(rng, 0, 2);
  const tot = abc[0] + abc[1] + abc[2];
  const ans = [abc[k], tot];
  return {
    prompt: `${set.s()} ${set.q(set.n[k])}`,
    answer: fopt(...ans),
    distractors: fvals(ans, [[[p, q, s][k], p + q + s], [[p, q + r, s][k], p + q + r + s], [abc[k], tot - abc[k]], [[p, q, s][k], p + q], [abc[k], tot + 1], [abc[(k + 1) % 3], tot]], { proper: true }),
    typed: { kind: 'number', value: new Frac(...ans) },
    solution: [
      `Make the shared part equal: LCM of ${q} and ${r} is ${L}.`,
      `${set.n.join(' : ')} $= ${p * L / q} : ${L} : ${s * L / r}$${abc[1] !== L ? ` $= ${ratioTex(abc)}$` : ''}`,
      `Total parts $= ${tot}$, so the fraction is $\\frac{${abc[k]}}{${tot}}${gcd(abc[k], tot) > 1 ? ` = ${ftex(abc[k], tot)}` : ''}$.`,
      `Answer: $${ftex(...ans)}$`,
    ],
  };
}, { title: 'Combine ratios to find a : c or a fraction of the whole' });

const COMBINE_WORD = [
  { n: ['lions', 'tigers', 'bears'], t: (r1, r2, kv, ki, ask) => `In a wildlife park, the ratio of lions to tigers is $${ratioTex(r1)}$ and the ratio of tigers to bears is $${ratioTex(r2)}$. There are ${kv} ${['lions', 'tigers', 'bears'][ki]}. How many ${ask}?` },
  { n: ['Amy', 'Ben', 'Cara'], money: true, t: (r1, r2, kv, ki, ask) => `Amy, Ben and Cara share some money. Amy : Ben $= ${ratioTex(r1)}$ and Ben : Cara $= ${ratioTex(r2)}$. ${['Amy', 'Ben', 'Cara'][ki]} gets ${kv}. How much ${ask}?` },
  { n: ['oak trees', 'ash trees', 'birch trees'], t: (r1, r2, kv, ki, ask) => `In a wood, oak : ash $= ${ratioTex(r1)}$ and ash : birch $= ${ratioTex(r2)}$. There are ${kv} ${['oak', 'ash', 'birch'][ki]} trees. How many ${ask}?` },
  { n: ['red beads', 'blue beads', 'yellow beads'], t: (r1, r2, kv, ki, ask) => `A bag holds red, blue and yellow beads. red : blue $= ${ratioTex(r1)}$ and blue : yellow $= ${ratioTex(r2)}$. There are ${kv} ${['red', 'blue', 'yellow'][ki]} beads. How many ${ask}?` },
  { n: ['pop records', 'rock records', 'jazz records'], t: (r1, r2, kv, ki, ask) => `A music shop sells pop, rock and jazz records. pop : rock $= ${ratioTex(r1)}$ and rock : jazz $= ${ratioTex(r2)}$. Last month it sold ${kv} ${['pop', 'rock', 'jazz'][ki]} records. How many ${ask}?` },
  { n: ['sheep', 'goats', 'pigs'], t: (r1, r2, kv, ki, ask) => `On a farm, sheep : goats $= ${ratioTex(r1)}$ and goats : pigs $= ${ratioTex(r2)}$. There are ${kv} ${['sheep', 'goats', 'pigs'][ki]}. How many ${ask}?` },
  { n: ['Year 7 students', 'Year 8 students', 'Year 9 students'], t: (r1, r2, kv, ki, ask) => `At a school club, Year 7 : Year 8 $= ${ratioTex(r1)}$ and Year 8 : Year 9 $= ${ratioTex(r2)}$. There are ${kv} ${['Year 7', 'Year 8', 'Year 9'][ki]} students. How many ${ask}?` },
  { n: ['cement', 'sand', 'gravel'], unit: 'kg', t: (r1, r2, kv, ki, ask) => `For concrete, cement : sand $= ${ratioTex(r1)}$ and sand : gravel $= ${ratioTex(r2)}$. A builder uses ${kv} of ${['cement', 'sand', 'gravel'][ki]}. How much ${ask}?` },
  { n: ['cars', 'vans', 'lorries'], t: (r1, r2, kv, ki, ask) => `On a motorway survey, cars : vans $= ${ratioTex(r1)}$ and vans : lorries $= ${ratioTex(r2)}$. There were ${kv} ${['cars', 'vans', 'lorries'][ki]}. How many ${ask}?` },
  { n: ['gold medals', 'silver medals', 'bronze medals'], t: (r1, r2, kv, ki, ask) => `A country’s medals were gold : silver $= ${ratioTex(r1)}$ and silver : bronze $= ${ratioTex(r2)}$. It won ${kv} ${['gold', 'silver', 'bronze'][ki]} medals. How many ${ask}?` },
  { n: ['blue paint', 'green paint', 'white paint'], unit: 'litres', t: (r1, r2, kv, ki, ask) => `A paint mix uses blue : green $= ${ratioTex(r1)}$ and green : white $= ${ratioTex(r2)}$. A painter uses ${kv} of ${['blue', 'green', 'white'][ki]} paint. How much ${ask}?` },
  { n: ['adults', 'teenagers', 'children'], t: (r1, r2, kv, ki, ask) => `At a festival, adults : teenagers $= ${ratioTex(r1)}$ and teenagers : children $= ${ratioTex(r2)}$. There were ${kv} ${['adults', 'teenagers', 'children'][ki]}. How many ${ask}?` },
];

export const combineWord = gen('rat-combine-word', 'rat-combine', (rng, d) => {
  const { p, q, r, s, abc } = combineParams(rng, d);
  const tpl = pick(rng, COMBINE_WORD);
  const ki = int(rng, 0, 2);
  let ai; do { ai = int(rng, 0, 2); } while (ai === ki);
  const askTotal = d !== 'easy' && chance(rng, 0.3);
  const k = int(rng, 2, size(d, 4, 6, 8));
  const unitMul = tpl.money ? 100 : 1;
  const vals = abc.map((x) => x * k * unitMul);
  const fmt = tpl.money ? gbp : tpl.unit ? withUnit(tpl.unit) : (v) => num(v);
  const total = vals[0] + vals[1] + vals[2];
  const ans = askTotal ? total : vals[ai];
  const what = askTotal ? (tpl.money ? 'do they share altogether' : tpl.unit ? 'is used altogether' : 'are there altogether') : tpl.money ? `does ${tpl.n[ai]} get` : tpl.unit ? `${tpl.n[ai]} is needed` : `${tpl.n[ai]} are there`;
  const naive = [p, q, s];
  const naiveVals = [vals[ki] / naive[ki] * naive[ai], vals[ki] / [p, r, s][ki] * [p, r, s][ai]];
  return {
    prompt: tpl.t([p, q], [r, s], fmt(vals[ki]), ki, what).replace(/How many (do they share|is used|are there) altogether\?/, (m) => m.replace('How many ', tpl.money ? 'How much ' : tpl.unit ? 'How much ' : 'How many ').replace('How much are there', 'How many are there')).replace('How many is used', 'How much is used').replace(/How many (\S+) (is needed)/, 'How much $1 $2'),
    answer: fmt(ans),
    distractors: dvals(ans, askTotal ? [vals[ki] / naive[ki] * (p + q + s), vals[ki] / [p, r, s][ki] * (p + r + s), total - vals[ki], total + vals[ki], vals[ai]] : [...naiveVals, vals[3 - ki - ai], vals[ki] * abc[ai], ans + vals[ki] / abc[ki]], fmt, { dp: tpl.money ? 2 : 1, round: true }).filter((t) => t !== fmt(ans)),
    typed: { kind: 'number', value: ans / unitMul },
    solution: [
      `Combine the ratios by making the middle part the same (LCM of ${q} and ${r}).`,
      `${tpl.n.join(' : ')} $= ${ratioTex(abc)}$`,
      `${cap(tpl.n[ki])} is ${abc[ki]} parts $=$ ${fmt(vals[ki])}, so one part $=$ ${fmt(vals[ki] / abc[ki])}.`,
      askTotal ? `Total $= ${abc[0] + abc[1] + abc[2]}$ parts $=$ ${fmt(total)}.` : `${cap(tpl.n[ai])} $= ${abc[ai]}$ parts $=$ ${fmt(vals[ai])}.`,
      `Answer: ${fmt(ans)}`,
    ],
  };
}, { title: 'Combine ratios in context and find an amount', word: true });

/* ================================================================== */
/* rat-ratio-change                                                    */
/* ================================================================== */

const CHANGE_CTX = [
  { g: ['red counters', 'blue counters'], place: 'in a bag', verbs: ['are added to', 'are taken out of'], obj: 'the bag' },
  { g: ['women', 'men'], place: 'at a party', verbs: ['arrive at', 'leave'], obj: 'the party' },
  { g: ['cars', 'vans'], place: 'in a car park', verbs: ['drive into', 'drive out of'], obj: 'the car park' },
  { g: ['fiction books', 'non-fiction books'], place: 'on a shelf', verbs: ['are put on', 'are taken off'], obj: 'the shelf' },
  { g: ['sopranos', 'altos'], place: 'in a choir', verbs: ['join', 'leave'], obj: 'the choir' },
  { g: ['goldfish', 'guppies'], place: 'in a fish tank', verbs: ['are put into', 'are taken out of'], obj: 'the tank' },
  { g: ['sheep', 'goats'], place: 'in a field', verbs: ['are moved into', 'are moved out of'], obj: 'the field' },
  { g: ['red roses', 'white roses'], place: 'in a florist’s bucket', verbs: ['are added to', 'are sold from'], obj: 'the bucket' },
  { g: ['£1 coins', '£2 coins'], place: 'in a money box', verbs: ['are put into', 'are taken out of'], obj: 'the money box' },
  { g: ['boys', 'girls'], place: 'in an after-school club', verbs: ['join', 'leave'], obj: 'the club' },
  { g: ['strawberry yoghurts', 'peach yoghurts'], place: 'in a fridge', verbs: ['are put into', 'are eaten from'], obj: 'the fridge' },
  { g: ['ducks', 'geese'], place: 'on a pond', verbs: ['land on', 'fly off'], obj: 'the pond' },
  { g: ['adults', 'children'], place: 'on a bus', verbs: ['get on', 'get off'], obj: 'the bus' },
];

export const changeAdd = gen('rat-change-add', 'rat-ratio-change', (rng, d) => {
  for (let i = 0; i < 300; i += 1) {
    const tpl = pick(rng, CHANGE_CTX);
    const [a, b] = coprimePair(rng, size(d, 5, 7, 9));
    const x = int(rng, 2, size(d, 8, 10, 12));
    // changes to each group (positive = added)
    let d1 = 0; let d2 = 0;
    const mode = size(d, 'one', pick(rng, ['one', 'one', 'both']), pick(rng, ['both', 'one']));
    if (mode === 'one') { if (chance(rng, 0.5)) d1 = int(rng, 2, 12) * sign1(rng); else d2 = int(rng, 2, 12) * sign1(rng); } else { d1 = int(rng, 2, 10) * sign1(rng); d2 = int(rng, 2, 10) * sign1(rng); }
    const n1 = a * x + d1; const n2 = b * x + d2;
    if (n1 <= 0 || n2 <= 0) continue;
    const nr = simplify([n1, n2]);
    if (Math.max(...nr) > 15 || (nr[0] === a && nr[1] === b)) continue;
    if (d === 'easy' && d2 !== 0 && d1 !== 0) continue;
    const ask = pick(rng, ['orig1', 'orig2', 'origTotal', 'newTotal']);
    const ans = { orig1: a * x, orig2: b * x, origTotal: (a + b) * x, newTotal: n1 + n2 }[ask];
    const change = (dv, gname) => (dv > 0 ? `${dv} ${gname} ${tpl.verbs[0]} ${tpl.obj}` : `${-dv} ${gname} ${tpl.verbs[1]} ${tpl.obj}`);
    const changes = [d1 ? change(d1, tpl.g[0]) : null, d2 ? change(d2, tpl.g[1]) : null].filter(Boolean).join(' and ');
    const question = { orig1: `How many ${tpl.g[0]} were there at the start?`, orig2: `How many ${tpl.g[1]} were there at the start?`, origTotal: `How many ${tpl.g[0]} and ${tpl.g[1]} were there altogether at the start?`, newTotal: `How many ${tpl.g[0]} and ${tpl.g[1]} are there now altogether?` }[ask];
    const qa = nr[1] * a - nr[0] * b;
    const vals = [x, a * x + b * x, n1, n2, a * x, b * x, n1 + n2, ans + a + b, (a + b) * (x + 1)];
    return {
      prompt: `The ratio of ${tpl.g[0]} to ${tpl.g[1]} ${tpl.place} is $${a} : ${b}$. Then ${changes}. The ratio is now $${ratioTex(nr)}$. ${question}`,
      answer: num(ans),
      distractors: dvals(ans, vals, (v) => num(v), { dp: 0 }),
      typed: { kind: 'number', value: ans },
      solution: [
        `Let the numbers at the start be $${lin(a, 0)}$ ${tpl.g[0]} and $${lin(b, 0)}$ ${tpl.g[1]}.`,
        `After the change: $\\frac{${lin(a, d1)}}{${lin(b, d2)}} = \\frac{${nr[0]}}{${nr[1]}}$`,
        `Cross-multiply: $${fac(nr[1], lin(a, d1))} = ${fac(nr[0], lin(b, d2))}$, so ${solveLine(qa, qa * x, x)}.`,
        { orig1: `At the start there were $${a} \\times ${x} = ${a * x}$ ${tpl.g[0]}.`, orig2: `At the start there were $${b} \\times ${x} = ${b * x}$ ${tpl.g[1]}.`, origTotal: `At the start there were $${a * x} + ${b * x} = ${(a + b) * x}$.`, newTotal: `Now there are $${n1} + ${n2} = ${n1 + n2}$.` }[ask],
        `Answer: ${num(ans)}`,
      ],
    };
  }
  throw new Error('change');
}, { title: 'Ratio changes when some are added or removed', word: true });
function sign1(rng) { return rng() < 0.6 ? 1 : -1; }

const TRANSFER_CTX = [
  { kind: 'money', t: (A, B, T, r, nr) => `${A} and ${B} shared ${gbp(T)} in the ratio $${ratioTex(r)}$. ${A} then gives ${B} some of the money so that ${nr[0] === nr[1] ? 'they have the same amount' : `the ratio ${A} : ${B} becomes $${ratioTex(nr)}$`}. How much does ${A} give ${B}?` },
  { kind: 'count', t: (A, B, T, r, nr) => `${A} and ${B} have ${T} football cards between them in the ratio $${ratioTex(r)}$. ${A} gives some cards to ${B} so that ${nr[0] === nr[1] ? 'they have the same number' : `the ratio becomes $${ratioTex(nr)}$`}. How many cards does ${A} give away?` },
  { kind: 'count', t: (A, B, T, r, nr) => `Two classes have ${T} students altogether in the ratio class X : class Y $= ${ratioTex(r)}$. Some students move from class X to class Y so that ${nr[0] === nr[1] ? 'the classes are the same size' : `the ratio becomes $${ratioTex(nr)}$`}. How many students move?` },
  { kind: 'l', t: (A, B, T, r, nr) => `Two water tanks hold ${num(T)} litres altogether in the ratio tank P : tank Q $= ${ratioTex(r)}$. Water is pumped from P to Q so that ${nr[0] === nr[1] ? 'both tanks hold the same amount' : `the ratio becomes $${ratioTex(nr)}$`}. How many litres are pumped?` },
  { kind: 'count', t: (A, B, T, r, nr) => `A library has ${T} books on two floors in the ratio ground floor : first floor $= ${ratioTex(r)}$. Some books are carried upstairs so that ${nr[0] === nr[1] ? 'both floors have the same number' : `the ratio becomes $${ratioTex(nr)}$`}. How many books are moved?` },
  { kind: 'count', t: (A, B, T, r, nr) => `${A} and ${B} have ${T} marbles altogether in the ratio $${ratioTex(r)}$. ${A} gives ${B} some marbles and now ${nr[0] === nr[1] ? 'they have the same number' : `the ratio is $${ratioTex(nr)}$`}. How many marbles did ${A} give ${B}?` },
  { kind: 'kg', t: (A, B, T, r, nr) => `Two sacks contain ${num(T)} kg of potatoes altogether in the ratio $${ratioTex(r)}$. Some potatoes are moved from the first sack to the second so that ${nr[0] === nr[1] ? 'both sacks weigh the same' : `the ratio becomes $${ratioTex(nr)}$`}. What mass of potatoes is moved?` },
  { kind: 'count', t: (A, B, T, r, nr) => `A hall has ${T} chairs split between two rooms in the ratio $${ratioTex(r)}$. Some chairs are carried from the first room to the second so that ${nr[0] === nr[1] ? 'both rooms have the same number' : `the ratio becomes $${ratioTex(nr)}$`}. How many chairs are moved?` },
  { kind: 'money', t: (A, B, T, r, nr) => `A club keeps ${gbp(T)} in two accounts in the ratio current : savings $= ${ratioTex(r)}$. The treasurer moves some money into savings so that ${nr[0] === nr[1] ? 'both accounts hold the same amount' : `the ratio becomes $${ratioTex(nr)}$`}. How much is moved?` },
  { kind: 'count', t: (A, B, T, r, nr) => `${A} and ${B} picked ${T} strawberries altogether in the ratio $${ratioTex(r)}$. ${A} gives some to ${B} so that ${nr[0] === nr[1] ? 'they have the same number' : `the ratio becomes $${ratioTex(nr)}$`}. How many strawberries does ${A} give?` },
  { kind: 'count', t: (A, B, T, r, nr) => `A farmer has ${T} sheep in two fields in the ratio $${ratioTex(r)}$. He moves some sheep from the first field to the second so that ${nr[0] === nr[1] ? 'there are equal numbers in each' : `the ratio becomes $${ratioTex(nr)}$`}. How many sheep does he move?` },
  { kind: 'g', t: (A, B, T, r, nr) => `${num(T)} g of flour is stored in two jars in the ratio $${ratioTex(r)}$. Some flour is tipped from the first jar into the second so that ${nr[0] === nr[1] ? 'both jars hold the same mass' : `the ratio becomes $${ratioTex(nr)}$`}. How much flour is tipped?` },
];

export const changeTransfer = gen('rat-change-transfer', 'rat-ratio-change', (rng, d) => {
  for (let i = 0; i < 300; i += 1) {
    const tpl = pick(rng, TRANSFER_CTX);
    const [a, b] = coprimePair(rng, 11);
    if (a <= b) continue;
    const nr = d === 'easy' ? [1, 1] : d === 'medium' ? pick(rng, [[1, 1], simplify([a - 1, b + 1]), [b, a]]) : pick(rng, [simplify([a - 1, b + 1]), simplify([a - 2, b + 2]), [b, a], [1, 2], [2, 3]]);
    if (!nr.every((v) => v > 0) || nr.join() === [a, b].join() || nr[0] / nr[1] >= a / b) continue;
    const n1 = a + b; const n2 = nr[0] + nr[1];
    const L = lcm(n1, n2);
    const k = int(rng, tpl.kind === 'count' ? 2 : 1, size(d, 3, 4, 4)) * (tpl.kind === 'money' ? pick(rng, [100, 50, 200]) : ['g', 'l', 'kg'].includes(tpl.kind) ? pick(rng, [1, 5, 10]) : 1);
    const T = L * k;
    if (tpl.kind === 'count' && T > 400) continue;
    const A0 = T * a / n1; const A1 = T * nr[0] / n2;
    const ans = A0 - A1;
    if (ans <= 0) continue;
    const [A, B] = names(rng, 2);
    const fmt = tpl.kind === 'money' ? gbp : tpl.kind === 'count' ? (v) => num(v) : withUnit(tpl.kind === 'l' ? 'litres' : tpl.kind);
    const B0 = T - A0;
    const vals = [A0 - B0, A0 - T / 2, T * (a - b) / n1 / 2 === ans ? null : T * (a - b) / n1 / 2, A1, T / n1, ans * 2];
    return {
      prompt: tpl.t(A, B, T, [a, b], nr),
      answer: fmt(ans),
      distractors: tpl.kind === 'money' ? pvals(ans, vals) : dvals(ans, vals, fmt, { dp: 0 }),
      typed: { kind: 'number', value: tpl.kind === 'money' ? ans / 100 : ans },
      solution: [
        `Before: one part $=$ ${fmt(T)} $\\div ${n1} =$ ${fmt(T / n1)}, so the first share is $${a} \\times$ ${fmt(T / n1)} $=$ ${fmt(A0)}.`,
        `The total doesn't change. After: ${nr[0] === nr[1] ? `each has half, ${fmt(T)} $\\div 2 =$ ${fmt(A1)}` : `one part $=$ ${fmt(T)} $\\div ${n2} =$ ${fmt(T / n2)}, so the first share is $${nr[0]} \\times$ ${fmt(T / n2)} $=$ ${fmt(A1)}`}.`,
        `Amount moved $=$ ${fmt(A0)} $-$ ${fmt(A1)} $=$ ${fmt(ans)}.${nr[0] === nr[1] ? ' (Not the whole difference – moving that much would just swap who has more!)' : ''}`,
        `Answer: ${fmt(ans)}`,
      ],
    };
  }
  throw new Error('transfer');
}, { title: 'Ratio changes when an amount is transferred', word: true });

const WEEKS_CTX = [
  { kind: 'money', unit: 'weeks', t: (A, B, x, y, ia, ib, nr) => `${A} has ${gbp(x)} in savings and ${B} has ${gbp(y)}. Each week ${A} saves ${gbp(ia)} and ${B} saves ${gbp(ib)}. After how many weeks will their savings be in the ratio ${A} : ${B} $= ${ratioTex(nr)}$?` },
  { kind: 'cm', unit: 'weeks', t: (A, B, x, y, ia, ib, nr) => `A sunflower is ${x} cm tall and a tomato plant is ${y} cm tall. Each week the sunflower grows ${ia} cm and the tomato plant grows ${ib} cm. After how many weeks will their heights be in the ratio sunflower : tomato $= ${ratioTex(nr)}$?` },
  { kind: 'years', unit: 'years', ages: true, t: (A, B, x, y, ia, ib, nr) => `${A} is ${x} years old and ${B} is ${y} years old. In how many years' time will the ratio of their ages, ${A} : ${B}, be $${ratioTex(nr)}$?` },
  { kind: 'count', unit: 'months', t: (A, B, x, y, ia, ib, nr) => `${A}'s video channel has ${num(x)} subscribers and ${B}'s has ${num(y)}. Each month ${A} gains ${num(ia)} and ${B} gains ${num(ib)}. After how many months will the numbers be in the ratio ${A} : ${B} $= ${ratioTex(nr)}$?` },
  { kind: 'l', unit: 'minutes', t: (A, B, x, y, ia, ib, nr) => `Tank P holds ${x} litres of water and tank Q holds ${y} litres. Tap P adds ${ia} litres a minute to tank P and tap Q adds ${ib} litres a minute to tank Q. After how many minutes will the volumes be in the ratio P : Q $= ${ratioTex(nr)}$?` },
  { kind: 'count', unit: 'days', t: (A, B, x, y, ia, ib, nr) => `${A} has read ${x} pages of a long book and ${B} has read ${y} pages. From now on ${A} reads ${ia} pages a day and ${B} reads ${ib} pages a day. After how many days will the pages read be in the ratio ${A} : ${B} $= ${ratioTex(nr)}$?` },
  { kind: 'count', unit: 'weeks', t: (A, B, x, y, ia, ib, nr) => `A school has collected ${x} tins for a food bank and a church has collected ${y}. Each week the school collects ${ia} more and the church collects ${ib} more. After how many weeks will the numbers be in the ratio school : church $= ${ratioTex(nr)}$?` },
  { kind: 'km', unit: 'days', t: (A, B, x, y, ia, ib, nr) => `On a charity walk, ${A} has already walked ${x} km and ${B} has walked ${y} km. Each day ${A} walks ${ia} km and ${B} walks ${ib} km. After how many more days will their distances be in the ratio ${A} : ${B} $= ${ratioTex(nr)}$?` },
  { kind: 'count', unit: 'weeks', t: (A, B, x, y, ia, ib, nr) => `${A} has ${x} stickers and ${B} has ${y}. ${A} buys a pack of ${ia} every week and ${B} buys a pack of ${ib} every week. After how many weeks will the ratio of their stickers be $${ratioTex(nr)}$?` },
  { kind: 'money', unit: 'months', t: (A, B, x, y, ia, ib, nr) => `Two charities have raised ${gbp(x)} and ${gbp(y)} so far. Each month the first raises ${gbp(ia)} and the second raises ${gbp(ib)}. After how many months will the amounts be in the ratio $${ratioTex(nr)}$?` },
  { kind: 'count', unit: 'years', t: (A, B, x, y, ia, ib, nr) => `A wood has ${x} oak trees and ${y} beech trees. Each year ${ia} oaks and ${ib} beeches are planted, and none are cut down. After how many years will the ratio oak : beech be $${ratioTex(nr)}$?` },
  { kind: 'count', unit: 'weeks', t: (A, B, x, y, ia, ib, nr) => `${A} has done ${x} press-ups in training so far and ${B} has done ${y}. Each week ${A} does ${ia} and ${B} does ${ib}. After how many weeks will their totals be in the ratio ${A} : ${B} $= ${ratioTex(nr)}$?` },
];

export const changeWeeks = gen('rat-change-over-time', 'rat-ratio-change', (rng, d) => {
  for (let i = 0; i < 400; i += 1) {
    const tpl = pick(rng, WEEKS_CTX);
    const w = int(rng, 2, size(d, 6, 10, 15));
    let x; let y; let ia; let ib;
    if (tpl.ages) { ia = 1; ib = 1; x = int(rng, 25, 50); y = int(rng, 2, 15); } else {
      const m = tpl.kind === 'money' ? (tpl.unit === 'months' ? pick(rng, [5000, 10000, 2500]) : pick(rng, [100, 50, 200])) : 1;
      x = int(rng, 2, 40) * m; y = int(rng, 2, 40) * m; ia = int(rng, 2, 9) * m; ib = int(rng, 2, 9) * m;
      if (tpl.kind === 'count' && tpl.unit === 'months') { x *= 100; y *= 100; ia *= 50; ib *= 50; }
    }
    const X = x + ia * w; const Y = y + ib * w;
    const nr = simplify([X, Y]);
    if (Math.max(...nr) > 20 || nr[0] === nr[1] && d === 'hard') continue;
    // initial ratio must differ, and the ratio must not be reached at another time too
    if (sameNR(x, y, nr)) continue;
    // must be the unique solution: (nr1)(x + ia w) = nr0 (y + ib w) is linear so unique unless coeff 0
    if (nr[1] * ia - nr[0] * ib === 0) continue;
    const [A, B] = names(rng, 2);
    const q = nr[1] * ia - nr[0] * ib; const c = nr[0] * y - nr[1] * x;
    const fmtv = (v) => (tpl.kind === 'money' ? gbp(v) : num(v));
    const sc = (v) => (tpl.kind === 'money' ? tidy(v / 100) : v);
    const ln = (c0, k) => `${tnum(c0)} + ${k === 1 ? '' : tnum(k)}n`;
    const wrong = [w + 1, w - 1, w * 2, Math.round((nr[0] - nr[1]) || 0), nr[0], nr[1], w + 2];
    return {
      prompt: tpl.t(A, B, tpl.kind === 'money' ? x : x, y, ia, ib, nr),
      answer: `${w} ${tpl.unit}`,
      distractors: dvals(w, wrong, (v) => `${v} ${v === 1 ? tpl.unit.replace(/s$/, '') : tpl.unit}`, { dp: 0 }),
      typed: { kind: 'number', value: w },
      solution: [
        `After $n$ ${tpl.unit}: first $= ${ln(sc(x), sc(ia))}$ and second $= ${ln(sc(y), sc(ib))}$${tpl.kind === 'money' ? ' (in £)' : ''}.`,
        `Set up the ratio: $${fac(nr[1], ln(sc(x), sc(ia)))} = ${fac(nr[0], ln(sc(y), sc(ib)))}$`,
        `Expand and collect: ${solveLine(sc(q), sc(c), w, 'n')}.`,
        `Check: ${fmtv(X)} : ${fmtv(Y)} $= ${ratioTex(nr)}$ ✓`,
        `Answer: ${w} ${tpl.unit}`,
      ],
    };
  }
  throw new Error('weeks');
}, { title: 'When will two growing amounts be in a given ratio?', word: true });
function sameNR(x, y, nr) { return x * nr[1] === y * nr[0]; }

const GIVE_CTX = [
  { kind: 'money', t: (A, B, C, r, kv, ki, f) => `${A} and ${B} share some money in the ratio $${ratioTex(r)}$. ${[A, B][ki]} gets ${kv}. ${A} then gives $\\frac{${f[0]}}{${f[1]}}$ ${ki === 0 ? 'of this money' : `of ${A}'s share`} to ${C}.` },
  { kind: 'count', t: (A, B, C, r, kv, ki, f) => `${A} and ${B} share a bag of sweets in the ratio $${ratioTex(r)}$. ${[A, B][ki]} gets ${kv} sweets. ${A} then gives $\\frac{${f[0]}}{${f[1]}}$ ${ki === 0 ? 'of these sweets' : `of ${A}'s sweets`} to ${C}.` },
  { kind: 'count', t: (A, B, C, r, kv, ki, f) => `${A} and ${B} split a collection of stamps in the ratio $${ratioTex(r)}$. ${[A, B][ki]} gets ${kv} stamps. ${A} then gives $\\frac{${f[0]}}{${f[1]}}$ ${ki === 0 ? 'of these stamps' : `of ${A}'s stamps`} to ${C}.` },
  { kind: 'money', t: (A, B, C, r, kv, ki, f) => `${A} and ${B} split their earnings from a car-boot sale in the ratio $${ratioTex(r)}$. ${[A, B][ki]} gets ${kv}. ${A} then gives $\\frac{${f[0]}}{${f[1]}}$ ${ki === 0 ? 'of this money' : `of ${A}'s earnings`} to ${C}.` },
  { kind: 'count', t: (A, B, C, r, kv, ki, f) => `${A} and ${B} picked conkers and shared them in the ratio $${ratioTex(r)}$. ${[A, B][ki]} ended up with ${kv}. ${A} then hands $\\frac{${f[0]}}{${f[1]}}$ ${ki === 0 ? 'of these conkers' : `of ${A}'s conkers`} to a younger cousin, ${C}.` },
  { kind: 'money', t: (A, B, C, r, kv, ki, f) => `A grandad splits some birthday money between ${A} and ${B} in the ratio $${ratioTex(r)}$. ${[A, B][ki]} receives ${kv}. ${A} lends $\\frac{${f[0]}}{${f[1]}}$ ${ki === 0 ? 'of this money' : `of ${A}'s share`} to a friend, ${C}.` },
  { kind: 'count', t: (A, B, C, r, kv, ki, f) => `${A} and ${B} grow tomato seedlings in the ratio $${ratioTex(r)}$. ${[A, B][ki]} grows ${kv} seedlings. ${A} gives $\\frac{${f[0]}}{${f[1]}}$ of ${A}'s seedlings to a neighbour, ${C}.` },
  { kind: 'count', t: (A, B, C, r, kv, ki, f) => `${A} and ${B} baked cookies for a sale in the ratio $${ratioTex(r)}$. ${[A, B][ki]} baked ${kv} cookies. ${A} then gives $\\frac{${f[0]}}{${f[1]}}$ of ${A}'s cookies to ${C} to sell on another stall.` },
  { kind: 'money', t: (A, B, C, r, kv, ki, f) => `${A} and ${B} share a quiz prize in the ratio $${ratioTex(r)}$. ${[A, B][ki]}'s share is ${kv}. ${A} donates $\\frac{${f[0]}}{${f[1]}}$ of ${A}'s share to a charity run by ${C}.` },
  { kind: 'count', t: (A, B, C, r, kv, ki, f) => `${A} and ${B} divide a box of books between them in the ratio $${ratioTex(r)}$. ${[A, B][ki]} gets ${kv} books. ${A} passes $\\frac{${f[0]}}{${f[1]}}$ of ${A}'s books on to ${C}.` },
  { kind: 'count', t: (A, B, C, r, kv, ki, f) => `A pack of trading cards is shared between ${A} and ${B} in the ratio $${ratioTex(r)}$. ${[A, B][ki]} gets ${kv} cards. Later, ${A} gives $\\frac{${f[0]}}{${f[1]}}$ of ${A}'s cards to ${C}.` },
];

export const changeGiveFraction = gen('rat-change-give-fraction', 'rat-ratio-change', (rng, d) => {
  for (let i = 0; i < 200; i += 1) {
    const tpl = pick(rng, GIVE_CTX);
    const [a, b] = coprimePair(rng, 9);
    // easy: unit fractions; medium/hard: non-unit fractions
    const f = pick(rng, d === 'easy' ? [[1, 2], [1, 3], [1, 4], [1, 5]] : [[2, 5], [3, 4], [2, 3], [3, 5], [3, 8]]);
    // A's share must be divisible by f[1]
    const unit = tpl.kind === 'money' ? 100 : 1;
    const part = int(rng, 2, 12) * f[1] * (tpl.kind === 'money' ? pick(rng, [1, 2, 5]) : 1);
    const Av = a * part * unit; const Bv = b * part * unit;
    const give = Av * f[0] / f[1];
    if (!Number.isInteger(give / unit) && tpl.kind !== 'money') continue;
    const ki = int(rng, 0, 1);
    const [A, B, C] = names(rng, 3);
    const fmt = tpl.kind === 'money' ? gbp : (v) => num(v);
    const askRatio = d === 'hard' || (d === 'medium' && chance(rng, 0.4));
    if (askRatio) {
      const nr = simplify([Av - give, Bv, give]);
      if (Math.max(...nr) > 60) continue;
      return {
        prompt: `${tpl.t(A, B, C, [a, b], fmt([Av, Bv][ki]), ki, f)} Work out the ratio ${A} : ${B} : ${C} in its simplest form.`,
        answer: ratio(nr),
        distractors: rvals(nr, [[a, b, f[0]], simplify([Av, Bv, give]), simplify([Av - give, Bv - give, give]), simplify([Av - give, Bv, Av]), simplify([a * f[1] - f[0], b * f[1], f[1]]), [nr[0], nr[1], nr[2] + 1], simplify([Bv, Av - give, give]), [nr[2], nr[1], nr[0]], [nr[0] + 1, nr[1], nr[2]], [nr[0], nr[1] + 1, nr[2]]]),
        typed: ratioTyped(nr),
        solution: [
          `One part $=$ ${fmt([Av, Bv][ki])} $\\div ${[a, b][ki]} =$ ${fmt(part * unit)}, so ${A} gets ${fmt(Av)} and ${B} gets ${fmt(Bv)}.`,
          `${C} gets $\\frac{${f[0]}}{${f[1]}}$ of ${fmt(Av)} $=$ ${fmt(give)}, leaving ${A} with ${fmt(Av - give)}.`,
          `${A} : ${B} : ${C} $= ${ratioTex(tpl.kind === 'money' ? [Av - give, Bv, give].map((v) => v / 100) : [Av - give, Bv, give])}$${(tpl.kind === 'money' ? [Av - give, Bv, give].map((v) => v / 100) : [Av - give, Bv, give]).join() !== nr.join() ? `, which simplifies to $${ratioTex(nr)}$` : ''}.`,
          `Answer: ${ratio(nr)}`,
        ],
      };
    }
    const ans = give;
    return {
      prompt: `${tpl.t(A, B, C, [a, b], fmt([Av, Bv][ki]), ki, f)} How ${tpl.kind === 'money' ? 'much does' : 'many does'} ${C} get?`,
      answer: fmt(ans),
      distractors: tpl.kind === 'money' ? pvals(ans, [Bv * f[0] / f[1], Av, Av - give, ([Av, Bv][ki]) * f[0] / f[1], part * unit, (Av + Bv) * f[0] / f[1]]) : dvals(ans, [Bv * f[0] / f[1], Av, Av - give, ([Av, Bv][ki]) * f[0] / f[1], part, (Av + Bv) * f[0] / f[1]], fmt, { dp: 0 }),
      typed: { kind: 'number', value: ans / unit },
      solution: [
        `One part $=$ ${fmt([Av, Bv][ki])} $\\div ${[a, b][ki]} =$ ${fmt(part * unit)}.`,
        `${A}'s share is ${a} part${a === 1 ? '' : 's'} $=$ ${fmt(Av)}.`,
        `${C} gets $\\frac{${f[0]}}{${f[1]}} \\times$ ${fmt(Av)} $=$ ${fmt(ans)}.`,
        `Answer: ${fmt(ans)}`,
      ],
    };
  }
  throw new Error('give');
}, { title: 'Share in a ratio, then pass on a fraction', word: true });

export const ratioGenerators = [
  simplifyBasic, simplifyUnits, simplifyOneN, simplifyContext, ratioEquivalent,
  shareTwo, shareThree, shareDifference, shareGeometry, shareDivide,
  partKnown, diffKnown, partLimiting, totalRange,
  ratioToFraction, fractionToRatio, ratioPercent, ratioFractionWord,
  combineABC, combineAC, combineWord,
  changeAdd, changeTransfer, changeWeeks, changeGiveFraction,
];
void [shuffle, isSimplest, KINDS];
