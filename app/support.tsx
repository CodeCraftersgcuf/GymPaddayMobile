import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Modal,
    Image,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/themeContext';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { apiCall } from '@/utils/customApiCall';
import { API_ENDPOINTS } from '@/apiConfig';

interface Message {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: string;
    avatar?: string;
    imageUrl?: string; // ✅ add this

}

interface SupportTicket {
    id: string | number;
    subject?: string;
    message?: string;
    description?: string;
    admin_reply?: string | null;
    created_at?: string;
    updated_at?: string;
}

const supportCategories = [
    'General',
    'Socials',
    'Connect',
    'Market',
    'Gym Hub',
];

export default function SupportScreen() {
    const { dark } = useTheme();
    const [selectedCategory, setSelectedCategory] = useState('');
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [storageKey, setStorageKey] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    const extractTicketsFromResponse = (response: any): SupportTicket[] => {
        if (Array.isArray(response)) return response;
        if (Array.isArray(response?.tickets)) return response.tickets;
        if (Array.isArray(response?.data)) return response.data;
        if (Array.isArray(response?.data?.tickets)) return response.data.tickets;
        return [];
    };

    const normalizeCategory = (category: string = '') => {
        const lower = category.toLowerCase();
        if (lower.includes('social')) return 'Socials';
        if (lower.includes('connect')) return 'Connect';
        if (lower.includes('market')) return 'Market';
        if (lower.includes('gym')) return 'Gym Hub';
        return 'General';
    };

    const mapTicketsToMessages = (tickets: SupportTicket[]): { messages: Message[]; latestCategory: string } => {
        const flattened: Array<{ dateKey: number; message: Message }> = [];
        let latestCategory = '';
        let latestCreatedAt = 0;

        tickets.forEach((ticket) => {
            const createdAt = ticket.created_at ? new Date(ticket.created_at).getTime() : Date.now();
            const updatedAt = ticket.updated_at ? new Date(ticket.updated_at).getTime() : createdAt;
            const userText = ticket.message || ticket.description || '';
            const category = normalizeCategory(ticket.subject || '');

            if (!latestCategory || createdAt > latestCreatedAt) {
                latestCategory = category;
                latestCreatedAt = createdAt;
            }

            if (userText.trim()) {
                // Split messages that were concatenated with \n back into individual bubbles
                const lines = userText.split('\n').filter((l) => l.trim());
                (lines.length ? lines : [userText]).forEach((line, idx) => {
                    if (!line.trim()) return;
                    flattened.push({
                        dateKey: createdAt + idx,
                        message: {
                            id: `ticket_user_${ticket.id}_${idx}`,
                            text: line.trim(),
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
                        avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
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
                setSelectedCategory((prev) => prev || latestCategory);
            }
        } catch (error) {
            console.error('Failed to sync support tickets:', error);
        } finally {
            setIsSyncing(false);
        }
    }, [storageKey]);

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

    const sendMessage = async () => {
        if (message.trim()) {
            if (!selectedCategory) {
                Alert.alert('Select Category', 'Please select a support category before sending your message.');
                return;
            }

            const newMessage: Message = {
                id: Date.now().toString(),
                text: message,
                isUser: true,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            await updateMessages([...messages, newMessage]);

            const outgoingMessage = message;
            setMessage('');

            try {
                const token = await SecureStore.getItemAsync('auth_token');
                if (!token) {
                    throw new Error('No auth token found');
                }

                // Reuse latest open/pending ticket in the same category
                // so the same support topic stays in one thread.
                const ticketListResponse = await apiCall(API_ENDPOINTS.USER.TICKETS.List, 'GET', undefined, token);
                const existingTickets: SupportTicket[] = extractTicketsFromResponse(ticketListResponse);

                const reusableTicket = existingTickets.find((ticket) => {
                    const subject = normalizeCategory(ticket.subject || '');
                    const status = String((ticket as any)?.status || '').toLowerCase();
                    return subject === selectedCategory && (status === 'open' || status === 'pending');
                });

                if (reusableTicket?.id) {
                    const previousText = (reusableTicket.message || reusableTicket.description || '').trim();
                    const mergedMessage = previousText
                        ? `${previousText}\n${outgoingMessage}`
                        : outgoingMessage;

                    await apiCall(
                        API_ENDPOINTS.USER.TICKETS.Update(Number(reusableTicket.id)),
                        'PUT',
                        { message: mergedMessage },
                        token
                    );
                } else {
                    await apiCall(
                        API_ENDPOINTS.USER.TICKETS.Create,
                        'POST',
                        {
                            subject: selectedCategory,
                            message: outgoingMessage,
                        },
                        token
                    );
                }
                await syncMessagesFromServer();
            } catch (error: any) {
                console.error('Failed to send support ticket:', error);
                Alert.alert('Send Failed', error?.message || 'Failed to send support message. Please try again.');
            }
        }
    };

    const color = {
        background: dark ? '#181818' : '#fff',
        surface: dark ? '#232323' : '#f8f9fa',
        border: dark ? '#232323' : '#e0e0e0',
        text: dark ? '#fff' : '#181818',
        textSecondary: dark ? '#b0b0b0' : '#6c6c6c',
        primary: '#FF3B30',
        success: '#4CD964',
    };
    const handlePickImage = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            alert('Permission to access media library is required!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled && result.assets?.length > 0) {
            const newMessage: Message = {
                id: Date.now().toString(),
                text: '',
                imageUrl: result.assets[0].uri,
                isUser: true,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            await updateMessages([...messages, newMessage]);
        }
    };

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
            backgroundColor: '#FF3B30',
            borderBottomRightRadius: 6,
        },
        messageBubbleAgent: {
            backgroundColor: dark ? '#38383A' : '#E5E5EA',
            borderBottomLeftRadius: 6,
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
            paddingVertical: 12,
            backgroundColor: color.background,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: color.border,
        },
        textInput: {
            backgroundColor: dark ? color.surface : '#f0f0f0',
            flex: 1,
            borderRadius: 24,
            paddingHorizontal: 16,
            paddingVertical: 12,
            fontSize: 16,
            color: color.text,
            marginRight: 12,
            maxHeight: 100,
            paddingRight: 24
        },
        sendButton: {
            padding: 8,
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
            borderColor: '#FF3B30',
        },
        radioButtonInner: {
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: '#FF3B30',
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
                        msg.isUser ? styles.messageBubbleUser : styles.messageBubbleAgent
                    ]}>
                        {msg.imageUrl ? (
                            <Image
                                source={{ uri: msg.imageUrl }}
                                style={{ width: 200, height: 200, borderRadius: 12 }}
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
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="chevron-back" size={24} color={color.text} />
                    </TouchableOpacity>

                    <Image
                        source={{ uri: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2' }}
                        style={styles.avatar}
                    />

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
                <ScrollView style={styles.messagesContainer} showsVerticalScrollIndicator={false}>
                    {isSyncing && (
                        <Text style={[styles.timestamp, { marginTop: 8 }]}>Syncing support messages...</Text>
                    )}
                    {messages.map(renderMessage)}
                </ScrollView>

                {/* Input */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Type a message"
                        placeholderTextColor={color.textSecondary}
                        value={message}
                        onChangeText={setMessage}
                        multiline
                    />
                    <TouchableOpacity
                        style={styles.sendButton}
                        onPress={handlePickImage}
                    >
                        <Ionicons name="image" size={24} color={dark ? 'white' : 'black'} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
                        <Feather name="send" size={24} color={dark ? 'white' : 'black'} />
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
  setSelectedCategory(category);
  setShowCategoryModal(false);

  // Only show agent welcome message if it's not already added
  const hasWelcome = messages.some(msg => msg.id === 'agent_welcome');
  if (!hasWelcome) {
    const agentMsg: Message = {
      id: 'agent_welcome',
      text: 'An agent will be with you shortly',
      isUser: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
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