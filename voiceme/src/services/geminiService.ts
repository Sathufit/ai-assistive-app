import { GoogleGenerativeAI } from '@google/generative-ai';

export async function recognizeHandwriting(
  base64Image: string,
  apiKey: string
): Promise<string> {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('No API key provided');
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey.trim());
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt =
      'This image contains handwritten text in Sinhala or English or both. Extract and return ONLY the text that is written, exactly as written. If you cannot read it clearly, return your best guess. Return only the text, no explanation.';

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: 'image/png' as const,
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text().trim();
    return text;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Gemini OCR error:', message);
    throw new Error(`OCR failed: ${message}`);
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
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const langInstruction =
      language === 'sinhala'
        ? 'Respond in Sinhala only.'
        : language === 'english'
        ? 'Respond in English only.'
        : 'Respond in the same language as the input (Sinhala or English or both).';

    const prompt = `You are an AAC (Augmentative and Alternative Communication) assistant helping a person with Motor Neurone Disease who cannot speak. They have written: "${text}"

${langInstruction}

Provide word completions and full sentence suggestions that would be useful for daily communication, medical needs, or expressing feelings.

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks, just raw JSON):
{
  "words": ["word1", "word2", "word3", "word4", "word5"],
  "sentences": ["Complete sentence 1", "Complete sentence 2", "Complete sentence 3"]
}

Words should be likely next words or completions. Sentences should be natural, useful complete sentences based on the written text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text().trim();

    // Strip markdown code blocks if present
    responseText = responseText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const parsed = JSON.parse(responseText);

    return {
      words: Array.isArray(parsed.words) ? parsed.words.slice(0, 6) : [],
      sentences: Array.isArray(parsed.sentences)
        ? parsed.sentences.slice(0, 4)
        : [],
    };
  } catch (error: unknown) {
    console.error(
      'Gemini predictions error:',
      error instanceof Error ? error.message : String(error)
    );
    return { words: [], sentences: [] };
  }
}
