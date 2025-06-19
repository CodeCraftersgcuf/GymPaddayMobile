export interface User {
    id: string;
    username: string;
    profile_img: string;
    online?: boolean;
    followers?: number;
    posts?: number;
  }
  
  export interface Message {
    id: string;
    senderId: string;
    receiverId: string;
    text: string;
    timestamp: Date;
    read: boolean;
  }
  
  export interface Conversation {
    id: string;
    user: User;
    lastMessage: Message;
    unreadCount: number;
  }
// User profile images from Pexels
export const mockUsers: User[] = [
  {
    id: '1',
    username: 'You',
    profile_img: 'https://randomuser.me/api/portraits/men/32.jpg',
    online: true,
    followers: 1200,
    posts: 45
  },
  {
    id: '2',
    username: 'Christopher',
    profile_img: 'https://randomuser.me/api/portraits/men/52.jpg',
    online: true,
    followers: 1500,
    posts: 70
  },
  {
    id: '3',
    username: 'Adam',
    profile_img: 'https://randomuser.me/api/portraits/men/52.jpg',
    online: true,
    followers: 800,
    posts: 30
  },
  {
    id: '4',
    username: 'Alex',
    profile_img: 'https://randomuser.me/api/portraits/men/52.jpg',
    online: false,
    followers: 2000,
    posts: 90
  },
  {
    id: '5',
    username: 'Cassandra',
    profile_img: 'https://randomuser.me/api/portraits/women/65.jpg',
    online: false,
    followers: 3500,
    posts: 120
  },
  {
    id: '6',
    username: 'Halima',
    profile_img: 'https://randomuser.me/api/portraits/women/79.jpg',
    online: false,
    followers: 1700,
    posts: 60
  },
  {
    id: '7',
    username: 'Halima',
    profile_img: 'https://randomuser.me/api/portraits/women/79.jpg',
    online: false,
    followers: 900,
    posts: 25
  }
];

export const generateDummyConversations = () => {
  const conversations: Conversation[] = [];
  const messagesMap: Record<string, Message[]> = {};

  // Generate conversations with the most recent messages
  mockUsers.slice(1).forEach((user, index) => {
    const conversationId = `conv-1-${user.id}`;
    const timeOffset = index * 5; // minutes ago
    
    const now = new Date();
    const messageTime = new Date(now.getTime() - timeOffset * 60000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60000);
    
    const messages: Message[] = [
      {
        id: `msg-1-${user.id}-1`,
        senderId: user.id,
        receiverId: '1',
        text: 'Hello brother',
        timestamp: yesterday,
        read: true,
      },
      {
        id: `msg-1-${user.id}-2`,
        senderId: '1',
        receiverId: user.id,
        text: 'How are you doing brother',
        timestamp: yesterday,
        read: true,
      },
      {
        id: `msg-1-${user.id}-3`,
        senderId: user.id,
        receiverId: '1',
        text: 'It is nice hearing from you after a while now',
        timestamp: yesterday,
        read: true,
      },
      {
        id: `msg-1-${user.id}-4`,
        senderId: '1',
        receiverId: user.id,
        text: 'Yeah that is great, i have been pretty occupied these past few weeks',
        timestamp: messageTime,
        read: true,
      }
    ];
    
    // Only create conversations for the first few users to match the mockup
    if (index < 3) {
      const lastMessage: Message = {
        id: `msg-last-${user.id}`,
        senderId: user.id,
        receiverId: '1',
        text: 'Hello bro, how are you doing, i appreciate what you are doing out there, keep it up.',
        timestamp: messageTime,
        read: true,
      };
      
      conversations.push({
        id: conversationId,
        user,
        lastMessage,
        unreadCount: 0,
      });
      
      messagesMap[conversationId] = [...messages, lastMessage];
    } else {
      messagesMap[conversationId] = messages;
    }
  });

  return { conversations, messages: messagesMap };
};