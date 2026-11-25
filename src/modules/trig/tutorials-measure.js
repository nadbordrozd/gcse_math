// Learn pages: Pythagoras (2D, problems, 3D), exact values, cosine rule, ½ab sin C, choosing the rule.
// Every number in the worked examples was checked with node. See docs/TUTORIAL_GUIDELINES.md.
import { h, p, list, steps, key, display, note, mistake, figure, columns, example, tbl } from '../../tutorial-kit.js';
import { plane } from '../../svg.js';
import { fig, rightTriangleFig, FILL, FILL2, ACCENT, ACCENT2 } from './diagrams.js';
import { cuboidFig, pyramidFig } from './solids.js';
import { triFig } from './nonright.js';
import { altitudeFig } from './trigonometry.js';
import { triPrism, edges } from './diagrams.js';

/* ------------------------------------------------------------------ */
/* Diagrams                                                            */
/* ------------------------------------------------------------------ */

// 3-4-5 triangle with a square drawn on each side.
const squaresFig = () => fig({
  pts: { C: [0, 0], A: [4, 0], B: [0, 3] }, nda: false, width: 330, height: 300, pad: 22,
  bounds: [[-3, -4], [7, 7]],
  draw: (g) => g.poly([[0, 0], [4, 0], [4, -4], [0, -4]], { fill: FILL2 }) + g.poly([[0, 0], [0, 3], [-3, 3], [-3, 0]], { fill: FILL2 })
    + g.poly([[4, 0], [0, 3], [3, 7], [7, 4]], { fill: 'var(--d-fill, #e8eefc)' }) + g.poly('CAB', { fill: 'none' }) + g.right('C', 'A', 'B', 10)
    + g.text([2, -2], '16') + g.text([-1.5, 1.5], '9') + g.text([3.5, 3.5], '25')
    + g.side('C', 'A', '4', { inside: [2, 3] }) + g.side('C', 'B', '3', { inside: [3, 1] }) + g.side('A', 'B', '5', { inside: [0, 0], offset: 4 }),
});

const ladderFig = () => rightTriangleFig({ angleA: 67.4, sides: { CA: '2.5 m', CB: 'h', AB: '6.5 m' }, width: 300, height: 220 });

function distanceFig() {
  const pl = plane({ xmin: 0, xmax: 8, ymin: 0, ymax: 11, unitPx: 22 });
  const P = pl.P;
  const corner = P([7, 2]);
  return pl.wrap(pl.segment([1, 2], [7, 10], { color: ACCENT }) + pl.segment([1, 2], [7, 2], { color: ACCENT2, dash: '5 4', width: 2 }) + pl.segment([7, 2], [7, 10], { color: ACCENT2, dash: '5 4', width: 2 })
    + pl.point(1, 2, 'A (1, 2)', { dx: 6, dy: 14 }) + pl.point(7, 10, 'B (7, 10)', { dx: -30, dy: -12 })
    + `<text x="${(P([1, 2])[0] + corner[0]) / 2}" y="${corner[1] + 16}" text-anchor="middle" font-size="14" fill="currentColor">6</text>`
    + `<text x="${corner[0] + 12}" y="${(corner[1] + P([7, 10])[1]) / 2}" font-size="14" fill="currentColor">8</text>`);
}

// Equilateral triangle of side 2 cut in half, and an isosceles right-angled triangle with legs 1.
const exactFigs = () => columns(
  fig({
    pts: { A: [0, Math.sqrt(3)], B: [-1, 0], C: [1, 0], M: [0, 0] }, nda: false, width: 240, height: 220, pad: 30,
    draw: (g) => g.poly('ABC') + g.seg('A', 'M', { dash: '5 4', color: ACCENT }) + g.right('M', 'C', 'A', 9)
      + g.poly(['A', 'M', 'C'], { fill: 'var(--d-fill2, #fde9d9)' }) + g.right('M', 'C', 'A', 9)
      + g.side('A', 'B', '2') + g.side('A', 'C', '2') + g.side('M', 'C', '1') + g.side('B', 'M', '1') + g.side('M', 'A', '√3', { inside: 'B', color: ACCENT })
      + g.angle('C', 'A', 'B', '60°') + g.angle('A', 'M', 'C', '30°', { r: 26 }),
  }),
  fig({
    pts: { A: [0, 0], B: [1, 0], C: [0, 1] }, nda: false, width: 220, height: 220, pad: 34,
    draw: (g) => g.poly('ABC') + g.right('A', 'B', 'C', 10) + g.side('A', 'B', '1') + g.side('A', 'C', '1') + g.side('B', 'C', '√2', { color: ACCENT })
      + g.angle('B', 'C', 'A', '45°') + g.angle('C', 'A', 'B', '45°'),
  }),
);

// Triangle with the height from C drawn, for ½ab sin C.
const areaFig = () => fig({
  pts: { A: [0, 0], B: [6, 0], C: [2.2, 3.2], H: [2.2, 0] }, nda: false, width: 340, height: 220,
  draw: (g) => g.poly('ABC') + g.seg('C', 'H', { dash: '5 4', color: ACCENT }) + g.right('H', 'B', 'C', 9)
    + g.side('A', 'C', 'b') + g.side('A', 'B', 'c') + g.side('B', 'C', 'a') + g.side('C', 'H', 'h', { inside: 'A', color: ACCENT, t: 0.45 })
    + g.angle('A', 'B', 'C') + g.polyNames('ABC'),
});

// Quadrilateral ABCD with diagonal BD (sine/cosine chain).
const quadFig = () => {
  const r = (deg) => (deg * Math.PI) / 180;
  const A = [0, 0]; const B = [7, 0]; const D = [9 * Math.cos(r(75)), 9 * Math.sin(r(75))];
  const bd = Math.hypot(D[0] - B[0], D[1] - B[1]); const u = [(D[0] - B[0]) / bd, (D[1] - B[1]) / bd];
  const rot = (v, t) => [v[0] * Math.cos(r(t)) - v[1] * Math.sin(r(t)), v[0] * Math.sin(r(t)) + v[1] * Math.cos(r(t))];
  const bc = (bd * Math.sin(r(70))) / Math.sin(r(60)); const w = rot(u, -50);
  const C = [B[0] + w[0] * bc, B[1] + w[1] * bc];
  return fig({
    pts: { A, B, C, D }, width: 360, height: 250,
    draw: (g) => g.poly('ABCD') + g.seg('B', 'D') + g.angle('A', 'B', 'D', '75°') + g.angle('C', 'D', 'B', '60°') + g.angle('B', 'D', 'C', '50°')
      + g.side('A', 'B', '7 cm') + g.side('A', 'D', '9 cm') + g.side('C', 'D', 'x') + g.polyNames('ABCD'),
  });
};

// A journey A -> B -> C with north lines at A and B.
const journeyFig = () => {
  const r = (deg) => (deg * Math.PI) / 180;
  const A = [0, 0]; const B = [8 * Math.sin(r(60)), 8 * Math.cos(r(60))]; const C = [B[0] + 5 * Math.sin(r(170)), B[1] + 5 * Math.cos(r(170))];
  return fig({
    pts: { A, B, C }, width: 360, height: 260, bounds: [[0, 5.8], [B[0], B[1] + 3.8]],
    draw: (g) => g.seg('A', [0, 5], { dash: '4 4', width: 1.4 }) + g.seg('B', [B[0], B[1] + 3], { dash: '4 4', width: 1.4 }) + g.textAt([0, 5], 0, -10, 'N', { size: 13 }) + g.textAt([B[0], B[1] + 3], 0, -10, 'N', { size: 13 })
      + g.seg('A', 'B') + g.seg('B', 'C') + g.seg('A', 'C', { dash: '6 4', color: ACCENT })
      + g.angle('A', [0, 5], 'B', '60°', { r: 30 }) + g.angle('B', 'A', 'C', '70°', { r: 24 })
      + g.side('A', 'B', '8 km', { inside: 'C' }) + g.side('B', 'C', '5 km', { inside: 'A' }) + g.side('A', 'C', 'd', { inside: 'B', color: ACCENT })
      + g.name('A', 'A', { dir: [-0.7, 0.7] }) + g.name('B', 'B', { dir: [1, -0.2] }) + g.name('C', 'C', { dir: [0.6, 0.8] }),
  });
};

// Triangular prism for the 3D page.
const prismFig = () => {
  const pr = triPrism(5, 7, 20 * 0.55);
  return fig({
    pts: pr.pts, width: 360, height: 230,
    draw: (g) => g.poly('ABC', { fillOpacity: 0.55, width: 0 }) + edges(g, pr.visible) + edges(g, pr.hidden, { dash: '5 4', width: 1.4 }) + g.right('B', 'A', 'C', 9)
      + g.seg('A', 'F', { color: ACCENT, width: 2.2 }) + g.seg('B', 'F', { dash: '5 4', color: ACCENT, width: 1.6 }) + g.angle('F', 'B', 'A', 'x', { r: 30 })
      + g.side('A', 'B', '7 cm', { inside: 'C' }) + g.side('B', 'C', '5 cm', { inside: 'A' }) + g.side('C', 'F', '20 cm', { inside: 'A' })
      + ['A', 'B', 'C', 'D', 'F'].map((v) => g.name(v, v, { dir: { A: [-1, -0.2], B: [-0.7, 0.7], C: [0.3, 1], D: [0, -1], F: [1, 0] }[v], size: 14, offset: 4 })).join('') + g.freeName('E', 'E', { size: 14, offset: 3 }),
  });
};

// Bearings: two ships leave a harbour.
const shipsFig = () => {
  const r = (deg) => (deg * Math.PI) / 180;
  const A = [12 * Math.sin(r(40)), 12 * Math.cos(r(40))]; const B = [9 * Math.sin(r(110)), 9 * Math.cos(r(110))];
  return fig({
    pts: { H: [0, 0], A, B }, width: 340, height: 250,
    draw: (g) => g.seg('H', [0, 8], { dash: '4 4', width: 1.4 }) + g.textAt([0, 8], 0, -10, 'N', { size: 13 })
      + g.seg('H', 'A') + g.seg('H', 'B') + g.seg('A', 'B', { dash: '6 4', color: ACCENT })
      + g.angle('H', [0, 8], 'A', '40°', { r: 30 }) + g.angle('H', 'A', 'B', '70°', { r: 22 })
      + g.side('H', 'A', '12 km', { inside: 'B' }) + g.side('H', 'B', '9 km', { inside: 'A' }) + g.side('A', 'B', 'd', { inside: 'H', color: ACCENT })
      + g.name('H', 'H', { dir: [-0.7, 0.7] }) + g.name('A', 'A', { dir: [0, -1] }) + g.name('B', 'B', { dir: [1, 0.3] }),
  });
};

/* ------------------------------------------------------------------ */
/* Pages                                                               */
/* ------------------------------------------------------------------ */

export const measureTutorials = [
  {
    id: 'trig-pythagoras',
    title: "Pythagoras' theorem",
    skills: ['trig-pythagoras'],
    prereqs: ['num-squares-roots', 'geo-area-basic'],
    summary: 'Find a missing side of a right-angled triangle from the other two sides.',
    body: [
      h('The big idea'),
      p('In a right-angled triangle the three sides are not independent: if you know any two, the third is fixed. Pythagoras\' theorem is the rule that connects them. It only works for triangles with a right angle ($90^\\circ$).',
        'The longest side, opposite the right angle, is called the <b>hypotenuse</b>. The other two are the <b>shorter sides</b> (sometimes called the legs).'),
      key("Pythagoras' theorem", display('a^2 + b^2 = c^2') + p('where $c$ is the hypotenuse and $a$, $b$ are the two shorter sides. In words: <i>the squares of the two shorter sides add up to the square of the hypotenuse.</i>')),
      h('Where it comes from'),
      p('Draw a square on each side of a right-angled triangle with sides 3, 4 and 5. The [[geo-area-basic|areas]] of the squares are $3^2 = 9$, $4^2 = 16$ and $5^2 = 25$ – and $9 + 16 = 25$. This happens for <b>every</b> right-angled triangle: the two smaller squares together have exactly the same area as the big square on the hypotenuse.'),
      figure(squaresFig(), 'The two small squares (9 + 16) have the same total area as the big square (25).'),
      h('Method'),
      steps([
        'Find the hypotenuse first: it is opposite the right angle, and it is always the longest side.',
        '<b>Finding the hypotenuse?</b> Square the two shorter sides and <b>add</b>.',
        '<b>Finding a shorter side?</b> Square the hypotenuse and the other side and <b>subtract</b> (big − small).',
        'Take the [[num-squares-roots|square root]] to get the length. Round only at the end.',
      ]),
      example('Example 1 – the hypotenuse',
        'A right-angled triangle has shorter sides $6$ cm and $8$ cm. Find the hypotenuse $x$.',
        ['The unknown is opposite the right angle, so add: $x^2 = 6^2 + 8^2 = 36 + 64 = 100$', '$x = \\sqrt{100} = 10$'],
        '$x = 10$ cm'),
      example('Example 2 – a calculator answer',
        'The shorter sides are $5$ cm and $9$ cm. Find the hypotenuse to 1 decimal place.',
        ['$x^2 = 5^2 + 9^2 = 25 + 81 = 106$', '$x = \\sqrt{106} = 10.2956\\ldots$'],
        '$x = 10.3$ cm'),
      example('Example 3 – a shorter side',
        'The hypotenuse is $11$ cm and one shorter side is $7$ cm. Find the other side $y$ to 1 decimal place.',
        ['$y$ is a shorter side, so subtract: $y^2 = 11^2 - 7^2 = 121 - 49 = 72$', '$y = \\sqrt{72} = 8.4852\\ldots$',
          'If the question asks for an <b>exact</b> answer, leave it as a surd: $\\sqrt{72} = \\sqrt{36 \\times 2} = 6\\sqrt{2}$.'],
        '$y = 8.5$ cm (or exactly $6\\sqrt{2}$ cm)'),
      note('If a side is a surd, square it carefully ([[num-surds-operations]]): $(4\\sqrt{3})^2 = 4^2 \\times (\\sqrt{3})^2 = 16 \\times 3 = 48$, not $4 \\times 3$. So a triangle with hypotenuse $4\\sqrt{3}$ and one side $6$ has third side $\\sqrt{48 - 36} = \\sqrt{12} = 2\\sqrt{3}$.'),
      h('Is it right-angled?'),
      p('The theorem also works backwards: if $a^2 + b^2 = c^2$ for the longest side $c$, the triangle <b>is</b> right-angled. For sides $7$, $24$ and $25$: $7^2 + 24^2 = 49 + 576 = 625 = 25^2$, so it is. For $6$, $8$ and $11$: $36 + 64 = 100$, but $11^2 = 121$, so it is not.'),
      mistake('adding when you want a shorter side. If you add $11^2 + 7^2$ you get $\\sqrt{170} = 13.0\\ldots$, which is longer than the hypotenuse – impossible.'),
      mistake('forgetting the square root at the end ($x^2 = 100$ does not mean $x = 100$), or "squaring" by doubling ($6^2$ is $36$, not $12$).'),
      note('Sense check: the hypotenuse is longer than each shorter side, but shorter than the two of them added together.'),
      h('What next?'),
      p('Use the theorem in real situations and on coordinate grids in [[trig-pythagoras-problems]], then go up a dimension in [[trig-3d]]. To find <b>angles</b> as well as sides, see [[trig-sohcahtoa-side]].'),
    ].join(''),
  },
  {
    id: 'trig-pythagoras-problems',
    title: 'Pythagoras problems',
    skills: ['trig-pythagoras-problems'],
    prereqs: ['trig-pythagoras', 'gr-coordinates'],
    summary: 'Spot the hidden right-angled triangle in ladders, rectangles, isosceles triangles and coordinate grids.',
    body: [
      h('The big idea'),
      p('Exam questions rarely show you a right-angled triangle with two sides labelled. The skill is to <b>find</b> the right angle, sketch the triangle, and decide which side is the hypotenuse. After that it is ordinary [[trig-pythagoras|Pythagoras]].'),
      h('Where the right angles hide'),
      list([
        '<b>Walls and the ground</b>: a ladder, ramp, kite string or wire makes a right-angled triangle with a vertical wall/pole and flat ground. The ladder (or string, or wire) is the hypotenuse.',
        '<b>North and east</b>: compass directions are at right angles, so "8 km north then 6 km east" makes a right-angled triangle.',
        '<b>Rectangles</b>: a diagonal splits a rectangle into two right-angled triangles. The diagonal is the hypotenuse.',
        '<b>Isosceles triangles</b>: the line of symmetry (the perpendicular height) splits it into two identical right-angled triangles. It cuts the base <b>in half</b>.',
        '<b>Coordinate grids</b>: the distance between two points is the hypotenuse of a triangle with horizontal and vertical sides.',
      ]),
      key('Recipe', steps(['Sketch the situation and mark the right angle.', 'Label the lengths you know and the one you want.', 'Decide: is the unknown the hypotenuse (add the squares) or a shorter side (subtract)?', 'Work it out and answer the question that was asked – sometimes there is one more step.'])),
      example('Example 1 – a ladder',
        'A ladder $6.5$ m long leans against a vertical wall. Its foot is $2.5$ m from the wall. How high up the wall does it reach?',
        ['The wall meets the ground at a right angle and the ladder is the hypotenuse. The height $h$ is a shorter side, so subtract.', '$h^2 = 6.5^2 - 2.5^2 = 42.25 - 6.25 = 36$', '$h = \\sqrt{36} = 6$'],
        '$6$ m', { visual: ladderFig() }),
      example('Example 2 – distance between two points',
        'Find the distance between $A(1, 2)$ and $B(7, 10)$.',
        ['Across: $7 - 1 = 6$. Up: $10 - 2 = 8$. These are the shorter sides of a right-angled triangle.', '$AB^2 = 6^2 + 8^2 = 36 + 64 = 100$', '$AB = 10$'],
        '$10$ units', { visual: distanceFig() }),
      example('Example 3 – an isosceles triangle',
        'An isosceles triangle has two sides of $13$ cm and a base of $10$ cm. Find its area.',
        ['The height splits the base in half: $10 \\div 2 = 5$ cm.', 'Height $h$: $h^2 = 13^2 - 5^2 = 169 - 25 = 144$, so $h = 12$ cm.', 'Area $= \\frac{1}{2} \\times \\text{base} \\times \\text{height} = \\frac{1}{2} \\times 10 \\times 12 = 60$'],
        '$60$ cm²'),
      example('Example 4 – two triangles that share a side',
        '$D$, $B$ and $C$ lie on a straight line and $AB$ is perpendicular to it. $AD = 13$ cm, $DB = 5$ cm and $BC = 16$ cm. Find $AC$.',
        ['Triangle $ABD$ first: $AB^2 = 13^2 - 5^2 = 144$, so $AB = 12$ cm.', 'Then triangle $ABC$: $AC^2 = 12^2 + 16^2 = 144 + 256 = 400$', '$AC = 20$'],
        '$AC = 20$ cm', { visual: altitudeFig({ db: 5, bc: 16, h: 12, labels: { AD: '13 cm', DB: '5 cm', BC: '16 cm' } }) }),
      mistake('using the whole base of an isosceles triangle. The height meets the base at its midpoint, so use <b>half</b> the base.'),
      note('With coordinates, negative numbers do not matter: the difference is squared, so $(-5)^2 = 25$. From $(-3, 4)$ to $(2, -1)$: across $5$, down $5$, distance $\\sqrt{50} = 7.07\\ldots$'),
      h('What next?'),
      p('Pythagoras in three dimensions (boxes and pyramids) is in [[trig-3d]]. When a question gives an <b>angle</b>, you need [[trig-sohcahtoa-side|trigonometry]].'),
    ].join(''),
  },
  {
    id: 'trig-3d',
    title: 'Pythagoras and trigonometry in 3D',
    skills: ['trig-3d'],
    prereqs: ['trig-pythagoras-problems', 'trig-sohcahtoa-angle'],
    summary: 'Find lengths and angles inside cuboids, pyramids and prisms by finding the right 2D triangle.',
    body: [
      h('The big idea'),
      p('A 3D problem is really two 2D problems. Find a right-angled triangle that contains the length or angle you want, and work out any side of it you are missing using another right-angled triangle – usually one lying flat on the base.'),
      p('The usual missing side is a <b>diagonal of the base</b>. Once you have it, the triangle "standing up" inside the shape has a vertical edge and a right angle at the bottom.'),
      figure(cuboidFig({ w: 6, d: 8, h: 5, labels: { AB: '6 cm', BC: '8 cm', CG: '5 cm' }, base: true, angle: 'θ' }), 'Cuboid $ABCDEFGH$: the base diagonal $AC$ (dashed) and the space diagonal $AG$.'),
      key('Diagonal of a cuboid', display('d^2 = l^2 + w^2 + h^2') + p('Pythagoras twice: first across the base ($AC^2 = l^2 + w^2$), then up the triangle $ACG$ ($AG^2 = AC^2 + h^2$).')),
      h('Method'),
      steps([
        'Sketch the right-angled triangle that contains what you want (for $AG$, it is triangle $ACG$, with the right angle at $C$).',
        'Find any missing side of it from a flat triangle – usually the base diagonal.',
        'Use [[trig-pythagoras|Pythagoras]] for a length or [[trig-sohcahtoa-angle|inverse trig]] for an angle.',
        'Keep unrounded values on your calculator until the end.',
      ]),
      example('Example 1 – the space diagonal',
        'A cuboid is $6$ cm by $8$ cm by $5$ cm. Find the length of the diagonal $AG$ to 1 decimal place.',
        ['Base diagonal: $AC^2 = 6^2 + 8^2 = 100$, so $AC = 10$ cm.', 'Triangle $ACG$: $AG^2 = 10^2 + 5^2 = 125$', '$AG = \\sqrt{125} = 11.180\\ldots$'],
        '$AG = 11.2$ cm'),
      example('Example 2 – the angle with the base',
        'For the same cuboid, find the angle $\\theta$ between $AG$ and the base $ABCD$.',
        ['The angle is at $A$ in triangle $ACG$. $CG = 5$ is opposite $\\theta$ and $AC = 10$ is adjacent.', '$\\tan\\theta = \\dfrac{5}{10}$', '$\\theta = \\tan^{-1}(0.5) = 26.565\\ldots^\\circ$'],
        '$\\theta = 26.6^\\circ$'),
      example('Example 3 – a square-based pyramid',
        'A pyramid has a square base of side $8$ cm and its top $E$ is $10$ cm vertically above the centre $M$ of the base. Find the angle between the edge $EA$ and the base.',
        ['$M$ is halfway along the diagonal $AC$. $AC = \\sqrt{8^2 + 8^2} = \\sqrt{128}$, so $AM = \\frac{1}{2}\\sqrt{128} = 5.656\\ldots$ cm.', 'Triangle $AME$ has its right angle at $M$: $\\tan\\theta = \\dfrac{10}{5.656\\ldots}$', '$\\theta = 60.503\\ldots^\\circ$'],
        '$60.5^\\circ$', { visual: pyramidFig({ s: 8, h: 10, labels: { AB: '8 cm' }, angle: 'θ' }) }),
      example('Example 4 – working backwards from the diagonal',
        'A cuboid has a $14$ cm by $15$ cm base and a space diagonal of $25$ cm. Find its height $h$ to 1 decimal place.',
        ['Use $d^2 = l^2 + w^2 + h^2$: $25^2 = 14^2 + 15^2 + h^2$', '$h^2 = 625 - 196 - 225 = 204$', '$h = \\sqrt{204} = 14.282\\ldots$'],
        '$h = 14.3$ cm'),
      example('Example 5 – a triangular prism',
        'A triangular prism has a cross-section $ABC$ with a right angle at $B$, $AB = 7$ cm (vertical) and $BC = 5$ cm. The prism is $20$ cm long. Find the angle $x$ between $AF$ and the base $BCFE$.',
        ['The angle is in triangle $ABF$, with the right angle at $B$. First find $BF$ across the rectangular base: $BF = \\sqrt{5^2 + 20^2} = \\sqrt{425} = 20.615\\ldots$ cm.', '$AB$ is opposite $x$ and $BF$ is adjacent: $\\tan x = \\dfrac{7}{20.615\\ldots}$', '$x = 18.754\\ldots^\\circ$'],
        '$18.8^\\circ$', { visual: prismFig() }),
      mistake('using half the <b>side</b> of a square base instead of half the <b>diagonal</b> to reach the centre. The centre is $5.66$ cm from a corner here, not $4$ cm.'),
      mistake('using the wrong angle. "The angle between a line and a plane" is the angle between the line and the line directly underneath it on the plane (here $AG$ and $AC$).'),
      note('Sense check: the space diagonal is the longest straight line inside a cuboid, so it must be longer than every edge and every face diagonal.'),
      h('What next?'),
      p('If the triangle you need is not right-angled, use [[trig-sine-rule]] or [[trig-cosine-rule]].'),
    ].join(''),
  },
  {
    id: 'trig-exact-values',
    title: 'Exact trig values',
    skills: ['trig-exact-values'],
    prereqs: ['trig-sohcahtoa-side', 'trig-pythagoras', 'num-surds-simplify', 'num-surds-rationalise'],
    summary: 'Know sin, cos and tan of 0°, 30°, 45°, 60° and 90° without a calculator, and use them to find exact answers.',
    body: [
      h('Why these angles?'),
      p('For most angles, sin, cos and tan are endless decimals, so you need a calculator. But for $30^\\circ$, $45^\\circ$ and $60^\\circ$ the values come from two simple triangles, and you are expected to know them (or rebuild them) in the non-calculator paper.'),
      h('Where they come from'),
      p('<b>Half an equilateral triangle.</b> An equilateral triangle of side 2 has all angles $60^\\circ$. Cut it in half: you get a right-angled triangle with hypotenuse 2, short side 1 and angles $30^\\circ$ and $60^\\circ$. By [[trig-pythagoras|Pythagoras]] the third side is $\\sqrt{2^2 - 1^2} = \\sqrt{3}$.',
        '<b>Half a square.</b> A right-angled isosceles triangle with shorter sides 1 has angles $45^\\circ$, $45^\\circ$, $90^\\circ$, and hypotenuse $\\sqrt{1^2 + 1^2} = \\sqrt{2}$.'),
      figure(exactFigs()),
      p('<b>$0^\\circ$ and $90^\\circ$.</b> Imagine squashing a right-angled triangle so its angle $\\theta$ shrinks to $0^\\circ$: the opposite side shrinks to $0$ and the adjacent side becomes as long as the hypotenuse. So $\\sin 0^\\circ = 0$, $\\cos 0^\\circ = 1$ and $\\tan 0^\\circ = 0$. At $90^\\circ$ the roles swap: $\\sin 90^\\circ = 1$ and $\\cos 90^\\circ = 0$ (and $\\tan 90^\\circ$ has no value). You can also read these off the [[gr-trig-graphs|graphs]].'),
      p('Now read off [[trig-sohcahtoa-side|SOH CAH TOA]]. For example $\\sin 30^\\circ = \\frac{\\text{O}}{\\text{H}} = \\frac{1}{2}$ and $\\tan 60^\\circ = \\frac{\\sqrt{3}}{1} = \\sqrt{3}$.'),
      key('Exact values', tbl([
        ['', '$0^\\circ$', '$30^\\circ$', '$45^\\circ$', '$60^\\circ$', '$90^\\circ$'],
        ['$\\sin$', '$0$', '$\\frac{1}{2}$', '$\\frac{\\sqrt{2}}{2}$', '$\\frac{\\sqrt{3}}{2}$', '$1$'],
        ['$\\cos$', '$1$', '$\\frac{\\sqrt{3}}{2}$', '$\\frac{\\sqrt{2}}{2}$', '$\\frac{1}{2}$', '$0$'],
        ['$\\tan$', '$0$', '$\\frac{1}{\\sqrt{3}}$', '$1$', '$\\sqrt{3}$', 'no value'],
      ]) + p('$\\frac{\\sqrt{2}}{2}$ is the same as $\\frac{1}{\\sqrt{2}}$, and $\\frac{1}{\\sqrt{3}}$ is the same as $\\frac{\\sqrt{3}}{3}$: multiply top and bottom by the root to [[num-surds-rationalise|rationalise the denominator]], e.g. $\\frac{1}{\\sqrt{3}} = \\frac{1 \\times \\sqrt{3}}{\\sqrt{3} \\times \\sqrt{3}} = \\frac{\\sqrt{3}}{3}$.')),
      note('Patterns help: sin goes up $0, \\frac{1}{2}, \\frac{\\sqrt{2}}{2}, \\frac{\\sqrt{3}}{2}, 1$ and cos is the same list backwards. That is because $\\sin\\theta = \\cos(90^\\circ - \\theta)$: the side opposite one acute angle is adjacent to the other.'),
      example('Example 1 – an expression',
        'Work out the exact value of $\\sin 60^\\circ \\times \\tan 30^\\circ$.',
        ['$\\sin 60^\\circ = \\dfrac{\\sqrt{3}}{2}$ and $\\tan 30^\\circ = \\dfrac{1}{\\sqrt{3}}$.', 'Multiply: $\\dfrac{\\sqrt{3}}{2} \\times \\dfrac{1}{\\sqrt{3}} = \\dfrac{\\sqrt{3}}{2\\sqrt{3}} = \\dfrac{1}{2}$'],
        '$\\frac{1}{2}$'),
      example('Example 2 – an exact side',
        'A right-angled triangle has hypotenuse $10$ cm and an angle of $60^\\circ$. Find the exact length of the side opposite the $60^\\circ$ angle.',
        ['O and H → sin: $x = 10 \\times \\sin 60^\\circ$', '$x = 10 \\times \\dfrac{\\sqrt{3}}{2} = 5\\sqrt{3}$'],
        '$5\\sqrt{3}$ cm'),
      example('Example 3 – find the angle',
        '$x$ is acute and $\\cos x = \\dfrac{\\sqrt{3}}{2}$. Find $x$.',
        ['Look along the cos row of the table: $\\cos 30^\\circ = \\dfrac{\\sqrt{3}}{2}$.'],
        '$x = 30^\\circ$'),
      example('Example 4 – dividing by an exact value',
        'The side opposite a $30^\\circ$ angle is $6$ cm. Find the hypotenuse.',
        ['O and H → sin: $\\sin 30^\\circ = \\dfrac{6}{x}$, so $x = \\dfrac{6}{\\sin 30^\\circ}$.', '$x = 6 \\div \\dfrac{1}{2} = 12$'],
        '$12$ cm'),
      example('Example 5 – rationalising',
        'The side opposite a $60^\\circ$ angle is $27$ cm. Find the exact length $x$ of the side adjacent to it.',
        ['O and A → tan: $\\tan 60^\\circ = \\dfrac{27}{x}$, so $x = \\dfrac{27}{\\tan 60^\\circ} = \\dfrac{27}{\\sqrt{3}}$.', 'Rationalise: $\\dfrac{27}{\\sqrt{3}} = \\dfrac{27\\sqrt{3}}{\\sqrt{3} \\times \\sqrt{3}} = \\dfrac{27\\sqrt{3}}{3} = 9\\sqrt{3}$'],
        '$9\\sqrt{3}$ cm'),
      mistake('mixing up $\\sin 30^\\circ$ and $\\sin 60^\\circ$. Picture the half-equilateral triangle: the short side (1) is opposite the small angle ($30^\\circ$), so $\\sin 30^\\circ = \\frac{1}{2}$.'),
      note('Sin and cos are never bigger than 1. If you get $\\sin x = \\sqrt{3}$, you have used the tan value.'),
      h('What next?'),
      p('These values also explain the key points of the [[gr-trig-graphs|graphs of sin, cos and tan]].'),
    ].join(''),
  },
  {
    id: 'trig-cosine-rule',
    title: 'The cosine rule',
    skills: ['trig-cosine-rule'],
    prereqs: ['trig-sine-rule', 'trig-pythagoras', 'trig-sohcahtoa-angle'],
    summary: 'Find a side from two sides and the angle between them, or an angle from all three sides.',
    body: [
      h('Why we need it'),
      p('The [[trig-sine-rule|sine rule]] needs an <b>opposite pair</b>: a side together with the angle opposite it. Sometimes you do not have one – for example you know two sides and the angle <b>between</b> them, or you know all three sides and no angles. Then you need the cosine rule.'),
      h('Labelling'),
      p('Use the same labelling as the sine rule: angle $A$ is opposite side $a$, and so on. The angle in the formula must be the angle <b>between</b> the two sides $b$ and $c$, opposite the side $a$.'),
      figure(triFig({ angs: [48, 75, 57], sides: { BC: 'a', CA: 'b', AB: 'c' }, angles: { A: 'A' } }), 'Angle $A$ is between sides $b$ and $c$, opposite side $a$.'),
      key('The cosine rule', display('a^2 = b^2 + c^2 - 2bc\\cos A') + p('Rearranged to find an angle:') + display('\\cos A = \\frac{b^2 + c^2 - a^2}{2bc}')),
      h('Where it comes from'),
      p('If angle $A$ is $90^\\circ$, then $\\cos A = 0$ and the rule becomes $a^2 = b^2 + c^2$ – that is [[trig-pythagoras|Pythagoras]]. The extra term $-2bc\\cos A$ corrects Pythagoras for an angle that is not $90^\\circ$: for an acute angle it makes $a$ shorter, for an obtuse angle ($\\cos A$ negative) it makes $a$ longer. (It can be proved by drawing a height and using Pythagoras on both halves.)'),
      h('Method'),
      steps([
        'Find the angle you know (or want) and call it $A$. The side opposite it is $a$; the other two are $b$ and $c$ (either way round).',
        '<b>Side:</b> substitute into $a^2 = b^2 + c^2 - 2bc\\cos A$, work out the right-hand side, then square root.',
        '<b>Angle:</b> substitute into $\\cos A = \\dfrac{b^2 + c^2 - a^2}{2bc}$, then use $\\cos^{-1}$.',
      ]),
      example('Example 1 – finding a side',
        'In triangle $ABC$, $b = 7$ cm, $c = 10$ cm and angle $A = 48^\\circ$. Find $a$ to 1 decimal place.',
        ['$a^2 = 7^2 + 10^2 - 2 \\times 7 \\times 10 \\times \\cos 48^\\circ$', '$a^2 = 149 - 93.678\\ldots = 55.321\\ldots$', '$a = \\sqrt{55.321\\ldots} = 7.437\\ldots$'],
        '$a = 7.4$ cm'),
      example('Example 2 – an obtuse angle',
        'Two sides of $5$ cm and $8$ cm meet at an angle of $120^\\circ$. Find the third side to 1 decimal place.',
        ['$\\cos 120^\\circ = -0.5$, so the last term is <b>added</b>: $a^2 = 25 + 64 - 2 \\times 5 \\times 8 \\times (-0.5) = 25 + 64 + 40 = 129$', '$a = \\sqrt{129} = 11.357\\ldots$'],
        '$11.4$ cm'),
      example('Example 3 – finding an angle',
        'A triangle has sides $7$ cm, $8$ cm and $10$ cm. Find the largest angle to 1 decimal place.',
        ['The largest angle is opposite the longest side, so $a = 10$, with $b = 7$ and $c = 8$.', '$\\cos A = \\dfrac{7^2 + 8^2 - 10^2}{2 \\times 7 \\times 8} = \\dfrac{13}{112} = 0.1160\\ldots$', '$A = \\cos^{-1}(0.1160\\ldots) = 83.334\\ldots^\\circ$'],
        '$83.3^\\circ$'),
      mistake('working out $b^2 + c^2 - 2bc$ first and then multiplying by $\\cos A$. Do the multiplication $2bc\\cos A$ first (BIDMAS), then subtract.'),
      mistake('forgetting the square root at the end when finding a side.'),
      note('If $\\cos A$ comes out negative, the angle is obtuse (between $90^\\circ$ and $180^\\circ$) – your calculator handles this correctly with $\\cos^{-1}$.'),
      h('What next?'),
      p('See [[trig-area-sine]] for the area of any triangle, and [[trig-sine-cosine-problems]] for deciding which rule to use in longer problems.'),
    ].join(''),
  },
  {
    id: 'trig-area-sine',
    title: 'Area of a triangle: ½ab sin C',
    skills: ['trig-area-sine'],
    prereqs: ['trig-sohcahtoa-side', 'geo-area-basic'],
    summary: 'Find the area of any triangle from two sides and the angle between them – and work backwards from an area.',
    body: [
      h('The big idea'),
      p('You know that the area of a triangle is $\\frac{1}{2} \\times \\text{base} \\times \\text{height}$ ([[geo-area-basic]]). The trouble is that the perpendicular height is often not given. If you know two sides and the angle between them, trigonometry can find the height for you.'),
      key('Area of a triangle', display('\\text{Area} = \\tfrac{1}{2}ab\\sin C') + p('where $a$ and $b$ are two sides and $C$ is the angle <b>between</b> them (the "included" angle). Any two sides work, as long as you use the angle where they meet.')),
      h('Where it comes from'),
      figure(areaFig(), 'The height $h$ from $C$ to the base $c$.'),
      p('Take $c$ as the base. In the left-hand right-angled triangle, $h$ is opposite angle $A$ and $b$ is the hypotenuse, so $\\sin A = \\frac{h}{b}$ and $h = b\\sin A$ ([[trig-sohcahtoa-side|SOH]]). So the area is $\\frac{1}{2} \\times c \\times b\\sin A = \\frac{1}{2}bc\\sin A$ – the same formula with different letters.'),
      h('Method'),
      steps(['Find two sides and the angle <b>between</b> them. If you are given other angles, use [[geo-angles-triangles|angles in a triangle]] to find the one you need.', 'Substitute into $\\frac{1}{2}ab\\sin C$.', 'To work backwards, substitute what you know and solve for the missing side or angle.']),
      example('Example 1',
        'Two sides of a triangle are $8$ cm and $11$ cm with an angle of $40^\\circ$ between them. Find the area to 1 decimal place.',
        ['Area $= \\frac{1}{2} \\times 8 \\times 11 \\times \\sin 40^\\circ = 44 \\times 0.6427\\ldots = 28.282\\ldots$'],
        '$28.3$ cm²'),
      example('Example 2 – working backwards',
        'A triangle has sides $8$ cm and $10$ cm and an area of $30$ cm². The angle $C$ between those sides is acute. Find $C$ to 1 decimal place.',
        ['$30 = \\frac{1}{2} \\times 8 \\times 10 \\times \\sin C = 40\\sin C$', '$\\sin C = \\dfrac{30}{40} = 0.75$', '$C = \\sin^{-1}(0.75) = 48.590\\ldots^\\circ$'],
        '$C = 48.6^\\circ$'),
      example('Example 3 – working backwards to a side',
        'A triangle has area $84$ cm². Two of its sides are $18$ cm and $x$ cm, with an angle of $58^\\circ$ between them. Find $x$ to 1 decimal place.',
        ['$84 = \\frac{1}{2} \\times 18 \\times x \\times \\sin 58^\\circ = 7.632\\ldots \\times x$', '$x = \\dfrac{84}{7.632\\ldots} = 11.005\\ldots$'],
        '$x = 11.0$ cm'),
      example('Example 4 – a segment of a circle',
        'A circle has radius $6$ cm. Two radii make an angle of $100^\\circ$ at the centre. Find the area of the segment cut off by the chord joining their ends, to 1 decimal place.',
        ['Sector: $\\frac{100}{360} \\times \\pi \\times 6^2 = 31.415\\ldots$ cm² (see [[geo-arcs-sectors]]).', 'Triangle (two radii and the angle between them): $\\frac{1}{2} \\times 6 \\times 6 \\times \\sin 100^\\circ = 17.726\\ldots$ cm²', 'Segment = sector − triangle $= 31.415\\ldots - 17.726\\ldots = 13.689\\ldots$'],
        '$13.7$ cm²'),
      mistake('using an angle that is not between the two sides. With sides $8$ and $11$, the angle must be where those two sides meet.'),
      mistake('forgetting the $\\frac{1}{2}$ – that gives double the area (the area of a parallelogram).'),
      note('Working backwards from an area, $\\sin C = 0.75$ also fits an obtuse angle, $180^\\circ - 48.6^\\circ = 131.4^\\circ$. Questions tell you whether the angle is acute.'),
      h('What next?'),
      p('Combine this with the sine and cosine rules in [[trig-sine-cosine-problems]].'),
    ].join(''),
  },
  {
    id: 'trig-sine-cosine-problems',
    title: 'Choosing the rule: sine, cosine or area',
    skills: ['trig-sine-cosine-problems'],
    prereqs: ['trig-sine-rule', 'trig-cosine-rule', 'trig-area-sine', 'geo-bearings'],
    summary: 'Decide which rule a triangle needs, and chain the rules together in bearings and quadrilateral problems.',
    body: [
      h('The big idea'),
      p('You now have several tools for triangles. The hard part of a long question is choosing the right one, sometimes twice in a row. Look at what you <b>know</b> and what you <b>want</b>.'),
      key('Which rule?', tbl([
        ['You know…', 'and want…', 'use'],
        ['a right angle and two sides', 'the third side', '[[trig-pythagoras|Pythagoras]]'],
        ['a right angle, a side and an angle (or two sides)', 'a side or angle', '[[trig-sohcahtoa-side|SOH CAH TOA]]'],
        ['an opposite pair (a side and the angle opposite it) plus one more', 'a side or angle', '[[trig-sine-rule|sine rule]]'],
        ['two sides and the angle between them', 'the third side', '[[trig-cosine-rule|cosine rule]]'],
        ['all three sides', 'an angle', 'cosine rule (rearranged)'],
        ['two sides and the angle between them', 'the area', '[[trig-area-sine|½ab sin C]]'],
      ])),
      h('Method for longer problems'),
      steps([
        'Draw a clear sketch and put every given length and angle on it.',
        'Find a triangle where you can use a rule straight away. Work out the length or angle it gives you and add it to the sketch (keep the full calculator value).',
        'Use that new value in the next triangle.',
        'With bearings, first find the angle <b>inside</b> the triangle: differences of bearings, angles on a straight line, and [[geo-parallel-lines|co-interior angles]] between north lines.',
      ]),
      example('Example 1 – two ships',
        'Two ships leave a harbour $H$ at the same time. Ship $A$ sails $12$ km on a bearing of $040^\\circ$; ship $B$ sails $9$ km on a bearing of $110^\\circ$. How far apart are they, to 1 decimal place?',
        ['The angle between their paths at $H$ is $110^\\circ - 40^\\circ = 70^\\circ$.', 'Two sides and the angle between them → cosine rule: $d^2 = 12^2 + 9^2 - 2 \\times 12 \\times 9 \\times \\cos 70^\\circ$', '$d^2 = 225 - 73.876\\ldots = 151.123\\ldots$, so $d = 12.293\\ldots$'],
        '$12.3$ km', { visual: shipsFig() }),
      example('Example 2 – a quadrilateral in two steps',
        'Quadrilateral $ABCD$ has $AB = 7$ cm, $AD = 9$ cm and angle $DAB = 75^\\circ$. In triangle $BCD$, angle $BCD = 60^\\circ$ and angle $CBD = 50^\\circ$. Find $CD$ to 1 decimal place.',
        ['Triangle $ABD$ has two sides and the angle between them, so use the cosine rule for the diagonal: $BD^2 = 7^2 + 9^2 - 2 \\times 7 \\times 9 \\times \\cos 75^\\circ = 130 - 32.611\\ldots = 97.388\\ldots$, so $BD = 9.868\\ldots$ cm.', 'Triangle $BCD$ now has an opposite pair: $BD$ is opposite the $60^\\circ$ angle at $C$. $CD$ is opposite the $50^\\circ$ angle at $B$.', 'Sine rule: $CD = \\dfrac{9.868\\ldots \\times \\sin 50^\\circ}{\\sin 60^\\circ} = 8.729\\ldots$'],
        '$CD = 8.7$ cm', { visual: quadFig() }),
      example('Example 3 – a journey with a turn',
        'A boat sails $8$ km from $A$ to $B$ on a bearing of $060^\\circ$, then $5$ km from $B$ to $C$ on a bearing of $170^\\circ$. How far is $C$ from $A$, to 1 decimal place?',
        ['Find the angle inside the triangle at $B$. The north lines at $A$ and $B$ are parallel, so the angle between north at $B$ and the line $BA$ is $180^\\circ - 60^\\circ = 120^\\circ$ ([[geo-parallel-lines|co-interior angles]]). The bearing of $A$ from $B$ is therefore $060^\\circ + 180^\\circ = 240^\\circ$.', 'Angle $ABC = 240^\\circ - 170^\\circ = 70^\\circ$.', 'Cosine rule: $d^2 = 8^2 + 5^2 - 2 \\times 8 \\times 5 \\times \\cos 70^\\circ = 89 - 27.361\\ldots = 61.638\\ldots$', '$d = 7.851\\ldots$'],
        '$7.9$ km', { visual: journeyFig() }),
      example('Example 4 – three sides',
        'A triangular flower bed has sides $6$ m, $9$ m and $11$ m. Find its largest angle.',
        ['No angles are known, so use the cosine rule for an angle. The largest angle is opposite the $11$ m side.', '$\\cos\\theta = \\dfrac{6^2 + 9^2 - 11^2}{2 \\times 6 \\times 9} = \\dfrac{-4}{108}$', '$\\theta = \\cos^{-1}\\left(-\\dfrac{4}{108}\\right) = 92.122\\ldots^\\circ$'],
        '$92.1^\\circ$'),
      mistake('rounding the diagonal in the middle of a two-step problem. Use the full value from your calculator in the second step, or your final answer can be off by $0.1$.'),
      note('If a triangle has a right angle, the simpler [[trig-pythagoras|Pythagoras]] or SOH CAH TOA will always do – the sine and cosine rules still work, but take longer.'),
      h('What next?'),
      p('The same thinking (sketch, find a triangle you can solve, carry the answer forward) is what you need in [[trig-3d]].'),
    ].join(''),
  },
];

void [FILL, ACCENT2];
