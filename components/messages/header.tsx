// components/Chat/Header.tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Entypo } from '@expo/vector-icons';
import ThemeText from '@/components/ThemedText';
import { useTheme } from '@/contexts/themeContext';

export type MessagesFilter = 'all' | 'social' | 'marketplace';

type Props = {
  onBack: () => void;
  onOpenSocials: () => void;
  /** Reflects the active conversation filter (from Socials modal). */
  selectedFilter?: MessagesFilter;
};

function filterLabel(f?: MessagesFilter): string {
  if (f === 'marketplace') return 'Marketplace';
  if (f === 'social') return 'Social';
  return 'All chats';
}

export default function Header({ onBack, onOpenSocials, selectedFilter = 'all' }: Props) {
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
        <ThemeText style={styles.socialsButtonText}>{filterLabel(selectedFilter)}</ThemeText>
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
     borderWidth:0.1,
    borderRadius: 20,
    //  paddingVertical:2,
    // paddingHorizontal:10,borderRadius:10
  },
  socialsButtonText: {
    fontSize: 14,
    marginRight: 4,
   
   
  },
});
