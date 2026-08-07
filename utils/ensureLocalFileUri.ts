import * as FileSystem from 'expo-file-system/legacy';

/**
 * Copy picker / content URIs to a stable cache file:// path.
 * Android content:// (and some ph://) URIs often fail mid-XHR with a generic network error.
 */
export async function ensureLocalFileUri(uri: string, ext: string): Promise<string> {
  if (!uri || typeof uri !== 'string') {
    throw new Error('Missing media file');
  }

  const normalizedExt = ext.replace(/^\./, '') || 'bin';
  const lower = uri.toLowerCase();

  // Already a normal local file — keep as-is unless copy is needed for content wrappers.
  if (lower.startsWith('file://') && !lower.includes('content://')) {
    return uri;
  }

  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    return uri;
  }

  const dest = `${FileSystem.cacheDirectory}post-upload-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${normalizedExt}`;

  try {
    await FileSystem.copyAsync({ from: uri, to: dest });
    return dest;
  } catch {
    if (uri.startsWith('file://')) return uri;
    throw new Error('Could not prepare media for upload. Try selecting the file again.');
  }
}
