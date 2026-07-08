import { resolveMediaUrl, resolveVideoPlaybackUrl } from '@/utils/mediaUrl';

export function mapPostFromApi(post: any) {
  const videoMedia = post.media?.find((m: any) => m.media_type === 'video');

  return {
    id: Number(post.id),
    user: {
      id: post.user?.id,
      username: post.user?.username,
      profile_picture: resolveMediaUrl(post.user?.profile_picture_url),
    },
    content: post.content || post.title || '',
    imagesUrl:
      post.media
        ?.filter((m: any) => m.media_type === 'image')
        .map((m: any) => resolveMediaUrl(m.url))
        .filter(Boolean) || [],
    videoUrl: resolveVideoPlaybackUrl(videoMedia),
    videoMp4Url: videoMedia ? resolveMediaUrl(videoMedia.url) : null,
    videoThumbnailUrl: videoMedia
      ? resolveMediaUrl(videoMedia.thumbnail_url || videoMedia.thumbnail)
      : null,
    timestamp: post.created_at,
    is_liked: Boolean(post.is_liked),
    likes_count: post.likes_count ?? post.likes?.length ?? 0,
    comments_count:
      post.all_comments_count ?? post.comments_count ?? post.comments?.length ?? 0,
    view_count: post.view_count ?? 0,
    share_count: post.share_count ?? 0,
    publish_status: post.publish_status,
    likes:
      post.likes?.map((like: any) => ({
        id: like.id,
        user: {
          id: like.user?.id,
          username: like.user?.username || 'Unknown',
          fullname: like.user?.fullname || '',
          profile_picture_url: resolveMediaUrl(like.user?.profile_picture_url) || '',
        },
      })) || [],
    recent_comments:
      post.comments?.slice(0, 2).map((comment: any) => ({
        id: comment.id,
        user: {
          username: comment.user?.username || 'Unknown',
          profile_picture: resolveMediaUrl(comment.user?.profile_picture_url) || '',
        },
        text: comment.content || '',
      })) || [],
  };
}
