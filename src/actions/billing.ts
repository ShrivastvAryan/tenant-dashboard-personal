"use server";

import { axiosInstance } from "@/lib/api";

export interface PriorityRailBillingCharge {
  id: number;
  email: string;
  businessType: string;
  profileType: string;
  chargeType: string;
  baseAmountUsd: string;
  discountFactor: string;
  amountUsd: string;
  currency: string;
  billedAt: string | null;
}

export interface PriorityRailBilling {
  cycle: {
    year: number;
    month: number;
    startsAt: string;
    endsAt: string;
  };
  totals: {
    currency: string;
    amountUsd: string;
    chargeCount: number;
    individualCount: number;
    businessCount: number;
  };
  charges: PriorityRailBillingCharge[];
}

export async function GetPriorityRailBilling(
  year?: number,
  month?: number
): Promise<{ success: boolean; data?: PriorityRailBilling; error?: string }> {
  try {
    const res = await axiosInstance.get("/tenant/priority-rail/billing/", {
      params: { year, month },
    });
    return {
      success: true,
      data: res.data?.data as PriorityRailBilling,
    };
  } catch (err: any) {
    return {
      success: false,
      error:
        err?.response?.data?.error ||
        err?.message ||
        "Failed to fetch priority rail billing",
    };
  }
}
