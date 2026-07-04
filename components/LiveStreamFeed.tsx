// components/LiveStreamFeed.tsx
import React, { useMemo } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import LiveCard from './LiveCard';
import { isLiveStreamDiscoverable, liveStreamListKey } from '@/utils/liveStreamStatus';

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
    <FlatList
      data={activeStreams}
      extraData={activeStreams}
      keyExtractor={(item) => liveStreamListKey(item as Record<string, unknown>)}
      contentContainerStyle={styles.container}
      removeClippedSubviews={false}
      renderItem={({ item }) => {
        const postImageUrl =
          item?.user?.latest_image_post?.media?.[0]?.url ||
          item?.user?.profile_picture_url ||
          '';
        const profilePictureUrl = item?.user?.profile_picture_url || '';

        return (
          <View style={styles.cardWrapper}>
            <LiveCard
              id={item?.id}
              postImageUrl={postImageUrl}
              profilePictureUrl={profilePictureUrl}
              title={item?.title}
              userName={item?.user?.fullname || item?.user?.username}
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
      }}
    />
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
