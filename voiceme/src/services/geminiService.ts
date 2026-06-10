import { GoogleGenerativeAI } from '@google/generative-ai';

// gemini-1.5-flash-8b: free tier, fast, good for OCR and short-text tasks
const MODEL = 'gemini-1.5-flash-8b';

function handle429(error: unknown): never {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes('429') || msg.includes('quota')) {
    throw new Error(
      'Gemini free-tier rate limit hit. Please wait 1–2 minutes and try again. ' +
      'You can also get a new API key at aistudio.google.com.'
    );
  }
  throw error instanceof Error ? error : new Error(msg);
}

export async function recognizeHandwriting(
  base64Image: string,
  apiKey: string
): Promise<string> {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('No API key provided');
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey.trim());
    const model = genAI.getGenerativeModel({ model: MODEL });

    const prompt =
      'Look at this handwriting image carefully. ' +
      'The person may have written in English, Sinhala (සිංහල), or a mix of both. ' +
      'Extract every word or letter visible, even if the handwriting is unclear or messy. ' +
      'Return ONLY the written text — no explanation, no punctuation added, no formatting. ' +
      'If a word is ambiguous, give your best guess. ' +
      'If the canvas appears blank or has only stray marks, return an empty string.';

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Image, mimeType: 'image/png' as const } },
    ]);
    return result.response.text().trim();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Gemini OCR error:', message);
    handle429(error);
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

  try {
    const genAI = new GoogleGenerativeAI(apiKey.trim());
    const model = genAI.getGenerativeModel({ model: MODEL });

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

    const result = await model.generateContent(prompt);
    let raw = result.response.text().trim()
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
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('429') || msg.includes('quota')) {
      console.warn('Gemini predictions: rate limit, skipping suggestions');
      return { words: [], sentences: [] };
    }
    console.error('Gemini predictions error:', msg);
    return { words: [], sentences: [] };
  }
}
