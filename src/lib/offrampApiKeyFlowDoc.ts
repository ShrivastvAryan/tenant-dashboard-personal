import { readFile } from "node:fs/promises";
import path from "node:path";

export const OFFRAMP_API_KEY_FLOW_DOC_TITLE = "Offramp API Key Flow";
export const ONRAMP_API_KEY_FLOW_DOC_TITLE = "Onramp API Key Flow";
export const OFFRAMP_V2_CUSTOMER_API_DOC_TITLE = "Global Offramps";

export const OFFRAMP_API_KEY_FLOW_DOC_PATH = path.resolve(
  process.cwd(),
  "docs/offramp-api-key-flow.md"
);
export const ONRAMP_API_KEY_FLOW_DOC_PATH = path.resolve(
  process.cwd(),
  "docs/onramp-api-key-flow.md"
);
export const OFFRAMP_V2_CUSTOMER_API_DOC_PATH = path.resolve(
  process.cwd(),
  "docs/offramp-v2-customer-api.md"
);
export const OFFRAMP_V2_TENANT_ENUMS_DOC_PATH = path.resolve(
  process.cwd(),
  "docs/offramp-v2-tenant-enums.md"
);

export interface MarkdownBlock {
  type: "heading" | "paragraph" | "list" | "code" | "table" | "rule";
  level?: number;
  text?: string;
  items?: string[];
  language?: string;
}

export async function loadOfframpApiKeyFlowMarkdown() {
  return readFile(OFFRAMP_API_KEY_FLOW_DOC_PATH, "utf8");
}

export async function loadOnrampApiKeyFlowMarkdown() {
  return readFile(ONRAMP_API_KEY_FLOW_DOC_PATH, "utf8");
}

export async function loadOfframpV2CustomerApiMarkdown() {
  return readFile(OFFRAMP_V2_CUSTOMER_API_DOC_PATH, "utf8");
}

export async function loadOfframpV2TenantEnumsMarkdown() {
  return readFile(OFFRAMP_V2_TENANT_ENUMS_DOC_PATH, "utf8");
}

export async function loadOfframpV2Markdown() {
  const [api, enums] = await Promise.all([
    loadOfframpV2CustomerApiMarkdown(),
    loadOfframpV2TenantEnumsMarkdown(),
  ]);
  return `${api}\n\n## Enum Reference\n\n${enums.replace(/^#\s+.*\n/, "")}`;
}

export function parseMarkdownBlocks(markdown: string): MarkdownBlock[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    if (trimmed === "---") {
      blocks.push({ type: "rule" });
      i += 1;
      continue;
    }

    if (trimmed.startsWith("```")) {
      const language = trimmed.slice(3).trim();
      const content: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        content.push(lines[i]);
        i += 1;
      }
      blocks.push({
        type: "code",
        language,
        text: content.join("\n"),
      });
      i += 1;
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
      });
      i += 1;
      continue;
    }

    if (trimmed.startsWith("|")) {
      const tableLines = [line];
      i += 1;
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i]);
        i += 1;
      }
      blocks.push({ type: "table", text: tableLines.join("\n") });
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ""));
        i += 1;
      }
      blocks.push({ type: "list", items });
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i += 1;
      }
      blocks.push({ type: "list", items });
      continue;
    }

    const paragraphLines = [trimmed];
    i += 1;
    while (i < lines.length) {
      const next = lines[i].trim();
      if (
        !next ||
        next === "---" ||
        next.startsWith("```") ||
        next.startsWith("|") ||
        /^#{1,6}\s+/.test(next) ||
        /^[-*]\s+/.test(next) ||
        /^\d+\.\s+/.test(next)
      ) {
        break;
      }
      paragraphLines.push(next);
      i += 1;
    }
    blocks.push({ type: "paragraph", text: paragraphLines.join(" ") });
  }

  return blocks;
}
