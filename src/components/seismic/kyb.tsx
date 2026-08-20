"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Sparkles, X, Info, ChevronDown, Check, Search, ShieldCheck, ShieldAlert, ChevronsUpDown, Loader2 } from "lucide-react";
import { ALLOWED_COUNTRIES, getCountryName } from "@/lib/countries";
import { CountryCombobox } from "@/components/CountryCombobox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { formatPhoneNumber } from "@/lib/phoneUtils";
import { getNAICSCode, uploadDocument, uploadPersonDocument, saveKYBData, submitKYC, getKYCData } from "@/actions/seismic/individual";
import { FileUploadDropzone } from "./file-upload-dropzone";
import { toast } from "@/hooks/use-toast";
import { getAddressRequirements, AddressRequirements } from "@/actions/seismic/individual";
import {
  step1BusinessSchema,
  step2AddressesSchema,
  validateKybAddresses,
  step3ContactSchema,
  step4OperationsSchema,
  step5VolumesSchema,
  step6CounterpartiesSchema,
  step7PeopleSchema,
  step8DocumentsSchema,
  step9ReviewSchema,
} from "@/lib/kybSchemas";
import {
  ENTITY_TYPE_OPTIONS,
  REGULATED_STATUS_OPTIONS,
  BUSINESS_DOCUMENT_KIND_OPTIONS,
  PERSON_DOCUMENT_KIND_OPTIONS,
  SOURCE_OF_FUNDS_OPTIONS,
  ACCOUNT_PURPOSE_OPTIONS,
  COUNTERPARTY_OPTIONS,
  getKybEnumLabel,
} from "@/lib/kybEnums";
import { toCountryIso2 } from "@/lib/kycEnums";
import { generateUUID, isValidUUID } from "@/lib/uuid";
import { PersonForm, PersonFormData } from "./person-form";

interface KybFormProps {
  businessData?: {
    legalName: string;
    email: string;
    customerId?: string;
  };
  onBack?: () => void;
  onComplete?: () => void;
  onReturnToCustomers?: () => void;
}

const STEPS = [
  { id: 1, label: "Business", hasDot: true, dotColor: "bg-red-500" },
  { id: 2, label: "Addresses", hasDot: true, dotColor: "bg-gray-300" },
  { id: 3, label: "Contact", hasDot: true, dotColor: "bg-red-500" },
  { id: 4, label: "Operations", hasDot: true, dotColor: "bg-gray-300" },
  { id: 5, label: "Volumes", hasDot: true, dotColor: "bg-gray-300" },
  { id: 6, label: "Counterparties", hasDot: true, dotColor: "bg-gray-300" },
  { id: 7, label: "People", hasDot: true, dotColor: "bg-red-500" },
  { id: 8, label: "Documents", hasDot: true, dotColor: "bg-red-500" },
  { id: 9, label: "Review & Submit", hasDot: true, dotColor: "bg-gray-300" },
];



interface DocState {
  file: File | null;
  uploadedName?: string;
  isUploaded: boolean;
}

function parseNumeric(val: any): number {
  if (val === null || val === undefined || val === "") return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  const cleaned = String(val).replace(/[^0-9.-]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export function buildSaveKybPayload(formData: any, extra: any = {}) {
  return {
    email: formData.email || extra.email || "",
    country: toCountryIso2(formData.countryOfRegistration || formData.country || ""),
    corridor: "global",
    profile: {
      business: {
        legalName: formData.legalName || "",
        tradeName: formData.tradeName || "",
        entityType: formData.entityType || "",
        industry: formData.industry ? formData.industry.split(" - ")[0].trim() : "",
        description: formData.businessDescription || "",
        registrationNumber: formData.registrationNumber || "",
        taxId: formData.taxId || "",
        countryOfRegistration: toCountryIso2(formData.countryOfRegistration || ""),
        stateOfIncorporation: formData.stateOfIncorporation || "",
        formationDate: formData.formationDate || "",
        ...(extra.hasNoWebsite
          ? {
              noWebsite: true,
              marketingStrategy: formData.marketingStrategy || "",
            }
          : {
              website: formData.website || "",
            }),
        isDao: Boolean(extra.isDao),
      },
      addresses: {
        registered: {
          line1: formData.addressLine1 || "",
          line2: formData.addressLine2 || "",
          city: formData.city || "",
          ...(extra.busReqs?.state === "required" && formData.stateRegion ? { state: formData.stateRegion } : {}),
          ...(extra.busReqs?.postal_code === "required" && formData.postalCode ? { postalCode: formData.postalCode } : {}),
          ...(toCountryIso2(formData.country || "") ? { country: toCountryIso2(formData.country || "") } : {}),
        },
        physical: {
          line1: formData.addressLine1 || "",
          line2: formData.addressLine2 || "",
          city: formData.city || "",
          ...(extra.busReqs?.state === "required" && formData.stateRegion ? { state: formData.stateRegion } : {}),
          ...(extra.busReqs?.postal_code === "required" && formData.postalCode ? { postalCode: formData.postalCode } : {}),
          ...(toCountryIso2(formData.country || "") ? { country: toCountryIso2(formData.country || "") } : {}),
        },
      },
      contact: {
        email: formData.email || "",
        ...(formData.phone ? { phone: formatPhoneNumber(formData.phone, formData.phoneCountry) } : {}),
        ...(toCountryIso2(formData.phoneCountry || "") ? { phoneCountryCode: toCountryIso2(formData.phoneCountry || "") } : {}),
      },
      operations: {
        businessJurisdictions: (extra.opJurisdictions || []).map(toCountryIso2),
        fundsMovementJurisdictions: (extra.opJurisdictions || []).map(toCountryIso2),
        ...(formData.primarySourceOfFunds ? { primarySourceOfFunds: formData.primarySourceOfFunds } : {}),
        primarySourceOfFundsDescription: formData.sourceOfFundsDescription || "",
        ...(formData.regulatoryStatus ? { regulatedStatus: formData.regulatoryStatus } : {}),
        ...(formData.regulatoryStatus && formData.regulatoryStatus !== "not_required" && formData.regulatedActivityDescription
          ? { regulatedActivityDescription: formData.regulatedActivityDescription }
          : {}),
        ...(formData.regulatoryStatus && formData.regulatoryStatus !== "not_required" && formData.regulatedAuthorityName
          ? { regulatedAuthorityName: formData.regulatedAuthorityName }
          : {}),
        ...(formData.regulatoryStatus && formData.regulatoryStatus !== "not_required" && formData.regulatedAuthorityCountry
          ? { regulatedAuthorityCountry: toCountryIso2(formData.regulatedAuthorityCountry) }
          : {}),
        ...(formData.regulatoryStatus && formData.regulatoryStatus !== "not_required" && formData.regulatedLicenseNumber
          ? { regulatedLicenseNumber: formData.regulatedLicenseNumber }
          : {}),
        ...(formData.purposeOfFundMovement ? { accountPurpose: formData.purposeOfFundMovement } : {}),
        actingAsIntermediary: (extra.selectedRiskAttestations || []).includes("actingAsIntermediary"),
        conductsMoneyServices: (extra.selectedRiskAttestations || []).includes("conductsMoneyServices"),
        operatesInProhibitedCountries: (extra.selectedRiskAttestations || []).includes("operatesInProhibitedCountries"),
        highRiskActivities: extra.selectedVerticals || [],
        hasComplexOwnership: (extra.selectedRiskAttestations || []).includes("hasComplexOwnership"),
      },
      volumes: {
        monthlyDeposits: parseNumeric(formData.expectedReceivePayCount),
        monthlyWithdrawals: parseNumeric(formData.expectedSendPayCount),
        monthlyCryptoDeposits: parseNumeric(formData.depositCryptoInvestmentsAmount),
        monthlyCryptoWithdrawals: parseNumeric(formData.withdrawCryptoInvestmentsAmount),
        monthlyInvestmentDepositUsd: parseNumeric(formData.depositInvestmentsAmount),
        monthlyInvestmentWithdrawalUsd: parseNumeric(formData.withdrawInvestmentsAmount),
        monthlyCryptoInvestmentDepositUsd: parseNumeric(formData.depositCryptoInvestmentsAmount),
        monthlyCryptoInvestmentWithdrawalUsd: parseNumeric(formData.withdrawCryptoInvestmentsAmount),
        usdValueOfFiat: parseNumeric(formData.totalUsdMonthly),
        usdValueOfCrypto: parseNumeric(formData.totalUsdSendReceive),
        expectedMonthlyPaymentsUsd: parseNumeric(formData.totalUsdMonthly),
        estimatedAnnualRevenueUsd: parseNumeric(formData.estimatedMonthlyRevenueUsd),
      },
      counterparties: {
        counterparties: extra.selectedCounterparties || [],
      },
      attestations: {
        termsAndConditionsAccepted: Boolean(extra.agreeTerms),
        informationAttested: Boolean(extra.agreeAccurate),
      },
      associatedPersons: (extra.associatedPersons || []).map((p: any) => {
        const ref = isValidUUID(p.personRef) ? p.personRef : generateUUID();
        p.personRef = ref;
        return {
          personRef: ref,
          firstName: p.firstName || "",
          middleName: p.middleName || "",
          lastName: p.lastName || "",
          email: p.email || "",
          ...(p.phone ? { phone: formatPhoneNumber(p.phone, p.phoneCountryCode) } : {}),
          ...(toCountryIso2(p.phoneCountryCode || "") ? { phoneCountryCode: toCountryIso2(p.phoneCountryCode || "") } : {}),
          dateOfBirth: p.dateOfBirth || "",
          nationality: toCountryIso2(p.nationality || ""),
          citizenship: toCountryIso2(p.citizenship || ""),
          address: {
            line1: p.addressLine1 || "",
            line2: p.addressLine2 || "",
            city: p.city || "",
            ...(p.stateRegion ? { state: p.stateRegion } : {}),
            ...(p.postalCode ? { postalCode: p.postalCode } : {}),
            ...(toCountryIso2(p.country || "") ? { country: toCountryIso2(p.country || "") } : {}),
          },
          taxId: p.taxId || "",
          ownershipPercent: parseNumeric(p.ownershipPercent),
          roles: p.roles || [],
          title: p.title || "",
          relationshipEstablishedAt: p.relationshipEstablishedAt || "",
          ...(p.govIdKind ? { govIdKind: p.govIdKind } : {}),
          govIdNumber: p.govIdNumber || "",
          govIdCountry: toCountryIso2(p.govIdCountry || ""),
        };
      }),
    },
  };
}


export default function KybForm({ businessData, onBack, onComplete, onReturnToCustomers }: KybFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [hasNoWebsite, setHasNoWebsite] = useState(false);
  const [isDao, setIsDao] = useState(false);
  const [turnOffAddressSuggestions, setTurnOffAddressSuggestions] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [draftSavedBadge, setDraftSavedBadge] = useState(true);
  const [isDraftLoading, setIsDraftLoading] = useState(false);

  // NAICS Industries Query using TanStack Query
  const { data: naicsIndustries = [], isLoading: isLoadingNaics } = useQuery({
    queryKey: ["naicsCodes"],
    queryFn: async () => {
      const res = await getNAICSCode();
      const items = res?.data?.industries || res?.industries || [];
      return Array.isArray(items) ? (items as Array<{ code: string; title: string }>) : [];
    },
    staleTime: 1000 * 60 * 60,
  });

  // Step 4 Operations State
  const [opJurisdictions, setOpJurisdictions] = useState<string[]>([]);
  const [selectedRiskAttestations, setSelectedRiskAttestations] = useState<string[]>([]);
  const [selectedVerticals, setSelectedVerticals] = useState<string[]>([]);

  // Step 6 Counterparties State
  const [selectedCounterparties, setSelectedCounterparties] = useState<string[]>([]);

  // Step 9 Review & Submit State
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeAccurate, setAgreeAccurate] = useState(false);
  const [enableUsdCapabilities, setEnableUsdCapabilities] = useState(true);

  // Step 7 Associated Persons State
  const [associatedPersons, setAssociatedPersons] = useState<PersonFormData[]>([]);

  // Step 8 Documents State matching offramp v2 Business kind enums
  const [documents, setDocuments] = useState<Record<string, DocState>>({
    business_formation: { file: null, isUploaded: false },
    ownership_information: { file: null, isUploaded: false },
    proof_of_nature_of_business: { file: null, isUploaded: false },
    proof_of_source_of_funds: { file: null, isUploaded: false },
    proof_of_address: { file: null, isUploaded: false },
    bank_statement: { file: null, isUploaded: false },
    articles_of_incorporation: { file: null, isUploaded: false },
    tax_document: { file: null, isUploaded: false },
    memorandum_of_association: { file: null, isUploaded: false },
    flow_of_funds: { file: null, isUploaded: false },
    compliance_screening: { file: null, isUploaded: false },
    shareholder_register: { file: null, isUploaded: false },
    licensed_vendors_attestation: { file: null, isUploaded: false },
    proof_of_licensure: { file: null, isUploaded: false },
  });

  const [otherDocFile, setOtherDocFile] = useState<File | null>(null);
  const [otherDocDesc, setOtherDocDesc] = useState("");
  const [otherDocsList, setOtherDocsList] = useState<Array<{ name: string; desc: string }>>([]);

  // Comprehensive Form State matching all uploaded images
  const [formData, setFormData] = useState({
    legalName: businessData?.legalName || "",
    tradeName: "",
    entityType: "",
    industry: "",
    countryOfRegistration: "",
    stateOfIncorporation: "",
    registrationNumber: "",
    taxId: "",
    formationDate: "",
    website: "",
    hasNoWebsite: false,
    marketingStrategy: "",
    businessDescription: "",

    addressLine1: "",
    addressLine2: "",
    country: "",
    city: "",
    stateRegion: "",
    postalCode: "",

    email: businessData?.email || "",
    phoneCountry: "",
    phone: "",

    primarySourceOfFunds: "",
    regulatoryStatus: "",
    sourceOfFundsDescription: "",
    purposeOfFundMovement: "",
    fundMovementDescription: "",
    regulatedActivityDescription: "",
    regulatedAuthorityName: "",
    regulatedAuthorityCountry: "",
    regulatedLicenseNumber: "",

    estimatedMonthlyRevenueUsd: "",
    expectedReceivePayCount: "",
    expectedSendPayCount: "",
    totalUsdSendReceive: "",
    totalUsdMonthly: "",
    depositInvestmentsAmount: "",
    withdrawInvestmentsAmount: "",
    depositCryptoInvestmentsAmount: "",
    withdrawCryptoInvestmentsAmount: "",
  });

  const [busReqs, setBusReqs] = useState<AddressRequirements>({ country: "", state: "optional", postal_code: "optional" });
  const [isLoadingBusReqs, setIsLoadingBusReqs] = useState(false);

  useEffect(() => {
    const targetCountry = formData.country || formData.countryOfRegistration;
    if (targetCountry) {
      setIsLoadingBusReqs(true);
      getAddressRequirements(targetCountry)
        .then((reqs) => {
          if (reqs) setBusReqs(reqs);
        })
        .finally(() => {
          setIsLoadingBusReqs(false);
        });
    } else {
      setBusReqs({ country: "", state: "optional", postal_code: "optional" });
      setIsLoadingBusReqs(false);
    }
  }, [formData.country, formData.countryOfRegistration]);

  useEffect(() => {
    async function loadDraft() {
      setIsDraftLoading(true);
      const activeCustomerId = businessData?.customerId;
      const activeEmail = businessData?.email;

      const cacheKey = `kyb_draft_${activeEmail || activeCustomerId || "default"}`;
      let loadedData: any = null;
      let savedStep = 1;

      try {
        if (activeCustomerId || activeEmail) {
          try {
            const res = await getKYCData(activeCustomerId, activeEmail);
            const rawData = (res as any)?.data?.profile ? (res as any).data : ((res as any)?.profile || (res as any)?.email ? res : null);
            if (rawData) {
              loadedData = rawData;
            }
          } catch (err) {
            console.warn("Could not fetch backend KYB draft, checking localStorage cache...", err);
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
          const profile = loadedData.profile || loadedData;
          const business = profile.business || {};
          const addresses = profile.addresses || {};
          const registered = addresses.registered || {};
          const physical = addresses.physical || {};
          const contact = profile.contact || {};
          const operations = profile.operations || {};
          const volumes = profile.volumes || {};
          const counterparties = profile.counterparties || {};
          const attestations = profile.attestations || {};
          const rawAssociatedPersons = profile.associatedPersons || [];

          setFormData((prev) => ({
            ...prev,
            legalName: business.legalName || businessData?.legalName || prev.legalName,
            tradeName: business.tradeName || prev.tradeName,
            entityType: business.entityType || prev.entityType,
            industry: business.industry || prev.industry,
            countryOfRegistration: business.countryOfRegistration || registered.country || loadedData.country || prev.countryOfRegistration,
            stateOfIncorporation: business.stateOfIncorporation || prev.stateOfIncorporation,
            registrationNumber: business.registrationNumber || prev.registrationNumber,
            taxId: business.taxId || prev.taxId,
            formationDate: business.formationDate || prev.formationDate,
            website: business.website || prev.website,
            hasNoWebsite: Boolean(business.noWebsite ?? prev.hasNoWebsite),
            marketingStrategy: business.marketingStrategy || prev.marketingStrategy,
            businessDescription: business.description || prev.businessDescription,

            addressLine1: registered.line1 || physical.line1 || prev.addressLine1,
            addressLine2: registered.line2 || physical.line2 || prev.addressLine2,
            country: registered.country || business.countryOfRegistration || loadedData.country || prev.country,
            city: registered.city || physical.city || prev.city,
            stateRegion: registered.state || physical.state || prev.stateRegion,
            postalCode: registered.postalCode || physical.postalCode || prev.postalCode,

            email: contact.email || loadedData.email || businessData?.email || prev.email,
            phoneCountry: contact.phoneCountryCode || prev.phoneCountry,
            phone: contact.phone || prev.phone,

            primarySourceOfFunds: operations.primarySourceOfFunds || prev.primarySourceOfFunds,
            regulatoryStatus: operations.regulatedStatus || prev.regulatoryStatus,
            sourceOfFundsDescription: operations.primarySourceOfFundsDescription || prev.sourceOfFundsDescription,
            purposeOfFundMovement: operations.accountPurpose || prev.purposeOfFundMovement,
            fundMovementDescription: operations.primarySourceOfFundsDescription || prev.fundMovementDescription,
            regulatedActivityDescription: operations.regulatedActivityDescription || prev.regulatedActivityDescription,
            regulatedAuthorityName: operations.regulatedAuthorityName || prev.regulatedAuthorityName,
            regulatedAuthorityCountry: operations.regulatedAuthorityCountry || prev.regulatedAuthorityCountry,
            regulatedLicenseNumber: operations.regulatedLicenseNumber || prev.regulatedLicenseNumber,

            estimatedMonthlyRevenueUsd: volumes.estimatedAnnualRevenueUsd ? String(volumes.estimatedAnnualRevenueUsd) : prev.estimatedMonthlyRevenueUsd,
            expectedReceivePayCount: volumes.monthlyDeposits ? String(volumes.monthlyDeposits) : prev.expectedReceivePayCount,
            expectedSendPayCount: volumes.monthlyWithdrawals ? String(volumes.monthlyWithdrawals) : prev.expectedSendPayCount,
            totalUsdSendReceive: volumes.usdValueOfCrypto ? String(volumes.usdValueOfCrypto) : prev.totalUsdSendReceive,
            totalUsdMonthly: volumes.usdValueOfFiat || volumes.expectedMonthlyPaymentsUsd ? String(volumes.usdValueOfFiat || volumes.expectedMonthlyPaymentsUsd) : prev.totalUsdMonthly,
            depositInvestmentsAmount: volumes.monthlyInvestmentDepositUsd ? String(volumes.monthlyInvestmentDepositUsd) : prev.depositInvestmentsAmount,
            withdrawInvestmentsAmount: volumes.monthlyInvestmentWithdrawalUsd ? String(volumes.monthlyInvestmentWithdrawalUsd) : prev.withdrawInvestmentsAmount,
            depositCryptoInvestmentsAmount: volumes.monthlyCryptoDeposits ? String(volumes.monthlyCryptoDeposits) : prev.depositCryptoInvestmentsAmount,
            withdrawCryptoInvestmentsAmount: volumes.monthlyCryptoWithdrawals ? String(volumes.monthlyCryptoWithdrawals) : prev.withdrawCryptoInvestmentsAmount,
          }));

          if (business.noWebsite !== undefined) setHasNoWebsite(Boolean(business.noWebsite));
          if (business.isDao !== undefined) setIsDao(Boolean(business.isDao));

          if (operations.businessJurisdictions && operations.businessJurisdictions.length > 0) {
            setOpJurisdictions(operations.businessJurisdictions);
          } else if (operations.fundsMovementJurisdictions && operations.fundsMovementJurisdictions.length > 0) {
            setOpJurisdictions(operations.fundsMovementJurisdictions);
          }

          const riskAttestations: string[] = [];
          if (operations.actingAsIntermediary) riskAttestations.push("actingAsIntermediary");
          if (operations.conductsMoneyServices) riskAttestations.push("conductsMoneyServices");
          if (operations.operatesInProhibitedCountries) riskAttestations.push("operatesInProhibitedCountries");
          if (operations.hasComplexOwnership) riskAttestations.push("hasComplexOwnership");
          if (riskAttestations.length > 0) setSelectedRiskAttestations(riskAttestations);

          if (operations.highRiskActivities && operations.highRiskActivities.length > 0) {
            setSelectedVerticals(operations.highRiskActivities);
          }

          if (counterparties.counterparties && counterparties.counterparties.length > 0) {
            setSelectedCounterparties(counterparties.counterparties);
          }

          if (attestations.termsAndConditionsAccepted !== undefined) setAgreeTerms(Boolean(attestations.termsAndConditionsAccepted));
          if (attestations.informationAttested !== undefined) setAgreeAccurate(Boolean(attestations.informationAttested));

          if (Array.isArray(rawAssociatedPersons) && rawAssociatedPersons.length > 0) {
            const mappedPersons = rawAssociatedPersons.map((p: any) => ({
              personRef: p.personRef || "",
              firstName: p.firstName || "",
              middleName: p.middleName || "",
              lastName: p.lastName || "",
              email: p.email || "",
              phoneCountryCode: p.phoneCountryCode || "",
              phone: p.phone || "",
              dateOfBirth: p.dateOfBirth || "",
              taxId: p.taxId || "",
              nationality: p.nationality || "",
              citizenship: p.citizenship || "",
              ownershipPercent: p.ownershipPercent !== undefined && p.ownershipPercent !== null ? String(p.ownershipPercent) : "",
              title: p.title || "",
              relationshipEstablishedAt: p.relationshipEstablishedAt || "",
              roles: p.roles || [],
              addressLine1: p.address?.line1 || p.addressLine1 || "",
              addressLine2: p.address?.line2 || p.addressLine2 || "",
              country: p.address?.country || p.country || "",
              city: p.address?.city || p.city || "",
              stateRegion: p.address?.state || p.stateRegion || "",
              postalCode: p.address?.postalCode || p.postalCode || "",
              govIdKind: p.govIdKind || "",
              govIdNumber: p.govIdNumber || "",
              govIdCountry: p.govIdCountry || "",
              docs: p.docs || {},
            }));
            setAssociatedPersons(mappedPersons);
          }

          if (savedStep > 1) {
            setCurrentStep(savedStep);
          }
        }
      } catch (err) {
        console.error("Error loading KYB draft:", err);
      } finally {
        setIsDraftLoading(false);
      }
    }

    loadDraft();
  }, [businessData?.customerId, businessData?.email]);

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

  function handleDocFileChange(key: string, file: File | null) {
    setDocuments((prev) => ({
      ...prev,
      [key]: {
        file,
        uploadedName: file ? file.name : prev[key]?.uploadedName,
        isUploaded: file ? prev[key]?.isUploaded ?? false : false,
      },
    }));
  }

  function handleDocDelete(key: string) {
    setDocuments((prev) => ({
      ...prev,
      [key]: { file: null, uploadedName: undefined, isUploaded: false },
    }));
    setUploadedDocs((prev) => ({ ...prev, [key]: false }));
  }

  // Document upload state — mirrors KYC pattern
  const [uploadingDocs, setUploadingDocs] = useState<Record<string, boolean>>({});
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, boolean>>({});

  async function handleUploadDocument(file: File, kind: string, label: string) {
    const MIN_SIZE_BYTES = 10 * 1024;
    if (file.size < MIN_SIZE_BYTES) {
      toast.error(`File size must be at least 10 KB. (Selected file is ${(file.size / 1024).toFixed(1)} KB)`);
      return;
    }

    setUploadingDocs((prev) => ({ ...prev, [kind]: true }));
    try {
      const activeCustomerId = businessData?.customerId;
      const activeEmail = businessData?.email || formData.email;

      const fd = new FormData();
      if (activeEmail) fd.append("email", activeEmail);
      fd.append("kind", kind);
      fd.append("file", file);

      await uploadDocument(fd, activeCustomerId, activeEmail);

      setUploadedDocs((prev) => ({ ...prev, [kind]: true }));
      setDocuments((prev) => ({
        ...prev,
        [kind]: { ...prev[kind], isUploaded: true, uploadedName: file.name },
      }));
      toast.success(`${label} uploaded successfully!`);
    } catch (err: any) {
      toast.error(err?.message || `Failed to upload ${label}. Please try again.`);
    } finally {
      setUploadingDocs((prev) => ({ ...prev, [kind]: false }));
    }
  }

  async function handleUploadPersonDocument(personRef: string, file: File, kind: string, label: string) {
    const MIN_SIZE_BYTES = 10 * 1024;
    if (file.size < MIN_SIZE_BYTES) {
      toast.error(`File size must be at least 10 KB. (Selected file is ${(file.size / 1024).toFixed(1)} KB)`);
      return;
    }

    const docKey = `${personRef}_${kind}`;
    setUploadingDocs((prev) => ({ ...prev, [docKey]: true }));
    try {
      const activeCustomerId = businessData?.customerId;
      const activeEmail = businessData?.email || formData.email;

      const fd = new FormData();
      if (activeEmail) fd.append("email", activeEmail);
      fd.append("kind", kind);
      fd.append("file", file);

      await uploadPersonDocument(personRef, fd, activeCustomerId, activeEmail);

      setUploadedDocs((prev) => ({ ...prev, [docKey]: true }));

      const kindToDocKey: Record<string, "idFront" | "idBack" | "passport" | "selfie" | "proofOfAddress"> = {
        identity_card_front: "idFront",
        identity_card_back: "idBack",
        passport: "passport",
        selfie: "selfie",
        proof_of_address: "proofOfAddress",
      };
      const docProp = kindToDocKey[kind];
      if (docProp) {
        setAssociatedPersons((prevPersons) =>
          prevPersons.map((p) => {
            if (p.personRef !== personRef) return p;
            return {
              ...p,
              docs: {
                ...p.docs,
                [docProp]: {
                  file,
                  uploadedName: file.name,
                  isUploaded: true,
                },
              },
            };
          })
        );
      }

      toast.success(`${label} uploaded successfully!`);
    } catch (err: any) {
      toast.error(err?.message || `Failed to upload ${label}. Please try again.`);
    } finally {
      setUploadingDocs((prev) => ({ ...prev, [docKey]: false }));
    }
  }

  function handleDeletePersonDocument(personRef: string, kind: string) {
    const docKey = `${personRef}_${kind}`;
    setUploadedDocs((prev) => ({ ...prev, [docKey]: false }));

    const kindToDocKey: Record<string, "idFront" | "idBack" | "passport" | "selfie" | "proofOfAddress"> = {
      identity_card_front: "idFront",
      identity_card_back: "idBack",
      passport: "passport",
      selfie: "selfie",
      proof_of_address: "proofOfAddress",
    };
    const docProp = kindToDocKey[kind];
    if (docProp) {
      setAssociatedPersons((prevPersons) =>
        prevPersons.map((p) => {
          if (p.personRef !== personRef) return p;
          return {
            ...p,
            docs: {
              ...p.docs,
              [docProp]: {
                file: null,
                uploadedName: undefined,
                isUploaded: false,
              },
            },
          };
        })
      );
    }
  }



  // Zod Validation State & Dev Toggle
  const [zodEnabled, setZodEnabled] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function validateCurrentStep(step: number = currentStep): boolean {
    if (!zodEnabled) {
      setFieldErrors({});
      return true;
    }

    setFieldErrors({});
    let result: { success: boolean; error?: any };

    switch (step) {
      case 1:
        result = step1BusinessSchema.safeParse({
          ...formData,
          hasNoWebsite,
          isDao,
        });
        break;
      case 2: {
        const addressErrors = validateKybAddresses(formData, busReqs);
        if (Object.keys(addressErrors).length > 0) {
          setFieldErrors(addressErrors);
          return false;
        }
        return true;
      }
      case 3:
        result = step3ContactSchema.safeParse({
          email: formData.email,
          phoneCountry: formData.phoneCountry,
          phone: formData.phone,
        });
        break;
      case 4:
        result = step4OperationsSchema.safeParse({
          opJurisdictions,
          primarySourceOfFunds: formData.primarySourceOfFunds,
          regulatoryStatus: formData.regulatoryStatus,
          sourceOfFundsDescription: formData.sourceOfFundsDescription,
          purposeOfFundMovement: formData.purposeOfFundMovement,
          fundMovementDescription: formData.fundMovementDescription,
          selectedRiskAttestations,
          selectedVerticals,
        });
        break;
      case 5:
        result = step5VolumesSchema.safeParse({
          estimatedMonthlyRevenueUsd: formData.estimatedMonthlyRevenueUsd,
          expectedReceivePayCount: formData.expectedReceivePayCount,
          expectedSendPayCount: formData.expectedSendPayCount,
          totalUsdSendReceive: formData.totalUsdSendReceive,
          totalUsdMonthly: formData.totalUsdMonthly,
          depositInvestmentsAmount: formData.depositInvestmentsAmount,
          withdrawInvestmentsAmount: formData.withdrawInvestmentsAmount,
          depositCryptoInvestmentsAmount: formData.depositCryptoInvestmentsAmount,
          withdrawCryptoInvestmentsAmount: formData.withdrawCryptoInvestmentsAmount,
        });
        break;
      case 6:
        result = step6CounterpartiesSchema.safeParse({
          selectedCounterparties,
        });
        break;
      case 7:
        result = step7PeopleSchema.safeParse({
          associatedPersons,
        });
        break;
      case 8: {
        const REQUIRED_DOC_KEYS = [
          "business_formation",
          "ownership_information",
          "proof_of_nature_of_business",
          "proof_of_source_of_funds",
          "proof_of_address",
          "tax_document",
        ];
        const REQUIRED_DOCS = REQUIRED_DOC_KEYS.map((key) => ({
          key,
          label: getKybEnumLabel(BUSINESS_DOCUMENT_KIND_OPTIONS, key),
        }));
        const docErrors: Record<string, string> = {};
        for (const doc of REQUIRED_DOCS) {
          if (!uploadedDocs[doc.key] && !documents[doc.key]?.isUploaded) {
            docErrors[`doc_${doc.key}`] = `${doc.label} is required. Please upload this document before continuing.`;
          }
        }
        if (Object.keys(docErrors).length > 0) {
          setFieldErrors(docErrors);
          return false;
        }
        return true;
      }
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
        const fullPath = issue.path.join(".");
        if (fullPath) {
          formattedErrors[fullPath] = issue.message;
        }
        const topPath = issue.path[0];
        if (topPath && typeof topPath === "string" && !formattedErrors[topPath]) {
          formattedErrors[topPath] = issue.message;
        }
      });
      setFieldErrors(formattedErrors);
      return false;
    }

    return true;
  }

  const [isSaving, setIsSaving] = useState(false);

  async function handleNext() {
    if (zodEnabled && !validateCurrentStep()) {
      return;
    }

    setIsSaving(true);
    try {
      const payload = buildSaveKybPayload(formData, {
        hasNoWebsite,
        isDao,
        opJurisdictions,
        selectedRiskAttestations,
        selectedVerticals,
        selectedCounterparties,
        agreeTerms,
        agreeAccurate,
        enableUsdCapabilities,
        busReqs,
        associatedPersons,
        email: businessData?.email,
      });

      const activeCustomerId = businessData?.customerId;
      const activeEmail = businessData?.email || formData.email;

      const cacheKey = `kyb_draft_${activeEmail || activeCustomerId || "default"}`;
      try {
        localStorage.setItem(
          cacheKey,
          JSON.stringify({ payload, currentStep: currentStep < 9 ? currentStep + 1 : 9 })
        );
      } catch (e) {
        console.error("Local storage draft save failed:", e);
      }

      await saveKYBData(payload, activeCustomerId, activeEmail);

      if (currentStep < 9) {
        setCurrentStep((prev) => prev + 1);
        toast.success("Draft saved");
      } else {
        await submitKYC(activeCustomerId, { email: activeEmail, country: formData.countryOfRegistration || formData.country, corridor: "global" }, activeEmail);
        setSubmitted(true);
        if (onComplete) onComplete();
        toast.success("KYB Verification Submitted successfully!");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to save KYB data. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  const businessName = formData.legalName || "DashX";

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header section matching Image */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">
          Verify {businessName}
        </h1>
        <p className="text-sm text-[#64748b]">
          Enter your customer's business details on their behalf. Progress is saved automatically after each step.
        </p>
      </div>

      {isDraftLoading ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 bg-white rounded-2xl border border-[var(--color-stroke)] shadow-xs text-center min-h-[320px] gap-3">
          <Loader2 size={36} className="animate-spin text-[var(--color-brand)]" />
          <p className="text-base font-semibold text-[#0f172a]">Loading..</p>
          <p className="text-xs text-[#64748b]">Please wait details are loading.</p>
        </div>
      ) : submitted ? (
        <div className="flex flex-col items-center justify-center py-12 px-6 bg-white rounded-2xl border border-[var(--color-stroke)] shadow-xs text-center max-w-xl mx-auto my-8">
          <div className="h-14 w-14 rounded-full bg-[#f0fdf4] text-[#16a34a] flex items-center justify-center mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-xl font-bold text-[#0f172a]">KYB Verification Submitted!</h2>
          <p className="text-sm text-[#64748b] mt-2">
            Business profile for <span className="font-semibold text-[#0f172a]">{businessName}</span> has been submitted for KYB review.
          </p>
          {/* <button
            onClick={onReturnToCustomers || onBack}
            className="mt-6 px-6 py-2.5 rounded-full bg-[var(--color-brand)] text-white text-xs font-semibold hover:bg-[var(--color-brand-hover)] transition-all"
          >
            Return to Customers
          </button> */}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start pt-2">
          {/* Vertical Step Sidebar matching Image */}
          <div className="md:col-span-3 flex flex-col gap-1 border-r border-[var(--color-stroke)] pr-4">
            {STEPS.map((step) => {
              const isActive = currentStep === step.id;
              const isPast = currentStep > step.id;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-sm transition-all ${isActive
                    ? "bg-[#f1f5f9] text-[#0f172a] font-bold"
                    : "text-[#64748b] hover:bg-[#f8fafc]"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-[#94a3b8]">
                      {String(step.id).padStart(2, "0")}
                    </span>
                    <span className={isActive ? "font-bold text-[#0f172a]" : "font-normal text-[#475569]"}>
                      {step.label}
                    </span>
                  </div>

                  <span
                    className={`h-2 w-2 rounded-full ${isPast
                      ? "bg-green-500"
                      : isActive
                        ? "bg-red-500"
                        : "bg-gray-300"
                      }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Right Form Content Area matching Images */}
          <div className="md:col-span-9 flex flex-col gap-6 bg-white p-6 rounded-2xl border border-[var(--color-stroke)] shadow-xs">
            {/* Zod Dev Bypass Toggle Button */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setZodEnabled((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-xs font-semibold transition-all shadow-2xs ${zodEnabled
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                  : "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                  }`}
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


            {/* STEP 1: BUSINESS */}
            {currentStep === 1 && (
              <div className="flex flex-col gap-5">
                <p className="text-xs text-[#64748b] leading-relaxed">
                  Basics about your entity. All fields are required before you submit. Click <span className="font-semibold text-[#0f172a]">Save</span> (or <span className="font-semibold text-[#0f172a] cursor-pointer">Save & next</span>) to persist your progress; nothing is written to the server until you do.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[#0f172a]">
                      Legal name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.legalName}
                      onChange={(e) => handleChange("legalName", e.target.value)}
                      placeholder="DashX"
                      className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
                        fieldErrors.legalName
                          ? "border-red-500 focus:border-red-500"
                          : "border-[var(--color-stroke)] focus:border-[var(--color-brand)]"
                      }`}
                    />
                    {fieldErrors.legalName && (
                      <span className="text-[11px] text-red-500 font-medium">{fieldErrors.legalName}</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[#0f172a]">
                      Trade name (DBA) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.tradeName}
                      onChange={(e) => handleChange("tradeName", e.target.value)}
                      placeholder="Acme"
                      className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
                        fieldErrors.tradeName
                          ? "border-red-500 focus:border-red-500"
                          : "border-[var(--color-stroke)] focus:border-[var(--color-brand)]"
                      }`}
                    />
                    {fieldErrors.tradeName && (
                      <span className="text-[11px] text-red-500 font-medium">{fieldErrors.tradeName}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[#0f172a]">
                      Entity type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.entityType}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleChange("entityType", val);
                        if (val === "dao") {
                          setIsDao(true);
                        }
                      }}
                      className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
                        fieldErrors.entityType
                          ? "border-red-500 focus:border-red-500"
                          : "border-[var(--color-stroke)] focus:border-[var(--color-brand)]"
                      }`}
                    >
                      <option value="">Select...</option>
                      {ENTITY_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.entityType && (
                      <span className="text-[11px] text-red-500 font-medium">{fieldErrors.entityType}</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[#0f172a]">
                      Industry (NAICS code) <span className="text-red-500">*</span>
                    </label>
                    <IndustryCombobox
                      value={formData.industry}
                      onChange={(val) => handleChange("industry", val)}
                      options={naicsIndustries}
                      isLoading={isLoadingNaics}
                    />
                    {fieldErrors.industry && (
                      <span className="text-[11px] text-red-500 font-medium">{fieldErrors.industry}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[#0f172a]">
                      Country of registration <span className="text-red-500">*</span>
                    </label>
                    <CountryCombobox
                      value={formData.countryOfRegistration}
                      onChange={(val) => {
                        handleChange("countryOfRegistration", val);
                        if (!formData.country) {
                          handleChange("country", val);
                        }
                      }}
                      placeholder="Select country of registration..."
                      className={fieldErrors.countryOfRegistration ? "border-red-500" : ""}
                    />
                    {fieldErrors.countryOfRegistration && (
                      <span className="text-[11px] text-red-500 font-medium">{fieldErrors.countryOfRegistration}</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[#0f172a]">
                      State of incorporation <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.stateOfIncorporation}
                      onChange={(e) => handleChange("stateOfIncorporation", e.target.value)}
                      placeholder="e.g. ON"
                      className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
                        fieldErrors.stateOfIncorporation
                          ? "border-red-500 focus:border-red-500"
                          : "border-[var(--color-stroke)] focus:border-[var(--color-brand)]"
                      }`}
                    />
                    {fieldErrors.stateOfIncorporation && (
                      <span className="text-[11px] text-red-500 font-medium">{fieldErrors.stateOfIncorporation}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[#0f172a]">
                      Registration number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.registrationNumber}
                      onChange={(e) => handleChange("registrationNumber", e.target.value)}
                      placeholder="1234567"
                      className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
                        fieldErrors.registrationNumber
                          ? "border-red-500 focus:border-red-500"
                          : "border-[var(--color-stroke)] focus:border-[var(--color-brand)]"
                      }`}
                    />
                    {fieldErrors.registrationNumber && (
                      <span className="text-[11px] text-red-500 font-medium">{fieldErrors.registrationNumber}</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[#0f172a]">
                      Tax ID (EIN / equivalent) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.taxId}
                      onChange={(e) => handleChange("taxId", e.target.value)}
                      placeholder="82-1234567"
                      className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
                        fieldErrors.taxId
                          ? "border-red-500 focus:border-red-500"
                          : "border-[var(--color-stroke)] focus:border-[var(--color-brand)]"
                      }`}
                    />
                    {fieldErrors.taxId && (
                      <span className="text-[11px] text-red-500 font-medium">{fieldErrors.taxId}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[#0f172a]">
                      Formation date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.formationDate}
                      onChange={(e) => handleChange("formationDate", e.target.value)}
                      className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
                        fieldErrors.formationDate
                          ? "border-red-500 focus:border-red-500"
                          : "border-[var(--color-stroke)] focus:border-[var(--color-brand)]"
                      }`}
                    />
                    {fieldErrors.formationDate && (
                      <span className="text-[11px] text-red-500 font-medium">{fieldErrors.formationDate}</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[#0f172a]">
                      Website <span className="text-red-500">*</span>
                    </label>
                    <div
                      className={`flex items-center rounded-xl border overflow-hidden ${
                        fieldErrors.website
                          ? "border-red-500 focus-within:border-red-500"
                          : "border-[var(--color-stroke)] focus-within:border-[var(--color-brand)]"
                      }`}
                    >
                      <span className="px-3 text-sm text-[#64748b] bg-[#f8fafc] border-r border-[var(--color-stroke)] py-2.5">
                        https://
                      </span>
                      <input
                        type="text"
                        disabled={hasNoWebsite}
                        value={formData.website.replace("https://", "")}
                        onChange={(e) => handleChange("website", "https://" + e.target.value)}
                        placeholder="acme.example"
                        className="h-11 w-full px-3 text-sm outline-none disabled:bg-[#f8fafc] disabled:text-[#94a3b8]"
                      />
                    </div>
                    <label className="flex items-center gap-2 mt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasNoWebsite}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setHasNoWebsite(checked);
                          if (fieldErrors.website) {
                            setFieldErrors((prev) => {
                              const next = { ...prev };
                              delete next.website;
                              return next;
                            });
                          }
                        }}
                        className="rounded border-[var(--color-stroke)] text-[var(--color-brand)] focus:ring-0"
                      />
                      <span className="text-xs text-[#64748b]">This entity has no website</span>
                    </label>
                    {fieldErrors.website && (
                      <span className="text-[11px] text-red-500 font-medium">{fieldErrors.website}</span>
                    )}
                  </div>
                </div>

                {hasNoWebsite && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-[#0f172a]">
                        Marketing strategy & customer acquisition <span className="text-red-500">*</span>
                      </label>
                      <span className={`text-[11px] font-medium ${
                        (formData.marketingStrategy || "").trim().length < 350 ? "text-amber-600" : "text-green-600"
                      }`}>
                        {(formData.marketingStrategy || "").trim().length} / 350 min characters
                      </span>
                    </div>
                    <textarea
                      rows={5}
                      value={formData.marketingStrategy || ""}
                      onChange={(e) => handleChange("marketingStrategy", e.target.value)}
                      placeholder="Describe who your customers are, how your business makes money, sales channels, and customer acquisition strategy (minimum 350 characters)..."
                      className={`w-full rounded-xl border p-3 text-sm outline-none resize-none ${
                        fieldErrors.marketingStrategy
                          ? "border-red-500 focus:border-red-500"
                          : "border-[var(--color-stroke)] focus:border-[var(--color-brand)]"
                      }`}
                    />
                    {fieldErrors.marketingStrategy ? (
                      <span className="text-[11px] text-red-500 font-medium">{fieldErrors.marketingStrategy}</span>
                    ) : (
                      <span className="text-[11px] text-[#64748b]">
                        Since this entity has no public website, please detail your marketing strategy and customer acquisition channels (at least 350 characters).
                      </span>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#0f172a] flex items-center gap-1">
                    Business description <Info size={14} className="text-[#94a3b8]" /> <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={formData.businessDescription}
                    onChange={(e) => handleChange("businessDescription", e.target.value)}
                    placeholder="What product or service do you provide? Who are your customers? How does your business make money? How do funds move through your business?"
                    className={`w-full rounded-xl border p-3 text-sm outline-none ${
                      fieldErrors.businessDescription
                        ? "border-red-500 focus:border-red-500"
                        : "border-[var(--color-stroke)] focus:border-[var(--color-brand)]"
                    }`}
                  />
                  <div className="flex items-center justify-between text-[11px] text-amber-700">
                    <span>{formData.businessDescription.length} / 350 character minimum</span>
                  </div>
                  {fieldErrors.businessDescription && (
                    <span className="text-[11px] text-red-500 font-medium">{fieldErrors.businessDescription}</span>
                  )}
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isDao}
                    onChange={(e) => setIsDao(e.target.checked)}
                    className="rounded border-[var(--color-stroke)] text-[var(--color-brand)] focus:ring-0"
                  />
                  <span className="text-xs font-medium text-[#0f172a]">This entity is a DAO</span>
                </label>
              </div>
            )}

            {/* STEP 2: ADDRESSES */}
            {currentStep === 2 && (
              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs text-[#64748b] leading-relaxed max-w-xl">
                    Where your entity is legally registered. If the operating address is different, fill out the physical address too. Note that your physical address cannot be a virtual address or an address of a registered agent. If you operate remotely, we can accept the residential address of a control person.
                  </p>

                  <label className="flex items-center gap-2 cursor-pointer text-xs text-[#64748b] hover:text-[#0f172a] select-none shrink-0">
                    <input
                      type="checkbox"
                      checked={turnOffAddressSuggestions}
                      onChange={(e) => setTurnOffAddressSuggestions(e.target.checked)}
                      className="rounded border-[var(--color-stroke)] text-[var(--color-brand)] focus:ring-0"
                    />
                    <span>Turn off address suggestions</span>
                  </label>
                </div>

                <div className="flex flex-col gap-4">
                  <h3 className="text-sm font-bold text-[#0f172a]">Registered Address</h3>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[#0f172a]">
                      Address line 1 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.addressLine1}
                      onChange={(e) => handleChange("addressLine1", e.target.value)}
                      placeholder="1 Wall St"
                      className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
                        fieldErrors.addressLine1
                          ? "border-red-500 focus:border-red-500"
                          : "border-[var(--color-stroke)] focus:border-[var(--color-brand)]"
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
                      value={formData.addressLine2}
                      onChange={(e) => handleChange("addressLine2", e.target.value)}
                      placeholder="Suite 200"
                      className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[var(--color-brand)]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-[#0f172a]">
                        Country <span className="text-red-500">*</span>
                      </label>
                      <CountryCombobox
                        value={formData.country}
                        onChange={(val) => handleChange("country", val)}
                        placeholder="Select country..."
                        className={fieldErrors.country ? "border-red-500" : ""}
                      />
                      {fieldErrors.country ? (
                        <span className="text-[11px] text-red-500 font-medium">{fieldErrors.country}</span>
                      ) : (
                        <span className="text-[11px] text-[#64748b]">Set from Country of registration in the Business step.</span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-[#0f172a]">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => handleChange("city", e.target.value)}
                        className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
                          fieldErrors.city
                            ? "border-red-500 focus:border-red-500"
                            : "border-[var(--color-stroke)] focus:border-[var(--color-brand)]"
                        }`}
                      />
                      {fieldErrors.city && (
                        <span className="text-[11px] text-red-500 font-medium">{fieldErrors.city}</span>
                      )}
                    </div>
                  </div>

                  {isLoadingBusReqs ? (
                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 font-medium">
                      <Loader2 className="w-4 h-4 animate-spin text-[#0f172a] shrink-0" />
                      <span>Checking business address requirements for selected country...</span>
                    </div>
                  ) : (
                    (busReqs.state === "required" || busReqs.postal_code === "required") && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {busReqs.state === "required" && (
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-[#0f172a]">
                              State / region <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={formData.stateRegion}
                              onChange={(e) => handleChange("stateRegion", e.target.value)}
                              placeholder="State, province, or region"
                              className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
                                fieldErrors.stateRegion
                                  ? "border-red-500 focus:border-red-500"
                                  : "border-[var(--color-stroke)] focus:border-[var(--color-brand)]"
                              }`}
                            />
                            {fieldErrors.stateRegion && (
                              <span className="text-[11px] text-red-500 font-medium">{fieldErrors.stateRegion}</span>
                            )}
                          </div>
                        )}

                        {busReqs.postal_code === "required" && (
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
                                  : "border-[var(--color-stroke)] focus:border-[var(--color-brand)]"
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
              </div>
            )}

            {/* STEP 3: CONTACT */}
            {currentStep === 3 && (
              <div className="flex flex-col gap-5">
                <p className="text-xs text-[#64748b]">Primary business contact. Reaches a real person at your entity.</p>

                <div className="flex flex-col gap-1.5 max-w-lg">
                  <label className="text-xs font-medium text-[#0f172a]">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="abcd@gmail.com"
                    className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
                      fieldErrors.email
                        ? "border-red-500 focus:border-red-500"
                        : "border-[var(--color-stroke)] focus:border-[var(--color-brand)]"
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
                      value={formData.phoneCountry}
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
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder="2025550100"
                      className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
                        fieldErrors.phone
                          ? "border-red-500 focus:border-red-500"
                          : "border-[var(--color-stroke)] focus:border-[var(--color-brand)]"
                      }`}
                    />
                    {fieldErrors.phone ? (
                      <span className="text-[11px] text-red-500 font-medium">{fieldErrors.phone}</span>
                    ) : (
                      <span className="text-[11px] text-[#64748b]">Enter your number without the country code</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: OPERATIONS */}
            {currentStep === 4 && (
              <div className="flex flex-col gap-6">
                <p className="text-xs text-[#64748b] leading-relaxed">
                  Compliance and jurisdiction context. Drives risk screening at submit.
                </p>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#0f172a]">
                    Jurisdictions where you will move funds <span className="text-red-500">*</span>
                  </label>
                  <CountryCombobox
                    value=""
                    onChange={(code) => {
                      if (code && !opJurisdictions.includes(code)) {
                        const next = [...opJurisdictions, code];
                        setOpJurisdictions(next);
                        if (fieldErrors.opJurisdictions) {
                          setFieldErrors((prev) => {
                            const copy = { ...prev };
                            delete copy.opJurisdictions;
                            return copy;
                          });
                        }
                      }
                    }}
                    placeholder="Search and pick countries..."
                    className={fieldErrors.opJurisdictions ? "border-red-500" : ""}
                  />
                  {fieldErrors.opJurisdictions && (
                    <span className="text-[11px] text-red-500 font-medium">{fieldErrors.opJurisdictions}</span>
                  )}

                  {opJurisdictions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {opJurisdictions.map((countryCode) => (
                        <span
                          key={countryCode}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f1f5f9] text-xs font-semibold text-[#0f172a] border border-[var(--color-stroke)]"
                        >
                          {getCountryName(countryCode)} ({countryCode})
                          <button
                            type="button"
                            onClick={() => setOpJurisdictions(opJurisdictions.filter((c) => c !== countryCode))}
                            className="hover:text-red-500"
                          >
                            <X size={13} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[#0f172a]">
                      Primary source of funds for your business <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.primarySourceOfFunds}
                      onChange={(e) => handleChange("primarySourceOfFunds", e.target.value)}
                      className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
                        fieldErrors.primarySourceOfFunds
                          ? "border-red-500 focus:border-red-500"
                          : "border-[var(--color-stroke)] focus:border-[var(--color-brand)]"
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

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[#0f172a]">
                      Regulatory status of your business <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.regulatoryStatus}
                      onChange={(e) => handleChange("regulatoryStatus", e.target.value)}
                      className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
                        fieldErrors.regulatoryStatus
                          ? "border-red-500 focus:border-red-500"
                          : "border-[var(--color-stroke)] focus:border-[var(--color-brand)]"
                      }`}
                    >
                      <option value="">Select...</option>
                      {REGULATED_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.regulatoryStatus && (
                      <span className="text-[11px] text-red-500 font-medium">{fieldErrors.regulatoryStatus}</span>
                    )}
                  </div>
                </div>

                {/* Regulatory detail fields — shown when a status other than "not_required" is selected */}
                {formData.regulatoryStatus && formData.regulatoryStatus !== "not_required" && (
                  <div className="flex flex-col gap-4 p-4 rounded-xl border border-[var(--color-stroke)] bg-[#f8fafc]">
                    <p className="text-xs font-semibold text-[#475569]">Regulatory details</p>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-[#0f172a]">
                        Regulated activity description <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.regulatedActivityDescription}
                        onChange={(e) => handleChange("regulatedActivityDescription", e.target.value)}
                        placeholder="e.g. Cross-border payment processing and money transmission"
                        className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
                          fieldErrors.regulatedActivityDescription
                            ? "border-red-500 focus:border-red-500"
                            : "border-[var(--color-stroke)] focus:border-[var(--color-brand)]"
                        }`}
                      />
                      {fieldErrors.regulatedActivityDescription && (
                        <span className="text-[11px] text-red-500 font-medium">{fieldErrors.regulatedActivityDescription}</span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-[#0f172a]">
                          Regulatory authority name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.regulatedAuthorityName}
                          onChange={(e) => handleChange("regulatedAuthorityName", e.target.value)}
                          placeholder="e.g. FinCEN, FCA, MAS"
                          className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
                            fieldErrors.regulatedAuthorityName
                              ? "border-red-500 focus:border-red-500"
                              : "border-[var(--color-stroke)] focus:border-[var(--color-brand)]"
                          }`}
                        />
                        {fieldErrors.regulatedAuthorityName && (
                          <span className="text-[11px] text-red-500 font-medium">{fieldErrors.regulatedAuthorityName}</span>
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-[#0f172a]">
                          Regulatory authority country <span className="text-red-500">*</span>
                        </label>
                        <CountryCombobox
                          value={formData.regulatedAuthorityCountry}
                          onChange={(val) => handleChange("regulatedAuthorityCountry", val)}
                          placeholder="Select country..."
                          className={fieldErrors.regulatedAuthorityCountry ? "border-red-500" : ""}
                        />
                        {fieldErrors.regulatedAuthorityCountry && (
                          <span className="text-[11px] text-red-500 font-medium">{fieldErrors.regulatedAuthorityCountry}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-[#0f172a]">
                        Regulated license number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.regulatedLicenseNumber}
                        onChange={(e) => handleChange("regulatedLicenseNumber", e.target.value)}
                        placeholder="e.g. MSB-123456"
                        className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
                          fieldErrors.regulatedLicenseNumber
                            ? "border-red-500 focus:border-red-500"
                            : "border-[var(--color-stroke)] focus:border-[var(--color-brand)]"
                        }`}
                      />
                      {fieldErrors.regulatedLicenseNumber && (
                        <span className="text-[11px] text-red-500 font-medium">{fieldErrors.regulatedLicenseNumber}</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-[#0f172a]">
                      Description of your source of funds <span className="text-red-500">*</span>
                    </label>
                    <span className={`text-[11px] font-medium ${
                      (formData.sourceOfFundsDescription || "").trim().length < 80 ? "text-amber-600" : "text-green-600"
                    }`}>
                      {(formData.sourceOfFundsDescription || "").trim().length} / 80 min characters
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={formData.sourceOfFundsDescription}
                    onChange={(e) => handleChange("sourceOfFundsDescription", e.target.value)}
                    placeholder="e.g. Revenue generated from core software implementation, ongoing SaaS client subscription fees, and enterprise consulting contracts."
                    className={`w-full rounded-xl border p-3 text-sm outline-none resize-none ${
                      fieldErrors.sourceOfFundsDescription
                        ? "border-red-500 focus:border-red-500"
                        : "border-[var(--color-stroke)] focus:border-[var(--color-brand)]"
                    }`}
                  />
                  {fieldErrors.sourceOfFundsDescription ? (
                    <span className="text-[11px] text-red-500 font-medium">{fieldErrors.sourceOfFundsDescription}</span>
                  ) : (
                    <span className="text-[11px] text-[#64748b]">Minimum 80 characters required explaining your primary source of funds.</span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#0f172a]">
                    Purpose of your fund movement <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.purposeOfFundMovement}
                    onChange={(e) => handleChange("purposeOfFundMovement", e.target.value)}
                    className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
                      fieldErrors.purposeOfFundMovement
                        ? "border-red-500 focus:border-red-500"
                        : "border-[var(--color-stroke)] focus:border-[var(--color-brand)]"
                    }`}
                  >
                    <option value="">Select...</option>
                    {ACCOUNT_PURPOSE_OPTIONS.map((purp) => (
                      <option key={purp.value} value={purp.value}>
                        {purp.label}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.purposeOfFundMovement && (
                    <span className="text-[11px] text-red-500 font-medium">{fieldErrors.purposeOfFundMovement}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#0f172a]">
                    Description of your fund movement <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={formData.fundMovementDescription}
                    onChange={(e) => handleChange("fundMovementDescription", e.target.value)}
                    placeholder="Describe how funds move through your business..."
                    className={`w-full rounded-xl border p-3 text-sm outline-none ${
                      fieldErrors.fundMovementDescription
                        ? "border-red-500 focus:border-red-500"
                        : "border-[var(--color-stroke)] focus:border-[var(--color-brand)]"
                    }`}
                  />
                  {fieldErrors.fundMovementDescription && (
                    <span className="text-[11px] text-red-500 font-medium">{fieldErrors.fundMovementDescription}</span>
                  )}
                </div>

                <div className="flex flex-col gap-3 pt-3 border-t border-[var(--color-stroke)]">
                  <h3 className="text-sm font-bold text-[#0f172a]">Risk Attestations</h3>
                  <p className="text-xs text-[#64748b]">Select any of the following activities that apply to your business</p>

                  <div className="flex flex-col gap-2.5">
                    {[
                      "Conducts money services (MSB, payment processing, exchange)",
                      "Operates in prohibited countries",
                      "Moves funds on behalf of others (payment intermediary)",
                    ].map((activity) => (
                      <label key={activity} className="flex items-center gap-2.5 cursor-pointer text-xs text-[#0f172a] select-none hover:opacity-80">
                        <input
                          type="checkbox"
                          checked={selectedRiskAttestations.includes(activity)}
                          onChange={() => toggleItem(selectedRiskAttestations, activity, setSelectedRiskAttestations)}
                          className="rounded border-[var(--color-stroke)] text-[var(--color-brand)] focus:ring-0"
                        />
                        <span>{activity}</span>
                      </label>
                    ))}
                  </div>

                  <p className="text-xs text-[#64748b] mt-2">Select any of the following verticals that your business deals in</p>
                  <div className="flex flex-col gap-2.5">
                    {[
                      "Adult entertainment",
                      "Drugs",
                      "Firearms",
                      "Gambling",
                      "Marijuana",
                      "Crypto mixing / tumbling",
                    ].map((vertical) => (
                      <label key={vertical} className="flex items-center gap-2.5 cursor-pointer text-xs text-[#0f172a] select-none hover:opacity-80">
                        <input
                          type="checkbox"
                          checked={selectedVerticals.includes(vertical)}
                          onChange={() => toggleItem(selectedVerticals, vertical, setSelectedVerticals)}
                          className="rounded border-[var(--color-stroke)] text-[var(--color-brand)] focus:ring-0"
                        />
                        <span>{vertical}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: VOLUMES */}
            {currentStep === 5 && (
              <div className="flex flex-col gap-6">
                <p className="text-xs text-[#64748b]">
                  Projected volumes for your business. Drives compliance bucketing at submit.
                </p>

                <div className="flex flex-col gap-3">
                  <h3 className="text-sm font-bold text-[#0f172a]">General information</h3>

                  <div className="flex flex-col gap-1.5 max-w-lg">
                    <label className="text-xs font-medium text-[#0f172a]">
                      Estimated monthly revenue (USD) <span className="text-red-500">*</span>
                    </label>
                    <div className={`flex items-center rounded-xl border overflow-hidden ${
                      fieldErrors.estimatedMonthlyRevenueUsd
                        ? "border-red-500 focus-within:border-red-500"
                        : "border-[var(--color-stroke)] focus-within:border-[var(--color-brand)]"
                    }`}>
                      <span className="px-3 text-sm text-[#64748b] bg-[#f8fafc] border-r border-[var(--color-stroke)] py-2.5">
                        $
                      </span>
                      <input
                        type="text"
                        value={formData.estimatedMonthlyRevenueUsd}
                        onChange={(e) => handleChange("estimatedMonthlyRevenueUsd", e.target.value)}
                        placeholder="416,666"
                        className="h-11 w-full px-3 text-sm outline-none"
                      />
                    </div>
                    {fieldErrors.estimatedMonthlyRevenueUsd && (
                      <span className="text-[11px] text-red-500 font-medium">{fieldErrors.estimatedMonthlyRevenueUsd}</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <h3 className="text-sm font-bold text-[#0f172a]">Monthly payment activity</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-[#0f172a]">
                        Number of payments you expect to receive <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.expectedReceivePayCount}
                        onChange={(e) => handleChange("expectedReceivePayCount", e.target.value)}
                        placeholder="0"
                        className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
                          fieldErrors.expectedReceivePayCount
                            ? "border-red-500 focus:border-red-500"
                            : "border-[var(--color-stroke)] focus:border-[var(--color-brand)]"
                        }`}
                      />
                      {fieldErrors.expectedReceivePayCount && (
                        <span className="text-[11px] text-red-500 font-medium">{fieldErrors.expectedReceivePayCount}</span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-[#0f172a]">
                        Number of payments you expect to send <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.expectedSendPayCount}
                        onChange={(e) => handleChange("expectedSendPayCount", e.target.value)}
                        placeholder="0"
                        className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
                          fieldErrors.expectedSendPayCount
                            ? "border-red-500 focus:border-red-500"
                            : "border-[var(--color-stroke)] focus:border-[var(--color-brand)]"
                        }`}
                      />
                      {fieldErrors.expectedSendPayCount && (
                        <span className="text-[11px] text-red-500 font-medium">{fieldErrors.expectedSendPayCount}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[#0f172a]">
                      Total USD value you expect to send and receive <span className="text-red-500">*</span>
                    </label>
                    <div className={`flex items-center rounded-xl border overflow-hidden ${
                      fieldErrors.totalUsdSendReceive
                        ? "border-red-500 focus-within:border-red-500"
                        : "border-[var(--color-stroke)] focus-within:border-[var(--color-brand)]"
                    }`}>
                      <span className="px-3 text-sm text-[#64748b] bg-[#f8fafc] border-r border-[var(--color-stroke)] py-2.5">
                        $
                      </span>
                      <input
                        type="text"
                        value={formData.totalUsdSendReceive}
                        onChange={(e) => handleChange("totalUsdSendReceive", e.target.value)}
                        placeholder="500,000"
                        className="h-11 w-full px-3 text-sm outline-none"
                      />
                    </div>
                    {fieldErrors.totalUsdSendReceive && (
                      <span className="text-[11px] text-red-500 font-medium">{fieldErrors.totalUsdSendReceive}</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[#0f172a]">
                      Total USD value of payments you expect each month <span className="text-red-500">*</span>
                    </label>
                    <div className={`flex items-center rounded-xl border overflow-hidden ${
                      fieldErrors.totalUsdMonthly
                        ? "border-red-500 focus-within:border-red-500"
                        : "border-[var(--color-stroke)] focus-within:border-[var(--color-brand)]"
                    }`}>
                      <span className="px-3 text-sm text-[#64748b] bg-[#f8fafc] border-r border-[var(--color-stroke)] py-2.5">
                        $
                      </span>
                      <input
                        type="text"
                        value={formData.totalUsdMonthly}
                        onChange={(e) => handleChange("totalUsdMonthly", e.target.value)}
                        placeholder="500,000"
                        className="h-11 w-full px-3 text-sm outline-none"
                      />
                    </div>
                    {fieldErrors.totalUsdMonthly && (
                      <span className="text-[11px] text-red-500 font-medium">{fieldErrors.totalUsdMonthly}</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <h3 className="text-sm font-bold text-[#0f172a]">Monthly investment activity</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-[#0f172a]">
                        Total amount you expect to deposit into investments
                      </label>
                      <div className="flex items-center rounded-xl border border-[var(--color-stroke)] overflow-hidden focus-within:border-[var(--color-brand)]">
                        <span className="px-3 text-sm text-[#64748b] bg-[#f8fafc] border-r border-[var(--color-stroke)] py-2.5">
                          $
                        </span>
                        <input
                          type="text"
                          value={formData.depositInvestmentsAmount}
                          onChange={(e) => handleChange("depositInvestmentsAmount", e.target.value)}
                          placeholder=""
                          className="h-11 w-full px-3 text-sm outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-[#0f172a]">
                        Total amount you expect to withdraw from investments
                      </label>
                      <div className="flex items-center rounded-xl border border-[var(--color-stroke)] overflow-hidden focus-within:border-[var(--color-brand)]">
                        <span className="px-3 text-sm text-[#64748b] bg-[#f8fafc] border-r border-[var(--color-stroke)] py-2.5">
                          $
                        </span>
                        <input
                          type="text"
                          value={formData.withdrawInvestmentsAmount}
                          onChange={(e) => handleChange("withdrawInvestmentsAmount", e.target.value)}
                          placeholder=""
                          className="h-11 w-full px-3 text-sm outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-[#0f172a]">
                        Total amount you expect to deposit into crypto investments
                      </label>
                      <div className="flex items-center rounded-xl border border-[var(--color-stroke)] overflow-hidden focus-within:border-[var(--color-brand)]">
                        <span className="px-3 text-sm text-[#64748b] bg-[#f8fafc] border-r border-[var(--color-stroke)] py-2.5">
                          $
                        </span>
                        <input
                          type="text"
                          value={formData.depositCryptoInvestmentsAmount}
                          onChange={(e) => handleChange("depositCryptoInvestmentsAmount", e.target.value)}
                          placeholder=""
                          className="h-11 w-full px-3 text-sm outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-[#0f172a]">
                        Total amount you expect to withdraw from crypto investments
                      </label>
                      <div className="flex items-center rounded-xl border border-[var(--color-stroke)] overflow-hidden focus-within:border-[var(--color-brand)]">
                        <span className="px-3 text-sm text-[#64748b] bg-[#f8fafc] border-r border-[var(--color-stroke)] py-2.5">
                          $
                        </span>
                        <input
                          type="text"
                          value={formData.withdrawCryptoInvestmentsAmount}
                          onChange={(e) => handleChange("withdrawCryptoInvestmentsAmount", e.target.value)}
                          placeholder=""
                          className="h-11 w-full px-3 text-sm outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: COUNTERPARTIES */}
            {currentStep === 6 && (
              <div className="flex flex-col gap-5">
                <p className="text-xs text-[#64748b]">
                  Types of counterparties your business interacts with. Select at least one option that applies. <span className="text-red-500">*</span>
                </p>
                {fieldErrors.selectedCounterparties && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-600">
                    {fieldErrors.selectedCounterparties}
                  </div>
                )}

                <div className="flex flex-col gap-3 pt-2">
                  {COUNTERPARTY_OPTIONS.map((cp) => (
                    <label key={cp.value} className="flex items-center gap-3 cursor-pointer text-xs text-[#0f172a] select-none hover:opacity-80">
                      <input
                        type="checkbox"
                        checked={selectedCounterparties.includes(cp.value)}
                        onChange={() => {
                          toggleItem(selectedCounterparties, cp.value, setSelectedCounterparties);
                          if (fieldErrors.selectedCounterparties) {
                            setFieldErrors((prev) => {
                              const copy = { ...prev };
                              delete copy.selectedCounterparties;
                              return copy;
                            });
                          }
                        }}
                        className="rounded border-[var(--color-stroke)] text-[var(--color-brand)] focus:ring-0"
                      />
                      <span>{cp.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 7: PEOPLE */}
            {currentStep === 7 && (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-1.5 text-xs text-[#64748b] leading-relaxed">
                  <p>Beneficial owners and control persons. At submit time the platform requires:</p>
                  <ul className="list-disc list-inside space-y-1 pl-1">
                    <li><span className="text-red-500">*</span> At least one person with the <span className="font-semibold text-[#0f172a]">Beneficial owner</span> role</li>
                    <li><span className="text-red-500">*</span> At least one signer and one Has-control person</li>
                    <li><span className="text-red-500">*</span> A government ID for every person (type, number, issuing country, and a front-image upload)</li>
                    <li>Beneficial-owner ownership percentages must sum to no more than 100. Sums under 100 are fine; the residual represents holders below the disclosure threshold.</li>
                  </ul>
                </div>

                {fieldErrors.associatedPersons && (
                  <span className="text-[11px] text-red-500 font-medium">{fieldErrors.associatedPersons}</span>
                )}
                {fieldErrors.beneficial_owner_required && (
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                    <span>{fieldErrors.beneficial_owner_required}</span>
                  </div>
                )}
                {fieldErrors.control_person_required && (
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                    <span>{fieldErrors.control_person_required}</span>
                  </div>
                )}
                {fieldErrors.authorized_signer_required && (
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                    <span>{fieldErrors.authorized_signer_required}</span>
                  </div>
                )}
                {fieldErrors.ownership_total && (
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                    <span>{fieldErrors.ownership_total}</span>
                  </div>
                )}

                {associatedPersons.length === 0 ? (
                  <div className="flex items-center justify-center p-8 rounded-xl border border-dashed border-[var(--color-stroke)] text-sm text-[#64748b]">
                    No people added yet.
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {associatedPersons.map((person, idx) => {
                      const personErrors: Record<string, string> = {};
                      const prefix = `associatedPersons.${idx}.`;
                      Object.keys(fieldErrors).forEach((key) => {
                        if (key.startsWith(prefix)) {
                          const fieldName = key.slice(prefix.length);
                          personErrors[fieldName] = fieldErrors[key];
                        }
                      });

                      return (
                        <PersonForm
                          key={person.personRef || idx}
                          index={idx}
                          person={person}
                          errors={personErrors}
                          onUploadDoc={handleUploadPersonDocument}
                          onDeleteDoc={handleDeletePersonDocument}
                          uploadingDocs={uploadingDocs}
                          uploadedDocs={uploadedDocs}
                          onChange={(updatedPerson) => {
                            const list = associatedPersons.map((p, i) => (i === idx ? updatedPerson : p));
                            setAssociatedPersons(list);
                          }}
                          onRemove={() => {
                            setAssociatedPersons(associatedPersons.filter((_, i) => i !== idx));
                          }}
                          canRemove={true}
                        />
                      );
                    })}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const newRef = generateUUID();
                      setAssociatedPersons([
                        ...associatedPersons,
                        {
                          personRef: newRef,
                          firstName: "",
                          middleName: "",
                          lastName: "",
                          dateOfBirth: "",
                          email: businessData?.email || "",
                          phoneCountryCode: "",
                          phone: "",
                          taxId: "",
                          nationality: "",
                          citizenship: "",
                          ownershipPercent: "",
                          title: "",
                          relationshipEstablishedAt: "",
                          roles: [],
                          addressLine1: "",
                          addressLine2: "",
                          country: "",
                          city: "",
                          stateRegion: "",
                          govIdKind: "",
                          govIdNumber: "",
                          govIdCountry: "",
                          docs: {
                            idFront: { file: null, isUploaded: false },
                            idBack: { file: null, isUploaded: false },
                            passport: { file: null, isUploaded: false },
                            selfie: { file: null, isUploaded: false },
                            proofOfAddress: { file: null, isUploaded: false },
                          },
                        },
                      ]);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#e2e8f0] hover:bg-[#cbd5e1] text-xs font-semibold text-[#0f172a] transition-all shadow-2xs"
                  >
                    + Add person
                  </button>
                </div>
              </div>
            )}

            {/* STEP 8: DOCUMENTS (Matching Images 1 - 5) */}
            {currentStep === 8 && (
              <div className="flex flex-col gap-6">
                {/* Header intro */}
                <div className="flex flex-col gap-1 text-xs text-[#64748b]">
                  <p>
                    Upload supporting documents for the organization entity. Required documents for standard onboarding are noted with an (*). The Seismic team may follow up to gather additional documents for enhanced onboarding.
                  </p>
                  <p>
                    Each document must be a PDF, JPEG, or PNG, 10 MB or smaller. Files outside those limits are rejected on upload.
                  </p>
                </div>

                {/* Banner box */}
                <div className="rounded-2xl border border-[var(--color-stroke)] bg-white p-5 flex flex-col gap-3 shadow-2xs">
                  <h4 className="text-sm font-bold text-[#0f172a]">
                    Why upload only one document per item?
                  </h4>
                  <p className="text-xs text-[#64748b] leading-relaxed">
                    Upload the single best file for each item. Each item is reviewed as one document during verification, so attaching several files to the same item slows your review down rather than speeding it up. If you genuinely need more to show the full picture, combine them into one PDF and upload that.
                  </p>
                  <p className="text-xs text-[#64748b] leading-relaxed">
                    The Other field is an exception to this rule. For this field, feel free to upload any documents that have been helpful for verification with your other service providers.
                  </p>
                </div>

                {/* Required docs validation error summary */}
                {Object.keys(fieldErrors).some((k) => k.startsWith("doc_")) && (
                  <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                    <span className="shrink-0 mt-0.5">⚠️</span>
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold">Required documents missing</span>
                      <ul className="list-disc list-inside flex flex-col gap-0.5">
                        {Object.entries(fieldErrors)
                          .filter(([k]) => k.startsWith("doc_"))
                          .map(([k, msg]) => (
                            <li key={k}>{msg}</li>
                          ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* REQUIRED DOCUMENTS */}
                <div className="flex flex-col gap-4">
                  {/* Card 1: Business Formation */}
                  <KybDocCard
                    docKey="business_formation"
                    title="Business Formation"
                    isRequired={true}
                    subtext="Filed formation document: could be articles of incorporation or a business registration certificate."
                    docState={documents.business_formation}
                    onFileSelect={(file) => handleDocFileChange("business_formation", file)}
                    onDelete={() => handleDocDelete("business_formation")}
                    onUpload={(f) => handleUploadDocument(f, "business_formation", "Business Formation")}
                    isUploading={uploadingDocs["business_formation"]}
                    isUploaded={uploadedDocs["business_formation"]}
                    error={fieldErrors["doc_business_formation"]}
                  />

                  {/* Card 2: Ownership Information */}
                  <KybDocCard
                    docKey="ownership_information"
                    title="Ownership Information"
                    isRequired={true}
                    subtext="A table listing all shareholders and their ownership percentages. Shareholders holding 25% or more must be listed by full legal name. Shareholders holding less than 25% may be grouped into named buckets (e.g. 'Team Members', 'Seed Investors', 'Unallocated Reserves'). If the entity is partially owned by other entities holding 25% or more, append an ownership table for those entities under the same guidelines, recursing until reaching natural beneficial owners. Percentages must sum to 100%. Must include a date and signature from a control person."
                    docState={documents.ownership_information}
                    onFileSelect={(file) => handleDocFileChange("ownership_information", file)}
                    onDelete={() => handleDocDelete("ownership_information")}
                    onUpload={(f) => handleUploadDocument(f, "ownership_information", "Ownership Information")}
                    isUploading={uploadingDocs["ownership_information"]}
                    isUploaded={uploadedDocs["ownership_information"]}
                    error={fieldErrors["doc_ownership_information"]}
                  />

                  {/* Card 3: Proof of Nature of Business */}
                  <KybDocCard
                    docKey="proof_of_nature_of_business"
                    title="Proof of Nature of Business"
                    isRequired={true}
                    subtext="Evidence showing your business generating income from the type of business activities claimed by your entity (e.g. invoices, executed agreements, etc.). If your business is pre-revenue and does not yet have invoices or customer agreements, please provide any alternative documentation demonstrating your business' preparations to operate (e.g. vendor or supplier agreement, business plan, etc)."
                    docState={documents.proof_of_nature_of_business}
                    onFileSelect={(file) => handleDocFileChange("proof_of_nature_of_business", file)}
                    onDelete={() => handleDocDelete("proof_of_nature_of_business")}
                    onUpload={(f) => handleUploadDocument(f, "proof_of_nature_of_business", "Proof of Nature of Business")}
                    isUploading={uploadingDocs["proof_of_nature_of_business"]}
                    isUploaded={uploadedDocs["proof_of_nature_of_business"]}
                    error={fieldErrors["doc_proof_of_nature_of_business"]}
                  />

                  {/* Card 4: Proof of Source of Funds * */}
                  <KybDocCard
                    docKey="proof_of_source_of_funds"
                    title="Proof of Source of Funds"
                    isRequired={true}
                    subtext="Anything that shows where your funds come from. These might be term sheets, parent-company holdings, sale-of-asset records, etc."
                    docState={documents.proof_of_source_of_funds}
                    onFileSelect={(file) => handleDocFileChange("proof_of_source_of_funds", file)}
                    onDelete={() => handleDocDelete("proof_of_source_of_funds")}
                    onUpload={(f) => handleUploadDocument(f, "proof_of_source_of_funds", "Proof of Source of Funds")}
                    isUploading={uploadingDocs["proof_of_source_of_funds"]}
                    isUploaded={uploadedDocs["proof_of_source_of_funds"]}
                    error={fieldErrors["doc_proof_of_source_of_funds"]}
                  />

                  {/* Card 5: Proof of Address * */}
                  <KybDocCard
                    docKey="proof_of_address"
                    title="Proof of Address"
                    isRequired={true}
                    subtext="Utility bill, government-issued letter, or residential lease in the legal entity's name. Issued in the last 90 days."
                    docState={documents.proof_of_address}
                    onFileSelect={(file) => handleDocFileChange("proof_of_address", file)}
                    onDelete={() => handleDocDelete("proof_of_address")}
                    onUpload={(f) => handleUploadDocument(f, "proof_of_address", "Proof of Address")}
                    isUploading={uploadingDocs["proof_of_address"]}
                    isUploaded={uploadedDocs["proof_of_address"]}
                    error={fieldErrors["doc_proof_of_address"]}
                  />

                  {/* Card 6: Tax Document */}
                  <KybDocCard
                    docKey="tax_document"
                    title="Tax Document"
                    isRequired={true}
                    subtext="Most recent return, EIN letter, or tax registration certificate."
                    docState={documents.tax_document}
                    onFileSelect={(file) => handleDocFileChange("tax_document", file)}
                    onDelete={() => handleDocDelete("tax_document")}
                    onUpload={(f) => handleUploadDocument(f, "tax_document", "Tax Document")}
                    isUploading={uploadingDocs["tax_document"]}
                    isUploaded={uploadedDocs["tax_document"]}
                    error={fieldErrors["doc_tax_document"]}
                  />
                </div>

                {/* OPTIONAL SUPPORTING DOCUMENTS SECTION */}
                <div className="flex flex-col gap-4 pt-4 border-t border-[var(--color-stroke)]">
                  <h4 className="text-xs font-bold text-[#64748b] tracking-wider uppercase">
                    OPTIONAL SUPPORTING DOCUMENTS
                  </h4>

                  {/* Card 6: Bank Statement */}
                  <KybDocCard
                    docKey="bank_statement"
                    title="Bank Statement"
                    isRequired={false}
                    subtext="Most recent statement for the operating account. Must be less than 90 days old. Optional, but supplying one alongside the required documents speeds up verification."
                    docState={documents.bank_statement}
                    onFileSelect={(file) => handleDocFileChange("bank_statement", file)}
                    onDelete={() => handleDocDelete("bank_statement")}
                    onUpload={(f) => handleUploadDocument(f, "bank_statement", "Bank Statement")}
                    isUploading={uploadingDocs["bank_statement"]}
                    isUploaded={uploadedDocs["bank_statement"]}
                  />

                  {/* Card 7: Articles of Incorporation */}
                  <KybDocCard
                    docKey="articles_of_incorporation"
                    title="Articles of Incorporation"
                    isRequired={false}
                    subtext="Upload here if your jurisdiction issues articles specifically, in addition to the Business Formation document."
                    docState={documents.articles_of_incorporation}
                    onFileSelect={(file) => handleDocFileChange("articles_of_incorporation", file)}
                    onDelete={() => handleDocDelete("articles_of_incorporation")}
                    onUpload={(f) => handleUploadDocument(f, "articles_of_incorporation", "Articles of Incorporation")}
                    isUploading={uploadingDocs["articles_of_incorporation"]}
                    isUploaded={uploadedDocs["articles_of_incorporation"]}
                  />

                  {/* Card 9: Memorandum of Association */}
                  <KybDocCard
                    docKey="memorandum_of_association"
                    title="Memorandum of Association"
                    isRequired={false}
                    subtext="Common-law / Commonwealth jurisdictions only (UK, IE, IN, SG, HK, AU, NZ, ...). US Delaware C-corps and most EU entities don't have one. Skip if it doesn't exist for your jurisdiction."
                    docState={documents.memorandum_of_association}
                    onFileSelect={(file) => handleDocFileChange("memorandum_of_association", file)}
                    onDelete={() => handleDocDelete("memorandum_of_association")}
                    onUpload={(f) => handleUploadDocument(f, "memorandum_of_association", "Memorandum of Association")}
                    isUploading={uploadingDocs["memorandum_of_association"]}
                    isUploaded={uploadedDocs["memorandum_of_association"]}
                  />

                  {/* Card 10: Flow of Funds */}
                  <KybDocCard
                    docKey="flow_of_funds"
                    title="Flow of Funds"
                    isRequired={false}
                    subtext="Diagram or memo describing how funds move through your business."
                    docState={documents.flow_of_funds}
                    onFileSelect={(file) => handleDocFileChange("flow_of_funds", file)}
                    onDelete={() => handleDocDelete("flow_of_funds")}
                    onUpload={(f) => handleUploadDocument(f, "flow_of_funds", "Flow of Funds")}
                    isUploading={uploadingDocs["flow_of_funds"]}
                    isUploaded={uploadedDocs["flow_of_funds"]}
                  />

                  {/* Card 11: Compliance Screening */}
                  <KybDocCard
                    docKey="compliance_screening"
                    title="Compliance Screening"
                    isRequired={false}
                    subtext="AML / sanctions screening output, if you run one internally."
                    docState={documents.compliance_screening}
                    onFileSelect={(file) => handleDocFileChange("compliance_screening", file)}
                    onDelete={() => handleDocDelete("compliance_screening")}
                    onUpload={(f) => handleUploadDocument(f, "compliance_screening", "Compliance Screening")}
                    isUploading={uploadingDocs["compliance_screening"]}
                    isUploaded={uploadedDocs["compliance_screening"]}
                  />

                  {/* Card 12: Shareholder Register */}
                  <KybDocCard
                    docKey="shareholder_register"
                    title="Shareholder Register"
                    isRequired={false}
                    subtext="Official ledger or register of shareholders for the entity."
                    docState={documents.shareholder_register}
                    onFileSelect={(file) => handleDocFileChange("shareholder_register", file)}
                    onDelete={() => handleDocDelete("shareholder_register")}
                    onUpload={(f) => handleUploadDocument(f, "shareholder_register", "Shareholder Register")}
                    isUploading={uploadingDocs["shareholder_register"]}
                    isUploaded={uploadedDocs["shareholder_register"]}
                  />

                  {/* Card 13: Licensed Vendors Attestation */}
                  <KybDocCard
                    docKey="licensed_vendors_attestation"
                    title="Licensed Vendors Attestation"
                    isRequired={false}
                    subtext="Signed attestation regarding licensed third-party vendors or payment intermediaries."
                    docState={documents.licensed_vendors_attestation}
                    onFileSelect={(file) => handleDocFileChange("licensed_vendors_attestation", file)}
                    onDelete={() => handleDocDelete("licensed_vendors_attestation")}
                    onUpload={(f) => handleUploadDocument(f, "licensed_vendors_attestation", "Licensed Vendors Attestation")}
                    isUploading={uploadingDocs["licensed_vendors_attestation"]}
                    isUploaded={uploadedDocs["licensed_vendors_attestation"]}
                  />

                  {/* Card 14: Proof of Licensure */}
                  <KybDocCard
                    docKey="proof_of_licensure"
                    title="Proof of Licensure"
                    isRequired={false}
                    subtext="Regulatory license certificate or proof of registration for regulated entities."
                    docState={documents.proof_of_licensure}
                    onFileSelect={(file) => handleDocFileChange("proof_of_licensure", file)}
                    onDelete={() => handleDocDelete("proof_of_licensure")}
                    onUpload={(f) => handleUploadDocument(f, "proof_of_licensure", "Proof of Licensure")}
                    isUploading={uploadingDocs["proof_of_licensure"]}
                    isUploaded={uploadedDocs["proof_of_licensure"]}
                  />
                </div>

                {/* OTHER SUPPORTING DOCUMENTS SECTION (Matching Image 5) */}
                <div className="flex flex-col gap-4 pt-4 border-t border-[var(--color-stroke)]">
                  <h4 className="text-xs font-bold text-[#64748b] tracking-wider uppercase">
                    OTHER SUPPORTING DOCUMENTS
                  </h4>

                  <div className="rounded-2xl border border-[var(--color-stroke)] bg-white p-5 flex flex-col gap-4 shadow-2xs">
                    <p className="text-xs text-[#64748b] leading-relaxed">
                      Attach anything else that helps verify your business. Add as many as you like; each needs a short description so our reviewers can place it. Choose a file and describe it in either order, then add it.
                    </p>

                    <FileUploadDropzone
                      file={otherDocFile}
                      onFileSelect={setOtherDocFile}
                      label="Drag and drop a file here"
                      sublabel="...or click to choose. Up to 5 MB. Accepted: PDF, JPEG, or PNG."
                      onError={(msg) => toast.error(msg)}
                    />

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-[#0f172a]">
                        Description
                      </label>
                      <input
                        type="text"
                        value={otherDocDesc}
                        onChange={(e) => setOtherDocDesc(e.target.value)}
                        placeholder="e.g. Verification approval from another provider"
                        className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm outline-none focus:border-[var(--color-brand)]"
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={async () => {
                          if (!otherDocFile || !otherDocDesc.trim()) {
                            toast.error("Please select a file and add a description before adding.");
                            return;
                          }
                          const kind = "other";
                          setUploadingDocs((prev) => ({ ...prev, [kind]: true }));
                          try {
                            const activeCustomerId = businessData?.customerId;
                            const activeEmail = businessData?.email || formData.email;
                            const fd = new FormData();
                            if (activeEmail) fd.append("email", activeEmail);
                            fd.append("kind", kind);
                            fd.append("description", otherDocDesc.trim());
                            fd.append("file", otherDocFile);
                            await uploadDocument(fd, activeCustomerId, activeEmail);
                            setOtherDocsList([...otherDocsList, { name: otherDocFile.name, desc: otherDocDesc }]);
                            toast.success(`Other document "${otherDocFile.name}" uploaded successfully!`);
                            setOtherDocDesc("");
                            setOtherDocFile(null);
                          } catch (err: any) {
                            toast.error(err?.message || "Failed to upload other document. Please try again.");
                          } finally {
                            setUploadingDocs((prev) => ({ ...prev, [kind]: false }));
                          }
                        }}
                        disabled={uploadingDocs["other"]}
                        className="px-5 py-2.5 rounded-full bg-[#9c7b8c] hover:bg-[var(--color-brand)] text-white text-xs font-semibold transition-all shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {uploadingDocs["other"] ? "Uploading..." : "Add document"}
                      </button>
                    </div>

                    {otherDocsList.length > 0 && (
                      <div className="flex flex-col gap-2 pt-2">
                        {otherDocsList.map((item, i) => (
                          <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#f8fafc] border border-[var(--color-stroke)] text-xs">
                            <div>
                              <span className="font-semibold text-[#0f172a]">{item.name}</span>
                              <span className="text-[#64748b] ml-2">— {item.desc}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setOtherDocsList(otherDocsList.filter((_, idx) => idx !== i))}
                              className="text-red-500 hover:underline font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 9: REVIEW & SUBMIT */}
            {currentStep === 9 && (
              <div className="flex flex-col gap-6">
                <p className="text-xs text-[#64748b] leading-relaxed">
                  Once you submit, verification begins. You'll receive a secure link to finish any remaining document uploads.
                </p>

                {/* Box 1: Attestations */}
                <div className="relative rounded-2xl border border-[var(--color-stroke)] bg-white p-5 flex flex-col gap-3 shadow-2xs">
                  <legend className="absolute -top-3 left-4 px-2 text-xs font-bold text-[#0f172a] bg-white">
                    Attestations
                  </legend>
                  <div className="pt-1 flex flex-col gap-3">
                    <label className="flex items-center gap-3 cursor-pointer select-none text-xs text-[#0f172a] hover:opacity-80">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => {
                          setAgreeTerms(e.target.checked);
                          if (fieldErrors.agreeTerms) {
                            setFieldErrors((prev) => {
                              const copy = { ...prev };
                              delete copy.agreeTerms;
                              return copy;
                            });
                          }
                        }}
                        className="rounded border-[var(--color-stroke)] text-[var(--color-brand)] focus:ring-0"
                      />
                      <span>I accept the platform's terms and conditions.</span>
                    </label>
                    {fieldErrors.agreeTerms && (
                      <span className="text-[11px] text-red-500 font-medium">{fieldErrors.agreeTerms}</span>
                    )}

                    <label className="flex items-center gap-3 cursor-pointer select-none text-xs text-[#0f172a] hover:opacity-80">
                      <input
                        type="checkbox"
                        checked={agreeAccurate}
                        onChange={(e) => {
                          setAgreeAccurate(e.target.checked);
                          if (fieldErrors.agreeAccurate) {
                            setFieldErrors((prev) => {
                              const copy = { ...prev };
                              delete copy.agreeAccurate;
                              return copy;
                            });
                          }
                        }}
                        className="rounded border-[var(--color-stroke)] text-[var(--color-brand)] focus:ring-0"
                      />
                      <span>I attest the submitted information is accurate.</span>
                    </label>
                    {fieldErrors.agreeAccurate && (
                      <span className="text-[11px] text-red-500 font-medium">{fieldErrors.agreeAccurate}</span>
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
                        className="rounded border-[var(--color-stroke)] text-[var(--color-brand)] focus:ring-0"
                      />
                      <span>Enable USD virtual account capabilities.</span>
                    </label>

                    <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 leading-relaxed font-medium">
                      Enabling USD capabilities will not lead to auto-approval of your KYB per our partner guidelines.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Action Bar matching Image 5 */}
            <div className="flex items-center justify-between pt-6 border-t border-[var(--color-stroke)] mt-2">
              <button
                type="button"
                onClick={() => {
                  if (currentStep > 1) setCurrentStep((prev) => prev - 1);
                  else if (onBack) onBack();
                }}
                className="text-xs cursor-pointer font-semibold text-[#0f172a] hover:opacity-80 transition-opacity"
              >
                Back
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isSaving || isLoadingBusReqs || (currentStep === 9 && (!agreeTerms || !agreeAccurate))}
                  className="cursor-pointer px-6 py-2.5 rounded-full bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white text-xs font-semibold transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[var(--color-brand)] flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : isLoadingBusReqs ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Please wait...</span>
                    </>
                  ) : currentStep === 9 ? (
                    "Submit KYB"
                  ) : (
                    "Save & next"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KybDocCard({
  docKey,
  title,
  isRequired,
  subtext,
  docState,
  onFileSelect,
  onDelete,
  onUpload,
  isUploading = false,
  isUploaded = false,
  error,
}: {
  docKey: string;
  title: string;
  isRequired: boolean;
  subtext: string;
  docState: DocState;
  onFileSelect: (f: File | null) => void;
  onDelete: () => void;
  onUpload?: (f: File) => void;
  isUploading?: boolean;
  isUploaded?: boolean;
  error?: string;
}) {
  const uploaded = isUploaded || docState.isUploaded;
  return (
    <div className="rounded-2xl border border-[var(--color-stroke)] bg-white p-5 flex flex-col gap-3 shadow-2xs">
      <div className="flex items-center justify-between gap-4">
        <h4 className="text-sm font-bold text-[#0f172a]">
          {title} {isRequired && <span className="text-red-500">*</span>}
        </h4>

        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
            isUploading
              ? "bg-[#eff6ff] text-[var(--color-brand)] border-[#bfdbfe]"
              : uploaded
              ? "bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]"
              : "bg-[#f8fafc] text-[#64748b] border-[var(--color-stroke)]"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isUploading ? "bg-blue-400 animate-pulse" : uploaded ? "bg-green-500" : "bg-gray-400"
            }`}
          />
          {isUploading ? "Uploading..." : uploaded ? "Uploaded" : "Not uploaded"}
        </span>
      </div>

      <p className="text-xs text-[#64748b] leading-relaxed">{subtext}</p>

      {/* FileUploadDropzone — same component as KYC */}
      <FileUploadDropzone
        file={docState.file}
        onFileSelect={onFileSelect}
        onUpload={onUpload}
        onRemove={onDelete}
        isUploading={isUploading}
        isUploaded={uploaded}
        label={uploaded ? `Replace ${title}` : `Drag and drop a file here`}
        sublabel="...or click to choose. Up to 5 MB. Accepted: PDF, JPEG, or PNG."
      />
      {error && (
        <span className="text-[11px] text-red-500 font-medium flex items-center gap-1">
          <span>⚠</span> {error}
        </span>
      )}
    </div>
  );
}

function IndustryCombobox({
  value,
  onChange,
  options,
  isLoading,
}: {
  value: string;
  onChange: (val: string) => void;
  options: Array<{ code: string; title: string }>;
  isLoading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.trim().toLowerCase();
    return options.filter(
      (opt) =>
        opt.code.toLowerCase().includes(q) ||
        opt.title.toLowerCase().includes(q) ||
        `${opt.code} - ${opt.title}`.toLowerCase().includes(q)
    );
  }, [options, search]);

  const selectedItem = useMemo(() => {
    if (!value) return null;
    return options.find(
      (opt) => opt.code === value || `${opt.code} - ${opt.title}` === value
    );
  }, [options, value]);

  const displayTriggerText = selectedItem
    ? `${selectedItem.code} - ${selectedItem.title}`
    : value || (isLoading ? "Loading industries..." : "Select industry (NAICS code)...");

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setSearch("");
      }}
    >
      <PopoverTrigger
        type="button"
        disabled={isLoading}
        className="h-11 w-full rounded-xl border border-[var(--color-stroke)] px-3 text-sm flex items-center justify-between outline-none bg-white hover:bg-slate-50 focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className={`truncate mr-2 text-xs ${selectedItem || value ? "text-[#0f172a] font-medium" : "text-[#94a3b8]"}`}>
          {displayTriggerText}
        </span>
        <ChevronsUpDown size={16} className="text-[#94a3b8] shrink-0" />
      </PopoverTrigger>
      <PopoverContent className="w-[350px] sm:w-[450px] p-0 z-[100]" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search code or keyword..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="px-3 py-3 text-xs text-slate-500 text-center">Loading NAICS codes...</div>
            ) : filteredOptions.length === 0 ? (
              <CommandEmpty>No industry found matching "{search}"</CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredOptions.map((ind) => {
                  const label = `${ind.code} - ${ind.title}`;
                  const isSelected = value === label || value === ind.code;
                  return (
                    <CommandItem
                      key={ind.code}
                      value={ind.code}
                      onSelect={() => {
                        onChange(ind.code);
                        setOpen(false);
                        setSearch("");
                      }}
                      className="flex items-center justify-between text-xs cursor-pointer"
                    >
                      <span className="truncate pr-2">
                        <span className="font-bold mr-1.5">{ind.code}</span>
                        <span className="font-normal text-slate-600">{ind.title}</span>
                      </span>
                      {isSelected && <Check size={14} className="text-[var(--color-brand)] shrink-0 ml-2" />}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
