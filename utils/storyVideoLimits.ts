/** Max story video length in seconds. */
export const STORY_VIDEO_MAX_SECONDS = 30;

export type StoryTrimParams = {
  trimStart: number;
  trimDuration: number;
};

/** ImagePicker duration is milliseconds; treat values &lt; 1000 as already seconds. */
export function storyVideoDurationSeconds(duration?: number | null): number {
  if (duration == null || !Number.isFinite(duration) || duration <= 0) return 0;
  if (duration > 1000) return duration / 1000;
  return duration;
}

export function needsStoryVideoTrim(duration?: number | null): boolean {
  return storyVideoDurationSeconds(duration) > STORY_VIDEO_MAX_SECONDS + 0.25;
}
