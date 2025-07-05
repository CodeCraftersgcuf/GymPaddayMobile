import React, { forwardRef, useMemo, useCallback, useState, useEffect } from 'react';
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

//Code Related to the integration
import { followUnfollowUser } from '@/utils/queries/socialMedia';
import * as SecureStore from 'expo-secure-store';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export interface User {
  id: string;
  name: string;
  avatar: string;
  isFollowing: boolean;
}

interface FollowingBottomSheetProps {
  userId: string
  users: User[];
  title: string;
  count: number;
  dark?: boolean;
  onFollowToggle: (userId: string, isFollowing: boolean) => void; // unused now, but kept for props shape
  onClose: () => void;
  loading?: boolean;
  emptyText?: string;
}

const FollowingBottomSheet = forwardRef<BottomSheet, FollowingBottomSheetProps>(
  (
    {
      userId,
      users,
      title,
      count,
      dark = true,
      onClose,
      loading = false,
      emptyText = "No following found.",
    },
    ref
  ) => {
    // Theme
    const snapPoints = useMemo(() => ['90%'], []);
    const queryClient = useQueryClient();
    const theme = {
      background: dark ? '#000000' : '#ffffff',
      secondary: dark ? '#181818' : '#f5f5f5',
      text: dark ? '#ffffff' : '#000000',
      textSecondary: dark ? '#999999' : '#666666',
      border: dark ? '#333333' : '#e0e0e0',
    };

    // Local state for instant feedback
    const [localUsers, setLocalUsers] = useState<User[]>(users);

    useEffect(() => {
      setLocalUsers(users);
    }, [users]);

    // Mutation - Accepts userId dynamically
    const followMutation = useMutation({
      mutationFn: async (targetUserId: string) => {
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) throw new Error('No auth token');
        return await followUnfollowUser(Number(targetUserId), token);
      },
      onSuccess: (_data, targetUserId) => {
        // Always refetch from backend for consistency
        console.log("✅ Successfully followed/unfollowed user:", targetUserId);
        queryClient.invalidateQueries({ queryKey: ['followers', targetUserId] });
        queryClient.invalidateQueries({ queryKey: ['userProfile', targetUserId] });
      },
      onError: (error) => {
        // Optionally revert local state or show toast here
        console.log("❌ Error following/unfollowing user:", error);
        console.error('Error following/unfollowing user:', error);
      },
    });

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
          onPress={() => {
            // Optimistically update local UI
            setLocalUsers(prev =>
              prev.map(u =>
                u.id === item.id
                  ? { ...u, isFollowing: !item.isFollowing }
                  : u
              )
            );
            followMutation.mutate(item.id);
          }}
          disabled={followMutation.isPending && followMutation.variables === item.id}
        >
          <Text
            style={[
              styles.followButtonText,
              item.isFollowing
                ? { color: theme.text }
                : { color: '#ffffff' }
            ]}
          >
            {followMutation.isPending && followMutation.variables === item.id
              ? 'Updating...'
              : item.isFollowing
                ? 'Following'
                : 'Follow'}
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
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              {count.toLocaleString()} {title}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Users List */}
          {loading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
              <Text style={{ color: theme.textSecondary, fontSize: 16 }}>Loading...</Text>
            </View>
          ) : localUsers.length === 0 ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
              <Text style={{ color: theme.textSecondary, fontSize: 16 }}>{emptyText}</Text>
            </View>
          ) : (
            <FlatList
              data={localUsers}
              renderItem={renderUserItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          )}
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
    fontSize: 18,
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

export default FollowingBottomSheet;
