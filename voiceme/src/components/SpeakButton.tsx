import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Vibration, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  onPress: () => void;
  disabled?: boolean;
}

export default function SpeakButton({ onPress, disabled = false }: Props) {
  function handlePress() {
    Vibration.vibrate(80);
    onPress();
  }

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={[styles.button, disabled && styles.buttonDisabled]}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.82}
        accessible
        accessibilityRole="button"
        accessibilityLabel="Speak the recognized text"
      >
        <Ionicons
          name="volume-high"
          size={30}
          color={disabled ? '#A7F3D0' : '#FFFFFF'}
        />
        <Text style={[styles.text, disabled && styles.textDisabled]}>SPEAK</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F1F5F9',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  button: {
    backgroundColor: '#059669',
    height: 78,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    elevation: 6,
    shadowColor: '#065F46',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  buttonDisabled: {
    backgroundColor: '#6EE7B7',
    elevation: 0,
    shadowOpacity: 0,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 2.5,
  },
  textDisabled: {
    color: '#ECFDF5',
  },
});
