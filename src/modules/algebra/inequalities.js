// Inequalities: number lines, solving linear inequalities, integer solutions, quadratic inequalities.
import { pick, int, intExcept, size, chance, tnum, shuffle, gcd } from '../../core.js';
import { numberLine, inequalityMark } from '../../svg.js';
import { G as G0, P, br, tf, $, rat, tv, factored } from './lib.js';

/** Inside $…$, write < and > as \lt and \gt so no HTML parser can mistake them for tags. */
const texSafe = (s) => (typeof s === 'string' ? s.replace(/\$([^$]*)\$/g, (m, t) => `$${t.replace(/</g, '\\lt ').replace(/>/g, '\\gt ')}$`) : s);
const G = (id, skill, build, meta) => G0(id, skill, (rng, d) => {
  const q = build(rng, d);
  return { ...q, prompt: texSafe(q.prompt), answer: texSafe(q.answer), distractors: (q.distractors || []).map(texSafe), solution: (q.solution || []).map(texSafe), hint: q.hint && texSafe(q.hint) };
}, meta);

const SYM = { '<': '<', '>': '>', '<=': '\\leq', '>=': '\\geq' };
const FLIP = { '<': '>', '>': '<', '<=': '>=', '>=': '<=' };
const TOGGLE = { '<': '<=', '<=': '<', '>': '>=', '>=': '>' };
const one = (v, op, b) => `${v} ${SYM[op]} ${tv(b)}`;
const two = (a, opA, v, opB, b) => `${tv(a)} ${SYM[opA]} ${v} ${SYM[opB]} ${tv(b)}`;
const range = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
const listTex = (xs) => (xs.length ? xs.map((v) => tnum(v)).join(', \\ ') : '\\text{none}');

/** Integers satisfying lo (opLo) x (opHi) hi, where opLo/opHi are '<' or '<='. */
function intsBetween(lo, opLo, hi, opHi) {
  const a = opLo === '<' ? Math.floor(lo) + 1 : Math.ceil(lo);
  const b = opHi === '<' ? Math.ceil(hi) - 1 : Math.floor(hi);
  return range(a, b);
}

/* ================================================================== */
/* alg-inequality-number-line                                          */
/* ================================================================== */

function lineFor(lo, hi) {
  const min = Math.min(lo, hi) - 2; const max = Math.max(lo, hi) + 2;
  return numberLine({ min: Math.min(min, -1), max: Math.max(max, 1), width: 440 });
}

export const ineqReadLine = G('alg-ineq-read-line', 'alg-inequality-number-line', (rng, d) => {
  const x = 'x';
  const double = d === 'easy' ? false : d === 'hard' ? true : chance(rng, 0.5);
  if (!double) {
    const a = intExcept(rng, -5, 5, []);
    const op = pick(rng, ['<', '>', '<=', '>=']);
    const nl = numberLine({ min: Math.min(-6, a - 3), max: Math.max(6, a + 3), width: 440 });
    const right = op === '>' || op === '>=';
    const closed = op === '<=' || op === '>=';
    const mark = right
      ? inequalityMark(nl, a, Math.max(6, a + 3), { closedFrom: closed, arrowRight: true })
      : inequalityMark(nl, Math.min(-6, a - 3), a, { closedTo: closed, arrowLeft: true });
    const ans = one(x, op, a);
    return {
      prompt: 'Which inequality is shown on the number line?',
      visual: nl.svg(mark),
      answer: $(ans),
      distractors: [one(x, TOGGLE[op], a), one(x, FLIP[op], a), one(x, FLIP[TOGGLE[op]], a), one(x, op, a + 1), one(x, op, a - 1)].map($),
      count: 4,
      solution: [
        `The arrow points ${right ? 'right, so $x$ is <b>greater</b> than' : 'left, so $x$ is <b>less</b> than'} ${a}.`,
        `The circle is ${closed ? '<b>filled</b>, so ' + a + ' is included ($' + SYM[op] + '$)' : '<b>open</b>, so ' + a + ' is not included ($' + SYM[op] + '$)'}.`,
        `Answer: $${ans}$`,
      ],
    };
  }
  const lo = int(rng, -5, 2); const hi = lo + int(rng, 2, 6);
  const opL = pick(rng, ['<', '<=']); const opR = pick(rng, ['<', '<=']);
  const nl = numberLine({ min: Math.min(-6, lo - 2), max: Math.max(6, hi + 2), width: 440 });
  const mark = inequalityMark(nl, lo, hi, { closedFrom: opL === '<=', closedTo: opR === '<=' });
  const ans = two(lo, opL, x, opR, hi);
  return {
    prompt: 'Write down the inequality shown on the number line.',
    visual: nl.svg(mark),
    answer: $(ans),
    distractors: [two(lo, TOGGLE[opL], x, TOGGLE[opR], hi), two(lo, TOGGLE[opL], x, opR, hi), two(lo, opL, x, TOGGLE[opR], hi), two(lo, opL, x, opR, hi + 1), two(lo - 1, opL, x, opR, hi)].map($),
    solution: [
      `$x$ lies between ${lo} and ${hi}.`,
      `At ${lo} the circle is ${opL === '<=' ? 'filled (included, $\\leq$)' : 'open (not included, $<$)'}; at ${hi} it is ${opR === '<=' ? 'filled (included, $\\leq$)' : 'open (not included, $<$)'}.`,
      `Answer: $${ans}$`,
    ],
  };
}, { title: 'Read an inequality from a number line' });

export const ineqIntegers = G('alg-ineq-integers', 'alg-inequality-number-line', (rng, d) => {
  const x = pick(rng, ['x', 'n']);
  const lo = int(rng, size(d, 0, -5, -6), 3); const hi = lo + int(rng, 3, 6);
  const opL = pick(rng, ['<', '<=']); const opR = pick(rng, ['<', '<=']);
  const ints = intsBetween(lo, opL, hi, opR);
  const mode = d === 'hard' ? pick(rng, ['list', 'smallest', 'largest', 'count']) : pick(rng, ['list', 'list', 'smallest', 'largest']);
  const ineq = two(lo, opL, x, opR, hi);
  const allClosed = range(lo, hi); const allOpen = range(lo + 1, hi - 1);
  const why = `${opL === '<' ? `${lo} is not included (strict $<$)` : `${lo} is included ($\\leq$)`}; ${opR === '<' ? `${hi} is not included` : `${hi} is included`}.`;
  if (mode === 'list') {
    const cands = [allClosed, allOpen, range(lo + 1, hi), range(lo, hi - 1), range(lo - 1, hi)].filter((c) => c.join() !== ints.join());
    const ans = listTex(ints);
    return {
      prompt: `$${x}$ is an integer.<br>List all the values of $${x}$ that satisfy &nbsp; $${ineq}$`,
      answer: $(ans),
      distractors: cands.map((c) => $(listTex(c))),
      count: 4,
      typed: { kind: 'list', values: ints },
      solution: [why, `The integers are $${listTex(ints)}$.`, `Answer: $${ans}$`],
    };
  }
  if (mode === 'count') {
    const v = ints.length;
    return {
      prompt: `How many integers satisfy &nbsp; $${ineq}$?`,
      answer: $(tnum(v)),
      distractors: [allClosed.length, allOpen.length, hi - lo, v + 1, v - 1, v + 2].filter((w) => w !== v && w >= 0).map((w) => $(tnum(w))),
      typed: { kind: 'number', value: v },
      solution: [why, `The integers are $${listTex(ints)}$.`, `Answer: $${v}$`],
    };
  }
  const v = mode === 'smallest' ? ints[0] : ints[ints.length - 1];
  return {
    prompt: `$${x}$ is an integer and &nbsp; $${ineq}$<br>What is the ${mode} possible value of $${x}$?`,
    answer: $(tnum(v)),
    distractors: [lo, hi, lo + 1, hi - 1, lo - 1, hi + 1, v + 1, v - 1].filter((w) => w !== v).map((w) => $(tnum(w))),
    typed: { kind: 'number', value: v },
    solution: [why, `The integers that work are $${listTex(ints)}$.`, `Answer: $${tnum(v)}$`],
  };
}, { title: 'Integers satisfying an inequality' });

export const ineqWords = G('alg-ineq-words', 'alg-inequality-number-line', (rng, d) => {
  const v = pick(rng, ['x', 'n', 'p', 't']);
  const a = int(rng, -5, 12); const b = a + int(rng, 2, 8);
  const forms = size(d,
    [['is at least', '>='], ['is greater than', '>'], ['is less than', '<'], ['is at most', '<=']],
    [['is at least', '>='], ['is no more than', '<='], ['is more than', '>'], ['is smaller than', '<'], ['max', '<=']],
    [['between', null], ['max', '<='], ['min', '>='], ['is no less than', '>=']]);
  const [phrase, op] = pick(rng, forms);
  let words; let ans; let dis; let why;
  if (phrase === 'between') {
    const opL = pick(rng, ['<', '<=']); const opR = pick(rng, ['<', '<=']);
    words = `$${v}$ is ${opL === '<' ? 'greater than' : 'greater than or equal to'} ${tnum(a)} and ${opR === '<' ? 'less than' : 'less than or equal to'} ${tnum(b)}.`;
    ans = two(a, opL, v, opR, b);
    dis = [two(a, TOGGLE[opL], v, TOGGLE[opR], b), two(a, opL, v, TOGGLE[opR], b), two(b, opL, v, opR, a), two(a, TOGGLE[opL], v, opR, b)];
    why = `Write the smaller number on the left. "Greater than ${tnum(a)}" becomes $${tnum(a)} ${SYM[opL]} ${v}$ and "less than ${tnum(b)}" becomes $${v} ${SYM[opR]} ${tnum(b)}$; "or equal to" adds the line underneath ($\\leq$).`;
  } else if (phrase === 'max' || phrase === 'min') {
    words = `The ${phrase === 'max' ? 'largest' : 'smallest'} possible value of $${v}$ is ${tnum(a)}.`;
    ans = one(v, op, a);
    dis = [one(v, TOGGLE[op], a), one(v, FLIP[op], a), one(v, FLIP[TOGGLE[op]], a)];
    why = `${tnum(a)} itself is allowed, and $${v}$ cannot be ${phrase === 'max' ? 'more' : 'less'} than it, so use $${SYM[op]}$.`;
  } else {
    words = `$${v}$ ${phrase} ${tnum(a)}.`;
    ans = one(v, op, a);
    dis = [one(v, TOGGLE[op], a), one(v, FLIP[op], a), one(v, FLIP[TOGGLE[op]], a)];
    why = `"${phrase.replace('is ', '')}" means ${{ '>=': `${tnum(a)} or more`, '<=': `${tnum(a)} or less`, '>': `more than ${tnum(a)}, but not ${tnum(a)} itself`, '<': `less than ${tnum(a)}, but not ${tnum(a)} itself` }[op]}.`;
  }
  return {
    prompt: `${words}<br>Which inequality shows this?`,
    answer: $(ans),
    distractors: dis.map($),
    count: 4,
    solution: [why, `Answer: $${ans}$`],
  };
}, { title: 'Write an inequality from words' });

/* ================================================================== */
/* alg-solve-inequalities                                              */
/* ================================================================== */

export const ineqSolveLinear = G('alg-ineq-solve-linear', 'alg-solve-inequalities', (rng, d) => {
  const x = 'x';
  const op = pick(rng, ['<', '>', '<=', '>=']);
  const sol = d === 'hard' && chance(rng, 0.3) ? rat(int(rng, 1, 9) * 2 + 1, 2) : intExcept(rng, -8, 10, [0]);
  const sv = typeof sol === 'number' ? sol : sol.value();
  const form = size(d, 'ax+b', pick(rng, ['both', 'ax+b', 'bracket']), pick(rng, ['neg', 'neg', 'both', 'bracketNeg']));
  let lhs; let rhs; let steps; let finalOp = op; let wrongs;
  if (form === 'ax+b' || form === 'bracket') {
    const a = int(rng, 2, 7); const b = intExcept(rng, -12, 12, [0]);
    const c = a * sv + b;
    if (!Number.isInteger(c)) throw new Error('');
    if (form === 'bracket') {
      const k = int(rng, 2, 4); const bb = b; // k(x + bb) ? c'
      lhs = `${k}${br(1, bb, x)}`; rhs = tnum(k * (sv + bb));
      if (!Number.isInteger(k * (sv + bb))) throw new Error('');
      steps = [`Expand: $${P([k, k * bb], x)} ${SYM[op]} ${rhs}$`, `${k * bb > 0 ? 'Subtract' : 'Add'} ${Math.abs(k * bb)}: $${k}${x} ${SYM[op]} ${tnum(k * sv)}$`, `Divide by ${k}: $${one(x, op, sol)}$`];
      wrongs = [one(x, FLIP[op], sol), one(x, op, rat(k * (sv + bb) - bb, k)), one(x, op, sv + 2 * bb), one(x, TOGGLE[op], sol)];
    } else {
      lhs = P([a, b], x); rhs = tnum(c);
      steps = [`${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)} ${b > 0 ? 'from' : 'to'} both sides: $${a}${x} ${SYM[op]} ${tnum(c - b)}$`, `Divide both sides by ${a}: $${one(x, op, sol)}$`];
      wrongs = [one(x, FLIP[op], sol), one(x, op, rat(c + b, a)), one(x, op, c - b), one(x, TOGGLE[op], sol), one(x, op, rat(c, a) instanceof Object ? sv + 1 : c / a - b)];
    }
  } else if (form === 'both') {
    const a = int(rng, 3, 9); const c2 = int(rng, 1, a - 1); const b = intExcept(rng, -12, 12, [0]);
    const dd = (a - c2) * sv + b;
    if (!Number.isInteger(dd)) throw new Error('');
    lhs = P([a, b], x); rhs = P([c2, dd], x);
    steps = [`Subtract $${c2 === 1 ? '' : c2}${x}$ from both sides: $${P([a - c2, b], x)} ${SYM[op]} ${tnum(dd)}$`, `${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)}: $${P([a - c2, 0], x)} ${SYM[op]} ${tnum(dd - b)}$`, ...(a - c2 !== 1 ? [`Divide by ${a - c2}: $${one(x, op, sol)}$`] : [])];
    wrongs = [one(x, FLIP[op], sol), one(x, op, rat(dd + b, a - c2)), one(x, op, rat(dd - b, a + c2)), one(x, TOGGLE[op], sol)];
  } else {
    // c − a x  ? d   (dividing by a negative flips the sign)
    const a = int(rng, 2, 6); const c = int(rng, 3, 20);
    if (form === 'neg') {
      const dd = c - a * sv; if (!Number.isInteger(dd)) throw new Error('');
      lhs = `${c} - ${a}${x}`; rhs = tnum(dd);
      finalOp = FLIP[op];
      steps = [`Subtract ${c} from both sides: $-${a}${x} ${SYM[op]} ${tnum(dd - c)}$`, `Divide both sides by $-${a}$. <b>Dividing by a negative number reverses the inequality sign</b>: $${one(x, finalOp, sol)}$`];
      wrongs = [one(x, op, sol), one(x, finalOp, -sv), one(x, op, -sv), one(x, finalOp, rat(dd + c, a))];
    } else {
      const k = int(rng, 2, 4); const bb = intExcept(rng, -6, 6, [0]);
      // k(bb − x) ? r
      const r = k * (bb - sv); if (!Number.isInteger(r)) throw new Error('');
      lhs = `${k}(${bb} - ${x})`; rhs = tnum(r);
      finalOp = FLIP[op];
      steps = [`Expand: $${k * bb} - ${k}${x} ${SYM[op]} ${rhs}$`, `Subtract ${k * bb}: $-${k}${x} ${SYM[op]} ${tnum(r - k * bb)}$`, `Divide by $-${k}$ and <b>reverse the sign</b>: $${one(x, finalOp, sol)}$`];
      wrongs = [one(x, op, sol), one(x, finalOp, -sv), one(x, op, -sv), one(x, finalOp, rat(r - bb, -k))];
    }
  }
  const ans = one(x, finalOp, sol);
  return {
    prompt: `Solve &nbsp; $${lhs} ${SYM[op]} ${rhs}$`,
    answer: $(ans),
    distractors: wrongs.filter((t) => t !== ans).concat([one(x, finalOp, sv + 1), one(x, FLIP[finalOp], sv + 1)]).map($),
    hint: 'Solve it like an equation, but if you multiply or divide by a negative number, reverse the inequality sign.',
    solution: [...steps, `Answer: $${ans}$`],
  };
}, { title: 'Solve a linear inequality' });

export const ineqSolveDouble = G('alg-ineq-solve-double', 'alg-solve-inequalities', (rng, d) => {
  const x = 'x';
  const a = int(rng, 2, 5); const b = intExcept(rng, -9, 9, [0]);
  const lo = int(rng, -6, 2); const hi = lo + int(rng, 2, 6);
  const opL = pick(rng, ['<', '<=']); const opR = pick(rng, ['<', '<=']);
  const L = a * lo + b; const H = a * hi + b;
  const ans = two(lo, opL, x, opR, hi);
  const ints = intsBetween(lo, opL, hi, opR);
  const askInts = d === 'hard' && chance(rng, 0.5);
  const wrong = [
    two(rat(L + b, a), opL, x, opR, rat(H + b, a)),
    two(L - b, opL, x, opR, H - b),
    two(lo, opL, x, opR, rat(H, a)),
    two(lo, TOGGLE[opL], x, TOGGLE[opR], hi),
    two(rat(L, a) instanceof Object ? lo - 1 : L / a - b, opL, x, opR, hi),
    two(lo, opL, x, TOGGLE[opR], hi),
  ];
  const steps = [
    `Do the same thing to all three parts.`,
    `${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)}: $${tnum(L - b)} ${SYM[opL]} ${a}${x} ${SYM[opR]} ${tnum(H - b)}$`,
    `Divide by ${a}: $${ans}$`,
  ];
  if (askInts) {
    return {
      prompt: `$${tnum(L)} ${SYM[opL]} ${P([a, b], x)} ${SYM[opR]} ${tnum(H)}$<br>$${x}$ is an integer. Write down all the possible values of $${x}$.`,
      answer: $(listTex(ints)),
      distractors: [range(lo, hi), range(lo + 1, hi - 1), range(lo + 1, hi), range(lo, hi - 1), range(L, H).slice(0, 8)].filter((c) => c.join() !== ints.join()).map((c) => $(listTex(c))),
      count: 4,
      typed: { kind: 'list', values: ints },
      solution: [...steps, `The integers in this range are $${listTex(ints)}$.`, `Answer: $${listTex(ints)}$`],
    };
  }
  return {
    prompt: `Solve &nbsp; $${tnum(L)} ${SYM[opL]} ${P([a, b], x)} ${SYM[opR]} ${tnum(H)}$`,
    answer: $(ans),
    distractors: wrong.filter((t) => t !== ans).map($),
    solution: [...steps, `Answer: $${ans}$`],
  };
}, { title: 'Solve a double inequality' });

export const ineqIntegerSolutions = G('alg-ineq-integer-solutions', 'alg-solve-inequalities', (rng, d) => {
  const x = pick(rng, ['x', 'n']);
  const mode = pick(rng, size(d, ['range', 'smallest'], ['range', 'smallest', 'largest'], ['range', 'largestNeg', 'smallest']));
  if (mode === 'range') {
    const a = int(rng, 2, 6); const lo = int(rng, 1, 25); const hi = lo + int(rng, a + 2, 4 * a);
    const opL = pick(rng, ['<', '<=']); const opR = pick(rng, ['<', '<=']);
    const ints = intsBetween(lo / a, opL, hi / a, opR);
    if (!ints.length) throw new Error('');
    const ans = listTex(ints);
    const lower = intsBetween(lo / a, TOGGLE[opL], hi / a, TOGGLE[opR]);
    const cands = [lower, range(ints[0] - 1, ints[ints.length - 1]), range(ints[0], ints[ints.length - 1] + 1), range(ints[0] + 1, ints[ints.length - 1]), range(lo, Math.min(hi, lo + 5))].filter((c) => c.length && c.join() !== ints.join());
    return {
      prompt: `Work out all the integer values of $${x}$ for which &nbsp; $${lo} ${SYM[opL]} ${a}${x} ${SYM[opR]} ${hi}$`,
      answer: $(ans),
      distractors: cands.map((c) => $(listTex(c))),
      count: 4,
      typed: { kind: 'list', values: ints },
      solution: [
        `Divide all three parts by ${a}: $${tv(rat(lo, a))} ${SYM[opL]} ${x} ${SYM[opR]} ${tv(rat(hi, a))}$`,
        `${opL === '<=' ? 'The lower end is included' : 'The lower end is not included'}; ${opR === '<=' ? 'the upper end is included' : 'the upper end is not included'}.`,
        `Answer: $${ans}$`,
      ],
    };
  }
  const a = int(rng, 2, 7); const b = intExcept(rng, -15, 15, [0]); const c = int(rng, -10, 40);
  // a x + b > c  -> x > (c − b)/a
  const bound = (c - b) / a;
  const strict = chance(rng, 0.6);
  let ans; let prompt; let sol;
  if (mode === 'smallest') {
    ans = strict ? Math.floor(bound) + 1 : Math.ceil(bound);
    prompt = `What is the smallest integer $${x}$ for which &nbsp; $${P([a, b], x)} ${strict ? '>' : '\\geq'} ${tnum(c)}$?`;
    sol = [`Solve: $${a}${x} ${strict ? '>' : '\\geq'} ${tnum(c - b)}$, so $${x} ${strict ? '>' : '\\geq'} ${tv(rat(c - b, a))}$`, `The smallest integer ${strict ? 'greater than' : 'greater than or equal to'} $${tv(rat(c - b, a))}$ is ${tnum(ans)}.`];
  } else {
    ans = strict ? Math.ceil(bound) - 1 : Math.floor(bound);
    prompt = `What is the largest integer $${x}$ for which &nbsp; $${P([a, b], x)} ${strict ? '<' : '\\leq'} ${tnum(c)}$?`;
    sol = [`Solve: $${a}${x} ${strict ? '<' : '\\leq'} ${tnum(c - b)}$, so $${x} ${strict ? '<' : '\\leq'} ${tv(rat(c - b, a))}$`, `The largest integer ${strict ? 'less than' : 'less than or equal to'} $${tv(rat(c - b, a))}$ is ${tnum(ans)}.`];
  }
  return {
    prompt,
    answer: $(tnum(ans)),
    distractors: [ans + 1, ans - 1, Math.round((c + b) / a), c - b, Math.round(bound) === ans ? ans + 2 : Math.round(bound), -ans].filter((w) => w !== ans).map((w) => $(tnum(w))),
    typed: { kind: 'number', value: ans },
    solution: [...sol, `Answer: $${tnum(ans)}$`],
  };
}, { title: 'Integer solutions of inequalities' });

/* ================================================================== */
/* alg-quadratic-inequalities                                          */
/* ================================================================== */

export const quadIneqSolve = G('alg-quad-ineq-solve', 'alg-quadratic-inequalities', (rng, d) => {
  const x = 'x';
  let p = intExcept(rng, -8, 8, [0]); let q = intExcept(rng, -8, 8, [0, p]);
  if (p > q) [p, q] = [q, p];
  // roots p < q.  (x − p)(x − q)
  const k = d === 'hard' ? pick(rng, [1, 2]) : 1;
  let coefs = [1, -(p + q), p * q];
  let rootsTxt = `${tnum(p)}$ and $${tnum(q)}`;
  let factorTex = factored(1, [[1, -p], [1, -q]], x);
  let lo = p; let hi = q;
  if (k === 2) {
    // (2x − r)(x − q) with root r/2
    const r = pick(rng, [1, 3, 5, -1, -3, -5]);
    lo = Math.min(r / 2, q); hi = Math.max(r / 2, q);
    if (r / 2 === q) throw new Error('');
    coefs = [2, -(r + 2 * q), r * q];
    factorTex = factored(1, [[2, -r], [1, -q]], x);
    rootsTxt = `${tv(rat(r, 2))}$ and $${tnum(q)}`;
  }
  const op = pick(rng, ['<', '<=', '>', '>=']);
  const inside = op === '<' || op === '<=';
  const LO = tv(rat(lo * 2, 2)); const HI = tv(rat(hi * 2, 2));
  const opIn = op === '<' || op === '>' ? '<' : '<=';
  const outL = op === '>' || op === '<' ? '<' : '\\leq';
  const outR = op === '>' || op === '<' ? '>' : '\\geq';
  const insideAns = `${LO} ${SYM[opIn]} ${x} ${SYM[opIn]} ${HI}`;
  const outsideAns = `${x} ${outL} ${LO} \\text{ or } ${x} ${outR} ${HI}`;
  const ans = inside ? insideAns : outsideAns;
  const negLo = tv(rat(-hi * 2, 2)); const negHi = tv(rat(-lo * 2, 2));
  const dis = [
    inside ? outsideAns : insideAns,
    inside ? `${negLo} ${SYM[opIn]} ${x} ${SYM[opIn]} ${negHi}` : `${x} ${outL} ${negLo} \\text{ or } ${x} ${outR} ${negHi}`,
    inside ? `${x} ${SYM[opIn]} ${HI}` : `${x} ${outR} ${HI}`,
    inside ? `${LO} ${SYM[TOGGLE[opIn]]} ${x} ${SYM[TOGGLE[opIn]]} ${HI}` : `${x} ${outL === '<' ? '\\leq' : '<'} ${LO} \\text{ or } ${x} ${outR === '>' ? '\\geq' : '>'} ${HI}`,
    inside ? `${x} ${SYM[opIn]} ${LO} \\text{ or } ${x} ${SYM[FLIP[opIn]]} ${HI}`.replace(/ \\text/, ' \\text') : `${LO} ${outL === '<' ? '>' : '\\geq'} ${x} ${outR === '>' ? '>' : '\\geq'} ${HI}`,
  ];
  return {
    prompt: `Solve &nbsp; $${P(coefs, x)} ${SYM[op]} 0$`,
    answer: $(ans),
    distractors: dis.filter((t) => t !== ans).map($),
    hint: 'Find where the graph crosses the x-axis, then decide whether you want the part below or above the axis.',
    solution: [
      `Factorise: $${factorTex} = 0$ when $x = ${rootsTxt}$ (the critical values).`,
      `$y = ${P(coefs, x)}$ is a ∪-shaped curve, which is <b>below</b> the $x$-axis between the roots and <b>above</b> it outside them.`,
      inside ? `We want ${op === '<' ? 'negative' : 'zero or negative'} values, so $x$ is between the roots.` : `We want ${op === '>' ? 'positive' : 'zero or positive'} values, so $x$ is outside the roots (two separate regions).`,
      `Answer: $${ans}$`,
    ],
  };
}, { title: 'Solve a quadratic inequality' });

export const quadIneqSquare = G('alg-quad-ineq-square', 'alg-quadratic-inequalities', (rng, d) => {
  const x = 'x';
  const n = int(rng, 2, 12); const k = d === 'easy' ? 1 : pick(rng, [1, 2, 3]);
  const c = d === 'hard' ? intExcept(rng, -10, 10, [0]) : 0;
  const op = pick(rng, ['<', '<=', '>', '>=']);
  const inside = op === '<' || op === '<=';
  const rhs = k * n * n + c;
  const lhs = c === 0 ? `${k === 1 ? '' : k}${x}^{2}` : `${k === 1 ? '' : k}${x}^{2} ${c > 0 ? '+' : '-'} ${Math.abs(c)}`;
  const opIn = op === '<' || op === '>' ? '<' : '<=';
  const ans = inside ? `-${n} ${SYM[opIn]} ${x} ${SYM[opIn]} ${n}` : `${x} ${op === '>' ? '<' : '\\leq'} -${n} \\text{ or } ${x} ${SYM[op]} ${n}`;
  const dis = [
    `${x} ${SYM[op]} ${n}`,
    inside ? `${x} ${op === '<' ? '<' : '\\leq'} -${n} \\text{ or } ${x} ${op === '<' ? '>' : '\\geq'} ${n}` : `-${n} ${SYM[opIn]} ${x} ${SYM[opIn]} ${n}`,
    `${x} ${SYM[op]} \\pm ${n}`,
    inside ? `-${n * n} ${SYM[opIn]} ${x} ${SYM[opIn]} ${n * n}` : `${x} ${op === '>' ? '<' : '\\leq'} -${n * n} \\text{ or } ${x} ${SYM[op]} ${n * n}`,
    `${x} ${SYM[op]} ${tv(rat(rhs, 2 * k))}`,
  ];
  return {
    prompt: `Solve &nbsp; $${lhs} ${SYM[op]} ${tnum(rhs)}$`,
    answer: $(ans),
    distractors: dis.filter((t) => t !== ans).map($),
    solution: [
      ...(c !== 0 || k !== 1 ? [`Rearrange: $${x}^{2} ${SYM[op]} ${n * n}$`] : []),
      `$${x}^{2} = ${n * n}$ when $${x} = ${n}$ or $${x} = -${n}$ — don't forget the negative root.`,
      inside ? `$${x}^{2}$ is ${op === '<' ? 'less than' : 'at most'} ${n * n} when $${x}$ is between $-${n}$ and ${n}.` : `$${x}^{2}$ is ${op === '>' ? 'greater than' : 'at least'} ${n * n} when $${x}$ is beyond ${n} in either direction.`,
      `Answer: $${ans}$`,
    ],
  };
}, { title: 'Quadratic inequalities of the form x² < k' });

export const quadIneqIntegers = G('alg-quad-ineq-integers', 'alg-quadratic-inequalities', (rng, d) => {
  const x = 'x';
  let p = int(rng, -7, 3); let q = p + int(rng, 2, 7);
  if (p === 0 && q === 0) throw new Error('');
  const op = pick(rng, ['<', '<=']);
  const coefs = [1, -(p + q), p * q];
  const ints = intsBetween(p, op, q, op);
  const ask = d === 'easy' ? 'count' : pick(rng, ['count', 'list', 'sum']);
  const why = [
    `Factorise: $${factored(1, [[1, -p], [1, -q]], x)} ${SYM[op]} 0$, with critical values $${tnum(p)}$ and $${tnum(q)}$.`,
    `The curve is below the axis between the roots, so $${tnum(p)} ${SYM[op]} ${x} ${SYM[op]} ${tnum(q)}$.`,
    `Integers: $${listTex(ints)}$.`,
  ];
  if (ask === 'list') {
    const alt = op === '<' ? range(p, q) : range(p + 1, q - 1);
    return {
      prompt: `List all the integers that satisfy &nbsp; $${P(coefs, x)} ${SYM[op]} 0$`,
      answer: $(listTex(ints)),
      distractors: [alt, range(-q, -p), range(p, q - 1), range(p + 1, q)].filter((c) => c.length && c.join() !== ints.join()).map((c) => $(listTex(c))),
      count: 4,
      typed: { kind: 'list', values: ints },
      solution: [...why, `Answer: $${listTex(ints)}$`],
    };
  }
  const v = ask === 'count' ? ints.length : ints.reduce((s, t) => s + t, 0);
  const alt = op === '<' ? range(p, q) : range(p + 1, q - 1);
  return {
    prompt: ask === 'count' ? `How many integers satisfy &nbsp; $${P(coefs, x)} ${SYM[op]} 0$?` : `Work out the sum of all the integers that satisfy &nbsp; $${P(coefs, x)} ${SYM[op]} 0$`,
    answer: $(tnum(v)),
    distractors: [ask === 'count' ? alt.length : alt.reduce((s, t) => s + t, 0), ask === 'count' ? q - p : -v, v + 1, v - 1, v + 2].filter((w) => w !== v).map((w) => $(tnum(w))),
    typed: { kind: 'number', value: v },
    solution: [...why, ask === 'sum' ? `Sum: $${tnum(v)}$` : `That is ${ints.length} integers.`, `Answer: $${tnum(v)}$`],
  };
}, { title: 'Integer solutions of a quadratic inequality' });

export const generators = [
  ineqReadLine, ineqIntegers, ineqWords,
  ineqSolveLinear, ineqSolveDouble, ineqIntegerSolutions,
  quadIneqSolve, quadIneqSquare, quadIneqIntegers,
];

void [shuffle, gcd, tf, lineFor];
