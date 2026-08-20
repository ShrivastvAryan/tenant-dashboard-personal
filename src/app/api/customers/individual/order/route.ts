import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL, backendHeaders } from "@/lib/backend";
import { upstreamSignal } from "@/lib/upstream";

const TOKEN_ADDRESSES: Record<string, Record<string, string>> = {
  "137": {
    USDC: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",
    USDT: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
  },
  "8453": {
    USDC: "0x833589fcd6edb6e08f4c7c32d4f71b54bdA02913",
  },
};

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const apiKey = String(body.apiKey || "efgh1234").trim();

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  const chainId = String(body.chainId || "137");
  const sellTokenSymbol = String(body.sellTokenSymbol || "USDC").toUpperCase();
  const sellTokenAddress = TOKEN_ADDRESSES[chainId]?.[sellTokenSymbol];

  if (!sellTokenAddress) {
    return NextResponse.json(
      { error: `${sellTokenSymbol} is not supported on chain ${chainId}` },
      { status: 400 }
    );
  }

  const payload = {
    email: String(body.email || "a.sguy29@gmail.com").trim(),
    sellTokenSymbol,
    sellTokenAddress,
    chainId: Number(chainId),
    fiatCurrency: String(body.fiatCurrency || "INR").toUpperCase(),
    sellTokenAmount: body.sellTokenAmount,
    bankDetails: {
      accountNumber: String(body.accountNumber || "").trim(),
      ifsc: String(body.ifsc || "").trim().toUpperCase(),
    },
    refundWalletAddress: String(body.refundWalletAddress || "").trim(),
    isNRI: Boolean(body.isNRI),
  };

  const response = await fetch(`${BACKEND_URL}/offramp/`, {
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
  if (!response.ok) {
    return NextResponse.json(
      { error: data.error || data.errors || "Offramp order creation failed", data },
      { status: response.status }
    );
  }

  return NextResponse.json(data, { status: response.status });
}
