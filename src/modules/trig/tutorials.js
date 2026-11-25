// Tutorials ("Learn" pages) for the trig module. See docs/TUTORIAL_GUIDELINES.md.
import { h, p, list, steps, key, display, note, mistake, figure, example } from '../../tutorial-kit.js';
import { measureTutorials } from './tutorials-measure.js';
import { fig } from './diagrams.js';
import { altitudeFig } from './trigonometry.js';
import { shapeTutorials } from './tutorials-shapes.js';
import { svg, polygon, text, rightAngleMark, angleMark, line, sideLabel, vertexLabel, centroid, ACCENT, ACCENT2 } from '../../svg.js';

/* ------------------------------------------------------------------ */
/* Small diagram helpers for these pages                               */
/* ------------------------------------------------------------------ */

// Right-angled triangle with the right angle bottom-left and the marked angle at bottom-right.
function rightTriangle({ hyp = 'hypotenuse', opp = 'opposite', adj = 'adjacent', angle = 'θ', colours = true } = {}) {
  const A = [110, 190]; const B = [350, 190]; const C = [110, 50];
  const mid = centroid([A, B, C]);
  return svg(400, 230, polygon([A, B, C])
    + rightAngleMark(A, B, C)
    + angleMark(B, A, C, { r: 34, label: angle, labelR: 52 })
    + sideLabel(B, C, hyp, mid, { color: colours ? ACCENT : 'currentColor', offset: 30 })
    + sideLabel(C, A, opp, mid, { color: colours ? ACCENT2 : 'currentColor', offset: 14 })
    + sideLabel(A, B, adj, mid, { offset: 16 }), { maxWidth: 400, label: 'Right-angled triangle with sides labelled' });
}

// Lighthouse and boat: angle of depression from the top, angle of elevation from the boat.
function elevationFig() {
  return fig({
    pts: { T: [0, 4], L: [0, 0], B: [9.4, 0], H: [9.4, 4] }, nda: false, width: 420, height: 200, pad: 30, padX: 52,
    draw: (g) => g.seg('L', 'T', { width: 4 }) + g.seg('L', [10.5, 0], { width: 1.4 }) + g.seg('T', 'H', { dash: '5 4', width: 1.4 }) + g.seg('T', 'B', { color: ACCENT })
      + g.angle('T', 'H', 'B', '23°', { r: 40 }) + g.angle('B', 'L', 'T', '23°', { r: 40 })
      + g.textAt('H', -70, -14, 'angle of depression', { size: 13, italic: false }) + g.textAt('B', -60, 16, 'angle of elevation', { size: 13, italic: false })
      + g.side('L', 'T', '40 m', { inside: 'B' }) + g.side('L', 'B', 'd', { inside: 'T' }) + g.name('T', 'top', { dir: [-1, -0.3], size: 13 }) + g.name('B', 'boat', { dir: [0.6, 1], size: 13 }),
  });
}

// A general (non-right) triangle ABC with sides a, b, c opposite the vertices.
function triangleABC({ withHeight = false } = {}) {
  const A = [50, 200]; const B = [330, 200]; const C = [215, 45];
  const mid = centroid([A, B, C]);
  const H = [C[0], 200];
  return svg(380, 240, polygon([A, B, C])
    + vertexLabel(A, 'A', mid) + vertexLabel(B, 'B', mid) + vertexLabel(C, 'C', mid)
    + sideLabel(B, C, 'a', mid, { italic: true }) + sideLabel(A, C, 'b', mid, { italic: true }) + sideLabel(A, B, 'c', mid, { italic: true })
    + angleMark(A, B, C, { r: 26 }) + angleMark(B, A, C, { r: 26 }) + angleMark(C, A, B, { r: 20 })
    + (withHeight ? line(...C, ...H, { dash: true, color: ACCENT }) + rightAngleMark(H, A, C, 9) + text(C[0] + 10, 130, 'h', { italic: true, color: ACCENT, anchor: 'start' }) : ''),
  { maxWidth: 380, label: 'Triangle ABC' });
}

/* ------------------------------------------------------------------ */
/* Tutorials                                                           */
/* ------------------------------------------------------------------ */

export const tutorials = [
  {
    id: 'trig-sohcahtoa-side',
    title: 'Trigonometry basics: sin, cos and tan',
    skills: ['trig-sohcahtoa-side'],
    prereqs: ['trig-pythagoras', 'alg-solve-one-two-step', 'trig-similar-lengths'],
    summary: 'What sin, cos and tan mean, how to label a right-angled triangle, and how to find a missing side.',
    body: [
      h('The big idea'),
      p(
        "[[trig-pythagoras|Pythagoras' theorem]] links the three <b>sides</b> of a right-angled triangle. Trigonometry links the sides to the <b>angles</b>.",
        'Take any right-angled triangle with an angle of $35^\\circ$. Make it bigger or smaller and it is still the same shape – all such triangles are [[trig-similar-lengths|similar]]. So the <b>ratio</b> of any two of its sides is always the same, whatever the size. Those ratios depend only on the angle, and they have names: <b>sine</b>, <b>cosine</b> and <b>tangent</b> (sin, cos and tan for short). Your calculator knows them all.',
      ),
      h('Step 1: label the sides'),
      p('Everything starts from the angle you are using (here called $\\theta$, the Greek letter "theta"). Name the three sides from where that angle is:'),
      figure(rightTriangle()),
      list([
        'The <b>hypotenuse</b> (H) is the longest side, opposite the right angle. It never changes.',
        'The <b>opposite</b> (O) is the side across the triangle from the angle $\\theta$ – it does not touch $\\theta$.',
        'The <b>adjacent</b> (A) is the side next to $\\theta$ that is not the hypotenuse.',
      ]),
      mistake('opposite and adjacent swap over if you use the <i>other</i> acute angle of the triangle. Always label from the angle in the question.'),
      h('Step 2: the three ratios'),
      key('SOH CAH TOA', display('\\sin\\theta = \\frac{\\text{O}}{\\text{H}} \\qquad \\cos\\theta = \\frac{\\text{A}}{\\text{H}} \\qquad \\tan\\theta = \\frac{\\text{O}}{\\text{A}}')
        + p('Remember it as <b>SOH CAH TOA</b>: <b>S</b>in = <b>O</b>pposite ÷ <b>H</b>ypotenuse, <b>C</b>os = <b>A</b>djacent ÷ <b>H</b>ypotenuse, <b>T</b>an = <b>O</b>pposite ÷ <b>A</b>djacent.')),
      h('Finding a missing side'),
      steps([
        'Label the sides O, A and H from the given angle.',
        'Tick the side you know and the side you want. Choose the ratio that uses exactly those two: O and H → sin, A and H → cos, O and A → tan.',
        'Write the equation, e.g. $\\sin 35^\\circ = \\frac{x}{12}$.',
        '[[alg-solve-one-two-step|Solve it]]. If $x$ is on top, multiply. If $x$ is on the bottom, swap it with the sin/cos/tan value.',
        'Round at the very end, to the accuracy the question asks for.',
      ]),
      example('Example 1 – the unknown is on top',
        'A right-angled triangle has hypotenuse $12$ cm. Side $x$ is opposite an angle of $35^\\circ$. Find $x$ to 1 decimal place.',
        ['From the $35^\\circ$ angle: $x$ is the <b>opposite</b>, $12$ is the <b>hypotenuse</b>. O and H → <b>sin</b>.',
          '$\\sin 35^\\circ = \\dfrac{x}{12}$',
          'Multiply both sides by $12$: $x = 12 \\times \\sin 35^\\circ = 6.8829\\ldots$'],
        '$x = 6.9$ cm'),
      example('Example 2 – the unknown is on the bottom',
        'The side adjacent to an angle of $40^\\circ$ is $8$ cm. Find the hypotenuse $h$ to 1 decimal place.',
        ['A and H → <b>cos</b>.',
          '$\\cos 40^\\circ = \\dfrac{8}{h}$',
          '$h$ is on the bottom, so rearrange: $h = \\dfrac{8}{\\cos 40^\\circ} = 10.443\\ldots$'],
        '$h = 10.4$ cm'),
      example('Example 3 – tan, with the unknown on the bottom',
        'The side opposite an angle of $62^\\circ$ is $9$ cm. Find the adjacent side $y$ to 1 decimal place.',
        ['O and A → <b>tan</b>.', '$\\tan 62^\\circ = \\dfrac{9}{y}$', '$y = \\dfrac{9}{\\tan 62^\\circ} = 4.785\\ldots$'],
        '$y = 4.8$ cm'),
      h('Angles of elevation and depression'),
      p('Word problems often describe angles from the horizontal. The <b>angle of elevation</b> is the angle you look <b>up</b> from the horizontal to see something above you. The <b>angle of depression</b> is the angle you look <b>down</b> from the horizontal.',
        'Looking up from the boat to the top of a lighthouse and looking down from the top to the boat give the same angle: the horizontal line at the top and the sea are parallel, so the two angles are [[geo-parallel-lines|alternate angles]].'),
      figure(elevationFig(), 'The angle of depression from the top equals the angle of elevation from the boat.'),
      example('Example 4 – angle of depression',
        'From the top of a lighthouse $40$ m high, the angle of depression of a boat is $23^\\circ$. How far is the boat from the foot of the lighthouse, to the nearest metre?',
        ['The angle at the boat is also $23^\\circ$ (alternate angles). From that angle, the $40$ m height is <b>opposite</b> and the distance $d$ is <b>adjacent</b>: tan.', '$\\tan 23^\\circ = \\dfrac{40}{d}$, so $d = \\dfrac{40}{\\tan 23^\\circ} = 94.234\\ldots$'],
        '$94$ m'),
      example('Example 5 – two triangles sharing a side',
        '$D$, $B$ and $C$ lie on a straight line and $AB$ is perpendicular to it. $AD = 12$ cm, angle $ADB = 55^\\circ$ and angle $ACB = 38^\\circ$. Find $BC$ to 1 decimal place.',
        ['Triangle $ABD$ first: $AB$ is opposite the $55^\\circ$ angle and $AD$ is the hypotenuse, so $AB = 12 \\sin 55^\\circ = 9.829\\ldots$ cm. Keep the full value.', 'Triangle $ABC$: $AB$ is opposite the $38^\\circ$ angle and $BC$ is adjacent, so use tan: $\\tan 38^\\circ = \\dfrac{9.829\\ldots}{BC}$', '$BC = \\dfrac{9.829\\ldots}{\\tan 38^\\circ} = 12.581\\ldots$'],
        '$BC = 12.6$ cm', { visual: altitudeFig({ db: 6.88, bc: 12.58, h: 9.83, labels: { AD: '12 cm', BC: 'x' }, angles: { D: '55°', C: '38°' } }) }),
      note('Check your calculator is in <b>degrees</b> mode (a small D or DEG on the screen). In degrees, $\\sin 30^\\circ = 0.5$. If you get $-0.988\\ldots$ you are in radians.'),
      note('A quick sense check: the hypotenuse is always the longest side. If your answer for a shorter side comes out bigger than the hypotenuse, you have used the wrong ratio or divided instead of multiplied.'),
      h('What next?'),
      p('If you know two sides and want an <b>angle</b>, you need the inverse functions: see [[trig-sohcahtoa-angle]]. For triangles without a right angle, see [[trig-sine-rule]] and [[trig-cosine-rule]].'),
    ].join(''),
  },
  {
    id: 'trig-sohcahtoa-angle',
    title: 'Trigonometry: finding an angle',
    skills: ['trig-sohcahtoa-angle'],
    prereqs: ['trig-sohcahtoa-side'],
    summary: 'Use the inverse functions sin⁻¹, cos⁻¹ and tan⁻¹ to find an angle from two sides.',
    body: [
      h('Working backwards'),
      p(
        'From [[trig-sohcahtoa-side|SOH CAH TOA]] you know that, for example, $\\tan\\theta = \\frac{\\text{O}}{\\text{A}}$. If you know both sides, you know the value of $\\tan\\theta$ – a number like $0.5556$. To get back to the angle you need to "undo" tan.',
        'That is what the <b>inverse</b> functions do. On your calculator they are the <b>SHIFT</b> (or 2nd) versions of the sin, cos and tan keys, written $\\sin^{-1}$, $\\cos^{-1}$ and $\\tan^{-1}$.',
      ),
      key('Inverse trig', display('\\theta = \\sin^{-1}\\!\\left(\\frac{\\text{O}}{\\text{H}}\\right) \\qquad \\theta = \\cos^{-1}\\!\\left(\\frac{\\text{A}}{\\text{H}}\\right) \\qquad \\theta = \\tan^{-1}\\!\\left(\\frac{\\text{O}}{\\text{A}}\\right)')),
      p('The $^{-1}$ here does <b>not</b> mean "one over". It means "the angle whose tan is…".'),
      h('Method'),
      steps([
        'Label the sides O, A and H from the angle you want.',
        'Pick the ratio that uses the two sides you know.',
        'Write it as a fraction, e.g. $\\tan\\theta = \\frac{5}{9}$.',
        'Use the inverse key: $\\theta = \\tan^{-1}\\left(\\frac{5}{9}\\right)$. Type the whole fraction in, not a rounded decimal.',
      ]),
      example('Example 1',
        'A right-angled triangle has the side opposite $\\theta$ equal to $5$ cm and the side adjacent to $\\theta$ equal to $9$ cm. Find $\\theta$ to 1 decimal place.',
        ['O and A → <b>tan</b>.', '$\\tan\\theta = \\dfrac{5}{9}$', '$\\theta = \\tan^{-1}\\left(\\dfrac{5}{9}\\right) = 29.0546\\ldots^\\circ$'],
        '$\\theta = 29.1^\\circ$'),
      example('Example 2',
        'The hypotenuse is $15$ m and the side adjacent to $\\theta$ is $11$ m. Find $\\theta$ to 1 decimal place.',
        ['A and H → <b>cos</b>.', '$\\cos\\theta = \\dfrac{11}{15}$', '$\\theta = \\cos^{-1}\\left(\\dfrac{11}{15}\\right) = 42.833\\ldots^\\circ$'],
        '$\\theta = 42.8^\\circ$'),
      example('Example 3 – a slide (sin)',
        'A straight slide is $4.5$ m long and its top is $2.1$ m above the ground. Find the angle between the slide and the ground, to 1 decimal place.',
        ['The slide is the hypotenuse; the height is opposite the angle. O and H → <b>sin</b>.', '$\\sin\\theta = \\dfrac{2.1}{4.5}$', '$\\theta = \\sin^{-1}\\left(\\dfrac{2.1}{4.5}\\right) = 27.818\\ldots^\\circ$'],
        '$27.8^\\circ$'),
      example('Example 4 – two steps',
        '$D$, $B$ and $C$ lie on a straight line and $AB$ is perpendicular to it. $AD = 13$ cm, $DB = 5$ cm and $BC = 9$ cm. Find angle $ACB$.',
        ['First find the shared side $AB$ with [[trig-pythagoras|Pythagoras]] in triangle $ABD$: $AB = \\sqrt{13^2 - 5^2} = 12$ cm.', 'In triangle $ABC$, $AB = 12$ is opposite the angle and $BC = 9$ is adjacent: $\\tan x = \\dfrac{12}{9}$', '$x = \\tan^{-1}\\left(\\dfrac{12}{9}\\right) = 53.130\\ldots^\\circ$'],
        '$53.1^\\circ$', { visual: altitudeFig({ db: 5, bc: 9, h: 12, labels: { AD: '13 cm', DB: '5 cm', BC: '9 cm' }, angles: { C: 'x' } }) }),
      mistake('if the calculator says <b>Math ERROR</b> for $\\sin^{-1}$ or $\\cos^{-1}$, you have put the hypotenuse on top. Sin and cos of an angle are never bigger than 1, because the hypotenuse is the longest side.'),
      note('Sense check: the two acute angles of a right-angled triangle add up to $90^\\circ$, and the bigger angle is opposite the longer side.'),
      h('What next?'),
      p('Some angles have exact trig values you are expected to know without a calculator: see [[trig-exact-values]]. For triangles that are not right-angled, see [[trig-sine-rule]].'),
    ].join(''),
  },
  {
    id: 'trig-sine-rule',
    title: 'The sine rule',
    skills: ['trig-sine-rule'],
    prereqs: ['trig-sohcahtoa-side', 'trig-sohcahtoa-angle', 'geo-angles-triangles'],
    summary: 'Find sides and angles in triangles that are not right-angled, when you know a side and its opposite angle.',
    body: [
      h('Why we need it'),
      p('[[trig-sohcahtoa-side|SOH CAH TOA]] only works in <b>right-angled</b> triangles. The sine rule works in <b>any</b> triangle.'),
      h('Labelling the triangle'),
      p('Call the corners (and the angles there) $A$, $B$ and $C$, with capital letters. Each side gets the <b>small</b> letter of the angle <b>opposite</b> it: side $a$ is opposite angle $A$, and so on.'),
      figure(triangleABC(), 'Side $a$ is opposite angle $A$, side $b$ opposite $B$, side $c$ opposite $C$.'),
      key('The sine rule', display('\\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C}')
        + p('To find an <b>angle</b> it is easier to use it upside down: $\\dfrac{\\sin A}{a} = \\dfrac{\\sin B}{b} = \\dfrac{\\sin C}{c}$')
        + p('You only ever use <b>two</b> of the fractions at a time.')),
      h('Where does it come from?'),
      p('Draw the height $h$ from $C$ down to side $AB$. This splits the triangle into two right-angled triangles.'),
      figure(triangleABC({ withHeight: true })),
      p(
        'In the left triangle, $h$ is opposite angle $A$ and $b$ is the hypotenuse, so $\\sin A = \\frac{h}{b}$, which gives $h = b \\sin A$.',
        'In the right triangle, $h$ is opposite angle $B$ and $a$ is the hypotenuse, so $h = a \\sin B$.',
        'Both are the same $h$, so $a \\sin B = b \\sin A$. Divide both sides by $\\sin A \\sin B$ and you get $\\dfrac{a}{\\sin A} = \\dfrac{b}{\\sin B}$.',
      ),
      h('When to use it'),
      p('Look for an <b>opposite pair</b>: a side <i>and</i> the angle opposite it, both known. Then, with one more side or angle, the sine rule finds the rest. If you have no complete opposite pair (for example two sides and the angle between them), use [[trig-cosine-rule|the cosine rule]] instead.'),
      h('Method'),
      steps([
        'Label the sides $a$, $b$, $c$ and angles $A$, $B$, $C$ (or just mark which side is opposite which angle).',
        'If you know two angles, find the third first: [[geo-angles-triangles|angles in a triangle]] add up to $180^\\circ$.',
        'Write the two fractions you need – the known opposite pair and the pair with the unknown – with the unknown on top.',
        'Rearrange and work it out on your calculator. Round only at the end.',
      ]),
      example('Example 1 – finding a side',
        'In triangle $ABC$, angle $A = 40^\\circ$, angle $B = 65^\\circ$ and $a = 8$ cm. Find $b$ to 1 decimal place.',
        ['Opposite pair known: $a = 8$ with $A = 40^\\circ$. We want $b$, which is opposite $B = 65^\\circ$.',
          '$\\dfrac{b}{\\sin 65^\\circ} = \\dfrac{8}{\\sin 40^\\circ}$',
          'Multiply both sides by $\\sin 65^\\circ$: $b = \\dfrac{8 \\sin 65^\\circ}{\\sin 40^\\circ} = 11.279\\ldots$'],
        '$b = 11.3$ cm'),
      example('Example 2 – finding an angle',
        'In triangle $ABC$, $a = 9$ cm, $b = 7$ cm and angle $A = 50^\\circ$. Find angle $B$ to 1 decimal place.',
        ['Opposite pair known: $a = 9$ with $A = 50^\\circ$. We want angle $B$, opposite $b = 7$.',
          'Use the upside-down version: $\\dfrac{\\sin B}{7} = \\dfrac{\\sin 50^\\circ}{9}$',
          '$\\sin B = \\dfrac{7 \\sin 50^\\circ}{9} = 0.5958\\ldots$',
          '$B = \\sin^{-1}(0.5958\\ldots) = 36.570\\ldots^\\circ$ (using the [[trig-sohcahtoa-angle|inverse sine]]).'],
        '$B = 36.6^\\circ$'),
      example('Example 3 – find the missing angle first',
        'In triangle $ABC$, angle $B = 61^\\circ$, angle $C = 71^\\circ$ and $c = 12$ cm. Find $a$ to 1 decimal place.',
        ['We want side $a$, so we need angle $A$: $A = 180^\\circ - 61^\\circ - 71^\\circ = 48^\\circ$.',
          'Opposite pair known: $c = 12$ with $C = 71^\\circ$.',
          '$\\dfrac{a}{\\sin 48^\\circ} = \\dfrac{12}{\\sin 71^\\circ}$, so $a = \\dfrac{12 \\sin 48^\\circ}{\\sin 71^\\circ} = 9.431\\ldots$'],
        '$a = 9.4$ cm'),
      note('$\\sin^{-1}$ always gives an <b>acute</b> angle. Another angle has the same sine: $180^\\circ$ minus it. If the diagram (or the question) tells you the angle is obtuse, the answer is $180^\\circ$ minus your calculator value.'),
      mistake('pairing a side with an angle that is <b>not</b> opposite it. Check each fraction: the side on top must be across the triangle from the angle underneath.'),
      note('In any triangle the longest side is opposite the biggest angle. Use this to check your answer is sensible.'),
      h('What next?'),
      p('When there is no opposite pair, use [[trig-cosine-rule|the cosine rule]]. To find the area of a triangle that is not right-angled, see [[trig-area-sine]].'),
    ].join(''),
  },
];

tutorials.push(...measureTutorials, ...shapeTutorials);

void text;
