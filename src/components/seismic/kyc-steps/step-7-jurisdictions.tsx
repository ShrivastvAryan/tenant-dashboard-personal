"use client";

import React from "react";
import { X } from "lucide-react";
import { CountryCombobox } from "@/components/CountryCombobox";
import { getCountryName } from "@/lib/countries";
import { HIGH_RISK_ACTIVITY_OPTIONS, COUNTERPARTY_OPTIONS } from "@/lib/kycEnums";

interface Step7JurisdictionsProps {
  jurisdictionCountries: string[];
  setJurisdictionCountries: (countries: string[]) => void;
  selectedHighRiskActivities: string[];
  setSelectedHighRiskActivities: (activities: string[]) => void;
  selectedCounterparties: string[];
  setSelectedCounterparties: (counterparties: string[]) => void;
  fieldErrors: Record<string, string>;
  setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  toggleItem: (list: string[], item: string, setter: (val: string[]) => void) => void;
}

export function Step7Jurisdictions({
  jurisdictionCountries,
  setJurisdictionCountries,
  selectedHighRiskActivities,
  setSelectedHighRiskActivities,
  selectedCounterparties,
  setSelectedCounterparties,
  fieldErrors,
  setFieldErrors,
  toggleItem,
}: Step7JurisdictionsProps) {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-xs text-[#64748b] leading-relaxed">
        Where you send and receive funds, plus any high-risk activities you're involved with.
      </p>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-bold text-[#0f172a]">
          Send / Receive Jurisdictions <span className="text-red-500">*</span>
        </h3>
        <div className="relative">
          <CountryCombobox
            value=""
            onChange={(code) => {
              if (code && !jurisdictionCountries.includes(code)) {
                setJurisdictionCountries([...jurisdictionCountries, code]);
                if (fieldErrors.jurisdictionCountries) {
                  setFieldErrors((prev) => ({ ...prev, jurisdictionCountries: "" }));
                }
              }
            }}
            placeholder="Add a country..."
            className={fieldErrors.jurisdictionCountries ? "border-red-500" : ""}
          />
        </div>

        {jurisdictionCountries.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {jurisdictionCountries.map((countryCode) => (
              <span
                key={countryCode}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-kyc-primary-light text-xs font-semibold text-kyc-primary border border-kyc-primary-border"
              >
                {getCountryName(countryCode)} ({countryCode})
                <button
                  type="button"
                  onClick={() =>
                    setJurisdictionCountries(jurisdictionCountries.filter((c) => c !== countryCode))
                  }
                  className="hover:text-red-500 transition-colors"
                >
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>
        )}

        {fieldErrors.jurisdictionCountries && (
          <span className="text-[11px] text-red-500 font-medium mt-1">{fieldErrors.jurisdictionCountries}</span>
        )}
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <h3 className="text-sm font-bold text-[#0f172a]">High-Risk Activities</h3>
        <p className="text-xs text-[#64748b]">
          Disclose any of these you're involved with. Empty is the most common case.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5 mt-2">
          <div className="flex flex-col gap-2.5">
            {HIGH_RISK_ACTIVITY_OPTIONS.slice(0, Math.ceil(HIGH_RISK_ACTIVITY_OPTIONS.length / 2)).map((opt) => (
              <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer text-xs text-[#0f172a] select-none hover:opacity-80">
                <input
                  type="checkbox"
                  checked={selectedHighRiskActivities.includes(opt.value)}
                  onChange={() =>
                    toggleItem(selectedHighRiskActivities, opt.value, setSelectedHighRiskActivities)
                  }
                  className="rounded border-[var(--color-stroke)] text-kyc-primary focus:ring-0"
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>

          <div className="flex flex-col gap-2.5">
            {HIGH_RISK_ACTIVITY_OPTIONS.slice(Math.ceil(HIGH_RISK_ACTIVITY_OPTIONS.length / 2)).map((opt) => (
              <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer text-xs text-[#0f172a] select-none hover:opacity-80">
                <input
                  type="checkbox"
                  checked={selectedHighRiskActivities.includes(opt.value)}
                  onChange={() =>
                    toggleItem(selectedHighRiskActivities, opt.value, setSelectedHighRiskActivities)
                  }
                  className="rounded border-[var(--color-stroke)] text-kyc-primary focus:ring-0"
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <h3 className="text-sm font-bold text-[#0f172a]">
          Vendors and Counterparties <span className="text-red-500">*</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5 mt-2">
          <div className="flex flex-col gap-2.5">
            {COUNTERPARTY_OPTIONS.slice(0, Math.ceil(COUNTERPARTY_OPTIONS.length / 2)).map((opt) => (
              <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer text-xs text-[#0f172a] select-none hover:opacity-80">
                <input
                  type="checkbox"
                  checked={selectedCounterparties.includes(opt.value)}
                  onChange={() => {
                    toggleItem(selectedCounterparties, opt.value, setSelectedCounterparties);
                    if (fieldErrors.selectedCounterparties) {
                      setFieldErrors((prev) => ({ ...prev, selectedCounterparties: "" }));
                    }
                  }}
                  className="rounded border-[var(--color-stroke)] text-kyc-primary focus:ring-0"
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>

          <div className="flex flex-col gap-2.5">
            {COUNTERPARTY_OPTIONS.slice(Math.ceil(COUNTERPARTY_OPTIONS.length / 2)).map((opt) => (
              <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer text-xs text-[#0f172a] select-none hover:opacity-80">
                <input
                  type="checkbox"
                  checked={selectedCounterparties.includes(opt.value)}
                  onChange={() => {
                    toggleItem(selectedCounterparties, opt.value, setSelectedCounterparties);
                    if (fieldErrors.selectedCounterparties) {
                      setFieldErrors((prev) => ({ ...prev, selectedCounterparties: "" }));
                    }
                  }}
                  className="rounded border-[var(--color-stroke)] text-kyc-primary focus:ring-0"
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
        {fieldErrors.selectedCounterparties && (
          <span className="text-[11px] text-red-500 font-medium mt-1">{fieldErrors.selectedCounterparties}</span>
        )}
      </div>
    </div>
  );
}
