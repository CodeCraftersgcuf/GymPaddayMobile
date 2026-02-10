import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

export const createComment = async ({
  data,
  token
}: {
  data: {
    post_id: number;
    content: string;
  };
  token: string;
}) => {
  return await apiCall(API_ENDPOINTS.USER.COMMENTS.Create, "POST", data, token);
};

export const updateComment = async ({
  id,
  data,
  token
}: {
  id: number;
  data: {
    content: string;
  };
  token: string;
}) => {
  return await apiCall(API_ENDPOINTS.USER.COMMENTS.Update(id), "PUT", data, token);
};

export const deleteComment = async ({
  id,
  token
}: {
  id: number;
  token: string;
}) => {
  try {
    const response = await fetch(API_ENDPOINTS.USER.COMMENTS.Delete(id), {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.message || `HTTP error! status: ${response.status}`);
    }

    return result;
  } catch (error: any) {
    console.error('❌ Delete Comment Error:', error);
    throw error;
  }
};
