import React, { useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppContext } from '../context/AppContext';
import { savePhrases } from '../services/storageService';
import { speak } from '../services/ttsService';
import { Phrase, DEFAULT_PHRASES } from '../constants/defaultPhrases';

interface PhraseFormState {
  visible: boolean;
  mode: 'add' | 'edit';
  sinhala: string;
  english: string;
  editingId: string | null;
}

export default function PhrasesScreen() {
  const navigation = useNavigation();
  const { phrases, setPhrases, settings } = useAppContext();

  const [formState, setFormState] = useState<PhraseFormState>({
    visible: false,
    mode: 'add',
    sinhala: '',
    english: '',
    editingId: null,
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.addButton}
          onPress={openAddForm}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Add new phrase"
        >
          <Text style={styles.addButtonText}>＋</Text>
        </TouchableOpacity>
      ),
    });
  });

  function openAddForm() {
    setFormState({
      visible: true,
      mode: 'add',
      sinhala: '',
      english: '',
      editingId: null,
    });
  }

  function openEditForm(phrase: Phrase) {
    setFormState({
      visible: true,
      mode: 'edit',
      sinhala: phrase.sinhala,
      english: phrase.english,
      editingId: phrase.id,
    });
  }

  function closeForm() {
    setFormState((prev) => ({ ...prev, visible: false }));
  }

  function handleSaveForm() {
    const sinhala = formState.sinhala.trim();
    const english = formState.english.trim();
    if (!sinhala || !english) {
      Alert.alert('Error', 'Both Sinhala and English text are required.');
      return;
    }

    let updated: Phrase[];
    if (formState.mode === 'add') {
      const newPhrase: Phrase = {
        id: Date.now().toString(),
        sinhala,
        english,
      };
      updated = [...phrases, newPhrase];
    } else {
      updated = phrases.map((p) =>
        p.id === formState.editingId ? { ...p, sinhala, english } : p
      );
    }

    setPhrases(updated);
    savePhrases(updated);
    closeForm();
  }

  function handlePhraseTap(phrase: Phrase) {
    const textToSpeak =
      settings.language === 'english' ? phrase.english : phrase.sinhala;
    const lang: 'sinhala' | 'english' | 'both' =
      settings.language === 'english' ? 'english' : 'sinhala';
    speak(textToSpeak, lang, settings.speechRate, settings.speechPitch);
  }

  function handleLongPress(phrase: Phrase) {
    Alert.alert('Phrase Options', `"${phrase.english}"`, [
      { text: 'Edit', onPress: () => openEditForm(phrase) },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => handleDelete(phrase),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  function handleDelete(phrase: Phrase) {
    Alert.alert('Delete Phrase', `Delete "${phrase.english}"?`, [
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const updated = phrases.filter((p) => p.id !== phrase.id);
          setPhrases(updated);
          savePhrases(updated);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  function renderItem({ item }: { item: Phrase }) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handlePhraseTap(item)}
        onLongPress={() => handleLongPress(item)}
        activeOpacity={0.75}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`Phrase: ${item.english}. Long press to edit or delete.`}
      >
        <Text style={styles.sinhalaText}>{item.sinhala}</Text>
        <Text style={styles.englishText}>{item.english}</Text>
        <Text style={styles.speakIcon}>🔊</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.resetBar}>
        <Text style={styles.resetLabel}>{phrases.length} phrases saved</Text>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={() => {
            Alert.alert(
              'Reset Phrases',
              'This will restore all default phrases. Custom phrases will be removed.',
              [
                {
                  text: 'Reset',
                  style: 'destructive',
                  onPress: () => {
                    setPhrases(DEFAULT_PHRASES);
                    savePhrases(DEFAULT_PHRASES);
                  },
                },
                { text: 'Cancel', style: 'cancel' },
              ]
            );
          }}
        >
          <Text style={styles.resetButtonText}>Reset to defaults</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={phrases}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
      />

      {/* Add/Edit Modal */}
      <Modal
        visible={formState.visible}
        transparent
        animationType="fade"
        onRequestClose={closeForm}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {formState.mode === 'add' ? 'Add Phrase' : 'Edit Phrase'}
            </Text>

            <Text style={styles.inputLabel}>Sinhala text:</Text>
            <TextInput
              style={styles.modalInput}
              value={formState.sinhala}
              onChangeText={(t) =>
                setFormState((prev) => ({ ...prev, sinhala: t }))
              }
              placeholder="සිංහල"
              placeholderTextColor="#aaa"
              autoFocus
              fontSize={20}
            />

            <Text style={styles.inputLabel}>English text:</Text>
            <TextInput
              style={styles.modalInput}
              value={formState.english}
              onChangeText={(t) =>
                setFormState((prev) => ({ ...prev, english: t }))
              }
              placeholder="English"
              placeholderTextColor="#aaa"
              fontSize={18}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={closeForm}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveForm}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  resetBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#BBDEFB',
  },
  resetLabel: {
    fontSize: 14,
    color: '#555',
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FF7043',
    borderRadius: 6,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  addButton: {
    marginRight: 16,
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 28,
  },
  list: {
    padding: 8,
  },
  row: {
    gap: 8,
    marginBottom: 8,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    minHeight: 90,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    position: 'relative',
  },
  sinhalaText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222',
    marginBottom: 4,
  },
  englishText: {
    fontSize: 14,
    color: '#666',
  },
  speakIcon: {
    position: 'absolute',
    top: 8,
    right: 10,
    fontSize: 18,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 420,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    color: '#555',
    marginBottom: 4,
    fontWeight: '600',
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: '#BBDEFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#111',
    marginBottom: 14,
    backgroundColor: '#F8FBFF',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 18,
    color: '#555',
    fontWeight: '600',
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '700',
  },
});
