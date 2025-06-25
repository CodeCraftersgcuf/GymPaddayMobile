import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

export const getUserBusinesses = async (token: string): Promise<any> => {
  return await apiCall(API_ENDPOINTS.USER.BUSINESSES.List, "GET", undefined, token);
};

export const getBusinessById = async (id: number, token: string): Promise<any> => {
  return await apiCall(API_ENDPOINTS.USER.BUSINESSES.Show(id), "GET", undefined, token);
};
