// Two-way tables, frequency trees and Venn diagrams.
import {
  pick, int, sample, shuffle, size, frac, num, tnum, names, cap, table,
} from '../../core.js';
import { frequencyTree, venn2, venn3 } from './diagrams.js';
import {
  pgen as gen, ft, pf, typedP, probOpts, countOpts, listAnd, shortDecimal,
} from './util.js';

const sum = (xs) => xs.reduce((a, b) => a + b, 0);

/* ================================================================== */
/* prob-two-way-tables                                                 */
/* ================================================================== */

// Two-way contexts: rows, cols, who (plural noun), intro.
const TWO_WAY = [
  { intro: 'Some students were asked how they travel to school.', one: 'student', who: 'students', rows: ['Boys', 'Girls'], cols: ['Walk', 'Bus', 'Car'], rp: { Boys: 'is a boy', Girls: 'is a girl' }, cp: { Walk: 'walks to school', Bus: 'comes by bus', Car: 'comes by car' } },
  { intro: 'Year 10 and Year 11 students chose their favourite subject.', one: 'student', who: 'students', rows: ['Year 10', 'Year 11'], cols: ['Maths', 'English', 'Science'], rp: { 'Year 10': 'is in Year 10', 'Year 11': 'is in Year 11' }, cp: { Maths: 'chose Maths', English: 'chose English', Science: 'chose Science' } },
  { intro: 'People leaving a cinema were asked which film they watched.', one: 'person', who: 'people', rows: ['Adults', 'Children'], cols: ['Comedy', 'Action', 'Cartoon'], rp: { Adults: 'is an adult', Children: 'is a child' }, cp: { Comedy: 'watched the comedy', Action: 'watched the action film', Cartoon: 'watched the cartoon' } },
  { intro: 'Members of a sports club were asked which sport they play most.', one: 'member', who: 'members', rows: ['Juniors', 'Seniors'], cols: ['Football', 'Tennis', 'Swimming'], rp: { Juniors: 'is a junior', Seniors: 'is a senior' }, cp: { Football: 'plays football', Tennis: 'plays tennis', Swimming: 'swims' } },
  { intro: 'A garage recorded the fuel type of the cars it sold last month.', one: 'car', who: 'cars', rows: ['New', 'Used'], cols: ['Petrol', 'Diesel', 'Electric'], rp: { New: 'is new', Used: 'is used' }, cp: { Petrol: 'is petrol', Diesel: 'is diesel', Electric: 'is electric' } },
  { intro: 'A restaurant recorded the main course chosen by each customer.', one: 'customer', who: 'customers', rows: ['Lunch', 'Dinner'], cols: ['Meat', 'Fish', 'Vegetarian'], rp: { Lunch: 'came for lunch', Dinner: 'came for dinner' }, cp: { Meat: 'chose meat', Fish: 'chose fish', Vegetarian: 'chose a vegetarian dish' } },
  { intro: 'People were asked which device they use most often.', one: 'person', who: 'people', rows: ['Male', 'Female'], cols: ['Laptop', 'Phone', 'Tablet'], rp: { Male: 'is male', Female: 'is female' }, cp: { Laptop: 'uses a laptop most', Phone: 'uses a phone most', Tablet: 'uses a tablet most' } },
  { intro: 'A library recorded the books borrowed one Saturday.', one: 'book', who: 'books', rows: ['Adults', 'Children'], cols: ['Fiction', 'Non-fiction'], rp: { Adults: 'was borrowed by an adult', Children: 'was borrowed by a child' }, cp: { Fiction: 'is fiction', 'Non-fiction': 'is non-fiction' } },
  { intro: 'Students in Year 7 and Year 8 chose a school trip.', one: 'student', who: 'students', rows: ['Year 7', 'Year 8'], cols: ['Museum', 'Zoo', 'Theatre'], rp: { 'Year 7': 'is in Year 7', 'Year 8': 'is in Year 8' }, cp: { Museum: 'chose the museum', Zoo: 'chose the zoo', Theatre: 'chose the theatre' } },
  { intro: 'A driving test centre recorded some results.', one: 'test', who: 'tests', rows: ['First attempt', 'Retake'], cols: ['Pass', 'Fail'], rp: { 'First attempt': 'was a first attempt', Retake: 'was a retake' }, cp: { Pass: 'was a pass', Fail: 'was a fail' } },
  { intro: 'A leisure centre recorded what each visitor used.', one: 'visitor', who: 'visitors', rows: ['Weekday', 'Weekend'], cols: ['Gym', 'Pool', 'Class'], rp: { Weekday: 'came on a weekday', Weekend: 'came at the weekend' }, cp: { Gym: 'used the gym', Pool: 'used the pool', Class: 'went to a class' } },
  { intro: 'A travel agent recorded the holidays it booked.', one: 'holiday', who: 'holidays', rows: ['Summer', 'Winter'], cols: ['UK', 'Abroad'], rp: { Summer: 'is in summer', Winter: 'is in winter' }, cp: { UK: 'is in the UK', Abroad: 'is abroad' } },
  { intro: 'Students were asked if they have a pet.', one: 'student', who: 'students', rows: ['Year 9', 'Year 10', 'Year 11'], cols: ['Pet', 'No pet'], rp: { 'Year 9': 'is in Year 9', 'Year 10': 'is in Year 10', 'Year 11': 'is in Year 11' }, cp: { Pet: 'has a pet', 'No pet': 'does not have a pet' } },
  { intro: 'A bakery recorded what customers bought in the morning and afternoon.', one: 'customer', who: 'customers', rows: ['Morning', 'Afternoon'], cols: ['Bread', 'Cakes', 'Pies'], rp: { Morning: 'came in the morning', Afternoon: 'came in the afternoon' }, cp: { Bread: 'bought bread', Cakes: 'bought cakes', Pies: 'bought pies' } },
];

/** Build a full table of counts with totals. Returns {cells[r][c], rowT, colT, T}. */
function twoWayData(rng, nr, nc, lo, hi) {
  const cells = Array.from({ length: nr }, () => Array.from({ length: nc }, () => int(rng, lo, hi)));
  const rowT = cells.map(sum);
  const colT = Array.from({ length: nc }, (_, j) => sum(cells.map((r) => r[j])));
  return { cells, rowT, colT, T: sum(rowT) };
}

/** Full grid including totals: (nr+1) x (nc+1). */
const fullGrid = (D) => [...D.cells.map((r, i) => [...r, D.rowT[i]]), [...D.colT, D.T]];

/** Propagate row/column sums. known: boolean grid. Returns number of rounds needed to know (ti,tj), or -1. */
function solveRounds(grid, known, ti, tj) {
  const k = known.map((r) => [...r]);
  const R = grid.length; const C = grid[0].length;
  for (let round = 1; round < 10; round += 1) {
    const newly = [];
    for (let i = 0; i < R; i += 1) {
      const unk = []; for (let j = 0; j < C; j += 1) if (!k[i][j]) unk.push([i, j]);
      if (unk.length === 1) newly.push(unk[0]);
    }
    for (let j = 0; j < C; j += 1) {
      const unk = []; for (let i = 0; i < R; i += 1) if (!k[i][j]) unk.push([i, j]);
      if (unk.length === 1) newly.push(unk[0]);
    }
    if (!newly.length) return -1;
    newly.forEach(([i, j]) => { k[i][j] = true; });
    if (k[ti][tj]) return round;
  }
  return -1;
}

function renderTwoWay(ctx, grid, show) {
  const header = ['', ...ctx.cols, 'Total'];
  const rows = [...ctx.rows, 'Total'].map((rn, i) => [rn, ...grid[i].map((v, j) => show(i, j, v))]);
  return table([header, ...rows], { firstColHeader: true });
}

export const twoWayComplete = gen('prob-2way-complete', 'prob-two-way-tables', (rng, d) => {
  const ctx = pick(rng, TWO_WAY);
  const nr = ctx.rows.length; const nc = ctx.cols.length;
  const D = twoWayData(rng, nr, nc, size(d, 3, 5, 8), size(d, 20, 40, 70));
  const grid = fullGrid(D);
  const R = nr + 1; const C = nc + 1;
  const needRounds = size(d, 1, 2, 2);
  // hide cells until the target needs `needRounds` rounds but is still solvable
  for (let t = 0; t < 60; t += 1) {
    const known = grid.map((r) => r.map(() => true));
    const ti = int(rng, 0, nr - 1); const tj = int(rng, 0, nc - 1);
    const hideN = size(d, int(rng, 2, 3), int(rng, 4, 5), int(rng, 5, 7));
    const cellsAll = shuffle(rng, grid.flatMap((r, i) => r.map((_, j) => [i, j])).filter(([i, j]) => !(i === ti && j === tj)));
    known[ti][tj] = false;
    cellsAll.slice(0, hideN - 1).forEach(([i, j]) => { known[i][j] = false; });
    const rounds = solveRounds(grid, known, ti, tj);
    if (rounds < needRounds || rounds === -1) continue;
    const ans = grid[ti][tj];
    const hiddenOthers = grid.flatMap((r, i) => r.map((v, j) => (!known[i][j] && !(i === ti && j === tj) ? v : null))).filter((v) => v !== null);
    const visual = renderTwoWay(ctx, grid, (i, j, v) => (i === ti && j === tj ? '<b>?</b>' : known[i][j] ? String(v) : ''));
    // Build a worked route: show how each needed cell is found.
    const steps = [];
    const k = known.map((r) => [...r]);
    for (let round = 0; round < 6 && !k[ti][tj]; round += 1) {
      const found = [];
      for (let i = 0; i < R; i += 1) {
        const unk = []; for (let j = 0; j < C; j += 1) if (!k[i][j]) unk.push(j);
        if (unk.length === 1) found.push({ i, j: unk[0], line: 'row' });
      }
      for (let j = 0; j < C; j += 1) {
        const unk = []; for (let i = 0; i < R; i += 1) if (!k[i][j]) unk.push(i);
        if (unk.length === 1) found.push({ i: unk[0], j, line: 'col' });
      }
      const useful = found.find((f) => f.i === ti && f.j === tj) || found.find((f) => f.i === ti || f.j === tj) || found[0];
      const { i, j, line } = useful;
      const rn = [...ctx.rows, 'Total'][i]; const cn = [...ctx.cols, 'Total'][j];
      let text_;
      let uses;
      if (line === 'row') {
        const others = grid[i].slice(0, C - 1).filter((_, jj) => jj !== j);
        text_ = j === C - 1 ? `${rn} row: total $= ${others.join(' + ')} = ${grid[i][j]}$.` : `${rn} row: $${grid[i][C - 1]} - ${others.length > 1 ? `(${others.join(' + ')})` : others[0]} = ${grid[i][j]}$ in the ${cn} column.`;
        uses = Array.from({ length: C }, (_, jj) => [i, jj]).filter(([, jj]) => jj !== j);
      } else {
        const others = grid.slice(0, R - 1).map((r) => r[j]).filter((_, ii) => ii !== i);
        text_ = i === R - 1 ? `${cn} column: total $= ${others.join(' + ')} = ${grid[i][j]}$.` : `${cn} column: $${grid[R - 1][j]} - ${others.length > 1 ? `(${others.join(' + ')})` : others[0]} = ${grid[i][j]}$ for ${rn}.`;
        uses = Array.from({ length: R }, (_, ii) => [ii, j]).filter(([ii]) => ii !== i);
      }
      steps.push({ i, j, text: text_, uses });
      k[i][j] = true;
    }
    if (!k[ti][tj]) continue;
    // keep only the steps the target actually depends on
    const need = new Set([`${ti},${tj}`]);
    const kept = [];
    for (let s = steps.length - 1; s >= 0; s -= 1) {
      if (!need.has(`${steps[s].i},${steps[s].j}`)) continue;
      kept.unshift(steps[s].text);
      steps[s].uses.forEach(([a, b]) => { if (!known[a][b]) need.add(`${a},${b}`); });
    }
    if (kept.length > 4) continue;
    steps.length = 0; steps.push(...kept);
    return {
      prompt: `${ctx.intro} The two-way table shows some of the results.<br>Work out the number that goes in the cell marked <b>?</b>`,
      visual,
      answer: num(ans),
      distractors: countOpts(ans, [...hiddenOthers, grid[ti][C - 1] - sum(grid[ti].slice(0, C - 1)) + ans + int(rng, 1, 5), grid[R - 1][tj], grid[ti][C - 1]]),
      typed: { kind: 'number', value: ans },
      solution: [
        'Each row adds up to its row total and each column adds up to its column total. Look for a row or column with only one gap.',
        ...steps,
        `Answer: ${num(ans)}`,
      ],
    };
  }
  throw new Error('no puzzle');
}, { title: 'Complete a two-way table', word: true });

export const twoWayProb = gen('prob-2way-prob', 'prob-two-way-tables', (rng, d) => {
  const ctx = pick(rng, TWO_WAY);
  const nr = ctx.rows.length; const nc = ctx.cols.length;
  const D = twoWayData(rng, nr, nc, size(d, 2, 4, 6), size(d, 15, 30, 50));
  const grid = fullGrid(D);
  const i = int(rng, 0, nr - 1); const j = int(rng, 0, nc - 1);
  const mode = pick(rng, size(d, ['cell', 'row', 'col'], ['cell', 'col', 'or', ...(nc > 2 ? ['notcol'] : ['row'])], ['or', 'cell', ...(nc > 2 ? ['notcol', 'twocells'] : ['or'])]));
  let fav; let txt; const wrong = [];
  const { one } = ctx;
  const R = ctx.rp[ctx.rows[i]]; const Cc = ctx.cp[ctx.cols[j]];
  const notC = Cc.replace(/^is /, 'is <b>not</b> ').replace(/^was /, 'was <b>not</b> ').replace(/^has /, 'does <b>not</b> have ').replace(/^does not /, 'does ')
    .replace(/^(chose|watched|used|went|bought|came|plays|swims|walks|comes|uses)\b/, (m) => `did <b>not</b> ${{ chose: 'choose', watched: 'watch', used: 'use', went: 'go', bought: 'buy', came: 'come', plays: 'play', swims: 'swim', walks: 'walk', comes: 'come', uses: 'use' }[m]}`);
  if (mode === 'cell') { fav = D.cells[i][j]; txt = `the ${one} ${R} and ${Cc}`; wrong.push(frac(fav, D.rowT[i]), frac(fav, D.colT[j])); }
  else if (mode === 'row') { fav = D.rowT[i]; txt = `the ${one} ${R}`; wrong.push(frac(fav, D.T - fav)); }
  else if (mode === 'col') { fav = D.colT[j]; txt = `the ${one} ${Cc}`; wrong.push(frac(D.cells[i][j], D.T)); }
  else if (mode === 'notcol') { fav = D.T - D.colT[j]; txt = `the ${one} ${notC}`; wrong.push(frac(D.colT[j], D.T)); }
  else if (mode === 'or') {
    fav = D.rowT[i] + D.colT[j] - D.cells[i][j]; txt = `the ${one} ${R} <b>or</b> ${Cc} (or both)`;
    wrong.push(frac(D.rowT[i] + D.colT[j], D.T), frac(D.cells[i][j], D.T));
  } else {
    const j2 = (j + 1) % nc;
    fav = D.cells[i][j] + D.cells[i][j2]; txt = `the ${one} ${R} and either ${Cc} or ${ctx.cp[ctx.cols[j2]]}`;
    wrong.push(frac(fav, D.rowT[i]), frac(D.cells[i][j], D.T));
  }
  const p = frac(fav, D.T);
  const hideTotals = d === 'hard';
  return {
    prompt: `${ctx.intro}${renderTwoWay(ctx, grid, (r, c, v) => (hideTotals && (r === nr || c === nc) ? '' : String(v)))}${hideTotals ? 'The totals have not been filled in. ' : ''}One of the ${ctx.who} is chosen at random.<br>What is the probability that ${txt}?`,
    answer: ft(p),
    distractors: probOpts(p, [...wrong, frac(fav, D.T + fav), frac(D.T - fav, D.T), frac(fav + 1, D.T), frac(fav, D.T - 1)]),
    typed: typedP(p),
    solution: [
      `There are ${num(D.T)} ${ctx.who} altogether${hideTotals ? ` (add every cell: $${D.cells.flat().join(' + ')} = ${D.T}$)` : ''}, and each is equally likely to be chosen.`,
      mode === 'or' ? `The "${ctx.rows[i]}" row has ${D.rowT[i]} and the "${ctx.cols[j]}" column has ${D.colT[j]}, but ${D.cells[i][j]} are in both, so don't count them twice: $${D.rowT[i]} + ${D.colT[j]} - ${D.cells[i][j]} = ${fav}$.`
        : mode === 'notcol' ? `Everyone outside the "${ctx.cols[j]}" column: $${D.T} - ${D.colT[j]} = ${fav}$.`
          : mode === 'cell' ? `Read the cell in the "${ctx.rows[i]}" row and "${ctx.cols[j]}" column: ${num(fav)}.`
            : mode === 'row' ? `Use the "${ctx.rows[i]}" row total: ${num(fav)}.` : mode === 'col' ? `Use the "${ctx.cols[j]}" column total: ${num(fav)}.`
              : `Add the two cells in the "${ctx.rows[i]}" row: ${num(fav)}.`,
      `$P = \\frac{${fav}}{${D.T}}${p.d !== D.T ? ` = ${p.tex()}` : ''}$`,
      `Answer: ${ft(p)}`,
    ],
  };
}, { title: 'Probability from a two-way table' });

// Two-way facts. who = everyone; R = the two row groups (plural nouns); C = the two column predicates (plural verbs).
const INFO_CTX = [
  { who: 'students in Year 9', R: ['boys', 'girls'], C: ['walk to school', 'do not walk to school'], cols: ['Walk', 'Do not walk'] },
  { who: 'people at a holiday camp', R: ['adults', 'children'], C: ['went swimming', 'did not go swimming'], cols: ['Swim', 'No swim'] },
  { who: 'students in Year 7', R: ['boys', 'girls'], C: ['have a phone', 'do not have a phone'], cols: ['Phone', 'No phone'] },
  { who: 'members of a club', R: ['men', 'women'], C: ['voted yes', 'voted no'], cols: ['Yes', 'No'] },
  { who: 'driving tests taken at a centre', R: ['first attempts', 'retakes'], C: ['were passed', 'were failed'], cols: ['Pass', 'Fail'] },
  { who: 'books borrowed from a library', R: ['fiction books', 'non-fiction books'], C: ['were borrowed by adults', 'were borrowed by children'], cols: ['Adults', 'Children'] },
  { who: 'holidays booked with a travel agent', R: ['summer holidays', 'winter holidays'], C: ['were in the UK', 'were abroad'], cols: ['UK', 'Abroad'] },
  { who: 'students who took a test', R: ['Year 10 students', 'Year 11 students'], C: ['passed', 'failed'], cols: ['Pass', 'Fail'] },
  { who: 'dogs at a rescue centre', R: ['puppies', 'adult dogs'], C: ['were rehomed', 'were not rehomed'], cols: ['Rehomed', 'Not rehomed'] },
  { who: 'customers at a shop', R: ['men', 'women'], C: ['paid by card', 'paid in cash'], cols: ['Card', 'Cash'] },
  { who: 'cars at a garage', R: ['new cars', 'used cars'], C: ['are electric', 'are not electric'], cols: ['Electric', 'Not electric'] },
  { who: 'people at a cinema', R: ['adults', 'children'], C: ['bought popcorn', 'did not buy popcorn'], cols: ['Popcorn', 'No popcorn'] },
];

export const twoWayFromInfo = gen('prob-2way-from-info', 'prob-two-way-tables', (rng, d) => {
  const ctx = pick(rng, INFO_CTX);
  const T = pick(rng, size(d, [40, 50, 60], [60, 80, 100, 120], [120, 150, 200, 240]));
  const r1 = int(rng, Math.round(T * 0.3), Math.round(T * 0.7));
  const r2 = T - r1;
  const a = int(rng, Math.round(r1 * 0.2), Math.round(r1 * 0.8));
  const c = int(rng, Math.round(r2 * 0.2), Math.round(r2 * 0.8));
  const colT = a + c;
  const [R1, R2] = ctx.R; const [C1, C2] = ctx.C;
  const useFrac = d === 'hard' && rng() < 0.6;
  let factR1 = `${r1} are ${R1}.`;
  let r1v = r1;
  if (useFrac) {
    const f = pick(rng, [frac(2, 5), frac(3, 5), frac(3, 8), frac(5, 8), frac(1, 4), frac(3, 4), frac(4, 5), frac(7, 10), frac(3, 10)]);
    if (!f.mul(T).isInt) throw new Error('frac');
    r1v = f.mul(T).value();
    factR1 = `$${f.tex()}$ of them are ${R1}.`;
  }
  const r2v = T - r1v;
  const av = Math.min(a, r1v - 1); const cv = Math.min(c, r2v - 1);
  if (av < 1 || cv < 1) throw new Error('small');
  const colTv = av + cv;
  const facts = [`There are ${T} ${ctx.who}.`, factR1, `${av} of the ${R1} ${C1}.`, `${colTv} of the ${T} ${ctx.who} ${C1}.`];
  const targets = [
    { txt: `${R2} ${C2}`, v: r2v - cv, wrong: [r2v, cv, r1v - av, T - colTv] },
    { txt: `${R2} ${C1}`, v: cv, wrong: [colTv, r2v - cv, av, Math.abs(colTv - r1v)] },
    { txt: `${R1} ${C2}`, v: r1v - av, wrong: [T - colTv, r1v, av, r2v - cv] },
  ];
  const tgt = pick(rng, d === 'hard' ? [targets[0]] : targets);
  void colT;
  return {
    prompt: `${facts.join('<br>')}<br>How many ${tgt.txt}?`,
    answer: num(tgt.v),
    distractors: countOpts(tgt.v, tgt.wrong),
    typed: { kind: 'number', value: tgt.v },
    solution: [
      'Put the facts into a two-way table, then fill in the gaps so every row and column adds up.',
      table([['', ...ctx.cols, 'Total'], [cap(R1), String(av), String(r1v - av), String(r1v)], [cap(R2), String(cv), String(r2v - cv), String(r2v)], ['Total', String(colTv), String(T - colTv), String(T)]], { firstColHeader: true }),
      `${useFrac ? `${cap(R1)}: $${frac(r1v, T).tex()} \\times ${T} = ${r1v}$. ` : ''}${cap(R2)}: $${T} - ${r1v} = ${r2v}$. ${cap(R2)}, "${ctx.cols[0]}": $${colTv} - ${av} = ${cv}$. ${cap(R2)}, "${ctx.cols[1]}":$${r2v} - ${cv} = ${r2v - cv}$.`,
      `Answer: ${num(tgt.v)}`,
    ],
  };
}, { title: 'Build a two-way table from facts' });

// Frequency tree contexts: question, yes/no labels, second question with two outcomes.
// q: "<T> ___." ; y: "<n> ___" for the first branch; s1: "<fraction> ___" for the second split.
const FTREE = [
  { q: 'people were asked if they drink coffee', y: 'say Yes', s1: 'of the people who say Yes drink 3 or more cups a day', a: ['Yes', 'No'], s: ['3 or more cups a day', 'Fewer than 3 cups'], heads: ['People', 'Drink coffee?', 'Cups each day'] },
  { q: 'students were asked if they exercise every day', y: 'answer Yes', s1: 'of the students who answer Yes exercise for at least 1 hour', a: ['Yes', 'No'], s: ['At least 1 hour', 'Less than 1 hour'], heads: ['Students', 'Exercise daily?', 'Time'] },
  { q: 'people were asked if they eat sushi', y: 'say Yes', s1: 'of the people who say Yes eat sushi at least once a month', a: ['Yes', 'No'], s: ['At least once a month', 'Less often'], heads: ['People', 'Eat sushi?', 'How often'] },
  { q: 'people were asked if they played online games yesterday', y: 'answer Yes', s1: 'of the people who answer Yes played just one game', a: ['Yes', 'No'], s: ['One game', 'More than one game'], heads: ['People', 'Played?', 'Games'] },
  { q: 'customers were asked if they have a loyalty card', y: 'have a card', s1: 'of the customers with a card used it today', a: ['Yes', 'No'], s: ['Used it today', 'Did not use it'], heads: ['Customers', 'Loyalty card?', 'Today'] },
  { q: 'students took a maths test', y: 'passed', s1: 'of the students who passed got a grade A', a: ['Passed', 'Failed'], s: ['Grade A', 'Not grade A'], heads: ['Students', 'Result', 'Grade'] },
  { q: 'people took their driving test', y: 'passed', s1: 'of those who passed were on their first attempt', a: ['Passed', 'Failed'], s: ['First attempt', 'Not first attempt'], heads: ['Drivers', 'Result', 'Attempt'] },
  { q: 'people at a concert were asked if they bought a T-shirt', y: 'bought a T-shirt', s1: 'of the people who bought a T-shirt paid by card', a: ['Yes', 'No'], s: ['Paid by card', 'Paid in cash'], heads: ['People', 'Bought T-shirt?', 'Payment'] },
  { q: 'seeds were planted', y: 'grew', s1: 'of the seeds that grew produced flowers', a: ['Grew', 'Did not grow'], s: ['Flowered', 'Did not flower'], heads: ['Seeds', 'Grew?', 'Flowered?'] },
  { q: 'commuters were asked if they travel by train', y: 'travel by train', s1: 'of the train travellers have a season ticket', a: ['Yes', 'No'], s: ['Season ticket', 'No season ticket'], heads: ['Commuters', 'Train?', 'Ticket'] },
  { q: 'people were asked if they have a pet', y: 'have a pet', s1: 'of the people with a pet have a dog', a: ['Yes', 'No'], s: ['Dog', 'Other pet'], heads: ['People', 'Pet?', 'Type'] },
  { q: 'teenagers were asked if they use social media', y: 'use social media', s1: 'of the teenagers who use it spend more than 2 hours a day on it', a: ['Yes', 'No'], s: ['More than 2 hours', '2 hours or less'], heads: ['Teenagers', 'Social media?', 'Time'] },
];

function ftreeData(rng, d) {
  const T = pick(rng, size(d, [40, 50, 60, 80, 100], [120, 200, 240, 300, 400, 500], [240, 360, 480, 600, 750, 800]));
  const pYes = pick(rng, [frac(1, 4), frac(3, 4), frac(2, 5), frac(3, 5), frac(1, 5), frac(4, 5), frac(3, 10), frac(7, 10), frac(5, 8), frac(3, 8)]);
  const yes = pYes.mul(T);
  if (!yes.isInt) throw new Error('yes');
  const pS = pick(rng, [frac(1, 4), frac(3, 4), frac(1, 5), frac(2, 5), frac(3, 5), frac(4, 5), frac(1, 3), frac(2, 3), frac(5, 8), frac(3, 8), frac(7, 10), frac(1, 10)]);
  const s1 = pS.mul(yes.value());
  if (!s1.isInt || s1.value() === 0 || s1.value() === yes.value()) throw new Error('s1');
  return { T, Y: yes.value(), N: T - yes.value(), S1: s1.value(), S2: yes.value() - s1.value(), pYes, pS };
}
const asPct = (f) => (f.mul(100).isInt ? `${f.mul(100).value()}%` : null);
const describe = (rng, f) => (asPct(f) && rng() < 0.5 ? asPct(f) : `$${f.tex()}$`);
const cap1 = (t) => (t.startsWith('$') ? t : t.charAt(0).toUpperCase() + t.slice(1));

export const ftreeComplete = gen('prob-freqtree-complete', 'prob-two-way-tables', (rng, d) => {
  const ctx = pick(rng, FTREE);
  const D = ftreeData(rng, d);
  const tgt = pick(rng, size(d, ['N', 'S1', 'S2'], ['S1', 'S2', 'N'], ['S2', 'T', 'S1']));
  const yesTxt = describe(rng, D.pYes); const sTxt = describe(rng, D.pS);
  const facts = tgt === 'T'
    ? [`Some ${ctx.q}.`, `${D.Y} ${ctx.y}. This is ${yesTxt} of the total.`, `${cap1(sTxt)} ${ctx.s1}.`]
    : [`${D.T} ${ctx.q}.`, `${cap1(yesTxt)} ${ctx.y}.`, `${cap1(sTxt)} ${ctx.s1}.`];
  const vals = { T: D.T, Y: D.Y, N: D.N, S1: D.S1, S2: D.S2 };
  const show = (k) => (k === tgt ? '?' : d === 'easy' && k !== 'T' ? vals[k] : (k === 'T' && tgt !== 'T' ? vals.T : null));
  const visual = frequencyTree({
    root: show('T'), headings: ctx.heads,
    branches: [
      { label: ctx.a[0], value: show('Y'), children: [{ label: ctx.s[0].replace(/^(\S+ \S+ \S+) /, '$1\n'), value: show('S1') }, { label: ctx.s[1].replace(/^(\S+ \S+ \S+) /, '$1\n'), value: show('S2') }] },
      { label: ctx.a[1], value: show('N') },
    ],
  });
  const ans = vals[tgt];
  const sumLine = tgt === 'T'
    ? [`${D.Y} is ${yesTxt.replace(/\$/g, '')} of the total, so the total is $${D.Y} \\div ${D.pYes.tex()} = ${D.T}$.`]
    : [
      `${ctx.a[0]}: ${yesTxt} of ${D.T} $= ${D.pYes.tex()} \\times ${D.T} = ${D.Y}$, so ${ctx.a[1]}: $${D.T} - ${D.Y} = ${D.N}$.`,
      `${ctx.s[0]}: ${sTxt} of ${D.Y} $= ${D.pS.tex()} \\times ${D.Y} = ${D.S1}$, so ${ctx.s[1].toLowerCase()}: $${D.Y} - ${D.S1} = ${D.S2}$.`,
    ];
  return {
    prompt: `${facts.join('<br>')}<br>The information is shown in a frequency tree. What number goes in the circle marked <b>?</b>`,
    visual,
    answer: num(ans),
    distractors: countOpts(ans, [D.Y, D.N, D.S1, D.S2, D.T, Math.round(D.pS.value() * D.T), D.T - D.S1]),
    typed: { kind: 'number', value: ans },
    solution: [
      'Each pair of branches splits the number in the circle before them, so the two numbers add up to it.',
      ...(tgt === 'T' ? sumLine : tgt === 'N' ? [sumLine[0]] : sumLine),
      `Answer: ${num(ans)}`,
    ],
  };
}, { title: 'Complete a frequency tree' });

export const ftreeProb = gen('prob-freqtree-prob', 'prob-two-way-tables', (rng, d) => {
  const ctx = pick(rng, FTREE);
  const D = ftreeData(rng, d);
  const mode = pick(rng, size(d, ['whole', 'yesOnly'], ['whole', 'yesOnly', 'fraction'], ['fraction', 'notS1', 'yesOnly']));
  const visual = frequencyTree({
    root: D.T, headings: ctx.heads,
    branches: [
      { label: ctx.a[0], value: D.Y, children: [{ label: ctx.s[0].replace(/^(\S+ \S+ \S+) /, '$1\n'), value: D.S1 }, { label: ctx.s[1].replace(/^(\S+ \S+ \S+) /, '$1\n'), value: D.S2 }] },
      { label: ctx.a[1], value: D.N },
    ],
  });
  const one = ctx.heads[0].toLowerCase() === 'people' ? 'person' : ctx.heads[0].toLowerCase().replace(/s$/, '');
  let p; let prompt; let steps; const wrong = [];
  if (mode === 'whole' || mode === 'fraction') {
    p = frac(D.S1, D.T);
    prompt = mode === 'whole' ? `One of the ${D.T} ${ctx.heads[0].toLowerCase()} is chosen at random. What is the probability that they are in the group "${ctx.a[0]}, ${ctx.s[0].toLowerCase()}"?`
      : `What fraction of all ${D.T} ${ctx.heads[0].toLowerCase()} are in the group "${ctx.a[0]}, ${ctx.s[0].toLowerCase()}"? Give your answer in its simplest form.`;
    steps = [`That group is the circle with ${D.S1}. Compare it with everyone: ${D.T}.`, `$\\frac{${D.S1}}{${D.T}}${p.d !== D.T ? ` = ${p.tex()}` : ''}$`];
    wrong.push(frac(D.S1, D.Y), frac(D.Y, D.T), frac(D.S1, D.S2), frac(D.S1, D.T - D.S1));
  } else if (mode === 'yesOnly') {
    p = frac(D.S1, D.Y);
    prompt = `One of the ${D.Y} ${ctx.heads[0].toLowerCase()} in the "${ctx.a[0]}" group is chosen at random. What is the probability that they are in the group "${ctx.s[0].toLowerCase()}"?`;
    steps = [`Only the ${D.Y} in the "${ctx.a[0]}" group can be chosen, so ${D.Y} is the denominator.`, `$\\frac{${D.S1}}{${D.Y}}${p.d !== D.Y ? ` = ${p.tex()}` : ''}$`];
    wrong.push(frac(D.S1, D.T), frac(D.S1, D.S2), frac(D.S2, D.Y), frac(D.Y, D.T));
  } else {
    p = frac(D.T - D.S1, D.T);
    prompt = `One ${one} is chosen at random from all ${D.T}. What is the probability that they are <b>not</b> in the group "${ctx.a[0]}, ${ctx.s[0].toLowerCase()}"?`;
    steps = [`Everyone except the ${D.S1}: $${D.T} - ${D.S1} = ${D.T - D.S1}$ (this includes all ${D.N} in "${ctx.a[1]}").`, `$\\frac{${D.T - D.S1}}{${D.T}}${p.d !== D.T ? ` = ${p.tex()}` : ''}$`];
    wrong.push(frac(D.S2, D.T), frac(D.N, D.T), frac(D.S2, D.Y), frac(D.S1, D.T));
  }
  return {
    prompt: `${D.T} ${ctx.q}. The frequency tree shows the results.<br>${prompt}`,
    visual,
    answer: ft(p),
    distractors: probOpts(p, wrong),
    typed: typedP(p),
    solution: [...steps, `Answer: ${ft(p)}`],
  };
}, { title: 'Probabilities and fractions from a frequency tree' });

/* ================================================================== */
/* prob-venn                                                           */
/* ================================================================== */

// [letter, set description, "n ___" verb phrase, negated verb phrase, "also ___" phrase]
const VENN_CTX = [
  { u: 'students in a class', A: ['F', 'students who play football', 'play football', 'do not play football', 'play football'], B: ['T', 'students who play tennis', 'play tennis', 'do not play tennis', 'play tennis'], both: 'play both sports', neither: 'play neither sport' },
  { u: 'people in bands', A: ['S', 'singers', 'are singers', 'are not singers', 'sing'], B: ['G', 'guitar players', 'play the guitar', 'do not play the guitar', 'play the guitar'], both: 'sing and play the guitar', neither: 'do neither' },
  { u: 'people at a gym', A: ['W', 'people who use weights', 'use weights', 'do not use weights', 'use weights'], B: ['C', 'people who go to classes', 'go to classes', 'do not go to classes', 'go to classes'], both: 'do both', neither: 'do neither' },
  { u: 'students', A: ['A', 'students who study Art', 'study Art', 'do not study Art', 'study Art'], B: ['F', 'students who study French', 'study French', 'do not study French', 'study French'], both: 'study both subjects', neither: 'study neither subject' },
  { u: 'people in a survey', A: ['C', 'people who own a cat', 'own a cat', 'do not own a cat', 'own a cat'], B: ['D', 'people who own a dog', 'own a dog', 'do not own a dog', 'own a dog'], both: 'own both a cat and a dog', neither: 'own neither a cat nor a dog' },
  { u: 'shoppers', A: ['C', 'shoppers who buy a coat', 'buy a coat', 'do not buy a coat', 'buy a coat'], B: ['D', 'shoppers who buy a dress', 'buy a dress', 'do not buy a dress', 'buy a dress'], both: 'buy both', neither: 'buy neither a coat nor a dress' },
  { u: 'people at a café', A: ['T', 'people who order tea', 'order tea', 'do not order tea', 'order tea'], B: ['K', 'people who order cake', 'order cake', 'do not order cake', 'order cake'], both: 'order both', neither: 'order neither' },
  { u: 'students', A: ['C', 'students who study Chemistry', 'study Chemistry', 'do not study Chemistry', 'study Chemistry'], B: ['P', 'students who study Physics', 'study Physics', 'do not study Physics', 'study Physics'], both: 'study both', neither: 'study neither subject' },
  { u: 'passengers on a plane', A: ['B', 'passengers in Business Class', 'are in Business Class', 'are not in Business Class', 'are in Business Class'], B: ['F', 'passengers flying for the first time', 'are flying for the first time', 'are not flying for the first time', 'are flying for the first time'], both: 'are in Business Class and flying for the first time', neither: 'are in neither group' },
  { u: 'people', A: ['H', 'people who own a gaming headset', 'own a gaming headset', 'do not own a gaming headset', 'own a gaming headset'], B: ['W', 'people who own a smart watch', 'own a smart watch', 'do not own a smart watch', 'own a smart watch'], both: 'own both', neither: 'own neither' },
  { u: 'children at a party', A: ['Z', 'children who ate pizza', 'ate pizza', 'did not eat pizza', 'ate pizza'], B: ['J', 'children who drank juice', 'drank juice', 'did not drink juice', 'drank juice'], both: 'had both', neither: 'had neither' },
  { u: 'members of a club', A: ['R', 'members who run', 'run', 'do not run', 'run'], B: ['S', 'members who swim', 'swim', 'do not swim', 'swim'], both: 'run and swim', neither: 'do neither' },
];

const vennValues = (rng, d) => {
  const T = pick(rng, size(d, [20, 30, 40, 50], [40, 50, 60, 80, 100], [60, 75, 80, 90, 120]));
  for (let t = 0; t < 50; t += 1) {
    const ab = int(rng, 2, Math.round(T * 0.25));
    const a = int(rng, 2, Math.round(T * 0.4));
    const b = int(rng, 2, Math.round(T * 0.4));
    const out = T - a - b - ab;
    if (out >= 1 && new Set([a, b, ab, out]).size === 4) return { a, ab, b, out, T };
  }
  throw new Error('venn');
};

// Basic regions: a (A only), ab, b (B only), out.
const SET_EXPRS = [
  { tex: (A, B) => `${A} \\cap ${B}`, r: ['ab'] },
  { tex: (A, B) => `${A} \\cup ${B}`, r: ['a', 'ab', 'b'] },
  { tex: (A) => `${A}'`, r: ['b', 'out'] },
  { tex: (A, B) => `${B}'`, r: ['a', 'out'] },
  { tex: (A, B) => `${A} \\cap ${B}'`, r: ['a'] },
  { tex: (A, B) => `${A}' \\cap ${B}`, r: ['b'] },
  { tex: (A, B) => `(${A} \\cup ${B})'`, r: ['out'] },
  { tex: (A) => A, r: ['a', 'ab'] },
  { tex: (A, B) => B, r: ['ab', 'b'] },
  { tex: (A, B) => `(${A} \\cap ${B})'`, r: ['a', 'b', 'out'] },
  { tex: (A, B) => `${A} \\cup ${B}'`, r: ['a', 'ab', 'out'] },
  { tex: (A, B) => `${A}' \\cup ${B}`, r: ['ab', 'b', 'out'] },
];
const key = (r) => [...r].sort().join(',');

export const vennRead = gen('prob-venn-read', 'prob-venn', (rng, d) => {
  const ctx = pick(rng, VENN_CTX.filter((c) => c.A[0] !== 'P' && c.B[0] !== 'P'));
  const [A] = ctx.A; const [B] = ctx.B;
  if (A === B) throw new Error('same letter');
  const V = vennValues(rng, d);
  const exprs = size(d, SET_EXPRS.slice(0, 4), SET_EXPRS.slice(0, 7), SET_EXPRS);
  const e = pick(rng, exprs);
  const fav = sum(e.r.map((r) => V[r]));
  const p = frac(fav, V.T);
  const form = shortDecimal(p, 2) && rng() < 0.35 ? 'dec' : 'frac';
  // misreadings: other expressions' values
  const others = SET_EXPRS.filter((x) => key(x.r) !== key(e.r)).map((x) => frac(sum(x.r.map((r) => V[r])), V.T));
  const wrong = [];
  if (key(e.r) === 'a,ab,b') wrong.push(frac(V.a + V.b, V.T), frac(V.a + 2 * V.ab + V.b, V.T));
  if (e.r.length === 1 && e.r[0] === 'ab') wrong.push(frac(V.ab, V.a + V.ab), frac(V.a + V.ab + V.b, V.T));
  if (key(e.r) === 'b,out') wrong.push(frac(V.a + V.ab, V.T), frac(V.out, V.T), frac(V.b, V.T));
  return {
    prompt: `The Venn diagram shows information about ${V.T} ${ctx.u}.<br>$\\xi$ = ${V.T} ${ctx.u}, &nbsp;${A} = ${ctx.A[1]}, &nbsp;${B} = ${ctx.B[1]}.<br>One of the ${ctx.u} is chosen at random. Work out $P(${e.tex(A, B)})$${form === 'dec' ? ' as a decimal' : ''}.`,
    visual: venn2({ labels: [A, B], values: V }),
    answer: pf(p, form),
    distractors: probOpts(p, [...wrong, ...others], form),
    typed: typedP(p, form),
    solution: [
      `$${e.tex(A, B)}$ means ${describeRegions(e.r, A, B)}.`,
      `Add the numbers in those regions: $${e.r.map((r) => V[r]).join(' + ')} = ${fav}$.`,
      `$P = \\frac{${fav}}{${V.T}}${form === 'dec' ? ` = ${tnum(p.value())}` : p.d !== V.T ? ` = ${p.tex()}` : ''}$`,
      `Answer: ${pf(p, form)}`,
    ],
  };
}, { title: 'Probabilities from a Venn diagram using set notation' });

function describeRegions(r, A, B) {
  const k = key(r);
  const map = {
    ab: `in both ${A} and ${B}`, a: `in ${A} but not in ${B}`, b: `in ${B} but not in ${A}`, out: `in neither ${A} nor ${B}`,
    'a,ab,b': `in ${A} or ${B} or both`, 'b,out': `not in ${A}`, 'a,out': `not in ${B}`, 'a,ab': `in ${A}`, 'ab,b': `in ${B}`,
    'a,b,out': `not in both ${A} and ${B}`, 'a,ab,out': `in ${A}, or not in ${B}`, 'ab,b,out': `in ${B}, or not in ${A}`,
  };
  return map[k] || 'the shaded regions';
}

const LETTER_PAIRS = [['A', 'B'], ['P', 'Q'], ['C', 'D'], ['X', 'Y'], ['E', 'F'], ['M', 'N'], ['S', 'T'], ['G', 'H']];

export const vennNotation = gen('prob-venn-notation', 'prob-venn', (rng, d) => {
  const [A, B] = pick(rng, LETTER_PAIRS);
  const pool = size(d, SET_EXPRS.slice(0, 7), SET_EXPRS, SET_EXPRS);
  const e = pick(rng, pool.slice(d === 'hard' ? 2 : 0));
  const reverse = d !== 'easy' && rng() < 0.4;
  const distinctOthers = [];
  const seen = new Set([key(e.r)]);
  shuffle(rng, SET_EXPRS).forEach((x) => { if (!seen.has(key(x.r))) { seen.add(key(x.r)); distinctOthers.push(x); } });
  // prefer confusable ones: same number of regions or sharing a region
  distinctOthers.sort((x, y) => (Math.abs(x.r.length - e.r.length) - Math.abs(y.r.length - e.r.length)));
  const explain = `$${e.tex(A, B)}$ is everything ${describeRegions(e.r, A, B)}.`;
  const tips = [`$\\cap$ (intersection) means "and" – in both. $\\cup$ (union) means "or" – in either or both. A dash ($${A}'$) means "not" – everything outside ${A}.`];
  if (!reverse) {
    return {
      prompt: 'Which set is shown by the shaded region of the Venn diagram?',
      visual: venn2({ labels: [A, B], values: {}, shade: e.r }),
      answer: `$${e.tex(A, B)}$`,
      distractors: distinctOthers.map((x) => `$${x.tex(A, B)}$`),
      solution: [...tips, explain, `Answer: $${e.tex(A, B)}$`],
    };
  }
  // Reverse: the diagram has four regions labelled with letters; which region(s) make up the set?
  const labels = shuffle(rng, ['w', 'x', 'y', 'z']);
  const regionOf = { a: labels[0], ab: labels[1], b: labels[2], out: labels[3] };
  const show = (r) => listAnd([...r].map((q) => regionOf[q]).sort());
  const ansTxt = `Region${e.r.length > 1 ? 's' : ''} ${show(e.r)}`;
  return {
    prompt: `The regions of this Venn diagram are labelled $w$, $x$, $y$ and $z$.<br>Which region${e.r.length > 1 ? 's make' : ' makes'} up the set $${e.tex(A, B)}$?`,
    visual: venn2({ labels: [A, B], values: regionOf }),
    answer: ansTxt,
    distractors: distinctOthers.map((x) => `Region${x.r.length > 1 ? 's' : ''} ${show(x.r)}`),
    solution: [...tips, explain, `Answer: ${ansTxt}`],
  };
}, { title: 'Set notation for regions of a Venn diagram' });

// Number sets for element Venns.
const NUMBER_SETS = [
  { name: 'even numbers', f: (x) => x % 2 === 0 },
  { name: 'odd numbers', f: (x) => x % 2 === 1 },
  { name: 'multiples of 3', f: (x) => x % 3 === 0 },
  { name: 'multiples of 4', f: (x) => x % 4 === 0 },
  { name: 'multiples of 5', f: (x) => x % 5 === 0 },
  { name: 'prime numbers', f: (x) => x > 1 && [...Array(x).keys()].slice(2).every((q) => x % q) },
  { name: 'square numbers', f: (x) => Number.isInteger(Math.sqrt(x)) },
  { name: 'factors of 24', f: (x) => 24 % x === 0 },
  { name: 'factors of 36', f: (x) => 36 % x === 0 },
  { name: 'numbers greater than 10', f: (x) => x > 10 },
  { name: 'numbers less than 7', f: (x) => x < 7 },
];

export const vennElements = gen('prob-venn-elements', 'prob-venn', (rng, d) => {
  const N = pick(rng, size(d, [10, 12], [12, 15, 16], [15, 18, 20]));
  const U = Array.from({ length: N }, (_, i) => i + 1);
  const [s1, s2] = sample(rng, NUMBER_SETS, 2);
  const [A, B] = pick(rng, LETTER_PAIRS.filter((l) => !l.includes('P')));
  const inA = U.filter(s1.f); const inB = U.filter(s2.f);
  const reg = {
    a: U.filter((x) => s1.f(x) && !s2.f(x)), ab: U.filter((x) => s1.f(x) && s2.f(x)),
    b: U.filter((x) => !s1.f(x) && s2.f(x)), out: U.filter((x) => !s1.f(x) && !s2.f(x)),
  };
  if (Object.values(reg).some((r) => r.length === 0) || reg.a.length > 9 || reg.b.length > 9 || reg.out.length > 9) throw new Error('empty region');
  const e = pick(rng, size(d, SET_EXPRS.slice(0, 2), SET_EXPRS.slice(0, 7), SET_EXPRS.slice(2)));
  const members = U.filter((x) => e.r.some((r) => reg[r].includes(x)));
  const mode = pick(rng, size(d, ['list', 'list', 'prob'], ['list', 'prob'], ['prob', 'list']));
  const setTex = (xs) => `$\\{${xs.join(', ')}\\}$`;
  const intro = `$\\xi = \\{$whole numbers from 1 to ${N}$\\}$<br>${A} = ${s1.name} &nbsp; ${B} = ${s2.name}`;
  const visual = d === 'easy' ? venn2({ labels: [A, B], values: reg, size: 14, width: 400, height: 250 }) : undefined;
  const otherSets = SET_EXPRS.filter((x) => key(x.r) !== key(e.r)).map((x) => U.filter((y) => x.r.some((r) => reg[r].includes(y))));
  if (mode === 'list') {
    if (members.length > 10) throw new Error('long');
    return {
      prompt: `${intro}<br>${d === 'easy' ? 'The Venn diagram shows these sets. ' : ''}Which list shows all the members of $${e.tex(A, B)}$?`,
      visual,
      answer: setTex(members),
      distractors: otherSets.filter((xs) => xs.length && xs.length <= 10).map(setTex),
      solution: [
        `${A} = ${setTex(inA)}, ${B} = ${setTex(inB)}.`,
        `$${e.tex(A, B)}$ means ${describeRegions(e.r, A, B)}.`,
        `Answer: ${setTex(members)}`,
      ],
    };
  }
  const p = frac(members.length, N);
  return {
    prompt: `${intro}<br>A number is chosen at random from $\\xi$. Work out $P(${e.tex(A, B)})$.`,
    visual,
    answer: ft(p),
    distractors: probOpts(p, [...otherSets.map((xs) => frac(xs.length, N)), frac(members.length, N + 1), frac(members.length, inA.length)]),
    typed: typedP(p),
    solution: [
      `${A} = ${setTex(inA)}, ${B} = ${setTex(inB)}.`,
      `Members of $${e.tex(A, B)}$: ${setTex(members)} – that is ${members.length} of the ${N} numbers.`,
      `$P = \\frac{${members.length}}{${N}}${p.d !== N ? ` = ${p.tex()}` : ''}$`,
      `Answer: ${ft(p)}`,
    ],
  };
}, { title: 'Venn diagrams of number sets' });

export const vennComplete = gen('prob-venn-complete', 'prob-venn', (rng, d) => {
  const ctx = pick(rng, VENN_CTX);
  const [A] = ctx.A; const [B] = ctx.B;
  if (A === B) throw new Error('same');
  const V = vennValues(rng, d);
  const nA = V.a + V.ab; const nB = V.ab + V.b;
  const variant = pick(rng, size(d, ['both-given', 'neither'], ['both-given', 'neither', 'fraction'], ['fraction', 'neither', 'reverse']));
  let facts; let tgt; let ans; let steps; let wrong;
  const regionName = { a: `${A} only`, b: `${B} only`, ab: `both ${A} and ${B}`, out: 'neither set' };
  if (variant === 'both-given') {
    facts = [`There are ${V.T} ${ctx.u}.`, `${nA} ${ctx.A[2]}.`, `${nB} ${ctx.B[2]}.`, `${V.ab} ${ctx.both}.`];
    tgt = pick(rng, ['a', 'b', 'out']); ans = V[tgt];
    steps = [`${A} only: $${nA} - ${V.ab} = ${V.a}$. ${B} only: $${nB} - ${V.ab} = ${V.b}$.`, `Neither: $${V.T} - ${V.a} - ${V.ab} - ${V.b} = ${V.out}$.`];
    wrong = [nA, nB, V.T - nA - nB, V.ab, V.T - nA];
  } else if (variant === 'neither') {
    facts = [`There are ${V.T} ${ctx.u}.`, `${nA} ${ctx.A[2]}.`, `${nB} ${ctx.B[2]}.`, `${V.out} ${ctx.neither}.`];
    tgt = 'ab'; ans = V.ab;
    steps = [`In at least one group: $${V.T} - ${V.out} = ${V.T - V.out}$.`, `$${nA} + ${nB} = ${nA + nB}$ counts the people in both groups twice, so both $= ${nA + nB} - ${V.T - V.out} = ${V.ab}$.`];
    wrong = [nA + nB - V.T, V.T - nA - nB - V.out + V.ab * 2, nA - V.ab, V.out, Math.abs(nA - nB)];
  } else if (variant === 'fraction') {
    const T = V.T;
    const fN = pick(rng, [frac(1, 4), frac(1, 5), frac(1, 10), frac(3, 10), frac(2, 5), frac(3, 4), frac(1, 2), frac(3, 5)]);
    const out = fN.mul(T);
    if (!out.isInt || out.value() < 2) throw new Error('frac');
    const rest = T - out.value();
    const ab = int(rng, 1, Math.max(1, Math.floor(rest / 4)));
    const a = int(rng, 1, rest - ab - 1); const b = rest - ab - a;
    if (b < 1) throw new Error('b');
    Object.assign(V, { a, ab, b, out: out.value() });
    facts = [`There are ${T} ${ctx.u}.`, `$${fN.tex()}$ of them ${ctx.neither.replace(/^(is|are) /, '')}.`.replace(' of them in ', ' of them are in '), `${a + ab} ${ctx.A[2]}.`, `${ab + b} ${ctx.B[2]}.`];
    tgt = pick(rng, ['ab', 'b', 'a']); ans = V[tgt];
    steps = [
      `Neither: $${fN.tex()} \\times ${T} = ${out.value()}$, so $${T} - ${out.value()} = ${rest}$ are in at least one group.`,
      `Both: $${a + ab} + ${ab + b} - ${rest} = ${ab}$. ${A} only: $${a + ab} - ${ab} = ${a}$. ${B} only: $${ab + b} - ${ab} = ${b}$.`,
    ];
    wrong = [a + ab, ab + b, rest, out.value(), a + ab + ab + b - T];
  } else {
    // reverse: total unknown
    facts = [`${V.a} ${ctx.A[2]} but ${ctx.B[3]}.`, `${nB} ${ctx.B[2]}. ${V.ab} of these also ${ctx.A[4]}.`, `${V.out} ${ctx.neither}.`];
    tgt = 'T'; ans = V.T;
    steps = [`${B} only: $${nB} - ${V.ab} = ${V.b}$.`, `Total: $${V.a} + ${V.ab} + ${V.b} + ${V.out} = ${V.T}$.`];
    wrong = [V.a + nB + V.out + V.ab, V.a + nB, V.a + V.b + V.out, V.T - V.ab + V.b];
  }
  const values = { a: V.a, ab: V.ab, b: V.b, out: V.out };
  Object.keys(values).forEach((r) => { if (r === tgt) values[r] = '?'; else if (d !== 'easy') values[r] = null; });
  return {
    prompt: `${facts.join('<br>')}<br>${tgt === 'T' ? `How many ${ctx.u} are there altogether?` : `Complete the Venn diagram. What number goes in the region marked <b>?</b> (${regionName[tgt]})`}`,
    visual: venn2({ labels: [A, B], values: tgt === 'T' ? { a: d === 'easy' ? V.a : null, ab: null, b: null, out: null } : values, universal: tgt === 'T' ? 'ξ' : `ξ`, }),
    answer: num(ans),
    distractors: countOpts(ans, wrong),
    typed: { kind: 'number', value: ans },
    solution: ['Fill the Venn diagram from the middle outwards: the overlap first, then each "only" region, then the outside.', ...steps, `Answer: ${num(ans)}`],
  };
}, { title: 'Complete a Venn diagram from information' });

const VENN3_CTX = [
  { u: 'students', intro: 'which sports some students play', sets: [['F', 'football'], ['T', 'tennis'], ['R', 'rugby']], verb: 'play', cat: 'sports' },
  { u: 'people at the party', intro: 'what the people at a party ate', sets: [['P', 'pizza'], ['C', 'cake'], ['S', 'salad']], verb: 'ate', cat: 'foods' },
  { u: 'students', intro: 'which languages some students study', sets: [['F', 'French'], ['G', 'German'], ['S', 'Spanish']], verb: 'study', cat: 'languages' },
  { u: 'people', intro: 'which cities some people in a survey have visited', sets: [['P', 'Paris'], ['R', 'Rome'], ['M', 'Madrid']], verb: 'have visited', cat: 'cities' },
  { u: 'households', intro: 'which pets some households have', sets: [['C', 'a cat'], ['D', 'a dog'], ['F', 'a fish']], verb: 'have', cat: 'pets' },
  { u: 'students', intro: 'which options some students take', sets: [['A', 'Art'], ['M', 'Music'], ['D', 'Drama']], verb: 'take', cat: 'subjects' },
  { u: 'members', intro: 'which classes the members of a gym go to', sets: [['Y', 'yoga'], ['S', 'spin'], ['B', 'boxing']], verb: 'go to', cat: 'classes' },
];

export const vennThree = gen('prob-venn-three', 'prob-venn', (rng, d) => {
  const ctx = pick(rng, VENN3_CTX);
  const vals = { a: int(rng, 3, 15), b: int(rng, 3, 15), c: int(rng, 3, 15), ab: int(rng, 1, 8), ac: int(rng, 1, 8), bc: int(rng, 1, 8), abc: int(rng, 1, 6), out: int(rng, 1, 10) };
  const T = sum(Object.values(vals));
  const [[X, xn], [Y, yn], [Z, zn]] = ctx.sets;
  const qs = [
    { txt: `${ctx.verb} exactly two of the three ${ctx.cat}`, r: ['ab', 'ac', 'bc'], wrong: [['ab', 'ac', 'bc', 'abc'], ['abc']] },
    { txt: `${ctx.verb} only one of the three ${ctx.cat}`, r: ['a', 'b', 'c'], wrong: [['a', 'b', 'c', 'out'], ['a']] },
    { txt: `${ctx.verb} ${xn} and ${yn} but not ${zn}`, r: ['ab'], wrong: [['ab', 'abc'], ['abc']] },
    { txt: `${ctx.verb} ${xn}`, r: ['a', 'ab', 'ac', 'abc'], wrong: [['a'], ['a', 'ab', 'ac']] },
    { txt: `${ctx.verb} none of the three ${ctx.cat}`, r: ['out'], wrong: [['a', 'b', 'c'], ['abc']] },
    { txt: `${ctx.verb} at least two of the three ${ctx.cat}`, r: ['ab', 'ac', 'bc', 'abc'], wrong: [['ab', 'ac', 'bc'], ['abc']] },
    { txt: `${ctx.verb} ${yn} or ${zn} (or both)`, r: ['b', 'c', 'ab', 'ac', 'bc', 'abc'], wrong: [['b', 'c'], ['b', 'c', 'bc']] },
  ];
  const q = pick(rng, qs.slice(0, size(d, 5, 7, 7)));
  const count = sum(q.r.map((r) => vals[r]));
  const asProb = d !== 'easy' && rng() < 0.6;
  const p = frac(count, T);
  const head = `The Venn diagram shows ${ctx.intro}: ${xn} (${X}), ${yn} (${Y}) and ${zn} (${Z}).`;
  const solution = [
    `Find the regions for "${q.txt}": ${q.r.length === 1 ? 'one region' : `${q.r.length} regions`}.`,
    `Add them: $${q.r.map((r) => vals[r]).join(' + ')} = ${count}$.`,
  ];
  if (asProb) {
    return {
      prompt: `${head} ξ = ${T} ${ctx.u}.<br>One is chosen at random. What is the probability that they ${q.txt}?`,
      visual: venn3({ labels: [X, Y, Z], values: vals }),
      answer: ft(p),
      distractors: probOpts(p, [...q.wrong.map((w) => frac(sum(w.map((r) => vals[r])), T)), frac(count, T - vals.out), frac(T - count, T)]),
      typed: typedP(p),
      solution: [...solution, `Total in the diagram: ${T}, so $P = \\frac{${count}}{${T}}${p.d !== T ? ` = ${p.tex()}` : ''}$.`, `Answer: ${ft(p)}`],
    };
  }
  return {
    prompt: `${head}<br>How many ${ctx.u} ${q.txt}?`,
    visual: venn3({ labels: [X, Y, Z], values: vals }),
    answer: num(count),
    distractors: countOpts(count, [...q.wrong.map((w) => sum(w.map((r) => vals[r]))), T - count]),
    typed: { kind: 'number', value: count },
    solution: [...solution, `Answer: ${num(count)}`],
  };
}, { title: 'Three-set Venn diagrams' });

export const vennAlgebra = gen('prob-venn-algebra', 'prob-venn', (rng, d) => {
  const ctx = pick(rng, VENN_CTX.filter((c) => c.A[0] !== 'P' && c.B[0] !== 'P'));
  const [A] = ctx.A; const [B] = ctx.B;
  if (A === B) throw new Error('same');
  const x = int(rng, 2, size(d, 6, 9, 12));
  // regions as px + q
  const coef = size(d, [1, 2, 1, 0], shuffle(rng, [1, 2, 3, 0]), shuffle(rng, [1, 2, 3, 4]));
  const consts = [int(rng, 0, 5), int(rng, -1, 4), int(rng, 0, 6), int(rng, 1, 9)];
  const regions = ['a', 'ab', 'b', 'out'];
  const val = regions.map((_, i) => coef[i] * x + consts[i]);
  if (val.some((v) => v < 1)) throw new Error('neg');
  const T = sum(val);
  const ex = (i) => {
    const c = coef[i]; const k = consts[i];
    if (c === 0) return String(k);
    const t = `${c === 1 ? '' : c}x`;
    return k === 0 ? t : `${t} ${k < 0 ? '-' : '+'} ${Math.abs(k)}`;
  };
  const C = sum(coef); const K = sum(consts);
  const e = pick(rng, SET_EXPRS.slice(0, 7));
  const fav = sum(e.r.map((r) => val[regions.indexOf(r)]));
  const p = frac(fav, T);
  return {
    prompt: `The Venn diagram shows the numbers of ${ctx.u} in each region, in terms of $x$.<br>${A} = ${ctx.A[1]}, ${B} = ${ctx.B[1]}. There are ${T} ${ctx.u} altogether.<br>One is chosen at random. Work out $P(${e.tex(A, B)})$.`,
    visual: venn2({ labels: [A, B], values: Object.fromEntries(regions.map((r, i) => [r, ex(i)])), size: 15 }),
    answer: ft(p),
    distractors: probOpts(p, [
      ...SET_EXPRS.filter((s) => key(s.r) !== key(e.r)).map((s) => frac(sum(s.r.map((r) => val[regions.indexOf(r)])), T)),
      frac(sum(e.r.map((r) => coef[regions.indexOf(r)])), C), frac(fav, T + x),
    ]),
    typed: typedP(p),
    solution: [
      `All the regions add up to ${T}: $${regions.map((_, i) => `(${ex(i)})`).join(' + ')} = ${T}$.`,
      `$${C}x ${K < 0 ? '-' : '+'} ${Math.abs(K)} = ${T}$, so $${C}x = ${T - K}$ and $x = ${x}$.`,
      e.r.length > 1 ? `Regions for $${e.tex(A, B)}$: $${e.r.map((r) => val[regions.indexOf(r)]).join(' + ')} = ${fav}$.` : `The region for $${e.tex(A, B)}$ holds ${fav}.`,
      `$P = \\frac{${fav}}{${T}}${p.d !== T ? ` = ${p.tex()}` : ''}$`,
      `Answer: ${ft(p)}`,
    ],
  };
}, { title: 'Venn diagram with algebraic expressions' });

export const twoWayArchetypes = [twoWayComplete, twoWayProb, twoWayFromInfo, ftreeComplete, ftreeProb];
export const vennArchetypes = [vennRead, vennNotation, vennElements, vennComplete, vennThree, vennAlgebra];

void [names, cap, tnum];
