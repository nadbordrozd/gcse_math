// Learn pages for the Angles unit. See docs/TUTORIAL_GUIDELINES.md.
import { h, p, list, steps, key, display, note, mistake, figure, columns, example, tbl } from '../../tutorial-kit.js';
import {
  figure as fig, line, polygon, polyline, text, dot, polar, add, arcLabel, rightMark, northLine, degS, triFromAngles, place,
  parallelArrows, FILL, ACCENT, ACCENT2, labelAt, regularPoly,
} from './diagrams.js';
import { raysBody, parallelFigure, drawTriangle, regularFigure } from './angles.js';

/* ---------- diagrams ---------- */

function straightLineFig() {
  const O = [210, 160];
  return fig(420, 200, raysBody(O, 150, [0, 47, 112, 180], [
    { from: 0, to: 47, label: degS(47) }, { from: 47, to: 112, label: 'x' }, { from: 112, to: 180, label: degS(68) },
  ]), { nda: true });
}
function aroundPointFig() {
  const O = [200, 140];
  return fig(400, 280, raysBody(O, 115, [20, 140, 235, 315], [
    { from: 20, to: 140, label: degS(120) }, { from: 140, to: 235, label: degS(95) }, { from: 235, to: 315, label: degS(80) }, { from: 315, to: 380, label: 'x' },
  ]), { nda: true });
}
function vertOppFig(a = 'a', b = 'b') {
  const O = [200, 120];
  return fig(400, 240, raysBody(O, 150, [15, 70, 195, 250], [
    { from: 15, to: 70, label: a }, { from: 195, to: 250, label: a }, { from: 70, to: 195, label: b }, { from: 250, to: 375, label: b },
  ]));
}
function angleTypesFig() {
  const panel = (x0, v, name) => {
    const O = [x0 + 25, 95]; const P = polar(O, 70, 0); const Q = polar(O, v > 180 ? 45 : 70, v);
    return line(...O, ...P, { width: 2 }) + line(...O, ...Q, { width: 2 })
      + (v === 90 ? rightMark(O, P, Q, 12) : arcLabel(O, P, Q, null, { reflex: v > 180, r: 18 }))
      + text(x0 + 50, 150, name, { size: 13, bold: true });
  };
  return fig(440, 165, panel(0, 50, 'acute') + panel(110, 90, 'right') + panel(220, 130, 'obtuse') + panel(345, 250, 'reflex').replace(/translate/, ''), { maxWidth: 460 });
}
function triangleSumFig() {
  // triangle with a line through the top vertex parallel to the base: the three angles make a straight line
  const A = [80, 190]; const B = [330, 190]; const C = [190, 60];
  let body = polygon([A, B, C], { fill: FILL }) + line(40, 60, 380, 60, { width: 2, color: ACCENT });
  body += parallelArrows([260, 60], [300, 60]) + parallelArrows([230, 190], [270, 190]);
  body += arcLabel(A, B, C, 'a', { r: 30 }) + arcLabel(B, A, C, 'b', { r: 30 });
  body += arcLabel(C, A, B, 'c', { r: 22 }) + arcLabel(C, [40, 60], A, 'a', { r: 30, color: ACCENT }) + arcLabel(C, [380, 60], B, 'b', { r: 30, color: ACCENT });
  return fig(420, 220, body);
}
function zfcFig(kind) {
  // two parallel lines + transversal, highlighting a pair of angles
  const t = 62; const yP = 60; const yQ = 140; const W = 230;
  const dx = (yQ - yP) / Math.tan((t * Math.PI) / 180);
  const P = [W / 2 + dx / 2, yP]; const Q = [W / 2 - dx / 2, yQ];
  let body = line(10, yP, W - 10, yP, { width: 2 }) + line(10, yQ, W - 10, yQ, { width: 2 }) + parallelArrows([W - 60, yP], [W - 30, yP]) + parallelArrows([W - 60, yQ], [W - 30, yQ]);
  body += line(...polar(Q, 45, t + 180), ...polar(P, 45, t), { width: 2 });
  const mark = (X, a0, a1, col) => arcLabel(X, polar(X, 30, a0), polar(X, 30, a1), null, { r: 18, color: col }) + arcLabel(X, polar(X, 30, a0), polar(X, 30, a1), null, { r: 22, color: col });
  if (kind === 'Z') body += mark(P, 180, 180 + t, ACCENT) + mark(Q, 0, t, ACCENT) + polyline([[30, yP], P, Q, [W - 30, yQ]], { color: ACCENT2, width: 1.5, dash: '4 4' });
  if (kind === 'F') body += mark(P, 0, t, ACCENT) + mark(Q, 0, t, ACCENT);
  if (kind === 'C') body += mark(P, 180 + t, 360, ACCENT) + mark(Q, 0, t, ACCENT2);
  body += text(W / 2, 200, { Z: 'Alternate (Z): equal', F: 'Corresponding (F): equal', C: 'Co-interior (C): add to 180°' }[kind], { size: 13, bold: true });
  return fig(W, 210, body, { maxWidth: 240 });
}
function triParallelFig() {
  const yU = 60; const yL = 190; const R = [210, yL]; const p = 52; const q = 73;
  const P = [R[0] - (yL - yU) / Math.tan((p * Math.PI) / 180), yU]; const Q = [R[0] + (yL - yU) / Math.tan((q * Math.PI) / 180), yU];
  let body = line(20, yU, 400, yU, { width: 2 }) + line(20, yL, 400, yL, { width: 2 }) + parallelArrows([50, yU], [80, yU]) + parallelArrows([50, yL], [80, yL]);
  body += polygon([P, Q, R], { fill: FILL }) + arcLabel(P, Q, R, degS(p)) + arcLabel(R, [400, yL], Q, degS(q)) + arcLabel(R, P, Q, 'x');
  body += labelAt(P, 'P', -90, 14, { italic: true }) + labelAt(Q, 'Q', -90, 14, { italic: true }) + labelAt(R, 'R', 90, 15, { italic: true });
  return fig(420, 230, body, { nda: true });
}
function bearingFig(b, { from = 'A', to = 'B', anti = false } = {}) {
  const A = [200, 170]; const B = polar(A, 120, 90 - b);
  let body = northLine(A, 110) + line(...A, ...B, { width: 2 }) + dot(...A) + dot(...B);
  body += arcLabel(A, [A[0], A[1] - 50], B, anti ? degS(360 - b) : degS(b), { r: 26, reflex: false });
  body += labelAt(A, from, b < 180 ? 180 : 0, 14, { italic: true }) + labelAt(B, to, -60, 14, { italic: true });
  return fig(400, 300, body, { nda: true });
}
function backBearingFig() {
  const A = [110, 220]; const b = 70; const B = polar(A, 190, 90 - b);
  let body = northLine(A, 80) + northLine(B, 80) + line(...A, ...B, { width: 2 }) + dot(...A) + dot(...B);
  body += arcLabel(A, [A[0], A[1] - 40], B, degS(70), { r: 26 }) + arcLabel(B, [B[0], B[1] - 40], A, degS(250), { r: 22, reflex: true, color: ACCENT });
  body += labelAt(A, 'A', 180, 14, { italic: true }) + labelAt(B, 'B', 0, 14, { italic: true });
  return fig(420, 280, body);
}

function journeyFig() {
  const A = [90, 220]; const B = polar(A, 125, 30); const C = polar(B, 110, -60);
  let body = northLine(A, 70) + northLine(B, 70) + line(...A, ...B, { width: 2 }) + line(...B, ...C, { width: 2 }) + dot(...A) + dot(...B) + dot(...C);
  body += arcLabel(A, [A[0], A[1] - 40], B, degS(60), { r: 24 }) + arcLabel(B, [B[0], B[1] - 40], C, degS(150), { r: 22, color: ACCENT });
  body += arcLabel(B, A, C, 'x', { r: 30, color: ACCENT2 });
  body += labelAt(A, 'A', 180, 14, { italic: true }) + labelAt(B, 'B', -135, 16, { italic: true }) + labelAt(C, 'C', 0, 14, { italic: true });
  return fig(380, 300, body, { nda: true });
}
function pentagonDiagonalFig() {
  const c = [180, 130]; const V = regularPoly(5, c, 95, -126);
  let body = polygon(V, { fill: FILL }) + line(...V[0], ...V[2], { width: 2 });
  body += arcLabel(V[2], V[0], V[1], 'x', { r: 30 }) + arcLabel(V[1], V[0], V[2], degS(108), { r: 20 });
  ['A', 'B', 'C', 'D', 'E'].forEach((l, i) => { const u = [V[i][0] - c[0], V[i][1] - c[1]]; const n = Math.hypot(...u); body += text(V[i][0] + (u[0] / n) * 16, V[i][1] + (u[1] / n) * 16, l, { size: 15, italic: true }); });
  return fig(360, 260, body, { nda: true });
}

/* ---------- pages ---------- */

export const angleTutorials = [
  {
    id: 'geo-angle-basics',
    title: 'Angle facts',
    skills: ['geo-angle-basics'],
    prereqs: ['alg-solve-one-two-step', 'alg-solve-brackets-both-sides'],
    summary: 'Name types of angle and use the facts about angles on a straight line, around a point and vertically opposite.',
    body: [
      h('What is an angle?'),
      p('An angle measures an amount of <b>turn</b>. A full turn is $360^\\circ$, half a turn is $180^\\circ$ and a quarter turn – a right angle – is $90^\\circ$. Angles are named by how they compare with these:'),
      figure(angleTypesFig()),
      tbl([['Type', 'Size'], ['Acute', 'less than $90^\\circ$'], ['Right angle', 'exactly $90^\\circ$ (marked with a small square)'], ['Obtuse', 'between $90^\\circ$ and $180^\\circ$'], ['Reflex', 'between $180^\\circ$ and $360^\\circ$']]),
      h('Three facts you will use all the time'),
      key('Angle facts', list([
        '<b>Angles on a straight line</b> add up to $180^\\circ$ (half a turn).',
        '<b>Angles around a point</b> add up to $360^\\circ$ (a full turn).',
        '<b>Vertically opposite angles</b> are equal: where two straight lines cross, the angles opposite each other are the same size.',
      ])),
      p('Why are vertically opposite angles equal? In the diagram below, $a + b = 180^\\circ$ because they sit on one straight line, and the angle opposite $a$ also makes $180^\\circ$ with the same $b$. So it must equal $a$.'),
      figure(vertOppFig(), 'Opposite angles are equal; neighbouring angles add up to $180^\\circ$.'),
      h('Method'),
      steps([
        'Decide which fact applies: a straight line, a point, or two crossing lines.',
        'Add up the angles you know.',
        'Subtract from $180^\\circ$ or $360^\\circ$ (or use "equal" for vertically opposite).',
        'Give a reason in words, e.g. "angles on a straight line add up to $180^\\circ$" – exam questions often ask for one.',
      ]),
      example('Example 1 – a straight line', 'Find angle $x$.', [
        'The three angles sit on a straight line, so they add up to $180^\\circ$.',
        '$47 + 68 = 115$',
        '$x = 180 - 115 = 65$',
      ], '$x = 65^\\circ$', { visual: straightLineFig() }),
      example('Example 2 – around a point', 'Find angle $x$.', [
        'Angles around a point add up to $360^\\circ$.',
        '$120 + 95 + 80 = 295$',
        '$x = 360 - 295 = 65$',
      ], '$x = 65^\\circ$', { visual: aroundPointFig() }),
      example('Example 3 – with algebra', 'Two straight lines cross. Two vertically opposite angles are $3x + 10$ and $5x - 30$. Find $x$ and the size of the angle.', [
        'Vertically opposite angles are equal: $3x + 10 = 5x - 30$.',
        '[[alg-solve-brackets-both-sides|Collect the unknowns]] on one side: $10 + 30 = 5x - 3x$, so $40 = 2x$ and $x = 20$.',
        'The angle is $3 \\times 20 + 10 = 70^\\circ$ (check: $5 \\times 20 - 30 = 70$ ✓).',
      ], '$x = 20$, angle $= 70^\\circ$'),
      mistake('using $360^\\circ$ for angles on a straight line, or $180^\\circ$ for angles around a point. Picture it: a straight line is half a turn.'),
      note('Sense check: use the <b>type</b> of angle as a rough check – an angle that looks obtuse should come out between $90^\\circ$ and $180^\\circ$. But never measure a diagram marked "not drawn accurately": work it out from the facts.'),
      h('Estimating and measuring'),
      p('To estimate an angle that <i>is</i> drawn accurately, compare it with a right angle ($90^\\circ$) and a straight line ($180^\\circ$): is it less than a quarter turn, between a quarter and a half, or more than a half? Then refine – about a third of a right angle is $30^\\circ$, about half is $45^\\circ$.'),
      note('A protractor has two scales. Put the centre on the corner and the zero line along one arm, then read the scale that starts at $0$ on <b>that</b> arm. If your acute-looking angle reads $130^\\circ$, you used the wrong scale – the answer is $180 - 130 = 50^\\circ$.'),
      h('What next?'),
      p('Next use these facts inside shapes: [[geo-angles-triangles]], then [[geo-parallel-lines]].'),
    ].join(''),
  },
  {
    id: 'geo-angles-triangles',
    title: 'Angles in triangles and quadrilaterals',
    skills: ['geo-angles-triangles'],
    prereqs: ['geo-angle-basics', 'geo-2d-properties'],
    summary: 'Use the angle sums of triangles (180°) and quadrilaterals (360°), isosceles triangles and exterior angles.',
    body: [
      h('The big idea'),
      p('Tear the three corners off any paper triangle and put them side by side: they always make a straight line. That is the most useful fact in geometry.'),
      key('Angle sums', list([
        'The angles in a <b>triangle</b> add up to $180^\\circ$.',
        'The angles in a <b>quadrilateral</b> add up to $360^\\circ$.',
        'In an <b>isosceles</b> triangle (two equal sides, marked with dashes) the two <b>base angles</b> – the angles opposite the equal sides – are equal.',
        'An <b>exterior angle</b> of a triangle (made by extending one side) equals the sum of the two interior angles opposite it.',
      ])),
      h('Where it comes from'),
      p('Draw a line through the top corner, [[geo-parallel-lines|parallel]] to the base. The angles marked $a$ are alternate angles, so they are equal; the same for $b$. Along the top line, $a + c + b = 180^\\circ$ – so the angles of the triangle add up to $180^\\circ$.'),
      figure(triangleSumFig()),
      p('A quadrilateral can be cut along a diagonal into <b>two</b> triangles, so its angles add up to $2 \\times 180^\\circ = 360^\\circ$. The exterior angle fact follows too: the exterior angle and the interior angle next to it make $180^\\circ$ – and so do the three interior angles – so the exterior angle equals the other two interior angles added.'),
      h('Method'),
      steps([
        'Look for marks: dashes for equal sides (isosceles), a square for $90^\\circ$, arrows for parallel sides.',
        'Write down what you know, one fact at a time, each with a reason.',
        'Use $180^\\circ$ for a triangle, $360^\\circ$ for a quadrilateral.',
        'If the angles are written with $x$, add them up, set equal to $180$ or $360$ and [[alg-solve-one-two-step|solve]].',
      ]),
      example('Example 1 – third angle', 'A triangle has angles $52^\\circ$ and $71^\\circ$. Find the third angle.', [
        '$52 + 71 = 123$', '$180 - 123 = 57$',
      ], '$57^\\circ$', { visual: drawTriangle(triFromAngles(52, 71), { labels: [degS(52), degS(71), 'x'] }) }),
      example('Example 2 – isosceles', 'In triangle $ABC$, $AC = BC$ and angle $C = 40^\\circ$. Find angle $A$.', [
        '$AC = BC$, so the base angles at $A$ and $B$ are equal.',
        'They share $180 - 40 = 140^\\circ$.',
        'Each is $140 \\div 2 = 70^\\circ$.',
      ], '$70^\\circ$', { visual: drawTriangle(triFromAngles(70, 70), { labels: ['x', null, degS(40)], letters: ['A', 'B', 'C'], ticks: [[0, 2], [1, 2]] }) }),
      example('Example 3 – exterior angle', 'Side $AB$ of triangle $ABC$ is extended to $D$. Angle $A = 48^\\circ$ and angle $C = 67^\\circ$. Find the exterior angle $CBD$.', [
        'The exterior angle equals the sum of the two opposite interior angles.',
        '$48 + 67 = 115$',
        '(Check: angle $ABC = 180 - 48 - 67 = 65^\\circ$, and $180 - 65 = 115^\\circ$ ✓.)',
      ], '$115^\\circ$', { visual: drawTriangle(triFromAngles(48, 65), { labels: [degS(48), null, degS(67)], letters: ['A', 'B', 'C'], extendSide: [0, 1, 'x'] }) }),
      example('Example 4 – quadrilateral with algebra', 'The angles of a quadrilateral are $x$, $2x$, $100^\\circ$ and $80^\\circ$. Find $x$.', [
        'Angles in a quadrilateral add up to $360^\\circ$: $x + 2x + 100 + 80 = 360$.',
        '$3x + 180 = 360$, so $3x = 180$.',
        '$x = 60$ (so the angles are $60^\\circ$, $120^\\circ$, $100^\\circ$, $80^\\circ$ – they add to $360^\\circ$ ✓).',
      ], '$x = 60$'),
      mistake('in an isosceles triangle, halving the wrong angle. The two <b>equal</b> angles are at the ends of the side that is <b>not</b> marked.'),
      note('Special quadrilaterals help too: in a parallelogram opposite angles are equal and neighbouring angles add up to $180^\\circ$; a kite has one pair of equal opposite angles – the two angles where a long side meets a short side, on either side of its line of symmetry.'),
      h('What next?'),
      p('Parallel lines give more equal angles: [[geo-parallel-lines]]. Shapes with more sides: [[geo-polygon-angles]].'),
    ].join(''),
  },
  {
    id: 'geo-parallel-lines',
    title: 'Angles in parallel lines',
    skills: ['geo-parallel-lines'],
    prereqs: ['geo-angle-basics', 'geo-angles-triangles'],
    summary: 'Use alternate, corresponding and co-interior angles, with reasons.',
    body: [
      h('The big idea'),
      p('<b>Parallel</b> lines go in exactly the same direction and never meet; diagrams mark them with matching arrows. A straight line crossing them (a <i>transversal</i>) makes the same pattern of angles at each crossing – one crossing is just a slid copy of the other.'),
      columns(zfcFig('Z'), zfcFig('F'), zfcFig('C')),
      key('Parallel line facts', list([
        '<b>Alternate angles are equal.</b> They sit on opposite sides of the crossing line, between the parallel lines – look for a <b>Z</b> shape.',
        '<b>Corresponding angles are equal.</b> They are in the same position at each crossing – look for an <b>F</b> shape.',
        '<b>Co-interior angles add up to $180^\\circ$.</b> They are between the parallel lines on the same side – look for a <b>C</b> (or U) shape.',
      ])),
      p('These come straight from [[geo-angle-basics|angle facts]]: corresponding angles are equal because the two crossings are copies of each other; then alternate angles are equal because one of them is vertically opposite a corresponding angle; and co-interior angles add to $180^\\circ$ because one of them sits on a straight line with an angle equal to the other.'),
      h('Method'),
      steps([
        'Find the parallel lines (arrows) and the line crossing them.',
        'Look for a Z, F or C shape joining the angle you know to the one you want. If there is none, go via a vertically opposite angle or a straight line.',
        'Write the size <b>and</b> the reason, e.g. "$x = 65^\\circ$ (alternate angles are equal)".',
      ]),
      example('Example 1 – with reasons', 'Two parallel lines are crossed by a straight line. One angle is $65^\\circ$. Angle $x$ is alternate to it and angle $y$ is co-interior to it. Find $x$ and $y$.', [
        '$x = 65^\\circ$ because alternate angles are equal.',
        '$y = 180 - 65 = 115^\\circ$ because co-interior angles add up to $180^\\circ$.',
      ], '$x = 65^\\circ$, $y = 115^\\circ$'),
      example('Example 2 – a triangle between parallel lines', '$P$ and $Q$ lie on one line, $R$ on a parallel line. Find angle $x$.', [
        'Angle $QPR = 52^\\circ$. The angle between $RP$ and the lower line (on the left) is alternate to it, so it is also $52^\\circ$.',
        'At $R$ the three angles make a straight line: $x = 180 - 52 - 73 = 55$.',
      ], '$x = 55^\\circ$', { visual: triParallelFig() }),
      example('Example 3 – algebra', 'Two co-interior angles are $3x + 5$ and $2x + 25$. Find $x$.', [
        'Co-interior angles add up to $180^\\circ$: $3x + 5 + 2x + 25 = 180$.',
        '$5x + 30 = 180$, so $5x = 150$ and $x = 30$.',
        'Check: the angles are $95^\\circ$ and $85^\\circ$, which add to $180^\\circ$ ✓.',
      ], '$x = 30$'),
      example('Example 4 – unknowns on both sides', 'Two alternate angles are $3x - 20$ and $x + 40$. Find $x$ and the size of the angles.', [
        'Alternate angles are equal: $3x - 20 = x + 40$.',
        '[[alg-solve-brackets-both-sides|Collect the unknowns]] on one side: $3x - x = 40 + 20$, so $2x = 60$ and $x = 30$.',
        'Each angle is $3 \\times 30 - 20 = 70^\\circ$ (check: $30 + 40 = 70$ ✓).',
      ], '$x = 30$, angles $70^\\circ$'),
      mistake('saying co-interior angles are <b>equal</b>. They add up to $180^\\circ$ – one is usually acute and the other obtuse.'),
      note('In any parallel-lines diagram with one crossing line there are only two sizes of angle: all the acute ones are equal, all the obtuse ones are equal, and an acute plus an obtuse makes $180^\\circ$. Use this to check.'),
      h('What next?'),
      p('Parallel North lines are the key to [[geo-bearings]]. For many-sided shapes, see [[geo-polygon-angles]].'),
    ].join(''),
  },
  {
    id: 'geo-polygon-angles',
    title: 'Angles in polygons',
    skills: ['geo-polygon-angles'],
    prereqs: ['geo-angles-triangles', 'geo-2d-properties'],
    summary: 'Interior and exterior angles of polygons, including regular polygons and finding the number of sides.',
    body: [
      h('Interior and exterior angles'),
      p('A <b>polygon</b> is a flat shape with straight sides. An <b>interior angle</b> is inside the shape at a corner. If you extend one side, the angle between the extension and the next side is the <b>exterior angle</b>. At each corner, interior + exterior $= 180^\\circ$ (a straight line).'),
      figure(regularFigure(8, 'ext', 'e'), 'A regular octagon with one exterior angle $e$ marked.'),
      key('Polygon angle facts', list([
        'The <b>exterior</b> angles of any polygon add up to $360^\\circ$.',
        'The <b>interior</b> angles of an $n$-sided polygon add up to $(n - 2) \\times 180^\\circ$.',
        'In a <b>regular</b> polygon (all sides and angles equal): exterior angle $= 360^\\circ \\div n$, interior angle $= 180^\\circ -$ exterior angle.',
        'So the number of sides $n = 360 \\div$ exterior angle.',
      ])),
      h('Where it comes from'),
      p('Walk all the way round the edge of a polygon. At each corner you turn through the exterior angle, and by the time you are back where you started you have made one full turn – $360^\\circ$.', 'For the interior sum, pick one corner and draw diagonals to every other corner. An $n$-sided polygon splits into $n - 2$ triangles, each with $180^\\circ$. (A pentagon makes 3 triangles: $3 \\times 180 = 540^\\circ$.)'),
      h('Method'),
      steps([
        'Regular polygon? Start with the exterior angle: $360 \\div n$. Then interior $= 180 -$ exterior.',
        'Given an angle and asked for $n$? Get the exterior angle (if needed, $180 -$ interior), then $n = 360 \\div$ exterior.',
        'Irregular polygon with one missing angle? Work out the total $(n - 2) \\times 180$ and subtract the angles you know.',
      ]),
      example('Example 1', 'Find the interior angle of a regular decagon (10 sides).', [
        'Exterior angle $= 360 \\div 10 = 36^\\circ$.', 'Interior angle $= 180 - 36 = 144^\\circ$.',
        'Check with the sum: $(10 - 2) \\times 180 = 1440$, and $1440 \\div 10 = 144$ ✓.',
      ], '$144^\\circ$'),
      example('Example 2 – finding the number of sides', 'Each exterior angle of a regular polygon is $24^\\circ$. How many sides does it have?', [
        '$n = 360 \\div 24 = 15$',
      ], '15 sides'),
      example('Example 3 – a missing angle', 'A pentagon has angles $100^\\circ$, $120^\\circ$, $95^\\circ$, $110^\\circ$ and $x$. Find $x$.', [
        'Sum of interior angles $= (5 - 2) \\times 180 = 540^\\circ$.',
        'Known angles: $100 + 120 + 95 + 110 = 425$.',
        '$x = 540 - 425 = 115$',
      ], '$x = 115^\\circ$'),
      example('Example 4 – exam style', 'Each interior angle of a regular polygon is 4 times each exterior angle. How many sides does it have?', [
        'Call the exterior angle $e$. Then interior $= 4e$, and interior + exterior $= 180^\\circ$.',
        '$4e + e = 180$, so $5e = 180$ and $e = 36^\\circ$.',
        '$n = 360 \\div 36 = 10$',
      ], '10 sides'),
      example('Example 5 – a diagonal in a regular polygon', '$ABCDE$ is a regular pentagon and $AC$ is a diagonal. Find angle $x = BCA$, and angle $ACD$.', [
        'Each interior angle of a regular pentagon is $180 - 360 \\div 5 = 108^\\circ$, so angle $ABC = 108^\\circ$.',
        '$AB = BC$ (the sides are equal), so triangle $ABC$ is [[geo-angles-triangles|isosceles]]: $x = (180 - 108) \\div 2 = 36^\\circ$.',
        'Angle $ACD = 108 - 36 = 72^\\circ$.',
      ], '$x = 36^\\circ$, angle $ACD = 72^\\circ$', { visual: pentagonDiagonalFig() }),
      example('Example 6 – polygons meeting at a point', 'A square and a regular hexagon share a side. Find the angle $x$ between them at one end of the shared side.', [
        'Interior angle of the square: $90^\\circ$. Of the hexagon: $180 - 360 \\div 6 = 120^\\circ$.',
        '[[geo-angle-basics|Angles around a point]] add up to $360^\\circ$: $x = 360 - 90 - 120 = 150^\\circ$.',
      ], '$150^\\circ$'),
      mistake('dividing $360$ by $n$ and calling it the <b>interior</b> angle. $360 \\div n$ is the exterior angle; for a regular hexagon it is $60^\\circ$, but the interior angle is $120^\\circ$.'),
      note('Sense check: interior angles of regular polygons grow towards $180^\\circ$ as $n$ grows – triangle $60^\\circ$, square $90^\\circ$, pentagon $108^\\circ$, hexagon $120^\\circ$, octagon $135^\\circ$.'),
      h('What next?'),
      p('Regular polygons fitting together around a point use [[geo-angle-basics|angles around a point]]. Next unit: [[geo-bearings]].'),
    ].join(''),
  },
  {
    id: 'geo-bearings',
    title: 'Bearings',
    skills: ['geo-bearings'],
    prereqs: ['geo-angle-basics', 'geo-parallel-lines'],
    summary: 'Measure and calculate three-figure bearings, including bearings back the other way.',
    body: [
      h('What is a bearing?'),
      p('A bearing is a way of giving a direction using an angle, used by sailors, pilots and walkers. It always follows three rules.'),
      key('Bearings', list([
        'Measure from <b>North</b>.',
        'Turn <b>clockwise</b>.',
        'Write it with <b>three figures</b>: $45^\\circ$ is written $045^\\circ$.',
        'A bearing is always from $000^\\circ$ up to (but not including) $360^\\circ$. If a calculation gives more than $360^\\circ$, subtract $360^\\circ$.',
      ]) + p('"The bearing of $B$ from $A$" means: stand at $A$, face North, and turn clockwise until you face $B$.')),
      tbl([['Direction', 'N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'], ['Bearing', '$000^\\circ$', '$045^\\circ$', '$090^\\circ$', '$135^\\circ$', '$180^\\circ$', '$225^\\circ$', '$270^\\circ$', '$315^\\circ$']]),
      h('Reading a bearing from a diagram'),
      p('If the angle is marked clockwise from North, that <i>is</i> the bearing. If the marked angle goes <b>anticlockwise</b> from North, subtract it from $360^\\circ$.'),
      columns(bearingFig(130), bearingFig(320, { anti: true })),
      p('Left: the bearing of $B$ from $A$ is $130^\\circ$. Right: the angle shown is $40^\\circ$ anticlockwise, so the bearing is $360 - 40 = 320^\\circ$.'),
      h('Bearings back the other way'),
      p('The North lines at $A$ and $B$ are [[geo-parallel-lines|parallel]], so the bearing back from $B$ to $A$ differs by exactly $180^\\circ$: add $180^\\circ$ if the first bearing is less than $180^\\circ$, otherwise subtract $180^\\circ$.'),
      figure(backBearingFig(), 'Bearing of $B$ from $A$ is $070^\\circ$; bearing of $A$ from $B$ is $250^\\circ$.'),
      h('Method'),
      steps([
        'Draw (or find) a North line at the point you are measuring <b>from</b>.',
        'Measure or work out the clockwise angle from North to the line towards the other point.',
        'For problems, use angle facts: parallel North lines (co-interior and alternate angles), angles around a point, and triangles.',
        'Write the answer with three figures.',
      ]),
      example('Example 1 – back bearing', 'The bearing of $B$ from $A$ is $070^\\circ$. Find the bearing of $A$ from $B$.', [
        '$70$ is less than $180$, so add $180$: $70 + 180 = 250$.',
      ], '$250^\\circ$'),
      example('Example 2 – back bearing over 180°', 'The bearing of $Q$ from $P$ is $300^\\circ$. Find the bearing of $P$ from $Q$.', [
        '$300$ is more than $180$, so subtract: $300 - 180 = 120$.',
      ], '$120^\\circ$'),
      example('Example 3 – an angle in a journey', 'A ship sails from $A$ to $B$ on a bearing of $060^\\circ$, then from $B$ to $C$ on a bearing of $150^\\circ$. Find angle $ABC$, marked $x$.', [
        'Stand at $B$. The bearing of $A$ from $B$ is the back bearing: $60 + 180 = 240^\\circ$.',
        'Both bearings from $B$ are measured clockwise from the same North line, so the angle between the directions to $A$ and to $C$ is the difference: $240 - 150 = 90^\\circ$.',
        'If the difference ever comes out more than $180^\\circ$, the angle inside the triangle is $360^\\circ$ minus it. For example, bearings of $240^\\circ$ and $030^\\circ$ from $B$ differ by $210^\\circ$, so the angle between them is $360 - 210 = 150^\\circ$.',
      ], '$x = 90^\\circ$', { visual: journeyFig() }),
      example('Example 4 – using a triangle', '$B$ is $6$ km due South of $A$ and $6$ km due West of $C$. Work out the bearing of $A$ from $C$.', [
        'Sketch it: from $B$, $A$ is straight up (North) and $C$ is straight to the right (East). Triangle $ABC$ has a right angle at $B$ and two equal sides, so its other angles are $45^\\circ$ each.',
        'From $C$, $A$ is as far North as it is West: exactly North-West.',
        'North-West is $360 - 45 = 315^\\circ$.',
      ], '$315^\\circ$'),
      mistake('measuring anticlockwise, or from the wrong point. "From $A$" means the North line and the protractor go at $A$.'),
      note('Sense check with compass directions: a bearing between $090^\\circ$ and $180^\\circ$ points South-East-ish; between $180^\\circ$ and $270^\\circ$ South-West-ish.'),
      h('What next?'),
      p('Bearing problems with distances use [[trig-pythagoras]] and [[trig-sohcahtoa-angle]], and sometimes [[trig-sine-rule]] or [[trig-cosine-rule]].'),
    ].join(''),
  },
];

void [place, add, ACCENT2];
