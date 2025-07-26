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
} from 'react-native';
import { useEffect, useState } from 'react';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/themeContext';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Message {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: string;
    avatar?: string;
    imageUrl?: string; // ✅ add this

}

const supportCategories = [
    'General',
    'Socials',
    'Connect',
    'Marketplace',
    'Gym Hub',
];

export default function SupportScreen() {
    const { dark } = useTheme();
    const [selectedCategory, setSelectedCategory] = useState('');
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);


useEffect(() => {
  (async () => {
    const stored = await AsyncStorage.getItem('supportMessages');
    if (stored) {
      setMessages(JSON.parse(stored));
    }
  })();
}, []);
    const updateMessages = (updatedMessages: Message[]) => {
        setMessages(updatedMessages);
        AsyncStorage.setItem('supportMessages', JSON.stringify(updatedMessages));
    };

    const sendMessage = () => {
        if (message.trim()) {
            const newMessage: Message = {
                id: Date.now().toString(),
                text: message,
                isUser: true,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            updateMessages([...messages, newMessage]);
            setMessage('');
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
                imageUrl: result.assets[0].uri,
                isUser: true,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            updateMessages([...messages, newMessage]);
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
    updateMessages([...messages, agentMsg]);
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