"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRightLeft, RefreshCw } from "lucide-react";
import { GetFxRate } from "@/actions/fx";

type FxTab = "LOCAL" | "RAMPABLE";

export default function FxConverterCard() {
  const [activeTab, setActiveTab] = useState<FxTab>("LOCAL");
  const [usdcAmount, setUsdcAmount] = useState("100");
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadRate(tab: FxTab) {
    setLoading(true);
    setError("");
    const res = await GetFxRate(tab);
    if (res.success && res.data) {
      setRate(Number(res.data.rate));
    } else {
      setRate(null);
      setError(res.error || "Failed to fetch exchange rate");
    }
    setLoading(false);
  }

  useEffect(() => {
    loadRate(activeTab);
  }, [activeTab]);

  const inrAmount = useMemo(() => {
    const amount = Number(usdcAmount);
    if (!rate || Number.isNaN(amount)) return "0.00";
    return (amount * rate).toFixed(2);
  }, [rate, usdcAmount]);

  return (
    <div className="flex flex-col gap-5 rounded-3xl border border-[var(--color-stroke)] bg-[#f8fafc] p-5 overflow-hidden">
      <div className="flex items-start justify-between gap-3 flex-col sm:flex-row">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-[#0f172a]">
            USDC to INR converter
          </h2>
          <p className="text-sm text-[#64748b]">
            Switch between cached local pricing and Rampable international rates.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-white p-1">
          {(["LOCAL", "RAMPABLE"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-[#f1f5fb] text-[#0f172a]"
                  : "text-[#64748b] hover:bg-[#f8fafc]"
              }`}
            >
              {tab === "LOCAL" ? "Local" : "International"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-end">
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-[0.08em] text-[#64748b]">
            USDC amount
          </span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={usdcAmount}
            onChange={(e) => setUsdcAmount(e.target.value)}
            className="h-12 rounded-2xl border border-[var(--color-stroke)] bg-white px-4 text-base font-semibold text-[#0f172a] outline-none focus:border-[#9daffa]"
          />
        </label>

        <div className="flex h-12 items-center justify-center text-[#64748b]">
          <ArrowRightLeft size={18} />
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-[0.08em] text-[#64748b]">
            INR amount
          </span>
          <div className="flex h-12 items-center rounded-2xl border border-[var(--color-stroke)] bg-white px-4 text-base font-semibold text-[#0f172a]">
            Rs {inrAmount}
          </div>
        </label>
      </div>

      <div className="flex items-center justify-between gap-3 flex-col sm:flex-row">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-[#0f172a]">
            {loading ? "Fetching rate..." : `1 USDC = Rs ${rate?.toFixed(2) || "0.00"}`}
          </span>
          {error && <span className="text-xs text-red-500">{error}</span>}
        </div>

        <button
          onClick={() => loadRate(activeTab)}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-stroke)] bg-white px-3 py-2 text-sm font-medium text-[#0f172a] hover:bg-[#f8fafc]"
        >
          <RefreshCw size={14} />
          Refresh rate
        </button>
      </div>
    </div>
  );
}
