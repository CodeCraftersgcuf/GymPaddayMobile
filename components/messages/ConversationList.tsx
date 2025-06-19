import React from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import ThemeText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import { format, isToday } from 'date-fns';
import { useTheme } from '@/contexts/themeContext';

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
  };
};

type Props = {
  conversations: Conversation[];
  onConversationPress: (conversationId: string) => void;
};

export default function ConversationList({
  conversations,
  onConversationPress,
}: Props) {
  const { dark } = useTheme();

  const formatMessageTime = (date: Date) =>
    isToday(date) ? format(date, 'h:mm a') : format(date, 'MMM d');

  const flatListRef = React.useRef<FlatList>(null);

  React.useEffect(() => {
    if (conversations.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 0);
    }
  }, [conversations]);

  return (
    <FlatList
      ref={flatListRef}
      data={conversations}
      keyExtractor={(item) => item.id}
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
            <Image source={{ uri: item.user.profile_img }} style={styles.avatar} />
            {item.user.online && <View style={styles.online} />}
          </View>
          <View style={styles.content}>
            <View style={styles.header}>
              <ThemeText style={styles.name}>{item.user.username}</ThemeText>
              <ThemeText style={styles.time}>
                {formatMessageTime(item.lastMessage.timestamp)}
              </ThemeText>
            </View>
            <ThemeText style={styles.message} numberOfLines={1}>
              {item.lastMessage.text}
            </ThemeText>
          </View>
        </TouchableOpacity>
      )}
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