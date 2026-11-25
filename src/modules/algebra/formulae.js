// Formulae and identities: substituting, writing, vocabulary, identities, rearranging, iteration.
import { pick, int, intExcept, size, chance, tnum, terms, names, money, roundTo, shuffle, frac, Frac, gcd, tidy, num } from '../../core.js';
import { svg, polygon, text, equalTicks, notDrawnAccurately } from '../../svg.js';
import { G, P, br, tf, $, rat, tv, pmul } from './lib.js';

const paren = (n) => (n < 0 ? `(${tnum(n)})` : tnum(n));
const val = (v) => (v instanceof Frac ? v.value() : v);

/* ================================================================== */
/* alg-substitute-formulae                                             */
/* ================================================================== */

const FORMULAE = [
  (rng, d) => { // v = u + at
    const u = int(rng, 0, 20); const a = d === 'hard' ? intExcept(rng, -6, 8, [0]) : int(rng, 2, 9); const t = int(rng, 2, 10);
    const v = u + a * t;
    return { f: 'v = u + at', given: { u, a, t }, find: 'v', value: v, work: `v = ${u} + ${paren(a)} \\times ${t} = ${u} + ${paren(a * t)}`, wrong: [(u + a) * t, u + a + t, u * a + t, u - a * t] };
  },
  (rng, d) => { // s = ut + ½at²
    const u = int(rng, 0, 10); const a = 2 * int(rng, 1, 5) * (d === 'hard' && chance(rng) ? -1 : 1); const t = int(rng, 2, 6);
    const s = u * t + (a * t * t) / 2;
    return { f: 's = ut + \\frac{1}{2}at^{2}', given: { u, t, a }, find: 's', value: s, work: `s = ${u} \\times ${t} + \\frac{1}{2} \\times ${paren(a)} \\times ${t}^{2} = ${u * t} + ${paren((a * t * t) / 2)}`, wrong: [u * t + (a * t) ** 2 / 2, u * t + a * t * t, u * t + (a * t) / 2, (u + a / 2) * t] };
  },
  (rng) => { // A = ½(a + b)h
    const a = int(rng, 2, 12); const b = int(rng, 3, 15); const h = 2 * int(rng, 1, 6);
    return { f: 'A = \\frac{1}{2}(a + b)h', given: { a, b, h }, find: 'A', value: ((a + b) * h) / 2, work: `A = \\frac{1}{2} \\times (${a} + ${b}) \\times ${h} = \\frac{1}{2} \\times ${a + b} \\times ${h}`, wrong: [(a + b) * h, a + (b * h) / 2, (a * b * h) / 2, a + b + h] };
  },
  (rng, d) => { // F = 9C/5 + 32
    const C = 5 * (d === 'hard' ? intExcept(rng, -8, 12, [0]) : int(rng, 1, 12));
    return { f: 'F = \\frac{9C}{5} + 32', given: { C }, find: 'F', value: (9 * C) / 5 + 32, work: `F = \\frac{9 \\times ${paren(C)}}{5} + 32 = ${(9 * C) / 5} + 32`, wrong: [(9 * (C + 32)) / 5, (9 * C) / 5 - 32, 9 * C + 32, (5 * C) / 9 + 32].filter(Number.isInteger) };
  },
  (rng) => { // P = 2(l + w)
    const l = int(rng, 3, 25); const w = int(rng, 2, 15);
    return { f: 'P = 2(l + w)', given: { l, w }, find: 'P', value: 2 * (l + w), work: `P = 2 \\times (${l} + ${w}) = 2 \\times ${l + w}`, wrong: [2 * l + w, l + w, 2 * l * w, 4 * (l + w)] };
  },
  (rng) => { // E = ½mv²
    const m = 2 * int(rng, 1, 8); const v = int(rng, 2, 10);
    return { f: 'E = \\frac{1}{2}mv^{2}', given: { m, v }, find: 'E', value: (m * v * v) / 2, work: `E = \\frac{1}{2} \\times ${m} \\times ${v}^{2} = \\frac{1}{2} \\times ${m} \\times ${v * v}`, wrong: [(m * v) ** 2 / 2, m * v, m * v * v, (m * v * 2) / 2 + 1] };
  },
  (rng, d) => { // y = mx + c
    const m = intExcept(rng, -6, 6, [0]); const x = d === 'easy' ? int(rng, 1, 9) : intExcept(rng, -8, 8, [0]); const c = intExcept(rng, -12, 12, [0]);
    return { f: 'y = mx + c', given: { m, x, c }, find: 'y', value: m * x + c, work: `y = ${paren(m)} \\times ${paren(x)} + ${paren(c)} = ${tnum(m * x)} + ${paren(c)}`, wrong: [m * (x + c), m + x + c, m * x - c, -m * x + c] };
  },
  (rng) => { // T = 40w + 20 (cooking)
    const w = int(rng, 2, 9); const k = pick(rng, [30, 40, 45, 50]); const e = pick(rng, [15, 20, 25, 30]);
    return { f: `T = ${k}w + ${e}`, given: { w }, find: 'T', value: k * w + e, work: `T = ${k} \\times ${w} + ${e}`, wrong: [k * (w + e), k + w + e, k * w - e, Number(`${k}${w}`) + e] };
  },
  (rng, d) => { // D = b² − 4ac
    const b = intExcept(rng, -9, 9, [0]); const a = intExcept(rng, -5, 6, [0]); const c = d === 'easy' ? int(rng, 1, 6) : intExcept(rng, -8, 8, [0]);
    return { f: 'D = b^{2} - 4ac', given: { a, b, c }, find: 'D', value: b * b - 4 * a * c, work: `D = ${paren(b)}^{2} - 4 \\times ${paren(a)} \\times ${paren(c)} = ${b * b} - ${paren(4 * a * c)}`, wrong: [b * b + 4 * a * c, -(b * b) - 4 * a * c, 2 * b - 4 * a * c, (b * b - 4) * a * c] };
  },
  (rng) => { // V = lwh
    const l = int(rng, 2, 12); const w = int(rng, 2, 9); const h = int(rng, 2, 8);
    return { f: 'V = lwh', given: { l, w, h }, find: 'V', value: l * w * h, work: `V = ${l} \\times ${w} \\times ${h}`, wrong: [l + w + h, 2 * (l * w + w * h + l * h), l * w + h, l * w] };
  },
];

export const formulaSub = G('alg-formula-sub', 'alg-substitute-formulae', (rng, d) => {
  const f = pick(rng, FORMULAE)(rng, d);
  if (!Number.isInteger(f.value)) throw new Error('');
  const given = Object.entries(f.given).map(([k, v]) => `$${k} = ${tnum(v)}$`).join(', ').replace(/, ([^,]*)$/, ' and $1');
  return {
    prompt: `$${f.f}$<br>Work out the value of $${f.find}$ when ${given}.`,
    answer: $(tnum(f.value)),
    distractors: [...f.wrong, f.value + 1, f.value - 2, -f.value].filter((w) => Number.isInteger(w) && w !== f.value).map((w) => $(tnum(w))),
    typed: { kind: 'number', value: f.value },
    hint: 'Substitute the values carefully, then use the order of operations: brackets, powers, × and ÷, + and −.',
    solution: [`Substitute the values (put negatives in brackets).`, `$${f.work}$`, `$${f.find} = ${tnum(f.value)}$`, `Answer: $${tnum(f.value)}$`],
  };
}, { title: 'Substitute into a formula' });

// Each context has its own realistic numbers: k per unit, c0 fixed amount, n = input range, scale = input step.
const WORD_FORMULAE = [
  (rng) => { const c0 = 5 * int(rng, 8, 18); const k = 5 * int(rng, 5, 12); return { k, c0, n: [1, 8], rule: `Cost (£) = ${c0} + ${k} × number of hours`, ctx: 'A plumber works out her charge using this rule.', fwd: (n) => `How much does she charge for a ${n}-hour job?`, back: (c) => `A job cost £${c}. How many hours did it take?`, money: true, inUnit: 'hours' }; },
  (rng) => { const k = pick(rng, [40, 45, 50]); const c0 = pick(rng, [15, 20, 25, 30]); return { k, c0, n: [2, 5], rule: `Cooking time (minutes) = ${k} × weight in kg + ${c0}`, ctx: 'This rule gives the time to roast a chicken.', fwd: (n) => `How long does a ${n} kg chicken take?`, back: (c) => `A chicken takes ${c} minutes. What is its weight?`, unit: 'minutes', inUnit: 'kg' }; },
  (rng) => { const c0 = int(rng, 2, 5); const k = pick(rng, [2, 3]); return { k, c0, n: [2, 15], rule: `Fare (£) = ${c0} + ${k} × number of miles`, ctx: 'A taxi firm uses this rule.', fwd: (n) => `What is the fare for a ${n}-mile journey?`, back: (c) => `A journey cost £${c}. How many miles was it?`, money: true, inUnit: 'miles' }; },
  (rng, name) => { const c0 = 5 * int(rng, 4, 10); const k = 5 * int(rng, 6, 14); return { k, c0, n: [1, 7], rule: `Total cost (£) = ${c0} + ${k} × number of days`, ctx: 'A company hires out vans using this rule.', fwd: (n) => `How much does it cost to hire a van for ${n} days?`, back: (c) => `${name} paid £${c}. For how many days did ${name} hire the van?`, money: true, inUnit: 'days' }; },
  (rng) => { const c0 = int(rng, 10, 25); const k10 = int(rng, 2, 4); return { k: k10 / 10, c0, n: [20, 60], scale: 10, rule: `Bill (£) = ${c0} + ${tnum(k10 / 10)} × number of units used`, ctx: 'An energy company works out bills with this rule.', fwd: (n) => `What is the bill when ${n} units are used?`, back: (c) => `A bill is £${c}. How many units were used?`, money: true, inUnit: '' }; },
  (rng) => { const c0 = int(rng, 5, 10); const k = int(rng, 2, 4); return { k, c0, n: [6, 20], rule: `Charge (£) = ${c0} + ${k} × number of windows`, ctx: 'A window cleaner charges using this rule.', fwd: (n) => `How much is the charge for ${n} windows?`, back: (c) => `The charge was £${c}. How many windows were cleaned?`, money: true, inUnit: '' }; },
  (rng, name) => { const k = 5 * int(rng, 12, 18); const c0 = 5 * int(rng, 2, 6); return { k, c0, n: [2, 8], rule: `Rice needed (g) = ${k} × number of people + ${c0}`, ctx: `${name} uses this rule when cooking rice.`, fwd: (n) => `How much rice is needed for ${n} people?`, back: (c) => `${name} cooked ${c} g of rice. How many people was it for?`, unit: 'g', inUnit: '' }; },
  (rng) => { const c0 = 10 * int(rng, 5, 10); const k = 5 * int(rng, 4, 8); return { k, c0, n: [2, 6], rule: `Hall hire (£) = ${c0} + ${k} × number of hours`, ctx: 'A village hall is hired out using this rule.', fwd: (n) => `What does it cost to hire the hall for ${n} hours?`, back: (c) => `The hire cost was £${c}. For how many hours was the hall hired?`, money: true, inUnit: 'hours' }; },
  (rng) => { const k = int(rng, 4, 8); const c0 = int(rng, 2, 10); return { k, c0, n: [3, 15], rule: `Number of chairs = ${k} × number of tables + ${c0}`, ctx: 'A café sets out chairs using this rule.', fwd: (n) => `How many chairs are needed for ${n} tables?`, back: (c) => `There are ${c} chairs. How many tables are there?`, inUnit: '' }; },
  (rng, name) => { const k = int(rng, 10, 14); const c0 = 5 * int(rng, 2, 6); return { k, c0, n: [4, 30], rule: `Pay (£) = ${k} × number of hours worked + ${c0}`, ctx: `${name} is paid using this rule.`, fwd: (n) => `How much does ${name} earn for ${n} hours?`, back: (c) => `${name} earned £${c}. How many hours did ${name} work?`, money: true, inUnit: 'hours' }; },
  (rng, name) => { const c0 = 5 * int(rng, 2, 6); const k = int(rng, 4, 8); return { k, c0, n: [2, 12], rule: `Monthly cost (£) = ${c0} + ${k} × number of classes`, ctx: 'A gym charges members using this rule.', fwd: (n) => `How much does a month with ${n} classes cost?`, back: (c) => `${name}'s monthly cost was £${c}. How many classes did ${name} go to?`, money: true, inUnit: '' }; },
  (rng) => { const c0 = 5 * int(rng, 2, 6); const k = int(rng, 8, 15); return { k, c0, n: [2, 10], rule: `Height (cm) = ${c0} + ${k} × age in weeks`, ctx: 'A gardener uses this rule to estimate the height of a sunflower.', fwd: (n) => `What height does the rule give at ${n} weeks?`, back: (c) => `The rule gives a height of ${c} cm. How many weeks old is the sunflower?`, unit: 'cm', inUnit: 'weeks' }; },
  (rng) => { const c0 = int(rng, 2, 5); const k10 = int(rng, 1, 3); return { k: k10 / 10, c0, n: [2, 10], scale: 10, rule: `Cost (£) = ${c0} + ${tnum(k10 / 10)} × number of photos`, ctx: 'A shop prints photos using this rule.', fwd: (n) => `How much do ${n} photos cost?`, back: (c) => `An order costs £${c}. How many photos were printed?`, money: true, inUnit: '' }; },
];

export const formulaWords = G('alg-formula-sub-word', 'alg-substitute-formulae', (rng, d) => {
  const t = pick(rng, WORD_FORMULAE)(rng, names(rng, 1)[0]);
  const { k, c0 } = t;
  const scale = t.scale || 1;
  const n = int(rng, t.n[0], t.n[1]);
  const out = tidy(k * (n * scale) + c0);
  const backwards = d === 'hard' || (d === 'medium' && chance(rng, 0.5));
  const fmtIn = (v) => `${num(v)}${t.inUnit ? ` ${t.inUnit}` : ''}`;
  if (!backwards) {
    const inp = n * scale;
    const wrong = [k * (inp + c0), k + inp + c0, k * inp - c0, c0 * inp + k, out + k, out - c0].map(tidy).filter((w) => w > 0 && w !== out && w < 4 * out);
    // One money format for the whole option list.
    const pence = [out, ...wrong].some((v) => !Number.isInteger(v));
    const fmtOut = (v) => (t.money ? money(v, { forcePence: pence }) : `${num(v)} ${t.unit || ''}`.trim());
    return {
      prompt: `${t.ctx}<br><b>${t.rule}</b><br>${t.fwd(inp)}`,
      answer: fmtOut(out),
      distractors: wrong.map(fmtOut),
      typed: { kind: 'number', value: out },
      solution: [`Put the number into the rule. Multiply first, then add.`, `$${tnum(k)} \\times ${inp} + ${c0} = ${tnum(tidy(k * inp))} + ${c0} = ${tnum(out)}$`, `Answer: ${fmtOut(out)}`],
    };
  }
  const inp = n * scale;
  const outTxt = t.money && !Number.isInteger(out) ? tnum(out, 2) : tnum(out);
  const wrong = [(out + c0) / k, out / k - c0, out / k, (out - c0) * k, inp + scale].map(tidy).filter((w) => Number.isInteger(w) && w > 0 && w !== inp);
  return {
    prompt: `${t.ctx}<br><b>${t.rule}</b><br>${t.back(outTxt.replace(/\{,\}/g, ','))}`,
    answer: fmtIn(inp),
    distractors: wrong.map(fmtIn),
    typed: { kind: 'number', value: inp },
    solution: [`Work backwards: first take away the fixed amount, then divide.`, `$${outTxt} - ${c0} = ${tnum(tidy(out - c0))}$`, `$${tnum(tidy(out - c0))} \\div ${tnum(k)} = ${tnum(inp)}$`, `Answer: ${fmtIn(inp)}`],
  };
}, { title: 'Use a formula written in words', word: true });

export const formulaReverse = G('alg-formula-sub-reverse', 'alg-substitute-formulae', (rng, d) => {
  const forms = [
    () => { const u = int(rng, 0, 15); const a = int(rng, 2, 8); const t = int(rng, 2, 9); const v = u + a * t; const ask = pick(rng, ['t', 'a', 'u']); const vals = { u, a, t, v }; return { f: 'v = u + at', ask, vals, value: vals[ask], eq: { t: `${v} = ${u} + ${a}t`, a: `${v} = ${u} + ${t}a`, u: `${v} = u + ${a} \\times ${t}` }[ask], steps: { t: [`$${a}t = ${v - u}$`, `$t = ${v - u} \\div ${a} = ${t}$`], a: [`$${t}a = ${v - u}$`, `$a = ${v - u} \\div ${t} = ${a}$`], u: [`$${v} = u + ${a * t}$`, `$u = ${v} - ${a * t} = ${u}$`] }[ask], wrong: { t: [(v + u) / a, v / a - u, (v - u) * a], a: [(v + u) / t, v / t - u, (v - u) * t], u: [v + a * t, v - a - t, (v - a) * t] }[ask] }; },
    () => { const l = int(rng, 3, 20); const w = int(rng, 2, 15); const P2 = 2 * (l + w); return { f: 'P = 2(l + w)', ask: 'w', vals: { P: P2, l, w }, value: w, eq: `${P2} = 2(${l} + w)`, steps: [`Divide by 2: $${l} + w = ${P2 / 2}$`, `$w = ${P2 / 2} - ${l} = ${w}$`], wrong: [P2 - 2 * l, P2 / 2 + l, (P2 - l) / 2] }; },
    () => { const b = 2 * int(rng, 2, 8); const h = int(rng, 2, 12); const A = (b * h) / 2; return { f: 'A = \\frac{1}{2}bh', ask: 'h', vals: { A, b, h }, value: h, eq: `${A} = \\frac{1}{2} \\times ${b} \\times h`, steps: [`$${A} = ${b / 2}h$`, `$h = ${A} \\div ${b / 2} = ${h}$`], wrong: [A / b, 2 * A * b, A - b / 2] }; },
    () => { const m = int(rng, 2, 9); const x = intExcept(rng, -6, 9, [0]); const c = intExcept(rng, -10, 10, [0]); const y = m * x + c; return { f: 'y = mx + c', ask: 'x', vals: { y, m, c, x }, value: x, eq: `${y} = ${m}x ${c < 0 ? '-' : '+'} ${Math.abs(c)}`, steps: [`${c < 0 ? 'Add' : 'Subtract'} ${Math.abs(c)}: $${m}x = ${y - c}$`, `$x = ${y - c} \\div ${m} = ${x}$`], wrong: [(y + c) / m, y / m - c, (y - c) * m] }; },
    () => { const C = 5 * int(rng, 0, 20); const F = (9 * C) / 5 + 32; return { f: 'F = \\frac{9C}{5} + 32', ask: 'C', vals: { F, C }, value: C, eq: `${F} = \\frac{9C}{5} + 32`, steps: [`Subtract 32: $${F - 32} = \\frac{9C}{5}$`, `Multiply by 5 then divide by 9: $C = ${(F - 32) * 5} \\div 9 = ${C}$`], wrong: [(F * 5) / 9 - 32, ((F + 32) * 5) / 9, ((F - 32) * 9) / 5] }; },
    () => { const u = int(rng, 1, 8); const a = 2 * int(rng, 1, 4); const s = int(rng, 2, 20); const v2 = u * u + 2 * a * s; const v = Math.sqrt(v2); if (!Number.isInteger(v)) return null; return { f: 'v^{2} = u^{2} + 2as', ask: 'v', vals: { u, a, s, v }, value: v, eq: `v^{2} = ${u}^{2} + 2 \\times ${a} \\times ${s}`, steps: [`$v^{2} = ${u * u} + ${2 * a * s} = ${v2}$`, `$v = \\sqrt{${v2}} = ${v}$ (speed is positive)`], wrong: [v2, u + 2 * a * s, Math.round(Math.sqrt(u * u + a * s)), u * u + 2 * a * s / 2] }; },
  ];
  let f = null;
  for (let i = 0; i < 20 && !f; i += 1) f = pick(rng, d === 'easy' ? forms.slice(0, 4) : forms)();
  if (!f) throw new Error('');
  const given = Object.entries(f.vals).filter(([k2]) => k2 !== f.ask).map(([k2, v]) => `$${k2} = ${tnum(v)}$`).join(', ').replace(/, ([^,]*)$/, ' and $1');
  return {
    prompt: `$${f.f}$<br>Work out the value of $${f.ask}$ when ${given}.`,
    answer: $(tnum(f.value)),
    distractors: [...f.wrong, f.value + 1, f.value - 1].filter((w) => Number.isInteger(w) && w !== f.value).map((w) => $(tnum(w))),
    typed: { kind: 'number', value: f.value },
    solution: [`Substitute the values you know: $${f.eq}$`, ...f.steps, `Answer: $${f.ask} = ${tnum(f.value)}$`],
  };
}, { title: 'Substitute, then solve for the unknown' });

/* ================================================================== */
/* alg-writing-formulae                                                */
/* ================================================================== */

// Each context: text, the formula (TeX), wrong formulae.
function writeContexts(rng) {
  const [n1] = names(rng, 1);
  const a = pick(rng, [15, 20, 25, 30, 35, 40, 45, 60, 75]); const b = pick(rng, [5, 8, 10, 12, 14, 18].filter((v) => v !== a));
  const f = pick(rng, [3, 4, 5, 6, 8, 10, 12, 15, 20]); const k = pick(rng, [2, 3, 4, 5, 6]);
  return [
    () => ({ text: `Pens cost ${a}p each and pencils cost ${b}p each. Write a formula for the total cost, $C$ pence, of $p$ pens and $q$ pencils.`, why: `$p$ pens cost $${a} \\times p = ${a}p$ pence and $q$ pencils cost $${b}q$ pence. Add them.`, ans: `C = ${a}p + ${b}q`, wrong: [`C = ${a + b}pq`, `C = ${a}q + ${b}p`, `C = ${a + b}(p + q)`, `C = ${a}p \\times ${b}q`] }),
    () => ({ text: `A plumber charges a £${f * 5} call-out fee plus £${a} per hour. Write a formula for the total charge, $C$ pounds, for a job lasting $h$ hours.`, why: `$h$ hours at £${a} per hour cost $${a}h$; then add the fixed fee of £${f * 5} once.`, ans: `C = ${a}h + ${f * 5}`, wrong: [`C = ${f * 5}h + ${a}`, `C = ${a + f * 5}h`, `C = ${a}(h + ${f * 5})`, `C = h + ${a + f * 5}`] }),
    () => ({ text: `Adult tickets cost £${a} and child tickets cost £${b}. Write a formula for the total cost, $T$ pounds, of $x$ adult tickets and $y$ child tickets.`, why: `$x$ adult tickets cost $${a}x$ and $y$ child tickets cost $${b}y$. Add them.`, ans: `T = ${a}x + ${b}y`, wrong: [`T = ${a}y + ${b}x`, `T = ${a + b}xy`, `T = x + y + ${a + b}`, `T = ${a * b}xy`] }),
    () => ({ text: `${n1} has $n$ sweets. ${n1} gives ${k} sweets to each of $f$ friends. Write a formula for the number of sweets left, $S$.`, why: `${k} sweets to each of $f$ friends is $${k}f$ sweets given away, taken from the $n$ ${n1} started with.`, ans: `S = n - ${k}f`, wrong: [`S = ${k}f - n`, `S = n - ${k} - f`, `S = n + ${k}f`, `S = ${k}(n - f)`] }),
    () => ({ text: `A rectangle has length $l$ cm and width $w$ cm. Write a formula for its perimeter, $P$ cm.`, why: 'A rectangle has two lengths and two widths: $l + w + l + w = 2l + 2w$.', ans: `P = 2l + 2w`, wrong: [`P = lw`, `P = l + w`, `P = 2lw`, `P = 4lw`] }),
    () => ({ text: `A taxi charges £${k} plus ${a}p for every mile. Write a formula for the cost, $C$ pence, of a journey of $m$ miles.`, why: `The cost is in pence, so £${k} must be written as ${k * 100}p. $m$ miles at ${a}p cost $${a}m$.`, ans: `C = ${a}m + ${k * 100}`, wrong: [`C = ${a}m + ${k}`, `C = ${k}m + ${a}`, `C = ${a + k}m`, `C = ${k * 100}m + ${a}`] }),
    () => { const note = pick(rng, [10, 20, 50]); return { text: `Cakes cost £${k} each. ${n1} buys $c$ cakes and pays with a £${note} note. Write a formula for the change, $R$ pounds.`, why: `$c$ cakes cost $${k}c$ pounds; the change is what is left from £${note}.`, ans: `R = ${note} - ${k}c`, wrong: [`R = ${k}c - ${note}`, `R = ${note} - c`, `R = ${note - k}c`, `R = ${k}(${note} - c)`] }; },
    () => ({ text: `Chairs are put out in $r$ rows with ${f} chairs in each row, plus ${k} extra chairs at the front. Write a formula for the total number of chairs, $N$.`, why: `$r$ rows of ${f} chairs is $${f}r$ chairs; then add the ${k} extra chairs once.`, ans: `N = ${f}r + ${k}`, wrong: [`N = ${f}(r + ${k})`, `N = r + ${f + k}`, `N = ${k}r + ${f}`, `N = ${f * k}r`] }),
    () => ({ text: `A school trip costs £${a} per student. The coach costs £${f * 50} in total, shared equally by the $s$ students. Write a formula for the cost per student, $C$ pounds.`, why: `Each student pays £${a}, plus an equal share of the £${f * 50} coach, which is $\\frac{${f * 50}}{s}$.`, ans: `C = ${a} + \\frac{${f * 50}}{s}`, wrong: [`C = \\frac{${a} + ${f * 50}}{s}`, `C = ${a}s + ${f * 50}`, `C = ${a} + ${f * 50}s`, `C = \\frac{${a}s}{${f * 50}}`] }),
    () => ({ text: `${n1} is $x$ years old. ${n1}'s brother is ${k} years older. Their mother is three times as old as ${n1}. Write a formula for their total age, $T$ years.`, why: `The ages are $x$, $x + ${k}$ and $3x$. Adding: $x + x + ${k} + 3x = 5x + ${k}$.`, ans: `T = 5x + ${k}`, wrong: [`T = 3x + ${k}`, `T = 4x + ${k}`, `T = 5x + ${3 * k}`, `T = x + ${k + 3}`] }),
    () => ({ text: `Boxes of ${f} eggs cost £$b$ each and single eggs cost £$e$ each. Write a formula for the cost, $C$ pounds, of $n$ boxes and ${k} single eggs.`, why: `$n$ boxes cost $n \\times b = nb$ and ${k} single eggs cost $${k}e$. (The ${f} eggs per box is not needed.)`, ans: `C = nb + ${k}e`, wrong: [`C = ${f}nb + ${k}e`, `C = n + b + ${k}e`, `C = ${f}n + ${k}`, `C = n(b + ${k}e)`] }),
    () => ({ text: `A phone contract costs £$m$ per month plus £${f * 10} for the handset. Write a formula for the total cost, $T$ pounds, over $y$ years.`, why: `$y$ years is $12y$ months, costing $12y \\times m = 12my$; then add the handset once.`, ans: `T = 12my + ${f * 10}`, wrong: [`T = my + ${f * 10}`, `T = 12m + ${f * 10}y`, `T = 12(m + ${f * 10})y`, `T = m + 12y + ${f * 10}`] }),
    () => ({ text: `A garden centre sells trays of ${f} plants for £$t$. Write a formula for the cost, $C$ pounds, of buying $p$ plants (where $p$ is a multiple of ${f}).`, why: `$p$ plants is $\\frac{p}{${f}}$ trays, and each tray costs £$t$, so $C = \\frac{p}{${f}} \\times t$.`, ans: `C = \\frac{pt}{${f}}`, wrong: [`C = ${f}pt`, `C = \\frac{${f}t}{p}`, `C = pt`, `C = \\frac{p}{${f}t}`] }),
    () => ({ text: `Rope is cut into $n$ pieces of length ${f} cm, with ${k} cm left over. Write a formula for the original length of the rope, $L$ cm.`, why: `$n$ pieces of ${f} cm is $${f}n$ cm, plus the ${k} cm left over.`, ans: `L = ${f}n + ${k}`, wrong: [`L = ${f}(n + ${k})`, `L = ${k}n + ${f}`, `L = ${f}n - ${k}`, `L = n + ${f + k}`] }),
  ];
}

export const writeFormula = G('alg-write-formula', 'alg-writing-formulae', (rng, d) => {
  const bank = writeContexts(rng);
  const t = pick(rng, d === 'easy' ? bank.filter((_, i) => [0, 1, 2, 4, 5, 7, 13].includes(i)) : d === 'medium' ? bank.slice(0, 11) : bank)();
  return {
    prompt: `${t.text}`,
    answer: $(t.ans),
    distractors: t.wrong.map($),
    solution: [
      t.why,
      `A formula starts with its subject: "$${t.ans.split(' = ')[0]} = \\ldots$". Check by choosing a number for each letter and working out the answer both from the story and from the formula.`,
      `Answer: $${t.ans}$`,
    ],
  };
}, { title: 'Write a formula from a context', word: true });

// Expressions from contexts.
export const writeExpression = G('alg-write-expression', 'alg-writing-formulae', (rng, d) => {
  const [n1, n2] = names(rng, 2);
  const k = int(rng, 2, 6); const m = int(rng, 2, 9);
  const ctxs = [
    () => ({ text: `${n1} has $x$ marbles. ${n2} has ${m} more marbles than ${n1}. Write an expression for the total number of marbles they have.`, ans: `2x + ${m}`, wrong: [`x + ${m}`, `${m}x`, `2x + ${2 * m}`, `x^{2} + ${m}`] }),
    () => ({ text: `${n1} is $y$ years old. ${n2} is ${k} times as old as ${n1}. Write an expression for ${n2}'s age in ${m} years' time.`, ans: `${k}y + ${m}`, wrong: [`${k}(y + ${m})`, `y + ${k + m}`, `${k}y`, `${m}y + ${k}`] }),
    () => ({ text: `A packet contains $n$ biscuits. ${n1} buys ${k} packets and eats ${m} biscuits. Write an expression for the number of biscuits left.`, ans: `${k}n - ${m}`, wrong: [`${k}(n - ${m})`, `n - ${m}`, `${m} - ${k}n`, `${k}n + ${m}`] }),
    () => ({ text: `A bus has $p$ passengers. At a stop, ${m} people get off and ${m + k} people get on. Write an expression for the number of passengers now.`, ans: `p + ${k}`, wrong: [`p - ${k}`, `p + ${2 * m + k}`, `${k}p`, `p - ${2 * m + k}`] }),
    () => ({ text: `A square has sides of length $(x + ${m})$ cm. Write an expression for its perimeter in cm. Simplify your answer.`, ans: `4x + ${4 * m}`, wrong: [`4x + ${m}`, `x + ${4 * m}`, `(x + ${m})^{2}`, `2x + ${2 * m}`] }),
    () => ({ text: `${n1} thinks of a number $n$. She doubles it and then subtracts ${m}. Write an expression for her answer.`, ans: `2n - ${m}`, wrong: [`2(n - ${m})`, `n^{2} - ${m}`, `${m} - 2n`, `2n + ${m}`] }),
    () => ({ text: `Apples cost $a$ pence each and bananas cost $b$ pence each. Write an expression for the cost, in pence, of ${k} apples and ${m} bananas.`, ans: `${k}a + ${m}b`, wrong: [`${k + m}ab`, `${k}b + ${m}a`, `a + b + ${k + m}`, `${k * m}ab`] }),
    () => ({ text: `The width of a rectangle is $w$ cm. The length is ${k} cm longer than the width. Write an expression for the area in cm².`, ans: `w(w + ${k})`, wrong: [`w + ${k}w`, `2w + ${k}`, `4w + ${2 * k}`, `${k}w^{2}`] }),
    () => ({ text: `${n1} earns £$x$ per hour. She works ${k} hours on Saturday and ${m} hours on Sunday. Write an expression for her total pay in pounds.`, ans: `${k + m}x`, wrong: [`${k}x + ${m}`, `x + ${k + m}`, `${k * m}x`, `${k}x \\times ${m}x`] }),
    () => ({ text: `There are $g$ girls and $b$ boys in a class. Each pupil gets ${k} pencils. Write an expression for the total number of pencils.`, ans: `${k}(g + b)`, wrong: [`${k}g + b`, `g + b + ${k}`, `${k}gb`, `g + ${k}b`] }),
    () => ({ text: `A cake is cut into $s$ equal slices. ${n1} eats ${k} slices. Write an expression for the fraction of the cake that is left.`, ans: `\\frac{s - ${k}}{s}`, wrong: [`s - ${k}`, `\\frac{${k}}{s}`, `\\frac{s}{s - ${k}}`, `\\frac{1}{s - ${k}}`] }),
    () => ({ text: `The angles in a triangle are $x°$, $${k}x°$ and $${m * 10}°$. Write an expression, in terms of $x$, for the sum of the angles.`, ans: `${k + 1}x + ${m * 10}`, wrong: [`${k}x + ${m * 10}`, `${k + 1}x + ${m * 10 + 180}`, `${k}x^{2} + ${m * 10}`, `x + ${k + m * 10}`] }),
    () => ({ text: `${n1} has £$m$. ${n2} has £${k} less than twice as much as ${n1}. Write an expression for the amount ${n2} has, in pounds.`, ans: `2m - ${k}`, wrong: [`2(m - ${k})`, `${k} - 2m`, `m - ${2 * k}`, `2m + ${k}`] }),
  ];
  const t = pick(rng, ctxs)();
  return {
    prompt: t.text,
    answer: $(t.ans),
    distractors: t.wrong.map($),
    solution: [`Build the expression step by step, following the words.`, `Check with a number: if the letter were 10, does the expression give the right amount?`, `Answer: $${t.ans}$`],
  };
}, { title: 'Write an expression from a context', word: true });

export const writeFormulaShape = G('alg-write-formula-shape', 'alg-writing-formulae', (rng, d) => {
  const s = pick(rng, size(d, ['rect', 'isos', 'hexagon', 'rectNum'], ['isos', 'house', 'hexagon', 'triArea', 'rectNum', 'pentagonNum'], ['house', 'lshape', 'triArea', 'pentagonNum']));
  const [a, b] = pick(rng, [['a', 'b'], ['x', 'y'], ['p', 'q'], ['m', 'n'], ['s', 't'], ['c', 'd'], ['e', 'f'], ['g', 'h']]);
  const k = int(rng, 2, 9);
  const it = (x0, y0, str) => text(x0, y0, str, { italic: true });
  let body; let ans; let wrong; let what = 'perimeter, $P$';
  let count = `Count each length: $${'{SUM}'}$.`;
  if (s === 'rect') {
    body = polygon([[70, 50], [290, 50], [290, 160], [70, 160]]) + it(180, 34, a) + it(306, 105, b);
    ans = `P = 2${a} + 2${b}`; wrong = [`P = ${a}${b}`, `P = ${a} + ${b}`, `P = 2${a}${b}`, `P = 4${a}${b}`];
    count = `Two sides of $${a}$ and two of $${b}$: $${a} + ${b} + ${a} + ${b} = 2${a} + 2${b}$.`;
  } else if (s === 'rectNum') {
    body = polygon([[70, 50], [290, 50], [290, 160], [70, 160]]) + it(180, 34, a) + text(306, 105, `${k}`);
    ans = `P = 2${a} + ${2 * k}`; wrong = [`P = ${k}${a}`, `P = ${a} + ${k}`, `P = 2${a} + ${k}`, `P = ${2 * k}${a}`];
    count = `Two sides of $${a}$ and two of ${k}: $${a} + ${k} + ${a} + ${k} = 2${a} + ${2 * k}$.`;
  } else if (s === 'isos') {
    const pts = [[80, 170], [280, 170], [180, 30]];
    body = polygon(pts) + equalTicks(pts[1], pts[2]) + equalTicks(pts[2], pts[0]) + it(180, 192, b) + it(250, 92, a);
    ans = `P = 2${a} + ${b}`; wrong = [`P = ${a} + ${b}`, `P = 2${b} + ${a}`, `P = 2${a}${b}`, `P = ${a}^{2}${b}`];
    count = `The two marked sides are equal, so there are two lots of $${a}$: $${a} + ${a} + ${b} = 2${a} + ${b}$.`;
  } else if (s === 'house') {
    // Base and both roof edges are equal (single ticks, an equilateral roof); both walls are equal (double ticks).
    const pts = [[110, 195], [250, 195], [250, 140], [180, 19], [110, 140]];
    body = polygon(pts) + equalTicks(pts[0], pts[1]) + equalTicks(pts[2], pts[3]) + equalTicks(pts[3], pts[4])
      + equalTicks(pts[1], pts[2], 2) + equalTicks(pts[4], pts[0], 2) + it(180, 214, a) + it(268, 168, b);
    ans = `P = 3${a} + 2${b}`; wrong = [`P = 2${a} + 2${b}`, `P = 4${a} + 2${b}`, `P = 3${a} + ${b}`, `P = 2${a} + 3${b}`];
    count = `The single marks show the base and both roof edges are $${a}$; the double marks show both walls are $${b}$: $3${a} + 2${b}$.`;
  } else if (s === 'hexagon' || s === 'pentagonNum') {
    const n = s === 'hexagon' ? 6 : 5;
    const pts = Array.from({ length: n }, (_, i) => [180 + 80 * Math.cos((2 * Math.PI / n) * i + (n === 5 ? Math.PI / 2 : 0)), 110 - 80 * Math.sin((2 * Math.PI / n) * i + (n === 5 ? Math.PI / 2 : 0))]);
    const side = s === 'hexagon' ? a : `${a} + ${k}`;
    body = polygon(pts) + pts.map((p, i) => equalTicks(p, pts[(i + 1) % n])).join('') + it(180, 206, side);
    what = `perimeter, $P$, of this regular ${n === 6 ? 'hexagon' : 'pentagon'}`;
    if (n === 6) { ans = `P = 6${a}`; wrong = [`P = ${a}^{6}`, `P = 6 + ${a}`, `P = 5${a}`, `P = 8${a}`]; count = `Six equal sides: $6 \\times ${a} = 6${a}$.`; }
    else { ans = `P = 5${a} + ${5 * k}`; wrong = [`P = 5${a} + ${k}`, `P = ${a} + ${5 * k}`, `P = 5(${a} + ${k})^{2}`, `P = ${5 * k}${a}`]; count = `Five equal sides: $5(${a} + ${k}) = 5${a} + ${5 * k}$.`; }
  } else if (s === 'lshape') {
    const pts = [[60, 30], [160, 30], [160, 110], [300, 110], [300, 190], [60, 190]];
    body = polygon(pts) + it(110, 16, a) + it(40, 110, b) + it(180, 206, `2${a}`) + it(316, 150, a);
    ans = `P = 4${a} + 2${b}`; wrong = [`P = 2${a} + 2${b}`, `P = 3${a} + ${b}`, `P = 4${a} + ${b}`, `P = 5${a} + 2${b}`];
    count = `The unlabelled sides are $2${a} - ${a} = ${a}$ (horizontal) and $${b} - ${a}$ (vertical). Adding all six: $${a} + (${b} - ${a}) + ${a} + ${a} + 2${a} + ${b} = 4${a} + 2${b}$.`;
  } else {
    body = polygon([[60, 180], [300, 180], [200, 40]]) + `<line x1="200" y1="40" x2="200" y2="180" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 4"/>` + it(180, 200, a) + it(214, 110, b);
    what = 'area, $A$';
    ans = `A = \\frac{${a}${b}}{2}`; wrong = [`A = ${a}${b}`, `A = 2${a}${b}`, `A = ${a} + ${b}`, `A = \\frac{${a} + ${b}}{2}`];
    count = `Area of a triangle = $\\frac{1}{2}$ × base × perpendicular height $= \\frac{1}{2} \\times ${a} \\times ${b}$.`;
  }
  return {
    prompt: `The lengths on this shape are in centimetres.<br>Which is the correct formula for the ${what}?`,
    visual: svg(360, 220, body + notDrawnAccurately(355, 214, { anchor: 'end' })),
    answer: $(ans),
    distractors: wrong.map($),
    count: 5,
    solution: [
      s === 'triArea' ? 'Area of a triangle = half of base × perpendicular height.' : 'The perimeter is the total of all the sides — including sides that are not labelled but are marked equal to labelled ones.',
      count,
      `Answer: $${ans}$`,
    ],
  };
}, { title: 'Write a formula for a shape' });

/* ================================================================== */
/* alg-vocabulary                                                      */
/* ================================================================== */

function vocabItems(rng) {
  const a = int(rng, 2, 9); const b = int(rng, 2, 12); const c = int(rng, 15, 40);
  const [u, v] = pick(rng, [['x', 'y'], ['a', 'b'], ['p', 'q'], ['m', 'n']]);
  return {
    Expression: [`${a}${u} + ${b}`, `${u}^{2} - ${a}${v}`, `${a}(${u} + ${b})`, `\\frac{${u}}{${a}} + ${v}`],
    Equation: [`${a}${u} + ${b} = ${a * 3 + b}`, `${u}^{2} = ${a * a}`, `${a}(${u} - ${b}) = ${c}`, `\\frac{${u}}{${a}} = ${b}`],
    Formula: ['v = u + at', 'A = \\pi r^{2}', 'P = 2l + 2w', 'F = ma', 'C = 2\\pi r', 's = \\frac{d}{t}', 'V = lwh'],
    Identity: [`${a}(${u} + ${b}) \\equiv ${a}${u} + ${a * b}`, `${u} + ${u} + ${u} \\equiv 3${u}`, `${u}^{2} - ${v}^{2} \\equiv (${u} + ${v})(${u} - ${v})`, `${u}(${u} + ${b}) \\equiv ${u}^{2} + ${b}${u}`, `${a}${u} - ${u} \\equiv ${a - 1}${u}`.replace(/ 1(\w)$/, ' $1')],
    Inequality: [`${a}${u} + ${b} \\gt ${c}`, `${u} \\leq ${b}`, `${a}${u} \\lt ${c}`],
  };
}

export const vocabClassify = G('alg-vocab-classify', 'alg-vocabulary', (rng, d) => {
  const items = vocabItems(rng);
  const kinds = d === 'easy' ? ['Expression', 'Equation', 'Formula'] : ['Expression', 'Equation', 'Formula', 'Identity', ...(d === 'hard' ? ['Inequality'] : [])];
  const kind = pick(rng, kinds);
  const item = pick(rng, items[kind]);
  const why = {
    Expression: 'It has no equals sign, so it is an <b>expression</b> — a collection of terms.',
    Equation: 'It has an equals sign and is only true for particular value(s) of the letter, which you can solve for: an <b>equation</b>.',
    Formula: 'It links two or more quantities, with a subject, so you can substitute values in: a <b>formula</b>.',
    Identity: 'It is true for <b>every</b> value of the letters (the two sides are the same expression), shown by $\\equiv$: an <b>identity</b>.',
    Inequality: 'It uses $\\lt$, $\\gt$, $\\leq$ or $\\geq$ instead of $=$: an <b>inequality</b>.',
  }[kind];
  const say = (k) => `$${item}$ is ${/^[AEIOU]/.test(k) ? 'an' : 'a'} ${k.toLowerCase()}`;
  return {
    prompt: `Is &nbsp;$${item}$&nbsp; ${{ easy: 'an expression, an equation or a formula', medium: 'an expression, an equation, a formula or an identity', hard: 'an expression, an equation, a formula, an identity or an inequality' }[d]}?`,
    answer: say(kind),
    distractors: ['Expression', 'Equation', 'Formula', 'Identity', 'Inequality'].filter((k) => k !== kind && (d !== 'easy' || ['Expression', 'Equation', 'Formula'].includes(k))).map(say),
    count: d === 'easy' ? 3 : d === 'medium' ? 4 : 5,
    solution: [why, `Answer: ${say(kind)}.`],
  };
}, { title: 'Expression, equation, formula or identity?' });

export const vocabWhich = G('alg-vocab-which', 'alg-vocabulary', (rng, d) => {
  const items = vocabItems(rng);
  const kinds = ['Expression', 'Equation', 'Formula', 'Identity'];
  const kind = pick(rng, d === 'easy' ? ['Expression', 'Equation', 'Formula'] : kinds);
  const ans = pick(rng, items[kind]);
  let others = shuffle(rng, kinds.filter((k) => k !== kind).map((k) => pick(rng, items[k])));
  // Include a tempting wrong one: a false "identity", or an identity written with = for equation questions.
  const a = int(rng, 2, 6);
  if (kind === 'Identity') others = [pick(rng, [`${a}x \\equiv ${a * 3}`, `x^{2} + x \\equiv x^{3}`, `${a}(x + 2) \\equiv ${a}x + 2`]), ...others];
  if (kind === 'Equation' && d !== 'easy') others = [`${a}(x + 1) = ${a}x + ${a}`, ...others];
  others = others.slice(0, 3);
  const shown = shuffle(rng, [ans, ...others]);
  return {
    prompt: `Here are four statements:<br>${shown.map((t) => `$${t}$`).join(' &nbsp;&nbsp;&nbsp; ')}<br>Which one is ${kind === 'Expression' ? 'an expression' : kind === 'Identity' ? 'a correct identity' : kind === 'Equation' ? 'an equation' : 'a formula'}?`,
    answer: $(ans),
    distractors: others.map($),
    count: 4,
    solution: [
      {
        Expression: 'An expression has no equals sign.',
        Equation: 'An equation has an equals sign and is true only for particular values (you can solve it). Something like $' + `${a}(x + 1) = ${a}x + ${a}` + '$ is true for every $x$, so it is really an identity.',
        Formula: 'A formula connects different quantities, such as a subject and the letters it depends on.',
        Identity: 'An identity is true for every value of the letters. Check by expanding or simplifying one side to get the other.',
      }[kind],
      `Answer: $${ans}$`,
    ],
  };
}, { title: 'Pick out an expression, equation, formula or identity' });

export const identityCoefficients = G('alg-identity-coefficients', 'alg-vocabulary', (rng, d) => {
  const form = pick(rng, size(d, ['simple', 'expand'], ['expand', 'simple', 'square'], ['square', 'productA', 'expand']));
  let tex; let A; let B; let steps; let wrongs;
  if (form === 'simple') {
    // (a − p)x² + q b ≡ r x² + s
    const p = int(rng, 1, 6); const q = int(rng, 2, 4); const a = int(rng, 1, 9) + p; const b = int(rng, 1, 9);
    tex = `(a - ${p})x^{2} + ${q}b \\equiv ${terms([[a - p, 'x^{2}']])} + ${q * b}`;
    A = a; B = b; steps = [`Compare the $x^{2}$ terms: $a - ${p} = ${a - p}$, so $a = ${a}$.`, `Compare the numbers: $${q}b = ${q * b}$, so $b = ${b}$.`];
    wrongs = [[a - 2 * p, b], [a, q * b], [a - p, b], [a, b * q - q]];
  } else if (form === 'expand') {
    // k(ax + m) − n(x − b) ≡ Px + Q
    const k = int(rng, 2, 5); const a = int(rng, 1, 6); const m = int(rng, 1, 6); const n = int(rng, 2, 4); const b = int(rng, 1, 7);
    const Pc = k * a - n; const Q = k * m + n * b;
    if (Pc <= 0) throw new Error('');
    tex = `${k}(ax + ${m}) - ${n}(x - b) \\equiv ${P([Pc, Q])}`;
    A = a; B = b; steps = [`Expand the left: $${k}ax + ${k * m} - ${n}x + ${n}b$`, `Compare the $x$ terms: $${k}a - ${n} = ${Pc}$, so $a = ${a}$.`, `Compare the numbers: $${k * m} + ${n}b = ${Q}$, so $b = ${b}$.`];
    wrongs = [[(Pc - n) / k, b], [a, (Q + k * m) / n], [(Pc + n) / k, (Q - k * m) / -n], [a, Q - k * m]];
  } else if (form === 'square') {
    // (x + a)² + b ≡ x² + Px + Q
    const a = intExcept(rng, -7, 7, [0]); const b = intExcept(rng, -12, 12, [0]);
    tex = `(x + a)^{2} + b \\equiv ${P([1, 2 * a, a * a + b])}`;
    A = a; B = b; steps = [`Expand: $x^{2} + 2ax + a^{2} + b$`, `Compare the $x$ terms: $2a = ${2 * a}$, so $a = ${a}$.`, `Compare the numbers: $${a * a} + b = ${a * a + b}$, so $b = ${b}$.`];
    wrongs = [[2 * a, b], [a, a * a + b], [-a, b], [a, b - a * a]];
  } else {
    // (x + a)(x + 3a) ≡ x² + bx + 75 style: (x + a)(x + k a) ≡ x² + B x + C ; positive a only asked
    const kk = pick(rng, [2, 3, 4]); const a = int(rng, 2, 5);
    tex = `(x + a)(x + ${kk}a) \\equiv x^{2} + bx + ${kk * a * a}`;
    A = a; B = (kk + 1) * a; steps = [`Expand: $x^{2} + ${kk + 1}ax + ${kk}a^{2}$`, `Compare the numbers: $${kk}a^{2} = ${kk * a * a}$, so $a^{2} = ${a * a}$ and $a = ${a}$ (taking the positive value).`, `Compare the $x$ terms: $b = ${kk + 1}a = ${B}$.`];
    wrongs = [[a * a, B], [a, kk * a], [-a, B], [a, (kk + 1) * a * a]];
  }
  const fmt = ([x, y]) => `$a = ${tnum(x)}, \\ b = ${tnum(y)}$`;
  const ans = fmt([A, B]);
  return {
    prompt: `$${tex}$${form === 'productA' ? '<br>$a$ is a positive integer.' : ''}<br>Work out the values of $a$ and $b$.`,
    answer: ans,
    distractors: wrongs.filter(([x, y]) => Number.isInteger(x) && Number.isInteger(y)).map(fmt).concat([fmt([A + 1, B]), fmt([A, B + 1]), fmt([B, A])]).filter((t) => t !== ans),
    solution: [`In an identity, the coefficients of each power of $x$ must match on both sides.`, ...steps, `Answer: ${ans}`],
  };
}, { title: 'Find unknowns in an identity' });

/* ================================================================== */
/* alg-rearrange-simple                                                */
/* ================================================================== */

export const rearrangeLinear = G('alg-rearrange-linear', 'alg-rearrange-simple', (rng, d) => {
  const [y, x] = pick(rng, [['y', 'x'], ['p', 'q'], ['t', 'n'], ['A', 'r'], ['w', 'k']]);
  const a = int(rng, 2, 9); const b = int(rng, 2, 15);
  const form = pick(rng, size(d, ['ax+b', 'x+b', 'ax-b'], ['ax+b', 'ax-b', 'b-ax'], ['b-ax', 'ax+b', 'ax-b']));
  let eq; let ans; let wrong; let steps;
  if (form === 'x+b') { eq = `${y} = ${x} + ${b}`; ans = `${x} = ${y} - ${b}`; wrong = [`${x} = ${y} + ${b}`, `${x} = ${b} - ${y}`, `${x} = ${b}${y}`, `${x} = \\frac{${y}}{${b}}`]; steps = [`Subtract ${b} from both sides.`]; }
  else if (form === 'ax+b') { eq = `${y} = ${a}${x} + ${b}`; ans = `${x} = \\frac{${y} - ${b}}{${a}}`; wrong = [`${x} = \\frac{${y} + ${b}}{${a}}`, `${x} = \\frac{${y}}{${a}} - ${b}`, `${x} = ${a}(${y} - ${b})`, `${x} = \\frac{${a}}{${y} - ${b}}`, `${x} = ${y} - ${b} - ${a}`]; steps = [`Subtract ${b} from both sides: $${y} - ${b} = ${a}${x}$`, `Divide both sides by ${a}.`]; }
  else if (form === 'ax-b') { eq = `${y} = ${a}${x} - ${b}`; ans = `${x} = \\frac{${y} + ${b}}{${a}}`; wrong = [`${x} = \\frac{${y} - ${b}}{${a}}`, `${x} = \\frac{${y}}{${a}} + ${b}`, `${x} = ${a}(${y} + ${b})`, `${x} = \\frac{${a}}{${y} + ${b}}`]; steps = [`Add ${b} to both sides: $${y} + ${b} = ${a}${x}$`, `Divide both sides by ${a}.`]; }
  else { eq = `${y} = ${b} - ${a}${x}`; ans = `${x} = \\frac{${b} - ${y}}{${a}}`; wrong = [`${x} = \\frac{${y} - ${b}}{${a}}`, `${x} = \\frac{${b} + ${y}}{${a}}`, `${x} = \\frac{${y}}{${a}} - ${b}`, `${x} = ${a}(${b} - ${y})`]; steps = [`Add $${a}${x}$ to both sides: $${y} + ${a}${x} = ${b}$`, `Subtract $${y}$: $${a}${x} = ${b} - ${y}$`, `Divide both sides by ${a}.`]; }
  return {
    prompt: `Make $${x}$ the subject of &nbsp; $${eq}$`,
    answer: $(ans),
    distractors: wrong.map($),
    hint: `Undo the operations on $${x}$ in reverse order, doing the same to both sides.`,
    solution: [...steps, `Answer: $${ans}$`],
  };
}, { title: 'Make x the subject of y = ax + b' });

const SIMPLE_FORMULAE = [
  { f: 'v = u + at', s: 't', ans: 't = \\frac{v - u}{a}', wrong: ['t = \\frac{v + u}{a}', 't = \\frac{v}{a} - u', 't = a(v - u)', 't = v - u - a'], steps: ['Subtract $u$: $v - u = at$', 'Divide by $a$.'] },
  { f: 'v = u + at', s: 'u', ans: 'u = v - at', wrong: ['u = v + at', 'u = at - v', 'u = \\frac{v}{at}', 'u = v - a - t'], steps: ['Subtract $at$ from both sides.'] },
  { f: 'v = u + at', s: 'a', ans: 'a = \\frac{v - u}{t}', wrong: ['a = \\frac{v + u}{t}', 'a = \\frac{v}{t} - u', 'a = t(v - u)', 'a = \\frac{t}{v - u}'], steps: ['Subtract $u$: $v - u = at$', 'Divide by $t$.'] },
  { f: 'P = 2l + 2w', s: 'w', ans: 'w = \\frac{P - 2l}{2}', wrong: ['w = \\frac{P + 2l}{2}', 'w = P - 2l - 2', 'w = \\frac{P}{2} - 2l', 'w = 2(P - 2l)'], steps: ['Subtract $2l$: $P - 2l = 2w$', 'Divide by 2.'] },
  { f: 'A = \\frac{1}{2}bh', s: 'h', ans: 'h = \\frac{2A}{b}', wrong: ['h = \\frac{A}{2b}', 'h = \\frac{A}{b}', 'h = 2Ab', 'h = \\frac{b}{2A}'], steps: ['Multiply by 2: $2A = bh$', 'Divide by $b$.'] },
  { f: 'C = \\pi d', s: 'd', ans: 'd = \\frac{C}{\\pi}', wrong: ['d = C\\pi', 'd = \\frac{\\pi}{C}', 'd = C - \\pi', 'd = \\frac{C}{2\\pi}'], steps: ['Divide both sides by $\\pi$.'] },
  { f: 'V = lwh', s: 'h', ans: 'h = \\frac{V}{lw}', wrong: ['h = Vlw', 'h = \\frac{lw}{V}', 'h = V - lw', 'h = \\frac{V}{l} - w'], steps: ['Divide both sides by $lw$.'] },
  { f: 'F = ma', s: 'a', ans: 'a = \\frac{F}{m}', wrong: ['a = Fm', 'a = \\frac{m}{F}', 'a = F - m', 'a = F + m'], steps: ['Divide both sides by $m$.'] },
  { f: 'y = mx + c', s: 'm', ans: 'm = \\frac{y - c}{x}', wrong: ['m = \\frac{y + c}{x}', 'm = \\frac{y}{x} - c', 'm = x(y - c)', 'm = y - c - x'], steps: ['Subtract $c$: $y - c = mx$', 'Divide by $x$.'] },
  { f: 's = \\frac{d}{t}', s: 'd', ans: 'd = st', wrong: ['d = \\frac{s}{t}', 'd = \\frac{t}{s}', 'd = s + t', 'd = s - t'], steps: ['Multiply both sides by $t$.'] },
  { f: 's = \\frac{d}{t}', s: 't', ans: 't = \\frac{d}{s}', wrong: ['t = ds', 't = \\frac{s}{d}', 't = d - s', 't = s + d'], steps: ['Multiply by $t$: $st = d$', 'Divide by $s$.'] },
  { f: 'P = 4s + 3', s: 's', ans: 's = \\frac{P - 3}{4}', wrong: ['s = \\frac{P + 3}{4}', 's = \\frac{P}{4} - 3', 's = 4(P - 3)', 's = P - 7'], steps: ['Subtract 3: $P - 3 = 4s$', 'Divide by 4.'] },
  { f: 'C = 20 + 15h', s: 'h', ans: 'h = \\frac{C - 20}{15}', wrong: ['h = \\frac{C + 20}{15}', 'h = \\frac{C}{15} - 20', 'h = 15(C - 20)', 'h = C - 35'], steps: ['Subtract 20: $C - 20 = 15h$', 'Divide by 15.'] },
  { f: 'F = \\frac{9C}{5} + 32', s: 'C', ans: 'C = \\frac{5(F - 32)}{9}', wrong: ['C = \\frac{9(F - 32)}{5}', 'C = \\frac{5F}{9} - 32', 'C = \\frac{5(F + 32)}{9}', 'C = 5F - 32 \\div 9'], steps: ['Subtract 32: $F - 32 = \\frac{9C}{5}$', 'Multiply by 5: $5(F - 32) = 9C$', 'Divide by 9.'] },
];

// Formulae with random letters/numbers, so the same structure appears with fresh values.
const PARAM_SIMPLE = [
  (rng) => { const [C, h] = pick(rng, [['C', 'h'], ['T', 'n'], ['W', 't'], ['P', 'm'], ['L', 'd']]); const c = int(rng, 3, 40); const k = int(rng, 2, 20); return { f: `${C} = ${c} + ${k}${h}`, s: h, ans: `${h} = \\frac{${C} - ${c}}{${k}}`, wrong: [`${h} = \\frac{${C} + ${c}}{${k}}`, `${h} = \\frac{${C}}{${k}} - ${c}`, `${h} = ${k}(${C} - ${c})`, `${h} = ${C} - ${c + k}`], steps: [`Subtract ${c}: $${C} - ${c} = ${k}${h}$`, `Divide by ${k}.`] }; },
  (rng) => { const [P, q] = pick(rng, [['P', 'q'], ['y', 'x'], ['N', 'r'], ['H', 't']]); const c = int(rng, 2, 25); const k = int(rng, 2, 9); return { f: `${P} = ${k}${q} - ${c}`, s: q, ans: `${q} = \\frac{${P} + ${c}}{${k}}`, wrong: [`${q} = \\frac{${P} - ${c}}{${k}}`, `${q} = \\frac{${P}}{${k}} + ${c}`, `${q} = ${k}(${P} + ${c})`, `${q} = \\frac{${k}}{${P} + ${c}}`], steps: [`Add ${c}: $${P} + ${c} = ${k}${q}$`, `Divide by ${k}.`] }; },
  (rng) => { const [y, x] = pick(rng, [['y', 'x'], ['A', 'b'], ['M', 'k']]); const c = int(rng, 2, 12); const k = int(rng, 2, 9); return { f: `${y} = ${k}(${x} + ${c})`, s: x, ans: `${x} = \\frac{${y}}{${k}} - ${c}`, wrong: [`${x} = \\frac{${y} - ${c}}{${k}}`, `${x} = \\frac{${y}}{${k}} + ${c}`, `${x} = ${k}${y} - ${c}`, `${x} = \\frac{${y}}{${k} + ${c}}`], steps: [`Divide by ${k}: $\\frac{${y}}{${k}} = ${x} + ${c}$`, `Subtract ${c}.`] }; },
  () => ({ f: 'S = 180(n - 2)', s: 'n', ans: 'n = \\frac{S}{180} + 2', wrong: ['n = \\frac{S - 2}{180}', 'n = \\frac{S}{180} - 2', 'n = 180S + 2', 'n = \\frac{S + 2}{180}'], steps: ['Divide by 180: $\\frac{S}{180} = n - 2$', 'Add 2.'] }),
  () => ({ f: 'A = \\frac{(a + b)h}{2}', s: 'h', ans: 'h = \\frac{2A}{a + b}', wrong: ['h = \\frac{A}{2(a + b)}', 'h = \\frac{2A}{a} + b', 'h = 2A - (a + b)', 'h = \\frac{2A}{ab}'], steps: ['Multiply by 2: $2A = (a + b)h$', 'Divide by $(a + b)$.'] }),
  () => ({ f: 'v^{2} = u^{2} + 2as', s: 's', ans: 's = \\frac{v^{2} - u^{2}}{2a}', wrong: ['s = \\frac{v^{2} + u^{2}}{2a}', 's = \\frac{(v - u)^{2}}{2a}', 's = \\frac{v^{2} - u^{2}}{2} - a', 's = 2a(v^{2} - u^{2})'], steps: ['Subtract $u^{2}$: $v^{2} - u^{2} = 2as$', 'Divide by $2a$.'] }),
  () => ({ f: 'D = ST', s: 'T', ans: 'T = \\frac{D}{S}', wrong: ['T = DS', 'T = \\frac{S}{D}', 'T = D - S', 'T = D + S'], steps: ['Divide both sides by $S$.'] }),
];

export const rearrangeFormula = G('alg-rearrange-formula', 'alg-rearrange-simple', (rng, d) => {
  const fixed = d === 'easy' ? SIMPLE_FORMULAE.filter((f) => f.steps.length === 1) : d === 'medium' ? SIMPLE_FORMULAE.slice(0, 12) : SIMPLE_FORMULAE.filter((f) => f.steps.length >= 2);
  const params = d === 'easy' ? [PARAM_SIMPLE[6]] : PARAM_SIMPLE;
  const f = chance(rng, 0.45) ? pick(rng, params)(rng) : pick(rng, fixed);
  return {
    prompt: `Make $${f.s}$ the subject of the formula &nbsp; $${f.f}$`,
    answer: $(f.ans),
    distractors: f.wrong.map($),
    solution: [...f.steps, `Answer: $${f.ans}$`],
  };
}, { title: 'Change the subject of a familiar formula' });

export const rearrangeFraction = G('alg-rearrange-fraction', 'alg-rearrange-simple', (rng, d) => {
  const [y, x] = pick(rng, [['y', 'x'], ['p', 'q'], ['m', 'n'], ['w', 'k']]);
  const a = int(rng, 2, 9); const b = int(rng, 1, 12);
  const form = pick(rng, size(d, ['x/a', 'x/a+b'], ['(x+b)/a', 'x/a-b', 'a(x-b)'], ['(ax+b)/c', 'a(x-b)', '(x+b)/a']));
  let eq; let ans; let wrong; let steps;
  if (form === 'x/a') { eq = `${y} = \\frac{${x}}{${a}}`; ans = `${x} = ${a}${y}`; wrong = [`${x} = \\frac{${y}}{${a}}`, `${x} = \\frac{${a}}{${y}}`, `${x} = ${y} + ${a}`, `${x} = ${y} - ${a}`]; steps = [`Multiply both sides by ${a}.`]; }
  else if (form === 'x/a+b') { eq = `${y} = \\frac{${x}}{${a}} + ${b}`; ans = `${x} = ${a}(${y} - ${b})`; wrong = [`${x} = ${a}${y} - ${b}`, `${x} = ${a}(${y} + ${b})`, `${x} = \\frac{${y} - ${b}}{${a}}`, `${x} = ${a}${y} + ${b}`]; steps = [`Subtract ${b}: $${y} - ${b} = \\frac{${x}}{${a}}$`, `Multiply by ${a} (the whole of $${y} - ${b}$).`]; }
  else if (form === 'x/a-b') { eq = `${y} = \\frac{${x}}{${a}} - ${b}`; ans = `${x} = ${a}(${y} + ${b})`; wrong = [`${x} = ${a}${y} + ${b}`, `${x} = ${a}(${y} - ${b})`, `${x} = \\frac{${y} + ${b}}{${a}}`, `${x} = ${a}${y} - ${b}`]; steps = [`Add ${b}: $${y} + ${b} = \\frac{${x}}{${a}}$`, `Multiply by ${a}.`]; }
  else if (form === '(x+b)/a') { eq = `${y} = \\frac{${x} + ${b}}{${a}}`; ans = `${x} = ${a}${y} - ${b}`; wrong = [`${x} = ${a}(${y} - ${b})`, `${x} = \\frac{${y}}{${a}} - ${b}`, `${x} = ${a}${y} + ${b}`, `${x} = \\frac{${y} - ${b}}{${a}}`]; steps = [`Multiply by ${a}: $${a}${y} = ${x} + ${b}$`, `Subtract ${b}.`]; }
  else if (form === 'a(x-b)') { eq = `${y} = ${a}(${x} - ${b})`; ans = `${x} = \\frac{${y}}{${a}} + ${b}`; wrong = [`${x} = \\frac{${y} + ${b}}{${a}}`, `${x} = \\frac{${y}}{${a}} - ${b}`, `${x} = ${a}${y} + ${b}`, `${x} = \\frac{${y} - ${b}}{${a}}`]; steps = [`Divide by ${a}: $\\frac{${y}}{${a}} = ${x} - ${b}$`, `Add ${b}. (Or expand first: $${x} = \\frac{${y} + ${a * b}}{${a}}$, which is the same.)`]; }
  else { const c = intExcept(rng, 2, 7, [a]); eq = `${y} = \\frac{${a}${x} + ${b}}{${c}}`; ans = `${x} = \\frac{${c}${y} - ${b}}{${a}}`; wrong = [`${x} = \\frac{${c}${y} + ${b}}{${a}}`, `${x} = \\frac{${a}${y} - ${b}}{${c}}`, `${x} = ${c}${y} - \\frac{${b}}{${a}}`, `${x} = \\frac{${c}(${y} - ${b})}{${a}}`]; steps = [`Multiply by ${c}: $${c}${y} = ${a}${x} + ${b}$`, `Subtract ${b}: $${c}${y} - ${b} = ${a}${x}$`, `Divide by ${a}.`]; }
  return {
    prompt: `Make $${x}$ the subject of &nbsp; $${eq}$`,
    answer: $(ans),
    distractors: wrong.map($),
    solution: [...steps, `Answer: $${ans}$`],
  };
}, { title: 'Change the subject with fractions and brackets' });

/* ================================================================== */
/* alg-rearrange-hard                                                  */
/* ================================================================== */

const POWER_FORMULAE = [
  { f: 'A = \\pi r^{2}', s: 'r', ans: 'r = \\sqrt{\\frac{A}{\\pi}}', wrong: ['r = \\frac{\\sqrt{A}}{\\pi^{2}}', 'r = \\frac{A}{2\\pi}', 'r = \\sqrt{A\\pi}', 'r = \\left(\\frac{A}{\\pi}\\right)^{2}'], steps: ['Divide by $\\pi$: $r^{2} = \\frac{A}{\\pi}$', 'Square root both sides.'] },
  { f: 'E = \\frac{1}{2}mv^{2}', s: 'v', ans: 'v = \\sqrt{\\frac{2E}{m}}', wrong: ['v = \\frac{2E}{m}', 'v = \\sqrt{\\frac{E}{2m}}', 'v = \\sqrt{2Em}', 'v = \\left(\\frac{2E}{m}\\right)^{2}'], steps: ['Multiply by 2: $2E = mv^{2}$', 'Divide by $m$: $v^{2} = \\frac{2E}{m}$', 'Square root both sides.'] },
  { f: 'V = \\frac{1}{3}\\pi r^{2}h', s: 'r', ans: 'r = \\sqrt{\\frac{3V}{\\pi h}}', wrong: ['r = \\sqrt{\\frac{V}{3\\pi h}}', 'r = \\frac{3V}{\\pi h}', 'r = \\sqrt{3V\\pi h}', 'r = \\sqrt{\\frac{3V}{\\pi}} - h'], steps: ['Multiply by 3: $3V = \\pi r^{2}h$', 'Divide by $\\pi h$: $r^{2} = \\frac{3V}{\\pi h}$', 'Square root both sides.'] },
  { f: 'T = 2\\pi\\sqrt{\\frac{l}{g}}', s: 'l', ans: 'l = \\frac{gT^{2}}{4\\pi^{2}}', wrong: ['l = \\frac{gT}{2\\pi}', 'l = \\frac{T^{2}}{4\\pi^{2}g}', 'l = g\\left(\\frac{T}{2\\pi}\\right)', 'l = \\frac{gT^{2}}{2\\pi}'], steps: ['Divide by $2\\pi$: $\\frac{T}{2\\pi} = \\sqrt{\\frac{l}{g}}$', 'Square both sides: $\\frac{T^{2}}{4\\pi^{2}} = \\frac{l}{g}$', 'Multiply by $g$.'] },
  { f: 'y = \\sqrt{x + a}', s: 'x', ans: 'x = y^{2} - a', wrong: ['x = \\sqrt{y} - a', 'x = (y - a)^{2}', 'x = y^{2} + a', 'x = \\sqrt{y - a}'], steps: ['Square both sides: $y^{2} = x + a$', 'Subtract $a$.'] },
  { f: 'y = ax^{2} - b', s: 'x', ans: 'x = \\sqrt{\\frac{y + b}{a}}', wrong: ['x = \\sqrt{\\frac{y - b}{a}}', 'x = \\frac{\\sqrt{y + b}}{a^{2}}', 'x = \\frac{y + b}{2a}', 'x = \\sqrt{\\frac{y}{a}} + b'], steps: ['Add $b$: $y + b = ax^{2}$', 'Divide by $a$: $x^{2} = \\frac{y + b}{a}$', 'Square root (taking $x$ positive).'] },
  { f: 'A = 4\\pi r^{2}', s: 'r', ans: 'r = \\sqrt{\\frac{A}{4\\pi}}', wrong: ['r = \\frac{\\sqrt{A}}{4\\pi}', 'r = \\frac{A}{8\\pi}', 'r = 2\\sqrt{A\\pi}', 'r = \\sqrt{\\frac{4A}{\\pi}}'], steps: ['Divide by $4\\pi$: $r^{2} = \\frac{A}{4\\pi}$', 'Square root both sides.'] },
  { f: 'V = \\frac{4}{3}\\pi r^{3}', s: 'r', ans: 'r = \\sqrt[3]{\\frac{3V}{4\\pi}}', wrong: ['r = \\sqrt{\\frac{3V}{4\\pi}}', 'r = \\sqrt[3]{\\frac{4V}{3\\pi}}', 'r = \\frac{3V}{4\\pi}', 'r = \\sqrt[3]{3V - 4\\pi}'], steps: ['Multiply by 3: $3V = 4\\pi r^{3}$', 'Divide by $4\\pi$: $r^{3} = \\frac{3V}{4\\pi}$', 'Cube root both sides.'] },
  { f: 'c^{2} = a^{2} + b^{2}', s: 'a', ans: 'a = \\sqrt{c^{2} - b^{2}}', wrong: ['a = c - b', 'a = \\sqrt{c^{2} + b^{2}}', 'a = c^{2} - b^{2}', 'a = \\sqrt{c} - \\sqrt{b}'], steps: ['Subtract $b^{2}$: $a^{2} = c^{2} - b^{2}$', 'Square root both sides (you cannot square root each term separately).'] },
];

const PARAM_POWER = [
  (rng) => { const [y, x] = pick(rng, [['y', 'x'], ['A', 'r'], ['E', 'v'], ['P', 't']]); const k = int(rng, 2, 9); const c = int(rng, 1, 20); return { f: `${y} = ${k}${x}^{2} + ${c}`, s: x, ans: `${x} = \\sqrt{\\frac{${y} - ${c}}{${k}}}`, wrong: [`${x} = \\sqrt{\\frac{${y} + ${c}}{${k}}}`, `${x} = \\frac{\\sqrt{${y} - ${c}}}{${k * k}}`, `${x} = \\frac{${y} - ${c}}{${2 * k}}`, `${x} = \\sqrt{\\frac{${y}}{${k}}} - ${c}`], steps: [`Subtract ${c}: $${y} - ${c} = ${k}${x}^{2}$`, `Divide by ${k}, then square root (taking $${x}$ positive).`] }; },
  (rng) => { const [y, x] = pick(rng, [['y', 'x'], ['T', 'L'], ['w', 'k']]); const c = int(rng, 1, 15); return { f: `${y} = \\sqrt{${x} - ${c}}`, s: x, ans: `${x} = ${y}^{2} + ${c}`, wrong: [`${x} = ${y}^{2} - ${c}`, `${x} = (${y} + ${c})^{2}`, `${x} = \\sqrt{${y}} + ${c}`, `${x} = ${y}^{2} + ${c * c}`], steps: [`Square both sides: $${y}^{2} = ${x} - ${c}$`, `Add ${c}.`] }; },
  (rng) => { const [y, x] = pick(rng, [['y', 'x'], ['A', 'p'], ['Q', 'n']]); const c = int(rng, 1, 12); return { f: `${y} = (${x} + ${c})^{2}`, s: x, ans: `${x} = \\sqrt{${y}} - ${c}`, wrong: [`${x} = \\sqrt{${y} - ${c}}`, `${x} = \\sqrt{${y}} + ${c}`, `${x} = ${y}^{2} - ${c}`, `${x} = \\sqrt{${y} - ${c * c}}`], steps: [`Square root both sides: $\\sqrt{${y}} = ${x} + ${c}$ (taking the positive root)`, `Subtract ${c}.`] }; },
  (rng) => { const [T, L] = pick(rng, [['T', 'L'], ['y', 'x'], ['F', 'm']]); const k = int(rng, 2, 9); return { f: `${T} = ${k}\\sqrt{${L}}`, s: L, ans: `${L} = \\frac{${T}^{2}}{${k * k}}`, wrong: [`${L} = \\frac{${T}^{2}}{${k}}`, `${L} = \\frac{${T}}{${k}}`, `${L} = \\frac{\\sqrt{${T}}}{${k}}`, `${L} = ${k * k}${T}^{2}`], steps: [`Divide by ${k}: $\\frac{${T}}{${k}} = \\sqrt{${L}}$`, `Square both sides: $${L} = \\frac{${T}^{2}}{${k * k}}$`] }; },
  (rng) => { const k = pick(rng, [6, 4, 3, 5]); const [A, s] = pick(rng, [['A', 's'], ['S', 'x'], ['A', 'l']]); return { f: `${A} = ${k}${s}^{2}`, s, ans: `${s} = \\sqrt{\\frac{${A}}{${k}}}`, wrong: [`${s} = \\frac{\\sqrt{${A}}}{${k}}`, `${s} = \\frac{${A}}{${2 * k}}`, `${s} = \\sqrt{${k}${A}}`, `${s} = \\frac{${A}^{2}}{${k}}`], steps: [`Divide by ${k}: $${s}^{2} = \\frac{${A}}{${k}}$`, `Square root both sides.`] }; },
];

export const rearrangePower = G('alg-rearrange-power', 'alg-rearrange-hard', (rng, d) => {
  const pool = d === 'easy' ? POWER_FORMULAE.filter((f) => f.steps.length <= 2) : d === 'medium' ? POWER_FORMULAE.slice(0, 7) : POWER_FORMULAE;
  const f = chance(rng, 0.5) ? pick(rng, PARAM_POWER)(rng) : pick(rng, pool);
  return {
    prompt: `Make $${f.s}$ the subject of &nbsp; $${f.f}$`,
    answer: $(f.ans),
    distractors: f.wrong.map($),
    solution: [...f.steps, `Answer: $${f.ans}$`],
  };
}, { title: 'Rearrange formulae with powers and roots' });

export const rearrangeTwice = G('alg-rearrange-twice', 'alg-rearrange-hard', (rng, d) => {
  const a = int(rng, 2, 7); const b = int(rng, 2, 9); const c = int(rng, 2, 6);
  const form = pick(rng, size(d, ['ax+b=cx+y', 'ay=x+by'], ['frac1', 'ax+b=cx+y', 'factor'], ['frac1', 'frac2', 'factor']));
  let eq; let s = 'x'; let ans; let wrong; let steps;
  if (form === 'ax+b=cx+y') {
    eq = `${a}x + y = ${b} - kx`.replace('k', ''); // placeholder overwritten below
    eq = `${a}x + y = kx + ${b}`; s = 'x';
    ans = `x = \\frac{${b} - y}{${a} - k}`;
    wrong = [`x = \\frac{${b} + y}{${a} - k}`, `x = \\frac{${b} - y}{${a} + k}`, `x = \\frac{${b} - y}{${a}} + k`, `x = \\frac{y - ${b}}{${a} + k}`];
    steps = [`Collect the $x$ terms on one side and everything else on the other: $${a}x - kx = ${b} - y$`, `Factorise: $x(${a} - k) = ${b} - y$`, `Divide by $(${a} - k)$.`];
  } else if (form === 'ay=x+by') {
    eq = `ax = ${b}x + y`; s = 'x';
    ans = `x = \\frac{y}{a - ${b}}`;
    wrong = [`x = \\frac{y}{a + ${b}}`, `x = \\frac{y - ${b}}{a}`, `x = \\frac{y}{a} - ${b}`, `x = \\frac{a - ${b}}{y}`];
    steps = [`Collect the $x$ terms: $ax - ${b}x = y$`, `Factorise: $x(a - ${b}) = y$`, `Divide by $(a - ${b})$.`];
  } else if (form === 'factor') {
    eq = `${a}p + ${b}q = pq + ${c}`; s = 'p';
    ans = `p = \\frac{${c} - ${b}q}{${a} - q}`;
    wrong = [`p = \\frac{${c} + ${b}q}{${a} - q}`, `p = \\frac{${c} - ${b}q}{${a} + q}`, `p = \\frac{${c} - ${b}q}{${a}q}`, `p = \\frac{${b}q - ${c}}{${a} + q}`];
    steps = [`Get the $p$ terms on one side: $${a}p - pq = ${c} - ${b}q$`, `Factorise: $p(${a} - q) = ${c} - ${b}q$`, `Divide by $(${a} - q)$.`];
  } else if (form === 'frac1') {
    eq = `y = \\frac{x + ${b}}{x - ${c}}`; s = 'x';
    ans = `x = \\frac{${c}y + ${b}}{y - 1}`;
    wrong = [`x = \\frac{${c}y - ${b}}{y - 1}`, `x = \\frac{${c}y + ${b}}{y + 1}`, `x = \\frac{${b} - ${c}y}{y - 1}`, `x = y(x - ${c}) - ${b}`];
    steps = [`Multiply both sides by $(x - ${c})$: $y(x - ${c}) = x + ${b}$`, `Expand: $xy - ${c}y = x + ${b}$`, `Collect the $x$ terms: $xy - x = ${c}y + ${b}$, so $x(y - 1) = ${c}y + ${b}$`, `Divide by $(y - 1)$.`];
  } else {
    eq = `\\frac{1}{u} + \\frac{1}{v} = \\frac{1}{f}`; s = 'v';
    ans = `v = \\frac{uf}{u - f}`;
    wrong = [`v = \\frac{uf}{f - u}`, `v = f - u`, `v = \\frac{u - f}{uf}`, `v = \\frac{uf}{u + f}`];
    steps = [`$\\frac{1}{v} = \\frac{1}{f} - \\frac{1}{u} = \\frac{u - f}{uf}$`, `Turn both sides upside down: $v = \\frac{uf}{u - f}$`];
  }
  return {
    prompt: `Make $${s}$ the subject of &nbsp; $${eq}$`,
    answer: $(ans),
    distractors: wrong.map($),
    hint: `Collect every term containing $${s}$ on one side, then factorise $${s}$ out.`,
    solution: [...steps, `Answer: $${ans}$`],
  };
}, { title: 'Rearrange when the subject appears twice' });

/* ================================================================== */
/* alg-iteration                                                       */
/* ================================================================== */

export const iterationCompute = G('alg-iteration-compute', 'alg-iteration', (rng, d) => {
  const sub = pick(rng, ['x', 'u']);
  const n = sub === 'u' ? 'u' : 'x';
  let fTex; let f; let x1; let calc = false; let exact = true;
  const form = pick(rng, size(d, ['linear', 'square'], ['frac', 'linear', 'frac'], ['frac', 'root', 'cuberoot']));
  if (form === 'linear') { const a = int(rng, 2, 4); const b = intExcept(rng, -9, 9, [0]); fTex = `${a}${n}_{n} ${b < 0 ? '-' : '+'} ${Math.abs(b)}`; f = (t) => t.mul(a).add(b); x1 = frac(int(rng, -3, 6)); }
  else if (form === 'square') { const b = intExcept(rng, -6, 6, [0]); fTex = `${n}_{n}^{2} ${b < 0 ? '-' : '+'} ${Math.abs(b)}`; f = (t) => t.mul(t).add(b); x1 = frac(int(rng, -2, 3)); }
  else if (form === 'frac') { const a = int(rng, 2, 24); const b = int(rng, 1, 5); fTex = `\\frac{${a}}{${n}_{n} + ${b}}`; f = (t) => frac(a).div(t.add(b)); x1 = frac(int(rng, 1, 6)); }
  else if (form === 'root') { const a = int(rng, 2, 9); const b = int(rng, 1, 20); fTex = `\\sqrt{${a}${n}_{n} + ${b}}`; f = (t) => Math.sqrt(a * t + b); x1 = int(rng, 1, 5); calc = true; exact = false; }
  else { const a = int(rng, 2, 9); const b = int(rng, 1, 15); fTex = `\\sqrt[3]{${a}${n}_{n} + ${b}}`; f = (t) => Math.cbrt(a * t + b); x1 = int(rng, 1, 4); calc = true; exact = false; }
  const seq = [x1]; for (let i = 0; i < 3; i += 1) seq.push(f(seq[i]));
  const target = d === 'easy' ? 2 : 3; // index into seq: x3
  if (exact) {
    if (seq.slice(1, 4).some((t) => Math.abs(t.n) > 400 || t.d > 60)) throw new Error('too messy');
    const ans = seq[target - 1 + 0 + 1 - 1 + 1 - 1 + (target === 3 ? 1 : 0)];
    const idx = target === 3 ? 2 : 1;
    const answer = seq[idx];
    const wrong = [seq[idx - 1], seq[idx + 1], answer.neg(), answer.add(1)].filter((t) => !t.eq(answer));
    void ans;
    return {
      prompt: `A sequence is formed using the iterative formula &nbsp; $${n}_{n+1} = ${fTex}$, &nbsp; with $${n}_{1} = ${x1.tex()}$.<br>Work out the value of $${n}_{${idx + 1}}$.`,
      answer: $(answer.tex()),
      distractors: [...new Set(wrong.map((t) => $(t.tex())))],
      typed: { kind: 'number', value: answer },
      calculator: false,
      solution: [
        `Put each answer back into the formula to get the next term.`,
        ...seq.slice(0, idx).map((t, i) => `$${n}_{${i + 2}} = ${fTex.replace(new RegExp(`${n}_\\{n\\}`, 'g'), `(${t.tex()})`)} = ${seq[i + 1].tex()}$`),
        `Answer: $${n}_{${idx + 1}} = ${answer.tex()}$`,
      ],
    };
  }
  const idx = 2; const answer = roundTo(seq[idx], 3);
  const wrong = [roundTo(seq[idx - 1], 3), roundTo(seq[idx + 1], 3), roundTo(seq[idx], 2), roundTo(seq[idx], 3) + 0.001, roundTo(seq[1] * 1.01, 3)].filter((t) => t !== answer);
  return {
    prompt: `Use the iteration formula &nbsp; $${n}_{n+1} = ${fTex}$ &nbsp; with $${n}_{1} = ${x1}$ to work out $${n}_{3}$.<br>Give your answer to 3 decimal places.`,
    answer: $(tnum(answer, 3)),
    distractors: wrong.map((t) => $(tnum(t, 3))),
    typed: { kind: 'number', value: answer, tolerance: 0.0005 },
    calculator: calc,
    solution: [
      `Substitute $${n}_{1} = ${x1}$: $${n}_{2} = ${fTex.replace(new RegExp(`${n}_\\{n\\}`, 'g'), `(${x1})`)} = ${tnum(roundTo(seq[1], 3), 3)}…$`,
      `Use the <b>unrounded</b> value of $${n}_{2}$ (use ANS on your calculator): $${n}_{3} = ${tnum(roundTo(seq[2], 3), 3)}…$`,
      `Answer: $${tnum(answer, 3)}$`,
    ],
  };
}, { title: 'Work out terms of an iterative formula' });

export const iterationRoot = G('alg-iteration-root', 'alg-iteration', (rng, d) => {
  // x_{n+1} = ∛(a x_n + b) converges to the root of x³ − a x − b = 0
  const a = int(rng, 2, 8); const b = int(rng, 1, 12);
  const f = (t) => Math.cbrt(a * t + b);
  let x = int(rng, 1, 3); const x1 = x;
  const seq = [x];
  for (let i = 0; i < 40; i += 1) { x = f(x); seq.push(x); }
  const root = seq[seq.length - 1];
  const dp = d === 'hard' ? 3 : 2;
  const ans = roundTo(root, dp);
  if (Math.abs(Math.abs(root * 10 ** dp) % 1 - 0.5) < 0.05) throw new Error('too close to a rounding boundary');
  const steps = seq.findIndex((t) => roundTo(t, dp) === ans && roundTo(seq[seq.indexOf(t) + 1], dp) === ans);
  const shown = seq.slice(1, Math.max(steps + 2, 3));
  const wrong = [roundTo(seq[1], dp), roundTo(seq[2], dp), roundTo(root + 10 ** -dp, dp), roundTo(root - 10 ** -dp, dp), roundTo(Math.sqrt(a * root + b), dp)].filter((t) => t !== ans);
  return {
    prompt: `The equation $x^{3} - ${a}x - ${b} = 0$ has one positive solution.<br>Use the iterative formula $x_{n+1} = \\sqrt[3]{${a}x_{n} + ${b}}$ with $x_{1} = ${x1}$ to find this solution to ${dp} decimal places.`,
    answer: $(tnum(ans, dp)),
    distractors: [...new Set(wrong.map((t) => $(tnum(t, dp))))],
    typed: { kind: 'number', value: ans, tolerance: 0.5 * 10 ** -dp },
    calculator: true,
    solution: [
      `Keep putting each answer back into the formula (type the formula once and press = repeatedly, using ANS).`,
      shown.map((t, i) => `$x_{${i + 2}} = ${tnum(roundTo(t, 4 > dp ? dp + 2 : 4), dp + 2).replace(/(\.\d{3})\d$/, '$1')}…$`).join(', '),
      `$x_{${steps + 1}}$ and $x_{${steps + 2}}$ both round to ${tnum(ans, dp)}, so the solution is ${tnum(ans, dp)} to ${dp} decimal places.`,
      `Answer: $x = ${tnum(ans, dp)}$`,
    ],
    longDecimalsOk: true,
  };
}, { title: 'Iterate to find a solution to a given accuracy' });

export const iterationSignChange = G('alg-iteration-sign-change', 'alg-iteration', (rng, d) => {
  // f(x) = x³ + p x + q with exactly one root between consecutive integers k and k + 1
  for (let i = 0; i < 80; i += 1) {
    const p = intExcept(rng, -6, 6, []); const q = intExcept(rng, -15, 15, [0]);
    const f = (t) => t ** 3 + p * t + q;
    const k = int(rng, -4, 6);
    if (!(f(k) * f(k + 1) < 0)) continue;
    if (f(k) === 0 || f(k + 1) === 0) continue;
    if (4 * p ** 3 + 27 * q * q <= 0) continue; // must have exactly one real root
    const fx = `x^{3} ${p === 0 ? '' : `${p < 0 ? '-' : '+'} ${Math.abs(p) === 1 ? '' : Math.abs(p)}x `}${q < 0 ? '-' : '+'} ${Math.abs(q)}`;
    const ans = `$${tnum(k)}$ and $${tnum(k + 1)}$`;
    const dis = [[k - 1, k], [k + 1, k + 2], [k + 2, k + 3], [k - 2, k - 1]].filter(([u, v]) => f(u) * f(v) > 0).map(([u, v]) => `$${tnum(u)}$ and $${tnum(v)}$`);
    if (dis.length < 3) continue;
    return {
      prompt: `The equation &nbsp;$${fx} = 0$&nbsp; has exactly one solution.<br>Between which two consecutive integers does it lie?`,
      answer: ans,
      distractors: dis,
      count: 4,
      solution: [
        `Substitute integers and look for a <b>change of sign</b>: if the value changes from negative to positive (or the other way), the graph must cross zero in between.`,
        `$x = ${tnum(k)}$: $${tnum(f(k))}$; &nbsp; $x = ${tnum(k + 1)}$: $${tnum(f(k + 1))}$`,
        `There is a change of sign, so the solution is between $${tnum(k)}$ and $${tnum(k + 1)}$.`,
        `Answer: ${ans}`,
      ],
    };
  }
  throw new Error('no sign change');
}, { title: 'Locate a root by a change of sign' });

export const iterationRearrange = G('alg-iteration-rearrange', 'alg-iteration', (rng, d) => {
  const a = int(rng, 2, 9); const b = int(rng, 1, 12);
  const s1 = pick(rng, [1, -1]); // x³ + s1·a x − b = 0
  const eq = `x^{3} ${s1 > 0 ? '+' : '-'} ${a}x - ${b} = 0`;
  const valid = [
    `x = \\sqrt[3]{${b} ${s1 > 0 ? '-' : '+'} ${a}x}`,
    s1 > 0 ? `x = \\frac{${b} - x^{3}}{${a}}` : `x = \\frac{x^{3} - ${b}}{${a}}`,
    `x = \\frac{${b}}{x^{2} ${s1 > 0 ? '+' : '-'} ${a}}`,
  ];
  const invalid = [
    `x = \\sqrt[3]{${b} ${s1 > 0 ? '+' : '-'} ${a}x}`,
    `x = \\sqrt[3]{${a}x - ${b}}`, // sign slip: the whole right-hand side negated
    s1 > 0 ? `x = \\frac{${b} + x^{3}}{${a}}` : `x = \\frac{x^{3} + ${b}}{${a}}`,
    `x = \\frac{${b}}{x^{2} ${s1 > 0 ? '-' : '+'} ${a}}`,
    `x = \\sqrt{${b} ${s1 > 0 ? '-' : '+'} ${a}x}`,
    `x = \\sqrt[3]{${b}} ${s1 > 0 ? '-' : '+'} ${a}x`,
  ];
  const which = pick(rng, size(d, [0, 1], [0, 1, 2], [0, 2]));
  const ans = valid[which];
  return {
    prompt: `Which of these is a correct rearrangement of &nbsp; $${eq}$?`,
    answer: $(ans),
    distractors: shuffle(rng, invalid).map($),
    count: 4,
    solution: [
      `Rearrange step by step, changing the sign of any term you move across the equals sign.`,
      which === 0 ? `$x^{3} = ${b} ${s1 > 0 ? '-' : '+'} ${a}x$, then cube root both sides.` : which === 1 ? `Move the $x$ term: $${s1 > 0 ? `${a}x = ${b} - x^{3}` : `${a}x = x^{3} - ${b}`}$, then divide by ${a}.` : `$x^{3} ${s1 > 0 ? '+' : '-'} ${a}x = ${b}$, so $x(x^{2} ${s1 > 0 ? '+' : '-'} ${a}) = ${b}$; divide by the bracket.`,
      `Answer: $${ans}$`,
    ],
  };
}, { title: 'Rearrange an equation into an iterative form', learn: ['alg-iteration', 'alg-rearrange-simple'] });

export const generators = [
  formulaSub, formulaWords, formulaReverse,
  writeFormula, writeExpression, writeFormulaShape,
  vocabClassify, vocabWhich, identityCoefficients,
  rearrangeLinear, rearrangeFormula, rearrangeFraction,
  rearrangePower, rearrangeTwice,
  iterationCompute, iterationRoot, iterationSignChange, iterationRearrange,
];

void [terms, gcd, br, tf, rat, tv, pmul, val];
