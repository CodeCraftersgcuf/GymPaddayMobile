import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

// Notifications
export const getUserNotifications = async (token: string): Promise<any> => {
  return await apiCall(API_ENDPOINTS.USER.NOTIFICATIONS.List, "GET", undefined, token);
};

export const getNotificationById = async (id: number, token: string): Promise<any> => {
  return await apiCall(API_ENDPOINTS.USER.NOTIFICATIONS.Show(id), "GET", undefined, token);
};

// Chat Messages
export const getChatMessages = async (token: string): Promise<any> => {
  return await apiCall(API_ENDPOINTS.USER.CHAT_MESSAGES.List, "GET", undefined, token);
};

export const getChatMessageById = async (id: number, token: string): Promise<any> => {
  return await apiCall(API_ENDPOINTS.USER.CHAT_MESSAGES.Show(id), "GET", undefined, token);
};

// Tickets
export const getUserTickets = async (token: string): Promise<any> => {
  return await apiCall(API_ENDPOINTS.USER.TICKETS.List, "GET", undefined, token);
};

export const getTicketById = async (id: number, token: string): Promise<any> => {
  return await apiCall(API_ENDPOINTS.USER.TICKETS.Show(id), "GET", undefined, token);
};

// Video Calls
export const getVideoCalls = async (token: string): Promise<any> => {
  return await apiCall(API_ENDPOINTS.USER.VIDEO_CALLS.List, "GET", undefined, token);
};

export const getVideoCallById = async (id: number, token: string): Promise<any> => {
  return await apiCall(API_ENDPOINTS.USER.VIDEO_CALLS.Show(id), "GET", undefined, token);
};
