// Real-life graphs: conversion graphs, fixed charge + rate graphs, comparing tariffs, rates of filling/emptying,
// distance–time graphs, and velocity–time graphs (gradients and areas).
import { pick, int, chance, shuffle, names, num, tnum, money, frac, tidy, roundTo } from '../../core.js';
import { G, T, uniq } from './util.js';
import { chart, lineLabel } from './diagrams.js';
import { ACCENT, ACCENT2 } from '../../svg.js';

const ceilTo = (v, s) => Math.ceil(v / s - 1e-9) * s;
const nice = (v) => Number.isFinite(v) && Number.isInteger(tidy(v * 100));
/** uniq() that also drops options with long decimals. */
const UQ = (arr, ans) => uniq(arr.filter((s) => !/\d\.\d{3,}/.test(String(s))), ans);
/** Minutes as hours in TeX: 90 -> 1.5, 40 -> \frac{40}{60}. */
const hrs = (mins) => (Number.isInteger(tidy((mins / 60) * 100)) ? tnum(tidy(mins / 60)) : `\\frac{${mins}}{60}`);

/* ================================================================== */
/* gr-real-life: conversion graphs                                     */
/* ================================================================== */

// Each context: y = r·x + c drawn for 0 ≤ x ≤ xmax. good(x) says x lands the reading exactly on a gridline.
const CONVERSIONS = [
  { a: 'pounds (£)', b: 'euros (€)', fa: (v) => money(v), fb: (v) => `€${num(v)}`, r: 1.2, xmax: 100, xstep: 20, xminor: 4, ymax: 120, ystep: 20, yminor: 4, xs: [10, 20, 30, 40, 50, 60, 70, 80, 90], what: 'currency', ta: 'Pounds (£)', tb: 'Euros (€)', ua: 'pounds', ub: 'euros' },
  { a: 'pounds (£)', b: 'US dollars', fa: (v) => money(v), fb: (v) => `${num(v)} dollars`, r: 1.25, xmax: 80, xstep: 10, xminor: 5, ymax: 100, ystep: 10, yminor: 5, xs: [8, 16, 24, 32, 40, 48, 56, 64, 72], what: 'currency', ta: 'Pounds (£)', tb: 'US dollars', ua: 'pounds', ub: 'dollars' },
  { a: 'miles', b: 'kilometres', fa: (v) => `${num(v)} miles`, fb: (v) => `${num(v)} km`, r: 1.6, xmax: 50, xstep: 10, xminor: 5, ymax: 80, ystep: 10, yminor: 5, xs: [10, 20, 30, 40, 5, 15, 25, 35, 45].filter((x) => (x * 1.6) % 2 === 0), ta: 'Miles', tb: 'Kilometres', ua: 'miles', ub: 'km' },
  { a: 'kilometres', b: 'miles', fa: (v) => `${num(v)} km`, fb: (v) => `${num(v)} miles`, r: 0.625, xmax: 80, xstep: 10, xminor: 5, ymax: 50, ystep: 10, yminor: 5, xs: [16, 32, 48, 64, 80], ta: 'Kilometres', tb: 'Miles', ua: 'km', ub: 'miles' },
  { a: 'kilograms', b: 'pounds (lb)', fa: (v) => `${num(v)} kg`, fb: (v) => `${num(v)} lb`, r: 2.2, xmax: 50, xstep: 10, xminor: 5, ymax: 110, ystep: 10, yminor: 5, xs: [10, 20, 30, 40, 50], ta: 'Kilograms', tb: 'Pounds (lb)', ua: 'kg', ub: 'lb' },
  { a: 'inches', b: 'centimetres', fa: (v) => `${num(v)} inches`, fb: (v) => `${num(v)} cm`, r: 2.5, xmax: 40, xstep: 5, xminor: 5, ymax: 100, ystep: 10, yminor: 5, xs: [4, 8, 12, 16, 20, 24, 28, 32, 36], ta: 'Inches', tb: 'Centimetres', ua: 'inches', ub: 'cm' },
  { a: 'gallons', b: 'litres', fa: (v) => `${num(v)} gallons`, fb: (v) => `${num(v)} litres`, r: 4.5, xmax: 20, xstep: 2, xminor: 2, ymax: 90, ystep: 10, yminor: 5, xs: [4, 8, 12, 16, 20], ta: 'Gallons', tb: 'Litres', ua: 'gallons', ub: 'litres' },
  { a: 'litres', b: 'pints', fa: (v) => `${num(v)} litres`, fb: (v) => `${num(v)} pints`, r: 1.75, xmax: 8, xstep: 1, xminor: 2, ymax: 14, ystep: 2, yminor: 4, xs: [2, 4, 6, 8], ta: 'Litres', tb: 'Pints', ua: 'litres', ub: 'pints' },
  { a: 'degrees Celsius', b: 'degrees Fahrenheit', fa: (v) => `${num(v)}°C`, fb: (v) => `${num(v)}°F`, r: 1.8, c: 32, xmax: 100, xstep: 10, xminor: 2, ymax: 220, ystep: 20, yminor: 4, xs: [10, 35, 60, 85], ta: 'Celsius (°C)', tb: 'Fahrenheit (°F)', ua: '°C', ub: '°F', temp: true },
  { a: 'pounds (£)', b: 'Japanese yen', fa: (v) => money(v), fb: (v) => `${num(v)} yen`, r: 150, xmax: 50, xstep: 10, xminor: 5, ymax: 7500, ystep: 1000, yminor: 5, xs: [4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48], what: 'currency', ta: 'Pounds (£)', tb: 'Yen', ua: 'pounds', ub: 'yen' },
  { a: 'ounces', b: 'grams', fa: (v) => `${num(v)} oz`, fb: (v) => `${num(v)} g`, r: 28, xmax: 20, xstep: 2, xminor: 2, ymax: 600, ystep: 100, yminor: 5, xs: [5, 10, 15, 20], ta: 'Ounces', tb: 'Grams', ua: 'oz', ub: 'g' },
  { a: 'feet', b: 'metres', fa: (v) => `${num(v)} feet`, fb: (v) => `${num(v)} m`, r: 0.3, xmax: 100, xstep: 10, xminor: 5, ymax: 30, ystep: 5, yminor: 5, xs: [10, 20, 30, 40, 50, 60, 70, 80, 90], ta: 'Feet', tb: 'Metres', ua: 'feet', ub: 'm' },
  { a: 'cups', b: 'millilitres', fa: (v) => `${num(v)} cups`, fb: (v) => `${num(v)} ml`, r: 250, xmax: 8, xstep: 1, xminor: 2, ymax: 2000, ystep: 500, yminor: 10, xs: [1, 2, 3, 4, 5, 6, 7], ta: 'Cups', tb: 'Millilitres', ua: 'cups', ub: 'ml' },
  { a: 'metres per second', b: 'kilometres per hour', fa: (v) => `${num(v)} m/s`, fb: (v) => `${num(v)} km/h`, r: 3.6, xmax: 30, xstep: 5, xminor: 5, ymax: 110, ystep: 20, yminor: 5, xs: [10, 20, 30], ta: 'Speed (m/s)', tb: 'Speed (km/h)', ua: 'm/s', ub: 'km/h' },
  { a: 'pounds (£)', b: 'Swiss francs', fa: (v) => money(v), fb: (v) => `${num(v)} francs`, r: 1.1, xmax: 100, xstep: 10, xminor: 5, ymax: 110, ystep: 10, yminor: 5, xs: [10, 20, 30, 40, 50, 60, 70, 80, 90], what: 'currency', ta: 'Pounds (£)', tb: 'Swiss francs', ua: 'pounds', ub: 'francs' },
];

function convChart(k) {
  const c = chart({
    xmin: 0, xmax: k.xmax, ymin: 0, ymax: k.ymax, xstep: k.xstep, ystep: k.ystep, xminor: k.xminor, yminor: k.yminor,
    w: 330, h: 250, xtitle: k.ta, ytitle: k.tb,
  });
  return c;
}

export const rlConversion = G('gr-rl-conversion', 'gr-real-life', (rng, d) => {
  const k = pick(rng, CONVERSIONS);
  const f = (x) => tidy(k.r * x + (k.c || 0));
  const c = convChart(k);
  const vis = c.wrap(c.seg([0, f(0)], [k.xmax, f(k.xmax)]));
  const mode = d === 'easy' ? pick(rng, ['fwd', 'back']) : d === 'medium' ? pick(rng, ['fwd', 'back', 'beyond']) : pick(rng, k.what === 'currency' ? ['beyond', 'compare', 'back'] : ['beyond', 'beyond', 'back']);
  const sqX = k.xstep / k.xminor; const sqY = k.ystep / k.yminor;
  const intro = `The graph can be used to convert between ${k.a} and ${k.b}.`;
  if (mode === 'fwd' || mode === 'back') {
    const x = pick(rng, k.xs.filter((v) => v < k.xmax || mode === 'fwd'));
    const y = f(x);
    const fwd = mode === 'fwd';
    const ans = fwd ? y : x;
    const fmt = fwd ? k.fb : k.fa;
    const dist = fwd ? [y + sqY, y - sqY, k.c ? y - k.c : tidy(x / k.r), x, tidy(y + (sqY > 1 ? 1 : 0.5) * (k.yminor > 1 ? 1 : 0))]
      : [x + sqX, x - sqX, f(y) > 0 && f(y) <= 3 * Math.max(x, y) ? f(y) : null, y, tidy(y / k.r)];
    return {
      prompt: `${intro}<br>Use the graph to convert ${fwd ? k.fa(x) : k.fb(y)} into ${fwd ? k.ub : k.ua}.`,
      visual: vis,
      answer: fmt(ans),
      distractors: UQ(dist.filter((v) => v !== null && v > 0 && Number.isFinite(v) && v !== ans && Number.isInteger(tidy(v * 4))).map((v) => fmt(tidy(v))), fmt(ans)),
      typed: { kind: 'number', value: ans, tolerance: (fwd ? sqY : sqX) / 2 },
      solution: [
        `Find ${fwd ? k.fa(x) : k.fb(y)} on the ${fwd ? 'horizontal' : 'vertical'} axis, go ${fwd ? 'up' : 'across'} to the line, then ${fwd ? 'across' : 'down'} to the other axis.`,
        `Check the scale: one small square on the ${fwd ? "vertical" : "horizontal"} axis is ${num(fwd ? sqY : sqX)} ${fwd ? k.ub : k.ua}.`,
        `Answer: ${fmt(ans)}`,
      ],
    };
  }
  if (mode === 'beyond') {
    // Amount bigger than the graph shows: read a convenient value and scale (only valid for proportional graphs).
    if (k.c) {
      const x = pick(rng, k.xs); const y = f(x);
      return {
        prompt: `${intro}<br>Use the graph to convert ${k.fb(y)} into ${k.ua}.`,
        visual: vis,
        answer: k.fa(x),
        distractors: UQ([x + sqX, x - sqX, tidy(y / k.r), y - k.c, tidy((y - k.c) * k.r)].filter((v) => v > 0 && Number.isInteger(v * 2)).map((v) => k.fa(v)), k.fa(x)),
        typed: { kind: 'number', value: x, tolerance: sqX / 2 },
        solution: [`Find ${k.fb(y)} on the vertical axis and go across to the line, then down.`, 'This graph does not start at 0, so you cannot just divide by a rate.', `Answer: ${k.fa(x)}`],
      };
    }
    const x0 = pick(rng, k.xs); const mult = pick(rng, [3, 4, 5, 6, 10]);
    const X = x0 * mult; const Y = f(X);
    if (X <= k.xmax) throw new Error('r');
    const fwd = chance(rng, 0.6);
    const ans = fwd ? Y : X;
    const fmt = fwd ? k.fb : k.fa;
    const dist = fwd ? [f(x0) + X - x0, f(k.xmax), tidy(X / k.r), tidy(Y + f(x0)), tidy(f(x0) * (mult + 1))] : [tidy(Y * k.r), k.xmax, tidy(X + x0), tidy(Y - (f(x0) - x0)), tidy(x0 * (mult - 1))];
    return {
      prompt: `${intro}<br>${fwd ? `Convert ${k.fa(X)} into ${k.ub}.` : `Convert ${k.fb(Y)} into ${k.ua}.`}`,
      visual: vis,
      answer: fmt(ans),
      distractors: UQ(dist.filter((v) => v > 0 && v !== ans).map((v) => fmt(tidy(v))), fmt(ans)),
      typed: { kind: 'number', value: ans },
      solution: [
        `${fwd ? k.fa(X) : k.fb(Y)} is off the graph, so convert a smaller amount and multiply. The graph is a straight line through the origin, so the amounts are in direct proportion.`,
        `From the graph, ${k.fa(x0)} = ${k.fb(f(x0))}.`,
        fwd ? `${k.fa(X)} is ${mult} times as much: $${tnum(f(x0))} \\times ${mult} = ${tnum(Y)}$` : `${k.fb(Y)} is ${mult} times as much: $${tnum(x0)} \\times ${mult} = ${tnum(X)}$`,
        `Answer: ${fmt(ans)}`,
      ],
    };
  }
  // compare prices (currency only)
  const [who] = names(rng, 1);
  const item = pick(rng, ['pair of trainers', 'jacket', 'watch', 'pair of headphones', 'rucksack', 'football shirt', 'camera', 'pair of sunglasses']);
  const x = pick(rng, k.xs.filter((v) => v >= k.xmax * 0.3));
  const ukPrice = x; const abroad = tidy(f(x) + pick(rng, [-1, 1]) * pick(rng, [2, 3, 4, 5, 6]) * sqY);
  const abroadInPounds = tidy(abroad / k.r);
  if (!Number.isInteger(abroadInPounds * 100)) throw new Error('r');
  const diff = tidy(Math.abs(abroadInPounds - ukPrice));
  const cheaperUK = ukPrice < abroadInPounds;
  if (diff === 0 || !Number.isInteger(diff * 100)) throw new Error('r');
  const ans = `UK, by ${money(diff)}`;
  const answerText = cheaperUK ? ans : `Abroad, by ${money(diff)}`;
  const diffB = tidy(Math.abs(f(ukPrice) - abroad));
  return {
    prompt: `${intro}<br>${who} sees a ${item} for ${money(ukPrice)} in the UK and for ${k.fb(abroad)} abroad.<br>Where is it cheaper, and by how much in pounds?`,
    visual: vis,
    answer: answerText,
    distractors: UQ([cheaperUK ? `Abroad, by ${money(diff)}` : ans, `UK, by ${money(diff * 2)}`, `Abroad, by ${money(diffB)}`, `UK, by ${money(diffB)}`, `Abroad, by ${money(tidy(diff + 1))}`, `UK, by ${money(tidy(diff + 1))}`], answerText),
    solution: [
      `Convert the UK price with the graph: ${money(ukPrice)} = ${k.fb(f(ukPrice))}.`,
      `So it costs ${k.fb(f(ukPrice))} in the UK and ${k.fb(abroad)} abroad: it is cheaper ${cheaperUK ? 'in the UK' : 'abroad'} by ${k.fb(diffB)}.`,
      `In pounds: ${k.fb(diffB)} = ${money(diff)} (one ${k.ua === 'pounds' ? 'pound' : k.ua} is ${num(k.r)} ${k.ub}).`,
      `Answer: ${answerText}`,
    ],
  };
}, { title: 'Conversion graphs', word: true });

/* ================================================================== */
/* gr-real-life: fixed charge + rate                                   */
/* ================================================================== */

// fixed and rate in the y-unit (£ unless pence:true); x-axis 0..xmax.
const CHARGES = [
  { what: 'a taxi journey', x: 'Distance (miles)', unit: 'mile', units: 'miles', fixed: [2, 3, 4, 5], rate: [1.5, 2, 2.5], xmax: 10, xstep: 2, xminor: 2, fixedWord: 'fixed charge', ctx: 'A taxi firm charges a fixed amount plus a cost for each mile.' },
  { what: 'a phone call', x: 'Length of call (minutes)', unit: 'minute', units: 'minutes', fixed: [10, 15, 20, 25, 30], rate: [5, 8, 10, 12], xmax: 5, xstep: 1, xminor: 2, pence: true, fixedWord: 'connection charge', ctx: 'The cost of a phone call is a connection charge plus a charge per minute.' },
  { what: 'a plumber', x: 'Time (hours)', unit: 'hour', units: 'hours', fixed: [30, 40, 50, 60], rate: [20, 25, 30, 35, 40], xmax: 6, xstep: 1, xminor: 2, fixedWord: 'call-out charge', ctx: 'A plumber charges a call-out fee plus an amount for each hour worked.' },
  { what: 'bike hire', x: 'Time (hours)', unit: 'hour', units: 'hours', fixed: [4, 5, 6, 8, 10], rate: [2, 3, 4], xmax: 8, xstep: 1, xminor: 2, fixedWord: 'fixed hire charge', ctx: 'A bike hire shop charges a fixed amount plus a cost per hour.' },
  { what: 'car hire', x: 'Number of days', unit: 'day', units: 'days', fixed: [20, 30, 40, 50], rate: [25, 30, 35, 40], xmax: 7, xstep: 1, xminor: 2, fixedWord: 'booking fee', ctx: 'A car hire company charges a booking fee plus a daily rate.' },
  { what: 'gym membership', x: 'Number of months', unit: 'month', units: 'months', fixed: [20, 30, 40, 50], rate: [15, 20, 25, 30], xmax: 12, xstep: 2, xminor: 2, fixedWord: 'joining fee', ctx: 'A gym charges a joining fee plus a monthly fee.' },
  { what: 'electricity', x: 'Units used (kWh)', unit: 'unit', units: 'units', fixed: [10, 12, 15, 20], rate: [0.2, 0.25, 0.3], xmax: 200, xstep: 40, xminor: 4, fixedWord: 'standing charge', ctx: 'An electricity bill is a standing charge plus a cost for each unit (kWh) used.' },
  { what: 'window cleaning', x: 'Number of windows', unit: 'window', units: 'windows', fixed: [4, 5, 6, 8], rate: [1, 1.5, 2], xmax: 20, xstep: 4, xminor: 4, fixedWord: 'call-out charge', ctx: 'A window cleaner charges a call-out fee plus an amount per window.' },
  { what: 'hiring a hall', x: 'Number of guests', unit: 'guest', units: 'guests', fixed: [50, 80, 100, 120], rate: [5, 8, 10, 12], xmax: 50, xstep: 10, xminor: 5, fixedWord: 'hire charge', ctx: 'A village hall charges a fixed hire charge plus an amount per guest for food.' },
  { what: 'a delivery', x: 'Mass (kg)', unit: 'kg', units: 'kg', fixed: [3, 4, 5, 6], rate: [0.5, 1, 1.5], xmax: 20, xstep: 4, xminor: 4, fixedWord: 'fixed charge', ctx: 'A courier charges a fixed amount plus a cost for each kilogram.' },
  { what: 'kayak hire', x: 'Time (hours)', unit: 'hour', units: 'hours', fixed: [5, 8, 10, 12], rate: [4, 5, 6, 8], xmax: 6, xstep: 1, xminor: 2, fixedWord: 'safety-kit charge', ctx: 'A lake centre charges a fixed safety-kit fee plus an hourly rate to hire a kayak.' },
  { what: 'tutoring', x: 'Number of lessons', unit: 'lesson', units: 'lessons', fixed: [10, 15, 20, 25], rate: [20, 25, 30], xmax: 10, xstep: 2, xminor: 2, fixedWord: 'registration fee', ctx: 'A tutor charges a one-off registration fee plus a price per lesson.' },
  { what: 'printing leaflets', x: 'Number of leaflets', unit: '100 leaflets', units: 'leaflets', per: 100, fixed: [10, 15, 20, 25], rate: [4, 5, 6, 8], xmax: 1000, xstep: 200, xminor: 2, fixedWord: 'set-up charge', ctx: 'A printer charges a set-up fee plus a cost for every 100 leaflets.' },
  { what: 'a water bill', x: 'Water used (m³)', unit: 'm³', units: 'm³', fixed: [20, 25, 30, 40], rate: [2, 2.5, 3], xmax: 40, xstep: 10, xminor: 5, fixedWord: 'standing charge', ctx: 'A water bill is made up of a standing charge plus a cost for each cubic metre of water used.' },
];

function chargeSetup(rng) {
  const k = pick(rng, CHARGES);
  const fixed = pick(rng, k.fixed); const rate = pick(rng, k.rate);
  const per = k.per || 1;
  const f = (x) => tidy(fixed + (rate * x) / per);
  const top = f(k.xmax);
  const ystepCands = k.pence ? [10, 20] : [2, 5, 10, 20, 25, 50, 100];
  const ystep = ystepCands.find((s) => top / s <= 8) || ystepCands[ystepCands.length - 1];
  const yminor = ystep % 5 === 0 ? 5 : 2;
  const ymax = ceilTo(top + ystep * 0.3, ystep);
  // x values whose cost lands exactly on a small square
  const sqY = ystep / yminor; const sqX = k.xstep / k.xminor;
  const xs = []; for (let x = sqX; x < k.xmax; x += sqX) if (Number.isInteger(tidy(f(x) / sqY))) xs.push(tidy(x));
  const fmtY = (v) => (k.pence ? `${num(v)} pence` : money(v, { forcePence: !Number.isInteger(v) }));
  const c = chart({ xmin: 0, xmax: k.xmax, ymin: 0, ymax, xstep: k.xstep, ystep, xminor: k.xminor, yminor, w: 330, h: 240, xtitle: k.x, ytitle: k.pence ? 'Cost (pence)' : 'Cost (£)' });
  return { k, fixed, rate, per, f, c, xs, fmtY, sqY, sqX, ymax };
}

export const rlFixedCharge = G('gr-rl-fixed-charge', 'gr-real-life', (rng, d) => {
  const S = chargeSetup(rng);
  const { k, fixed, rate, per, f, c, xs, fmtY } = S;
  if (xs.length < 2) throw new Error('r');
  const vis = c.wrap(c.seg([0, fixed], [k.xmax, f(k.xmax)]));
  const modes = d === 'easy' ? ['fixed', 'read', 'readBack'] : d === 'medium' ? ['rate', 'read', 'readBack', 'fixed'] : ['rate', 'beyond', 'beyond', 'readBack'];
  const mode = pick(rng, modes);
  const head = `${k.ctx}<br>The graph shows the cost of ${k.what}.`;
  const xWord = (x) => (k.units === 'kg' || k.units === 'm³' ? `${num(x)} ${k.units}` : `${num(x)} ${x === 1 ? k.unit : k.units}`);
  if (mode === 'fixed') {
    return {
      prompt: `${head}<br>What is the ${k.fixedWord}?`,
      visual: vis,
      answer: fmtY(fixed),
      distractors: UQ([fmtY(rate), fmtY(f(k.xstep)), fmtY(f(1 * (k.per || 1))), fmtY(fixed + S.sqY), fmtY(f(k.xmax)), fmtY(fixed * 2)].filter((s) => s !== fmtY(fixed)), fmtY(fixed)),
      typed: { kind: 'number', value: k.pence ? fixed : fixed },
      solution: [`The ${k.fixedWord} is what you pay before any ${k.units} — the cost when the ${k.x.split(' (')[0].toLowerCase()} is $0$.`, `That is where the line meets the vertical axis: ${fmtY(fixed)}.`, `Answer: ${fmtY(fixed)}`],
    };
  }
  if (mode === 'rate') {
    const x1 = k.xmax;
    const rateTxt = k.pence ? `${num(rate)} pence` : money(rate, { forcePence: !Number.isInteger(rate) });
    return {
      prompt: `${head}<br>How much is charged for each ${k.unit}?`,
      visual: vis,
      answer: rateTxt,
      distractors: UQ([f(per), tidy(f(x1) / (x1 / per)), fixed, tidy(rate * 2), tidy(rate / 2), tidy(rate + fixed)].filter((v) => v > 0 && v !== rate && nice(v)).map(fmtY), rateTxt),
      typed: { kind: 'number', value: rate },
      solution: [
        'The charge per unit is the <b>gradient</b> of the line: how much the cost goes up for each extra unit.',
        `From ${xWord(0)} to ${xWord(x1)} the cost rises from ${fmtY(fixed)} to ${fmtY(f(x1))}, an increase of ${fmtY(tidy(f(x1) - fixed))}.`,
        `${fmtY(tidy(f(x1) - fixed))} ÷ ${num(x1 / per)} = ${rateTxt} per ${k.unit}. (Dividing ${fmtY(f(x1))} by ${num(x1 / per)} would wrongly include the ${k.fixedWord}.)`,
        `Answer: ${rateTxt}`,
      ],
    };
  }
  if (mode === 'read' || mode === 'readBack') {
    const x = pick(rng, xs); const y = f(x);
    const [who] = names(rng, 1);
    if (mode === 'read') {
      return {
        prompt: `${head}<br>Use the graph to find the cost for ${xWord(x)}.`,
        visual: vis,
        answer: fmtY(y),
        distractors: UQ([y + S.sqY, y - S.sqY, tidy(y - fixed), tidy((rate * x) / per), f(x + S.sqX)].filter((v) => v > 0 && v !== y).map(fmtY), fmtY(y)),
        typed: { kind: 'number', value: y, tolerance: S.sqY / 2 },
        solution: [`Go up from ${xWord(x)} on the horizontal axis to the line, then across to the cost axis.`, `Each small square on the cost axis is ${fmtY(S.sqY)}.`, `Answer: ${fmtY(y)}`],
      };
    }
    return {
      prompt: `${head}<br>${who} paid ${fmtY(y)}. Use the graph to find the number of ${k.units}.`,
      visual: vis,
      answer: xWord(x),
      distractors: UQ([x + S.sqX, x - S.sqX, tidy(y / rate * per), tidy((y + fixed) / rate * per), y].filter((v) => v > 0 && v !== x && Number.isInteger(v * 2)).map(xWord), xWord(x)),
      typed: { kind: 'number', value: x, tolerance: S.sqX / 2 },
      solution: [`Find ${fmtY(y)} on the cost axis, go across to the line, then down.`, `Each small square on the horizontal axis is ${num(S.sqX)}.`, `Answer: ${xWord(x)}`],
    };
  }
  // beyond the graph: fixed + rate × x (not a multiple of a reading)
  const mult = pick(rng, [2, 3, 4]);
  const X = k.xmax * mult / 2 + (k.xmax / 2) * (mult === 2 ? 1 : 0);
  if (X <= k.xmax) throw new Error('r');
  const ans = f(X);
  const wrongProp = tidy(f(k.xmax) * (X / k.xmax));
  return {
    prompt: `${head}<br>Work out the cost for ${xWord(X)}.`,
    visual: vis,
    answer: fmtY(ans),
    distractors: UQ([wrongProp, tidy(rate * X / per), tidy(ans + fixed), tidy(f(k.xmax) + rate * X / per), tidy(ans - rate)].filter((v) => v > 0 && v !== ans).map(fmtY), fmtY(ans)),
    typed: { kind: 'number', value: ans },
    solution: [
      `From the graph: ${k.fixedWord} ${fmtY(fixed)}, and the cost rises by ${fmtY(tidy(f(k.xmax) - fixed))} over ${xWord(k.xmax)}, i.e. ${k.pence ? `${num(rate)} pence` : money(rate, { forcePence: !Number.isInteger(rate) })} per ${k.unit}.`,
      `Cost $= ${tnum(fixed)} + ${tnum(rate)} \\times ${tnum(X / per)} = ${tnum(ans)}$`,
      `Don't just scale up the cost of ${xWord(k.xmax)} — that would pay the ${k.fixedWord} more than once.`,
      `Answer: ${fmtY(ans)}`,
    ],
  };
}, { title: 'Fixed charge plus rate graphs', word: true });

/* ================================================================== */
/* gr-real-life: comparing two tariffs                                  */
/* ================================================================== */

const TARIFFS = [
  { ctx: 'Two phone plans', A: 'Plan A', B: 'Plan B', x: 'Minutes used', unit: 'minute', units: 'minutes', xmax: 300, xstep: 50, xminor: 5, scaleX: 10 },
  { ctx: 'Two taxi firms', A: 'Speedy Cabs', B: 'City Taxis', x: 'Distance (miles)', unit: 'mile', units: 'miles', xmax: 20, xstep: 2, xminor: 2, scaleX: 1 },
  { ctx: 'Two plumbers', A: 'Plumber A', B: 'Plumber B', x: 'Time (hours)', unit: 'hour', units: 'hours', xmax: 8, xstep: 1, xminor: 2, scaleX: 1 },
  { ctx: 'Two car hire companies', A: 'Hire-It', B: 'DriveAway', x: 'Number of days', unit: 'day', units: 'days', xmax: 10, xstep: 1, xminor: 2, scaleX: 1 },
  { ctx: 'Two gyms', A: 'FitZone', B: 'PowerGym', x: 'Number of visits', unit: 'visit', units: 'visits', xmax: 20, xstep: 2, xminor: 2, scaleX: 1 },
  { ctx: 'Two electricity suppliers', A: 'Supplier A', B: 'Supplier B', x: 'Units used (kWh)', unit: 'unit', units: 'units', xmax: 400, xstep: 50, xminor: 5, scaleX: 10 },
  { ctx: 'Two printing firms', A: 'PrintFast', B: 'InkWell', x: 'Number of posters', unit: 'poster', units: 'posters', xmax: 50, xstep: 10, xminor: 5, scaleX: 1 },
  { ctx: 'Two bike hire shops', A: 'Wheels', B: 'Pedal Power', x: 'Time (hours)', unit: 'hour', units: 'hours', xmax: 10, xstep: 1, xminor: 2, scaleX: 1 },
  { ctx: 'Two removal firms', A: 'MoveIt', B: 'BoxVan', x: 'Distance (miles)', unit: 'mile', units: 'miles', xmax: 100, xstep: 10, xminor: 5, scaleX: 5 },
  { ctx: 'Two cleaners', A: 'Sparkle', B: 'Shine', x: 'Time (hours)', unit: 'hour', units: 'hours', xmax: 8, xstep: 1, xminor: 2, scaleX: 1 },
  { ctx: 'Two swimming pools', A: 'Members', B: 'Pay as you go', x: 'Number of swims', unit: 'swim', units: 'swims', xmax: 20, xstep: 2, xminor: 2, scaleX: 1 },
  { ctx: 'Two caterers', A: 'Feast', B: 'Banquet', x: 'Number of guests', unit: 'guest', units: 'guests', xmax: 100, xstep: 10, xminor: 5, scaleX: 5 },
  { ctx: 'Two driving schools', A: 'Pass Plus', B: 'Road Ready', x: 'Number of lessons', unit: 'lesson', units: 'lessons', xmax: 20, xstep: 2, xminor: 2, scaleX: 1 },
];

export const rlCompare = G('gr-rl-compare', 'gr-real-life', (rng, d) => {
  const k = pick(rng, TARIFFS);
  // A: fixed + low rate; B: no/low fixed + high rate. Cross at xc (on the grid).
  const sqX = k.xstep / k.xminor;
  const xc = Math.round((k.xmax * (0.35 + rng() * 0.3)) / (sqX * 2)) * sqX * 2;
  const rB = pick(rng, [2, 3, 4, 5, 6, 8, 10]) / k.scaleX; const rA = rB / pick(rng, [2, 3, 4]);
  const fB0 = chance(rng, 0.6) ? 0 : pick(rng, [5, 10]);
  const fA0 = tidy(fB0 + (rB - rA) * xc);
  const A = (x) => tidy(fA0 + rA * x); const B = (x) => tidy(fB0 + rB * x);
  const top = Math.max(A(k.xmax), B(k.xmax));
  if (![fA0, rA * sqX, rB * sqX].every((v) => Number.isInteger(tidy(v * 2)))) throw new Error('r');
  const ystep = [5, 10, 20, 25, 50, 100, 200].find((s) => top / s <= 8);
  const yminor = 5; const sqY = ystep / yminor;
  const ymax = ceilTo(top, ystep);
  const c = chart({ xmin: 0, xmax: k.xmax, ymin: 0, ymax, xstep: k.xstep, ystep, xminor: k.xminor, yminor, w: 340, h: 250, xtitle: k.x, ytitle: 'Cost (£)' });
  const linesSvg = c.seg([0, fA0], [k.xmax, A(k.xmax)]) + c.seg([0, fB0], [k.xmax, B(k.xmax)], { color: ACCENT2 });
  const labs = lineLabel(c, rA, fA0, k.A, { color: ACCENT, at: 0.9 }) + lineLabel(c, rB, fB0, k.B, { color: ACCENT2, at: 0.5, side: -1 });
  const vis = c.wrap(linesSvg + labs);
  const head = `${k.ctx}, ${k.A} and ${k.B}, charge different prices. The graph shows their charges.`;
  const mode = d === 'easy' ? 'same' : d === 'medium' ? pick(rng, ['same', 'cheaper']) : pick(rng, ['diff', 'cheaper', 'same']);
  const xw = (x) => `${num(x)} ${x === 1 ? k.unit : k.units}`;
  if (mode === 'same') {
    return {
      prompt: `${head}<br>For how many ${k.units} do the two charge the same amount?`,
      visual: vis,
      answer: T(xc),
      distractors: UQ([A(xc), xc + sqX, xc - sqX, fA0, xc + 2 * sqX].filter((v) => v > 0 && v !== xc && Number.isInteger(v)).map(T), T(xc)),
      typed: { kind: 'number', value: xc, tolerance: sqX / 2 },
      solution: [`The costs are the same where the two lines <b>cross</b>.`, `They cross at ${xw(xc)} (cost ${money(A(xc))}). Read the horizontal axis, not the cost.`, `Answer: ${xw(xc)}`],
    };
  }
  const x = pick(rng, [xc / 2, xc + (k.xmax - xc) / 2].map((v) => Math.round(v / sqX) * sqX).filter((v) => v > 0 && v < k.xmax && v !== xc));
  const a = A(x); const b = B(x);
  if (![a, b].every((v) => Number.isInteger(tidy(v / sqY)))) throw new Error('r');
  const cheaper = a < b ? k.A : k.B;
  const dif = tidy(Math.abs(a - b));
  if (mode === 'cheaper') {
    const ans = `${cheaper}, by ${money(dif)}`;
    const other = cheaper === k.A ? k.B : k.A;
    return {
      prompt: `${head}<br>Which is cheaper for ${xw(x)}, and by how much?`,
      visual: vis,
      answer: ans,
      distractors: UQ([`${other}, by ${money(dif)}`, `${cheaper}, by ${money(tidy(dif + sqY))}`, `${cheaper}, by ${money(Math.min(a, b))}`, `${other}, by ${money(tidy(dif * 2))}`, `They cost the same`], ans),
      solution: [`Read both lines at ${xw(x)}: ${k.A} costs ${money(a)}, ${k.B} costs ${money(b)}.`, `Difference: ${money(Math.max(a, b))} − ${money(Math.min(a, b))} = ${money(dif)}`, `Answer: ${ans}`],
    };
  }
  return {
    prompt: `${head}<br>What is the difference between their charges for ${xw(x)}?`,
    visual: vis,
    answer: money(dif),
    distractors: UQ([tidy(dif + sqY), tidy(dif - sqY), Math.min(a, b), Math.max(a, b), tidy(a + b)].filter((v) => v > 0 && v !== dif).map((v) => money(v)), money(dif)),
    typed: { kind: 'number', value: dif, tolerance: sqY / 2 },
    solution: [`At ${xw(x)}: ${k.A} costs ${money(a)} and ${k.B} costs ${money(b)}.`, `Difference = ${money(dif)}`, `Answer: ${money(dif)}`],
  };
}, { title: 'Comparing two tariffs', word: true });

/* ================================================================== */
/* gr-real-life: rates from graphs (filling, emptying, charging…)       */
/* ================================================================== */

const RATES = [
  { ctx: 'Water leaks out of a tank at a steady rate.', y: 'Volume (litres)', x: 'Time (minutes)', q: 'litres', t: 'minutes', rateU: 'litres per minute', dir: -1, y0: [40, 50, 60, 80], rates: [2, 2.5, 4, 5], xs: 1 },
  { ctx: 'A bath is filled with water at a steady rate.', y: 'Volume (litres)', x: 'Time (minutes)', q: 'litres', t: 'minutes', rateU: 'litres per minute', dir: 1, y0: [0, 10, 20], rates: [8, 10, 12, 15], xs: 1 },
  { ctx: 'A phone is put on charge.', y: 'Battery charge (%)', x: 'Time (minutes)', q: '%', t: 'minutes', rateU: 'percent per minute', dir: 1, cap: 100, y0: [10, 20, 30, 40], rates: [0.5, 1, 1.5, 2], xs: 10 },
  { ctx: 'A candle burns down at a steady rate.', y: 'Height (cm)', x: 'Time (hours)', q: 'cm', t: 'hours', rateU: 'cm per hour', dir: -1, y0: [20, 24, 30], rates: [2, 2.5, 3, 4], xs: 1 },
  { ctx: 'A car uses fuel at a steady rate on a motorway.', y: 'Fuel in tank (litres)', x: 'Distance (km)', q: 'litres', t: 'km', rateU: 'litres per km', dir: -1, y0: [40, 50, 60], rates: [0.05, 0.08, 0.1], xs: 50 },
  { ctx: 'A swimming pool is filled at a steady rate.', y: 'Volume (m³)', x: 'Time (hours)', q: 'm³', t: 'hours', rateU: 'm³ per hour', dir: 1, y0: [0, 20, 40], rates: [10, 15, 20, 25], xs: 1 },
  { ctx: 'An oven heats up at a steady rate.', y: 'Temperature (°C)', x: 'Time (minutes)', q: '°C', t: 'minutes', rateU: '°C per minute', dir: 1, y0: [20], rates: [10, 15, 20, 25], xs: 1 },
  { ctx: 'Maya saves the same amount each week.', y: 'Savings (£)', x: 'Time (weeks)', q: '£', t: 'weeks', rateU: 'pounds per week', dir: 1, y0: [20, 30, 50, 60], rates: [5, 8, 10, 12], xs: 1, money: true },
  { ctx: 'A plant grows at a steady rate.', y: 'Height (cm)', x: 'Time (weeks)', q: 'cm', t: 'weeks', rateU: 'cm per week', dir: 1, y0: [2, 4, 5, 10], rates: [1.5, 2, 2.5, 3], xs: 1 },
  { ctx: 'A water butt fills up during a rain shower.', y: 'Volume (litres)', x: 'Time (minutes)', q: 'litres', t: 'minutes', rateU: 'litres per minute', dir: 1, y0: [10, 20, 30], rates: [3, 4, 5, 6], xs: 1 },
  { ctx: 'A file is downloading at a steady rate.', y: 'Downloaded (MB)', x: 'Time (seconds)', q: 'MB', t: 'seconds', rateU: 'MB per second', dir: 1, y0: [0], rates: [5, 8, 10, 12, 15], xs: 1 },
  { ctx: 'A lorry is loaded with sand at a steady rate.', y: 'Mass of sand (tonnes)', x: 'Time (minutes)', q: 'tonnes', t: 'minutes', rateU: 'tonnes per minute', dir: 1, y0: [0, 2, 4], rates: [0.5, 1, 1.5, 2], xs: 1 },
  { ctx: 'A paddling pool is emptied with a pump.', y: 'Volume (litres)', x: 'Time (minutes)', q: 'litres', t: 'minutes', rateU: 'litres per minute', dir: -1, y0: [200, 240, 300], rates: [10, 12, 15, 20], xs: 1 },
];

export const rlRate = G('gr-rl-rate', 'gr-real-life', (rng, d) => {
  const k = pick(rng, RATES);
  const y0 = pick(rng, k.y0); const rate = pick(rng, k.rates);
  const T0 = k.dir < 0 ? tidy(y0 / rate) : pick(rng, [6, 8, 10, 12]) * k.xs;
  if (!Number.isInteger(T0 / k.xs) || T0 / k.xs > 16 || T0 / k.xs < 4) throw new Error('r');
  const yEnd = tidy(y0 + k.dir * rate * T0);
  if (k.cap && yEnd > k.cap) throw new Error('r');
  const top = Math.max(y0, yEnd);
  const ystep = [1, 2, 5, 10, 20, 25, 50, 100].find((s) => top / s <= 8);
  const yminor = ystep % 5 === 0 ? 5 : 2;
  const xstep = (T0 / k.xs) % 2 === 0 ? 2 * k.xs : k.xs;
  const xmax = ceilTo(T0, xstep);
  const c = chart({ xmin: 0, xmax, ymin: 0, ymax: ceilTo(top * 1.05, ystep), xstep, ystep, xminor: 2, yminor, w: 330, h: 240, xtitle: k.x, ytitle: k.y });
  const vis = c.wrap(c.seg([0, y0], [T0, yEnd]));
  const f = (t) => tidy(y0 + k.dir * rate * t);
  const mode = d === 'easy' ? pick(rng, ['start', 'value']) : d === 'medium' ? pick(rng, ['rate', 'value', 'when']) : pick(rng, ['rate', 'rate', 'when']);
  const fmt = (v) => (k.money ? money(v) : k.q === '%' ? `${num(v)}%` : k.q === '°C' ? `${num(v)}°C` : `${num(v)} ${k.q}`);
  if (mode === 'rate') {
    const ans = `${num(rate)} ${k.rateU}`;
    const wrong = [tidy(T0 / Math.abs(yEnd - y0)), tidy(top / T0), tidy(rate * 2), tidy(Math.abs(yEnd - y0)), tidy(rate / 2), tidy(rate + (k.xs === 1 ? 1 : 0.1))].filter((v) => v > 0 && v !== rate && Number.isFinite(v) && Number.isInteger(tidy(v * 1000)));
    return {
      prompt: `${k.ctx}<br>The graph shows the ${k.y.split(' (')[0].toLowerCase()} over time. Work out the rate, in ${k.rateU}.`,
      visual: vis,
      answer: ans,
      distractors: UQ(wrong.map((v) => `${num(v)} ${k.rateU}`), ans),
      typed: { kind: 'number', value: rate },
      solution: [
        'The rate is the gradient of the line: change in the vertical quantity ÷ change in the horizontal quantity.',
        `It ${k.dir < 0 ? 'falls' : 'rises'} from ${fmt(y0)} to ${fmt(yEnd)} in ${num(T0)} ${k.t}: a change of ${fmt(Math.abs(yEnd - y0))}.`,
        `$${tnum(Math.abs(yEnd - y0))} \\div ${tnum(T0)} = ${tnum(rate)}$`,
        `Answer: ${ans}`,
      ],
    };
  }
  if (mode === 'start') {
    return {
      prompt: `${k.ctx}<br>The graph shows the ${k.y.split(' (')[0].toLowerCase()} over time. What was the ${k.y.split(' (')[0].toLowerCase()} at the start?`,
      visual: vis,
      answer: fmt(y0),
      distractors: UQ([yEnd, rate, y0 + ystep / yminor, T0, y0 - ystep / yminor].filter((v) => v >= 0 && v !== y0).map(fmt), fmt(y0)),
      typed: { kind: 'number', value: y0 },
      solution: [`At the start, time $= 0$: read where the line meets the vertical axis.`, `Answer: ${fmt(y0)}`],
    };
  }
  const sqX = xstep / 2;
  const ts = []; for (let t = sqX; t < T0; t += sqX) if (Number.isInteger(tidy(f(t) / (ystep / yminor)))) ts.push(tidy(t));
  if (!ts.length) throw new Error('r');
  const t = pick(rng, ts); const v = f(t);
  if (mode === 'value') {
    return {
      prompt: `${k.ctx}<br>Use the graph to find the ${k.y.split(' (')[0].toLowerCase()} after ${num(t)} ${k.t}.`,
      visual: vis,
      answer: fmt(v),
      distractors: UQ([v + ystep / yminor, v - ystep / yminor, tidy(rate * t), y0, f(t + sqX)].filter((u) => u >= 0 && u !== v).map(fmt), fmt(v)),
      typed: { kind: 'number', value: v, tolerance: ystep / yminor / 2 },
      solution: [`Go up from ${num(t)} ${k.t} on the time axis to the line, then across.`, `Each small square on the vertical axis is ${num(ystep / yminor)}.`, `Answer: ${fmt(v)}`],
    };
  }
  return {
    prompt: `${k.ctx}<br>How long does it take for the ${k.y.split(' (')[0].toLowerCase()} to reach ${fmt(v)}?`,
    visual: vis,
    answer: `${num(t)} ${k.t}`,
    distractors: UQ([t + sqX, t - sqX, tidy(v / rate), T0, tidy(T0 - t)].filter((u) => u > 0 && u !== t).map((u) => `${num(u)} ${k.t}`), `${num(t)} ${k.t}`),
    typed: { kind: 'number', value: t, tolerance: sqX / 2 },
    solution: [`Find ${fmt(v)} on the vertical axis, go across to the line, then down to the time axis.`, `Or calculate: ${k.dir < 0 ? 'it must fall' : 'it must rise'} by ${fmt(Math.abs(v - y0))} at ${num(rate)} ${k.rateU}, which takes $${tnum(Math.abs(v - y0))} \\div ${tnum(rate)} = ${tnum(t)}$ ${k.t}.`, `Answer: ${num(t)} ${k.t}`],
  };
}, { title: 'Rates of filling, emptying and growing', word: true });

/* ================================================================== */
/* gr-distance-time                                                    */
/* ================================================================== */

const JOURNEYS = [
  { who: 'cycle ride', verb: 'cycles', speeds: [12, 15, 18, 20, 24], dmax: [20, 30] },
  { who: 'walk', verb: 'walks', speeds: [3, 4, 5, 6], dmax: [10, 15] },
  { who: 'car journey', verb: 'drives', speeds: [30, 40, 45, 48, 60], dmax: [80, 100, 120] },
  { who: 'run', verb: 'runs', speeds: [8, 9, 10, 12], dmax: [10, 15] },
  { who: 'bus journey', verb: 'travels by bus', speeds: [20, 24, 30, 36], dmax: [40, 50] },
  { who: 'horse ride', verb: 'rides', speeds: [6, 8, 10, 12], dmax: [15, 20] },
  { who: 'canoe trip', verb: 'paddles', speeds: [3, 4, 5, 6], dmax: [10, 15] },
  { who: 'scooter ride', verb: 'rides a scooter', speeds: [12, 15, 18, 20], dmax: [20, 30] },
  { who: 'delivery round', verb: 'drives a van', speeds: [30, 36, 40, 48], dmax: [60, 80] },
  { who: 'hike', verb: 'hikes', speeds: [3, 4, 5], dmax: [10, 15] },
  { who: 'school trip', verb: 'travels by coach', speeds: [40, 45, 48, 60], dmax: [100, 120] },
  { who: 'motorbike ride', verb: 'rides a motorbike', speeds: [40, 48, 60], dmax: [80, 100, 120] },
  { who: 'sailing trip', verb: 'sails', speeds: [6, 8, 10, 12], dmax: [20, 30] },
];
const clock = (startH, mins) => { const t = startH * 60 + mins; return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };

/** Random journey: out (1–2 legs with a stop), rest, back home. Times in minutes, distances in km. */
function makeJourney(rng) {
  const J = pick(rng, JOURNEYS);
  for (let tries = 0; tries < 200; tries += 1) {
    const legs = [];
    const two = chance(rng, 0.6);
    const durs = [20, 30, 40, 45, 60, 75, 90, 120];
    let dist = 0;
    const outLegs = two ? 2 : 1;
    for (let i = 0; i < outLegs; i += 1) {
      const s = pick(rng, J.speeds); const t = pick(rng, durs);
      const dd = (s * t) / 60;
      if (!Number.isInteger(dd)) { legs.length = 0; break; }
      legs.push({ kind: 'move', t, d: dd, s }); dist += dd;
      legs.push({ kind: 'rest', t: pick(rng, [15, 20, 30, 45, 60]) });
    }
    if (!legs.length) continue;
    const sBack = pick(rng, J.speeds); const tBack = (dist / sBack) * 60;
    if (!Number.isInteger(tBack) || tBack % 5 !== 0) continue;
    legs.push({ kind: 'move', t: tBack, d: -dist, s: sBack });
    const total = legs.reduce((a, l) => a + l.t, 0);
    if (total > 330 || total < 120) continue;
    const dmax = J.dmax.filter((m) => m >= dist).sort((p, q) => p - q)[0] || null;
    if (!dmax) continue;
    // all turning points on the 10-minute grid and on a y small square
    const ystep = dmax <= 30 ? 5 : dmax <= 60 ? 10 : 20; const yminor = ystep === 20 ? 4 : 5;
    const sqY = ystep / yminor;
    let ok = true; let d0 = 0;
    const minorMin = legs.every((l) => l.t % 15 === 0) ? 15 : legs.every((l) => l.t % 10 === 0) ? 10 : 0;
    if (!minorMin) continue;
    for (const l of legs) { if (l.kind === 'move') { d0 += l.d; if (!Number.isInteger(d0 / sqY)) ok = false; } }
    if (!ok) continue;
    // points
    const pts = [[0, 0]]; let tt = 0; let dd = 0;
    for (const l of legs) { tt += l.t; if (l.kind === 'move') dd += l.d; pts.push([tt, dd]); }
    const startH = pick(rng, [8, 9, 10, 11, 13, 14]);
    return { J, legs, pts, total, dist, dmax, ystep, yminor, sqY, startH, minorMin };
  }
  throw new Error('r');
}
function journeyChart(jn) {
  const xmax = ceilTo(jn.total, 60);
  const c = chart({
    xmin: 0, xmax, ymin: 0, ymax: jn.dmax, xstep: 60, ystep: jn.ystep, xminor: 60 / jn.minorMin, yminor: jn.yminor, w: Math.min(400, 85 * (xmax / 60)), h: 230,
    xtitle: 'Time', ytitle: 'Distance from home (km)', fmtX: (v) => clock(jn.startH, v),
  });
  return { c, vis: c.wrap(c.poly(jn.pts)) };
}

export const dtRead = G('gr-dt-read', 'gr-distance-time', (rng, d) => {
  const jn = makeJourney(rng);
  const { c, vis } = journeyChart(jn);
  void c;
  const [who] = names(rng, 1);
  const head = `${who} goes on a ${jn.J.who}. The distance–time graph shows the journey.`;
  const rests = jn.legs.map((l, i) => ({ ...l, i })).filter((l) => l.kind === 'rest');
  const mode = d === 'easy' ? pick(rng, ['stop', 'far', 'home']) : d === 'medium' ? pick(rng, ['stop', 'distAt', 'home', 'total']) : pick(rng, ['totalStop', 'distAt', 'total']);
  const tAt = (i) => jn.pts[i][0];
  if (mode === 'stop' || mode === 'totalStop') {
    const r = pick(rng, rests);
    const ans = mode === 'stop' ? r.t : rests.reduce((a, l) => a + l.t, 0);
    if (mode === 'totalStop' && rests.length < 2) throw new Error('r');
    const start = clock(jn.startH, tAt(r.i)); const end = clock(jn.startH, tAt(r.i + 1));
    return {
      prompt: `${head}<br>${mode === 'stop' ? `${who} stopped at ${start}. For how many minutes did ${who} stop?` : `For how many minutes in total was ${who} not moving?`}`,
      visual: vis,
      answer: `${ans} minutes`,
      distractors: UQ([ans + jn.minorMin, ans - jn.minorMin, ans + 2 * jn.minorMin, r.t === ans ? r.t * 2 : r.t, ans + 60, ans - 2 * jn.minorMin, ans / jn.minorMin].filter((v) => v > 0 && v !== ans).map((v) => `${v} minutes`), `${ans} minutes`),
      typed: { kind: 'number', value: ans },
      solution: [
        'Not moving shows as a <b>horizontal</b> line: the distance from home does not change.',
        mode === 'stop' ? `The horizontal section goes from ${start} to ${end}. Each small square on the time axis is ${jn.minorMin} minutes.` : `The horizontal sections last ${rests.map((l) => `${l.t}`).join(' and ')} minutes (each small square on the time axis is ${jn.minorMin} minutes).`,
        `Answer: ${ans} minutes`,
      ],
    };
  }
  if (mode === 'far') {
    const ans = jn.dist;
    return {
      prompt: `${head}<br>What was the greatest distance ${who} was from home?`,
      visual: vis,
      answer: `${ans} km`,
      distractors: UQ([ans * 2, ans + jn.sqY, ans - jn.sqY, jn.dmax, jn.legs[0].d].filter((v) => v > 0 && v !== ans).map((v) => `${v} km`), `${ans} km`),
      typed: { kind: 'number', value: ans },
      solution: [`The highest point of the graph is the furthest from home.`, `Read across to the distance axis (each small square is ${jn.sqY} km).`, `Answer: ${ans} km`],
    };
  }
  if (mode === 'home') {
    const ans = clock(jn.startH, jn.total);
    const cands = [jn.total - jn.minorMin, jn.total + jn.minorMin, jn.total - 2 * jn.minorMin, jn.total + 2 * jn.minorMin, jn.total - 60, jn.pts[jn.pts.length - 2][0]].filter((v) => v > 0 && v !== jn.total);
    return {
      prompt: `${head}<br>At what time did ${who} arrive back home?`,
      visual: vis,
      answer: ans,
      distractors: UQ(cands.map((v) => clock(jn.startH, v)), ans),
      solution: ['Back home means the distance from home is 0 again — where the graph returns to the time axis.', `That is at ${ans}.`, `Answer: ${ans}`],
    };
  }
  if (mode === 'total') {
    const ans = 2 * jn.dist;
    return {
      prompt: `${head}<br>What was the total distance ${who} travelled?`,
      visual: vis,
      answer: `${ans} km`,
      distractors: UQ([jn.dist, jn.dmax, ans + jn.sqY * 2, jn.legs[0].d * 2, ans + jn.dist].filter((v) => v > 0 && v !== ans).map((v) => `${v} km`), `${ans} km`),
      typed: { kind: 'number', value: ans },
      solution: [`${who} went ${jn.dist} km away from home and then came all the way back.`, `Total distance $= ${jn.dist} + ${jn.dist} = ${ans}$ km. (The graph shows distance <i>from home</i>, so the distance back must be added.)`, `Answer: ${ans} km`],
    };
  }
  // distAt a time during a moving leg or rest
  const i = pick(rng, jn.legs.map((l, j) => j));
  const l = jn.legs[i];
  const tm = l.kind === 'rest' ? tAt(i) + l.t / 2 : tAt(i) + l.t / 2;
  const dd = l.kind === 'rest' ? jn.pts[i][1] : jn.pts[i][1] + l.d / 2;
  if (tm % jn.minorMin !== 0 || !Number.isInteger(dd / jn.sqY)) throw new Error("r");
  if (!Number.isInteger(dd)) throw new Error('r');
  return {
    prompt: `${head}<br>How far from home was ${who} at ${clock(jn.startH, tm)}?`,
    visual: vis,
    answer: `${num(dd)} km`,
    distractors: UQ([dd + jn.sqY, dd - jn.sqY, jn.dist, jn.pts[i][1], jn.pts[i + 1][1], tm / 60].filter((v) => v >= 0 && v !== dd && Number.isInteger(v * 2)).map((v) => `${num(v)} km`), `${num(dd)} km`),
    typed: { kind: 'number', value: dd, tolerance: jn.sqY / 2 },
    solution: [`Find ${clock(jn.startH, tm)} on the time axis (each small square is ${jn.minorMin} minutes), go up to the graph, then across.`, `Each small square on the distance axis is ${jn.sqY} km.`, `Answer: ${num(dd)} km`],
  };
}, { title: 'Read a distance–time graph', word: true });

export const dtSpeed = G('gr-dt-speed', 'gr-distance-time', (rng, d) => {
  const jn = makeJourney(rng);
  const { vis } = journeyChart(jn);
  const [who] = names(rng, 1);
  const moves = jn.legs.map((l, i) => ({ ...l, i })).filter((l) => l.kind === 'move');
  const m = d === 'easy' ? moves[0] : pick(rng, moves);
  const back = m.d < 0;
  const t0 = clock(jn.startH, jn.pts[m.i][0]); const t1 = clock(jn.startH, jn.pts[m.i + 1][0]);
  const ans = m.s; const dist = Math.abs(m.d);
  const wrong = [tidy(dist / m.t), dist, tidy(dist / (m.t / 100)), tidy(m.t / dist), Math.round(dist / Math.max(1, Math.round(m.t / 60))), ans * 2].filter((v) => v > 0 && v !== ans && Number.isInteger(tidy(v * 100)));
  return {
    prompt: `${who} goes on a ${jn.J.who}. The distance–time graph shows the journey.<br>Work out ${who}'s speed ${back ? 'on the way back home' : `between ${t0} and ${t1}`}. Give your answer in km/h.`,
    visual: vis,
    answer: `${num(ans)} km/h`,
    distractors: UQ(wrong.map((v) => `${num(v)} km/h`), `${num(ans)} km/h`),
    typed: { kind: 'number', value: ans },
    solution: [
      'Speed $= \\dfrac{\\text{distance}}{\\text{time}}$ — on a distance–time graph this is the gradient (steepness) of the line.',
      `From ${t0} to ${t1} is ${m.t} minutes $= ${hrs(m.t)}$ hours, and the distance changes by ${dist} km.`,
      `Speed $= ${dist} \\div ${hrs(m.t)} = ${tnum(ans)}$ km/h. (Dividing by ${m.t} minutes would give km per minute.)`,
      `Answer: ${num(ans)} km/h`,
    ],
  };
}, { title: 'Speed from a distance–time graph', word: true });

export const dtAverage = G('gr-dt-average', 'gr-distance-time', (rng, d) => {
  const jn = makeJourney(rng);
  const { vis } = journeyChart(jn);
  const [who] = names(rng, 1);
  const whole = d !== 'easy' && chance(rng, 0.5);
  let dist; let time; let label;
  if (whole) { dist = 2 * jn.dist; time = jn.total; label = 'for the whole journey, including stops'; }
  else {
    // outward journey from home to the furthest point (including any stop on the way)
    const iMax = jn.pts.findIndex((p) => p[1] === jn.dist);
    dist = jn.dist; time = jn.pts[iMax][0]; label = `from home to the furthest point${jn.legs.length > 3 ? ', including the stop on the way' : ''}`;
  }
  const sp = (dist * 60) / time;
  if (!Number.isInteger(sp * 2)) throw new Error('r');
  const ans = sp;
  const moves = jn.legs.filter((l) => l.kind === 'move');
  const movingAll = moves.reduce((a, l) => a + l.t, 0);
  let tt = 0; let movingOut = 0;
  for (const l of jn.legs) { if (tt >= time) break; if (l.kind === 'move') movingOut += l.t; tt += l.t; }
  const wrong = [
    (dist * 60) / (whole ? movingAll : movingOut), // ignored the stops
    whole ? (dist / 2) * 60 / time : null, // one way only
    dist / time, // km per minute
    moves.reduce((a, l) => a + l.s, 0) / moves.length, // mean of the speeds
    dist / (time / 100), // minutes treated as decimal hours
    (dist * 60) / (time + 60),
  ].filter((v) => v !== null && v > 0 && roundTo(v, 1) !== ans);
  return {
    prompt: `${who} goes on a ${jn.J.who}. The distance–time graph shows the journey.<br>Work out ${who}'s average speed ${label}. Give your answer in km/h.`,
    visual: vis,
    answer: `${num(ans)} km/h`,
    distractors: UQ(wrong.map((v) => `${num(roundTo(v, 1))} km/h`), `${num(ans)} km/h`),
    typed: { kind: 'number', value: ans },
    solution: [
      'Average speed $= \\dfrac{\\text{total distance}}{\\text{total time}}$ — the time includes any stops.',
      `Distance: ${dist} km${whole ? ' (there and back)' : ''}. Time: ${time} minutes $= ${hrs(time)}$ hours.`,
      `Average speed $= ${dist} \\div ${hrs(time)} = ${tnum(ans)}$ km/h. Averaging the speeds of the separate parts does not work.`,
      `Answer: ${num(ans)} km/h`,
    ],
  };
}, { title: 'Average speed from a distance–time graph', word: true });

export const dtInterpret = G('gr-dt-interpret', 'gr-distance-time', (rng, d) => {
  const jn = makeJourney(rng);
  const { vis } = journeyChart(jn);
  const [who] = names(rng, 1);
  const moves = jn.legs.map((l, i) => ({ ...l, i })).filter((l) => l.kind === 'move');
  const range = (i) => `Between ${clock(jn.startH, jn.pts[i][0])} and ${clock(jn.startH, jn.pts[i + 1][0])}`;
  if (chance(rng, 0.55) && moves.length >= 2) {
    const fastest = moves.reduce((a, b) => (b.s > a.s ? b : a));
    if (moves.filter((m) => m.s === fastest.s).length > 1) throw new Error('r');
    const ans = range(fastest.i);
    return {
      prompt: `${who} goes on a ${jn.J.who}. The distance–time graph shows the journey.<br>During which part of the journey was ${who} travelling fastest?`,
      visual: vis,
      answer: ans,
      distractors: UQ(jn.legs.map((l, i) => range(i)), ans),
      count: Math.min(5, jn.legs.length),
      solution: ['On a distance–time graph the <b>steepest</b> line shows the fastest speed (whether it slopes up or down).', `The speeds are ${moves.map((m) => `${m.s} km/h`).join(', ')}; the fastest is ${fastest.s} km/h.`, `Answer: ${ans}`],
    };
  }
  const i = pick(rng, jn.legs.map((l, j) => j));
  const l = jn.legs[i];
  const ans = l.kind === 'rest' ? `${who} was stopped` : l.d > 0 ? `${who} was travelling away from home at ${l.s} km/h` : `${who} was travelling back towards home at ${l.s} km/h`;
  const others = [`${who} was stopped`, `${who} was travelling away from home at ${l.s || jn.legs[0].s} km/h`, `${who} was travelling back towards home at ${l.s || jn.legs[0].s} km/h`, `${who} was travelling away from home at ${(l.s || jn.legs[0].s) * 2} km/h`, `${who} was travelling at a constant ${Math.abs(jn.pts[i][1])} km/h`, `${who} was going uphill`];
  return {
    prompt: `${who} goes on a ${jn.J.who}. The distance–time graph shows the journey.<br>Which statement describes the journey ${range(i).toLowerCase()}?`,
    visual: vis,
    answer: ans,
    distractors: UQ(others, ans),
    solution: [
      'Horizontal line: stopped. Line going up: moving away from home. Line going down: coming back. The gradient is the speed.',
      l.kind === 'rest' ? 'This section is horizontal.' : `This section goes ${l.d > 0 ? 'up' : 'down'} by ${Math.abs(l.d)} km in ${l.t} minutes, so the speed is ${l.s} km/h.`,
      `Answer: ${ans}`,
    ],
  };
}, { title: 'Interpret a distance–time graph', word: true });

/* ================================================================== */
/* gr-rates-of-change: velocity–time, gradients and areas                */
/* ================================================================== */

const VEHICLES = ['A car', 'A cyclist', 'A train', 'A tram', 'A runner', 'A motorbike', 'A lorry', 'A bus', 'A go-kart', 'A lift', 'A boat', 'A drone'];

function vtTrip(rng, d) {
  // accelerate 0→V over t1, constant for t2, decelerate to 0 (or to V2) over t3
  for (let k = 0; k < 200; k += 1) {
    const V = pick(rng, [6, 8, 10, 12, 15, 16, 18, 20, 24, 25, 30]);
    const t1 = pick(rng, [2, 4, 5, 6, 8, 10]); const t2 = pick(rng, [4, 5, 6, 8, 10, 12]); const t3 = pick(rng, [2, 3, 4, 5, 6, 8, 10]);
    const startV = d === 'hard' && chance(rng, 0.4) ? pick(rng, [2, 4, 5, 6]) : 0;
    if (startV >= V) continue;
    const a1 = (V - startV) / t1; const a3 = V / t3;
    if (!Number.isInteger(a1 * 4) || !Number.isInteger(a3 * 4)) continue;
    const T = t1 + t2 + t3;
    if (T > 30) continue;
    const pts = [[0, startV], [t1, V], [t1 + t2, V], [T, 0]];
    return { V, t1, t2, t3, T, a1, a3, pts, startV };
  }
  throw new Error('r');
}
function vtChart(trip) {
  const xstep = trip.T <= 16 ? 2 : 5; const ystep = trip.V <= 12 ? 2 : 5;
  const xmax = ceilTo(trip.T, xstep); const ymax = ceilTo(trip.V + 1, ystep);
  const c = chart({ xmin: 0, xmax, ymin: 0, ymax, xstep, ystep, xminor: xstep === 5 ? 5 : 2, yminor: ystep === 5 ? 5 : 2, w: 340, h: 220, xtitle: 'Time (seconds)', ytitle: 'Velocity (m/s)' });
  return { c, vis: c.wrap(c.poly(trip.pts)) };
}

export const rocAcceleration = G('gr-roc-acceleration', 'gr-rates-of-change', (rng, d) => {
  const trip = vtTrip(rng, d);
  const { vis } = vtChart(trip);
  const v = pick(rng, VEHICLES);
  const which = d === 'easy' ? 'first' : pick(rng, ['first', 'last']);
  const a = which === 'first' ? trip.a1 : trip.a3;
  const [ts, te] = which === 'first' ? [0, trip.t1] : [trip.t1 + trip.t2, trip.T];
  const dv = which === 'first' ? trip.V - trip.startV : trip.V; const dt = which === 'first' ? trip.t1 : trip.t3;
  const fmt = (x) => `$${tnum(x)}$ m/s²`;
  const wrong = [tidy(dt / dv), dv, tidy(dv * dt), tidy(dv * dt / 2), which === 'first' ? trip.a3 : trip.a1, tidy(trip.V / te)].filter((x) => x > 0 && x !== a && Number.isInteger(tidy(x * 100)));
  return {
    prompt: `${v} moves along a straight road. The velocity–time graph shows its motion.<br>Work out the ${which === 'first' ? 'acceleration' : 'deceleration'} between $${ts}$ and $${te}$ seconds.`,
    visual: vis,
    answer: fmt(a),
    distractors: UQ(wrong.map(fmt), fmt(a)),
    typed: { kind: 'number', value: a },
    solution: [
      'Acceleration is the <b>gradient</b> of a velocity–time graph: change in velocity ÷ time taken.',
      `Velocity changes by $${dv}$ m/s in $${dt}$ seconds.`,
      `$${dv} \\div ${dt} = ${tnum(a)}$ m/s²${which === 'last' ? ' (the gradient is negative, so it is slowing down: a deceleration)' : ''}`,
      `Answer: ${fmt(a)}`,
    ],
  };
}, { title: 'Acceleration from a velocity–time graph' });

export const rocDistance = G('gr-roc-distance', 'gr-rates-of-change', (rng, d) => {
  const trip = vtTrip(rng, d);
  const { vis } = vtChart(trip);
  const v = pick(rng, VEHICLES);
  const part = d === 'easy' ? pick(rng, ['first', 'middle']) : d === 'medium' ? pick(rng, ['first', 'total', 'last']) : 'total';
  const A1 = ((trip.startV + trip.V) / 2) * trip.t1; const A2 = trip.V * trip.t2; const A3 = (trip.V / 2) * trip.t3;
  const total = A1 + A2 + A3;
  const ans = part === 'first' ? A1 : part === 'middle' ? A2 : part === 'last' ? A3 : total;
  if (!Number.isInteger(ans * 2)) throw new Error('r');
  const range = part === 'first' ? [0, trip.t1] : part === 'middle' ? [trip.t1, trip.t1 + trip.t2] : part === 'last' ? [trip.t1 + trip.t2, trip.T] : [0, trip.T];
  const wrong = [trip.V * trip.T, A1 * 2, A3 * 2, total - A2, trip.V * (range[1] - range[0]), tidy(total / 2), A2].filter((x) => x > 0 && x !== ans);
  return {
    prompt: `${v} moves along a straight road. The velocity–time graph shows its motion.<br>Work out the distance travelled ${part === 'total' ? 'in the whole journey' : `between $${range[0]}$ and $${range[1]}$ seconds`}.`,
    visual: vis,
    answer: `${num(ans)} m`,
    distractors: UQ(wrong.map((x) => `${num(x)} m`), `${num(ans)} m`),
    typed: { kind: 'number', value: ans },
    solution: [
      'Distance travelled is the <b>area under</b> a velocity–time graph.',
      part === 'first' ? `${trip.startV ? 'Trapezium' : 'Triangle'}: $${trip.startV ? `\\frac{${trip.startV} + ${trip.V}}{2}` : `\\frac{1}{2} \\times ${trip.V}`} \\times ${trip.t1} = ${num(A1)}$`
        : part === 'middle' ? `Rectangle: $${trip.V} \\times ${trip.t2} = ${A2}$` : part === 'last' ? `Triangle: $\\frac{1}{2} \\times ${trip.t3} \\times ${trip.V} = ${tnum(A3)}$`
          : `Split into parts: ${trip.startV ? 'trapezium' : 'triangle'} $${tnum(A1)}$ + rectangle $${A2}$ + triangle $${tnum(A3)}$${trip.startV ? '' : ` (or use one trapezium: $\\frac{${trip.t2} + ${trip.T}}{2} \\times ${trip.V}$)`}.`,
      part === 'total' ? `Total $= ${tnum(total)}$ m` : 'Multiply m/s by seconds to get metres.',
      `Answer: ${num(ans)} m`,
    ],
  };
}, { title: 'Distance from the area under a velocity–time graph' });

// Smooth curves with nice values at grid points: v(t) = p t (q − t) / r + s
function curveTrip(rng) {
  for (let k = 0; k < 200; k += 1) {
    const q = pick(rng, [16, 20, 24]); const r = pick(rng, [4, 8, 10, 16]); const s = pick(rng, [0, 2, 4, 5]);
    const f = (t) => (t * (q - t)) / r + s;
    const h = pick(rng, [2, 4]); const n = 4; const end = h * n;
    if (end > q / 2 + 2) continue;
    const vals = Array.from({ length: n + 1 }, (_, i) => f(i * h));
    if (!vals.every((v) => Number.isInteger(v * 2))) continue;
    const vmax = f(Math.min(q / 2, end + 2));
    if (vmax > 40 || vmax < 6) continue;
    return { f, h, n, end, vals, q, r, s, vmax };
  }
  throw new Error('r');
}

export const rocEstimateArea = G('gr-roc-area-estimate', 'gr-rates-of-change', (rng, d) => {
  const cv = curveTrip(rng);
  const v = pick(rng, VEHICLES);
  const xmax = cv.end + (cv.end % 4 === 0 ? 4 : 2);
  const ystep = cv.vmax <= 12 ? 2 : cv.vmax <= 25 ? 5 : 10;
  const c = chart({ xmin: 0, xmax, ymin: 0, ymax: ceilTo(cv.vmax + 1, ystep), xstep: 2, ystep, xminor: 2, yminor: ystep === 2 ? 2 : 5, w: 340, h: 230, xtitle: 'Time (seconds)', ytitle: 'Velocity (m/s)' });
  const strips = cv.vals.map((y, i) => [i * cv.h, y]);
  let marks = '';
  for (const [t, y] of strips) marks += c.seg([t, 0], [t, y], { color: ACCENT2, width: 1.4, dash: '4 3' });
  const vis = c.wrap(c.curve(cv.f, { from: 0, to: xmax }) + marks + strips.map(([t, y]) => c.point(t, y, null, { r: 3 })).join(''));
  const est = tidy((cv.h / 2) * (cv.vals[0] + 2 * (cv.vals[1] + cv.vals[2] + cv.vals[3]) + cv.vals[4]));
  if (d === 'hard' && chance(rng, 0.35)) {
    return {
      prompt: `${v} starts moving. The velocity–time graph is shown. The area under the graph between $0$ and $${cv.end}$ seconds is estimated using ${cv.n} trapeziums of equal width.<br>Is the estimate of the distance travelled an underestimate or an overestimate?`,
      visual: vis,
      answer: 'Underestimate, because the curve is above the tops of the trapeziums',
      distractors: ['Overestimate, because the curve is above the tops of the trapeziums', 'Overestimate, because the trapeziums go above the curve', 'Underestimate, because the velocity is increasing', 'Exact, because the strips are equal widths'],
      count: 4,
      solution: [
        'Each trapezium joins two points on the curve with a straight line.',
        'This curve bends downwards (it is concave), so the straight tops lie <b>below</b> the curve and miss a little area each time.',
        'Answer: Underestimate',
      ],
    };
  }
  const wrong = [tidy(cv.h * (cv.vals[0] + cv.vals[1] + cv.vals[2] + cv.vals[3] + cv.vals[4])), tidy(cv.h * (cv.vals[1] + cv.vals[2] + cv.vals[3] + cv.vals[4])), tidy(cv.h * (cv.vals[0] + cv.vals[1] + cv.vals[2] + cv.vals[3])), tidy(cv.vals[4] * cv.end / 2), tidy(est / 2), tidy(cv.vals[4] * cv.end)].filter((x) => x !== est);
  return {
    prompt: `${v} starts moving. The velocity–time graph is shown.<br>Use ${cv.n} strips of equal width to estimate the distance travelled in the first $${cv.end}$ seconds.<br>The velocities at $${strips.map(([t]) => t).join(', ')}$ seconds are $${cv.vals.map((y) => tnum(y)).join(', ')}$ m/s.`,
    visual: vis,
    answer: `${num(est)} m`,
    distractors: UQ(wrong.map((x) => `${num(x)} m`), `${num(est)} m`),
    typed: { kind: 'number', value: est },
    solution: [
      `Distance = area under the graph. Split it into ${cv.n} trapeziums, each $${cv.h}$ seconds wide.`,
      `Areas: ${strips.slice(0, 4).map(([, y], i) => `$\\frac{${tnum(y)} + ${tnum(cv.vals[i + 1])}}{2} \\times ${cv.h} = ${tnum(tidy(((y + cv.vals[i + 1]) / 2) * cv.h))}$`).join(', ')}`,
      `Total $= ${strips.slice(0, 4).map(([, y], i) => tnum(tidy(((y + cv.vals[i + 1]) / 2) * cv.h))).join(' + ')} = ${tnum(est)}$ m`,
      `Answer: ${num(est)} m`,
    ],
  };
}, { title: 'Estimate the area under a curve' });

export const rocTangent = G('gr-roc-tangent', 'gr-rates-of-change', (rng, d) => {
  // v(t) = s + t(q − t)/r ; tangent at t0 has gradient (q − 2 t0)/r. Distance–time option: rate of change of distance.
  for (let tries = 0; tries < 200; tries += 1) {
    const q = pick(rng, [12, 14, 16, 18, 20, 22, 24]); const r = pick(rng, [2, 4, 5, 8, 10]); const s = pick(rng, [0, 1, 2, 3, 4]);
    const f = (t) => s + (t * (q - t)) / r;
    const t0 = pick(rng, [2, 4, 6, 8, 10, 12, 14, 16].filter((t) => t < q));
    const m = (q - 2 * t0) / r; // gradient
    if (!Number.isInteger(m * 4) || Math.abs(m) < 0.25) continue;
    const y0 = f(t0);
    // two easy-to-read points on the tangent
    const dtc = pick(rng, [2, 4, 6].filter((u) => Number.isInteger(m * u)));
    if (!dtc) continue;
    const pA = [t0 - dtc, y0 - m * dtc]; const pB = [t0 + dtc, y0 + m * dtc];
    if (pA[0] < 0 || pA[1] < 0 || pB[1] < 0 || !Number.isInteger(y0 * 2)) continue;
    const xmax = Math.min(q, 24);
    const vmax = Math.max(f(q / 2), pA[1], pB[1]);
    if (vmax > 40) continue;
    const ystep = vmax <= 12 ? 2 : vmax <= 25 ? 5 : 10;
    const c = chart({ xmin: 0, xmax, ymin: 0, ymax: ceilTo(vmax + 1, ystep), xstep: 2, ystep, xminor: 2, yminor: ystep === 2 ? 2 : 5, w: 340, h: 230, xtitle: 'Time (seconds)', ytitle: 'Velocity (m/s)' });
    const ext = 1.6;
    const tan = c.seg([t0 - dtc * ext, y0 - m * dtc * ext], [t0 + dtc * ext, y0 + m * dtc * ext], { color: ACCENT2, width: 2 });
    const vis = c.wrap(c.curve(f, { from: 0, to: xmax }) + tan + c.point(t0, y0, null, { r: 3.5 }) + c.point(...pA, null, { r: 3, color: ACCENT2 }) + c.point(...pB, null, { r: 3, color: ACCENT2 }));
    const v = pick(rng, VEHICLES);
    const word = m >= 0 ? 'acceleration' : 'deceleration';
    const ans = Math.abs(m);
    const wrong = [tidy(1 / ans), tidy(y0 / t0), tidy(Math.abs(pB[1] - pA[1])), tidy(ans * 2), tidy(f(t0 + 1) - f(t0) === ans ? ans + 0.5 : Math.abs(f(t0 + 1) - f(t0)))].filter((x) => x > 0 && x !== ans && Number.isInteger(tidy(x * 100)));
    const fmt = (x) => `$${tnum(x)}$ m/s²`;
    return {
      prompt: `${v} is moving along a straight road. The velocity–time graph is shown, with a tangent drawn at $t = ${t0}$ seconds.<br>Use the tangent to estimate the ${word} at $${t0}$ seconds.`,
      visual: vis,
      answer: fmt(ans),
      distractors: UQ(wrong.map(fmt), fmt(ans)),
      typed: { kind: 'number', value: ans },
      solution: [
        'The gradient of the tangent gives the rate of change at that instant — here, the acceleration.',
        `Use two points on the tangent: ${`$(${tnum(pA[0])}, ${tnum(pA[1])})$`} and ${`$(${tnum(pB[0])}, ${tnum(pB[1])})$`}.`,
        `Gradient $= \\frac{${tnum(pB[1])} - ${tnum(pA[1])}}{${tnum(pB[0])} - ${tnum(pA[0])}} = ${tnum(m)}$${m < 0 ? ', negative, so it is slowing down' : ''}.`,
        `Answer: ${fmt(ans)}`,
      ],
    };
  }
  throw new Error('r');
}, { title: 'Rate of change from a tangent' });

const AVG_CONTEXTS = [
  { ctx: 'The graph shows the distance travelled by a cyclist who is speeding up.', y: 'Distance (m)', x: 'Time (s)', u: 'm/s', yw: 'distance', xw: 'seconds', shape: 'up' },
  { ctx: 'The graph shows the depth of water in a tank as it is filled.', y: 'Depth (cm)', x: 'Time (minutes)', u: 'cm per minute', yw: 'depth', xw: 'minutes', shape: 'slowUp' },
  { ctx: 'The graph shows the temperature of a cup of tea as it cools.', y: 'Temperature (°C)', x: 'Time (minutes)', u: '°C per minute', yw: 'temperature', xw: 'minutes', shape: 'slowDown', base: [20, 30, 40] },
  { ctx: 'The graph shows the number of bacteria in a sample (in thousands).', y: 'Bacteria (thousands)', x: 'Time (hours)', u: 'thousand per hour', yw: 'number of bacteria', xw: 'hours', shape: 'up' },
  { ctx: 'The graph shows the height of a hot-air balloon as it rises.', y: 'Height (m)', x: 'Time (minutes)', u: 'm per minute', yw: 'height', xw: 'minutes', shape: 'slowUp' },
  { ctx: 'The graph shows the charge in a phone battery while it is charging.', y: 'Charge (%)', x: 'Time (minutes)', u: '% per minute', yw: 'charge', xw: 'minutes', shape: 'slowUp' },
  { ctx: 'The graph shows the speed of a car as it slows down.', y: 'Speed (m/s)', x: 'Time (s)', u: 'm/s per second', yw: 'speed', xw: 'seconds', shape: 'slowDown', base: [0, 2, 4] },
  { ctx: 'The graph shows the height of a ball after it is dropped.', y: 'Height fallen (m)', x: 'Time (tenths of a second)', u: 'm per tenth of a second', yw: 'height fallen', xw: 'tenths of a second', shape: 'up' },
];

export const rocAverageRate = G('gr-roc-average-rate', 'gr-rates-of-change', (rng, d) => {
  const k = pick(rng, AVG_CONTEXTS);
  // Quadratic pieces with integer values at even t: speeding up (convex rising), levelling off (concave rising)
  // or slowing down (convex falling).
  const b = pick(rng, [0.5, 1, 2]); const a0 = pick(rng, [0, 2, 5, 10]);
  const xmax = pick(rng, [8, 10]);
  const base = pick(rng, k.base || [0]);
  const f = k.shape === 'up' ? (t) => a0 + (b * t * t) / 2
    : k.shape === 'slowUp' ? (t) => a0 + (b * (xmax * xmax - (xmax - t) ** 2)) / 2
      : (t) => base + (b * (xmax - t) ** 2) / 2;
  const t1 = pick(rng, [0, 2, 4]); const t2 = t1 + pick(rng, [2, 4]);
  if (t2 > xmax) throw new Error('r');
  const y1 = f(t1); const y2 = f(t2);
  if (!Number.isInteger(y1) || !Number.isInteger(y2)) throw new Error('r');
  const lo = Math.min(f(0), f(xmax)); const hi = Math.max(f(0), f(xmax));
  const ystep = [2, 5, 10, 20].find((s) => (hi - Math.min(0, lo)) / s <= 9) || 20;
  const ymin = 0;
  const c = chart({ xmin: 0, xmax, ymin: Math.max(0, ymin), ymax: ceilTo(hi + 1, ystep), xstep: 2, ystep, xminor: 2, yminor: ystep === 2 ? 2 : 5, w: 330, h: 230, xtitle: k.x, ytitle: k.y });
  const vis = c.wrap(c.curve(f) + c.point(t1, y1, 'A') + c.point(t2, y2, 'B'));
  const rate = tidy((y2 - y1) / (t2 - t1));
  if (!Number.isInteger(rate * 4)) throw new Error('r');
  const ans = `$${tnum(rate)}$ ${k.u}`;
  const wrong = [tidy((t2 - t1) / (y2 - y1)), tidy(y2 / t2), tidy(y2 - y1), tidy(-rate), tidy((y2 + y1) / (t2 + t1 || 1)), tidy(rate * 2)].filter((x) => x !== rate && Number.isFinite(x) && Number.isInteger(tidy(x * 100)));
  return {
    prompt: `${k.ctx}<br>Work out the average rate of change of ${k.yw} between A ($${t1}$ ${k.xw}) and B ($${t2}$ ${k.xw}).`,
    visual: vis,
    answer: ans,
    distractors: UQ(wrong.map((x) => `$${tnum(x)}$ ${k.u}`), ans),
    typed: { kind: 'number', value: rate },
    solution: [
      'The average rate of change between two points is the gradient of the straight line (chord) joining them.',
      `A is $(${t1}, ${y1})$ and B is $(${t2}, ${y2})$.`,
      `Gradient $= \\frac{${y2} - ${y1}}{${t2} - ${t1}} = ${tnum(rate)}$${rate < 0 ? ' (negative: it is decreasing)' : ''}`,
      `Answer: ${ans}`,
    ],
  };
}, { title: 'Average rate of change between two points' });

export const reallifeGenerators = [
  rlConversion, rlFixedCharge, rlCompare, rlRate,
  dtRead, dtSpeed, dtAverage, dtInterpret,
  rocAcceleration, rocDistance, rocEstimateArea, rocTangent, rocAverageRate,
];

void [shuffle, frac];
