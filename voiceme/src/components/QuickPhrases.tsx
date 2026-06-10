import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Phrase } from '../constants/defaultPhrases';

interface Props {
  phrases: Phrase[];
  language: 'sinhala' | 'english' | 'both';
  onPhraseTap: (phrase: Phrase) => void;
}

export default function QuickPhrases({ phrases, language, onPhraseTap }: Props) {
  function getDisplayText(phrase: Phrase): string {
    if (language === 'english') return phrase.english;
    if (language === 'sinhala') return phrase.sinhala;
    return phrase.sinhala;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="flash-outline" size={13} color="#64748B" />
        <Text style={styles.label}>Quick Phrases</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {phrases.map((phrase) => (
          <TouchableOpacity
            key={phrase.id}
            style={styles.chip}
            onPress={() => onPhraseTap(phrase)}
            activeOpacity={0.7}
            accessible
            accessibilityRole="button"
            accessibilityLabel={`Quick phrase: ${phrase.english}`}
          >
            <Text style={styles.chipTextPrimary}>{getDisplayText(phrase)}</Text>
            {language === 'both' && (
              <Text style={styles.chipTextSecondary}>{phrase.english}</Text>
            )}
            <View style={styles.speakDot} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    paddingBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginLeft: 16,
    marginBottom: 10,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  row: {
    paddingHorizontal: 16,
    gap: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 64,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 180,
    elevation: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  chipTextPrimary: {
    fontSize: 19,
    color: '#0F172A',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 26,
  },
  chipTextSecondary: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
    textAlign: 'center',
  },
  speakDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
    marginTop: 6,
  },
});
