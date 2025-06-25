import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

export const createWallet = async ({
  data,
  token
}: {
  data: {
    balance: number;
  };
  token: string;
}) => {
  return await apiCall(API_ENDPOINTS.USER.WALLETS.Create, "POST", data, token);
};

export const updateWallet = async ({
  id,
  data,
  token
}: {
  id: number;
  data: {
    balance: number;
  };
  token: string;
}) => {
  return await apiCall(API_ENDPOINTS.USER.WALLETS.Update(id), "PUT", data, token);
};

export const deleteWallet = async ({
  id,
  token
}: {
  id: number;
  token: string;
}) => {
  return await apiCall(API_ENDPOINTS.USER.WALLETS.Delete(id), "DELETE", undefined, token);
};

export const topUpWallet = async ({
  data,
  token
}: {
  data: {
    amount: number;
  };
  token: string;
}) => {
  return await apiCall(API_ENDPOINTS.USER.WALLETS.TopUp, "POST", data, token);
};

export const withdrawFromWallet = async ({
  data,
  token
}: {
  data: {
    amount: number;
  };
  token: string;
}) => {
  return await apiCall(API_ENDPOINTS.USER.WALLETS.Withdraw, "POST", data, token);
};
