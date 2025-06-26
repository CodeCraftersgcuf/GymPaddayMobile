import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

export const getUserGifts = async (token: string): Promise<any> => {
  return await apiCall(API_ENDPOINTS.USER.GIFTS.List, "GET", undefined, token);
};

