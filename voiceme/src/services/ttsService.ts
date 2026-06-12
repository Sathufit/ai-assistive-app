import * as Speech from 'expo-speech';
import {
  createAudioPlayer,
  setAudioModeAsync,
  AudioPlayer,
} from 'expo-audio';
// cacheDirectory/writeAsStringAsync/downloadAsync live in /legacy now —
// importing from 'expo-file-system' makes them undefined and playback dies.
import * as FileSystem from 'expo-file-system/legacy';

const ELEVENLABS_VOICES_URL = 'https://api.elevenlabs.io/v1/voices';
const ELEVENLABS_TTS_BASE = 'https://api.elevenlabs.io/v1/text-to-speech';
const GOOGLE_TTS_URL = 'https://translate.google.com/translate_tts';
const GOOGLE_TTS_UA =
  'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36';

const CACHE_DIR = `${FileSystem.cacheDirectory}tts-cache/`;
// Google Translate TTS rejects long inputs; stay safely under the limit
const GOOGLE_TTS_MAX_CHARS = 180;

// ── Audio cache ──────────────────────────────────────────────────
// Spoken phrases repeat constantly in daily use; caching makes them
// instant, work offline once heard, and saves the free API quotas.

let cacheDirReady = false;

async function ensureCacheDir(): Promise<void> {
  if (cacheDirReady) return;
  const info = await FileSystem.getInfoAsync(CACHE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  }
  cacheDirReady = true;
}

function hashKey(input: string): string {
  let h1 = 5381;
  let h2 = 52711;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = (h1 * 33) ^ c;
    h2 = (h2 * 31) ^ c;
  }
  return ((h1 >>> 0).toString(36) + (h2 >>> 0).toString(36));
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 8192;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

// ── Playback ─────────────────────────────────────────────────────

let activePlayer: AudioPlayer | null = null;
let finishActivePlayback: (() => void) | null = null;
let playToken = 0;
let audioModeSet = false;

async function ensureAudioMode(): Promise<void> {
  if (audioModeSet) return;
  await setAudioModeAsync({
    allowsRecording: false,
    playsInSilentMode: true,
    interruptionMode: 'duckOthers',
  });
  audioModeSet = true;
}

function releasePlayer(): void {
  if (activePlayer) {
    const player = activePlayer;
    activePlayer = null;
    try {
      player.pause();
    } catch {}
    try {
      player.remove();
    } catch {}
  }
  // Unblock any speak() call awaiting playback completion
  if (finishActivePlayback) {
    const finish = finishActivePlayback;
    finishActivePlayback = null;
    finish();
  }
}

function clampRate(speechRate: number): number {
  // settings speechRate: 0.1–1.0 with 0.5 = normal → playback 0.6x–1.6x
  return Math.min(1.6, Math.max(0.6, speechRate * 2));
}

async function playFile(
  uri: string,
  rate: number,
  token: number
): Promise<void> {
  if (token !== playToken) return;
  await ensureAudioMode();

  const player = createAudioPlayer(uri);
  activePlayer = player;
  if (rate !== 1) {
    try {
      player.setPlaybackRate(rate, 'high');
    } catch {}
  }

  await new Promise<void>((resolve) => {
    finishActivePlayback = resolve;
    player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) resolve();
    });
    player.play();
  });

  if (finishActivePlayback) finishActivePlayback = null;
  if (activePlayer === player) {
    activePlayer = null;
    try {
      player.remove();
    } catch {}
  }
}

// ── Google Translate TTS (free, supports Sinhala + English) ──────

function splitForGoogleTTS(text: string): string[] {
  const trimmed = text.trim();
  if (trimmed.length <= GOOGLE_TTS_MAX_CHARS) return [trimmed];

  const chunks: string[] = [];
  let current = '';
  for (const word of trimmed.split(/\s+/)) {
    if ((current + ' ' + word).trim().length > GOOGLE_TTS_MAX_CHARS) {
      if (current) chunks.push(current.trim());
      current = word;
    } else {
      current = (current + ' ' + word).trim();
    }
  }
  if (current) chunks.push(current.trim());
  return chunks;
}

async function fetchGoogleTTSChunk(
  chunk: string,
  lang: string
): Promise<string> {
  await ensureCacheDir();
  const path = `${CACHE_DIR}g_${lang}_${hashKey(chunk)}.mp3`;
  const info = await FileSystem.getInfoAsync(path);
  if (info.exists && (info.size ?? 0) > 0) return path;

  const url =
    `${GOOGLE_TTS_URL}?ie=UTF-8&client=tw-ob&tl=${lang}` +
    `&textlen=${chunk.length}&q=${encodeURIComponent(chunk)}`;
  const result = await FileSystem.downloadAsync(url, path, {
    headers: { 'User-Agent': GOOGLE_TTS_UA },
  });
  if (result.status !== 200) {
    await FileSystem.deleteAsync(path, { idempotent: true }).catch(() => {});
    throw new Error(`Google TTS failed: ${result.status}`);
  }
  return path;
}

async function playGoogleTTS(
  text: string,
  lang: 'si' | 'en',
  rate: number,
  token: number
): Promise<void> {
  const chunks = splitForGoogleTTS(text);
  // Download everything first so playback has no gaps between chunks
  const paths = await Promise.all(
    chunks.map((c) => fetchGoogleTTSChunk(c, lang))
  );
  for (const path of paths) {
    if (token !== playToken) return;
    await playFile(path, rate, token);
  }
}

// ── ElevenLabs (premium English voice, optional) ─────────────────

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

async function fetchElevenLabsAudio(
  text: string,
  apiKey: string
): Promise<string> {
  await ensureCacheDir();
  const path = `${CACHE_DIR}el_${hashKey(text)}.mp3`;
  const info = await FileSystem.getInfoAsync(path);
  if (info.exists && (info.size ?? 0) > 0) return path;

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
    throw new Error(`ElevenLabs ${response.status}: ${body.slice(0, 200)}`);
  }

  const base64Audio = arrayBufferToBase64(await response.arrayBuffer());
  await FileSystem.writeAsStringAsync(path, base64Audio, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return path;
}

// ── Device TTS helpers ───────────────────────────────────────────

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
      (v) =>
        v.language?.startsWith('si') ||
        v.identifier?.includes('si_LK') ||
        v.identifier?.includes('si-LK')
    );
  } catch {
    sinhalaVoiceAvailable = false;
  }
  sinhalaVoiceChecked = true;
  return sinhalaVoiceAvailable;
}

// ── Public API ───────────────────────────────────────────────────

export async function speak(
  text: string,
  language: 'sinhala' | 'english' | 'both',
  rate: number = 0.5,
  pitch: number = 1.0,
  elevenLabsApiKey?: string
): Promise<void> {
  if (!text || text.trim() === '') return;

  const token = ++playToken;
  releasePlayer();
  Speech.stop();

  const trimmed = text.trim();
  const playbackRate = clampRate(rate);
  const useSinhala =
    language === 'sinhala' || (language === 'both' && isSinhala(trimmed));

  if (useSinhala) {
    // Google Translate is the only widely available Sinhala voice —
    // most Android phones have no si-LK voice in the device TTS engine.
    try {
      await playGoogleTTS(trimmed, 'si', playbackRate, token);
      return;
    } catch (err) {
      console.warn('Google Sinhala TTS failed, trying device voice:', err);
    }
    if (await checkSinhalaVoice()) {
      Speech.speak(trimmed, { language: 'si-LK', rate, pitch });
      return;
    }
    throw new Error('SINHALA_TTS_UNAVAILABLE');
  }

  // English: ElevenLabs (best) → Google (clear, free) → device voice
  if (elevenLabsApiKey && elevenLabsApiKey.trim() !== '') {
    try {
      const path = await fetchElevenLabsAudio(trimmed, elevenLabsApiKey.trim());
      await playFile(path, playbackRate, token);
      return;
    } catch (err) {
      console.warn('ElevenLabs TTS failed, falling back:', err);
    }
  }

  try {
    await playGoogleTTS(trimmed, 'en', playbackRate, token);
    return;
  } catch (err) {
    console.warn('Google English TTS failed, using device voice:', err);
  }

  if (token !== playToken) return;
  Speech.speak(trimmed, { language: 'en-US', rate, pitch });
}

export function stop(): void {
  playToken++;
  releasePlayer();
  Speech.stop();
}

export async function getAvailableVoices(): Promise<Speech.Voice[]> {
  return Speech.getAvailableVoicesAsync();
}
