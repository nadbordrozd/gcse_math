// Sample spaces, relative frequency and expected frequency.
import {
  pick, int, sample, shuffle, size, frac, num, tnum, money, names, cap, table, roundTo,
} from '../../core.js';
import { twoSpinners, spinner, sampleGrid } from './diagrams.js';
import {
  pgen as gen, ft, pf, pt, typedP, probOpts, countOpts, listAnd,
} from './util.js';

const isPrime = (n) => n > 1 && [...Array(n).keys()].slice(2).every((d) => n % d);
const isSquare = (n) => n >= 0 && Number.isInteger(Math.sqrt(n));
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

/* ================================================================== */
/* prob-sample-space                                                   */
/* ================================================================== */

const OPS = {
  sum: { f: (a, b) => a + b, word: 'total', how: 'The two numbers are added to give the total.' },
  product: { f: (a, b) => a * b, word: 'product', how: 'The two numbers are multiplied to give the product.' },
  difference: { f: (a, b) => Math.abs(a - b), word: 'difference', how: 'The score is the difference between the two numbers (bigger − smaller).' },
};

/** Events on a score. */
function scoreEvents(rng, scores, word) {
  const vals = [...new Set(scores)].sort((a, b) => a - b);
  const hasZero = vals[0] === 0;
  const mid = vals[Math.floor(vals.length / 2)];
  const k = pick(rng, vals.slice(1, -1));
  return [
    { txt: `a ${word} of ${k}`, f: (s) => s === k, k, kind: 'eq' },
    { txt: `a ${word} greater than ${mid}`, f: (s) => s > mid, slip: (s) => s >= mid, k: mid },
    { txt: `a ${word} less than ${k}`, f: (s) => s < k, slip: (s) => s <= k, k },
    { txt: `an odd ${word}`, f: (s) => s % 2 === 1 },
    ...(hasZero ? [] : [{ txt: `an even ${word}`, f: (s) => s % 2 === 0 }, { txt: `a ${word} that is a square number`, f: (s) => s > 0 && isSquare(s) }]),
    { txt: `a ${word} that is a prime number`, f: isPrime },
    { txt: `a ${word} that is a multiple of 3`, f: (s) => s > 0 && s % 3 === 0 },
  ];
}

export const ssTwoDice = gen('prob-ss-two-dice', 'prob-sample-space', (rng, d) => {
  const opName = pick(rng, size(d, ['sum', 'sum', 'difference'], ['sum', 'product', 'difference'], ['product', 'difference', 'sum']));
  const op = OPS[opName];
  const [m, n] = d === 'hard' && rng() < 0.4 ? pick(rng, [[4, 6], [6, 8], [4, 8]]) : [6, 6];
  const A = range(1, m); const B = range(1, n);
  const scores = A.flatMap((a) => B.map((b) => op.f(a, b)));
  const evs = scoreEvents(rng, scores, op.word).filter((e) => { const c = scores.filter(e.f).length; return c > 0 && c < scores.length; });
  const ev = pick(rng, evs);
  const fav = scores.filter(ev.f).length;
  const N = m * n;
  const p = frac(fav, N);
  const distinct = [...new Set(scores)];
  const distinctFav = distinct.filter(ev.f).length;
  // unordered pairs (forgetting that (1,2) and (2,1) are different)
  const pairs = []; A.forEach((a) => B.forEach((b) => { if (a <= b || a > n) pairs.push([a, b]); }));
  const pairFav = pairs.filter(([a, b]) => ev.f(op.f(a, b))).length;
  const diceTxt = m === n ? `Two fair ${m}-sided dice are rolled.` : `A fair ${m}-sided dice and a fair ${n}-sided dice are rolled.`;
  const showGrid = d === 'easy' || (d === 'medium' && rng() < 0.4);
  const grid = sampleGrid('1st', '2nd', A, B, (i, j) => (showGrid && (d === 'easy' || (i + j) % 3 === 0) ? op.f(A[i], B[j]) : ''));
  return {
    prompt: `${diceTxt.replace('6-sided dice', 'ordinary dice')} ${op.how}<br>${showGrid ? (d === 'easy' ? 'The sample space diagram shows all the possible scores. ' : 'Part of the sample space diagram has been filled in. ') : ''}What is the probability of getting ${ev.txt}?`,
    visual: showGrid ? grid : undefined,
    answer: ft(p),
    distractors: probOpts(p, [
      frac(distinctFav, distinct.length), // treated the different scores as equally likely
      frac(fav, m + n), // added the outcomes instead of multiplying
      frac(pairFav, pairs.length), // ignored order
      ev.slip ? frac(scores.filter(ev.slip).length, N) : null,
      frac(fav + 1, N), frac(fav - 1, N), frac(N - fav, N),
    ]),
    typed: typedP(p),
    solution: [
      `There are $${m} \\times ${n} = ${N}$ equally likely outcomes (${m === n ? `each dice has ${m} outcomes` : `the dice have ${m} and ${n} outcomes`}, and order matters: (1, 2) is different from (2, 1)).`,
      `Fill in a ${m} by ${n} grid of ${op.word}s and count the cells giving ${ev.txt}: there are ${num(fav)}.`,
      `$P = \\frac{${fav}}{${N}}${p.d !== N ? ` = ${p.tex()}` : ''}$`,
      `Answer: ${ft(p)}`,
    ],
  };
}, { title: 'Two dice: sample space of totals, products or differences' });

const EXPRESSIONS = [
  { tex: '2x', f: (x) => 2 * x }, { tex: '3x', f: (x) => 3 * x }, { tex: 'x^2', f: (x) => x * x }, { tex: 'x + 5', f: (x) => x + 5 },
  { tex: '10 - x', f: (x) => 10 - x }, { tex: '4x', f: (x) => 4 * x }, { tex: 'x + 7', f: (x) => x + 7 }, { tex: '2x + 1', f: (x) => 2 * x + 1 },
];

export const ssTwoSpinners = gen('prob-ss-two-spinners', 'prob-sample-space', (rng, d) => {
  if (d === 'hard' && rng() < 0.5) {
    // Dice and a spinner of expressions, as in recent papers.
    const ex = sample(rng, EXPRESSIONS, 3);
    const xs = range(1, 6);
    const scores = ex.flatMap((e) => xs.map((x) => e.f(x)));
    const k = pick(rng, [8, 10, 12, 15, 20]);
    const win = scores.filter((s) => s >= k).length;
    if (win === 0 || win === 18) throw new Error('degenerate');
    const p = frac(win, 18);
    const shown = new Set(sample(rng, range(0, 17), 3));
    const grid = table([['', ...xs.map(String)], ...ex.map((e, r) => [`$${e.tex}$`, ...xs.map((x, c) => (shown.has(r * 6 + c) ? String(e.f(x)) : ''))])], { firstColHeader: true });
    return {
      prompt: `In a game, an ordinary fair dice is rolled and a fair spinner with three equal sections is spun.<br>The spinner sections show $${ex[0].tex}$, $${ex[1].tex}$ and $${ex[2].tex}$.<br>The score is the dice number substituted for $x$ in the spinner expression. A player wins if their score is ${k} or more.<br>What is the probability of winning?`,
      visual: `<div>${spinner(ex.map((e) => ({ label: e.tex.replace('^2', '²') })), { r: 70 })}${grid}</div>`,
      answer: ft(p),
      distractors: probOpts(p, [frac(scores.filter((s) => s > k).length, 18), frac(win, 9), frac([...new Set(scores.filter((s) => s >= k))].length, [...new Set(scores)].length), frac(18 - win, 18), frac(win + 1, 18), frac(win, 36)]),
      typed: typedP(p),
      solution: [
        'Complete the table: there are $3 \\times 6 = 18$ equally likely outcomes.',
        ...ex.map((e) => `$${e.tex}$: ${xs.map((x) => e.f(x)).join(', ')}`),
        `Scores of ${k} or more ("or more" includes ${k}): ${num(win)}.`,
        `$P = \\frac{${win}}{18}${p.d !== 18 ? ` = ${p.tex()}` : ''}$`,
        `Answer: ${ft(p)}`,
      ],
    };
  }
  const spinNums = (len) => {
    const xs = sample(rng, range(1, 6), len);
    if (rng() < 0.5) xs[len - 1] = xs[0];
    return shuffle(rng, xs);
  };
  const a = spinNums(pick(rng, size(d, [3, 4], [4, 5], [4, 5])));
  const b = spinNums(pick(rng, [3, 4]));
  const rule = pick(rng, size(d, ['sum', 'product'], ['sum', 'product', 'higher'], ['higher', 'product', 'difference']));
  const f = rule === 'higher' ? (x, y) => (x === y ? 0 : Math.max(x, y)) : OPS[rule].f;
  const how = rule === 'higher' ? 'If the numbers are different, the score is the higher number. If they are the same, the score is 0.' : OPS[rule].how.replace('two numbers', 'two numbers the arrows land on');
  const word = rule === 'higher' ? 'score' : OPS[rule].word;
  const scores = a.flatMap((x) => b.map((y) => f(x, y)));
  const evs = scoreEvents(rng, scores, word).filter((e) => { const c = scores.filter(e.f).length; return c > 0 && c < scores.length && (rule !== 'higher' || !/square|even/.test(e.txt)); });
  const ev = pick(rng, evs);
  const N = a.length * b.length;
  const fav = scores.filter(ev.f).length;
  const p = frac(fav, N);
  const distinct = [...new Set(scores)];
  const grid = d === 'hard' ? '' : sampleGrid('A', 'B', a, b, (i, j) => ((i + 2 * j) % 4 === 0 ? f(a[i], b[j]) : ''));
  return {
    prompt: `Two fair spinners, A and B, are spun. ${how}<br>What is the probability of ${ev.txt.replace(/^an? /, (m) => `getting ${m}`).replace(/^(?!getting)/, 'getting ')}?`,
    visual: `<div>${twoSpinners(a.map((x) => ({ label: String(x) })), b.map((x) => ({ label: String(x) })))}${grid}</div>`,
    answer: ft(p),
    distractors: probOpts(p, [
      frac(distinct.filter(ev.f).length, distinct.length), frac(fav, a.length + b.length), ev.slip ? frac(scores.filter(ev.slip).length, N) : null,
      frac(N - fav, N), frac(fav + 1, N), frac(fav - 1, N), frac(fav, N + 1),
    ]),
    typed: typedP(p),
    solution: [
      `Each spinner has equal sections, so all $${a.length} \\times ${b.length} = ${N}$ pairs of sections are equally likely – even when two sections show the same number.`,
      `Complete the table: ${a.map((x) => `A = ${x}: ${b.map((y) => f(x, y)).join(', ')}`).join('; ')}.`,
      `Outcomes giving ${ev.txt}: ${num(fav)}.`,
      `$P = \\frac{${fav}}{${N}}${p.d !== N ? ` = ${p.tex()}` : ''}$`,
      `Answer: ${ft(p)}`,
    ],
  };
}, { title: 'Two spinners: complete the table of scores' });

// Listing scenes: each returns { intro, outcomes (strings), events: [{txt, f, wrong?}] }.
const LIST_SCENES = [
  () => ({
    intro: 'Two fair coins are thrown.', outcomes: ['HH', 'HT', 'TH', 'TT'],
    events: [
      { txt: 'one head and one tail', f: (o) => o === 'HT' || o === 'TH', wrong: frac(1, 3), why: 'HT and TH are different outcomes' },
      { txt: 'two heads', f: (o) => o === 'HH', wrong: frac(1, 3) },
      { txt: 'at least one head', f: (o) => o.includes('H'), wrong: frac(2, 3) },
    ],
  }),
  () => ({
    intro: 'Three fair coins are thrown.', outcomes: ['HHH', 'HHT', 'HTH', 'THH', 'HTT', 'THT', 'TTH', 'TTT'],
    events: [
      { txt: 'exactly two heads', f: (o) => o.split('H').length - 1 === 2, wrong: frac(1, 4), why: 'there are three ways to get two heads' },
      { txt: 'at least one tail', f: (o) => o.includes('T'), wrong: frac(3, 4) },
      { txt: 'three tails', f: (o) => o === 'TTT', wrong: frac(1, 4) },
      { txt: 'all three the same', f: (o) => o === 'HHH' || o === 'TTT', wrong: frac(1, 2) },
      { txt: 'exactly one head', f: (o) => o.split('H').length - 1 === 1, wrong: frac(1, 4) },
    ],
  }),
  () => ({
    intro: 'A fair coin is thrown and an ordinary fair dice is rolled.', outcomes: ['H', 'T'].flatMap((c) => range(1, 6).map((x) => `${c}${x}`)),
    events: [
      { txt: 'a head and an even number', f: (o) => o[0] === 'H' && Number(o.slice(1)) % 2 === 0, wrong: frac(1, 8) },
      { txt: 'a tail and a 6', f: (o) => o === 'T6', wrong: frac(1, 8) },
      { txt: 'a head and a number greater than 4', f: (o) => o[0] === 'H' && Number(o.slice(1)) > 4, wrong: frac(1, 4) },
      { txt: 'a tail and a prime number', f: (o) => o[0] === 'T' && isPrime(Number(o.slice(1))), wrong: frac(1, 2) },
    ],
  }),
  (rng) => {
    const st = sample(rng, ['soup', 'melon', 'salad', 'prawns'], pick(rng, [2, 3]));
    const mn = sample(rng, ['fish', 'pie', 'curry', 'pasta', 'chicken'], pick(rng, [3, 4]));
    const [s0] = st; const [m0, m1] = mn;
    return {
      intro: `A café meal deal is one starter (${listAnd(st, 'or')}) and one main (${listAnd(mn, 'or')}). Jess chooses her starter and main at random.`,
      outcomes: st.flatMap((s) => mn.map((m) => `${s}–${m}`)),
      events: [
        { txt: `${s0} and ${m0}`, f: (o) => o === `${s0}–${m0}`, wrong: frac(1, st.length + mn.length) },
        { txt: `${s0} with either ${m0} or ${m1}`, f: (o) => o === `${s0}–${m0}` || o === `${s0}–${m1}`, wrong: frac(2, st.length + mn.length) },
      ],
      noun: 'meal',
    };
  },
  () => ({
    intro: 'Three songs, A, B and C, are put on shuffle. They each play once, in a random order.', outcomes: ['ABC', 'ACB', 'BAC', 'BCA', 'CAB', 'CBA'],
    events: [
      { txt: 'the songs play in the order A, B, C', f: (o) => o === 'ABC', wrong: frac(1, 3) },
      { txt: 'song A plays before song B', f: (o) => o.indexOf('A') < o.indexOf('B'), wrong: frac(1, 3) },
      { txt: 'song C plays last', f: (o) => o[2] === 'C', wrong: frac(1, 6) },
      { txt: 'song B plays in the middle', f: (o) => o[1] === 'B', wrong: frac(1, 6) },
    ],
  }),
  (rng) => {
    const cols = sample(rng, ['red', 'blue', 'green', 'yellow'], 3);
    return {
      intro: `Spinner X has three equal sections coloured ${listAnd(cols)}. Spinner Y has four equal sections numbered 1, 2, 3 and 4. Both are spun.`,
      outcomes: cols.flatMap((c) => [1, 2, 3, 4].map((x) => `${c} ${x}`)),
      events: [
        { txt: `${cols[0]} and an even number`, f: (o) => o.startsWith(cols[0]) && Number(o.slice(-1)) % 2 === 0, wrong: frac(2, 7) },
        { txt: `${cols[1]} and a 4`, f: (o) => o === `${cols[1]} 4`, wrong: frac(1, 7) },
        { txt: `not ${cols[2]}, and a number less than 3`, f: (o) => !o.startsWith(cols[2]) && Number(o.slice(-1)) < 3, wrong: frac(4, 7) },
      ],
    };
  },
  (rng) => {
    const cardsN = sample(rng, [2, 3, 4, 5, 6, 7, 8, 9], 3).sort((x, y) => x - y);
    const outs = [];
    cardsN.forEach((x) => cardsN.forEach((y) => { if (x !== y) outs.push(`${x}${y}`); }));
    const even = cardsN.filter((x) => x % 2 === 0).length;
    if (even === 0 || even === 3) throw new Error('parity');
    return {
      intro: `Three cards are numbered ${listAnd(cardsN.map(String))}. Two of the cards are taken at random, one after the other, to make a 2-digit number.`,
      outcomes: outs,
      events: [
        { txt: 'the 2-digit number is even', f: (o) => Number(o[1]) % 2 === 0, wrong: frac(even, 3 + 1) },
        { txt: `the 2-digit number is greater than ${cardsN[1]}0`, f: (o) => Number(o) > cardsN[1] * 10, wrong: frac(1, 3) },
        { txt: `the first card is ${cardsN[0]}`, f: (o) => o[0] === String(cardsN[0]), wrong: frac(1, 6) },
      ],
    };
  },
];

export const ssListing = gen('prob-ss-listing', 'prob-sample-space', (rng, d) => {
  const scene = pick(rng, LIST_SCENES.slice(...size(d, [0, 4], [0, 7], [1, 7])))(rng);
  const ev = pick(rng, scene.events);
  const fav = scene.outcomes.filter(ev.f);
  const N = scene.outcomes.length;
  const p = frac(fav.length, N);
  return {
    prompt: `${scene.intro}<br>What is the probability of ${ev.txt}?`,
    answer: ft(p),
    distractors: probOpts(p, [ev.wrong, frac(1, N), frac(fav.length, N - fav.length), frac(N - fav.length, N), frac(fav.length + 1, N), frac(fav.length, N + 1), frac(fav.length, N * 2)]),
    typed: typedP(p),
    solution: [
      `List every outcome systematically: ${scene.outcomes.join(', ')} – that is ${num(N)} equally likely outcomes.`,
      `Outcomes with ${ev.txt}: ${fav.join(', ')} (${num(fav.length)}).${ev.why ? ` Remember ${ev.why}.` : ''}`,
      `$P = \\frac{${fav.length}}{${N}}${p.d !== N ? ` = ${p.tex()}` : ''}$`,
      `Answer: ${ft(p)}`,
    ],
  };
}, { title: 'List the outcomes of two or three events' });

export const ssPairs = gen('prob-ss-pairs', 'prob-sample-space', (rng, d) => {
  const kind = pick(rng, ['team', 'scoops']);
  const frc = (fav, N) => `$P = \\frac{${fav}}{${N}}${frac(fav, N).d !== N ? ` = ${frac(fav, N).tex()}` : ''}$`;
  if (kind === 'team') {
    const n = size(d, pick(rng, [4, 5]), pick(rng, [4, 5, 6]), pick(rng, [5, 6, 7]));
    const people = names(rng, n);
    const pairs = [];
    for (let i = 0; i < n; i += 1) for (let j = i + 1; j < n; j += 1) pairs.push([people[i], people[j]]);
    const N = pairs.length;
    const [A, B] = people;
    const ev = pick(rng, [
      { txt: `${A} is one of the two chosen`, f: (p) => p.includes(A), wrong: [frac(1, n), frac(n - 1, n * (n - 1))] },
      { txt: `the two chosen are ${A} and ${B}`, f: (p) => p.includes(A) && p.includes(B), wrong: [frac(2, n), frac(1, n * (n - 1)), frac(2, N)] },
      ...(d !== 'easy' ? [
        { txt: `neither ${A} nor ${B} is chosen`, f: (p) => !p.includes(A) && !p.includes(B), wrong: [frac(n - 2, n), frac(1, 2)] },
        { txt: `exactly one of ${A} and ${B} is chosen`, f: (p) => p.includes(A) !== p.includes(B), wrong: [frac(n - 2, N), frac(1, 2)] },
      ] : []),
    ]);
    const fav = pairs.filter(ev.f).length;
    const p = frac(fav, N);
    const event = pick(rng, [
      [`${listAnd(people)} enter a competition. Two of them are chosen at random to go through to the final.`],
      [`${listAnd(people)} want to be on the school council. Two of them are picked at random.`],
      [`A teacher picks two students at random from ${listAnd(people)} to carry a message.`],
      [`Two tickets for a concert are given out at random to two of ${listAnd(people)}.`],
    ])[0];
    return {
      prompt: `${event}<br>What is the probability that ${ev.txt}?`,
      answer: ft(p),
      distractors: probOpts(p, [...ev.wrong, frac(fav, n * (n - 1)), frac(fav, N + 1), frac(fav + 1, N), frac(N - fav, N)]),
      typed: typedP(p),
      solution: [
        `List the possible pairs (order does not matter – "${A} & ${B}" is the same pair as "${B} & ${A}"):`,
        `${pairs.map((x) => x.join(' & ')).join(', ')} – that is ${num(N)} pairs.`,
        `Pairs where ${ev.txt}: ${num(fav)}.`,
        frc(fav, N),
        `Answer: ${ft(p)}`,
      ],
    };
  }
  // Ice-cream scoops: two scoops, may be the same flavour, order does not matter.
  const all = [['vanilla', 'V'], ['strawberry', 'S'], ['chocolate', 'C'], ['mint', 'M'], ['lemon', 'L'], ['banana', 'B']];
  const fl = sample(rng, all, size(d, pick(rng, [3, 4]), pick(rng, [3, 4, 5]), pick(rng, [4, 5, 6])));
  const n = fl.length;
  const opts = [];
  for (let i = 0; i < n; i += 1) for (let j = i; j < n; j += 1) opts.push([fl[i][1], fl[j][1]]);
  const N = opts.length;
  const [X, Y] = fl;
  const ev = pick(rng, [
    { txt: `the ice cream is one scoop of ${X[0]} and one of ${Y[0]}`, f: (o) => o.includes(X[1]) && o.includes(Y[1]) && o[0] !== o[1], wrong: [frac(2, n * n), frac(1, n * (n - 1))] },
    { txt: 'both scoops are the same flavour', f: (o) => o[0] === o[1], wrong: [frac(1, n), frac(n, n * n)] },
    { txt: 'the two scoops are different flavours', f: (o) => o[0] !== o[1], wrong: [frac(n - 1, n), frac(n * (n - 1), n * n)] },
    { txt: `at least one scoop is ${X[0]}`, f: (o) => o.includes(X[1]), wrong: [frac(2, n), frac(2 * n - 1, n * n)] },
    ...(d !== 'easy' ? [{ txt: `neither scoop is ${X[0]}`, f: (o) => !o.includes(X[1]), wrong: [frac(n - 1, n), frac((n - 1) * (n - 1), n * n)] }] : []),
  ]);
  const fav = opts.filter(ev.f).length;
  const p = frac(fav, N);
  return {
    prompt: `An ice cream has two scoops. The flavours are ${listAnd(fl.map((x) => `${x[0]} (${x[1]})`))}. The two scoops can be the same flavour or different flavours, and the order of the scoops does not matter.<br>Each possible ice cream is equally likely to be chosen. What is the probability that ${ev.txt}?`,
    answer: ft(p),
    distractors: probOpts(p, [...ev.wrong, frac(fav, N + 1), frac(fav + 1, N), frac(N - fav, N), frac(fav, n * (n - 1) / 2)]),
    typed: typedP(p),
    solution: [
      'List the options in a system: pair each flavour with itself and with the flavours after it, so you never count the same ice cream twice.',
      `${opts.map((o) => o.join('')).join(', ')} – that is ${num(N)} options.`,
      `Options where ${ev.txt}: ${num(fav)}.`,
      frc(fav, N),
      `Answer: ${ft(p)}`,
    ],
  };
}, { title: 'Pairs where order does not matter' });

const DIGIT_RULES = [
  { txt: 'an even digit', set: [0, 2, 4, 6, 8] },
  { txt: 'an odd digit', set: [1, 3, 5, 7, 9] },
  { txt: 'a factor of 16', set: [1, 2, 4, 8] },
  { txt: 'a prime number', set: [2, 3, 5, 7] },
  { txt: 'greater than 6', set: [7, 8, 9] },
  { txt: 'a factor of 6', set: [1, 2, 3, 6] },
  { txt: 'a square number bigger than 0', set: [1, 4, 9] },
  { txt: 'a multiple of 4 bigger than 0', set: [4, 8] },
  { txt: 'less than 4', set: [0, 1, 2, 3] },
  { txt: 'a factor of 10', set: [1, 2, 5] },
];

export const ssCode = gen('prob-ss-code', 'prob-sample-space', (rng, d) => {
  const who = pick(rng, names(rng, 6));
  const thing = pick(rng, ['a 3-digit code for a padlock', 'the PIN for a bike lock', 'the code to a locker', 'a door entry code', 'the code for a safe']);
  if (d === 'easy') {
    const k = pick(rng, [1, 2]);
    const r = pick(rng, DIGIT_RULES);
    const N = k === 1 ? 10 : r.set.length;
    const p = frac(1, N);
    const prompt = k === 1
      ? `${who} has forgotten the last digit of ${thing}. Each digit can be 0 to 9. ${who} picks a digit at random for the last digit.<br>What is the probability that it is correct?`
      : `${who} has forgotten the last digit of ${thing}, but knows it is ${r.txt}. ${who} picks a digit of this kind at random.<br>What is the probability that it is correct?`;
    return {
      prompt,
      answer: ft(p),
      distractors: probOpts(p, [frac(1, 9), frac(1, N + 1), frac(N, 10), frac(1, 2), frac(1, 5), frac(1, 4), frac(1, 3), frac(1, 6)]),
      typed: typedP(p),
      solution: [
        k === 1 ? 'There are 10 possible digits: 0, 1, 2, …, 9 (don\'t forget 0).' : `Digits that are ${r.txt}: ${r.set.join(', ')} – that is ${N}.`,
        `Only one of the ${N} is correct, so $P = \\frac{1}{${N}}$.`,
        `Answer: ${ft(p)}`,
      ],
    };
  }
  const k = size(d, 2, 2, 3);
  const rules = sample(rng, DIGIT_RULES, k);
  const N = rules.reduce((a, r) => a * r.set.length, 1);
  const S = rules.reduce((a, r) => a + r.set.length, 0);
  const p = frac(1, N);
  const ords = ['first', 'second', 'third'];
  return {
    prompt: `${who} is trying to remember ${k === 2 ? 'the last two digits of ' : ''}${thing}. ${who} knows that<br>${rules.map((r, i) => `&nbsp;&nbsp;• the ${ords[i]} ${k === 2 ? 'of these digits' : 'digit'} is ${r.txt}`).join('<br>')}<br>${who} tries one code at random that fits these facts. What is the probability that it is correct?`,
    answer: ft(p),
    distractors: probOpts(p, [frac(1, S), frac(k, N), frac(1, 10 ** k), frac(1, N + 1), frac(1, N - 1), frac(1, rules[0].set.length), frac(1, 2 * N)]),
    typed: typedP(p),
    solution: [
      ...rules.map((r, i) => `${cap(ords[i])} digit (${r.txt}): ${r.set.join(', ')} – ${r.set.length} choices.`),
      `Number of possible codes: $${rules.map((r) => r.set.length).join(' \\times ')} = ${N}$ (multiply, don't add).`,
      `Only one is correct: $P = \\frac{1}{${N}}$.`,
      `Answer: ${ft(p)}`,
    ],
  };
}, { title: 'Probability of guessing a code (product rule)' });

/* ================================================================== */
/* prob-expected-frequency                                             */
/* ================================================================== */

// [event, not-event, trials phrase(n), unit noun for trials]
const EXPECT_CONTEXTS = [
  { ev: 'the school bus is late', not: 'on time', trials: (n) => `on ${n} school days`, q: (n, w) => `On how many of the ${n} days would you expect the bus to be ${w ? 'on time' : 'late'}?` },
  { ev: 'it rains on a day in April', not: 'dry', trials: (n) => `over ${n} days`, q: (n, w) => `Estimate the number of ${w ? 'dry days' : 'days it rains'} in ${n} days.` },
  { hi: true, ev: 'a seed germinates', not: 'fails', trials: (n) => `when ${n} seeds are planted`, q: (n, w) => `${n} seeds are planted. How many would you expect ${w ? '<b>not</b> to germinate' : 'to germinate'}?` },
  { ev: 'a light bulb made in a factory is faulty', not: 'works', trials: (n) => `in a batch of ${n}`, q: (n, w) => `How many bulbs in a batch of ${n} would you expect to be ${w ? '<b>not</b> faulty' : 'faulty'}?` },
  { hi: true, ev: 'Femi scores a penalty', not: 'misses', trials: (n) => `in ${n} penalties`, q: (n, w) => `Femi takes ${n} penalties. How many would you expect him to ${w ? 'miss' : 'score'}?` },
  { ev: 'a flight from an airport is delayed', not: 'on time', trials: (n) => `of ${n} flights`, q: (n, w) => `${n} flights leave the airport one day. How many would you expect to be ${w ? '<b>not</b> delayed' : 'delayed'}?` },
  { ev: 'a player wins a prize in a fairground game', not: 'loses', trials: (n) => `when ${n} people play`, q: (n, w) => `${n} people play the game. How many would you expect ${w ? '<b>not</b> to win a prize' : 'to win a prize'}?` },
  { hi: true, ev: 'an archer hits the target', not: 'misses', trials: (n) => `in ${n} shots`, q: (n, w) => `The archer shoots ${n} arrows. How many would you expect to ${w ? 'miss' : 'hit'} the target?` },
  { ev: 'a parcel is delivered late', not: 'on time', trials: (n) => `of ${n} parcels`, q: (n, w) => `A courier delivers ${n} parcels. Estimate how many are delivered ${w ? 'on time' : 'late'}.` },
  { ev: 'a student in a school is left-handed', not: 'right-handed', trials: (n) => `of ${n} students`, q: (n, w) => `A school has ${n} students. Estimate how many are ${w ? '<b>not</b> left-handed' : 'left-handed'}.` },
  { ev: 'a phone screen cracks when the phone is dropped', not: 'survives', trials: (n) => `in ${n} drop tests`, q: (n, w) => `In a test, a phone is dropped ${n} times. How many times would you expect the screen ${w ? '<b>not</b> to crack' : 'to crack'}?` },
  { hi: true, ev: 'a customer at a café orders a hot drink', not: 'cold', trials: (n) => `of ${n} customers`, q: (n, w) => `${n} customers visit the café. How many would you expect ${w ? '<b>not</b> to order a hot drink' : 'to order a hot drink'}?` },
  { hi: true, ev: 'a train arrives at the station on time', not: 'late', trials: (n) => `of ${n} trains`, q: (n, w) => `${n} trains arrive one week. How many would you expect to be ${w ? 'late' : 'on time'}?` },
  { ev: 'a biased coin lands on heads', not: 'tails', trials: (n) => `in ${n} throws`, q: (n, w) => `The coin is thrown ${n} times. How many times would you expect it to land on ${w ? 'tails' : 'heads'}?` },
];

export const efExpected = gen('prob-ef-expected', 'prob-expected-frequency', (rng, d) => {
  if (d !== 'hard' && rng() < 0.3) {
    // Fair dice / spinner, where the probability must be worked out first.
    const fair = pick(rng, [
      { txt: 'An ordinary fair dice is rolled', N: 6, evs: [['a 6', 1], ['an even number', 3], ['a number greater than 4', 2], ['a 1 or a 2', 2], ['a square number', 2]] },
      { txt: 'A fair spinner with 5 equal sections numbered 1 to 5 is spun', N: 5, evs: [['a 3', 1], ['an odd number', 3], ['a number less than 3', 2], ['a prime number', 3]] },
      { txt: 'A fair 8-sided dice numbered 1 to 8 is rolled', N: 8, evs: [['an 8', 1], ['a number greater than 5', 3], ['an odd number', 4], ['a multiple of 3', 2]] },
      { txt: 'A fair coin is thrown', N: 2, evs: [['heads', 1]] },
      { txt: 'A card is picked at random from 10 cards numbered 1 to 10 and then put back. This is done', N: 10, evs: [['a 10', 1], ['a multiple of 3', 3], ['a prime number', 4], ['a square number', 3]] },
    ]);
    const [txt, c] = pick(rng, fair.evs);
    const p = frac(c, fair.N);
    const n = p.d * int(rng, size(d, 3, 6, 10), size(d, 10, 20, 40));
    const ans = (n * p.n) / p.d;
    return {
      prompt: `${fair.txt} ${n} times.<br>How many times would you expect to get ${txt}?`,
      answer: num(ans),
      distractors: countOpts(ans, [n / fair.N, n - ans, n * c, ans * 2, n / c, Math.round(n / (fair.N - c + 1))]),
      typed: { kind: 'number', value: ans },
      solution: [
        `$P(\\text{${txt}}) = \\frac{${c}}{${fair.N}}${p.d !== fair.N ? ` = ${p.tex()}` : ''}$`,
        'Expected number = probability × number of trials.',
        `$${p.tex()} \\times ${n} = ${ans}$`,
        `Answer: ${num(ans)}`,
      ],
    };
  }
  const ctx = pick(rng, EXPECT_CONTEXTS);
  const form = pick(rng, size(d, ['dec', 'frac'], ['dec', 'pct', 'frac'], ['dec', 'pct', 'frac']));
  let p;
  if (form === 'frac') { const den = pick(rng, [3, 4, 5, 8, 10, 12, 20]); p = frac(int(rng, 1, den - 1), den); }
  else p = frac(int(rng, 1, 9) * 5, 100);
  if (ctx.hi && p.value() < 0.5) p = frac(1).sub(p);
  if (!ctx.hi && p.value() > 0.5) p = frac(1).sub(p);
  if (p.value() >= 1 || p.d === 1) throw new Error('bad p');
  const complement = d !== 'easy' && rng() < 0.45;
  const step = p.d;
  const n = step * int(rng, size(d, 2, 3, 4), size(d, 10, 25, 40));
  if (n > 2000 || n < 10) throw new Error('n');
  const q = complement ? frac(1).sub(p) : p;
  const ans = q.mul(n).value();
  if (!Number.isInteger(ans)) throw new Error('not whole');
  const other = (complement ? p : frac(1).sub(p)).mul(n).value();
  return {
    prompt: `The probability that ${ctx.ev} is $${pt(p, form)}$.<br>${ctx.q(n, complement)}`,
    answer: num(ans),
    distractors: countOpts(ans, [other, Math.round(n / p.d), Math.round(p.value() * 100), Math.round(n * p.value() / 2), n - Math.round(n / p.d), ans + p.d, Math.max(1, ans - p.d)]),
    typed: { kind: 'number', value: ans },
    solution: [
      'Expected number = probability × number of trials.',
      ...(complement ? [`First find the probability you need: $1 - ${pt(p, form)} = ${pt(q, form)}$.`] : []),
      `$${pt(q, form)} \\times ${n} = ${num(ans)}$`,
      `Answer: ${num(ans)} (an estimate – the actual number can vary).`,
    ],
  };
}, { title: 'Expected number of outcomes', word: true });

const RF_EXPERIMENTS = [
  { intro: (n) => `A drawing pin is dropped ${n} times.`, outs: ['Point up', 'Point down'], one: (o, k) => `It lands ${o.toLowerCase()} ${k} times.` },
  { intro: (n) => `A biased coin is thrown ${n} times.`, outs: ['Heads', 'Tails'], one: (o, k) => `It lands on ${o.toLowerCase()} ${k} times.` },
  { intro: (n) => `A spinner is spun ${n} times.`, outs: ['Red', 'Blue', 'Green'] },
  { intro: (n) => `Rosie makes ${n} sales calls and records what happens on each call.`, outs: ['Not answered', 'Answered, no sale', 'Answered, sale made'] },
  { intro: (n) => `A dice is rolled ${n} times.`, outs: ['1', '2', '3', '4', '5', '6'] },
  { intro: (n) => `A basketball player takes ${n} shots at the hoop.`, outs: ['Scores', 'Misses'], one: (o, k) => `She ${o === 'Scores' ? 'scores' : 'misses'} ${k} times.` },
  { intro: (n) => `${n} customers at a sandwich shop choose their bread.`, outs: ['White', 'Brown', 'Seeded'] },
  { intro: (n) => `The speeds of ${n} cars passing a school are checked.`, outs: ['Under 20 mph', 'Over 20 mph'], one: (o, k) => `${k} of the cars are ${o.toLowerCase()}.` },
  { intro: (n) => `A machine tests ${n} batteries.`, outs: ['Pass', 'Fail'], one: (o, k) => `${k} batteries ${o === 'Pass' ? 'pass' : 'fail'}.` },
];

export const efRelFreq = gen('prob-ef-rel-freq', 'prob-expected-frequency', (rng, d) => {
  const ex = pick(rng, RF_EXPERIMENTS);
  const k = ex.outs.length;
  const total = pick(rng, size(d, [10, 20, 50, 100], [20, 25, 40, 50, 80, 200], [40, 80, 120, 125, 250, 400]));
  // random frequencies summing to total
  const cuts = sample(rng, range(1, total - 1), k - 1).sort((a, b) => a - b);
  const freqs = [cuts[0], ...cuts.slice(1).map((c, i) => c - cuts[i]), total - cuts[cuts.length - 1]];
  if (freqs.some((f) => f < 2)) throw new Error('tiny');
  const i = int(rng, 0, k - 1);
  const form = (100 * 1000) % total === 0 && pick(rng, [true, false, d !== 'hard']) ? 'dec' : 'frac';
  const p = frac(freqs[i], total);
  if (form === 'dec' && !shortDecimal3(p)) throw new Error('dp');
  const asTable = !ex.one || rng() < 0.4;
  const prompt = asTable
    ? `${ex.intro(total)} The results are shown.${table([['Outcome', 'Frequency'], ...ex.outs.map((o, t) => [o, String(freqs[t])])])}Work out the relative frequency of <b>${ex.outs[i]}</b>${form === 'dec' ? ' as a decimal' : ''}.`
    : `${ex.intro(total)} ${ex.one(ex.outs[i], freqs[i])}<br>Write down the relative frequency of <b>${ex.outs[i].toLowerCase()}</b>${form === 'dec' ? ' as a decimal' : ''}.`;
  return {
    prompt,
    answer: pf(p, form),
    distractors: probOpts(p, [frac(freqs[i], total - freqs[i]), frac(total - freqs[i], total), frac(freqs[i], 100), frac(1, k), frac(freqs[i], total + freqs[i]), frac(freqs[(i + 1) % k], total)], form),
    typed: typedP(p, form),
    solution: [
      'Relative frequency = $\\dfrac{\\text{number of times it happened}}{\\text{total number of trials}}$',
      `$\\frac{${freqs[i]}}{${total}}${form === 'dec' ? ` = ${tnum(p.value())}` : p.d !== total ? ` = ${p.tex()}` : ''}$`,
      `Answer: ${pf(p, form)}`,
    ],
  };
}, { title: 'Work out a relative frequency' });

export const efFair = gen('prob-ef-fair', 'prob-expected-frequency', (rng, d) => {
  const N = pick(rng, size(d, [60, 120, 300], [300, 600, 240], [600, 900, 1200]));
  const e = N / 6;
  const biased = rng() < 0.7;
  const target = int(rng, 1, 6);
  const freqs = range(1, 6).map(() => e);
  // jitter
  const wiggle = Math.max(2, Math.round(e * 0.08));
  for (let t = 0; t < 6; t += 1) {
    const j = int(rng, 0, 5); const k = (j + 1 + int(rng, 0, 4)) % 6; const w = int(rng, 0, wiggle);
    freqs[j] += w; freqs[k] -= w;
  }
  let dir = 0;
  if (biased) {
    dir = pick(rng, [1, 1, -1]);
    const shift = Math.round(e * (dir > 0 ? pick(rng, [0.6, 0.8, 1]) : 0.6));
    freqs[target - 1] += dir * shift;
    // take/give it evenly from others
    for (let t = 0; t < shift; t += 1) { const o = (target + (t % 5)) % 6; freqs[o] -= dir; }
  }
  if (freqs.some((f) => f <= 0) || freqs.reduce((a, b) => a + b, 0) !== N) throw new Error('freq');
  const tbl = table([['Score', ...range(1, 6).map(String)], ['Frequency', ...freqs.map(String)]], { firstColHeader: true });
  if (d === 'easy' && rng() < 0.5) {
    return {
      prompt: `Ali rolls a dice ${N} times.${tbl}If the dice is fair, how many times would Ali expect to get each score?`,
      answer: num(e),
      distractors: countOpts(e, [N / 10, N / 5, Math.max(...freqs), Math.round(N / 7), 6]),
      typed: { kind: 'number', value: e },
      solution: [
        'For a fair dice each score has probability $\\frac{1}{6}$.',
        `Expected frequency: $\\frac{1}{6} \\times ${N} = ${e}$`,
        `Answer: ${num(e)}`,
      ],
    };
  }
  const fairOpt = 'The dice is probably fair: every score is close to the expected number.';
  const opt = (s, up) => `The dice is probably biased ${up ? 'towards' : 'against'} ${s}: it came up ${freqs[s - 1]} times when about ${e} were expected.`;
  const answer = biased ? opt(target, dir > 0) : fairOpt;
  const others = range(1, 6).filter((s) => s !== target);
  const maxOther = others.reduce((a, s) => (freqs[s - 1] > freqs[a - 1] ? s : a), others[0]);
  const minOther = others.reduce((a, s) => (freqs[s - 1] < freqs[a - 1] ? s : a), others[0]);
  return {
    prompt: `Ali wants to know if his dice is fair. He rolls it ${N} times.${tbl}Which conclusion is best?`,
    answer,
    distractors: [
      ...(biased ? [fairOpt] : []), opt(maxOther, true), opt(minOther, false), biased ? opt(target, dir < 0) : opt(target, freqs[target - 1] >= e),
      'You cannot tell anything, because the frequencies are not all exactly equal.',
    ],
    count: 5,
    solution: [
      `For a fair dice, each score is expected $\\frac{1}{6} \\times ${N} = ${e}$ times.`,
      'Small differences from the expected number are normal; a very big difference suggests bias.',
      biased ? `Score ${target} came up ${freqs[target - 1]} times – far ${dir > 0 ? 'more' : 'fewer'} than ${e}. The other scores are all close to ${e}.` : `Every score is within about ${wiggle * 2} of ${e} – that is normal variation for ${N} rolls.`,
      `Answer: ${answer}`,
    ],
  };
}, { title: 'Is the dice fair? Compare with expected frequencies' });

export const efBestEstimate = gen('prob-ef-best-estimate', 'prob-expected-frequency', (rng, d) => {
  const mode = pick(rng, size(d, ['people', 'cumulative'], ['people', 'cumulative'], ['people', 'people', 'cumulative']));
  const thing = pick(rng, [
    { act: 'throws a drawing pin', ev: 'it lands point up', short: 'Point up' },
    { act: 'spins a biased spinner', ev: 'it lands on red', short: 'Red' },
    { act: 'throws a biased coin', ev: 'it lands on heads', short: 'Heads' },
    { act: 'takes a penalty', ev: 'they score', short: 'Goals' },
    { act: 'rolls a biased dice', ev: 'it lands on 6', short: 'Sixes' },
    { act: 'drops a slice of toast', ev: 'it lands butter side down', short: 'Butter down' },
  ]);
  if (mode === 'cumulative') {
    const N = pick(rng, [50, 40, 100]);
    const steps = 5;
    const trueP = pick(rng, [0.3, 0.35, 0.4, 0.45, 0.6, 0.65, 0.7]);
    const rf = [];
    let succ = 0;
    for (let s = 1; s <= steps; s += 1) {
      const target = Math.round(trueP * N * s + (rng() - 0.5) * N * 0.6 / Math.sqrt(s));
      succ = Math.max(succ, Math.min(target, N * s));
      rf.push(frac(succ, N * s));
    }
    if (!rf.every(shortDecimal3)) throw new Error('dp');
    const shown = rf.map((r) => roundTo(r.value(), 3));
    if (new Set(shown).size < 5) throw new Error('rf');
    const mean = roundTo(shown.reduce((a, b) => a + b, 0) / steps, 3);
    return {
      prompt: `${pick(rng, names(rng, 4))} ${thing.act} ${N * steps} times. After every ${N} trials, the relative frequency that ${thing.ev} is worked out.${table([['Number of trials', ...range(1, steps).map((s) => String(s * N))], ['Relative frequency', ...shown.map((v) => tnum(v))]], { firstColHeader: true })}What is the best estimate of the probability that ${thing.ev}?`,
      answer: `$${tnum(shown[steps - 1])}$`,
      distractors: [`$${tnum(shown[0])}$`, `$${tnum(Math.max(...shown))}$`, `$${tnum(mean)}$`, `$${tnum(Math.min(...shown))}$`, ...shown.slice(1, -1).map((v) => `$${tnum(v)}$`), '$0.5$'],
      count: 4,
      solution: [
        'The more trials, the more reliable the relative frequency.',
        `The last value uses all ${N * steps} trials, so it is the best estimate.`,
        `Answer: $${tnum(shown[steps - 1])}$`,
      ],
    };
  }
  const people = names(rng, 3);
  const T0 = pick(rng, size(d, [100, 200], [100, 200, 250, 400], [200, 250, 400, 500]));
  const unitT = T0 >= 250 ? 25 : 10;
  const c1 = int(rng, 1, T0 / unitT - 2); const c2 = int(rng, 1, T0 / unitT - 1 - c1);
  const trials = [c1, c2, T0 / unitT - c1 - c2].map((x) => x * unitT);
  if (new Set(trials).size < 3) throw new Error('same sizes');
  const trueP = pick(rng, [0.2, 0.3, 0.4, 0.6, 0.7, 0.25, 0.75]);
  const succ = trials.map((t) => Math.max(1, Math.min(t - 1, Math.round(t * trueP + (rng() - 0.5) * t * 0.3))));
  const T = trials.reduce((a, b) => a + b, 0); const S = succ.reduce((a, b) => a + b, 0);
  const p = frac(S, T);
  const big = trials.indexOf(Math.max(...trials));
  const rfs = trials.map((t, i) => frac(succ[i], t));
  const meanRF = rfs.reduce((a, b) => a.add(b), frac(0)).div(3);
  const tbl = table([['', 'Number of trials', thing.short], ...people.map((n, i) => [n, String(trials[i]), String(succ[i])])], { firstColHeader: true });
  if (d === 'easy') {
    return {
      prompt: `Three friends each ${thing.act.replace(/s /, ' ')} several times and record how often ${thing.ev}.${tbl}Whose results give the most reliable estimate of the probability that ${thing.ev}?`,
      answer: `${people[big]}, because they did the most trials`,
      distractors: [
        `${people[succ.indexOf(Math.max(...succ))] === people[big] ? people[(big + 1) % 3] : people[succ.indexOf(Math.max(...succ))]}, because they got the most ${thing.short.toLowerCase()}`,
        `${people[trials.indexOf(Math.min(...trials))]}, because they did the fewest trials`,
        `${people[(big + 2) % 3]}, because their results are in the middle`,
        'All three are equally reliable',
      ],
      count: 4,
      solution: ['More trials give a more reliable relative frequency.', `${people[big]} did ${trials[big]} trials – the most.`, `Answer: ${people[big]}`],
    };
  }
  const form = shortDecimal3(p) ? 'dec' : 'frac';
  return {
    prompt: `Three friends each ${thing.act.replace(/s /, ' ')} several times and record how often ${thing.ev}.${tbl}Use <b>all</b> the results to work out the best estimate of the probability that ${thing.ev}.`,
    answer: pf(p, form),
    distractors: probOpts(p, [meanRF, rfs[big], rfs[0], rfs[1], rfs[2], frac(S, T + trials[0]), frac(succ[big], T)], form),
    typed: typedP(p, form),
    solution: [
      'Combine all the trials – a bigger sample gives a better estimate. (Don\'t average the three relative frequencies: the groups are different sizes.)',
      `Total trials: $${trials.join(' + ')} = ${T}$. Total ${thing.short.toLowerCase()}: $${succ.join(' + ')} = ${S}$.`,
      `Estimate $= \\frac{${S}}{${T}}${form === 'dec' ? ` = ${tnum(p.value())}` : p.d !== T ? ` = ${p.tex()}` : ''}$`,
      `Answer: ${pf(p, form)}`,
    ],
  };
}, { title: 'Best estimate of a probability from experiments' });

function shortDecimal3(f) { const x = f.value() * 1000; return Math.abs(x - Math.round(x)) < 1e-9; }

export const efReverse = gen('prob-ef-reverse', 'prob-expected-frequency', (rng, d) => {
  const mode = pick(rng, size(d, ['count', 'total'], ['total', 'third', 'count'], ['third', 'total', 'extra']));
  const who = pick(rng, names(rng, 5));
  if (mode === 'count') {
    const rf = frac(int(rng, 1, 19) * 5, 100);
    const n = rf.d * int(rng, 2, 20);
    const ans = rf.mul(n).value();
    const obj = pick(rng, [['spins a spinner', 'lands on red'], ['throws a coin', 'lands on heads'], ['rolls a dice', 'lands on 6'], ['drops a drawing pin', 'lands point up']]);
    return {
      prompt: `${who} ${obj[0]} ${n} times. The relative frequency that it ${obj[1]} is $${tnum(rf.value())}$.<br>How many times did it ${obj[1].replace(/^lands/, 'land')}?`,
      answer: num(ans), distractors: countOpts(ans, [n - ans, Math.round(n / rf.value()), Math.round(rf.value() * 100), Math.round(n / 10)]),
      typed: { kind: 'number', value: ans },
      solution: ['Number of times = relative frequency × number of trials.', `$${tnum(rf.value())} \\times ${n} = ${ans}$`, `Answer: ${num(ans)}`],
    };
  }
  if (mode === 'total') {
    const rf = pick(rng, [frac(2, 5), frac(1, 4), frac(3, 10), frac(3, 4), frac(1, 5), frac(3, 5), frac(9, 20), frac(7, 20), frac(16, 25)]);
    const k = rf.n * int(rng, 5, 40);
    const n = k / rf.n * rf.d;
    const obj = pick(rng, [['A coin is thrown and lands on tails', 'tails', 'How many times was the coin thrown?'], ['A spinner is spun and lands on green', 'green', 'How many times was the spinner spun?'], ['A basketball player scores', 'scoring', 'How many shots did the player take?'], ['A drawing pin is dropped and lands point down', 'point down', 'How many times was the pin dropped?'], ['A biased dice is rolled and lands on a six', 'a six', 'How many times was the dice rolled?']]);
    return {
      prompt: `${obj[0]} ${k} times in total. The relative frequency of ${obj[1]} is $${tnum(rf.value())}$.<br>${obj[2]}`,
      answer: num(n), distractors: countOpts(n, [Math.round(k * rf.value()), k + Math.round(k * rf.value()), Math.round(k / (1 - rf.value())), k * 2, Math.round(k * (1 + rf.value()))]),
      typed: { kind: 'number', value: n },
      solution: [`Relative frequency = $\\dfrac{\\text{number of times}}{\\text{total}}$, so total = number of times ÷ relative frequency.`, `$${k} \\div ${tnum(rf.value())} = ${tnum(n)}$`, `Answer: ${num(n)}`],
    };
  }
  if (mode === 'third') {
    const n = pick(rng, [50, 80, 125, 150, 200, 250, 350, 400, 500]);
    const a = frac(int(rng, 2, 9) * pick(rng, [1, 2]), 100); const b = frac(int(rng, 10, 60), 100);
    const c = frac(1).sub(a).sub(b);
    if (c.n <= 0 || !a.mul(n).isInt || !b.mul(n).isInt) throw new Error('n');
    const ans = c.mul(n).value();
    const [c1, c2, c3] = sample(rng, ['red', 'blue', 'green', 'yellow'], 3);
    return {
      prompt: `A spinner can land on ${c1}, ${c2} or ${c3}. After ${n} spins<br>&nbsp;&nbsp;relative frequency of ${c1} $= ${tnum(a.value())}$<br>&nbsp;&nbsp;relative frequency of ${c2} $= ${tnum(b.value())}$<br>Work out the number of times the spinner landed on ${c3}.`,
      answer: num(ans), distractors: countOpts(ans, [Math.round(c.value() * 100), a.mul(n).value() + b.mul(n).value(), n - a.mul(n).value(), n - b.mul(n).value(), Math.round(n * (a.value() + b.value()) / 2)]),
      typed: { kind: 'number', value: ans },
      solution: [
        `The relative frequencies add up to $1$: ${c3} $= 1 - ${tnum(a.value())} - ${tnum(b.value())} = ${tnum(c.value())}$.`,
        `Number of ${c3}: $${tnum(c.value())} \\times ${n} = ${ans}$`,
        `Answer: ${num(ans)}`,
      ],
    };
  }
  // extra trials: after 250 spins with h heads, 50 more; overall RF known -> heads in the extra
  const n1 = pick(rng, [150, 200, 250]); const n2 = pick(rng, [50, 100]);
  const h1 = Math.round(n1 * (0.45 + rng() * 0.1));
  const rf = frac(int(rng, 44, 56), 100);
  const total = rf.mul(n1 + n2);
  if (!total.isInt) throw new Error('n');
  const h2 = total.value() - h1;
  if (h2 <= 0 || h2 >= n2) throw new Error('h2');
  return {
    prompt: `A coin is spun ${n1} times and lands on heads ${h1} times. It is then spun another ${n2} times.<br>After all ${n1 + n2} spins, the relative frequency of heads is $${tnum(rf.value())}$.<br>How many heads were there in the extra ${n2} spins?`,
    answer: num(h2), distractors: countOpts(h2, [rf.mul(n2).value(), total.value(), n2 - h2, Math.round(rf.value() * 100), h1 - h2]),
    typed: { kind: 'number', value: h2 },
    solution: [
      `Total heads after ${n1 + n2} spins: $${tnum(rf.value())} \\times ${n1 + n2} = ${total.value()}$.`,
      `Heads in the extra spins: $${total.value()} - ${h1} = ${h2}$.`,
      `Answer: ${num(h2)}`,
    ],
  };
}, { title: 'Work backwards from a relative frequency' });

export const efTableExpected = gen('prob-ef-table-expected', 'prob-expected-frequency', (rng, d) => {
  const mode = size(d, 'dice', pick(rng, ['dice', 'mix']), pick(rng, ['mix', 'profit']));
  if (mode === 'dice') {
    let ps;
    do { ps = Array.from({ length: 6 }, () => int(rng, 1, 7) * 5); } while (ps.reduce((a, b) => a + b, 0) !== 100);
    const ev = pick(rng, [['odd', (s) => s % 2 === 1], ['even', (s) => s % 2 === 0], ['greater than 4', (s) => s > 4], ['a prime number', isPrime], ['less than 3', (s) => s < 3]]);
    const n = pick(rng, [100, 200, 300, 400, 500, 1000]);
    const fav = range(1, 6).filter(ev[1]);
    const pSum = fav.reduce((a, s) => a + ps[s - 1], 0);
    const ans = (pSum * n) / 100;
    return {
      prompt: `A biased dice is thrown. Here are the probabilities of each score.${table([['Score', ...range(1, 6).map(String)], ['Probability', ...ps.map((x) => tnum(x / 100))]], { firstColHeader: true })}The dice is thrown ${n} times. Work out the expected number of times the score will be ${ev[0]}.`,
      answer: num(ans),
      distractors: countOpts(ans, [n / 2, (n * fav.length) / 6, (ps[fav[0] - 1] * n) / 100, n - ans, pSum, (n * fav.length) / 6 + 10]),
      typed: { kind: 'number', value: ans },
      solution: [
        `Scores that are ${ev[0]}: ${fav.join(', ')}. They cannot happen together, so add: $${fav.map((s) => tnum(ps[s - 1] / 100)).join(' + ')} = ${tnum(pSum / 100)}$.`,
        `Expected number $= ${tnum(pSum / 100)} \\times ${n} = ${num(ans)}$`,
        `Answer: ${num(ans)}`,
      ],
    };
  }
  if (mode === 'mix') {
    const days = pick(rng, [30, 20, 50, 60]);
    const p = pick(rng, [0.4, 0.3, 0.2, 0.6, 0.7, 0.25]);
    if (!Number.isInteger(days * p)) throw new Error('days');
    const a = int(rng, 3, 9) * 100; const b = a + int(rng, 1, 6) * 100;
    const ans = days * p * a + days * (1 - p) * b;
    const place = pick(rng, [['a theme park', 'visitors'], ['a beach café', 'customers'], ['an ice-cream van', 'sales'], ['a swimming pool', 'swimmers']]);
    return {
      prompt: `The number of ${place[1]} at ${place[0]} depends on the weather.${table([['Temperature', `Expected number of ${place[1]} each day`], ['Less than 21°C', num(a)], ['21°C or more', num(b)]])}On each of ${days} days, the probability that the temperature is less than 21°C is $${tnum(p)}$.<br>Work out the total expected number of ${place[1]} over the ${days} days.`,
      answer: num(ans),
      distractors: countOpts(ans, [days * (a + b) / 2, days * p * b + days * (1 - p) * a, days * p * a, days * b, days * a, p * a + (1 - p) * b]),
      typed: { kind: 'number', value: ans },
      solution: [
        `Expected cold days: $${tnum(p)} \\times ${days} = ${tnum(days * p)}$; warm days: $${days} - ${tnum(days * p)} = ${tnum(days * (1 - p))}$.`,
        `${cap(place[1])}: $${tnum(days * p)} \\times ${tnum(a)} + ${tnum(days * (1 - p))} \\times ${tnum(b)} = ${tnum(days * p * a)} + ${tnum(days * (1 - p) * b)}$`,
        `$= ${tnum(ans)}$`,
        `Answer: ${num(ans)}`,
      ],
    };
  }
  // profit from a game
  const cost = pick(rng, [0.5, 1, 2]); const prize = cost * pick(rng, [4, 5, 8, 10]);
  const p = pick(rng, [0.1, 0.05, 0.15, 0.2, 0.08]);
  const n = pick(rng, [100, 200, 400, 500]);
  const winners = Math.round(n * p);
  const profit = n * cost - winners * prize;
  if (profit <= 0) throw new Error('loss');
  return {
    prompt: `At a school fair, it costs ${money(cost, { forcePence: cost < 1 })} to play a game. The probability of winning is $${tnum(p)}$. A winner gets ${money(prize)} (and does not get the ${money(cost, { forcePence: cost < 1 })} back).<br>${n} people play the game. Work out the expected profit for the school.`,
    answer: money(profit),
    distractors: [money(n * cost), money(n * cost - n * p), money(winners * prize), money(n * cost - (n - winners) * prize > 0 ? n * cost - (n - winners) * prize : profit + 10), money(n * cost + winners * prize), money(profit + prize), money(profit - prize)],
    solution: [
      `Money taken: ${n} × ${money(cost, { forcePence: cost < 1 })} = ${money(n * cost)}.`,
      `Expected number of winners: $${tnum(p)} \\times ${n} = ${winners}$. They win ${winners} × ${money(prize)} = ${money(winners * prize)}.`,
      `Expected profit: ${money(n * cost)} − ${money(winners * prize)} = ${money(profit)}`,
      `Answer: ${money(profit)}`,
    ],
  };
}, { title: 'Expected outcomes from a probability table or a game' });

export const sampleArchetypes = [ssTwoDice, ssTwoSpinners, ssListing, ssPairs, ssCode];
export const expectedArchetypes = [efExpected, efRelFreq, efFair, efBestEstimate, efReverse, efTableExpected];

void [shuffle, probOpts, pt, spinner];
