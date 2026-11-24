// Question generators for the Geometry module. See docs/GENERATOR_GUIDELINES.md.
// Archetypes live in topic files inside this folder (in taxonomy order); diagram helpers are in
// diagrams.js (2D) and solids.js (3D).
import { angleGenerators } from './angles.js';
import { shapeGenerators } from './shapes.js';
import { areaGenerators } from './area.js';
import { volumeGenerators } from './volume.js';
import { transformGenerators } from './transform.js';

export const generators = [
  ...angleGenerators,
  ...shapeGenerators,
  ...areaGenerators,
  ...volumeGenerators,
  ...transformGenerators,
];
