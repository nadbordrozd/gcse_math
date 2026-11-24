export const units = [
  {
    id: 'geo-angles', area: 'geometry', title: 'Angles',
    blurb: 'Angle facts, parallel lines, polygons and bearings.',
    skills: [
      { id: 'geo-angle-basics', title: 'Angle facts', grade: 1, prereqs: [], summary: 'Angles on a straight line, around a point and vertically opposite; types of angle.' },
      { id: 'geo-angles-triangles', title: 'Angles in triangles and quadrilaterals', grade: 2, prereqs: ['geo-angle-basics'], summary: 'Use angle sums of triangles and quadrilaterals, including isosceles triangles.' },
      { id: 'geo-parallel-lines', title: 'Angles in parallel lines', grade: 4, prereqs: ['geo-angles-triangles'], summary: 'Use alternate, corresponding and co-interior angles with reasons.' },
      { id: 'geo-polygon-angles', title: 'Angles in polygons', grade: 4, prereqs: ['geo-angles-triangles'], summary: 'Interior and exterior angles of polygons, including regular polygons.' },
      { id: 'geo-bearings', title: 'Bearings', grade: 5, prereqs: ['geo-parallel-lines'], summary: 'Measure, calculate and use three-figure bearings.' },
    ],
  },
  {
    id: 'geo-shapes', area: 'geometry', title: 'Properties of shapes',
    blurb: 'Properties of 2D and 3D shapes, symmetry, plans and elevations, constructions and loci.',
    skills: [
      { id: 'geo-2d-properties', title: 'Properties of 2D shapes', grade: 1, prereqs: [], summary: 'Name and describe triangles, quadrilaterals and polygons.' },
      { id: 'geo-symmetry', title: 'Symmetry', grade: 1, prereqs: ['geo-2d-properties'], summary: 'Lines of symmetry and order of rotational symmetry.' },
      { id: 'geo-3d-properties', title: '3D shapes and nets', grade: 2, prereqs: ['geo-2d-properties'], summary: 'Faces, edges and vertices of 3D shapes, and their nets.' },
      { id: 'geo-plans-elevations', title: 'Plans and elevations', grade: 4, prereqs: ['geo-3d-properties'], summary: 'Match 3D solids to their plan, front elevation and side elevation.' },
      { id: 'geo-constructions-loci', title: 'Constructions and loci', grade: 5, prereqs: ['geo-angle-basics', 'geo-2d-properties'], summary: 'Recognise perpendicular bisectors, angle bisectors and loci of points.' },
    ],
  },
  {
    id: 'geo-area', area: 'geometry', title: 'Perimeter and area',
    blurb: 'Perimeter and area of polygons, circles, arcs and sectors.',
    skills: [
      { id: 'geo-perimeter', title: 'Perimeter', grade: 1, prereqs: ['num-written-methods'], summary: 'Perimeter of rectangles, triangles and compound shapes, including missing sides.' },
      { id: 'geo-area-basic', title: 'Area of rectangles, triangles and parallelograms', grade: 2, prereqs: ['geo-perimeter'], summary: 'Use the area formulae for rectangles, triangles and parallelograms.' },
      { id: 'geo-area-trapezium-compound', title: 'Trapezia and compound shapes', grade: 4, prereqs: ['geo-area-basic'], summary: 'Area of trapezia and of shapes made from rectangles and triangles.' },
      { id: 'geo-circles', title: 'Circumference and area of circles', grade: 4, prereqs: ['geo-area-basic', 'num-calculator'], summary: 'Circumference and area of circles and semicircles, including answers in terms of π.' },
      { id: 'geo-arcs-sectors', title: 'Arcs and sectors', grade: 6, prereqs: ['geo-circles', 'num-fraction-of-amount'], summary: 'Arc length, sector area and perimeter of a sector.' },
    ],
  },
  {
    id: 'geo-volume', area: 'geometry', title: 'Volume and surface area',
    blurb: 'Volume and surface area of cuboids, prisms, cylinders, cones and spheres.',
    skills: [
      { id: 'geo-volume-cuboid', title: 'Volume of cubes and cuboids', grade: 2, prereqs: ['geo-3d-properties', 'num-written-methods'], summary: 'Volume of cuboids, including finding a missing length.' },
      { id: 'geo-volume-prism', title: 'Volume of prisms and cylinders', grade: 4, prereqs: ['geo-volume-cuboid', 'geo-area-trapezium-compound', 'geo-circles'], summary: 'Volume = area of cross-section × length.' },
      { id: 'geo-surface-area', title: 'Surface area', grade: 5, prereqs: ['geo-volume-cuboid', 'geo-area-basic'], summary: 'Surface area of cuboids, prisms and cylinders.' },
      { id: 'geo-cones-spheres', title: 'Cones, spheres and pyramids', grade: 7, prereqs: ['geo-volume-prism', 'geo-surface-area'], summary: 'Volume and surface area of cones, spheres, hemispheres and pyramids.' },
    ],
  },
  {
    id: 'geo-transform', area: 'geometry', title: 'Transformations',
    blurb: 'Translations, reflections, rotations and enlargements.',
    skills: [
      { id: 'geo-translation', title: 'Translations', grade: 3, prereqs: ['gr-coordinates'], summary: 'Translate shapes using column vectors and describe translations.' },
      { id: 'geo-reflection', title: 'Reflections', grade: 3, prereqs: ['gr-coordinates', 'gr-horizontal-vertical'], summary: 'Reflect shapes in lines such as x = 2, y = −1 and y = x.' },
      { id: 'geo-rotation', title: 'Rotations', grade: 4, prereqs: ['gr-coordinates'], summary: 'Rotate shapes by 90° and 180° about a point.' },
      { id: 'geo-enlargement', title: 'Enlargements', grade: 4, prereqs: ['gr-coordinates', 'rat-simplify'], summary: 'Enlarge shapes by positive and fractional scale factors from a centre.' },
      { id: 'geo-describe-transformations', title: 'Describing transformations', grade: 6, prereqs: ['geo-translation', 'geo-reflection', 'geo-rotation', 'geo-enlargement'], summary: 'Fully describe a single transformation, or a combination of two.' },
      { id: 'geo-enlargement-negative', title: 'Negative enlargements', grade: 7, prereqs: ['geo-enlargement'], summary: 'Enlargements with negative scale factors.' },
    ],
  },
];
