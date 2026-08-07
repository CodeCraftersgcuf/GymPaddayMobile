/** Matches backend StorePostRequest `max:102400` (kilobytes). */
export const POST_VIDEO_MAX_SIZE_MB = 100;
export const POST_VIDEO_MAX_SIZE_BYTES = POST_VIDEO_MAX_SIZE_MB * 1024 * 1024;
export const POST_MAX_MEDIA_COUNT = 10;

export const POST_VIDEO_LIMIT_LABEL = `Videos: up to ${POST_VIDEO_MAX_SIZE_MB}MB each (1 video per post).`;
