"use client";

import React from "react";
import { CountryCombobox } from "@/components/CountryCombobox";

interface Step3ContactProps {
  formData: any;
  fieldErrors: Record<string, string>;
  handleChange: (field: string, value: any) => void;
}

export function Step3Contact({ formData, fieldErrors, handleChange }: Step3ContactProps) {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs text-[#64748b]">How to reach you. All fields required for verification.</p>

      <div className="flex flex-col gap-1.5 max-w-lg">
        <label className="text-xs font-medium text-[#0f172a]">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={formData.email || ""}
          onChange={(e) => handleChange("email", e.target.value)}
          placeholder="abcdc@gmail.com"
          className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
            fieldErrors.email
              ? "border-red-500 focus:border-red-500"
              : "border-[var(--color-stroke)] focus:border-kyc-primary"
          }`}
        />
        {fieldErrors.email && (
          <span className="text-[11px] text-red-500 font-medium">{fieldErrors.email}</span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#0f172a]">
            Phone country <span className="text-red-500">*</span>
          </label>
          <CountryCombobox
            value={formData.phoneCountry || ""}
            onChange={(val) => handleChange("phoneCountry", val)}
            placeholder="Select phone country..."
            className={fieldErrors.phoneCountry ? "border-red-500" : ""}
          />
          {fieldErrors.phoneCountry && (
            <span className="text-[11px] text-red-500 font-medium">{fieldErrors.phoneCountry}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#0f172a]">
            Phone <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={formData.phone || ""}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="2025550100"
            className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
              fieldErrors.phone
                ? "border-red-500 focus:border-red-500"
                : "border-[var(--color-stroke)] focus:border-kyc-primary"
            }`}
          />
          <span className="text-[11px] text-[#64748b]">Enter your number without the country code</span>
          {fieldErrors.phone && (
            <span className="text-[11px] text-red-500 font-medium">{fieldErrors.phone}</span>
          )}
        </div>
      </div>
    </div>
  );
}
