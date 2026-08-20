"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Download, ChevronLeft, ChevronRight } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import DashboardShell from "@/components/DashboardShell";
import TopBar from "@/components/TopBar";
import StatCard from "@/components/StatCard";
import CopyableValue from "@/components/CopyableValue";
import { GetTenantStats, TenantStats } from "@/actions/tenant";
import { GetTenantPayments, PaymentPage, UnifiedPayment } from "@/actions/payments";

function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

type FilterType = "all" | "deposit" | "onramp" | "offramp" | "withdraw";

export default function PaymentsPage() {
  const [query, setQuery] = useState("");
  const [tenantStats, setTenantStats] = useState<TenantStats | null>(null);
  const [payments, setPayments] = useState<PaymentPage>({
    count: 0,
    total_pages: 1,
    page_number: 1,
    per_page: 10,
    next: null,
    previous: null,
    results: [],
  });
  const [filter, setFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [statsRes, paymentsRes] = await Promise.all([
        GetTenantStats(),
        GetTenantPayments(1, filter),
      ]);
      if (statsRes.success) setTenantStats(statsRes.data || null);
      setPayments(paymentsRes);
      setLoading(false);
    }
    load();
  }, [filter]);

  async function handlePageChange(page: number) {
    setLoading(true);
    const res = await GetTenantPayments(page, filter);
    setPayments(res);
    setLoading(false);
  }

  const filteredPayments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return payments.results;
    return payments.results.filter((payment) =>
      [
        payment.payment_id,
        payment.recipient,
        payment.status,
        payment.network,
        payment.type,
        payment.currency,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(normalizedQuery)
        )
    );
  }, [payments.results, query]);

  function handleExportCSV() {
    const headers = ["Payment ID", "Recipient", "Amount", "Currency", "Fee", "Network", "Status", "Created At"];
    const rows = filteredPayments.map((p) => [
      p.payment_id,
      p.recipient,
      p.amount.toFixed(2),
      p.currency || "-",
      p.fee.toFixed(2),
      p.network,
      p.status,
      p.created_at ? new Date(p.created_at).toLocaleDateString() : "-",
    ]);
    downloadCSV("payments.csv", headers, rows);
  }

  function getPages(): (number | string)[] {
    const totalPages = payments.total_pages;
    const current = payments.page_number;
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

  if (loading && payments.results.length === 0) {
    return (
      <DashboardShell active="Payments">
        <div className="flex min-h-[320px] w-full items-center justify-center" aria-label="Loading payments">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#ebebeb] border-t-[#0f172a]" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <div className="flex w-full min-h-screen min-w-0 overflow-x-hidden bg-[var(--color-shell)]">
      <Sidebar active="Payments" />

      <div className="flex min-w-0 flex-col flex-1 gap-3 p-2 sm:p-3 bg-[var(--color-shell)]">
        <TopBar />

        <main className="flex min-w-0 w-full flex-col gap-8 sm:gap-[52px] items-center bg-[var(--color-surface)] rounded-[24px] sm:rounded-[28px] px-3 sm:px-4 md:px-6 lg:px-[212px] py-4 sm:py-6 flex-1 border border-[var(--color-stroke)] overflow-x-hidden shell-enter">
          <div className="flex min-w-0 flex-col gap-6 sm:gap-8 w-full max-w-[1264px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-1.5 bg-[var(--color-input)] h-9 px-3 rounded-xl w-full sm:max-w-[325px]">
                <Search size={16} className="text-[#64748b] shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search payments by ID, recipient..."
                  className="bg-transparent text-xs text-[#0f172a] placeholder:text-[#64748b] outline-none w-full"
                />
              </div>
              <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
                <button
                  onClick={handleExportCSV}
                  className="flex items-center justify-center gap-1.5 w-full sm:w-auto bg-[var(--color-surface)] border border-[var(--color-stroke)] px-3 py-2 rounded-[31px] text-xs font-medium text-[#0f172a] hover:bg-[var(--color-card)] transition-colors"
                >
                  <Download size={16} />
                  Export CSV
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <StatCard
                title="Total Volume"
                value={`$${filteredPayments.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}`}
              />
              <StatCard
                title="Successful Payments"
                value={filteredPayments.filter((item) => {
                  const normalizedStatus = item.status.toLowerCase();
                  return normalizedStatus === "success" || normalizedStatus === "complete" || normalizedStatus === "completed";
                }).length}
              />
              <StatCard
                title="Processing Payments"
                value={filteredPayments.filter((item) => item.status.toLowerCase() === "pending" || item.status.toLowerCase() === "processing").length}
              />
              <StatCard
                title="Failed Payments"
                value={filteredPayments.filter((item) => item.status.toLowerCase() === "failed").length}
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {([
                { key: "all", label: "All" },
                { key: "deposit", label: "Deposits" },
                { key: "onramp", label: "Onramps" },
                { key: "offramp", label: "Offramps" },
                { key: "withdraw", label: "Withdrawals" },
              ] as { key: FilterType; label: string }[]).map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filter === f.key
                      ? "bg-[#0f172a] text-white"
                      : "bg-[var(--color-card)] text-[#64748b] hover:bg-[#edf1f6]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-[18px] p-4 sm:p-[18px] rounded-[24px] bg-[var(--color-card)] border border-[var(--color-stroke)] w-full shell-enter">
              <div className="flex items-center gap-6">
                <p className="text-lg font-semibold leading-6 text-[#0f172a] whitespace-nowrap">
                  Payments
                </p>
              </div>

              <div className="overflow-x-auto -mx-[18px] px-[18px]">
                <div className="min-w-[800px] flex flex-col bg-[var(--color-table)] border border-[var(--color-stroke-strong)] rounded-[18px] overflow-hidden">
                  <div className="flex items-center justify-between px-[18px] py-3 h-10 text-[10px] font-medium uppercase tracking-[0.06em] text-[#8a94a6] bg-[var(--color-table-header)]">
                    <span className="w-[120px]">Payment ID</span>
                    <span className="w-[140px]">Recipient</span>
                    <span className="w-[100px]">Amount</span>
                    <span className="w-[80px]">Fee</span>
                    <span className="w-[80px]">Network</span>
                    <span className="w-[100px]">Status</span>
                    <span className="w-[100px]">Created At</span>
                  </div>

                  <div className="h-px bg-[var(--color-stroke-strong)] w-full" />

                  {filteredPayments.length === 0 && (
                    <div className="px-[18px] py-6 text-sm text-[#64748b]">
                      {query ? "No payments match this search" : "No payments yet"}
                    </div>
                  )}

                  {filteredPayments.map((row: UnifiedPayment) => (
                    <div
                      key={`${row.type}-${row.id}`}
                      className="flex items-center justify-between px-[18px] py-3 rounded-xl odd:bg-white even:bg-[#f9fbfd]"
                    >
                      <CopyableValue value={row.payment_id} className="w-[120px]" />
                      <CopyableValue value={row.recipient} fallback="—" className="w-[140px]" />
                      <span className="w-[100px] text-sm font-medium text-[#0f172a]">
                        {row.amount.toFixed(2)} {row.currency || ""}
                      </span>
                      <span className="w-[80px] text-sm font-medium text-[#0f172a]">
                        {row.fee.toFixed(2)}
                      </span>
                      <span className="w-[80px] text-sm font-medium text-[#0f172a] truncate">
                        {row.network}
                      </span>
                      <div className="w-[100px]">
                        <StatusBadge status={row.status} />
                      </div>
                      <span className="w-[100px] text-sm font-medium text-[#0f172a]">
                        {row.created_at
                          ? new Date(row.created_at).toLocaleDateString()
                          : "-"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3 rounded-[31px] flex-wrap">
                  <span className="text-xs font-medium text-[#0f172a] whitespace-nowrap">
                    Rows per page
                  </span>
                  <div className="flex items-center gap-1 bg-[var(--color-surface)] border border-[var(--color-stroke)] h-8 pl-3 pr-1.5 py-3 rounded-xl">
                    <span className="text-xs font-medium text-[#0f172a] whitespace-nowrap">
                      {payments.per_page}
                    </span>
                    <ChevronLeft size={16} className="text-[#0f172a] rotate-[-90deg]" />
                  </div>
                  <span className="text-xs font-medium text-[#0f172a] whitespace-nowrap">
                    {filteredPayments.length > 0
                      ? `${(payments.page_number - 1) * payments.per_page + 1}-${(payments.page_number - 1) * payments.per_page + filteredPayments.length} of ${query ? filteredPayments.length : payments.count}`
                      : "0 of 0"}
                  </span>
                </div>

                <div className="flex items-center gap-1 rounded-[31px] self-end sm:self-auto">
                  <button
                    onClick={() => handlePageChange(payments.page_number - 1)}
                    disabled={!payments.previous}
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
                        onClick={() => handlePageChange(p)}
                        className={`flex items-center justify-center size-8 rounded-[44px] text-xs font-medium ${
                          p === payments.page_number
                            ? "bg-[#0f172a] text-white"
                            : "text-[#0f172a] hover:bg-[#eef2f7]"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                  <button
                    onClick={() => handlePageChange(payments.page_number + 1)}
                    disabled={!payments.next}
                    className="flex items-center justify-center bg-[var(--color-surface)] border border-[var(--color-stroke)] h-8 px-1.5 rounded-xl disabled:opacity-40"
                  >
                    <ChevronRight size={24} className="text-[#0f172a]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
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
