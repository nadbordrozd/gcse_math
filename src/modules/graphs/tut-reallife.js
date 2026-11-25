// Learn pages: real-life graphs, distance–time and velocity–time graphs. See docs/TUTORIAL_GUIDELINES.md.
import { h, p, list, steps, key, display, note, mistake, figure, example } from '../../tutorial-kit.js';
import { chart, lineLabel, halo } from './diagrams.js';
import { ACCENT, ACCENT2 } from '../../svg.js';

const clock = (mins) => { const t = 9 * 60 + mins; return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };

/* Diagrams ---------------------------------------------------------- */

function conversionFigure() {
  const c = chart({ xmin: 0, xmax: 100, ymin: 0, ymax: 120, xstep: 20, ystep: 20, xminor: 4, yminor: 4, w: 320, h: 240, xtitle: 'Pounds (£)', ytitle: 'Euros (€)' });
  const read = c.poly([[50, 0], [50, 60], [0, 60]], { color: ACCENT2, width: 1.8, dash: '5 4' });
  return c.wrap(c.seg([0, 0], [100, 120]) + read + c.point(50, 60, null, { r: 3.5, color: ACCENT2 }));
}
function taxiFigure() {
  const c = chart({ xmin: 0, xmax: 10, ymin: 0, ymax: 25, xstep: 2, ystep: 5, xminor: 2, yminor: 5, w: 320, h: 230, xtitle: 'Distance (miles)', ytitle: 'Cost (£)' });
  const tri = c.poly([[0, 3], [5, 3], [5, 13]], { color: ACCENT2, width: 1.8, dash: '5 4' });
  return c.wrap(c.seg([0, 3], [10, 23]) + tri + halo(c.X(2.5), c.Y(3) + 12, '5 miles', { size: 13, color: ACCENT2 }) + halo(c.X(5) + 30, c.Y(8), '£10', { size: 13, color: ACCENT2 }));
}
function tariffFigure() {
  const c = chart({ xmin: 0, xmax: 200, ymin: 0, ymax: 30, xstep: 50, ystep: 5, xminor: 5, yminor: 5, w: 330, h: 230, xtitle: 'Minutes used', ytitle: 'Cost (£)' });
  return c.wrap(c.seg([0, 10], [200, 20]) + c.seg([0, 0], [200, 30], { color: ACCENT2 }) + c.point(100, 15)
    + lineLabel(c, 0.05, 10, 'Plan A', { color: ACCENT, at: 0.9 }) + lineLabel(c, 0.15, 0, 'Plan B', { color: ACCENT2, at: 0.75, side: -1 }));
}
function journeyFigure() {
  const c = chart({ xmin: 0, xmax: 180, ymin: 0, ymax: 14, xstep: 60, ystep: 2, xminor: 4, yminor: 2, w: 330, h: 220, xtitle: 'Time', ytitle: 'Distance from home (km)', fmtX: clock });
  return c.wrap(c.poly([[0, 0], [60, 12], [90, 12], [180, 0]]));
}
function vtFigure() {
  const c = chart({ xmin: 0, xmax: 20, ymin: 0, ymax: 25, xstep: 5, ystep: 5, xminor: 5, yminor: 5, w: 330, h: 220, xtitle: 'Time (seconds)', ytitle: 'Velocity (m/s)' });
  const fill = c.shade([[0, 0], [5, 20], [15, 20], [19, 0]], { opacity: 0.5 });
  return c.wrap(fill + c.poly([[0, 0], [5, 20], [15, 20], [19, 0]]));
}
const curveF = (t) => (t * (20 - t)) / 4 + 2;
function curveFigure({ tangent = false, strips = false } = {}) {
  const c = chart({ xmin: 0, xmax: 10, ymin: 0, ymax: 35, xstep: 2, ystep: 5, xminor: 2, yminor: 5, w: 320, h: 230, xtitle: 'Time (seconds)', ytitle: 'Velocity (m/s)' });
  let extra = '';
  if (tangent) extra += c.seg([0.5, 12], [10, 31], { color: ACCENT2, width: 2 }) + c.point(6, 23) + c.point(2, 15, null, { color: ACCENT2, r: 3 }) + c.point(10, 31, null, { color: ACCENT2, r: 3 });
  if (strips) {
    const pts = [0, 2, 4, 6, 8].map((t) => [t, curveF(t)]);
    extra += c.shade([[0, 0], ...pts, [8, 0]], { opacity: 0.45 }) + pts.map(([t, v]) => c.seg([t, 0], [t, v], { color: ACCENT2, width: 1.4, dash: '4 3' })).join('') + c.poly(pts, { color: ACCENT2, width: 1.6 });
  }
  return c.wrap(c.curve(curveF) + extra);
}

/* Pages ------------------------------------------------------------- */

export const reallifeTutorials = [
  {
    id: 'gr-real-life',
    title: 'Real-life and conversion graphs',
    skills: ['gr-real-life'],
    prereqs: ['gr-coordinates', 'gr-gradient-intercept'],
    summary: 'Read conversion graphs and cost graphs, and understand what the intercept and gradient mean in real life.',
    body: [
      h('The big idea'),
      p('Many real situations make straight-line graphs: converting pounds to euros, the cost of a taxi ride, the water in a tank. Reading these graphs carefully – and knowing what the slope and the starting value mean – answers most questions about them.'),
      key('Reading a real-life graph', list([
        'Read the <b>axis labels and units</b> first, and work out what one small square is worth.',
        'To read a value: go from one axis to the line, then across (or down) to the other axis.',
        'The <b>$y$-intercept</b> is the starting value or <b>fixed charge</b> (the value when the $x$-quantity is 0).',
        'The <b>gradient</b> is the <b>rate</b>: how much the $y$-quantity changes for each 1 unit of the $x$-quantity.',
      ])),
      h('Conversion graphs'),
      figure(conversionFigure(), 'A conversion graph: £50 converts to €60. One small square is 5 on each axis.'),
      example('Example 1 – reading both ways',
        'Use the graph to convert £50 to euros, and €90 to pounds.',
        ['£50: go up from 50 to the line, then across: €60.', '€90: go across from 90 to the line, then down: £75.'],
        '€60 and £75'),
      example('Example 2 – beyond the graph',
        'Convert £300 to euros.',
        ['£300 is off the graph. The graph is a straight line through the origin, so pounds and euros are in [[rat-direct-proportion|direct proportion]].', '£300 $= 6 \\times$ £50, so it is $6 \\times$ €60 $=$ €360.'],
        '€360'),
      h('Fixed charge plus a rate'),
      figure(taxiFigure(), 'A taxi charges a fixed £3 plus £2 per mile.'),
      example('Example 3 – a taxi fare',
        'The graph shows the cost of a taxi. Find the fixed charge, the cost per mile, and the cost of a 30-mile journey.',
        ['Fixed charge: where the line meets the cost axis, £3.', 'Cost per mile (gradient): over 5 miles the cost rises by £10, so £2 per mile.', '30 miles: £3 + 30 × £2 = £63.'],
        '£3, £2 per mile, £63'),
      mistake('multiplying the cost of 10 miles (£23) by 3 to get 30 miles. That pays the fixed charge three times. Only straight lines <b>through the origin</b> can be scaled up like that.'),
      h('Comparing two plans'),
      figure(tariffFigure(), 'Plan A: £10 a month plus 5p a minute. Plan B: 15p a minute.'),
      example('Example 4 – when are they the same?',
        'For how many minutes do the two plans cost the same, and which is cheaper for 150 minutes?',
        ['The lines cross at 100 minutes (both cost £15).', 'At 150 minutes: Plan A is £10 + £7.50 = £17.50; Plan B is £22.50.'],
        '100 minutes; Plan A is cheaper for 150 minutes'),
      note('When a line slopes down (a tank emptying, a candle burning), the gradient is negative: the rate is a decrease per unit of time.'),
      h('What next?'),
      p('A special kind of real-life graph shows journeys: see [[gr-distance-time]].'),
    ].join(''),
  },
  {
    id: 'gr-distance-time',
    title: 'Distance–time graphs',
    skills: ['gr-distance-time'],
    prereqs: ['gr-real-life', 'rat-speed'],
    summary: 'Read journeys from distance–time graphs and work out speeds from their gradients.',
    body: [
      h('The big idea'),
      p('A distance–time graph shows how far someone is from a starting point (usually home) as time goes by. The steeper the line, the faster they are going – because the gradient is distance ÷ time, which is [[rat-speed|speed]].'),
      key('Reading a distance–time graph', list([
        '<b>Sloping up</b>: moving away from home. <b>Sloping down</b>: coming back.',
        '<b>Horizontal</b>: not moving (stopped).',
        '<b>Steeper</b> means <b>faster</b>. The gradient is the speed.',
        'Speed $= \\dfrac{\\text{distance}}{\\text{time}}$ – with the time in <b>hours</b> for km/h.',
      ])),
      figure(journeyFigure(), 'A cycle ride: out to 12 km, a stop, then home.'),
      example('Example 1 – reading the graph',
        'How long did the cyclist stop for, and when did they get home?',
        ['The horizontal part runs from 10:00 to 10:30: a 30-minute stop.', 'The graph returns to 0 km at 12:00.'],
        '30 minutes; 12:00'),
      example('Example 2 – speeds',
        'Find the speed on the way out and on the way back, in km/h.',
        ['Out: 12 km in 1 hour, so $12 \\div 1 = 12$ km/h.', 'Back: 12 km from 10:30 to 12:00, which is 90 minutes $= 1.5$ hours. $12 \\div 1.5 = 8$ km/h.'],
        '12 km/h out, 8 km/h back'),
      example('Example 3 – average speed',
        'Find the average speed for the whole trip, including the stop.',
        ['Total distance: 12 km out + 12 km back = 24 km.', 'Total time: 09:00 to 12:00 = 3 hours.', 'Average speed $= 24 \\div 3 = 8$ km/h.'],
        '8 km/h'),
      mistake('dividing by minutes when you want km/h. 12 km in 90 minutes is not $12 \\div 90$; change 90 minutes to $1.5$ hours first.'),
      mistake('using only the distance <i>from home</i> for the total distance. Going 12 km out and 12 km back is 24 km travelled.'),
      note('Average speed is total distance ÷ total time. It is <b>not</b> the average of the separate speeds.'),
      h('What next?'),
      p('Velocity–time graphs look similar but mean something different: see [[gr-rates-of-change]].'),
    ].join(''),
  },
  {
    id: 'gr-rates-of-change',
    title: 'Gradients and areas under graphs',
    skills: ['gr-rates-of-change'],
    prereqs: ['gr-distance-time', 'gr-gradient-intercept', 'geo-area-trapezium-compound'],
    summary: 'Use gradients for acceleration and rates of change, and areas under velocity–time graphs for distance.',
    body: [
      h('The big idea'),
      p(
        'On any graph, the <b>gradient</b> is a rate of change: how fast the $y$-quantity changes per unit of the $x$-quantity. The <b>area under</b> a graph adds up the $y$-quantity over time.',
        'On a <b>velocity–time</b> graph (velocity is speed in a particular direction) these have special meanings.',
      ),
      key('Velocity–time graphs', list([
        'Gradient $=$ <b>acceleration</b> (m/s²). A negative gradient is a <b>deceleration</b>.',
        'Area under the graph $=$ <b>distance travelled</b> (m).',
        'Horizontal line: constant speed (acceleration $0$).',
      ])),
      figure(vtFigure(), 'A car speeds up for 5 s, travels at 20 m/s for 10 s, then slows to a stop in 4 s.'),
      example('Example 1 – acceleration',
        'Find the acceleration in the first 5 seconds and the deceleration at the end.',
        ['First 5 s: velocity rises from 0 to 20 m/s. Gradient $= 20 \\div 5 = 4$ m/s².', 'Last 4 s (15 s to 19 s): velocity falls by 20 m/s. $20 \\div 4 = 5$, so a deceleration of 5 m/s².'],
        '$4$ m/s²; deceleration $5$ m/s²'),
      example('Example 2 – distance from the area',
        'Find the total distance travelled.',
        ['Split the area into shapes ([[geo-area-trapezium-compound]]): triangle $\\frac{1}{2} \\times 5 \\times 20 = 50$, rectangle $10 \\times 20 = 200$, triangle $\\frac{1}{2} \\times 4 \\times 20 = 40$.', 'Total $= 50 + 200 + 40 = 290$.', '(Or use one trapezium: $\\frac{10 + 19}{2} \\times 20 = 290$.)'],
        '$290$ m'),
      h('Curved graphs'),
      p('When the graph is curved, the gradient keeps changing. Two ideas help:'),
      list([
        'The <b>average rate of change</b> between two points is the gradient of the straight line (chord) joining them.',
        'The rate of change <b>at one instant</b> is the gradient of the <b>tangent</b> there: a straight line that just touches the curve. Draw it, pick two points far apart on it, and work out rise ÷ run.',
      ]),
      figure(curveFigure({ tangent: true }), 'The tangent at $t = 6$ passes through $(2, 15)$ and $(10, 31)$.'),
      example('Example 3 – a tangent',
        'Use the tangent to estimate the acceleration at $t = 6$ seconds.',
        ['Two points on the tangent: $(2, 15)$ and $(10, 31)$.', 'Gradient $= \\dfrac{31 - 15}{10 - 2} = \\dfrac{16}{8} = 2$.'],
        'about $2$ m/s²'),
      example('Example 4 – an average rate',
        'The velocity is $11$ m/s at $t = 2$ and $23$ m/s at $t = 6$. Find the average acceleration between these times.',
        ['Gradient of the chord $= \\dfrac{23 - 11}{6 - 2} = \\dfrac{12}{4} = 3$.'],
        '$3$ m/s²'),
      h('Estimating the area under a curve'),
      p('Split the area into vertical strips of equal width and treat each one as a trapezium: area $= \\frac{a + b}{2} \\times$ width, where $a$ and $b$ are the heights at each end.'),
      figure(curveFigure({ strips: true }), 'Four strips, each 2 seconds wide.'),
      example('Example 5 – four strips',
        'The velocities at $t = 0, 2, 4, 6, 8$ are $2, 11, 18, 23, 26$ m/s. Use four strips to estimate the distance in the first 8 seconds.',
        ['Strips: $\\frac{2 + 11}{2} \\times 2 = 13$, $\\frac{11 + 18}{2} \\times 2 = 29$, $\\frac{18 + 23}{2} \\times 2 = 41$, $\\frac{23 + 26}{2} \\times 2 = 49$.', 'Total $= 13 + 29 + 41 + 49 = 132$.'],
        'about $132$ m'),
      note('This curve bends downwards, so the straight tops of the trapeziums sit just <b>below</b> it: the estimate is a little too small (an underestimate).'),
      mistake('mixing up the two graphs. On a <b>velocity–time</b> graph, distance is the <b>area</b>, not the gradient (the gradient is acceleration). On a <b>distance–time</b> graph, the gradient is speed.'),
      h('What next?'),
      p('Gradients of straight lines are revised in [[gr-gradient-intercept]].'),
    ].join(''),
  },
];

void [steps, display, lineLabel];
