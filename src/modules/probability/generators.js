// Question generators for the Probability module. See docs/GENERATOR_GUIDELINES.md.
// Archetypes live in topic files; this file collects them in taxonomy order.
import { basicsA } from './basics.js';
import { sampleArchetypes, expectedArchetypes } from './sample.js';
import { twoWayArchetypes, vennArchetypes } from './combined.js';
import { indArchetypes, depArchetypes, condArchetypes } from './trees.js';

export const generators = [
  ...basicsA, ...sampleArchetypes, ...expectedArchetypes,
  ...twoWayArchetypes, ...vennArchetypes,
  ...indArchetypes, ...depArchetypes, ...condArchetypes,
];
