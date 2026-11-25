// Percentages unit: percentages of amounts, increase/decrease, expressing as a percentage, simple interest,
// percentage change, reverse percentages, compound interest / growth / decay.
import {
  pick, int, chance, size, names, num, tnum, tidy, roundTo, cap, shuffle,
} from '../../core.js';
import {
  withUnit, gbp, gbpF, pct, dvals, pvals, hasDp, rgen as gen,
} from './helpers.js';

const P = (v) => `${num(v)}\\%`; // percentage inside TeX
/** Multiplier for a p% increase (sign +1) or decrease (sign −1), tidy. */
const mult = (p, s = 1) => tidy(1 + (s * p) / 100);

/* Split a percentage into "building blocks" that can be found without a calculator. */
function blocks(p) {
  const out = [];
  let r = p;
  if (r >= 50) { out.push(50); r -= 50; }
  if (r >= 25 && r < 30) { out.push(25); r -= 25; }
  while (r >= 10) { out.push(10); r -= 10; }
  if (r >= 5) { out.push(5); r -= 5; }
  if (r >= 2.5 && r < 3) { out.push(2.5); r = tidy(r - 2.5); }
  while (r >= 1) { out.push(1); r = tidy(r - 1); }
  if (r >= 0.5) { out.push(0.5); r = tidy(r - 0.5); }
  if (r > 1e-9) throw new Error(`blocks ${p}`);
  return out;
}
const BLOCK_HOW = { 50: 'halve it', 25: 'divide by 4', 10: 'divide by 10', 5: 'half of 10%', 2.5: 'half of 5%', 1: 'divide by 100', 0.5: 'half of 1%' };
/** Solution steps for p% of A by building blocks. fmt formats a value. */
function blockSteps(p, A, fmt) {
  const bl = blocks(p);
  const uniq = [...new Set(bl)];
  const val = (b) => tidy((A * b) / 100);
  const steps = uniq.map((b) => `${num(b)}% of ${fmt(A)} $=$ ${fmt(val(b))} (${BLOCK_HOW[b]})`);
  if (bl.length > 1) {
    const counts = uniq.map((b) => [b, bl.filter((x) => x === b).length]);
    const expr = counts.map(([b, c]) => (c > 1 ? `${c} \\times ${tnum(val(b))}` : tnum(val(b)))).join(' + ');
    steps.push(`${num(p)}% $= ${counts.map(([b, c]) => (c > 1 ? `${c} \\times ${num(b)}\\%` : `${num(b)}\\%`)).join(' + ')}$, so ${num(p)}% of ${fmt(A)} $= ${expr} = ${tnum(val(p))}$`);
  }
  return steps;
}

/* ================================================================== */
/* rat-percent-of                                                      */
/* ================================================================== */

export const percentOfNoCalc = gen('rat-percent-of-noncalc', 'rat-percent-of', (rng, d) => {
  for (let i = 0; i < 200; i += 1) {
    const p = pick(rng, size(d, [10, 20, 25, 50, 75, 5, 30, 1], [15, 35, 45, 65, 85, 12, 55, 95, 2, 40, 60], [17.5, 12.5, 2.5, 32.5, 0.5, 7.5, 115, 120, 150, 26, 99]));
    const A = size(d, int(rng, 2, 30) * 20, int(rng, 2, 40) * 20, int(rng, 4, 60) * 40);
    const ans = tidy((A * p) / 100);
    if (!hasDp(ans, 2) || ans === A) continue;
    let bl; try { bl = blocks(p > 100 ? p - 100 : p); } catch { continue; }
    if (!bl.every((b) => hasDp((A * b) / 100, 2))) continue;
    const unit = pick(rng, ['', '', '£', 'kg', 'm', 'ml']);
    const fmt = unit === '£' ? (v) => `£${num(v, hasDp(v, 0) ? null : 2)}` : unit ? withUnit(unit) : (v) => num(v);
    const steps = p > 100
      ? [`${num(p)}% $= 100\\% + ${num(p - 100)}\\%$.`, ...blockSteps(p - 100, A, fmt), `So ${num(p)}% of ${fmt(A)} $= ${tnum(A)} + ${tnum(tidy(A * (p - 100) / 100))} = ${tnum(ans)}$`]
      : blockSteps(p, A, fmt);
    return {
      prompt: pick(rng, [`Work out ${num(p)}% of ${fmt(A)}.`, `What is ${num(p)}% of ${fmt(A)}?`, `Without a calculator, find ${num(p)}% of ${fmt(A)}.`]),
      answer: fmt(ans),
      distractors: dvals(ans, [A / p, (A * p) / 10, ans * 10, A - ans, (A / 10) * Math.floor(p / 10) + (p % 10), ans / 10, A + p, ans + A / 100, p > 100 ? (A * (p - 100)) / 100 : null], fmt, { dp: 2 }),
      typed: { kind: 'number', value: ans },
      solution: [...steps, `Answer: ${fmt(ans)}`],
    };
  }
  throw new Error('pct of');
}, { title: 'Percentage of an amount without a calculator (10%, 5%, 1% blocks)' });

export const percentOfCalc = gen('rat-percent-of-calc', 'rat-percent-of', (rng, d) => {
  for (let i = 0; i < 300; i += 1) {
    const p = pick(rng, size(d, [13, 37, 23, 62, 48, 17, 71, 84], [4.5, 17.5, 8.5, 33, 112, 3.2, 67], [0.6, 2.75, 112.5, 4.2, 18.5, 0.35, 135]));
    const money = chance(rng, 0.5);
    if (money) {
      const Ap = int(rng, size(d, 20, 50, 200), size(d, 200, 2000, 9000)) * 10; // pence
      const ansP = (Ap * p) / 100;
      if (!Number.isInteger(ansP)) continue;
      return {
        prompt: `Work out ${num(p)}% of ${gbpF(Ap)}.`,
        answer: gbpF(ansP),
        distractors: pvals(ansP, [Ap * p, ansP * 10, Ap - ansP, Ap + ansP, ansP / 10, Ap / p]).map((t) => t.replace(/^£(\d[\d,]*)$/, '£$1.00')),
        typed: { kind: 'number', value: ansP / 100 },
        calculator: true,
        solution: [
          `${num(p)}% means ${num(p)} out of 100, so multiply by $${tnum(p / 100)}$.`,
          `$${tnum(Ap / 100, 2)} \\times ${tnum(p / 100)} = ${tnum(ansP / 100, 2)}$`,
          `Answer: ${gbpF(ansP)}`,
        ],
        longDecimalsOk: true,
      };
    }
    const A = int(rng, 12, size(d, 300, 900, 5000)) * pick(rng, [1, 5, 10]);
    const ans = tidy((A * p) / 100);
    if (!hasDp(ans, 2)) continue;
    const unit = pick(rng, ['kg', 'm', 'litres', 'g', 'km', '']);
    const fmt = unit ? withUnit(unit) : (v) => num(v);
    return {
      prompt: `Work out ${num(p)}% of ${fmt(A)}.`,
      answer: fmt(ans),
      distractors: dvals(ans, [A * p, ans * 10, A - ans, A + ans, ans / 10, roundTo(A / p, 2), roundTo(A * (1 + p / 100), 2)], fmt, { dp: 2 }),
      typed: { kind: 'number', value: ans },
      calculator: true,
      solution: [
        `${num(p)}% $= \\frac{${num(p)}}{100} = ${tnum(p / 100)}$`,
        `$${tnum(A)} \\times ${tnum(p / 100)} = ${tnum(ans)}$`,
        `Answer: ${fmt(ans)}`,
      ],
      longDecimalsOk: true,
    };
  }
  throw new Error('pct calc');
}, { title: 'Percentage of an amount with a calculator' });

// Word contexts: each returns { prompt, A (whole), p, want: 'part'|'rest', unit kind }.
const PCT_OF_CTX = [
  { u: 'count', t: (A, p, w) => `${num(A)} people were asked if they eat sushi. ${num(p)}% said yes. How many people said ${w === 'part' ? 'yes' : 'no'}?` },
  { u: 'count', t: (A, p, w) => `A school has ${num(A)} pupils. ${num(p)}% of them walk to school. How many pupils ${w === 'part' ? 'walk' : 'do not walk'} to school?` },
  { u: 'money', t: (A, p, w) => `A holiday costs ${gbp(A)}. ${w === 'part' ? `A deposit of ${num(p)}% must be paid when booking. How much is the deposit?` : `A deposit of ${num(p)}% is paid when booking. How much is left to pay after the deposit?`}` },
  { u: 'count', t: (A, p, w) => `${num(A)} gamers were asked which type of game they prefer. ${num(p)}% chose racing games. How many gamers ${w === 'part' ? 'chose racing games' : 'did not choose racing games'}?` },
  { u: 'count', t: (A, p, w) => `A test has ${A} questions. Isla gets ${num(p)}% of them right. How many questions does she get ${w === 'part' ? 'right' : 'wrong'}?`, small: true },
  { u: 'count', t: (A, p, w) => `A car park has ${num(A)} spaces. ${num(p)}% of the spaces are for electric cars. How many spaces are ${w === 'part' ? 'for electric cars' : 'not for electric cars'}?` },
  { u: 'g', t: (A, p, w) => `A box of cereal contains ${num(A)} g. ${num(p)}% of the cereal is sugar. How many grams of ${w === 'part' ? 'sugar are' : 'the cereal are not sugar'} in the box?`.replace('grams of the cereal are not sugar in the box', 'grams of the cereal are not sugar') },
  { u: 'money', t: (A, p, w) => `Ravi earns ${gbp(A)} a month. He spends ${num(p)}% of it on rent. How much ${w === 'part' ? 'does he spend on rent' : 'does he have left after paying the rent'}?` },
  { u: 'count', t: (A, p, w) => `${num(A)} dog owners took part in a survey. ${num(p)}% walk their dog twice a day. How many ${w === 'part' ? 'walk their dog twice a day' : 'do not'}?` },
  { u: 'm²', t: (A, p, w) => `A garden has an area of ${num(A)} m². ${num(p)}% of the garden is lawn. What area ${w === 'part' ? 'is lawn' : 'is not lawn'}?` },
  { u: 'GB', t: (A, p, w) => `A phone has ${num(A)} GB of storage. ${num(p)}% of it has been used. How much storage ${w === 'part' ? 'has been used' : 'is still free'}?` },
  { u: 'count', t: (A, p, w) => `An orchard has ${num(A)} fruit trees. ${num(p)}% of them are pear trees. How many ${w === 'part' ? 'pear trees are there' : 'trees are not pear trees'}?` },
  { u: 'count', t: (A, p, w) => `A football stadium holds ${num(A)} fans. At one match ${num(p)}% of the seats were empty. How many seats ${w === 'part' ? 'were empty' : 'were filled'}?` },
  { u: 'ml', t: (A, p, w) => `A ${num(A)} ml bottle of fruit drink contains ${num(p)}% real juice. How many millilitres of ${w === 'part' ? 'real juice are' : 'the drink are not real juice'} in the bottle?` },
  { u: 'count', t: (A, p, w) => `A bakery made ${num(A)} loaves on Saturday. ${num(p)}% were wholemeal. How many ${w === 'part' ? 'wholemeal loaves were made' : 'loaves were not wholemeal'}?` },
];
// "the rest" contexts with two given percentages
const PCT_REST_CTX = [
  (A, p1, p2) => `${num(A)} gamers were asked which type of video game they prefer. ${num(p1)}% said action, ${num(p2)}% said role-playing and the rest said sports. How many said sports?`,
  (A, p1, p2) => `${num(A)} students voted for a school trip. ${num(p1)}% chose a theme park, ${num(p2)}% chose the seaside and the rest chose a museum. How many chose the museum?`,
  (A, p1, p2) => `A farm has ${num(A)} animals. ${num(p1)}% are sheep, ${num(p2)}% are cows and the rest are pigs. How many pigs are there?`,
];

export const percentOfWord = gen('rat-percent-of-word', 'rat-percent-of', (rng, d) => {
  for (let i = 0; i < 200; i += 1) {
    if (d !== 'easy' && chance(rng, 0.2)) {
      const A = pick(rng, [200, 300, 400, 500, 600, 800, 1200, 250, 150, 360]);
      const p1 = int(rng, 6, 12) * 5; const p2 = int(rng, 2, 8) * 5 - pick(rng, [0, 1, 3]);
      if (p1 + p2 >= 95) continue;
      const rest = 100 - p1 - p2;
      const ans = (A * rest) / 100;
      if (!Number.isInteger(ans)) continue;
      return {
        prompt: pick(rng, PCT_REST_CTX)(A, p1, p2),
        answer: num(ans),
        distractors: dvals(ans, [(A * p1) / 100, (A * p2) / 100, rest, A - (A * p1) / 100, ((A * (p1 + p2)) / 100), (A * (100 - p1)) / 100], (v) => num(v), { dp: 0 }),
        typed: { kind: 'number', value: ans },
        solution: [`The percentages add up to 100%, so the rest is $100 - ${p1} - ${p2} = ${rest}\\%$.`, `${rest}% of ${num(A)} $= ${tnum(A)} \\times ${tnum(rest / 100)} = ${tnum(ans)}$`, `Answer: ${num(ans)}`],
      };
    }
    const tpl = pick(rng, PCT_OF_CTX);
    const p = pick(rng, size(d, [10, 20, 25, 50, 75, 30, 40, 60, 5], [15, 35, 45, 65, 12, 8, 85, 55, 6, 24], [12.5, 17.5, 2.5, 37.5, 4, 32, 68, 7.5, 92]));
    let A;
    if (tpl.u === 'money') A = int(rng, 4, size(d, 40, 60, 99)) * size(d, 50, 50, 25) * 100;
    else if (tpl.small) A = pick(rng, [20, 40, 50, 60, 80, 25, 30, 120]);
    else A = int(rng, 2, size(d, 30, 60, 200)) * pick(rng, [10, 20, 40, 50]);
    const want = chance(rng, d === 'easy' ? 0.3 : 0.45) ? 'rest' : 'part';
    const part = (A * p) / 100;
    const ans = want === 'part' ? part : A - part;
    if (!Number.isInteger(tpl.u === 'money' ? ans : ans) || ans <= 0) continue;
    if (tpl.u !== 'money' && !Number.isInteger(part)) continue;
    if (tpl.u === 'money' && !Number.isInteger(part)) continue;
    const fmt = tpl.u === 'money' ? gbp : tpl.u === 'count' ? (v) => num(v) : withUnit(tpl.u);
    const other = want === 'part' ? A - part : part;
    const vals = [other, A / p * (tpl.u === 'money' ? 100 : 1), part * 10, A * p / 10, A + part, p * (tpl.u === 'money' ? 100 : 1), (A * (100 - p)) / 1000];
    return {
      prompt: tpl.t(A, p, want),
      answer: fmt(ans),
      distractors: tpl.u === 'money' ? pvals(ans, vals) : dvals(ans, vals, fmt, { dp: 0 }),
      typed: { kind: 'number', value: tpl.u === 'money' ? ans / 100 : ans },
      calculator: d === 'hard',
      solution: [
        d === 'hard' ? `${num(p)}% of ${fmt(A)} $= ${tnum(tpl.u === 'money' ? A / 100 : A)} \\times ${tnum(p / 100)} =$ ${fmt(part)}` : `${num(p)}% of ${fmt(A)}: ${blockSteps(p, tpl.u === 'money' ? A / 100 : A, tpl.u === 'money' ? (v) => `£${num(v, hasDp(v, 0) ? null : 2)}` : (v) => num(v)).join('; ')}.`.replace(/\$=\$ (\S+) \(/g, '$= $1$ ('),
        ...(want === 'rest' ? [`The question asks for the rest: ${fmt(A)} $-$ ${fmt(part)} $=$ ${fmt(ans)} (or find ${100 - p}% directly).`] : []),
        `Answer: ${fmt(ans)}`,
      ],
    };
  }
  throw new Error('pct word');
}, { title: 'Percentage of an amount in context', word: true });

export const percentFromKnown = gen('rat-percent-from-known', 'rat-percent-of', (rng, d) => {
  for (let i = 0; i < 200; i += 1) {
    const type = size(d, 'ten', pick(rng, ['ten', 'other']), pick(rng, ['other', 'one']));
    const A = int(rng, 11, 99) * size(d, 10, 10, 1) * (d === 'hard' ? 10 : 1);
    if (type === 'ten') {
      const q = pick(rng, [20, 30, 40, 5, 15, 45, 35, 43, 21, 32, 61]);
      const ten = A / 10; const ans = tidy((A * q) / 100);
      if (!hasDp(ans, 2) || !hasDp(ten, 2)) continue;
      return {
        prompt: `10% of ${num(A)} is ${num(ten)}. Work out ${q}% of ${num(A)}.`,
        answer: num(ans),
        distractors: dvals(ans, [ten * q, ten + q, ten * Math.floor(q / 10) + (q % 10), ans * 10, ten * (q / 10 + 1), A - ans], (v) => num(v)),
        typed: { kind: 'number', value: ans },
        solution: [
          `10% is ${num(ten)}, so 1% is $${tnum(ten)} \\div 10 = ${tnum(ten / 10)}$ and 5% is half of 10%, $${tnum(ten / 2)}$.`,
          ...blockSteps(q, A, (v) => num(v)).slice(-1),
          `Answer: ${num(ans)}`,
        ],
      };
    }
    if (type === 'other') {
      const [p1, p2] = pick(rng, [[15, 45], [20, 60], [12, 36], [25, 75], [30, 90], [15, 60], [35, 70], [40, 20], [60, 15], [45, 15], [24, 8]]);
      const base = int(rng, 4, 40) * 20;
      const known = (base * p1) / 100; const ans = (base * p2) / 100;
      if (!Number.isInteger(known) || !Number.isInteger(ans)) continue;
      const f = p2 / p1;
      return {
        prompt: `${p1}% of a number is ${num(known)}. What is ${p2}% of the same number?`,
        answer: num(ans),
        distractors: dvals(ans, [base, known + (p2 - p1), (known * p1) / p2, known * p2 / 10, base - known, known * 2], (v) => num(v), { dp: 2 }),
        typed: { kind: 'number', value: ans },
        solution: [
          `${p2}% is ${f >= 1 ? `${num(f)} times` : `$\\frac{1}{${num(1 / f)}}$ of`} ${p1}% (because $${p2} ${f >= 1 ? '\\div' : '\\div'} ${p1} = ${tnum(roundTo(f, 3))}$).`,
          `$${tnum(known)} \\times ${f >= 1 ? tnum(f) : `\\frac{1}{${num(1 / f)}}`} = ${tnum(ans)}$`,
          `(Check: the number is $${tnum(known)} \\div ${tnum(p1 / 100)} = ${tnum(base)}$, and ${p2}% of ${num(base)} is ${num(ans)}.)`,
          `Answer: ${num(ans)}`,
        ],
      };
    }
    // one: 1% of x is k -> q%
    const k = int(rng, 2, 90) / 10;
    const q = pick(rng, [23, 37, 46, 15, 64, 12, 7]);
    const ans = tidy(k * q);
    return {
      prompt: `1% of an amount is ${num(k)}. What is ${q}% of the amount?`,
      answer: num(ans),
      distractors: dvals(ans, [k + q, ans / 10, ans * 10, k * 100, tidy(k * (q + 1)), tidy(k * 100 - ans)], (v) => num(v), { dp: 2 }),
      typed: { kind: 'number', value: ans },
      solution: [`${q}% is ${q} lots of 1%.`, `$${q} \\times ${tnum(k)} = ${tnum(ans)}$`, `Answer: ${num(ans)}`],
    };
  }
  throw new Error('known');
}, { title: 'Use a known percentage to find another' });

/* ================================================================== */
/* rat-percent-increase                                                */
/* ================================================================== */

export const incDecNoCalc = gen('rat-pct-inc-dec-noncalc', 'rat-percent-increase', (rng, d) => {
  for (let i = 0; i < 200; i += 1) {
    const p = pick(rng, size(d, [10, 20, 50, 25, 5, 30], [15, 35, 5, 45, 12, 60, 2], [17.5, 12.5, 2.5, 7.5, 32, 85, 1.5]));
    const up = chance(rng, 0.5);
    const money = chance(rng, 0.55);
    const A = money ? int(rng, 3, size(d, 30, 60, 99)) * 20 : int(rng, 2, size(d, 30, 60, 120)) * 20;
    const change = tidy((A * p) / 100);
    if (!hasDp(change, 2)) continue;
    const ans = tidy(up ? A + change : A - change);
    const fmt = money ? (v) => `£${num(v, hasDp(v, 0) ? null : 2)}` : withUnit(pick(rng, ['kg', 'm', 'litres', 'g']));
    return {
      prompt: `${up ? 'Increase' : 'Decrease'} ${fmt(A)} by ${num(p)}%.`,
      answer: fmt(ans),
      distractors: dvals(ans, [change, up ? A - change : A + change, up ? A + p : A - p, A * (1 + p / 10), up ? A + change / 10 : A - change / 10, up ? A + 10 * change : A - 10 * change], fmt, { dp: 2 }),
      typed: { kind: 'number', value: ans },
      solution: [
        ...blockSteps(p, A, fmt),
        `${up ? 'Add it on' : 'Take it away'}: ${fmt(A)} ${up ? '$+$' : '$-$'} ${fmt(change)} $=$ ${fmt(ans)}`,
        `Answer: ${fmt(ans)}`,
      ],
    };
  }
  throw new Error('incdec');
}, { title: 'Increase or decrease by a percentage (non-calculator)' });

export const pctMultiplier = gen('rat-pct-multiplier', 'rat-percent-increase', (rng, d) => {
  const p = pick(rng, size(d, [10, 20, 30, 5, 15, 25, 40], [3, 7, 12, 35, 8, 2, 45, 4], [7.5, 2.5, 0.5, 12.5, 17.5, 1.5, 3.5]));
  const up = chance(rng, 0.5);
  const m = mult(p, up ? 1 : -1);
  const wrong = [tidy(p / 100), mult(p, up ? -1 : 1), tidy(1 + p / 10), tidy(p / 10), tidy(1 + (up ? 1 : -1) * p / 1000), up ? tidy(p / 100 + 0.1) : tidy(1 - p / 10), tidy(100 + (up ? p : -p))].filter((v) => v > 0 && v !== m);
  if (chance(rng, 0.5)) {
    return {
      prompt: pick(rng, [`What decimal multiplier would you use to ${up ? 'increase' : 'decrease'} an amount by ${num(p)}%?`, `Write down the single number you multiply by to ${up ? 'increase' : 'decrease'} a price by ${num(p)}%.`]),
      answer: `$${tnum(m)}$`,
      distractors: wrong.map((v) => `$${tnum(v)}$`),
      typed: { kind: 'number', value: m },
      solution: [
        `The original amount is 100%. ${up ? `Increasing by ${num(p)}% gives $100 + ${num(p)} = ${num(100 + p)}\\%$` : `Decreasing by ${num(p)}% leaves $100 - ${num(p)} = ${num(100 - p)}\\%$`}.`,
        `${num(up ? 100 + p : 100 - p)}% as a decimal is $${num(up ? 100 + p : 100 - p)} \\div 100 = ${tnum(m)}$.`,
        `(Multiplying by $${tnum(p / 100)}$ would only give the ${up ? 'increase' : 'decrease'}, not the new amount.)`,
        `Answer: $${tnum(m)}$`,
      ],
    };
  }
  const A = int(rng, 12, 99) * pick(rng, [10, 5, 1]);
  const ex = (k) => `$${tnum(A)} \\times ${tnum(k)}$`;
  return {
    prompt: `Which calculation ${up ? 'increases' : 'decreases'} ${num(A)} by ${num(p)}%?`,
    answer: ex(m),
    distractors: [...wrong.map(ex), `$${tnum(A)} ${up ? '+' : '-'} ${tnum(p)}$`, `$${tnum(A)} \\times ${tnum(p)}$`],
    solution: [
      `${up ? 'Increase' : 'Decrease'} by ${num(p)}% means the new amount is ${num(up ? 100 + p : 100 - p)}% of the original.`,
      `${num(up ? 100 + p : 100 - p)}% $= ${tnum(m)}$, so multiply by $${tnum(m)}$.`,
      `Answer: ${ex(m)}`,
    ],
  };
}, { title: 'Multipliers for percentage increase and decrease' });

// word contexts; up decides direction
const INC_DEC_CTX = [
  { up: true, u: 'money', t: (A, p) => `A train season ticket costs ${gbp(A)}. The price goes up by ${num(p)}%. What is the new price?` },
  { up: true, u: 'money', t: (A, p, N) => `${N} earns ${gbp(A)} a year. ${N} gets a pay rise of ${num(p)}%. What is ${N}'s new salary?`, big: true },
  { up: false, u: 'money', t: (A, p) => `In a sale, all prices are reduced by ${num(p)}%. A coat normally costs ${gbp(A)}. What is the sale price of the coat?` },
  { up: true, u: 'money', t: (A, p) => `The price of a pair of headphones is ${gbp(A)} before VAT. VAT at ${num(p)}% is added. What is the price including VAT?`, vat: true },
  { up: false, u: 'money', t: (A, p) => `A car is worth ${gbp(A)}. During the next year its value falls by ${num(p)}%. What is it worth after a year?`, big: true },
  { up: true, u: 'count', t: (A, p) => `A village has a population of ${num(A)}. Over ten years it increases by ${num(p)}%. What is the new population?` },
  { up: false, u: 'money', t: (A, p) => `A gym membership costs ${gbp(A)} a year. Students get ${num(p)}% off. How much does a student pay?` },
  { up: true, u: 'money', t: (A, p) => `A restaurant bill comes to ${gbp(A)}. A service charge of ${num(p)}% is added. What is the total bill?` },
  { up: false, u: 'kg', t: (A, p) => `A puppy weighed ${num(A)} kg. After an illness its weight dropped by ${num(p)}%. What does it weigh now?` },
  { up: true, u: 'cm', t: (A, p) => `A sunflower is ${num(A)} cm tall. Over the next week its height increases by ${num(p)}%. How tall is it at the end of the week?` },
  { up: false, u: 'money', t: (A, p) => `An electricity company cuts its standard monthly charge of ${gbp(A)} by ${num(p)}%. What is the new monthly charge?` },
  { up: true, u: 'money', t: (A, p) => `Rent on a flat is ${gbp(A)} a month. The landlord increases it by ${num(p)}%. What is the new monthly rent?` },
  { up: false, u: 'count', t: (A, p) => `A football club had ${num(A)} season-ticket holders last year. This year the number fell by ${num(p)}%. How many season-ticket holders are there this year?` },
  { up: true, u: 'g', t: (A, p) => `A chocolate bar weighs ${num(A)} g. A special offer bar contains ${num(p)}% extra. How much does the offer bar weigh?` },
  { up: false, u: 'minutes', t: (A, p) => `A train journey takes ${num(A)} minutes. A new timetable cuts the journey time by ${num(p)}%. How long does the journey take now?` },
];

export const incDecWord = gen('rat-pct-inc-dec-word', 'rat-percent-increase', (rng, d) => {
  for (let i = 0; i < 300; i += 1) {
    const tpl = pick(rng, INC_DEC_CTX);
    const p = tpl.vat ? 20 : pick(rng, size(d, [10, 20, 5, 25, 50, 30], [15, 12, 8, 35, 3, 6, 4], [2.5, 3.5, 17.5, 1.5, 4.2, 12.5, 7.5]));
    let A;
    if (tpl.u === 'money') A = tpl.big ? int(rng, 160, 450) * size(d, 10000, 10000, 1000) * size(d, 1, 1, 10) : int(rng, size(d, 2, 10, 50), size(d, 40, 400, 2500)) * size(d, 100, 10, 1) * 5;
    else if (tpl.u === 'count') A = int(rng, 30, 900) * size(d, 10, 5, 1) * 2;
    else if (tpl.u === 'minutes') A = int(rng, 4, 30) * 5 * size(d, 2, 1, 1);
    else A = int(rng, 10, 400) * size(d, 2, 1, 1);
    const change = (A * p) / 100;
    if (tpl.u === 'money' ? !Number.isInteger(change) : !hasDp(change, 2)) continue;
    if (tpl.u === 'count' && !Number.isInteger(change)) continue;
    if (tpl.u === 'minutes' && !Number.isInteger(change)) continue;
    const ans = tidy(tpl.up ? A + change : A - change);
    if (ans <= 0) continue;
    const fmt = tpl.u === 'money' ? gbp : tpl.u === 'count' ? (v) => num(v) : withUnit(tpl.u);
    const pound = tpl.u === 'money' ? 100 : 1;
    const vals = [change, tpl.up ? A - change : A + change, tpl.up ? A + p * pound : A - p * pound, A * (1 + p / 10), tpl.up ? A * (1 + p / 1000) : A * (1 - p / 1000), A * p / 10];
    const m = mult(p, tpl.up ? 1 : -1);
    return {
      prompt: tpl.t(A, p, names(rng, 1)[0]),
      answer: fmt(ans),
      distractors: tpl.u === 'money' ? pvals(ans, vals) : dvals(ans, vals, fmt, { dp: 2 }),
      typed: { kind: 'number', value: ans / pound },
      calculator: d !== 'easy',
      solution: d === 'easy' ? [
        ...blockSteps(p, A / pound, (v) => (tpl.u === 'money' ? `£${num(v, hasDp(v, 0) ? null : 2)}` : num(v))),
        `${tpl.up ? 'Add' : 'Subtract'}: ${fmt(A)} ${tpl.up ? '$+$' : '$-$'} ${fmt(change)} $=$ ${fmt(ans)}`,
        `Answer: ${fmt(ans)}`,
      ] : [
        `${tpl.up ? 'An increase' : 'A decrease'} of ${num(p)}% leaves ${num(tpl.up ? 100 + p : 100 - p)}% of the original, so the multiplier is $${tnum(m)}$.`,
        `$${tnum(A / pound)} \\times ${tnum(m)} = ${tnum(ans / pound)}$`,
        `Answer: ${fmt(ans)}`,
      ],
    };
  }
  throw new Error('incdec word');
}, { title: 'Percentage increase or decrease in context', word: true });

// amt: [min, max] in pounds; p1/p2: percentage choices for [easy/medium, hard]
const SUCC_CTX = [
  { kind: 'fees', amt: [40, 240], p1: [[10, 5, 15], [12.5, 7.5, 8]], p2: [[2, 3, 1], [2.5, 1.5, 3]], s1: 1, s2: 1, t: (A, p1, p2) => `Concert tickets cost ${gbp(A)} in total. A ${num(p1)}% booking fee is added to the ticket price. Then ${num(p2)}% of the new total is added for paying by credit card. What is the total charge?` },
  { kind: 'upDown', amt: [20, 120], p1: [[10, 20, 25], [12, 15, 8]], p2: [[10, 20, 25], [12, 15, 8]], s1: 1, s2: -1, t: (A, p1, p2) => `A shop increases the price of a jacket, originally ${gbp(A)}, by ${num(p1)}%. A month later the new price is reduced by ${num(p2)}% in a sale. What is the sale price?` },
  { kind: 'downDown', amt: [300, 1500], p1: [[10, 20, 25, 30], [15, 35, 12]], p2: [[10, 20, 50], [5, 15, 12]], s1: -1, s2: -1, t: (A, p1, p2) => `A sofa costs ${gbp(A)}. In a sale its price is reduced by ${num(p1)}%. On the last day of the sale the sale price is reduced by a further ${num(p2)}%. What is the final price?` },
  { kind: 'upUp', amt: [150000, 600000], p1: [[10, 5, 20], [12, 3.5, 6]], p2: [[10, 5, 20], [3, 4, 2.5]], s1: 1, s2: 1, t: (A, p1, p2) => `A house was worth ${gbp(A)}. Its value rose by ${num(p1)}% in the first year and by ${num(p2)}% in the second year. What was it worth after two years?` },
  { kind: 'downUp', amt: [20, 200], p1: [[10, 20, 50], [15, 12, 8]], p2: [[10, 20, 50], [15, 12, 6]], s1: -1, s2: 1, t: (A, p1, p2) => `A share was worth ${gbp(A)}. Its value fell by ${num(p1)}% on Monday and then rose by ${num(p2)}% on Tuesday. What was it worth at the end of Tuesday?` },
  { kind: 'vatDisc', amt: [300, 1200], p1: [[20], [20]], p2: [[10, 20, 25], [15, 12, 30]], s1: 1, s2: -1, t: (A, p1, p2) => `A laptop costs ${gbp(A)} before VAT. VAT of ${num(p1)}% is added, and then a ${num(p2)}% staff discount is taken off the total. How much does a member of staff pay?` },
  { kind: 'payRise', amt: [18000, 40000], p1: [[10, 5, 2], [3, 4, 2.5]], p2: [[10, 5, 2], [1.5, 2, 3.5]], s1: 1, s2: 1, t: (A, p1, p2) => `A nurse earns ${gbp(A)} a year. She gets a ${num(p1)}% pay rise one year and a ${num(p2)}% pay rise the next year. What does she earn after both pay rises?` },
  { kind: 'carDown', amt: [8000, 30000], p1: [[20, 25, 10], [22, 18, 15]], p2: [[10, 20, 25], [12, 14, 9]], s1: -1, s2: -1, t: (A, p1, p2) => `A car is worth ${gbp(A)}. Its value falls by ${num(p1)}% in the first year and by ${num(p2)}% in the second year. What is it worth after two years?` },
];

export const successive = gen('rat-pct-successive', 'rat-percent-increase', (rng, d) => {
  for (let i = 0; i < 400; i += 1) {
    const tpl = pick(rng, SUCC_CTX);
    const p1 = pick(rng, tpl.p1[d === 'hard' ? 1 : 0]);
    const p2 = pick(rng, tpl.p2[d === 'hard' ? 1 : 0]);
    if (tpl.kind === 'upDown' && d === 'easy' && p1 !== p2) continue;
    const step = tpl.amt[1] >= 10000 ? 1000 : tpl.amt[1] >= 1000 ? 10 : 1;
    const A = int(rng, tpl.amt[0] / step, tpl.amt[1] / step) * step * 100 * (d === 'easy' && step === 1 ? 1 : 1);
    const m1 = mult(p1, tpl.s1); const m2 = mult(p2, tpl.s2);
    const mid = (A * m1); const ans = mid * m2;
    if (!Number.isInteger(tidy(mid)) || !Number.isInteger(tidy(ans))) continue;
    const net = A * mult(tpl.s1 * p1 + tpl.s2 * p2);
    return {
      prompt: tpl.t(A, p1, p2),
      answer: gbp(tidy(ans)),
      distractors: pvals(tidy(ans), [net, mid, A, A * (1 + tpl.s2 * p2 / 100), mid + tpl.s2 * (A * p2) / 100, ans + (A - mid)]),
      typed: { kind: 'number', value: tidy(ans) / 100 },
      calculator: d !== 'easy',
      solution: [
        `Do the changes one after the other – the second percentage is of the <b>new</b> amount, not the original.`,
        `First: $${tnum(A / 100, A % 100 ? 2 : null)} \\times ${tnum(m1)} = ${tnum(tidy(mid) / 100, tidy(mid) % 100 ? 2 : null)}$`,
        `Then: $${tnum(tidy(mid) / 100, tidy(mid) % 100 ? 2 : null)} \\times ${tnum(m2)} = ${tnum(tidy(ans) / 100, tidy(ans) % 100 ? 2 : null)}$`,
        ...(tpl.kind === 'upDown' && p1 === p2 ? [`Notice it is <b>not</b> back to ${gbp(A)}: the ${num(p2)}% decrease is taken from a bigger amount.`] : [tpl.s1 * p1 + tpl.s2 * p2 === 0 ? `(The changes do <b>not</b> cancel out: the answer is not ${gbp(A)}.)` : `(${tpl.s1 * p1 + tpl.s2 * p2 > 0 ? 'Adding' : 'Taking off'} ${num(Math.abs(tpl.s1 * p1 + tpl.s2 * p2))}% in one go would give ${gbp(net)}, which is wrong.)`]),
        `Answer: ${gbp(tidy(ans))}`,
      ],
    };
  }
  throw new Error('successive');
}, { title: 'Two percentage changes one after another' });

/* ================================================================== */
/* rat-percent-express                                                 */
/* ================================================================== */

export const expressBasic = gen('rat-express-basic', 'rat-percent-express', (rng, d) => {
  for (let i = 0; i < 300; i += 1) {
    const B = pick(rng, size(d, [10, 20, 25, 50, 200, 4, 5], [40, 80, 250, 400, 500, 60, 120, 30], [16, 32, 64, 80, 125, 160, 240, 320, 75, 1250]));
    const A = int(rng, 1, B - 1);
    const ans = tidy((100 * A) / B);
    if (!hasDp(ans, d === 'hard' ? 2 : d === 'medium' ? 1 : 0)) continue;
    const unit = pick(rng, ['', '', 'kg', 'cm', 'ml', 'minutes']);
    const f = (v) => (unit ? `${num(v)} ${unit}` : num(v));
    return {
      prompt: `Write ${f(A)} as a percentage of ${f(B)}.`,
      answer: pct(ans),
      distractors: dvals(ans, [roundTo((100 * B) / A, 1), A, B - A, tidy(A / B), 100 - ans, roundTo((100 * (B - A)) / B, 1) === 100 - ans ? null : 0, tidy((A * 100) / (B + A))], pct, { dp: 2, round: true }),
      typed: { kind: 'number', value: ans },
      solution: [
        `Write it as a fraction of the whole: $\\frac{${tnum(A)}}{${tnum(B)}}$.`,
        `Multiply by 100: $\\frac{${tnum(A)}}{${tnum(B)}} \\times 100 = ${tnum(ans)}$`,
        `Answer: ${pct(ans)}`,
      ],
    };
  }
  throw new Error('express');
}, { title: 'Write one number as a percentage of another' });

const EXPRESS_CTX = [
  { t: (a, b, N) => `${N} scored ${a} out of ${b} in a spelling test. What was ${N}'s score as a percentage?`, b: [20, 25, 40, 50, 80] },
  { t: (a, b) => `A football team won ${a} of its ${b} games this season. What percentage of its games did it win?`, b: [20, 25, 40, 50, 32, 16] },
  { t: (a, b) => `There are ${b} students in a class and ${a} of them are girls. What percentage of the class are girls?`, b: [20, 25, 30, 32, 40] },
  { t: (a, b, N) => `${N} had ${gbp(b * 100)} and spent ${gbp(a * 100)} on a game. What percentage of the money did ${N} spend?`, b: [20, 25, 40, 50, 80, 200] },
  { t: (a, b) => `${b} seeds were planted and ${a} of them grew into seedlings. What percentage of the seeds grew?`, b: [20, 25, 40, 50, 80, 200, 250] },
  { t: (a, b, N) => `${N} took ${b} free throws in basketball practice and scored ${a}. What percentage did ${N} score?`, b: [20, 25, 40, 50, 60] },
  { t: (a, b) => `A theatre has ${num(b)} seats. ${num(a)} tickets were sold for a show. What percentage of the seats were sold?`, b: [400, 500, 800, 1200, 250] },
  { t: (a, b, N) => `${N} gets ${gbp(b * 10)} pocket money a week and saves ${gbp(a * 10)} of it. What percentage does ${N} save?`, b: [50, 40, 80, 100] },
  { t: (a, b) => `In a village election ${num(b)} people voted and ${num(a)} voted for the winner. What percentage of the votes did the winner get?`, b: [400, 500, 800, 2000, 1250] },
  { t: (a, b) => `A car park has ${b} spaces. ${a} of them are taken. What percentage of the spaces are taken?`, b: [80, 120, 200, 250, 400] },
  { t: (a, b) => `A survey of ${b} cinema-goers found that ${a} of them bought popcorn. What percentage bought popcorn?`, b: [40, 50, 80, 200, 250, 500] },
  { t: (a, b) => `A shop had ${b} Easter eggs and sold ${a} of them before Easter. What percentage of the eggs did it sell?`, b: [60, 80, 120, 200, 240] },
];
const EXPRESS_UNITS = [
  { t: (a, b) => `What is ${a}p as a percentage of £${num(b / 100)}?`, big: [100, 200, 300, 400, 500, 250], F: 100 },
  { t: (a, b) => `${'A lesson lasts'} ${num(b / 60)} hours. ${a} minutes of it is spent on a test. What percentage of the lesson is the test?`, big: [60, 120, 90, 150, 180], F: 60 },
  { t: (a, b) => `Write ${a} g as a percentage of ${num(b / 1000)} kg.`, big: [1000, 2000, 4000, 5000, 2500, 500], F: 1000 },
  { t: (a, b) => `A ribbon is ${num(b / 100)} m long. A piece ${a} cm long is cut off. What percentage of the ribbon is cut off?`, big: [100, 200, 300, 400, 250, 500], F: 100 },
  { t: (a, b) => `A runner has completed ${num(a)} m of a ${num(b / 1000)} km race. What percentage of the race has she completed?`, big: [5000, 10000, 2000, 4000, 8000], F: 1000 },
  { t: (a, b) => `A jug holds ${num(b / 1000)} litres. It contains ${a} ml of water. What percentage of the jug is full?`, big: [1000, 2000, 1500, 2500, 4000], F: 1000 },
];

export const expressWord = gen('rat-express-word', 'rat-percent-express', (rng, d) => {
  for (let i = 0; i < 300; i += 1) {
    const [N] = names(rng, 1);
    if (d === 'hard' && chance(rng, 0.6)) {
      const tpl = pick(rng, EXPRESS_UNITS);
      const B = pick(rng, tpl.big);
      const a = int(rng, 1, B - 1);
      const ans = tidy((100 * a) / B);
      if (!hasDp(ans, 1) || (tpl.F === 1000 && a % 5 !== 0)) continue;
      return {
        prompt: tpl.t(a, B),
        answer: pct(ans),
        distractors: dvals(ans, [tidy((100 * a) / (B / tpl.F)), tidy(a / (B / tpl.F)), tidy((100 * a) / (B / tpl.F * 100)), roundTo((100 * B) / a, 1), 100 - ans, tidy((100 * a) / (B / tpl.F * (tpl.F === 60 ? 100 : tpl.F / 10)))], pct, { dp: 1, round: true }).filter((t) => !/\d{5,}/.test(t)),
        typed: { kind: 'number', value: ans },
        solution: [
          `Put both amounts in the same units first (the smaller unit). The whole is ${num(B)}${tpl.F === 100 && tpl.t(1, 100).includes('p') ? 'p' : ''}.`.replace('The whole is', 'The whole is'),
          `$\\frac{${tnum(a)}}{${tnum(B)}} \\times 100 = ${tnum(ans)}$`,
          `Answer: ${pct(ans)}`,
        ],
      };
    }
    const tpl = pick(rng, EXPRESS_CTX);
    const b = pick(rng, tpl.b);
    const a = int(rng, 1, b - 1);
    const ans = tidy((100 * a) / b);
    if (!hasDp(ans, d === 'easy' ? 0 : 1)) continue;
    return {
      prompt: tpl.t(a, b, N),
      answer: pct(ans),
      distractors: dvals(ans, [a, roundTo((100 * b) / a, 1), b - a, 100 - ans, tidy(a / b), roundTo((100 * a) / (a + b), 1)], pct, { dp: 1, round: true }),
      typed: { kind: 'number', value: ans },
      calculator: d === 'hard',
      solution: [
        `Fraction: $\\frac{${tnum(a)}}{${tnum(b)}}$ (the part over the whole).`,
        `$\\frac{${tnum(a)}}{${tnum(b)}} \\times 100 = ${tnum(ans)}$`,
        `Answer: ${pct(ans)}`,
      ],
    };
  }
  throw new Error('express word');
}, { title: 'One quantity as a percentage of another, in context', word: true });

const SUBJECTS = [['Maths', 'English', 'Science', 'History', 'French', 'Art', 'Geography', 'Music']];
export const expressCompare = gen('rat-express-compare', 'rat-percent-express', (rng, d) => {
  for (let i = 0; i < 300; i += 1) {
    const mode = chance(rng, 0.5) ? 'people' : 'subjects';
    const labels = mode === 'people' ? names(rng, 4) : shuffle(rng, SUBJECTS[0]).slice(0, 4);
    const outOf = shuffle(rng, size(d, [10, 20, 25, 50], [20, 25, 40, 50, 80], [30, 40, 60, 75, 80, 120])).slice(0, 4);
    while (outOf.length < 4) outOf.push(pick(rng, [20, 50]));
    const pcts = outOf.map((b) => {
      const opts = []; for (let a = Math.ceil(b * 0.5); a < b; a += 1) if (hasDp((100 * a) / b, size(d, 0, 1, 1))) opts.push(a);
      return opts;
    });
    if (pcts.some((o) => !o.length)) continue;
    const scores = pcts.map((o) => pick(rng, o));
    const vals = scores.map((a, j) => (100 * a) / outOf[j]);
    const best = Math.max(...vals);
    if (vals.filter((v) => v === best).length > 1) continue;
    // the student with the highest raw score must NOT be the best (classic trap), at least sometimes
    const rawBest = scores.indexOf(Math.max(...scores));
    if (vals[rawBest] === best && chance(rng, 0.7)) continue;
    const bi = vals.indexOf(best);
    const tbl = `<table class="qtable"><tr><th>${mode === 'people' ? 'Student' : 'Subject'}</th><th>Score</th></tr>${labels.map((l, j) => `<tr><td>${l}</td><td>${scores[j]} out of ${outOf[j]}</td></tr>`).join('')}</table>`;
    return {
      prompt: mode === 'people' ? 'Four students took different tests. Their scores are shown in the table. Who got the highest percentage?' : `${names(rng, 1)[0]}'s test scores are shown in the table. In which subject did they get the highest percentage?`,
      visual: tbl,
      answer: labels[bi],
      distractors: labels.filter((_, j) => j !== bi),
      count: 4,
      calculator: d === 'hard',
      solution: [
        'You cannot compare the raw scores because the tests are out of different totals. Change each score to a percentage.',
        labels.map((l, j) => `${l}: $\\frac{${scores[j]}}{${outOf[j]}} \\times 100 = ${tnum(roundTo(vals[j], 1))}\\%$`).join('<br>'),
        `The highest is ${num(roundTo(best, 1))}%.`,
        `Answer: ${labels[bi]}`,
      ],
    };
  }
  throw new Error('compare');
}, { title: 'Compare scores by converting to percentages' });

/* ================================================================== */
/* rat-simple-interest                                                 */
/* ================================================================== */

const SI_CTX = [
  (N, P, r, n, ask) => `${N} invests ${gbp(P)} in a savings account that pays ${num(r)}% simple interest per year. ${ask === 'interest' ? `How much interest will ${N} earn in ${n} years?` : `How much will be in the account after ${n} years?`}`,
  (N, P, r, n, ask) => `${N} borrows ${gbp(P)} at ${num(r)}% per year simple interest. ${ask === 'interest' ? `How much interest is charged over ${n} years?` : `How much does ${N} owe in total after ${n} years?`}`,
  (N, P, r, n, ask) => `A bond pays ${num(r)}% simple interest per year on an investment of ${gbp(P)}. ${ask === 'interest' ? `What is the total interest after ${n} years?` : `What is the bond worth after ${n} years?`}`,
  (N, P, r, n, ask) => `${N}'s grandparents put ${gbp(P)} into an account paying ${num(r)}% simple interest each year. ${ask === 'interest' ? `How much interest is earned in ${n} years?` : `How much is in the account after ${n} years?`}`,
  (N, P, r, n, ask) => `A credit union lends ${gbp(P)} to a small business at a simple interest rate of ${num(r)}% per annum. ${ask === 'interest' ? `How much interest does the business pay over ${n} years?` : `How much must the business repay in total after ${n} years?`}`,
];

export const simpleInterest = gen('rat-simple-interest-calc', 'rat-simple-interest', (rng, d) => {
  for (let i = 0; i < 300; i += 1) {
    const r = pick(rng, size(d, [2, 3, 4, 5, 10], [1.5, 2, 2.5, 3, 4, 6], [1.8, 2.4, 3.2, 3.75, 4.5, 2.25]));
    const n = int(rng, 2, size(d, 5, 8, 10));
    const P = int(rng, size(d, 2, 5, 12), size(d, 50, 80, 300)) * size(d, 10000, 5000, 2500); // pence
    const yearI = (P * r) / 100;
    if (!Number.isInteger(yearI)) continue;
    const I = yearI * n;
    const ask = chance(rng, 0.5) ? 'interest' : 'total';
    const ans = ask === 'interest' ? I : P + I;
    const comp = P * (1 + r / 100) ** n;
    const [N] = names(rng, 1);
    return {
      prompt: pick(rng, SI_CTX)(N, P, r, n, ask),
      answer: gbp(ans),
      distractors: pvals(ans, [ask === 'interest' ? P + I : I, ask === 'interest' ? yearI : P + yearI, Math.round(ask === 'interest' ? comp - P : comp), ask === 'interest' ? yearI * (n - 1) : P + yearI * (n - 1), ask === 'interest' ? yearI * (n + 1) : P + yearI * (n + 1), P * r * n / 10]),
      typed: { kind: 'number', value: ans / 100 },
      calculator: d === 'hard',
      solution: [
        `Simple interest is the same every year: ${num(r)}% of ${gbp(P)}.`,
        `One year: $${tnum(P / 100)} \\times ${tnum(r / 100)} = ${tnum(yearI / 100, yearI % 100 ? 2 : null)}$`,
        `${n} years: $${n} \\times ${tnum(yearI / 100, yearI % 100 ? 2 : null)} = ${tnum(I / 100, I % 100 ? 2 : null)}$${ask === 'total' ? `, so the total is ${gbp(P)} + ${gbp(I)} $=$ ${gbp(P + I)}` : ''}.`,
        `Answer: ${gbp(ans)}`,
      ],
      longDecimalsOk: true,
    };
  }
  throw new Error('si');
}, { title: 'Simple interest: interest earned or total amount' });

export const simpleInterestReverse = gen('rat-simple-interest-reverse', 'rat-simple-interest', (rng, d) => {
  for (let i = 0; i < 300; i += 1) {
    const r = pick(rng, size(d, [2, 3, 4, 5, 6], [1.5, 2.5, 3, 4, 3.5, 5], [1.2, 2.4, 3.2, 4.5, 1.75, 2.25]));
    const n = int(rng, 2, size(d, 5, 8, 10));
    const P = int(rng, 4, size(d, 30, 60, 150)) * 10000;
    const yearI = (P * r) / 100;
    if (!Number.isInteger(yearI)) continue;
    const I = yearI * n;
    const ask = pick(rng, ['rate', 'years', 'rate']);
    const [N] = names(rng, 1);
    if (ask === 'rate') {
      const totalPhrase = chance(rng, 0.5);
      return {
        prompt: totalPhrase
          ? `${N} invests ${gbp(P)} at a simple interest rate of $r\\%$ per year. After ${n} years there is ${gbp(P + I)} in the account. Work out the value of $r$.`
          : `${N} earns ${gbp(I)} simple interest in ${n} years on an investment of ${gbp(P)}. What is the annual rate of interest?`,
        answer: pct(r),
        distractors: dvals(r, [tidy((100 * I) / P), tidy((100 * (P + I)) / P / n), tidy(r * 10), tidy(r / 10), tidy(r + 1), tidy((100 * I) / (P + I) / n), tidy(r / 2)], pct, { dp: 2, round: true }),
        typed: { kind: 'number', value: r },
        calculator: d === 'hard',
        solution: [
          totalPhrase ? `Interest earned $=$ ${gbp(P + I)} $-$ ${gbp(P)} $=$ ${gbp(I)}.` : `Total interest $=$ ${gbp(I)}.`,
          `Interest per year $=$ ${gbp(I)} $\\div ${n} =$ ${gbp(yearI)}.`,
          `As a percentage of ${gbp(P)}: $\\frac{${tnum(yearI / 100)}}{${tnum(P / 100)}} \\times 100 = ${tnum(r)}\\%$`,
          `Answer: ${pct(r)}`,
        ],
      };
    }
    return {
      prompt: `${N} puts ${gbp(P)} into an account paying ${num(r)}% simple interest per year. How many years will it take to earn ${gbp(I)} in interest?`,
      answer: `${n} years`,
      distractors: dvals(n, [n + 1, n - 1, n * 2, Math.round(I / P * 10), r, Math.round((P + I) / yearI) > 40 ? null : Math.round((P + I) / yearI)], (v) => `${v} year${v === 1 ? '' : 's'}`, { dp: 0 }),
      typed: { kind: 'number', value: n },
      calculator: d === 'hard',
      solution: [
        `Interest each year: ${num(r)}% of ${gbp(P)} $=$ ${gbp(yearI)}.`,
        `Number of years $=$ ${gbp(I)} $\\div$ ${gbp(yearI)} $= ${n}$`,
        `Answer: ${n} years`,
      ],
    };
  }
  throw new Error('si rev');
}, { title: 'Simple interest: find the rate or the number of years' });

/* ================================================================== */
/* rat-percent-change                                                  */
/* ================================================================== */

export const pctChangeBasic = gen('rat-pct-change-basic', 'rat-percent-change', (rng, d) => {
  for (let i = 0; i < 300; i += 1) {
    const old = pick(rng, size(d, [20, 40, 50, 80, 200, 25, 400], [40, 60, 80, 120, 160, 250, 300, 500], [64, 125, 240, 320, 480, 750, 1250, 36]));
    const p = pick(rng, size(d, [10, 20, 25, 50, 75, 5], [12.5, 15, 35, 40, 60, 30, 45], [2.5, 7.5, 37.5, 62.5, 17.5, 125, 4]));
    const up = chance(rng, 0.55);
    if (!up && p >= 100) continue;
    const nw = tidy(old * mult(p, up ? 1 : -1));
    if (!hasDp(nw, 1)) continue;
    const diff = Math.abs(nw - old);
    const ans = p;
    return {
      prompt: `A value ${up ? 'increases' : 'decreases'} from ${num(old)} to ${num(nw)}. Work out the percentage ${up ? 'increase' : 'decrease'}.`,
      answer: pct(ans),
      distractors: dvals(ans, [roundTo((100 * diff) / nw, 1), diff, roundTo((100 * nw) / old, 1), tidy(diff / old), roundTo(100 - (100 * nw) / old, 1), roundTo((100 * old) / nw, 1)], pct, { dp: 1, round: true }),
      typed: { kind: 'number', value: ans },
      solution: [
        `Change $= ${tnum(Math.max(nw, old))} - ${tnum(Math.min(nw, old))} = ${tnum(diff)}$`,
        `Percentage change $= \\frac{\\text{change}}{\\text{original}} \\times 100 = \\frac{${tnum(diff)}}{${tnum(old)}} \\times 100 = ${tnum(ans)}\\%$`,
        `Always divide by the <b>original</b> value (${num(old)}), not the new one.`,
        `Answer: ${pct(ans)}`,
      ],
    };
  }
  throw new Error('pct change');
}, { title: 'Percentage change between two numbers' });

const CHANGE_CTX = [
  { u: 'money', t: (o, n, N) => `${N} bought a bike for ${gbp(o)} and sold it for ${gbp(n)}. Work out ${N}'s percentage ${n > o ? 'profit' : 'loss'}.`, w: (up) => (up ? 'profit' : 'loss') },
  { u: 'money', t: (o, n) => `A house was bought for ${gbp(o)} and sold five years later for ${gbp(n)}. What was the percentage ${n > o ? 'increase' : 'decrease'} in its value?`, big: true },
  { u: 'count', t: (o, n) => `The number of tickets sold for a football match changed from ${num(o)} last season to ${num(n)} this season. Work out the percentage ${n > o ? 'increase' : 'decrease'}.`, big: true },
  { u: 'count', t: (o, n) => `The population of a village went from ${num(o)} to ${num(n)}. Work out the percentage ${n > o ? 'increase' : 'decrease'} in the population.` },
  { u: 'kg', t: (o, n) => `A puppy weighed ${num(o)} kg at its first check-up and ${num(n)} kg at its second. What was the percentage ${n > o ? 'increase' : 'decrease'} in its weight?` },
  { u: 'money', t: (o, n) => `A car cost ${gbp(o)} when new. Three years later it is worth ${gbp(n)}. What is the percentage ${n > o ? 'increase' : 'decrease'} in its value?`, big: true },
  { u: 'money', t: (o, n) => `The price of a phone changed from ${gbp(o)} to ${gbp(n)}. Work out the percentage ${n > o ? 'increase' : 'decrease'} in the price.` },
  { u: 'count', t: (o, n) => `A museum had ${num(o)} visitors in March and ${num(n)} visitors in April. What was the percentage ${n > o ? 'increase' : 'decrease'}?` },
  { u: 'money', t: (o, n, N) => `${N}'s hourly wage went from ${gbp(o)} to ${gbp(n)}. What was the percentage ${n > o ? 'increase' : 'decrease'}?`, wage: true },
  { u: 'minutes', t: (o, n) => `A new road cuts a journey from ${o} minutes to ${n} minutes. What is the percentage ${n > o ? 'increase' : 'decrease'} in the journey time?`, down: true },
  { u: 'money', t: (o, n) => `A family's monthly electricity bill rose from ${gbp(o)} to ${gbp(n)}. Work out the percentage ${n > o ? 'increase' : 'decrease'}.`, upOnly: true },
  { u: 'cm', t: (o, n) => `A tomato plant was ${num(o)} cm tall. A month later it was ${num(n)} cm tall. Work out the percentage ${n > o ? 'increase' : 'decrease'} in its height.`, upOnly: true },
  { u: 'money', t: (o, n, N) => `A trader buys a box of T-shirts for ${gbp(o)} and sells them all for ${gbp(n)}. What is the percentage ${n > o ? 'profit' : 'loss'}?` },
  { u: 'count', t: (o, n) => `A school had ${num(o)} students last year and has ${num(n)} this year. Work out the percentage ${n > o ? 'increase' : 'decrease'} in the number of students.` },
];

export const pctChangeWord = gen('rat-pct-change-word', 'rat-percent-change', (rng, d) => {
  for (let i = 0; i < 400; i += 1) {
    const tpl = pick(rng, CHANGE_CTX);
    const up = tpl.upOnly ? true : tpl.down ? false : chance(rng, 0.55);
    const rounded = d === 'hard';
    let o; let n;
    if (tpl.u === 'money') {
      o = tpl.big ? int(rng, 50, 400) * 100000 / (tpl.big && tpl.t(1, 2).includes('car') ? 10 : 1) : tpl.wage ? int(rng, 900, 2400) : int(rng, 20, 900) * 100;
      if (tpl.wage) o = Math.round(o / 5) * 5;
    } else if (tpl.u === 'count') o = tpl.big ? int(rng, 20, 60) * 1000 : int(rng, 40, 900) * 10;
    else if (tpl.u === 'minutes') o = int(rng, 6, 24) * 5;
    else o = int(rng, 4, 60) * 5;
    let ans;
    if (rounded) {
      const delta = Math.round(o * (int(rng, 3, 45) / 100 + rng() * 0.01));
      n = up ? o + delta : o - delta;
      if (tpl.u === 'money' && !tpl.wage && !tpl.big) n = Math.round(n / 10) * 10;
      ans = roundTo((100 * Math.abs(n - o)) / o, 1);
      if (hasDp((100 * Math.abs(n - o)) / o, 1)) continue; // want genuine rounding
    } else {
      const p = pick(rng, size(d, [10, 20, 25, 50, 5, 30, 40], [12, 15, 35, 8, 45, 12.5, 2.5, 60], [0]));
      if (tpl.big && !up && p > 30) continue; // houses and cars rarely lose more than 30%
      n = tidy(o * mult(p, up ? 1 : -1));
      if (!Number.isInteger(n)) continue;
      ans = p;
    }
    if (n <= 0 || n === o) continue;
    const [N] = names(rng, 1);
    const fmt = tpl.u === 'money' ? gbp : tpl.u === 'count' ? (v) => num(v) : withUnit(tpl.u);
    const diff = Math.abs(n - o);
    const pound = tpl.u === 'money' ? 100 : 1;
    const word = tpl.t(o, n, N).match(/percentage (\w+)/)[1];
    return {
      prompt: tpl.t(o, n, N) + (rounded ? ' Give your answer to 1 decimal place.' : ''),
      answer: pct(ans),
      distractors: dvals(ans, [roundTo((100 * diff) / n, 1), roundTo(diff / pound, 1) <= 300 ? roundTo(diff / pound, 1) : null, roundTo((100 * n) / o, 1), roundTo((100 * o) / n, 1), roundTo(diff / o, 3) * 100 === ans ? null : roundTo(diff / o, 2), roundTo(ans + 1, 1)], pct, { dp: 1, round: true }),
      typed: { kind: 'number', value: ans, tolerance: rounded ? 0.05 : undefined },
      calculator: d !== 'easy',
      solution: [
        `Actual ${word}: ${fmt(Math.max(n, o))} $-$ ${fmt(Math.min(n, o))} $=$ ${fmt(diff)}.`,
        `Percentage ${word} $= \\frac{${tnum(diff / pound)}}{${tnum(o / pound)}} \\times 100 = ${rounded ? `${tnum(roundTo((100 * diff) / o, 3))}\\ldots` : tnum(ans)}$ (divide by the <b>original</b> amount).`,
        `Answer: ${pct(ans)}`,
      ],
    };
  }
  throw new Error('pct change word');
}, { title: 'Percentage change, profit and loss in context', word: true });

const ITEMS = [['Bread', 120, 'p'], ['Milk', 90, 'p'], ['Cheese', 300, 'p'], ['Coffee', 450, 'p'], ['Butter', 200, 'p'], ['Eggs', 240, 'p'], ['Juice', 150, 'p'], ['Tea', 280, 'p'], ['Rice', 180, 'p'], ['Pasta', 80, 'p']];
export const pctChangeCompare = gen('rat-pct-change-compare', 'rat-percent-change', (rng, d) => {
  for (let i = 0; i < 300; i += 1) {
    const items = shuffle(rng, ITEMS).slice(0, 4);
    const rows = items.map(([nm, base]) => {
      if (d === 'hard') {
        // awkward prices: percentages need a calculator and rounding
        const o = base + int(rng, -40, 40) + 1;
        const n = o + Math.round(o * int(rng, 3, 40) / 100) + int(rng, 0, 3);
        return { nm, o, n, p: roundTo((100 * (n - o)) / o, 1) };
      }
      const o = base + int(rng, -4, 4) * 10;
      const p = pick(rng, size(d, [5, 10, 20, 25, 50], [5, 10, 15, 20, 25, 30, 40], [0]));
      const n = tidy(o * mult(p));
      return { nm, o, n, p };
    });
    const sorted = rows.map((r) => r.p).sort((x, y) => y - x);
    if (sorted[0] - sorted[1] < 0.5) continue;
    if (rows.some((r) => !Number.isInteger(r.n))) continue;
    const ps = rows.map((r) => r.p);
    const best = Math.max(...ps);
    if (ps.filter((x) => x === best).length > 1) continue;
    const incs = rows.map((r) => r.n - r.o);
    const bigInc = Math.max(...incs);
    const bi = ps.indexOf(best);
    if (incs.indexOf(bigInc) === bi && chance(rng, 0.75)) continue; // biggest actual rise is usually NOT the answer
    const tbl = `<table class="qtable"><tr><th>Item</th><th>Last year</th><th>This year</th></tr>${rows.map((r) => `<tr><td>${r.nm}</td><td>${gbp(r.o)}</td><td>${gbp(r.n)}</td></tr>`).join('')}</table>`;
    return {
      prompt: 'The table shows the prices of four items last year and this year. Which item had the greatest <b>percentage</b> increase in price?',
      visual: tbl,
      answer: rows[bi].nm,
      distractors: rows.filter((_, j) => j !== bi).map((r) => r.nm),
      count: 4,
      calculator: d !== 'easy',
      solution: [
        'Work out each percentage increase: (increase ÷ old price) × 100.',
        rows.map((r) => `${r.nm}: $\\frac{${r.n - r.o}}{${r.o}} \\times 100 ${hasDp((100 * (r.n - r.o)) / r.o, 1) ? '=' : '\\approx'} ${tnum(r.p)}\\%$`).join('<br>'),
        `The biggest increase in pence is not necessarily the biggest percentage increase.`,
        `Answer: ${rows[bi].nm}`,
      ],
    };
  }
  throw new Error('compare');
}, { title: 'Which had the greatest percentage increase?' });

/* ================================================================== */
/* rat-reverse-percent                                                 */
/* ================================================================== */

export const reverseBasic = gen('rat-reverse-basic', 'rat-reverse-percent', (rng, d) => {
  for (let i = 0; i < 300; i += 1) {
    const p = pick(rng, size(d, [10, 20, 25, 50, 5, 75], [30, 40, 15, 60, 35, 12, 80], [12.5, 35, 45, 2.5, 120, 150, 65]));
    const whole = int(rng, 2, size(d, 30, 40, 60)) * size(d, 10, 20, 40);
    const part = tidy((whole * p) / 100);
    if (!hasDp(part, 1)) continue;
    const ctx = pick(rng, [
      [`${num(p)}% of a number is ${num(part)}. What is the number?`, (v) => num(v)],
      [`${num(p)}% of the people at a concert were under 18. There were ${num(part)} people under 18. How many people were at the concert?`, (v) => num(v)],
      [`${names(rng, 1)[0]} has spent ${num(p)}% of her savings. She spent £${num(part, hasDp(part, 0) ? null : 2)}. How much were her savings?`, (v) => `£${num(v, hasDp(v, 0) ? null : 2)}`],
      [`A tank is ${num(p)}% full. It contains ${num(part)} litres. How many litres does it hold when full?`, withUnit('litres')],
    ].filter(([s]) => p <= 100 || s.startsWith(`${num(p)}% of a number`)));
    const [prompt, fmt] = ctx;
    return {
      prompt,
      answer: fmt(whole),
      distractors: dvals(whole, [(part * p) / 100, part * (1 + p / 100), part + p, part * (100 - p) / 100 + part, (part / p) * 10, part * 100 / (100 - p), part * 10], fmt, { dp: 2, round: true }),
      typed: { kind: 'number', value: whole },
      solution: [
        `${num(p)}% $=$ ${fmt(part)}`,
        `1% $=$ ${fmt(part)} $\\div ${num(p)} = ${tnum(tidy(part / p))}$${hasDp(part / p, 4) ? '' : '…'}`,
        `100% $= ${tnum(tidy(part / p))} \\times 100 =$ ${fmt(whole)}  (or simply ${fmt(part)} $\\div ${tnum(p / 100)}$)`,
        `Answer: ${fmt(whole)}`,
      ].map((s) => s.replace(/\$\\div (\S+) = ([\d.]+)\$…/, '$\\div $1$')),
    };
  }
  throw new Error('rev basic');
}, { title: 'Find the whole from a percentage of it' });

const REV_CTX = [
  { up: false, t: (n, p) => `In a sale, all prices are reduced by ${num(p)}%. The sale price of a jacket is ${gbp(n)}. What was the price before the sale?` },
  { up: true, t: (n, p) => `The price of a scooter increases by ${num(p)}% to ${gbp(n)}. What was the price before the increase?` },
  { up: true, vat: true, t: (n, p) => `A pair of trainers costs ${gbp(n)} including VAT at ${num(p)}%. What is the price before VAT is added?` },
  { up: true, t: (n, p, N) => `After a ${num(p)}% pay rise, ${N} earns ${gbp(n)} a year. What did ${N} earn before the pay rise?`, big: true },
  { up: false, t: (n, p) => `A car loses ${num(p)}% of its value in its first year. After one year it is worth ${gbp(n)}. How much was it worth when new?`, big: true },
  { up: true, count: true, t: (n, p) => `The population of a town has grown by ${num(p)}% to ${num(n)}. What was the population before the increase?` },
  { up: false, t: (n, p, N) => `${N} pays ${gbp(n)} for a train ticket after getting a ${num(p)}% railcard discount. What is the full price of the ticket?` },
  { up: true, t: (n, p) => `A restaurant bill is ${gbp(n)} including a ${num(p)}% service charge. How much was the bill before the service charge?` },
  { up: false, count: true, t: (n, p) => `The number of hedgehogs in a nature reserve fell by ${num(p)}% to ${num(n)}. How many were there before?` },
  { up: true, t: (n, p) => `The cost of a ticket increases by ${num(p)}% to ${gbp(n)}. Work out the original cost.` },
  { up: false, kg: true, t: (n, p, N) => `${N}'s dog went on a diet and its weight fell by ${num(p)}% to ${num(n)} kg. What did the dog weigh before the diet?` },
  { up: false, t: (n, p) => `A shop's winter sale takes ${num(p)}% off everything. A pair of boots costs ${gbp(n)} in the sale. What was the original price?` },
  { up: true, count: true, t: (n, p) => `Visitor numbers at a castle rose by ${num(p)}% this year to ${num(n)}. How many visitors were there last year?` },
  { up: false, t: (n, p) => `The price of a games console is cut by ${num(p)}%. It now costs ${gbp(n)}. What did it cost before the price cut?` },
];

export const reverseWord = gen('rat-reverse-word', 'rat-reverse-percent', (rng, d) => {
  for (let i = 0; i < 400; i += 1) {
    const tpl = pick(rng, REV_CTX);
    const p = tpl.vat ? 20 : pick(rng, size(d, [10, 20, 25, 50, 30], [15, 12, 35, 8, 40, 5, 4], [12.5, 2.5, 17.5, 3.5, 7.5, 6, 32]));
    let orig;
    if (tpl.count) orig = int(rng, 20, 900) * size(d, 10, 4, 1) * 2;
    else if (tpl.kg) orig = int(rng, 10, 60) * 2;
    else if (tpl.big) orig = int(rng, 80, 400) * 10000;
    else orig = int(rng, size(d, 4, 10, 60), size(d, 40, 300, 4000)) * size(d, 500, 100, 10);
    const n = tidy(orig * mult(p, tpl.up ? 1 : -1));
    if (!Number.isInteger(n)) continue;
    if (tpl.kg && !hasDp(n, 1)) continue;
    const [N] = names(rng, 1);
    const money = !tpl.count && !tpl.kg;
    const fmt = money ? gbp : tpl.kg ? withUnit('kg') : (v) => num(v);
    const m = mult(p, tpl.up ? 1 : -1);
    const nn = tpl.kg ? n : n; // kg values are whole kg here
    const classic = n * mult(p, tpl.up ? -1 : 1); // "take the % off / add it on" the new price
    const vals = [classic, n * m, n / mult(p, tpl.up ? -1 : 1), n + (tpl.up ? -1 : 1) * p * (money ? 100 : 1), n / (p / 100), tpl.up ? n - (n * p) / 100 : n + (n * p) / 100];
    return {
      prompt: tpl.t(nn, p, N),
      answer: fmt(orig),
      distractors: money ? pvals(orig, vals) : dvals(orig, vals, fmt, { dp: tpl.kg ? 1 : 0, round: true }),
      typed: { kind: 'number', value: money ? orig / 100 : orig },
      calculator: d !== 'easy',
      solution: [
        `The original is 100%. After ${tpl.up ? `an increase of ${num(p)}%` : `a decrease of ${num(p)}%`} the new amount is ${num(tpl.up ? 100 + p : 100 - p)}% of the original.`,
        `So ${num(tpl.up ? 100 + p : 100 - p)}% $=$ ${fmt(n)}, i.e. original $\\times ${tnum(m)} =$ ${fmt(n)}.`,
        `Original $=$ ${fmt(n)} $\\div ${tnum(m)} =$ ${fmt(orig)}`,
        `Don't ${tpl.up ? 'take' : 'add'} ${num(p)}% of ${fmt(n)} ${tpl.up ? 'off' : 'on'}: that gives ${fmt(Math.round(classic * 100) / 100)}, because the ${num(p)}% was a percentage of the <b>original</b>, not of the new amount.`,
        `Answer: ${fmt(orig)}`,
      ],
    };
  }
  throw new Error('rev word');
}, { title: 'Reverse percentage: find the original amount', word: true });

export const reverseTwoStep = gen('rat-reverse-two-step', 'rat-reverse-percent', (rng, d) => {
  for (let i = 0; i < 400; i += 1) {
    const type = pick(rng, size(d, ['undo', 'undo', 'diff'], ['diff', 'undo', 'orig2'], ['orig2', 'diff', 'orig2']));
    const p1 = pick(rng, [10, 20, 25, 5, 15, 30, 40]);
    const p2 = type === 'diff' ? p1 : pick(rng, [10, 20, 25, 5, 15, 30]);
    const orig = int(rng, 4, 90) * 100 * pick(rng, [1, 1, 5]);
    const after1 = tidy(orig * mult(p1)); const after2 = tidy(after1 * mult(p2, -1));
    if (!Number.isInteger(after1) || !Number.isInteger(after2)) continue;
    const [N] = names(rng, 1);
    if (type === 'undo') {
      // given price after an increase; work out the original
      return {
        prompt: `${N} increases the price of each tie by ${p1}% to ${gbp(after1)}. Later, the ties go into a sale with ${p1}% off. What is the sale price of a tie?`,
        answer: gbp(Math.round(after1 * mult(p1, -1))),
        distractors: pvals(Math.round(after1 * mult(p1, -1)), [orig, after1 - (orig * p1) / 100, after1 * mult(p1, -1) + 100, orig * mult(p1, -1), after1]),
        typed: { kind: 'number', value: Math.round(after1 * mult(p1, -1)) / 100 },
        calculator: true,
        solution: [
          `The sale takes ${p1}% off the <b>increased</b> price, ${gbp(after1)}.`,
          `$${tnum(after1 / 100, after1 % 100 ? 2 : null)} \\times ${tnum(mult(p1, -1))} = ${tnum(Math.round(after1 * mult(p1, -1)) / 100, 2)}$`,
          `This is less than the original price, ${gbp(orig)} – the ${p1}% decrease is of a bigger amount than the ${p1}% increase was.`,
          `Answer: ${gbp(Math.round(after1 * mult(p1, -1)))}`,
        ],
      };
    }
    if (type === 'diff') {
      const sale = Math.round(after1 * mult(p1, -1));
      const ans = orig - sale;
      if (ans <= 0) continue;
      return {
        prompt: `${N} increases the price of a lamp by ${p1}% to ${gbp(after1)}. A month later there is a sale with ${p1}% off this price. How much less is the sale price than the price before the increase?`,
        answer: gbp(ans),
        distractors: pvals(ans, [0, (after1 * p1) / 100, (orig * p1) / 100, after1 - sale, ans * 10]).concat(['£0']).filter((t) => t !== gbp(ans)),
        typed: { kind: 'number', value: ans / 100 },
        calculator: true,
        solution: [
          `Original price: ${gbp(after1)} $\\div ${tnum(mult(p1))} =$ ${gbp(orig)} (reverse percentage).`,
          `Sale price: ${gbp(after1)} $\\times ${tnum(mult(p1, -1))} =$ ${gbp(sale)}.`,
          `Difference: ${gbp(orig)} $-$ ${gbp(sale)} $=$ ${gbp(ans)}. (It does not come back to the original price!)`,
          `Answer: ${gbp(ans)}`,
        ],
      };
    }
    // orig2: after an increase then a decrease the price is X. find the original
    return {
      prompt: `The price of a bike was increased by ${p1}%. Later the new price was reduced by ${p2}%. The bike now costs ${gbp(after2)}. What was the price before both changes?`,
      answer: gbp(orig),
      distractors: pvals(orig, [after2 * mult(p2) * mult(p1, -1), after2 / mult(p1 - p2), after2 * mult(p2 - p1), after2 / mult(p2, -1), after2 / mult(p1)]),
      typed: { kind: 'number', value: orig / 100 },
      calculator: true,
      solution: [
        `Original $\\times ${tnum(mult(p1))} \\times ${tnum(mult(p2, -1))} =$ ${gbp(after2)}`,
        `Combined multiplier: $${tnum(mult(p1))} \\times ${tnum(mult(p2, -1))} = ${tnum(tidy(mult(p1) * mult(p2, -1)))}$`,
        `Original $=$ ${gbp(after2)} $\\div ${tnum(tidy(mult(p1) * mult(p2, -1)))} =$ ${gbp(orig)}`,
        `Answer: ${gbp(orig)}`,
      ],
      longDecimalsOk: true,
    };
  }
  throw new Error('rev2');
}, { title: 'Reverse percentages over two changes' });

/* ================================================================== */
/* rat-compound-interest                                               */
/* ================================================================== */

export const compoundValue = gen('rat-compound-value', 'rat-compound-interest', (rng, d) => {
  const r = pick(rng, size(d, [2, 3, 4, 5, 10], [1.5, 2.5, 3.5, 4.5, 2, 6], [1.8, 2.4, 3.2, 0.75, 4.25, 1.25]));
  const n = int(rng, 2, size(d, 3, 6, 10));
  const P = int(rng, size(d, 5, 10, 20), size(d, 50, 150, 900)) * size(d, 10000, 5000, 1000);
  const ask = d === 'easy' ? 'total' : pick(rng, ['total', 'total', 'interest']);
  const total = Math.round(P * mult(r) ** n);
  const ans = ask === 'total' ? total : total - P;
  const simple = P + (P * r * n) / 100;
  const [N] = names(rng, 1);
  const prompt = pick(rng, [
    `${N} invests ${gbp(P)} in an account paying ${num(r)}% compound interest per year.`,
    `${gbp(P)} is put into a savings account. Compound interest is added at ${num(r)}% per annum.`,
    `${N} saves ${gbp(P)} in a bank account that pays ${num(r)}% per year compound interest.`,
  ]);
  return {
    prompt: `${prompt} ${ask === 'total' ? `Work out the amount in the account after ${n} years.` : `How much interest is earned in ${n} years?`} Give your answer to the nearest penny.`,
    answer: gbpF(ans),
    distractors: pvals(ans, ask === 'total' ? [simple, P * mult(r) ** (n - 1), P * mult(r) ** (n + 1), total - P, P * mult(r * n)] : [simple - P, total, P * mult(r) ** (n - 1) - P, (P * r) / 100, P * mult(r * 10) ** n - P]).map((t) => (/\.\d\d$/.test(t) ? t : `${t}.00`)),
    typed: { kind: 'number', value: ans / 100, tolerance: 0.005 },
    calculator: true,
    solution: [
      `Compound interest is added to the new total each year, so multiply by $${tnum(mult(r))}$ once for every year.`,
      `$${tnum(P / 100)} \\times ${tnum(mult(r))}^{${n}} = ${tnum(roundTo(P * mult(r) ** n / 100, 4))}\\ldots$`,
      ...(ask === 'interest' ? [`Interest $=$ ${gbpF(total)} $-$ ${gbpF(P)} $=$ ${gbpF(total - P)}`] : []),
      `(Simple interest would give only ${gbpF(ask === 'total' ? simple : simple - P)}.)`,
      `Answer: ${gbpF(ans)}`,
    ],
    longDecimalsOk: true,
  };
}, { title: 'Compound interest: value after n years' });

const DEP_CTX = [
  ['a new car', 'car'], ['a van', 'van'], ['a laptop', 'laptop'], ['a mobile phone', 'phone'], ['a motorbike', 'motorbike'],
  ['a boat', 'boat'], ['a caravan', 'caravan'], ['a tractor', 'tractor'], ['a coffee machine for a café', 'coffee machine'],
  ['an electric bike', 'e-bike'], ['a camera', 'camera'], ['a games console', 'console'], ['a delivery lorry', 'lorry'], ['a printer for an office', 'printer'],
];

export const depreciation = gen('rat-depreciation', 'rat-compound-interest', (rng, d) => {
  const [item, short] = pick(rng, DEP_CTX);
  const r = pick(rng, size(d, [10, 20, 25, 5], [12, 15, 8, 18, 30, 6], [12.5, 17.5, 22, 9, 14, 7.5]));
  const n = int(rng, 2, size(d, 3, 5, 6));
  const P = int(rng, 6, 99) * (['car', 'van', 'boat', 'caravan', 'tractor', 'lorry', 'motorbike'].includes(short) ? 50000 : 2000);
  const two = d === 'hard' && chance(rng, 0.5);
  const r1 = two ? pick(rng, [20, 25, 30, 35]) : r;
  const val = Math.round(two ? P * mult(r1, -1) * mult(r, -1) ** (n - 1) : P * mult(r, -1) ** n);
  const nearestPound = chance(rng, 0.5);
  const ans = nearestPound ? Math.round(val / 100) * 100 : val;
  const fmt = nearestPound ? gbp : gbpF;
  const lin = P * (1 - (r * n) / 100);
  const prompt = two
    ? `The value of ${item} is ${gbp(P)}. Its value decreases by ${r1}% in the first year and by ${num(r)}% in each of the next ${n - 1} years. Work out its value after ${n} years.`
    : `${cap(item)} is bought for ${gbp(P)}. Its value depreciates by ${num(r)}% each year. Work out its value after ${n} years.`;
  const m = mult(r, -1);
  const round = (v) => (nearestPound ? Math.round(v / 100) * 100 : Math.round(v));
  return {
    prompt: `${prompt} Give your answer to the nearest ${nearestPound ? 'pound' : 'penny'}.`,
    answer: fmt(ans),
    distractors: [...new Set([lin, P * mult(r) ** n, P * m ** (n - 1), P - P * m ** n, P * (r / 100) ** n * 0 + P * m ** (n + 1), two ? P * m ** n : P * mult(r * 0.5, -1) ** n].map(round))].filter((v) => v > 0 && v !== ans).map(fmt),
    typed: { kind: 'number', value: ans / 100, tolerance: nearestPound ? 0.5 : 0.005 },
    calculator: true,
    solution: [
      `A decrease of ${num(r)}% leaves ${num(100 - r)}%, so the multiplier is $${tnum(m)}$ for each year.`,
      two ? `Value $= ${tnum(P / 100)} \\times ${tnum(mult(r1, -1))} \\times ${tnum(m)}^{${n - 1}} = ${tnum(roundTo(val / 100, 2))}$` : `Value $= ${tnum(P / 100)} \\times ${tnum(m)}^{${n}} = ${tnum(roundTo(P * m ** n / 100, 4))}\\ldots$`,
      `Don't subtract ${num(r)}% of the <b>original</b> value every year – that would be ${gbp(lin)}.`,
      `Answer: ${fmt(ans)}`,
    ],
    longDecimalsOk: true,
  };
}, { title: 'Depreciation: repeated percentage decrease', word: true });

const GROWTH_CTX = [
  { up: true, rs: [[10, 20, 50, 25], [12, 15, 30, 8], [12.5, 17.5, 35, 7.5]], t: (N0, r, n) => `There are ${num(N0)} bacteria in a dish. The number increases by ${num(r)}% every hour. How many bacteria will there be after ${n} hours?` },
  { up: true, rs: [[10, 20, 5], [12, 8, 15], [12.5, 7.5, 13]], t: (N0, r, n) => `The number of butterflies in a park is ${num(N0)}. Assume the number increases by ${num(r)}% each day. How many butterflies will there be after ${n} days?` },
  { up: false, rs: [[5, 10, 2], [4, 3, 6], [2.5, 3.5, 4.5]], t: (N0, r, n) => `The number of hedgehogs in a county is expected to fall by ${num(r)}% each year. There are now ${num(N0)} hedgehogs. Work out the expected number after ${n} years.` },
  { up: true, rs: [[2, 5, 10], [3, 4, 1.5], [1.2, 2.5, 3.5]], t: (N0, r, n) => `A town has a population of ${num(N0)}. The population grows by ${num(r)}% each year. Estimate the population after ${n} years.` },
  { up: true, rs: [[10, 20, 25], [12, 15, 8], [7.5, 12.5, 18]], t: (N0, r, n) => `A rabbit colony has ${num(N0)} rabbits. The colony grows by ${num(r)}% every month. How many rabbits will there be after ${n} months?` },
  { up: true, rs: [[10, 20, 5], [6, 8, 12], [2.5, 7.5, 13]], t: (N0, r, n, N) => `${N}'s video channel has ${num(N0)} followers. The number of followers grows by ${num(r)}% each week. How many followers will there be after ${n} weeks?` },
  { up: false, rs: [[10, 20, 5], [8, 12, 15], [7.5, 12.5, 3.5]], t: (N0, r, n) => `A lake contains ${num(N0)} fish. Because of pollution the number falls by ${num(r)}% each year. How many fish will there be after ${n} years?` },
  { up: false, rs: [[10, 20], [8, 12, 15], [7.5, 12.5, 18]], t: (N0, r, n) => `A hot drink is ${num(N0)} °C above room temperature. This difference falls by ${num(r)}% every minute. What is the difference after ${n} minutes?`, unit: '°C', dp: 1 },
  { up: false, rs: [[10, 20, 5], [4, 8, 12], [2.5, 7.5, 13]], t: (N0, r, n) => `A radioactive sample has a mass of ${num(N0)} g. Its mass decreases by ${num(r)}% each day. What is its mass after ${n} days?`, unit: 'g', dp: 1 },
  { up: true, rs: [[10, 20, 50], [15, 12, 30], [17.5, 22.5, 35]], t: (N0, r, n) => `A weed covers ${num(N0)} m² of a pond. The area it covers increases by ${num(r)}% each week. What area will it cover after ${n} weeks?`, unit: 'm²', dp: 1 },
  { up: false, rs: [[2, 5, 10], [3, 4, 1.5], [1.5, 2.5, 3.5]], t: (N0, r, n) => `A village has ${num(N0)} residents. Its population is falling by ${num(r)}% a year as people move away. How many residents will there be after ${n} years?` },
  { up: true, rs: [[5, 10, 20], [4, 6, 8], [2.5, 7.5, 3.5]], t: (N0, r, n) => `A charity has ${num(N0)} volunteers. The number of volunteers rises by ${num(r)}% each year. How many volunteers will there be after ${n} years?` },
  { up: false, rs: [[10, 20, 5], [8, 12, 15], [7.5, 12.5, 17.5]], t: (N0, r, n) => `A forest has ${num(N0)} ash trees. Disease reduces the number by ${num(r)}% each year. How many ash trees will be left after ${n} years?` },
];

export const growthDecay = gen('rat-growth-decay', 'rat-compound-interest', (rng, d) => {
  const tpl = pick(rng, GROWTH_CTX);
  const r = pick(rng, size(d, ...tpl.rs));
  const n = int(rng, 2, size(d, 3, 6, 12));
  const N0 = tpl.unit ? int(rng, 20, 90) * (tpl.unit === 'g' ? 5 : 1) : int(rng, 12, 99) * pick(rng, [100, 1000, 50]);
  const m = mult(r, tpl.up ? 1 : -1);
  const exact = N0 * m ** n;
  const dp = tpl.dp ?? 0;
  const ans = roundTo(exact, dp);
  const fmt = tpl.unit ? withUnit(tpl.unit) : (v) => num(v);
  const [N] = names(rng, 1);
  const lin = N0 * (1 + ((tpl.up ? 1 : -1) * r * n) / 100);
  return {
    prompt: `${tpl.t(N0, r, n, N)} ${dp ? 'Give your answer to 1 decimal place.' : 'Give your answer to the nearest whole number.'}`,
    answer: fmt(ans),
    distractors: dvals(ans, [lin, N0 * m ** (n - 1), N0 * m ** (n + 1), N0 * mult(r, tpl.up ? -1 : 1) ** n, N0 * (r / 100) ** n * 0 + N0 * mult(r * 10, tpl.up ? 1 : -1) ** n, Math.abs(N0 - exact)], fmt, { dp, round: true }),
    typed: { kind: 'number', value: ans, tolerance: dp ? 0.05 : 0.5 },
    calculator: true,
    solution: [
      `Each ${tpl.up ? 'increase' : 'decrease'} of ${num(r)}% multiplies the amount by $${tnum(m)}$.`,
      `After ${n} steps: $${tnum(N0)} \\times ${tnum(m)}^{${n}} = ${tnum(roundTo(exact, 3))}\\ldots$`,
      `Round: ${fmt(ans)}.${lin > 0 ? ` (${tpl.up ? 'Adding' : 'Taking off'} ${num(r * n)}% in one go would give ${fmt(roundTo(lin, dp))} – the percentage is taken of a ${tpl.up ? 'bigger' : 'smaller'} amount each time.)` : ''}`,
      `Answer: ${fmt(ans)}`,
    ],
    longDecimalsOk: true,
  };
}, { title: 'Compound growth and decay of populations and quantities', word: true });

export const compoundMultiplier = gen('rat-compound-multiplier', 'rat-compound-interest', (rng, d) => {
  const r = pick(rng, size(d, [2, 3, 4, 5, 10], [1.5, 2.5, 6, 8, 12, 15], [0.5, 1.25, 3.5, 7.5, 2.75]));
  const n = int(rng, 2, size(d, 4, 6, 10));
  const up = chance(rng, 0.6);
  const P = int(rng, 2, 90) * 100;
  const m = mult(r, up ? 1 : -1);
  const ex = (s) => `$${tnum(P)} \\times ${s}$`;
  const ctx = up ? `${gbp(P * 100)} is invested at ${num(r)}% compound interest per year.` : `A machine worth ${gbp(P * 100)} loses ${num(r)}% of its value each year.`;
  return {
    prompt: `${ctx} Which calculation gives its value after ${n} years?`,
    answer: ex(`${tnum(m)}^{${n}}`),
    distractors: [
      ex(`${tnum(r / 100)}^{${n}}`), ex(`${tnum(m)} \\times ${n}`), ex(`${tnum(mult(r * 10, up ? 1 : -1))}^{${n}}`), ex(`${tnum(mult(r * n, up ? 1 : -1))}`),
      ex(`${tnum(mult(r, up ? -1 : 1))}^{${n}}`), ex(`${tnum(m)}^{${n - 1}}`),
    ],
    solution: [
      `${up ? 'Increasing' : 'Decreasing'} by ${num(r)}% means multiplying by $${tnum(m)}$.`,
      `This happens ${n} times, once each year, so multiply by $${tnum(m)}$ ${n} times: $${tnum(m)}^{${n}}$.`,
      up ? `$${tnum(P)} \\times ${tnum(mult(r * n))}$ would be simple interest, which ignores interest on the interest.` : `$${tnum(P)} \\times ${tnum(mult(r * n, -1))}$ would take ${num(r)}% of the <b>original</b> value off every year, but each year's loss is ${num(r)}% of the <b>current</b> value.`,
      `Answer: ${ex(`${tnum(m)}^{${n}}`)}`,
    ],
    longDecimalsOk: true,
  };
}, { title: 'Choose the calculation for compound change' });

export const compoundYears = gen('rat-compound-years', 'rat-compound-interest', (rng, d) => {
  for (let i = 0; i < 200; i += 1) {
    const up = d === 'easy' ? true : chance(rng, 0.6);
    const r = pick(rng, size(d, [5, 10, 20], [3, 4, 6, 8, 12], [2.5, 3.5, 1.5, 7, 15, 18]));
    const P = int(rng, 10, 90) * 10000;
    const factor = up ? pick(rng, [1.2, 1.25, 1.3, 1.5, 2]) : pick(rng, [0.8, 0.75, 0.5, 0.6, 0.9]);
    const target = Math.round(P * factor / 10000) * 10000;
    const m = mult(r, up ? 1 : -1);
    let n = 0; let v = P;
    while ((up ? v < target : v > target) && n < 60) { v *= m; n += 1; }
    if (n < 2 || n > 25) continue;
    // avoid near-ties
    if (Math.abs(v - target) / target < 0.002) continue;
    const vPrev = P * m ** (n - 1);
    const simpleN = Math.ceil(Math.abs(target - P) / (P * r / 100));
    const [N] = names(rng, 1);
    return {
      prompt: up
        ? `${N} invests ${gbp(P)} at ${num(r)}% compound interest per year. After how many whole years will the investment first be worth more than ${gbp(target)}?`
        : `A car is worth ${gbp(P)}. Its value falls by ${num(r)}% each year. After how many whole years will it first be worth less than ${gbp(target)}?`,
      answer: `${n} years`,
      distractors: dvals(n, [n - 1, n + 1, simpleN, n + 2, n - 2, Math.round(Math.abs(target - P) / P * 100 / r)], (x) => `${x} year${x === 1 ? '' : 's'}`, { dp: 0 }),
      typed: { kind: 'number', value: n },
      calculator: true,
      solution: [
        `Multiply by $${tnum(m)}$ year by year until the value ${up ? 'goes above' : 'drops below'} ${gbp(target)}.`,
        `After ${n - 1} years: $${tnum(P / 100)} \\times ${tnum(m)}^{${n - 1}} =$ ${gbpF(Math.round(vPrev))} – not yet.`,
        `After ${n} years: $${tnum(P / 100)} \\times ${tnum(m)}^{${n}} =$ ${gbpF(Math.round(v))} – ${up ? 'more' : 'less'} than ${gbp(target)}.`,
        `Answer: ${n} years`,
      ],
    };
  }
  throw new Error('years');
}, { title: 'How many years until a compound amount passes a target?' });

export const compoundFindRate = gen('rat-compound-find-rate', 'rat-compound-interest', (rng, d) => {
  for (let i = 0; i < 200; i += 1) {
    const r = pick(rng, size(d, [2, 3, 4, 5, 10], [1.5, 2.5, 3.5, 6, 2, 4], [1.2, 2.4, 3.2, 1.8, 4.5, 0.8]));
    const P = int(rng, 12, 400) * size(d, 10000, 1000, 100);
    const one = P * mult(r);
    if (!Number.isInteger(one)) continue;
    const mode = size(d, 'rate', pick(rng, ['rate', 'later']), pick(rng, ['later', 'later', 'rate']));
    if (mode === 'rate') {
      return {
        prompt: `${gbp(P)} is invested in an account paying compound interest. After one year there is ${gbp(one)} in the account. What is the annual rate of interest?`,
        answer: pct(r),
        distractors: dvals(r, [(one - P) / 100 < 50 ? tidy((one - P) / 100) : null, roundTo((100 * (one - P)) / one, 2), tidy(r * 10), tidy(mult(r) * 100), tidy(r / 10), tidy(r + 1)], pct, { dp: 2, round: true }),
        typed: { kind: 'number', value: r },
        calculator: true,
        solution: [`Interest in one year $=$ ${gbp(one)} $-$ ${gbp(P)} $=$ ${gbp(one - P)}.`, `As a percentage of the amount invested: $\\frac{${tnum((one - P) / 100)}}{${tnum(P / 100)}} \\times 100 = ${tnum(r)}\\%$`, `Answer: ${pct(r)}`],
      };
    }
    const n = int(rng, 3, 6);
    const ans = Math.round(P * mult(r) ** n);
    return {
      prompt: `${gbp(P)} is invested at a fixed rate of compound interest. One year after the investment there is ${gbp(one)} in the account. How much will be in the account ${n} years after the investment? Give your answer to the nearest penny.`,
      answer: gbpF(ans),
      distractors: pvals(ans, [P + (one - P) * n, one * n, P * mult(r) ** (n - 1), P * mult(r) ** (n + 1), one + (one - P) * n]).map((t) => (/\.\d\d$/.test(t) ? t : `${t}.00`)),
      typed: { kind: 'number', value: ans / 100, tolerance: 0.005 },
      calculator: true,
      solution: [
        `Find the multiplier: ${gbp(one)} $\\div$ ${gbp(P)} $= ${tnum(mult(r))}$ (so the rate is ${num(r)}%).`,
        `After ${n} years: $${tnum(P / 100)} \\times ${tnum(mult(r))}^{${n}} = ${tnum(roundTo(P * mult(r) ** n / 100, 4))}\\ldots$`,
        `Answer: ${gbpF(ans)}`,
      ],
      longDecimalsOk: true,
    };
  }
  throw new Error('find rate');
}, { title: 'Find the compound rate from one year, then project forward' });

export const percentGenerators = [
  percentOfNoCalc, percentOfCalc, percentOfWord, percentFromKnown,
  incDecNoCalc, pctMultiplier, incDecWord, successive,
  expressBasic, expressWord, expressCompare,
  simpleInterest, simpleInterestReverse,
  pctChangeBasic, pctChangeWord, pctChangeCompare,
  reverseBasic, reverseWord, reverseTwoStep,
  compoundValue, depreciation, growthDecay, compoundMultiplier, compoundYears, compoundFindRate,
];
