"use server";

import { axiosInstance } from "@/lib/api";
import { redirectToLoginIfAuthError } from "@/lib/auth-session";

export type OfframpCustomer = {
  id: string;
  email: string;
  profileType: "individual" | "business";
  verification: {
    status: string;
    profile?: {
      status?: string;
      missing_fields?: string[];
      submitted_at?: string | null;
      approved_at?: string | null;
      rejected_at?: string | null;
    } | null;
    errors?: Array<{ message?: string }>;
  };
};

export type OfframpAccount = {
  id: string;
  instrument_type: string;
  product?: string | null;
  status: string;
  country: string;
  currency: string;
  display_name: string;
  details?: Record<string, unknown> | null;
  created_at: string;
};

type Result<T> = { success: true; data: T } | { success: false; error: string };

function errorMessage(error: unknown) {
  const err = error as { response?: { data?: { error?: string } }; message?: string };
  return err.response?.data?.error || err.message || "Request failed";
}

async function request<T>(operation: () => Promise<{ data: unknown }>): Promise<Result<T>> {
  try {
    const response = await operation();
    const body = response.data as { success?: boolean; data?: T; error?: string } | null;
    if (!body?.success || !body.data) {
      return { success: false, error: body?.error || "Request failed" };
    }
    return { success: true, data: body.data };
  } catch (error) {
    await redirectToLoginIfAuthError(error);
    return { success: false, error: errorMessage(error) };
  }
}

export async function listOfframpAccounts(customerId: string, email: string): Promise<Result<OfframpAccount[]>> {
  return request<{ accounts: OfframpAccount[] }>(async () => axiosInstance.get(`/offramp/v2/customers/${customerId}/accounts/`, { params: { email } }))
    .then((result) => result.success ? { success: true as const, data: result.data.accounts || [] } : result);
}

export async function createVirtualFiatAccount(input: {
  customerId: string;
  email: string;
  country: string;
  currency: "USD" | "EUR" | "GBP" | "AED";
}): Promise<Result<OfframpAccount>> {
  const { customerId, ...payload } = input;
  return request<{ account: OfframpAccount }>(() => axiosInstance.post(`/offramp/v2/customers/${customerId}/accounts/`, {
    ...payload,
    kind: "fiat",
    origin: "virtual",
    displayName: `${payload.currency} collection account`,
    details: {},
  })).then((result) => result.success ? { success: true as const, data: result.data.account } : result);
}
