import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Vibration,
  View,
} from 'react-native';

interface Props {
  onPress: () => void;
  disabled?: boolean;
}

export default function SpeakButton({ onPress, disabled = false }: Props) {
  function handlePress() {
    Vibration.vibrate(100);
    onPress();
  }

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={[styles.button, disabled && styles.buttonDisabled]}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.75}
        accessible
        accessibilityRole="button"
        accessibilityLabel="Speak the recognized text"
      >
        <Text style={styles.text}>🔊 SPEAK</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  button: {
    backgroundColor: '#4CAF50',
    height: 90,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  buttonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  text: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
