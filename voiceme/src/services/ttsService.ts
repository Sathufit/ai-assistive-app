import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

const ELEVENLABS_VOICES_URL = 'https://api.elevenlabs.io/v1/voices';
const ELEVENLABS_TTS_BASE = 'https://api.elevenlabs.io/v1/text-to-speech';

// Cache voice ID per API key — only calls /v1/voices once per session
let cachedVoiceId: string | null = null;
let cachedKeyForVoice: string | null = null;

async function resolveVoiceId(apiKey: string): Promise<string> {
  if (cachedVoiceId && cachedKeyForVoice === apiKey) return cachedVoiceId;

  const res = await fetch(ELEVENLABS_VOICES_URL, {
    headers: { 'xi-api-key': apiKey },
  });
  if (!res.ok) throw new Error(`Could not fetch voices: ${res.status}`);

  const data = (await res.json()) as { voices: { voice_id: string; name: string }[] };
  if (!data.voices || data.voices.length === 0) {
    throw new Error('No voices in your ElevenLabs account');
  }

  cachedVoiceId = data.voices[0].voice_id;
  cachedKeyForVoice = apiKey;
  return cachedVoiceId;
}

function isSinhala(text: string): boolean {
  return /[඀-෿]/.test(text);
}

let sinhalaVoiceChecked = false;
let sinhalaVoiceAvailable = false;

async function checkSinhalaVoice(): Promise<boolean> {
  if (sinhalaVoiceChecked) return sinhalaVoiceAvailable;
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    sinhalaVoiceAvailable = voices.some(
      (v) => v.language?.startsWith('si') || v.identifier?.includes('si_LK') || v.identifier?.includes('si-LK')
    );
  } catch {
    sinhalaVoiceAvailable = false;
  }
  sinhalaVoiceChecked = true;
  return sinhalaVoiceAvailable;
}

let activeSound: Audio.Sound | null = null;

async function releaseSound(): Promise<void> {
  if (activeSound) {
    try {
      await activeSound.stopAsync();
      await activeSound.unloadAsync();
    } catch {}
    activeSound = null;
  }
}

async function playElevenLabsTTS(text: string, apiKey: string): Promise<void> {
  const voiceId = await resolveVoiceId(apiKey);

  const response = await fetch(`${ELEVENLABS_TTS_BASE}/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`ElevenLabs ${response.status}: ${body}`);
  }

  // Binary MP3 → base64 → temp file
  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64Audio = btoa(binary);

  const tempPath = `${FileSystem.cacheDirectory}tts_${Date.now()}.mp3`;
  await FileSystem.writeAsStringAsync(tempPath, base64Audio, {
    encoding: FileSystem.EncodingType.Base64,
  });

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  });

  const sound = new Audio.Sound();
  await sound.loadAsync({ uri: tempPath });
  activeSound = sound;
  await sound.playAsync();

  sound.setOnPlaybackStatusUpdate((status) => {
    if (!status.isLoaded) return;
    if (status.didJustFinish) {
      sound.unloadAsync().catch(() => {});
      FileSystem.deleteAsync(tempPath, { idempotent: true }).catch(() => {});
      if (activeSound === sound) activeSound = null;
    }
  });
}

export async function speak(
  text: string,
  language: 'sinhala' | 'english' | 'both',
  rate: number = 0.5,
  pitch: number = 1.0,
  elevenLabsApiKey?: string
): Promise<void> {
  if (!text || text.trim() === '') return;

  await releaseSound();
  Speech.stop();

  const hasSinhala = isSinhala(text);
  const useSinhala = language === 'sinhala' || (language === 'both' && hasSinhala);

  // Sinhala: device TTS (only engine with si-LK support)
  if (useSinhala) {
    const hasVoice = await checkSinhalaVoice();
    if (!hasVoice) {
      // Return a special marker so the caller can show a helpful alert
      throw new Error('SINHALA_VOICE_MISSING');
    }
    Speech.speak(text, {
      language: 'si-LK',
      rate,
      pitch,
      onError: () => Speech.speak(text, { language: 'en-US', rate, pitch }),
    });
    return;
  }

  // English: ElevenLabs if key is set
  if (elevenLabsApiKey && elevenLabsApiKey.trim() !== '') {
    try {
      await playElevenLabsTTS(text, elevenLabsApiKey);
      return;
    } catch (err) {
      console.warn('ElevenLabs TTS failed, falling back to device TTS:', err);
    }
  }

  // Fallback
  Speech.speak(text, { language: 'en-US', rate, pitch });
}

export function stop(): void {
  releaseSound();
  Speech.stop();
}

export async function getAvailableVoices(): Promise<Speech.Voice[]> {
  return Speech.getAvailableVoicesAsync();
}
