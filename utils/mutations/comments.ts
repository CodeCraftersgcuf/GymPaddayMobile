import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

export const createComment = async ({
  data,
  token
}: {
  data: {
    post_id: number;
    content: string;
    parent_id?: number | null;
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
  return await apiCall(API_ENDPOINTS.USER.COMMENTS.Delete(id), "DELETE", undefined, token);
};
