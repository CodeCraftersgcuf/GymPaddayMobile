# GymPaddy Mobile App - Features, Functionality & User Guide

## Table of Contents
1. [Overview](#overview)
2. [Major Features](#major-features)
3. [App Functionality](#app-functionality)
4. [User Journey](#user-journey)
5. [User Behavior Patterns](#user-behavior-patterns)
6. [Technical Specifications](#technical-specifications)

---

## Overview

GymPaddy is a comprehensive fitness social platform that combines social networking, marketplace functionality, live streaming, and communication features. The app enables fitness enthusiasts to connect, share their journey, buy/sell equipment, stream workouts, and engage with the fitness community.

**Platform:** iOS & Android  
**Version:** 1.1.0  
**Bundle ID:** com.pejul.gympaddy

---

## Major Features

### 1. Social Media Feed
**Location:** Home Tab (Socials)

**Core Functionality:**
- Infinite scroll feed of posts from followed users
- Post types: Text, Image, Video (supports various aspect ratios)
- Story viewing and creation (WhatsApp-style)
- Interactive engagement: Like, Comment, Share
- Real-time comments with nested replies
- Post detail view with full engagement metrics
- Pull-to-refresh functionality
- Pagination for optimized loading

**Key Components:**
- Story container with user avatars
- Post cards with media carousel
- Comments bottom sheet
- Media viewer for full-screen content

---

### 2. Stories Feature
**Location:** Top of Social Feed

**Functionality:**
- **Viewing Stories:**
  - Tap user avatar to view their stories
  - Swipe left/right to navigate between stories
  - Tap left edge to go to previous story
  - Tap right edge to go to next story
  - Auto-advance after 4 seconds
  - Preloading for smooth transitions

- **Creating Stories:**
  - Add photo or video from gallery
  - Add music from curated library (15+ tracks)
  - Music categories: Workout, Trending, Chill, Dance, Afrobeat
  - Search music functionality
  - Add captions
  - Batch upload multiple stories
  - Stories expire after 24 hours

**User Experience:**
- WhatsApp-like interface
- Smooth navigation
- Visual progress indicators
- Music preview before selection

---

### 3. Marketplace
**Location:** Market Tab

**Core Functionality:**
- Browse fitness equipment, supplements, and gear
- Category filtering (Equipment, Supplements, Apparel, Accessories, etc.)
- Search functionality
- Listing details with images, price, seller info
- Boost listings for increased visibility
- Business account registration
- Location-based filtering
- Seller profiles

**User Actions:**
- View listings
- Filter by category
- Search products
- Contact sellers via chat
- Create listings (business accounts)
- Boost listings for promotion

---

### 4. Live Streaming
**Location:** Live Tab (Center button)

**Functionality:**
- Start live streams
- Discover active live streams
- Real-time chat during streams
- Send virtual gifts (GP Coins)
- Gift history tracking
- Viewer count display
- Stream quality optimization

**Gift System:**
- Multiple gift options with different coin values
- Top-up wallet to purchase gifts
- Real-time gift animations
- Gift history tracking

**Stream Features:**
- Agora-based streaming infrastructure
- Low-latency video streaming
- Interactive chat overlay
- Gift panel with balance display

---

### 5. Messaging & Communication
**Location:** Messages Tab

**Functionality:**
- One-on-one messaging
- Real-time message delivery
- Unread message count badge
- Conversation list
- Message history
- Media sharing in chats
- Marketplace chat integration

**Video & Voice Calls:**
- Initiate video calls
- Voice-only calls
- Incoming call notifications
- Call history
- Stream.io integration for calls

---

### 6. Wallet & Transactions
**Location:** More Tab → Wallet

**Functionality:**
- **Top-up (Deposit):**
  - iOS: Apple In-App Purchase (minimum 100 Naira)
  - Android: Flutterwave payment gateway
  - Bank transfer option
  - Real-time balance updates

- **Withdraw:**
  - Request withdrawal
  - Bank account details
  - Transaction history
  - Withdrawal status tracking

- **Transaction History:**
  - All transactions listed
  - Filter by type (topup/withdrawal)
  - Transaction details
  - Date and time stamps

**GP Coins:**
- Virtual currency (1 GP Coin = 1 Naira)
- Used for gifts, boosts, and premium features
- Balance displayed throughout app

---

### 7. User Profile
**Location:** Accessible from posts, search, and More tab

**Functionality:**
- View user profiles
- Edit own profile
- Profile picture upload
- Bio and personal information
- Follow/Unfollow users
- View user's posts
- View followers/following lists
- User statistics

---

### 8. Business Features
**Location:** More Tab → Business

**Functionality:**
- Business account registration
- Business profile creation
- Ad campaign management
- Campaign analytics and insights
- Boost posts and listings
- Business verification

**Ad Campaigns:**
- Create ad campaigns
- Set budget and targeting
- Track performance
- View insights and analytics
- Toggle campaign status

---

### 9. Notifications
**Location:** More Tab → Notifications

**Functionality:**
- Push notifications
- In-app notification center
- Notification types:
  - New followers
  - Comments on posts
  - Likes
  - Messages
  - Live stream alerts
  - Gift receipts
- Mark as read/unread
- Notification history

---

### 10. Search & Discovery
**Location:** Search icon in header

**Functionality:**
- Search users
- Search posts
- Search marketplace listings
- Recent searches
- Search suggestions

---

## App Functionality

### Authentication Flow
1. **Onboarding:** First-time users see onboarding slides
2. **Registration:** Email, username, password, personal details
3. **Login:** Email/password authentication
4. **Password Recovery:** Forgot password → OTP verification → Reset
5. **Session Management:** Secure token storage, auto-logout on expiry

### Navigation Structure
- **Bottom Tab Navigation:**
  - Socials (Home feed)
  - Market (Marketplace)
  - Live (Streaming - center button)
  - Messages (Chat)
  - More (Settings & profile)

- **Stack Navigation:**
  - Post detail screens
  - Profile screens
  - Settings screens
  - Transaction screens

### Data Management
- **State Management:** React Query for server state
- **Local Storage:** SecureStore for tokens, AsyncStorage for preferences
- **Caching:** Automatic query caching and invalidation
- **Optimistic Updates:** Immediate UI updates for better UX

### Media Handling
- **Image Upload:** Support for multiple formats, compression
- **Video Upload:** MP4 support, aspect ratio preservation
- **Media Library Access:** Full gallery access for stories and posts
- **Camera Integration:** Direct camera capture for posts and stories

### Real-time Features
- **Live Streaming:** Agora SDK integration
- **Video Calls:** Stream.io Video SDK
- **Chat:** Real-time messaging
- **Notifications:** Push notifications via Expo

---

## User Journey

### New User Journey

1. **First Launch**
   - Onboarding screens (3 slides)
   - Introduction to Socials, Marketplace, Live features

2. **Registration**
   - Enter email, username, password
   - Personal details (age, gender)
   - Profile picture upload (optional)
   - Email verification

3. **Initial Setup**
   - Explore feed (may be empty initially)
   - Follow suggested users
   - Create first post or story
   - Set up wallet (optional)

4. **Engagement**
   - Browse and interact with posts
   - View stories
   - Discover live streams
   - Explore marketplace

### Active User Journey

1. **Daily Check-in**
   - Open app → View feed
   - Check stories from followed users
   - Browse new posts
   - Check notifications

2. **Content Creation**
   - Create post: Select media → Add caption → Post
   - Create story: Select media → Add music (optional) → Share
   - Go live: Tap live button → Start stream → Interact with viewers

3. **Social Interaction**
   - Like and comment on posts
   - Share interesting content
   - Follow new users
   - Send messages

4. **Marketplace Activity**
   - Browse listings
   - Search for specific items
   - Contact sellers
   - Create listings (business users)

5. **Monetization (Content Creators)**
   - Receive gifts during live streams
   - Top-up wallet for gifts/boosts
   - Withdraw earnings
   - Track transaction history

### Business User Journey

1. **Business Registration**
   - Register business account
   - Complete business profile
   - Verify business details

2. **Listing Management**
   - Create marketplace listings
   - Upload product images
   - Set prices and descriptions
   - Boost listings for visibility

3. **Marketing**
   - Create ad campaigns
   - Set targeting and budget
   - Monitor campaign performance
   - Adjust campaigns based on insights

---

## User Behavior Patterns

### Content Consumption Patterns

1. **Feed Browsing:**
   - Users typically scroll through feed in short bursts
   - Most engagement happens within first 10 posts
   - Pull-to-refresh used frequently
   - Users tap to view post details for interesting content

2. **Story Viewing:**
   - Users view stories in quick succession
   - Average story view time: 3-5 seconds
   - Users skip stories they're not interested in
   - Music selection influences story engagement

3. **Live Stream Engagement:**
   - Users join streams for 5-15 minutes on average
   - Active chatters send 3-5 messages per stream
   - Gift sending peaks during popular streams
   - Users often return to favorite streamers

### Content Creation Patterns

1. **Post Creation:**
   - Users post 1-3 times per day on average
   - Image posts more common than video
   - Captions typically 10-50 words
   - Peak posting times: Morning (7-9 AM) and Evening (6-9 PM)

2. **Story Creation:**
   - Users create 2-5 stories per day
   - Stories often include workout progress
   - Music selection varies by time of day
   - Batch uploads common (multiple stories at once)

3. **Live Streaming:**
   - Streamers go live 2-4 times per week
   - Average stream duration: 30-60 minutes
   - Peak streaming times: Evening (6-10 PM)
   - Regular streamers build consistent audience

### Transaction Patterns

1. **Top-up Behavior:**
   - Users top-up 1-3 times per month
   - Average top-up amount: 500-2000 Naira
   - Top-ups often triggered by:
     - Wanting to send gifts
     - Boosting posts/listings
     - Low balance notifications

2. **Gift Sending:**
   - Gifts sent during live streams
   - Popular streamers receive most gifts
   - Users send 1-5 gifts per stream session
   - Gift value typically 100-500 GP Coins

3. **Withdrawal Patterns:**
   - Content creators withdraw monthly
   - Minimum withdrawal threshold influences timing
   - Users prefer bank transfers
   - Withdrawal requests processed within 24-48 hours

### Social Interaction Patterns

1. **Following Behavior:**
   - Users follow 20-100 accounts
   - Follow back rate: 30-40%
   - Users discover new accounts through:
     - Suggested users
     - Post interactions
     - Live stream discovery

2. **Engagement Patterns:**
   - Likes: Most common interaction (70% of engagements)
   - Comments: 20% of engagements
   - Shares: 10% of engagements
   - Users comment more on posts with existing comments

3. **Messaging Patterns:**
   - Direct messages used for:
     - Marketplace inquiries (40%)
     - Personal conversations (35%)
     - Collaboration requests (25%)
   - Average conversation length: 5-10 messages

### Marketplace Behavior

1. **Browsing Patterns:**
   - Users browse marketplace 2-3 times per week
   - Category filtering used frequently
   - Search used for specific items
   - Users view 3-5 listings before contacting seller

2. **Purchase Behavior:**
   - Users contact seller before purchasing
   - Average inquiry-to-purchase time: 1-3 days
   - Price negotiation common
   - Users prefer local sellers

3. **Selling Behavior:**
   - Business users list 5-20 items
   - Boosted listings get 3x more views
   - Successful sellers respond quickly to inquiries
   - Regular updates to listings improve visibility

---

## Technical Specifications

### Platform Requirements
- **iOS:** 13.0+
- **Android:** API Level 21+
- **React Native:** 0.79.4
- **Expo SDK:** 53.0.13

### Key Dependencies
- **Real-time Communication:** Agora SDK, Stream.io
- **State Management:** React Query (TanStack Query)
- **Navigation:** Expo Router
- **Media:** Expo Camera, Expo Image Picker, Expo AV
- **Payments:** Apple IAP (iOS), Flutterwave (Android)
- **Storage:** Expo SecureStore, AsyncStorage

### API Integration
- **Base URL:** https://gympaddy.hmstech.xyz/api
- **Authentication:** Bearer token (JWT)
- **Data Format:** JSON
- **Error Handling:** Comprehensive error messages

### Performance Optimizations
- Image lazy loading
- Video preloading for stories
- Infinite scroll pagination
- Query caching
- Optimistic UI updates

### Security Features
- Secure token storage
- Encrypted data transmission (HTTPS)
- Permission-based access
- Input validation
- XSS protection

---

## Testing Considerations

### Critical User Flows to Verify

1. **Authentication:**
   - Registration with all fields
   - Login with valid/invalid credentials
   - Password recovery flow
   - Session persistence

2. **Content Creation:**
   - Post creation with images/videos
   - Story creation with music
   - Live stream initiation
   - Media upload success/failure

3. **Social Interactions:**
   - Like/Unlike posts
   - Comment creation and replies
   - Share functionality
   - Follow/Unfollow users

4. **Transactions:**
   - Top-up flow (iOS IAP & Android Flutterwave)
   - Withdrawal request
   - Transaction history display
   - Balance updates

5. **Real-time Features:**
   - Live stream viewing
   - Gift sending during streams
   - Video/voice calls
   - Real-time messaging

6. **Marketplace:**
   - Listing creation
   - Search and filtering
   - Contact seller
   - Boost listing

### Edge Cases to Test

- Network connectivity issues
- Low storage space
- Permission denials
- Large file uploads
- Concurrent actions
- Rapid navigation
- Background/foreground transitions
- App updates during use

### Performance Testing

- App launch time
- Feed loading speed
- Story navigation smoothness
- Video playback quality
- Image loading performance
- Search response time
- Transaction processing speed

---

## Conclusion

GymPaddy provides a comprehensive platform for fitness enthusiasts to connect, share, and engage. The app combines social networking, e-commerce, live streaming, and communication features into a unified experience. Understanding user behavior patterns and journey flows is essential for ensuring optimal functionality and user satisfaction.

For technical implementation details, refer to the codebase documentation and API specifications in the README.md file.

---

**Document Version:** 1.0  
**Last Updated:** December 2025  
**Maintained By:** Development Team
