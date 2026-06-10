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
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useAppContext } from '../context/AppContext';
import { saveSettings, savePhrases } from '../services/storageService';
import { DEFAULT_PHRASES } from '../constants/defaultPhrases';

type Language = 'sinhala' | 'english' | 'both';

const LANG_OPTIONS: { key: Language; label: string }[] = [
  { key: 'sinhala', label: 'සිංහල\nSinhala' },
  { key: 'english', label: 'English' },
  { key: 'both', label: 'Both' },
];

export default function SettingsScreen() {
  const { settings, setSettings, setPhrases } = useAppContext();
  const [apiKeyInput, setApiKeyInput] = useState(settings.geminiApiKey);
  const [elevenLabsKeyInput, setElevenLabsKeyInput] = useState(settings.elevenLabsApiKey);

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

  async function handleSaveElevenLabsKey() {
    const updated = { ...settings, elevenLabsApiKey: elevenLabsKeyInput.trim() };
    setSettings(updated);
    await saveSettings(updated);
    Alert.alert('Saved', 'ElevenLabs API key saved. Voice is now active.');
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

  const rateLabel =
    settings.speechRate < 0.4 ? 'Slow' : settings.speechRate > 0.7 ? 'Fast' : 'Normal';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Language */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="language-outline" size={18} color="#2563EB" />
          <Text style={styles.sectionTitle}>Language Mode</Text>
        </View>
        <Text style={styles.sectionDesc}>Choose the language for speech output and predictions.</Text>
        <View style={styles.langRow}>
          {LANG_OPTIONS.map(({ key, label }) => {
            const active = settings.language === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.langButton, active && styles.langButtonActive]}
                onPress={() => handleLanguageChange(key)}
              >
                <Text style={[styles.langButtonText, active && styles.langButtonTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Speech Rate */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="speedometer-outline" size={18} color="#2563EB" />
          <Text style={styles.sectionTitle}>Speech Rate</Text>
          <View style={styles.valueBadge}>
            <Text style={styles.valueBadgeText}>
              {settings.speechRate.toFixed(1)} · {rateLabel}
            </Text>
          </View>
        </View>
        <View style={styles.sliderRow}>
          <Text style={styles.sliderEdge}>Slow</Text>
          <Slider
            style={styles.slider}
            minimumValue={0.1}
            maximumValue={1.0}
            value={settings.speechRate}
            onSlidingComplete={handleRateChange}
            minimumTrackTintColor="#2563EB"
            maximumTrackTintColor="#CBD5E1"
            thumbTintColor="#2563EB"
          />
          <Text style={styles.sliderEdge}>Fast</Text>
        </View>
      </View>

      {/* Speech Pitch */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="musical-notes-outline" size={18} color="#2563EB" />
          <Text style={styles.sectionTitle}>Speech Pitch</Text>
          <View style={styles.valueBadge}>
            <Text style={styles.valueBadgeText}>{settings.speechPitch.toFixed(1)}</Text>
          </View>
        </View>
        <View style={styles.sliderRow}>
          <Text style={styles.sliderEdge}>Low</Text>
          <Slider
            style={styles.slider}
            minimumValue={0.5}
            maximumValue={2.0}
            value={settings.speechPitch}
            onSlidingComplete={handlePitchChange}
            minimumTrackTintColor="#2563EB"
            maximumTrackTintColor="#CBD5E1"
            thumbTintColor="#2563EB"
          />
          <Text style={styles.sliderEdge}>High</Text>
        </View>
      </View>

      {/* ElevenLabs TTS */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="volume-high-outline" size={18} color="#2563EB" />
          <Text style={styles.sectionTitle}>AI Voice (ElevenLabs)</Text>
          {settings.elevenLabsApiKey !== '' && (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>Active</Text>
            </View>
          )}
        </View>
        <Text style={styles.sectionDesc}>
          Natural AI English voice — completely free (10,000 characters/month, no credit card).{'\n'}
          Sinhala text always uses the device voice.
        </Text>
        <TextInput
          style={styles.apiKeyInput}
          value={elevenLabsKeyInput}
          onChangeText={setElevenLabsKeyInput}
          placeholder="Paste your ElevenLabs API key"
          placeholderTextColor="#94A3B8"
          autoCapitalize="none"
          autoCorrect={false}
          accessible
          accessibilityLabel="ElevenLabs API key input"
        />
        <Text style={styles.apiKeyHint}>
          Sign up free at{' '}
          <Text style={styles.link}>elevenlabs.io</Text>
          {' '}→ Profile → API Keys → copy key.
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleSaveElevenLabsKey}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Save ElevenLabs API key"
        >
          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Save Voice Key</Text>
        </TouchableOpacity>
      </View>

      {/* Gemini API Key */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="key-outline" size={18} color="#2563EB" />
          <Text style={styles.sectionTitle}>Gemini API Key</Text>
        </View>
        <Text style={styles.sectionDesc}>
          Required for handwriting recognition and AI predictions.
        </Text>
        <TextInput
          style={styles.apiKeyInput}
          value={apiKeyInput}
          onChangeText={setApiKeyInput}
          placeholder="Paste your API key here"
          placeholderTextColor="#94A3B8"
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
          style={styles.primaryButton}
          onPress={handleSaveApiKey}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Save API key"
        >
          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Save API Key</Text>
        </TouchableOpacity>
      </View>

      {/* Phrases */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="chatbubbles-outline" size={18} color="#2563EB" />
          <Text style={styles.sectionTitle}>Phrases</Text>
        </View>
        <TouchableOpacity
          style={styles.dangerButton}
          onPress={handleResetPhrases}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Reset phrases to defaults"
        >
          <Ionicons name="refresh-outline" size={18} color="#FFFFFF" />
          <Text style={styles.dangerButtonText}>Reset Phrases to Defaults</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomPad} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  content: {
    paddingTop: 12,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  valueBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  valueBadgeText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '700',
  },
  activeBadge: {
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  activeBadgeText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '700',
  },
  sectionDesc: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginTop: 2,
    marginBottom: 14,
  },
  langRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  langButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    minHeight: 60,
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  langButtonActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  langButtonText: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 21,
  },
  langButtonTextActive: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  slider: {
    flex: 1,
    height: 48,
  },
  sliderEdge: {
    fontSize: 12,
    color: '#94A3B8',
    width: 34,
    textAlign: 'center',
    fontWeight: '500',
  },
  apiKeyInput: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    marginTop: 8,
    marginBottom: 8,
  },
  apiKeyHint: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 14,
  },
  link: {
    color: '#2563EB',
    textDecorationLine: 'underline',
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    elevation: 3,
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  dangerButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  bottomPad: {
    height: 20,
  },
});
