import React, { useCallback } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { useAppContext } from '../context/AppContext';
import DrawingCanvas from '../components/DrawingCanvas';
import TextDisplay from '../components/TextDisplay';
import PredictionBar from '../components/PredictionBar';
import QuickPhrases from '../components/QuickPhrases';
import SpeakButton from '../components/SpeakButton';
import { recognizeHandwriting, getPredictions } from '../services/geminiService';
import { speak } from '../services/ttsService';
import { Phrase } from '../constants/defaultPhrases';

export default function HomeScreen() {
  const {
    recognizedText,
    setRecognizedText,
    predictions,
    setPredictions,
    phrases,
    settings,
    isLoading,
    setIsLoading,
  } = useAppContext();

  const handleCapture = useCallback(
    async (base64: string) => {
      if (!settings.geminiApiKey || settings.geminiApiKey.trim() === '') {
        Alert.alert(
          'API Key Required',
          'Please add your Gemini API key in Settings to enable handwriting recognition.\n\nYou can still use Quick Phrases below.',
          [{ text: 'OK' }]
        );
        return;
      }

      setIsLoading(true);
      try {
        const recognized = await recognizeHandwriting(base64, settings.geminiApiKey);
        setRecognizedText(recognized);

        if (recognized && recognized.trim() !== '') {
          const preds = await getPredictions(
            recognized,
            settings.language,
            settings.geminiApiKey
          );
          setPredictions(preds);
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        Alert.alert('Recognition Failed', `Could not recognize text: ${message}`, [{ text: 'OK' }]);
      } finally {
        setIsLoading(false);
      }
    },
    [settings, setIsLoading, setRecognizedText, setPredictions]
  );

  async function handleSpeak() {
    if (!recognizedText || recognizedText.trim() === '') {
      Alert.alert('Nothing to speak', 'Please draw some text or select a phrase first.');
      return;
    }
    try {
      await speak(recognizedText, settings.language, settings.speechRate, settings.speechPitch, settings.elevenLabsApiKey);
    } catch (e: unknown) {
      if (e instanceof Error && e.message === 'SINHALA_TTS_UNAVAILABLE') {
        Alert.alert(
          'Sinhala Voice Unavailable',
          'Sinhala speech needs an internet connection (it uses the free Google voice).\n\n' +
          'Please check Wi-Fi or mobile data and try again.\n\n' +
          'Phrases spoken before are saved and still work offline.',
          [{ text: 'OK' }]
        );
      }
    }
  }

  function handleWordTap(word: string) {
    const trimmed = recognizedText.trim();
    setRecognizedText(trimmed ? `${trimmed} ${word}` : word);
  }

  function handleSentenceTap(sentence: string) {
    setRecognizedText(sentence);
  }

  async function handlePhraseTap(phrase: Phrase) {
    const textToSpeak = settings.language === 'english' ? phrase.english : phrase.sinhala;
    const lang = settings.language === 'english' ? 'english' : 'sinhala';
    try {
      await speak(textToSpeak, lang, settings.speechRate, settings.speechPitch, settings.elevenLabsApiKey);
    } catch (e: unknown) {
      if (e instanceof Error && e.message === 'SINHALA_TTS_UNAVAILABLE') {
        Alert.alert(
          'Sinhala Voice Unavailable',
          'Sinhala speech needs an internet connection. Please check Wi-Fi or mobile data and try again.'
        );
      }
    }
  }

  function handleClear() {
    setRecognizedText('');
    setPredictions({ words: [], sentences: [] });
  }

  return (
    <View style={styles.container}>
      {/* Canvas sits OUTSIDE the ScrollView so scroll gestures never
          compete with drawing touches */}
      <DrawingCanvas onCapture={handleCapture} onClear={handleClear} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TextDisplay text={recognizedText} onTextChange={setRecognizedText} />
        <PredictionBar
          words={predictions.words}
          sentences={predictions.sentences}
          onWordTap={handleWordTap}
          onSentenceTap={handleSentenceTap}
          isLoading={isLoading}
        />
        <QuickPhrases phrases={phrases} language={settings.language} onPhraseTap={handlePhraseTap} />
        <View style={styles.bottomPad} />
      </ScrollView>

      <SpeakButton onPress={handleSpeak} disabled={isLoading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  bottomPad: {
    height: 12,
  },
});
