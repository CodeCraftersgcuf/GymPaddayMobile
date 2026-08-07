import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Modal,
    Image,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Keyboard,
    ActivityIndicator,
} from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/themeContext';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { apiCall } from '@/utils/customApiCall';
import { API_ENDPOINTS } from '@/apiConfig';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRAND_PRIMARY } from '@/constants/Colors';

interface Message {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: string;
    avatar?: string;
    imageUrl?: string;
    /** Set while an optimistic bubble is still uploading. */
    pending?: boolean;
}

interface SupportTicket {
    id: string | number;
    subject?: string;
    message?: string;
    description?: string;
    admin_reply?: string | null;
    /** Uploaded image URLs keyed by the stored path referenced in the message log. */
    attachments?: Record<string, string> | null;
    created_at?: string;
    updated_at?: string;
}

interface PickedImage {
    uri: string;
    name: string;
    type: string;
}

/** Matches the marker the backend writes into the message log for uploaded images. */
const IMAGE_TOKEN = '[image]';
/** Older app versions logged this instead of uploading the image. */
const LEGACY_IMAGE_TEXT = '[image attached]';
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

const supportCategories = [
    'General',
    'Socials',
    'Connect',
    'Market',
    'Gym Hub',
] as const;

type SupportCategory = (typeof supportCategories)[number];

function categoryStorageKey(userId: string) {
    return `supportCategory:${userId}`;
}

export default function SupportScreen() {
    const { dark } = useTheme();
    const insets = useSafeAreaInsets();
    const scrollRef = useRef<ScrollView>(null);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [message, setMessage] = useState('');
    const [attachedImage, setAttachedImage] = useState<PickedImage | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [storageKey, setStorageKey] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const sub = Keyboard.addListener(showEvent, () => {
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
        });
        return () => sub.remove();
    }, []);

    const extractTicketsFromResponse = (response: any): SupportTicket[] => {
        if (Array.isArray(response)) return response;
        if (Array.isArray(response?.tickets)) return response.tickets;
        if (Array.isArray(response?.data)) return response.data;
        if (Array.isArray(response?.data?.tickets)) return response.data.tickets;
        return [];
    };

    const normalizeCategory = (category: string = ''): SupportCategory => {
        const trimmed = category.trim();
        const exact = supportCategories.find(
            (item) => item.toLowerCase() === trimmed.toLowerCase()
        );
        if (exact) return exact;

        const lower = trimmed.toLowerCase();
        if (lower.includes('social')) return 'Socials';
        if (lower.includes('connect')) return 'Connect';
        if (lower.includes('market')) return 'Market';
        if (lower.includes('gym')) return 'Gym Hub';
        return 'General';
    };

    const pickLatestCategory = (tickets: SupportTicket[]): SupportCategory | '' => {
        let latestCategory: SupportCategory | '' = '';
        let latestActivityAt = 0;

        tickets.forEach((ticket) => {
            const category = normalizeCategory(ticket.subject || '');
            if (!category) return;

            const createdAt = ticket.created_at ? new Date(ticket.created_at).getTime() : 0;
            const updatedAt = ticket.updated_at ? new Date(ticket.updated_at).getTime() : createdAt;
            const activityAt = Math.max(createdAt, updatedAt);

            if (activityAt >= latestActivityAt) {
                latestCategory = category;
                latestActivityAt = activityAt;
            }
        });

        return latestCategory;
    };

    const persistCategory = async (category: string, userId?: string | null) => {
        const id = userId || (storageKey ? storageKey.split(':')[1] : null);
        if (!id || !category) return;
        await AsyncStorage.setItem(categoryStorageKey(id), category);
    };

    const applyCategory = useCallback(async (category: string, userId?: string | null) => {
        if (!category) return;
        setSelectedCategory(category);
        await persistCategory(category, userId);
    }, [storageKey]);

    /**
     * A message log line is either plain text or an `[image]<path>` marker that has to be
     * resolved through the ticket's attachment map before it can be rendered.
     */
    const parseMessageLine = (
        line: string,
        attachments?: Record<string, string> | null
    ): { text: string; imageUrl?: string } => {
        if (line.toLowerCase() === LEGACY_IMAGE_TEXT) {
            return { text: 'Photo unavailable' };
        }

        if (!line.startsWith(IMAGE_TOKEN)) {
            return { text: line };
        }

        const path = line.slice(IMAGE_TOKEN.length).trim();
        const url = attachments?.[path];

        return url ? { text: 'Photo', imageUrl: url } : { text: 'Photo unavailable' };
    };

    const mapTicketsToMessages = (tickets: SupportTicket[]): { messages: Message[]; latestCategory: SupportCategory | '' } => {
        const flattened: Array<{ dateKey: number; message: Message }> = [];
        const latestCategory = pickLatestCategory(tickets);

        tickets.forEach((ticket) => {
            const createdAt = ticket.created_at ? new Date(ticket.created_at).getTime() : Date.now();
            const updatedAt = ticket.updated_at ? new Date(ticket.updated_at).getTime() : createdAt;
            const userText = ticket.message || ticket.description || '';

            if (userText.trim()) {
                // Split messages that were concatenated with \n back into individual bubbles
                const lines = userText.split('\n').filter((l) => l.trim());
                (lines.length ? lines : [userText]).forEach((line, idx) => {
                    if (!line.trim()) return;
                    flattened.push({
                        dateKey: createdAt + idx,
                        message: {
                            id: `ticket_user_${ticket.id}_${idx}`,
                            ...parseMessageLine(line.trim(), ticket.attachments),
                            isUser: true,
                            timestamp: new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        },
                    });
                });
            }

            if (ticket.admin_reply && ticket.admin_reply.trim()) {
                flattened.push({
                    dateKey: updatedAt,
                    message: {
                        id: `ticket_admin_${ticket.id}`,
                        text: ticket.admin_reply,
                        isUser: false,
                        timestamp: new Date(updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    },
                });
            }
        });

        flattened.sort((a, b) => a.dateKey - b.dateKey);
        return {
            messages: flattened.map((item) => item.message),
            latestCategory,
        };
    };

    const syncMessagesFromServer = useCallback(async () => {
        try {
            const token = await SecureStore.getItemAsync('auth_token');
            if (!token) return;
            setIsSyncing(true);

            const response = await apiCall(API_ENDPOINTS.USER.TICKETS.List, 'GET', undefined, token);
            const tickets: SupportTicket[] = extractTicketsFromResponse(response);

            const { messages: serverMessages, latestCategory } = mapTicketsToMessages(tickets);
            if (serverMessages.length > 0) {
                await updateMessages(serverMessages);
            } else if (storageKey) {
                // Keep local chat visible when server has no ticket yet.
                const stored = await AsyncStorage.getItem(storageKey);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    setMessages(Array.isArray(parsed) ? parsed : []);
                }
            }

            if (latestCategory) {
                await applyCategory(latestCategory);
            }
        } catch (error) {
            console.error('Failed to sync support tickets:', error);
        } finally {
            setIsSyncing(false);
        }
    }, [storageKey, applyCategory]);

    useEffect(() => {
        (async () => {
            try {
                const storedUserId = await SecureStore.getItemAsync('user_id');
                const storedUserData = await SecureStore.getItemAsync('user_data');
                const parsedUserData = storedUserData ? JSON.parse(storedUserData) : null;
                const fallbackUserId = parsedUserData?.id ? String(parsedUserData.id) : null;
                const currentUserId = storedUserId || fallbackUserId;

                if (!currentUserId) {
                    setStorageKey(null);
                    setMessages([]);
                    return;
                }

                const key = `supportMessages:${currentUserId}`;
                setStorageKey(key);

                const storedCategory = await AsyncStorage.getItem(categoryStorageKey(currentUserId));
                if (storedCategory) {
                    setSelectedCategory(storedCategory);
                }

                const stored = await AsyncStorage.getItem(key);
                if (stored) {
                    try {
                        const parsed = JSON.parse(stored);
                        setMessages(Array.isArray(parsed) ? parsed : []);
                    } catch {
                        setMessages([]);
                    }
                } else {
                    setMessages([]);
                }

                await syncMessagesFromServer();
            } catch (error) {
                console.error('Failed to load support messages:', error);
                setMessages([]);
            }
        })();
    }, [syncMessagesFromServer]);

    async function updateMessages(updatedMessages: Message[]) {
        setMessages(updatedMessages);
        if (!storageKey) return;
        await AsyncStorage.setItem(storageKey, JSON.stringify(updatedMessages));
    }

    const resolveCategoryForSend = async (token: string): Promise<SupportCategory | ''> => {
        if (selectedCategory) return normalizeCategory(selectedCategory);

        const response = await apiCall(API_ENDPOINTS.USER.TICKETS.List, 'GET', undefined, token);
        const tickets: SupportTicket[] = extractTicketsFromResponse(response);
        const latestCategory = pickLatestCategory(tickets);
        if (latestCategory) {
            await applyCategory(latestCategory);
        }
        return latestCategory;
    };

    const sendMessage = async () => {
        const text = message.trim();
        const image = attachedImage;
        if ((!text && !image) || isSending) return;

        let category = normalizeCategory(selectedCategory);
        if (!category) {
            try {
                const token = await SecureStore.getItemAsync('auth_token');
                if (token) {
                    category = await resolveCategoryForSend(token);
                }
            } catch (error) {
                console.error('Failed to resolve support category:', error);
            }
        }

        if (!category) {
            Alert.alert('Select Category', 'Please select a support category before sending your message.');
            return;
        }

        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const batchId = Date.now().toString();

        // The server keeps text and image as separate lines, so mirror that locally.
        const optimistic: Message[] = [];
        if (text) {
            optimistic.push({ id: `${batchId}_text`, text, isUser: true, timestamp, pending: true });
        }
        if (image) {
            optimistic.push({
                id: `${batchId}_image`,
                text: 'Photo',
                imageUrl: image.uri,
                isUser: true,
                timestamp,
                pending: true,
            });
        }

        const previousMessages = messages;
        await updateMessages([...previousMessages, ...optimistic]);

        setMessage('');
        setAttachedImage(null);
        setIsSending(true);

        const buildBody = (fields: Record<string, string>) => {
            if (!image) return fields;

            const form = new FormData();
            Object.entries(fields).forEach(([key, value]) => form.append(key, value));
            form.append('attachment', {
                uri: image.uri,
                name: image.name,
                type: image.type,
            } as any);
            return form;
        };

        try {
            const token = await SecureStore.getItemAsync('auth_token');
            if (!token) {
                throw new Error('No auth token found');
            }

            const ticketListResponse = await apiCall(API_ENDPOINTS.USER.TICKETS.List, 'GET', undefined, token);
            const existingTickets: SupportTicket[] = extractTicketsFromResponse(ticketListResponse);

            const reusableTicket = existingTickets.find((ticket) => {
                const subject = normalizeCategory(ticket.subject || '');
                const status = String((ticket as any)?.status || '').toLowerCase();
                return subject === category && (status === 'open' || status === 'pending');
            });

            if (reusableTicket?.id) {
                await apiCall(
                    API_ENDPOINTS.USER.TICKETS.AddMessage(Number(reusableTicket.id)),
                    'POST',
                    buildBody(text ? { message: text } : {}),
                    token
                );
            } else {
                await apiCall(
                    API_ENDPOINTS.USER.TICKETS.Create,
                    'POST',
                    buildBody({ subject: category, ...(text ? { message: text } : {}) }),
                    token
                );
            }
            await syncMessagesFromServer();
        } catch (error: any) {
            console.error('Failed to send support ticket:', error);
            // Drop the optimistic bubbles and hand the content back so the user can retry.
            await updateMessages(previousMessages);
            setMessage((current) => current || text);
            setAttachedImage((current) => current || image);
            Alert.alert('Send Failed', error?.message || 'Failed to send support message. Please try again.');
        } finally {
            setIsSending(false);
        }
    };

    const color = {
        background: dark ? '#181818' : '#fff',
        surface: dark ? '#232323' : '#f8f9fa',
        border: dark ? '#232323' : '#e0e0e0',
        text: dark ? '#fff' : '#181818',
        textSecondary: dark ? '#b0b0b0' : '#6c6c6c',
        primary: '#C61F3A',
        success: '#4CD964',
    };
    const handlePickImage = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permission required', 'Permission to access media library is required!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (result.canceled || !result.assets?.length) return;

        const asset = result.assets[0];
        if (asset.fileSize && asset.fileSize > MAX_ATTACHMENT_BYTES) {
            Alert.alert('Image too large', 'Please attach an image smaller than 10MB.');
            return;
        }

        const type = asset.mimeType || 'image/jpeg';
        const extension = type.split('/')[1] || 'jpg';

        setAttachedImage({
            uri: asset.uri,
            name: asset.fileName || `support_${Date.now()}.${extension}`,
            type,
        });
    };

    const canSend = Boolean(message.trim() || attachedImage) && !isSending;

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: color.background,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: color.background,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: color.border,
        },
        backButton: {
            marginRight: 12,
            padding: 4,
        },
        avatar: {
            width: 40,
            height: 40,
            borderRadius: 20,
            marginRight: 12,
        },
        headerInfo: {
            flex: 1,
        },
        headerTitle: {
            fontSize: 18,
            fontWeight: '600',
            color: color.text,
        },
        headerStatus: {
            fontSize: 14,
            color: color.success,
            marginTop: 2,
        },
        categorySelector: {
            margin: 16,
            padding: 16,
            backgroundColor: dark ? color.surface : '#f8f9fa',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: color.border,
        },
        categorySelectorText: {
            fontSize: 16,
            color: color.textSecondary,
        },
        categoryDropdownIcon: {
            position: 'absolute',
            right: 16,
            top: 18,
        },
        messagesContainer: {
            flex: 1,
            paddingHorizontal: 16,
        },
        messageContainer: {
            flexDirection: 'row',
            marginVertical: 8,
            alignItems: 'flex-end',
        },
        messageContainerUser: {
            justifyContent: 'flex-end',
        },
        messageAvatar: {
            width: 32,
            height: 32,
            borderRadius: 16,
            marginRight: 8,
        },
        messageBubble: {
            maxWidth: '75%',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 20,
        },
        messageBubbleUser: {
            backgroundColor: '#C61F3A',
            borderBottomRightRadius: 6,
        },
        messageBubbleAgent: {
            backgroundColor: dark ? '#38383A' : '#E5E5EA',
            borderBottomLeftRadius: 6,
        },
        messageBubbleImage: {
            padding: 4,
            overflow: 'hidden',
        },
        messageBubblePending: {
            opacity: 0.6,
        },
        messageImage: {
            width: 200,
            height: 200,
            borderRadius: 12,
            backgroundColor: dark ? '#2a2a2a' : '#e5e5ea',
        },
        messageText: {
            fontSize: 16,
            lineHeight: 20,
        },
        messageTextUser: {
            color: '#ffffff',
        },
        messageTextAgent: {
            color: dark ? '#ffffff' : '#000000',
        },
        timestamp: {
            textAlign: 'center',
            fontSize: 12,
            color: color.textSecondary,
            marginVertical: 16,
        },
        inputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingTop: 12,
            backgroundColor: color.background,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: color.border,
        },
        attachPreview: {
            paddingHorizontal: 16,
            paddingTop: 8,
            backgroundColor: color.background,
        },
        attachPreviewBox: {
            width: 72,
            height: 72,
            borderRadius: 10,
            overflow: 'hidden',
        },
        attachPreviewImg: {
            width: '100%',
            height: '100%',
        },
        attachRemove: {
            position: 'absolute',
            top: 4,
            right: 4,
            backgroundColor: 'rgba(0,0,0,0.6)',
            borderRadius: 10,
            width: 20,
            height: 20,
            alignItems: 'center',
            justifyContent: 'center',
        },
        textInput: {
            backgroundColor: dark ? color.surface : '#f0f0f0',
            flex: 1,
            borderRadius: 24,
            paddingHorizontal: 16,
            paddingVertical: 12,
            fontSize: 16,
            color: color.text,
            marginRight: 8,
            maxHeight: 100,
        },
        sendButton: {
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: BRAND_PRIMARY,
        },
        sendButtonDisabled: {
            backgroundColor: dark ? '#444' : '#CCCCCC',
        },
        iconButton: {
            padding: 8,
            marginRight: 4,
        },
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-end',
        },
        modalContainer: {
            backgroundColor: color.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingTop: 20,
            paddingBottom: 40,
            maxHeight: '50%',
        },
        modalHeader: {
            fontSize: 20,
            fontWeight: '600',
            color: color.text,
            textAlign: 'center',
            marginBottom: 24,
        },
        categoryOption: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 24,
            paddingVertical: 16,
        },
        categoryOptionText: {
            fontSize: 18,
            color: color.text,
        },
        radioButton: {
            width: 20,
            height: 20,
            borderRadius: 10,
            borderWidth: 2,
            borderColor: color.border,
            alignItems: 'center',
            justifyContent: 'center',
        },
        radioButtonSelected: {
            borderColor: '#C61F3A',
        },
        radioButtonInner: {
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: '#C61F3A',
        },
    });

    const renderMessage = (msg: Message) => {
        const isFirstMessage = msg.id === '1';

        return (
            <View key={msg.id}>
                {isFirstMessage && (
                    <Text style={styles.timestamp}>{msg.timestamp}</Text>
                )}
                <View style={[
                    styles.messageContainer,
                    msg.isUser && styles.messageContainerUser
                ]}>
                    {!msg.isUser && msg.avatar && (
                        <Image source={{ uri: msg.avatar }} style={styles.messageAvatar} />
                    )}
                    <View style={[
                        styles.messageBubble,
                        msg.isUser ? styles.messageBubbleUser : styles.messageBubbleAgent,
                        msg.imageUrl && styles.messageBubbleImage,
                        msg.pending && styles.messageBubblePending,
                    ]}>
                        {msg.imageUrl ? (
                            <Image
                                source={{ uri: msg.imageUrl }}
                                style={styles.messageImage}
                                resizeMode="cover"
                            />
                        ) : (
                            <Text style={[
                                styles.messageText,
                                msg.isUser ? styles.messageTextUser : styles.messageTextAgent
                            ]}>
                                {msg.text}
                            </Text>
                        )}
                    </View>

                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="chevron-back" size={24} color={color.text} />
                    </TouchableOpacity>

                    <View style={[styles.avatar, { backgroundColor: BRAND_PRIMARY, alignItems: 'center', justifyContent: 'center' }]}>
                        <Ionicons name="headset" size={22} color="#fff" />
                    </View>

                    <View style={styles.headerInfo}>
                        <Text style={styles.headerTitle}>Support</Text>
                        <Text style={styles.headerStatus}>Online</Text>
                    </View>
                </View>

                {/* Category Selector */}
                <TouchableOpacity
                    style={styles.categorySelector}
                    onPress={() => setShowCategoryModal(true)}
                >
                    <Text style={styles.categorySelectorText}>
                        {selectedCategory || 'I need support regarding'}
                    </Text>
                    <Ionicons
                        name="chevron-down"
                        size={20}
                        color={color.textSecondary}
                        style={styles.categoryDropdownIcon}
                    />
                </TouchableOpacity>

                {/* Messages */}
                <ScrollView
                    ref={scrollRef}
                    style={styles.messagesContainer}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
                >
                    {isSyncing && (
                        <Text style={[styles.timestamp, { marginTop: 8 }]}>Syncing support messages...</Text>
                    )}
                    {messages.map(renderMessage)}
                </ScrollView>

                {attachedImage ? (
                    <View style={styles.attachPreview}>
                        <View style={styles.attachPreviewBox}>
                            <Image source={{ uri: attachedImage.uri }} style={styles.attachPreviewImg} />
                            <TouchableOpacity
                                style={styles.attachRemove}
                                onPress={() => setAttachedImage(null)}
                            >
                                <Ionicons name="close" size={12} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : null}

                {/* Input */}
                <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={handlePickImage}
                        disabled={isSending}
                    >
                        <Ionicons name="image" size={24} color={isSending ? color.textSecondary : color.text} />
                    </TouchableOpacity>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Type a message"
                        placeholderTextColor={color.textSecondary}
                        value={message}
                        onChangeText={setMessage}
                        multiline
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
                        onPress={sendMessage}
                        disabled={!canSend}
                    >
                        {isSending ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Feather name="send" size={18} color="#fff" />
                        )}
                    </TouchableOpacity>
                </View>


                {/* Category Selection Modal */}
                <Modal
                    visible={showCategoryModal}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowCategoryModal(false)}
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setShowCategoryModal(false)}
                    >
                        <View style={styles.modalContainer}>
                            <Text style={styles.modalHeader}>Support Categories</Text>
                            {supportCategories.map((category) => (
                                <TouchableOpacity
                                    key={category}
                                    style={styles.categoryOption}
                                   onPress={() => {
  void applyCategory(category);
  setShowCategoryModal(false);

  // Only show agent welcome message if it's not already added
  const hasWelcome = messages.some(msg => msg.id === 'agent_welcome');
  if (!hasWelcome) {
    const agentMsg: Message = {
      id: 'agent_welcome',
      text: 'An agent will be with you shortly',
      isUser: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    void updateMessages([...messages, agentMsg]);
  }
}}

                                >
                                    <Text style={styles.categoryOptionText}>{category}</Text>
                                    <View style={[
                                        styles.radioButton,
                                        selectedCategory === category && styles.radioButtonSelected
                                    ]}>
                                        {selectedCategory === category && (
                                            <View style={styles.radioButtonInner} />
                                        )}
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </TouchableOpacity>
                </Modal>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}