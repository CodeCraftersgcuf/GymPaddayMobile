import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

export const fetchChatMessages = async (
  token: string,
  conversationId?: number
): Promise<any> => {
  const queryParam = conversationId ? `?conversation_id=${conversationId}` : "";
  const url = `${API_ENDPOINTS.USER.CHAT_MESSAGES.List}${queryParam}`;
  
  return await apiCall(url, "GET", undefined, token);
};

// ✅ Fetch list of conversations (connected users)
export const fetchConnectedUsers = async (token: string): Promise<any> => {
  return await apiCall(
    API_ENDPOINTS.USER.CHAT_MESSAGES.ConnectedUsers,
    "GET",
    undefined,
    token
  );
};
