// Statistics generators: bar charts, pictograms, tally charts, line graphs and pie charts.
import {
  pick, int, size, shuffle, sample, num, tnum, money, roundTo, tidy, table, chance, frac, gcd,
} from '../../core.js';
import { sgen, fracDistractors, fracEq, sum, numDistractors } from './util.js';
import { barChart, pictogram, tallyChart, lineGraph, pieChart } from './charts.js';

/** Scale for a bar chart / line graph by difficulty: unit = value of one small square. */
function pickScale(rng, d) {
  return pick(rng, size(d,
    [{ step: 2, minor: 2, unit: 1, n: 8 }, { step: 1, minor: 0, unit: 1, n: 10 }],
    [{ step: 5, minor: 5, unit: 1, n: 8 }, { step: 4, minor: 4, unit: 1, n: 6 }, { step: 10, minor: 5, unit: 2, n: 5 }],
    [{ step: 10, minor: 5, unit: 2, n: 8 }, { step: 20, minor: 4, unit: 5, n: 6 }, { step: 50, minor: 5, unit: 10, n: 6 }]));
}
const valsOn = (rng, k, sc, { min = 1 } = {}) => {
  const top = sc.step * sc.n;
  for (let t = 0; t < 100; t += 1) {
    const v = Array.from({ length: k }, () => sc.unit * int(rng, Math.max(1, Math.ceil(min / sc.unit)), Math.floor(top / sc.unit) - 1));
    if (new Set(v).size === k && Math.max(...v) > top * 0.55) return v;
  }
  throw new Error('bar values');
};
const yAxis = (sc, vals, title) => {
  const top = Math.max(sc.step * 2, Math.ceil((Math.max(...vals) + sc.unit) / sc.step) * sc.step);
  return { max: top, step: sc.step, minor: sc.minor, title };
};

/* ------------------------------------------------------------------ */
/* Bar charts                                                           */
/* ------------------------------------------------------------------ */

const BAR_CTX = [
  { intro: 'Some students were asked to choose their favourite fruit. The bar chart shows the results.', cats: ['Apple', 'Banana', 'Grapes', 'Orange', 'Pear'], xTitle: 'Fruit', yTitle: 'Number of students', ask: (c) => `How many students chose ${c.toLowerCase()}?`, who: 'students' },
  { intro: 'The bar chart shows how the students in Year 9 travel to school.', cats: ['Walk', 'Car', 'Bus', 'Bike', 'Train'], xTitle: 'How they travel', yTitle: 'Number of students', ask: (c) => `How many students ${c === 'Walk' ? 'walk to school' : `travel by ${c.toLowerCase()}`}?`, who: 'students' },
  { intro: 'An ice cream van recorded the flavours of the ice creams it sold one afternoon.', cats: ['Vanilla', 'Choc', 'Mint', 'Toffee', 'Lemon'], xTitle: 'Flavour', yTitle: 'Number sold', ask: (c) => `How many ${c === 'Choc' ? 'chocolate' : c.toLowerCase()} ice creams were sold?`, who: 'ice creams', label: (c) => (c === 'Choc' ? 'chocolate' : c.toLowerCase()) },
  { intro: 'Kai recorded the colours of the cars that drove past his school.', cats: ['Black', 'White', 'Red', 'Blue', 'Silver'], xTitle: 'Colour', yTitle: 'Number of cars', ask: (c) => `How many ${c.toLowerCase()} cars drove past?`, who: 'cars' },
  { intro: 'The bar chart shows the number of books borrowed from a library each day one week.', cats: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], xTitle: 'Day', yTitle: 'Number of books', ask: (c) => `How many books were borrowed on ${{ Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday' }[c]}?`, who: 'books', label: (c) => ({ Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday' }[c]) },
  { intro: 'A vet recorded the types of animal she treated one month.', cats: ['Cat', 'Dog', 'Rabbit', 'Horse', 'Bird'], xTitle: 'Animal', yTitle: 'Number treated', ask: (c) => `How many ${c === 'Horse' ? 'horses' : `${c.toLowerCase()}s`} did she treat?`, who: 'animals' },
  { intro: 'Students voted for their favourite sport. The bar chart shows the results.', cats: ['Football', 'Netball', 'Tennis', 'Rugby', 'Hockey'], xTitle: 'Sport', yTitle: 'Number of votes', ask: (c) => `How many votes did ${c.toLowerCase()} get?`, who: 'votes' },
  { intro: 'A café recorded the hot drinks it sold one morning.', cats: ['Tea', 'Coffee', 'Hot choc', 'Latte', 'Mocha'], xTitle: 'Drink', yTitle: 'Number sold', ask: (c) => `How many ${c === 'Hot choc' ? 'hot chocolates' : `${c.toLowerCase()}s`} were sold?`, who: 'drinks', label: (c) => (c === 'Hot choc' ? 'hot chocolate' : c.toLowerCase()) },
  { intro: 'The bar chart shows the number of sunny days in some months last year.', cats: ['Apr', 'May', 'Jun', 'Jul', 'Aug'], xTitle: 'Month', yTitle: 'Number of sunny days', ask: (c) => `How many sunny days were there in ${{ Apr: 'April', May: 'May', Jun: 'June', Jul: 'July', Aug: 'August' }[c]}?`, who: 'sunny days', label: (c) => ({ Apr: 'April', May: 'May', Jun: 'June', Jul: 'July', Aug: 'August' }[c]), small: true },
];
const catLabel = (ctx, c) => (ctx.label ? ctx.label(c) : c.toLowerCase());
const plural = (w) => ({ horse: 'horses', lorry: 'lorries', bus: 'buses', 'hot chocolate': 'hot chocolates' }[w] || `${w}s`);
const travel = (w) => (w === 'walk' ? 'walk' : `travel by ${w}`);
// "How many more … than …?" in the words of each context (labels already lower case / full names)
const BAR_MORE = {
  Fruit: (a, b) => `How many more students chose ${a} than ${b}?`,
  'How they travel': (a, b) => `How many more students ${travel(a)} than ${travel(b)}?`,
  Flavour: (a, b) => `How many more ${a} ice creams than ${b} ice creams were sold?`,
  Colour: (a, b) => `How many more ${a} cars than ${b} cars drove past?`,
  Day: (a, b) => `How many more books were borrowed on ${a} than on ${b}?`,
  Animal: (a, b) => `How many more ${plural(a)} than ${plural(b)} did the vet treat?`,
  Sport: (a, b) => `How many more votes did ${a} get than ${b}?`,
  Drink: (a, b) => `How many more ${plural(a)} than ${plural(b)} were sold?`,
  Month: (a, b) => `How many more sunny days were there in ${a} than in ${b}?`,
};
const TALLY_MORE = {
  Pet: (a, b) => `How many more students chose ${a} than ${b}?`,
  Colour: (a, b) => `How many more people chose ${a} than ${b}?`,
  Transport: (a, b) => `How many more students ${travel(a)} than ${travel(b)}?`,
  Flavour: (a, b) => `How many more packets of ${a} crisps than ${b} crisps were sold?`,
  Score: (a, b) => `How many more times did Ben roll a ${a} than a ${b}?`,
  Vehicle: (a, b) => `How many more ${plural(a)} than ${plural(b)} passed Laura's house?`,
};

export const barRead = sgen('stat-bar-read', 'stat-bar-pictograms', (rng, d) => {
  const ctx = pick(rng, BAR_CTX);
  let sc = pickScale(rng, d);
  if (ctx.small) sc = { step: d === 'easy' ? 2 : 5, minor: d === 'easy' ? 2 : 5, unit: 1, n: 6 };
  const k = size(d, 4, 5, 5);
  const cats = ctx.cats.slice(0, k);
  const vals = valsOn(rng, k, sc);
  const y = yAxis(sc, vals, ctx.yTitle);
  const visual = barChart({ categories: cats, series: [{ name: '', values: vals }], y, xTitle: ctx.xTitle, width: 440, height: 290 });
  const q = size(d, 'read', pick(rng, ['read', 'more', 'total']), pick(rng, ['more', 'total', 'fraction', 'twice']));
  const [i, j] = sample(rng, [...Array(k).keys()], 2);
  const total = sum(vals);
  const u = sc.unit;
  const scaleTip = sc.minor ? `Each small square is worth ${u} (${sc.step} ÷ ${sc.minor}).` : 'Each square is worth 1.';
  if (q === 'read') {
    const ans = vals[i];
    return {
      prompt: `${ctx.intro}<br>${ctx.ask(cats[i])}`,
      visual,
      answer: num(ans),
      distractors: numDistractors(ans, [ans + u, ans - u, ans + sc.step, ans - sc.step, ...vals.filter((_, m) => m !== i), ans + 2 * u], { integer: true }),
      typed: { kind: 'number', value: ans },
      solution: [`${scaleTip}`, `The ${catLabel(ctx, cats[i])} bar reaches ${num(ans)}.`, `Answer: ${num(ans)}`],
    };
  }
  if (q === 'more') {
    const [hi, lo] = vals[i] > vals[j] ? [i, j] : [j, i];
    const ans = vals[hi] - vals[lo];
    return {
      prompt: `${ctx.intro}<br>${BAR_MORE[ctx.xTitle](catLabel(ctx, cats[hi]), catLabel(ctx, cats[lo]))}`,
      visual,
      answer: num(ans),
      distractors: numDistractors(ans, [vals[hi] + vals[lo], vals[hi], vals[lo], ans + u, ans - u, ans + sc.step], { integer: true }),
      typed: { kind: 'number', value: ans },
      solution: [scaleTip, `${cap(catLabel(ctx, cats[hi]))}: ${vals[hi]}; ${catLabel(ctx, cats[lo])}: ${vals[lo]}.`, `Difference: $${vals[hi]} - ${vals[lo]} = ${ans}$`, `Answer: ${num(ans)}`],
    };
  }
  if (q === 'total') {
    return {
      prompt: `${ctx.intro}<br>How many ${ctx.who} are shown on the bar chart altogether?`,
      visual,
      answer: num(total),
      distractors: numDistractors(total, [total - vals[k - 1], total + u * 2, total - u * 3, Math.max(...vals) * k, total + sc.step, sum(vals.map((v) => v - u))], { integer: true }),
      typed: { kind: 'number', value: total },
      solution: [scaleTip, `Read every bar: ${vals.join(', ')}.`, `Total: $${vals.join(' + ')} = ${total}$`, `Answer: ${num(total)}`],
    };
  }
  if (q === 'twice') {
    // Which category had twice as many as another? Build it in.
    const v2 = vals[j] * 2;
    if (v2 > y.max || vals.includes(v2)) throw new Error('twice');
    vals[i] = v2;
    const vis2 = barChart({ categories: cats, series: [{ name: '', values: vals }], y: yAxis(sc, vals, ctx.yTitle), xTitle: ctx.xTitle, width: 440, height: 290 });
    const others = cats.filter((_, m) => m !== i && m !== j && !vals.some((v) => v === vals[m] * 2));
    return {
      prompt: `${ctx.intro}<br>The number for one category was exactly twice the number for ${catLabel(ctx, cats[j])}. Which category?`,
      visual: vis2,
      answer: cats[i],
      distractors: shuffle(rng, others),
      count: Math.min(4, others.length + 1),
      solution: [scaleTip, `${cap(catLabel(ctx, cats[j]))}: ${vals[j]}, and $2 \\times ${vals[j]} = ${v2}$.`, `The ${catLabel(ctx, cats[i])} bar reaches ${v2}.`, `Answer: ${cats[i]}`],
    };
  }
  const f = frac(vals[i], total);
  return {
    prompt: `${ctx.intro}<br>What fraction of the ${ctx.who} were for ${catLabel(ctx, cats[i])}?<br>Give your answer in its simplest form.`,
    visual,
    answer: `$${f.tex()}$`,
    distractors: fracDistractors(f, [frac(vals[i], total - vals[i]), frac(vals[i], Math.max(...vals) === vals[i] ? total - 1 : Math.max(...vals)), frac(vals[j], total), frac(vals[i] + u, total), frac(vals[i], 100)]),
    solution: [scaleTip, `Total $= ${vals.join(' + ')} = ${total}$`, `Fraction $= ${fracEq(vals[i], total, f)}$`, `Answer: $${f.tex()}$`],
  };
}, { title: 'Read and interpret a bar chart' });
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

const DAY_NAME = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday' };
// diffQ(category, more, less), totalQ(series): wording for each context; vals: optional realistic band [lo, hi].
const DUAL_CTX = [
  { intro: 'The dual bar chart shows the number of medals a country won at two events.', cats: ['Gold', 'Silver', 'Bronze'], series: ['2008', '2012'], xTitle: 'Medal', yTitle: 'Number of medals', diffQ: (c, m, l) => `How many more ${c.toLowerCase()} medals did the country win in ${m} than in ${l}?`, totalQ: (s) => `How many medals did the country win altogether in ${s}?` },
  { intro: 'The dual bar chart shows how many boys and girls in a year group chose each club.', cats: ['Art', 'Chess', 'Drama', 'Music'], series: ['Boys', 'Girls'], xTitle: 'Club', yTitle: 'Number of students', diffQ: (c, m, l) => `How many more ${m.toLowerCase()} than ${l.toLowerCase()} chose ${c}?`, totalQ: (s) => `How many ${s.toLowerCase()} are shown on the chart altogether?` },
  { intro: 'The dual bar chart shows the number of cakes a bakery sold on two days.', cats: ['Lemon', 'Carrot', 'Choc', 'Coffee'], series: ['Saturday', 'Sunday'], xTitle: 'Cake', yTitle: 'Number sold', diffQ: (c, m, l) => `How many more ${c === 'Choc' ? 'chocolate' : c.toLowerCase()} cakes were sold on ${m} than on ${l}?`, totalQ: (s) => `How many cakes did the bakery sell altogether on ${s}?` },
  { intro: 'The dual bar chart shows the hours of sunshine in two towns over three months.', cats: ['June', 'July', 'August'], series: ['Torquay', 'Whitby'], xTitle: 'Month', yTitle: 'Hours of sunshine', big: true, vals: [15, 26], diffQ: (c, m, l) => `In ${c}, how many more hours of sunshine did ${m} have than ${l}?`, totalQ: (s) => `How many hours of sunshine did ${s} have altogether in these three months?` },
  { intro: 'The dual bar chart shows the numbers of visitors to a museum in the mornings and afternoons.', cats: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], series: ['Morning', 'Afternoon'], xTitle: 'Day', yTitle: 'Number of visitors', diffQ: (c, m, l) => `On ${DAY_NAME[c]}, how many more visitors were there in the ${m.toLowerCase()} than in the ${l.toLowerCase()}?`, totalQ: (s) => `How many visitors came in the ${s.toLowerCase()} altogether, Monday to Friday?` },
];
const COMPOSITE_CTX = [
  { intro: 'The composite bar chart shows the percentage of drinks of each type sold by a café in two years.', series: ['Coffee', 'Tea', 'Other'], cats: ['2015', '2023'], noun: 'drinks', item: (s) => `${s.toLowerCase()}s`.replace('others', 'other drinks') },
  { intro: 'The composite bar chart shows how students in two schools travel to school, as percentages.', series: ['Walk', 'Bus', 'Car'], cats: ['School A', 'School B'], noun: 'students', item: (s) => ({ Walk: 'students who walk', Bus: 'students who take the bus', Car: 'students who come by car' }[s]) },
  { intro: 'The composite bar chart shows the percentage of each type of ticket sold at a cinema in two months.', series: ['Adult', 'Child', 'Senior'], cats: ['May', 'June'], noun: 'tickets', item: (s) => `${s.toLowerCase()} tickets` },
  { intro: 'The composite bar chart shows the percentage of each type of waste collected in two towns.', series: ['Paper', 'Plastic', 'Glass'], cats: ['Ashby', 'Bexley'], noun: 'tonnes of waste', item: (s) => `tonnes of ${s.toLowerCase()}` },
];

export const barDualComposite = sgen('stat-bar-dual-composite', 'stat-bar-pictograms', (rng, d) => {
  const composite = d === 'hard' || (d === 'medium' && chance(rng, 0.4));
  if (!composite) {
    const ctx = pick(rng, DUAL_CTX);
    const sc = ctx.big ? { step: 50, minor: 5, unit: 10, n: 6 } : pickScale(rng, d === 'easy' ? 'easy' : 'medium');
    const k = ctx.cats.length;
    const band = () => Array.from({ length: k }, () => sc.unit * int(rng, ctx.vals[0], ctx.vals[1]));
    const a = ctx.vals ? band() : valsOn(rng, k, sc); const b = ctx.vals ? band() : valsOn(rng, k, sc);
    const y = yAxis(sc, [...a, ...b], ctx.yTitle);
    const visual = barChart({ categories: ctx.cats, series: [{ name: ctx.series[0], values: a }, { name: ctx.series[1], values: b }], y, xTitle: ctx.xTitle, width: 440, height: 300 });
    const q = pick(rng, ['diff', 'total', 'most']);
    const i = int(rng, 0, k - 1);
    const label = DAY_NAME[ctx.cats[i]] || (ctx.cats[i] === 'Choc' ? 'Chocolate' : ctx.cats[i]);
    if (q === 'diff') {
      const ans = Math.abs(a[i] - b[i]);
      const more = a[i] > b[i] ? ctx.series[0] : ctx.series[1]; const less = more === ctx.series[0] ? ctx.series[1] : ctx.series[0];
      return {
        prompt: `${ctx.intro}<br>${ctx.diffQ(ctx.cats[i], more, less)}`,
        visual,
        answer: num(ans),
        distractors: numDistractors(ans, [a[i] + b[i], Math.max(a[i], b[i]), ans + sc.unit, ans - sc.unit, Math.abs(a[(i + 1) % k] - b[(i + 1) % k]), ans + sc.step], { integer: true }),
        typed: { kind: 'number', value: ans },
        solution: [`Each small square is worth ${sc.unit}.`, `${label}: ${ctx.series[0]} ${a[i]}, ${ctx.series[1]} ${b[i]}.`, `Difference: $${Math.max(a[i], b[i])} - ${Math.min(a[i], b[i])} = ${ans}$`, `Answer: ${num(ans)}`],
      };
    }
    if (q === 'total') {
      const which = chance(rng) ? 0 : 1; const vals = which ? b : a;
      const ans = sum(vals);
      return {
        prompt: `${ctx.intro}<br>${ctx.totalQ(ctx.series[which])}`,
        visual,
        answer: num(ans),
        distractors: numDistractors(ans, [sum(which ? a : b), sum(a) + sum(b), ans + sc.unit, ans - sc.step, ans + 2 * sc.unit], { integer: true }),
        typed: { kind: 'number', value: ans },
        solution: [`Use only the ${ctx.series[which]} bars (check the key).`, `$${vals.join(' + ')} = ${ans}$`, `Answer: ${num(ans)}`],
      };
    }
    const diffs = ctx.cats.map((_, m) => Math.abs(b[m] - a[m]));
    const best = Math.max(...diffs);
    if (diffs.filter((x) => x === best).length > 1 || best <= 0) throw new Error('unclear difference');
    const ans = ctx.cats[diffs.indexOf(best)];
    const catName = (c) => (DAY_NAME[c] || (c === 'Choc' ? 'chocolate' : c));
    return {
      prompt: `${ctx.intro}<br>For which ${ctx.xTitle.toLowerCase()} was the difference between ${ctx.series[0]} and ${ctx.series[1]} the greatest?`,
      visual,
      answer: ans,
      distractors: ctx.cats.filter((c) => c !== ans),
      count: k,
      keepOrder: true,
      order: ctx.cats,
      solution: [`Find the gap between the two bars for each ${ctx.xTitle.toLowerCase()}: ${ctx.cats.map((c, m) => `${catName(c)} ${diffs[m]}`).join(', ')}.`, `The biggest difference is ${best}.`, `Answer: ${ans}`],
    };
  }
  const ctx = pick(rng, COMPOSITE_CTX);
  const mk = () => { const p1 = 2 * int(rng, 10, 30); const p2 = 2 * int(rng, 8, 50 - p1 / 2 - 4); return [p1, p2, 100 - p1 - p2]; };
  const A = mk(); const B = mk();
  const visual = barChart({ categories: ctx.cats, series: ctx.series.map((s, m) => ({ name: s, values: [A[m], B[m]] })), stacked: true, y: { max: 100, step: 10, minor: 5, title: `Percentage of ${ctx.noun.replace('tonnes of ', '')}` }, xTitle: '', width: 360, height: 330, gap: 0.5 });
  const which = chance(rng) ? 0 : 1; const P = which ? B : A;
  const N = pick(rng, [200, 400, 500, 800, 1200, 1500, 2000, 2400, 3000, 24000]);
  const [s1, s2] = sample(rng, [0, 1, 2], 2);
  if (P[s1] === P[s2]) throw new Error('equal');
  const [hiS, loS] = P[s1] > P[s2] ? [s1, s2] : [s2, s1];
  const ans = tidy(((P[hiS] - P[loS]) * N) / 100);
  if (!Number.isInteger(ans)) throw new Error('not integer');
  const cumTop = sum(P.slice(0, hiS + 1));
  return {
    prompt: `${ctx.intro}<br>In ${ctx.cats[which]} there were ${num(N)} ${ctx.noun} in total.<br>How many more ${ctx.item(ctx.series[hiS])} than ${ctx.item(ctx.series[loS])} were there?`,
    visual,
    answer: num(ans),
    distractors: numDistractors(ans, [P[hiS] - P[loS], (cumTop - P[loS]) * N / 100, P[hiS] * N / 100, P[loS] * N / 100, (P[hiS] + P[loS]) * N / 100, ans + N / 50], { integer: true }),
    typed: { kind: 'number', value: ans },
    solution: [
      'In a composite bar chart, each section\'s <b>height</b> (top minus bottom) is its percentage. Don\'t read the top of the section from the axis.',
      `${ctx.series[hiS]}: ${P[hiS]}%; ${ctx.series[loS]}: ${P[loS]}%. Difference $= ${P[hiS] - P[loS]}\\%$`,
      `$${P[hiS] - P[loS]}\\%$ of ${num(N)} $= \\frac{${P[hiS] - P[loS]}}{100} \\times ${tnum(N)} = ${tnum(ans)}$`,
      `Answer: ${num(ans)}`,
    ],
  };
}, { title: 'Dual and composite bar charts' });

/* ------------------------------------------------------------------ */
/* Pictograms                                                           */
/* ------------------------------------------------------------------ */

const PICTO_CTX = [
  { intro: 'The pictogram shows the number of cars washed at a car wash each day.', rows: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], unit: 'cars', ask: (r) => `How many cars were washed on ${r}?` },
  { intro: 'The pictogram shows the number of ice creams sold at a kiosk.', rows: ['June', 'July', 'August', 'September'], unit: 'ice creams', ask: (r) => `How many ice creams were sold in ${r}?` },
  { intro: 'The pictogram shows how many books some students read last year.', rows: ['Amir', 'Bella', 'Chen', 'Dev', 'Ella'], unit: 'books', ask: (r) => `How many books did ${r} read?` },
  { intro: 'A swimming pool has changing rooms. The pictogram shows how many people used each one during an hour.', rows: ['Male', 'Female', 'Family'], unit: 'people', ask: (r) => `How many people used the ${r} changing room?` },
  { intro: 'The pictogram shows the number of cakes sold at a school fair.', rows: ['Cupcakes', 'Brownies', 'Flapjacks', 'Muffins'], unit: 'cakes', ask: (r) => `How many ${r.toLowerCase()} were sold?` },
  { intro: 'The pictogram shows the number of emails Priya received each day.', rows: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'], unit: 'emails', ask: (r) => `How many emails did Priya receive on ${r}?` },
  { intro: 'The pictogram shows the weather recorded in a town over some days.', rows: ['Rain', 'Snow', 'Cloud', 'Sun'], unit: 'days', ask: (r) => `On how many days was ${r.toLowerCase()} recorded?` },
  { intro: 'The pictogram shows the number of houses in a street with 3, 4 and 5 bedrooms.', rows: ['3 bedrooms', '4 bedrooms', '5 bedrooms'], unit: 'houses', ask: (r) => `How many houses have ${r}?` },
  { intro: 'The pictogram shows the number of pieces of homework Rashid did in some subjects.', rows: ['History', 'Science', 'French', 'Maths'], unit: 'pieces of homework', ask: (r) => `How many pieces of ${r} homework did Rashid do?` },
];

export const pictogramRead = sgen('stat-pictogram', 'stat-bar-pictograms', (rng, d) => {
  const ctx = pick(rng, PICTO_CTX);
  const per = pick(rng, size(d, [2, 4, 10], [4, 6, 8, 10], [4, 8, 12, 20]));
  const quarters = per % 4 === 0;
  const symbol = quarters && chance(rng) ? 'square' : 'circle';
  const parts = quarters ? 4 : 2; // allowed partial symbols
  const rowsN = ctx.rows.length;
  const vals = Array.from({ length: rowsN }, () => (per / parts) * int(rng, parts, parts * 5));
  if (new Set(vals).size < rowsN) throw new Error('dupe rows');
  if (ctx.rows.includes('Snow')) { // snow should be the rarest weather
    const si = ctx.rows.indexOf('Snow'); const mi = vals.indexOf(Math.min(...vals));
    [vals[si], vals[mi]] = [vals[mi], vals[si]];
  }
  const q = size(d, pick(rng, ['read', 'read', 'more']), pick(rng, ['read', 'total', 'more']), pick(rng, ['key', 'symbols', 'total']));
  const i = int(rng, 0, rowsN - 1);
  const rows = ctx.rows.map((r, m) => ({ label: r, value: vals[m] }));
  const keyUnit = ctx.unit;
  const symName = symbol === 'square' ? 'square' : 'circle';
  const partTip = parts === 4 ? `A quarter of a ${symName} is $${per} \\div 4 = ${per / 4}$.` : `Half a ${symName} is $${per} \\div 2 = ${per / 2}$.`;
  const symCount = (v) => { const w = Math.floor(v / per); const r = (v % per) / per; return w + r; };
  const symText = (v) => { const w = Math.floor(v / per); const r = frac(v % per, per); return r.n === 0 ? `${w}` : w ? `${w}\\frac{${r.n}}{${r.d}}` : `\\frac{${r.n}}{${r.d}}`; };
  if (q === 'key') {
    const visual = pictogram({ rows, per, symbol, keyText: `represents ? ${keyUnit}` });
    return {
      prompt: `${ctx.intro}<br>The key is missing. The row for ${ctx.rows[i]} represents ${num(vals[i])} ${keyUnit}.<br>How many ${keyUnit} does one whole symbol represent?`,
      visual,
      answer: num(per),
      distractors: numDistractors(per, [vals[i] / Math.ceil(symCount(vals[i])), Math.ceil(symCount(vals[i])), vals[i], per / 2, per * 2, vals[i] / Math.floor(symCount(vals[i]))], { integer: true }),
      typed: { kind: 'number', value: per },
      solution: [`The ${ctx.rows[i]} row has $${symText(vals[i])}$ symbols.`, `So $${symText(vals[i])}$ symbols represent ${vals[i]}, and one symbol represents $${vals[i]} \\div ${symCount(vals[i])} = ${per}$.`, `Answer: ${per}`],
    };
  }
  if (q === 'symbols') {
    const target = (per / parts) * int(rng, parts + 1, parts * 5);
    const visual = pictogram({ rows: rows.map((r, m) => (m === i ? { ...r, value: null } : r)), per, symbol, unit: keyUnit });
    const ans = symText(target);
    return {
      prompt: `${ctx.intro}<br>The row for ${ctx.rows[i]} has not been completed. It should show ${num(target)} ${keyUnit}.<br>How many symbols should be drawn?`,
      visual,
      answer: `$${ans}$`,
      distractors: [target / per + 1, Math.floor(target / per), target, target / per - 0.5, target / per + 0.5, (target / per) * 2, target / per + 0.25].filter((v) => v > 0 && Math.abs(v - target / per) > 1e-9 && Number.isInteger(v * 4) && (parts === 4 || Number.isInteger(v * 2) || v === target)).map((v) => (v === target ? `$${num(v)}$` : `$${symText(v * per)}$`)),
      solution: [`One symbol represents ${per} ${keyUnit}.`, `$${target} \\div ${per} = ${num(target / per)}$`, partTip, `Answer: $${ans}$ symbols`],
    };
  }
  const visual = pictogram({ rows, per, symbol, unit: keyUnit });
  if (q === 'read') {
    const ans = vals[i];
    return {
      prompt: `${ctx.intro}<br>${ctx.ask(ctx.rows[i])}`,
      visual,
      answer: num(ans),
      distractors: numDistractors(ans, [Math.ceil(symCount(ans)), Math.ceil(symCount(ans)) * per, Math.floor(symCount(ans)) * per, Math.floor(symCount(ans)) + (ans % per ? 0.5 : 0), ans + per / parts, ans - per / parts, Math.floor(symCount(ans)) * per + 1], { integer: true }),
      typed: { kind: 'number', value: ans },
      solution: [`Each whole symbol represents ${per}. ${partTip}`, `The ${ctx.rows[i]} row has $${symText(ans)}$ symbols.`, `$${symText(ans)} \\times ${per} = ${ans}$`, `Answer: ${num(ans)}`],
    };
  }
  if (q === 'more') {
    const j = (i + 1 + int(rng, 0, rowsN - 2)) % rowsN;
    const [hi, lo] = vals[i] > vals[j] ? [i, j] : [j, i];
    const ans = vals[hi] - vals[lo];
    return {
      prompt: `${ctx.intro}<br>How many more ${keyUnit} were there for ${ctx.rows[hi]} than for ${ctx.rows[lo]}?`,
      visual,
      answer: num(ans),
      distractors: numDistractors(ans, [symCount(vals[hi]) - symCount(vals[lo]), vals[hi] + vals[lo], ans + per / parts, ans - per / parts, ans + per, vals[hi]], { integer: true }),
      typed: { kind: 'number', value: ans },
      solution: [`Each whole symbol represents ${per}. ${partTip}`, `${ctx.rows[hi]}: ${vals[hi]}; ${ctx.rows[lo]}: ${vals[lo]}.`, `$${vals[hi]} - ${vals[lo]} = ${ans}$`, `Answer: ${num(ans)}`],
    };
  }
  const total = sum(vals);
  return {
    prompt: `${ctx.intro}<br>Work out the total number of ${keyUnit} shown.`,
    visual,
    answer: num(total),
    distractors: numDistractors(total, [sum(vals.map(symCount)), sum(vals.map((v) => Math.ceil(symCount(v)) * per)), sum(vals.map((v) => Math.floor(symCount(v)) * per)), total + per, total - per / parts], { integer: true }),
    typed: { kind: 'number', value: total },
    solution: [`Each whole symbol represents ${per}. ${partTip}`, `Rows: ${vals.join(', ')}.`, `Total: $${vals.join(' + ')} = ${total}$`, `Answer: ${num(total)}`],
  };
}, { title: 'Read a pictogram (key and part symbols)' });

/* ------------------------------------------------------------------ */
/* Tally charts                                                         */
/* ------------------------------------------------------------------ */

const TALLY_CTX = [
  { head: 'Pet', rows: ['Cat', 'Dog', 'Fish', 'Rabbit', 'Hamster'], intro: 'Some students were asked what pet they would most like.', who: 'students' },
  { head: 'Colour', rows: ['Red', 'Blue', 'Green', 'Yellow', 'Purple'], intro: 'Some people were asked their favourite colour.', who: 'people' },
  { head: 'Transport', rows: ['Walk', 'Bus', 'Car', 'Bike', 'Train'], intro: 'Students recorded how they travel to school.', who: 'students' },
  { head: 'Flavour', rows: ['Plain', 'Salt & vinegar', 'Cheese', 'Prawn', 'Chicken'], intro: 'A tuck shop recorded the crisps it sold one lunchtime.', who: 'packets' },
  { head: 'Score', rows: ['1', '2', '3', '4', '5', '6'], intro: 'Ben rolled a dice and recorded each score in a tally chart.', who: 'rolls' },
  { head: 'Vehicle', rows: ['Car', 'Van', 'Lorry', 'Bus', 'Motorbike'], intro: 'Laura recorded the vehicles that passed her house.', who: 'vehicles' },
];
export const tallyRead = sgen('stat-tally', 'stat-bar-pictograms', (rng, d) => {
  if (d === 'hard' && chance(rng, 0.5)) {
    // Criticise a grouped tally chart.
    const fault = pick(rng, ['overlap', 'gap', 'missing']);
    const w = pick(rng, [5, 10]); const k = 5;
    const top = w * k;
    const labels = [];
    for (let m = 0; m < k; m += 1) {
      const a = m * w; const b = (m + 1) * w;
      if (fault === 'overlap') labels.push(`${a} to ${b}`);
      else if (fault === 'gap') labels.push(`${a} to ${b - 2}`);
      else labels.push(`${a} to ${b - 1}`);
    }
    const dataMax = fault === 'missing' ? top + int(rng, 2, 8) : fault === 'gap' ? top - 2 - int(rng, 0, 2) : top - int(rng, 0, 2);
    const thing = pick(rng, [['cars in the car park each hour', 'Number of cars'], ['minutes spent on homework', 'Minutes'], ['points scored in each game', 'Points']]);
    const opts = {
      overlap: `The groups overlap, so a value such as ${w} fits in two groups`,
      gap: `There are gaps between the groups, so a value such as ${w - 1} does not fit in any group`,
      missing: fault === 'missing' ? `There is no group for values above ${top - 1}, but the largest value is ${dataMax}` : 'Some of the values are too large to fit in any group',
      wider: 'The groups should be wider, so there are fewer of them',
      start: 'The first group should start at 1, not 0',
    };
    const visual = tallyChart({ rows: labels.map((l) => ({ label: l, count: 0 })), headers: [thing[1], 'Tally', 'Frequency'] });
    const ans = opts[fault];
    return {
      prompt: `Katy recorded the number of ${thing[0]}. The smallest value was 0 and the largest was ${dataMax}.<br>She draws this tally chart to group the data.<br>What is wrong with her tally chart?`,
      visual,
      answer: ans,
      distractors: shuffle(rng, Object.entries(opts).filter(([key]) => key !== fault).map(([, v]) => v)),
      count: 4,
      solution: ['Groups for data must not overlap, must not leave gaps, and must cover every value.', `Look at the group boundaries: ${labels.join(', ')}.`, `Answer: ${ans}`],
    };
  }
  const ctx = pick(rng, TALLY_CTX);
  const k = ctx.head === 'Score' ? 6 : Math.min(ctx.rows.length, size(d, 4, 5, 6)); // a dice shows every face
  const counts = Array.from({ length: k }, () => int(rng, 1, size(d, 12, 18, 23)));
  const maxC = Math.max(...counts);
  if (counts.filter((c) => c === maxC).length > 1) throw new Error('tie');
  const q = size(d, pick(rng, ['read', 'most']), pick(rng, ['read', 'total', 'more']), pick(rng, ['total', 'more', 'fraction']));
  const i = int(rng, 0, k - 1);
  const rows = ctx.rows.slice(0, k).map((r, m) => ({ label: r, count: counts[m] }));
  const visual = tallyChart({ rows, headers: [ctx.head, 'Tally', 'Frequency'] });
  const groups = (c) => `${Math.floor(c / 5)} group${Math.floor(c / 5) === 1 ? '' : 's'} of 5 and ${c % 5} more`;
  if (q === 'read') {
    const ans = counts[i];
    return {
      prompt: `${ctx.intro}<br>What is the frequency for ${ctx.rows[i]}?`,
      visual, answer: num(ans),
      distractors: numDistractors(ans, [Math.floor(ans / 5) * 4 + (ans % 5), Math.floor(ans / 5) + (ans % 5), ans + 1, ans - 1, ans + 5, Math.ceil(ans / 5) * 5], { integer: true }),
      typed: { kind: 'number', value: ans },
      solution: ['Each bundle with a line across it (four marks crossed by a fifth) is 5.', `${ctx.rows[i]} has ${groups(ans)}: $${5 * Math.floor(ans / 5)} + ${ans % 5} = ${ans}$`, `Answer: ${ans}`],
    };
  }
  if (q === 'most') {
    const ans = ctx.rows[counts.indexOf(maxC)];
    return {
      prompt: `${ctx.intro}<br>Which ${ctx.head.toLowerCase()} was the most common?`,
      visual, answer: ans,
      distractors: ctx.rows.slice(0, k).filter((r) => r !== ans),
      count: Math.min(k, 5), keepOrder: true, order: ctx.rows,
      solution: ['Count each row: a crossed bundle is 5.', `Frequencies: ${ctx.rows.slice(0, k).map((r, m) => `${r} ${counts[m]}`).join(', ')}.`, `Answer: ${ans}`],
    };
  }
  if (q === 'more') {
    const j = (i + 1) % k;
    const [hi, lo] = counts[i] > counts[j] ? [i, j] : [j, i];
    if (counts[hi] === counts[lo]) throw new Error('tie');
    const ans = counts[hi] - counts[lo];
    return {
      prompt: `${ctx.intro}<br>${TALLY_MORE[ctx.head](ctx.head === 'Score' ? ctx.rows[hi] : ctx.rows[hi].toLowerCase(), ctx.head === 'Score' ? ctx.rows[lo] : ctx.rows[lo].toLowerCase())}`,
      visual, answer: num(ans),
      distractors: numDistractors(ans, [counts[hi] + counts[lo], counts[hi], ans + 1, ans - 1, ans + 5, ans + 4], { integer: true }),
      typed: { kind: 'number', value: ans },
      solution: [`${ctx.rows[hi]}: ${counts[hi]}; ${ctx.rows[lo]}: ${counts[lo]}.`, `$${counts[hi]} - ${counts[lo]} = ${ans}$`, `Answer: ${ans}`],
    };
  }
  const total = sum(counts);
  if (q === 'total') {
    return {
      prompt: `${ctx.intro}<br>How many ${ctx.who} are recorded in the tally chart altogether?`,
      visual, answer: num(total),
      distractors: numDistractors(total, [total - counts[k - 1], sum(counts.map((c) => Math.floor(c / 5) * 4 + (c % 5))), total + 5, total - 5, total + 1], { integer: true }),
      typed: { kind: 'number', value: total },
      solution: [`Frequencies: ${counts.join(', ')}.`, `Total: $${counts.join(' + ')} = ${total}$`, `Answer: ${total}`],
    };
  }
  const f = frac(counts[i], total);
  return {
    prompt: `${ctx.intro}<br>What fraction of the ${ctx.who} were for ${ctx.rows[i]}? Give your answer in its simplest form.`,
    visual, answer: `$${f.tex()}$`,
    distractors: fracDistractors(f, [frac(counts[i], total - counts[i]), frac(counts[i] + 1, total), frac(counts[(i + 1) % k], total), frac(1, counts[i]), frac(counts[i], 100)]),
    solution: [`Frequencies: ${counts.join(', ')}, total ${total}.`, `Fraction $= ${fracEq(counts[i], total, f)}$`, `Answer: $${f.tex()}$`],
  };
}, { title: 'Read a tally chart (and criticise grouping)' });

/* ------------------------------------------------------------------ */
/* Line graphs / time series                                            */
/* ------------------------------------------------------------------ */

const LINE_CTX = [
  { intro: 'The graph shows the temperature in a garden at different times one day.', labels: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'], yTitle: 'Temperature (°C)', unit: '°C', range: [4, 26], val: 'temperature', shape: 'hump', at: (l) => `at ${l}`, xTitle: 'Time' },
  { intro: 'The time series graph shows the monthly rainfall in a town.', labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'], full: ['January', 'February', 'March', 'April', 'May', 'June', 'July'], yTitle: 'Rainfall (mm)', val: 'rainfall', unit: 'mm', range: [20, 120], shape: 'down', at: (l) => `in ${l}`, xTitle: 'Month' },
  { intro: 'The graph shows the number of visitors, in thousands, to a theme park each month.', labels: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'], full: ['March', 'April', 'May', 'June', 'July', 'August', 'September'], yTitle: 'Visitors (thousands)', val: 'number of visitors', unit: 'thousand', range: [10, 90], shape: 'hump', at: (l) => `in ${l}`, xTitle: 'Month' },
  { intro: 'The time series graph shows the number of bikes sold by a shop each quarter.', labels: ['Q1', 'Q2', 'Q3', 'Q4', 'Q1', 'Q2', 'Q3', 'Q4'], full: ['Q1 2023', 'Q2 2023', 'Q3 2023', 'Q4 2023', 'Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024'], yTitle: 'Bikes sold', val: 'number of bikes sold', unit: '', range: [20, 100], shape: 'season', at: (l) => `in ${l}`, xTitle: 'Quarter (2023, 2024)' },
  { intro: 'The graph shows the mean price of a house in a town each year, in thousands of pounds.', labels: ['2017', '2018', '2019', '2020', '2021', '2022', '2023'], yTitle: 'Price (£ thousands)', val: 'mean house price', unit: 'money', range: [150, 290], shape: 'up', at: (l) => `in ${l}`, xTitle: 'Year' },
  { intro: 'The graph shows the time Lena took to run 5 km each week as she trained for a race.', labels: ['1', '2', '3', '4', '5', '6', '7', '8'], full: ['week 1', 'week 2', 'week 3', 'week 4', 'week 5', 'week 6', 'week 7', 'week 8'], yTitle: 'Time (minutes)', unit: 'minutes', range: [24, 40], val: 'time', shape: 'down', at: (l) => `in ${l}`, xTitle: 'Week' },
  { intro: 'The graph shows the height of a sunflower measured each week.', labels: ['1', '2', '3', '4', '5', '6', '7'], full: ['week 1', 'week 2', 'week 3', 'week 4', 'week 5', 'week 6', 'week 7'], yTitle: 'Height (cm)', unit: 'cm', range: [10, 150], grow: true, val: 'height', shape: 'up', at: (l) => `in ${l}`, xTitle: 'Week' },
  { intro: 'The graph shows the number of people in a café each hour.', labels: ['9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm'], yTitle: 'Number of people', unit: 'people', val: 'number of people', range: [4, 40], shape: 'hump', at: (l) => `at ${l}`, xTitle: 'Time' },
  { intro: 'The time series shows the number of electric cars sold in a town each year.', labels: ['2018', '2019', '2020', '2021', '2022', '2023'], yTitle: 'Number sold', unit: 'cars', val: 'number sold', range: [20, 200], shape: 'up', at: (l) => `in ${l}`, xTitle: 'Year' },
];
function seriesShape(rng, ctx, sc, n) {
  const [lo, hi] = ctx.range; const span = hi - lo;
  const raw = Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    const base = ctx.shape === 'up' ? lo + span * (0.15 + 0.75 * t) : ctx.shape === 'down' ? lo + span * (0.9 - 0.75 * t)
      : ctx.shape === 'hump' ? lo + span * (0.2 + 0.75 * Math.sin(Math.PI * t)) : lo + span * (0.35 + 0.08 * (i >= 4 ? 1 : 0) + [0.05, 0.3, 0.5, 0.1][i % 4]);
    return base + (rng() - 0.5) * span * 0.18;
  });
  const out = raw.map((v) => Math.max(sc.unit, Math.round(v / sc.unit) * sc.unit));
  // things that grow (a plant's height) never go down
  if (ctx.grow) for (let i = 1; i < out.length; i += 1) out[i] = Math.max(out[i], out[i - 1]);
  return out;
}
function lineScale(ctx, d) {
  const span = ctx.range[1] - ctx.range[0];
  const step = span <= 30 ? (d === 'easy' ? 2 : 5) : span <= 100 ? (d === 'easy' ? 10 : 20) : 20;
  const minor = step === 2 ? 2 : step === 5 ? 5 : step === 10 ? 5 : 4;
  return { step, minor, unit: step / minor };
}
const lineUnit = (ctx, v) => (ctx.unit === 'money' ? `£${num(v)} thousand` : ctx.unit === 'thousand' ? `${num(v)} thousand` : `${num(v)}${ctx.unit ? ` ${ctx.unit}` : ''}`);
const lineName = (ctx, i) => (ctx.full ? ctx.full[i] : ctx.labels[i]);
function lineChartFor(ctx, vals, sc) {
  const mn = Math.min(...vals); const mx = Math.max(...vals);
  const ymin = mn > sc.step * 4 ? Math.floor((mn - sc.unit) / sc.step) * sc.step : 0;
  const ymax = Math.ceil((mx + sc.unit) / sc.step) * sc.step;
  return lineGraph({ labels: ctx.labels, series: [{ name: '', values: vals }], y: { min: ymin, max: ymax, step: sc.step, minor: sc.minor, title: ctx.yTitle, breakAxis: ymin > 0 }, xTitle: ctx.xTitle, width: 460, height: 300 });
}

export const lineRead = sgen('stat-line-read', 'stat-line-graphs', (rng, d) => {
  const ctx = pick(rng, LINE_CTX);
  const sc = lineScale(ctx, d);
  const n = ctx.labels.length;
  const vals = seriesShape(rng, ctx, sc, n);
  const visual = lineChartFor(ctx, vals, sc);
  const q = size(d, 'read', pick(rng, ['read', 'diff', 'max']), pick(rng, ['diff', 'max', 'rise']));
  const i = int(rng, 0, n - 1);
  const f = (v) => lineUnit(ctx, v);
  const tip = `Each small square on the vertical axis is ${num(sc.unit)}.`;
  if (q === 'read') {
    return {
      prompt: `${ctx.intro}<br>What was the ${ctx.val} ${ctx.at(lineName(ctx, i))}?`,
      visual, answer: f(vals[i]),
      distractors: numDistractors(vals[i], [vals[i] + sc.unit, vals[i] - sc.unit, vals[i] + sc.step / 2, vals[(i + 1) % n], vals[(i + n - 1) % n], vals[i] + sc.step], { fmt: f }),
      typed: { kind: 'number', value: vals[i] },
      solution: [tip, `Go up from ${lineName(ctx, i)} to the point, then across to the scale.`, `Answer: ${f(vals[i])}`],
    };
  }
  if (q === 'diff') {
    let j = int(rng, 0, n - 1); if (j === i) j = (i + 2) % n;
    const [a, b] = i < j ? [i, j] : [j, i];
    const ans = Math.abs(vals[b] - vals[a]);
    if (!ans) throw new Error('no change');
    return {
      prompt: `${ctx.intro}<br>Work out the difference between the ${ctx.val} ${ctx.at(lineName(ctx, a))} and ${ctx.at(lineName(ctx, b))}.`,
      visual, answer: f(ans),
      distractors: numDistractors(ans, [vals[a] + vals[b], ans + sc.unit, ans - sc.unit, ans + sc.step, Math.max(vals[a], vals[b])], { fmt: f }),
      typed: { kind: 'number', value: ans },
      solution: [tip, `${cap(lineName(ctx, a))}: ${f(vals[a])}; ${lineName(ctx, b)}: ${f(vals[b])}.`, `Difference: $${Math.max(vals[a], vals[b])} - ${Math.min(vals[a], vals[b])} = ${ans}$`, `Answer: ${f(ans)}`],
    };
  }
  if (q === 'max') {
    const want = chance(rng) ? 'highest' : 'lowest';
    const target = want === 'highest' ? Math.max(...vals) : Math.min(...vals);
    if (vals.filter((v) => v === target).length > 1) throw new Error('tie');
    const ans = lineName(ctx, vals.indexOf(target));
    return {
      prompt: `${ctx.intro}<br>When was the ${ctx.val} ${want}?`,
      visual, answer: cap(ans),
      distractors: shuffle(rng, ctx.labels.map((_, m) => cap(lineName(ctx, m))).filter((x) => x !== cap(ans))),
      count: 5,
      solution: [`Find the ${want} point on the graph.`, `It is ${f(target)}, ${ctx.at(ans)}.`, `Answer: ${cap(ans)}`],
    };
  }
  const rises = vals.slice(1).map((v, m) => v - vals[m]);
  const best = Math.max(...rises);
  if (best <= 0 || rises.filter((r) => r === best).length > 1) throw new Error('no clear rise');
  const m = rises.indexOf(best);
  const opt = (k) => `Between ${lineName(ctx, k)} and ${lineName(ctx, k + 1)}`;
  return {
    prompt: `${ctx.intro}<br>Between which two consecutive points was the biggest <b>increase</b>?`,
    visual, answer: opt(m),
    distractors: shuffle(rng, rises.map((_, k) => k).filter((k) => k !== m).map(opt)),
    count: Math.min(5, rises.length),
    solution: ['The biggest increase is the steepest line segment going <b>up</b>.', `Changes: ${rises.map((r, k) => `${lineName(ctx, k)}→${lineName(ctx, k + 1)}: ${r > 0 ? '+' : ''}${r}`).join(', ')}.`, `Answer: ${opt(m)}`],
  };
}, { title: 'Read a line graph / time series' });

const TWO_LINE_CTX = [
  { intro: 'The graph shows the mean monthly temperature in two cities.', labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], full: ['January', 'February', 'March', 'April', 'May', 'June'], series: ['London', 'Aberdeen'], yTitle: 'Temperature (°C)', range: [2, 20], unit: '°C', step: 5 },
  { intro: 'The graph shows the number of members of two clubs over six years.', labels: ['2018', '2019', '2020', '2021', '2022', '2023'], series: ['Tennis', 'Golf'], yTitle: 'Members', range: [20, 100], unit: 'members', step: 20 },
  { intro: 'The graph shows the sales of two magazines, in thousands, over six months.', labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], full: ['July', 'August', 'September', 'October', 'November', 'December'], series: ['Magazine A', 'Magazine B'], yTitle: 'Sales (thousands)', range: [10, 50], unit: 'thousand', step: 10 },
  { intro: 'The graph shows the heights of two plants measured each week.', labels: ['1', '2', '3', '4', '5', '6'], full: ['week 1', 'week 2', 'week 3', 'week 4', 'week 5', 'week 6'], series: ['Plant A', 'Plant B'], grow: true, yTitle: 'Height (cm)', range: [4, 40], unit: 'cm', step: 10 },
];
const TREND = {
  up: 'There is an increasing trend: the values generally go up over time',
  down: 'There is a decreasing trend: the values generally go down over time',
  hump: 'The values increase to a peak and then decrease',
  season: 'The values follow a repeating pattern that is highest in the same quarter each year',
  dip: 'The values decrease to a low point and then increase',
};
export const lineInterpret = sgen('stat-line-interpret', 'stat-line-graphs', (rng, d) => {
  if (d !== 'easy' && chance(rng, d === 'hard' ? 0.7 : 0.4)) {
    const ctx = pick(rng, TWO_LINE_CTX);
    const n = ctx.labels.length; const span = ctx.range[1] - ctx.range[0];
    const unitV = ctx.step / 5;
    const mk = (off) => Array.from({ length: n }, (_, i) => Math.round((ctx.range[0] + span * (0.15 + 0.6 * (i / (n - 1)) + off) + (rng() - 0.5) * span * 0.25) / unitV) * unitV);
    const grow = (s) => (ctx.grow ? s.map((v, i) => Math.max(...s.slice(0, i + 1))) : s);
    const a = grow(mk(0.15)); const b = grow(mk(-0.05).map((v) => Math.max(unitV, v)));
    const diffs = a.map((v, i) => Math.abs(v - b[i]));
    const q = pick(rng, ['greatest', 'value']);
    const ymax = Math.ceil((Math.max(...a, ...b) + unitV) / ctx.step) * ctx.step;
    const visual = lineGraph({ labels: ctx.labels, series: [{ name: ctx.series[0], values: a }, { name: ctx.series[1], values: b }], y: { min: 0, max: ymax, step: ctx.step, minor: 5, title: ctx.yTitle }, xTitle: '', width: 460, height: 300 });
    const name = (i) => (ctx.full ? ctx.full[i] : ctx.labels[i]);
    if (q === 'greatest') {
      const best = Math.max(...diffs);
      if (diffs.filter((x) => x === best).length > 1) throw new Error('tie');
      const ans = cap(name(diffs.indexOf(best)));
      return {
        prompt: `${ctx.intro}<br>When was the difference between ${ctx.series[0]} and ${ctx.series[1]} greatest?`,
        visual, answer: ans,
        distractors: shuffle(rng, ctx.labels.map((_, i) => cap(name(i))).filter((x) => x !== ans)),
        solution: ['The difference is the vertical gap between the two lines.', `Gaps: ${ctx.labels.map((_, i) => `${name(i)} ${num(diffs[i])}`).join(', ')}.`, `Answer: ${ans}`],
      };
    }
    const i = int(rng, 0, n - 1);
    const ans = diffs[i];
    if (!ans) throw new Error('zero');
    const fu = (v) => `${num(v)}${ctx.unit === 'thousand' ? ' thousand' : ` ${ctx.unit}`}`;
    return {
      prompt: `${ctx.intro}<br>How much higher was ${a[i] > b[i] ? ctx.series[0] : ctx.series[1]} than ${a[i] > b[i] ? ctx.series[1] : ctx.series[0]} in ${name(i)}?`,
      visual, answer: fu(ans),
      distractors: numDistractors(ans, [a[i] + b[i], Math.max(a[i], b[i]), ans + unitV, ans - unitV, diffs[(i + 1) % n] || null, ans + ctx.step], { fmt: fu }),
      typed: { kind: 'number', value: ans },
      solution: [`Each small square is ${num(unitV)}.`, `${ctx.series[0]}: ${num(a[i])}; ${ctx.series[1]}: ${num(b[i])}.`, `Difference: $${Math.max(a[i], b[i])} - ${Math.min(a[i], b[i])} = ${num(ans)}$`, `Answer: ${fu(ans)}`],
    };
  }
  const ctx = pick(rng, LINE_CTX);
  const sc = lineScale(ctx, d);
  const vals = seriesShape(rng, ctx, sc, ctx.labels.length);
  const visual = lineChartFor(ctx, vals, sc);
  const ans = TREND[ctx.shape];
  return {
    prompt: `${ctx.intro}<br>Which statement best describes the graph?`,
    visual, answer: ans,
    distractors: shuffle(rng, ['up', 'down', 'hump', 'dip', ...(ctx.shape === 'season' ? ['season'] : [])].filter((k) => TREND[k] !== ans).map((k) => TREND[k])).slice(0, 3),
    count: 4,
    solution: ['Look at the overall shape, not just one or two points.', `From ${lineName(ctx, 0)} to ${lineName(ctx, ctx.labels.length - 1)} the values go ${vals.map((v) => num(v)).join(', ')}.`, `Answer: ${ans}`],
  };
}, { title: 'Interpret trends and compare two time series' });

/* ------------------------------------------------------------------ */
/* Pie charts                                                           */
/* ------------------------------------------------------------------ */

const PIE_CTX = [
  { intro: 'Some students were asked how they travel to school.', cats: ['Walk', 'Bus', 'Car', 'Bike', 'Train'], who: 'students', head: 'Method' },
  { intro: 'Visitors to a zoo were asked which animal was their favourite.', cats: ['Lions', 'Penguins', 'Monkeys', 'Giraffes', 'Snakes'], who: 'visitors', head: 'Animal' },
  { intro: 'Some people were asked how they mainly listen to music.', cats: ['Streaming', 'Radio', 'CD', 'Vinyl', 'Other'], who: 'people', head: 'Method' },
  { intro: 'A café recorded the sandwiches it sold one day.', cats: ['Cheese', 'Ham', 'Tuna', 'Egg', 'Vegan'], who: 'sandwiches', head: 'Sandwich', verb: 'were' },
  { intro: 'In an election, each voter chose one of the candidates.', cats: ['Ahmed', 'Brown', 'Clarke', 'Davies', 'Evans'], who: 'voters', head: 'Candidate', verb: 'voted for' },
  { intro: 'Some football players were asked the colour of their team\'s shirts.', cats: ['White', 'Blue', 'Red', 'Green', 'Yellow'], who: 'players', head: 'Colour', verb: 'said' },
  { intro: 'A garden centre recorded the types of plant it sold one weekend.', cats: ['Roses', 'Herbs', 'Shrubs', 'Bulbs', 'Trees'], who: 'plants', head: 'Plant', verb: 'were' },
  { intro: 'Students chose one language to study next year.', cats: ['French', 'Spanish', 'German', 'Mandarin', 'Italian'], who: 'students', head: 'Language' },
  { intro: 'An ice cream shop recorded the number of scoops of each flavour sold.', cats: ['Vanilla', 'Chocolate', 'Mint', 'Strawberry', 'Toffee'], who: 'scoops', head: 'Flavour', verb: 'were' },
];
/** Frequencies with a total that divides 360, every angle at least `minAngle`. */
function pieData(rng, k, totals, minAngle = 24) {
  for (let t = 0; t < 300; t += 1) {
    const T = pick(rng, totals); const per = 360 / T;
    const minF = Math.ceil(minAngle / per);
    if (minF * k > T) continue;
    const fs = Array(k).fill(minF);
    let left = T - minF * k;
    while (left > 0) { fs[int(rng, 0, k - 1)] += 1; left -= 1; }
    if (new Set(fs).size < k - 1) continue;
    return { T, fs, angles: fs.map((f) => f * per), per };
  }
  throw new Error('pie data');
}
const deg = (a) => `${num(a)}°`;

export const pieAngle = sgen('stat-pie-angle', 'stat-pie-charts', (rng, d) => {
  const ctx = pick(rng, PIE_CTX);
  const k = size(d, 3, 4, 5);
  const totals = size(d, [36, 60, 90, 120, 180], [24, 30, 40, 45, 72, 120], [40, 45, 72, 80, 90, 24, 18]);
  const P = pieData(rng, k, totals, 18);
  const i = int(rng, 0, k - 1);
  const ans = P.angles[i];
  const pct = roundTo((P.fs[i] / P.T) * 100, 1);
  return {
    prompt: `${ctx.intro}${table([[ctx.head, 'Frequency'], ...ctx.cats.slice(0, k).map((c, m) => [c, num(P.fs[m])])])}The information is to be shown in a pie chart.<br>Work out the angle for ${ctx.cats[i]}.`,
    answer: deg(ans),
    distractors: numDistractors(ans, [P.fs[i], P.fs[i] * (P.T / 360) * 10, 360 / P.fs[i], pct, P.fs[i] * 10, ans + P.per, ans - P.per, 360 - ans, (P.fs[i] / P.T) * 100 * 3.6 + 10], { fmt: deg, integer: true }),
    typed: { kind: 'number', value: ans },
    solution: [
      `Total frequency $= ${P.fs.join(' + ')} = ${P.T}$`,
      `The whole circle, $360^\\circ$, is shared between ${P.T} ${ctx.who}: each one gets $360 \\div ${P.T} = ${P.per}^\\circ$.`,
      `${ctx.cats[i]}: $${P.fs[i]} \\times ${P.per} = ${ans}^\\circ$`,
      `Answer: ${deg(ans)}`,
    ],
  };
}, { title: 'Work out a pie chart angle' });

export const pieRead = sgen('stat-pie-read', 'stat-pie-charts', (rng, d) => {
  const ctx = pick(rng, PIE_CTX);
  const k = size(d, 3, 4, 4);
  const totals = size(d, [36, 60, 90, 120, 180, 360], [24, 30, 40, 45, 72, 120, 180], [40, 45, 72, 90, 60, 36]);
  const P = pieData(rng, k, totals, 30);
  const scaleUp = d === 'hard' ? pick(rng, [1, 5, 10, 20]) : d === 'medium' ? pick(rng, [1, 2, 5]) : 1;
  const T = P.T * scaleUp; const fs = P.fs.map((f) => f * scaleUp);
  const i = int(rng, 0, k - 1);
  const hideI = d === 'hard' && chance(rng, 0.6);
  const sectors = ctx.cats.slice(0, k).map((c, m) => ({ label: c, angle: P.angles[m], angleLabel: hideI && m === i ? null : deg(P.angles[m]) }));
  const visual = pieChart({ sectors, title: null });
  const q = d === 'easy' ? pick(rng, ['count', 'fraction']) : 'count';
  const ans = fs[i];
  if (q === 'fraction') {
    const f = frac(P.angles[i], 360);
    return {
      prompt: `${ctx.intro}<br>The pie chart shows the results.<br>What fraction of the ${ctx.who} ${ctx.verb || 'chose'} ${ctx.cats[i]}? Give your answer in its simplest form.`,
      visual, answer: `$${f.tex()}$`,
      distractors: fracDistractors(f, [frac(P.angles[i], 100), frac(P.angles[i], 180), frac(1, k), frac(P.angles[(i + 1) % k], 360), frac(P.angles[i], 360 - P.angles[i]), frac(P.angles[i] + 30, 360), frac(P.angles[i] - 30, 360), frac(P.angles[i] + 60, 360), frac(10, P.angles[i])]),
      solution: ['The whole pie is $360^\\circ$.', `${ctx.cats[i]} has $${P.angles[i]}^\\circ$, so the fraction is $${fracEq(P.angles[i], 360, f)}$`, `Answer: $${f.tex()}$`],
    };
  }
  const others = P.angles.filter((_, m) => m !== i);
  return {
    prompt: `${ctx.intro}<br>The pie chart shows the results for ${num(T)} ${ctx.who}.<br>How many ${ctx.who} ${ctx.verb || 'chose'} ${ctx.cats[i]}?`,
    visual, answer: num(ans),
    distractors: numDistractors(ans, [P.angles[i], T * P.angles[i] / 100, (P.angles[i] / 360) * 100, T - ans, Math.round(T / k), ans + scaleUp * 2, ans * 2], { integer: true }),
    typed: { kind: 'number', value: ans },
    solution: [
      ...(hideI ? [`The angle for ${ctx.cats[i]} is not shown: $360 - (${others.join(' + ')}) = ${P.angles[i]}^\\circ$`] : []),
      `${ctx.cats[i]} is $\\frac{${P.angles[i]}}{360}$ of the pie.`,
      `$\\frac{${P.angles[i]}}{360} \\times ${tnum(T)} = ${tnum(ans)}$ (or: each degree is $${tnum(T)} \\div 360$ ${ctx.who})`,
      `Answer: ${num(ans)}`,
    ],
  };
}, { title: 'Read a number from a pie chart' });

const PIE_TOTAL_CTX = [
  { intro: 'The pie chart shows information about the voters in an election.', cats: ['Men', 'Women'], who: 'voters', diff: (a, b, x) => `${num(x)} more ${a.toLowerCase()} voted than ${b.toLowerCase()}.` },
  { intro: 'The pie chart shows the drinks sold at a café one day.', cats: ['Tea', 'Coffee', 'Juice'], who: 'drinks', diff: (a, b, x) => `${num(x)} more ${a.toLowerCase()}s than ${b.toLowerCase()}s were sold.`.replace('juices', 'juices') },
  { intro: 'The pie chart shows how some people get to work.', cats: ['Car', 'Train', 'Bus', 'Walk'], who: 'people', diff: (a, b, x) => `${num(x)} more people travel by ${a.toLowerCase()} than by ${b.toLowerCase()}.`.replace('by walk', 'on foot') },
  { intro: 'The pie chart shows the number of people at a cinema on each day of a weekend.', cats: ['Friday', 'Saturday', 'Sunday'], who: 'people', diff: (a, b, x) => `There were ${num(x)} more people on ${a} than on ${b}.` },
  { intro: 'The pie chart shows the types of tickets sold for a concert.', cats: ['Standing', 'Seated', 'VIP'], who: 'tickets', diff: (a, b, x) => `${num(x)} more ${a.toLowerCase()} tickets than ${b.toLowerCase()} tickets were sold.` },
  { intro: 'The pie chart shows the favourite crisp flavours of some students.', cats: ['Plain', 'Cheese', 'Salt & vinegar', 'Prawn'], who: 'students', diff: (a, b, x) => `${num(x)} more students chose ${a.toLowerCase()} than ${b.toLowerCase()}.` },
];
export const pieTotal = sgen('stat-pie-total', 'stat-pie-charts', (rng, d) => {
  const ctx = pick(rng, PIE_TOTAL_CTX);
  const k = ctx.cats.length;
  const P = pieData(rng, k, [12, 18, 24, 30, 36, 40, 45, 60, 72, 90, 120], 40);
  const scaleUp = pick(rng, size(d, [1, 2, 5, 10], [3, 4, 6, 10, 20], [7, 12, 15, 25, 40]));
  const T = P.T * scaleUp; const fs = P.fs.map((f) => f * scaleUp);
  const showAll = d !== 'hard';
  const hidden = showAll ? -1 : k - 1;
  const sectors = ctx.cats.map((c, m) => ({ label: c, angle: P.angles[m], angleLabel: m === hidden ? null : deg(P.angles[m]) }));
  const visual = pieChart({ sectors, notAccurate: true });
  const useDiff = d !== 'easy';
  let prompt; let solution;
  const [a, b] = sample(rng, [...Array(k).keys()], 2);
  if (useDiff) {
    if (Math.abs(P.angles[a] - P.angles[b]) < 20) throw new Error('sectors too similar');
    const [hi, lo] = P.angles[a] > P.angles[b] ? [a, b] : [b, a];
    const x = fs[hi] - fs[lo];
    const dAng = P.angles[hi] - P.angles[lo];
    prompt = `${ctx.intro}<br>${ctx.diff(ctx.cats[hi], ctx.cats[lo], x)}<br>Work out the total number of ${ctx.who}.`;
    solution = [
      ...(hidden >= 0 ? [`Missing angle: $360 - (${P.angles.slice(0, -1).join(' + ')}) = ${P.angles[k - 1]}^\\circ$`] : []),
      `The difference in angles is $${P.angles[hi]} - ${P.angles[lo]} = ${dAng}^\\circ$, and this represents ${num(x)} ${ctx.who}.`,
      `So $\\frac{${dAng}}{360}$ of the total is ${num(x)}.`,
      `Total $= ${tnum(x)} \\times 360 \\div ${dAng} = ${tnum(T)}$`,
      `Answer: ${num(T)}`,
    ];
    return {
      prompt, visual, answer: num(T),
      distractors: numDistractors(T, [x * 360 / P.angles[hi], x * 360 / P.angles[lo], x * dAng, (x / dAng) * 100, fs[hi] + fs[lo], x * k, T / 2], { integer: true }),
      typed: { kind: 'number', value: T }, calculator: d === 'hard', solution,
    };
  }
  prompt = `${ctx.intro}<br>${ctx.cats[a]}: ${num(fs[a])} ${ctx.who}.<br>Work out the total number of ${ctx.who}.`;
  return {
    prompt, visual, answer: num(T),
    distractors: numDistractors(T, [fs[a] * P.angles[a] / 10, fs[a] * 360 / 100, fs[a] + P.angles[a], fs[a] * k, (360 / P.angles[a]) * fs[a] / 2, T + fs[a]], { integer: true }),
    typed: { kind: 'number', value: T },
    solution: [`${ctx.cats[a]} is $\\frac{${P.angles[a]}}{360}$ of the total.`, `So $${fs[a]}$ is $\\frac{${P.angles[a]}}{360}$ of the total.`, `Total $= ${fs[a]} \\times 360 \\div ${P.angles[a]} = ${tnum(T)}$`, `Answer: ${num(T)}`],
  };
}, { title: 'Find the total from a pie chart' });

export const pieComplete = sgen('stat-pie-complete', 'stat-pie-charts', (rng, d) => {
  // Two sectors drawn; the remaining angle is shared between two categories in a given ratio.
  const ctx = pick(rng, PIE_CTX);
  const [r1, r2] = pick(rng, size(d, [[2, 1], [3, 1], [1, 1]], [[2, 1], [3, 1], [3, 2], [4, 1]], [[3, 2], [5, 3], [4, 3], [5, 4], [7, 2]]));
  const parts = r1 + r2;
  for (let t = 0; t < 100; t += 1) {
    const a1 = 10 * int(rng, 6, 14); const a2 = 10 * int(rng, 4, 12);
    const rest = 360 - a1 - a2;
    if (rest <= 0 || rest % parts || rest / parts < 15 || a1 === a2) continue;
    const L = (rest / parts) * r1; const M = (rest / parts) * r2;
    const cats = ctx.cats.slice(0, 4);
    const sectors = [{ label: cats[0], angle: a1, angleLabel: deg(a1) }, { label: cats[1], angle: a2, angleLabel: deg(a2) }, { label: '', angle: rest }];
    const visual = pieChart({ sectors });
    const desc = r2 === 1 && r1 === 1 ? `The numbers for ${cats[2]} and ${cats[3]} are the same.`
      : r2 === 1 ? `The number for ${cats[2]} is ${r1 === 2 ? 'twice' : `${r1} times`} the number for ${cats[3]}.`
        : `The numbers for ${cats[2]} and ${cats[3]} are in the ratio $${r1} : ${r2}$.`;
    const askL = chance(rng);
    const ans = askL ? L : M;
    return {
      prompt: `${ctx.intro}<br>The sectors for ${cats[0]} and ${cats[1]} have been drawn. The rest of the pie chart is for ${cats[2]} and ${cats[3]}.<br>${desc}<br>What angle should the sector for ${askL ? cats[2] : cats[3]} be?`,
      visual, answer: deg(ans),
      distractors: numDistractors(ans, [askL ? M : L, rest, rest / 2, rest / parts, 360 / parts * (askL ? r1 : r2), (360 - a1) / parts * (askL ? r1 : r2), ans + 10], { fmt: deg, integer: true }),
      typed: { kind: 'number', value: ans },
      solution: [
        `Angle left: $360 - ${a1} - ${a2} = ${rest}^\\circ$`,
        `Share it in the ratio $${r1} : ${r2}$: ${parts} parts, so each part is $${rest} \\div ${parts} = ${rest / parts}^\\circ$.`,
        `${askL ? cats[2] : cats[3]}: $${askL ? r1 : r2} \\times ${rest / parts} = ${ans}^\\circ$`,
        `Answer: ${deg(ans)}`,
      ],
    };
  }
  throw new Error('pie complete');
}, { title: 'Complete a pie chart from a ratio' });

// Group labels that suit each context: [labels, sentence that introduces the two totals]
const PIE_GROUPS = {
  students: [
    [['School A', 'School B'], (a, b) => `The pie charts show the results for ${a} students at School A and ${b} students at School B.`],
    [['Year 9', 'Year 11'], (a, b) => `The pie charts show the results for ${a} students in Year 9 and ${b} students in Year 11.`],
  ],
  visitors: [
    [['Saturday', 'Sunday'], (a, b) => `The pie charts show the results for ${a} visitors on Saturday and ${b} visitors on Sunday.`],
    [['2022', '2023'], (a, b) => `The pie charts show the results for ${a} visitors in 2022 and ${b} visitors in 2023.`],
  ],
  people: [
    [['Under 30', '30 and over'], (a, b) => `The pie charts show the results for ${a} people aged under 30 and ${b} people aged 30 and over.`],
    [['Leeds', 'York'], (a, b) => `The same survey was done in two towns. The pie charts show the results for ${a} people in Leeds and ${b} people in York.`],
  ],
};
export const pieCompare = sgen('stat-pie-compare', 'stat-pie-charts', (rng, d) => {
  const ctx = pick(rng, PIE_CTX.filter((c) => PIE_GROUPS[c.who]));
  const [groups, introTotals] = pick(rng, PIE_GROUPS[ctx.who]);
  for (let t = 0; t < 200; t += 1) {
    const A = pieData(rng, 3, [36, 40, 45, 60, 72], 40); const B = pieData(rng, 3, [36, 40, 45, 60, 72], 40);
    const ka = pick(rng, [2, 3, 5, 10]); const kb = pick(rng, [2, 3, 5, 10]);
    const TA = A.T * ka; const TB = B.T * kb;
    const i = int(rng, 0, 2);
    const nA = A.fs[i] * ka; const nB = B.fs[i] * kb;
    // the trap: bigger angle but fewer people
    if (nA === nB || (A.angles[i] > B.angles[i]) === (nA > nB)) continue;
    if (Math.abs(A.angles[i] - B.angles[i]) < 20) continue;
    const vis = (P, g) => pieChart({ sectors: ctx.cats.slice(0, 3).map((c, m) => ({ label: c, angle: P.angles[m], angleLabel: deg(P.angles[m]) })), title: g, r: 100 });
    const visual = `<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center">${vis(A, groups[0])}${vis(B, groups[1])}</div>`;
    const more = nA > nB ? groups[0] : groups[1]; const fewer = more === groups[0] ? groups[1] : groups[0];
    const bigAngle = A.angles[i] > B.angles[i] ? groups[0] : groups[1];
    const working = [
      'A bigger sector means a bigger <b>fraction</b>, not necessarily more people: the totals are different.',
      `${groups[0]}: $\\frac{${A.angles[i]}}{360} \\times ${tnum(TA)} = ${tnum(nA)}$`,
      `${groups[1]}: $\\frac{${B.angles[i]}}{360} \\times ${tnum(TB)} = ${tnum(nB)}$`,
    ];
    if (d === 'hard') {
      const ans = Math.abs(nA - nB);
      return {
        prompt: `${ctx.intro}<br>${introTotals(num(TA), num(TB))}<br>How many more ${ctx.who} chose ${ctx.cats[i]} in ${more} than in ${fewer}?`,
        visual,
        answer: num(ans),
        distractors: numDistractors(ans, [Math.abs(A.angles[i] - B.angles[i]), nA + nB, Math.abs(TA - TB), Math.max(nA, nB), Math.abs(A.angles[i] / 360 * TB - B.angles[i] / 360 * TA)], { integer: true }),
        typed: { kind: 'number', value: ans },
        solution: [...working, `Difference: $${tnum(Math.max(nA, nB))} - ${tnum(Math.min(nA, nB))} = ${tnum(ans)}$`, `Answer: ${num(ans)}`],
      };
    }
    const ans = `${more}: ${Math.max(nA, nB)} compared with ${Math.min(nA, nB)}`;
    return {
      prompt: `${ctx.intro}<br>${introTotals(num(TA), num(TB))}<br>In which group did more ${ctx.who} choose ${ctx.cats[i]}?`,
      visual,
      answer: ans,
      distractors: [`${bigAngle}, because its ${ctx.cats[i]} sector is bigger`, `${fewer}: ${Math.max(nA, nB)} compared with ${Math.min(nA, nB)}`, 'The same number, because the pie charts are the same size', `${bigAngle}: ${Math.max(A.angles[i], B.angles[i])} compared with ${Math.min(A.angles[i], B.angles[i])}`],
      count: 4,
      solution: [...working, `Answer: ${ans}`],
    };
  }
  throw new Error('pie compare');
}, { title: 'Compare two pie charts with different totals' });

void [money, gcd];
export const generators = [
  barRead, barDualComposite, pictogramRead, tallyRead,
  lineRead, lineInterpret,
  pieAngle, pieRead, pieTotal, pieComplete, pieCompare,
];
