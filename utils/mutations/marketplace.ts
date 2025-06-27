import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

export const createMarketplaceListing = async ({
  token,
  data,
}: {
  token: string;
  data: FormData;
}) => {
  return await apiCall(API_ENDPOINTS.USER.MARKETPLACE_LISTINGS.Create, 'POST', data, token);
};
