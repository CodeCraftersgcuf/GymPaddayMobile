import { useTheme } from '@/contexts/themeContext';
import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
} from 'react-native';

interface UserSectionProps {
  postText: string;
  onTextChange: (text: string) => void;
}

export default function UserSection({ postText, onTextChange }: UserSectionProps) {
  const {dark} = useTheme();
  return (
    <View style={[styles.container,{backgroundColor:dark ? 'black': '#fff',}]}>
      <View style={styles.userInfo}>
        <Image
          source={{ uri: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100' }}
          style={styles.avatar}
        />
        <TextInput
          style={[styles.textInput,{color: dark ? 'white' : 'black'}]}
          placeholder="What is on your mind?"
          placeholderTextColor={"#999"}
          multiline
          value={postText}
          onChangeText={onTextChange}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
  },
});