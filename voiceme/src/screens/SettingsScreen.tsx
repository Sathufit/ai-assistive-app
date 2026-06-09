import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useAppContext } from '../context/AppContext';
import { saveSettings } from '../services/storageService';
import { savePhrases } from '../services/storageService';
import { DEFAULT_PHRASES } from '../constants/defaultPhrases';

type Language = 'sinhala' | 'english' | 'both';

export default function SettingsScreen() {
  const { settings, setSettings, setPhrases } = useAppContext();
  const [apiKeyInput, setApiKeyInput] = useState(settings.geminiApiKey);

  async function handleLanguageChange(lang: Language) {
    const updated = { ...settings, language: lang };
    setSettings(updated);
    await saveSettings(updated);
  }

  async function handleRateChange(value: number) {
    const updated = { ...settings, speechRate: Math.round(value * 100) / 100 };
    setSettings(updated);
    await saveSettings(updated);
  }

  async function handlePitchChange(value: number) {
    const updated = { ...settings, speechPitch: Math.round(value * 100) / 100 };
    setSettings(updated);
    await saveSettings(updated);
  }

  async function handleSaveApiKey() {
    const updated = { ...settings, geminiApiKey: apiKeyInput.trim() };
    setSettings(updated);
    await saveSettings(updated);
    Alert.alert('Saved', 'API key saved successfully.');
  }

  async function handleResetPhrases() {
    Alert.alert(
      'Reset Phrases',
      'This will restore all default phrases. Any custom phrases will be removed.',
      [
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setPhrases(DEFAULT_PHRASES);
            await savePhrases(DEFAULT_PHRASES);
            Alert.alert('Done', 'Phrases reset to defaults.');
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }

  function langButtonStyle(lang: Language) {
    return [
      styles.langButton,
      settings.language === lang && styles.langButtonActive,
    ];
  }

  function langTextStyle(lang: Language) {
    return [
      styles.langButtonText,
      settings.language === lang && styles.langButtonTextActive,
    ];
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Language Mode */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Language Mode</Text>
        <Text style={styles.sectionDesc}>
          Choose which language to use for speech and predictions.
        </Text>
        <View style={styles.langRow}>
          <TouchableOpacity
            style={langButtonStyle('sinhala')}
            onPress={() => handleLanguageChange('sinhala')}
          >
            <Text style={langTextStyle('sinhala')}>සිංහල{'\n'}Sinhala</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={langButtonStyle('english')}
            onPress={() => handleLanguageChange('english')}
          >
            <Text style={langTextStyle('english')}>English</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={langButtonStyle('both')}
            onPress={() => handleLanguageChange('both')}
          >
            <Text style={langTextStyle('both')}>Both</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Speech Rate */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Speech Rate</Text>
        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>Slow</Text>
          <Slider
            style={styles.slider}
            minimumValue={0.1}
            maximumValue={1.0}
            value={settings.speechRate}
            onSlidingComplete={handleRateChange}
            minimumTrackTintColor="#4CAF50"
            maximumTrackTintColor="#ccc"
            thumbTintColor="#4CAF50"
          />
          <Text style={styles.sliderLabel}>Fast</Text>
        </View>
        <Text style={styles.sliderValue}>
          Current: {settings.speechRate.toFixed(1)}{' '}
          {settings.speechRate < 0.4
            ? '(Slow)'
            : settings.speechRate > 0.7
            ? '(Fast)'
            : '(Normal)'}
        </Text>
      </View>

      {/* Speech Pitch */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Speech Pitch</Text>
        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>Low</Text>
          <Slider
            style={styles.slider}
            minimumValue={0.5}
            maximumValue={2.0}
            value={settings.speechPitch}
            onSlidingComplete={handlePitchChange}
            minimumTrackTintColor="#2196F3"
            maximumTrackTintColor="#ccc"
            thumbTintColor="#2196F3"
          />
          <Text style={styles.sliderLabel}>High</Text>
        </View>
        <Text style={styles.sliderValue}>
          Current: {settings.speechPitch.toFixed(1)}
        </Text>
      </View>

      {/* Gemini API Key */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gemini API Key</Text>
        <Text style={styles.sectionDesc}>
          Required for handwriting recognition and predictions.
        </Text>
        <TextInput
          style={styles.apiKeyInput}
          value={apiKeyInput}
          onChangeText={setApiKeyInput}
          placeholder="Paste your free API key here"
          placeholderTextColor="#aaa"
          autoCapitalize="none"
          autoCorrect={false}
          accessible
          accessibilityLabel="Gemini API key input"
        />
        <Text style={styles.apiKeyHint}>
          Get a free key at{' '}
          <Text style={styles.link}>aistudio.google.com</Text>
        </Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveApiKey}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Save API key"
        >
          <Text style={styles.saveButtonText}>Save API Key</Text>
        </TouchableOpacity>
      </View>

      {/* Reset Phrases */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Phrases</Text>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleResetPhrases}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Reset phrases to defaults"
        >
          <Text style={styles.resetButtonText}>Reset Phrases to Defaults</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomPad} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
    marginBottom: 6,
  },
  sectionDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  langRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  langButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    minHeight: 60,
    justifyContent: 'center',
    backgroundColor: '#fafafa',
  },
  langButtonActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  langButtonText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  langButtonTextActive: {
    color: '#2E7D32',
    fontWeight: '700',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slider: {
    flex: 1,
    height: 50,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#888',
    width: 40,
    textAlign: 'center',
  },
  sliderValue: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
    textAlign: 'center',
  },
  apiKeyInput: {
    borderWidth: 1.5,
    borderColor: '#BBDEFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#222',
    backgroundColor: '#F8FBFF',
    marginBottom: 8,
  },
  apiKeyHint: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  link: {
    color: '#1565C0',
    textDecorationLine: 'underline',
  },
  saveButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 52,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  resetButton: {
    backgroundColor: '#FF7043',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 52,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  bottomPad: {
    height: 20,
  },
});
