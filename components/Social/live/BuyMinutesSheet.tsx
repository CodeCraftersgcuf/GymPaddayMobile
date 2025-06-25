import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Modal, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface BuyMinutesSheetProps {
  visible: boolean;
  dark: boolean;
  onBuy: (amount: string) => void;
  onClose: () => void;
}

export default function BuyMinutesSheet({
  visible,
  dark,
  onBuy,
  onClose,
}: BuyMinutesSheetProps) {
  const [amount, setAmount] = useState('');

  const handleBuy = () => {
    onBuy(amount);
    setAmount('');
  };

  // Example options, you can customize or add more
  const options = [
    {
      icon: 'monetization-on',
      label: '30 Min (30 GP)',
      value: '30',
    },
    {
      icon: 'monetization-on',
      label: '60 Min (55 GP)',
      value: '60',
    },
    {
      icon: 'monetization-on',
      label: '120 Min (100 GP)',
      value: '120',
    },
  ];

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      transparent
      animationType="slide"
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        {/* Empty Pressable to catch outside clicks */}
      </Pressable>
      <View style={[styles.container, { backgroundColor: dark ? '#181818' : '#FFFFFF' }]}>
        <Text style={[styles.title, { color: dark ? '#FFFFFF' : '#000000' }]}>
          Buy Streaming Minutes
        </Text>
        <Text style={[styles.label, { color: dark ? '#AAAAAA' : '#666666' }]}>
          Choose a package or enter custom minutes
        </Text>

        {/* Options like BottomSheetMenu */}
        <View style={{ width: '100%' }}>
          {options.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.menuItem,
                { backgroundColor: dark ? '#181818' : '#F5F5F5' },
              ]}
              onPress={() => setAmount(opt.value)}
              activeOpacity={0.7}
            >
              {/* Radio Circle */}
              <View style={[
                styles.radioOuter,
                { borderColor: amount === opt.value ? '#FF0000' : (dark ? '#666' : '#CCC') }
              ]}>
                {amount === opt.value && <View style={styles.radioInner} />}
              </View>
              <Text style={[styles.menuItemText, { color: dark ? '#FFFFFF' : '#000000' }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: dark ? '#232323' : '#F5F5F5',
              color: dark ? '#FFF' : '#000',
              borderColor: dark ? '#333' : '#CCC',
            },
          ]}
          placeholder="Custom Minutes"
          placeholderTextColor={dark ? '#888' : '#AAA'}
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />
        <TouchableOpacity
          style={styles.buyButton}
          onPress={handleBuy}
          disabled={!amount}
        >
          <Text style={styles.buyButtonText}>Buy</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  container: {
    width: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 350,
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
  menuItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    // paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 15,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    width: '100%',
  },
  buyButton: {
    backgroundColor: '#FF0000',
    borderRadius: 15,
    paddingVertical: 12,
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  buyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#CCC',
    borderRadius: 15,
    paddingVertical: 10,
    alignItems: 'center',
    width: '100%',
  },
  closeButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF0000',
  },
});