import { NextResponse } from "next/server";
import { loadOfframpV2TenantEnumsMarkdown } from "@/lib/offrampApiKeyFlowDoc";

export async function GET() {
  return new NextResponse(await loadOfframpV2TenantEnumsMarkdown(), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": 'attachment; filename="offramp-v2-tenant-enums.md"',
      "Cache-Control": "no-store",
    },
  });
}
