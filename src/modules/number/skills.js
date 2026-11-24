// Skill taxonomy for the Number module. grade = the GCSE grade at which a student is typically
// expected to manage the skill; higher = Higher-tier-only content (defaults to grade >= 6).
export const units = [
  {
    id: 'num-calc', area: 'number', title: 'Calculating with numbers',
    blurb: 'Place value, negative numbers, written methods, order of operations and decimals.',
    skills: [
      { id: 'num-place-value', title: 'Place value and ordering', grade: 1, prereqs: [], summary: 'Read, write, compare and order integers and decimals.' },
      { id: 'num-written-methods', title: 'Written methods', grade: 1, prereqs: ['num-place-value'], summary: 'Add, subtract, multiply and divide whole numbers without a calculator.' },
      { id: 'num-negatives', title: 'Negative numbers', grade: 2, prereqs: ['num-place-value'], summary: 'Order and calculate with negative numbers, including temperatures.' },
      { id: 'num-bidmas', title: 'Order of operations', grade: 2, prereqs: ['num-written-methods'], summary: 'Use BIDMAS, including brackets, powers and inserting brackets to make a statement true.' },
      { id: 'num-decimal-calc', title: 'Calculating with decimals', grade: 3, prereqs: ['num-written-methods'], summary: 'Multiply and divide decimals, and use a given fact such as 23 × 47 = 1081 to work out 2.3 × 4.7.' },
      { id: 'num-calculator', title: 'Using a calculator', grade: 3, prereqs: ['num-bidmas'], summary: 'Evaluate expressions with brackets, fractions, powers and roots on a calculator.' },
      { id: 'num-product-rule', title: 'Systematic listing and the product rule', grade: 5, prereqs: ['num-written-methods'], summary: 'Count combinations by listing or by multiplying the number of choices.' },
    ],
  },
  {
    id: 'num-factors', area: 'number', title: 'Factors, multiples and primes',
    blurb: 'Factors, multiples, primes, prime factorisation, HCF and LCM.',
    skills: [
      { id: 'num-factors-multiples', title: 'Factors and multiples', grade: 1, prereqs: ['num-written-methods'], summary: 'List factors and multiples and find common ones.' },
      { id: 'num-primes', title: 'Primes, squares and cubes', grade: 1, prereqs: ['num-factors-multiples'], summary: 'Recognise prime, square, cube and triangular numbers.' },
      { id: 'num-prime-factorisation', title: 'Prime factorisation', grade: 3, prereqs: ['num-primes'], summary: 'Write a number as a product of prime factors in index form.' },
      { id: 'num-hcf-lcm', title: 'HCF and LCM', grade: 3, prereqs: ['num-prime-factorisation'], summary: 'Find highest common factors and lowest common multiples, including from prime factors.' },
      { id: 'num-hcf-lcm-problems', title: 'HCF and LCM problems', grade: 4, prereqs: ['num-hcf-lcm'], summary: 'Recognise and solve problems such as buses leaving together or packs of buns.' },
    ],
  },
  {
    id: 'num-fractions', area: 'number', title: 'Fractions',
    blurb: 'Equivalent fractions and calculating with fractions and mixed numbers.',
    skills: [
      { id: 'num-equiv-fractions', title: 'Equivalent fractions', grade: 2, prereqs: ['num-factors-multiples'], summary: 'Simplify, compare and order fractions; convert mixed numbers and improper fractions.' },
      { id: 'num-fraction-of-amount', title: 'Fractions of amounts', grade: 2, prereqs: ['num-equiv-fractions'], summary: 'Find a fraction of a quantity and express one quantity as a fraction of another.' },
      { id: 'num-fraction-add-sub', title: 'Adding and subtracting fractions', grade: 3, prereqs: ['num-equiv-fractions'], summary: 'Add and subtract fractions and mixed numbers.' },
      { id: 'num-fraction-mul-div', title: 'Multiplying and dividing fractions', grade: 3, prereqs: ['num-equiv-fractions'], summary: 'Multiply and divide fractions and mixed numbers.' },
      { id: 'num-fraction-problems', title: 'Fraction problems', grade: 4, prereqs: ['num-fraction-of-amount', 'num-fraction-add-sub'], summary: 'Multi-step problems involving fractions of quantities.' },
    ],
  },
  {
    id: 'num-fdp', area: 'number', title: 'Fractions, decimals and percentages',
    blurb: 'Converting between fractions, decimals and percentages, and recurring decimals.',
    skills: [
      { id: 'num-fdp-convert', title: 'Converting fractions, decimals and percentages', grade: 2, prereqs: ['num-equiv-fractions'], summary: 'Move between equivalent fractions, decimals and percentages.' },
      { id: 'num-fdp-order', title: 'Ordering fractions, decimals and percentages', grade: 3, prereqs: ['num-fdp-convert'], summary: 'Compare and order a mixture of fractions, decimals and percentages.' },
      { id: 'num-recurring-decimals', title: 'Recurring decimals to fractions', grade: 7, prereqs: ['num-fdp-convert', 'alg-solve-one-two-step'], summary: 'Convert recurring decimals into fractions algebraically.' },
    ],
  },
  {
    id: 'num-powers', area: 'number', title: 'Powers, roots and standard form',
    blurb: 'Squares, roots, the laws of indices and standard form.',
    skills: [
      { id: 'num-squares-roots', title: 'Squares, cubes and roots', grade: 2, prereqs: ['num-primes'], summary: 'Calculate squares, cubes, square roots and cube roots.' },
      { id: 'num-index-laws', title: 'Laws of indices', grade: 4, prereqs: ['num-squares-roots'], summary: 'Multiply and divide powers and raise a power to a power.' },
      { id: 'num-negative-zero-indices', title: 'Zero and negative indices', grade: 5, prereqs: ['num-index-laws', 'num-fraction-mul-div'], summary: 'Evaluate powers with zero and negative indices.' },
      { id: 'num-fractional-indices', title: 'Fractional indices', grade: 7, prereqs: ['num-negative-zero-indices'], summary: 'Evaluate powers such as 8^(2/3) and 27^(−1/3).' },
      { id: 'num-standard-form', title: 'Standard form', grade: 4, prereqs: ['num-index-laws', 'num-place-value'], summary: 'Convert between ordinary numbers and standard form; order numbers in standard form.' },
      { id: 'num-standard-form-calc', title: 'Calculating in standard form', grade: 5, prereqs: ['num-standard-form'], summary: 'Multiply, divide, add and subtract numbers in standard form.' },
    ],
  },
  {
    id: 'num-rounding', area: 'number', title: 'Rounding, estimation and bounds',
    blurb: 'Decimal places, significant figures, estimating, error intervals and bounds.',
    skills: [
      { id: 'num-rounding', title: 'Rounding', grade: 3, prereqs: ['num-place-value'], summary: 'Round to the nearest whole number, decimal places and significant figures.' },
      { id: 'num-estimation', title: 'Estimation', grade: 3, prereqs: ['num-rounding'], summary: 'Estimate answers by rounding to 1 significant figure.' },
      { id: 'num-error-intervals', title: 'Error intervals', grade: 5, prereqs: ['num-rounding', 'alg-inequality-number-line'], summary: 'Write the error interval for a rounded or truncated value.' },
      { id: 'num-bounds-calc', title: 'Calculating with bounds', grade: 7, prereqs: ['num-error-intervals'], summary: 'Find upper and lower bounds of calculations.' },
    ],
  },
  {
    id: 'num-surds', area: 'number', title: 'Surds',
    blurb: 'Simplifying and calculating with surds (Higher).',
    skills: [
      { id: 'num-surds-simplify', title: 'Simplifying surds', grade: 6, prereqs: ['num-squares-roots', 'num-prime-factorisation'], summary: 'Write surds such as √48 in the form a√b.' },
      { id: 'num-surds-operations', title: 'Calculating with surds', grade: 7, prereqs: ['num-surds-simplify', 'alg-expand-double'], summary: 'Add, subtract, multiply and expand brackets containing surds.' },
      { id: 'num-surds-rationalise', title: 'Rationalising the denominator', grade: 8, prereqs: ['num-surds-operations'], summary: 'Rationalise denominators such as 6/√3 and 1/(2 + √3).' },
    ],
  },
];
