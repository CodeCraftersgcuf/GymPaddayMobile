import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

export const createPost = async ({
  data,
  token,
}: {
  data: FormData;
  token: string;
}) => {
  return await apiCall(API_ENDPOINTS.USER.POSTS.Create, 'POST', data, token);
};



export const updatePost = async ({
  id,
  data,
  token
}: {
  id: number;
  data: {
    title?: string;
    content?: string;
    media_url?: string;
  };
  token: string;
}) => {
  return await apiCall(API_ENDPOINTS.USER.POSTS.Update(id), "PUT", data, token);
};

export const deletePost = async ({
  id,
  token
}: {
  id: number;
  token: string;
}) => {
  return await apiCall(API_ENDPOINTS.USER.POSTS.Delete(id), "DELETE", undefined, token);
};
