export const units = [
  {
    id: 'alg-expressions', area: 'algebra', title: 'Algebraic expressions',
    blurb: 'Notation, simplifying, substitution, expanding brackets and factorising.',
    skills: [
      { id: 'alg-notation', title: 'Algebraic notation', grade: 1, prereqs: ['num-written-methods'], summary: 'Write expressions from words and use notation such as 3a, a² and a/b.' },
      { id: 'alg-simplify', title: 'Collecting like terms', grade: 1, prereqs: ['alg-notation'], summary: 'Simplify expressions by collecting like terms, including products like 3a × 2b.' },
      { id: 'alg-substitution', title: 'Substitution', grade: 2, prereqs: ['alg-notation', 'num-negatives', 'num-bidmas'], summary: 'Work out the value of an expression for given values, including negatives.' },
      { id: 'alg-expand-single', title: 'Expanding single brackets', grade: 3, prereqs: ['alg-simplify'], summary: 'Expand and simplify expressions such as 3(2x − 5) − 2(x + 1).' },
      { id: 'alg-factorise-single', title: 'Factorising into one bracket', grade: 4, prereqs: ['alg-expand-single', 'num-hcf-lcm'], summary: 'Take out the highest common factor, e.g. 6x²y + 9xy = 3xy(2x + 3).' },
      { id: 'alg-index-laws', title: 'Index laws in algebra', grade: 5, prereqs: ['num-index-laws', 'alg-simplify'], summary: 'Simplify expressions such as 4x³ × 5x⁻¹ and (2a²b)³.' },
      { id: 'alg-expand-double', title: 'Expanding double brackets', grade: 4, prereqs: ['alg-expand-single'], summary: 'Expand (x + a)(x + b), (2x − 3)², and similar.' },
      { id: 'alg-factorise-quadratic', title: 'Factorising quadratics', grade: 5, prereqs: ['alg-expand-double'], summary: 'Factorise x² + bx + c.' },
      { id: 'alg-difference-squares', title: 'Difference of two squares', grade: 6, prereqs: ['alg-factorise-quadratic'], summary: 'Factorise expressions such as x² − 49 and 9a² − 4b².' },
      { id: 'alg-expand-triple', title: 'Expanding triple brackets', grade: 7, prereqs: ['alg-expand-double'], summary: 'Expand products of three binomials.' },
      { id: 'alg-factorise-hard', title: 'Factorising harder quadratics', grade: 7, prereqs: ['alg-factorise-quadratic'], summary: 'Factorise ax² + bx + c where a ≠ 1.' },
      { id: 'alg-fractions-simplify', title: 'Simplifying algebraic fractions', grade: 7, prereqs: ['alg-factorise-hard', 'alg-difference-squares'], summary: 'Cancel common factors in algebraic fractions after factorising.' },
      { id: 'alg-fractions-operations', title: 'Adding and multiplying algebraic fractions', grade: 8, prereqs: ['alg-fractions-simplify', 'num-fraction-add-sub'], summary: 'Add, subtract, multiply and divide algebraic fractions.' },
    ],
  },
  {
    id: 'alg-equations', area: 'algebra', title: 'Linear equations',
    blurb: 'Solving linear equations and forming them from problems.',
    skills: [
      { id: 'alg-solve-one-two-step', title: 'One- and two-step equations', grade: 2, prereqs: ['alg-notation'], summary: 'Solve equations such as 3x + 5 = 20 and x/4 − 1 = 6.' },
      { id: 'alg-solve-brackets-both-sides', title: 'Brackets and unknowns on both sides', grade: 4, prereqs: ['alg-solve-one-two-step', 'alg-expand-single'], summary: 'Solve equations such as 5(x − 2) = 3x + 4.' },
      { id: 'alg-solve-fractions', title: 'Equations with fractions', grade: 5, prereqs: ['alg-solve-brackets-both-sides'], summary: 'Solve equations such as (x + 3)/4 = (2x − 1)/3.' },
      { id: 'alg-forming-equations', title: 'Forming and solving equations', grade: 5, prereqs: ['alg-solve-brackets-both-sides'], summary: 'Set up an equation from a context (angles, perimeters, ages, costs) and solve it.' },
    ],
  },
  {
    id: 'alg-inequalities', area: 'algebra', title: 'Inequalities',
    blurb: 'Representing and solving inequalities.',
    skills: [
      { id: 'alg-inequality-number-line', title: 'Inequalities on a number line', grade: 3, prereqs: ['num-negatives'], summary: 'Read and draw inequalities on a number line and list integer values.' },
      { id: 'alg-solve-inequalities', title: 'Solving linear inequalities', grade: 5, prereqs: ['alg-inequality-number-line', 'alg-solve-brackets-both-sides'], summary: 'Solve inequalities, including double inequalities, and find integer solutions.' },
      { id: 'alg-quadratic-inequalities', title: 'Quadratic inequalities', grade: 8, prereqs: ['alg-solve-inequalities', 'alg-solve-quad-factorising'], summary: 'Solve inequalities such as x² − x − 12 < 0.' },
    ],
  },
  {
    id: 'alg-quadratics', area: 'algebra', title: 'Quadratic equations',
    blurb: 'Solving quadratics by factorising, the formula and completing the square.',
    skills: [
      { id: 'alg-solve-quad-factorising', title: 'Solving quadratics by factorising', grade: 5, prereqs: ['alg-factorise-quadratic'], summary: 'Solve quadratic equations by factorising.' },
      { id: 'alg-quadratic-formula', title: 'The quadratic formula', grade: 7, prereqs: ['alg-solve-quad-factorising', 'num-calculator'], summary: 'Solve quadratics with the formula, giving answers to a given accuracy.' },
      { id: 'alg-completing-square', title: 'Completing the square', grade: 8, prereqs: ['alg-expand-double', 'alg-solve-quad-factorising'], summary: 'Write x² + bx + c as (x + p)² + q and use it to solve equations and find turning points.' },
    ],
  },
  {
    id: 'alg-simultaneous', area: 'algebra', title: 'Simultaneous equations',
    blurb: 'Solving pairs of equations, linear and non-linear.',
    skills: [
      { id: 'alg-simultaneous-linear', title: 'Linear simultaneous equations', grade: 6, prereqs: ['alg-solve-brackets-both-sides'], summary: 'Solve two linear equations by elimination or substitution.' },
      { id: 'alg-simultaneous-problems', title: 'Simultaneous equation problems', grade: 6, prereqs: ['alg-simultaneous-linear', 'alg-forming-equations'], summary: 'Form and solve simultaneous equations from a context.' },
      { id: 'alg-simultaneous-nonlinear', title: 'Linear and quadratic simultaneous equations', grade: 8, prereqs: ['alg-simultaneous-linear', 'alg-solve-quad-factorising'], summary: 'Solve a linear and a quadratic (or circle) equation together.' },
    ],
  },
  {
    id: 'alg-formulae', area: 'algebra', title: 'Formulae and identities',
    blurb: 'Using, writing and rearranging formulae; identities; iteration.',
    skills: [
      { id: 'alg-substitute-formulae', title: 'Substituting into formulae', grade: 3, prereqs: ['alg-substitution'], summary: 'Use formulae such as v = u + at and A = ½(a + b)h.' },
      { id: 'alg-writing-formulae', title: 'Writing formulae', grade: 3, prereqs: ['alg-notation'], summary: 'Write a formula or expression to describe a situation.' },
      { id: 'alg-vocabulary', title: 'Expressions, equations, formulae and identities', grade: 4, prereqs: ['alg-simplify', 'alg-expand-single'], summary: 'Tell the difference between an expression, equation, formula and identity; use ≡.' },
      { id: 'alg-rearrange-simple', title: 'Changing the subject', grade: 5, prereqs: ['alg-solve-one-two-step'], summary: 'Rearrange formulae such as v = u + at to make another letter the subject.' },
      { id: 'alg-rearrange-hard', title: 'Harder rearranging', grade: 7, prereqs: ['alg-rearrange-simple', 'alg-factorise-single'], summary: 'Rearrange formulae where the subject appears twice or under a power or root.' },
      { id: 'alg-iteration', title: 'Iteration', grade: 7, prereqs: ['alg-substitute-formulae', 'num-calculator'], summary: 'Use an iterative formula to approximate a solution; find a root between two values.' },
    ],
  },
  {
    id: 'alg-proof', area: 'algebra', title: 'Algebraic reasoning and proof',
    blurb: 'Counterexamples and algebraic proof.',
    skills: [
      { id: 'alg-counterexample', title: 'Counterexamples', grade: 4, prereqs: ['num-primes', 'num-negatives'], summary: 'Find a counterexample to show that a statement is false.' },
      { id: 'alg-proof', title: 'Algebraic proof', grade: 7, prereqs: ['alg-expand-double', 'alg-factorise-single'], summary: 'Use algebra (e.g. 2n, 2n + 1) to show that a statement is always true.' },
    ],
  },
];
