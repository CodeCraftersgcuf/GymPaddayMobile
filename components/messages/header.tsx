// components/Chat/Header.tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Entypo } from '@expo/vector-icons';
import ThemeText from '@/components/ThemedText';
import { useTheme } from '@/contexts/themeContext';

type Props = {
  onBack: () => void;
  onOpenSocials: () => void;
};

export default function Header({ onBack, onOpenSocials }: Props) {
  const { dark } = useTheme();

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack}>
        <Entypo name="chevron-small-left" size={30} color={dark ? 'white' : 'black'} />
      </TouchableOpacity>
      <ThemeText style={styles.title}>Messages</ThemeText>
      <TouchableOpacity
        style={[styles.socialsButton, { backgroundColor: dark ? '#212121' : '#fff' }]}
        onPress={onOpenSocials}
      >
        <ThemeText style={styles.socialsButtonText}>Socials</ThemeText>
        <Entypo name="chevron-small-down" size={16} color={dark ? 'white' : 'black'} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  socialsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  socialsButtonText: {
    fontSize: 14,
    marginRight: 4,
  },
});
