"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { GetPriorityRailBilling, PriorityRailBilling } from "@/actions/billing";
import DashboardShell from "@/components/DashboardShell";
import PageHeading from "@/components/PageHeading";
import StatCard from "@/components/StatCard";

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

export default function BillingPage() {
  const [billing, setBilling] = useState<PriorityRailBilling | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadBilling() {
    setLoading(true);
    setError(null);
    const res = await GetPriorityRailBilling();
    if (res.success && res.data) {
      setBilling(res.data);
    } else {
      setError(res.error || "Failed to fetch priority rail billing");
    }
    setLoading(false);
  }

  useEffect(() => {
    loadBilling();
  }, []);

  return (
    <DashboardShell active="Billing">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeading
          title="Billing"
          description="Priority rail KYC and KYB charges for the current billing cycle."
        />
        <button
          onClick={loadBilling}
          disabled={loading}
          className="flex items-center justify-center gap-1.5 bg-[var(--color-surface)] border border-[var(--color-stroke)] px-3 py-2 rounded-[31px] text-xs font-medium text-[#0f172a] hover:bg-[var(--color-card)] disabled:opacity-60 transition-colors"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#991b1b]">
          {error}
        </div>
      )}

      {loading && !billing ? (
        <div className="flex h-[240px] items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#ebebeb] border-t-[#0f172a] rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <StatCard
              title="Cycle Total"
              value={`$${billing?.totals.amountUsd || "0.00"}`}
            />
            <StatCard
              title="Charges"
              value={billing?.totals.chargeCount || 0}
            />
            <StatCard
              title="Individual KYC"
              value={billing?.totals.individualCount || 0}
            />
            <StatCard
              title="Business KYB"
              value={billing?.totals.businessCount || 0}
            />
          </div>

          <div className="flex flex-col gap-[18px] p-4 sm:p-[18px] rounded-[24px] bg-[var(--color-card)] border border-[var(--color-stroke)] w-full shell-enter">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <p className="text-lg font-semibold leading-6 text-[#0f172a]">
                Priority Rail Charges
              </p>
              {billing && (
                <p className="text-xs text-[#64748b]">
                  {formatDate(billing.cycle.startsAt)} to {formatDate(billing.cycle.endsAt)}
                </p>
              )}
            </div>

            <div className="overflow-x-auto -mx-[18px] px-[18px]">
              <div className="min-w-[900px] flex flex-col bg-[var(--color-table)] border border-[var(--color-stroke-strong)] rounded-[18px] overflow-hidden">
                <div className="grid grid-cols-[1.3fr_1fr_1fr_1fr_0.8fr_0.8fr_1fr] gap-3 px-[18px] py-3 text-[10px] font-medium uppercase tracking-[0.06em] text-[#8a94a6] bg-[var(--color-table-header)]">
                  <span>Email</span>
                  <span>Business Type</span>
                  <span>Profile</span>
                  <span>Charge</span>
                  <span>Base</span>
                  <span>Total</span>
                  <span>Billed At</span>
                </div>

                <div className="h-px bg-[var(--color-stroke-strong)] w-full" />

                {billing?.charges.length === 0 && (
                  <div className="px-[18px] py-6 text-sm text-[#64748b]">
                    No priority rail billing charges in this cycle.
                  </div>
                )}

                {billing?.charges.map((charge) => (
                  <div
                    key={charge.id}
                    className="grid grid-cols-[1.3fr_1fr_1fr_1fr_0.8fr_0.8fr_1fr] gap-3 items-center px-[18px] py-3 text-xs text-[#0f172a] border-b border-[var(--color-stroke-strong)] last:border-b-0"
                  >
                    <span className="truncate">{charge.email}</span>
                    <span className="capitalize">{charge.businessType.replaceAll("_", " ")}</span>
                    <span className="capitalize">{charge.profileType}</span>
                    <span className="uppercase">{charge.chargeType.replaceAll("_", " ")}</span>
                    <span>${charge.baseAmountUsd}</span>
                    <span className="font-semibold">${charge.amountUsd}</span>
                    <span>{formatDate(charge.billedAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardShell>
  );
}
