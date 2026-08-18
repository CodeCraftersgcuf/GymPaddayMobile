import React from 'react';
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import ThemeText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import { format, isToday } from 'date-fns';
import { useTheme } from '@/contexts/themeContext';
import { CachedAvatar } from '@/components/media/CachedImage';

type Conversation = {
  id: string;
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
  other_user?: {
    profile_picture_url?: string;
  };
};

type Props = {
  conversations: Conversation[];
  onConversationPress: (conversationId: string) => void;
  onConversationPressIn?: (conversationId: string) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
};

export default function ConversationList({
  conversations,
  onConversationPress,
  onConversationPressIn,
  refreshing,
  onRefresh,
}: Props) {
  const { dark } = useTheme();

  const formatMessageTime = (date: Date) =>
    isToday(date) ? format(date, 'h:mm a') : format(date, 'MMM d');

  const nameColor = dark ? '#FFFFFF' : '#111111';
  const previewColor = dark ? '#B3B3B3' : '#666666';
  const timeColor = dark ? '#A0A0A0' : '#888888';

  return (
    <FlatList
      data={conversations}
      keyExtractor={(item) => item.id}
      style={styles.list}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={() => (
        <ThemedView style={styles.emptyState}>
          <ThemeText style={[styles.emptyText, { color: previewColor }]}>
            You have not started any conversation yet
          </ThemeText>
        </ThemedView>
      )}
      renderItem={({ item }) => {
        const avatarUri =
          item.user?.profile_img ||
          item.other_user?.profile_picture_url ||
          undefined;
        const unread = Number(item.lastMessage?.unreadCount || 0);

        return (
          <TouchableOpacity
            style={styles.item}
            activeOpacity={0.7}
            onPressIn={() => onConversationPressIn?.(item.id)}
            onPress={() => onConversationPress(item.id)}
          >
            <View style={styles.avatarWrapper}>
              <CachedAvatar uri={avatarUri} size={50} style={styles.avatar} />
              {item.user.online ? <View style={styles.online} /> : null}
            </View>
            <View style={styles.content}>
              <View style={styles.header}>
                <ThemeText
                  style={[styles.name, { color: nameColor }]}
                  numberOfLines={1}
                >
                  {item.user.username || 'User'}
                </ThemeText>

                <View style={styles.rightHeader}>
                  {unread > 0 ? (
                    <View style={styles.unreadBadge}>
                      <ThemeText style={styles.unreadText}>{unread}</ThemeText>
                    </View>
                  ) : null}
                  <ThemeText style={[styles.time, { color: timeColor }]}>
                    {formatMessageTime(item.lastMessage.timestamp)}
                  </ThemeText>
                </View>
              </View>

              <ThemeText
                style={[
                  styles.message,
                  { color: previewColor },
                  unread > 0 && styles.messageUnread,
                  unread > 0 && { color: nameColor },
                ]}
                numberOfLines={1}
              >
                {item.lastMessage.text || ' '}
              </ThemeText>
            </View>
          </TouchableOpacity>
        );
      }}
      refreshing={!!refreshing}
      onRefresh={onRefresh}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingTop: 12,
    paddingBottom: 24,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'transparent',
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
    gap: 6,
    marginLeft: 8,
  },
  unreadBadge: {
    backgroundColor: '#C61F3A',
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
    minWidth: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  time: {
    fontSize: 12,
  },
  message: {
    fontSize: 14,
  },
  messageUnread: {
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
