// Question generators for the Number module. See docs/GENERATOR_GUIDELINES.md.
import {
  gen, pick, int, sample, shuffle, size, gcd, lcm, primeFactors, largestSquareFactor, names, num, tnum, money,
} from '../../core.js';

/* ------------------------------------------------------------------ */
/* Exemplar 1: a word-problem archetype with many genuinely different   */
/* contexts. The context decides whether HCF or LCM is needed.          */
/* ------------------------------------------------------------------ */

// Each template receives (a, b, rng) and returns { prompt, unit } for an LCM situation.
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
  return {
    prompt: ctx.prompt,
    answer: fmtA(answer),
    // Misconceptions: the other one of HCF/LCM, the plain product, a smaller common multiple/factor.
    distractors: [fmtA(wantLcm ? hcf : l), fmtA(a * b), fmtA(Math.max(a, b)), fmtA(wantLcm ? l * 2 : hcf / 2), fmtA(Math.min(a, b)), fmtA(answer + g)].filter((t) => !/\.\d/.test(t)),
    typed: { kind: 'number', value: answer },
    solution: wantLcm ? [
      `Things happen "together again" at a <b>common multiple</b> of ${num(a)} and ${num(b)}; we want the <b>lowest</b> one, the LCM.`,
      `Prime factors: $${num(a)} = ${pf(a)}$ and $${num(b)} = ${pf(b)}$.`,
      `Multiples of ${num(Math.max(a, b))}: ${[1, 2, 3, 4, 5, 6].map((m) => num(m * Math.max(a, b))).slice(0, Math.min(6, l / Math.max(a, b) + 1)).join(', ')} … the first that ${num(Math.min(a, b))} also divides is ${num(l)}.`,
      `Answer: <b>${fmtA(l)}</b>.`,
    ] : [
      `Splitting both amounts into equal groups with nothing left over needs a <b>common factor</b>; the largest is the HCF.`,
      `Prime factors: $${num(a)} = ${pf(a)}$ and $${num(b)} = ${pf(b)}$.`,
      `Multiply the primes they share: HCF = ${pf(hcf) || '1'} = ${num(hcf)}.`,
      `Answer: <b>${fmtA(hcf)}</b>.`,
    ],
  };
});

/* ------------------------------------------------------------------ */
/* Exemplar 2: a symbolic archetype with TeX and misconception options. */
/* ------------------------------------------------------------------ */

export const simplifySurd = gen('num-surds-simplify-basic', 'num-surds-simplify', (rng, d) => {
  const k = size(d, pick(rng, [2, 3]), pick(rng, [2, 3, 4, 5]), pick(rng, [4, 5, 6, 7, 10]));
  const inner = pick(rng, size(d, [2, 3, 5], [2, 3, 5, 6, 7], [2, 3, 5, 6, 7, 10, 11]));
  const n = k * k * inner;
  const coef = d === 'hard' ? pick(rng, [2, 3]) : 1;
  const ans = `$${coef * k}\\sqrt{${inner}}$`;
  const expr = coef === 1 ? `\\sqrt{${n}}` : `${coef}\\sqrt{${n}}`;
  // Plausible slips: halving instead of square-rooting, forgetting the coefficient, the wrong split.
  const other = largestSquareFactor(n) !== k ? largestSquareFactor(n) : 1;
  return {
    prompt: `Write $${expr}$ in the form $a\\sqrt{b}$, where $a$ and $b$ are integers and $b$ is as small as possible.`,
    answer: ans,
    distractors: [
      `$${coef * k * k}\\sqrt{${inner}}$`, `$${coef * inner}\\sqrt{${k * k}}$`, `$${k}\\sqrt{${inner}}$`,
      `$${coef * (k * k) / 2}\\sqrt{${inner}}$`, `$${coef * 2}\\sqrt{${n / 4}}$`, `$${coef * k}\\sqrt{${inner * 2}}$`, `$${coef * other}\\sqrt{${n / (other * other)}}$`,
      `$${inner}\\sqrt{${k}}$`, `$${coef * k + 1}\\sqrt{${inner}}$`, `$${coef * k - 1}\\sqrt{${inner}}$`, `$${coef * k}\\sqrt{${inner + k}}$`,
      `$${coef * (k + 2)}\\sqrt{${inner}}$`, `$${coef * k * inner}$`,
    ].filter((t) => !/\.|sqrt\{1\}|^\$1\\sqrt/.test(t)),
    solution: [
      `Look for the largest <b>square number</b> that divides ${n}: it is ${k * k}.`,
      `$\\sqrt{${n}} = \\sqrt{${k * k} \\times ${inner}} = \\sqrt{${k * k}} \\times \\sqrt{${inner}} = ${k}\\sqrt{${inner}}$`,
      ...(coef > 1 ? [`Multiply by the ${coef} in front: $${coef} \\times ${k}\\sqrt{${inner}} = ${coef * k}\\sqrt{${inner}}$`] : []),
      `Answer: ${ans}`,
    ],
  };
});

export const generators = [hcfLcmProblems, simplifySurd];

// Silence unused-import warnings for helpers exemplars may not use.
void [shuffle, tnum, money, names];
