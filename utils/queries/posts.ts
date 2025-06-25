import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

export const getUserPosts = async (token: string): Promise<any> => {
  return await apiCall(API_ENDPOINTS.USER.POSTS.List, "GET", undefined, token);
};

export const getPostById = async (id: number, token: string): Promise<any> => {
  return await apiCall(API_ENDPOINTS.USER.POSTS.Show(id), "GET", undefined, token);
};
