import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/themeContext';

interface FilterButtonProps {
  title: string;
  isActive: boolean;
  onPress: () => void;
}

export default function FilterButton({ title, isActive, onPress }: FilterButtonProps) {
  const { dark } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isActive ? styles.activeButton : (dark ? styles.inactiveButtonDark : styles.inactiveButtonLight)
      ]}
      onPress={onPress}
    >
      <Text style={[
        styles.text,
        isActive ? styles.activeText : (dark ? styles.inactiveTextDark : styles.inactiveTextLight)
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    flex:1
    // marginHorizontal: 8,
  },
  activeButton: {
    backgroundColor: '#EF4444',
  },
  inactiveButtonLight: {
    backgroundColor: '#F3F4F6',
  },
  inactiveButtonDark: {
    backgroundColor: '#181818',
  },
  text: {
    fontSize: 14,
    textAlign:'center',
    fontWeight: '600',
  },
  activeText: {
    color: '#FFFFFF',
  },
  inactiveTextLight: {
    color: '#6B7280',
  },
  inactiveTextDark: {
    color: '#D1D5DB',
  },
});