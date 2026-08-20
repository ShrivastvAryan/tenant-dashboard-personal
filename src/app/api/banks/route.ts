import { NextRequest, NextResponse } from "next/server";
import { upstreamSignal } from "@/lib/upstream";

export async function GET(request: NextRequest) {
  const country = (request.nextUrl.searchParams.get("country") || "INDIA").trim().toUpperCase();

  const response = await fetch(
    `https://api.rampable.co/v1/reference/banks?page=1&limit=1039&country=${encodeURIComponent(country)}`,
    {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 600 },
      signal: upstreamSignal(),
    }
  );

  if (!response.ok) {
    return NextResponse.json({ error: "Failed to fetch banks" }, { status: response.status });
  }

  const payload = await response.json().catch(() => ({}));
  const docs = Array.isArray(payload?.data?.docs) ? payload.data.docs : [];
  const banks = docs.filter((bank: { country?: string }) => (bank.country || "").toUpperCase() === country);

  return NextResponse.json(banks);
}
