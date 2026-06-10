import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
        <ActivityIndicator size="small" color="#2563EB" />
        <Text style={styles.loadingText}>Recognizing handwriting…</Text>
      </View>
    );
  }

  if (words.length === 0 && sentences.length === 0) return null;

  return (
    <View style={styles.container}>
      {words.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="text" size={12} color="#64748B" />
            <Text style={styles.sectionLabel}>Word suggestions</Text>
          </View>
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
        <View style={[styles.section, { marginBottom: 0 }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="chatbubble-ellipses-outline" size={12} color="#64748B" />
            <Text style={styles.sectionLabel}>Sentence suggestions</Text>
          </View>
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
                <Text style={styles.sentenceChipText} numberOfLines={2}>{sentence}</Text>
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 12,
    paddingTop: 10,
    paddingBottom: 10,
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  loadingText: {
    fontSize: 15,
    color: '#475569',
    fontWeight: '500',
  },
  section: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginLeft: 14,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  chipRow: {
    paddingHorizontal: 14,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordChip: {
    backgroundColor: '#EFF6FF',
    borderRadius: 24,
    height: 44,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  wordChipText: {
    fontSize: 18,
    color: '#1D4ED8',
    fontWeight: '600',
  },
  sentenceChip: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 260,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  sentenceChipText: {
    fontSize: 15,
    color: '#166534',
    fontWeight: '500',
    textAlign: 'center',
  },
});
