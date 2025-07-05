import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

export interface ChatMessagePayload {
  sender_id: number;
  receiver_id: number;
  message: string;
  conversation_id?: number; // Optional for marketplace messages
}

export const sendChatMessage = async (
  data: ChatMessagePayload,
  token: string
): Promise<any> => {
  return await apiCall(
    API_ENDPOINTS.USER.CHAT_MESSAGES.Create,
    "POST",
    data,
    token
  );
};
export const sendMarketPlaceMessage = async (
  data: ChatMessagePayload,
  token: string
): Promise<any> => {
  return await apiCall(
    API_ENDPOINTS.USER.CHAT_MESSAGES.MarketPlace,
    "POST",
    data,
    token
  );
};
