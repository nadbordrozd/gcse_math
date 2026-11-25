// Learn pages: similarity, congruence, circles and vectors. Numbers in worked examples checked with node.
import { h, p, list, steps, key, display, note, mistake, figure, columns, example, tbl } from '../../tutorial-kit.js';
import { path as svgPath, svg, rect, line, text, arrow } from '../../svg.js';
import { fig, onCircle, placeBeside, vectorGrid, FILL, FILL2, ACCENT, ACCENT2 } from './diagrams.js';
import { circleFig, altSegFig } from './circles.js';
import { nestedFig } from './similarity.js';

/* ------------------------------------------------------------------ */
/* Diagrams                                                            */
/* ------------------------------------------------------------------ */

const centroid3 = (P) => [(P[0][0] + P[1][0] + P[2][0]) / 3, (P[0][1] + P[1][1] + P[2][1]) / 3];

// Two similar triangles ABC (4, 6, 7) and DEF (scale factor 2.5).
function similarPairFig() {
  const T1 = [[0, 0], [4, 0], [3.25, 2.6]];
  const T2 = placeBeside(T1, T1, { k: 1.6, gap: 0.35 });
  return fig({
    pts: { A: T1[0], B: T1[1], C: T1[2], D: T2[0], E: T2[1], F: T2[2], G1: centroid3(T1), G2: centroid3(T2) }, width: 430, height: 200, pad: 28,
    draw: (g) => g.poly('ABC') + g.poly('DEF') + g.angle('A', 'B', 'C', null, { r: 16 }) + g.angle('D', 'E', 'F', null, { r: 16 })
      + g.angle('B', 'A', 'C', null, { r: 14, double: true }) + g.angle('E', 'D', 'F', null, { r: 14, double: true })
      + g.side('A', 'B', '4 cm', { inside: 'G1' }) + g.side('B', 'C', '6 cm', { inside: 'G1' }) + g.side('A', 'C', '7 cm', { inside: 'G1' })
      + g.side('D', 'E', '10 cm', { inside: 'G2' }) + g.side('E', 'F', 'x', { inside: 'G2' }) + g.side('D', 'F', 'y', { inside: 'G2' })
      + g.polyNames('ABC', { size: 15 }) + g.polyNames('DEF', { size: 15 }),
  });
}

// SAS pair for the congruence page.
function sasFig() {
  const T1 = [[0, 0], [4, 0], [1.4, 2.6]];
  const T2 = placeBeside(T1, T1, { rotate: 200, flip: true, gap: 0.45 });
  return fig({
    pts: { A: T1[0], B: T1[1], C: T1[2], P: T2[0], Q: T2[1], R: T2[2], G1: centroid3(T1), G2: centroid3(T2) }, width: 430, height: 200, pad: 30,
    draw: (g) => g.poly('ABC') + g.poly('PQR') + g.side('A', 'B', '8 cm', { inside: 'G1' }) + g.side('A', 'C', '5 cm', { inside: 'G1' }) + g.angle('A', 'B', 'C', '62°')
      + g.side('P', 'Q', '8 cm', { inside: 'G2' }) + g.side('P', 'R', '5 cm', { inside: 'G2' }) + g.angle('P', 'Q', 'R', '62°')
      + g.polyNames('ABC', { size: 15 }) + g.polyNames('PQR', { size: 15 }),
  });
}

// A 1 x 1 square next to a 3 x 3 square split into unit squares.
function scaleSquaresFig() {
  let out = rect(20, 90, 30, 30, { fill: FILL }) + text(35, 140, '1 × 1', { size: 13 });
  for (let i = 0; i < 3; i += 1) for (let j = 0; j < 3; j += 1) out += rect(90 + 30 * i, 30 + 30 * j, 30, 30, { fill: FILL2 });
  out += text(135, 140, '3 × 3 = 9 squares', { size: 13 });
  out += text(250, 70, 'lengths × 3', { size: 13, anchor: 'start' }) + text(250, 94, 'area × 3² = 9', { size: 13, anchor: 'start' });
  return svg(390, 155, out + arrow(56, 105, 84, 105, { width: 1.4, head: 7 }), { label: 'Scale factor 3 multiplies area by 9' });
}

// Parts of a circle: lines (left) and regions (right).
function partsFigs() {
  const lines = fig({
    pts: { O: [0, 0], R: onCircle([0, 0], 1, 35), D1: onCircle([0, 0], 1, 160), D2: onCircle([0, 0], 1, 340), C1: onCircle([0, 0], 1, 220), C2: onCircle([0, 0], 1, 300), T: onCircle([0, 0], 1, 90) },
    circles: [['O', 1.15]], nda: false, width: 260, height: 240, pad: 24,
    draw: (g) => g.circle('O', 1) + g.dot('O') + g.seg('O', 'R', { color: ACCENT, width: 2.6 }) + g.seg('D1', 'D2', { color: ACCENT2, width: 2.6 }) + g.seg('C1', 'C2', { color: ACCENT, width: 2.6 })
      + g.seg([-0.8, 1], [0.8, 1], { color: ACCENT2, width: 2.6 })
      + g.textAt('R', -30, 2, 'radius', { size: 13, italic: false }) + g.textAt([-0.55, 0.2], 0, -12, 'diameter', { size: 13, italic: false }) + g.textAt([0.1, -0.78], 0, -14, 'chord', { size: 13, italic: false }) + g.textAt([0.55, 1], 0, -12, 'tangent', { size: 13, italic: false }),
  });
  const regions = fig({
    pts: { O: [0, 0], A: onCircle([0, 0], 1, 20), B: onCircle([0, 0], 1, 100), E: onCircle([0, 0], 1, 200), F: onCircle([0, 0], 1, 300) },
    circles: [['O', 1.15]], nda: false, width: 260, height: 240, pad: 24,
    draw: (g) => {
      const R = g.k; const C = g.P('O'); const A = g.P('A'); const B = g.P('B'); const E = g.P('E'); const F = g.P('F');
      return svgPath(`M ${C[0]} ${C[1]} L ${A[0]} ${A[1]} A ${R} ${R} 0 0 0 ${B[0]} ${B[1]} Z`, { fill: FILL2, color: ACCENT2, width: 2 })
        + svgPath(`M ${E[0]} ${E[1]} A ${R} ${R} 0 0 0 ${F[0]} ${F[1]} Z`, { fill: FILL, color: ACCENT, width: 2 })
        + g.circle('O', 1) + g.dot('O')
        + g.textAt([0.25, 0.45], 0, 0, 'sector', { size: 13, italic: false }) + g.textAt([-0.05, -0.7], 0, 0, 'segment', { size: 13, italic: false })
        + (() => { const P1 = g.P(onCircle([0, 0], 1, 120)); const P2 = g.P(onCircle([0, 0], 1, 175)); return svgPath(`M ${P1[0]} ${P1[1]} A ${R} ${R} 0 0 0 ${P2[0]} ${P2[1]}`, { color: ACCENT, width: 5 }); })()
        + g.textAt(onCircle([0, 0], 1, 148), -18, -10, 'arc', { size: 13, italic: false });
    },
  });
  return columns(lines, regions);
}

const deg = (x) => `${x}°`;

// Hourglass: AB parallel to DE, AE and BD crossing at C.
const hourglassFig = (labels) => fig({
  pts: { C: [0, 0], A: [-0.9, 0.55], B: [0.55, 0.75], E: [1.35, -0.825], D: [-0.825, -1.125] }, width: 340, height: 230,
  draw: (g) => {
    let out = g.poly('ABC', { fillOpacity: 0.7 }) + g.poly('CDE', { fillOpacity: 0.7 }) + g.arrows('A', 'B') + g.arrows('D', 'E');
    for (const [k, v] of Object.entries(labels)) out += g.side(k[0], k[1], v, { inside: k.includes('C') ? (k.includes('A') || k.includes('B') ? (k.includes('A') ? 'B' : 'A') : (k.includes('E') ? 'D' : 'E')) : 'C' });
    return out + ['A', 'B', 'D', 'E'].map((n) => g.name(n, n, { away: 'C' })).join('') + g.name('C', 'C', { dir: [1, 0] });
  },
});
const thmChord = () => circleFig({ on: { A: 210, B: 300 }, ext: { M: [(Math.cos(3.665) + Math.cos(5.236)) / 2, (Math.sin(3.665) + Math.sin(5.236)) / 2] }, width: 230, height: 210, nameDirs: { M: [0.5, 1] },
  draw: (g) => g.seg('A', 'B') + g.seg('O', 'M') + g.right('M', 'B', 'O', 9) + g.ticks('A', 'M') + g.ticks('M', 'B') });
// Small theorem diagrams (all built from the stated angles).
const thmCentre = () => circleFig({ on: { A: 232, B: 308, C: 90 }, width: 230, height: 210, draw: (g) => g.seg('C', 'A') + g.seg('C', 'B') + g.seg('O', 'A') + g.seg('O', 'B') + g.angle('C', 'A', 'B', 'x') + g.angle('O', 'A', 'B', '2x') });
const thmSemi = () => circleFig({ on: { A: 180, B: 0, C: 54 }, width: 230, height: 210, draw: (g) => g.seg('A', 'B') + g.seg('A', 'C') + g.seg('B', 'C') + g.right('C', 'A', 'B', 10) });
const thmSegment = () => circleFig({ on: { A: 209, B: 291, C: 0, D: 126 }, showO: false, width: 230, height: 210, draw: (g) => g.seg('A', 'C') + g.seg('B', 'C') + g.seg('A', 'D') + g.seg('B', 'D') + g.angle('C', 'A', 'B', 'x') + g.angle('D', 'A', 'B', 'x') });
const thmCyclic = () => circleFig({ on: { A: 272, B: -20, C: 92, D: 204 }, showO: false, width: 230, height: 210, draw: (g) => g.poly('ABCD', { fillOpacity: 0.6 }) + g.angle('A', 'B', 'D', 'x') + g.angle('C', 'D', 'B', 'y') });
const thmTangent = () => {
  const A = onCircle([0, 0], 1, 300); const t = [Math.sin((300 * Math.PI) / 180), -Math.cos((300 * Math.PI) / 180)];
  return circleFig({ on: { A: 300 }, ext: { P: [A[0] + 1.1 * t[0], A[1] + 1.1 * t[1]] }, width: 230, height: 210, draw: (g) => g.seg([A[0] - 0.9 * t[0], A[1] - 0.9 * t[1]], 'P') + g.seg('O', 'A') + g.right('A', 'O', 'P', 10) });
};
const thmTwoTangents = () => circleFig({ on: { A: 66, B: -66 }, ext: { P: [1 / Math.sin((24 * Math.PI) / 180), 0] }, width: 260, height: 210, draw: (g) => g.seg('P', 'A') + g.seg('P', 'B') + g.ticks('P', 'A') + g.ticks('P', 'B') + g.seg('O', 'A') + g.seg('O', 'B') + g.right('A', 'O', 'P', 9) + g.right('B', 'O', 'P', 9) });

/* ------------------------------------------------------------------ */
/* Pages                                                               */
/* ------------------------------------------------------------------ */

export const shapeTutorials = [
  {
    id: 'trig-similar-lengths',
    title: 'Similar shapes: lengths',
    skills: ['trig-similar-lengths'],
    prereqs: ['geo-enlargement', 'geo-parallel-lines', 'geo-angles-triangles'],
    summary: 'Use a scale factor to find missing lengths in similar triangles and shapes.',
    body: [
      h('The big idea'),
      p('Two shapes are <b>similar</b> if one is an [[geo-enlargement|enlargement]] of the other: the same shape, possibly a different size, possibly turned round or flipped over. Every length is multiplied by the same number, the <b>scale factor</b>, and the angles do not change.'),
      key('Similar shapes', display('\\text{scale factor } k = \\frac{\\text{length on the new shape}}{\\text{matching length on the old shape}}') + p('Matching (<b>corresponding</b>) angles are equal. Every length on the new shape $=$ $k \\times$ the matching length on the old shape.')),
      p('For triangles, equal angles are enough: if two triangles have the same three angles, they are similar. Two angles are enough, because the third is $180^\\circ$ minus the other two ([[geo-angles-triangles]]).'),
      h('Method'),
      steps([
        'Match up the corresponding sides. Use the equal angles: the side opposite the marked angle in one triangle matches the side opposite the same angle in the other. Redraw one triangle the same way round if it helps.',
        'Find a pair of matching sides where you know both lengths. Divide to get the scale factor.',
        'Multiply to go from the small shape to the big one; divide to go back.',
      ]),
      figure(similarPairFig(), 'Equal angles are marked. Side $AB$ matches $DE$, $BC$ matches $EF$, $AC$ matches $DF$.'),
      example('Example 1 – two separate triangles',
        'Triangles $ABC$ and $DEF$ are similar. $AB = 4$ cm, $BC = 6$ cm, $AC = 7$ cm and $DE = 10$ cm. Find $x = EF$ and $y = DF$.',
        ['$AB$ matches $DE$: scale factor $k = \\dfrac{10}{4} = 2.5$', '$x = EF = 6 \\times 2.5 = 15$', '$y = DF = 7 \\times 2.5 = 17.5$'],
        '$x = 15$ cm and $y = 17.5$ cm'),
      example('Example 2 – a triangle inside a triangle',
        '$DE$ is parallel to $BC$, with $D$ on $AB$ and $E$ on $AC$. $AD = 6$ cm, $DB = 4$ cm and $DE = 9$ cm. Find $x = BC$.',
        ['Because $DE \\parallel BC$, the [[geo-parallel-lines|corresponding angles]] are equal, so triangles $ADE$ and $ABC$ are similar.', 'Use the <b>whole</b> side: $AB = 6 + 4 = 10$ cm. Scale factor $= \\dfrac{10}{6} = \\dfrac{5}{3}$', '$BC = 9 \\times \\dfrac{5}{3} = 15$'],
        '$BC = 15$ cm', { visual: nestedFig({ k: 10 / 6, labels: { 'A-D': '6 cm', 'D-B': '4 cm', 'D-E': '9 cm', 'B-C': 'x' } }) }),
      example('Example 3 – crossing lines',
        'Lines $AE$ and $BD$ cross at $C$, and $AB$ is parallel to $DE$. $AB = 6$ cm, $DE = 9$ cm and $AC = 4$ cm. Find $CE$.',
        ['The angles at $C$ are [[geo-angle-basics|vertically opposite]], and [[geo-parallel-lines|alternate angles]] are equal, so triangles $ABC$ and $EDC$ are similar. Note that $A$ matches $E$ and $B$ matches $D$.', '$DE$ matches $AB$: scale factor $= \\dfrac{9}{6} = 1.5$', '$CE$ matches $AC$: $CE = 4 \\times 1.5 = 6$'],
        '$CE = 6$ cm', { visual: hourglassFig({ AB: '6 cm', DE: '9 cm', AC: '4 cm', CE: 'x' }) }),
      h('Parallel lines cut sides in the same ratio'),
      p('Because the matching sides are in the same ratio, a parallel line cuts the two sides of a triangle in the same ratio. In Example 2, $AD : DB = 6 : 4$, so $AE : EC$ is also $6 : 4$. If $AE = 7.5$ cm, then $EC = 5$ cm.',
        'This also helps when you are given a whole length. In the crossing-lines shape, $AC : CE = AB : DE$. If $AB = 6$, $DE = 9$ and the whole line $AE = 35$ cm, then $AC : CE = 6 : 9 = 2 : 3$, and [[rat-share|sharing]] $35$ in the ratio $2 : 3$ gives $AC = 14$ cm and $CE = 21$ cm.'),
      mistake('<b>adding</b> instead of multiplying. If one side grows from $4$ to $10$ (add $6$), the others do not all grow by $6$ – they are multiplied by $2.5$.'),
      mistake('in Example 2, using $DB = 4$ instead of the whole side $AB = 10$. The triangles are $ADE$ and $ABC$, so compare $AD$ with $AB$.'),
      note('Sense check: the bigger shape must have the bigger lengths. If your scale factor is bigger than 1 but your answer got smaller, you divided when you should have multiplied.'),
      h('What next?'),
      p('Areas and volumes of similar shapes scale differently: see [[trig-similar-area-volume]]. Shapes that are the same size as well as the same shape are [[trig-congruence|congruent]].'),
    ].join(''),
  },
  {
    id: 'trig-congruence',
    title: 'Congruent triangles',
    skills: ['trig-congruence'],
    prereqs: ['geo-angle-basics', 'geo-angles-triangles', 'trig-similar-lengths'],
    summary: 'Know the four conditions SSS, SAS, ASA and RHS, and use them to show two triangles are identical.',
    body: [
      h('The big idea'),
      p('Two shapes are <b>congruent</b> if they are exactly the same shape <b>and</b> size – one could be placed on top of the other after turning or flipping it. All matching sides and all matching angles are equal.',
        'For triangles you do not need to check all six measurements. Any of four sets of three facts is enough to fix the triangle completely.'),
      key('Conditions for congruent triangles', tbl([
        ['Name', 'What is equal'],
        ['SSS', 'all three pairs of sides'],
        ['SAS', 'two pairs of sides <b>and the angle between them</b>'],
        ['ASA', 'two pairs of angles and a pair of matching sides (often written AAS when the side is not between the angles)'],
        ['RHS', 'a <b>R</b>ight angle, the <b>H</b>ypotenuse and one other <b>S</b>ide'],
      ])),
      figure(sasFig(), 'Two sides and the angle between them are equal, so the triangles are congruent (SAS).'),
      h('Why these work (and others do not)'),
      list([
        'Build a triangle from two sides with a fixed angle between them: there is only one way to close it up. So SAS fixes the triangle.',
        '<b>AAA is not enough</b>: three equal angles give the same <i>shape</i>, but one triangle could be an enlargement of the other – that is [[trig-similar-lengths|similar]], not congruent.',
        '<b>SSA is not enough</b> (two sides and an angle that is <i>not</i> between them): sometimes two different triangles fit.',
        'RHS is the exception to that rule: with a right angle, [[trig-pythagoras|Pythagoras]] fixes the third side, so it is really SSS.',
      ]),
      h('Method'),
      steps([
        'Match up the vertices: which corner of one triangle goes with which corner of the other? Equal angles and the sides opposite them must match.',
        'List three equal facts (with reasons, e.g. "common side", "vertically opposite angles", "radii of the same circle").',
        'Check they fit one of SSS, SAS, ASA or RHS, and name it.',
      ]),
      example('Example 1 – name the condition',
        'Triangle $ABC$ has $AB = 8$ cm, $AC = 5$ cm and angle $A = 62^\\circ$. Triangle $PQR$ has $PQ = 8$ cm, $PR = 5$ cm and angle $P = 62^\\circ$. Why are they congruent?',
        ['The equal angle is <b>between</b> the two equal sides in each triangle.'],
        'SAS'),
      example('Example 2 – using congruence to find a length',
        'Triangles $ABC$ and $XYZ$ are congruent, with $A$ matching $X$, $B$ matching $Y$ and $C$ matching $Z$. $BC = 9$ cm and angle $C = 41^\\circ$. Find $YZ$ and angle $Z$.',
        ['$YZ$ matches $BC$, so $YZ = 9$ cm.', 'Angle $Z$ matches angle $C$, so it is $41^\\circ$.'],
        '$YZ = 9$ cm, angle $Z = 41^\\circ$'),
      example('Example 3 – which facts prove it?',
        'Which set proves triangles $ABC$ and $PQR$ congruent: (i) $\\angle A = \\angle P$, $\\angle B = \\angle Q$, $\\angle C = \\angle R$; (ii) $AB = PQ$, $BC = QR$, $\\angle A = \\angle P$; (iii) $\\angle A = \\angle P$, $AB = PQ$, $\\angle B = \\angle Q$?',
        ['(i) is AAA – only similar.', '(ii) has the angle at $A$, which is <b>not</b> between $AB$ and $BC$ (they meet at $B$) – SSA, not enough.', '(iii) has side $AB$ between angles $A$ and $B$ – ASA.'],
        '(iii)'),
      example('Example 4 – a short proof',
        '$ABCD$ is a kite with $AB = AD$ and $CB = CD$. Prove that triangles $ABC$ and $ADC$ are congruent.',
        ['$AB = AD$ (given).', '$CB = CD$ (given).', '$AC = AC$ (a common side – it belongs to both triangles).', 'All three pairs of sides are equal.'],
        'Triangles $ABC$ and $ADC$ are congruent (SSS)'),
      mistake('saying SAS when the angle is not between the two sides. Check that the angle is at the corner where the two sides meet.'),
      note('Congruent triangles can be reflections of each other – that still counts.'),
      h('What next?'),
      p('Congruent triangles appear in proofs about [[geo-2d-properties|shapes]] and [[trig-circle-theorems|circles]].'),
    ].join(''),
  },
  {
    id: 'trig-similar-area-volume',
    title: 'Similar shapes: area and volume',
    skills: ['trig-similar-area-volume'],
    prereqs: ['trig-similar-lengths', 'geo-volume-prism', 'num-squares-roots'],
    summary: 'If lengths are multiplied by k, areas are multiplied by k² and volumes by k³ – and how to go backwards.',
    body: [
      h('The big idea'),
      p('Enlarge a $1 \\times 1$ square by scale factor $3$. Its sides become $3$, and it now holds $3 \\times 3 = 9$ of the original squares. A $1 \\times 1 \\times 1$ cube enlarged by $3$ holds $3 \\times 3 \\times 3 = 27$ of the original cubes. Area has two dimensions, volume has three.'),
      figure(scaleSquaresFig()),
      key('Length, area and volume factors', display('\\text{lengths} \\times k \\qquad \\text{areas} \\times k^2 \\qquad \\text{volumes} \\times k^3') + p('This works for any pair of [[trig-similar-lengths|similar]] shapes or solids, and for anything that depends on area (surface area, paint, fabric) or volume (capacity, mass of solid material).')),
      h('Method'),
      steps([
        'Find the length scale factor $k$ from a pair of matching lengths.',
        'For areas multiply by $k^2$; for volumes by $k^3$.',
        'Going backwards: if you are given an area factor, [[num-squares-roots|square root]] it to get $k$; if you are given a volume factor, cube root it.',
      ]),
      example('Example 1 – area',
        'Two similar shapes have matching lengths $4$ cm and $12$ cm. The smaller has area $20$ cm². Find the area of the larger.',
        ['$k = \\dfrac{12}{4} = 3$', 'Area factor $k^2 = 9$', '$20 \\times 9 = 180$'],
        '$180$ cm²'),
      example('Example 2 – volume',
        'Two similar cylinders have heights $4$ cm and $6$ cm. The smaller has volume $40$ cm³. Find the volume of the larger.',
        ['$k = \\dfrac{6}{4} = \\dfrac{3}{2}$', 'Volume factor $k^3 = \\dfrac{27}{8}$', '$40 \\times \\dfrac{27}{8} = 135$'],
        '$135$ cm³'),
      example('Example 3 – working backwards',
        'Two similar solids have volumes $54$ cm³ and $250$ cm³. The smaller is $6$ cm tall and has surface area $90$ cm². Find the height and the surface area of the larger.',
        ['Volume factor $= \\dfrac{250}{54} = \\dfrac{125}{27}$', 'Cube root: $k = \\dfrac{5}{3}$ (because $5^3 = 125$ and $3^3 = 27$).', 'Height: $6 \\times \\dfrac{5}{3} = 10$ cm.', 'Area factor $k^2 = \\dfrac{25}{9}$, so surface area $= 90 \\times \\dfrac{25}{9} = 250$ cm².'],
        '$10$ cm and $250$ cm²'),
      mistake('multiplying an area or volume by $k$. Doubling every length makes the area $4$ times as big and the volume $8$ times as big, not twice as big.'),
      note('A ratio version: if lengths are in the ratio $2 : 3$, areas are in the ratio $4 : 9$ and volumes in the ratio $8 : 27$.'),
      h('What next?'),
      p('Volumes and surface areas of the solids themselves: [[geo-cones-spheres]].'),
    ].join(''),
  },
  {
    id: 'trig-circle-parts',
    title: 'Parts of a circle',
    skills: ['trig-circle-parts'],
    prereqs: ['geo-2d-properties'],
    summary: 'The names radius, diameter, chord, tangent, arc, sector, segment and circumference.',
    body: [
      h('The words you need'),
      p('Circle questions use a small set of words. Learn them carefully – the circle theorems depend on them.'),
      figure(partsFigs(), 'Lines (left) and regions (right).'),
      key('Parts of a circle', list([
        '<b>Centre</b>: the point in the middle, the same distance from every point on the circle. It is often called $O$.',
        '<b>Circumference</b>: the curve itself, all the way round (also its length).',
        '<b>Radius</b>: a straight line from the centre to the circumference. All radii of a circle are equal.',
        '<b>Diameter</b>: a straight line across the circle through the centre. Diameter $= 2 \\times$ radius. It is the longest chord.',
        '<b>Chord</b>: a straight line joining two points on the circumference.',
        '<b>Tangent</b>: a straight line that touches the circle at exactly one point, without crossing it.',
        '<b>Arc</b>: part of the circumference.',
        '<b>Sector</b>: a region bounded by two radii and an arc – a "slice of pizza".',
        '<b>Segment</b>: a region bounded by a chord and an arc.',
      ])),
      example('Example 1', 'A circle has a diameter of $15$ cm. What is its radius?', ['The radius is half the diameter: $15 \\div 2 = 7.5$'], '$7.5$ cm'),
      example('Example 2', 'What is the name of the region between a chord and the arc it cuts off?', ['It is not bounded by radii, so it is not a sector.'], 'A segment'),
      mistake('mixing up <b>sector</b> and <b>segment</b>. A sector has two straight sides (radii) meeting at the centre; a segment has one straight side (a chord).'),
      note('Every radius is the same length. In circle theorem questions this means a triangle with two radii as sides is isosceles.'),
      h('What next?'),
      p('Use these words in [[trig-circle-theorems]], and for lengths and areas see [[geo-circles]] and [[geo-arcs-sectors]].'),
    ].join(''),
  },
  {
    id: 'trig-circle-theorems',
    title: 'Circle theorems',
    skills: ['trig-circle-theorems'],
    prereqs: ['trig-circle-parts', 'geo-angles-triangles', 'geo-angle-basics'],
    summary: 'The angle facts about circles, and how to quote them as reasons.',
    body: [
      h('The big idea'),
      p('Draw lines inside a circle and the angles they make obey a few fixed rules – the circle theorems. Exam questions ask you to find an angle <b>and give the reason</b>, so learn the wording too. Alongside them you still use the basic facts: [[geo-angles-triangles|angles in a triangle]] add up to $180^\\circ$, [[geo-angle-basics|angles on a straight line]] add up to $180^\\circ$, and a triangle with two radii as sides is isosceles.'),
      p('An angle <b>stands on</b> an arc (or chord) when the two lines that make the angle go to the two ends of that arc.'),
      key('The theorems', list([
        '<b>The angle at the centre is twice the angle at the circumference</b> (both standing on the same arc).',
        '<b>The angle in a semicircle is a right angle</b> (an angle standing on a diameter is $90^\\circ$).',
        '<b>Angles in the same segment are equal</b> (angles standing on the same chord, on the same side of it).',
        '<b>Opposite angles of a cyclic quadrilateral add up to $180^\\circ$</b> (a cyclic quadrilateral has all four corners on the circle).',
        '<b>A tangent and a radius meet at $90^\\circ$.</b>',
        '<b>Two tangents from the same point are equal in length.</b>',
        '<b>The perpendicular from the centre to a chord bisects the chord.</b>',
      ])),
      columns(figure(thmCentre(), 'Angle at the centre $= 2x$'), figure(thmSemi(), 'Angle in a semicircle'), figure(thmSegment(), 'Same segment')),
      columns(figure(thmCyclic(), 'Cyclic quadrilateral: $x + y = 180^\\circ$'), figure(thmTangent(), 'Tangent ⟂ radius'), figure(thmTwoTangents(), 'Equal tangents')),
      figure(thmChord(), 'The perpendicular from the centre bisects the chord: $AM = MB$.'),
      h('Where they come from'),
      p('Most of them follow from the first one. A semicircle is the case where the angle at the centre is a straight line, $180^\\circ$, so the angle at the circumference is half of that, $90^\\circ$. Two angles standing on the same chord are both half of the same angle at the centre, so they are equal. And the two opposite angles of a cyclic quadrilateral are halves of the two angles at the centre, which add up to $360^\\circ$ – so they add up to $180^\\circ$.'),
      h('Method'),
      steps(['Mark everything you know on the diagram, including radii (equal lengths) and right angles.', 'Look for the shapes: a diameter? an angle at the centre? four points on the circle? a tangent?', 'Find one angle at a time and write the reason next to it.']),
      example('Example 1 – centre and circumference',
        '$A$, $B$, $C$ are on a circle with centre $O$. Angle $ACB = 38^\\circ$. Find angle $AOB$.',
        ['The angle at the centre is twice the angle at the circumference: $2 \\times 38^\\circ = 76^\\circ$.'],
        '$76^\\circ$'),
      example('Example 2 – semicircle',
        '$AB$ is a diameter and $C$ is on the circle. Angle $CAB = 27^\\circ$. Find angle $ABC$.',
        ['The angle in a semicircle is $90^\\circ$, so angle $ACB = 90^\\circ$.', 'Angles in a triangle: $180^\\circ - 90^\\circ - 27^\\circ = 63^\\circ$.'],
        '$63^\\circ$'),
      example('Example 3 – cyclic quadrilateral',
        '$ABCD$ is a cyclic quadrilateral with angle $A = 112^\\circ$. Find angle $C$.',
        ['Opposite angles of a cyclic quadrilateral add up to $180^\\circ$: $180^\\circ - 112^\\circ = 68^\\circ$.'],
        '$68^\\circ$'),
      example('Example 4 – tangent',
        '$PA$ is a tangent at $A$ to a circle with centre $O$. Angle $AOP = 52^\\circ$. Find angle $APO$.',
        ['A tangent and a radius meet at $90^\\circ$, so angle $OAP = 90^\\circ$.', 'Angles in triangle $OAP$: $180^\\circ - 90^\\circ - 52^\\circ = 38^\\circ$.'],
        '$38^\\circ$'),
      example('Example 5 – equal tangents',
        '$PA$ and $PB$ are tangents from $P$ to a circle, and angle $APB = 40^\\circ$. Find angle $PAB$.',
        ['Tangents from the same point are equal, so $PA = PB$ and triangle $PAB$ is isosceles.', 'The base angles are equal: angle $PAB = (180^\\circ - 40^\\circ) \\div 2 = 70^\\circ$.'],
        '$70^\\circ$'),
      example('Example 6 – angles given as expressions',
        '$AB$ is a diameter and $C$ is on the circle. Angle $CAB = (3x + 18)^\\circ$ and angle $ABC = (x + 28)^\\circ$. Find $x$.',
        ['The angle in a semicircle is $90^\\circ$, so the other two angles add up to $90^\\circ$.', '$(3x + 18) + (x + 28) = 90$, so $4x + 46 = 90$.', '[[alg-solve-one-two-step|Solve]]: $4x = 44$, so $x = 11$. (Check: the angles are $51^\\circ$ and $39^\\circ$, which add to $90^\\circ$.)'],
        '$x = 11$'),
      mistake('halving when you should double (or the other way round). The angle at the <b>centre</b> is the <b>bigger</b> one.'),
      mistake('saying opposite angles of a cyclic quadrilateral are <b>equal</b>. They add up to $180^\\circ$.'),
      note('In the centre theorem both angles must stand on the same arc. If the point on the circumference is on the small arc, the matching angle at the centre is the <b>reflex</b> one.'),
      h('What next?'),
      p('Real exam questions chain several theorems together and add the alternate segment theorem: see [[trig-circle-theorems-multi]].'),
    ].join(''),
  },
  {
    id: 'trig-circle-theorems-multi',
    title: 'Multi-step circle theorems',
    skills: ['trig-circle-theorems-multi'],
    prereqs: ['trig-circle-theorems', 'geo-angles-triangles', 'geo-angle-basics'],
    summary: 'The alternate segment theorem, and how to chain circle theorems with isosceles triangles and tangents.',
    body: [
      h('One more theorem'),
      p('The <b>alternate segment theorem</b> links a tangent to the angles inside the circle. At the point $A$ where a tangent touches, draw a chord $AB$. The angle between the tangent and the chord equals the angle that $AB$ makes at any point $C$ on the circle on the <b>other</b> side of the chord (the "alternate segment").'),
      key('Alternate segment theorem', p('The angle between a tangent and a chord is equal to the angle in the alternate segment.') + display('\\angle TAB = \\angle ACB')),
      figure(altSegFig(() => 0, { a: 66, b: 50, c: 64 }, { TAB: '64°', C: '64°' }, { rotate: 0 }), '$ST$ is a tangent at $A$. The angle between the tangent and chord $AB$ equals angle $ACB$.'),
      h('Strategy for multi-step questions'),
      steps([
        'Copy the angles you are given onto a sketch.',
        'Look for <b>radii</b>: two radii make an isosceles triangle, so its base angles are equal.',
        'Look for <b>tangents</b>: tangent ⟂ radius, equal tangents, and the alternate segment theorem.',
        'Each time you find an angle, write it on the sketch with its reason. Keep going until you reach the one you want.',
      ]),
      example('Example 1 – alternate segment then triangle',
        '$ST$ is a tangent at $A$, and $B$ and $C$ are on the circle. Angle $TAB = 64^\\circ$ and angle $ABC = 50^\\circ$. Find angle $BAC$.',
        ['Alternate segment theorem: angle $ACB = 64^\\circ$.', 'Angles in triangle $ABC$: angle $BAC = 180^\\circ - 64^\\circ - 50^\\circ = 66^\\circ$.'],
        '$66^\\circ$'),
      example('Example 2 – two tangents',
        '$PA$ and $PB$ are tangents to a circle with centre $O$, and $C$ is on the major arc. Angle $APB = 48^\\circ$. Find angle $ACB$.',
        ['Tangent ⟂ radius, so angles $OAP$ and $OBP$ are both $90^\\circ$.', 'Angles in quadrilateral $OAPB$ add up to $360^\\circ$: angle $AOB = 360^\\circ - 90^\\circ - 90^\\circ - 48^\\circ = 132^\\circ$.', 'Angle at the centre is twice the angle at the circumference: angle $ACB = 132^\\circ \\div 2 = 66^\\circ$.'],
        '$66^\\circ$'),
      example('Example 3 – an isosceles triangle of radii',
        '$A$, $B$ and $C$ are on a circle with centre $O$. Angle $BAC = 34^\\circ$. Find angle $OBC$.',
        ['Angle at the centre: angle $BOC = 2 \\times 34^\\circ = 68^\\circ$.', '$OB = OC$ (radii), so triangle $OBC$ is isosceles.', 'Angle $OBC = (180^\\circ - 68^\\circ) \\div 2 = 56^\\circ$.'],
        '$56^\\circ$'),
      example('Example 4 – exterior angle of a cyclic quadrilateral',
        '$ABCD$ is a cyclic quadrilateral and $DC$ is extended to $E$. Angle $DAB = 70^\\circ$. Find angle $BCE$.',
        ['Opposite angles of a cyclic quadrilateral: angle $BCD = 180^\\circ - 70^\\circ = 110^\\circ$.', 'Angles on a straight line: angle $BCE = 180^\\circ - 110^\\circ = 70^\\circ$.'],
        '$70^\\circ$'),
      mistake('using the alternate segment theorem with the wrong angle. The equal angle is on the <b>far</b> side of the chord from the tangent angle you started with.'),
      note('Example 4 shows a useful shortcut: the exterior angle of a cyclic quadrilateral equals the interior angle opposite.'),
      h('What next?'),
      p('Check the basics again in [[trig-circle-theorems]]; isosceles triangles and angles in quadrilaterals are in [[geo-angles-triangles]].'),
    ].join(''),
  },
  {
    id: 'trig-column-vectors',
    title: 'Column vectors',
    skills: ['trig-column-vectors'],
    prereqs: ['geo-translation', 'gr-coordinates', 'num-negatives'],
    summary: 'Write movements as column vectors, and add, subtract and multiply them.',
    body: [
      h('The big idea'),
      p('A <b>vector</b> is a movement: a distance in a direction. You have met them in [[geo-translation|translations]]. A <b>column vector</b> writes the movement as two numbers stacked up: how far across (right is positive) and how far up (up is positive).'),
      key('Column vectors', display('\\begin{pmatrix} 3 \\\\ -1 \\end{pmatrix} = \\text{3 right, 1 down}') + p('Vectors are written in bold, $\\mathbf{a}$ (by hand, underline it). To add or subtract, work on the top numbers and the bottom numbers separately. To multiply by a number, multiply both.')
        + display('\\begin{pmatrix} 3 \\\\ -1 \\end{pmatrix} + \\begin{pmatrix} -2 \\\\ 4 \\end{pmatrix} = \\begin{pmatrix} 1 \\\\ 3 \\end{pmatrix} \\qquad 2\\begin{pmatrix} 3 \\\\ -1 \\end{pmatrix} = \\begin{pmatrix} 6 \\\\ -2 \\end{pmatrix}')),
      h('Why adding works'),
      p('Adding vectors means doing one movement and then the other: put them "nose to tail". Going 3 right and 1 down, then 2 left and 4 up, leaves you 1 right and 3 up altogether.'),
      figure(vectorGrid({ cols: 8, rows: 9, unitPx: 26, vectors: [{ from: [1, 5], to: [4, 4], label: 'a', side: 1 }, { from: [4, 4], to: [2, 8], label: 'b', color: ACCENT2, side: 1 }, { from: [1, 5], to: [2, 8], label: 'a + b', color: 'currentColor', side: -1 }] }), '$\\mathbf{a}$ followed by $\\mathbf{b}$ takes you to the same place as $\\mathbf{a} + \\mathbf{b}$.'),
      h('Method'),
      steps(['Multiply each vector by its number first (both components).', 'Then add or subtract the top numbers, and the bottom numbers.', 'Take care with negatives: subtracting a negative is adding.']),
      example('Example 1',
        '$\\mathbf{a} = \\begin{pmatrix} 3 \\\\ -1 \\end{pmatrix}$ and $\\mathbf{b} = \\begin{pmatrix} -2 \\\\ 4 \\end{pmatrix}$. Work out $\\mathbf{a} - \\mathbf{b}$.',
        ['Top: $3 - (-2) = 5$. Bottom: $-1 - 4 = -5$.'],
        '$\\begin{pmatrix} 5 \\\\ -5 \\end{pmatrix}$'),
      example('Example 2',
        'With the same vectors, work out $3\\mathbf{a} - 2\\mathbf{b}$.',
        ['$3\\mathbf{a} = \\begin{pmatrix} 9 \\\\ -3 \\end{pmatrix}$ and $2\\mathbf{b} = \\begin{pmatrix} -4 \\\\ 8 \\end{pmatrix}$', 'Top: $9 - (-4) = 13$. Bottom: $-3 - 8 = -11$.'],
        '$\\begin{pmatrix} 13 \\\\ -11 \\end{pmatrix}$'),
      example('Example 3 – a translation',
        'Which vector translates the point $(-2, 7)$ to the point $(3, -1)$?',
        ['Vector = end − start. Across: $3 - (-2) = 5$. Up: $-1 - 7 = -8$.'],
        '$\\begin{pmatrix} 5 \\\\ -8 \\end{pmatrix}$'),
      example('Example 4 – finding the multiples',
        '$\\mathbf{a} = \\begin{pmatrix} 2 \\\\ 1 \\end{pmatrix}$ and $\\mathbf{b} = \\begin{pmatrix} -1 \\\\ 3 \\end{pmatrix}$. Find $m$ and $n$ so that $m\\mathbf{a} + n\\mathbf{b} = \\begin{pmatrix} -8 \\\\ 10 \\end{pmatrix}$.',
        ['Top row: $2m - n = -8$. Bottom row: $m + 3n = 10$. These are [[alg-simultaneous-linear|simultaneous equations]].', 'From the top row, $n = 2m + 8$. Substitute: $m + 3(2m + 8) = 10$, so $7m + 24 = 10$ and $m = -2$.', 'Then $n = 2(-2) + 8 = 4$. Check: $-2\\begin{pmatrix} 2 \\\\ 1 \\end{pmatrix} + 4\\begin{pmatrix} -1 \\\\ 3 \\end{pmatrix} = \\begin{pmatrix} -8 \\\\ 10 \\end{pmatrix}$ ✓'],
        '$m = -2$, $n = 4$'),
      mistake('swapping the numbers: the top number is always the movement <b>across</b>.'),
      note('The vector that undoes a movement is the negative: if $\\begin{pmatrix} 4 \\\\ -3 \\end{pmatrix}$ takes $A$ to $B$, then $\\begin{pmatrix} -4 \\\\ 3 \\end{pmatrix}$ takes $B$ back to $A$.'),
      h('What next?'),
      p('Using letters $\\mathbf{a}$ and $\\mathbf{b}$ for sides of shapes: [[trig-vector-geometry]].'),
    ].join(''),
  },
  {
    id: 'trig-vector-geometry',
    title: 'Vector geometry',
    skills: ['trig-vector-geometry'],
    prereqs: ['trig-column-vectors', 'rat-share', 'alg-simplify'],
    summary: 'Write vectors in terms of a and b by finding routes, use ratios along lines, and show lines are parallel.',
    body: [
      h('The big idea'),
      p('In vector geometry the sides of a shape are given as letters, such as $\\overrightarrow{OA} = \\mathbf{a}$ and $\\overrightarrow{OB} = \\mathbf{b}$. To find any other vector, find a <b>route</b> along vectors you know, just like adding [[trig-column-vectors|column vectors]] nose to tail.'),
      key('Rules', list([
        'Follow a route: $\\overrightarrow{AB} = \\overrightarrow{AO} + \\overrightarrow{OB}$.',
        'Going against an arrow changes the sign: $\\overrightarrow{AO} = -\\overrightarrow{OA} = -\\mathbf{a}$.',
        'A fraction of the way along a line is that fraction of its vector: if $P$ is $\\frac{1}{4}$ of the way from $A$ to $B$, then $\\overrightarrow{AP} = \\frac{1}{4}\\overrightarrow{AB}$.',
        'Two vectors are <b>parallel</b> if one is a multiple of the other.',
        'In a parallelogram, opposite sides are the same vector (same length, same direction): if $OABC$ is a parallelogram with $\\overrightarrow{OA} = \\mathbf{a}$ and $\\overrightarrow{OC} = \\mathbf{c}$, then $\\overrightarrow{CB} = \\mathbf{a}$ and $\\overrightarrow{AB} = \\mathbf{c}$.',
      ])),
      figure(fig({
        pts: { O: [0, 0], A: [3.2, 0], B: [1, 2.2], M: [2.1, 1.1] }, width: 340, height: 210,
        draw: (g) => g.poly('OAB', { fillOpacity: 0.45 }) + g.vhead('O', 'A') + g.vhead('O', 'B') + g.side('O', 'A', 'a', { bold: true, size: 16 }) + g.side('O', 'B', 'b', { bold: true, size: 16 })
          + g.seg('O', 'M', { dash: '5 4', color: ACCENT, width: 1.6 }) + g.dot('M') + g.name('M', 'M', { dir: [0.8, -0.6] }) + g.name('O', 'O', { dir: [-1, 0.5] }) + g.name('A', 'A', { dir: [1, 0.4] }) + g.name('B', 'B', { dir: [0, -1] }),
      }), '$\\overrightarrow{OA} = \\mathbf{a}$, $\\overrightarrow{OB} = \\mathbf{b}$ and $M$ is the midpoint of $AB$.'),
      h('Method'),
      steps(['Mark the given vectors on the diagram with their arrows.', 'Choose a route from the start to the end of the vector you want.', 'Add the vectors along the route (negative when you go against an arrow), then collect the $\\mathbf{a}$ terms and the $\\mathbf{b}$ terms.']),
      example('Example 1 – a route',
        'In triangle $OAB$, $\\overrightarrow{OA} = \\mathbf{a}$ and $\\overrightarrow{OB} = \\mathbf{b}$. Find $\\overrightarrow{AB}$.',
        ['Route $A \\to O \\to B$: $\\overrightarrow{AB} = -\\mathbf{a} + \\mathbf{b}$'],
        '$\\mathbf{b} - \\mathbf{a}$'),
      example('Example 2 – a midpoint',
        '$M$ is the midpoint of $AB$. Find $\\overrightarrow{OM}$.',
        ['$\\overrightarrow{AM} = \\frac{1}{2}\\overrightarrow{AB} = \\frac{1}{2}(\\mathbf{b} - \\mathbf{a})$', '$\\overrightarrow{OM} = \\overrightarrow{OA} + \\overrightarrow{AM} = \\mathbf{a} + \\frac{1}{2}\\mathbf{b} - \\frac{1}{2}\\mathbf{a} = \\frac{1}{2}\\mathbf{a} + \\frac{1}{2}\\mathbf{b}$'],
        '$\\frac{1}{2}\\mathbf{a} + \\frac{1}{2}\\mathbf{b}$'),
      example('Example 3 – a ratio',
        '$P$ is on $AB$ with $AP : PB = 1 : 3$. Find $\\overrightarrow{OP}$.',
        ['The ratio has $1 + 3 = 4$ parts ([[rat-share|sharing in a ratio]]), so $P$ is $\\frac{1}{4}$ of the way from $A$ to $B$.', '$\\overrightarrow{OP} = \\mathbf{a} + \\frac{1}{4}(\\mathbf{b} - \\mathbf{a}) = \\frac{3}{4}\\mathbf{a} + \\frac{1}{4}\\mathbf{b}$'],
        '$\\frac{3}{4}\\mathbf{a} + \\frac{1}{4}\\mathbf{b}$'),
      example('Example 4 – parallel and on a straight line',
        '$\\overrightarrow{OP} = 2\\mathbf{a} + \\mathbf{b}$ and $\\overrightarrow{OQ} = 6\\mathbf{a} + 3\\mathbf{b}$. Show that $O$, $P$ and $Q$ lie on a straight line.',
        ['$6\\mathbf{a} + 3\\mathbf{b} = 3(2\\mathbf{a} + \\mathbf{b})$, so $\\overrightarrow{OQ} = 3\\overrightarrow{OP}$.', 'The vectors are parallel and both start at $O$, so the points are on one straight line.'],
        '$\\overrightarrow{OQ} = 3\\overrightarrow{OP}$, so $O$, $P$ and $Q$ are <b>collinear</b> (they lie on one straight line)'),
      example('Example 5 – a parallelogram',
        '$OABC$ is a parallelogram with $\\overrightarrow{OA} = \\mathbf{a}$ and $\\overrightarrow{OC} = \\mathbf{c}$. $M$ is the midpoint of $AB$. Find $\\overrightarrow{CM}$.',
        ['Opposite sides: $\\overrightarrow{CB} = \\mathbf{a}$ and $\\overrightarrow{BA} = -\\mathbf{c}$, so $\\overrightarrow{BM} = -\\frac{1}{2}\\mathbf{c}$.', 'Route $C \\to B \\to M$: $\\overrightarrow{CM} = \\mathbf{a} - \\frac{1}{2}\\mathbf{c}$'],
        '$\\mathbf{a} - \\frac{1}{2}\\mathbf{c}$'),
      example('Example 6 – find k',
        '$\\overrightarrow{XY} = 4\\mathbf{a} + 6\\mathbf{b}$ and $\\overrightarrow{XZ} = 2\\mathbf{a} + k\\mathbf{b}$. $X$, $Y$ and $Z$ are collinear. Find $k$.',
        ['Collinear means $\\overrightarrow{XY}$ is a multiple of $\\overrightarrow{XZ}$. Comparing the $\\mathbf{a}$ parts, $4 = 2 \\times 2$, so $\\overrightarrow{XY} = 2\\overrightarrow{XZ}$.', 'The $\\mathbf{b}$ parts must match too: $6 = 2k$.'],
        '$k = 3$'),
      mistake('getting the direction the wrong way round: $\\overrightarrow{AB} = \\mathbf{b} - \\mathbf{a}$, but $\\overrightarrow{BA} = \\mathbf{a} - \\mathbf{b}$.'),
      mistake('using $\\frac{1}{3}$ for the ratio $1 : 3$. A ratio $m : n$ splits the line into $m + n$ parts.'),
      note('Sense check with numbers: if $\\mathbf{a}$ and $\\mathbf{b}$ were column vectors, your answer should give the same movement as following the route.'),
      h('What next?'),
      p('Back to the basics: [[trig-column-vectors]].'),
    ].join(''),
  },
];

void [FILL, ACCENT, rect];
