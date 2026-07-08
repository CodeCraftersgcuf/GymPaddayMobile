import * as FileSystem from 'expo-file-system/legacy';
import { acquireDownloadSlot } from '@/utils/networkQuality';

const DEFAULT_STALL_MS = 30_000;
const DEFAULT_TOTAL_MS = 120_000;

export type DownloadOptions = {
  minBytes?: number;
  stallMs?: number;
  totalMs?: number;
};

function normalizeLocalUri(path: string): string {
  if (!path) return path;
  if (path.startsWith('file://') || path.startsWith('http')) return path;
  return path.startsWith('/') ? `file://${path}` : `file:///${path}`;
}

/**
 * Download a remote file with stall watchdog (no progress for N seconds = abort)
 * and a global concurrent-download cap.
 */
export async function downloadMediaFile(
  remoteUrl: string,
  localPath: string,
  options: DownloadOptions = {},
): Promise<string | null> {
  const minBytes = options.minBytes ?? 1;
  const stallMs = options.stallMs ?? DEFAULT_STALL_MS;
  const totalMs = options.totalMs ?? DEFAULT_TOTAL_MS;

  const existing = await FileSystem.getInfoAsync(localPath);
  if (existing.exists && (existing.size ?? 0) >= minBytes) {
    return normalizeLocalUri(localPath);
  }
  if (existing.exists) {
    await FileSystem.deleteAsync(localPath, { idempotent: true }).catch(() => {});
  }

  const release = await acquireDownloadSlot();
  let lastBytes = 0;
  let lastProgressAt = Date.now();
  let finished = false;

  const progressCallback = (progress: FileSystem.DownloadProgressData) => {
    const written = progress.totalBytesWritten ?? 0;
    if (written > lastBytes) {
      lastBytes = written;
      lastProgressAt = Date.now();
    }
  };

  const resumable = FileSystem.createDownloadResumable(
    remoteUrl,
    localPath,
    {},
    progressCallback,
  );

  const stallWatch = setInterval(() => {
    if (finished) return;
    if (Date.now() - lastProgressAt >= stallMs) {
      finished = true;
      clearInterval(stallWatch);
      FileSystem.deleteAsync(localPath, { idempotent: true }).catch(() => {});
    }
  }, 2000);

  try {
    const downloadPromise = resumable.downloadAsync();
    const result = await Promise.race([
      downloadPromise,
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), totalMs);
      }),
    ]);

    finished = true;
    clearInterval(stallWatch);

    if (!result?.uri) {
      await FileSystem.deleteAsync(localPath, { idempotent: true }).catch(() => {});
      return null;
    }
    if (typeof result.status === 'number' && result.status >= 400) {
      await FileSystem.deleteAsync(localPath, { idempotent: true }).catch(() => {});
      return null;
    }

    const saved = await FileSystem.getInfoAsync(localPath);
    if (!saved.exists || (saved.size ?? 0) < minBytes) {
      await FileSystem.deleteAsync(localPath, { idempotent: true }).catch(() => {});
      return null;
    }

    return normalizeLocalUri(result.uri || localPath);
  } catch {
    finished = true;
    clearInterval(stallWatch);
    await FileSystem.deleteAsync(localPath, { idempotent: true }).catch(() => {});
    return null;
  } finally {
    release();
  }
}
