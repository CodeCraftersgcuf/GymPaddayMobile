import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface BuySuccessModalProps {
  visible: boolean;
  dark: boolean;
  minutes: string;
  onClose: () => void;
}

export default function BuySuccessModal({
  visible,
  dark,
  minutes,
  onClose,
}: BuySuccessModalProps) {
  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: dark ? '#181818' : '#FFFFFF' }]}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="check-circle" size={48} color="#4CD964" />
          </View>
          <Text style={[styles.title, { color: dark ? '#FFFFFF' : '#000000' }]}>
            Purchase Successful!
          </Text>
          <Text style={[styles.message, { color: dark ? '#AAAAAA' : '#666666' }]}>
            You have purchased {minutes} streaming minutes.
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#FF0000',
    borderRadius: 15,
    paddingVertical: 10,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});