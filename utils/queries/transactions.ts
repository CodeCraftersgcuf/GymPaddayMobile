import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

export const getUserTransaction = async (token: string): Promise<any> => {
  return await apiCall(API_ENDPOINTS.USER.TRANSACTIONS.List, "GET", undefined, token);
};

