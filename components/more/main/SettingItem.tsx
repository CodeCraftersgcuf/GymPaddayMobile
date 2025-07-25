import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { AntDesign, MaterialIcons, Feather, FontAwesome } from '@expo/vector-icons';
import { SettingItem as SettingItemType } from './settingsData';
import { useTheme } from '@/contexts/themeContext';

interface SettingItemProps {
  item: SettingItemType;
  onPress: (id: string) => void;
}

export default function SettingItem({ item, onPress }: SettingItemProps) {
  const { dark } = useTheme();
  const IconComponent = {
    AntDesign,
    MaterialIcons,
    Feather,
    FontAwesome,
  }[item.iconFamily];

  return (
    <TouchableOpacity
      style={[styles.container, {
        backgroundColor: dark ? '#181818' : '#ffffff',
        borderBottomColor: dark ? 'black' : '#f0f0f0',
      }]}
      onPress={() => onPress(item.id)}
      activeOpacity={0.7}>

      {item.backgroundColor !== 'transparent' && (
        <View style={[styles.iconContainer, { backgroundColor: item.backgroundColor }]}>
          {item.iconFamily ?
            <IconComponent
              name={item.icon as any}
              size={20}
              color="#ffffff"
            /> :
            <Image source={item.icon} style={{ width: 20, height: 20 }} tintColor={'#ffffff'} />
          }
        </View>
      )}

      {item.backgroundColor === 'transparent' && (
        <View style={styles.transparentIconContainer}>
          <IconComponent
            name={item.icon as any}
            size={20}
            color={item.isDestructive ? '#FF3B30' : dark ? 'white' : 'black'}
          />
        </View>
      )}

      <Text style={[
        styles.title,
        {
          color: dark ? 'white' : '#333',
        },
        item.isDestructive && styles.destructiveText,
      ]}>
        {item.title}
      </Text>
      {/* {item.icon !== 'sun' && item.icon !== 'moon' && (
        <AntDesign name="right" size={16} color="#C7C7CC" />
      )} */}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    // paddingVertical: 16,
    // paddingHorizontal: 20,
    padding:6,
    // borderBottomWidth: 1,
    marginBottom:8,
    borderWidth:0.3,
    borderColor:'#B8B8B8',
    borderRadius:10
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  transparentIconContainer: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
  },
  destructiveText: {
    color: '#FF3B30',
  },
});