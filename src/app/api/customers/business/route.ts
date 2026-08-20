import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL, backendHeaders } from "@/lib/backend";
import { upstreamSignal } from "@/lib/upstream";

const SUPPORTED_COUNTRY_OPTIONS = [
  { label: "India", value: "INDIA", currency: "INR", requiredBankFields: ["accountName", "accountNumber", "ifsc", "bankName", "paymentCode"] },
  { label: "United Arab Emirates", value: "UNITED ARAB EMIRATES", currency: "AED", requiredBankFields: ["accountName", "accountNumber", "ibanNumber", "bankName", "paymentCode"] },
  { label: "Malaysia", value: "MALAYSIA", currency: "MYR", requiredBankFields: ["accountName", "accountNumber", "bankName", "paymentCode"] },
];

const KYB_DOCUMENTS = [
  { key: "cinOrGstinOrBPan", label: "CIN or GSTIN or Business PAN", min: 1, max: 1 },
  { key: "businessRepresentativePan", label: "Business Representative PAN", min: 1, max: 7, grouped: true },
  { key: "businessDirectorPan", label: "Business Director PAN", min: 2, max: 7, grouped: true },
  { key: "uboPanFront", label: "UBO PAN Front", min: 1, max: 7, grouped: true, pair: "uboPanBack" },
  { key: "uboPanBack", label: "UBO PAN Back", min: 1, max: 7, grouped: true, pair: "uboPanFront" },
];

function getApiKey(formData: FormData) {
  return String(formData.get("apiKey") || "efgh1234").trim();
}

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      supportedCountries: SUPPORTED_COUNTRY_OPTIONS,
      kybDocuments: KYB_DOCUMENTS,
    },
  });
}

async function createRecipient(apiKey: string, payload: Record<string, unknown>) {
  const response = await fetch(`${BACKEND_URL}/offramp/international/recipients/create/`, {
    method: "POST",
    headers: backendHeaders({
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    }),
    body: JSON.stringify(payload),
    cache: "no-store",
    signal: upstreamSignal(),
  });

  const data = await response.json().catch(() => ({}));
  return { response, data };
}

async function uploadKyb(apiKey: string, formData: FormData) {
  const response = await fetch(`${BACKEND_URL}/offramp/international/kyb/upload/`, {
    method: "POST",
    headers: backendHeaders({
      "x-api-key": apiKey,
    }),
    body: formData,
    cache: "no-store",
    signal: upstreamSignal(),
  });

  const data = await response.json().catch(() => ({}));
  return { response, data };
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const step = String(formData.get("step") || "").trim();
  const apiKey = getApiKey(formData);

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  if (step === "create") {
    const payloadText = String(formData.get("payload") || "{}");
    let payload: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(payloadText);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Payload must be an object");
      }
      payload = parsed as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid recipient payload" }, { status: 400 });
    }
    const { response, data } = await createRecipient(apiKey, payload);

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || data.errors || "Recipient creation failed", data },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  }

  if (step === "kyb") {
    const uploadForm = new FormData();
    const email = String(formData.get("email") || "a.sguy29@gmail.com").trim();
    const uboPhoneNumber = String(formData.get("uboPhoneNumber") || "").trim();

    if (!email) {
      return NextResponse.json({ error: "Email is required for KYB upload" }, { status: 400 });
    }

    uploadForm.append("email", email);
    if (uboPhoneNumber) {
      uploadForm.append("uboPhoneNumber", uboPhoneNumber);
    }

    for (const [key, value] of formData.entries()) {
      if (key === "step" || key === "apiKey" || key === "email" || key === "uboPhoneNumber") {
        continue;
      }
      if (value instanceof File && value.size > 0) {
        uploadForm.append(key, value);
      }
    }

    const { response, data } = await uploadKyb(apiKey, uploadForm);
    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || data.errors || "KYB upload failed", data },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  }

  return NextResponse.json({ error: "Invalid step" }, { status: 400 });
}
