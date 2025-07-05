import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/themeContext';
import { useMessages } from '@/components/messages/MessageContext';

import Header from '@/components/messages/header';
import SearchBar from '@/components/messages/SearchBar';
import AvatarList from '@/components/messages/AvatarList';
import ConversationList from '@/components/messages/ConversationList';
import SocialsModal from '@/components/messages/SocialsModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import ThemedView from '@/components/ThemedView';

// Integration
import { useQuery } from '@tanstack/react-query';
import { fetchConnectedUsers } from '@/utils/queries/chat';
import * as SecureStore from 'expo-secure-store';

export default function Chat() {


  const router = useRouter();
  const { dark } = useTheme();
  const { users } = useMessages();
const [selectedType, setSelectedType] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const getToken = async () => {
    return await SecureStore.getItemAsync('auth_token');
  };

  // Query for conversations
  const {
    data,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No token found');
      return fetchConnectedUsers(token);
    },
  });
  console.log("The data from API:", data?.conversations);

  // Transform API data to ConversationList format
  const apiConversations = data?.conversations?.map((conv: any) => ({
    id: String(conv.conversation_id),
    user: {
      id: String(conv.other_user.id),
      username: conv.other_user.username,
      profile_img: conv.other_user.profile_picture_url,
      online: false, // API does not provide online status
    },
    lastMessage: {
      text: conv.last_message?.message || '',
      timestamp: conv.last_message?.created_at
        ? new Date(conv.last_message.created_at)
        : new Date(conv.updated_at || conv.created_at),
    },
    other_user: conv.other_user, // for navigation
    conversation_id: conv.conversation_id,
    type: conv.type, // 'social' or 'marketplace'
  })) || [];

  // Build users for AvatarList from API conversations
  const apiUsers =
    apiConversations.length > 0
      ? Array.from(
        new Map(
          apiConversations.map((conv) => [
            conv.user.id,
            {
              id: conv.user.id,
              username: conv.user.username,
              profile_img: conv.user.profile_img,
              online: false,
            },
          ])
        ).values()
      )
      : users;

  // Filtering by username or last message
const filteredConversations = apiConversations
  .filter((conv) =>
    conv.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.text.toLowerCase().includes(searchQuery.toLowerCase())
  )
  .filter((conv) => {
    if (!selectedType) return true; // no filter applied
    return conv.type === selectedType;
  });

  // AvatarList: use users from context (not API)
  const handleAvatarPress = (userId: string) => {
    // Find conversation with this user
    const found = apiConversations.find(
      (conv) => conv.user.id === userId
    );
    if (found) {
      router.push({
        pathname: '/messageChat',
        params: {
          conversation_id: found.conversation_id,
          user_id: found.user.id,
        },
      });
    }
  };

  // Conversation press: pass conversation_id and other_user id
  const handleConversationPress = (conversationId: string) => {
    const found = apiConversations.find(
      (conv) => conv.id === conversationId
    );
    if (found) {
      router.push({
        pathname: '/messageChat',
        params: {
          conversation_id: found.conversation_id,
          user_id: found.user.id,
        },
      });
    }
  };

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

const socialOptions = ['all', 'marketplace', 'social'];

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.content} darkColor={dark ? '#000' : 'white'}>
        <Header onBack={() => router.back()} onOpenSocials={() => setShowSocialModal(true)} />
        <SearchBar query={searchQuery} onChange={setSearchQuery} />
        {/* Show loading indicator while users are loading */}
        {isLoading ? (
          <View style={{ paddingVertical: 24 }}>
            <ActivityIndicator size="large" color={dark ? 'white' : 'black'} />
          </View>
        ) : (
          <AvatarList users={apiUsers} onAvatarPress={handleAvatarPress} />
        )}

        <ThemedView style={styles.conversationsWrapper} darkColor={dark ? '#202020' : 'white'}>
          {isLoading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color={dark ? 'white' : 'black'} />
            </View>
          ) : (
            <ConversationList
              conversations={filteredConversations}
              onConversationPress={handleConversationPress}
              refreshing={refreshing || isRefetching}
              onRefresh={onRefresh}
            />
          )}
        </ThemedView>
      </ThemedView>

      <SocialsModal
        visible={showSocialModal}
        onClose={() => setShowSocialModal(false)}
        options={socialOptions}
         onSelect={(type) => {
    setSelectedType(type === 'all' ? null : type); // clear filter if all
    setShowSocialModal(false);
  }}

      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'tranxsparent',
  },
  content: {
    flex: 1,
  },
  conversationsWrapper: {
    flex: 1,
    marginTop: 20,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  }
});