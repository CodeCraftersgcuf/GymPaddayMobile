# Google Play SDK Policy Response for GymPaddy

## Question 1: What SDKs does your app use and why?

GymPaddy uses the following SDKs and third-party libraries, each serving a specific purpose:

### Core Framework & Development
- **Expo SDK (v53.0.13)**: Core framework providing native module access, build tools, and cross-platform development capabilities. Essential for app functionality and deployment.
- **React Native (v0.79.4)**: Mobile application framework enabling cross-platform development for iOS and Android.

### Real-Time Communication & Live Streaming
- **Agora SDK (react-native-agora v4.5.3)**: Enables live video streaming, video calls, and voice calls between users. Critical for the app's live streaming and video calling features.
- **Stream.io Video SDK (@stream-io/video-react-native-sdk v1.18.0)**: Provides additional video calling infrastructure and WebRTC capabilities for peer-to-peer communication.
- **WebRTC (@config-plugins/react-native-webrtc)**: Enables real-time audio and video communication for video calls and live streaming features.

### Media & Camera
- **Expo Camera (v16.1.10)**: Allows users to capture photos and videos for profile pictures, posts, stories, and video calls.
- **Expo Image Picker (v16.1.4)**: Enables users to select images and videos from their device gallery for posts and profile pictures.
- **Expo Media Library (v17.1.7)**: Provides access to user's media library for content selection and saving.
- **Expo AV (v15.1.6)**: Handles audio and video playback for posts, stories, and media content.
- **Expo Video (v2.2.2)**: Video playback functionality for viewing content.

### Notifications & Background Services
- **Expo Notifications (v0.31.4)**: Manages push notifications to keep users informed about messages, likes, comments, and other social interactions. Essential for user engagement.

### Data Storage & Management
- **AsyncStorage (@react-native-async-storage/async-storage v2.1.2)**: Stores user preferences and app state locally on the device.
- **Expo Secure Store (v14.2.3)**: Securely stores authentication tokens and sensitive user data.

### Network & API Communication
- **Axios (v1.10.0)**: HTTP client for making API requests to our backend server for user data, posts, messages, and other app features.
- **React Query (@tanstack/react-query v5.81.2)**: Manages server state, caching, and data synchronization with our backend API.

### UI & Navigation
- **React Navigation (@react-navigation/native v7.1.6)**: Provides navigation structure and routing throughout the app.
- **Expo Router (v5.1.1)**: File-based routing system for app navigation.
- **React Native Gesture Handler (v2.24.0)**: Handles touch gestures and interactions.
- **React Native Reanimated (v3.17.4)**: Provides smooth animations and transitions.
- **Gorhom Bottom Sheet (@gorhom/bottom-sheet v5.1.4)**: UI component for bottom sheet modals.

### Permissions & Device Access
- **React Native Permissions (v5.4.1)**: Manages runtime permissions for camera, microphone, storage, and other device features in compliance with Android permissions model.
- **Expo Device (v7.1.4)**: Provides device information and capabilities.
- **React Native NetInfo (@react-native-community/netinfo v11.4.1)**: Monitors network connectivity status.

### Utilities & Other Services
- **Formik (v2.4.6) & Yup (v1.6.1)**: Form handling and validation for user input.
- **Date-fns (v4.1.0)**: Date formatting and manipulation utilities.
- **React Native Toast Message (v2.3.1)**: Displays user feedback messages.
- **React Native InCall Manager (v4.2.1)**: Manages audio routing during calls.

### Google Services
- **Google Services (via google-services.json)**: Used for Firebase services integration (if applicable) for backend infrastructure support.

All SDKs are used solely for their intended technical purposes and are necessary for the app's core functionality as a social media platform with live streaming, video calling, marketplace, and content sharing features.

---

## Question 2: Explain how you ensure that any 3rd party code and SDKs used in your app comply with our policies.

We take Google Play Developer Program policy compliance seriously and have implemented the following measures to ensure all third-party code and SDKs comply with Google Play policies:

### 1. **SDK Selection & Vetting Process**
- We only use well-established, reputable SDKs from trusted sources (Expo, React Native community, Agora, Stream.io).
- All SDKs are sourced from official package registries (npm) and verified repositories.
- We review each SDK's privacy policy and terms of service before integration.
- We prioritize SDKs that explicitly state compliance with Google Play policies and data protection regulations.

### 2. **Regular Updates & Security Monitoring**
- We maintain all dependencies at their latest stable versions to ensure security patches and policy compliance updates are applied.
- We regularly review dependency updates and security advisories.
- We monitor for any policy violations or security issues reported for our dependencies.

### 3. **Privacy & Data Collection Compliance**
- We only request permissions that are necessary for app functionality (camera for photos/videos, microphone for calls, storage for media).
- All permission requests include clear, user-friendly descriptions explaining why the permission is needed.
- We do not collect user data beyond what is necessary for app functionality.
- User data is only transmitted to our own backend servers, not to third-party analytics or tracking services without explicit user consent.

### 4. **Transparent Permission Usage**
- All permissions are declared in the app manifest with clear usage descriptions.
- Permissions are requested at runtime only when needed, following Android's best practices.
- We use React Native Permissions SDK to ensure proper permission handling in compliance with Android guidelines.

### 5. **Code Review & Audit**
- We conduct regular code reviews to ensure third-party SDKs are used appropriately.
- We verify that SDKs are not collecting or transmitting data beyond their documented purposes.
- We audit our dependencies to identify and remove any unnecessary or potentially non-compliant libraries.

### 6. **Documentation & Compliance Tracking**
- We maintain documentation of all SDKs used and their purposes.
- We track SDK versions and update logs to ensure compliance with latest policy requirements.
- We review Google Play policy updates and ensure our SDKs remain compliant.

### 7. **User Data Protection**
- We use Expo Secure Store for sensitive data storage, ensuring encryption at rest.
- Authentication tokens and sensitive information are stored securely and not shared with third parties.
- We implement proper data encryption for data in transit using HTTPS.

### 8. **No Unauthorized Data Sharing**
- We do not use SDKs that share user data with unauthorized third parties.
- All data transmission is to our own backend API endpoints.
- We do not include advertising SDKs or analytics SDKs that collect personal information without user consent.

### 9. **Compliance with User Data Policy**
- We ensure that all SDKs we use comply with Google Play's User Data policy.
- We verify that SDKs do not collect sensitive user information (location, contacts, etc.) without proper disclosure and consent.
- We only use SDKs that are necessary for app functionality and do not include unnecessary data collection libraries.

### 10. **Ongoing Monitoring**
- We stay informed about Google Play policy changes and ensure our SDKs remain compliant.
- We monitor SDK provider communications for any policy-related updates or changes.
- We are prepared to update or replace any SDK that becomes non-compliant with Google Play policies.

By following these practices, we ensure that GymPaddy and all its third-party dependencies fully comply with Google Play Developer Program policies, particularly regarding user data collection, privacy, and SDK usage.


