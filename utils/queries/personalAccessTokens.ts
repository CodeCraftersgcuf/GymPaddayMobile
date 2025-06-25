import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

export const getPersonalAccessTokens = async (token: string): Promise<any> => {
  return await apiCall(API_ENDPOINTS.PERSONAL_ACCESS_TOKENS.List, "GET", undefined, token);
};

export const getPersonalAccessTokenById = async (id: number, token: string): Promise<any> => {
  return await apiCall(API_ENDPOINTS.PERSONAL_ACCESS_TOKENS.Show(id), "GET", undefined, token);
};
