"use client";

import React from "react";
import { CountryCombobox } from "@/components/CountryCombobox";

interface Step1IdentityProps {
  formData: any;
  fieldErrors: Record<string, string>;
  handleChange: (field: string, value: any) => void;
}

export function Step1Identity({ formData, fieldErrors, handleChange }: Step1IdentityProps) {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-[#64748b]">Your personal identifying details.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#0f172a]">
            First name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.firstName || ""}
            onChange={(e) => handleChange("firstName", e.target.value)}
            className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
              fieldErrors.firstName
                ? "border-red-500 focus:border-red-500"
                : "border-[var(--color-stroke)] focus:border-kyc-primary"
            }`}
          />
          {fieldErrors.firstName && (
            <span className="text-[11px] text-red-500 font-medium">{fieldErrors.firstName}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#0f172a]">Middle name</label>
          <input
            type="text"
            value={formData.middleName || ""}
            onChange={(e) => handleChange("middleName", e.target.value)}
            className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-kyc-primary"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#0f172a]">
            Last name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.lastName || ""}
            onChange={(e) => handleChange("lastName", e.target.value)}
            className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
              fieldErrors.lastName
                ? "border-red-500 focus:border-red-500"
                : "border-[var(--color-stroke)] focus:border-kyc-primary"
            }`}
          />
          {fieldErrors.lastName && (
            <span className="text-[11px] text-red-500 font-medium">{fieldErrors.lastName}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#0f172a]">
            Date of birth <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.dob || ""}
            onChange={(e) => handleChange("dob", e.target.value)}
            className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
              fieldErrors.dob
                ? "border-red-500 focus:border-red-500"
                : "border-[var(--color-stroke)] focus:border-kyc-primary"
            }`}
          />
          {fieldErrors.dob && (
            <span className="text-[11px] text-red-500 font-medium">{fieldErrors.dob}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#0f172a]">
            Country of residence <span className="text-red-500">*</span>
          </label>
          <CountryCombobox
            value={formData.countryOfResidence || ""}
            onChange={(val) => handleChange("countryOfResidence", val)}
            placeholder="Select country..."
            className={fieldErrors.countryOfResidence ? "border-red-500" : ""}
          />
          {fieldErrors.countryOfResidence && (
            <span className="text-[11px] text-red-500 font-medium">{fieldErrors.countryOfResidence}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#0f172a]">
            Nationality <span className="text-red-500">*</span>
          </label>
          <CountryCombobox
            value={formData.nationality || ""}
            onChange={(val) => handleChange("nationality", val)}
            placeholder="Select nationality..."
            className={fieldErrors.nationality ? "border-red-500" : ""}
          />
          {fieldErrors.nationality && (
            <span className="text-[11px] text-red-500 font-medium">{fieldErrors.nationality}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#0f172a]">
            Citizenship <span className="text-red-500">*</span>
          </label>
          <CountryCombobox
            value={formData.citizenship || ""}
            onChange={(val) => handleChange("citizenship", val)}
            placeholder="Select citizenship..."
            className={fieldErrors.citizenship ? "border-red-500" : ""}
          />
          {fieldErrors.citizenship && (
            <span className="text-[11px] text-red-500 font-medium">{fieldErrors.citizenship}</span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-[#0f172a]">
          Tax identification number <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.taxId || ""}
          onChange={(e) => handleChange("taxId", e.target.value)}
          placeholder="e.g. ABCDE1234F"
          className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
            fieldErrors.taxId
              ? "border-red-500 focus:border-red-500"
              : "border-[var(--color-stroke)] focus:border-kyc-primary"
          }`}
        />
        {fieldErrors.taxId && (
          <span className="text-[11px] text-red-500 font-medium">{fieldErrors.taxId}</span>
        )}
      </div>
    </div>
  );
}
