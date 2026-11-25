// Algebraic reasoning: counterexamples and algebraic proof (as single-answer questions).
import { pick, int, intExcept, size, chance, tnum, names, isPrime, shuffle, frac } from '../../core.js';
import { G, P, $ } from './lib.js';

/* ================================================================== */
/* alg-counterexample                                                  */
/* ================================================================== */

// Each statement: text, test(v) = true when v is a COUNTEREXAMPLE, candidate pool, value formatter.
const STATEMENTS = [
  { level: 1, text: 'When you double a number, the answer is always bigger than the number you started with.', pool: [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 12], test: (n) => 2 * n <= n, why: (n) => `$2 \\times ${n < 0 ? `(${tnum(n)})` : tnum(n)} = ${tnum(2 * n)}$, which is not bigger than $${tnum(n)}$.` },
  { level: 1, text: 'All prime numbers are odd.', pool: [2, 3, 5, 7, 11, 13, 17, 19, 23, 29], test: (n) => n % 2 === 0, why: () => '2 is a prime number (its only factors are 1 and 2) but it is even.' },
  { level: 1, text: 'Every multiple of 4 is also a multiple of 8.', pool: [8, 16, 24, 32, 40, 12, 20, 28, 36, 44], test: (n) => n % 8 !== 0, why: (n) => `${n} is a multiple of 4 ($4 \\times ${n / 4}$) but ${n} ÷ 8 is not a whole number.` },
  { level: 2, text: 'If $n$ is a whole number, then $2n + 1$ is always a prime number.', pool: [1, 2, 3, 5, 6, 8, 9, 4, 7, 10, 12, 13], test: (n) => !isPrime(2 * n + 1), why: (n) => `When $n = ${n}$, $2n + 1 = ${2 * n + 1}$, which is not prime (${2 * n + 1} = ${[3, 5, 7, 9, 11].find((p) => (2 * n + 1) % p === 0 && p < 2 * n + 1)} × ${(2 * n + 1) / [3, 5, 7, 9, 11].find((p) => (2 * n + 1) % p === 0 && p < 2 * n + 1)}).` },
  { level: 2, text: 'Dividing a number by 2 always makes it smaller.', pool: [-8, -6, -4, -2, 0, 2, 4, 6, 8, 10, 14, 20], test: (n) => n / 2 >= n, why: (n) => `$${tnum(n)} \\div 2 = ${tnum(n / 2)}$, which is not smaller than $${tnum(n)}$.` },
  { level: 2, text: 'If $n$ is a whole number, then $3n - 1$ is always even.', pool: [1, 3, 5, 7, 9, 2, 4, 6, 8, 10], test: (n) => (3 * n - 1) % 2 !== 0, why: (n) => `When $n = ${n}$, $3n - 1 = ${3 * n - 1}$, which is odd.` },
  { level: 2, text: 'The square of a number is always greater than the number.', pool: [frac(1, 2), 1, 0, 2, 3, 4, -2, -3, 5, frac(1, 4)], test: (n) => { const v = typeof n === 'number' ? n : n.value(); return v * v <= v; }, why: (n) => { const v = typeof n === 'number' ? n : n.value(); const t = typeof n === 'number' ? tnum(n) : n.tex(); const sq = typeof n === 'number' ? tnum(n * n) : n.mul(n).tex(); return `$${t}^{2} = ${sq}$, which is not greater than $${t}$.${v > 0 && v < 1 ? ' Squaring a number between 0 and 1 makes it smaller.' : ''}`; } },
  { level: 3, text: 'For every whole number $n$, $n^{2} + n + 11$ is a prime number.', pool: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], test: (n) => !isPrime(n * n + n + 11), why: (n) => `When $n = ${n}$: $${n}^{2} + ${n} + 11 = ${n * n + n + 11}$, which is not prime${(n * n + n + 11) % 11 === 0 ? ' (it is a multiple of 11)' : ''}.` },
  { level: 3, text: 'If $a > b$, then $a^{2} > b^{2}$.', pairs: true, pool: [[5, 2], [7, 3], [4, 1], [3, -1], [2, -5], [1, -4], [6, 0], [0, -3], [-1, -2], [-2, -6]], test: ([a, b]) => a * a <= b * b, why: ([a, b]) => `$${tnum(a)} > ${tnum(b)}$ but $${tnum(a)}^{2} = ${a * a}$ is not greater than $(${tnum(b)})^{2} = ${b * b}$.` },
  { level: 3, text: 'The sum of two prime numbers is always even.', pairs: true, pool: [[3, 5], [5, 7], [3, 11], [7, 13], [2, 3], [2, 5], [2, 11], [5, 13], [11, 17], [2, 7]], test: ([a, b]) => (a + b) % 2 === 1, why: ([a, b]) => `${a} and ${b} are both prime and $${a} + ${b} = ${a + b}$, which is odd. (2 is the only even prime.)` },
  { level: 3, text: 'The product of two numbers is always bigger than their sum.', pairs: true, pool: [[3, 4], [5, 6], [3, 7], [4, 4], [1, 5], [1, 8], [2, 2], [0, 6], [1, 3], [5, 3]], test: ([a, b]) => a * b <= a + b, why: ([a, b]) => `$${a} \\times ${b} = ${a * b}$ but $${a} + ${b} = ${a + b}$, so the product is not bigger.` },
  { level: 2, text: 'If a number ends in 6, it is a multiple of 6.', pool: [6, 36, 66, 96, 126, 16, 26, 46, 56, 76], test: (n) => n % 6 !== 0, why: (n) => `${n} ends in 6 but $${n} \\div 6$ is not a whole number.` },
];

const fmtV = (v) => (Array.isArray(v) ? `$a = ${tnum(v[0])}$ and $b = ${tnum(v[1])}$` : typeof v === 'number' ? `$${tnum(v)}$` : `$${v.tex()}$`);

export const counterNumber = G('alg-counter-number', 'alg-counterexample', (rng, d) => {
  const st = pick(rng, STATEMENTS.filter((s) => s.level <= size(d, 1, 2, 3) && s.level >= size(d, 1, 1, 2)));
  const name = names(rng, 1)[0];
  const bad = shuffle(rng, st.pool.filter((v) => st.test(v)));
  const good = shuffle(rng, st.pool.filter((v) => !st.test(v)));
  if (!bad.length || good.length < 3) throw new Error('pool');
  const ans = bad[0];
  const isPair = Boolean(st.pairs);
  const isPrimeStmt = st.text.includes('sum of two prime');
  return {
    prompt: `${name} says:<br>"${st.text}"<br>Which ${isPair ? (isPrimeStmt ? 'pair of primes' : 'pair of values') : 'value'} shows that ${name} is wrong?`,
    answer: fmtV(ans),
    distractors: good.slice(0, 4).map(fmtV),
    count: 4,
    solution: [
      `One example where the statement fails (a <b>counterexample</b>) is enough to show it is not always true.`,
      st.why(ans),
      `For the other options the statement does hold, so they don't disprove it.`,
      `Answer: ${fmtV(ans)}`,
    ],
  };
}, { title: 'Choose a counterexample' });

// Which statement is always true / never true (pick from 4).
const CLAIMS = [
  { s: '$2n$ is even', t: 'always', r: '$2n$ is 2 times a whole number, so it is always even.' },
  { s: '$2n + 1$ is odd', t: 'always', r: '$2n$ is even, and one more than an even number is odd.' },
  { s: '$n + 3 \\gt n$', t: 'always', r: 'Adding 3 always makes a number bigger.' },
  { s: '$3n$ is a multiple of 3', t: 'always', r: '$3n$ is 3 times a whole number.' },
  { s: '$n^{2} \\geq 0$', t: 'always', r: 'A square is never negative: positive × positive and negative × negative are both positive.' },
  { s: '$n(n + 1)$ is even', t: 'always', r: 'One of two consecutive integers is always even, so their product is even.' },
  { s: '$(n + 1)^{2} \\gt n^{2}$', t: 'sometimes', r: 'True for $n = 2$ ($9 \\gt 4$) but false for $n = -3$ ($4 \\lt 9$).' },
  { s: '$n^{2} \\gt n$', t: 'sometimes', r: 'True for $n = 3$ ($9 \\gt 3$) but false for $n = 1$ ($1 = 1$).' },
  { s: '$n$ is a prime number', t: 'sometimes', r: 'True for $n = 5$, false for $n = 4$.' },
  { s: '$n^{2} + 1$ is even', t: 'sometimes', r: 'True for $n = 3$ (10), false for $n = 2$ (5).' },
  { s: '$2n$ is a multiple of 4', t: 'sometimes', r: 'True for $n = 2$ (4), false for $n = 3$ (6).' },
  { s: '$\\frac{n}{2}$ is a whole number', t: 'sometimes', r: 'True for even $n$, false for odd $n$.' },
  { s: '$n + 1$ is odd', t: 'sometimes', r: 'True for $n = 2$, false for $n = 3$.' },
  { s: '$2n + 1$ is even', t: 'never', r: '$2n$ is even, so $2n + 1$ is always odd — never even.' },
  { s: '$n^{2} \\lt 0$', t: 'never', r: 'A square can never be negative.' },
  { s: '$2n + 4$ is odd', t: 'never', r: '$2n + 4 = 2(n + 2)$, which is always even.' },
  { s: '$n + n$ is odd', t: 'never', r: '$n + n = 2n$, which is always even.' },
  { s: '$4n + 2$ is a multiple of 4', t: 'never', r: '$4n + 2$ is always 2 more than a multiple of 4.' },
  { s: '$n - n = 1$', t: 'never', r: '$n - n$ is always 0.' },
];

export const counterAlways = G('alg-counter-always', 'alg-counterexample', (rng, d) => {
  const want = pick(rng, size(d, ['always', 'never'], ['always', 'never', 'sometimes'], ['always', 'never', 'sometimes']));
  const pool = CLAIMS.filter((c) => !c.s.includes('(n + 1)^{2}') || d !== 'easy');
  const ans = pick(rng, pool.filter((c) => c.t === want));
  const others = shuffle(rng, pool.filter((c) => c.t !== want)).slice(0, 3);
  const why = {
    always: 'Check it for a few values, including 0, 1 and negatives, and think about why it must work.',
    never: 'A "never true" statement fails for every integer, so look for the reason it can never work.',
    sometimes: 'It works for some integers but not others, so find one value where it is true and one where it is false.',
  }[want];
  return {
    prompt: `$n$ is an integer. Here are four statements:<br>${shuffle(rng, [ans, ...others]).map((c) => c.s).join(' &nbsp;&nbsp;&nbsp; ')}<br>Which statement is <b>${want}</b> true?`,
    answer: ans.s,
    distractors: others.map((c) => c.s),
    count: 4,
    solution: [
      why,
      `${ans.s}: ${ans.r}`,
      ...others.map((c) => `${c.s} is ${c.t} true: ${c.r}`),
      `Answer: ${ans.s}`,
    ],
  };
}, { title: 'Always, sometimes or never true' });

export const counterAlgebra = G('alg-counter-algebra', 'alg-counterexample', (rng, d) => {
  const name = names(rng, 1)[0];
  const claims = [
    { text: '$(a + b)^{2} = a^{2} + b^{2}$ for all values of $a$ and $b$.', fails: ([a, b]) => (a + b) ** 2 !== a * a + b * b, why: ([a, b]) => `$(${tnum(a)} + ${b < 0 ? `(${tnum(b)})` : tnum(b)})^{2} = ${(a + b) ** 2}$ but $${a < 0 ? `(${tnum(a)})` : tnum(a)}^{2} + ${b < 0 ? `(${tnum(b)})` : tnum(b)}^{2} = ${a * a + b * b}$.` },
    { text: '$\\sqrt{a + b} = \\sqrt{a} + \\sqrt{b}$ for all positive $a$ and $b$.', squares: true, fails: ([a, b]) => Math.abs(Math.sqrt(a + b) - Math.sqrt(a) - Math.sqrt(b)) > 1e-9, why: ([a, b]) => `$\\sqrt{${a} + ${b}} = \\sqrt{${a + b}}$ but $\\sqrt{${a}} + \\sqrt{${b}} = ${Math.sqrt(a) + Math.sqrt(b)}$.` },
  ];
  const c = pick(rng, d === 'easy' ? claims.slice(0, 1) : claims.slice(0, 2));
  const pool = c.squares ? [[9, 16], [4, 9], [16, 9], [25, 144], [0, 4], [0, 9], [0, 25], [36, 64]] : [[3, 4], [2, 5], [1, 1], [0, 5], [4, 0], [0, -3], [-2, 0], [2, -3]];
  const bad = shuffle(rng, pool.filter((p) => c.fails(p)));
  const good = shuffle(rng, pool.filter((p) => !c.fails(p)));
  if (!bad.length || good.length < 3) throw new Error('');
  const fmt = ([a, b]) => `$a = ${tnum(a)}$ and $b = ${tnum(b)}$`;
  return {
    prompt: `${name} says ${c.text}<br>Which pair of values shows that ${name} is wrong?`,
    answer: fmt(bad[0]),
    distractors: good.slice(0, 3).map(fmt),
    count: 4,
    solution: [`Try each pair. A counterexample must make the two sides <b>different</b>.`, c.why(bad[0]), `In the other options one of the values is 0, so both sides happen to be equal.`, `Answer: ${fmt(bad[0])}`],
  };
}, { title: 'Counterexamples to algebraic claims' });

/* ================================================================== */
/* alg-proof                                                           */
/* ================================================================== */

// Each: expression to simplify, simplified form, conclusion; wrong simplifications and wrong conclusions.
function proofFacts(rng, d) {
  const a = int(rng, 2, 6);
  const list = [
    { lvl: 1, intro: 'Three consecutive integers can be written as $n$, $n + 1$ and $n + 2$.', expr: 'n + (n + 1) + (n + 2)', simp: '3n + 3 = 3(n + 1)', concl: 'the sum of three consecutive integers is always a multiple of 3', wrongS: ['3n + 2', '3n', 'n^{3} + 3'], wrongC: ['the sum of three consecutive integers is always even', 'the sum of three consecutive integers is always odd', 'the sum of three consecutive integers is always a multiple of 6'] },
    { lvl: 1, intro: 'Two consecutive integers can be written as $n$ and $n + 1$.', expr: 'n + (n + 1)', simp: '2n + 1', concl: 'the sum of two consecutive integers is always odd', wrongS: ['2n', '2n + 2', 'n^{2} + 1'], wrongC: ['the sum of two consecutive integers is always even', 'the sum of two consecutive integers is always a multiple of 3', 'the sum of two consecutive integers is always prime'] },
    { lvl: 2, intro: 'Five consecutive integers can be written as $n$, $n + 1$, $n + 2$, $n + 3$ and $n + 4$.', expr: 'n + (n + 1) + (n + 2) + (n + 3) + (n + 4)', simp: '5n + 10 = 5(n + 2)', concl: 'the sum of five consecutive integers is always a multiple of 5', wrongS: ['5n + 4', '5n + 5', '5n'], wrongC: ['the sum of five consecutive integers is always even', 'the sum of five consecutive integers is always odd', 'the sum of five consecutive integers is always a multiple of 10'] },
    { lvl: 2, intro: 'Two consecutive odd numbers can be written as $2n + 1$ and $2n + 3$.', expr: '(2n + 1) + (2n + 3)', simp: '4n + 4 = 4(n + 1)', concl: 'the sum of two consecutive odd numbers is always a multiple of 4', wrongS: ['4n + 3', '4n + 2', '2n + 4'], wrongC: ['the sum of two consecutive odd numbers is always odd', 'the sum of two consecutive odd numbers is always a multiple of 8', 'the sum of two consecutive odd numbers is always a multiple of 3'] },
    { lvl: 2, intro: 'Consider the expression below, where $n$ is an integer.', expr: '(n + 1)^{2} - n^{2}', simp: '2n + 1', concl: 'the difference between the squares of consecutive integers is always odd', wrongS: ['1', '2n', 'n^{2} + 2n'], wrongC: ['the difference between the squares of consecutive integers is always 1', 'the difference between the squares of consecutive integers is always even', 'the difference between the squares of consecutive integers is always a square number'] },
    { lvl: 2, intro: `Consider the expression below, where $n$ is an integer.`, expr: `(n + ${a})^{2} - (n - ${a})^{2}`, simp: `${4 * a}n`, concl: `$(n + ${a})^{2} - (n - ${a})^{2}$ is always a multiple of ${4 * a}`, wrongS: ['0', `${2 * a}n`, `${2 * a * a}`], wrongC: [`$(n + ${a})^{2} - (n - ${a})^{2}$ is always 0`, `$(n + ${a})^{2} - (n - ${a})^{2}$ is always a multiple of ${2 * a * a}`, `$(n + ${a})^{2} - (n - ${a})^{2}$ is always odd`] },
    { lvl: 3, intro: 'Two consecutive odd numbers can be written as $2n - 1$ and $2n + 1$.', expr: '(2n + 1)^{2} - (2n - 1)^{2}', simp: '8n', concl: 'the difference between the squares of two consecutive odd numbers is always a multiple of 8', wrongS: ['2', '4n', '8n + 2'], wrongC: ['the difference between the squares of two consecutive odd numbers is always 2', 'the difference between the squares of two consecutive odd numbers is always odd', 'the difference between the squares of two consecutive odd numbers is always a multiple of 16'] },
    { lvl: 3, intro: 'Consider the expression below, where $n$ is an integer.', expr: 'n(n + 2) + 1', simp: 'n^{2} + 2n + 1 = (n + 1)^{2}', concl: 'one more than the product of two integers that differ by 2 is always a square number', wrongS: ['n^{2} + 3', 'n^{2} + 2n', '2n + 3'], wrongC: ['one more than the product of two integers that differ by 2 is always even', 'one more than the product of two integers that differ by 2 is always prime', 'one more than the product of two integers that differ by 2 is always a multiple of 3'] },
    { lvl: 3, intro: 'The $n$th and $(n+1)$th triangular numbers are $\\frac{n(n + 1)}{2}$ and $\\frac{(n + 1)(n + 2)}{2}$.', expr: '\\frac{n(n + 1)}{2} + \\frac{(n + 1)(n + 2)}{2}', simp: '\\frac{2n^{2} + 4n + 2}{2} = (n + 1)^{2}', concl: 'the sum of two consecutive triangular numbers is always a square number', wrongS: ['n^{2} + 2n', '\\frac{(n + 1)^{2}}{2}', 'n^{2} + 3n + 2'], wrongC: ['the sum of two consecutive triangular numbers is always even', 'the sum of two consecutive triangular numbers is always a triangular number', 'the sum of two consecutive triangular numbers is always odd'] },
    { lvl: 3, intro: 'An even number can be written as $2a$ and an odd number as $2b + 1$.', expr: '2a(2b + 1)', simp: '4ab + 2a = 2(2ab + a)', concl: 'an even number multiplied by an odd number is always even', wrongS: ['4ab + 1', '4ab + 2a + 1', '2ab + 1'], wrongC: ['an even number multiplied by an odd number is always odd', 'an even number multiplied by an odd number is always a multiple of 4', 'an even number multiplied by an odd number is always a square number'] },
    { lvl: 3, intro: 'Two odd numbers can be written as $2a + 1$ and $2b + 1$.', expr: '(2a + 1)(2b + 1)', simp: '4ab + 2a + 2b + 1 = 2(2ab + a + b) + 1', concl: 'the product of two odd numbers is always odd', wrongS: ['4ab + 1', '4ab + 2', '2ab + 2a + 2b + 1'], wrongC: ['the product of two odd numbers is always even', 'the product of two odd numbers is always a multiple of 4', 'the product of two odd numbers is always prime'] },
  ];
  // A "show it is a square number" one with random numbers: k + (3x + 1)² − 2x(4x − 3) style
  const p = int(rng, 2, 4); const q = int(rng, 1, 5); const m = int(rng, 2, 7);
  // (p x + q)² − (p² − 1) x² + c x + k = (x + m)²: expand (px+q)² = p²x² + 2pq x + q²; subtract (p² − 1)x² gives x² + 2pq x + q²
  // need 2pq x + extra = 2m x  → extra x-coef = 2m − 2pq ; constant k = m² − q²
  const ex = 2 * m - 2 * p * q; const k = m * m - q * q;
  if (k > 0) {
    list.push({ lvl: 3, intro: '$x$ is an integer.', expr: `${k} + (${p}x + ${q})^{2} - ${p * p - 1}x^{2}${ex === 0 ? '' : ` ${ex < 0 ? '-' : '+'} ${Math.abs(ex) === 1 ? '' : Math.abs(ex)}x`}`, simp: `x^{2} + ${2 * m}x + ${m * m} = (x + ${m})^{2}`, concl: 'the expression is always a square number', wrongS: [`x^{2} + ${2 * p * q}x + ${q * q + k}`, `${p * p}x^{2} + ${m * m}`, `(x + ${m * m})^{2}`], wrongC: ['the expression is always even', 'the expression is always prime', `the expression is always a multiple of ${m}`] });
  }
  return list.filter((f) => f.lvl <= size(d, 1, 2, 3) && f.lvl >= size(d, 1, 1, 2));
}

/** Replace the letter n by L inside $…$ maths only. */
function swapLetter(s, L) {
  if (L === 'n') return s;
  return s.replace(/\$([^$]*)\$/g, (m, t) => `$${t.replace(/(?<![a-z\\])n(?![a-z])/g, L)}$`);
}
const swapMath = (s, L) => (L === 'n' ? s : s.replace(/(?<![a-z\\])n(?![a-z])/g, L));

export const proofSimplifyShow = G('alg-proof-simplify-show', 'alg-proof', (rng, d) => {
  const L = pick(rng, ['n', 'n', 'm', 'k', 'p']);
  const f0 = pick(rng, proofFacts(rng, d));
  const f = { ...f0, intro: swapLetter(f0.intro, L), expr: swapMath(f0.expr, L), simp: swapMath(f0.simp, L), concl: swapLetter(f0.concl, L), wrongS: f0.wrongS.map((t) => swapMath(t, L)), wrongC: f0.wrongC.map((t) => swapLetter(t, L)) };
  const last = f.simp.split(' = ').pop();
  const ans = `$${f.simp}$, so ${f.concl}`;
  const dis = [
    ...f.wrongC.slice(0, 2).map((c) => `$${f.simp}$, so ${c}`),
    `$${f.wrongS[0]}$, so ${f.wrongC[0]}`,
    `$${f.wrongS[1]}$, so ${f.wrongC[2]}`,
    `$${f.wrongS[2]}$, so ${f.concl}`,
  ];
  return {
    prompt: `${f.intro}<br>Simplify &nbsp;$${f.expr}$.<br>What does this show?`,
    answer: ans,
    distractors: dis,
    solution: [
      `Expand any brackets and collect like terms: $${f.expr} = ${f.simp}$.`,
      `$${last}$ shows the result is always ${f.concl.replace(/^.* always /, '')}, whatever integer you choose.`,
      `This is a proof because it works for every value of the letter(s), not just a few examples.`,
      `Answer: ${ans}`,
    ],
  };
}, { title: 'Simplify an expression to prove a fact' });

export const proofRepresent = G('alg-proof-represent', 'alg-proof', (rng, d) => {
  const items = [
    { q: 'Which expression is always <b>even</b>?', ans: '2n', wrong: ['2n + 1', 'n + 2', 'n^{2}', '3n'] },
    { q: 'Which expression is always <b>odd</b>?', ans: '2n + 1', wrong: ['n + 1', '2n', '3n + 1', 'n^{2} + 1'] },
    { q: 'Which expression is always a <b>multiple of 3</b>?', ans: '3n + 6', wrong: ['3n + 1', 'n + 3', 'n^{3}', '6n + 2'] },
    { q: 'Which expression is always <b>odd</b>?', ans: '2n - 1', wrong: ['n - 1', '2n + 2', 'n^{2} - 1', '4n'] },
    { q: 'Which expression is always <b>even</b>?', ans: 'n(n + 1)', wrong: ['n + 1', 'n^{2} + 1', '2n + 1', 'n(n + 2)'] },
    { q: 'Which expression is always a <b>multiple of 4</b>?', ans: '4n + 8', wrong: ['2n + 4', 'n + 4', '4n + 2', '8n + 6'] },
    { q: 'Which expression is always a <b>square number</b>?', ans: 'n^{2} + 2n + 1', wrong: ['n^{2} + 1', 'n^{2} + 2n', '2n^{2}', 'n^{2} + n'] },
    { q: 'Which expression represents the sum of <b>three consecutive integers</b>?', ans: '3n + 3', wrong: ['3n', 'n^{3}', '3n + 1', 'n + 3'] },
    { q: 'Which expression represents the product of <b>two consecutive even numbers</b>?', ans: '2n(2n + 2)', wrong: ['2n(2n + 1)', 'n(n + 2)', '2n + 2n + 2', '(2n + 1)(2n + 3)'] },
    { q: 'Which expression represents <b>any odd number squared</b>?', ans: '(2n + 1)^{2}', wrong: ['2n^{2} + 1', '(2n)^{2}', '2n + 1^{2}', '(n + 1)^{2}'] },
    { q: 'Which expression represents the sum of an <b>even number and an odd number</b>?', ans: '2a + 2b + 1', wrong: ['2a + 2b', '2n + 2n + 1', '2a + 1 + 2b + 1', 'a + b + 1'] },
    { q: 'Which expression is always <b>1 more than a multiple of 5</b>?', ans: '5n + 1', wrong: ['5(n + 1)', 'n + 5', '5n - 1', '6n'] },
  ];
  const pool = size(d, items.slice(0, 6), items.slice(0, 10), items.slice(4));
  const L = pick(rng, ['n', 'n', 'm', 'k', 'p', 'x']);
  const it0 = pick(rng, pool);
  const it = { ...it0, ans: swapMath(it0.ans, L), wrong: it0.wrong.map((t) => swapMath(t, L)) };
  const letters = it.ans.includes('a') ? '$a$ and $b$ are integers' : `$${L}$ is an integer`;
  return {
    prompt: `${letters}.<br>${it.q}`,
    answer: $(it.ans),
    distractors: it.wrong.map($),
    count: 5,
    solution: [
      `Even numbers are $2 \\times$ (an integer); odd numbers are one more or one less than an even number; $k \\times$ (an integer) is a multiple of $k$.`,
      `Test the options with a couple of values of the letter${it.ans.includes('a') ? 's' : ''}: a single failure rules an option out. Then check that $${it.ans}$ must work for every value.`,
      `Answer: $${it.ans}$`,
    ],
  };
}, { title: 'Algebraic representations of number facts' });

export const proofPositive = G('alg-proof-positive', 'alg-proof', (rng, d) => {
  const p = intExcept(rng, -7, 7, [0]); const q = int(rng, 1, size(d, 9, 12, 20));
  const b = 2 * p; const c = p * p + q;
  const ans = `(x ${p < 0 ? '-' : '+'} ${Math.abs(p)})^{2} + ${q}`;
  const dis = [
    `(x ${p < 0 ? '-' : '+'} ${Math.abs(p)})^{2} + ${c}`,
    `(x ${p < 0 ? '+' : '-'} ${Math.abs(p)})^{2} + ${q}`,
    `(x ${b < 0 ? '-' : '+'} ${Math.abs(b)})^{2} + ${c - b * b}`.replace('+ -', '- '),
    `(x ${p < 0 ? '-' : '+'} ${Math.abs(p)})^{2} + ${c + p * p}`,
    `x(x ${b < 0 ? '-' : '+'} ${Math.abs(b)}) + ${c}`,
  ];
  const ask = d === 'hard' ? 'min' : 'form';
  if (ask === 'min') {
    return {
      prompt: `Prove that &nbsp;$${P([1, b, c])}$&nbsp; is always positive.<br>What is the smallest value it can take?`,
      answer: $(tnum(q)),
      distractors: [c, 0, p * p, -q, q + p * p, 1].filter((w) => w !== q).map((w) => $(tnum(w))),
      typed: { kind: 'number', value: q },
      solution: [
        `Complete the square: $${P([1, b, c])} = ${ans}$`,
        `$(x ${p < 0 ? '-' : '+'} ${Math.abs(p)})^{2} \\geq 0$ for every $x$, so the expression is always at least ${q}, which is positive.`,
        `The smallest value, ${q}, happens when $x = ${tnum(-p)}$.`,
        `Answer: $${q}$`,
      ],
    };
  }
  return {
    prompt: `Which of these shows that &nbsp;$${P([1, b, c])}$&nbsp; is always positive?`,
    answer: `$${P([1, b, c])} = ${ans}$, and a square is never negative`,
    distractors: dis.filter((t) => !/[+-] 0$|\(x [+-] 0\)/.test(t)).map((t) => `$${P([1, b, c])} = ${t}$, and a square is never negative`).concat([`$${P([1, b, c])}$ is positive when $x = 1$, $x = 2$ and $x = 3$`]),
    solution: [
      `Complete the square: halve $${tnum(b)}$ to get $${tnum(p)}$, so $${P([1, b, c])} = (x ${p < 0 ? '-' : '+'} ${Math.abs(p)})^{2} - ${p * p} + ${c} = ${ans}$.`,
      `A square is never negative, so the expression is at least ${q} > 0 for every $x$.`,
      `Checking a few values is <b>not</b> a proof — it must work for all $x$.`,
      `Answer: $${ans}$`,
    ],
  };
}, { title: 'Prove a quadratic is always positive' });

export const generators = [
  counterNumber, counterAlways, counterAlgebra,
  proofSimplifyShow, proofRepresent, proofPositive,
];

void [chance];
