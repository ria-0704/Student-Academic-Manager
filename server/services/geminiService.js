// const { GoogleGenerativeAI } = require('@google/generative-ai');

// let genAI = null;

// function getClient() {
//   if (!genAI) {
//     if (!process.env.GEMINI_API_KEY) {
//       throw new Error('GEMINI_API_KEY is not set in environment variables.');
//     }
//     genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
//   }
//   return genAI;
// }

// async function generateText(prompt, maxTokens = 4096) {
//   const client = getClient();

//   const model = client.getGenerativeModel({
//     model: 'gemini-3.6-flash'
//   });

//   const maxAttempts = 3;

//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       const result = await model.generateContent({
//         contents: [
//           {
//             role: 'user',
//             parts: [{ text: prompt }]
//           }
//         ],
//         generationConfig: {
//           maxOutputTokens: maxTokens,
//           temperature: 0.7
//         },
//       });

//       return result.response.text();

//     } catch (error) {
//       const message = error?.message || '';

//       console.log(`Gemini attempt ${attempt}/${maxAttempts} failed`);

//       // Retry temporary server/rate-limit errors
//       if (
//         attempt < maxAttempts &&
//         (message.includes('503') ||
//          message.includes('Service Unavailable') ||
//          message.includes('429'))
//       ) {
//         const waitTime = attempt * 3000;

//         console.log(`Retrying Gemini in ${waitTime / 1000} seconds...`);

//         await new Promise(resolve =>
//           setTimeout(resolve, waitTime)
//         );

//         continue;
//       }

//       throw error;
//     }
//   }
// }

// // ── Summarize document ────────────────────────────────────────────────────────
// async function summarizeDocument(extractedText, summaryType, materialTitle) {
//   const typeInstructions = {
//     quick_revision: 'Create a concise quick revision summary with key points in bullet format. Keep it brief and focused on the most important concepts.',
//     detailed: 'Create a comprehensive detailed summary covering all major topics, concepts, and explanations in the document.',
//     exam_oriented: `Create exam-oriented notes with:
// - Important definitions and concepts
// - Key points to remember
// - Important comparisons and contrasts
// - Examples and illustrations
// - Frequently tested facts
// - Short summaries of each topic
// Format it clearly for exam revision.`,
//     simple: 'Explain the content in simple, easy-to-understand language suitable for someone new to the topic.',
//   };

//   const instruction = typeInstructions[summaryType] || typeInstructions.quick_revision;
//   const textSnippet = extractedText.length > 15000 ? extractedText.substring(0, 15000) + '\n\n[Text truncated for processing]' : extractedText;

//   const prompt = `You are an academic assistant helping a university student study.

// Material Title: ${materialTitle}

// Document Content:
// ${textSnippet}

// Task: ${instruction}

// Base your summary strictly on the provided document content. Do not add information from outside the document.`;

//   return await generateText(prompt, 3000);
// }

// // ── Generate mock question ────────────────────────────────────────────────────
// async function generateMockQuestion(subject, unit, syllabus, difficulty, questionType, marks, materialContext) {
//   const typeDesc = {
//     long_answer: 'long answer theoretical question requiring detailed explanation',
//     short_answer: 'short answer question requiring a concise but complete answer',
//     case_study: 'case study based question presenting a scenario and asking for analysis',
//   };

//   const difficultyDesc = {
//     easy: 'basic conceptual understanding',
//     medium: 'application and analysis level',
//     hard: 'advanced analysis, synthesis, or evaluation level',
//   };

//   const prompt = `You are a university examiner for ${subject.name} (${subject.code || ''}).

// Generate a single ${typeDesc[questionType] || 'theoretical question'} for university examination.

// Subject: ${subject.name}
// ${unit ? `Unit: Unit ${unit.unit_number} - ${unit.title}` : 'Scope: Entire Subject'}
// ${syllabus ? `Syllabus Context:\n${syllabus}` : ''}
// ${materialContext ? `Relevant Study Material Context:\n${materialContext.substring(0, 5000)}` : ''}

// Requirements:
// - Difficulty: ${difficulty} (${difficultyDesc[difficulty]})
// - Question Type: ${typeDesc[questionType]}
// - Maximum Marks: ${marks}
// - The question should be appropriate for a ${marks}-mark answer

// Important rules:
// - Generate ONLY the question text, nothing else
// - Do NOT include the answer, hints, or marking scheme
// - Do NOT number the question
// - Make it suitable for written university examination
// - Align difficulty and depth with the marks allocated`;

//   return await generateText(prompt, 500);
// }

// // ── Evaluate student answer ───────────────────────────────────────────────────
// async function evaluateAnswer(question, studentAnswer, maxMarks, questionType, difficulty, syllabus, materialContext) {
//   const prompt = `You are a strict but fair university examiner evaluating a student's written answer.

// Question: ${question}
// Maximum Marks: ${maxMarks}
// Question Type: ${questionType.replace('_', ' ')}
// Difficulty Level: ${difficulty}

// ${syllabus ? `Syllabus Context:\n${syllabus}\n` : ''}
// ${materialContext ? `Relevant Study Material:\n${materialContext.substring(0, 4000)}\n` : ''}

// Student's Answer:
// ${studentAnswer}

// Evaluate this answer like a university examiner. Award marks based on:
// 1. Conceptual understanding (core concepts correct)
// 2. Accuracy (factual correctness)
// 3. Completeness (all important points covered for the marks)
// 4. Structure (logical flow and organization)
// 5. Use of examples (where appropriate for the question type and marks)

// Do NOT penalize for grammar or different but correct wording.
// Give credit for any correct concept even if phrased differently.

// Respond ONLY with a valid JSON object in this exact format (no markdown, no extra text):
// {
//   "score": <number between 0 and ${maxMarks}>,
//   "breakdown": {
//     "conceptual_understanding": <score out of 10>,
//     "accuracy": <score out of 10>,
//     "completeness": <score out of 10>,
//     "structure": <score out of 10>,
//     "examples": <score out of 10>
//   },
//   "strengths": "<what the student did well, specific points>",
//   "missing_points": "<important concepts or points that were missing>",
//   "incorrect_points": "<any factually or conceptually incorrect statements, or 'None' if all correct>",
//   "improvement_suggestions": "<specific actionable exam-oriented improvement suggestions>",
//   "model_answer": "<an ideal ${maxMarks}-mark answer appropriate in length and depth for ${maxMarks} marks>"
// }`;

//   const raw = await generateText(prompt, 3000);

//   // Parse and validate JSON
//   try {
//     const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
//     const parsed = JSON.parse(cleaned);

//     // Validate required fields
//     if (typeof parsed.score !== 'number') throw new Error('Missing score');
//     if (!parsed.breakdown) throw new Error('Missing breakdown');
//     if (!parsed.model_answer) throw new Error('Missing model_answer');

//     // Clamp score to valid range
//     parsed.score = Math.max(0, Math.min(maxMarks, parsed.score));

//     return parsed;
//   } catch (parseErr) {
//     console.error('Failed to parse Gemini evaluation response:', parseErr.message);
//     console.error('Raw response:', raw.substring(0, 500));
//     throw new Error('AI returned an invalid evaluation format. Please try again.');
//   }
// }

// // ── Generate study plan recommendations ──────────────────────────────────────
// async function generateStudyRecommendations(context) {
//   const prompt = `You are an academic advisor helping a university student plan their studies.

// Current situation:
// ${context}

// Generate 5-8 practical study tasks for the next few days.
// Each task should be specific, actionable, and realistic.

// Respond ONLY with a valid JSON array (no markdown, no extra text):
// [
//   {
//     "title": "<specific task title>",
//     "subject_name": "<subject name>",
//     "unit_name": "<unit name or null>",
//     "estimated_duration": <minutes as number>,
//     "priority": "<high|medium|low>",
//     "days_from_now": <0 for today, 1 for tomorrow, etc.>
//   }
// ]`;

//   const raw = await generateText(prompt, 1500);
//   try {
//     const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
//     return JSON.parse(cleaned);
//   } catch {
//     return [];
//   }
// }

// module.exports = {
//   summarizeDocument,
//   generateMockQuestion,
//   evaluateAnswer,
//   generateStudyRecommendations,
// };
const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;

function getClient() {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in environment variables.');
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

async function generateText(prompt, maxTokens = 4096) {
  const client = getClient();

  const model = client.getGenerativeModel({
    model: 'gemini-3.6-flash'
  });

  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: 0.7
        },
      });

      return result.response.text();

     } catch (error) {
  const message = error?.message || '';

  console.error(`Gemini attempt ${attempt}/${maxAttempts} failed`);
  console.error('FULL GEMINI ERROR:', error);
  console.error('GEMINI ERROR MESSAGE:', message);

      // Retry temporary server/rate-limit errors
      if (
        attempt < maxAttempts &&
        (message.includes('503') ||
         message.includes('Service Unavailable') ||
         message.includes('429'))
      ) {
        const waitTime = attempt * 3000;

        console.log(`Retrying Gemini in ${waitTime / 1000} seconds...`);

        await new Promise(resolve =>
          setTimeout(resolve, waitTime)
        );

        continue;
      }

      throw error;
    }
  }
}

// ── Summarize document ────────────────────────────────────────────────────────
async function summarizeDocument(extractedText, summaryType, materialTitle) {
  const typeInstructions = {
    quick_revision: 'Create a concise quick revision summary with key points in bullet format. Keep it brief and focused on the most important concepts.',
    detailed: 'Create a comprehensive detailed summary covering all major topics, concepts, and explanations in the document.',
    exam_oriented: `Create exam-oriented notes with:
- Important definitions and concepts
- Key points to remember
- Important comparisons and contrasts
- Examples and illustrations
- Frequently tested facts
- Short summaries of each topic
Format it clearly for exam revision.`,
    simple: 'Explain the content in simple, easy-to-understand language suitable for someone new to the topic.',
  };

  const instruction = typeInstructions[summaryType] || typeInstructions.quick_revision;
  const textSnippet = extractedText.length > 15000 ? extractedText.substring(0, 15000) + '\n\n[Text truncated for processing]' : extractedText;

  const prompt = `You are an academic assistant helping a university student study.

Material Title: ${materialTitle}

Document Content:
${textSnippet}

Task: ${instruction}

Base your summary strictly on the provided document content. Do not add information from outside the document.`;

  return await generateText(prompt, 3000);
}

// ── Generate mock question ────────────────────────────────────────────────────
async function generateMockQuestion(subject, unit, syllabus, difficulty, questionType, marks, materialContext) {
  const typeDesc = {
    long_answer: 'long answer theoretical question requiring detailed explanation',
    short_answer: 'short answer question requiring a concise but complete answer',
    case_study: 'case study based question presenting a scenario and asking for analysis',
  };

  const difficultyDesc = {
    easy: 'basic conceptual understanding',
    medium: 'application and analysis level',
    hard: 'advanced analysis, synthesis, or evaluation level',
  };

  const prompt = `You are a university examiner for ${subject.name} (${subject.code || ''}).

Generate a single ${typeDesc[questionType] || 'theoretical question'} for university examination.

Subject: ${subject.name}
${unit ? `Unit: Unit ${unit.unit_number} - ${unit.title}` : 'Scope: Entire Subject'}
${syllabus ? `Syllabus Context:\n${syllabus}` : ''}
${materialContext ? `Relevant Study Material Context:\n${materialContext.substring(0, 5000)}` : ''}

Requirements:
- Difficulty: ${difficulty} (${difficultyDesc[difficulty]})
- Question Type: ${typeDesc[questionType]}
- Maximum Marks: ${marks}
- The question should be appropriate for a ${marks}-mark answer

Important rules:
- Generate ONLY the question text, nothing else
- Do NOT include the answer, hints, or marking scheme
- Do NOT number the question
- Make it suitable for written university examination
- Align difficulty and depth with the marks allocated`;

  return await generateText(prompt, 500);
}

// ── Evaluate student answer ───────────────────────────────────────────────────
async function evaluateAnswer(question, studentAnswer, maxMarks, questionType, difficulty, syllabus, materialContext) {
  const prompt = `You are a strict but fair university examiner evaluating a student's written answer.

Question: ${question}
Maximum Marks: ${maxMarks}
Question Type: ${questionType.replace('_', ' ')}
Difficulty Level: ${difficulty}

${syllabus ? `Syllabus Context:\n${syllabus}\n` : ''}
${materialContext ? `Relevant Study Material:\n${materialContext.substring(0, 4000)}\n` : ''}

Student's Answer:
${studentAnswer}

Evaluate this answer like a university examiner. Award marks based on:
1. Conceptual understanding (core concepts correct)
2. Accuracy (factual correctness)
3. Completeness (all important points covered for the marks)
4. Structure (logical flow and organization)
5. Use of examples (where appropriate for the question type and marks)

Do NOT penalize for grammar or different but correct wording.
Give credit for any correct concept even if phrased differently.

Respond ONLY with a valid JSON object in this exact format (no markdown, no extra text):
{
  "score": <number between 0 and ${maxMarks}>,
  "breakdown": {
    "conceptual_understanding": <score out of 10>,
    "accuracy": <score out of 10>,
    "completeness": <score out of 10>,
    "structure": <score out of 10>,
    "examples": <score out of 10>
  },
  "strengths": "<what the student did well, specific points>",
  "missing_points": "<important concepts or points that were missing>",
  "incorrect_points": "<any factually or conceptually incorrect statements, or 'None' if all correct>",
  "improvement_suggestions": "<specific actionable exam-oriented improvement suggestions>",
  "model_answer": "<an ideal ${maxMarks}-mark answer appropriate in length and depth for ${maxMarks} marks>"
}`;

  const raw = await generateText(prompt, 3000);

  // Parse and validate JSON
  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    // Validate required fields
    if (typeof parsed.score !== 'number') throw new Error('Missing score');
    if (!parsed.breakdown) throw new Error('Missing breakdown');
    if (!parsed.model_answer) throw new Error('Missing model_answer');

    // Clamp score to valid range
    parsed.score = Math.max(0, Math.min(maxMarks, parsed.score));

    return parsed;
  } catch (parseErr) {
    console.error('Failed to parse Gemini evaluation response:', parseErr.message);
    console.error('Raw response:', raw.substring(0, 500));
    throw new Error('AI returned an invalid evaluation format. Please try again.');
  }
}

// ── Generate study plan recommendations ──────────────────────────────────────
async function generateStudyRecommendations(context) {
  const prompt = `You are an academic advisor helping a university student plan their studies.

Current situation:
${context}

Generate 5-8 practical study tasks for the next few days.
Each task should be specific, actionable, and realistic.

Respond ONLY with a valid JSON array (no markdown, no extra text):
[
  {
    "title": "<specific task title>",
    "subject_name": "<subject name>",
    "unit_name": "<unit name or null>",
    "estimated_duration": <minutes as number>,
    "priority": "<high|medium|low>",
    "days_from_now": <0 for today, 1 for tomorrow, etc.>
  }
]`;

  const raw = await generateText(prompt, 1500);
  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
}

// ── Handwriting OCR extraction ────────────────────────────────────────────────
// Accepts a base64-encoded image string and its MIME type.
// Returns extracted text only — does NOT evaluate or summarise.
async function extractHandwritingFromImage(base64Image, mimeType) {
  const client = getClient();
  const model = client.getGenerativeModel({ model: 'gemini-3.6-flash' });

  const extractionPrompt = `You are a handwriting transcription system.
Extract ONLY the text written in this handwritten answer image.

Rules:
- Transcribe the student's answer as accurately as possible.
- Do not summarize.
- Do not improve grammar.
- Do not rewrite sentences.
- Do not add information that is not visible.
- Preserve paragraphs, numbering, equations, bullet points, and headings where possible.
- If a word is genuinely unreadable, mark it as [UNCLEAR] rather than guessing.
- Return only the transcribed answer text.`;

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          { text: extractionPrompt },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image,
            },
          },
        ],
      },
    ],
    generationConfig: {
      maxOutputTokens: 4096,
    },
  });

  return result.response.text().trim();
}

module.exports = {
  summarizeDocument,
  generateMockQuestion,
  evaluateAnswer,
  generateStudyRecommendations,
  extractHandwritingFromImage,
};