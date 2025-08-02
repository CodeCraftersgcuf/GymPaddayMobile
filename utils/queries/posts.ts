import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

export const getUserPosts = async (token: string, page: number = 1, limit: number = 4): Promise<any> => {
  const url = `${API_ENDPOINTS.USER.POSTS.List}?page=${page}&limit=${limit}`;
  return await apiCall(url, "GET", undefined, token);
};


export const getPostById = async (id: number, token: string): Promise<any> => {
  return await apiCall(API_ENDPOINTS.USER.POSTS.Show(id), "GET", undefined, token);
};
