// Curated music list for stories
export interface StoryMusic {
  id: string;
  title: string;
  artist: string;
  preview: string;
  duration: number; // in seconds
  cover?: string;
  genre?: string;
}

// Comprehensive music library for stories (can be updated from backend)
export const STORY_MUSIC_LIBRARY: StoryMusic[] = [
  // Workout/Gym Motivation
  {
    id: '1',
    title: 'Eye of the Tiger',
    artist: 'Survivor',
    preview: 'https://cdns-preview-d.dzcdn.net/stream/c-d77e23e0c8ed7567a60b0f36b314c0ae-4.mp3',
    duration: 15,
    genre: 'Rock',
  },
  {
    id: '2',
    title: 'Till I Collapse',
    artist: 'Eminem',
    preview: 'https://cdns-preview-1.dzcdn.net/stream/c-1ff5ecfb8b5f8c9c17f3e57a1c2a35fc-4.mp3',
    duration: 15,
    genre: 'Hip-Hop',
  },
  {
    id: '3',
    title: 'Thunderstruck',
    artist: 'AC/DC',
    preview: 'https://cdns-preview-8.dzcdn.net/stream/c-8d1e5f1e5c2e5f1e5c2e5f1e5c2e5f1e-4.mp3',
    duration: 15,
    genre: 'Rock',
  },
  {
    id: '4',
    title: "Lose Yourself",
    artist: 'Eminem',
    preview: 'https://cdns-preview-0.dzcdn.net/stream/c-0a7e9d4e4c4e7d4e4c4e7d4e4c4e7d4e-4.mp3',
    duration: 15,
    genre: 'Hip-Hop',
  },
  {
    id: '5',
    title: 'Stronger',
    artist: 'Kanye West',
    preview: 'https://cdns-preview-2.dzcdn.net/stream/c-2b8f0e5f5d5f0e5f5d5f0e5f5d5f0e5f-4.mp3',
    duration: 15,
    genre: 'Hip-Hop',
  },
  // Trending/Popular
  {
    id: '6',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    preview: 'https://cdns-preview-4.dzcdn.net/stream/c-4d9f1f6f6e6f1f6f6e6f1f6f6e6f1f6f-4.mp3',
    duration: 15,
    genre: 'Pop',
  },
  {
    id: '7',
    title: 'Levitating',
    artist: 'Dua Lipa',
    preview: 'https://cdns-preview-7.dzcdn.net/stream/c-7e0f2f7f7f7f2f7f7f7f2f7f7f7f2f7f-4.mp3',
    duration: 15,
    genre: 'Pop',
  },
  {
    id: '8',
    title: 'Save Your Tears',
    artist: 'The Weeknd',
    preview: 'https://cdns-preview-9.dzcdn.net/stream/c-9f1f3f8f8f8f3f8f8f8f3f8f8f8f3f8f-4.mp3',
    duration: 15,
    genre: 'Pop',
  },
  // Chill/Relax
  {
    id: '9',
    title: 'Sunflower',
    artist: 'Post Malone',
    preview: 'https://cdns-preview-1.dzcdn.net/stream/c-1a2f4f9f9f9f4f9f9f9f4f9f9f9f4f9f-4.mp3',
    duration: 15,
    genre: 'Pop',
  },
  {
    id: '10',
    title: 'Good Days',
    artist: 'SZA',
    preview: 'https://cdns-preview-3.dzcdn.net/stream/c-3b3f5f0f0f0f5f0f0f0f5f0f0f0f5f0f-4.mp3',
    duration: 15,
    genre: 'R&B',
  },
  // Energetic/Dance
  {
    id: '11',
    title: 'Pump It',
    artist: 'Black Eyed Peas',
    preview: 'https://cdns-preview-5.dzcdn.net/stream/c-5c4f6f1f1f1f6f1f1f1f6f1f1f1f6f1f-4.mp3',
    duration: 15,
    genre: 'Dance',
  },
  {
    id: '12',
    title: 'Titanium',
    artist: 'David Guetta ft. Sia',
    preview: 'https://cdns-preview-6.dzcdn.net/stream/c-6d5f7f2f2f2f7f2f2f2f7f2f2f2f7f2f-4.mp3',
    duration: 15,
    genre: 'Dance',
  },
  // Afrobeat (Nigeria audience)
  {
    id: '13',
    title: 'Last Last',
    artist: 'Burna Boy',
    preview: 'https://cdns-preview-8.dzcdn.net/stream/c-8e6f8f3f3f3f8f3f3f3f8f3f3f3f8f3f-4.mp3',
    duration: 15,
    genre: 'Afrobeat',
  },
  {
    id: '14',
    title: 'Calm Down',
    artist: 'Rema',
    preview: 'https://cdns-preview-0.dzcdn.net/stream/c-0f7f9f4f4f4f9f4f4f4f9f4f4f4f9f4f-4.mp3',
    duration: 15,
    genre: 'Afrobeat',
  },
  {
    id: '15',
    title: 'Peru',
    artist: 'Fireboy DML',
    preview: 'https://cdns-preview-2.dzcdn.net/stream/c-2g8f0f5f5f5f0f5f5f5f0f5f5f5f0f5f-4.mp3',
    duration: 15,
    genre: 'Afrobeat',
  },
];

// Music categories for easy filtering
export const MUSIC_CATEGORIES = [
  { id: 'all', name: '🎵 All', icon: '🎵' },
  { id: 'workout', name: '💪 Workout', icon: '💪' },
  { id: 'trending', name: '🔥 Trending', icon: '🔥' },
  { id: 'chill', name: '😌 Chill', icon: '😌' },
  { id: 'dance', name: '💃 Dance', icon: '💃' },
  { id: 'afrobeat', name: '🎶 Afrobeat', icon: '🎶' },
];

// Helper function to get music by category
export const getMusicByGenre = (genre: string): StoryMusic[] => {
  if (genre === 'all') return STORY_MUSIC_LIBRARY;
  
  const genreMap: Record<string, string[]> = {
    workout: ['Rock', 'Hip-Hop'],
    trending: ['Pop'],
    chill: ['Pop', 'R&B'],
    dance: ['Dance'],
    afrobeat: ['Afrobeat'],
  };

  const genres = genreMap[genre] || [];
  return STORY_MUSIC_LIBRARY.filter((music) => genres.includes(music.genre || ''));
};



