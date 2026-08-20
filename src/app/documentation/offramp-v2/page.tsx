import Link from "next/link";
import DashboardShell from "@/components/DashboardShell";
import MarkdownDocContent from "@/components/MarkdownDocContent";
import PageHeading from "@/components/PageHeading";
import {
  OFFRAMP_V2_CUSTOMER_API_DOC_TITLE,
  loadOfframpV2Markdown,
  parseMarkdownBlocks,
} from "@/lib/offrampApiKeyFlowDoc";

export default async function OfframpV2DocumentationPage() {
  const markdown = await loadOfframpV2Markdown();
  const blocks = parseMarkdownBlocks(markdown);
  const heroText =
    blocks.find((block) => block.type === "paragraph")?.text ||
    "Tenant API reference for customer onboarding, accounts, quotes, and orders.";

  return (
    <DashboardShell active="Documentation">
      <PageHeading
        title={OFFRAMP_V2_CUSTOMER_API_DOC_TITLE}
        description="Tenant-facing reference for customer onboarding, accounts, quotes, and orders."
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
              href="/api/docs/offramp-v2-customer-api"
              className="inline-flex items-center rounded-xl border border-[#dbe1ea] bg-white px-4 py-2 text-sm font-medium text-[#0f172a] transition-colors hover:bg-[#f8fafc]"
            >
              Download API `.md`
            </a>
            <a
              href="/api/docs/offramp-v2-tenant-enums"
              className="inline-flex items-center rounded-xl border border-[#dbe1ea] bg-white px-4 py-2 text-sm font-medium text-[#0f172a] transition-colors hover:bg-[#f8fafc]"
            >
              Download enums `.md`
            </a>
          </div>
        </section>

        <MarkdownDocContent blocks={blocks} />
      </div>
    </DashboardShell>
  );
}
