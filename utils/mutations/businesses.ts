import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

export const createBusiness = async ({
  token,
  data,
}: {
  token: string;
  data: FormData;
}) => {
  return await apiCall(API_ENDPOINTS.USER.BUSINESSES.Create, "POST", data, token);
};
