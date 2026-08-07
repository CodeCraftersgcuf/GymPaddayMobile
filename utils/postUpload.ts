import * as FileSystem from 'expo-file-system/legacy';
import { API_ENDPOINTS } from '@/apiConfig';

const UPLOAD_TIMEOUT_MS = 15 * 60 * 1000; // 15 min for large videos on slow networks

export type PostUploadProgress = {
  loaded: number;
  total: number;
  percent: number;
};

export type PostUploadFile = {
  uri: string;
  name: string;
  type: string;
};

export type PostUploadFields = {
  title?: string;
  content?: string;
};

function percentFrom(loaded: number, total: number): number {
  if (total > 0) return Math.min(99, Math.round((loaded / total) * 100));
  return 0;
}

/** Native multipart upload — same path stories use (more reliable than XHR on Android). */
async function uploadWithFileSystem(
  url: string,
  token: string,
  file: PostUploadFile,
  fields: PostUploadFields,
  onProgress?: (progress: PostUploadProgress) => void,
): Promise<any> {
  const parameters: Record<string, string> = {};
  if (fields.title) parameters.title = fields.title;
  if (fields.content) parameters.content = fields.content;

  // Prefer uploadAsync (battle-tested in story upload). Progress is coarse but stable.
  onProgress?.({ loaded: 0, total: 1, percent: 5 });

  const uploadPromise = FileSystem.uploadAsync(url, file.uri, {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    fieldName: 'media[]',
    mimeType: file.type,
    parameters,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Upload timed out. Try again on a stronger connection or a smaller video.'));
    }, UPLOAD_TIMEOUT_MS);
  });

  const uploadResult = await Promise.race([uploadPromise, timeoutPromise]);
  onProgress?.({ loaded: 1, total: 1, percent: 95 });

  const text = uploadResult.body ?? '';
  let result: any;
  try {
    result = JSON.parse(text);
  } catch {
    throw new Error(`Server error (${uploadResult.status}): invalid response`);
  }

  if (uploadResult.status < 200 || uploadResult.status >= 300) {
    throw new Error(result?.message || `Upload failed (${uploadResult.status})`);
  }

  onProgress?.({ loaded: 1, total: 1, percent: 100 });
  return result;
}

/** Multipart XHR — used when posting multiple media files. */
function uploadWithXhr(
  url: string,
  token: string,
  data: FormData,
  onProgress?: (progress: PostUploadProgress) => void,
): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.timeout = UPLOAD_TIMEOUT_MS;

    xhr.upload.onprogress = (event) => {
      if (!onProgress) return;
      if (event.lengthComputable && event.total > 0) {
        onProgress({
          loaded: event.loaded,
          total: event.total,
          percent: percentFrom(event.loaded, event.total),
        });
      } else if (event.loaded > 0) {
        onProgress({ loaded: event.loaded, total: 0, percent: 0 });
      }
    };

    xhr.onload = () => {
      const text = xhr.responseText ?? '';
      let result: any;
      try {
        result = JSON.parse(text);
      } catch {
        reject(new Error(`Server error (${xhr.status}): invalid response`));
        return;
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(result?.message || `Upload failed (${xhr.status})`));
        return;
      }
      onProgress?.({ loaded: 1, total: 1, percent: 100 });
      resolve(result);
    };

    xhr.onerror = () => {
      reject(
        new Error(
          'Upload could not reach the server. Check your connection, or try a smaller video.',
        ),
      );
    };

    xhr.ontimeout = () => {
      reject(new Error('Upload timed out. Try again on a stronger connection or a smaller video.'));
    };

    xhr.send(data);
  });
}

/**
 * Upload a new post. Single-file posts use native FileSystem upload (more reliable on Android).
 * Multi-file posts use XHR FormData.
 */
export async function uploadPostMultipart(
  data: FormData,
  token: string,
  onProgress?: (progress: PostUploadProgress) => void,
  options?: {
    files?: PostUploadFile[];
    fields?: PostUploadFields;
  },
): Promise<any> {
  const url = API_ENDPOINTS.USER.POSTS.Create;
  const files = options?.files ?? [];
  const fields = options?.fields ?? {};

  if (files.length === 1) {
    return uploadWithFileSystem(url, token, files[0], fields, onProgress);
  }

  return uploadWithXhr(url, token, data, onProgress);
}
