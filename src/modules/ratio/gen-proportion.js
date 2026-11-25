// Proportion unit: direct proportion, exchange rates, best buys, inverse proportion, proportion equations.
import {
  pick, int, chance, size, gcd, names, num, tnum, tidy, roundTo, cap, shuffle, sample, Frac,
} from '../../core.js';
import {
  withUnit, gbp, gbpF, dvals, pvals, hasDp, rgen as gen,
} from './helpers.js';
import { svg, line, polyline, text, ACCENT } from '../../svg.js';

/* ================================================================== */
/* rat-direct-proportion                                               */
/* ================================================================== */

// [what, unit, per-person base range, phrase]
const RECIPES = [
  ['flour', 'g', [25, 60], (s, n, a) => `A recipe for pancakes for ${s} people uses ${a} g of flour. How much flour is needed for ${n} people?`],
  ['milk', 'ml', [80, 150], (s, n, a) => `A recipe for ${s} portions of rice pudding needs ${a} ml of milk. How much milk is needed for ${n} portions?`],
  ['carrots', 'g', [50, 150], (s, n, a) => `A soup for ${s} people uses ${a} g of carrots. How many grams of carrots are needed to make the soup for ${n} people?`],
  ['butter', 'g', [10, 25], (s, n, a) => `${s} flapjacks need ${a} g of butter. How much butter is needed for ${n} flapjacks?`],
  ['pasta', 'g', [75, 125], (s, n, a) => `A pasta bake for ${s} people uses ${a} g of pasta. How much pasta is needed for ${n} people?`],
  ['stock', 'ml', [100, 250], (s, n, a) => `A curry for ${s} people uses ${a} ml of stock. How much stock is needed for ${n} people?`],
  ['oats', 'g', [40, 80], (s, n, a) => `A café uses ${a} g of oats to make porridge for ${s} customers. How many grams of oats does it need for ${n} customers?`],
  ['sugar', 'g', [5, 15], (s, n, a) => `A batch of ${s} biscuits contains ${a} g of sugar. How much sugar is in ${n} biscuits?`],
  ['yoghurt', 'ml', [50, 150], (s, n, a) => `Smoothies for ${s} people use ${a} ml of yoghurt. How much yoghurt is needed for ${n} people?`],
  ['minced beef', 'g', [100, 150], (s, n, a) => `A cottage pie for ${s} people uses ${a} g of minced beef. How much minced beef is needed for ${n} people?`],
  ['lemon juice', 'ml', [10, 30], (s, n, a) => `Lemonade for ${s} glasses takes ${a} ml of lemon juice. How much lemon juice is needed for ${n} glasses?`],
  ['cheese', 'g', [20, 50], (s, n, a) => `Sandwiches for ${s} pupils use ${a} g of cheese. How much cheese is needed for ${n} pupils?`],
  ['rice', 'g', [60, 100], (s, n, a) => `A paella for ${s} people needs ${a} g of rice. How much rice is needed to serve ${n} people?`],
  ['chocolate', 'g', [15, 40], (s, n, a) => `${s} brownies need ${a} g of chocolate. How much chocolate is needed for ${n} brownies?`],
];

export const directRecipe = gen('rat-direct-recipe', 'rat-direct-proportion', (rng, d) => {
  for (let i = 0; i < 300; i += 1) {
    const [what, unit, [lo, hi], t] = pick(rng, RECIPES);
    const s = pick(rng, size(d, [2, 4, 5, 10], [4, 6, 8, 12, 5], [6, 8, 12, 15, 9, 18]));
    const n = pick(rng, size(d, [6, 8, 10, 20, 3, 15], [3, 9, 10, 14, 18, 15, 20, 7], [4, 10, 14, 20, 21, 25, 27, 5]));
    if (n === s) continue;
    if (d === 'easy' && n % s !== 0 && s % n !== 0) continue;
    if (d === 'hard' && (n % s === 0 || s % n === 0)) continue; // hard: no whole-number scale factor
    // a realistic amount per person / item
    const per = size(d, int(rng, Math.ceil(lo / 5), Math.floor(hi / 5)) * 5, int(rng, lo, hi), int(rng, lo * 2, hi * 2) / 2);
    const a = tidy(per * s);
    const ans = tidy(per * n);
    if (!hasDp(ans, 1) || !Number.isInteger(a)) continue;
    const fmt = withUnit(unit);
    return {
      prompt: t(s, n, num(a)),
      answer: fmt(ans),
      distractors: dvals(ans, [a + (n - s), a * n, (a * s) / n, a * n / 10, per, ans + per, ans - per, a * Math.round(n / s)], fmt, { dp: 1 }),
      typed: { kind: 'number', value: ans },
      solution: [
        `Use the unitary method: find the amount for 1, then multiply.`,
        `For 1: $${tnum(a)} \\div ${s} = ${tnum(per)}$ ${unit}`,
        `For ${n}: $${tnum(per)} \\times ${n} = ${tnum(ans)}$ ${unit}`,
        `Answer: ${fmt(ans)}`,
      ],
    };
  }
  throw new Error('recipe');
}, { title: 'Scale a recipe (unitary method)', word: true });

// [plural, singular, realistic unit price range in pence]
const COST_ITEMS = [
  ['pens', 'pen', 30, 150], ['bread rolls', 'bread roll', 20, 80], ['cinema tickets', 'cinema ticket', 500, 1400], ['bus tickets', 'bus ticket', 150, 500],
  ['packets of seeds', 'packet of seeds', 100, 300], ['notebooks', 'notebook', 80, 400], ['bottles of water', 'bottle of water', 50, 150],
  ['tins of beans', 'tin of beans', 40, 120], ['metres of ribbon', 'metre of ribbon', 50, 300], ['kilograms of apples', 'kilogram of apples', 150, 350],
  ['litres of petrol', 'litre of petrol', 130, 160], ['tennis balls', 'tennis ball', 50, 200], ['concert tickets', 'concert ticket', 2000, 6000],
  ['bags of compost', 'bag of compost', 300, 800], ['hours of parking', 'hour of parking', 100, 400],
];

export const directCost = gen('rat-direct-cost', 'rat-direct-proportion', (rng, d) => {
  for (let i = 0; i < 300; i += 1) {
    const [items, one, plo, phi] = pick(rng, COST_ITEMS);
    // easy: multiples of 10p, medium: 5p, hard: any penny
    const stepP = size(d, 10, 5, 1);
    const unitP = int(rng, Math.ceil(plo / stepP), Math.floor(phi / stepP)) * stepP;
    const a = int(rng, 2, size(d, 6, 9, 12));
    const b = int(rng, 2, size(d, 12, 20, 30));
    if (a === b) continue;
    const mode = d === 'easy' ? 'cost' : pick(rng, ['cost', 'cost', 'howmany']);
    const [N] = names(rng, 1);
    if (mode === 'cost') {
      const ans = unitP * b;
      return {
        prompt: pick(rng, [`${a} ${items} cost ${gbp(unitP * a)}. How much do ${b} ${items} cost?`, `${N} pays ${gbp(unitP * a)} for ${a} ${items}. At the same price, how much would ${b} ${items} cost?`]),
        answer: gbp(ans),
        distractors: pvals(ans, [unitP * a + (b - a) * 100, unitP * a * b, (unitP * a * a) / b, unitP * a + (b - a) * unitP * 2, unitP * (b + 1), unitP * (b - 1), unitP * a * Math.round(b / a)]),
        typed: { kind: 'number', value: ans / 100 },
        calculator: d === 'hard',
        solution: [`Cost of 1 ${one}: ${gbp(unitP * a)} $\\div ${a} =$ ${gbp(unitP)}`, `Cost of ${b}: $${b} \\times$ ${gbp(unitP)} $=$ ${gbp(ans)}`, `Answer: ${gbp(ans)}`],
      };
    }
    // how many can be bought with a budget
    const budget = unitP * b + int(rng, 0, unitP - 1);
    return {
      prompt: `${a} ${items} cost ${gbp(unitP * a)}. ${N} has ${gbp(budget)}. What is the greatest number of ${items} ${N} can buy?`,
      answer: num(b),
      distractors: dvals(b, [b + 1, b - 1, Math.round(budget / (unitP * a)), Math.floor(budget / (unitP * a)) * a, Math.ceil(budget / unitP) + 1], (v) => num(v), { dp: 0 }),
      typed: { kind: 'number', value: b },
      calculator: d === 'hard',
      solution: [`Cost of 1 ${one}: ${gbp(unitP * a)} $\\div ${a} =$ ${gbp(unitP)}`, `${gbp(budget)} $\\div$ ${gbp(unitP)} $= ${tnum(roundTo(budget / unitP, 2))}${hasDp(budget / unitP, 2) ? '' : '\\ldots'}$`, `You can only buy whole ${items}, so round <b>down</b>: ${b}.`, `Answer: ${num(b)}`],
    };
  }
  throw new Error('cost');
}, { title: 'Unitary method with costs', word: true });

const MAX_RECIPES = [
  { name: 'pancakes', s: 4, ing: [['flour', 'g', 100], ['milk', 'ml', 300], ['eggs', '', 2]] },
  { name: 'flapjacks', s: 12, ing: [['oats', 'g', 250], ['butter', 'g', 125], ['golden syrup', 'g', 100]] },
  { name: 'scones', s: 8, ing: [['flour', 'g', 225], ['butter', 'g', 50], ['milk', 'ml', 150]] },
  { name: 'shortbread biscuits', s: 10, ing: [['flour', 'g', 150], ['butter', 'g', 100], ['sugar', 'g', 50]] },
  { name: 'fruit smoothies', s: 2, ing: [['banana', '', 1], ['yoghurt', 'ml', 150], ['strawberries', 'g', 120]] },
  { name: 'cupcakes', s: 12, ing: [['flour', 'g', 120], ['sugar', 'g', 140], ['eggs', '', 2]] },
];

export const directMax = gen('rat-direct-max', 'rat-direct-proportion', (rng, d) => {
  for (let i = 0; i < 300; i += 1) {
    const rec = pick(rng, MAX_RECIPES);
    const mult = pick(rng, size(d, [1, 2], [1, 2], [1, 3, 2]));
    const ing = rec.ing.map(([n, u, q]) => [n, u, q * mult]);
    const s = rec.s * mult === rec.s ? rec.s : rec.s; // recipe always for rec.s items
    // the limiting number of batches (can be fractional: people scale continuously)
    const unitsPerItem = ing.map(([, , q]) => q / s);
    const target = int(rng, s + 1, s * size(d, 3, 5, 6));
    const li = int(rng, 0, ing.length - 1);
    const have = ing.map(([, u, q], j) => {
      const need = (q / s) * target;
      if (j === li) return u === '' ? Math.floor(need + 0.999) : Math.ceil((need + int(rng, 0, Math.floor(q / s) || 1)) / 10) * 10;
      return u === '' ? Math.ceil(need * 1.5) + 1 : Math.ceil((need * (1.3 + rng() * 0.6)) / 50) * 50;
    });
    const maxItems = Math.min(...have.map((h, j) => Math.floor(h / unitsPerItem[j] + 1e-9)));
    if (maxItems < s || maxItems > 150) continue;
    const limiting = have.findIndex((h, j) => Math.floor(h / unitsPerItem[j] + 1e-9) === maxItems);
    if (have.filter((h, j) => Math.floor(h / unitsPerItem[j] + 1e-9) === maxItems).length > 1) continue;
    const fmtQ = (q, u) => (u ? `${num(q)} ${u}` : num(q));
    const tbl = `<table class="qtable"><tr><th>Ingredient</th><th>For ${s} ${rec.name}</th><th>Available</th></tr>${ing.map(([n, u, q], j) => `<tr><td>${cap(n)}</td><td>${fmtQ(q, u)}</td><td>${fmtQ(have[j], u)}</td></tr>`).join('')}</table>`;
    const others = have.map((h, j) => Math.floor(h / unitsPerItem[j] + 1e-9)).filter((_, j) => j !== limiting);
    return {
      prompt: `The table shows the ingredients needed to make ${s} ${rec.name}, and how much of each ingredient ${names(rng, 1)[0]} has. What is the greatest number of ${rec.name} that can be made?`,
      visual: tbl,
      answer: num(maxItems),
      distractors: dvals(maxItems, [...others, maxItems + 1, Math.floor(maxItems / s) * s, Math.ceil(maxItems / s) * s, maxItems - 1], (v) => num(v), { dp: 0 }),
      typed: { kind: 'number', value: maxItems },
      calculator: d === 'hard',
      solution: [
        `For each ingredient work out how many ${rec.name} it is enough for.`,
        ing.map(([n, u, q], j) => `${cap(n)}: $${tnum(have[j])} \\div ${tnum(q)} \\times ${s} = ${tnum(roundTo((have[j] / q) * s, 2))}${hasDp((have[j] / q) * s, 2) ? '' : '\\ldots'}$`).join('<br>'),
        `The smallest is for ${ing[limiting][0]} – it runs out first. Round <b>down</b> to a whole number.`,
        `Answer: ${num(maxItems)}`,
      ],
    };
  }
  throw new Error('max');
}, { title: 'Greatest number that can be made from a recipe' });

export const directTable = gen('rat-direct-table', 'rat-direct-proportion', (rng, d) => {
  for (let i = 0; i < 200; i += 1) {
    const k = size(d, int(rng, 2, 9), pick(rng, [1.5, 2.5, 4, 6, 12, 0.5, 3.5]), pick(rng, [0.4, 1.25, 2.4, 0.75, 3.2, 1.6]));
    const xs = sample(rng, size(d, [2, 3, 4, 5, 6, 10], [2, 4, 5, 6, 8, 10, 12], [3, 5, 8, 10, 12, 15, 20]), 3).sort((a, b) => a - b);
    const ys = xs.map((x) => tidy(k * x));
    if (!ys.every((y) => hasDp(y, 2))) continue;
    const hide = int(rng, 1, 2);
    const vars = pick(rng, [['x', 'y'], ['a', 'b'], ['p', 'q']]);
    const askY = chance(rng, d === 'easy' ? 1 : 0.6);
    const cells = xs.map((x, j) => [j === hide && !askY ? '?' : `$${tnum(x)}$`, j === hide && askY ? '?' : `$${tnum(ys[j])}$`]);
    const tbl = `<table class="qtable"><tr><th>$${vars[0]}$</th>${cells.map((c) => `<td>${c[0]}</td>`).join('')}</tr><tr><th>$${vars[1]}$</th>${cells.map((c) => `<td>${c[1]}</td>`).join('')}</tr></table>`;
    const ans = askY ? ys[hide] : xs[hide];
    const known = [xs[0], ys[0]];
    const other = askY ? xs[hide] : ys[hide];
    return {
      prompt: `$${vars[1]}$ is directly proportional to $${vars[0]}$. Find the missing value in the table.`,
      visual: tbl,
      answer: `$${tnum(ans)}$`,
      distractors: dvals(ans, askY ? [ys[0] + (xs[hide] - xs[0]), (xs[0] * ys[0]) / xs[hide], ys[0] * xs[hide], ans + k, ans - k] : [xs[0] + (ys[hide] - ys[0]), (xs[0] * ys[0]) / ys[hide], ans + 1, ans * 2, ans - 1], (v) => `$${tnum(v)}$`, { dp: 2, round: true }),
      typed: { kind: 'number', value: ans },
      solution: [
        `Direct proportion means $${vars[1]} = k${vars[0]}$ – the ratio $${vars[1]} \\div ${vars[0]}$ is always the same.`,
        `From the first column: $k = ${tnum(known[1])} \\div ${tnum(known[0])} = ${tnum(k)}$`,
        askY ? `$${vars[1]} = ${tnum(k)} \\times ${tnum(other)} = ${tnum(ans)}$` : `$${vars[0]} = ${tnum(other)} \\div ${tnum(k)} = ${tnum(ans)}$`,
        `Answer: $${tnum(ans)}$`,
      ],
    };
  }
  throw new Error('table');
}, { title: 'Missing value in a direct proportion table' });

// Rates: amounts per unit of time (or per mile, per hour of work…). mk returns
// { prompt, ans, unit, money?, steps, wrong } — wrong holds misconception values.
const RATE_CTX = [
  (rng) => {
    const s = pick(rng, [2, 3, 4, 5, 6]); const n = int(rng, 2, 40); const h = int(rng, 2, 10);
    const ans = (n * h * 3600) / s;
    return { prompt: `A machine takes ${s} seconds to fill one packet of crisps. In total, how many packets can ${n} of these machines fill in ${h} hours?`, ans, unit: 'packets',
      steps: [`One machine fills $3600 \\div ${s} = ${tnum(3600 / s)}$ packets an hour.`, `${n} machines for ${h} hours: $${tnum(3600 / s)} \\times ${n} \\times ${h} = ${tnum(ans)}$`], wrong: [(n * h * 60) / s, n * h * 3600 * s, (h * 3600) / s, (n * h * 3600) / s / 60] };
  },
  (rng) => {
    const r = pick(rng, [0.4, 0.5, 0.8, 1.2, 1.5, 2.5]); const t = int(rng, 4, 30); const V = Math.ceil((r * t + int(rng, 5, 60)) / 5) * 5;
    const ans = tidy(V - r * t);
    return { prompt: `A tank contains ${V} litres of water. Water leaks out at a rate of ${num(r)} litres per minute. How much water is left after ${t} minutes?`, ans, unit: 'litres',
      steps: [`Water lost: $${tnum(r)} \\times ${t} = ${tnum(tidy(r * t))}$ litres.`, `Left: $${V} - ${tnum(tidy(r * t))} = ${tnum(ans)}$ litres`], wrong: [tidy(r * t), tidy(V + r * t), tidy(V - r * t * 60), tidy(V - t / r)] };
  },
  (rng) => {
    const p = pick(rng, [12, 15, 20, 24, 25, 30, 40]); const N = p * int(rng, 3, 40);
    const ans = N / p;
    return { prompt: `A printer prints ${p} pages per minute. How many minutes does it take to print ${num(N)} pages?`, ans, unit: 'minutes',
      steps: [`Time $= \\text{pages} \\div \\text{rate} = ${tnum(N)} \\div ${p} = ${tnum(ans)}$ minutes`], wrong: [N * p, ans * 60, ans / 60, ans + 1] };
  },
  (rng) => {
    const rate = int(rng, 260, 400) * 4; // pence, a multiple of 4 so 25% more is whole pence
    const [N] = names(rng, 1);
    const extra = int(rng, 2, 10); const hrs = 38 + extra;
    const ot = rate * 1.25;
    const ans = rate * 38 + ot * extra;
    return { prompt: `${N} is paid ${gbp(rate)} per hour for the first 38 hours each week, and 25% more per hour for every extra hour. One week ${N} works ${hrs} hours. How much is ${N} paid that week?`, ans, unit: '', money: true,
      steps: [`Basic pay: $38 \\times ${tnum(rate / 100, 2)} = ${tnum((rate * 38) / 100, 2)}$`, `Overtime rate: $${tnum(rate / 100, 2)} \\times 1.25 = ${tnum(ot / 100, 2)}$ per hour, for ${extra} hours: $${tnum((ot * extra) / 100, 2)}$`, `Total: $${tnum((rate * 38) / 100, 2)} + ${tnum((ot * extra) / 100, 2)} = ${tnum(ans / 100, 2)}$`], wrong: [rate * hrs, rate * hrs * 1.25, rate * 38 + rate * 0.25 * extra, rate * 38 + ot * hrs] };
  },
  (rng) => {
    const m = pick(rng, [12, 14, 15, 16, 18, 20]); const D = m * int(rng, 5, 40);
    const ans = D / m;
    return { prompt: `A motorbike travels ${m} miles on one litre of petrol. How many litres of petrol does it use to travel ${num(D)} miles?`, ans, unit: 'litres',
      steps: [`Each litre covers ${m} miles, so divide: $${tnum(D)} \\div ${m} = ${tnum(ans)}$ litres`], wrong: [D * m, ans * 2, ans + 1, D - m] };
  },
  (rng) => {
    const r = pick(rng, [6, 8, 10, 12, 15]); const V = r * int(rng, 8, 20);
    const ans = V / r;
    return { prompt: `A bath holds ${V} litres of water when full. The tap fills it at ${r} litres per minute. How long does it take to fill the empty bath?`, ans, unit: 'minutes',
      steps: [`Time $= ${V} \\div ${r} = ${tnum(ans)}$ minutes`], wrong: [V * r, ans * 60, V - r, ans / 2] };
  },
  (rng) => {
    const s = pick(rng, [20, 25, 40, 50, 80]); const F = pick(rng, [1.2, 1.5, 2, 2.4, 3, 4.8, 6]);
    const ans = (F * 1000) / s;
    if (!Number.isInteger(ans)) return null;
    return { prompt: `A file of size ${num(F)} GB is downloaded at ${s} MB per second. How many seconds does the download take? (1 GB $= 1000$ MB)`, ans, unit: 'seconds',
      steps: [`${num(F)} GB $= ${tnum(F * 1000)}$ MB.`, `Time $= ${tnum(F * 1000)} \\div ${s} = ${tnum(ans)}$ seconds`], wrong: [F / s, F * s, (F * 1000) / s / 60, (F * 1024) / s] };
  },
  (rng) => {
    const b = int(rng, 60, 90); const h = pick(rng, [2, 3, 5, 8, 24]);
    const ans = b * 60 * h;
    return { prompt: `A resting heart beats ${b} times per minute. How many times does it beat in ${h} hours?`, ans, unit: 'beats',
      steps: [`${h} hours $= ${h * 60}$ minutes.`, `$${b} \\times ${h * 60} = ${tnum(ans)}$ beats`], wrong: [b * h, b * 100 * h, b * 3600 * h, b * 60] };
  },
  (rng) => {
    const w = pick(rng, [30, 40, 45, 50, 60, 75]); const N = w * int(rng, 6, 40);
    const ans = N / w;
    return { prompt: `${names(rng, 1)[0]} types at ${w} words per minute. How long does it take to type an essay of ${num(N)} words?`, ans, unit: 'minutes',
      steps: [`Time $= ${tnum(N)} \\div ${w} = ${tnum(ans)}$ minutes`], wrong: [N * w, ans * 60, N - w, ans + 10] };
  },
  (rng) => {
    const pkwh = pick(rng, [24, 25, 28, 30, 32]); const k = pick(rng, [1.5, 2, 2.5, 3]); const h = int(rng, 2, 8);
    const ans = pkwh * k * h;
    if (!Number.isInteger(ans)) return null;
    return { prompt: `Electricity costs ${pkwh}p per kWh. A heater uses ${num(k)} kW, so it uses ${num(k)} kWh every hour. How much does it cost to run the heater for ${h} hours?`, ans, unit: '', money: true,
      steps: [`Energy used: $${tnum(k)} \\times ${h} = ${tnum(k * h)}$ kWh.`, `Cost: $${tnum(k * h)} \\times ${pkwh} = ${tnum(ans)}$p $=$ ${gbp(ans)}`], wrong: [pkwh * h, pkwh * k, ans * 10, ans / 10] };
  },
  (rng) => {
    const g = pick(rng, [2, 3, 4, 5, 6, 8]); const L = g * int(rng, 5, 40);
    if (L % 10 !== 0) return null;
    const ans = L / g;
    return { prompt: `A bamboo shoot grows ${g} mm per day. How many days does it take to grow ${num(L / 10)} cm?`, ans, unit: 'days',
      steps: [`${num(L / 10)} cm $= ${L}$ mm.`, `$${L} \\div ${g} = ${ans}$ days`], wrong: [L / 10 / g, (L / 10) * g, L * g, ans * 10] };
  },
  (rng) => {
    const n = pick(rng, [45, 60, 75, 80, 120, 150]); const h = pick(rng, [6, 7.5, 8]); const days = pick(rng, [5, 6]);
    const ans = n * h * days;
    return { prompt: `A factory makes ${n} chairs an hour. It runs for ${num(h)} hours a day, ${days} days a week. How many chairs does it make in a week?`, ans, unit: 'chairs',
      steps: [`Chairs per day: $${n} \\times ${tnum(h)} = ${tnum(n * h)}$.`, `Per week: $${tnum(n * h)} \\times ${days} = ${tnum(ans)}$`], wrong: [n * h, n * days, n * h * 7, n * 24 * days] };
  },
  (rng) => {
    const rpm = pick(rng, [6, 8, 9, 10, 12]); const mins = pick(rng, [5, 6, 8, 10, 12, 15]);
    const ans = rpm * mins;
    return { prompt: `A shower uses ${rpm} litres of water per minute. How many litres does a ${mins}-minute shower use?`, ans, unit: 'litres',
      steps: [`Litres used $=$ rate $\\times$ time: $${rpm} \\times ${mins} = ${ans}$ litres`], wrong: [rpm * mins * 60, rpm + mins, (rpm * mins) / 60, rpm * (mins + 1)] };
  },
];

export const directRates = gen('rat-direct-rates', 'rat-direct-proportion', (rng, d) => {
  for (let i = 0; i < 100; i += 1) {
    // easy: one-step rates; medium: a unit change or two steps; hard: several steps
    const pool = size(d, [2, 4, 5, 8, 12, 7], [1, 6, 10, 11, 7, 9], [0, 3, 9, 6, 1, 11]);
    const c = RATE_CTX[pick(rng, pool)](rng);
    if (!c || !hasDp(c.ans, 2) || c.ans <= 0) continue;
    const fmt = c.money ? gbp : withUnit(c.unit);
    return {
      prompt: c.prompt,
      answer: fmt(c.ans),
      distractors: c.money ? pvals(c.ans, c.wrong) : dvals(c.ans, c.wrong, fmt, { dp: 2, round: true }),
      typed: { kind: 'number', value: c.money ? c.ans / 100 : c.ans },
      calculator: d !== 'easy',
      solution: [...c.steps, `Answer: ${fmt(c.ans)}`],
    };
  }
  throw new Error('rates');
}, { title: 'Rates: work, flow, pay and fuel', word: true, learn: ['rat-direct-proportion', 'rat-unit-conversion'] });

/* ================================================================== */
/* rat-exchange-rates                                                  */
/* ================================================================== */

// country, currency name (plural), symbol formatter, rates (foreign per £1), typical £ amounts
const CURR = [
  { place: 'France', cur: 'euros', f: (v) => `€${num(v, hasDp(v, 0) ? null : 2)}`, rates: [1.15, 1.16, 1.17, 1.18, 1.2, 1.12, 1.14, 1.25] },
  { place: 'Spain', cur: 'euros', f: (v) => `€${num(v, hasDp(v, 0) ? null : 2)}`, rates: [1.15, 1.16, 1.18, 1.2, 1.12, 1.25] },
  { place: 'the USA', cur: 'US dollars', f: (v) => `${num(v, hasDp(v, 0) ? null : 2)} US dollars`, rates: [1.25, 1.27, 1.3, 1.24, 1.32, 1.28] },
  { place: 'Japan', cur: 'yen', f: (v) => `${num(v)} yen`, rates: [180, 185, 190, 175, 192, 188], whole: true },
  { place: 'Switzerland', cur: 'Swiss francs', f: (v) => `${num(v, hasDp(v, 0) ? null : 2)} Swiss francs`, rates: [1.1, 1.12, 1.08, 1.15, 1.14] },
  { place: 'India', cur: 'rupees', f: (v) => `${num(v)} rupees`, rates: [100, 102, 105, 98, 104], whole: true },
  { place: 'Poland', cur: 'zloty', f: (v) => `${num(v, hasDp(v, 0) ? null : 2)} zloty`, rates: [5, 4.9, 5.1, 5.2, 4.8] },
  { place: 'Canada', cur: 'Canadian dollars', f: (v) => `${num(v, hasDp(v, 0) ? null : 2)} Canadian dollars`, rates: [1.7, 1.72, 1.75, 1.68, 1.8] },
  { place: 'Australia', cur: 'Australian dollars', f: (v) => `${num(v, hasDp(v, 0) ? null : 2)} Australian dollars`, rates: [1.9, 1.92, 1.95, 1.88, 2] },
  { place: 'Norway', cur: 'kroner', f: (v) => `${num(v, hasDp(v, 0) ? null : 2)} kroner`, rates: [13.5, 13.2, 13.8, 14, 12.8] },
  { place: 'Mexico', cur: 'pesos', f: (v) => `${num(v, hasDp(v, 0) ? null : 2)} pesos`, rates: [22, 23, 21.5, 24, 22.5] },
  { place: 'Thailand', cur: 'baht', f: (v) => `${num(v, hasDp(v, 0) ? null : 2)} baht`, rates: [44, 45, 43, 46, 42] },
  { place: 'Turkey', cur: 'lira', f: (v) => `${num(v, hasDp(v, 0) ? null : 2)} lira`, rates: [40, 38, 42, 41, 39] },
];
const BUYS = ['a hotel room for one night', 'a pair of sunglasses', 'a train ticket', 'a meal for the family', 'a football shirt', 'a day pass for a theme park', 'a souvenir', 'a hire car for a day', 'a museum ticket', 'a pair of trainers', 'a boat trip', 'a bike hire for a week'];

export const exchangeConvert = gen('rat-exchange-convert', 'rat-exchange-rates', (rng, d) => {
  for (let i = 0; i < 300; i += 1) {
    const C = pick(rng, CURR);
    const rate = pick(rng, C.rates);
    const toForeign = chance(rng, 0.5);
    const [N] = names(rng, 1);
    const item = pick(rng, BUYS);
    if (toForeign) {
      const pounds = size(d, int(rng, 2, 30) * 10, int(rng, 4, 60) * 5, int(rng, 53, 987));
      const ans = tidy(pounds * rate);
      if (!hasDp(ans, C.whole ? 0 : 2)) continue;
      const wrongDiv = roundTo(pounds / rate, C.whole ? 0 : 2);
      const prompt = pick(rng, [
        `${N} changes ${gbp(pounds * 100)} into ${C.cur} before a holiday in ${C.place}. The exchange rate is £1 = ${C.f(rate)}. How many ${C.cur} does ${N} get?`,
        `${N} is going to ${C.place} and wants to change ${gbp(pounds * 100)} into ${C.cur}. Use £1 = ${C.f(rate)}. How many ${C.cur} will ${N} receive?`,
        `A school trip to ${C.place} has ${gbp(pounds * 100)} of spending money to change into ${C.cur}. The rate is £1 = ${C.f(rate)}. How many ${C.cur} is this?`,
      ]);
      return {
        prompt,
        answer: C.f(ans),
        distractors: dvals(ans, [wrongDiv >= 10 ? wrongDiv : null, pounds + rate, ans * 10, ans / 10, tidy(pounds * (rate + 0.1)), tidy(ans + rate)], C.f, { dp: C.whole ? 0 : 2, round: true }),
        typed: { kind: 'number', value: ans },
        calculator: d !== 'easy',
        solution: [`Each £1 is worth ${C.f(rate)}, so <b>multiply</b> the number of pounds by ${num(rate)}.`, `$${tnum(pounds)} \\times ${tnum(rate)} = ${tnum(ans)}$`, `Answer: ${C.f(ans)}`],
      };
    }
    // foreign -> pounds: design back from the pounds answer
    const pence = size(d, int(rng, 2, 30) * 500, int(rng, 10, 400) * 10, int(rng, 300, 30000));
    const foreign = tidy((pence / 100) * rate);
    if (!hasDp(foreign, C.whole ? 0 : 2)) continue;
    const prompt = pick(rng, [
      `In ${C.place}, ${item} costs ${C.f(foreign)}. The exchange rate is £1 = ${C.f(rate)}. How much is this in pounds?`,
      `${N} sees ${item} in ${C.place} priced at ${C.f(foreign)}. Use £1 = ${C.f(rate)} to work out the cost in pounds.`,
      `${N} paid ${C.f(foreign)} for ${item} in ${C.place}. The exchange rate was £1 = ${C.f(rate)}. How much did it cost in pounds?`,
    ]);
    return {
      prompt,
      answer: gbp(pence),
      distractors: pvals(pence, [foreign * rate * 100, (foreign - rate) * 100, pence * 10, pence + 100, foreign * 100]),
      typed: { kind: 'number', value: pence / 100 },
      calculator: d !== 'easy',
      solution: [`${C.f(rate)} is worth £1, so <b>divide</b> by ${num(rate)} to change ${C.cur} into pounds.`, `$${tnum(foreign)} \\div ${tnum(rate)} = ${tnum(pence / 100, pence % 100 ? 2 : null)}$`, `Check: the number of pounds should be smaller than the number of ${C.cur}${rate < 1 ? ' – here the pound is worth less, so it is bigger' : ''}.`, `Answer: ${gbp(pence)}`],
    };
  }
  throw new Error('exchange');
}, { title: 'Convert between pounds and another currency', word: true });

export const exchangeCompare = gen('rat-exchange-compare', 'rat-exchange-rates', (rng, d) => {
  for (let i = 0; i < 300; i += 1) {
    const C = pick(rng, CURR.filter((c) => !c.whole));
    const rate = pick(rng, C.rates);
    const item = pick(rng, ['A pair of headphones', 'A watch', 'A games console', 'A tennis racket', 'A camera', 'A guitar', 'A handbag', 'A pair of boots', 'A bike helmet', 'A perfume gift set', 'A smartwatch', 'A rucksack']);
    const ukP = int(rng, size(d, 20, 30, 40), size(d, 120, 300, 600)) * 100 + size(d, 0, pick(rng, [0, 50, 99]), int(rng, 0, 99));
    const diffP = int(rng, 1, size(d, 20, 30, 40)) * size(d, 100, 50, 7) ;
    const abroadCheaper = chance(rng, 0.5);
    const abroadP = ukP + (abroadCheaper ? -diffP : diffP);
    if (abroadP <= 0) continue;
    const foreign = tidy((abroadP / 100) * rate);
    if (!hasDp(foreign, 2)) continue;
    const place = C.place;
    const cheapWhere = abroadCheaper ? place : 'the UK';
    const ans = `Cheaper in ${cheapWhere} by ${gbp(diffP)}`;
    const wrongConv = Math.round(foreign * rate * 100);
    const otherWhere = abroadCheaper ? 'the UK' : place;
    return {
      prompt: `${item} costs ${gbp(ukP)} in the UK and ${C.f(foreign)} in ${place}. The exchange rate is £1 = ${C.f(rate)}. Where is it cheaper, and by how much?`,
      answer: ans,
      distractors: [
        `Cheaper in ${otherWhere} by ${gbp(diffP)}`,
        ...(Math.abs(Math.round(foreign * 100) - ukP) < ukP ? [`Cheaper in ${Math.round(foreign * 100) < ukP ? place : 'the UK'} by ${gbp(Math.abs(Math.round(foreign * 100) - ukP))}`] : []),
        ...(Math.abs(wrongConv - ukP) < ukP ? [wrongConv > ukP ? `Cheaper in the UK by ${gbp(wrongConv - ukP)}` : `Cheaper in ${place} by ${gbp(ukP - wrongConv)}`] : []),
        `Cheaper in ${cheapWhere} by ${gbp(diffP * 2)}`, `Cheaper in ${otherWhere} by ${gbp(diffP * 2)}`, `Cheaper in ${cheapWhere} by ${gbp(diffP + 100)}`, `Cheaper in ${otherWhere} by ${gbp(diffP + 100)}`,
        `Cheaper in ${cheapWhere} by ${gbp(diffP + 50)}`, ...(diffP > 100 ? [`Cheaper in ${cheapWhere} by ${gbp(diffP - 100)}`] : []),
      ].filter((t) => t !== ans),
      calculator: true,
      solution: [
        `Change the ${C.cur} price into pounds by dividing by the rate: $${tnum(foreign, hasDp(foreign, 0) ? null : 2)} \\div ${tnum(rate)} = ${tnum(abroadP / 100, 2)}$, so ${gbpF(abroadP)}.`,
        `Compare: ${gbpF(ukP)} in the UK and ${gbpF(abroadP)} in ${place}.`,
        `Difference: ${gbp(Math.max(ukP, abroadP))} $-$ ${gbp(Math.min(ukP, abroadP))} $=$ ${gbp(diffP)}, cheaper in ${cheapWhere}.`,
        `Answer: ${ans}`,
      ],
    };
  }
  throw new Error('exch compare');
}, { title: 'Compare prices in two currencies' });

export const exchangeRateFind = gen('rat-exchange-rate-find', 'rat-exchange-rates', (rng, d) => {
  for (let i = 0; i < 300; i += 1) {
    const C = pick(rng, CURR.filter((c) => !c.whole));
    const rate = pick(rng, C.rates);
    const pounds = int(rng, 5, size(d, 30, 60, 90)) * size(d, 50, 10, 5);
    const foreign = tidy(pounds * rate);
    if (!hasDp(foreign, 2)) continue;
    const [N] = names(rng, 1);
    const inv = roundTo(1 / rate, 2);
    return {
      prompt: `${N} changed ${gbp(pounds * 100)} into ${C.cur} and received ${C.f(foreign)}. Work out the exchange rate in the form £1 = ? ${C.cur}.`,
      answer: `£1 = ${C.f(rate)}`,
      distractors: [inv, roundTo(rate + 0.01, 2), roundTo(rate + 0.1, 2), roundTo(rate * 10, 2), roundTo(rate - 0.05, 2)].filter((v) => v > 0 && v !== rate).map((v) => `£1 = ${C.f(v)}`),
      typed: { kind: 'number', value: rate },
      calculator: d !== 'easy',
      solution: [`£${num(pounds)} buys ${C.f(foreign)}, so £1 buys ${C.f(foreign)} $\\div ${tnum(pounds)}$.`, `$${tnum(foreign)} \\div ${tnum(pounds)} = ${tnum(rate)}$`, `Answer: £1 = ${C.f(rate)}`],
    };
  }
  throw new Error('rate find');
}, { title: 'Work out an exchange rate' });

export const exchangeTwoStep = gen('rat-exchange-two-step', 'rat-exchange-rates', (rng, d) => {
  for (let i = 0; i < 300; i += 1) {
    const C = pick(rng, CURR.filter((c) => !c.whole && c.rates.length >= 4));
    const [r1, r2] = sample(rng, C.rates, 2);
    const pounds = int(rng, 10, size(d, 40, 80, 120)) * 10;
    const got = tidy(pounds * r1);
    if (!hasDp(got, 2)) continue;
    const spent = Math.round(got * (0.4 + rng() * 0.45) / 5) * 5;
    const left = tidy(got - spent);
    if (left <= 0) continue;
    const back = roundTo(left / r2, 2);
    const backP = Math.round(back * 100);
    const [N] = names(rng, 1);
    return {
      prompt: `${N} changes ${gbp(pounds * 100)} into ${C.cur} at £1 = ${C.f(r1)}. On holiday ${N} spends ${C.f(spent)}. When ${N} gets home, the rest is changed back into pounds at £1 = ${C.f(r2)}. How much does ${N} get back, to the nearest penny?`,
      answer: gbpF(backP),
      distractors: pvals(backP, [left * r2 * 100, (left / r1) * 100, (pounds - spent / r2) * 100, (pounds - spent) * 100, (got / r2) * 100]).map((t) => (/\.\d\d$/.test(t) ? t : `${t}.00`)),
      typed: { kind: 'number', value: backP / 100, tolerance: 0.005 },
      calculator: true,
      solution: [
        `Pounds to ${C.cur}: $${tnum(pounds)} \\times ${tnum(r1)} = ${tnum(got)}$`,
        `${cap(C.cur)} left: $${tnum(got)} - ${tnum(spent)} = ${tnum(left)}$`,
        `Back to pounds (divide by the new rate): $${tnum(left)} \\div ${tnum(r2)} = ${tnum(roundTo(left / r2, 4))}${hasDp(left / r2, 4) ? '' : '\\ldots'}$`,
        `Answer: ${gbpF(backP)}`,
      ],
      longDecimalsOk: true,
    };
  }
  throw new Error('two-step');
}, { title: 'Change money, spend some, change the rest back' });

/* ================================================================== */
/* rat-best-buy                                                        */
/* ================================================================== */

// product, unit, sizes to choose from, a sensible price per unit range (pence per unit),
// noun(s): the pack on its own; full(s): the pack with the product named; pl: plural product name.
const PRODUCTS = [
  { p: 'cereal', u: 'g', sizes: [375, 500, 750, 1000], ppu: [0.3, 0.6], noun: (s) => `${num(s)} g box`, full: (s) => `${num(s)} g box of cereal` },
  { p: 'washing powder', u: 'kg', sizes: [1.5, 2, 3, 4.5, 6], ppu: [150, 300], noun: (s) => `${num(s)} kg box`, full: (s) => `${num(s)} kg box of washing powder` },
  { p: 'orange juice', u: 'litres', sizes: [1, 1.5, 2, 3], ppu: [80, 160], noun: (s) => `${num(s)} litre carton`, full: (s) => `${num(s)} litre carton of orange juice` },
  { p: 'rice', u: 'kg', sizes: [0.5, 1, 2, 5], ppu: [120, 260], noun: (s) => `${num(s)} kg bag`, full: (s) => `${num(s)} kg bag of rice` },
  { p: 'crisps', pl: true, u: 'packets', sizes: [6, 12, 18, 24], ppu: [20, 45], noun: (s) => `multipack of ${s}`, full: (s) => `multipack of ${s} packets of crisps` },
  { p: 'toilet rolls', pl: true, u: 'rolls', sizes: [4, 9, 12, 16, 24], ppu: [25, 55], noun: (s) => `pack of ${s}`, full: (s) => `pack of ${s} toilet rolls` },
  { p: 'dog food', u: 'kg', sizes: [2, 4, 7.5, 12], ppu: [180, 380], noun: (s) => `${num(s)} kg bag`, full: (s) => `${num(s)} kg bag of dog food` },
  { p: 'paint', u: 'litres', sizes: [1, 2.5, 5, 10], ppu: [400, 900], noun: (s) => `${num(s)} litre tin`, full: (s) => `${num(s)} litre tin of paint` },
  { p: 'shampoo', u: 'ml', sizes: [250, 400, 500, 750], ppu: [0.5, 1.2], noun: (s) => `${num(s)} ml bottle`, full: (s) => `${num(s)} ml bottle of shampoo` },
  { p: 'eggs', pl: true, u: 'eggs', sizes: [6, 10, 12, 15, 30], ppu: [20, 40], noun: (s) => `box of ${s}`, full: (s) => `box of ${s} eggs` },
  { p: 'teabags', pl: true, u: 'teabags', sizes: [40, 80, 160, 240], ppu: [2, 5], noun: (s) => `box of ${s}`, full: (s) => `box of ${s} teabags` },
  { p: 'cola', u: 'cans', sizes: [4, 6, 8, 12, 24], ppu: [40, 80], noun: (s) => `pack of ${s} cans`, full: (s) => `pack of ${s} cans of cola` },
  { p: 'coffee', u: 'g', sizes: [100, 200, 300, 500], ppu: [2, 4], noun: (s) => `${num(s)} g jar`, full: (s) => `${num(s)} g jar of coffee` },
  { p: 'pasta', u: 'g', sizes: [500, 750, 1000, 3000], ppu: [0.1, 0.25], noun: (s) => `${num(s)} g bag`, full: (s) => `${num(s)} g bag of pasta` },
  { p: 'batteries', pl: true, u: 'batteries', sizes: [4, 8, 12, 20], ppu: [40, 90], noun: (s) => `pack of ${s}`, full: (s) => `pack of ${s} batteries` },
];
const perUnitOf = (P) => (P.u === 'g' ? [100, '100 g'] : P.u === 'ml' ? [100, '100 ml'] : P.u === 'kg' ? [1, 'kg'] : P.u === 'litres' ? [1, 'litre'] : [1, P.u.replace(/ies$/, 'y').replace(/s$/, '')]);

function bestBuyPacks(rng, d, k) {
  for (let i = 0; i < 300; i += 1) {
    const P = pick(rng, PRODUCTS);
    const sizes = sample(rng, P.sizes, k).sort((a, b) => a - b);
    const [lo, hi] = P.ppu;
    // per-unit prices: one best, others at least 3% worse (rounded prices must keep the order)
    const best = int(rng, 0, k - 1);
    const base = lo + rng() * (hi - lo);
    const ppus = sizes.map((_, j) => (j === best ? base : base * (1 + (0.04 + rng() * size(d, 0.4, 0.2, 0.1)))));
    const prices = sizes.map((s, j) => Math.round((s * ppus[j]) / 5) * 5 - (chance(rng, 0.5) ? 1 : 0));
    const real = prices.map((p, j) => p / sizes[j]);
    const minR = Math.min(...real);
    if (real.indexOf(minR) !== best) continue;
    if (real.filter((r) => r / minR < 1.02).length > 1) continue;
    if (prices.some((p) => p < 30)) continue;
    return { P, sizes, prices, best, real };
  }
  throw new Error('packs');
}

export const bestBuyPacks3 = gen('rat-best-buy-packs', 'rat-best-buy', (rng, d) => {
  const k = size(d, 2, 3, 3);
  const { P, sizes, prices, best, real } = bestBuyPacks(rng, d, k);
  const labels = sizes.map((s, j) => `${P.noun(s)} for ${gbp(prices[j])}`);
  // unit to compare: per 100 g / per kg / per item
  const [perQ, perUnit] = perUnitOf(P);
  const perLabel = perUnit;
  // big unit costs read better in pounds
  const pounds = Math.max(...real.map((r) => r * perQ)) >= 100;
  return {
    prompt: `${cap(P.p)} ${P.pl ? 'are' : 'is'} sold in ${k === 2 ? 'two' : 'three'} sizes:<br>${labels.map((l) => `• ${l}`).join('<br>')}<br>Which size is the best value for money?`,
    answer: labels[best],
    distractors: [...labels.filter((_, j) => j !== best), k === 2 ? 'Both are the same value' : 'They are all the same value'],
    count: k === 2 ? 3 : 4,
    calculator: d !== 'easy',
    solution: [
      `Work out the cost of the same amount for each size – here the cost of ${perQ === 100 ? perLabel : `one ${perLabel}`}.`,
      sizes.map((s, j) => (pounds
        ? `${cap(P.noun(s))}: £$${tnum(prices[j] / 100, 2)} \\div ${tnum(s / perQ)} = ${tnum(roundTo((real[j] * perQ) / 100, 3))}${hasDp((real[j] * perQ) / 100, 3) ? '' : '\\ldots'}$ per ${perLabel}`
        : `${cap(P.noun(s))}: $${tnum(prices[j])} \\div ${tnum(s / perQ)} = ${tnum(roundTo(real[j] * perQ, 2))}${hasDp(real[j] * perQ, 2) ? '' : '\\ldots'}$p per ${perLabel}`)).join('<br>'),
      `The lowest cost per ${perLabel} is the best value.${prices.indexOf(Math.min(...prices)) !== best ? ' (The cheapest pack is not always the best buy!)' : ''}`,
      `Answer: the ${labels[best]}`,
    ],
  };
}, { title: 'Which pack size is the best value?', word: true });

const SHOPS = ['Bargain Barn', 'PricePlus', 'ValueMart', 'Corner Stores', 'ShopSmart', 'MegaSave', 'FreshFare', 'BuyRite', 'QuickShop', 'HomeBasics'];
// [item, typical price range in units of 5p]
const OFFER_ITEMS = [['bottles of shampoo', 30, 90], ['tins of paint', 160, 500], ['bottles of juice', 20, 60], ['boxes of cereal', 40, 80], ['packs of batteries', 60, 160], ['bags of dog food', 160, 500], ['packs of pens', 30, 100], ['jars of coffee', 60, 160], ['tubes of toothpaste', 20, 60], ['bags of compost', 80, 200], ['packs of yoghurts', 20, 50], ['pots of houmous', 16, 40], ['rolls of wrapping paper', 30, 80], ['bottles of washing-up liquid', 20, 50]];

export const bestBuyOffers = gen('rat-best-buy-offers', 'rat-best-buy', (rng, d) => {
  for (let i = 0; i < 400; i += 1) {
    const [item, plo, phi] = pick(rng, OFFER_ITEMS);
    const n = pick(rng, size(d, [4, 6], [6, 8, 9, 12], [5, 7, 10, 11]));
    const offers = [
      { txt: (p) => `${gbp(p)} each, 3 for the price of 2`, cost: (p) => p * (n - Math.floor(n / 3)), how: (p) => `Pay for ${n - Math.floor(n / 3)} of the ${n}: $${n - Math.floor(n / 3)} \\times ${tnum(p / 100, 2)} = ${tnum((p * (n - Math.floor(n / 3))) / 100, 2)}$` },
      { txt: (p) => `${gbp(p)} each, ${pick(rng, [20, 25, 30])}% off`, pct: true, cost: null },
      { txt: (p) => `${gbp(p)} each, buy one get one half price`, cost: (p) => p * Math.ceil(n / 2) + Math.floor(n / 2) * p / 2, how: (p) => `${Math.floor(n / 2)} at full price and ${Math.floor(n / 2)} at half price${n % 2 ? ', plus 1 more at full price' : ''}: $${Math.ceil(n / 2)} \\times ${tnum(p / 100, 2)} + ${Math.floor(n / 2)} \\times ${tnum(p / 200, p % 2 ? 3 : 2)} = ${tnum((p * Math.ceil(n / 2) + Math.floor(n / 2) * p / 2) / 100, 2)}$` },
      { txt: (p) => `pack of ${n / 2 === Math.floor(n / 2) ? 2 : 1} for ${gbp(p * 2 * 0.9)}`, pack: true, cost: null },
      { txt: (p) => `${gbp(p)} each, buy 2 get 1 free`, cost: (p) => p * (n - Math.floor(n / 3)), how: (p) => `Every 3rd one is free, so pay for ${n - Math.floor(n / 3)}: $${tnum((p * (n - Math.floor(n / 3))) / 100, 2)}$` },
    ];
    const chosen = sample(rng, [0, 1, 2, 4], 3);
    const shops = sample(rng, SHOPS, 3);
    // the same product, so the normal prices are close to each other
    const base = int(rng, plo, phi) * 5;
    const rows = chosen.map((oi) => {
      const price = base + int(rng, -2, 2) * size(d, 10, 5, 5) + (d === 'hard' ? pick(rng, [0, -1, 4]) : 0);
      const o = offers[oi];
      if (o.pct) {
        const pc = pick(rng, [20, 25, 30, 15]);
        return { text: `${gbp(price)} each, ${pc}% off`, cost: Math.round(price * n * (1 - pc / 100)), how: `$${n} \\times ${tnum(price / 100, 2)} = ${tnum((price * n) / 100, 2)}$, then ${pc}% off: $\\times ${tnum(1 - pc / 100)} = ${tnum(Math.round(price * n * (1 - pc / 100)) / 100, 2)}$` };
      }
      return { text: o.txt(price), cost: o.cost(price), how: o.how(price) };
    });
    if (rows.some((r) => !Number.isInteger(r.cost))) continue;
    const costs = rows.map((r) => r.cost);
    const minC = Math.min(...costs);
    if (costs.filter((c) => c - minC < 10).length > 1) continue;
    const bi = costs.indexOf(minC);
    const listing = rows.map((r, j) => `<b>${shops[j]}</b>: ${r.text}`).join('<br>');
    return {
      prompt: `${names(rng, 1)[0]} wants to buy ${n} ${item}. The same product is on offer at three shops:<br>${listing}<br>At which shop will the ${n} ${item} cost the least?`,
      answer: shops[bi],
      distractors: shops.filter((_, j) => j !== bi),
      count: 3,
      calculator: d !== 'easy',
      solution: [
        `Work out the total cost of ${n} at each shop.`,
        rows.map((r, j) => `${shops[j]}: ${r.how} → ${gbpF(r.cost)}`).join('<br>'),
        `Cheapest: ${shops[bi]} at ${gbpF(minC)}.`,
        `Answer: ${shops[bi]}`,
      ],
    };
  }
  throw new Error('offers');
}, { title: 'Compare special offers at different shops', word: true });

export const bestBuyUnitDiff = gen('rat-best-buy-unit-diff', 'rat-best-buy', (rng, d) => {
  for (let i = 0; i < 300; i += 1) {
    const P = pick(rng, PRODUCTS.filter((x) => ['g', 'ml', 'kg', 'litres'].includes(x.u) || x.sizes.every(Number.isInteger)));
    const [s1, s2] = sample(rng, P.sizes, 2).sort((a, b) => a - b);
    const [perQ, per] = perUnitOf(P);
    // unit prices in pence per "per" unit, in a realistic range: whole pence (hard: 1 dp)
    const lo = Math.max(1, Math.round(P.ppu[0] * perQ)); const hi = Math.round(P.ppu[1] * perQ);
    const u2 = int(rng, lo * size(d, 1, 2, 10), hi * size(d, 1, 2, 10)) / size(d, 1, 2, 10);
    const u1 = tidy(u2 + int(rng, 1, Math.max(2, Math.round(hi / 5))) / size(d, 1, 2, 10));
    const p1 = tidy((u1 * s1) / perQ); const p2 = tidy((u2 * s2) / perQ);
    if (!Number.isInteger(p1) || !Number.isInteger(p2) || p1 < 30 || p2 <= p1) continue;
    const ans = tidy(u1 - u2);
    const fmt = (v) => `${num(v)} pence`;
    return {
      prompt: `A ${P.full(s1)} costs ${gbp(p1)}. A ${P.noun(s2)} costs ${gbp(p2)}. How much cheaper per ${per} is the ${P.noun(s2)}?`,
      answer: fmt(ans),
      distractors: dvals(ans, [p2 - p1 > 0 ? p2 - p1 : p1 - p2, u1, u2, tidy(p2 / s2 - p1 / s1) > 0 ? roundTo(p2 / s2 - p1 / s1, 1) : null, tidy(ans * 10), roundTo(ans / 10, 1)], fmt, { dp: 1, round: true }),
      typed: { kind: 'number', value: ans },
      calculator: d !== 'easy',
      solution: [
        `Work in pence. Cost per ${per} of the ${P.noun(s1)}: $${tnum(p1)} \\div ${tnum(s1 / perQ)} = ${tnum(u1)}$ pence`,
        `Cost per ${per} of the ${P.noun(s2)}: $${tnum(p2)} \\div ${tnum(s2 / perQ)} = ${tnum(u2)}$ pence`,
        `Difference: $${tnum(u1)} - ${tnum(u2)} = ${tnum(ans)}$ pence`,
        `Answer: ${fmt(ans)}`,
      ],
    };
  }
  throw new Error('unit diff');
}, { title: 'How much cheaper per unit is the bigger pack?' });

/* ================================================================== */
/* rat-inverse-proportion                                              */
/* ================================================================== */

// t: (a, x, b, ask) -> prompt. a workers take x units; with b workers, ask for time; or ask workers for time y.
const INV_CTX = [
  { w: 'workers', unit: 'days', t: (a, x, q) => `${a} workers can build a wall in ${x} days. ${q}` , q: { time: (b) => `How many days would it take ${b} workers?`, need: (y) => `How many workers are needed to build it in ${y} days?`, more: (y) => `How many <b>more</b> workers are needed to build it in ${y} days?` } },
  { w: 'painters', unit: 'hours', t: (a, x, q) => `${a} painters take ${x} hours to paint a school hall. ${q}`, q: { time: (b) => `How long would ${b} painters take?`, need: (y) => `How many painters are needed to do it in ${y} hours?`, more: (y) => `How many more painters are needed to finish in ${y} hours?` } },
  { w: 'pumps', unit: 'hours', t: (a, x, q) => `${a} identical pumps can empty a flooded basement in ${x} hours. ${q}`, q: { time: (b) => `How long would it take with ${b} pumps?`, need: (y) => `How many pumps are needed to empty it in ${y} hours?`, more: (y) => `How many extra pumps are needed to empty it in ${y} hours?` } },
  { w: 'machines', unit: 'hours', t: (a, x, q) => `${a} machines can complete an order in ${x} hours. ${q}`, q: { time: (b) => `How many hours would ${b} machines take?`, need: (y) => `How many machines are needed to complete it in ${y} hours?`, more: (y) => `How many more machines are needed to complete it in ${y} hours?` } },
  { w: 'cleaners', unit: 'hours', t: (a, x, q) => `It takes ${a} cleaners ${x} hours to clean an office block. ${q}`, q: { time: (b) => `How long would it take ${b} cleaners?`, need: (y) => `How many cleaners are needed to do it in ${y} hours?`, more: (y) => `How many more cleaners are needed to do it in ${y} hours?` } },
  { w: 'volunteers', unit: 'hours', t: (a, x, q) => `${a} volunteers can pick up the litter on a beach in ${x} hours. ${q}`, q: { time: (b) => `How long would it take ${b} volunteers?`, need: (y) => `How many volunteers are needed to finish in ${y} hours?`, more: (y) => `How many extra volunteers are needed to finish in ${y} hours?` } },
  { w: 'combine harvesters', unit: 'days', t: (a, x, q) => `${a} combine harvesters can harvest a farm's wheat in ${x} days. ${q}`, q: { time: (b) => `How long would ${b} combine harvesters take?`, need: (y) => `How many combine harvesters are needed to do it in ${y} days?`, more: (y) => `How many more combine harvesters are needed to do it in ${y} days?` } },
  { w: 'teachers', unit: 'hours', t: (a, x, q) => `${a} teachers take ${x} hours to mark a set of mock exams. ${q}`, q: { time: (b) => `How long would ${b} teachers take?`, need: (y) => `How many teachers are needed to mark them in ${y} hours?`, more: (y) => `How many more teachers are needed to mark them in ${y} hours?` } },
  { w: 'people', unit: 'days', t: (a, x, q) => `A food store has enough food to feed ${a} people for ${x} days. ${q}`, q: { time: (b) => `How many days would the food last for ${b} people?`, need: (y) => `For how many people would the food last ${y} days?`, more: null } },
  { w: 'horses', unit: 'days', t: (a, x, q) => `A stable has enough hay to feed ${a} horses for ${x} days. ${q}`, q: { time: (b) => `How many days would the hay last ${b} horses?`, need: (y) => `How many horses could the hay feed for ${y} days?`, more: null } },
  { w: 'taps', unit: 'minutes', t: (a, x, q) => `${a} identical taps fill a water tank in ${x} minutes. ${q}`, q: { time: (b) => `How long would ${b} taps take to fill it?`, need: (y) => `How many taps are needed to fill it in ${y} minutes?`, more: (y) => `How many more taps are needed to fill it in ${y} minutes?` } },
  { w: 'gardeners', unit: 'hours', t: (a, x, q) => `${a} gardeners can mow all the grass in a park in ${x} hours. ${q}`, q: { time: (b) => `How long would ${b} gardeners take?`, need: (y) => `How many gardeners are needed to do it in ${y} hours?`, more: (y) => `How many more gardeners are needed to do it in ${y} hours?` } },
  { w: 'delivery vans', unit: 'hours', t: (a, x, q) => `${a} delivery vans can deliver all the parcels at a depot in ${x} hours. ${q}`, q: { time: (b) => `How long would it take ${b} vans?`, need: (y) => `How many vans are needed to deliver them in ${y} hours?`, more: (y) => `How many more vans are needed to deliver them in ${y} hours?` } },
];

export const inverseWorkers = gen('rat-inverse-workers', 'rat-inverse-proportion', (rng, d) => {
  for (let i = 0; i < 400; i += 1) {
    const tpl = pick(rng, INV_CTX);
    const a = int(rng, 2, size(d, 8, 15, 24));
    const x = int(rng, 2, size(d, 12, 20, 30));
    const total = a * x; // worker-units
    const mode = d === 'easy' ? 'time' : pick(rng, tpl.q.more && d === 'hard' ? ['need', 'more', 'time'] : ['time', 'need']);
    const divs = []; for (let k = 2; k <= total; k += 1) if (total % k === 0 && k !== a && k !== x && k <= 60) divs.push(k);
    if (!divs.length) continue;
    let ans; let q; let b; let y;
    if (mode === 'time') { b = pick(rng, divs.filter((v) => v * 4 >= a && v <= a * 4 && (d !== 'hard' || (v % a !== 0 && a % v !== 0)))); if (!b) continue; ans = total / b; q = tpl.q.time(b); if (ans === x) continue; } else {
      y = pick(rng, divs.filter((v) => v < x * 3 && v * 3 >= x && (d !== 'hard' || (v % x !== 0 && x % v !== 0)))); if (!y) continue;
      const needed = total / y; if (needed === a) continue;
      if (mode === 'more' && needed <= a) continue;
      ans = mode === 'more' ? needed - a : needed; q = (mode === 'more' ? tpl.q.more : tpl.q.need)(y);
    }
    const u = mode === 'time' ? tpl.unit : '';
    const fmt = (v) => (u ? `${num(v)} ${v === 1 ? u.replace(/s$/, '') : u}` : num(v));
    const vals = mode === 'time'
      ? [(x * b) / a, x + (a - b), x - (b - a), total, x / 2, ans + 1, ans - 1]
      : mode === 'need' ? [(a * y) / x, a + (x - y), total, ans + 1, ans - 1, x] : [total / y, (a * y) / x - a, (x - y), ans + 1, ans - 1, a];
    return {
      prompt: tpl.t(a, x, q),
      answer: fmt(ans),
      distractors: dvals(ans, vals, fmt, { dp: 1, round: true }),
      typed: { kind: 'number', value: ans },
      calculator: d === 'hard',
      solution: [
        `More ${tpl.w} means less time: this is <b>inverse</b> proportion, so ${tpl.w} × time stays the same.`,
        `Total work: $${a} \\times ${x} = ${total}$ ${tpl.w.replace(/s$/, '')}-${tpl.unit}.`,
        mode === 'time' ? `With ${b} ${tpl.w}: $${total} \\div ${b} = ${ans}$ ${ans === 1 ? tpl.unit.replace(/s$/, '') : tpl.unit}.` : `To take ${y} ${tpl.unit}: $${total} \\div ${y} = ${total / y}$ ${tpl.w}${mode === 'more' ? `, which is $${total / y} - ${a} = ${ans}$ more` : ''}.`,
        `Answer: ${fmt(ans)}`,
      ],
    };
  }
  throw new Error('inverse');
}, { title: 'Inverse proportion: workers and time', word: true });

export const inverseTable = gen('rat-inverse-table', 'rat-inverse-proportion', (rng, d) => {
  for (let i = 0; i < 300; i += 1) {
    const k = pick(rng, size(d, [12, 24, 36, 60, 48, 30], [36, 60, 72, 90, 120, 144, 100], [18, 45, 80, 150, 200, 240, 36]));
    const xs = sample(rng, [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 0.5, 2.5], 3).sort((p, q) => p - q);
    const ys = xs.map((x) => tidy(k / x));
    if (!ys.every((y) => hasDp(y, 2))) continue;
    if (d === 'easy' && !(ys.every(Number.isInteger) && xs.every(Number.isInteger))) continue;
    const hide = int(rng, 1, 2);
    const askY = d === 'easy' ? true : chance(rng, 0.6);
    const cells = xs.map((x, j) => [j === hide && !askY ? '?' : `$${tnum(x)}$`, j === hide && askY ? '?' : `$${tnum(ys[j])}$`]);
    const tbl = `<table class="qtable"><tr><th>$x$</th>${cells.map((c) => `<td>${c[0]}</td>`).join('')}</tr><tr><th>$y$</th>${cells.map((c) => `<td>${c[1]}</td>`).join('')}</tr></table>`;
    const ans = askY ? ys[hide] : xs[hide];
    const direct = askY ? tidy((ys[0] / xs[0]) * xs[hide]) : tidy((xs[0] / ys[0]) * ys[hide]);
    return {
      prompt: `$y$ is inversely proportional to $x$. Find the missing value in the table.`,
      visual: tbl,
      answer: `$${tnum(ans)}$`,
      distractors: dvals(ans, [direct, askY ? ys[0] - (xs[hide] - xs[0]) : xs[0] - (ys[hide] - ys[0]), k, ans * 2, ans / 2, ans + 1], (v) => `$${tnum(v)}$`, { dp: 2, round: true }),
      typed: { kind: 'number', value: ans },
      solution: [
        `Inverse proportion means $xy$ is always the same: $y = \\frac{k}{x}$.`,
        `From the first column: $k = ${tnum(xs[0])} \\times ${tnum(ys[0])} = ${tnum(k)}$`,
        askY ? `$y = ${tnum(k)} \\div ${tnum(xs[hide])} = ${tnum(ans)}$` : `$x = ${tnum(k)} \\div ${tnum(ys[hide])} = ${tnum(ans)}$`,
        `Answer: $${tnum(ans)}$`,
      ],
    };
  }
  throw new Error('inv table');
}, { title: 'Missing value in an inverse proportion table' });

const PAIR_VARS = [['x', 'y'], ['a', 'b'], ['p', 'q'], ['m', 'n'], ['s', 't']];

export const inverseRecognise = gen('rat-inverse-recognise', 'rat-inverse-proportion', (rng, d) => {
  for (let i = 0; i < 300; i += 1) {
    const inverse = chance(rng, 0.65);
    const [X, Y] = pick(rng, PAIR_VARS);
    const x1 = pick(rng, [2, 3, 4, 5, 6, 8, 10, 12]);
    const y1 = pick(rng, [6, 8, 10, 12, 15, 18, 20, 24, 30, 36, 40, 45, 60]);
    const k = x1 * y1;
    // easy: x is multiplied by a whole number; medium/hard: awkward scale factors
    const x2 = pick(rng, [2, 3, 4, 5, 6, 8, 9, 10, 12, 15, 16, 20, 24, 30].filter((v) => v !== x1 && (d === 'easy' ? v % x1 === 0 : v % x1 !== 0 && (d === 'medium' || x1 % v !== 0))));
    if (!x2) continue;
    const yInv = tidy(k / x2); const yDir = tidy((y1 / x1) * x2);
    const yAdd = inverse ? y1 - (x2 - x1) : y1 + (x2 - x1);
    if (!hasDp(yInv, 1) || !hasDp(yDir, 1) || !hasDp(y1 / x1, 2) || yInv === yDir || yAdd <= 0 || yAdd === yInv || yAdd === yDir) continue;
    const ansY = inverse ? yInv : yDir;
    const pair = (yv) => `$${X} = ${tnum(x2)}$ and $${Y} = ${tnum(yv)}$`;
    const wrongs = [inverse ? yDir : yInv, yAdd, tidy(inverse ? y1 * 2 : y1 / 2), tidy(ansY + 1), tidy(ansY * 2), tidy(ansY / 2)]
      .filter((v) => v > 0 && hasDp(v, 2) && v !== ansY);
    return {
      prompt: `$${Y}$ is ${inverse ? 'inversely' : 'directly'} proportional to $${X}$. When $${X} = ${tnum(x1)}$, $${Y} = ${tnum(y1)}$. Which of these pairs of values also fits this relationship?`,
      answer: pair(ansY),
      distractors: [...new Set(wrongs)].map(pair),
      count: d === 'easy' ? 4 : 5,
      solution: [
        inverse ? `Inverse proportion: $${X} \\times ${Y}$ is always the same. Here $${tnum(x1)} \\times ${tnum(y1)} = ${tnum(k)}$.` : `Direct proportion: $${Y} \\div ${X}$ is always the same. Here $${tnum(y1)} \\div ${tnum(x1)} = ${tnum(tidy(y1 / x1))}$.`,
        inverse ? `When $${X} = ${tnum(x2)}$: $${Y} = ${tnum(k)} \\div ${tnum(x2)} = ${tnum(yInv)}$.` : `When $${X} = ${tnum(x2)}$: $${Y} = ${tnum(tidy(y1 / x1))} \\times ${tnum(x2)} = ${tnum(yDir)}$.`,
        inverse ? `(If $${X}$ gets bigger, $${Y}$ must get smaller – and by the same factor, not by the same amount.)` : `(If $${X}$ is multiplied by a number, $${Y}$ is multiplied by the same number.)`,
        `Answer: ${pair(ansY)}`,
      ],
    };
  }
  throw new Error('recognise');
}, { title: 'Which pair of values fits direct or inverse proportion?' });

/* ================================================================== */
/* rat-proportion-algebra                                              */
/* ================================================================== */

// kinds of proportion: f(x) and its TeX
const PROPS = {
  x: { f: (x) => x, tex: (v) => v, word: (y, x) => `$${y}$ is directly proportional to $${x}$`, inv: false },
  x2: { f: (x) => x * x, tex: (v) => `${v}^2`, word: (y, x) => `$${y}$ is directly proportional to $${x}^2$`, alt: (y, x) => `$${y}$ is directly proportional to the square of $${x}$`, inv: false },
  x3: { f: (x) => x ** 3, tex: (v) => `${v}^3`, word: (y, x) => `$${y}$ is directly proportional to $${x}^3$`, alt: (y, x) => `$${y}$ is directly proportional to the cube of $${x}$`, inv: false },
  sqrt: { f: (x) => Math.sqrt(x), tex: (v) => `\\sqrt{${v}}`, word: (y, x) => `$${y}$ is directly proportional to $\\sqrt{${x}}$`, alt: (y, x) => `$${y}$ is directly proportional to the square root of $${x}$`, inv: false },
  inv: { f: (x) => 1 / x, tex: (v) => v, word: (y, x) => `$${y}$ is inversely proportional to $${x}$`, inv: true },
  inv2: { f: (x) => 1 / (x * x), tex: (v) => `${v}^2`, word: (y, x) => `$${y}$ is inversely proportional to $${x}^2$`, alt: (y, x) => `$${y}$ is inversely proportional to the square of $${x}$`, inv: true },
  invsqrt: { f: (x) => 1 / Math.sqrt(x), tex: (v) => `\\sqrt{${v}}`, word: (y, x) => `$${y}$ is inversely proportional to $\\sqrt{${x}}$`, inv: true },
};
const eqTex = (kind, k, y, x) => {
  const P = PROPS[kind];
  const kt = k instanceof Frac ? k.tex() : typeof k === 'string' ? k : tnum(k);
  if (P.inv) return `${y} = \\frac{${kt}}{${P.tex(x)}}`;
  return `${y} = ${kt === '1' ? '' : kt}${P.tex(x)}`;
};
/** Typed forms accepted for an equation such as y = 3x^2, y = 27/8 x^3, y = 12/x^2. */
function eqAccept(kind, k, Y, X) {
  const pw = { x: X, x2: X + '^2', x3: X + '^3', sqrt: 'sqrt(' + X + ')', inv: X, inv2: X + '^2', invsqrt: 'sqrt(' + X + ')' }[kind];
  const inv = PROPS[kind].inv;
  const out = new Set();
  const ks = [];
  if (k instanceof Frac) {
    ks.push(k.n + '/' + k.d, '(' + k.n + '/' + k.d + ')');
    if (hasDp(k.value(), 4)) ks.push(String(tidy(k.value())));
    if (!inv) out.add(Y + '=' + k.n + pw + '/' + k.d);
  } else ks.push(String(tidy(k)));
  for (const kt of ks) {
    if (inv) { out.add(Y + '=' + kt + '/' + pw); out.add(Y + '=' + kt + '/(' + pw + ')'); } else { out.add(Y + '=' + (kt === '1' ? '' : kt) + pw); out.add(Y + '=' + kt + '*' + pw); out.add(Y + '=' + kt + '×' + pw); }
  }
  return [...out];
}
const xValsFor = (kind) => (kind === 'sqrt' || kind === 'invsqrt' ? [1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 144] : [1, 2, 3, 4, 5, 6, 8, 10, 12]);

function propParams(rng, d, kinds) {
  for (let i = 0; i < 300; i += 1) {
    const kind = pick(rng, kinds);
    const P = PROPS[kind];
    const xs = sample(rng, xValsFor(kind).filter((v) => d === 'easy' || v > 1), 2);
    const k = pick(rng, size(d, [2, 3, 4, 5, 10], [3, 5, 6, 0.5, 12, 1.5, 20], [0.2, 2.5, 7, 0.4, 36, 1.25, 80, 60]));
    const [x1, x2] = xs;
    const y1 = tidy(k * P.f(x1)); const y2 = tidy(k * P.f(x2));
    if (!hasDp(y1, 2) || !hasDp(y2, 2) || y1 === y2) continue;
    if (y1 > 100000 || y2 > 100000) continue;
    return { kind, P, k, x1, x2, y1, y2 };
  }
  throw new Error('prop');
}
const VARS = [['y', 'x'], ['d', 't'], ['P', 'V'], ['m', 'r'], ['E', 'v'], ['L', 'D'], ['A', 'r'], ['F', 'd']];

export const propFind = gen('rat-prop-find-value', 'rat-proportion-algebra', (rng, d) => {
  const kinds = size(d, ['x', 'x2', 'inv'], ['x2', 'x3', 'inv', 'sqrt', 'inv2'], ['x3', 'inv2', 'invsqrt', 'sqrt', 'x2']);
  const { kind, P, k, x1, x2, y1, y2 } = propParams(rng, d, kinds);
  const [Y, X] = pick(rng, VARS);
  const askX = d === 'hard' && chance(rng, 0.4) && ['x2', 'x3', 'sqrt', 'inv', 'inv2'].includes(kind);
  const ans = askX ? x2 : y2;
  const linear = askX ? tidy((x1 * y2) / y1) : tidy((y1 * x2) / x1);
  const wrongPow = askX ? null : tidy(P.inv ? (y1 * x1) / x2 : (y1 / x1) * x2);
  const solveX = askX
    ? (kind === 'x2' ? `$${X}^2 = ${tnum(y2)} \\div ${tnum(k)} = ${tnum(x2 * x2)}$, so $${X} = ${x2}$`
      : kind === 'x3' ? `$${X}^3 = ${tnum(y2)} \\div ${tnum(k)} = ${tnum(x2 ** 3)}$, so $${X} = ${x2}$`
        : kind === 'sqrt' ? `$\\sqrt{${X}} = ${tnum(y2)} \\div ${tnum(k)} = ${tnum(Math.sqrt(x2))}$, so $${X} = ${x2}$`
          : kind === 'inv' ? `$${X} = ${tnum(k)} \\div ${tnum(y2)} = ${x2}$`
            : `$${X}^2 = ${tnum(k)} \\div ${tnum(y2)} = ${tnum(x2 * x2)}$, so $${X} = ${x2}$`)
    : `$${Y} = ${P.inv ? `\\frac{${tnum(k)}}{${P.tex(tnum(x2))}}` : `${tnum(k)} \\times ${P.tex(tnum(x2))}`} = ${tnum(y2)}$`;
  const desc = (P.alt && chance(rng, 0.5) ? P.alt : P.word)(Y, X);
  return {
    prompt: `${desc}. When $${X} = ${tnum(x1)}$, $${Y} = ${tnum(y1)}$. Work out the value of $${askX ? X : Y}$ when $${askX ? Y : X} = ${tnum(askX ? y2 : x2)}$${askX ? ` (where $${X} > 0$)` : ''}.`,
    answer: `$${tnum(ans)}$`,
    distractors: dvals(ans, [linear, wrongPow, askX ? x2 * x2 : y2 * 2, askX ? null : tidy(y1 * (P.inv ? x1 / x2 : x2 / x1) ** 2), askX ? null : tidy(y1 * (P.inv ? (x1 / x2) ** 3 : (x2 / x1) ** 3)), askX ? tidy(Math.sqrt(x2)) : tidy(k * x2), askX ? x2 + 1 : null], (v) => `$${tnum(v)}$`, { dp: 2, round: true }),
    typed: { kind: 'number', value: ans },
    calculator: d === 'hard',
    solution: [
      `Write the equation with a constant $k$: $${eqTex(kind, 'k', Y, X).replace(/= k/, '= k').replace('\\frac{k}', '\\frac{k}')}$.`.replace('k}', 'k}'),
      `Substitute $${X} = ${tnum(x1)}$, $${Y} = ${tnum(y1)}$: $k = ${tnum(k)}$, so $${eqTex(kind, k, Y, X)}$.`,
      solveX,
      `Answer: $${tnum(ans)}$`,
    ],
  };
}, { title: 'Proportion with powers and roots: find a value' });

export const propEquation = gen('rat-prop-equation', 'rat-proportion-algebra', (rng, d) => {
  const kinds = size(d, ['x', 'x2', 'inv'], ['x2', 'x3', 'inv', 'inv2', 'sqrt'], ['x3', 'inv2', 'invsqrt', 'sqrt', 'x2']);
  for (let i = 0; i < 200; i += 1) {
    const kind = pick(rng, kinds);
    const P = PROPS[kind];
    const x1 = pick(rng, xValsFor(kind).filter((v) => v > 1));
    // allow fractional k for direct x^3 style (y = 17 when x = 4 -> k = 17/64)
    const useFrac = d === 'hard' && !P.inv && chance(rng, 0.4);
    let k; let y1;
    if (useFrac) {
      const den = P.f(x1);
      if (!Number.isInteger(den)) continue;
      y1 = int(rng, 2, 40);
      k = new Frac(y1, den);
      if (k.d === 1) continue;
    } else {
      k = pick(rng, [2, 3, 4, 5, 6, 8, 12, 0.5, 20, 1.5, 36, 48, 100]);
      y1 = tidy(k * P.f(x1));
      if (!hasDp(y1, 2)) continue;
    }
    const [Y, X] = pick(rng, VARS);
    const ans = eqTex(kind, k, Y, X);
    const kNum = k instanceof Frac ? k.value() : k;
    const wrongK = (kk) => (Number.isFinite(kk) && kk > 0 ? (hasDp(kk, 3) ? kk : (k instanceof Frac ? null : null)) : null);
    const dist = [];
    const other = { x: ['x2', 'inv'], x2: ['x', 'x3', 'inv2'], x3: ['x2', 'x'], sqrt: ['x', 'x2'], inv: ['x', 'inv2'], inv2: ['inv', 'x2'], invsqrt: ['inv', 'sqrt'] }[kind];
    for (const ok of other) {
      const kk = y1 / PROPS[ok].f(x1);
      if (hasDp(kk, 3)) dist.push(`$${eqTex(ok, tidy(kk), Y, X)}$`);
    }
    if (!(k instanceof Frac)) {
      const inv = P.inv ? null : 1 / kNum;
      if (inv && hasDp(inv, 3)) dist.push(`$${eqTex(kind, tidy(inv), Y, X)}$`);
      dist.push(`$${eqTex(kind, tidy(y1), Y, X)}$`);
      dist.push(`$${eqTex(kind, tidy(kNum * 2), Y, X)}$`);
      if (hasDp(y1 * P.f(x1), 3)) dist.push(`$${eqTex(kind, tidy(y1 * P.f(x1)), Y, X)}$`);
      dist.push(`$${eqTex(kind, tidy(kNum + 1), Y, X)}$`);
      if (P.inv) dist.push(`$${Y} = ${tnum(kNum)}${P.tex(X)}$`);
      else dist.push(`$${Y} = \\frac{${tnum(kNum)}}{${P.tex(X)}}$`);
    } else {
      dist.push(`$${eqTex(kind, k.inv(), Y, X)}$`, `$${eqTex(kind, y1, Y, X)}$`, `$${eqTex(kind, new Frac(y1, x1), Y, X)}$`, `$${Y} = \\frac{${k.n}}{${k.d}${P.tex(X)}}$`);
    }
    void wrongK;
    const desc = (P.alt && chance(rng, 0.5) ? P.alt : P.word)(Y, X);
    return {
      prompt: `${desc}. $${Y} = ${tnum(y1)}$ when $${X} = ${tnum(x1)}$. Find an equation connecting $${Y}$ and $${X}$.`,
      answer: `$${ans}$`,
      distractors: dist,
      typed: { kind: 'text', accept: eqAccept(kind, k, Y, X) },
      calculator: d === 'hard',
      solution: [
        `Start with $${eqTex(kind, 'k', Y, X)}$.`,
        `Substitute: $${tnum(y1)} = ${P.inv ? `\\frac{k}{${P.tex(tnum(x1))}}` : `k \\times ${P.tex(tnum(x1))}`}$, so $k = ${P.inv ? `${tnum(y1)} \\times ${tnum(1 / P.f(x1))}` : `${tnum(y1)} \\div ${tnum(P.f(x1))}`} = ${k instanceof Frac ? k.tex() : tnum(k)}$.`,
        `Answer: $${ans}$`,
      ],
    };
  }
  throw new Error('prop eq');
}, { title: 'Find the equation of a proportion relationship' });

export const propScaling = gen('rat-prop-scaling', 'rat-proportion-algebra', (rng, d) => {
  const kinds = size(d, ['x', 'x2', 'inv'], ['x2', 'x3', 'inv', 'inv2', 'sqrt'], ['x3', 'inv2', 'invsqrt', 'sqrt', 'x2']);
  for (let i = 0; i < 100; i += 1) {
    const kind = pick(rng, kinds);
    const P = PROPS[kind];
    const s = kind === 'sqrt' || kind === 'invsqrt' ? pick(rng, [4, 9, 16, 25, 100]) : pick(rng, [2, 3, 4, 5, 10]);
    const effect = P.f(s) / P.f(1);
    const label = (e) => (e >= 1 ? `Multiplied by ${num(tidy(e))}` : `Divided by ${num(tidy(1 / e))}`);
    const ans = label(effect);
    const [Y, X] = pick(rng, VARS);
    const cands = [s, 1 / s, s * s, 1 / (s * s), s ** 3, 1 / s ** 3, Math.sqrt(s), 1 / Math.sqrt(s), 2 * s].filter((e) => Number.isFinite(e) && hasDp(e, 3) && hasDp(1 / e, 3) || Number.isInteger(e) || Number.isInteger(1 / e));
    const distractors = [...new Set(cands.map(label))].filter((t) => t !== ans);
    if (distractors.length < 4) continue;
    const desc = (P.alt && chance(rng, 0.5) ? P.alt : P.word)(Y, X);
    return {
      prompt: `${desc}. The value of $${X}$ is multiplied by ${s}. What happens to the value of $${Y}$?`,
      answer: ans,
      distractors,
      solution: [
        `Write $${eqTex(kind, 'k', Y, X)}$.`,
        `Replacing $${X}$ by $${s}${X}$ multiplies $${P.tex(X)}$ by $${P.tex(String(s)).replace(/^\\sqrt\{(\d+)\}$/, (m, v) => `\\sqrt{${v}} = ${Math.sqrt(Number(v))}`).replace(/^(\d+)\^2$/, (m, v) => `${v}^2 = ${v * v}`).replace(/^(\d+)\^3$/, (m, v) => `${v}^3 = ${v ** 3}`)}$.`,
        P.inv ? `$${Y}$ is inversely proportional, so $${Y}$ is <b>divided</b> by that number.` : `$${Y}$ is directly proportional, so $${Y}$ is <b>multiplied</b> by that number.`,
        `Answer: ${ans}`,
      ],
    };
  }
  throw new Error('scaling');
}, { title: 'Effect of scaling x on y' });

// v: [y letter, x letter]; ks: realistic constants; xs: x values; fmtY: formats the answer; t: prompt (plain numbers via num()).
const PROP_WORD = [
  { kind: 'x2', v: ['d', 't'], ks: [5, 4.9, 4.5], xs: [1, 2, 3, 4, 5, 6], unit: 'm', ball: true,
    t: (x1, y1, x2) => `A ball is dropped from a tall building. The distance it falls, $d$ metres, is directly proportional to the square of the time, $t$ seconds, since it was dropped. It falls ${num(y1)} m in the first ${x1} seconds. How far does it fall in the first ${x2} seconds?` },
  { kind: 'x2', v: ['C', 'd'], ks: [0.05, 0.04, 0.06, 0.08], xs: [8, 10, 12, 14, 16, 18], money: true,
    t: (x1, y1, x2) => `The cost of a pizza, £$C$, is directly proportional to the square of its diameter, $d$ inches. A ${x1}-inch pizza costs ${gbp(Math.round(y1 * 100))}. How much does a ${x2}-inch pizza cost?` },
  { kind: 'x2', v: ['d', 'v'], ks: [0.015, 0.02, 0.025, 0.03], xs: [20, 30, 40, 50, 60, 70], unit: 'm',
    t: (x1, y1, x2) => `The braking distance of a car, $d$ metres, is directly proportional to the square of its speed, $v$ mph. At ${x1} mph the braking distance is ${num(y1)} m. What is the braking distance at ${x2} mph?` },
  { kind: 'x3', v: ['m', 'l'], ks: [2.7, 7.8, 8.9, 11.3], xs: [2, 3, 4, 5, 6, 10], unit: 'g',
    t: (x1, y1, x2) => `The mass, $m$ grams, of a solid metal cube is directly proportional to the cube of its side length, $l$ cm. A cube of side ${x1} cm has a mass of ${num(y1)} g. What is the mass of a cube of side ${x2} cm?` },
  { kind: 'inv2', v: ['B', 'd'], ks: [400, 800, 900, 1200, 3600], xs: [1, 2, 3, 4, 5, 6, 10], unit: 'lux',
    t: (x1, y1, x2) => `The brightness of a lamp, $B$ lux, is inversely proportional to the square of the distance, $d$ metres, from the lamp. At ${x1} m the brightness is ${num(y1)} lux. What is the brightness at ${x2} m?` },
  { kind: 'inv', v: ['P', 'V'], ks: [600, 1200, 2400, 3000], xs: [2, 3, 4, 5, 6, 8, 10, 12], unit: 'kPa',
    t: (x1, y1, x2) => `The pressure of a gas, $P$ kPa, is inversely proportional to its volume, $V$ litres. When the volume is ${x1} litres the pressure is ${num(y1)} kPa. What is the pressure when the volume is ${x2} litres?` },
  { kind: 'sqrt', v: ['T', 'L'], ks: [0.2, 0.25, 0.3, 0.4], xs: [4, 9, 16, 25, 36, 49, 64, 81, 100], unit: 'seconds',
    t: (x1, y1, x2) => `The time for one swing of a pendulum, $T$ seconds, is directly proportional to the square root of its length, $L$ cm. A pendulum ${x1} cm long takes ${num(y1)} seconds. How long does a pendulum ${x2} cm long take?` },
  { kind: 'x2', v: ['E', 'v'], ks: [10, 15, 20, 25, 40], xs: [2, 3, 4, 5, 6, 8, 10], unit: 'joules',
    t: (x1, y1, x2) => `The kinetic energy, $E$ joules, of a moving trolley is directly proportional to the square of its speed, $v$ m/s. At ${x1} m/s it has ${num(y1)} joules. How many joules does it have at ${x2} m/s?` },
  { kind: 'inv', v: ['t', 's'], ks: [1200, 1800, 2400, 3600], xs: [20, 30, 40, 50, 60, 80], unit: 'minutes',
    t: (x1, y1, x2) => `The time, $t$ minutes, for a coach journey is inversely proportional to the average speed, $s$ mph. At ${x1} mph the journey takes ${num(y1)} minutes. How many minutes does it take at ${x2} mph?` },
  { kind: 'inv2', v: ['F', 'd'], ks: [36, 72, 100, 144, 400], xs: [1, 2, 3, 4, 5, 6, 10], unit: 'N',
    t: (x1, y1, x2) => `The force, $F$ newtons, between two magnets is inversely proportional to the square of the distance, $d$ cm, between them. When they are ${x1} cm apart the force is ${num(y1)} N. What is the force when they are ${x2} cm apart?` },
  { kind: 'x3', v: ['V', 'h'], ks: [0.5, 0.4, 0.25, 0.2], xs: [4, 5, 6, 8, 10, 12], unit: 'ml',
    t: (x1, y1, x2) => `Some jars are mathematically similar. The volume, $V$ ml, of a jar is directly proportional to the cube of its height, $h$ cm. A jar ${x1} cm tall holds ${num(y1)} ml. How much does a jar ${x2} cm tall hold?` },
  { kind: 'x2', v: ['p', 'h'], ks: [0.5, 0.25, 0.75, 1.5], xs: [4, 6, 8, 10, 12, 20], unit: 'ml',
    t: (x1, y1, x2) => `The amount of paint, $p$ ml, needed for a model statue is directly proportional to the square of its height, $h$ cm. A statue ${x1} cm tall needs ${num(y1)} ml of paint. How much paint does a similar statue ${x2} cm tall need?` },
  { kind: 'inv', v: ['n', 'w'], ks: [240, 360, 480, 720], xs: [2, 3, 4, 5, 6, 8, 10, 12], unit: 'days',
    t: (x1, y1, x2) => `The number of days, $n$, that a job takes is inversely proportional to the number of workers, $w$. With ${x1} workers the job takes ${num(y1)} days. How many days does it take with ${x2} workers?` },
];

export const propWord = gen('rat-prop-word', 'rat-proportion-algebra', (rng, d) => {
  for (let i = 0; i < 300; i += 1) {
    // easy: squares and simple inverse; hard: cubes, roots, inverse squares and the 'next t seconds' twist
    const tpl = pick(rng, PROP_WORD.filter((t) => size(d, ['x2', 'inv'], ['x2', 'x3', 'inv', 'sqrt', 'inv2'], ['x3', 'inv2', 'sqrt', 'x2']).includes(t.kind)));
    const P = PROPS[tpl.kind];
    const [x1, x2] = sample(rng, tpl.xs, 2);
    if (d === 'easy' && x2 % x1 !== 0 && x1 % x2 !== 0) continue;
    if (d === 'hard' && tpl.ball && x2 <= x1) continue;
    const k = pick(rng, tpl.ks);
    const y1 = tidy(k * P.f(x1)); const y2 = tidy(k * P.f(x2));
    if (!hasDp(y1, 2) || !hasDp(y2, 2)) continue;
    if (tpl.money && (y1 < 3 || y2 < 3 || y1 > 30 || y2 > 30)) continue;
    const [Y, X] = tpl.v;
    // "how far in the NEXT t seconds" variant for the falling ball (hard)
    const next = tpl.ball && d === 'hard' && x2 > x1;
    const ans = next ? tidy(y2 - y1) : y2;
    const fmt = tpl.money ? (v) => gbp(Math.round(v * 100)) : withUnit(tpl.unit);
    let prompt = tpl.t(x1, y1, x2);
    if (next) prompt = prompt.replace(`How far does it fall in the first ${x2} seconds?`, `How far does it fall in the next ${x2 - x1} seconds?`);
    const lin = tidy((y1 * x2) / x1);
    return {
      prompt,
      answer: fmt(ans),
      distractors: dvals(ans, [P.inv ? tidy((y1 * x1) / x2) === ans ? lin : tidy((y1 * x1) / x2) : lin, tidy(y1 * (P.inv ? x1 / x2 : x2 / x1) ** 3), tidy(y1 * (P.inv ? x1 / x2 : x2 / x1) ** 2), next ? y2 : null, tidy(y1 * (P.inv ? x2 / x1 : x1 / x2) ** 2), tidy(Math.sqrt(y1) * (x2 / x1)), x2 > x1 ? tidy(k * P.f(x2 - x1)) : null], fmt, { dp: 2, round: true }),
      typed: { kind: 'number', value: ans },
      calculator: true,
      solution: [
        `Write the relationship with a constant: $${eqTex(tpl.kind, 'k', Y, X)}$.`,
        `Use the known values: $k = ${P.inv ? `${tnum(y1)} \\times ${P.tex(tnum(x1))}` : `${tnum(y1)} \\div ${P.tex(tnum(x1))}`} = ${tnum(k)}$, so $${eqTex(tpl.kind, k, Y, X)}$.`,
        `When $${X} = ${x2}$: $${Y} = ${P.inv ? `\\frac{${tnum(k)}}{${P.tex(tnum(x2))}}` : `${tnum(k)} \\times ${P.tex(tnum(x2))}`} = ${tnum(y2)}$${next ? `. That is the distance in the first ${x2} seconds, so in the next ${x2 - x1} seconds it falls $${tnum(y2)} - ${tnum(y1)} = ${tnum(ans)}$ m` : ''}.`,
        `Answer: ${fmt(ans)}`,
      ],
    };
  }
  throw new Error('prop word');
}, { title: 'Proportion with powers in real contexts', word: true });

// Small sketch graphs for recognising proportion. Each shape is a function on 0 < t ≤ 1 (scaled to the panel).
const SHAPES = {
  x: { f: (t) => t, label: 'directly proportional to $x$', from0: true },
  lin: { f: (t) => 0.3 + 0.6 * t, label: null, from0: true },
  x2: { f: (t) => t * t, label: 'directly proportional to $x^2$', from0: true },
  inv: { f: (t) => Math.min(1, 0.08 / t), label: 'inversely proportional to $x$', from0: false },
  down: { f: (t) => 0.8 - 0.7 * t, label: null, from0: true },
  sqrt: { f: (t) => Math.sqrt(t), label: 'directly proportional to $\\sqrt{x}$', from0: true },
};
export function graphPanels(order) {
  const W = 110; const H = 120; const pad = 14;
  let body = '';
  order.forEach((key, i) => {
    const x0 = i * W + pad; const y0 = H - 22; const w = W - 2 * pad; const h = H - 40;
    body += line(x0, y0, x0 + w, y0, { width: 1.5 }) + line(x0, y0, x0, y0 - h, { width: 1.5 });
    body += text(x0 - 6, y0 + 8, 'O', { size: 11 }) + text(x0 + w + 2, y0 + 10, 'x', { size: 13, italic: true }) + text(x0 - 9, y0 - h - 2, 'y', { size: 13, italic: true });
    const pts = [];
    for (let j = 0; j <= 40; j += 1) {
      const t = SHAPES[key].from0 ? j / 40 : 0.08 + (0.92 * j) / 40;
      pts.push([x0 + t * w, y0 - SHAPES[key].f(t) * h]);
    }
    body += polyline(pts, { color: ACCENT, width: 2.5 });
    body += text(x0 + w / 2, H - 6, String(i + 1), { size: 15, bold: true });
  });
  return svg(W * order.length, H, body, { label: 'Four sketch graphs numbered 1 to 4' });
}

function graphRecognise(rng, d) {
  const target = pick(rng, size(d, ['x', 'inv'], ['x', 'x2', 'inv'], ['x2', 'sqrt', 'inv']));
  const pool = ['x', 'lin', 'x2', 'inv', 'down', 'sqrt'].filter((s) => s !== target && !(target === 'x2' && s === 'sqrt') && !(target === 'sqrt' && s === 'x2'));
  const order = shuffle(rng, [target, ...sample(rng, pool, 3)]);
  const ans = `Graph ${order.indexOf(target) + 1}`;
  return {
    prompt: `Which graph shows that $y$ is ${SHAPES[target].label}?`,
    visual: graphPanels(order),
    answer: ans,
    distractors: order.filter((k) => k !== target).map((k) => `Graph ${order.indexOf(k) + 1}`),
    count: 4,
    keepOrder: false,
    solution: [
      target === 'inv' ? 'Inverse proportion: as $x$ increases, $y$ decreases, getting closer and closer to the axes but never touching them (a curve, not a straight line).'
        : target === 'x' ? 'Direct proportion with $x$: a straight line through the origin. (A straight line that does not go through O is not proportion.)'
          : target === 'x2' ? '$y = kx^2$: a curve through the origin that gets steeper and steeper.' : '$y = k\\sqrt{x}$: a curve through the origin that gets less and less steep.',
      `Answer: ${ans}`,
    ],
  };
}

export const propRecognise = gen('rat-prop-recognise', 'rat-proportion-algebra', (rng, d) => {
  if (chance(rng, 0.35)) return graphRecognise(rng, d);
  const kinds = size(d, ['x', 'inv', 'x2'], ['x2', 'inv', 'inv2', 'x3', 'sqrt'], ['inv2', 'invsqrt', 'sqrt', 'x3', 'x2']);
  const kind = pick(rng, kinds);
  const P = PROPS[kind];
  const [Y, X] = pick(rng, VARS);
  const k = pick(rng, [2, 3, 4, 5, 6, 0.5, 10]);
  const others = Object.keys(PROPS).filter((o) => o !== kind);
  const wrong = [
    ...sample(rng, others, 3).map((o) => `$${eqTex(o, k, Y, X)}$`),
    `$${Y} = ${P.tex(X)} + ${tnum(k)}$`, `$${Y} = ${tnum(k)} - ${P.tex(X)}$`,
  ];
  const desc = P.word(Y, X);
  return {
    prompt: `Which equation shows that ${desc}?`,
    answer: `$${eqTex(kind, k, Y, X)}$`,
    distractors: wrong,
    solution: [
      P.inv ? `“Inversely proportional to $${P.tex(X)}$” means $${Y} = \\frac{k}{${P.tex(X)}}$ for some constant $k$.` : `“Directly proportional to $${P.tex(X)}$” means $${Y} = k${P.tex(X)}$ for some constant $k$.`,
      `Adding or subtracting a number does not give proportion – the graph would not pass through the origin${P.inv ? ' or have the right shape' : ''}.`,
      `Answer: $${eqTex(kind, k, Y, X)}$`,
    ],
  };
}, { title: 'Recognise the equation or graph for a proportion statement', learn: ['rat-proportion-algebra', 'gr-graph-shapes'] });

export const proportionGenerators = [
  directRecipe, directCost, directMax, directTable, directRates,
  exchangeConvert, exchangeCompare, exchangeRateFind, exchangeTwoStep,
  bestBuyPacks3, bestBuyOffers, bestBuyUnitDiff,
  inverseWorkers, inverseTable, inverseRecognise,
  propFind, propEquation, propScaling, propWord, propRecognise,
];
void [gcd];
