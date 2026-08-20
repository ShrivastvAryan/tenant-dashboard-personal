import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL, backendHeaders } from "@/lib/backend";
import { upstreamSignal } from "@/lib/upstream";

const INCOME_RANGES = ["<10L", "10L-15L", "15L-20L", "20L-25L", "25L-50L", ">50L"];

function getApiKey(formData: FormData) {
  return String(formData.get("apiKey") || "efgh1234").trim();
}

function appendUploadedFiles(source: FormData, target: FormData, fields: string[]) {
  fields.forEach((field) => {
    const value = source.get(field);
    if (value instanceof File && value.size > 0) {
      target.append(field, value);
    }
  });
}

async function uploadKyc(apiKey: string, endpoint: string, uploadForm: FormData) {
  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    method: "POST",
    headers: backendHeaders({
      "x-api-key": apiKey,
    }),
    body: uploadForm,
    cache: "no-store",
    signal: upstreamSignal(),
  });

  const data = await response.json().catch(() => ({}));
  return { response, data };
}

async function linkBank(apiKey: string, payload: Record<string, unknown>) {
  const response = await fetch(`${BACKEND_URL}/offramp/account/link-bank/`, {
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

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      incomeRanges: INCOME_RANGES,
      nriDocuments: [
        { key: "drivingLicense", label: "Driving License" },
        { key: "workVisa", label: "Work Visa" },
        { key: "emiratesId", label: "Emirates ID" },
      ],
    },
  });
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const step = String(formData.get("step") || "").trim();
  const apiKey = getApiKey(formData);

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  if (step === "regular-kyc") {
    const uploadForm = new FormData();
    [
      "email",
      "panNumber",
      "aadharNumber",
      "firstName",
      "lastName",
      "incomeRange",
      "profession",
      "phone",
      "countryCode",
      "dob",
    ].forEach((field) => {
      const value = formData.get(field);
      if (typeof value === "string" && value.trim()) {
        uploadForm.append(field, value);
      }
    });
    appendUploadedFiles(formData, uploadForm, ["selfie", "aadharFront", "aadharBack", "panFront", "panBack"]);

    const { response, data } = await uploadKyc(apiKey, "/offramp/kyc/upload/", uploadForm);
    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || data.errors || "KYC upload failed", data },
        { status: response.status }
      );
    }
    return NextResponse.json(data, { status: response.status });
  }

  if (step === "nri-kyc") {
    const uploadForm = new FormData();
    [
      "email",
      "name",
      "dob",
      "income_range",
      "profession",
      "address[pin]",
      "address[state]",
      "address[city]",
      "address[locality]",
      "address[district]",
      "address[landmark]",
      "drivingLicenseNumber",
      "workVisaNumber",
      "emiratesIdNumber",
    ].forEach((field) => {
      const value = formData.get(field);
      if (typeof value === "string" && value.trim()) {
        uploadForm.append(field, value);
      }
    });
    appendUploadedFiles(formData, uploadForm, ["drivingLicense", "workVisa", "emiratesId", "selfie"]);

    const { response, data } = await uploadKyc(apiKey, "/offramp/kyc/nri/upload/", uploadForm);
    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || data.errors || "NRI KYC upload failed", data },
        { status: response.status }
      );
    }
    return NextResponse.json(data, { status: response.status });
  }

  if (step === "link-bank") {
    const payloadText = String(formData.get("payload") || "{}");
    let payload: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(payloadText);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Payload must be an object");
      }
      payload = parsed as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid bank-link payload" }, { status: 400 });
    }
    const { response, data } = await linkBank(apiKey, payload);

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || data.errors || "Bank linking failed", data },
        { status: response.status }
      );
    }
    return NextResponse.json(data, { status: response.status });
  }

  return NextResponse.json({ error: "Invalid step" }, { status: 400 });
}
