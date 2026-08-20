"use server";

import { axiosInstance } from "@/lib/api";
import { redirectToLoginIfAuthError } from "@/lib/auth-session";

export interface TenantDailyStat {
  date: string;
  count: number;
  volume: number;
}

export interface TenantStats {
  total_customers: number;
  active_customers: number;
  success_rate: number;
  pending_offramps: number;
  total_payments: number;
  total_volume: number;
  average_payment: number;
  total_fees: number;
  daily_stats: TenantDailyStat[];
  total_offramps: number;
  successful_offramps: number;
  failed_offramps: number;
  volumeChangePercent?: number;
}

function emptyTenantStats(): TenantStats {
  return {
    total_customers: 0,
    active_customers: 0,
    success_rate: 0,
    pending_offramps: 0,
    total_payments: 0,
    total_volume: 0,
    average_payment: 0,
    total_fees: 0,
    daily_stats: [],
    total_offramps: 0,
    successful_offramps: 0,
    failed_offramps: 0,
    volumeChangePercent: 0,
  };
}

export async function GetTenantStats(): Promise<{
  success: boolean;
  data?: TenantStats;
  error?: string;
}> {
  try {
    const res = await axiosInstance.get("/tenant/stats/");
    const stats: TenantStats = {
      ...emptyTenantStats(),
      ...(res.data && typeof res.data === "object" ? res.data : {}),
      daily_stats: Array.isArray(res.data?.daily_stats) ? res.data.daily_stats : [],
    };

    const last365Days = new Map<string, TenantDailyStat>();
    for (let i = 0; i < 365; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const formatted = date.toISOString().split("T")[0];
      last365Days.set(formatted, { date: formatted, count: 0, volume: 0 });
    }
    stats.daily_stats.forEach((entry) => last365Days.set(entry.date, entry));
    stats.daily_stats = Array.from(last365Days.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    const now = new Date();
    const thisMonth = now.getMonth();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const thisYear = now.getFullYear();
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    let thisMonthVolume = 0;
    let lastMonthVolume = 0;
    for (const entry of stats.daily_stats) {
      const d = new Date(entry.date);
      if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) {
        thisMonthVolume += entry.volume;
      } else if (d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear) {
        lastMonthVolume += entry.volume;
      }
    }

    const volumeChangePercent =
      lastMonthVolume === 0
        ? thisMonthVolume > 0
          ? 100
          : 0
        : ((thisMonthVolume - lastMonthVolume) / lastMonthVolume) * 100;

    stats.volumeChangePercent = Math.round(volumeChangePercent * 100) / 100;

    return { success: true, data: stats };
  } catch (err: any) {
    await redirectToLoginIfAuthError(err);
    return {
      success: false,
      error: err?.response?.data?.error || err?.message || "Failed to fetch tenant stats",
    };
  }
}

export interface SubUser {
  id: number;
  email: string;
  name: string;
  is_active: boolean;
  is_verified: boolean;
  type: string;
  volume: number;
  last_logged_in: string | null;
  profile_type?: string;
  provider_status?: string;
  details?: {
    first_name?: string | null;
    last_name?: string | null;
    kyc_status: string;
    kyb_status: string;
    kyc_verified: boolean;
    kyb_verified: boolean;
    is_nri?: boolean;
    kyb_documents: string[];
    kyb_submitted_at: string | null;
    business_name: string | null;
    bank_accounts: Array<{
      provider: string;
      account_name?: string | null;
      account_number_masked?: string | null;
      ifsc?: string | null;
      branch_address?: string | null;
      link_status?: string | null;
      bank_name?: string | null;
      currency?: string | null;
      country?: string | null;
      payment_code?: string | null;
      iban_number_masked?: string | null;
      recipient_status?: string | null;
      recipient_type?: string | null;
      is_default?: boolean;
      is_active?: boolean;
    }>;
  };
}

export interface SubUsersPage {
  count: number;
  total_pages: number;
  page_number: number;
  per_page: number;
  next: number | null;
  previous: number | null;
  results: SubUser[];
}

export async function GetTenantUsers(page = 1): Promise<SubUsersPage> {
  try {
    const res = await axiosInstance.get("/tenant/users/", {
      params: { page, per_page: 10 },
    });
    return res.data as SubUsersPage;
  } catch (err: any) {
    await redirectToLoginIfAuthError(err);
    console.error("Failed to fetch tenant users:", err?.message || err);
    return {
      count: 0,
      total_pages: 1,
      page_number: page,
      per_page: 10,
      next: null,
      previous: null,
      results: [],
    };
  }
}
