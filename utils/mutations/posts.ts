import { API_ENDPOINTS } from "../../apiConfig";
import { apiCall } from "../customApiCall";

/** RN + axios PUT + FormData sets wrong Content-Type (urlencoded); use fetch like create. */
async function fetchPostMultipart(
  url: string,
  method: 'POST' | 'PUT',
  data: FormData,
  token: string
): Promise<any> {
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    body: data,
  });

  const text = await response.text();
  let result: any;
  try {
    result = JSON.parse(text);
  } catch {
    console.error(
      '❌ Server returned non-JSON response (status ' + response.status + '):',
      text.substring(0, 500)
    );
    throw new Error(`Server error (${response.status}): ${text.substring(0, 200)}`);
  }

  if (!response.ok) {
    throw new Error(result?.message || `HTTP error! status: ${response.status}`);
  }

  return result;
}

export const createPost = async ({
  data,
  token,
}: {
  data: FormData;
  token: string;
}) => {
  try {
    return await fetchPostMultipart(API_ENDPOINTS.USER.POSTS.Create, 'POST', data, token);
  } catch (error: any) {
    console.error('❌ Create Post Error:', error);
    throw error;
  }
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
  console.log("Creating boosted post with data: with id:", id);
  return await apiCall(
    API_ENDPOINTS.USER.POSTS.BoostPost(id),
    "POST",
    {
      name: data.name ?? null,
      title: data.title ?? null,
      content: data.content ?? null,
      media_url: data.media_url ?? null,
      budget: data.amount,
      daily_budget: data.daily_budget ?? data.amount,
      duration: data.duration,
      location: data.location ?? null,
      age_min: data.age_min ?? null,
      age_max: data.age_max ?? null,
      gender: data.gender ?? null,
    },
    token
  );
};


export const createBoostedListing = async ({
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
  console.log("Creating boosted Listing with data: with id:", id);
  return await apiCall(
    API_ENDPOINTS.USER.MARKETPLACE_LISTINGS.BoostListing(id),
    "POST",
    {
      name: data.name ?? null,
      title: data.title ?? null,
      content: data.content ?? null,
      media_url: data.media_url ?? null,
      budget: data.amount,
      daily_budget: data.daily_budget ?? data.amount,
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
  postId,
  data,
  token,
}: {
  postId: string | number;
  data: FormData | {
    title?: string;
    content?: string;
    media_url?: string;
  };
  token: string;
}) => {
  const url = API_ENDPOINTS.USER.POSTS.Update(Number(postId));
  if (data instanceof FormData) {
    try {
      return await fetchPostMultipart(url, 'PUT', data, token);
    } catch (error: any) {
      console.error('❌ Update Post Error:', error);
      throw error;
    }
  }
  return await apiCall(url, 'PUT', data, token);
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
