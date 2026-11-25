// Learn pages: non-linear graphs. See docs/TUTORIAL_GUIDELINES.md.
import { h, p, list, steps, key, display, note, mistake, figure, example, tbl, columns } from '../../tutorial-kit.js';
import { coordGrid, panels, lineLabel, halo } from './diagrams.js';
import { ineq, clipHalf, regionVisual, trigChart } from './nonlinear.js';
import { ACCENT, ACCENT2, text } from '../../svg.js';

const S = (d) => Math.sin((d * Math.PI) / 180);
const C = (d) => Math.cos((d * Math.PI) / 180);
const Tn = (d) => Math.tan((d * Math.PI) / 180);

/* Diagrams ---------------------------------------------------------- */

function quadFigure() {
  const f = (x) => x * x - 2 * x - 3;
  const c = coordGrid({ xmin: -3, xmax: 5, ymin: -5, ymax: 6, unit: 24 });
  return c.wrap(c.curve(f) + c.lineEq(null, 1, { color: ACCENT2, dash: '6 4', width: 1.6 })
    + c.point(-1, 0) + c.point(3, 0) + c.point(1, -4, null, { color: ACCENT2 }) + c.point(0, -3)
    + c.smartLabel(-1, 0, 'root') + c.smartLabel(3, 0, 'root') + c.smartLabel(1, -4, '(1, −4)', { color: ACCENT2 })
    + lineLabel(c, null, 1, 'x = 1', { color: ACCENT2, at: 0.93 }));
}
function shapesFigure() {
  const w = { xmin: -4, xmax: 4, ymin: -4, ymax: 4 };
  const list6 = [
    ['Linear  y = 2x + 1', (x) => 2 * x + 1],
    ['Quadratic  y = x² − 2', (x) => x * x - 2],
    ['Cubic  y = x³', (x) => x ** 3 / 2],
    ['Reciprocal  y = 2/x', (x) => 2 / x],
    ['Exponential  y = 2ˣ', (x) => 2 ** x],
    ['Quadratic  y = 3 − x²', (x) => 3 - x * x],
  ];
  return panels(list6.map(([label, f]) => ({ label, window: w, draw: (c) => c.curve(f, { samples: 400 }) })), { cols: 3, pw: 120, ph: 100, labelSize: 13 });
}
function twoLinesFigure() {
  const c = coordGrid({ xmin: -2, xmax: 6, ymin: -5, ymax: 6, unit: 24 });
  return c.wrap(c.lineEq(2, -5) + c.lineEq(-1, 4, { color: ACCENT2 }) + c.point(3, 1)
    + lineLabel(c, 2, -5, 'y = 2x − 5', { color: ACCENT, at: 0.88 }) + lineLabel(c, -1, 4, 'y = 4 − x', { color: ACCENT2, at: 0.12 }) + c.smartLabel(3, 1, '(3, 1)'));
}
function quadLineFigure() {
  const c = coordGrid({ xmin: -3, xmax: 5, ymin: -5, ymax: 7, unit: 22 });
  return c.wrap(c.curve((x) => x * x - 2 * x - 3) + c.lineEq(1, 1, { color: ACCENT2 }) + c.point(-1, 0) + c.point(4, 5)
    + halo(c.X(-1.6), c.Y(-2.2), 'y = x + 1', { size: 14, color: ACCENT2 }) + c.smartLabel(-1, 0, '(−1, 0)') + c.smartLabel(4, 5, '(4, 5)'));
}
function regionFigure() {
  const qs = [ineq('x', { k: 1 }, '>='), ineq('y', { k: -1 }, '>'), ineq('sum', { p: 1, q: 1, k: 4 }, '<=')];
  let poly = [[-6, -6], [6, -6], [6, 6], [-6, 6]];
  for (const q of qs) poly = clipHalf(poly, q);
  return regionVisual(qs, poly);
}
function trigFigure(f, { tan = false } = {}) {
  const c = tan ? trigChart({ tan: true, ymin: -4, ymax: 4, ystep: 1 }) : trigChart({});
  return c.wrap(c.curve(f, { samples: 720 }));
}
function circleFigure() {
  const c = coordGrid({ xmin: -6, xmax: 6, ymin: -6, ymax: 6, unit: 22 });
  const circ = c.curve((x) => Math.sqrt(Math.max(0, 25 - x * x)), { from: -5, to: 5, samples: 300 }) + c.curve((x) => -Math.sqrt(Math.max(0, 25 - x * x)), { from: -5, to: 5, samples: 300 });
  const tri = c.poly([[0, 0], [3, 4]], { color: ACCENT2, width: 2.2 }) + c.poly([[0, 0], [3, 0], [3, 4]], { color: ACCENT2, width: 1.6, dash: '5 4' });
  return c.wrap(circ + tri + c.point(3, 4) + c.smartLabel(3, 4, 'P(x, y)')
    + halo(c.X(1.5), c.Y(0) + 13, 'x', { size: 14, italic: true, color: ACCENT2 }) + halo(c.X(3) + 10, c.Y(2), 'y', { size: 14, italic: true, color: ACCENT2 })
    + halo(c.X(1.2), c.Y(2.4), 'r', { size: 15, italic: true, color: ACCENT2 }));
}
function tangentFigure() {
  const c = coordGrid({ xmin: -12, xmax: 24, ymin: -12, ymax: 12, unit: 13, step: 2, labelEvery: 2 });
  const r = Math.sqrt(80);
  const circ = c.curve((x) => Math.sqrt(Math.max(0, 80 - x * x)), { from: -r, to: r, samples: 300 }) + c.curve((x) => -Math.sqrt(Math.max(0, 80 - x * x)), { from: -r, to: r, samples: 300 });
  return c.wrap(circ + c.seg([0, 0], [4, 8], { color: ACCENT2, width: 2 }) + c.lineEq(-0.5, 10, { color: ACCENT2 }) + c.point(4, 8) + c.point(20, 0)
    + c.smartLabel(4, 8, 'P(4, 8)') + c.smartLabel(20, 0, '(20, 0)'));
}
const F_PTS = [[-3, 0], [-1, 3], [1, 1], [2, 2]];
function transFigure(kind) {
  const c = coordGrid({ xmin: -5, xmax: 6, ymin: -4, ymax: 6, unit: 22 });
  const img = kind === 'up' ? F_PTS.map(([x, y]) => [x, y + 2]) : F_PTS.map(([x, y]) => [x + 3, y]);
  const lab = kind === 'up' ? 'y = f(x) + 2' : 'y = f(x − 3)';
  const end = img[img.length - 1];
  return c.wrap(c.poly(F_PTS) + c.poly(img, { color: ACCENT2, dash: '7 5' }) + c.point(-1, 3) + c.point(...img[1], null, { color: ACCENT2 })
    + c.smartLabel(-3, 0, 'y = f(x)', { color: ACCENT, size: 13 })
    + (kind === 'up' ? c.smartLabel(...end, lab, { color: ACCENT2, size: 13 }) : halo(c.X(4.6), c.Y(3.9), lab, { color: ACCENT2, size: 13 })));
}

/* Pages ------------------------------------------------------------- */

export const curveTutorials = [
  {
    id: 'gr-quadratic-graphs',
    title: 'Quadratic graphs',
    skills: ['gr-quadratic-graphs'],
    prereqs: ['gr-table-plot', 'alg-solve-quad-factorising'],
    summary: 'Plot quadratic graphs and read off their roots, y-intercept, turning point and line of symmetry.',
    body: [
      h('The big idea'),
      p(
        'A <b>quadratic</b> equation has an $x^2$ term, like $y = x^2 - 2x - 3$. Its graph is not straight: it is a smooth U-shaped curve called a <b>parabola</b>. If the $x^2$ term is negative (like $y = 3 - x^2$) the curve is upside down (∩).',
        'You plot it exactly as for a straight line – make a [[gr-table-plot|table of values]] and plot the points – but join them with a smooth curve, not a ruler.',
      ),
      tbl([['$x$', '$-2$', '$-1$', '$0$', '$1$', '$2$', '$3$', '$4$'], ['$y = x^2 - 2x - 3$', '$5$', '$0$', '$-3$', '$-4$', '$-3$', '$0$', '$5$']]),
      p('For example, at $x = -2$: $y = (-2)^2 - 2 \\times (-2) - 3 = 4 + 4 - 3 = 5$.'),
      figure(quadFigure(), 'The graph of $y = x^2 - 2x - 3$.'),
      key('Features of a quadratic graph', list([
        '<b>Roots</b>: where the curve crosses the $x$-axis. They are the solutions of $x^2 - 2x - 3 = 0$: here $x = -1$ and $x = 3$.',
        '<b>$y$-intercept</b>: where it crosses the $y$-axis – put $x = 0$. Here $(0, -3)$.',
        '<b>Line of symmetry</b>: a vertical line halfway between the roots. Here $x = \\frac{-1 + 3}{2} = 1$.',
        '<b>Turning point</b> (minimum or maximum): on the line of symmetry. Here $(1, -4)$.',
      ])),
      p('The roots match the factorised form: $x^2 - 2x - 3 = (x + 1)(x - 3)$, which is zero when $x = -1$ or $x = 3$ (see [[alg-solve-quad-factorising]]).'),
      example('Example 1 – solving with the graph',
        'Use the graph of $y = x^2 - 2x - 3$ to solve $x^2 - 2x - 3 = 5$.',
        ['Draw the horizontal line $y = 5$ across the graph.', 'It meets the curve at $x = -2$ and $x = 4$ (both in the table: $y = 5$ there).'],
        '$x = -2$ or $x = 4$'),
      example('Example 2 – the turning point from completed-square form',
        'Find the turning point of $y = (x - 3)^2 + 2$.',
        ['$(x - 3)^2$ is never negative, and it is $0$ when $x = 3$.', 'So the smallest value of $y$ is $2$, when $x = 3$.'],
        '$(3, 2)$'),
      example('Example 3 – completing the square first',
        'Find the turning point of $y = x^2 - 6x + 11$.',
        ['[[alg-completing-square|Complete the square]]: $x^2 - 6x = (x - 3)^2 - 9$.', 'So $y = (x - 3)^2 - 9 + 11 = (x - 3)^2 + 2$.', 'Turning point $(3, 2)$, as in Example 2.'],
        '$(3, 2)$'),
      mistake('squaring a negative wrongly: $(-2)^2 = 4$, not $-4$. Put negative values in brackets on your calculator.'),
      mistake('reading the turning point of $(x - 3)^2 + 2$ as $(-3, 2)$. The bracket is zero when $x = +3$.'),
      note('A quadratic graph is always symmetrical, so the $y$-values in your table should repeat in mirror image around the turning point. If they don\'t, check your working.'),
      h('What next?'),
      p('Compare the shapes of other graphs in [[gr-graph-shapes]], and solve harder equations with graphs in [[gr-graphical-solutions]].'),
    ].join(''),
  },
  {
    id: 'gr-graph-shapes',
    title: 'Recognising graph shapes',
    skills: ['gr-graph-shapes'],
    prereqs: ['gr-quadratic-graphs', 'gr-gradient-intercept'],
    summary: 'Recognise the shapes of linear, quadratic, cubic, reciprocal and exponential graphs from their equations.',
    body: [
      h('The big idea'),
      p('You can often tell what a graph looks like just from its equation. Look at <b>where $x$ appears</b>: its highest power, whether it is in a denominator, or whether it is a power itself.'),
      figure(shapesFigure(), 'The six shapes to know.'),
      key('Which shape?', tbl([
        ['Equation contains…', 'Type', 'Shape'],
        ['$x$ (no powers): $y = mx + c$', 'Linear', 'straight line'],
        ['$x^2$ as the highest power', 'Quadratic', 'U-shape (∩ if the $x^2$ is negative)'],
        ['$x^3$ as the highest power', 'Cubic', 'S-shape: up from bottom-left to top-right (reversed if the $x^3$ is negative)'],
        ['$x$ in the denominator: $y = \\frac{k}{x}$', 'Reciprocal', 'two separate curves that never touch the axes'],
        ['$x$ as a power: $y = 2^x$', 'Exponential', 'crosses the $y$-axis at 1, then shoots up; flattens towards the $x$-axis on the left'],
      ])),
      h('Using details to choose between two graphs'),
      list([
        '<b>Sign</b>: a minus in front of the $x^2$ or $x^3$ term flips the graph upside down. For $y = \\frac{k}{x}$, positive $k$ puts the curves in the top-right and bottom-left; negative $k$ puts them in the other two corners.',
        '<b>$y$-intercept</b>: put $x = 0$. $y = x^2 - 2$ crosses at $-2$; $y = x^2 + 2$ crosses at $+2$.',
        '<b>Gradient</b>: for straight lines, the sign of $m$ tells you whether the line goes up or down from left to right.',
      ]),
      example('Example 1 – naming the type',
        'What type of graph is $y = 4 - x^3$?',
        ['The highest power of $x$ is $3$, so it is <b>cubic</b>.', 'The $x^3$ term is negative, so it falls from top-left to bottom-right, crossing the $y$-axis at $4$.'],
        'a cubic graph'),
      example('Example 2 – matching a sketch',
        'A sketch shows two curves, one in the top-right corner and one in the bottom-left, neither touching the axes. Which could it be: $y = 2x$, $y = \\dfrac{2}{x}$, $y = x^2$ or $y = 2^x$?',
        ['Two separate pieces that never touch the axes: a reciprocal graph.', 'Top-right and bottom-left means $k$ is positive.'],
        '$y = \\frac{2}{x}$'),
      mistake('mixing up $y = x^2$ and $y = 2^x$. $x^2$ is symmetrical and goes through $(0, 0)$; $2^x$ is not symmetrical and goes through $(0, 1)$.'),
      note('Quick test: work out $y$ when $x = 0$, $x = 1$ and $x = -1$, and see which sketch fits those three points.'),
      h('What next?'),
      p('Trig functions have their own wave-shaped graphs: [[gr-trig-graphs]]. Moving and flipping graphs is covered in [[gr-transformations]].'),
    ].join(''),
  },
  {
    id: 'gr-graphical-solutions',
    title: 'Solving equations with graphs',
    skills: ['gr-graphical-solutions'],
    prereqs: ['gr-quadratic-graphs', 'gr-line-equation', 'alg-simultaneous-linear'],
    summary: 'Use the points where graphs cross to solve equations and simultaneous equations.',
    body: [
      h('The big idea'),
      p(
        'Where two graphs <b>cross</b>, both equations are true at once: the point has the same $x$ and the same $y$ on both graphs.',
        'So to solve $2x - 5 = 4 - x$, draw $y = 2x - 5$ and $y = 4 - x$ and read the $x$-value where they cross.',
      ),
      key('Graphs and equations', list([
        'The solution of $f(x) = g(x)$ is the $x$-value(s) where $y = f(x)$ and $y = g(x)$ cross.',
        'The solution of a pair of [[alg-simultaneous-linear|simultaneous equations]] is the crossing point $(x, y)$.',
        'The solutions of $f(x) = 0$ are where $y = f(x)$ crosses the $x$-axis ($y = 0$).',
      ])),
      figure(twoLinesFigure(), 'The lines cross at $(3, 1)$.'),
      example('Example 1 – two straight lines',
        'Use the graphs of $y = 2x - 5$ and $y = 4 - x$ to solve $2x - 5 = 4 - x$, and to solve the simultaneous equations $y = 2x - 5$, $y = 4 - x$.',
        ['The lines cross at $(3, 1)$.', 'The equation $2x - 5 = 4 - x$ asks for $x$ only: $x = 3$.', 'The simultaneous equations ask for both: $x = 3$, $y = 1$.', 'Check: $2 \\times 3 - 5 = 1$ and $4 - 3 = 1$ ✓'],
        '$x = 3$; and $x = 3, y = 1$'),
      figure(quadLineFigure(), 'The curve $y = x^2 - 2x - 3$ and the line $y = x + 1$ cross twice.'),
      example('Example 2 – a curve and a line',
        'Use the graphs to solve $x^2 - 2x - 3 = x + 1$.',
        ['Read the $x$-coordinates of the crossing points: $x = -1$ and $x = 4$.', 'Check $x = 4$: $16 - 8 - 3 = 5$ and $4 + 1 = 5$ ✓'],
        '$x = -1$ or $x = 4$'),
      h('Which line should you draw?'),
      p('If the curve $y = x^2 - 2x - 3$ is already drawn and you want to solve a <b>different</b> quadratic equation, rearrange that equation so the left-hand side is exactly the curve. The right-hand side is the line to draw.'),
      example('Example 3 – choosing the line',
        'The graph of $y = x^2 - 2x - 3$ is drawn. Which line should you draw to solve $x^2 - 4x + 1 = 0$?',
        ['We want $x^2 - 2x - 3$ on the left. Starting from $x^2 - 4x + 1 = 0$, add $2x - 4$ to both sides:', '$x^2 - 4x + 1 + 2x - 4 = 2x - 4$, which is $x^2 - 2x - 3 = 2x - 4$.', 'So draw $y = 2x - 4$ and read the $x$-values where it crosses the curve.'],
        '$y = 2x - 4$'),
      mistake('giving the $y$-coordinate when the question asks you to solve an equation in $x$.'),
      note('Graph readings are only as accurate as the drawing. If the crossing is between grid lines, give an estimate (e.g. to 1 decimal place) and check it in the equation.'),
      h('What next?'),
      p('Graphs can also show where inequalities are true: [[gr-inequality-regions]].'),
    ].join(''),
  },
  {
    id: 'gr-inequality-regions',
    title: 'Inequalities on graphs',
    skills: ['gr-inequality-regions'],
    prereqs: ['gr-horizontal-vertical', 'gr-gradient-intercept', 'alg-solve-inequalities'],
    summary: 'Show and describe regions of a graph that satisfy several inequalities.',
    body: [
      h('The big idea'),
      p(
        'The line $x = 1$ splits the grid into two halves. Every point on the right has $x \\gt 1$; every point on the left has $x \\lt 1$. An inequality like $x \\geqslant 1$ describes a whole <b>region</b>, not just a line.',
        'Several inequalities together describe the region where they are <b>all</b> true – often a triangle or other shape.',
      ),
      key('Rules for regions', list([
        'Draw each boundary by replacing the inequality sign with $=$.',
        '<b>Solid</b> line for $\\leqslant$ or $\\geqslant$ (points on the line count); <b>dashed</b> line for $\\lt$ or $\\gt$ (they don\'t).',
        'Pick a test point not on the line (the origin is easiest) and see if it makes the inequality true. If it does, that side is the region.',
      ])),
      figure(regionFigure(), 'The region R: $x \\geqslant 1$, $y \\gt -1$ and $x + y \\leqslant 4$.'),
      example('Example 1 – describing the region',
        'Which inequalities describe the region R shown above?',
        ['$x = 1$ is solid and R is to its right: $x \\geqslant 1$.', '$y = -1$ is dashed and R is above it: $y \\gt -1$.', '$x + y = 4$ is solid. Test $(2, 0)$, which is inside R: $2 + 0 = 2 \\leqslant 4$ ✓. So R is the side where $x + y \\leqslant 4$.'],
        '$x \\geqslant 1$, $y \\gt -1$, $x + y \\leqslant 4$'),
      example('Example 2 – integer points',
        'How many points with integer coordinates lie in R?',
        ['$y \\gt -1$ means $y \\geqslant 0$ for whole numbers.', '$x = 1$: $y = 0, 1, 2, 3$ (4 points); $x = 2$: $y = 0, 1, 2$ (3); $x = 3$: $y = 0, 1$ (2); $x = 4$: $y = 0$ (1).', 'Points on the dashed line $y = -1$ do not count; points on the solid lines do.'],
        '$10$ points'),
      example('Example 3 – testing a point',
        'Does $(1, 4)$ satisfy $x \\geqslant 1$, $y \\gt -1$ and $x + y \\leqslant 4$?',
        ['$1 \\geqslant 1$ ✓, $4 \\gt -1$ ✓, $1 + 4 = 5 \\leqslant 4$ ✗.', 'It fails the last one.'],
        'no'),
      mistake('shading the wrong side of a sloping line. Always use a test point rather than guessing "above" or "below".'),
      note('To draw a line like $x + y = 4$, find where it meets the axes: $(4, 0)$ and $(0, 4)$. For lines like $y = 2x - 1$, use the gradient and intercept (see [[gr-gradient-intercept]]).'),
      h('What next?'),
      p('Solving single inequalities with algebra is covered in [[alg-solve-inequalities]].'),
    ].join(''),
  },
  {
    id: 'gr-trig-graphs',
    title: 'Trigonometric graphs',
    skills: ['gr-trig-graphs'],
    prereqs: ['gr-graph-shapes', 'trig-exact-values'],
    summary: 'Know the shapes and key points of y = sin x, y = cos x and y = tan x, and use symmetry to solve equations.',
    body: [
      h('The big idea'),
      p(
        'You know $\\sin$, $\\cos$ and $\\tan$ from [[trig-sohcahtoa-side|right-angled triangles]]. Your calculator gives values for any angle, even $200^\\circ$ or $-90^\\circ$. Plotting $y = \\sin x$ for lots of angles gives a smooth wave that repeats every $360^\\circ$.',
      ),
      columns(figure(trigFigure(S), '$y = \\sin x$'), figure(trigFigure(C), '$y = \\cos x$')),
      figure(trigFigure(Tn, { tan: true }), '$y = \\tan x$'),
      key('Key facts', list([
        '$y = \\sin x$: starts at $0$, maximum $1$ at $90^\\circ$, $0$ at $180^\\circ$, minimum $-1$ at $270^\\circ$, back to $0$ at $360^\\circ$.',
        '$y = \\cos x$: starts at $1$, $0$ at $90^\\circ$, minimum $-1$ at $180^\\circ$, $0$ at $270^\\circ$, $1$ at $360^\\circ$.',
        'Both repeat every $360^\\circ$ and stay between $-1$ and $1$.',
        '$y = \\tan x$: $0$ at $0^\\circ$, $180^\\circ$ and $360^\\circ$; $1$ at $45^\\circ$; it has vertical <b>asymptotes</b> (lines the graph never reaches) at $90^\\circ$ and $270^\\circ$, and repeats every $180^\\circ$.',
      ])),
      h('Using symmetry to solve equations'),
      p('A horizontal line usually crosses the wave <b>twice</b> between $0^\\circ$ and $360^\\circ$. If you know one solution, the graph\'s symmetry gives the other.'),
      tbl([
        ['Equation', 'If one solution is $a$, the other (in $0^\\circ$–$360^\\circ$) is'],
        ['$\\sin x = k$', '$180^\\circ - a$ (symmetry about $90^\\circ$)'],
        ['$\\cos x = k$', '$360^\\circ - a$ (symmetry about $180^\\circ$)'],
        ['$\\tan x = k$', '$a + 180^\\circ$ (it repeats every $180^\\circ$)'],
      ]),
      example('Example 1 – sine',
        'One solution of $\\sin x = 0.5$ is $x = 30^\\circ$. Find the other solution between $0^\\circ$ and $360^\\circ$.',
        ['$\\sin$ is symmetrical about $90^\\circ$: the other solution is $180^\\circ - 30^\\circ$.'],
        '$150^\\circ$'),
      example('Example 2 – cosine',
        'Solve $\\cos x = \\cos 60^\\circ$ for $90^\\circ \\leqslant x \\leqslant 360^\\circ$.',
        ['$x = 60^\\circ$ is a solution, but it is outside the range.', '$\\cos$ is symmetrical about $180^\\circ$: $360^\\circ - 60^\\circ = 300^\\circ$.'],
        '$300^\\circ$'),
      example('Example 3 – a negative value',
        'Solve $\\sin x = -0.5$ for $0^\\circ \\leqslant x \\leqslant 360^\\circ$.',
        ['$\\sin 30^\\circ = 0.5$. The graph is below the axis between $180^\\circ$ and $360^\\circ$.', 'By symmetry the solutions are $180^\\circ + 30^\\circ = 210^\\circ$ and $360^\\circ - 30^\\circ = 330^\\circ$.', 'Check on a calculator: $\\sin 210^\\circ = -0.5$ ✓'],
        '$210^\\circ$ and $330^\\circ$'),
      example('Example 4 – stretched graphs',
        'What is the maximum value of $y = 3\\sin x$?',
        ['$\\sin x$ is at most $1$, so $3\\sin x$ is at most $3$.'],
        '$3$'),
      mistake('stopping after the calculator\'s answer. $\\sin^{-1}(0.5)$ gives only $30^\\circ$; the graph shows there is a second solution.'),
      note('Sketch the graph quickly before answering. It takes ten seconds and shows how many solutions there are.'),
      h('What next?'),
      p('Moving and stretching these graphs is covered in [[gr-transformations]]. Exact values like $\\sin 30^\\circ = \\frac{1}{2}$ are in [[trig-exact-values]].'),
    ].join(''),
  },
  {
    id: 'gr-circle-equation',
    title: 'The equation of a circle',
    skills: ['gr-circle-equation'],
    prereqs: ['trig-pythagoras', 'gr-parallel-perpendicular'],
    summary: 'Use x² + y² = r² for a circle centred at the origin, and find the equation of a tangent.',
    body: [
      h('The big idea'),
      p('A circle is all the points at the same distance $r$ (the radius) from its centre. If the centre is the origin, a point $P(x, y)$ on the circle makes a right-angled triangle with sides $x$ and $y$ and hypotenuse $r$. By [[trig-pythagoras|Pythagoras]], $x^2 + y^2 = r^2$.'),
      figure(circleFigure(), 'Every point on the circle satisfies $x^2 + y^2 = r^2$. Here $3^2 + 4^2 = 25 = 5^2$.'),
      key('Circle centred at the origin', display('x^2 + y^2 = r^2') + p('The number on the right is $r^2$, <b>not</b> $r$. For $x^2 + y^2 = 64$ the radius is $8$ and the diameter $16$.')),
      example('Example 1 – the equation from a point',
        'A circle with centre $(0, 0)$ passes through $(3, -4)$. Find its equation.',
        ['$r^2 = 3^2 + (-4)^2 = 9 + 16 = 25$.'],
        '$x^2 + y^2 = 25$'),
      example('Example 2 – a missing coordinate',
        'The point $(k, 6)$ lies on $x^2 + y^2 = 100$, with $k \\gt 0$. Find $k$.',
        ['$k^2 + 36 = 100$, so $k^2 = 64$ and $k = 8$.'],
        '$k = 8$'),
      h('Tangents'),
      p('A <b>tangent</b> touches the circle at one point. It is always <b>perpendicular to the radius</b> at that point, so its gradient is the [[gr-parallel-perpendicular|negative reciprocal]] of the radius\'s gradient.'),
      figure(tangentFigure(), 'The tangent at P$(4, 8)$ to $x^2 + y^2 = 80$.'),
      steps([
        'Find the gradient of the radius OP: $\\dfrac{y}{x}$ for the point P$(x, y)$.',
        'The tangent\'s gradient is the negative reciprocal.',
        'Use P to find $c$ in $y = mx + c$.',
      ]),
      example('Example 3 – a tangent',
        'P$(4, 8)$ lies on $x^2 + y^2 = 80$. Find the equation of the tangent at P, and where it crosses the $x$-axis.',
        ['Gradient of OP $= \\dfrac{8}{4} = 2$, so the tangent has gradient $-\\dfrac{1}{2}$.', '$8 = -\\dfrac{1}{2} \\times 4 + c = -2 + c$, so $c = 10$: $y = -\\dfrac{1}{2}x + 10$.', 'On the $x$-axis: $0 = -\\dfrac{1}{2}x + 10$, so $x = 20$.'],
        '$y = -\\frac{1}{2}x + 10$, crossing at $(20, 0)$'),
      example('Example 4 – inside, outside or on?',
        'Is $(5, -1)$ inside, outside or on the circle $x^2 + y^2 = 26$?',
        ['$5^2 + (-1)^2 = 25 + 1 = 26$, which equals $r^2$.'],
        'on the circle'),
      mistake('giving $r = 64$ for $x^2 + y^2 = 64$. Square-root it: $r = 8$.'),
      note('If $x^2 + y^2$ is less than $r^2$ the point is inside the circle; if it is more, the point is outside.'),
      h('What next?'),
      p('The tangent–radius fact also appears in [[trig-circle-theorems|circle theorems]].'),
    ].join(''),
  },
  {
    id: 'gr-transformations',
    title: 'Transforming graphs',
    skills: ['gr-transformations'],
    prereqs: ['gr-graph-shapes', 'gr-function-notation', 'geo-translation'],
    summary: 'Know how y = f(x) + a, y = f(x + a), y = −f(x) and y = f(−x) move or reflect a graph.',
    body: [
      h('The big idea'),
      p('Writing a graph as $y = f(x)$ (see [[gr-function-notation]]) lets us describe small changes to its equation and what they do to the picture. There are four to know: two [[geo-translation|translations]] and two reflections.'),
      key('Graph transformations', tbl([
        ['Equation', 'What happens', 'A point $(x, y)$ moves to'],
        ['$y = f(x) + a$', 'translation <b>up</b> by $a$: vector $\\begin{pmatrix}0\\\\a\\end{pmatrix}$', '$(x,\\ y + a)$'],
        ['$y = f(x + a)$', 'translation <b>left</b> by $a$: vector $\\begin{pmatrix}-a\\\\0\\end{pmatrix}$', '$(x - a,\\ y)$'],
        ['$y = -f(x)$', 'reflection in the $x$-axis', '$(x,\\ -y)$'],
        ['$y = f(-x)$', 'reflection in the $y$-axis', '$(-x,\\ y)$'],
      ])),
      columns(figure(transFigure('up'), '$f(x) + 2$: everything moves up 2.'), figure(transFigure('right'), '$f(x - 3)$: everything moves right 3.')),
      h('Why does f(x + a) go the "wrong" way?'),
      p('For $y = f(x - 3)$, the new graph reaches a given height when $x - 3$ equals the old $x$-value – that is, 3 <b>later</b>. So the graph moves 3 to the <b>right</b>. Changes <b>inside</b> the bracket act on $x$ and work backwards; changes <b>outside</b> act on $y$ and work as you expect.'),
      example('Example 1 – moving a point',
        'The graph of $y = f(x)$ has a maximum point at $(2, 5)$. Write down the maximum point of $y = f(x - 3)$, $y = f(x) + 2$ and $y = f(-x)$.',
        ['$f(x - 3)$: right 3, so $(5, 5)$.', '$f(x) + 2$: up 2, so $(2, 7)$.', '$f(-x)$: reflect in the $y$-axis, so $(-2, 5)$.'],
        '$(5, 5)$, $(2, 7)$ and $(-2, 5)$'),
      example('Example 2 – writing the new equation',
        'The graph of $y = x^2$ is translated by $\\begin{pmatrix}3\\\\-2\\end{pmatrix}$. Find the equation of the new graph.',
        ['Right 3: replace $x$ with $x - 3$, giving $(x - 3)^2$.', 'Down 2: subtract 2 from the whole thing.'],
        '$y = (x - 3)^2 - 2$'),
      example('Example 3 – describing a transformation',
        'Describe the transformation that maps $y = \\cos x$ onto $y = \\cos(x + 90^\\circ)$.',
        ['The change is inside the bracket, so it is horizontal and backwards: left $90^\\circ$.'],
        'translation by $\\begin{pmatrix}-90\\\\0\\end{pmatrix}$'),
      mistake('moving $f(x + 4)$ to the right. A plus inside the bracket moves the graph <b>left</b>.'),
      note('Check by testing one point. If $f(2) = 5$, then $y = f(x - 3)$ at $x = 5$ gives $f(2) = 5$: so $(5, 5)$ is on the new graph ✓'),
      h('What next?'),
      p('These transformations apply to any graph – including [[gr-trig-graphs|trig graphs]] and [[gr-quadratic-graphs|quadratics]] (the turning point of $(x - 3)^2 + 2$ is $x^2$ moved right 3 and up 2).'),
    ].join(''),
  },
];

void [text];
