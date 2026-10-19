export const DEFAULT_NOTES = [
  {
    title: 'Unit 3: Cellular Energetics & ATP Synthase',
    subject: 'AP Biology',
    topic: 'Cellular Respiration & Photosynthesis',
    sectionHeaders: 'Overview, Glycolysis, Krebs Cycle, Electron Transport Chain (ETC), Chemiosmosis',
    rawText: `# Unit 3: Cellular Energetics & ATP Synthase

## 1. Overview of Aerobic Respiration
Equation: C6H12O6 + 6O2 -> 6CO2 + 6H2O + approx 30-32 ATP.
Occurs across cytoplasm and mitochondrial compartments.

## 2. Glycolysis (Cytosol)
- Anaerobic process breaking glucose (6C) into 2 pyruvate (3C).
- Net yield: 2 ATP (substrate-level phosphorylation) and 2 NADH.
- Key enzyme: Phosphofructokinase (PFK) is allosterically inhibited by high ATP and citrate.

## 3. Krebs Cycle / Citric Acid Cycle (Mitochondrial Matrix)
- Pyruvate oxidation converts 3C pyruvate to 2C Acetyl-CoA, releasing 1 CO2 per pyruvate.
- Matrix reactions yield per glucose: 6 NADH, 2 FADH2, 2 ATP, and 4 CO2 waste.

## 4. Electron Transport Chain & Oxidative Phosphorylation (Inner Mitochondrial Membrane)
- High-energy electrons from NADH and FADH2 pass through complexes I, II, III, and IV.
- As electrons move through complexes I, III, and IV, protons (H+) are pumped from the mitochondrial matrix into the intermembrane space.
- This creates an electrochemical proton gradient (proton-motive force) with a higher H+ concentration and positive charge in the intermembrane space compared to the matrix.
- Oxygen serves as the final electron acceptor: 1/2 O2 + 2 H+ + 2 e- -> H2O. Without oxygen, ETC stops and NADH cannot be oxidized back to NAD+.

## 5. Chemiosmosis & ATP Synthase Function
- Section 5.1: Protons diffuse down their electrochemical gradient back into the matrix through the catalytic rotor channel of ATP Synthase.
- Section 5.2: The mechanical flow of protons turns the rotor subunit, catalyzing the phosphorylation of ADP + Pi -> ATP.
- Section 5.3: Cyanide and carbon monoxide block Complex IV (cytochrome c oxidase), preventing electron transfer to oxygen and dissipating the proton gradient.`,
  },
  {
    title: 'Calculus: Derivatives, Product & Chain Rule',
    subject: 'Calculus AB',
    topic: 'Differentiation Techniques',
    sectionHeaders: 'Definition of Derivative, Power Rule, Product Rule, Quotient Rule, Chain Rule',
    rawText: `# Calculus AB: Differentiation Rules & Applications

## 1. Power Rule
- For any real power n: d/dx [x^n] = n * x^(n-1).
- Example: d/dx [4x^3] = 12x^2. Constant rule: d/dx [c] = 0.

## 2. Product and Quotient Rules
- Product Rule: d/dx [f(x) * g(x)] = f'(x)g(x) + f(x)g'(x). (Mnemonic: "derivative of first times second plus first times derivative of second").
- Quotient Rule: d/dx [f(x) / g(x)] = [f'(x)g(x) - f(x)g'(x)] / [g(x)]^2. (Mnemonic: "low d-high minus high d-low over the square of what's below").

## 3. The Chain Rule (Composite Functions)
- Section 3.1: If y = f(g(x)), then dy/dx = f'(g(x)) * g'(x).
- Always differentiate the outer function evaluated at the inner function first, then multiply by the derivative of the inner function.
- Section 3.2: Example with Trig: d/dx [sin(3x^2)] = cos(3x^2) * d/dx[3x^2] = 6x * cos(3x^2).
- Section 3.3: Tangent line equation at x = a is y - y1 = m*(x - x1) where m = f'(a).`,
  },
  {
    title: 'Reconstruction Era & The 14th Amendment',
    subject: 'AP US History',
    topic: 'Post-Civil War Amendments',
    sectionHeaders: 'Presidential vs Radical Reconstruction, Reconstruction Amendments, Compromise of 1877',
    rawText: `# AP US History: Reconstruction (1865-1877)

## 1. The Reconstruction Amendments
- 13th Amendment (1865): Formally abolished slavery and involuntary servitude, except as punishment for a crime.
- 14th Amendment (1868):
  * Section 1 Citizenship Clause: All persons born or naturalized in the US are citizens.
  * Privileges or Immunities Clause: Prevents states from abridging citizen privileges.
  * Due Process Clause: Forbids states from depriving any person of life, liberty, or property without due process of law.
  * Equal Protection Clause: Mandates that no state shall deny to any person equal protection of the laws; aimed at invalidating Southern "Black Codes".
- 15th Amendment (1870): Prohibited the denial of voting rights based on race, color, or previous condition of servitude (notably did not include sex/gender).

## 2. Radical Reconstruction & Military Reconstruction Act of 1867
- Divided the South into five military districts governed by Union generals.
- Required Southern states to draft new constitutions guaranteeing Black suffrage and ratify the 14th Amendment prior to readmission to the Union.`,
  },
];

export const DEFAULT_STYLE_PROFILE = {
  summary: 'Direct, clear student voice that gets straight to the point. Uses conversational transitions ("Notice that", "This means that", "Basically") while maintaining academic accuracy. For math, writes sequential algebraic lines, clearly labels intermediate steps with arrows, and boxes the final answer.',
  toneDescription: 'Active voice, concise sentences (12-18 words average), avoids overly verbose jargon when a direct explanation works better. Uses natural phrasing like "To start off," and "Hence,".',
  mathHabits: 'Lays out steps vertically line-by-line. Uses `->` for transitions between algebraic simplifications. States formulas first before plugging in values. Highlights final answers with "[Answer: ...]" and includes physical units explicitly.',
  commonPhrases: 'Notice that, Therefore, This means that, Plugging in, Hence, This gives',
  vocabularyLevel: 'High School Honors / AP Student',
  formalityScore: 68,
  stepDetailScore: 82,
  sampleCount: 2,
};

export const DEFAULT_SAMPLES = [
  {
    title: 'Gatsby American Dream Essay Extract',
    subject: 'English Lit',
    type: 'essay' as const,
    contentText: `Fitzgerald doesn't just portray the American Dream as difficult—he shows that it's essentially an illusion built on nostalgia. Notice that Gatsby isn't actually in love with the real Daisy Buchanan; he's obsessed with the preserved snapshot of her from five years prior. When Nick notes that "the colossal vitality of his illusion" had gone beyond Daisy, it proves that no reality could ever match Gatsby's fantasy. Therefore, Gatsby's downfall wasn't caused by a lack of wealth, but by his stubborn refusal to accept that time only moves forward.`,
    extractedTraits: 'Uses "Notice that" to introduce textual evidence, concise argumentative sentences, directly answers the prompt without fluff.',
  },
  {
    title: 'AP Calculus Problem Set Sample',
    subject: 'Calculus AB',
    type: 'math_homework' as const,
    contentText: `Problem 2: Find dy/dx for y = (3x^2 - 5)^4 at x = 2.

Step 1: Use the chain rule. Outer function is u^4, inner function is u = 3x^2 - 5.
dy/dx = 4(3x^2 - 5)^3 * d/dx[3x^2 - 5]

Step 2: Take derivative of the inside:
d/dx[3x^2 - 5] = 6x

Step 3: Combine together:
dy/dx = 4(3x^2 - 5)^3 * (6x)
-> dy/dx = 24x(3x^2 - 5)^3

Step 4: Now evaluate at x = 2:
Plugging in x = 2:
y'(2) = 24(2) * (3(2)^2 - 5)^3
-> y'(2) = 48 * (3(4) - 5)^3
-> y'(2) = 48 * (12 - 5)^3
-> y'(2) = 48 * (7)^3
-> y'(2) = 48 * 343 = 16,464

[Answer: dy/dx at x = 2 is 16,464]`,
    extractedTraits: 'Numbered steps, uses arrow `->` for simplification, explicitly writes "Plugging in", final boxed answer.',
  },
];

export const SAMPLE_QUESTIONS = [
  {
    subject: 'AP Biology',
    question: 'Explain how ATP synthase produces ATP during chemiosmosis and what creates the driving force.',
    hint: 'Matches Unit 3: Cellular Energetics note',
  },
  {
    subject: 'Calculus AB',
    question: 'Find the derivative of y = sin(4x^3) and explain the rule used.',
    hint: 'Matches Calculus note on Chain Rule',
  },
  {
    subject: 'AP US History',
    question: 'How did the Fourteenth Amendment protect formerly enslaved people, and what clause targeted the Southern Black Codes?',
    hint: 'Matches Reconstruction Era note',
  },
];

export const DEFAULT_DECKS = [
  {
    title: 'Cellular Energetics & ATP Synthase Deck',
    subject: 'AP Biology',
    description: 'High-yield flashcards covering Glycolysis, Krebs Cycle, Chemiosmosis & the Electron Transport Chain.',
    cards: [
      {
        front: 'What is the net ATP and electron carrier yield of Glycolysis per glucose molecule?',
        back: 'Net yield: 2 ATP (via substrate-level phosphorylation) and 2 NADH. It breaks 1 glucose (6C) into 2 pyruvate (3C).',
        hint: 'Starts with 2 ATP invested, produces 4 ATP total.',
      },
      {
        front: 'What creates the proton-motive force (proton gradient) in mitochondria?',
        back: 'As high-energy electrons travel through ETC complexes I, III, and IV, protons (H+) are pumped from the mitochondrial matrix into the intermembrane space.',
        hint: 'Think about inner membrane vs intermembrane space.',
      },
      {
        front: 'How does ATP Synthase physically catalyze ADP + Pi -> ATP?',
        back: 'Protons diffuse down their electrochemical gradient through the catalytic rotor channel of ATP Synthase, rotating the rotor subunit and driving conformational changes to phosphorylate ADP.',
        hint: 'Chemiosmotic molecular rotary motor.',
      },
      {
        front: 'What is the role of Oxygen (O2) in aerobic cellular respiration?',
        back: 'Oxygen acts as the final electron acceptor at Complex IV: 1/2 O2 + 2 H+ + 2 e- -> H2O. Without O2, electrons back up and the ETC halts.',
        hint: 'Combines with protons and spent electrons to form water.',
      },
      {
        front: 'How does Cyanide inhibit cellular respiration?',
        back: 'Cyanide irreversibly binds to and blocks Complex IV (cytochrome c oxidase), preventing electron transfer to oxygen and dissipating the proton gradient.',
        hint: 'Direct poison of the final ETC complex.',
      },
      {
        front: 'Which enzyme is the key allosteric pacemaker of Glycolysis, and what inhibits it?',
        back: 'Phosphofructokinase (PFK). It is allosterically inhibited by high levels of ATP and citrate (negative feedback).',
        hint: 'PFK is turned off when energy is abundant.',
      },
    ],
  },
  {
    title: 'Differentiation Rules & Chain Rule Deck',
    subject: 'Calculus AB',
    description: 'Core differentiation formulas, mnemonics, and composite function procedures.',
    cards: [
      {
        front: 'State the general Chain Rule formula for composite function y = f(g(x)).',
        back: "dy/dx = f'(g(x)) * g'(x). (Differentiate outer function evaluated at the inside, then multiply by the derivative of the inside).",
        hint: 'Outer derivative times inner derivative.',
      },
      {
        front: 'What is the Product Rule mnemonic and formula?',
        back: "d/dx [f(x) * g(x)] = f'(x)g(x) + f(x)g'(x). ('Derivative of first times second, plus first times derivative of second').",
        hint: "Don't just multiply the two derivatives!",
      },
      {
        front: 'What is the Quotient Rule mnemonic and formula?',
        back: "d/dx [f(x) / g(x)] = [f'(x)g(x) - f(x)g'(x)] / [g(x)]^2. ('Low d-high minus high d-low over the square of what's below').",
        hint: 'Low d-high minus high d-low.',
      },
      {
        front: 'Calculate d/dx [sin(3x^2)].',
        back: "cos(3x^2) * d/dx[3x^2] = 6x * cos(3x^2). (Outer: sin -> cos; Inner: 3x^2 -> 6x).",
        hint: 'Chain rule with trig function.',
      },
      {
        front: 'What is the geometric meaning of the derivative f\'(a)?',
        back: 'The instantaneous rate of change and the slope of the tangent line to the curve y = f(x) at the point x = a.',
        hint: 'Slope of tangent line at x = a.',
      },
    ],
  },
];

