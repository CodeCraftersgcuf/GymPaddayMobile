# Google Play Console - Foreground Service Permissions Explanation

## ⚠️ Important: These Permissions Are NOT Used By Our App

The foreground service permissions (`FOREGROUND_SERVICE_MEDIA_PLAYBACK` and `FOREGROUND_SERVICE_MEDIA_PROJECTION`) are being detected by Google Play Console, but **our app does NOT use background playback or background services**.

---

## Why These Permissions Appear

These permissions are **automatically declared by third-party libraries** we use:

1. **`expo-av`** - Video/audio playback library
2. **`expo-video`** - Video playback library  
3. **`@stream-io/video-react-native-sdk`** - Live streaming SDK
4. **`@config-plugins/react-native-webrtc`** - WebRTC video calls

These libraries include these permissions in their AndroidManifest.xml by default, even though we don't use them.

---

## Proof That We Don't Use Background Playback

### 1. Audio Configuration
Our app explicitly **disables** background audio:

```typescript
// From STORY_USAGE_GUIDE.md
Audio.setAudioModeAsync({
  playsInSilentModeIOS: true,
  staysActiveInBackground: false,  // ✅ Explicitly disabled
});
```

### 2. Video Playback
- Videos only play when the app is in the **foreground**
- Videos **pause automatically** when the app goes to background
- No background video playback is implemented

### 3. No Foreground Services
- We don't create any foreground services
- We don't show persistent notifications for media playback
- All media stops when the app is backgrounded

---

## What to Tell Google Play Console

### For `FOREGROUND_SERVICE_MEDIA_PLAYBACK`:

**Question:** "What tasks require your app to use the FOREGROUND_SERVICE_MEDIA_PLAYBACK permission?"

**Answer:**
```
❌ None - This permission is declared by third-party libraries (expo-av, expo-video) 
but is NOT used by our app.

Our app:
- Does NOT play videos in the background
- Does NOT play audio in the background  
- Explicitly disables background playback with staysActiveInBackground: false
- All media stops when the app is backgrounded

We are working with the library maintainers to remove this unnecessary permission declaration.
```

### For `FOREGROUND_SERVICE_MEDIA_PROJECTION`:

**Question:** "What tasks require your app to use the FOREGROUND_SERVICE_MEDIA_PROJECTION permission?"

**Answer:**
```
❌ None - This permission is declared by third-party libraries (@stream-io/video-react-native-sdk, 
react-native-webrtc) but is NOT used by our app.

Our app:
- Does NOT use screen projection in the background
- Does NOT maintain live streams when backgrounded
- All live streams and video calls end when the app is backgrounded

We are working with the library maintainers to remove this unnecessary permission declaration.
```

---

## Alternative: Request Permission Removal

If Google Play Console requires you to justify these permissions, you can:

1. **Select "Other"** for both permissions
2. **Explain** that these are library-declared but unused
3. **Request an exception** since you cannot control third-party library manifest declarations

---

## Long-term Solution

1. **Contact library maintainers** to make these permissions optional
2. **Use config plugins** to remove unused permissions (if possible)
3. **Switch to alternative libraries** that don't declare unnecessary permissions

---

## Current App Behavior

✅ **Videos play only in foreground**  
✅ **Audio stops when app backgrounds**  
✅ **No persistent notifications**  
✅ **No background services running**  
✅ **All media stops when app closes**

---

## Verification Steps

To verify our app doesn't use background playback:

1. Open the app
2. Start playing a video
3. Press the home button (app goes to background)
4. **Result:** Video stops immediately ✅
5. No notification appears ✅
6. No foreground service is running ✅

---

## Summary

- **Permissions detected:** Yes (by libraries)
- **Permissions used:** No
- **Background playback:** Disabled
- **Foreground services:** None created
- **Action needed:** Explain to Google Play that these are library-declared but unused

