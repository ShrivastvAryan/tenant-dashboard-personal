"use server";

import { axiosInstance } from "@/lib/api";
import { redirectToLoginIfAuthError } from "@/lib/auth-session";
import { cookies } from "next/headers";

export interface TenantBusinessDetails {
  business_name?: string;
  business_type?: string;
  business_email?: string;
}

export async function GetBusinessDetails(): Promise<{
  success: boolean;
  data?: TenantBusinessDetails;
  error?: string;
}> {
  try {
    const cookieStore = await cookies();
    const email =
      cookieStore.get("user-email")?.value || cookieStore.get("email")?.value;

    if (!email) {
      return { success: false, error: "Missing email" };
    }

    const res = await axiosInstance.get("/businessDetails/", {
      params: { email },
    });

    return { success: true, data: res.data || {} };
  } catch (err: any) {
    await redirectToLoginIfAuthError(err);
    return {
      success: false,
      error:
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to fetch business details",
    };
  }
}
