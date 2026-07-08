import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { View, StyleSheet } from 'react-native';

export type FeedPostVideo = {
  id: number;
  videoUrl?: string | null;
  videoThumbnailUrl?: string | null;
  videoMp4Url?: string | null;
  // Rich fields (present at runtime from mapPostFromApi) used by the Reels UI.
  content?: string;
  timestamp?: string;
  is_liked?: boolean;
  likes_count?: number;
  comments_count?: number;
  share_count?: number;
  imagesUrl?: string[];
  user?: {
    id?: number | string;
    username?: string;
    profile_picture?: string | null;
  };
  likes?: Array<{ id: number; user?: { id?: number | string } }>;
};

export type FeedVideoPoolContextValue = {
  activePostId: number | null;
  videoPosts: FeedPostVideo[];
  detailPostId: number | null;
  openVideoDetail: (postId: number) => void;
  closeVideoDetail: () => void;
  onReelsLoadMore?: () => void;
  onReelsActivePostChange?: (postId: number) => void;
  onReelsHidePost?: (postId: number) => void;
};

const FeedVideoPoolContext = createContext<FeedVideoPoolContextValue | null>(null);

type FeedVideoPoolProviderProps = {
  children: React.ReactNode;
  posts: FeedPostVideo[];
  activePostId: number | null;
  /** Controlled reels state (owned by the feed screen so it can pause feed playback). */
  detailPostId: number | null;
  openVideoDetail: (postId: number) => void;
  closeVideoDetail: () => void;
  onReelsLoadMore?: () => void;
  onReelsActivePostChange?: (postId: number) => void;
  onReelsHidePost?: (postId: number) => void;
};

export function FeedVideoPoolProvider({
  children,
  posts,
  activePostId,
  detailPostId,
  openVideoDetail,
  closeVideoDetail,
  onReelsLoadMore,
  onReelsActivePostChange,
  onReelsHidePost,
}: FeedVideoPoolProviderProps) {
  const videoPosts = useMemo(
    () => posts.filter((p) => Boolean(p.videoUrl)),
    [posts],
  );

  const contextValue = useMemo<FeedVideoPoolContextValue>(
    () => ({
      activePostId,
      videoPosts,
      detailPostId,
      openVideoDetail,
      closeVideoDetail,
      onReelsLoadMore,
      onReelsActivePostChange,
      onReelsHidePost,
    }),
    [
      activePostId,
      videoPosts,
      detailPostId,
      openVideoDetail,
      closeVideoDetail,
      onReelsLoadMore,
      onReelsActivePostChange,
      onReelsHidePost,
    ],
  );

  return (
    <FeedVideoPoolContext.Provider value={contextValue}>
      {children}
    </FeedVideoPoolContext.Provider>
  );
}

export function FeedVideoLayout({ children }: { children: React.ReactNode }) {
  return <View style={styles.feedLayout}>{children}</View>;
}

export function useFeedVideoPool(): FeedVideoPoolContextValue {
  const ctx = useContext(FeedVideoPoolContext);
  if (!ctx) {
    throw new Error('useFeedVideoPool must be used within FeedVideoPoolProvider');
  }
  return ctx;
}

export function useFeedVideoPoolOptional(): FeedVideoPoolContextValue | null {
  return useContext(FeedVideoPoolContext);
}

const styles = StyleSheet.create({
  feedLayout: {
    flex: 1,
    position: 'relative',
  },
});
