import { Router, Request, Response } from 'express';
import { ai } from './geminiClient.js';

export const apiRouter = Router();

// Helper to strip markdown code fences from JSON output
function cleanJsonOutput(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  return cleaned.trim();
}

/**
 * Endpoint to analyze past essays, math homework, or notes to extract personal writing style and math habits.
 */
apiRouter.post('/analyze-style', async (req: Request, res: Response) => {
  try {
    const { sampleText, sampleType, imageBase64, existingProfile } = req.body;

    if (!sampleText && !imageBase64) {
      return res.status(400).json({ error: 'Please provide either text or an image of your previous work.' });
    }

    const contents: any[] = [];

    let promptText = `
You are an expert linguistic and pedagogical stylist. Your task is to analyze this student's actual past school work (such as an essay, lab report, or handwritten math/science homework).

Analyze the student's unique authentic voice, habits, and formatting:
1. Tone & Formality: Are they concise, academic, conversational, punchy, direct?
2. Vocabulary & Sentence Patterns: Do they use complex words or clear plain language? What transition words do they favor (e.g. "Therefore", "Basically", "This indicates", "Hence", "In other words")?
3. Math & Science Problem Habits:
   - How do they format equations? (e.g., standard sequential lines, intermediate simplification, fraction forms, arrow step notations '->', labeling givens/finds)
   - Do they box their final answers or underline them?
   - Do they include brief rationale notes beside steps (e.g., "by factoring", "substituting x=4")?
4. Idiosyncrasies: Contractions used vs avoided, abbreviations (e.g., "w/", "approx", "eqn"), active vs passive voice.

${existingProfile ? `Previous style profile summary: "${existingProfile.summary}". Refine and update this profile with new evidence from this sample.` : ''}

Output ONLY a valid JSON object with the following fields:
{
  "summary": "A 2-3 sentence summary of their distinctive student voice and mathematical habits",
  "toneDescription": "Specific details about tone, sentence structure, and vocabulary choices",
  "mathHabits": "Specific details about how they lay out equations, formulas, step numbering, and final answers",
  "commonPhrases": "A comma-separated list of characteristic transition words or phrases they naturally use",
  "vocabularyLevel": "e.g., High School Honors, AP/College-level, Direct & Plain, Conversational-Academic",
  "formalityScore": 75, // 0 to 100 integer
  "stepDetailScore": 80, // 0 to 100 integer (how detailed or terse their math/explanation steps are)
  "sampleHighlights": "Brief note on what was learned specifically from this sample"
}
`;

    if (sampleText) {
      promptText += `\n\n--- SAMPLE WORK CONTENT (${sampleType || 'general'}) ---\n${sampleText}`;
    }

    if (imageBase64) {
      // Clean base64 prefix if present
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
      const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z]+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

      contents.push({
        inlineData: {
          mimeType,
          data: cleanBase64,
        },
      });
    }

    contents.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text || '{}';
    const parsed = JSON.parse(cleanJsonOutput(rawText));
    return res.json({ success: true, profile: parsed });
  } catch (error: any) {
    console.error('Error analyzing style:', error);
    return res.status(500).json({ error: error.message || 'Failed to analyze writing style.' });
  }
});

/**
 * Endpoint to solve a homework problem using exact quotes from notes and matching the student's personal style.
 */
apiRouter.post('/solve-homework', async (req: Request, res: Response) => {
  try {
    const {
      questionText,
      imageBase64,
      subject,
      notes, // Array of { title, topic, rawText }
      styleProfile,
      customAdjustment, // e.g. "extra concise", "more formal", "step-by-step algebra"
    } = req.body;

    if (!questionText && !imageBase64) {
      return res.status(400).json({ error: 'Please provide a homework question or upload a photo of the homework.' });
    }

    const contents: any[] = [];

    // Compile the available notes into a clearly delineated reference corpus
    let notesCorpus = 'NO NOTES PROVIDED BY USER.';
    if (Array.isArray(notes) && notes.length > 0) {
      notesCorpus = notes
        .map((n: any, idx: number) => {
          return `=== NOTE SOURCE [${idx + 1}]: "${n.title || 'Untitled Note'}" (Subject: ${n.subject || 'General'}, Topic: ${n.topic || 'General'}) ===\n${n.rawText || ''}\n`;
        })
        .join('\n\n');
    }

    const promptText = `
You are the EchoStudy Academic Engine. You have two critical requirements:
1. EXACT NOTE GROUNDING: Find the exact section, topic heading, and verbatim quote/formula from the student's uploaded notes that provides the rule, theorem, definition, or facts needed to solve this homework question.
2. PERSONAL VOICE & MATH REPLICATION: Write an answer that directly answers the question in the student's authentic personal writing and formula style, based on their Style Profile.

--- STUDENT'S PERSONAL STYLE PROFILE ---
Summary: ${styleProfile?.summary || 'Natural, clear student voice with standard step-by-step math layout'}
Tone: ${styleProfile?.toneDescription || 'Academic yet concise and direct'}
Math Formula Habits: ${styleProfile?.mathHabits || 'Shows step-by-step substitutions, fractions formatted cleanly, final answer marked with [Answer]'}
Habitual Phrases: ${styleProfile?.commonPhrases || 'Therefore, Since, Notice that, This gives'}
Vocabulary Level: ${styleProfile?.vocabularyLevel || 'High School / Early College'}
Formality Score: ${styleProfile?.formalityScore ?? 70}/100
Step Detail Score: ${styleProfile?.stepDetailScore ?? 75}/100
${customAdjustment ? `STUDENT REQUESTED TWEAK: "${customAdjustment}"` : ''}

--- STUDENT'S UPLOADED SCHOOL NOTES ---
${notesCorpus}

${questionText ? `--- HOMEWORK QUESTION / TEXT PROVIDED ---\n${questionText}\n` : ''}

--- INSTRUCTIONS FOR RESPONSE ---
1. Identify and transcribe the exact question from the text/image.
2. Search through the student's notes above.
   - If a matching note exists: Identify the Note Title, Section/Heading, and extract the EXACT WORDS or FORMULA from the notes that justifies the answer.
   - If no note is provided or the notes do not mention this topic: State clearly that the note vault doesn't have this specific topic yet, but provide the verified factual derivation and highlight what the student should add to their notes.
3. Write the "personalizedAnswer":
   - Write it so it sounds genuinely like the student wrote it. Use their natural phrasing, transitional words, and sentence structure.
   - For math/science: Lay out the equations and calculations exactly according to their mathHabits (steps, variables, boxed answer).
4. Provide a "handwritingReady" version:
   - A clean, monospace-friendly version that is effortless to handwrite onto a paper homework worksheet. Use bullet dashes, clear vertical step progression, and "[Answer: ...]".
5. Provide a "styleExplanation":
   - 2-3 sentences explaining which of their personal writing traits and formula formatting conventions you mirrored.

Output ONLY a valid JSON object conforming to:
{
  "transcribedQuestion": "The clear transcribed homework problem/question",
  "noteSourceTitle": "Title of the note where this was found (or 'General Subject Knowledge')",
  "noteSection": "Section or heading name from note (e.g. 'Section 3.2: Cellular Respiration' or 'Theorem 4')",
  "exactQuote": "The exact verbatim words or formula quoted directly from their notes",
  "personalizedAnswer": "The full homework answer written in their authentic student voice",
  "handwritingReady": "Concise, step-by-step version formatted specifically for copying down onto notebook/worksheet paper",
  "styleExplanation": "Breakdown of how this answer reflects their personal vocabulary, transitions, and math layout habits",
  "keyConcepts": ["List", "of", "2-4", "core", "concepts"]
}
`;

    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
      const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z]+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

      contents.push({
        inlineData: {
          mimeType,
          data: cleanBase64,
        },
      });
    }

    contents.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text || '{}';
    const parsed = JSON.parse(cleanJsonOutput(rawText));
    return res.json({ success: true, result: parsed });
  } catch (error: any) {
    console.error('Error solving homework:', error);
    return res.status(500).json({ error: error.message || 'Failed to solve homework problem.' });
  }
});

/**
 * Endpoint to extract school notes from an uploaded photo of a notebook, blackboard, or handout.
 */
apiRouter.post('/extract-notes', async (req: Request, res: Response) => {
  try {
    const { imageBase64, subjectHint } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Please upload an image of your notes.' });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
    const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

    const promptText = `
You are an expert OCR and study assistant. Transcribe and structure the student's handwritten or printed school notes from this photo.
${subjectHint ? `Subject context: ${subjectHint}` : ''}

Extract:
1. Suggested Note Title
2. Main Topic / Unit
3. Full transcribed content in clean Markdown with section headings (#, ##), bullet points, and accurately transcribed formulas or definitions.
4. Summary of key section headers (comma separated).

Output ONLY a valid JSON object:
{
  "title": "Clear descriptive title for the note",
  "topic": "Main topic or chapter",
  "rawText": "Complete transcribed note text with Markdown headers and bullet points",
  "sectionHeaders": "List of main section headings extracted"
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          inlineData: {
            mimeType,
            data: cleanBase64,
          },
        },
        { text: promptText },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text || '{}';
    const parsed = JSON.parse(cleanJsonOutput(rawText));
    return res.json({ success: true, note: parsed });
  } catch (error: any) {
    console.error('Error extracting notes:', error);
    return res.status(500).json({ error: error.message || 'Failed to transcribe notes from image.' });
  }
});

/**
 * Generate comprehensive flashcards from school notes or a topic
 */
apiRouter.post('/generate-flashcards', async (req: Request, res: Response) => {
  try {
    const { noteText, title, subject, topic, cardCount = 10 } = req.body;

    if (!noteText && !topic) {
      return res.status(400).json({ error: 'Please provide note text or a topic to generate flashcards.' });
    }

    const promptText = `
You are an expert pedagogical exam designer creating a high-yield flashcard deck for Quizlet-style active recall.
Deck: "${title || topic || 'Study Deck'}"
Subject: ${subject || 'General'}
Topic: ${topic || 'Core Material'}

Target Count: Generate approximately ${cardCount} cards.

Requirements:
- Front: A precise term, formula question, concept name, or high-yield exam question.
- Back: The exact definition, solution, key takeaways, and why it matters. Keep it clear, concise, and memorable.
- Hint: A subtle mnemonic or clue to trigger memory.
- Difficulty: "easy" | "medium" | "hard"

Source Material:
${noteText || `Topic knowledge for ${topic} in ${subject}`}

Output ONLY a JSON array of cards conforming to:
[
  {
    "front": "Term or concept question",
    "back": "Clear definition, key formula, or explanation",
    "hint": "Helpful mnemonic or memory trigger",
    "difficulty": "medium"
  }
]
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [{ text: promptText }],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text || '[]';
    const cards = JSON.parse(cleanJsonOutput(rawText));
    return res.json({ success: true, cards: Array.isArray(cards) ? cards : [] });
  } catch (error: any) {
    console.error('Error generating flashcards:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate flashcards.' });
  }
});

/**
 * Helper to generate algorithmic quiz questions from cards if Gemini is temporarily under high demand
 */
function generateFallbackQuiz(cards: any[], mode: string) {
  return cards.map((card, idx) => {
    const otherBacks = cards
      .filter((_, i) => i !== idx)
      .map((c) => c.back);
    const shuffledDistractors = otherBacks.sort(() => 0.5 - Math.random()).slice(0, 3);
    const options = [card.back, ...shuffledDistractors].sort(() => 0.5 - Math.random());
    return {
      id: `q_${idx + 1}`,
      type: 'multiple_choice',
      prompt: mode === 'cram'
        ? `[Speed Recall] Identify the correct definition / formula: "${card.front}"`
        : `What best defines or solves: "${card.front}"?`,
      options,
      correctAnswer: card.back,
      explanation: `Correct definition: ${card.back}${card.hint ? ` (Hint: ${card.hint})` : ''}`,
      sourceCardFront: card.front,
    };
  });
}

function fallbackCheckRecall(targetAnswer: string, userAnswer: string) {
  const targetWords = targetAnswer.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter((w) => w.length > 2);
  const userWords = userAnswer.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter((w) => w.length > 2);
  const matched = targetWords.filter((w) => userWords.includes(w));
  const accuracy = Math.min(100, Math.round((matched.length / Math.max(1, targetWords.length)) * 100));
  const isCorrect = accuracy >= 45 || userAnswer.trim().toLowerCase() === targetAnswer.trim().toLowerCase();
  return {
    isCorrect,
    accuracyPercent: accuracy,
    feedback: isCorrect
      ? 'Good active recall! You captured the main keywords and core concept.'
      : 'Some key terms were missed. Compare your answer with the target below.',
    missingKeywords: targetWords.filter((w) => !userWords.includes(w)).slice(0, 4),
  };
}

/**
 * Generate adaptive Quizlet-style questions (Multiple Choice & Written Recall) for Learn & Cram Mode
 */
apiRouter.post('/generate-quiz', async (req: Request, res: Response) => {
  try {
    const { cards, mode = 'learn', subject = 'General' } = req.body;

    if (!Array.isArray(cards) || cards.length === 0) {
      return res.status(400).json({ error: 'Cards array is required.' });
    }

    try {
      const promptText = `
You are an elite study coach building an adaptive ${mode === 'cram' ? 'HIGH-INTENSITY EXAM CRAM CHALLENGE' : 'QUIZLET-STYLE LEARN MODE'}.

Cards Deck:
${JSON.stringify(cards.map((c: any) => ({ front: c.front, back: c.back })), null, 2)}

Requirements for ${mode}:
${
  mode === 'cram'
    ? '- CRAM MODE: Generate rapid, high-stakes questions testing the most critical formulas, edge cases, and commonly confused definitions. Include a brief explanation of the common pitfall.'
    : '- LEARN MODE: Generate a balanced mix of multiple choice (with 4 realistic options), true/false, and written term identification.'
}

Output ONLY a JSON array of questions conforming to:
[
  {
    "id": "q1",
    "type": "multiple_choice",
    "prompt": "Question or term definition prompt",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Exact correct option string",
    "explanation": "Why this is correct and what trap to avoid",
    "sourceCardFront": "Original card front reference"
  }
]
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [{ text: promptText }],
        config: {
          responseMimeType: 'application/json',
        },
      });

      const rawText = response.text || '[]';
      const questions = JSON.parse(cleanJsonOutput(rawText));
      if (Array.isArray(questions) && questions.length > 0) {
        return res.json({ success: true, questions });
      }
    } catch (aiErr: any) {
      console.warn('Gemini generateContent temporary error, using algorithmic quiz generator:', aiErr.message);
    }

    // Algorithmic Quizlet-style question generator fallback
    const fallbackQuestions = generateFallbackQuiz(cards, mode);
    return res.json({ success: true, questions: fallbackQuestions });
  } catch (error: any) {
    console.error('Error generating quiz:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate study session.' });
  }
});

/**
 * Check typed memory recall answer (Memorize Mode)
 */
apiRouter.post('/check-memorize-recall', async (req: Request, res: Response) => {
  try {
    const { targetAnswer, userAnswer, questionPrompt } = req.body;

    if (!targetAnswer || !userAnswer) {
      return res.status(400).json({ error: 'targetAnswer and userAnswer are required.' });
    }

    try {
      const promptText = `
You are an evaluation assistant for active recall study. Compare the student's typed response with the target answer.
Prompt: "${questionPrompt}"
Target Expected Answer: "${targetAnswer}"
Student's Typed Answer: "${userAnswer}"

Grade leniently for minor typos, abbreviations, or formatting differences as long as the core scientific, mathematical, or factual concepts are present.

Output ONLY a valid JSON:
{
  "isCorrect": true,
  "accuracyPercent": 95,
  "feedback": "Short encouraging explanation of accuracy and what (if anything) was missing or slightly off",
  "missingKeywords": ["any", "omitted", "essential", "keywords"]
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [{ text: promptText }],
        config: {
          responseMimeType: 'application/json',
        },
      });

      const rawText = response.text || '{}';
      const parsed = JSON.parse(cleanJsonOutput(rawText));
      if (parsed && typeof parsed.isCorrect === 'boolean') {
        return res.json({ success: true, result: parsed });
      }
    } catch (aiErr: any) {
      console.warn('Gemini recall check temporary error, using algorithmic evaluation:', aiErr.message);
    }

    const fallbackResult = fallbackCheckRecall(targetAnswer, userAnswer);
    return res.json({ success: true, result: fallbackResult });
  } catch (error: any) {
    console.error('Error checking recall:', error);
    return res.status(500).json({ error: error.message || 'Failed to check recall.' });
  }
});

apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'EchoStudy API', timestamp: new Date().toISOString() });
});


