"use server";

import { axiosInstance } from "@/lib/api";
import { redirectToLoginIfAuthError } from "@/lib/auth-session";

export type WebhookEventType =
  | "checkout_session.completed"
  | "checkout_session.expired"
  | "checkout_session.canceled";

export interface Webhook {
  id: string;
  name: string;
  url: string;
  secret: string;
  event_types: WebhookEventType[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WebhookPayload {
  name: string;
  url: string;
  secret: string;
  event_types: WebhookEventType[];
  is_active: boolean;
}

export async function GetWebhooks(): Promise<{
  success: boolean;
  data?: Webhook[];
  error?: string;
}> {
  try {
    const res = await axiosInstance.get("/merchant-webhook/");
    return { success: true, data: Array.isArray(res.data) ? res.data : [] };
  } catch (err: any) {
    await redirectToLoginIfAuthError(err);
    return {
      success: false,
      error:
        err?.response?.data?.error ||
        err?.message ||
        "Failed to fetch webhooks",
    };
  }
}

export async function CreateWebhook(payload: WebhookPayload): Promise<{
  success: boolean;
  data?: Webhook[];
  error?: string;
}> {
  try {
    const res = await axiosInstance.post("/merchant-webhook/", {
      webhooks: [payload],
    });
    return { success: true, data: res.data };
  } catch (err: any) {
    await redirectToLoginIfAuthError(err);
    return {
      success: false,
      error:
        err?.response?.data?.error ||
        err?.message ||
        "Failed to create webhook",
    };
  }
}

export async function UpdateWebhook(
  id: string,
  payload: Partial<WebhookPayload>
): Promise<{
  success: boolean;
  data?: Webhook;
  error?: string;
}> {
  try {
    const res = await axiosInstance.put(`/merchant-webhook/${id}/`, payload);
    return { success: true, data: res.data };
  } catch (err: any) {
    await redirectToLoginIfAuthError(err);
    return {
      success: false,
      error:
        err?.response?.data?.error ||
        err?.message ||
        "Failed to update webhook",
    };
  }
}

export async function DeleteWebhook(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await axiosInstance.delete(`/merchant-webhook/${id}/`);
    return { success: true };
  } catch (err: any) {
    await redirectToLoginIfAuthError(err);
    return {
      success: false,
      error:
        err?.response?.data?.error ||
        err?.message ||
        "Failed to delete webhook",
    };
  }
}
