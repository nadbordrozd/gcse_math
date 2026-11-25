// Question generators for the Algebra module. See docs/GENERATOR_GUIDELINES.md.
// The archetypes live in topic files inside this folder; this file collects them in taxonomy order.
import { generators as expressions } from './expressions.js';
import { generators as brackets } from './brackets.js';
import { generators as equations } from './equations.js';
import { generators as inequalities } from './inequalities.js';
import { generators as quadratics } from './quadratics.js';
import { generators as simultaneous } from './simultaneous.js';
import { generators as formulae } from './formulae.js';
import { generators as proof } from './proof.js';

export const generators = [
  ...expressions,
  ...brackets,
  ...equations,
  ...inequalities,
  ...quadratics,
  ...simultaneous,
  ...formulae,
  ...proof,
];
