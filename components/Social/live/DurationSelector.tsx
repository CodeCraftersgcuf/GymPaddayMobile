import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface DurationSelectorProps {
  visible: boolean;
  dark: boolean;
  selectedDuration: string;
  onSave: (duration: string) => void;
  onClose: () => void;
}

const durations = ['15 Min', '30 Min', '1 Hour', '3 Hours', '5 Hours'];

export default function DurationSelector({ 
  visible, 
  dark, 
  selectedDuration, 
  onSave, 
  onClose 
}: DurationSelectorProps) {
  const [tempSelected, setTempSelected] = useState(selectedDuration);

  const handleSave = () => {
    onSave(tempSelected);
  };

  return (
    <Modal
    // style={styles.modal}
  visible={visible}
  onRequestClose={onClose}
  transparent={true} // Ensure the modal overlays the screen
  animationType="slide" // Add animation for better visibility
>
      <View style={[styles.container, { backgroundColor: dark ? '#181818' : '#FFFFFF' }]}>
        <Text style={[styles.title, { color: dark ? '#FFFFFF' : '#000000' }]}>
          Duration
        </Text>
        
        <View style={styles.optionsContainer}>
          {durations.map((duration) => (
            <TouchableOpacity
              key={duration}
              style={styles.option}
              onPress={() => setTempSelected(duration)}
            >
              <Text style={[styles.optionText, { color: dark ? '#FFFFFF' : '#000000' }]}>
                {duration}
              </Text>
              <View style={styles.radioContainer}>
                {tempSelected === duration ? (
                  <View style={styles.radioSelected} />
                ) : (
                  <View style={[styles.radioUnselected, { borderColor: dark ? '#666666' : '#CCCCCC' }]} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.customTimeContainer}>
          <Text style={[styles.customTimeText, { color: dark ? '#AAAAAA' : '#666666' }]}>
            Hour                                    Min
          </Text>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    flex:1,
    justifyContent: 'flex-end',
    margin: 0,
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  optionsContainer: {
    marginBottom: 30,
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
    backgroundColor: '#FF0000',
    borderWidth: 2,
    borderColor: '#FF0000',
  },
  radioUnselected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  customTimeContainer: {
    marginBottom: 30,
  },
  customTimeText: {
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#FF0000',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});