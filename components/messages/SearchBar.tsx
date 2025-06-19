// components/Chat/SearchBar.tsx
import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/contexts/themeContext';

type Props = {
  query: string;
  onChange: (text: string) => void;
};

export default function SearchBar({ query, onChange }: Props) {
  const { dark } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.inputWrapper, { backgroundColor: dark ? '#212121' : '#fff' }]}>
        <Feather name="search" size={20} color={dark ? 'white' : 'black'} />
        <TextInput
          value={query}
          onChangeText={onChange}
          placeholder="Search"
          placeholderTextColor={dark ? 'white' : 'black'}
          style={[styles.input, { color: dark ? 'white' : 'black' }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 10, paddingBottom: 10 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 0,
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
  },
});
