export const units = [
  {
    id: 'rat-ratio', area: 'ratio', title: 'Ratio',
    blurb: 'Simplifying ratios, sharing in a ratio and ratio problems.',
    skills: [
      { id: 'rat-simplify', title: 'Simplifying ratios', grade: 2, prereqs: ['num-factors-multiples'], summary: 'Simplify ratios, including ratios with different units, and write in the form 1 : n.' },
      { id: 'rat-share', title: 'Sharing in a ratio', grade: 3, prereqs: ['rat-simplify'], summary: 'Divide a quantity in a given ratio.' },
      { id: 'rat-given-part', title: 'Ratio problems with one part known', grade: 4, prereqs: ['rat-share'], summary: 'Use a ratio when one share, or the difference between shares, is known.' },
      { id: 'rat-ratio-fractions', title: 'Ratios and fractions', grade: 4, prereqs: ['rat-share', 'num-fraction-of-amount'], summary: 'Link ratios to fractions of the whole, and fractions to ratios.' },
      { id: 'rat-combine', title: 'Combining ratios', grade: 6, prereqs: ['rat-given-part'], summary: 'Combine a : b and b : c into a : b : c.' },
      { id: 'rat-ratio-change', title: 'Ratios that change', grade: 7, prereqs: ['rat-given-part', 'alg-forming-equations'], summary: 'Solve problems where a ratio changes after something is added or taken away.' },
    ],
  },
  {
    id: 'rat-percent', area: 'ratio', title: 'Percentages',
    blurb: 'Percentages of amounts, percentage change, reverse percentages and interest.',
    skills: [
      { id: 'rat-percent-of', title: 'Percentages of amounts', grade: 2, prereqs: ['num-fdp-convert'], summary: 'Find percentages of amounts, with and without a calculator.' },
      { id: 'rat-percent-increase', title: 'Percentage increase and decrease', grade: 3, prereqs: ['rat-percent-of'], summary: 'Increase or decrease an amount by a percentage, including using multipliers.' },
      { id: 'rat-percent-express', title: 'One quantity as a percentage of another', grade: 3, prereqs: ['rat-percent-of'], summary: 'Write one amount as a percentage of another.' },
      { id: 'rat-simple-interest', title: 'Simple interest', grade: 4, prereqs: ['rat-percent-of'], summary: 'Calculate simple interest over several years.' },
      { id: 'rat-percent-change', title: 'Percentage change', grade: 4, prereqs: ['rat-percent-express'], summary: 'Find a percentage increase, decrease, profit or loss.' },
      { id: 'rat-reverse-percent', title: 'Reverse percentages', grade: 5, prereqs: ['rat-percent-increase'], summary: 'Find the original amount before a percentage change.' },
      { id: 'rat-compound-interest', title: 'Compound interest, growth and decay', grade: 5, prereqs: ['rat-percent-increase', 'num-calculator'], summary: 'Repeated percentage change: compound interest, depreciation and population growth.' },
    ],
  },
  {
    id: 'rat-proportion', area: 'ratio', title: 'Proportion',
    blurb: 'Direct and inverse proportion, best buys and exchange rates.',
    skills: [
      { id: 'rat-direct-proportion', title: 'Direct proportion', grade: 3, prereqs: ['num-written-methods'], summary: 'Use the unitary method: recipes, costs and quantities.' },
      { id: 'rat-exchange-rates', title: 'Exchange rates', grade: 3, prereqs: ['rat-direct-proportion', 'num-decimal-calc'], summary: 'Convert between currencies and compare prices.' },
      { id: 'rat-best-buy', title: 'Best buys', grade: 4, prereqs: ['rat-direct-proportion'], summary: 'Compare value for money using unit prices.' },
      { id: 'rat-inverse-proportion', title: 'Inverse proportion', grade: 5, prereqs: ['rat-direct-proportion'], summary: 'Solve problems such as workers and time, where one quantity goes up as the other goes down.' },
      { id: 'rat-proportion-algebra', title: 'Proportion equations', grade: 7, prereqs: ['rat-inverse-proportion', 'alg-substitute-formulae'], summary: 'Use y = kx, y = kx², y = k/x and similar, and recognise their graphs.' },
    ],
  },
  {
    id: 'rat-measures', area: 'ratio', title: 'Measures and rates',
    blurb: 'Units, scales and maps, speed, density and pressure.',
    skills: [
      { id: 'rat-unit-conversion', title: 'Converting units', grade: 2, prereqs: ['num-decimal-calc'], summary: 'Convert metric units of length, mass, capacity and time.' },
      { id: 'rat-scales-maps', title: 'Scale drawings and maps', grade: 4, prereqs: ['rat-simplify', 'rat-unit-conversion'], summary: 'Use scales such as 1 : 25 000 and 1 cm to 5 km.' },
      { id: 'rat-speed', title: 'Speed, distance and time', grade: 4, prereqs: ['rat-unit-conversion'], summary: 'Calculate speed, distance and time, including changing units and average speed.' },
      { id: 'rat-density-pressure', title: 'Density and pressure', grade: 5, prereqs: ['rat-speed'], summary: 'Use density = mass ÷ volume and pressure = force ÷ area.' },
      { id: 'rat-area-volume-units', title: 'Area and volume units', grade: 6, prereqs: ['rat-unit-conversion', 'geo-area-basic'], summary: 'Convert units of area and volume, e.g. cm² to m² and cm³ to litres.' },
    ],
  },
];
