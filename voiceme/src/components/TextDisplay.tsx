import React from 'react';
import { View, TextInput, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  text: string;
  onTextChange: (text: string) => void;
}

export default function TextDisplay({ text, onTextChange }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="text-outline" size={16} color="#475569" />
        <Text style={styles.label}>Recognized Text</Text>
        {text.length > 0 && (
          <View style={styles.editBadge}>
            <Ionicons name="create-outline" size={11} color="#2563EB" />
            <Text style={styles.editText}>Editable</Text>
          </View>
        )}
      </View>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={onTextChange}
        multiline
        placeholder="Draw text above to begin…"
        placeholderTextColor="#CBD5E1"
        textAlignVertical="top"
        accessible
        accessibilityLabel="Recognized text, editable"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
    letterSpacing: 0.2,
  },
  editBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  editText: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '600',
  },
  input: {
    fontSize: 22,
    color: '#0F172A',
    minHeight: 80,
    maxHeight: 140,
    padding: 14,
    lineHeight: 32,
  },
});
