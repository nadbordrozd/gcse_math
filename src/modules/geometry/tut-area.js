// Learn pages for the Perimeter and area unit. See docs/TUTORIAL_GUIDELINES.md.
import { h, p, list, steps, key, display, note, mistake, figure, columns, example, tbl } from '../../tutorial-kit.js';
import {
  svg, figure as fig, line, polygon, path, text, dot, circle, place, polar, mid, centroid, rightMark, heightLabel, htext,
  dimLabel, FILL, SHADE, ACCENT, ACCENT2, MUTED,
} from './diagrams.js';
import { edgeLabels, circleFig, sectorFig } from './area.js';

/* ---------- diagrams ---------- */

const L_SHAPE = [[0, 0], [10, 0], [10, 5], [6, 5], [6, 8], [0, 8]];
function lShapeFig(labels, { split = false } = {}) {
  const pl = place(L_SHAPE, { width: 380, height: 250, pad: 50 });
  let body = polygon(L_SHAPE.map(pl.map), { fill: FILL }) + edgeLabels(L_SHAPE, pl.map, labels);
  if (split) body += line(...pl.map([6, 0]), ...pl.map([6, 5]), { width: 1.5, dash: '5 4' }) + text(...pl.map([3, 4]), 'A', { size: 16, bold: true }) + text(...pl.map([8, 2.5]), 'B', { size: 16, bold: true });
  return fig(380, 250, body, { nda: true });
}
function triangleHalfFig() {
  const W = 360; const H = 190;
  const R = [[40, 160], [200, 160], [200, 40], [40, 40]];
  let body = polygon(R, { fill: 'none', width: 1.5, dash: '5 4' }) + polygon([R[0], R[1], [120, 40]], { fill: FILL });
  body += line(120, 40, 120, 160, { width: 1.4, dash: '4 4', color: ACCENT }) + rightMark([120, 160], [120, 40], [200, 160], 9);
  body += text(120, 178, 'base', { size: 13 }) + text(132, 100, 'h', { size: 15, italic: true, color: ACCENT });
  body += text(290, 90, 'The triangle is', { size: 13 }) + text(290, 108, 'half the rectangle', { size: 13 });
  return fig(W, H, body);
}
function parallelogramCutFig() {
  const W = 400; const H = 180;
  const P = [[40, 150], [220, 150], [280, 50], [100, 50]];
  let body = polygon(P, { fill: FILL }) + polygon([[40, 150], [100, 150], [100, 50]], { fill: SHADE }) + line(100, 50, 100, 150, { width: 1.4, dash: '4 4', color: ACCENT });
  body += polygon([[220, 150], [280, 150], [280, 50]], { fill: SHADE, dash: '4 4', width: 1.4 }) + rightMark([100, 150], [100, 50], [220, 150], 9);
  body += path('M 75 160 Q 170 195 250 160', { width: 1.4, color: MUTED }) + text(170, 30, 'cut off the triangle and slide it across → a rectangle', { size: 12 });
  body += text(160, 168, 'base', { size: 13 }) + text(128, 100, 'height', { size: 13, color: ACCENT });
  return fig(W, H + 20, body);
}
function trapeziumCopyFig() {
  // trapezium (bottom b, top a, offset o) plus a half-turned copy sharing its right side: together a parallelogram
  const a = 70; const b = 130; const hh = 80; const o = 25; const x0 = 20; const y0 = 140;
  const T1 = [[x0, y0], [x0 + b, y0], [x0 + o + a, y0 - hh], [x0 + o, y0 - hh]];
  const T2 = [[x0 + b, y0], [x0 + b + a, y0], [x0 + o + a + b, y0 - hh], [x0 + o + a, y0 - hh]];
  let body = polygon(T1, { fill: FILL }) + polygon(T2, { fill: SHADE });
  const lab = (x, y, t) => text(x, y, t, { size: 14, italic: true });
  body += lab(x0 + b / 2, y0 + 16, 'b') + lab(x0 + o + a / 2, y0 - hh - 12, 'a') + lab(x0 + b + a / 2, y0 + 16, 'a') + lab(x0 + o + a + b / 2, y0 - hh - 12, 'b');
  body += line(x0 + o, y0, x0 + o, y0 - hh, { width: 1.2, dash: '4 4', color: ACCENT }) + text(x0 + o + 10, y0 - hh / 2, 'h', { size: 14, italic: true, color: ACCENT });
  return fig(380, 170, body);
}
function trapeziumFig() {
  const pts = [[0, 0], [10, 0], [8, 5], [2, 5]];
  const pl = place(pts, { width: 360, height: 200, pad: 40 });
  const V = pts.map(pl.map); const top = pl.map([5, 5]); const F = pl.map([5, 0]);
  return fig(360, 200, polygon(V, { fill: FILL }) + line(...top, ...F, { width: 1.4, dash: '5 4' }) + rightMark(F, top, V[1], 9) + dimLabel(V[0], V[1], '10 cm', centroid(V)) + dimLabel(V[2], V[3], '6 cm', centroid(V)) + heightLabel(top, F, '5 cm', V), { nda: true });
}
function triangleExampleFig() {
  const pts = [[0, 0], [10, 0], [3.6, 6]];
  const pl = place(pts, { width: 360, height: 220, pad: 40 });
  const V = pts.map(pl.map); const F = pl.map([3.6, 0]);
  return fig(360, 220, polygon(V, { fill: FILL }) + line(...V[2], ...F, { width: 1.4, dash: '5 4' }) + rightMark(F, V[2], V[1], 9)
    + dimLabel(V[0], V[1], '10 cm', V[2]) + dimLabel(V[0], V[2], '7 cm', V[1]) + heightLabel(V[2], F, '6 cm', V), { nda: true });
}
function houseFig() {
  const pts = [[0, 0], [8, 0], [8, 5], [4, 8], [0, 5]];
  const pl = place(pts, { width: 340, height: 250, pad: 40 });
  const V = pts.map(pl.map); const foot = pl.map([4, 5]);
  return fig(340, 250, polygon(V, { fill: FILL }) + line(...V[4], ...V[2], { width: 1.4, dash: '5 4' }) + line(...V[3], ...foot, { width: 1.2, dash: '3 3', color: MUTED })
    + dimLabel(V[0], V[1], '8 cm', centroid(V)) + dimLabel(V[0], V[4], '5 cm', centroid(V)) + heightLabel(V[3], foot, '3 cm', [V[4], V[2], V[3]], { size: 13 })
    + rightMark(V[0], V[1], V[4], 10) + rightMark(V[1], V[2], V[0], 10), { nda: true });
}
function circlePartsFig() {
  const c = [130, 120]; const R = 90;
  let body = circle(...c, R, { width: 2 }) + dot(...c, 3);
  const r1 = polar(c, R, 150); body += line(...c, ...r1, { color: ACCENT, width: 2.4 }) + htext(...mid(c, r1).map((v, i) => v + (i ? -10 : 0)), 'radius', { size: 12, color: ACCENT });
  const d1 = polar(c, R, 200); const d2 = polar(c, R, 20); body += line(...d1, ...d2, { color: ACCENT2, width: 2.4 }) + htext(c[0] + 38, c[1] - 2, 'diameter', { size: 12, color: ACCENT2 });
  const ch1 = polar(c, R, 250); const ch2 = polar(c, R, 320); body += line(...ch1, ...ch2, { width: 2.4 }) + htext(...mid(ch1, ch2).map((v, i) => v + (i ? -12 : 0)), 'chord', { size: 12 });
  const T = polar(c, R, 70); const u = [Math.cos((70 * Math.PI) / 180), -Math.sin((70 * Math.PI) / 180)]; const tv = [-u[1], u[0]];
  body += line(T[0] - tv[0] * 70, T[1] - tv[1] * 70, T[0] + tv[0] * 70, T[1] + tv[1] * 70, { width: 2.4, color: MUTED }) + text(T[0] + 64, T[1] - 2, 'tangent', { size: 12 });
  body += text(...polar(c, R + 18, -62), 'circumference', { size: 12 });
  // second circle: sector and segment
  const c2 = [370, 120];
  const s1 = polar(c2, R, 100); const s2 = polar(c2, R, 30);
  let body2 = path(`M ${c2[0]} ${c2[1]} L ${s1[0]} ${s1[1]} A ${R} ${R} 0 0 1 ${s2[0]} ${s2[1]} Z`, { fill: FILL, width: 2 });
  const g1 = polar(c2, R, 200); const g2 = polar(c2, R, 300);
  body2 += path(`M ${g1[0]} ${g1[1]} A ${R} ${R} 0 0 0 ${g2[0]} ${g2[1]} Z`, { fill: SHADE, width: 2 }) + circle(...c2, R, { width: 2 }) + dot(...c2, 3);
  body2 += text(c2[0] + 30, c2[1] - 45, 'sector', { size: 12, bold: true }) + text(c2[0] - 30, c2[1] + 70, 'segment', { size: 12, bold: true });
  body2 += path(`M ${polar(c2, R + 6, 130)[0]} ${polar(c2, R + 6, 130)[1]} A ${R + 6} ${R + 6} 0 0 1 ${polar(c2, R + 6, 110)[0]} ${polar(c2, R + 6, 110)[1]}`, { color: ACCENT, width: 3 }) + text(...polar(c2, R + 22, 122), 'arc', { size: 12, color: ACCENT });
  return svg(480, 240, body + body2, { maxWidth: 480, label: 'Parts of a circle' });
}
function circleAreaWhyFig() {
  // 8 slices of a circle laid top-to-tail: a near-rectangle pi*r long and r high
  const n = 8; const R = 60; const w = (2 * Math.PI * R) / n; const x0 = 30; const yb = 150;
  let body = '';
  for (let i = 0; i < n; i += 1) {
    const x = x0 + (i * w) / 2;
    const tri = i % 2 === 0 ? [[x, yb], [x + w, yb], [x + w / 2, yb - R]] : [[x, yb - R], [x + w, yb - R], [x + w / 2, yb]];
    body += polygon(tri, { fill: i % 2 ? SHADE : FILL, width: 1.4 });
  }
  const len = ((n + 1) * w) / 2;
  body += text(x0 + len / 2, yb + 18, 'about half the circumference = πr', { size: 13 }) + text(x0 - 12, yb - R / 2, 'r', { size: 14, italic: true });
  return fig(340, 190, body);
}

/* ---------- pages ---------- */

export const areaTutorials = [
  {
    id: 'geo-perimeter',
    title: 'Perimeter',
    skills: ['geo-perimeter'],
    prereqs: ['num-written-methods', 'geo-2d-properties'],
    summary: 'Find the perimeter of rectangles, triangles and compound shapes, including missing sides.',
    body: [
      h('The big idea'),
      p('The <b>perimeter</b> is the total distance all the way round the outside of a shape – like the length of fence needed to go round a field. It is a length, so it is measured in cm, m and so on.'),
      key('Perimeter', p('Perimeter = the sum of all the side lengths.') + display('\\text{rectangle: } P = 2 \\times (\\text{length} + \\text{width})')),
      h('Compound shapes and missing sides'),
      p('A compound shape is made of rectangles (and sometimes triangles). Often some sides are not labelled: work them out first. In an L-shape, the horizontal sides on top add up to the bottom side, and the vertical sides on the right add up to the left side.'),
      steps(['Mark every side. Find the missing ones by adding or subtracting the sides opposite them.', 'Go round the shape from one corner, adding every side once – tick them off as you go.', 'Include the units.']),
      example('Example 1 – an L-shape', 'All corners are right angles. Find the perimeter.', [
        'Missing horizontal side: $10 - 6 = 4$ cm. Missing vertical side: $8 - 5 = 3$ cm.',
        'Add all six sides: $10 + 5 + 4 + 3 + 6 + 8 = 36$ cm.',
        'Shortcut: this L-shape has the same perimeter as the full $10 \\times 8$ rectangle: $2 \\times (10 + 8) = 36$ ✓.',
      ], '$36$ cm', { visual: lShapeFig(['10 cm', '5 cm', null, null, '6 cm', '8 cm']) }),
      example('Example 2 – working backwards', 'An isosceles triangle has perimeter $31$ cm. Its base is $9$ cm. How long is each of the equal sides?', [
        'The two equal sides add up to $31 - 9 = 22$ cm.', 'Each one is $22 \\div 2 = 11$ cm.',
      ], '$11$ cm'),
      example('Example 3 – with algebra', 'A rectangle has length $(2x + 1)$ cm and width $(x + 3)$ cm. Its perimeter is $32$ cm. Find $x$.', [
        '$2 \\times (2x + 1 + x + 3) = 32$, so $2(3x + 4) = 32$.',
        'Divide by 2: $3x + 4 = 16$, so $3x = 12$ and $x = 4$.',
        'Check: sides $9$ and $7$, perimeter $2 \\times 16 = 32$ ✓.',
      ], '$x = 4$'),
      mistake('adding only the sides that have numbers on them. Every side counts, labelled or not.'),
      note('On a grid, count the unit edges around the outside, not the squares inside (that would be the area).'),
      h('What next?'),
      p('The space inside a shape is its area: [[geo-area-basic]]. The perimeter of a circle has a special name: [[geo-circles|circumference]].'),
    ].join(''),
  },
  {
    id: 'geo-area-basic',
    title: 'Area of rectangles, triangles and parallelograms',
    skills: ['geo-area-basic'],
    prereqs: ['geo-perimeter', 'num-written-methods'],
    summary: 'Use the area formulae for rectangles, triangles and parallelograms, and work backwards from an area.',
    body: [
      h('The big idea'),
      p('<b>Area</b> measures the space inside a flat shape: how many unit squares cover it. A square $1$ cm by $1$ cm has area $1$ cm² ("square centimetre"). A $4$ cm by $3$ cm rectangle holds $3$ rows of $4$ squares: $12$ cm².'),
      key('Area formulae', list([
        'Rectangle: $A = \\text{length} \\times \\text{width}$',
        'Triangle: $A = \\frac{1}{2} \\times \\text{base} \\times \\text{height}$',
        'Parallelogram: $A = \\text{base} \\times \\text{height}$',
      ]) + p('The <b>height</b> is always the <b>perpendicular</b> height – measured at right angles to the base, not along a sloping side.')),
      h('Where the formulae come from'),
      columns(figure(triangleHalfFig()), figure(parallelogramCutFig())),
      p('A triangle fits exactly into half of a rectangle with the same base and height – so its area is half of base × height. A parallelogram can be cut and rearranged into a rectangle with the same base and height, so no halving.'),
      h('Method'),
      steps(['Pick the formula for the shape.', 'Find the base and the <b>perpendicular</b> height (look for the right-angle mark). Ignore sloping sides.', 'Put both lengths in the same units, then multiply (and halve for a triangle).', 'Units are squared: cm², m².']),
      example('Example 1 – rectangle', 'Find the area of a rectangle $7$ cm by $4.5$ cm.', ['$7 \\times 4.5 = 31.5$'], '$31.5$ cm²'),
      example('Example 2 – triangle', 'Find the area of the triangle.', [
        'Base $10$ cm, perpendicular height $6$ cm. The $7$ cm sloping side is not needed.',
        '$\\frac{1}{2} \\times 10 \\times 6 = 30$',
      ], '$30$ cm²', { visual: triangleExampleFig() }),
      example('Example 3 – working backwards', 'A triangle has area $24$ cm² and base $8$ cm. Find its height.', [
        '$\\frac{1}{2} \\times 8 \\times h = 24$, so $4h = 24$.', '$h = 6$',
      ], '$6$ cm'),
      mistake('forgetting to halve for a triangle, or using the sloping side instead of the perpendicular height.'),
      note('Mixed units: $1$ m $= 100$ cm, but $1$ m² $= 100 \\times 100 = 10\\,000$ cm². Convert the lengths <b>before</b> multiplying.'),
      h('What next?'),
      p('Trapezia and shapes built from several pieces: [[geo-area-trapezium-compound]].'),
    ].join(''),
  },
  {
    id: 'geo-area-trapezium-compound',
    title: 'Trapezia and compound shapes',
    skills: ['geo-area-trapezium-compound'],
    prereqs: ['geo-area-basic'],
    summary: 'Find the area of a trapezium and of shapes made from rectangles and triangles.',
    body: [
      h('Area of a trapezium'),
      p('A <b>trapezium</b> has one pair of parallel sides, usually called $a$ and $b$, a distance $h$ apart.'),
      key('Trapezium', display('A = \\frac{1}{2}(a + b)h')),
      p('Where it comes from: take two copies of the trapezium and turn one upside down. Together they make a [[geo-area-basic|parallelogram]] with base $a + b$ and height $h$, so one trapezium is half of $(a + b)h$.'),
      figure(trapeziumCopyFig()),
      example('Example 1', 'Find the area of the trapezium.', [
        'Parallel sides $a = 6$ and $b = 10$, height $h = 5$.', '$\\frac{1}{2} \\times (6 + 10) \\times 5 = \\frac{1}{2} \\times 16 \\times 5 = 40$',
      ], '$40$ cm²', { visual: trapeziumFig() }),
      h('Compound shapes'),
      p('Break the shape into rectangles and triangles you know, find each area and add them – or take a small shape away from a big one.'),
      steps(['Split the shape (draw the dashed lines), or see it as a big rectangle with a piece missing.', 'Find any missing lengths.', 'Work out each area, then add (or subtract).']),
      example('Example 2 – adding or subtracting', 'Find the area of the L-shape.', [
        'Method 1, split: rectangle A is $6 \\times 8 = 48$, rectangle B is $4 \\times 5 = 20$. Total $48 + 20 = 68$.',
        'Method 2, subtract: the full $10 \\times 8$ rectangle is $80$; the missing corner is $4 \\times 3 = 12$; $80 - 12 = 68$ ✓.',
      ], '$68$ cm²', { visual: lShapeFig(['10 cm', '5 cm', null, null, '6 cm', '8 cm'], { split: true }) }),
      example('Example 3 – rectangle plus triangle', 'Find the area of the shape.', [
        'Rectangle: $8 \\times 5 = 40$.', 'Triangle: $\\frac{1}{2} \\times 8 \\times 3 = 12$.', 'Total: $40 + 12 = 52$.',
      ], '$52$ cm²', { visual: houseFig() }),
      example('Example 4 – a shaded area', 'A garden is a $12$ m by $9$ m rectangle with a $5$ m by $4$ m pond. The rest is grass. Find the area of grass.', [
        'Garden: $12 \\times 9 = 108$ m². Pond: $5 \\times 4 = 20$ m².', 'Grass: $108 - 20 = 88$ m².',
      ], '$88$ m²'),
      mistake('in a trapezium, multiplying all three numbers together, or adding the sloping sides. Only the two <b>parallel</b> sides go in the bracket.'),
      h('What next?'),
      p('Curved shapes: [[geo-circles]]. Extending flat shapes into prisms: [[geo-volume-prism]].'),
    ].join(''),
  },
  {
    id: 'geo-circles',
    title: 'Circumference and area of circles',
    skills: ['geo-circles'],
    prereqs: ['geo-area-basic', 'num-calculator'],
    summary: 'Name the parts of a circle and find circumferences and areas, including semicircles and answers in terms of π.',
    body: [
      h('Parts of a circle'),
      figure(circlePartsFig()),
      list([
        'The <b>radius</b> $r$ goes from the centre to the edge. The <b>diameter</b> $d$ goes right across through the centre: $d = 2r$.',
        'The <b>circumference</b> is the distance all the way round – the circle’s perimeter.',
        'A <b>chord</b> joins two points on the circle; a <b>tangent</b> touches it at one point; an <b>arc</b> is part of the circumference.',
        'A <b>sector</b> is a slice between two radii (like pizza); a <b>segment</b> is the piece cut off by a chord.',
      ]),
      h('The number π'),
      p('For every circle, circumference ÷ diameter is the same number, called $\\pi$ ("pi") $= 3.14159\\ldots$. It never ends, so we use the $\\pi$ button on a calculator, or leave the answer "in terms of $\\pi$", like $10\\pi$.'),
      key('Circle formulae', display('C = \\pi d = 2\\pi r \\qquad A = \\pi r^2')),
      p('Why $\\pi r^2$? Cut a circle into thin slices and lay them top-to-tail. They make a shape close to a rectangle: its length is half the circumference ($\\pi r$) and its height is $r$. So the area is $\\pi r \\times r = \\pi r^2$.'),
      figure(circleAreaWhyFig()),
      h('Method'),
      steps(['Find the radius (halve the diameter if needed).', 'Choose: round the edge → $C = 2\\pi r$; space inside → $A = \\pi r^2$ (square the radius first).', 'Give the answer in terms of $\\pi$ if asked, otherwise use the $\\pi$ button and round at the end.']),
      example('Example 1', 'A circle has radius $5$ cm. Find its circumference and area to 1 decimal place.', [
        '$C = 2 \\times \\pi \\times 5 = 10\\pi = 31.415\\ldots$',
        '$A = \\pi \\times 5^2 = 25\\pi = 78.539\\ldots$',
      ], '$C = 31.4$ cm, $A = 78.5$ cm²', { visual: circleFig(5, '5 cm', { mode: 'radius', ang: 25 }) }),
      example('Example 2 – diameter given, in terms of π', 'A circle has diameter $12$ cm. Find its area in terms of $\\pi$.', [
        'Radius $= 12 \\div 2 = 6$ cm.', '$A = \\pi \\times 6^2 = 36\\pi$',
      ], '$36\\pi$ cm²'),
      example('Example 3 – a semicircle', 'A semicircle has radius $6$ cm. Find its perimeter and area to 1 decimal place.', [
        'Curved edge: half of $2\\pi \\times 6$, which is $6\\pi = 18.849\\ldots$ cm.',
        'The perimeter also includes the straight diameter: $18.849\\ldots + 12 = 30.849\\ldots$',
        'Area: half of $\\pi \\times 6^2$, which is $18\\pi = 56.548\\ldots$',
      ], 'perimeter $30.8$ cm, area $56.5$ cm²'),
      example('Example 4 – working backwards', 'A circle has circumference $50$ cm. Find its radius to 1 decimal place.', [
        '$2\\pi r = 50$, so $r = \\dfrac{50}{2\\pi} = 7.957\\ldots$',
      ], '$8.0$ cm'),
      mistake('using the diameter in $\\pi r^2$. With $d = 12$, $\\pi \\times 12^2 = 144\\pi$ – four times too big.'),
      note('Sense check: the circumference is a bit more than 3 diameters; the area is a bit more than 3 times $r^2$.'),
      h('What next?'),
      p('Parts of a circle: [[geo-arcs-sectors]]. Cylinders: [[geo-volume-prism]]. Circle facts and theorems: [[trig-circle-theorems]].'),
    ].join(''),
  },
  {
    id: 'geo-arcs-sectors',
    title: 'Arcs and sectors',
    skills: ['geo-arcs-sectors'],
    prereqs: ['geo-circles', 'num-fraction-of-amount'],
    summary: 'Find arc lengths, sector areas and sector perimeters, and work backwards to an angle or radius.',
    body: [
      h('A fraction of a circle'),
      p('A sector with angle $\\theta$ at the centre is the fraction $\\dfrac{\\theta}{360}$ of the whole circle. So its arc is that fraction of the [[geo-circles|circumference]], and its area is that fraction of the circle’s area.'),
      key('Sector formulae', display('\\text{arc length} = \\frac{\\theta}{360} \\times 2\\pi r \\qquad \\text{sector area} = \\frac{\\theta}{360} \\times \\pi r^2') + p('Perimeter of a sector = arc length + $2r$ (the two straight radii).')),
      figure(sectorFig(9, 80, { rLabel: '9 cm', thetaLabel: '80°', rot: 20, arcHL: true }), 'A sector with radius $9$ cm and angle $80^\\circ$.'),
      h('Method'),
      steps(['Write the fraction $\\dfrac{\\theta}{360}$ and simplify it if you can.', 'Multiply by $2\\pi r$ (arc) or $\\pi r^2$ (area).', 'For the perimeter, add the two radii.', 'Working backwards: find the full-circle value, then fraction = part ÷ whole, then angle = fraction × 360.']),
      example('Example 1 – arc and area', 'For the sector above, find the arc length and the area to 1 decimal place.', [
        'Fraction $= \\dfrac{80}{360} = \\dfrac{2}{9}$.',
        'Arc $= \\dfrac{2}{9} \\times 2 \\times \\pi \\times 9 = 4\\pi = 12.566\\ldots$',
        'Area $= \\dfrac{2}{9} \\times \\pi \\times 9^2 = 18\\pi = 56.548\\ldots$',
      ], 'arc $12.6$ cm, area $56.5$ cm²'),
      example('Example 2 – perimeter', 'Find the perimeter of the same sector.', [
        'Arc $= 4\\pi$ cm, plus two radii: $4\\pi + 18 = 30.566\\ldots$',
      ], '$30.6$ cm (or exactly $4\\pi + 18$ cm)'),
      example('Example 3 – finding the angle', 'A sector of a circle with radius $6$ cm has area $15\\pi$ cm². Find its angle.', [
        'The whole circle has area $\\pi \\times 6^2 = 36\\pi$.', 'Fraction of the circle $= \\dfrac{15\\pi}{36\\pi} = \\dfrac{5}{12}$.', 'Angle $= \\dfrac{5}{12} \\times 360 = 150^\\circ$.',
      ], '$150^\\circ$'),
      mistake('forgetting the two radii in a perimeter, or mixing up the arc (a length, using $2\\pi r$) with the area (using $\\pi r^2$).'),
      note('Sense check: a $90^\\circ$ sector is a quarter of the circle, $180^\\circ$ is a half – compare your answer with the full circle.'),
      h('What next?'),
      p('Sector questions sometimes need the area of a triangle using sine: [[trig-area-sine]]. Curved solids: [[geo-cones-spheres]].'),
    ].join(''),
  },
];

void [tbl, ACCENT2];
