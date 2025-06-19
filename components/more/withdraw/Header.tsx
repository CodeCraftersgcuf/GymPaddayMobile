import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ThemeText from '@/components/ThemedText';
import { useTheme } from '@/contexts/themeContext';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

export default function Header({ title, showBackButton, onBackPress }: HeaderProps) {
  const {dark} =useTheme();
  const route = useRouter();
  return (
    <View style={[styles.header,{borderBottomColor:dark? '#181818' :  '#e5e5e5',}]}>
      {/* {showBackButton ? ( */}
        <TouchableOpacity style={styles.backButton} onPress={title != 'Summary' ? () => route.back() : onBackPress}>
          <Ionicons name="chevron-back" size={24} color={dark ?'white' :"#1a1a1a"} />
        </TouchableOpacity>
      {/* // ) : (
      //   <View style={styles.spacer} />
      // )} */}
      <ThemeText style={styles.title}>{title}</ThemeText>
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    // backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    // color: '#1a1a1a',
    textAlign: 'center',
    flex: 1,
  },
  spacer: {
    width: 40,
  },
});