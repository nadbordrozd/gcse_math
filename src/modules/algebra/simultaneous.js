// Simultaneous equations: linear (elimination/substitution), word problems, linear + quadratic/circle.
import { pick, int, intExcept, size, chance, tnum, terms, names, money, gcd, shuffle } from '../../core.js';
import { G, P, $ } from './lib.js';

const lin2 = (a, b, x = 'x', y = 'y') => terms([[a, x], [b, y]]);
const sys = (rows) => `\\begin{aligned} ${rows.map(([l, r]) => `${l} &= ${r}`).join(' \\\\ ')} \\end{aligned}`;
const pairTex = (x, y) => `$x = ${tnum(x)}, \\ y = ${tnum(y)}$`;
const paren = (n) => (n < 0 ? `(${tnum(n)})` : tnum(n));

function pairDistractors(x, y, extra = []) {
  const right = pairTex(x, y);
  const cands = [[y, x], [x, -y], [-x, y], [-x, -y], ...extra, [x, y + 1], [x + 1, y], [x - 1, y + 2]];
  return [...new Set(cands.filter(([a, b]) => Number.isInteger(a) && Number.isInteger(b)).map(([a, b]) => pairTex(a, b)))].filter((t) => t !== right);
}

/* ================================================================== */
/* alg-simultaneous-linear                                             */
/* ================================================================== */

export const simElimSimple = G('alg-sim-elim-simple', 'alg-simultaneous-linear', (rng, d) => {
  const x = intExcept(rng, size(d, 1, -5, -9), size(d, 9, 10, 12), [0]); const y = intExcept(rng, size(d, 1, -6, -9), size(d, 9, 10, 12), [0]);
  if (x === y) throw new Error('');
  // Same |coefficient| of y in both: add if opposite signs, subtract if same.
  const b = int(rng, 1, size(d, 3, 4, 5));
  const opposite = d === 'easy' ? true : chance(rng, 0.5);
  const a1 = int(rng, 1, 5); let a2 = int(rng, 1, 5);
  if (!opposite && a1 === a2) a2 += 1;
  const b1 = b; const b2 = opposite ? -b : b;
  const c1 = a1 * x + b1 * y; const c2 = a2 * x + b2 * y;
  const A = opposite ? a1 + a2 : a1 - a2; const C = opposite ? c1 + c2 : c1 - c2;
  if (A === 0) throw new Error('');
  const wrongX = opposite ? (c1 - c2) / (a1 - a2 || 1) : (c1 + c2) / (a1 + a2);
  const wrongY = (c1 + a1 * x) / b1;
  const extra = [[wrongX, (c1 - a1 * wrongX) / b1], [x, wrongY]];
  return {
    prompt: `Solve the simultaneous equations<br>$${sys([[lin2(a1, b1), tnum(c1)], [lin2(a2, b2), tnum(c2)]])}$`,
    answer: pairTex(x, y),
    distractors: pairDistractors(x, y, extra),
    typed: { kind: 'coord', x, y },
    hint: opposite ? 'The y terms have opposite signs, so add the equations.' : 'The y terms are the same, so subtract one equation from the other.',
    solution: [
      opposite ? `The $y$ terms are $+${b === 1 ? '' : b}y$ and $-${b === 1 ? '' : b}y$, so <b>add</b> the equations to eliminate $y$:` : `The $y$ terms are the same, so <b>subtract</b> the second equation from the first to eliminate $y$:`,
      A === 1 ? `$x = ${tnum(C)}$` : `$${terms([[A, 'x']])} = ${tnum(C)}$, so $x = ${tnum(x)}$`,
      `Substitute into the first equation: $${a1 === 1 ? '' : a1}${a1 === 1 ? '' : ' \\times '}${paren(x)} + ${b1 === 1 ? '' : b1}y = ${tnum(c1)}$, so $${b1 === 1 ? '' : b1}y = ${tnum(c1 - a1 * x)}$ and $y = ${tnum(y)}$`,
      `Check in the second equation: $${tnum(a2 * x)} ${b2 * y < 0 ? '-' : '+'} ${Math.abs(b2 * y)} = ${tnum(c2)}$ ✓`,
      `Answer: ${pairTex(x, y)}`,
    ],
  };
}, { title: 'Simultaneous equations: add or subtract to eliminate' });

export const simElimScale = G('alg-sim-elim-scale', 'alg-simultaneous-linear', (rng, d) => {
  const x = intExcept(rng, -6, 9, [0]); const y = intExcept(rng, -6, 9, [0, x]);
  let a1; let b1; let a2; let b2;
  if (d !== 'hard') {
    // Multiply one equation: b2 = k b1 (opposite or same sign)
    a1 = int(rng, 1, 5); b1 = int(rng, 1, 3); const k = int(rng, 2, 4); a2 = intExcept(rng, 1, 6, [a1 * k]); b2 = k * b1 * (chance(rng) ? -1 : 1);
  } else {
    // Multiply both: coprime coefficients
    do { a1 = int(rng, 2, 6); b1 = intExcept(rng, -5, 5, [0, 1, -1]); a2 = int(rng, 2, 6); b2 = intExcept(rng, -5, 5, [0, 1, -1]); } while (a1 * b2 - a2 * b1 === 0 || gcd(Math.abs(b1), Math.abs(b2)) !== 1 || Math.abs(b1) === Math.abs(b2) || a1 === a2);
  }
  if (a1 * b2 - a2 * b1 === 0) throw new Error('');
  const c1 = a1 * x + b1 * y; const c2 = a2 * x + b2 * y;
  // Eliminate y: multiply eq1 by |b2|/g and eq2 by |b1|/g
  const g = gcd(Math.abs(b1), Math.abs(b2));
  const m1 = Math.abs(b2) / g; const m2 = Math.abs(b1) / g;
  const same = Math.sign(b1) === Math.sign(b2);
  const A = same ? m1 * a1 - m2 * a2 : m1 * a1 + m2 * a2; const C = same ? m1 * c1 - m2 * c2 : m1 * c1 + m2 * c2;
  if (A === 0) throw new Error('');
  // Slip: multiplied only the left-hand side
  const slipC = same ? m1 * c1 - c2 * (m2 === 1 ? 1 : 1) : m1 * c1 + c2;
  const slipX = m2 === 1 ? (same ? (m1 * c1 - c2) : (m1 * c1 + c2)) : null;
  const extra = [];
  const xs = (slipC - (m1 === 1 ? 0 : 0)) / A; if (Number.isInteger(xs) && b1 !== 0) { const ys = (c1 - a1 * xs) / b1; extra.push([xs, ys]); }
  void slipX;
  return {
    prompt: `Solve the simultaneous equations<br>$${sys([[lin2(a1, b1), tnum(c1)], [lin2(a2, b2), tnum(c2)]])}$`,
    answer: pairTex(x, y),
    distractors: pairDistractors(x, y, extra),
    typed: { kind: 'coord', x, y },
    hint: 'Multiply one or both equations so that the y terms have the same size, then add or subtract.',
    solution: [
      `Make the $y$ coefficients the same size: ${m1 > 1 ? `multiply the first equation by ${m1}` : 'keep the first equation'}${m2 > 1 ? ` and multiply the second by ${m2}` : ''} (every term, including the right-hand side).`,
      `$${sys([[lin2(m1 * a1, m1 * b1), tnum(m1 * c1)], [lin2(m2 * a2, m2 * b2), tnum(m2 * c2)]])}$`,
      `${same ? 'Subtract' : 'Add'} to eliminate $y$: $${terms([[A, 'x']])} = ${tnum(C)}$, so $x = ${tnum(x)}$`,
      `Substitute into the first equation: $${tnum(a1 * x)} ${b1 < 0 ? '-' : '+'} ${Math.abs(b1) === 1 ? '' : Math.abs(b1)}y = ${tnum(c1)}$, so $y = ${tnum(y)}$`,
      `Answer: ${pairTex(x, y)}`,
    ],
  };
}, { title: 'Simultaneous equations: multiply then eliminate' });

export const simSubstitution = G('alg-sim-substitution', 'alg-simultaneous-linear', (rng, d) => {
  const x = intExcept(rng, -5, 8, [0]);
  const m = intExcept(rng, -4, 4, [0]); const c = intExcept(rng, -9, 9, []);
  const y = m * x + c;
  const a = int(rng, 1, 5); const b = intExcept(rng, -4, 5, [0]);
  if (a + b * m === 0) throw new Error('');
  const k = a * x + b * y;
  const form = d === 'easy' ? 'y=' : pick(rng, ['y=', 'y=', 'x+']);
  const A = a + b * m; const K = k - b * c;
  const wrongX = (k + b * c) / A;
  const extra = [[wrongX, m * wrongX + c], [x, m * x - c], [x, k - a * x]];
  return {
    prompt: `Solve the simultaneous equations<br>$${sys([['y', P([m, c])], [lin2(a, b), tnum(k)]])}$`,
    answer: pairTex(x, y),
    distractors: pairDistractors(x, y, extra),
    typed: { kind: 'coord', x, y },
    hint: 'Replace y in the second equation with the expression for y from the first.',
    solution: [
      `Substitute $y = ${P([m, c])}$ into the second equation: $${a === 1 ? '' : a}x ${b < 0 ? '-' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}(${P([m, c])}) = ${tnum(k)}$`,
      `Expand and simplify: $${P([A, b * c])} = ${tnum(k)}$, so $${terms([[A, 'x']])} = ${tnum(K)}$ and $x = ${tnum(x)}$`,
      `Then $y = ${P([m, c]).replace('x', Math.abs(m) === 1 ? paren(x) : ` \\times ${paren(x)}`)} = ${tnum(y)}$`,
      `Answer: ${pairTex(x, y)}`,
    ],
  };
}, { title: 'Simultaneous equations by substitution' });

/* ================================================================== */
/* alg-simultaneous-problems                                           */
/* ================================================================== */

// Each context: unknowns u, v (positive integers, in pence where `pence`), two equations a1 u + b1 v = c1, a2 u + b2 v = c2.
function simContext(rng, d) {
  const [n1, n2] = names(rng, 2);
  const pairQ = () => {
    for (let i = 0; i < 50; i += 1) {
      const a1 = int(rng, 2, 6); const b1 = int(rng, 2, 6); const a2 = int(rng, 2, 6); const b2 = int(rng, 2, 6);
      if (a1 * b2 !== a2 * b1 && !(a1 === a2 && b1 === b2)) return [a1, b1, a2, b2];
    }
    return [2, 1, 1, 3];
  };
  const coin = d === 'easy' ? 100 : pick(rng, [50, 10, 100, 5]);
  const price = (lo, hi) => coin * int(rng, Math.ceil((lo * 100) / coin), Math.floor((hi * 100) / coin));
  const ctxs = [
    () => { const [a1, b1, a2, b2] = pairQ(); return { u: price(5, 15), v: price(3, 9), items: ['adult ticket', 'child ticket'], text: (c1, c2) => `${a1} adult tickets and ${b1} child tickets for a cinema cost ${money(c1 / 100)}. ${a2} adult tickets and ${b2} child tickets cost ${money(c2 / 100)}.`, coef: [a1, b1, a2, b2], money: true, letters: ['a', 'c'] }; },
    () => { const [a1, b1, a2, b2] = pairQ(); return { u: price(2, 4), v: price(1.5, 4), items: ['coffee', 'cake'], text: (c1, c2) => `In a café, ${a1} coffees and ${b1} cakes cost ${money(c1 / 100)}. ${a2} coffees and ${b2} cakes cost ${money(c2 / 100)}.`, coef: [a1, b1, a2, b2], money: true, letters: ['c', 'k'] }; },
    () => { const [a1, b1, a2, b2] = pairQ(); return { u: 5 * int(rng, 10, 40), v: 5 * int(rng, 6, 30), items: ['pen', 'ruler'], text: (c1, c2) => `${n1} buys ${a1} pens and ${b1} rulers for ${money(c1 / 100, { forcePence: true })}. ${n2} buys ${a2} pens and ${b2} rulers for ${money(c2 / 100, { forcePence: true })}.`, coef: [a1, b1, a2, b2], money: true, letters: ['p', 'r'] }; },
    () => { const [a1, b1, a2, b2] = pairQ(); return { u: price(1, 3), v: price(1, 2), items: ['burger', 'drink'], text: (c1, c2) => `${a1} burgers and ${b1} drinks cost ${money(c1 / 100)}. ${a2} burgers and ${b2} drinks cost ${money(c2 / 100)}.`, coef: [a1, b1, a2, b2], money: true, letters: ['b', 'd'] }; },
    () => { const s = int(rng, 20, 90); const dd = int(rng, 2, s - 2); if ((s + dd) % 2) return null; return { u: (s + dd) / 2, v: (s - dd) / 2, items: ['larger number', 'smaller number'], text: () => `Two numbers add up to ${s}. Their difference is ${dd}.`, coef: [1, 1, 1, -1], money: false, letters: ['x', 'y'], eqs: [`x + y = ${s}`, `x - y = ${dd}`] }; },
    () => { const p = int(rng, 25, 50); const c = int(rng, 3, 15); return { u: p, v: c, items: [`parent's age`, `child's age`], text: () => `The sum of a parent's age and their child's age is ${p + c} years. The parent is ${p - c} years older than the child.`, coef: [1, 1, 1, -1], money: false, letters: ['p', 'c'], unitWord: 'years', eqs: [`p + c = ${p + c}`, `p - c = ${p - c}`] }; },
    () => { const u = int(rng, 4, 20); const v = int(rng, 4, 20); return { u, v, items: ['20p coins', '50p coins'], text: () => `A money box contains only 20p and 50p coins. There are ${u + v} coins altogether, with a total value of ${money((20 * u + 50 * v) / 100, { forcePence: true })}.`, coef: [1, 1, 20, 50], money: false, letters: ['t', 'f'], countWord: 'coins', eqs: [`t + f = ${u + v}`, `20t + 50f = ${20 * u + 50 * v}`] }; },
    () => { const u = int(rng, 5, 30); const v = int(rng, 3, 20); return { u, v, items: ['chickens', 'sheep'], text: () => `A farm has only chickens and sheep. Altogether the animals have ${u + v} heads and ${2 * u + 4 * v} legs.`, coef: [1, 1, 2, 4], money: false, letters: ['c', 's'], eqs: [`c + s = ${u + v}`, `2c + 4s = ${2 * u + 4 * v}`] }; },
    () => { const u = price(30, 90); const v = price(15, 40); const h1 = int(rng, 1, 3); const h2 = h1 + int(rng, 1, 3); return { u, v, items: ['call-out charge', 'hourly rate'], text: () => `A plumber charges a fixed call-out fee plus an hourly rate. A ${h1}-hour job costs ${money((u + h1 * v) / 100)}. A ${h2}-hour job costs ${money((u + h2 * v) / 100)}.`, coef: [1, h1, 1, h2], money: true, letters: ['c', 'h'] }; },
    () => { const u = 50 * int(rng, 4, 10); const v = 10 * int(rng, 15, 35); const m1 = int(rng, 2, 6); const m2 = m1 + int(rng, 2, 8); return { u, v, items: ['fixed charge', 'cost per mile'], text: () => `A taxi company charges a fixed amount plus a cost per mile. A ${m1}-mile journey costs ${money((u + m1 * v) / 100, { forcePence: true })}. A ${m2}-mile journey costs ${money((u + m2 * v) / 100, { forcePence: true })}.`, coef: [1, m1, 1, m2], money: true, letters: ['f', 'm'] }; },
    () => { const u = int(rng, 10, 30); const v = int(rng, 1, 10); const n = u + v; return { u, v, items: ['correct answers', 'wrong answers'], text: () => `In a quiz, you score 3 points for each correct answer and lose 1 point for each wrong answer. ${n1} answered all ${n} questions and scored ${3 * u - v} points.`, coef: [1, 1, 3, -1], money: false, letters: ['c', 'w'], eqs: [`c + w = ${n}`, `3c - w = ${3 * u - v}`] }; },
    () => { const [a1, b1, a2, b2] = pairQ(); const u = int(rng, 6, 24); const v = int(rng, 4, 20); return { u, v, items: ['large box', 'small box'], text: (c1, c2) => `A shop packs eggs into large and small boxes. ${a1} large boxes and ${b1} small boxes hold ${c1} eggs. ${a2} large boxes and ${b2} small boxes hold ${c2} eggs.`, coef: [a1, b1, a2, b2], money: false, letters: ['L', 'S'], countWord: 'eggs' }; },
    () => { const [a1, b1, a2, b2] = pairQ(); return { u: price(20, 45), v: price(10, 25), items: ['stalls seat', 'balcony seat'], text: (c1, c2) => `At a theatre, ${a1} stalls seats and ${b1} balcony seats cost ${money(c1 / 100)}. ${a2} stalls seats and ${b2} balcony seats cost ${money(c2 / 100)}.`, coef: [a1, b1, a2, b2], money: true, letters: ['s', 'b'] }; },
    () => { const [a1, b1, a2, b2] = pairQ(); return { u: 5 * int(rng, 6, 20), v: 5 * int(rng, 4, 16), items: ['apple', 'banana'], text: (c1, c2) => `${a1} apples and ${b1} bananas cost ${money(c1 / 100, { forcePence: true })}. ${a2} apples and ${b2} bananas cost ${money(c2 / 100, { forcePence: true })}.`, coef: [a1, b1, a2, b2], money: true, letters: ['a', 'b'] }; },
  ];
  for (let i = 0; i < 40; i += 1) {
    const c = pick(rng, ctxs)();
    if (!c || c.u === c.v) continue;
    const [a1, b1, a2, b2] = c.coef;
    c.c1 = a1 * c.u + b1 * c.v; c.c2 = a2 * c.u + b2 * c.v;
    if (c.money && (c.c1 / 100) % 1 !== 0 && coin === 100 && c.items[0] !== 'pen') { /* fine */ }
    return c;
  }
  throw new Error('no context');
}

function simSteps(c) {
  const [a1, b1, a2, b2] = c.coef;
  const [L1, L2] = c.letters;
  const scale = c.money ? 100 : 1;
  const show = (v) => (c.money ? tnum(v / 100, v % 100 ? 2 : null) : tnum(v));
  const eqs = c.eqs || [`${lin2(a1, b1, L1, L2)} = ${show(c.c1)}`, `${lin2(a2, b2, L1, L2)} = ${show(c.c2)}`];
  void scale;
  // Eliminate L2: multiply the equations so the L2 coefficients match, then subtract (or add if signs differ).
  const g = gcd(Math.abs(b1), Math.abs(b2));
  const m1 = Math.abs(b2) / g; const m2 = Math.abs(b1) / g;
  const same = Math.sign(b1) === Math.sign(b2);
  const A = same ? m1 * a1 - m2 * a2 : m1 * a1 + m2 * a2;
  const C = same ? m1 * c.c1 - m2 * c.c2 : m1 * c.c1 + m2 * c.c2;
  const scaled = m1 === 1 && m2 === 1 ? '' : `Multiply ${m1 > 1 ? `the first equation by ${m1}` : ''}${m1 > 1 && m2 > 1 ? ' and ' : ''}${m2 > 1 ? `the second by ${m2}` : ''} so the $${L2}$ terms match. `;
  const AL = terms([[A, L1]]);
  const elim = `${scaled}${same ? 'Subtract' : 'Add'} the equations to eliminate $${L2}$: $${A < 0 ? terms([[-A, L1]]) : AL} = ${show(Math.abs(C))}$, so $${L1} = ${show(c.u)}$`;
  return [
    `Let $${L1}$ = ${c.items[0]}${c.money ? ' (in £)' : ''} and $${L2}$ = ${c.items[1]}${c.money ? ' (in £)' : ''}.`,
    `Form two equations: $${eqs[0]}$ and $${eqs[1]}$`,
    elim,
    `Substitute into the first equation to find $${L2} = ${show(c.v)}$.`,
  ];
}
const fmtVal = (c, v) => (c.money ? money(v / 100, { forcePence: v % 100 !== 0 }) : `${tnum(v)}${c.unitWord ? ` ${c.unitWord}` : ''}`);

export const simProblem = G('alg-sim-problem', 'alg-simultaneous-problems', (rng, d) => {
  const c = simContext(rng, d);
  const askFirst = chance(rng, 0.5);
  const ansV = askFirst ? c.u : c.v;
  const item = askFirst ? c.items[0] : c.items[1];
  const question = /number|age|rate|charge|per mile/.test(item) ? `Work out the ${item}.` : c.money ? `Work out the cost of one ${item.replace(/s$/, '')}.` : `How many ${item}${/s$|sheep$/.test(item) ? '' : 's'}${c.countWord === 'eggs' ? ' does one hold' : ''}?`;
  const q2 = c.countWord === 'eggs' ? `How many eggs does one ${item} hold?` : question;
  const other = askFirst ? c.v : c.u;
  const wrong = [other, ansV + (c.money ? 50 : 1), ansV - (c.money ? 50 : 1), Math.round((c.c1 / (c.coef[0] + c.coef[1])) / (c.money ? 10 : 1)) * (c.money ? 10 : 1), ansV * 2, c.c1 - c.c2 > 0 ? c.c1 - c.c2 : c.c2 - c.c1].filter((w) => w > 0 && w !== ansV);
  return {
    prompt: `${c.text(c.c1, c.c2)}<br>${q2}`,
    answer: fmtVal(c, ansV),
    distractors: wrong.map((w) => fmtVal(c, w)),
    typed: { kind: 'number', value: c.money ? ansV / 100 : ansV },
    solution: [...simSteps(c), `Answer: ${fmtVal(c, ansV)}`],
  };
}, { title: 'Form and solve simultaneous equations from a context', word: true });

export const simProblemDerived = G('alg-sim-problem-combo', 'alg-simultaneous-problems', (rng, d) => {
  let c;
  for (let i = 0; i < 30; i += 1) { c = simContext(rng, d); if (!c.eqs && c.money) break; }
  if (c.eqs || !c.money) throw new Error('need a buying context');
  const [a1, b1, a2, b2] = c.coef;
  let p; let q;
  do { p = int(rng, 1, 4); q = int(rng, 1, 4); } while ((p === a1 && q === b1) || (p === a2 && q === b2));
  const isRate = /charge|rate|mile/.test(c.items[1]);
  if (isRate) throw new Error('combo makes no sense for fixed+rate');
  const total = p * c.u + q * c.v;
  const wrong = [p * c.v + q * c.u, c.c1 + c.c2, total + 100, total - 50, p * c.u, Math.abs(c.c1 - c.c2)].filter((w) => w > 0 && w !== total);
  const pl = (n, s) => `${n} ${s}${n === 1 ? '' : (s.endsWith('h') ? 'es' : 's')}`;
  return {
    prompt: `${c.text(c.c1, c.c2)}<br>Work out the cost of ${pl(p, c.items[0])} and ${pl(q, c.items[1])}.`,
    answer: fmtVal(c, total),
    distractors: wrong.map((w) => fmtVal(c, w)),
    typed: { kind: 'number', value: total / 100 },
    solution: [...simSteps(c), `${pl(p, c.items[0])} and ${pl(q, c.items[1])}: $${p} \\times ${tnum(c.u / 100, c.u % 100 ? 2 : null)} + ${q} \\times ${tnum(c.v / 100, c.v % 100 ? 2 : null)} = ${tnum(total / 100, total % 100 ? 2 : null)}$`, `Answer: ${fmtVal(c, total)}`],
  };
}, { title: 'Simultaneous equations: cost of a new combination', word: true });

/* ================================================================== */
/* alg-simultaneous-nonlinear                                          */
/* ================================================================== */

const twoPairs = (q1, q2) => {
  const [p1, p2] = [q1, q2].sort((u, v) => v[0] - u[0] || v[1] - u[1]);
  return `$x = ${tnum(p1[0])}, \\ y = ${tnum(p1[1])}$ &nbsp;or&nbsp; $x = ${tnum(p2[0])}, \\ y = ${tnum(p2[1])}$`;
};

export const simNonLinQuad = G('alg-sim-nl-quadratic', 'alg-simultaneous-nonlinear', (rng, d) => {
  // y = x² + p x + q and y = m x + c meet where x² + (p − m) x + (q − c) = 0 with roots r1, r2
  const r1 = intExcept(rng, -6, 6, []); const r2 = intExcept(rng, -6, 6, [r1]);
  const m = intExcept(rng, -4, 5, []); const c = intExcept(rng, -8, 8, []);
  const p = m - (r1 + r2); const q = c + r1 * r2;
  const pts = [[r1, m * r1 + c], [r2, m * r2 + c]].sort((u, v) => v[0] - u[0]);
  const ans = twoPairs(pts[0], pts[1]);
  const quadY = (t) => t * t + p * t + q;
  const lineForm = d === 'hard' && m !== 0 ? `${lin2(-m, 1)} = ${tnum(c)}` : `y = ${P([m, c])}`;
  const dis = [
    twoPairs([-pts[0][0], m * -pts[0][0] + c], [-pts[1][0], m * -pts[1][0] + c]),
    twoPairs([pts[0][0], pts[1][1]], [pts[1][0], pts[0][1]]),
    twoPairs([pts[0][0], -pts[0][1]], [pts[1][0], -pts[1][1]]),
    twoPairs([-pts[0][0], quadY(-pts[0][0])], [-pts[1][0], quadY(-pts[1][0])]),
    `$x = ${tnum(pts[0][0])}, \\ y = ${tnum(pts[0][1])}$ only`,
  ];
  const diff = [1, p - m, q - c];
  return {
    prompt: `Solve the simultaneous equations<br>$${sys([['y', P([1, p, q])], [lineForm.split(' = ')[0], lineForm.split(' = ')[1]]])}$`,
    answer: ans,
    distractors: dis.filter((t) => t !== ans),
    count: 5,
    solution: [
      ...(d === 'hard' && m !== 0 ? [`Rearrange the linear equation: $y = ${P([m, c])}$`] : []),
      `Set the two expressions for $y$ equal: $${P([1, p, q])} = ${P([m, c])}$`,
      `Make one side zero: $${P(diff)} = 0$, which factorises to $(x ${r1 > 0 ? '-' : '+'} ${Math.abs(r1)})(x ${r2 > 0 ? '-' : '+'} ${Math.abs(r2)}) = 0$`.replace(/\(x \+ 0\)|\(x - 0\)/g, 'x'),
      `So $x = ${tnum(r1)}$ or $x = ${tnum(r2)}$. Substitute into $y = ${P([m, c])}$ to find each $y$.`,
      `Answer: ${ans}`,
    ],
  };
}, { title: 'Solve a linear and a quadratic simultaneously' });

const CIRCLE_R2 = [5, 10, 13, 17, 20, 25, 26, 29, 34, 40, 45, 50];
function latticePoints(r2) {
  const pts = [];
  for (let x = -10; x <= 10; x += 1) for (let y = -10; y <= 10; y += 1) if (x * x + y * y === r2) pts.push([x, y]);
  return pts;
}

export const simNonLinCircle = G('alg-sim-nl-circle', 'alg-simultaneous-nonlinear', (rng, d) => {
  const r2 = pick(rng, size(d, [25, 10, 13, 5], CIRCLE_R2, CIRCLE_R2));
  const pts = latticePoints(r2);
  for (let i = 0; i < 60; i += 1) {
    const [A, B] = [pick(rng, pts), pick(rng, pts)];
    if (A[0] === B[0]) continue;
    const m = (B[1] - A[1]) / (B[0] - A[0]);
    if (!Number.isInteger(m) || Math.abs(m) > 3 || m === 0) continue;
    const c = A[1] - m * A[0];
    if (d === 'easy' && m !== 1 && m !== -1 && m !== 0) continue;
    const ptsS = [A, B].sort((u, v) => v[0] - u[0]);
    const ans = twoPairs(ptsS[0], ptsS[1]);
    const a = 1 + m * m; const b = 2 * m * c; const cc = c * c - r2;
    const g = gcd(gcd(a, Math.abs(b)), Math.abs(cc)) || 1;
    const dis = [
      twoPairs([ptsS[0][1], ptsS[0][0]], [ptsS[1][1], ptsS[1][0]]),
      twoPairs([-ptsS[0][0], -ptsS[0][1]], [-ptsS[1][0], -ptsS[1][1]]),
      twoPairs([ptsS[0][0], -ptsS[0][1]], [ptsS[1][0], -ptsS[1][1]]),
      twoPairs([-ptsS[0][0], m * -ptsS[0][0] + c], [-ptsS[1][0], m * -ptsS[1][0] + c]),
      `$x = ${tnum(ptsS[0][0])}, \\ y = ${tnum(ptsS[0][1])}$ only`,
    ];
    return {
      prompt: `Solve the simultaneous equations<br>$${sys([['x^{2} + y^{2}', tnum(r2)], ['y', P([m, c])]])}$`,
      answer: ans,
      distractors: dis.filter((t) => t !== ans),
      solution: [
        `Substitute $y = ${P([m, c])}$ into the circle: $x^{2} + (${P([m, c])})^{2} = ${r2}$`,
        `Expand: $${P([a, b, c * c])} = ${r2}$, so $${P([a, b, cc])} = 0$${g > 1 ? `, and dividing by ${g}: $${P([a / g, b / g, cc / g])} = 0$` : ''}`,
        `Solve: $x = ${tnum(ptsS[0][0])}$ or $x = ${tnum(ptsS[1][0])}$`,
        `Find $y$ from $y = ${P([m, c])}$ (not from the circle, which gives two $y$ values for each $x$).`,
        `Answer: ${ans}`,
      ],
    };
  }
  throw new Error('no line');
}, { title: 'Solve a line and a circle simultaneously' });

export const generators = [
  simElimSimple, simElimScale, simSubstitution,
  simProblem, simProblemDerived,
  simNonLinQuad, simNonLinCircle,
];

void [shuffle];
