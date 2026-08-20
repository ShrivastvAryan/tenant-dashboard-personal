import Link from "next/link";
import DashboardShell from "@/components/DashboardShell";
import MarkdownDocContent from "@/components/MarkdownDocContent";
import PageHeading from "@/components/PageHeading";
import {
  ONRAMP_API_KEY_FLOW_DOC_TITLE,
  loadOnrampApiKeyFlowMarkdown,
  parseMarkdownBlocks,
} from "@/lib/offrampApiKeyFlowDoc";

export default async function OnrampDocumentationPage() {
  const markdown = await loadOnrampApiKeyFlowMarkdown();
  const blocks = parseMarkdownBlocks(markdown);
  const heroText =
    blocks.find((block) => block.type === "paragraph")?.text ||
    "API-key tenant flow for converting fiat to crypto for end-users.";

  return (
    <DashboardShell active="Documentation">
      <PageHeading
        title={ONRAMP_API_KEY_FLOW_DOC_TITLE}
        description="Embedded tenant-facing onramp API flow guidance with markdown export."
      />

      <div className="flex flex-col gap-4">
        <section className="flex flex-col gap-4 rounded-3xl border border-[#ebebeb] bg-[linear-gradient(135deg,#f8fafc_0%,#eef4ff_100%)] p-5 sm:p-6">
          <p className="text-sm leading-7 text-[#475569]">{heroText}</p>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link
              href="/documentation"
              className="inline-flex items-center rounded-xl border border-[#dbe1ea] bg-white px-4 py-2 text-sm font-medium text-[#0f172a] transition-colors hover:bg-[#f8fafc]"
            >
              Offramp docs
            </Link>
            <a
              href="/api/docs/onramp-api-key-flow"
              className="inline-flex items-center rounded-xl border border-[#dbe1ea] bg-white px-4 py-2 text-sm font-medium text-[#0f172a] transition-colors hover:bg-[#f8fafc]"
            >
              Download `.md`
            </a>
          </div>
        </section>

        <MarkdownDocContent blocks={blocks} />
      </div>
    </DashboardShell>
  );
}
