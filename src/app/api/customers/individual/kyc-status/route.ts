import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL, backendHeaders } from "@/lib/backend";
import { upstreamSignal } from "@/lib/upstream";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const apiKey = String(body.apiKey || "efgh1234").trim();
  const email = String(body.email || "a.sguy29@gmail.com").trim();

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const response = await fetch(
    `${BACKEND_URL}/offramp/kyc/status/?email=${encodeURIComponent(email)}`,
    {
      method: "GET",
      headers: backendHeaders({
        "x-api-key": apiKey,
      }),
      cache: "no-store",
      signal: upstreamSignal(),
    }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return NextResponse.json(
      { error: data.error || data.errors || "KYC status fetch failed", data },
      { status: response.status }
    );
  }

  return NextResponse.json(data, { status: response.status });
}
