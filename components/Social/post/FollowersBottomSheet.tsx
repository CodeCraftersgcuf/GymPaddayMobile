import React, { forwardRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { Ionicons as Icon } from '@expo/vector-icons';

export interface User {
  id: string;
  name: string;
  avatar: string;
  isFollowing: boolean;
}

interface FollowersBottomSheetProps {
  users: User[];
  title: string;
  count: number;
  dark?: boolean;
  onFollowToggle: (userId: string, isFollowing: boolean) => void;
  onClose: () => void;
}

const FollowersBottomSheet = forwardRef<BottomSheet, FollowersBottomSheetProps>(
  ({ users, title, count, dark = true, onFollowToggle, onClose }, ref) => {
    const snapPoints = useMemo(() => ['90%'], []);

    const theme = {
      background: dark ? '#000000' : '#ffffff',
      secondary: dark ? '#181818' : '#f5f5f5',
      text: dark ? '#ffffff' : '#000000',
      textSecondary: dark ? '#999999' : '#666666',
      border: dark ? '#333333' : '#e0e0e0',
    };

    const handleSheetChanges = useCallback((index: number) => {
      if (index === -1) {
        onClose();
      }
    }, [onClose]);

    const renderUserItem = ({ item }: { item: User }) => (
      <View style={[styles.userItem, { backgroundColor: theme.background }]}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <Text style={[styles.userName, { color: theme.text }]}>{item.name}</Text>
        <TouchableOpacity
          style={[
            styles.followButton,
            item.isFollowing ? styles.followingButton : styles.followRedButton,
            { borderColor: theme.border }
          ]}
          onPress={() => onFollowToggle(item.id, item.isFollowing)}
        >
          <Text
            style={[
              styles.followButtonText,
              item.isFollowing 
                ? { color: theme.text } 
                : { color: '#ffffff' }
            ]}
          >
            {item.isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </View>
    );

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        enablePanDownToClose={true}
        backgroundStyle={{ backgroundColor: theme.background }}
        handleIndicatorStyle={{ backgroundColor: theme.textSecondary }}
      >
        <BottomSheetView style={[styles.container, { backgroundColor: theme.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View/>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              {count.toLocaleString()} {title}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Users List */}
          <FlatList
            data={users}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  listContainer: {
    paddingVertical: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  userName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  followButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: 'transparent',
  },
  followRedButton: {
    backgroundColor: '#ff4444',
    borderColor: '#ff4444',
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default FollowersBottomSheet;