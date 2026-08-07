import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

export const getMyWithdrawals = async (token: string): Promise<any> => {
  return await apiCall(API_ENDPOINTS.USER.WITHDRAWALS.List, "GET", undefined, token);
};

export interface WithdrawalBank {
  id: string;
  code: string;
  name: string;
}

export const getWithdrawalBanks = async (token: string): Promise<WithdrawalBank[]> => {
  const response = await apiCall(API_ENDPOINTS.USER.WITHDRAWALS.Banks, "GET", undefined, token);
  return Array.isArray(response?.data) ? response.data : [];
};
