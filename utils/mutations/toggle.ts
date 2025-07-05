import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

// Toggle Campaign Status (Pause/Resume)
export const toggleCampaignStatus = async ({
  id,
  action,
  token,
}: {
  id: number;
  action: 'pause' | 'resume';
  token: string;
}) => {
  // Body must be JSON: { action: "pause" | "resume" }
  const data = { action };
  console.log("Toggling Campaign Status:", { id, action, token });
  // POST method
  return await apiCall(
    API_ENDPOINTS.USER.TOGGLE.Campaign(id), // <-- Use your endpoint builder
    'POST',
    data,
    token
  );
};
