export interface User {
  id: number;
  username: string;
  fullname: string;
  email: string;
  profile_picture_url: string;
}

export interface StoryItem {
  id: number;
  user_id: number;
  media_url: string;
  media_type: 'photo' | 'video';
  caption: string | null;
  full_media_url: string | null;
  full_thumbnail_url?: string | null;
  processing_status?: 'pending' | 'processing' | 'ready' | 'failed';
  viewed_by_me?: boolean;
  is_followed?: boolean;
  music_url?: string | null;
  music_title?: string | null;
  music_artist?: string | null;
  created_at: string;
  expires_at: string;
  user: User;
}

export interface GroupedUserStories {
  user: User;
  stories: StoryItem[];
}
