import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL, backendHeaders } from "@/lib/backend";
import { upstreamSignal } from "@/lib/upstream";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const apiKey = String(body.apiKey || "efgh1234").trim();

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  const params = new URLSearchParams({
    email: String(body.email || "a.sguy29@gmail.com").trim(),
    chainId: String(body.chainId || "137"),
    sellTokenSymbol: String(body.sellTokenSymbol || "USDC").toUpperCase(),
    sellTokenAmount: String(body.sellTokenAmount || "0"),
  });

  const response = await fetch(`${BACKEND_URL}/offramp/balance/?${params.toString()}`, {
    method: "GET",
    headers: backendHeaders({
      "x-api-key": apiKey,
    }),
    cache: "no-store",
    signal: upstreamSignal(),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return NextResponse.json(
      { error: data.error || data.errors || "Balance lookup failed", data },
      { status: response.status }
    );
  }

  return NextResponse.json(data, { status: response.status });
}
