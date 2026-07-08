import React, { useEffect } from 'react';
import { useFeedVideo } from '@/contexts/FeedVideoContext';
import { useFeedVideoPool } from '@/contexts/FeedVideoPoolContext';
import FeedReelsViewer from '@/components/Social/FeedReelsViewer';

type FeedVideoOverlayProps = {
  /** Close the reels viewer when the feed tab is blurred or app is backgrounded. */
  paused?: boolean;
};

export default function FeedVideoOverlay({ paused = false }: FeedVideoOverlayProps) {
  const { isMuted, toggleMuted } = useFeedVideo();
  const {
    detailPostId,
    videoPosts,
    closeVideoDetail,
    onReelsLoadMore,
    onReelsActivePostChange,
    onReelsHidePost,
  } = useFeedVideoPool();

  useEffect(() => {
    if (paused && detailPostId != null) {
      closeVideoDetail();
    }
  }, [paused, detailPostId, closeVideoDetail]);

  return (
    <FeedReelsViewer
      visible={detailPostId != null}
      videoPosts={videoPosts}
      initialPostId={detailPostId}
      isMuted={isMuted}
      onToggleMute={toggleMuted}
      onClose={closeVideoDetail}
      onActivePostChange={onReelsActivePostChange}
      onLoadMore={onReelsLoadMore}
      onHidePost={onReelsHidePost}
    />
  );
}
