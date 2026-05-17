import React from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  RefreshControl,
} from 'react-native';
import ThemeText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import { format, isToday } from 'date-fns';
import { useTheme } from '@/contexts/themeContext';

type Conversation = {
  id: string;
  conversation_id?: number | string;
  user: {
    id: string;
    username: string;
    profile_img: string;
    online: boolean;
  };
  lastMessage: {
    text: string;
    timestamp: Date;
    unreadCount?: number;
  };
  other_user?: { profile_picture_url?: string };
};

type Props = {
  conversations: Conversation[];
  onConversationPress: (conversationId: string) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
};

export default function ConversationList({
  conversations,
  onConversationPress,
  refreshing,
  onRefresh,
}: Props) {
  const { dark } = useTheme();
  // console.log("Conversations:", conversations);

  const formatMessageTime = (date: Date) =>
    isToday(date) ? format(date, 'h:mm a') : format(date, 'MMM d');

  return (
    <FlatList
      data={conversations}
      keyExtractor={(item, index) =>
        `c-${item.conversation_id ?? item.id}-${index}`
      }
      style={styles.list}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={() => (
        <ThemedView style={styles.emptyState}>
          <ThemeText style={styles.emptyText}>
            You have not started any conversation yet
          </ThemeText>
        </ThemedView>
      )}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.item}
          onPress={() => onConversationPress(item.id)}
        >
          <View style={styles.avatarWrapper}>
            <Image
              source={
                item.other_user?.profile_picture_url?.trim()
                  ? { uri: item.other_user.profile_picture_url }
                  : require('@/assets/icons/more/User.png')
              }
              style={[
                styles.avatar,
                !item.other_user?.profile_picture_url?.trim() && { tintColor: 'black' }
              ]}
            />



            {item.user.online && <View style={styles.online} />}
          </View>
          <View style={styles.content}>
            <View style={styles.header}>
  <ThemeText style={styles.name}>{item.user.username}</ThemeText>

  <View style={styles.rightHeader}>
    {item.lastMessage?.unreadCount > 0 && (
      <View style={styles.unreadBadge}>
        <ThemeText style={styles.unreadText}>
          {item.lastMessage.unreadCount}
        </ThemeText>
      </View>
    )}
    <ThemeText style={styles.time}>
      {formatMessageTime(item.lastMessage.timestamp)}
    </ThemeText>
  </View>
</View>

            <ThemeText style={styles.message} numberOfLines={2}>
              {item.lastMessage.text?.trim()
                ? item.lastMessage.text
                : 'Tap to open chat'}
            </ThemeText>
          </View>
        </TouchableOpacity>
      )}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} />
        ) : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  rightHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6, // optional spacing
},
unreadBadge: {
  backgroundColor: '#FF3B30',
  borderRadius: 12,
  minWidth: 20,
  height: 20,
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: 6,
},
unreadText: {
  color: '#fff',
  fontSize: 12,
  fontWeight: 'bold',
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
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  time: {
    fontSize: 12,
    color: '#888',
  },
  message: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
});