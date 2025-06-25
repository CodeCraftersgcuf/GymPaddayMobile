import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

export const createTransaction = async ({
  data,
  token
}: {
  data: {
    wallet_id: number;
    amount: number;
    type: string;
  };
  token: string;
}) => {
  return await apiCall(API_ENDPOINTS.USER.TRANSACTIONS.Create, "POST", data, token);
};

export const updateTransaction = async ({
  id,
  data,
  token
}: {
  id: number;
  data: {
    amount?: number;
    type?: string;
  };
  token: string;
}) => {
  return await apiCall(API_ENDPOINTS.USER.TRANSACTIONS.Update(id), "PUT", data, token);
};

export const deleteTransaction = async ({
  id,
  token
}: {
  id: number;
  token: string;
}) => {
  return await apiCall(API_ENDPOINTS.USER.TRANSACTIONS.Delete(id), "DELETE", undefined, token);
};
