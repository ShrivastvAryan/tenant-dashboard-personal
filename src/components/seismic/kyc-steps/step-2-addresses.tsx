"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { CountryCombobox } from "@/components/CountryCombobox";
import { getAddressRequirements, AddressRequirements } from "@/actions/seismic/individual";

interface Step2AddressesProps {
  formData: any;
  fieldErrors: Record<string, string>;
  handleChange: (field: string, value: any) => void;
  turnOffAddressSuggestions: boolean;
  setTurnOffAddressSuggestions: (val: boolean) => void;
  differentMailingAddress: boolean;
  setDifferentMailingAddress: (val: boolean) => void;
  resReqs?: AddressRequirements;
  setResReqs?: (reqs: AddressRequirements) => void;
  mailingReqs?: AddressRequirements;
  setMailingReqs?: (reqs: AddressRequirements) => void;
}

export function Step2Addresses({
  formData,
  fieldErrors,
  handleChange,
  turnOffAddressSuggestions,
  setTurnOffAddressSuggestions,
  differentMailingAddress,
  setDifferentMailingAddress,
  resReqs: externalResReqs,
  setResReqs: externalSetResReqs,
  mailingReqs: externalMailingReqs,
  setMailingReqs: externalSetMailingReqs,
}: Step2AddressesProps) {
  const [internalResReqs, setInternalResReqs] = useState<AddressRequirements>({ country: "", state: "optional", postal_code: "optional" });
  const [internalMailingReqs, setInternalMailingReqs] = useState<AddressRequirements>({ country: "", state: "optional", postal_code: "optional" });

  const [isLoadingResReqs, setIsLoadingResReqs] = useState(false);
  const [isLoadingMailingReqs, setIsLoadingMailingReqs] = useState(false);

  const resReqs = externalResReqs || internalResReqs;
  const setResReqs = externalSetResReqs || setInternalResReqs;
  const mailingReqs = externalMailingReqs || internalMailingReqs;
  const setMailingReqs = externalSetMailingReqs || setInternalMailingReqs;

  useEffect(() => {
    if (formData.country) {
      setIsLoadingResReqs(true);
      getAddressRequirements(formData.country)
        .then((reqs) => {
          if (reqs) setResReqs(reqs);
        })
        .finally(() => {
          setIsLoadingResReqs(false);
        });
    } else {
      setResReqs({ country: "", state: "optional", postal_code: "optional" });
      setIsLoadingResReqs(false);
    }
  }, [formData.country]);

  useEffect(() => {
    const targetCountry = differentMailingAddress ? formData.mailingCountry : formData.country;
    if (targetCountry) {
      setIsLoadingMailingReqs(true);
      getAddressRequirements(targetCountry)
        .then((reqs) => {
          if (reqs) setMailingReqs(reqs);
        })
        .finally(() => {
          setIsLoadingMailingReqs(false);
        });
    } else {
      setMailingReqs({ country: "", state: "optional", postal_code: "optional" });
      setIsLoadingMailingReqs(false);
    }
  }, [formData.mailingCountry, formData.country, differentMailingAddress]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-[#64748b] leading-relaxed max-w-xl">
          Where you live: a physical street address, not a PO box. If mail goes somewhere else (PO box, forwarding service), add a mailing address too.
        </p>

        <label className="flex items-center gap-2 cursor-pointer text-xs text-[#64748b] hover:text-[#0f172a] select-none shrink-0">
          <input
            type="checkbox"
            checked={turnOffAddressSuggestions}
            onChange={(e) => setTurnOffAddressSuggestions(e.target.checked)}
            className="rounded border-[var(--color-stroke)] text-kyc-primary focus:ring-0"
          />
          <span>Turn off address suggestions</span>
        </label>
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-bold text-[#0f172a]">Residential Address</h3>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#0f172a]">
            Address line 1 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.addressLine1 || ""}
            onChange={(e) => handleChange("addressLine1", e.target.value)}
            placeholder="1 Wall St"
            className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
              fieldErrors.addressLine1
                ? "border-red-500 focus:border-red-500"
                : "border-[var(--color-stroke)] focus:border-kyc-primary"
            }`}
          />
          {fieldErrors.addressLine1 && (
            <span className="text-[11px] text-red-500 font-medium">{fieldErrors.addressLine1}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#0f172a]">Address line 2</label>
          <input
            type="text"
            value={formData.addressLine2 || ""}
            onChange={(e) => handleChange("addressLine2", e.target.value)}
            placeholder="Suite 200"
            className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-kyc-primary"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#0f172a]">
              Country <span className="text-red-500">*</span>
            </label>
            <CountryCombobox
              value={formData.country || ""}
              onChange={(val) => handleChange("country", val)}
              placeholder="Select country..."
              className={fieldErrors.country ? "border-red-500" : ""}
            />
            {fieldErrors.country && (
              <span className="text-[11px] text-red-500 font-medium">{fieldErrors.country}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#0f172a]">
              City <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.city || ""}
              onChange={(e) => handleChange("city", e.target.value)}
              className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
                fieldErrors.city
                  ? "border-red-500 focus:border-red-500"
                  : "border-[var(--color-stroke)] focus:border-kyc-primary"
              }`}
            />
            {fieldErrors.city && (
              <span className="text-[11px] text-red-500 font-medium">{fieldErrors.city}</span>
            )}
          </div>
        </div>

        {isLoadingResReqs ? (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 font-medium">
            <Loader2 className="w-4 h-4 animate-spin text-[#0f172a] shrink-0" />
            <span>Checking address requirements for selected country...</span>
          </div>
        ) : (
          (resReqs.state === "required" || resReqs.postal_code === "required") && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resReqs.state === "required" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#0f172a]">
                    State / region <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.stateRegion || ""}
                    onChange={(e) => handleChange("stateRegion", e.target.value)}
                    placeholder="State, province, or region"
                    className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
                      fieldErrors.stateRegion
                        ? "border-red-500 focus:border-red-500"
                        : "border-[var(--color-stroke)] focus:border-kyc-primary"
                    }`}
                  />
                  {fieldErrors.stateRegion && (
                    <span className="text-[11px] text-red-500 font-medium">{fieldErrors.stateRegion}</span>
                  )}
                </div>
              )}

              {resReqs.postal_code === "required" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#0f172a]">
                    Postal code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={formData.postalCode || ""}
                    onChange={(e) => handleChange("postalCode", e.target.value.replace(/\D/g, ""))}
                    placeholder="Postal or ZIP code"
                    className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
                      fieldErrors.postalCode
                        ? "border-red-500 focus:border-red-500"
                        : "border-[var(--color-stroke)] focus:border-kyc-primary"
                    }`}
                  />
                  {fieldErrors.postalCode && (
                    <span className="text-[11px] text-red-500 font-medium">{fieldErrors.postalCode}</span>
                  )}
                </div>
              )}
            </div>
          )
        )}
      </div>

      <div className="flex flex-col gap-4 border-t border-[var(--color-stroke)] pt-4 mt-1">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-sm font-bold text-[#0f172a]">Mailing Address</h3>

          <label className="flex items-center gap-2 cursor-pointer text-xs text-[#64748b] hover:text-[#0f172a] select-none">
            <input
              type="checkbox"
              checked={differentMailingAddress}
              onChange={(e) => setDifferentMailingAddress(e.target.checked)}
              className="rounded border-[var(--color-stroke)] text-kyc-primary focus:ring-0"
            />
            <span>Different from residential</span>
          </label>
        </div>

        {differentMailingAddress && (
          <div className="flex flex-col gap-4 pt-1">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#0f172a]">
                Address line 1 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.mailingAddressLine1 || ""}
                onChange={(e) => handleChange("mailingAddressLine1", e.target.value)}
                placeholder="1 Main St"
                className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
                  fieldErrors.mailingAddressLine1
                    ? "border-red-500 focus:border-red-500"
                    : "border-[var(--color-stroke)] focus:border-kyc-primary"
                }`}
              />
              {fieldErrors.mailingAddressLine1 && (
                <span className="text-[11px] text-red-500 font-medium">{fieldErrors.mailingAddressLine1}</span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#0f172a]">Address line 2</label>
              <input
                type="text"
                value={formData.mailingAddressLine2 || ""}
                onChange={(e) => handleChange("mailingAddressLine2", e.target.value)}
                placeholder="Apt 4B"
                className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-kyc-primary"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#0f172a]">
                  Country <span className="text-red-500">*</span>
                </label>
                <CountryCombobox
                  value={formData.mailingCountry || ""}
                  onChange={(val) => handleChange("mailingCountry", val)}
                  placeholder="Select country..."
                  className={fieldErrors.mailingCountry ? "border-red-500" : ""}
                />
                {fieldErrors.mailingCountry && (
                  <span className="text-[11px] text-red-500 font-medium">{fieldErrors.mailingCountry}</span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#0f172a]">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.mailingCity || ""}
                  onChange={(e) => handleChange("mailingCity", e.target.value)}
                  className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
                    fieldErrors.mailingCity
                      ? "border-red-500 focus:border-red-500"
                      : "border-[var(--color-stroke)] focus:border-kyc-primary"
                  }`}
                />
                {fieldErrors.mailingCity && (
                  <span className="text-[11px] text-red-500 font-medium">{fieldErrors.mailingCity}</span>
                )}
              </div>
            </div>

            {isLoadingMailingReqs ? (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 font-medium">
                <Loader2 className="w-4 h-4 animate-spin text-[#0f172a] shrink-0" />
                <span>Checking mailing address requirements...</span>
              </div>
            ) : (
              (mailingReqs.state === "required" || mailingReqs.postal_code === "required") && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mailingReqs.state === "required" && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-[#0f172a]">
                        State / region <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.mailingStateRegion || ""}
                        onChange={(e) => handleChange("mailingStateRegion", e.target.value)}
                        placeholder="State, province, or region"
                        className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
                          fieldErrors.mailingStateRegion
                            ? "border-red-500 focus:border-red-500"
                            : "border-[var(--color-stroke)] focus:border-kyc-primary"
                        }`}
                      />
                      {fieldErrors.mailingStateRegion && (
                        <span className="text-[11px] text-red-500 font-medium">{fieldErrors.mailingStateRegion}</span>
                      )}
                    </div>
                  )}

                  {mailingReqs.postal_code === "required" && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-[#0f172a]">
                        Postal code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={formData.mailingPostalCode || ""}
                        onChange={(e) => handleChange("mailingPostalCode", e.target.value.replace(/\D/g, ""))}
                        placeholder="Postal or ZIP code"
                        className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
                          fieldErrors.mailingPostalCode
                            ? "border-red-500 focus:border-red-500"
                            : "border-[var(--color-stroke)] focus:border-kyc-primary"
                        }`}
                      />
                      {fieldErrors.mailingPostalCode && (
                        <span className="text-[11px] text-red-500 font-medium">{fieldErrors.mailingPostalCode}</span>
                      )}
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
