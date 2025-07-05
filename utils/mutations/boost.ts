// boostMutations.js
import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

// Marketplace
export const updateBoostedMarketplace = async ({ id, data, token }) => {
    console.log("Updating boosted marketplace with ID:", id, "and data:", data);
  return await apiCall(
    API_ENDPOINTS.USER.BOOST.UpdateMarketplace(id),
    'PUT',
    data,
    token
  );
};

// Post
export const updateBoostedPost = async ({ id, data, token }) => {
    console.log("Updating boosted post with ID:", id, "and data:", data);
  return await apiCall(
    API_ENDPOINTS.USER.BOOST.UpdatePost(id),
    'PUT',
    data,
    token
  );
};