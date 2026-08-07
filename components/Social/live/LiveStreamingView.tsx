import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  Image,
  ScrollView,
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  TextInput,
} from 'react-native';
import Modal from 'react-native-modal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MaterialIcons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getLiveVideoCallToken } from '@/utils/mutations/video';
import * as SecureStore from 'expo-secure-store';
import WebView from 'react-native-webview';
import { useLiveStreamChatList } from '@/utils/hooks/useLiveStreamChats';
import { useSendLiveStreamMessage } from '@/utils/hooks/useSendLiveStreamMessage';
import { Alert } from 'react-native';
import { Camera } from 'expo-camera';
import { LIVE_STREAM_API_BASE } from '@/utils/liveStreamConstants';
import { AGORA_LIVE_APP_ID, buildLiveStreamWebHtml } from '@/utils/liveStreamWebHtml';
import { keyboardInputOffset, useKeyboardHeight } from '@/utils/useKeyboardHeight';
import { useIosMonetizationHidden } from '@/utils/iosMonetization';

const AGORA_FALLBACK_UID = 12345;

async function ensureLiveMediaPermissions(): Promise<{ ok: boolean; message?: string }> {
  try {
    const cam = await Camera.requestCameraPermissionsAsync();
    const mic = await Camera.requestMicrophonePermissionsAsync();
    if (cam.status !== 'granted' || mic.status !== 'granted') {
      return {
        ok: false,
        message:
          cam.status !== 'granted' && mic.status !== 'granted'
            ? 'Allow camera and microphone access in Settings to go live.'
            : cam.status !== 'granted'
              ? 'Allow camera access in Settings to go live.'
              : 'Allow microphone access in Settings to go live.',
      };
    }
    if (Platform.OS === 'android') {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, message: e?.message || 'Could not request camera/mic permission.' };
  }
}

/**
 * Prefer Agora WebView (same path as Expo Go).
 * Native react-native-agora hangs on "Joining channel…" on EAS/dev builds;
 * WebView is JS-only and shippable via OTA.
 */
function canUseNativeAgora(): boolean {
  return false;
}

/** Lazy load kept for a future native re-enable; currently unused while WebView is forced. */
function loadNativeLivePlayer(): React.ComponentType<any> | null {
  if (!canUseNativeAgora()) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('./LiveStreamingPlayer').default;
  } catch {
    return null;
  }
}

async function resolveAgoraUid(): Promise<number> {
  try {
    const raw = await SecureStore.getItemAsync('user_data');
    if (raw) {
      const u = JSON.parse(raw) as { id?: number };
      const id = Number(u?.id);
      if (Number.isFinite(id) && id >= 1) return Math.floor(id) % 2147483647;
    }
  } catch {
    /* fallback */
  }
  return AGORA_FALLBACK_UID;
}

interface LiveStreamingViewProps {
  dark: boolean;
  onEndLive: () => void;
  onThreeDotsPress: () => void;
  channelName: string;
  livestreamId?: string;
  /** User-selected duration before going live, e.g. "15 Min", "1 Hour". Stream auto-ends when reached. */
  selectedDuration?: string;
}

interface ChatMessage {
  id: string;
  user: string;
  message: string;
  avatar: string;
  hasGift?: boolean;
  giftCount?: number;
  reply_to?: {
    id: string | number;
    message: string;
    user: { fullname: string };
  } | null;
}
/** Parse duration string (e.g. "15 Min", "1 Hour", "2 Hours 30 Min") to total seconds */
function parseDurationToSeconds(durationStr: string | undefined): number | null {
  if (!durationStr || typeof durationStr !== 'string') return null;
  const s = durationStr.trim();
  const hourMatch = s.match(/(\d+)\s*Hours?/i);
  const minMatch = s.match(/(\d+)\s*Min/i);
  const hours = hourMatch ? parseInt(hourMatch[1], 10) : 0;
  const mins = minMatch ? parseInt(minMatch[1], 10) : 0;
  const total = hours * 3600 + mins * 60;
  return total > 0 ? total : null;
}

export default function LiveStreamingView({
  dark,
  onEndLive,
  onThreeDotsPress,
  channelName,
  livestreamId,
  selectedDuration,
}: LiveStreamingViewProps) {
  const { blocked: hideIosMonetization } = useIosMonetizationHidden();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const CHANNEL_NAME = channelName ?? 'live_stream';
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const chatScrollRef = useRef<ScrollView>(null);
  const [cameraReadyForWeb, setCameraReadyForWeb] = useState(false);
  const [mediaPermissionError, setMediaPermissionError] = useState<string | null>(null);
  const [NativeLivePlayer, setNativeLivePlayer] = useState<React.ComponentType<any> | null>(null);

  const { data: agoraAuth, isPending: agoraTokenPending, isError: agoraTokenError } = useQuery({
    queryKey: ['liveHostToken', CHANNEL_NAME],
    enabled: !!CHANNEL_NAME,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) throw new Error('No auth token found');
      const uid = await resolveAgoraUid();
      const res = await getLiveVideoCallToken(
        { channel_name: CHANNEL_NAME, uid, role: 'host' },
        token,
      );
      const agoraToken = String(res?.token || '');
      if (!agoraToken) throw new Error('Empty Agora token');
      return { token: agoraToken, uid };
    },
  });

  const useNativeLive = NativeLivePlayer != null;

  const hostWebHtml = useMemo(() => {
    if (!agoraAuth?.token || useNativeLive) return null;
    return buildLiveStreamWebHtml(CHANNEL_NAME, 'host', {
      appId: AGORA_LIVE_APP_ID,
      token: agoraAuth.token,
      uid: agoraAuth.uid,
    });
  }, [CHANNEL_NAME, agoraAuth?.token, agoraAuth?.uid, useNativeLive]);

  const [audienceModalVisible, setAudienceModalVisible] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audienceCount, setAudienceCount] = useState(0);
  const [totalGifts, setTotalGifts] = useState(0);
  const [totalGiftCoins, setTotalGiftCoins] = useState(0);
  const [textCommentCount, setTextCommentCount] = useState(0);
  const [insightsModalVisible, setInsightsModalVisible] = useState(false);
  /** When true, chat is closed (stream ended or ending) — must flip before async `onEndLive` so users cannot send during teardown. */
  const [liveEnded, setLiveEnded] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [messageText, setMessageText] = useState('');
  const keyboardHeight = useKeyboardHeight();

  const endLiveFlow = useCallback(() => {
    setLiveEnded(true);
    setReplyModalVisible(false);
    setReplyTo(null);
    setMessageText('');
    Keyboard.dismiss();
    onEndLive();
  }, [onEndLive]);

  const { data: hostStreamMeta } = useQuery({
    queryKey: ['liveStreamDetail', livestreamId, 'host'],
    enabled: !!livestreamId && !liveEnded,
    queryFn: async () => {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) throw new Error('No token');
      const res = await fetch(`${LIVE_STREAM_API_BASE}/live-streams/${livestreamId}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to load stream');
      return res.json();
    },
    refetchInterval: 4000,
  });

  useEffect(() => {
    if (!hostStreamMeta || liveEnded) return;
    const active =
      hostStreamMeta.is_active === true ||
      hostStreamMeta.is_active === 1 ||
      hostStreamMeta.is_active === '1';
    const ended = hostStreamMeta.status === 'ended';
    if (!active || ended) setLiveEnded(true);
  }, [hostStreamMeta, liveEnded]);

  const chatStreamId = liveEnded ? '' : livestreamId ?? '';
  const { chats, isLoading } = useLiveStreamChatList(chatStreamId);
  const { mutate: sendChatMessage, isPending } = useSendLiveStreamMessage(chatStreamId);

  useEffect(() => {
    let giftEventCount = 0;
    let giftCoinsSum = 0;
    let nonGiftComments = 0;

    const formatted = (chats || []).map((msg: any) => {
      if (msg.type === 'gift') {
        giftEventCount += 1;
        giftCoinsSum += Number(msg.amount) || 0;
      } else {
        nonGiftComments += 1;
      }

      return {
        id: msg.id.toString(),
        user: msg.user?.fullname || 'User',
        message: msg.message,
        avatar: msg.user?.profile_picture_url || 'https://ui-avatars.com/api/?name=User',
        hasGift: msg.type === 'gift',
        giftCount:
          msg.type === 'gift' && msg.amount != null && msg.amount !== ''
            ? Number(msg.amount) || 0
            : 0,

        reply_to: msg.reply_to
          ? {
              id: msg.reply_to.id,
              message: msg.reply_to.message,
              user: {
                fullname: msg.reply_to.user?.fullname || 'User',
              },
            }
          : null,
      };
    });

    setChatMessages(formatted);
    setTotalGifts(giftEventCount);
    setTotalGiftCoins(giftCoinsSum);
    setTextCommentCount(nonGiftComments);
  }, [chats]);

  // Auto-scroll to latest comment when new messages arrive
  useEffect(() => {
    if (chatMessages.length > 0) {
      const timer = setTimeout(() => {
        chatScrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [chatMessages.length]);

  const audienceQuery = useQuery({
    queryKey: ['audience', livestreamId],
    queryFn: async () => {
      const token = await SecureStore.getItemAsync('auth_token');
      const res = await fetch(`${LIVE_STREAM_API_BASE}/live-streams/${livestreamId}/audience`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });

      if (!res.ok) throw new Error('Failed to fetch audience');
      return await res.json();
    },
    enabled: !!livestreamId && !liveEnded,
    refetchInterval: livestreamId && !liveEnded ? 5000 : false,
  });
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    (async () => {
      // Must prompt at RN layer — WebView getUserMedia will hang forever without OS grants.
      const perm = await ensureLiveMediaPermissions();
      if (cancelled) return;
      if (!perm.ok) {
        setMediaPermissionError(perm.message || 'Camera/microphone permission required');
        setCameraReadyForWeb(false);
        return;
      }
      setMediaPermissionError(null);

      // Always use WebView live path (OTA-safe). Give camera time to release after RN permission prompt.
      const Player = loadNativeLivePlayer();
      if (!cancelled && Player) setNativeLivePlayer(() => Player);

      timer = setTimeout(() => {
        if (!cancelled) setCameraReadyForWeb(true);
      }, Player ? 250 : 450);
    })();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);
  useEffect(() => {
    if (audienceQuery.data) {
      // console.log('Audience API response:', audienceQuery.data);
    }
  }, [audienceQuery.data]);
  useEffect(() => {
    const onBackPress = () => {
      Alert.alert(
        'End Live Stream?',
        'Please end the live stream before leaving.',
        [{ text: 'OK', style: 'cancel' }]
      );
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

    return () => subscription.remove(); // cleanup
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-end stream when selected duration is reached (only once)
  const selectedDurationSeconds = parseDurationToSeconds(selectedDuration);
  const hasAutoEndedRef = useRef(false);
  useEffect(() => {
    if (selectedDurationSeconds == null || selectedDurationSeconds <= 0 || hasAutoEndedRef.current) return;
    if (duration >= selectedDurationSeconds) {
      hasAutoEndedRef.current = true;
      endLiveFlow();
    }
  }, [duration, selectedDurationSeconds, endLiveFlow]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  useEffect(() => {
    if (liveEnded || !livestreamId) return;
    const interval = setInterval(async () => {
      try {
        const token = await SecureStore.getItemAsync('auth_token');
        const res = await fetch(`${LIVE_STREAM_API_BASE}/live-streams/${livestreamId}/audience-count`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          const n = typeof data.count === 'number' ? data.count : Number(data?.data) || 0;
          setAudienceCount(Number.isFinite(n) ? n : 0);
        }
      } catch (err) {
        console.log("🔴 Error fetching audience count", err);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [livestreamId, liveEnded]);

  // Heartbeat — tell the server the stream host is still active every 30 seconds.
  // If the host closes the app without ending the stream, the backend cleanup
  // command will mark the stream as inactive after 2 minutes of no heartbeat.
  useEffect(() => {
    if (!livestreamId || liveEnded) return;

    const sendHeartbeat = async () => {
      try {
        const token = await SecureStore.getItemAsync('auth_token');
        await fetch(`${LIVE_STREAM_API_BASE}/live-streams/${livestreamId}/heartbeat`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.log('Heartbeat error', err);
      }
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 30000);
    return () => clearInterval(interval);
  }, [livestreamId, liveEnded]);

  const canType = !liveEnded;

  useEffect(() => {
    if (liveEnded) {
      setReplyModalVisible(false);
      setReplyTo(null);
    }
  }, [liveEnded]);

  const bottomInputOffset = keyboardInputOffset(keyboardHeight, insets.bottom);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: dark ? '#000' : '#FFF' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 52 : 24}
    >
      {/* Back button only – title lives in web */}
      <View style={styles.header}>
        <TouchableOpacity onPress={endLiveFlow} style={styles.backButton} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <MaterialIcons name="arrow-back" size={24} color={dark ? '#FFF' : '#000'} />
        </TouchableOpacity>
      </View>
      <View style={styles.streamContainer}>
        {/* Video area only – WebView does not extend under app input bar, so web's bottom bar stays visible */}
        <View style={styles.webViewWrapper}>
          {(agoraTokenPending || (!cameraReadyForWeb && !mediaPermissionError)) && (
            <View style={styles.loaderCenter}>
              <ActivityIndicator size="large" color="#C61F3A" />
              <Text style={{ color: dark ? '#fff' : '#000', marginTop: 12, textAlign: 'center', paddingHorizontal: 24 }}>
                {agoraTokenPending ? 'Preparing live stream…' : 'Starting camera…'}
              </Text>
            </View>
          )}

          {mediaPermissionError ? (
            <View style={styles.loaderCenter}>
              <Text style={{ color: dark ? '#fff' : '#000', textAlign: 'center', paddingHorizontal: 24, marginBottom: 12 }}>
                {mediaPermissionError}
              </Text>
              <TouchableOpacity
                onPress={async () => {
                  setMediaPermissionError(null);
                  const perm = await ensureLiveMediaPermissions();
                  if (!perm.ok) {
                    setMediaPermissionError(perm.message || 'Permission required');
                    return;
                  }
                  setCameraReadyForWeb(true);
                }}
                style={{ backgroundColor: '#C61F3A', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 }}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {!!agoraAuth?.token && cameraReadyForWeb && NativeLivePlayer && (
            <NativeLivePlayer
              token={agoraAuth.token}
              channelName={CHANNEL_NAME}
              uid={agoraAuth.uid}
              role="host"
            />
          )}

          {!!hostWebHtml && cameraReadyForWeb && !useNativeLive && !mediaPermissionError && (
            <WebView
              originWhitelist={['*']}
              source={{
                html: hostWebHtml,
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
              allowsProtectedMedia
              style={styles.webView}
              onMessage={(event) => {
                const raw = event.nativeEvent.data;
                if (raw === 'stream_ended' || raw === '"stream_ended"') {
                  endLiveFlow();
                  return;
                }
                try {
                  const parsed = JSON.parse(raw);
                  if (parsed?.type === 'live_error') {
                    if (__DEV__) console.warn('Live WebView error:', parsed.message);
                    const msg = String(parsed.message || '');
                    if (/timed out|permission|NotAllowed|NotFound|NotReadable/i.test(msg)) {
                      Alert.alert(
                        'Could not start live',
                        'Please allow camera and microphone access so you can go live, then try again. If you already allowed them, close any other app using the camera and retry.',
                      );
                    }
                  }
                } catch {
                  /* ignore non-json */
                }
              }}
            />
          )}

          {agoraTokenError && (
            <View style={styles.loaderCenter}>
              <Text style={{ color: dark ? '#fff' : '#000', textAlign: 'center', paddingHorizontal: 24 }}>
                Could not start live (token error). Check your connection and try again.
              </Text>
            </View>
          )}

          {/* Chat Overlay – pinned to upper-left so it never covers the bottom bar or center camera buttons */}
          {keyboardHeight === 0 && (
            <View
              pointerEvents="box-none"
              style={[
                styles.chatOverlay,
                { top: 72 },
              ]}
            >
              <ScrollView
                ref={chatScrollRef}
                style={styles.chatContainer}
                showsVerticalScrollIndicator
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}
              >
                {chatMessages.map((chat) => (
                  <TouchableOpacity
                    key={chat.id}
                    onLongPress={() => {
                      if (liveEnded) return;
                      setReplyTo(chat);
                      setReplyText('');
                      setReplyModalVisible(true);
                    }}
                  >
                    <View style={styles.chatMessage}>
                      <Image source={{ uri: chat.avatar }} style={styles.avatar} />
                      <View style={[styles.messageContainer, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                        <Text style={styles.username}>{chat.user}</Text>

                        {/* Reply Preview Box */}
                        {chat.reply_to && (
                          <View style={styles.replyPreview}>
                            <Text style={styles.replyUserText}>
                              Replying to {chat.reply_to.user?.fullname || 'User'}
                            </Text>
                            <Text style={styles.replyMessageText} numberOfLines={2}>
                              {chat.reply_to.message}
                            </Text>
                          </View>
                        )}

                        <View style={styles.messageColumn}>
                          <Text style={styles.messageText} selectable>
                            {chat.message}
                          </Text>
                          {chat.hasGift && !hideIosMonetization && (
                            <View style={styles.giftContainer}>
                              <Text style={styles.giftEmoji}>🎁</Text>
                              <View style={styles.giftBadge}>
                                <Text style={styles.giftCount}>
                                  x{Number(chat.giftCount) > 0 ? chat.giftCount : '?'}
                                </Text>
                              </View>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      <View
        style={[
          styles.bottomSection,
          {
            paddingBottom: bottomInputOffset,
            marginBottom: 0,
          },
        ]}
      >
        {canType && (
          <View style={styles.inputBar}>
            {!!replyTo && (
              <TouchableOpacity style={styles.inputReplyChip} onPress={() => setReplyTo(null)}>
                <Text style={styles.inputReplyChipText}>
                  Replying to {replyTo.user}: {replyTo.message?.slice(0, 32)}{replyTo.message?.length > 32 ? '…' : ''}
                </Text>
                <Text style={styles.inputReplyChipClose}>✕</Text>
              </TouchableOpacity>
            )}

            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder={replyTo ? 'Write a reply…' : 'Write a message…'}
                placeholderTextColor="#9AA0A6"
                value={messageText}
                onChangeText={setMessageText}
                multiline
                editable={canType}
                maxLength={1000}
              />
              <TouchableOpacity
                style={[styles.sendBtn, (isPending || liveEnded) && { opacity: 0.6 }]}
                disabled={isPending || !messageText.trim() || liveEnded}
                onPress={() => {
                  if (liveEnded) return;
                  const text = messageText.trim();
                  if (!text) return;

                  const optimisticId = `temp-${Date.now()}`;
                  setChatMessages(prev => [
                    ...prev,
                    {
                      id: optimisticId,
                      user: 'You',
                      message: text,
                      avatar: 'https://ui-avatars.com/api/?name=You',
                      hasGift: false,
                      giftCount: 0,
                      reply_to: replyTo
                        ? {
                          id: replyTo.id,
                          message: replyTo.message,
                          user: { fullname: replyTo.user },
                        }
                        : null,
                    } as any,
                  ]);

                  setMessageText('');

                  sendChatMessage(
                    { message: text, reply_to: replyTo?.id },
                    {
                      onSuccess: () => {
                        setReplyTo(null);
                      },
                      onError: (e: any) => {
                        if (e?.status === 410) setLiveEnded(true);
                        setChatMessages(prev => prev.filter(m => m.id !== optimisticId));
                        setMessageText(text);
                        Alert.alert('Failed to send', e?.message ?? 'Please try again.');
                      },
                    }
                  );
                }}
              >
                <MaterialIcons name="send" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {liveEnded && (
          <View style={styles.chatClosedBanner}>
            <Text style={styles.chatClosedText}>Chat closed — live has ended</Text>
          </View>
        )}

        {keyboardHeight === 0 && (
          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={[styles.viewAudienceButton, styles.controlButton]}
              onPress={() => {
                setAudienceModalVisible(true);
                if (livestreamId) {
                  queryClient.invalidateQueries({ queryKey: ['audience', livestreamId] });
                }
              }}
            >
              <Text
                style={[
                  styles.viewAudienceButtonText,
                  { color: dark ? '#FFF' : '#FFF' },
                ]}
              >
                 Audience
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewAudienceButton, styles.controlButton]}
              onPress={() => setInsightsModalVisible(true)}
            >
              <Text
                style={[
                  styles.viewAudienceButtonText,
                  { color: dark ? '#FFF' : '#FFF' },
                ]}
              >
                 Insights
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.endStreamButton, styles.controlButton]}
              onPress={endLiveFlow}
              activeOpacity={0.8}
            >
              <MaterialIcons name="call-end" size={18} color="#FFF" />
              <Text style={styles.endStreamButtonText}>End stream</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Modal
        isVisible={audienceModalVisible}
        onBackdropPress={() => setAudienceModalVisible(false)}
        style={{ margin: 0, justifyContent: 'flex-end' }}
      >
        <View style={{ backgroundColor: '#fff', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Current Audience</Text>

          {audienceQuery.isLoading ? (
            <ActivityIndicator size="large" color="#000" />
          ) : Array.isArray(audienceQuery.data?.data) && audienceQuery.data.data.length > 0 ? (
            audienceQuery.data.data.map((audience: any) => (
              <View
                key={audience.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: '#eee',
                  gap: 12,
                }}
              >
                <Image
                  source={{
                    uri:
                      audience.user?.profile_picture_url ||
                      (audience.user?.profile_picture?.includes?.('http')
                        ? audience.user.profile_picture
                        : audience.user?.profile_picture) ||
                      'https://ui-avatars.com/api/?name=User',
                  }}
                  style={{ width: 40, height: 40, borderRadius: 20 }}
                />
                <View>
                  <Text style={{ fontWeight: '600' }}>{audience.user?.fullname || 'Unnamed User'}</Text>
                  {/* <Text style={{ color: '#555' }}>{audience.user?.email || 'No email'}</Text> */}
                </View>
              </View>
            ))
          ) : (
            <Text style={{ color: '#888', textAlign: 'center', paddingVertical: 20 }}>
              No audience found.
            </Text>
          )}

        </View>
      </Modal>
      <Modal
        isVisible={insightsModalVisible}
        onBackdropPress={() => setInsightsModalVisible(false)}
        style={{ margin: 0, justifyContent: 'flex-end' }}
      >
        <View
          style={{
            backgroundColor: '#fff',
            padding: 20,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '90%',
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>
            📊 Live Stream Insights
          </Text>

          {/* Stats Section */}
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              rowGap: 16,
              columnGap: 12,
              marginBottom: 20,
            }}
          >
            {[
              { label: '👁️ Viewers', value: audienceCount },
              { label: '⏱️ Duration', value: formatDuration(duration) },
              ...(hideIosMonetization
                ? []
                : [
                    { label: '🎁 Gift events', value: totalGifts },
                    { label: '🪙 Gift coins', value: totalGiftCoins },
                  ]),
              { label: '💬 Comments', value: textCommentCount },
            ].map((item, idx) => (
              <View
                key={idx}
                style={{
                  width: '48%',
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: '#f9f9f9',
                  shadowColor: '#000',
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 2,
                }}
              >
                <Text style={{ fontSize: 14, color: '#555' }}>{item.label}</Text>
                <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 4 }}>
                  {item.value}
                </Text>
              </View>
            ))}
          </View>

          {/* Audience List */}
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
            🧑‍🤝‍🧑 Audience Members
          </Text>

          {audienceQuery.isLoading ? (
            <ActivityIndicator size="large" color="#000" />
          ) : Array.isArray(audienceQuery.data?.data) &&
            audienceQuery.data.data.length > 0 ? (
            <ScrollView style={{ maxHeight: 300 }}>
              {audienceQuery.data.data.map((audience: any) => (
                <View
                  key={audience.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 12,
                    backgroundColor: '#f2f2f2',
                    marginBottom: 10,
                    borderRadius: 10,
                    shadowColor: '#000',
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 1 },
                    elevation: 1,
                    gap: 12,
                  }}
                >
                  <Image
                    source={{
                      uri:
                        audience.user?.profile_picture_url ||
                        (audience.user?.profile_picture?.includes?.('http')
                          ? audience.user.profile_picture
                          : audience.user?.profile_picture) ||
                        'https://ui-avatars.com/api/?name=User',
                    }}
                    style={{ width: 44, height: 44, borderRadius: 22 }}
                  />
                  <View>
                    <Text style={{ fontWeight: '600', fontSize: 16 }}>
                      {audience.user?.fullname || 'Unnamed User'}
                    </Text>
                    <Text style={{ color: '#666', fontSize: 13 }}>
                      {audience.user?.email || 'No email'}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text
              style={{
                color: '#888',
                textAlign: 'center',
                paddingVertical: 20,
                fontStyle: 'italic',
              }}
            >
              No audience found.
            </Text>
          )}
        </View>
      </Modal>

      {/*  chat reply mopdal */}
      <Modal
        isVisible={replyModalVisible && !liveEnded}
        onBackdropPress={() => setReplyModalVisible(false)}
        style={{ margin: 0, justifyContent: 'flex-end' }}
      >
        <View style={{ backgroundColor: '#fff', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Reply to {replyTo?.user}</Text>
          <Text style={{ marginBottom: 10, color: '#555' }}>{replyTo?.message}</Text>

          <View style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginBottom: 10 }}>
            <TextInput
              placeholder="Type your reply..."
              value={replyText}
              onChangeText={setReplyText}
              multiline
              editable={!liveEnded}
              style={{ height: 80, textAlignVertical: 'top' }}
            />
          </View>

          <TouchableOpacity
            onPress={() => {
              if (liveEnded) return;
              if (replyText.trim()) {
                sendChatMessage(
                  { message: replyText, reply_to: replyTo?.id },
                  {
                    onSuccess: () => {
                      setReplyModalVisible(false);
                      setReplyTo(null);
                      setReplyText('');
                    },
                    onError: (e: any) => {
                      if (e?.status === 410) setLiveEnded(true);
                      Alert.alert('Failed to send', e?.message ?? 'Please try again.');
                    },
                  }
                );
              } else {
                Alert.alert('Error', 'Please type a message before sending.');
              }
            }}
            style={{
              backgroundColor: '#007AFF',
              padding: 12,
              borderRadius: 8,
              alignItems: 'center'
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Send Reply</Text>
          </TouchableOpacity>
        </View>
      </Modal>



    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  inputBar: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#0E0E0E',
  },
  inputReplyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 6,
  },
  inputReplyChipText: { color: '#D7D7D7', flex: 1, fontSize: 12 },
  inputReplyChipClose: { color: '#BBB', marginLeft: 8, fontSize: 12 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#1A1A1A',
    color: '#fff',
    borderRadius: 10,
  },
  sendBtn: {
    height: 42,
    minWidth: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
  },

  chatOverlay: {
    position: 'absolute',
    left: 12,
    width: '72%',
    maxHeight: Platform.OS === 'ios' ? 220 : 200,
    zIndex: 1,
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  messageColumn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 6,
    minWidth: 0,
  },
  messageText: {
    color: 'white',
    fontSize: 14,
    flexShrink: 1,
    width: '100%',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  streamContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: 'black',
    flexDirection: 'column',
  },
  webViewWrapper: {
    flex: 1,
    position: 'relative',
    minHeight: 0,
  },
  webView: {
    flex: 1,
    width: '100%',
  },
  loaderCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  inputBarSection: {
    backgroundColor: '#0E0E0E',
  },
  bottomSection: {
    backgroundColor: '#0E0E0E',
  },
  chatClosedBanner: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  chatClosedText: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
  },
  controlsContainer: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    paddingHorizontal: 20,
    paddingBottom: 8,
    paddingTop: 10,
    gap: 8,
    backgroundColor: 'rgba(20,20,20,0.98)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.3)',
  },
  controlButton: {
    flex: 1,
    minWidth: 0,
  },
  viewAudienceButton: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },
  viewAudienceButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  endStreamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#C61F3A',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    minWidth: 0,
  },
  endStreamButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
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
  replyBox: {
    backgroundColor: '#222',
    padding: 10,
    marginHorizontal: 16,
    marginBottom: 6,
    borderRadius: 10,
  },
  replyUser: {
    color: '#bbb',
    fontSize: 12,
  },
  replyContent: {
    color: '#eee',
    fontSize: 14,
    fontWeight: 'bold',
  },
  replyPreview: {
    backgroundColor: '#333',
    padding: 6,
    borderRadius: 8,
    marginBottom: 4,
  },
  replyUserText: {
    fontSize: 11,
    color: '#aaa',
  },
  replyMessageText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '500',
  },

});
