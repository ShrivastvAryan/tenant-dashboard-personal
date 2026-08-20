"use server";

import { axiosInstance } from "@/lib/api";
import { redirectToLoginIfAuthError } from "@/lib/auth-session";

export interface FxRateResponse {
  success: boolean;
  currency: string;
  provider: string;
  rate: string;
}

export async function GetFxRate(provider: "LOCAL" | "RAMPABLE"): Promise<{
  success: boolean;
  data?: FxRateResponse;
  error?: string;
}> {
  try {
    const res = await axiosInstance.get("/employee-payouts/exchange-rate/", {
      params: {
        currency: "INR",
        provider,
      },
    });

    return { success: true, data: res.data };
  } catch (err: any) {
    await redirectToLoginIfAuthError(err);
    return {
      success: false,
      error:
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to fetch FX rate",
    };
  }
}
