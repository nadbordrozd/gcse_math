// Number module – unit "Factors, multiples and primes".
import {
  pick, int, sample, shuffle, size, chance, gcd, lcm, isPrime, primeFactors, factorsOf, num, tnum,
} from '../../core.js';
import { gen, uniq, indexForm, indexFormMap, primeMap, valueOfMap, range, clock } from './util.js';

const listText = (arr) => arr.map((v) => num(v)).join(', ');
const nFactors = (n) => factorsOf(n).length;
const isSquare = (n) => Number.isInteger(Math.sqrt(n));
const isCube = (n) => Math.abs(Math.round(Math.cbrt(n)) ** 3 - n) < 1e-9;
const isTri = (n) => isSquare(8 * n + 1);
const PRIMES = range(2, 200).filter(isPrime);
const ODD_COMPOSITES = [9, 15, 21, 25, 27, 33, 35, 39, 45, 49, 51, 55, 57, 63, 65, 69, 75, 77, 81, 85, 87, 91, 93, 95, 99, 111, 117, 119, 121, 133, 143];

/* ================================================================== */
/* num-factors-multiples                                               */
/* ================================================================== */

export const fmListFactors = gen('num-fm-list-factors', 'num-factors-multiples', (rng, d) => {
  const pool = size(d, [12, 18, 20, 16, 15, 14, 21, 28, 22, 24, 26, 27, 10, 8], [30, 32, 34, 36, 38, 39, 40, 42, 44, 45, 46, 48, 50, 51, 52, 54, 55, 56, 57], [60, 63, 64, 66, 68, 70, 72, 75, 76, 78, 80, 81, 84, 88, 90, 92, 96, 98, 99, 100]);
  const n = pick(rng, pool);
  const f = factorsOf(n);
  const k = Math.floor(f.length / 2);
  const pairIdx = int(rng, 1, Math.max(1, k - 1));
  const missPair = f.filter((x, i) => i !== pairIdx && i !== f.length - 1 - pairIdx);
  const nonFactor = range(2, n - 1).filter((x) => n % x !== 0 && x < n / 2);
  const extra = pick(rng, nonFactor);
  const withExtra = [...f, extra].sort((a, b) => a - b);
  const distract = [
    listText(f.slice(1, -1)),
    listText(missPair),
    listText(withExtra),
    listText([1, 2, 3, 4, 5].map((m) => m * n)),
    listText([...new Set(primeFactors(n))]),
    listText(f.slice(0, k + (f.length % 2))),
  ];
  return {
    prompt: `Which list shows <b>all</b> the factors of ${n}?`,
    answer: listText(f),
    distractors: uniq(distract, listText(f)),
    typed: { kind: 'list', values: f },
    solution: [
      'Factors come in pairs that multiply to give the number. Start at 1 and work upwards.',
      `${f.slice(0, Math.ceil(f.length / 2)).map((x) => `$${x} \\times ${n / x}$`).join(', ')}`,
      `So the factors of ${n} are ${listText(f)}.`,
      `Answer: ${listText(f)}`,
    ],
  };
}, { title: 'List all the factors' });

export const fmIdentify = gen('num-fm-identify', 'num-factors-multiples', (rng, d) => {
  const type = pick(rng, size(d, ['multiple', 'factor'], ['multiple', 'factor', 'commonMultiple'], ['commonMultiple', 'commonFactor', 'factor']));
  let prompt; let ans; let wrong; let steps;
  if (type === 'multiple') {
    const k = pick(rng, [3, 4, 6, 7, 8, 9]);
    ans = k * int(rng, 3, 12);
    wrong = shuffle(rng, range(10, 100).filter((x) => x % k !== 0 && (x % 10 === k % 10 || String(x).includes(String(k)) || x % (k - 1) === 0 || k % x === 0))).slice(0, 6);
    prompt = `Which of these numbers is a multiple of ${k}?`;
    steps = [`A multiple of ${k} is in the ${k} times table.`, `$${ans} = ${k} \\times ${ans / k}$, so ${ans} is a multiple of ${k}. None of the others divide exactly by ${k}.`];
  } else if (type === 'factor') {
    const n = pick(rng, size(d, [24, 30, 36, 40, 48], [42, 54, 56, 60, 63, 72, 84, 90], [96, 120, 126, 144, 180, 196]));
    const fs = factorsOf(n).filter((x) => x > 2 && x < n);
    ans = pick(rng, fs);
    const showMultiple = chance(rng, 0.6);
    wrong = [...(showMultiple ? [n * 2] : []), ...shuffle(rng, range(3, Math.min(n - 1, 40)).filter((x) => n % x !== 0)).slice(0, 4)].slice(0, 4);
    prompt = `Which of these numbers is a factor of ${n}?`;
    steps = [`A factor of ${n} divides into ${n} exactly.`, `$${n} \\div ${ans} = ${n / ans}$, so ${ans} is a factor.${showMultiple ? ` (${n * 2} is a <i>multiple</i> of ${n}, not a factor.)` : ' None of the others divide exactly into ' + n + '.'}`];
  } else if (type === 'commonMultiple') {
    let a; let b;
    do { [a, b] = sample(rng, [4, 6, 8, 9, 10, 12, 15], 2); } while ((lcm(a, b) === a * b && chance(rng, 0.6)) || a % b === 0 || b % a === 0);
    const L = lcm(a, b);
    ans = L * int(rng, 1, 3);
    wrong = shuffle(rng, [...range(2, 15).map((m) => a * m), ...range(2, 15).map((m) => b * m)].filter((x) => x % L !== 0 && x > 12)).slice(0, 6);
    prompt = `Which of these numbers is a multiple of both ${a} and ${b}?`;
    steps = [`It must be in the ${a} times table <b>and</b> the ${b} times table.`, `$${ans} = ${a} \\times ${ans / a}$ and $${ans} = ${b} \\times ${ans / b}$.`];
  } else {
    let a; let b;
    do { a = int(rng, 12, 90); b = int(rng, 12, 90); } while (gcd(a, b) < 4 || a === b || gcd(a, b) === Math.min(a, b));
    const common = factorsOf(gcd(a, b)).filter((x) => x > 1);
    ans = pick(rng, common);
    wrong = shuffle(rng, [...factorsOf(a), ...factorsOf(b)].filter((x) => !(a % x === 0 && b % x === 0) && x > 1)).slice(0, 6);
    prompt = `Which of these numbers is a factor of both ${a} and ${b}?`;
    steps = [`It must divide exactly into ${a} <b>and</b> into ${b}.`, `$${a} \\div ${ans} = ${a / ans}$ and $${b} \\div ${ans} = ${b / ans}$.`];
  }
  return {
    prompt,
    answer: num(ans),
    distractors: uniq(wrong.map((v) => num(v)), num(ans)),
    typed: { kind: 'number', value: ans },
    solution: [...steps, `Answer: ${num(ans)}`],
  };
}, { title: 'Identify factors and multiples' });

export const fmCount = gen('num-fm-count', 'num-factors-multiples', (rng, d) => {
  if (d !== 'hard' && chance(rng, 0.5)) {
    const k = pick(rng, d === 'easy' ? [2, 4] : [3, 4, 6]);
    const cands = range(6, 80);
    const good = cands.filter((x) => nFactors(x) === k);
    const ans = pick(rng, good);
    const bad = shuffle(rng, cands.filter((x) => nFactors(x) !== k && Math.abs(nFactors(x) - k) <= 3)).slice(0, 6);
    const word = { 2: 'two', 3: 'three', 4: 'four', 6: 'six' }[k];
    return {
      prompt: `Which of these numbers has exactly ${word} factors?`,
      answer: num(ans),
      distractors: uniq(bad.map((v) => num(v)), num(ans)),
      typed: { kind: 'number', value: ans },
      solution: [
        'List the factors of each number in pairs.',
        `Factors of ${ans}: ${listText(factorsOf(ans))} – that is ${word}.`,
        `For example, ${bad[0]} has ${nFactors(bad[0])} factors: ${listText(factorsOf(bad[0]))}.`,
        `Answer: ${ans}`,
      ],
    };
  }
  const n = pick(rng, size(d, [10, 12, 14, 15, 16, 18, 20, 21, 22, 24, 25, 26, 27, 28, 30], [32, 36, 40, 42, 44, 45, 48, 50, 54, 56, 60, 63, 64, 66, 70, 72], [78, 80, 84, 88, 90, 96, 100, 108, 112, 120, 126, 132, 144, 150, 160, 180, 200]));
  const f = factorsOf(n);
  return {
    prompt: `How many factors does ${n} have?`,
    answer: num(f.length),
    distractors: uniq([f.length - 1, f.length + 1, f.length - 2, Math.ceil(f.length / 2), primeFactors(n).length, f.length + 2].filter((v) => v > 0).map((v) => num(v)), num(f.length)),
    typed: { kind: 'number', value: f.length },
    solution: [
      'Find the factors in pairs so you do not miss any.',
      f.slice(0, Math.ceil(f.length / 2)).map((x) => `$${x} \\times ${n / x}$`).join(', '),
      `Factors: ${listText(f)}${isSquare(n) ? ` (${Math.sqrt(n)} pairs with itself, so count it once)` : ''}.`,
      `Answer: ${f.length}`,
    ],
  };
}, { title: 'Count factors' });

const CLUES = [
  { make: (x, rng) => { const k = pick(rng, factorsOf(x).filter((f) => f > 2 && f < x && f <= 12)); return k ? { text: `It is a multiple of ${k}.`, test: (y) => y % k === 0 } : null; } },
  { make: (x, rng) => { const m = x * pick(rng, [2, 3, 4, 5, 6]); return m <= 200 ? { text: `It is a factor of ${m}.`, test: (y) => m % y === 0 } : null; } },
  { make: (x) => ({ text: x % 2 ? 'It is odd.' : 'It is even.', test: (y) => y % 2 === x % 2 }) },
  { range: true, make: (x, rng) => { const lo = x - int(rng, 1, 15); const hi = Math.min(99, x + int(rng, 1, 15)); return lo > 1 && hi > x ? { text: `It is between ${lo} and ${hi}.`, test: (y) => y > lo && y < hi } : null; } },
  { make: (x) => (isSquare(x) ? { text: 'It is a square number.', test: isSquare } : null) },
  { make: (x) => (isPrime(x) ? { text: 'It is a prime number.', test: isPrime } : null) },
  { make: (x) => ({ text: `Its digits add up to ${String(x).split('').reduce((a, b) => a + Number(b), 0)}.`, test: (y) => String(y).split('').reduce((a, b) => a + Number(b), 0) === String(x).split('').reduce((a, b) => a + Number(b), 0) }) },
];

export const fmPuzzle = gen('num-fm-puzzle', 'num-factors-multiples', (rng, d) => {
  const x = int(rng, size(d, 6, 12, 20), size(d, 40, 80, 99));
  const universe = range(1, 99);
  let clues = [];
  let left = universe;
  for (const c of shuffle(rng, CLUES.filter((cc) => d !== 'hard' || !cc.range))) {
    const cl = c.make(x, rng);
    if (!cl) continue;
    const next = left.filter(cl.test);
    if (next.length < left.length) { clues.push(cl); left = next; }
    if (left.length === 1) break;
  }
  if (left.length !== 1) throw new Error('retry');
  // drop any clue that the others already make unnecessary (e.g. "even" next to "multiple of 12")
  for (let i = clues.length - 1; i >= 0; i -= 1) {
    const rest = clues.filter((_, j) => j !== i);
    if (rest.length >= 2 && universe.filter((y) => rest.every((c) => c.test(y))).length === 1) clues = rest;
  }
  if (clues.length < 2 || clues.length > 4) throw new Error('retry');
  // distractors: numbers that satisfy all but one clue
  const near = universe.filter((y) => y !== x && clues.filter((c) => c.test(y)).length === clues.length - 1);
  return {
    prompt: `I am thinking of a whole number less than 100.<br>${clues.map((c) => `• ${c.text}`).join('<br>')}<br>What is my number?`,
    answer: num(x),
    distractors: uniq(shuffle(rng, near).slice(0, 6).map((v) => num(v)), num(x)),
    typed: { kind: 'number', value: x },
    solution: [
      'Use one clue at a time to cut down the list of possible numbers.',
      ...clues.map((c, i) => `${i === 0 ? 'Start with' : 'Then'}: "${c.text}" ${i === clues.length - 1 ? `leaves only ${x}.` : `leaves ${universe.filter((y) => clues.slice(0, i + 1).every((cc) => cc.test(y))).length} numbers.`}`),
      `Answer: ${x}`,
    ].slice(0, 6),
  };
}, { title: 'Number puzzle with factor/multiple clues', learn: ['num-factors-multiples', 'num-primes'] });

/* ================================================================== */
/* num-primes                                                          */
/* ================================================================== */

const PROPS = {
  prime: { text: 'a prime number', test: isPrime },
  square: { text: 'a square number', test: isSquare },
  cube: { text: 'a cube number', test: isCube },
  triangular: { text: 'a triangular number', test: isTri },
  oneLessCube: { text: 'one less than a cube number', test: (n) => isCube(n + 1) },
  oneMoreSquare: { text: 'one more than a square number', test: (n) => isSquare(n - 1) },
};

export const primesIdentify = gen('num-primes-identify', 'num-primes', (rng, d) => {
  const key = pick(rng, size(d, ['prime', 'square', 'prime', 'cube'], ['prime', 'notPrime', 'cube', 'triangular', 'square'], ['oneLessCube', 'notPrime', 'triangular', 'oneMoreSquare', 'prime']));
  let prompt; let ans; let wrong; let why;
  const lim = size(d, 50, 100, 150);
  if (key === 'prime') {
    ans = pick(rng, PRIMES.filter((p) => p > size(d, 10, 20, 40) && p < lim));
    wrong = shuffle(rng, ODD_COMPOSITES.filter((x) => x < lim)).slice(0, 5).concat(d === 'easy' ? [1] : [1, 91, 51, 57]);
    prompt = 'Which of these numbers is a <b>prime</b> number?';
    why = `${ans} has exactly two factors, 1 and ${ans}. The others can be divided by something else (for example ${wrong[0]} = ${primeFactors(wrong[0])[0]} × ${wrong[0] / primeFactors(wrong[0])[0]}). Remember 1 is <b>not</b> prime.`;
  } else if (key === 'notPrime') {
    ans = pick(rng, [51, 57, 87, 91, 69, 77, 119, 133, 143, 39].filter((x) => x < lim + 50));
    wrong = shuffle(rng, PRIMES.filter((p) => p > 20 && p < lim + 50)).slice(0, 6);
    prompt = 'Which of these numbers is <b>not</b> a prime number?';
    why = `$${ans} = ${primeFactors(ans).join(' \\times ')}$, so it has more than two factors. The other numbers are all prime.`;
  } else {
    const P = PROPS[key];
    const cands = range(2, key === 'cube' || key === 'oneLessCube' ? 1000 : lim).filter(P.test);
    ans = pick(rng, cands.filter((x) => x > 3));
    const lookalike = {
      square: [ans * 2, ans + 1, ans - 1, 2 * Math.sqrt(ans), ...range(10, lim).filter((x) => x % 10 === 6 || x % 10 === 4)],
      cube: [Math.round(Math.cbrt(ans)) * 3, Math.round(Math.cbrt(ans)) ** 2, ans + 1, ans - 1, 9, 16, 36, 100, 81, 49],
      triangular: [16, 25, 18, 22, 30, 40, 50, 24, 12, 20, 14],
      oneLessCube: [ans + 2, ans - 1, 8, 27, 64, 15, 24, 35, 48, 125],
      oneMoreSquare: [ans + 1, ans - 1, 16, 25, 36, 49, 64, 35, 48, 63],
    }[key];
    wrong = shuffle(rng, lookalike.filter((x) => Number.isInteger(x) && x > 1 && !P.test(x)));
    prompt = `Which of these numbers is ${P.text}?`;
    why = {
      square: `$${ans} = ${Math.sqrt(ans)} \\times ${Math.sqrt(ans)}$`,
      cube: `$${ans} = ${Math.round(Math.cbrt(ans))} \\times ${Math.round(Math.cbrt(ans))} \\times ${Math.round(Math.cbrt(ans))}$`,
      triangular: `The triangular numbers are 1, 3, 6, 10, 15, 21, 28, 36, 45, 55, … (add 2, then 3, then 4, …). ${ans} is in the list.`,
      oneLessCube: `$${ans} + 1 = ${ans + 1} = ${Math.round(Math.cbrt(ans + 1))}^{3}$`,
      oneMoreSquare: `$${ans} - 1 = ${ans - 1} = ${Math.sqrt(ans - 1)}^{2}$`,
    }[key];
  }
  const shown = uniq(wrong.map((v) => num(v)), num(ans)).slice(0, 4);
  if (shown.length < 4) throw new Error('retry');
  return {
    prompt: `${prompt}<br>${shuffle(rng, [num(ans), ...shown]).join(',&nbsp;&nbsp; ')}`,
    answer: num(ans),
    distractors: shown,
    typed: { kind: 'number', value: ans },
    solution: [why, `Answer: ${ans}`],
  };
}, { title: 'Recognise primes, squares, cubes' });

export const primesFacts = gen('num-primes-facts', 'num-primes', (rng, d) => {
  const type = pick(rng, size(d, ['countBetween', 'sumFirst', 'nextPrime'], ['countBetween', 'product', 'countPowers', 'sumFirst'], ['product', 'countPowers', 'countBetween']));
  let prompt; let ans; let wrong; let steps;
  if (type === 'countBetween') {
    const lo = size(d, pick(rng, [10, 20, 30]), pick(rng, [40, 50, 60]), pick(rng, [70, 80, 90, 100]));
    const hi = lo + size(d, 20, 20, 30);
    const ps = PRIMES.filter((p) => p > lo && p < hi);
    ans = ps.length;
    prompt = `How many prime numbers are there between ${lo} and ${hi}?`;
    wrong = [ans + 1, ans - 1, ans + 2, range(lo + 1, hi - 1).filter((x) => x % 2).length, ans - 2];
    steps = [`Check the odd numbers between ${lo} and ${hi} (even numbers apart from 2 are not prime).`, `Cross out multiples of 3, 5 and 7. The primes are ${listText(ps)}.`];
  } else if (type === 'sumFirst') {
    const k = pick(rng, [3, 4, 5, 6]);
    ans = PRIMES.slice(0, k).reduce((a, b) => a + b, 0);
    prompt = `Work out the sum of the first ${k} prime numbers.`;
    wrong = [[1, ...PRIMES.slice(0, k - 1)].reduce((a, b) => a + b, 0), PRIMES.slice(1, k + 1).reduce((a, b) => a + b, 0), [1, 3, 5, 7, 9, 11].slice(0, k).reduce((a, b) => a + b, 0), ans + 1, ans - 2];
    steps = [`The first ${k} prime numbers are ${listText(PRIMES.slice(0, k))} (1 is not prime, and 2 is the only even prime).`, `$${PRIMES.slice(0, k).join(' + ')} = ${ans}$`];
  } else if (type === 'nextPrime') {
    const n = int(rng, 20, 90);
    ans = PRIMES.find((p) => p > n);
    prompt = `What is the smallest prime number greater than ${n}?`;
    wrong = [ans + 2, n + 1, ODD_COMPOSITES.find((x) => x > n) || ans + 4, PRIMES.find((p) => p > ans), ans - 1].filter((x) => x !== ans);
    steps = [`Test each number after ${n}: ${range(n + 1, ans).map((x) => (isPrime(x) ? `${x} is prime` : `${x} = ${primeFactors(x)[0]} × ${x / primeFactors(x)[0]}`)).join('; ')}.`];
  } else if (type === 'product') {
    let p; let q;
    do { [p, q] = sample(rng, PRIMES.filter((x) => x > 2 && x < size(d, 20, 30, 50)), 2); } while (p * q > 1000);
    const N = p * q;
    const wantSum = chance(rng);
    ans = wantSum ? p + q : Math.abs(p - q);
    prompt = `Two prime numbers are multiplied together. The answer is ${N}. ${wantSum ? 'Work out the sum of the two prime numbers.' : 'Work out the difference between the two prime numbers.'}`;
    wrong = [wantSum ? Math.abs(p - q) : p + q, N, 1 + N, Math.max(p, q), wantSum ? p + q + 2 : Math.abs(p - q) + 2];
    steps = [`Try dividing ${N} by small primes: 3, 5, 7, 11, 13, …`, `$${N} = ${Math.min(p, q)} \\times ${Math.max(p, q)}$, and both are prime.`, `${wantSum ? 'Sum' : 'Difference'}: $${wantSum ? `${p} + ${q}` : `${Math.max(p, q)} - ${Math.min(p, q)}`} = ${ans}$`];
  } else {
    const which = pick(rng, [['cube', 3], ['cube', 2], ['square', 2], ['square', 3]]);
    const [kind, digits] = which;
    const lo = 10 ** (digits - 1); const hi = 10 ** digits - 1;
    const list = range(1, 40).map((k) => (kind === 'cube' ? k ** 3 : k * k)).filter((v) => v >= lo && v <= hi);
    ans = list.length;
    prompt = `How many ${digits}-digit ${kind} numbers are there?`;
    wrong = [ans + 1, ans - 1, ans + 2, kind === 'cube' ? ans * 2 : ans - 2, 9];
    steps = [`List the ${kind} numbers with ${digits} digits: ${listText(list.length > 8 ? [...list.slice(0, 3), '…', ...list.slice(-2)].filter((x) => x !== '…') : list)}${list.length > 8 ? ` (from $${Math.round(kind === 'cube' ? Math.cbrt(list[0]) : Math.sqrt(list[0]))}^{${kind === 'cube' ? 3 : 2}}$ to $${Math.round(kind === 'cube' ? Math.cbrt(list[list.length - 1]) : Math.sqrt(list[list.length - 1]))}^{${kind === 'cube' ? 3 : 2}}$)` : ''}.`, `Count them: ${ans}.`];
  }
  return {
    prompt,
    answer: num(ans),
    distractors: uniq(wrong.filter((v) => v > 0 && v !== ans).map((v) => num(v)), num(ans)),
    typed: { kind: 'number', value: ans },
    solution: [...steps, `Answer: ${ans}`],
  };
}, { title: 'Facts about primes, squares and cubes' });

const TWO_PROPS = [
  { text: 'a square number', test: isSquare },
  { text: 'a cube number', test: isCube },
  { text: 'a prime number', test: isPrime },
  { text: 'an even number', test: (n) => n % 2 === 0 },
  { text: 'an odd number', test: (n) => n % 2 === 1 },
  { text: 'a multiple of 3', test: (n) => n % 3 === 0 },
  { text: 'a multiple of 5', test: (n) => n % 5 === 0 },
  { text: 'a factor of 60', test: (n) => 60 % n === 0 },
  { text: 'a factor of 48', test: (n) => 48 % n === 0 },
  { text: 'greater than 30', test: (n) => n > 30 },
  { text: 'a triangular number', test: isTri },
];

export const primesTwoProps = gen('num-primes-two-properties', 'num-primes', (rng, d) => {
  const universe = range(2, 100);
  for (let t = 0; t < 40; t += 1) {
    const [A, B] = sample(rng, d === 'easy' ? TWO_PROPS.slice(0, 7) : TWO_PROPS, 2);
    const both = universe.filter((n) => A.test(n) && B.test(n));
    if (both.length < 1 || both.length > 6) continue;
    const onlyOne = universe.filter((n) => A.test(n) !== B.test(n));
    if (onlyOne.length < 4) continue;
    const ans = pick(rng, both);
    const wrong = [...shuffle(rng, onlyOne.filter((n) => A.test(n))).slice(0, 2), ...shuffle(rng, onlyOne.filter((n) => B.test(n))).slice(0, 3)];
    if (wrong.length < 4) continue;
    return {
      prompt: `Which of these numbers is <b>both</b> ${A.text} <b>and</b> ${B.text}?`,
      answer: num(ans),
      distractors: uniq(wrong.map((v) => num(v)), num(ans)),
      typed: { kind: 'number', value: ans },
      solution: [
        `Check each number against <b>both</b> conditions.`,
        `${ans} is ${A.text} and it is ${B.text}.`,
        `The others only satisfy one condition – for example ${wrong[0]} is ${A.test(wrong[0]) ? A.text : B.text} but not ${A.test(wrong[0]) ? B.text : A.text}.`,
        `Answer: ${ans}`,
      ],
    };
  }
  throw new Error('retry');
}, { title: 'Numbers with two properties' });

/* ================================================================== */
/* num-prime-factorisation                                             */
/* ================================================================== */

function randomPrimeMap(rng, d) {
  for (;;) {
    const m = {};
    const ps = size(d, sample(rng, [2, 3, 5, 7], int(rng, 2, 3)), sample(rng, [2, 3, 5, 7], int(rng, 2, 3)), sample(rng, [2, 3, 5, 7, 11], 3));
    ps.forEach((p) => { m[p] = int(rng, 1, p === 2 ? size(d, 3, 4, 5) : p <= 5 ? 2 : 1); });
    const v = valueOfMap(m);
    const [lo, hi] = size(d, [12, 100], [100, 800], [500, 5000]);
    if (v >= lo && v <= hi && Object.values(m).some((k) => k > 1)) return m;
  }
}
const typedIndex = (m) => {
  const parts = Object.keys(m).map(Number).sort((a, b) => a - b).map((p) => (m[p] === 1 ? `${p}` : `${p}^${m[p]}`));
  return { kind: 'text', accept: [parts.join('*'), parts.join('x'), parts.join('×'), parts.join('.')] };
};
function indexDistractors(m, n) {
  const keys = Object.keys(m).map(Number).sort((a, b) => a - b);
  const out = [];
  // non-prime factor split (e.g. 4 × 9 × 10)
  const a = keys[0] ** Math.min(2, m[keys[0]]);
  if (a !== n && n % a === 0) {
    const rest = n / a;
    const b = factorsOf(rest).find((f) => f > 3 && !isPrime(f) && f < rest) || rest;
    out.push(b === rest ? `${a} \\times ${rest}` : `${a} \\times ${b} \\times ${rest / b}`);
  }
  keys.forEach((p) => {
    out.push(indexFormMap({ ...m, [p]: m[p] + 1 }));
    if (m[p] > 1) out.push(indexFormMap({ ...m, [p]: m[p] - 1 }));
  });
  if (keys.length >= 2) {
    const [p, q] = keys;
    out.push(indexFormMap({ ...m, [p]: m[q], [q]: m[p] }));
    const mm = { ...m }; delete mm[keys[keys.length - 1]]; out.push(indexFormMap(mm));
  }
  out.push(keys.map((p) => `${p} \\times ${m[p]}`).join(' + '));
  return out.map((s) => `$${s}$`);
}

export const pfWrite = gen('num-pf-write', 'num-prime-factorisation', (rng, d) => {
  const m = randomPrimeMap(rng, d);
  const n = valueOfMap(m);
  const ans = `$${indexFormMap(m)}$`;
  // a factor tree path for the solution
  const steps = [];
  let cur = n;
  for (const p of primeFactors(n)) { if (cur === p) break; steps.push(`$${tnum(cur)} = ${p} \\times ${tnum(cur / p)}$`); cur /= p; }
  return {
    prompt: `Write ${num(n)} as a product of its prime factors.<br>Give your answer in index form.`,
    answer: ans,
    distractors: uniq(indexDistractors(m, n), ans),
    typed: typedIndex(m),
    solution: [
      'Keep dividing by prime numbers (2, 3, 5, 7, …) until you are left with only primes – a factor tree does this.',
      steps.slice(0, 4).join(', ') + (steps.length > 4 ? ', …' : ''),
      `So $${tnum(n)} = ${primeFactors(n).join(' \\times ')}$`,
      `In index form: ${ans}`,
    ],
  };
}, { title: 'Write as a product of primes' });

export const pfValue = gen('num-pf-value', 'num-prime-factorisation', (rng, d) => {
  const m = randomPrimeMap(rng, d);
  const n = valueOfMap(m);
  const keys = Object.keys(m).map(Number);
  const asMult = keys.reduce((acc, p) => acc * p * m[p], 1);
  const wrong = [asMult, keys.reduce((acc, p) => acc + p ** m[p], 0), n * 2, n / keys[0], keys.reduce((acc, p) => acc * (m[p] === 1 ? p : p ** (m[p] + 1)), 1), n + 10];
  return {
    prompt: `Work out the value of $${indexFormMap(m)}$`,
    answer: num(n),
    distractors: uniq(wrong.filter((v) => Number.isInteger(v) && v > 0 && v !== n).map((v) => num(v)), num(n)),
    typed: { kind: 'number', value: n },
    solution: [
      'Work out each power first, then multiply.',
      keys.filter((p) => m[p] > 1).map((p) => `$${p}^{${m[p]}} = ${p ** m[p]}$ (not $${p} \\times ${m[p]}$)`).join(', '),
      `$${keys.map((p) => p ** m[p]).join(' \\times ')} = ${tnum(n)}$`,
      `Answer: ${num(n)}`,
    ],
  };
}, { title: 'Value from prime factor form' });

export const pfUse = gen('num-pf-use', 'num-prime-factorisation', (rng, d) => {
  const type = pick(rng, size(d, ['times', 'divisible'], ['times', 'square', 'sqrt'], ['square', 'sqrt', 'cube', 'times']));
  let m;
  if (type === 'sqrt') { m = {}; sample(rng, [2, 3, 5, 7], int(rng, 2, 3)).forEach((p) => { m[p] = 2 * int(rng, 1, p === 2 ? 2 : 1); }); }
  else if (type === 'cube') { m = {}; sample(rng, [2, 3, 5], 2).forEach((p) => { m[p] = 3; }); }
  else m = randomPrimeMap(rng, d === 'hard' ? 'medium' : d);
  const n = valueOfMap(m);
  const given = `$${tnum(n)} = ${indexFormMap(m)}$`;
  if (type === 'times') {
    const k = pick(rng, [2, 3, 4, 5, 6, 10]);
    const mm = { ...m };
    primeFactors(k).forEach((p) => { mm[p] = (mm[p] || 0) + 1; });
    const ans = `$${indexFormMap(mm)}$`;
    const wrongMap = { ...m }; wrongMap[k] = (wrongMap[k] || 0) + 1;
    return {
      prompt: `You are given that ${given}<br>Write ${num(n * k)} as a product of its prime factors in index form.`,
      answer: ans,
      distractors: uniq([...(isPrime(k) ? [] : [`$${indexFormMap(m)} \\times ${k}$`]), ...indexDistractors(mm, n * k), `$${indexFormMap(m)}$`], ans),
      typed: typedIndex(mm),
      solution: [
        `$${tnum(n * k)} = ${tnum(n)} \\times ${k}$ and $${k} = ${primeFactors(k).join(' \\times ')}$.`,
        `Multiplying adds to the powers: $${indexFormMap(m)} \\times ${primeFactors(k).join(' \\times ')}$`,
        `$= ${indexFormMap(mm)}$`,
        `Answer: ${ans}`,
      ],
    };
  }
  if (type === 'divisible') {
    const keys = Object.keys(m).map(Number);
    const yesK = pick(rng, factorsOf(n).filter((f) => f > 3 && f < n));
    const noK = pick(rng, range(4, 30).filter((f) => n % f !== 0));
    const askYes = chance(rng);
    const k = askYes ? yesK : noK;
    const statements = [`${num(n)} is a multiple of ${k}`, `${num(n)} is not a multiple of ${k}`];
    void keys;
    const ans = statements[askYes ? 0 : 1];
    return {
      prompt: `You are given that ${given}<br>Which statement is correct?`,
      answer: ans,
      distractors: [statements[askYes ? 1 : 0], `${num(n)} is a prime number`, `${num(n)} is an odd number`.replace('odd', n % 2 ? 'even' : 'odd')],
      count: 4,
      solution: [
        `$${k} = ${primeFactors(k).join(' \\times ')}$.`,
        askYes ? `All of these primes appear in ${given}, so ${num(n)} divides by ${k}: $${tnum(n)} \\div ${k} = ${tnum(n / k)}$.` : `${given} does not contain all of $${primeFactors(k).join(' \\times ')}$, so ${k} does not divide ${num(n)} exactly.`,
        `Answer: ${ans}`,
      ],
    };
  }
  if (type === 'square') {
    const mm = {}; Object.keys(m).forEach((p) => { mm[p] = m[p] * 2; });
    const ans = `$${indexFormMap(mm)}$`;
    const sq = {}; Object.keys(m).forEach((p) => { sq[p] = m[p] ** 2; });
    const plus = {}; Object.keys(m).forEach((p) => { plus[p] = m[p] + 2; });
    const half = {}; Object.keys(m).forEach((p) => { half[p] = m[p] + 1; });
    return {
      prompt: `You are given that ${given}<br>Write ${num(n)}² as a product of prime factors in index form.`.replace(`${num(n)}²`, `$${tnum(n)}^{2}$`),
      answer: ans,
      distractors: uniq([`$${indexFormMap(sq)}$`, `$${indexFormMap(plus)}$`, `$${indexFormMap(half)}$`, `$2 \\times ${indexFormMap(m)}$`, `$${indexFormMap(m)}^{2}$`.replace(/\^\{(\d+)\}\^\{2\}/, '^{$1}^{2}')].filter((s) => !/\}\^\{/.test(s)), ans),
      typed: typedIndex(mm),
      solution: [
        `$${tnum(n)}^{2} = (${indexFormMap(m)})^{2}$`,
        'Squaring <b>doubles</b> every power ([[num-index-laws|power of a power]]: multiply the indices).',
        `$= ${indexFormMap(mm)}$`,
        `Answer: ${ans}`,
      ],
    };
  }
  const root = type === 'cube' ? 3 : 2;
  const r = {}; Object.keys(m).forEach((p) => { r[p] = m[p] / root; });
  const ans = valueOfMap(r);
  return {
    prompt: `You are given that ${given}<br>Work out $${root === 3 ? '\\sqrt[3]' : '\\sqrt'}{${tnum(n)}}$`,
    answer: num(ans),
    distractors: uniq([n / root, ans * 2, ans / 2, valueOfMap(Object.fromEntries(Object.keys(m).map((p) => [p, m[p] - 1]))), ans + root].filter((v) => Number.isInteger(v) && v > 0 && v !== ans).map((v) => num(v)), num(ans)),
    typed: { kind: 'number', value: ans },
    solution: [
      `Taking the ${root === 3 ? 'cube' : 'square'} root ${root === 3 ? 'divides every power by 3' : 'halves every power'}.`,
      `$${root === 3 ? '\\sqrt[3]' : '\\sqrt'}{${indexFormMap(m)}} = ${indexFormMap(r)}$`,
      `$= ${tnum(ans)}$`,
      `Answer: ${num(ans)}`,
    ],
  };
}, { title: 'Use a prime factorisation', learn: ['num-prime-factorisation', 'num-index-laws'] });

/* ================================================================== */
/* num-hcf-lcm                                                         */
/* ================================================================== */

function pairWithCommon(rng, d) {
  for (;;) {
    const g = size(d, pick(rng, [2, 3, 4, 5, 6]), pick(rng, [4, 6, 8, 9, 12, 14]), pick(rng, [6, 12, 15, 18, 24, 36]));
    const [p, q] = sample(rng, size(d, [2, 3, 4, 5], [2, 3, 4, 5, 7], [2, 3, 5, 7, 11, 4]), 2);
    if (gcd(p, q) !== 1) continue;
    const a = g * p; const b = g * q;
    const lo = Math.min(a, b); const hi = Math.max(a, b);
    if (size(d, hi <= 60, lo >= 16 && hi <= 120, lo >= 50 && hi <= 400)) return [a, b];
  }
}

export const hcfDirect = gen('num-hcf-direct', 'num-hcf-lcm', (rng, d) => {
  const [a, b] = pairWithCommon(rng, d);
  const h = gcd(a, b); const L = lcm(a, b);
  const smallerCommon = factorsOf(h).filter((f) => f > 1 && f < h);
  return {
    prompt: `Work out the highest common factor (HCF) of ${a} and ${b}.`,
    answer: num(h),
    distractors: uniq([L, ...smallerCommon.slice(-2), Math.min(a, b), h * 2, a * b, Math.abs(a - b) !== h ? Math.abs(a - b) : h + 1].filter((v) => v !== h).map((v) => num(v)), num(h)),
    typed: { kind: 'number', value: h },
    solution: [
      `Prime factors: $${a} = ${primeFactors(a).join(' \\times ')}$ and $${b} = ${primeFactors(b).join(' \\times ')}$.`,
      `The HCF is the product of the primes they <b>share</b>: $${primeFactors(h).join(' \\times ') || '1'} = ${h}$.`,
      `Check: ${h} divides both (${a} ÷ ${h} = ${a / h}, ${b} ÷ ${h} = ${b / h}) and ${a / h} and ${b / h} have no common factor.`,
      `Answer: ${h}`,
    ],
  };
}, { title: 'Find the HCF' });

export const lcmDirect = gen('num-lcm-direct', 'num-hcf-lcm', (rng, d) => {
  if (d === 'hard') {
    // LCM of three numbers
    const [a, b, c] = sample(rng, [4, 6, 8, 9, 10, 12, 14, 15, 18, 20], 3).sort((x, y) => x - y);
    const L = lcm(lcm(a, b), c);
    if (L > 360 || L === a * b * c || L === c) throw new Error('retry');
    const pf = (n) => primeFactors(n).join(' \\times ');
    return {
      prompt: `Work out the lowest common multiple (LCM) of ${a}, ${b} and ${c}.`,
      answer: num(L),
      distractors: uniq([a * b * c, lcm(a, b), lcm(b, c), L * 2, gcd(gcd(a, b), c), a * b * c / gcd(gcd(a, b), c), lcm(a, c)].filter((v) => v !== L && v > 1).map((v) => num(v)), num(L)),
      typed: { kind: 'number', value: L },
      solution: [
        `Prime factors: $${a} = ${pf(a)}$, $${b} = ${pf(b)}$, $${c} = ${pf(c)}$.`,
        'The LCM uses every prime that appears, with the highest power that appears in any one number.',
        `LCM $= ${primeFactors(L).join(' \\times ')} = ${tnum(L)}$`,
        `Answer: ${num(L)}`,
      ],
    };
  }
  const [a, b] = pairWithCommon(rng, d);
  const h = gcd(a, b); const L = lcm(a, b);
  if (L > 400) throw new Error('retry');
  const big = Math.max(a, b); const small = Math.min(a, b);
  return {
    prompt: `Work out the lowest common multiple (LCM) of ${a} and ${b}.`,
    answer: num(L),
    distractors: uniq([a * b, h, L * 2, a + b, big * (L / big + 1)].filter((v) => v !== L).map((v) => num(v)), num(L)),
    typed: { kind: 'number', value: L },
    solution: [
      `List multiples of ${big}: ${range(1, Math.min(L / big + 1, 7)).map((k) => num(k * big)).join(', ')}, …`,
      `The first one that is also a multiple of ${small} is ${num(L)} ($${small} \\times ${L / small} = ${L}$).`,
      `Shortcut: LCM = $${a} \\times ${b} \\div \\text{HCF} = ${tnum(a * b)} \\div ${h} = ${tnum(L)}$. (The product ${num(a * b)} is a common multiple, but not the lowest.)`,
      `Answer: ${num(L)}`,
    ],
  };
}, { title: 'Find the LCM' });

export const hcfLcmIndex = gen('num-hcf-lcm-index', 'num-hcf-lcm', (rng, d) => {
  const ps = sample(rng, [2, 3, 5, 7], 3).sort((x, y) => x - y);
  const A = {}; const B = {};
  ps.forEach((p, i) => {
    if (i === 2) { (chance(rng) ? A : B)[p] = int(rng, 1, 2); return; }
    A[p] = int(rng, 1, 4); B[p] = int(rng, 1, 4);
    if (A[p] === B[p]) A[p] += 1;
  });
  const wantH = chance(rng);
  const H = {}; const L = {};
  ps.forEach((p) => { const a = A[p] || 0; const b = B[p] || 0; if (Math.min(a, b)) H[p] = Math.min(a, b); L[p] = Math.max(a, b); });
  const ansMap = wantH ? H : L;
  const asNumber = d === 'easy';
  const allMin = {}; ps.forEach((p) => { allMin[p] = Math.min(A[p] || 99, B[p] || 99); });
  const sumMap = {}; ps.forEach((p) => { sumMap[p] = (A[p] || 0) + (B[p] || 0); });
  const sharedMax = {}; ps.forEach((p) => { if (A[p] && B[p]) sharedMax[p] = Math.max(A[p], B[p]); });
  const wrongMaps = [wantH ? L : H, wantH ? allMin : sharedMax, sumMap, wantH ? sharedMax : allMin];
  const fmt = (m) => (asNumber ? num(valueOfMap(m)) : `$${indexFormMap(m)}$`);
  const ans = fmt(ansMap);
  return {
    prompt: `$A = ${indexFormMap(A)}$ and $B = ${indexFormMap(B)}$<br>${asNumber ? `Work out the ${wantH ? 'highest common factor (HCF)' : 'lowest common multiple (LCM)'} of $A$ and $B$.` : `Write the ${wantH ? 'HCF' : 'LCM'} of $A$ and $B$ as a product of prime factors.`}`,
    answer: ans,
    distractors: uniq([...wrongMaps, { ...ansMap, [ps[0]]: (ansMap[ps[0]] || 0) + 1 }, { ...ansMap, [ps[1]]: Math.max(1, (ansMap[ps[1]] || 1) + (chance(rng) ? 1 : -1)) }, { ...ansMap, [ps[0]]: Math.max(0, (ansMap[ps[0]] || 0) - 1) }].filter((mp) => Object.values(mp).some((k) => k > 0)).filter((mp) => !asNumber || valueOfMap(mp) <= 20 * valueOfMap(ansMap)).map(fmt), ans),
    typed: asNumber ? { kind: 'number', value: valueOfMap(ansMap) } : typedIndex(ansMap),
    solution: [
      wantH ? 'HCF: take only the primes that appear in <b>both</b>, with the <b>lower</b> power.' : 'LCM: take <b>every</b> prime that appears in either, with the <b>higher</b> power.',
      ps.map((p) => `${p}: powers ${A[p] || 0} and ${B[p] || 0} → ${wantH ? (H[p] ? `use $${indexFormMap({ [p]: H[p] })}$` : 'not in both') : `use $${indexFormMap({ [p]: L[p] })}$`}`).join('; '),
      `${wantH ? 'HCF' : 'LCM'} $= ${indexFormMap(ansMap)}${asNumber ? ` = ${tnum(valueOfMap(ansMap))}` : ''}$`,
      `Answer: ${ans}`,
    ],
  };
}, { title: 'HCF/LCM from prime factor form', learn: ['num-hcf-lcm', 'num-prime-factorisation'] });

export const hcfLcmReverse = gen('num-hcf-lcm-reverse', 'num-hcf-lcm', (rng, d) => {
  for (;;) {
    const h = pick(rng, size(d, [2, 3, 4, 5], [3, 4, 6, 8], [6, 9, 12, 15]));
    const [p, q] = sample(rng, [1, 2, 3, 4, 5, 7], 2);
    if (gcd(p, q) !== 1) continue;
    const a = h * p; const b = h * q; const L = lcm(a, b);
    if (a === L || b === L || a < 6) continue;
    return {
      prompt: `Two numbers have a highest common factor of ${h} and a lowest common multiple of ${L}.<br>One of the numbers is ${a}. What is the other number?`,
      answer: num(b),
      distractors: uniq([L / a, L / h, L - a, h * L / (a * 2), L, h * q * 2, b + h].filter((v) => Number.isInteger(v) && v > 0 && v !== b && v !== a).map((v) => num(v)), num(b)),
      typed: { kind: 'number', value: b },
      solution: [
        'For two numbers, HCF × LCM = the product of the two numbers.',
        `$${h} \\times ${tnum(L)} = ${tnum(h * L)}$, so the other number is $${tnum(h * L)} \\div ${a} = ${b}$.`,
        `Check: HCF of ${a} and ${b} is ${gcd(a, b)} and LCM is ${lcm(a, b)} ✓`,
        `Answer: ${b}`,
      ],
    };
  }
}, { title: 'Find a number from its HCF and LCM' });

/* ================================================================== */
/* num-hcf-lcm-problems                                                */
/* ================================================================== */

// Each template receives (a, b) and returns { prompt, unit } for an LCM situation.
const LCM_CONTEXTS = [
  (a, b) => ({ prompt: `A red light flashes every ${a} seconds and a green light flashes every ${b} seconds. They have just flashed together. After how many seconds will they next flash together?`, unit: 'seconds' }),
  (a, b) => ({ prompt: `Bus A leaves the station every ${a} minutes. Bus B leaves every ${b} minutes. Both leave at 9 am. How many minutes later will they next leave at the same time?`, unit: 'minutes' }),
  (a, b) => ({ prompt: `Bread rolls are sold in packs of ${a}. Burgers are sold in packs of ${b}. Kai wants exactly the same number of rolls as burgers. What is the smallest number of each he can buy?`, unit: '' }),
  (a, b) => ({ prompt: `Two runners start together at the same point on a track. One completes a lap every ${a} seconds, the other every ${b} seconds. After how many seconds are they next at the start together?`, unit: 'seconds' }),
  (a, b) => ({ prompt: `Paper plates come in packs of ${a} and paper cups come in packs of ${b}. A café wants the same number of plates and cups with nothing left over. What is the smallest number of plates it can buy?`, unit: '' }),
  (a, b) => ({ prompt: `A lighthouse beam flashes every ${a} seconds. A second lighthouse flashes every ${b} seconds. They flash together at midnight. How many seconds pass before they next flash together?`, unit: 'seconds' }),
  (a, b) => ({ prompt: `Sam visits the gym every ${a} days and Tom visits every ${b} days. They are both at the gym today. In how many days will they next both be at the gym on the same day?`, unit: 'days' }),
  (a, b) => ({ prompt: `Tiles of width ${a} cm are laid in one row and tiles of width ${b} cm in a row next to it. Both rows start at the same wall. What is the shortest length at which the joins in the two rows line up again?`, unit: 'cm' }),
  (a, b) => ({ prompt: `Two cogs are touching. One has ${a} teeth and the other has ${b} teeth. Two marked teeth are touching now. How many teeth must pass before the same two marked teeth touch again?`, unit: '' }),
  (a, b) => ({ prompt: `Hot dog sausages come in packs of ${a} and hot dog buns in packs of ${b}. What is the smallest number of hot dogs that can be made with no sausages or buns left over?`, unit: '' }),
];
// HCF situations: split two quantities into identical groups / largest equal pieces.
const HCF_CONTEXTS = [
  (a, b) => ({ prompt: `A teacher has ${a} pencils and ${b} rulers. She wants to make identical packs using all of them, with no items left over. What is the greatest number of packs she can make?`, unit: '' }),
  (a, b) => ({ prompt: `Two ribbons are ${a} cm and ${b} cm long. They are both cut into pieces that are all the same length, with nothing wasted. What is the longest possible length of each piece?`, unit: 'cm' }),
  (a, b) => ({ prompt: `A florist has ${a} roses and ${b} tulips. She makes identical bunches using every flower. What is the largest number of bunches she can make?`, unit: '' }),
  (a, b) => ({ prompt: `A rectangular floor measures ${a} cm by ${b} cm. It is to be covered with identical square tiles, without cutting any. What is the side length of the largest square tile that can be used?`, unit: 'cm' }),
  (a, b) => ({ prompt: `A club has ${a} girls and ${b} boys. They are split into teams so that every team has the same number of girls and the same number of boys. What is the greatest number of teams possible?`, unit: '' }),
  (a, b) => ({ prompt: `Two planks are ${a} cm and ${b} cm long. A carpenter cuts both into equal lengths with no waste. What is the greatest possible length of each piece?`, unit: 'cm' }),
  (a, b) => ({ prompt: `A party planner has ${a} balloons and ${b} party bags. Every table must get the same number of balloons and the same number of bags, with none left over. What is the largest number of tables that can be served?`, unit: '' }),
];

export const hcfLcmProblems = gen('num-hcf-lcm-word', 'num-hcf-lcm-problems', (rng, d) => {
  const wantLcm = rng() < 0.55;
  // Choose a, b with a common factor g so both HCF and LCM are interesting and different from a*b.
  const g = size(d, pick(rng, [2, 3, 4, 5]), pick(rng, [2, 3, 4, 6]), pick(rng, [4, 6, 8, 12]));
  let p; let q;
  do { [p, q] = sample(rng, size(d, [2, 3, 5], [2, 3, 4, 5, 7], [3, 4, 5, 7, 9]), 2); } while (gcd(p, q) !== 1);
  const k = wantLcm ? 1 : size(d, int(rng, 2, 4), int(rng, 3, 6), int(rng, 4, 8));
  const a = g * p * k; const b = g * q * k;
  const hcf = gcd(a, b); const l = lcm(a, b);
  const ctx = pick(rng, wantLcm ? LCM_CONTEXTS : HCF_CONTEXTS)(a, b);
  const answer = wantLcm ? l : hcf;
  const fmtA = (v) => (ctx.unit ? `${num(v)} ${ctx.unit}` : num(v));
  const pf = (n) => primeFactors(n).join(' \\times ');
  const big = Math.max(a, b);
  return {
    prompt: ctx.prompt,
    answer: fmtA(answer),
    // Misconceptions: the other one of HCF/LCM, the plain product, a smaller common multiple/factor.
    distractors: [fmtA(wantLcm ? hcf : l), fmtA(wantLcm ? a * b : Math.abs(a - b)), fmtA(Math.max(a, b)), fmtA(wantLcm ? l * 2 : hcf / 2), fmtA(Math.min(a, b)), fmtA(answer + g), fmtA(a + b)].filter((t) => !/\.\d/.test(t)),
    typed: { kind: 'number', value: answer },
    solution: wantLcm ? [
      `Things happen "together again" at a <b>common multiple</b> of ${num(a)} and ${num(b)}; we want the <b>lowest</b> one, the [[num-hcf-lcm|LCM]].`,
      `Prime factors: $${num(a)} = ${pf(a)}$ and $${num(b)} = ${pf(b)}$.`,
      `Multiples of ${num(big)}: ${range(1, Math.min(6, l / big + 1)).map((m) => num(m * big)).join(', ')} … the first that ${num(Math.min(a, b))} also divides is ${num(l)}.`,
      `Answer: <b>${fmtA(l)}</b>.`,
    ] : [
      'Splitting both amounts into equal groups with nothing left over needs a <b>common factor</b>; the largest is the HCF.',
      `Prime factors: $${num(a)} = ${pf(a)}$ and $${num(b)} = ${pf(b)}$.`,
      `Multiply the primes they share: HCF = $${pf(hcf) || '1'} = ${num(hcf)}$.`,
      `Answer: <b>${fmtA(hcf)}</b>.`,
    ],
  };
}, { title: 'HCF or LCM word problem (decide which)', word: true });

const TIME_CONTEXTS = [
  { u: 'min', make: (a, b, s) => `Bus A leaves the bus station every ${a} minutes. Bus B leaves every ${b} minutes. Both buses leave at ${s}. At what time will they next leave together?` },
  { u: 'min', make: (a, b, s) => `At a station, trains to Leeds leave every ${a} minutes and trains to York every ${b} minutes. A Leeds train and a York train both leave at ${s}. When do they next leave at the same time?` },
  { u: 'min', make: (a, b, s) => `Amir's medicine reminder beeps every ${a} minutes and his water reminder beeps every ${b} minutes. Both beep at ${s}. When will they next beep together?` },
  { u: 'min', make: (a, b, s) => `In a park, one fountain sprays every ${a} minutes and another every ${b} minutes. Both spray at ${s}. At what time will they next spray together?` },
  { u: 'min', make: (a, b, s) => `A ferry leaves the harbour every ${a} minutes and a tour boat every ${b} minutes. They both leave at ${s}. When do they next leave together?` },
  { u: 'min', make: (a, b, s) => `Two tram routes start from the same stop. Route 1 trams leave every ${a} minutes and Route 2 trams every ${b} minutes. Both leave at ${s}. At what time do they next leave together?` },
  { u: 'min', make: (a, b, s) => `At a theme park, the big wheel starts a new ride every ${a} minutes and the log flume every ${b} minutes. Both start a ride at ${s}. When will they next start together?` },
  { u: 'min', make: (a, b, s) => `A nurse checks patient A every ${a} minutes and patient B every ${b} minutes. She checks both at ${s}. At what time does she next check both together?` },
  { u: 'min', make: (a, b, s) => `In a factory, machine P finishes a batch every ${a} minutes and machine Q every ${b} minutes. Both finish a batch at ${s}. When do they next finish at the same time?` },
  { u: 'min', make: (a, b, s) => `A swimming coach blows a whistle every ${a} minutes and a timer buzzes every ${b} minutes. Both sound at ${s}. When will they next sound together?` },
  { u: 'min', make: (a, b, s) => `Two coaches run from the airport to the city. One leaves every ${a} minutes, the other every ${b} minutes. Both leave at ${s}. What is the next time they leave together?` },
  { u: 'min', make: (a, b, s) => `In a shopping centre, one advert plays every ${a} minutes and another every ${b} minutes on the same screen network. Both play at ${s}. At what time will they next play together?` },
];

export const hcfLcmTime = gen('num-hcf-lcm-time', 'num-hcf-lcm-problems', (rng, d) => {
  for (;;) {
    const [a, b] = size(d, sample(rng, [6, 8, 10, 12, 15, 20], 2), sample(rng, [8, 12, 14, 15, 16, 18, 20, 25], 2), sample(rng, [12, 14, 16, 18, 21, 24, 27, 35, 40], 2));
    const L = lcm(a, b);
    if (L === a * b && d !== 'easy') continue;
    if (L < 30 || L > 180 || L === Math.max(a, b)) continue;
    const start = 60 * int(rng, 6, 15) + pick(rng, [0, 15, 30, 45, 10, 20, 40]);
    const ctx = pick(rng, TIME_CONTEXTS);
    const ans = clock(start + L);
    const wrongs = [clock(start + a * b), clock(start + gcd(a, b)), clock(start + L * 2), clock(start + a + b), clock(start + Math.floor(L / 60) * 100 + (L % 60)), clock(start + L - Math.min(a, b))];
    return {
      prompt: ctx.make(a, b, clock(start)),
      answer: ans,
      distractors: uniq(wrongs, ans),
      solution: [
        `They are together again after the <b>lowest common multiple</b> of ${a} and ${b} minutes.`,
        `Multiples of ${Math.max(a, b)}: ${range(1, L / Math.max(a, b)).map((k) => k * Math.max(a, b)).join(', ')}. The first one in the ${Math.min(a, b)} times table is ${L}. So LCM = ${L} minutes${L >= 60 ? ` = ${Math.floor(L / 60)} h ${L % 60} min` : ''}.`,
        `${clock(start)} + ${L} minutes = ${ans}`,
        `Answer: ${ans}`,
      ],
    };
  }
}, { title: 'LCM problem giving a time', word: true });

const PACK_CONTEXTS = [
  (a, b) => ({ p: `Burgers are sold in packs of ${a}. Buns are sold in packs of ${b}. Lena wants to buy exactly the same number of burgers and buns.`, it: ['packs of burgers', 'packs of buns'] }),
  (a, b) => ({ p: `Paper cups are sold in packs of ${a}. Lids are sold in packs of ${b}. A café owner wants exactly the same number of cups and lids.`, it: ['packs of cups', 'packs of lids'] }),
  (a, b) => ({ p: `Sausages come in packs of ${a} and finger rolls come in packs of ${b}. Dev wants the same number of sausages as rolls.`, it: ['packs of sausages', 'packs of rolls'] }),
  (a, b) => ({ p: `Batteries are sold in packs of ${a}. Torches need one battery each and are sold in boxes of ${b}. A shop wants the same number of batteries as torches.`, it: ['packs of batteries', 'boxes of torches'] }),
  (a, b) => ({ p: `Envelopes are sold in packs of ${a} and cards in packs of ${b}. Hannah wants the same number of envelopes as cards.`, it: ['packs of envelopes', 'packs of cards'] }),
  (a, b) => ({ p: `Tent pegs come in bags of ${a}. Guy ropes come in bags of ${b}. A campsite wants exactly the same number of pegs and ropes.`, it: ['bags of pegs', 'bags of ropes'] }),
  (a, b) => ({ p: `Cupcake cases come in packs of ${a} and cake toppers in packs of ${b}. Isla wants the same number of cases and toppers.`, it: ['packs of cases', 'packs of toppers'] }),
  (a, b) => ({ p: `Plant pots are sold in stacks of ${a} and saucers in stacks of ${b}. A gardener wants the same number of pots and saucers.`, it: ['stacks of pots', 'stacks of saucers'] }),
  (a, b) => ({ p: `Nuts are sold in bags of ${a} and bolts in bags of ${b}. A builder needs exactly the same number of nuts and bolts.`, it: ['bags of nuts', 'bags of bolts'] }),
  (a, b) => ({ p: `Party hats come in packs of ${a} and party blowers in packs of ${b}. Ben wants one hat and one blower for each guest, with none left over.`, it: ['packs of hats', 'packs of blowers'] }),
  (a, b) => ({ p: `Pencils are sold in boxes of ${a} and pencil sharpeners in boxes of ${b}. A school wants exactly the same number of pencils and sharpeners.`, it: ['boxes of pencils', 'boxes of sharpeners'] }),
  (a, b) => ({ p: `Picture frames come in packs of ${a} and photo prints in packs of ${b}. Grace wants the same number of frames and prints.`, it: ['packs of frames', 'packs of prints'] }),
];

export const hcfLcmPacks = gen('num-hcf-lcm-packs', 'num-hcf-lcm-problems', (rng, d) => {
  for (;;) {
    const [a, b] = sample(rng, size(d, [4, 6, 8, 10, 12], [6, 8, 9, 10, 12, 15, 16], [12, 15, 18, 20, 24, 30, 36]), 2);
    const L = lcm(a, b);
    if (L === a * b || L === Math.max(a, b)) continue;
    const ctx = pick(rng, PACK_CONTEXTS)(a, b);
    const which = int(rng, 0, 1);
    const size1 = which === 0 ? a : b;
    const ans = L / size1;
    const other = L / (which === 0 ? b : a);
    const askTotal = d === 'hard' && chance(rng, 0.4);
    const finalAns = askTotal ? ans + other : ans;
    const q = askTotal ? `What is the smallest total number of ${ctx.it[0]} and ${ctx.it[1]} that should be bought?` : `What is the smallest number of ${ctx.it[which]} that should be bought?`;
    return {
      prompt: `${ctx.p} ${q}`,
      answer: num(finalAns),
      distractors: uniq([L, askTotal ? ans : other, a * b / size1, gcd(a, b), finalAns * 2, askTotal ? L * 2 / a : ans + other].filter((v) => Number.isInteger(v) && v > 0 && v !== finalAns).map((v) => num(v)), num(finalAns)),
      typed: { kind: 'number', value: finalAns },
      solution: [
        `The number of items must be a common multiple of ${a} and ${b}; the smallest is the LCM.`,
        `Multiples of ${Math.max(a, b)}: ${range(1, L / Math.max(a, b)).map((k) => k * Math.max(a, b)).join(', ')} → LCM = ${L}.`,
        `${ctx.it[0]}: $${L} \\div ${a} = ${L / a}$; ${ctx.it[1]}: $${L} \\div ${b} = ${L / b}$.`,
        askTotal ? `Total: $${L / a} + ${L / b} = ${finalAns}$` : `Answer: ${finalAns} ${ctx.it[which]}`,
      ].concat(askTotal ? [`Answer: ${finalAns}`] : []),
    };
  }
}, { title: 'LCM problem: number of packs', word: true });

export const generators = [
  fmListFactors, fmIdentify, fmCount, fmPuzzle,
  primesIdentify, primesFacts, primesTwoProps,
  pfWrite, pfValue, pfUse,
  hcfDirect, lcmDirect, hcfLcmIndex, hcfLcmReverse,
  hcfLcmProblems, hcfLcmTime, hcfLcmPacks,
];
