# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.



## API Testing Instructions (Postman)

All `/api/user/*` endpoints require the `Authorization: Bearer {token}` header. The authenticated user is determined from this token. You do **not** need to send `user_id` in the request body for creating or updating resources; it is automatically set from the token.

### Auth

- **POST** `/api/auth/register`
  - Body (JSON):
    ```json
    {
      "username": "johndoe",
      "fullname": "John Doe",
      "email": "john@example.com",
      "phone": "1234567890",
      "age": 25,
      "gender": "male",
      "password": "yourpassword",
      "password_confirmation": "yourpassword"
    }
    ```
- **POST** `/api/auth/login`
  - Body (JSON):
    ```json
    {
      "email": "john@example.com",
      "password": "yourpassword"
    }
    ```
- **POST** `/api/auth/forgot-password`
  - Body (JSON):
    ```json
    {
      "email": "john@example.com"
    }
    ```
- **POST** `/api/auth/verify-otp`
  - Body (JSON):
    ```json
    {
      "email": "john@example.com",
      "token": "reset-token-from-email",
      "password": "newpassword",
      "password_confirmation": "newpassword"
    }
    ```

### Personal Access Tokens

- **GET** `/api/personal-access-tokens`
- **POST** `/api/personal-access-tokens`
  - Body (JSON):
    ```json
    {
      "tokenable_type": "App\\Models\\User",
      "tokenable_id": 1,
      "name": "MyToken",
      "token": "sometoken",
      "abilities": [],
      "last_used_at": null,
      "expires_at": null
    }
    ```
- **GET** `/api/personal-access-tokens/{id}`
- **PUT** `/api/personal-access-tokens/{id}`
  - Body (JSON):
    ```json
    {
      "name": "UpdatedToken",
      "abilities": [],
      "last_used_at": null,
      "expires_at": null
    }
    ```
- **DELETE** `/api/personal-access-tokens/{id}`

### User Endpoints (require Bearer token)

#### Posts

- **GET** `/api/user/posts`
  - Returns posts belonging to the authenticated user.
- **POST** `/api/user/posts`
  - Body (JSON):
    ```json
    {
      "title": "My First Post",
      "content": "Hello world!",
      "media_url": "https://example.com/photo.jpg"
    }
    ```
- **GET** `/api/user/posts/{post}`
- **PUT** `/api/user/posts/{post}`
  - Body (JSON):
    ```json
    {
      "title": "Updated Title",
      "content": "Updated content"
    }
    ```
- **DELETE** `/api/user/posts/{post}`

#### Comments

- **GET** `/api/user/comments?post_id={post_id}`
- **POST** `/api/user/comments`
  - Body (JSON):
    ```json
    {
      "post_id": 1,
      "content": "Nice post!",
      "parent_id": null
    }
    ```
- **GET** `/api/user/comments/{comment}`
- **PUT** `/api/user/comments/{comment}`
  - Body (JSON):
    ```json
    {
      "content": "Updated comment"
    }
    ```
- **DELETE** `/api/user/comments/{comment}`

#### Wallets

- **GET** `/api/user/wallets`
- **POST** `/api/user/wallets`
  - Body (JSON):
    ```json
    {
      "balance": 0
    }
    ```
- **GET** `/api/user/wallets/{wallet}`
- **PUT** `/api/user/wallets/{wallet}`
  - Body (JSON):
    ```json
    {
      "balance": 100
    }
    ```
- **DELETE** `/api/user/wallets/{wallet}`
- **POST** `/api/user/wallet/topup`
  - Body (JSON):
    ```json
    {
      "amount": 100
    }
    ```
- **POST** `/api/user/wallet/withdraw`
  - Body (JSON):
    ```json
    {
      "amount": 50
    }
    ```

#### Gifts

- **POST** `/api/user/gifts`
  - Body (JSON):
    ```json
    {
      "to_user_id": 2,
      "name": "Gift Card",
      "value": 10,
      "message": "Congrats!"
    }
    ```
- **PUT** `/api/user/gifts/{gift}`
  - Body (JSON):
    ```json
    {
      "name": "Updated Gift",
      "value": 20
    }
    ```

#### Transactions

- **POST** `/api/user/transactions`
  - Body (JSON):
    ```json
    {
      "wallet_id": 1,
      "amount": 100,
      "type": "topup"
    }
    ```
- **PUT** `/api/user/transactions/{transaction}`
  - Body (JSON):
    ```json
    {
      "amount": 50,
      "type": "withdraw"
    }
    ```
- **DELETE** `/api/user/transactions/{transaction}`

#### Businesses

- **GET** `/api/user/businesses`
- **POST** `/api/user/businesses`
  - Body (JSON):
    ```json
    {
      "name": "My Gym Business",
      "description": "Best gym in town"
    }
    ```
- **GET** `/api/user/businesses/{business}`
- **PUT** `/api/user/businesses/{business}`
  - Body (JSON):
    ```json
    {
      "name": "Updated Business",
      "description": "Updated description"
    }
    ```
- **DELETE** `/api/user/businesses/{business}`

#### Ad Campaigns

- **GET** `/api/user/ad-campaigns`
- **POST** `/api/user/ad-campaigns`
  - Body (JSON):
    ```json
    {
      "name": "Summer Promo",
      "budget": 500
    }
    ```
- **GET** `/api/user/ad-campaigns/{ad_campaign}`
- **PUT** `/api/user/ad-campaigns/{ad_campaign}`
  - Body (JSON):
    ```json
    {
      "name": "Updated Promo",
      "budget": 600
    }
    ```
- **DELETE** `/api/user/ad-campaigns/{ad_campaign}`

#### Ad Insights

- **GET** `/api/user/ad-insights`
- **GET** `/api/user/ad-insights/{ad_insight}`

#### Marketplace Listings

- **GET** `/api/user/marketplace-listings`
- **POST** `/api/user/marketplace-listings`
  - Body (JSON):
    ```json
    {
      "title": "Dumbbells Set",
      "category_id": 1,
      "price": 100,
      "status": "pending"
    }
    ```
- **GET** `/api/user/marketplace-listings/{marketplace_listing}`
- **PUT** `/api/user/marketplace-listings/{marketplace_listing}`
  - Body (JSON):
    ```json
    {
      "title": "Updated Dumbbells Set",
      "price": 90
    }
    ```
- **DELETE** `/api/user/marketplace-listings/{marketplace_listing}`

#### Marketplace Categories

- **GET** `/api/user/marketplace-categories`
- **POST** `/api/user/marketplace-categories`
  - Body (JSON):
    ```json
    {
      "name": "gymEquipment"
    }
    ```
- **GET** `/api/user/marketplace-categories/{marketplace_category}`
- **PUT** `/api/user/marketplace-categories/{marketplace_category}`
  - Body (JSON):
    ```json
    {
      "name": "supplement"
    }
    ```
- **DELETE** `/api/user/marketplace-categories/{marketplace_category}`

#### Live Streams

- **GET** `/api/user/live-streams`
- **POST** `/api/user/live-streams`
  - Body (JSON):
    ```json
    {
      "title": "Morning Workout Live"
    }
    ```
- **GET** `/api/user/live-streams/{live_stream}`
- **PUT** `/api/user/live-streams/{live_stream}`
  - Body (JSON):
    ```json
    {
      "title": "Evening Workout Live"
    }
    ```
- **DELETE** `/api/user/live-streams/{live_stream}`

#### Reels

- **GET** `/api/user/reels`
- **POST** `/api/user/reels`
  - Body (JSON):
    ```json
    {
      "title": "My Gym Reel",
      "media_url": "https://example.com/reel.mp4"
    }
    ```
- **GET** `/api/user/reels/{reel}`
- **PUT** `/api/user/reels/{reel}`
  - Body (JSON):
    ```json
    {
      "title": "Updated Reel"
    }
    ```
- **DELETE** `/api/user/reels/{reel}`

#### Likes

- **GET** `/api/user/likes`
- **POST** `/api/user/likes`
  - Body (JSON):
    ```json
    {
      "likeable_id": 1,
      "likeable_type": "Post"
    }
    ```
- **GET** `/api/user/likes/{like}`
- **PUT** `/api/user/likes/{like}`
  - Body (JSON):
    ```json
    {
      "likeable_id": 2,
      "likeable_type": "Comment"
    }
    ```
- **DELETE** `/api/user/likes/{like}`

#### Shares

- **GET** `/api/user/shares`
- **POST** `/api/user/shares`
  - Body (JSON):
    ```json
    {
      "shareable_id": 1,
      "shareable_type": "Post"
    }
    ```
- **GET** `/api/user/shares/{share}`
- **PUT** `/api/user/shares/{share}`
  - Body (JSON):
    ```json
    {
      "shareable_id": 2,
      "shareable_type": "Reel"
    }
    ```
- **DELETE** `/api/user/shares/{share}`

#### Follows

- **GET** `/api/user/follows`
- **POST** `/api/user/follows`
  - Body (JSON):
    ```json
    {
      "follower_id": 1,
      "followable_id": 2,
      "followable_type": "User"
    }
    ```
- **GET** `/api/user/follows/{follow}`
- **PUT** `/api/user/follows/{follow}`
  - Body (JSON):
    ```json
    {
      "followable_id": 3,
      "followable_type": "Business"
    }
    ```
- **DELETE** `/api/user/follows/{follow}`

#### Notifications

- **GET** `/api/user/notifications`
- **POST** `/api/user/notifications`
  - Body (JSON):
    ```json
    {
      "message": "Welcome to GymPaddy!"
    }
    ```
- **GET** `/api/user/notifications/{notification}`
- **PUT** `/api/user/notifications/{notification}`
  - Body (JSON):
    ```json
    {
      "message": "Updated notification"
    }
    ```
- **DELETE** `/api/user/notifications/{notification}`

#### Chat Messages

- **GET** `/api/user/chat-messages`
- **POST** `/api/user/chat-messages`
  - Body (JSON):
    ```json
    {
      "sender_id": 1,
      "receiver_id": 2,
      "message": "Hello!"
    }
    ```
- **GET** `/api/user/chat-messages/{chat_message}`
- **PUT** `/api/user/chat-messages/{chat_message}`
  - Body (JSON):
    ```json
    {
      "message": "Updated message"
    }
    ```
- **DELETE** `/api/user/chat-messages/{chat_message}`

#### Tickets

- **GET** `/api/user/tickets`
- **POST** `/api/user/tickets`
  - Body (JSON):
    ```json
    {
      "subject": "Support Needed",
      "message": "I need help with my account."
    }
    ```
- **GET** `/api/user/tickets/{ticket}`
- **PUT** `/api/user/tickets/{ticket}`
  - Body (JSON):
    ```json
    {
      "subject": "Updated Subject",
      "message": "Updated message"
    }
    ```
- **DELETE** `/api/user/tickets/{ticket}`

#### Video Calls

- **GET** `/api/user/video-calls`
- **POST** `/api/user/video-calls`
  - Body (JSON):
    ```json
    {
      "caller_id": 1,
      "receiver_id": 2,
      "channel_name": "call-channel"
    }
    ```
- **GET** `/api/user/video-calls/{video_call}`
- **PUT** `/api/user/video-calls/{video_call}`
  - Body (JSON):
    ```json
    {
      "status": "ended"
    }
    ```
- **DELETE** `/api/user/video-calls/{video_call}`

---

For each endpoint, use the appropriate HTTP method, set the URL, add the Bearer token for authentication, and provide the required JSON body for POST/PUT requests. Adjust IDs and field values as needed for your tests.
