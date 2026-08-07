import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

export interface WithdrawalPayload {
  /** Naira payout amount. GP is derived server-side at the fixed rate. */
  amount: number;
  verification_token: string;
  client_reference: string;
}

export const requestWithdrawal = async ({
  data,
  token,
}: {
  data: WithdrawalPayload;
  token: string;
}) => {
  return await apiCall(API_ENDPOINTS.USER.WITHDRAWALS.Create, "POST", data, token);
};

export const resolveWithdrawalAccount = async ({
  bankCode,
  accountNumber,
  token,
}: {
  bankCode: string;
  accountNumber: string;
  token: string;
}) => {
  return await apiCall(
    API_ENDPOINTS.USER.WITHDRAWALS.ResolveAccount,
    "POST",
    {
      bank_code: bankCode,
      account_number: accountNumber,
    },
    token
  );
};
