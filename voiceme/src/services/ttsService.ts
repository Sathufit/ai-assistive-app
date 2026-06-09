import * as Speech from 'expo-speech';

function detectLanguage(text: string): 'sinhala' | 'english' {
  // Sinhala unicode range: U+0D80 to U+0DFF
  const sinhalaPattern = /[඀-෿]/;
  return sinhalaPattern.test(text) ? 'sinhala' : 'english';
}

export function speak(
  text: string,
  language: 'sinhala' | 'english' | 'both',
  rate: number = 0.5,
  pitch: number = 1.0
): void {
  if (!text || text.trim() === '') return;

  let locale: string;

  if (language === 'sinhala') {
    locale = 'si-LK';
  } else if (language === 'english') {
    locale = 'en-US';
  } else {
    // 'both' — detect from script
    const detected = detectLanguage(text);
    locale = detected === 'sinhala' ? 'si-LK' : 'en-US';
  }

  Speech.stop();

  Speech.speak(text, {
    language: locale,
    rate,
    pitch,
    onError: (error) => {
      console.error('TTS error:', error);
      // Fallback to default locale if the detected one fails
      if (locale === 'si-LK') {
        Speech.speak(text, { language: 'en-US', rate, pitch });
      }
    },
  });
}

export function stop(): void {
  Speech.stop();
}

export async function getAvailableVoices(): Promise<Speech.Voice[]> {
  return Speech.getAvailableVoicesAsync();
}
