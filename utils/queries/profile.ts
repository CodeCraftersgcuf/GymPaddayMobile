// src/api/queries/profile.ts

import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

export const fetchUserProfile = async (token: string, userId: number): Promise<any> => {
  const url = API_ENDPOINTS.USER.PROFILE.PROFILE(userId);
  return await apiCall(url, "GET", undefined, token);
};
