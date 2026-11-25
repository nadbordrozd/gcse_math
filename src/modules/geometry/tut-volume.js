// Learn pages for the Volume and surface area unit. See docs/TUTORIAL_GUIDELINES.md.
import { h, p, list, steps, key, display, note, mistake, figure, columns, example, tbl } from '../../tutorial-kit.js';
import { svg, polygon, text, FILL, SHADE } from './diagrams.js';
import { cuboidFig, prismFig, cylinderFig, coneFig, sphereFig, hemisphereFig, pyramidFig, isoStack } from './solids.js';

const lab = (v, u = 'cm') => `${v} ${u}`;

function cubesFig() {
  const hts = [[3, 3, 3, 3], [3, 3, 3, 3]];
  const st = isoStack(hts, { W: 300, H: 200, s: 24 });
  return svg(st.width, st.height, st.body, { maxWidth: 300, label: 'Cuboid of cubes' });
}
function cylinderNetFig() {
  // net of a cylinder: two circles and a rectangle 2*pi*r by h
  const r = 26; const w = 2 * Math.PI * r; const hh = 80; const x0 = 30; const y0 = 70;
  let body = polygon([[x0, y0], [x0 + w, y0], [x0 + w, y0 + hh], [x0, y0 + hh]], { fill: FILL });
  body += `<circle cx="${x0 + w / 2}" cy="${y0 - r}" r="${r}" fill="${SHADE}" stroke="currentColor" stroke-width="2"/><circle cx="${x0 + w / 2}" cy="${y0 + hh + r}" r="${r}" fill="${SHADE}" stroke="currentColor" stroke-width="2"/>`;
  body += text(x0 + w / 2, y0 + hh / 2, 'length = circumference = 2πr', { size: 12 }) + text(x0 + w + 16, y0 + hh / 2, 'h', { size: 14, italic: true });
  return svg(x0 + w + 40, y0 + hh + 2 * r + 10, body, { maxWidth: 260, label: 'Net of a cylinder' });
}

export const volumeTutorials = [
  {
    id: 'geo-volume-cuboid',
    title: 'Volume of cubes and cuboids',
    skills: ['geo-volume-cuboid'],
    prereqs: ['geo-3d-properties', 'geo-area-basic'],
    summary: 'Find the volume of a cuboid, work backwards to a missing length, and convert to litres.',
    body: [
      h('The big idea'),
      p('<b>Volume</b> is the amount of space inside a 3D shape: how many unit cubes fill it. A cube $1$ cm along each edge has volume $1$ cm³ ("cubic centimetre").'),
      figure(cubesFig(), 'A $4 \\times 2$ layer of cubes, stacked 3 layers high: $8 \\times 3 = 24$ cubes.'),
      p('Each layer has length × width cubes, and there are "height" layers – so volume = length × width × height.'),
      key('Cuboid', display('V = \\text{length} \\times \\text{width} \\times \\text{height}') + p('A cube with edge $s$: $V = s^3$. Units are cubed: cm³, m³. Capacity: $1$ litre $= 1000$ cm³.')),
      steps(['Check all three lengths are in the same units.', 'Multiply them together.', 'Working backwards: divide the volume by the product of the two lengths you know.']),
      example('Example 1', 'Find the volume of the cuboid.', ['$8 \\times 5 \\times 3 = 120$'], '$120$ cm³', { visual: cuboidFig(8, 5, 3, { labels: [lab(8), lab(5), lab(3)] }) }),
      example('Example 2 – capacity', 'A fish tank is $50$ cm long, $40$ cm wide and $30$ cm tall. How many litres does it hold?', [
        'Volume $= 50 \\times 40 \\times 30 = 60\\,000$ cm³.', '$1$ litre $= 1000$ cm³, so $60\\,000 \\div 1000 = 60$ litres.',
      ], '$60$ litres'),
      example('Example 3 – a missing length', 'A cuboid has volume $180$ cm³. Its length is $6$ cm and its width is $5$ cm. Find its height.', [
        '$6 \\times 5 \\times h = 180$, so $30h = 180$.', '$h = 180 \\div 30 = 6$',
      ], '$6$ cm'),
      example('Example 4 – how many fit?', 'How many $2$ cm cubes fit inside a box $7$ cm by $5$ cm by $5$ cm?', [
        'Along each edge, only <b>whole</b> cubes fit: $7 \\div 2 \\to 3$, $5 \\div 2 \\to 2$, $5 \\div 2 \\to 2$.', '$3 \\times 2 \\times 2 = 12$',
        'Dividing the volumes ($175 \\div 8 = 21.875$) gives too many, because of the gaps at the edges.',
      ], '12 cubes'),
      mistake('adding the three lengths, or confusing volume with [[geo-surface-area|surface area]] (the total area of the faces).'),
      h('What next?'),
      p('Other prisms and cylinders work the same way: [[geo-volume-prism]].'),
    ].join(''),
  },
  {
    id: 'geo-volume-prism',
    title: 'Volume of prisms and cylinders',
    skills: ['geo-volume-prism'],
    prereqs: ['geo-volume-cuboid', 'geo-area-trapezium-compound', 'geo-circles'],
    summary: 'Volume = area of cross-section × length, for any prism including cylinders.',
    body: [
      h('The big idea'),
      p('A <b>prism</b> has the same cross-section all the way through – slice it anywhere and you get the same shape. A cuboid is a prism with a rectangle cross-section; a cylinder is a "prism" with a circle cross-section. In each case the solid is the cross-section stacked up along the length.'),
      key('Prisms', display('V = \\text{area of cross-section} \\times \\text{length}') + display('\\text{cylinder: } V = \\pi r^2 h')),
      columns(figure(prismFig([[0, 0], [6, 0], [0, 8]], 12, { labels: [{ a: [0, 0, 0], b: [6, 0, 0], text: lab(6) }, { a: [0, 0, 0], b: [0, 8, 0], text: lab(8) }, { a: [6, 0, 0], b: [6, 0, 12], text: lab(12), away: [0, 8, 0] }], depthScale: 0.6, rightAngles: [[0, 1, 2]], W: 260, H: 220 }), 'A triangular prism'),
        figure(cylinderFig({ rLabel: '4 cm', hLabel: '10 cm', ratio: 1.25, W: 240, H: 240, nda: false }), 'A cylinder')),
      steps(['Identify the cross-section (the face that is the same all the way through).', 'Find its area: [[geo-area-basic|triangle, rectangle]], [[geo-area-trapezium-compound|trapezium or compound shape]], or [[geo-circles|circle]].', 'Multiply by the length (or height) of the prism.']),
      example('Example 1 – triangular prism', 'Find the volume of the triangular prism above.', [
        'Cross-section: a right-angled triangle, area $\\frac{1}{2} \\times 6 \\times 8 = 24$ cm².', 'Volume $= 24 \\times 12 = 288$',
      ], '$288$ cm³'),
      example('Example 2 – cylinder', 'Find the volume of the cylinder above, to 1 decimal place.', [
        'Cross-section: a circle, area $\\pi \\times 4^2 = 16\\pi$ cm².', 'Volume $= 16\\pi \\times 10 = 160\\pi = 502.65\\ldots$',
      ], '$502.7$ cm³ (or $160\\pi$ cm³)'),
      example('Example 3 – working backwards', 'A cylinder has radius $5$ cm and volume $500$ cm³. Find its height to 1 decimal place.', [
        '$\\pi \\times 5^2 \\times h = 500$, so $25\\pi h = 500$.', '$h = \\dfrac{500}{25\\pi} = 6.366\\ldots$',
      ], '$6.4$ cm'),
      mistake('using the sloping side of a triangle, or the diameter instead of the radius in $\\pi r^2$.'),
      h('What next?'),
      p('The outside of a prism: [[geo-surface-area]]. Shapes that come to a point: [[geo-cones-spheres]].'),
    ].join(''),
  },
  {
    id: 'geo-surface-area',
    title: 'Surface area',
    skills: ['geo-surface-area'],
    prereqs: ['geo-volume-cuboid', 'geo-area-basic', 'geo-3d-properties'],
    summary: 'Find the surface area of cuboids, prisms and cylinders by adding the areas of their faces.',
    body: [
      h('The big idea'),
      p('The <b>surface area</b> is the total area of all the faces – the amount of paper needed to wrap the solid, or of paint to cover it. Unfold the solid into its [[geo-3d-properties|net]] and add up the areas of the pieces. It is an area, so the units are cm², m².'),
      key('Surface area', list([
        'Cuboid: $2(lw + wh + lh)$ – three pairs of matching rectangles.',
        'Prism: two ends + one rectangle for each side of the cross-section.',
        'Cylinder: two circles + a curved surface. Unrolled, the curved surface is a rectangle $2\\pi r$ long and $h$ high, so its area is $2\\pi r h$.',
      ]) + display('\\text{cylinder: } SA = 2\\pi r^2 + 2\\pi r h')),
      figure(cylinderNetFig(), 'The curved surface unrolls to a rectangle.'),
      steps(['List every face (the net helps), including hidden ones.', 'Find each area.', 'Add them up. Leave out faces the question says are missing (e.g. an open box).']),
      example('Example 1 – cuboid', 'Find the surface area of a cuboid $5$ cm by $4$ cm by $3$ cm.', [
        'Pairs of faces: $5 \\times 4 = 20$, $4 \\times 3 = 12$, $5 \\times 3 = 15$.', 'Total $= 2 \\times (20 + 12 + 15) = 2 \\times 47 = 94$',
      ], '$94$ cm²'),
      example('Example 2 – triangular prism', 'A prism has a right-angled triangle cross-section with sides $3$, $4$ and $5$ cm, and length $10$ cm. Find its surface area.', [
        'Two triangles: $2 \\times \\frac{1}{2} \\times 3 \\times 4 = 12$.', 'Three rectangles, one for each side: $(3 + 4 + 5) \\times 10 = 120$.', 'Total $= 12 + 120 = 132$',
      ], '$132$ cm²', { visual: prismFig([[0, 0], [3, 0], [0, 4]], 10, { labels: [{ a: [0, 0, 0], b: [3, 0, 0], text: lab(3) }, { a: [0, 0, 0], b: [0, 4, 0], text: lab(4) }, { a: [3, 0, 0], b: [0, 4, 0], text: lab(5), away: [3, 4, 0] }, { a: [3, 0, 0], b: [3, 0, 10], text: lab(10), away: [0, 4, 0] }], depthScale: 0.5, rightAngles: [[0, 1, 2]], W: 300, H: 220 }) }),
      example('Example 3 – cylinder', 'Find the total surface area of a cylinder with radius $3$ cm and height $8$ cm, to 1 decimal place.', [
        'Two ends: $2 \\times \\pi \\times 3^2 = 18\\pi$.', 'Curved surface: $2 \\times \\pi \\times 3 \\times 8 = 48\\pi$.', 'Total $= 66\\pi = 207.345\\ldots$',
      ], '$207.3$ cm²'),
      mistake('counting only the three faces you can see on a cuboid – there are six.'),
      h('What next?'),
      p('Cones and spheres: [[geo-cones-spheres]].'),
    ].join(''),
  },
  {
    id: 'geo-cones-spheres',
    title: 'Cones, spheres and pyramids',
    skills: ['geo-cones-spheres'],
    prereqs: ['geo-volume-prism', 'geo-surface-area', 'trig-pythagoras'],
    summary: 'Use the formulae for the volume and surface area of cones, spheres, hemispheres and pyramids.',
    body: [
      h('The big idea'),
      p('A pyramid or cone comes to a point. It fits inside the prism with the same base and height – and it turns out to fill exactly <b>one third</b> of it. Spheres have their own formulae. You don’t need to remember the cone and sphere formulae: the exam gives them. You do need to know how to use them.'),
      key('Formulae', tbl([
        ['Solid', 'Volume', 'Surface area'],
        ['Pyramid', '$\\frac{1}{3} \\times \\text{base area} \\times h$', 'add the faces'],
        ['Cone', '$\\frac{1}{3}\\pi r^2 h$', 'curved: $\\pi r l$ (plus base $\\pi r^2$)'],
        ['Sphere', '$\\frac{4}{3}\\pi r^3$', '$4\\pi r^2$'],
        ['Hemisphere', '$\\frac{2}{3}\\pi r^3$', 'curved $2\\pi r^2$ + flat $\\pi r^2$ = $3\\pi r^2$'],
      ]) + p('$h$ is the <b>perpendicular</b> height; $l$ is the <b>slant</b> height of a cone (along the sloping side).')),
      columns(figure(coneFig({ rLabel: 'r', hLabel: 'h', lLabel: 'l', ratio: 2.4, W: 220, H: 240, nda: false }), 'Cone: $r$, $h$ and $l$'), figure(sphereFig({ rLabel: 'r', W: 200, H: 200, nda: false }), 'Sphere'), figure(hemisphereFig({ rLabel: 'r', W: 220, H: 180, nda: false }), 'Hemisphere')),
      p('The radius, the perpendicular height and the slant height of a cone make a right-angled triangle, so $l^2 = r^2 + h^2$ ([[trig-pythagoras|Pythagoras]]).'),
      steps(['Write down the formula and the values of $r$, $h$ or $l$.', 'If you have the wrong height, use Pythagoras first.', 'Substitute, keep $\\pi$ until the end, and round at the end (or leave in terms of $\\pi$).', 'Halve for a hemisphere – but its total surface area also includes the flat circle.']),
      example('Example 1 – sphere', 'A sphere has radius $6$ cm. Find its volume and surface area, to 1 decimal place.', [
        '$V = \\frac{4}{3} \\times \\pi \\times 6^3 = \\frac{4}{3} \\times 216\\pi = 288\\pi = 904.77\\ldots$',
        '$SA = 4 \\times \\pi \\times 6^2 = 144\\pi = 452.38\\ldots$',
      ], '$V = 904.8$ cm³, $SA = 452.4$ cm²'),
      example('Example 2 – cone using Pythagoras', 'A cone has base radius $5$ cm and perpendicular height $12$ cm. Find its volume and its total surface area in terms of $\\pi$.', [
        '$V = \\frac{1}{3} \\times \\pi \\times 5^2 \\times 12 = 100\\pi$',
        'Slant height: $l = \\sqrt{5^2 + 12^2} = \\sqrt{169} = 13$',
        'Curved surface $= \\pi \\times 5 \\times 13 = 65\\pi$; base $= \\pi \\times 5^2 = 25\\pi$; total $= 90\\pi$',
      ], '$V = 100\\pi$ cm³, $SA = 90\\pi$ cm²', { visual: coneFig({ rLabel: '5 cm', hLabel: '12 cm', ratio: 2.4, W: 260, H: 260 }) }),
      example('Example 3 – pyramid', 'A pyramid has a square base $6$ cm by $6$ cm and perpendicular height $10$ cm. Find its volume.', [
        'Base area $= 6 \\times 6 = 36$ cm².', '$V = \\frac{1}{3} \\times 36 \\times 10 = 120$',
      ], '$120$ cm³', { visual: pyramidFig({ aLabel: '6 cm', bLabel: '6 cm', hLabel: '10 cm', ratio: 1.6 }) }),
      example('Example 4 – hemisphere', 'A solid hemisphere has radius $3$ cm. Find its volume and total surface area in terms of $\\pi$.', [
        'Volume: half of $\\frac{4}{3}\\pi \\times 27 = 36\\pi$, so $18\\pi$.', 'Surface: curved $2\\pi \\times 9 = 18\\pi$ plus flat $\\pi \\times 9 = 9\\pi$: $27\\pi$.',
      ], '$V = 18\\pi$ cm³, $SA = 27\\pi$ cm²'),
      mistake('using the slant height in the volume of a cone, or forgetting the $\\frac{1}{3}$.'),
      note('For composite solids (a cone on a hemisphere, a cylinder with a dome), find each part separately and add.'),
      h('What next?'),
      p('How volumes change when a shape is enlarged: [[trig-similar-area-volume]].'),
    ].join(''),
  },
];

void tbl;
