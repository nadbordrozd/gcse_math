// Number module – unit "Fractions".
import {
  pick, int, sample, shuffle, size, chance, gcd, lcm, frac, Frac, num, tnum, money, names, cap,
} from '../../core.js';
import { svg, rect, FILL, ACCENT } from '../../svg.js';
import { gen, uniq, F, range } from './util.js';

const T = (f, mixed = false) => Frac.of(f).tex({ mixed });
/** Random proper fraction n/d in lowest terms with d from list. */
function properFrac(rng, dens) {
  for (;;) {
    const d = pick(rng, dens); const n = int(rng, 1, d - 1);
    if (gcd(n, d) === 1) return frac(n, d);
  }
}
const safeF = (n, d, mixed = false) => (d === 0 || !Number.isInteger(n) || !Number.isInteger(d) || n <= 0 ? null : F(frac(n, d), mixed));

/* ================================================================== */
/* num-equiv-fractions                                                 */
/* ================================================================== */

export const fracSimplify = gen('num-frac-simplify', 'num-equiv-fractions', (rng, d) => {
  const base = properFrac(rng, size(d, [2, 3, 4, 5], [3, 4, 5, 6, 7, 8], [5, 7, 8, 9, 11, 12, 13]));
  const k = size(d, pick(rng, [2, 3, 4, 5]), pick(rng, [4, 6, 8, 9, 12]), pick(rng, [6, 8, 9, 12, 14, 15, 18]));
  const n = base.n * k; const dd = base.d * k;
  const asWords = chance(rng, 0.35);
  const sk = [2, 3, 5].find((p) => k % p === 0 && p < k);
  const partial = sk ? `$\\frac{${n / sk}}{${dd / sk}}$` : null;
  const ctx = asWords ? pick(rng, [
    `In a class of ${dd} students, ${n} walk to school. What fraction of the students walk to school? Give your answer in its simplest form.`,
    `Write ${n} out of ${dd} as a fraction in its simplest form.`,
    `A bag holds ${dd} sweets and ${n} of them are red. What fraction of the sweets are red, in its simplest form?`,
    `A team won ${n} of its ${dd} matches. What fraction of its matches did it win? Give your answer in its simplest form.`,
  ]) : `Write $\\frac{${n}}{${dd}}$ in its simplest form.`;
  return {
    prompt: ctx,
    answer: F(base),
    distractors: uniq([partial, safeF(dd - n, dd) && F(frac(dd - n, dd)), F(frac(base.d, base.n)), safeF(base.n, base.d + 1), safeF(base.n + 1, base.d), dd % 2 === 0 && dd / 2 !== base.d ? `$\\frac{${base.n}}{${dd / 2}}$` : null].filter(Boolean).filter((s) => !/^\$\d+\$$/.test(s)), F(base)),
    allowEquivalent: true,
    typed: { kind: 'number', value: base },
    solution: [
      `Find the [[num-hcf-lcm|highest common factor]] of ${n} and ${dd}: it is ${k}.`,
      `Divide the top and bottom by ${k}: $\\frac{${n}}{${dd}} = \\frac{${n} \\div ${k}}{${dd} \\div ${k}} = ${T(base)}$`,
      ...(sk ? [`If you only divide by ${sk} you get $\\frac{${n / sk}}{${dd / sk}}$, which can still be simplified.`] : []),
      `Answer: ${F(base)}`,
    ],
  };
}, { title: 'Simplify a fraction' });

export const fracMixedImproper = gen('num-frac-mixed-improper', 'num-equiv-fractions', (rng, d) => {
  const w = int(rng, 1, size(d, 3, 6, 12));
  const f = properFrac(rng, size(d, [2, 3, 4, 5], [3, 4, 5, 6, 7, 8], [6, 7, 8, 9, 11, 12]));
  const imp = frac(w * f.d + f.n, f.d);
  const toImproper = chance(rng);
  if (toImproper) {
    const ans = `$\\frac{${imp.n}}{${imp.d}}$`;
    return {
      prompt: `Write $${w}\\frac{${f.n}}{${f.d}}$ as an improper fraction.`,
      answer: ans,
      distractors: uniq([`$\\frac{${w + f.n}}{${f.d}}$`, `$\\frac{${w * f.n + f.d}}{${f.d}}$`, `$\\frac{${w * f.d}}{${f.d}}$`.replace(/.*/, `$\\frac{${w * f.d - f.n}}{${f.d}}$`), `$\\frac{${w * f.d + f.n}}{${f.n}}$`, `$\\frac{${w * f.n}}{${f.d}}$`, `$\\frac{${imp.n + 1}}{${f.d}}$`], ans),
      allowEquivalent: true,
      typed: { kind: 'number', value: imp },
      solution: [
        `Each whole is $\\frac{${f.d}}{${f.d}}$, so ${w} whole${w > 1 ? 's are' : ' is'} $\\frac{${w * f.d}}{${f.d}}$.`,
        `Add the $\\frac{${f.n}}{${f.d}}$: $\\frac{${w * f.d} + ${f.n}}{${f.d}} = \\frac{${imp.n}}{${f.d}}$`,
        `Answer: ${ans}`,
      ],
    };
  }
  const ans = `$${w}\\frac{${f.n}}{${f.d}}$`;
  return {
    prompt: `Write $\\frac{${imp.n}}{${imp.d}}$ as a mixed number.`,
    answer: ans,
    distractors: uniq([`$${f.n}\\frac{${w}}{${f.d}}$`, `$${w + 1}\\frac{${f.n}}{${f.d}}$`, w > 1 ? `$${w - 1}\\frac{${f.n + f.d}}{${f.d}}$` : null, `$${w}\\frac{${f.d - f.n}}{${f.d}}$`, `$${w}\\frac{${f.n}}{${imp.n}}$`, f.n > 1 ? `$${w}\\frac{${f.n - 1}}{${f.d}}$` : `$${w}\\frac{${f.n + 1}}{${f.d}}$`].filter(Boolean), ans),
    allowEquivalent: true,
    typed: { kind: 'number', value: imp },
    solution: [
      `How many times does ${imp.d} go into ${imp.n}? $${imp.n} \\div ${imp.d} = ${w}$ remainder ${f.n}.`,
      `So there are ${w} whole${w > 1 ? 's' : ''} and $\\frac{${f.n}}{${f.d}}$ left over.`,
      `Answer: ${ans}`,
    ],
  };
}, { title: 'Mixed numbers and improper fractions' });

export const fracCompare = gen('num-frac-compare', 'num-equiv-fractions', (rng, d) => {
  const type = pick(rng, size(d, ['equivalent', 'largest'], ['largest', 'smallest', 'equivalent', 'between'], ['between', 'largest', 'smallest']));
  if (type === 'equivalent') {
    const f = properFrac(rng, [3, 4, 5, 6, 8]);
    const k = int(rng, 2, 6);
    const ans = `$\\frac{${f.n * k}}{${f.d * k}}$`;
    return {
      prompt: `Which fraction is equivalent to $${T(f)}$?`,
      answer: ans,
      distractors: uniq([`$\\frac{${f.n + k}}{${f.d + k}}$`, `$\\frac{${f.n * k}}{${f.d + k}}$`, `$\\frac{${f.d * k}}{${f.n * k}}$`, `$\\frac{${f.n * k + 1}}{${f.d * k}}$`, `$\\frac{${f.n * k}}{${f.d * k + 1}}$`, `$\\frac{${f.n + 1}}{${f.d + 1}}$`].filter((s) => !s.includes('{0}')), ans),
      allowEquivalent: true,
      solution: [
        'Equivalent fractions: multiply (or divide) the top and the bottom by the <b>same</b> number.',
        `$${T(f)} = \\frac{${f.n} \\times ${k}}{${f.d} \\times ${k}} = \\frac{${f.n * k}}{${f.d * k}}$`,
        `Adding the same number to top and bottom does <b>not</b> give an equivalent fraction.`,
        `Answer: ${ans}`,
      ],
    };
  }
  const dens = size(d, [2, 3, 4, 5, 8, 10], [3, 4, 5, 6, 8, 9, 10, 12], [7, 8, 9, 11, 12, 13, 15]);
  if (type === 'between') {
    for (;;) {
      const a = properFrac(rng, [2, 3, 4, 5]); const b = properFrac(rng, [3, 4, 5, 6]);
      if (a.value() === b.value() || Math.abs(a.value() - b.value()) < 0.1) continue;
      const lo = a.value() < b.value() ? a : b; const hi = a.value() < b.value() ? b : a;
      const inside = []; const outside = [];
      for (const dd of dens) for (let n = 1; n < dd; n += 1) {
        if (gcd(n, dd) !== 1) continue;
        const v = n / dd;
        if (v > lo.value() && v < hi.value()) inside.push(frac(n, dd)); else if (Math.abs(v - lo.value()) < 0.25 || Math.abs(v - hi.value()) < 0.25) outside.push(frac(n, dd));
      }
      if (!inside.length || outside.length < 4) continue;
      const pickF = pick(rng, inside);
      const ans = F(pickF);
      const L = lcm(lo.d, hi.d);
      return {
        prompt: `Which fraction is between $${T(lo)}$ and $${T(hi)}$?`,
        answer: ans,
        distractors: uniq(shuffle(rng, outside).filter((f) => f.value() !== lo.value() && f.value() !== hi.value()).slice(0, 6).map((f) => F(f)), ans),
        solution: [
          `Write fractions over a common denominator (or as decimals) to compare them.`,
          `$${T(lo)} \\approx ${tnum(Math.round(lo.value() * 1000) / 1000)}$ and $${T(hi)} \\approx ${tnum(Math.round(hi.value() * 1000) / 1000)}$${L <= 60 ? `, i.e. $\\frac{${lo.n * L / lo.d}}{${L}}$ and $\\frac{${hi.n * L / hi.d}}{${L}}$` : ''}.`,
          `${ans} $\\approx ${tnum(Math.round(pickF.value() * 1000) / 1000)}$, which is between them.`,
          `Answer: ${ans}`,
        ],
      };
    }
  }
  const set = [];
  while (set.length < 5) { const f = properFrac(rng, dens); if (!set.some((g) => g.value() === f.value())) set.push(f); }
  const wantMax = type === 'largest';
  const target = set.reduce((best, f) => ((wantMax ? f.value() > best.value() : f.value() < best.value()) ? f : best));
  const L = set.reduce((acc, f) => lcm(acc, f.d), 1);
  return {
    prompt: `Which of these fractions is the <b>${wantMax ? 'largest' : 'smallest'}</b>?<br>${set.map((f) => F(f)).join(",&nbsp;&nbsp; ")}`,
    answer: F(target),
    distractors: set.filter((f) => f !== target).map((f) => F(f)),
    solution: [
      L <= 120 ? `Write them all with the common denominator ${L}: ${set.map((f) => `$\\frac{${f.n * L / f.d}}{${L}}$`).join(', ')}.` : `Change each fraction to a decimal: ${set.map((f) => `$${T(f)} \\approx ${tnum(Math.round(f.value() * 1000) / 1000)}$`).join(', ')}.`,
      `A bigger denominator does not mean a bigger fraction – compare the equivalent values.`,
      `Answer: ${F(target)}`,
    ],
  };
}, { title: 'Compare and order fractions' });

export const fracMissing = gen('num-frac-missing', 'num-equiv-fractions', (rng, d) => {
  const f = properFrac(rng, size(d, [2, 3, 4, 5], [3, 4, 5, 6, 7, 8], [3, 4, 5, 6, 7, 8]));
  const k = int(rng, 2, size(d, 5, 9, 9));
  const where = pick(rng, d === 'easy' ? ['top'] : ['top', 'bottom', 'top']);
  if (d === 'hard') {
    // neither fraction is in its simplest form: e.g. 6/9 = ?/15 – simplify first, then scale
    let k1 = int(rng, 2, 6);
    if (k1 === k) k1 += 1;
    const N1 = f.n * k1; const D1 = f.d * k1; const N = f.n * k; const D = f.d * k;
    if (D % D1 === 0 || N % N1 === 0) throw new Error('retry');
    const ans = where === 'top' ? N : D;
    const shown = where === 'top' ? `\\frac{${N1}}{${D1}} = \\frac{\\square}{${D}}` : `\\frac{${N1}}{${D1}} = \\frac{${N}}{\\square}`;
    const wrongs = where === 'top' ? [N1 + (D - D1), Math.round(N1 * D / D1 + 1), D - D1, ans + f.n, ans - f.n] : [D1 + (N - N1), N + (D1 - N1), ans + f.d, ans - f.d, D1 * N / N1 + 1];
    return {
      prompt: `Work out the missing number.<br>$${shown}$`,
      answer: num(ans),
      distractors: uniq(wrongs.filter((v) => Number.isInteger(v) && v > 0 && v !== ans).map((v) => num(v)), num(ans)),
      typed: { kind: 'number', value: ans },
      solution: [
        `${where === 'top' ? D1 : N1} does not go exactly into ${where === 'top' ? D : N}, so first simplify: $\\frac{${N1}}{${D1}} = ${T(f)}$ (divide top and bottom by ${k1}).`,
        `Now $${T(f)} = ${where === 'top' ? `\\frac{\\square}{${D}}` : `\\frac{${N}}{\\square}`}$: the ${where === 'top' ? 'denominator' : 'numerator'} is multiplied by ${k}, so $${where === 'top' ? f.n : f.d} \\times ${k} = ${ans}$.`,
        `Answer: ${ans}`,
      ],
    };
  }
  const N = f.n * k; const D = f.d * k;
  const ans = where === 'top' ? N : D;
  const shown = where === 'top' ? `\\frac{${f.n}}{${f.d}} = \\frac{\\square}{${D}}` : `\\frac{${f.n}}{${f.d}} = \\frac{${N}}{\\square}`;
  const wrongs = where === 'top' ? [f.n + (D - f.d), f.n * (D - f.d), D - f.d, f.n + k, ans + f.n] : [f.d + (N - f.n), N + f.d, f.d * (N - f.n), ans - f.d, ans + f.d];
  return {
    prompt: `Work out the missing number.<br>$${shown}$`,
    answer: num(ans),
    distractors: uniq(wrongs.filter((v) => v > 0 && v !== ans).map((v) => num(v)), num(ans)),
    typed: { kind: 'number', value: ans },
    solution: [
      where === 'top' ? `The denominator has been multiplied by $${D} \\div ${f.d} = ${k}$.` : `The numerator has been multiplied by $${N} \\div ${f.n} = ${k}$.`,
      `Do the same to the other part: $${where === 'top' ? f.n : f.d} \\times ${k} = ${ans}$`,
      `Answer: ${ans}`,
    ],
  };
}, { title: 'Missing number in equivalent fractions' });

function shadedGrid(rows, cols, shadedIdx) {
  const s = 32; const pad = 6;
  let body = '';
  for (let r = 0; r < rows; r += 1) for (let c = 0; c < cols; c += 1) {
    const i = r * cols + c;
    body += rect(pad + c * s, pad + r * s, s, s, { fill: shadedIdx.has(i) ? ACCENT : FILL, width: 1.5 });
  }
  return svg(cols * s + 2 * pad, rows * s + 2 * pad, body, { maxWidth: Math.min(380, cols * s + 2 * pad), label: 'Grid of squares, some shaded' });
}

export const fracShaded = gen('num-frac-shaded', 'num-equiv-fractions', (rng, d) => {
  const [rows, cols] = pick(rng, size(d, [[2, 4], [2, 5], [3, 4], [2, 6]], [[3, 4], [4, 5], [3, 6], [4, 6], [2, 8]], [[4, 6], [3, 8], [4, 5], [5, 6], [3, 10]]));
  const total = rows * cols;
  let k;
  do { k = int(rng, 1, total - 1); } while (gcd(k, total) === 1 && d !== 'easy' && chance(rng, 0.7));
  const idx = new Set(sample(rng, range(0, total - 1), k));
  const visual = shadedGrid(rows, cols, idx);
  if (d === 'hard' && chance(rng, 0.5)) {
    const target = pick(rng, [frac(1, 2), frac(3, 4), frac(2, 3), frac(3, 5), frac(5, 6), frac(1, 3), frac(2, 5)].filter((f) => (total * f.n) % f.d === 0 && total * f.value() > k));
    if (!target) throw new Error('retry');
    const need = total * target.value() - k;
    return {
      prompt: `How many more squares must be shaded so that $${T(target)}$ of the shape is shaded?`,
      visual,
      answer: num(need),
      distractors: uniq([total * target.value(), need + 1, need - 1, total - k, Math.abs(target.n - k), need + target.d].filter((v) => v > 0 && v !== need).map((v) => num(v)), num(need)),
      typed: { kind: 'number', value: need },
      solution: [
        `There are ${total} squares, so $${T(target)}$ of the shape is $${total} \\div ${target.d} \\times ${target.n} = ${total * target.value()}$ squares.`,
        `${k} are shaded already, so shade $${total * target.value()} - ${k} = ${need}$ more.`,
        `Answer: ${need}`,
      ],
    };
  }
  const askUnshaded = d !== 'easy' && chance(rng, 0.3);
  const part = askUnshaded ? total - k : k;
  const ans = frac(part, total);
  return {
    prompt: `What fraction of the shape is ${askUnshaded ? '<b>not</b> shaded' : 'shaded'}? Give your answer in its simplest form.`,
    visual,
    answer: F(ans),
    distractors: uniq([safeF(total - part, total), safeF(part, total - part), safeF(total - part, part), safeF(part, rows), safeF(part, cols), safeF(part, total + 1)].filter(Boolean).filter((s) => s !== F(ans) && !/^\$\d+\$$/.test(s)), F(ans)),
    typed: { kind: 'number', value: ans },
    solution: [
      `Count: ${part} of the ${total} squares are ${askUnshaded ? 'not shaded' : 'shaded'}, so the fraction is $\\frac{${part}}{${total}}$.`,
      gcd(part, total) > 1 ? `Simplify by dividing top and bottom by ${gcd(part, total)}: $\\frac{${part}}{${total}} = ${T(ans)}$` : 'This is already in its simplest form.',
      `Answer: ${F(ans)}`,
    ],
  };
}, { title: 'Fraction of a shape shaded' });

/* ================================================================== */
/* num-fraction-of-amount                                              */
/* ================================================================== */

export const foaOf = gen('num-foa-of', 'num-fraction-of-amount', (rng, d) => {
  const f = d === 'easy' ? (chance(rng) ? frac(1, pick(rng, [2, 3, 4, 5, 10])) : properFrac(rng, [3, 4, 5])) : d === 'medium' ? properFrac(rng, [3, 4, 5, 6, 7, 8, 9]) : pick(rng, [properFrac(rng, [8, 12, 15, 20]), frac(pick(rng, [5, 7, 9]), pick(rng, [2, 4]))]);
  const isMoney = d !== 'easy' && chance(rng, 0.4);
  let amt = f.d * int(rng, 2, size(d, 12, 15, 20));
  if (d === 'hard' && isMoney && chance(rng)) amt = f.d * int(rng, 2, 20) / 2 + (f.d % 2 ? 0 : 0);
  const ans = (amt / f.d) * f.n;
  const fmt = (v) => (isMoney ? money(v) : num(v));
  if (!Number.isInteger(ans * 100)) throw new Error('retry');
  return {
    prompt: `Work out $${T(f)}$ of ${isMoney ? money(amt) : num(amt)}`,
    answer: fmt(ans),
    distractors: uniq([amt / f.n * f.d, amt / f.d, amt * f.n, amt - ans, amt / (f.n + f.d), ans + amt / f.d].filter((v) => v > 0 && Number.isInteger(v * 100) && v !== ans).map(fmt), fmt(ans)),
    typed: { kind: 'number', value: ans },
    solution: [
      `Divide by the denominator to find $\\frac{1}{${f.d}}$: $${tnum(amt)} \\div ${f.d} = ${tnum(amt / f.d)}$`,
      ...(f.n > 1 ? [`Multiply by the numerator: $${tnum(amt / f.d)} \\times ${f.n} = ${tnum(ans)}$`] : []),
      `Answer: ${fmt(ans)}`,
    ],
  };
}, { title: 'Fraction of an amount' });

const UNIT_FRAC = [
  { whole: 'an hour', big: 60, unit: 'minutes', bigText: '1 hour = 60 minutes' },
  { whole: 'a day', big: 24, unit: 'hours', bigText: '1 day = 24 hours' },
  { whole: '£1', big: 100, unit: 'p', bigText: '£1 = 100p' },
  { whole: '£2', big: 200, unit: 'p', bigText: '£2 = 200p' },
  { whole: '1 kilogram', big: 1000, unit: 'g', bigText: '1 kg = 1000 g' },
  { whole: '1 metre', big: 100, unit: 'cm', bigText: '1 m = 100 cm' },
  { whole: '1 litre', big: 1000, unit: 'ml', bigText: '1 litre = 1000 ml' },
  { whole: 'a year', big: 12, unit: 'months', bigText: '1 year = 12 months' },
];

export const foaAsFraction = gen('num-foa-as-fraction', 'num-fraction-of-amount', (rng, d) => {
  if (d === 'easy' || chance(rng, 0.4)) {
    let a; let b;
    do { b = int(rng, size(d, 6, 12, 24), size(d, 30, 60, 120)); a = int(rng, 2, b - 1); } while (gcd(a, b) === 1);
    const ans = frac(a, b);
    return {
      prompt: `Write ${a} as a fraction of ${b}. Give your answer in its simplest form.`,
      answer: F(ans),
      distractors: uniq([F(frac(b, a)), safeF(b - a, b), safeF(a, b + a), safeF(ans.n + 1, ans.d), safeF(ans.n, ans.d + 1)].filter(Boolean), F(ans)),
      typed: { kind: 'number', value: ans },
      solution: [
        `"${a} as a fraction of ${b}" means $\\frac{${a}}{${b}}$ (the amount goes on top, the whole on the bottom).`,
        `Simplify: divide by ${gcd(a, b)} to get $${T(ans)}$${ans.n > ans.d ? ` (it is more than 1 because ${a} > ${b})` : ''}.`,
        `Answer: ${F(ans)}`,
      ],
    };
  }
  const u = pick(rng, UNIT_FRAC);
  let part;
  do { part = int(rng, 2, u.big - 1); } while (gcd(part, u.big) === 1);
  const ans = frac(part, u.big);
  const wholeNum = u.whole.match(/\d+/) ? Number(u.whole.match(/\d+/)[0]) : 1;
  return {
    prompt: `What fraction of ${u.whole} is ${u.unit === 'p' ? `${part}p` : `${part} ${u.unit}`}? Give your answer in its simplest form.`,
    answer: F(ans),
    distractors: uniq([safeF(part, wholeNum === 1 ? 10 : wholeNum * 10), F(frac(u.big, part)), safeF(u.big - part, u.big), safeF(part, 100), safeF(part, wholeNum * 1000), safeF(ans.n + 1, ans.d)].filter(Boolean), F(ans)),
    typed: { kind: 'number', value: ans },
    solution: [
      `Use the same units: ${u.bigText}.`,
      `So the fraction is $\\frac{${part}}{${u.big}}$, which simplifies to $${T(ans)}$.`,
      `Answer: ${F(ans)}`,
    ],
  };
}, { title: 'One quantity as a fraction of another' });

const REVERSE_CTX = [
  (f, v) => `$${T(f)}$ of a number is ${num(v)}. What is the number?`,
  (f, v) => `$${T(f)}$ of the students in a year group walk to school. ${num(v)} students walk. How many students are in the year group?`,
  (f, v) => `Sofia has read $${T(f)}$ of her book. She has read ${num(v)} pages. How many pages are in the book?`,
  (f, v) => `A tank is $${T(f)}$ full. It contains ${num(v)} litres. How many litres does the tank hold when full?`,
  (f, v) => `$${T(f)}$ of the money raised at a fair came from the cake stall. The cake stall raised £${num(v)}. How much was raised altogether?`,
];

export const foaReverse = gen('num-foa-reverse', 'num-fraction-of-amount', (rng, d) => {
  const f = size(d, frac(1, pick(rng, [3, 4, 5, 6])), properFrac(rng, [3, 4, 5, 8]), properFrac(rng, [5, 7, 8, 9, 12]));
  const whole = f.d * int(rng, 3, size(d, 12, 15, 25));
  const v = whole / f.d * f.n;
  const tpl = pick(rng, REVERSE_CTX);
  const money_ = tpl === REVERSE_CTX[4];
  const fmt = (x) => (money_ ? money(x) : num(x));
  return {
    prompt: tpl(f, v),
    answer: fmt(whole),
    distractors: uniq([v / f.d * f.n, v * f.d, v / f.n, v + v / f.n, v * f.n, whole + v / f.n].filter((x) => Number.isInteger(x) && x > 0 && x !== whole).map(fmt), fmt(whole)),
    typed: { kind: 'number', value: whole },
    solution: [
      `$${T(f)}$ of the total is ${num(v)}.`,
      ...(f.n > 1 ? [`So $\\frac{1}{${f.d}}$ is $${tnum(v)} \\div ${f.n} = ${tnum(v / f.n)}$.`] : []),
      `The whole is $\\frac{${f.d}}{${f.d}}$: $${tnum(v / f.n)} \\times ${f.d} = ${tnum(whole)}$.`,
      `Answer: ${fmt(whole)}`,
    ],
  };
}, { title: 'Find the whole from a fraction' });

/* ================================================================== */
/* num-fraction-add-sub                                                */
/* ================================================================== */

export const fasProper = gen('num-fas-proper', 'num-fraction-add-sub', (rng, d) => {
  for (;;) {
    let a; let b;
    if (d === 'easy') { const den = pick(rng, [4, 6, 8, 10, 12]); a = properFrac(rng, [2, 3, 4, 5].filter((x) => den % x === 0 && x < den)); b = properFrac(rng, [den]); }
    else if (d === 'medium') { a = properFrac(rng, [3, 4, 5, 7]); b = properFrac(rng, [2, 3, 4, 5, 6, 9]); }
    else { a = properFrac(rng, [6, 8, 9, 10, 12]); b = properFrac(rng, [4, 6, 9, 15, 10]); }
    if (a.d === b.d) continue;
    const sub = chance(rng, 0.45);
    if (sub && a.value() < b.value()) [a, b] = [b, a];
    const ans = sub ? a.sub(b) : a.add(b);
    if (ans.n <= 0) continue;
    const L = lcm(a.d, b.d);
    const op = sub ? '-' : '+';
    const wrong = [
      safeF(sub ? Math.abs(a.n - b.n) : a.n + b.n, sub ? Math.abs(a.d - b.d) : a.d + b.d),
      safeF(sub ? Math.abs(a.n - b.n) : a.n + b.n, L),
      safeF(sub ? Math.abs(a.n - b.n) : a.n + b.n, a.d * b.d),
      F(sub ? a.add(b) : (a.value() > b.value() ? a.sub(b) : b.sub(a))),
      safeF(ans.n + 1, ans.d), safeF(ans.n, ans.d + 1), safeF(ans.n - 1, ans.d),
    ];
    return {
      prompt: `Work out $${T(a)} ${op} ${T(b)}$<br>Give your answer in its simplest form.`,
      answer: F(ans, false),
      distractors: uniq(wrong.filter(Boolean), F(ans)),
      typed: { kind: 'number', value: ans },
      solution: [
        `Use a common denominator: the [[num-hcf-lcm|LCM]] of ${a.d} and ${b.d} is ${L}.`,
        `$${T(a)} = \\frac{${a.n * L / a.d}}{${L}}$ and $${T(b)} = \\frac{${b.n * L / b.d}}{${L}}$`,
        `$\\frac{${a.n * L / a.d}}{${L}} ${op} \\frac{${b.n * L / b.d}}{${L}} = \\frac{${a.n * L / a.d + (sub ? -1 : 1) * b.n * L / b.d}}{${L}}${ans.d !== L ? ` = ${T(ans)}` : ''}$`,
        `Only the numerators are ${sub ? 'subtracted' : 'added'} – never ${sub ? 'subtract' : 'add'} the denominators. Answer: ${F(ans)}`,
      ],
    };
  }
}, { title: 'Add and subtract fractions' });

export const fasMixed = gen('num-fas-mixed', 'num-fraction-add-sub', (rng, d) => {
  for (;;) {
    const a = properFrac(rng, size(d, [2, 4, 8], [3, 4, 5, 6], [3, 5, 7, 8, 9]));
    const b = properFrac(rng, size(d, [4, 8], [2, 3, 4, 6, 8], [4, 6, 9, 10, 12]));
    if (a.d === b.d && d !== 'easy') continue;
    const wa = int(rng, 2, size(d, 4, 6, 9)); const wb = int(rng, 1, wa - 1);
    const A = frac(wa * a.d + a.n, a.d); const B = frac(wb * b.d + b.n, b.d);
    const sub = d === 'easy' ? chance(rng, 0.3) : chance(rng, 0.6);
    const ans = sub ? A.sub(B) : A.add(B);
    if (ans.n <= 0 || ans.isInt) continue;
    const op = sub ? '-' : '+';
    const fracPart = sub ? a.sub(b) : a.add(b);
    const naive = sub ? frac(wa - wb, 1).add(fracPart.n < 0 ? fracPart.neg() : fracPart) : frac(wa + wb, 1).add(fracPart.value() >= 1 ? fracPart.sub(1) : fracPart);
    const wrongs = [
      naive.eq(ans) ? null : F(naive, true),
      F(sub ? A.add(B) : (A.value() > B.value() ? A.sub(B) : B.sub(A)), true),
      F(ans.add(1), true), ans.value() > 1 ? F(ans.sub(1), true) : null,
      safeF(wa + (sub ? -wb : wb), 1) && F(frac((sub ? wa - wb : wa + wb) * (a.d + b.d) + (sub ? Math.abs(a.n - b.n) : a.n + b.n), a.d + b.d), true),
      F(ans.add(frac(1, ans.d)), true),
    ].filter(Boolean);
    return {
      prompt: `Work out $${T(A, true)} ${op} ${T(B, true)}$<br>Give your answer as a mixed number in its simplest form.`,
      answer: F(ans, true),
      distractors: uniq(wrongs, F(ans, true)),
      typed: { kind: 'number', value: ans },
      solution: [
        `Change to improper fractions: $${T(A, true)} = ${T(A)}$ and $${T(B, true)} = ${T(B)}$.`,
        `Common denominator ${lcm(A.d, B.d)}: $\\frac{${A.n * lcm(A.d, B.d) / A.d}}{${lcm(A.d, B.d)}} ${op} \\frac{${B.n * lcm(A.d, B.d) / B.d}}{${lcm(A.d, B.d)}} = ${T(ans)}$`,
        `As a mixed number: $${T(ans)} = ${T(ans, true)}$`,
        `Answer: ${F(ans, true)}`,
      ],
    };
  }
}, { title: 'Add and subtract mixed numbers' });

/* ================================================================== */
/* num-fraction-mul-div                                                */
/* ================================================================== */

export const fmdMultiply = gen('num-fmd-multiply', 'num-fraction-mul-div', (rng, d) => {
  const type = d === 'easy' ? pick(rng, ['ff', 'intf']) : d === 'medium' ? pick(rng, ['ff', 'ff', 'intf']) : pick(rng, ['ff', 'three']);
  let a; let b; let c = null; let expr; let ans;
  if (type === 'intf') { a = frac(int(rng, 2, 12), 1); b = properFrac(rng, [3, 4, 5, 7, 8]); ans = a.mul(b); expr = `${a.n} \\times ${T(b)}`; }
  else {
    a = properFrac(rng, size(d, [2, 3, 4, 5], [3, 4, 5, 6, 7, 8, 9], [4, 5, 7, 8, 9, 10, 12]));
    b = properFrac(rng, size(d, [3, 4, 5, 7], [3, 4, 5, 6, 8, 9, 10], [6, 9, 11, 14, 15, 16]));
    if (type === 'three') { c = properFrac(rng, [2, 3, 4, 5]); ans = a.mul(b).mul(c); expr = `${T(a)} \\times ${T(b)} \\times ${T(c)}`; }
    else { ans = a.mul(b); expr = `${T(a)} \\times ${T(b)}`; }
  }
  const wrong = [
    safeF(a.n * b.d, a.d * b.n),
    F(a.add(b)),
    safeF(a.n * b.n, a.d + b.d),
    safeF(a.n + b.n, a.d * b.d),
    type === 'intf' ? safeF(a.n * b.n, a.n * b.d) : null,
    type === 'intf' ? safeF(b.n, b.d * a.n) : null,
    safeF(ans.n + 1, ans.d), safeF(ans.n, ans.d + 1),
  ].filter((s) => s && s !== F(ans));
  const mixed = ans.n > ans.d;
  return {
    prompt: `Work out $${expr}$<br>Give your answer in its simplest form.`,
    answer: F(ans, mixed),
    distractors: uniq(wrong.map((s) => s.replace(/^\$\\frac\{(\d+)\}\{(\d+)\}\$$/, (m, p, q) => (mixed && Number(p) > Number(q) ? F(frac(Number(p), Number(q)), true) : m))), F(ans, mixed)),
    typed: { kind: 'number', value: ans },
    solution: [
      'Multiply the numerators together and the denominators together (you can cancel common factors first).',
      `$${expr} = \\frac{${[a, b, c].filter(Boolean).map((f) => f.n).join(' \\times ')}}{${[a, b, c].filter(Boolean).map((f) => f.d).join(' \\times ')}} = \\frac{${[a, b, c].filter(Boolean).reduce((p, f) => p * f.n, 1)}}{${[a, b, c].filter(Boolean).reduce((p, f) => p * f.d, 1)}}$`,
      `Simplify: $${T(ans)}${mixed ? ` = ${T(ans, true)}` : ''}$`,
      `Answer: ${F(ans, mixed)}`,
    ],
  };
}, { title: 'Multiply fractions' });

export const fmdDivide = gen('num-fmd-divide', 'num-fraction-mul-div', (rng, d) => {
  const type = d === 'easy' ? pick(rng, ['intByFrac', 'fracByInt']) : pick(rng, ['ff', 'ff', 'intByFrac']);
  let a; let b; let expr;
  if (type === 'intByFrac') { a = frac(int(rng, 2, 9), 1); b = d === 'easy' ? frac(1, pick(rng, [2, 3, 4, 5])) : properFrac(rng, [3, 4, 5, 6]); }
  else if (type === 'fracByInt') { a = properFrac(rng, [2, 3, 4, 5, 6]); b = frac(int(rng, 2, 5), 1); }
  else { a = properFrac(rng, size(d, [3, 4], [3, 4, 5, 6, 7, 8], [5, 7, 8, 9, 10, 12])); b = properFrac(rng, size(d, [3, 4], [2, 3, 4, 5, 9], [3, 4, 6, 9, 15])); }
  const ans = a.div(b);
  expr = `${T(a)} \\div ${T(b)}`;
  const mixed = ans.n > ans.d && !ans.isInt;
  const fmt = (f) => (f.isInt ? `$${f.n}$` : F(f, f.n > f.d));
  const wrong = [a.mul(b), b.div(a), frac(a.n * b.n, a.d * b.d).value() === ans.value() ? null : frac(a.n * b.n, a.d * b.d), a.d % 1 === 0 && b.d !== 0 ? frac(a.n * b.d + 1, a.d * b.n) : null, a.sub(b).n > 0 ? a.sub(b) : null, ans.add(1)].filter(Boolean);
  return {
    prompt: `Work out $${expr}$${ans.isInt ? '' : '<br>Give your answer in its simplest form.'}`,
    answer: fmt(ans),
    distractors: uniq(wrong.filter((f) => !f.eq(ans) && f.n > 0).map(fmt), fmt(ans)),
    typed: { kind: 'number', value: ans },
    solution: [
      'To divide by a fraction, multiply by its <b>reciprocal</b> (flip the second fraction): keep, change, flip.',
      `$${expr} = ${T(a)} \\times ${T(b.inv())}$`,
      `$= \\frac{${a.n * b.d}}{${a.d * b.n}}${ans.n !== a.n * b.d || ans.d !== a.d * b.n ? ` = ${T(ans)}` : ''}${mixed ? ` = ${T(ans, true)}` : ''}$`,
      `Answer: ${fmt(ans)}`,
    ],
  };
}, { title: 'Divide fractions' });

export const fmdMixedNumbers = gen('num-fmd-mixed', 'num-fraction-mul-div', (rng, d) => {
  for (;;) {
    const A = properFrac(rng, [2, 3, 4, 5]).add(int(rng, 1, size(d, 2, 3, 4)));
    const B = d === 'easy' ? frac(int(rng, 2, 4), 1) : properFrac(rng, [2, 3, 4, 5, 6]).add(int(rng, 1, 3));
    const div = d !== 'easy' && chance(rng);
    const ans = div ? A.div(B) : A.mul(B);
    if (ans.d > 30 || ans.isInt && chance(rng, 0.5)) continue;
    const op = div ? '\\div' : '\\times';
    const wA = Math.floor(A.value()); const fA = A.sub(wA);
    const wB = Math.floor(B.value()); const fB = B.sub(wB);
    // Classic slip: multiply whole parts and fraction parts separately (only wrong when both are mixed numbers);
    // with a whole-number multiplier the slip is forgetting to multiply the fraction part.
    const naive = div ? null : B.isInt ? frac(wA * wB, 1).add(fA) : frac(wA * wB, 1).add(fA.mul(fB));
    const fmt = (f) => (f.isInt ? `$${f.n}$` : F(f, true));
    const wrong = [naive, div ? A.mul(B) : A.div(B), div ? B.div(A) : null, ans.add(1), ans.value() > 1 ? ans.sub(1) : null,
      ans.add(frac(1, ans.d === 1 ? 2 : ans.d)), ans.isInt ? ans.add(frac(1, 2)) : ans.sub(frac(1, ans.d)), frac(A.n * B.n + 1, A.d * B.d)].filter((f) => f && !f.eq(ans) && f.n > 0);
    const mixedAns = !ans.isInt && ans.n > ans.d;
    return {
      prompt: `Work out $${T(A, true)} ${op} ${B.isInt ? B.n : T(B, true)}$<br>Give your answer ${mixedAns ? 'as a mixed number ' : ''}in its simplest form.`,
      answer: fmt(ans),
      distractors: uniq(wrong.map(fmt), fmt(ans)),
      typed: { kind: 'number', value: ans },
      solution: [
        `First write each mixed number as an improper fraction: $${T(A, true)} = ${T(A)}$${B.isInt ? '' : ` and $${T(B, true)} = ${T(B)}$`}.`,
        div ? `Dividing: flip the second fraction and multiply: $${T(A)} \\times ${T(B.inv())}$` : `Multiply tops and bottoms: $${T(A)} \\times ${T(B)}$`,
        `$= ${T(ans)}${mixedAns ? ` = ${T(ans, true)}` : ''}$${naive && !naive.eq(ans) ? (B.isInt ? ` (both the whole part and the fraction part must be multiplied by ${B.n} – multiplying only the whole part gives ${fmt(naive)})` : ` (multiplying the whole numbers and the fractions separately is wrong – that gives ${fmt(naive)})`) : ''}`,
        `Answer: ${fmt(ans)}`,
      ],
    };
  }
}, { title: 'Multiply and divide mixed numbers' });

export const fmdReciprocal = gen('num-fmd-reciprocal', 'num-fraction-mul-div', (rng, d) => {
  const type = pick(rng, size(d, ['frac', 'int'], ['frac', 'decimal', 'mixed'], ['mixed', 'decimal', 'negative']));
  let shown; let val;
  if (type === 'frac') { val = properFrac(rng, [3, 4, 5, 7, 8, 9]); shown = `$${T(val)}$`; }
  else if (type === 'int') { val = frac(int(rng, 2, 12), 1); shown = `$${val.n}$`; }
  else if (type === 'decimal') { val = pick(rng, [frac(1, 4), frac(1, 5), frac(2, 5), frac(3, 4), frac(1, 8), frac(1, 2), frac(5, 2), frac(5, 4)]); shown = `$${tnum(val.value())}$`; }
  else if (type === 'mixed') { val = properFrac(rng, [2, 3, 4, 5]).add(int(rng, 1, 3)); shown = `$${T(val, true)}$`; }
  else { val = properFrac(rng, [3, 4, 5, 7]).neg(); shown = `$${T(val)}$`; }
  const ans = val.inv();
  const fmt = (f) => (f.isInt ? `$${tnum(f.n)}$` : F(f));
  const wrong = [val.neg(), val, ans.neg(), type === 'mixed' ? frac(val.d, val.n - Math.floor(val.value()) * val.d).add(Math.floor(val.value())) : frac(val.d + 1, val.n), type === 'decimal' ? frac(1, Math.round(val.value() * 10) || 3) : frac(1, Math.abs(val.n) + 1), frac(Math.abs(val.n), val.d + Math.abs(val.n)).mul(val.n < 0 ? -1 : 1)];
  return {
    prompt: `Write down the reciprocal of ${shown}`,
    answer: fmt(ans),
    distractors: uniq(wrong.filter((f) => !f.eq(ans)).map(fmt), fmt(ans)),
    typed: { kind: 'number', value: ans },
    solution: [
      'The reciprocal of a number is 1 divided by it – for a fraction, turn it upside down. A number times its reciprocal is 1.',
      type === 'decimal' ? `${shown} $= ${T(val)}$, so the reciprocal is $${T(ans)}$` : type === 'mixed' ? `Write as an improper fraction first: ${shown} $= ${T(val)}$, so the reciprocal is $${T(ans)}$` : `The reciprocal of ${shown} is $${T(ans)}$${val.n < 0 ? ' (the sign stays the same)' : ''}`,
      `Check: $${T(val)} \\times ${T(ans)} = 1$ ✓`,
      `Answer: ${fmt(ans)}`,
    ],
  };
}, { title: 'Reciprocals' });

/* ================================================================== */
/* num-fraction-problems                                               */
/* ================================================================== */

// Multi-step "fraction of the rest" problems. Each returns {p, total, f1, f2, ask, labels}
const REST_CTX = [
  { who: 'people at a concert', a: 'are adults', b: 'of the rest are teenagers', c: 'The others are children. How many children are there?' },
  { who: 'students in Year 9', a: 'walk to school', b: 'of the rest come by bus', c: 'The rest come by car. How many come by car?' },
  { who: 'books in a library box', a: 'are fiction', b: 'of the rest are science books', c: 'The rest are history books. How many history books are there?' },
  { who: 'cars in a car park', a: 'are white', b: 'of the rest are black', c: 'The rest are red. How many red cars are there?' },
  { who: 'sweets in a jar', a: 'are red', b: 'of the remaining sweets are green', c: 'The rest are yellow. How many yellow sweets are there?' },
  { who: 'tickets for a show', a: 'are sold online', b: 'of the rest are sold at the box office', c: 'The rest are not sold. How many tickets are not sold?' },
  { who: 'trees in a wood', a: 'are oak', b: 'of the rest are beech', c: 'The rest are birch. How many birch trees are there?' },
  { who: 'emails in Hassan\'s inbox', a: 'are spam', b: 'of the rest are from school', c: 'The rest are from friends. How many are from friends?' },
  { who: 'animals on a farm', a: 'are sheep', b: 'of the rest are cows', c: 'The rest are pigs. How many pigs are there?' },
  { who: 'seats on a plane', a: 'are economy', b: 'of the rest are business class', c: 'The rest are first class. How many first-class seats are there?' },
  { who: 'runners in a race', a: 'finish in under an hour', b: 'of the rest finish in under two hours', c: 'The rest take two hours or more. How many runners take two hours or more?' },
  { who: 'pupils at a sports day', a: 'take part in a race', b: 'of the rest take part in a field event', c: 'The rest help to run the day. How many pupils help?' },
  { who: 'photos on Erin\'s phone', a: 'are of her family', b: 'of the rest are of her friends', c: 'The rest are of her pets. How many photos are of her pets?' },
];

export const fpRemaining = gen('num-fp-remaining', 'num-fraction-problems', (rng, d) => {
  const ctx = pick(rng, REST_CTX);
  const f1 = properFrac(rng, size(d, [3, 4, 5], [3, 4, 5, 8], [5, 6, 8, 9]));
  const f2 = properFrac(rng, size(d, [2, 3], [2, 3, 4, 5], [3, 4, 5, 7]));
  const total = f1.d * f2.d * int(rng, size(d, 2, 3, 4), size(d, 6, 10, 12));
  const n1 = total * f1.value(); const rest = total - n1; const n2 = rest * f2.value(); const left = rest - n2;
  if (![n1, n2, left].every(Number.isInteger) || left <= 0) throw new Error('retry');
  return {
    prompt: `There are ${num(total)} ${ctx.who}. $${T(f1)}$ ${ctx.a}. $${T(f2)}$ ${ctx.b}. ${ctx.c}`,
    answer: num(left),
    distractors: uniq([total - n1 - total * f2.value(), n2, rest, total * (1 - f1.value() - f2.value()), n1, left + n2 - n1].filter((v) => Number.isInteger(v) && v > 0 && v !== left).map((v) => num(v)), num(left)),
    typed: { kind: 'number', value: left },
    solution: [
      `$${T(f1)}$ of ${num(total)}: $${tnum(total)} \\div ${f1.d} \\times ${f1.n} = ${tnum(n1)}$, leaving $${tnum(total)} - ${tnum(n1)} = ${tnum(rest)}$.`,
      `$${T(f2)}$ of the <b>rest</b> (not of ${num(total)}!): $${tnum(rest)} \\div ${f2.d} \\times ${f2.n} = ${tnum(n2)}$.`,
      `Left: $${tnum(rest)} - ${tnum(n2)} = ${tnum(left)}$`,
      `Answer: ${num(left)}`,
    ],
  };
}, { title: 'Fraction of the remainder', word: true });

const SPEND_CTX = [
  (f, v) => ({ p: `Amy spends $${T(f)}$ of her birthday money on clothes. She has £${num(v)} left. How much birthday money did she get?`, m: true }),
  (f, v) => ({ p: `A water tank is full. $${T(f)}$ of the water is used, and ${num(v)} litres are left. How many litres does the full tank hold?`, u: 'litres' }),
  (f, v) => ({ p: `A shop sells $${T(f)}$ of its stock of umbrellas on a rainy day. It has ${num(v)} umbrellas left. How many umbrellas did it have at the start of the day?`, u: '' }),
  (f, v) => ({ p: `Leo has walked $${T(f)}$ of a trail. He still has ${num(v)} km to go. How long is the trail?`, u: 'km' }),
  (f, v) => ({ p: `$${T(f)}$ of the seats in a theatre are taken. There are ${num(v)} empty seats. How many seats are in the theatre?`, u: '' }),
  (f, v) => ({ p: `A phone battery has used $${T(f)}$ of its charge. ${num(v)} minutes of charge remain. How many minutes does a full charge last?`, u: 'minutes' }),
  (f, v) => ({ p: `A baker uses $${T(f)}$ of a bag of flour. ${num(v)} g of flour is left. How much flour was in the full bag?`, u: 'g' }),
  (f, v) => ({ p: `In a sale, a jacket is reduced by $${T(f)}$ of its original price. The sale price is £${num(v)}. What was the original price?`, m: true }),
  (f, v) => ({ p: `Mo has downloaded $${T(f)}$ of a game. ${num(v)} MB still need to download. What is the size of the game?`, u: 'MB' }),
  (f, v) => ({ p: `$${T(f)}$ of the pupils in a school have school dinners. The other ${num(v)} pupils bring a packed lunch. How many pupils are in the school?`, u: '' }),
  (f, v) => ({ p: `A farmer has planted $${T(f)}$ of a field. ${num(v)} m² are still to be planted. What is the area of the field?`, u: 'm²' }),
  (f, v) => ({ p: `After paying $${T(f)}$ of her wages in rent, Priya has £${num(v)} left. How much are her wages?`, m: true }),
  (f, v) => ({ p: `A reading challenge has a target number of books. Kai has read $${T(f)}$ of the target and has ${num(v)} books left to read. What is the target?`, u: 'books' }),
];

export const fpReverse = gen('num-fp-reverse', 'num-fraction-problems', (rng, d) => {
  const f = size(d, frac(1, pick(rng, [3, 4, 5])), properFrac(rng, [3, 4, 5, 8]), properFrac(rng, [5, 7, 8, 9, 12]));
  // realistic range for the original amount in each context (same order as SPEND_CTX)
  const RANGES = [[30, 200], [200, 2000], [40, 300], [6, 40], [200, 1500], [300, 1200], [500, 3000], [30, 150], [1000, 8000], [300, 1500], [500, 5000], [800, 2500], [20, 60]];
  const ci = int(rng, 0, SPEND_CTX.length - 1);
  const [lo, hi] = RANGES[ci];
  const step = f.d * (hi >= 1000 ? 10 : hi >= 200 ? 5 : 1);
  const kLo = Math.ceil(lo / step); const kHi = Math.floor(hi / step);
  if (kHi < kLo) throw new Error('retry');
  const whole = step * int(rng, kLo, kHi);
  const left = whole - whole * f.value();
  const c = SPEND_CTX[ci](f, left);
  const fmt = (x) => (c.m ? money(x) : c.u ? `${num(x)} ${c.u}` : num(x));
  const rem = frac(f.d - f.n, f.d);
  return {
    prompt: c.p,
    answer: fmt(whole),
    distractors: uniq([left + left * f.value(), left / f.n * f.d, left * f.d, left / rem.n * (f.d + 1), left * 2, left + left / rem.n, whole + left / rem.n].filter((x) => Number.isInteger(x) && x > 0 && x !== whole).map(fmt), fmt(whole)),
    typed: { kind: 'number', value: whole },
    solution: [
      `If $${T(f)}$ has gone, then $1 - ${T(f)} = ${T(rem)}$ is left.`,
      `So $${T(rem)}$ of the whole is ${num(left)}${rem.n > 1 ? `, and $\\frac{1}{${f.d}}$ is $${tnum(left)} \\div ${rem.n} = ${tnum(left / rem.n)}$` : ''}.`,
      `The whole: $${tnum(left / rem.n)} \\times ${f.d} = ${tnum(whole)}$`,
      `Answer: ${fmt(whole)} (not $${tnum(left)} + ${T(f)}$ of ${num(left)} – the fraction is of the <b>original</b> amount)`,
    ],
  };
}, { title: 'Find the original amount', word: true });

const FOF_CTX = [
  ['students in a school', 'are girls', 'of the girls', 'play in the orchestra', 'girls who play in the orchestra', 'girls who do not play in the orchestra'],
  ['people at a cinema', 'are adults', 'of the adults', 'buy popcorn', 'adults who buy popcorn', 'adults who do not buy popcorn'],
  ['cars in a car park', 'are electric', 'of the electric cars', 'are charging', 'electric cars that are charging', 'electric cars that are not charging'],
  ['members of a gym', 'are over 40', 'of these members', 'go swimming', 'members over 40 who go swimming', 'members over 40 who do not go swimming'],
  ['flowers in a garden', 'are roses', 'of the roses', 'are red', 'red roses', 'roses that are not red'],
  ['passengers on a train', 'have a season ticket', 'of these passengers', 'are students', 'students with a season ticket', 'season-ticket holders who are not students'],
  ['books on a shelf', 'are paperbacks', 'of the paperbacks', 'are novels', 'paperback novels', 'paperbacks that are not novels'],
  ['pupils in Year 11', 'study French', 'of these pupils', 'also study Spanish', 'pupils who study both French and Spanish', 'pupils who study French but not Spanish'],
  ['houses in a street', 'have a garden', 'of these houses', 'have a pond', 'houses with a garden and a pond', 'houses with a garden but no pond'],
  ['apples in a crate', 'are green', 'of the green apples', 'are bruised', 'bruised green apples', 'green apples that are not bruised'],
  ['tickets sold for a match', 'are for home fans', 'of these tickets', 'are season tickets', 'home-fan season tickets', 'home-fan tickets that are not season tickets'],
  ['visitors to a museum', 'are children', 'of the children', 'come with a school', 'children who come with a school', 'children who do not come with a school'],
  ['dogs at a dog show', 'are puppies', 'of the puppies', 'win a rosette', 'puppies that win a rosette', 'puppies that do not win a rosette'],
];

export const fpFractionOfFraction = gen('num-fp-fraction-of-fraction', 'num-fraction-problems', (rng, d) => {
  const [group, p1, ofWhat, p2, target, notTarget] = pick(rng, FOF_CTX);
  const f1 = properFrac(rng, size(d, [2, 3, 4], [3, 4, 5, 7], [5, 7, 8, 9]));
  const f2 = properFrac(rng, size(d, [2, 3, 4], [3, 4, 5, 6], [4, 5, 6, 9]));
  const askOther = d === 'hard' && chance(rng, 0.5);
  const ans = askOther ? f1.mul(frac(1).sub(f2)) : f1.mul(f2);
  const q = `What fraction of all the ${group.replace(/ an? /, " the ")} are ${askOther ? notTarget : target}?`;
  return {
    prompt: `$${T(f1)}$ of the ${group} ${p1}. $${T(f2)}$ ${ofWhat} ${p2}. ${q}`,
    answer: F(ans),
    distractors: uniq([askOther ? F(f1.mul(f2)) : F(f1.mul(frac(1).sub(f2))), safeF(f1.n * f2.n, f1.d + f2.d), f1.add(f2).value() < 1 ? F(f1.add(f2)) : null, F(f2), F(f1.sub(f2).n > 0 ? f1.sub(f2) : f2.sub(f1)), safeF(f1.n + f2.n, f1.d * f2.d)].filter((s) => s && s !== '$0$'), F(ans)),
    typed: { kind: 'number', value: ans },
    solution: [
      `"$${T(f2)}$ ${ofWhat}" means $${T(f2)}$ of $${T(f1)}$ – "of" means multiply.`,
      askOther ? `Those who do not: $1 - ${T(f2)} = ${T(frac(1).sub(f2))}$ of them.` : `$${T(f2)} \\times ${T(f1)}$`,
      `$${askOther ? T(frac(1).sub(f2)) : T(f2)} \\times ${T(f1)} = ${T(ans)}$`,
      `Answer: ${F(ans)}`,
    ],
  };
}, { title: 'Fraction of a fraction in context', word: true, learn: ['num-fraction-problems', 'num-fraction-mul-div'] });

export const generators = [
  fracSimplify, fracMixedImproper, fracCompare, fracMissing, fracShaded,
  foaOf, foaAsFraction, foaReverse,
  fasProper, fasMixed,
  fmdMultiply, fmdDivide, fmdMixedNumbers, fmdReciprocal,
  fpRemaining, fpReverse, fpFractionOfFraction,
];

void [sample, names, cap];
