// Measures and rates unit: unit conversion, scales and maps, speed, density and pressure, area/volume units.
import {
  pick, int, chance, size, names, num, tnum, tidy, roundTo, cap, sample, shuffle, Frac,
} from '../../core.js';
import {
  withUnit, gbp, dvals, hasDp, hm, rgen as gen,
} from './helpers.js';

const isOne = (v) => Math.abs(v - 1) < 1e-12;

/* ================================================================== */
/* rat-unit-conversion                                                 */
/* ================================================================== */

// small unit, big unit, factor (small per big), names
const METRIC = [
  { s: 'mm', b: 'cm', F: 10 }, { s: 'cm', b: 'm', F: 100 }, { s: 'm', b: 'km', F: 1000 }, { s: 'mm', b: 'm', F: 1000, hard: true },
  { s: 'g', b: 'kg', F: 1000 }, { s: 'kg', b: 'tonnes', F: 1000, bOne: 'tonne' }, { s: 'ml', b: 'litres', F: 1000, bOne: 'litre' },
  { s: 'cl', b: 'litres', F: 100, bOne: 'litre' }, { s: 'ml', b: 'cl', F: 10 }, { s: 'cm', b: 'km', F: 100000, hard: true },
  { s: 'mg', b: 'g', F: 1000, hard: true },
];
const uName = (u, big, v) => (big && isOne(v) && u.bOne ? u.bOne : big ? u.b : u.s);

export const convertMetric = gen('rat-convert-metric', 'rat-unit-conversion', (rng, d) => {
  for (let i = 0; i < 200; i += 1) {
    const u = pick(rng, METRIC.filter((x) => (d === 'hard' ? true : !x.hard)));
    const toSmall = chance(rng, 0.5);
    // value in the big unit
    const big = size(d, int(rng, 1, 20) * pick(rng, [1, 1, 0.5]), int(rng, 1, 400) / pick(rng, [10, 100, 1]), int(rng, 1, 9999) / pick(rng, [100, 1000, 10]));
    const small = tidy(big * u.F);
    if (!hasDp(big, 3) || !hasDp(small, 2) || (small < 1 && d !== 'hard')) continue;
    const from = toSmall ? big : small; const ans = toSmall ? small : big;
    const fromU = toSmall ? uName(u, true, big) : u.s; const toU = toSmall ? u.s : uName(u, true, big);
    const others = [10, 100, 1000].filter((f) => f !== u.F);
    const wrong = [toSmall ? from / u.F : from * u.F, ...others.map((f) => (toSmall ? from * f : from / f)), toSmall ? from + u.F : null];
    const fmt = (v) => `${num(v)} ${toSmall ? u.s : (isOne(v) && u.bOne ? u.bOne : u.b)}`;
    return {
      prompt: pick(rng, [`Convert ${num(from)} ${fromU} to ${toU.replace(/^tonne$/, 'tonnes').replace(/^litre$/, 'litres')}.`, `Write ${num(from)} ${fromU} in ${toU.replace(/^tonne$/, 'tonnes').replace(/^litre$/, 'litres')}.`, `How many ${toU.replace(/^tonne$/, 'tonnes').replace(/^litre$/, 'litres')} are there in ${num(from)} ${fromU}?`]),
      answer: fmt(ans),
      distractors: dvals(ans, wrong, fmt, { dp: 3 }),
      typed: { kind: 'number', value: ans },
      solution: [
        `$1$ ${uName(u, true, 1)} $= ${tnum(u.F)}$ ${u.s}.`,
        toSmall ? `Going to a <b>smaller</b> unit gives a bigger number, so multiply by ${num(u.F)}: $${tnum(from)} \\times ${tnum(u.F)} = ${tnum(ans)}$` : `Going to a <b>bigger</b> unit gives a smaller number, so divide by ${num(u.F)}: $${tnum(from)} \\div ${tnum(u.F)} = ${tnum(ans)}$`,
        `Answer: ${fmt(ans)}`,
      ],
    };
  }
  throw new Error('metric');
}, { title: 'Convert metric units of length, mass and capacity' });

export const convertTime = gen('rat-convert-time', 'rat-unit-conversion', (rng, d) => {
  const type = pick(rng, size(d, ['dec2hm', 'hm2min', 'min2h'], ['dec2hm', 'hm2dec', 'min2dec', 'sec'], ['dec2hm', 'hm2dec', 'min2dec', 'sec', 'dayhours']));
  if (type === 'dec2hm' || type === 'hm2dec') {
    const h = int(rng, 0, size(d, 3, 5, 9));
    const m = pick(rng, size(d, [30, 15, 45], [6, 12, 15, 18, 24, 36, 45, 48, 54], [3, 9, 21, 27, 33, 39, 42, 51, 57]));
    const dec = tidy(h + m / 60);
    if (!hasDp(dec, 2)) return convertTime.build ? null : (() => { throw new Error('dp'); })();
    if (type === 'dec2hm') {
      const wrongM = Math.round((dec - h) * 100);
      const ans = hm(h * 60 + m);
      return {
        prompt: `Write ${num(dec)} hours in hours and minutes.`,
        answer: ans,
        distractors: [hm(h * 60 + wrongM), hm(h * 60 + Math.round((dec - h) * 10)), hm(h * 60 + m + 10), hm(Math.max(1, h * 60 + m - 10)), hm(h * 60 + Math.round(60 / ((dec - h) * 10 || 1)))].filter((t) => t !== ans),
        typed: undefined,
        solution: [
          `The decimal part is a fraction of an hour, not a number of minutes. $${tnum(tidy(dec - h))}$ of an hour $= ${tnum(tidy(dec - h))} \\times 60 = ${m}$ minutes.`,
          `So ${num(dec)} hours $=$ ${ans}. (It is <b>not</b> ${hm(h * 60 + wrongM)}!)`,
          `Answer: ${ans}`,
        ],
      };
    }
    const ansT = `${num(dec)} hours`;
    return {
      prompt: `Write ${hm(h * 60 + m)} as a decimal number of hours.`,
      answer: ansT,
      distractors: dvals(dec, [tidy(h + m / 100), tidy(h + m / 10), tidy(h + 60 / m), tidy(h + m / 60 + 0.1), tidy(dec - 0.05), roundTo(h + m / 100 + 0.1, 2)], (v) => `${num(roundTo(v, 2))} hours`, { dp: 2, round: true }),
      typed: { kind: 'number', value: dec },
      solution: [`${m} minutes $= \\frac{${m}}{60}$ of an hour $= ${tnum(tidy(m / 60))}$ hours.`, `So ${hm(h * 60 + m)} $= ${tnum(dec)}$ hours (not $${h}.${String(m).padStart(2, '0')}$).`, `Answer: ${ansT}`],
    };
  }
  if (type === 'hm2min' || type === 'min2h') {
    const h = int(rng, 1, 5); const m = int(rng, 1, 11) * 5;
    const tot = h * 60 + m;
    if (type === 'hm2min') {
      return {
        prompt: `How many minutes are there in ${hm(tot)}?`,
        answer: `${tot} minutes`,
        distractors: dvals(tot, [h * 100 + m, h * 10 + m, h + m, h * 60 - m, tot + 60], (v) => `${num(v)} minutes`, { dp: 0 }),
        typed: { kind: 'number', value: tot },
        solution: [`1 hour $= 60$ minutes, so ${h} hour${h > 1 ? 's' : ''} $= ${h} \\times 60 = ${h * 60}$ minutes.`, `$${h * 60} + ${m} = ${tot}$ minutes`, `Answer: ${tot} minutes`],
      };
    }
    return {
      prompt: `Write ${tot} minutes in hours and minutes.`,
      answer: hm(tot),
      distractors: [hm(Math.floor(tot / 100) * 60 + (tot % 100)), hm(tot + 10), hm(tot - 10), hm(Math.floor(tot / 60) * 60 + (tot % 60 + 30) % 60), hm((h + 1) * 60 + m)].filter((t) => t !== hm(tot)),
      solution: [`Take away whole hours of 60 minutes: $${tot} = ${h} \\times 60 + ${m}$.`, `So ${tot} minutes $=$ ${hm(tot)}.`, `Answer: ${hm(tot)}`],
    };
  }
  if (type === 'min2dec') {
    const m = pick(rng, [6, 12, 15, 18, 24, 30, 36, 42, 45, 48, 54, 9, 21, 33, 27]);
    const ans = tidy(m / 60);
    if (!hasDp(ans, 2)) throw new Error('dp');
    return {
      prompt: `Write ${m} minutes as a decimal of an hour.`,
      answer: `${num(ans)} hours`,
      distractors: dvals(ans, [m / 100, m / 10, 60 / m / 10, tidy(ans + 0.1), m / 1000 * 10], (v) => `${num(roundTo(v, 2))} hours`, { dp: 2, round: true }),
      typed: { kind: 'number', value: ans },
      solution: [`There are 60 minutes in an hour, so divide by 60.`, `$${m} \\div 60 = ${tnum(ans)}$`, `Answer: ${num(ans)} hours`],
    };
  }
  if (type === 'sec') {
    const mins = pick(rng, [1.5, 2.5, 3.5, 0.75, 4.25, 2.2, 1.8, 3.6]);
    const ans = tidy(mins * 60);
    return {
      prompt: `How many seconds are there in ${num(mins)} minutes?`,
      answer: `${num(ans)} seconds`,
      distractors: dvals(ans, [Math.floor(mins) * 60 + Math.round((mins % 1) * 100), mins * 100, Math.floor(mins) * 60 + Math.round((mins % 1) * 10), ans + 30, ans - 30], (v) => `${num(v)} seconds`, { dp: 0 }),
      typed: { kind: 'number', value: ans },
      solution: [`1 minute $= 60$ seconds.`, `$${tnum(mins)} \\times 60 = ${tnum(ans)}$`, `Answer: ${num(ans)} seconds`],
    };
  }
  // dayhours: hours in a number of days / weeks
  const days = pick(rng, [1.5, 2.5, 3, 4, 0.75, 1.25, 7, 14]);
  const ans = tidy(days * 24);
  return {
    prompt: `How many hours are there in ${num(days)} days?`,
    answer: `${num(ans)} hours`,
    distractors: dvals(ans, [days * 60, days * 12, Math.floor(days) * 24 + Math.round((days % 1) * 10), Math.floor(days) * 24 + Math.round((days % 1) * 100), ans + 12], (v) => `${num(v)} hours`, { dp: 0 }),
    typed: { kind: 'number', value: ans },
    solution: [`1 day $= 24$ hours.`, `$${tnum(days)} \\times 24 = ${tnum(ans)}$`, `Answer: ${num(ans)} hours`],
  };
}, { title: 'Time conversions, including decimal hours' });

const IMPERIAL = [
  { a: [8, 'km'], b: [5, 'miles'], vals: (rng) => int(rng, 2, 40) * 8, t: (v, from, to, f) => `Use $8$ km $= 5$ miles to convert ${num(v)} ${from} to ${to}.`, step: 8 },
  { r: [2, 40], a: [1, 'gallon', 'gallons'], b: [4.5, 'litres'], t: (v, from, to) => `Use $1$ gallon $= 4.5$ litres to convert ${num(v)} ${from} to ${to}.` },
  { r: [8, 30], a: [1, 'kg', 'kg'], b: [2.2, 'pounds'], t: (v, from, to) => `A suitcase weighs ${num(v)} ${from}. Use $1$ kg $= 2.2$ pounds to work out its weight in ${to}.` },
  { r: [24, 75], a: [1, 'inch', 'inches'], b: [2.54, 'cm'], t: (v, from, to) => `A TV screen is ${num(v)} ${from} wide. Use $1$ inch $= 2.54$ cm to write this in ${to}.` },
  { r: [2, 120], a: [1, 'mile', 'miles'], b: [1.6, 'km'], t: (v, from, to) => `Use $1$ mile $= 1.6$ km to convert ${num(v)} ${from} into ${to}.` },
  { r: [2, 16], a: [1, 'ounce', 'ounces'], b: [28, 'g'], t: (v, from, to) => `An old recipe uses ${num(v)} ${from} of butter. Use $1$ ounce $= 28$ g to write this in ${to}.` },
  { r: [2, 12], a: [1, 'pint', 'pints'], b: [0.57, 'litres'], t: (v, from, to) => `A milkman delivers ${num(v)} ${from} of milk. Use $1$ pint $= 0.57$ litres to write this in ${to}.` },
  { r: [6, 20], a: [1, 'foot', 'feet'], b: [30, 'cm'], t: (v, from, to) => `A shed is ${num(v)} ${from} long. Use $1$ foot $\\approx 30$ cm to write this in ${to}.` },
  { r: [1, 7], a: [1, 'stone', 'stone'], b: [6.35, 'kg'], t: (v, from, to) => `A dog weighs ${num(v)} ${from}. Use $1$ stone $= 6.35$ kg to write this in ${to}.` },
  { r: [100, 120], a: [1, 'yard', 'yards'], b: [0.9, 'm'], t: (v, from, to) => `A football pitch is ${num(v)} ${from} long. Use $1$ yard $\\approx 0.9$ m to write this in ${to}.` },
  { r: [5, 200], a: [1, 'acre', 'acres'], b: [0.4, 'hectares'], t: (v, from, to) => `A farm covers ${num(v)} ${from}. Use $1$ acre $\\approx 0.4$ hectares to write this in ${to}.` },
  { r: [1, 6], a: [1, 'litre', 'litres'], b: [1.76, 'pints'], t: (v, from, to) => `A jug holds ${num(v)} ${from}. Use $1$ litre $= 1.76$ pints to write this in ${to}.` },
];

export const convertImperial = gen('rat-convert-imperial', 'rat-unit-conversion', (rng, d) => {
  for (let i = 0; i < 200; i += 1) {
    const c = pick(rng, IMPERIAL);
    // easy: multiply by the factor; hard: work backwards (divide)
    const forward = d === 'easy' ? true : d === 'hard' ? false : chance(rng, 0.55); // a -> b
    const ratio = c.b[0] / c.a[0]; // b-units per a-unit
    // a sensible amount in the first unit (half-units allowed when hard)
    const aVal = () => (c.vals ? c.vals(rng) : d === 'hard' && c.r[1] <= 40 ? int(rng, c.r[0] * 2, c.r[1] * 2) / 2 : int(rng, c.r[0], c.r[1]));
    let from; let ans;
    if (forward) {
      from = aVal();
      ans = tidy(from * ratio);
    } else {
      // design the answer first so it is clean
      ans = aVal();
      from = tidy(ans * ratio);
      [ans, from] = [ans, from];
    }
    if (!hasDp(ans, 2) || !hasDp(from, 2)) continue;
    const aName = (v) => (isOne(v) ? c.a[1] : c.a[2] || c.a[1]);
    const fromU = forward ? aName(from) : c.b[1]; const toU = forward ? c.b[1] : (c.a[2] || c.a[1]);
    const fmt = (v) => `${num(v)} ${forward ? c.b[1] : aName(v)}`;
    const wrong = forward ? [from / ratio, from + ratio, from * ratio * 10, from * ratio / 10] : [from * ratio, from - ratio, ans * 10, ans / 10];
    return {
      prompt: c.t(from, fromU, toU),
      answer: fmt(ans),
      distractors: dvals(ans, wrong, fmt, { dp: 2, round: true }),
      typed: { kind: 'number', value: ans },
      calculator: d !== 'easy',
      solution: [
        c.a[0] === 1 ? `Each ${c.a[1]} is ${num(c.b[0])} ${c.b[1]}.` : `${c.a[0]} ${c.a[1]} $=$ ${c.b[0]} ${c.b[1]}, so 1 ${c.a[1]} $= ${tnum(ratio)}$ ${c.b[1]}.`,
        forward ? `Multiply: $${tnum(from)} \\times ${tnum(ratio)} = ${tnum(ans)}$` : `Divide: $${tnum(from)} \\div ${tnum(ratio)} = ${tnum(ans)}$`,
        `Answer: ${fmt(ans)}`,
      ],
    };
  }
  throw new Error('imperial');
}, { title: 'Convert using a given conversion factor' });

const CONV_WORD = [
  { t: (a, b) => `A bottle holds ${num(a)} litres of lemonade. How many ${b} ml glasses can be filled completely from the bottle?`, mk: (rng) => { const b = pick(rng, [150, 200, 250, 300, 330]); const a = pick(rng, [1.5, 2, 3, 2.5]); return { a, b, ans: Math.floor((a * 1000) / b), q: tidy((a * 1000) / b), how: `$${tnum(a)}$ litres $= ${tnum(a * 1000)}$ ml, and $${tnum(a * 1000)} \\div ${b} = ${tnum(roundTo((a * 1000) / b, 2))}$`, unit: 'glasses', floor: true }; } },
  { t: (a, b) => `A roll of ribbon is ${num(a)} m long. It is cut into pieces ${b} cm long. How many pieces can be cut?`, mk: (rng) => { const b = pick(rng, [15, 20, 25, 30, 40, 35, 45]); const a = pick(rng, [2, 3, 5, 4.5, 6]); return { a, b, ans: Math.floor((a * 100) / b), q: tidy((a * 100) / b), how: `$${tnum(a)}$ m $= ${tnum(a * 100)}$ cm, and $${tnum(a * 100)} \\div ${b} = ${tnum(roundTo((a * 100) / b, 2))}$`, unit: 'pieces', floor: true }; } },
  { t: (a, b) => `A baker has a ${num(a)} kg bag of flour. Each loaf needs ${b} g of flour. How many loaves can she make?`, mk: (rng) => { const b = pick(rng, [350, 400, 450, 500, 600]); const a = pick(rng, [5, 8, 10, 12.5, 16]); return { a, b, ans: Math.floor((a * 1000) / b), q: tidy((a * 1000) / b), how: `$${tnum(a)}$ kg $= ${tnum(a * 1000)}$ g, and $${tnum(a * 1000)} \\div ${b} = ${tnum(roundTo((a * 1000) / b, 2))}$`, unit: 'loaves', floor: true }; } },
  { t: (a, b) => `A bottle of medicine contains ${num(a)} litres. One dose is ${b} ml. How many doses are in the bottle?`, mk: (rng) => { const b = pick(rng, [5, 10, 2.5, 7.5]); const a = pick(rng, [0.1, 0.15, 0.2, 0.25, 0.3]); return { a, b, ans: Math.floor(tidy((a * 1000) / b)), q: tidy(tidy((a * 1000) / b)), how: `$${tnum(a)}$ litres $= ${tnum(a * 1000)}$ ml, and $${tnum(a * 1000)} \\div ${tnum(b)} = ${tnum(roundTo((a * 1000) / b, 2))}$`, unit: 'doses', floor: true }; } },
  { t: (a, b) => `A lorry can carry ${num(a)} tonnes. How many ${b} kg sacks of cement can it carry?`, mk: (rng) => { const b = pick(rng, [25, 40, 50]); const a = pick(rng, [2, 3.5, 4, 7.5, 10]); return { a, b, ans: Math.floor((a * 1000) / b), q: tidy((a * 1000) / b), how: `$${tnum(a)}$ tonnes $= ${tnum(a * 1000)}$ kg, and $${tnum(a * 1000)} \\div ${b} = ${tnum(roundTo((a * 1000) / b, 2))}$`, unit: 'sacks', floor: true }; } },
  { t: (a, b) => `A runner does ${b} laps of a ${num(a)} m track. How many kilometres does she run?`, mk: (rng) => { const a = pick(rng, [400, 250, 200]); const b = int(rng, 5, 30); return { a, b, ans: tidy((a * b) / 1000), how: `$${b} \\times ${a} = ${tnum(a * b)}$ m, and $${tnum(a * b)} \\div 1000 = ${tnum(tidy((a * b) / 1000))}$ km`, unit: 'km' }; } },
  { t: (a, b) => `A recipe needs ${num(a)} g of sugar for one cake. How many kilograms of sugar are needed for ${b} cakes?`, mk: (rng) => { const a = pick(rng, [125, 150, 175, 200, 225, 250]); const b = int(rng, 4, 24); return { a, b, ans: tidy((a * b) / 1000), how: `$${b} \\times ${a} = ${tnum(a * b)}$ g, and $${tnum(a * b)} \\div 1000 = ${tnum(tidy((a * b) / 1000))}$ kg`, unit: 'kg' }; } },
  { t: (a, b) => `A tap drips ${num(a)} ml of water every minute. How many litres of water does it waste in ${b} hours?`, mk: (rng) => { const a = pick(rng, [5, 10, 15, 20, 25]); const b = pick(rng, [2, 4, 5, 8, 10, 24]); return { a, b, ans: tidy((a * 60 * b) / 1000), how: `${b} hours $= ${b * 60}$ minutes, $${b * 60} \\times ${a} = ${tnum(a * 60 * b)}$ ml $= ${tnum(tidy((a * 60 * b) / 1000))}$ litres`, unit: 'litres' }; } },
  { t: (a, b) => `A fence is ${num(a)} m long. Fence posts are placed every ${b} cm along it, including one at each end. How many posts are there?`, mk: (rng) => { const b = pick(rng, [50, 75, 125, 150, 200, 250]); const a = (b / 100) * int(rng, 4, 20); return { a, b, ans: Math.round((a * 100) / b) + 1, how: `$${tnum(a)}$ m $= ${tnum(a * 100)}$ cm, $${tnum(a * 100)} \\div ${b} = ${Math.round((a * 100) / b)}$ gaps, so ${Math.round((a * 100) / b) + 1} posts`, unit: 'posts', plusOne: true }; } },
  { t: (a, b) => `${b} people each drink a ${num(a)} ml carton of juice. How many litres of juice is this altogether?`, mk: (rng) => { const a = pick(rng, [200, 250, 330, 150]); const b = int(rng, 6, 40); return { a, b, ans: tidy((a * b) / 1000), how: `$${b} \\times ${a} = ${tnum(a * b)}$ ml $= ${tnum(tidy((a * b) / 1000))}$ litres`, unit: 'litres' }; } },
  { t: (a, b) => `A parcel weighs ${num(a)} kg. The packaging weighs ${b} g. What is the weight of the contents in grams?`, mk: (rng) => { const a = int(rng, 12, 95) / 10; const b = int(rng, 15, 90) * 5; return { a, b, ans: tidy(a * 1000 - b), how: `$${tnum(a)}$ kg $= ${tnum(a * 1000)}$ g, and $${tnum(a * 1000)} - ${b} = ${tnum(tidy(a * 1000 - b))}$ g`, unit: 'g' }; } },
  { t: (a, b) => `A school minibus uses ${num(a)} litres of fuel on each trip. How many complete trips can it make with a full ${b} litre tank?`, mk: (rng) => { const a = pick(rng, [2.5, 3.5, 4.5, 5.5, 6.5]); const b = pick(rng, [50, 60, 70, 80]); return { a, b, ans: Math.floor(b / a), q: tidy(b / a), how: `$${b} \\div ${tnum(a)} = ${tnum(roundTo(b / a, 2))}$`, unit: 'trips', floor: true }; } },
  { t: (a, b) => `A sheet of paper is ${num(a)} mm thick. How many centimetres tall is a stack of ${b} sheets?`, mk: (rng) => { const a = pick(rng, [0.1, 0.05, 0.08, 0.12]); const b = pick(rng, [250, 500, 1000, 2500]); return { a, b, ans: tidy((a * b) / 10), how: `$${b} \\times ${tnum(a)} = ${tnum(tidy(a * b))}$ mm $= ${tnum(tidy((a * b) / 10))}$ cm`, unit: 'cm' }; } },
];

export const convertWord = gen('rat-convert-word', 'rat-unit-conversion', (rng, d) => {
  for (let i = 0; i < 200; i += 1) {
    // easy: a single conversion; medium: convert then divide; hard: several steps or awkward units
    const c = CONV_WORD[pick(rng, size(d, [5, 9, 6, 10, 0], [1, 2, 4, 11, 7], [3, 8, 12, 7, 4]))];
    const m = c.mk(rng);
    if (!hasDp(m.ans, 2) || m.ans <= 0) continue;
    if (m.floor && Number.isInteger(tidy((typeof m.a === 'number' ? 1 : 1) * m.ans)) && d === 'hard' && chance(rng, 0.3)) continue;
    const fmt = withUnit(m.unit);
    const exact = m.floor ? null : m.ans;
    const vals = m.floor
      ? [m.ans + 1, m.ans - 1, m.ans * 10, Math.floor(m.ans / 10), m.ans + 2]
      : m.plusOne ? [m.ans - 1, m.ans + 1, (m.ans - 1) * 10, m.ans - 2]
        : [m.ans * 10, m.ans / 10, m.ans * 100, m.ans / 100, m.ans + 1];
    return {
      prompt: c.t(m.a, m.b),
      answer: fmt(m.ans),
      distractors: dvals(m.ans, vals, fmt, { dp: 3 }),
      typed: { kind: 'number', value: m.ans },
      calculator: d === 'hard',
      solution: [
        'First make the units match.',
        m.how + (m.floor ? '.' : '.'),
        ...(m.floor && !Number.isInteger(m.q) ? [`Only <b>complete</b> ones count, so round down: ${m.ans}.`] : []),
        `Answer: ${fmt(m.ans)}`,
      ],
    };
    void exact;
  }
  throw new Error('conv word');
}, { title: 'Unit conversions in practical problems', word: true });

/* ================================================================== */
/* rat-scales-maps                                                     */
/* ================================================================== */

const SCALES = [10000, 20000, 25000, 50000, 40000, 100000, 200000, 250000, 500000, 1000000];
const spaced = (n) => num(n).replace(/,/g, ' '); // map scales are written 1 : 25 000

export const scaleRatioMap = gen('rat-scale-ratio-map', 'rat-scales-maps', (rng, d) => {
  for (let i = 0; i < 200; i += 1) {
    const n = pick(rng, size(d, [10000, 50000, 100000, 1000000], SCALES, SCALES));
    const toReal = chance(rng, 0.6);
    const mapCm = size(d, int(rng, 1, 15), int(rng, 12, 150) / 10, int(rng, 12, 250) / 10);
    const realCm = tidy(mapCm * n);
    const km = tidy(realCm / 100000); const m = tidy(realCm / 100);
    const inKm = km >= 1 || chance(rng, 0.3);
    const realVal = inKm ? km : m; const realU = inKm ? 'km' : 'm';
    if (!hasDp(realVal, 2)) continue;
    const place = pick(rng, ['two villages', 'two churches', 'a castle and a lighthouse', 'two campsites', 'a farm and a station', 'two bus stops', 'two hilltops', 'a school and a library']);
    if (toReal) {
      const fmt = withUnit(realU);
      const wrong = [realCm / 1000, realCm / 10000, realCm / 1000000, realVal * 10, realVal / 10, inKm ? m : km * 1000 / 10];
      return {
        prompt: `A map has a scale of $1 : ${tnum(n).replace(/\{,\}/g, '\\,')}$. The distance between ${place} on the map is ${num(mapCm)} cm. What is the real distance in ${realU === 'km' ? 'kilometres' : 'metres'}?`,
        answer: fmt(realVal),
        distractors: dvals(realVal, wrong, fmt, { dp: 3 }),
        typed: { kind: 'number', value: realVal },
        calculator: d === 'hard',
        solution: [
          `$1 : ${spaced(n).replace(/ /g, '\\,')}$ means 1 cm on the map is ${num(n)} cm in real life.`,
          `Real distance $= ${tnum(mapCm)} \\times ${tnum(n)} = ${tnum(realCm)}$ cm.`,
          inKm ? `$100$ cm $= 1$ m and $1000$ m $= 1$ km, so divide by $100\\,000$: $${tnum(realCm)} \\div 100\\,000 = ${tnum(km)}$ km.` : `Divide by 100 to get metres: $${tnum(realCm)} \\div 100 = ${tnum(m)}$ m.`,
          `Answer: ${fmt(realVal)}`,
        ],
      };
    }
    const fmt = withUnit('cm');
    return {
      prompt: `A map has a scale of $1 : ${tnum(n).replace(/\{,\}/g, '\\,')}$. The real distance between ${place} is ${num(realVal)} ${realU}. How far apart are they on the map, in centimetres?`,
      answer: fmt(mapCm),
      distractors: dvals(mapCm, [mapCm * 10, mapCm / 10, mapCm * 100, mapCm / 100, realVal / n * 1000, mapCm * 1000], fmt, { dp: 4 }),
      typed: { kind: 'number', value: mapCm },
      calculator: d === 'hard',
      solution: [
        `Change the real distance into cm: ${num(realVal)} ${realU} $= ${tnum(realCm)}$ cm.`,
        `Each 1 cm on the map is ${num(n)} cm in real life, so divide: $${tnum(realCm)} \\div ${tnum(n)} = ${tnum(mapCm)}$ cm.`,
        `Answer: ${fmt(mapCm)}`,
      ],
    };
  }
  throw new Error('map');
}, { title: 'Map scales written as a ratio 1 : n' });

export const scaleCmRepresents = gen('rat-scale-cm-represents', 'rat-scales-maps', (rng, d) => {
  for (let i = 0; i < 200; i += 1) {
    const [rep, ru] = pick(rng, [[5, 'km'], [2, 'km'], [10, 'km'], [100, 'km'], [200, 'm'], [50, 'm'], [500, 'm'], [20, 'km'], [25, 'km'], [4, 'm'], [1.5, 'm'], [3, 'km']]);
    const toReal = chance(rng, 0.6);
    const mapCm = size(d, int(rng, 2, 12), int(rng, 5, 60) / 2, int(rng, 12, 95) / 10);
    const real = tidy(mapCm * rep);
    if (!hasDp(real, 2)) continue;
    const what = pick(rng, ru === 'km' ? (real >= 5 ? ['a road', 'a river', 'a railway line', 'a canal', 'a stretch of coastline', 'a cycle route', 'a motorway'] : ['a lake', 'a runway', 'a beach', 'a nature trail', 'a reservoir', 'a forest path']) : ['a garden', 'a footpath', 'a park', 'a playing field', 'a car park', 'a school field', 'a pond']);
    const fmtR = withUnit(ru);
    const fmtM = withUnit('cm');
    if (toReal) {
      return {
        prompt: `On a map, 1 cm represents ${num(rep)} ${ru}. ${cap(what)} is ${num(mapCm)} cm long on the map. How long is it in real life?`,
        answer: fmtR(real),
        distractors: dvals(real, [mapCm + rep, rep / mapCm, real * 10, real / 10, mapCm * rep * 100], fmtR, { dp: 2, round: true }),
        typed: { kind: 'number', value: real },
        solution: [`Every 1 cm on the map is ${num(rep)} ${ru}.`, `$${tnum(mapCm)} \\times ${tnum(rep)} = ${tnum(real)}$`, `Answer: ${fmtR(real)}`],
      };
    }
    return {
      prompt: `On a map, 1 cm represents ${num(rep)} ${ru}. ${cap(what)} is ${num(real)} ${ru} long in real life. How long is it on the map?`,
      answer: fmtM(mapCm),
      distractors: dvals(mapCm, [real * rep, real - rep, mapCm * 10, mapCm / 10, mapCm * 2], fmtM, { dp: 2, round: true }),
      typed: { kind: 'number', value: mapCm },
      solution: [`Every ${num(rep)} ${ru} in real life is 1 cm on the map.`, `$${tnum(real)} \\div ${tnum(rep)} = ${tnum(mapCm)}$`, `Answer: ${fmtM(mapCm)}`],
    };
  }
  throw new Error('cm rep');
}, { title: 'Scales like 1 cm represents 5 km' });

export const scaleAsRatio = gen('rat-scale-as-ratio', 'rat-scales-maps', (rng, d) => {
  const reverse = d !== 'easy' && chance(rng, 0.4);
  const ru = pick(rng, ['km', 'km', 'm']);
  const rep = ru === 'km' ? pick(rng, [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 40, 50, 1.5, 2.5, 0.5]) : pick(rng, [2, 3, 4, 5, 10, 20, 25, 40, 50, 75, 100, 150, 200, 250, 400, 500]);
  const mult = ru === 'km' ? 100000 : 100;
  const n = tidy(rep * mult);
  const r = (v) => `$1 : ${tnum(v).replace(/\{,\}/g, '\\,')}$`;
  if (!reverse) {
    return {
      prompt: `A map uses the scale 1 cm represents ${num(rep)} ${ru}. Write this scale as a ratio in the form $1 : n$.`,
      answer: r(n),
      distractors: [n / 10, n * 10, n / 100, n / 1000, rep, n * 100].filter((v) => v !== n && v >= 1).map(r),
      solution: [
        `Both parts of a ratio must be in the same units – use cm.`,
        `${num(rep)} ${ru} $= ${tnum(rep)} \\times ${tnum(mult)} = ${tnum(n)}$ cm.`,
        `So 1 cm represents ${num(n)} cm: ${r(n)}.`,
        `Answer: ${r(n)}`,
      ],
    };
  }
  const fmt = (v) => `1 cm represents ${num(v)} ${ru}`;
  return {
    prompt: `A map has a scale of ${r(n)}. Which of these is the same scale?`,
    answer: fmt(rep),
    distractors: [rep * 10, rep / 10, rep * 100, rep / 100, rep * 1000].filter((v) => v !== rep && hasDp(v, 3)).map(fmt),
    solution: [
      `${r(n)} means 1 cm on the map is ${num(n)} cm in real life.`,
      ru === 'km' ? `${num(n)} cm $= ${tnum(n / 100)}$ m $= ${tnum(rep)}$ km.` : `${num(n)} cm $= ${tnum(rep)}$ m.`,
      `Answer: ${fmt(rep)}`,
    ],
  };
}, { title: 'Write a map scale as a ratio, and back' });

const DRAW_CTX = [
  { what: 'a model car', real: [3.2, 4.8], realU: 'm', scales: [18, 24, 32, 43], t: (n, v, toReal) => (toReal ? `A model car is made to a scale of $1 : ${n}$. The model is ${num(v)} cm long. How long is the real car, in metres?` : `A model of a car is made to a scale of $1 : ${n}$. The real car is ${num(v)} m long. How long is the model, in centimetres?`) },
  { what: 'a dolls’ house', real: [6, 12], realU: 'm', scales: [12, 24, 16], t: (n, v, toReal) => (toReal ? `A dolls’ house is built to a scale of $1 : ${n}$. A room in the dolls’ house is ${num(v)} cm wide. How wide would the real room be, in metres?` : `A dolls’ house is built to a scale of $1 : ${n}$. A real room is ${num(v)} m wide. How wide is the dolls’ house room, in centimetres?`) },
  { what: 'a plan of a house', real: [3, 12], realU: 'm', scales: [50, 100, 20, 40], t: (n, v, toReal) => (toReal ? `An architect’s plan is drawn to a scale of $1 : ${n}$. A wall on the plan is ${num(v)} cm long. How long is the real wall, in metres?` : `An architect draws a plan to a scale of $1 : ${n}$. A real wall is ${num(v)} m long. How long is it on the plan, in centimetres?`) },
  { what: 'a model railway', real: [15, 25], realU: 'm', scales: [76, 87, 148, 160], t: (n, v, toReal) => (toReal ? `A model train is made to a scale of $1 : ${n}$. A model carriage is ${num(v)} cm long. How long is the real carriage, in metres?` : `A model railway uses a scale of $1 : ${n}$. A real carriage is ${num(v)} m long. How long is the model carriage, in centimetres?`) },
  { what: 'a model aeroplane', real: [20, 70], realU: 'm', scales: [72, 100, 144, 200], t: (n, v, toReal) => (toReal ? `A model aeroplane is made to a scale of $1 : ${n}$. Its wingspan is ${num(v)} cm. What is the wingspan of the real aeroplane, in metres?` : `A model aeroplane is made to a scale of $1 : ${n}$. The real wingspan is ${num(v)} m. What is the model’s wingspan, in centimetres?`) },
  { what: 'a garden plan', real: [5, 30], realU: 'm', scales: [100, 200, 50, 250], t: (n, v, toReal) => (toReal ? `A garden designer draws a plan to a scale of $1 : ${n}$. A path on the plan is ${num(v)} cm long. How long is the real path, in metres?` : `A garden plan uses a scale of $1 : ${n}$. A real flower bed is ${num(v)} m long. How long is it on the plan, in centimetres?`) },
  { what: 'a model ship', real: [40, 200], realU: 'm', scales: [200, 350, 400, 500], t: (n, v, toReal) => (toReal ? `A model ship is built to a scale of $1 : ${n}$. The model is ${num(v)} cm long. How long is the real ship, in metres?` : `A model ship is built to a scale of $1 : ${n}$. The real ship is ${num(v)} m long. How long is the model, in centimetres?`) },
  { what: 'a statue', real: [2, 6], realU: 'm', scales: [10, 20, 25, 8], t: (n, v, toReal) => (toReal ? `A small copy of a statue is made to a scale of $1 : ${n}$. The copy is ${num(v)} cm tall. How tall is the real statue, in metres?` : `A sculptor makes a copy of a statue at a scale of $1 : ${n}$. The real statue is ${num(v)} m tall. How tall is the copy, in centimetres?`) },
  { what: 'a classroom plan', real: [6, 10], realU: 'm', scales: [50, 100, 25], t: (n, v, toReal) => (toReal ? `A plan of a classroom has a scale of $1 : ${n}$. The classroom is ${num(v)} cm long on the plan. How long is the real classroom, in metres?` : `A plan of a classroom has a scale of $1 : ${n}$. The classroom is ${num(v)} m long. How long is it on the plan, in centimetres?`) },
  { what: 'a model bridge', real: [100, 600], realU: 'm', scales: [500, 1000, 2000], t: (n, v, toReal) => (toReal ? `A model of a bridge is made to a scale of $1 : ${n}$. The model is ${num(v)} cm long. How long is the real bridge, in metres?` : `A model of a bridge is made to a scale of $1 : ${n}$. The real bridge is ${num(v)} m long. How long is the model, in centimetres?`) },
  { what: 'a model dinosaur', real: [8, 25], realU: 'm', scales: [20, 40, 50], t: (n, v, toReal) => (toReal ? `A museum shop sells a model dinosaur at a scale of $1 : ${n}$. The model is ${num(v)} cm long. How long was the real dinosaur, in metres?` : `A museum makes a model dinosaur at a scale of $1 : ${n}$. The real dinosaur was ${num(v)} m long. How long is the model, in centimetres?`) },
  { what: 'a football pitch drawing', real: [90, 120], realU: 'm', scales: [500, 1000, 400], t: (n, v, toReal) => (toReal ? `A coach draws a football pitch to a scale of $1 : ${n}$. The pitch is ${num(v)} cm long on the drawing. How long is the real pitch, in metres?` : `A coach draws a football pitch to a scale of $1 : ${n}$. The real pitch is ${num(v)} m long. How long is it on the drawing, in centimetres?`) },
];

export const scaleDrawing = gen('rat-scale-drawing', 'rat-scales-maps', (rng, d) => {
  for (let i = 0; i < 300; i += 1) {
    const c = pick(rng, DRAW_CTX);
    const n = pick(rng, c.scales);
    if (d === 'hard' && chance(rng, 0.5)) {
      // area from a plan (sides scale by n, area by n^2)
      const n2 = pick(rng, [20, 40, 50, 100]);
      const w = int(rng, 4, 20) / 2; const l = int(rng, 6, 30) / 2;
      const rw = tidy((w * n2) / 100); const rl = tidy((l * n2) / 100);
      const area = tidy(rw * rl);
      if (!hasDp(area, 2) || w === l) continue;
      const room = pick(rng, ['bedroom', 'kitchen', 'living room', 'classroom', 'garage', 'patio']);
      return {
        prompt: `A plan has a scale of $1 : ${n2}$. On the plan, a ${room} is a rectangle measuring ${num(w)} cm by ${num(l)} cm. Work out the real area of the ${room} in m².`,
        answer: `${num(area)} m²`,
        distractors: dvals(area, [tidy((w * l * n2) / 10000), tidy(w * l * n2 * n2 / 1000000), tidy(area * 100), tidy(w * l * n2 / 100), tidy(area / 10), tidy(2 * (rw + rl))], (v) => `${num(v)} m²`, { dp: 3, round: true }),
        typed: { kind: 'number', value: area },
        calculator: true,
        solution: [
          `Find the real lengths first: $${tnum(w)} \\times ${n2} = ${tnum(w * n2)}$ cm $= ${tnum(rw)}$ m and $${tnum(l)} \\times ${n2} = ${tnum(l * n2)}$ cm $= ${tnum(rl)}$ m.`,
          `Area $= ${tnum(rw)} \\times ${tnum(rl)} = ${tnum(area)}$ m²`,
          `(Multiplying the plan area by ${n2} is wrong – areas scale by $${n2}^2$.)`,
          `Answer: ${num(area)} m²`,
        ],
      };
    }
    const toReal = d === 'easy' ? true : chance(rng, 0.55);
    const realM = tidy(roundTo(c.real[0] + rng() * (c.real[1] - c.real[0]), d === 'easy' ? 0 : 1));
    const modelCm = tidy((realM * 100) / n);
    if (!hasDp(modelCm, 1)) continue;
    const ans = toReal ? realM : modelCm;
    const fmt = withUnit(toReal ? 'm' : 'cm');
    const wrong = toReal ? [modelCm * n, modelCm * n / 1000, modelCm * n / 10, modelCm / n * 100, realM * 10] : [realM / n, realM * n, modelCm * 10, modelCm / 10, realM * 1000 / n];
    return {
      prompt: c.t(n, toReal ? modelCm : realM, toReal),
      answer: fmt(ans),
      distractors: dvals(ans, wrong, fmt, { dp: 3, round: true }),
      typed: { kind: 'number', value: ans },
      calculator: d !== 'easy',
      solution: toReal
        ? [`Real length $= ${n} \\times$ model length: $${tnum(modelCm)} \\times ${n} = ${tnum(tidy(modelCm * n))}$ cm.`, `Change to metres: $${tnum(tidy(modelCm * n))} \\div 100 = ${tnum(realM)}$ m.`, `Answer: ${fmt(ans)}`]
        : [`Change the real length to cm: ${num(realM)} m $= ${tnum(tidy(realM * 100))}$ cm.`, `Model length $=$ real length $\\div ${n}$: $${tnum(tidy(realM * 100))} \\div ${n} = ${tnum(modelCm)}$ cm.`, `Answer: ${fmt(ans)}`],
    };
  }
  throw new Error('drawing');
}, { title: 'Scale drawings and models', word: true, learn: ['rat-scales-maps', 'rat-area-volume-units'] });

export const scaleFind = gen('rat-scale-find', 'rat-scales-maps', (rng, d) => {
  for (let i = 0; i < 200; i += 1) {
    const n = pick(rng, d === 'easy' ? [1000, 2000, 5000, 10000, 50000, 100000] : [500, 2000, 2500, 5000, 20000, 25000, 40000, 50000, 200000, 250000]);
    if (d === 'hard' && chance(rng, 0.6)) {
      // PQ = a cm, QR = b cm on drawing, real QR - PQ = diff metres
      const a = int(rng, 4, 16) / 2; const b = a + int(rng, 2, 10) / 2;
      const diff = tidy(((b - a) * n) / 100);
      if (!hasDp(diff, 1)) continue;
      return {
        prompt: `On a scale drawing, PQ $= ${tnum(a)}$ cm and QR $= ${tnum(b)}$ cm. The real distance QR is ${num(diff)} metres more than the real distance PQ. Work out the scale of the drawing in the form $1 : n$.`,
        answer: `$1 : ${tnum(n).replace(/\{,\}/g, '\\,')}$`,
        distractors: [n / 10, n * 10, n / 100, n * 2, n / 2, tidy(diff / (b - a)), tidy((diff * 100) / b), tidy((diff * 100) / a)].filter((v) => v !== n && v > 1 && hasDp(v, 0)).map((v) => `$1 : ${tnum(v).replace(/\{,\}/g, '\\,')}$`),
        calculator: true,
        solution: [
          `On the drawing, QR is $${tnum(b)} - ${tnum(a)} = ${tnum(b - a)}$ cm longer than PQ.`,
          `So ${num(b - a)} cm on the drawing represents ${num(diff)} m $= ${tnum(diff * 100)}$ cm.`,
          `1 cm represents $${tnum(diff * 100)} \\div ${tnum(b - a)} = ${tnum(n)}$ cm, so the scale is $1 : ${tnum(n).replace(/\{,\}/g, '\\,')}$.`,
          `Answer: $1 : ${tnum(n).replace(/\{,\}/g, '\\,')}$`,
        ],
      };
    }
    const cm = d === 'easy' ? int(rng, 2, 4) : int(rng, 3, 9);
    const realCm = cm * n;
    const inKm = realCm >= 100000;
    const real = inKm ? realCm / 100000 : realCm / 100;
    if (!hasDp(real, 2)) continue;
    return {
      prompt: `On a map, ${cm} cm represents ${num(real)} ${inKm ? 'km' : 'm'}. Write the scale of the map in the form $1 : n$.`,
      answer: `$1 : ${tnum(n).replace(/\{,\}/g, '\\,')}$`,
      distractors: [n / 10, n * 10, tidy(real / cm), tidy(realCm), n / 100, n * 100].filter((v) => v !== n && v >= 1 && hasDp(v, 2)).map((v) => `$1 : ${tnum(v).replace(/\{,\}/g, '\\,')}$`),
      solution: [
        `Change the real distance to cm: ${num(real)} ${inKm ? 'km' : 'm'} $= ${tnum(realCm)}$ cm.`,
        `So $${cm} : ${tnum(realCm)}$. Divide both by ${cm}: $1 : ${tnum(n)}$.`,
        `Answer: $1 : ${tnum(n).replace(/\{,\}/g, '\\,')}$`,
      ],
    };
  }
  throw new Error('scale find');
}, { title: 'Work out the scale from a map or drawing' });

/* ================================================================== */
/* rat-speed                                                           */
/* ================================================================== */

// vehicles with sensible speed ranges (mph or km/h)
const MOVERS = [
  { who: (N) => `${N} drives`, what: 'car', u: 'mph', v: [30, 70] }, { who: () => 'A train travels', what: 'train', u: 'mph', v: [60, 125] },
  { who: (N) => `${N} cycles`, what: 'bike', u: 'mph', v: [8, 18] }, { who: (N) => `${N} walks`, what: 'walk', u: 'km/h', v: [3, 6] },
  { who: () => 'A ferry sails', what: 'ferry', u: 'km/h', v: [20, 45] }, { who: () => 'A plane flies', what: 'plane', u: 'km/h', v: [400, 900] },
  { who: (N) => `${N} runs`, what: 'run', u: 'km/h', v: [8, 16] }, { who: () => 'A coach travels', what: 'coach', u: 'mph', v: [40, 65] },
  { who: () => 'A drone flies', what: 'drone', u: 'km/h', v: [20, 60] }, { who: (N) => `${N} rows a boat`, what: 'rowing boat', u: 'km/h', v: [4, 10] },
  { who: () => 'A horse gallops', what: 'horse', u: 'km/h', v: [30, 48] }, { who: () => 'A lorry travels', what: 'lorry', u: 'mph', v: [40, 56] },
  { who: (N) => `${N} rides a motorbike`, what: 'motorbike', u: 'mph', v: [30, 70] }, { who: () => 'A high-speed train travels', what: 'train', u: 'km/h', v: [200, 300] },
];
const distU = (u) => (u === 'mph' ? 'miles' : 'km');

export const speedSDT = gen('rat-speed-sdt', 'rat-speed', (rng, d) => {
  for (let i = 0; i < 300; i += 1) {
    const M = pick(rng, MOVERS);
    const [N] = names(rng, 1);
    const v = int(rng, M.v[0], M.v[1]);
    const ask = pick(rng, ['speed', 'distance', 'time']);
    // time in minutes; easy: whole hours, medium: 30/15/45/20/40 min parts, hard: awkward minutes
    const tMin = size(d, int(rng, 1, 5) * 60, pick(rng, [30, 90, 150, 45, 15, 20, 40, 80, 100, 75, 135]), pick(rng, [12, 18, 24, 36, 48, 54, 72, 84, 96, 108, 105]));
    const dist = tidy((v * tMin) / 60);
    if (!hasDp(dist, 1)) continue;
    const du = distU(M.u);
    const tH = tidy(tMin / 60);
    const tText = tMin % 60 === 0 ? `${tMin / 60} hour${tMin === 60 ? '' : 's'}` : hm(tMin);
    if (ask === 'speed') {
      const fmt = withUnit(M.u);
      return {
        prompt: `${M.who(N)} ${num(dist)} ${du} in ${tText}. Work out the average speed in ${M.u}.`,
        answer: fmt(v),
        distractors: dvals(v, [dist / tMin, tMin % 60 ? dist / (Math.floor(tMin / 60) + (tMin % 60) / 100) : dist * tH, dist * tH, roundTo(tH / dist, 2), dist / tMin * 100, v + 10, v - 5], fmt, { dp: 1, round: true }),
        typed: { kind: 'number', value: v },
        calculator: d === 'hard',
        solution: [
          `Speed $= \\text{distance} \\div \\text{time}$, with the time in <b>hours</b>.`,
          tMin % 60 === 0 ? `Time $= ${tH}$ hours.` : `${tText} $= \\frac{${tMin}}{60}${hasDp(tH, 3) ? ` = ${tnum(tH)}` : ''}$ hours${hasDp(tH, 3) ? '' : ' (keep it as a fraction – the decimal does not end)'}.`,
          `Speed $= ${tnum(dist)} \\div ${hasDp(tH, 3) ? tnum(tH) : `\\frac{${tMin}}{60}`} = ${tnum(v)}$ ${M.u}`,
          `Answer: ${fmt(v)}`,
        ],
      };
    }
    if (ask === 'distance') {
      const fmt = withUnit(du);
      const wrongH = Math.floor(tMin / 60) + (tMin % 60) / 100;
      return {
        prompt: `${M.who(N)} for ${tText} at an average speed of ${num(v)} ${M.u}. How far does ${M.what === 'walk' || M.what === 'run' || M.what === 'bike' || M.what === 'rowing boat' || M.what === 'motorbike' ? N : 'it'} travel?`.replace(/drives for/, 'drives for').replace(/^A (\w+) (travels|sails|flies|gallops) for/, 'A $1 $2 for'),
        answer: fmt(dist),
        distractors: dvals(dist, [v * wrongH, v / tH, v * tMin, tidy(v * tMin / 100), dist + v, dist * 2], fmt, { dp: 2, round: true }),
        typed: { kind: 'number', value: dist },
        calculator: d === 'hard',
        solution: [
          `Distance $= \\text{speed} \\times \\text{time}$, with the time in hours.`,
          `${tText} $= ${hasDp(tH, 3) ? tnum(tH) : `\\frac{${tMin}}{60}`}$ hours${tMin % 60 ? ` (not ${num(wrongH)} hours!)` : ''}.`,
          `Distance $= ${tnum(v)} \\times ${hasDp(tH, 3) ? tnum(tH) : `\\frac{${tMin}}{60}`} = ${tnum(dist)}$ ${du}`,
          `Answer: ${fmt(dist)}`,
        ],
      };
    }
    const ans = hm(tMin);
    const wrongDec = (h) => hm(Math.floor(h) * 60 + Math.round((h % 1) * 100));
    const distractors = [wrongDec(tH), hm(tMin + 10), hm(Math.max(5, tMin - 10)), hm(Math.round((v / dist) * 60)), tMin >= 60 ? hm(tMin - 60) : hm(tMin + 60), hm(tMin + 30)].filter((t) => t !== ans);
    return {
      prompt: `${M.who(N)} ${num(dist)} ${du} at an average speed of ${num(v)} ${M.u}. How long does the journey take?`,
      answer: ans,
      distractors,
      calculator: d === 'hard',
      solution: [
        `Time $= \\text{distance} \\div \\text{speed} = ${tnum(dist)} \\div ${tnum(v)} = ${tnum(roundTo(tH, 3))}${hasDp(tH, 3) ? '' : '\\ldots'}$ hours.`,
        ...(tMin % 60 ? [`Change the decimal part to minutes: $${tnum(roundTo(tH - Math.floor(tH), 3))}${hasDp(tH, 3) ? '' : '\\ldots'} \\times 60 = ${tMin % 60}$ minutes.`] : []),
        `Answer: ${ans}`,
      ],
    };
  }
  throw new Error('sdt');
}, { title: 'Speed, distance and time calculations', word: true });

export const speedAverage = gen('rat-speed-average', 'rat-speed', (rng, d) => {
  for (let i = 0; i < 300; i += 1) {
    const type = pick(rng, size(d, ['twoLegs', 'withStop'], ['twoLegs', 'withStop', 'restOf'], ['restOf', 'twoLegs', 'withStop']));
    const [N] = names(rng, 1);
    if (type === 'restOf') {
      const totalD = int(rng, 8, 40) * 10; const totalT = int(rng, 2, 6);
      const v1 = pick(rng, [24, 30, 36, 40, 48, 60]); const t1Min = pick(rng, [15, 20, 30, 40, 45]);
      const d1 = (v1 * t1Min) / 60;
      if (!Number.isInteger(d1)) continue;
      const restD = totalD - d1; const restT = totalT * 60 - t1Min;
      const ans = tidy((restD / restT) * 60);
      if (!hasDp(ans, 1) || ans < 20 || ans > 70) continue; // a sensible car speed
      const fmt = withUnit('mph');
      return {
        prompt: `${N} drives ${totalD} miles in ${totalT} hours. ${N} drives the first ${d1} miles at an average speed of ${v1} mph. Work out ${N}'s average speed for the rest of the journey.`,
        answer: fmt(ans),
        distractors: dvals(ans, [restD / totalT, totalD / totalT, 2 * (totalD / totalT) - v1, restD / (totalT - t1Min / 100), (totalD - v1) / totalT], fmt, { dp: 1, round: true }),
        typed: { kind: 'number', value: ans },
        calculator: true,
        solution: [
          `Time for the first part: $${d1} \\div ${v1} = ${hasDp(t1Min / 60, 3) ? tnum(tidy(t1Min / 60)) : `\\frac{${t1Min}}{60}`}$ hours $= ${t1Min}$ minutes.`,
          `Rest of the journey: $${totalD} - ${d1} = ${restD}$ miles in $${totalT * 60} - ${t1Min} = ${restT}$ minutes.`,
          `Speed $= ${restD} \\div \\frac{${restT}}{60} = ${tnum(ans)}$ mph`,
          `Answer: ${fmt(ans)}`,
        ],
      };
    }
    const v1 = int(rng, 6, 14) * 5; const v2 = int(rng, 6, 14) * 5;
    if (v1 === v2) continue;
    const t1 = pick(rng, [15, 20, 30, 45, 60, 90]); const t2 = pick(rng, [15, 20, 30, 45, 60, 90, 120]);
    const stop = type === 'withStop' ? pick(rng, [10, 15, 20, 30]) : 0;
    const d1 = (v1 * t1) / 60; const d2 = (v2 * t2) / 60;
    if (!Number.isInteger(d1) || !Number.isInteger(d2)) continue;
    const totT = t1 + t2 + stop;
    const ans = tidy(((d1 + d2) / totT) * 60);
    if (!hasDp(ans, 1)) continue;
    const fmt = withUnit('mph');
    return {
      prompt: `${N} goes on a car journey. For the first ${t1 === 60 ? 'hour' : hm(t1)} the average speed is ${v1} mph.${stop ? ` ${N} then stops for ${stop} minutes.` : ''} ${N} then drives for ${hm(t2)} at an average speed of ${v2} mph. Work out the average speed for the whole journey${stop ? ', including the stop' : ''}.`,
      answer: fmt(ans),
      distractors: dvals(ans, [(v1 + v2) / 2, ((d1 + d2) / (t1 + t2)) * 60, (d1 + d2) / ((t1 + t2 + stop) / 100), v1 + v2, ((v1 * t1 + v2 * t2) / (t1 + t2))], fmt, { dp: 1, round: true }),
      typed: { kind: 'number', value: ans },
      calculator: d !== 'easy',
      solution: [
        `Average speed $= \\text{total distance} \\div \\text{total time}$ – not the average of the two speeds.`,
        `Distances: $${v1} \\times \\frac{${t1}}{60} = ${d1}$ miles and $${v2} \\times \\frac{${t2}}{60} = ${d2}$ miles, total ${d1 + d2} miles.`,
        `Total time $= ${t1} + ${t2}${stop ? ` + ${stop}` : ''} = ${totT}$ minutes $= ${hasDp(totT / 60, 3) ? tnum(totT / 60) : `\\frac{${totT}}{60}`}$ hours.`,
        `Average speed $= ${d1 + d2} \\div \\frac{${totT}}{60} = ${tnum(ans)}$ mph`,
        `Answer: ${fmt(ans)}`,
      ],
    };
  }
  throw new Error('avg');
}, { title: 'Average speed over a journey in parts' });

export const speedUnits = gen('rat-speed-units', 'rat-speed', (rng, d) => {
  for (let i = 0; i < 200; i += 1) {
    const type = pick(rng, size(d, ['ms2kmh', 'kmh2ms'], ['ms2kmh', 'kmh2ms', 'race'], ['race', 'mpm', 'kmh2ms']));
    if (type === 'ms2kmh') {
      const ms = size(d, int(rng, 1, 8) * 5, int(rng, 2, 40), int(rng, 5, 80) / 2);
      const ans = tidy(ms * 3.6);
      if (!hasDp(ans, 2)) continue;
      return {
        prompt: `Convert ${num(ms)} m/s into km/h.`,
        answer: `${num(ans)} km/h`,
        distractors: dvals(ans, [ms / 3.6, ms * 60, ms * 3600, ms * 60 / 1000, ms * 36], (v) => `${num(roundTo(v, 2))} km/h`, { dp: 2, round: true }),
        typed: { kind: 'number', value: ans },
        calculator: d !== 'easy',
        solution: [
          `In 1 hour there are $60 \\times 60 = 3600$ seconds, so in an hour you go $${tnum(ms)} \\times 3600 = ${tnum(ms * 3600)}$ m.`,
          `$${tnum(ms * 3600)}$ m $= ${tnum(ans)}$ km (divide by 1000). Shortcut: multiply by 3.6.`,
          `Answer: ${num(ans)} km/h`,
        ],
      };
    }
    if (type === 'kmh2ms') {
      const ms = size(d, int(rng, 1, 6) * 5, int(rng, 2, 40), int(rng, 5, 80) / 2);
      const kmh = tidy(ms * 3.6);
      if (!hasDp(kmh, 1)) continue;
      return {
        prompt: `Convert ${num(kmh)} km/h into m/s.`,
        answer: `${num(ms)} m/s`,
        distractors: dvals(ms, [kmh * 3.6, kmh / 60, (kmh * 1000) / 60, kmh / 36, kmh * 1000], (v) => `${num(roundTo(v, 2))} m/s`, { dp: 2, round: true }),
        typed: { kind: 'number', value: ms },
        calculator: true,
        solution: [
          `${num(kmh)} km/h means $${tnum(kmh * 1000)}$ m in $3600$ seconds.`,
          `$${tnum(kmh * 1000)} \\div 3600 = ${tnum(ms)}$ m/s (shortcut: divide by 3.6).`,
          `Answer: ${num(ms)} m/s`,
        ],
      };
    }
    if (type === 'mpm') {
      const mpm = int(rng, 4, 30) * 10; // metres per minute
      const ans = tidy((mpm * 60) / 1000);
      return {
        prompt: `A conveyor belt moves at ${mpm} metres per minute. What is this speed in km/h?`,
        answer: `${num(ans)} km/h`,
        distractors: dvals(ans, [mpm / 60, mpm * 60, mpm / 1000, (mpm * 60) / 100, mpm * 3.6], (v) => `${num(roundTo(v, 2))} km/h`, { dp: 2, round: true }),
        typed: { kind: 'number', value: ans },
        calculator: true,
        solution: [`In one hour: $${mpm} \\times 60 = ${tnum(mpm * 60)}$ m.`, `$${tnum(mpm * 60)}$ m $= ${tnum(ans)}$ km.`, `Answer: ${num(ans)} km/h`],
      };
    }
    // race: one runner given time, the other given speed in km/h
    const [A, B] = names(rng, 2);
    const dist = pick(rng, [100, 200, 400, 800]);
    // realistic school running speeds: about 4 to 7 m/s (14 to 25 km/h)
    const tA = int(rng, Math.round(dist / 7), Math.round(dist / 4));
    const vB = tidy(int(rng, 40, 69) * 0.36); // km/h for a speed of 4.0 to 6.9 m/s
    const msB = tidy(vB / 3.6);
    const tB = dist / msB;
    if (!hasDp(vB, 2) || Math.abs(tB - tA) < 0.3) continue;
    const win = tB < tA ? B : A;
    return {
      prompt: `${A} and ${B} run ${dist === 800 ? 'an' : 'a'} ${dist} m race. ${A} finishes in ${tA} seconds. ${B} runs at an average speed of ${num(vB)} km/h. Who wins the race?`,
      answer: win,
      distractors: [win === A ? B : A, 'They finish at the same time'],
      count: 3,
      calculator: true,
      solution: [
        `Change ${B}'s speed to m/s: $${tnum(vB)} \\div 3.6 = ${tnum(msB)}$ m/s.`,
        `${B}'s time: $${dist} \\div ${tnum(msB)} = ${tnum(roundTo(tB, 2))}${hasDp(tB, 2) ? '' : '\\ldots'}$ seconds, compared with ${A}'s ${tA} seconds.`,
        `The shorter time wins: ${win}.`,
        `Answer: ${win}`,
      ],
    };
  }
  throw new Error('speed units');
}, { title: 'Convert between m/s and km/h', learn: ['rat-speed', 'rat-unit-conversion'] });

export const speedChange = gen('rat-speed-change', 'rat-speed', (rng, d) => {
  const F = size(d, [1, 2, 3], [0.5, 1, 2, 3, 4], [0.5, 1, 1.5, 2, 3, 4, 5]);
  for (let i = 0; i < 100; i += 1) {
    // target: which of speed / time / distance we ask about; the other two change by fa, fb
    const target = d === 'easy' ? 'speed' : pick(rng, ['speed', 'speed', 'time', 'distance']);
    const fa = pick(rng, F); const fb = pick(rng, F);
    if (fa === 1 && fb === 1) continue;
    const [qa, qb] = { speed: ['distance', 'time'], time: ['distance', 'speed'], distance: ['speed', 'time'] }[target];
    const eff = target === 'distance' ? new Frac(fa * 2 * fb * 2, 4) : new Frac(fa * 2, fb * 2);
    const ev = eff.value();
    const lab = (f) => (Math.abs(f - 1) < 1e-9 ? 'No change' : f > 1 ? `×${num(roundTo(f, 3))}` : `÷${num(roundTo(1 / f, 3))}`);
    const ans = lab(ev);
    if (!hasDp(ev, 3) || !hasDp(1 / ev, 3) && ev < 1) continue;
    const wrong = [target === 'distance' ? fa / fb : fa * fb, 1 / ev, fa, 1 / fb, fb, ev * 2, ev / 2].filter((v) => hasDp(v, 3) && (v >= 1 || hasDp(1 / v, 3)));
    const cands = [...new Set([...wrong.map(lab), 'No change', '×2', '÷2', '×4', '÷4'])].filter((t) => t !== ans);
    const ch = (f) => (f === 1 ? 'stays the same' : f === 2 ? 'is doubled' : f === 0.5 ? 'is halved' : `is multiplied by ${num(f)}`);
    const formula = { speed: 'speed $= \\dfrac{\\text{distance}}{\\text{time}}$', time: 'time $= \\dfrac{\\text{distance}}{\\text{speed}}$', distance: 'distance $= \\text{speed} \\times \\text{time}$' }[target];
    return {
      prompt: `${cap(formula)}. The ${qa} ${ch(fa)} and the ${qb} ${ch(fb)}. What happens to the ${target}?`,
      answer: ans,
      distractors: cands,
      solution: [
        target === 'distance' ? `Distance is speed × time, so multiply the two factors: $${tnum(fa)} \\times ${tnum(fb)} = ${eff.tex()}$.` : `${cap(target)} is ${qa} ÷ ${qb}, so divide the factors: $${tnum(fa)} \\div ${tnum(fb)} = ${eff.tex()}$.`,
        `So the ${target} ${ans === 'No change' ? 'does not change' : ev > 1 ? `is multiplied by ${num(roundTo(ev, 3))}` : `is divided by ${num(roundTo(1 / ev, 3))}`}.`,
        `Answer: ${ans}`,
      ],
    };
  }
  throw new Error('speed change');
}, { title: 'Effect of changing two of speed, distance and time' });

/* ================================================================== */
/* rat-density-pressure                                                */
/* ================================================================== */

export const densityCalc = gen('rat-density-calc', 'rat-density-pressure', (rng, d) => {
  for (let i = 0; i < 200; i += 1) {
    const rho = pick(rng, size(d, [2, 3, 4, 5, 8, 10], [0.8, 1.2, 2.5, 7.8, 11.3, 2.7, 0.6], [19.3, 8.96, 10.5, 2.7, 7.87, 0.92, 13.6]));
    const V = size(d, int(rng, 2, 40) * 5, int(rng, 10, 400), int(rng, 20, 600) / 2);
    const m = tidy(rho * V);
    if (!hasDp(m, 2)) continue;
    const ask = pick(rng, ['density', 'mass', 'volume']);
    // match the material to the density for real-world values
    const NAMED = { 0.8: 'a block of pine wood', 1.2: 'a piece of plastic', 2.5: 'a glass paperweight', 7.8: 'a steel block', 11.3: 'a lead weight', 2.7: 'a block of aluminium', 0.6: 'a block of oak', 19.3: 'a gold bar', 8.96: 'a copper pipe', 10.5: 'a silver bar', 7.87: 'an iron bar', 0.92: 'a block of ice', 13.6: 'a flask of mercury' };
    const material = NAMED[rho] || pick(rng, ['a piece of metal', 'a stone', 'a lump of clay', 'an ornament', 'a paperweight', 'a small statue']);
    const kgGiven = d === 'hard' && ask === 'density' && m >= 100 && hasDp(m / 1000, 3) && chance(rng, 0.6);
    if (ask === 'density') {
      const fmt = withUnit('g/cm³');
      return {
        prompt: `${cap(material)} has a mass of ${kgGiven ? `${num(tidy(m / 1000))} kg` : `${num(m)} g`} and a volume of ${num(V)} cm³. Work out its density in g/cm³.`,
        answer: fmt(rho),
        distractors: dvals(rho, [m * V, V / m, kgGiven ? m / 1000 / V : rho * 10, rho / 10, kgGiven ? (m / 1000) * V : m - V], fmt, { dp: 3, round: true }),
        typed: { kind: 'number', value: rho },
        calculator: d !== 'easy',
        solution: [
          `Density $= \\dfrac{\\text{mass}}{\\text{volume}}$.`,
          ...(kgGiven ? [`The answer is in g/cm³, so change the mass to grams: ${num(tidy(m / 1000))} kg $= ${tnum(m)}$ g.`] : []),
          `Density $= ${tnum(m)} \\div ${tnum(V)} = ${tnum(rho)}$ g/cm³`,
          `Answer: ${fmt(rho)}`,
        ],
      };
    }
    if (ask === 'mass') {
      const fmt = withUnit('g');
      return {
        prompt: `${cap(material)} has a volume of ${num(V)} cm³ and a density of ${num(rho)} g/cm³. Work out its mass.`,
        answer: fmt(m),
        distractors: dvals(m, [V / rho, rho / V, V + rho, m * 10, m / 10], fmt, { dp: 3, round: true }),
        typed: { kind: 'number', value: m },
        calculator: d !== 'easy',
        solution: [`Mass $= \\text{density} \\times \\text{volume}$.`, `$${tnum(rho)} \\times ${tnum(V)} = ${tnum(m)}$ g`, `Answer: ${fmt(m)}`],
      };
    }
    const fmt = withUnit('cm³');
    return {
      prompt: `${cap(material)} has a mass of ${num(m)} g and a density of ${num(rho)} g/cm³. Work out its volume.`,
      answer: fmt(V),
      distractors: dvals(V, [m * rho, rho / m, m - rho, V * 10, V / 10], fmt, { dp: 3, round: true }),
      typed: { kind: 'number', value: V },
      calculator: d !== 'easy',
      solution: [`Volume $= \\dfrac{\\text{mass}}{\\text{density}}$.`, `$${tnum(m)} \\div ${tnum(rho)} = ${tnum(V)}$ cm³`, `Answer: ${fmt(V)}`],
    };
  }
  throw new Error('density');
}, { title: 'Density, mass and volume' });

export const pressureCalc = gen('rat-pressure-calc', 'rat-density-pressure', (rng, d) => {
  for (let i = 0; i < 200; i += 1) {
    const ask = pick(rng, ['pressure', 'force', 'area', 'pressure']);
    const unitA = pick(rng, size(d, ['m²', 'cm²'], ['m²', 'cm²'], ['m²', 'box']));
    let A; let areaText; let areaHow = null;
    if (unitA === 'box') {
      const a = int(rng, 2, 12) / 10; const b = int(rng, 2, 15) / 10;
      A = tidy(a * b);
      areaText = `a rectangular base measuring ${num(a)} m by ${num(b)} m`;
      areaHow = `Area of the base $= ${tnum(a)} \\times ${tnum(b)} = ${tnum(A)}$ m².`;
    } else {
      A = unitA === 'm²' ? int(rng, 1, 40) / size(d, 10, 20, 20) : int(rng, 20, 400) * 5;
      areaText = `an area of ${num(A)} ${unitA}`;
    }
    const AU = unitA === 'cm²' ? 'cm²' : 'm²';
    // realistic pressures: a few N/cm², or hundreds to thousands of N/m²
    const P = unitA === 'cm²' ? size(d, int(rng, 1, 10), int(rng, 5, 60) / 10, int(rng, 5, 120) / 10) : size(d, int(rng, 2, 40) * 50, int(rng, 20, 300) * 10, int(rng, 100, 3000));
    const F = tidy(P * A);
    if (!hasDp(F, 2) || !hasDp(A, 3) || F <= 0) continue;
    const PU = `N/${AU}`;
    const obj = pick(rng, ['A box', 'A crate', 'A statue', 'A table', 'A washing machine', 'A block of stone', 'A fridge', 'A piano']);
    if (ask === 'pressure') {
      const fmt = withUnit(PU);
      return {
        prompt: `${obj} exerts a force of ${num(F)} newtons on the floor. It rests on ${areaText}. Work out the pressure it exerts, in ${PU}.${d === 'easy' ? '<br>pressure $= \\dfrac{\\text{force}}{\\text{area}}$' : ''}`,
        answer: fmt(P),
        distractors: dvals(P, [F * A, A / F, F - A, P * 10, P / 10], fmt, { dp: 2, round: true }),
        typed: { kind: 'number', value: P },
        calculator: d !== 'easy',
        solution: [...(areaHow ? [areaHow] : []), `Pressure $= \\dfrac{\\text{force}}{\\text{area}} = ${tnum(F)} \\div ${tnum(A)} = ${tnum(P)}$ ${PU}`, `Answer: ${fmt(P)}`],
      };
    }
    if (ask === 'force') {
      const fmt = withUnit('N');
      return {
        prompt: `${obj} rests on ${areaText}. The pressure on the floor is ${num(P)} ${PU}. Work out the force it exerts on the floor, in newtons.`,
        answer: fmt(F),
        distractors: dvals(F, [P / A, A / P, P + A, F * 10, F / 10], fmt, { dp: 3, round: true }),
        typed: { kind: 'number', value: F },
        calculator: d !== 'easy',
        solution: [...(areaHow ? [areaHow] : []), `Force $= \\text{pressure} \\times \\text{area} = ${tnum(P)} \\times ${tnum(A)} = ${tnum(F)}$ N`, `Answer: ${fmt(F)}`],
      };
    }
    if (unitA === 'box') continue;
    const fmt = withUnit(AU);
    return {
      prompt: `${obj} exerts a force of ${num(F)} N on the floor and a pressure of ${num(P)} ${PU}. Work out the area of its base, in ${AU}.`,
      answer: fmt(A),
      distractors: dvals(A, [F * P, P / F, F - P, A * 10, A / 10], fmt, { dp: 3 }),
      typed: { kind: 'number', value: A },
      calculator: d !== 'easy',
      solution: [`Area $= \\dfrac{\\text{force}}{\\text{pressure}} = ${tnum(F)} \\div ${tnum(P)} = ${tnum(A)}$ ${AU}`, `Answer: ${fmt(A)}`],
    };
  }
  throw new Error('pressure');
}, { title: 'Pressure, force and area' });

const DENS_WORD = [
  { m: 'gold', rho: 19.3, t: (V, mm) => `A gold bar has a volume of ${num(V)} cm³. Gold has a density of 19.3 g/cm³. What is the mass of the gold bar in kilograms?`, ask: 'massKg' },
  { m: 'ice', rho: 0.92, t: (V, mm) => `An ice sculpture has a mass of ${num(mm)} kg. The density of ice is 920 kg/m³. What is its volume in m³?`, ask: 'volM3', si: 920 },
  { m: 'oak', rho: 0.75, t: (V, mm) => `An oak plank has a volume of ${num(V)} cm³ and a mass of ${num(mm)} g. Work out the density of oak in g/cm³.`, ask: 'density' },
  { m: 'concrete', rho: 2.4, t: (V, mm) => `Some concrete has a volume of ${num(V)} m³. The density of the concrete is 2400 kg/m³. Work out the mass of the concrete in kg.`, ask: 'massSI', si: 2400 },
  { m: 'olive oil', rho: 0.92, t: (V, mm) => `A bottle contains ${num(V)} cm³ of olive oil. Olive oil has a density of 0.92 g/cm³. What is the mass of the oil?`, ask: 'mass' },
  { m: 'honey', rho: 1.4, t: (V, mm) => `A jar contains ${num(mm)} g of honey. The density of honey is 1.4 g/cm³. What volume of honey is in the jar?`, ask: 'volume' },
  { m: 'sea water', rho: 1.025, t: (V, mm) => `A tank holds ${num(V)} cm³ of sea water with a mass of ${num(mm)} g. Work out the density of the sea water.`, ask: 'density' },
  { m: 'silver', rho: 10.5, t: (V, mm) => `A piece of silver has a mass of ${num(mm / 1000)} kg and a volume of ${num(V)} cm³. Work out the density of the silver in g/cm³.`, ask: 'densityKg' },
  { m: 'aluminium', rho: 2.7, t: (V, mm) => `An aluminium block measures 5 cm by 4 cm by ${num(V / 20)} cm. Aluminium has a density of 2.7 g/cm³. What is the mass of the block?`, ask: 'massBox' },
  { m: 'copper', rho: 8.96, t: (V, mm) => `A copper pipe has a mass of ${num(mm)} g. The density of copper is 8.96 g/cm³. What volume of copper is in the pipe?`, ask: 'volume' },
  { m: 'population', rho: 0, t: (V, mm) => `A town has a population of ${num(mm)} and an area of ${num(V)} km². Work out its population density in people per km².`, ask: 'pop' },
  { m: 'cork', rho: 0.24, t: (V, mm) => `A cork board has a volume of ${num(V)} cm³. The density of cork is 0.24 g/cm³. What is its mass?`, ask: 'mass' },
  { m: 'iron', rho: 7.87, t: (V, mm) => `An iron weight has a volume of ${num(V)} cm³. Iron has a density of 7.87 g/cm³. Work out the mass of the weight in grams.`, ask: 'mass' },
];

export const densityWord = gen('rat-density-word', 'rat-density-pressure', (rng, d) => {
  for (let i = 0; i < 300; i += 1) {
    // easy: one formula step; medium: a unit or shape step; hard: kg/g or m³ conversions
    const c = DENS_WORD[pick(rng, size(d, [2, 4, 5, 11, 12, 9], [6, 8, 10, 9, 3, 4], [0, 1, 7, 3, 8, 6]))];
    let V; let mm; let ans; let fmt; let steps;
    if (c.ask === 'pop') {
      V = int(rng, 5, 90) * pick(rng, [1, 2, 0.5]); const dens = int(rng, 80, 4000);
      mm = tidy(V * dens); ans = dens; fmt = (v) => `${num(v)} people per km²`;
      if (!Number.isInteger(mm)) continue;
      steps = [`Population density $= \\dfrac{\\text{population}}{\\text{area}}$.`, `$${tnum(mm)} \\div ${tnum(V)} = ${tnum(dens)}$`];
      return { prompt: c.t(V, mm), answer: fmt(ans), distractors: dvals(ans, [V / mm * 1000, mm * V / 1000, ans * 10, ans / 10, mm - V], fmt, { dp: 2, round: true }), typed: { kind: 'number', value: ans }, calculator: true, solution: [...steps, `Answer: ${fmt(ans)}`] };
    }
    if (c.ask === 'massSI') {
      V = int(rng, 4, 60) / 10; ans = tidy(V * c.si); fmt = withUnit('kg');
      steps = [`Mass $= \\text{density} \\times \\text{volume}$.`, `$${c.si} \\times ${tnum(V)} = ${tnum(ans)}$ kg`];
      return { prompt: c.t(V, 0), answer: fmt(ans), distractors: dvals(ans, [c.si / V, V / c.si * 1000, ans / 1000, ans * 10, ans / 10], fmt, { dp: 3, round: true }), typed: { kind: 'number', value: ans }, calculator: true, solution: [...steps, `Answer: ${fmt(ans)}`] };
    }
    if (c.ask === 'volM3') {
      const vol = int(rng, 2, 40) / 20; mm = tidy(vol * c.si); ans = vol; fmt = withUnit('m³');
      if (!Number.isInteger(mm)) continue;
      steps = [`Volume $= \\dfrac{\\text{mass}}{\\text{density}}$.`, `$${tnum(mm)} \\div ${c.si} = ${tnum(vol)}$ m³`];
      return { prompt: c.t(0, mm), answer: fmt(ans), distractors: dvals(ans, [mm * c.si / 1000, c.si / mm, ans * 10, ans / 10, ans * 1000, ans * 100], fmt, { dp: 3, round: true }), typed: { kind: 'number', value: ans }, calculator: true, solution: [...steps, `Answer: ${fmt(ans)}`] };
    }
    V = c.ask === 'massBox' ? 20 * int(rng, 2, 15) : c.ask === 'massKg' ? int(rng, 5, 100) * 10 : int(rng, 10, 500) * size(d, 2, 1, 1);
    mm = tidy(V * c.rho);
    if (!hasDp(mm, 2)) continue;
    if (c.ask === 'density' || c.ask === 'densityKg') {
      ans = c.rho; fmt = withUnit('g/cm³');
      if (c.ask === 'densityKg' && !hasDp(mm / 1000, 3)) continue;
      steps = [...(c.ask === 'densityKg' ? [`Change kg to g: ${num(mm / 1000)} kg $= ${tnum(mm)}$ g.`] : []), `Density $= \\dfrac{\\text{mass}}{\\text{volume}} = ${tnum(mm)} \\div ${tnum(V)} = ${tnum(ans)}$ g/cm³`];
      return { prompt: c.t(V, mm), answer: fmt(ans), distractors: dvals(ans, [V / mm, c.ask === 'densityKg' ? mm / 1000 / V : null, ans * 10, ans / 10, ans * 100, mm * V / 10000], fmt, { dp: 3, round: true }), typed: { kind: 'number', value: ans }, calculator: true, solution: [...steps, `Answer: ${fmt(ans)}`] };
    }
    if (c.ask === 'volume') {
      ans = V; fmt = withUnit('cm³');
      steps = [`Volume $= \\dfrac{\\text{mass}}{\\text{density}} = ${tnum(mm)} \\div ${tnum(c.rho)} = ${tnum(V)}$ cm³`];
      return { prompt: c.t(V, mm), answer: fmt(ans), distractors: dvals(ans, [mm * c.rho, c.rho / mm * 1000, ans * 10, ans / 10, mm - c.rho], fmt, { dp: 2, round: true }), typed: { kind: 'number', value: ans }, calculator: true, solution: [...steps, `Answer: ${fmt(ans)}`] };
    }
    if (c.ask === 'massKg') {
      ans = tidy(mm / 1000); fmt = withUnit('kg');
      if (!hasDp(ans, 4)) continue;
      steps = [`Mass $= \\text{density} \\times \\text{volume} = ${tnum(c.rho)} \\times ${tnum(V)} = ${tnum(mm)}$ g.`, `In kilograms: $${tnum(mm)} \\div 1000 = ${tnum(ans)}$ kg`];
      return { prompt: c.t(V, mm), answer: fmt(ans), distractors: dvals(ans, [mm, V / c.rho / 1000, ans * 10, ans / 10, ans * 100, ans / 100], fmt, { dp: 3, round: true }), typed: { kind: 'number', value: ans }, calculator: true, solution: [...steps, `Answer: ${fmt(ans)}`], longDecimalsOk: true };
    }
    // mass / massBox
    ans = mm; fmt = withUnit('g');
    steps = [...(c.ask === 'massBox' ? [`Volume $= 5 \\times 4 \\times ${tnum(V / 20)} = ${tnum(V)}$ cm³.`] : []), `Mass $= \\text{density} \\times \\text{volume} = ${tnum(c.rho)} \\times ${tnum(V)} = ${tnum(mm)}$ g`];
    return { prompt: c.t(V, mm), answer: fmt(ans), distractors: dvals(ans, [V / c.rho, mm * 10, mm / 10, V + c.rho, c.ask === 'massBox' ? c.rho * (5 + 4 + V / 20) : mm + V], fmt, { dp: 3, round: true }), typed: { kind: 'number', value: ans }, calculator: true, solution: [...steps, `Answer: ${fmt(ans)}`] };
  }
  throw new Error('dens word');
}, { title: 'Density problems with real materials', word: true });

const UNIT_Q = [
  { q: 'density', right: ['g/cm³', 'kg/m³'], wrong: ['cm³/g', 'g/cm²', 'kg/m²', 'm³/kg', 'N/m²'] },
  { q: 'pressure', right: ['N/m²', 'N/cm²'], wrong: ['m²/N', 'N/m³', 'kg/m³', 'N/m', 'm/s'] },
  { q: 'population density', right: ['people per km²'], wrong: ['km² per person', 'people per km', 'people per km³', 'kg/m³'] },
];

export const measureChange = gen('rat-compound-measure-change', 'rat-density-pressure', (rng, d) => {
  if (d !== 'hard' && chance(rng, size(d, 0.3, 0.15, 0))) {
    // which is a unit of density / pressure?
    const u = pick(rng, UNIT_Q);
    const ans = pick(rng, u.right);
    return {
      prompt: `Which of these is a unit of <b>${u.q}</b>?`,
      answer: ans,
      distractors: sample(rng, u.wrong, 4),
      count: 4,
      solution: [
        u.q === 'density' ? 'Density $=$ mass ÷ volume, so its unit is a mass unit divided by a volume unit (e.g. g/cm³).' : u.q === 'pressure' ? 'Pressure $=$ force ÷ area, so its unit is a force unit (newtons) divided by an area unit (e.g. N/m²).' : 'Population density $=$ population ÷ area, so it is people per unit of area.',
        `Answer: ${ans}`,
      ],
    };
  }
  for (let i = 0; i < 100; i += 1) {
    const kind = pick(rng, ['density', 'pressure']);
    const top = kind === 'density' ? 'mass' : 'force'; const bot = kind === 'density' ? 'volume' : 'area';
    const thing = kind === 'density' ? 'solid' : 'box';
    const fT = pick(rng, size(d, [2, 3, 6, 1], [2, 3, 4, 6, 0.5, 1], [2, 3, 4, 8, 0.5, 1.5]));
    const fB = pick(rng, size(d, [1], [1, 2, 0.5, 3], [2, 0.5, 3, 4, 1.5]));
    if (fT === 1 && fB === 1) continue;
    const eff = new Frac(fT * 2, fB * 2);
    const ev = eff.value();
    const sentence = (what, f) => (f === 1 ? `the same ${what} as` : f === 0.5 ? `half the ${what} of` : `${num(f)} times the ${what} of`);
    return {
      prompt: `${cap(kind)} $= \\dfrac{\\text{${top}}}{\\text{${bot}}}$. ${cap(thing)} A has ${sentence(top, fT)} ${thing} B. ${kind === 'density' ? `It has ${sentence(bot, fB)} ${thing} B.` : `Its base has ${sentence(bot, fB)} the base of ${thing} B.`.replace(`${bot} of the base of`, `${bot} of the base of`)} The ${kind} of ${thing} A is how many times the ${kind} of ${thing} B?`,
      answer: `$${eff.tex()}$`,
      distractors: [fT * fB, fB / fT, fT, 1 / fB, fT + fB, ev * 2, ev / 2, 2, 0.5, 3, 4].filter((v) => v > 0 && Math.abs(v - ev) > 1e-9).map((v) => {
        const f = new Frac(Math.round(v * 24), 24);
        return `$${f.tex()}$`;
      }),
      allowEquivalent: false,
      typed: { kind: 'number', value: eff },
      solution: [
        `${cap(kind)} $= \\dfrac{\\text{${top}}}{\\text{${bot}}}$, so the ${kind} is multiplied by (${top} factor) ÷ (${bot} factor).`,
        `$${tnum(fT)} \\div ${tnum(fB)} = ${eff.tex()}$`,
        `Answer: $${eff.tex()}$`,
      ],
    };
  }
  throw new Error('measure change');
}, { title: 'How density or pressure changes; units of compound measures' });

/* ================================================================== */
/* rat-area-volume-units                                               */
/* ================================================================== */

const AREA_PAIRS = [
  { s: 'mm²', b: 'cm²', F: 100, lin: 10 }, { s: 'cm²', b: 'm²', F: 10000, lin: 100 }, { s: 'm²', b: 'km²', F: 1000000, lin: 1000 },
  { s: 'm²', b: 'hectares', F: 10000, lin: null },
];
const VOL_PAIRS = [
  { s: 'mm³', b: 'cm³', F: 1000, lin: 10 }, { s: 'cm³', b: 'm³', F: 1000000, lin: 100 }, { s: 'cm³', b: 'litres', F: 1000, lin: null, note: '1 litre = 1000 cm³' },
  { s: 'litres', b: 'm³', F: 1000, lin: null, note: '1 m³ = 1000 litres' }, { s: 'ml', b: 'cm³', F: 1, lin: null, skip: true },
];

function avConvert(rng, d, pairs, dim) {
  for (let i = 0; i < 200; i += 1) {
    const u = pick(rng, pairs.filter((p) => !p.skip));
    const toSmall = chance(rng, 0.5);
    const big = size(d, int(rng, 1, 12), int(rng, 1, 90) / pick(rng, [1, 10]), int(rng, 1, 999) / pick(rng, [100, 1000, 10]));
    const small = tidy(big * u.F);
    if (!hasDp(big, 3) || !hasDp(small, 2) || small > 1e8) continue;
    const from = toSmall ? big : small; const ans = toSmall ? small : big;
    const fromU = toSmall ? u.b : u.s; const toU = toSmall ? u.s : u.b;
    const fmt = (v) => `${num(v)} ${toU}`;
    const fac = [u.lin, u.lin ? u.lin ** (dim === 2 ? 3 : 2) : null, u.F * 10, u.F / 10, 1000, 100].filter((f) => f && f !== u.F);
    const wrong = [...fac.map((f) => (toSmall ? from * f : from / f)), toSmall ? from / u.F : from * u.F];
    if (num(ans).length > 14) continue;
    return {
      prompt: `Convert ${num(from)} ${fromU} to ${toU}.`,
      answer: fmt(ans),
      distractors: dvals(ans, wrong, fmt, { dp: 3 }),
      typed: { kind: 'number', value: ans },
      calculator: d === 'hard',
      solution: [
        u.lin ? `1 ${u.b.slice(0, -1)} $= ${u.lin}$ ${u.s.slice(0, -1)}, so 1 ${u.b} $= ${u.lin}${dim === 2 ? '^2' : '^3'} = ${tnum(u.F)}$ ${u.s}. (Not ${u.lin}: ${dim === 2 ? 'area has two' : 'volume has three'} dimensions!)` : `${u.note || `1 ${u.b.replace(/s$/, '')} $= ${tnum(u.F)}$ ${u.s}`}.`,
        toSmall ? `To smaller units, multiply: $${tnum(from)} \\times ${tnum(u.F)} = ${tnum(ans)}$` : `To bigger units, divide: $${tnum(from)} \\div ${tnum(u.F)} = ${tnum(ans)}$`,
        `Answer: ${fmt(ans)}`,
      ],
      longDecimalsOk: true,
    };
  }
  throw new Error('av convert');
}

export const areaUnits = gen('rat-area-units', 'rat-area-volume-units', (rng, d) => avConvert(rng, d, AREA_PAIRS, 2), { title: 'Convert units of area' });
export const volumeUnits = gen('rat-volume-units', 'rat-area-volume-units', (rng, d) => avConvert(rng, d, VOL_PAIRS, 3), { title: 'Convert units of volume and capacity' });

const AV_WORD = [
  { t: (a, b, c) => `A fish tank is a cuboid measuring ${a} cm by ${b} cm by ${c} cm. How many litres of water does it hold when full?`, f: (a, b, c) => (a * b * c) / 1000, u: 'litres', how: (a, b, c) => [`Volume $= ${a} \\times ${b} \\times ${c} = ${tnum(a * b * c)}$ cm³.`, `$1000$ cm³ $= 1$ litre, so divide by 1000: $${tnum(tidy((a * b * c) / 1000))}$ litres.`], dims: [[20, 80], [20, 50], [20, 50]] },
  { t: (a, b) => `A rectangular rug measures ${a} cm by ${b} cm. What is its area in m²?`, f: (a, b) => (a * b) / 10000, u: 'm²', how: (a, b) => [`Change to metres first: ${num(a / 100)} m by ${num(b / 100)} m.`, `Area $= ${tnum(a / 100)} \\times ${tnum(b / 100)} = ${tnum(tidy((a * b) / 10000))}$ m². (Or ${tnum(a * b)} cm² $\\div 10\\,000$.)`], dims: [[60, 300], [80, 400]] },
  { t: (a, b, c) => `A water trough is a cuboid ${num(a / 100)} m long, ${b} cm wide and ${c} cm deep. How many litres does it hold?`, f: (a, b, c) => (a * b * c) / 1000, u: 'litres', how: (a, b, c) => [`Work in cm: ${num(a / 100)} m $= ${a}$ cm.`, `Volume $= ${a} \\times ${b} \\times ${c} = ${tnum(a * b * c)}$ cm³ $= ${tnum(tidy((a * b * c) / 1000))}$ litres.`], dims: [[100, 250], [30, 60], [20, 50]] },
  { t: (a, b, c) => `A skip is a cuboid ${num(a / 100)} m by ${num(b / 100)} m by ${num(c / 100)} m. What is its volume in m³?`, f: (a, b, c) => (a * b * c) / 1000000, u: 'm³', how: (a, b, c) => [`Change to metres: ${num(a / 100)} m, ${num(b / 100)} m, ${num(c / 100)} m.`, `Volume $= ${tnum(a / 100)} \\times ${tnum(b / 100)} \\times ${tnum(c / 100)} = ${tnum(tidy((a * b * c) / 1000000))}$ m³`], dims: [[150, 400], [100, 200], [50, 150]] },
  { t: (a, b) => `A floor is ${num(a / 100)} m by ${num(b / 100)} m. Square tiles of side ${'50'} cm are used to cover it. How many tiles are needed?`, f: (a, b) => (a * b) / 2500, u: 'tiles', how: (a, b) => [`Each tile covers $50 \\times 50 = 2500$ cm². The floor is $${a} \\times ${b} = ${tnum(a * b)}$ cm².`, `$${tnum(a * b)} \\div 2500 = ${tnum(tidy((a * b) / 2500))}$ tiles (or $${a / 50} \\times ${b / 50}$).`], dims: [[200, 800], [200, 600]], mult: 50 },
  { t: (a, b) => `A lawn measures ${a} m by ${b} m. A bag of grass seed covers 25 m². How many bags are needed?`, f: (a, b) => Math.ceil((a * b) / 25), u: 'bags', how: (a, b) => [`Area $= ${a} \\times ${b} = ${a * b}$ m².`, `$${a * b} \\div 25 = ${tnum(roundTo((a * b) / 25, 2))}$${(a * b) % 25 ? `, so round <b>up</b> to ${Math.ceil((a * b) / 25)} bags (a part-bag is not enough)` : ' bags'}.`], dims: [[6, 20], [5, 15]], ceil: true },
  { t: (a, b, c) => `A carton of juice is a cuboid ${a} cm by ${b} cm by ${c} cm. How many millilitres does it hold?`, f: (a, b, c) => a * b * c, u: 'ml', how: (a, b, c) => [`Volume $= ${a} \\times ${b} \\times ${c} = ${a * b * c}$ cm³.`, `$1$ cm³ $= 1$ ml, so it holds ${num(a * b * c)} ml.`], dims: [[5, 10], [4, 8], [10, 20]] },
  { t: (a, b) => `A field has an area of ${num(a * b)} m². What is its area in hectares? (1 hectare $= 10\\,000$ m²)`, f: (a, b) => (a * b) / 10000, u: 'hectares', how: (a, b) => [`Divide by $10\\,000$: $${tnum(a * b)} \\div 10\\,000 = ${tnum(tidy((a * b) / 10000))}$`], dims: [[100, 500], [80, 400]] },
  { t: (a, b, c) => `A swimming pool is ${a} m long, ${b} m wide and ${num(c / 10)} m deep. How many litres of water does it hold? (1 m³ $= 1000$ litres)`, f: (a, b, c) => (a * b * c * 1000) / 10, u: 'litres', how: (a, b, c) => [`Volume $= ${a} \\times ${b} \\times ${tnum(c / 10)} = ${tnum(tidy((a * b * c) / 10))}$ m³.`, `$\\times 1000$: $${tnum(tidy((a * b * c * 1000) / 10))}$ litres`], dims: [[10, 25], [5, 12], [10, 20]] },
  { mult: 10, t: (a, b) => `A wall is ${num(a / 100)} m by ${num(b / 100)} m. One tin of paint covers 12 m². How many tins are needed to give the wall one coat?`, f: (a, b) => Math.ceil((a * b) / 120000), u: 'tins', how: (a, b) => [`Area $= ${tnum(a / 100)} \\times ${tnum(b / 100)} = ${tnum(tidy((a * b) / 10000))}$ m².`, `$${tnum(tidy((a * b) / 10000))} \\div 12 = ${tnum(roundTo((a * b) / 120000, 2))}$${(a * b) % 120000 ? `, so round <b>up</b> to ${Math.ceil((a * b) / 120000)} tins` : ' tins'}.`], dims: [[300, 1200], [200, 400]], ceil: true },
  { t: (a, b, c) => `A box of sand is ${a} cm by ${b} cm by ${c} cm. What is the volume of sand in m³?`, f: (a, b, c) => (a * b * c) / 1000000, u: 'm³', how: (a, b, c) => [`Volume $= ${a} \\times ${b} \\times ${c} = ${tnum(a * b * c)}$ cm³.`, `$1$ m³ $= 100^3 = 1\\,000\\,000$ cm³, so divide: $${tnum(tidy((a * b * c) / 1000000))}$ m³`], dims: [[50, 200], [50, 150], [20, 100]] },
  { t: (a, b) => `A photo measures ${a} mm by ${b} mm. What is its area in cm²?`, f: (a, b) => (a * b) / 100, u: 'cm²', how: (a, b) => [`In cm the photo is ${num(a / 10)} cm by ${num(b / 10)} cm.`, `Area $= ${tnum(a / 10)} \\times ${tnum(b / 10)} = ${tnum(tidy((a * b) / 100))}$ cm²`], dims: [[60, 200], [40, 150]] },
];

export const avWord = gen('rat-av-units-word', 'rat-area-volume-units', (rng, d) => {
  for (let i = 0; i < 300; i += 1) {
    // easy: one conversion; medium: volume/area then convert; hard: mixed units or rounding up
    const c = AV_WORD[pick(rng, size(d, [1, 6, 7, 11, 0], [0, 4, 5, 3, 10], [2, 8, 9, 10, 3]))];
    const m = c.mult || pick(rng, [5, 10]);
    const dims = c.dims.map(([lo, hi]) => int(rng, Math.ceil(lo / m), Math.floor(hi / m)) * m);
    const ans = tidy(c.f(...dims));
    if (!hasDp(ans, 3) || ans <= 0) continue;
    if (c.u === 'tiles' && !Number.isInteger(ans)) continue;
    const fmt = withUnit(c.u);
    const exactArea = dims.reduce((x, y) => x * y, 1);
    return {
      prompt: c.t(...dims),
      answer: fmt(ans),
      distractors: dvals(ans, c.ceil ? [ans - 1, ans + 1, Math.floor(c.f(...dims) * 0.9), ans + 2] : [ans * 10, ans / 10, ans * 100, ans / 100, ans * 1000, ans / 1000, exactArea], fmt, { dp: 3 }),
      typed: { kind: 'number', value: ans },
      calculator: d !== 'easy',
      solution: [...c.how(...dims), `Answer: ${fmt(ans)}`],
    };
  }
  throw new Error('av word');
}, { title: 'Area and volume unit conversions in context', word: true });

const AV_TRUE = ['$1$ m² $= 10\\,000$ cm²', '$1$ cm² $= 100$ mm²', '$1$ m³ $= 1\\,000\\,000$ cm³', '$1$ cm³ $= 1000$ mm³', '$1$ litre $= 1000$ cm³', '$1$ m³ $= 1000$ litres', '$1$ km² $= 1\\,000\\,000$ m²', '$1$ hectare $= 10\\,000$ m²', '$1$ ml $= 1$ cm³'];
const AV_FALSE = ['$1$ m² $= 100$ cm²', '$1$ cm² $= 10$ mm²', '$1$ m³ $= 1000$ cm³', '$1$ cm³ $= 100$ mm³', '$1$ litre $= 100$ cm³', '$1$ m³ $= 100$ litres', '$1$ km² $= 1000$ m²', '$1$ m² $= 1000$ cm²', '$1$ cm³ $= 10$ mm³', '$1$ m³ $= 10\\,000$ cm³', '$1$ litre $= 1$ m³'];

/** "Which value is equal to X?" — the exam's 'circle the area equal to 36 mm²' type. */
function avEqual(rng, d, pairs, dim) {
  for (let i = 0; i < 200; i += 1) {
    const u = pick(rng, pairs.filter((p) => !p.skip && p.lin));
    const toBig = chance(rng, 0.6);
    const small = int(rng, 2, 99) * pick(rng, [1, 10, 100]);
    const big = tidy(small / u.F);
    if (!hasDp(big, 3)) continue;
    const from = toBig ? small : big; const ans = toBig ? big : small;
    const fromU = toBig ? u.s : u.b; const toU = toBig ? u.b : u.s;
    const fmt = (v) => `${num(v)} ${toU}`;
    const wrong = [u.lin, u.lin ** (dim === 2 ? 3 : 2), u.F * 10, u.F / 10].map((f) => (toBig ? from / f : from * f)).concat([toBig ? from * u.F : from / u.F]);
    return {
      prompt: `Which of these is equal to ${num(from)} ${fromU}?`,
      answer: fmt(ans),
      distractors: dvals(ans, wrong, fmt, { dp: 3, pad: false }).concat(dvals(ans, [ans * 1000, ans / 1000], fmt, { dp: 3 })),
      typed: { kind: 'number', value: ans },
      solution: [
        `1 ${u.b} $= ${u.lin}${dim === 2 ? '^2' : '^3'} = ${tnum(u.F)}$ ${u.s}.`,
        toBig ? `$${tnum(from)} \\div ${tnum(u.F)} = ${tnum(ans)}$` : `$${tnum(from)} \\times ${tnum(u.F)} = ${tnum(ans)}$`,
        `Answer: ${fmt(ans)}`,
      ],
    };
  }
  throw new Error('av equal');
}
function avStatement(rng, d) {
  const ans = pick(rng, AV_TRUE);
  const key = ans.match(/\$1\$ (\S+)/)[1];
  const same = AV_FALSE.filter((s) => s.includes(key));
  const rest = shuffle(rng, AV_FALSE.filter((s) => !s.includes(key)));
  return {
    prompt: pick(rng, ['Which of these statements is correct?', 'Only one of these conversions is true. Which one?', 'Which of these is a correct unit conversion?']),
    answer: ans,
    distractors: [...shuffle(rng, same), ...rest].slice(0, 4),
    count: d === 'easy' ? 4 : 5,
    solution: [
      'For area, square the length conversion: 1 m $= 100$ cm, so 1 m² $= 100 \\times 100 = 10\\,000$ cm².',
      'For volume, cube it: 1 m³ $= 100^3 = 1\\,000\\,000$ cm³. And 1 litre $= 1000$ cm³.',
      `Answer: ${ans}`,
    ],
  };
}

export const avStatements = gen('rat-av-statements', 'rat-area-volume-units', (rng, d) => {
  const r = rng();
  // easy: mostly the facts; medium: area values; hard: volume values
  if (d === 'easy') return r < 0.7 ? avStatement(rng, d) : avEqual(rng, d, AREA_PAIRS, 2);
  if (d === 'medium') return r < 0.7 ? avEqual(rng, d, AREA_PAIRS, 2) : avStatement(rng, d);
  return r < 0.75 ? avEqual(rng, d, VOL_PAIRS, 3) : avEqual(rng, d, AREA_PAIRS, 2);
}, { title: 'Which area/volume value or conversion fact is correct?' });

// Converting compound units (density, pressure, flow, fuel use, population density).
const CUC = [
  (rng) => {
    const rho = pick(rng, [2400, 7800, 2700, 920, 1030, 8960, 11300, 1200, 600, 19300]);
    const toG = chance(rng, 0.6);
    const g = rho / 1000;
    return toG
      ? { prompt: `The density of a material is ${num(rho)} kg/m³. Write this density in g/cm³.`, ans: g, unit: 'g/cm³', steps: [`1 kg $= 1000$ g and 1 m³ $= 1\\,000\\,000$ cm³.`, `$${tnum(rho)}$ kg/m³ $= \\frac{${tnum(rho)} \\times 1000}{1\\,000\\,000}$ g/cm³ $= ${tnum(rho)} \\div 1000 = ${tnum(g)}$ g/cm³`], wrong: [rho / 100, rho * 1000, rho / 1000000, rho / 10] }
      : { prompt: `The density of a material is ${num(g)} g/cm³. Write this density in kg/m³.`, ans: rho, unit: 'kg/m³', steps: [`A cube of 1 m³ is $1\\,000\\,000$ cm³, so at 1 g/cm³ it has a mass of $1\\,000\\,000$ g $= 1000$ kg. So 1 g/cm³ $= 1000$ kg/m³.`, `$${tnum(g)} \\times 1000 = ${tnum(rho)}$ kg/m³`], wrong: [g * 100, g / 1000, g * 1000000, g * 10] };
  },
  (rng) => {
    const psi = pick(rng, [25, 30, 32, 35, 40, 50, 100, 150, 198, 250]);
    const ans = roundTo((psi * 0.45) / 6.25, 2);
    return { prompt: `The pressure in a tyre is ${psi} pounds per square inch. Convert this into kilograms per square centimetre. Use 1 pound $= 0.45$ kg and 1 square inch $= 6.25$ cm². Give your answer to 2 decimal places.`, ans, unit: 'kg/cm²', tol: 0.005,
      steps: [`${psi} pounds $= ${psi} \\times 0.45 = ${tnum(tidy(psi * 0.45))}$ kg, acting on 1 square inch $= 6.25$ cm².`, `$${tnum(tidy(psi * 0.45))} \\div 6.25 = ${tnum(roundTo((psi * 0.45) / 6.25, 4))}${hasDp((psi * 0.45) / 6.25, 4) ? '' : '\\ldots'}$ kg/cm²${hasDp((psi * 0.45) / 6.25, 2) ? '' : `, which is ${num(ans)} to 2 decimal places`}`], wrong: [(psi * 0.45) * 6.25, psi / 0.45 / 6.25, (psi / 0.45) * 6.25, psi * 0.45, (psi * 0.45) / 2.5].map((v) => roundTo(v, 2)) };
  },
  (rng) => {
    const lpm = pick(rng, [3, 6, 9, 12, 15, 1.2, 2.4, 4.8]);
    const ans = tidy((lpm * 1000) / 60);
    return { prompt: `Water flows from a pipe at ${num(lpm)} litres per minute. Write this rate in cm³ per second. (1 litre $= 1000$ cm³)`, ans, unit: 'cm³ per second',
      steps: [`${num(lpm)} litres per minute $= ${tnum(lpm * 1000)}$ cm³ per minute.`, `Per second: $${tnum(lpm * 1000)} \\div 60 = ${tnum(ans)}$ cm³`], wrong: [lpm * 1000 * 60, lpm * 1000, (lpm * 100) / 60, lpm / 60] };
  },
  (rng) => {
    const mpl = pick(rng, [10, 12, 14, 15, 16, 20]); const km = mpl * 8 / 5 * int(rng, 3, 15) * 5;
    const ans = tidy((km * 5) / 8 / mpl);
    if (!hasDp(ans, 2)) return null;
    return { prompt: `A car travels ${mpl} miles on one litre of petrol. How many litres does it use to travel ${num(km)} km? Use 8 km $= 5$ miles.`, ans, unit: 'litres',
      steps: [`${num(km)} km $= ${tnum(km)} \\div 8 \\times 5 = ${tnum(tidy((km * 5) / 8))}$ miles.`, `$${tnum(tidy((km * 5) / 8))} \\div ${mpl} = ${tnum(ans)}$ litres`], wrong: [km / mpl, (km * 8) / 5 / mpl, (km * 5) / 8 * mpl, km / 8 / mpl] };
  },
  (rng) => {
    const pk = pick(rng, [250, 400, 800, 1200, 2500, 3600, 4800]);
    const ans = pk / 100;
    return { prompt: `A town has a population density of ${num(pk)} people per km². What is this in people per hectare? (1 km² $= 100$ hectares)`, ans, unit: 'people per hectare',
      steps: [`Each km² is 100 hectares, so the same people are spread over 100 times as many units.`, `$${tnum(pk)} \\div 100 = ${tnum(ans)}$ people per hectare`], wrong: [pk * 100, pk / 10000, pk / 1000, pk * 10] };
  },
  (rng) => {
    const cms = pick(rng, [5, 10, 15, 20, 25, 50]);
    const ans = tidy((cms * 3600) / 100000);
    return { prompt: `A toy robot moves at ${cms} cm per second. What is this speed in km/h?`, ans, unit: 'km/h',
      steps: [`In one hour: $${cms} \\times 3600 = ${tnum(cms * 3600)}$ cm.`, `$100\\,000$ cm $= 1$ km, so $${tnum(cms * 3600)} \\div 100\\,000 = ${tnum(ans)}$ km/h`], wrong: [(cms * 3600) / 1000, (cms * 60) / 100000, (cms * 3600) / 100, cms * 3.6] };
  },
  (rng) => {
    const gsm = pick(rng, [80, 90, 100, 120, 160, 250]);
    const sheets = pick(rng, [500, 1000, 250, 2000]);
    const a4 = 0.0625; // m² for an A4 sheet (approx. 1/16 m²)
    const ans = tidy((gsm * a4 * sheets) / 1000);
    return { prompt: `Printer paper has a weight of ${gsm} g per m². An A4 sheet has an area of $\\frac{1}{16}$ m². What is the mass, in kg, of ${num(sheets)} A4 sheets?`, ans, unit: 'kg',
      steps: [`One sheet: $${gsm} \\times \\frac{1}{16} = ${tnum(tidy(gsm / 16))}$ g.`, `${num(sheets)} sheets: $${tnum(tidy(gsm / 16))} \\times ${tnum(sheets)} = ${tnum(tidy((gsm / 16) * sheets))}$ g $= ${tnum(ans)}$ kg`], wrong: [(gsm * sheets) / 1000, (gsm * 16 * sheets) / 1000, (gsm * a4 * sheets), (gsm * a4 * sheets) / 100] };
  },
];

export const compoundUnitConvert = gen('rat-compound-unit-convert', 'rat-area-volume-units', (rng, d) => {
  for (let i = 0; i < 100; i += 1) {
    // easy: density / population density; medium: flow and speed; hard: psi, fuel use, paper weight
    const c = CUC[pick(rng, size(d, [0, 4, 2], [2, 5, 6, 0], [1, 3, 6, 5]))](rng);
    if (!c || !hasDp(c.ans, 3)) continue;
    const fmt = c.tol ? (v) => `${num(v, 2)} ${c.unit}` : withUnit(c.unit);
    return {
      prompt: c.prompt,
      answer: fmt(c.ans),
      distractors: dvals(c.ans, c.wrong, fmt, { dp: 3, round: true }),
      typed: { kind: 'number', value: c.ans, ...(c.tol ? { tolerance: c.tol } : {}) },
      calculator: true,
      solution: [...c.steps, `Answer: ${fmt(c.ans)}`],
    };
  }
  throw new Error('compound units');
}, { title: 'Convert compound units (kg/m³, psi, litres per minute …)', learn: ['rat-area-volume-units', 'rat-density-pressure'] });

export const measuresGenerators = [
  convertMetric, convertTime, convertImperial, convertWord,
  scaleRatioMap, scaleCmRepresents, scaleAsRatio, scaleDrawing, scaleFind,
  speedSDT, speedAverage, speedUnits, speedChange,
  densityCalc, pressureCalc, densityWord, measureChange,
  areaUnits, volumeUnits, avWord, avStatements, compoundUnitConvert,
];
void [gbp, roundTo];
