"use client";

import { useEffect, useState } from "react";
import {
  Key,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  CircleAlert,
} from "lucide-react";
import {
  GetApiKey,
  CreateApiKey,
  RegenerateApiKey,
  RevokeApiKey,
  ApiKeyInfo,
} from "@/actions/apiKeys";

const MASKED_API_KEY =
  "dshx_................................";

export default function ApiKeyCard() {
  const [keyInfo, setKeyInfo] = useState<ApiKeyInfo | null>(null);
  const [merchantId, setMerchantId] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [generatedKey, setGeneratedKey] = useState("");

  useEffect(() => {
    loadKey();
    loadMerchantId();
  }, []);

  async function loadKey() {
    const res = await GetApiKey();
    setLoading(false);
    if (res.success) {
      setKeyInfo(res.data || null);
    } else {
      setError(res.error || "");
    }
  }

  async function loadMerchantId() {
    try {
      const res = await fetch("/api/user", { cache: "no-store" });
      const data = await res.json();
      setMerchantId(String(data?.merchantId || "").trim());
    } catch {
      setMerchantId("");
    }
  }

  async function handleCreate() {
    setLoading(true);
    const res = await CreateApiKey();
    if (res.success) {
      setGeneratedKey(res.data?.api_key || "");
      if (res.data?.api_key && typeof window !== "undefined") {
        window.sessionStorage.setItem(
          "tenant-dashboard:latest-api-key",
          res.data.api_key
        );
      }
      await loadKey();
    } else {
      setError(res.error || "");
      setLoading(false);
    }
  }

  async function handleRegenerate() {
    setLoading(true);
    const res = await RegenerateApiKey(keyInfo?.description || "API Key");
    if (res.success) {
      setGeneratedKey(res.data?.api_key || "");
      if (res.data?.api_key && typeof window !== "undefined") {
        window.sessionStorage.setItem(
          "tenant-dashboard:latest-api-key",
          res.data.api_key
        );
      }
      await loadKey();
    } else {
      setError(res.error || "");
      setLoading(false);
    }
  }

  async function handleRevoke() {
    if (!confirm("Revoke your API key? This cannot be undone.")) return;
    setLoading(true);
    const res = await RevokeApiKey();
    if (res.success) {
      setGeneratedKey("");
      await loadKey();
    } else {
      setError(res.error || "");
      setLoading(false);
    }
  }

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function InfoRow({
    label,
    value,
    copyable = false,
  }: {
    label: string;
    value: string;
    copyable?: boolean;
  }) {
    if (!value) return null;

    return (
      <div className="flex min-w-0 items-center gap-2 bg-white border border-[#ebebeb] rounded-lg px-3 py-2">
        <span className="shrink-0 text-xs font-medium uppercase tracking-[0.16em] text-[#94a3b8]">
          {label}
        </span>
        <code className="flex-1 min-w-0 truncate text-sm text-[#0f172a] font-mono">
          {value}
        </code>
        {copyable && (
          <button
            onClick={() => copyToClipboard(value)}
            className="shrink-0 p-1 rounded hover:bg-[#f8fafc]"
          >
            {copied ? (
              <Check size={16} className="text-[#05bb5c]" />
            ) : (
              <Copy size={16} className="text-[#64748b]" />
            )}
          </button>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-w-0 flex-col gap-4 p-4 sm:p-[18px] rounded-3xl bg-[#f8fafc] border border-[#ebebeb]">
        <div className="flex items-center gap-2">
          <Key size={18} className="text-[#64748b]" />
          <p className="text-lg font-semibold text-[#0f172a]">API keys</p>
        </div>
        <div className="h-10 bg-[#eee] rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 p-4 sm:p-[18px] rounded-3xl bg-[#f8fafc] border border-[#ebebeb] overflow-hidden shell-enter">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Key size={18} className="text-[#64748b]" />
          <p className="text-lg font-semibold text-[#0f172a]">API keys</p>
        </div>
        {keyInfo?.has_api_key && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleRegenerate}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#f1f5fb] text-xs font-medium text-[#0f172a] hover:bg-[#e2e8f0]"
              title="Regenerate"
            >
              <RefreshCw size={14} />
              Regenerate
            </button>
            <button
              onClick={handleRevoke}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#fee2e2] text-xs font-medium text-[#dc2626] hover:bg-[#fecaca]"
              title="Revoke"
            >
              <Trash2 size={14} />
              Revoke
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {generatedKey && (
        <div className="flex flex-col gap-3 rounded-2xl border border-[#dbe4ff] bg-white p-4">
          <div className="flex items-start gap-2 text-[#0f172a]">
            <CircleAlert size={16} className="mt-0.5 text-[#4166fb] shrink-0" />
            <p className="text-sm">
              Copy this API key now and store it securely. You won&apos;t be
              able to reveal it again from the dashboard.
            </p>
          </div>
          <InfoRow label="Merchant ID" value={merchantId} copyable />
          <div className="flex min-w-0 items-center gap-2 rounded-xl border border-[var(--color-stroke)] bg-[#f8fafc] px-3 py-2">
            <code className="flex-1 min-w-0 break-all text-sm text-[#0f172a] font-mono">
              {generatedKey}
            </code>
            <button
              onClick={() => copyToClipboard(generatedKey)}
              className="shrink-0 p-1 rounded hover:bg-white"
            >
              {copied ? (
                <Check size={16} className="text-[#05bb5c]" />
              ) : (
                <Copy size={16} className="text-[#64748b]" />
              )}
            </button>
          </div>
        </div>
      )}

      {!keyInfo?.has_api_key ? (
        <div className="flex flex-col gap-3">
          <InfoRow label="Merchant ID" value={merchantId} copyable />
          <p className="text-sm text-[#64748b]">No API key found.</p>
          <button
            onClick={handleCreate}
            className="self-start w-full sm:w-auto px-4 py-2 rounded-lg bg-[#4166fb] text-white text-sm font-medium"
          >
            Create API key
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <InfoRow label="Merchant ID" value={merchantId} copyable />
          <div className="flex min-w-0 items-center gap-2 bg-white border border-[#ebebeb] rounded-lg px-3 py-2">
            <code className="flex-1 text-sm text-[#0f172a] font-mono truncate">
              {MASKED_API_KEY}
            </code>
          </div>
          {keyInfo.created_at && (
            <p className="text-xs text-[#64748b]">
              Created: {new Date(keyInfo.created_at).toLocaleDateString()}
            </p>
          )}
          {keyInfo.description && (
            <p className="text-xs text-[#64748b]">{keyInfo.description}</p>
          )}
          {keyInfo.last_used && (
            <p className="text-xs text-[#64748b]">
              Last used: {new Date(keyInfo.last_used).toLocaleString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
