"use client";

import React from "react";
import { SOURCE_OF_FUNDS_OPTIONS, ACCOUNT_PURPOSE_OPTIONS } from "@/lib/kycEnums";

interface Step5RiskProps {
  formData: any;
  fieldErrors: Record<string, string>;
  handleChange: (field: string, value: any) => void;
}

export function Step5Risk({ formData, fieldErrors, handleChange }: Step5RiskProps) {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs text-[#64748b]">
        Risk-screening attestations. Required at submit regardless of jurisdiction.
      </p>

      <div className="flex flex-col gap-1.5 max-w-2xl">
        <label className="text-xs font-medium text-[#0f172a]">
          Primary source of funds <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.primarySourceOfFunds || ""}
          onChange={(e) => handleChange("primarySourceOfFunds", e.target.value)}
          className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
            fieldErrors.primarySourceOfFunds
              ? "border-red-500 focus:border-red-500"
              : "border-[var(--color-stroke)] focus:border-kyc-primary"
          }`}
        >
          <option value="">Select...</option>
          {SOURCE_OF_FUNDS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {fieldErrors.primarySourceOfFunds && (
          <span className="text-[11px] text-red-500 font-medium">{fieldErrors.primarySourceOfFunds}</span>
        )}
      </div>

      <div className="flex flex-col gap-1.5 max-w-2xl">
        <label className="text-xs font-medium text-[#0f172a]">
          Account purpose <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.accountPurpose || ""}
          onChange={(e) => handleChange("accountPurpose", e.target.value)}
          className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
            fieldErrors.accountPurpose
              ? "border-red-500 focus:border-red-500"
              : "border-[var(--color-stroke)] focus:border-kyc-primary"
          }`}
        >
          <option value="">Select...</option>
          {ACCOUNT_PURPOSE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {fieldErrors.accountPurpose && (
          <span className="text-[11px] text-red-500 font-medium">{fieldErrors.accountPurpose}</span>
        )}
      </div>

      <div className="rounded-2xl border border-[var(--color-stroke)] bg-white p-5 flex flex-col gap-4 max-w-2xl shadow-2xs">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={Boolean(formData.actingOnBehalfOfSomeoneElse)}
            onChange={(e) => handleChange("actingOnBehalfOfSomeoneElse", e.target.checked)}
            className="mt-0.5 rounded border-[var(--color-stroke)] text-kyc-primary focus:ring-0"
          />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-[#0f172a]">
              Check this box if you are acting on behalf of someone else
            </span>
            <span className="text-[11px] text-[#64748b]">
              For example, as a corporate treasurer or an authorized agent moving funds for a third party. Leave unchecked if you are transacting only for yourself.
            </span>
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={Boolean(formData.isPep)}
            onChange={(e) => handleChange("isPep", e.target.checked)}
            className="mt-0.5 rounded border-[var(--color-stroke)] text-kyc-primary focus:ring-0"
          />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-[#0f172a]">
              Check this box if you are a politically exposed person (PEP)
            </span>
            <span className="text-[11px] text-[#64748b]">
              A PEP holds, or recently held, a prominent public function, or is a close associate of someone who does. Leave unchecked otherwise.
            </span>
          </div>
        </label>
      </div>
    </div>
  );
}
