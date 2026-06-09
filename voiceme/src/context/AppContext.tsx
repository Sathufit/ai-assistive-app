import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { Phrase, DEFAULT_PHRASES } from '../constants/defaultPhrases';
import {
  loadPhrases,
  loadSettings,
  AppSettings,
} from '../services/storageService';

interface Predictions {
  words: string[];
  sentences: string[];
}

interface AppContextType {
  recognizedText: string;
  setRecognizedText: (text: string) => void;

  predictions: Predictions;
  setPredictions: (predictions: Predictions) => void;

  phrases: Phrase[];
  setPhrases: (phrases: Phrase[]) => void;

  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;

  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [recognizedText, setRecognizedText] = useState('');
  const [predictions, setPredictions] = useState<Predictions>({
    words: [],
    sentences: [],
  });
  const [phrases, setPhrases] = useState<Phrase[]>(DEFAULT_PHRASES);
  const [settings, setSettings] = useState<AppSettings>({
    language: 'both',
    speechRate: 0.5,
    speechPitch: 1.0,
    geminiApiKey: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function init() {
      const [loadedPhrases, loadedSettings] = await Promise.all([
        loadPhrases(),
        loadSettings(),
      ]);
      setPhrases(loadedPhrases);
      setSettings(loadedSettings);
    }
    init();
  }, []);

  return (
    <AppContext.Provider
      value={{
        recognizedText,
        setRecognizedText,
        predictions,
        setPredictions,
        phrases,
        setPhrases,
        settings,
        setSettings,
        isLoading,
        setIsLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
