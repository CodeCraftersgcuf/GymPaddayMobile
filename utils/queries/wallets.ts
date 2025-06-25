import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

export const getUserWallets = async (token: string): Promise<any> => {
  return await apiCall(API_ENDPOINTS.USER.WALLETS.List, "GET", undefined, token);
};

export const getWalletById = async (id: number, token: string): Promise<any> => {
  return await apiCall(API_ENDPOINTS.USER.WALLETS.Show(id), "GET", undefined, token);
};
