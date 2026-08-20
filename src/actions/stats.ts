"use server";

import { axiosInstance } from "@/lib/api";
import { redirectToLoginIfAuthError } from "@/lib/auth-session";
import { cookies } from "next/headers";

export interface DailyStat {
  date: string;
  count: number;
  volume: number;
}

export interface MerchantStats {
  total_volume: number;
  total_payments: number;
  average_payment: number;
  total_fees: number;
  unique_customers: number;
  payment_methods: string[];
  daily_stats: DailyStat[];
  volumeChangePercent?: number;
}

function emptyMerchantStats(): MerchantStats {
  return {
    total_volume: 0,
    total_payments: 0,
    average_payment: 0,
    total_fees: 0,
    unique_customers: 0,
    payment_methods: [],
    daily_stats: [],
    volumeChangePercent: 0,
  };
}

export async function GetMerchantStats(): Promise<{
  success: boolean;
  data?: MerchantStats;
  error?: string;
}> {
  try {
    const cookieStore = await cookies();
    const walletId = cookieStore.get("wallet-id")?.value;
    if (!walletId) return { success: false, error: "Not authenticated" };

    const res = await axiosInstance.get("/payment-stats/", {
      params: { merchant: walletId },
    });

    const stats: MerchantStats = {
      ...emptyMerchantStats(),
      ...(res.data && typeof res.data === "object" ? res.data : {}),
      daily_stats: Array.isArray(res.data?.daily_stats) ? res.data.daily_stats : [],
      payment_methods: Array.isArray(res.data?.payment_methods) ? res.data.payment_methods : [],
    };

    // Fill last 365 days
    const last365Days = new Map<string, DailyStat>();
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

    // Compute month-over-month change
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
      error: err?.response?.data?.error || err?.message || "Failed to fetch stats",
    };
  }
}
