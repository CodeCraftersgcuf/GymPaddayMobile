import { MEDIA_CDN_URL } from '@/apiConfig';

// Curated music list for stories — preview clips hosted on GymPaddy CDN.
export interface StoryMusic {
  id: string;
  title: string;
  artist: string;
  preview: string;
  duration: number;
  cover?: string;
  genre?: string;
}

const storyMusicPreview = (id: string) => `${MEDIA_CDN_URL}/story-music/${id}.mp3`;

export const STORY_MUSIC_LIBRARY: StoryMusic[] = [
  {
    id: '1',
    title: 'Power Pulse',
    artist: 'GymPaddy Audio',
    preview: storyMusicPreview('1'),
    duration: 15,
    genre: 'Workout',
  },
  {
    id: '2',
    title: 'Morning Drive',
    artist: 'GymPaddy Audio',
    preview: storyMusicPreview('2'),
    duration: 15,
    genre: 'Pop',
  },
  {
    id: '3',
    title: 'Deep Focus',
    artist: 'GymPaddy Audio',
    preview: storyMusicPreview('3'),
    duration: 15,
    genre: 'Chill',
  },
  {
    id: '4',
    title: 'Night Runner',
    artist: 'GymPaddy Audio',
    preview: storyMusicPreview('4'),
    duration: 15,
    genre: 'Dance',
  },
  {
    id: '5',
    title: 'Lift Off',
    artist: 'GymPaddy Audio',
    preview: storyMusicPreview('5'),
    duration: 15,
    genre: 'Workout',
  },
  {
    id: '6',
    title: 'Sunset Groove',
    artist: 'GymPaddy Audio',
    preview: storyMusicPreview('6'),
    duration: 15,
    genre: 'Afrobeat',
  },
  {
    id: '7',
    title: 'City Lights',
    artist: 'GymPaddy Audio',
    preview: storyMusicPreview('7'),
    duration: 15,
    genre: 'Pop',
  },
  {
    id: '8',
    title: 'Steady Grind',
    artist: 'GymPaddy Audio',
    preview: storyMusicPreview('8'),
    duration: 15,
    genre: 'Hip-Hop',
  },
  {
    id: '9',
    title: 'Ocean Breeze',
    artist: 'GymPaddy Audio',
    preview: storyMusicPreview('9'),
    duration: 15,
    genre: 'Chill',
  },
  {
    id: '10',
    title: 'Fire Step',
    artist: 'GymPaddy Audio',
    preview: storyMusicPreview('10'),
    duration: 15,
    genre: 'Dance',
  },
];

export const MUSIC_CATEGORIES = [
  { id: 'all', name: '🎵 All', icon: '🎵' },
  { id: 'workout', name: '💪 Workout', icon: '💪' },
  { id: 'trending', name: '🔥 Trending', icon: '🔥' },
  { id: 'chill', name: '😌 Chill', icon: '😌' },
  { id: 'dance', name: '💃 Dance', icon: '💃' },
  { id: 'afrobeat', name: '🎶 Afrobeat', icon: '🎶' },
];

export const getMusicByGenre = (genre: string, library: StoryMusic[] = STORY_MUSIC_LIBRARY): StoryMusic[] => {
  if (genre === 'all') return library;

  const genreMap: Record<string, string[]> = {
    workout: ['Workout', 'Rock', 'Hip-Hop'],
    trending: ['Pop'],
    chill: ['Pop', 'R&B', 'Chill'],
    dance: ['Dance'],
    afrobeat: ['Afrobeat'],
  };

  const genres = genreMap[genre] || [];
  return library.filter((music) => genres.includes(music.genre || ''));
};
