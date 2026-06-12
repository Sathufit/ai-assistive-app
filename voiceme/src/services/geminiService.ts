// Calls the Gemini REST API directly (the @google/generative-ai SDK is
// deprecated). Models retire over time — gemini-1.5-* and gemini-2.0-* are
// already shut down — so we try a chain of current free-tier models and
// remember whichever one works.
const MODEL_CANDIDATES = [
  'gemini-flash-latest', // alias: always points to the newest stable Flash
  'gemini-3-flash',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
];

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

let workingModel: string | null = null;

interface GeminiPart {
  text?: string;
  inlineData?: { data: string; mimeType: string };
}

function friendlyError(status: number, body: string): Error {
  if (status === 429) {
    return new Error(
      'The free AI limit was reached for now. Please wait a minute and try again.'
    );
  }
  if (status === 400 && /api key/i.test(body)) {
    return new Error(
      'The Gemini API key is invalid. Check the key in src/config/keys.ts or Settings.'
    );
  }
  if (status === 403) {
    return new Error(
      'The Gemini API key was rejected (403). Get a free key at aistudio.google.com/apikey.'
    );
  }
  return new Error(`Gemini error ${status}: ${body.slice(0, 200)}`);
}

async function generateContent(
  parts: GeminiPart[],
  apiKey: string,
  jsonOutput: boolean
): Promise<string> {
  const candidates = workingModel
    ? [workingModel, ...MODEL_CANDIDATES.filter((m) => m !== workingModel)]
    : MODEL_CANDIDATES;

  let lastError: Error | null = null;

  for (const model of candidates) {
    const generationConfig: Record<string, unknown> = {};
    if (jsonOutput) generationConfig.responseMimeType = 'application/json';
    // 2.5 models "think" by default which adds seconds of latency; disable.
    // Newer models reject thinkingBudget, so only send it where supported.
    if (model.startsWith('gemini-2.5')) {
      generationConfig.thinkingConfig = { thinkingBudget: 0 };
    }

    const res = await fetch(`${API_BASE}/${model}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({ contents: [{ parts }], generationConfig }),
    });

    if (res.ok) {
      const data = await res.json();
      const text: string = (data?.candidates?.[0]?.content?.parts ?? [])
        .map((p: { text?: string }) => p.text ?? '')
        .join('');
      workingModel = model;
      return text;
    }

    const body = await res.text();
    lastError = friendlyError(res.status, body);
    // 404 = this model was retired or renamed → try the next one
    if (res.status !== 404) throw lastError;
  }

  throw lastError ?? new Error('No Gemini model available');
}

export async function recognizeHandwriting(
  base64Image: string,
  apiKey: string
): Promise<string> {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('No API key provided');
  }

  const prompt =
    'You are reading handwriting from a touchscreen drawing canvas. ' +
    'The writer has limited hand control, so strokes may be shaky, uneven, or incomplete. ' +
    'The text is in English, Sinhala (සිංහල), or a mix of both. ' +
    'Read the whole image left to right, top to bottom, and transcribe every word. ' +
    'If a word is unclear, choose the most likely everyday word given the context ' +
    '(daily needs, family conversation, medical needs). ' +
    'Return ONLY the transcribed text with no explanation, labels, or quotes. ' +
    'If the canvas is blank or contains only stray dots, return nothing.';

  try {
    const text = await generateContent(
      [
        { text: prompt },
        { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
      ],
      apiKey.trim(),
      false
    );
    return text.trim();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Gemini OCR error:', message);
    throw error instanceof Error ? error : new Error(message);
  }
}

export async function getPredictions(
  text: string,
  language: string,
  apiKey: string
): Promise<{ words: string[]; sentences: string[] }> {
  if (!apiKey || apiKey.trim() === '' || !text || text.trim() === '') {
    return { words: [], sentences: [] };
  }

  const langInstruction =
    language === 'sinhala'
      ? 'Respond in Sinhala only.'
      : language === 'english'
      ? 'Respond in English only.'
      : 'Respond in the same language as the input text.';

  const prompt =
    `You are an AAC (Augmentative and Alternative Communication) assistant helping ` +
    `a person with Motor Neurone Disease who cannot speak. They wrote: "${text}"\n\n` +
    `${langInstruction}\n\n` +
    `Suggest useful next words and complete sentences for daily communication, ` +
    `medical needs, or expressing feelings and needs.\n\n` +
    `Reply ONLY with this exact JSON (no markdown, no code block, just raw JSON):\n` +
    `{"words":["w1","w2","w3","w4","w5"],"sentences":["Full sentence 1","Full sentence 2","Full sentence 3"]}`;

  try {
    const raw = (await generateContent([{ text: prompt }], apiKey.trim(), true))
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const parsed = JSON.parse(raw);
    return {
      words: Array.isArray(parsed.words) ? parsed.words.slice(0, 6) : [],
      sentences: Array.isArray(parsed.sentences) ? parsed.sentences.slice(0, 4) : [],
    };
  } catch (error: unknown) {
    // Predictions are a nice-to-have — never block the main flow on them
    const msg = error instanceof Error ? error.message : String(error);
    console.warn('Gemini predictions skipped:', msg);
    return { words: [], sentences: [] };
  }
}
