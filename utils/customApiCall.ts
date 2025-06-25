import axios, { AxiosResponse } from 'axios';

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
    super();
    this.data = data;
    this.message = message;
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
  let headers;
  headers = {
    Authorization: token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };

  if (data && data instanceof FormData) {
    headers['Content-Type'] = 'multipart/form-data';
  }

  try {
    let response: AxiosResponse | undefined;
    switch (method) {
      case 'GET':
        response = await axios.get(url, { headers });
        break;
      case 'POST':
        response = await axios.post(url, data, { headers });
        break;
      case 'PUT':
        response = await axios.put(url, data, { headers });
        break;
      case 'DELETE':
        response = await axios.delete(url, { headers });
        break;
      default:
        throw new Error('Unsupported HTTP method');
    }
    // console.log(response?.data)
    return response?.data;
  } catch (error) {
    console.log(error);
    if (axios.isAxiosError(error) && error.response) {
      throw new ApiError(
        error.response.data,
        error.response.data?.status || error.response.statusText,
        error.response.data?.message || 'Something Went wrong',
        error.response.status
      );
    } else {
      throw new ApiError(
        undefined,
        'Network or server error occurred',
        'Something went wrong'
      );
    }
  }
};
