// Question generators for the trig module (Pythagoras, trigonometry, similarity & congruence,
// circle theorems, vectors). See docs/GENERATOR_GUIDELINES.md.
// The archetypes live in topic files; this file only collects them in taxonomy order.
import { pythagorasGenerators, pythagorasProblemGenerators } from './pythagoras.js';
import { solidsGenerators } from './solids.js';
import { sohcahtoaSideGenerators, sohcahtoaAngleGenerators, exactValueGenerators } from './trigonometry.js';
import { similarLengthGenerators, congruenceGenerators, similarAreaVolumeGenerators } from './similarity.js';
import { circlePartGenerators, circleTheoremGenerators, circleTheoremMultiGenerators } from './circles.js';
import { columnVectorGenerators, vectorGeometryGenerators } from './vectors.js';
import { sineRuleGenerators, cosineRuleGenerators, areaSineGenerators, sineCosineProblemGenerators } from './nonright.js';

export const generators = [
  ...pythagorasGenerators,
  ...pythagorasProblemGenerators,
  ...solidsGenerators,
  ...sohcahtoaSideGenerators,
  ...sohcahtoaAngleGenerators,
  ...exactValueGenerators,
  ...sineRuleGenerators,
  ...cosineRuleGenerators,
  ...areaSineGenerators,
  ...sineCosineProblemGenerators,
  ...similarLengthGenerators,
  ...congruenceGenerators,
  ...similarAreaVolumeGenerators,
  ...circlePartGenerators,
  ...circleTheoremGenerators,
  ...circleTheoremMultiGenerators,
  ...columnVectorGenerators,
  ...vectorGeometryGenerators,
];
