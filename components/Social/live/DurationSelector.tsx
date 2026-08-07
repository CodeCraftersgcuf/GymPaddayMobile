import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface DurationSelectorProps {
  visible: boolean;
  dark: boolean;
  selectedDuration: string;
  onSave: (duration: string) => void;
  onClose: () => void;
}

const durations = ['15 Min', '30 Min', '1 Hour', '3 Hours', '5 Hours'];

function parseSelectedToCustom(selected: string): { hours: string; minutes: string } {
  if (durations.includes(selected)) {
    return { hours: '', minutes: '' };
  }
  const hourMatch = selected.match(/(\d+)\s*Hour/i);
  const minMatch = selected.match(/(\d+)\s*Min/i);
  return {
    hours: hourMatch ? hourMatch[1] : '',
    minutes: minMatch ? minMatch[1] : '',
  };
}

function formatCustomDuration(hours: string, minutes: string): string | null {
  const h = Math.max(0, Math.min(23, parseInt(hours || '0', 10) || 0));
  const m = Math.max(0, Math.min(59, parseInt(minutes || '0', 10) || 0));
  if (h === 0 && m === 0) return null;
  if (h > 0 && m > 0) return `${h} Hour${h === 1 ? '' : 's'} ${m} Min`;
  if (h > 0) return `${h} Hour${h === 1 ? '' : 's'}`;
  return `${m} Min`;
}

export default function DurationSelector({
  visible,
  dark,
  selectedDuration,
  onSave,
  onClose,
}: DurationSelectorProps) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [tempSelected, setTempSelected] = useState(selectedDuration);
  const initialCustom = parseSelectedToCustom(selectedDuration);
  const [customHours, setCustomHours] = useState(initialCustom.hours);
  const [customMinutes, setCustomMinutes] = useState(initialCustom.minutes);
  const usingCustom = Boolean(customHours || customMinutes) && !durations.includes(tempSelected);

  useEffect(() => {
    if (!visible) return;
    setTempSelected(selectedDuration);
    const parsed = parseSelectedToCustom(selectedDuration);
    setCustomHours(parsed.hours);
    setCustomMinutes(parsed.minutes);
  }, [visible, selectedDuration]);

  const handlePreset = (duration: string) => {
    Keyboard.dismiss();
    setTempSelected(duration);
    setCustomHours('');
    setCustomMinutes('');
  };

  const handleSave = () => {
    Keyboard.dismiss();
    const custom = formatCustomDuration(customHours, customMinutes);
    if (custom) {
      onSave(custom);
      return;
    }
    onSave(tempSelected || '15 Min');
  };

  const focusCustomField = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
  };

  const textColor = dark ? '#FFFFFF' : '#000000';
  const muted = dark ? '#AAAAAA' : '#666666';
  const inputBg = dark ? '#2A2A2A' : '#F2F2F2';

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      transparent
      animationType="slide"
    >
      <KeyboardAvoidingView
        style={styles.keyboardRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View
                style={[
                  styles.container,
                  {
                    backgroundColor: dark ? '#181818' : '#FFFFFF',
                    paddingBottom: Math.max(insets.bottom, 16),
                  },
                ]}
              >
                <ScrollView
                  ref={scrollRef}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.scrollContent}
                >
                  <Text style={[styles.title, { color: textColor }]}>Duration</Text>

                  <View style={styles.optionsContainer}>
                    {durations.map((duration) => (
                      <TouchableOpacity
                        key={duration}
                        style={styles.option}
                        onPress={() => handlePreset(duration)}
                      >
                        <Text style={[styles.optionText, { color: textColor }]}>{duration}</Text>
                        <View style={styles.radioContainer}>
                          {!usingCustom && tempSelected === duration ? (
                            <View style={styles.radioSelected} />
                          ) : (
                            <View style={[styles.radioUnselected, { borderColor: dark ? '#666666' : '#CCCCCC' }]} />
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.customTimeContainer}>
                    <Text style={[styles.customLabel, { color: muted }]}>Custom</Text>
                    <View style={styles.customRow}>
                      <View style={styles.customField}>
                        <Text style={[styles.fieldLabel, { color: muted }]}>Hour</Text>
                        <TextInput
                          style={[styles.customInput, { color: textColor, backgroundColor: inputBg }]}
                          keyboardType="number-pad"
                          maxLength={2}
                          placeholder="0"
                          placeholderTextColor={muted}
                          value={customHours}
                          onFocus={focusCustomField}
                          onChangeText={(v) => {
                            setCustomHours(v.replace(/[^0-9]/g, ''));
                            setTempSelected('');
                          }}
                        />
                      </View>
                      <View style={styles.customField}>
                        <Text style={[styles.fieldLabel, { color: muted }]}>Min</Text>
                        <TextInput
                          style={[styles.customInput, { color: textColor, backgroundColor: inputBg }]}
                          keyboardType="number-pad"
                          maxLength={2}
                          placeholder="0"
                          placeholderTextColor={muted}
                          value={customMinutes}
                          onFocus={focusCustomField}
                          onChangeText={(v) => {
                            setCustomMinutes(v.replace(/[^0-9]/g, ''));
                            setTempSelected('');
                          }}
                        />
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardRoot: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  container: {
    width: '100%',
    maxHeight: '88%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  scrollContent: {
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  optionsContainer: {
    marginBottom: 16,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  optionText: {
    fontSize: 16,
  },
  radioContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#C61F3A',
    borderWidth: 2,
    borderColor: '#C61F3A',
  },
  radioUnselected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  customTimeContainer: {
    marginBottom: 20,
  },
  customLabel: {
    fontSize: 14,
    marginBottom: 10,
    fontWeight: '600',
  },
  customRow: {
    flexDirection: 'row',
    gap: 16,
  },
  customField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 13,
    marginBottom: 6,
  },
  customInput: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#C61F3A',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
