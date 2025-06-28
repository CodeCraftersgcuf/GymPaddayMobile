import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

interface ChatMessagePayload {
  sender_id: number;
  receiver_id: number;
  message: string;
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
