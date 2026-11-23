// ─────────────────────────────────────────────────────────────────────────────
// Gemini AI service
//
// Calls the Gemini REST API directly (Node 18+ global fetch) so we control
// timeouts and fallbacks. Why not the @google/generative-ai SDK?
//   - The SDK has no request timeout: when a model is overloaded the call can
//     hang for minutes, so the frontend just sees "not responding".
//   - Current Gemini models are "thinking" models: thinking tokens count
//     against maxOutputTokens, so small limits returned truncated/empty text.
//
// Behaviour:
//   - Tries each model in GEMINI_MODELS (comma separated) in order, falling
//     back on 503 / 429 / 404 / 5xx / timeouts / empty responses.
//   - Uses a low thinking level and adds headroom to maxOutputTokens.
//   - JSON-returning functions use responseMimeType: application/json.
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

const DEFAULT_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
];

// Per-attempt timeout. Overall time is bounded by OVERALL_DEADLINE_MS.
const REQUEST_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS) || 30000;
const OVERALL_DEADLINE_MS = 100000;
// Extra tokens reserved for the model's internal reasoning.
const THINKING_HEADROOM = 2048;

function getApiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is not set in environment variables.');
  }
  return key;
}

function getModels() {
  const fromEnv = (process.env.GEMINI_MODELS || process.env.GEMINI_MODEL || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  return fromEnv.length > 0 ? fromEnv : DEFAULT_MODELS;
}

class GeminiError extends Error {
  constructor(message, { status, retryable, thinkingUnsupported } = {}) {
    super(message);
    this.name = 'GeminiError';
    this.status = status;
    this.retryable = retryable;
    this.thinkingUnsupported = thinkingUnsupported;
  }
}

async function callModel(model, parts, { maxTokens, json, timeoutMs, useThinkingConfig }) {
  const generationConfig = {
    maxOutputTokens: maxTokens + THINKING_HEADROOM,
    temperature: 0.7,
  };
  if (json) generationConfig.responseMimeType = 'application/json';
  if (useThinkingConfig) generationConfig.thinkingConfig = { thinkingLevel: 'low' };

  let res;
  try {
    res = await fetch(`${API_BASE}/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': getApiKey(),
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    const timedOut = err.name === 'TimeoutError' || err.name === 'AbortError';
    throw new GeminiError(
      timedOut ? `Request to ${model} timed out` : `Network error calling ${model}: ${err.message}`,
      { retryable: true }
    );
  }

  let body;
  try {
    body = await res.json();
  } catch {
    throw new GeminiError(`Invalid response from ${model} (HTTP ${res.status})`, { status: res.status, retryable: true });
  }

  if (!res.ok) {
    const msg = body?.error?.message || `HTTP ${res.status}`;
    // 400 caused by thinkingConfig on a model that doesn't support it → caller retries without it
    const thinkingUnsupported = res.status === 400 && /thinking/i.test(msg);
    throw new GeminiError(`${model}: ${msg}`, {
      status: res.status,
      retryable: thinkingUnsupported || res.status === 404 || res.status === 429 || res.status >= 500,
      thinkingUnsupported,
    });
  }

  const candidate = body?.candidates?.[0];
  if (!candidate) {
    const reason = body?.promptFeedback?.blockReason;
    throw new GeminiError(
      reason ? `The AI blocked this request (${reason}).` : `${model} returned no candidates`,
      { retryable: !reason }
    );
  }

  // Skip internal "thought" parts; join only the visible answer text.
  const text = (candidate.content?.parts || [])
    .filter(p => !p.thought && typeof p.text === 'string')
    .map(p => p.text)
    .join('')
    .trim();

  if (!text) {
    throw new GeminiError(`${model} returned an empty response (finishReason: ${candidate.finishReason || 'unknown'})`, {
      retryable: true,
    });
  }

  if (candidate.finishReason === 'MAX_TOKENS') {
    console.warn(`[gemini] ${model} hit MAX_TOKENS; output may be truncated.`);
  }

  return text;
}

/**
 * Generate content, trying each configured model until one succeeds.
 * @param {Array|string} input  prompt string, or an array of Gemini "parts"
 */
async function generate(input, { maxTokens = 2048, json = false } = {}) {
  const parts = typeof input === 'string' ? [{ text: input }] : input;
  const models = getModels();
  const deadline = Date.now() + OVERALL_DEADLINE_MS;
  let lastError;

  for (const model of models) {
    let useThinkingConfig = true;
    // Up to 2 tries per model (second try only for transient errors)
    for (let attempt = 1; attempt <= 2; attempt++) {
      const remaining = deadline - Date.now();
      if (remaining < 3000) break;

      try {
        const t0 = Date.now();
        const text = await callModel(model, parts, {
          maxTokens,
          json,
          timeoutMs: Math.min(REQUEST_TIMEOUT_MS, remaining),
          useThinkingConfig,
        });
        console.log(`[gemini] ${model} ok in ${Date.now() - t0}ms`);
        return text;
      } catch (err) {
        lastError = err;
        console.warn(`[gemini] ${model} attempt ${attempt} failed: ${err.message}`);

        if (err.message?.includes('GEMINI_API_KEY')) throw err;

        if (err.thinkingUnsupported && useThinkingConfig) {
          useThinkingConfig = false;
          continue; // retry same model without thinkingConfig
        }
        if (!err.retryable) throw err;

        // Overloaded / not found / timeout → move to next model rather than waiting
        if (err.status === 503 || err.status === 404 || err.status === 429 || /timed out/.test(err.message)) break;

        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }

  const status = lastError?.status;
  if (status === 401 || status === 403) {
    throw new Error('Gemini API key is invalid or lacks permission. Check GEMINI_API_KEY.');
  }
  throw new Error('The AI service is busy right now. Please try again in a moment.');
}

// Robust JSON parsing: handles code fences or stray text around the JSON.
function parseJson(raw, expect = 'object') {
  let cleaned = raw.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const open = expect === 'array' ? '[' : '{';
    const close = expect === 'array' ? ']' : '}';
    const start = cleaned.indexOf(open);
    const end = cleaned.lastIndexOf(close);
    if (start !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error('No JSON found in AI response');
  }
}

// ── Summary instructions ─────────────────────────────────────────────────────
const SUMMARY_INSTRUCTIONS = {
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

// ── Summarize document (from pre-extracted text) ─────────────────────────────
async function summarizeDocument(extractedText, summaryType, materialTitle) {
  const instruction = SUMMARY_INSTRUCTIONS[summaryType] || SUMMARY_INSTRUCTIONS.quick_revision;
  const textSnippet = extractedText.length > 30000
    ? extractedText.substring(0, 30000) + '\n\n[Text truncated for processing]'
    : extractedText;

  const prompt = `You are an academic assistant helping a university student study.

Material Title: ${materialTitle}

Document Content:
${textSnippet}

Task: ${instruction}

Base your summary strictly on the provided document content. Do not add information from outside the document. Use Markdown formatting (headings and bullet points).`;

  return await generate(prompt, { maxTokens: summaryType === 'detailed' || summaryType === 'exam_oriented' ? 6000 : 3000 });
}

// ── Summarize document (from raw file — fallback when text extraction failed) ─
// Gemini accepts PDF inline. Legacy PPT/PPTX are not accepted as inline data,
// so for those we ask the user to re-upload (text extraction should cover them).
const FILE_MIME_TYPES = {
  pdf: 'application/pdf',
};

async function summarizeDocumentFromFile(fileBuffer, fileType, summaryType, materialTitle) {
  const type = (fileType || '').toLowerCase();
  const mimeType = FILE_MIME_TYPES[type];
  if (!mimeType) {
    throw new Error(`Could not read text from this ${type.toUpperCase()} file. Please convert it to PDF and upload it again.`);
  }

  const base64Data = fileBuffer.toString('base64');
  if (base64Data.length > 19 * 1024 * 1024) {
    throw new Error('File is too large for direct AI processing. Please upload a smaller file.');
  }

  const instruction = SUMMARY_INSTRUCTIONS[summaryType] || SUMMARY_INSTRUCTIONS.quick_revision;

  return await generate([
    {
      text: `You are an academic assistant helping a university student study.\n\nMaterial Title: ${materialTitle}\n\nTask: ${instruction}\n\nBase your summary strictly on the content in the attached document. Do not add information from outside the document. Use Markdown formatting.`,
    },
    { inlineData: { mimeType, data: base64Data } },
  ], { maxTokens: 6000 });
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

  const prompt = `You are a university examiner for ${subject.name}${subject.code ? ` (${subject.code})` : ''}.

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
- Do NOT add a preamble like "Here is a question"
- Make it suitable for written university examination
- Align difficulty and depth with the marks allocated`;

  const text = await generate(prompt, { maxTokens: questionType === 'case_study' ? 1500 : 800 });
  // Strip any leading label the model might add anyway
  return text.replace(/^\s*(\*\*)?(question|q\.?\s*\d*)\s*[:.)-]\s*(\*\*)?\s*/i, '').trim();
}

// ── Evaluate student answer ───────────────────────────────────────────────────
async function evaluateAnswer(question, studentAnswer, maxMarks, questionType, difficulty, syllabus, materialContext) {
  const prompt = `You are a strict but fair university examiner evaluating a student's written answer.

Question: ${question}
Maximum Marks: ${maxMarks}
Question Type: ${String(questionType).replace('_', ' ')}
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

Respond ONLY with a valid JSON object in this exact format:
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

  const raw = await generate(prompt, { maxTokens: 5000, json: true });

  try {
    const parsed = parseJson(raw, 'object');

    parsed.score = Number(parsed.score);
    if (!Number.isFinite(parsed.score)) throw new Error('Missing score');
    if (!parsed.breakdown || typeof parsed.breakdown !== 'object') parsed.breakdown = {};
    if (!parsed.model_answer) throw new Error('Missing model_answer');

    parsed.score = Math.round(Math.max(0, Math.min(maxMarks, parsed.score)) * 100) / 100;
    for (const k of ['conceptual_understanding', 'accuracy', 'completeness', 'structure', 'examples']) {
      const v = Number(parsed.breakdown[k]);
      parsed.breakdown[k] = Number.isFinite(v) ? Math.max(0, Math.min(10, v)) : null;
    }
    // Text fields may come back as arrays — flatten to strings for the DB
    for (const k of ['strengths', 'missing_points', 'incorrect_points', 'improvement_suggestions', 'model_answer']) {
      if (Array.isArray(parsed[k])) parsed[k] = parsed[k].map(x => `- ${x}`).join('\n');
      else if (parsed[k] != null && typeof parsed[k] !== 'string') parsed[k] = String(parsed[k]);
    }

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
If there is little information, suggest sensible general revision and practice tasks.

Respond ONLY with a valid JSON array in this format:
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

  const raw = await generate(prompt, { maxTokens: 2500, json: true });

  let tasks;
  try {
    tasks = parseJson(raw, 'array');
    if (!Array.isArray(tasks)) tasks = tasks?.tasks;
  } catch (err) {
    console.error('Failed to parse study recommendations:', err.message, raw.substring(0, 300));
    throw new Error('AI returned an invalid study plan. Please try again.');
  }
  if (!Array.isArray(tasks)) throw new Error('AI returned an invalid study plan. Please try again.');

  const validPriority = ['high', 'medium', 'low'];
  return tasks
    .filter(t => t && typeof t.title === 'string' && t.title.trim())
    .map(t => {
      const priority = String(t.priority || '').toLowerCase();
      const duration = parseInt(t.estimated_duration, 10);
      const days = parseInt(t.days_from_now, 10);
      return {
        title: t.title.trim().substring(0, 255),
        subject_name: t.subject_name || null,
        unit_name: t.unit_name && t.unit_name !== 'null' ? t.unit_name : null,
        estimated_duration: Number.isFinite(duration) && duration > 0 ? duration : 60,
        priority: validPriority.includes(priority) ? priority : 'medium',
        days_from_now: Number.isFinite(days) && days >= 0 ? Math.min(days, 30) : 0,
      };
    });
}

// ── Handwriting OCR extraction ────────────────────────────────────────────────
// Accepts a base64-encoded image string and its MIME type.
// Returns extracted text only — does NOT evaluate or summarise.
async function extractHandwritingFromImage(base64Image, mimeType) {
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

  const text = await generate([
    { text: extractionPrompt },
    { inlineData: { mimeType: mimeType === 'image/jpg' ? 'image/jpeg' : mimeType, data: base64Image } },
  ], { maxTokens: 4096 });

  return text.trim();
}

module.exports = {
  generate,
  summarizeDocument,
  summarizeDocumentFromFile,
  generateMockQuestion,
  evaluateAnswer,
  generateStudyRecommendations,
  extractHandwritingFromImage,
};
