import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface HeaderProps {
  dark: boolean;
  onThreeDotsPress: () => void;
}

export default function Header({ dark, onThreeDotsPress }: HeaderProps) {
  return (
    <View style={styles.header}>
      <TouchableOpacity>
        <MaterialIcons 
          name="arrow-back" 
          size={24} 
          color={dark ? '#FFFFFF' : '#000000'} 
        />
      </TouchableOpacity>
      
      <Text style={[styles.title, { color: dark ? '#FFFFFF' : '#000000' }]}>
        Live Streaming
      </Text>
      
      {/* <TouchableOpacity onPress={onThreeDotsPress}>
        <MaterialIcons 
          name="more-vert" 
          size={24} 
          color={dark ? '#FFFFFF' : '#000000'} 
        />
      </TouchableOpacity> */}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    // paddingTop: 50,
    paddingVertical: 20,
  },
  title: {
    alignSelf:'center',
    fontSize: 18,
    fontWeight: '600',
    position: 'absolute',
    left: "50%",
    transform: [{ translateX: -50 }], 
    textAlign: 'center',
  },
});