import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

export const createGift = async ({
  data,
  token
}: {
  data: {
    to_user_id: number;
    name: string;
    value: number;
    message?: string;
  };
  token: string;
}) => {
  return await apiCall(API_ENDPOINTS.USER.GIFTS.Create, "POST", data, token);
};

export const updateGift = async ({
  id,
  data,
  token
}: {
  id: number;
  data: {
    name?: string;
    value?: number;
    message?: string;
  };
  token: string;
}) => {
  return await apiCall(API_ENDPOINTS.USER.GIFTS.Update(id), "PUT", data, token);
};
