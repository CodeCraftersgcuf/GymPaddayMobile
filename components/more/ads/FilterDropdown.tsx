import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AdType } from './ads';
import { useTheme } from '@/contexts/themeContext';

interface FilterDropdownProps {
  selectedType: AdType;
  onTypeChange: (type: AdType) => void;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  selectedType,
  onTypeChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { dark } = useTheme();
  const colors = {
    background: dark ? '#181818' : '#fff',
    surface: dark ? '#232323' : '#f8f9fa',
    border: dark ? '#232323' : '#e0e0e0',
    text: dark ? '#fff' : '#181818',
    textSecondary: dark ? '#b0b0b0' : '#6c6c6c',
    primary: '#FF3B30',
    success: '#4CD964',
  };

  const options = [
    { value: 'all' as AdType, label: 'Ad type' },
    { value: 'social' as AdType, label: 'Socials Ads' },
    { value: 'marketplace' as AdType, label: 'Marketplace Ads' }
  ];

  const getCurrentLabel = () => {
    const option = options.find(opt => opt.value === selectedType);
    return option?.label || 'Ad type';
  };

  const handleSelect = (type: AdType) => {
    onTypeChange(type);
    setIsOpen(false);
  };

  return (
    <View>
      <TouchableOpacity
        onPress={() => setIsOpen(true)}
        style={[
          styles.button,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }
        ]}
      >
        <Text style={[styles.buttonText, { color: colors.textSecondary }]}>
          {getCurrentLabel()}
        </Text>
        <Ionicons
          name="chevron-down"
          size={16}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View
            style={[
              styles.dropdown,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              }
            ]}
          >
            {options.slice(1).map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => handleSelect(option.value)}
                style={[
                  styles.option,
                  {
                    backgroundColor: selectedType === option.value ? colors.surface : 'transparent'
                  }
                ]}
              >
                <Text style={[styles.optionText, { color: colors.text }]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 120,
    justifyContent: 'space-between',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdown: {
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 160,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionText: {
    fontSize: 14,
  },
});