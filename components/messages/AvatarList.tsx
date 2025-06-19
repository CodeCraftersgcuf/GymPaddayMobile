// components/Chat/AvatarList.tsx
import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity, FlatList, ScrollView } from 'react-native';
import ThemeText from '@/components/ThemedText';
import { useTheme } from '@/contexts/themeContext';
import ThemedView from '@/components/ThemedView';

type User = {
  id: string;
  username: string;
  profile_img: string;
  online: boolean;
};

type Props = {
  users: User[];
  onAvatarPress: (userId: string) => void;
};

export default function AvatarList({ users, onAvatarPress }: Props) {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {users.map((item) => (
          <TouchableOpacity key={item.id} onPress={() => onAvatarPress(item.id)} style={styles.item}>
            <ThemedView style={styles.avatarWrapper}>
              <Image source={{ uri: item.profile_img }} style={styles.avatar} />
              {item.online && <ThemedView style={styles.online} />}
            </ThemedView>
            <ThemeText style={styles.name}>{item.username}</ThemeText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    // height: 100
  },
  item: {
    alignItems: 'center',
    marginRight: 16
  },
  avatarWrapper: {
    position: 'relative',
    width: 60,
    height: 60,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  online: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CD964',
    borderWidth: 2,
    borderColor: '#fff',
  },
  name: {
    fontSize: 12,
    marginTop: 6,
    maxWidth: 70,
  },
});
