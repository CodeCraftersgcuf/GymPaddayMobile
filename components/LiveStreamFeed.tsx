// components/LiveStreamFeed.tsx
import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import LiveCard from './LiveCard';
import { isLiveStreamDiscoverable, liveStreamListKey } from '@/utils/liveStreamStatus';
import { resolveMediaUrl } from '@/utils/mediaUrl';

/** Skip brand logo / empty paths that were used as fake "profile" images. */
function isUsableUserPhoto(url?: string | null): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  if (lower.includes('/logo.png') || lower.includes('/logo-') || lower.endsWith('/logo')) {
    return false;
  }
  if (lower.includes('adaptive-icon') || lower.includes('app-icon')) {
    return false;
  }
  return true;
}

function resolveUserPhoto(...candidates: Array<string | null | undefined>): string | null {
  for (const raw of candidates) {
    const resolved = resolveMediaUrl(raw);
    if (resolved && isUsableUserPhoto(resolved)) return resolved;
  }
  return null;
}

/** Renders live cards without FlatList so it can sit inside a parent ScrollView. */
const LiveStreamFeed = ({ streams }: { streams: any[] }) => {
  const activeStreams = useMemo(
    () =>
      (Array.isArray(streams) ? streams : []).filter((item) =>
        isLiveStreamDiscoverable(item as Record<string, unknown>)
      ),
    [streams]
  );

  if (!activeStreams.length) return null;

  return (
    <View style={styles.container}>
      {activeStreams.map((item) => {
        const displayName =
          item?.user?.fullname || item?.user?.username || 'Live user';

        const profilePictureUrl = resolveUserPhoto(
          item?.user?.profile_picture_url,
          item?.user?.profile_picture,
        );

        const latestPostMediaUrl = resolveUserPhoto(
          item?.user?.latest_image_post?.media?.[0]?.url,
        );
        // Prefer profile photo for the card; local silhouette via LiveCard when missing
        const postImageUrl = profilePictureUrl || latestPostMediaUrl || null;

        return (
          <View
            key={liveStreamListKey(item as Record<string, unknown>)}
            style={styles.cardWrapper}
          >
            <LiveCard
              id={item?.id}
              postImageUrl={postImageUrl}
              profilePictureUrl={profilePictureUrl}
              title={item?.title}
              userName={displayName}
              viewers={
                typeof item?.current_viewers_count === 'number'
                  ? item.current_viewers_count
                  : Array.isArray(item?.audiences)
                    ? item.audiences.filter((a: any) => a?.left_at == null).length
                    : 0
              }
              channelName={item?.agora_channel}
              timeAgo="Live now"
            />
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  cardWrapper: {
    marginBottom: 16,
  },
});

export default LiveStreamFeed;
