// components/Chat/SocialsModal.tsx
import React from 'react';
import {
  Modal,
  TouchableOpacity,
  StyleSheet,
  View,
} from 'react-native';
import ThemeText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import { useTheme } from '@/contexts/themeContext';

type Props = {
  visible: boolean;
  onClose: () => void;
  options: string[];
  onSelect: (option: string) => void;
};

export default function SocialsModal({
  visible,
  onClose,
  options,
  onSelect,
}: Props) {
  const { dark } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <ThemedView style={[styles.content, { backgroundColor: dark ? '#212121' : 'white' }]}>
          {options.map((option) => (
            <TouchableOpacity key={option} onPress={() => onSelect(option)} style={styles.option}>
              <ThemeText style={styles.optionText}>{option}</ThemeText>
            </TouchableOpacity>
          ))}
        </ThemedView>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  option: {
    paddingVertical: 12,
  },
  optionText: {
    fontSize: 16,
  },
});
