import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

interface Props {
  words: string[];
  sentences: string[];
  onWordTap: (word: string) => void;
  onSentenceTap: (sentence: string) => void;
  isLoading: boolean;
}

export default function PredictionBar({
  words,
  sentences,
  onWordTap,
  onSentenceTap,
  isLoading,
}: Props) {
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Recognizing handwriting...</Text>
      </View>
    );
  }

  const hasContent = words.length > 0 || sentences.length > 0;

  if (!hasContent) return null;

  return (
    <View style={styles.container}>
      {words.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Word suggestions:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {words.map((word, idx) => (
              <TouchableOpacity
                key={`word-${idx}`}
                style={styles.wordChip}
                onPress={() => onWordTap(word)}
                activeOpacity={0.7}
                accessible
                accessibilityRole="button"
                accessibilityLabel={`Word suggestion: ${word}`}
              >
                <Text style={styles.wordChipText}>{word}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {sentences.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Sentence suggestions:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {sentences.map((sentence, idx) => (
              <TouchableOpacity
                key={`sent-${idx}`}
                style={styles.sentenceChip}
                onPress={() => onSentenceTap(sentence)}
                activeOpacity={0.7}
                accessible
                accessibilityRole="button"
                accessibilityLabel={`Sentence suggestion: ${sentence}`}
              >
                <Text style={styles.sentenceChipText}>{sentence}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingVertical: 8,
    marginTop: 4,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    marginTop: 4,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: '#555',
  },
  section: {
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    marginLeft: 12,
    marginBottom: 6,
  },
  chipRow: {
    paddingHorizontal: 12,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordChip: {
    backgroundColor: '#E3F2FD',
    borderRadius: 24,
    height: 48,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#90CAF9',
  },
  wordChipText: {
    fontSize: 20,
    color: '#1565C0',
    fontWeight: '500',
  },
  sentenceChip: {
    backgroundColor: '#F3E5F5',
    borderRadius: 24,
    height: 52,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 280,
    borderWidth: 1,
    borderColor: '#CE93D8',
  },
  sentenceChipText: {
    fontSize: 18,
    color: '#6A1B9A',
    fontWeight: '500',
  },
});
