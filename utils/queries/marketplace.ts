import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

export const getMarketplaceListings = async (token: string): Promise<any> => {
  return await apiCall(
    API_ENDPOINTS.USER.MARKETPLACE_LISTINGS.List,
    "GET",
    undefined,
    token
  );
};

export const getMarketplaceListingById = async (
  id: number,
  token: string
): Promise<any> => {
  return await apiCall(
    API_ENDPOINTS.USER.MARKETPLACE_LISTINGS.Show(id),
    "GET",
    undefined,
    token
  );
};

export const getMarketplaceCategories = async (token: string): Promise<any> => {
  return await apiCall(
    API_ENDPOINTS.USER.MARKETPLACE_CATEGORIES.List,
    "GET",
    undefined,
    token
  );
};

export const getMarketplaceCategoryById = async (
  id: number,
  token: string
): Promise<any> => {
  return await apiCall(
    API_ENDPOINTS.USER.MARKETPLACE_CATEGORIES.Show(id),
    "GET",
    undefined,
    token
  );
};

export const getMarketplaceListingsByUser = async (
  userId: number,
  token: string
): Promise<any> => {
  console.log("Fetching listings for user:", userId);
  return await apiCall(
    API_ENDPOINTS.USER.MARKETPLACE_LISTINGS.UserList(userId),
    "GET",
    undefined,
    token
  );
};
