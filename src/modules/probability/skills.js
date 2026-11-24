export const units = [
  {
    id: 'prob-basics', area: 'probability', title: 'Probability basics',
    blurb: 'The probability scale, single events, sample spaces and expected outcomes.',
    skills: [
      { id: 'prob-scale', title: 'The probability scale', grade: 1, prereqs: [], summary: 'Describe likelihood in words and on a 0–1 scale, and compare probabilities.' },
      { id: 'prob-single-event', title: 'Probability of a single event', grade: 2, prereqs: ['prob-scale', 'num-equiv-fractions'], summary: 'Find probabilities of equally likely outcomes and P(not A).' },
      { id: 'prob-sum-to-one', title: 'Probabilities that add to 1', grade: 3, prereqs: ['prob-single-event', 'num-decimal-calc'], summary: 'Find missing probabilities in a table of mutually exclusive outcomes, including from ratios and algebra.' },
      { id: 'prob-sample-space', title: 'Sample spaces', grade: 3, prereqs: ['prob-single-event'], summary: 'List outcomes systematically and use sample space diagrams for two dice or spinners.' },
      { id: 'prob-expected-frequency', title: 'Relative and expected frequency', grade: 4, prereqs: ['prob-sum-to-one', 'num-fraction-of-amount'], summary: 'Use relative frequency and expected outcomes, find the best estimate and decide whether a dice is fair.' },
    ],
  },
  {
    id: 'prob-combined', area: 'probability', title: 'Combined events',
    blurb: 'Two-way tables, Venn diagrams, tree diagrams and conditional probability.',
    skills: [
      { id: 'prob-two-way-tables', title: 'Two-way tables and frequency trees', grade: 4, prereqs: ['prob-single-event'], summary: 'Complete and use two-way tables and frequency trees.' },
      { id: 'prob-venn', title: 'Venn diagrams and set notation', grade: 5, prereqs: ['prob-single-event'], summary: 'Use two- and three-set Venn diagrams and notation such as A ∩ B, A ∪ B and A′.' },
      { id: 'prob-tree-independent', title: 'Independent events and tree diagrams', grade: 5, prereqs: ['prob-sum-to-one', 'num-fraction-mul-div'], summary: 'Use the AND and OR rules and tree diagrams for independent events.' },
      { id: 'prob-tree-dependent', title: 'Dependent events', grade: 7, prereqs: ['prob-tree-independent'], summary: 'Tree diagrams without replacement, and trees where the second event depends on the first.' },
      { id: 'prob-conditional', title: 'Conditional probability', grade: 8, prereqs: ['prob-tree-dependent', 'prob-venn', 'prob-two-way-tables'], summary: 'Find P(A given B) from tables, Venn diagrams, sample spaces and trees.' },
    ],
  },
];
