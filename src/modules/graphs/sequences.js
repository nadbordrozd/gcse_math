// Sequences: term-to-term rules, nth terms, special, geometric and quadratic sequences.
import { pick, int, size, chance, shuffle, sample, num, tnum, Frac, frac, ordinal, tidy, isPrime } from '../../core.js';
import { G, lin, linAccept, T, uniq, seqTex, quadAccept, ftex, F } from './util.js';
import { patternSvg, PATTERNS } from './diagrams.js';

/** nth-term TeX that writes decreasing sequences the natural way: 98 - 8n. */
export const nthTex = (d, c, v = 'n') => (d < 0 && c > 0 ? `${tnum(c)} - ${d === -1 ? '' : tnum(-d)}${v}` : lin(d, c, v));
const nthOpt = (d, c) => `$${nthTex(d, c)}$`;
/** Value for an inequality step: exact if short, else truncated to 2 dp with an ellipsis. */
const dec2 = (x) => (Number.isInteger(tidy(x * 100)) ? tnum(tidy(x)) : `${tnum(Math.floor(x * 100) / 100)}\\ldots`);
/** "+ 3" / "- 3" for adding a signed number in TeX. */
const pm = (v) => (v < 0 ? `- ${tnum(-v)}` : `+ ${tnum(v)}`);
const diffs = (a) => a.slice(1).map((x, i) => tidy(x - a[i]));

/* ================================================================== */
/* seq-term-to-term                                                    */
/* ================================================================== */

export const tttNext = G('seq-ttt-next', 'seq-term-to-term', (rng, d) => {
  const kind = d === 'easy' ? pick(rng, ['up', 'up', 'down', 'double'])
    : d === 'medium' ? pick(rng, ['neg', 'neg', 'half', 'double', 'dec'])
      : pick(rng, ['dec', 'dec', 'neg', 'triple']);
  let terms; let step = null; let ratio = null;
  if (kind === 'up') { const a = int(rng, 1, 20); step = int(rng, 2, 9); terms = [0, 1, 2, 3].map((i) => a + i * step); }
  else if (kind === 'down') { step = -int(rng, 2, 9); const a = int(rng, 4, 8) * -step + int(rng, 0, 5); terms = [0, 1, 2, 3].map((i) => a + i * step); }
  else if (kind === 'neg') {
    step = d === 'hard' ? -int(rng, 4, 9) : -int(rng, 3, 7);
    const a = int(rng, 1, 3) * -step + int(rng, 1, Math.abs(step) - 1);
    terms = [0, 1, 2, 3].map((i) => a + i * step);
    if (chance(rng, 0.4)) { terms = terms.map((t) => -t).reverse(); step = -step; terms = terms.map((t) => t); }
  } else if (kind === 'dec') {
    const sc = pick(rng, [10, 10, 4]);
    const S = sc === 4 ? pick(rng, [1, 3, 5]) : pick(rng, [2, 3, 4, 6, 7, 8, 9, 12, 15]);
    const sgn = d === 'hard' && chance(rng, 0.4) ? -1 : 1;
    const A = int(rng, 5, 40) * (sc === 4 ? 1 : 1);
    terms = [0, 1, 2, 3].map((i) => tidy((A + sgn * i * S * (sc === 4 ? 1 : 1)) / sc));
    step = tidy((sgn * S) / sc);
  } else if (kind === 'double') { ratio = 2; const a = int(rng, 1, 9); terms = [0, 1, 2, 3].map((i) => a * 2 ** i); }
  else if (kind === 'triple') { ratio = 3; const a = int(rng, 1, 5); terms = [0, 1, 2, 3].map((i) => a * 3 ** i); }
  else { ratio = frac(1, 2); const a = pick(rng, [8, 16, 24, 40, 48, 80]) * 8; terms = [0, 1, 2, 3].map((i) => a / 2 ** i); }
  const k = d === 'easy' || ratio ? 5 : pick(rng, d === 'medium' ? [5, 6] : [6, 7, 8]);
  const term = (i) => (ratio ? tidy(terms[0] * F(ratio).value() ** (i - 1)) : tidy(terms[0] + (i - 1) * step));
  const ans = term(k);
  const last = terms[3];
  const dl = last - terms[2];
  const dist = ratio
    ? [last + dl, last * (F(ratio).value() + 1), term(k + 1), last - dl, last * F(ratio).value() ** 2, tidy(last + F(ratio).value())]
    : [term(k + 1), term(k - 1), tidy(last - step), tidy(last + step + 1), tidy(last + step - 1), tidy(ans + 2 * step), tidy(-ans)];
  const which = k === 5 ? 'the next term' : `the ${ordinal(k)} term`;
  const ruleWords = ratio ? (ratio === 2 ? 'multiply by 2' : ratio === 3 ? 'multiply by 3' : 'divide by 2')
    : step > 0 ? `add ${num(step)}` : `subtract ${num(-step)}`;
  const steps = [];
  for (let i = 5; i <= k; i += 1) steps.push(tnum(term(i)));
  return {
    prompt: `Here are the first four terms of a sequence.<br>${seqTex(terms)}<br>Work out ${which} of the sequence.`,
    answer: T(ans),
    distractors: uniq(dist.filter((x) => Number.isFinite(x) && (!ratio || x > 0)).map(T), T(ans)),
    typed: { kind: 'number', value: ans },
    solution: [
      ratio ? `Each term is the previous term ${ratio === 2 ? 'multiplied by $2$' : ratio === 3 ? 'multiplied by $3$' : 'divided by $2$'}: $${tnum(terms[0])} \\to ${tnum(terms[1])} \\to ${tnum(terms[2])}$. A constant difference does not work here.`
        : `Find the difference between terms: $${tnum(terms[1])} - ${terms[0] < 0 ? `(${tnum(terms[0])})` : tnum(terms[0])} = ${tnum(step)}$, so the rule is <b>${ruleWords}</b>.`,
      `Keep going from the 4th term $${tnum(last)}$: ${steps.map((s, i) => `${ordinal(5 + i)} term $= ${s}$`).join(', ')}.`,
      `Answer: $${tnum(ans)}$`,
    ],
  };
}, { title: 'Continue a sequence' });

// Term-to-term rules as objects for checking.
const ruleAdd = (k) => ({ text: k >= 0 ? `Add ${num(k)}` : `Subtract ${num(-k)}`, f: (x) => tidy(x + k) });
const ruleMul = (k) => ({ text: `Multiply by ${num(k)}`, f: (x) => tidy(x * k) });
const ruleDiv = (k) => ({ text: `Divide by ${num(k)}`, f: (x) => tidy(x / k) });
const ruleTwo = (m, k) => ({ text: `Multiply by ${num(m)} then ${k >= 0 ? 'add' : 'subtract'} ${num(Math.abs(k))}`, f: (x) => x * m + k });
const ruleTwoB = (k, m) => ({ text: `${k >= 0 ? 'Add' : 'Subtract'} ${num(Math.abs(k))} then multiply by ${num(m)}`, f: (x) => (x + k) * m });

export const tttRule = G('seq-ttt-rule', 'seq-term-to-term', (rng, d) => {
  const kind = d === 'easy' ? pick(rng, ['add', 'add', 'sub']) : d === 'medium' ? pick(rng, ['add', 'sub', 'mul', 'div']) : pick(rng, ['two', 'two', 'twoB', 'sub', 'mul']);
  let rule; let t; let cands;
  if (kind === 'add') {
    const k = int(rng, 2, 11); const a = int(rng, d === 'easy' ? 1 : -15, 20);
    rule = ruleAdd(k); t = [a];
    cands = [ruleAdd(-k), ruleAdd(k + 1), ruleAdd(k - 1), ruleAdd(a), ruleMul(k), ruleAdd(2 * k), ruleMul(2)];
  } else if (kind === 'sub') {
    const k = int(rng, 2, 11); const a = int(rng, d === 'easy' ? 3 * k + 1 : 5, 60);
    rule = ruleAdd(-k); t = [a];
    cands = [ruleAdd(k), ruleAdd(-k - 1), ruleAdd(-k + 1), ruleDiv(k), ruleAdd(-2 * k), ruleMul(k), ruleAdd(-(k + 2))];
  } else if (kind === 'mul') {
    const k = int(rng, 2, 5); const a = int(rng, 1, 6);
    rule = ruleMul(k); t = [a];
    cands = [ruleAdd(a * k - a), ruleMul(k + 1), ruleAdd(k), ruleDiv(k), ruleMul(2 * k), ruleTwo(k, 1), ruleAdd(a * k)];
  } else if (kind === 'div') {
    const k = pick(rng, [2, 2, 3, 4, 5, 10]); const a = int(rng, 1, 6) * k ** 3;
    rule = ruleDiv(k); t = [a];
    cands = [ruleAdd(a / k - a), ruleMul(k), ruleAdd(-k), ruleDiv(k + 1), ruleAdd(-(a - a / k) / 2), ruleDiv(2 * k)];
  } else if (kind === 'two') {
    const m = int(rng, 2, 4); const k = pick(rng, [-3, -2, -1, 1, 2, 3, 4, 5]); const a = int(rng, 2, 6);
    rule = ruleTwo(m, k); t = [a];
    cands = [ruleTwoB(k, m), ruleTwo(m, -k), ruleAdd(a * m + k - a), ruleTwo(m + 1, k - a), ruleMul(m), ruleTwo(m, k + 1), ruleTwoB(-k, m)];
  } else {
    const m = int(rng, 2, 3); const k = pick(rng, [-2, -1, 1, 2, 3]); const a = int(rng, 2, 6);
    rule = ruleTwoB(k, m); t = [a];
    cands = [ruleTwo(m, k), ruleTwoB(-k, m), ruleAdd((a + k) * m - a), ruleMul(m), ruleTwo(m, k * m + 1), ruleTwoB(k + 1, m)];
  }
  for (let i = 0; i < 4; i += 1) t.push(rule.f(t[i]));
  if (t.some((x) => !Number.isInteger(x) || Math.abs(x) > 2000)) throw new Error('retry');
  const fits = (r) => t.slice(0, 4).every((x, i) => Math.abs(r.f(x) - t[i + 1]) < 1e-9);
  const dist = cands.filter((r) => !fits(r) && r.text !== rule.text).map((r) => r.text);
  return {
    prompt: `Here is a sequence.<br>${seqTex(t)}<br>Which is the term-to-term rule for this sequence?`,
    answer: rule.text,
    distractors: uniq(dist, rule.text),
    solution: [
      'The term-to-term rule tells you how to get from <b>one term to the next</b>. Check it works for every pair of terms, not just the first.',
      ...(kind === 'two' || kind === 'twoB'
        ? [`The differences are ${diffs(t).map((x) => `$${tnum(x)}$`).join(', ')}, which are not constant, so it is not just "add".`,
          `Try "${rule.text.toLowerCase()}": ${t.slice(0, 3).map((x, i) => `$${tnum(x)} \\to ${tnum(t[i + 1])}$`).join(', ')} ✓`]
        : [`Check each step: ${t.slice(0, 4).map((x, i) => `$${tnum(x)} \\to ${tnum(t[i + 1])}$`).join(', ')} — each time we ${rule.text.toLowerCase()}.`]),
      `Answer: ${rule.text}`,
    ],
  };
}, { title: 'Identify the term-to-term rule' });

// Two-step rules for forward / backward working.
const OPS = {
  add: (v) => ({ w: `add ${v}`, f: (x) => x + v, inv: (x) => x - v, invW: `subtract ${v}` }),
  sub: (v) => ({ w: `subtract ${v}`, f: (x) => x - v, inv: (x) => x + v, invW: `add ${v}` }),
  mul: (v) => ({ w: `multiply by ${v}`, f: (x) => x * v, inv: (x) => x / v, invW: `divide by ${v}` }),
  div: (v) => ({ w: `divide by ${v}`, f: (x) => x / v, inv: (x) => x * v, invW: `multiply by ${v}` }),
};

export const tttTwoStep = G('seq-ttt-two-step', 'seq-term-to-term', (rng, d) => {
  const mode = d === 'easy' ? 'forward' : d === 'medium' ? pick(rng, ['forward', 'back1', 'back1']) : pick(rng, ['back2', 'findk', 'back2', 'forward']);
  if (mode === 'findk') {
    const sub = chance(rng, 0.5);
    if (sub) {
      const k = int(rng, 3, 12); const a = int(rng, 3 * k + 2, 60); const n = pick(rng, [4, 5]);
      const tn = a - (n - 1) * k;
      return {
        prompt: `The term-to-term rule for a sequence is <b>subtract $k$</b>.<br>The 1st term is $${tnum(a)}$.<br>The ${ordinal(n)} term is $${tnum(tn)}$.<br>Work out the value of $k$.`,
        answer: T(k),
        distractors: uniq([T((a - tn) / n), T(a - tn), T((a - tn) / (n + 1)), T(k + 1), T(k - 1), T(Math.round((a + tn) / n))].filter((s) => !/\./.test(s)), T(k)),
        typed: { kind: 'number', value: k },
        solution: [
          `From the 1st term to the ${ordinal(n)} term there are $${n - 1}$ steps (not ${n}!), and each step subtracts $k$.`,
          `So $${tnum(a)} - ${n - 1}k = ${tnum(tn)}$, which gives $${n - 1}k = ${tnum(a - tn)}$.`,
          `$k = ${tnum(a - tn)} \\div ${n - 1} = ${k}$`,
          `Answer: $k = ${k}$`,
        ],
      };
    }
    const k = int(rng, 2, 5); const a = int(rng, 2, 7);
    const t3 = a * k * k;
    return {
      prompt: `The term-to-term rule for a sequence is <b>multiply by $k$</b>, where $k$ is positive.<br>The 1st term is $${a}$ and the 3rd term is $${t3}$.<br>Work out the value of $k$.`,
      answer: T(k),
      distractors: uniq([T(t3 / a / 2), T(t3 / a), T((t3 - a) / 2), T(k + 1), T(k - 1), T(k * 2)].filter((s) => !/\./.test(s)), T(k)),
      typed: { kind: 'number', value: k },
      solution: [
        'From the 1st term to the 3rd term you multiply by $k$ twice, i.e. by $k^2$.',
        `$${a} \\times k^2 = ${t3}$, so $k^2 = ${t3} \\div ${a} = ${k * k}$.`,
        `$k = \\sqrt{${k * k}} = ${k}$`,
        `Answer: $k = ${k}$`,
      ],
    };
  }
  // Build a rule as two operations.
  const forms = [
    () => [OPS.mul(int(rng, 2, 4)), pick(rng, [OPS.add, OPS.sub])(int(rng, 1, 9))],
    () => [pick(rng, [OPS.add, OPS.sub])(int(rng, 1, 6)), OPS.mul(int(rng, 2, 5))],
    () => [OPS.add(pick(rng, [2, 4, 6, 8, 10, 20])), OPS.div(2)],
    () => [OPS.sub(int(rng, 1, 4)), OPS.mul(int(rng, 2, 5))],
  ];
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const [o1, o2] = pick(rng, forms)();
    const f = (x) => o2.f(o1.f(x));
    const ruleW = `${o1.w} then ${o2.w}`;
    if (mode === 'forward') {
      const n = d === 'easy' ? 3 : pick(rng, [3, 4]);
      const a = int(rng, 1, 12);
      const seqv = [a]; for (let i = 1; i < n; i += 1) seqv.push(f(seqv[i - 1]));
      if (seqv.some((x) => !Number.isInteger(x) || Math.abs(x) > 999) || seqv.slice(1).includes(seqv[0])) continue;
      const ans = seqv[n - 1];
      const g = (x) => o1.f(o2.f(x)); // wrong order
      const wrong = [a]; for (let i = 1; i < n; i += 1) wrong.push(g(wrong[i - 1]));
      const once = [a]; for (let i = 1; i < n; i += 1) once.push(o1.f(once[i - 1]));
      const dist = [wrong[n - 1], seqv[n - 2], f(ans), once[n - 1], ans + 1, ans - 1, n === 4 ? f(f(a)) : f(f(f(a)))];
      return {
        prompt: `The term-to-term rule for a sequence is<br><b>${ruleW}</b><br>The 1st term is $${a}$.<br>Work out the ${ordinal(n)} term.`,
        answer: T(ans),
        distractors: uniq(dist.filter(Number.isInteger).map(T), T(ans)),
        typed: { kind: 'number', value: ans },
        solution: [
          `Apply the rule in order — first ${o1.w}, then ${o2.w} — to each term to get the next.`,
          ...seqv.slice(1).map((v, i) => `${ordinal(i + 2)} term: $${o1.w.startsWith('add') ? `${tnum(seqv[i])} + ${o1.w.split(' ').pop()}` : o1.w.startsWith('sub') ? `${tnum(seqv[i])} - ${o1.w.split(' ').pop()}` : `${tnum(seqv[i])} \\times ${o1.w.split(' ').pop()}`} = ${tnum(o1.f(seqv[i]))}$, then ${o2.w}: $${tnum(v)}$`),
          `Answer: $${tnum(ans)}$`,
        ],
      };
    }
    // backwards
    const back = mode === 'back2' ? 2 : 1;
    const start = d === 'hard' && chance(rng, 0.35) ? int(rng, 2, 30) + 0.5 : int(rng, 1, 15);
    const seqv = [start]; for (let i = 0; i < back; i += 1) seqv.push(f(seqv[i]));
    if (seqv.some((x) => !Number.isInteger(x * 2) || Math.abs(x) > 999)) continue;
    if (!Number.isInteger(start) && !seqv.slice(1).every(Number.isInteger)) continue;
    if (seqv.slice(1).some((x) => !Number.isInteger(x))) continue;
    const given = seqv[back];
    const ans = start;
    const invStep = (x) => o1.inv(o2.inv(x));
    const wrongOrder = (x) => o2.inv(o1.inv(x));
    let wo = given; for (let i = 0; i < back; i += 1) wo = wrongOrder(wo);
    const fwd = f(given);
    const oneBack = invStep(given);
    const dec = !Number.isInteger(ans);
    const fmt = (x) => T(tidy(x));
    const dist = [wo, fwd, back === 2 ? oneBack : invStep(oneBack), back === 2 ? given - (given - oneBack) * 2 : null, ans + 1, ans - 1]
      .filter((x) => x !== null && Number.isFinite(x) && Number.isInteger(x * 4));
    const chain = [given]; for (let i = 0; i < back; i += 1) chain.push(invStep(chain[i]));
    return {
      prompt: `The term-to-term rule for a sequence is<br><b>${ruleW}</b><br>The ${ordinal(back + 1)} term is $${tnum(given)}$.<br>Work out the 1st term.${dec ? ' Give your answer as a decimal.' : ''}`,
      answer: fmt(ans),
      distractors: uniq(dist.map(fmt), fmt(ans)),
      typed: { kind: 'number', value: ans },
      solution: [
        `To go <b>backwards</b>, undo the operations in reverse order: first ${o2.invW}, then ${o1.invW}.`,
        ...chain.slice(1).map((v, i) => `$${tnum(chain[i])} \\to ${tnum(tidy(o2.inv(chain[i])))} \\to ${tnum(tidy(v))}$ (the ${ordinal(back - i)} term)`),
        `Check: apply "${ruleW}" to $${tnum(ans)}$ and you get back to $${tnum(given)}$${back === 2 ? ' in two steps' : ''}.`,
        `Answer: $${tnum(ans)}$`,
      ],
    };
  }
  throw new Error('retry');
}, { title: 'Two-step term-to-term rules (forwards and backwards)' });

export const tttPattern = G('seq-ttt-pattern', 'seq-term-to-term', (rng, d) => {
  const type = pick(rng, Object.keys(PATTERNS));
  const off = pick(rng, [0, 0, 1, 2]);
  const p = { ...PATTERNS[type], c: PATTERNS[type].c + PATTERNS[type].d * off };
  const count = (n) => p.d * n + p.c;
  const thing = p.unit;
  const visual = patternSvg(type, 3, off);
  if (d === 'hard' && chance(rng, 0.6)) {
    const n = int(rng, 12, 40); const N = count(n);
    const dist = [Math.round(N / p.d), (N + p.c) / p.d, N - p.c, n + 1, n - 1, Math.round(N / (p.d + p.c))];
    return {
      prompt: `Here are the first three patterns in a sequence of ${p.desc}.<br>One pattern in the sequence uses exactly $${N}$ ${thing}. Which pattern number is it?`,
      visual,
      answer: T(n),
      distractors: uniq(dist.filter(Number.isInteger).map(T), T(n)),
      typed: { kind: 'number', value: n },
      solution: [
        `Count the ${thing}: $${count(1)},\\ ${count(2)},\\ ${count(3)}$. Each pattern uses $${p.d}$ more than the one before.`,
        `So Pattern $n$ uses $${nthTex(p.d, p.c)}$ ${thing} (check: $n = 1$ gives $${count(1)}$).`,
        `Solve $${nthTex(p.d, p.c)} = ${N}$: $${p.d}n = ${N - p.c}$, so $n = ${n}$.`,
        `Answer: Pattern $${n}$`,
      ],
    };
  }
  const n = d === 'easy' ? pick(rng, [4, 5, 6]) : d === 'medium' ? pick(rng, [8, 10, 12, 15, 20]) : pick(rng, [25, 30, 40, 50, 100]);
  const ans = count(n);
  const dist = [p.d * n, (p.d + p.c) * n, count(n - 1), count(n + 1), n % 2 === 0 ? 2 * count(n / 2) : null, ans + p.c, (p.d + 1) * n + p.c];
  return {
    prompt: `Here are the first three patterns in a sequence of ${p.desc}.<br>How many ${thing} are needed for Pattern ${n}?`,
    visual,
    answer: T(ans),
    distractors: uniq(dist.filter((x) => Number.isInteger(x) && x > 0).map(T), T(ans)),
    typed: { kind: 'number', value: ans },
    solution: [
      `Count the ${thing}: $${count(1)},\\ ${count(2)},\\ ${count(3)}$. Each new pattern adds $${p.d}$ ${thing}.`,
      n <= 6 ? `Keep adding $${p.d}$: ${[4, 5, 6].filter((k) => k <= n).map((k) => `Pattern ${k}: $${count(k)}$`).join(', ')}.`
        : `Pattern $n$ uses $${p.d}n ${p.c >= 0 ? '+' : '-'} ${Math.abs(p.c)}$ ${thing}, so Pattern ${n} uses $${p.d} \\times ${n} + ${p.c} = ${ans}$.`,
      ...(n % 2 === 0 && n > 6 ? [`Don't just double Pattern ${n / 2} — that would count the extra $${p.c}$ twice.`] : []),
      `Answer: $${ans}$ ${thing}`,
    ],
  };
}, { title: 'Pattern sequences (matchsticks and tiles)' });

/* ================================================================== */
/* seq-nth-term-use                                                    */
/* ================================================================== */

function pickNth(rng, d) {
  // Returns { tex, f, kind, a, b } describing an nth-term expression.
  const kind = d === 'easy' ? 'lin' : d === 'medium' ? pick(rng, ['lin', 'dec', 'lin']) : pick(rng, ['quad', 'quad', 'dec', 'quad2']);
  if (kind === 'lin') { const a = int(rng, 2, 9); const b = pick(rng, [-7, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 8]); return { kind, a, b, tex: lin(a, b, 'n'), f: (n) => a * n + b }; }
  if (kind === 'dec') { const a = int(rng, 2, 8); const b = int(rng, 15, 60); return { kind, a, b, tex: `${b} - ${a}n`, f: (n) => b - a * n }; }
  if (kind === 'quad') { const a = pick(rng, [1, 1, 2, 3]); const b = pick(rng, [-5, -3, -2, -1, 1, 2, 4, 5, 7]); return { kind, a, b, tex: `${a === 1 ? '' : a}n^2 ${b < 0 ? '-' : '+'} ${Math.abs(b)}`, f: (n) => a * n * n + b }; }
  const b = pick(rng, [1, 2, 3, 4, -1, -2]); return { kind, a: 1, b, tex: `n^2 ${b < 0 ? '-' : '+'} ${Math.abs(b)}n`, f: (n) => n * n + b * n };
}

export const nthGenerate = G('seq-nth-generate', 'seq-nth-term-use', (rng, d) => {
  const e = pickNth(rng, d);
  if (chance(rng, 0.35)) {
    const t = [1, 2, 3].map(e.f);
    const opt = (v) => `$${v.map((x) => tnum(x)).join(',\\ ')}$`;
    const dist = [
      [0, 1, 2].map(e.f),
      [2, 3, 4].map(e.f),
      e.kind === 'lin' ? [e.a + e.b, e.a + 2 * e.b, e.a + 3 * e.b] : null,
      e.kind === 'lin' ? [e.b + e.a, e.b + 2 * e.a + 1, e.b + 3 * e.a + 2] : null,
      e.kind === 'dec' ? [1, 2, 3].map((n) => e.a * n - e.b) : null,
      e.kind === 'quad' ? [1, 2, 3].map((n) => (e.a * n) ** 2 + e.b) : null,
      e.kind === 'quad' ? [1, 2, 3].map((n) => 2 * e.a * n + e.b) : null,
      e.kind === 'quad2' ? [1, 2, 3].map((n) => 2 * n + e.b * n) : null,
      [t[0], t[0] + (t[1] - t[0]) * 2, t[0] + (t[1] - t[0]) * 4],
      [t[0], t[1], t[2] + 1],
    ].filter(Boolean).map(opt);
    return {
      prompt: `The $n$th term of a sequence is $${e.tex}$.<br>Write down the first three terms of the sequence.`,
      answer: opt(t),
      distractors: uniq(dist, opt(t)),
      typed: { kind: 'list', values: t },
      solution: [
        'Substitute $n = 1$, $n = 2$ and $n = 3$ into the expression.',
        ...[1, 2, 3].map((n) => `$n = ${n}$: $${e.tex.replace(/n/g, `(${n})`).replace(/(\d)\(/g, '$1 \\times (')} = ${tnum(e.f(n))}$`),
        `Answer: $${t.map((x) => tnum(x)).join(',\\ ')}$`,
      ],
    };
  }
  const k = d === 'easy' ? pick(rng, [5, 6, 7, 8, 9, 10, 12]) : d === 'medium' ? pick(rng, [10, 15, 20, 25, 50]) : pick(rng, [6, 8, 10, 12, 15, 20]);
  const ans = e.f(k);
  const dist = [
    e.kind === 'lin' ? e.a * k : null,
    e.kind === 'lin' ? e.a + k + e.b : null,
    e.kind === 'lin' ? Number(`${e.a}${k}`) + e.b : null,
    e.kind === 'lin' ? e.a * (k + e.b) : null,
    e.kind === 'dec' ? e.a * k - e.b : null,
    e.kind === 'dec' ? e.b - e.a - k : null,
    e.kind === 'quad' ? (e.a * k) ** 2 + e.b : null,
    e.kind === 'quad' ? e.a * 2 * k + e.b : null,
    e.kind === 'quad2' ? 2 * k + e.b * k : null,
    e.kind === 'quad2' ? k * k + e.b : null,
    e.f(k + 1), e.f(k - 1),
  ];
  const sub = e.tex.replace(/n\^2/g, `${k}^2`).replace(/(\d)n/g, `$1 \\times ${k}`).replace(/n/g, `${k}`);
  return {
    prompt: `The $n$th term of a sequence is $${e.tex}$.<br>Work out the ${ordinal(k)} term of the sequence.`,
    answer: T(ans),
    distractors: uniq(dist.filter((x) => Number.isFinite(x) && x !== null).map(T), T(ans)),
    typed: { kind: 'number', value: ans },
    solution: [
      `The ${ordinal(k)} term is when $n = ${k}$. Substitute it into the expression.`,
      `$${sub} = ${tnum(ans)}$`,
      e.kind === 'lin' ? `Remember $${e.a}n$ means $${e.a} \\times n$, not the digits "${e.a}${k}".` : e.kind === 'quad' && e.a > 1 ? `Square $n$ first, then multiply: $${e.a}n^2 = ${e.a} \\times ${k * k}$, not $(${e.a} \\times ${k})^2$.` : 'Do the powers and multiplications before adding or subtracting.',
      `Answer: $${tnum(ans)}$`,
    ],
  };
}, { title: 'Generate terms from the nth term' });

export const nthWhichTerm = G('seq-nth-which-term', 'seq-nth-term-use', (rng, d) => {
  const e = pickNth(rng, d === 'hard' ? pick(rng, ['hard', 'medium']) : d);
  const k = e.kind === 'lin' || e.kind === 'dec' ? int(rng, 8, 40) : int(rng, 6, 15);
  const N = e.f(k);
  let steps; let dist;
  if (e.kind === 'lin') {
    steps = [`Set the $n$th term equal to $${N}$: $${e.tex} = ${N}$`, `$${e.a}n = ${N - e.b}$`, `$n = ${N - e.b} \\div ${e.a} = ${k}$`];
    dist = [(N + e.b) / e.a, N - e.b, e.a * N + e.b, k + 1, k - 1, Math.round(N / e.a)];
  } else if (e.kind === 'dec') {
    steps = [`Set the $n$th term equal to $${N}$: $${e.tex} = ${tnum(N)}$`, `$${e.a}n = ${e.b} - ${N < 0 ? `(${tnum(N)})` : N} = ${e.b - N}$`, `$n = ${e.b - N} \\div ${e.a} = ${k}$`];
    dist = [(N - e.b) / e.a, (e.b + N) / e.a, Math.abs(N) / e.a, k + 1, k - 1, e.b - e.a * N];
  } else if (e.kind === 'quad') {
    steps = [`Set the $n$th term equal to $${N}$: $${e.tex} = ${N}$`, `$${e.a === 1 ? '' : e.a}n^2 = ${N - e.b}$${e.a > 1 ? `, so $n^2 = ${(N - e.b) / e.a}$` : ''}`, `$n = \\sqrt{${k * k}} = ${k}$ (n must be positive)`];
    dist = [(N - e.b) / e.a, (N - e.b) / (2 * e.a), k + 1, k - 1, Math.round(Math.sqrt(N + e.b)), Math.round(Math.sqrt(N))];
  } else {
    steps = [`Set the $n$th term equal to $${N}$: $${e.tex} = ${N}$`, `Try values near $\\sqrt{${N}} \\approx ${Math.round(Math.sqrt(N))}$: $n = ${k}$ gives $${k}^2 ${e.b < 0 ? '-' : '+'} ${Math.abs(e.b)} \\times ${k} = ${N}$ ✓`, `(or solve $n^2 ${e.b < 0 ? '-' : '+'} ${Math.abs(e.b)}n - ${N} = 0$ by factorising)`];
    dist = [Math.round(Math.sqrt(N)), k + 1, k - 1, Math.round(N / (1 + e.b)), N - e.b];
  }
  return {
    prompt: `The $n$th term of a sequence is $${e.tex}$.<br>Which term of the sequence is equal to $${tnum(N)}$?`,
    answer: T(k),
    distractors: uniq(dist.filter((x) => Number.isInteger(x) && x > 0 && x !== k).map(T), T(k)),
    typed: { kind: 'number', value: k },
    hint: 'Form an equation: nth term = the value, and solve for n.',
    solution: [...steps, `Answer: the ${ordinal(k)} term, so $n = ${k}$`],
  };
}, { title: 'Which term has a given value' });

export const nthIsTerm = G('seq-nth-is-term', 'seq-nth-term-use', (rng, d) => {
  const a = d === 'easy' ? int(rng, 3, 6) : int(rng, 3, 9);
  const b = pick(rng, [-4, -3, -2, -1, 1, 2, 3, 5]);
  const tex = lin(a, b, 'n');
  const inSeq = (x) => (x - b) % a === 0 && (x - b) / a >= 1;
  const scale = size(d, [10, 30], [30, 120], [100, 400]);
  const not = chance(rng, d === 'easy' ? 0.2 : 0.45);
  const members = []; const non = [];
  for (let tries = 0; tries < 200 && (members.length < 6 || non.length < 8); tries += 1) {
    const x = int(rng, scale[0], scale[1]);
    if (inSeq(x)) { if (!members.includes(x)) members.push(x); } else if (!non.includes(x)) non.push(x);
  }
  // Prefer "tempting" non-members: multiples of a, a·k − b, numbers ending like a member.
  const k0 = int(rng, Math.ceil(scale[0] / a) + 1, Math.floor(scale[1] / a) - 1);
  const tempting = [a * k0, a * k0 - b, a * k0 + b + 1, a * k0 + b - 1].filter((x) => !inSeq(x) && x > 0);
  let answer; let others;
  if (!not) {
    answer = a * k0 + b;
    others = shuffle(rng, uniq([...tempting, ...non].map(String))).slice(0, 6).map(Number);
  } else {
    answer = pick(rng, tempting.length ? tempting : non);
    others = shuffle(rng, members.filter((m) => m !== answer)).slice(0, 4);
  }
  const k = (answer - b) / a;
  return {
    prompt: `The $n$th term of a sequence is $${tex}$.<br>Which of these numbers is ${not ? '<b>not</b> ' : ''}a term of the sequence?`,
    answer: T(answer),
    distractors: others.map(T),
    solution: [
      `A number $x$ is in the sequence if $${tex} = x$ gives a <b>whole-number</b> value of $n$.`,
      `Equivalently, $x ${b < 0 ? '+' : '-'} ${Math.abs(b)}$ must be a multiple of $${a}$.`,
      not ? `$${answer} ${b < 0 ? '+' : '-'} ${Math.abs(b)} = ${answer - b}$, and $${answer - b} \\div ${a}$ is not a whole number, so $${answer}$ is not in the sequence. The other numbers all work.`
        : `$${answer} ${b < 0 ? '+' : '-'} ${Math.abs(b)} = ${answer - b} = ${a} \\times ${k}$, so $${answer}$ is the ${ordinal(k)} term. None of the others give a whole number.`,
      `Answer: $${answer}$`,
    ],
  };
}, { title: 'Decide whether a number is in a sequence' });

export const nthInequality = G('seq-nth-inequality', 'seq-nth-term-use', (rng, d) => {
  const mode = d === 'easy' ? pick(rng, ['negative', 'over']) : d === 'medium' ? pick(rng, ['negative', 'overN', 'over']) : pick(rng, ['twodigit', 'overN', 'negative']);
  if (mode === 'negative') {
    const a = int(rng, 3, 9); let b = int(rng, 15, 90);
    if (chance(rng, 0.4)) b = a * int(rng, 4, 12); // tempting zero term
    const n = Math.floor(b / a) + 1;
    return {
      prompt: `The $n$th term of a sequence is $${b} - ${a}n$.<br>What is the smallest value of $n$ that gives a negative term?`,
      answer: T(n),
      distractors: uniq([n - 1, n + 1, Math.round(b / a), b - a, Math.ceil(b / a)].filter((x) => x > 0).map(T), T(n)),
      typed: { kind: 'number', value: n },
      solution: [
        `We need $${b} - ${a}n \\lt 0$, i.e. $${a}n \\gt ${b}$, so $n \\gt ${b} \\div ${a} = ${dec2(b / a)}$.`,
        b % a === 0 ? `When $n = ${b / a}$ the term is exactly $0$ — zero is not negative.` : `Check: $n = ${n - 1}$ gives $${b - a * (n - 1)}$ (still positive).`,
        `$n = ${n}$ gives $${b} - ${a * n} = ${b - a * n}$, which is negative.`,
        `Answer: $n = ${n}$`,
      ],
    };
  }
  const a = int(rng, 3, 12); const b = pick(rng, [-7, -5, -3, -1, 1, 2, 4, 6, 9]);
  if (mode === 'twodigit') {
    const first = Math.max(1, Math.ceil((10 - b) / a)); const last = Math.floor((99 - b) / a);
    const count = last - first + 1;
    if (count < 3) throw new Error('retry');
    return {
      prompt: `The $n$th term of a sequence is $${lin(a, b, 'n')}$.<br>How many terms of the sequence are two-digit numbers?`,
      answer: T(count),
      distractors: uniq([count + 1, count - 1, last, Math.floor(90 / a), count + 2].map(T), T(count)),
      typed: { kind: 'number', value: count },
      solution: [
        `List from the start: the terms are $${[1, 2, 3, 4].map((n) => a * n + b).join(',\\ ')},\\ \\dots$`,
        `The first two-digit term is when $n = ${first}$ (value $${a * first + b}$).`,
        `The last two-digit term is when $n = ${last}$ (value $${a * last + b}$); $n = ${last + 1}$ gives $${a * (last + 1) + b}$.`,
        `Number of terms from $n = ${first}$ to $n = ${last}$ is $${last} - ${first} + 1 = ${count}$.`,
        `Answer: $${count}$`,
      ],
    };
  }
  const L = pick(rng, d === 'easy' ? [50, 60, 80, 100] : [100, 150, 200, 250, 300, 500]);
  const n = Math.floor((L - b) / a) + 1;
  const val = a * n + b;
  if (mode === 'overN') {
    return {
      prompt: `The $n$th term of a sequence is $${lin(a, b, 'n')}$.<br>Which term is the first one greater than $${L}$? Give the value of $n$.`,
      answer: T(n),
      distractors: uniq([n - 1, n + 1, val, Math.round(L / a), Math.floor((L + b) / a) + 1].map(T), T(n)),
      typed: { kind: 'number', value: n },
      solution: [
        `Solve $${lin(a, b, 'n')} \\gt ${L}$: $${a}n \\gt ${L - b}$, so $n \\gt ${dec2((L - b) / a)}$`,
        `Check: $n = ${n - 1}$ gives $${a * (n - 1) + b}$; $n = ${n}$ gives $${val}$.`,
        `Answer: $n = ${n}$`,
      ],
    };
  }
  return {
    prompt: `The $n$th term of a sequence is $${lin(a, b, 'n')}$.<br>What is the first term of the sequence that is greater than $${L}$?`,
    answer: T(val),
    distractors: uniq([val - a, val + a, n, L + a, L + 1 === val ? null : L + 1].filter((x) => x !== null).map(T), T(val)),
    typed: { kind: 'number', value: val },
    solution: [
      `Solve $${lin(a, b, 'n')} \\gt ${L}$: $n \\gt ${dec2((L - b) / a)}$, so the first such term is when $n = ${n}$.`,
      `$${a} \\times ${n} ${b < 0 ? '-' : '+'} ${Math.abs(b)} = ${val}$ (the term before is $${val - a}$, which is not greater than $${L}$).`,
      `Answer: $${val}$`,
    ],
  };
}, { title: 'Terms satisfying a condition (first negative, first over …)' });

/* ================================================================== */
/* seq-linear-nth-term                                                 */
/* ================================================================== */

function nthDistractors(d, c, a) {
  return [nthOpt(1, d), nthOpt(d, a), nthOpt(d, -c), nthOpt(a, d), nthOpt(d, c + d), nthOpt(-d, c), nthOpt(d, c - d), `$${lin(a, d, 'n')}$`, nthOpt(c, d), nthOpt(d + 1, c - 1)];
}

export const linFind = G('seq-lin-find', 'seq-linear-nth-term', (rng, d) => {
  let dd; let c;
  if (d === 'easy') { dd = int(rng, 2, 9); c = int(rng, 1, 9); }
  else if (d === 'medium') { dd = int(rng, 2, 11); c = pick(rng, [-6, -5, -4, -3, -2, -1, 0, 2, 3, 5, 7, 10, 12]); if (chance(rng, 0.3)) { dd = -int(rng, 2, 6); c = int(rng, 20, 50); } }
  else { if (chance(rng, 0.6)) { dd = -int(rng, 3, 12); c = int(rng, 10, 110); } else { dd = int(rng, 4, 15); c = -int(rng, 8, 40); } }
  if (c === dd || c === -dd) throw new Error('retry');
  const t = [1, 2, 3, 4].map((n) => dd * n + c);
  const ans = nthOpt(dd, c);
  return {
    prompt: `A linear sequence starts<br>${seqTex(t)}<br>Work out an expression for the $n$th term of the sequence.`,
    answer: ans,
    distractors: uniq(nthDistractors(dd, c, t[0]), ans),
    typed: { kind: 'text', accept: linAccept(dd, c, 'n') },
    solution: [
      `The terms go ${dd > 0 ? 'up' : 'down'} by $${Math.abs(dd)}$ each time, so the $n$th term starts with $${dd}n$ (the ${dd > 0 ? '' : 'negative '}${Math.abs(dd)} times table).`,
      `Compare with $${dd}n$: when $n = 1$, $${dd}n = ${dd}$ but the first term is $${t[0]}$. The adjustment is $${t[0]} - ${dd < 0 ? `(${dd})` : dd} = ${c}$.`,
      `So the $n$th term is $${nthTex(dd, c)}$. Check: $n = 2$ gives $${dd * 2 + c}$ ✓`,
      `Answer: $${nthTex(dd, c)}$`,
    ],
  };
}, { title: 'Find the nth term of a linear sequence' });

export const linPattern = G('seq-lin-pattern', 'seq-linear-nth-term', (rng, d) => {
  const type = pick(rng, d === 'easy' ? ['squares', 'triangles', 'L', 'T', 'houses'] : Object.keys(PATTERNS));
  const off = d === 'easy' ? 0 : pick(rng, [0, 1, 2, 3]);
  const p = { ...PATTERNS[type], c: PATTERNS[type].c + PATTERNS[type].d * off };
  const count = (n) => p.d * n + p.c;
  const ans = nthOpt(p.d, p.c);
  const dist = [nthOpt(p.d + p.c, 0), nthOpt(1, p.d), nthOpt(p.d, 0), nthOpt(p.d, -p.c), nthOpt(p.c, p.d), nthOpt(p.d, p.c + p.d), nthOpt(p.d + 1, p.c - 1), nthOpt(p.d, p.c + 1)];
  return {
    prompt: `Here are the first three patterns in a sequence of ${p.desc}.<br>Which expression gives the number of ${p.unit} in Pattern $n$?`,
    visual: patternSvg(type, 3, off),
    answer: ans,
    distractors: uniq(dist, ans),
    typed: { kind: 'text', accept: linAccept(p.d, p.c, 'n') },
    solution: [
      `Count the ${p.unit}: $${count(1)},\\ ${count(2)},\\ ${count(3)}$ — they go up by $${p.d}$ each time, so the expression starts $${p.d}n$.`,
      `When $n = 1$, $${p.d}n = ${p.d}$, but Pattern 1 has $${count(1)}$, so add $${p.c}$.`,
      `Check Pattern 3: $${p.d} \\times 3 + ${p.c} = ${count(3)}$ ✓`,
      `Answer: $${nthTex(p.d, p.c)}$`,
    ],
  };
}, { title: 'nth term of a pattern sequence' });

export const linTermFromSeq = G('seq-lin-term', 'seq-linear-nth-term', (rng, d) => {
  let dd = int(rng, 2, 9); let c = int(rng, -6, 12);
  if (d !== 'easy' && chance(rng, 0.35)) { dd = -int(rng, 2, 7); c = int(rng, 30, 80); }
  if (c === 0) c = 3;
  const k = d === 'easy' ? pick(rng, [10, 12, 15, 20]) : d === 'medium' ? pick(rng, [20, 30, 40, 50]) : pick(rng, [50, 80, 100, 150, 200]);
  const t = [1, 2, 3, 4].map((n) => dd * n + c);
  const ans = dd * k + c;
  const dist = [dd * k, t[0] + dd * k, t[0] * k, ans + dd, k * (dd + c), ans - dd, d === 'easy' ? ans + 1 : null];
  return {
    prompt: `Here are the first four terms of a linear sequence.<br>${seqTex(t)}<br>Work out the ${ordinal(k)} term.`,
    answer: T(ans),
    distractors: uniq(dist.filter((x) => x !== null).map(T), T(ans)),
    typed: { kind: 'number', value: ans },
    solution: [
      `Find the $n$th term first. The difference is $${dd}$, so it is $${dd}n + \\text{something}$.`,
      `$n = 1$: $${dd} + (${c}) = ${t[0]}$ ✓, so the $n$th term is $${nthTex(dd, c)}$.`,
      `Substitute $n = ${k}$: $${dd} \\times ${k} ${c < 0 ? '-' : '+'} ${Math.abs(c)} = ${ans}$`,
      `Answer: $${tnum(ans)}$`,
    ],
  };
}, { title: 'Find a far term of a linear sequence' });

export const linTwoTerms = G('seq-lin-two-terms', 'seq-linear-nth-term', (rng, d) => {
  const mode = d === 'easy' ? 'two' : d === 'medium' ? pick(rng, ['two', 'sum']) : pick(rng, ['two', 'sum', 'ab', 'ab']);
  if (mode === 'two') {
    const dd = pick(rng, [2, 3, 4, 5, 6, 7, -2, -3, -4]); const c = int(rng, -10, 15);
    const p = int(rng, 2, 5); const q = p + int(rng, 2, d === 'easy' ? 3 : 6);
    const tp = dd * p + c; const tq = dd * q + c;
    const ans = nthOpt(dd, c);
    const dist = [nthOpt(tq - tp, tp - (tq - tp) * p), nthOpt(dd, tp), nthOpt(dd, tp - dd), nthOpt(dd, -c), nthOpt(-dd, c + 2 * dd * p), nthOpt(dd, c + dd)];
    return {
      prompt: `The ${ordinal(p)} term of a linear sequence is $${tp}$.<br>The ${ordinal(q)} term is $${tq}$.<br>Work out an expression for the $n$th term.`,
      answer: ans,
      distractors: uniq(dist, ans),
      typed: { kind: 'text', accept: linAccept(dd, c, 'n') },
      solution: [
        `From the ${ordinal(p)} to the ${ordinal(q)} term is $${q - p}$ steps, and the terms change by $${tq} - ${tp < 0 ? `(${tp})` : tp} = ${tq - tp}$.`,
        `Common difference $= ${tq - tp} \\div ${q - p} = ${dd}$, so the $n$th term is $${dd}n + c$.`,
        `Use the ${ordinal(p)} term: $${dd} \\times ${p} + c = ${tp}$, so $c = ${tp} - ${dd * p < 0 ? `(${dd * p})` : dd * p} = ${c}$.`,
        `Answer: $${nthTex(dd, c)}$`,
      ],
    };
  }
  if (mode === 'sum') {
    const a1 = int(rng, 1, 4); const b1 = int(rng, -3, 5);
    const a2 = int(rng, 2, 6); const b2 = int(rng, -4, 6);
    if (b2 === 0) throw new Error('retry');
    const s = [1, 2, 3, 4].map((n) => (a1 + a2) * n + b1 + b2);
    const ans = nthOpt(a2, b2);
    const dist = [nthOpt(a1 + a2, b1 + b2), nthOpt(a2 + 2 * a1, b2 + 2 * b1), nthOpt(a2, b2 - 2 * b1), nthOpt(a2, b1 + b2), nthOpt(a1 + a2, b2), nthOpt(a2 - a1, b2), nthOpt(a2, -b2)];
    return {
      prompt: `The $n$th terms of two linear sequences, A and B, are added to give the $n$th term of a new sequence.<br>The new sequence starts ${seqTex(s)}<br>The $n$th term of sequence A is $${lin(a1, b1, 'n')}$.<br>Work out the $n$th term of sequence B.`,
      answer: ans,
      distractors: uniq(dist, ans),
      typed: { kind: 'text', accept: linAccept(a2, b2, 'n') },
      solution: [
        `The new sequence goes up by $${a1 + a2}$, and its first term is $${s[0]}$, so its $n$th term is $${nthTex(a1 + a2, b1 + b2)}$.`,
        `B = new − A: $(${nthTex(a1 + a2, b1 + b2)}) - (${lin(a1, b1, 'n')})$`,
        `$= ${a1 + a2 - a1}n ${b1 + b2 - b1 < 0 ? '-' : '+'} ${Math.abs(b2)}$`,
        `Answer: $${nthTex(a2, b2)}$`,
      ],
    };
  }
  // a + pb style
  const b = pick(rng, [2, 3, 4, 5, -2, -3]); const a = int(rng, -12, 12);
  const m1 = pick(rng, [1, 2, 3]); const step = pick(rng, [2, 3, 4]);
  const coef = (n) => m1 + (n - 1) * step;
  const p = pick(rng, [1, 2]); const q = pick(rng, [4, 5]);
  const tp = a + coef(p) * b; const tq = a + coef(q) * b;
  const fmt = (A, B) => `$a = ${A},\\ b = ${B}$`;
  const ans = fmt(a, b);
  const bWrong = (tq - tp) / (q - p);
  const dist = [fmt(b, a), fmt(-a, b), fmt(a, -b), Number.isInteger(bWrong) ? fmt(tp - coef(p) * bWrong, bWrong) : null, fmt(a + b, b), fmt(tp, (tq - tp) / (coef(q) - coef(p)) + 1)];
  const termTex = (n) => `a ${coef(n) === 1 ? '+ b' : `+ ${coef(n)}b`}`;
  return {
    prompt: `A linear sequence starts<br>${seqTex([1, 2, 3].map(termTex))}<br>The ${ordinal(p)} term has value $${tp}$.<br>The ${ordinal(q)} term has value $${tq}$.<br>Work out the values of $a$ and $b$.`,
    answer: ans,
    distractors: uniq(dist.filter(Boolean), ans),
    solution: [
      `The coefficient of $b$ goes up by $${step}$ each time, so the ${ordinal(q)} term is $${termTex(q)}$.`,
      `Form equations: $${termTex(p)} = ${tp}$ and $${termTex(q)} = ${tq}$.`,
      `Subtract: $${coef(q) - coef(p)}b = ${tq - tp}$, so $b = ${b}$.`,
      `Substitute: $a = ${tp} - ${coef(p)} \\times ${b < 0 ? `(${b})` : b} = ${a}$.`,
      `Answer: ${ans}`,
    ],
  };
}, { title: 'nth term from two terms / combined sequences' });

/* ================================================================== */
/* seq-special                                                         */
/* ================================================================== */

const tri = (n) => (n * (n + 1)) / 2;
const SPECIAL = {
  square: { name: 'Square numbers', make: (rng, d) => { const s = d === 'easy' ? 1 : int(rng, 2, 7); return [0, 1, 2, 3, 4].map((i) => (s + i) ** 2); } },
  cube: { name: 'Cube numbers', make: (rng, d) => { const s = d === 'hard' ? int(rng, 2, 4) : 1; return [0, 1, 2, 3, 4].map((i) => (s + i) ** 3); } },
  triangular: { name: 'Triangular numbers', make: (rng, d) => { const s = d === 'easy' ? 1 : int(rng, 2, 6); return [0, 1, 2, 3, 4].map((i) => tri(s + i)); } },
  fib: { name: 'Fibonacci-type sequence', make: (rng) => { const t = [int(rng, 1, 7), int(rng, 2, 9)]; while (t.length < 6) t.push(t[t.length - 1] + t[t.length - 2]); return t.slice(0, 6); } },
  arith: { name: 'Arithmetic (linear) sequence', make: (rng) => { const a = int(rng, 1, 12); const dd = int(rng, 3, 9); return [0, 1, 2, 3, 4].map((i) => a + i * dd); } },
  geo: { name: 'Geometric progression', make: (rng) => { const a = int(rng, 1, 5); const r = int(rng, 2, 4); return [0, 1, 2, 3, 4].map((i) => a * r ** i); } },
};
const isSquare = (n) => n >= 0 && Number.isInteger(Math.sqrt(n));
const isCube = (n) => Number.isInteger(Math.round(Math.cbrt(n))) && Math.round(Math.cbrt(n)) ** 3 === n;
const isTri = (n) => isSquare(8 * n + 1);
function classify(t) {
  const out = new Set();
  if (t.every(isSquare) && diffs(diffs(t)).every((x) => x === 2)) out.add('square');
  if (t.every(isCube) && diffs(t.map((x) => Math.round(Math.cbrt(x)))).every((x) => x === 1)) out.add('cube');
  if (t.every(isTri) && diffs(diffs(t)).every((x) => x === 1)) out.add('triangular');
  if (t.slice(2).every((x, i) => x === t[i] + t[i + 1])) out.add('fib');
  if (new Set(diffs(t)).size === 1) out.add('arith');
  if (t.slice(1).every((x, i) => x * t[0] === t[1] * t[i])) out.add('geo');
  return out;
}

export const specialName = G('seq-special-name', 'seq-special', (rng, d) => {
  const keys = Object.keys(SPECIAL);
  if (chance(rng, 0.5)) {
    const key = pick(rng, keys);
    const t = SPECIAL[key].make(rng, d);
    const cls = classify(t);
    if (cls.size !== 1) throw new Error('retry');
    const others = shuffle(rng, keys.filter((k) => k !== key)).slice(0, 4).map((k) => SPECIAL[k].name);
    return {
      prompt: `What type of sequence is this?<br>${seqTex(t.slice(0, 5))}`,
      answer: SPECIAL[key].name,
      distractors: others,
      solution: specialExplain(key, t),
    };
  }
  const key = pick(rng, ['square', 'cube', 'triangular', 'fib', 'geo']);
  const t = SPECIAL[key].make(rng, d).slice(0, 5);
  const opt = (v) => `$${v.map((x) => tnum(x)).join(',\\ ')},\\ \\dots$`;
  const decoys = shuffle(rng, keys.filter((k) => k !== key)).slice(0, 3).map((k) => SPECIAL[k].make(rng, d).slice(0, 5));
  // A near-miss of the same type: one term wrong.
  const near = [...t]; near[3] += pick(rng, [1, -1, 2]);
  const all = [...decoys, near].filter((s) => !classify(s).has(key));
  const what = { square: 'square numbers', cube: 'cube numbers', triangular: 'triangular numbers', fib: 'a Fibonacci-type sequence (each term is the sum of the two before)', geo: 'a geometric progression' }[key];
  return {
    prompt: `Which of these is ${key === 'fib' || key === 'geo' ? what : `a sequence of ${what}`}?`,
    answer: opt(t),
    distractors: uniq(all.map(opt), opt(t)),
    count: 4,
    solution: specialExplain(key, t),
  };
}, { title: 'Recognise special sequences' });

function specialExplain(key, t) {
  const map = {
    square: [`Square numbers are $1^2, 2^2, 3^2, \\dots$`, `Here: ${t.slice(0, 4).map((x) => `$${tnum(x)} = ${Math.round(Math.sqrt(x))}^2$`).join(', ')}.`],
    cube: [`Cube numbers are $1^3, 2^3, 3^3, \\dots$`, `Here: ${t.slice(0, 4).map((x) => `$${tnum(x)} = ${Math.round(Math.cbrt(x))}^3$`).join(', ')}.`],
    triangular: ['Triangular numbers are $1, 3, 6, 10, 15, \\dots$ — the differences go up by one each time ($+2, +3, +4, \\dots$).', `Here the differences are ${diffs(t).map((x) => `$${x}$`).join(', ')}.`],
    fib: ['In a Fibonacci-type sequence each term is the sum of the two terms before it.', `Here: $${t[0]} + ${t[1]} = ${t[2]}$, $${t[1]} + ${t[2]} = ${t[3]}$, $${t[2]} + ${t[3]} = ${t[4]}$.`],
    arith: ['An arithmetic (linear) sequence has a constant difference.', `Here every difference is $${t[1] - t[0]}$.`],
    geo: ['A geometric progression multiplies by the same number (the common ratio) each time.', `Here each term is $${t[1] / t[0]}$ times the one before.`],
  };
  return [...map[key], `Answer: ${SPECIAL[key].name}`];
}

export const specialNext = G('seq-special-next', 'seq-special', (rng, d) => {
  const key = d === 'hard' ? pick(rng, ['bigtri', 'triangular', 'fib', 'cube', 'square']) : pick(rng, ['square', 'triangular', 'fib', 'cube', 'triangular']);
  if (key === 'bigtri') {
    const n = int(rng, 30, 60); const a = tri(n); const b = tri(n + 1); const ans = tri(n + 2);
    return {
      prompt: `The ${ordinal(n)} triangular number is $${tnum(a)}$.<br>The ${ordinal(n + 1)} triangular number is $${tnum(b)}$.<br>Work out the ${ordinal(n + 2)} triangular number.`,
      answer: T(ans),
      distractors: uniq([b + (b - a), b + n, b + n + 3, a + b, b + n + 1 + 1, 2 * b - a + 2].map(T), T(ans)),
      typed: { kind: 'number', value: ans },
      solution: [
        `To get the $k$th triangular number you add $k$ to the one before.`,
        `Check: $${tnum(b)} - ${tnum(a)} = ${n + 1}$ — the ${ordinal(n + 1)} triangular number added $${n + 1}$.`,
        `So the ${ordinal(n + 2)} adds $${n + 2}$: $${tnum(b)} + ${n + 2} = ${tnum(ans)}$`,
        `Answer: $${tnum(ans)}$`,
      ],
    };
  }
  const t = SPECIAL[key].make(rng, d);
  const shown = key === 'fib' ? t.slice(0, 5) : t.slice(0, 4);
  const ans = key === 'fib' ? t[5] : t[4];
  const last = shown[shown.length - 1]; const ld = last - shown[shown.length - 2];
  const dist = [last + ld, last + ld + 1, last + ld + 3, key === 'fib' ? last * 2 : ans + 1, key === 'square' ? (Math.sqrt(last) + 2) ** 2 : null, key === 'cube' ? last + (last - shown[shown.length - 2]) * 2 : null, ans - 1];
  return {
    prompt: `Here is a sequence.<br>${seqTex(shown)}<br>What is the next term?`,
    answer: T(ans),
    distractors: uniq(dist.filter((x) => x !== null && x > 0).map(T), T(ans)),
    typed: { kind: 'number', value: ans },
    solution: [
      ...specialExplain(key, t).slice(0, 2),
      key === 'square' ? `Next: $${Math.round(Math.sqrt(ans))}^2 = ${ans}$` : key === 'cube' ? `Next: $${Math.round(Math.cbrt(ans))}^3 = ${ans}$`
        : key === 'triangular' ? `The next difference is $${ld + 1}$: $${last} + ${ld + 1} = ${ans}$` : `Next: $${shown[3]} + ${shown[4]} = ${ans}$`,
      `Answer: $${tnum(ans)}$`,
    ],
  };
}, { title: 'Next term of a special sequence' });

export const specialFibMissing = G('seq-special-fib-missing', 'seq-special', (rng, d) => {
  const mode = d === 'easy' ? 'forward' : d === 'medium' ? pick(rng, ['pqr', 'pqr', 'forward']) : pick(rng, ['x', 'x', 'half', 'pqr']);
  const rule = 'After the first two terms, each term is the sum of the previous two terms.';
  if (mode === 'forward') {
    const a = int(rng, 1, 9); const b = int(rng, 1, 12); const t = [a, b]; while (t.length < 7) t.push(t[t.length - 1] + t[t.length - 2]);
    const k = pick(rng, [5, 6]); const ans = t[k - 1];
    return {
      prompt: `Here is a rule for a sequence.<br><b>${rule}</b><br>The first two terms are $${a}$ and $${b}$.<br>Work out the ${ordinal(k)} term.`,
      answer: T(ans),
      distractors: uniq([t[k - 2], t[k], a + (k - 1) * (b - a), t[k - 2] * 2, ans + 1, b * (k - 1)].map(T), T(ans)),
      typed: { kind: 'number', value: ans },
      solution: [`Add the previous two terms each time.`, `$${t.slice(0, k).join(',\\ ')}$`, `Answer: $${ans}$`],
    };
  }
  if (mode === 'pqr') {
    const p = int(rng, 3, 20); const q0 = int(rng, 5, 30); const t = [p, q0]; while (t.length < 5) t.push(t[t.length - 1] + t[t.length - 2]);
    // shown: p ? t2 ? t4 ? -> letters at positions 1, 3, 5
    const [A, B, C, D, E] = t;
    const which = pick(rng, ['p', 'q', 'r']);
    const ans = which === 'p' ? A : which === 'q' ? C : E;
    const dist = which === 'q' ? [D + B, (B + D) / 2, D - A, C + 1, D - 2 * B] : which === 'p' ? [B - A, C, D - B - B, A + 1, C + B] : [D + B, D + C + 1, D * 2, D + B + C, E - 1];
    return {
      prompt: `Here is a rule for a sequence.<br><b>${rule}</b><br>The first five terms are ${seqTex(['p', B, 'q', D, 'r'], { dots: false })}<br>Work out the value of $${which}$.`,
      answer: T(ans),
      distractors: uniq(dist.filter((x) => Number.isInteger(x) && x > 0).map(T), T(ans)),
      typed: { kind: 'number', value: ans },
      solution: [
        `Since $${B} + q = ${D}$, $q = ${D} - ${B} = ${C}$.`,
        `Since $p + ${B} = q$, $p = ${C} - ${B} = ${A}$.`,
        `And $r = q + ${D} = ${C} + ${D} = ${E}$.`,
        `Answer: $${which} = ${ans}$`,
      ],
    };
  }
  if (mode === 'half') {
    const a = int(rng, 2, 20); const x = a + 2 * int(rng, 1, 10) + 1; const t3 = (a + x) / 2;
    const dist = [2 * t3 + a, t3 - a, 2 * t3, t3 * 2 - a + 1, (t3 + a) / 2];
    return {
      prompt: `Here is a rule for a sequence.<br><b>After the first two terms, each term is half the sum of the previous two terms.</b><br>The 1st term is $${a}$ and the 3rd term is $${tnum(t3)}$.<br>Work out the 2nd term.`,
      answer: T(x),
      distractors: uniq(dist.filter((v) => Number.isFinite(v)).map((v) => T(tidy(v))), T(x)),
      typed: { kind: 'number', value: x },
      solution: [
        `The 3rd term is half of (1st + 2nd): $\\frac{${a} + x}{2} = ${tnum(t3)}$.`,
        `Multiply by 2: $${a} + x = ${tnum(2 * t3)}$.`,
        `So $x = ${tnum(2 * t3)} - ${a} = ${x}$.`,
        `Answer: $${x}$`,
      ],
    };
  }
  const a = int(rng, 10, 40); const x = int(rng, 5, 30); const t4 = a + 2 * x;
  return {
    prompt: `Here is a rule for a sequence.<br><b>${rule}</b><br>The 1st term is $${a}$, the 2nd term is $x$ and the 4th term is $${t4}$.<br>Work out the value of $x$.`,
    answer: T(x),
    distractors: uniq([t4 - a, (t4 - a) / 3, (t4 + a) / 2, t4 - 2 * a, x + 1].filter((v) => Number.isInteger(v) && v > 0).map(T), T(x)),
    typed: { kind: 'number', value: x },
    solution: [
      `3rd term $= ${a} + x$.`,
      `4th term $= x + (${a} + x) = ${a} + 2x$.`,
      `$${a} + 2x = ${t4}$, so $2x = ${t4 - a}$ and $x = ${x}$.`,
      `Answer: $x = ${x}$`,
    ],
  };
}, { title: 'Fibonacci-type sequences with missing terms' });

export const specialWhich = G('seq-special-which', 'seq-special', (rng, d) => {
  const kind = d === 'easy' ? pick(rng, ['triangular', 'square']) : d === 'medium' ? pick(rng, ['triangular', 'cube', 'square']) : pick(rng, ['sqtri', 'sqcube', 'triangular', 'cube']);
  const test = { triangular: isTri, square: isSquare, cube: isCube, sqtri: (n) => isSquare(n) && isTri(n), sqcube: (n) => isSquare(n) && isCube(n) }[kind];
  let ans; let pool;
  if (kind === 'triangular') { ans = tri(int(rng, d === 'easy' ? 3 : 5, d === 'easy' ? 9 : 16)); pool = [ans - 1, ans + 1, ans + 2, ans - 2, ans + 3, ans - 3, 2 * Math.round(ans / 2) + 2]; }
  else if (kind === 'square') { const k = int(rng, 4, 12); ans = k * k; pool = [k * 2, k * k - 1, k * k + 1, (k + 1) * k, k * k + k, 2 * k * k]; }
  else if (kind === 'cube') { const k = int(rng, 2, 6); ans = k ** 3; pool = [3 * k, k * k, k ** 3 + 1, k ** 3 - 1, (k + 1) ** 2, 3 * (k + 1), (k + 1) ** 3 - 3]; }
  else if (kind === 'sqtri') { ans = pick(rng, [36, 1225]); pool = [16, 25, 49, 64, 15, 21, 28, 45, 55, 81, 100, 120]; }
  else { ans = pick(rng, [64, 729]); pool = [16, 27, 36, 81, 125, 100, 8, 49, 216]; }
  const wrong = shuffle(rng, uniq(pool.filter((x) => x > 0 && !test(x)).map(String))).map(Number);
  const label = { triangular: 'a triangular number', square: 'a square number', cube: 'a cube number', sqtri: 'both a square number and a triangular number', sqcube: 'both a square number and a cube number' }[kind];
  const why = {
    triangular: `Triangular numbers: $1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 66, 78, 91, 105, 120, 136, \\dots$ — $${ans}$ is in the list.`,
    square: `$${ans} = ${Math.round(Math.sqrt(ans))} \\times ${Math.round(Math.sqrt(ans))}$`,
    cube: `$${ans} = ${Math.round(Math.cbrt(ans))} \\times ${Math.round(Math.cbrt(ans))} \\times ${Math.round(Math.cbrt(ans))}$. Watch out: $${Math.round(Math.cbrt(ans))}^3$ is not $3 \\times ${Math.round(Math.cbrt(ans))}$.`,
    sqtri: `$${ans} = ${Math.round(Math.sqrt(ans))}^2$, and it is the ${ordinal((Math.sqrt(8 * ans + 1) - 1) / 2)} triangular number.`,
    sqcube: `$${ans} = ${Math.round(Math.sqrt(ans))}^2 = ${Math.round(Math.cbrt(ans))}^3$.`,
  }[kind];
  const shown = [ans, ...wrong.slice(0, 4)].sort((x, y) => x - y);
  return {
    prompt: `Here are five numbers.<br>$${shown.map((x) => tnum(x)).join('\\qquad ')}$<br>Which of them is ${label}?`,
    answer: T(ans),
    distractors: wrong.slice(0, 4).map(T),
    fill: false,
    solution: [why, 'None of the other numbers fit.', `Answer: $${tnum(ans)}$`],
  };
}, { title: 'Spot square, cube and triangular numbers' });

export const specialRecurrence = G('seq-special-recurrence', 'seq-special', (rng, d) => {
  const form = d === 'easy' ? 'lin' : d === 'medium' ? pick(rng, ['lin', 'sq', 'frac']) : pick(rng, ['frac', 'frac', 'sq']);
  for (let attempt = 0; attempt < 60; attempt += 1) {
    let f; let tex;
    if (form === 'lin') { const a = int(rng, 2, 4); const b = pick(rng, [-5, -3, -2, -1, 1, 2, 3, 4]); f = (u) => u.mul(a).add(b); tex = `${a}u_n ${b < 0 ? '-' : '+'} ${Math.abs(b)}`; }
    else if (form === 'sq') { const k = int(rng, 1, 8); f = (u) => u.mul(u).sub(k); tex = `u_n^2 - ${k}`; }
    else { const a = pick(rng, [6, 8, 10, 12, 15, 20, 24, 30]); const b = int(rng, 1, 5); f = (u) => frac(a).div(u.add(b)); tex = `\\frac{${a}}{u_n + ${b}}`; }
    const u1 = frac(int(rng, form === 'frac' ? 1 : -3, form === 'sq' ? 4 : 9));
    const n = d === 'easy' ? 2 : 3;
    const us = [u1];
    try { for (let i = 1; i < n + 1; i += 1) us.push(f(us[i - 1])); } catch (e) { continue; }
    const ans = us[n - 1];
    if (us.some((u) => Math.abs(u.value()) > 400 || u.d > 20)) continue;
    if (us[1].eq(us[0])) continue;
    const dist = [us[n - 2], us[n], form === 'frac' ? frac(1).mul(us[n - 2].d === 1 ? 1 : 1) : null, ans.add(1), ans.neg(), form === 'frac' ? us[n - 2].add(1) : null, form === 'lin' ? u1.mul(n) : null]
      .filter((x) => x && !x.eq(ans));
    const opt = (x) => `$${x.tex()}$`;
    const sol = [];
    for (let i = 1; i < n; i += 1) {
      const prev = us[i - 1];
      const U = prev.d === 1 && prev.n >= 0 ? prev.tex() : `\\left(${prev.tex()}\\right)`;
      sol.push(`$u_{${i + 1}} = ${tex.replace(/(\d)u_n/g, `$1 \\times ${U}`).replace(/u_n/g, U)} = ${us[i].tex()}$`);
    }
    return {
      prompt: `A sequence is formed by the iterative process<br>$u_{n+1} = ${tex}$, &nbsp; $u_1 = ${u1.tex()}$<br>Work out the value of $u_{${n}}$.`,
      answer: opt(ans),
      distractors: uniq(dist.map(opt), opt(ans)),
      typed: { kind: 'number', value: ans },
      solution: [
        `$u_{n+1}$ is the term after $u_n$: put the previous term into the formula to get the next one.`,
        ...sol,
        `Answer: $u_{${n}} = ${ans.tex()}$`,
      ],
    };
  }
  throw new Error('retry');
}, { title: 'Iterative (recurrence) sequences' });

/* ================================================================== */
/* seq-geometric                                                       */
/* ================================================================== */

export const geoNext = G('seq-geo-next', 'seq-geometric', (rng, d) => {
  if (chance(rng, 0.25)) return geoIdentifyBuild(rng, d);
  const kind = d === 'easy' ? pick(rng, ['int', 'int', 'half']) : d === 'medium' ? pick(rng, ['int', 'half', 'neg', 'ratio']) : pick(rng, ['surd', 'neg', 'frac', 'ratio']);
  if (kind === 'surd') {
    const s = pick(rng, [2, 3, 5]); const a = int(rng, 1, 3);
    // a, a√s, a s, a s√s, a s^2 → next a s^2 √s
    const T5 = [`${a === 1 ? '' : a}`, `${a === 1 ? '' : a}\\sqrt{${s}}`, `${a * s}`, `${a * s}\\sqrt{${s}}`, `${a * s * s}`];
    const termsTex = [a === 1 ? '1' : `${a}`, `${a === 1 ? '' : a}\\sqrt{${s}}`, `${a * s}`, `${a * s}\\sqrt{${s}}`];
    const ans = `$${a * s * s}$`;
    void T5;
    return {
      prompt: `Here are the first four terms of a geometric progression.<br>$${termsTex.join(',\\quad ')},\\quad \\dots$<br>Work out the 5th term.`,
      answer: ans,
      distractors: [`$${a * s * s}\\sqrt{${s}}$`, `$${a * s}\\sqrt{${s}} + ${a * s}$`, `$${2 * a * s}\\sqrt{${s}}$`, `$${a * s * s * s}$`, `$${a * s + 1}\\sqrt{${s}}$`, `$${a * s * 2}$`],
      solution: [
        `Find the common ratio: divide a term by the one before. $\\frac{${termsTex[1]}}{${termsTex[0]}} = \\sqrt{${s}}$`,
        `5th term $= ${a * s}\\sqrt{${s}} \\times \\sqrt{${s}} = ${a * s} \\times ${s} = ${a * s * s}$ (since $\\sqrt{${s}} \\times \\sqrt{${s}} = ${s}$).`,
        `Answer: $${a * s * s}$`,
      ],
    };
  }
  let a; let r;
  if (kind === 'int') { a = int(rng, 1, 6); r = frac(int(rng, 2, d === 'easy' ? 3 : 5)); }
  else if (kind === 'half') { r = frac(1, pick(rng, [2, 2, 3, 10])); a = frac(int(rng, 1, 5) * r.d ** 4); }
  else if (kind === 'neg') { a = int(rng, 1, 5) * (chance(rng) ? 1 : -1); r = frac(-int(rng, 2, 3)); }
  else if (kind === 'frac') { r = frac(pick(rng, [2, 3]), pick(rng, [3, 2])); if (r.eq(1)) r = frac(3, 2); a = frac(r.d ** 4 * int(rng, 1, 2)); }
  else { a = int(rng, 2, 6); r = frac(int(rng, 2, 4)); }
  a = F(a);
  const t = [0, 1, 2, 3, 4].map((i) => a.mul(new Frac(r.n ** i, r.d ** i)));
  if (kind === 'ratio') {
    const ans = `$${r.tex()}$`;
    return {
      prompt: `Here is a geometric progression.<br>${seqTex(t.slice(0, 4))}<br>What is the common ratio?`,
      answer: ans,
      distractors: uniq([`$${t[1].sub(t[0]).tex()}$`, `$${r.inv().tex()}$`, `$${r.add(1).tex()}$`, `$${r.mul(2).tex()}$`, `$${r.neg().tex()}$`, `$${t[2].sub(t[1]).tex()}$`], ans),
      typed: { kind: 'number', value: r },
      solution: [
        'In a geometric progression you <b>multiply</b> by the same number each time. That number is the common ratio.',
        `Common ratio $= \\text{term} \\div \\text{previous term} = ${t[1].tex()} \\div ${t[0].tex()} = ${r.tex()}$`,
        `Check: $${t[2].tex()} \\div ${t[1].tex()} = ${r.tex()}$ ✓ (the difference is not constant, so it is not "add").`,
        `Answer: $${r.tex()}$`,
      ],
    };
  }
  const ans = t[4];
  const opt = (x) => `$${x.tex()}$`;
  const dist = [t[3].add(t[3].sub(t[2])), t[3].mul(r.add(1)), t[3].mul(r).mul(r), r.d === 1 ? t[3].add(r) : null, t[3].div(r), ans.neg(), t[3].mul(r.inv())]
    .filter((x) => x && x.d <= 1000 && (r.n < 0 || x.n > 0));
  return {
    prompt: `Here are the first four terms of a geometric progression.<br>${seqTex(t.slice(0, 4))}<br>Work out the next term.`,
    answer: opt(ans),
    distractors: uniq(dist.map(opt), opt(ans)),
    typed: { kind: 'number', value: ans },
    solution: [
      `Find the common ratio: $${t[1].tex()} \\div ${t[0].tex() === '1' ? '1' : t[0].n < 0 ? `(${t[0].tex()})` : t[0].tex()} = ${r.tex()}$`,
      r.n < 0 ? 'A negative ratio makes the signs alternate.' : r.value() < 1 ? 'A ratio less than 1 makes the terms smaller each time.' : 'Each term is multiplied by the ratio.',
      `Next term $= ${t[3].n < 0 ? `(${t[3].tex()})` : t[3].tex()} \\times ${r.n < 0 ? `(${r.tex()})` : r.tex()} = ${ans.tex()}$`,
      `Answer: $${ans.tex()}$`,
    ],
  };
}, { title: 'Next term and common ratio' });

export const geoNth = G('seq-geo-nth', 'seq-geometric', (rng, d) => {
  const a = int(rng, 1, 5); const r = d === 'easy' ? 2 : pick(rng, [2, 3, d === 'hard' ? 4 : 2, d === 'hard' ? 5 : 3]);
  const k = d === 'easy' ? pick(rng, [6, 7, 8]) : d === 'medium' ? pick(rng, [7, 8, 9, 10]) : pick(rng, [8, 10, 12]);
  if (a * r ** (k - 1) > 2e6) throw new Error('retry');
  const t = [0, 1, 2, 3].map((i) => a * r ** i);
  const ans = a * r ** (k - 1);
  const findN = d !== 'easy' && chance(rng, 0.35);
  if (findN) {
    return {
      prompt: `Here is a geometric progression.<br>${seqTex(t)}<br>Which term of the sequence is equal to $${tnum(ans)}$?`,
      answer: T(k),
      distractors: uniq([k - 1, k + 1, Math.round(Math.log(ans) / Math.log(r)), ans / a / r, (ans - a) / (t[1] - t[0]) + 1].filter((x) => Number.isInteger(x) && x > 0).map(T), T(k)),
      typed: { kind: 'number', value: k },
      calculator: d === 'hard',
      solution: [
        `The $n$th term is $${a === 1 ? '' : `${a} \\times `}${r}^{n-1}$.`,
        `$${tnum(ans)} ${a === 1 ? '' : `\\div ${a} = ${tnum(ans / a)}`} = ${r}^{${k - 1}}$`,
        `So $n - 1 = ${k - 1}$ and $n = ${k}$.`,
        `Answer: the ${ordinal(k)} term`,
      ],
    };
  }
  const dist = [a * r ** k, (a * r) ** (k - 1), a + (k - 1) * (t[1] - t[0]), a * r * (k - 1), r ** k, a * r ** (k - 2)];
  return {
    prompt: `Here is a geometric progression.<br>${seqTex(t)}<br>Work out the ${ordinal(k)} term.`,
    answer: T(ans),
    distractors: uniq(dist.filter((x) => x > 0 && x <= ans * 20).map(T), T(ans)),
    typed: { kind: 'number', value: ans },
    calculator: ans > 5000,
    solution: [
      `The common ratio is $${r}$, so the $n$th term is $${a === 1 ? '' : `${a} \\times `}${r}^{n-1}$ (the 1st term has no multiplications by ${r}).`,
      `${ordinal(k)} term $= ${a === 1 ? '' : `${a} \\times `}${r}^{${k - 1}}${a === 1 ? '' : ` = ${a} \\times ${tnum(r ** (k - 1))}`} = ${tnum(ans)}$`,
      `Using $${r}^{${k}}$ instead would give the ${ordinal(k + 1)} term.`,
      `Answer: $${tnum(ans)}$`,
    ],
  };
}, { title: 'nth term of a geometric progression' });

export const geoMissing = G('seq-geo-missing', 'seq-geometric', (rng, d) => {
  const r = int(rng, 2, d === 'easy' ? 3 : 5);
  const a = int(rng, 1, 6);
  const t = [0, 1, 2, 3, 4, 5].map((i) => a * r ** i);
  if (d !== 'hard') {
    const ask = pick(rng, ['middle', 'first']);
    const shown = ['\\dots\\dots', t[1], '\\dots\\dots', t[3]];
    const ans = ask === 'middle' ? t[2] : t[0];
    const dist = ask === 'middle' ? [(t[1] + t[3]) / 2, t[1] * t[3], t[3] - t[1], t[1] * r * r, t[2] + r] : [t[1] - (t[3] - t[1]) / 2, t[1] / 2, t[1] - r, t[1] / (r * r), t[1] - r * r];
    return {
      prompt: `All the terms of a geometric progression are positive.<br>The 2nd and 4th terms are shown.<br>$${shown.map((s) => (typeof s === 'number' ? tnum(s) : s)).join('\\qquad ')}$<br>Work out the ${ask === 'middle' ? '3rd' : '1st'} term.`,
      answer: T(ans),
      distractors: uniq(dist.filter((x) => Number.isInteger(x) && x > 0).map(T), T(ans)),
      typed: { kind: 'number', value: ans },
      solution: [
        `From the 2nd term to the 4th term you multiply by the ratio $r$ twice: $${t[1]} \\times r^2 = ${t[3]}$.`,
        `$r^2 = ${t[3]} \\div ${t[1]} = ${r * r}$, so $r = ${r}$ (positive terms).`,
        ask === 'middle' ? `3rd term $= ${t[1]} \\times ${r} = ${t[2]}$` : `1st term $= ${t[1]} \\div ${r} = ${t[0]}$`,
        `Answer: $${ans}$`,
      ],
    };
  }
  const p = pick(rng, [1, 2]); const q = p + 3;
  const ans = t[1 + (p === 1 ? 1 : 0)];
  const askIdx = p === 1 ? 2 : 1; // ask the 2nd term when given 1st & 4th; ask the 1st when given 2nd & 5th
  const ansV = t[askIdx - 1];
  void ans;
  return {
    prompt: `The ${ordinal(p)} term of a geometric progression is $${tnum(t[p - 1])}$ and the ${ordinal(q)} term is $${tnum(t[q - 1])}$.<br>Work out the ${ordinal(askIdx)} term.`,
    answer: T(ansV),
    distractors: uniq([t[p - 1] + (t[q - 1] - t[p - 1]) / 3, t[q - 1] / 3, t[p - 1] * r * r, askIdx === 1 ? t[p - 1] - r : t[p - 1] + r, askIdx === 2 ? t[p - 1] * 3 : t[p - 1] / 3, ansV * r].filter((x) => Number.isInteger(x) && x > 0 && x !== ansV).map(T), T(ansV)),
    typed: { kind: 'number', value: ansV },
    solution: [
      `From the ${ordinal(p)} to the ${ordinal(q)} term you multiply by $r$ three times: $${t[p - 1]} \\times r^3 = ${tnum(t[q - 1])}$.`,
      `$r^3 = ${tnum(t[q - 1])} \\div ${t[p - 1]} = ${r ** 3}$, so $r = \\sqrt[3]{${r ** 3}} = ${r}$.`,
      askIdx === 2 ? `2nd term $= ${t[0]} \\times ${r} = ${t[1]}$` : `1st term $= ${t[1]} \\div ${r} = ${t[0]}$`,
      `Answer: $${ansV}$`,
    ],
  };
}, { title: 'Missing terms of a geometric progression' });

// "Which of these is a geometric progression?" — mixed into seq-geo-next (its prompt never varies on its own).
function geoIdentifyBuild(rng, d) {
  const a = int(rng, 1, 5); const r = int(rng, 2, 4);
  const gp = [0, 1, 2, 3, 4].map((i) => a * r ** i);
  const fake = [...gp]; fake[3] = gp[3] - pick(rng, [2, 4]); fake[4] = fake[3] * r - 2;
  const ap = [0, 1, 2, 3, 4].map((i) => a + i * (r * a));
  const fib = [a, a * r]; while (fib.length < 5) fib.push(fib[fib.length - 1] + fib[fib.length - 2]);
  const sq = [1, 2, 3, 4, 5].map((i) => (i + a) ** 2);
  const dbl = [0, 1, 2, 3, 4].map((i) => a * 2 + i * 2);
  const opts = [ap, fib, sq, dbl, fake].filter((s) => !classify(s).has('geo'));
  let ansSeq = gp;
  if (d === 'hard') {
    const kind = pick(rng, ['half', 'neg', 'gp']);
    if (kind === 'half') ansSeq = [0, 1, 2, 3, 4].map((i) => (a * 16) / 2 ** i);
    if (kind === 'neg') ansSeq = [0, 1, 2, 3, 4].map((i) => a * (-r) ** i);
  }
  const fmt = (s) => `$${s.map((x) => tnum(x)).join(',\\ ')}$`;
  return {
    prompt: 'Which of these is a geometric progression?',
    answer: fmt(ansSeq),
    distractors: uniq(opts.map(fmt), fmt(ansSeq)),
    count: 4,
    solution: [
      'In a geometric progression each term is the previous term <b>multiplied</b> by the same number.',
      `$${tnum(ansSeq[1])} \\div ${ansSeq[0] < 0 ? `(${tnum(ansSeq[0])})` : tnum(ansSeq[0])} = ${tnum(ansSeq[1] / ansSeq[0])}$, $${tnum(ansSeq[2])} \\div ${ansSeq[1] < 0 ? `(${tnum(ansSeq[1])})` : tnum(ansSeq[1])} = ${tnum(ansSeq[2] / ansSeq[1])}$, … the ratio is always $${tnum(ansSeq[1] / ansSeq[0])}$.`,
      'The others either add a constant, add the two previous terms, or the ratio changes part-way.',
      `Answer: ${fmt(ansSeq)}`,
    ],
  };
}

/* ================================================================== */
/* seq-quadratic-nth-term                                              */
/* ================================================================== */

/** an^2 + bn + c in TeX (integer coefficients). */
function qTex(a, b, c, v = 'n') {
  const parts = [];
  const push = (k, s) => {
    if (k === 0) return;
    const abs = Math.abs(k); const body = abs === 1 && s ? s : `${abs}${s}`;
    parts.push(parts.length ? `${k < 0 ? '- ' : '+ '}${body}` : `${k < 0 ? '-' : ''}${body}`);
  };
  push(a, `${v}^2`); push(b, v); push(c, '');
  return parts.join(' ') || '0';
}
const qOpt = (a, b, c) => `$${qTex(a, b, c)}$`;

export const quadFind = G('seq-quad-find', 'seq-quadratic-nth-term', (rng, d) => {
  const a = d === 'easy' ? 1 : d === 'medium' ? pick(rng, [1, 2, 3]) : pick(rng, [2, 3, 4, -1, -2]);
  const b = d === 'easy' ? int(rng, -4, 5) : int(rng, -8, 8);
  const c = d === 'easy' ? int(rng, -5, 6) : int(rng, -10, 12);
  if (b === 0 && c === 0) throw new Error('retry');
  const u = [1, 2, 3, 4, 5].map((n) => a * n * n + b * n + c);
  const d1 = diffs(u); const d2 = diffs(d1);
  // distractor: forgot to halve the second difference
  const A2 = 2 * a; const r = u.map((x, i) => x - A2 * (i + 1) ** 2); const b2 = r[1] - r[0]; const c2 = r[0] - b2;
  const ans = qOpt(a, b, c);
  const res = u.map((x, i) => x - a * (i + 1) ** 2);
  const dist = [qOpt(A2, b2, c2), qOpt(a, -b, c), qOpt(a, b, c + b), qOpt(a, b, -c), qOpt(a, b + a, c - a), qOpt(a, b, 0), qOpt(a, 0, c + b), qOpt(a, c, b)];
  return {
    prompt: `Here are the first five terms of a quadratic sequence.<br>${seqTex(u, { dots: false })}<br>Work out an expression for the $n$th term. Give your answer in the form $an^2 + bn + c$.`,
    answer: ans,
    distractors: uniq(dist, ans),
    typed: { kind: 'text', accept: quadAccept(a, b, c) },
    solution: [
      `First differences: $${d1.join(',\\ ')}$. Second differences: $${d2.join(',\\ ')}$.`,
      `The coefficient of $n^2$ is <b>half</b> the second difference: $a = ${d2[0]} \\div 2 = ${a}$.`,
      `Subtract $${a === 1 ? '' : a === -1 ? '-' : a}n^2$ from each term: $${res.join(',\\ ')}$. This is linear with $n$th term $${lin(b, c, 'n')}$.`,
      `Answer: $${qTex(a, b, c)}$`,
    ],
  };
}, { title: 'Find the nth term of a quadratic sequence' });

export const quadNext = G('seq-quad-next', 'seq-quadratic-nth-term', (rng, d) => {
  const a = pick(rng, d === 'easy' ? [1, 1, 2] : [1, 2, 3, -1]);
  const b = int(rng, -5, 6); const c = int(rng, -5, 8);
  const u = [1, 2, 3, 4, 5, 6].map((n) => a * n * n + b * n + c);
  const k = d === 'hard' ? 6 : 5;
  const shown = u.slice(0, k === 6 ? 4 : 4);
  const ans = u[k - 1];
  const d1 = diffs(shown); const d2 = d1[1] - d1[0];
  const lastD = d1[d1.length - 1];
  const dist = [shown[3] + lastD, shown[3] + lastD + 1, shown[3] + 2 * lastD, k === 6 ? u[4] : u[5], ans + d2, ans - d2];
  const nextDiffs = [lastD + d2, lastD + 2 * d2];
  return {
    prompt: `Here are the first four terms of a quadratic sequence.<br>${seqTex(shown)}<br>Work out the ${ordinal(k)} term.`,
    answer: T(ans),
    distractors: uniq(dist.map(T), T(ans)),
    typed: { kind: 'number', value: ans },
    solution: [
      `First differences: $${d1.join(',\\ ')}$. The second difference is constant: $${d2}$.`,
      `So the next first differences are $${nextDiffs.slice(0, k - 4).join(',\\ ')}$.`,
      k === 5 ? `5th term $= ${shown[3]} ${pm(nextDiffs[0])} = ${ans}$` : `5th term $= ${shown[3]} ${pm(nextDiffs[0])} = ${u[4]}$, 6th term $= ${u[4]} ${pm(nextDiffs[1])} = ${ans}$`,
      `Answer: $${ans}$`,
    ],
  };
}, { title: 'Continue a quadratic sequence' });

export const quadPartial = G('seq-quad-partial', 'seq-quadratic-nth-term', (rng, d) => {
  const a = pick(rng, d === 'hard' ? [2, 3, -1, -2] : [1, 2, 3]);
  const b = int(rng, -6, 6); const c = int(rng, -6, 12);
  const u = [1, 2, 3].map((n) => a * n * n + b * n + c);
  const mode = d === 'easy' ? 'sub' : pick(rng, ['info', 'sub', 'info']);
  if (mode === 'sub') {
    // Given nth term, which term has value N
    const A = pick(rng, [1, 1, 2]); const B = int(rng, -4, 5); const C = int(rng, -10, 10);
    const k = int(rng, 5, 15); const N = A * k * k + B * k + C;
    const tex = qTex(A, B, C);
    return {
      prompt: `The $n$th term of a quadratic sequence is $${tex}$.<br>Which term of the sequence is equal to $${tnum(N)}$?`,
      answer: T(k),
      distractors: uniq([k + 1, k - 1, Math.round(Math.sqrt(Math.abs(N))), Math.round((N - C) / (A + B || 1)), k + 2].filter((x) => Number.isInteger(x) && x > 0).map(T), T(k)),
      typed: { kind: 'number', value: k },
      solution: [
        `Set up an equation: $${tex} = ${tnum(N)}$, so $${qTex(A, B, C - N)} = 0$.`,
        `Solve (factorise or use the formula). The positive whole-number solution is $n = ${k}$.`,
        `Check: $${A === 1 ? '' : `${A} \\times `}${k}^2${B ? ` ${pm(B)} \\times ${k}` : ''}${C ? ` ${pm(C)}` : ''} = ${N}$ ✓`,
        `Answer: the ${ordinal(k)} term, $n = ${k}$`,
      ],
    };
  }
  const sd = 2 * a;
  const ans = qOpt(a, b, c);
  const fd = u[1] - u[0];
  const dist = [qOpt(sd, fd - 3 * sd, u[0] - sd - (fd - 3 * sd)), qOpt(a, fd, u[0] - a - fd), qOpt(a, -b, c), qOpt(a, b, u[0]), qOpt(a, b, -c), qOpt(sd, b, c)];
  return {
    prompt: `The first two terms of a quadratic sequence are $${u[0]}$ and $${u[1]}$.<br>The second difference of the sequence is $${sd}$.<br>Work out an expression for the $n$th term.`,
    answer: ans,
    distractors: uniq(dist, ans),
    typed: { kind: 'text', accept: quadAccept(a, b, c) },
    solution: [
      `The coefficient of $n^2$ is half the second difference: $${sd} \\div 2 = ${a}$.`,
      `Subtract $${a === 1 ? '' : a === -1 ? '-' : a}n^2$ from the two terms: $${u[0]} - ${a < 0 ? `(${a})` : a} = ${u[0] - a}$ and $${u[1]} - ${a < 0 ? `(${4 * a})` : 4 * a} = ${u[1] - 4 * a}$.`,
      `These go up by $${b}$, so the linear part is $${lin(b, c, 'n')}$.`,
      `Answer: $${qTex(a, b, c)}$`,
    ],
  };
}, { title: 'Quadratic sequences from partial information' });

export const sequenceGenerators = [
  tttNext, tttRule, tttTwoStep, tttPattern,
  nthGenerate, nthWhichTerm, nthIsTerm, nthInequality,
  linFind, linPattern, linTermFromSeq, linTwoTerms,
  specialName, specialNext, specialFibMissing, specialWhich, specialRecurrence,
  geoNext, geoNth, geoMissing,
  quadFind, quadNext, quadPartial,
];

void [sample, isPrime, ftex, size];
