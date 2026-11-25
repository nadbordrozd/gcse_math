// Learn pages for the Properties of shapes unit. See docs/TUTORIAL_GUIDELINES.md.
import { h, p, list, steps, key, display, note, mistake, figure, columns, example, tbl } from '../../tutorial-kit.js';
import {
  svg, figure as fig, line, polygon, text, dot, circle, place, equalTicks, parallelArrows, rightMark, htext,
  squareGrid, FILL, ACCENT, ACCENT2, MUTED,
} from './diagrams.js';
import { QUAD_DRAW, plan, frontElev, sideElev, drawCells, lociPanel, constructionPanel, drawNet } from './shapes.js';
import { polyhedronFig, regularPrism, regularPyramid, isoStack } from './solids.js';
import { gridFig } from './transform.js';

/* ---------- diagrams ---------- */

function quadPanel(name, x0, y0, w, hh) {
  const s = QUAD_DRAW[name];
  const pl = place(s.pts, { width: w, height: hh - 18, pad: 14 });
  const V = s.pts.map(pl.map).map(([x, y]) => [x + x0, y + y0]);
  let out = polygon(V, { fill: FILL, width: 1.8 });
  const both = (i, j) => (s.arrows || []).some((pr) => pr.some(([a, b]) => (a === i && b === j) || (a === j && b === i)));
  const tk = (i, j, n) => equalTicks(V[i], both(i, j) ? [V[i][0] + (V[j][0] - V[i][0]) * 0.6, V[i][1] + (V[j][1] - V[i][1]) * 0.6] : V[j], n, 5);
  for (const [i, j] of s.ticks || []) out += tk(i, j, 1);
  (s.ticks2 || []).forEach((pair, k) => { for (const [i, j] of pair) out += tk(i, j, k + 1); });
  (s.arrows || []).forEach((pair, k) => { for (const [i, j] of pair) out += parallelArrows(V[i], V[j], k + 1, 5); });
  for (const i of s.rights || []) out += rightMark(V[i], V[(i + 1) % V.length], V[(i + V.length - 1) % V.length], 8);
  return out + text(x0 + w / 2, y0 + hh - 6, name, { size: 13, bold: true });
}
function quadFamily() {
  const names = ['Square', 'Rectangle', 'Rhombus', 'Parallelogram', 'Kite', 'Trapezium'];
  return svg(480, 260, names.map((n, i) => quadPanel(n, (i % 3) * 160, Math.floor(i / 3) * 130, 150, 125)).join(''), { maxWidth: 480, label: 'Special quadrilaterals' });
}
function symmetryFig() {
  const panel = (x0, pts, lines) => {
    const pl = place(pts, { width: 150, height: 140, pad: 22 });
    const V = pts.map(pl.map).map(([x, y]) => [x + x0, y]);
    let out = polygon(V, { fill: FILL, width: 2 });
    for (const [a, b] of lines) { const A = pl.map(a); const B = pl.map(b); out += line(A[0] + x0, A[1], B[0] + x0, B[1], { color: ACCENT2, width: 2, dash: '6 4' }); }
    return out;
  };
  const rect = [[0, 0], [4, 0], [4, 2], [0, 2]];
  const para = [[0, 0], [3, 0], [4, 2], [1, 2]];
  const hex = Array.from({ length: 6 }, (_, i) => [Math.cos((Math.PI * i) / 3), Math.sin((Math.PI * i) / 3)]);
  const hexLines = [0, 1, 2].map((i) => [hex[i], hex[i + 3]]).concat([0, 1, 2].map((i) => [[(hex[i][0] + hex[i + 1][0]) / 2, (hex[i][1] + hex[i + 1][1]) / 2], [-(hex[i][0] + hex[i + 1][0]) / 2, -(hex[i][1] + hex[i + 1][1]) / 2]]));
  let body = panel(0, rect, [[[2, -0.4], [2, 2.4]], [[-0.4, 1], [4.4, 1]]]) + panel(160, para, []) + panel(320, hex, hexLines);
  body += text(75, 150, 'Rectangle: 2 lines', { size: 12 }) + text(235, 150, 'Parallelogram: 0 lines', { size: 12 }) + text(395, 150, 'Regular hexagon: 6', { size: 12 });
  return svg(470, 160, body, { maxWidth: 470, label: 'Lines of symmetry' });
}
function stackFig() {
  const st = isoStack([[2, 1, 1], [1, 1, 0]], { W: 320, H: 220, arrowFront: true, arrowSide: true });
  return svg(st.width, st.height, st.body, { maxWidth: 320, label: 'Solid made of cubes' });
}
function viewsFig() {
  const hts = [[2, 1, 1], [1, 1, 0]];
  const views = [['Plan', plan(hts)], ['Front elevation', frontElev(hts)], ['Side elevation', sideElev(hts)]];
  return svg(450, 150, views.map(([nm, cells], i) => text(i * 150 + 70, 12, nm, { size: 13, bold: true }) + drawCells(cells, i * 150, 22, 140, 120, 28)).join(''), { maxWidth: 450, label: 'Plan and elevations' });
}
function lociFamily() {
  const keys = [['circle', 'Fixed distance from a point'], ['perp', 'Same distance from A and B'], ['bisector', 'Same distance from two lines'], ['stadium', 'Fixed distance from a segment']];
  return svg(480, 150, keys.map(([k, nm], i) => lociPanel(k, i * 120, 0, 112, 112) + text(i * 120 + 56, 128, nm.split(' ').slice(0, 3).join(' '), { size: 11 }) + text(i * 120 + 56, 142, nm.split(' ').slice(3).join(' '), { size: 11 })).join(''), { maxWidth: 480, label: 'Common loci' });
}
function regionFig() {
  const Wc = 10; const Hc = 7; const s = 32;
  const g = squareGrid(Wc, Hc, { s, x0: 12, y0: 12, dashed: true });
  const A = [2, 4]; const B = [8, 4]; const Cp = [4, 3]; const r = 3;
  const M = g.P;
  const cl = `<defs><clipPath id="tutreg"><rect x="${M([0, Hc])[0]}" y="${M([0, Hc])[1]}" width="${5 * s}" height="${Hc * s}"/></clipPath><clipPath id="tutbox"><rect x="${M([0, Hc])[0]}" y="${M([0, Hc])[1]}" width="${Wc * s}" height="${Hc * s}"/></clipPath></defs>`;
  let body = g.body + cl + `<g clip-path="url(#tutreg)">${circle(...M(Cp), r * s, { fill: 'var(--d-accent, #2f5bd3)', width: 0 }).replace('fill="var(--d-accent, #2f5bd3)"', 'fill="var(--d-accent, #2f5bd3)" fill-opacity="0.3"')}</g>`;
  body += `<g clip-path="url(#tutbox)">${circle(...M(Cp), r * s, { color: ACCENT2, width: 2 })}</g>` + line(...M([5, 0]), ...M([5, Hc]), { color: ACCENT, width: 2, dash: '7 5' });
  body += polygon([M([0, 0]), M([Wc, 0]), M([Wc, Hc]), M([0, Hc])], { fill: 'none', width: 2 });
  for (const [nm, pt] of [['A', A], ['B', B], ['C', Cp]]) body += dot(...M(pt), 3.5) + htext(M(pt)[0] + 9, M(pt)[1] - 10, nm, { size: 14, italic: true });
  return svg(g.width, g.height, body, { maxWidth: 380, label: 'Region' });
}

/* ---------- pages ---------- */

export const shapeTutorials = [
  {
    id: 'geo-2d-properties',
    title: 'Properties of 2D shapes',
    skills: ['geo-2d-properties'],
    prereqs: ['geo-angle-basics'],
    summary: 'Name and describe triangles, quadrilaterals and polygons from their sides, angles and diagonals.',
    body: [
      h('Reading the marks on a diagram'),
      p('Diagrams use a code: matching <b>dashes</b> on sides mean those sides are equal, matching <b>arrows</b> mean those sides are parallel (they never meet), and a small <b>square</b> in a corner means a right angle ($90^\\circ$). A <b>polygon</b> is a flat shape with straight sides; its corners are called <b>vertices</b>.'),
      h('Triangles'),
      tbl([['Name', 'What it means'], ['Equilateral', 'all 3 sides equal (so all angles $60^\\circ$)'], ['Isosceles', '2 equal sides (and 2 equal angles)'], ['Scalene', 'no equal sides'], ['Right-angled', 'one angle is $90^\\circ$']]),
      h('Quadrilaterals (4 sides)'),
      figure(quadFamily(), 'The special quadrilaterals, with their marks.'),
      key('Quadrilateral facts', list([
        '<b>Square</b>: 4 equal sides, 4 right angles. Diagonals equal and cross at right angles.',
        '<b>Rectangle</b>: opposite sides equal, 4 right angles. Diagonals equal.',
        '<b>Rhombus</b>: 4 equal sides, opposite sides parallel. Diagonals cross at right angles.',
        '<b>Parallelogram</b>: opposite sides equal and parallel, opposite angles equal.',
        '<b>Kite</b>: two pairs of equal sides next to each other. Diagonals cross at right angles.',
        '<b>Trapezium</b>: exactly one pair of parallel sides.',
      ])),
      p('These overlap: a square is a special rectangle <i>and</i> a special rhombus, and every rectangle and rhombus is a special parallelogram. So "true for <b>every</b> parallelogram" only includes properties that rectangles, rhombuses and squares share too.'),
      h('Polygon names'),
      tbl([['Sides', '5', '6', '7', '8', '9', '10'], ['Name', 'pentagon', 'hexagon', 'heptagon', 'octagon', 'nonagon', 'decagon']]),
      p('A <b>regular</b> polygon has all sides equal and all angles equal.'),
      h('Method: identifying a shape'),
      steps(['Count the sides.', 'Look at the marks: which sides are equal, which are parallel, any right angles?', 'Match against the facts above, starting with the most special shape that fits.']),
      example('Example 1', 'A quadrilateral has all four sides equal, but its angles are not right angles. What is it?', [
        'All sides equal → square or rhombus.', 'Not right angles → not a square.',
      ], 'a rhombus'),
      example('Example 2 – using coordinates', '$A(1, 1)$, $B(5, 1)$ and $C(6, 4)$ are three vertices of a parallelogram $ABCD$. Find $D$.', [
        'In a parallelogram, opposite sides are parallel and equal, so going from $A$ to $D$ is the same move as going from $B$ to $C$.',
        '$B$ to $C$: 1 right and 3 up.',
        'From $A(1, 1)$: 1 right and 3 up gives $(2, 4)$.',
      ], '$D(2, 4)$', { visual: gridFig({ xmin: 0, xmax: 7, ymin: 0, ymax: 5 }, [{ pts: [[1, 1], [5, 1], [6, 4], [2, 4]] }], { unitPx: 30, points: [{ p: [1, 1], label: 'A', dx: -10, dy: 12 }, { p: [5, 1], label: 'B', dx: 10, dy: 12 }, { p: [6, 4], label: 'C' }, { p: [2, 4], label: 'D' }] }) }),
      mistake('calling any shape with 4 equal sides a square. Equal sides with slanted corners make a rhombus.'),
      h('What next?'),
      p('See [[geo-symmetry]], and use these shapes in [[geo-angles-triangles]] and [[geo-area-basic]].'),
    ].join(''),
  },
  {
    id: 'geo-symmetry',
    title: 'Symmetry',
    skills: ['geo-symmetry'],
    prereqs: ['geo-2d-properties'],
    summary: 'Count lines of symmetry and the order of rotational symmetry, and use lines of symmetry on a grid.',
    body: [
      h('Two kinds of symmetry'),
      p('A <b>line of symmetry</b> is a mirror line: fold the shape along it and the two halves match exactly. <b>Rotational symmetry</b> is about turning: the <b>order</b> is how many times the shape looks exactly the same during one full turn about its centre.'),
      key('Symmetry', list([
        'Line symmetry: count the mirror lines.',
        'Rotational symmetry: count the positions in a full turn that look identical. Every shape has order at least 1 (back to the start), and order 1 means "no rotational symmetry".',
        'A regular polygon with $n$ sides has $n$ lines of symmetry and rotational symmetry of order $n$.',
      ])),
      figure(symmetryFig()),
      p('A rectangle has 2 lines (through the middles of opposite sides) and order 2. Its diagonals are <b>not</b> lines of symmetry – try folding a sheet of A4 corner to corner. A parallelogram has no lines of symmetry but still has order 2: turn it half a turn and it looks the same.'),
      tbl([['Shape', 'Lines', 'Order'], ['Square', '4', '4'], ['Rectangle', '2', '2'], ['Rhombus', '2', '2'], ['Parallelogram', '0', '2'], ['Kite', '1', '1'], ['Isosceles trapezium', '1', '1'], ['Equilateral triangle', '3', '3']]),
      h('Method'),
      steps(['For lines: imagine folding. Check vertical, horizontal and diagonal lines through the centre.', 'For order: imagine tracing the shape and turning the tracing. Count the matches up to (and including) the full turn.']),
      example('Example 1', 'What is the order of rotational symmetry of a regular pentagon?', ['It looks the same after each fifth of a turn ($72^\\circ$), five times in a full turn.'], '5'),
      example('Example 2 – lines of symmetry on a grid', 'A shape has lines of symmetry $x = 1$ and $y = 5$. One vertex is $P(4, 7)$. Find the vertex $Q$ that you reach by reflecting $P$ in both lines.', [
        'Reflect in $x = 1$: $P$ is 3 to the right of the line, so its image is 3 to the left: $x = 1 - 3 = -2$.',
        'Reflect in $y = 5$: $P$ is 2 above the line, so its image is 2 below: $y = 5 - 2 = 3$.',
      ], '$Q(-2, 3)$'),
      mistake('counting the diagonals of a rectangle as lines of symmetry. Only squares (and rhombuses) have diagonal lines of symmetry.'),
      h('What next?'),
      p('Reflections and rotations of whole shapes: [[geo-reflection]] and [[geo-rotation]].'),
    ].join(''),
  },
  {
    id: 'geo-3d-properties',
    title: '3D shapes and nets',
    skills: ['geo-3d-properties'],
    prereqs: ['geo-2d-properties'],
    summary: 'Count faces, edges and vertices of prisms and pyramids, use edge lengths, and recognise nets.',
    body: [
      h('Faces, edges and vertices'),
      p('A 3D shape (a <b>solid</b>) has <b>faces</b> (flat surfaces), <b>edges</b> (where two faces meet) and <b>vertices</b> (corners). In drawings, hidden edges at the back are dashed.'),
      columns(figure(polyhedronFig(...Object.values(regularPrism(5, { depth: 2 })), { W: 240, H: 200 }), 'Pentagonal prism'), figure(polyhedronFig(...Object.values(regularPyramid(4, { rot: 0.35 })), { W: 240, H: 200 }), 'Square-based pyramid')),
      p('A <b>prism</b> has the same cross-section all the way through (two identical ends joined by rectangles). A <b>pyramid</b> has a base and triangular faces meeting at a point (the apex).'),
      key('Counting rules', tbl([['Solid with an $n$-sided end / base', 'Faces', 'Edges', 'Vertices'], ['Prism', '$n + 2$', '$3n$', '$2n$'], ['Pyramid', '$n + 1$', '$2n$', '$n + 1$']])
        + p('Check with <b>Euler’s rule</b>: faces + vertices − edges $= 2$.')),
      p('Why? A prism has 2 end faces plus $n$ rectangles; each end has $n$ edges and $n$ more edges join them; each end has $n$ corners. A pyramid has the base plus $n$ triangles; $n$ base edges plus $n$ edges up to the apex; $n$ base corners plus the apex.'),
      p('Round solids: a cylinder has 3 faces (2 flat, 1 curved), 2 edges and 0 vertices; a cone has 2 faces, 1 edge and 1 vertex; a sphere has 1 curved face.'),
      h('Nets'),
      p('A <b>net</b> is the flat shape you would cut out and fold to make a solid. A cube has 11 different nets of 6 squares. To test a net, imagine folding up the squares around one base square: no two squares may land on the same face.'),
      figure(svg(320, 150, drawNet([[1, 0], [1, 1], [1, 2], [1, 3], [0, 2], [2, 2]], 0, 0, 150, 150) + drawNet([[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]], 170, 0, 150, 150) + text(75, 145, 'a net of a cube ✓', { size: 12 }) + text(245, 145, 'not a net ✗', { size: 12 }), { maxWidth: 320 })),
      h('Worked examples'),
      example('Example 1', 'How many faces, edges and vertices does a heptagonal prism (7-sided cross-section) have?', [
        'Faces $= 7 + 2 = 9$, edges $= 3 \\times 7 = 21$, vertices $= 2 \\times 7 = 14$.', 'Euler check: $9 + 14 - 21 = 2$ ✓',
      ], '9 faces, 21 edges, 14 vertices'),
      example('Example 2 – edge lengths', 'A pyramid has a square base. Each of its four sloping edges is $10$ cm, and the total length of all eight edges is $68$ cm. Find the area of the base.', [
        'Sloping edges: $4 \\times 10 = 40$ cm.', 'Base edges: $68 - 40 = 28$ cm, so each base edge is $28 \\div 4 = 7$ cm.', 'Area of the square base $= 7 \\times 7 = 49$ cm².',
      ], '$49$ cm²'),
      mistake('forgetting the hidden faces and edges at the back of the drawing.'),
      h('What next?'),
      p('Views from above and from the side: [[geo-plans-elevations]]. Measuring solids: [[geo-volume-cuboid]] and [[geo-surface-area]].'),
    ].join(''),
  },
  {
    id: 'geo-plans-elevations',
    title: 'Plans and elevations',
    skills: ['geo-plans-elevations'],
    prereqs: ['geo-3d-properties'],
    summary: 'Draw and recognise the plan, front elevation and side elevation of a 3D solid.',
    body: [
      h('Three flat views'),
      p('Architects draw a 3D object as flat views. The <b>plan</b> is the view from directly above. The <b>front elevation</b> is the view from the front and the <b>side elevation</b> is the view from the side. Each view is flat: you cannot see depth, only the outline (and edges) facing you.'),
      figure(stackFig(), 'A solid made from 6 centimetre cubes.'),
      figure(viewsFig()),
      key('What each view shows', list([
        '<b>Plan</b>: one square for every column of cubes, however tall.',
        '<b>Front elevation</b>: for each column across, the height of the <b>tallest</b> stack in that line.',
        '<b>Side elevation</b>: the same idea, looking from the side.',
      ])),
      h('Method'),
      steps(['Decide where you are looking from (follow the arrow).', 'Work across from left to right as <b>you</b> see it.', 'For each position, use the tallest stack you can see in that line.']),
      example('Example 1 – counting cubes', 'The solid above is made from centimetre cubes. More cubes are added to make a cuboid 3 cm long, 2 cm wide and 2 cm high. How many are added?', [
        'Count the solid: back row $2 + 1 + 1 = 4$, front row $1 + 1 = 2$, so $6$ cubes.', 'The cuboid needs $3 \\times 2 \\times 2 = 12$ cubes.', '$12 - 6 = 6$',
      ], '6 cubes'),
      example('Example 2 – naming a solid', 'A solid has a circle for its plan and a triangle for its front and side elevations. What is it?', [
        'Round from above, pointed from the side: a cone (the apex is in the middle of the plan).',
      ], 'a cone'),
      mistake('drawing a 3D sketch as an elevation. Elevations are flat, with no slanted lines for depth.'),
      h('What next?'),
      p('Volumes of solids made of cubes: [[geo-volume-cuboid]].'),
    ].join(''),
  },
  {
    id: 'geo-constructions-loci',
    title: 'Constructions and loci',
    skills: ['geo-constructions-loci'],
    prereqs: ['geo-2d-properties', 'geo-angle-basics'],
    summary: 'Recognise ruler-and-compass constructions and loci, find regions that satisfy conditions, and use scale.',
    body: [
      h('What is a locus?'),
      p('A <b>locus</b> (plural <b>loci</b>) is the set of all points that obey a rule – for example, all the places a goat on a 3 m rope can reach. Some rules give lines, some give regions.'),
      figure(lociFamily()),
      key('The four main loci', list([
        'Points a fixed distance from a <b>point</b>: a <b>circle</b> (inside it: closer than that distance).',
        'Points the same distance from <b>two points</b> $A$ and $B$: the <b>perpendicular bisector</b> of $AB$ – it cuts $AB$ in half at right angles.',
        'Points the same distance from <b>two lines</b> that meet: the <b>angle bisector</b>.',
        'Points a fixed distance from a <b>line segment</b>: two parallel lines joined by semicircles (a running-track shape).',
      ])),
      h('Constructing with ruler and compasses'),
      columns(figure(constructionPanel('perp', ['A', 'B', 'C'], () => 0.5), 'Perpendicular bisector'), figure(constructionPanel('angle', ['A', 'B', 'C'], () => 0.5), 'Angle bisector')),
      steps([
        '<b>Perpendicular bisector of $AB$:</b> open the compasses to more than half of $AB$. Draw arcs above and below the line from $A$, then from $B$ with the same radius. Join the two crossing points.',
        '<b>Angle bisector:</b> draw an arc from the corner cutting both arms. From those two points draw equal arcs that cross. Join the corner to the crossing point.',
      ]),
      p('Why do they work? Every crossing point of equal arcs is the same distance from both centres – exactly the rule for the locus. Leave the arcs showing: they are your working.'),
      h('Regions'),
      p('When there are several conditions, draw each boundary and shade the part that obeys <b>all</b> of them. "Closer to $A$ than to $B$" is the side of the perpendicular bisector containing $A$; "less than 3 cm from $C$" is inside the circle.'),
      example('Example 1 – a region', 'On a centimetre grid, shade the points that are closer to $A$ than to $B$ <b>and</b> less than $3$ cm from $C$.', [
        'The perpendicular bisector of $AB$ is the dashed line halfway between them; $A$’s side is on the left.',
        'Draw a circle of radius $3$ cm centred on $C$.',
        'Shade the part of the circle on $A$’s side of the line.',
      ], 'the shaded region', { visual: regionFig() }),
      example('Example 2 – scale', 'A goat is tied to a post with a rope $12$ m long. On a scale drawing $1$ cm represents $5$ m. What radius circle shows where the goat can reach?', [
        'The goat can reach anywhere within $12$ m of the post: a circle of radius $12$ m.', 'On the drawing: $12 \\div 5 = 2.4$ cm.',
      ], '$2.4$ cm'),
      example('Example 3 – will the triangle close?', 'Can a triangle be constructed with sides $4$ cm, $5$ cm and $10$ cm? What about $6$, $7$ and $11$ cm?', [
        'The two shorter sides must add up to <b>more</b> than the longest, or the arcs never meet.', '$4 + 5 = 9$, less than $10$: impossible.', '$6 + 7 = 13$, more than $11$: possible.',
      ], 'No; yes'),
      mistake('shading the wrong side of a boundary. Test one point: is it really closer to $A$? Is it inside the circle?'),
      h('What next?'),
      p('Scale drawings and maps: [[rat-scales-maps]]. Loci on coordinate grids: [[gr-inequality-regions]].'),
    ].join(''),
  },
];

void [display, note, MUTED];
