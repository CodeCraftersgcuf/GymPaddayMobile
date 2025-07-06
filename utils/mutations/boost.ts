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

export const updateMarketplaceListing = async ({ id, data, token }) => {
    console.log("Updating marketplace listing with ID:", id, "and data:", data);
  return await apiCall(
    API_ENDPOINTS.USER.MARKETPLACE_LISTINGS.Update(id),
    'PUT',
    data,
    token
  );
}

export const deleteMarketplaceListing = async ({ id, token }) => {
    console.log("Deleting marketplace listing with ID:", id);
  return await apiCall(
    API_ENDPOINTS.USER.MARKETPLACE_LISTINGS.Delete(id),
    'DELETE',
    null,
    token
  );
}

export const deleteAdCompaign = async ({ id, token }) => {
    console.log("Deleting ad campaign with ID:", id);
  return await apiCall(
    API_ENDPOINTS.USER.AD_CAMPAIGNS.Delete(id),
    'DELETE',
    null,
    token
  );
}

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