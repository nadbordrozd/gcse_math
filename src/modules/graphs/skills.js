export const units = [
  {
    id: 'gr-sequences', area: 'algebra', title: 'Sequences',
    blurb: 'Patterns, nth terms, special and quadratic sequences.',
    skills: [
      { id: 'seq-term-to-term', title: 'Term-to-term rules', grade: 2, prereqs: ['num-negatives'], summary: 'Continue sequences and describe term-to-term rules, including pattern sequences.' },
      { id: 'seq-nth-term-use', title: 'Using the nth term', grade: 3, prereqs: ['seq-term-to-term', 'alg-substitution'], summary: 'Generate terms from an nth-term rule and decide whether a number is in a sequence.' },
      { id: 'seq-linear-nth-term', title: 'Finding the nth term', grade: 4, prereqs: ['seq-nth-term-use'], summary: 'Find the nth term of a linear (arithmetic) sequence.' },
      { id: 'seq-special', title: 'Special sequences', grade: 5, prereqs: ['seq-term-to-term', 'num-primes'], summary: 'Recognise square, cube, triangular, Fibonacci-type and geometric sequences.' },
      { id: 'seq-geometric', title: 'Geometric sequences', grade: 6, prereqs: ['seq-special', 'num-index-laws'], summary: 'Find the common ratio and terms of geometric sequences.' },
      { id: 'seq-quadratic-nth-term', title: 'Quadratic sequences', grade: 7, prereqs: ['seq-linear-nth-term'], summary: 'Find the nth term of a quadratic sequence.' },
    ],
  },
  {
    id: 'gr-linear', area: 'algebra', title: 'Coordinates and straight lines',
    blurb: 'Coordinates, midpoints, gradients and equations of straight lines.',
    skills: [
      { id: 'gr-coordinates', title: 'Coordinates', grade: 1, prereqs: ['num-negatives'], summary: 'Read and plot coordinates in all four quadrants; complete shapes on a grid.' },
      { id: 'gr-horizontal-vertical', title: 'Horizontal, vertical and diagonal lines', grade: 3, prereqs: ['gr-coordinates'], summary: 'Recognise lines such as x = 3, y = −2, y = x and y = −x.' },
      { id: 'gr-table-plot', title: 'Plotting straight-line graphs', grade: 3, prereqs: ['gr-coordinates', 'alg-substitution'], summary: 'Complete a table of values and decide whether a point lies on a line.' },
      { id: 'gr-midpoint', title: 'Midpoints of line segments', grade: 4, prereqs: ['gr-coordinates'], summary: 'Find the midpoint of a line segment, or an endpoint given the midpoint.' },
      { id: 'gr-gradient-intercept', title: 'Gradient and y-intercept', grade: 5, prereqs: ['gr-table-plot'], summary: 'Find the gradient and intercept of y = mx + c from an equation or a graph.' },
      { id: 'gr-line-equation', title: 'Equation of a straight line', grade: 6, prereqs: ['gr-gradient-intercept'], summary: 'Find the equation of a line from two points or a gradient and a point.' },
      { id: 'gr-parallel-perpendicular', title: 'Parallel and perpendicular lines', grade: 7, prereqs: ['gr-line-equation'], summary: 'Use gradients of parallel and perpendicular lines.' },
    ],
  },
  {
    id: 'gr-nonlinear', area: 'algebra', title: 'Non-linear graphs',
    blurb: 'Quadratic, cubic, reciprocal, exponential and trig graphs; graph transformations.',
    skills: [
      { id: 'gr-quadratic-graphs', title: 'Quadratic graphs', grade: 5, prereqs: ['gr-table-plot'], summary: 'Plot and interpret quadratic graphs: roots, intercepts, turning points and line of symmetry.' },
      { id: 'gr-graph-shapes', title: 'Recognising graph shapes', grade: 5, prereqs: ['gr-quadratic-graphs'], summary: 'Recognise linear, quadratic, cubic, reciprocal and exponential graphs.' },
      { id: 'gr-graphical-solutions', title: 'Solving equations with graphs', grade: 6, prereqs: ['gr-quadratic-graphs', 'gr-gradient-intercept'], summary: 'Use intersections of graphs to solve equations and simultaneous equations.' },
      { id: 'gr-inequality-regions', title: 'Inequalities on graphs', grade: 7, prereqs: ['gr-gradient-intercept', 'alg-solve-inequalities'], summary: 'Identify regions satisfying several inequalities.' },
      { id: 'gr-trig-graphs', title: 'Trigonometric graphs', grade: 7, prereqs: ['gr-graph-shapes', 'trig-exact-values'], summary: 'Know the shapes and key points of y = sin x, y = cos x and y = tan x.' },
      { id: 'gr-circle-equation', title: 'Equation of a circle', grade: 8, prereqs: ['gr-line-equation', 'trig-pythagoras'], summary: 'Use x² + y² = r² and find the equation of a tangent to a circle.' },
      { id: 'gr-transformations', title: 'Transforming graphs', grade: 8, prereqs: ['gr-graph-shapes', 'gr-function-notation'], summary: 'Recognise y = f(x) + a, y = f(x + a), y = −f(x) and y = f(−x).' },
    ],
  },
  {
    id: 'gr-reallife', area: 'algebra', title: 'Real-life graphs',
    blurb: 'Conversion graphs, distance–time graphs and rates of change.',
    skills: [
      { id: 'gr-real-life', title: 'Real-life and conversion graphs', grade: 3, prereqs: ['gr-coordinates'], summary: 'Read and interpret conversion graphs and graphs of costs and charges.' },
      { id: 'gr-distance-time', title: 'Distance–time graphs', grade: 4, prereqs: ['gr-real-life', 'rat-speed'], summary: 'Interpret distance–time graphs and find speeds from gradients.' },
      { id: 'gr-rates-of-change', title: 'Gradients and areas under curves', grade: 8, prereqs: ['gr-distance-time', 'gr-gradient-intercept', 'geo-area-trapezium-compound'], summary: 'Velocity–time graphs: acceleration, distance travelled, tangents and estimating areas.' },
    ],
  },
  {
    id: 'gr-functions', area: 'algebra', title: 'Functions',
    blurb: 'Function machines, function notation, composite and inverse functions.',
    skills: [
      { id: 'gr-function-machines', title: 'Function machines', grade: 2, prereqs: ['num-bidmas'], summary: 'Find outputs and inputs of function machines.' },
      { id: 'gr-function-notation', title: 'Function notation', grade: 6, prereqs: ['alg-substitution', 'alg-solve-one-two-step'], summary: 'Evaluate f(x) and solve f(x) = k.' },
      { id: 'gr-composite-inverse', title: 'Composite and inverse functions', grade: 8, prereqs: ['gr-function-notation', 'alg-rearrange-simple'], summary: 'Find fg(x) and f⁻¹(x).' },
    ],
  },
];
