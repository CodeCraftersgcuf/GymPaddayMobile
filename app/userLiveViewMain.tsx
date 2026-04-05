import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  TextInput,
  ScrollView,
  Dimensions,
  Modal,
  Pressable,
  Alert,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons as Icon } from '@expo/vector-icons';
import GiftsPanel from '@/components/Social/live/GiftsPanel';
import TopupPanel from '@/components/Social/live/TopupPanel';
import SendCoinsPanel from '@/components/Social/live/SendCoinsPanel';
import { useLocalSearchParams } from 'expo-router';
import LiveStreamingPlayer from '@/components/Social/live/LiveStreamingPlayer';
import WebView from 'react-native-webview';
import { useLiveStreamChats } from '@/utils/hooks/useLiveStreamChats';
import { useSendLiveStreamMessage } from '@/utils/hooks/useSendLiveStreamMessage';
import * as SecureStore from 'expo-secure-store';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LIVE_STREAM_API_BASE } from '@/utils/liveStreamConstants';

const { width, height } = Dimensions.get('window');

interface ChatMessage {
  id: string;
  user: string;
  message: string;
  avatar: string;
  hasGift?: boolean;
  giftCount?: number | string;
}

interface GiftItem {
  id: string;
  emoji: string;
  name: string;
  price: number;
  currency: string;
  quantity?: number;
}

type PanelType = 'gifts' | 'topup' | 'sendCoins' | 'none';

const User_liveViewMain: React.FC = () => {
  const { channelName, id } = useLocalSearchParams<{ channelName: string; id: string }>();
  const streamId = id != null ? String(Array.isArray(id) ? id[0] : id) : '';

  const router = useRouter();
  const queryClient = useQueryClient();
  const [dark, setDark] = useState<boolean>(true);
  const [streamEnded, setStreamEnded] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [balance, setBalance] = useState<number>(200000);
  const [activePanel, setActivePanel] = useState<PanelType>('none');
  const [selectedGift, setSelectedGift] = useState<GiftItem | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([

  ]);

  const [loadingBalance, setLoadingBalance] = useState(true);
  React.useEffect(() => {
    (async () => {
      try {
        setLoadingBalance(true); // start loading
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) throw new Error('No token founds');

        const response = await fetch('https://gympaddy.skillverse.com.pk/api/user/balance', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });

        const result = await response.json();
        console.log('Balance fetch result:', result);

        if (response.ok && result.status === 'success') {
          setBalance(Number(result.balance));
        } else {
          Alert.alert('Error', result.message || 'Failed to fetch balance');
        }
      } catch (error) {
        console.error('Balance fetch error:', error);
        Alert.alert('Error', 'Unable to fetch wallet balance.');
      } finally {
        setLoadingBalance(false); // stop loading
      }
    })();
  }, []);
  const themeStyles = {
    backgroundColor: dark ? '#000000' : '#ffffff',
    secondaryBackground: dark ? '#181818' : '#f5f5f5',
    textColor: dark ? '#ffffff' : '#000000',
    textColorSecondary: dark ? '#cccccc' : '#666666',
  };
  const leaveLiveStream = useCallback(async () => {
    if (!streamId) return;
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return;
      await fetch(`${LIVE_STREAM_API_BASE}/live-streams/${streamId}/leave`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
    } catch (e) {
      console.warn('leaveLiveStream', e);
    }
  }, [streamId]);

  useEffect(() => {
    return () => {
      leaveLiveStream();
    };
  }, [leaveLiveStream]);

  const { data: streamMeta } = useQuery({
    queryKey: ['liveStreamDetail', streamId],
    enabled: !!streamId && !streamEnded,
    queryFn: async () => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) throw new Error('No token');
      const res = await fetch(`${LIVE_STREAM_API_BASE}/live-streams/${streamId}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to load stream');
      return res.json();
    },
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (!streamMeta) return;
    const active =
      streamMeta.is_active === true ||
      streamMeta.is_active === 1 ||
      streamMeta.is_active === '1';
    const ended = streamMeta.status === 'ended';
    if (!active || ended) setStreamEnded(true);
  }, [streamMeta]);

  useEffect(() => {
    if (streamEnded) {
      queryClient.invalidateQueries({ queryKey: ['liveStreams'] });
    }
  }, [streamEnded, queryClient]);

  const { data: chats = [], isLoading } = useLiveStreamChats(streamEnded ? '' : streamId);
  const { mutateAsync: sendChatMessageAsync, isPending } = useSendLiveStreamMessage(
    streamEnded ? '' : streamId
  );

  useEffect(() => {
    if (streamEnded) setActivePanel('none');
  }, [streamEnded]);

  useEffect(() => {
    const formatted = (chats || []).map((msg: any) => ({
      id: msg.id.toString(),
      user: msg.user?.fullname || 'User',
      message: msg.message,
      avatar: msg.user?.profile_picture_url || 'https://ui-avatars.com/api/?name=User',
      hasGift: msg.type === 'gift',
      giftCount: msg.amount,
    }));
    setChatMessages(formatted);
  }, [chats]);

  const exitViewer = useCallback(async () => {
    await leaveLiveStream();
    router.back();
  }, [leaveLiveStream, router]);

  const sendMessage = async () => {
    if (!message.trim() || streamEnded) return;
    try {
      await sendChatMessageAsync({ message: message.trim() });
      setMessage('');
    } catch (e: any) {
      if (e?.status === 410) setStreamEnded(true);
      Alert.alert('Chat', e?.message || 'Failed to send message');
    }
  };

  const handleGiftSelect = (gift: GiftItem, quantity: number = 1) => {
    setSelectedGift({ ...gift, quantity }); // Optional: add quantity into gift object
    setActivePanel('sendCoins');
  };

  const handleTopupSuccess = async (amount: number) => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) throw new Error('No token found');

      const response = await fetch('https://gympaddy.skillverse.com.pk/api/user/top-up', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        const errRes = await response.json();
        console.error('❌ Top-up API error:', errRes);
        alert('Top-up failed: ' + (errRes.message || 'Unknown error'));
        return;
      }

      const data = await response.json();
      console.log('✅ Top-up recorded:', data);

      // Update local balance
      setBalance(prevBalance => prevBalance + amount);
      setActivePanel('gifts');
    } catch (error) {
      console.error('❌ Top-up request failed:', error);
      alert('Top-up request failed. Please try again.');
    }
  };

  const handleSendSuccess = async (amount: number) => {
    setBalance((prevBalance) => prevBalance - amount * 10);
    setActivePanel('none');
    const giftText = `Sent ${selectedGift?.emoji} x${amount}`;
    if (streamEnded) return;
    try {
      await sendChatMessageAsync({
        message: giftText,
        type: 'gift',
        amount: String(amount * 10),
      });
    } catch (e: any) {
      if (e?.status === 410) setStreamEnded(true);
    }
  };

  const closePanel = () => {
    setActivePanel('none');
    setSelectedGift(null);
  };

  const [giftQuantities, setGiftQuantities] = React.useState<{ [id: string]: number }>({});
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Listen to keyboard events to adjust chat overlay position
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const updateQuantity = (id: string, change: number) => {
    setGiftQuantities(prev => {
      const newQty = Math.max(1, (prev[id] || 1) + change);
      return { ...prev, [id]: newQty };
    });
  };
  const renderPanel = () => {
    switch (activePanel) {
      case 'gifts':
        return (
          <GiftsPanel
            dark={dark}
            balance={balance}
            onGiftSelect={handleGiftSelect}
            onTopupPress={() => setActivePanel('topup')}
          />
        );
      case 'topup':
        return (
          <TopupPanel
            dark={dark}
            balance={balance}
            onTopupSuccess={handleTopupSuccess}
          />
        );
      case 'sendCoins':
        return selectedGift ? (
          <SendCoinsPanel
            dark={dark}
            balance={balance}
            selectedGift={selectedGift}
            onSendSuccess={handleSendSuccess}
          />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeStyles.backgroundColor }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeStyles.backgroundColor }]}>
        <TouchableOpacity
          onPress={() => {
            exitViewer();
          }}
        >
          <Icon name="chevron-back" size={24} color={themeStyles.textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeStyles.textColor }]}>
          Live Streaming
        </Text>
      </View>

      {/* Video Background */}
      <View style={[styles.videoContainer]}>
        {streamEnded ? (
          <View style={styles.endedPlaceholder}>
            <Icon name="radio-outline" size={48} color="#888" />
            <Text style={styles.endedTitle}>Live ended</Text>
            <Text style={styles.endedSubtitle}>The host has ended this stream.</Text>
            <TouchableOpacity style={styles.endedButton} onPress={() => exitViewer()}>
              <Text style={styles.endedButtonText}>Leave</Text>
            </TouchableOpacity>
          </View>
        ) : channelName ? (
          <WebView
            source={{
              uri: `https://skillverse.com.pk/live.html?channel=${channelName}&role=audience`,
            }}
            javaScriptEnabled
            domStorageEnabled
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            allowsFullscreenVideo
            style={{ flex: 1 }}
            onMessage={(ev) => {
              const m = ev.nativeEvent.data;
              if (m === 'stream_ended' || m === '"stream_ended"') {
                setStreamEnded(true);
                leaveLiveStream();
              }
            }}
          />
        ) : (
          <Text style={{ color: 'white', textAlign: 'center', marginTop: 20 }}>
            No channel specified
          </Text>
        )}
        {/* Chat Overlay – pinned to upper-left so it doesn't cover bottom gift / input controls */}
        <View
          style={[
            styles.chatOverlay,
            keyboardHeight > 0
              ? { top: 70 }
              : { top: 90 },
          ]}
        >
          <ScrollView
            style={styles.chatContainer}
            showsVerticalScrollIndicator
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            {chatMessages.map((chat) => (
              <View key={chat.id} style={styles.chatMessage}>
                <Image source={{ uri: chat.avatar }} style={styles.avatar} />
                <View style={[styles.messageContainer, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                  <Text style={styles.username}>{chat.user}</Text>
                  <View style={styles.messageColumn}>
                    <Text style={styles.messageText} selectable>
                      {chat.message}
                    </Text>
                    {chat.hasGift && (
                      <View style={styles.giftContainer}>
                        <Text style={styles.giftEmoji}>🎁</Text>
                        <View style={styles.giftBadge}>
                          <Text style={styles.giftCount}>x{chat.giftCount}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>

      {activePanel !== 'none' && (
        <Modal
          visible={activePanel !== 'none'}
          transparent={true}
          animationType="fade"
          onRequestClose={closePanel}
        >
          {/* <View style={{flex:1}}> */}
          <Pressable style={styles.modalBackdrop} onPress={closePanel} />
          <View style={styles.bottomPanelContainer}>
            {renderPanel()}
          </View>
          {/* </View> */}
        </Modal>
      )}

      {/* Bottom Input - Only show when no panel is active */}
      {activePanel === 'none' && !streamEnded && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={[styles.bottomContainer, { backgroundColor: themeStyles.backgroundColor }]}>
            <View style={styles.inputRow}>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: themeStyles.secondaryBackground,
                    color: themeStyles.textColor,
                  },
                ]}
                placeholder="Type a message"
                placeholderTextColor={themeStyles.textColorSecondary}
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={1000}
                editable={!streamEnded}
              />
              <TouchableOpacity
                style={[styles.sendButton, isPending && { opacity: 0.6 }]}
                onPress={() => sendMessage()}
                disabled={isPending || streamEnded}
              >
                <Icon name="send" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.giftButton}
                onPress={() => setActivePanel('gifts')}
                disabled={streamEnded}
              >
                <Icon name="gift" size={24} color="#940304" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  // Add to your StyleSheet.create
  modalBackdrop: {
    height: 300,
    // backgroundColor:"red",
    backgroundColor: 'rgba(0,0,0,0.2)',
    // position: 'absolute',
    // top: 0,
    // left: 0,
    // right: 0,
    // bottom: 0,
    zIndex: 1,
  },
  headerTitle: {
    position: 'absolute',
    left: "50%",
    transform: [{ translateX: -30 }],
    fontSize: 18,
    fontWeight: '600',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  videoContainerSmall: {
    height: 200,
    flex: 0,
  },
  backgroundVideo: {
    width: '93%',
    height: '100%',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 8,
  },
  chatOverlay: {
    position: 'absolute',
    left: 12,
    width: '72%',
    maxHeight: Platform.OS === 'ios' ? 240 : 220,
  },
  chatContainer: {
    flex: 1,
  },
  chatMessage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageContainer: {
    flex: 1,
    padding: 8,
    borderRadius: 12,
  },
  username: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  messageColumn: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 6,
    minWidth: 0,
    width: '100%',
  },
  messageText: {
    color: 'white',
    fontSize: 14,
    flexShrink: 1,
    width: '100%',
  },
  endedPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 24,
  },
  endedTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
  },
  endedSubtitle: {
    color: '#aaa',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  endedButton: {
    backgroundColor: '#940304',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
  },
  endedButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  giftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  giftEmoji: {
    fontSize: 20,
    marginRight: 4,
  },
  giftBadge: {
    backgroundColor: '#940304',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  giftCount: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  panelContainer: {
    flex: 1,
    maxHeight: "70%",
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  bottomContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 20,
  },
  giftButton: {
    backgroundColor: 'transparent',
    padding: 8,
  },
  bottomPanelContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    // padding: 16,
    // paddingBottom: 32,
  },
});

export default User_liveViewMain;