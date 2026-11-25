// Probability basics: the probability scale, single events, probabilities that add to 1.
import {
  pick, int, sample, shuffle, size, frac, Frac, num, tnum, names, cap, gcd, table,
} from '../../core.js';
import { probScale, cards, spinner, bag } from './diagrams.js';
import {
  pgen as gen, ft, pf, pt, typedP, probOpts, countOpts, an, aWord, listAnd, shortDecimal,
} from './util.js';

/* ================================================================== */
/* Shared: scenes of equally likely outcomes with many events          */
/* ================================================================== */

const isPrime = (n) => n > 1 && [...Array(n).keys()].slice(2).every((d) => n % d);
const isSquare = (n) => Number.isInteger(Math.sqrt(n));

/** Events for outcomes 1..N (dice, cards, spinner). Each event: { text, n, d }. */
function numberEvents(N) {
  const nums = Array.from({ length: N }, (_, i) => i + 1);
  const count = (f) => nums.filter(f).length;
  const ev = [];
  ev.push({ text: aWord(N + 1), n: 0 }, { text: 'a 0', n: 0 }, { text: `a number greater than ${N}`, n: 0 });
  ev.push({ text: `a number less than ${N + 1}`, n: N }, { text: `a whole number from 1 to ${N}`, n: N });
  for (let k = 1; k <= N; k += 1) ev.push({ text: aWord(k), n: 1 });
  for (let k = 1; k < N; k += 1) ev.push({ text: `a number greater than ${k}`, n: N - k });
  for (let k = 2; k <= N; k += 1) ev.push({ text: `a number less than ${k}`, n: k - 1 });
  ev.push({ text: 'an even number', n: count((x) => x % 2 === 0) }, { text: 'an odd number', n: count((x) => x % 2 === 1) });
  ev.push({ text: 'a prime number', n: count(isPrime) }, { text: 'a square number', n: count(isSquare) });
  ev.push({ text: 'a multiple of 3', n: count((x) => x % 3 === 0) });
  if (N >= 8) ev.push({ text: 'a multiple of 4', n: count((x) => x % 4 === 0) });
  return ev.map((e) => ({ ...e, d: N }));
}

/** A scene: { intro, verb, events, visual? }. */
function scaleScene(rng, kind) {
  if (kind === 'dice') return { intro: 'An ordinary fair six-sided dice is rolled once.', verb: 'Getting', events: numberEvents(6) };
  if (kind === 'cards') {
    return { intro: 'Ten cards are numbered 1 to 10. One card is taken at random.', verb: 'Taking a card showing', events: numberEvents(10), visual: cards(Array.from({ length: 10 }, (_, i) => String(i + 1))) };
  }
  if (kind === 'spinner') {
    return {
      intro: 'This fair spinner has eight equal sections numbered 1 to 8. It is spun once.', verb: 'Landing on', events: numberEvents(8),
      visual: spinner(Array.from({ length: 8 }, (_, i) => ({ label: String(i + 1) })), { r: 86 }),
    };
  }
  if (kind === 'bag') {
    const total = pick(rng, [8, 10, 12]);
    const half = total / 2;
    const b = int(rng, 1, half - 1);
    const [c1, c2, c3] = sample(rng, ['red', 'blue', 'green', 'yellow', 'white', 'black'], 3);
    const missing = pick(rng, ['purple', 'orange', 'pink'].filter((c) => ![c1, c2, c3].includes(c)));
    const g = half - b;
    const ev = [
      { text: `${aWord(c1)} counter`, n: half },
      { text: `${aWord(c2)} counter`, n: b }, { text: `${aWord(c3)} counter`, n: g },
      { text: `a counter that is not ${c2}`, n: total - b }, { text: `a counter that is not ${c3}`, n: total - g },
      { text: `${aWord(missing)} counter`, n: 0 },
      { text: `a counter that is ${c1}, ${c2} or ${c3}`, n: total },
      { text: `${aWord(c2)} or ${c3} counter`, n: half },
    ];
    return {
      intro: `A bag contains ${half} ${c1} counters, ${b} ${c2} ${b === 1 ? 'counter' : 'counters'} and ${g} ${c3} ${g === 1 ? 'counter' : 'counters'}. One counter is taken at random.`,
      verb: 'Taking', events: ev.map((e) => ({ ...e, d: total })),
    };
  }
  if (kind === 'months') {
    return {
      intro: 'A month of the year is chosen at random.', verb: 'Choosing',
      events: [
        { text: 'a month beginning with J', n: 3 }, { text: 'a month beginning with M', n: 2 }, { text: 'a month that does not begin with J', n: 9 },
        { text: 'a month in the first half of the year', n: 6 }, { text: 'a month with 32 days', n: 0 }, { text: 'a month with at least 28 days', n: 12 },
        { text: 'December', n: 1 }, { text: 'a month in the last half of the year', n: 6 }, { text: 'a month that is not February', n: 11 },
        { text: 'a month beginning with Z', n: 0 }, { text: 'a month with fewer than 40 days', n: 12 },
      ].map((e) => ({ ...e, d: 12 })),
    };
  }
  if (kind === 'days') {
    return {
      intro: 'A day of the week is chosen at random.', verb: 'Choosing',
      events: [
        { text: 'a weekday (Monday to Friday)', n: 5 }, { text: 'Saturday or Sunday', n: 2 }, { text: 'a day beginning with T', n: 2 },
        { text: 'a day ending in "day"', n: 7 }, { text: 'a day beginning with B', n: 0 }, { text: 'Wednesday', n: 1 },
        { text: 'a day that is not Monday', n: 6 }, { text: 'a day with 25 hours', n: 0 }, { text: 'a day beginning with S', n: 2 },
      ].map((e) => ({ ...e, d: 7 })),
    };
  }
  // letters
  const w = pick(rng, [
    { word: 'BANANA', ev: [['the letter A', 3], ['the letter B', 1], ['the letter N', 2], ['a letter that is not B', 5], ['a letter that is not N', 4], ['the letter Z', 0], ['the letter E', 0], ['a letter from the word BAN', 6]] },
    { word: 'PEPPER', ev: [['the letter P', 3], ['the letter E', 2], ['the letter R', 1], ['a letter that is not R', 5], ['a letter that is not E', 4], ['the letter A', 0], ['a vowel', 2], ['a letter from the word PERP', 6]] },
    { word: 'LETTER', ev: [['the letter T', 2], ['the letter L', 1], ['a vowel', 2], ['a consonant', 4], ['the letter S', 0], ['a letter that is not L', 5], ['a letter from the word TREBLE', 6], ['the letter T or the letter E', 4]] },
    { word: 'COOKBOOK', ev: [['the letter O', 4], ['the letter K', 2], ['the letter C', 1], ['a letter that is not O', 4], ['a letter that is not C', 7], ['the letter A', 0], ['a letter from the word BOOK or COOK', 8], ['a consonant', 4]] },
  ]);
  return {
    intro: `The letters of the word <b>${w.word}</b> are written on cards. One card is taken at random.`, verb: 'Taking',
    events: w.ev.map(([text, n]) => ({ text, n, d: w.word.length })), visual: cards(w.word.split('')),
  };
}

const WORDS = ['impossible', 'unlikely', 'even chance', 'likely', 'certain'];
const wordOf = (e) => {
  const v = e.n / e.d;
  if (v === 0) return 'impossible';
  if (v === 1) return 'certain';
  if (v === 0.5) return 'even chance';
  return v < 0.5 ? 'unlikely' : 'likely';
};

/* ================================================================== */
/* prob-scale                                                          */
/* ================================================================== */

export const scaleWordsMatch = gen('prob-scale-words-match', 'prob-scale', (rng, d) => {
  const kinds = size(d, ['dice', 'bag', 'days', 'cards'], ['dice', 'bag', 'cards', 'spinner', 'months', 'days', 'letters'], ['bag', 'cards', 'spinner', 'months', 'letters']);
  const scene = scaleScene(rng, pick(rng, kinds));
  const byWord = {};
  shuffle(rng, scene.events).forEach((e) => { (byWord[wordOf(e)] ||= []).push(e); });
  const avail = WORDS.filter((w) => byWord[w]);
  const target = pick(rng, avail.filter((w) => d !== 'easy' || w !== 'even chance'));
  const chosen = avail.map((w) => byWord[w][0]);
  const right = byWord[target][0];
  const opt = (e) => `${scene.verb} ${e.text}`;
  const phrase = target === 'even chance' ? 'has an <b>even chance</b> of happening' : `is <b>${target}</b>`;
  const why = {
    impossible: `it can never happen: none of the ${num(right.d)} equally likely outcomes give it, so its probability is $0$.`,
    certain: `it must happen: all ${num(right.d)} outcomes give it, so its probability is $1$.`,
    'even chance': `exactly half of the outcomes give it: $\\frac{${right.n}}{${right.d}} = \\frac{1}{2}$.`,
    unlikely: `fewer than half of the outcomes give it: $${frac(right.n, right.d).tex()}$ is less than $\\frac{1}{2}$.`,
    likely: `more than half of the outcomes give it: $${frac(right.n, right.d).tex()}$ is more than $\\frac{1}{2}$.`,
  };
  return {
    prompt: `${scene.intro}<br>Which of these outcomes ${phrase}?`,
    visual: d === 'easy' ? scene.visual : undefined,
    answer: opt(right),
    distractors: chosen.filter((e) => e !== right).map(opt),
    count: chosen.length,
    solution: [
      'On the probability scale: impossible = $0$, even chance = $\\frac{1}{2}$, certain = $1$. Unlikely is between $0$ and $\\frac{1}{2}$; likely is between $\\frac{1}{2}$ and $1$.',
      `Count the outcomes for each option. "${cap(right.text)}" happens in ${num(right.n)} of the ${num(right.d)} outcomes.`,
      `So it is ${target}: ${why[target]}`,
      `Answer: ${opt(right)}`,
    ],
  };
}, { title: 'Match an outcome to impossible / unlikely / even chance / likely / certain' });

export const scaleArrowEvent = gen('prob-scale-arrow-event', 'prob-scale', (rng, d) => {
  const kind = pick(rng, size(d, ['dice', 'cards'], ['dice', 'cards', 'spinner', 'bag'], ['spinner', 'bag', 'cards', 'letters']));
  const scene = scaleScene(rng, kind);
  const byVal = new Map();
  shuffle(rng, scene.events).forEach((e) => { const k = e.n / e.d; if (!byVal.has(k)) byVal.set(k, e); });
  const vals = [...byVal.keys()].sort((a, b) => a - b);
  const inner = vals.filter((v) => v > 0 && v < 1 && (d === 'easy' ? v !== 0.5 || true : true));
  const v = pick(rng, inner);
  const right = byVal.get(v);
  // Nearest other values first: they are the plausible misreads of the arrow.
  const others = vals.filter((x) => x !== v).sort((a, b) => Math.abs(a - v) - Math.abs(b - v));
  if (others.length < 4) throw new Error('scene too small');
  const opt = (e) => `${scene.verb} ${e.text}`;
  const den = right.d;
  return {
    prompt: `${scene.intro}<br>The arrow on the probability scale shows the probability of one outcome. Which outcome could it be?`,
    visual: probScale({ divisions: den, marks: [{ p: v }], half: false }),
    answer: opt(right),
    distractors: others.slice(0, 6).map((x) => opt(byVal.get(x))),
    solution: [
      `The scale from $0$ to $1$ is split into ${num(den)} equal parts, one for each equally likely outcome.`,
      `The arrow is at mark ${num(right.n)} of ${num(den)}, so the probability is $\\frac{${right.n}}{${den}}$.`,
      `"${cap(right.text)}" happens in ${num(right.n)} of the ${num(den)} outcomes.`,
      `Answer: ${opt(right)}`,
    ],
  };
}, { title: 'Which outcome is shown by the arrow on a probability scale?' });

export const scaleReadValue = gen('prob-scale-read-value', 'prob-scale', (rng, d) => {
  const den = pick(rng, size(d, [4, 10], [5, 8, 10], [8, 20, 5]));
  const k = int(rng, 1, den - 1);
  const p = frac(k, den);
  const form = den === 10 || den === 20 ? 'dec' : (den === 5 || den === 4) && d !== 'easy' ? pick(rng, ['dec', 'frac']) : 'frac';
  const ask = form === 'dec' ? 'Give your answer as a decimal.' : 'Give your answer as a fraction in its simplest form.';
  const ticks = den + 1;
  return {
    prompt: `The arrow on this probability scale shows the probability that an event happens. The scale is divided into equal parts.<br>What is the probability? ${ask}`,
    visual: probScale({ divisions: den, marks: [{ p: k / den, label: '' }], words: d === 'easy' }),
    answer: pf(p, form),
    distractors: probOpts(p, [
      frac(k, ticks), // counted tick marks instead of gaps
      frac(k + 1, den), frac(k - 1, den), // miscounted
      frac(den - k, den), // read from the wrong end
      frac(k, 10), frac(k, den + 2), frac(k + 1, ticks),
    ], form),
    typed: form === 'frac' ? { kind: 'number', value: p, form: 'simplest' } : typedP(p, form),
    solution: [
      `Count the equal gaps between $0$ and $1$: there are ${num(den)}, so each gap is $\\frac{1}{${den}}$${form === 'dec' ? ` $= ${tnum(1 / den)}$` : ''}.`,
      'Count gaps (not tick marks) from $0$ to the arrow.',
      `The arrow is ${num(k)} ${k === 1 ? 'gap' : 'gaps'} along: $${k} \\times \\frac{1}{${den}} = \\frac{${k}}{${den}}${p.d !== den ? ` = ${p.tex()}` : ''}${form === 'dec' ? ` = ${tnum(p.value())}` : ''}$.`,
      `Answer: ${pf(p, form)}`,
    ],
  };
}, { title: 'Read a probability from an arrow on a scale' });

/** Probability written in a given surface form, for ordering questions. */
const surface = (v, form) => {
  if (form === 'pct') return `${tnum(v * 100)}\\%`;
  if (form === 'dec') return tnum(v);
  const f = frac(Math.round(v * 1000), 1000);
  return f.tex();
};

export const scaleOrder = gen('prob-scale-order', 'prob-scale', (rng, d) => {
  // Build four probabilities in mixed forms that are close together (the real exam trick).
  for (let tries = 0; tries < 40; tries += 1) {
    const fracPool = size(d, [[1, 4], [1, 2], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 10], [3, 10], [7, 10]], [[1, 4], [3, 4], [2, 5], [3, 5], [3, 8], [5, 8], [3, 10], [7, 10], [9, 20], [11, 20]], [[3, 8], [5, 8], [7, 8], [9, 20], [13, 20], [7, 25], [17, 25], [4, 10], [6, 10], [33, 50]]);
    const [fn, fd] = pick(rng, fracPool);
    const base = fn / fd;
    const vals = new Set([Math.round(base * 1000)]);
    const items = [{ v: base, tex: `\\frac{${fn}}{${fd}}` }];
    const forms = shuffle(rng, ['pct', 'dec', 'dec3']);
    for (const form of forms) {
      let v;
      const spread = size(d, 0.2, 0.08, 0.04);
      if (form === 'pct') v = Math.round((base + (rng() - 0.5) * 2 * spread) * 100) / 100;
      else if (form === 'dec') v = Math.round((base + (rng() - 0.5) * 2 * spread) * 10) / 10;
      else v = Math.round((base + (rng() - 0.5) * 2 * spread) * 1000) / 1000;
      if (d === 'hard' && form === 'dec3' && rng() < 0.6) {
        // e.g. 0.404 next to 0.44 or 0.4: same digits, different place values.
        const t = Math.floor(base * 10);
        v = pick(rng, [t / 10 + t / 1000, t / 10 + 0.004, t / 10 + 0.04 + t / 1000]);
      }
      if (v <= 0 || v >= 1 || vals.has(Math.round(v * 1000))) continue;
      vals.add(Math.round(v * 1000));
      items.push({ v, tex: form === 'pct' ? `${tnum(Math.round(v * 100))}\\%` : tnum(v) });
    }
    if (items.length < 4) continue;
    const sorted = [...items].sort((a, b) => a.v - b.v);
    const show = shuffle(rng, items);
    const asList = (arr) => arr.map((x) => `$${x.tex}$`).join(', ');
    const mode = pick(rng, size(d, ['most', 'least', 'order'], ['order', 'most', 'least'], ['order', 'order', 'most']));
    if (mode === 'order') {
      const wrongs = [
        [...sorted].reverse(),
        // compare the digits as written (ignore place value / percent sign)
        [...items].sort((a, b) => Number(a.tex.replace(/\\frac\{(\d+)\}\{(\d+)\}/, '$1').replace(/[^\d]/g, '')) - Number(b.tex.replace(/\\frac\{(\d+)\}\{(\d+)\}/, '$1').replace(/[^\d]/g, ''))),
        [sorted[1], sorted[0], sorted[2], sorted[3]], [sorted[0], sorted[2], sorted[1], sorted[3]], [sorted[0], sorted[1], sorted[3], sorted[2]], show,
      ];
      return {
        prompt: `Here are four probabilities: ${asList(show)}<br>Which list puts them in order, starting with the <b>least</b> likely?`,
        answer: asList(sorted),
        distractors: wrongs.map(asList),
        count: 4,
        solution: [
          'Write every probability in the same form, e.g. as a decimal with the same number of decimal places.',
          sorted.map((x) => `$${x.tex} = ${tnum(x.v, 3)}$`).join(', '),
          'Smallest decimal = least likely.',
          `Answer: ${asList(sorted)}`,
        ],
      };
    }
    const most = mode === 'most';
    const right = most ? sorted[3] : sorted[0];
    return {
      prompt: `Which of these probabilities shows the <b>${most ? 'most' : 'least'}</b> likely event?`,
      answer: `$${right.tex}$`,
      distractors: items.filter((x) => x !== right).map((x) => `$${x.tex}$`),
      count: 4,
      solution: [
        'Convert them all to decimals (with 3 decimal places) so they are easy to compare.',
        sorted.map((x) => `$${x.tex} = ${tnum(x.v, 3)}$`).join(', '),
        `The ${most ? 'largest' : 'smallest'} probability is the ${most ? 'most' : 'least'} likely.`,
        `Answer: $${right.tex}$`,
      ],
    };
  }
  throw new Error('could not build ordering');
}, { title: 'Order probabilities given as fractions, decimals and percentages' });

export const scaleNotProbability = gen('prob-scale-impossible-value', 'prob-scale', (rng, d) => {
  const bad = pick(rng, size(d, [
    { tex: tnum(pick(rng, [1.2, 1.5, 2, 1.1])), why: 'it is bigger than $1$' },
    { tex: `-${tnum(pick(rng, [0.2, 0.5, 0.3]))}`, why: 'it is negative' },
  ], [
    { tex: `${pick(rng, [110, 120, 150, 105])}\\%`, why: 'it is more than $100\\%$' },
    { tex: `\\frac{${pick(rng, [5, 7, 9])}}{${pick(rng, [4, 3])}}`, why: 'the numerator is bigger than the denominator, so it is more than $1$' },
    { tex: tnum(pick(rng, [1.2, 1.05, 1.5])), why: 'it is bigger than $1$' },
    { tex: `-${tnum(pick(rng, [0.1, 0.25, 0.4]))}`, why: 'it is negative' },
  ], [
    { tex: `\\frac{${pick(rng, [11, 13, 17])}}{${pick(rng, [10, 12])}}`, why: 'the numerator is bigger than the denominator, so it is more than $1$' },
    { tex: tnum(pick(rng, [1.01, 1.001, 1.25])), why: 'it is bigger than $1$' },
    { tex: `${pick(rng, [100.5, 101, 102])}\\%`, why: 'it is more than $100\\%$' },
    { tex: `-\\frac{1}{${pick(rng, [2, 3, 4, 5])}}`, why: 'it is negative' },
  ]));
  const good = shuffle(rng, [
    tnum(pick(rng, [0.99, 0.95, 0.09, 0.9])), `${pick(rng, [99, 1, 50, 75, 5])}\\%`, `\\frac{${pick(rng, [5, 7, 11])}}{${pick(rng, [12, 13])}}`,
    '0', '1', tnum(pick(rng, [0.001, 0.05, 0.5])), `\\frac{${pick(rng, [1, 3])}}{${pick(rng, [100, 50])}}`, `${pick(rng, [100, 0.5, 12.5])}\\%`,
  ]).slice(0, 6);
  return {
    prompt: pick(rng, [
      `Five students estimate the probability that ${pick(rng, NOT_CONTEXTS)[0]}. Which of their answers <b>cannot</b> be a probability?`,
      `Five people give a value for the probability that ${pick(rng, NOT_CONTEXTS)[0]}. Which value is definitely wrong?`,
      `${pick(rng, ['Ravi', 'Zara', 'Leo', 'Nadia'])} thinks of the probability that ${pick(rng, NOT_CONTEXTS)[0]}. Which of these could it <b>not</b> be?`,
      `A weather app gives the probability that ${pick(rng, ['it will rain', 'it will snow', 'it will be sunny', 'there will be fog'])} tomorrow. Which of these values could <b>not</b> be shown?`,
      `${pick(rng, ['Ravi', 'Zara', 'Leo', 'Nadia'])} writes down five probabilities. One of them is definitely wrong. Which one?`,
      'Which of these values is <b>impossible</b> as the probability of an event?',
    ]),
    answer: `$${bad.tex}$`,
    distractors: good.map((g) => `$${g}$`),
    solution: [
      'Every probability is between $0$ (impossible) and $1$ (certain), including $0$ and $1$ themselves. As a percentage that is $0\\%$ to $100\\%$.',
      `$${bad.tex}$ cannot be a probability because ${bad.why}.`,
      `Answer: $${bad.tex}$`,
    ],
  };
}, { title: 'Which value cannot be a probability?' });

/* ================================================================== */
/* prob-single-event                                                   */
/* ================================================================== */

// Contexts with several kinds of equally likely items. phrase(kind, n) describes n of them;
// one(kind) is the event; noun is what is picked.
const COLLECTIONS = [
  { intro: (list) => `A bag contains ${list}.`, adj: true, noun: 'counters', kinds: ['red', 'blue', 'green', 'yellow', 'white', 'black'], phrase: (k, n) => `${n} ${k} ${n === 1 ? 'counter' : 'counters'}`, pickTxt: 'A counter is taken from the bag at random.', one: (k) => `the counter is ${k}`, not: (k) => `the counter is <b>not</b> ${k}`, or: (a, b) => `the counter is ${a} or ${b}` },
  { intro: (list) => `A box of chocolates contains ${list}.`, adj: true, noun: 'chocolates', kinds: ['milk', 'dark', 'white', 'caramel', 'mint'], phrase: (k, n) => `${n} ${k} ${n === 1 ? 'chocolate' : 'chocolates'}`, pickTxt: 'Ella takes a chocolate at random.', one: (k) => `she takes ${aWord(k)} chocolate`, not: (k) => `she does <b>not</b> take ${aWord(k)} chocolate`, or: (a, b) => `she takes ${aWord(a)} or ${aWord(b)} chocolate` },
  { intro: (list) => `A packet of sweets has ${list}.`, adj: true, noun: 'sweets', kinds: ['strawberry', 'lemon', 'orange', 'lime', 'blackcurrant'], phrase: (k, n) => `${n} ${k} ${n === 1 ? 'sweet' : 'sweets'}`, pickTxt: 'One sweet is picked at random.', one: (k) => `the sweet is ${k}`, not: (k) => `the sweet is <b>not</b> ${k}`, or: (a, b) => `the sweet is ${a} or ${b}` },
  { intro: (list) => `In a pencil case there are ${list}.`, adj: true, noun: 'pens', kinds: ['black', 'blue', 'red', 'green', 'purple'], phrase: (k, n) => `${n} ${k} ${n === 1 ? 'pen' : 'pens'}`, pickTxt: 'Kai takes out a pen without looking.', one: (k) => `the pen is ${k}`, not: (k) => `the pen is <b>not</b> ${k}`, or: (a, b) => `the pen is ${a} or ${b}` },
  { intro: (list) => `A fruit bowl holds ${list}.`, adj: false, noun: 'pieces of fruit', kinds: ['apples', 'bananas', 'oranges', 'pears', 'plums'], phrase: (k, n) => `${n} ${n === 1 ? k.replace(/s$/, '') : k}`, pickTxt: 'A piece of fruit is chosen at random.', one: (k) => `it is ${an(k)} ${k.replace(/s$/, '')}`, not: (k) => `it is <b>not</b> ${an(k)} ${k.replace(/s$/, '')}`, or: (a, b) => `it is ${an(a)} ${a.replace(/s$/, '')} or ${an(b)} ${b.replace(/s$/, '')}` },
  { intro: (list) => `In a class, ${list}.`, adj: false, noun: 'students', kinds: ['walk to school', 'come by bus', 'come by car', 'cycle'], phrase: (k, n) => `${n} ${n === 1 ? 'student' : 'students'} ${n === 1 ? k.replace(/^walk/, 'walks').replace(/^come/, 'comes').replace(/^cycle/, 'cycles') : k}`, pickTxt: 'One student is chosen at random to answer a survey.', one: (k) => `the student ${k.replace(/^walk/, 'walks').replace(/^come/, 'comes').replace(/^cycle/, 'cycles')}`, not: (k) => `the student does <b>not</b> ${k}`, or: (a, b) => `the student ${a.replace(/^walk/, 'walks').replace(/^come/, 'comes').replace(/^cycle/, 'cycles')} or ${b.replace(/^walk/, 'walks').replace(/^come/, 'comes').replace(/^cycle/, 'cycles')}` },
  { intro: (list) => `A playlist has ${list}.`, adj: true, noun: 'songs', kinds: ['pop', 'rock', 'jazz', 'rap', 'folk'], phrase: (k, n) => `${n} ${k} ${n === 1 ? 'song' : 'songs'}`, pickTxt: 'The playlist is put on shuffle, so the first song is chosen at random.', one: (k) => `the first song is a ${k} song`, not: (k) => `the first song is <b>not</b> a ${k} song`, or: (a, b) => `the first song is a ${a} or a ${b} song` },
  { intro: (list) => `A car park has ${list}.`, adj: true, noun: 'cars', kinds: ['silver', 'black', 'white', 'red', 'blue'], phrase: (k, n) => `${n} ${k} ${n === 1 ? 'car' : 'cars'}`, pickTxt: 'Each car is equally likely to be the first to leave.', one: (k) => `the first car to leave is ${k}`, not: (k) => `the first car to leave is <b>not</b> ${k}`, or: (a, b) => `the first car to leave is ${a} or ${b}` },
  { intro: (list) => `A shelf holds ${list}.`, adj: true, noun: 'books', kinds: ['fiction', 'history', 'science', 'poetry', 'sport'], phrase: (k, n) => `${n} ${k} ${n === 1 ? 'book' : 'books'}`, pickTxt: 'Priya picks a book at random.', one: (k) => `she picks a ${k} book`, not: (k) => `she does <b>not</b> pick a ${k} book`, or: (a, b) => `she picks a ${a} or a ${b} book` },
  { intro: (list) => `A drawer has ${list}.`, adj: true, noun: 'socks', kinds: ['black', 'white', 'grey', 'navy', 'striped'], phrase: (k, n) => `${n} ${k} ${n === 1 ? 'sock' : 'socks'}`, pickTxt: 'Tom takes one sock out in the dark.', one: (k) => `the sock is ${k}`, not: (k) => `the sock is <b>not</b> ${k}`, or: (a, b) => `the sock is ${a} or ${b}` },
  { intro: (list) => `A tin of biscuits contains ${list}.`, adj: true, noun: 'biscuits', kinds: ['chocolate', 'ginger', 'plain', 'oat', 'custard cream'], phrase: (k, n) => `${n} ${k} ${n === 1 ? 'biscuit' : 'biscuits'}`, pickTxt: 'Sam takes a biscuit at random.', one: (k) => `it is ${aWord(k)} biscuit`, not: (k) => `it is <b>not</b> ${aWord(k)} biscuit`, or: (a, b) => `it is ${aWord(a)} or ${aWord(b)} biscuit` },
  { intro: (list) => `In a raffle, the tickets sold were ${list}.`, adj: true, noun: 'tickets', kinds: ['pink', 'green', 'yellow', 'blue', 'orange'], phrase: (k, n) => `${n} ${k} ${n === 1 ? 'ticket' : 'tickets'}`, pickTxt: 'One ticket is drawn at random to win the prize.', one: (k) => `the winning ticket is ${k}`, not: (k) => `the winning ticket is <b>not</b> ${k}`, or: (a, b) => `the winning ticket is ${a} or ${b}` },
  { intro: (list) => `A sports club has ${list}.`, adj: false, noun: 'members', kinds: ['junior members', 'adult members', 'senior members'], phrase: (k, n) => `${n} ${n === 1 ? k.replace(/s$/, '') : k}`, pickTxt: 'One member is chosen at random to win a free kit.', one: (k) => `the winner is ${an(k)} ${k.replace(/s$/, '')}`, not: (k) => `the winner is <b>not</b> ${an(k)} ${k.replace(/s$/, '')}`, or: (a, b) => `the winner is ${an(a)} ${a.replace(/ members$/, '')} or ${an(b)} ${b.replace(/s$/, '')}` },
  { intro: (list) => `A jar contains ${list}.`, adj: true, noun: 'marbles', kinds: ['red', 'blue', 'clear', 'gold', 'green'], phrase: (k, n) => `${n} ${k} ${n === 1 ? 'marble' : 'marbles'}`, pickTxt: 'One marble is taken out at random.', one: (k) => `the marble is ${k}`, not: (k) => `the marble is <b>not</b> ${k}`, or: (a, b) => `the marble is ${a} or ${b}` },
];

export const singleCollection = gen('prob-single-bag', 'prob-single-event', (rng, d) => {
  const ctx = pick(rng, COLLECTIONS);
  const k = Math.min(ctx.kinds.length, size(d, int(rng, 2, 3), 3, int(rng, 3, 4)));
  const kinds = sample(rng, ctx.kinds, k);
  const counts = kinds.map(() => int(rng, size(d, 1, 2, 3), size(d, 7, 12, 19)));
  const total = counts.reduce((a, b) => a + b, 0);
  const mode = size(d, 'one', pick(rng, ['one', 'not', 'or']), pick(rng, ['or', 'not', 'or']));
  const i = int(rng, 0, k - 1);
  const j = (i + 1 + int(rng, 0, k - 2)) % k;
  let fav; let event;
  if (mode === 'one') { fav = counts[i]; event = ctx.one(kinds[i]); }
  else if (mode === 'not') { fav = total - counts[i]; event = ctx.not(kinds[i]); }
  else { fav = counts[i] + counts[j]; event = ctx.or(kinds[i], kinds[j]); }
  if (fav === 0 || fav === total) throw new Error('degenerate');
  const p = frac(fav, total);
  const list = listAnd(kinds.map((kd, t) => ctx.phrase(kd, counts[t])));
  const initials = kinds.map((kd) => kd[0].toUpperCase());
  const showBag = ctx.noun === 'counters' && total <= 24 && new Set(initials).size === k;
  return {
    prompt: `${ctx.intro(list)}<br>${ctx.pickTxt}<br>What is the probability that ${event}?`,
    visual: showBag ? bag(kinds.map((kd, t) => ({ label: initials[t], count: counts[t] })), { key: kinds.map((kd, t) => `${initials[t]} = ${kd}`).join(', ') }) : undefined,
    answer: ft(p),
    distractors: probOpts(p, [
      frac(fav, total - fav), // compared with the rest (odds)
      frac(total - fav, total), // the complement
      frac(1, k), // treated the kinds as equally likely
      frac(fav, total + fav), frac(counts[i], total), frac(fav + 1, total), frac(fav, total - 1), frac(1, fav),
    ]),
    typed: typedP(p),
    solution: [
      'Probability = $\\dfrac{\\text{number of ways it can happen}}{\\text{total number of equally likely outcomes}}$',
      `Total: $${counts.join(' + ')} = ${total}$.`,
      mode === 'one' ? `Number that fit: ${num(fav)}.`
        : mode === 'not' ? `Number that fit: everything except the ${num(counts[i])}, so $${total} - ${counts[i]} = ${fav}$.`
          : `Number that fit: $${counts[i]} + ${counts[j]} = ${fav}$.`,
      `$P = \\frac{${fav}}{${total}}${p.d !== total ? ` = ${p.tex()}` : ''}$`,
      `Answer: ${ft(p)}`,
    ],
  };
}, { title: 'Probability of picking an item of one kind', word: true });

// Single-event "not" contexts: [event, notEvent]
const NOT_CONTEXTS = [
  ['the 8:15 bus is late', 'the bus is <b>not</b> late'],
  ['it will rain tomorrow', 'it will <b>not</b> rain tomorrow'],
  ['City win their next match', 'City do <b>not</b> win their next match'],
  ['a seed grows into a plant', 'the seed does <b>not</b> grow'],
  ['Maya passes her driving test first time', 'Maya does <b>not</b> pass first time'],
  ['a light bulb from a factory is faulty', 'a light bulb is <b>not</b> faulty'],
  ['an email is spam', 'an email is <b>not</b> spam'],
  ['Femi scores a penalty', 'Femi does <b>not</b> score the penalty'],
  ['a parcel arrives on time', 'the parcel does <b>not</b> arrive on time'],
  ['an archer hits the gold ring', 'the archer does <b>not</b> hit the gold ring'],
  ['it snows in Leeds on New Year\'s Day', 'it does <b>not</b> snow on that day'],
  ['a biased coin lands on heads', 'the coin does <b>not</b> land on heads'],
  ['a train arrives at the platform on time', 'the train is <b>not</b> on time'],
  ['a phone battery lasts more than two days', 'the battery does <b>not</b> last more than two days'],
  ['a raffle ticket wins a prize', 'the ticket does <b>not</b> win a prize'],
  ['the traffic light is red when Jamal reaches it', 'it is <b>not</b> red'],
];

export const singleNot = gen('prob-single-not', 'prob-single-event', (rng, d) => {
  const [ev, notEv] = pick(rng, NOT_CONTEXTS);
  const form = pick(rng, size(d, ['dec', 'frac'], ['dec', 'pct', 'frac'], ['dec', 'pct', 'frac']));
  let p;
  if (form === 'frac') {
    const den = pick(rng, size(d, [5, 8, 10], [7, 9, 12, 20], [13, 15, 16, 25, 40]));
    let n; do { n = int(rng, 1, den - 1); } while (gcd(n, den) !== 1 && d !== 'easy');
    p = frac(n, den);
    if (p.d === 1) throw new Error('integer');
  } else {
    p = form === 'pct' || d !== 'easy' ? frac(int(rng, 3, 97), 100) : frac(int(rng, 1, 9), 10);
    if (d === 'hard' && form === 'dec' && rng() < 0.5) p = frac(int(rng, 2, 98) * 10 + 5, 1000);
  }
  const q = frac(1).sub(p);
  // Classic decimal slip: 1 − 0.17 worked digit-by-digit as 0.93.
  const h = Math.round(p.value() * 100);
  const slip = h % 10 && h >= 10 ? frac((10 - Math.floor(h / 10)) * 10 + (10 - (h % 10)), 100) : null;
  return {
    prompt: `The probability that ${ev} is $${pt(p, form)}$.<br>What is the probability that ${notEv}?`,
    answer: pf(q, form),
    distractors: probOpts(q, form === 'frac'
      ? [p, frac(p.d - p.n, p.d + p.n), frac(p.n, p.d - p.n), frac(p.d - p.n, p.d + 1), frac(1, p.d - p.n), frac(p.d - p.n - 1, p.d), frac(p.d - p.n + 1, p.d)]
      : [p, slip, q.add(frac(1, 10)), q.sub(frac(1, 10)), frac(1, 2)], form, { fallback: form !== 'frac' }),
    typed: typedP(q, form),
    solution: [
      'An event either happens or does not happen, so $P(\\text{not } A) = 1 - P(A)$.',
      form === 'pct' ? `As percentages: $100\\% - ${pt(p, form)} = ${pt(q, form)}$` : form === 'dec' ? `$1 - ${pt(p, form)} = ${pt(q, form)}$` : `$1 - ${p.tex()} = \\frac{${p.d}}{${p.d}} - \\frac{${p.n}}{${p.d}} = ${q.tex()}$`,
      ...(form === 'dec' ? [`Check: $${pt(p, form)} + ${pt(q, form)} = 1$ ✓`] : []),
      `Answer: ${pf(q, form)}`,
    ],
  };
}, { title: 'P(not A) = 1 − P(A)', word: true });

/** Number events for picking from a set of numbers. */
const NUMBER_TESTS = [
  { txt: 'an even number', f: (x) => x % 2 === 0 },
  { txt: 'an odd number', f: (x) => x % 2 === 1 },
  { txt: 'a prime number', f: isPrime, slip: (x) => isPrime(x) || x === 1, slipWhy: 'counted 1 as prime' },
  { txt: 'a square number', f: isSquare },
  { txt: 'a multiple of 3', f: (x) => x % 3 === 0 },
  { txt: 'a multiple of 4', f: (x) => x % 4 === 0 },
  { txt: 'a multiple of 5', f: (x) => x % 5 === 0 },
  { txt: 'a factor of 24', f: (x) => 24 % x === 0 },
  { txt: 'a factor of 30', f: (x) => 30 % x === 0 },
  { txt: 'a cube number', f: (x) => Math.round(Math.cbrt(x)) ** 3 === x },
];

export const singleNumbers = gen('prob-single-numbers', 'prob-single-event', (rng, d) => {
  const kind = pick(rng, size(d, ['dice', 'cards', 'spinner'], ['cards', 'balls', 'spinner', 'factors'], ['cards', 'balls', 'factors', 'raffle']));
  let nums; let intro; let visual;
  if (kind === 'dice') { nums = [1, 2, 3, 4, 5, 6]; intro = 'An ordinary fair dice is rolled.'; }
  else if (kind === 'spinner') {
    const n = pick(rng, [5, 8, 10]); nums = Array.from({ length: n }, (_, i) => i + 1);
    intro = `A fair spinner has ${n} equal sections numbered 1 to ${n}. It is spun once.`;
    visual = spinner(nums.map((x) => ({ label: String(x) })), { r: 84 });
  } else if (kind === 'cards') {
    const n = size(d, 8, int(rng, 6, 9), int(rng, 7, 10));
    nums = sample(rng, Array.from({ length: 20 }, (_, i) => i + 1), n).sort((a, b) => a - b);
    intro = 'Here are some number cards. One card is taken at random.';
    visual = cards(nums.map(String));
  } else if (kind === 'balls') {
    const n = pick(rng, [12, 15, 16, 20, 25]); nums = Array.from({ length: n }, (_, i) => i + 1);
    intro = `In a game, ${n} balls are numbered 1 to ${n}. One ball is picked at random.`;
  } else if (kind === 'raffle') {
    const lo = pick(rng, [1, 11, 21]); const n = pick(rng, [20, 30, 40]);
    nums = Array.from({ length: n }, (_, i) => lo + i);
    intro = `Raffle tickets are numbered ${lo} to ${lo + n - 1}. Every ticket is sold and one winning ticket is drawn at random.`;
  } else {
    const N = pick(rng, [24, 30, 36, 40, 48, 60]);
    nums = Array.from({ length: N }, (_, i) => i + 1).filter((x) => N % x === 0);
    intro = `A factor of ${N} is chosen at random. (The factors of ${N} are equally likely.)`;
  }
  const n = nums.length;
  const tests = [...NUMBER_TESTS, ...(kind === 'factors' ? [{ txt: 'a 2-digit number', f: (x) => x >= 10 }] : [])];
  // threshold tests: off-by-one is the classic slip
  const k = int(rng, Math.min(...nums) + 1, Math.max(...nums) - 1);
  tests.push({ txt: `greater than ${k}`, f: (x) => x > k, slip: (x) => x >= k, slipWhy: `included ${k}` });
  tests.push({ txt: `less than ${k}`, f: (x) => x < k, slip: (x) => x <= k });
  if (d === 'hard') tests.push({ txt: `at least ${k}`, f: (x) => x >= k, slip: (x) => x > k });
  const usable = tests.filter((t) => { const c = nums.filter(t.f).length; return c > 0 && c < n; });
  const t = pick(rng, usable);
  const fav = nums.filter(t.f);
  const p = frac(fav.length, n);
  const slipC = t.slip ? nums.filter(t.slip).length : null;
  const txt = /^(greater|less|at least)/.test(t.txt) ? `a number ${t.txt}` : t.txt;
  return {
    prompt: `${intro}<br>What is the probability of getting ${txt}?`,
    visual,
    answer: ft(p),
    distractors: probOpts(p, [
      slipC ? frac(slipC, n) : null,
      frac(fav.length, n - fav.length), // odds
      frac(n - fav.length, n),
      frac(fav.length, n + 1), frac(fav.length, Math.max(...nums)), frac(1, fav.length), frac(1, n),
    ]),
    typed: typedP(p),
    solution: [
      `There are ${num(n)} equally likely outcomes${kind === 'factors' ? `: ${nums.join(', ')}` : ''}.`,
      `Outcomes that give ${txt}: ${fav.join(', ')} – that is ${num(fav.length)}.`,
      ...(t.slipWhy && /greater|less|least/.test(t.txt) ? [`Careful: "${t.txt}" ${t.txt.startsWith('at least') ? 'does' : 'does not'} include ${k} itself.`] : []),
      ...(t.txt.includes('prime') ? ['Remember 1 is <b>not</b> a prime number.'] : []),
      `$P = \\frac{${fav.length}}{${n}}${p.d !== n ? ` = ${p.tex()}` : ''}$`,
      `Answer: ${ft(p)}`,
    ],
  };
}, { title: 'Probability with numbered dice, cards, balls or spinners' });

const LETTER_WORDS = ['STATISTICS', 'PROBABILITY', 'MISSISSIPPI', 'BANANAS', 'MATHEMATICS', 'ABRACADABRA', 'PEPPERONI', 'COMMITTEE', 'ASSESSMENT', 'PARALLEL', 'CALCULATOR', 'BOOKKEEPER', 'TOMORROW', 'GRAPEFRUIT', 'SUCCESSFUL', 'HIPPOPOTAMUS'];

export const singleLetters = gen('prob-single-letters', 'prob-single-event', (rng, d) => {
  const word = pick(rng, LETTER_WORDS.filter((w) => (d === 'easy' ? w.length <= 9 : true)));
  const letters = word.split('');
  const n = letters.length;
  const counts = {};
  letters.forEach((l) => { counts[l] = (counts[l] || 0) + 1; });
  const distinct = Object.keys(counts);
  const vowels = letters.filter((l) => 'AEIOU'.includes(l)).length;
  const modes = ['letter', 'letter'];
  if (vowels > 0 && vowels < n) modes.push('vowel', 'consonant');
  if (d !== 'easy') modes.push('two');
  const mode = pick(rng, modes);
  let fav; let what; let distinctFav;
  if (mode === 'letter') {
    const l = pick(rng, distinct.filter((x) => counts[x] >= (d === 'easy' ? 1 : 2)).concat(distinct.filter((x) => counts[x] >= 2)));
    fav = counts[l]; what = `the letter ${l}`; distinctFav = 1;
  } else if (mode === 'vowel') { fav = vowels; what = 'a vowel (A, E, I, O or U)'; distinctFav = distinct.filter((l) => 'AEIOU'.includes(l)).length; }
  else if (mode === 'consonant') { fav = n - vowels; what = 'a consonant (not a vowel)'; distinctFav = distinct.filter((l) => !'AEIOU'.includes(l)).length; }
  else {
    const [a, b] = sample(rng, distinct, 2);
    fav = counts[a] + counts[b]; what = `the letter ${a} or the letter ${b}`; distinctFav = 2;
  }
  if (fav === n) throw new Error('certain');
  const p = frac(fav, n);
  return {
    prompt: `Each letter of the word <b>${word}</b> is written on a separate card. The cards are shuffled and one is taken at random.<br>What is the probability that the card shows ${what}?`,
    visual: cards(letters, { perRow: 12, w: 32, h: 44, size: 16 }),
    answer: ft(p),
    distractors: probOpts(p, [
      frac(distinctFav, distinct.length), // counted each different letter once
      frac(fav, distinct.length),
      frac(fav, n - fav), frac(n - fav, n), frac(1, n), frac(distinctFav, n),
    ]),
    typed: typedP(p),
    solution: [
      `There are ${num(n)} cards (count every letter, including repeats).`,
      `Cards showing ${what.replace(/ \(.*\)/, '')}: ${num(fav)}.`,
      `$P = \\frac{${fav}}{${n}}${p.d !== n ? ` = ${p.tex()}` : ''}$`,
      `Answer: ${ft(p)}`,
    ],
  };
}, { title: 'Letters of a word on cards' });

const SPIN_COLOURS = ['Red', 'Blue', 'Green', 'Yellow'];

export const singleSpinner = gen('prob-single-spinner', 'prob-single-event', (rng, d) => {
  if (d === 'hard' && rng() < 0.6) {
    // Unequal sectors given by angles.
    const angles = pick(rng, [[90, 120, 150], [60, 135, 165], [45, 90, 225], [72, 108, 180], [80, 100, 180], [30, 150, 180], [40, 140, 180], [120, 135, 105]]);
    const cols = sample(rng, SPIN_COLOURS, 3);
    const i = int(rng, 0, 2);
    const mode = pick(rng, ['one', 'not']);
    const ang = mode === 'one' ? angles[i] : 360 - angles[i];
    const p = frac(ang, 360);
    return {
      prompt: `A spinner is made of three sectors: ${listAnd(cols.map((c, t) => `${c.toLowerCase()} with angle $${angles[t]}^\\circ$`))}.<br>What is the probability that it lands on ${mode === 'one' ? cols[i].toLowerCase() : `a colour that is <b>not</b> ${cols[i].toLowerCase()}`}?`,
      visual: spinner(cols.map((c, t) => ({ label: c, weight: angles[t] })), { r: 86 }),
      answer: ft(p),
      distractors: probOpts(p, [frac(1, 3), frac(2, 3), frac(angles[i], 180), frac(ang, 100), frac(360 - ang, 360), frac(angles[i], 360 - angles[i]), frac(angles[(i + 1) % 3], 360), frac(angles[(i + 2) % 3], 360), frac(1, 4)]),
      typed: typedP(p),
      solution: [
        'The sectors are not equal, so use the angles: a full turn is $360^\\circ$.',
        `$P = \\frac{${ang}}{360}${p.d !== 360 ? ` = ${p.tex()}` : ''}$`,
        `Answer: ${ft(p)}`,
      ],
    };
  }
  const nSec = pick(rng, size(d, [4, 5, 6], [5, 6, 8], [8, 10]));
  const numeric = rng() < 0.4;
  let labels;
  if (numeric) labels = Array.from({ length: nSec }, () => String(int(rng, 1, size(d, 4, 6, 9))));
  else {
    const cols = sample(rng, SPIN_COLOURS, size(d, 2, 3, int(rng, 3, 4)));
    labels = Array.from({ length: nSec }, (_, t) => (t < cols.length ? cols[t] : pick(rng, cols)));
    labels = shuffle(rng, labels);
  }
  const distinct = [...new Set(labels)];
  if (distinct.length < 2) throw new Error('one label');
  const target = pick(rng, distinct);
  const nums = labels.map(Number);
  const hasOdd = nums.some((x) => x % 2 === 1) && nums.some((x) => x % 2 === 0);
  const mode = numeric ? pick(rng, ['one', 'gt', ...(hasOdd ? ['odd'] : [])]) : pick(rng, size(d, ['one'], ['one', 'not'], ['one', 'not', ...(distinct.length > 2 ? ['or'] : [])]));
  let favF; let what;
  const t2 = pick(rng, distinct.filter((x) => x !== target));
  if (mode === 'one') { favF = (x) => x === target; what = numeric ? aWord(target) : target.toLowerCase(); }
  else if (mode === 'not') { favF = (x) => x !== target; what = `a colour that is <b>not</b> ${target.toLowerCase()}`; }
  else if (mode === 'or') { favF = (x) => x === target || x === t2; what = `${target.toLowerCase()} or ${t2.toLowerCase()}`; }
  else if (mode === 'odd') { favF = (x) => Number(x) % 2 === 1; what = 'an odd number'; }
  else { const k = pick(rng, [...new Set(nums)].sort((x, y) => x - y).slice(0, -1)); favF = (x) => Number(x) > k; what = `a number greater than ${k}`; }
  const fav = labels.filter(favF).length;
  if (fav === 0 || fav === nSec) throw new Error('degenerate');
  const p = frac(fav, nSec);
  const distinctFav = distinct.filter(favF).length;
  return {
    prompt: `Here is a fair spinner with ${nSec} equal sections. It is spun once.<br>What is the probability that it lands on ${what}?`,
    visual: spinner(labels.map((l) => ({ label: l })), { r: 88 }),
    answer: ft(p),
    distractors: probOpts(p, [frac(distinctFav, distinct.length), frac(fav, nSec - fav), frac(nSec - fav, nSec), frac(1, nSec), frac(fav, nSec + 1), frac(1, fav)]),
    typed: typedP(p),
    solution: [
      `The ${nSec} sections are equal, so each is equally likely. (The different ${numeric ? 'numbers' : 'colours'} are <b>not</b> equally likely – count sections.)`,
      `Sections that are ${what.replace(/<\/?b>/g, '')}: ${num(fav)}.`,
      `$P = \\frac{${fav}}{${nSec}}${p.d !== nSec ? ` = ${p.tex()}` : ''}$`,
      `Answer: ${ft(p)}`,
    ],
  };
}, { title: 'Probability from a spinner' });

export const singleReverse = gen('prob-single-reverse', 'prob-single-event', (rng, d) => {
  const ctx = pick(rng, COLLECTIONS.filter((c) => c.adj && !/songs|cars/.test(c.noun)));
  const [k1, k2, k3] = sample(rng, ctx.kinds, 3);
  const item = ctx.noun;
  if (d === 'easy') {
    const den = pick(rng, [3, 4, 5, 8, 10]); const n = int(rng, 1, den - 1);
    const p = frac(n, den);
    const total = p.d * int(rng, 2, 8);
    const ans = (total * p.n) / p.d;
    return {
      prompt: `There are ${total} ${item} in total. Some are ${k1}. One is chosen at random.<br>The probability that it is ${k1} is $${p.tex()}$.<br>How many of the ${item} are ${k1}?`,
      answer: num(ans),
      distractors: countOpts(ans, [total - ans, total / p.d, total * p.n, Math.round(total / p.n), ans + p.n]),
      typed: { kind: 'number', value: ans },
      solution: [
        `The probability tells you the fraction of the ${item} that are ${k1}.`,
        `$${p.tex()}$ of $${total} = ${total} \\div ${p.d} \\times ${p.n} = ${ans}$`,
        `Answer: ${num(ans)}`,
      ],
    };
  }
  if (d === 'medium') {
    const den = pick(rng, [3, 4, 5, 7, 8, 9]); const n = int(rng, 1, den - 1);
    const p = frac(n, den);
    const m = int(rng, 2, 6);
    const other = (p.d - p.n) * m; const ans = p.n * m;
    return {
      prompt: `A box contains only ${k1} and ${k2} ${item}.<br>The probability of picking ${aWord(k1)} one at random is $${p.tex()}$.<br>There are ${other} ${k2} ${item}. How many ${k1} ${item} are there?`,
      answer: num(ans),
      distractors: countOpts(ans, [(other * p.n) / p.d, other, other + ans, (other / p.n) * p.d, (other * p.d) / (p.d - p.n)]),
      typed: { kind: 'number', value: ans },
      solution: [
        `$P(\\text{${k2}}) = 1 - ${p.tex()} = ${frac(1).sub(p).tex()}$`,
        p.d - p.n === 1
          ? `So the ${other} ${k2} ${item} are $\\frac{1}{${p.d}}$ of the total, and the total is $${other} \\times ${p.d} = ${m * p.d}$.`
          : `So the ${other} ${k2} ${item} are $\\frac{${p.d - p.n}}{${p.d}}$ of the total. $\\frac{1}{${p.d}}$ of the total is $${other} \\div ${p.d - p.n} = ${m}$, so the total is $${m} \\times ${p.d} = ${m * p.d}$.`,
        `${cap(k1)}: $${m * p.d} - ${other} = ${ans}$`,
        `Answer: ${num(ans)}`,
      ],
    };
  }
  // hard: algebraic counts, e.g. 2, x, 2x + 5
  const a = int(rng, 2, 6); const b = pick(rng, [2, 3]); const c = int(rng, 1, 7);
  const x = int(rng, 3, 9);
  const total = a + x + b * x + c;
  const pa = frac(a, total);
  if (pa.n === a && rng() < 0.75) throw new Error('make the student scale the fraction');
  const ans = frac(b * x + c, total);
  return {
    prompt: `A box contains ${k1}, ${k2} and ${k3} ${item}.${table([['Type', cap(k1), cap(k2), cap(k3)], ['Number', String(a), '$x$', `$${b}x + ${c}$`]])}One is picked at random. The probability that it is ${k1} is $${pa.tex()}$.<br>Work out the probability that it is ${k3}.`,
    answer: ft(ans),
    distractors: probOpts(ans, [frac(x, total), frac(b * x + c, total + a), frac(b + c, total), frac(b * x, total), frac(b * x + c, total - a), frac(x + c, total)]),
    typed: typedP(ans),
    solution: [
      `Total $= ${a} + x + ${b}x + ${c} = ${b + 1}x + ${a + c}$.`,
      `$P(\\text{${k1}}) = \\frac{${a}}{${b + 1}x + ${a + c}}$ and ${pa.n === a ? `this equals $${pa.tex()}$` : `$${pa.tex()} = \\frac{${a}}{${total}}$`}, so $${b + 1}x + ${a + c} = ${total}$.`,
      `$${b + 1}x = ${total - a - c}$, so $x = ${x}$.`,
      `${cap(k3)}: $${b} \\times ${x} + ${c} = ${b * x + c}$, so $P = \\frac{${b * x + c}}{${total}}${ans.d !== total ? ` = ${ans.tex()}` : ''}$`,
      `Answer: ${ft(ans)}`,
    ],
  };
}, { title: 'Work backwards from a probability to a number of items' });

/* ================================================================== */
/* prob-sum-to-one                                                     */
/* ================================================================== */

// intro(outs) describes exactly the outcomes shown in the table (outs may be a prefix of the pool).
const lowList = (outs) => listAnd(outs.map((o) => o.toLowerCase()), 'or');
const OUTCOME_SETS = [
  { intro: (o) => `A biased spinner can land on ${lowList(o)}.`, outs: ['Red', 'Blue', 'Green', 'Yellow'], head: 'Colour' },
  { intro: (o) => `Counters in a bag are ${lowList(o)}. A counter is picked at random.`, outs: ['Red', 'White', 'Blue', 'Green'], head: 'Colour' },
  { intro: (o) => (o.length === 6 ? 'A biased dice is rolled.' : `A biased spinner has ${o.length} sections numbered 1 to ${o.length}. It is spun once.`), outs: ['1', '2', '3', '4', '5', '6'], head: 'Score' },
  { intro: (o) => `On a day in April, the weather in a town is one of ${lowList(o).replace(/ or /, ' and ')}. The table shows the probabilities.`, outs: ['Sunny', 'Cloudy', 'Rain', 'Snow'], head: 'Weather' },
  { intro: (o) => `A student is chosen at random. Each student travels to school in one of these ways: ${o.map((x) => x.toLowerCase()).join(', ')}.`, outs: ['Walk', 'Bus', 'Car', 'Cycle', 'Train'], head: 'Travel' },
  { intro: (o) => `A customer at a café is chosen at random. Every customer orders one drink: ${lowList(o)}.`, outs: ['Tea', 'Coffee', 'Juice', 'Water'], head: 'Drink' },
  { intro: (o) => `A ticket is drawn at random in a raffle. The tickets are ${lowList(o)}.`, outs: ['Pink', 'Green', 'Yellow', 'Orange'], head: 'Ticket' },
  { intro: (o) => `A sweet is taken at random from a jar of ${lowList(o).replace(/ or /, ' and ')} sweets.`, outs: ['Lemon', 'Lime', 'Orange', 'Cherry'], head: 'Flavour' },
  { intro: (o) => `A biased spinner has ${o.length} sections labelled ${listAnd(o, 'and')}. It is spun once.`, outs: ['A', 'B', 'C', 'D', 'E'], head: 'Letter' },
  { intro: () => 'A football team plays a match. The result is a win, a draw or a loss.', outs: ['Win', 'Draw', 'Lose'], head: 'Result' },
  { intro: (o) => `A person at a cinema is chosen at random. Everyone is watching one of these films: ${o.map((x) => x.toLowerCase()).join(', ')}.`, outs: ['Comedy', 'Action', 'Horror', 'Cartoon'], head: 'Film' },
  { intro: (o) => `A car is chosen at random from a car park. Every car is ${lowList(o)}.`, outs: ['Silver', 'Black', 'White', 'Red', 'Blue'], head: 'Colour' },
];

/** Random decimal probabilities summing to 1 with `step` precision. */
function decimalSplit(rng, k, step) {
  const units = Math.round(1 / step);
  for (let t = 0; t < 100; t += 1) {
    const cuts = sample(rng, Array.from({ length: units - 1 }, (_, i) => i + 1), k - 1).sort((a, b) => a - b);
    const parts = [cuts[0], ...cuts.slice(1).map((c, i) => c - cuts[i]), units - cuts[cuts.length - 1]];
    if (parts.every((p) => p >= (step === 0.01 ? 3 : 1))) return parts.map((p) => frac(p, units));
  }
  throw new Error('split');
}

export const sumMissing = gen('prob-sum-table-missing', 'prob-sum-to-one', (rng, d) => {
  const set = pick(rng, OUTCOME_SETS);
  const k = Math.min(set.outs.length, size(d, 3, 4, int(rng, 4, 6)));
  const outs = set.outs.slice(0, k);
  const step = size(d, 0.1, pick(rng, [0.05, 0.01]), 0.01);
  const ps = decimalSplit(rng, k, step);
  const miss = int(rng, 0, k - 1);
  const known = ps.filter((_, i) => i !== miss);
  const sumKnown = known.reduce((a, b) => a.add(b), frac(0));
  const ans = ps[miss];
  const mode = d === 'hard' && rng() < 0.5 ? 'or' : 'missing';
  const rows = [[set.head, ...outs], ['Probability', ...ps.map((p, i) => (i === miss ? '' : tnum(p.value())))]];
  if (mode === 'or') {
    const j = (miss + 1 + int(rng, 0, k - 2)) % k;
    const res = ans.add(ps[j]);
    return {
      prompt: `${set.intro(outs)}${table(rows, { firstColHeader: true })}Work out the probability of <b>${outs[miss]}</b> or <b>${outs[j]}</b>.`,
      answer: pf(res, 'dec'),
      distractors: probOpts(res, [ans, ps[j], sumKnown, frac(1).sub(ps[j]), ans.mul(ps[j]), res.add(frac(1, 10))], 'dec'),
      typed: typedP(res, 'dec'),
      solution: [
        'The probabilities of all the outcomes add up to $1$.',
        `Missing value: $1 - (${known.map((p) => tnum(p.value())).join(' + ')}) = 1 - ${tnum(sumKnown.value())} = ${tnum(ans.value())}$`,
        `The outcomes cannot happen together, so add: $${tnum(ans.value())} + ${tnum(ps[j].value())} = ${tnum(res.value())}$`,
        `Answer: ${pf(res, 'dec')}`,
      ],
    };
  }
  const h = Math.round(sumKnown.value() * 100);
  const slip = h % 10 ? frac((9 - Math.floor(h / 10)) * 10 + (10 - (h % 10)) + 10, 100) : null; // 1 − 0.57 → 0.53
  return {
    prompt: `${set.intro(outs)}${table(rows, { firstColHeader: true })}Work out the missing probability for <b>${outs[miss]}</b>.`,
    answer: pf(ans, 'dec'),
    distractors: probOpts(ans, [
      sumKnown, slip, frac(1).sub(known[0]), ans.add(frac(1, 10)), ans.sub(frac(1, 10)),
      frac(1, k), ans.add(frac(1, 100)), ans.sub(frac(1, 20)),
    ], 'dec'),
    typed: typedP(ans, 'dec'),
    solution: [
      'The probabilities of all the possible outcomes add up to $1$.',
      `Add the ones you know: $${known.map((p) => tnum(p.value())).join(' + ')} = ${tnum(sumKnown.value())}$`,
      `Missing probability: $1 - ${tnum(sumKnown.value())} = ${tnum(ans.value())}$`,
      `Answer: ${pf(ans, 'dec')}`,
    ],
  };
}, { title: 'Missing probability in a table', word: true });

export const sumRelation = gen('prob-sum-table-relation', 'prob-sum-to-one', (rng, d) => {
  const set = pick(rng, OUTCOME_SETS.filter((s) => s.outs.length >= 4));
  const k = size(d, 3, 4, 4);
  const outs = set.outs.slice(0, k);
  const m = size(d, 1, pick(rng, [2, 3]), pick(rng, [2, 3, 4]));
  // the two unknown outcomes: P(b) = m × P(a)
  const unit = size(d, pick(rng, [0.05, 0.1, 0.15, 0.2]), pick(rng, [0.05, 0.1, 0.15]), pick(rng, [0.04, 0.06, 0.08, 0.12, 0.05]));
  const rest = 1 - unit * (m + 1);
  if (rest <= 0.05) throw new Error('too big');
  const knownCount = k - 2;
  const knownPs = knownCount === 1 ? [rest] : (() => {
    const a = Math.round((rest * (0.3 + rng() * 0.4)) * 100) / 100;
    return [a, Math.round((rest - a) * 100) / 100];
  })();
  if (knownPs.some((p) => p <= 0)) throw new Error('neg');
  const [ia, ib] = sample(rng, Array.from({ length: k }, (_, i) => i), 2);
  const probs = Array(k).fill(null);
  probs[ia] = unit; probs[ib] = unit * m;
  let t = 0;
  for (let i = 0; i < k; i += 1) if (probs[i] === null) { probs[i] = knownPs[t]; t += 1; }
  const askB = d !== 'easy' && rng() < 0.5;
  const ans = frac(Math.round((askB ? unit * m : unit) * 100), 100);
  const remaining = frac(Math.round(rest * 100), 100);
  const left = frac(1).sub(remaining);
  const rel = m === 1 ? `${outs[ia]} and ${outs[ib]} are equally likely.` : `${outs[ib]} is ${m === 2 ? 'twice' : `${m} times`} as likely as ${outs[ia]}.`;
  const rows = [[set.head, ...outs], ['Probability', ...probs.map((p, i) => (i === ia || i === ib ? '' : tnum(p)))]];
  return {
    prompt: `${set.intro(outs)}${table(rows, { firstColHeader: true })}${rel}<br>Work out the probability of <b>${askB ? outs[ib] : outs[ia]}</b>.`,
    answer: pf(ans, 'dec'),
    distractors: probOpts(ans, [
      left, // forgot to share
      left.div(2), // halved even though unequal
      askB ? left.div(m) : left.mul(frac(m, m + 1)), // gave the other share
      askB ? frac(Math.round(unit * 100), 100) : frac(Math.round(unit * m * 100), 100),
      left.div(m), left.mul(m).sub(remaining), ans.add(frac(1, 10)),
    ], 'dec'),
    typed: typedP(ans, 'dec'),
    solution: [
      `All the probabilities add up to $1$. Known: $${knownPs.length > 1 ? `${knownPs.map((p) => tnum(p)).join(' + ')} = ` : ''}${tnum(rest)}$, so the two missing ones share $1 - ${tnum(rest)} = ${tnum(left.value())}$.`,
      m === 1 ? `They are equal, so each is $${tnum(left.value())} \\div 2 = ${tnum(unit)}$.`
        : `Call $P(\\text{${outs[ia]}}) = p$; then $P(\\text{${outs[ib]}}) = ${m}p$ and $p + ${m}p = ${m + 1}p = ${tnum(left.value())}$, so $p = ${tnum(unit)}$.`,
      ...(askB ? [`$P(\\text{${outs[ib]}}) = ${m} \\times ${tnum(unit)} = ${tnum(unit * m)}$`] : []),
      `Answer: ${pf(ans, 'dec')}`,
    ],
  };
}, { title: 'Two missing probabilities linked by "twice as likely"' });

export const sumAlgebra = gen('prob-sum-algebra', 'prob-sum-to-one', (rng, d) => {
  const outs = pick(rng, [['A', 'B', 'C'], ['Red', 'Blue', 'Green'], ['Win', 'Draw', 'Lose'], ['1', '2', '3', '4'], ['W', 'X', 'Y', 'Z']]);
  const k = outs.length;
  const sym = pick(rng, ['x', 'k', 'p']);
  const v = pick(rng, size(d, [0.1, 0.2, 0.05, 0.15], [0.1, 0.05, 0.15, 0.12, 0.08], [0.1, 0.05, 0.04, 0.08, 0.15, 0.2]));
  const coefs = outs.map(() => (d === 'hard' ? pick(rng, [0.5, 1, 1.5, 2, 2.5, 3, 4, 5]) : int(rng, 1, 4)));
  const consts = outs.map(() => 0);
  const ci = int(rng, 0, k - 1);
  if (d === 'easy') coefs[ci] = 0;
  const A = coefs.reduce((s, a) => s + a, 0);
  const C = Math.round((1 - A * v) * 1000) / 1000;
  consts[ci] = C;
  if (d !== 'easy' && (C === 0 || Math.abs(C) > 0.3)) throw new Error('constant');
  if (d === 'medium' && C < 0) throw new Error('neg');
  const values = coefs.map((a, i) => Math.round((a * v + consts[i]) * 1000) / 1000);
  if (values.some((x) => x <= 0 || x >= 1)) throw new Error('range');
  if (new Set(values).size < k - 1) throw new Error('dull');
  const expr = (a, c) => {
    if (a === 0) return tnum(c);
    const t = `${a === 1 ? '' : tnum(a)}${sym}`;
    return c === 0 ? t : `${t} ${c < 0 ? '-' : '+'} ${tnum(Math.abs(c))}`;
  };
  const targets = outs.map((_, i) => i).filter((i) => coefs[i] !== 0);
  const target = pick(rng, targets);
  const askVar = d === 'easy' && rng() < 0.4;
  const ans = frac(Math.round((askVar ? v : values[target]) * 1000), 1000);
  const rows = [['Outcome', ...outs], ['Probability', ...outs.map((_, i) => `$${expr(coefs[i], consts[i])}$`)]];
  const fAns = pf(ans, 'dec');
  const f3 = (x) => frac(Math.round(x * 1000), 1000);
  const fA = f3(A); const fC = f3(C); const fa = f3(coefs[target]);
  const Atex = A === 1 ? '' : tnum(A);
  return {
    prompt: `The table shows the probabilities of the outcomes of an experiment.${table(rows, { firstColHeader: true })}${askVar ? `Work out the value of $${sym}$.` : `Work out the probability of <b>${outs[target]}</b>.`}`,
    answer: fAns,
    distractors: probOpts(ans, [
      askVar ? null : frac(Math.round(v * 1000), 1000), // gave the value of the letter
      fA.inv(), // ignored the constant
      frac(1).add(fC).div(fA), // sign slip with the constant
      frac(1).add(fC).div(fA).mul(fa), fa.div(fA), // value of the letter used wrongly
      frac(1).sub(fC).div(fA.add(1)),
      ans.add(frac(1, 20)), ans.sub(frac(1, 20)), ans.mul(2),
    ], 'dec'),
    typed: typedP(ans, 'dec'),
    solution: [
      'The probabilities of all the outcomes add up to $1$, so make an equation and [[alg-solve-one-two-step|solve it]].',
      `$${outs.map((_, i) => expr(coefs[i], consts[i])).join(' + ').replace(/\+ -/g, '-')} = 1$`,
      `Collect terms: $${Atex}${sym} ${C < 0 ? '-' : '+'} ${tnum(Math.abs(C))} = 1$, so $${Atex}${sym} = ${tnum(1 - C)}$ and $${sym} = ${tnum(1 - C)} \\div ${tnum(A)} = ${tnum(v)}$.`,
      ...(askVar ? [] : [`$P(\\text{${outs[target]}}) = ${coefs[target] === 1 ? '' : `${tnum(coefs[target])} \\times `}${tnum(v)}${consts[target] ? ` ${consts[target] < 0 ? '-' : '+'} ${tnum(Math.abs(consts[target]))}` : ''} = ${tnum(values[target])}$`]),
      `Answer: ${fAns}`,
    ],
  };
}, { title: 'Probabilities in terms of x add up to 1' });

export const sumFractions = gen('prob-sum-fractions', 'prob-sum-to-one', (rng, d) => {
  const ctx = pick(rng, COLLECTIONS.filter((c) => c.adj));
  const [k1, k2, k3] = sample(rng, ctx.kinds, 3);
  const dens = size(d, [[4, 4], [5, 5], [8, 8], [2, 4], [3, 6], [10, 5]], [[4, 3], [3, 5], [2, 5], [4, 6], [3, 8]], [[5, 4], [6, 4], [3, 7], [8, 6], [9, 6], [12, 8]]);
  for (let t = 0; t < 40; t += 1) {
    const [da, db] = pick(rng, dens);
    const a = frac(int(rng, 1, da - 1), da); const b = frac(int(rng, 1, db - 1), db);
    if (a.d === 1 || b.d === 1) continue;
    const c = frac(1).sub(a).sub(b);
    if (c.n <= 0) continue;
    const ask = d === 'hard' && rng() < 0.4 ? 'not' : 'third';
    const ans = ask === 'not' ? a.add(b) : c;
    return {
      prompt: `${ctx.intro(`only ${k1}, ${k2} and ${k3} ${ctx.noun}`)}`
        + `<br>One is chosen at random. The probability it is ${k1} is $${a.tex()}$ and the probability it is ${k2} is $${b.tex()}$.<br>What is the probability that it is ${ask === 'not' ? `<b>not</b> ${k3}` : k3}?`,
      answer: ft(ans),
      distractors: probOpts(ans, [
        a.add(b), frac(a.n + b.n, a.d + b.d), // added tops and bottoms
        frac(1, 3), ask === 'not' ? c : frac(1).sub(a), frac(1).sub(frac(a.n + b.n, a.d + b.d)), ask === 'not' ? frac(1).sub(a) : frac(1).sub(b), frac(Math.abs(a.d * b.d - a.n - b.n), a.d * b.d),
      ]),
      typed: typedP(ans),
      solution: ask === 'not' ? [
        `Not ${k3} means ${k1} or ${k2}. These cannot happen together, so add.`,
        `$${a.tex()} + ${b.tex()} = ${ans.tex()}$ (or work out $P(\\text{${k3}})$ first and use $1 - P(\\text{${k3}})$).`,
        `Answer: ${ft(ans)}`,
      ] : [
        'The three probabilities add up to $1$.',
        `Add the two you know (common denominator): $${a.tex()} + ${b.tex()} = ${a.add(b).tex()}$`,
        `$1 - ${a.add(b).tex()} = ${c.tex()}$`,
        `Answer: ${ft(ans)}`,
      ],
    };
  }
  throw new Error('fractions');
}, { title: 'Missing probability with fractions' });

export const sumCounts = gen('prob-sum-counts', 'prob-sum-to-one', (rng, d) => {
  const ctx = pick(rng, COLLECTIONS.filter((c) => c.adj));
  const [k1, k2, k3] = sample(rng, ctx.kinds, 3);
  const name = ctx.noun;
  for (let t = 0; t < 50; t += 1) {
    const total = pick(rng, size(d, [20, 40, 50, 60, 80, 100], [40, 60, 80, 120, 150, 200], [120, 160, 240, 250, 300, 400]));
    const form = size(d, 'dec', pick(rng, ['dec', 'pct']), pick(rng, ['dec', 'pct', 'frac']));
    let pa; let pb;
    if (form === 'frac') { pa = frac(int(rng, 1, 3), pick(rng, [4, 5, 8])); pb = frac(int(rng, 1, 3), pick(rng, [5, 6, 10])); }
    else { pa = frac(int(rng, 1, 9) * 5, 100); pb = frac(int(rng, 1, 9) * 5, 100); }
    const pc = frac(1).sub(pa).sub(pb);
    if (pc.n <= 0) continue;
    const nc = pc.mul(total);
    if (!nc.isInt || !pa.mul(total).isInt || !pb.mul(total).isInt) continue;
    const ans = nc.n;
    return {
      prompt: `There are ${num(total)} ${name}. Each is ${k1}, ${k2} or ${k3}.<br>One is picked at random. The probability it is ${k1} is $${pt(pa, form)}$ and the probability it is ${k2} is $${pt(pb, form)}$.<br>How many ${k3} ${name} are there?`,
      answer: num(ans),
      distractors: countOpts(ans, [pa.mul(total).value(), pb.mul(total).value(), total - pa.mul(total).value(), (pa.add(pb)).mul(total).value(), Math.round(pc.value() * 100), total * pc.value() / 2]),
      typed: { kind: 'number', value: ans },
      solution: [
        `$P(\\text{${k3}}) = 1 - ${pt(pa, form)} - ${pt(pb, form)} = ${pt(pc, form)}$`,
        `Number of ${k3}: $${pt(pc, form)} \\times ${total} = ${ans}$`,
        `Answer: ${num(ans)}`,
      ],
    };
  }
  throw new Error('counts');
}, { title: 'Use missing probability to find a number of items' });

export const sumRatio = gen('prob-sum-ratio', 'prob-sum-to-one', (rng, d) => {
  const [c1, c2, c3] = sample(rng, ['red', 'blue', 'green', 'white', 'yellow', 'black'], 3);
  const thing = pick(rng, ['counters', 'discs', 'beads', 'marbles', 'sweets', 'balloons']);
  if (d === 'easy') {
    const [a, b] = pick(rng, [[1, 2], [2, 3], [3, 5], [1, 4], [3, 4], [2, 5], [4, 5], [5, 7]]);
    const ans = frac(a, a + b);
    return {
      prompt: `A bag contains only ${c1} and ${c2} ${thing}.<br>The ratio of ${c1} to ${c2} is $${a} : ${b}$.<br>One is taken at random. What is the probability it is ${c1}?`,
      answer: ft(ans),
      distractors: probOpts(ans, [frac(a, b), frac(b, a + b), frac(1, 2), frac(a, a + b + 1), frac(1, a + b)]),
      typed: typedP(ans),
      solution: [
        `The ratio $${a} : ${b}$ has $${a} + ${b} = ${a + b}$ parts.`,
        `${cap(c1)} is ${a} of those ${a + b} parts, so $P = \\frac{${a}}{${a + b}}$ – not $\\frac{${a}}{${b}}$.`,
        `Answer: ${ft(ans)}`,
      ],
    };
  }
  if (d === 'medium') {
    const [a, b, c] = pick(rng, [[1, 2, 3], [2, 3, 5], [3, 4, 5], [1, 3, 4], [2, 5, 3], [4, 1, 3], [5, 2, 3], [3, 2, 7]]);
    const ans = frac(a + b, a + b + c);
    return {
      prompt: `${cap(thing)} in a bag are ${c1}, ${c2} or ${c3} in the ratio $${a} : ${b} : ${c}$.<br>One is taken at random. What is the probability it is <b>not</b> ${c3}?`,
      answer: ft(ans),
      distractors: probOpts(ans, [frac(c, a + b + c), frac(a + b, c), frac(2, 3), frac(a, a + b + c), frac(a + b, a + b + c + 1)]),
      typed: typedP(ans),
      solution: [
        `Total parts: $${a} + ${b} + ${c} = ${a + b + c}$.`,
        `Not ${c3} means ${c1} or ${c2}: $${a} + ${b} = ${a + b}$ parts.`,
        `$P = \\frac{${a + b}}{${a + b + c}}${ans.d !== a + b + c ? ` = ${ans.tex()}` : ''}$`,
        `Answer: ${ft(ans)}`,
      ],
    };
  }
  // hard: "m times as many c1 as c2" and c1 : c3 = p : q
  const m = pick(rng, [2, 3, 4, 5]);
  const [p, q] = pick(rng, [[3, 5], [2, 3], [4, 7], [5, 2], [3, 4], [6, 5], [2, 7]]);
  // c1 = m·c2; c1 : c3 = p : q. Use c1 = m·p, c2 = p, c3 = m·q.
  const A = m * p; const B = p; const C = m * q;
  const T = A + B + C;
  const mode = pick(rng, ['A or C', 'B']);
  const ans = mode === 'B' ? frac(B, T) : frac(A + C, T);
  return {
    prompt: `In a bag there are ${c1}, ${c2} and ${c3} ${thing}.<br>There are ${m === 2 ? 'twice' : `${m} times`} as many ${c1} ${thing} as ${c2} ${thing}.<br>number of ${c1} : number of ${c3} $= ${p} : ${q}$<br>One is selected at random. Work out the probability that it is ${mode === 'B' ? c2 : `either ${c1} or ${c3}`}.`,
    answer: ft(ans),
    distractors: probOpts(ans, [
      mode === 'B' ? frac(1, m + 1) : frac(p + q, p + q + 1), frac(p + q, T), frac(1, 3), mode === 'B' ? frac(1, p + q + 1) : frac(m + q, m + 1 + q),
      mode === 'B' ? frac(p, A + C) : frac(B, T), frac(p + q, p + q + m),
    ]),
    typed: typedP(ans),
    solution: [
      `Make the ${c1} share match in both facts. ${cap(c1)} : ${c2} $= ${m} : 1$ and ${c1} : ${c3} $= ${p} : ${q}$.`,
      `Scale so ${c1} is ${A} in both: ${c1} : ${c2} : ${c3} $= ${A} : ${B} : ${C}$.`,
      `Total parts: $${A} + ${B} + ${C} = ${T}$.`,
      `$P = \\frac{${mode === 'B' ? B : A + C}}{${T}}${ans.d !== T ? ` = ${ans.tex()}` : ''}$`,
      `Answer: ${ft(ans)}`,
    ],
  };
}, { title: 'Probabilities from ratios' });

export const basicsA = [
  scaleWordsMatch, scaleArrowEvent, scaleReadValue, scaleOrder, scaleNotProbability,
  singleCollection, singleNot, singleNumbers, singleLetters, singleSpinner, singleReverse,
  sumMissing, sumRelation, sumAlgebra, sumFractions, sumCounts, sumRatio,
];

void [bag, Frac, names, shortDecimal];
