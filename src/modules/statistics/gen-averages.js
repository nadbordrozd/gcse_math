// Statistics generators: averages and spread (lists, problems, frequency tables, grouped data, comparisons).
import {
  pick, int, size, shuffle, sample, names, num, tnum, money, roundTo, tidy, table, chance, ordinal,
} from '../../core.js';
import {
  sgen, sum, mean, sorted, median, modeOf, countOf, rangeOf, numDistractors, ineq, peakedFreqs, randInts, unsortedOrder, spaced, isClean,
} from './util.js';
import { barChart } from './charts.js';

const plus = (a) => a.map((v) => (v < 0 ? `(${num(v).replace('−', '-')})` : num(v))).join(' + ');
const dpOf = (x) => (Number.isInteger(tidy(x)) ? 0 : String(tidy(x)).split('.')[1].length);

/* ------------------------------------------------------------------ */
/* Lists of data                                                        */
/* ------------------------------------------------------------------ */

const LIST_CTX = [
  { intro: 'Here are the numbers of goals scored by a hockey team in its last few matches.', unit: '', lo: 0, hi: 8 },
  { intro: 'Here are the ages, in years, of the children at a party.', unit: 'years', lo: 4, hi: 13 },
  { intro: 'Here are the scores of some students in a spelling test.', unit: '', lo: 4, hi: 20 },
  { intro: 'Here are the heights, in cm, of some sunflower seedlings.', unit: 'cm', lo: 8, hi: 36 },
  { intro: 'Here are the numbers of text messages Isla sent on some days.', unit: '', lo: 3, hi: 30 },
  { intro: 'Here are the numbers of minutes some trains were late.', unit: 'minutes', lo: 0, hi: 25 },
  { intro: 'Here are the masses, in kg, of some parcels.', unit: 'kg', lo: 1, hi: 20 },
  { intro: 'Here are the numbers of books some students read last term.', unit: '', lo: 0, hi: 14 },
  { intro: 'Here are the prices of some T-shirts in a sale.', unit: '£', lo: 4, hi: 25 },
  { intro: 'Here are the numbers of runs scored by a cricketer in some innings.', unit: '', lo: 0, hi: 60 },
  { intro: 'Here are the numbers of people waiting at a bus stop at different times.', unit: '', lo: 1, hi: 18 },
  { intro: 'Here are the lengths, in cm, of some worms found in a garden.', unit: 'cm', lo: 5, hi: 22 },
  { intro: 'Here are the numbers of customers in a café each hour one morning.', unit: '', lo: 6, hi: 40 },
];
const TEMP_CTX = { intro: 'Here are the midday temperatures, in °C, in a Scottish town on some days in January.', unit: '°C', lo: -7, hi: 8 };
const DEC_CTX = [
  { intro: 'Here are the times, in seconds, of some runners in a 100 m race.', unit: 'seconds', lo: 120, hi: 160, scale: 10 },
  { intro: 'Here are the masses, in kg, of some newborn babies.', unit: 'kg', lo: 26, hi: 45, scale: 10 },
  { intro: 'Here are the distances, in metres, jumped by some students in the long jump.', unit: 'm', lo: 28, hi: 52, scale: 10 },
];
const fmtU = (unit) => (v) => (unit === '£' ? money(v) : `${num(v)}${unit ? ` ${unit}` : ''}`);

/** Adjust one value so the total is a multiple of n, staying in [lo, hi]. */
function fixTotal(rng, vals, n, lo, hi) {
  const r = ((sum(vals) % n) + n) % n;
  if (r === 0) return vals;
  for (const i of shuffle(rng, vals.map((_, k) => k))) {
    if (vals[i] - r >= lo) { vals[i] -= r; return vals; }
    if (vals[i] + (n - r) <= hi) { vals[i] += n - r; return vals; }
  }
  throw new Error('fixTotal');
}

export const listMean = sgen('stat-avg-list-mean', 'stat-averages-list', (rng, d) => {
  let ctx; let vals; let scale = 1;
  if (d === 'hard' && chance(rng, 0.5)) {
    if (chance(rng)) {
      ctx = TEMP_CTX; const n = 6;
      vals = randInts(rng, n, ctx.lo, ctx.hi);
      if (!vals.some((v) => v < 0)) vals[0] = -int(rng, 1, 6);
      fixTotal(rng, vals, 3, ctx.lo, ctx.hi);
    } else {
      ctx = pick(rng, DEC_CTX); scale = ctx.scale;
      vals = randInts(rng, 6, ctx.lo, ctx.hi);
      fixTotal(rng, vals, 3, ctx.lo, ctx.hi); // six 1-dp values with a clean mean
    }
  } else {
    ctx = pick(rng, d === 'hard' ? LIST_CTX.filter((c) => c.hi >= 20) : LIST_CTX);
    const n = size(d, pick(rng, [4, 5]), pick(rng, [4, 5]), pick(rng, [8, 10]));
    vals = randInts(rng, n, ctx.lo, ctx.hi);
    if (d === 'easy') fixTotal(rng, vals, n, ctx.lo, ctx.hi);
    else if (n === 8) fixTotal(rng, vals, 4, ctx.lo, ctx.hi);
  }
  vals = vals.map((v) => tidy(v / scale));
  const n = vals.length; const s = sum(vals); const m = tidy(s / n);
  if (!isClean(m, 2)) throw new Error('mean not clean');
  if (d !== 'easy' && Number.isInteger(m) && chance(rng, 0.6)) throw new Error('want a decimal mean');
  const f = fmtU(ctx.unit);
  const dp = dpOf(m);
  return {
    prompt: `${ctx.intro}${spaced(vals)}Work out the mean.`,
    answer: f(m),
    distractors: numDistractors(m, [median(vals), s / (n - 1), s / (n + 1), (Math.max(...vals) + Math.min(...vals)) / 2, modeOf(vals), s, rangeOf(vals), m + 1, m - 1], { fmt: f, allowNeg: ctx === TEMP_CTX, dp: Math.max(dp, 1) === 1 && dp === 0 ? null : dp }),
    typed: { kind: 'number', value: m },
    solution: [
      'The <b>mean</b> is the total of the values divided by the number of values.',
      `Total: $${plus(vals)} = ${num(s).replace('−', '-')}$`,
      `There are ${n} values, so the mean is $${num(s).replace('−', '-')} \\div ${n} = ${num(m).replace('−', '-')}$`,
      `Answer: ${f(m)}`,
    ],
  };
}, { title: 'Mean of a list' });

export const listMedian = sgen('stat-avg-list-median', 'stat-averages-list', (rng, d) => {
  let ctx; let vals; let scale = 1;
  if (d === 'hard' && chance(rng, 0.5)) {
    if (chance(rng)) { ctx = TEMP_CTX; vals = randInts(rng, pick(rng, [8, 10]), ctx.lo, ctx.hi); if (!vals.some((v) => v < 0)) vals[1] = -int(rng, 1, 7); } else { ctx = pick(rng, DEC_CTX); scale = ctx.scale; vals = randInts(rng, pick(rng, [7, 8]), ctx.lo, ctx.hi); }
  } else {
    ctx = pick(rng, LIST_CTX);
    const n = size(d, pick(rng, [5, 7]), pick(rng, [7, 8, 9]), pick(rng, [10, 12]));
    vals = randInts(rng, n, ctx.lo, ctx.hi);
  }
  vals = vals.map((v) => tidy(v / scale));
  const n = vals.length;
  const shown = unsortedOrder(rng, vals);
  const med = median(vals);
  const s = sorted(vals);
  const naive = n % 2 ? shown[(n - 1) / 2] : tidy((shown[n / 2 - 1] + shown[n / 2]) / 2);
  if (Math.abs(naive - med) < 1e-9) throw new Error('naive median equals median');
  const f = fmtU(ctx.unit);
  const pos = (n + 1) / 2;
  const dist = [naive, (n + 1) / 2, s[Math.floor((n - 1) / 2)], s[Math.ceil((n - 1) / 2) + (n % 2 ? 0 : 0)], s[Math.floor(n / 2)], isClean(mean(vals), 1) ? mean(vals) : null, modeOf(vals), rangeOf(vals), s[Math.floor(n / 2) + 1]];
  return {
    prompt: `${ctx.intro}${spaced(shown)}Work out the median.`,
    answer: f(med),
    distractors: numDistractors(med, dist, { fmt: f, allowNeg: ctx === TEMP_CTX }),
    typed: { kind: 'number', value: med },
    solution: [
      'The <b>median</b> is the middle value once the values are <b>in order</b>. Don\'t just take the middle of the list as given!',
      `In order: ${s.map((v) => num(v)).join(', ')}`,
      n % 2 ? `There are ${n} values, so the median is the ${ordinal(pos)} value: ${num(med)}.`
        : `There are ${n} values, so the median is halfway between the ${ordinal(n / 2)} and ${ordinal(n / 2 + 1)} values: $(${num(s[n / 2 - 1]).replace('−', '-')} + ${num(s[n / 2]).replace('−', '-')}) \\div 2 = ${num(med).replace('−', '-')}$`,
      `Answer: ${f(med)}`,
    ],
  };
}, { title: 'Median of a list' });

export const listModeRange = sgen('stat-avg-list-mode-range', 'stat-averages-list', (rng, d) => {
  const askRange = chance(rng);
  const temps = askRange && d === 'hard';
  const ctx = temps ? TEMP_CTX : pick(rng, LIST_CTX.filter((c) => c.hi - c.lo >= 10));
  const f = fmtU(ctx.unit);
  if (askRange) {
    const n = size(d, 6, 8, 9);
    const vals = randInts(rng, n, ctx.lo, ctx.hi);
    if (temps && !vals.some((v) => v < 0)) vals[2] = -int(rng, 2, 7);
    if (temps && !vals.some((v) => v > 0)) vals[4] = int(rng, 2, 8);
    const shown = unsortedOrder(rng, vals);
    const mx = Math.max(...vals); const mn = Math.min(...vals); const r = mx - mn;
    if (r < 3) throw new Error('tiny range');
    return {
      prompt: `${ctx.intro}${spaced(shown)}Work out the range.`,
      answer: f(r),
      distractors: numDistractors(r, [mx + mn, mx, mx - Math.abs(mn), shown[shown.length - 1] - shown[0], shown[0] - shown[shown.length - 1], mx - shown[0], modeOf(vals), median(vals), r + 1, r - 1], { fmt: f }),
      typed: { kind: 'number', value: r },
      solution: [
        '<b>Range</b> = largest value − smallest value.',
        `Largest = ${num(mx)}, smallest = ${num(mn)}.`,
        `Range $= ${num(mx).replace('−', '-')} - ${mn < 0 ? `(${num(mn).replace('−', '-')})` : num(mn)} = ${num(r)}$`,
        `Answer: ${f(r)}`,
      ],
    };
  }
  // Mode: one value appears c times, another (c-1) times, the rest once.
  const c = size(d, 2, pick(rng, [2, 3]), 3);
  const n = size(d, 7, 9, 11);
  const pool = shuffle(rng, Array.from({ length: ctx.hi - ctx.lo + 1 }, (_, i) => ctx.lo + i));
  const mode = pool[0]; const second = pool[1];
  if (mode === c || mode === n) throw new Error('mode equals its count');
  const vals = [...Array(c).fill(mode), ...(c > 2 ? Array(c - 1).fill(second) : [second]), ...pool.slice(2, 2 + n - c - (c > 2 ? c - 1 : 1))];
  if (vals.length !== n) throw new Error('mode list');
  const shown = unsortedOrder(rng, vals);
  return {
    prompt: `${ctx.intro}${spaced(shown)}What is the mode?`,
    answer: f(mode),
    distractors: numDistractors(mode, [c, second, median(vals), Math.max(...vals), shown[Math.floor(n / 2)], isClean(mean(vals), 1) ? mean(vals) : null, rangeOf(vals)], { fmt: f }),
    typed: { kind: 'number', value: mode },
    solution: [
      'The <b>mode</b> is the value that appears <b>most often</b>.',
      `${num(mode)} appears ${c} times; no other value appears that often.`,
      `Careful: the mode is the value ${num(mode)}, not how many times it appears (${c}).`,
      `Answer: ${f(mode)}`,
    ],
  };
}, { title: 'Mode or range of a list' });

/** Which set of numbers satisfies given averages? */
export const listWhichSet = sgen('stat-avg-list-which-set', 'stat-averages-list', (rng, d) => {
  const n = 5;
  const M = int(rng, 2, 9); const K = M + int(rng, 2, 6);
  const meanT = d === 'hard' ? K + int(rng, 1, 3) : null;
  const R = d === 'medium' ? int(rng, K - M + 3, K - M + 9) : null;
  const ok = (s) => modeOf(s) === M && median(s) === K && (meanT === null || mean(s) === meanT) && (R === null || rangeOf(s) === R);
  // Correct set: M, M, K, y, z with y, z > K and distinct.
  let correct = null;
  for (let t = 0; t < 400 && !correct; t += 1) {
    let y; let z;
    if (meanT !== null) { y = K + int(rng, 1, 5); z = n * meanT - 2 * M - K - y; } else if (R !== null) { z = M + R; y = int(rng, K + 1, z - 1); } else { y = K + int(rng, 1, 4); z = y + int(rng, 1, 6); }
    const s = [M, M, K, y, z];
    if (z > y && y > K && ok(s)) correct = s;
  }
  if (!correct) throw new Error('no correct set');
  const near = [];
  const tryAdd = (s) => { if (s && s.every((v) => Number.isInteger(v) && v >= 0) && !ok(s) && !near.some((o) => sorted(o).join() === sorted(s).join())) near.push(s); };
  const [, , , y, z] = correct;
  tryAdd([M, K, K, y, z]); // mode is K
  tryAdd([M, M, M + 1, K, z]); // median wrong but K sits in the middle when unsorted
  tryAdd([M - 1, M, K, y, z]); // no mode
  tryAdd([M, M, K, K, z]); // two modes
  tryAdd([M, M, K + 1, y + 1, z]); // median off by one
  tryAdd([M, M, y, K - 1, z]);
  if (meanT !== null) tryAdd([M, M, K, y + 1, z]);
  if (R !== null) tryAdd([M, M, K, y, z + 1]);
  const show = (s, trap = false) => {
    if (trap) { const others = shuffle(rng, s.filter((v, i) => i !== s.indexOf(K))); return [others[0], others[1], K, others[2], others[3]].join(', '); }
    return unsortedOrder(rng, s).join(', ');
  };
  const distractors = shuffle(rng, near).slice(0, 3).map((s) => show(s, s.includes(K) && median(s) !== K));
  const cond = [`a mode of ${M}`, `a median of ${K}`];
  if (meanT !== null) cond.push(`a mean of ${meanT}`);
  if (R !== null) cond.push(`a range of ${R}`);
  const condText = cond.length === 2 ? `${cond[0]} and ${cond[1]}` : `${cond.slice(0, -1).join(', ')} and ${cond[cond.length - 1]}`;
  const sc = sorted(correct);
  return {
    prompt: `Which set of five numbers has ${condText}?`,
    answer: show(correct),
    distractors,
    count: 4,
    solution: [
      'Put each set in order, then check every condition.',
      `For the correct set, in order: ${sc.join(', ')}.`,
      `${M} appears twice (mode ${M}); the middle value is ${K} (median ${K})${meanT !== null ? `; total $${sc.join(' + ')} = ${sum(sc)}$ and $${sum(sc)} \\div 5 = ${meanT}$` : ''}${R !== null ? `; range $${sc[4]} - ${sc[0]} = ${R}$` : ''}.`,
      'The other sets each fail a condition (remember to find the median <b>after</b> ordering).',
      `Answer: ${sc.join(', ')} (in any order)`,
    ],
  };
}, { title: 'Which set has these averages?' });

/* ------------------------------------------------------------------ */
/* Problems with averages                                               */
/* ------------------------------------------------------------------ */

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June'];
// Each context: n = number of values including the missing one; labels for the known values; lo/hi; text(known, m).
const MISSING_CTX = [
  { n: 5, lo: 60, hi: 99, unit: '', make: (k, m) => `The table shows the attendance at a youth club from Monday to Thursday.${table([DAYS.slice(0, 4), k.map((v) => num(v))])}For all five days, Monday to Friday, the mean attendance is ${num(m)}.<br>Work out the attendance on Friday.` },
  { n: 6, lo: 5, hi: 70, unit: 'runs', make: (k, m) => `A cricketer scores ${k.map((v) => num(v)).join(', ')} runs in her first five innings.<br>After her sixth innings her mean score is ${num(m)} runs.<br>How many runs did she score in her sixth innings?` },
  { n: 5, lo: 20, hi: 48, unit: '', max: 50, make: (k, m, nm) => `${nm[0]} has taken four tests, each out of 50. The marks are ${k.map((v) => num(v)).join(', ')}.<br>${nm[0]} wants a mean mark of ${num(m)} over five tests.<br>What mark is needed in the fifth test?` },
  { n: 6, lo: 15, hi: 60, unit: 'cm', make: (k, m) => `A gardener has six tomato plants. The heights of five of them are ${k.map((v) => `${v} cm`).join(', ')}.<br>The mean height of all six plants is ${num(m)} cm.<br>Work out the height of the sixth plant.` },
  { n: 5, lo: 8, hi: 40, unit: '', make: (k, m) => `A café counts its customers each hour. In the first four hours it has ${k.map((v) => num(v)).join(', ')} customers.<br>The mean number of customers per hour over the first five hours is ${num(m)}.<br>How many customers came in the fifth hour?` },
  { n: 5, lo: 350, hi: 700, unit: 'g', make: (k, m) => `A box contains five melons. Four of them have masses ${k.map((v) => `${num(v)} g`).join(', ')}.<br>The mean mass of the five melons is ${num(m)} g.<br>Work out the mass of the fifth melon.` },
  { n: 5, lo: 2, hi: 16, unit: 'years', make: (k, m) => `A family has five children. Four of them are aged ${k.map((v) => num(v)).join(', ')} years.<br>The mean age of the five children is ${num(m)} years.<br>How old is the fifth child?` },
  { n: 5, lo: 12, hi: 80, unit: '£', make: (k, m) => `Five friends raised money for charity. Four of them raised ${k.map((v) => money(v)).join(', ')}.<br>The mean amount raised by the five friends was ${money(m)}.<br>How much did the fifth friend raise?` },
  { n: 6, lo: 10, hi: 45, unit: 'goals', make: (k, m) => `A netball team scores ${k.map((v) => num(v)).join(', ')} goals in its first five matches.<br>After six matches, the team's mean is ${num(m)} goals per match.<br>How many goals did the team score in the sixth match?` },
  { n: 7, lo: 0, hi: 14, unit: 'mm', make: (k, m) => `The rainfall in a town from Monday to Saturday was ${k.map((v) => `${v} mm`).join(', ')}.<br>The mean daily rainfall for the whole week, Monday to Sunday, was ${num(m)} mm.<br>How much rain fell on Sunday?` },
  { n: 7, lo: 2, hi: 15, unit: 'km', make: (k, m, nm) => `${nm[1]} runs every day. From Monday to Saturday, ${nm[1]} runs ${k.map((v) => `${v} km`).join(', ')}.<br>The mean daily distance for the seven days is ${num(m)} km.<br>How far does ${nm[1]} run on Sunday?` },
  { n: 5, lo: 300, hi: 900, unit: '', make: (k, m) => `The numbers of visitors to a museum each month were:${table([MONTHS.slice(0, 4), k.map((v) => num(v))])}The mean number of visitors per month from January to May was ${num(m)}.<br>How many visitors were there in May?` },
  { n: 6, lo: 1, hi: 9, unit: '£', make: (k, m, nm) => `${nm[2]} gets pocket money from five relatives: ${k.map((v) => money(v)).join(', ')}.<br>After a sixth relative also gives some money, the mean amount per relative is ${money(m)}.<br>How much did the sixth relative give?` },
  { n: 6, lo: 20, hi: 70, unit: 'eggs', make: (k, m) => `A farmer collects ${k.map((v) => num(v)).join(', ')} eggs on five days.<br>The mean number of eggs per day over six days is ${num(m)}.<br>How many eggs did she collect on the sixth day?` },
];

export const avgMissing = sgen('stat-avg-missing-value', 'stat-averages-problems', (rng, d) => {
  const ctx = pick(rng, MISSING_CTX);
  const n = ctx.n;
  const known = randInts(rng, n - 1, ctx.lo, ctx.hi);
  const target = int(rng, ctx.lo, ctx.max ?? ctx.hi);
  const m = Math.round((sum(known) + target) / n);
  const ans = n * m - sum(known);
  if (ans < ctx.lo || ans > (ctx.max ?? ctx.hi) * 1.15 || ans < 0) throw new Error('missing out of range');
  if (d === 'easy' && (n > 5 || ctx.hi > 100)) throw new Error('easy wants 5 smallish values');
  if (d === 'hard' && (n < 6 || ctx.hi < 40)) throw new Error('hard wants more, larger values');
  const f = fmtU(ctx.unit === 'runs' || ctx.unit === 'goals' || ctx.unit === 'eggs' || ctx.unit === 'years' ? '' : ctx.unit);
  const nm = names(rng, 3);
  return {
    prompt: ctx.make(known, m, nm),
    answer: f(ans),
    distractors: numDistractors(ans, [m, (n - 1) * m - sum(known), mean(known), n * m, ans + 10, ans - 10, ans + n, 2 * m - known[0]], { fmt: f, integer: true }),
    typed: { kind: 'number', value: ans },
    solution: [
      'Use <b>total = mean × number of values</b>.',
      `Total of all ${n} values: $${num(m)} \\times ${n} = ${num(n * m).replace(/,/g, '{,}')}$`,
      `Total of the ${n - 1} known values: $${known.join(' + ')} = ${num(sum(known)).replace(/,/g, '{,}')}$`,
      `Missing value: $${num(n * m).replace(/,/g, '{,}')} - ${num(sum(known)).replace(/,/g, '{,}')} = ${num(ans).replace(/,/g, '{,}')}$`,
      `Answer: ${f(ans)}`,
    ],
  };
}, { title: 'Missing value from the mean', word: true });

// Mean changes when one value is added or removed.
const NEWVAL_CTX = [
  { add: true, make: (n, a, b) => `The mean mass of the ${n} players in a rowing crew is ${a} kg.<br>A new player joins the crew and the mean mass becomes ${b} kg.<br>What is the mass of the new player?`, unit: 'kg' },
  { add: true, make: (n, a, b, nm) => `The mean of ${nm[0]}'s first ${n} test marks is ${a}.<br>After one more test, the mean of all the marks is ${b}.<br>What mark did ${nm[0]} get in the last test?`, unit: '' },
  { add: true, make: (n, a, b) => `The mean age of the ${n} members of a choir is ${a} years.<br>One more person joins and the mean age goes up to ${b} years.<br>How old is the new member?`, unit: 'years' },
  { add: true, make: (n, a, b, nm) => `${nm[1]}'s mean bowling score for ${n} games is ${a}.<br>After one more game the mean score is ${b}.<br>What did ${nm[1]} score in that game?`, unit: '' },
  { add: false, make: (n, a, b) => `The mean height of the ${n} players in a basketball squad is ${a} cm.<br>One player leaves the squad. The mean height of the others is ${b} cm.<br>How tall is the player who left?`, unit: 'cm' },
  { add: false, make: (n, a, b) => `A bag holds ${n} apples with a mean mass of ${a} g.<br>One apple is eaten. The mean mass of the apples left is ${b} g.<br>What was the mass of the apple that was eaten?`, unit: 'g' },
  { add: true, make: (n, a, b) => `A shop's mean daily takings over ${n} days are £${a}.<br>After one more day, the mean daily takings are £${b}.<br>How much did the shop take on the extra day?`, unit: '£' },
  { add: false, make: (n, a, b) => `The mean number of points scored by ${n} players in a quiz is ${a}.<br>One player's score is removed and the mean of the rest becomes ${b}.<br>How many points did that player score?`, unit: '' },
  { add: true, make: (n, a, b) => `The mean of ${n} numbers is ${a}.<br>Another number is added to the list. The mean of all the numbers is now ${b}.<br>What number was added?`, unit: '' },
  { add: true, make: (n, a, b) => `A darts player has a mean score of ${a} for her first ${n} throws.<br>After her next throw her mean score is ${b}.<br>What did she score with that throw?`, unit: '' },
  { add: false, make: (n, a, b) => `A swimming squad of ${n} swimmers has a mean time of ${a} seconds for one length.<br>When the slowest swimmer is left out, the mean time of the others is ${b} seconds.<br>What is the slowest swimmer's time?`, unit: 'seconds' },
  { add: true, make: (n, a, b) => `${n} friends have a mean of ${a} followers each on a social media app.<br>Another friend joins the group and the mean becomes ${b} followers.<br>How many followers does the new friend have?`, unit: '' },
  { add: false, make: (n, a, b) => `The mean weekly pocket money of ${n} children is £${a}.<br>When the eldest child is not counted, the mean is £${b}.<br>How much pocket money does the eldest child get?`, unit: '£' },
];

export const avgNewValue = sgen('stat-avg-new-value', 'stat-averages-problems', (rng, d) => {
  const ctx = pick(rng, NEWVAL_CTX);
  const n = size(d, int(rng, 4, 5), int(rng, 5, 9), int(rng, 7, 15));
  const scale = ctx.unit === 'kg' ? [60, 85] : ctx.unit === 'cm' ? [175, 200] : ctx.unit === 'g' ? [110, 160] : ctx.unit === 'years' ? [25, 55] : ctx.unit === 'seconds' ? [30, 45] : ctx.unit === '£' ? [8, 400] : [10, 80];
  const a = int(rng, scale[0], scale[1]);
  const delta = size(d, 1, pick(rng, [1, 2, 3]), pick(rng, [2, 3, 4, 5])) * (ctx.unit === 'seconds' && !ctx.add ? -1 : 1);
  const b = a + delta;
  const ans = ctx.add ? (n + 1) * b - n * a : n * a - (n - 1) * b;
  if (ans <= 0) throw new Error('bad value');
  // keep the new or removed value realistic for the context
  const LIM = { kg: [50, 115], cm: [160, 215], g: [80, 220], years: [16, 85], seconds: [25, 70], '£': [1, 3 * a], '': [1, 100] }[ctx.unit];
  if (ans < LIM[0] || ans > LIM[1]) throw new Error('unrealistic value');
  const f = fmtU(ctx.unit === 'years' ? 'years' : ctx.unit);
  const nm = names(rng, 2);
  const big = ctx.add ? n + 1 : n; const small = ctx.add ? n : n - 1;
  const bigM = ctx.add ? b : a; const smallM = ctx.add ? a : b;
  return {
    prompt: ctx.make(n, a, b, nm),
    answer: f(ans),
    distractors: numDistractors(ans, [b, a, Math.abs(b - a), n * b - n * a, big * Math.abs(b - a), (n + 1) * b, ans + n, ans - n, a + b], { fmt: f, integer: true }),
    typed: { kind: 'number', value: ans },
    solution: [
      'Work with <b>totals</b>: total = mean × number of values.',
      `Total for ${big} values: $${big} \\times ${bigM} = ${tnum(big * bigM)}$`,
      `Total for ${small} values: $${small} \\times ${smallM} = ${tnum(small * smallM)}$`,
      `The difference is the value ${ctx.add ? 'added' : 'removed'}: $${tnum(big * bigM)} - ${tnum(small * smallM)} = ${tnum(ans)}$`,
      `Answer: ${f(ans)}`,
    ],
  };
}, { title: 'Mean changes when a value is added or removed', word: true });

// Combined means. Each context: a(n, mean) and b(n, mean) sentences; bSize(n) names group B without its mean.
const COMBINE_CTX = [
  { A: 'boys', B: 'girls', what: 'height', unit: 'm', base: [1.4, 1.7], dp: 2, all: 'all the students in the class', a: (n, p) => `In a class, the mean height of the ${n} boys is ${p} m.`, b: (n, q) => `The mean height of the ${n} girls is ${q} m.`, bSize: (n) => `There are ${n} girls in the class.` },
  { A: 'Class A', B: 'Class B', what: 'mark', unit: '', base: [40, 80], dp: 0, all: 'all the students in both classes', a: (n, p) => `Class A has ${n} students. Their mean test mark is ${p}.`, b: (n, q) => `Class B has ${n} students. Their mean mark is ${q}.`, bSize: (n) => `Class B has ${n} students.` },
  { A: 'morning customers', B: 'afternoon customers', what: 'amount spent', unit: '£', base: [8, 40], dp: 2, all: 'all the customers that day', a: (n, p) => `On Saturday a shop had ${n} customers in the morning, who spent a mean of ${money(p, { forcePence: true })} each.`, b: (n, q) => `It had ${n} customers in the afternoon, who spent a mean of ${money(q, { forcePence: true })} each.`, bSize: (n) => `It had ${n} customers in the afternoon.` },
  { A: 'people on coach A', B: 'people on coach B', what: 'age', unit: 'years', base: [20, 60], dp: 1, all: 'all the people on the trip', a: (n, p) => `Two coaches take people on a trip. The ${n} people on coach A have a mean age of ${p} years.`, b: (n, q) => `The ${n} people on coach B have a mean age of ${q} years.`, bSize: (n) => `There are ${n} people on coach B.` },
  { A: 'Farm A eggs', B: 'Farm B eggs', what: 'mass', unit: 'g', base: [52, 68], dp: 1, all: 'all the eggs in both samples', a: (n, p) => `A sample of ${n} eggs from Farm A has a mean mass of ${p} g.`, b: (n, q) => `A sample of ${n} eggs from Farm B has a mean mass of ${q} g.`, bSize: (n) => `A sample of ${n} eggs is also taken from Farm B.` },
  { A: 'adults', B: 'children', what: 'time', unit: 'minutes', base: [20, 60], dp: 1, all: 'all the runners', a: (n, p) => `At a fun run, ${n} adults had a mean time of ${p} minutes.`, b: (n, q) => `${n} children had a mean time of ${q} minutes.`, bSize: (n) => `${n} children also took part.` },
  { A: 'Branch A staff', B: 'Branch B staff', what: 'number of hours worked per week', unit: 'hours', base: [20, 40], dp: 1, all: 'all the staff', a: (n, p) => `A company has two branches. The ${n} staff at Branch A work a mean of ${p} hours a week.`, b: (n, q) => `The ${n} staff at Branch B work a mean of ${q} hours a week.`, bSize: (n) => `There are ${n} staff at Branch B.` },
  { A: 'first-team matches', B: 'second-team matches', what: 'number of goals per match', unit: '', base: [1, 4], dp: 1, all: 'all these matches', a: (n, p) => `A football club's first team scored a mean of ${p} goals per match in ${n} matches.`, b: (n, q) => `The second team scored a mean of ${q} goals per match in ${n} matches.`, bSize: (n) => `The second team played ${n} matches.` },
  { A: 'Orchard A apples', B: 'Orchard B apples', what: 'mass', unit: 'g', base: [100, 180], dp: 1, all: 'all the apples', a: (n, p) => `${n} apples from Orchard A have a mean mass of ${p} g.`, b: (n, q) => `${n} apples from Orchard B have a mean mass of ${q} g.`, bSize: (n) => `${n} apples are also picked from Orchard B.` },
  { A: 'juniors', B: 'seniors', what: 'number of lengths swum', unit: 'lengths', base: [20, 60], dp: 1, all: 'all the swimmers', a: (n, p) => `At a sponsored swim, ${n} juniors swam a mean of ${p} lengths each.`, b: (n, q) => `${n} seniors swam a mean of ${q} lengths each.`, bSize: (n) => `${n} seniors also took part.` },
  { A: 'Monday calls', B: 'Tuesday calls', what: 'call length', unit: 'minutes', base: [3, 12], dp: 1, all: 'all the calls on both days', a: (n, p) => `A helpline took ${n} calls on Monday with a mean length of ${p} minutes.`, b: (n, q) => `It took ${n} calls on Tuesday with a mean length of ${q} minutes.`, bSize: (n) => `It took ${n} calls on Tuesday.` },
  { A: 'Year 7 students', B: 'Year 8 students', what: 'reading time', unit: 'hours', base: [2, 9], dp: 1, all: 'all these students', a: (n, p) => `${n} Year 7 students read for a mean of ${p} hours last week.`, b: (n, q) => `${n} Year 8 students read for a mean of ${q} hours.`, bSize: (n) => `${n} Year 8 students were also asked.` },
];

export const avgCombined = sgen('stat-avg-combined-mean', 'stat-averages-problems', (rng, d) => {
  const ctx = pick(rng, COMBINE_CTX);
  const reverse = d === 'hard' || (d === 'medium' && chance(rng, 0.4));
  const a = int(rng, 4, 20); const b = int(rng, 4, 20);
  if (a === b) throw new Error('equal groups');
  const span = ctx.base[1] - ctx.base[0];
  const unitStep = 10 ** -ctx.dp;
  const M = roundTo(ctx.base[0] + rng() * span, ctx.dp);
  // Backwards design: p − M = b·j·unit and q − M = −a·j·unit, so a(p − M) + b(q − M) = 0 and both are clean.
  const jMax = Math.floor((span * 0.3) / (Math.max(a, b) * unitStep));
  if (jMax < 1) throw new Error('groups too big for this context');
  const j = int(rng, 1, jMax) * (chance(rng) ? 1 : -1);
  const p = roundTo(M + b * j * unitStep, ctx.dp);
  const q = roundTo(M - a * j * unitStep, ctx.dp);
  // keep both group means realistic for the context
  const okV = (v) => v > 0 && v >= ctx.base[0] - span * 0.3 && v <= ctx.base[1] + span * 0.3;
  if (!okV(p) || !okV(q)) throw new Error('unrealistic group mean');
  // every option uses the same number of decimal places as the data
  const D = ctx.unit === '£' ? 2 : ctx.dp;
  const fmtV = (x) => (ctx.unit === '£' ? money(roundTo(x, 2), { forcePence: true }) : `${num(roundTo(x, D), D)}${ctx.unit ? ` ${ctx.unit}` : ''}`);
  const fm = fmtV;
  const tA = tidy(a * p); const tB = tidy(b * q); const tAll = tidy((a + b) * M);
  if (!reverse) {
    return {
      prompt: `${ctx.a(a, ctx.unit === '£' ? p : num(p, D))}<br>${ctx.b(b, ctx.unit === '£' ? q : num(q, D))}<br>Work out the mean ${ctx.what} for ${ctx.all}.`,
      answer: fmtV(M),
      distractors: [(p + q) / 2, (a * p + b * q) / Math.max(a, b), (p * b + q * a) / (a + b), M + unitStep * 3, M - unitStep * 3, (a * p + b * q) / 2]
        .filter((v) => v > 0 && Math.abs(v - M) > 1e-9 && isClean(roundTo(v, 2), 2)).map(fm),
      typed: { kind: 'number', value: M, tolerance: ctx.dp ? 0.005 : 0 },
      calculator: ctx.dp >= 1 || d !== 'easy',
      solution: [
        'You cannot just average the two means, because the groups are different sizes. Work with <b>totals</b>.',
        `Total for the ${ctx.A}: $${a} \\times ${tnum(p)} = ${tnum(tA)}$; total for the ${ctx.B}: $${b} \\times ${tnum(q)} = ${tnum(tB)}$`,
        `Combined total $= ${tnum(tAll)}$, shared between $${a} + ${b} = ${a + b}$`,
        `Mean $= ${tnum(tAll)} \\div ${a + b} = ${tnum(M)}$`,
        `Answer: ${fmtV(M)}`,
      ],
    };
  }
  return {
    prompt: `${ctx.a(a, ctx.unit === '£' ? p : num(p, D))}<br>${ctx.bSize(b)}<br>The mean ${ctx.what} for ${ctx.all} is ${fmtV(M)}.<br>Work out the mean ${ctx.what} for the ${ctx.B}.`,
    answer: fmtV(q),
    distractors: [2 * M - p, ((a + b) * M - a * p) / a, (b * M - a * p) / b + M, q + unitStep * 5, q - unitStep * 5, (a * M - b * p) / a + M, ((a + b) * M + a * p) / b]
      .filter((v) => v > 0 && Math.abs(v - q) > 1e-9 && isClean(roundTo(v, 2), 2)).map(fm),
    typed: { kind: 'number', value: q, tolerance: ctx.dp ? 0.005 : 0 },
    calculator: true,
    solution: [
      'Work with <b>totals</b> (total = mean × number). Don\'t just say the two means average to the overall mean.',
      `Total for everyone: $${a + b} \\times ${tnum(M)} = ${tnum(tAll)}$`,
      `Total for the ${ctx.A}: $${a} \\times ${tnum(p)} = ${tnum(tA)}$`,
      `Total for the ${ctx.B}: $${tnum(tAll)} - ${tnum(tA)} = ${tnum(tB)}$, so their mean is $${tnum(tB)} \\div ${b} = ${tnum(q)}$`,
      `Answer: ${fmtV(q)}`,
    ],
  };
}, { title: 'Combined means (and working backwards)', word: true });

// Means with algebra: relationships between people.
const ALG_CTX = [
  { kind: 'age' },
  { kind: 'count', verb: 'has', noun: 'stickers' },
  { kind: 'count', verb: 'has', noun: 'marbles' },
  { kind: 'count', verb: 'has', noun: 'football cards' },
  { kind: 'count', verb: 'read', noun: 'books', past: true },
  { kind: 'count', verb: 'caught', noun: 'fish', past: true },
  { kind: 'count', verb: 'scored', noun: 'points', past: true },
  { kind: 'count', verb: 'collected', noun: 'shells', past: true },
  { kind: 'count', verb: 'baked', noun: 'cakes', past: true },
  { kind: 'count', verb: 'sold', noun: 'raffle tickets', past: true },
  { kind: 'count', verb: 'took', noun: 'photos', past: true },
  { kind: 'money', verb: 'saved' },
  { kind: 'money', verb: 'raised', tail: ' for charity' },
  { kind: 'count', verb: 'planted', noun: 'trees', past: true },
];
const one = (noun) => (noun === 'fish' ? 'fish' : noun.replace(/s$/, ''));
export const avgAlgebra = sgen('stat-avg-algebra', 'stat-averages-problems', (rng, d) => {
  const ctx = pick(rng, ALG_CTX);
  const [A, B, C, D] = names(rng, 4);
  const people = d === 'hard' ? 4 : 3;
  const x = ctx.kind === 'age' ? int(rng, 3, 14) : int(rng, 4, 30);
  const a = int(rng, 1, 6); const k = pick(rng, [2, 3]);
  const bSign = chance(rng) ? 1 : -1;
  if (x + bSign * a <= 0) throw new Error('negative');
  const vals = { [A]: x, [B]: x + bSign * a, [C]: k * x };
  let extra = '';
  if (people === 4) { const e = int(rng, 2, 8); vals[D] = x + bSign * a + e; extra = phrase(D, B, e, 1); }
  const total = Object.values(vals).reduce((s, v) => s + v, 0);
  if (total % people) throw new Error('mean not integer');
  const m = total / people;
  function phrase(P, Q, amount, sgn) {
    if (ctx.kind === 'age') return `${P} is ${amount} ${amount === 1 ? 'year' : 'years'} ${sgn > 0 ? 'older' : 'younger'} than ${Q}.`;
    if (ctx.kind === 'money') return `${P} ${ctx.verb} £${amount} ${sgn > 0 ? 'more' : 'less'}${ctx.tail || ''} than ${Q}.`;
    return `${P} ${ctx.verb} ${amount} ${sgn > 0 ? 'more' : 'fewer'} ${amount === 1 ? one(ctx.noun) : ctx.noun} than ${Q}.`;
  }
  const times = k === 2 ? 'twice' : 'three times';
  const mult = ctx.kind === 'age' ? `${C} is ${times} as old as ${A}.` : ctx.kind === 'money' ? `${C} ${ctx.verb} ${times} as much${ctx.tail || ''} as ${A}.` : `${C} ${ctx.verb} ${times} as many ${ctx.noun} as ${A}.`;
  const meanLine = ctx.kind === 'age' ? `The mean of their ages is ${m} years.` : ctx.kind === 'money' ? `The mean amount ${ctx.verb} by the ${people} friends is £${m}.` : `The mean number of ${ctx.noun} for the ${people} friends is ${m}.`;
  const askP = pick(rng, people === 4 ? [C, D] : [C, B]);
  const PAST = { read: 'read', caught: 'catch', scored: 'score', collected: 'collect', baked: 'bake', sold: 'sell', took: 'take', planted: 'plant' };
  const askText = ctx.kind === 'age' ? `How old is ${askP}?`
    : ctx.kind === 'money' ? `How much money did ${askP} ${ctx.verb === 'saved' ? 'save' : 'raise for charity'}?`
      : ctx.past ? `How many ${ctx.noun} did ${askP} ${PAST[ctx.verb]}?` : `How many ${ctx.noun} does ${askP} have?`;
  const ans = vals[askP];
  const f = ctx.kind === 'money' ? (v) => money(v) : (v) => num(v);
  const off = (c) => (c === 0 ? '' : ` ${c > 0 ? '+' : '-'} ${Math.abs(c)}`);
  const exprs = { [A]: 'x', [B]: `x${off(bSign * a)}`, [C]: `${k}x` };
  const subst = { [A]: `${x}`, [B]: `${x}${off(bSign * a)}`, [C]: `${k} \\times ${x}` };
  if (people === 4) { exprs[D] = `x${off(vals[D] - x)}`; subst[D] = `${x}${off(vals[D] - x)}`; }
  const coef = people === 4 ? k + 3 : k + 2;
  const cst = total - coef * x;
  return {
    prompt: `${phrase(B, A, a, bSign)}<br>${mult}<br>${extra ? `${extra}<br>` : ''}${meanLine}<br>${askText}`,
    answer: f(ans),
    distractors: numDistractors(ans, [x, m, ...Object.values(vals), total, ans + a, ans - a, k * m], { fmt: f, integer: true }),
    typed: { kind: 'number', value: ans },
    solution: [
      `Let ${A}'s ${ctx.kind === 'age' ? 'age' : ctx.kind === 'money' ? 'amount' : `number of ${ctx.noun}`} be $x$. Then ${Object.keys(exprs).filter((p) => p !== A).map((p) => `${p} = $${exprs[p]}$`).join(', ')}.`,
      `The total is mean × ${people} $= ${m} \\times ${people} = ${total}$`,
      `So $${coef}x ${cst >= 0 ? '+' : '-'} ${Math.abs(cst)} = ${total}$, giving $${coef}x = ${total - cst}$ and $x = ${x}$.`,
      `So ${askP} $= ${subst[askP]} = ${ans}$`,
      `Answer: ${f(ans)}`,
    ],
  };
}, { title: 'Mean problems with algebra', word: true });

export const avgRange = sgen('stat-avg-range-problems', 'stat-averages-problems', (rng, d) => {
  if (d === 'hard') {
    // n positive numbers, mean and range given, n-2 known: find the other two.
    const n = 6;
    for (let t = 0; t < 200; t += 1) {
      const known = randInts(rng, 4, 2, 16);
      const lo = Math.min(...known); const hi = Math.max(...known);
      const R = int(rng, hi - lo + 3, 22);
      // one unknown is the new max (lo + R) — the other unknown u fits so that mean is integer m
      const big = lo + R;
      const rest = sum(known) + big;
      for (const m of [8, 9, 10, 11, 12, 13]) {
        const u = n * m - rest;
        if (u >= lo && u <= big && !known.includes(u) && u !== big) {
          return {
            prompt: `Six positive whole numbers have<br>a mean of ${m}<br>a range of ${R}<br>Four of the numbers are ${spaced(known)}Work out the other two numbers.`,
            answer: `${Math.min(u, big)} and ${Math.max(u, big)}`,
            distractors: [`${u + 1} and ${big - 1}`, `${hi + R} and ${n * m - sum(known) - hi - R}`, `${R} and ${n * m - sum(known) - R}`, `${u - 2} and ${big + 2}`, `${lo} and ${n * m - sum(known) - lo}`]
              .filter((s) => !s.includes('-') && !s.split(' and ').some((v) => Number(v) <= 0)),
            typed: { kind: 'list', values: [u, big] },
            count: 4,
            solution: [
              `Total of all six numbers $= ${m} \\times 6 = ${n * m}$`,
              `The smallest known number is ${lo}. The range is ${R}, so the largest number is $${lo} + ${R} = ${big}$ (none of the known numbers is that big).`,
              `The other number is $${n * m} - (${known.join(' + ')} + ${big}) = ${u}$, which is between ${lo} and ${big}, so the range is still ${R}.`,
              `Answer: ${Math.min(u, big)} and ${Math.max(u, big)}`,
            ],
          };
        }
      }
    }
    throw new Error('no range problem');
  }
  const variant = d === 'easy' ? pick(rng, ['largest', 'smallest']) : pick(rng, ['neg', 'mass', 'largest']);
  if (variant === 'mass') {
    const kg = int(rng, 3, 9); const g = int(rng, 1, 18) * 50; const r = int(rng, 4, 19) * 50;
    const tot = kg * 1000 + g + r;
    const ans = `${Math.floor(tot / 1000)} kg ${tot % 1000} g`;
    const wrong = (t) => `${Math.floor(t / 1000)} kg ${t % 1000} g`;
    const animal = pick(rng, ['puppies', 'kittens', 'lambs', 'rabbits', 'piglets']);
    return {
      prompt: `The masses of some ${animal} were recorded.<br>The smallest mass was ${kg} kg ${g} g.<br>The range of the masses was ${r} g.<br>What was the largest mass?`,
      answer: ans,
      distractors: [wrong(kg * 1000 + g - r), `${kg} kg ${g + r} g`, wrong(kg * 1000 + r), `${kg + r / 100} kg ${g} g`.replace(/\.\d+/, ''), wrong(tot + 100), wrong(tot - 100)].filter((s) => !/-|\d{4,} g/.test(s)),
      count: 4,
      solution: [
        '<b>Range</b> = largest − smallest, so largest = smallest + range.',
        `${kg} kg ${g} g = ${num(kg * 1000 + g)} g`,
        `$${kg * 1000 + g} + ${r} = ${tot}$ g`,
        `Answer: ${ans}`,
      ],
    };
  }
  const neg = variant === 'neg';
  const R = int(rng, 6, 25);
  const small = neg ? -int(rng, 2, 9) : int(rng, 2, 20);
  const askLargest = variant !== 'smallest';
  const large = small + R;
  const ans = askLargest ? large : small;
  const f = (v) => num(v);
  return {
    prompt: askLargest ? `The range of a set of numbers is ${R}.<br>The smallest number is ${num(small)}.<br>Work out the largest number.`
      : `The range of a set of numbers is ${R}.<br>The largest number is ${num(large)}.<br>Work out the smallest number.`,
    answer: f(ans),
    distractors: numDistractors(ans, askLargest ? [R - small, R - Math.abs(small), R, small - R, R + Math.abs(small) + 1, large + 1, large - 1, Math.abs(small) - R]
      : [large + R, R, R - large, large - R + 1, large - R - 1, -ans], { fmt: f, allowNeg: true }),
    typed: { kind: 'number', value: ans },
    solution: [
      '<b>Range</b> = largest − smallest.',
      askLargest ? `So largest = smallest + range $= ${num(small).replace('−', '-')} + ${R} = ${num(large).replace('−', '-')}$` : `So smallest = largest − range $= ${large} - ${R} = ${num(small).replace('−', '-')}$`,
      `Check: $${num(large).replace('−', '-')} - ${small < 0 ? `(${num(small).replace('−', '-')})` : small} = ${R}$ ✓`,
      `Answer: ${f(ans)}`,
    ],
  };
}, { title: 'Problems with the range' });

/* ------------------------------------------------------------------ */
/* Ungrouped frequency tables                                           */
/* ------------------------------------------------------------------ */

const FT_CTX = [
  { head: 'Number of goals', intro: 'The table shows the number of goals a football team scored in each of its matches this season.', who: 'matches', per: 'goals per match', start: 0 },
  { head: 'Number of pets', intro: 'Some students were asked how many pets they have.', who: 'students', per: 'pets per student', start: 0 },
  { head: 'Number of people', intro: 'A survey recorded the number of people in each car arriving at a car park.', who: 'cars', per: 'people per car', start: 1 },
  { head: 'Number of siblings', intro: 'Some students were asked how many brothers and sisters they have.', who: 'students', per: 'siblings per student', start: 0 },
  { head: 'Days absent', intro: 'The table shows the number of days some students were absent last term.', who: 'students', per: 'days absent per student', start: 0 },
  { head: 'Books read', intro: 'Some students recorded how many books they read during the summer holiday.', who: 'students', per: 'books per student', start: 0 },
  { head: 'Score', intro: 'Ravi rolls a dice many times and records the scores.', who: 'rolls', per: 'score', meanQ: 'Work out the mean score.', totalNoun: 'the scores', start: 1, max: 6 },
  { head: 'Portions of fruit', intro: 'Some adults were asked how many portions of fruit they ate yesterday.', who: 'adults', per: 'portions per adult', start: 0 },
  { head: 'Number of visits', intro: 'Some members of a gym recorded how many times they visited the gym last week.', who: 'members', per: 'visits per member', start: 0 },
  { head: 'Number of eggs', intro: 'A farmer counted the number of eggs in each nest in a field.', who: 'nests', per: 'eggs per nest', start: 1 },
  { head: 'Number of mistakes', intro: 'Some students did a typing test. The table shows how many mistakes they made.', who: 'students', per: 'mistakes per student', start: 0 },
  { head: 'Number of TVs', intro: 'Some households were asked how many TVs they have.', who: 'households', per: 'TVs per household', start: 0 },
  { head: 'Number of games', intro: 'Some students were asked how many video games they played last month.', who: 'students', per: 'games per student', start: 0 },
];

/** Make an ungrouped table: xs and frequencies, with constraints. */
function makeFreqTable(rng, d, { allowedN = null, meanDp = null, k = null, ctx }) {
  const kk = ctx.max ? ctx.max - ctx.start + 1 : k ?? size(d, 4, 5, 6); // a dice table always shows every face
  const start = ctx.start;
  if (ctx.max && start + kk - 1 > ctx.max) throw new Error('too many values');
  const xs = Array.from({ length: kk }, (_, i) => start + i);
  for (let t = 0; t < 400; t += 1) {
    const N = allowedN ? pick(rng, allowedN) : int(rng, size(d, 9, 20, 30), size(d, 25, 45, 70));
    const fs = peakedFreqs(rng, kk, N, { min: 1, peak: int(rng, 0, kk - 1) });
    const m = tidy(sum(xs.map((x, i) => x * fs[i])) / N);
    if (meanDp !== null && !isClean(m, meanDp)) continue;
    return { xs, fs, N, sfx: sum(xs.map((x, i) => x * fs[i])), mean: m };
  }
  throw new Error('no table');
}
const freqTableHtml = (rng, head, xs, fs, fhead = 'Frequency') => (chance(rng, 0.65)
  ? table([[head, fhead], ...xs.map((x, i) => [num(x), fs[i] === null ? '' : num(fs[i])])])
  : table([[head, ...xs.map((v) => num(v))], [fhead, ...fs.map((f) => (f === null ? '' : num(f)))]], { firstColHeader: true }));

export const freqMean = sgen('stat-freq-mean', 'stat-frequency-table', (rng, d) => {
  const ctx = pick(rng, FT_CTX);
  const T = makeFreqTable(rng, d, { ctx, allowedN: size(d, [10, 20, 25], [20, 25, 40, 50, 30, 24], null), meanDp: size(d, 1, 2, null) });
  const exact = isClean(T.mean, 2);
  const ans = exact ? T.mean : roundTo(T.mean, 1);
  if (d === 'hard' && exact) throw new Error('hard wants rounding');
  const dp = exact ? dpOf(ans) : 1;
  const f = (v) => num(roundTo(v, Math.max(dp, 0)), dp || null);
  const k = T.xs.length;
  const med = (() => { const all = []; T.xs.forEach((x, i) => { for (let j = 0; j < T.fs[i]; j += 1) all.push(x); }); return median(all); })();
  const modeX = T.xs[T.fs.indexOf(Math.max(...T.fs))];
  return {
    prompt: `${ctx.intro}${freqTableHtml(rng, ctx.head, T.xs, T.fs)}${ctx.meanQ || `Work out the mean number of ${ctx.per}.`}${exact ? (Number.isInteger(ans) ? '' : '<br>Give your answer as a decimal.') : '<br>Give your answer to 1 decimal place.'}`,
    answer: f(ans),
    distractors: numDistractors(ans, [T.sfx / k, T.N / k, sum(T.xs) / k, T.sfx, med, modeX, T.sfx / (T.N - 1), ans + 0.5, ans - 0.5], { fmt: (v) => num(v), dp }),
    typed: { kind: 'number', value: ans, ...(exact ? {} : { tolerance: 0.05 }) },
    calculator: !exact,
    solution: [
      `Multiply each value by its frequency to find the total of ${ctx.totalNoun || `all the ${ctx.per.split(' per ')[0]}`}.`,
      `$${T.xs.map((x, i) => `${x} \\times ${T.fs[i]}`).join(' + ')} = ${T.sfx}$`,
      `Divide by the total frequency, $${T.fs.join(' + ')} = ${T.N}$ (not by the ${k} rows!).`,
      `Mean $= ${T.sfx} \\div ${T.N} = ${num(exact ? T.mean : roundTo(T.mean, 3))}${exact ? '' : '\\ldots'}$`,
      `Answer: ${f(ans)}`,
    ],
  };
}, { title: 'Mean from a frequency table' });

export const freqMedian = sgen('stat-freq-median', 'stat-frequency-table', (rng, d) => {
  const ctx = pick(rng, FT_CTX);
  const T = makeFreqTable(rng, d, { ctx });
  const all = []; T.xs.forEach((x, i) => { for (let j = 0; j < T.fs[i]; j += 1) all.push(x); });
  const med = median(all);
  if (d === 'easy' && T.N % 2 === 0) throw new Error('easy wants odd N');
  const k = T.xs.length;
  const medF = median(T.fs);
  const modeX = T.xs[T.fs.indexOf(Math.max(...T.fs))];
  const pos = (T.N + 1) / 2;
  let cum = 0; const cums = T.fs.map((f) => (cum += f));
  return {
    prompt: `${ctx.intro}${freqTableHtml(rng, ctx.head, T.xs, T.fs)}Work out the median.`,
    answer: num(med),
    distractors: numDistractors(med, [T.xs[Math.floor((k - 1) / 2)], T.xs[Math.ceil((k - 1) / 2)], medF, pos, modeX, roundTo(T.mean, 1), T.N / 2, med + 1, med - 1], {}),
    typed: { kind: 'number', value: med },
    solution: [
      `There are $${T.fs.join(' + ')} = ${T.N}$ values, so the median is the ${T.N % 2 ? `${ordinal(pos)} value` : `mean of the ${ordinal(T.N / 2)} and ${ordinal(T.N / 2 + 1)} values`}.`,
      `Running totals: ${T.xs.map((x, i) => `up to ${x}: ${cums[i]}`).join('; ')}.`,
      T.N % 2 ? `The ${ordinal(pos)} value is in the row for ${med}.` : `The ${ordinal(T.N / 2)} and ${ordinal(T.N / 2 + 1)} values are ${all[T.N / 2 - 1]} and ${all[T.N / 2]}, so the median is ${num(med)}.`,
      `Careful: the median is a <b>value</b> from the first column, not a frequency or a position. Answer: ${num(med)}`,
    ],
  };
}, { title: 'Median from a frequency table' });

// Extra tables with larger values (only for mode and range, where "mean shoe size" style wording isn't needed).
const MODE_RANGE_EXTRA = [
  { head: 'Shoe size', intro: 'A shoe shop recorded the sizes of the shoes it sold one morning.', start: 4 },
  { head: 'Mark (out of 10)', intro: 'The table shows the marks of some students in a short quiz.', start: 3 },
  { head: 'Age (years)', intro: 'The table shows the ages of the members of a youth club.', start: 11 },
  { head: 'Number of matches', intro: 'Some boxes of matches were checked. The table shows how many matches were in each box.', start: 46 },
  { head: 'Number of sweets', intro: 'Some packets of sweets were opened and the sweets counted.', start: 18 },
];
export const freqModeRange = sgen('stat-freq-mode-range', 'stat-frequency-table', (rng, d) => {
  const ctx = pick(rng, [...FT_CTX.filter((c) => !c.max), ...MODE_RANGE_EXTRA]);
  const T = makeFreqTable(rng, d, { ctx });
  const fs = [...T.fs]; const xs = [...T.xs];
  const zeroEnd = d !== 'easy' && chance(rng, 0.7);
  if (zeroEnd) { xs.push(xs[xs.length - 1] + 1); fs.push(0); }
  const maxF = Math.max(...fs);
  if (fs.filter((f) => f === maxF).length > 1) throw new Error('two modes');
  const askMode = chance(rng);
  const modeX = xs[fs.indexOf(maxF)];
  const lastNZ = xs[fs.map((f) => f > 0).lastIndexOf(true)];
  const firstNZ = xs[fs.findIndex((f) => f > 0)];
  const r = lastNZ - firstNZ;
  if (askMode) {
    if (modeX === maxF) throw new Error('mode equals frequency');
    return {
      prompt: `${ctx.intro}${freqTableHtml(rng, ctx.head, xs, fs)}What is the mode?`,
      answer: num(modeX),
      distractors: numDistractors(modeX, [maxF, Math.min(...fs.filter((f) => f > 0)), xs[xs.length - 1], median(xs), T.N, modeX + 1, modeX - 1], {}),
      typed: { kind: 'number', value: modeX },
      solution: [
        'The <b>mode</b> is the value with the <b>highest frequency</b>.',
        `The highest frequency is ${maxF}, in the row for ${modeX}.`,
        `The mode is the value ${modeX}, not the frequency ${maxF}.`,
        `Answer: ${modeX}`,
      ],
    };
  }
  return {
    prompt: `${ctx.intro}${freqTableHtml(rng, ctx.head, xs, fs)}Work out the range.`,
    answer: num(r),
    distractors: numDistractors(r, [xs[xs.length - 1] - xs[0], maxF - Math.min(...fs.filter((f) => f > 0)), maxF - Math.min(...fs), lastNZ, T.N, r + 1, xs.length], {}),
    typed: { kind: 'number', value: r },
    solution: [
      '<b>Range</b> = largest value − smallest value, using the values in the first column (not the frequencies).',
      zeroEnd ? `The value ${xs[xs.length - 1]} has a frequency of 0, so it never occurs: the largest value is ${lastNZ}.` : `The largest value is ${lastNZ} and the smallest is ${firstNZ}.`,
      `Range $= ${lastNZ} - ${firstNZ} = ${r}$`,
      `Answer: ${r}`,
    ],
  };
}, { title: 'Mode or range from a frequency table' });

const pl = (n, one, many) => `${num(n)} ${n === 1 ? one : many}`;
const CHART_FT_CTX = [
  { xTitle: 'Number of days absent', yTitle: 'Number of students', intro: (N) => `A record was kept of the number of days that ${N} students were absent one term.`, more: (c) => `How many students were absent for more than ${pl(c, 'day', 'days')}?`, total: 'Work out the total number of days missed by these students.', mean: 'Work out the mean number of days absent.', who: 'students', start: 0 },
  { xTitle: 'Number of goals', yTitle: 'Number of matches', intro: (N) => `A football team played ${N} matches. The chart shows the number of goals it scored in each match.`, more: (c) => `In how many matches did the team score more than ${pl(c, 'goal', 'goals')}?`, total: 'Work out the total number of goals the team scored.', mean: 'Work out the mean number of goals per match.', who: 'matches', start: 0 },
  { xTitle: 'Number of video games', yTitle: 'Number of students', intro: (N) => `${N} students were asked how many video games they played last month.`, more: (c) => `How many students played more than ${pl(c, 'game', 'games')}?`, total: 'Work out the total number of games played by these students.', mean: 'Work out the mean number of games played.', who: 'students', start: 0 },
  { xTitle: 'Number of people in the car', yTitle: 'Number of cars', intro: (N) => `The number of people in each of ${N} cars was recorded.`, more: (c) => `How many cars had more than ${pl(c, 'person', 'people')} in them?`, total: 'Work out the total number of people in these cars.', mean: 'Work out the mean number of people per car.', who: 'cars', start: 1 },
  { xTitle: 'Number of pets', yTitle: 'Number of families', intro: (N) => `${N} families were asked how many pets they own.`, more: (c) => `How many families own more than ${pl(c, 'pet', 'pets')}?`, total: 'Work out the total number of pets owned by these families.', mean: 'Work out the mean number of pets per family.', who: 'families', start: 0 },
  { xTitle: 'Number of cups of tea', yTitle: 'Number of people', intro: (N) => `${N} people recorded how many cups of tea they drank yesterday.`, more: (c) => `How many people drank more than ${pl(c, 'cup', 'cups')} of tea?`, total: 'Work out the total number of cups of tea these people drank.', mean: 'Work out the mean number of cups of tea per person.', who: 'people', start: 0 },
];

export const freqChart = sgen('stat-freq-chart', 'stat-frequency-table', (rng, d) => {
  const ctx = pick(rng, CHART_FT_CTX);
  const T = makeFreqTable(rng, d, { ctx, k: size(d, 5, 5, 6), allowedN: size(d, null, [20, 25, 40, 50, 30], [20, 25, 40, 50, 30, 32, 24]), meanDp: 2 });
  const style = chance(rng) ? 'line' : 'bar';
  const yMax = Math.max(...T.fs) + 1;
  const visual = barChart({ categories: T.xs.map(String), series: [{ name: '', values: T.fs }], style, y: { max: yMax, step: 1, title: ctx.yTitle }, xTitle: ctx.xTitle, width: 420, height: 300, gap: 0.5 });
  const q = size(d, pick(rng, ['more', 'total']), pick(rng, ['total', 'mean']), 'mean');
  const k = T.xs.length;
  const products = `${T.xs.map((x, i) => `${x} \\times ${T.fs[i]}`).join(' + ')} = ${T.sfx}`;
  if (q === 'more') {
    const cut = T.xs[int(rng, 1, k - 2)];
    const ans = sum(T.fs.filter((_, i) => T.xs[i] > cut));
    return {
      prompt: `${ctx.intro(T.N)}<br>${ctx.more(cut)}`,
      visual,
      answer: num(ans),
      distractors: numDistractors(ans, [sum(T.fs.filter((_, i) => T.xs[i] >= cut)), T.fs[T.xs.indexOf(cut) + 1], T.N - ans, sum(T.xs.filter((x) => x > cut)), ans + 1, ans - 1], { integer: true }),
      typed: { kind: 'number', value: ans },
      solution: [`"More than ${cut}" means ${T.xs.filter((x) => x > cut).join(', ')} (not ${cut} itself).`, (T.fs.filter((_, i) => T.xs[i] > cut).length > 1 ? `Read those bars and add the frequencies: $${T.fs.filter((_, i) => T.xs[i] > cut).join(' + ')} = ${ans}$` : `Read that bar: ${ans}.`), `Answer: ${ans}`],
    };
  }
  if (q === 'total') {
    return {
      prompt: `${ctx.intro(T.N)}<br>${ctx.total}`,
      visual,
      answer: num(T.sfx),
      distractors: numDistractors(T.sfx, [T.N, sum(T.xs), T.sfx + T.fs[0], T.sfx - T.fs[k - 1], T.sfx + 10, T.sfx - 5], { integer: true }),
      typed: { kind: 'number', value: T.sfx },
      solution: ['Each bar shows how many have that value. Multiply each value by its frequency and add.', `$${products}$`, `Answer: ${T.sfx}`],
    };
  }
  const ans = T.mean;
  return {
    prompt: `${ctx.intro(T.N)}<br>${ctx.mean}`,
    visual,
    answer: num(ans),
    distractors: numDistractors(ans, [T.sfx / k, T.N / k, sum(T.xs) / k, T.sfx, median(T.xs), T.xs[T.fs.indexOf(Math.max(...T.fs))], ans + 0.5, ans - 0.4], {}),
    typed: { kind: 'number', value: ans },
    solution: [
      'Read the frequency for each value from the chart.',
      `Total $= ${products}$`,
      `Mean $= ${T.sfx} \\div ${T.N} = ${num(ans)}$ (divide by the number of ${ctx.who}, ${T.N}).`,
      `Answer: ${num(ans)}`,
    ],
  };
}, { title: 'Averages from a bar or vertical line chart' });

const FT_TOTAL = {
  'Number of goals': (t) => `Altogether the team scored ${t} goals.`,
  'Number of pets': (t) => `Altogether the students have ${t} pets.`,
  'Number of people': (t) => `Altogether there were ${t} people in the cars.`,
  'Number of siblings': (t) => `Altogether the students have ${t} brothers and sisters.`,
  'Days absent': (t) => `Altogether the students were absent for ${t} days.`,
  'Books read': (t) => `Altogether the students read ${t} books.`,
  'Portions of fruit': (t) => `Altogether the adults ate ${t} portions of fruit.`,
  'Number of visits': (t) => `Altogether the members made ${t} visits.`,
  'Number of eggs': (t) => `Altogether there were ${t} eggs.`,
  'Number of mistakes': (t) => `Altogether the students made ${t} mistakes.`,
  'Number of TVs': (t) => `Altogether the households have ${t} TVs.`,
  'Number of games': (t) => `Altogether the students played ${t} games.`,
};
const coefX = (c) => (c === 1 ? 'x' : `${num(c)}x`);

export const freqMissing = sgen('stat-freq-missing', 'stat-frequency-table', (rng, d) => {
  const ctx = pick(rng, FT_CTX.filter((c) => !c.max));
  const T = makeFreqTable(rng, d, { ctx, k: size(d, 4, 5, 5) });
  const idx = int(rng, 1, T.xs.length - 1);
  const v = T.xs[idx];
  const xAns = T.fs[idx];
  const tableHtml = table([[ctx.head, 'Frequency'], ...T.xs.map((x, i) => [num(x), i === idx ? '$x$' : num(T.fs[i])])]);
  const otherF = sum(T.fs) - xAns; const otherFX = T.sfx - v * xAns;
  if (d === 'easy') {
    return {
      prompt: `${ctx.intro}${tableHtml}${FT_TOTAL[ctx.head](T.sfx)}<br>Work out the value of $x$.`,
      answer: num(xAns),
      distractors: numDistractors(xAns, [T.sfx - otherFX, (T.sfx - otherFX) * v, T.N - otherF, T.sfx - otherF, xAns + 1, xAns - 1, Math.round(T.sfx / T.xs.length)], { integer: true }),
      typed: { kind: 'number', value: xAns },
      solution: [
        `Each row adds value × frequency to the total. The other rows give $${T.xs.map((w, i) => (i === idx ? null : `${w} \\times ${T.fs[i]}`)).filter(Boolean).join(' + ')} = ${otherFX}$`,
        `So $${coefX(v)} = ${T.sfx} - ${otherFX} = ${T.sfx - otherFX}$`,
        `$x = ${T.sfx - otherFX} \\div ${v} = ${xAns}$`,
        `Answer: $x = ${xAns}$`,
      ],
    };
  }
  if (!isClean(T.mean, 1) || Math.abs(v - T.mean) < 1e-9) throw new Error('mean not clean'); // 1 dp keeps the algebra doable by hand
  const m = T.mean; const left = tidy(m * otherF - otherFX); const c = tidy(v - m);
  const step3 = c > 0 ? `$${coefX(c)} = ${num(tidy(m * otherF))} - ${otherFX} = ${num(left)}$` : `$${otherFX} - ${num(tidy(m * otherF))} = ${coefX(-c)}$, so $${coefX(-c)} = ${num(-left)}$`;
  return {
    prompt: `${ctx.intro}${tableHtml}The mean number of ${ctx.per} is ${num(m)}.<br>Work out the value of $x$.`,
    answer: num(xAns),
    distractors: numDistractors(xAns, [Math.round(m * otherF) - otherFX, xAns + 1, xAns - 1, xAns + 2, T.N - otherF + 1, Math.round(m * T.xs.length)], { integer: true }),
    typed: { kind: 'number', value: xAns },
    solution: [
      `Total frequency $= ${otherF} + x$; total of the values $= ${otherFX} + ${coefX(v)}$.`,
      `Total = mean × frequency, so $${otherFX} + ${coefX(v)} = ${num(m)}(${otherF} + x) = ${num(tidy(m * otherF))} + ${coefX(m)}$`,
      `Collect the $x$ terms: ${step3}`,
      `$x = ${num(Math.abs(left))} \\div ${num(Math.abs(c))} = ${xAns}$`,
      `Answer: $x = ${xAns}$`,
    ],
  };
}, { title: 'Missing frequency from the total or mean' });

/* ------------------------------------------------------------------ */
/* Grouped data                                                         */
/* ------------------------------------------------------------------ */

export const GROUPED_CTX = [
  { v: 't', head: 'Time, $t$ (minutes)', unit: 'minutes', what: 'the times taken by some students to travel to school', who: 'students', starts: [0], widths: [5, 10], noun: 'time' },
  { v: 'h', head: 'Height, $h$ (cm)', unit: 'cm', what: 'the heights of some tomato plants', who: 'plants', starts: [0, 10, 20], widths: [10, 20], noun: 'height' },
  { v: 'm', head: 'Mass, $m$ (grams)', unit: 'g', what: 'the masses of some apples', who: 'apples', starts: [60, 80, 100], widths: [10, 20], noun: 'mass' },
  { v: 'x', head: 'Amount spent, $x$ (£)', unit: '£', what: 'the amounts some customers spent in a shop', who: 'customers', starts: [0], widths: [10, 20], noun: 'amount spent', le: true },
  { v: 'l', head: 'Length, $l$ (cm)', unit: 'cm', what: 'the lengths of some fish caught in a river', who: 'fish', starts: [10, 20], widths: [5, 10], noun: 'length' },
  { v: 'd', head: 'Distance, $d$ (km)', unit: 'km', what: 'the distances cycled by members of a cycling club last weekend', who: 'members', starts: [0, 10], widths: [10, 20], noun: 'distance' },
  { v: 't', head: 'Time, $t$ (hours)', unit: 'hours', what: 'the time some teenagers spent on social media last week', who: 'teenagers', starts: [0], widths: [2, 4], noun: 'time' },
  { v: 'a', head: 'Age, $a$ (years)', unit: 'years', what: 'the ages of people at a swimming pool one morning', who: 'people', starts: [0, 10], widths: [10, 20], noun: 'age', le: true },
  { v: 'w', head: 'Mass, $w$ (kg)', unit: 'kg', what: 'the masses of some suitcases checked in at an airport', who: 'suitcases', starts: [0, 5], widths: [5, 10], noun: 'mass' },
  { v: 's', head: 'Speed, $s$ (mph)', unit: 'mph', what: 'the speeds of cars passing a speed camera', who: 'cars', starts: [20], widths: [5, 10], noun: 'speed' },
  { v: 't', head: 'Time, $t$ (seconds)', unit: 'seconds', what: 'the times some runners took to run 200 m', who: 'runners', starts: [20, 24], widths: [2, 4], noun: 'time' },
  { v: 'h', head: 'Rainfall, $r$ (mm)', unit: 'mm', what: 'the daily rainfall in a town during April', who: 'days', starts: [0], widths: [2, 4, 5], noun: 'rainfall', fixedN: 30 },
  { v: 'w', head: 'Wingspan, $w$ (cm)', unit: 'cm', what: 'the wingspans of some birds caught and released by a bird ringer', who: 'birds', starts: [10, 15, 20], widths: [5], noun: 'wingspan' },
];
GROUPED_CTX[11].v = 'r';
export const fmtUnit = (unit, v, dp = null) => (unit === '£' ? money(v, { forcePence: dp === 2 || !Number.isInteger(v) }) : `${dp === null ? num(v) : num(v, dp)}${unit ? ` ${unit}` : ''}`);

/** Grouped frequency table data. */
export function makeGrouped(rng, d, { k = null, allowedN = null, ctx = null, anyPeak = false } = {}) {
  ctx = ctx || pick(rng, GROUPED_CTX);
  const kk = k ?? size(d, 4, pick(rng, [4, 5]), 5);
  const w = pick(rng, ctx.widths); const start = pick(rng, ctx.starts);
  const N = ctx.fixedN ?? pick(rng, allowedN || [20, 25, 30, 40, 50, 60, 80]);
  const fs = peakedFreqs(rng, kk, N, { min: 1, ...(anyPeak ? { peak: pick(rng, [0, kk - 1, int(rng, 0, kk - 1)]) } : {}) });
  const classes = fs.map((f, i) => ({ a: start + i * w, b: start + (i + 1) * w, f, mid: start + (i + 0.5) * w }));
  return { ctx, classes, N, w };
}
export const classTex = (ctx, c) => `$${ineq(c.a, c.b, ctx.v, ctx.le ? 'le-lt' : 'lt-le')}$`;
export const groupedTable = (ctx, classes, extraCols = []) => table([[ctx.head, 'Frequency', ...extraCols], ...classes.map((c) => [classTex(ctx, c), c.f === null ? '' : num(c.f), ...extraCols.map(() => '')])]);

export const groupedMean = sgen('stat-grouped-mean', 'stat-grouped-estimate', (rng, d) => {
  let G; let est; let exact;
  for (let t = 0; t < 60; t += 1) {
    G = makeGrouped(rng, d, { allowedN: size(d, [20, 25, 40, 50, 10], [20, 25, 40, 50, 30, 60], [30, 35, 45, 60, 70, 36, 48]) });
    est = tidy(sum(G.classes.map((c) => c.f * c.mid)) / G.N);
    exact = isClean(est, size(d, 1, 2, 2));
    if (d === 'hard' ? !exact : exact) break;
    G = null;
  }
  if (!G) throw new Error('no grouped data');
  const { ctx, classes, N } = G;
  const askTotal = d === 'medium' && chance(rng, 0.3);
  const sfm = tidy(sum(classes.map((c) => c.f * c.mid)));
  const money2 = ctx.unit === '£';
  const ans = askTotal ? sfm : exact ? est : roundTo(est, 1);
  const dp = askTotal ? (Number.isInteger(sfm) ? 0 : 1) : exact ? dpOf(ans) : 1;
  const f = (v) => fmtUnit(ctx.unit, roundTo(v, money2 ? 2 : Math.max(dp, 0)), money2 ? (Number.isInteger(roundTo(v, 2)) && dp === 0 ? null : 2) : dp || null);
  const k = classes.length;
  const upper = sum(classes.map((c) => c.f * c.b)); const lower = sum(classes.map((c) => c.f * c.a));
  const midText = classes.map((c) => `${num(c.mid)} \\times ${c.f}`).join(' + ');
  const prompt = askTotal
    ? `The table shows information about ${ctx.what}.${groupedTable(ctx, classes)}Work out an estimate of the total ${ctx.noun} for all ${N} ${ctx.who}.`
    : `The table shows information about ${ctx.what}.${groupedTable(ctx, classes)}Work out an estimate of the mean ${ctx.noun}.${exact ? '' : '<br>Give your answer to 1 decimal place.'}`;
  const dist = askTotal ? [upper, lower, sfm / k, N * k, sfm + classes[0].mid, sfm - classes[k - 1].mid] : [upper / N, lower / N, sfm / k, N / k, sfm, est + G.w / 2, (classes[0].a + classes[k - 1].b) / 2];
  return {
    prompt,
    answer: f(ans),
    distractors: numDistractors(ans, dist, { fmt: money2 ? f : (v) => fmtUnit(ctx.unit, v), dp: money2 ? 2 : dp }),
    typed: { kind: 'number', value: ans, ...(exact || askTotal ? {} : { tolerance: 0.05 }) },
    calculator: d !== 'easy',
    solution: [
      'We don\'t know the exact values, so use the <b>midpoint</b> of each class as an estimate.',
      `Midpoints: ${classes.map((c) => num(c.mid)).join(', ')}.`,
      `Estimated total $= ${midText} = ${num(sfm).replace(/,/g, '{,}')}$`,
      ...(askTotal ? [] : [`Mean $\\approx ${num(sfm).replace(/,/g, '{,}')} \\div ${N} = ${num(exact ? est : roundTo(est, 3))}${exact ? '' : '\\ldots'}$ (divide by the total frequency ${N}, not by the ${k} classes)`]),
      `Answer: ${f(ans)}`,
    ],
  };
}, { title: 'Estimate the mean (or total) from grouped data' });

export const groupedClasses = sgen('stat-grouped-classes', 'stat-grouped-estimate', (rng, d) => {
  const G = makeGrouped(rng, d, { anyPeak: true, k: size(d, pick(rng, [4, 5]), 5, 5), allowedN: [21, 25, 29, 31, 35, 40, 41, 45, 50, 60, 80, 99, 120] });
  const { ctx, classes, N } = G;
  const askMedian = d === 'easy' ? chance(rng, 0.3) : d === 'hard' ? true : chance(rng, 0.6);
  const maxF = Math.max(...classes.map((c) => c.f));
  if (classes.filter((c) => c.f === maxF).length > 1) throw new Error('two modal classes');
  const modal = classes.find((c) => c.f === maxF);
  const opts = classes.map((c) => classTex(ctx, c));
  if (!askMedian) {
    return {
      prompt: `The table shows information about ${ctx.what}.${groupedTable(ctx, classes)}Which is the modal class?`,
      answer: classTex(ctx, modal),
      distractors: opts.filter((o) => o !== classTex(ctx, modal)),
      count: classes.length,
      keepOrder: true,
      solution: ['The <b>modal class</b> is the class with the <b>highest frequency</b>.', `The highest frequency is ${maxF}.`, `Answer: ${classTex(ctx, modal)}`],
    };
  }
  const p1 = Math.floor((N + 1) / 2); const p2 = Math.ceil((N + 1) / 2);
  let cum = 0; let mc = null; let mc2 = null;
  const cums = [];
  for (const c of classes) { const before = cum; cum += c.f; cums.push(cum); if (!mc && p1 <= cum && p1 > before) mc = c; if (!mc2 && p2 <= cum && p2 > before) mc2 = c; }
  if (mc !== mc2) throw new Error('median on boundary');
  if (d !== 'easy' && mc === modal && chance(rng, 0.7)) throw new Error('prefer median class != modal class');
  return {
    prompt: `The table shows information about ${ctx.what}.${groupedTable(ctx, classes)}Which class interval contains the median?`,
    answer: classTex(ctx, mc),
    distractors: opts.filter((o) => o !== classTex(ctx, mc)),
    count: classes.length,
    keepOrder: true,
    solution: [
      `There are ${N} values, so the median is the ${N % 2 ? `${ordinal((N + 1) / 2)}` : `${ordinal(N / 2)}–${ordinal(N / 2 + 1)}`} value (halfway through the data, <b>not</b> the middle class).`,
      `Running totals: ${cums.join(', ')}.`,
      `The ${N % 2 ? `${ordinal((N + 1) / 2)}` : `${ordinal(N / 2)} and ${ordinal(N / 2 + 1)}`} value${N % 2 ? ' is' : 's are'} in ${classTex(ctx, mc)}.`,
      `Answer: ${classTex(ctx, mc)}`,
    ],
  };
}, { title: 'Modal class and class containing the median' });

export const groupedStatements = sgen('stat-grouped-statements', 'stat-grouped-estimate', (rng, d) => {
  const G = makeGrouped(rng, d, { k: size(d, 3, 4, 5), allowedN: [10, 12, 15, 20, 24, 30] });
  const { ctx, classes, N } = G;
  const lo = classes[0].a; const hi = classes[classes.length - 1].b;
  const minMean = sum(classes.map((c) => c.f * c.a)) / N; const maxMean = sum(classes.map((c) => c.f * c.b)) / N;
  const minRange = classes[classes.length - 1].a - classes[0].b; const maxRange = hi - lo;
  const unitTxt = (v) => fmtUnit(ctx.unit, v);
  if (d !== 'hard') {
    // one statement true, three false
    const cands = [];
    for (const c of classes.slice(0, -1)) {
      const v = c.b;
      cands.push({ s: `The mean could be less than ${unitTxt(v)}`, t: minMean < v });
      cands.push({ s: `The mean could be more than ${unitTxt(v)}`, t: maxMean > v });
    }
    cands.push({ s: `The range could be more than ${unitTxt(maxRange)}`, t: false });
    cands.push({ s: `The range could be less than ${unitTxt(Math.max(0, minRange))}`, t: minRange < 0 });
    cands.push({ s: `The range could be more than ${unitTxt(maxRange - G.w)}`, t: maxRange > maxRange - G.w });
    cands.push({ s: `The mean could be more than ${unitTxt(hi)}`, t: false });
    cands.push({ s: `The mean could be less than ${unitTxt(lo)}`, t: false });
    const trues = shuffle(rng, cands.filter((c) => c.t)); const falses = shuffle(rng, cands.filter((c) => !c.t));
    if (!trues.length || falses.length < 3) throw new Error('statements');
    const ans = trues[0];
    return {
      prompt: `The table shows information about ${ctx.what}.${groupedTable(ctx, classes)}These statements are about the <b>actual</b> values. Which statement is true?`,
      answer: ans.s,
      distractors: falses.slice(0, 3).map((c) => c.s),
      count: 4,
      solution: [
        `Every value is between ${unitTxt(lo)} and ${unitTxt(hi)}, so the mean must be too. Smallest possible mean: put every value at the bottom of its class, $${num(roundTo(minMean, 2))}$; largest possible: top of each class, $${num(roundTo(maxMean, 2))}$.`,
        `The range can be at most $${num(hi)} - ${num(lo)} = ${num(maxRange)}$ and is at least $${num(classes[classes.length - 1].a)} - ${num(classes[0].b)} = ${num(minRange)}$.`,
        `Check each statement against these limits.`,
        `Answer: ${ans.s}`,
      ],
    };
  }
  // Hard: definitely / might be / cannot be true.
  const above = int(rng, 1, classes.length - 2);
  const cut = classes[above].b;
  const nAbove = sum(classes.slice(above + 1).map((c) => c.f));
  const st = pick(rng, ['exact', 'more', 'fewer', 'range', 'rangeBig']);
  let s; let ans; let why;
  if (st === 'exact') { s = `${nAbove === 1 ? 'Exactly one' : `Exactly ${nAbove}`} of the ${ctx.who} had a ${ctx.noun} of more than ${unitTxt(cut)}.`; ans = 'Definitely true'; why = `The classes above ${unitTxt(cut)} have frequencies adding to ${nAbove}, so this is certain.`; }
  else if (st === 'more') { s = `More than ${nAbove + classes[above].f} of the ${ctx.who} had a ${ctx.noun} of more than ${unitTxt(classes[above].a)}.`; ans = 'Cannot be true'; why = `At most ${nAbove + classes[above].f} values are above ${unitTxt(classes[above].a)} (the classes from ${unitTxt(classes[above].a)} upwards).`; }
  else if (st === 'fewer') { const c = classes[above]; s = `At least one of the ${ctx.who} had a ${ctx.noun} of more than ${unitTxt(c.a + G.w / 2)}.`; ans = nAbove > 0 ? 'Definitely true' : 'Might be true'; why = nAbove > 0 ? `${nAbove} values are in classes above ${unitTxt(c.b)}, so some values are certainly above ${unitTxt(c.a + G.w / 2)}.` : 'We cannot tell where the values sit inside the class.'; }
  else if (st === 'range') { const v = maxRange - G.w / 2; s = `The range is ${unitTxt(v)}.`; ans = v >= minRange && v <= maxRange ? 'Might be true' : 'Cannot be true'; why = `The range must be between ${unitTxt(Math.max(0, minRange))} and ${unitTxt(maxRange)}; we don't know the exact values.`; }
  else { const v = maxRange + G.w; s = `The range is ${unitTxt(v)}.`; ans = 'Cannot be true'; why = `All values are between ${unitTxt(lo)} and ${unitTxt(hi)}, so the range is at most ${unitTxt(maxRange)}.`; }
  return {
    prompt: `The table shows information about ${ctx.what}.${groupedTable(ctx, classes)}Is this statement definitely true, might be true, or cannot be true?<br><i>"${s}"</i>`,
    answer: ans,
    distractors: ['Definitely true', 'Might be true', 'Cannot be true'].filter((o) => o !== ans),
    count: 3,
    keepOrder: true,
    order: ['Definitely true', 'Might be true', 'Cannot be true'],
    solution: ['In grouped data we only know which <b>class</b> each value is in, not the exact value.', why, `Answer: ${ans}`],
  };
}, { title: 'What grouped data can and cannot tell you' });

/* ------------------------------------------------------------------ */
/* Comparing distributions                                              */
/* ------------------------------------------------------------------ */

// A, B: table row labels; sa, sb: the same groups as sentence subjects.
const CMP_CTX = [
  { A: 'Year 10', B: 'Year 11', sa: 'the Year 10 students', sb: 'the Year 11 students', intro: 'Some students recorded how many hours of homework they did last week.', unit: 'hours', base: [3, 12], dp: 1, high: 'did more homework', noun: 'homework times' },
  { A: 'Boys', B: 'Girls', sa: 'the boys', sb: 'the girls', intro: 'The members of a running club ran 400 m. Their times are summarised below.', unit: 'seconds', base: [65, 95], dp: 1, high: 'were slower', noun: 'times' },
  { A: 'Rovers', B: 'United', sa: 'Rovers', sb: 'United', intro: 'Two football teams recorded the number of goals they scored in each match this season.', unit: 'goals', base: [0, 4], dp: 0, high: 'scored more goals per match', noun: 'numbers of goals' },
  { A: 'Class P', B: 'Class Q', sa: 'Class P', sb: 'Class Q', intro: 'Two classes took the same maths test.', unit: 'marks', base: [45, 75], dp: 0, high: 'scored higher marks', noun: 'marks' },
  { A: 'Keswick', B: 'Brighton', sa: 'Keswick', sb: 'Brighton', intro: 'The daily rainfall was recorded in two towns during October.', unit: 'mm', base: [2, 9], dp: 1, high: 'had more rain each day', noun: 'daily rainfall amounts' },
  { A: 'Chess club', B: 'Drama club', sa: 'the chess club members', sb: 'the drama club members', intro: 'The ages of the members of two clubs are summarised below.', unit: 'years', base: [14, 40], dp: 0, high: 'were older', noun: 'ages' },
  { A: 'Orchard A', B: 'Orchard B', sa: 'the apples from Orchard A', sb: 'the apples from Orchard B', intro: 'A sample of apples was weighed from each of two orchards.', unit: 'g', base: [110, 170], dp: 0, high: 'were heavier', noun: 'masses' },
  { A: 'Adults', B: 'Children', sa: 'the adults', sb: 'the children', intro: 'Some adults and children timed how long they took to complete a puzzle.', unit: 'minutes', base: [6, 20], dp: 1, high: 'took longer', noun: 'times' },
  { A: 'Leeds', B: 'Cardiff', sa: 'Leeds', sb: 'Cardiff', intro: 'The midday temperature was recorded each day in June in two cities.', unit: '°C', base: [16, 24], dp: 1, high: 'had higher temperatures', noun: 'temperatures' },
  { A: 'Café A', B: 'Café B', sa: 'Café A', sb: 'Café B', intro: 'Two cafés counted their customers each day for a month.', unit: 'customers', base: [60, 140], dp: 0, high: 'had more customers each day', noun: 'daily numbers of customers' },
  { A: 'Jade', B: 'Mia', sa: 'Jade', sb: 'Mia', intro: 'Two athletes recorded the distances of their long jumps this season.', unit: 'm', base: [4.5, 6.2], dp: 2, high: 'jumped further', noun: 'distances', pron: 'her' },
  { A: 'Feed X', B: 'Feed Y', sa: 'the sunflowers given Feed X', sb: 'the sunflowers given Feed Y', intro: 'Sunflowers were grown with two different plant feeds and their heights were measured.', unit: 'cm', base: [120, 190], dp: 0, high: 'grew taller', noun: 'heights' },
  { A: 'Brand S', B: 'Brand T', sa: 'the Brand S phones', sb: 'the Brand T phones', intro: 'The battery life of some phones of two brands was tested.', unit: 'hours', base: [12, 30], dp: 1, high: 'lasted longer', noun: 'battery lives' },
  { A: 'Aged 40 or under', B: 'Aged 41 or over', sa: 'the people aged 40 or under', sb: 'the people aged 41 or over', intro: 'People recorded how many hours they listened to the radio one day.', unit: 'hours', base: [1, 7], dp: 1, high: 'listened for longer', noun: 'listening times' },
];

export const compareTable = sgen('stat-compare-table', 'stat-compare', (rng, d) => {
  const ctx = pick(rng, CMP_CTX);
  const avgName = size(d, 'mean', pick(rng, ['mean', 'median']), 'median');
  const sprName = d === 'hard' ? 'interquartile range' : 'range';
  const r = (x) => roundTo(x, ctx.dp);
  const rs = (x) => roundTo(x, ctx.spDp ?? ctx.dp);
  const span = ctx.base[1] - ctx.base[0];
  const avA = r(ctx.base[0] + rng() * span); let avB = r(ctx.base[0] + rng() * span);
  if (Math.abs(avA - avB) < span * 0.12) avB = r(avA + (avA < (ctx.base[0] + ctx.base[1]) / 2 ? 1 : -1) * span * (0.15 + rng() * 0.2));
  const spA = Math.max(1, rs(span * (0.2 + rng() * 0.6))); let spB = Math.max(1, rs(span * (0.2 + rng() * 0.6)));
  if (Math.abs(spA - spB) < span * 0.1) spB = rs(spA + Math.max(1, span * 0.25));
  if (avA === avB || spA === spB) throw new Error('ties');
  const A = { row: ctx.A, s: ctx.sa }; const B = { row: ctx.B, s: ctx.sb };
  const hiAvg = avA > avB ? A : B; const loAvg = hiAvg === A ? B : A;
  const loSp = spA < spB ? A : B; const hiSp = loSp === A ? B : A;
  const u = ['marks', 'goals', 'customers'].includes(ctx.unit) ? '' : ` ${ctx.unit}`;
  const cell = (v) => `${num(v)}${u}`;
  const tbl = table([['', cap(avgName), cap(sprName)], [ctx.A, cell(avA), cell(spA)], [ctx.B, cell(avB), cell(spB)]], { firstColHeader: true });
  const their = ctx.pron || 'their';
  const aboutAvg = chance(rng);
  const correct = aboutAvg ? `On average, ${hiAvg.s} ${ctx.high}, because ${their} ${avgName} is higher.` : `The ${ctx.noun} for ${loSp.s} were more consistent, because ${their} ${sprName} is lower.`;
  const wrong = [
    `On average, ${loAvg.s} ${ctx.high}, because ${their} ${avgName} is higher.`,
    `The ${ctx.noun} for ${hiSp.s} were more consistent, because ${their} ${sprName} is higher.`,
    ...(hiSp !== hiAvg ? [`On average, ${hiSp.s} ${ctx.high}, because ${their} ${sprName} is higher.`] : []),
    `All of the ${ctx.noun} for ${hiAvg.s} were higher than all of those for ${loAvg.s}, because ${their} ${avgName} is higher.`,
    ...(loAvg !== loSp ? [`The ${ctx.noun} for ${loAvg.s} were more consistent, because ${their} ${avgName} is lower.`] : [`The ${ctx.noun} for ${hiSp.s} were more consistent, because ${their} ${avgName} is ${hiSp === hiAvg ? 'higher' : 'lower'}.`]),
  ].map(cap);
  return {
    prompt: `${ctx.intro}${tbl}Which statement is a correct comparison?`,
    answer: cap(correct),
    distractors: shuffle(rng, wrong.filter((w) => w !== cap(correct))),
    count: 4,
    solution: [
      `Compare an <b>average</b> (the ${avgName}) to say which group is higher overall: ${ctx.A} ${cell(avA)}, ${ctx.B} ${cell(avB)}.`,
      `Compare a <b>measure of spread</b> (the ${sprName}) to say which is more consistent: a <b>smaller</b> ${sprName} means more consistent. ${ctx.A} ${cell(spA)}, ${ctx.B} ${cell(spB)}.`,
      'An average does not tell you about every single value, and a measure of spread does not tell you which group is higher.',
      `Answer: ${cap(correct)}`,
    ],
  };
}, { title: 'Choose the correct comparison from a summary table', word: true });
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }


const CLAIM_CTX = [
  { A: 'Toffees', B: 'Mints', each: 'each type of sweet', thing: 'sweets in a bag', claim: (c) => `The company claims that the average number of sweets per bag is at least ${c}.`, intro: 'A company sells bags of toffees and bags of mints. The numbers of sweets in some bags are:', lo: 40, hi: 60 },
  { A: 'Brand A', B: 'Brand B', thing: 'matches in a box', each: 'each brand', claim: (c) => `Both brands claim that the average number of matches in a box is at least ${c}.`, intro: 'The numbers of matches in some boxes of two brands are:', lo: 45, hi: 55 },
  { A: 'Type X', B: 'Type Y', each: 'each type of battery', thing: 'hours of battery life', claim: (c) => `The maker claims that the average battery life is at least ${c} hours.`, intro: 'Some batteries of two types were tested. Their lives, in hours, are:', lo: 15, hi: 35 },
  { A: 'Plain', B: 'Salted', each: 'each type of popcorn', thing: 'grams of popcorn in a bag', claim: (c) => `The label says that the average mass of a bag is at least ${c} g.`, intro: 'The masses, in grams, of some bags of plain and salted popcorn are:', lo: 70, hi: 90 },
  { A: 'Red', B: 'Green', thing: 'seeds in a packet', each: 'each type of seed', claim: (c) => `The seed company claims that the average number of seeds in a packet is at least ${c}.`, intro: 'The numbers of seeds in some packets of red and green peppers are:', lo: 20, hi: 40 },
];
export const compareClaim = sgen('stat-compare-claim', 'stat-compare', (rng, d) => {
  const ctx = pick(rng, CLAIM_CTX);
  const n = size(d, 9, pick(rng, [9, 11]), pick(rng, [10, 12]));
  const C = int(rng, ctx.lo + 6, ctx.hi - 6);
  const make = (ok) => {
    for (let t = 0; t < 300; t += 1) {
      const vals = randInts(rng, n, C - 6, C + 6);
      if (chance(rng, 0.7)) vals[0] = ok ? C - int(rng, 10, 16) : C + int(rng, 10, 16); // outlier pulls the mean the other way
      const med = median(vals);
      if ((med >= C) !== ok) continue;
      if (Math.abs(med - C) > 4) continue;
      return sorted(vals);
    }
    throw new Error('claim list');
  };
  const okA = chance(rng); const okB = chance(rng);
  const A = make(okA); const B = make(okB);
  const meanWrong = (mean(A) >= C) !== okA || (mean(B) >= C) !== okB;
  if (!meanWrong && chance(rng, 0.7)) throw new Error('want a mean trap');
  const opt = (a, b) => `${ctx.A}: ${a ? 'Yes' : 'No'}; ${ctx.B}: ${b ? 'Yes' : 'No'}`;
  const all = [opt(true, true), opt(true, false), opt(false, true), opt(false, false)];
  const ans = opt(okA, okB);
  return {
    prompt: `${ctx.intro}<br><b>${ctx.A}</b>${spaced(A)}<b>${ctx.B}</b>${spaced(B)}${ctx.claim(C)}<br>Using medians, is the claim correct for ${ctx.each}?`,
    answer: ans,
    distractors: all.filter((o) => o !== ans),
    count: 4,
    keepOrder: true,
    order: all,
    solution: [
      `The lists are already in order. Each has ${n} values, so the median is the ${n % 2 ? `${ordinal((n + 1) / 2)} value` : `mean of the ${ordinal(n / 2)} and ${ordinal(n / 2 + 1)} values`}.`,
      `${ctx.A}: median $= ${num(median(A))}$, which is ${median(A) >= C ? 'at least' : 'less than'} ${C}.`,
      `${ctx.B}: median $= ${num(median(B))}$, which is ${median(B) >= C ? 'at least' : 'less than'} ${C}.`,
      `("At least ${C}" includes ${C} itself.) Answer: ${ans}`,
    ],
  };
}, { title: 'Test a claim using medians' });

const AVG_CHOICE = [
  { kind: 'outlier', make: (rng) => { const v = randInts(rng, 6, 18, 32).map((x) => x * 1000); const big = int(rng, 9, 15) * 10000; return { data: [...v, big].map((x) => money(x)), big: money(big), intro: 'The salaries of the seven people working at a small company are:', what: 'a typical salary' }; } },
  { kind: 'outlier', make: (rng) => { const v = randInts(rng, 7, 11, 16); const big = int(rng, 34, 58); return { data: [...v, big].map((x) => `${x} s`), big: `${big} s`, intro: 'Eight children ran across the playground. Their times were:', what: 'a typical time' }; } },
  { kind: 'outlier', make: (rng) => { const v = randInts(rng, 6, 180, 260).map((x) => x * 1000); const big = int(rng, 9, 14) * 100000; return { data: [...v, big].map((x) => money(x)), big: money(big), intro: 'The prices of the houses sold in a village last year were:', what: 'a typical house price' }; } },
  { kind: 'outlier', make: (rng) => { const v = randInts(rng, 7, 2, 9); const big = int(rng, 40, 70); return { data: [...v, big].map((x) => `£${x}`), big: `£${big}`, intro: 'Some students were asked how much pocket money they get each week. The answers were:', what: 'a typical amount' }; } },
  { kind: 'outlier', make: (rng) => { const v = randInts(rng, 6, 2, 8); const big = int(rng, 45, 90); return { data: [...v, big].map((x) => `${x} min`), big: `${big} min`, intro: 'A train company records how late its trains are. One morning the delays were:', what: 'a typical delay' }; } },
  { kind: 'category', intro: 'A café asked customers for their favourite flavour of ice cream: vanilla, chocolate, strawberry, mint or toffee.', what: 'the most popular flavour' },
  { kind: 'category', intro: 'A survey asked people how they travel to work: car, bus, train, bike or walking.', what: 'the typical way people travel' },
  { kind: 'category', intro: 'A school asked students for their favourite colour for the new sports kit.', what: 'the colour to choose' },
  { kind: 'stock', intro: 'A shoe shop records the sizes of the shoes it sells. The manager wants to know which size to order most of.', what: 'the size to order most of' },
  { kind: 'stock', intro: 'A school uniform shop records the collar sizes of the shirts it sells. It wants to decide which size to order most of.', what: 'the size to order most of' },
  { kind: 'total', intro: 'A charity knows the average amount given by each of its 2,000 donors. It wants to use the average to work out the total amount given.', what: 'the total' },
  { kind: 'total', intro: 'A farmer wants to use the average mass of a sample of potatoes to estimate the total mass of all 500 potatoes in a sack.', what: 'the total mass' },
];
// Hard: measure how far an outlier pulls the mean away from the median.
const OUTLIER_NUM = [
  { intro: 'Eight children ran across the playground. Their times, in seconds, were:', lo: 11, hi: 16, big: [34, 58], f: (v) => `${num(v)} s` },
  { intro: 'Eight students were asked how much pocket money they get each week. The amounts, in pounds, were:', lo: 2, hi: 9, big: [40, 70], f: (v) => money(v, { forcePence: !Number.isInteger(v) }) },
  { intro: 'A train company records how late eight trains were one morning. The delays, in minutes, were:', lo: 2, hi: 8, big: [45, 90], f: (v) => `${num(v)} minutes` },
  { intro: 'The numbers of goals scored by a hockey team in eight matches were:', lo: 0, hi: 4, big: [15, 22], f: (v) => num(v) },
];
export const compareBestAverage = sgen('stat-compare-best-average', 'stat-compare', (rng, d) => {
  if (d === 'hard' && chance(rng, 0.6)) {
    const c = pick(rng, OUTLIER_NUM);
    const vals = [...randInts(rng, 7, c.lo, c.hi), int(rng, c.big[0], c.big[1])];
    const mn = mean(vals); const md = median(vals);
    if (!isClean(mn, 2) || mn - md <= 0) throw new Error('mean not clean');
    const ans = tidy(mn - md);
    return {
      prompt: `${c.intro}${spaced(shuffle(rng, vals))}One of the values is an outlier.<br>How much bigger is the mean than the median?`,
      answer: c.f(ans),
      distractors: numDistractors(ans, [mn, md, Math.max(...vals) - md, tidy(mean(vals.slice(0, 7)) - md), rangeOf(vals) - md, tidy(mn - modeOf(vals) || 0) || null], { fmt: c.f }),
      count: 4,
      typed: { kind: 'number', value: ans },
      solution: [
        `Mean $= (${vals.join(' + ')}) \\div 8 = ${tnum(sum(vals))} \\div 8 = ${tnum(mn)}$`,
        `In order: ${sorted(vals).join(', ')}. Median $= (${sorted(vals)[3]} + ${sorted(vals)[4]}) \\div 2 = ${tnum(md)}$`,
        `Difference $= ${tnum(mn)} - ${tnum(md)} = ${tnum(ans)}$. The outlier drags the mean up, so the median is the better average here.`,
        `Answer: ${c.f(ans)}`,
      ],
    };
  }
  const sc = pick(rng, AVG_CHOICE);
  let prompt; let ans; let why;
  const O = {
    mean: 'The mean, because it uses every value',
    median: 'The median, because it is not affected by an extreme value',
    mode: 'The mode, because it gives the most common value',
    range: 'The range, because it shows how spread out the values are',
  };
  if (sc.kind === 'outlier' && chance(rng, 0.5)) {
    // "Why is the mean not the best average here?"
    const g = sc.make(rng);
    const nOthers = g.data.length - 1;
    const right = `${g.big} is much larger than the other values, so the mean would be bigger than most of them`;
    const wrongs = [
      `There are only ${g.data.length} values, which is too few to find a mean`,
      `The mean is always larger than the median`,
      `The data has no mode, so the mean cannot be used`,
      `The values are not in order, so the mean will be wrong`,
      `${g.big} is the largest value, so the mean would be the same as the largest value`,
    ];
    return {
      prompt: `${g.intro}${spaced(shuffle(rng, g.data), (x) => x)}Why is the mean <b>not</b> a good average to represent ${g.what}?`,
      answer: right,
      distractors: shuffle(rng, wrongs),
      count: 4,
      solution: [
        'An <b>extreme value</b> (outlier) drags the mean towards it.',
        `${g.big} is far bigger than the other ${nOthers} values, so the mean is pulled up and is not typical of the group.`,
        'The median would be a better average here, because it is not affected by one extreme value.',
        `Answer: ${right}`,
      ],
    };
  }
  if (sc.kind === 'outlier') {
    const g = sc.make(rng);
    prompt = `${g.intro}${spaced(shuffle(rng, g.data), (x) => x)}Which average would be best to represent ${g.what}?`;
    ans = O.median; why = `The value ${g.big} is much bigger than the rest. It would pull the mean up a lot, so the median gives a fairer typical value.`;
  } else if (sc.kind === 'category') {
    prompt = `${sc.intro}<br>Which average should be used to describe ${sc.what}?`;
    ans = O.mode; why = 'The answers are words, not numbers, so you cannot find a mean or median. The mode (most common answer) is the only average possible.';
  } else if (sc.kind === 'stock') {
    prompt = `${sc.intro}<br>Which average is most useful for finding ${sc.what}?`;
    ans = O.mode; why = 'The shop wants the most common size. A mean (such as 9.37) might not even be a size that exists.';
  } else {
    prompt = `${sc.intro}<br>Which average should be used?`;
    ans = O.mean; why = 'Total = mean × number of values. Only the mean is linked to the total like this.';
  }
  return {
    prompt,
    answer: ans,
    distractors: Object.values(O).filter((o) => o !== ans),
    count: 4,
    solution: ['Think about what the average is for and what the data look like.', why, 'The range is not an average at all: it measures spread.', `Answer: ${ans}`],
  };
}, { title: 'Choose the most suitable average' });

void sample;
export const generators = [
  listMean, listMedian, listModeRange, listWhichSet,
  avgMissing, avgNewValue, avgCombined, avgAlgebra, avgRange,
  freqMean, freqMedian, freqModeRange, freqChart, freqMissing,
  groupedMean, groupedClasses, groupedStatements,
  compareTable, compareClaim, compareBestAverage,
];
