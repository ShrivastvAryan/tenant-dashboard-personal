"use server";

import { axiosInstance } from "@/lib/api";
import { redirectToLoginIfAuthError } from "@/lib/auth-session";

export interface PaymentData {
  id: string;
  amount: string;
  status: string;
  created_at: string;
  txHash: string | null;
  wallet: string;
  chainId: string;
  currency: string;
  customer_name: string | null;
  customer_email: string | null;
  payment_link_url: string | null;
}

export type PaymentRow = PaymentData;

export interface PaymentPageData {
  next: string | null;
  previous: string | null;
  count: number;
  total_pages: number;
  page_number: number;
  per_page: number;
  results: PaymentData[];
}

export async function GetMerchantPayments(page = 1): Promise<PaymentPageData> {
  try {
    const res = await axiosInstance.get("/payment/by-merchant/", {
      params: { page },
    });
    const data = res.data;
    // DRF pagination
    return {
      next: data.next,
      previous: data.previous,
      count: data.count,
      total_pages: data.total_pages ?? Math.ceil(data.count / 10),
      page_number: data.page_number ?? page,
      per_page: data.per_page ?? 10,
      results: data.results ?? [],
    };
  } catch (err: any) {
    await redirectToLoginIfAuthError(err);
    console.error("Failed to fetch payments:", err?.message || err);
    return {
      next: null,
      previous: null,
      count: 0,
      total_pages: 1,
      page_number: page,
      per_page: 10,
      results: [],
    };
  }
}

// --- Tenant payments ---

export interface UnifiedPayment {
  id: string;
  type: "deposit" | "onramp" | "offramp" | "withdraw";
  payment_id: string;
  recipient: string;
  amount: number;
  currency: string;
  fee: number;
  network: string;
  status: string;
  created_at: string | null;
}

export interface PaymentPage {
  count: number;
  total_pages: number;
  page_number: number;
  per_page: number;
  next: number | null;
  previous: number | null;
  results: UnifiedPayment[];
}

export async function GetTenantPayments(
  page = 1,
  typeFilter = "all"
): Promise<PaymentPage> {
  try {
    const res = await axiosInstance.get("/tenant/payments/", {
      params: { page, per_page: 10, type: typeFilter },
    });
    return res.data as PaymentPage;
  } catch (err: any) {
    await redirectToLoginIfAuthError(err);
    console.error("Failed to fetch tenant payments:", err?.message || err);
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
