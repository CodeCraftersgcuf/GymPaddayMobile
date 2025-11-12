# 📖 Story Feature - Developer Usage Guide

## 🚀 Quick Start

### **1. Adding New Music to the Library**

Edit `/constants/storyMusic.ts`:

```typescript
export const STORY_MUSIC_LIBRARY: StoryMusic[] = [
  // ... existing music ...
  {
    id: '16',
    title: 'Your Song Title',
    artist: 'Artist Name',
    preview: 'https://url-to-audio-preview.mp3',
    duration: 15,
    genre: 'Pop',
  },
];
```

### **2. Adding New Music Categories**

```typescript
export const MUSIC_CATEGORIES = [
  // ... existing categories ...
  { 
    id: 'electronic', 
    name: '🎹 Electronic', 
    icon: '🎹' 
  },
];

// Update the genreMap
const genreMap: Record<string, string[]> = {
  // ... existing mappings ...
  electronic: ['Electronic', 'EDM'],
};
```

### **3. Customizing Story Duration**

Edit `/app/UserStoryPreview.tsx`:

```typescript
// Change this constant
const STORY_DURATION = 4000; // in milliseconds

// Options:
// 3000ms = 3 seconds (very fast)
// 4000ms = 4 seconds (current)
// 5000ms = 5 seconds (original)
```

### **4. Adjusting Preload Behavior**

Edit `/app/UserStoryPreview.tsx`:

```typescript
useEffect(() => {
  const preloadStories = async () => {
    // Current: Preloads next 2 stories
    const nextStory = stories[currentIndex + 1];
    const nextNextStory = stories[currentIndex + 2];
    
    // To preload more:
    const story3 = stories[currentIndex + 3];
    // Add preload logic here
  };
  
  preloadStories();
}, [currentIndex, stories]);
```

### **5. Customizing Tap Zone Sizes**

Edit `/app/UserStoryPreview.tsx` styles:

```typescript
leftTapZone: {
  width: '40%',  // Change this percentage
  // Options: 30%, 35%, 40%, 45%
},
rightTapZone: {
  width: '40%',  // Match with left
},
```

---

## 🎨 Theming & Styling

### **Primary Colors**

```typescript
// Brand Red
const PRIMARY_COLOR = '#940304';

// Used in:
// - Upload button
// - Selected music
// - Progress bars
// - Category tabs (active)
```

### **Modal Styling**

```typescript
// Edit modal appearance
musicPickerModal: {
  backgroundColor: '#fff',      // Change modal background
  borderTopLeftRadius: 20,      // Adjust corners
  maxHeight: SCREEN_HEIGHT * 0.8, // Adjust height
  paddingBottom: 20,            // Spacing
}
```

---

## 🔌 API Integration

### **Backend Requirements**

Your API should accept these fields when uploading a story:

```typescript
// POST https://gympaddy.hmstech.xyz/api/user/stories

FormData {
  media: File,           // Required: image or video file
  media_type: string,    // Required: 'photo' or 'video'
  caption: string,       // Optional: story caption
  music_title: string,   // Optional: music track title
  music_url: string,     // Optional: music preview URL
}
```

### **Backend Response Expected**

```typescript
// Success response
{
  status: 'success',
  message: 'Story created successfully',
  data: {
    id: number,
    user_id: number,
    media_url: string,
    media_type: string,
    music_title?: string,
    music_url?: string,
    created_at: string,
  }
}
```

### **Viewing Stories - Expected API Response**

```typescript
// GET https://gympaddy.hmstech.xyz/api/user/get/stories

{
  stories: [
    {
      id: number,
      user: {
        id: number,
        username: string,
        profile_picture_url: string,
      },
      full_media_url: string,
      media_type: 'photo' | 'video',
      music_title?: string,
      music_url?: string,
      created_at: string,
    }
  ],
  my_stories: [...] // Same structure
}
```

---

## 🧪 Testing Scenarios

### **Test Case 1: Add Music to Story**
```
1. Open app → Tap "Add Story"
2. Select an image
3. Tap music icon (🎵)
4. Search "Eye of the Tiger"
5. Tap the song
6. Verify: Music plays & indicator shows
7. Tap "Share to Story"
8. Verify: Upload succeeds with music
```

### **Test Case 2: Fast Navigation**
```
1. View a user's story (with 5+ stories)
2. Tap right edge rapidly
3. Verify: Smooth transitions, no lag
4. Tap left edge to go back
5. Hold screen to pause
6. Release to resume
```

### **Test Case 3: Music Categories**
```
1. Open music picker
2. Tap "Workout" category
3. Verify: Only workout music shown
4. Search "Calm Down"
5. Verify: Afrobeat song appears
6. Select and verify playback
```

---

## 🐛 Troubleshooting

### **Music Not Playing**

```typescript
// Check Audio setup
import { Audio } from 'expo-av';

useEffect(() => {
  Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
  });
}, []);
```

### **Slow Story Transitions**

```typescript
// Verify preloading is working
console.log('Preloading story:', nextStory.id);

// Check if Image.prefetch is succeeding
Image.prefetch(url)
  .then(() => console.log('✅ Preloaded'))
  .catch((e) => console.log('❌ Failed', e));
```

### **Video Not Autoplaying**

```typescript
// Ensure Video component has these props
<Video
  shouldPlay={true}           // ✅ Auto-play
  isMuted={false}            // ✅ With sound
  resizeMode={"cover" as any} // ✅ Full screen
  useNativeControls={false}   // ✅ No controls
/>
```

### **TypeScript Errors**

```typescript
// If you see "never" type errors:
const [sound, setSound] = useState<Audio.Sound | null>(null);

// If you see Record index errors:
const [musicMap, setMusicMap] = useState<Record<number, StoryMusic>>({});
```

---

## 📱 Platform-Specific Notes

### **iOS**
- Works seamlessly
- Audio permissions auto-requested
- WebView loads instantly

### **Android**
- Requires runtime permissions
- WebView may need extra config
- Test on physical device for best results

---

## 🔒 Permissions Required

```json
// app.json
{
  "permissions": [
    "CAMERA",
    "READ_EXTERNAL_STORAGE",
    "WRITE_EXTERNAL_STORAGE"
  ]
}
```

---

## 💡 Pro Tips

1. **Music URLs**: Use CDN URLs for faster loading
2. **Preloading**: Works best on WiFi
3. **Story Duration**: 4s is ideal for engagement
4. **Tap Zones**: 40% width feels most natural
5. **Progress Bars**: Keep thin (2-3px) for elegance

---

## 📊 Analytics Events to Track

```typescript
// Recommended analytics
analytics.logEvent('story_music_added', {
  music_id: selectedMusic.id,
  music_title: selectedMusic.title,
});

analytics.logEvent('story_created', {
  media_type: 'photo' | 'video',
  has_music: boolean,
  music_genre: string,
});

analytics.logEvent('story_viewed', {
  story_id: story.id,
  viewer_id: currentUser.id,
  has_music: boolean,
});

analytics.logEvent('story_navigation', {
  action: 'next' | 'prev' | 'pause',
  story_index: currentIndex,
});
```

---

## 🚀 Performance Optimization Tips

### **1. Image Optimization**
```typescript
// Use compressed images
const optimizedUrl = `${baseUrl}?quality=80&width=1080`;
```

### **2. Video Optimization**
```typescript
// Limit video duration and size
const MAX_VIDEO_DURATION = 30; // seconds
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
```

### **3. Memory Management**
```typescript
// Clean up on unmount
useEffect(() => {
  return () => {
    if (sound) {
      sound.stopAsync();
      sound.unloadAsync();
    }
  };
}, [sound]);
```

---

## 🎓 Learning Resources

- **Expo AV Docs**: https://docs.expo.dev/versions/latest/sdk/av/
- **Expo Image Picker**: https://docs.expo.dev/versions/latest/sdk/imagepicker/
- **React Navigation**: https://reactnavigation.org/
- **TypeScript**: https://www.typescriptlang.org/docs/

---

## 📞 Support

For issues or questions:
1. Check `STORY_IMPROVEMENTS.md` for feature details
2. Review TypeScript types in `/constants/storyMusic.ts`
3. Test with provided music URLs first
4. Check console logs for errors

---

## ✅ Checklist Before Deployment

- [ ] Test music playback on iOS
- [ ] Test music playback on Android
- [ ] Verify preloading works
- [ ] Check story upload with music
- [ ] Test fast navigation (tap rapidly)
- [ ] Test pause/resume functionality
- [ ] Verify memory is properly cleaned up
- [ ] Test with slow network
- [ ] Test with no network (graceful failure)
- [ ] Verify TypeScript compiles with no errors

---

*Happy Coding! 🎉*



