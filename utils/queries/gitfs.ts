import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

function normalizeGiftsPayload(payload: unknown): any[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    const o = payload as Record<string, unknown>;
    if (Array.isArray(o.data)) return o.data;
  }
  return [];
}

export const getUserGifts = async (token: string): Promise<any[]> => {
  const raw = await apiCall(API_ENDPOINTS.USER.GIFTS.List, "GET", undefined, token);
  return normalizeGiftsPayload(raw);
};

