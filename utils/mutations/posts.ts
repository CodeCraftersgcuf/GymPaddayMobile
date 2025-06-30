import { apiCall } from "../customApiCall";
import { API_ENDPOINTS } from "../../apiConfig";

export const createPost = async ({
  data,
  token,
}: {
  data: FormData;
  token: string;
}) => {
  return await apiCall(API_ENDPOINTS.USER.POSTS.Create, "POST", data, token);
};

export const createBoostedPost = async ({
  id,
  data,
  token,
}: {
  id: number;
  data: {
    name?: string | null;
    title?: string | null;
    content?: string | null;
    media_url?: string | null;
    amount: number;
    daily_budget?: number | null;
    duration: number;
    location?: string | null;
    age_min?: number | null;
    age_max?: number | null;
    gender?: "all" | "male" | "female" | null;
  };
  token: string;
}) => {
  console.log("Creating boosted post with data:", data);
  return await apiCall(
    API_ENDPOINTS.USER.POSTS.BoostPost(id),
    "POST",
    {
      name: data.name ?? null,
      title: data.title ?? null,
      content: data.content ?? null,
      media_url: data.media_url ?? null,
      budget: data.amount,
      daily_budget: data.daily_budget ?? null,
      duration: data.duration,
      location: data.location ?? null,
      age_min: data.age_min ?? null,
      age_max: data.age_max ?? null,
      gender: data.gender ?? null,
    },
    token
  );
};

export const updatePost = async ({
  id,
  data,
  token,
}: {
  id: number;
  data: {
    title?: string;
    content?: string;
    media_url?: string;
  };
  token: string;
}) => {
  return await apiCall(API_ENDPOINTS.USER.POSTS.Update(id), "PUT", data, token);
};

export const deletePost = async ({
  id,
  token,
}: {
  id: number;
  token: string;
}) => {
  return await apiCall(
    API_ENDPOINTS.USER.POSTS.Delete(id),
    "DELETE",
    undefined,
    token
  );
};
