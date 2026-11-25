// Number module – unit "Calculating with numbers": place value, written methods, negatives,
// order of operations, decimals, calculator use and the product rule for counting.
import {
  pick, int, sample, shuffle, size, chance, tidy, roundTo, roundSf, num, tnum, money, names, cap,
} from '../../core.js';
import { svg, arrow, ACCENT, numberLine } from '../../svg.js';
import { evaluate, exprTex, bracketings, integerSteps } from './expr.js';
import { uniq, inWords, dpOf, gen } from './util.js';

const PLACE = {
  6: 'millions', 5: 'hundred thousands', 4: 'ten thousands', 3: 'thousands', 2: 'hundreds', 1: 'tens', 0: 'ones',
  '-1': 'tenths', '-2': 'hundredths', '-3': 'thousandths',
};
const PLACE_VALUE = { 6: '1{,}000{,}000', 5: '100{,}000', 4: '10{,}000', 3: '1000', 2: '100', 1: '10', 0: '1', '-1': '0.1', '-2': '0.01', '-3': '0.001' };

/* ================================================================== */
/* num-place-value                                                     */
/* ================================================================== */

export const pvDigitValue = gen('num-pv-digit-value', 'num-place-value', (rng, d) => {
  const decimal = d === 'hard' || (d === 'medium' && chance(rng, 0.5));
  const intLen = decimal ? size(d, 1, int(rng, 1, 3), int(rng, 1, 3)) : size(d, int(rng, 4, 6), 7, 7);
  const decLen = decimal ? size(d, 0, 2, 3) : 0;
  let digits;
  do { digits = sample(rng, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], intLen + decLen); } while (digits[0] === 0 || (decLen && digits[digits.length - 1] === 0));
  // positions: index i -> power intLen-1-i
  const candidates = digits.map((dg, i) => ({ dg, pos: intLen - 1 - i })).filter((c) => c.dg !== 0 && (decimal || c.pos > 0) && (!decimal || c.pos < 0 || d === 'medium'));
  const { dg, pos } = pick(rng, candidates);
  const x = tidy(digits.reduce((acc, v, i) => acc + v * 10 ** (intLen - 1 - i), 0));
  const value = tidy(dg * 10 ** pos);
  const distract = [-2, -1, 1, 2, 3].map((k) => tidy(dg * 10 ** (pos + k))).filter((v) => v < 1e7 && v >= 0.001);
  return {
    prompt: `What is the value of the digit ${dg} in the number $${tnum(x, decLen)}$?`,
    answer: num(value),
    distractors: uniq([num(dg), ...distract.map((v) => num(v))]),
    typed: { kind: 'number', value },
    solution: [
      `Work out which column the ${dg} is in. ${decimal ? 'Counting the columns either side of the decimal point' : 'Counting columns from the right (ones, tens, hundreds, …)'}, it is in the <b>${PLACE[pos]}</b> column.`,
      pos >= 0
        ? `So the ${dg} is worth $${dg} \\times ${PLACE_VALUE[pos]} = ${tnum(value)}$.`
        : `So the ${dg} is worth ${dg} ${PLACE[pos].replace(/s$/, dg === 1 ? '' : 's')}, which is $${dg} \\times ${PLACE_VALUE[pos]} = ${tnum(value)}$.`,
      `Answer: ${num(value)}`,
    ],
  };
}, { title: 'Value of a digit' });

function randomWithZeros(rng, len) {
  const ds = [int(rng, 1, 9)];
  for (let i = 1; i < len; i += 1) ds.push(chance(rng, 0.45) ? 0 : int(rng, 1, 9));
  if (!ds.slice(1).includes(0)) ds[int(rng, 1, len - 1)] = 0;
  return Number(ds.join(''));
}

export const pvWords = gen('num-pv-words', 'num-place-value', (rng, d) => {
  const len = size(d, int(rng, 4, 5), 6, 7);
  const n = randomWithZeros(rng, len);
  const m = Math.floor(n / 1e6); const th = Math.floor((n % 1e6) / 1000); const r = n % 1000;
  const wrong = [
    Number(`${m || ''}${th || ''}${r}`),
    m * 1e6 + th * 1e4 + r, th < 100 && m ? m * 1e5 + th * 1000 + r : 0, m * 1e7 + th * 1000 + r,
    m * 1e6 + th * 1000 + (r < 100 ? r * 10 : r % 10 === 0 ? r / 10 : 0), n * 10, n % 10 === 0 ? n / 10 : 0,
  ].filter((v) => v > 0 && v !== n && Number.isInteger(v));
  const toWords = !(d === 'easy' ? chance(rng, 0.4) : chance(rng, 0.25));
  if (toWords) {
    return {
      prompt: `Write this number in figures.<br><b>${cap(inWords(n))}</b>`,
      answer: num(n),
      distractors: uniq(wrong.map((v) => num(v))),
      typed: { kind: 'number', value: n },
      solution: [
        'Split the number into its millions, thousands and the rest.',
        `${[m ? `${inWords(m)} million → $${tnum(m * 1e6)}$` : null, th ? `${inWords(th)} thousand → $${tnum(th * 1000)}$` : null, r ? `${inWords(r).replace(/^and /, '')} → $${r}$` : null].filter(Boolean).join('; ')}.`,
        `Add them, using zeros to fill the empty columns: $${[m * 1e6, th * 1000, r].filter(Boolean).map((v) => tnum(v)).join(' + ')} = ${tnum(n)}$`,
        `Answer: ${num(n)}`,
      ],
    };
  }
  return {
    prompt: `Which of these is the number $${tnum(n)}$ written in words?`,
    answer: cap(inWords(n)),
    distractors: uniq(wrong.slice(0, 6).map((v) => cap(inWords(v))), cap(inWords(n))),
    count: 4,
    solution: [
      `Split $${tnum(n)}$ at the commas: ${m ? `${m} million, ` : ''}${th ? `${th} thousand, ` : ''}${r ? `and ${r}` : ''}.`,
      `So it is read as "${inWords(n)}".`,
      `Answer: ${cap(inWords(n))}`,
    ],
  };
}, { title: 'Numbers in words and figures' });

export const pvCompare = gen('num-pv-compare', 'num-place-value', (rng, d) => {
  const largest = chance(rng);
  const neg = d === 'hard' && chance(rng, 0.6);
  const whole = size(d, 0, int(rng, 1, 9), int(rng, 0, 12));
  const b = int(rng, 2, 8);
  const c = int(rng, 1, 9); const e = int(rng, 1, 9);
  const pool = [
    b / 10, b / 10 + c / 100, b / 10 + e / 1000, b / 100, b / 10 + c / 100 + e / 1000, (b + 1) / 10,
    (b - 1) / 10 + c / 100 + e / 1000, b / 100 + c / 1000, (b + 1) / 100, b / 10 + c / 1000,
  ].map((v) => tidy(v + whole));
  const set = shuffle(rng, [...new Set(pool)]).slice(0, 5).map((v) => (neg ? -v : v));
  const target = largest ? Math.max(...set) : Math.min(...set);
  const word = largest ? 'largest' : 'smallest';
  const sorted = [...set].sort((x, y) => x - y);
  const maxDp = Math.max(...set.map(dpOf));
  return {
    prompt: `Which of these numbers is the <b>${word}</b>?<br>$${shuffle(rng, set).map((v) => tnum(v)).join(',\\quad ')}$`,
    answer: num(target),
    distractors: set.filter((v) => v !== target).map((v) => num(v)),
    typed: { kind: 'number', value: target },
    solution: [
      `Compare the digits column by column from the left. It helps to give every number the same number of decimal places by adding zeros: ${set.map((v) => `$${tnum(v, maxDp)}$`).join(', ')}.`,
      neg ? 'These are negative: the further a number is below zero, the <b>smaller</b> it is.' : 'A longer number is not necessarily bigger – compare tenths first, then hundredths, then thousandths.',
      `In order from smallest to largest: $${sorted.map((v) => tnum(v)).join(',\\ ')}$`,
      `Answer: ${num(target)}`,
    ],
  };
}, { title: 'Compare decimals (largest/smallest)' });

const CONVERSIONS = [
  { from: 'metres', to: 'millimetres', f: 1000 }, { from: 'metres', to: 'centimetres', f: 100 },
  { from: 'millimetres', to: 'centimetres', f: 0.1 }, { from: 'centimetres', to: 'metres', f: 0.01 },
  { from: 'kilograms', to: 'grams', f: 1000 }, { from: 'grams', to: 'kilograms', f: 0.001 },
  { from: 'litres', to: 'millilitres', f: 1000 }, { from: 'millilitres', to: 'litres', f: 0.001 },
  { from: 'kilometres', to: 'metres', f: 1000 }, { from: 'metres', to: 'kilometres', f: 0.001 },
  { from: 'centimetres', to: 'millimetres', f: 10 },
];

export const pvTimesTen = gen('num-pv-times-ten', 'num-place-value', (rng, d) => {
  if (d === 'hard') {
    const c = pick(rng, CONVERSIONS);
    const x = c.f > 1 ? pick(rng, [tidy(int(rng, 11, 999) / 100), tidy(int(rng, 1, 99) / 100), tidy(int(rng, 11, 99) / 10)])
      : pick(rng, [int(rng, 12, 980), int(rng, 3, 95), tidy(int(rng, 101, 999) / 10)]);
    const ans = tidy(x * c.f);
    if (dpOf(ans) > 3) throw new Error('retry');
    const ops = c.f > 1 ? `multiply by ${num(c.f)}` : `divide by ${num(1 / c.f)}`;
    return {
      prompt: `How many ${c.to} are equal to ${num(x)} ${c.from}?`,
      answer: `${num(ans)} ${c.to}`,
      distractors: [x * c.f * 10, x * c.f / 10, x / c.f, x * c.f * 100, x * c.f / 100].map(tidy).filter((v) => dpOf(v) <= 3 && v < 1e7).map((v) => `${num(v)} ${c.to}`),
      typed: { kind: 'number', value: ans },
      solution: [
        `There are ${c.f > 1 ? `${num(c.f)} ${c.to} in 1 ${c.from.replace(/s$/, '')}` : `${num(1 / c.f)} ${c.from} in 1 ${c.to.replace(/s$/, '')}`}, so ${ops}.`,
        `$${tnum(x)} ${c.f > 1 ? '\\times' : '\\div'} ${tnum(c.f > 1 ? c.f : 1 / c.f)} = ${tnum(ans)}$ (the digits move ${Math.round(Math.abs(Math.log10(c.f)))} place${Math.abs(Math.log10(c.f)) > 1.5 ? 's' : ''} to the ${c.f > 1 ? 'left' : 'right'}).`,
        `Answer: ${num(ans)} ${c.to}`,
      ],
    };
  }
  const p = pick(rng, [10, 100, 1000]);
  const times = chance(rng);
  let x;
  if (d === 'easy') x = times ? int(rng, 3, 999) : int(rng, 2, 99) * p;
  else x = times ? pick(rng, [tidy(int(rng, 101, 999) / 100), tidy(int(rng, 2, 9) / 100), tidy(int(rng, 11, 99) / 1000), tidy(int(rng, 11, 99) / 10)]) : pick(rng, [tidy(int(rng, 101, 999) / 10), int(rng, 3, 95), tidy(int(rng, 11, 99) / 10)]);
  x = tidy(x);
  const ans = tidy(times ? x * p : x / p);
  if (dpOf(ans) > 3 || dpOf(x) > 3) throw new Error('retry');
  const sym = times ? '\\times' : '\\div';
  const places = Math.log10(p);
  return {
    prompt: `Work out $${tnum(x)} ${sym} ${tnum(p)}$`,
    answer: num(ans),
    distractors: [ans * 10, ans / 10, ans * 100, ans / 100, times ? x / p : x * p].map(tidy).filter((v) => dpOf(v) <= 3).map((v) => num(v)),
    typed: { kind: 'number', value: ans },
    solution: [
      `${times ? 'Multiplying' : 'Dividing'} by ${num(p)} moves every digit ${places} place${places > 1 ? 's' : ''} to the ${times ? 'left' : 'right'} (the number gets ${times ? 'bigger' : 'smaller'}).`,
      `$${tnum(x)} ${sym} ${tnum(p)} = ${tnum(ans)}$`,
      `Answer: ${num(ans)}`,
    ],
  };
}, { title: 'Multiply and divide by 10, 100, 1000' });

export const pvNumberLine = gen('num-pv-number-line', 'num-place-value', (rng, d) => {
  let s; let M; let n;
  if (d === 'easy') { M = pick(rng, [10, 100, 20]); n = pick(rng, M === 20 ? [4, 10] : [5, 10]); s = M * int(rng, 0, 4); }
  else if (d === 'medium') { M = pick(rng, [1, 1, 10]); n = pick(rng, M === 1 ? [10, 4, 5] : [4, 5]); s = M * int(rng, 0, 6); }
  else {
    const v = pick(rng, ['tenth', 'neg', 'hund']);
    if (v === 'tenth') { M = 0.1; n = 10; s = tidy(int(rng, 10, 60) / 10); }
    else if (v === 'neg') { M = 1; n = pick(rng, [4, 5, 10]); s = -int(rng, 2, 4); }
    else { M = 0.5; n = 5; s = tidy(int(rng, 0, 8) / 2); }
  }
  const step = tidy(M / n);
  const majors = n * 3 <= 30 ? 3 : 2;
  const k = pick(rng, Array.from({ length: majors * n - 1 }, (_, i) => i + 1).filter((i) => i % n !== 0));
  const v = tidy(s + k * step);
  const nl = numberLine({ min: s, max: tidy(s + majors * M), step, labelEvery: n, width: 440 });
  const ax = nl.X(v);
  const visual = nl.svg(arrow(ax, 4, ax, nl.y - 9, { color: ACCENT, width: 2.4 }));
  const below = tidy(s + Math.floor(k / n) * M);
  const r = k % n;
  const dp = Math.max(dpOf(step), dpOf(v));
  const wrongs = [
    tidy(below + r * (M / 10)), M >= 10 ? tidy(below + r) : null, tidy(v + step), tidy(v - step), tidy(below + r * step * 2), tidy(v + M),
    tidy(below + r * (M / (n - 1))), tidy(below + M - r * step),
  ].filter((w) => w !== null && w !== v && dpOf(w) <= dp + 1 && w >= s - M && w <= s + (majors + 1) * M);
  return {
    prompt: 'What number is the arrow pointing to?',
    visual,
    answer: num(v),
    distractors: uniq(wrongs.map((w) => num(w)), num(v)),
    typed: { kind: 'number', value: v },
    solution: [
      `Between ${num(below)} and ${num(tidy(below + M))} there are ${n} spaces.`,
      `So each small division is worth $${tnum(M)} \\div ${n} = ${tnum(step)}$.`,
      `The arrow is ${r} division${r === 1 ? '' : 's'} past ${num(below)}: $${tnum(below)} + ${r} \\times ${tnum(step)} = ${tnum(v)}$`,
      `Answer: ${num(v)}`,
    ],
  };
}, { title: 'Read a number line' });

/* ================================================================== */
/* num-written-methods                                                 */
/* ================================================================== */

const digitsOf = (n, len) => String(n).padStart(len, '0').split('').map(Number);
function noBorrow(a, b) {
  const len = String(a).length;
  const da = digitsOf(a, len); const db = digitsOf(b, len);
  return Number(da.map((x, i) => Math.abs(x - db[i])).join(''));
}
function noCarry(a, b) {
  const len = Math.max(String(a).length, String(b).length);
  const da = digitsOf(a, len); const db = digitsOf(b, len);
  return Number(da.map((x, i) => (x + db[i]) % 10).join(''));
}

export const wmAddSub = gen('num-wm-add-sub', 'num-written-methods', (rng, d) => {
  const sub = chance(rng, 0.6);
  let a; let b; let c = null;
  if (d === 'easy') { a = int(rng, 300, 899); b = int(rng, 120, sub ? a - 50 : 899); }
  else if (d === 'medium') {
    if (sub) { a = int(rng, 2, 9) * 1000 + pick(rng, [0, int(rng, 1, 9) * 10, int(rng, 1, 9) * 100, int(rng, 1, 9)]); b = int(rng, 1001, a - 300); }
    else { a = int(rng, 1200, 6999); b = int(rng, 1200, 8999); }
  } else { a = int(rng, 12000, 60000); b = int(rng, 3000, 29999); c = int(rng, 1000, 9999); }
  if (c !== null) {
    const ans = a + b - c;
    return {
      prompt: `Work out $${tnum(a)} + ${tnum(b)} - ${tnum(c)}$`,
      answer: num(ans),
      distractors: [a + b + c, noCarry(a, b) - c, a + b - noBorrow(Math.max(c, 0), 0) + 10, ans + 10, ans - 100, ans + 1000, ans - 10].map((v) => num(v)),
      typed: { kind: 'number', value: ans },
      solution: [
        'Work from left to right: first add, then subtract. Line up the units in columns.',
        `$${tnum(a)} + ${tnum(b)} = ${tnum(a + b)}$`,
        `$${tnum(a + b)} - ${tnum(c)} = ${tnum(ans)}$`,
        `Answer: ${num(ans)}`,
      ],
    };
  }
  const ans = sub ? a - b : a + b;
  const mis = sub ? noBorrow(a, b) : noCarry(a, b);
  return {
    prompt: `Work out $${tnum(a)} ${sub ? '-' : '+'} ${tnum(b)}$`,
    answer: num(ans),
    distractors: [mis, ans + 10, ans - 10, ans + 100, ans - 100, sub ? a + b : a - b].filter((v) => v > 0 && v !== ans).map((v) => num(v)),
    typed: { kind: 'number', value: ans },
    solution: [
      `Write the numbers in columns with the units lined up, and work from the right.`,
      sub ? `Where the top digit is smaller, <b>exchange</b> 1 from the next column (borrow). Don't just take the smaller digit from the bigger one${mis !== ans ? ` – that gives the wrong answer ${num(mis)}` : ''}.`
        : 'When a column adds up to 10 or more, carry the 1 into the next column.',
      `$${tnum(a)} ${sub ? '-' : '+'} ${tnum(b)} = ${tnum(ans)}$${sub ? `. Check: $${tnum(ans)} + ${tnum(b)} = ${tnum(a)}$ ✓` : ''}`,
      `Answer: ${num(ans)}`,
    ],
  };
}, { title: 'Column addition and subtraction' });

export const wmMultiply = gen('num-wm-multiply', 'num-written-methods', (rng, d) => {
  let a; let b;
  if (d === 'easy') { a = int(rng, 23, 489); b = int(rng, 3, 9); }
  else if (d === 'medium') { a = int(rng, 23, 98); b = int(rng, 23, 89); }
  else { a = int(rng, 124, 789); b = int(rng, 23, 78); }
  if (a % 10 === 0) a += 1;
  if (b % 10 === 0) b += 3;
  const ans = a * b;
  const bt = Math.floor(b / 10); const bu = b % 10;
  const at = Math.floor(a / 10); const au = a % 10;
  const wrongs = b < 10
    ? [ans + 10, ans - 10, ans + 100, ans - 100, a * (b + 1), Number(digitsOf(a, String(a).length).map((x) => x * b).join(''))]
    : [a * bt + a * bu, at * bt * 100 + au * bu, ans + 100, ans - 100, ans + 10, ans - 1000, a * (b + 1)];
  return {
    prompt: `Work out $${tnum(a)} \\times ${b}$`,
    answer: num(ans),
    distractors: uniq(wrongs.filter((v) => v > 0).map((v) => num(v)), num(ans)),
    typed: { kind: 'number', value: ans },
    solution: b < 10 ? [
      `Use short multiplication (or a grid): split ${a} into ${String(a).split('').map((x, i, arr) => Number(x) * 10 ** (arr.length - 1 - i)).filter(Boolean).join(' + ')}.`,
      `${String(a).split('').map((x, i, arr) => Number(x) * 10 ** (arr.length - 1 - i)).filter(Boolean).map((p) => `$${p} \\times ${b} = ${tnum(p * b)}$`).join(', ')}`,
      `Add the parts: $${tnum(ans)}$`,
      `Answer: ${num(ans)}`,
    ] : [
      `Use long multiplication: multiply by the units digit, then by the tens digit (remember the placeholder zero).`,
      `$${tnum(a)} \\times ${bu} = ${tnum(a * bu)}$ and $${tnum(a)} \\times ${bt * 10} = ${tnum(a * bt * 10)}$`,
      `Add: $${tnum(a * bu)} + ${tnum(a * bt * 10)} = ${tnum(ans)}$`,
      `Answer: ${num(ans)}${a * bt + a * bu !== ans ? ` (forgetting the zero would give ${num(a * bt + a * bu)})` : ''}`,
    ],
  };
}, { title: 'Long and short multiplication' });

export const wmDivide = gen('num-wm-divide', 'num-written-methods', (rng, d) => {
  let q; let dv;
  if (d === 'easy') { dv = int(rng, 3, 9); q = int(rng, 21, 199); }
  else if (d === 'medium') { dv = int(rng, 3, 9); q = pick(rng, [int(rng, 1, 9) * 100 + int(rng, 1, 9), int(rng, 1, 9) * 1000 + int(rng, 1, 9) * 10 + int(rng, 1, 9), int(rng, 112, 899)]); }
  else { dv = pick(rng, [12, 13, 14, 15, 16, 17, 18, 21, 23, 24, 25, 32, 35, 42, 48, 84]); q = int(rng, 21, 99) + (chance(rng, 0.3) ? int(rng, 1, 3) * 100 : 0); }
  const n = dv * q;
  const noZero = Number(String(q).replace(/0/g, ''));
  return {
    prompt: `Work out $${tnum(n)} \\div ${dv}$`,
    answer: num(q),
    distractors: uniq([noZero, q + 1, q - 1, q * 10, q + 10, q - 10, Math.floor(q / 10)].filter((v) => v > 0).map((v) => num(v)), num(q)),
    typed: { kind: 'number', value: q },
    solution: [
      dv < 10 ? `Use short division ("bus stop"): divide ${dv} into each digit from the left, carrying remainders.` : `Use long division. It helps to write out some multiples of ${dv}: ${[1, 2, 3, 4, 5].map((k) => k * dv).join(', ')}, …`,
      String(q).includes('0') ? `Watch out: one step gives 0 – you must write the 0 in the answer${noZero !== q ? ` (otherwise you get ${num(noZero)})` : ''}.` : `${dv} goes into ${num(n)} exactly ${num(q)} times.`,
      `Check: $${tnum(q)} \\times ${dv} = ${tnum(n)}$ ✓`,
      `Answer: ${num(q)}`,
    ],
  };
}, { title: 'Short and long division' });

// Remainder problems: the context decides whether to round up or down.
const DIVIDE_CONTEXTS = [
  { per: [49, 52, 53, 57], tot: [300, 900], mode: 'up', make: (N, k) => `A school is taking ${num(N)} students to a festival by coach. Each coach can carry ${k} students. How many coaches are needed?` },
  { per: [6, 12], tot: [100, 400], mode: 'up', make: (N, k) => `A farmer collects ${num(N)} eggs. Egg boxes hold ${k} eggs each. How many boxes does she need to pack all the eggs?` },
  { per: [4, 6, 9], tot: [50, 250], mode: 'down', make: (N, k) => `A bakery makes ${num(N)} cupcakes. They are sold in boxes of ${k}. How many <b>full</b> boxes can be filled?` },
  { per: [35, 45, 55, 65], tot: [5, 20], money: true, mode: 'down', make: (N, k) => `Pens cost ${k}p each. Nadia has £${N}. What is the greatest number of pens she can buy?` },
  { per: [6, 8, 10], tot: [60, 250], mode: 'up', make: (N, k) => `${num(N)} guests are coming to a wedding. Each table seats ${k} people. How many tables are needed so that every guest has a seat?` },
  { per: [8, 12, 13], tot: [60, 200], mode: 'up', make: (N, k) => `A lift can carry at most ${k} people at a time. ${num(N)} people need to go to the top floor. What is the least number of trips the lift must make?` },
  { per: [15, 18, 24, 35], tot: [150, 600], money: true, mode: 'up', make: (N, k) => `Leo saves £${k} each week. He wants to buy a bike that costs £${num(N)}. How many weeks must he save for?` },
  { per: [35, 45, 65, 75], tot: [400, 1000], mode: 'down', make: (N, k) => `A roll of ribbon is ${num(N)} cm long. Grace cuts it into pieces that are each ${k} cm long. What is the greatest number of pieces she can cut?` },
  { per: [14, 16, 17], tot: [60, 200], mode: 'up', make: (N, k) => `A sports club is taking ${num(N)} players to a tournament in minibuses. Each minibus has ${k} seats for players. How many minibuses do they need?` },
  { per: [24, 28, 32], tot: [150, 500], mode: 'up', make: (N, k) => `A library has ${num(N)} new books. Each shelf holds ${k} books. How many shelves are needed for all the new books?` },
  { per: [3, 4, 6, 7], tot: [100, 400], mode: 'down', make: (N, k) => `A phone has ${num(N)} MB of free space. Each photo uses ${k} MB. What is the greatest number of photos that can be saved?` },
  { per: [12, 15, 16], tot: [100, 300], mode: 'up', make: (N, k) => `One tin of paint covers ${k} m². A sports hall has ${num(N)} m² of wall to paint. How many tins of paint must be bought?` },
  { per: [23, 27, 29, 31], tot: [300, 800], mode: 'down', make: (N, k) => `${num(N)} sweets are shared equally between ${k} children. Each child gets as many sweets as possible. How many sweets does each child get?` },
  { per: [23, 27, 29, 31], tot: [300, 800], mode: 'rem', make: (N, k) => `${num(N)} sweets are shared equally between ${k} children. Each child gets as many sweets as possible. How many sweets are left over?` },
];

export const wmWordDivide = gen('num-wm-word-divide', 'num-written-methods', (rng, d) => {
  // easy: small divisor and answers up to about 12; medium: the context's normal range; hard: larger totals, awkward divisors
  const ctx = pick(rng, d === 'easy' ? DIVIDE_CONTEXTS.filter((c) => c.mode !== 'rem') : DIVIDE_CONTEXTS);
  const pers = [...ctx.per].sort((x, y) => x - y);
  const k = d === 'easy' ? pers[0] : d === 'hard' ? pers[pers.length - 1] : pick(rng, pers);
  let N;
  let total;
  do {
    N = d === 'hard' ? int(rng, ctx.tot[1], Math.round(ctx.tot[1] * (ctx.money ? 2 : 2.5))) : int(rng, ctx.tot[0], ctx.tot[1]);
    if (d === 'easy' && !ctx.money) N = k * int(rng, 4, 12) + int(rng, 1, k - 1);
    if (d === 'easy' && ctx.money) N = int(rng, ctx.tot[0], ctx.tot[0] + Math.round((ctx.tot[1] - ctx.tot[0]) / 3));
    total = ctx.money ? (ctx.mode === 'down' ? N * 100 : N) : N;
  } while (total % k === 0);
  const q = Math.floor(total / k); const r = total % k;
  const ans = ctx.mode === 'up' ? q + 1 : ctx.mode === 'down' ? q : r;
  const other = ctx.mode === 'up' ? q : q + 1;
  const exact = roundTo(total / k, 1);
  const wrongs = ctx.mode === 'rem' ? [q, k - r, r + 1, r - 1, roundTo(total / k - q, 1) * 10] : [other, ans + 1, ans - 1, Number.isInteger(exact) ? null : exact, r];
  return {
    prompt: ctx.make(N, k),
    answer: num(ans),
    distractors: uniq(wrongs.filter((v) => v !== null && v > 0 && v !== ans).map((v) => num(v)), num(ans)),
    typed: { kind: 'number', value: ans },
    solution: [
      `Divide: ${ctx.money && ctx.mode === 'down' ? `£${N} = ${num(total)}p, and ` : ''}$${tnum(total)} \\div ${k} = ${q}$ remainder ${r}.`,
      ctx.mode === 'up' ? `${q} is not enough – there would be ${r} left over, so you need one more: $${q} + 1 = ${q + 1}$.`
        : ctx.mode === 'down' ? `The remainder of ${r} is not enough for another one, so round <b>down</b> to ${q}.`
          : `Each child gets ${q} sweets, using $${q} \\times ${k} = ${tnum(q * k)}$ sweets. The rest are left over: $${tnum(total)} - ${tnum(q * k)} = ${r}$.`,
      `Answer: ${num(ans)}`,
    ],
  };
}, { title: 'Division with remainders in context', word: true });

// Multi-step integer word problems. Each returns { prompt, ans, wrongs, steps, unit }.
const MULTI = [
  (rng, d) => {
    const w = int(rng, 8, 24); const dr = int(rng, 3, 10); const games = 38; const l = games - w - dr;
    const hard = d === 'hard';
    const pts = 3 * w + dr;
    return {
      prompt: `In a football league a team gets 3 points for a win, 1 point for a draw and 0 points for a loss. A team played ${games} games. It won ${w} games ${hard ? `and lost ${l} games. The rest were draws` : `and drew ${dr} games`}. How many points did the team get?`,
      ans: pts, wrongs: [w + dr, 3 * (w + dr), 3 * w, 3 * w + dr + l, 3 * w + 2 * dr],
      steps: [...(hard ? [`Draws: $${games} - ${w} - ${l} = ${dr}$`] : []), `Points from wins: $${w} \\times 3 = ${3 * w}$`, `Points from draws: $${dr} \\times 1 = ${dr}$`, `Total: $${3 * w} + ${dr} = ${pts}$ points`],
    };
  },
  (rng, d) => {
    const n = int(rng, 4, size(d, 9, 15, 15)); const c = 10 * int(rng, 28, 65); const people = d === 'hard' ? pick(rng, [4, 5, 10].filter((p) => (n * c) % p === 0)) : null;
    const total = n * c;
    if (people) {
      const each = total / people;
      return { prompt: `A club hires ${n} coaches for a trip. Each coach costs £${c} to hire. The total cost is shared equally between ${people} organisers. How much does each organiser pay?`, ans: each, money: true, wrongs: [total, c / people, (n + people) * c / 10, each * 10, each + c], steps: [`Total cost: $${n} \\times ${c} = ${tnum(total)}$ pounds`, `Share between ${people}: $${tnum(total)} \\div ${people} = ${tnum(each)}$`, `Each organiser pays £${num(each)}`] };
    }
    return { prompt: `A festival hires ${n} coaches. Each coach costs £${c} to hire. Work out the total cost of hiring the coaches.`, ans: total, money: true, wrongs: [total + c, total - c, n + c, total / 10, total + 100], steps: [`Total cost = number of coaches × cost of one coach`, `$${n} \\times ${c} = ${tnum(total)}$`, `Total: £${num(total)}`] };
  },
  (rng, d) => {
    const a = int(rng, 2, 4); const ch = int(rng, 1, 4); const pa = int(rng, 9, size(d, 15, 24, 38)); const pc = int(rng, 5, pa - 2);
    const cost = a * pa + ch * pc; const note = cost < 50 ? 50 : 100;
    if (cost >= note) throw new Error('retry');
    return { prompt: `Cinema tickets cost £${pa} for an adult and £${pc} for a child. ${pick(rng, ['Mrs Khan', 'Ms Jones', 'Ms Patel', 'Mrs Evans', 'Mrs Okafor'])} buys ${a} adult tickets and ${ch} child tickets. She pays with a £${note} note. How much change should she get?`, ans: note - cost, money: true, wrongs: [cost, note - (pa + pc), note - (a + ch) * pa, note - a * pa, note - cost + 10], steps: [`Adults: $${a} \\times ${pa} = ${a * pa}$; children: $${ch} \\times ${pc} = ${ch * pc}$`, `Total cost: $${a * pa} + ${ch * pc} = ${cost}$ pounds`, `Change: $${note} - ${cost} = ${note - cost}$`, `Change: £${note - cost}`] };
  },
  (rng, d) => {
    const r = int(rng, 11, 16); const h = int(rng, 6, 9); const dys = int(rng, 3, 6); const ot = d === 'hard' ? int(rng, 3, 8) : 0;
    const base = r * h * dys; const pay = base + ot * r * 2;
    return { prompt: `${pick(rng, ['Femi', 'Chloe', 'Ravi', 'Erin'])} is paid £${r} per hour. ${cap(pick(rng, ['she', 'he']))} works ${h} hours a day for ${dys} days${ot ? `, and also works ${ot} hours of overtime, which is paid at double the normal rate` : ''}. How much is ${pick(rng, ['the', 'the'])} pay for the week?`.replace('is the pay', 'is the total pay'), ans: pay, money: true, wrongs: [r * h + dys, r * (h + dys), base, base + ot * r, r * h * dys * 2], steps: [`Normal hours: $${h} \\times ${dys} = ${h * dys}$ hours`, `Normal pay: $${h * dys} \\times ${r} = ${tnum(base)}$ pounds`, ...(ot ? [`Overtime: ${ot} hours at $2 \\times ${r} = ${2 * r}$ pounds, so $${ot} \\times ${2 * r} = ${ot * 2 * r}$ pounds`, `Total: $${tnum(base)} + ${ot * 2 * r} = ${tnum(pay)}$`] : []), `Pay: £${num(pay)}`] };
  },
  (rng, d) => {
    const b = pick(rng, [12, 15, 18, 20, 24]); const N = b * int(rng, 4, 9) + (d === 'easy' ? 0 : int(rng, 1, b - 1)); const g = pick(rng, [150, 180, 200, 225, 250]);
    const batches = Math.ceil(N / b); const flour = batches * g;
    return { prompt: `One batch of a biscuit recipe makes ${b} biscuits and uses ${g} g of flour. Tom needs at least ${N} biscuits for a school fair. How much flour does he need, in grams?`, ans: flour, unit: 'g', wrongs: [Math.floor(N / b) * g, N * g / b > 0 && Number.isInteger(N * g / b) ? N * g / b : (batches + 1) * g, N * g, g * b, (batches + 1) * g], steps: [`Number of batches: $${N} \\div ${b} = ${tidy(N / b) === Math.floor(N / b) ? N / b : `${Math.floor(N / b)}$ remainder $${N % b}`}$${N % b ? `, so he must make ${batches} batches` : ''}`, `Flour: $${batches} \\times ${g} = ${tnum(flour)}$ g`, `Answer: ${num(flour)} g`] };
  },
  (rng, d) => {
    const cover = pick(rng, [10, 12, 15]); const area = cover * int(rng, 3, 8) + (d === 'easy' ? 0 : int(rng, 1, cover - 1)); const price = int(rng, 14, 29);
    const tins = Math.ceil(area / cover);
    return { prompt: `One tin of paint covers ${cover} m² and costs £${price}. Ella needs to paint ${area} m² of wall. Work out the cost of the paint she needs.`, ans: tins * price, money: true, wrongs: [Math.floor(area / cover) * price, area * price, (tins + 1) * price, tins + price, cover * price], steps: [`Tins needed: $${area} \\div ${cover} = ${area % cover ? `${Math.floor(area / cover)}$ remainder $${area % cover}` : area / cover}$${area % cover ? `, so she must buy ${tins} tins` : ''}`, `Cost: $${tins} \\times ${price} = ${tins * price}$`, `Answer: £${tins * price}`] };
  },
  (rng, d) => {
    const m = int(rng, 12, 45); const months = pick(rng, [12, 18, 24]); const up = d === 'easy' ? 0 : 10 * int(rng, 2, 15);
    const total = m * months + up;
    return { prompt: `A phone contract costs £${m} per month for ${months} months${up ? `, plus £${up} paid at the start` : ''}. Work out the total cost of the contract.`, ans: total, money: true, wrongs: [m * months, m + months + up, m * 12 + up, total + m, m * (months + up)], steps: [`Monthly payments: $${m} \\times ${months} = ${tnum(m * months)}$`, ...(up ? [`Add the upfront payment: $${tnum(m * months)} + ${up} = ${tnum(total)}$`] : []), `Total: £${num(total)}`] };
  },
  (rng, d) => {
    const N = int(rng, 24, 56); const p = int(rng, 12, 25); const coach = 10 * int(rng, 30, 60); const entry = d === 'hard' ? int(rng, 2, 5) : 0;
    const left = N * p - coach - entry * N;
    if (left <= 0) throw new Error('retry');
    return { prompt: `${N} students each pay £${p} for a school trip. The coach costs £${coach}${entry ? ` and entry to the museum costs £${entry} per student` : ''}. The rest of the money is spent on lunch. How much money is spent on lunch?`, ans: left, money: true, wrongs: [N * p, N * p - coach, coach - N, N * p + coach, left + entry * N === left ? left + 10 : left + entry * N], steps: [`Money collected: $${N} \\times ${p} = ${tnum(N * p)}$`, ...(entry ? [`Entry: $${N} \\times ${entry} = ${N * entry}$`] : []), `Left for lunch: $${tnum(N * p)} - ${coach}${entry ? ` - ${N * entry}` : ''} = ${tnum(left)}$`, `Answer: £${num(left)}`] };
  },
  (rng, d) => {
    const r = int(rng, 6, 15); const p = int(rng, 12, 25); const sold = int(rng, 20, r * p - 10); const dead = d === 'hard' ? int(rng, 3, 9) : 0;
    const left = r * p - sold - dead;
    return { prompt: `A garden centre plants ${r} rows of seedlings with ${p} seedlings in each row.${dead ? ` ${dead} of the seedlings die.` : ''} It sells ${sold} seedlings. How many seedlings are left?`, ans: left, wrongs: [r * p - sold + dead, r + p - sold + 100, r * p, r * p + sold, left + 10], steps: [`Seedlings planted: $${r} \\times ${p} = ${r * p}$`, `Left: $${r * p} - ${sold}${dead ? ` - ${dead}` : ''} = ${left}$`, `Answer: ${left}`] };
  },
  (rng, d) => {
    const pages = int(rng, 12, 40); const per = pick(rng, [6, 8, 9, 12]); const has = int(rng, 30, pages * per - 20); const packs = d === 'hard' ? pick(rng, [5, 6]) : 0;
    const need = pages * per - has;
    if (packs) {
      const np = Math.ceil(need / packs);
      return { prompt: `A sticker album has ${pages} pages. Each page holds ${per} stickers. Aisha has already stuck in ${has} stickers. Stickers are sold in packs of ${packs} (no two the same). What is the smallest number of packs she needs to fill the album?`, ans: np, wrongs: [Math.floor(need / packs), need, pages * per, np + 1, Math.ceil(pages * per / packs)], steps: [`Spaces: $${pages} \\times ${per} = ${pages * per}$`, `Still needed: $${pages * per} - ${has} = ${need}$`, `Packs: $${need} \\div ${packs} = ${Math.floor(need / packs)}$ remainder ${need % packs}${need % packs ? `, so round up to ${np}` : ''}`, `Answer: ${np}`] };
    }
    return { prompt: `A sticker album has ${pages} pages. Each page holds ${per} stickers. Aisha has stuck in ${has} stickers. How many more stickers does she need to fill the album?`, ans: need, wrongs: [pages * per, pages + per - has + 100, has - pages, need + per, need - per].filter((v) => v > 0), steps: [`Total spaces: $${pages} \\times ${per} = ${pages * per}$`, `Still needed: $${pages * per} - ${has} = ${need}$`, `Answer: ${need}`] };
  },
  (rng, d) => {
    const x = int(rng, 3, 12); const y = int(rng, 2, x - 1); const sum = x + y;
    const [A, B, C] = names(rng, 3);
    return { prompt: `${A} and ${B} each have some money. ${C} has no money. ${A} gives £${x} to ${C}. ${B} gives £${y} to ${C}. Now all three of them have the same amount of money. How much money did ${A} have to begin with?`, ans: sum + x, money: true, wrongs: [sum, sum + y, x, 2 * sum, sum - x + y + 1], steps: [`${C} now has $${x} + ${y} = ${sum}$ pounds.`, `They all have the same now, so ${A} has £${sum} left.`, `${A} started with $${sum} + ${x} = ${sum + x}$ pounds.`, `Answer: £${sum + x}`] };
  },
  (rng, d) => {
    const fare = int(rng, 18, 38); const days = int(rng, 3, 5); const weeks = pick(rng, [44, 45, 46, 48]); const season = 100 * Math.floor((fare * days * weeks * (0.75 + 0.15 * (d === 'hard' ? 1 : 0.5))) / 100);
    const cost = fare * days * weeks; const save = cost - season;
    return { prompt: `A return train ticket costs £${fare}. Priya travels to work ${days} days a week for ${weeks} weeks a year. A season ticket for the year costs £${num(season)}. How much does she save by buying the season ticket?`, ans: save, money: true, wrongs: [cost, season - fare * days, cost - season + fare, fare * days * 52 - season, save + 100], steps: [`Tickets per year: $${days} \\times ${weeks} = ${days * weeks}$`, `Cost of daily tickets: $${days * weeks} \\times ${fare} = ${tnum(cost)}$`, `Saving: $${tnum(cost)} - ${tnum(season)} = ${tnum(save)}$`, `Answer: £${num(save)}`] };
  },
  (rng, d) => {
    const total = 100 * int(rng, 18, 45); const dep = 100 * int(rng, 2, 6); const k = pick(rng, [4, 5, 8, 10]);
    if ((total - dep) % k) throw new Error('retry');
    const each = (total - dep) / k;
    return { prompt: `A holiday costs £${num(total)}. Sam pays a deposit of £${dep}. He pays the rest in ${k} equal monthly payments. How much is each monthly payment?`, ans: each, money: true, wrongs: [total / k, (total + dep) / k, total - dep, each - dep / k * 2, each + 10].filter((v) => Number.isInteger(v)), steps: [`Left to pay after the deposit: $${tnum(total)} - ${dep} = ${tnum(total - dep)}$`, `Split into ${k} payments: $${tnum(total - dep)} \\div ${k} = ${tnum(each)}$`, `Answer: £${num(each)}`] };
  },
];

export const wmWordMulti = gen('num-wm-word-multistep', 'num-written-methods', (rng, d) => {
  const t = MULTI[pick(rng, size(d, [1, 2, 6, 8, 9, 10], [0, 3, 4, 5, 7, 12], [0, 3, 4, 7, 9, 11, 1]))](rng, d);
  const fmt = (v) => (t.money ? money(v) : t.unit ? `${num(v)} ${t.unit}` : num(v));
  return {
    prompt: t.prompt,
    answer: fmt(t.ans),
    distractors: uniq(t.wrongs.filter((v) => Number.isFinite(v) && v > 0 && v !== t.ans && Number.isInteger(v)).map(fmt), fmt(t.ans)),
    typed: { kind: 'number', value: t.ans },
    solution: [...t.steps.slice(0, -1), `Answer: <b>${fmt(t.ans)}</b>`],
  };
}, { title: 'Multi-step word problems', word: true });

/* ================================================================== */
/* num-negatives                                                       */
/* ================================================================== */

const P = (x) => (x < 0 ? `(${tnum(x)})` : tnum(x));

export const negCalc = gen('num-neg-calc', 'num-negatives', (rng, d) => {
  let expr; let ans; let wrongs; let steps;
  const a = int(rng, 2, size(d, 12, 15, 12)); const b = int(rng, 2, size(d, 12, 12, 9));
  const type = pick(rng, size(d, ['add', 'sub', 'subneg', 'start'], ['mul', 'mulneg', 'div', 'subneg', 'divneg'], ['sq', 'cube', 'mix', 'triple', 'mix2']));
  switch (type) {
    case 'add': ans = a - b; expr = `${a} + ${P(-b)}`; wrongs = [a + b, -(a + b), b - a]; steps = ['Adding a negative number is the same as subtracting.', `$${a} + ${P(-b)} = ${a} - ${b} = ${tnum(ans)}$`]; break;
    case 'sub': ans = -a - b; expr = `-${a} - ${b}`; wrongs = [a + b, b - a, a - b]; steps = [`Start at $-${a}$ on a number line and go down ${b} more.`, `$-${a} - ${b} = ${tnum(ans)}$`]; break;
    case 'subneg': ans = -a + b; expr = `-${a} - ${P(-b)}`; wrongs = [-a - b, a + b, a - b]; steps = ['Subtracting a negative is the same as adding: $- (-' + b + ') = +' + b + '$.', `$-${a} + ${b} = ${tnum(ans)}$`]; break;
    case 'start': { const c = a + int(rng, 1, 9); ans = a - c; expr = `${a} - ${c}`; wrongs = [c - a, a + c, -(a + c)]; steps = [`${c} is bigger than ${a}, so the answer is below zero.`, `$${a} - ${c} = ${tnum(ans)}$`]; break; }
    case 'mul': ans = -a * b; expr = `${P(-a)} \\times ${b}`; wrongs = [a * b, -a - b, -a + b]; steps = ['Negative × positive = negative.', `$${a} \\times ${b} = ${a * b}$, so the answer is $${tnum(ans)}$`]; break;
    case 'mulneg': ans = a * b; expr = `${P(-a)} \\times ${P(-b)}`; wrongs = [-a * b, -a - b, a + b]; steps = ['Negative × negative = positive.', `$${a} \\times ${b} = ${a * b}$, so the answer is $${tnum(ans)}$`]; break;
    case 'div': ans = -a; expr = `${P(-a * b)} \\div ${b}`; wrongs = [a, -a * b - b, a * b * b]; steps = ['Negative ÷ positive = negative.', `$${a * b} \\div ${b} = ${a}$, so the answer is $${tnum(ans)}$`]; break;
    case 'divneg': ans = a; expr = `${P(-a * b)} \\div ${P(-b)}`; wrongs = [-a, -a * b + b, a * b * b]; steps = ['Negative ÷ negative = positive.', `$${a * b} \\div ${b} = ${a}$, so the answer is $${tnum(ans)}$`]; break;
    case 'sq': { const s = int(rng, 3, 12); ans = s * s; expr = `${P(-s)}^{2}`; wrongs = [-s * s, -2 * s, 2 * s]; steps = [`$(-${s})^{2}$ means $(-${s}) \\times (-${s})$.`, `Negative × negative = positive, so the answer is $${ans}$ (not $${-s * s}$ and not $${-2 * s}$).`]; break; }
    case 'cube': { const s = int(rng, 2, 5); ans = -(s ** 3); expr = `${P(-s)}^{3}`; wrongs = [s ** 3, -3 * s, 3 * s]; steps = [`$(-${s})^{3} = (-${s}) \\times (-${s}) \\times (-${s})$`, `$(-${s}) \\times (-${s}) = ${s * s}$, then $${s * s} \\times (-${s}) = ${ans}$`]; break; }
    case 'mix': { const c = int(rng, 2, 6); const s = int(rng, 2, 6); ans = s * s - c * -b; expr = `${P(-s)}^{2} - ${c} \\times ${P(-b)}`; wrongs = [s * s + c * -b, -s * s - c * -b, -s * s + c * -b, (s * s - c) * -b]; steps = [`Powers first: $(-${s})^{2} = ${s * s}$`, `Then multiply: $${c} \\times (-${b}) = ${-c * b}$`, `$${s * s} - (${-c * b}) = ${s * s} + ${c * b} = ${ans}$`]; break; }
    case 'triple': { const c = int(rng, 2, 5); ans = -a * -b * -c; expr = `${P(-a)} \\times ${P(-b)} \\times ${P(-c)}`; wrongs = [-ans, -a - b - c, a * b - c]; steps = [`$(-${a}) \\times (-${b}) = ${a * b}$ (two negatives make a positive)`, `$${a * b} \\times (-${c}) = ${ans}$`]; break; }
    default: { const c = int(rng, 2, 6); ans = (-a * c) / -c - b; expr = `${P(-a * c)} \\div ${P(-c)} - ${b}`; wrongs = [-a - b, a + b, -a + b]; steps = [`Divide first: $(${-a * c}) \\div (${-c}) = ${a}$ (negative ÷ negative = positive)`, `Then $${a} - ${b} = ${ans}$`]; }
  }
  return {
    prompt: `Work out $${expr}$`,
    answer: num(ans),
    distractors: uniq([...wrongs, ans + 2, ans - 2, -ans].filter((v) => v !== ans).map((v) => num(v)), num(ans)),
    typed: { kind: 'number', value: ans },
    solution: [...steps, `Answer: ${num(ans)}`],
  };
}, { title: 'Calculate with negative numbers' });

export const negOrder = gen('num-neg-order', 'num-negatives', (rng, d) => {
  const type = pick(rng, size(d, ['less', 'more', 'smallest'], ['smallest', 'largest', 'diff', 'less'], ['half', 'decimals', 'diff', 'half']));
  if (type === 'less' || type === 'more') {
    const x = -int(rng, 1, 9); const k = int(rng, 3, 12); const ans = type === 'less' ? x - k : x + k;
    return { prompt: `Which number is ${k} ${type === 'less' ? 'less' : 'more'} than $${x}$?`, answer: num(ans), distractors: uniq([-ans, x + (type === 'less' ? k : -k), -x - k, k - x, -x + k, ans + 1, ans - 1, ans + 2].filter((v) => v !== ans).map((v) => num(v)), num(ans)), typed: { kind: 'number', value: ans }, solution: [`${type === 'less' ? 'Less than means count down' : 'More than means count up'} from $${x}$ on the number line.`, `$${x} ${type === 'less' ? '-' : '+'} ${k} = ${ans}$`, `Answer: ${num(ans)}`] };
  }
  if (type === 'smallest' || type === 'largest' || type === 'decimals') {
    const dec = type === 'decimals';
    let set;
    if (dec) { const base = int(rng, 1, 6); set = [-base / 10, -(base / 10 + 0.05), -(base / 10 + 0.005), -(base + 1) / 10, (base) / 10, -(base / 100)].map(tidy); set = shuffle(rng, [...new Set(set)]).slice(0, 5); }
    else { set = []; while (set.length < 5) { const v = int(rng, -15, 10); if (!set.includes(v)) set.push(v); } if (set.every((v) => v >= 0)) set[0] = -int(rng, 2, 9); }
    const wantMin = type !== 'largest' || (dec && chance(rng));
    const ans = wantMin ? Math.min(...set) : Math.max(...set);
    const word = wantMin ? 'smallest' : 'largest';
    return { prompt: `Which of these numbers is the <b>${word}</b>?<br>$${set.map((v) => tnum(v)).join(',\\quad ')}$`, answer: num(ans), distractors: set.filter((v) => v !== ans).map((v) => num(v)), typed: { kind: 'number', value: ans }, solution: [`Imagine the numbers on a number line: the further left a number is, the smaller it is.`, `In order: $${[...set].sort((p, q) => p - q).map((v) => tnum(v)).join(',\\ ')}$`, `Answer: ${num(ans)}`] };
  }
  if (type === 'diff') {
    const lo = -int(rng, 2, 15); const hi = int(rng, 2, 15); const ans = hi - lo;
    return { prompt: `What is the difference between $${lo}$ and $${hi}$?`, answer: num(ans), distractors: uniq([hi + lo, -(hi + lo), -ans, Math.abs(hi + lo) + 1, ans + 1, ans - 1].filter((v) => v !== ans).map((v) => num(v)), num(ans)), typed: { kind: 'number', value: ans }, solution: [`Count the steps from $${lo}$ up to 0 (${-lo}) and then from 0 up to ${hi} (${hi}).`, `$${-lo} + ${hi} = ${ans}$, or $${hi} - (${lo}) = ${ans}$`, `Answer: ${num(ans)}`] };
  }
  let lo; let hi;
  do { lo = -int(rng, 3, 20); hi = int(rng, -6, 16); } while ((hi - lo) % 2 || hi - lo < 4);
  const ans = (lo + hi) / 2;
  return { prompt: `Which number is exactly halfway between $${lo}$ and $${hi}$?`, answer: num(ans), distractors: uniq([(hi - lo) / 2, -ans, ans + 1, ans - 1, (hi - lo) / 2 + lo + 1, hi - lo].filter((v) => v !== ans).map((v) => num(v)), num(ans)), typed: { kind: 'number', value: ans }, solution: [`The gap from $${lo}$ to $${hi}$ is $${hi} - (${lo}) = ${hi - lo}$.`, `Half of the gap is ${(hi - lo) / 2}. Add it to the lower number: $${lo} + ${(hi - lo) / 2} = ${ans}$`, `(Or add and halve: $(${lo} + ${hi}) \\div 2 = ${ans}$.) Answer: ${num(ans)}`] };
}, { title: 'Order and compare negative numbers' });

const NEG_CONTEXTS = [
  (rng, k) => { const s = -int(rng, 2, 9 * k); const r = int(rng, 5, 12 * k); return { p: `At 6 am the temperature in a town was $${s}^\\circ$C. By midday it had risen by $${r}^\\circ$C. What was the temperature at midday?`, a: s + r, u: '°C', w: [s - r, -s + r, -(s + r)], st: [`Rising means adding: $${s} + ${r} = ${s + r}$`] }; },
  (rng, k) => { const a = -int(rng, 3, 15 * k); const b = int(rng, 2, 14); const [c1, c2] = sample(rng, ['Moscow', 'Oslo', 'Toronto', 'Helsinki', 'Reykjavik'], 2); return { p: `On one day the temperature in ${c1} was $${a}^\\circ$C and in London it was $${b}^\\circ$C. What is the difference between the two temperatures?`.replace(c2, c2), a: b - a, u: 'degrees', w: [b + a, -(b + a), a - b], st: [`Difference = higher − lower = $${b} - (${a})$`, `$= ${b} + ${-a} = ${b - a}$`] }; },
  (rng, k) => { const f = -int(rng, 15, 22); const g = int(rng, 2, 6); return { p: `A freezer is at $${f}^\\circ$C. A fridge is at $${g}^\\circ$C. How many degrees warmer is the fridge than the freezer?`, a: g - f, u: 'degrees', w: [g + f, -(g + f), f - g], st: [`Warmer by = $${g} - (${f}) = ${g} + ${-f}$`, `$= ${g - f}$`] }; },
  (rng, k) => { const s = int(rng, 1, 8); const f = s + int(rng, 3, 10 * k); return { p: `The temperature at 9 pm was $${s}^\\circ$C. By 3 am it had fallen by ${f} degrees. What was the temperature at 3 am?`, a: s - f, u: '°C', w: [f - s, s + f, -(s + f)], st: [`Falling means subtracting: $${s} - ${f} = ${s - f}$`] }; },
  (rng, k) => { const b = int(rng, 12, 60 * k); const c = int(rng, 15, 80 * k); return { p: `Point B is ${b} metres above sea level. Point C is ${c} metres below sea level. How much higher is point B than point C?`, a: b + c, u: 'm', w: [Math.abs(b - c), c - b, -(b + c)], st: [`Below sea level is negative: C is at $-${c}$ m.`, `$${b} - (-${c}) = ${b} + ${c} = ${b + c}$`] }; },
  (rng, k) => { const dep = -int(rng, 12, 40 * k); const up = int(rng, 4, -dep - 2); return { p: `A diver is at $${dep}$ m (below the surface of the sea). She swims up ${up} m. What is her new position?`, a: dep + up, u: 'm', w: [dep - up, -dep + up, -dep - up], st: [`Swimming up means adding: $${dep} + ${up} = ${dep + up}$`] }; },
  (rng, k) => { const bal = int(rng, 20, 90 * k); const bill = bal + int(rng, 15, 120 * k); return { p: `Joe has £${bal} in his bank account. He pays a bill of £${bill} from the account. What is his balance now?`, a: bal - bill, money: true, w: [bill - bal, bal + bill, -(bal + bill)], st: [`$${bal} - ${bill} = ${bal - bill}$`, `A negative balance means the account is overdrawn.`] }; },
  (rng, k) => { const bal = -int(rng, 15, 80 * k); const dep = int(rng, 20, 150 * k); return { p: `Zara's bank balance is $-£${-bal}$ (she is overdrawn). She pays in £${dep}. What is her balance now?`.replace('$-£' + -bal + '$', `−£${-bal}`), a: bal + dep, money: true, w: [bal - dep, -bal + dep, -(bal + dep) === bal + dep ? 1 : -(bal + dep)], st: [`$${bal} + ${dep} = ${bal + dep}$`] }; },
  (rng, k) => { const s = int(rng, 1, 8); const dn = s + int(rng, 1, 3 * k); return { p: `In a shopping centre the floors are numbered …, $-2$, $-1$, 0, 1, 2, … (negative numbers are basement floors). Amy gets in the lift at floor ${s} and goes down ${dn} floors. Which floor does she get out at?`, a: s - dn, u: '', w: [dn - s, s + dn, -(s + dn)], st: [`Going down means subtracting: $${s} - ${dn} = ${s - dn}$`] }; },
  (rng, k) => { const sc = [-int(rng, 1, 5), int(rng, 1, 4), -int(rng, 1, 6), ...(k > 1 ? [int(rng, -3, 3)] : [])]; const tot = sc.reduce((x, y) => x + y, 0); return { p: `In golf, a score below par is written as a negative number. Kai's scores for ${sc.length} rounds were $${sc.map((v) => tnum(v)).join(',\\ ')}$. What is his total score?`, a: tot, u: '', w: [sc.reduce((x, y) => x + Math.abs(y), 0), -tot, tot + 2], st: [`Add the scores: $${sc.map(P).join(' + ')} = ${tot}$`] }; },
  (rng, k) => { const c = int(rng, 3, 10); const w = int(rng, 4, 12); const pc = pick(rng, [2, 3, 4]); const pw = pick(rng, [1, 2]); return { p: `In a quiz you score ${pc} points for each correct answer and lose ${pw} point${pw > 1 ? 's' : ''} for each wrong answer. Ravi gets ${c} correct and ${w} wrong. What is his total score?`, a: c * pc - w * pw, u: 'points', w: [c * pc + w * pw, c - w, (c - w) * pc], st: [`Correct: $${c} \\times ${pc} = ${c * pc}$; wrong: $${w} \\times (-${pw}) = ${-w * pw}$`, `$${c * pc} + (${-w * pw}) = ${c * pc - w * pw}$`] }; },
  (rng, k) => { const m = [int(rng, 2, 9) * 50, -int(rng, 1, 8) * 50, -int(rng, 1, 6) * 25 * k]; const tot = m.reduce((x, y) => x + y, 0); return { p: `A small business records its profit each month. A loss is written as a negative number. In three months the profits were £${m[0]}, $-£${-m[1]}$ and $-£${-m[2]}$. What was the total profit over the three months?`.replace(/\$-£(\d+)\$/g, '−£$1'), a: tot, money: true, w: [m[0] - m[1] - m[2], -tot, m[0] + m[1]], st: [`Add the three amounts: $${m[0]} + (${m[1]}) + (${m[2]}) = ${tot}$`] }; },
  (rng, k) => { const hot = int(rng, 28, 45); const cold = -int(rng, 2, 10 * k); return { p: `In a desert the temperature at midday was $${hot}^\\circ$C. At night it was $${cold}^\\circ$C. By how many degrees did the temperature fall?`, a: hot - cold, u: 'degrees', w: [hot + cold, cold - hot, -(hot + cold)], st: [`Fall = $${hot} - (${cold}) = ${hot} + ${-cold}$`, `$= ${hot - cold}$`] }; },
  (rng, k) => { let t; do { t = [int(rng, -8, 4), int(rng, -8, 4), int(rng, -8, 4), int(rng, -8, 4), int(rng, -8, 4)]; } while (t.reduce((x, y) => x + y, 0) % 5); const s = t.reduce((x, y) => x + y, 0); return { p: `The midnight temperatures in °C on five nights were $${t.map((v) => tnum(v)).join(',\\ ')}$. Work out the mean temperature.`, a: s / 5, u: '°C', w: [-s / 5, t.reduce((x, y) => x + Math.abs(y), 0) / 5, s], st: [`Add the temperatures: $${t.map(P).join(' + ')} = ${s}$`, `Divide by 5: $${s} \\div 5 = ${s / 5}$`] }; },
];

export const negContext = gen('num-neg-context', 'num-negatives', (rng, d) => {
  const k = size(d, 1, 2, 3);
  const pool = size(d, [0, 3, 5, 6, 8, 2], [1, 2, 4, 7, 9, 12, 6], [4, 7, 9, 10, 11, 13, 1]).map((i) => NEG_CONTEXTS[i]);
  const c = pick(rng, pool)(rng, k);
  const fmt = (v) => (c.money ? money(v) : c.u === '°C' ? `$${tnum(v)}^\\circ$C` : c.u ? `${num(v)} ${c.u}` : num(v));
  return {
    prompt: c.p,
    answer: fmt(c.a),
    distractors: uniq([...c.w, c.a + 1, c.a - 1, c.a + 10].filter((v) => v !== c.a && Number.isInteger(v)).map(fmt), fmt(c.a)),
    typed: { kind: 'number', value: c.a },
    solution: [...c.st, `Answer: ${fmt(c.a)}`],
  };
}, { title: 'Negative numbers in context', word: true });

/* ================================================================== */
/* num-bidmas                                                          */
/* ================================================================== */

const BIDMAS_TEMPLATES = {
  easy: [
    (r) => `${int(r, 2, 20)} + ${int(r, 2, 9)} * ${int(r, 2, 9)}`,
    (r) => `${int(r, 20, 60)} - ${int(r, 2, 6)} * ${int(r, 2, 6)}`,
    (r) => { const b = int(r, 2, 9); return `${b * int(r, 2, 12)} / ${b} + ${int(r, 2, 9)}`; },
    (r) => { const c = int(r, 2, 6); return `${int(r, 10, 40)} - ${c * int(r, 2, 6)} / ${c}`; },
    (r) => `${int(r, 2, 9)} * ${int(r, 2, 9)} - ${int(r, 2, 9)}`,
  ],
  medium: [
    (r) => `(${int(r, 2, 9)} + ${int(r, 2, 9)}) * ${int(r, 2, 6)} - ${int(r, 2, 9)}`,
    (r) => `${int(r, 2, 20)} + ${int(r, 2, 9)}^2`,
    (r) => `${int(r, 2, 6)}^2 + ${int(r, 2, 6)}^2`,
    (r) => `${int(r, 30, 90)} - ${int(r, 2, 9)} * (${int(r, 1, 5)} + ${int(r, 1, 4)})`,
    (r) => { const b = int(r, 2, 5); return `${b * b * int(r, 2, 4)} / ${b}^2 + ${int(r, 2, 9)}`; },
    (r) => `${int(r, 2, 6)} * ${int(r, 2, 9)} + ${int(r, 2, 9)} * ${int(r, 2, 6)}`,
  ],
  hard: [
    (r) => { const c = int(r, 2, 5); const d2 = int(r, 2, 4); const b = c * d2 + int(r, 1, 4); return `${int(r, 50, 150)} - (${b} - ${c} * ${d2})^2`; },
    (r) => { const c = int(r, 2, 5); const a = int(r, 3, 8); const b = c * int(r, 2, 6) - (a * a) % c; return `(${a}^2 + ${b}) / ${c} - ${int(r, 2, 9)}`; },
    (r) => `${int(r, 2, 5)}^3 - ${int(r, 2, 9)} * ${int(r, 2, 9)} + ${int(r, 2, 20)}`,
    (r) => { const e = int(r, 2, 5); return `${int(r, 2, 12)}^2 - ${e * int(r, 2, 8)} / ${e} * ${int(r, 2, 5)}`; },
    (r) => `${int(r, 2, 5)} * (${int(r, 2, 9)} - ${int(r, 2, 4)})^2 + ${int(r, 1, 20)}`,
  ],
};

export const bidmasEvaluate = gen('num-bidmas-evaluate', 'num-bidmas', (rng, d) => {
  let ex; let ans;
  for (let i = 0; ; i += 1) {
    ex = pick(rng, BIDMAS_TEMPLATES[d])(rng);
    ans = evaluate(ex);
    if (Number.isInteger(ans) && ans >= 0 && ans < 1000 && evaluate(ex, 'ltr') !== ans) break;
    if (i > 50) throw new Error('retry');
  }
  const ltr = evaluate(ex, 'ltr'); const noPow = ex.includes('^') ? evaluate(ex, 'noPow') : null;
  const noBr = ex.includes('(') ? evaluate(ex.replace(/[()]/g, '')) : null;
  return {
    prompt: `Work out $${exprTex(ex)}$`,
    answer: num(ans),
    distractors: uniq([ltr, noPow, noBr, ans + 10, ans - 1, ans + 1].filter((v) => v !== null && Number.isInteger(v) && v !== ans && v >= 0 && v <= Math.max(200, ans * 5)).map((v) => num(v)), num(ans)),
    typed: { kind: 'number', value: ans },
    solution: [
      'Use the order of operations (BIDMAS): <b>B</b>rackets, <b>I</b>ndices (powers), then <b>D</b>ivision and <b>M</b>ultiplication, then <b>A</b>ddition and <b>S</b>ubtraction.',
      ...bidmasSteps(ex),
      `Answer: ${num(ans)}${Number.isInteger(ltr) && ltr !== ans ? ` (working left to right would wrongly give ${num(ltr)})` : ''}`,
    ],
  };
}, { title: 'Evaluate using BIDMAS' });

/** Step-by-step reduction (one operation at a time) shown in TeX. */
function bidmasSteps(ex) {
  const steps = [];
  let cur = ex;
  for (let guard = 0; guard < 8; guard += 1) {
    // innermost bracket
    const inner = cur.match(/\(([^()]+)\)/);
    if (inner) {
      const val = evaluate(inner[1]);
      const next = cur.replace(inner[0], String(val));
      steps.push(`Brackets: $${exprTex(inner[1])} = ${tnum(val)}$, giving $${exprTex(next)}$`);
      cur = next;
      continue;
    }
    break;
  }
  const pw = [...cur.matchAll(/(\d+)\^(\d+)/g)];
  if (pw.length) {
    let next = cur;
    pw.forEach((m) => { next = next.replace(m[0], String(Number(m[1]) ** Number(m[2]))); });
    steps.push(`Powers: ${pw.map((m) => `$${m[1]}^{${m[2]}} = ${tnum(Number(m[1]) ** Number(m[2]))}$`).join(', ')}, giving $${exprTex(next)}$`);
    cur = next;
  }
  // multiplication/division chains
  const md = cur.match(/\d+(?:\s*[*/]\s*\d+)+/g);
  if (md && md.length && (/[+-]/.test(cur.replace(/^\s*-/, '')))) {
    let next = cur;
    md.forEach((m) => { next = next.replace(m, String(evaluate(m))); });
    steps.push(`Multiply/divide: ${md.map((m) => `$${exprTex(m)} = ${tnum(evaluate(m))}$`).join(', ')}, giving $${exprTex(next)}$`);
    cur = next;
  }
  steps.push(`Finally work from left to right: $${exprTex(cur)} = ${tnum(evaluate(cur))}$`);
  return steps.slice(-4);
}

export const bidmasBrackets = gen('num-bidmas-brackets', 'num-bidmas', (rng, d) => {
  const n = d === 'easy' ? 3 : 4;
  for (let tries = 0; tries < 60; tries += 1) {
    const nums = Array.from({ length: n }, () => int(rng, 2, d === 'hard' ? 12 : 9));
    const ops = Array.from({ length: n - 1 }, () => pick(rng, d === 'easy' ? ['+', '-', '*'] : ['+', '-', '*', '*', '/']));
    if (!ops.some((o) => o === '*' || o === '/')) continue;
    const plainEx = nums.map((v, i) => (i < n - 1 ? `${v} ${ops[i]} ` : `${v}`)).join('');
    const opts = bracketings(nums, ops);
    const vals = opts.map((o) => evaluate(o));
    const base = evaluate(plainEx);
    if (!Number.isInteger(base)) continue;
    const good = opts.map((o, i) => ({ o, v: vals[i] })).filter(({ o: oo, v }) => integerSteps(oo) && v > 0 && v !== base && vals.filter((w) => w === v).length === 1);
    if (!good.length) continue;
    const { o, v } = pick(rng, good);
    const others = opts.filter((x) => x !== o);
    if (others.length < (n === 3 ? 1 : 3)) continue;
    const shown = n === 3 ? [...others, plainEx] : others;
    return {
      prompt: `Where should one pair of brackets go to make this statement correct?<br>$${exprTex(plainEx)} = ${tnum(v)}$`,
      answer: `$${exprTex(o)} = ${tnum(v)}$`,
      distractors: shown.map((x) => `$${exprTex(x)} = ${tnum(v)}$`),
      count: Math.min(5, shown.length + 1),
      solution: [
        `Without brackets, BIDMAS gives $${exprTex(plainEx)} = ${tnum(base)}$, which is not ${num(v)}.`,
        'Try putting brackets around different parts; the brackets are worked out first.',
        `$${exprTex(o)}$: ${bidmasSteps(o).slice(-1)[0].replace('Finally work from left to right: ', '')}`.replace(/\$\$/g, '$'),
        `Answer: $${exprTex(o)} = ${tnum(v)}$`,
      ],
    };
  }
  throw new Error('retry');
}, { title: 'Insert brackets to make it true' });

export const bidmasMissing = gen('num-bidmas-missing', 'num-bidmas', (rng, d) => {
  const x = int(rng, 2, size(d, 9, 12, 15));
  const forms = size(d, ['addMul', 'mulSub', 'divAdd'], ['subMul', 'addMul', 'brMul', 'divAdd'], ['brMul', 'sqSub', 'brDiv', 'brDiv']);
  const f = pick(rng, forms);
  const B = '\\square';
  let lhs; let r; let wrongs; let steps;
  if (f === 'addMul') { const a = int(rng, 2, 20); const b = int(rng, 2, 9); r = a + b * x; lhs = `${a} + ${b} \\times ${B}`; wrongs = [r / b - a, r - a, (r - a) * b]; steps = [`Multiplication is done first, so $${b} \\times ${B}$ must equal $${r} - ${a} = ${r - a}$.`, `$${B} = ${r - a} \\div ${b} = ${x}$`]; }
  else if (f === 'mulSub') { const a = int(rng, 2, 9); const b = int(rng, 2, 15); r = a * x - b; lhs = `${a} \\times ${B} - ${b}`; wrongs = [(r - b) / a, r + b, (r + b) * a]; steps = [`$${a} \\times ${B}$ must be $${r} + ${b} = ${r + b}$.`, `$${B} = ${r + b} \\div ${a} = ${x}$`]; }
  else if (f === 'divAdd') { const b = int(rng, 2, 6); const c = int(rng, 2, 12); r = x + c; const n = x * b; lhs = `${B} \\div ${b} + ${c}`; wrongs = [r * b - c, (r + c) * b, r - c]; x !== n && (steps = [`$${B} \\div ${b}$ must be $${r} - ${c} = ${r - c}$.`, `$${B} = ${r - c} \\times ${b} = ${n}$`]); return finish(n); }
  else if (f === 'subMul') { const b = int(rng, 2, 6); const a = b * x + int(rng, 1, 30); r = a - b * x; lhs = `${a} - ${B} \\times ${b}`; wrongs = [a - r / b, (a - r) / b + 1, a - r]; steps = [`Multiplication first, so $${B} \\times ${b}$ must be $${a} - ${r} = ${a - r}$.`, `$${B} = ${a - r} \\div ${b} = ${x}$`]; }
  else if (f === 'brMul') { const a = int(rng, 1, 9); const b = int(rng, 2, 6); r = (x + a) * b; lhs = `(${B} + ${a}) \\times ${b}`; wrongs = [r / b + a, r - a * b, r - a]; steps = [`The bracket must be $${r} \\div ${b} = ${r / b}$.`, `$${B} + ${a} = ${r / b}$, so $${B} = ${x}$`]; }
  else if (f === 'sqSub') { const a = int(rng, 1, x * x - 1); r = x * x - a; lhs = `${B}^{2} - ${a}`; wrongs = [(r + a) / 2, r + a, x + 1]; steps = [`$${B}^{2}$ must be $${r} + ${a} = ${r + a}$.`, `$\\sqrt{${r + a}} = ${x}$`]; }
  else { const b = int(rng, 2, 5); const a = b * int(rng, 1, 5); const c = int(rng, 2, 9); const top = a + x * b; r = top / b + c; if (!Number.isInteger(r)) throw new Error('retry'); lhs = `(${a} + ${b} \\times ${B}) \\div ${b} + ${c}`; wrongs = [((r - c) * b - a), (r - c) * b - a + b, x + c]; steps = [`Work backwards: the division must give $${r} - ${c} = ${r - c}$, so the bracket is $${r - c} \\times ${b} = ${(r - c) * b}$.`, `$${b} \\times ${B} = ${(r - c) * b} - ${a} = ${(r - c) * b - a}$, so $${B} = ${x}$`]; }
  return finish(x);
  function finish(ansVal) {
    return {
      prompt: `Work out the missing number.<br>$${lhs} = ${tnum(r)}$`,
      answer: num(ansVal),
      distractors: uniq([...wrongs, ansVal + 1, ansVal - 1, ansVal + 2].filter((v) => Number.isInteger(v) && v > 0 && v !== ansVal).map((v) => num(v)), num(ansVal)),
      typed: { kind: 'number', value: ansVal },
      solution: [...(steps || [`$${B} \\div ${lhs.match(/div (\d+)/)[1]}$ must equal ${r} minus the number added.`, `Work backwards to get ${ansVal}.`]), `Check: put ${ansVal} in the box and use BIDMAS – you get ${num(r)} ✓`, `Answer: ${num(ansVal)}`],
    };
  }
}, { title: 'Missing number with BIDMAS' });

/* ================================================================== */
/* num-decimal-calc                                                    */
/* ================================================================== */

const dec = (rng, lo, hi, dp) => tidy(int(rng, lo * 10 ** dp, hi * 10 ** dp) / 10 ** dp);
const nz = (x, dp) => (Math.round(x * 10 ** dp) % 10 === 0 ? tidy(x + 10 ** -dp) : x);
function misalign(a, b, op) {
  const da = dpOf(a); const db = dpOf(b);
  const m = Math.max(da, db);
  const ia = Math.round(a * 10 ** da); const ib = Math.round(b * 10 ** db);
  return tidy((op === '+' ? ia + ib : ia - ib) / 10 ** m);
}

export const decAddSub = gen('num-dec-add-sub', 'num-decimal-calc', (rng, d) => {
  let ex; let ans; let wrongs;
  if (d === 'easy') {
    const a = nz(dec(rng, 1, 20, 1), 1); const b = nz(dec(rng, 1, 9, 2), 2); const sub = chance(rng, 0.4) && a > b;
    ans = tidy(sub ? a - b : a + b); ex = `${tnum(a)} ${sub ? '-' : '+'} ${tnum(b)}`;
    wrongs = [misalign(a, b, sub ? '-' : '+'), tidy(ans + 0.1), tidy(ans - 1), tidy(ans + 0.01), tidy(ans - 0.1), tidy(sub ? a + b : Math.abs(a - b))];
  } else if (d === 'medium') {
    const sub = chance(rng);
    if (sub) { const a = pick(rng, [10, 20, 5, 15, int(rng, 3, 30)]); const b = nz(dec(rng, 1, a - 0.5, 2), 2); ans = tidy(a - b); ex = `${a} - ${tnum(b)}`; wrongs = [tidy(a - 1 - Math.floor(b) + (1 - (b - Math.floor(b)))), tidy(ans + 1), tidy(ans + 0.1), tidy(Math.ceil(b) - b + a - Math.ceil(b) + 0.1), tidy(b - Math.floor(b) + a - Math.floor(b) - 1)]; }
    else { const a = nz(dec(rng, 10, 400, 1), 1); const b = nz(dec(rng, 1, 30, 2), 2); ans = tidy(a + b); ex = `${tnum(a)} + ${tnum(b)}`; wrongs = [misalign(a, b, '+'), tidy(ans + 1), tidy(ans - 0.1), tidy(ans + 10)]; }
  } else {
    const a = nz(dec(rng, 100, 400, 1), 1); const b = nz(dec(rng, 3, 30, 1), 1); const c = nz(dec(rng, 1, 9, 2), 2);
    ans = tidy(a + b - c); ex = `${tnum(a)} + ${tnum(b)} - ${tnum(c)}`;
    wrongs = [tidy(a + b + c), tidy(misalign(a + b, c, '-')), tidy(ans + 1), tidy(ans - 0.1), tidy(ans + 0.1)];
  }
  const dp = dpOf(ans);
  return {
    prompt: `Work out $${ex}$`,
    answer: num(ans),
    distractors: uniq(wrongs.filter((w) => w > 0 && w !== ans && dpOf(w) <= 3).map((w) => num(w)), num(ans)),
    typed: { kind: 'number', value: ans },
    solution: [
      'Line up the <b>decimal points</b> (not the last digits). Fill empty places with zeros.',
      ...ex.split(/ (?=[+-] )/).length > 1 ? [`$${ex} = ${tnum(ans, dp)}$`] : [],
      `Check with an estimate: roughly ${num(Math.round(ans))}.`,
      `Answer: ${num(ans)}`,
    ],
  };
}, { title: 'Add and subtract decimals' });

export const decMultiply = gen('num-dec-multiply', 'num-decimal-calc', (rng, d) => {
  let a; let b; let square = false;
  const v = d === 'easy' ? pick(rng, ['dd', 'int', 'sq']) : d === 'medium' ? pick(rng, ['one', 'one', 'sq', 'int']) : pick(rng, ['two', 'hund', 'one']);
  if (v === 'dd') { a = tidy(int(rng, 2, 9) / 10); b = tidy(int(rng, 2, 9) / 10); }
  else if (v === 'int') { a = nz(dec(rng, 1, 20, 2), 2); b = int(rng, 2, 9); }
  else if (v === 'sq') { a = pick(rng, [tidy(int(rng, 2, 9) / 10), tidy(int(rng, 11, 15) / 10)]); b = a; square = true; }
  else if (v === 'one') { a = nz(dec(rng, 1, 15, 1), 1); b = nz(dec(rng, 1, 9, 1), 1); }
  else if (v === 'two') { a = tidy(int(rng, 11, 89) / 100); b = tidy(int(rng, 2, 9) / 10); if (Math.round(a * 100) % 10 === 0) throw new Error('retry'); }
  else { a = nz(dec(rng, 10, 99, 1), 1); b = tidy(int(rng, 2, 9) / 100); }
  const ans = tidy(a * b);
  const ia = Math.round(a * 10 ** dpOf(a)); const ib = Math.round(b * 10 ** dpOf(b));
  const places = dpOf(a) + (square ? dpOf(a) : dpOf(b));
  const ex = square ? `${tnum(a)}^{2}` : `${tnum(a)} \\times ${tnum(b)}`;
  return {
    prompt: `Work out $${ex}$`,
    answer: num(ans),
    distractors: uniq([ans * 10, ans / 10, ans * 100, ans / 100, square ? a * 2 : a + b, tidy((ia * ib + 10) / 10 ** places), tidy((ia * ib - 10) / 10 ** places), ...(square ? [tidy(a * 10 * a)] : [])].map((w) => tidy(w)).filter((w) => w !== ans && dpOf(w) <= 3).map((w) => num(w)), num(ans)),
    typed: { kind: 'number', value: ans },
    solution: [
      `Ignore the decimal points and multiply: $${ia} \\times ${ib} = ${tnum(ia * ib)}$`,
      `Count the decimal places in the question: ${dpOf(a)} + ${square ? dpOf(a) : dpOf(b)} = ${places}. The answer must have ${places} decimal places.`,
      `$${tnum(ia * ib)} \\to ${tnum(ans, places).replace(/0+$/, '').replace(/\.$/, '')}$${square ? ` (note: squaring means $${tnum(a)} \\times ${tnum(a)}$, not $${tnum(a)} \\times 2$)` : ''}`,
      `Answer: ${num(ans)}`,
    ],
  };
}, { title: 'Multiply decimals' });

export const decDivide = gen('num-dec-divide', 'num-decimal-calc', (rng, d) => {
  let a; let b; let ans;
  const v = d === 'easy' ? 'byInt' : d === 'medium' ? pick(rng, ['byDec', 'byInt', 'byDec']) : pick(rng, ['byDec2', 'long', 'byDec']);
  if (v === 'byInt') { b = int(rng, 2, 9); ans = nz(dec(rng, 0.2, 12, 2), 2); a = tidy(ans * b); }
  else if (v === 'byDec') { b = tidy(int(rng, 2, 9) / 10); ans = int(rng, 3, 90); a = tidy(ans * b); if (a === Math.round(a) && a % 1 === 0 && chance(rng, 0.3)) { /* fine */ } }
  else if (v === 'byDec2') { b = tidy(int(rng, 2, 9) / 100); ans = int(rng, 3, 60); a = tidy(ans * b); }
  else { b = int(rng, 11, 16); ans = nz(dec(rng, 1, 9, 2), 2); a = tidy(ans * b); }
  const k = 10 ** dpOf(b);
  return {
    prompt: `Work out $${tnum(a)} \\div ${tnum(b)}$`,
    answer: num(ans),
    distractors: uniq([ans * 10, ans / 10, ans * 100, ans / 100, a * b].map((w) => tidy(w)).filter((w) => w !== ans && dpOf(w) <= 3).map((w) => num(w)), num(ans)),
    typed: { kind: 'number', value: ans },
    solution: k > 1 ? [
      `Make the number you divide by a whole number: multiply both numbers by ${k}.`,
      `$${tnum(a)} \\div ${tnum(b)} = ${tnum(tidy(a * k))} \\div ${tnum(tidy(b * k))}$`,
      `$${tnum(tidy(a * k))} \\div ${tnum(tidy(b * k))} = ${tnum(ans)}$`,
      `Answer: ${num(ans)}`,
    ] : [
      `Use short division, keeping the decimal point in line.`,
      `$${tnum(a)} \\div ${b} = ${tnum(ans)}$. Check: $${tnum(ans)} \\times ${b} = ${tnum(a)}$ ✓`,
      `Answer: ${num(ans)}`,
    ],
  };
}, { title: 'Divide decimals' });

export const decRelated = gen('num-dec-related-fact', 'num-decimal-calc', (rng, d) => {
  let a; let b;
  do { a = int(rng, 12, 89); b = int(rng, 12, 89); } while (a % 10 === 0 || b % 10 === 0 || a === b);
  const p = a * b;
  const s = (x, e) => tidy(x * 10 ** e);
  let q; let ans; let expl;
  const mode = d === 'easy' ? 'mul' : d === 'medium' ? pick(rng, ['mul', 'div']) : pick(rng, ['div', 'div2', 'mul']);
  if (mode === 'mul') {
    let ea; let eb;
    do { ea = int(rng, size(d, -1, -2, -2), size(d, 1, 1, 2)); eb = int(rng, size(d, -1, -2, -2), 1); } while ((ea === 0 && eb === 0) || ea + eb > 3);
    q = `${tnum(s(a, ea))} \\times ${tnum(s(b, eb))}`; ans = s(p, ea + eb);
    expl = `$${tnum(s(a, ea))}$ is $${a}$ ${ea >= 0 ? `× ${10 ** ea}` : `÷ ${10 ** -ea}`} and $${tnum(s(b, eb))}$ is $${b}$ ${eb >= 0 ? `× ${10 ** eb}` : `÷ ${10 ** -eb}`}, so the answer is ${num(p)} ${ea + eb >= 0 ? `× ${num(10 ** (ea + eb))}` : `÷ ${num(10 ** -(ea + eb))}`}.`;
  } else if (mode === 'div') {
    const k = int(rng, -2, 1);
    q = `${tnum(s(p, k))} \\div ${tnum(s(a, k))}`; ans = b;
    if (k === 0) throw new Error('retry');
    expl = `Both numbers have been ${k > 0 ? 'multiplied' : 'divided'} by the same amount, so the answer is unchanged: $${tnum(p)} \\div ${a} = ${b}$.`;
  } else {
    const k = int(rng, -2, 1); const ea = int(rng, -2, 1);
    if (k === ea) throw new Error('retry');
    q = `${tnum(s(p, k))} \\div ${tnum(s(a, ea))}`; ans = s(b, k - ea);
    expl = `$${tnum(p)} \\div ${a} = ${b}$. The first number is ${k >= 0 ? `× ${10 ** k}` : `÷ ${10 ** -k}`} and the divisor is ${ea >= 0 ? `× ${10 ** ea}` : `÷ ${10 ** -ea}`}, so the answer is $${b}$ ${k - ea >= 0 ? `× ${num(10 ** (k - ea))}` : `÷ ${num(10 ** (ea - k))}`}.`;
  }
  if (dpOf(ans) > 3) throw new Error('retry');
  return {
    prompt: `You are given that $${a} \\times ${b} = ${tnum(p)}$<br>Use this to work out $${q}$`,
    answer: num(ans),
    distractors: uniq([ans * 10, ans / 10, ans * 100, ans / 100, ans * 1000, ans / 1000, p].map(tidy).filter((w) => w !== ans && w < 1e7 && dpOf(w) <= 3).map((w) => num(w)), num(ans)),
    typed: { kind: 'number', value: ans },
    solution: [
      'The digits of the answer come from the given fact – you only need to decide where the decimal point goes.',
      expl,
      `Check with an estimate: the answer should be roughly ${num(roundSf(ans, 1))}.`,
      `Answer: ${num(ans)}`,
    ],
  };
}, { title: 'Use a given multiplication fact' });

const MONEY_DEC = [
  (rng) => { const n1 = int(rng, 2, 6); const p1 = int(rng, 18, 65); const n2 = int(rng, 2, 6); const p2 = int(rng, 15, 45); const [it1, it2] = pick(rng, [['apples', 'bananas'], ['pens', 'rubbers'], ['stamps', 'envelopes'], ['oranges', 'lemons']]); const note = 5; const cost = n1 * p1 + n2 * p2; if (cost >= 500) throw new Error('r'); return { p: `${pick(rng, ['Luke', 'Imran', 'Tom', 'Oscar'])} buys ${n1} ${it1} at ${p1}p each and ${n2} ${it2} at ${p2}p each. He pays with a £${note} note. How much change should he get?`, a: (note * 100 - cost) / 100, money: true, w: [cost / 100, (note * 100 - n1 * p1) / 100, (note * 100 - (p1 + p2)) / 100, (note * 100 - cost + 10) / 100], st: [`Cost: $${n1} \\times ${p1} + ${n2} \\times ${p2} = ${n1 * p1} + ${n2 * p2} = ${cost}$p`, `Change: $500 - ${cost} = ${500 - cost}$p`] }; },
  (rng) => { const z = int(rng, 150, 199); const f = z - int(rng, 8, 35); return { p: `The height of Zak is ${num(z / 100)} metres. The height of Fred is ${num(f / 100)} metres. How much taller is Zak than Fred? Give your answer in centimetres.`, a: z - f, u: 'cm', w: [(z - f) / 100, Math.abs(z - f * (f % 10 === 0 ? 10 : 1) / (f % 10 === 0 ? 10 : 1) - 10), z - f + 10, z - f - 10], st: [`Convert to centimetres: ${num(z / 100)} m = ${z} cm and ${num(f / 100)} m = ${f} cm`, `$${z} - ${f} = ${z - f}$`] }; },
  (rng) => { const pr = tidy(int(rng, 135, 165) / 100); const l = pick(rng, [20, 30, 40, 25, 32]); return { p: `Petrol costs £${num(pr, 2)} per litre. Sofia buys ${l} litres. How much does she pay?`, a: tidy(pr * l), money: true, w: [tidy(pr * l / 10), tidy(pr + l), tidy(pr * (l + 1)), tidy(pr * l + 1)], st: [`Cost = price per litre × number of litres`, `$${tnum(pr)} \\times ${l} = ${tnum(tidy(pr * l))}$`] }; },
  (rng) => { const m = tidy(int(rng, 120, 290) / 100); const n = pick(rng, [3, 4, 5, 6]); return { p: `Ribbon costs £${num(m, 2)} per metre. Jo buys ${n} metres of ribbon. How much does she pay?`, a: tidy(m * n), money: true, w: [tidy(m * n / 10), tidy(m + n), tidy(m * (n - 1)), tidy(m * n + 0.1)], st: [`$${tnum(m)} \\times ${n} = ${tnum(tidy(m * n))}$`] }; },
  (rng) => { const k = pick(rng, [3, 4, 5, 6]); const each = tidy(int(rng, 850, 3200) / 100 / 1); const tot = tidy(Math.round(each * 100) * k / 100); return { p: `A restaurant bill comes to £${num(tot, 2)}. ${k} friends share the bill equally. How much does each friend pay?`, a: tidy(Math.round(each * 100) / 100), money: true, w: [tidy(tot / (k + 1)), tidy(tot - k), tidy(each * 10), tidy(each + 1)], st: [`Divide the bill by ${k}`, `$${tnum(tot)} \\div ${k} = ${tnum(each)}$`] }; },
  (rng) => { const n = pick(rng, [4, 6, 8, 5]); const each = int(rng, 18, 65); const tot = n * each; return { p: `A pack of ${n} yoghurts costs £${num(tot / 100, 2)}. How much does one yoghurt cost?`, a: each / 100, money: true, w: [each / 10, tot / 1000, Math.round(tot / (n + 1)) / 100, (each + 5) / 100], st: [`Work in pence: £${num(tot / 100, 2)} = ${tot}p`, `$${tot} \\div ${n} = ${each}$, so one yoghurt costs ${each}p`] }; },
  (rng) => { const r = [dec(rng, 2, 6, 2), dec(rng, 2, 6, 1), dec(rng, 1, 5, 2)].map((v) => nz(v, dpOf(v) || 1)); const tot = tidy(r[0] + r[1] + r[2]); return { p: `Maya runs ${num(r[0])} km on Monday, ${num(r[1])} km on Tuesday and ${num(r[2])} km on Wednesday. How far does she run altogether?`, a: tot, u: 'km', w: [misalign(misalign(r[0], r[1], '+'), r[2], '+'), tidy(tot + 1), tidy(tot - 0.1), tidy(tot + 0.01)], st: [`Line up the decimal points and add: $${tnum(r[0])} + ${tnum(r[1])} + ${tnum(r[2])}$`, `$= ${tnum(tot)}$`] }; },
  (rng) => { const w = [dec(rng, 0.5, 2, 2), dec(rng, 0.3, 1.5, 1), dec(rng, 0.2, 1, 2)].map((v) => nz(v, 1)); const lim = pick(rng, [5, 6, 8]); const tot = tidy(w[0] + w[1] + w[2]); return { p: `A box can hold at most ${lim} kg. Dev puts three parcels in it weighing ${num(w[0])} kg, ${num(w[1])} kg and ${num(w[2])} kg. How many more kilograms can the box hold?`, a: tidy(lim - tot), u: 'kg', w: [tot, tidy(lim - w[0] - w[1]), tidy(lim - tot + 1), tidy(lim - misalign(misalign(w[0], w[1], '+'), w[2], '+'))], st: [`Total so far: $${tnum(w[0])} + ${tnum(w[1])} + ${tnum(w[2])} = ${tnum(tot)}$ kg`, `Space left: $${lim} - ${tnum(tot)} = ${tnum(tidy(lim - tot))}$`] }; },
  (rng) => { const g = pick(rng, [0.25, 0.2, 0.3, 0.15]); const n = int(rng, 4, 12); const b = tidy(g * n); return { p: `A jug holds ${num(b)} litres of juice. Each glass holds ${num(g)} litres. How many glasses can be filled from the jug?`, a: n, u: '', w: [n * 10, tidy(b * g * 100), Math.round(n / 10) || n + 1, n + 1, n - 1], st: [`$${tnum(b)} \\div ${tnum(g)}$ — multiply both by 100: $${tnum(b * 100)} \\div ${tnum(g * 100)}$`, `$= ${n}$`] }; },
  (rng) => { const c = int(rng, 8, 15); const f = int(rng, 20, 55); const m = int(rng, 6, 25); const tot = f + c * m; return { p: `A phone call costs ${f}p to connect, plus ${c}p for each minute. How much does a ${m}-minute call cost?`, a: tot / 100, money: true, w: [(c * m) / 100, (f + c) * m / 100, tot / 10, (tot + c) / 100], st: [`Minutes: $${m} \\times ${c} = ${c * m}$p`, `Add the connection charge: $${c * m} + ${f} = ${tot}$p = £${num(tot / 100, 2)}`] }; },
  (rng) => { const L = pick(rng, [2.4, 3, 2.5, 1.8, 3.2]); const pc = pick(rng, [0.35, 0.45, 0.25, 0.3, 0.4]); const n = Math.floor(L / pc) - int(rng, 0, 2); const left = tidy(L - n * pc); if (left <= 0) throw new Error('r'); return { p: `A plank of wood is ${num(L)} m long. ${pick(rng, ['Ben', 'Hannah', 'Oscar'])} cuts ${n} pieces from it, each ${num(pc)} m long. How much of the plank is left?`, a: left, u: 'm', w: [tidy(n * pc), tidy(L - pc), tidy(left + pc), tidy(L - n * pc * 10 > 0 ? L - n * pc * 10 : left + 0.1)], st: [`Length cut off: $${n} \\times ${tnum(pc)} = ${tnum(tidy(n * pc))}$ m`, `Left: $${tnum(L)} - ${tnum(tidy(n * pc))} = ${tnum(left)}$ m`] }; },
  (rng) => { const daily = tidy(int(rng, 620, 980) / 100); const wk = tidy(Math.floor(daily * 5 * 0.85 * 10) / 10 - pick(rng, [0.5, 0.05, 0.25])); const save = tidy(daily * 5 - wk); return { p: `A daily bus ticket costs £${num(daily, 2)}. A weekly ticket costs ${money(wk)}. Chen travels by bus 5 days a week. How much does she save each week by buying the weekly ticket?`, a: save, money: true, w: [tidy(daily * 5), tidy(daily * 7 - wk), tidy(wk - daily), tidy(save + 1)], st: [`Five daily tickets: $5 \\times ${tnum(daily)} = ${tnum(tidy(daily * 5))}$`, `Saving: $${tnum(tidy(daily * 5))} - ${tnum(wk)} = ${tnum(save)}$`] }; },
  (rng) => { const items = [['bread', int(rng, 95, 160)], ['milk', int(rng, 85, 145)], ['cheese', int(rng, 210, 340)]]; const tot = items.reduce((s, [, p]) => s + p, 0); const paid = 10; return { p: `Mia buys a loaf of bread for £${num(items[0][1] / 100, 2)}, milk for £${num(items[1][1] / 100, 2)} and cheese for £${num(items[2][1] / 100, 2)}. She pays with a £${paid} note. How much change does she get?`, a: tidy((paid * 100 - tot) / 100), money: true, w: [tot / 100, tidy((paid * 100 - tot + 100) / 100), tidy((paid * 100 - tot - 10) / 100), tidy((paid * 100 - items[0][1] - items[1][1]) / 100)], st: [`Total: $${items.map(([, p]) => tnum(p / 100, 2)).join(' + ')} = ${tnum(tot / 100, 2)}$`, `Change: $10 - ${tnum(tot / 100, 2)} = ${tnum((paid * 100 - tot) / 100, 2)}$`] }; },
];

export const decWord = gen('num-dec-word', 'num-decimal-calc', (rng, d) => {
  const pool = size(d, [2, 3, 4, 5, 6, 8], [0, 1, 6, 7, 9, 12], [0, 7, 9, 10, 11, 12]).map((i) => MONEY_DEC[i]);
  const c = pick(rng, pool)(rng);
  const fmt = (v) => (c.money ? money(v, { forcePence: true }) : c.u ? `${num(v)} ${c.u}` : num(v));
  const a = tidy(c.a);
  return {
    prompt: c.p,
    answer: fmt(a),
    distractors: uniq(c.w.map(tidy).filter((v) => v > 0 && v !== a && dpOf(v) <= (c.money ? 2 : 3)).map(fmt), fmt(a)),
    typed: { kind: 'number', value: a },
    solution: [...c.st, `Answer: ${fmt(a)}`],
  };
}, { title: 'Decimal word problems', word: true });

/* ================================================================== */
/* num-calculator                                                      */
/* ================================================================== */

const CALC_EXPR = [
  (r) => { const a = dec(r, 2, 20, 1); const b = dec(r, 1, 15, 1); const c = dec(r, 3, 9, 1); const e = dec(r, 0.5, 2.5, 1); return { tex: `\\dfrac{${tnum(a)} + ${tnum(b)}}{${tnum(c)} - ${tnum(e)}}`, v: (a + b) / (c - e), w: [a + b / (c - e), (a + b) / c - e, a + b / c - e], how: [`Work out the top: $${tnum(a)} + ${tnum(b)} = ${tnum(tidy(a + b))}$`, `Work out the bottom: $${tnum(c)} - ${tnum(e)} = ${tnum(tidy(c - e))}$`, `Divide: $${tnum(tidy(a + b))} \\div ${tnum(tidy(c - e))}$`] }; },
  (r) => { const a = dec(r, 2, 9, 1); const b = int(r, 10, 90); const c = dec(r, 1.2, 4, 1); return { tex: `\\dfrac{${tnum(a)}^{2} + \\sqrt{${b}}}{${tnum(c)}}`, v: (a * a + Math.sqrt(b)) / c, w: [a * a + Math.sqrt(b) / c, (2 * a + Math.sqrt(b)) / c, (a * a + b / 2) / c], how: [`$${tnum(a)}^{2} = ${tnum(tidy(a * a))}$ and $\\sqrt{${b}} = ${tnum(roundTo(Math.sqrt(b), 4))}\\ldots$`, `Add them, then divide the whole top by ${tnum(c)}.`, `Use brackets on your calculator: (${tnum(a)}² + √${b}) ÷ ${tnum(c)}`] }; },
  (r) => { const a = dec(r, 3, 15, 1); const b = dec(r, 2, 9, 2); const c = dec(r, 1, 6, 1); const e = dec(r, 1, 3, 1); return { tex: `\\dfrac{${tnum(a)} \\times ${tnum(b)}}{${tnum(c)} + ${tnum(e)}^{2}}`, v: (a * b) / (c + e * e), w: [(a * b) / c + e * e, (a * b) / (c + 2 * e), (a * b) / ((c + e) ** 2)], how: [`Top: $${tnum(a)} \\times ${tnum(b)} = ${tnum(tidy(a * b))}$`, `Bottom: $${tnum(c)} + ${tnum(e)}^{2} = ${tnum(c)} + ${tnum(tidy(e * e))} = ${tnum(tidy(c + e * e))}$`, `Divide: $${tnum(tidy(a * b))} \\div ${tnum(tidy(c + e * e))}$`] }; },
  (r) => { const a = dec(r, 10, 60, 1); const b = dec(r, 2, 8, 1); return { tex: `\\sqrt{${tnum(a)} - ${tnum(b)}}`, v: Math.sqrt(a - b), w: [Math.sqrt(a) - b, (a - b) / 2, Math.sqrt(a) - Math.sqrt(b)], how: [`Work out inside the square root first: $${tnum(a)} - ${tnum(b)} = ${tnum(tidy(a - b))}$`, `Then square root: $\\sqrt{${tnum(tidy(a - b))}}$`] }; },
  (r) => { const a = dec(r, 1.5, 4, 1); const b = int(r, 20, 99); const c = dec(r, 2, 9, 1); return { tex: `${tnum(a)}^{3} - \\dfrac{\\sqrt{${b}}}{${tnum(c)}}`, v: a ** 3 - Math.sqrt(b) / c, w: [3 * a - Math.sqrt(b) / c, (a ** 3 - Math.sqrt(b)) / c, a ** 3 - Math.sqrt(b / c) + 0.5], how: [`$${tnum(a)}^{3} = ${tnum(tidy(a ** 3))}$`, `$\\sqrt{${b}} \\div ${tnum(c)} = ${tnum(roundTo(Math.sqrt(b) / c, 4))}\\ldots$`, `Subtract.`] }; },
  (r) => { const a = dec(r, 4, 12, 1); const b = dec(r, 2, 8, 1); const c = dec(r, 1.1, 2.5, 2); return { tex: `\\dfrac{(${tnum(a)} + ${tnum(b)})^{2}}{${tnum(c)}}`, v: (a + b) ** 2 / c, w: [(a * a + b * b) / c, (a + b) * 2 / c, a + b ** 2 / c], how: [`Bracket first: $${tnum(a)} + ${tnum(b)} = ${tnum(tidy(a + b))}$`, `Square it: $${tnum(tidy(a + b))}^{2} = ${tnum(tidy((a + b) ** 2))}$`, `Divide by $${tnum(c)}$`] }; },
];

export const calcEvaluate = gen('num-calc-evaluate', 'num-calculator', (rng, d) => {
  const e = pick(rng, CALC_EXPR)(rng);
  const mode = size(d, { dp: 1, label: '1 decimal place' }, { dp: 2, label: '2 decimal places' }, pick(rng, [{ sf: 3, label: '3 significant figures' }, { dp: 3, label: '3 decimal places' }]));
  const rd = (x) => (mode.sf ? roundSf(x, mode.sf) : roundTo(x, mode.dp));
  const v = rd(e.v);
  if (!Number.isFinite(v) || v <= 0 || e.v > 5000) throw new Error('retry');
  const dps = mode.sf ? Math.max(0, mode.sf - 1 - Math.floor(Math.log10(Math.abs(v)))) : mode.dp;
  const show = (x) => num(x, mode.sf ? Math.max(0, mode.sf - 1 - Math.floor(Math.log10(Math.abs(x)))) : dps);
  const trunc = Math.trunc(e.v * 10 ** dps) / 10 ** dps;
  return {
    prompt: `Use your calculator to work out<br>$$${e.tex}$$Give your answer to ${mode.label}.`.replace('$$', '$\\displaystyle ').replace('$$', '$<br>').replace('$<br>Give', '$<br>Give'),
    answer: show(v),
    distractors: uniq([...e.w.filter((x) => Number.isFinite(x) && x > 0).map((x) => show(rd(x))), show(trunc), show(tidy(v + 10 ** -dps)), show(tidy(v - 10 ** -dps))], show(v)),
    typed: { kind: 'number', value: v, tolerance: 0.5 * 10 ** -dps },
    calculator: true,
    longDecimalsOk: true,
    solution: [
      ...e.how,
      `Calculator display: $${tnum(roundTo(e.v, 6))}\\ldots$`,
      `Rounded to ${mode.label}: <b>${show(v)}</b>`,
    ],
  };
}, { title: 'Evaluate with a calculator' });

export const calcPowersRoots = gen('num-calc-powers-roots', 'num-calculator', (rng, d) => {
  const v = size(d, pick(rng, ['sqrt', 'sq', 'cube']), pick(rng, ['sqrtSub', 'cbrt', 'sqDec', 'cubeDec']), pick(rng, ['pyth', 'mix', 'cbrtDec', 'pow']));
  let tex; let ans; let wrongs; let steps;
  if (v === 'sqrt') { const k = int(rng, 21, 39); tex = `\\sqrt{${tnum(k * k)}}`; ans = k; wrongs = [k * k / 2, k * k / 4, k + 1, k * 2]; steps = [`Press √ then ${k * k}.`, `Check: $${k} \\times ${k} = ${tnum(k * k)}$ ✓`]; }
  else if (v === 'sq') { const a = int(rng, 13, 49); tex = `${a}^{2}`; ans = a * a; wrongs = [2 * a, a * a + a, a * 20, a * a - 10]; steps = [`$${a}^{2} = ${a} \\times ${a}$ (not $${a} \\times 2$)`, `$= ${tnum(a * a)}$`]; }
  else if (v === 'cube') { const a = int(rng, 6, 19); tex = `${a}^{3}`; ans = a ** 3; wrongs = [3 * a, a * a, a ** 3 + a, a * a * 2]; steps = [`$${a}^{3} = ${a} \\times ${a} \\times ${a}$`, `$= ${tnum(a ** 3)}$`]; }
  else if (v === 'sqrtSub') { const k = int(rng, 21, 39); const c = k + int(rng, 3, 40); tex = `${c} - \\sqrt{${tnum(k * k)}}`; ans = c - k; wrongs = [c - k * k / 2, Math.round(Math.sqrt(Math.abs(c - k * k))) || c + k, c + k, c - k + 1]; steps = [`$\\sqrt{${tnum(k * k)}} = ${k}$`, `$${c} - ${k} = ${c - k}$`]; }
  else if (v === 'cbrt') { const k = int(rng, 6, 15); const c = int(rng, 2, 9); tex = `\\sqrt[3]{${tnum(k ** 3)}} + ${c}^{2}`; ans = k + c * c; wrongs = [k ** 3 / 3 + c * c, k + 2 * c, Math.round(Math.sqrt(k ** 3)) + c * c, k * k + c * c]; steps = [`$\\sqrt[3]{${tnum(k ** 3)}} = ${k}$ because $${k}^{3} = ${tnum(k ** 3)}$`, `$${c}^{2} = ${c * c}$`, `$${k} + ${c * c} = ${ans}$`]; }
  else if (v === 'sqDec') { const a = nz(dec(rng, 1.1, 9.9, 1), 1); tex = `${tnum(a)}^{2}`; ans = tidy(a * a); wrongs = [2 * a, a * a * 10, a * a / 10, tidy(a * a + 0.1)]; steps = [`$${tnum(a)}^{2} = ${tnum(a)} \\times ${tnum(a)}$`, `$= ${tnum(ans)}$`]; }
  else if (v === 'cubeDec') { const a = nz(dec(rng, 1.1, 4.9, 1), 1); tex = `${tnum(a)}^{3}`; ans = tidy(a ** 3); wrongs = [3 * a, a * a, a ** 3 * 10, tidy(a ** 3 + 1)]; steps = [`$${tnum(a)}^{3} = ${tnum(a)} \\times ${tnum(a)} \\times ${tnum(a)}$`, `$= ${tnum(ans)}$`]; }
  else if (v === 'pyth') { const [p, q, rr] = pick(rng, [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [6, 8, 10]]); const s = pick(rng, [0.1, 0.2, 0.3, 0.4, 0.6, 0.5, 1.2]); const a = tidy(p * s); const b = tidy(q * s); tex = `\\sqrt{${tnum(a)}^{2} + ${tnum(b)}^{2}}`; ans = tidy(rr * s); wrongs = [tidy(a + b), tidy(a * a + b * b), tidy(Math.sqrt(a * a) + b * b), tidy(2 * a + 2 * b)]; steps = [`$${tnum(a)}^{2} = ${tnum(tidy(a * a))}$ and $${tnum(b)}^{2} = ${tnum(tidy(b * b))}$`, `Add: $${tnum(tidy(a * a + b * b))}$`, `Square root: $\\sqrt{${tnum(tidy(a * a + b * b))}} = ${tnum(ans)}$`]; }
  else if (v === 'mix') { const k = int(rng, 12, 30); const a = nz(dec(rng, 1.1, 3.9, 1), 1); tex = `\\dfrac{\\sqrt{${tnum(k * k)}}}{${tnum(a)}^{2}}`; ans = roundTo(k / (a * a), 2); if (Math.abs(ans - k / (a * a)) > 1e-9) throw new Error('retry'); wrongs = [k / (2 * a), k * k / (a * a) / 10, k / a, ans * 10]; steps = [`$\\sqrt{${tnum(k * k)}} = ${k}$ and $${tnum(a)}^{2} = ${tnum(tidy(a * a))}$`, `$${k} \\div ${tnum(tidy(a * a))} = ${tnum(ans)}$`]; }
  else if (v === 'cbrtDec') { const k = pick(rng, [0.2, 0.3, 0.4, 0.5, 0.6, 1.2, 1.5, 2.5]); tex = `\\sqrt[3]{${tnum(tidy(k ** 3))}}`; ans = k; wrongs = [tidy(k ** 3 / 3), tidy(k * 10), tidy(k / 10), tidy(k * k)]; steps = [`Use the cube root key: $\\sqrt[3]{${tnum(tidy(k ** 3))}}$`, `Check: $${tnum(k)}^{3} = ${tnum(tidy(k ** 3))}$ ✓`]; }
  else { const b = pick(rng, [1.5, 2.5, 1.2, 0.5, 3.5, 0.4]); tex = `${tnum(b)}^{3} + ${tnum(b)}^{2}`; ans = tidy(b ** 3 + b ** 2); wrongs = [tidy(3 * b + 2 * b), tidy(b ** 5), tidy(b ** 3 * b ** 2), tidy(b ** 3 + 2 * b)]; steps = [`Powers first: $${tnum(b)}^{3} = ${tnum(tidy(b ** 3))}$ and $${tnum(b)}^{2} = ${tnum(tidy(b ** 2))}$`, `Add: $${tnum(tidy(b ** 3))} + ${tnum(tidy(b ** 2))} = ${tnum(ans)}$`]; }
  return {
    prompt: `Work out the value of $${tex}$`,
    answer: num(ans),
    distractors: uniq([...wrongs, ans + 1, ans - 1, ans * 10].map(tidy).filter((w) => w > 0 && w !== ans && dpOf(w) <= 3).map((w) => num(w)), num(ans)),
    typed: { kind: 'number', value: ans },
    calculator: true,
    solution: [...steps, `Answer: ${num(ans)}`],
  };
}, { title: 'Powers and roots on a calculator' });

const INTERPRET = [
  (rng) => { const s = pick(rng, [40, 48, 60, 64, 80, 72]); const t = pick(rng, [1.25, 1.75, 2.25, 2.5, 3.75, 1.5, 2.75, 0.75]); const dist = tidy(s * t); return { p: `A car travels ${num(dist)} km at an average speed of ${s} km/h. Ella works out $${tnum(dist)} \\div ${s}$ on her calculator and gets ${num(t)}. How long does the journey take?`, hours: t }; },
  (rng) => { const t = pick(rng, [1.2, 2.4, 3.6, 1.8, 0.4, 4.2, 2.6]); const rate = pick(rng, [5, 10, 15, 20, 25]); return { p: `A machine makes ${rate} items per hour. It needs to make ${num(tidy(rate * t))} items. The calculator shows $${tnum(tidy(rate * t))} \\div ${rate} = ${tnum(t)}$. How long does the machine take?`, hours: t }; },
  (rng) => { const t = pick(rng, [0.75, 0.6, 0.45, 0.3, 0.9, 0.15]); return { p: `Kai's calculator says a task will take ${num(t)} hours. How long is this?`, hours: t }; },
  (rng) => { const k = pick(rng, [4, 6, 8, 5]); const each = pick(rng, [4.5, 6.2, 3.8, 12.4, 7.6, 9.3, 5.1]); return { p: `${k} friends share a bill of ${money(tidy(each * k), { forcePence: true })} equally. Amir divides on his calculator and the display shows ${num(each)}. How much should each friend pay?`, money: each }; },
  (rng) => { const each = pick(rng, [0.4, 0.6, 0.8, 0.5, 0.3, 0.7]); const k = pick(rng, [5, 6, 8, 12]); return { p: `A pack of ${k} pens costs £${num(tidy(each * k), 2)}. Lena divides on her calculator and the display shows ${num(each)}. What is the cost of one pen?`, money: each }; },
  (rng) => { const t = pick(rng, [2.1, 3.3, 1.9, 2.15, 1.35, 3.45]); return { p: `Training for a race, Noah's calculator shows that he ran for a total of ${num(t)} hours. Write this time in hours and minutes.`, hours: t }; },
];

export const calcInterpret = gen('num-calc-interpret', 'num-calculator', (rng, d) => {
  const c = INTERPRET[pick(rng, size(d, [3, 4, 0], [0, 1, 3], [1, 2, 5]))](rng);
  if (c.hours !== undefined) {
    const h = Math.floor(c.hours); const m = Math.round((c.hours - h) * 60);
    const decPart = Math.round((c.hours - h) * 100);
    const fmt = (hh, mm) => (hh ? `${hh} hour${hh === 1 ? '' : 's'} ${mm} minutes` : `${mm} minutes`);
    const ans = fmt(h, m);
    const wrongs = [fmt(h, decPart), fmt(h, Math.round(decPart / 10)), fmt(h, decPart % 10 === 0 ? decPart / 10 * 6 + 1 : decPart * 6 % 60), fmt(h + 1, m), fmt(h, 60 - m), fmt(h, Math.round(decPart * 0.6) === m ? m + 5 : Math.round(decPart * 0.6))];
    return {
      prompt: c.p,
      answer: ans,
      distractors: uniq(wrongs, ans),
      calculator: true,
      solution: [
        `The calculator gives the time in <b>hours</b> as a decimal. ${num(c.hours)} hours is ${h ? `${h} hour${h === 1 ? '' : 's'} and ` : ''}${num(tidy(c.hours - h))} of an hour.`,
        `There are 60 minutes in an hour: $${tnum(tidy(c.hours - h))} \\times 60 = ${m}$ minutes.`,
        `Don't read the decimal part as minutes – ${num(tidy(c.hours - h))} hours is not ${decPart} minutes.`,
        `Answer: ${ans}`,
      ],
    };
  }
  const ans = money(c.money, { forcePence: true });
  const p = Math.round(c.money * 100);
  return {
    prompt: c.p,
    answer: ans,
    distractors: uniq([money(c.money * 10), `£${Math.floor(c.money)}.0${Math.round((c.money % 1) * 10)}`, money(tidy(c.money * 100)), money(tidy(c.money / 10), { forcePence: true }), money(tidy(c.money + 0.05), { forcePence: true })], ans),
    calculator: true,
    solution: [
      'For money, the calculator display is in pounds, and pounds always have <b>two</b> decimal places.',
      `${num(c.money)} pounds means £${num(Math.floor(c.money))} and ${p % 100} pence.`,
      `Answer: ${ans}`,
    ],
  };
}, { title: 'Interpret a calculator display' });

/* ================================================================== */
/* num-product-rule                                                    */
/* ================================================================== */

const CHOICE_CONTEXTS = [
  { items: ['starters', 'main courses', 'desserts'], make: (c) => `A restaurant menu has ${c[0]} starters${c[2] ? `, ${c[1]} main courses and ${c[2]} desserts` : ` and ${c[1]} main courses`}. A meal is one ${c[2] ? 'starter, one main course and one dessert' : 'starter and one main course'}. How many different meals are possible?` },
  { items: ['faces', 'bodies', 'hairstyles'], make: (c) => `In a computer game you build a character by choosing from ${c[0]} faces${c[2] ? `, ${c[1]} bodies and ${c[2]} hairstyles` : ` and ${c[1]} bodies`}. How many different characters can be made?` },
  { items: ['shirts', 'pairs of trousers', 'pairs of shoes'], make: (c) => `Sam has ${c[0]} shirts${c[2] ? `, ${c[1]} pairs of trousers and ${c[2]} pairs of shoes` : ` and ${c[1]} pairs of trousers`}. An outfit is one of each. How many different outfits can he choose?` },
  { items: ['breads', 'fillings', 'sauces'], make: (c) => `A sandwich shop offers ${c[0]} types of bread${c[2] ? `, ${c[1]} fillings and ${c[2]} sauces` : ` and ${c[1]} fillings`}. A sandwich uses one of each. How many different sandwiches are possible?` },
  { items: ['bases', 'sauces', 'toppings'], make: (c) => `A pizza is made by choosing one of ${c[0]} bases${c[2] ? `, one of ${c[1]} sauces and one of ${c[2]} toppings` : ` and one of ${c[1]} toppings`}. How many different pizzas can be made?` },
  { items: ['colours', 'engines', 'wheel designs'], make: (c) => `A new car can be ordered in ${c[0]} colours${c[2] ? `, with ${c[1]} engine sizes and ${c[2]} wheel designs` : ` with ${c[1]} engine sizes`}. How many different versions of the car can be ordered?` },
  { items: ['roads from A to B', 'roads from B to C', 'roads from C to D'], make: (c) => `There are ${c[0]} roads from town A to town B${c[2] ? `, ${c[1]} roads from B to C and ${c[2]} roads from C to D` : ` and ${c[1]} roads from B to C`}. How many different routes are there from A to ${c[2] ? 'D' : 'C'} through ${c[2] ? 'B and C' : 'B'}?` },
  { items: ['cones', 'flavours', 'toppings'], make: (c) => `An ice cream van offers ${c[0]} types of cone${c[2] ? `, ${c[1]} flavours and ${c[2]} toppings` : ` and ${c[1]} flavours`}. Each ice cream has one of each. How many different ice creams are possible?` },
  { items: ['hotels', 'flights', 'excursions'], make: (c) => `A holiday company offers ${c[0]} hotels${c[2] ? `, ${c[1]} flight times and ${c[2]} excursions` : ` and ${c[1]} flight times`}. A package is one of each. How many different packages are there?` },
  { items: ['case colours', 'patterns', 'straps'], make: (c) => `A phone case comes in ${c[0]} colours${c[2] ? `, ${c[1]} patterns and ${c[2]} straps` : ` and ${c[1]} patterns`}. How many different phone cases are possible?` },
  { items: ['art options', 'science options', 'language options'], make: (c) => `For Year 10, students choose one of ${c[0]} art subjects${c[2] ? `, one of ${c[1]} science subjects and one of ${c[2]} languages` : ` and one of ${c[1]} science subjects`}. How many different combinations of subjects are possible?` },
  { items: ['drinks', 'snacks', 'fruits'], make: (c) => `A meal deal is one drink${c[2] ? ', one snack and one piece of fruit' : ' and one snack'}. There are ${c[0]} drinks${c[2] ? `, ${c[1]} snacks and ${c[2]} fruits` : ` and ${c[1]} snacks`} to choose from. How many different meal deals are there?` },
  { items: ['frames', 'lens types', 'colours'], make: (c) => `An optician sells ${c[0]} frame styles${c[2] ? `, ${c[1]} lens types and ${c[2]} frame colours` : ` and ${c[1]} lens types`}. How many different pairs of glasses can be made?` },
];

export const prodChoices = gen('num-prod-choices', 'num-product-rule', (rng, d) => {
  const ctx = pick(rng, CHOICE_CONTEXTS);
  const three = d !== 'easy';
  const c = [int(rng, 2, 9), int(rng, 2, 8), three ? int(rng, 2, 7) : 0];
  const total = c[0] * c[1] * (three ? c[2] : 1);
  if (d === 'hard') {
    // reverse: total known, find the third number
    const prompt = ctx.make([c[0], c[1], '<i>n</i>']).replace(/How many.*$/, `There are ${num(total)} different possibilities altogether. Work out <i>n</i>.`);
    return {
      prompt,
      answer: num(c[2]),
      distractors: uniq([total - c[0] - c[1], total / c[0], total / c[1], c[2] + 1, c[2] - 1, total - c[0] * c[1]].filter((v) => Number.isInteger(v) && v > 0).map((v) => num(v)), num(c[2])),
      typed: { kind: 'number', value: c[2] },
      solution: [
        'Product rule: the number of possibilities is found by <b>multiplying</b> the number of choices for each part.',
        `$${c[0]} \\times ${c[1]} \\times n = ${tnum(total)}$, so $${c[0] * c[1]}n = ${tnum(total)}$`,
        `$n = ${tnum(total)} \\div ${c[0] * c[1]} = ${c[2]}$`,
        `Answer: ${c[2]}`,
      ],
    };
  }
  return {
    prompt: ctx.make(c),
    answer: num(total),
    distractors: uniq((three ? [c[0] + c[1] + c[2], c[0] * c[1], c[0] * c[1] + c[2], total * 2, c[0] * c[1] + c[1] * c[2] + c[0] * c[2], c[0] * c[2]] : [c[0] + c[1], c[0] * c[1] * 2, (c[0] + 1) * c[1], c[0] * (c[1] + 1), c[0] * c[1] - 1, c[0] * c[1] + 1]).map((v) => num(v)), num(total)),
    typed: { kind: 'number', value: total },
    solution: [
      'Product rule: when you make one choice from each group, <b>multiply</b> the numbers of choices.',
      `Each of the ${c[0]} first choices can go with each of the ${c[1]} second choices${three ? `, and each of those with any of the ${c[2]} third choices` : ''}.`,
      `$${c.filter(Boolean).join(' \\times ')} = ${tnum(total)}$`,
      `Answer: ${num(total)}`,
    ],
  };
}, { title: 'Product rule: choices from groups', word: true });

const PRIMES = [2, 3, 5, 7];
const FACTORS16 = [1, 2, 4, 8];
const RULES = [
  { text: 'a prime number', set: PRIMES }, { text: 'a factor of 12', set: [1, 2, 3, 4, 6] }, { text: 'less than 4', set: [0, 1, 2, 3] },
  { text: 'a factor of 16', set: FACTORS16 }, { text: 'an odd number', set: [1, 3, 5, 7, 9] }, { text: 'an even number', set: [0, 2, 4, 6, 8] },
  { text: 'a factor of 6', set: [1, 2, 3, 6] }, { text: 'greater than 5', set: [6, 7, 8, 9] },
];

export const prodCodes = gen('num-prod-codes', 'num-product-rule', (rng, d) => {
  const v = size(d, pick(rng, ['all', 'fixed']), pick(rng, ['fixed', 'rules', 'letters']), pick(rng, ['norep', 'rules', 'norepEven']));
  let prompt; let factors; let wrongs = []; let explain;
  if (v === 'all') {
    const n = pick(rng, [3, 4]); factors = Array(n).fill(10);
    prompt = `A padlock has a ${n}-digit code. Each digit can be any digit from 0 to 9 and digits can repeat. How many different codes are possible?`;
    wrongs = [10 * n, 9 ** n, 10 ** (n - 1), 4 * 10 ** (n - 1), 10 * 9 * 8 * (n === 4 ? 7 : 1)];
    explain = `Each of the ${n} digits has 10 choices.`;
  } else if (v === 'fixed') {
    const first = int(rng, 1, 9); const par = pick(rng, ['even', 'odd']); const n = pick(rng, [3, 4]);
    factors = [1, ...Array(n - 2).fill(10), 5];
    prompt = `A ${n}-digit code is ${par === 'even' ? 'an even' : 'an odd'} number. The first digit is ${first}. Digits can repeat. How many possible codes are there?`;
    wrongs = [10 ** (n - 1), 10 ** (n - 2) * 4, 10 ** (n - 2) * 6, 9 * 10 ** (n - 2) * 5, 10 ** (n - 2) + 5];
    explain = `The first digit has 1 choice (${first}). The middle digit${n > 3 ? 's each have' : ' has'} 10 choices. The last digit must be ${par} (${par === 'even' ? '0, 2, 4, 6, 8' : '1, 3, 5, 7, 9'}): 5 choices.`;
  } else if (v === 'letters') {
    const nl = pick(rng, [1, 2]); const nd = pick(rng, [2, 3]);
    factors = [...Array(nl).fill(26), ...Array(nd).fill(10)];
    prompt = `A password is ${nl === 1 ? 'one capital letter' : 'two capital letters'} followed by ${nd} digits. Letters and digits can repeat. How many different passwords are possible?`;
    wrongs = [26 * nl + 10 * nd, 26 ** nl + 10 ** nd, 36 ** (nl + nd) > 1e9 ? 26 * 10 * nd : 36 ** (nl + nd), 26 * 10 ** nd, 26 ** nl * 9 ** nd];
    explain = `Each letter has 26 choices and each digit has 10 choices.`;
  } else if (v === 'rules') {
    const rs = sample(rng, RULES, 3);
    factors = rs.map((r) => r.set.length);
    prompt = `Liam is trying to remember a 3-digit code. He knows that<br>• the first digit is ${rs[0].text}<br>• the second digit is ${rs[1].text}<br>• the third digit is ${rs[2].text}.<br>How many different codes could it be?`;
    wrongs = [factors[0] + factors[1] + factors[2], 1000, factors[0] * factors[1], (factors[0] + 1) * factors[1] * factors[2], factors[0] * (factors[1] - 1) * factors[2]];
    explain = rs.map((r) => `${r.text}: ${r.set.join(', ')} (${r.set.length} choices)`).join('; ') + '.';
  } else if (v === 'norep') {
    const n = pick(rng, [3, 4]); const pool = pick(rng, [10, 9, 6, 5, 8]);
    factors = Array.from({ length: n }, (_, i) => pool - i);
    const desc = pool === 10 ? 'the digits 0 to 9' : pool === 9 ? 'the digits 1 to 9' : `the ${pool} letters ${'ABCDEFGHIJ'.slice(0, pool).split('').join(', ')}`;
    prompt = `A ${n}-character code is made using ${desc}. No ${pool >= 9 ? 'digit' : 'letter'} can be used more than once. How many different codes are possible?`;
    wrongs = [pool ** n, pool * n, factors.reduce((a, b) => a + b, 0), factors.reduce((a, b) => a * b, 1) / n, (pool - 1) ** n];
    explain = `The first ${pool >= 9 ? 'digit' : 'letter'} has ${pool} choices, the next has ${pool - 1} (one has been used), and so on.`;
  } else {
    factors = [8, 7, 4]; // first, middle, last (last digit must be 2, 4, 6 or 8)
    prompt = 'A 3-digit code uses only the digits 1 to 9. The code must be an even number and no digit can be used more than once. How many codes are possible?';
    wrongs = [9 * 8 * 7, 9 * 9 * 4, 9 * 8 * 4, 4 * 4 * 4, 8 * 7 * 5];
    explain = 'Start with the restricted digit: the last digit must be 2, 4, 6 or 8 (4 choices). Then the first digit has 8 choices left and the middle digit has 7.';
  }
  const total = factors.reduce((a, b) => a * b, 1);
  return {
    prompt,
    answer: num(total),
    distractors: uniq(wrongs.filter((w) => Number.isInteger(w) && w > 0 && w !== total).map((v) => num(v)), num(total)),
    typed: { kind: 'number', value: total },
    solution: [
      'Use the product rule: multiply the number of choices for each position.',
      explain,
      `$${factors.join(' \\times ')} = ${tnum(total)}$`,
      `Answer: ${num(total)}`,
    ],
  };
}, { title: 'Counting codes and passwords' });

const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));
const LISTING = [
  { kind: 'perm', make: (n, it) => `${it.who} puts ${n} songs on shuffle, so they play in a random order without repeats. In how many different orders can the ${n} songs play?` },
  { kind: 'perm', make: (n) => `${n} runners take part in a race. There are no ties. In how many different orders can they finish?` },
  { kind: 'perm', make: (n) => `How many different ${n}-digit numbers can be made using each of the cards ${[1, 3, 5, 7, 9].slice(0, n).join(', ')} exactly once?` },
  { kind: 'perm', make: (n) => `${n} friends stand in a line for a photo. How many different ways can they line up?` },
  { kind: 'pairs', make: (n) => `There are ${n} players in a chess club. Every player plays every other player once. How many games are played?` },
  { kind: 'pairs', make: (n) => `${n} people meet at a party. Everyone shakes hands with everyone else once. How many handshakes are there?` },
  { kind: 'pairs', make: (n) => `There are ${n} cards numbered 1 to ${n}. Two cards are chosen at the same time. How many different pairs of cards are possible?` },
  { kind: 'pairs', make: (n) => `A teacher picks two different students from a group of ${n} to be class reps. How many different pairs could she choose?` },
  { kind: 'multi', make: (n) => `An ice cream has two scoops. There are ${n} flavours to choose from. The two scoops can be the same flavour or different flavours, and the order does not matter. How many different ice creams are possible?` },
  { kind: 'multi', make: (n) => `A box of chocolates has ${n} types of chocolate. Ben takes two chocolates; they can be the same type or different types. How many different combinations of types can he take?` },
  { kind: 'ordered', make: (n) => `A club with ${n} members chooses a captain and a vice-captain. They must be different people. How many different ways can this be done?` },
  { kind: 'ordered', make: (n) => `${n} horses run in a race. How many different ways can the first and second places be filled? (There are no ties.)` },
  { kind: 'ordered', make: (n) => `How many different 2-digit numbers can be made from the digits ${[2, 3, 4, 5, 6, 7, 8].slice(0, n).join(', ')} if no digit is used twice?` },
  { kind: 'pairs', make: (n) => `In a football group of ${n} teams, each team plays every other team once. How many matches are played?` },
];

export const prodListing = gen('num-prod-listing', 'num-product-rule', (rng, d) => {
  const pool = d === 'easy' ? LISTING.filter((c) => c.kind !== 'perm' || true) : LISTING;
  const ctx = pick(rng, pool);
  const n = ctx.kind === 'perm' ? size(d, 3, pick(rng, [3, 4]), pick(rng, [4, 5])) : size(d, int(rng, 3, 5), int(rng, 4, 7), int(rng, 6, 12));
  const nn = ctx.kind === 'ordered' && ctx.make(2).includes('digits') ? Math.min(n, 7) : n;
  let ans; let steps;
  if (ctx.kind === 'perm') { ans = fact(nn); steps = [`The first place can be any of ${nn}, the next any of the ${nn - 1} left, and so on.`, `$${Array.from({ length: nn }, (_, i) => nn - i).join(' \\times ')} = ${ans}$`]; }
  else if (ctx.kind === 'pairs') { ans = (nn * (nn - 1)) / 2; steps = [`Each of the ${nn} can be paired with ${nn - 1} others: $${nn} \\times ${nn - 1} = ${nn * (nn - 1)}$.`, `But that counts every pair twice (A with B and B with A), so halve it: $${nn * (nn - 1)} \\div 2 = ${ans}$.`]; }
  else if (ctx.kind === 'multi') { ans = (nn * (nn + 1)) / 2; steps = [`Pairs of different types: $${nn} \\times ${nn - 1} \\div 2 = ${(nn * (nn - 1)) / 2}$ (halve because order does not matter).`, `Plus ${nn} pairs where both are the same type: $${(nn * (nn - 1)) / 2} + ${nn} = ${ans}$.`]; }
  else { ans = nn * (nn - 1); steps = [`First choice: ${nn} options. Second choice: ${nn - 1} options (it must be different).`, `Here the order matters, so don't halve: $${nn} \\times ${nn - 1} = ${ans}$.`]; }
  const wrongs = [nn * nn, nn * (nn - 1), (nn * (nn - 1)) / 2, (nn * (nn + 1)) / 2, fact(Math.min(nn, 7)), 2 * nn, nn * (nn - 1) * (nn - 2)].filter((v) => v !== ans);
  return {
    prompt: ctx.make(nn, { who: pick(rng, ['Ruth', 'Ted', 'Isla', 'Yusuf']) }),
    answer: num(ans),
    distractors: uniq(wrongs.filter((v) => v > 0).map((v) => num(v)), num(ans)),
    typed: { kind: 'number', value: ans },
    solution: [...steps, 'You could also check by listing them systematically.', `Answer: ${num(ans)}`],
  };
}, { title: 'Counting arrangements and pairs', word: true });

export const generators = [
  pvDigitValue, pvWords, pvCompare, pvTimesTen, pvNumberLine,
  wmAddSub, wmMultiply, wmDivide, wmWordDivide, wmWordMulti,
  negCalc, negOrder, negContext,
  bidmasEvaluate, bidmasBrackets, bidmasMissing,
  decAddSub, decMultiply, decDivide, decRelated, decWord,
  calcEvaluate, calcPowersRoots, calcInterpret,
  prodChoices, prodCodes, prodListing,
];
