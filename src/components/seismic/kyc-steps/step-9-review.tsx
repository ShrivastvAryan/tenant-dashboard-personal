"use client";

import React from "react";

interface Step9ReviewProps {
  agreeTerms: boolean;
  setAgreeTerms: (val: boolean) => void;
  agreeAccurate: boolean;
  setAgreeAccurate: (val: boolean) => void;
  enableUsdCapabilities: boolean;
  setEnableUsdCapabilities: (val: boolean) => void;
  fieldErrors: Record<string, string>;
  setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleNext: () => Promise<void>;
}

export function Step9Review({
  agreeTerms,
  setAgreeTerms,
  agreeAccurate,
  setAgreeAccurate,
  enableUsdCapabilities,
  setEnableUsdCapabilities,
  fieldErrors,
  setFieldErrors,
  handleNext,
}: Step9ReviewProps) {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-xs text-[#64748b] leading-relaxed">
        Once you submit, verification begins. Seismic will follow up if the upstream verifier needs more information.
      </p>

      {/* Box 1: Attestations */}
      <div className="relative rounded-2xl border border-[var(--color-stroke)] bg-white p-5 flex flex-col gap-3 shadow-2xs">
        <legend className="absolute -top-3 left-4 px-2 text-xs font-bold text-[#0f172a] bg-white">
          Attestations <span className="text-red-500">*</span>
        </legend>
        <div className="pt-1 flex flex-col gap-3">
          <label className="flex items-center gap-3 cursor-pointer select-none text-xs text-[#0f172a] hover:opacity-80">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => {
                setAgreeTerms(e.target.checked);
                if (e.target.checked && fieldErrors.agreeTerms) {
                  setFieldErrors((prev) => ({ ...prev, agreeTerms: "" }));
                }
              }}
              className="rounded border-[var(--color-stroke)] text-kyc-primary focus:ring-0"
            />
            <span>
              I agree to the platform's terms and conditions. <span className="text-red-500">*</span>
            </span>
          </label>
          {fieldErrors.agreeTerms && (
            <span className="text-[11px] text-red-500 font-medium ml-7">{fieldErrors.agreeTerms}</span>
          )}

          <label className="flex items-center gap-3 cursor-pointer select-none text-xs text-[#0f172a] hover:opacity-80">
            <input
              type="checkbox"
              checked={agreeAccurate}
              onChange={(e) => {
                setAgreeAccurate(e.target.checked);
                if (e.target.checked && fieldErrors.agreeAccurate) {
                  setFieldErrors((prev) => ({ ...prev, agreeAccurate: "" }));
                }
              }}
              className="rounded border-[var(--color-stroke)] text-kyc-primary focus:ring-0"
            />
            <span>
              The information entered above is accurate to the best of my knowledge. <span className="text-red-500">*</span>
            </span>
          </label>
          {fieldErrors.agreeAccurate && (
            <span className="text-[11px] text-red-500 font-medium ml-7">{fieldErrors.agreeAccurate}</span>
          )}
        </div>
      </div>

      {/* Box 2: USD capabilities */}
      <div className="relative rounded-2xl border border-[var(--color-stroke)] bg-white p-5 flex flex-col gap-4 shadow-2xs">
        <legend className="absolute -top-3 left-4 px-2 text-xs font-bold text-[#0f172a] bg-white">
          USD capabilities
        </legend>

        <div className="pt-1 flex flex-col gap-3">
          <label className="flex items-center gap-3 cursor-pointer select-none text-xs font-semibold text-[#0f172a] hover:opacity-80">
            <input
              type="checkbox"
              checked={enableUsdCapabilities}
              onChange={(e) => setEnableUsdCapabilities(e.target.checked)}
              className="rounded border-[var(--color-stroke)] text-kyc-primary focus:ring-0"
            />
            <span>Enable USD virtual account capabilities.</span>
          </label>

          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 leading-relaxed font-medium">
            Enabling USD capabilities will not lead to auto-approval of your KYC per our partner guidelines.
          </div>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={handleNext}
          disabled={!agreeTerms || !agreeAccurate}
          className="px-6 py-3 cursor-pointer rounded-full bg-kyc-primary hover:bg-kyc-primary-hover text-white text-xs font-semibold transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-kyc-primary"
        >
          Submit for verification
        </button>
      </div>
    </div>
  );
}
