import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

export const getAdCampaigns = async (token: string): Promise<any> => {
  return await apiCall(API_ENDPOINTS.USER.AD_CAMPAIGNS.List, "GET", undefined, token);
};

export const getAdCampaignById = async (id: number, token: string): Promise<any> => {
  return await apiCall(API_ENDPOINTS.USER.AD_CAMPAIGNS.Show(id), "GET", undefined, token);
};

export const getAdInsights = async (token: string): Promise<any> => {
  return await apiCall(API_ENDPOINTS.USER.AD_INSIGHTS.List, "GET", undefined, token);
};

export const getAdInsightById = async (id: number, token: string): Promise<any> => {
  return await apiCall(API_ENDPOINTS.USER.AD_INSIGHTS.Show(id), "GET", undefined, token);
};
