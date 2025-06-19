import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import { router } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import { useTheme } from '@/contexts/themeContext';

interface HeaderProps {
  onSubmit: () => void;
}

export default function Header({ onSubmit }: HeaderProps) {
  const {dark} = useTheme();
  const handleBackPress = () => {
    router.back();
  };

  return (
    <View style={[styles.header,{borderBottomColor:dark ? '#212121' : '#eee',}]}>
      <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
        <AntDesign name='left' size={24} color={dark ? 'white' :"#333"} />
      </TouchableOpacity>
      
      <Text style={[styles.title,{color:dark ? 'white' :"#333"}]}>Create Post</Text>
      
      <TouchableOpacity style={styles.postButton} onPress={onSubmit}>
        <Text style={styles.postButtonText}>Post</Text>
      </TouchableOpacity>
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
    borderBottomWidth: 1,
    
    // backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  postButton: {
    backgroundColor: '#ff3333',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});