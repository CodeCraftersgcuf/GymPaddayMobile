import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

interface GetTokenPayload {
  channel_name: string;
  uid: number;
}

export const getVideoToken = async (data: GetTokenPayload, token: string) => {
  console.log("Fetching video token with data:", data);
  return await apiCall(API_ENDPOINTS.USER.VIDEO_CALLS.Token, "POST", data, token);
};

interface StartCallPayload {
  receiver_id: number;
  channel_name: string;
  type: 'voice' | 'video';
}

export const startVideoCall = async (data: StartCallPayload, token: string) => {
  return await apiCall(API_ENDPOINTS.USER.VIDEO_CALLS.StartCall, "POST", data, token);
};

interface EndCallPayload {
  channel_name?: string;
  call_id?: number;
}

export const endVideoCall = async (data: EndCallPayload, token: string) => {
  return await apiCall(API_ENDPOINTS.USER.VIDEO_CALLS.EndCall, "POST", data, token);
};
