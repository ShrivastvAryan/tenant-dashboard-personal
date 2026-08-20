"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Check, Copy } from "lucide-react";

interface CopyableValueProps {
  value?: string | number | null;
  fallback?: string;
  className?: string;
}

export default function CopyableValue({
  value,
  fallback = "-",
  className = "",
}: CopyableValueProps) {
  const displayValue = value === null || value === undefined || value === "" ? fallback : String(value);
  const canCopy = displayValue !== fallback;
  const [copied, setCopied] = useState(false);
  const [tooltip, setTooltip] = useState<{ top: number; left: number; width: number } | null>(null);

  async function handleCopy() {
    if (!canCopy || typeof navigator === "undefined") return;

    try {
      await navigator.clipboard.writeText(displayValue);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  function showTooltip(element: HTMLDivElement) {
    const rect = element.getBoundingClientRect();
    setTooltip({
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
    });
  }

  return (
    <>
      <div
        className={`relative flex min-w-0 items-center gap-1.5 text-sm font-medium text-[#0f172a] ${className}`}
        onMouseEnter={(event) => showTooltip(event.currentTarget)}
        onMouseLeave={() => setTooltip(null)}
        onFocus={(event) => showTooltip(event.currentTarget)}
        onBlur={() => setTooltip(null)}
      >
        <span className="min-w-0 flex-1 truncate">{displayValue}</span>
        {canCopy ? (
          <button
            type="button"
            onClick={handleCopy}
            aria-label={`Copy ${displayValue}`}
            className="flex size-5 shrink-0 items-center justify-center rounded-md text-[#64748b] hover:bg-[#eef2f7] hover:text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#cbd5e1]"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
        ) : null}
      </div>

      {tooltip && typeof document !== "undefined"
        ? createPortal(
            <div
              className="pointer-events-none fixed z-[9999] max-w-[min(520px,calc(100vw-24px))] rounded-xl border border-[#dbe1ea] bg-white px-3 py-2 text-xs font-medium leading-5 text-[#0f172a] shadow-[0_16px_40px_rgba(15,23,42,0.16)]"
              style={{
                top: tooltip.top,
                left: Math.min(tooltip.left, window.innerWidth - 24),
                transform: tooltip.left + tooltip.width / 2 > window.innerWidth / 2 ? "translateX(-100%)" : undefined,
              }}
            >
              <span className="break-all">{displayValue}</span>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
