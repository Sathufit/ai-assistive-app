import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Text,
} from 'react-native';

interface Props {
  text: string;
  onTextChange: (text: string) => void;
}

export default function TextDisplay({ text, onTextChange }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Recognized Text</Text>
        <Text style={styles.editHint}>✏️ Edit</Text>
      </View>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={onTextChange}
        multiline
        placeholder="Draw to recognize text..."
        placeholderTextColor="#999"
        textAlignVertical="top"
        accessible
        accessibilityLabel="Recognized text, editable"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#2196F3',
    borderRadius: 10,
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1565C0',
  },
  editHint: {
    fontSize: 14,
    color: '#1565C0',
  },
  input: {
    fontSize: 24,
    color: '#111',
    minHeight: 80,
    maxHeight: 160,
    padding: 12,
    lineHeight: 34,
  },
});
