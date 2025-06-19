export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  timestamp: string;
  isRead: boolean;
  type: 'general' | 'promotion' | 'system' | 'social';
}