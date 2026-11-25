// Tutorials ("Learn" pages) for the trig module. See docs/TUTORIAL_GUIDELINES.md.
import { h, p, list, steps, key, display, note, mistake, figure, example } from '../../tutorial-kit.js';
import { svg, polygon, text, rightAngleMark, angleMark, line, sideLabel, vertexLabel, centroid, ACCENT, ACCENT2 } from '../../svg.js';

/* ------------------------------------------------------------------ */
/* Small diagram helpers for these pages                               */
/* ------------------------------------------------------------------ */

// Right-angled triangle with the right angle bottom-left and the marked angle at bottom-right.
function rightTriangle({ hyp = 'hypotenuse', opp = 'opposite', adj = 'adjacent', angle = 'θ', colours = true } = {}) {
  const A = [60, 190]; const B = [300, 190]; const C = [60, 50];
  const mid = centroid([A, B, C]);
  return svg(360, 230, polygon([A, B, C])
    + rightAngleMark(A, B, C)
    + angleMark(B, A, C, { r: 34, label: angle, labelR: 52 })
    + sideLabel(B, C, hyp, mid, { color: colours ? ACCENT : 'currentColor', offset: 18 })
    + sideLabel(C, A, opp, mid, { color: colours ? ACCENT2 : 'currentColor', offset: 14 })
    + sideLabel(A, B, adj, mid, { offset: 16 }), { maxWidth: 360, label: 'Right-angled triangle with sides labelled' });
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
      mistake('pairing a side with an angle that is <b>not</b> opposite it. Check each fraction: the side on top must be across the triangle from the angle underneath.'),
      note('In any triangle the longest side is opposite the biggest angle. Use this to check your answer is sensible.'),
      h('What next?'),
      p('When there is no opposite pair, use [[trig-cosine-rule|the cosine rule]]. To find the area of a triangle that is not right-angled, see [[trig-area-sine]].'),
    ].join(''),
  },
];

void text;
