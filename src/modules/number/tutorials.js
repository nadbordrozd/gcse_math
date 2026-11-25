// Learn pages for the Number module, one file per unit. See docs/TUTORIAL_GUIDELINES.md.
import { tutorials as calc } from './tut-calc.js';
import { tutorials as factors } from './tut-factors.js';
import { tutorials as fractions } from './tut-fractions.js';
import { tutorials as fdp } from './tut-fdp.js';
import { tutorials as powers } from './tut-powers.js';
import { tutorials as rounding } from './tut-rounding.js';
import { tutorials as surds } from './tut-surds.js';

export const tutorials = [...calc, ...factors, ...fractions, ...fdp, ...powers, ...rounding, ...surds];
