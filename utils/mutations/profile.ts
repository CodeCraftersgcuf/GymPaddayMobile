import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

export const editUserProfile = async ({
  token,
  data,
}: {
  token: string;
  data: FormData;
}) => {
  return await apiCall(API_ENDPOINTS.USER.PROFILE.EditProfile, 'POST', data, token);
};