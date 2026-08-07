import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  ScrollView,
  Dimensions,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import Modal from 'react-native-modal';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons as Icon } from '@expo/vector-icons';
import GiftsPanel from '@/components/Social/live/GiftsPanel';
import TopupPanel from '@/components/Social/live/TopupPanel';
import SendCoinsPanel from '@/components/Social/live/SendCoinsPanel';
import { useLocalSearchParams } from 'expo-router';
import { AGORA_LIVE_APP_ID, buildLiveStreamWebHtml } from '@/utils/liveStreamWebHtml';
import WebView from 'react-native-webview';
import { keyboardInputOffset, useKeyboardHeight } from '@/utils/useKeyboardHeight';
import { useLiveStreamChatList } from '@/utils/hooks/useLiveStreamChats';
import { useSendLiveStreamMessage } from '@/utils/hooks/useSendLiveStreamMessage';
import * as SecureStore from 'expo-secure-store';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LIVE_STREAM_API_BASE } from '@/utils/liveStreamConstants';
import { API_ENDPOINTS } from '@/apiConfig';
import { getLiveVideoCallToken } from '@/utils/mutations/video';

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
  const insets = useSafeAreaInsets();
  const { channelName, id } = useLocalSearchParams<{ channelName: string; id: string }>();
  const streamId = id != null ? String(Array.isArray(id) ? id[0] : id) : '';

  const router = useRouter();
  const queryClient = useQueryClient();
  const [dark, setDark] = useState<boolean>(true);
  const [streamEnded, setStreamEnded] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [balance, setBalance] = useState<number>(0);
  const [activePanel, setActivePanel] = useState<PanelType>('none');
  const [selectedGift, setSelectedGift] = useState<GiftItem | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([

  ]);

  const [loadingBalance, setLoadingBalance] = useState(true);
  React.useEffect(() => {
    (async () => {
      try {
        setLoadingBalance(true);
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) throw new Error('No token found');

        const response = await fetch(API_ENDPOINTS.USER.BALANCE, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });

        const result = await response.json();

        if (
          response.ok &&
          (result.status === 'success' || result.balance != null || result.data?.balance != null)
        ) {
          const raw = result.balance ?? result.data?.balance ?? 0;
          setBalance(Number(raw) || 0);
        } else {
          console.warn('Balance fetch failed:', result?.message);
        }
      } catch (error) {
        // Soft-fail — gifts UI still works; don't block joining live with an alert.
        console.warn('Balance fetch error:', error instanceof Error ? error.message : String(error));
      } finally {
        setLoadingBalance(false);
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

  const joinLiveStream = useCallback(async () => {
    if (!streamId || streamEnded) return;
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return;
      const res = await fetch(`${LIVE_STREAM_API_BASE}/live-streams/${streamId}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      if (res.status === 410) {
        setStreamEnded(true);
      }
    } catch (e) {
      console.warn('joinLiveStream', e);
    }
  }, [streamId, streamEnded]);

  // Register (and re-register) the viewer as audience while this screen is focused.
  useFocusEffect(
    useCallback(() => {
      if (!streamId || streamEnded) return;

      void joinLiveStream();
      const heartbeat = setInterval(() => {
        void joinLiveStream();
      }, 30000);

      return () => {
        clearInterval(heartbeat);
        void leaveLiveStream();
      };
    }, [streamId, streamEnded, joinLiveStream, leaveLiveStream])
  );

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

  const channel = channelName != null ? String(Array.isArray(channelName) ? channelName[0] : channelName) : '';

  const { data: audienceAgora, isError: audienceTokenError } = useQuery({
    queryKey: ['liveAudienceToken', channel, streamId],
    enabled: !!channel && !streamEnded,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const auth = await SecureStore.getItemAsync('auth_token');
      if (!auth) throw new Error('No auth token');
      let uid = 50000 + Math.floor(Math.random() * 100000);
      try {
        const raw = await SecureStore.getItemAsync('user_data');
        if (raw) {
          const id = Number(JSON.parse(raw)?.id);
          if (Number.isFinite(id) && id >= 1) uid = Math.floor(id) % 2147483647;
        }
      } catch {
        /* keep random uid */
      }
      const res = await getLiveVideoCallToken(
        { channel_name: channel, uid, role: 'audience' },
        auth,
      );
      return { token: String(res?.token || ''), uid };
    },
  });

  useEffect(() => {
    if (streamEnded) {
      queryClient.invalidateQueries({ queryKey: ['liveStreams'] });
    }
  }, [streamEnded, queryClient]);

  const { chats, isLoading } = useLiveStreamChatList(streamEnded ? '' : streamId);
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
    // amount <= 0 means "close panel / navigate to topup" — do not credit wallet
    if (!amount || amount <= 0) {
      setActivePanel('none');
      return;
    }

    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) throw new Error('No token found');

      const response = await fetch(API_ENDPOINTS.USER.WALLETS.TopUp, {
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
      queryClient.invalidateQueries({ queryKey: ['userTransactions'] });

      // Update local balance
      setBalance(prevBalance => prevBalance + amount);
      setActivePanel('gifts');
    } catch (error) {
      console.error('❌ Top-up request failed:', error);
      alert('Top-up request failed. Please try again.');
    }
  };

  const refreshWalletBalance = async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return;
      const response = await fetch(API_ENDPOINTS.USER.BALANCE, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      const result = await response.json();
      if (
        response.ok &&
        (result.status === 'success' || result.balance != null || result.data?.balance != null)
      ) {
        const raw = result.balance ?? result.data?.balance ?? 0;
        setBalance(Number(raw) || 0);
      }
    } catch (e) {
      console.warn('refreshWalletBalance', e);
    }
  };

  const handleSendSuccess = async (amount: number) => {
    const coins = amount * 10;
    setActivePanel('none');
    const giftText = `Sent ${selectedGift?.emoji} x${amount}`;
    if (streamEnded) return;
    try {
      await sendChatMessageAsync({
        message: giftText,
        type: 'gift',
        amount: String(coins),
      });
      await refreshWalletBalance();
    } catch (e: any) {
      if (e?.status === 410) setStreamEnded(true);
      Alert.alert('Gift', e?.message || 'Failed to send gift');
    }
  };

  const closePanel = () => {
    setActivePanel('none');
    setSelectedGift(null);
  };

  const [giftQuantities, setGiftQuantities] = React.useState<{ [id: string]: number }>({});
  const keyboardHeight = useKeyboardHeight();
  const bottomInputOffset = keyboardInputOffset(keyboardHeight, insets.bottom);

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
    <SafeAreaView style={[styles.container, { backgroundColor: themeStyles.backgroundColor }]} edges={['top', 'left', 'right']}>
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 24}
    >
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
        ) : channel && audienceAgora?.token ? (
          <WebView
            originWhitelist={['*']}
            source={{
              html: buildLiveStreamWebHtml(channel, 'audience', {
                appId: AGORA_LIVE_APP_ID,
                token: audienceAgora.token,
                uid: audienceAgora.uid,
              }),
              baseUrl: 'https://api.gympaddy.com/',
            }}
            javaScriptEnabled
            domStorageEnabled
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            mediaCapturePermissionGrantType="grant"
            onPermissionRequest={(event: any) => {
              event.grant?.(event.resources ?? event.nativeEvent?.resources);
            }}
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
        ) : audienceTokenError ? (
          <Text style={{ color: 'white', textAlign: 'center', marginTop: 20 }}>
            Could not join live stream. Try again.
          </Text>
        ) : (
          <Text style={{ color: 'white', textAlign: 'center', marginTop: 20 }}>
            {channel ? 'Connecting…' : 'No channel specified'}
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

      <Modal
        isVisible={activePanel !== 'none'}
        onBackdropPress={closePanel}
        onBackButtonPress={closePanel}
        onSwipeComplete={closePanel}
        swipeDirection="down"
        propagateSwipe
        avoidKeyboard
        style={styles.giftSheetModal}
        backdropOpacity={0.45}
        useNativeDriverForBackdrop
        animationIn="slideInUp"
        animationOut="slideOutDown"
      >
        <View style={styles.bottomPanelContainer}>
          <View style={styles.giftSheetHandle} />
          <View style={styles.bottomPanelContent}>{renderPanel()}</View>
        </View>
      </Modal>

      {/* Bottom Input - Only show when no panel is active */}
      {activePanel === 'none' && !streamEnded && (
        <View
          style={[
            styles.bottomContainer,
            {
              backgroundColor: themeStyles.backgroundColor,
              paddingBottom: bottomInputOffset,
              marginBottom: 0,
            },
          ]}
        >
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
              <Icon name="gift" size={24} color="#C61F3A" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
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
  giftSheetModal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  giftSheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(120, 120, 120, 0.55)',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
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
    backgroundColor: '#C61F3A',
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
    backgroundColor: '#C61F3A',
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
    paddingTop: 12,
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
  /** Fixed height so the gifts grid can scroll in portrait without rotating the device. */
  bottomPanelContainer: {
    width: '100%',
    height: height * 0.58,
    maxHeight: height * 0.72,
    backgroundColor: 'rgba(0, 0, 0, 0)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  bottomPanelContent: {
    flex: 1,
    minHeight: 0,
  },
});

export default User_liveViewMain;