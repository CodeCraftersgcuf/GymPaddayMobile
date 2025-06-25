import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

export const getUserComments = async (token: string, postId?: number): Promise<any> => {
  const url = postId 
    ? `${API_ENDPOINTS.USER.COMMENTS.List}?post_id=${postId}`
    : API_ENDPOINTS.USER.COMMENTS.List;
  return await apiCall(url, "GET", undefined, token);
};

export const getCommentById = async (id: number, token: string): Promise<any> => {
  return await apiCall(API_ENDPOINTS.USER.COMMENTS.Show(id), "GET", undefined, token);
};
