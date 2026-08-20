import { NextResponse } from "next/server";
import {
  loadOfframpApiKeyFlowMarkdown,
} from "@/lib/offrampApiKeyFlowDoc";

export async function GET() {
  const markdown = await loadOfframpApiKeyFlowMarkdown();

  return new NextResponse(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="offramp-api-key-flow.md"',
      "Cache-Control": "no-store",
    },
  });
}
