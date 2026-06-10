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
import { Ionicons } from '@expo/vector-icons';
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
          style={styles.addHeaderBtn}
          onPress={openAddForm}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Add new phrase"
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      ),
    });
  });

  function openAddForm() {
    setFormState({ visible: true, mode: 'add', sinhala: '', english: '', editingId: null });
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
      Alert.alert('Required', 'Both Sinhala and English text are required.');
      return;
    }

    let updated: Phrase[];
    if (formState.mode === 'add') {
      updated = [...phrases, { id: Date.now().toString(), sinhala, english }];
    } else {
      updated = phrases.map((p) =>
        p.id === formState.editingId ? { ...p, sinhala, english } : p
      );
    }
    setPhrases(updated);
    savePhrases(updated);
    closeForm();
  }

  async function handlePhraseTap(phrase: Phrase) {
    const textToSpeak = settings.language === 'english' ? phrase.english : phrase.sinhala;
    const lang: 'sinhala' | 'english' | 'both' =
      settings.language === 'english' ? 'english' : 'sinhala';
    try {
      await speak(textToSpeak, lang, settings.speechRate, settings.speechPitch, settings.elevenLabsApiKey);
    } catch (e: unknown) {
      if (e instanceof Error && e.message === 'SINHALA_VOICE_MISSING') {
        Alert.alert('Sinhala Voice Not Installed', 'Go to Android Settings → General Management → Language → Text-to-speech → Google TTS → install Sinhala voice pack.');
      }
    }
  }

  function handleLongPress(phrase: Phrase) {
    Alert.alert('Phrase Options', `"${phrase.english}"`, [
      { text: 'Edit', onPress: () => openEditForm(phrase) },
      { text: 'Delete', style: 'destructive', onPress: () => handleDelete(phrase) },
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
        <View style={styles.cardInner}>
          <Text style={styles.sinhalaText} numberOfLines={2}>{item.sinhala}</Text>
          <Text style={styles.englishText} numberOfLines={1}>{item.english}</Text>
        </View>
        <View style={styles.speakBadge}>
          <Ionicons name="volume-medium" size={16} color="#059669" />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.statsBar}>
        <Text style={styles.statsText}>{phrases.length} phrases saved</Text>
        <TouchableOpacity
          style={styles.resetBtn}
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
          <Ionicons name="refresh-outline" size={13} color="#64748B" />
          <Text style={styles.resetBtnText}>Reset defaults</Text>
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

      <Modal visible={formState.visible} transparent animationType="fade" onRequestClose={closeForm}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {formState.mode === 'add' ? 'New Phrase' : 'Edit Phrase'}
              </Text>
              <TouchableOpacity onPress={closeForm} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Sinhala text</Text>
            <TextInput
              style={[styles.modalInput, { fontSize: 20 }]}
              value={formState.sinhala}
              onChangeText={(t) => setFormState((prev) => ({ ...prev, sinhala: t }))}
              placeholder="සිංහල"
              placeholderTextColor="#CBD5E1"
              autoFocus
            />

            <Text style={styles.inputLabel}>English text</Text>
            <TextInput
              style={[styles.modalInput, { fontSize: 17 }]}
              value={formState.english}
              onChangeText={(t) => setFormState((prev) => ({ ...prev, english: t }))}
              placeholder="English"
              placeholderTextColor="#CBD5E1"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeForm}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveForm}>
                <Text style={styles.saveText}>Save</Text>
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
    backgroundColor: '#F1F5F9',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 11,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  statsText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resetBtnText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  addHeaderBtn: {
    marginRight: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 12,
    paddingBottom: 24,
  },
  row: {
    gap: 10,
    marginBottom: 10,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  cardInner: {
    flex: 1,
    marginBottom: 8,
  },
  sinhalaText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 5,
    lineHeight: 27,
  },
  englishText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '400',
  },
  speakBadge: {
    alignSelf: 'flex-end',
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    elevation: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#0F172A',
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  cancelText: {
    fontSize: 17,
    color: '#475569',
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#059669',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#065F46',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  saveText: {
    fontSize: 17,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
