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

  // ✅ Set correct Content-Type header for FormData on Android (RN quirk)
  if (isFormData && Platform.OS === 'android') {
    headers['Content-Type'] = 'multipart/form-data';
  } else if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    let response: AxiosResponse | undefined;

    switch (method.toUpperCase()) {
      case 'GET':
        response = await axios.get(url, { headers, timeout: 10000 });
        break;
      case 'POST':
        response = await axios.post(url, data, { headers, timeout: 10000 });
        break;
      case 'PUT':
        response = await axios.put(url, data, { headers, timeout: 10000 });
        break;
      case 'DELETE':
        response = await axios.delete(url, { headers, timeout: 10000 });
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
        throw new ApiError(
          error.response.data,
          error.response.statusText,
          error.response.data?.message || 'Something went wrong',
          error.response.status
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
