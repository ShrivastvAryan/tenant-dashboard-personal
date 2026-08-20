"use client";

import React from "react";

interface Step6VolumesProps {
  formData: any;
  fieldErrors: Record<string, string>;
  handleChange: (field: string, value: any) => void;
}

export function Step6Volumes({ formData, fieldErrors, handleChange }: Step6VolumesProps) {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-xs text-[#64748b]">
        Your expected monthly activity. Drives compliance bucketing at submit.
      </p>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-bold text-[#0f172a]">Monthly Fiat Activity</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#0f172a]">
              Count of fiat pay-ins <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.fiatPayInsCount || ""}
              onChange={(e) => handleChange("fiatPayInsCount", e.target.value)}
              placeholder="0"
              className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
                fieldErrors.fiatPayInsCount
                  ? "border-red-500 focus:border-red-500"
                  : "border-[var(--color-stroke)] focus:border-kyc-primary"
              }`}
            />
            {fieldErrors.fiatPayInsCount && (
              <span className="text-[11px] text-red-500 font-medium">{fieldErrors.fiatPayInsCount}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#0f172a]">
              Count of fiat payouts <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.fiatPayoutsCount || ""}
              onChange={(e) => handleChange("fiatPayoutsCount", e.target.value)}
              placeholder="0"
              className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
                fieldErrors.fiatPayoutsCount
                  ? "border-red-500 focus:border-red-500"
                  : "border-[var(--color-stroke)] focus:border-kyc-primary"
              }`}
            />
            {fieldErrors.fiatPayoutsCount && (
              <span className="text-[11px] text-red-500 font-medium">{fieldErrors.fiatPayoutsCount}</span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 max-w-md">
          <label className="text-xs font-medium text-[#0f172a]">
            Monthly fiat volume (USD) <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center rounded-xl border border-[var(--color-stroke)] overflow-hidden focus-within:border-kyc-primary">
            <span className="px-3 text-sm text-[#64748b] bg-[#f8fafc] border-r border-[var(--color-stroke)] py-2.5">
              $
            </span>
            <input
              type="text"
              value={formData.monthlyFiatVolumeUsd || ""}
              onChange={(e) => handleChange("monthlyFiatVolumeUsd", e.target.value)}
              placeholder="10,000"
              className="h-11 w-full px-3 text-sm outline-none"
            />
          </div>
          {fieldErrors.monthlyFiatVolumeUsd && (
            <span className="text-[11px] text-red-500 font-medium">{fieldErrors.monthlyFiatVolumeUsd}</span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-2">
        <div>
          <h3 className="text-sm font-bold text-[#0f172a]">Monthly Crypto Activity</h3>
          <p className="text-xs text-[#64748b] mt-0.5">Leave blank if you don't deal in crypto.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#0f172a]">Count of crypto pay-ins</label>
            <input
              type="text"
              value={formData.cryptoPayInsCount || ""}
              onChange={(e) => handleChange("cryptoPayInsCount", e.target.value)}
              placeholder="0"
              className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-kyc-primary"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#0f172a]">Count of crypto payouts</label>
            <input
              type="text"
              value={formData.cryptoPayoutsCount || ""}
              onChange={(e) => handleChange("cryptoPayoutsCount", e.target.value)}
              placeholder="0"
              className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-kyc-primary"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 max-w-md">
          <label className="text-xs font-medium text-[#0f172a]">Monthly crypto volume (USD)</label>
          <div className="flex items-center rounded-xl border border-[var(--color-stroke)] overflow-hidden focus-within:border-kyc-primary">
            <span className="px-3 text-sm text-[#64748b] bg-[#f8fafc] border-r border-[var(--color-stroke)] py-2.5">
              $
            </span>
            <input
              type="text"
              value={formData.monthlyCryptoVolumeUsd || ""}
              onChange={(e) => handleChange("monthlyCryptoVolumeUsd", e.target.value)}
              placeholder="0"
              className="h-11 w-full px-3 text-sm outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
