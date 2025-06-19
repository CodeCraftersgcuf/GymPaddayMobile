import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
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

export default function Chat() {
  const router = useRouter();
  const { dark } = useTheme();
  const { users, conversations } = useMessages();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSocialModal, setShowSocialModal] = useState(false);

  const handleAvatarPress = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      const conversationId = `conv-1-${userId}`;
      router.push({
        pathname: '/messageChat',
        params: { id: conversationId},
      });
    }
  };

  const handleConversationPress = (conversationId: string) => {
    console.log('clicked')
    router.push({
      pathname: '/messageChat',
      params: { id: conversationId},
    });
  };

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const socialOptions = ['Instagram', 'Twitter', 'Facebook', 'LinkedIn'];

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.content} darkColor={dark ? '#000' : 'white'}>
        <Header onBack={() => router.back()} onOpenSocials={() => setShowSocialModal(true)} />
        <SearchBar query={searchQuery} onChange={setSearchQuery} />
        <AvatarList users={users} onAvatarPress={handleAvatarPress} />
        
        <ThemedView style={styles.conversationsWrapper} darkColor={dark ? '#202020' : 'white'}>
          <ConversationList
            conversations={filteredConversations}
            onConversationPress={handleConversationPress}
          />
        </ThemedView>
      </ThemedView>

      <SocialsModal
        visible={showSocialModal}
        onClose={() => setShowSocialModal(false)}
        options={socialOptions}
        onSelect={(option) => {
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