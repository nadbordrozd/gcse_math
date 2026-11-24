export const units = [
  {
    id: 'trig-pythagoras', area: 'geometry', title: "Pythagoras' theorem",
    blurb: "Using Pythagoras' theorem in 2D and 3D.",
    skills: [
      { id: 'trig-pythagoras', title: "Pythagoras' theorem", grade: 4, prereqs: ['num-squares-roots', 'num-calculator'], summary: 'Find the hypotenuse or a shorter side of a right-angled triangle.' },
      { id: 'trig-pythagoras-problems', title: "Pythagoras problems", grade: 5, prereqs: ['trig-pythagoras'], summary: 'Use Pythagoras in context: ladders, rectangles, isosceles triangles, distance between points.' },
      { id: 'trig-3d', title: 'Pythagoras and trigonometry in 3D', grade: 8, prereqs: ['trig-pythagoras-problems', 'trig-sohcahtoa-angle'], summary: 'Find lengths and angles in cuboids, pyramids and prisms.' },
    ],
  },
  {
    id: 'trig-trig', area: 'geometry', title: 'Trigonometry',
    blurb: 'SOHCAHTOA, exact values, the sine and cosine rules.',
    skills: [
      { id: 'trig-sohcahtoa-side', title: 'Trigonometry: finding a side', grade: 5, prereqs: ['trig-pythagoras', 'alg-solve-one-two-step'], summary: 'Use sin, cos and tan to find a missing side in a right-angled triangle.' },
      { id: 'trig-sohcahtoa-angle', title: 'Trigonometry: finding an angle', grade: 6, prereqs: ['trig-sohcahtoa-side'], summary: 'Use inverse sin, cos and tan to find a missing angle.' },
      { id: 'trig-exact-values', title: 'Exact trig values', grade: 6, prereqs: ['trig-sohcahtoa-side'], summary: 'Know sin, cos and tan of 0°, 30°, 45°, 60° and 90°.' },
      { id: 'trig-sine-rule', title: 'The sine rule', grade: 7, prereqs: ['trig-sohcahtoa-angle'], summary: 'Find sides and angles in any triangle with the sine rule.' },
      { id: 'trig-cosine-rule', title: 'The cosine rule', grade: 7, prereqs: ['trig-sohcahtoa-angle'], summary: 'Find sides and angles in any triangle with the cosine rule.' },
      { id: 'trig-area-sine', title: 'Area of a triangle using ½ab sin C', grade: 7, prereqs: ['trig-sohcahtoa-side'], summary: 'Find the area of any triangle from two sides and the included angle, work backwards from an area, and find segment areas.' },
      { id: 'trig-sine-cosine-problems', title: 'Sine and cosine rule problems', grade: 8, prereqs: ['trig-sine-rule', 'trig-cosine-rule', 'trig-area-sine'], summary: 'Choose the right rule and combine rules in multi-step problems: quadrilaterals, bearings and real-life triangles.' },
    ],
  },
  {
    id: 'trig-similarity', area: 'geometry', title: 'Similarity and congruence',
    blurb: 'Congruent triangles and similar shapes, lengths, areas and volumes.',
    skills: [
      { id: 'trig-similar-lengths', title: 'Similar shapes: lengths', grade: 5, prereqs: ['rat-simplify', 'geo-enlargement'], summary: 'Find missing lengths in similar shapes using a scale factor.' },
      { id: 'trig-congruence', title: 'Congruent triangles', grade: 6, prereqs: ['geo-2d-properties', 'geo-angles-triangles'], summary: 'Use the conditions SSS, SAS, ASA and RHS.' },
      { id: 'trig-similar-area-volume', title: 'Similar shapes: area and volume', grade: 8, prereqs: ['trig-similar-lengths', 'geo-volume-prism'], summary: 'Use area factor k² and volume factor k³.' },
    ],
  },
  {
    id: 'trig-circles', area: 'geometry', title: 'Circle theorems',
    blurb: 'Parts of a circle and the circle theorems.',
    skills: [
      { id: 'trig-circle-parts', title: 'Parts of a circle', grade: 2, prereqs: ['geo-2d-properties'], summary: 'Radius, diameter, chord, tangent, arc, sector and segment.' },
      { id: 'trig-circle-theorems', title: 'Circle theorems', grade: 7, prereqs: ['trig-circle-parts', 'geo-angles-triangles'], summary: 'Angle at the centre, angles in the same segment, angle in a semicircle, cyclic quadrilaterals, tangents.' },
      { id: 'trig-circle-theorems-multi', title: 'Multi-step circle theorems', grade: 8, prereqs: ['trig-circle-theorems', 'geo-parallel-lines'], summary: 'Combine circle theorems, including the alternate segment theorem.' },
    ],
  },
  {
    id: 'trig-vectors', area: 'geometry', title: 'Vectors',
    blurb: 'Column vectors and vector geometry.',
    skills: [
      { id: 'trig-column-vectors', title: 'Column vectors', grade: 5, prereqs: ['geo-translation'], summary: 'Add, subtract and multiply column vectors by a scalar.' },
      { id: 'trig-vector-geometry', title: 'Vector geometry', grade: 8, prereqs: ['trig-column-vectors', 'rat-share'], summary: 'Write vectors in terms of a and b and show lines are parallel or points collinear.' },
    ],
  },
];
