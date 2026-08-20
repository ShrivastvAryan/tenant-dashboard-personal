import type { MarkdownBlock } from "@/lib/offrampApiKeyFlowDoc";

function renderInlineCode(text: string) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={`${part}-${index}`}
          className="rounded-md bg-white px-1.5 py-0.5 text-[0.95em] text-[#0f172a]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${part}-${index}`} className="font-semibold text-[#0f172a]">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

interface MarkdownDocContentProps {
  blocks: MarkdownBlock[];
}

export default function MarkdownDocContent({ blocks }: MarkdownDocContentProps) {
  return (
    <section className="flex flex-col gap-4">
      {blocks.map((block, index) => {
        if (block.type === "rule") {
          return (
            <div
              key={`rule-${index}`}
              className="h-px w-full bg-[#e2e8f0]"
            />
          );
        }

        if (block.type === "heading") {
          if (block.level === 1) {
            return null;
          }

          if (block.level === 2) {
            return (
              <div key={`heading-${index}`} className="pt-3 first:pt-0">
                <h2 className="text-xl font-semibold text-[#0f172a]">
                  {block.text}
                </h2>
              </div>
            );
          }

          return (
            <h3
              key={`heading-${index}`}
              className="text-base font-semibold text-[#0f172a]"
            >
              {block.text}
            </h3>
          );
        }

        if (block.type === "paragraph") {
          const isResponseLabel = block.text?.startsWith("**Response");
          const isImportantLabel = block.text?.startsWith("**Important");
          const cardClass =
            isResponseLabel || isImportantLabel
              ? "rounded-2xl border border-[#dbe1ea] bg-white px-4 py-3"
              : "";

          return (
            <div key={`paragraph-${index}`} className={cardClass}>
              <p className="text-sm leading-7 text-[#475569]">
                {renderInlineCode(block.text || "")}
              </p>
            </div>
          );
        }

        if (block.type === "list") {
          return (
            <ul
              key={`list-${index}`}
              className="flex flex-col gap-2 rounded-2xl border border-[#dbe1ea] bg-white p-4"
            >
              {(block.items || []).map((item) => (
                <li key={item} className="text-sm leading-6 text-[#0f172a]">
                  {renderInlineCode(item)}
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === "table") {
          return (
            <pre
              key={`table-${index}`}
              className="overflow-x-auto rounded-2xl border border-[#dbe1ea] bg-white px-4 py-3 text-xs leading-6 text-[#334155] font-[family-name:var(--font-geist-mono,ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation_Mono,Courier_New,monospace)]"
            >
              {block.text}
            </pre>
          );
        }

        if (block.type === "code") {
          const dark = (block.language || "").toLowerCase() === "json";
          return (
            <pre
              key={`code-${index}`}
              className={`overflow-x-auto rounded-2xl border px-4 py-4 text-sm leading-6 font-[family-name:var(--font-geist-mono,ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation_Mono,Courier_New,monospace)] ${
                dark
                  ? "border-[#0f172a] bg-[#0f172a] text-[#e2e8f0]"
                  : "border-[#dbe1ea] bg-white text-[#0f172a]"
              }`}
            >
              {block.text}
            </pre>
          );
        }

        return null;
      })}
    </section>
  );
}
