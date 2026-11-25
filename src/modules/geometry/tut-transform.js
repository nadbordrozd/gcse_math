// Learn pages for the Transformations unit. See docs/TUTORIAL_GUIDELINES.md.
import { h, p, list, steps, key, display, note, mistake, figure, columns, example, tbl } from '../../tutorial-kit.js';
import { FILL2 } from './diagrams.js';
import { gridFig, T } from './transform.js';

const W5 = { xmin: -5, xmax: 5, ymin: -5, ymax: 5 };
const A0 = [[1, 1], [3, 1], [1, 4]]; // a right-angled triangle used on several pages
const img = (f, pts = A0) => pts.map(f);

export const transformTutorials = [
  {
    id: 'geo-translation',
    title: 'Translations',
    skills: ['geo-translation'],
    prereqs: ['gr-coordinates'],
    summary: 'Slide shapes using column vectors, and describe a translation with a column vector.',
    body: [
      h('The big idea'),
      p('A <b>translation</b> slides a shape without turning or flipping it. Every point moves the same distance in the same direction, so the image is the same size, shape and way round.'),
      key('Column vectors', display('\\begin{pmatrix} 3 \\\\ -2 \\end{pmatrix}') + p('The <b>top</b> number is the move across: positive = right, negative = left. The <b>bottom</b> number is the move up or down: positive = up, negative = down. This one means 3 right and 2 down.')),
      figure(gridFig(W5, [{ pts: A0, label: 'A' }, { pts: img(T.translate([-5, 2])), label: 'B', fill: FILL2 }], { unitPx: 26 }), 'Shape A translated by $\\begin{pmatrix} -5 \\\\ 2 \\end{pmatrix}$ gives shape B.'),
      steps(['Translating: move one vertex at a time by the vector, then join up.', 'Describing: pick a vertex of the original and the matching vertex of the image; count across, then up or down.', 'Coordinates: add the top number to $x$ and the bottom number to $y$.']),
      example('Example 1', 'The point $(3, -2)$ is translated by $\\begin{pmatrix} -5 \\\\ 4 \\end{pmatrix}$. Find its image.', [
        '$x$: $3 + (-5) = -2$.', '$y$: $-2 + 4 = 2$.',
      ], '$(-2, 2)$'),
      example('Example 2 – describing', 'A vertex of shape P is at $(1, 2)$; the matching vertex of its image Q is at $(4, -1)$. Write down the translation vector from P to Q.', [
        'Across: from $1$ to $4$ is $3$ right.', 'Up/down: from $2$ to $-1$ is $3$ down.',
      ], '$\\begin{pmatrix} 3 \\\\ -3 \\end{pmatrix}$'),
      p('To translate back from Q to P, change both signs: $\\begin{pmatrix} -3 \\\\ 3 \\end{pmatrix}$. Two translations one after the other add up: add the top numbers and add the bottom numbers.'),
      mistake('swapping the numbers – the top is always the <b>horizontal</b> move – or counting from a vertex on one shape to a different vertex on the other.'),
      h('What next?'),
      p('Flipping shapes: [[geo-reflection]]. Vectors in geometry: [[trig-column-vectors]].'),
    ].join(''),
  },
  {
    id: 'geo-reflection',
    title: 'Reflections',
    skills: ['geo-reflection'],
    prereqs: ['gr-coordinates', 'gr-horizontal-vertical', 'geo-symmetry'],
    summary: 'Reflect shapes in lines such as x = 2, y = −1, y = x and y = −x, and find a mirror line.',
    body: [
      h('The big idea'),
      p('A <b>reflection</b> flips a shape over a mirror line. Each point of the image is the same distance from the mirror line as the original point, but on the other side, and the line joining them crosses the mirror at right angles. The image is the same size but "back to front".'),
      key('Mirror lines', list([
        '$x = a$ is a <b>vertical</b> line through $a$ on the $x$-axis; $y = b$ is a <b>horizontal</b> line. The $y$-axis is $x = 0$ and the $x$-axis is $y = 0$.',
        'Reflecting in $x = a$ changes only the $x$-coordinate; reflecting in $y = b$ changes only the $y$-coordinate.',
        'Reflecting in $y = x$ swaps the coordinates: $(p, q) \\to (q, p)$. In $y = -x$: $(p, q) \\to (-q, -p)$.',
      ])),
      columns(figure(gridFig(W5, [{ pts: A0, label: 'A' }, { pts: img(T.reflect({ t: 'x', v: 0 })), label: 'B', fill: FILL2 }], { lines: [{ t: 'x', v: 0 }], unitPx: 22 }), 'Reflection in the $y$-axis ($x = 0$).'),
        figure(gridFig(W5, [{ pts: A0, label: 'A' }, { pts: img(T.reflect({ t: 'yx' })), label: 'C', fill: FILL2 }], { lines: [{ t: 'yx' }], unitPx: 22 }), 'Reflection in $y = x$.')),
      steps(['Draw the mirror line (check: vertical or horizontal?).', 'For each vertex, count the squares to the line, then the same number past it.', 'Join up the new vertices. A vertex on the mirror line stays put.']),
      example('Example 1 – a vertical line', 'Reflect $(5, 3)$ in the line $x = 2$.', [
        '$x = 2$ is vertical. The point is $5 - 2 = 3$ squares to the right of it.', 'Go 3 squares to the left of the line: $x = 2 - 3 = -1$. The $y$-coordinate does not change.',
      ], '$(-1, 3)$'),
      example('Example 2 – a horizontal line', 'Reflect $(2, 3)$ in the line $y = -1$.', [
        '$y = -1$ is horizontal. The point is $3 - (-1) = 4$ squares above it.', 'Go 4 below: $y = -1 - 4 = -5$.',
      ], '$(2, -5)$'),
      example('Example 3 – the line y = x', 'Reflect $(4, 1)$ in the line $y = x$.', ['Swap the coordinates.'], '$(1, 4)$'),
      p('To <b>find</b> a mirror line, join a vertex to its image: the mirror line goes through the midpoint, at right angles.'),
      mistake('mixing up $x = 2$ and $y = 2$. "$x = 2$" is every point whose $x$-coordinate is $2$ – a vertical line.'),
      h('What next?'),
      p('Turning shapes: [[geo-rotation]].'),
    ].join(''),
  },
  {
    id: 'geo-rotation',
    title: 'Rotations',
    skills: ['geo-rotation'],
    prereqs: ['gr-coordinates', 'geo-angle-basics'],
    summary: 'Rotate shapes by 90° and 180° about a point, and find the centre of a rotation.',
    body: [
      h('The big idea'),
      p('A <b>rotation</b> turns a shape about a fixed point, the <b>centre of rotation</b>. To describe one you need three things: the <b>angle</b>, the <b>direction</b> (clockwise or anticlockwise) and the <b>centre</b>. The image is the same size and shape.'),
      figure(gridFig(W5, [{ pts: A0, label: 'A' }, { pts: img(T.rotate(90, [0, 0])), label: 'B', fill: FILL2 }, { pts: img(T.rotate(180, [0, 0])), label: 'C', fill: FILL2 }], { unitPx: 26, points: [{ p: [0, 0], cross: true }] }), 'A rotated $90^\\circ$ clockwise about the origin gives B; rotated $180^\\circ$ gives C.'),
      key('Rotations about the origin', tbl([['Rotation', '$(x, y)$ goes to'], ['$90^\\circ$ clockwise', '$(y, -x)$'], ['$90^\\circ$ anticlockwise', '$(-y, x)$'], ['$180^\\circ$ (either way)', '$(-x, -y)$']]) + p('$90^\\circ$ clockwise is the same as $270^\\circ$ anticlockwise.')),
      h('Method (tracing paper)'),
      steps(['Trace the shape and mark the centre on the tracing.', 'Put your pencil point on the centre and turn the paper by the angle, in the right direction.', 'Mark where the vertices land and join them.']),
      p('Without tracing paper, use the movement from the centre: in a $90^\\circ$ clockwise turn, "3 right, 1 up" becomes "1 right, 3 down".'),
      example('Example 1 – about the origin', 'Rotate the point $(3, 1)$ by $90^\\circ$ clockwise about the origin.', ['Use $(x, y) \\to (y, -x)$: $(3, 1) \\to (1, -3)$.'], '$(1, -3)$'),
      example('Example 2 – about another point', 'Rotate $(4, 3)$ by $90^\\circ$ clockwise about $(1, 2)$.', [
        'From the centre $(1, 2)$ to the point is 3 right and 1 up.', 'A quarter turn clockwise turns this into 1 right and 3 down.', 'From the centre: $(1 + 1, 2 - 3) = (2, -1)$.',
      ], '$(2, -1)$'),
      p('To find an unknown centre, try likely points with tracing paper: the centre is the only point that stays where it is. For a $180^\\circ$ rotation, it is the midpoint of each vertex and its image.'),
      mistake('turning the wrong way. Clockwise is the direction the hands of a clock move.'),
      h('What next?'),
      p('Changing size: [[geo-enlargement]]. Telling the transformations apart: [[geo-describe-transformations]].'),
    ].join(''),
  },
  {
    id: 'geo-enlargement',
    title: 'Enlargements',
    skills: ['geo-enlargement'],
    prereqs: ['gr-coordinates', 'rat-simplify'],
    summary: 'Enlarge shapes by whole-number and fractional scale factors from a centre, and find the scale factor and centre.',
    body: [
      h('The big idea'),
      p('An <b>enlargement</b> changes the size of a shape but not its shape: angles stay the same and every length is multiplied by the <b>scale factor</b>. The <b>centre of enlargement</b> fixes where the image goes: every point moves along a straight line from the centre, ending up "scale factor" times as far away.'),
      figure(gridFig({ xmin: 0, xmax: 7, ymin: 0, ymax: 5 }, [{ pts: [[2, 1], [3, 1], [2, 2]], label: 'A' }, { pts: [[4, 2], [6, 2], [4, 4]], label: 'B', fill: FILL2 }], { unitPx: 32, points: [{ p: [0, 0], cross: true }] }), 'B is an enlargement of A, scale factor 2, centre $(0, 0)$: every vertex of B is twice as far from the origin as the matching vertex of A.'),
      key('Enlargement', list([
        'Scale factor $= \\dfrac{\\text{length on image}}{\\text{matching length on original}}$.',
        'Scale factor bigger than 1: the image is bigger. Between 0 and 1 (like $\\frac{1}{2}$): smaller, and closer to the centre.',
        'Image point $=$ centre $+$ scale factor $\\times$ (movement from the centre to the point).',
      ])),
      steps(['Find the movement from the centre to a vertex (across, up).', 'Multiply both numbers by the scale factor.', 'Do that movement from the centre to find the image vertex. Repeat for each vertex.', 'To find the centre: draw lines through matching vertices of the shape and its image; they meet at the centre.']),
      example('Example 1', 'Enlarge the point $P(3, 2)$ by scale factor $2$, centre $(1, 1)$.', [
        'From the centre to $P$: 2 right, 1 up.', 'Times 2: 4 right, 2 up.', 'From the centre: $(1 + 4, 1 + 2) = (5, 3)$.',
      ], '$(5, 3)$'),
      example('Example 2 – fractional scale factor', 'Enlarge $(6, 4)$ by scale factor $\\frac{1}{2}$, centre the origin.', ['From the origin the movement is just the coordinates. Halve them.'], '$(3, 2)$'),
      example('Example 3 – finding the scale factor', 'A side of length $3$ cm becomes $7.5$ cm after an enlargement. Find the scale factor.', ['$7.5 \\div 3 = 2.5$'], '$2.5$'),
      mistake('multiplying the coordinates by the scale factor when the centre is <b>not</b> the origin. Always measure from the centre.'),
      note('Lengths are multiplied by the scale factor $k$, but areas are multiplied by $k^2$: a scale factor 3 enlargement has $9$ times the area. See [[trig-similar-area-volume]].'),
      h('What next?'),
      p('Describing transformations: [[geo-describe-transformations]]. Negative scale factors: [[geo-enlargement-negative]].'),
    ].join(''),
  },
  {
    id: 'geo-describe-transformations',
    title: 'Describing transformations',
    skills: ['geo-describe-transformations'],
    prereqs: ['geo-translation', 'geo-reflection', 'geo-rotation', 'geo-enlargement'],
    summary: 'Describe fully a single transformation, combine two transformations, and find invariant points.',
    body: [
      h('Which transformation is it?'),
      list([
        'Same size, same way round, just moved → <b>translation</b>.',
        'Same size, flipped (a mirror image) → <b>reflection</b>.',
        'Same size, turned → <b>rotation</b>.',
        'Different size → <b>enlargement</b>.',
      ]),
      key('Describe fully', tbl([['Transformation', 'You must give'], ['Translation', 'the column vector'], ['Reflection', 'the equation of the mirror line'], ['Rotation', 'the angle, the direction and the centre'], ['Enlargement', 'the scale factor and the centre']]) + p('Name <b>one single</b> transformation – never "a rotation and a translation" when one move will do.')),
      example('Example 1', 'Shape B is shape A turned a quarter turn clockwise; the point $(0, 0)$ does not move. Describe the transformation fully.', ['Turned, same size → rotation. Angle $90^\\circ$, clockwise, centre $(0, 0)$.'], 'Rotation $90^\\circ$ clockwise about $(0, 0)$'),
      h('Combined transformations'),
      p('Do the first transformation, then do the second to the result. Then look at the start and finish: which single transformation joins them?'),
      example('Example 2', 'A shape is reflected in the $x$-axis and then in the $y$-axis. Which single transformation has the same effect?', [
        'Follow one point: $(2, 1)$ reflects in the $x$-axis to $(2, -1)$, then in the $y$-axis to $(-2, -1)$.', '$(x, y) \\to (-x, -y)$ is a half turn about the origin.',
      ], 'Rotation $180^\\circ$ about $(0, 0)$', { visual: gridFig(W5, [{ pts: A0, label: 'A' }, { pts: img(T.reflect({ t: 'y', v: 0 })), label: '', fill: 'none' }, { pts: img(T.rotate(180, [0, 0])), label: 'B', fill: FILL2 }], { unitPx: 24 }) }),
      h('Invariant points'),
      p('A point is <b>invariant</b> if it ends up where it started. In a reflection, every point on the mirror line is invariant; in a rotation or enlargement, the centre is invariant; a translation has no invariant points.'),
      mistake('leaving out the centre of a rotation or enlargement – "a $90^\\circ$ rotation" alone does not fix where the image goes.'),
      h('What next?'),
      p('Enlargements that flip the shape over: [[geo-enlargement-negative]].'),
    ].join(''),
  },
  {
    id: 'geo-enlargement-negative',
    title: 'Negative scale factors',
    skills: ['geo-enlargement-negative'],
    prereqs: ['geo-enlargement'],
    summary: 'Enlarge shapes with negative scale factors and describe such enlargements.',
    body: [
      h('The big idea'),
      p('A negative scale factor works like an ordinary [[geo-enlargement|enlargement]], except that the image goes on the <b>opposite side of the centre</b>. Each point moves through the centre and out the other side, so the image ends up upside down.'),
      figure(gridFig({ xmin: -5, xmax: 5, ymin: -3, ymax: 4 }, [{ pts: [[2, 1], [3, 1], [2, 3]], label: 'A' }, { pts: [[-1, 1], [-3, 1], [-1, -3]], label: 'B', fill: FILL2 }], { unitPx: 30, points: [{ p: [1, 1], cross: true, label: '(1, 1)', dx: 10, dy: -14 }] }), 'B is an enlargement of A, scale factor $-2$, centre $(1, 1)$.'),
      key('Negative scale factor $-k$', list([
        'Lengths are multiplied by $k$ (the size ignores the minus sign).',
        'The image is on the other side of the centre and rotated by $180^\\circ$.',
        'Scale factor $-1$ is the same as a rotation of $180^\\circ$ about the centre.',
      ])),
      steps(['Find the movement from the centre to a vertex.', 'Multiply both numbers by the (negative) scale factor – the directions reverse.', 'Do that movement from the centre.']),
      example('Example 1', 'Enlarge $(3, 2)$ by scale factor $-2$, centre $(1, 1)$.', [
        'From the centre: 2 right, 1 up.', 'Times $-2$: 4 left, 2 down.', 'From the centre: $(1 - 4, 1 - 2) = (-3, -1)$.',
      ], '$(-3, -1)$'),
      example('Example 2', 'Enlarge $(4, -6)$ by scale factor $-\\frac{1}{2}$, centre the origin.', ['Multiply both coordinates by $-\\frac{1}{2}$: $(-2, 3)$.'], '$(-2, 3)$'),
      p('To describe one, look for an image that is upside down on the far side of a point: the lines joining matching vertices all cross at the centre, which lies <b>between</b> the shape and its image.'),
      mistake('writing the scale factor as positive. If the image is on the other side of the centre, the scale factor is negative.'),
      h('What next?'),
      p('Similar shapes and their areas and volumes: [[trig-similar-lengths]] and [[trig-similar-area-volume]].'),
    ].join(''),
  },
];

void columns;
