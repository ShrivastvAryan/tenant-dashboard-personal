import { NextResponse } from "next/server";
import { loadOfframpV2CustomerApiMarkdown } from "@/lib/offrampApiKeyFlowDoc";

export async function GET() {
  return new NextResponse(await loadOfframpV2CustomerApiMarkdown(), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": 'attachment; filename="offramp-v2-customer-api.md"',
      "Cache-Control": "no-store",
    },
  });
}
