"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";
import { saveKYCData, submitKYC, getKYCData, uploadDocument, AddressRequirements } from "@/actions/seismic/individual";
import { SaveKycData } from "@/types/individual";
import {
  step1IdentitySchema,
  step2AddressesSchema,
  step3ContactSchema,
  step4EmploymentSchema,
  step5RiskSchema,
  step6VolumesSchema,
  step7JurisdictionsSchema,
  step8DocumentsSchema,
  step9ReviewSchema,
  validateKycAddresses,
} from "@/lib/kycSchemas";
import {
  HIGH_RISK_ACTIVITY_OPTIONS,
  COUNTERPARTY_OPTIONS,
  toCountryIso2,
  normalizeEnumArray,
} from "@/lib/kycEnums";
import { formatPhoneNumber } from "@/lib/phoneUtils";
import { toast } from "@/hooks/use-toast";

import { Step1Identity } from "./kyc-steps/step-1-identity";
import { Step2Addresses } from "./kyc-steps/step-2-addresses";
import { Step3Contact } from "./kyc-steps/step-3-contact";
import { Step4Employment } from "./kyc-steps/step-4-employment";
import { Step5Risk } from "./kyc-steps/step-5-risk";
import { Step6Volumes } from "./kyc-steps/step-6-volumes";
import { Step7Jurisdictions } from "./kyc-steps/step-7-jurisdictions";
import { Step8Documents } from "./kyc-steps/step-8-documents";
import { Step9Review } from "./kyc-steps/step-9-review";

interface KycFormProps {
  customerData?: {
    email: string;
    firstName: string;
    lastName: string;
    customerId?: string;
  };
  onBack?: () => void;
  onComplete?: () => void;
  onReturnToCustomers?: () => void;
}

const STEPS = [
  { id: 1, label: "Identity", hasDot: true, dotColor: "bg-blue-600" },
  { id: 2, label: "Addresses", hasDot: true, dotColor: "bg-gray-300" },
  { id: 3, label: "Contact", hasDot: true, dotColor: "bg-blue-600" },
  { id: 4, label: "Employment", hasDot: true, dotColor: "bg-blue-600" },
  { id: 5, label: "Risk", hasDot: true, dotColor: "bg-gray-300" },
  { id: 6, label: "Volumes", hasDot: true, dotColor: "bg-gray-300" },
  { id: 7, label: "Jurisdictions", hasDot: true, dotColor: "bg-gray-300" },
  { id: 8, label: "Documents", hasDot: true, dotColor: "bg-gray-300" },
  { id: 9, label: "Review & Submit", hasDot: true, dotColor: "bg-gray-300" },
];

function buildSaveKycPayload(
  formData: any,
  extra: {
    differentMailingAddress: boolean;
    jurisdictionCountries: string[];
    selectedHighRiskActivities: string[];
    selectedCounterparties: string[];
    idType: string;
    idNumber: string;
    issuingCountry: string;
    agreeTerms: boolean;
    agreeAccurate: boolean;
    enableUsdCapabilities?: boolean;
    resReqs?: AddressRequirements;
    mailingReqs?: AddressRequirements;
  }
): SaveKycData {
  return {
    email: formData.email || "",
    country: toCountryIso2(formData.countryOfResidence || formData.country || ""),
    corridor: "global",
    profile: {
      identity: {
        firstName: formData.firstName || "",
        middleName: formData.middleName || "",
        lastName: formData.lastName || "",
        dateOfBirth: formData.dob || "",
        nationality: toCountryIso2(formData.nationality || ""),
        citizenship: toCountryIso2(formData.citizenship || ""),
        countryOfResidence: toCountryIso2(formData.countryOfResidence || ""),
        taxIdentificationNumber: formData.taxId || "",
      },
      addresses: {
        residential: {
          line1: formData.addressLine1 || "",
          line2: formData.addressLine2 || "",
          city: formData.city || "",
          ...(extra.resReqs?.state === "required" && formData.stateRegion ? { state: formData.stateRegion } : {}),
          ...(extra.resReqs?.postal_code === "required" && formData.postalCode ? { postalCode: formData.postalCode } : {}),
          ...(formData.country && toCountryIso2(formData.country) ? { country: toCountryIso2(formData.country) } : {}),
        },
        mailing: {
          line1: extra.differentMailingAddress ? formData.mailingAddressLine1 || "" : formData.addressLine1 || "",
          line2: extra.differentMailingAddress ? formData.mailingAddressLine2 || "" : formData.addressLine2 || "",
          city: extra.differentMailingAddress ? formData.mailingCity || "" : formData.city || "",
          ...(extra.mailingReqs?.state === "required" && (extra.differentMailingAddress ? formData.mailingStateRegion : formData.stateRegion)
            ? { state: extra.differentMailingAddress ? formData.mailingStateRegion : formData.stateRegion }
            : {}),
          ...(extra.mailingReqs?.postal_code === "required" && (extra.differentMailingAddress ? formData.mailingPostalCode : formData.postalCode)
            ? { postalCode: extra.differentMailingAddress ? formData.mailingPostalCode : formData.postalCode }
            : {}),
          ...((extra.differentMailingAddress ? formData.mailingCountry : formData.country) &&
          toCountryIso2(extra.differentMailingAddress ? formData.mailingCountry || "" : formData.country || "")
            ? { country: toCountryIso2(extra.differentMailingAddress ? formData.mailingCountry || "" : formData.country || "") }
            : {}),
        },
      },
      contact: {
        email: formData.email || "",
        ...(formData.phone ? { phone: formatPhoneNumber(formData.phone, formData.phoneCountry) } : {}),
        ...(formData.phoneCountry && toCountryIso2(formData.phoneCountry)
          ? { phoneCountryCode: toCountryIso2(formData.phoneCountry) }
          : {}),
      },
      employment: {
        ...(formData.employmentStatus ? { employmentStatus: formData.employmentStatus } : {}),
        occupation: formData.occupation
          ? formData.occupation
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "")
          : "",
        employerName: formData.employerName || "",
      },
      risk: {
        ...(formData.primarySourceOfFunds ? { primarySourceOfFunds: formData.primarySourceOfFunds } : {}),
        ...(formData.accountPurpose ? { accountPurpose: formData.accountPurpose } : {}),
        actingAsIntermediary: Boolean(formData.actingOnBehalfOfSomeoneElse),
        pepStatus: Boolean(formData.isPep),
      },
      volumes: {
        usdValueOfFiat: Number(formData.monthlyFiatVolumeUsd) || 0,
        usdValueOfCrypto: Number(formData.monthlyCryptoVolumeUsd) || 0,
        monthlyDeposits: Number(formData.fiatPayInsCount) || 0,
        monthlyWithdrawals: Number(formData.fiatPayoutsCount) || 0,
        monthlyCryptoDeposits: Number(formData.cryptoPayInsCount) || 0,
        monthlyCryptoWithdrawals: Number(formData.cryptoPayoutsCount) || 0,
        monthlyInvestmentDepositUsd: 0,
        monthlyInvestmentWithdrawalUsd: 0,
        monthlyCryptoInvestmentDepositUsd: 0,
        monthlyCryptoInvestmentWithdrawalUsd: 0,
        expectedMonthlyPaymentsUsd: Number(formData.monthlyFiatVolumeUsd) || 0,
      },
      jurisdictions: {
        fundsSendReceiveJurisdictions: (extra.jurisdictionCountries || []).map(toCountryIso2),
        highRiskActivities: normalizeEnumArray(extra.selectedHighRiskActivities || [], HIGH_RISK_ACTIVITY_OPTIONS),
        vendorsAndCounterparties: normalizeEnumArray(extra.selectedCounterparties || [], COUNTERPARTY_OPTIONS),
      },
      attestations: {
        termsAndConditionsAccepted: Boolean(extra.agreeTerms),
        informationAttested: Boolean(extra.agreeAccurate),
      },
      ...(extra.idType || extra.idNumber || extra.issuingCountry
        ? {
            documents: {
              governmentIssuedIdentification: {
                country: toCountryIso2(extra.issuingCountry || ""),
                kind: extra.idType || "",
                number: extra.idNumber || "",
              },
            },
          }
        : {}),
      usdCapabilitiesRequested: Boolean(extra.enableUsdCapabilities ?? true),
    },
  };
}

function parseSaveKycDataToState(data: SaveKycData) {
  const profile = data?.profile;
  if (!profile) return null;

  const identity = profile.identity || {};
  const residential = profile.addresses?.residential || {};
  const mailing = profile.addresses?.mailing || {};
  const contact = profile.contact || {};
  const employment = profile.employment || {};
  const risk = profile.risk || {};
  const volumes = profile.volumes || {};
  const jurisdictions = profile.jurisdictions || {};
  const attestations = profile.attestations || {};
  const documents = profile.documents?.governmentIssuedIdentification;

  const differentMailing =
    Boolean(mailing.line1) &&
    (mailing.line1 !== residential.line1 || mailing.city !== residential.city);

  return {
    formData: {
      firstName: identity.firstName || "",
      middleName: identity.middleName || "",
      lastName: identity.lastName || "",
      dob: identity.dateOfBirth || "",
      countryOfResidence: identity.countryOfResidence || "",
      nationality: identity.nationality || "",
      citizenship: identity.citizenship || "",
      taxId: identity.taxIdentificationNumber || "",

      addressLine1: residential.line1 || "",
      addressLine2: residential.line2 || "",
      country: residential.country || "",
      city: residential.city || "",
      stateRegion: residential.state || "",

      mailingAddressLine1: mailing.line1 || "",
      mailingAddressLine2: mailing.line2 || "",
      mailingCountry: mailing.country || "",
      mailingCity: mailing.city || "",
      mailingStateRegion: mailing.state || "",

      email: contact.email || data.email || "",
      phoneCountry: contact.phoneCountryCode || "",
      phone: contact.phone || "",

      employmentStatus: employment.employmentStatus || "",
      occupation: employment.occupation || "",
      employerName: employment.employerName || "",

      primarySourceOfFunds: risk.primarySourceOfFunds || "",
      accountPurpose: risk.accountPurpose || "",
      actingOnBehalfOfSomeoneElse: Boolean(risk.actingAsIntermediary),
      isPep: Boolean(risk.pepStatus),

      fiatPayInsCount: volumes.monthlyDeposits ? String(volumes.monthlyDeposits) : "",
      fiatPayoutsCount: volumes.monthlyWithdrawals ? String(volumes.monthlyWithdrawals) : "",
      monthlyFiatVolumeUsd: volumes.usdValueOfFiat ? String(volumes.usdValueOfFiat) : "",
      cryptoPayInsCount: volumes.monthlyCryptoDeposits ? String(volumes.monthlyCryptoDeposits) : "",
      cryptoPayoutsCount: volumes.monthlyCryptoWithdrawals ? String(volumes.monthlyCryptoWithdrawals) : "",
      monthlyCryptoVolumeUsd: volumes.usdValueOfCrypto ? String(volumes.usdValueOfCrypto) : "",
    },
    differentMailingAddress: differentMailing,
    jurisdictionCountries: jurisdictions.fundsSendReceiveJurisdictions || [],
    selectedHighRiskActivities: normalizeEnumArray(jurisdictions.highRiskActivities || [], HIGH_RISK_ACTIVITY_OPTIONS),
    selectedCounterparties: normalizeEnumArray(jurisdictions.vendorsAndCounterparties || [], COUNTERPARTY_OPTIONS),
    idType: documents?.kind || "",
    idNumber: documents?.number || "",
    issuingCountry: documents?.country || "",
    agreeTerms: Boolean(attestations.termsAndConditionsAccepted),
    agreeAccurate: Boolean(attestations.informationAttested),
    enableUsdCapabilities: (profile as any).usdCapabilitiesRequested ?? true,
  };
}

function determineStepFromRestoredData(restored: ReturnType<typeof parseSaveKycDataToState>): number {
  if (!restored) return 1;
  const { formData, idType, agreeTerms, jurisdictionCountries } = restored;
  if (agreeTerms) return 9;
  if (idType) return 8;
  if (jurisdictionCountries && jurisdictionCountries.length > 0) return 7;
  if (formData.monthlyFiatVolumeUsd && formData.monthlyFiatVolumeUsd !== "0") return 6;
  if (formData.primarySourceOfFunds || formData.accountPurpose) return 5;
  if (formData.employmentStatus) return 4;
  if (formData.phone) return 3;
  if (formData.addressLine1) return 2;
  if (formData.firstName || formData.dob) return 1;
  return 1;
}

export default function KycForm({ customerData, onBack, onComplete, onReturnToCustomers }: KycFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [maxStepReached, setMaxStepReached] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isDraftLoading, setIsDraftLoading] = useState(true);

  useEffect(() => {
    setMaxStepReached((prev) => Math.max(prev, currentStep));
  }, [currentStep]);

  const [zodEnabled, setZodEnabled] = useState(true);

  const [turnOffAddressSuggestions, setTurnOffAddressSuggestions] = useState(false);
  const [differentMailingAddress, setDifferentMailingAddress] = useState(false);
  const [resReqs, setResReqs] = useState<AddressRequirements>({ country: "", state: "optional", postal_code: "optional" });
  const [mailingReqs, setMailingReqs] = useState<AddressRequirements>({ country: "", state: "optional", postal_code: "optional" });

  const [jurisdictionCountries, setJurisdictionCountries] = useState<string[]>([]);
  const [selectedHighRiskActivities, setSelectedHighRiskActivities] = useState<string[]>([]);
  const [selectedCounterparties, setSelectedCounterparties] = useState<string[]>([]);

  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [issuingCountry, setIssuingCountry] = useState("");
  const [govtIdFrontFile, setGovtIdFrontFile] = useState<File | null>(null);
  const [govtIdBackFile, setGovtIdBackFile] = useState<File | null>(null);
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [proofOfAddressFile, setProofOfAddressFile] = useState<File | null>(null);

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeAccurate, setAgreeAccurate] = useState(false);
  const [enableUsdCapabilities, setEnableUsdCapabilities] = useState(true);

  function showToast(message: string, type: "success" | "error" = "success") {
    if (type === "error") {
      toast.error(message);
    } else {
      toast.success(message);
    }
  }

  const [uploadingDocs, setUploadingDocs] = useState<Record<string, boolean>>({});
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, boolean>>({});

  async function handleUploadDocument(file: File, kind: string, label: string) {
    const MIN_SIZE_BYTES = 10 * 1024;
    if (file.size < MIN_SIZE_BYTES) {
      showToast(`File size must be at least 10 KB. (Selected file is ${(file.size / 1024).toFixed(1)} KB)`, "error");
      return;
    }

    setUploadingDocs((prev) => ({ ...prev, [kind]: true }));
    try {
      const activeCustomerId = customerData?.customerId;
      const activeEmail = customerData?.email || formData.email;

      const fd = new FormData();
      if (activeEmail) fd.append("email", activeEmail);
      fd.append("kind", kind);
      fd.append("file", file);

      await uploadDocument(fd, activeCustomerId, activeEmail);

      setUploadedDocs((prev) => ({ ...prev, [kind]: true }));
      showToast(`${label} uploaded successfully!`, "success");
    } catch (err: any) {
      showToast(err?.message || `Failed to upload ${label}. Please try again.`, "error");
    } finally {
      setUploadingDocs((prev) => ({ ...prev, [kind]: false }));
    }
  }

  const [formData, setFormData] = useState({
    firstName: customerData?.firstName,
    middleName: "",
    lastName: customerData?.lastName,
    dob: "",
    countryOfResidence: "",
    nationality: "",
    citizenship: "",
    taxId: "",

    addressLine1: "",
    addressLine2: "",
    country: "",
    city: "",
    stateRegion: "",

    mailingAddressLine1: "",
    mailingAddressLine2: "",
    mailingCountry: "",
    mailingCity: "",
    mailingStateRegion: "",

    email: customerData?.email,
    phoneCountry: "",
    phone: "",

    employmentStatus: "",
    occupation: "",
    employerName: "",

    primarySourceOfFunds: "",
    accountPurpose: "",
    actingOnBehalfOfSomeoneElse: false,
    isPep: false,

    fiatPayInsCount: "",
    fiatPayoutsCount: "",
    monthlyFiatVolumeUsd: "",
    cryptoPayInsCount: "",
    cryptoPayoutsCount: "",
    monthlyCryptoVolumeUsd: "",
  });

  function handleChange(field: string, value: any) {
    const cleanedValue = (field === "postalCode" || field === "mailingPostalCode" || field === "postCode") && typeof value === "string" ? value.replace(/\D/g, "") : value;
    setFormData((prev) => ({ ...prev, [field]: cleanedValue }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function toggleItem(list: string[], item: string, setter: (val: string[]) => void) {
    if (list.includes(item)) {
      setter(list.filter((i) => i !== item));
    } else {
      setter([...list, item]);
    }
  }

  function validateCurrentStep(step: number): boolean {
    if (!zodEnabled) {
      setFieldErrors({});
      return true;
    }

    setFieldErrors({});
    let result: { success: boolean; error?: any };

    switch (step) {
      case 1:
        result = step1IdentitySchema.safeParse(formData);
        break;
      case 2: {
        const addressErrors = validateKycAddresses(formData, resReqs, mailingReqs);
        if (Object.keys(addressErrors).length > 0) {
          setFieldErrors(addressErrors);
          return false;
        }
        return true;
      }
      case 3:
        result = step3ContactSchema.safeParse(formData);
        break;
      case 4:
        result = step4EmploymentSchema.safeParse(formData);
        break;
      case 5:
        result = step5RiskSchema.safeParse(formData);
        break;
      case 6:
        result = step6VolumesSchema.safeParse(formData);
        break;
      case 7:
        result = step7JurisdictionsSchema.safeParse({
          jurisdictionCountries,
          selectedHighRiskActivities,
          selectedCounterparties,
        });
        break;
      case 8:
        result = step8DocumentsSchema.safeParse({
          idType,
          idNumber,
          issuingCountry,
          hasGovtIdFront: Boolean(govtIdFrontFile || uploadedDocs["individual_government_id_front"]),
          hasGovtIdBack: Boolean(govtIdBackFile || uploadedDocs["individual_government_id_back"]),
          hasPassport: Boolean(passportFile || uploadedDocs["passport"]),
          hasSelfie: Boolean(selfieFile || uploadedDocs["individual_selfie"]),
          hasProofOfAddress: Boolean(proofOfAddressFile || uploadedDocs["proof_of_address"]),
        });
        break;
      case 9:
        result = step9ReviewSchema.safeParse({
          agreeTerms,
          agreeAccurate,
          enableUsdCapabilities,
        });
        break;
      default:
        return true;
    }

    if (!result.success && result.error) {
      const formattedErrors: Record<string, string> = {};
      result.error.issues.forEach((issue: any) => {
        const path = issue.path[0];
        if (path && typeof path === "string") {
          formattedErrors[path] = issue.message;
        }
      });
      setFieldErrors(formattedErrors);
      return false;
    }

    return true;
  }

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const saveDraft = async (targetStep?: number) => {
    if (zodEnabled && !validateCurrentStep(currentStep)) {
      return;
    }
    setIsSaving(true);
    setIsSaved(false);
    const activeCustomerId = customerData?.customerId;
    const payload = buildSaveKycPayload(formData, {
      differentMailingAddress,
      jurisdictionCountries,
      selectedHighRiskActivities,
      selectedCounterparties,
      idType,
      idNumber,
      issuingCountry,
      agreeTerms,
      agreeAccurate,
      enableUsdCapabilities,
      resReqs,
      mailingReqs,
    });

    const cacheKey = `kyc_draft_${formData.email || activeCustomerId || "default"}`;
    try {
      localStorage.setItem(
        cacheKey,
        JSON.stringify({ payload, currentStep: targetStep ?? currentStep })
      );
    } catch (e) {
      console.error("Local storage draft save failed:", e);
    }

    try {
      await saveKYCData(payload, activeCustomerId);
    } catch (err) {
      console.error("[BROWSER] Error saving KYC draft to backend:", err, "Customer ID:", activeCustomerId, "Payload:", payload);
    }
    setIsSaving(false);
    setIsSaved(true);
  };

  useEffect(() => {
    async function loadDraft() {
      setIsDraftLoading(true);
      const activeCustomerId = customerData?.customerId;
      const activeEmail = customerData?.email;

      const cacheKey = `kyc_draft_${activeEmail || activeCustomerId || "default"}`;
      let loadedData: SaveKycData | null = null;
      let savedStep = 1;

      try {
        if (activeCustomerId || activeEmail) {
          try {
            const res = await getKYCData(activeCustomerId, activeEmail);
            const rawData = (res as any)?.data?.profile ? (res as any).data : ((res as any)?.profile || (res as any)?.email ? res : null);
            if (rawData) {
              loadedData = rawData as SaveKycData;
            }
          } catch (err) {
            console.warn("Could not fetch backend KYC draft, checking localStorage cache...", err);
          }
        }

        if (!loadedData) {
          try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
              const parsed = JSON.parse(cached);
              if (parsed.payload) {
                loadedData = parsed.payload;
                if (parsed.currentStep) savedStep = parsed.currentStep;
              }
            }
          } catch (e) {
            console.error("Local storage load error:", e);
          }
        }

        if (loadedData) {
          const restored = parseSaveKycDataToState(loadedData);
          if (restored) {
            setFormData((prev) => ({ ...prev, ...restored.formData }));
            setDifferentMailingAddress(restored.differentMailingAddress);
            setJurisdictionCountries(restored.jurisdictionCountries);
            setSelectedHighRiskActivities(restored.selectedHighRiskActivities);
            setSelectedCounterparties(restored.selectedCounterparties);
            setIdType(restored.idType);
            setIdNumber(restored.idNumber);
            setIssuingCountry(restored.issuingCountry);
            setAgreeTerms(restored.agreeTerms);
            setAgreeAccurate(restored.agreeAccurate);
            const autoCalculatedStep = determineStepFromRestoredData(restored);
            const targetStep = savedStep > 1 ? savedStep : autoCalculatedStep;
            if (targetStep > 1) {
              setCurrentStep(targetStep);
              setMaxStepReached(targetStep);
            }
          }
        }
      } finally {
        setIsDraftLoading(false);
      }
    }

    loadDraft();
  }, [customerData?.customerId, customerData?.email]);

  async function handleNext() {
    const isValid = validateCurrentStep(currentStep);
    if (!isValid) return;

    if (currentStep < 9) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      await saveDraft(nextStep);
    } else {
      await saveDraft(9);
      const activeCustomerId = customerData?.customerId;
      if (activeCustomerId) {
        try {
          const payload = buildSaveKycPayload(formData, {
            differentMailingAddress,
            jurisdictionCountries,
            selectedHighRiskActivities,
            selectedCounterparties,
            idType,
            idNumber,
            issuingCountry,
            agreeTerms,
            agreeAccurate,
            enableUsdCapabilities,
            resReqs,
            mailingReqs,
          });
          await saveKYCData(payload, activeCustomerId);
          await submitKYC(activeCustomerId, {
            email: formData.email,
            country: formData.countryOfResidence || formData.country || "",
            corridor: "global",
          });
          setSubmitted(true);
          if (onComplete) onComplete();
        } catch (err: any) {
          console.error("Error submitting KYC:", err);
          showToast(err?.message || "Failed to submit KYC details. Please try again.", "error");
        }
      } else {
        try {
          await submitKYC(undefined, {
            email: formData.email,
            country: formData.countryOfResidence || formData.country || "",
            corridor: "global",
          });
          setSubmitted(true);
          if (onComplete) onComplete();
        } catch (err: any) {
          console.error("Error submitting KYC:", err);
          showToast(err?.message || "Failed to submit KYC details. Please try again.", "error");
        }
      }
    }
  }

  const customerFullName = `${formData.firstName || ""} ${formData.lastName || ""}`.trim();

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header section */}
      {!submitted && (
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">
            Verify {customerFullName}
          </h1>
          <p className="text-sm text-[#64748b]">
            Enter the customer's identity details on their behalf. Progress is saved automatically after each step.
          </p>
        </div>
      )}

      {isDraftLoading ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 bg-white rounded-2xl border border-[var(--color-stroke)] shadow-xs text-center min-h-[320px] gap-3">
          <Loader2 size={36} className="animate-spin text-kyc-primary" />
          <p className="text-base font-semibold text-[#0f172a]">Loading saved draft...</p>
          <p className="text-xs text-[#64748b]">Please wait while customer draft details are loaded.</p>
        </div>
      ) : submitted ? (
        <div className="flex flex-col items-center justify-center py-12 px-6 bg-white rounded-2xl border border-[var(--color-stroke)] shadow-xs text-center max-w-xl mx-auto my-8">
          <div className="h-14 w-14 rounded-full bg-[#f0fdf4] text-[#16a34a] flex items-center justify-center mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-xl font-bold text-[#0f172a]">KYC Details Submitted!</h2>
          <p className="text-sm text-[#64748b] mt-2">
            Verification record for <span className="font-semibold text-[#0f172a]">{customerFullName}</span> has been processed and saved.
          </p>
          {/* <button
            onClick={onReturnToCustomers || onBack}
            className="mt-6 px-6 py-2.5 rounded-full bg-kyc-primary text-white text-xs font-semibold hover:bg-kyc-primary-hover transition-all"
          >
            Return to Customers
          </button> */}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start pt-2">
          {/* Vertical Step Sidebar */}
          <div className="md:col-span-3 flex flex-col gap-1 border-r border-[var(--color-stroke)] pr-4">
            {STEPS.map((step) => {
              const isActive = currentStep === step.id;
              const isReached = step.id <= maxStepReached;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => {
                    if (zodEnabled) {
                      if (validateCurrentStep(currentStep)) {
                        setCurrentStep(step.id);
                      }
                    } else {
                      if (step.id <= maxStepReached || validateCurrentStep(currentStep)) {
                        setCurrentStep(step.id);
                      }
                    }
                  }}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
                    isActive
                      ? "bg-kyc-primary-light text-kyc-primary font-bold"
                      : "text-[#64748b] hover:bg-[#f8fafc]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-[#94a3b8]">
                      {String(step.id).padStart(2, "0")}
                    </span>
                    <span className={isActive ? "font-bold text-kyc-primary" : "font-normal text-[#475569]"}>
                      {step.label}
                    </span>
                  </div>

                  <span
                    className={`h-2 w-2 rounded-full ${
                      isActive
                        ? "bg-kyc-primary"
                        : isReached
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Right Form Content Area */}
          <div className="md:col-span-9 flex flex-col gap-6 bg-white p-6 rounded-2xl border border-[var(--color-stroke)] shadow-xs">
            {/* Top Toolbar Controls: Zod Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[var(--color-stroke)]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setZodEnabled((prev) => !prev);
                    setFieldErrors({});
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all select-none ${
                    zodEnabled
                      ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                      : "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                  }`}
                  title="Toggle Zod validation on or off for step navigation"
                >
                  {zodEnabled ? (
                    <ShieldCheck size={14} className="text-emerald-600" />
                  ) : (
                    <ShieldAlert size={14} className="text-amber-600" />
                  )}
                  <span>Zod Validation: </span>
                  <span className="font-bold uppercase tracking-wider">{zodEnabled ? "ON" : "OFF (Dev Bypass)"}</span>
                </button>
              </div>
            </div>

            {/* STEP COMPONENTS */}
            {currentStep === 1 && (
              <Step1Identity
                formData={formData}
                fieldErrors={fieldErrors}
                handleChange={handleChange}
              />
            )}

            {currentStep === 2 && (
              <Step2Addresses
                formData={formData}
                fieldErrors={fieldErrors}
                handleChange={handleChange}
                turnOffAddressSuggestions={turnOffAddressSuggestions}
                setTurnOffAddressSuggestions={setTurnOffAddressSuggestions}
                differentMailingAddress={differentMailingAddress}
                setDifferentMailingAddress={setDifferentMailingAddress}
                resReqs={resReqs}
                setResReqs={setResReqs}
                mailingReqs={mailingReqs}
                setMailingReqs={setMailingReqs}
              />
            )}

            {currentStep === 3 && (
              <Step3Contact
                formData={formData}
                fieldErrors={fieldErrors}
                handleChange={handleChange}
              />
            )}

            {currentStep === 4 && (
              <Step4Employment
                formData={formData}
                fieldErrors={fieldErrors}
                handleChange={handleChange}
              />
            )}

            {currentStep === 5 && (
              <Step5Risk
                formData={formData}
                fieldErrors={fieldErrors}
                handleChange={handleChange}
              />
            )}

            {currentStep === 6 && (
              <Step6Volumes
                formData={formData}
                fieldErrors={fieldErrors}
                handleChange={handleChange}
              />
            )}

            {currentStep === 7 && (
              <Step7Jurisdictions
                jurisdictionCountries={jurisdictionCountries}
                setJurisdictionCountries={setJurisdictionCountries}
                selectedHighRiskActivities={selectedHighRiskActivities}
                setSelectedHighRiskActivities={setSelectedHighRiskActivities}
                selectedCounterparties={selectedCounterparties}
                setSelectedCounterparties={setSelectedCounterparties}
                fieldErrors={fieldErrors}
                setFieldErrors={setFieldErrors}
                toggleItem={toggleItem}
              />
            )}

            {currentStep === 8 && (
              <Step8Documents
                idType={idType}
                setIdType={setIdType}
                idNumber={idNumber}
                setIdNumber={setIdNumber}
                issuingCountry={issuingCountry}
                setIssuingCountry={setIssuingCountry}
                govtIdFrontFile={govtIdFrontFile}
                setGovtIdFrontFile={setGovtIdFrontFile}
                govtIdBackFile={govtIdBackFile}
                setGovtIdBackFile={setGovtIdBackFile}
                passportFile={passportFile}
                setPassportFile={setPassportFile}
                selfieFile={selfieFile}
                setSelfieFile={setSelfieFile}
                proofOfAddressFile={proofOfAddressFile}
                setProofOfAddressFile={setProofOfAddressFile}
                uploadingDocs={uploadingDocs}
                uploadedDocs={uploadedDocs}
                setUploadedDocs={setUploadedDocs}
                handleUploadDocument={handleUploadDocument}
                fieldErrors={fieldErrors}
                setFieldErrors={setFieldErrors}
                showToast={showToast}
              />
            )}

            {currentStep === 9 && (
              <Step9Review
                agreeTerms={agreeTerms}
                setAgreeTerms={setAgreeTerms}
                agreeAccurate={agreeAccurate}
                setAgreeAccurate={setAgreeAccurate}
                enableUsdCapabilities={enableUsdCapabilities}
                setEnableUsdCapabilities={setEnableUsdCapabilities}
                fieldErrors={fieldErrors}
                setFieldErrors={setFieldErrors}
                handleNext={handleNext}
              />
            )}

            {/* General step error message bar when Zod is ON */}
            {/* {zodEnabled && Object.keys(fieldErrors).length > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                <AlertCircle size={16} className="shrink-0" />
                <span>Please fix the highlighted errors before continuing.</span>
              </div>
            )} */}

            {/* Action Bar for Steps 1 - 8 */}
            {currentStep < 9 && (
              <div className="flex items-center justify-between pt-6 border-t border-[var(--color-stroke)] mt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
                    else if (onBack) onBack();
                  }}
                  className="text-xs font-semibold text-[#0f172a] hover:opacity-80 transition-opacity"
                >
                  Back
                </button>

                <div className="flex items-center gap-3">
                  {isSaving ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-kyc-primary">
                      <Loader2 size={14} className="animate-spin" /> Saving draft...
                    </span>
                  ) : isSaved ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#16a34a] bg-[#f0fdf4] px-2.5 py-1 rounded-md border border-[#bbf7d0]">
                      ✓ Saved
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={isSaving}
                    className="px-6 py-2.5 cursor-pointer rounded-full bg-kyc-primary hover:bg-kyc-primary-hover text-white text-xs font-semibold transition-all shadow-xs disabled:opacity-50"
                  >
                    Save & continue
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
