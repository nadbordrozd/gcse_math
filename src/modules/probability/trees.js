// Independent events, dependent events (without replacement) and conditional probability.
import {
  pick, int, sample, shuffle, size, frac, Frac, num, tnum, names, cap, table, gcd,
} from '../../core.js';
import { treeDiagram, venn2, discs, cards, sampleGrid, rawFrac } from './diagrams.js';
import {
  pgen as gen, pf, pt, typedP, probOpts, countOpts, listAnd, shortDecimal,
} from './util.js';

const one = frac(1);
const sum = (xs) => xs.reduce((a, b) => a + b, 0);
/** Branch label value for a tree: Frac for fractions, number for decimals. */
const lab = (f, form) => (form === 'dec' ? f.value() : f);

/* ================================================================== */
/* Independent events                                                  */
/* ================================================================== */

// Two independent events. same: both stages use the same probability.
const IND_CTX = [
  { intro: (a, b) => `The probability that Jose passes his driving theory test is ${a}. The probability that Maria passes hers is ${b}.`, heads: ['Jose', 'Maria'], L: [['pass', 'fail'], ['pass', 'fail']], both: 'they both pass', neither: 'neither of them passes', exactly: 'exactly one of them passes', atleast: 'at least one of them passes', aNotB: 'Jose passes and Maria does not' },
  { same: true, intro: (a) => `The probability that the school bus is late on any day is ${a}. Whether it is late on one day does not affect any other day.`, heads: ['Monday', 'Tuesday'], L: [['late', 'on time'], ['late', 'on time']], both: 'the bus is late on both Monday and Tuesday', neither: 'the bus is late on neither day', exactly: 'the bus is late on exactly one of the two days', atleast: 'the bus is late on at least one of the two days', aNotB: 'the bus is late on Monday but not on Tuesday' },
  { same: true, intro: (a) => `A biased spinner lands on red with probability ${a}. It is spun twice.`, heads: ['1st spin', '2nd spin'], L: [['red', 'not red'], ['red', 'not red']], both: 'it lands on red both times', neither: 'it does not land on red either time', exactly: 'it lands on red exactly once', atleast: 'it lands on red at least once', aNotB: 'it lands on red on the first spin only' },
  { same: true, intro: (a) => `Femi scores a penalty with probability ${a}. He takes two penalties.`, heads: ['1st penalty', '2nd penalty'], L: [['score', 'miss'], ['score', 'miss']], both: 'he scores both penalties', neither: 'he misses both penalties', exactly: 'he scores exactly one penalty', atleast: 'he scores at least one penalty', aNotB: 'he scores the first and misses the second' },
  { intro: (a, b) => `On her way to work, Isla goes through two sets of traffic lights. The probability that the first set is red is ${a}. The probability that the second set is red is ${b}. The two sets work independently.`, heads: ['1st lights', '2nd lights'], L: [['red', 'not red'], ['red', 'not red']], both: 'both sets are red', neither: 'neither set is red', exactly: 'exactly one set is red', atleast: 'at least one set is red', aNotB: 'the first set is red and the second is not' },
  { intro: (a, b) => `A factory has two machines, A and B. This week, the probability that machine A breaks down is ${a} and the probability that machine B breaks down is ${b}, independently.`, heads: ['Machine A', 'Machine B'], L: [['breaks', 'works'], ['breaks', 'works']], both: 'both machines break down', neither: 'neither machine breaks down', exactly: 'exactly one machine breaks down', atleast: 'at least one machine breaks down', aNotB: 'machine A breaks down but machine B does not' },
  { intro: (a, b) => `Kai and Lena each shoot one arrow at a target. The probability that Kai hits it is ${a}. The probability that Lena hits it is ${b}.`, heads: ['Kai', 'Lena'], L: [['hit', 'miss'], ['hit', 'miss']], both: 'they both hit the target', neither: 'they both miss', exactly: 'exactly one of them hits the target', atleast: 'at least one of them hits the target', aNotB: 'Kai hits and Lena misses' },
  { same: true, intro: (a) => `The probability that a seed of a certain plant grows is ${a}. Two seeds are planted.`, heads: ['1st seed', '2nd seed'], L: [['grows', 'fails'], ['grows', 'fails']], both: 'both seeds grow', neither: 'neither seed grows', exactly: 'exactly one seed grows', atleast: 'at least one seed grows', aNotB: 'the first seed grows and the second does not' },
  { intro: (a, b) => `A weather forecast says that the probability of rain on Saturday is ${a} and the probability of rain on Sunday is ${b}. Assume the two days are independent.`, heads: ['Saturday', 'Sunday'], L: [['rain', 'dry'], ['rain', 'dry']], both: 'it rains on both days', neither: 'it is dry on both days', exactly: 'it rains on exactly one of the days', atleast: 'it rains on at least one of the days', aNotB: 'it rains on Saturday but not on Sunday' },
  { intro: (a, b) => `The probability that Ravi remembers his PE kit is ${a}. The probability that his sister Uma remembers hers is ${b}. These are independent.`, heads: ['Ravi', 'Uma'], L: [['remembers', 'forgets'], ['remembers', 'forgets']], both: 'they both remember', neither: 'they both forget', exactly: 'exactly one of them remembers', atleast: 'at least one of them remembers', aNotB: 'Ravi remembers and Uma forgets' },
  { intro: (a, b) => `The probability that Sam's flight out is delayed is ${a}. The probability that the flight home is delayed is ${b}, independently.`, heads: ['Flight out', 'Flight home'], L: [['delayed', 'on time'], ['delayed', 'on time']], both: 'both flights are delayed', neither: 'neither flight is delayed', exactly: 'exactly one flight is delayed', atleast: 'at least one flight is delayed', aNotB: 'the flight out is delayed but the flight home is not' },
  { same: true, intro: (a) => `Grace throws darts at a dartboard. The probability that a dart hits the bull is ${a}. She throws two darts.`, heads: ['1st dart', '2nd dart'], L: [['bull', 'not bull'], ['bull', 'not bull']], both: 'both darts hit the bull', neither: 'neither dart hits the bull', exactly: 'exactly one dart hits the bull', atleast: 'at least one dart hits the bull', aNotB: 'only the first dart hits the bull' },
  { intro: (a, b) => `Two football teams play on Saturday. The probability that United win is ${a}. The probability that Rovers win is ${b}. The results are independent.`, heads: ['United', 'Rovers'], L: [['win', 'not win'], ['win', 'not win']], both: 'both teams win', neither: 'neither team wins', exactly: 'exactly one of the teams wins', atleast: 'at least one of the teams wins', aNotB: 'United win and Rovers do not' },
  { intro: (a, b) => `Chen has two alarm clocks. The probability that the first one fails to ring is ${a}. The probability that the second one fails is ${b}, independently.`, heads: ['1st alarm', '2nd alarm'], L: [['fails', 'rings'], ['fails', 'rings']], both: 'both alarms fail', neither: 'neither alarm fails', exactly: 'exactly one alarm fails', atleast: 'at least one alarm fails', aNotB: 'the first alarm fails and the second rings' },
];

const IND_RANGE = {
  Jose: [0.5, 0.95], Monday: [0.05, 0.3], '1st spin': [0.1, 0.9], '1st penalty': [0.6, 0.9], '1st lights': [0.2, 0.6],
  'Machine A': [0.05, 0.3], Kai: [0.3, 0.9], '1st seed': [0.6, 0.95], Saturday: [0.1, 0.8], Ravi: [0.5, 0.95],
  'Flight out': [0.05, 0.4], '1st dart': [0.1, 0.4], United: [0.2, 0.7], '1st alarm': [0.05, 0.3],
};
const rangeOf = (ctx) => IND_RANGE[ctx.heads[0]] || [0.1, 0.9];
/** A probability inside [lo, hi]: tenths, a multiple of 0.05, or a fraction with one of the given denominators. */
function ranged(rng, [lo, hi], kind, dens = [2, 3, 4, 5]) {
  if (kind === 'dec') return frac(int(rng, Math.ceil(lo * 10 - 1e-9), Math.floor(hi * 10 + 1e-9)), 10);
  if (kind === 'dec2') return frac(int(rng, Math.ceil(lo * 20 - 1e-9), Math.floor(hi * 20 + 1e-9)) * 5, 100);
  for (let t = 0; t < 30; t += 1) {
    const den = pick(rng, dens);
    const nlo = Math.max(1, Math.ceil(lo * den - 1e-9)); const nhi = Math.min(den - 1, Math.floor(hi * den + 1e-9));
    if (nlo <= nhi) return frac(int(rng, nlo, nhi), den);
  }
  throw new Error('no fraction in range');
}

/** Random probability pair. */
function probPair(rng, d, ctx) {
  const { same } = ctx;
  const R = rangeOf(ctx);
  const form = pick(rng, size(d, ['dec', 'dec', 'frac'], ['dec', 'frac'], ['frac', 'dec']));
  const mk = () => (form === 'dec' ? ranged(rng, R, 'dec') : ranged(rng, R, 'frac', size(d, [2, 3, 4, 5], [3, 4, 5, 6, 7, 8], [5, 6, 7, 8, 9, 10])));
  const a = mk(); const b = same ? a : mk();
  if (d === 'hard' && form === 'dec' && !same && rng() < 0.6) {
    // one probability to 2 dp (a multiple of 0.05) keeps every answer to at most 3 dp
    const a2 = ranged(rng, R, 'dec2');
    return rng() < 0.5 ? { a: a2, b, form } : { a, b: a2, form };
  }
  return { a, b, form };
}

const EVENTS = {
  both: (a, b) => a.mul(b),
  neither: (a, b) => one.sub(a).mul(one.sub(b)),
  exactly: (a, b) => a.mul(one.sub(b)).add(one.sub(a).mul(b)),
  atleast: (a, b) => one.sub(one.sub(a).mul(one.sub(b))),
  aNotB: (a, b) => a.mul(one.sub(b)),
};
const ev2 = (k, a, b) => EVENTS[k](a, b);

function indWorking(k, a, b, form, ctx) {
  const A = pt(a, form); const B = pt(b, form); const nA = pt(one.sub(a), form); const nB = pt(one.sub(b), form);
  const r = (f) => pt(f, form);
  switch (k) {
    case 'both': return [`Multiply along the branches: $${A} \\times ${B} = ${r(a.mul(b))}$`];
    case 'neither': return [`"Neither" is the bottom path: $${nA} \\times ${nB} = ${r(one.sub(a).mul(one.sub(b)))}$`];
    case 'aNotB': return [`Multiply along the path: $${A} \\times ${nB} = ${r(a.mul(one.sub(b)))}$`];
    case 'exactly': return [
      `Two paths give exactly one: (${ctx.L[0][0]}, ${ctx.L[1][1]}) and (${ctx.L[0][1]}, ${ctx.L[1][0]}).`,
      `$${A} \\times ${nB} = ${r(a.mul(one.sub(b)))}$ and $${nA} \\times ${B} = ${r(one.sub(a).mul(b))}$`,
      `Add the paths: $${r(a.mul(one.sub(b)))} + ${r(one.sub(a).mul(b))} = ${r(ev2(k, a, b))}$`,
    ];
    default: return [
      `"At least one" = everything except "neither": $1 - P(\\text{neither})$.`,
      `$P(\\text{neither}) = ${nA} \\times ${nB} = ${r(one.sub(a).mul(one.sub(b)))}$`,
      `$1 - ${r(one.sub(a).mul(one.sub(b)))} = ${r(ev2(k, a, b))}$`,
    ];
  }
}
function indWrong(k, a, b) {
  const w = [a.add(b), a, b];
  if (k === 'both') w.push(a.add(b).div(2), a.mul(one.sub(b)), one.sub(a.mul(b)));
  if (k === 'neither') w.push(one.sub(a.mul(b)), one.sub(a).add(one.sub(b)), a.mul(b));
  if (k === 'exactly') w.push(a.mul(one.sub(b)), one.sub(a).mul(b), a.mul(b), one.sub(a.mul(b)));
  if (k === 'atleast') w.push(a.mul(b), one.sub(a.mul(b)), one.sub(a).mul(one.sub(b)), a.mul(one.sub(b)).add(one.sub(a).mul(b)));
  if (k === 'aNotB') w.push(a.mul(b), a.add(one.sub(b)), one.sub(a).mul(b));
  return w;
}

function indTree(ctx, a, b, form, hide = []) {
  return treeDiagram({
    headings: ctx.heads,
    first: [{ label: ctx.L[0][0], p: hide.includes('a') ? null : lab(a, form) }, { label: ctx.L[0][1], p: hide.includes('na') ? null : lab(one.sub(a), form) }],
    second: [0, 1].map((i) => [
      { label: ctx.L[1][0], p: hide.includes(`b${i}`) ? null : lab(b, form) },
      { label: ctx.L[1][1], p: hide.includes(`nb${i}`) ? null : lab(one.sub(b), form) },
    ]),
  });
}

export const indRead = gen('prob-tree-ind-read', 'prob-tree-independent', (rng, d) => {
  const ctx = pick(rng, IND_CTX);
  const { a, b, form } = probPair(rng, d, ctx);
  const k = pick(rng, size(d, ['both', 'neither', 'aNotB'], ['both', 'neither', 'exactly', 'aNotB'], ['exactly', 'atleast', 'neither']));
  const ans = ev2(k, a, b);
  if (form === 'dec' && !shortDecimal(ans, 3)) throw new Error('dp');
  return {
    prompt: `${ctx.intro(`$${pt(a, form)}$`, `$${pt(b, form)}$`)}<br>The tree diagram shows the probabilities.<br>Work out the probability that ${ctx[k]}.`,
    visual: indTree(ctx, a, b, form),
    answer: pf(ans, form),
    distractors: probOpts(ans, indWrong(k, a, b), form),
    typed: typedP(ans, form),
    solution: [
      'For one path through the tree, <b>multiply</b> the probabilities along the branches. For several paths, <b>add</b> their results.',
      ...indWorking(k, a, b, form, ctx),
      `Answer: ${pf(ans, form)}`,
    ],
  };
}, { title: 'Use a completed tree diagram (independent events)' });

export const indMissing = gen('prob-tree-ind-missing', 'prob-tree-independent', (rng, d) => {
  const ctx = pick(rng, IND_CTX);
  const { a, b, form } = probPair(rng, d, ctx);
  if (d === 'easy') {
    // What goes in the box?
    const which = pick(rng, ['na', 'nb0', 'nb1', 'b1']);
    const ans = which === 'na' ? one.sub(a) : which === 'b1' ? b : one.sub(b);
    const hide = [which];
    return {
      prompt: `${ctx.intro(`$${pt(a, form)}$`, `$${pt(b, form)}$`)}<br>What probability goes in the empty box on the tree diagram?`,
      visual: indTree(ctx, a, b, form, hide),
      answer: pf(ans, form),
      distractors: probOpts(ans, [which === 'na' ? a : b, which === 'b1' ? one.sub(b) : a, a.mul(b), one.sub(a.mul(b)), which === 'na' ? one.sub(b) : one.sub(a)], form),
      typed: typedP(ans, form),
      solution: [
        'The branches from one point cover every possibility, so their probabilities add up to $1$.',
        which === 'b1' ? `The second event does not depend on the first, so the second set of branches is the same both times: $${pt(b, form)}$.`
          : `$1 - ${pt(which === 'na' ? a : b, form)} = ${pt(ans, form)}$`,
        `Answer: ${pf(ans, form)}`,
      ],
    };
  }
  // A path probability where complements must be filled in first.
  const k = pick(rng, size(d, ['neither', 'aNotB', 'exactly'], ['neither', 'aNotB', 'exactly'], ['exactly', 'atleast', 'neither']));
  const ans = ev2(k, a, b);
  if (form === 'dec' && !shortDecimal(ans, 3)) throw new Error('dp');
  const hide = ['na', 'nb0', 'nb1', ...(d === 'hard' ? ['b1'] : [])];
  return {
    prompt: `${ctx.intro(`$${pt(a, form)}$`, `$${pt(b, form)}$`)}<br>Use the tree diagram to work out the probability that ${ctx[k]}.`,
    visual: indTree(ctx, a, b, form, hide),
    answer: pf(ans, form),
    distractors: probOpts(ans, [...indWrong(k, a, b), a.mul(b)], form),
    typed: typedP(ans, form),
    solution: [
      `Fill in the missing branches first: each pair adds up to $1$, so the "${ctx.L[0][1]}" branch is $1 - ${pt(a, form)} = ${pt(one.sub(a), form)}$ and the second "${ctx.L[1][1]}" branches are $1 - ${pt(b, form)} = ${pt(one.sub(b), form)}$.`,
      ...indWorking(k, a, b, form, ctx),
      `Answer: ${pf(ans, form)}`,
    ],
  };
}, { title: 'Complete a tree diagram, then find a probability' });

export const indWord = gen('prob-tree-ind-word', 'prob-tree-independent', (rng, d) => {
  const ctx = pick(rng, IND_CTX);
  const { a, b, form } = probPair(rng, d, ctx);
  const k = pick(rng, size(d, ['both', 'neither', 'aNotB'], ['both', 'neither', 'exactly', 'atleast'], ['exactly', 'atleast', 'atleast', 'neither']));
  const ans = ev2(k, a, b);
  if (form === 'dec' && !shortDecimal(ans, 3)) throw new Error('dp');
  return {
    prompt: `${ctx.intro(`$${pt(a, form)}$`, `$${pt(b, form)}$`)}<br>Work out the probability that ${ctx[k]}.`,
    answer: pf(ans, form),
    distractors: probOpts(ans, indWrong(k, a, b), form),
    typed: typedP(ans, form),
    solution: [
      `The events are independent, so P(this and that) = P(this) × P(that). A quick tree diagram helps: first branches for ${ctx.heads[0]}, then for ${ctx.heads[1]}.`,
      ...indWorking(k, a, b, form, ctx),
      `Answer: ${pf(ans, form)}`,
    ],
    hint: 'Sketch a tree diagram with two sets of branches.',
  };
}, { title: 'Independent events without a diagram', word: true });

export const indAndRule = gen('prob-tree-ind-and-rule', 'prob-tree-independent', (rng, d) => {
  const kind = pick(rng, size(d, ['coin', 'dice', 'spinnerDice'], ['dice', 'spinnerDice', 'vending', 'biased'], ['biased', 'vending', 'atleast', 'three']));
  if (kind === 'coin') {
    const n = int(rng, 2, 4); const ans = frac(1, 2 ** n);
    return {
      prompt: `A fair coin is thrown ${n} times. What is the probability that it lands on heads every time?`,
      answer: pf(ans), distractors: probOpts(ans, [frac(1, 2 * n), frac(n, 2 ** n), frac(1, n), frac(1, 2), frac(1, n + 1)]), typed: typedP(ans),
      solution: ['Each throw is independent, so multiply.', `$${Array(n).fill('\\frac{1}{2}').join(' \\times ')} = ${ans.tex()}$`, `Answer: ${pf(ans)}`],
    };
  }
  if (kind === 'dice' || kind === 'spinnerDice') {
    const n1 = kind === 'dice' ? 6 : pick(rng, [4, 5, 8]);
    const e1 = kind === 'dice' ? pick(rng, [['a 6', 1], ['an even number', 3], ['a number less than 3', 2], ['a 5 or a 6', 2]]) : pick(rng, [['an even number', Math.floor(n1 / 2)], ['a 1', 1], ['a number greater than 2', n1 - 2]]);
    const e2 = pick(rng, [['a 6', 1], ['an odd number', 3], ['a square number', 2], ['a prime number', 3], ['a number greater than 4', 2]]);
    const p1 = frac(e1[1], n1); const p2 = frac(e2[1], 6);
    const ans = p1.mul(p2);
    const intro = kind === 'dice' ? 'An ordinary fair dice is rolled twice.' : `A fair spinner with ${n1} equal sections numbered 1 to ${n1} is spun and an ordinary fair dice is rolled.`;
    const what = kind === 'dice' ? `${e1[0]} on the first roll and ${e2[0]} on the second roll` : `${e1[0]} on the spinner and ${e2[0]} on the dice`;
    return {
      prompt: `${intro}<br>What is the probability of getting ${what}?`,
      answer: pf(ans), distractors: probOpts(ans, [p1.add(p2), frac(e1[1] + e2[1], n1 + 6), frac(e1[1] * e2[1], n1 + 6), p1, p2, frac(1, n1 * 6)]), typed: typedP(ans),
      solution: [
        `$P(\\text{${e1[0]}}) = ${p1.tex()}$ and $P(\\text{${e2[0]}}) = ${p2.tex()}$.`,
        `The two are independent, so multiply: $${p1.tex()} \\times ${p2.tex()} = ${ans.tex()}$`,
        `Answer: ${pf(ans)}`,
      ],
    };
  }
  if (kind === 'biased') {
    const p = frac(int(rng, 1, 4), pick(rng, [5, 7, 9, 10]));
    if (p.d === 1) throw new Error('int');
    const n = pick(rng, [2, 2, 3]);
    const target = pick(rng, ['six', 'notsix']);
    const q = target === 'six' ? p : one.sub(p);
    let ans = one; for (let i = 0; i < n; i += 1) ans = ans.mul(q);
    const word = n === 2 ? 'twice' : 'three times';
    return {
      prompt: `For a biased dice, $P(6) = ${p.tex()}$.<br>The dice is rolled ${word}. What is the probability that ${target === 'six' ? `it lands on 6 every time` : 'it never lands on 6'}?`,
      answer: pf(ans), distractors: probOpts(ans, [q.mul(n), frac(q.n * n, q.d * n), frac(q.n, q.d * n), frac(q.n ** n, q.d), q, one.sub(ans), target === 'six' ? frac(1, 6 ** n) : one.sub(p.mul(n))]), typed: typedP(ans),
      solution: [
        target === 'six' ? `Each roll: $P(6) = ${p.tex()}$.` : `Each roll: $P(\\text{not } 6) = 1 - ${p.tex()} = ${q.tex()}$.`,
        `Rolls are independent, so multiply: $${Array(n).fill(q.tex()).join(' \\times ')} = ${ans.tex()}$ (square/cube the top <b>and</b> the bottom).`,
        `Answer: ${pf(ans)}`,
      ],
    };
  }
  if (kind === 'vending') {
    const groups = [['drinks', 'juice'], ['snacks', 'fruit bars'], ['meals', 'salads']].map(([g, t]) => {
      const n = int(rng, 4, 11); const k = int(rng, 1, n - 2);
      return { g, t, n, k };
    });
    const ans = groups.reduce((acc, x) => acc.mul(frac(x.k, x.n)), one);
    const form = 'frac';
    return {
      prompt: `A vending machine sells ${listAnd(groups.map((x) => `${x.n} different ${x.g}, ${x.k} of which are ${x.t}`))}.<br>One drink, one snack and one meal are chosen at random. What is the probability of getting a juice, a fruit bar and a salad?`,
      answer: pf(ans, form),
      distractors: probOpts(ans, [frac(sum(groups.map((x) => x.k)), sum(groups.map((x) => x.n))), groups.reduce((acc, x) => acc.add(frac(x.k, x.n)), frac(0)), frac(groups[0].k * groups[1].k * groups[2].k, sum(groups.map((x) => x.n))), frac(1, groups[0].n * groups[1].n * groups[2].n), frac(groups[0].k, groups[0].n)], form),
      typed: typedP(ans),
      solution: [
        `$P(\\text{juice}) = \\frac{${groups[0].k}}{${groups[0].n}}$, $P(\\text{fruit bar}) = \\frac{${groups[1].k}}{${groups[1].n}}$, $P(\\text{salad}) = \\frac{${groups[2].k}}{${groups[2].n}}$`,
        `The choices are independent, so multiply: $\\frac{${groups[0].k} \\times ${groups[1].k} \\times ${groups[2].k}}{${groups[0].n} \\times ${groups[1].n} \\times ${groups[2].n}} = \\frac{${groups[0].k * groups[1].k * groups[2].k}}{${groups[0].n * groups[1].n * groups[2].n}}${ans.n !== groups[0].k * groups[1].k * groups[2].k ? ` = ${ans.tex()}` : ''}$`,
        `Answer: ${pf(ans, form)}`,
      ],
    };
  }
  if (kind === 'three') {
    const ps = [frac(int(rng, 1, 3), 10), frac(int(rng, 1, 3), 10), frac(int(rng, 1, 3), 10)];
    const who = names(rng, 3);
    const ans = ps.reduce((acc, p) => acc.mul(one.sub(p)), one);
    return {
      prompt: `${listAnd(who.map((n, i) => `the probability that ${n} is late for school is $${tnum(ps[i].value())}$`)).replace(/^t/, 'T')}. These are independent.<br>Work out the probability that none of them is late.`,
      answer: pf(ans, 'dec'),
      distractors: probOpts(ans, [one.sub(ps[0].mul(ps[1]).mul(ps[2])), ps.reduce((acc, p) => acc.add(one.sub(p)), frac(0)).div(3), ps[0].mul(ps[1]).mul(ps[2]), one.sub(ps.reduce((acc, p) => acc.add(p), frac(0))), one.sub(ps[0]).mul(one.sub(ps[1]))], 'dec'),
      typed: typedP(ans, 'dec'),
      solution: [
        `P(not late): ${who.map((n, i) => `${n} $${tnum(1 - ps[i].value())}$`).join(', ')}.`,
        `Multiply: $${ps.map((p) => tnum(one.sub(p).value())).join(' \\times ')} = ${tnum(ans.value())}$`,
        `Answer: ${pf(ans, 'dec')}`,
      ],
    };
  }
  // at least one six in n rolls
  const n = pick(rng, [2, 3]);
  const q = frac(5, 6);
  let none = one; for (let i = 0; i < n; i += 1) none = none.mul(q);
  const ans = one.sub(none);
  return {
    prompt: `An ordinary fair dice is rolled ${n === 2 ? 'twice' : 'three times'}. What is the probability of getting <b>at least one</b> 6?`,
    answer: pf(ans),
    distractors: probOpts(ans, [frac(n, 6), none, frac(1, 6 ** n), one.sub(frac(1, 6 ** n)), frac(n, 6).sub(frac(1, 36)), frac(1, 6).mul(frac(5, 6)).mul(n)]),
    typed: typedP(ans),
    solution: [
      '"At least one 6" = 1 − P(no 6s).',
      `$P(\\text{no 6s}) = ${Array(n).fill('\\frac{5}{6}').join(' \\times ')} = ${none.tex()}$`,
      `$1 - ${none.tex()} = ${ans.tex()}$`,
      `Answer: ${pf(ans)}`,
    ],
  };
}, { title: 'The AND rule for repeated or combined independent events' });

export const indGame = gen('prob-tree-ind-game', 'prob-tree-independent', (rng, d) => {
  const kind = pick(rng, size(d, ['bags', 'rollAgain'], ['rollAgain', 'bags', 'bags'], ['rollAgain', 'bags']));
  if (kind === 'bags') {
    const [aY, aN] = [int(rng, 1, 5), int(rng, 1, 5)]; const [bY, bN] = [int(rng, 1, 4), int(rng, 3, 9)];
    const pA = frac(aY, aY + aN); const pB = frac(bY, bY + bN);
    const pWin = pA.mul(pB);
    const round = [100, 120, 150, 180, 200, 240, 250, 300, 360, 400, 450, 500, 600, 720, 800, 900, 1000, 1200].filter((x) => x % pWin.d === 0);
    const players = round.length ? pick(rng, round) : pWin.d * int(rng, 2, Math.max(2, Math.floor(600 / pWin.d)));
    if (players < 20 || players > 2000) throw new Error('players');
    const ans = pWin.mul(players).value();
    return {
      prompt: `In a game there are two bags of cards. Each card says Yes or No.${table([['', 'Yes', 'No'], ['Bag A', String(aY), String(aN)], ['Bag B', String(bY), String(bN)]], { firstColHeader: true })}A player picks one card at random from each bag, then puts them back. To win a prize, both cards must say Yes.<br>${num(players)} people each play the game once. How many prizes would you expect to be won?`,
      visual: d === 'easy' ? treeDiagram({ headings: ['Bag A', 'Bag B'], first: [{ label: 'Yes', p: pA }, { label: 'No', p: one.sub(pA) }], second: [{ label: 'Yes', p: pB }, { label: 'No', p: one.sub(pB) }] }) : undefined,
      answer: num(ans),
      distractors: countOpts(ans, [pA.add(pB).mul(players).value(), pA.mul(players).value(), pB.mul(players).value(), Math.round(frac(aY + bY, aY + aN + bY + bN).mul(players).value()), Math.round(players / 4)]),
      typed: { kind: 'number', value: ans },
      solution: [
        `$P(\\text{Yes from A}) = ${pA.tex()}$ and $P(\\text{Yes from B}) = ${pB.tex()}$.`,
        `$P(\\text{win}) = ${pA.tex()} \\times ${pB.tex()} = ${pWin.tex()}$`,
        `Expected prizes: $${pWin.tex()} \\times ${num(players).replace(',', '{,}')} = ${ans}$`,
        `Answer: ${num(ans)}`,
      ],
    };
  }
  // Roll again game (unequal tree): win / lose / roll again then odd wins.
  const win1 = int(rng, 1, 2); const lose1 = int(rng, 1, 2);
  const again = 6 - win1 - lose1;
  const winNums = [1, 2].slice(0, win1); const loseNums = [3, 4].slice(0, lose1).map((x) => x - (2 - win1));
  const againNums = [1, 2, 3, 4, 5, 6].filter((x) => !winNums.includes(x) && !loseNums.includes(x));
  const second = pick(rng, [['an odd number', 3], ['a 6', 1], ['a number greater than 2', 4], ['a prime number', 3]]);
  const p2 = frac(second[1], 6);
  const pWin = frac(win1, 6).add(frac(again, 6).mul(p2));
  const who = pick(rng, names(rng, 3));
  const ask = d === 'hard' ? 'lose' : 'win';
  const ans = ask === 'win' ? pWin : one.sub(pWin);
  const fmt = (xs) => (xs.length === 1 ? `${xs[0]}` : `${listAnd(xs.map(String), 'or')}`);
  return {
    prompt: `${who} plays a game with an ordinary fair dice.<br>&nbsp;&nbsp;If ${who} rolls ${fmt(winNums)}, ${who} wins.<br>&nbsp;&nbsp;If ${who} rolls ${fmt(loseNums)}, ${who} loses.<br>&nbsp;&nbsp;If ${who} rolls ${fmt(againNums)}, ${who} rolls again. On the second roll, ${second[0]} wins and anything else loses.<br>Work out the probability that ${who} ${ask}s.`,
    visual: d === 'easy' ? treeDiagram({ headings: ['1st roll', '2nd roll'], first: [{ label: 'Win', p: frac(win1, 6) }, { label: 'Lose', p: frac(lose1, 6) }, { label: 'Roll again', p: frac(again, 6) }], second: [null, null, [{ label: 'Win', p: p2 }, { label: 'Lose', p: one.sub(p2) }]] }) : undefined,
    answer: pf(ans),
    distractors: probOpts(ans, [
      ask === 'win' ? frac(win1, 6).add(p2) : frac(lose1, 6).add(one.sub(p2)), // added instead of multiplying
      ask === 'win' ? frac(win1, 6) : frac(lose1, 6), // forgot the second roll
      ask === 'win' ? frac(again, 6).mul(p2) : frac(again, 6).mul(one.sub(p2)),
      one.sub(ans), frac(1, 2), frac(win1 + second[1], 12),
    ]),
    typed: typedP(ans),
    solution: [
      `First roll: $P(\\text{win}) = \\frac{${win1}}{6}$, $P(\\text{lose}) = \\frac{${lose1}}{6}$, $P(\\text{roll again}) = \\frac{${again}}{6}$. Second roll: $P(\\text{win}) = ${p2.tex()}$.`,
      ask === 'win' ? `Win straight away, or roll again <b>and</b> win: $\\frac{${win1}}{6} + \\frac{${again}}{6} \\times ${p2.tex()} = \\frac{${win1}}{6} + ${frac(again, 6).mul(p2).tex()}$`
        : `Lose straight away, or roll again <b>and</b> lose: $\\frac{${lose1}}{6} + \\frac{${again}}{6} \\times ${one.sub(p2).tex()} = \\frac{${lose1}}{6} + ${frac(again, 6).mul(one.sub(p2)).tex()}$`,
      `$= ${ans.tex()}$`,
      `Answer: ${pf(ans)}`,
    ],
  };
}, { title: 'Games with a tree diagram: expected winners, roll again' });

export const indReverse = gen('prob-tree-ind-reverse', 'prob-tree-independent', (rng, d) => {
  const ctx = pick(rng, IND_CTX.filter((c) => (d === 'hard' ? true : !c.same)));
  const kind = ctx.same ? 'same' : pick(rng, size(d, ['both'], ['both', 'aNotB'], ['aNotB', 'neither', 'both']));
  if (kind === 'same') {
    const a = ranged(rng, rangeOf(ctx), 'dec');
    const both = a.mul(a);
    return {
      prompt: `${ctx.intro('$p$', '$p$')}<br>The probability that ${ctx.both} is $${tnum(both.value())}$.<br>Work out the value of $p$.`,
      answer: pf(a, 'dec'),
      distractors: probOpts(a, [both, both.div(2), one.sub(a), one.sub(both), a.add(frac(1, 10)), a.sub(frac(1, 10)), both.mul(2)], 'dec'),
      typed: typedP(a, 'dec'),
      solution: [`$p \\times p = p^2 = ${tnum(both.value())}$`, `$p = \\sqrt{${tnum(both.value())}} = ${tnum(a.value())}$`, `Answer: $${tnum(a.value())}$`],
    };
  }
  const a = ranged(rng, rangeOf(ctx), 'dec'); const b = ranged(rng, rangeOf(ctx), 'dec');
  const given = ev2(kind, a, b);
  const ans = b;
  const working = kind === 'both' ? [`$${tnum(a.value())} \\times p = ${tnum(given.value())}$`, `$p = ${tnum(given.value())} \\div ${tnum(a.value())} = ${tnum(b.value())}$`]
    : kind === 'aNotB' ? [`$${tnum(a.value())} \\times (1 - p) = ${tnum(given.value())}$, so $1 - p = ${tnum(given.value())} \\div ${tnum(a.value())} = ${tnum(one.sub(b).value())}$`, `$p = 1 - ${tnum(one.sub(b).value())} = ${tnum(b.value())}$`]
      : [`$(1 - ${tnum(a.value())}) \\times (1 - p) = ${tnum(given.value())}$, so $1 - p = ${tnum(given.value())} \\div ${tnum(one.sub(a).value())} = ${tnum(one.sub(b).value())}$`, `$p = 1 - ${tnum(one.sub(b).value())} = ${tnum(b.value())}$`];
  return {
    prompt: `${ctx.intro(`$${tnum(a.value())}$`, '$p$')}<br>The probability that ${ctx[kind]} is $${tnum(given.value())}$.<br>Work out the value of $p$.`,
    answer: pf(ans, 'dec'),
    distractors: probOpts(ans, [one.sub(b), given, given.add(a), a.sub(given), a, one.sub(a)], 'dec'),
    typed: typedP(ans, 'dec'),
    solution: ['The events are independent, so the probability of a path is the product of its branches. Write an equation.', ...working, `Answer: $${tnum(ans.value())}$`],
  };
}, { title: 'Work backwards from P(A and B)', learn: ['prob-tree-independent', 'alg-solve-one-two-step'] });

/* ================================================================== */
/* Dependent events (without replacement)                              */
/* ================================================================== */

const DEP_CTX = [
  { intro: (c) => `A bag contains ${c}. Two counters are taken at random, without replacement.`, item: 'counter', kinds: ['red', 'blue', 'green', 'yellow'], noun: (k, n) => `${n} ${k} ${n === 1 ? 'counter' : 'counters'}` },
  { intro: (c) => `A box contains ${c}. Ella eats two chocolates, chosen at random.`, item: 'chocolate', kinds: ['milk', 'dark', 'white'], noun: (k, n) => `${n} ${k} ${n === 1 ? 'chocolate' : 'chocolates'}` },
  { intro: (c) => `A drawer contains ${c}. Tom takes out two socks at random in the dark.`, item: 'sock', kinds: ['black', 'white', 'grey'], noun: (k, n) => `${n} ${k} ${n === 1 ? 'sock' : 'socks'}` },
  { intro: (c) => `A pencil case contains ${c}. Kai takes two pens at random.`, item: 'pen', kinds: ['blue', 'black', 'red'], noun: (k, n) => `${n} ${k} ${n === 1 ? 'pen' : 'pens'}` },
  { intro: (c) => `A team has ${c}. Two players are chosen at random to be captain and vice-captain.`, item: 'player', kinds: ['girls', 'boys'], noun: (k, n) => `${n} ${n === 1 ? k.replace(/s$/, '') : k}`, person: true },
  { intro: (c) => `A packet contains ${c}. Sam eats two sweets, chosen at random one after the other.`, item: 'sweet', kinds: ['orange', 'lemon', 'lime'], noun: (k, n) => `${n} ${k} ${n === 1 ? 'sweet' : 'sweets'}` },
  { intro: (c) => `In a box of batteries there are ${c}. Two batteries are taken at random.`, item: 'battery', kinds: ['working', 'faulty'], noun: (k, n) => `${n} ${k} ${n === 1 ? 'battery' : 'batteries'}` },
  { intro: (c) => `A fruit bowl has ${c}. Priya takes two pieces of fruit at random.`, item: 'piece of fruit', kinds: ['apples', 'pears', 'plums'], noun: (k, n) => `${n} ${n === 1 ? k.replace(/s$/, '') : k}`, nounKinds: true },
  { intro: (c) => `A jar contains ${c}. Two marbles are taken out at random, without replacement.`, item: 'marble', kinds: ['red', 'blue', 'clear'], noun: (k, n) => `${n} ${k} ${n === 1 ? 'marble' : 'marbles'}` },
  { intro: (c) => `There are ${c} in a raffle. Two different winning tickets are drawn at random.`, item: 'ticket', kinds: ['pink', 'green', 'yellow'], noun: (k, n) => `${n} ${k} ${n === 1 ? 'ticket' : 'tickets'}` },
  { intro: (c) => `A class has ${c}. Two students are chosen at random to read in assembly.`, item: 'student', kinds: ['boys', 'girls'], noun: (k, n) => `${n} ${n === 1 ? k.replace(/s$/, '') : k}`, person: true },
  { intro: (c) => `A shelf has ${c}. Jamal picks two books at random to take on holiday.`, item: 'book', kinds: ['fiction', 'non-fiction'], noun: (k, n) => `${n} ${k} ${n === 1 ? 'book' : 'books'}` },
  { intro: (c) => `A tin has ${c}. Two biscuits are taken at random.`, item: 'biscuit', kinds: ['chocolate', 'plain', 'ginger'], noun: (k, n) => `${n} ${k} ${n === 1 ? 'biscuit' : 'biscuits'}` },
];

/** What the kinds differ by: colour, flavour, type, kind of fruit, gender. */
const attr = (ctx, plural = false) => {
  const w = ctx.person ? 'gender' : ctx.nounKinds ? (plural ? 'kinds of fruit' : 'kind of fruit')
    : ['chocolate', 'biscuit', 'sweet'].includes(ctx.item) ? 'flavour' : ['book', 'battery'].includes(ctx.item) ? 'type' : 'colour';
  return plural && !w.startsWith('kinds') ? `${w}s` : w;
};
const kindWord = (ctx, k) => (ctx.nounKinds || ctx.person ? k.replace(/s$/, '') : k);
const kindPlural = (ctx, k) => (ctx.nounKinds || ctx.person ? k : `${k} ${ctx.item === 'piece of fruit' ? 'pieces' : ctx.item.replace(/y$/, 'ie')}s`);

export const depBagTwo = gen('prob-dep-bag-two', 'prob-tree-dependent', (rng, d) => {
  const ctx = pick(rng, DEP_CTX);
  const nk = Math.min(ctx.kinds.length, size(d, 2, 2, pick(rng, [2, 3])));
  const kinds = sample(rng, ctx.kinds, nk);
  const counts = kinds.map(() => int(rng, size(d, 2, 3, 3), size(d, 6, 8, 9)));
  const n = sum(counts);
  const [K0, K1] = kinds; const [c0, c1] = counts;
  const P2 = (x, y) => frac(x, n).mul(frac(y, n - 1));
  const sameAll = counts.reduce((acc, c) => acc.add(P2(c, c - 1)), frac(0));
  const modes = size(d, ['both0', 'both1'], ['both0', 'same', 'diff01'], nk === 3 ? ['same', 'diff', 'atleast0'] : ['same', 'diff01', 'atleast0']);
  const mode = pick(rng, modes);
  let ans; let txt; let steps; const wrong = [];
  const art = (w) => (ctx.person || ctx.nounKinds ? `${/^[aeiou]/.test(w) ? 'an' : 'a'} ${w}` : w);
  const w0 = art(kindWord(ctx, K0)); const w1 = art(kindWord(ctx, K1));
  if (mode === 'both0' || mode === 'both1') {
    const [K, c] = mode === 'both0' ? [K0, c0] : [K1, c1];
    ans = P2(c, c - 1); txt = `both ${ctx.item === 'piece of fruit' ? 'pieces of fruit' : `${ctx.item.replace(/y$/, 'ie')}s`} are ${kindWord(ctx, K)}${ctx.nounKinds ? 's' : ''}`.replace('both players are girl', 'both players are girls').replace('both players are boy', 'both players are boys').replace('both students are girl', 'both students are girls').replace('both students are boy', 'both students are boys');
    steps = [`First: $\\frac{${c}}{${n}}$. After one has gone there are ${c - 1} left out of ${n - 1}: $\\frac{${c - 1}}{${n - 1}}$.`, `$\\frac{${c}}{${n}} \\times \\frac{${c - 1}}{${n - 1}} = \\frac{${c * (c - 1)}}{${n * (n - 1)}}${ans.n !== c * (c - 1) ? ` = ${ans.tex()}` : ''}$`];
    wrong.push(frac(c * c, n * n), frac(c * (c - 1), n * n), frac(c, n).add(frac(c - 1, n - 1)), frac(c - 1, n - 1), frac(c, n).mul(frac(c, n - 1)));
  } else if (mode === 'same') {
    ans = sameAll; txt = `both are the same ${attr(ctx)}`;
    if (ctx.item === 'battery') txt = 'both batteries are the same type (both working or both faulty)';
    steps = [`Same means ${kinds.map((k) => `both ${kindWord(ctx, k)}`).join(' or ')}.`, ...counts.map((c, i) => `Both ${kindWord(ctx, kinds[i])}: $\\frac{${c}}{${n}} \\times \\frac{${c - 1}}{${n - 1}} = \\frac{${c * (c - 1)}}{${n * (n - 1)}}$`), `Add: $\\frac{${counts.map((c) => c * (c - 1)).reduce((a, b) => a + b, 0)}}{${n * (n - 1)}}${ans.n !== counts.map((c) => c * (c - 1)).reduce((a, b) => a + b, 0) ? ` = ${ans.tex()}` : ''}$`];
    wrong.push(counts.reduce((acc, c) => acc.add(frac(c * c, n * n)), frac(0)), P2(c0, c0 - 1), counts.reduce((acc, c) => acc.add(frac(c * (c - 1), n * n)), frac(0)), one.sub(sameAll).div(2));
  } else if (mode === 'diff01' || mode === 'diff') {
    if (mode === 'diff') { ans = one.sub(sameAll); txt = `the two ${ctx.item === 'piece of fruit' ? 'pieces of fruit' : `${ctx.item.replace(/y$/, 'ie')}s`} are different ${attr(ctx, true)}`; steps = [`It is easier to use $1 - P(\\text{same})$.`, `$P(\\text{same}) = ${counts.map((c) => `\\frac{${c}}{${n}} \\times \\frac{${c - 1}}{${n - 1}}`).join(' + ')} = ${sameAll.tex()}$`, `$1 - ${sameAll.tex()} = ${ans.tex()}$`]; wrong.push(sameAll, one.sub(counts.reduce((acc, c) => acc.add(frac(c * c, n * n)), frac(0)))); }
    else {
      ans = P2(c0, c1).mul(2); txt = `one is ${w0} and one is ${w1}`;
      steps = [`Two orders: ${kindWord(ctx, K0)} then ${kindWord(ctx, K1)}, or ${kindWord(ctx, K1)} then ${kindWord(ctx, K0)}.`, `$\\frac{${c0}}{${n}} \\times \\frac{${c1}}{${n - 1}} + \\frac{${c1}}{${n}} \\times \\frac{${c0}}{${n - 1}} = \\frac{${2 * c0 * c1}}{${n * (n - 1)}}${ans.n !== 2 * c0 * c1 ? ` = ${ans.tex()}` : ''}$`];
      wrong.push(P2(c0, c1), frac(2 * c0 * c1, n * n), frac(c0 * c1, n * n), frac(c0, n).add(frac(c1, n - 1)));
    }
  } else {
    ans = one.sub(P2(n - c0, n - c0 - 1)); txt = `at least one is ${w0}`;
    steps = [`At least one ${kindWord(ctx, K0)} $= 1 - P(\\text{no ${kindWord(ctx, K0)}})$.`, `$P(\\text{no ${kindWord(ctx, K0)}}) = \\frac{${n - c0}}{${n}} \\times \\frac{${n - c0 - 1}}{${n - 1}} = ${P2(n - c0, n - c0 - 1).tex()}$`, `$1 - ${P2(n - c0, n - c0 - 1).tex()} = ${ans.tex()}$`];
    wrong.push(one.sub(frac((n - c0) ** 2, n * n)), P2(c0, c0 - 1), frac(c0, n).mul(2), P2(n - c0, n - c0 - 1));
  }
  const list = listAnd(kinds.map((k, i) => ctx.noun(k, counts[i])));
  return {
    prompt: `${ctx.intro(list)}<br>Work out the probability that ${txt}.`,
    answer: pf(ans),
    distractors: probOpts(ans, wrong),
    typed: typedP(ans),
    solution: [
      `Without replacement: after the first is taken there are only ${n - 1} left, and one fewer of that kind.`,
      ...steps,
      `Answer: ${pf(ans)}`,
    ],
    hint: 'Draw a tree diagram. The second set of fractions has denominator one less.',
  };
}, { title: 'Two items without replacement', word: true });

export const depTreeMissing = gen('prob-dep-tree-missing', 'prob-tree-dependent', (rng, d) => {
  const ctx = pick(rng, DEP_CTX.filter((c) => !c.person));
  const kinds = sample(rng, ctx.kinds, 2);
  const counts = [int(rng, 3, 9), int(rng, 2, 8)];
  const n = sum(counts);
  const [c0, c1] = counts;
  const w = kinds.map((k) => cap(kindWord(ctx, k)));
  // second-stage probabilities as unsimplified n-1 fractions (as students write them)
  const second = [[frac(c0 - 1, n - 1), frac(c1, n - 1)], [frac(c0, n - 1), frac(c1 - 1, n - 1)]];
  const secondRaw = [[rawFrac(c0 - 1, n - 1), rawFrac(c1, n - 1)], [rawFrac(c0, n - 1), rawFrac(c1 - 1, n - 1)]];
  const boxI = int(rng, 0, 1); const boxJ = int(rng, 0, 1);
  const ask = d === 'easy' ? 'box' : 'path';
  const list = listAnd(kinds.map((k, i) => ctx.noun(k, counts[i])));
  if (ask === 'box') {
    const ans = second[boxI][boxJ];
    const visual = treeDiagram({
      headings: ['1st', '2nd'],
      first: [{ label: w[0], p: rawFrac(c0, n) }, { label: w[1], p: rawFrac(c1, n) }],
      second: [0, 1].map((i) => [0, 1].map((j) => ({ label: w[j], p: i === boxI && j === boxJ ? null : secondRaw[i][j] }))),
    });
    return {
      prompt: `${ctx.intro(list)}<br>Here is a tree diagram. What probability goes in the empty box?`,
      visual,
      answer: pf(ans),
      distractors: probOpts(ans, [frac(counts[boxJ], n), frac(counts[boxJ] - (boxI === boxJ ? 0 : 1), n - 1), frac(counts[boxJ] - 1, n), frac(counts[boxJ] + 1, n - 1), one.sub(ans), frac(counts[boxJ], n + 1)]),
      typed: typedP(ans),
      solution: [
        `After ${/^[aeiou]/.test(kindWord(ctx, kinds[boxI])) ? 'an' : 'a'} ${kindWord(ctx, kinds[boxI])}${ctx.nounKinds ? '' : ` ${ctx.item}`} is taken, there are ${n - 1} left.`,
        `Number of ${kindPlural(ctx, kinds[boxJ])} left: ${boxI === boxJ ? `$${counts[boxJ]} - 1 = ${counts[boxJ] - 1}$` : counts[boxJ]}.`,
        `So the probability is $\\frac{${boxI === boxJ ? counts[boxJ] - 1 : counts[boxJ]}}{${n - 1}}${ans.n !== (boxI === boxJ ? counts[boxJ] - 1 : counts[boxJ]) ? ` = ${ans.tex()}` : ''}$.`,
        `Answer: ${pf(ans)}`,
      ],
    };
  }
  // Path question with the second stage left blank.
  const i = int(rng, 0, 1); const j = d === 'hard' ? 1 - i : int(rng, 0, 1);
  const pathP = frac(counts[i], n).mul(second[i][j]);
  const visual = treeDiagram({
    headings: ['1st', '2nd'],
    first: [{ label: w[0], p: rawFrac(c0, n) }, { label: w[1], p: null }],
    second: [0, 1].map(() => [0, 1].map((jj) => ({ label: w[jj], p: null }))),
  });
  const ans = d === 'hard' ? pathP.mul(2) : pathP;
  return {
    prompt: `${ctx.intro(list)}<br>Fill in the missing probabilities on the tree diagram, then work out the probability that ${d === 'hard' ? `one is ${kindWord(ctx, kinds[0])} and one is ${kindWord(ctx, kinds[1])}` : `the first is ${kindWord(ctx, kinds[i])} and the second is ${kindWord(ctx, kinds[j])}`}.`,
    visual,
    answer: pf(ans),
    distractors: probOpts(ans, [frac(counts[i] * counts[j], n * n).mul(d === 'hard' ? 2 : 1), frac(counts[i], n).mul(frac(counts[j], n - 1)).mul(d === 'hard' ? 1 : 1).add(i === j ? frac(0) : frac(0)), frac(counts[i], n).add(second[i][j]), frac(counts[i] * counts[j], n * (n - 1)), pathP.mul(d === 'hard' ? 1 : 2)]),
    typed: typedP(ans),
    solution: [
      `Second-stage branches have denominator ${n - 1}. After ${/^[aeiou]/.test(kindWord(ctx, kinds[i])) ? 'an' : 'a'} ${kindWord(ctx, kinds[i])}: ${w[0]} $\\frac{${i === 0 ? c0 - 1 : c0}}{${n - 1}}$, ${w[1]} $\\frac{${i === 1 ? c1 - 1 : c1}}{${n - 1}}$.`,
      d === 'hard' ? `Two paths: $2 \\times \\frac{${c0}}{${n}} \\times \\frac{${c1}}{${n - 1}} = \\frac{${2 * c0 * c1}}{${n * (n - 1)}}${ans.n !== 2 * c0 * c1 ? ` = ${ans.tex()}` : ''}$`
        : `$\\frac{${counts[i]}}{${n}} \\times \\frac{${i === j ? counts[j] - 1 : counts[j]}}{${n - 1}} = ${pathP.tex()}$`,
      `Answer: ${pf(ans)}`,
    ],
  };
}, { title: 'Tree diagram without replacement: fill in the branches' });

// Conditional tree contexts: first event (A / not A), second depends on first.
const COND_CTX = [
  { intro: (pa, x, y) => `The probability that it rains on a school day is ${pa}. If it rains, the probability that Leo is late is ${x}. If it does not rain, the probability that he is late is ${y}.`, heads: ['Weather', 'Leo'], L: [['rain', 'no rain'], ['late', 'not late']], A: 'it rains', B: 'Leo is late', notB: 'Leo is not late' },
  { intro: (pa, x, y) => `Items made in a factory pass a first check with probability ${pa}. Items that fail are scrapped. Of the items that pass the first check, a proportion ${x} pass the second check; the others are scrapped.`, heads: ['1st check', '2nd check'], L: [['pass', 'fail'], ['pass', 'fail']], A: 'an item passes the first check', B: 'an item passes both checks', scrap: true },
  { intro: (pa, x, y) => `Nadia takes a driving test. The probability that she passes first time is ${pa}. If she fails, she takes it again; the probability that she passes the second time is ${x}.`, heads: ['1st test', '2nd test'], L: [['pass', 'fail'], ['pass', 'fail']], A: 'she passes first time', B: 'she passes within two attempts', retry: true },
  { intro: (pa, x, y) => `The probability that the 7:40 train is on time is ${pa}. If the train is on time, the probability that Ben gets to work before 9 am is ${x}. If it is late, the probability is ${y}.`, heads: ['Train', 'Ben'], L: [['on time', 'late'], ['before 9', 'after 9']], A: 'the train is on time', B: 'Ben gets to work before 9 am', notB: 'Ben gets to work after 9 am' },
  { intro: (pa, x, y) => `A tennis player gets her first serve in with probability ${pa}. When the first serve is in, she wins the point with probability ${x}. Otherwise she wins the point with probability ${y}.`, heads: ['1st serve', 'Point'], L: [['in', 'out'], ['win', 'lose']], A: 'the first serve is in', B: 'she wins the point', notB: 'she loses the point' },
  { intro: (pa, x, y) => `The probability that Wren revises for a test is ${pa}. If she revises, the probability that she passes is ${x}. If she does not revise, the probability that she passes is ${y}.`, heads: ['Revise', 'Test'], L: [['revises', 'does not'], ['pass', 'fail']], A: 'Wren revises', B: 'Wren passes the test', notB: 'Wren fails the test' },
  { intro: (pa, x, y) => `On a summer day, the probability that it is sunny is ${pa}. If it is sunny, the probability that a café sells out of ice cream is ${x}. If it is not sunny, the probability is ${y}.`, heads: ['Weather', 'Ice cream'], L: [['sunny', 'not sunny'], ['sells out', 'does not']], A: 'it is sunny', B: 'the café sells out of ice cream', notB: 'the café does not sell out' },
  { intro: (pa, x, y) => `A football team scores first in a match with probability ${pa}. If they score first, the probability that they win is ${x}. If they do not score first, the probability that they win is ${y}.`, heads: ['Score first?', 'Result'], L: [['yes', 'no'], ['win', 'not win']], A: 'the team scores first', B: 'the team wins', notB: 'the team does not win' },
];

export const depConditionalTree = gen('prob-dep-conditional-tree', 'prob-tree-dependent', (rng, d) => {
  const ctx = pick(rng, COND_CTX);
  const pa = frac(int(rng, size(d, 2, 3, 5), 9), 10);
  let x = frac(int(rng, 1, 9), 10); let y = frac(int(rng, 1, 9), 10);
  if (d === 'hard') { x = frac(int(rng, 70, 99), 100); y = frac(int(rng, 5, 60), 100); }
  if (x.eq(y)) throw new Error('same');
  if (x.value() < y.value() && !ctx.scrap && !ctx.retry) [x, y] = [y, x];
  const pIntro = ctx.intro(`$${tnum(pa.value())}$`, `$${tnum(x.value())}$`, `$${tnum(y.value())}$`);
  let ans; let steps; const wrong = [];
  const form = 'dec';
  const askNot = !ctx.scrap && !ctx.retry && d === 'hard' && rng() < 0.4;
  if (ctx.scrap) {
    ans = one.sub(pa).add(pa.mul(one.sub(x)));
    steps = [`Scrapped = fail the 1st check, <b>or</b> pass the 1st and fail the 2nd.`, `$${tnum(one.sub(pa).value())} + ${tnum(pa.value())} \\times ${tnum(one.sub(x).value())} = ${tnum(one.sub(pa).value())} + ${tnum(pa.mul(one.sub(x)).value())} = ${tnum(ans.value())}$`];
    wrong.push(one.sub(pa).add(one.sub(x)), one.sub(pa).mul(one.sub(x)), pa.mul(one.sub(x)), one.sub(pa), one.sub(pa.mul(x)).sub(frac(1, 100)));
  } else if (ctx.retry) {
    ans = pa.add(one.sub(pa).mul(x));
    steps = ['Pass within two attempts = pass first time, <b>or</b> fail and then pass.', `$${tnum(pa.value())} + ${tnum(one.sub(pa).value())} \\times ${tnum(x.value())} = ${tnum(pa.value())} + ${tnum(one.sub(pa).mul(x).value())} = ${tnum(ans.value())}$`];
    wrong.push(pa.add(x), pa.mul(x), one.sub(pa).mul(x), pa.add(x).sub(pa.mul(x)).add(frac(1, 100)));
  } else {
    const pB = pa.mul(x).add(one.sub(pa).mul(y));
    ans = askNot ? one.sub(pB) : pB;
    steps = [
      `Two paths: ${ctx.A}, or not.`,
      `$${tnum(pa.value())} \\times ${tnum(x.value())} + ${tnum(one.sub(pa).value())} \\times ${tnum(y.value())} = ${tnum(pa.mul(x).value())} + ${tnum(one.sub(pa).mul(y).value())} = ${tnum(pB.value())}$`,
      ...(askNot ? [`So the probability that ${ctx.notB} is $1 - ${tnum(pB.value())} = ${tnum(ans.value())}$.`] : []),
    ];
    wrong.push(pa.mul(x), x.add(y).div(2), pa.mul(x).add(pa.mul(y)), x.mul(y), one.sub(ans), askNot ? one.sub(pa.mul(x)) : pa.mul(x).add(one.sub(pa)));
  }
  if (!shortDecimal(ans, 4)) throw new Error('dp');
  const askTxt = ctx.scrap ? 'an item is scrapped' : ctx.retry ? ctx.B : askNot ? ctx.notB : ctx.B;
  const visual = d === 'hard' ? undefined : treeDiagram({
    headings: ctx.heads,
    first: [{ label: ctx.L[0][0], p: pa.value() }, { label: ctx.L[0][1], p: one.sub(pa).value() }],
    second: ctx.scrap ? [[{ label: ctx.L[1][0], p: x.value() }, { label: ctx.L[1][1], p: one.sub(x).value() }], null]
      : ctx.retry ? [null, [{ label: ctx.L[1][0], p: x.value() }, { label: ctx.L[1][1], p: one.sub(x).value() }]]
        : [[{ label: ctx.L[1][0], p: x.value() }, { label: ctx.L[1][1], p: one.sub(x).value() }], [{ label: ctx.L[1][0], p: y.value() }, { label: ctx.L[1][1], p: one.sub(y).value() }]],
  });
  return {
    prompt: `${pIntro}<br>${visual ? 'The tree diagram shows this information.<br>' : ''}Work out the probability that ${askTxt}.`,
    visual,
    answer: pf(ans, form),
    distractors: probOpts(ans, wrong, form),
    typed: typedP(ans, form),
    solution: ['The second set of branches depends on what happened first, so each has its own probabilities. Multiply along each path, then add the paths you need.', ...steps, `Answer: ${pf(ans, form)}`],
  };
}, { title: 'Tree diagrams where the second event depends on the first' });

export const depNumbers = gen('prob-dep-numbers', 'prob-tree-dependent', (rng, d) => {
  const kind = pick(rng, size(d, ['cards'], ['cards', 'discs'], ['discs', 'cards']));
  let vals; let counts;
  if (kind === 'discs') {
    vals = sample(rng, [11, 22, 33, 44, 5, 10, 15, 20], 3).sort((a, b) => a - b);
    counts = vals.map(() => int(rng, 2, 6));
  } else {
    vals = sample(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9], size(d, 4, 5, 5)).sort((a, b) => a - b);
    counts = vals.map(() => (d === 'hard' ? int(rng, 1, 3) : 1));
  }
  const n = sum(counts);
  const items = vals.flatMap((v, i) => Array(counts[i]).fill(v));
  const ev = pick(rng, [
    { txt: 'the first number is smaller than the second number', f: (a, b) => a < b },
    { txt: 'the two numbers are the same', f: (a, b) => a === b, need: counts.some((c) => c > 1) },
    { txt: `the total of the two numbers is more than ${vals[1] + vals[vals.length - 2]}`, f: (a, b) => a + b > vals[1] + vals[vals.length - 2] },
    { txt: 'the total of the two numbers is even', f: (a, b) => (a + b) % 2 === 0 },
  ].filter((e) => e.need !== false));
  let fav = 0; let favWith = 0;
  items.forEach((a, i) => items.forEach((b, j) => { if (i !== j && ev.f(a, b)) fav += 1; if (ev.f(a, b)) favWith += 1; }));
  const p = frac(fav, n * (n - 1));
  if (p.n === 0 || p.eq(one)) throw new Error('trivial');
  const pWith = frac(favWith, n * n);
  // a pair of values that satisfies the event, for the worked example
  let ex = null;
  vals.forEach((va, ia) => vals.forEach((vb, ib) => { if (!ex && ev.f(va, vb) && (ia !== ib || counts[ia] > 1)) ex = [ia, ib]; }));
  const exTxt = ex ? `e.g. P(first is ${vals[ex[0]]}, second is ${vals[ex[1]]}) $= \\frac{${counts[ex[0]]}}{${n}} \\times \\frac{${counts[ex[1]] - (ex[0] === ex[1] ? 1 : 0)}}{${n - 1}}$` : '';
  return {
    prompt: `These ${n} ${kind === 'discs' ? 'discs' : 'cards'} are in a bag. Two are taken at random, one after the other, without replacement.<br>Work out the probability that ${ev.txt}.`,
    visual: kind === 'discs' ? discs(vals.map((v, i) => Array(counts[i]).fill(String(v)))) : cards(items.map(String)),
    answer: pf(p),
    distractors: probOpts(p, [pWith, frac(fav, n * n), frac(fav / 2, n * (n - 1) / 2).mul(1).add(frac(0)), p.mul(2), p.div(2), one.sub(p)]),
    typed: typedP(p),
    solution: [
      `There are $${n} \\times ${n - 1} = ${n * (n - 1)}$ equally likely ordered pairs (the second item cannot be the same disc or card as the first).`,
      kind === 'discs' ? `Group by value and multiply along each path, ${exTxt}. Add up all the pairs of values that work.` : 'List or count the ordered pairs that work.',
      `Pairs that work: ${fav} out of ${n * (n - 1)}, so $P = \\frac{${fav}}{${n * (n - 1)}}${p.d !== n * (n - 1) ? ` = ${p.tex()}` : ''}$`,
      `Answer: ${pf(p)}`,
    ],
  };
}, { title: 'Two numbered discs or cards without replacement' });

export const depAlgebra = gen('prob-dep-algebra', 'prob-tree-dependent', (rng, d) => {
  const kind = pick(rng, size(d, ['findK'], ['findK', 'findN'], ['findN', 'findK']));
  if (kind === 'findK') {
    // T total, k of a kind, P(both) given -> k
    const T = pick(rng, [10, 12, 15, 16, 20, 25, 30]);
    const k = int(rng, 3, T - 3);
    const p = frac(k * (k - 1), T * (T - 1));
    const who = pick(rng, [['students in a class', 'boys'], ['sweets in a bag', 'red sweets'], ['counters in a bag', 'blue counters'], ['players in a squad', 'defenders'], ['socks in a drawer', 'black socks']]);
    return {
      prompt: `There are ${T} ${who[0]}. $n$ of them are ${who[1]}.<br>Two are chosen at random, without replacement. The probability that both are ${who[1]} is $${p.tex()}$.<br>Work out the value of $n$.`,
      answer: num(k),
      distractors: countOpts(k, [Math.round(p.value() * T), Math.round(Math.sqrt(p.value()) * T), k + 1, k - 1, T - k]),
      typed: { kind: 'number', value: k },
      solution: [
        `$P(\\text{both}) = \\frac{n}{${T}} \\times \\frac{n - 1}{${T - 1}} = \\frac{n(n - 1)}{${T * (T - 1)}}$`,
        `So $\\frac{n(n - 1)}{${T * (T - 1)}} = ${p.tex()}$, giving $n(n - 1) = ${p.tex()} \\times ${T * (T - 1)} = ${k * (k - 1)}$.`,
        `Find two consecutive numbers that multiply to ${k * (k - 1)}: $${k} \\times ${k - 1} = ${k * (k - 1)}$, so $n = ${k}$.`,
        `Answer: ${num(k)}`,
      ],
    };
  }
  // total n unknown, k known
  const k = int(rng, 3, 8);
  let N; let p;
  for (let t = 0; t < 30; t += 1) {
    N = int(rng, k + 2, k + 14);
    p = frac(k * (k - 1), N * (N - 1));
    if (p.d <= 60) break;
  }
  if (p.d > 90) throw new Error('ugly');
  const item = pick(rng, [['orange sweets', 'sweets'], ['red counters', 'counters'], ['gold coins', 'coins'], ['green pens', 'pens']]);
  return {
    prompt: `A bag contains $n$ ${item[1]}. ${k} of them are ${item[0]}.<br>Two ${item[1]} are taken at random without replacement. The probability that both are ${item[0]} is $${p.tex()}$.<br>Work out the value of $n$.`,
    answer: num(N),
    distractors: countOpts(N, [Math.round(Math.sqrt(k * k / p.value())), N + 1, N - 1, k * (k - 1), Math.round(k / Math.sqrt(p.value())) + 2]),
    typed: { kind: 'number', value: N },
    solution: [
      `$\\frac{${k}}{n} \\times \\frac{${k - 1}}{n - 1} = ${p.tex()}$, so $\\frac{${k * (k - 1)}}{n(n - 1)} = ${p.tex()}$.`,
      `$n(n - 1) = ${k * (k - 1)} \\times ${frac(1).div(p).tex()} = ${N * (N - 1)}$, i.e. $n^2 - n - ${N * (N - 1)} = 0$.`,
      `[[alg-solve-quad-factorising|Factorise]]: $(n - ${N})(n + ${N - 1}) = 0$, and $n$ must be positive, so $n = ${N}$.`,
      `Answer: ${num(N)}`,
    ],
  };
}, { title: 'Without replacement with an unknown (forming an equation)', learn: ['prob-tree-dependent', 'alg-solve-quad-factorising'] });

export const depThree = gen('prob-dep-three', 'prob-tree-dependent', (rng, d) => {
  const ctx = pick(rng, DEP_CTX.filter((c) => !c.person));
  const kinds = sample(rng, ctx.kinds.slice(0, 3), Math.min(3, ctx.kinds.length) === 3 && d === 'hard' ? 3 : 2);
  const counts = kinds.map(() => int(rng, 3, 7));
  const n = sum(counts);
  const mode = pick(rng, size(d, ['all0'], ['all0', 'same'], kinds.length === 3 ? ['oneEach', 'same'] : ['same', 'all0']));
  const P3 = (a, b, c) => frac(a, n).mul(frac(b, n - 1)).mul(frac(c, n - 2));
  let ans; let txt; let steps; const wrong = [];
  const w = (k) => kindWord(ctx, k);
  const plural = ctx.item === 'piece of fruit' ? 'pieces of fruit' : `${ctx.item.replace(/y$/, 'ie')}s`;
  if (mode === 'all0') {
    const c = counts[0];
    ans = P3(c, c - 1, c - 2); txt = `all three are ${w(kinds[0])}${ctx.nounKinds ? 's' : ''}`;
    steps = [`$\\frac{${c}}{${n}} \\times \\frac{${c - 1}}{${n - 1}} \\times \\frac{${c - 2}}{${n - 2}} = \\frac{${c * (c - 1) * (c - 2)}}{${n * (n - 1) * (n - 2)}}${ans.n !== c * (c - 1) * (c - 2) ? ` = ${ans.tex()}` : ''}$`];
    wrong.push(frac(c ** 3, n ** 3), frac(c * (c - 1) * (c - 2), n ** 3), frac(c, n).mul(3), frac(c - 2, n - 2));
  } else if (mode === 'same') {
    ans = counts.reduce((acc, c) => acc.add(P3(c, c - 1, c - 2)), frac(0)); txt = `all three are the same ${attr(ctx)}`;
    steps = [...counts.map((c, i) => `All ${w(kinds[i])}: $\\frac{${c} \\times ${c - 1} \\times ${c - 2}}{${n} \\times ${n - 1} \\times ${n - 2}} = \\frac{${c * (c - 1) * (c - 2)}}{${n * (n - 1) * (n - 2)}}$`), `Add: $${ans.tex()}$`];
    wrong.push(counts.reduce((acc, c) => acc.add(frac(c ** 3, n ** 3)), frac(0)), P3(counts[0], counts[0] - 1, counts[0] - 2), counts.reduce((acc, c) => acc.add(P3(c, c, c)), frac(0)));
  } else {
    ans = P3(counts[0], counts[1], counts[2]).mul(6); txt = `there is one of each ${attr(ctx)}`;
    steps = [`One order: $\\frac{${counts[0]}}{${n}} \\times \\frac{${counts[1]}}{${n - 1}} \\times \\frac{${counts[2]}}{${n - 2}} = ${P3(counts[0], counts[1], counts[2]).tex()}$`, `There are $3 \\times 2 \\times 1 = 6$ orders, each with the same probability: $6 \\times ${P3(counts[0], counts[1], counts[2]).tex()} = ${ans.tex()}$`];
    wrong.push(P3(counts[0], counts[1], counts[2]), P3(counts[0], counts[1], counts[2]).mul(3), frac(6 * counts[0] * counts[1] * counts[2], n ** 3));
  }
  const list = listAnd(kinds.map((k, i) => ctx.noun(k, counts[i])));
  return {
    prompt: `${ctx.intro(list).replace(/[Tt]wo ([a-z ]+?)(s)? (are|is)? ?(taken|chosen)/, (m) => m.replace(/[Tt]wo/, 'Three')).replace(/takes (out )?two/, 'takes $1three').replace(/eats two/, 'eats three').replace(/picks two/, 'picks three').replace('Two different winning tickets', 'Three different winning tickets')}<br>Work out the probability that ${txt}.`,
    answer: pf(ans),
    distractors: probOpts(ans, wrong),
    typed: typedP(ans),
    solution: [`Three items without replacement: the denominators go ${n}, ${n - 1}, ${n - 2}.`, ...steps, `Answer: ${pf(ans)}`],
  };
}, { title: 'Three items without replacement' });

/* ================================================================== */
/* Conditional probability                                             */
/* ================================================================== */

const COND2WAY = [
  { intro: 'The table shows how some students travel to school.', one: 'student', rows: ['Boys', 'Girls'], cols: ['Walk', 'Bus', 'Car'], rowOne: { Boys: 'boy', Girls: 'girl' }, rowIs: { Boys: 'is a boy', Girls: 'is a girl' }, colTxt: { Walk: 'walks to school', Bus: 'comes by bus', Car: 'comes by car' }, who: 'students' },
  { intro: 'People leaving a cinema were asked which film they had watched.', one: 'person', rows: ['Adults', 'Children'], cols: ['Comedy', 'Action', 'Cartoon'], rowOne: { Adults: 'adult', Children: 'child' }, rowIs: { Adults: 'is an adult', Children: 'is a child' }, colTxt: { Comedy: 'watched the comedy', Action: 'watched the action film', Cartoon: 'watched the cartoon' }, who: 'people' },
  { intro: 'Some people were asked which device they use more often.', one: 'person', rows: ['Male', 'Female'], cols: ['Laptop', 'Phone'], rowOne: { Male: 'male', Female: 'female' }, rowIs: { Male: 'is male', Female: 'is female' }, colTxt: { Laptop: 'said laptop', Phone: 'said phone' }, who: 'people' },
  { intro: 'Members of a club chose one activity for a trip.', one: 'member', rows: ['Juniors', 'Seniors'], cols: ['Climbing', 'Kayaking', 'Archery'], rowOne: { Juniors: 'junior', Seniors: 'senior' }, rowIs: { Juniors: 'is a junior', Seniors: 'is a senior' }, colTxt: { Climbing: 'chose climbing', Kayaking: 'chose kayaking', Archery: 'chose archery' }, who: 'members' },
  { intro: 'A school recorded which language each Year 9 student studies.', one: 'student', rows: ['Boys', 'Girls'], cols: ['French', 'Spanish', 'German'], rowOne: { Boys: 'boy', Girls: 'girl' }, rowIs: { Boys: 'is a boy', Girls: 'is a girl' }, colTxt: { French: 'studies French', Spanish: 'studies Spanish', German: 'studies German' }, who: 'students' },
  { intro: 'A garage recorded whether cars passed their MOT.', one: 'car', rows: ['Under 5 years old', '5 years or older'], cols: ['Pass', 'Fail'], rowOne: { 'Under 5 years old': 'car under 5 years old', '5 years or older': 'car 5 years old or older' }, rowIs: { 'Under 5 years old': 'is under 5 years old', '5 years or older': 'is 5 years old or older' }, colTxt: { Pass: 'passed', Fail: 'failed' }, who: 'cars' },
  { intro: 'Visitors to a museum were asked how they travelled there.', one: 'visitor', rows: ['Weekday', 'Weekend'], cols: ['Car', 'Train', 'Bus'], rowOne: { Weekday: 'weekday visitor', Weekend: 'weekend visitor' }, rowIs: { Weekday: 'came on a weekday', Weekend: 'came at the weekend' }, colTxt: { Car: 'came by car', Train: 'came by train', Bus: 'came by bus' }, who: 'visitors' },
  { intro: 'Patients at a clinic were asked if they had a flu jab and whether they caught flu.', one: 'patient', rows: ['Had jab', 'No jab'], cols: ['Flu', 'No flu'], rowOne: { 'Had jab': 'patient who had the jab', 'No jab': 'patient who did not have the jab' }, rowIs: { 'Had jab': 'had the jab', 'No jab': 'did not have the jab' }, colTxt: { Flu: 'caught flu', 'No flu': 'did not catch flu' }, who: 'patients' },
];

export const condTwoWay = gen('prob-cond-two-way', 'prob-conditional', (rng, d) => {
  const ctx = pick(rng, COND2WAY);
  const nr = ctx.rows.length; const nc = ctx.cols.length;
  const cells = Array.from({ length: nr }, () => Array.from({ length: nc }, () => int(rng, size(d, 2, 3, 5), size(d, 15, 25, 40))));
  const rowT = cells.map(sum); const colT = Array.from({ length: nc }, (_, j) => sum(cells.map((r) => r[j]))); const T = sum(rowT);
  const i = int(rng, 0, nr - 1); const j = int(rng, 0, nc - 1);
  const byCol = d !== 'easy' && rng() < 0.5;
  const grid = table([['', ...ctx.cols, 'Total'], ...ctx.rows.map((r, a) => [r, ...cells[a].map(String), String(rowT[a])]), ['Total', ...colT.map(String), String(T)]], { firstColHeader: true });
  const cell = cells[i][j];
  const den = byCol ? colT[j] : rowT[i];
  const p = frac(cell, den);
  const { one } = ctx;
  const rIs = ctx.rowIs[ctx.rows[i]]; const cTx = ctx.colTxt[ctx.cols[j]];
  const prompt = byCol
    ? (d === 'hard' ? `One of the ${ctx.who} is chosen at random. Given that the ${one} ${cTx}, what is the probability that the ${one} ${rIs}?`
      : `${cap(an1(one))} who ${cTx} is chosen at random. What is the probability that this ${one} ${rIs}?`)
    : (d === 'hard' ? `One of the ${ctx.who} is chosen at random. Given that the ${one} ${rIs}, what is the probability that the ${one} ${cTx}?`
      : `${cap(an1(ctx.rowOne[ctx.rows[i]]))} is chosen at random. What is the probability that this ${one} ${cTx}?`);
  return {
    prompt: `${ctx.intro}${grid}${prompt}`,
    answer: pf(p),
    distractors: probOpts(p, [frac(cell, T), frac(cell, byCol ? rowT[i] : colT[j]), frac(byCol ? rowT[i] : colT[j], T), frac(den, T), frac(den - cell, den), frac(cell, den + cell)]),
    typed: typedP(p),
    solution: [
      `We only choose from the ${byCol ? `"${ctx.cols[j]}" column` : `"${ctx.rows[i]}" row`}, so the denominator is ${den}, not ${T}.`,
      `Of those ${den}, ${cell} are in the "${byCol ? ctx.rows[i] : ctx.cols[j]}" group.`,
      `$P = \\frac{${cell}}{${den}}${p.d !== den ? ` = ${p.tex()}` : ''}$`,
      `Answer: ${pf(p)}`,
    ],
  };
}, { title: 'Conditional probability from a two-way table' });

function an1(phrase) { return `${/^[aeiou]/i.test(phrase) ? 'an' : 'a'} ${phrase}`; }

const CVENN = [
  { u: 'students in a class', A: ['C', 'own a cat'], B: ['D', 'own a dog'], one: 'student' },
  { u: 'students', A: ['C', 'study Chemistry'], B: ['B', 'study Biology'], one: 'student' },
  { u: 'people at a sports centre', A: ['S', 'swim'], B: ['G', 'use the gym'], one: 'person' },
  { u: 'guests at a wedding', A: ['F', 'chose fish'], B: ['W', 'drank wine'], one: 'guest' },
  { u: 'people in a survey', A: ['T', 'like tea'], B: ['K', 'like coffee'], one: 'person' },
  { u: 'teenagers', A: ['G', 'play video games'], B: ['M', 'play a musical instrument'], one: 'teenager' },
  { u: 'members of a choir', A: ['S', 'sing solo'], B: ['R', 'read music'], one: 'member' },
];

export const condVenn = gen('prob-cond-venn', 'prob-conditional', (rng, d) => {
  const ctx = pick(rng, CVENN);
  const T = pick(rng, size(d, [25, 29, 30, 40], [40, 50, 60, 80], [60, 80, 100, 120]));
  let a; let ab; let b; let out;
  for (let t = 0; t < 50; t += 1) {
    ab = int(rng, 2, Math.round(T * 0.25)); a = int(rng, 2, Math.round(T * 0.35)); b = int(rng, 2, Math.round(T * 0.35));
    out = T - a - ab - b;
    if (out >= 1 && new Set([a, ab, b, out]).size === 4) break;
  }
  if (out < 1) throw new Error('venn');
  const [A, aTxt] = ctx.A; const [B, bTxt] = ctx.B;
  const q = pick(rng, size(d, ['AgivenB', 'BgivenA'], ['AgivenB', 'BgivenA', 'notBgivenA'], ['notBgivenA', 'AgivenNotB', 'BgivenAorB']));
  let num_; let den; let txt; let given;
  if (q === 'AgivenB') { num_ = ab; den = ab + b; given = `${bTxt}`; txt = `they also ${aTxt}`; }
  else if (q === 'BgivenA') { num_ = ab; den = a + ab; given = `${aTxt}`; txt = `they also ${bTxt}`; }
  else if (q === 'notBgivenA') { num_ = a; den = a + ab; given = `${aTxt}`; txt = `they do <b>not</b> ${bTxt}`; }
  else if (q === 'AgivenNotB') { num_ = a; den = a + out; given = `do not ${bTxt}`; txt = `they ${aTxt}`; }
  else { num_ = ab; den = a + ab + b; given = `${aTxt} or ${bTxt} (or both)`; txt = `they do both`; }
  const p = frac(num_, den);
  const prompt = d === 'hard'
    ? `A ${ctx.one} is chosen at random. Given that they ${given}, what is the probability that ${txt}?`
    : `A ${ctx.one} who ${given.replace(/^own/, 'owns').replace(/^study/, 'studies').replace(/^swim/, 'swims').replace(/^use/, 'uses').replace(/^like/, 'likes').replace(/^play/, 'plays').replace(/^sing/, 'sings').replace(/^read/, 'reads').replace(/^do not/, 'does not')} is chosen at random. What is the probability that ${txt}?`;
  return {
    prompt: `The Venn diagram shows information about ${T} ${ctx.u}.<br>$\\xi$ = ${T} ${ctx.u}, &nbsp;${A} = ${ctx.u.split(' ')[0]} who ${aTxt}, &nbsp;${B} = ${ctx.u.split(' ')[0]} who ${bTxt}.<br>${prompt}`,
    visual: venn2({ labels: [A, B], values: { a, ab, b, out } }),
    answer: pf(p),
    distractors: probOpts(p, [frac(num_, T), frac(num_, q === 'AgivenB' ? a + ab : q === 'BgivenA' ? ab + b : T - den), frac(den, T), frac(den - num_, den), frac(num_, den + num_), frac(num_, T - out)]),
    typed: typedP(p),
    solution: [
      `"Given that they ${given}" means we only look inside that group: ${given.startsWith('do not') ? `outside ${B}: $${a} + ${out} = ${den}$` : q === 'BgivenAorB' ? `everyone in ${A} or ${B}: $${a} + ${ab} + ${b} = ${den}$` : `everyone in ${q === 'AgivenB' ? B : A}: $${q === 'AgivenB' ? `${ab} + ${b}` : `${a} + ${ab}`} = ${den}$`}.`,
      `Of these, ${num_} ${q === 'notBgivenA' || q === 'AgivenNotB' ? `are in the "${A} only" region` : `are in the overlap`}.`,
      `$P = \\frac{${num_}}{${den}}${p.d !== den ? ` = ${p.tex()}` : ''}$`,
      `Answer: ${pf(p)}`,
    ],
  };
}, { title: 'Conditional probability from a Venn diagram' });

export const condTreeReverse = gen('prob-cond-tree-reverse', 'prob-conditional', (rng, d) => {
  const kind = pick(rng, size(d, ['same', 'cond'], ['atleastFirst', 'same', 'cond'], ['cond', 'atleast', 'atleastFirst']));
  if (kind !== 'cond') {
    const r = int(rng, 3, 8); const b = int(rng, 2, 7); const n = r + b;
    const col = pick(rng, [['red', 'blue'], ['green', 'yellow'], ['black', 'white']]);
    const [R, B] = col.map((c) => c[0].toUpperCase());
    const RR = frac(r * (r - 1), n * (n - 1)); const BB = frac(b * (b - 1), n * (n - 1));
    const atl = one.sub(BB);
    let p; let txt; let steps; const wrong = [];
    // Conditions are chosen so the answer is never simply a branch of the tree.
    if (kind === 'same') {
      const S = RR.add(BB);
      p = RR.div(S);
      txt = `Given that the two counters are the <b>same colour</b>, what is the probability that they are both ${col[0]}?`;
      steps = [`$P(\\text{same colour}) = P(${R}${R}) + P(${B}${B}) = ${RR.tex()} + ${BB.tex()} = ${S.tex()}$`, `$P(\\text{both ${col[0]}} \\mid \\text{same}) = ${RR.tex()} \\div ${S.tex()} = ${p.tex()}$`];
      wrong.push(RR, frac(r, n), frac(r - 1, n - 1), S, frac(r, r + b + 1), RR.div(frac(r, n)));
    } else if (kind === 'atleastFirst') {
      p = frac(r, n).div(atl);
      txt = `Given that <b>at least one</b> of the counters is ${col[0]}, what is the probability that the <b>first</b> counter is ${col[0]}?`;
      steps = [`$P(\\text{at least one ${col[0]}}) = 1 - P(${B}${B}) = 1 - ${BB.tex()} = ${atl.tex()}$`, `If the first is ${col[0]} there is certainly at least one ${col[0]}, so $P(\\text{1st ${col[0]}} \\text{ and at least one}) = P(\\text{1st ${col[0]}}) = \\frac{${r}}{${n}}$.`, `$\\frac{${r}}{${n}} \\div ${atl.tex()} = ${p.tex()}$`];
      wrong.push(frac(r, n), frac(r - 1, n - 1), RR.div(atl), atl, frac(r, n).mul(atl));
    } else {
      p = RR.div(atl);
      txt = `Given that <b>at least one</b> of the counters is ${col[0]}, what is the probability that both are ${col[0]}?`;
      steps = [`$P(\\text{at least one ${col[0]}}) = 1 - P(${B}${B}) = 1 - ${BB.tex()} = ${atl.tex()}$`, `$P(\\text{both ${col[0]}} \\mid \\text{at least one}) = ${RR.tex()} \\div ${atl.tex()} = ${p.tex()}$`];
      wrong.push(RR, frac(r - 1, n - 1), RR.div(frac(r, n)), atl, frac(r * (r - 1), r * (r - 1) + r * b));
    }
    const branches = [frac(r, n), frac(b, n), frac(r - 1, n - 1), frac(r, n - 1), frac(b, n - 1), frac(b - 1, n - 1)];
    if (branches.some((f) => f.eq(p))) throw new Error('answer would be readable from the tree');
    return {
      prompt: `A bag contains ${r} ${col[0]} counters and ${b} ${col[1]} counters. Two counters are taken at random without replacement.<br>${txt}`,
      visual: d === 'hard' ? undefined : treeDiagram({ headings: ['1st', '2nd'], first: [{ label: cap(col[0]), p: rawFrac(r, n) }, { label: cap(col[1]), p: rawFrac(b, n) }], second: [[{ label: cap(col[0]), p: rawFrac(r - 1, n - 1) }, { label: cap(col[1]), p: rawFrac(b, n - 1) }], [{ label: cap(col[0]), p: rawFrac(r, n - 1) }, { label: cap(col[1]), p: rawFrac(b - 1, n - 1) }]] }),
      answer: pf(p),
      distractors: probOpts(p, wrong),
      typed: typedP(p),
      solution: ['Conditional probability: $P(A \\text{ given } B) = \\dfrac{P(A \\text{ and } B)}{P(B)}$.', ...steps, `Answer: ${pf(p)}`],
    };
  }
  const ctx = pick(rng, COND_CTX.filter((c) => !c.scrap && !c.retry));
  const pa = frac(int(rng, 2, 8), 10);
  const xy = sample(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9], 2).sort((p, q) => q - p);
  const x = frac(xy[0], 10); const y = frac(xy[1], 10);
  const pB = pa.mul(x).add(one.sub(pa).mul(y));
  const p = pa.mul(x).div(pB);
  const form = shortDecimal(p, 3) ? 'dec' : 'frac';
  return {
    prompt: `${ctx.intro(`$${tnum(pa.value())}$`, `$${tnum(x.value())}$`, `$${tnum(y.value())}$`)}<br>Given that ${ctx.B}, what is the probability that ${ctx.A}?${form === 'frac' ? ' Give your answer as a fraction.' : ''}`,
    visual: d === 'easy' ? treeDiagram({ headings: ctx.heads, first: [{ label: ctx.L[0][0], p: pa.value() }, { label: ctx.L[0][1], p: one.sub(pa).value() }], second: [[{ label: ctx.L[1][0], p: x.value() }, { label: ctx.L[1][1], p: one.sub(x).value() }], [{ label: ctx.L[1][0], p: y.value() }, { label: ctx.L[1][1], p: one.sub(y).value() }]] }) : undefined,
    answer: pf(p, form),
    distractors: probOpts(p, [pa.mul(x), x, pa, pB, pa.mul(x).div(pa), one.sub(p), pa.mul(x).div(one.sub(pB))], form),
    typed: typedP(p, form),
    solution: [
      `$P(\\text{${ctx.A}} \\text{ and } \\text{${ctx.B}}) = ${tnum(pa.value())} \\times ${tnum(x.value())} = ${tnum(pa.mul(x).value())}$`,
      `$P(\\text{${ctx.B}}) = ${tnum(pa.mul(x).value())} + ${tnum(one.sub(pa).value())} \\times ${tnum(y.value())} = ${tnum(pB.value())}$`,
      `Given that ${ctx.B}, only those paths count: $\\dfrac{${tnum(pa.mul(x).value())}}{${tnum(pB.value())}} = ${pt(p, form)}$`,
      `Answer: ${pf(p, form)}`,
    ],
  };
}, { title: 'Reverse conditional probability on a tree diagram', learn: ['prob-conditional', 'prob-tree-dependent'] });

export const condVennInfo = gen('prob-cond-venn-info', 'prob-conditional', (rng, d) => {
  const ctx = pick(rng, CVENN);
  const [A, aTxt] = ctx.A; const [B, bTxt] = ctx.B;
  // P(A | B) = p given; Venn shows a (A only), b (B only), out unknown; total T.
  const pr = pick(rng, [frac(1, 3), frac(2, 5), frac(3, 5), frac(1, 4), frac(3, 4), frac(2, 3), frac(3, 8), frac(1, 5)]);
  const m = int(rng, 2, 6);
  const ab = pr.n * m; const b = (pr.d - pr.n) * m;
  const a = int(rng, 4, 30);
  const out = int(rng, 4, 30);
  const T = a + ab + b + out;
  const ask = pick(rng, size(d, ['ab', 'ab'], ['out', 'ab'], ['out', 'pA']));
  const values = { a, ab: '', b, out: '' };
  const intro = `The Venn diagram shows some information about ${T} ${ctx.u}.<br>${A} = ${ctx.u.split(' ')[0]} who ${aTxt}, ${B} = ${ctx.u.split(' ')[0]} who ${bTxt}.<br>A ${ctx.one} who ${bTxt.replace(/^(\w+)/, (w0) => ({ own: 'owns', study: 'studies', swim: 'swims', use: 'uses', like: 'likes', play: 'plays', sing: 'sings', read: 'reads', chose: 'chose', drank: 'drank' }[w0] || w0))} is chosen at random. The probability that they also ${aTxt} is $${pr.tex()}$.`;
  const steps = [`In ${B} there are ${b} + (overlap). The overlap is $${pr.tex()}$ of ${B}, so ${B} only (${b}) is $${one.sub(pr).tex()}$ of ${B}.`, `${B} has $${b} \\div ${one.sub(pr).tex()} = ${ab + b}$ ${ctx.u.split(' ')[0]}, so the overlap is $${ab + b} - ${b} = ${ab}$.`];
  if (ask === 'ab') {
    return {
      prompt: `${intro}<br>How many ${ctx.u.split(' ')[0]} are in both ${A} and ${B}?`,
      visual: venn2({ labels: [A, B], values }),
      answer: num(ab),
      distractors: countOpts(ab, [Math.round(pr.value() * b), Math.round(pr.value() * T), b - ab, Math.round(pr.value() * (a + b)), ab + b]),
      typed: { kind: 'number', value: ab },
      solution: [...steps, `Answer: ${num(ab)}`],
    };
  }
  const p = ask === 'out' ? frac(out, T) : frac(a + ab, T);
  return {
    prompt: `${intro}<br>One of the ${T} ${ctx.u} is chosen at random. Work out the probability that they ${ask === 'out' ? `neither ${aTxt} nor ${bTxt}`.replace('neither own a cat nor own a dog', 'own neither a cat nor a dog') : aTxt}.`,
    visual: venn2({ labels: [A, B], values }),
    answer: pf(p),
    distractors: probOpts(p, ask === 'out' ? [frac(T - a - b, T), frac(T - a - b - Math.round(pr.value() * b), T), frac(out + ab, T), frac(a + b + ab, T), frac(out, T - ab)] : [frac(a, T), frac(a + Math.round(pr.value() * b), T), frac(a + ab, T - out), pr, frac(a + ab + b, T)]),
    typed: typedP(p),
    solution: [...steps, ask === 'out' ? `Neither: $${T} - ${a} - ${ab} - ${b} = ${out}$, so $P = \\frac{${out}}{${T}}${p.d !== T ? ` = ${p.tex()}` : ''}$.` : `In ${A}: $${a} + ${ab} = ${a + ab}$, so $P = \\frac{${a + ab}}{${T}}${p.d !== T ? ` = ${p.tex()}` : ''}$.`, `Answer: ${pf(p)}`],
  };
}, { title: 'Use a given conditional probability to complete a Venn diagram' });

export const condSampleSpace = gen('prob-cond-sample-space', 'prob-conditional', (rng, d) => {
  const kind = pick(rng, size(d, ['dice', 'cards'], ['dice', 'cards', 'children'], ['dice', 'dice', 'children']));
  if (kind === 'dice') {
    const pairs = []; for (let a = 1; a <= 6; a += 1) for (let b = 1; b <= 6; b += 1) pairs.push([a, b]);
    const k = int(rng, 5, 9);
    const given = pick(rng, size(d, [
      { txt: `the total is ${k}`, f: ([a, b]) => a + b === k },
      { txt: 'the total is more than 8', f: ([a, b]) => a + b > 8 },
    ], [
      { txt: `the total is ${k}`, f: ([a, b]) => a + b === k },
      { txt: 'the total is even', f: ([a, b]) => (a + b) % 2 === 0 },
      { txt: 'the total is more than 8', f: ([a, b]) => a + b > 8 },
    ], [
      { txt: 'at least one dice shows a 6', f: ([a, b]) => a === 6 || b === 6 },
      { txt: 'the product of the two numbers is more than 12', f: ([a, b]) => a * b > 12 },
      { txt: 'the difference between the two numbers is 2', f: ([a, b]) => Math.abs(a - b) === 2 },
      { txt: 'the product of the two numbers is odd', f: ([a, b]) => (a * b) % 2 === 1 },
    ]));
    const ev = pick(rng, [
      { txt: 'both dice show the same number (a double)', f: ([a, b]) => a === b },
      { txt: 'at least one dice shows a 6', f: ([a, b]) => a === 6 || b === 6 },
      { txt: 'the first dice shows an odd number', f: ([a]) => a % 2 === 1 },
      { txt: 'one of the dice shows a 4', f: ([a, b]) => a === 4 || b === 4 },
      ...(d === 'hard' ? [{ txt: 'the total is more than 7', f: ([a, b]) => a + b > 7 }, { txt: 'the total is a prime number', f: ([a, b]) => [2, 3, 5, 7, 11].includes(a + b) }] : []),
    ].filter((e) => e.txt !== given.txt));
    const G = pairs.filter(given.f); const F = G.filter(ev.f);
    if (F.length === 0 || F.length === G.length) throw new Error('trivial');
    const p = frac(F.length, G.length);
    return {
      prompt: `Two ordinary fair dice are rolled.<br>Given that ${given.txt}, what is the probability that ${ev.txt}?`,
      visual: d === 'easy' ? sampleGrid('1st', '2nd', [1, 2, 3, 4, 5, 6], [1, 2, 3, 4, 5, 6], (i, j) => i + j + 2) : undefined,
      answer: pf(p),
      distractors: probOpts(p, [frac(F.length, 36), frac(pairs.filter(ev.f).length, 36), frac(G.length, 36), frac(F.length, G.length + 1), frac(G.length - F.length, G.length)]),
      typed: typedP(p),
      solution: [
        `"Given that ${given.txt}" shrinks the sample space to only those outcomes: ${G.map(([a, b]) => `(${a}, ${b})`).join(', ')} – ${G.length} outcomes.`,
        `Of these, the ones where ${ev.txt}: ${F.map(([a, b]) => `(${a}, ${b})`).join(', ')} – that is ${F.length}.`,
        `$P = \\frac{${F.length}}{${G.length}}${p.d !== G.length ? ` = ${p.tex()}` : ''}$`,
        `Answer: ${pf(p)}`,
      ],
    };
  }
  if (kind === 'children') {
    // three coins
    const outs = ['HHH', 'HHT', 'HTH', 'THH', 'HTT', 'THT', 'TTH', 'TTT'];
    const given = pick(rng, [{ txt: 'at least one coin is heads', f: (o) => o.includes('H') }, { txt: 'the first coin is heads', f: (o) => o[0] === 'H' }, { txt: 'exactly two coins are the same', f: (o) => o !== 'HHH' && o !== 'TTT' }]);
    const ev = pick(rng, [{ txt: 'all three coins are heads', f: (o) => o === 'HHH' }, { txt: 'exactly two coins are heads', f: (o) => o.split('H').length - 1 === 2 }, { txt: 'the last coin is tails', f: (o) => o[2] === 'T' }]);
    const G = outs.filter(given.f); const F = G.filter(ev.f);
    if (F.length === 0 || F.length === G.length) throw new Error('trivial');
    const p = frac(F.length, G.length);
    return {
      prompt: `Three fair coins are thrown.<br>Given that ${given.txt}, what is the probability that ${ev.txt}?`,
      answer: pf(p),
      distractors: probOpts(p, [frac(F.length, 8), frac(outs.filter(ev.f).length, 8), frac(F.length, G.length + 1), frac(G.length - F.length, G.length), frac(1, 2)]),
      typed: typedP(p),
      solution: [`All outcomes: ${outs.join(', ')}.`, `Given that ${given.txt}: ${G.join(', ')} – ${G.length} outcomes.`, `Of these, ${F.length} fit: $P = \\frac{${F.length}}{${G.length}}${p.d !== G.length ? ` = ${p.tex()}` : ''}$`, `Answer: ${pf(p)}`],
    };
  }
  // numbered cards 1..N
  const N = pick(rng, [10, 12, 15, 20]);
  const xs = Array.from({ length: N }, (_, i) => i + 1);
  const given = pick(rng, [{ txt: 'the number is even', f: (x) => x % 2 === 0 }, { txt: 'the number is greater than 5', f: (x) => x > 5 }, { txt: 'the number is a multiple of 3', f: (x) => x % 3 === 0 }, { txt: 'the number is odd', f: (x) => x % 2 === 1 }]);
  const ev = pick(rng, [{ txt: 'it is a multiple of 4', f: (x) => x % 4 === 0 }, { txt: 'it is a square number', f: (x) => Number.isInteger(Math.sqrt(x)) }, { txt: 'it is a prime number', f: (x) => x > 1 && xs.slice(1, x - 1).every((q) => x % q) }, { txt: 'it is less than 8', f: (x) => x < 8 }].filter((e) => !e.txt.includes(given.txt.slice(14))));
  const G = xs.filter(given.f); const F = G.filter(ev.f);
  if (F.length === 0 || F.length === G.length) throw new Error('trivial');
  const p = frac(F.length, G.length);
  return {
    prompt: `Cards numbered 1 to ${N} are shuffled and one is taken at random.<br>Given that ${given.txt}, what is the probability that ${ev.txt}?`,
    answer: pf(p),
    distractors: probOpts(p, [frac(F.length, N), frac(xs.filter(ev.f).length, N), frac(F.length, G.length + 1), frac(G.length - F.length, G.length), frac(G.length, N)]),
    typed: typedP(p),
    solution: [`Only the cards where ${given.txt} count: ${G.join(', ')} – ${G.length} cards.`, `Of these, ${F.length} fit (${F.join(', ')}).`, `$P = \\frac{${F.length}}{${G.length}}${p.d !== G.length ? ` = ${p.tex()}` : ''}$`, `Answer: ${pf(p)}`],
  };
}, { title: 'Conditional probability by restricting the sample space' });

export const indArchetypes = [indRead, indMissing, indWord, indAndRule, indGame, indReverse];
export const depArchetypes = [depBagTwo, depTreeMissing, depConditionalTree, depNumbers, depAlgebra, depThree];
export const condArchetypes = [condTwoWay, condVenn, condSampleSpace, condTreeReverse, condVennInfo];

void [shuffle, Frac, gcd, names, listAnd];
