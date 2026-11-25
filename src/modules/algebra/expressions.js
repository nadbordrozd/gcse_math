// Algebraic expressions, part 1: notation, collecting like terms, substitution, single brackets,
// factorising into one bracket, index laws.
import { pick, int, intExcept, sample, shuffle, size, chance, tnum, terms, paren, signed, gcd, frac } from '../../core.js';
import { svg, polygon, text, equalTicks, notDrawnAccurately } from '../../svg.js';
import { G, P, lin, br, coefTex, monos, tf, $, hcfList } from './lib.js';

const LETTERS = ['a', 'b', 'c', 'd', 'f', 'g', 'h', 'k', 'm', 'n', 'p', 'q', 'r', 't', 'w', 'x', 'y'];
const plainExpr = (tex) => tex.replace(/-/g, '−').replace(/\\times/g, '×').replace(/[{}]/g, '');

/* ================================================================== */
/* alg-notation                                                        */
/* ================================================================== */

export const notationSimplify = G('alg-notation-simplify', 'alg-notation', (rng, d) => {
  const [a, b] = sample(rng, LETTERS.filter((l) => l !== 'x'), 2).sort();
  const k = int(rng, 2, 6); const m = int(rng, 2, 5);
  const forms = size(d,
    ['repeatAdd', 'numTimesTerm', 'divide', 'threeFactors'],
    ['cube', 'twoTimesSquare', 'productSquare'],
    ['mixed', 'cubeCoef', 'mixed', 'productSquare']);
  const f = pick(rng, forms);
  let expr; let ans; let dis; let sol;
  switch (f) {
    case 'repeatAdd': {
      const n = int(rng, 3, 5);
      expr = Array(n).fill(a).join(' + ');
      ans = `${n}${a}`;
      dis = [`${a}^{${n}}`, `${n} + ${a}`, `${a}${n}`, `${n + 1}${a}`];
      sol = [`Adding the same letter again and again counts how many of it there are.`, `There are ${n} lots of $${a}$, so $${expr} = ${n}${a}$.`];
      break;
    }
    case 'numTimesTerm': {
      expr = `${k} \\times ${m}${a}`;
      ans = `${k * m}${a}`;
      dis = [`${k}${m}${a}`, `${k + m}${a}`, `${k * m} + ${a}`, `${k * m}${a}^{2}`];
      sol = [`Multiply the numbers together and keep the letter.`, `$${k} \\times ${m} = ${k * m}$, so $${expr} = ${k * m}${a}$.`];
      break;
    }
    case 'divide': {
      expr = `${a} \\div ${k}`;
      ans = tf(a, k);
      dis = [tf(k, a), `${k}${a}`, `${a} - ${k}`, `${a}^{${k}}`];
      sol = [`In algebra we write division as a fraction.`, `$${a} \\div ${k}$ is written $${tf(a, k)}$ (the letter on top, because $${a}$ is being divided).`];
      break;
    }
    case 'threeFactors': {
      expr = `${a} \\times ${b} \\times ${k}`;
      ans = `${k}${a}${b}`;
      dis = [`${a}${b}${k}`, `${k} + ${a}${b}`, `${a} + ${b} + ${k}`, `${k}${a} + ${b}`];
      sol = [`Multiply everything together. We write the number first, then the letters.`, `$${expr} = ${k}${a}${b}$`];
      break;
    }
    case 'cube': {
      expr = `${a} \\times ${a} \\times ${a}`;
      ans = `${a}^{3}`;
      dis = [`3${a}`, `${a} + 3`, `${a}^{2}`, `3${a}^{3}`];
      sol = [`A letter multiplied by itself is written with a power.`, `Three $${a}$'s multiplied together: $${expr} = ${a}^{3}$ (not $3${a}$, which means $${a} + ${a} + ${a}$).`];
      break;
    }
    case 'twoTimesSquare': {
      expr = `${k} \\times ${a} \\times ${a}`;
      ans = `${k}${a}^{2}`;
      dis = [`${2 * k}${a}`, `(${k}${a})^{2}`, `${k + 2}${a}`, `${k}${a}`, `${k * k}${a}^{2}`];
      sol = [`$${a} \\times ${a} = ${a}^{2}$`, `So $${expr} = ${k}${a}^{2}$. Only the $${a}$ is squared, not the ${k}.`];
      break;
    }
    case 'productSquare': {
      expr = `${k} \\times ${a} \\times ${m} \\times ${a}`;
      ans = `${k * m}${a}^{2}`;
      dis = [`${k + m}${a}^{2}`, `${k * m}${a}`, `${k + m}${a}`, `${k * m}${a}^{4}`, `${2 * k * m}${a}`];
      sol = [`Multiply the numbers: $${k} \\times ${m} = ${k * m}$.`, `Multiply the letters: $${a} \\times ${a} = ${a}^{2}$.`, `So $${expr} = ${k * m}${a}^{2}$.`];
      break;
    }
    case 'mixed': {
      expr = `${k} \\times ${a} \\times ${b} \\times ${b}`;
      ans = `${k}${a}${b}^{2}`;
      dis = [`${2 * k}${a}${b}`, `${k}${a}^{2}${b}`, `(${k}${a}${b})^{2}`, `${k}${a} + ${b}^{2}`, `${k + 2}${a}${b}`];
      sol = [`$${b} \\times ${b} = ${b}^{2}$`, `Write the number first, then the letters: $${expr} = ${k}${a}${b}^{2}$.`];
      break;
    }
    default: { // cubeCoef: 2a × 3a × a
      expr = `${k}${a} \\times ${m}${a} \\times ${a}`;
      ans = `${k * m}${a}^{3}`;
      dis = [`${k + m + 1}${a}^{3}`, `${k * m}${a}^{2}`, `${k + m}${a}^{3}`, `${k * m + 1}${a}^{3}`, `${k * m}${a}`];
      sol = [`Multiply the numbers: $${k} \\times ${m} \\times 1 = ${k * m}$.`, `Multiply the letters: $${a} \\times ${a} \\times ${a} = ${a}^{3}$.`, `So the answer is $${k * m}${a}^{3}$.`];
    }
  }
  return {
    prompt: `Simplify $${expr}$`,
    answer: $(ans),
    distractors: dis.map($),
    solution: [...sol, `Answer: $${ans}$`],
  };
}, { title: 'Write products and repeated sums in algebraic notation' });

export const notationWords = G('alg-notation-words', 'alg-notation', (rng, d) => {
  const n = pick(rng, ['n', 'x', 'y', 'm', 'p', 't']);
  const a = int(rng, 2, 9); let b = int(rng, 2, 9);
  if (b === a) b = a + 1;
  const easy = [
    () => ({ words: `${a} more than $${n}$`, ans: `${n} + ${a}`, dis: [`${a}${n}`, `${n} - ${a}`, `${a} - ${n}`, `${n}^{${a}}`], why: `"More than" means add ${a} to $${n}$.` }),
    () => ({ words: `${a} less than $${n}$`, ans: `${n} - ${a}`, dis: [`${a} - ${n}`, `${n} + ${a}`, `${a}${n}`, tf(n, a)], why: `"${a} less than $${n}$" means start with $${n}$ and take ${a} away (not $${a} - ${n}$).` }),
    () => ({ words: `$${n}$ multiplied by ${a}`, ans: `${a}${n}`, dis: [`${n} + ${a}`, `${n}^{${a}}`, tf(n, a), `${n} - ${a}`], why: `Multiplying by ${a} is written with the number in front of the letter.` }),
    () => ({ words: `$${n}$ divided by ${a}`, ans: tf(n, a), dis: [tf(a, n), `${a}${n}`, `${n} - ${a}`, `${n} + ${a}`], why: `Division is written as a fraction, with $${n}$ on top because $${n}$ is being divided.` }),
    () => ({ words: `$${n}$ squared`, ans: `${n}^{2}`, dis: [`2${n}`, `${n} + 2`, `${n}^{3}`, tf(n, 2)], why: `Squared means multiplied by itself: $${n} \\times ${n} = ${n}^{2}$ (not $2${n}$).` }),
    () => ({ words: `${a} subtract $${n}$`, ans: `${a} - ${n}`, dis: [`${n} - ${a}`, `${a}${n}`, `${n} + ${a}`, `-${a}${n}`], why: `Start with ${a} and take away $${n}$.` }),
  ];
  const medium = [
    () => ({ words: `multiply $${n}$ by ${a} and then add ${b}`, ans: `${a}${n} + ${b}`, dis: [`${a}(${n} + ${b})`, `${a + b}${n}`, `${b}${n} + ${a}`, `${n} + ${a * b}`], why: `First $${n} \\times ${a} = ${a}${n}$, then add ${b}. No bracket: only $${n}$ is multiplied.` }),
    () => ({ words: `multiply $${n}$ by ${a} and then subtract ${b}`, ans: `${a}${n} - ${b}`, dis: [`${a}(${n} - ${b})`, `${b} - ${a}${n}`, `${b}${n} - ${a}`, `${n} - ${a * b}`], why: `First $${n} \\times ${a} = ${a}${n}$, then subtract ${b}.` }),
    () => ({ words: `divide $${n}$ by ${a} and then add ${b}`, ans: `${tf(n, a)} + ${b}`, dis: [tf(`${n} + ${b}`, a), `${a}${n} + ${b}`, `${tf(a, n)} + ${b}`, tf(n, a + b)], why: `First divide: $${tf(n, a)}$. Then add ${b} outside the fraction.` }),
    () => ({ words: `square $${n}$ and then add ${b}`, ans: `${n}^{2} + ${b}`, dis: [`(${n} + ${b})^{2}`, `2${n} + ${b}`, `${n}^{${b + 2}}`, `${b}${n}^{2}`], why: `First square: $${n}^{2}$. Then add ${b}; only $${n}$ is squared.` }),
    () => ({ words: `square $${n}$ and then multiply by ${a}`, ans: `${a}${n}^{2}`, dis: [`(${a}${n})^{2}`, `${2 * a}${n}`, `${n}^{2} + ${a}`, `${a}${n} + 2`], why: `First square: $${n}^{2}$. Then multiply by ${a}, written in front: $${a}${n}^{2}$.` }),
    () => ({ words: `the total of $${n}$ and ${a}, then multiplied by ${b}`, ans: `${b}(${n} + ${a})`, dis: [`${b}${n} + ${a}`, `${n} + ${a * b}`, `${a}(${n} + ${b})`, `${a}${n} + ${b}`], why: `The whole total $${n} + ${a}$ is multiplied, so it goes in a bracket.` }),
  ];
  const hard = [
    () => ({ words: `add ${a} to $${n}$ and then multiply by ${b}`, ans: `${b}(${n} + ${a})`, dis: [`${b}${n} + ${a}`, `${a}(${n} + ${b})`, `${a}${n} + ${b}`, `${n} + ${a * b}`], why: `All of $${n} + ${a}$ is multiplied by ${b}, so it needs a bracket.` }),
    () => ({ words: `subtract ${a} from $${n}$ and then multiply by ${b}`, ans: `${b}(${n} - ${a})`, dis: [`${b}${n} - ${a}`, `${b}(${a} - ${n})`, `${a}(${n} - ${b})`, `${a} - ${b}${n}`], why: `"Subtract ${a} from $${n}$" gives $${n} - ${a}$. All of it is multiplied by ${b}, so use a bracket.` }),
    () => ({ words: `multiply $${n}$ by ${a} and then subtract the result from ${b * 5}`, ans: `${b * 5} - ${a}${n}`, dis: [`${a}${n} - ${b * 5}`, `${a}(${b * 5} - ${n})`, `${b * 5}${n} - ${a}`, `${a}(${n} - ${b * 5})`], why: `"Subtract the result from ${b * 5}" means ${b * 5} comes first: $${b * 5} - ${a}${n}$.` }),
    () => ({ words: `add ${a} to $${n}$ and then divide by ${b}`, ans: tf(`${n} + ${a}`, b), dis: [`${tf(n, b)} + ${a}`, tf(b, `${n} + ${a}`), `${b}(${n} + ${a})`, tf(`${n} + ${b}`, a)], why: `All of $${n} + ${a}$ is divided by ${b}, so it all goes on top of the fraction.` }),
    () => ({ words: `multiply $${n}$ by ${a} and then square the result`, ans: `${a * a}${n}^{2}`, dis: [`${a}${n}^{2}`, `${2 * a}${n}`, `${a}${n} + 2`, `${2 * a}${n}^{2}`], why: `$(${a}${n})^{2} = ${a}${n} \\times ${a}${n} = ${a * a}${n}^{2}$ — the ${a} is squared too.` }),
    () => ({ words: `halve $${n}$ and then subtract ${a}`, ans: `${tf(n, 2)} - ${a}`, dis: [tf(`${n} - ${a}`, 2), `2${n} - ${a}`, `${a} - ${tf(n, 2)}`, `${tf(n, 2)} + ${a}`], why: `Halving gives $${tf(n, 2)}$, then subtract ${a}.` }),
  ];
  const t = pick(rng, size(d, easy, medium, hard))();
  return {
    prompt: `Write an expression for:<br><b>${t.words}</b>`,
    answer: $(t.ans),
    distractors: t.dis.map($),
    hint: 'Do the operations in the order the words say. Use brackets when a whole expression is multiplied or divided.',
    solution: [
      `Follow the words in order, starting with $${n}$.`,
      t.why,
      `Answer: $${t.ans}$`,
    ],
  };
}, { title: 'Write an expression from words' });

export const notationMeaning = G('alg-notation-meaning', 'alg-notation', (rng, d) => {
  const [a, b] = pick(rng, [['a', 'b'], ['m', 'n'], ['p', 'q'], ['x', 'y'], ['s', 't'], ['c', 'd']]);
  const k = int(rng, 2, 5);
  const forms = size(d, ['square', 'cube', 'coefLetter'], ['coefSquare', 'productSquare', 'square'], ['bracketSquare', 'productSquare', 'coefSquare', 'statement']);
  const f = pick(rng, forms);
  let prompt; let ans; let dis; let sol; let count = 5;
  if (f === 'square') {
    prompt = `Which of these is the same as $${a}^{2}$?`;
    ans = `${a} \\times ${a}`; dis = [`2 \\times ${a}`, `${a} + ${a}`, `${a} + 2`, `2${a}`];
    sol = [`The small 2 is a power: it tells you how many $${a}$'s are multiplied together.`, `$${a}^{2} = ${a} \\times ${a}$ (but $2${a} = ${a} + ${a}$).`];
  } else if (f === 'cube') {
    prompt = `Which of these is the same as $${a}^{3}$?`;
    ans = `${a} \\times ${a} \\times ${a}`; dis = [`3 \\times ${a}`, `${a} + ${a} + ${a}`, `${a} \\times 3`, `${a}^{2} + ${a}`];
    sol = [`The power 3 means three $${a}$'s multiplied together.`, `$${a}^{3} = ${a} \\times ${a} \\times ${a}$ (while $3${a} = ${a} + ${a} + ${a}$).`];
  } else if (f === 'coefLetter') {
    prompt = `Which of these is the same as $${k}${a}$?`;
    ans = `${k} \\times ${a}`; dis = [`${k} + ${a}`, `${a}^{${k}}`, `${a} \\div ${k}`, `${k}${a} \\times ${k}`];
    sol = [`A number written next to a letter means multiply.`, `$${k}${a} = ${k} \\times ${a}$, which is also $${Array(k).fill(a).join(' + ')}$.`];
  } else if (f === 'coefSquare') {
    prompt = `Which of these is the same as $${k}${a}^{2}$?`;
    ans = `${k} \\times ${a} \\times ${a}`; dis = [`${k}${a} \\times ${k}${a}`, `${k} \\times ${a} \\times 2`, `${k} \\times ${a} + ${a}`, `${k} + ${a} \\times ${a}`];
    sol = [`The power only applies to the letter directly in front of it.`, `So only $${a}$ is squared: $${k}${a}^{2} = ${k} \\times ${a} \\times ${a}$.`, `(Note $${k}${a} \\times ${k}${a} = (${k}${a})^{2} = ${k * k}${a}^{2}$, which is different.)`];
  } else if (f === 'productSquare') {
    prompt = `Which of these is the same as $${a}${b}^{2}$?`;
    ans = `${a} \\times ${b} \\times ${b}`; dis = [`${a} \\times ${a} \\times ${b} \\times ${b}`, `${a} \\times ${b} \\times 2`, `${a}${b} \\times ${a}${b}`, `${a} \\times ${a} \\times ${b}`];
    sol = [`The power 2 is attached to $${b}$ only.`, `So $${a}${b}^{2} = ${a} \\times ${b} \\times ${b}$.`];
  } else if (f === 'bracketSquare') {
    prompt = `Which of these is the same as $(${k}${a})^{2}$?`;
    ans = `${k * k}${a}^{2}`; dis = [`${k}${a}^{2}`, `${2 * k}${a}`, `${k}${a} \\times 2`, `${2 * k}${a}^{2}`];
    sol = [`The bracket means everything inside is squared: $(${k}${a})^{2} = ${k}${a} \\times ${k}${a}$.`, `$${k} \\times ${k} = ${k * k}$ and $${a} \\times ${a} = ${a}^{2}$, giving $${k * k}${a}^{2}$.`];
  } else {
    count = 4;
    const right = pick(rng, [`${a} \\times ${a} = ${a}^{2}`, `${a} + ${a} = 2${a}`, `${a} \\times ${b} = ${b}${a}`, `${a} \\div ${k} = ${tf(a, k)}`]);
    prompt = 'Which statement is correct?';
    ans = right;
    dis = shuffle(rng, [`${a} + ${a} = ${a}^{2}`, `${a} \\times ${a} = 2${a}`, `${a} + ${b} = ${a}${b}`, `${a} \\times ${k} = ${a}${k}`, `${a} - ${a} = ${a}`, `${a} \\times ${b} \\times ${b} = ${a}${b}2`]).slice(0, 3);
    sol = [`Adding a letter to itself gives a multiple: $${a} + ${a} = 2${a}$. Multiplying it by itself gives a power: $${a} \\times ${a} = ${a}^{2}$.`, `Order doesn't matter in multiplication ($${a}${b} = ${b}${a}$), and division is written as a fraction.`];
  }
  return { prompt, answer: $(ans), distractors: dis.map($), count, solution: [...sol, `Answer: $${ans}$`] };
}, { title: 'Meaning of powers and products in notation' });

/* ================================================================== */
/* alg-simplify                                                        */
/* ================================================================== */

/** Collect like terms. list: [[coef, varTex]] -> combined in order of first appearance. */
function collect(list) {
  const order = []; const sum = {};
  for (const [c, v] of list) { if (!(v in sum)) { order.push(v); sum[v] = 0; } sum[v] += c; }
  return order.map((v) => [sum[v], v]);
}
const exprOf = (list) => terms(list);

export const simplifyCollect = G('alg-simplify-collect', 'alg-simplify', (rng, d) => {
  const [u, v] = pick(rng, [['a', 'b'], ['x', 'y'], ['p', 'q'], ['m', 'n'], ['c', 'd'], ['s', 't'], ['g', 'h'], ['e', 'f']]);
  let list;
  if (d === 'easy') {
    const a1 = int(rng, 2, 9); const b1 = int(rng, 2, 9); const a2 = int(rng, 2, 8); const b2 = int(rng, 1, b1 - 1 || 1);
    list = [[a1, u], [b1, v], [a2, u], [-b2, v]];
    if (b2 >= b1) list[3][0] = -1;
  } else if (d === 'medium') {
    const a1 = int(rng, 2, 9); const b1 = intExcept(rng, -6, 9, [0, 1, -1]); const a2 = -int(rng, 1, 9); const b2 = intExcept(rng, -9, 9, [0]);
    const c = intExcept(rng, -9, 9, [0]);
    list = shuffle(rng, [[a1, u], [b1, v], [a2, u], [b2, v]]);
    if (list[0][0] < 0) list[0][0] = -list[0][0];
    list.push([c, '']);
  } else {
    const x = pick(rng, ['x', 'a', 'y', 'n']);
    const kind = pick(rng, ['quad', 'xy']);
    if (kind === 'quad') {
      list = [[int(rng, 2, 7), `${x}^{2}`], [intExcept(rng, -8, 9, [0]), x], [-int(rng, 1, 6), `${x}^{2}`], [intExcept(rng, -9, 9, [0]), x], [intExcept(rng, -9, 9, [0]), '']];
      list = [list[0], ...shuffle(rng, list.slice(1))];
    } else {
      const ab = `${u}${v}`;
      list = [[int(rng, 2, 8), ab], [intExcept(rng, -7, 9, [0]), u], [-int(rng, 1, 6), ab], [intExcept(rng, -9, 9, [0]), u], [intExcept(rng, -6, 6, [0]), `${v}${u}`]];
      list = [list[0], ...shuffle(rng, list.slice(1))];
    }
  }
  const norm = (L) => L.map(([c, t]) => [c, t === `${v}${u}` ? `${u}${v}` : t]);
  const result = collect(norm(list));
  if (result.some(([c]) => c === 0)) throw new Error('zero term');
  const ans = exprOf(result);
  const dis = [];
  // Sign slips: treat one negative term as positive.
  list.forEach((t, i) => { if (t[0] < 0) dis.push(exprOf(collect(norm(list.map((s, j) => (j === i ? [-s[0], s[1]] : s)))))); });
  // Treat a positive term as negative (subtracting across).
  list.forEach((t, i) => { if (i > 0 && t[0] > 0) dis.push(exprOf(collect(norm(list.map((s, j) => (j === i ? [-s[0], s[1]] : s)))))); });
  // Lumping everything into one term.
  const total = list.reduce((s, [c]) => s + c, 0);
  const letters = [...new Set(result.map(([, t]) => t).filter(Boolean))];
  // Lumping everything into one term: use each letter once, in order (e.g. 9mn).
  if (letters.length >= 2) dis.push(terms([[total, [...new Set(letters.join('').replace(/\^\{2\}/g, '').split(''))].sort().join('')]]));
  // Swap the final sign.
  dis.push(exprOf(result.map(([c, t], i) => (i === result.length - 1 ? [-c, t] : [c, t]))));
  dis.push(exprOf(result.map(([c, t], i) => (i === 0 ? [c + 1, t] : [c, t]))));
  const groups = [...new Set(norm(list).map(([, t]) => t))];
  return {
    prompt: `Simplify fully &nbsp; $${exprOf(list)}$`,
    answer: $(ans),
    distractors: dis.filter((x) => x !== ans).map($),
    hint: 'Only terms with exactly the same letters (and powers) can be added together. Each term keeps the sign in front of it.',
    solution: [
      `Collect <b>like terms</b>: each term takes the sign in front of it.`,
      ...groups.map((g) => {
        const parts = norm(list).filter(([, t]) => t === g);
        const sum = parts.reduce((s, [c]) => s + c, 0);
        return g === '' ? (parts.length === 1 ? `The number term is $${tnum(sum)}$.` : `Numbers: $${parts.map(([c]) => paren(c)).join(' + ')} = ${tnum(sum)}$`) : `$${g}$ terms: $${parts.map(([c]) => paren(c)).join(' + ')} = ${tnum(sum)}$, giving $${terms([[sum, g]])}$`;
      }),
      ...(list.some(([, t]) => t === `${v}${u}`) ? [`Remember $${v}${u}$ is the same as $${u}${v}$.`] : []),
      `Answer: $${ans}$`,
    ],
  };
}, { title: 'Collect like terms' });

export const simplifyProducts = G('alg-simplify-products', 'alg-simplify', (rng, d) => {
  const [a, b, c] = pick(rng, [['a', 'b', 'c'], ['x', 'y', 'z'], ['p', 'q', 'r'], ['d', 'e', 'f'], ['g', 'h', 'k'], ['r', 's', 't']]);
  const p = int(rng, 2, 7); const q = int(rng, 2, 6); const r = int(rng, 2, 5);
  const form = pick(rng, size(d, ['ab', 'aa', 'div1'], ['abc', 'aa', 'div2', 'ab'], ['div3', 'pow', 'abc', 'div2']));
  let expr; let ans; let dis; let sol;
  if (form === 'ab') {
    expr = `${p}${a} \\times ${q}${b}`; ans = `${p * q}${a}${b}`;
    dis = [`${p + q}${a}${b}`, `${p}${q}${a}${b}`, `${p}${a} + ${q}${b}`, `${p * q}${a}^{2}`, `${p * q + 1}${a}${b}`];
    sol = [`Multiply the numbers: $${p} \\times ${q} = ${p * q}$.`, `Multiply the letters: $${a} \\times ${b} = ${a}${b}$.`];
  } else if (form === 'aa') {
    expr = `${p}${a} \\times ${q}${a}`; ans = `${p * q}${a}^{2}`;
    dis = [`${p * q}${a}`, `${p + q}${a}`, `${p + q}${a}^{2}`, `${2 * p * q}${a}`, `${p * q}${a}^{3}`];
    sol = [`Multiply the numbers: $${p} \\times ${q} = ${p * q}$.`, `Multiply the letters: $${a} \\times ${a} = ${a}^{2}$.`];
  } else if (form === 'abc') {
    expr = `${p}${a} \\times ${q}${b} \\times ${r}${c}`; ans = `${p * q * r}${a}${b}${c}`;
    dis = [`${p + q + r}${a}${b}${c}`, `${p * q + r}${a}${b}${c}`, `${p * q * r}${a}^{3}`, `${p * q}${a}${b}${c}`, `${p * q * r + 1}${a}${b}${c}`];
    sol = [`Multiply the numbers: $${p} \\times ${q} \\times ${r} = ${p * q * r}$.`, `Multiply the letters: $${a} \\times ${b} \\times ${c} = ${a}${b}${c}$.`];
  } else if (form === 'div1') {
    expr = `${p * q}${a} \\div ${q}`; ans = `${p}${a}`;
    dis = [`${p * q - q}${a}`, `${p * q * q}${a}`, tf(`${q}`, `${p}${a}`), `${p}`, `${p + 1}${a}`];
    sol = [`Divide the number by ${q}: $${p * q} \\div ${q} = ${p}$.`, `The letter $${a}$ is unchanged.`];
  } else if (form === 'div2') {
    expr = `${p * q}${a}${b} \\div ${q}${a}`; ans = `${p}${b}`;
    dis = [`${p}${a}${b}`, `${p * q - q}${b}`, `${p}${a}`, `${p * q * q}${a}^{2}${b}`, `${p}`];
    sol = [`Write it as a fraction: $${tf(`${p * q}${a}${b}`, `${q}${a}`)}$.`, `Cancel: $${p * q} \\div ${q} = ${p}$ and the $${a}$'s cancel, leaving $${b}$.`];
  } else if (form === 'div3') {
    const top = [p * q, 3, 2]; const bot = [q, 1, 1];
    expr = `${tf(`${top[0]}${a}^{3}${b}^{2}`, `${bot[0]}${a}${b}`)}`; ans = `${p}${a}^{2}${b}`;
    dis = [`${p}${a}^{3}${b}`, `${p}${a}^{3}${b}^{2}`, `${p * q - q}${a}^{2}${b}`, `${p}${a}^{2}${b}^{2}`, `${p}${a}${b}`];
    sol = [`Divide the numbers: $${top[0]} \\div ${q} = ${p}$.`, `Subtract the powers: $${a}^{3} \\div ${a} = ${a}^{2}$ and $${b}^{2} \\div ${b} = ${b}$.`];
  } else {
    expr = `${p}${a}^{2}${b} \\times ${q}${a}${b}^{3}`; ans = `${p * q}${a}^{3}${b}^{4}`;
    dis = [`${p + q}${a}^{3}${b}^{4}`, `${p * q}${a}^{2}${b}^{3}`, `${p * q}${a}^{3}${b}^{3}`, `${p * q}${a}^{2}${b}^{4}`, `${p * q}${a}^{3}${b}^{4}`.replace(`${p * q}`, `${p}${q}`)];
    sol = [`Multiply the numbers: $${p} \\times ${q} = ${p * q}$.`, `Add the powers of each letter: $${a}^{2} \\times ${a} = ${a}^{3}$ and $${b} \\times ${b}^{3} = ${b}^{4}$.`];
  }
  return {
    prompt: `Simplify &nbsp; $${expr}$`,
    answer: $(ans),
    distractors: dis.map($),
    solution: [...sol, `Answer: $${ans}$`],
  };
}, { title: 'Simplify products and quotients of terms' });

// Shapes with algebraic sides: perimeter.
export const simplifyPerimeter = G('alg-simplify-perimeter', 'alg-simplify', (rng, d) => {
  const x = pick(rng, ['x', 'a', 'n', 'y', 'p']);
  const shape = pick(rng, size(d, ['rectangle', 'triangle', 'square'], ['rectangle', 'triangle', 'isosceles', 'pentagon'], ['rectangle', 'isosceles', 'quad', 'triangle']));
  const side = () => {
    const a = int(rng, 1, size(d, 4, 5, 6));
    const b = d === 'easy' ? int(rng, 0, 7) : intExcept(rng, -5, 9, [0]);
    return [a, b];
  };
  let sides; let labels; let pts; let ticks = '';
  const lab = (s) => plainExpr(lin(s[0], s[1], x));
  if (shape === 'rectangle') {
    let s1 = side(); let s2 = side(); if (s2[0] === s1[0] && s2[1] === s1[1]) s2 = [s1[0] + 1, s1[1]];
    // The longer (top) side gets the expression that is bigger for typical x (compare at x = 5 and x = 10).
    if (s2[0] * 10 + s2[1] > s1[0] * 10 + s1[1] || (s2[0] * 10 + s2[1] === s1[0] * 10 + s1[1] && s2[0] * 5 + s2[1] > s1[0] * 5 + s1[1])) [s1, s2] = [s2, s1];
    sides = [s1, s2, s1, s2];
    pts = [[60, 40], [300, 40], [300, 160], [60, 160]];
    labels = [[180, 24, lab(s1)], [340, 100, lab(s2)]];
  } else if (shape === 'square') {
    const s1 = side(); sides = [s1, s1, s1, s1];
    pts = [[110, 30], [250, 30], [250, 170], [110, 170]];
    labels = [[180, 14, lab(s1)]];
    ticks = equalTicks(pts[0], pts[1]) + equalTicks(pts[1], pts[2]) + equalTicks(pts[2], pts[3]) + equalTicks(pts[3], pts[0]);
  } else if (shape === 'triangle') {
    sides = [side(), side(), side()];
    pts = [[50, 170], [320, 170], [210, 30]];
    labels = [[185, 192, lab(sides[0])], [300, 92, lab(sides[1])], [95, 92, lab(sides[2])]];
  } else if (shape === 'isosceles') {
    const s1 = side(); const s2 = side();
    sides = [s2, s1, s1];
    pts = [[80, 170], [280, 170], [180, 25]];
    labels = [[180, 192, lab(s2)], [272, 92, lab(s1)]];
    ticks = equalTicks(pts[1], pts[2]) + equalTicks(pts[2], pts[0]);
  } else if (shape === 'pentagon') {
    const s1 = side(); sides = [s1, s1, s1, s1, s1];
    pts = [0, 1, 2, 3, 4].map((i) => [180 + 75 * Math.cos(((90 + 72 * i) * Math.PI) / 180), 105 - 75 * Math.sin(((90 + 72 * i) * Math.PI) / 180)]);
    labels = [[180, 196, lab(s1)]];
    for (let i = 0; i < 5; i += 1) ticks += equalTicks(pts[i], pts[(i + 1) % 5]);
  } else {
    sides = [side(), side(), side(), side()];
    pts = [[50, 160], [300, 170], [270, 40], [110, 30]];
    labels = [[175, 186, lab(sides[0])], [322, 105, lab(sides[1])], [190, 18, lab(sides[2])], [40, 92, lab(sides[3])]];
  }
  const total = sides.reduce((s, t) => [s[0] + t[0], s[1] + t[1]], [0, 0]);
  if (total[1] === 0 && shape !== 'square') throw new Error('zero constant');
  const ans = lin(total[0], total[1], x);
  const distinct = shape === 'rectangle' ? [sides[0], sides[1]] : shape === 'isosceles' ? [sides[0], sides[1]] : shape === 'square' || shape === 'pentagon' ? [sides[0]] : sides;
  const onceSum = distinct.reduce((s, t) => [s[0] + t[0], s[1] + t[1]], [0, 0]);
  const dis = [
    lin(onceSum[0], onceSum[1], x),
    lin(total[0], onceSum[1], x),
    lin(onceSum[0], total[1], x),
    terms([[total[0] + total[1], x]]),
    lin(total[0], -total[1], x),
    lin(total[0] + 1, total[1], x),
    lin(total[0], total[1] + 2, x),
  ];
  const name = { rectangle: 'rectangle', square: 'square', triangle: 'triangle', isosceles: 'isosceles triangle', pentagon: 'regular pentagon', quad: 'quadrilateral' }[shape];
  const body = polygon(pts) + ticks + labels.map(([lx, ly, s]) => text(lx, ly, s, { italic: true, size: 15 })).join('') + notDrawnAccurately(360, 210, { anchor: 'end' });
  const lengths = sides.map((s) => (s[1] === 0 ? lin(s[0], 0, x) : `(${lin(s[0], s[1], x)})`));
  return {
    prompt: `Here is ${/^[aeiou]/.test(name) ? "an" : "a"} ${name}. The lengths are in centimetres.<br>Write an expression for its perimeter. Simplify your answer.`,
    visual: svg(370, 220, body),
    answer: $(ans),
    distractors: dis.map($),
    solution: [
      `The perimeter is the total distance around the outside, so add <b>all ${sides.length} sides</b>${distinct.length < sides.length ? ' (including the ones that are equal but not labelled)' : ''}.`,
      `$${lengths.join(' + ')}$`,
      `Collect the $${x}$ terms: $${tnum(total[0])}${x}$. Collect the numbers: $${tnum(total[1])}$.`,
      `Answer: $${ans}$ cm`,
    ],
  };
}, { title: 'Perimeter of a shape with algebraic sides', learn: ['alg-simplify', 'geo-perimeter'] });

/* ================================================================== */
/* alg-substitution                                                    */
/* ================================================================== */

export const substitutionEvaluate = G('alg-sub-evaluate', 'alg-substitution', (rng, d) => {
  const [A, B, C] = pick(rng, [['a', 'b', 'c'], ['p', 'q', 'r'], ['x', 'y', 'z'], ['e', 'f', 'g'], ['m', 'n', 'k']]);
  const pos = () => int(rng, 2, 9);
  const any = () => intExcept(rng, -6, 8, [0, 1]);
  let a; let b; let c;
  if (d === 'easy') { a = pos(); b = pos(); c = pos(); } else if (d === 'medium') { a = pos(); b = -int(rng, 2, 6); c = any(); } else { a = any(); b = -int(rng, 2, 7); c = any(); }
  const k = int(rng, 2, 6); const m = int(rng, 2, 5);
  const templates = size(d,
    ['pApB', 'pAmB', 'AB+C', 'k(A+B)'],
    ['pApB', 'pAmB', 'AB+C', 'k(A+B)', 'A2+B', 'AB-C'],
    ['A2-B2', 'kA2', 'frac', 'A2+B', 'kAB-C2', 'A(B-C)']);
  const t = pick(rng, templates);
  let tex; let val; let wrong = []; let work;
  switch (t) {
    case 'pApB': tex = `${k}${A} + ${m}${B}`; val = k * a + m * b; wrong = [Number(`${k}${Math.abs(a)}`) + Number(`${m}${Math.abs(b)}`), k * a - m * b, k + a + m + b, k * a + m]; work = `${k} \\times ${paren(a)} + ${m} \\times ${paren(b)} = ${tnum(k * a)} + ${paren(m * b)}`; break;
    case 'pAmB': tex = `${k}${A} - ${m}${B}`; val = k * a - m * b; wrong = [k * a + m * b, m * b - k * a, k * a - m - b, -(k * a) - m * b]; work = `${k} \\times ${paren(a)} - ${m} \\times ${paren(b)} = ${tnum(k * a)} - ${paren(m * b)}`; break;
    case 'AB+C': tex = `${A}${B} + ${C}`; val = a * b + c; wrong = [a + b + c, a * (b + c), a * b - c, Number(`${Math.abs(a)}${Math.abs(b)}`) + c]; work = `${paren(a)} \\times ${paren(b)} + ${paren(c)} = ${tnum(a * b)} + ${paren(c)}`; break;
    case 'AB-C': tex = `${A}${B} - ${C}`; val = a * b - c; wrong = [a * b + c, a + b - c, a * (b - c), -a * b - c]; work = `${paren(a)} \\times ${paren(b)} - ${paren(c)} = ${tnum(a * b)} - ${paren(c)}`; break;
    case 'k(A+B)': tex = `${k}(${A} + ${B})`; val = k * (a + b); wrong = [k * a + b, k + a + b, k * a * b, k * (a - b)]; work = `${k} \\times (${tnum(a)} + ${paren(b)}) = ${k} \\times ${paren(a + b)}`; break;
    case 'A2+B': tex = `${A}^{2} + ${B}`; val = a * a + b; wrong = [2 * a + b, -(a * a) + b, a * a - b, (a + b) ** 2]; work = `${paren(a)}^{2} + ${paren(b)} = ${tnum(a * a)} + ${paren(b)}`; break;
    case 'A2-B2': tex = `${A}^{2} - ${B}^{2}`; val = a * a - b * b; wrong = [a * a + b * b, 2 * a - 2 * b, (a - b) ** 2, a * a - 2 * b]; work = `${paren(a)}^{2} - ${paren(b)}^{2} = ${tnum(a * a)} - ${tnum(b * b)}`; break;
    case 'kA2': tex = `${k}${B}^{2}`; val = k * b * b; wrong = [(k * b) ** 2, -k * b * b, 2 * k * b, k * b * 2 + 0.5 * 0]; work = `${k} \\times ${paren(b)}^{2} = ${k} \\times ${tnum(b * b)}`; break;
    case 'frac': {
      // (a² + b) / c with a clean result: choose c dividing a² + b.
      const top = a * a + b;
      const divs = [2, 3, 4, 5, -2, -3].filter((x) => top % x === 0 && top !== 0);
      if (!divs.length) throw new Error('no divisor');
      c = pick(rng, divs);
      tex = tf(`${A}^{2} + ${B}`, C); val = top / c;
      wrong = [(a * a - b) / c, (-(a * a) + b) / c, a * a + b / c, (2 * a + b) / c].filter(Number.isInteger);
      work = `${tf(`${paren(a)}^{2} + ${paren(b)}`, paren(c))} = ${tnum(top)} \\div ${paren(c)}`;
      break;
    }
    case 'kAB-C2': tex = `${k}${A}${B} - ${C}^{2}`; val = k * a * b - c * c; wrong = [k * a * b + c * c, k * a * b - 2 * c, k * a * b + 2 * c, -(k * a * b) - c * c]; work = `${k} \\times ${paren(a)} \\times ${paren(b)} - ${paren(c)}^{2} = ${tnum(k * a * b)} - ${tnum(c * c)}`; break;
    default: tex = `${A}(${B} - ${C})`; val = a * (b - c); wrong = [a * b - c, a * (b + c), a * b + a * c, -a * (b - c)]; work = `${paren(a)} \\times (${tnum(b)} - ${paren(c)}) = ${paren(a)} \\times ${paren(b - c)}`; break;
  }
  const used = [[A, a], [B, b], [C, c]].filter(([l]) => tex.includes(l));
  const given = used.map(([l, v]) => `$${l} = ${tnum(v)}$`).join(', ').replace(/, ([^,]*)$/, ' and $1');
  return {
    prompt: `Work out the value of &nbsp;$${tex}$&nbsp; when ${given}.`,
    answer: $(tnum(val)),
    distractors: [...wrong, -val, val + 2, val - 2].filter((w) => Number.isInteger(w)).map((w) => $(tnum(w))),
    typed: { kind: 'number', value: val },
    hint: 'Replace each letter by its value in brackets, then use the order of operations (powers before multiplying, multiplying before adding).',
    solution: [
      `Substitute ${given} (put negative numbers in brackets).`,
      `$${work}$`,
      ...(t === 'kA2' ? [`Square first, then multiply: $${paren(b)}^{2} = ${tnum(b * b)}$ (a negative number squared is positive).`] : []),
      `$= ${tnum(val)}$`,
      `Answer: $${tnum(val)}$`,
    ],
  };
}, { title: 'Substitute values into an expression' });

export const substitutionSquares = G('alg-sub-negative-power', 'alg-substitution', (rng, d) => {
  const x = pick(rng, ['x', 'a', 'n', 't', 'y']);
  const v = d === 'easy' ? int(rng, 2, 6) : -int(rng, 2, 6);
  const k = int(rng, 2, 5); const c = int(rng, 3, 30);
  const forms = size(d, ['kx2', 'x2+c', 'c-kx'], ['kx2', 'x2+c', 'c-x2', 'x3'], ['c-kx2', 'x3+kx', 'kx2-x', 'x2-kx']);
  const f = pick(rng, forms);
  const T = {
    kx2: [`${k}@^{2}`, k * v * v, [(k * v) ** 2, -k * v * v, 2 * k * v]],
    'x2+c': [`@^{2} + ${c}`, v * v + c, [2 * v + c, -v * v + c, v * v - c]],
    'c-kx': [`${c} - ${k}@`, c - k * v, [c + k * v, k * v - c, (c - k) * v, c - k + v]],
    'c-x2': [`${c} - @^{2}`, c - v * v, [c + v * v, c - 2 * v, c + 2 * v, v * v - c]],
    x3: ['@^{3}', v ** 3, [-(v ** 3), 3 * v, v * v, -3 * v]],
    'c-kx2': [`${c} - ${k}@^{2}`, c - k * v * v, [c + k * v * v, c - (k * v) ** 2, (c - k) * v * v, c - 2 * k * v]],
    'x3+kx': [`@^{3} + ${k}@`, v ** 3 + k * v, [-(v ** 3) + k * v, 3 * v + k * v, v ** 3 - k * v, -(v ** 3) - k * v]],
    'kx2-x': [`${k}@^{2} - @`, k * v * v - v, [k * v * v + v, (k * v) ** 2 - v, -k * v * v - v, 2 * k * v - v]],
    'x2-kx': [`@^{2} - ${k}@`, v * v - k * v, [v * v + k * v, -v * v - k * v, 2 * v - k * v, -v * v + k * v]],
  };
  const [tmpl, val, wrong] = T[f];
  const tex = tmpl.replace(/@/g, x);
  const subbed = tmpl.replace(/(\d)@/g, '$1 \\times @').replace(/@/g, paren(v));
  const hasPow = tmpl.includes('^');
  const cube = tmpl.includes('^{3}');
  let powNote = 'Multiply before you add or subtract.';
  if (hasPow && v < 0) powNote = `Powers first. A negative squared is positive: $${paren(v)}^{2} = ${tnum(v * v)}$${cube ? `, but a negative cubed is negative: $${paren(v)}^{3} = ${tnum(v ** 3)}$` : ''}.`;
  else if (hasPow) powNote = `Powers first: $${v}^{2} = ${v * v}$${cube ? ` and $${v}^{3} = ${v ** 3}$` : ''}.`;
  return {
    prompt: `Work out the value of &nbsp;$${tex}$&nbsp; when $${x} = ${tnum(v)}$.`,
    answer: $(tnum(val)),
    distractors: [...wrong, val + 1, val - 1, -val].filter((w) => w !== val).map((w) => $(tnum(w))),
    typed: { kind: 'number', value: val },
    solution: [
      `Replace $${x}$ with $${paren(v)}$${v < 0 ? ' (use a bracket so the sign is not lost)' : ''}: $${subbed}$`,
      powNote,
      ...(/^\d+@\^/.test(tmpl) || /- \d+@\^/.test(tmpl) ? [`Only $${x}$ is squared, not $${k}${x}$: $${k} \\times ${tnum(v * v)} = ${tnum(k * v * v)}$`] : []),
      `$${subbed} = ${tnum(val)}$`,
      `Answer: $${tnum(val)}$`,
    ],
  };
}, { title: 'Substitute a negative into powers' });

export const substitutionCompare = G('alg-sub-compare', 'alg-substitution', (rng, d) => {
  const x = 'x';
  const half = d === 'hard' && chance(rng, 0.5);
  const v = half ? frac(1, pick(rng, [2, 4])) : d === 'easy' ? int(rng, 3, 6) : -int(rng, 2, 4);
  const want = pick(rng, ['greatest', 'smallest']);
  const k = int(rng, 2, 5);
  // Exact values with fractions; √x only appears when it is exact.
  const V = frac(typeof v === 'number' ? v : v.n, typeof v === 'number' ? 1 : v.d);
  const rootN = Math.sqrt(Math.abs(V.n)); const rootD = Math.sqrt(V.d);
  const exactRoot = V.n > 0 && Number.isInteger(rootN) && Number.isInteger(rootD);
  const pool = [
    [`${x}^{2}`, (t) => t.mul(t)], [`${x}^{3}`, (t) => t.mul(t).mul(t)], [`${k}${x}`, (t) => t.mul(k)], [`-${x}`, (t) => t.neg()],
    [`${x} + ${k}`, (t) => t.add(k)], [`${x} - ${k}`, (t) => t.sub(k)], [tf(1, x), (t) => t.inv()], [`${k} - ${x}`, (t) => frac(k).sub(t)], [tf(x, 2), (t) => t.div(2)],
    ...(exactRoot ? [[`\\sqrt{${x}}`, () => frac(rootN, rootD)]] : []),
  ];
  for (let tries = 0; tries < 50; tries += 1) {
    const chosen = sample(rng, pool, 4);
    const exact = chosen.map(([, f]) => f(V));
    const vals = exact.map((t) => t.value());
    const target = want === 'greatest' ? Math.max(...vals) : Math.min(...vals);
    if (vals.filter((y) => Math.abs(y - target) < 1e-9).length !== 1) continue;
    const ansIdx = vals.findIndex((y) => Math.abs(y - target) < 1e-9);
    const fmt = (y) => exact[vals.indexOf(y)].tex();
    const hasPow = chosen.some(([s]) => /\^/.test(s));
    return {
      prompt: `Here are four expressions: &nbsp; ${shuffle(rng, chosen).map(([s]) => `$${s}$`).join(' &nbsp;&nbsp; ')}<br>When $${x} = ${typeof v === 'number' ? tnum(v) : v.tex()}$, which expression has the <b>${want}</b> value?`,
      answer: $(chosen[ansIdx][0]),
      distractors: chosen.filter((_, i) => i !== ansIdx).map(([s]) => $(s)),
      count: 4,
      solution: [
        `Substitute $${x} = ${typeof v === 'number' ? tnum(v) : v.tex()}$ into each expression.`,
        chosen.map(([s], i) => `$${s} = ${fmt(vals[i])}$`).join(', &nbsp; '),
        ...(hasPow && typeof v === 'number' && v < 0 ? ['Careful with negatives: squaring makes them positive, cubing keeps them negative.'] : []),
        ...(hasPow && half ? ['For a number between 0 and 1, squaring and cubing make it <b>smaller</b>.'] : []),
        `The ${want} value is $${fmt(target)}$.`,
        `Answer: $${chosen[ansIdx][0]}$`,
      ],
    };
  }
  throw new Error('no unique extreme');
}, { title: 'Which expression is greatest/smallest for a given value' });

/* ================================================================== */
/* alg-expand-single                                                   */
/* ================================================================== */

export const expandSingle = G('alg-expand-single-basic', 'alg-expand-single', (rng, d) => {
  const x = pick(rng, ['x', 'a', 'y', 'n', 'p', 'm']);
  const form = pick(rng, size(d, ['k(ax+b)', 'k(ax+b)', 'x(x+b)'], ['-k(ax+b)', 'x(ax+b)', 'k(ax+b)'], ['kx(ax+by)', 'kx2(x3+b)', '-kx(ax+b)']));
  let tex; let ans; let dis; let steps;
  if (form === 'k(ax+b)' || form === '-k(ax+b)') {
    const k = form === 'k(ax+b)' ? int(rng, 2, 9) : -int(rng, 2, 7);
    const a = d === 'easy' ? pick(rng, [1, 1, 2, 3]) : int(rng, 2, 6);
    const b = d === 'easy' ? int(rng, 1, 9) : intExcept(rng, -9, 9, [0]);
    tex = `${coefTex(k)}${br(a, b, x)}`;
    ans = lin(k * a, k * b, x);
    dis = [lin(k * a, b, x), lin(k * a, -k * b, x), lin(a, k * b, x), lin(k + a, k + b, x), lin(k * a, k * b + 0, x).replace(/^/, ''), terms([[k * a + k * b, x]]), lin(-k * a, k * b, x)];
    steps = [`Multiply <b>each</b> term inside the bracket by $${tnum(k)}$.`, `$${tnum(k)} \\times ${kxTex(a, x)} = ${kxTex(k * a, x)}$ and $${tnum(k)} \\times ${paren(b)} = ${tnum(k * b)}$`];
    if (k < 0) steps.push(`A negative times a ${b < 0 ? 'negative is positive' : 'positive is negative'}.`);
  } else if (form === 'x(x+b)' || form === 'x(ax+b)') {
    const a = form === 'x(x+b)' ? 1 : int(rng, 2, 5);
    const b = intExcept(rng, -9, 9, [0]);
    tex = `${x}${br(a, b, x)}`;
    ans = P([a, b, 0], x);
    dis = [lin(a + 0, b, x).replace(/^/, ''), P([a, 0, b], x), lin(a, b, x) + ` + ${x}`, P([a, -b, 0], x), terms([[a, `${x}^{2}`], [b, '']]), `${tnum(a + b)}${x}^{2}`];
    steps = [`Multiply each term inside by $${x}$.`, `$${x} \\times ${kxTex(a, x)} = ${terms([[a, `${x}^{2}`]])}$ and $${x} \\times ${paren(b)} = ${kxTex(b, x)}$`];
  } else if (form === '-kx(ax+b)') {
    const k = -int(rng, 2, 5); const a = int(rng, 2, 5); const b = intExcept(rng, -9, 9, [0]);
    tex = `${coefTex(k)}${x}${br(a, b, x)}`;
    ans = P([k * a, k * b, 0], x);
    dis = [P([k * a, -k * b, 0], x), P([k * a, b, 0], x), P([k * a, k * b], x), P([-k * a, k * b, 0], x), P([k * a, 0, k * b], x)];
    steps = [`Multiply each term inside by $${coefTex(k)}${x}$.`, `$${coefTex(k)}${x} \\times ${kxTex(a, x)} = ${terms([[k * a, `${x}^{2}`]])}$ and $${coefTex(k)}${x} \\times ${paren(b)} = ${kxTex(k * b, x)}$`];
  } else if (form === 'kx(ax+by)') {
    const y = x === 'y' ? 'z' : 'y';
    const k = int(rng, 2, 6); const a = int(rng, 2, 5); const b = intExcept(rng, -7, 7, [0]);
    tex = `${k}${x}(${terms([[a, x], [b, y]])})`;
    ans = terms([[k * a, `${x}^{2}`], [k * b, `${x}${y}`]]);
    dis = [terms([[k * a, `${x}^{2}`], [b, y]]), terms([[k * a, x], [k * b, `${x}${y}`]]), terms([[k * a, `${x}^{2}`], [-k * b, `${x}${y}`]]), terms([[k * a, `${x}^{2}`], [k * b, y]]), terms([[k + a, `${x}^{2}`], [k + b, `${x}${y}`]])];
    steps = [`Multiply each term inside by $${k}${x}$.`, `$${k}${x} \\times ${a}${x} = ${k * a}${x}^{2}$ and $${k}${x} \\times ${b < 0 ? `(${kxTex(b, y)})` : kxTex(b, y)} = ${kxTex(k * b, `${x}${y}`)}$`];
  } else {
    const k = int(rng, 2, 7); const p = int(rng, 2, 4); const b = intExcept(rng, -9, 9, [0]);
    tex = `${k}${x}^{2}(${x}^{${p}} ${b < 0 ? '-' : '+'} ${Math.abs(b)})`;
    ans = terms([[k, `${x}^{${p + 2}}`], [k * b, `${x}^{2}`]]);
    dis = [terms([[k, `${x}^{${2 * p}}`], [k * b, `${x}^{2}`]]), terms([[k, `${x}^{${p + 2}}`], [b, '']]), terms([[k, `${x}^{${p + 2}}`], [k * b, '']]), terms([[k, `${x}^{${p + 2}}`], [-k * b, `${x}^{2}`]]), terms([[k, `${x}^{${p}}`], [k * b, `${x}^{2}`]])];
    steps = [`Multiply each term inside by $${k}${x}^{2}$. When multiplying powers of the same letter, <b>add</b> the indices.`, `$${k}${x}^{2} \\times ${x}^{${p}} = ${k}${x}^{${p + 2}}$ and $${k}${x}^{2} \\times ${paren(b)} = ${terms([[k * b, `${x}^{2}`]])}$`];
  }
  return {
    prompt: `Expand &nbsp; $${tex}$`,
    answer: $(ans),
    distractors: dis.filter((s) => s !== ans).map($),
    hint: 'The term outside multiplies every term inside the bracket.',
    solution: [...steps, `Answer: $${ans}$`],
  };
}, { title: 'Expand a single bracket' });

function kxTex(c, v) { return terms([[c, v]]); }

export const expandSimplify = G('alg-expand-simplify', 'alg-expand-single', (rng, d) => {
  const x = pick(rng, ['x', 'a', 'c', 'y', 'n', 'p']);
  const p = int(rng, 2, 6); const a = int(rng, 1, 5); const b = int(rng, 1, 9);
  let q = int(rng, 2, 5); const c = int(rng, 1, 4); let e = int(rng, 1, 9);
  let s = 1; // sign in front of the second bracket
  let xOutside = false;
  if (d === 'easy') { s = 1; } else if (d === 'medium') { s = -1; if (chance(rng)) q = 1; } else {
    s = -1; e = -int(rng, 1, 9);
    if (chance(rng, 0.4)) xOutside = true;
  }
  if (!xOutside) {
    const k2 = s * q;
    const r1 = k2 * c + p * a; const r0 = p * b + k2 * e;
    if (r1 === 0) throw new Error('zero x term');
    const tex = `${p}${br(a, b, x)} ${s < 0 ? '-' : '+'} ${q === 1 ? '' : q}${br(c, e, x)}`;
    const ans = lin(r1, r0, x);
    const dis = [
      lin(r1, p * b - k2 * e, x), // sign slip on the last term
      lin(r1, b + k2 * e, x), // forgot to multiply the second term of the first bracket
      lin(r1, p * b + s * e, x), // forgot to multiply the second term of the second bracket
      lin(p * a + q * c, p * b + q * e, x), // ignored the minus sign
      lin(r1, -r0, x),
      lin(r1 + 1, r0, x),
    ];
    return {
      prompt: `Expand and simplify &nbsp; $${tex}$`,
      answer: $(ans), distractors: dis.filter((t) => t !== ans).map($),
      hint: s < 0 ? 'The minus sign in front of the second bracket multiplies both terms inside it.' : 'Expand each bracket, then collect like terms.',
      solution: [
        `Expand each bracket: $${p}${br(a, b, x)} = ${lin(p * a, p * b, x)}$`,
        `$${s < 0 ? '-' : '+'}${q === 1 ? '' : q}${br(c, e, x)} = ${lin(k2 * c, k2 * e, x)}$${s < 0 ? ` &nbsp;(the minus multiplies <b>both</b> terms: $${tnum(-q)} \\times ${paren(e)} = ${tnum(k2 * e)}$)` : ''}`,
        `Collect like terms: $${terms([[p * a, x], [k2 * c, x]])} = ${kxTex(r1, x)}$ and $${tnum(p * b)} ${signed(k2 * e)} = ${tnum(r0)}$`,
        `Answer: $${ans}$`,
      ],
    };
  }
  // x(x + b) − q(x + e)
  const bb = intExcept(rng, -6, 9, [0]);
  const tex = `${x}${br(1, bb, x)} - ${q}${br(1, e, x)}`;
  const coefs = [1, bb - q, -q * e];
  const ans = P(coefs, x);
  const dis = [P([1, bb - q, q * e], x), P([1, bb + q, -q * e], x), P([1, bb - q, -e], x), P([1, bb, -q * e], x), P([1, bb - q, -q * e + 1], x), P([2, bb - q, -q * e], x)];
  return {
    prompt: `Expand and simplify &nbsp; $${tex}$`,
    answer: $(ans), distractors: dis.filter((t) => t !== ans).map($),
    solution: [
      `$${x}${br(1, bb, x)} = ${P([1, bb, 0], x)}$`,
      `$-${q}${br(1, e, x)} = ${lin(-q, -q * e, x)}$ &nbsp;(the minus multiplies both terms)`,
      `Collect the $${x}$ terms: $${terms([[bb, x], [-q, x]])} = ${kxTex(bb - q, x)}$`,
      `Answer: $${ans}$`,
    ],
  };
}, { title: 'Expand two brackets and simplify' });

export const expandMissing = G('alg-expand-missing', 'alg-expand-single', (rng, d) => {
  const x = pick(rng, ['x', 'y', 'a', 'n']);
  const k = size(d, int(rng, 2, 6), int(rng, 2, 9), int(rng, 6, 12)); const a = size(d, int(rng, 1, 5), int(rng, 1, 6), int(rng, 2, 9)); const b = size(d, int(rng, 1, 9), intExcept(rng, -9, 9, [0]), intExcept(rng, -15, 15, [0, 1, -1]));
  const which = pick(rng, size(d, ['const', 'outside'], ['const', 'coef', 'outside'], ['const', 'coef', 'neg']));
  let lhs; let rhs; let val; let sol;
  const box = '\\square';
  if (which === 'const') {
    lhs = `${k}(${kxTex(a, x)} ${b < 0 ? '-' : '+'} ${box})`; rhs = lin(k * a, k * b, x); val = Math.abs(b);
    sol = [`The number outside multiplies the missing number to give $${tnum(Math.abs(k * b))}$.`, `$${k} \\times ${box} = ${Math.abs(k * b)}$, so $${box} = ${Math.abs(k * b)} \\div ${k} = ${Math.abs(b)}$`];
  } else if (which === 'coef') {
    lhs = `${k}(${box} ${x} ${b < 0 ? '-' : '+'} ${Math.abs(b)})`; rhs = lin(k * a, k * b, x); val = a;
    if (a === 1) throw new Error('trivial');
    sol = [`The number outside multiplies the $${x}$ term to give $${k * a}${x}$.`, `$${k} \\times ${box} = ${k * a}$, so $${box} = ${k * a} \\div ${k} = ${a}$`];
  } else if (which === 'outside') {
    lhs = `${box}${br(a, b, x)}`; rhs = lin(k * a, k * b, x); val = k;
    sol = [`The missing number multiplies both terms in the bracket.`, `$${box} \\times ${a === 1 ? x : `${a}${x}`} = ${k * a}${x}$, so $${box} = ${k}$. Check: $${k} \\times ${paren(b)} = ${tnum(k * b)}$ ✓`];
  } else {
    lhs = `-${k}(${kxTex(a, x)} ${b < 0 ? '-' : '+'} ${box})`; rhs = lin(-k * a, -k * b, x); val = Math.abs(b);
    sol = [`$-${k} \\times (${b < 0 ? '-' : '+'}${box}) = ${tnum(-k * b)}$`, `So $${box} = ${Math.abs(k * b)} \\div ${k} = ${Math.abs(b)}$`];
  }
  return {
    prompt: `Work out the missing number. <br>$${lhs} = ${rhs}$`,
    answer: $(tnum(val)),
    distractors: [k * Math.abs(b), Math.abs(k * b) - k, Math.abs(k * b) + k, val + 1, val - 1, k * a, Math.abs(b) + k].filter((v) => v > 0 && v !== val).map((v) => $(tnum(v))),
    typed: { kind: 'number', value: val },
    solution: [...sol, `Answer: $${val}$`],
  };
}, { title: 'Missing number in an expansion' });

/* ================================================================== */
/* alg-factorise-single                                                */
/* ================================================================== */

export const factoriseNumbers = G('alg-factorise-numeric', 'alg-factorise-single', (rng, d) => {
  const [u, v] = pick(rng, [['a', 'b'], ['x', 'y'], ['p', 'q'], ['m', 'n'], ['c', 'd'], ['s', 't']]);
  const g = size(d, pick(rng, [2, 3, 4, 5]), pick(rng, [3, 4, 5, 6, 7, 8]), pick(rng, [6, 8, 9, 10, 12, 14, 15, 25, 50]));
  let p; let q;
  do { p = int(rng, 1, 9); q = int(rng, 2, 9); } while (gcd(p, q) !== 1 || p === q);
  const withLetter = d === 'hard' ? chance(rng, 0.5) : chance(rng, 0.6);
  const sgnQ = d === 'easy' ? 1 : pick(rng, [1, -1]);
  const t1 = [g * p, u]; const t2 = [sgnQ * g * q, withLetter ? v : ''];
  const tex = terms([t1, t2]);
  const inner = terms([[p, u], [sgnQ * q, t2[1]]]);
  const ans = `${g}(${inner})`;
  const smaller = [2, 3, 4, 5, 6, 7].filter((f) => g % f === 0 && f < g);
  const dis = [
    ...smaller.map((f) => `${f}(${terms([[(g / f) * p, u], [(sgnQ * g * q) / f, t2[1]]])})`),
    `${g}(${terms([[p, u], [-sgnQ * q, t2[1]]])})`,
    `${g}(${terms([[p, u], [sgnQ * g * q, t2[1]]])})`,
    `${g}(${terms([[g * p, u], [sgnQ * q, t2[1]]])})`,
    ...(withLetter ? [`${g}${u}(${terms([[p, ''], [sgnQ * q, t2[1]]])})`] : []),
    `${g + 1}(${terms([[p, u], [sgnQ * q, t2[1]]])})`,
  ];
  return {
    prompt: `Factorise fully &nbsp; $${tex}$`,
    answer: $(ans),
    distractors: dis.filter((s) => s !== ans).map($),
    hint: 'Find the highest common factor of the numbers and put it outside the bracket.',
    solution: [
      `The highest common factor of ${g * p} and ${Math.abs(g * q)} is ${g}.`,
      `Divide each term by ${g}: $${terms([t1])} \\div ${g} = ${terms([[p, u]])}$ and $${terms([t2])} \\div ${g} = ${terms([[sgnQ * q, t2[1]]])}$`,
      `Check by expanding: $${g}(${inner}) = ${tex}$ ✓`,
      `Answer: $${ans}$`,
    ],
  };
}, { title: 'Factorise out a number' });

export const factoriseVariable = G('alg-factorise-variable', 'alg-factorise-single', (rng, d) => {
  const x = pick(rng, ['x', 'a', 'y', 'n', 'p', 't']);
  const g = size(d, 1, pick(rng, [2, 3, 4, 5]), pick(rng, [2, 3, 4, 5, 6, 7]));
  let p; let q;
  do { p = size(d, 1, int(rng, 1, 4), int(rng, 1, 5)); q = intExcept(rng, -9, 9, [0]); } while (gcd(p, q) !== 1);
  const highPow = d === 'hard' && chance(rng, 0.5) ? 3 : 2;
  // g p x^highPow + g q x  (or g p x^3 + g q x^2)
  const lowPow = highPow === 3 ? 2 : 1;
  const pw = (n) => (n === 1 ? x : `${x}^{${n}}`);
  const tex = terms([[g * p, pw(highPow)], [g * q, pw(lowPow)]]);
  const out = `${g === 1 ? '' : g}${pw(lowPow)}`;
  const inner = terms([[p, pw(highPow - lowPow)], [q, '']]);
  const ans = `${out}(${inner})`;
  const dis = [
    `${g === 1 ? '' : g}${x}(${terms([[p, pw(highPow - 1)], [q, lowPow === 2 ? x : '']])})`,
    ...(g > 1 ? [`${g}(${terms([[p, pw(highPow)], [q, pw(lowPow)]])})`, `${pw(lowPow)}(${terms([[g * p, pw(highPow - lowPow)], [g * q, '']])})`] : [`${x}(${terms([[p, pw(highPow)], [q, '']])})`]),
    `${out}(${terms([[p, pw(highPow - lowPow)], [-q, '']])})`,
    `${out}(${terms([[p, pw(highPow)], [q, '']])})`,
    `${out}(${terms([[p, pw(highPow - lowPow)], [q, x]])})`,
    `${out}(${terms([[g * p, pw(highPow - lowPow)], [q, '']])})`,
    `${Math.abs(q) > 1 ? Math.abs(q) * g : 2 * g}${pw(lowPow)}(${terms([[p, pw(highPow - lowPow)], [Math.sign(q), ""]])})`,
    `${g === 1 ? "" : g}${pw(highPow)}(${terms([[p, ""], [q, x]])})`,
  ];
  return {
    prompt: `Factorise fully &nbsp; $${tex}$`,
    answer: $(ans),
    distractors: dis.filter((s) => s !== ans).map($),
    hint: 'Look for a common number AND a common power of the letter.',
    solution: [
      `Both terms share ${g > 1 ? `the number ${g} and ` : ''}$${pw(lowPow)}$, so the highest common factor is $${out}$.`,
      `Divide each term by $${out}$: $${terms([[g * p, pw(highPow)]])} \\div ${out} = ${terms([[p, pw(highPow - lowPow)]])}$ and $${terms([[g * q, pw(lowPow)]])} \\div ${out} = ${tnum(q)}$`,
      `"Fully" means nothing more can be taken out of the bracket.`,
      `Answer: $${ans}$`,
    ],
  };
}, { title: 'Factorise with a letter in the common factor' });

export const factoriseMulti = G('alg-factorise-multi', 'alg-factorise-single', (rng, d) => {
  const [x, y] = pick(rng, [['x', 'y'], ['a', 'b'], ['p', 'q'], ['m', 'n']]);
  const g = size(d, pick(rng, [1, 2, 3]), pick(rng, [2, 3, 4, 5]), pick(rng, [2, 3, 4, 5, 6]));
  if (d !== 'hard' || chance(rng, 0.5)) {
    // g·x·y common: g p x² y + g q x y²   (easy: x y common only)
    let p; let q;
    do { p = int(rng, 1, 5); q = intExcept(rng, -7, 7, [0]); } while (gcd(p, q) !== 1);
    const tex = monos([[g * p, [[x, 2], [y, 1]]], [g * q, [[x, 1], [y, 2]]]]);
    const out = `${g === 1 ? '' : g}${x}${y}`;
    const inner = terms([[p, x], [q, y]]);
    const ans = `${out}(${inner})`;
    const dis = [
      `${g === 1 ? '' : g}${x}(${monos([[p, [[x, 1], [y, 1]]], [q, [[y, 2]]]])})`,
      `${g === 1 ? '' : g}${y}(${monos([[p, [[x, 2]]], [q, [[x, 1], [y, 1]]]])})`,
      `${out}(${terms([[p, x], [-q, y]])})`,
      `${out}(${monos([[p, [[x, 2]]], [q, [[y, 2]]]])})`,
      `${g + 1}${x}${y}(${inner})`,
      ...(g > 1 ? [`${x}${y}(${terms([[g * p, x], [g * q, y]])})`] : [`${x}${y}(${terms([[p, x], [q, '']])})`]),
    ];
    return {
      prompt: `Factorise fully &nbsp; $${tex}$`,
      answer: $(ans), distractors: dis.filter((s) => s !== ans).map($),
      solution: [
        `Numbers: the HCF of ${g * p} and ${Math.abs(g * q)} is ${g}.`,
        `Letters: both terms contain at least one $${x}$ and one $${y}$, so $${x}${y}$ is common.`,
        `Take out $${out}$: what is left is $${kxTex(p, x)}$ from the first term and $${kxTex(q, y)}$ from the second.`,
        `Answer: $${ans}$`,
      ],
    };
  }
  // Three terms with common g x: g a x³ + g b x² + g c x
  let a; let b; let c;
  do { a = int(rng, 1, 4); b = intExcept(rng, -6, 6, [0]); c = intExcept(rng, -9, 9, [0]); } while (hcfList([a, b, c]) !== 1);
  const tex = P([g * a, g * b, g * c, 0], x);
  const out = `${g}${x}`;
  const ans = `${out}(${P([a, b, c], x)})`;
  const dis = [
    `${g}(${P([a, b, c, 0], x)})`,
    `${x}(${P([g * a, g * b, g * c], x)})`,
    `${out}(${P([a, b, c, 0], x).replace(/x$/, '')})`,
    `${out}(${P([a, -b, c], x)})`,
    `${out}(${P([a, b, -c], x)})`,
    `${g}${x}^{2}(${P([a, b, c], x)})`,
  ];
  return {
    prompt: `Factorise fully &nbsp; $${tex}$`,
    answer: $(ans), distractors: dis.filter((s) => s !== ans).map($),
    solution: [
      `Every term has a factor of ${g} and a factor of $${x}$, so take out $${out}$.`,
      `Divide each term by $${out}$: $${terms([[g * a, `${x}^{3}`]])} \\to ${terms([[a, `${x}^{2}`]])}$, $${terms([[g * b, `${x}^{2}`]])} \\to ${kxTex(b, x)}$, $${kxTex(g * c, x)} \\to ${tnum(c)}$`,
      `Answer: $${ans}$`,
    ],
  };
}, { title: 'Factorise with two letters or three terms' });

/* ================================================================== */
/* alg-index-laws                                                      */
/* ================================================================== */

const pw = (x, n) => (n === 1 ? x : `${x}^{${n}}`);
const coefPow = (c, x, n) => (n === 0 ? tnum(c) : `${c === 1 ? '' : c === -1 ? '-' : tnum(c)}${pw(x, n)}`);

export const indexMulDiv = G('alg-index-mul-div', 'alg-index-laws', (rng, d) => {
  const x = pick(rng, ['x', 'a', 'y', 'm', 'p', 'w']);
  const op = pick(rng, ['mul', 'div']);
  const p = int(rng, 2, 7); const q = int(rng, 2, 6);
  let m = int(rng, 2, 7); let n = int(rng, 2, 6);
  if (d === 'hard') { if (op === 'mul') n = -int(rng, 1, 4); else m = int(rng, 2, 5), n = m + int(rng, 1, 3); }
  if (d === 'easy') { if (op === 'div' && n >= m) [m, n] = [n + 1, m]; }
  let tex; let ans; let dis; let sol;
  if (op === 'mul') {
    const e = m + n;
    if (e === 0 || e === 1 && false) throw new Error('zero power');
    tex = `${coefPow(p, x, m)} \\times ${coefPow(q, x, n)}`;
    ans = coefPow(p * q, x, e);
    dis = [coefPow(p + q, x, e), coefPow(p * q, x, m * n), coefPow(p + q, x, m * n), coefPow(p * q, x, m - n), coefPow(p * q, x, e + 1)].filter((s) => !/\^\{0\}/.test(s));
    sol = [`Multiply the numbers: $${p} \\times ${q} = ${p * q}$.`, `Multiplying powers of the same letter: <b>add</b> the indices: $${m} + ${paren(n)} = ${e}$.`];
  } else {
    const big = p * q;
    const e = m - n;
    tex = d === 'easy' ? `${coefPow(big, x, m)} \\div ${coefPow(q, x, n)}` : tf(coefPow(big, x, m), coefPow(q, x, n));
    if (e === 0) throw new Error('zero power');
    ans = e < 0 ? tf(p, pw(x, -e)) : coefPow(p, x, e);
    // Same form as the answer: a fraction when the power is negative.
    const f = (c, ee) => (ee < 0 ? tf(c, pw(x, -ee)) : coefPow(c, x, ee));
    dis = [f(big - q, e), f(p, m / n), f(p, m + n), f(big * q, e), e < 0 ? coefPow(p, x, -e) : tf(p, pw(x, e)), f(p, e - 1)]
      .filter((s) => s && !/NaN|\./.test(s) && !/\^\{0\}/.test(s));
    sol = [`Divide the numbers: $${big} \\div ${q} = ${p}$.`, `Dividing powers of the same letter: <b>subtract</b> the indices: $${m} - ${n} = ${e}$.`];
    if (e < 0) sol.push(`A negative power means "one over": $${p}${x}^{${e}} = ${ans}$.`);
  }
  return {
    prompt: `Simplify &nbsp; $${tex}$`,
    answer: $(ans), distractors: dis.filter((s) => s !== ans).map($),
    solution: [...sol, `Answer: $${ans}$`],
  };
}, { title: 'Multiply and divide terms with powers' });

export const indexPowerOfProduct = G('alg-index-power', 'alg-index-laws', (rng, d) => {
  const [x, y] = pick(rng, [['a', 'b'], ['x', 'y'], ['m', 'n'], ['p', 'q']]);
  const k = size(d, 1, pick(rng, [2, 3]), pick(rng, [2, 3, 5]));
  const m = int(rng, 2, 5); const n = size(d, 0, 1, int(rng, 2, 4)); const p = size(d, int(rng, 2, 4), int(rng, 2, 3), int(rng, 2, 3));
  const inside = `${k === 1 ? '' : k}${pw(x, m)}${n ? pw(y, n) : ''}`;
  const tex = `(${inside})^{${p}}`;
  const kp = k ** p;
  const build = (c, e1, e2) => `${c === 1 ? '' : c}${pw(x, e1)}${n ? pw(y, e2) : ''}`;
  const ans = build(kp, m * p, n * p);
  const dis = [
    build(k * p, m * p, n * p), build(kp, m + p, n + p), build(k, m * p, n * p), build(kp, m * p, n), build(kp, m + p, n * p),
    build(k * p, m + p, n + p), `${p}${pw(x, m)}${n ? pw(y, n) : ""}`, build(kp, m * p + 1, n * p), build(kp, Math.abs(m - p) || 1, n * p),
  ];
  return {
    prompt: `Simplify &nbsp; $${tex}$`,
    answer: $(ans), distractors: dis.filter((s) => s !== ans).map($),
    hint: 'Everything inside the bracket is raised to the power — the number too.',
    solution: [
      `The power ${p} applies to every part inside the bracket.`,
      ...(k > 1 ? [`Number: $${k}^{${p}} = ${kp}$ (not $${k} \\times ${p}$).`] : []),
      `Powers of a power: <b>multiply</b> the indices: $(${x}^{${m}})^{${p}} = ${x}^{${m * p}}$${n ? ` and $(${pw(y, n)})^{${p}} = ${pw(y, n * p)}$` : ''}.`,
      `Answer: $${ans}$`,
    ],
  };
}, { title: 'Raise a product to a power' });

export const indexFindPower = G('alg-index-find-power', 'alg-index-laws', (rng, d) => {
  const x = pick(rng, ['x', 'a', 'y', 'n']);
  const a = int(rng, 2, 9); const b = int(rng, 2, 8);
  const form = pick(rng, size(d, ['mul', 'div'], ['mul', 'div', 'pow'], ['neg', 'powdiv', 'pow', 'frac']));
  let eq; let val; let wrong; let sol;
  if (form === 'mul') { eq = `${x}^{${a}} \\times ${x}^{k} = ${x}^{${a + b}}`; val = b; wrong = [a + b, a * b, (a + b) / a, a + 2 * b]; sol = `Multiplying: add the indices, so $${a} + k = ${a + b}$, giving $k = ${b}$.`; }
  else if (form === 'div') { eq = `${x}^{${a + b}} \\div ${x}^{k} = ${x}^{${a}}`; val = b; wrong = [a + b + a, (a + b) / a, a, b + 1]; sol = `Dividing: subtract the indices, so $${a + b} - k = ${a}$, giving $k = ${b}$.`; }
  else if (form === 'pow') { const p = int(rng, 2, 5); eq = `(${x}^{${a}})^{k} = ${x}^{${a * p}}`; val = p; wrong = [a * p - a, a * p, a + p, a * p / 2]; sol = `Power of a power: multiply the indices, so $${a} \\times k = ${a * p}$, giving $k = ${p}$.`; }
  else if (form === 'neg') { eq = `${x}^{${a}} \\times ${x}^{k} = ${x}^{-${b}}`; val = -(a + b); wrong = [a + b, b - a, a - b, -b]; sol = `Add the indices: $${a} + k = -${b}$, so $k = -${b} - ${a} = ${-(a + b)}$.`; }
  else if (form === 'powdiv') { const p = int(rng, 2, 3); const q = int(rng, 2, a * p - 2); eq = `\\dfrac{(${x}^{${a}})^{${p}}}{${x}^{${q}}} = ${x}^{k}`; val = a * p - q; wrong = [a + p - q, a * p + q, a * p, a - q]; sol = `$(${x}^{${a}})^{${p}} = ${x}^{${a * p}}$, then $${x}^{${a * p}} \\div ${x}^{${q}} = ${x}^{${a * p - q}}$, so $k = ${a * p - q}$.`; }
  else { const s = pick(rng, [4, 9, 25, 16]); const r = Math.sqrt(s); eq = `\\sqrt{${x}^{${2 * a}}} = ${x}^{k}`; val = a; wrong = [2 * a - 2, 2 * a, a / 2, a + 2]; void r; sol = `A square root is the power $\\frac{1}{2}$: $(${x}^{${2 * a}})^{\\frac{1}{2}} = ${x}^{${a}}$, so $k = ${a}$.`; }
  return {
    prompt: `Work out the value of $k$.<br>$${eq}$`,
    answer: $(tnum(val)),
    distractors: [...wrong, val + 1, val - 1].filter((w) => Number.isInteger(w) && w !== val).map((w) => $(tnum(w))),
    typed: { kind: 'number', value: val },
    solution: [`Use the index laws: multiply → add indices, divide → subtract indices, power of a power → multiply indices.`, sol, `Answer: $k = ${tnum(val)}$`],
  };
}, { title: 'Find a missing power' });

export const indexNegFrac = G('alg-index-frac-neg', 'alg-index-laws', (rng, d) => {
  const x = pick(rng, ['x', 'a', 'y', 'p']);
  const form = pick(rng, size(d, ['zero', 'one', 'bracketDiv'], ['negative', 'half', 'third'], ['negHalf', 'twoThirds', 'negHalf', 'third']));
  let tex; let ans; let dis; let sol;
  const m = int(rng, 2, 6); const n = int(rng, 2, 6);
  switch (form) {
    case 'zero': { const k = int(rng, 2, 9); tex = `${k}${x}^{0}`; ans = tnum(k); dis = ['1', '0', `${k}${x}`, `${k + 1}`, `${k}${x}^{2}`]; sol = [`Anything (except 0) to the power 0 is 1: $${x}^{0} = 1$.`, `So $${k}${x}^{0} = ${k} \\times 1 = ${k}$.`]; break; }
    case 'one': tex = `${x}^{${m}} \\times ${x}^{0}`; ans = pw(x, m); dis = ['0', `${x}^{0}`, pw(x, m + 1), `${m}${x}`, '1']; sol = [`$${x}^{0} = 1$, so multiplying by it changes nothing.`, `(Or add the powers: $${m} + 0 = ${m}$.)`]; break;
    case 'bracketDiv': tex = `\\dfrac{${x}^{${m}} \\times ${x}^{${n}}}{${x}^{${m}}}`; ans = pw(x, n); dis = [pw(x, m * n - m), pw(x, m + n), pw(x, n + 1), `${x}^{${2 * m + n}}`, pw(x, m), pw(x, m * n), `${n}${x}`, pw(x, n + m - 1)]; sol = [`Top: $${x}^{${m}} \\times ${x}^{${n}} = ${x}^{${m + n}}$ (add the powers).`, `Divide: $${x}^{${m + n}} \\div ${x}^{${m}} = ${pw(x, n)}$ (subtract the powers).`]; break;
    case 'negative': { const k = int(rng, 2, 6); tex = `${k}${x}^{-${m}}`; ans = tf(k, pw(x, m)); dis = [tf(1, `${k}${pw(x, m)}`), `-${k}${pw(x, m)}`, tf(pw(x, m), k), `${k}${pw(x, m)}`, tf(-k, pw(x, m))]; sol = [`A negative power means "one over": $${x}^{-${m}} = ${tf(1, pw(x, m))}$.`, `Only $${x}$ has the negative power, so $${k}${x}^{-${m}} = ${tf(k, pw(x, m))}$.`]; break; }
    case 'half': { const k = pick(rng, [4, 9, 16, 25, 36, 49, 64, 81, 100]); const r = Math.sqrt(k); const e = 2 * int(rng, 1, 5); tex = `(${k}${x}^{${e}})^{\\frac{1}{2}}`; ans = `${r}${pw(x, e / 2)}`; dis = [`${k / 2}${pw(x, e / 2)}`, `${r}${pw(x, e)}`, `${k}${pw(x, e / 2)}`, `${r}${pw(x, e + 2)}`, `${k / 2}${pw(x, e)}`].filter((s) => !/\./.test(s)); sol = [`The power $\\frac{1}{2}$ means square root — of the number <b>and</b> the letter.`, `$\\sqrt{${k}} = ${r}$ and $(${x}^{${e}})^{\\frac{1}{2}} = ${pw(x, e / 2)}$ (multiply the powers).`]; break; }
    case 'third': { const r = pick(rng, [2, 3, 4, 5]); const k = r ** 3; const e = 3 * int(rng, 1, 4); tex = `(${k}${x}^{${e}})^{\\frac{1}{3}}`; ans = `${r}${pw(x, e / 3)}`; dis = [`${k / 3}${pw(x, e / 3)}`.replace(/\.\d+/, ''), `${r}${pw(x, e)}`, `${k}${pw(x, e / 3)}`, `${r}${pw(x, e - 3 || 2)}`, `${r * r}${pw(x, e / 3)}`]; sol = [`The power $\\frac{1}{3}$ means cube root.`, `$\\sqrt[3]{${k}} = ${r}$ and $(${x}^{${e}})^{\\frac{1}{3}} = ${pw(x, e / 3)}$.`]; break; }
    case 'negHalf': { const k = pick(rng, [4, 9, 16, 25, 36, 49]); const r = Math.sqrt(k); const e = 2 * int(rng, 1, 4); tex = `(${k}${x}^{${e}})^{-\\frac{1}{2}}`; ans = tf(1, `${r}${pw(x, e / 2)}`); dis = [`${r}${pw(x, e / 2)}`, tf(r, pw(x, e / 2)), `-${r}${pw(x, e / 2)}`, tf(1, `${k}${pw(x, e / 2)}`), tf(1, `${r}${pw(x, e)}`)]; sol = [`The negative means "one over", the $\\frac{1}{2}$ means square root.`, `$(${k}${x}^{${e}})^{\\frac{1}{2}} = ${r}${pw(x, e / 2)}$, so the answer is $${tf(1, `${r}${pw(x, e / 2)}`)}$.`]; break; }
    default: { const r = pick(rng, [2, 3, 4]); const k = r ** 3; const e = 3 * int(rng, 1, 3); tex = `(${k}${x}^{${e}})^{\\frac{2}{3}}`; ans = `${r * r}${pw(x, (2 * e) / 3)}`; dis = [`${r}${pw(x, (2 * e) / 3)}`, `${r * r}${pw(x, e / 3)}`, `${(2 * k) / 3}`.includes('.') ? `${r * 2}${pw(x, (2 * e) / 3)}` : `${(2 * k) / 3}${pw(x, (2 * e) / 3)}`, `${r * r}${pw(x, e)}`, `${k}${pw(x, (2 * e) / 3)}`]; sol = [`$\\frac{2}{3}$ means cube root, then square.`, `$\\sqrt[3]{${k}} = ${r}$, $${r}^{2} = ${r * r}$; and $${e} \\times \\frac{2}{3} = ${(2 * e) / 3}$.`]; }
  }
  return {
    prompt: `Simplify &nbsp; $${tex}$`,
    answer: $(ans), distractors: dis.filter((s) => s !== ans).map($),
    solution: [...sol, `Answer: $${ans}$`],
  };
}, { title: 'Zero, negative and fractional powers' });

export const generators = [
  notationSimplify, notationWords, notationMeaning,
  simplifyCollect, simplifyProducts, simplifyPerimeter,
  substitutionEvaluate, substitutionSquares, substitutionCompare,
  expandSingle, expandSimplify, expandMissing,
  factoriseNumbers, factoriseVariable, factoriseMulti,
  indexMulDiv, indexPowerOfProduct, indexFindPower, indexNegFrac,
];
