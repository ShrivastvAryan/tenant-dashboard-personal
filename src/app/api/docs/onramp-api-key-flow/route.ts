import { NextResponse } from "next/server";
import { loadOnrampApiKeyFlowMarkdown } from "@/lib/offrampApiKeyFlowDoc";

export async function GET() {
  const markdown = await loadOnrampApiKeyFlowMarkdown();

  return new NextResponse(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="onramp-api-key-flow.md"',
      "Cache-Control": "no-store",
    },
  });
}
