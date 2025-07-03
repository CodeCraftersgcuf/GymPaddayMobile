// const API_DOMAIN = "http://192.168.175.151:8000/api";

const API_DOMAIN = "https://gympaddy.hmstech.xyz/api";

const API_ENDPOINTS = {
  AUTH: {
    Login: API_DOMAIN + "/auth/login",
    Register: API_DOMAIN + "/auth/register",
    ForgotPassword: API_DOMAIN + "/auth/forgot-password",
    VerifyOtp: API_DOMAIN + "/auth/verify-otp",
    ResetPassword: "/auth/reset-password", // 👈 Add this
  },
  PERSONAL_ACCESS_TOKENS: {
    List: API_DOMAIN + "/personal-access-tokens",
    Create: API_DOMAIN + "/personal-access-tokens",
    Show: (id: number) => API_DOMAIN + `/personal-access-tokens/${id}`,
    Update: (id: number) => API_DOMAIN + `/personal-access-tokens/${id}`,
    Delete: (id: number) => API_DOMAIN + `/personal-access-tokens/${id}`,
  },
  USER: {
    PROFILE: {
      PROFILE: (userId: number) => `${API_DOMAIN}/user/userDetails/${userId}`,
      EditProfile: API_DOMAIN + "/user/edit-profile",
    },
    POSTS: {
      List: API_DOMAIN + "/user/posts",
      Create: API_DOMAIN + "/user/posts",
      Show: (id: number) => API_DOMAIN + `/user/posts/${id}`,
      Update: (id: number) => API_DOMAIN + `/user/posts/${id}`,
      Delete: (id: number) => API_DOMAIN + `/user/posts/${id}`,
    },
    COMMENTS: {
      List: API_DOMAIN + "/user/comments",
      Create: API_DOMAIN + "/user/comments",
      Show: (id: number) => API_DOMAIN + `/user/comments/${id}`,
      Update: (id: number) => API_DOMAIN + `/user/comments/${id}`,
      Delete: (id: number) => API_DOMAIN + `/user/comments/${id}`,
    },
    WALLETS: {
      List: API_DOMAIN + "/user/wallets",
      Create: API_DOMAIN + "/user/wallets",
      Show: (id: number) => API_DOMAIN + `/user/wallets/${id}`,
      Update: (id: number) => API_DOMAIN + `/user/wallets/${id}`,
      Delete: (id: number) => API_DOMAIN + `/user/wallets/${id}`,
      TopUp: API_DOMAIN + "/user/wallet/topup",
      Withdraw: API_DOMAIN + "/user/wallet/withdraw",
    },
    GIFTS: {
      List: API_DOMAIN + "/user/gifts",

      Create: API_DOMAIN + "/user/gifts",
      Update: (id: number) => API_DOMAIN + `/user/gifts/${id}`,
    },
    TRANSACTIONS: {
      List: API_DOMAIN + "/user/transactions",
      Create: API_DOMAIN + "/user/transactions",
      Update: (id: number) => API_DOMAIN + `/user/transactions/${id}`,
      Delete: (id: number) => API_DOMAIN + `/user/transactions/${id}`,
    },
    BUSINESSES: {
      List: API_DOMAIN + "/user/businesses",
      Create: API_DOMAIN + "/user/businesses",
      Show: (id: number) => API_DOMAIN + `/user/businesses/${id}`,
      Update: (id: number) => API_DOMAIN + `/user/businesses/${id}`,
      Delete: (id: number) => API_DOMAIN + `/user/businesses/${id}`,
    },
    AD_CAMPAIGNS: {
      List: API_DOMAIN + "/user/ad-campaigns",
      Create: API_DOMAIN + "/user/ad-campaigns",
      Show: (id: number) => API_DOMAIN + `/user/ad-campaigns/${id}`,
      Update: (id: number) => API_DOMAIN + `/user/ad-campaigns/${id}`,
      Delete: (id: number) => API_DOMAIN + `/user/ad-campaigns/${id}`,
    },
    AD_INSIGHTS: {
      List: API_DOMAIN + "/user/ad-insights",
      Show: (id: number) => API_DOMAIN + `/user/ad-insights/${id}`,
    },
    MARKETPLACE_LISTINGS: {
      List: API_DOMAIN + "/user/marketplace-listings",
      Create: API_DOMAIN + "/user/marketplace-listings",
      Show: (id: number) => API_DOMAIN + `/user/marketplace-listings/${id}`,
      Update: (id: number) => API_DOMAIN + `/user/marketplace-listings/${id}`,
      Delete: (id: number) => API_DOMAIN + `/user/marketplace-listings/${id}`,
    },
    MARKETPLACE_CATEGORIES: {
      List: API_DOMAIN + "/user/marketplace-categories",
      Create: API_DOMAIN + "/user/marketplace-categories",
      Show: (id: number) => API_DOMAIN + `/user/marketplace-categories/${id}`,
      Update: (id: number) => API_DOMAIN + `/user/marketplace-categories/${id}`,
      Delete: (id: number) => API_DOMAIN + `/user/marketplace-categories/${id}`,
    },
    LIVE_STREAMS: {
      List: API_DOMAIN + "/user/live-streams",
      Create: API_DOMAIN + "/user/live-streams",
      Show: (id: number) => API_DOMAIN + `/user/live-streams/${id}`,
      Update: (id: number) => API_DOMAIN + `/user/live-streams/${id}`,
      Delete: (id: number) => API_DOMAIN + `/user/live-streams/${id}`,
    },
    REELS: {
      List: API_DOMAIN + "/user/reels",
      Create: API_DOMAIN + "/user/reels",
      Show: (id: number) => API_DOMAIN + `/user/reels/${id}`,
      Update: (id: number) => API_DOMAIN + `/user/reels/${id}`,
      Delete: (id: number) => API_DOMAIN + `/user/reels/${id}`,
    },
    LIKES: {
      List: API_DOMAIN + "/user/likes",
      Create: API_DOMAIN + "/user/likes",
      Show: (id: number) => API_DOMAIN + `/user/likes/${id}`,
      Update: (id: number) => API_DOMAIN + `/user/likes/${id}`,
      Delete: (id: number) => API_DOMAIN + `/user/likes/${id}`,
    },
    SHARES: {
      List: API_DOMAIN + "/user/shares",
      Create: API_DOMAIN + "/user/shares",
      Show: (id: number) => API_DOMAIN + `/user/shares/${id}`,
      Update: (id: number) => API_DOMAIN + `/user/shares/${id}`,
      Delete: (id: number) => API_DOMAIN + `/user/shares/${id}`,
    },
    FOLLOWS: {
      List: API_DOMAIN + "/user/follows",
      Create: API_DOMAIN + "/user/follows",
      Show: (id: number) => API_DOMAIN + `/user/followers/${id}`,
      Update: (id: number) => API_DOMAIN + `/user/follows/${id}`,
      Delete: (id: number) => API_DOMAIN + `/user/follows/${id}`,
    },
    NOTIFICATIONS: {
      List: API_DOMAIN + "/user/notifications",
      Create: API_DOMAIN + "/user/notifications",
      Show: (id: number) => API_DOMAIN + `/user/notifications/${id}`,
      Update: (id: number) => API_DOMAIN + `/user/notifications/${id}`,
      Delete: (id: number) => API_DOMAIN + `/user/notifications/${id}`,
    },
    CHAT_MESSAGES: {
      ConnectedUsers: API_DOMAIN + "/user/chat-conversations",
      List: API_DOMAIN + "/user/chat-messages",
      Create: API_DOMAIN + "/user/chat-messages",
      Show: (id: number) => API_DOMAIN + `/user/chat-messages/${id}`,
      Update: (id: number) => API_DOMAIN + `/user/chat-messages/${id}`,
      Delete: (id: number) => API_DOMAIN + `/user/chat-messages/${id}`,
    },
    TICKETS: {
      List: API_DOMAIN + "/user/tickets",
      Create: API_DOMAIN + "/user/tickets",
      Show: (id: number) => API_DOMAIN + `/user/tickets/${id}`,
      Update: (id: number) => API_DOMAIN + `/user/tickets/${id}`,
      Delete: (id: number) => API_DOMAIN + `/user/tickets/${id}`,
    },
    VIDEO_CALLS: {
      LiveVideoCallToken: API_DOMAIN + "/video-call/live-token",
      Token: API_DOMAIN + "/video-call/token",
      StartCall: API_DOMAIN + "/user/start-call",
      EndCall: API_DOMAIN + "/video-call/end",
      CallHistory: API_DOMAIN + "/user/video-calls/history",
      List: API_DOMAIN + "/user/video-calls",
      Create: API_DOMAIN + "/user/video-calls",
      Show: (id: number) => API_DOMAIN + `/user/video-calls/${id}`,
      Update: (id: number) => API_DOMAIN + `/user/video-calls/${id}`,
      Delete: (id: number) => API_DOMAIN + `/user/video-calls/${id}`,
    },
  },
};

export { API_DOMAIN, API_ENDPOINTS };
