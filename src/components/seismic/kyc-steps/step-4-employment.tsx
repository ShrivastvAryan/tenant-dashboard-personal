"use client";

import React from "react";
import { EMPLOYMENT_STATUS_OPTIONS } from "@/lib/kycEnums";

interface Step4EmploymentProps {
  formData: any;
  fieldErrors: Record<string, string>;
  handleChange: (field: string, value: any) => void;
}

export function Step4Employment({ formData, fieldErrors, handleChange }: Step4EmploymentProps) {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs text-[#64748b] leading-relaxed max-w-2xl">
        How you earn money. Occupation is required for everyone; use your most recent role if you're not currently working. Employer name is optional.
      </p>

      <div className="flex flex-col gap-1.5 max-w-lg">
        <label className="text-xs font-medium text-[#0f172a]">
          Employment status <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.employmentStatus || ""}
          onChange={(e) => handleChange("employmentStatus", e.target.value)}
          className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
            fieldErrors.employmentStatus
              ? "border-red-500 focus:border-red-500"
              : "border-[var(--color-stroke)] focus:border-kyc-primary"
          }`}
        >
          <option value="">Select employment status...</option>
          {EMPLOYMENT_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {fieldErrors.employmentStatus && (
          <span className="text-[11px] text-red-500 font-medium">{fieldErrors.employmentStatus}</span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl pt-1">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#0f172a]">
            Occupation <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.occupation || ""}
            onChange={(e) => handleChange("occupation", e.target.value)}
            placeholder="Software Developer"
            className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
              fieldErrors.occupation
                ? "border-red-500 focus:border-red-500"
                : "border-[var(--color-stroke)] focus:border-kyc-primary"
            }`}
          />
          {fieldErrors.occupation && (
            <span className="text-[11px] text-red-500 font-medium">{fieldErrors.occupation}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#0f172a]">Employer name (optional)</label>
          <input
            type="text"
            value={formData.employerName || ""}
            onChange={(e) => handleChange("employerName", e.target.value)}
            placeholder="DashX Tech"
            className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-kyc-primary"
          />
        </div>
      </div>
    </div>
  );
}
