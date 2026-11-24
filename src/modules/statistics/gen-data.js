// Statistics generators: data and sampling, stem-and-leaf, scatter graphs, frequency polygons, capture–recapture.
import {
  pick, int, size, shuffle, sample, num, tnum, money, roundTo, tidy, table, chance, frac, ordinal, names,
} from '../../core.js';
import {
  sgen, fracDistractors, sum, mean, sorted, median, modeOf, rangeOf, numDistractors, randInts, isClean, peakedFreqs,
} from './util.js';
import {
  stemLeaf, stemLeafBack, scatterGraph, scatterQuartet, frequencyPolygon,
} from './charts.js';
import { GROUPED_CTX, classTex } from './gen-averages.js';

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/* ------------------------------------------------------------------ */
/* Data and sampling                                                    */
/* ------------------------------------------------------------------ */

const DATA_ITEMS = {
  qual: ['favourite colour', 'type of car', 'eye colour', 'country of birth', 'favourite subject', 'hair colour', 'make of mobile phone', 'way of travelling to school', 'favourite flavour of crisps', 'blood group', 'breed of dog', 'football team supported'],
  disc: ['number of brothers and sisters', 'shoe size', 'number of goals scored in a match', 'number of pets', 'number of cars in a car park', 'number of letters in a name', 'score on a dice', 'number of people in a queue', 'number of text messages sent in a day', 'number of rooms in a house', 'number of books read last month', 'number of tickets sold'],
  cont: ['height of a student', 'mass of a parcel', 'time taken to run 100 m', 'temperature at noon', 'length of a leaf', 'volume of water in a bottle', 'distance from home to school', 'speed of a car', 'arm span of an adult', 'amount of rainfall in a day', 'time spent on homework', 'mass of a newborn baby'],
};
const TYPE_OPT = { qual: 'Qualitative (categorical)', disc: 'Quantitative and discrete', cont: 'Quantitative and continuous' };
const SOURCE = [
  { s: (n) => `${n} counts the cars passing her house herself.`, a: 'primary' },
  { s: (n) => `${n} uses rainfall figures published on the Met Office website.`, a: 'secondary' },
  { s: (n) => `${n} hands out his own questionnaire to students in his class.`, a: 'primary' },
  { s: (n) => `${n} uses population figures from the last census.`, a: 'secondary' },
  { s: (n) => `${n} times her friends running 100 m with a stopwatch.`, a: 'primary' },
  { s: (n) => `${n} copies football results from a newspaper.`, a: 'secondary' },
  { s: (n) => `${n} measures the heights of the plants in his garden.`, a: 'primary' },
  { s: (n) => `${n} uses a table of house prices from an estate agent's report.`, a: 'secondary' },
];
export const dataTypes = sgen('stat-data-types', 'stat-sampling', (rng, d) => {
  if (d === 'hard' && chance(rng, 0.5)) {
    const it = pick(rng, SOURCE); const n = names(rng, 1)[0];
    const ans = it.a === 'primary' ? 'Primary data: collected by the person using it' : 'Secondary data: collected by someone else';
    const other = it.a === 'primary' ? 'Secondary data: collected by someone else' : 'Primary data: collected by the person using it';
    return {
      prompt: `${it.s(n)}<br>What type of data is this?`,
      answer: ans,
      distractors: [other],
      count: 2,
      keepOrder: true,
      solution: ['<b>Primary</b> data is collected first-hand by the person who will use it.', '<b>Secondary</b> data has already been collected by someone else (websites, newspapers, official records).', `Answer: ${ans}`],
    };
  }
  const kind = pick(rng, size(d, ['qual', 'disc', 'cont'], ['disc', 'cont', 'cont', 'qual'], ['disc', 'cont']));
  const item = pick(rng, DATA_ITEMS[kind]);
  return {
    prompt: `What type of data is the <b>${item}</b>?`,
    answer: TYPE_OPT[kind],
    distractors: Object.values(TYPE_OPT).filter((o) => o !== TYPE_OPT[kind]),
    count: 3,
    keepOrder: true,
    solution: [
      '<b>Qualitative</b> data is described in words (categories). <b>Quantitative</b> data is numbers.',
      '<b>Discrete</b> data can only take certain values, usually because it is counted (you can\'t have 2.5 pets).',
      '<b>Continuous</b> data is measured and can take any value in a range (height, mass, time).',
      `Answer: ${TYPE_OPT[kind]}`,
    ],
  };
}, { title: 'Types of data' });

const BIAS_CTX = [
  { s: 'A council wants to know how often people in a town exercise. It asks people leaving a gym.', a: 'People leaving a gym are likely to exercise more than most people in the town', w: ['The gym is too far from the town centre', 'People should have been asked their age'] },
  { s: 'A school wants to know what all its students think of the canteen. It asks 50 students in Year 7.', a: 'Only Year 7 students were asked, so other year groups are not represented', w: ['50 students is too many to ask', 'The canteen might be closed'] },
  { s: 'A bus company wants to know how satisfied residents are with buses. It asks people waiting at a bus stop.', a: 'Only people who use the buses were asked, not all residents', w: ['People at a bus stop are in a hurry', 'The survey should be done online'] },
  { s: 'Jamal wants to find the most popular football team in his town. He asks fans outside a stadium on a match day.', a: 'Most people outside the stadium will support the same team', w: ['Football fans are too noisy', 'He should ask only adults'] },
  { s: 'A TV company wants to know how much TV adults watch. It phones home landlines at 11 am on weekdays.', a: 'Only people at home during the working day were asked', w: ['Landlines are too expensive', 'The questions were not written down'] },
  { s: 'A teacher wants to know why students are late. She asks the first 10 students to arrive at school one morning.', a: 'The first students to arrive are the least likely to be late', w: ['10 is too many students', 'She should ask the head teacher instead'] },
  { s: 'A newspaper wants to know how many books people read. It asks people in a library.', a: 'People in a library are likely to read more books than average', w: ['Libraries are too quiet for a survey', 'People in a library are always students'] },
  { s: 'A company wants to know how much time people spend online. It puts its survey on a website.', a: 'Only people who use the internet can answer an online survey', w: ['Online surveys are always too long', 'The website might be slow'] },
  { s: 'Nadia wants to know the favourite sport of students in her school of 1,200. She asks her 5 best friends.', a: 'The sample is too small and her friends may have similar views', w: ['Her friends are too young', 'She should have asked teachers'] },
  { s: 'A restaurant chain wants to know how many people in the UK are vegetarian. It asks diners at one of its vegetarian restaurants.', a: 'Diners at a vegetarian restaurant are more likely to be vegetarian', w: ['The restaurant is too busy', 'Diners do not like answering questions'] },
  { s: 'To find the favourite sport of all students in a mixed school, Ravi asks 40 boys in Year 10.', a: 'Only boys were asked, and only from one year group', w: ['40 is too many', 'He asked during lunch'] },
  { s: 'A council wants to know if the town needs a new swimming pool. It asks people at the existing swimming pool.', a: 'People at a swimming pool are more likely to want a new pool', w: ['The swimmers were wet', 'The pool is open every day'] },
  { s: 'A survey about traffic in a town is carried out only between 8 am and 9 am.', a: 'This is rush hour, so traffic will be heavier than at other times', w: ['It is too early to count cars', 'Cars are hard to count'] },
  { s: 'A shop wants to know what its customers think of its prices. It asks people outside a rival shop.', a: 'People outside a rival shop may not be its customers', w: ['The rival shop is cheaper', 'The questions were too short'] },
];
const BIAS_GENERIC = ['The sample is too large to be useful', 'Every person in the population was asked', 'The people were chosen at random from the whole population'];
export const samplingBias = sgen('stat-sampling-bias', 'stat-sampling', (rng) => {
  const c = pick(rng, BIAS_CTX);
  return {
    prompt: `${c.s}<br>${pick(rng, ['Why is this sample likely to be biased?', 'Give the best reason why the results may not represent the whole population.', 'Why might this survey give misleading results?'])}`,
    answer: c.a,
    distractors: shuffle(rng, [...c.w, ...BIAS_GENERIC.filter((g) => !(c.a.includes('too small') && g.includes('too large')))]),
    count: 4,
    solution: ['A sample is <b>biased</b> if some groups of the population are more (or less) likely to be chosen, so it does not represent the whole population.', `Here: ${c.a.charAt(0).toLowerCase()}${c.a.slice(1)}.`, `Answer: ${c.a}`],
  };
}, { title: 'Why is a sample biased?', word: true });

const QUEST_CTX = [
  { q: 'How many hours of TV do you watch each week?', unit: 'hours', max: 20, w: 5 },
  { q: 'How much pocket money do you get each week?', unit: '£', max: 12, w: 3 },
  { q: 'How many books did you read last month?', unit: 'books', max: 8, w: 2 },
  { q: 'How many minutes do you spend travelling to school?', unit: 'minutes', max: 40, w: 10 },
  { q: 'How many hours of sleep did you get last night?', unit: 'hours', max: 12, w: 3, start: 4 },
  { q: 'How many cups of coffee do you drink each day?', unit: 'cups', max: 6, w: 2 },
];
export const samplingQuestionnaire = sgen('stat-sampling-questionnaire', 'stat-sampling', (rng, d) => {
  const fault = pick(rng, size(d, ['overlap', 'gap', 'leading', 'vague'], ['overlap', 'gap', 'top', 'zero', 'leading'], ['overlap', 'gap', 'top', 'zero', 'vague']));
  const OPT = {
    overlap: 'The response boxes overlap',
    gap: 'Some possible answers are missing between the boxes',
    top: 'There is no box for the largest answers',
    zero: 'There is no box for an answer of zero',
    leading: 'It is a leading question',
    vague: 'The question has no time period, so answers will mean different things',
    long: 'There are too many response boxes',
  };
  let question; let boxes;
  if (fault === 'leading' || fault === 'vague') {
    const LEAD = [
      ['Don\'t you agree that the school day is too long?', ['Yes', 'No', 'Not sure']],
      ['Most people think the new park is a great idea. Do you agree?', ['Yes', 'No', 'Not sure']],
      ['Don\'t you think that school dinners should be cheaper?', ['Yes', 'No', 'Don\'t know']],
      ['Do you agree that our town needs a better bus service?', ['Yes', 'No', 'Not sure']],
    ];
    const VAGUE = [
      ['How much exercise do you do?', ['None', '1–2 hours', '3–4 hours', 'More than 4 hours']],
      ['How many times do you go to the cinema?', ['0', '1–2', '3–5', 'More than 5']],
      ['How much money do you spend on snacks?', ['£0', '£0.01–£5', '£5.01–£10', 'More than £10']],
    ];
    [question, boxes] = pick(rng, fault === 'leading' ? LEAD : VAGUE);
  } else {
    const c = pick(rng, QUEST_CTX); const s = c.start ?? 0; const w = c.w;
    const fm = (v) => (c.unit === '£' ? `£${v}` : `${v}`);
    question = c.q;
    const n = 3;
    const good = (i) => `${fm(s + i * w + 1)}–${fm(s + (i + 1) * w)}`; // 1–5, 6–10, 11–15 …
    const first = c.start ? `Less than ${fm(s + 1)}` : fm(0);
    if (fault === 'overlap') boxes = [first, ...Array.from({ length: n }, (_, i) => `${fm(s + i * w)}–${fm(s + (i + 1) * w)}`).map((b, i) => (i === 0 ? `${fm(s + 1)}–${fm(s + w)}` : b)), `More than ${fm(s + n * w)}`];
    else if (fault === 'gap') boxes = [first, ...Array.from({ length: n }, (_, i) => `${fm(s + i * w + 1 + (i ? 1 : 0))}–${fm(s + (i + 1) * w)}`), `More than ${fm(s + n * w)}`];
    else if (fault === 'top') boxes = [first, ...Array.from({ length: n }, (_, i) => good(i))];
    else boxes = [...Array.from({ length: n }, (_, i) => good(i)), `More than ${fm(s + n * w)}`];
  }
  const boxHtml = `<div style="display:flex;flex-wrap:wrap;gap:10px;margin:8px 0">${boxes.map((b) => `<span style="border:1.5px solid currentColor;padding:4px 10px;border-radius:3px">${b} ☐</span>`).join('')}</div>`;
  const ans = OPT[fault];
  return {
    prompt: `${pick(rng, [`${names(rng, 1)[0]} is writing a questionnaire. Here is one of the questions.`, 'Here is a question from a survey.', 'A student writes this question for a survey.'])}<br><b>${question}</b>${boxHtml}${pick(rng, ['What is wrong with this question?', 'Which is a criticism of this question?'])}`,
    answer: ans,
    distractors: shuffle(rng, Object.entries(OPT).filter(([k]) => k !== fault).map(([, v]) => v)),
    count: 4,
    solution: [
      'A good question is not leading, has a clear time period, and has response boxes that do not overlap, have no gaps and cover every possible answer.',
      `Check the boxes: ${boxes.join(', ')}.`,
      `Answer: ${ans}`,
    ],
  };
}, { title: 'What is wrong with this questionnaire question?' });

const EST_CTX = [
  { s: (n, k) => `A random sample of ${n} students at a school were asked how they travel to school. ${k} of them said they walk.`, pop: (N) => `There are ${num(N)} students at the school.`, ask: 'Estimate how many students at the school walk.', popR: [600, 2000] },
  { s: (n, k) => `A factory checks a sample of ${n} light bulbs and finds that ${k} are faulty.`, pop: (N) => `The factory makes ${num(N)} light bulbs each day.`, ask: 'Estimate the number of faulty bulbs made each day.', popR: [2000, 20000] },
  { s: (n, k) => `In a survey of ${n} people at a football stadium, ${k} said that a family area is very important.`, pop: (N) => `The crowd at the stadium was ${num(N)}.`, ask: 'Assuming the sample is representative, estimate how many people in the crowd think a family area is very important.', popR: [10000, 40000] },
  { s: (n, k) => `A gardener plants ${n} seeds from a large bag and ${k} of them grow.`, pop: (N) => `The bag contained ${num(N)} seeds altogether.`, ask: 'Estimate how many of all the seeds in the bag would grow.', popR: [500, 3000] },
  { s: (n, k) => `A random sample of ${n} voters in a town were asked who they would vote for. ${k} said they would vote for Ms Patel.`, pop: (N) => `There are ${num(N)} voters in the town.`, ask: 'Estimate how many voters in the town would vote for Ms Patel.', popR: [5000, 50000] },
  { s: (n, k) => `Some apples from an orchard are checked. In a sample of ${n} apples, ${k} were bruised.`, pop: (N) => `The orchard produced ${num(N)} apples this year.`, ask: 'Estimate how many apples were bruised.', popR: [2000, 30000] },
  { s: (n, k) => `A sample of ${n} cars at a car park were checked. ${k} were electric.`, pop: (N) => `There are ${num(N)} cars in the car park.`, ask: 'Estimate how many cars in the car park are electric.', popR: [300, 1500] },
  { s: (n, k) => `In a sample of ${n} fish from a lake, ${k} were trout.`, pop: (N) => `There are thought to be ${num(N)} fish in the lake.`, ask: 'Estimate the number of trout in the lake.', popR: [500, 5000] },
  { s: (n, k) => `A cinema asked ${n} of its customers if they bought popcorn. ${k} said yes.`, pop: (N) => `${num(N)} people visited the cinema last month.`, ask: 'Estimate how many of last month\'s visitors bought popcorn.', popR: [3000, 20000] },
  { s: (n, k) => `A random sample of ${n} households in a city found that ${k} have a dog.`, pop: (N) => `There are ${num(N)} households in the city.`, ask: 'Estimate the number of households in the city with a dog.', popR: [20000, 90000] },
  { s: (n, k) => `A sample of ${n} eggs from a farm were checked, and ${k} had double yolks.`, pop: (N) => `The farm produces ${num(N)} eggs each week.`, ask: 'Estimate the number of double-yolk eggs produced each week.', popR: [5000, 25000] },
  { s: (n, k) => `${n} students in Year 11 were picked at random and asked if they wanted a prom. ${k} said yes.`, pop: (N) => `There are ${num(N)} students in Year 11.`, ask: 'Estimate how many students in Year 11 want a prom.', popR: [150, 400] },
  { s: (n, k) => `A sample of ${n} bolts from a machine are measured. ${k} are too long.`, pop: (N) => `The machine makes ${num(N)} bolts an hour.`, ask: 'Estimate how many bolts made in an hour are too long.', popR: [1000, 8000] },
];
export const samplingEstimate = sgen('stat-sampling-estimate', 'stat-sampling', (rng, d) => {
  const c = pick(rng, EST_CTX);
  const n = pick(rng, size(d, [10, 20, 50, 100], [20, 25, 40, 50, 80], [30, 40, 60, 75, 120, 150]));
  const k = int(rng, Math.max(1, Math.round(n * 0.1)), Math.round(n * 0.8));
  const fr = frac(k, n);
  // population a multiple of the reduced denominator
  const lo = Math.ceil(c.popR[0] / fr.d); const hi = Math.floor(c.popR[1] / fr.d);
  if (hi < lo) throw new Error('pop');
  const step = c.popR[1] > 10000 ? 50 : c.popR[1] > 1000 ? 10 : 1;
  let N = fr.d * int(rng, lo, hi);
  N = Math.round(N / (fr.d * step)) * fr.d * step;
  if (N < c.popR[0] / 2 || N <= 0) throw new Error('pop');
  const ans = (N * k) / n;
  if (!Number.isInteger(ans)) throw new Error('not integer');
  return {
    prompt: `${c.s(n, k)}<br>${c.pop(N)}<br>${c.ask}`,
    answer: num(ans),
    distractors: numDistractors(ans, [(N * (n - k)) / n, N / k, N * k / 100, N - k, N / n, (N / n) * (k + 1), ans * 2], { integer: true }),
    typed: { kind: 'number', value: ans },
    calculator: d === 'hard',
    solution: [
      `In the sample, $\\frac{${k}}{${n}}${fr.d !== n ? ` = ${fr.tex()}` : ''}$ have this property.`,
      'Assume the same fraction holds for the whole population.',
      `$${fr.tex()} \\times ${tnum(N)} = ${tnum(ans)}$`,
      `Answer: ${num(ans)}`,
    ],
  };
}, { title: 'Estimate a population count from a sample', word: true });

/* ------------------------------------------------------------------ */
/* Stem-and-leaf diagrams                                               */
/* ------------------------------------------------------------------ */

const STEM_CTX = [
  { what: 'the times, in seconds, that some students took to solve a puzzle', unit: 'seconds', lo: 12, hi: 58, kind: 'int' },
  { what: 'the marks of some students in a test', unit: 'marks', lo: 21, hi: 79, kind: 'int' },
  { what: 'the pulse rates, in beats per minute, of some adults', unit: 'bpm', lo: 52, hi: 98, kind: 'int' },
  { what: 'the ages of the people at a yoga class', unit: 'years', lo: 18, hi: 67, kind: 'int' },
  { what: 'the masses, in kg, of some dogs at a dog show', unit: 'kg', lo: 11, hi: 47, kind: 'int' },
  { what: 'the numbers of words in some text messages', unit: 'words', lo: 5, hi: 49, kind: 'int' },
  { what: 'the times, in seconds, of some runners in a 100 m race', unit: 'seconds', lo: 110, hi: 169, kind: 'dec' },
  { what: 'the lengths, in cm, of some leaves', unit: 'cm', lo: 32, hi: 89, kind: 'dec' },
  { what: 'the heights, in cm, of some students', unit: 'cm', lo: 141, hi: 186, kind: 'big' },
  { what: 'the numbers of points scored by a basketball team in its games', unit: 'points', lo: 62, hi: 118, kind: 'big' },
];
function stemData(rng, ctx, n) {
  const vals = randInts(rng, n, ctx.lo, ctx.hi);
  const scale = ctx.kind === 'dec' ? 10 : 1;
  const stems = []; const lo = Math.floor(Math.min(...vals) / 10); const hi = Math.floor(Math.max(...vals) / 10);
  for (let s = lo; s <= hi; s += 1) stems.push({ stem: s, leaves: sorted(vals.filter((v) => Math.floor(v / 10) === s).map((v) => v % 10)) });
  const real = sorted(vals).map((v) => tidy(v / scale));
  const ex = stems.find((s) => s.leaves.length) || stems[0];
  const exV = ex.stem * 10 + (ex.leaves[0] ?? 0);
  const unitTxt = ['marks', 'words', 'points', 'years'].includes(ctx.unit) && ctx.unit !== 'years' ? '' : ` ${ctx.unit}`;
  const keyText = `${ex.stem} | ${ex.leaves[0] ?? 0} represents ${num(tidy(exV / scale))}${unitTxt}`;
  return { vals: real, stems, keyText, scale, fmt: (v) => `${num(v)}${unitTxt}` };
}
export const stemRead = sgen('stat-stem-read', 'stat-stem-leaf', (rng, d) => {
  const ctx = pick(rng, size(d, STEM_CTX.filter((c) => c.kind === 'int'), STEM_CTX.filter((c) => c.kind !== 'dec'), STEM_CTX));
  const n = size(d, pick(rng, [11, 13, 15]), pick(rng, [14, 15, 16, 17]), pick(rng, [16, 18, 19, 20]));
  const S = stemData(rng, ctx, n);
  const q = pick(rng, size(d, ['median', 'range', 'mode'], ['median', 'range', 'mode'], ['median', 'range']));
  const visual = stemLeaf({ rows: S.stems, keyText: S.keyText });
  const leavesAll = S.stems.flatMap((s) => s.leaves);
  if (q === 'mode') {
    const m = modeOf(S.vals);
    if (m === null) throw new Error('no mode');
    return {
      prompt: `The stem-and-leaf diagram shows ${ctx.what}.<br>What is the mode?`,
      visual, answer: S.fmt(m),
      distractors: numDistractors(m, [m % 10, S.vals.filter((v) => v === m).length, median(S.vals), Math.max(...S.vals), modeOf(leavesAll), Math.floor(m / 10) * 10], { fmt: S.fmt }),
      typed: { kind: 'number', value: m },
      solution: ['The mode is the value that appears most often: look for a repeated leaf on the same stem.', `${S.fmt(m)} appears ${S.vals.filter((v) => v === m).length} times.`, `Answer: ${S.fmt(m)}`],
    };
  }
  if (q === 'range') {
    const r = rangeOf(S.vals);
    const first = S.stems[0]; const last = S.stems[S.stems.length - 1];
    return {
      prompt: `The stem-and-leaf diagram shows ${ctx.what}.<br>Work out the range.`,
      visual, answer: S.fmt(r),
      distractors: numDistractors(r, [Math.max(...leavesAll) - Math.min(...leavesAll), (last.stem - first.stem) * 10 / S.scale, Math.max(...S.vals), last.leaves[last.leaves.length - 1] - first.leaves[0], r + 10 / S.scale, r - 1 / S.scale], { fmt: S.fmt }),
      typed: { kind: 'number', value: r },
      solution: ['Smallest value: the first leaf on the first stem. Largest: the last leaf on the last stem. Use the key!', `Smallest $= ${num(S.vals[0])}$, largest $= ${num(S.vals[n - 1])}$`, `Range $= ${num(S.vals[n - 1])} - ${num(S.vals[0])} = ${num(r)}$`, `Answer: ${S.fmt(r)}`],
    };
  }
  const med = median(S.vals);
  const pos = (n + 1) / 2;
  return {
    prompt: `The stem-and-leaf diagram shows ${ctx.what}.<br>Work out the median.`,
    visual, answer: S.fmt(med),
    distractors: numDistractors(med, [pos, isClean(mean(S.vals), 1) ? mean(S.vals) : null, median(leavesAll), S.vals[Math.floor(n / 2) + 1], S.vals[Math.floor((n - 1) / 2) - 1], (S.vals[0] + S.vals[n - 1]) / 2, S.stems[Math.floor(S.stems.length / 2)].stem * 10 / S.scale], { fmt: S.fmt }),
    typed: { kind: 'number', value: med },
    solution: [
      `There are ${n} values, already in order. The median is the ${n % 2 ? `${ordinal(pos)} value` : `mean of the ${ordinal(n / 2)} and ${ordinal(n / 2 + 1)} values`}.`,
      n % 2 ? `Counting leaves from the start, the ${ordinal(pos)} value is ${num(med)}.` : `The ${ordinal(n / 2)} and ${ordinal(n / 2 + 1)} values are ${num(S.vals[n / 2 - 1])} and ${num(S.vals[n / 2])}, so the median is ${num(med)}.`,
      `Answer: ${S.fmt(med)}`,
    ],
  };
}, { title: 'Median, mode and range from a stem-and-leaf diagram' });

export const stemCount = sgen('stat-stem-count', 'stat-stem-leaf', (rng, d) => {
  const ctx = pick(rng, STEM_CTX.filter((c) => c.kind !== 'dec'));
  const n = size(d, pick(rng, [12, 15]), pick(rng, [16, 20]), pick(rng, [20, 25]));
  const S = stemData(rng, ctx, n);
  const visual = stemLeaf({ rows: S.stems, keyText: S.keyText });
  const cut = pick(rng, S.vals.slice(3, n - 3));
  const above = S.vals.filter((v) => v > cut).length;
  const q = size(d, 'count', pick(rng, ['count', 'fraction']), pick(rng, ['percent', 'fraction']));
  if (q === 'count') {
    return {
      prompt: `The stem-and-leaf diagram shows ${ctx.what}.<br>How many values are more than ${num(cut)}?`,
      visual, answer: num(above),
      distractors: numDistractors(above, [S.vals.filter((v) => v >= cut).length, n - above, above + 1, above - 1, S.vals.filter((v) => v < cut).length + 1], { integer: true }),
      typed: { kind: 'number', value: above },
      solution: ['Count the leaves for values greater than the cut-off (not equal to it).', `Values more than ${num(cut)}: ${S.vals.filter((v) => v > cut).map((v) => num(v)).join(', ')}.`, `Answer: ${above}`],
    };
  }
  if (q === 'percent') {
    const pct = (above / n) * 100;
    if (!isClean(pct, 1)) throw new Error('pct');
    const f = (v) => `${num(v)}%`;
    return {
      prompt: `The stem-and-leaf diagram shows ${ctx.what}.<br>What percentage of the values are more than ${num(cut)}?`,
      visual, answer: f(pct),
      distractors: numDistractors(pct, [above, (S.vals.filter((v) => v >= cut).length / n) * 100, ((n - above) / n) * 100, (above / 100) * n, pct + 10], { fmt: f }),
      typed: { kind: 'number', value: pct },
      solution: [`There are ${n} values; ${above} of them are more than ${num(cut)}.`, `$\\frac{${above}}{${n}} \\times 100 = ${num(pct)}\\%$`, `Answer: ${f(pct)}`],
    };
  }
  const fr = frac(above, n);
  return {
    prompt: `The stem-and-leaf diagram shows ${ctx.what}.<br>What fraction of the values are more than ${num(cut)}? Give your answer in its simplest form.`,
    visual, answer: `$${fr.tex()}$`,
    distractors: fracDistractors(fr, [frac(above, n - above), frac(S.vals.filter((v) => v >= cut).length, n), frac(n - above, n), frac(above + 1, n), frac(above - 1, n), frac(above, 10), frac(above + 2, n), frac(above, n + 1), frac(n - above, above)]),
    solution: [`There are ${n} values; ${above} are more than ${num(cut)}.`, `$\\frac{${above}}{${n}} = ${fr.tex()}$`, `Answer: $${fr.tex()}$`],
  };
}, { title: 'Counting and proportions from a stem-and-leaf diagram' });

const BACK_CTX = [
  { what: 'the pulse rates, in beats per minute, of some people before and after exercise', L: 'Before', R: 'After', unit: 'bpm', lo: [55, 85], hi: [80, 125] },
  { what: 'the test marks of two classes', L: 'Class A', R: 'Class B', unit: 'marks', lo: [30, 79], hi: [42, 89] },
  { what: 'the ages of the members of two clubs', L: 'Club X', R: 'Club Y', unit: 'years', lo: [18, 52], hi: [25, 69] },
  { what: 'the reaction times, in hundredths of a second, of boys and girls', L: 'Boys', R: 'Girls', unit: 'hundredths', lo: [20, 59], hi: [25, 66] },
];
export const stemBack = sgen('stat-stem-back', 'stat-stem-leaf', (rng, d) => {
  const ctx = pick(rng, BACK_CTX);
  const n = size(d, 9, 11, 12);
  const Lv = sorted(randInts(rng, n, ctx.lo[0], ctx.lo[1])); const Rv = sorted(randInts(rng, n, ctx.hi[0], ctx.hi[1]));
  const s0 = Math.floor(Math.min(...Lv, ...Rv) / 10); const s1 = Math.floor(Math.max(...Lv, ...Rv) / 10);
  const rows = [];
  for (let s = s0; s <= s1; s += 1) rows.push({ stem: s, left: Lv.filter((v) => Math.floor(v / 10) === s).map((v) => v % 10), right: Rv.filter((v) => Math.floor(v / 10) === s).map((v) => v % 10) });
  const ex = rows.find((r) => r.left.length);
  const u = ctx.unit === 'marks' ? '' : ctx.unit === 'hundredths' ? '' : ` ${ctx.unit}`;
  const exR = rows.find((r) => r.right.length);
  const keyText = `${ex.left[0]} | ${ex.stem} represents ${ex.stem * 10 + ex.left[0]}${u} for ${ctx.L};&ensp;${exR.stem} | ${exR.right[0]} represents ${exR.stem * 10 + exR.right[0]}${u} for ${ctx.R}`;
  const visual = stemLeafBack({ rows, leftName: ctx.L, rightName: ctx.R, keyText });
  const mL = median(Lv); const mR = median(Rv); const rL = rangeOf(Lv); const rR = rangeOf(Rv);
  if (d === 'hard') {
    if (mL === mR || rL === rR) throw new Error('ties');
    const hiM = mL > mR ? ctx.L : ctx.R; const loM = hiM === ctx.L ? ctx.R : ctx.L;
    const cons = rL < rR ? ctx.L : ctx.R; const inc = cons === ctx.L ? ctx.R : ctx.L;
    const correct = chance(rng) ? `${hiM} has the higher median (${num(Math.max(mL, mR))} compared with ${num(Math.min(mL, mR))})` : `${cons} is more consistent: its range is ${Math.min(rL, rR)} compared with ${Math.max(rL, rR)}`;
    return {
      prompt: `The back-to-back stem-and-leaf diagram shows ${ctx.what}.<br>Which statement is correct?`,
      visual, answer: correct,
      distractors: shuffle(rng, [
        `${loM} has the higher median (${num(Math.max(mL, mR))} compared with ${num(Math.min(mL, mR))})`,
        `${inc} is more consistent: its range is ${Math.max(rL, rR)} compared with ${Math.min(rL, rR)}`,
        `${loM} has the higher median, because its leaves are bigger numbers`,
        `${hiM} has the higher range (${Math.max(...(hiM === ctx.L ? Lv : Rv)) - Math.min(...(hiM === ctx.L ? Lv : Rv)) + 5} compared with ${Math.min(rL, rR)})`,
      ].filter((s) => s !== correct)),
      count: 4,
      solution: [
        `Read the ${ctx.L} leaves from right to left (the smallest leaf is next to the stem).`,
        `${ctx.L}: median ${num(mL)}, range ${rL}. ${ctx.R}: median ${num(mR)}, range ${rR}.`,
        `Answer: ${correct}`,
      ],
    };
  }
  const side = chance(rng) ? 'L' : 'R';
  const vals = side === 'L' ? Lv : Rv; const nameS = side === 'L' ? ctx.L : ctx.R;
  const ask = chance(rng) ? 'median' : 'range';
  const ans = ask === 'median' ? median(vals) : rangeOf(vals);
  const reversedWrong = side === 'L' ? (() => { const rev = rows.flatMap((r) => [...r.left].reverse().map((l) => r.stem * 10 + l)); return rev[Math.floor((n - 1) / 2)]; })() : null;
  return {
    prompt: `The back-to-back stem-and-leaf diagram shows ${ctx.what}.<br>Work out the ${ask} for ${nameS}.`,
    visual, answer: num(ans),
    distractors: numDistractors(ans, [ask === 'median' ? median(side === 'L' ? Rv : Lv) : rangeOf(side === 'L' ? Rv : Lv), reversedWrong, ask === 'median' ? (n + 1) / 2 : Math.max(...vals), ans + 1, ans - 1, ans + 10], {}),
    typed: { kind: 'number', value: ans },
    solution: [
      side === 'L' ? `The ${ctx.L} leaves are on the left and read <b>outwards</b> from the stem, so the smallest leaf is nearest the stem.` : `The ${ctx.R} leaves are on the right.`,
      `${nameS} in order: ${vals.join(', ')}.`,
      ask === 'median' ? `There are ${n} values, so the median is ${n % 2 ? `the ${ordinal((n + 1) / 2)} value` : `halfway between the ${ordinal(n / 2)} and ${ordinal(n / 2 + 1)} values`}: ${num(ans)}.` : `Range $= ${Math.max(...vals)} - ${Math.min(...vals)} = ${ans}$`,
      `Answer: ${num(ans)}`,
    ],
  };
}, { title: 'Back-to-back stem-and-leaf diagrams' });

/* ------------------------------------------------------------------ */
/* Scatter graphs                                                       */
/* ------------------------------------------------------------------ */

// x/y axes; sign of the trend; describe(+)= sentence; units
const SC_CTX = [
  { intro: 'The scatter graph shows the midday temperature and the number of ice creams sold by a kiosk on some days.', x: { min: 10, max: 30, step: 5, minor: 5, title: 'Temperature (°C)' }, y: { min: 0, max: 200, step: 50, minor: 5, title: 'Ice creams sold' }, sign: 1, xn: 'temperature', yn: 'ice creams sold', xu: '°C', yu: 'ice creams', rel: 'The higher the temperature, the more ice creams tend to be sold' },
  { intro: 'The scatter graph shows the age and value of some cars of the same model.', x: { min: 0, max: 10, step: 2, minor: 4, title: 'Age (years)' }, y: { min: 0, max: 20, step: 5, minor: 5, title: 'Value (£ thousands)' }, sign: -1, xn: 'age', yn: 'value', xu: 'years', yu: '£ thousand', rel: 'The older the car, the lower its value tends to be' },
  { intro: 'The scatter graph shows the number of hours some students revised and their test marks.', x: { min: 0, max: 20, step: 5, minor: 5, title: 'Hours revising' }, y: { min: 0, max: 100, step: 20, minor: 4, title: 'Test mark' }, sign: 1, xn: 'revision time', yn: 'mark', xu: 'hours', yu: 'marks', rel: 'Students who revised for longer tended to get higher marks' },
  { intro: 'The scatter graph shows the height and mass of some dogs.', x: { min: 20, max: 70, step: 10, minor: 5, title: 'Height (cm)' }, y: { min: 0, max: 40, step: 10, minor: 5, title: 'Mass (kg)' }, sign: 1, xn: 'height', yn: 'mass', xu: 'cm', yu: 'kg', rel: 'Taller dogs tend to be heavier' },
  { intro: 'The scatter graph shows the outside temperature and the amount of gas used to heat a house on some days.', x: { min: 0, max: 20, step: 5, minor: 5, title: 'Temperature (°C)' }, y: { min: 0, max: 60, step: 10, minor: 5, title: 'Gas used (units)' }, sign: -1, xn: 'temperature', yn: 'gas used', xu: '°C', yu: 'units', rel: 'The warmer it is outside, the less gas tends to be used' },
  { intro: 'The scatter graph shows the length of some taxi journeys and the fares charged.', x: { min: 0, max: 20, step: 5, minor: 5, title: 'Distance (miles)' }, y: { min: 0, max: 50, step: 10, minor: 5, title: 'Fare (£)' }, sign: 1, xn: 'distance', yn: 'fare', xu: 'miles', yu: '£', rel: 'Longer journeys tend to cost more' },
  { intro: 'The scatter graph shows the time some players spent playing a game and the number of points they scored.', x: { min: 0, max: 25, step: 5, minor: 5, title: 'Time played (hours)' }, y: { min: 0, max: 50, step: 10, minor: 5, title: 'Points (thousands)' }, sign: 1, xn: 'time played', yn: 'points', xu: 'hours', yu: 'thousand points', rel: 'Players who played for longer tended to score more points' },
  { intro: 'The scatter graph shows the number of hours of TV some students watched last week and their test marks.', x: { min: 0, max: 30, step: 5, minor: 5, title: 'Hours of TV' }, y: { min: 0, max: 80, step: 20, minor: 4, title: 'Test mark' }, sign: -1, xn: 'TV time', yn: 'mark', xu: 'hours', yu: 'marks', rel: 'Students who watched more TV tended to get lower marks' },
  { intro: 'The scatter graph shows the arm span and height of some adults.', x: { min: 150, max: 200, step: 10, minor: 5, title: 'Arm span (cm)' }, y: { min: 150, max: 200, step: 10, minor: 5, title: 'Height (cm)', breakAxis: true }, sign: 1, xn: 'arm span', yn: 'height', xu: 'cm', yu: 'cm', rel: 'People with longer arm spans tend to be taller', xBreak: true },
  { intro: 'The scatter graph shows the distance of some hotels from a beach and the price of a room.', x: { min: 0, max: 5, step: 1, minor: 5, title: 'Distance from beach (km)' }, y: { min: 0, max: 150, step: 50, minor: 5, title: 'Price per night (£)' }, sign: -1, xn: 'distance', yn: 'price', xu: 'km', yu: '£', rel: 'Hotels further from the beach tend to be cheaper' },
];
const fmtU = (u, v) => (u === '£' ? money(v) : u === '£ thousand' ? `£${num(v)} thousand` : `${num(v)} ${u}`);
/** Points around a line through two grid points; noise as a fraction of the y-range. */
function scatterPoints(rng, ctx, { n, noise, sign }) {
  const { x, y } = ctx;
  const xs = (x.max - x.min); const ys = (y.max - y.min);
  const sx = x.step / x.minor; const sy = y.step / y.minor;
  const g = (v, s) => Math.round(v / s) * s;
  const yA = g(y.min + ys * (sign > 0 ? 0.15 + rng() * 0.15 : 0.7 + rng() * 0.15), sy);
  const yB = g(y.min + ys * (sign > 0 ? 0.7 + rng() * 0.15 : 0.15 + rng() * 0.15), sy);
  const xA = x.min + xs * 0.1; const xB = x.max - xs * 0.1;
  const f = (xv) => yA + ((yB - yA) * (xv - xA)) / (xB - xA);
  const pts = [];
  for (let i = 0; i < n; i += 1) {
    const xv = g(x.min + xs * (0.06 + 0.88 * rng()), sx / 2);
    const yv = g(f(xv) + (rng() - 0.5) * 2 * noise * ys, sy / 2);
    if (yv <= y.min || yv >= y.max) { i -= 1; continue; }
    pts.push([xv, yv]);
  }
  return { pts, f, xA, xB, yA, yB, sx, sy };
}
const corrR = (pts) => {
  const mx = mean(pts.map((p) => p[0])); const my = mean(pts.map((p) => p[1]));
  let sxy = 0; let sxx = 0; let syy = 0;
  for (const [a, b] of pts) { sxy += (a - mx) * (b - my); sxx += (a - mx) ** 2; syy += (b - my) ** 2; }
  return sxy / Math.sqrt(sxx * syy);
};
const CORR = ['Strong positive', 'Weak positive', 'No correlation', 'Weak negative', 'Strong negative'];

const NONE_CTX = [
  { intro: 'The scatter graph shows the shoe sizes and test marks of some students.', x: { min: 2, max: 12, step: 2, minor: 4, title: 'Shoe size' }, y: { min: 0, max: 100, step: 20, minor: 4, title: 'Test mark' } },
  { intro: 'The scatter graph shows the house numbers and the heights of some people living on a street.', x: { min: 0, max: 50, step: 10, minor: 5, title: 'House number' }, y: { min: 140, max: 200, step: 10, minor: 5, title: 'Height (cm)', breakAxis: true } },
  { intro: 'The scatter graph shows the day of the month and the number of goals scored in some football matches.', x: { min: 0, max: 30, step: 5, minor: 5, title: 'Day of the month' }, y: { min: 0, max: 8, step: 2, minor: 2, title: 'Goals scored' } },
  { intro: 'The scatter graph shows the number of letters in some students\' first names and their heights.', x: { min: 0, max: 10, step: 2, minor: 4, title: 'Letters in first name' }, y: { min: 140, max: 190, step: 10, minor: 5, title: 'Height (cm)', breakAxis: true } },
];
export const scatterCorrelation = sgen('stat-scatter-correlation', 'stat-scatter', (rng, d) => {
  const type = pick(rng, size(d, ['Strong positive', 'Strong negative', 'No correlation'], CORR, CORR));
  const sign = type.includes('negative') ? -1 : 1;
  // the context must agree with the direction of the correlation
  const ctx = type === 'No correlation' ? pick(rng, NONE_CTX) : pick(rng, SC_CTX.filter((c) => c.sign === sign));
  const noise = type.startsWith('Strong') ? 0.06 : type.startsWith('Weak') ? 0.22 : 0;
  let pts;
  if (type === 'No correlation') {
    pts = Array.from({ length: 14 }, () => [Math.round((ctx.x.min + (ctx.x.max - ctx.x.min) * (0.06 + 0.88 * rng())) / (ctx.x.step / ctx.x.minor)) * (ctx.x.step / ctx.x.minor), Math.round((ctx.y.min + (ctx.y.max - ctx.y.min) * (0.1 + 0.8 * rng())) / (ctx.y.step / ctx.y.minor)) * (ctx.y.step / ctx.y.minor)]);
  } else pts = scatterPoints(rng, ctx, { n: 14, noise, sign }).pts;
  const r = corrR(pts);
  const ok = type === 'No correlation' ? Math.abs(r) < 0.2 : type.startsWith('Strong') ? Math.abs(r) > 0.9 && Math.sign(r) === sign : Math.abs(r) > 0.45 && Math.abs(r) < 0.75 && Math.sign(r) === sign;
  if (!ok) throw new Error('correlation does not match');
  const visual = scatterGraph({ points: pts, x: { ...ctx.x, breakAxis: ctx.xBreak }, y: ctx.y });
  return {
    prompt: `${ctx.intro}<br>What type of correlation does the graph show?`,
    visual, answer: type,
    distractors: CORR.filter((c) => c !== type),
    keepOrder: true,
    solution: [
      '<b>Positive</b>: as one variable goes up, the other tends to go up. <b>Negative</b>: as one goes up, the other tends to go down.',
      '<b>Strong</b>: the points lie close to a straight line. <b>Weak</b>: there is a trend but the points are spread out. <b>No correlation</b>: no pattern.',
      `Here ${type === 'No correlation' ? 'the points show no pattern' : `the points ${sign > 0 ? 'go up' : 'go down'} from left to right and are ${type.startsWith('Strong') ? 'close to a line' : 'quite spread out'}`}.`,
      `Answer: ${type}`,
    ],
  };
}, { title: 'Type and strength of correlation' });

export const scatterEstimate = sgen('stat-scatter-estimate', 'stat-scatter', (rng, d) => {
  const ctx = pick(rng, SC_CTX);
  const S = scatterPoints(rng, ctx, { n: 13, noise: 0.07, sign: ctx.sign });
  // query on a grid line well inside the data
  const sx = S.sx; const sy = S.sy;
  const xq = Math.round((ctx.x.min + (ctx.x.max - ctx.x.min) * (0.3 + 0.4 * rng())) / sx) * sx;
  const yTrue = S.f(xq);
  const ans = Math.round(yTrue / sy) * sy;
  if (Math.abs(ans - yTrue) > sy * 0.15) throw new Error('line not on grid at query');
  const inverse = d === 'hard' && chance(rng);
  const lobf = [[ctx.x.min, S.f(ctx.x.min)], [ctx.x.max, S.f(ctx.x.max)]];
  const visual = scatterGraph({ points: S.pts, x: { ...ctx.x, breakAxis: ctx.xBreak }, y: ctx.y, line: d === 'hard' ? null : lobf });
  const tol = d === 'hard' ? 2 * sy : sy;
  const fy = (v) => fmtU(ctx.yu, v); const fx = (v) => fmtU(ctx.xu, v);
  const lineNote = d === 'hard' ? 'Draw a line of best fit by eye: a straight line through the middle of the points, following the trend.' : 'Use the line of best fit that has been drawn.';
  if (inverse) {
    return {
      prompt: `${ctx.intro}<br>Use a line of best fit to estimate the ${ctx.xn} when the ${ctx.yn} is ${fy(ans)}.`,
      visual, answer: fx(xq),
      distractors: numDistractors(xq, [xq + ctx.x.step, xq - ctx.x.step, ans, xq + 2 * ctx.x.step, xq - 2 * ctx.x.step], { fmt: fx, minGap: 2 * sx }),
      typed: { kind: 'number', value: xq, tolerance: 2 * sx },
      solution: [lineNote, `Go across from ${fy(ans)} on the vertical axis to the line, then down to the horizontal axis.`, `This gives about ${fx(xq)} (answers close to this are fine).`, `Answer: about ${fx(xq)}`],
    };
  }
  return {
    prompt: `${ctx.intro}<br>${d === 'hard' ? 'Use a line of best fit' : 'Use the line of best fit'} to estimate the ${ctx.yn} when the ${ctx.xn} is ${fx(xq)}.`,
    visual, answer: fy(ans),
    distractors: numDistractors(ans, [Math.round(S.f(xq + ctx.x.step) / sy) * sy, Math.round(S.f(xq - ctx.x.step) / sy) * sy, xq, ans + ctx.y.step, ans - ctx.y.step, Math.round(S.f(xq + 2 * ctx.x.step) / sy) * sy], { fmt: fy, minGap: 2 * tol }),
    typed: { kind: 'number', value: ans, tolerance: tol },
    solution: [lineNote, `Go up from ${fx(xq)} on the horizontal axis to the line, then across to the vertical axis.`, `Each small square on the vertical axis is ${num(sy)}. The reading is about ${fy(ans)} (answers close to this are fine).`, `Answer: about ${fy(ans)}`],
  };
}, { title: 'Estimate using a line of best fit' });

export const scatterOutlier = sgen('stat-scatter-outlier', 'stat-scatter', (rng, d) => {
  const ctx = pick(rng, SC_CTX);
  const S = scatterPoints(rng, ctx, { n: 12, noise: 0.06, sign: ctx.sign });
  const sx = S.sx; const sy = S.sy;
  const ox = Math.round((ctx.x.min + (ctx.x.max - ctx.x.min) * (0.25 + 0.5 * rng())) / sx) * sx;
  const fy = S.f(ox);
  const off = (ctx.y.max - ctx.y.min) * (0.35 + 0.15 * rng()) * (fy > (ctx.y.max + ctx.y.min) / 2 ? -1 : 1);
  const oy = Math.round((fy + off) / sy) * sy;
  if (oy <= ctx.y.min || oy >= ctx.y.max) throw new Error('outlier off chart');
  const pts = [...S.pts.filter((p) => Math.abs(p[0] - ox) > sx), [ox, oy]];
  const visual = scatterGraph({ points: pts, x: { ...ctx.x, breakAxis: ctx.xBreak }, y: ctx.y });
  const askBoth = d === 'hard';
  if (askBoth) {
    const t = (a, b) => `(${num(a)}, ${num(b)})`;
    return {
      prompt: `${ctx.intro}<br>One point is an outlier. Write down its coordinates.`,
      visual, answer: t(ox, oy),
      distractors: [t(oy, ox), t(ox, Math.round(fy / sy) * sy), t(ox + sx, oy), t(ox, oy + sy), t(ox - sx, oy - sy)].filter((s) => s !== t(ox, oy)),
      typed: { kind: 'coord', x: ox, y: oy },
      solution: ['An <b>outlier</b> is a point that does not fit the pattern of the others.', `The point at ${num(ox)} on the horizontal axis is far from the trend.`, `Reading carefully (horizontal value first): ${t(ox, oy)}.`, `Answer: ${t(ox, oy)}`],
    };
  }
  const f = (v) => fmtU(ctx.yu, v);
  return {
    prompt: `${ctx.intro}<br>One point is an outlier. What is its ${ctx.yn}?`,
    visual, answer: f(oy),
    distractors: numDistractors(oy, [ox, Math.round(fy / sy) * sy, oy + sy, oy - sy, oy + ctx.y.step, Math.max(...S.pts.map((p) => p[1]))], { fmt: f }),
    typed: { kind: 'number', value: oy },
    solution: ['An <b>outlier</b> is a point that does not fit the pattern of the others.', `The outlier is at ${fmtU(ctx.xu, ox)} across.`, `Read across to the vertical axis: ${f(oy)}.`, `Answer: ${f(oy)}`],
  };
}, { title: 'Identify an outlier on a scatter graph' });

export const scatterInterpret = sgen('stat-scatter-interpret', 'stat-scatter', (rng, d) => {
  const ctx = pick(rng, SC_CTX);
  const S = scatterPoints(rng, ctx, { n: 13, noise: 0.08, sign: ctx.sign });
  const visual = scatterGraph({ points: S.pts, x: { ...ctx.x, breakAxis: ctx.xBreak }, y: ctx.y });
  const q = d === 'easy' ? 'rel' : pick(rng, d === 'hard' ? ['extrap', 'extrap', 'rel'] : ['rel', 'extrap']);
  if (q === 'rel') {
    const opp = ctx.rel.replace(/higher|more|lower|less|longer|older|warmer|taller|heavier|cheaper|further/g, (w) => ({ higher: 'lower', more: 'fewer', lower: 'higher', less: 'more', longer: 'shorter', older: 'newer', warmer: 'colder', taller: 'shorter', heavier: 'lighter', cheaper: 'more expensive', further: 'closer' }[w]));
    const all = `Every point shows that the greater the ${ctx.xn}, the ${ctx.sign > 0 ? 'greater' : 'smaller'} the ${ctx.yn}, with no exceptions`;
    return {
      prompt: `${ctx.intro}<br>Which statement best describes the relationship shown?`,
      visual, answer: ctx.rel,
      distractors: [opp, `There is no relationship between ${ctx.xn} and ${ctx.yn}`, all],
      count: 4,
      solution: [`The points go ${ctx.sign > 0 ? 'up' : 'down'} from left to right: ${ctx.sign > 0 ? 'positive' : 'negative'} correlation.`, 'Describe it in context with "tend to": correlation describes a general trend, not every single point.', `Answer: ${ctx.rel}`],
    };
  }
  const far = ctx.x.max + ctx.x.step * int(rng, 2, 4);
  const ans = 'The value is outside the range of the data, so the trend may not continue';
  return {
    prompt: `${ctx.intro}<br>Ali uses a line of best fit to estimate the ${ctx.yn} when the ${ctx.xn} is ${fmtU(ctx.xu, far)}.<br>Why might his estimate be unreliable?`,
    visual, answer: ans,
    distractors: ['There are too few points with a positive correlation', 'A line of best fit must go through the origin', `The line of best fit can only be used for ${ctx.xn} values that are on a gridline`, 'The points do not all lie exactly on the line'],
    count: 4,
    solution: [`The data only cover ${ctx.xn}s from about ${fmtU(ctx.xu, ctx.x.min)} to ${fmtU(ctx.xu, ctx.x.max)}.`, `${fmtU(ctx.xu, far)} is outside this range. Using the line there is called <b>extrapolation</b>, and the pattern might not continue.`, `Answer: ${ans}`],
  };
}, { title: 'Interpret scatter graphs (relationship, extrapolation)' });

export const scatterWhich = sgen('stat-scatter-which', 'stat-scatter', (rng) => {
  const types = shuffle(rng, ['pos', 'neg', 'none', 'curve']);
  const outlierOn = pick(rng, types.filter((t) => t === 'pos' || t === 'neg'));
  const mk = (t) => {
    const pts = [];
    for (let i = 0; i < 11; i += 1) {
      const xv = 0.6 + (8.8 * i) / 10 + (rng() - 0.5) * 0.5;
      let yv;
      if (t === 'pos') yv = 1 + 0.8 * xv + (rng() - 0.5) * 1.4;
      else if (t === 'neg') yv = 9 - 0.8 * xv + (rng() - 0.5) * 1.4;
      else if (t === 'none') yv = 1 + 8 * rng();
      else yv = 1 + 0.4 * (xv - 5) ** 2 * 0.8 + (rng() - 0.5) * 0.6;
      pts.push([xv, Math.min(9.6, Math.max(0.4, yv))]);
    }
    // The middle point (x ≈ 5, trend ≈ 5) becomes an outlier well below the trend.
    if (t === outlierOn) pts[5] = [pts[5][0], 0.8];
    return pts;
  };
  const graphs = types.map(mk);
  const visual = scatterQuartet(graphs);
  const Q = [
    { q: 'Which graph shows negative correlation?', t: 'neg' },
    { q: 'Which graph shows positive correlation?', t: 'pos' },
    { q: 'Which graph shows no correlation?', t: 'none' },
    { q: 'For which graph would a straight line of best fit <b>not</b> be appropriate, even though there is a clear pattern?', t: 'curve' },
    { q: 'Which graph has an outlier?', t: 'outlier' },
  ];
  const pickQ = pick(rng, Q);
  const idx = pickQ.t === 'outlier' ? types.indexOf(outlierOn) : types.indexOf(pickQ.t);
  const L = ['A', 'B', 'C', 'D'];
  const why = { neg: 'the points go down from left to right', pos: 'the points go up from left to right', none: 'the points are scattered with no pattern', curve: 'the points follow a curve, so a straight line would not fit', outlier: 'one point is far away from the pattern of the others' }[pickQ.t];
  return {
    prompt: `Here are four scatter graphs.<br>${pickQ.q}`,
    visual, answer: `Graph ${L[idx]}`,
    distractors: L.filter((_, i) => i !== idx).map((l) => `Graph ${l}`),
    count: 4, keepOrder: true,
    solution: [`Look at the overall pattern of each graph.`, `In graph ${L[idx]}, ${why}.`, `Answer: Graph ${L[idx]}`],
  };
}, { title: 'Which scatter graph shows…?' });

/* ------------------------------------------------------------------ */
/* Frequency polygons                                                   */
/* ------------------------------------------------------------------ */

function polyData(rng, d, { N = null, k = 5 } = {}) {
  const ctx = pick(rng, GROUPED_CTX.filter((c) => c.unit !== '£'));
  const w = pick(rng, ctx.widths); const start = pick(rng, ctx.starts);
  const total = N ?? pick(rng, [30, 40, 50, 60]);
  const fs = peakedFreqs(rng, k, total, { min: 1 });
  const classes = fs.map((f, i) => ({ a: start + i * w, b: start + (i + 1) * w, f, mid: start + (i + 0.5) * w }));
  return { ctx, classes, w, start, N: total };
}
const polyAxes = (P, extra = 0) => {
  const fmax = Math.max(...P.classes.map((c) => c.f)) + extra;
  const ystep = fmax <= 10 ? 2 : fmax <= 20 ? 4 : fmax <= 40 ? 5 : 10;
  const yminor = ystep === 2 ? 2 : ystep === 4 ? 4 : 5;
  const xmax = P.classes[P.classes.length - 1].b;
  const xmin = P.start;
  return { x: { min: xmin, max: xmax, step: P.w, minor: P.w % 5 === 0 ? 5 : P.w % 4 === 0 ? 4 : P.w % 2 === 0 ? 2 : 0, title: P.ctx.head.replace(/\$([a-z])\$/, '$1'), breakAxis: xmin > 0 }, y: { max: Math.ceil((fmax + 1) / ystep) * ystep, step: ystep, minor: yminor, title: 'Frequency' } };
};

export const polyRead = sgen('stat-freqpoly-read', 'stat-frequency-polygon', (rng, d) => {
  const P = polyData(rng, d);
  const ax = polyAxes(P);
  const visual = frequencyPolygon({ series: [{ name: '', points: P.classes.map((c) => [c.mid, c.f]) }], ...ax });
  const q = size(d, 'freq', pick(rng, ['freq', 'total', 'modal']), pick(rng, ['total', 'modal', 'more']));
  const i = int(rng, 0, P.classes.length - 1);
  const c = P.classes[i];
  const intro = `The frequency polygon shows information about ${P.ctx.what}.`;
  if (q === 'freq') {
    return {
      prompt: `${intro}<br>How many ${P.ctx.who} are in the class ${classTex(P.ctx, c)}?`,
      visual, answer: num(c.f),
      distractors: numDistractors(c.f, [c.mid, P.classes[(i + 1) % P.classes.length].f, c.f + 1, c.f - 1, c.f + 2, c.b], { integer: true }),
      typed: { kind: 'number', value: c.f },
      solution: ['In a frequency polygon each point is plotted at the <b>midpoint</b> of its class.', `The midpoint of ${classTex(P.ctx, c)} is ${num(c.mid)}. The point above it is at a height of ${c.f}.`, `Answer: ${c.f}`],
    };
  }
  if (q === 'total') {
    return {
      prompt: `${intro}<br>How many ${P.ctx.who} are there altogether?`,
      visual, answer: num(P.N),
      distractors: numDistractors(P.N, [Math.max(...P.classes.map((x) => x.f)), sum(P.classes.map((x) => x.mid)), P.N - P.classes[0].f, P.N + P.classes[0].f, sum(P.classes.map((x) => x.f * x.mid)) / P.N], { integer: true }),
      typed: { kind: 'number', value: P.N },
      solution: ['Read the frequency of every point.', `$${P.classes.map((x) => x.f).join(' + ')} = ${P.N}$`, `Answer: ${P.N}`],
    };
  }
  if (q === 'modal') {
    const mx = Math.max(...P.classes.map((x) => x.f));
    if (P.classes.filter((x) => x.f === mx).length > 1) throw new Error('tie');
    const m = P.classes.find((x) => x.f === mx);
    return {
      prompt: `${intro}<br>Write down the modal class.`,
      visual, answer: classTex(P.ctx, m),
      distractors: P.classes.filter((x) => x !== m).map((x) => classTex(P.ctx, x)),
      count: P.classes.length, keepOrder: true,
      solution: ['The modal class has the highest frequency: the highest point.', `The highest point is at ${num(m.mid)}, the midpoint of ${classTex(P.ctx, m)}.`, `Answer: ${classTex(P.ctx, m)}`],
    };
  }
  const cut = P.classes[int(rng, 1, P.classes.length - 2)].a;
  const ans = sum(P.classes.filter((x) => x.a >= cut).map((x) => x.f));
  return {
    prompt: `${intro}<br>How many ${P.ctx.who} had a ${P.ctx.noun} of more than ${num(cut)} ${P.ctx.unit}?`.replace(' £', ''),
    visual, answer: num(ans),
    distractors: numDistractors(ans, [sum(P.classes.filter((x) => x.mid > cut + P.w).map((x) => x.f)), sum(P.classes.filter((x) => x.a >= cut - P.w).map((x) => x.f)), P.N - ans, ans + 1, ans - 1], { integer: true }),
    typed: { kind: 'number', value: ans },
    solution: [`Classes above ${num(cut)}: ${P.classes.filter((x) => x.a >= cut).map((x) => classTex(P.ctx, x)).join(', ')} (plotted at midpoints ${P.classes.filter((x) => x.a >= cut).map((x) => num(x.mid)).join(', ')}).`, `$${P.classes.filter((x) => x.a >= cut).map((x) => x.f).join(' + ')} = ${ans}$`, `Answer: ${ans}`],
  };
}, { title: 'Read a frequency polygon' });

export const polyPoint = sgen('stat-freqpoly-point', 'stat-frequency-polygon', (rng, d) => {
  const P = polyData(rng, d, { k: 4 });
  const i = int(rng, 0, 3);
  const c = P.classes[i];
  const t = (a, b) => `(${num(a)}, ${num(b)})`;
  const cum = sum(P.classes.slice(0, i + 1).map((x) => x.f));
  return {
    prompt: `The table shows information about ${P.ctx.what}.${table([[P.ctx.head, 'Frequency'], ...P.classes.map((x) => [classTex(P.ctx, x), num(x.f)])])}A frequency polygon is drawn for the data.<br>What are the coordinates of the point plotted for the class ${classTex(P.ctx, c)}?`,
    answer: t(c.mid, c.f),
    distractors: [t(c.b, c.f), t(c.a, c.f), t(c.f, c.mid), t(c.mid, cum), t(c.b, cum), t(c.a + c.b, c.f), t(c.b - c.a, c.f), t(c.mid, P.classes[(i + 1) % 4].f), t(P.classes[(i + 1) % 4].mid, c.f)].filter((s) => s !== t(c.mid, c.f)),
    typed: { kind: 'coord', x: c.mid, y: c.f },
    solution: ['For a frequency polygon, plot each frequency at the <b>midpoint</b> of its class (not at the end of the class).', `Midpoint: $(${num(c.a)} + ${num(c.b)}) \\div 2 = ${num(c.mid)}$; frequency ${c.f}.`, `Answer: ${t(c.mid, c.f)}`],
  };
}, { title: 'Plotting points for a frequency polygon' });

export const polyCompare = sgen('stat-freqpoly-compare', 'stat-frequency-polygon', (rng, d) => {
  const P = polyData(rng, d, { N: pick(rng, [20, 25, 40, 50]) });
  const groups = pick(rng, [['Boys', 'Girls'], ['Year 7', 'Year 11'], ['Before', 'After'], ['Team A', 'Team B']]);
  const f2 = peakedFreqs(rng, P.classes.length, P.N + pick(rng, [0, 5, 10]), { min: 1 });
  const B = P.classes.map((c, i) => ({ ...c, f: f2[i] }));
  const ax = polyAxes({ ...P, classes: [...P.classes, ...B] });
  const visual = frequencyPolygon({ series: [{ name: groups[0], points: P.classes.map((c) => [c.mid, c.f]) }, { name: groups[1], points: B.map((c) => [c.mid, c.f]) }], ...ax });
  const intro = `The frequency polygons show information about ${P.ctx.what}, for two groups.`;
  if (d === 'hard') {
    const est = tidy(sum(P.classes.map((c) => c.f * c.mid)) / P.N);
    const ans = isClean(est, 2) ? est : roundTo(est, 1);
    const f = (v) => `${num(v)} ${P.ctx.unit}`;
    return {
      prompt: `${intro}<br>Work out an estimate of the mean ${P.ctx.noun} for ${groups[0]}.${isClean(est, 2) ? '' : '<br>Give your answer to 1 decimal place.'}`,
      visual, answer: f(ans),
      distractors: numDistractors(ans, [sum(P.classes.map((c) => c.f * c.b)) / P.N, sum(P.classes.map((c) => c.f * c.a)) / P.N, sum(P.classes.map((c) => c.f * c.mid)) / P.classes.length, P.N / P.classes.length, sum(B.map((c) => c.f * c.mid)) / sum(f2)], { fmt: f, dp: isClean(est, 2) ? null : 1 }),
      typed: { kind: 'number', value: ans, ...(isClean(est, 2) ? {} : { tolerance: 0.05 }) },
      calculator: true,
      solution: [
        `Read the ${groups[0]} points: they are at the midpoints ${P.classes.map((c) => num(c.mid)).join(', ')} with frequencies ${P.classes.map((c) => c.f).join(', ')}.`,
        `Estimated total $= ${P.classes.map((c) => `${num(c.mid)} \\times ${c.f}`).join(' + ')} = ${num(sum(P.classes.map((c) => c.f * c.mid)))}$`,
        `Mean $\\approx ${num(sum(P.classes.map((c) => c.f * c.mid)))} \\div ${P.N} = ${num(roundTo(est, 3))}$`,
        `Answer: ${f(ans)}`,
      ],
    };
  }
  const i = int(rng, 0, P.classes.length - 1);
  const a = P.classes[i].f; const b = B[i].f;
  if (a === b) throw new Error('same');
  const [more, less] = a > b ? groups : [groups[1], groups[0]];
  const ans = Math.abs(a - b);
  return {
    prompt: `${intro}<br>In the class ${classTex(P.ctx, P.classes[i])}, how many more ${more} than ${less} were there?`,
    visual, answer: num(ans),
    distractors: numDistractors(ans, [a + b, Math.max(a, b), ans + 1, ans + 2, Math.abs(P.classes[(i + 1) % P.classes.length].f - B[(i + 1) % P.classes.length].f), P.classes[i].mid], { integer: true }),
    typed: { kind: 'number', value: ans },
    solution: [`The class ${classTex(P.ctx, P.classes[i])} is plotted at its midpoint, ${num(P.classes[i].mid)}.`, `${groups[0]}: ${a}; ${groups[1]}: ${b} (use the key).`, `Difference: $${Math.max(a, b)} - ${Math.min(a, b)} = ${ans}$`, `Answer: ${ans}`],
  };
}, { title: 'Compare two frequency polygons' });

/* ------------------------------------------------------------------ */
/* Capture–recapture                                                    */
/* ------------------------------------------------------------------ */

const CAP_CTX = [
  { animal: 'fish', place: 'a lake', mark: 'tags', how: 'catches' },
  { animal: 'rabbits', place: 'a field', mark: 'marks with a small ear tag', how: 'traps' },
  { animal: 'newts', place: 'a pond', mark: 'marks', how: 'catches' },
  { animal: 'ladybirds', place: 'a garden', mark: 'marks with a dot of paint', how: 'catches' },
  { animal: 'frogs', place: 'a nature reserve', mark: 'tags', how: 'catches' },
  { animal: 'squirrels', place: 'a wood', mark: 'tags', how: 'traps' },
  { animal: 'butterflies', place: 'a meadow', mark: 'marks with a tiny dot', how: 'nets' },
  { animal: 'snails', place: 'an allotment', mark: 'marks with nail varnish', how: 'collects' },
  { animal: 'mice', place: 'a barn', mark: 'marks', how: 'traps' },
  { animal: 'crabs', place: 'a rock pool area', mark: 'tags', how: 'catches' },
  { animal: 'beetles', place: 'a forest floor', mark: 'marks with paint', how: 'traps' },
  { animal: 'trout', place: 'a river', mark: 'tags', how: 'catches' },
  { animal: 'voles', place: 'a hedgerow', mark: 'tags', how: 'traps' },
  { animal: 'bats', place: 'some caves', mark: 'rings', how: 'catches' },
];
function capData(rng, d) {
  for (let t = 0; t < 200; t += 1) {
    const M = int(rng, ...size(d, [20, 60], [30, 120], [40, 250]));
    const n = int(rng, ...size(d, [20, 60], [30, 100], [40, 150]));
    const m = int(rng, 2, Math.min(M, n) / 2);
    const N = (M * n) / m;
    if (!Number.isInteger(N) || N < M + n - m || N > 3000) continue;
    if (d === 'easy' && n % m && M % m) continue;
    return { M, n, m, N };
  }
  throw new Error('capture data');
}
const theP = (p) => p.replace(/^(a|an|some) /, 'the ');
const capIntro = (c, nm, M) => `${nm} wants to estimate the number of ${c.animal} in ${c.place}.<br>She ${c.how} ${M} ${c.animal}, ${c.mark.startsWith('marks with') ? c.mark.replace('marks', 'marks them') : `${c.mark} them`} and releases them.`.replace('tags them', 'tags them').replace('marks with', 'marks them with').replace('marks them them', 'marks them');
export const captureEstimate = sgen('stat-capture-estimate', 'stat-capture-recapture', (rng, d) => {
  const c = pick(rng, CAP_CTX); const nm = names(rng, 1)[0];
  const { M, n, m, N } = capData(rng, d);
  return {
    prompt: `${capIntro(c, nm, M)}<br>A week later she ${c.how} ${n} ${c.animal}. ${m} of these are marked.<br>Work out an estimate of the number of ${c.animal} in ${theP(c.place)}.`,
    answer: num(N),
    distractors: numDistractors(N, [(M * m) / n, (n * m) / M, M + n, M + n - m, M * n, (M / m) * (n - m), N / 2], { integer: true }),
    typed: { kind: 'number', value: N },
    calculator: d === 'hard',
    solution: [
      `Assume the fraction of marked ${c.animal} in the second sample is the same as in the whole population.`,
      `$\\frac{${m}}{${n}} = \\frac{${M}}{N}$, where $N$ is the population.`,
      `$N = \\frac{${M} \\times ${n}}{${m}} = \\frac{${M * n}}{${m}} = ${N}$`,
      `Answer: about ${num(N)}`,
    ],
  };
}, { title: 'Capture–recapture estimate', word: true });

export const captureReverse = sgen('stat-capture-reverse', 'stat-capture-recapture', (rng, d) => {
  const c = pick(rng, CAP_CTX); const nm = names(rng, 1)[0];
  const { M, n, m, N } = capData(rng, d);
  const askM = chance(rng);
  if (askM) {
    return {
      prompt: `${nm} estimates that there are ${N} ${c.animal} in ${c.place}, using capture–recapture.<br>In her second sample she caught ${n} ${c.animal}, and ${m} of them were marked.<br>How many ${c.animal} did she mark in the first sample?`,
      answer: num(M),
      distractors: numDistractors(M, [(N * n) / m, (n * m) / N * 10, (N * m) / n + 1, N - n, n - m, M + m], { integer: true }),
      typed: { kind: 'number', value: M },
      calculator: d !== 'easy',
      solution: ['Fraction marked in the second sample = fraction of the whole population that is marked.', `$\\frac{${m}}{${n}} = \\frac{M}{${N}}$`, `$M = \\frac{${m} \\times ${N}}{${n}} = ${M}$`, `Answer: ${M}`],
    };
  }
  return {
    prompt: `${capIntro(c, nm, M)}<br>She estimates that there are ${N} ${c.animal} in ${theP(c.place)}.<br>Later she ${c.how} ${n} ${c.animal}. How many of these would she expect to be marked?`,
    answer: num(m),
    distractors: numDistractors(m, [(N * n) / M, (M * N) / n, n - m, M - m, m + 1, m + 2, Math.round(n / 2)], { integer: true }),
    typed: { kind: 'number', value: m },
    calculator: d !== 'easy',
    solution: [`The fraction of the population that is marked is $\\frac{${M}}{${N}}$.`, `Expect the same fraction of the ${n} in the sample: $\\frac{${M}}{${N}} \\times ${n} = ${m}$`, `Answer: ${m}`],
  };
}, { title: 'Capture–recapture working backwards', word: true });

const CAP_EFFECT = [
  { s: 'Some of the marks wash off before the second sample is taken.', a: 'Too high', why: 'Fewer marked animals are recognised in the second sample, so $m$ is too small and $N = \\frac{Mn}{m}$ is too big.' },
  { s: 'Marked animals are easier to catch the second time, because they are less wary of the trap.', a: 'Too low', why: 'More marked animals are caught, so $m$ is too big and $N = \\frac{Mn}{m}$ is too small.' },
  { s: 'Marked animals avoid the traps after being caught once.', a: 'Too high', why: 'Fewer marked animals are caught, so $m$ is too small and the estimate is too big.' },
  { s: 'The marked animals stay together in one corner and do not mix with the others before the second sample is taken there.', a: 'Too low', why: 'The second sample (taken in that corner) contains too many marked animals, so $m$ is too big and the estimate is too small.' },
  { s: 'Some of the marked animals die before the second sample, but no unmarked ones do.', a: 'Too high', why: 'There are fewer marked animals to catch, so $m$ is too small and the estimate is too big.' },
];
const CAP_ASSUME = {
  a: 'The marked animals mix randomly with the rest of the population',
  w: ['All of the animals are the same size', 'The second sample is bigger than the first sample', 'The animals are released in a different place', 'Every animal is caught in the second sample'],
};
export const captureAssumptions = sgen('stat-capture-assumptions', 'stat-capture-recapture', (rng, d) => {
  const c = pick(rng, CAP_CTX);
  if (d === 'easy' || (d === 'medium' && chance(rng, 0.4))) {
    const a = pick(rng, [CAP_ASSUME.a, 'The population does not change between the two samples (no births, deaths or migration)', 'The marks do not come off between the samples']);
    return {
      prompt: `Capture–recapture is used to estimate the number of ${c.animal} in ${c.place}.<br>Which of these is an assumption that the method needs?`,
      answer: a,
      distractors: shuffle(rng, CAP_ASSUME.w),
      count: 4,
      solution: ['Capture–recapture assumes the second sample is like the whole population: same population, marks stay on, marked animals mixed in randomly and equally likely to be caught.', `Answer: ${a}`],
    };
  }
  const e = pick(rng, CAP_EFFECT);
  return {
    prompt: `Capture–recapture is used to estimate the number of ${c.animal} in ${c.place}.<br>${e.s}<br>What effect will this have on the estimate of the population?`,
    answer: e.a === 'Too high' ? 'The estimate will be too high' : 'The estimate will be too low',
    distractors: ['The estimate will be too high', 'The estimate will be too low', 'The estimate will not be affected'].filter((o) => o !== (e.a === 'Too high' ? 'The estimate will be too high' : 'The estimate will be too low')),
    count: 3, keepOrder: true,
    solution: ['Estimate: $N = \\frac{Mn}{m}$, where $m$ is the number of marked animals in the second sample.', e.why, `Answer: The estimate will be ${e.a.toLowerCase()}`],
  };
}, { title: 'Capture–recapture assumptions and effects' });

void [sample, rangeOf];
export const generators = [
  dataTypes, samplingBias, samplingQuestionnaire, samplingEstimate,
  stemRead, stemCount, stemBack,
  scatterCorrelation, scatterEstimate, scatterOutlier, scatterInterpret, scatterWhich,
  polyRead, polyPoint, polyCompare,
  captureEstimate, captureReverse, captureAssumptions,
];
