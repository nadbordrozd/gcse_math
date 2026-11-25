// Quadratic equations: factorising, the quadratic formula, completing the square.
import { pick, int, intExcept, size, chance, tnum, roundTo, gcd, Frac, frac } from '../../core.js';
import { G, P, br, tf, $, rat, tv, factored, rootsText, surd, pmul } from './lib.js';

const val = (v) => (v instanceof Frac ? v.value() : v);
const neg = (v) => (v instanceof Frac ? v.neg() : -v);
const sortDesc = (rs) => [...rs].sort((a, b) => val(b) - val(a));
const paren = (n) => (n < 0 ? `(${tnum(n)})` : tnum(n));
/** "+ 5" / "- 5" / "" for appending a constant. */
const sc = (c) => (c === 0 ? '' : `${c < 0 ? '-' : '+'} ${Math.abs(c)}`);
/** k√m TeX (k may be 1). */
const surdTex = (k, m) => (m === 1 ? tnum(k) : `${k === 1 ? '' : tnum(k)}\\sqrt{${m}}`);

/* ================================================================== */
/* alg-solve-quad-factorising                                          */
/* ================================================================== */

export const solveQuadMonic = G('alg-solve-quad-monic', 'alg-solve-quad-factorising', (rng, d) => {
  const x = 'x';
  let p = intExcept(rng, -9, 9, [0]); let q = intExcept(rng, -9, 9, [0, p, -p]);
  if (d === 'easy') {
    // Already factorised.
    const ans = rootsText(sortDesc([-p, -q]), x);
    return {
      prompt: `Solve &nbsp; $${br(1, p, x)}${br(1, q, x)} = 0$`,
      answer: ans,
      distractors: [rootsText(sortDesc([p, q]), x), rootsText([-p], x), rootsText(sortDesc([p, -q]), x), rootsText(sortDesc([-p, q]), x), rootsText(sortDesc([p * q, p + q]), x)].filter((t) => t !== ans),
      typed: { kind: 'list', values: sortDesc([-p, -q]) },
      solution: [
        `If two things multiply to give 0, one of them must be 0.`,
        `$${P([1, p], x)} = 0$ gives $x = ${tnum(-p)}$; &nbsp; $${P([1, q], x)} = 0$ gives $x = ${tnum(-q)}$.`,
        `Answer: ${ans}`,
      ],
    };
  }
  if (d === 'medium' && p < 0 && q < 0) p = -p;
  const coefs = [1, p + q, p * q];
  if (p + q === 0) throw new Error('');
  const roots = sortDesc([-p, -q]);
  const ans = rootsText(roots, x);
  return {
    prompt: `Solve &nbsp; $${P(coefs, x)} = 0$`,
    answer: ans,
    distractors: [rootsText(sortDesc([p, q]), x), rootsText([roots[0]], x), rootsText([roots[1]], x), rootsText(sortDesc([p, -q]), x), rootsText(sortDesc([-p, q]), x)].filter((t) => t !== ans),
    typed: { kind: 'list', values: roots },
    hint: 'Factorise first, then set each bracket equal to zero.',
    solution: [
      `Find two numbers that multiply to $${tnum(p * q)}$ and add to $${tnum(p + q)}$: $${tnum(p)}$ and $${tnum(q)}$.`,
      `Factorise: $${br(1, p, x)}${br(1, q, x)} = 0$`,
      `Set each bracket to zero: $x = ${tnum(-p)}$ or $x = ${tnum(-q)}$ (the signs are the opposite of those in the brackets).`,
      `Answer: ${ans}`,
    ],
  };
}, { title: 'Solve x² + bx + c = 0 by factorising' });

export const solveQuadRearrange = G('alg-solve-quad-rearrange', 'alg-solve-quad-factorising', (rng, d) => {
  const x = 'x';
  const form = pick(rng, size(d, ['x2=k', 'x2-ax'], ['x2=bx+c', 'x(x+a)=k', 'x2-ax'], ['x2=bx+c', 'x(x+a)=k', '(x+a)2=k', 'x2+c=bx']));
  let prompt; let roots; let steps; let wrongs;
  if (form === 'x2=k') {
    const n = int(rng, 2, 12); const k = d === 'easy' ? 1 : pick(rng, [1, 2, 3]);
    prompt = `$${k === 1 ? '' : k}x^{2} = ${k * n * n}$`;
    roots = [n, -n];
    wrongs = [[n], [n * n * k / 2], [k * n * n / 2, -k * n * n / 2], [n * n, -n * n]];
    steps = [...(k > 1 ? [`Divide by ${k}: $x^{2} = ${n * n}$`] : []), `Square root both sides. There are <b>two</b> square roots: $x = ${n}$ or $x = -${n}$.`];
  } else if (form === 'x2-ax') {
    const a = intExcept(rng, -12, 12, [0, 1, -1]); const k = d === 'easy' ? 1 : pick(rng, [1, 2, 3]);
    prompt = `$${P([k, -k * a, 0], x)} = 0$`;
    roots = [a, 0];
    wrongs = [[a], [-a, 0], [-a], [k * a, 0]];
    steps = [`Factorise (don't divide by $x$, you would lose a solution): $${k === 1 ? '' : k}x${br(1, -a, x)} = 0$`, `So $x = 0$ or $${P([1, -a], x)} = 0$, giving $x = ${tnum(a)}$.`];
  } else if (form === 'x2=bx+c') {
    const p = intExcept(rng, -9, 9, [0]); const q = intExcept(rng, -9, 9, [0, -p]);
    const B = -(p + q); const C = -p * q; // x² = B x + C  where roots are -p, -q ... keep x² − Bx − C = (x+p)(x+q)
    prompt = `$x^{2} = ${P([B, C], x)}$`;
    if (B === 0 || C === 0) throw new Error('');
    roots = [-p, -q];
    wrongs = [[p, q], [-p], [-q], [-(p - 2 * 0), q]];
    steps = [`Rearrange to make one side zero: $${P([1, -B, -C], x)} = 0$`, `Factorise: $${br(1, p, x)}${br(1, q, x)} = 0$`, `So $x = ${tnum(-p)}$ or $x = ${tnum(-q)}$.`];
  } else if (form === 'x2+c=bx') {
    const p = intExcept(rng, -9, 9, [0]); const q = intExcept(rng, -9, 9, [0, -p]);
    const b = -(p + q); const c = p * q;
    if (b === 0) throw new Error('');
    prompt = `$x^{2} ${sc(c)} = ${P([-b, 0], x)}$`;
    roots = [-p, -q];
    wrongs = [[p, q], [-p], [-q], [p, -q]];
    steps = [`Rearrange to make one side zero: $${P([1, b, c], x)} = 0$`, `Factorise: $${br(1, p, x)}${br(1, q, x)} = 0$`, `So $x = ${tnum(-p)}$ or $x = ${tnum(-q)}$.`];
  } else if (form === 'x(x+a)=k') {
    const r = int(rng, 1, 9); const a = intExcept(rng, -6, 9, [0, -2 * r]);
    const k = r * (r + a);
    if (k === 0) throw new Error('');
    const other = -(r + a);
    prompt = `$x${br(1, a, x)} = ${tnum(k)}$`;
    roots = [r, other];
    if (r === other) throw new Error('');
    wrongs = [[0, -a], [-r, -other], [r], [k, k - a]];
    steps = [`Expand and make one side zero: $${P([1, a, -k], x)} = 0$`, `Factorise: $${br(1, -r, x)}${br(1, -other, x)} = 0$`, `So $x = ${tnum(r)}$ or $x = ${tnum(other)}$. (Setting $x = ${tnum(k)}$ and $${P([1, a], x)} = ${tnum(k)}$ is wrong: that only works when the right-hand side is 0.)`];
  } else {
    const a = intExcept(rng, -7, 7, [0]); const n = int(rng, 2, 9);
    prompt = `$${br(1, a, x)}^{2} = ${n * n}$`;
    roots = [n - a, -n - a];
    wrongs = [[n - a], [n + a, -n + a], [n * n - a], [n, -n]];
    steps = [`Square root both sides (both signs): $${P([1, a], x)} = ${n}$ or $${P([1, a], x)} = -${n}$`, `So $x = ${tnum(n - a)}$ or $x = ${tnum(-n - a)}$.`];
  }
  const rs = sortDesc(roots);
  const ans = rootsText(rs, x);
  return {
    prompt: `Solve &nbsp; ${prompt}`,
    answer: ans,
    distractors: wrongs.filter((w) => w.every(Number.isFinite)).map((w) => rootsText(sortDesc(w.map((t) => (Number.isInteger(t) ? t : rat(Math.round(t * 2), 2)))), x)).filter((t) => t !== ans),
    typed: { kind: 'list', values: rs },
    solution: [...steps, `Answer: ${ans}`],
  };
}, { title: 'Rearrange then solve a quadratic' });

export const solveQuadNonMonic = G('alg-solve-quad-nonmonic', 'alg-solve-quad-factorising', (rng, d) => {
  const x = 'x';
  // (p x + q)(x + s) = 0  roots −q/p and −s
  const p = pick(rng, size(d, [2, 3], [2, 3, 5], [2, 3, 4, 5, 6]));
  const q = intExcept(rng, -9, 9, [0]); const s = intExcept(rng, -8, 8, [0]);
  if (gcd(p, Math.abs(q)) !== 1) throw new Error('');
  const r = d === 'hard' && chance(rng, 0.4) ? pick(rng, [2, 3]) : 1;
  let fs = [[p, q], [r, s]];
  if (r > 1 && gcd(r, Math.abs(s)) !== 1) throw new Error('');
  const coefs = pmul(fs[0], fs[1]);
  if (coefs[1] === 0) throw new Error('');
  const roots = sortDesc([rat(-q, p), rat(-s, r)]);
  const ans = rootsText(roots, x);
  const wrongs = [sortDesc([rat(q, p), rat(s, r)]), sortDesc([-q, rat(-s, r)]), sortDesc([rat(-p, q), rat(-s, r)]), [roots[0]], [roots[1]], sortDesc([rat(-q, r), rat(-s, p)])];
  return {
    prompt: `Solve &nbsp; $${P(coefs, x)} = 0$`,
    answer: ans,
    distractors: wrongs.map((w) => rootsText(w, x)).filter((t) => t !== ans),
    typed: { kind: 'list', values: roots.map(val) },
    solution: [
      `Factorise: $${coefs[0]} \\times ${paren(coefs[2])} = ${tnum(coefs[0] * coefs[2])}$; two numbers with this product and sum $${tnum(coefs[1])}$ are $${tnum(p * s)}$ and $${tnum(q * r)}$.`,
      `$${P(coefs, x)} = ${factored(1, fs, x)}$`,
      `Set each bracket to zero: $${P([p, q], x)} = 0$ gives $x = ${tv(rat(-q, p))}$; &nbsp; $${P([r, s], x)} = 0$ gives $x = ${tv(rat(-s, r))}$.`,
      `Answer: ${ans}`,
    ],
  };
}, { title: 'Solve ax² + bx + c = 0 by factorising' });

// Contexts that lead to a quadratic with one sensible (positive) root.
export const solveQuadContext = G('alg-solve-quad-context', 'alg-solve-quad-factorising', (rng, d) => {
  const ctx = pick(rng, size(d, ['rect', 'square', 'consec'], ['rect', 'consec', 'triangle', 'path'], ['rect', 'triangle', 'path', 'consecOdd', 'square']));
  const xv = int(rng, 3, 12);
  let text; let coefsTex; let eqTex; let rejectRoot; let ask; let ansVal; let unit = '';
  if (ctx === 'rect') {
    const a = int(rng, 1, 6); const b = intExcept(rng, -2, 5, [0]);
    if (xv + b <= 0) throw new Error('');
    const area = (xv + a) * (xv + b);
    // x² + (a+b)x + ab − area = 0 → (x − xv)(x + xv + a + b)
    rejectRoot = -(xv + a + b);
    text = `A rectangle has length $(x + ${a})$ cm and width $${br(1, b, 'x')}$ cm. Its area is ${area} cm².`;
    eqTex = `${br(1, a, 'x')}${br(1, b, 'x')} = ${area}`; coefsTex = P([1, a + b, a * b - area]);
    ask = 'Work out the value of $x$.'; ansVal = xv;
  } else if (ctx === 'square') {
    const a = int(rng, 1, 6);
    const area = (xv + a) ** 2 - 2 * (xv + a);
    // side (x + a), remove 2 strips... simpler: square of side (x + a) has area equal to 2(x + a) + k → keep: (x+a)(x+a−2)?
    text = `A square has sides of length $(x + ${a})$ cm. A rectangle measuring $(x + ${a})$ cm by 2 cm is cut off one side, leaving an area of ${area} cm².`;
    eqTex = `(x + ${a})(x + ${a - 2}) = ${area}`.replace('+ 0', '').replace('+ -', '- ').replace('(x )', '(x)');
    coefsTex = P([1, 2 * a - 2, a * (a - 2) - area]);
    rejectRoot = -(xv + 2 * a - 2);
    ask = 'Work out the value of $x$.'; ansVal = xv;
  } else if (ctx === 'consec' || ctx === 'consecOdd') {
    const step = ctx === 'consec' ? 1 : 2;
    const n = ctx === 'consec' ? xv : 2 * xv + 1;
    const prod = n * (n + step);
    text = `The product of two consecutive ${ctx === 'consec' ? 'positive integers' : 'positive odd numbers'} is ${prod}. Let the smaller one be $n$.`;
    eqTex = `n(n + ${step}) = ${prod}`; coefsTex = P([1, step, -prod], 'n');
    rejectRoot = -(n + step);
    ask = 'What is the larger number?'; ansVal = n + step;
    const sol = n;
    return finish(sol);
  } else if (ctx === 'triangle') {
    // Right-angled triangle legs x and x + a, hypotenuse h: x² + (x+a)² = h²; use Pythagorean triples.
    const triples = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [6, 8, 10], [9, 12, 15], [12, 16, 20], [9, 40, 41], [15, 20, 25]];
    const [s1, s2, h] = pick(rng, triples);
    const a = s2 - s1;
    text = `A right-angled triangle has shorter sides $x$ cm and $(x + ${a})$ cm. The hypotenuse is ${h} cm.`;
    eqTex = `x^{2} + (x + ${a})^{2} = ${h * h}`; coefsTex = P([2, 2 * a, a * a - h * h]);
    rejectRoot = -s2;
    ask = 'Work out the value of $x$.'; ansVal = s1; unit = '';
    return finish(s1, true);
  } else {
    // path: garden x by (x + a) with path of width 1 around, total area T
    const a = int(rng, 1, 5);
    const total = (xv + 2) * (xv + a + 2);
    text = `A rectangular lawn is $x$ m wide and $(x + ${a})$ m long. A path 1 m wide goes all the way round it. The lawn and path together cover ${total} m².`;
    eqTex = `(x + 2)(x + ${a + 2}) = ${total}`; coefsTex = P([1, a + 4, 2 * (a + 2) - total]);
    rejectRoot = -(xv + a + 4);
    ask = 'Work out the width of the lawn.'; ansVal = xv; unit = ' m';
  }
  return finish(xv);

  function finish(root, halve = false) {
    const v = ctx === 'consec' || ctx === 'consecOdd' ? 'n' : 'x';
    const rootTxt = `$${v} = ${tnum(root)}$ or $${v} = ${tnum(rejectRoot)}$`;
    const fmt = (t) => `$${tnum(t)}$${unit ? unit : ''}`;
    const wrong = [rejectRoot, -rejectRoot, root + 1, root - 1, ansVal + 2, ansVal - 2, ansVal * 2].filter((w) => w !== ansVal && w > 0);
    return {
      prompt: `${text}<br>${ask}`,
      answer: fmt(ansVal),
      distractors: wrong.map(fmt),
      typed: { kind: 'number', value: ansVal },
      solution: [
        `Form an equation: $${eqTex}$`,
        `Expand and make one side zero: $${coefsTex} = 0$${halve ? ` (you can divide by 2 first)` : ''}`,
        `Factorise and solve: ${rootTxt}.`,
        `${ctx.startsWith('consec') ? 'The numbers are positive' : 'A length cannot be negative'}, so reject $${tnum(rejectRoot)}$: $${v} = ${tnum(root)}$.${ansVal !== root ? ` The answer is ${tnum(ansVal)}.` : ''}`,
        `Answer: ${fmt(ansVal)}`,
      ],
    };
  }
}, { title: 'Quadratic equations from shapes and numbers', learn: ['alg-solve-quad-factorising', 'alg-forming-equations', 'trig-pythagoras'] });

/* ================================================================== */
/* alg-quadratic-formula                                               */
/* ================================================================== */

function formulaRoots(a, b, c) {
  const D = b * b - 4 * a * c;
  if (D <= 0) return null;
  const r = Math.sqrt(D);
  if (Number.isInteger(r)) return null; // would factorise: not a formula question
  return [(-b + r) / (2 * a), (-b - r) / (2 * a)];
}
const dp2 = (v) => roundTo(v, 2);
const rootsDp = (rs, x = 'x') => rs.map((r) => `$${x} = ${tnum(dp2(r), 2)}$`).join(' or ');

function formulaQuestion(rng, a, b, c, x, prompt, extraSteps = []) {
  const rs = formulaRoots(a, b, c);
  if (!rs) throw new Error('not a formula question');
  if (rs.some((r) => Math.abs(dp2(r)) < 0.01)) throw new Error('rounds to zero');
  if (rs.some((r) => Math.abs(Math.abs(dp2(r) * 1000) - Math.round(Math.abs(r) * 1000)) === 5)) throw new Error('borderline rounding');
  const D = b * b - 4 * a * c;
  const ans = rootsDp(sortDesc(rs), x);
  const w = [];
  w.push(sortDesc([(b + Math.sqrt(D)) / (2 * a), (b - Math.sqrt(D)) / (2 * a)])); // sign of b
  w.push(sortDesc([-b + Math.sqrt(D) / (2 * a), -b - Math.sqrt(D) / (2 * a)])); // only √ divided by 2a
  w.push(sortDesc([(-b + Math.sqrt(D)) / a, (-b - Math.sqrt(D)) / a])); // divided by a not 2a
  const D2 = b * b + 4 * a * c; if (D2 > 0) w.push(sortDesc([(-b + Math.sqrt(D2)) / (2 * a), (-b - Math.sqrt(D2)) / (2 * a)])); // sign of c
  const D3 = b * b - a * c; if (D3 > 0) w.push(sortDesc([(-b + Math.sqrt(D3)) / (2 * a), (-b - Math.sqrt(D3)) / (2 * a)])); // forgot the 4
  w.push(sortDesc(rs.map((r) => roundTo(r, 1))));
  return {
    prompt,
    answer: ans,
    distractors: w.filter((p) => p.every(Number.isFinite)).map((p) => (p.length === 2 && p[0].toFixed(2).length > 6 ? null : rootsDp(p, x))).filter((t) => t && t !== ans && !/\.\d$/.test(t)).concat([rootsDp(sortDesc(rs).map((r) => -r), x)]),
    typed: { kind: 'list', values: sortDesc(rs).map(dp2) },
    calculator: true,
    solution: [
      ...extraSteps,
      `Use $x = \\dfrac{-b \\pm \\sqrt{b^{2} - 4ac}}{2a}$ with $a = ${tnum(a)}$, $b = ${tnum(b)}$, $c = ${tnum(c)}$.`,
      `$b^{2} - 4ac = ${paren(b)}^{2} - 4 \\times ${paren(a)} \\times ${paren(c)} = ${tnum(D)}$`,
      `$x = \\dfrac{${tnum(-b)} \\pm \\sqrt{${D}}}{${2 * a}}$, so $x = ${tnum(rs[0], 4).replace(/0+$/, '')}…$ or $x = ${tnum(rs[1], 4).replace(/0+$/, '')}…$`.replace(/(\d\.\d{3})\d…/g, '$1…'),
      `Round to 2 decimal places. Answer: ${ans}`,
    ],
  };
}

export const quadFormula = G('alg-quad-formula-solve', 'alg-quadratic-formula', (rng, d) => {
  const x = 'x';
  const a = size(d, 1, pick(rng, [1, 2, 3]), pick(rng, [2, 3, 4, 5, -2]));
  const b = intExcept(rng, -9, 9, [0]); const c = intExcept(rng, -9, 9, [0]);
  return formulaQuestion(rng, a, b, c, x, `Solve &nbsp; $${P([a, b, c], x)} = 0$<br>Give your answers to 2 decimal places.`);
}, { title: 'Solve with the quadratic formula (2 dp)' });

export const quadFormulaRearrange = G('alg-quad-formula-rearrange', 'alg-quadratic-formula', (rng, d) => {
  const x = 'x';
  const form = pick(rng, size(d, ['x(ax+b)=c', 'ax2=bx+c'], ['x(ax+b)=c', 'ax2=bx+c', 'rect'], ['rect', 'frac', 'x(ax+b)=c', 'brackets']));
  if (form === 'rect') {
    // x by (x + a), area A: x² + a x − A = 0 → positive root only
    const a = int(rng, 1, 9); const A = int(rng, 10, 60);
    const rs = formulaRoots(1, a, -A); if (!rs) throw new Error('');
    const root = Math.max(...rs); const v = dp2(root);
    if (Math.abs(Math.abs(root * 1000) - Math.round(Math.abs(root) * 1000)) < 1e-9) throw new Error('');
    const D = a * a + 4 * A;
    const fmt = (t) => `$${tnum(t, 2)}$ cm`;
    return {
      prompt: `A rectangle is $x$ cm wide and $(x + ${a})$ cm long. Its area is ${A} cm².<br>Work out the value of $x$. Give your answer to 2 decimal places.`,
      answer: fmt(v),
      distractors: [dp2(-Math.min(...rs)), dp2((-a + Math.sqrt(a * a + A)) / 2), dp2(-a + Math.sqrt(D) / 2), dp2(Math.sqrt(A) - a / 2), dp2(v + 0.1), dp2((-a + Math.sqrt(D)))].filter((t) => t > 0 && t !== v).map(fmt),
      typed: { kind: 'number', value: v, tolerance: 0.005 },
      calculator: true,
      solution: [
        `Area: $x(x + ${a}) = ${A}$, so $${P([1, a, -A], x)} = 0$`,
        `Quadratic formula: $x = \\dfrac{-${a} \\pm \\sqrt{${a}^{2} - 4 \\times 1 \\times (-${A})}}{2} = \\dfrac{-${a} \\pm \\sqrt{${D}}}{2}$`,
        `$x = ${tnum(dp2(root), 2)}$ or $x = ${tnum(dp2(Math.min(...rs)), 2)}$. A width can't be negative.`,
        `Answer: ${fmt(v)}`,
      ],
    };
  }
  let a; let b; let c; let prompt; let pre;
  if (form === 'x(ax+b)=c') {
    a = int(rng, 1, 4); b = intExcept(rng, -9, 9, [0]); const k = intExcept(rng, -9, 12, [0]);
    c = -k;
    prompt = `$x${br(a, b, x)} = ${k}$`;
    pre = [`Expand and make one side zero: $${P([a, b, c], x)} = 0$`];
  } else if (form === 'ax2=bx+c') {
    a = int(rng, 1, 5); const B = intExcept(rng, -9, 9, [0]); const C = intExcept(rng, -9, 9, [0]);
    b = -B; c = -C;
    prompt = `$${a === 1 ? '' : a}x^{2} = ${P([B, C], x)}$`;
    pre = [`Rearrange to make one side zero: $${P([a, b, c], x)} = 0$`];
  } else if (form === 'frac') {
    // (x + p)/(x) ... : 1/x + 1/(x + p) = 1 → x + p + x = x(x + p) → x² + (p − 2)x − p = 0
    const p = int(rng, 1, 9);
    a = 1; b = p - 2; c = -p;
    if (b === 0) throw new Error('');
    prompt = `$\\dfrac{1}{x} + \\dfrac{1}{x + ${p}} = 1$`;
    pre = [`Multiply every term by $x(x + ${p})$: $(x + ${p}) + x = x(x + ${p})$`, `Rearrange: $${P([1, b, c], x)} = 0$`];
  } else {
    // (x + p)(x + q) = k with non-square discriminant
    const p = intExcept(rng, -5, 5, [0]); const q = intExcept(rng, -5, 5, [0]); const k = intExcept(rng, 1, 15, []);
    a = 1; b = p + q; c = p * q - k;
    if (b === 0) throw new Error('');
    prompt = `$${br(1, p, x)}${br(1, q, x)} = ${k}$`;
    pre = [`Expand and make one side zero: $${P([1, b, c], x)} = 0$`];
  }
  return formulaQuestion(rng, a, b, c, x, `Solve &nbsp; ${prompt}<br>Give your answers to 2 decimal places.`, pre);
}, { title: 'Rearrange then use the quadratic formula' });

export const quadFormulaSurd = G('alg-quad-formula-surd', 'alg-quadratic-formula', (rng, d) => {
  const x = 'x';
  // Easy: a = 1, b odd, no surd to simplify (straight substitution). Medium: b even, so the surd simplifies and divides by 2. Hard: a = 2 or 3.
  const a = d === 'hard' ? pick(rng, [2, 3]) : 1;
  const b = d === 'medium' ? 2 * intExcept(rng, -5, 5, [0]) : d === 'easy' ? 2 * int(rng, -4, 4) + 1 : intExcept(rng, -9, 9, [0]);
  const c = intExcept(rng, -9, 9, [0]);
  const D = b * b - 4 * a * c;
  if (D <= 0) throw new Error('');
  const [k, m] = surd(D);
  if (m === 1) throw new Error('factorises');
  if (d === 'easy' && k !== 1) throw new Error('keep easy free of surd simplification');
  // x = (−b ± k√m) / (2a), simplify by g = gcd(b, k, 2a)
  const g = gcd(gcd(Math.abs(b), k), 2 * a);
  const B = -b / g; const K = k / g; const A2 = (2 * a) / g;
  const top = `${B === 0 ? '' : tnum(B)} \\pm ${surdTex(K, m)}`;
  const ansTex = A2 === 1 ? `x = ${top}` : `x = \\dfrac{${top}}{${A2}}`;
  const wrongTop = (bb, kk, mm, den) => (den === 1 ? `x = ${bb === 0 ? '' : tnum(bb)} \\pm ${surdTex(kk, mm)}` : `x = \\dfrac{${bb === 0 ? '' : tnum(bb)} \\pm ${surdTex(kk, mm)}}{${den}}`);
  const [k2, m2] = surd(b * b + 4 * a * c > 0 ? b * b + 4 * a * c : 2);
  const dis = [
    wrongTop(-B, K, m, A2),
    wrongTop(B, K * 2, m, A2 * 2 === 2 && a === 1 ? 1 : A2),
    wrongTop(B, K, m, A2 * 2),
    wrongTop(-b, 1, D, 2 * a) === `x = ${top}` ? null : wrongTop(B, K, m * 4 > 200 ? m + 1 : m + 1, A2),
    wrongTop(B, k2 === K && m2 === m ? K + 1 : k2, m2, A2),
  ].filter(Boolean);
  return {
    prompt: `Solve &nbsp; $${P([a, b, c], x)} = 0$<br>Give your answers in surd form, as simply as possible.`,
    answer: $(ansTex),
    distractors: dis.filter((t) => t !== ansTex).map($),
    solution: [
      `Use the formula with $a = ${a}$, $b = ${tnum(b)}$, $c = ${tnum(c)}$: &nbsp; $b^{2} - 4ac = ${tnum(b * b)} ${c * a > 0 ? '-' : '+'} ${Math.abs(4 * a * c)} = ${D}$`,
      `$x = \\dfrac{${tnum(-b)} \\pm \\sqrt{${D}}}{${2 * a}}$`,
      ...(k > 1 ? [`Simplify the surd: $\\sqrt{${D}} = \\sqrt{${k * k} \\times ${m}} = ${surdTex(k, m)}$`] : []),
      ...(g > 1 ? [`Divide every term by ${g}.`] : []),
      `Answer: $${ansTex}$`,
    ],
  };
}, { title: 'Exact (surd) solutions with the formula' });

/* ================================================================== */
/* alg-completing-square                                               */
/* ================================================================== */

/** (x + p)² + q as TeX, with p, q integers or Frac. */
function ctsTex(p, q, x = 'x', a = 1) {
  const pv = val(p);
  const inner = pv === 0 ? x : `${x} ${pv < 0 ? '-' : '+'} ${tv(pv < 0 ? neg(p) : p)}`;
  const qv = val(q);
  const pre = a === 1 ? '' : a === -1 ? '-' : tnum(a);
  return `${pre}(${inner})^{2}${qv === 0 ? '' : ` ${qv < 0 ? '-' : '+'} ${tv(qv < 0 ? neg(q) : q)}`}`;
}

export const ctsForm = G('alg-cts-form', 'alg-completing-square', (rng, d) => {
  const x = 'x';
  // Easy: small positive even b and positive c. Medium: negatives. Hard: odd b (fractions).
  const b = d === 'hard' ? 2 * intExcept(rng, -6, 6, [0]) + pick(rng, [1, -1]) : d === 'easy' ? 2 * int(rng, 1, 4) : 2 * intExcept(rng, -7, 7, [0]);
  const c = d === 'easy' ? int(rng, 1, 12) : intExcept(rng, -15, 20, [0]);
  if (d === 'medium' && b > 0 && c > 0) throw new Error('medium has a negative');
  const p = rat(b, 2); const pp = rat(b * b, 4);
  const q = pp instanceof Frac ? frac(c).sub(pp) : c - pp;
  const qn = q instanceof Frac && q.isInt ? q.n : q;
  const ans = ctsTex(p, qn, x);
  const addq = pp instanceof Frac ? frac(c).add(pp) : c + pp;
  const dis = [
    ctsTex(b, c - b * b, x),
    ctsTex(p, addq instanceof Frac && addq.isInt ? addq.n : addq, x),
    ctsTex(neg(p), qn, x),
    ctsTex(p, c, x),
    ctsTex(p, neg(qn), x),
    ctsTex(p, c - Math.abs(b), x),
  ];
  return {
    prompt: `Write &nbsp; $${P([1, b, c], x)}$ &nbsp; in the form $(x + p)^{2} + q$.`,
    answer: $(ans),
    distractors: dis.filter((t) => t !== ans).map($),
    hint: 'Halve the coefficient of x for p. Then subtract p² to balance.',
    solution: [
      `Halve the coefficient of $x$: $${tnum(b)} \\div 2 = ${tv(p)}$, so start with $(x ${val(p) < 0 ? '-' : '+'} ${tv(val(p) < 0 ? neg(p) : p)})^{2}$.`,
      `$(x ${val(p) < 0 ? '-' : '+'} ${tv(val(p) < 0 ? neg(p) : p)})^{2} = ${P([1, b, 0], x)} + ${tv(pp)}$, which has an extra $${tv(pp)}$, so subtract it.`,
      `$${P([1, b, c], x)} = ${ctsTex(p, 0, x)} - ${tv(pp)} ${sc(c)} = ${ans}$`,
      `Answer: $${ans}$`,
    ],
  };
}, { title: 'Complete the square: x² + bx + c' });

export const ctsTurning = G('alg-cts-turning-point', 'alg-completing-square', (rng, d) => {
  const x = 'x';
  const p = intExcept(rng, -7, 7, [0]); const q = intExcept(rng, -15, 15, [0]);
  const b = 2 * p; const c = p * p + q;
  const ask = d === 'easy' ? 'fromForm' : pick(rng, ['tp', 'min', d === 'hard' ? 'tp' : 'fromForm']);
  if (ask === 'fromForm') {
    const ans = `(${tnum(-p)}, ${tnum(q)})`;
    return {
      prompt: `The equation of a curve is &nbsp; $y = ${ctsTex(p, q, x)}$<br>Write down the coordinates of its turning point.`,
      answer: $(ans),
      distractors: [`(${tnum(p)}, ${tnum(q)})`, `(${tnum(-p)}, ${tnum(-q)})`, `(${tnum(p)}, ${tnum(-q)})`, `(${tnum(q)}, ${tnum(-p)})`, `(0, ${tnum(q)})`].map($),
      typed: { kind: 'coord', x: -p, y: q },
      solution: [
        `$(x ${p < 0 ? '-' : '+'} ${Math.abs(p)})^{2}$ is never negative; it is smallest (zero) when $x = ${tnum(-p)}$.`,
        `Then $y = 0 ${q < 0 ? '-' : '+'} ${Math.abs(q)} = ${tnum(q)}$, the minimum value.`,
        `Answer: $${ans}$`,
      ],
    };
  }
  if (ask === 'min') {
    return {
      prompt: `By completing the square, find the minimum value of &nbsp; $${P([1, b, c], x)}$`,
      answer: $(tnum(q)),
      distractors: [c, -q, p * p, -p, c - p * p * 2, q + 1].filter((w) => w !== q).map((w) => $(tnum(w))),
      typed: { kind: 'number', value: q },
      solution: [
        `$${P([1, b, c], x)} = ${ctsTex(p, q, x)}$ (halve $${tnum(b)}$ to get $${tnum(p)}$, then subtract $${paren(p)}^{2} = ${p * p}$).`,
        `A square is never negative, so the smallest value of $(x ${p < 0 ? '-' : '+'} ${Math.abs(p)})^{2}$ is 0, when $x = ${tnum(-p)}$.`,
        `So the minimum value is $${tnum(q)}$.`,
        `Answer: $${tnum(q)}$`,
      ],
    };
  }
  const ans = `(${tnum(-p)}, ${tnum(q)})`;
  return {
    prompt: `By completing the square, find the coordinates of the turning point of &nbsp; $y = ${P([1, b, c], x)}$`,
    answer: $(ans),
    distractors: [`(${tnum(p)}, ${tnum(q)})`, `(${tnum(-p)}, ${tnum(c)})`, `(${tnum(-b)}, ${tnum(c - b * b)})`, `(${tnum(p)}, ${tnum(-q)})`, `(${tnum(-p)}, ${tnum(c + p * p)})`].map($),
    typed: { kind: 'coord', x: -p, y: q },
    solution: [
      `Complete the square: halve $${tnum(b)}$ to get $${tnum(p)}$; $${P([1, b, c], x)} = ${ctsTex(p, 0, x)} - ${p * p} ${sc(c)} = ${ctsTex(p, q, x)}$`,
      `The turning point is where the bracket is zero: $x = ${tnum(-p)}$ (note the sign change), and then $y = ${tnum(q)}$.`,
      `Answer: $${ans}$`,
    ],
  };
}, { title: 'Turning point / minimum by completing the square', learn: ['alg-completing-square', 'gr-quadratic-graphs'] });

export const ctsSolve = G('alg-cts-solve', 'alg-completing-square', (rng, d) => {
  const x = 'x';
  const p = intExcept(rng, -6, 6, [0]);
  const r = pick(rng, size(d, [2, 3, 5, 7], [2, 3, 5, 6, 7, 8, 10, 11, 12], [8, 12, 18, 20, 27, 28, 32, 45, 50]));
  // (x + p)² = r  →  x² + 2p x + p² − r = 0
  const b = 2 * p; const c = p * p - r;
  if (c === 0) throw new Error('');
  const [k, m] = surd(r);
  if (m === 1) throw new Error('');
  const ans = `x = ${tnum(-p)} \\pm ${surdTex(k, m)}`;
  const dis = [`x = ${tnum(p)} \\pm ${surdTex(k, m)}`, `x = ${tnum(-p)} \\pm ${r}`, `x = ${tnum(-p)} \\pm \\sqrt{${r + 2 * p * p}}`, `x = ${tnum(-b)} \\pm ${surdTex(k, m)}`, `x = ${tnum(-p)} \\pm \\sqrt{${Math.abs(c)}}`];
  return {
    prompt: `By completing the square, solve &nbsp; $${P([1, b, c], x)} = 0$<br>Give your answers in the form $a \\pm \\sqrt{b}$ or $a \\pm c\\sqrt{b}$, simplified.`,
    answer: $(ans),
    distractors: dis.filter((t) => t !== ans).map($),
    solution: [
      `Complete the square: $${ctsTex(p, c - p * p, x)} = 0$`,
      `Rearrange: $(x ${p < 0 ? '-' : '+'} ${Math.abs(p)})^{2} = ${r}$`,
      `Square root (both signs): $x ${p < 0 ? '-' : '+'} ${Math.abs(p)} = \\pm\\sqrt{${r}}${k > 1 ? ` = \\pm ${surdTex(k, m)}` : ''}$`,
      `Answer: $${ans}$`,
    ],
  };
}, { title: 'Solve by completing the square (surd answers)' });

export const ctsNonMonic = G('alg-cts-nonmonic', 'alg-completing-square', (rng, d) => {
  const x = 'x';
  const a = pick(rng, size(d, [2, 3], [2, 3, 4, 5], [2, 3, 4, 5, 6]));
  const p = intExcept(rng, -5, 5, [0]); const q = intExcept(rng, -20, 20, [0]);
  // a(x + p)² + q = a x² + 2ap x + a p² + q
  const b = 2 * a * p; const c = a * p * p + q;
  const ans = ctsTex(p, q, x, a);
  const ask = d === 'easy' ? 'form' : pick(rng, ['form', 'form', 'q']);
  if (ask === 'q') {
    return {
      prompt: `$${P([a, b, c], x)} \\equiv a(x + b)^{2} + c$<br>Work out the value of $c$.`,
      answer: $(tnum(q)),
      distractors: [c - p * p, c - 2 * a * p * p, c + a * p * p, -q, c - a * a * p * p, q + a].filter((w) => w !== q).map((w) => $(tnum(w))),
      typed: { kind: 'number', value: q },
      solution: [
        `Take out the factor ${a} from the first two terms: $${tnum(a)}(x^{2} ${2 * p < 0 ? '-' : '+'} ${Math.abs(2 * p)}x) ${sc(c)}$`,
        `Complete the square inside: $x^{2} ${2 * p < 0 ? '-' : '+'} ${Math.abs(2 * p)}x = (x ${p < 0 ? '-' : '+'} ${Math.abs(p)})^{2} - ${p * p}$`,
        `So $${tnum(a)}[(x ${p < 0 ? '-' : '+'} ${Math.abs(p)})^{2} - ${p * p}] ${sc(c)} = ${ans}$ (the ${p * p} is multiplied by ${a} too).`,
        `Answer: $c = ${tnum(q)}$`,
      ],
    };
  }
  const dis = [ctsTex(p, c - p * p, x, a), ctsTex(2 * p, c - a * 4 * p * p, x, a), ctsTex(neg(p), q, x, a), ctsTex(p, c + a * p * p, x, a), ctsTex(rat(b, 2), c - b * b / 4, x, a)];
  return {
    prompt: `Write &nbsp; $${P([a, b, c], x)}$ &nbsp; in the form $a(x + b)^{2} + c$.`,
    answer: $(ans),
    distractors: dis.filter((t) => t !== ans && !/NaN|\./.test(t)).map($),
    solution: [
      `Factor ${a} out of the $x^{2}$ and $x$ terms: $${tnum(a)}(x^{2} ${2 * p < 0 ? '-' : '+'} ${Math.abs(2 * p)}x) ${sc(c)}$`,
      `Complete the square inside the bracket: $x^{2} ${2 * p < 0 ? '-' : '+'} ${Math.abs(2 * p)}x = (x ${p < 0 ? '-' : '+'} ${Math.abs(p)})^{2} - ${p * p}$`,
      `Multiply back out: $${tnum(a)}(x ${p < 0 ? '-' : '+'} ${Math.abs(p)})^{2} - ${tnum(a * p * p)} ${sc(c)} = ${ans}$`,
      `Answer: $${ans}$`,
    ],
  };
}, { title: 'Complete the square when a ≠ 1' });

export const generators = [
  solveQuadMonic, solveQuadRearrange, solveQuadNonMonic, solveQuadContext,
  quadFormula, quadFormulaRearrange, quadFormulaSurd,
  ctsForm, ctsTurning, ctsSolve, ctsNonMonic,
];

void [tf];
