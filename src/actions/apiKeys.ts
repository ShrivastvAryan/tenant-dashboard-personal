"use server";

import { axiosInstance } from "@/lib/api";
import { redirectToLoginIfAuthError } from "@/lib/auth-session";

export interface ApiKeyInfo {
  has_api_key: boolean;
  created_at?: string;
  description?: string;
  last_used?: string;
}

export async function GetApiKey(): Promise<{
  success: boolean;
  data?: ApiKeyInfo;
  error?: string;
}> {
  try {
    const res = await axiosInstance.get("/api-keys/");
    return { success: true, data: res.data };
  } catch (err: any) {
    await redirectToLoginIfAuthError(err);
    return {
      success: false,
      error: err?.response?.data?.error || err?.message || "Failed to fetch API key",
    };
  }
}

export async function CreateApiKey(description = "API Key"): Promise<{
  success: boolean;
  data?: { api_key: string; description: string; created_at: string };
  error?: string;
}> {
  try {
    const res = await axiosInstance.post("/api-keys/create_key/", { description });
    return { success: true, data: res.data };
  } catch (err: any) {
    await redirectToLoginIfAuthError(err);
    return {
      success: false,
      error: err?.response?.data?.error || err?.message || "Failed to create API key",
    };
  }
}

export async function RegenerateApiKey(description = "API Key"): Promise<{
  success: boolean;
  data?: { api_key: string; description: string; created_at: string };
  error?: string;
}> {
  try {
    const res = await axiosInstance.post("/api-keys/regenerate_key/", { description });
    return { success: true, data: res.data };
  } catch (err: any) {
    await redirectToLoginIfAuthError(err);
    return {
      success: false,
      error: err?.response?.data?.error || err?.message || "Failed to regenerate API key",
    };
  }
}

export async function RevokeApiKey(): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const res = await axiosInstance.delete("/api-keys/revoke_key/");
    return { success: true, message: res.data.message };
  } catch (err: any) {
    await redirectToLoginIfAuthError(err);
    return {
      success: false,
      error: err?.response?.data?.error || err?.message || "Failed to revoke API key",
    };
  }
}
