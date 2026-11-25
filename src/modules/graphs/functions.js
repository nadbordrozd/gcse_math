// Functions: function machines, function notation, composite and inverse functions.
import { pick, int, chance, shuffle, tnum, frac, Frac, gcd } from '../../core.js';
import { G, F, lin, linAccept, T, uniq } from './util.js';
import { machine } from './diagrams.js';
import { qx } from './nonlinear.js';

const nz = (rng, lo, hi) => { let v = 0; while (v === 0) v = int(rng, lo, hi); return v; };
const par = (v) => (F(v).n < 0 ? `(${F(v).tex()})` : F(v).tex());

/* ================================================================== */
/* gr-function-machines                                                */
/* ================================================================== */

// An operation on a Frac, with display and inverse. kind: add/sub/mul/div
const op = (kind, k) => ({
  kind, k,
  sym: { add: `+ ${k}`, sub: `− ${k}`, mul: `× ${k}`, div: `÷ ${k}` }[kind],
  tex: { add: `+ ${k}`, sub: `- ${k}`, mul: `\\times ${k}`, div: `\\div ${k}` }[kind],
  word: { add: `add ${k}`, sub: `subtract ${k}`, mul: `multiply by ${k}`, div: `divide by ${k}` }[kind],
  f: (x) => ({ add: x.add(k), sub: x.sub(k), mul: x.mul(k), div: x.div(k) }[kind]),
  inv: (x) => ({ add: x.sub(k), sub: x.add(k), mul: x.div(k), div: x.mul(k) }[kind]),
  invWord: { add: `subtract ${k}`, sub: `add ${k}`, mul: `divide by ${k}`, div: `multiply by ${k}` }[kind],
  invTex: { add: `- ${k}`, sub: `+ ${k}`, mul: `\\div ${k}`, div: `\\times ${k}` }[kind],
});
function randOps(rng, d) {
  const n = d === 'hard' ? pick(rng, [2, 3]) : 2;
  const ops = [];
  for (let i = 0; i < n; i += 1) {
    const kind = pick(rng, i === 0 ? ['mul', 'add', 'sub', 'mul'] : ['add', 'sub', 'mul', 'div', 'add']);
    const k = kind === 'mul' || kind === 'div' ? int(rng, 2, d === 'easy' ? 5 : 9) : int(rng, 1, d === 'easy' ? 10 : 20);
    const prev = ops[ops.length - 1];
    const cancels = prev && prev.k === k && ['add|sub', 'sub|add', 'mul|div', 'div|mul'].includes(`${prev.kind}|${kind}`);
    if ((prev && prev.kind === kind) || cancels) { i -= 1; continue; }
    ops.push(op(kind, k));
  }
  return ops;
}
const run = (ops, x) => ops.reduce((v, o) => o.f(v), F(x));
const runInv = (ops, y) => [...ops].reverse().reduce((v, o) => o.inv(v), F(y));
const show = (v) => `$${v.tex()}$`;

export const fmOutput = G('gr-fm-output', 'gr-function-machines', (rng, d) => {
  const ops = randOps(rng, d);
  const x = d === 'easy' ? int(rng, 1, 12) : d === 'medium' ? nz(rng, -6, 15) : pick(rng, [nz(rng, -9, 20), frac(int(rng, 1, 9), 2)]);
  const out = run(ops, x);
  if (out.d !== 1 && d !== 'hard') throw new Error('r');
  if (ops.some((o, i) => o.kind === 'div' && run(ops.slice(0, i), x).d !== 1 && d !== 'hard')) throw new Error('r');
  if (out.d > 4) throw new Error('r');
  const wrongOrder = [...ops].reverse().reduce((v, o) => o.f(v), F(x));
  const dist = [wrongOrder, runInv(ops, x), ops[0].f(F(x)), ops.slice(1).reduce((v, o) => o.f(v), F(x)), out.add(1), out.sub(ops[ops.length - 1].kind === 'add' ? ops[ops.length - 1].k * 2 : 1)];
  const chain = []; let v = F(x);
  for (const o of ops) { const nv = o.f(v); chain.push(`$${v.tex()} ${o.tex} = ${nv.tex()}$`); v = nv; }
  return {
    prompt: `Here is a function machine.<br>Work out the output when the input is $${F(x).tex()}$.`,
    visual: machine(ops.map((o) => o.sym), F(x).tex().replace(/\\frac\{(\d+)\}\{(\d+)\}/, '$1/$2'), '?'),
    answer: show(out),
    distractors: uniq(dist.concat([out.sub(1), out.add(2)]).filter((q) => (out.d === 1 ? q.d === 1 : q.d <= 4)).map(show), show(out)),
    typed: { kind: 'number', value: out },
    solution: ['Apply the operations in order, from left to right.', ...chain, `Answer: $${out.tex()}$`],
  };
}, { title: 'Function machine: find the output' });

export const fmInput = G('gr-fm-input', 'gr-function-machines', (rng, d) => {
  const ops = randOps(rng, d);
  const x = d === 'easy' ? int(rng, 1, 12) : nz(rng, -8, 15);
  const out = run(ops, x);
  if (out.d !== 1 || ops.some((o, i) => run(ops.slice(0, i + 1), x).d !== 1)) throw new Error('r');
  const fwd = run(ops, out);
  const invWrongOrder = ops.reduce((v, o) => o.inv(v), out);
  const dist = [fwd, invWrongOrder, ops[0].inv(out), runInv(ops.slice(1), out), F(x).add(1), F(x).neg()];
  const chain = []; let v = out;
  for (const o of [...ops].reverse()) { const nv = o.inv(v); chain.push(`$${v.tex()} ${o.invTex} = ${nv.tex()}$ (undo ${o.word})`); v = nv; }
  return {
    prompt: `Here is a function machine.<br>The output is $${out.tex()}$. Work out the input.`,
    visual: machine(ops.map((o) => o.sym), '?', out.tex()),
    answer: show(F(x)),
    distractors: uniq(dist.concat([F(x).sub(1), F(x).add(2)]).filter((q) => q.d === 1).map(show), show(F(x))),
    typed: { kind: 'number', value: x },
    solution: ['Work <b>backwards</b> from the output, using the inverse operations in reverse order.', ...chain, `Check: put $${x}$ through the machine and you get $${out.tex()}$.`, `Answer: $${x}$`],
  };
}, { title: 'Function machine: find the input' });

/** Algebraic output of a machine for input v, as TeX in its natural (bracketed) form, plus linear coefficients. */
function machineExpr(ops, v = 'x') {
  let tex = v; let a = frac(1); let b = frac(0); let kind = 'var';
  for (const o of ops) {
    if (o.kind === 'add' || o.kind === 'sub') {
      tex = `${tex} ${o.kind === 'add' ? '+' : '-'} ${o.k}`; b = o.kind === 'add' ? b.add(o.k) : b.sub(o.k); kind = 'sum';
    } else if (o.kind === 'mul') {
      tex = kind === 'var' ? `${o.k}${v}` : kind === 'sum' ? `${o.k}(${tex})` : `${o.k}\\left(${tex}\\right)`; a = a.mul(o.k); b = b.mul(o.k); kind = kind === 'var' ? 'term' : 'prod';
    } else {
      tex = `\\frac{${tex}}{${o.k}}`; a = a.div(o.k); b = b.div(o.k); kind = 'frac';
    }
  }
  return { tex, a, b };
}

export const fmExpression = G('gr-fm-expression', 'gr-function-machines', (rng, d) => {
  const ops = randOps(rng, d === 'hard' ? 'medium' : d).filter((o) => o.kind !== 'div' || d !== 'easy');
  if (ops.length < 2) throw new Error('r');
  const e = machineExpr(ops);
  const rev = machineExpr([...ops].reverse());
  const noBr = (() => { // ignores brackets: multiplies only the x
    let a = frac(1); let b = frac(0);
    for (const o of ops) { if (o.kind === 'mul') a = a.mul(o.k); else if (o.kind === 'div') a = a.div(o.k); else b = o.kind === 'add' ? b.add(o.k) : b.sub(o.k); }
    return lin(a, b);
  })();
  const ansTex = e.tex;
  const expanded = lin(e.a, e.b);
  // Keep only distractors whose value really differs from the answer (some machines commute).
  const sameAsAns = (A, B) => F(A).eq(e.a) && F(B).eq(e.b);
  const addFirst = ops[0].kind === 'add' || ops[0].kind === 'sub';
  const opts = [
    sameAsAns(rev.a, rev.b) ? null : rev.tex,
    sameAsAns(rev.a, rev.b) ? null : lin(rev.a, rev.b),
    noBr === expanded ? null : noBr,
    lin(e.a.add(1), e.b),
    // the operations written in a row without brackets: only wrong when + or − comes before × or ÷
    addFirst && ops.slice(1).some((o) => o.kind === 'mul' || o.kind === 'div') ? `x ${ops.map((o) => o.tex).join(' ')}` : null,
    e.a.eq(e.b) ? null : lin(e.b, e.a),
  ].filter((t) => t && t !== ansTex && t !== expanded);
  if (d === 'hard' && chance(rng, 0.5)) {
    // reverse: which machine gives this expression?
    const ans = ops.map((o) => o.sym).join(' then ');
    const flipSign = (o) => (o.kind === 'add' ? op('sub', o.k) : o.kind === 'sub' ? op('add', o.k) : o.kind === 'mul' ? op('div', o.k) : op('mul', o.k));
    const alts = [
      [...ops].reverse(),
      ops.map((o) => (o.kind === 'add' ? op('sub', o.k) : o.kind === 'sub' ? op('add', o.k) : o)),
      [ops[0], op(ops[1].kind, ops[1].k + 1)],
      [op(ops[0].kind, ops[0].k + 1), ops[1]],
      [ops[1], op(ops[0].kind, ops[0].k * 2)],
      [flipSign(ops[0]), ops[1]],
    ].filter((a) => { const ex = machineExpr(a); return !(ex.a.eq(e.a) && ex.b.eq(e.b)); });
    return {
      prompt: `A function machine takes an input $x$ and gives the output $${ansTex}$.<br>Which operations does the machine use, in order?`,
      answer: ans,
      distractors: uniq(alts.map((a) => a.map((o) => o.sym).join(' then ')), ans),
      solution: [`Read the expression from the inside out: ${ops.map((o) => o.word).join(', then ')}.`, ops[0].kind === 'add' || ops[0].kind === 'sub' ? 'The bracket shows the adding/subtracting happens first.' : 'Multiplying $x$ first gives a term like $kx$; anything added afterwards is not multiplied.', `Answer: ${ans}`],
    };
  }
  return {
    prompt: 'Here is a function machine.<br>The input is $x$. Which expression gives the output?',
    visual: machine(ops.map((o) => o.sym), 'x', '?'),
    answer: `$${ansTex}$`,
    distractors: uniq(opts.map((t) => `$${t}$`), `$${ansTex}$`),
    typed: { kind: 'text', accept: [...linAccept(e.a, e.b, 'x'), ansTex.replace(/\s/g, '').replace(/\\left|\\right/g, '').replace(/\\frac\{([^}]*)\}\{([^}]*)\}/, '($1)/$2')] },
    solution: [
      'Apply each operation to the whole expression so far.',
      ...ops.map((o, i) => `After "${o.sym}": $${machineExpr(ops.slice(0, i + 1)).tex}$`),
      ansTex !== expanded ? `(This expands to $${expanded}$.) Answer: $${ansTex}$` : `Answer: $${ansTex}$`,
    ],
  };
}, { title: 'Function machine: output as an expression' });

export const fmSameOutput = G('gr-fm-same', 'gr-function-machines', (rng, d) => {
  // Two machines; find the input giving the same output (forms a linear equation), or the missing operation.
  if (d === 'easy' || (d === 'medium' && chance(rng, 0.4))) {
    const m = int(rng, 2, 6); const c = nz(rng, -9, 12);
    const xs = shuffle(rng, [1, 2, 3, 4, 5, 6, 7, 8, 10]).slice(0, 3);
    const hidden = pick(rng, ['mul', 'add']);
    const ops = [op('mul', m), op(c > 0 ? 'add' : 'sub', Math.abs(c))];
    const rows = xs.map((x) => [x, m * x + c]);
    const ans = hidden === 'mul' ? ops[0].sym : ops[1].sym;
    const shown = hidden === 'mul' ? ['?', ops[1].sym] : [ops[0].sym, '?'];
    const df = rows[0][1] - rows[0][0];
    const addOp = (v) => (v < 0 ? `− ${-v}` : `+ ${v}`);
    const dist = hidden === 'mul' ? [`× ${m + 1}`, `× ${m - 1}`, `+ ${m}`, `× ${m * 2}`, addOp(df)] : [addOp(c + 1), addOp(-c), `× ${Math.abs(c)}`, addOp(df), addOp(c + (c > 0 ? m : -m))];
    return {
      prompt: `Here is a function machine with one operation missing.<br>${rows.map(([x, y]) => `Input $${x}$ gives output $${y}$.`).join('<br>')}<br>What is the missing operation?`,
      visual: machine(shown, 'x', 'y'),
      answer: ans.replace('−', '−'),
      distractors: uniq(dist.filter((s) => s !== ans && s !== `− 0` && s !== '+ 0'), ans),
      solution: [
        `Try the operation on the first pair: input $${rows[0][0]}$, output $${rows[0][1]}$.`,
        hidden === 'mul' ? `Working back: $${rows[0][1]} ${ops[1].invTex} = ${m * rows[0][0]}$, and $${m * rows[0][0]} \\div ${rows[0][0]} = ${m}$.` : `$${rows[0][0]} \\times ${m} = ${m * rows[0][0]}$, and to get $${rows[0][1]}$ we ${c > 0 ? 'add' : 'subtract'} $${Math.abs(c)}$.`,
        `Check with the other inputs: it works every time. Answer: ${ans}`,
      ],
    };
  }
  // equal outputs
  const a1 = int(rng, 2, 6); let a2 = int(rng, 2, 6); if (a1 === a2) a2 += 1;
  const x0 = nz(rng, -5, 9);
  const b1 = int(rng, 1, 15); const b2 = a1 * x0 + b1 - a2 * x0;
  if (b2 === 0 || Math.abs(b2) > 30) throw new Error('r');
  const m1 = [op('mul', a1), op('add', b1)];
  // hard: machine B adds/subtracts first, so its expression needs brackets
  if (d === 'hard' && Math.abs(b2) % a2 !== 0) throw new Error('r');
  const m2 = d === 'hard' || chance(rng) ? [op(b2 > 0 ? 'add' : 'sub', Math.abs(b2) % a2 === 0 ? Math.abs(b2) / a2 : 0), op('mul', a2)] : [op('mul', a2), op(b2 > 0 ? 'add' : 'sub', Math.abs(b2))];
  if (m2[0].k === 0) { m2.splice(0, 2, op('mul', a2), op(b2 > 0 ? 'add' : 'sub', Math.abs(b2))); }
  const e1 = machineExpr(m1); const e2 = machineExpr(m2);
  const sol = frac(e2.b.sub(e1.b).n * e1.a.sub(e2.a).d, 1).div(e1.a.sub(e2.a).mul(e2.b.sub(e1.b).d));
  if (sol.d !== 1) throw new Error('r');
  return {
    prompt: `Here are two function machines.<br>Machine A: input → ${m1.map((o) => o.sym).join(' → ')} → output<br>Machine B: input → ${m2.map((o) => o.sym).join(' → ')} → output<br>The same input gives the same output in both machines. Work out the input.`,
    answer: T(sol),
    distractors: uniq([sol.neg(), sol.add(1), e1.b.sub(e2.b), frac(e1.a.mul(sol).add(e1.b).value()), sol.sub(1), sol.mul(2)].map(T), T(sol)),
    typed: { kind: 'number', value: sol },
    solution: [
      `Call the input $x$. Machine A gives $${e1.tex}$; machine B gives $${e2.tex}$.`,
      `Set them equal: $${e1.tex} = ${e2.tex}$`,
      e1.a.sub(e2.a).eq(1) ? `Subtract $${lin(e2.a, 0)}$ from both sides and rearrange: $x = ${e2.b.sub(e1.b).tex()}$.`
        : `Rearrange: $${lin(e1.a.sub(e2.a), 0)} = ${e2.b.sub(e1.b).tex()}$, so $x = ${sol.tex()}$.`,
      `Answer: $${sol.tex()}$ (both machines output $${e1.a.mul(sol).add(e1.b).tex()}$)`,
    ],
  };
}, { title: 'Missing operations and equal outputs' });

/* ================================================================== */
/* gr-function-notation                                                */
/* ================================================================== */

/** Random function: returns {tex, f(Frac)->Frac, kind} */
function randFn(rng, d, name = 'f') {
  void name;
  const kind = d === 'easy' ? pick(rng, ['lin', 'lin', 'quad0']) : d === 'medium' ? pick(rng, ['lin', 'quad', 'quad0', 'frac']) : pick(rng, ['quad', 'frac', 'cubic', 'recip']);
  if (kind === 'lin') { const a = nz(rng, -6, 7); const b = nz(rng, -9, 9); return { kind, a, b, tex: lin(a, b), f: (x) => F(x).mul(a).add(b) }; }
  if (kind === 'quad0') { const a = pick(rng, [1, 2, 3]); const b = nz(rng, -9, 9); return { kind, a, b, tex: qx(a, 0, b), f: (x) => F(x).mul(x).mul(a).add(b) }; }
  if (kind === 'quad') { const a = pick(rng, [1, 1, 2]); const b = nz(rng, -6, 6); const c = int(rng, -8, 8); return { kind, a, b, c, tex: qx(a, b, c), f: (x) => F(x).mul(x).mul(a).add(F(x).mul(b)).add(c) }; }
  if (kind === 'frac') { const a = int(rng, 2, 5); const b = nz(rng, -7, 7); const c = pick(rng, [2, 3, 4, 5]); return { kind, a, b, c, tex: `\\frac{${lin(a, b)}}{${c}}`, f: (x) => F(x).mul(a).add(b).div(c) }; }
  if (kind === 'cubic') { const b = nz(rng, -9, 9); return { kind, b, tex: `x^3 ${b < 0 ? '-' : '+'} ${Math.abs(b)}`, f: (x) => F(x).mul(x).mul(x).add(b) }; }
  const a = pick(rng, [6, 12, 24]); const b = nz(rng, -3, 3); return { kind, a, b, tex: `\\frac{${a}}{x ${b < 0 ? '-' : '+'} ${Math.abs(b)}}`, f: (x) => frac(a).div(F(x).add(b)) };
}
const subTex = (fn, x) => {
  const X = F(x);
  const s = X.d !== 1 ? `\\left(${X.tex()}\\right)` : X.n < 0 ? `(${X.tex()})` : X.tex();
  return fn.tex.replace(/(\d)x/g, `$1 \\times ${s}`).replace(/x/g, s);
};

export const fnEvaluate = G('gr-fn-evaluate', 'gr-function-notation', (rng, d) => {
  const fn = randFn(rng, d);
  const x = d === 'easy' ? nz(rng, 1, 6) : nz(rng, -5, 6);
  let val;
  try { val = fn.f(x); } catch (e) { throw new Error('r'); }
  if (val.d > 4) throw new Error('r');
  if (fn.kind === 'frac' && val.d !== 1 && d !== 'hard') throw new Error('r');
  const X = F(x);
  const dist = [
    fn.kind === 'lin' ? X.mul(fn.a).sub(fn.b) : null,
    fn.kind === 'lin' ? frac(fn.a + x + fn.b) : null,
    fn.kind === 'quad0' || fn.kind === 'quad' ? X.mul(X).neg().mul(fn.a).add(fn.kind === 'quad' ? X.mul(fn.b).add(fn.c) : fn.b) : null,
    fn.kind === 'quad0' ? X.mul(2 * fn.a).add(fn.b) : null,
    fn.kind === 'quad0' ? X.mul(fn.a).mul(X.mul(fn.a)).add(fn.b) : null,
    fn.kind === 'quad' ? X.mul(X).mul(fn.a).sub(X.mul(fn.b)).add(fn.c) : null,
    fn.kind === 'frac' ? X.mul(fn.a).add(fn.b) : null,
    fn.kind === 'frac' ? X.mul(fn.a).add(frac(fn.b, fn.c)) : null,
    fn.kind === 'cubic' ? X.mul(3).add(fn.b) : null,
    fn.kind === 'cubic' ? X.mul(X).mul(X).neg().add(fn.b) : null,
    fn.kind === 'recip' ? frac(fn.a).div(X).add(fn.b) : null,
    val.add(1), val.neg(), fn.f(X.neg ? X.neg() : X),
  ].filter((v) => v && !v.eq(val) && v.d <= 4);
  const name = pick(rng, ['f', 'g', 'h']);
  return {
    prompt: `$${name}(x) = ${fn.tex}$<br>Work out $${name}(${X.tex()})$.`,
    answer: show(val),
    distractors: uniq(dist.map(show), show(val)),
    typed: { kind: 'number', value: val },
    solution: [
      `$${name}(${X.tex()})$ means: replace every $x$ with $${X.tex()}$.`,
      `$${name}(${X.tex()}) = ${subTex(fn, x)} = ${val.tex()}$`,
      x < 0 && fn.kind !== 'lin' ? 'Use brackets for the negative number: a negative squared is positive, a negative cubed is negative.' : 'Follow the order of operations: powers, then multiply/divide, then add/subtract.',
      `Answer: $${val.tex()}$`,
    ],
  };
}, { title: 'Evaluate f(a)' });

export const fnSolve = G('gr-fn-solve', 'gr-function-notation', (rng, d) => {
  const name = pick(rng, ['f', 'g', 'h']);
  if (d === 'hard' && chance(rng, 0.5)) {
    const a = pick(rng, [1, 2, 3]); const b = nz(rng, -9, 9); const r = int(rng, 2, 7);
    const k = a * r * r + b;
    const tex = qx(a, 0, b);
    const opt = `$x = ${r}$ or $x = ${-r}$`;
    return {
      prompt: `$${name}(x) = ${tex}$<br>Solve $${name}(x) = ${k}$.`,
      answer: opt,
      distractors: uniq([`$x = ${r}$ only`, `$x = ${r * r}$ or $x = ${-r * r}$`, `$x = ${tnum(k - b)}$`,
        (r * r * a) % 2 === 0 ? `$x = ${(r * r * a) / 2}$ or $x = ${-(r * r * a) / 2}$` : null, `$x = \\sqrt{${k}}$ or $x = -\\sqrt{${k}}$`, `$x = ${r + 1}$ or $x = ${-r - 1}$`].filter(Boolean), opt),
      typed: { kind: 'list', values: [r, -r] },
      solution: [`$${tex} = ${k}$`, `$${a === 1 ? '' : a}x^2 = ${k - b}$${a > 1 ? `, so $x^2 = ${r * r}$` : ''}`, `$x = \\pm\\sqrt{${r * r}} = \\pm ${r}$ — don't forget the negative root.`, `Answer: ${opt}`],
    };
  }
  const fn = d === 'easy' ? { a: int(rng, 2, 6), b: nz(rng, -9, 12) } : { a: nz(rng, -6, 7), b: nz(rng, -12, 12) };
  if (fn.a === 1) fn.a = 2;
  const kind = d === 'hard' ? 'frac' : 'lin';
  const c = kind === 'frac' ? pick(rng, [2, 3, 4, 5]) : 1;
  const x = nz(rng, -6, 10);
  const k = frac(fn.a * x + fn.b, c);
  if (k.d !== 1) throw new Error('r');
  const tex = kind === 'frac' ? `\\frac{${lin(fn.a, fn.b)}}{${c}}` : lin(fn.a, fn.b);
  const sub = k.mul(fn.a).add(fn.b).div(c); // substituted k (wrong)
  const dist = [sub, frac(k.n * c + fn.b, fn.a), frac(k.n - fn.b), frac(k.n * c - fn.b), frac(x + 1), frac(-x), frac(x - 1)].filter((v) => v.d <= 4 && !v.eq(x) && Math.abs(v.value()) <= 60);
  return {
    prompt: `$${name}(x) = ${tex}$<br>Solve $${name}(x) = ${k.tex()}$.`,
    answer: T(x),
    distractors: uniq(dist.map(T), T(x)),
    typed: { kind: 'number', value: x },
    solution: [
      `$${name}(x) = ${k.tex()}$ means the <b>output</b> is $${k.tex()}$ — form an equation (don't substitute $${k.tex()}$ for $x$).`,
      `$${tex} = ${k.tex()}$`,
      c > 1 ? `Multiply by $${c}$: $${lin(fn.a, fn.b)} = ${k.n * c}$, so $${fn.a}x = ${k.n * c - fn.b}$.` : `$${fn.a}x = ${k.n - fn.b}$`,
      `$x = ${x}$`,
      `Answer: $x = ${x}$`,
    ],
  };
}, { title: 'Solve f(x) = k' });

export const fnConstants = G('gr-fn-constants', 'gr-function-notation', (rng, d) => {
  const c = d === 'hard' ? frac(nz(rng, -7, 7), 2) : frac(nz(rng, -6, 7));
  if (c.eq(1) || c.eq(0)) throw new Error('r');
  const dd = nz(rng, -12, 12);
  const p = int(rng, -3, 5); const q = p + pick(rng, [2, 4, 6]);
  const fp = c.mul(p).add(dd); const fq = c.mul(q).add(dd);
  if (fp.d !== 1 || fq.d !== 1) throw new Error('r');
  const ask = p === 0 ? 'c' : pick(rng, ['c', 'd']); // f(0) gives d directly, so then ask for c
  const ans = ask === 'c' ? c : frac(dd);
  const wrong = ask === 'c' ? [frac(q - p, fq.n - fp.n), fq.sub(fp), c.neg(), frac(fq.n, q || 1), c.add(1)] : [fp.sub(c), fp.sub(c.mul(p)).neg(), fq.sub(c.mul(p)), frac(fp.n - p), frac(dd).neg()];
  return {
    prompt: `$f(x) = cx + d$, where $c$ and $d$ are constants.<br>$f(${p}) = ${fp.tex()}$ and $f(${q}) = ${fq.tex()}$.<br>Work out the value of $${ask}$.`,
    answer: T(ans),
    distractors: uniq(wrong.filter((v) => v.d <= 4 && !v.eq(ans)).map(T), T(ans)),
    typed: { kind: 'number', value: ans },
    solution: [
      `Write two equations: $${lin(p, 0, 'c') === '0' ? '' : `${lin(p, 0, 'c')} + `}d = ${fp.tex()}$ and $${lin(q, 0, 'c')} + d = ${fq.tex()}$.`,
      `Subtract: $${q - p}c = ${fq.sub(fp).tex()}$, so $c = ${c.tex()}$.`,
      ...(ask === 'd' ? [`Substitute: $d = ${fp.tex()} - ${par(c.mul(p))} = ${dd}$.`] : p === 0 ? [`(From $f(0)$ you can see straight away that $d = ${dd}$.)`] : []),
      `Answer: $${ask} = ${ans.tex()}$`,
    ],
  };
}, { title: 'Find constants from function values' });

export const fnExpression = G('gr-fn-expression', 'gr-function-notation', (rng, d) => {
  const a1 = nz(rng, -4, 5); const b1 = nz(rng, -9, 9); // f(x) = a1 x + b1
  const a2 = nz(rng, 2, 6); const b2 = nz(rng, -9, 9); // g(x) = a2 x + b2
  const m = pick(rng, [2, 3, 4]); const s = nz(rng, -4, 4);
  const mode = d === 'easy' ? 'one' : d === 'medium' ? pick(rng, ['one', 'sum']) : pick(rng, ['sum', 'sq']);
  if (mode === 'sq') {
    const k = pick(rng, [1, 2, 3, -1, -2]); const c = nz(rng, -6, 6);
    // f(x) = x² + c ; f(x + k) = x² + 2kx + k² + c
    const ans = qx(1, 2 * k, k * k + c);
    const dist = [qx(1, k, k * k + c), qx(1, 0, k * k + c), qx(1, 0, k + c), qx(1, 2 * k, k + c), qx(1, 2 * k, c - k * k)];
    return {
      prompt: `$f(x) = x^2 ${c < 0 ? '-' : '+'} ${Math.abs(c)}$<br>Write $f(x ${k < 0 ? '-' : '+'} ${Math.abs(k)})$ in the form $x^2 + bx + c$.`,
      answer: `$${ans}$`,
      distractors: uniq(dist.map((t) => `$${t}$`), `$${ans}$`),
      solution: [
        `Replace $x$ with $(x ${k < 0 ? '-' : '+'} ${Math.abs(k)})$: $f(x ${k < 0 ? '-' : '+'} ${Math.abs(k)}) = (x ${k < 0 ? '-' : '+'} ${Math.abs(k)})^2 ${c < 0 ? '-' : '+'} ${Math.abs(c)}$`,
        `$(x ${k < 0 ? '-' : '+'} ${Math.abs(k)})^2 = ${qx(1, 2 * k, k * k)}$ (not $x^2 + ${k * k}$)`,
        `Answer: $${ans}$`,
      ],
    };
  }
  if (mode === 'one') {
    const inner = chance(rng) ? { tex: `${m}x`, a: m, b: 0 } : { tex: `x ${s < 0 ? '-' : '+'} ${Math.abs(s)}`, a: 1, b: s };
    const A = a1 * inner.a; const B = a1 * inner.b + b1;
    const ans = lin(A, B);
    const dist = [lin(a1 * inner.a, b1 + inner.b), lin(a1, b1 * inner.a + inner.b), lin(A, b1), lin(a1 + inner.a, b1 + inner.b), lin(A, B + inner.b), inner.a !== 1 ? lin(a1 * inner.a, b1 * inner.a) : lin(a1, B)];
    return {
      prompt: `$f(x) = ${lin(a1, b1)}$<br>Write an expression for $f(${inner.tex})$. Simplify your answer.`,
      answer: `$${ans}$`,
      distractors: uniq(dist.filter((t) => t !== ans).map((t) => `$${t}$`), `$${ans}$`),
      typed: { kind: 'text', accept: linAccept(A, B, 'x') },
      solution: [
        `Replace every $x$ in $f(x)$ with $(${inner.tex})$.`,
        `$f(${inner.tex}) = ${a1 === 1 ? '' : a1 === -1 ? '-' : a1}(${inner.tex}) ${b1 < 0 ? '-' : '+'} ${Math.abs(b1)}$`,
        `Expand and simplify: $${ans}$`,
        `Answer: $${ans}$`,
      ],
    };
  }
  // f(mx) + g(x + s)
  const A = a1 * m + a2; const B = b1 + a2 * s + b2;
  const ans = lin(A, B);
  const dist = [lin(a1 + a2, b1 + b2 + s), lin(a1 * m + a2, b1 + b2 + s), lin(a1 * m + a2, b1 + b2), lin(m * (a1 + a2), b1 + b2 + a2 * s), lin(A, B - 2 * a2 * s), lin(a1 * m + a2 * m, B)];
  return {
    prompt: `$f(x) = ${lin(a1, b1)}$ and $g(x) = ${lin(a2, b2)}$<br>Simplify $f(${m}x) + g(x ${s < 0 ? '-' : '+'} ${Math.abs(s)})$.`,
    answer: `$${ans}$`,
    distractors: uniq(dist.filter((t) => t !== ans).map((t) => `$${t}$`), `$${ans}$`),
    typed: { kind: 'text', accept: linAccept(A, B, 'x') },
    solution: [
      `$f(${m}x) = ${lin(a1 * m, b1)}$ (replace $x$ with $${m}x$).`,
      `$g(x ${s < 0 ? '-' : '+'} ${Math.abs(s)}) = ${a2}(x ${s < 0 ? '-' : '+'} ${Math.abs(s)}) ${b2 < 0 ? '-' : '+'} ${Math.abs(b2)} = ${lin(a2, a2 * s + b2)}$`,
      `Add: $${lin(a1 * m, b1)} + ${a2 * s + b2 < 0 || a2 < 0 ? `(${lin(a2, a2 * s + b2)})` : lin(a2, a2 * s + b2)} = ${ans}$`,
      `Answer: $${ans}$`,
    ],
  };
}, { title: 'Expressions in function notation' });

/* ================================================================== */
/* gr-composite-inverse                                                */
/* ================================================================== */

function pairFns(rng, d) {
  const L = () => { const a = nz(rng, -5, 6); const b = nz(rng, -9, 9); return { tex: lin(a, b), f: (x) => F(x).mul(a).add(b), a, b, kind: 'lin' }; };
  const Q = () => { const c = nz(rng, -6, 6); return { tex: `x^2 ${c < 0 ? '-' : '+'} ${Math.abs(c)}`, f: (x) => F(x).mul(x).add(c), c, kind: 'sq' }; };
  if (d === 'easy') return [L(), L()];
  return shuffle(rng, [L(), d === 'hard' ? Q() : L()]);
}

export const ciCompositeValue = G('gr-ci-composite-value', 'gr-composite-inverse', (rng, d) => {
  const [f, g] = pairFns(rng, d);
  const x = nz(rng, -4, 5);
  const order = pick(rng, ['fg', 'gf']);
  const [outer, inner] = order === 'fg' ? [f, g] : [g, f];
  const mid = inner.f(x); const ans = outer.f(mid);
  const other = (order === 'fg' ? g : f).f((order === 'fg' ? f : g).f(x));
  const dist = [other, f.f(x).mul(g.f(x)), f.f(x).add(g.f(x)), mid, outer.f(x), ans.neg()].filter((v) => !v.eq(ans));
  return {
    prompt: `$f(x) = ${f.tex}$ and $g(x) = ${g.tex}$<br>Work out $${order}(${x})$.`,
    answer: show(ans),
    distractors: uniq(dist.map(show), show(ans)),
    typed: { kind: 'number', value: ans },
    solution: [
      `$${order}(${x})$ means $${order[0]}(${order[1]}(${x}))$: work out $${order[1]}(${x})$ <b>first</b>, then put the result into $${order[0]}$.`,
      `$${order[1]}(${x}) = ${mid.tex()}$`,
      `$${order[0]}(${mid.tex()}) = ${ans.tex()}$`,
      `Answer: $${ans.tex()}$`,
    ],
  };
}, { title: 'Evaluate a composite function' });

export const ciCompositeExpr = G('gr-ci-composite-expr', 'gr-composite-inverse', (rng, d) => {
  const mode = d === 'hard' ? pick(rng, ['sq', 'mulsq']) : 'lin';
  if (mode === 'mulsq') {
    const k = int(rng, 2, 5);
    // f(x) = kx, g(x) = x² : fg = kx², gf = k²x²
    const order = pick(rng, ['fg', 'gf']);
    const ans = order === 'fg' ? `${k}x^2` : `${k * k}x^2`;
    const dist = [order === 'fg' ? `${k * k}x^2` : `${k}x^2`, `${k}x^3`, `${k * k}x^4`, `${2 * k}x^2`, `${k}x`];
    return {
      prompt: `$f(x) = ${k}x$ and $g(x) = x^2$<br>Which is the expression for $${order}(x)$?`,
      answer: `$${ans}$`,
      distractors: uniq(dist.map((t) => `$${t}$`), `$${ans}$`),
      solution: [
        `$${order}(x) = ${order[0]}(${order[1]}(x))$: do $${order[1]}$ first.`,
        order === 'fg' ? `$g(x) = x^2$, then $f(x^2) = ${k}x^2$.` : `$f(x) = ${k}x$, then $g(${k}x) = (${k}x)^2 = ${k * k}x^2$.`,
        `Answer: $${ans}$`,
      ],
    };
  }
  if (mode === 'sq') {
    const a = nz(rng, 2, 4); const b = nz(rng, -5, 5); const c = nz(rng, -6, 6);
    // f(x) = x² + c, g(x) = ax + b. fg = (ax+b)² + c = a²x² + 2abx + b² + c
    const order = pick(rng, ['fg', 'gf']);
    const ans = order === 'fg' ? qx(a * a, 2 * a * b, b * b + c) : qx(a, 0, a * c + b);
    const dist = order === 'fg' ? [qx(a, 0, a * c + b), qx(a * a, 0, b * b + c), qx(a, 2 * a * b, b * b + c), qx(a * a, a * b, b * b + c), qx(a * a, 2 * a * b, b + c)] : [qx(a * a, 2 * a * b, b * b + c), qx(a, 0, c + b), qx(a, 0, a * c + b * a), qx(a, b, c)];
    return {
      prompt: `$f(x) = x^2 ${c < 0 ? '-' : '+'} ${Math.abs(c)}$ and $g(x) = ${lin(a, b)}$<br>Which is the expression for $${order}(x)$?`,
      answer: `$${ans}$`,
      distractors: uniq(dist.map((t) => `$${t}$`), `$${ans}$`),
      solution: [
        `$${order}(x) = ${order[0]}(${order[1]}(x))$: put $${order[1]}(x)$ into $${order[0]}$.`,
        order === 'fg' ? `$f(${lin(a, b)}) = (${lin(a, b)})^2 ${c < 0 ? '-' : '+'} ${Math.abs(c)}$` : `$g(x^2 ${c < 0 ? '-' : '+'} ${Math.abs(c)}) = ${a}(x^2 ${c < 0 ? '-' : '+'} ${Math.abs(c)}) ${b < 0 ? '-' : '+'} ${Math.abs(b)}$`,
        `Expand and simplify: $${ans}$`,
        `Answer: $${ans}$`,
      ],
    };
  }
  const a1 = nz(rng, -4, 5); const b1 = nz(rng, -8, 8); const a2 = nz(rng, -4, 5); const b2 = nz(rng, -8, 8);
  if (Math.abs(a1) === 1 || Math.abs(a2) === 1) throw new Error('r');
  const order = pick(rng, ['fg', 'gf']);
  // fg(x) = a1(a2 x + b2) + b1
  const [A, B] = order === 'fg' ? [a1 * a2, a1 * b2 + b1] : [a1 * a2, a2 * b1 + b2];
  const [A2, B2] = order === 'fg' ? [a1 * a2, a2 * b1 + b2] : [a1 * a2, a1 * b2 + b1];
  const ans = lin(A, B);
  const dist = [lin(A2, B2), lin(A, b1 + b2), a1 + a2 ? lin(a1 + a2, b1 + b2) : null, lin(A, order === 'fg' ? b2 + b1 * a1 : b1 + a2 * b2), lin(A, -B), lin(A, B + 1)].filter(Boolean);
  return {
    prompt: `$f(x) = ${lin(a1, b1)}$ and $g(x) = ${lin(a2, b2)}$<br>Find $${order}(x)$. Simplify your answer.`,
    answer: `$${ans}$`,
    distractors: uniq(dist.filter((t) => t !== ans).map((t) => `$${t}$`), `$${ans}$`),
    typed: { kind: 'text', accept: linAccept(A, B, 'x') },
    solution: [
      `$${order}(x) = ${order[0]}(${order[1]}(x))$ — replace $x$ in $${order[0]}(x)$ with the whole of $${order[1]}(x)$.`,
      order === 'fg' ? `$f(${lin(a2, b2)}) = ${a1}(${lin(a2, b2)}) ${b1 < 0 ? '-' : '+'} ${Math.abs(b1)}$` : `$g(${lin(a1, b1)}) = ${a2}(${lin(a1, b1)}) ${b2 < 0 ? '-' : '+'} ${Math.abs(b2)}$`,
      `$= ${ans}$`,
      `Answer: $${ans}$`,
    ],
  };
}, { title: 'Expression for a composite function' });

/** Inverse of f(x) = (a x + b) / c, i.e. f⁻¹(x) = (c x − b) / a, as TeX. */
function invTex(a, b, c) {
  const top = c === 1 ? `x ${b < 0 ? '+' : '-'} ${Math.abs(b)}` : `${c}x ${b < 0 ? '+' : '-'} ${Math.abs(b)}`;
  return a === 1 ? top : `\\frac{${top}}{${a}}`;
}

export const ciInverseExpr = G('gr-ci-inverse-expr', 'gr-composite-inverse', (rng, d) => {
  const a = d === 'easy' ? int(rng, 2, 6) : int(rng, 2, 7); const b = nz(rng, -9, 9);
  const c = d === 'hard' ? pick(rng, [2, 3, 4, 5]) : 1;
  if (gcd(a, c) !== 1) throw new Error('r');
  const ftex = c === 1 ? lin(a, b) : `\\frac{${lin(a, b)}}{${c}}`;
  const ans = invTex(a, b, c);
  const dist = [
    c === 1 ? `\\frac{x}{${a}} ${b < 0 ? '+' : '-'} ${Math.abs(b)}` : `\\frac{${c}x}{${a}} ${b < 0 ? '+' : '-'} ${Math.abs(b)}`, // undone in the wrong order
    c === 1 ? `\\frac{1}{${ftex}}` : `\\frac{${c}}{${lin(a, b)}}`, // reciprocal
    invTex(a, -b, c), // sign error
    c === 1 ? `\\frac{x ${b < 0 ? '-' : '+'} ${Math.abs(b)}}{${a}}` : `\\frac{x - ${b}}{${a * c}}`.replace('- -', '+ '),
    c === 1 ? `${a}x ${b < 0 ? '+' : '-'} ${Math.abs(b)}` : `\\frac{${a}x ${b < 0 ? '+' : '-'} ${Math.abs(b)}}{${c}}`,
    c === 1 ? `-${lin(a, b)}` : `\\frac{${c}x + ${a}}{${Math.abs(b)}}`,
  ];
  return {
    prompt: `$f(x) = ${ftex}$<br>Find $f^{-1}(x)$.`,
    answer: `$${ans}$`,
    distractors: uniq(dist.map((t) => `$${t}$`), `$${ans}$`),
    solution: [
      `Write $y = ${ftex}$ and rearrange to make $x$ the subject.`,
      c === 1 ? `$y ${b < 0 ? '+' : '-'} ${Math.abs(b)} = ${a}x$` : `$${c}y = ${lin(a, b)}$, so $${c}y ${b < 0 ? '+' : '-'} ${Math.abs(b)} = ${a}x$`,
      `$x = ${ans.replace(/x/g, 'y')}$, so swap $y$ for $x$: $f^{-1}(x) = ${ans}$.`,
      `Note: $f^{-1}(x)$ is the inverse function, not $\\frac{1}{f(x)}$. Answer: $${ans}$`,
    ],
  };
}, { title: 'Find an inverse function' });

export const ciInverseValue = G('gr-ci-inverse-value', 'gr-composite-inverse', (rng, d) => {
  const a = int(rng, 2, 6); const b = nz(rng, -9, 9); const c = d === 'easy' ? 1 : pick(rng, [1, 2, 3, 5]);
  const x = d === 'hard' ? frac(nz(rng, -9, 9), 2) : frac(nz(rng, -6, 9));
  const k = x.mul(a).add(b).div(c); // f(x) = k  =>  f⁻¹(k) = x
  if (k.d !== 1) throw new Error('r');
  if (c > 1 && gcd(gcd(a, Math.abs(b)), c) !== 1) throw new Error('r'); // keep f in lowest terms
  const ftex = c === 1 ? lin(a, b) : `\\frac{${lin(a, b)}}{${c}}`;
  const fk = k.mul(a).add(b).div(c);
  if (fk.eq(x)) throw new Error('r');
  const dist = [fk, frac(1).div(fk.n === 0 ? frac(99) : fk), k.sub(b).mul(a).div(c), k.mul(c).add(b).div(a), x.neg(), x.add(1)].filter((v) => v.d <= 4 && !v.eq(x));
  if (d === 'hard' && chance(rng, 0.5)) {
    // f⁻¹(k) + f(m)
    const m = frac(nz(rng, -5, 5), 2);
    const fm = m.mul(a).add(b).div(c);
    const tot = x.add(fm);
    if (fm.d > 2 || tot.d > 2) throw new Error('r');
    return {
      prompt: `$f(x) = ${ftex}$<br>Work out the value of $f^{-1}(${k.tex()}) + f(${tnum(m.value())})$.`,
      answer: T(tot.value()),
      distractors: uniq([fk.add(fm), x.sub(fm), x.add(m), tot.neg(), frac(1).div(fk.n ? fk : frac(7)).add(fm)].filter((v) => v.d <= 4 && !v.eq(tot)).map((v) => T(v.d === 1 || v.d === 2 || v.d === 4 ? v.value() : v)), T(tot.value())),
      typed: { kind: 'number', value: tot },
      solution: [
        `$f^{-1}(${k.tex()})$ is the input that gives output $${k.tex()}$: solve $${ftex} = ${k.tex()}$ to get $${tnum(x.value())}$.`,
        `$f(${tnum(m.value())}) = ${tnum(fm.value())}$`,
        `Total: $${tnum(x.value())} + ${par(fm.value())} = ${tnum(tot.value())}$`,
        `Answer: $${tnum(tot.value())}$`,
      ],
    };
  }
  return {
    prompt: `$f(x) = ${ftex}$<br>Work out $f^{-1}(${k.tex()})$.`,
    answer: T(x.d === 2 ? x.value() : x),
    distractors: uniq(dist.map((v) => T(v.d === 2 || v.d === 4 ? v.value() : v)), T(x.d === 2 ? x.value() : x)),
    typed: { kind: 'number', value: x },
    solution: [
      `$f^{-1}(${k.tex()})$ is the input of $f$ that gives an output of $${k.tex()}$.`,
      `Solve $${ftex} = ${k.tex()}$: ${c === 1 ? '' : `$${lin(a, b)} = ${k.mul(c).tex()}$, `}$${a}x = ${k.mul(c).sub(b).tex()}$`,
      `$x = ${tnum(x.value())}$. (Working out $f(${k.tex()}) = ${fk.tex()}$ is the wrong direction.)`,
      `Answer: $${tnum(x.value())}$`,
    ],
  };
}, { title: 'Evaluate an inverse function' });

export const ciSolve = G('gr-ci-solve', 'gr-composite-inverse', (rng, d) => {
  const mode = d === 'easy' ? 'lin' : d === 'medium' ? pick(rng, ['lin', 'cube']) : pick(rng, ['cube', 'invEq', 'lin']);
  if (mode === 'cube') {
    const k = int(rng, 10, 30); const x = pick(rng, [-3, -2, 2, 3, 4]);
    const val = k - x ** 3;
    const opt = (v) => `$x = ${v}$`;
    return {
      prompt: `$g(x) = ${k} - x$ and $h(x) = x^3$<br>Solve $gh(x) = ${val}$.`,
      answer: opt(x),
      distractors: uniq([-x, Math.round(Math.cbrt(Math.abs(val + k))) * Math.sign(val + k), k - val, x + 1, x - 1, Math.round(Math.cbrt(Math.abs(val - k))) * Math.sign(val - k)].filter((v) => v !== x && Math.abs(v) <= 60).map(opt), opt(x)),
      typed: { kind: 'number', value: x },
      solution: [`$gh(x) = g(h(x)) = g(x^3) = ${k} - x^3$.`, `$${k} - x^3 = ${val}$, so $x^3 = ${k - val}$.`, `$x = \\sqrt[3]{${k - val}} = ${x}$`, `Answer: $x = ${x}$`],
    };
  }
  if (mode === 'invEq') {
    // f(x) = a x + b ; solve f(x) = f⁻¹(x): a x + b = (x − b)/a → a²x + ab = x − b → x(a² − 1) = −b(a + 1) → x = −b/(a − 1)
    const a = int(rng, 2, 5); const b = nz(rng, -9, 9);
    const x = frac(-b, a - 1);
    if (x.d !== 1) throw new Error('r');
    return {
      prompt: `$f(x) = ${lin(a, b)}$<br>Solve $f(x) = f^{-1}(x)$.`,
      answer: T(x),
      distractors: uniq([x.neg(), frac(b, a + 1), frac(-b, a + 1), frac(b), x.add(1)].filter((v) => v.d <= 3 && !v.eq(x)).map(T), T(x)),
      typed: { kind: 'number', value: x },
      solution: [
        `$f^{-1}(x) = \\frac{x ${b < 0 ? '+' : '-'} ${Math.abs(b)}}{${a}}$`,
        `$${lin(a, b)} = \\frac{x ${b < 0 ? '+' : '-'} ${Math.abs(b)}}{${a}}$; multiply by $${a}$: $${lin(a * a, a * b)} = ${lin(1, -b)}$`,
        `$${a * a - 1}x = ${-b - a * b}$, so $x = ${x.tex()}$`,
        `Answer: $x = ${x.tex()}$`,
      ],
    };
  }
  const a1 = nz(rng, 2, 5); const b1 = nz(rng, -8, 8); const a2 = nz(rng, 2, 4); const b2 = nz(rng, -6, 6);
  const order = pick(rng, ['fg', 'gf']);
  const x = nz(rng, -5, 6);
  const fg = (t) => (order === 'fg' ? a1 * (a2 * t + b2) + b1 : a2 * (a1 * t + b1) + b2);
  const k = fg(x);
  const other = (t) => (order === 'fg' ? a2 * (a1 * t + b1) + b2 : a1 * (a2 * t + b2) + b1);
  const A = order === 'fg' ? a1 * a2 : a1 * a2; const B = fg(0);
  const wrongX = (k - other(0)) / A;
  return {
    prompt: `$f(x) = ${lin(a1, b1)}$ and $g(x) = ${lin(a2, b2)}$<br>Solve $${order}(x) = ${k}$.`,
    answer: `$x = ${x}$`,
    distractors: uniq([wrongX, -x, fg(k), x + 1, (k - b1 - b2) / (a1 + a2), x - 1].filter((v) => Number.isInteger(v) && v !== x && Math.abs(v) <= 60).map((v) => `$x = ${v}$`), `$x = ${x}$`),
    typed: { kind: 'number', value: x },
    solution: [
      `Find $${order}(x)$ first: $${order}(x) = ${lin(A, B)}$.`,
      `$${lin(A, B)} = ${k}$, so $${A}x = ${k - B}$.`,
      `$x = ${x}$`,
      `Answer: $x = ${x}$`,
    ],
  };
}, { title: 'Solve equations with composite and inverse functions' });

export const functionGenerators = [
  fmOutput, fmInput, fmExpression, fmSameOutput,
  fnEvaluate, fnSolve, fnConstants, fnExpression,
  ciCompositeValue, ciCompositeExpr, ciInverseExpr, ciInverseValue, ciSolve,
];

void Frac;
