"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { PaymentPage, UnifiedPayment } from "@/actions/payments";
import CopyableValue from "@/components/CopyableValue";

interface RecentPaymentsTableProps {
  data: PaymentPage;
  onPageChange: (page: number) => void;
  searchQuery?: string;
}

export default function RecentPaymentsTable({
  data,
  onPageChange,
  searchQuery = "",
}: RecentPaymentsTableProps) {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const rows = data.results.filter((row) => {
    if (!normalizedQuery) return true;
    return [
      row.payment_id,
      row.recipient,
      row.status,
      row.network,
      row.type,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedQuery));
  });
  const current = data.page_number;
  const totalPages = data.total_pages;

  function getPages(): (number | string)[] {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push("...");
      const start = Math.max(2, current - 1);
      const end = Math.min(totalPages - 1, current + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (current < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }

  return (
    <div className="flex min-w-0 w-full flex-col gap-[18px] p-4 sm:p-[18px] rounded-[24px] bg-[var(--color-card)] border border-[var(--color-stroke)]">
      <div className="flex items-center gap-6">
        <p className="text-lg font-semibold leading-6 text-[#0f172a] whitespace-nowrap">
          Recent Payments
        </p>
      </div>

      <div className="min-w-0 overflow-x-auto -mx-4 sm:-mx-[18px] px-4 sm:px-[18px]">
        <div className="min-w-[640px] flex flex-col bg-[var(--color-table)] border border-[var(--color-stroke-strong)] rounded-[18px] overflow-hidden">
          <div className="flex items-center justify-between px-[18px] py-3 h-10 text-[10px] font-medium uppercase tracking-[0.06em] text-[#8a94a6] bg-[var(--color-table-header)]">
            <span className="w-[92px]">Payment ID</span>
            <span className="w-[120px]">Customer</span>
            <span className="w-[140px]">Amount</span>
            <span className="w-[80px]">Currency</span>
            <span className="w-[100px]">Status</span>
          </div>

          <div className="h-px bg-[var(--color-stroke-strong)] w-full" />

          {rows.length === 0 && (
            <div className="px-[18px] py-6 text-sm text-[#64748b]">
              {normalizedQuery ? "No payments match this search" : "No payments yet"}
            </div>
          )}

          {rows.map((row: UnifiedPayment) => (
            <div
              key={`${row.type}-${row.id}`}
              className="flex items-center justify-between px-[18px] py-3 rounded-xl odd:bg-white even:bg-[#f9fbfd]"
            >
              <CopyableValue value={row.payment_id} className="w-[92px]" />
              <CopyableValue value={row.recipient} fallback="—" className="w-[120px]" />
              <span className="w-[140px] text-sm font-medium text-[#0f172a]">
                {row.amount.toFixed(2)}
              </span>
              <span className="w-[80px] text-sm font-medium text-[#0f172a]">
                {row.currency || "-"}
              </span>
              <div className="w-[100px]">
                <StatusBadge status={row.status} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex min-w-0 items-center justify-between flex-wrap gap-4">
        <div className="flex min-w-0 items-center gap-3 rounded-[31px] flex-wrap">
          <span className="text-xs font-medium text-[#0f172a] whitespace-nowrap">
            Rows per page
          </span>
          <div className="flex items-center gap-1 bg-[var(--color-surface)] border border-[var(--color-stroke)] h-8 pl-3 pr-1.5 py-3 rounded-xl">
            <span className="text-xs font-medium text-[#0f172a] whitespace-nowrap">
              {data.per_page}
            </span>
            <ChevronLeft size={16} className="text-[#0f172a] rotate-[-90deg]" />
          </div>
          <span className="text-xs font-medium text-[#0f172a] whitespace-nowrap">
            {data.count > 0
              ? `${(current - 1) * data.per_page + 1}-${Math.min(
                  current * data.per_page,
                  data.count
                )} of ${data.count}`
              : "0 of 0"}
          </span>
        </div>

        <div className="flex min-w-0 items-center gap-1 rounded-[31px] overflow-x-auto max-w-full">
          <button
            onClick={() => onPageChange(current - 1)}
            disabled={!data.previous}
            className="flex items-center justify-center bg-[var(--color-surface)] border border-[var(--color-stroke)] h-8 px-1.5 rounded-xl disabled:opacity-40"
          >
            <ChevronLeft size={24} className="text-[#0f172a]" />
          </button>
          {getPages().map((p, i) =>
            typeof p === "string" ? (
              <span key={`dots-${i}`} className="flex items-center justify-center size-8 text-xs text-[#0f172a]">
                ...
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`flex items-center justify-center size-8 rounded-[44px] text-xs font-medium ${
                  p === current
                    ? "bg-[#0f172a] text-white"
                    : "text-[#0f172a] hover:bg-[#eef2f7]"
                }`}
              >
                {p}
              </button>
            )
          )}
          <button
            onClick={() => onPageChange(current + 1)}
            disabled={!data.next}
            className="flex items-center justify-center bg-[var(--color-surface)] border border-[var(--color-stroke)] h-8 px-1.5 rounded-xl disabled:opacity-40"
          >
            <ChevronRight size={24} className="text-[#0f172a]" />
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const map: Record<string, { bg: string; border: string; text: string }> = {
    success: { bg: "bg-[#e7f9ed]", border: "border-[#5ee77a]", text: "text-[#05bb5c]" },
    complete: { bg: "bg-[#e7f9ed]", border: "border-[#5ee77a]", text: "text-[#05bb5c]" },
    completed: { bg: "bg-[#e7f9ed]", border: "border-[#5ee77a]", text: "text-[#05bb5c]" },
    pending: { bg: "bg-[#fef9c3]", border: "border-[#facc15]", text: "text-[#a16207]" },
    processing: { bg: "bg-[#fef9c3]", border: "border-[#facc15]", text: "text-[#a16207]" },
    failed: { bg: "bg-[#fee2e2]", border: "border-[#fca5a5]", text: "text-[#dc2626]" },
    refunded: { bg: "bg-[#dbeafe]", border: "border-[#93c5fd]", text: "text-[#2563eb]" },
  };
  const style = map[s] || map.pending;

  return (
    <span
      className={`inline-flex items-center gap-1 ${style.bg} border ${style.border} ${style.text} text-xs px-2 py-1 rounded-[25px] capitalize`}
    >
      {s === "success" || s === "complete" || s === "completed" ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ) : null}
      {status}
    </span>
  );
}
