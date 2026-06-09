import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
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
    // 'both': show sinhala first
    return phrase.sinhala;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Quick Phrases</Text>
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
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    paddingBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 12,
    marginBottom: 6,
  },
  row: {
    paddingHorizontal: 12,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#FFD54F',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 200,
  },
  chipTextPrimary: {
    fontSize: 20,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
  },
  chipTextSecondary: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },
});
