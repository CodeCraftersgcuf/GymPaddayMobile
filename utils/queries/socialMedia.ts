import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

// Live Streams
export const getLiveStreams = async (token: string): Promise<any> => {
  return await apiCall(API_ENDPOINTS.USER.LIVE_STREAMS.List, "GET", undefined, token);
};

export const getLiveStreamById = async (id: number, token: string): Promise<any> => {
  return await apiCall(API_ENDPOINTS.USER.LIVE_STREAMS.Show(id), "GET", undefined, token);
};

// Reels
export const getReels = async (token: string): Promise<any> => {
  return await apiCall(API_ENDPOINTS.USER.REELS.List, "GET", undefined, token);
};

export const getReelById = async (id: number, token: string): Promise<any> => {
  return await apiCall(API_ENDPOINTS.USER.REELS.Show(id), "GET", undefined, token);
};

// Likes
export const getUserLikes = async (token: string): Promise<any> => {
  return await apiCall(API_ENDPOINTS.USER.LIKES.List, "GET", undefined, token);
};

export const getLikeById = async (id: number, token: string): Promise<any> => {
  return await apiCall(API_ENDPOINTS.USER.LIKES.Show(id), "GET", undefined, token);
};

// Shares
export const getUserShares = async (token: string): Promise<any> => {
  return await apiCall(API_ENDPOINTS.USER.SHARES.List, "GET", undefined, token);
};

export const getShareById = async (id: number, token: string): Promise<any> => {
  return await apiCall(API_ENDPOINTS.USER.SHARES.Show(id), "GET", undefined, token);
};

// Follows
export const getUserFollows = async (token: string): Promise<any> => {
  return await apiCall(API_ENDPOINTS.USER.FOLLOWS.List, "GET", undefined, token);
};

export const getFollowById = async (id: number, token: string): Promise<any> => {
  return await apiCall(API_ENDPOINTS.USER.FOLLOWS.Show(id), "GET", undefined, token);
};
