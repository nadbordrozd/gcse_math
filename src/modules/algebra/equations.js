// Linear equations: one/two-step, brackets and unknowns on both sides, fractions, forming equations.
import { pick, int, intExcept, size, chance, tnum, terms, shuffle, names, money, frac, Frac, gcd as gcdInt } from '../../core.js';
import { G, P, br, tf, $, rat, tv } from './lib.js';

const kx = (c, v = 'x') => terms([[c, v]]);
const xeq = (v, x = 'x') => `$${x} = ${tv(v)}$`;
const val = (v) => (v instanceof Frac ? v.value() : v);
/** Wrong-answer list -> distinct "x = …" strings excluding the right one. */
function toRat(w) {
  if (w instanceof Frac) return w;
  if (typeof w !== 'number' || !Number.isFinite(w)) return null;
  if (Number.isInteger(w)) return w;
  for (let dd = 2; dd <= 60; dd += 1) if (Math.abs(w * dd - Math.round(w * dd)) < 1e-9) return rat(Math.round(w * dd), dd);
  return null;
}
function eqDistractors(right, wrongs, x = 'x') {
  const r = xeq(right, x);
  let list = wrongs.map(toRat).filter((w) => w !== null);
  if (typeof right === 'number') {
    // An integer answer among fractional distractors is a giveaway: lead with whole-number slips.
    const ints = list.filter((w) => typeof w === 'number');
    const fracs = list.filter((w) => typeof w !== 'number');
    list = [...ints, ...fracs.slice(0, 1), -right, right + 1, right - 1, right + 2, ...fracs.slice(1)];
  }
  return [...new Set(list.map((w) => xeq(w, x)))].filter((t) => t !== r);
}
/** Run a computation that may divide by zero; null on failure. */
const safe = (fn) => { try { return fn(); } catch { return null; } };
const q = (n, dd) => (dd === 0 || !Number.isFinite(n) ? null : Number.isInteger(n) && Number.isInteger(dd) ? rat(n, dd) : n / dd);

/**
 * Steps to solve a x + b = c x + d (a ≠ c). Returns [steps, solution].
 * Keeps the unknown on the side with the larger coefficient, as students are taught.
 */
export function linearSteps(a, b, c, d, x = 'x') {
  const steps = [];
  let A = a; let B = b; let C = c; let D = d;
  if (c > a) { [A, B, C, D] = [c, d, a, b]; steps.push(`Swap the sides so the larger number of $${x}$'s is on the left: $${P([A, B], x)} = ${P([C, D], x)}$`); }
  if (C !== 0) {
    steps.push(`${C > 0 ? 'Subtract' : 'Add'} $${kx(Math.abs(C), x)}$ ${C > 0 ? 'from' : 'to'} both sides: $${P([A - C, B], x)} = ${tnum(D)}$`);
  }
  const K = A - C;
  if (B !== 0) steps.push(`${B > 0 ? 'Subtract' : 'Add'} $${tnum(Math.abs(B))}$ ${B > 0 ? 'from' : 'to'} both sides: $${kx(K, x)} = ${tnum(D - B)}$`);
  const sol = q(D - B, K);
  if (K !== 1) steps.push(`Divide both sides by $${tnum(K)}$: $${x} = ${tf(tnum(D - B), tnum(K)).replace(/\\frac\{(-?\d+)\}\{1\}/, '$1')}${(D - B) % K === 0 ? '' : ''} = ${tv(sol)}$`.replace(/= (-?\d+) = \1\$/, '= $1$'));
  return [steps, sol];
}

/* ================================================================== */
/* alg-solve-one-two-step                                              */
/* ================================================================== */

export const solveOneStep = G('alg-solve-one-step', 'alg-solve-one-two-step', (rng, d) => {
  const x = pick(rng, ['x', 'x', 'y', 'a', 'n', 'p', 'm']);
  const form = pick(rng, ['add', 'sub', 'mul', 'div']);
  const v = d === 'easy' ? int(rng, 2, 12) : d === 'medium' ? intExcept(rng, -12, 15, [0, 1]) : intExcept(rng, -20, 20, [0, 1]);
  const a = int(rng, 2, size(d, 9, 12, 15));
  let eq; let ans = v; let wrong; let step;
  if (form === 'add') { const c = v + a; eq = `${x} + ${a} = ${tnum(c)}`; wrong = [c + a, a - c, c, -v]; step = `Subtract ${a} from both sides: $${x} = ${tnum(c)} - ${a}$`; }
  else if (form === 'sub') { const c = v - a; eq = `${x} - ${a} = ${tnum(c)}`; wrong = [c - a, a - c, c, -v]; step = `Add ${a} to both sides: $${x} = ${tnum(c)} + ${a}$`; }
  else if (form === 'mul') {
    if (d === 'hard' && chance(rng, 0.5)) { const c = pick(rng, [3, 5, 7, 9, 11, 13]); const m = pick(rng, [2, 4]); ans = q(c, m); eq = `${m}${x} = ${c}`; wrong = [c - m, c * m, q(m, c), Math.floor(c / m)]; step = `Divide both sides by ${m}: $${x} = ${tf(c, m)}$`; }
    else { const c = v * a; eq = `${a}${x} = ${tnum(c)}`; wrong = [c - a, c * a, q(a, c), c + a]; step = `Divide both sides by ${a}: $${x} = ${tnum(c)} \\div ${a}$`; }
  } else {
    const c = v; ans = v * a; eq = `${tf(x, a)} = ${tnum(c)}`; wrong = [q(c, a), c + a, c - a, -ans]; step = `Multiply both sides by ${a}: $${x} = ${tnum(c)} \\times ${a}$`;
  }
  return {
    prompt: `Solve &nbsp; $${eq}$`,
    answer: xeq(ans, x),
    distractors: eqDistractors(ans, [...wrong, val(ans) + 1, val(ans) - 1], x),
    typed: { kind: 'number', value: ans },
    solution: [`Do the inverse (opposite) operation to both sides to get $${x}$ on its own.`, step, `Answer: ${xeq(ans, x)}`],
  };
}, { title: 'Solve a one-step equation' });

export const solveTwoStep = G('alg-solve-two-step', 'alg-solve-one-two-step', (rng, d) => {
  const x = pick(rng, ['x', 'x', 'y', 'a', 'n', 't']);
  const form = pick(rng, size(d, ['ax+b', 'ax-b', 'x/a+b'], ['ax+b', 'ax-b', 'x/a-b', '(x+b)/a', 'b-ax'], ['b-ax', 'ax+b', 'x/a+b', '(x+b)/a']));
  const a = int(rng, 2, size(d, 6, 9, 9));
  const b = int(rng, 1, size(d, 12, 20, 25));
  let v = d === 'easy' ? int(rng, 1, 10) : intExcept(rng, -10, 12, [0]);
  if (d === 'hard' && form === 'ax+b' && chance(rng, 0.6)) v = q(int(rng, 1, 15) * 2 + 1, 2);
  let eq; let wrong; let steps; let ans = v;
  if (form === 'ax+b') {
    const c = val(v) * a + b;
    if (!Number.isInteger(c)) throw new Error('');
    eq = `${a}${x} + ${b} = ${tnum(c)}`;
    wrong = [q(c + b, a), q(c, a) instanceof Frac ? null : c / a - b, (c - b) * a, c - b, q(c - b, a + 0) === v ? null : 0];
    steps = [`Subtract ${b} from both sides: $${a}${x} = ${tnum(c - b)}$`, `Divide both sides by ${a}: $${x} = ${tv(v)}$`];
  } else if (form === 'ax-b') {
    const c = v * a - b;
    eq = `${a}${x} - ${b} = ${tnum(c)}`;
    wrong = [q(c - b, a), (c + b) * a, c + b, q(c, a) instanceof Frac ? null : c / a + b];
    steps = [`Add ${b} to both sides: $${a}${x} = ${tnum(c + b)}$`, `Divide both sides by ${a}: $${x} = ${tnum(v)}$`];
  } else if (form === 'x/a+b' || form === 'x/a-b') {
    const s = form === 'x/a+b' ? 1 : -1;
    const c = v; ans = (c - s * b) * a;
    eq = `${tf(x, a)} ${s > 0 ? '+' : '-'} ${b} = ${tnum(c)}`;
    wrong = [(c + s * b) * a, c * a - s * b, q(c - s * b, a), c - s * b];
    steps = [`${s > 0 ? 'Subtract' : 'Add'} ${b} ${s > 0 ? 'from' : 'to'} both sides: $${tf(x, a)} = ${tnum(c - s * b)}$`, `Multiply both sides by ${a}: $${x} = ${tnum(ans)}$`];
  } else if (form === '(x+b)/a') {
    const c = v; ans = c * a - b;
    eq = `${tf(`${x} + ${b}`, a)} = ${tnum(c)}`;
    wrong = [c * a + b, c - b, q(c - b, 1) === ans ? null : (c - b) * a, q(c, a)];
    steps = [`Multiply both sides by ${a}: $${x} + ${b} = ${tnum(c * a)}$`, `Subtract ${b} from both sides: $${x} = ${tnum(ans)}$`];
  } else {
    // b − a x = c
    const c = b - a * v;
    eq = `${b} - ${a}${x} = ${tnum(c)}`;
    wrong = [-v, q(c - b, a) === v ? null : q(b + c, a), q(c + b, -a), q(c - b, -a) === v ? null : 0];
    steps = [`Subtract ${b} from both sides: $-${a}${x} = ${tnum(c - b)}$`, `Divide both sides by $-${a}$: $${x} = ${tnum(v)}$ (dividing by a negative changes the sign)`];
  }
  return {
    prompt: `Solve &nbsp; $${eq}$`,
    answer: xeq(ans, x),
    distractors: eqDistractors(ans, [...wrong, val(ans) + 1, val(ans) - 1, -val(ans) || 3], x),
    typed: { kind: 'number', value: ans },
    hint: 'Undo the operations in reverse order: deal with adding/subtracting first, then multiplying/dividing.',
    solution: [`Undo the operations one at a time, doing the same to both sides.`, ...steps, `Answer: ${xeq(ans, x)}`],
  };
}, { title: 'Solve a two-step equation' });

// "Think of a number" and function machines.
const THINK = [
  (a, b, n) => ({ text: `I think of a number. I multiply it by ${a} and then add ${b}. The answer is ${n * a + b}. What number did I think of?`, a, b, op: 'mul-add', out: n * a + b }),
  (a, b, n, w) => ({ text: `${w} says: "I think of a number, multiply it by ${a}, then subtract ${b}. My answer is ${n * a - b}." What was ${w}'s number?`, a, b, op: 'mul-sub', out: n * a - b }),
  (a, b, n) => ({ text: `I think of a number. I add ${b} to it and then multiply the result by ${a}. I get ${(n + b) * a}. What was my number?`, a, b, op: 'add-mul', out: (n + b) * a }),
  (a, b, n) => ({ text: `I think of a number. I subtract ${b} from it and then multiply by ${a}. The answer is ${(n - b) * a}. Find my number.`, a, b, op: 'sub-mul', out: (n - b) * a }),
  (a, b, n) => ({ text: `A number is doubled and then ${b} is added. The result is ${2 * n + b}. What is the number?`, a: 2, b, op: 'mul-add', out: 2 * n + b }),
  (a, b, n) => ({ text: `A number is trebled and then ${b} is taken away. The result is ${3 * n - b}. What is the number?`, a: 3, b, op: 'mul-sub', out: 3 * n - b }),
  (a, b, n) => ({ text: `Here is a function machine:<br><b>Input</b> → [ × ${a} ] → [ + ${b} ] → <b>Output</b><br>The output is ${n * a + b}. What is the input?`, a, b, op: 'mul-add', out: n * a + b }),
  (a, b, n) => ({ text: `Here is a function machine:<br><b>Input</b> → [ − ${b} ] → [ × ${a} ] → <b>Output</b><br>The output is ${(n - b) * a}. Work out the input.`, a, b, op: 'sub-mul', out: (n - b) * a }),
  (a, b, n) => ({ text: `Here is a function machine:<br><b>Input</b> → [ + ${b} ] → [ × ${a} ] → <b>Output</b><br>The output is ${(n + b) * a}. What was the input?`, a, b, op: 'add-mul', out: (n + b) * a }),
  (a, b, n) => ({ text: `Here is a function machine:<br><b>Input</b> → [ × ${a} ] → [ − ${b} ] → <b>Output</b><br>The output is ${n * a - b}. Find the input.`, a, b, op: 'mul-sub', out: n * a - b }),
  (a, b, n) => ({ text: `Half of a number, plus ${b}, is ${n + b}. What is the number?`, a: 2, b, op: 'div-add', out: n + b, n2: 2 * n }),
  (a, b, n) => ({ text: `When ${b} is added to a number and the total is divided by ${a}, the answer is ${n}. What is the number?`, a, b, op: 'add-div', out: n, n2: n * a - b }),
  (a, b, n) => ({ text: `I think of a number, multiply it by ${a} and add ${b}. I get the same answer if I multiply it by ${a + 2} and subtract ${2 * n - b}. What is my number?`, a, b, op: 'both', out: 0, n2: n }),
];

export const solveThinkNumber = G('alg-solve-think-of-number', 'alg-solve-one-two-step', (rng, d) => {
  const a = int(rng, 2, size(d, 5, 8, 9)); const b = int(rng, 1, size(d, 10, 15, 20));
  let n = int(rng, 2, size(d, 12, 20, 25));
  const idx = int(rng, 0, THINK.length - 1);
  const who = names(rng, 1)[0];
  if (idx === 12 && 2 * n - b <= 0) n = b + int(rng, 1, 5);
  const t = THINK[idx](a, b, n, who);
  const ans = t.n2 ?? n;
  const steps = {
    'mul-add': [`Work backwards: undo "+ ${t.b}" by subtracting: $${t.out} - ${t.b} = ${t.out - t.b}$`, `Undo "× ${t.a}" by dividing: $${t.out - t.b} \\div ${t.a} = ${ans}$`],
    'mul-sub': [`Work backwards: undo "− ${t.b}" by adding: $${t.out} + ${t.b} = ${t.out + t.b}$`, `Undo "× ${t.a}" by dividing: $${t.out + t.b} \\div ${t.a} = ${ans}$`],
    'add-mul': [`Work backwards: undo "× ${t.a}" first: $${t.out} \\div ${t.a} = ${t.out / t.a}$`, `Then undo "+ ${t.b}": $${t.out / t.a} - ${t.b} = ${ans}$`],
    'sub-mul': [`Work backwards: undo "× ${t.a}" first: $${t.out} \\div ${t.a} = ${t.out / t.a}$`, `Then undo "− ${t.b}": $${t.out / t.a} + ${t.b} = ${ans}$`],
    'div-add': [`Write it as an equation: $${tf('n', 2)} + ${t.b} = ${t.out}$`, `Subtract ${t.b}: $${tf('n', 2)} = ${t.out - t.b}$, then multiply by 2: $n = ${ans}$`],
    'add-div': [`Write it as an equation: $${tf(`n + ${t.b}`, t.a)} = ${t.out}$`, `Multiply by ${t.a}: $n + ${t.b} = ${t.out * t.a}$, so $n = ${ans}$`],
    both: [`Write it as an equation: $${t.a}n + ${t.b} = ${t.a + 2}n - ${2 * n - t.b}$`, `Subtract $${t.a}n$ and add ${2 * n - t.b} to both sides: $${t.b + 2 * n - t.b} = 2n$, so $n = ${ans}$`],
  }[t.op];
  const wrong = {
    'mul-add': [(t.out + t.b) / t.a, t.out / t.a - t.b, (t.out - t.b) * t.a, t.out * t.a + t.b],
    'mul-sub': [(t.out - t.b) / t.a, t.out / t.a + t.b, (t.out + t.b) * t.a],
    'add-mul': [(t.out - t.b) / t.a, t.out / t.a + t.b, t.out * t.a - t.b],
    'sub-mul': [(t.out + t.b) / t.a, t.out / t.a - t.b, t.out * t.a + t.b],
    'div-add': [(t.out - t.b) / 2, (t.out + t.b) * 2, t.out * 2 - t.b],
    'add-div': [t.out * t.a + t.b, t.out / t.a - t.b, (t.out - t.b) * t.a],
    both: [2 * n, n + t.b, n - 1, t.b],
  }[t.op];
  return {
    prompt: t.text,
    answer: $(tnum(ans)),
    distractors: [...wrong, ans + 1, ans - 1, ans + 2].filter((w) => Number.isInteger(w) && w !== ans).map((w) => $(tnum(w))),
    typed: { kind: 'number', value: ans },
    solution: [...steps, `Check by doing the operations forwards on ${ans}.`, `Answer: $${ans}$`],
  };
}, { title: 'Think of a number and function machines', word: true });

/* ================================================================== */
/* alg-solve-brackets-both-sides                                       */
/* ================================================================== */

function pickSolution(rng, d) {
  if (d === 'easy') return int(rng, 1, 10);
  if (d === 'medium') return intExcept(rng, -8, 12, [0]);
  return chance(rng, 0.5) ? intExcept(rng, -9, 12, [0]) : q(pick(rng, [1, 3, 5, 7, 9, 11, -1, -3, -5]), pick(rng, [2, 2, 3, 4]));
}

export const solveBothSides = G('alg-solve-both-sides', 'alg-solve-brackets-both-sides', (rng, d) => {
  const x = pick(rng, ['x', 'x', 'y', 'a', 'n', 'p']);
  const v = pickSolution(rng, d);
  let a = int(rng, 2, 9); let c = int(rng, 1, 7);
  if (a === c) a += 2;
  if (d === 'easy' && a < c) [a, c] = [c, a];
  // a x + b = c x + e  with x = v  ->  e = (a - c) v + b
  const b = intExcept(rng, -15, 15, [0]);
  const eVal = (a - c) * val(v) + b;
  if (!Number.isInteger(eVal) || eVal === 0) throw new Error('');
  const e = eVal;
  const eq = `${P([a, b], x)} = ${P([c, e], x)}`;
  const [steps, sol] = linearSteps(a, b, c, e, x);
  const wrong = [q(e + b, a - c), q(e - b, a + c), q(b - e, a - c), q(e - b, a), q(e - b, c - a)];
  return {
    prompt: `Solve &nbsp; $${eq}$`,
    answer: xeq(sol, x),
    distractors: eqDistractors(sol, [...wrong, val(sol) + 1, val(sol) - 2], x),
    typed: { kind: 'number', value: sol },
    hint: 'Get all the letter terms on one side and all the numbers on the other. Whatever you do to one side, do to the other.',
    solution: [...steps, `Answer: ${xeq(sol, x)}`],
  };
}, { title: 'Solve with unknowns on both sides' });

export const solveBrackets = G('alg-solve-brackets', 'alg-solve-brackets-both-sides', (rng, d) => {
  const x = pick(rng, ['x', 'x', 'y', 'a', 'n', 't']);
  const v = pickSolution(rng, d);
  const form = pick(rng, size(d, ['k(x+a)=c', 'k(ax+b)=c'], ['k(x+a)=mx+n', 'k(ax+b)=m(cx+e)', 'k(x+a)=c'], ['k(ax+b)=m(cx+e)', 'k(x+a)-m(x+b)=c', 'k(x+a)=mx+n']));
  let eq; let A; let B; let C; let E; let expand;
  const k = int(rng, 2, 6); const a = intExcept(rng, -9, 9, [0]);
  if (form === 'k(x+a)=c') {
    const c = k * (val(v) + a); if (!Number.isInteger(c)) throw new Error('');
    eq = `${k}${br(1, a, x)} = ${tnum(c)}`; [A, B, C, E] = [k, k * a, 0, c];
    expand = `Expand the bracket: $${P([k, k * a], x)} = ${tnum(c)}$`;
  } else if (form === 'k(ax+b)=c') {
    const m = int(rng, 2, 4); const c = k * (m * val(v) + a); if (!Number.isInteger(c)) throw new Error('');
    eq = `${k}${br(m, a, x)} = ${tnum(c)}`; [A, B, C, E] = [k * m, k * a, 0, c];
    expand = `Expand the bracket: $${P([k * m, k * a], x)} = ${tnum(c)}$`;
  } else if (form === 'k(x+a)=mx+n') {
    const m = intExcept(rng, 1, 9, [k]); const n = k * (val(v) + a) - m * val(v); if (!Number.isInteger(n)) throw new Error('');
    eq = `${k}${br(1, a, x)} = ${P([m, n], x)}`; [A, B, C, E] = [k, k * a, m, n];
    expand = `Expand the bracket: $${P([k, k * a], x)} = ${P([m, n], x)}$`;
  } else if (form === 'k(ax+b)=m(cx+e)') {
    const m = int(rng, 2, 5); const aa = int(rng, 1, 4); const cc = int(rng, 1, 4); const bb = a;
    if (k * aa === m * cc) throw new Error('');
    const ee = (k * (aa * val(v) + bb) - m * cc * val(v)) / m;
    if (!Number.isInteger(ee) || ee === 0) throw new Error('');
    eq = `${k}${br(aa, bb, x)} = ${m}${br(cc, ee, x)}`; [A, B, C, E] = [k * aa, k * bb, m * cc, m * ee];
    expand = `Expand both brackets: $${P([A, B], x)} = ${P([C, E], x)}$`;
  } else {
    const m = int(rng, 2, 5); const bb = intExcept(rng, -8, 8, [0]);
    if (k === m) throw new Error('');
    const c = k * (val(v) + a) - m * (val(v) + bb); if (!Number.isInteger(c)) throw new Error('');
    eq = `${k}${br(1, a, x)} - ${m}${br(1, bb, x)} = ${tnum(c)}`; [A, B, C, E] = [k - m, k * a - m * bb, 0, c];
    if (A === 0) throw new Error('');
    expand = `Expand both brackets (the minus multiplies both terms in the second): $${P([k, k * a], x)} ${P([-m, -m * bb], x).replace(/^(?!-)/, '+ ').replace(/^-/, '- ')} = ${tnum(c)}$, which simplifies to $${P([A, B], x)} = ${tnum(c)}$`;
  }
  const [steps, sol] = A === C ? [[], null] : linearSteps(A, B, C, E, x);
  if (sol === null) throw new Error('');
  const wrong = [q(E - B / k, A - C), q(E - a, A - C), q(E + B, A - C), q(B - E, A - C), q(E - B, A + C), q(E, A - C)];
  return {
    prompt: `Solve &nbsp; $${eq}$`,
    answer: xeq(sol, x),
    distractors: eqDistractors(sol, [...wrong, val(sol) + 1, val(sol) - 1], x),
    typed: { kind: 'number', value: sol },
    solution: [expand, ...steps, `Answer: ${xeq(sol, x)}`],
  };
}, { title: 'Solve equations with brackets' });

export const solveFindError = G('alg-solve-find-error', 'alg-solve-brackets-both-sides', (rng, d) => {
  const x = 'x';
  const who = names(rng, 1)[0];
  const k = int(rng, 2, 6); const a = intExcept(rng, -7, 7, [0]); const c = intExcept(rng, 1, 9, [k]);
  const v = intExcept(rng, -6, 9, [0]);
  const e = k * (v + a) - c * v;
  if (k <= c) throw new Error('keep it simple');
  if (e === 0) throw new Error('');
  const errLine = int(rng, 1, size(d, 3, 4, 4));
  // Correct chain: L1 kx + ka = cx + e ; L2 kx - cx = e - ka ; L3 (k-c)x = e - ka ; L4 x = v
  let l1 = [k, k * a]; // coefficients of LHS after expansion
  if (errLine === 1) l1 = [k, a]; // forgot to multiply the second term
  let rhs2 = e - l1[1];
  if (errLine === 2) rhs2 = e + l1[1]; // moved the number without changing its sign
  let coef3 = k - c;
  if (errLine === 3) coef3 = k + c; // combined x terms wrongly
  const rhs3 = rhs2;
  let final = q(rhs3, coef3);
  if (errLine === 4) final = q(rhs3 - coef3, 1); // subtracted instead of dividing
  const lines = [
    `$${P(l1, x)} = ${P([c, e], x)}$`,
    `$${kx(k, x)} - ${kx(c, x)} = ${tnum(rhs2)}$`,
    `$${kx(coef3, x)} = ${tnum(rhs3)}$`,
    `$${x} = ${tv(final)}$`,
  ];
  const why = {
    1: `Line 1 is wrong: the ${k} must multiply <b>both</b> terms in the bracket, giving $${P([k, k * a], x)}$.`,
    2: `Line 2 is wrong: moving $${tnum(l1[1])}$ to the other side should change its sign, giving $${tnum(e - l1[1])}$.`,
    3: `Line 3 is wrong: $${kx(k, x)} - ${kx(c, x)} = ${kx(k - c, x)}$, not $${kx(k + c, x)}$.`,
    4: `Line 4 is wrong: to undo "× ${coef3}" you divide by ${coef3}, giving $${x} = ${tv(q(rhs3, coef3))}$.`,
  }[errLine];
  return {
    prompt: `${who} solves the equation &nbsp;$${k}${br(1, a, x)} = ${P([c, e], x)}$.<br>Here is the working:<br>${lines.map((l, i) => `Line ${i + 1}: &nbsp; ${l}`).join('<br>')}<br>In which line is the first mistake?`,
    answer: `Line ${errLine}: &nbsp; ${lines[errLine - 1]}`,
    distractors: [1, 2, 3, 4].filter((i) => i !== errLine).map((i) => `Line ${i}: &nbsp; ${lines[i - 1]}`),
    count: 4,
    solution: [`Check each line against the one before it.`, why, `The correct solution is $${x} = ${tnum(v)}$.`, `Answer: Line ${errLine}`],
  };
}, { title: 'Find the mistake in a solution' });

/* ================================================================== */
/* alg-solve-fractions                                                 */
/* ================================================================== */

export const solveFracSimple = G('alg-solve-frac-simple', 'alg-solve-fractions', (rng, d) => {
  const x = pick(rng, ['x', 'x', 'y', 'n']);
  const m = int(rng, 2, 7); const a = int(rng, 1, size(d, 1, 4, 5)); const b = intExcept(rng, -9, 12, [0]);
  const v = d === 'hard' ? pickSolution(rng, 'hard') : intExcept(rng, -6, 10, [0]);
  if (d !== 'hard' || chance(rng, 0.5)) {
    // (a x + b)/m = c
    const top = a * val(v) + b; const c = top / m;
    if (!Number.isInteger(c)) throw new Error('');
    const eq = `${tf(P([a, b], x), m)} = ${tnum(c)}`;
    const sol = v;
    const wrong = [q(c - b, a), q(c * m + b, a), q(c * m - b, a * m), q(c / 1 - b * m, a), val(v) * -1];
    return {
      prompt: `Solve &nbsp; $${eq}$`,
      answer: xeq(sol, x), distractors: eqDistractors(sol, [...wrong, val(sol) + 1], x), typed: { kind: 'number', value: sol },
      solution: [
        `Multiply both sides by ${m} to clear the fraction: $${P([a, b], x)} = ${tnum(c * m)}$`,
        `${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)}: $${kx(a, x)} = ${tnum(c * m - b)}$`,
        ...(a !== 1 ? [`Divide by ${a}: $${x} = ${tv(sol)}$`] : []),
        `Answer: ${xeq(sol, x)}`,
      ],
    };
  }
  // (a x + b)/m = x + e  (hard)
  const e = intExcept(rng, -6, 6, [0]);
  const A = a; const B = b; const C = m; const E = m * e;
  if (A === C) throw new Error('');
  const [steps, sol] = linearSteps(A, B, C, E, x);
  // Need v consistent: choose b so that the solution is clean — recompute from sol.
  if (Math.abs(val(sol)) > 30) throw new Error('');
  const eq = `${tf(P([a, b], x), m)} = ${P([1, e], x)}`;
  return {
    prompt: `Solve &nbsp; $${eq}$`,
    answer: xeq(sol, x),
    distractors: eqDistractors(sol, [q(e - b, a - 1), q(E - b, a + m), q(m * e + b, a - m), q(e * m - b, m - a + 2 * (a - m))], x).concat(eqDistractors(sol, [val(sol) + 1, val(sol) - 1, -val(sol)], x)),
    typed: { kind: 'number', value: sol },
    solution: [`Multiply both sides by ${m}. The whole right-hand side is multiplied: $${P([a, b], x)} = ${m}${br(1, e, x)} = ${P([m, m * e], x)}$`, ...steps, `Answer: ${xeq(sol, x)}`],
  };
}, { title: 'Solve (ax + b)/m = c' });

export const solveFracBoth = G('alg-solve-frac-both', 'alg-solve-fractions', (rng, d) => {
  const x = 'x';
  const [m, n] = pick(rng, size(d, [[2, 3], [3, 2], [4, 3], [2, 5], [5, 2], [3, 4]], [[2, 3], [3, 4], [4, 5], [5, 3], [2, 7], [3, 5]], [[3, 4], [4, 5], [5, 6], [2, 7], [3, 5], [6, 5]]));
  const p = size(d, 1, int(rng, 1, 2), int(rng, 1, 3)); const r = size(d, 1, int(rng, 1, 3), int(rng, 1, 3));
  const v = pickSolution(rng, d === 'hard' ? 'hard' : 'medium');
  // (p x + a)/m = (r x + b)/n  ->  n(p x + a) = m(r x + b). Choose a so that b comes out a whole number.
  if (n * p === m * r) throw new Error('');
  const choices = shuffle(rng, [-9, -8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    .filter((t) => { const bb = (n * (p * val(v) + t)) / m - r * val(v); return Number.isInteger(bb) && bb !== 0 && Math.abs(bb) <= 15; });
  if (!choices.length) throw new Error('');
  const a = choices[0];
  const b = (n * (p * val(v) + a)) / m - r * val(v);
  const eq = `${tf(P([p, a], x), m)} = ${tf(P([r, b], x), n)}`;
  const [steps, sol] = linearSteps(n * p, n * a, m * r, m * b, x);
  const wrong = [
    safe(() => linearSteps(n * p, a, m * r, b, x)[1]), // only multiplied the x terms
    safe(() => linearSteps(m * p, m * a, n * r, n * b, x)[1]), // multiplied by the wrong denominators
    safe(() => linearSteps(p, a, r, b, x)[1]), // ignored the denominators
    q(m * b + n * a, n * p - m * r),
  ];
  return {
    prompt: `Solve &nbsp; $${eq}$`,
    answer: xeq(sol, x),
    distractors: eqDistractors(sol, [...wrong, val(sol) + 1, -val(sol)], x),
    typed: { kind: 'number', value: sol },
    hint: 'Multiply both sides by both denominators ("cross-multiply"). Use brackets!',
    solution: [
      `Multiply both sides by ${m} and by ${n} (cross-multiply): $${n}${br(p, a, x)} = ${m}${br(r, b, x)}$`,
      `Expand: $${P([n * p, n * a], x)} = ${P([m * r, m * b], x)}$`,
      ...steps,
      `Answer: ${xeq(sol, x)}`,
    ],
  };
}, { title: 'Solve with a fraction on each side' });

export const solveFracSum = G('alg-solve-frac-sum', 'alg-solve-fractions', (rng, d) => {
  const x = 'x';
  const [m, n] = pick(rng, [[2, 3], [3, 4], [2, 5], [4, 5], [3, 5], [4, 6], [2, 6]]);
  const L = (m * n) / gcdInt(m, n);
  const op = d === 'easy' ? '+' : pick(rng, ['+', '-']);
  const s = op === '+' ? 1 : -1;
  const a = d === 'easy' ? 0 : intExcept(rng, -7, 7, [0]); const b = d === 'easy' ? 0 : intExcept(rng, -7, 7, [0]);
  // (x + a)/m ± (x + b)/n = c   ->   A x + B = c L
  const fm = L / m; const fn = L / n;
  const A = fm + s * fn; const B = fm * a + s * fn * b;
  if (A === 0) throw new Error('');
  // Easy: choose the answer as a multiple of L so every fraction is a whole number.
  const c = d === 'easy' ? int(rng, 1, 6) * A : intExcept(rng, -3, 9, [0]);
  const v0 = rat(c * L - B, A);
  if (d !== 'hard' && typeof v0 !== 'number') throw new Error('want an integer');
  if (Math.abs(val(v0)) > 40) throw new Error('too big');
  void frac;
  const lhs = `${tf(a ? P([1, a], x) : x, m)} ${op} ${tf(b ? P([1, b], x) : x, n)}`;
  const [steps, sol] = linearSteps(A, B, 0, c * L, x);
  const wrong = [
    safe(() => linearSteps(A, B, 0, c, x)[1]), // forgot to multiply the right-hand side
    safe(() => linearSteps(fm + s * fn, fm * a + fn * b * (s > 0 ? 1 : 1), 0, c * L, x)[1]), // sign error on second numerator
    safe(() => linearSteps(2, a + s * b, 0, c * (m + n), x)[1]), // added the fractions top + top / bottom + bottom
  ];
  return {
    prompt: `Solve &nbsp; $${lhs} = ${tnum(c)}$`,
    answer: xeq(sol, x),
    distractors: eqDistractors(sol, [...wrong, val(sol) + 1, val(sol) - 1, -val(sol)], x),
    typed: { kind: 'number', value: sol },
    solution: [
      `Multiply <b>every</b> term by ${L} (the lowest common multiple of ${m} and ${n}).`,
      `$${fm === 1 ? '' : fm}${a ? br(1, a, x) : x} ${op} ${fn === 1 ? '' : fn}${b ? br(1, b, x) : x} = ${tnum(c * L)}$`,
      `Expand and simplify: $${P([A, B], x)} = ${tnum(c * L)}$`,
      ...steps.slice(-2).filter((t) => !/Swap/.test(t)),
      `Answer: ${xeq(sol, x)}`,
    ],
  };
}, { title: 'Solve with two fractions added' });

/* ================================================================== */
/* alg-forming-equations                                               */
/* ================================================================== */

// Each context returns { text, eq (TeX of the equation in x), wrong: [TeX], x (unknown value), ask, answer, answerTex, unit, steps }
function ctxBank(rng, d) {
  const [n1, n2, n3] = names(rng, 3);
  const big = d === 'hard';
  return [
    () => { // ages
      const xv = int(rng, 6, 15); const a = int(rng, 2, 6); const m = int(rng, 3, 4);
      const tot = xv + (xv + a) + m * xv;
      return { text: `${n1} is $x$ years old. ${n2} is ${a} years older than ${n1}. Their mother is ${m} times as old as ${n1}. Their three ages add up to ${tot} years.`, ask: `How old is ${n1}?`, eq: `x + (x + ${a}) + ${m}x = ${tot}`, wrong: [`x + ${a} + ${m} = ${tot}`, `x + ${a}x + ${m}x = ${tot}`, `${m}(x + ${a}) = ${tot}`], A: m + 2, B: a, C: tot, value: xv, fmt: (v) => `${v} years`, unitWord: 'years' };
    },
    () => { // consecutive
      const xv = int(rng, 10, 60); const k = pick(rng, [3, 4]);
      const tot = k * xv + (k * (k - 1)) / 2;
      const ask = pick(rng, ['smallest', 'largest']);
      const terms_ = Array.from({ length: k }, (_, i) => (i ? `(n + ${i})` : 'n')).join(' + ');
      return { text: `The sum of ${k} consecutive whole numbers is ${tot}.`, ask: `What is the ${ask} of the numbers?`, eq: `${terms_} = ${tot}`, wrong: [`${k}n = ${tot}`, `n + ${k} = ${tot}`, `n(n + 1)(n + 2) = ${tot}`], A: k, B: (k * (k - 1)) / 2, C: tot, value: xv, v: 'n', answerVal: ask === 'smallest' ? xv : xv + k - 1, fmt: (v) => `${v}` };
    },
    () => { // tickets
      const child = int(rng, 4, 12); const extra = int(rng, 2, 8); const na = int(rng, 2, 3); const nc = int(rng, 2, 5);
      const tot = na * (child + extra) + nc * child;
      return { text: `An adult ticket for a museum costs £${extra} more than a child ticket. ${na} adult tickets and ${nc} child tickets cost £${tot} altogether. Let a child ticket cost £$x$.`, ask: 'How much is a child ticket?', eq: `${na}(x + ${extra}) + ${nc}x = ${tot}`, wrong: [`${na}x + ${extra} + ${nc}x = ${tot}`, `${na + nc}x = ${tot} + ${extra}`, `${na}(x + ${extra}) = ${nc}x + ${tot}`], A: na + nc, B: na * extra, C: tot, value: child, fmt: (v) => money(v) };
    },
    () => { // sharing money
      const xv = int(rng, 5, 30); const m = 2; const less = int(rng, 2, 9);
      const tot = xv + m * xv + (m * xv - less);
      return { text: `${n1} has £$x$. ${n2} has twice as much as ${n1}. ${n3} has £${less} less than ${n2}. Altogether they have £${tot}.`, ask: `How much does ${n1} have?`, eq: `x + 2x + (2x - ${less}) = ${tot}`, wrong: [`x + 2x + (x - ${less}) = ${tot}`, `x + 2 + (2 - ${less}) = ${tot}`, `x + 2x - (2x - ${less}) = ${tot}`], A: 5, B: -less, C: tot, value: xv, fmt: (v) => money(v) };
    },
    () => { // taxi
      const xv = int(rng, 3, 20); const fixed = pick(rng, [2, 3, 4, 5]); const per = pick(rng, [2, 3]);
      const tot = fixed + per * xv;
      return { text: `A taxi firm charges a fixed fee of £${fixed} plus £${per} for each mile. ${n1}'s journey costs £${tot}. The journey is $x$ miles long.`, ask: 'How many miles long is the journey?', eq: `${per}x + ${fixed} = ${tot}`, wrong: [`${fixed}x + ${per} = ${tot}`, `${per}(x + ${fixed}) = ${tot}`, `${per + fixed}x = ${tot}`], A: per, B: fixed, C: tot, value: xv, fmt: (v) => `${v} miles` };
    },
    () => { // pens and pencils (pence)
      const pencil = int(rng, 10, 40); const extra = pick(rng, [15, 20, 25, 30]); const np = int(rng, 2, 5); const nq = int(rng, 2, 6);
      const tot = np * (pencil + extra) + nq * pencil;
      return { text: `A pen costs ${extra}p more than a pencil. ${np} pens and ${nq} pencils cost ${money(tot / 100, { forcePence: true })} in total. A pencil costs $x$ pence.`, ask: 'How much does one pencil cost?', eq: `${np}(x + ${extra}) + ${nq}x = ${tot}`, wrong: [`${np}x + ${extra} + ${nq}x = ${tot}`, `${np}(x + ${extra}) + ${nq}x = ${tot / 100}`, `${np + nq}x + ${extra} = ${tot}`], A: np + nq, B: np * extra, C: tot, value: pencil, fmt: (v) => `${v} pence` };
    },
    () => { // sweets
      const xv = int(rng, 5, 20); const m = int(rng, 2, 4); const more = int(rng, 2, 9);
      const tot = xv + m * xv + more;
      return { text: `${n1} and ${n2} share some sweets. ${n2} gets ${m} times as many as ${n1}, plus ${more} more. There are ${tot} sweets altogether. ${n1} gets $x$ sweets.`, ask: `How many sweets does ${n1} get?`, eq: `x + ${m}x + ${more} = ${tot}`, wrong: [`x + ${m}(x + ${more}) = ${tot}`, `${m}x + ${more} = ${tot}`, `x + ${m} + ${more} = ${tot}`], A: m + 1, B: more, C: tot, value: xv, fmt: (v) => `${v}` };
    },
    () => { // phone contract
      const xv = pick(rng, [12, 15, 18, 20, 22, 25]); const months = pick(rng, [12, 18, 24]); const phone = pick(rng, [60, 90, 120, 150]);
      const tot = months * xv + phone;
      return { text: `A phone contract costs £${phone} for the phone plus £$x$ per month. Over ${months} months the total cost is £${tot}.`, ask: 'What is the monthly charge?', eq: `${months}x + ${phone} = ${tot}`, wrong: [`${months}(x + ${phone}) = ${tot}`, `${phone}x + ${months} = ${tot}`, `x + ${phone} = ${tot}`], A: months, B: phone, C: tot, value: xv, fmt: (v) => money(v) };
    },
    () => { // savings, both sides
      const w = int(rng, 3, 12); const p = int(rng, 3, 8); const qq = p + int(rng, 2, 6); const s1 = int(rng, 30, 90); const s2 = s1 - (qq - p) * w;
      if (s2 <= 0) return null;
      return { text: `${n1} has £${s1} and saves £${p} each week. ${n2} has £${s2} and saves £${qq} each week. After $x$ weeks they have the same amount.`, ask: 'After how many weeks do they have the same amount?', eq: `${s1} + ${p}x = ${s2} + ${qq}x`, wrong: [`${s1} + ${qq}x = ${s2} + ${p}x`, `${s1 + p}x = ${s2 + qq}x`, `${s1} + ${p}x + ${s2} + ${qq}x = 0`], A: p, B: s1, C: s2, D: qq, value: w, fmt: (v) => `${v} weeks` };
    },
    () => { // gyms, both sides
      const mth = int(rng, 4, 12); const f1 = pick(rng, [12, 15, 18, 20]); const f2 = f1 + pick(rng, [3, 4, 5, 6]); const j2 = pick(rng, [10, 15, 20, 25]); const j1 = j2 + (f2 - f1) * mth;
      return { text: `Gym A charges a joining fee of £${j1} and then £${f1} per month. Gym B charges a joining fee of £${j2} and then £${f2} per month. After $x$ months the total cost is the same.`, ask: 'Work out the number of months.', eq: `${j1} + ${f1}x = ${j2} + ${f2}x`, wrong: [`${j1}x + ${f1} = ${j2}x + ${f2}`, `${j1} + ${f2}x = ${j2} + ${f1}x`, `${j1 + f1}x = ${j2 + f2}x`], A: f1, B: j1, C: j2, D: f2, value: mth, fmt: (v) => `${v} months` };
    },
    () => { // bus passengers
      const off = int(rng, 3, 12); const start = off + int(rng, 5, 20);
      const end = 2 * (start - off);
      return { text: `There are $x$ people on a bus. At the first stop ${off} people get off. At the second stop the number of people on the bus doubles. There are now ${end} people on the bus.`, ask: 'How many people were on the bus at the start?', eq: `2(x - ${off}) = ${end}`, wrong: [`2x - ${off} = ${end}`, `x - ${off} + 2 = ${end}`, `2(x + ${off}) = ${end}`], A: 2, B: -2 * off, C: end, value: start, fmt: (v) => `${v}`, expandFirst: `2(x - ${off}) = 2x - ${2 * off}` };
    },
    () => { // ages past/future
      const now = int(rng, 12, 40); const back = int(rng, 3, 9); const fwd = now - 2 * back;
      if (fwd <= 0) return null;
      return { text: `In ${fwd} years' time, ${n1} will be twice as old as ${n1.endsWith('s') ? 'they were' : 'they were'} ${back} years ago. ${n1} is $x$ years old now.`, ask: `How old is ${n1} now?`, eq: `x + ${fwd} = 2(x - ${back})`, wrong: [`x + ${fwd} = 2x - ${back}`, `2(x + ${fwd}) = x - ${back}`, `x - ${fwd} = 2(x + ${back})`], A: 2, B: -2 * back, C: fwd, D: 1, swap: true, value: now, fmt: (v) => `${v} years` };
    },
    () => { // coins
      const twenties = int(rng, 4, 20); const ratio = int(rng, 2, 4);
      const tot = 10 * ratio * twenties + 20 * twenties;
      return { text: `A jar contains only 10p and 20p coins. There are $x$ 20p coins and ${ratio} times as many 10p coins. The total value is ${money(tot / 100, { forcePence: true })}.`, ask: 'How many 20p coins are in the jar?', eq: `20x + 10 \\times ${ratio}x = ${tot}`, wrong: [`20x + 10x = ${tot}`, `20x + ${ratio}x = ${tot}`, `20x + 10 \\times ${ratio}x = ${tot / 100}`], A: 20 + 10 * ratio, B: 0, C: tot, value: twenties, fmt: (v) => `${v}` };
    },
    () => { // books on shelves
      const xv = int(rng, 10, 30); const fewer = int(rng, 2, 8); const tot = xv + (xv - fewer) + 2 * xv;
      return { text: `A bookcase has three shelves. The top shelf has $x$ books. The middle shelf has ${fewer} fewer books than the top shelf. The bottom shelf has twice as many books as the top shelf. There are ${tot} books altogether.`, ask: 'How many books are on the top shelf?', eq: `x + (x - ${fewer}) + 2x = ${tot}`, wrong: [`x + (${fewer} - x) + 2x = ${tot}`, `x - ${fewer} + 2 = ${tot}`, `x + (x - ${fewer}) + 2(x - ${fewer}) = ${tot}`], A: 4, B: -fewer, C: tot, value: xv, fmt: (v) => `${v}` };
    },
    () => { // think of a number both sides
      const xv = int(rng, 2, 15); const a = int(rng, 2, 4); const b = a + int(rng, 1, 3); const c1 = int(rng, 3, 20); const c2 = (a - b) * xv + c1;
      if (c2 >= 0) return null;
      return { text: `${n1} thinks of a number, $x$. ${a} times the number plus ${c1} gives the same answer as ${b} times the number minus ${-c2}.`, ask: 'What is the number?', eq: `${a}x + ${c1} = ${b}x - ${-c2}`, wrong: [`${a}x + ${c1} = ${b}(x - ${-c2})`, `${a}(x + ${c1}) = ${b}x - ${-c2}`, `${a}x - ${c1} = ${b}x + ${-c2}`], A: a, B: c1, C: c2, D: b, value: xv, fmt: (v) => `${v}` };
    },
  ].map((f) => f).filter(() => !big || true);
}

function contextFor(rng, d) {
  const bank = ctxBank(rng, d);
  for (let i = 0; i < 40; i += 1) {
    const c = pick(rng, bank)();
    if (c) return c;
  }
  throw new Error('no context');
}

function contextSteps(c) {
  const v = c.v || 'x';
  // a x + b = (D) x + C  or a x + b = C
  if (c.D !== undefined) {
    const lhsA = c.swap ? c.D : c.A; const lhsB = c.swap ? c.C : c.B; const rhsA = c.swap ? c.A : c.D; const rhsB = c.swap ? c.B : c.C;
    const [steps] = linearSteps(lhsA, lhsB, rhsA, rhsB, v);
    return [`Form the equation: $${c.eq}$`, ...(c.swap ? [`Expand the bracket: $x + ${c.C} = ${P([c.A, c.B], v)}$`] : []), ...steps];
  }
  const simplified = `${P([c.A, c.B], v)} = ${tnum(c.C)}`;
  const [steps] = linearSteps(c.A, c.B, 0, c.C, v);
  return [`Form the equation: $${c.eq}$`, ...(simplified.replace(/\s/g, '') !== c.eq.replace(/\s/g, '') ? [`Simplify: $${simplified}$`] : []), ...steps];
}

export const formingContext = G('alg-forming-context', 'alg-forming-equations', (rng, d) => {
  const c = contextFor(rng, d);
  const ansVal = c.answerVal ?? c.value;
  const fmt = c.fmt;
  const steps = contextSteps(c);
  const near = [ansVal + 1, ansVal - 1, ansVal + 2, ansVal * 2, Math.round(ansVal / 2), c.C - c.B, c.C / c.A].filter((w) => Number.isInteger(w) && w > 0 && w !== ansVal);
  return {
    prompt: `${c.text}<br>${c.ask}`,
    answer: fmt(ansVal),
    distractors: near.map(fmt),
    typed: { kind: 'number', value: ansVal },
    solution: [...steps, ...(c.answerVal !== undefined && c.answerVal !== c.value ? [`So $n = ${c.value}$ and the ${c.ask.includes('largest') ? 'largest' : 'smallest'} number is ${ansVal}.`] : []), `Answer: ${fmt(ansVal)}`],
  };
}, { title: 'Form and solve an equation from a context', word: true });

export const formingWhichEquation = G('alg-forming-which-equation', 'alg-forming-equations', (rng, d) => {
  const c = contextFor(rng, d);
  return {
    prompt: `${c.text}<br>Which equation is correct?`,
    answer: $(c.eq),
    distractors: c.wrong.map($),
    count: 4,
    solution: [
      `Write each quantity in terms of $${c.v || 'x'}$, then put them together exactly as the words say.`,
      `$${c.eq}$`,
      `Solving it gives $${c.v || 'x'} = ${c.value}$ — check this fits the story.`,
      `Answer: $${c.eq}$`,
    ],
  };
}, { title: 'Choose the equation for a context', word: true });

// Geometry contexts: angles and perimeters.
function geoContext(rng, d) {
  const xv = int(rng, 5, 30);
  const k = () => int(rng, 1, 4);
  const cst = () => intExcept(rng, -10, 30, [0]);
  const types = ['triangle', 'straight', 'point', 'quad', 'isosceles', 'rectPerim', 'triPerim', 'squarePerim', 'equalPerim', 'vertOpp', 'exterior', 'isoSides', 'rectArea', 'parallel'];
  const t = pick(rng, types);
  const exprs = (n, total) => {
    // n linear expressions with positive values at xv, summing to total; last one adjusted
    for (let i = 0; i < 50; i += 1) {
      const list = Array.from({ length: n - 1 }, () => [k(), cst()]);
      const used = list.reduce((s, [a, b]) => s + a * xv + b, 0);
      const a = k(); const b = total - used - a * xv;
      if (Math.abs(b) > 80) continue;
      list.push([a, b]);
      if (list.every(([p, q2]) => p * xv + q2 > 0)) return list;
    }
    return null;
  };
  const sum = (list) => list.reduce((s, [a, b]) => [s[0] + a, s[1] + b], [0, 0]);
  const L = (e) => P(e);
  const ret = (o) => ({ ...o, value: xv });
  if (['triangle', 'straight', 'point', 'quad'].includes(t)) {
    const n = { triangle: 3, straight: pick(rng, [2, 3]), point: pick(rng, [3, 4]), quad: 4 }[t];
    const total = { triangle: 180, straight: 180, point: 360, quad: 360 }[t];
    const e = exprs(n, total); if (!e) return null;
    const where = { triangle: 'are the three angles of a triangle', straight: 'are angles on a straight line', point: 'are the angles around a point', quad: 'are the four angles of a quadrilateral' }[t];
    const [A, B] = sum(e);
    const ask = pick(rng, ['x', 'largest']);
    const largest = Math.max(...e.map(([a, b]) => a * xv + b));
    return ret({ text: `The angles ${e.map((p) => `$${L(p)}$`).join(', ').replace(/, ([^,]*)$/, ' and $1')} (in degrees) ${where}.`, fact: `${{ triangle: 'Angles in a triangle', straight: 'Angles on a straight line', point: 'Angles around a point', quad: 'Angles in a quadrilateral' }[t]} add up to $${total}^\\circ$.`, eq: `${e.map(L).join(' + ').replace(/\+ -/g, '- ')} = ${total}`, A, B, C: total, ask, askText: ask === 'x' ? 'Work out the value of $x$.' : 'Work out the size of the largest angle.', answerVal: ask === 'x' ? xv : largest, unit: ask === 'x' ? '' : '°', extra: ask === 'x' ? '' : `The angles are ${e.map(([a, b]) => `${a * xv + b}°`).join(', ')}.` });
  }
  if (t === 'isosceles') {
    const apex = [k(), cst()]; const base = (180 - (apex[0] * xv + apex[1])) / 2;
    if (!Number.isInteger(base) || base <= 0) return null;
    return ret({ text: `An isosceles triangle has two equal angles of $${base}^\\circ$. The third angle is $${L(apex)}$ degrees.`, fact: 'Angles in a triangle add up to $180^\\circ$.', eq: `${L(apex)} + ${2 * base} = 180`, A: apex[0], B: apex[1] + 2 * base, C: 180, askText: 'Work out the value of $x$.', answerVal: xv, unit: '' });
  }
  if (t === 'rectPerim') {
    const l = [k(), cst()]; const w = [k(), int(rng, 1, 10)];
    if (l[0] * xv + l[1] <= 0) return null;
    const per = 2 * (l[0] * xv + l[1] + w[0] * xv + w[1]);
    return ret({ text: `A rectangle has length $(${L(l)})$ cm and width $(${L(w)})$ cm. Its perimeter is ${per} cm.`, fact: 'Perimeter = 2 × length + 2 × width.', eq: `2(${L(l)}) + 2(${L(w)}) = ${per}`, A: 2 * (l[0] + w[0]), B: 2 * (l[1] + w[1]), C: per, askText: 'Work out the value of $x$.', answerVal: xv, unit: '' });
  }
  if (t === 'triPerim') {
    const e = [[k(), cst()], [k(), cst()], [k(), cst()]];
    if (e.some(([a, b]) => a * xv + b <= 0)) return null;
    const per = e.reduce((s, [a, b]) => s + a * xv + b, 0);
    const [A, B] = sum(e);
    return ret({ text: `A triangle has sides of length ${e.map((p) => `$(${L(p)})$`).join(', ').replace(/, ([^,]*)$/, ' and $1')} cm. Its perimeter is ${per} cm.`, fact: 'The perimeter is the sum of the three sides.', eq: `${e.map(L).join(' + ').replace(/\+ -/g, '- ')} = ${per}`, A, B, C: per, askText: 'Work out the value of $x$.', answerVal: xv, unit: '' });
  }
  if (t === 'squarePerim') {
    const s = [k(), cst()]; if (s[0] * xv + s[1] <= 0) return null;
    const per = 4 * (s[0] * xv + s[1]);
    return ret({ text: `A square has sides of length $(${L(s)})$ cm. Its perimeter is ${per} cm.`, fact: 'A square has four equal sides.', eq: `4(${L(s)}) = ${per}`, A: 4 * s[0], B: 4 * s[1], C: per, askText: 'Work out the length of one side.', answerVal: s[0] * xv + s[1], unit: ' cm' });
  }
  if (t === 'equalPerim') {
    // square side (x + a) and rectangle x by (x + b)?  perimeter square 4x + 4a; equilateral triangle 3(px + q)
    const a = int(rng, 1, 9); const p = 2; const qq = 4 * (xv + a) / 3 - p * xv;
    if (!Number.isInteger(qq)) return null;
    return ret({ text: `A square has sides of length $(x + ${a})$ cm. An equilateral triangle has sides of length $(${L([p, qq])})$ cm. The square and the triangle have the same perimeter.`, fact: 'Perimeter of square = 4 × side; perimeter of equilateral triangle = 3 × side.', eq: `4(x + ${a}) = 3(${L([p, qq])})`, A: 4, B: 4 * a, C: 3 * qq, D: 3 * p, askText: 'Work out the value of $x$.', answerVal: xv, unit: '' });
  }
  if (t === 'vertOpp' || t === 'parallel') {
    const a1 = int(rng, 2, 6); const a2 = a1 + int(rng, 1, 3); const b2 = int(rng, -40, 10); const b1 = (a2 - a1) * xv + b2;
    if (a1 * xv + b1 <= 0 || a1 * xv + b1 >= 180) return null;
    const txt = t === 'vertOpp' ? `Two straight lines cross. A pair of vertically opposite angles are $(${L([a1, b1])})^\\circ$ and $(${L([a2, b2])})^\\circ$.` : `Two parallel lines are crossed by a straight line. A pair of alternate angles are $(${L([a1, b1])})^\\circ$ and $(${L([a2, b2])})^\\circ$.`;
    return ret({ text: txt, fact: t === 'vertOpp' ? 'Vertically opposite angles are equal.' : 'Alternate angles are equal.', eq: `${L([a2, b2])} = ${L([a1, b1])}`, A: a2, B: b2, C: b1, D: a1, askText: 'Work out the value of $x$.', answerVal: xv, unit: '' });
  }
  if (t === 'exterior') {
    const e1 = [k(), cst()]; const e2 = [k(), cst()];
    const v1 = e1[0] * xv + e1[1]; const v2 = e2[0] * xv + e2[1];
    if (v1 <= 0 || v2 <= 0 || v1 + v2 >= 180) return null;
    const ext = v1 + v2;
    return ret({ text: `In a triangle, two interior angles are $(${L(e1)})^\\circ$ and $(${L(e2)})^\\circ$. The exterior angle at the third vertex is $${ext}^\\circ$.`, fact: 'An exterior angle of a triangle equals the sum of the two interior opposite angles.', eq: `${L(e1)} + ${L(e2)} = ${ext}`, A: e1[0] + e2[0], B: e1[1] + e2[1], C: ext, askText: 'Work out the value of $x$.', answerVal: xv, unit: '' });
  }
  if (t === 'isoSides') {
    const a1 = int(rng, 2, 5); const a2 = a1 + int(rng, 1, 3); const b2 = int(rng, -10, 5); const b1 = (a2 - a1) * xv + b2;
    if (a1 * xv + b1 <= 0) return null;
    return ret({ text: `An isosceles triangle has two equal sides of length $(${L([a1, b1])})$ cm and $(${L([a2, b2])})$ cm.`, fact: 'The two equal sides have the same length.', eq: `${L([a2, b2])} = ${L([a1, b1])}`, A: a2, B: b2, C: b1, D: a1, askText: 'Work out the length of one of the equal sides.', answerVal: a1 * xv + b1, unit: ' cm' });
  }
  // rectArea: width fixed number, length (ax + b)
  const w = int(rng, 3, 9); const l = [k(), cst()]; if (l[0] * xv + l[1] <= 0) return null;
  const area = w * (l[0] * xv + l[1]);
  return ret({ text: `A rectangle is ${w} cm wide and $(${L(l)})$ cm long. Its area is ${area} cm².`, fact: 'Area of a rectangle = length × width.', eq: `${w}(${L(l)}) = ${area}`, A: w * l[0], B: w * l[1], C: area, askText: 'Work out the value of $x$.', answerVal: xv, unit: '' });
}

export const formingGeometry = G('alg-forming-geometry', 'alg-forming-equations', (rng, d) => {
  let c = null;
  for (let i = 0; i < 60 && !c; i += 1) c = geoContext(rng, d);
  if (!c) throw new Error('no geometry context');
  if (d === 'easy' && c.D !== undefined) throw new Error('keep easy one-sided');
  const [steps] = c.D !== undefined ? linearSteps(c.A, c.B, c.D, c.C) : linearSteps(c.A, c.B, 0, c.C);
  const fmt = (v) => `${tnum(v)}${c.unit === '°' ? '°' : c.unit}`;
  const ans = c.answerVal;
  const wrong = [c.value, c.C / c.A, (c.C + c.B) / c.A, ans + 1, ans - 1, ans + 5, ans * 2, c.value * 2, ans + 10, ans - 10].filter((w) => Number.isInteger(w) && w > 0 && w !== ans);
  const simp = c.D !== undefined ? `${P([c.A, c.B])} = ${P([c.D, c.C])}` : `${P([c.A, c.B])} = ${tnum(c.C)}`;
  const same = simp.replace(/\s/g, '') === c.eq.replace(/\s/g, '');
  return {
    prompt: `${c.text}<br>${c.askText}`,
    answer: c.unit === '°' ? `$${ans}^\\circ$` : fmt(ans),
    distractors: wrong.map((w) => (c.unit === '°' ? `$${w}^\\circ$` : fmt(w))),
    typed: { kind: 'number', value: ans },
    solution: [
      `${c.fact} So $${c.eq}$`,
      ...(same ? [] : [`${/\(/.test(c.eq) ? 'Expand and simplify' : 'Collect like terms'}: $${simp}$`]),
      ...steps,
      ...(c.answerVal !== c.value ? [c.extra || `Substitute $x = ${c.value}$ to find the length: ${fmt(ans)}.`] : []),
      `Answer: ${c.unit === '°' ? `$${ans}^\\circ$` : fmt(ans)}`,
    ],
  };
}, { title: 'Form and solve equations from angles and perimeters', word: true });

export const generators = [
  solveOneStep, solveTwoStep, solveThinkNumber,
  solveBothSides, solveBrackets, solveFindError,
  solveFracSimple, solveFracBoth, solveFracSum,
  formingContext, formingGeometry, formingWhichEquation,
];

void [shuffle];
