// A tiny arithmetic expression evaluator used by the order-of-operations generators.
// Expressions are written with ASCII operators: "121 - (13 - 5 * 2)^2", "60 / 2 + 4".
// Modes model real misconceptions:
//   'bidmas' – correct order of operations;
//   'ltr'    – brackets and powers first, then everything strictly left to right;
//   'noPow'  – correct order but x^2 read as x × 2.

function tokenize(s) {
  const out = [];
  const re = /\s*(\d+\.?\d*|[-+*/^()])/g;
  let m;
  while ((m = re.exec(s))) out.push(m[1]);
  return out;
}

function parseGroup(tokens, i) {
  // returns [items, nextIndex]; items alternate operand, operator, operand...
  const items = [];
  while (i < tokens.length && tokens[i] !== ')') {
    const tk = tokens[i];
    if (tk === '(') {
      const [inner, j] = parseGroup(tokens, i + 1);
      items.push({ group: inner });
      i = j + 1;
    } else if (/^[-+*/^]$/.test(tk)) {
      items.push(tk); i += 1;
    } else { items.push(Number(tk)); i += 1; }
  }
  return [items, i];
}

let nonInteger = false;
const apply = (a, op, b) => {
  const r = applyRaw(a, op, b);
  if (!Number.isInteger(r)) nonInteger = true;
  return r;
};
const applyRaw = (a, op, b) => {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '*': return a * b;
    case '/': return a / b;
    case '^': return a ** b;
    default: throw new Error(`bad op ${op}`);
  }
};

function evalItems(items, mode) {
  // resolve operands
  let seq = items.map((it) => (typeof it === 'object' && it.group ? evalItems(it.group, mode) : it));
  // powers first (right to left is fine for single powers)
  const powOp = mode === 'noPow' ? '*' : '^';
  for (let k = seq.length - 2; k > 0; k -= 2) {
    if (seq[k] === '^') seq.splice(k - 1, 3, apply(seq[k - 1], powOp, seq[k + 1]));
  }
  if (mode === 'ltr') {
    let acc = seq[0];
    for (let k = 1; k < seq.length; k += 2) acc = apply(acc, seq[k], seq[k + 1]);
    return acc;
  }
  // × and ÷ left to right, then + and − left to right
  for (const ops of [['*', '/'], ['+', '-']]) {
    const next = [seq[0]];
    for (let k = 1; k < seq.length; k += 2) {
      if (ops.includes(seq[k])) next.push(apply(next.pop(), seq[k], seq[k + 1]));
      else next.push(seq[k], seq[k + 1]);
    }
    seq = next;
  }
  return seq[0];
}

export function evaluate(expr, mode = 'bidmas') {
  const [items] = parseGroup(tokenize(expr), 0);
  return evalItems(items, mode);
}

/** TeX rendering: * -> \times, / -> \div, ^2 -> ^{2}. */
export function exprTex(expr) {
  return expr
    .replace(/\s+/g, ' ')
    .replace(/\*/g, '\\times')
    .replace(/\//g, '\\div')
    .replace(/\^(\d+)/g, '^{$1}')
    .replace(/(\d)(\d{3})(?!\d)/g, '$1{,}$2')
    .replace(/\s*\^/g, '^')
    .trim();
}

/** All ways of inserting one pair of brackets around 2+ consecutive numbers (not the whole thing). */
export function bracketings(nums, ops) {
  const out = [];
  const n = nums.length;
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      if (i === 0 && j === n - 1) continue;
      let s = '';
      for (let k = 0; k < n; k += 1) {
        if (k === i) s += '(';
        s += nums[k];
        if (k === j) s += ')';
        if (k < n - 1) s += ` ${ops[k]} `;
      }
      out.push(s);
    }
  }
  return out;
}

/** True when every intermediate result (correct order of operations) is a whole number. */
export function integerSteps(expr) {
  nonInteger = false;
  const v = evaluate(expr);
  return Number.isInteger(v) && !nonInteger;
}
