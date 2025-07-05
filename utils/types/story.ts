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
  full_media_url: string;
  created_at: string;
  expires_at: string;
  user: User;
}

export interface GroupedUserStories {
  user: User;
  stories: StoryItem[];
}
