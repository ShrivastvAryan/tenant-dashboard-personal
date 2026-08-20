'use server'
import axios from 'axios';
import { axiosInstance } from '@/lib/api';
import { cookies } from 'next/headers';
import type { SaveKycData } from '@/types/individual';
import type { SaveKybData } from '@/types/kyb';
import { backendBase } from '@/lib/backend';
import { toCountryIso2 } from '@/lib/kycEnums';

export interface CreateCustomerPayload {
  email?: string;
  profileType: 'individual' | 'business' | string;
  country: string;
  corridor: 'global' | string;
}

export interface SubmitKyc {
  email?: string;
  country: string;
  corridor: string;
}

const getUserEmail = async () => {
  const cookieStore = await cookies();
  return cookieStore.get('user-email')?.value || cookieStore.get('email')?.value || 'a.sguy29@gmail.com';
};

const getAuthHeaders = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get('access-token')?.value;
  const tenantApiKey = cookieStore.get('tenant-api-key')?.value;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-API-KEY': tenantApiKey ? decodeURIComponent(tenantApiKey) : 'efgh1234',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

const getEndpoint = (path: string) =>
  typeof window !== 'undefined' ? path : `${backendBase}${path}`;

function extractAxiosErrorMessage(error: any, fallbackMessage: string): string {
  if (axios.isAxiosError(error)) {
    const errorData = error.response?.data;
    if (typeof errorData === "string" && errorData.trim() && !errorData.includes("status code") && !errorData.toLowerCase().includes("request failed")) {
      return errorData;
    }
    if (errorData && typeof errorData === "object") {
      const msg = errorData.message || errorData.error || errorData.detail;
      if (typeof msg === "string" && msg.trim() && !msg.includes("status code") && !msg.toLowerCase().includes("request failed")) {
        return msg;
      }
    }
  }
  return fallbackMessage;
}

export const createCustomer = async (customerData: CreateCustomerPayload) => {
  try {
    const endpoint = getEndpoint('/offramp/v2/customers/');
    const headers = await getAuthHeaders();
    const userEmail = await getUserEmail();

    const rawCountry = (customerData.country || '').trim();
    const country =
      rawCountry.toUpperCase() === 'INDIA' || rawCountry === 'India' || rawCountry.toUpperCase() === 'IN'
        ? 'IN'
        : rawCountry.length === 2
          ? rawCountry.toUpperCase()
          : rawCountry;

    const payload = {
      ...customerData,
      email: customerData.email || userEmail,
      profileType: customerData.profileType || 'individual',
      country,
    };

    const response = await axiosInstance.post(endpoint, payload, { headers });

    console.log("Create Customer Response:", response);
    console.log("Response Data:", response.data);

    return response.data;
  } catch (error) {
    console.error("Error creating customer:", error);

    if (axios.isAxiosError(error)) {
      console.error("Status:", error.response?.status);
      console.error("Response:", error.response?.data);
      console.error("Headers:", error.response?.headers);
    }

    throw error;
  }
};


export const getCustomers = async (email?: string) => {
  try {
    const endpoint = getEndpoint('/offramp/v2/customers/');
    const headers = await getAuthHeaders();

    const response = await axiosInstance.get(endpoint, {
      headers,
      params: email ? { email } : undefined,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Returns the provided customerId if truthy offramp ID, otherwise fetches the customer
 * list from /offramp/v2/customers/ and returns the matching customer id.
 */
const resolveCustomerId = async (customerId?: string, email?: string): Promise<string> => {
  if (customerId && (customerId.startsWith("customer_") || customerId.startsWith("cus_"))) {
    console.log("customerId:", customerId);
    return customerId;
  }

  const res = await getCustomers(email);
  const customers: any[] =
    res?.data?.customers ||
    res?.customers ||
    (Array.isArray(res?.data) ? res.data : []);

  let matched = customers.find((c: any) =>
    (email && c.email?.toLowerCase() === email.toLowerCase() && (c.profileType === "individual" || c.profile_type === "individual")) ||
    (customerId && String(c.id || c.customer_id) === String(customerId))
  );

  if (!matched && email) {
    matched = customers.find((c: any) => c.email?.toLowerCase() === email.toLowerCase());
  }

  const id = matched?.id || matched?.customer_id || customers[0]?.id || customers[0]?.customer_id;
  console.log("customerId:", id);

  if (!id) throw new Error('No customer found. Create a customer first.');
  return id;
};

export const saveKYCData = async (customerKYCData: SaveKycData | SaveKybData, customerID?: string, email?: string) => {
  let payload: SaveKycData | SaveKybData = customerKYCData;
  let resolvedId: string | undefined;
  try {
    const userEmail = customerKYCData.email || email || (await getUserEmail());
    payload = {
      ...customerKYCData,
      email: userEmail,
    };

    resolvedId = await resolveCustomerId(customerID, userEmail);
    const endpoint = getEndpoint(`/offramp/v2/customers/${resolvedId}/kyc/profile/`);
    const headers = await getAuthHeaders();

    console.log("==================== [saveKYCData] Final Payload ====================");
    console.log("Endpoint:", endpoint);
    console.log("Payload:", JSON.stringify(payload, null, 2));
    console.log("=====================================================================");

    const response = await axiosInstance.put(endpoint, payload, { headers });
    return response.data;
  } catch (error) {
    throw new Error(extractAxiosErrorMessage(error, "Failed to save profile details. Please check the required fields and try again."));
  }
};

export const saveKYBData = async (customerKYBData: SaveKybData, customerID?: string, email?: string) => {
  return saveKYCData(customerKYBData, customerID, email);
};

export const getKYCData = async (customerID?: string, email?: string) => {
  try {
    const resolvedId = await resolveCustomerId(customerID, email);
    const endpoint = getEndpoint(`/offramp/v2/customers/${resolvedId}/kyc`);
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get(endpoint, { headers });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const uploadDocument = async (formData: FormData, customerId?: string, email?: string) => {
  try {
    const userEmail = (formData.get('email') as string) || email || (await getUserEmail());
    const resolvedId = await resolveCustomerId(customerId, userEmail);
    const kind = (formData.get('kind') as string) || '';
    const file = formData.get('file') as File | null;

    const payloadFormData = new FormData();
    if (userEmail) payloadFormData.append('email', userEmail);
    if (kind) payloadFormData.append('kind', kind);
    if (file) payloadFormData.append('file', file);

    const endpoint = getEndpoint(`/offramp/v2/customers/${resolvedId}/kyc/documents/`);
    const headers = await getAuthHeaders();
    delete (headers as any)['Content-Type'];
    delete (headers as any)['content-type'];

    console.log("[SERVER] uploadDocument: posting multipart form data to:", endpoint);
    const payloadEntries: Record<string, any> = {};
    for (const [key, value] of payloadFormData.entries()) {
      if (value && typeof value === 'object' && 'name' in value) {
        const fileObj = value as File;
        payloadEntries[key] = {
          name: fileObj.name,
          type: fileObj.type,
          size: fileObj.size,
        };
      } else {
        payloadEntries[key] = value;
      }
    }
    console.log("[SERVER] uploadDocument Payload:", payloadEntries);

    const response = await axiosInstance.post(endpoint, payloadFormData, { headers });
    return response.data;
  } catch (error) {
    throw new Error(extractAxiosErrorMessage(error, "Failed to upload document. Please try again."));
  }
};

export const submitKYC = async (customerId?: string, submit?: SubmitKyc, email?: string) => {
  try {
    const userEmail = submit?.email || email || (await getUserEmail());
    const resolvedId = await resolveCustomerId(customerId, userEmail);

    const payload = {
      ...submit,
      email: userEmail,
    };

    const endpoint = getEndpoint(`/offramp/v2/customers/${resolvedId}/kyc/submit/`);
    const headers = await getAuthHeaders();

    console.log("==================== [submitKYC] Final Payload ====================");
    console.log("Endpoint:", endpoint);
    console.log("Payload:", JSON.stringify(payload, null, 2));
    console.log("===================================================================");

    const response = await axiosInstance.post(endpoint, payload, { headers });
    return response.data;
  } catch (error) {
    throw new Error(extractAxiosErrorMessage(error, "Failed to submit verification request. Please try again."));
  }
};

export const getKYCStatus = async (customerId?: string, email?: string) => {
  try {
    const userEmail = email || (await getUserEmail());
    const resolvedId = await resolveCustomerId(customerId, userEmail);
    const endpoint = getEndpoint(`/offramp/v2/customers/${resolvedId}/kyc/status/?email=${encodeURIComponent(userEmail)}`);
    const headers = await getAuthHeaders();

    const response = await axiosInstance.get(endpoint, { headers });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const uploadPersonDocument = async (
  personRef: string,
  formData: FormData,
  customerId?: string,
  email?: string
) => {
  try {
    const userEmail = (formData.get('email') as string) || email || (await getUserEmail());
    const resolvedId = await resolveCustomerId(customerId, userEmail);
    const kind = (formData.get('kind') as string) || '';
    const file = formData.get('file') as File | null;

    const payloadFormData = new FormData();
    if (userEmail) payloadFormData.append('email', userEmail);
    if (kind) payloadFormData.append('kind', kind);
    if (file) payloadFormData.append('file', file);

    const endpoint = getEndpoint(`/offramp/v2/customers/${resolvedId}/kyc/persons/${personRef}/documents/`);
    const headers = await getAuthHeaders();
    delete (headers as any)['Content-Type'];
    delete (headers as any)['content-type'];

    const payloadEntries: Record<string, any> = {};
    for (const [key, value] of payloadFormData.entries()) {
      if (value && typeof value === 'object' && 'name' in value) {
        const fileObj = value as File;
        payloadEntries[key] = {
          name: fileObj.name,
          type: fileObj.type,
          size: fileObj.size,
        };
      } else {
        payloadEntries[key] = value;
      }
    }

    console.log("==================== [uploadPersonDocument] Request Payload ====================");
    console.log("Endpoint:", endpoint);
    console.log("Person Ref:", personRef);
    console.log("Headers:", JSON.stringify(headers, null, 2));
    console.log("FormData Entries:", JSON.stringify(payloadEntries, null, 2));
    console.log("===============================================================================");

    const response = await axiosInstance.post(endpoint, payloadFormData, { headers });

    console.log("==================== [uploadPersonDocument] Response ====================");
    console.log("Status:", response.status);
    console.log("Data:", JSON.stringify(response.data, null, 2));
    console.log("=========================================================================");

    return response.data;
  } catch (error) {
    throw new Error(extractAxiosErrorMessage(error, "Failed to upload person document. Please try again."));
  }
};

let cachedIndustriesResponse: any = null;
let cachedIndustriesTimestamp = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour server cache

export const getNAICSCode = async () => {
  try {
    const now = Date.now();
    if (cachedIndustriesResponse && now - cachedIndustriesTimestamp < CACHE_TTL_MS) {
      return cachedIndustriesResponse;
    }

    const endpoint = getEndpoint('/offramp/v2/industries/');
    const headers = await getAuthHeaders();

    const response = await axiosInstance.get(endpoint, { headers });
    const data = response.data;

    if (data) {
      cachedIndustriesResponse = data;
      cachedIndustriesTimestamp = now;
    }
    return data;
  } catch (error) {
    console.error("Error fetching NAICS code industries:", error);
    if (cachedIndustriesResponse) {
      return cachedIndustriesResponse;
    }
    return {
      success: false,
      data: {
        industries: [],
      },
    };
  }
};

export interface AddressRequirements {
  country: string;
  state: "required" | "optional" | string;
  postal_code: "required" | "optional" | string;
}

const addressRequirementsCache: Record<string, AddressRequirements> = {};

export const getAddressRequirements = async (countryCode: string): Promise<AddressRequirements> => {
  const iso2 = toCountryIso2(countryCode || "");
  const fallback: AddressRequirements = {
    country: iso2 || countryCode || "",
    state: "optional",
    postal_code: "optional",
  };
  if (!iso2) return fallback;

  if (addressRequirementsCache[iso2]) {
    return addressRequirementsCache[iso2];
  }

  try {
    const endpoint = getEndpoint(`/offramp/v2/address-requirements/?country=${encodeURIComponent(iso2)}`);
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get(endpoint, { headers });
    const data = response.data?.data || response.data;
    const reqs: AddressRequirements = {
      country: data?.country || iso2,
      state: data?.state === "required" ? "required" : "optional",
      postal_code: data?.postal_code === "required" ? "required" : "optional",
    };
    addressRequirementsCache[iso2] = reqs;
    return reqs;
  } catch (error) {
    console.error("[SERVER] getAddressRequirements error:", error);
    return fallback;
  }
};
