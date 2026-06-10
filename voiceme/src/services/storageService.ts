import AsyncStorage from '@react-native-async-storage/async-storage';
import { Phrase, DEFAULT_PHRASES } from '../constants/defaultPhrases';

const PHRASES_KEY = '@voiceme_phrases';
const SETTINGS_KEY = '@voiceme_settings';

export interface AppSettings {
  language: 'sinhala' | 'english' | 'both';
  speechRate: number;
  speechPitch: number;
  geminiApiKey: string;
  elevenLabsApiKey: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  language: 'both',
  speechRate: 0.5,
  speechPitch: 1.0,
  geminiApiKey: '',
  elevenLabsApiKey: '',
};

export async function loadPhrases(): Promise<Phrase[]> {
  try {
    const stored = await AsyncStorage.getItem(PHRASES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Phrase[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    return DEFAULT_PHRASES;
  } catch (error) {
    console.error('Error loading phrases:', error);
    return DEFAULT_PHRASES;
  }
}

export async function savePhrases(phrases: Phrase[]): Promise<void> {
  try {
    await AsyncStorage.setItem(PHRASES_KEY, JSON.stringify(phrases));
  } catch (error) {
    console.error('Error saving phrases:', error);
  }
}

export async function loadSettings(): Promise<AppSettings> {
  try {
    const stored = await AsyncStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<AppSettings>;
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error loading settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}
