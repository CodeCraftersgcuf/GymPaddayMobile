import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { mockUsers, generateDummyConversations ,User, Message, Conversation} from '../../constants/data';

interface MessageContextType {
  users: User[];
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  currentUserId: string;
  sendMessage: (recipientId: string, text: string) => void;
  getMessagesForConversation: (conversationId: string) => Message[];
  getUser: (userId: string) => User | undefined;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const MessageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const currentUserId = '1'; // Current user is always user 1 for this example

  useEffect(() => {
    // Initialize conversations and messages with mock data
    const { conversations: mockConversations, messages: mockMessages } = generateDummyConversations();
    setConversations(mockConversations);
    setMessages(mockMessages);
  }, []);

  const sendMessage = (recipientId: string, text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUserId,
      receiverId: recipientId,
      text,
      timestamp: new Date(),
      read: false,
    };

    // Find the conversation or create a new one
    const existingConversationIndex = conversations.findIndex(
      (c) => c.user.id === recipientId
    );

    const updatedConversations = [...conversations];
    const updatedMessages = { ...messages };

    if (existingConversationIndex !== -1) {
      // Update existing conversation
      updatedConversations[existingConversationIndex] = {
        ...updatedConversations[existingConversationIndex],
        lastMessage: newMessage,
      };

      // Add message to conversation
      const conversationId = updatedConversations[existingConversationIndex].id;
      updatedMessages[conversationId] = [
        ...(updatedMessages[conversationId] || []),
        newMessage,
      ];
    } else {
      // Create new conversation
      const user = users.find((u) => u.id === recipientId);
      if (user) {
        const newConversation: Conversation = {
          id: `conv-${currentUserId}-${recipientId}`,
          user,
          lastMessage: newMessage,
          unreadCount: 0,
        };
        updatedConversations.unshift(newConversation);
        updatedMessages[newConversation.id] = [newMessage];
      }
    }

    setConversations(updatedConversations);
    setMessages(updatedMessages);

    // Generate a dummy response after a small delay
    setTimeout(() => {
      const dummyResponses = [
        "Hey there! How's it going?",
        "Thanks for the message!",
        "I'll get back to you soon.",
        "Great to hear from you!",
        "What have you been up to lately?",
      ];

      const responseText = dummyResponses[Math.floor(Math.random() * dummyResponses.length)];
      
      const responseMessage: Message = {
        id: (Date.now() + 1).toString(),
        senderId: recipientId,
        receiverId: currentUserId,
        text: responseText,
        timestamp: new Date(),
        read: true,
      };

      const conversationIndex = updatedConversations.findIndex(
        (c) => c.user.id === recipientId
      );

      if (conversationIndex !== -1) {
        const conversation = updatedConversations[conversationIndex];
        updatedConversations[conversationIndex] = {
          ...conversation,
          lastMessage: responseMessage,
        };

        updatedMessages[conversation.id] = [
          ...(updatedMessages[conversation.id] || []),
          responseMessage,
        ];

        setConversations([...updatedConversations]);
        setMessages({ ...updatedMessages });
      }
    }, 1500);
  };

  const getMessagesForConversation = (conversationId: string): Message[] => {
    return messages[conversationId] || [];
  };

  const getUser = (userId: string): User | undefined => {
    return users.find((user) => user.id === userId);
  };

  const value = {
    users,
    conversations,
    messages,
    currentUserId,
    sendMessage,
    getMessagesForConversation,
    getUser,
  };

  return <MessageContext.Provider value={value}>{children}</MessageContext.Provider>;
};

export const useMessages = (): MessageContextType => {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
};