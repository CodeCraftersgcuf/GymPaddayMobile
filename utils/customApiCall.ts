import axios, { AxiosResponse } from 'axios';
import { Platform } from 'react-native'; // ✅ Important for RN platform detection

export class ApiError extends Error {
  data: any;
  statusText: string = '';
  statusCode?: number;

  constructor(
    data: any,
    statusText: string,
    message: string,
    statusCode?: number
  ) {
    super(message);
    this.data = data;
    this.statusText = statusText;
    this.statusCode = statusCode;
  }
}

export const apiCall = async (
  url: string,
  method: string,
  data?: any,
  token?: string
) => {
  const isFormData = data instanceof FormData;

  const headers: any = {
    Authorization: token ? `Bearer ${token}` : '',
  };

  // ✅ Don't set Content-Type for FormData - let React Native handle it automatically
  // Setting it manually can cause issues with boundary parameters
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  // For FormData, React Native will automatically set Content-Type with boundary

  // ✅ Increase timeout for file uploads (FormData requests) and slow connections
  const timeout = isFormData ? 60000 : 30000; // 60 seconds for uploads, 30 seconds for regular requests

  try {
    let response: AxiosResponse | undefined;

    const axiosConfig = {
      headers,
      timeout,
      maxContentLength: Infinity, // Allow large file uploads
      maxBodyLength: Infinity, // Allow large file uploads
    };

    switch (method.toUpperCase()) {
      case 'GET':
        response = await axios.get(url, axiosConfig);
        break;
      case 'POST':
        response = await axios.post(url, data, axiosConfig);
        break;
      case 'PUT':
        response = await axios.put(url, data, axiosConfig);
        break;
      case 'DELETE':
        response = await axios.delete(url, axiosConfig);
        break;
      default:
        throw new Error('Unsupported HTTP method');
    }

    return response?.data;
  } catch (error) {
    console.error('❌ Axios Error:', error);

    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        message: error.message,
        code: error.code,
        config: error.config,
        request: error.request,
        response: error.response,
        toJSON: error.toJSON ? error.toJSON() : undefined,
        isAxiosError: error.isAxiosError,
      });

      if (error.response) {
        const status = error.response.status;
        const responseData = error.response.data;
        
        // Handle rate limiting (429) with user-friendly message
        if (status === 429) {
          const retryAfter = error.response.headers['retry-after'] || '60';
          const message = `Too many requests. Please wait ${retryAfter} seconds before trying again.`;
          
          console.warn('⚠️ Rate limit exceeded:', {
            retryAfter,
            limit: error.response.headers['x-ratelimit-limit'],
            remaining: error.response.headers['x-ratelimit-remaining'],
            reset: error.response.headers['x-ratelimit-reset'],
          });
          
          throw new ApiError(
            responseData,
            error.response.statusText,
            message,
            status
          );
        }
        
        throw new ApiError(
          responseData,
          error.response.statusText,
          responseData?.message || 'Something went wrong',
          status
        );
      }
    }

    console.error('Generic error details:', {
      message: error.message,
      stack: error.stack,
      ...error
    });

    throw new ApiError(
      undefined,
      'Network Error',
      'Something went wrong. Please check your connection or API URL.'
    );
  }
};
