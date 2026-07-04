// src/api/queries/profile.ts

import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

export const fetchUserProfile = async (
  token: string,
  userId: number,
  page = 1,
  limit = 9,
): Promise<any> => {
  const url = `${API_ENDPOINTS.USER.PROFILE.PROFILE(userId)}?page=${page}&limit=${limit}`;
  return await apiCall(url, "GET", undefined, token);
};
