// Learn pages: coordinates and straight lines. See docs/TUTORIAL_GUIDELINES.md.
import { h, p, list, steps, key, display, note, mistake, figure, example, tbl } from '../../tutorial-kit.js';
import { coordGrid, chart, lineLabel, halo } from './diagrams.js';
import { ACCENT, ACCENT2 } from '../../svg.js';

/* Diagrams ---------------------------------------------------------- */

function coordsFigure() {
  const c = coordGrid({ xmin: -5, xmax: 5, ymin: -5, ymax: 5, unit: 26 });
  const pts = [[3, -2, 'A'], [-4, 1, 'B'], [2, 4, 'C'], [-3, -3, 'D']];
  const arrows = c.poly([[0, 0], [3, 0]], { color: ACCENT2, width: 2.5, dash: '5 4' }) + c.poly([[3, 0], [3, -2]], { color: ACCENT2, width: 2.5, dash: '5 4' });
  return c.wrap(arrows + pts.map(([x, y]) => c.point(x, y, null, { cross: true })).join('') + pts.map(([x, y, l]) => c.smartLabel(x, y, l)).join(''));
}
function hvFigure() {
  const c = coordGrid({ xmin: -5, xmax: 5, ymin: -5, ymax: 5, unit: 24 });
  const lines = c.lineEq(null, 3) + c.lineEq(0, -2, { color: ACCENT2 }) + c.lineEq(1, 0, { color: '#0f7b5f', dash: '7 5' }) + c.lineEq(-1, 0, { color: '#7c3aed', dash: '7 5' });
  return c.wrap(lines + lineLabel(c, null, 3, 'x = 3', { color: ACCENT, at: 0.92 }) + lineLabel(c, 0, -2, 'y = −2', { color: ACCENT2, at: 0.12, side: -1 })
    + lineLabel(c, 1, 0, 'y = x', { color: '#0f7b5f', at: 0.9 }) + lineLabel(c, -1, 0, 'y = −x', { color: '#7c3aed', at: 0.1 }));
}
function tableLineFigure() {
  const c = coordGrid({ xmin: -3, xmax: 4, ymin: -6, ymax: 6, unit: 22 });
  const xs = [-2, -1, 0, 1, 2, 3];
  return c.wrap(c.lineEq(2, -1) + xs.map((x) => c.point(x, 2 * x - 1, null, { cross: true, color: ACCENT2 })).join('') + lineLabel(c, 2, -1, 'y = 2x − 1', { color: ACCENT, at: 0.85 }));
}
function midpointFigure() {
  const c = coordGrid({ xmin: 0, xmax: 10, ymin: 0, ymax: 13, unit: 22 });
  const A = [2, 12]; const B = [8, 2]; const M = [5, 7];
  return c.wrap(c.seg(A, B, { width: 2 }) + c.poly([A, [A[0], B[1]], B], { color: ACCENT2, width: 1.5, dash: '5 4' })
    + c.point(...A) + c.point(...B) + c.point(...M, null, { color: ACCENT2 })
    + c.smartLabel(...A, 'A(2, 12)') + c.smartLabel(...B, 'B(8, 2)') + c.smartLabel(...M, 'M(5, 7)', { color: ACCENT2 }));
}
function gradientFigure() {
  const c = coordGrid({ xmin: -2, xmax: 5, ymin: -2, ymax: 9, unit: 24 });
  // y = 2x + 1 through (0, 1) and (3, 7)
  const tri = c.poly([[0, 1], [3, 1], [3, 7]], { color: ACCENT2, width: 2, dash: '6 4' });
  return c.wrap(c.lineEq(2, 1) + tri + c.point(0, 1) + c.point(3, 7)
    + halo(c.X(1.5), c.Y(1) + 14, 'run = 3', { size: 14, color: ACCENT2 }) + halo(c.X(3) + 36, c.Y(4), 'rise = 6', { size: 14, color: ACCENT2 })
    + lineLabel(c, 2, 1, 'y = 2x + 1', { color: ACCENT, at: 0.88, side: -1 }));
}
function parallelPerpFigure() {
  const c = coordGrid({ xmin: -5, xmax: 5, ymin: -5, ymax: 5, unit: 24 });
  return c.wrap(c.lineEq(2, 1) + c.lineEq(2, -3, { dash: '7 5' }) + c.lineEq(-0.5, 1, { color: ACCENT2 })
    + lineLabel(c, 2, 1, 'y = 2x + 1', { color: ACCENT, at: 0.85 }) + lineLabel(c, 2, -3, 'y = 2x − 3', { color: ACCENT, at: 0.2, side: -1 })
    + lineLabel(c, -0.5, 1, 'y = −½x + 1', { color: ACCENT2, at: 0.12 }));
}

function lineGraphFigure() {
  // y = -3/2 x + 4, through (0, 4) and (2, 1)
  const c = coordGrid({ xmin: -3, xmax: 5, ymin: -4, ymax: 7, unit: 24 });
  const tri = c.poly([[0, 4], [2, 4], [2, 1]], { color: ACCENT2, width: 2, dash: '6 4' });
  return c.wrap(c.lineEq(-1.5, 4) + tri + c.point(0, 4) + c.point(2, 1)
    + halo(c.X(1.35), c.Y(4) - 12, 'run = 2', { size: 13, color: ACCENT2 }) + halo(c.X(2) + 40, c.Y(2.5), 'rise = −3', { size: 13, color: ACCENT2 }));
}
function scaleFigure() {
  // x: 1 unit per square; y: 5 units per square. Line through (0, 5) and (4, 25).
  const c = chart({ xmin: 0, xmax: 5, ymin: 0, ymax: 30, xstep: 1, ystep: 5, w: 200, h: 240, zeroAxes: true });
  return c.wrap(c.lineEq(5, 5) + c.point(0, 5) + c.point(4, 25));
}

/* Pages ------------------------------------------------------------- */

export const lineTutorials = [
  {
    id: 'gr-coordinates',
    title: 'Coordinates',
    skills: ['gr-coordinates'],
    prereqs: ['num-negatives'],
    summary: 'Read and plot points in all four quadrants, and use coordinates to complete shapes.',
    body: [
      h('The big idea'),
      p(
        'A coordinate grid has a horizontal <b>$x$-axis</b> and a vertical <b>$y$-axis</b>, crossing at the <b>origin</b> $(0, 0)$. Every point has an address $(x, y)$: how far <b>across</b>, then how far <b>up</b>.',
        'Negative numbers go left (for $x$) or down (for $y$), so the grid covers four regions called <b>quadrants</b>.',
      ),
      key('Coordinates', p('$(x, y)$: the first number is across (right is positive, left is negative); the second is up (up is positive, down is negative). "Along the corridor, then up the stairs."')),
      figure(coordsFigure(), 'A is $(3, -2)$: 3 right, then 2 down. B is $(-4, 1)$, C is $(2, 4)$ and D is $(-3, -3)$.'),
      steps(['Start at the origin.', 'Move across by the $x$-coordinate.', 'Then move up or down by the $y$-coordinate.']),
      example('Example 1 – points on an axis',
        'Write down the coordinates of the point 4 units below the origin.',
        ['It has not moved across, so $x = 0$. It has moved down 4, so $y = -4$.'],
        '$(0, -4)$ – not $(-4, 0)$, which is 4 to the left'),
      h('Completing shapes'),
      p('In a rectangle, square or parallelogram, opposite sides are equal and parallel. So the move from one corner to the next is the same on both sides of the shape.'),
      example('Example 2 – a rectangle',
        'A$(1, 1)$, B$(5, 1)$ and C$(5, 4)$ are three corners of rectangle ABCD. Find D.',
        ['From B to A you go 4 left. Do the same from C: D is 4 left of C.', 'D $= (5 - 4, 4) = (1, 4)$.'],
        '$(1, 4)$'),
      example('Example 3 – a parallelogram',
        'A$(-2, -1)$, B$(2, -1)$ and C$(4, 2)$ are three corners of parallelogram ABCD. Find D.',
        ['From B to A: 4 left, 0 up.', 'From C, go 4 left: D $= (4 - 4, 2) = (0, 2)$.', 'Check: from A to D is 2 right and 3 up – the same as from B to C ✓'],
        '$(0, 2)$'),
      example('Example 4 – a kite',
        'A$(0, 5)$, B$(2, 3)$ and C$(0, -2)$ are three corners of kite ABCD. Find D.',
        ['A kite is not a parallelogram, so the "same move" trick does not work.', 'A kite has a line of symmetry through A and C – here the $y$-axis. D is the reflection of B in that line.', 'B is $2$ to the right of the line, so D is $2$ to the left, at the same height: D $= (-2, 3)$.'],
        '$(-2, 3)$'),
      h('Part of the way along a line'),
      p('To find the point a fraction of the way from A to B, find how much $x$ and $y$ change from A to B, take that fraction of each change, and add the results to A.'),
      example('Example 5 – a quarter of the way',
        'A is $(-4, 3)$ and B is $(-8, 7)$. Find the point Q that is $\\frac{1}{4}$ of the way from A to B.',
        ['From A to B, $x$ changes by $-8 - (-4) = -4$ and $y$ changes by $7 - 3 = 4$.', '$\\frac{1}{4}$ of each: $-1$ and $1$.', 'Q $= (-4 - 1, 3 + 1) = (-5, 4)$.'],
        '$(-5, 4)$'),
      p('Halfway is the special case $\\frac{1}{2}$: see [[gr-midpoint]].'),
      mistake('writing the coordinates the wrong way round. $(3, -2)$ and $(-2, 3)$ are different points.'),
      note('Go round the letters of a shape in order: in ABCD, D joins on to C and to A.'),
      h('What next?'),
      p('Points that all share a coordinate make a straight line: see [[gr-horizontal-vertical]]. To find the point halfway between two others, see [[gr-midpoint]].'),
    ].join(''),
  },
  {
    id: 'gr-horizontal-vertical',
    title: 'Horizontal, vertical and diagonal lines',
    skills: ['gr-horizontal-vertical'],
    prereqs: ['gr-coordinates'],
    summary: 'Recognise and use lines such as x = 3, y = −2, y = x and y = −x.',
    body: [
      h('The big idea'),
      p(
        'Plot the points $(3, -2)$, $(3, 0)$, $(3, 1)$ and $(3, 4)$. They all have $x = 3$, and they lie on a <b>vertical</b> line. That line is called "$x = 3$": the equation says what every point on it has in common.',
      ),
      key('Lines to know', list([
        '$x = a$ is a <b>vertical</b> line (every point has $x$-coordinate $a$).',
        '$y = b$ is a <b>horizontal</b> line (every point has $y$-coordinate $b$).',
        '$y = x$ is the diagonal line through $(0, 0)$, $(1, 1)$, $(2, 2)$, …',
        '$y = -x$ is the other diagonal: $(1, -1)$, $(2, -2)$, $(-3, 3)$, …',
        'The $x$-axis is the line $y = 0$; the $y$-axis is the line $x = 0$.',
      ])),
      figure(hvFigure()),
      mistake('thinking $x = 3$ is horizontal because it "goes through 3 on the $x$-axis". It crosses the $x$-axis at 3 and goes straight <b>up and down</b>.'),
      example('Example 1 – naming a line',
        'A line passes through $(-4, 2)$ and $(5, 2)$. What is its equation?',
        ['Both points have $y = 2$; the $x$-values change.', 'So every point on the line has $y = 2$: it is horizontal.'],
        '$y = 2$'),
      example('Example 2 – where lines meet',
        'Where do the lines $x = -1$ and $y = 4$ cross? Where do $y = x$ and $x = 3$ cross?',
        ['On $x = -1$ the $x$-coordinate is $-1$; on $y = 4$ the $y$-coordinate is $4$. The crossing point is on both: $(-1, 4)$.', 'On $x = 3$, $x = 3$; on $y = x$, $y$ equals $x$, so $y = 3$ too: $(3, 3)$.'],
        '$(-1, 4)$ and $(3, 3)$'),
      example('Example 3 – a rectangle made by lines',
        'The lines $x = 1$, $x = 5$, $y = -2$ and $y = 3$ enclose a rectangle. Find its area.',
        ['Width: from $x = 1$ to $x = 5$ is $5 - 1 = 4$.', 'Height: from $y = -2$ to $y = 3$ is $3 - (-2) = 5$.', 'Area $= 4 \\times 5 = 20$.'],
        '$20$ square units'),
      note('To check whether a point lies on $y = x$, see if its two coordinates are equal. For $y = -x$, they must be equal but with opposite signs.'),
      h('What next?'),
      p('Most lines slope at other angles. To plot them, use a table of values: [[gr-table-plot]].'),
    ].join(''),
  },
  {
    id: 'gr-table-plot',
    title: 'Plotting straight-line graphs',
    skills: ['gr-table-plot'],
    prereqs: ['gr-coordinates', 'alg-substitution', 'alg-rearrange-simple'],
    summary: 'Complete a table of values, plot a straight line, and decide whether a point lies on a line.',
    body: [
      h('The big idea'),
      p(
        'An equation like $y = 2x - 1$ is a rule: pick any $x$, and it tells you $y$. Each pair $(x, y)$ is a point, and for an equation like this all the points lie on a <b>straight line</b>.',
      ),
      key('Table of values', p('Choose some $x$-values, [[alg-substitution|substitute]] each into the equation to get $y$, then plot the points $(x, y)$ and join them with a ruler.')),
      tbl([['$x$', '$-2$', '$-1$', '$0$', '$1$', '$2$', '$3$'], ['$y = 2x - 1$', '$-5$', '$-3$', '$-1$', '$1$', '$3$', '$5$']]),
      p('For example, when $x = -2$: $y = 2 \\times (-2) - 1 = -4 - 1 = -5$.'),
      figure(tableLineFigure(), 'The points from the table all lie on one straight line.'),
      note('In a straight-line table the $y$-values change by the same amount each time (here $+2$). If one value breaks the pattern, re-check it.'),
      example('Example 1 – a missing value',
        'Complete the table for $y = 4 - 3x$ when $x = -2$.',
        ['$y = 4 - 3 \\times (-2) = 4 + 6 = 10$. Subtracting a negative is adding.'],
        '$y = 10$'),
      h('Does a point lie on the line?'),
      p('Substitute the point\'s $x$-coordinate into the equation. If you get the point\'s $y$-coordinate, the point is on the line.'),
      example('Example 2 – on or off the line?',
        'Do $(4, 7)$ and $(3, 4)$ lie on the line $y = 2x - 1$?',
        ['$x = 4$: $2 \\times 4 - 1 = 7$. That matches, so $(4, 7)$ is on the line.', '$x = 3$: $2 \\times 3 - 1 = 5$, but the point has $y = 4$. So $(3, 4)$ is not on the line.'],
        '$(4, 7)$ is on the line; $(3, 4)$ is not'),
      example('Example 3 – above or below?',
        'Is the point $(-5, -6)$ above, below or on the line $y = 3x + 7$?',
        ['On the line, when $x = -5$: $y = 3 \\times (-5) + 7 = -8$.', 'The point has $y = -6$, which is bigger than $-8$.'],
        'above the line'),
      note('If the equation is not in the form $y = \\dots$, [[alg-rearrange-simple|rearrange]] it first. For example, $3y = 3x + 27$ becomes $y = x + 9$ (divide everything by $3$). Then $(1, 8)$ is <b>below</b> it, because on the line $y = 1 + 9 = 10$.'),
      mistake('getting the sign wrong with negative $x$. $2 \\times (-2) = -4$, and $(-2)^2 = 4$.'),
      note('Plot at least three points. Two points always make a line, so a third one is your check.'),
      h('What next?'),
      p('How steep a line is, and where it crosses the $y$-axis, can be read straight from its equation: see [[gr-gradient-intercept]].'),
    ].join(''),
  },
  {
    id: 'gr-midpoint',
    title: 'Midpoints of line segments',
    skills: ['gr-midpoint'],
    prereqs: ['gr-coordinates'],
    summary: 'Find the point halfway between two points, or find an endpoint from the midpoint.',
    body: [
      h('The big idea'),
      p('The <b>midpoint</b> of a line segment AB is the point exactly halfway along it. Its $x$-coordinate is halfway between the $x$-coordinates of A and B, and the same for $y$. "Halfway between" two numbers is their mean: add them and halve.'),
      key('Midpoint', display('M = \\left( \\frac{x_1 + x_2}{2},\\ \\frac{y_1 + y_2}{2} \\right)')),
      figure(midpointFigure(), 'The midpoint of A$(2, 12)$ and B$(8, 2)$ is M$(5, 7)$.'),
      example('Example 1',
        'Find the midpoint of A$(2, 12)$ and B$(8, 2)$.',
        ['$x$: $\\dfrac{2 + 8}{2} = 5$', '$y$: $\\dfrac{12 + 2}{2} = 7$'],
        '$(5, 7)$'),
      example('Example 2 – negatives and halves',
        'Find the midpoint of A$(-3, 4)$ and B$(6, -1)$.',
        ['$x$: $\\dfrac{-3 + 6}{2} = \\dfrac{3}{2} = 1.5$', '$y$: $\\dfrac{4 + (-1)}{2} = \\dfrac{3}{2} = 1.5$'],
        '$(1.5, 1.5)$'),
      h('Finding an endpoint'),
      p('If you know one end A and the midpoint M, the other end B is the same step again <b>beyond</b> M.'),
      example('Example 3 – the other end',
        'M$(3, 9)$ is the midpoint of AB, and A is $(4, 6)$. Find B.',
        ['From A to M: $x$ goes from $4$ to $3$ (down 1); $y$ goes from $6$ to $9$ (up 3).', 'Do the same again from M: $x = 3 - 1 = 2$, $y = 9 + 3 = 12$.', 'Check: the midpoint of $(4, 6)$ and $(2, 12)$ is $(3, 9)$ ✓'],
        'B $= (2, 12)$'),
      mistake('subtracting instead of adding: $\\frac{8 - 2}{2} = 3$ is half the <i>distance</i>, not the midpoint.'),
      h('What next?'),
      p('The steepness of the segment AB is its [[gr-gradient-intercept|gradient]].'),
    ].join(''),
  },
  {
    id: 'gr-gradient-intercept',
    title: 'Gradient and y-intercept',
    skills: ['gr-gradient-intercept'],
    prereqs: ['gr-table-plot', 'alg-rearrange-simple'],
    summary: 'Find how steep a line is and where it crosses the y-axis, from a graph, two points or an equation.',
    body: [
      h('The big idea'),
      p(
        'The <b>gradient</b> of a line measures how steep it is: how far it goes <b>up</b> for every 1 step <b>across</b>. A line going up from left to right has a positive gradient; a line going down has a negative gradient; a horizontal line has gradient $0$.',
        'The <b>$y$-intercept</b> is where the line crosses the $y$-axis.',
      ),
      key('Gradient', display('\\text{gradient} = \\frac{\\text{change in } y}{\\text{change in } x} = \\frac{\\text{rise}}{\\text{run}}')
        + p('A line with equation $y = mx + c$ has gradient $m$ and $y$-intercept $c$ (it crosses the $y$-axis at $(0, c)$).')),
      figure(gradientFigure(), 'From $(0, 1)$ to $(3, 7)$: rise $6$, run $3$, gradient $6 \\div 3 = 2$. The line crosses the $y$-axis at $1$: it is $y = 2x + 1$.'),
      h('Where $y = mx + c$ comes from'),
      p('On $y = 2x + 1$, when $x = 0$ we get $y = 1$ – that is the intercept. Each time $x$ goes up by $1$, $2x$ goes up by $2$, so $y$ goes up by $2$ – that is the gradient.'),
      example('Example 1 – from two points',
        'Find the gradient of the line through $(-2, 3)$ and $(1, 9)$.',
        ['Change in $y$: $9 - 3 = 6$. Change in $x$: $1 - (-2) = 3$.', 'Gradient $= \\dfrac{6}{3} = 2$.'],
        '$2$'),
      example('Example 2 – from an equation',
        'Find the gradient and $y$-intercept of $2y = 6x + 8$, and the gradient of $3x + y = 7$.',
        ['$2y = 6x + 8$: divide everything by $2$ to get $y = 3x + 4$. Gradient $3$, intercept $4$.', '$3x + y = 7$: subtract $3x$ to get $y = -3x + 7$. Gradient $-3$.'],
        'gradient $3$, intercept $4$; gradient $-3$'),
      example('Example 3 – where a line crosses the axes',
        'Where does $2x + 3y = 12$ cross the axes?',
        ['On the $x$-axis, $y = 0$: $2x = 12$, so $x = 6$, giving $(6, 0)$.', 'On the $y$-axis, $x = 0$: $3y = 12$, so $y = 4$, giving $(0, 4)$.'],
        '$(6, 0)$ and $(0, 4)$'),
      h('Gradient from a graph'),
      steps([
        'Pick two points where the line crosses grid lines exactly, far apart.',
        'Count the rise (up is positive, down is negative) and the run, <b>using the numbers on the axes</b>.',
        'Divide rise by run. Check the sign: sloping down means negative.',
      ]),
      example('Example 4 – different scales',
        'Find the gradient of the line shown. Each square across is $1$; each square up is $5$.',
        ['Two clear points: $(0, 5)$ and $(4, 25)$.', 'Rise $= 25 - 5 = 20$ (read the axis numbers – it is 4 squares, but each square is 5). Run $= 4 - 0 = 4$.', 'Gradient $= 20 \\div 4 = 5$. Counting squares would wrongly give $4 \\div 4 = 1$.'],
        '$5$', { visual: scaleFigure() }),
      mistake('dividing run by rise. Gradient is "up over across": $\\frac{\\text{change in } y}{\\text{change in } x}$.'),
      mistake('reading the gradient from $2y = 6x + 8$ as $6$. You must get $y$ on its own first: [[alg-rearrange-simple|rearrange]].'),
      note('If the two axes have different scales, counting squares gives the wrong gradient. Always use the axis numbers.'),
      h('What next?'),
      p('Put gradient and intercept together to write down the equation of any line: [[gr-line-equation]].'),
    ].join(''),
  },
  {
    id: 'gr-line-equation',
    title: 'The equation of a straight line',
    skills: ['gr-line-equation'],
    prereqs: ['gr-gradient-intercept', 'alg-solve-one-two-step'],
    summary: 'Find y = mx + c from a gradient and a point, from two points, or from a graph.',
    body: [
      h('The big idea'),
      p('Every non-vertical straight line can be written as $y = mx + c$. To find its equation you need two things: the gradient $m$ and the intercept $c$. Usually you can find $m$ first, then use a point on the line to find $c$.'),
      key('Method', steps([
        'Find the gradient $m$ (given, or $\\frac{\\text{change in } y}{\\text{change in } x}$ between two points).',
        'Write $y = mx + c$ with your value of $m$.',
        'Substitute the coordinates of a point on the line and [[alg-solve-one-two-step|solve]] for $c$.',
        'Write the final equation, and check it with another point.',
      ])),
      example('Example 1 – a gradient and a point',
        'A line has gradient $4$ and passes through $(5, 23)$. Find its equation.',
        ['$y = 4x + c$.', 'Substitute $(5, 23)$: $23 = 4 \\times 5 + c = 20 + c$, so $c = 3$.'],
        '$y = 4x + 3$'),
      example('Example 2 – two points',
        'Find the equation of the line through $(1, 4)$ and $(3, 10)$.',
        ['Gradient $= \\dfrac{10 - 4}{3 - 1} = \\dfrac{6}{2} = 3$.', 'Substitute $(1, 4)$ into $y = 3x + c$: $4 = 3 + c$, so $c = 1$.', 'Check with $(3, 10)$: $3 \\times 3 + 1 = 10$ ✓'],
        '$y = 3x + 1$'),
      example('Example 3 – a fraction gradient',
        'Find the equation of the line through $(6, -5)$ and $(15, -11)$.',
        ['Gradient $= \\dfrac{-11 - (-5)}{15 - 6} = \\dfrac{-6}{9} = -\\dfrac{2}{3}$.', 'Substitute $(6, -5)$: $-5 = -\\dfrac{2}{3} \\times 6 + c = -4 + c$, so $c = -1$.'],
        '$y = -\\frac{2}{3}x - 1$'),
      example('Example 4 – using the equation',
        'Does the point $(10, 31)$ lie on the line $y = 3x + 1$?',
        ['$3 \\times 10 + 1 = 31$, which is the $y$-coordinate of the point.'],
        'yes'),
      example('Example 5 – from a graph',
        'Find the equation of the line shown.',
        ['It crosses the $y$-axis at $4$, so $c = 4$.', 'Two clear points: $(0, 4)$ and $(2, 1)$. Run $= 2$, rise $= 1 - 4 = -3$ (it goes <b>down</b>).', 'Gradient $= \\dfrac{-3}{2} = -\\dfrac{3}{2}$ (see [[gr-gradient-intercept]]).'],
        '$y = -\\frac{3}{2}x + 4$', { visual: lineGraphFigure() }),
      mistake('using the point\'s $y$-coordinate as $c$. $c$ is the $y$-value where $x = 0$, which is only the same if the point is on the $y$-axis.'),
      note('Keep fractions as fractions until the end. $-\\frac{2}{3}$ is exact; $-0.67$ is not.'),
      h('What next?'),
      p('Lines that never meet, or meet at right angles, have gradients that are linked: see [[gr-parallel-perpendicular]].'),
    ].join(''),
  },
  {
    id: 'gr-parallel-perpendicular',
    title: 'Parallel and perpendicular lines',
    skills: ['gr-parallel-perpendicular'],
    prereqs: ['gr-line-equation'],
    summary: 'Use gradients to find lines that are parallel or perpendicular to a given line.',
    body: [
      h('The big idea'),
      p(
        '<b>Parallel</b> lines never meet: they slope exactly the same way, so they have the <b>same gradient</b>.',
        '<b>Perpendicular</b> lines meet at a right angle. If one goes "1 across and 2 up", turning it through $90^\\circ$ makes it go "2 back and 1 up" – that is $1$ up for $-2$ across, so its gradient is $\\frac{1}{-2} = -\\frac{1}{2}$.',
      ),
      key('Gradients', list([
        'Parallel: $m_1 = m_2$.',
        'Perpendicular: $m_1 \\times m_2 = -1$, so $m_2 = -\\dfrac{1}{m_1}$ – the <b>negative reciprocal</b> ("flip it and change the sign").',
      ])),
      figure(parallelPerpFigure(), '$y = 2x + 1$ and $y = 2x - 3$ are parallel. $y = -\\frac{1}{2}x + 1$ is perpendicular to both.'),
      tbl([['Gradient', '$3$', '$-4$', '$\\frac{1}{2}$', '$-\\frac{2}{3}$'], ['Perpendicular gradient', '$-\\frac{1}{3}$', '$\\frac{1}{4}$', '$-2$', '$\\frac{3}{2}$']]),
      example('Example 1 – a parallel line',
        'Find the equation of the line parallel to $y = 3x - 1$ that passes through $(2, 9)$.',
        ['Parallel, so the gradient is $3$: $y = 3x + c$.', 'Substitute $(2, 9)$: $9 = 6 + c$, so $c = 3$.'],
        '$y = 3x + 3$'),
      example('Example 2 – a perpendicular line',
        'Find the equation of the line perpendicular to $y = 4x - 1$ that passes through $(8, 5)$.',
        ['Gradient of $y = 4x - 1$ is $4$, so the perpendicular gradient is $-\\dfrac{1}{4}$.', '$y = -\\dfrac{1}{4}x + c$. Substitute $(8, 5)$: $5 = -2 + c$, so $c = 7$.'],
        '$y = -\\frac{1}{4}x + 7$'),
      example('Example 3 – where it crosses the x-axis',
        'Where does the line $y = -\\frac{1}{4}x + 7$ cross the $x$-axis?',
        ['On the $x$-axis $y = 0$: $0 = -\\dfrac{1}{4}x + 7$, so $\\dfrac{1}{4}x = 7$ and $x = 28$.'],
        '$(28, 0)$'),
      mistake('forgetting to change the sign (using $\\frac{1}{4}$ instead of $-\\frac{1}{4}$) or forgetting to flip (using $-4$).'),
      mistake('reading the gradient from an equation that is not in the form $y = mx + c$. Rearrange first: $2y - 8x = 14$ is $y = 4x + 7$, gradient $4$.'),
      note('Check a perpendicular gradient by multiplying: $4 \\times \\left(-\\frac{1}{4}\\right) = -1$ ✓'),
      h('What next?'),
      p('Perpendicular lines appear in [[gr-circle-equation|tangents to circles]], because a tangent is perpendicular to the radius.'),
    ].join(''),
  },
];
