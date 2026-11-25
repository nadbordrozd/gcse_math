// Algebraic expressions, part 2: double and triple brackets, factorising quadratics, difference of two squares,
// algebraic fractions.
import { pick, int, intExcept, size, chance, tnum, terms, gcd, num, shuffle } from '../../core.js';
import { svg, rect, text, line, notDrawnAccurately, FILL, FILL2 } from '../../svg.js';
import { G, P, br, coefTex, factored, expandFactors, typedFactors, pmul, peq, tf, $, rootsText, sgn, rat } from './lib.js';

const plain = (tex) => tex.replace(/-/g, '−').replace(/\^\{2\}/g, '²').replace(/\^\{3\}/g, '³').replace(/[{}]/g, '');
const kx = (c, v = 'x') => terms([[c, v]]);
const pk = (c, v = "x") => (c < 0 ? `(${kx(c, v)})` : kx(c, v));

/**
 * Distractor TeX strings from factor lists, dropping any that expand to the right answer and any that are
 * the same wrong factorisation with the brackets in a different order.
 */
function factorDistractors(rightCoefs, cands, v = 'x') {
  const out = [];
  const seen = new Set();
  for (const [k, fs] of cands) {
    if (fs.some((f) => f[0] === 0)) continue;
    const e = expandFactors(k, fs);
    if (peq(e, rightCoefs) || seen.has(e.join())) continue;
    seen.add(e.join());
    out.push($(factored(k, fs, v)));
  }
  return out;
}
const polyDistractors = (right, cands, v = 'x') => cands.filter((c) => !peq(c, right)).map((c) => $(P(c, v)));

/* ================================================================== */
/* alg-expand-double                                                   */
/* ================================================================== */

function foilSteps(a, b, c, d, v = 'x') {
  // (a v + b)(c v + d)
  const t = (coef, pow) => terms([[coef, pow === 2 ? `${v}^{2}` : pow === 1 ? v : '']]);
  return [
    `Multiply every term in the first bracket by every term in the second (four multiplications):`,
    `$${t(a, 1)} \\times ${t(c, 1)} = ${t(a * c, 2)}$, &nbsp; $${t(a, 1)} \\times ${paren2(d)} = ${t(a * d, 1)}$, &nbsp; $${paren2(b)} \\times ${t(c, 1)} = ${t(b * c, 1)}$, &nbsp; $${paren2(b)} \\times ${paren2(d)} = ${tnum(b * d)}$`,
    `Collect the two middle terms: $${terms([[a * d, v], [b * c, v]])} = ${t(a * d + b * c, 1)}$`,
  ];
}
const paren2 = (n) => (n < 0 ? `(${tnum(n)})` : tnum(n));

export const expandDouble = G('alg-expand-double-basic', 'alg-expand-double', (rng, d) => {
  const x = pick(rng, ['x', 'x', 'a', 'y', 'n', 'p']);
  let a; let b;
  if (d === 'easy') { a = int(rng, 1, 9); b = int(rng, 1, 9); } else if (d === 'medium') { a = int(rng, 1, 9); b = -int(rng, 1, 9); if (chance(rng)) [a, b] = [b, a]; } else { a = intExcept(rng, -9, 9, [0]); b = -int(rng, 2, 9); }
  if (a + b === 0) throw new Error('no middle term (that is the DOTS skill)');
  if (d === 'hard' && chance(rng, 0.4)) {
    // (x + a)(x + b y)  ->  x² + bxy + ax + aby
    const y = x === 'y' ? 'z' : 'y';
    const tex = `(${terms([[1, x], [a, '']])})(${terms([[1, x], [b, y]])})`;
    const ans = terms([[1, `${x}^{2}`], [b, `${x}${y}`], [a, x], [a * b, y]]);
    const dis = [
      terms([[1, `${x}^{2}`], [b, `${x}${y}`], [a, x], [-a * b, y]]),
      terms([[1, `${x}^{2}`], [a * b, y]]),
      terms([[1, `${x}^{2}`], [a + b, `${x}${y}`], [a * b, y]]),
      terms([[1, `${x}^{2}`], [b, `${x}${y}`], [a, x], [a * b, '']]),
      terms([[1, `${x}^{2}`], [-b, `${x}${y}`], [a, x], [a * b, y]]),
      terms([[2, x], [b, `${x}${y}`], [a, x], [a * b, y]]),
    ];
    return {
      prompt: `Expand and simplify &nbsp; $${tex}$`,
      answer: $(ans), distractors: dis.map($),
      solution: [
        `Multiply each term in the first bracket by each term in the second.`,
        `$${x} \\times ${x} = ${x}^{2}$, &nbsp; $${x} \\times ${pk(b, y)} = ${kx(b, `${x}${y}`)}$, &nbsp; $${paren2(a)} \\times ${x} = ${kx(a, x)}$, &nbsp; $${paren2(a)} \\times ${pk(b, y)} = ${kx(a * b, y)}$`,
        `There are no like terms to collect.`,
        `Answer: $${ans}$`,
      ],
    };
  }
  const right = [1, a + b, a * b];
  const tex = `${br(1, a, x)}${br(1, b, x)}`;
  const cands = [[1, 0, a * b], [1, -(a + b), a * b], [1, a + b, -a * b], [1, a * b, a + b], [2, a + b, a * b], [1, a, a * b], [1, a + b, a + b], [1, a - b, a * b]];
  return {
    prompt: `Expand and simplify &nbsp; $${tex}$`,
    answer: $(P(right, x)),
    distractors: polyDistractors(right, cands, x),
    hint: 'Multiply each term in the first bracket by each term in the second — there are four products.',
    solution: [...foilSteps(1, a, 1, b, x), `Answer: $${P(right, x)}$`],
  };
}, { title: 'Expand (x + a)(x + b)' });

export const expandSquare = G('alg-expand-square', 'alg-expand-double', (rng, d) => {
  const x = pick(rng, ['x', 'x', 'a', 'y', 'n', 't']);
  const p = d === 'hard' ? int(rng, 2, 5) : 1;
  const q = d === 'easy' ? int(rng, 1, 9) : intExcept(rng, -9, 9, [0]);
  if (d === 'hard' && gcd(p, q) !== 1) throw new Error('common factor');
  const right = [p * p, 2 * p * q, q * q];
  const tex = `${br(p, q, x)}^{2}`;
  const cands = [[p * p, 0, q * q], [p * p, p * q, q * q], [p * p, -2 * p * q, q * q], [p * p, 2 * p * q, -q * q], [p * p, 2 * q, q * q], [p, 2 * p * q, q * q], [p * p, 0, -q * q], [p * p, 2 * p * q, 2 * q]];
  return {
    prompt: `Expand and simplify &nbsp; $${tex}$`,
    answer: $(P(right, x)),
    distractors: polyDistractors(right, cands, x),
    hint: `Write it as two brackets: $${br(p, q, x)}${br(p, q, x)}$.`,
    solution: [
      `Squaring means multiplying the bracket by itself: $${tex} = ${br(p, q, x)}${br(p, q, x)}$. It is <b>not</b> just $${P([p * p, 0, q * q], x)}$.`,
      ...foilSteps(p, q, p, q, x).slice(1),
      `Answer: $${P(right, x)}$`,
    ],
  };
}, { title: 'Expand a squared bracket' });

export const expandDoubleCoef = G('alg-expand-double-coef', 'alg-expand-double', (rng, d) => {
  if (d === 'hard' && chance(rng, 0.5)) {
    // Two variables: (p a + q b)(r a + s b)
    const [u, w] = pick(rng, [['a', 'b'], ['x', 'y'], ['m', 'n'], ['p', 'q']]);
    const p = int(rng, 1, 4); const q = intExcept(rng, -6, 6, [0]); const r = int(rng, 1, 4); const s = intExcept(rng, -6, 6, [0]);
    if (p * s + q * r === 0) throw new Error('zero');
    const tex = `(${terms([[p, u], [q, w]])})(${terms([[r, u], [s, w]])})`;
    const T = (A, B, C) => terms([[A, `${u}^{2}`], [B, `${u}${w}`], [C, `${w}^{2}`]]);
    const ans = T(p * r, p * s + q * r, q * s);
    const dis = [T(p * r, 0, q * s), T(p * r, p * s + q * r, -q * s), T(p * r, -(p * s + q * r), q * s), T(p * r, p * s - q * r, q * s), terms([[p * r, `${u}^{2}`], [p * s + q * r, `${u}${w}`], [q * s, w]]), T(p + r, p * s + q * r, q * s)];
    return {
      prompt: `Expand and simplify &nbsp; $${tex}$`,
      answer: $(ans), distractors: dis.filter((t) => t !== ans).map($),
      solution: [
        `Multiply each term in the first bracket by each term in the second.`,
        `$${kx(p, u)} \\times ${kx(r, u)} = ${kx(p * r, `${u}^{2}`)}$, &nbsp; $${kx(p, u)} \\times ${pk(s, w)} = ${kx(p * s, `${u}${w}`)}$, &nbsp; $${pk(q, w)} \\times ${kx(r, u)} = ${kx(q * r, `${u}${w}`)}$, &nbsp; $${pk(q, w)} \\times ${pk(s, w)} = ${kx(q * s, `${w}^{2}`)}$`,
        `Collect the $${u}${w}$ terms: $${terms([[p * s, `${u}${w}`], [q * r, `${u}${w}`]])} = ${kx(p * s + q * r, `${u}${w}`)}$`,
        `Answer: $${ans}$`,
      ],
    };
  }
  const x = pick(rng, ['x', 'x', 'a', 'y', 'n']);
  const a = size(d, int(rng, 2, 3), int(rng, 2, 5), int(rng, 2, 6)); const c = size(d, 1, pick(rng, [1, 2, 3]), int(rng, 1, 5));
  const b = d === 'easy' ? int(rng, 1, 7) : intExcept(rng, -9, 9, [0]); const e = size(d, int(rng, 1, 7), -int(rng, 1, 9), intExcept(rng, -9, 9, [0]));
  if (a * e + b * c === 0) throw new Error('zero');
  const [A, B, C, D] = chance(rng) ? [a, b, c, e] : [c, e, a, b];
  const right = [A * C, A * D + B * C, B * D];
  const tex = `${br(A, B, x)}${br(C, D, x)}`;
  const cands = [[A * C, 0, B * D], [A * C, A * D + B * C, -B * D], [A * C, -(A * D + B * C), B * D], [A * C, A * D - B * C, B * D], [A * C, D + B, B * D], [A + C, A * D + B * C, B * D], [A * C, A * D + B * C + B * D, 0], [A * C, A * D, B * D]];
  return {
    prompt: `Expand and simplify &nbsp; $${tex}$`,
    answer: $(P(right, x)),
    distractors: polyDistractors(right, cands, x),
    solution: [...foilSteps(A, B, C, D, x), `Answer: $${P(right, x)}$`],
  };
}, { title: 'Expand (ax + b)(cx + d)' });

export const expandDoubleArea = G('alg-expand-double-area', 'alg-expand-double', (rng, d) => {
  const x = 'x';
  if (d !== 'hard') {
    const a = int(rng, 1, 9); let b = d === 'easy' ? int(rng, 1, 9) : intExcept(rng, -5, 9, [0]);
    if (b === a) b += 1;
    const p = d === 'medium' && chance(rng) ? 2 : 1;
    const right = pmul([p, a], [1, b]);
    const body = rect(70, 40, 230, 120, { fill: FILL }) + text(185, 26, plain(P([p, a], x)), { italic: true }) + text(334, 100, plain(P([1, b], x)), { italic: true }) + notDrawnAccurately(360, 190, { anchor: 'end' });
    return {
      prompt: `The diagram shows a rectangle. All lengths are in centimetres.<br>Which expression gives the area of the rectangle in cm²?`,
      visual: svg(370, 200, body),
      answer: $(P(right, x)),
      distractors: polyDistractors(right, [[p, 0, a * b], [p, a + b, a * b], [p, -(p * b + a), a * b], [p + 1, a + b, a * b], [0, 2 * (p + 1), 2 * (a + b)], [p, p * b + a, -a * b], [p, a * b, a * b]], x),
      solution: [
        `Area of a rectangle = length × width $= ${br(p, a, x)}${br(1, b, x)}$`,
        ...foilSteps(p, a, 1, b, x).slice(1),
        `Answer: $${P(right, x)}$ cm²`,
      ],
    };
  }
  // A rectangle with a square of side x cut out of the corner: shaded area.
  const b = int(rng, 2, 6); const a = b + int(rng, 1, 4); // a ≥ b so the longer side is drawn horizontally
  const right = [a + b, a * b];
  const W = 240; const H = 150; const s = 90;
  const body = rect(60, 30, W, H, { fill: FILL2 }) + rect(60, 30, s, s, { fill: 'var(--surface, #fff)' })
    + text(60 + W / 2, 16, plain(P([1, a], x)), { italic: true }) + text(60 + W + 34, 30 + H / 2, plain(P([1, b], x)), { italic: true })
    + text(60 + s / 2, 30 + s + 14, x, { italic: true }) + text(60 + s + 12, 30 + s / 2, x, { italic: true })
    + notDrawnAccurately(370, 200, { anchor: 'end' });
  return {
    prompt: `A square of side $${x}$ cm is cut from the corner of a rectangle measuring $${P([1, a], x)}$ cm by $${P([1, b], x)}$ cm, as shown.<br>Find an expression for the shaded area, in cm². Simplify your answer.`,
    visual: svg(380, 210, body),
    answer: $(P(right, x)),
    distractors: polyDistractors(right, [[1, a + b, a * b], [a + b, -a * b], [a * b], [2, a + b, a * b], [a + b, 0], [a * b, a + b], [-1, a + b, a * b], [a + b + 1, a * b]], x),
    solution: [
      `Shaded area = area of rectangle − area of square.`,
      `Rectangle: $${br(1, a, x)}${br(1, b, x)} = ${P([1, a + b, a * b], x)}$`,
      `Square: $${x} \\times ${x} = ${x}^{2}$`,
      `$${P([1, a + b, a * b], x)} - ${x}^{2} = ${P(right, x)}$`,
      `Answer: $${P(right, x)}$ cm²`,
    ],
  };
}, { title: 'Area expressions with double brackets', learn: ['alg-expand-double', 'geo-area-basic'] });

/* ================================================================== */
/* alg-factorise-quadratic                                             */
/* ================================================================== */

function monicRoots(rng, d) {
  // returns p, q with x² + (p+q)x + pq = (x+p)(x+q)
  let p; let q;
  if (d === 'easy') { p = int(rng, 1, 9); q = int(rng, 1, 9); } else if (d === 'medium') { p = -int(rng, 1, 9); q = -int(rng, 1, 9); if (chance(rng, 0.35)) { p = -p; q = -q; } } else { p = int(rng, 1, 11); q = -int(rng, 1, 11); if (chance(rng)) [p, q] = [q, p]; }
  if (p + q === 0) throw new Error('no middle');
  return [p, q];
}
function wrongPairs(p, q) {
  const c = p * q; const out = [];
  for (let r = -Math.abs(c); r <= Math.abs(c); r += 1) {
    if (r === 0 || c % r !== 0) continue;
    const s = c / r;
    if (r <= s && !((r === p && s === q) || (r === q && s === p))) out.push([r, s]);
  }
  return out;
}

export const factoriseQuad = G('alg-factorise-quad-monic', 'alg-factorise-quadratic', (rng, d) => {
  const x = pick(rng, ['x', 'x', 'x', 'a', 'y', 'n']);
  const [p, q] = monicRoots(rng, d);
  const right = [1, p + q, p * q];
  const wp = shuffle(rng, wrongPairs(p, q)).sort((u, v) => Math.abs(u[0] + u[1] - p - q) - Math.abs(v[0] + v[1] - p - q));
  const cands = [[1, [[1, -p], [1, -q]]], [1, [[1, p], [1, -q]]], [1, [[1, -p], [1, q]]], ...wp.slice(0, 3).map(([r, s]) => [1, [[1, r], [1, s]]]), [1, [[1, p + q], [1, p * q]]], [1, [[1, 0], [1, p + q]]]];
  const ans = factored(1, [[1, p], [1, q]], x);
  return {
    prompt: `Factorise &nbsp; $${P(right, x)}$`,
    answer: $(ans),
    distractors: factorDistractors(right, cands, x),
    typed: typedFactors(1, [[1, p], [1, q]], x),
    hint: `Find two numbers that multiply to give $${tnum(p * q)}$ and add to give $${tnum(p + q)}$.`,
    solution: [
      `Look for two numbers that <b>multiply</b> to $${tnum(p * q)}$ and <b>add</b> to $${tnum(p + q)}$.`,
      `$${tnum(p)} \\times ${paren2(q)} = ${tnum(p * q)}$ and $${tnum(p)} + ${paren2(q)} = ${tnum(p + q)}$ ✓`,
      `So $${P(right, x)} = ${ans}$. Check by expanding the brackets.`,
      `Answer: $${ans}$`,
    ],
  };
}, { title: 'Factorise x² + bx + c' });

export const factoriseQuadArea = G('alg-factorise-quad-area', 'alg-factorise-quadratic', (rng, d) => {
  const x = 'x';
  let p; let q;
  if (d === 'easy') { p = int(rng, 1, 9); q = int(rng, 1, 9); } else { p = int(rng, 2, 12); q = intExcept(rng, -9, 9, [0, -p]); }
  if (p === q) throw new Error('square');
  const right = [1, p + q, p * q];
  const shape = pick(rng, ['rectangle', 'rectangle', 'carpet']);
  const known = P([1, p], x);
  const body = rect(70, 40, 230, 110, { fill: FILL }) + text(185, 26, plain(known), { italic: true }) + text(185, 95, `Area = ${plain(P(right, x))}`, { italic: true, size: 15 }) + text(334, 95, '?', { size: 18 }) + notDrawnAccurately(360, 180, { anchor: 'end' });
  const ans = P([1, q], x);
  const dis = [P([1, -q], x), P([1, p + q], x), P([1, p * q - p], x), P([1, p * q], x), P([1, p + q - 1], x), P([1, q + 1], x), P([1, p * q / p + p], x)];
  return {
    prompt: shape === 'carpet'
      ? `A rectangular rug has area $(${P(right, x)})$ m². Its length is $(${known})$ m.<br>Find an expression for its width.`
      : `The area of this rectangle is $${P(right, x)}$ cm². The length is $(${known})$ cm.<br>Find an expression for the width.`,
    visual: shape === 'carpet' ? undefined : svg(370, 190, body),
    answer: $(ans),
    distractors: dis.filter((t) => t !== ans).map($),
    solution: [
      `Area = length × width, so factorise the area and one bracket will be the length.`,
      `Two numbers that multiply to $${tnum(p * q)}$ and add to $${tnum(p + q)}$: $${tnum(p)}$ and $${tnum(q)}$.`,
      `$${P(right, x)} = ${br(1, p, x)}${br(1, q, x)}$`,
      `Answer: the width is $${ans}$`,
    ],
  };
}, { title: 'Find a side from a quadratic area', learn: ['alg-factorise-quadratic', 'geo-area-basic'] });

export const factoriseQuadCommon = G('alg-factorise-quad-common', 'alg-factorise-quadratic', (rng, d) => {
  const x = 'x';
  const k = size(d, 2, pick(rng, [2, 3, 5]), pick(rng, [2, 3, 4, 5, 6]));
  const [p, q] = monicRoots(rng, d === 'easy' ? 'easy' : d === 'medium' ? 'medium' : 'hard');
  const right = expandFactors(k, [[1, p], [1, q]]);
  const ans = factored(k, [[1, p], [1, q]], x);
  const wp = wrongPairs(p, q);
  const extra = [
    $(`${coefTex(k)}(${P([1, p + q, p * q], x)})`),
    $(factored(1, [[1, p], [1, q]], x)),
  ];
  const cands = [[k, [[1, -p], [1, -q]]], [k, [[1, p], [1, -q]]], [-k, [[1, p], [1, q]]], ...(wp.length ? [[k, [wp[0].map((v, i) => (i === 0 ? 1 : v)), [1, wp[0][1]]]]] : []).map(([kk]) => [kk, [[1, wp[0][0]], [1, wp[0][1]]]]), [k, [[1, k * p], [1, q]]]];
  return {
    prompt: `Factorise fully &nbsp; $${P(right, x)}$`,
    answer: $(ans),
    distractors: [...factorDistractors(right, cands, x), ...extra],
    typed: typedFactors(k, [[1, p], [1, q]], x),
    hint: 'Take out the common factor first.',
    solution: [
      `Every coefficient is divisible by $${tnum(k)}$, so take it out first: $${P(right, x)} = ${coefTex(k)}(${P([1, p + q, p * q], x)})$`,
      `Now factorise the bracket: two numbers that multiply to $${tnum(p * q)}$ and add to $${tnum(p + q)}$ are $${tnum(p)}$ and $${tnum(q)}$.`,
      `"Fully" means you must keep the $${tnum(k)}$ outside as well.`,
      `Answer: $${ans}$`,
    ],
  };
}, { title: 'Factorise fully with a common factor' });

/* ================================================================== */
/* alg-difference-squares                                              */
/* ================================================================== */

export const dotsBasic = G('alg-dots-basic', 'alg-difference-squares', (rng, d) => {
  const x = pick(rng, ['x', 'x', 'y', 'p', 'n', 't']);
  if (d !== 'hard') {
    const n = size(d, int(rng, 2, 10), int(rng, 3, 15), 0);
    const tex = `${x}^{2} - ${n * n}`;
    const ans = `(${x} + ${n})(${x} - ${n})`;
    const half = (n * n) % 2 === 0 ? [`(${x} + ${(n * n) / 2})(${x} - ${(n * n) / 2})`] : [];
    return {
      prompt: `Factorise &nbsp; $${tex}$`,
      answer: $(ans),
      distractors: [`(${x} - ${n})^{2}`, `(${x} + ${n})^{2}`, ...half, `(${x} - ${n})(${x} - ${n})`.replace(/.*/, `${x}(${x} - ${n * n})`), `(${x} + ${n * n})(${x} - 1)`, `(${x} - ${n})(${x} + ${n * n})`].map($),
      typed: { kind: 'text', accept: [`(${x}+${n})(${x}-${n})`, `(${x}-${n})(${x}+${n})`, `(${n}+${x})(${x}-${n})`] },
      hint: `$${n * n}$ is a square number. Use $a^{2} - b^{2} = (a + b)(a - b)$.`,
      solution: [
        `This is a <b>difference of two squares</b>: $${x}^{2} - ${n}^{2}$.`,
        `Use $a^{2} - b^{2} = (a + b)(a - b)$ with $a = ${x}$ and $b = ${n}$.`,
        `Check: $(${x} + ${n})(${x} - ${n}) = ${x}^{2} - ${n}${x} + ${n}${x} - ${n * n} = ${tex}$ ✓ (the middle terms cancel).`,
        `Answer: $${ans}$`,
      ],
    };
  }
  // (a x)² − (b y)²
  const [u, w] = pick(rng, [['x', 'y'], ['a', 'b'], ['p', 'q'], ['m', 'n']]);
  let A; let B;
  do { A = int(rng, 1, 7); B = int(rng, 1, 9); } while (gcd(A, B) !== 1 || (A === 1 && B === 1));
  const tex = `${A * A === 1 ? '' : A * A}${u}^{2} - ${B * B === 1 ? '' : B * B}${w}^{2}`;
  const L = kx(A, u); const R = kx(B, w);
  const ans = `(${L} + ${R})(${L} - ${R})`;
  return {
    prompt: `Factorise &nbsp; $${tex}$`,
    answer: $(ans),
    distractors: [`(${L} - ${R})^{2}`, `(${kx(A * A, u)} + ${kx(B * B, w)})(${kx(A * A, u)} - ${kx(B * B, w)})`, `(${L} + ${R})^{2}`, `(${kx(A, u)} + ${kx(B * B, w)})(${kx(A, u)} - ${w})`, `(${kx(2 * A, u)} + ${kx(B, w)})(${kx(A, u)} - ${kx(B, w)})`].map($),
    typed: { kind: 'text', accept: [`(${L}+${R})(${L}-${R})`, `(${L}-${R})(${L}+${R})`] },
    solution: [
      `Both terms are perfect squares: $${tex} = (${L})^{2} - (${R})^{2}$.`,
      `Use $a^{2} - b^{2} = (a + b)(a - b)$ with $a = ${L}$ and $b = ${R}$.`,
      `Answer: $${ans}$`,
    ],
  };
}, { title: 'Factorise a difference of two squares' });

export const dotsFully = G('alg-dots-fully', 'alg-difference-squares', (rng, d) => {
  const x = pick(rng, ['x', 'x', 'a', 'y']);
  const form = pick(rng, size(d, ['k'], ['k', 'x'], ['k', 'x', 'rev']));
  const n = int(rng, 2, 9);
  if (form === 'k') {
    const k = pick(rng, [2, 3, 4, 5, 10]);
    const tex = `${k}${x}^{2} - ${k * n * n}`;
    const ans = `${k}(${x} + ${n})(${x} - ${n})`;
    return {
      prompt: `Factorise fully &nbsp; $${tex}$`,
      answer: $(ans),
      distractors: [`${k}(${x}^{2} - ${n * n})`, `${k}(${x} - ${n})^{2}`, `(${k}${x} + ${n})(${x} - ${n})`, `${k}(${x} + ${k * n})(${x} - ${k * n})`, `(${x} + ${n})(${x} - ${n})`, `${k}(${x} + ${n * n})(${x} - 1)`].map($),
      typed: { kind: 'text', accept: [`${k}(${x}+${n})(${x}-${n})`, `${k}(${x}-${n})(${x}+${n})`] },
      solution: [
        `First take out the common factor ${k}: $${tex} = ${k}(${x}^{2} - ${n * n})$`,
        `The bracket is a difference of two squares: $${x}^{2} - ${n}^{2} = (${x} + ${n})(${x} - ${n})$`,
        `Answer: $${ans}$`,
      ],
    };
  }
  if (form === 'x') {
    const tex = `${x}^{3} - ${n * n}${x}`;
    const ans = `${x}(${x} + ${n})(${x} - ${n})`;
    return {
      prompt: `Factorise fully &nbsp; $${tex}$`,
      answer: $(ans),
      distractors: [`${x}(${x}^{2} - ${n * n})`, `${x}(${x} - ${n})^{2}`, `(${x} + ${n})(${x} - ${n})`, `${x}^{2}(${x} - ${n * n})`, `${x}(${x} + ${n * n})(${x} - 1)`, `(${x}^{2} + ${n}${x})(${x} - ${n})`].map($),
      typed: { kind: 'text', accept: [`${x}(${x}+${n})(${x}-${n})`, `${x}(${x}-${n})(${x}+${n})`] },
      solution: [
        `Both terms contain $${x}$: $${tex} = ${x}(${x}^{2} - ${n * n})$`,
        `The bracket is a difference of two squares: $${x}^{2} - ${n * n} = (${x} + ${n})(${x} - ${n})$`,
        `Answer: $${ans}$`,
      ],
    };
  }
  // c² k − k x²  e.g. 144 − 4x² = 4(6 + x)(6 − x)
  const k = pick(rng, [2, 3, 4, 5]); const m = int(rng, 3, 9);
  const tex = `${k * m * m} - ${k}${x}^{2}`;
  const ans = `${k}(${m} + ${x})(${m} - ${x})`;
  return {
    prompt: `Factorise fully &nbsp; $${tex}$`,
    answer: $(ans),
    distractors: [`${k}(${x} + ${m})(${x} - ${m})`, `${k}(${m * m} - ${x}^{2})`, `${k}(${m} - ${x})^{2}`, `(${k * m} + ${k}${x})(${m} - ${x})`, `${k}(${m * m} + ${x})(${m * m} - ${x})`, `(${m} + ${x})(${m} - ${x})`].map($),
    typed: { kind: 'text', accept: [`${k}(${m}+${x})(${m}-${x})`, `${k}(${m}-${x})(${m}+${x})`, `${k}(${x}+${m})(${m}-${x})`, `-${k}(${x}+${m})(${x}-${m})`] },
    solution: [
      `Take out the common factor ${k}: $${tex} = ${k}(${m * m} - ${x}^{2})$`,
      `$${m * m} - ${x}^{2} = ${m}^{2} - ${x}^{2} = (${m} + ${x})(${m} - ${x})$`,
      `Be careful with the order: $${x}^{2}$ is being subtracted, so it is $(${m} - ${x})$, not $(${x} - ${m})$.`,
      `Answer: $${ans}$`,
    ],
  };
}, { title: 'Factorise fully using difference of two squares' });

export const dotsNumeric = G('alg-dots-numeric', 'alg-difference-squares', (rng, d) => {
  const s = size(d, pick(rng, [10, 20, 100]), pick(rng, [100, 200, 300, 1000]), pick(rng, [100, 200, 500, 1000]));
  const diff = size(d, 2 * int(rng, 1, 3), 2 * int(rng, 1, 15), 2 * int(rng, 10, 45));
  const a = (s + diff) / 2; const b = (s - diff) / 2;
  if (b <= 0) throw new Error('neg');
  const val = s * diff;
  return {
    prompt: `Use $x^{2} - y^{2} \\equiv (x + y)(x - y)$ to work out the value of &nbsp; $${a}^{2} - ${b}^{2}$<br>Do not use a calculator.`,
    answer: $(tnum(val)),
    distractors: [diff * diff, s * s, 2 * val, val + s, val - s, (a - b) * 2, s + diff].filter((v) => v !== val).map((v) => $(tnum(v))),
    typed: { kind: 'number', value: val },
    solution: [
      `Put $x = ${a}$ and $y = ${b}$ into $(x + y)(x - y)$.`,
      `$x + y = ${a} + ${b} = ${tnum(s)}$ and $x - y = ${a} - ${b} = ${diff}$`,
      `$${tnum(s)} \\times ${diff} = ${tnum(val)}$`,
      `Answer: $${tnum(val)}$ (note it is not $(${a} - ${b})^{2} = ${tnum(diff * diff)}$)`,
    ],
  };
}, { title: 'Use the difference of two squares for arithmetic' });

/* ================================================================== */
/* alg-expand-triple                                                   */
/* ================================================================== */

export const expandTriple = G('alg-expand-triple', 'alg-expand-triple', (rng, d) => {
  const x = 'x';
  const A = d === 'hard' ? int(rng, 2, 3) : 1;
  const a = intExcept(rng, -6, 6, [0]); const b = intExcept(rng, -6, 6, [0]); const c = d === 'easy' ? int(rng, 1, 5) : intExcept(rng, -6, 6, [0]);
  if (d === 'easy' && (a < 0 && b < 0)) throw new Error('too hard');
  const fs = [[A, a], [1, b], [1, c]];
  const right = expandFactors(1, fs);
  if (right.some((v) => v === 0)) throw new Error('zero coef');
  const two = pmul([A, a], [1, b]);
  const cands = [
    [right[0], right[1], right[2], -right[3]],
    [right[0], -right[1], right[2], right[3]],
    [right[0], right[1], -right[2], right[3]],
    [right[0], two[1], two[2] + two[1] * c, right[3]],
    [right[0], right[1], two[2] + c, right[3]],
    [right[0], right[1] + 1, right[2], right[3]],
    [right[0], right[1], right[2] - 2, right[3]],
  ];
  const tex = fs.map(([p, q]) => br(p, q, x)).join('');
  return {
    prompt: `Expand and simplify &nbsp; $${tex}$`,
    answer: $(P(right, x)),
    distractors: polyDistractors(right, cands, x),
    hint: 'Multiply two of the brackets first, then multiply the result by the third bracket.',
    solution: [
      `Expand the first two brackets: $${br(A, a, x)}${br(1, b, x)} = ${P(two, x)}$`,
      `Multiply every term by $${br(1, c, x)}$: $(${P(two, x)})${br(1, c, x)}$`,
      `$= ${terms([[two[0], `${x}^{3}`], [two[1], `${x}^{2}`], [two[2], x], [two[0] * c, `${x}^{2}`], [two[1] * c, x], [two[2] * c, '']])}$`,
      `Collect like terms: $${P(right, x)}$`,
      `Answer: $${P(right, x)}$`,
    ],
  };
}, { title: 'Expand three binomials' });

export const expandCube = G('alg-expand-triple-cube', 'alg-expand-triple', (rng, d) => {
  const x = pick(rng, ['x', 'x', 'a', 'y']);
  const p = d === 'hard' ? int(rng, 2, 3) : 1;
  const q = size(d, int(rng, 1, 4), intExcept(rng, -5, 5, [0]), intExcept(rng, -4, 4, [0]));
  if (gcd(p, q) !== 1) throw new Error('common');
  const right = [p ** 3, 3 * p * p * q, 3 * p * q * q, q ** 3];
  const sq = [p * p, 2 * p * q, q * q];
  const cands = [[p ** 3, 0, 0, q ** 3], [p ** 3, 3 * p * q, 3 * q * q, q ** 3], [p ** 3, 2 * p * p * q, 2 * p * q * q, q ** 3], [p ** 3, 3 * p * p * q, 3 * p * q * q, -(q ** 3)], [p, 3 * p * p * q, 3 * p * q * q, q ** 3], [p ** 3, 3 * p * p * q, p * q * q, q ** 3], [p ** 3, p * p * q, p * q * q, q ** 3]];
  return {
    prompt: `Expand and simplify &nbsp; $${br(p, q, x)}^{3}$`,
    answer: $(P(right, x)),
    distractors: polyDistractors(right, cands, x),
    solution: [
      `Write it as $${br(p, q, x)}${br(p, q, x)}${br(p, q, x)}$ — it is not just $${P([p ** 3, 0, 0, q ** 3], x)}$.`,
      `First two brackets: $${br(p, q, x)}^{2} = ${P(sq, x)}$`,
      `Then $(${P(sq, x)})${br(p, q, x)} = ${terms([[sq[0] * p, `${x}^{3}`], [sq[1] * p, `${x}^{2}`], [sq[2] * p, x], [sq[0] * q, `${x}^{2}`], [sq[1] * q, x], [sq[2] * q, '']])}$`,
      `Collect like terms. Answer: $${P(right, x)}$`,
    ],
  };
}, { title: 'Expand a cubed bracket' });

export const expandTripleIdentity = G('alg-expand-triple-coef', 'alg-expand-triple', (rng, d) => {
  const x = 'x';
  const a = intExcept(rng, -7, 7, [0]); const b = intExcept(rng, -7, 7, [0]); const c = intExcept(rng, -7, 7, [0]);
  const right = expandFactors(1, [[1, a], [1, b], [1, c]]);
  if (right[1] === 0 || right[2] === 0) throw new Error('zero');
  const ask = size(d, 'a', 'b', 'c');
  const tex = `${br(1, a, x)}${br(1, b, x)}(x + p) \\equiv x^{3} + qx^{2} + rx ${right[3] < 0 ? '-' : '+'} ${Math.abs(right[3])}`;
  const val = ask === 'a' ? c : ask === 'b' ? right[1] : right[2];
  const name = { a: 'p', b: 'q', c: 'r' }[ask];
  const wrong = [-c, right[1], right[2], a + b, a * b, a * b + c, -right[1], -right[2], right[1] + 1, c + 1].filter((v) => v !== val);
  return {
    prompt: `$${tex}$<br>where $p$, $q$ and $r$ are integers. Work out the value of $${name}$.`,
    answer: $(tnum(val)),
    distractors: wrong.map((v) => $(tnum(v))),
    typed: { kind: 'number', value: val },
    solution: [
      `Compare the constant terms: $${paren2(a)} \\times ${paren2(b)} \\times p = ${tnum(right[3])}$, so $${kx(a * b, 'p')} = ${tnum(right[3])}$ and $p = ${tnum(c)}$.`,
      ...(ask !== 'a' ? [`Now expand fully: $${br(1, a, x)}${br(1, b, x)}${br(1, c, x)} = ${P(right, x)}$`] : []),
      ...(ask === 'b' ? [`The coefficient of $x^{2}$ is $${tnum(a)} + ${paren2(b)} + ${paren2(c)} = ${tnum(right[1])}$.`] : []),
      ...(ask === 'c' ? [`The coefficient of $x$ is $${paren2(a)} \\times ${paren2(b)} + ${paren2(a)} \\times ${paren2(c)} + ${paren2(b)} \\times ${paren2(c)} = ${tnum(right[2])}$.`] : []),
      `Answer: $${name} = ${tnum(val)}$`,
    ],
  };
}, { title: 'Unknown coefficients in a triple-bracket identity', learn: ['alg-expand-triple', 'alg-vocabulary'] });

/* ================================================================== */
/* alg-factorise-hard                                                  */
/* ================================================================== */

function nonMonic(rng, d) {
  // (p x + q)(r x + s) with p·r = a ≥ 2, no common factor in either bracket
  for (let i = 0; i < 100; i += 1) {
    const p = size(d, pick(rng, [2, 3, 5]), pick(rng, [2, 3, 5, 7]), pick(rng, [2, 3, 4, 5, 6]));
    const r = d === 'hard' ? pick(rng, [1, 2, 3]) : 1;
    const q = d === 'easy' ? int(rng, 1, 7) : intExcept(rng, -9, 9, [0]);
    const s = d === 'easy' ? int(rng, 1, 7) : intExcept(rng, -9, 9, [0]);
    if (gcd(p, q) !== 1 || gcd(r, s) !== 1) continue;
    if (p * s + q * r === 0) continue;
    if (p === r && q === s) continue;
    return [p, q, r, s];
  }
  throw new Error('no non-monic');
}

export const factoriseHard = G('alg-factorise-a-ne-1', 'alg-factorise-hard', (rng, d) => {
  const x = 'x';
  const [p, q, r, s] = nonMonic(rng, d);
  const fs = [[p, q], [r, s]];
  const right = expandFactors(1, fs);
  const ans = factored(1, fs, x);
  const cands = [
    [1, [[p, s], [r, q]]], [1, [[p, -q], [r, -s]]], [1, [[p, -s], [r, -q]]], [1, [[p, q], [r, -s]]], [1, [[p, -q], [r, s]]],
    [1, [[1, q], [p * r, s]]], [1, [[p * r, q], [1, s]]], [1, [[p, q * r], [1, s]]],
  ];
  return {
    prompt: `Factorise &nbsp; $${P(right, x)}$`,
    answer: $(ans),
    distractors: factorDistractors(right, cands, x),
    typed: typedFactors(1, fs, x),
    hint: `Multiply ${right[0]} by ${tnum(right[2])} and find two numbers with that product that add to ${tnum(right[1])}.`,
    solution: [
      `Multiply the $x^{2}$ coefficient by the constant: $${right[0]} \\times ${paren2(right[2])} = ${tnum(right[0] * right[2])}$.`,
      `Two numbers that multiply to $${tnum(right[0] * right[2])}$ and add to $${tnum(right[1])}$: $${tnum(p * s)}$ and $${tnum(q * r)}$.`,
      `Split the middle term: $${terms([[right[0], 'x^{2}'], [p * s, 'x'], [q * r, 'x'], [right[2], '']])}$ and factorise in pairs.`,
      `Answer: $${ans}$ (check by expanding)`,
    ],
  };
}, { title: 'Factorise ax² + bx + c' });

export const factoriseHardCommon = G('alg-factorise-hard-common', 'alg-factorise-hard', (rng, d) => {
  const x = 'x';
  const k = pick(rng, size(d, [2, 3], [2, 3, 4], [2, 3, 5, -1]));
  const [p, q, r, s] = nonMonic(rng, d === 'hard' ? 'medium' : 'easy');
  const fs = [[p, q], [r, s]];
  const right = expandFactors(k, fs);
  const ans = factored(k, fs, x);
  const inner = expandFactors(1, fs);
  const cands = [[k, [[p, s], [r, q]]], [k, [[p, -q], [r, -s]]], [1, fs], [k, [[p, q], [r, -s]]], [k, [[p * k, q], [r, s]]]];
  return {
    prompt: `Factorise fully &nbsp; $${P(right, x)}$`,
    answer: $(ans),
    distractors: [...factorDistractors(right, cands, x), $(`${coefTex(k)}(${P(inner, x)})`)],
    typed: typedFactors(k, fs, x),
    solution: [
      `Take out the common factor first: $${P(right, x)} = ${coefTex(k)}(${P(inner, x)})$`,
      `Factorise the bracket: $${inner[0]} \\times ${paren2(inner[2])} = ${tnum(inner[0] * inner[2])}$; numbers $${tnum(p * s)}$ and $${tnum(q * r)}$ multiply to this and add to $${tnum(inner[1])}$.`,
      `$${P(inner, x)} = ${factored(1, fs, x)}$`,
      `Answer: $${ans}$`,
    ],
  };
}, { title: 'Factorise fully with a common factor and a ≠ 1' });

export const factoriseHardOther = G('alg-factorise-hard-other', 'alg-factorise-hard', (rng, d) => {
  const x = 'x';
  const [p, q, r, s] = nonMonic(rng, d);
  const right = expandFactors(1, [[p, q], [r, s]]);
  const ans = br(r, s, x);
  const dis = [br(r, -s, x), br(p, s, x), br(r * p, s, x), br(r, right[2], x), br(r, s + 1, x), br(r, q, x), br(r + 1, s, x)].filter((t) => t !== ans);
  return {
    prompt: `One factor of $${P(right, x)}$ is $${br(p, q, x)}$.<br>What is the other factor?`,
    answer: $(ans),
    distractors: dis.map($),
    solution: [
      `Write $${P(right, x)} = ${br(p, q, x)}(\\square x + \\triangle)$.`,
      `The $x^{2}$ terms: $${kx(p, x)} \\times \\square x = ${kx(right[0], 'x^{2}')}$, so $\\square = ${r}$.`,
      `The numbers: $${paren2(q)} \\times \\triangle = ${tnum(right[2])}$, so $\\triangle = ${tnum(s)}$.`,
      `Check the middle term: $${br(p, q, x)}${ans}$ gives $${kx(p * s, x)} ${sgn(q * r, x)} = ${kx(right[1], x)}$ ✓`,
      `Answer: $${ans}$`,
    ],
  };
}, { title: 'Find the other factor of ax² + bx + c' });

/* ================================================================== */
/* alg-fractions-simplify                                              */
/* ================================================================== */

const F = (n, dd) => tf(n, dd);

export const fracSimplifyLinear = G('alg-frac-simplify-linear', 'alg-fractions-simplify', (rng, d) => {
  const x = 'x';
  const form = pick(rng, size(d, ['divTerms', 'divTerms', 'xcommon'], ['xcommon', 'kx', 'divTerms'], ['kx', 'xcommon2', 'neg']));
  let tex; let ans; let dis; let sol;
  if (form === 'divTerms') {
    const k = pick(rng, [2, 3, 4, 5, 6]); const a = int(rng, 1, 5); const b = intExcept(rng, -9, 9, [0]);
    if (gcd(a, b) !== 1 && false) throw new Error('');
    tex = F(P([k * a, k * b], x), k); ans = P([a, b], x);
    dis = [P([a, k * b], x), P([k * a, b], x), F(P([a, b], x), k), P([a, -b], x), P([a + 0, b * 1 + k], x)];
    sol = [`Divide <b>every</b> term on the top by ${k} (not just the first one).`, `$${kx(k * a, x)} \\div ${k} = ${kx(a, x)}$ and $${tnum(k * b)} \\div ${k} = ${tnum(b)}$`];
  } else if (form === 'xcommon') {
    const a = intExcept(rng, -9, 9, [0]);
    tex = F(P([1, a, 0], x), x); ans = P([1, a], x);
    dis = [P([1, a, 0], x), `${x}^{2} ${a < 0 ? '-' : '+'} ${Math.abs(a)}`, `${x}${a < 0 ? '-' : '+'}${Math.abs(a)}`.replace(/.*/, P([1, a * 1, 0], x).replace(/\^\{2\}/, '')), P([2, a], x), terms([[1 + a, x]]), P([1, -a], x)];
    sol = [`Factorise the top: $${P([1, a, 0], x)} = ${x}${br(1, a, x)}$`, `Cancel the common factor $${x}$: $${F(`${x}${br(1, a, x)}`, x)} = ${P([1, a], x)}$`];
  } else if (form === 'kx') {
    const a = intExcept(rng, -9, 9, [0]); const k = int(rng, 2, 6);
    tex = F(P([1, a, 0], x), P([k, k * a], x)); ans = F(x, k);
    dis = [F(P([1, a, 0], x), k), F(1, k), F(x, k * a), `${k}${x}`, F(`${x} ${a < 0 ? '-' : '+'} ${Math.abs(a)}`, k), F(x, P([k, a], x))];
    sol = [`Factorise top and bottom: $${F(`${x}${br(1, a, x)}`, `${k}${br(1, a, x)}`)}$`, `Cancel the common bracket $${br(1, a, x)}$.`];
  } else if (form === 'xcommon2') {
    const a = intExcept(rng, -9, 9, [0]); const k = int(rng, 2, 5); const m = int(rng, 2, 5);
    if (gcd(k, m) !== 1) throw new Error('');
    tex = F(P([k, k * a, 0], x), P([m, m * a], x)); ans = F(`${k}${x}`, m);
    dis = [F(`${k}${x}^{2}`, m), F(k, m), F(`${k}${x}`, `${m}${x}`).replace(/.*/, `${k}${x}`), F(`${m}${x}`, k), F(`${k}${x} + ${Math.abs(a)}`, m), F(x, m)];
    sol = [`Factorise top and bottom: $${F(`${k}${x}${br(1, a, x)}`, `${m}${br(1, a, x)}`)}$`, `Cancel the common bracket $${br(1, a, x)}$.`];
  } else {
    // (a − x)/(x² − a²) style: (k − x)/(x − k)(x + m)… keep simple: (x − a)/(a − x) = −1
    const a = int(rng, 2, 9); const k = int(rng, 2, 6);
    tex = F(P([k, -k * a], x), `${a} - ${x}`); ans = tnum(-k);
    dis = [tnum(k), F(k, -1).replace(/.*/, `${k}${x}`), '1', '-1', F(`${k}`, `${a}`)];
    sol = [`Factorise the top: $${P([k, -k * a], x)} = ${k}(${x} - ${a})$`, `Notice $${a} - ${x} = -(${x} - ${a})$, so the brackets cancel leaving $${k} \\div (-1)$.`];
  }
  return {
    prompt: `Simplify fully &nbsp; $${tex}$`,
    answer: $(ans),
    distractors: dis.filter((t) => t !== ans && sensibleFrac(t, false)).map($),
    solution: [...sol, `Answer: $${ans}$`],
  };
}, { title: 'Simplify algebraic fractions with linear factors' });

export const fracSimplifyQuad = G('alg-frac-simplify-quadratic', 'alg-fractions-simplify', (rng, d) => {
  const x = 'x';
  // numerator (x + p)(x + q), denominator (x + p)(x + r) or a difference of squares
  const p = intExcept(rng, -8, 8, [0]); const q = intExcept(rng, -8, 8, [0, p, -p]); let r = intExcept(rng, -8, 8, [0, p, q]);
  const kind = pick(rng, size(d, ['simpleTop', 'dotsBottom'], ['both', 'dotsBottom', 'dotsTop'], ['both', 'dotsTop', 'linearTop']));
  let top; let bot; let ans; let dis; let topF; let botF;
  if (kind === 'simpleTop') {
    // (x² + px)/(x² + (p + r)x + pr) = x/(x + r)
    top = [1, p, 0]; bot = pmul([1, p], [1, r]); topF = `${x}${br(1, p, x)}`; botF = `${br(1, p, x)}${br(1, r, x)}`;
    ans = F(x, P([1, r], x));
    dis = [F(x, P([1, -r], x)), F(1, P([1, r], x)), F(P([1, p], x), P([1, r], x)), F(x, P([1, p], x)), F(P([1, p, 0], x), P([1, p + r], x)), F(x, r)];
  } else if (kind === 'dotsBottom') {
    r = -p;
    top = [1, p + q, p * q]; bot = [1, 0, -p * p]; topF = `${br(1, p, x)}${br(1, q, x)}`; botF = `${br(1, p, x)}${br(1, -p, x)}`;
    ans = F(P([1, q], x), P([1, -p], x));
    dis = [F(P([1, q], x), P([1, p], x)), F(P([1, -q], x), P([1, -p], x)), F(P([1, p + q], x), tnum(-p * p)), F(P([1, p + q, p * q], x), P([1, -p], x)).replace(/.*/, F(P([1, q], x), P([1, p * p], x))), F(P([1, p], x), P([1, -p], x))];
  } else if (kind === 'dotsTop') {
    top = [1, 0, -p * p]; bot = pmul([1, p], [1, r]); topF = `${br(1, p, x)}${br(1, -p, x)}`; botF = `${br(1, p, x)}${br(1, r, x)}`;
    if (r === -p) throw new Error('');
    ans = F(P([1, -p], x), P([1, r], x));
    dis = [F(P([1, p], x), P([1, r], x)), F(P([1, -p], x), P([1, -r], x)), F(tnum(-p * p), P([1, p + r], x)), F(P([1, p], x), P([1, -p], x)), F(P([1, -p], x), r)];
  } else if (kind === 'both') {
    top = pmul([1, p], [1, q]); bot = pmul([1, p], [1, r]); topF = `${br(1, p, x)}${br(1, q, x)}`; botF = `${br(1, p, x)}${br(1, r, x)}`;
    ans = F(P([1, q], x), P([1, r], x));
    dis = [F(P([1, -q], x), P([1, -r], x)), F(P([1, r], x), P([1, q], x)), F(P([top[1], top[2]], x), P([bot[1], bot[2]], x)), F(P([1, p], x), P([1, r], x)), F(P([1, q], x), P([1, p], x))];
  } else {
    // (k x + k p) / (x² + (p + r) x + p r) = k/(x + r)
    const k = int(rng, 2, 6);
    top = [k, k * p]; bot = pmul([1, p], [1, r]); topF = `${k}${br(1, p, x)}`; botF = `${br(1, p, x)}${br(1, r, x)}`;
    ans = F(k, P([1, r], x));
    dis = [F(k, P([1, -r], x)), F(`${k}${x}`, P([1, r], x)), F(k, P([1, p], x)), F(P([k, 0], x), P([1, r], x)).replace(/.*/, F(k, P([1, k * r], x))), F(P([1, p], x), P([1, r], x))];
  }
  return {
    prompt: `Simplify fully &nbsp; $${F(P(top, x), P(bot, x))}$`,
    answer: $(ans),
    distractors: dis.filter((t) => t !== ans && sensibleFrac(t, false)).map($),
    hint: 'Factorise the top and the bottom first. You can only cancel whole factors (brackets), never single terms.',
    solution: [
      `Factorise the numerator: $${P(top, x)} = ${topF}$`,
      `Factorise the denominator: $${P(bot, x)} = ${botF}$`,
      `Cancel the common factor: $${F(topF, botF)} = ${ans}$`,
      `Answer: $${ans}$`,
    ],
  };
}, { title: 'Simplify algebraic fractions with quadratics' });

export const fracSimplifyNonMonic = G('alg-frac-simplify-a-ne-1', 'alg-fractions-simplify', (rng, d) => {
  const x = 'x';
  // (p x + q)(x + s) / ((p x + q)(p x − q))  or  / (p x + q)(x + t)
  const p = pick(rng, size(d, [2, 3], [2, 3, 5], [2, 3, 4, 5]));
  const q = intExcept(rng, -7, 7, [0]); const s = intExcept(rng, -8, 8, [0]);
  if (gcd(p, q) !== 1) throw new Error('');
  const useDots = d !== 'easy' && chance(rng, 0.5);
  const top = pmul([p, q], [1, s]);
  const bot = useDots ? [p * p, 0, -q * q] : pmul([p, q], [1, -s === s ? s + 1 : -s]);
  const other = useDots ? [p, -q] : [1, -s];
  if (other[1] === s && other[0] === 1) throw new Error('');
  const topF = `${br(p, q, x)}${br(1, s, x)}`;
  const botF = `${br(p, q, x)}${br(other[0], other[1], x)}`;
  const ans = F(P([1, s], x), P(other, x));
  const dis = [
    F(P([1, -s], x), P(other, x)),
    F(P([1, s], x), P([other[0], -other[1]], x)),
    F(P(other, x), P([1, s], x)),
    F(P([top[1], top[2]], x), P([bot[1], bot[2]], x)),
    F(P([1, s], x), P([p, q], x)),
    F(P([p, s], x), P(other, x)),
  ];
  return {
    prompt: `Simplify fully &nbsp; $${F(P(top, x), P(bot, x))}$`,
    answer: $(ans),
    distractors: dis.filter((t) => t !== ans && sensibleFrac(t, false) && !/\\frac\{(.+)\}\{\1\}$/.test(t)).map($),
    solution: [
      `Factorise the numerator: $${P(top, x)} = ${topF}$`,
      useDots ? `The denominator is a difference of two squares: $${P(bot, x)} = ${botF}$` : `Factorise the denominator: $${P(bot, x)} = ${botF}$`,
      `Cancel the common factor $${br(p, q, x)}$.`,
      `Answer: $${ans}$`,
    ],
  };
}, { title: 'Simplify algebraic fractions with ax² + bx + c' });

/* ================================================================== */
/* alg-fractions-operations                                            */
/* ================================================================== */

/** Numerator in exam style: "11 - 2x" rather than "-2x + 11". */
const NP = (arr, x = 'x') => (arr.length === 2 && arr[0] < 0 && arr[1] > 0 ? terms([[arr[1], ''], [arr[0], x]]) : P(arr, x));
/** Drop distractors that are silly at a glance: zero numerators, or numbers where an x-expression is expected. */
const sensibleFrac = (t, needX) => !/^\\frac\{0\}/.test(t) && !/\\frac\{[^}]*\}\{-/.test(t) && (!needX || /^\\frac\{[^}]*x/.test(t));

export const fracAddNumeric = G('alg-frac-add-numeric', 'alg-fractions-operations', (rng, d) => {
  const x = 'x';
  const [m, n] = pick(rng, size(d, [[2, 3], [3, 4], [2, 5], [3, 5]], [[3, 4], [4, 5], [2, 5], [3, 5], [2, 3], [5, 6]], [[4, 6], [6, 9], [4, 10], [3, 4], [5, 3]]));
  const a = intExcept(rng, -7, 7, [0]); const b = intExcept(rng, -7, 7, [0]);
  const pa = d === 'hard' ? int(rng, 1, 3) : 1; const pb = d === 'hard' ? int(rng, 1, 3) : 1;
  const op = d === 'easy' ? '+' : pick(rng, ['+', '-']);
  const L = (m * n) / gcd(m, n);
  const fm = L / m; const fn = L / n; const s = op === '+' ? 1 : -1;
  const numC = [fm * pa + s * fn * pb, fm * a + s * fn * b];
  if (numC[0] === 0) throw new Error('');
  const g = gcd(gcd(Math.abs(numC[0]), Math.abs(numC[1])), L);
  if (g > 1) throw new Error('simplifies further');
  const tex = `${F(P([pa, a], x), m)} ${op} ${F(P([pb, b], x), n)}`;
  const ans = F(NP(numC, x), L);
  const cands = [
    [[pa + s * pb, a + s * b], m + n], // added tops and bottoms
    [[pa + s * pb, a + s * b], L], // did not multiply the numerators
    [[numC[0], fm * a - s * fn * b], L], // sign slip on the second numerator
    [[numC[0], a + s * b], L], // multiplied only the x terms
    [[fn * pa + s * fm * pb, fn * a + s * fm * b], L], // multiplied by the wrong factors
    [[numC[0], numC[1] + 2], L],
    [numC, m * n === L ? L + 1 : m * n],
  ];
  const dis = cands.filter(([nm]) => nm[0] !== 0).map(([nm, dd]) => F(NP(nm, x), dd)).filter((t) => t !== ans && sensibleFrac(t, true));
  return {
    prompt: `Write as a single fraction in its simplest form.<br>$${tex}$`,
    answer: $(ans),
    distractors: dis.map($),
    hint: 'Use a common denominator, and put brackets round each numerator when you multiply it.',
    solution: [
      `The lowest common denominator of ${m} and ${n} is ${L}.`,
      `$${tex} = ${F(`${fm === 1 ? '' : fm}(${P([pa, a], x)})`, L)} ${op} ${F(`${fn === 1 ? '' : fn}(${P([pb, b], x)})`, L)}$`,
      `Expand the numerators: $${P([fm * pa, fm * a], x)}$ ${op === '-' ? `and subtract <b>all</b> of $${P([fn * pb, fn * b], x)}$` : `and $${P([fn * pb, fn * b], x)}$`}`,
      `Answer: $${ans}$`,
    ],
  };
}, { title: 'Add or subtract fractions with number denominators' });

export const fracAddAlgebraic = G('alg-frac-add-algebraic', 'alg-fractions-operations', (rng, d) => {
  const x = 'x';
  const a = int(rng, 1, 7); const b = int(rng, 1, 7);
  const p = intExcept(rng, -6, 6, [0]); const q = intExcept(rng, -6, 6, [0, p]);
  const op = d === 'easy' ? '+' : pick(rng, ['+', '-']);
  const s = op === '+' ? 1 : -1;
  const den = `${br(1, p, x)}${br(1, q, x)}`;
  const hardForm = d === 'hard';
  // Medium/easy: a/(x+p) ± b/(x+q). Hard: ax/(x+p) ± b/(x+q), giving a quadratic numerator.
  const firstTop = hardForm ? `${a === 1 ? '' : a}x` : `${a}`;
  const num = hardForm ? [a, a * q + s * b, s * b * p] : [a + s * b, a * q + s * b * p];
  if (num.every((c) => c === 0) || (!hardForm && num[0] === 0)) throw new Error('');
  const ans = F(NP(num, x), den);
  const tex = `${F(firstTop, P([1, p], x))} ${op} ${F(b, P([1, q], x))}`;
  const cands = hardForm
    ? [[a, a * q - s * b, s * b * p], [a, a * q + s * b, -s * b * p], [a, s * b, s * b * p], [a, a * p + s * b, s * b * q], [a, a * q + s * b, s * b * p + 1]]
    : [[a + s * b, a * q + b * p], [a + s * b, a * p + s * b * q], [a + s * b, a + s * b], [a - s * b, a * q + s * b * p], [a + s * b, a * q + s * b * p + 1]];
  const dis = [
    ...cands.filter((c) => !c.every((t, i) => t === num[i])).map((c) => F(NP(c, x), den)),
    hardForm ? F(P([a, s * b], x), P([2, p + q], x)) : F(a + s * b, P([2, p + q], x)),
    F(NP(num, x), `${br(1, p, x)} + ${br(1, q, x)}`),
  ].filter((t) => t !== ans && sensibleFrac(t, false));
  return {
    prompt: `Write as a single fraction.<br>$${tex}$`,
    answer: $(ans),
    distractors: dis.map($),
    solution: [
      `Common denominator: $${den}$`,
      `$${F(`${firstTop}${br(1, q, x)}`, den)} ${op} ${F(`${b}${br(1, p, x)}`, den)}$`,
      `Numerator: $${hardForm ? P([a, a * q, 0], x) : P([a, a * q], x)} ${op === '-' ? '-' : '+'} (${P([b, b * p], x)}) = ${NP(num, x)}$${op === '-' ? ' (the minus changes the sign of both terms)' : ''}`,
      `Answer: $${ans}$`,
    ],
  };
}, { title: 'Add or subtract fractions with algebraic denominators' });

export const fracMulDiv = G('alg-frac-mul-div', 'alg-fractions-operations', (rng, d) => {
  const x = 'x';
  const p = intExcept(rng, -7, 7, [0]); const q = intExcept(rng, -7, 7, [0, p]);
  const k = pick(rng, [2, 3, 4, 5]); const m = k * pick(rng, [1, 2, 3]);
  const op = d === 'easy' ? 'mul' : pick(rng, ['mul', 'div']);
  // ((x+p)(x+q)) / (k x)  ×  (m x²)/(x+p)  =  (m/k) x (x+q)
  const quad = P(pmul([1, p], [1, q]), x);
  const c = m / k;
  const ansCore = `${c === 1 ? '' : c}${x}${br(1, q, x)}`;
  if (op === 'mul') {
    const tex = `${F(quad, `${k}${x}`)} \\times ${F(`${m}${x}^{2}`, P([1, p], x))}`;
    const dis = [`${c === 1 ? '' : c}${x}${br(1, -q, x)}`, `${c === 1 ? '' : c}${x}${br(1, p, x)}`, `${c === 1 ? '' : c}${x}^{2}${br(1, q, x)}`, `${m * k}${x}${br(1, q, x)}`, F(`${c === 1 ? '' : c}${x}`, P([1, q], x)), `${c === 1 ? '' : c}${br(1, q, x)}`];
    return {
      prompt: `Simplify fully &nbsp; $${tex}$`,
      answer: $(ansCore), distractors: dis.filter((t) => t !== ansCore).map($),
      solution: [
        `Factorise first: $${quad} = ${br(1, p, x)}${br(1, q, x)}$`,
        `$${F(`${br(1, p, x)}${br(1, q, x)}`, `${k}${x}`)} \\times ${F(`${m}${x}^{2}`, P([1, p], x))}$`,
        `Cancel $${br(1, p, x)}$ top and bottom, and $${k}${x}$ into $${m}${x}^{2}$ to leave $${c === 1 ? '' : c}${x}$.`,
        `Answer: $${ansCore}$`,
      ],
    };
  }
  // ((x+p)) / (m x²)  ÷  (k ...)  :  (x+q)/(kx) ÷ (x²+...)/(m x²)  =  (m/k) x / (x + p)
  const tex = `${F(P([1, q], x), `${k}${x}`)} \\div ${F(quad, `${m}${x}^{2}`)}`;
  const ans = F(`${c === 1 ? '' : c}${x}`, P([1, p], x));
  const dis = [F(`${c === 1 ? '' : c}${x}`, P([1, q], x)), F(`${c === 1 ? '' : c}${x}`, P([1, -p], x)), F(P([1, p], x), `${c === 1 ? '' : c}${x}`), F(`${br(1, q, x)}^{2}${br(1, p, x)}`, `${k * m}${x}^{3}`), F(`${m * k}${x}`, P([1, p], x)), F(c === 1 ? 1 : c, P([1, p], x))];
  return {
    prompt: `Simplify fully &nbsp; $${tex}$`,
    answer: $(ans), distractors: dis.filter((t) => t !== ans).map($),
    solution: [
      `To divide, multiply by the reciprocal of the second fraction: $${F(P([1, q], x), `${k}${x}`)} \\times ${F(`${m}${x}^{2}`, quad)}$`,
      `Factorise: $${quad} = ${br(1, p, x)}${br(1, q, x)}$`,
      `Cancel $${br(1, q, x)}$, and $${k}${x}$ into $${m}${x}^{2}$.`,
      `Answer: $${ans}$`,
    ],
  };
}, { title: 'Multiply or divide algebraic fractions' });

export const fracEquation = G('alg-frac-equation', 'alg-fractions-operations', (rng, d) => {
  const x = 'x';
  // a/(x+p) ± b/(x+q) = R  ->  R x² + (R(p+q) − a ∓ b) x + (R pq − a q ∓ b p) = 0
  for (let i = 0; i < 400; i += 1) {
    const a = int(rng, 1, 6); const b = int(rng, 1, 6); const p = intExcept(rng, -5, 5, [0]); const q = intExcept(rng, -5, 5, [0, p]);
    const s = d === 'easy' ? 1 : pick(rng, [1, 1, -1]);
    const R = d === 'hard' ? pick(rng, [1, 2, 2, 3]) : 1;
    const B = R * (p + q) - a - s * b; const C = R * p * q - a * q - s * b * p;
    const disc = B * B - 4 * R * C;
    if (disc <= 0) continue;
    const r = Math.sqrt(disc);
    if (!Number.isInteger(r)) continue;
    const roots = [rat(-B + r, 2 * R), rat(-B - r, 2 * R)];
    const vals = roots.map((v) => (typeof v === 'number' ? v : v.value()));
    if (vals.some((v) => v === -p || v === -q)) continue;
    if (d !== 'hard' && roots.some((v) => typeof v !== 'number')) continue;
    if (d === 'easy' && vals.some((v) => Math.abs(v) > 9)) continue;
    const order = vals[0] >= vals[1] ? [0, 1] : [1, 0];
    const rs = order.map((j) => roots[j]);
    // Factorised form: each root n/m gives (m x − n).
    const fs = rs.map((v) => (typeof v === 'number' ? [1, -v] : [v.d, -v.n]));
    const k = R / (fs[0][0] * fs[1][0]);
    if (!Number.isInteger(k)) continue;
    const ans = rootsText(rs, x);
    const neg = rs.map((v) => (typeof v === 'number' ? -v : v.neg()));
    const dis = [rootsText(neg, x), rootsText([rs[0]], x), rootsText([rs[1]], x)];
    // Common slip: not multiplying the right-hand side by the denominators: a(x+q) ± b(x+p) = R (linear).
    if (a + s * b !== 0) dis.push(rootsText([rat(R - a * q - s * b * p, a + s * b)], x));
    // Sign slip on the second fraction (when subtracting).
    dis.push(rootsText([typeof rs[0] === 'number' ? rs[0] + 1 : rs[0].add(1), typeof rs[1] === 'number' ? rs[1] + 1 : rs[1].add(1)], x));
    dis.push(rootsText([-p, -q].sort((u, v) => v - u), x));
    const op = s > 0 ? '+' : '-';
    return {
      prompt: `Solve &nbsp; $${F(a, P([1, p], x))} ${op} ${F(b, P([1, q], x))} = ${R}$`,
      answer: ans,
      distractors: dis.filter((t) => t !== ans),
      typed: { kind: 'list', values: vals.sort((u, v) => v - u) },
      solution: [
        `Multiply every term by $${br(1, p, x)}${br(1, q, x)}$ — including the right-hand side: $${a}${br(1, q, x)} ${op} ${b}${br(1, p, x)} = ${R === 1 ? '' : R}${br(1, p, x)}${br(1, q, x)}$`,
        `Expand: $${P([a + s * b, a * q + s * b * p], x)} = ${P([R, R * (p + q), R * p * q], x)}$`,
        `Rearrange to make one side zero: $${P([R, B, C], x)} = 0$`,
        `Factorise: $${factored(k, fs, x)} = 0$`,
        `Answer: ${ans}`,
      ],
    };
  }
  throw new Error('no equation');
}, { title: 'Solve an equation with algebraic fractions', learn: ['alg-fractions-operations', 'alg-solve-quad-factorising'] });

export const generators = [
  expandDouble, expandSquare, expandDoubleCoef, expandDoubleArea,
  factoriseQuad, factoriseQuadArea, factoriseQuadCommon,
  dotsBasic, dotsFully, dotsNumeric,
  expandTriple, expandCube, expandTripleIdentity,
  factoriseHard, factoriseHardCommon, factoriseHardOther,
  fracSimplifyLinear, fracSimplifyQuad, fracSimplifyNonMonic,
  fracAddNumeric, fracAddAlgebraic, fracMulDiv, fracEquation,
];

void [line, num];
