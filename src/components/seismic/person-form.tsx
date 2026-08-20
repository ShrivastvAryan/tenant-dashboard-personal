"use client";

import React from "react";
import { X, Check, Loader2 } from "lucide-react";
import { ALLOWED_COUNTRIES } from "@/lib/countries";
import { CountryCombobox } from "@/components/CountryCombobox";
import {
  GOV_ID_KIND_OPTIONS,
  ASSOCIATED_PERSON_ROLE_OPTIONS,
} from "@/lib/kybEnums";
import { FileUploadDropzone } from "./file-upload-dropzone";
import { getAddressRequirements, AddressRequirements } from "@/actions/seismic/individual";

export interface PersonDocState {
  file: File | null;
  uploadedName?: string;
  isUploaded: boolean;
}

export interface PersonFormData {
  personRef: string;
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phoneCountryCode: string;
  phone: string;
  taxId: string;
  nationality: string;
  citizenship: string;
  ownershipPercent: string;
  title: string;
  relationshipEstablishedAt: string;
  roles: string[];

  addressLine1: string;
  addressLine2: string;
  country: string;
  city: string;
  stateRegion: string;
  postalCode?: string;

  govIdKind: string;
  govIdNumber: string;
  govIdCountry: string;

  docs: {
    idFront: PersonDocState;
    idBack: PersonDocState;
    passport?: PersonDocState;
    selfie: PersonDocState;
    proofOfAddress: PersonDocState;
  };
}

interface PersonFormProps {
  index: number;
  person: PersonFormData;
  onChange: (updatedPerson: PersonFormData) => void;
  onRemove?: () => void;
  canRemove: boolean;
  errors?: Record<string, string>;
  onUploadDoc?: (personRef: string, file: File, kind: string, label: string) => Promise<void>;
  onDeleteDoc?: (personRef: string, kind: string) => void;
  uploadingDocs?: Record<string, boolean>;
  uploadedDocs?: Record<string, boolean>;
}

export function PersonForm({
  index,
  person,
  onChange,
  onRemove,
  canRemove,
  errors = {},
  onUploadDoc,
  onDeleteDoc,
  uploadingDocs = {},
  uploadedDocs = {},
}: PersonFormProps) {
  const [personReqs, setPersonReqs] = React.useState<AddressRequirements>({ country: "", state: "optional", postal_code: "optional" });
  const [isLoadingReqs, setIsLoadingReqs] = React.useState(false);

  React.useEffect(() => {
    if (person.country) {
      setIsLoadingReqs(true);
      getAddressRequirements(person.country)
        .then((reqs) => {
          if (reqs) setPersonReqs(reqs);
        })
        .finally(() => {
          setIsLoadingReqs(false);
        });
    } else {
      setPersonReqs({ country: "", state: "optional", postal_code: "optional" });
      setIsLoadingReqs(false);
    }
  }, [person.country]);
  function handleFieldChange(field: string, value: any) {
    const cleanedValue = (field === "postalCode" || field === "mailingPostalCode" || field === "postCode") && typeof value === "string" ? value.replace(/\D/g, "") : value;
    onChange({
      ...person,
      [field]: cleanedValue,
    });
  }

  function handleRoleToggle(roleValue: string) {
    const currentRoles = person.roles || [];
    const newRoles = currentRoles.includes(roleValue)
      ? currentRoles.filter((r) => r !== roleValue)
      : [...currentRoles, roleValue];
    handleFieldChange("roles", newRoles);
  }

  function handleDocFileChange(docKey: "idFront" | "idBack" | "passport" | "selfie" | "proofOfAddress", file: File | null) {
    onChange({
      ...person,
      docs: {
        ...person.docs,
        [docKey]: {
          file,
          uploadedName: file ? file.name : undefined,
          isUploaded: !!file,
        },
      },
    });
  }

  return (
    <div className="flex flex-col gap-6 p-6 rounded-2xl border border-[var(--color-stroke)] bg-white shadow-2xs">
      {/* Header with Person number and Remove button */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-[#0f172a]">Person {index + 1}</h3>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs font-semibold text-red-500 hover:text-red-600 hover:underline transition-colors"
          >
            Remove
          </button>
        )}
      </div>

      {/* Row 1: First name, Middle name, Last name */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#0f172a]">
            First name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={person.firstName}
            onChange={(e) => handleFieldChange("firstName", e.target.value)}
            className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
              errors.firstName
                ? "border-red-500 focus:border-red-500"
                : "border-[var(--color-stroke)] focus:border-[var(--color-brand)]"
            }`}
          />
          {errors.firstName && (
            <span className="text-[11px] text-red-500 font-medium">{errors.firstName}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#0f172a]">
            Middle name
          </label>
          <input
            type="text"
            value={person.middleName}
            onChange={(e) => handleFieldChange("middleName", e.target.value)}
            className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
              errors.middleName
                ? "border-red-500 focus:border-red-500"
                : "border-[var(--color-stroke)] focus:border-[var(--color-brand)]"
            }`}
          />
          {errors.middleName && (
            <span className="text-[11px] text-red-500 font-medium">{errors.middleName}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#0f172a]">
            Last name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={person.lastName}
            onChange={(e) => handleFieldChange("lastName", e.target.value)}
            className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
              errors.lastName
                ? "border-red-500 focus:border-red-500"
                : "border-[var(--color-stroke)] focus:border-[var(--color-brand)]"
            }`}
          />
          {errors.lastName && (
            <span className="text-[11px] text-red-500 font-medium">{errors.lastName}</span>
          )}
        </div>
      </div>

      {/* Row 2: Date of birth, Email */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#0f172a]">
            Date of birth <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={person.dateOfBirth}
            onChange={(e) => handleFieldChange("dateOfBirth", e.target.value)}
            placeholder="YYYY - MM - DD"
            className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
              errors.dateOfBirth
                ? "border-red-500 focus:border-red-500"
                : "border-[var(--color-stroke)] focus:border-[var(--color-brand)]"
            }`}
          />
          {errors.dateOfBirth && (
            <span className="text-[11px] text-red-500 font-medium">{errors.dateOfBirth}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#0f172a]">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={person.email}
            onChange={(e) => handleFieldChange("email", e.target.value)}
            className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
              errors.email
                ? "border-red-500 focus:border-red-500"
                : "border-[var(--color-stroke)] focus:border-[var(--color-brand)]"
            }`}
          />
          {errors.email && (
            <span className="text-[11px] text-red-500 font-medium">{errors.email}</span>
          )}
        </div>
      </div>

      {/* Row 3: Phone country, Phone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#0f172a]">
            Phone country <span className="text-red-500">*</span>
          </label>
          <CountryCombobox
            value={person.phoneCountryCode}
            onChange={(val) => handleFieldChange("phoneCountryCode", val)}
            placeholder="Select phone country..."
            className={errors.phoneCountryCode ? "border-red-500" : ""}
          />
          {errors.phoneCountryCode && (
            <span className="text-[11px] text-red-500 font-medium">{errors.phoneCountryCode}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#0f172a]">
            Phone <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={person.phone}
            onChange={(e) => handleFieldChange("phone", e.target.value)}
            placeholder="2025550100"
            className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
              errors.phone
                ? "border-red-500 focus:border-red-500"
                : "border-[var(--color-stroke)] focus:border-[var(--color-brand)]"
            }`}
          />
          {errors.phone ? (
            <span className="text-[11px] text-red-500 font-medium">{errors.phone}</span>
          ) : (
            <span className="text-[11px] text-[#64748b]">Enter your number without the country code</span>
          )}
        </div>
      </div>

      {/* Row 4: Tax ID, Nationality, Citizenship */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#0f172a]">
            Tax ID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={person.taxId}
            onChange={(e) => handleFieldChange("taxId", e.target.value)}
            className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
              errors.taxId
                ? "border-red-500 focus:border-red-500"
                : "border-[var(--color-stroke)] focus:border-[var(--color-brand)]"
            }`}
          />
          {errors.taxId && (
            <span className="text-[11px] text-red-500 font-medium">{errors.taxId}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#0f172a]">
            Nationality <span className="text-red-500">*</span>
          </label>
          <CountryCombobox
            value={person.nationality}
            onChange={(val) => handleFieldChange("nationality", val)}
            placeholder="Select nationality..."
            className={errors.nationality ? "border-red-500" : ""}
          />
          {errors.nationality && (
            <span className="text-[11px] text-red-500 font-medium">{errors.nationality}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#0f172a]">
            Citizenship <span className="text-red-500">*</span>
          </label>
          <CountryCombobox
            value={person.citizenship}
            onChange={(val) => handleFieldChange("citizenship", val)}
            placeholder="Select citizenship..."
            className={errors.citizenship ? "border-red-500" : ""}
          />
          {errors.citizenship && (
            <span className="text-[11px] text-red-500 font-medium">{errors.citizenship}</span>
          )}
        </div>
      </div>

      {/* Row 5: Ownership percent, Title, Relationship started */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#0f172a]">
            Ownership percent (0-100) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={person.ownershipPercent}
            onChange={(e) => handleFieldChange("ownershipPercent", e.target.value)}
            placeholder="51"
            className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
              errors.ownershipPercent
                ? "border-red-500 focus:border-red-500"
                : "border-[var(--color-stroke)] focus:border-[var(--color-brand)]"
            }`}
          />
          {errors.ownershipPercent && (
            <span className="text-[11px] text-red-500 font-medium">{errors.ownershipPercent}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#0f172a]">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={person.title}
            onChange={(e) => handleFieldChange("title", e.target.value)}
            placeholder="CEO"
            className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
              errors.title
                ? "border-red-500 focus:border-red-500"
                : "border-[var(--color-stroke)] focus:border-[var(--color-brand)]"
            }`}
          />
          {errors.title && (
            <span className="text-[11px] text-red-500 font-medium">{errors.title}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#0f172a]">
            Relationship started <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={person.relationshipEstablishedAt}
            onChange={(e) => handleFieldChange("relationshipEstablishedAt", e.target.value)}
            placeholder="YYYY - MM - DD"
            className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
              errors.relationshipEstablishedAt
                ? "border-red-500 focus:border-red-500"
                : "border-[var(--color-stroke)] focus:border-[var(--color-brand)]"
            }`}
          />
          {errors.relationshipEstablishedAt && (
            <span className="text-[11px] text-red-500 font-medium">{errors.relationshipEstablishedAt}</span>
          )}
        </div>
      </div>

      {/* Roles Checkboxes */}
      <div className="flex flex-col gap-1.5 pt-1">
        <div className="flex flex-wrap gap-4">
          {ASSOCIATED_PERSON_ROLE_OPTIONS.map((roleOpt) => {
            const isChecked = (person.roles || []).includes(roleOpt.value);
            const displayLabel =
              roleOpt.value === "beneficial_owner"
                ? "Beneficial owner (≥25%)"
                : roleOpt.value === "officer"
                ? "Officer (CEO, CFO, etc.)"
                : roleOpt.label;

            return (
              <label key={roleOpt.value} className="flex items-center gap-2 cursor-pointer text-xs text-[#0f172a] select-none hover:opacity-80">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleRoleToggle(roleOpt.value)}
                  className="rounded border-[var(--color-stroke)] text-[var(--color-brand)] focus:ring-0"
                />
                <span>{displayLabel}</span>
              </label>
            );
          })}
        </div>
        {errors.roles && (
          <span className="text-[11px] text-red-500 font-medium">{errors.roles}</span>
        )}
      </div>

      {/* Address Section */}
      <div className="flex flex-col gap-4 pt-4 border-t border-[var(--color-stroke)]">
        <h4 className="text-sm font-bold text-[#0f172a]">Address</h4>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#0f172a]">
            Address line 1 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={person.addressLine1}
            onChange={(e) => handleFieldChange("addressLine1", e.target.value)}
            placeholder="1 Wall St"
            className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
              errors.addressLine1
                ? "border-red-500 focus:border-red-500"
                : "border-[var(--color-stroke)] focus:border-[var(--color-brand)]"
            }`}
          />
          {errors.addressLine1 && (
            <span className="text-[11px] text-red-500 font-medium">{errors.addressLine1}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-[#0f172a]">
            Address line 2
          </label>
          <input
            type="text"
            value={person.addressLine2}
            onChange={(e) => handleFieldChange("addressLine2", e.target.value)}
            placeholder="Suite 200"
            className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
              errors.addressLine2
                ? "border-red-500 focus:border-red-500"
                : "border-[var(--color-stroke)] focus:border-[var(--color-brand)]"
            }`}
          />
          {errors.addressLine2 && (
            <span className="text-[11px] text-red-500 font-medium">{errors.addressLine2}</span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#0f172a]">
              Country <span className="text-red-500">*</span>
            </label>
            <CountryCombobox
              value={person.country}
              onChange={(val) => handleFieldChange("country", val)}
              placeholder="Select country..."
              className={errors.country ? "border-red-500" : ""}
            />
            {errors.country && (
              <span className="text-[11px] text-red-500 font-medium">{errors.country}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#0f172a]">
              City <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={person.city}
              onChange={(e) => handleFieldChange("city", e.target.value)}
              className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
                errors.city
                  ? "border-red-500 focus:border-red-500"
                  : "border-[var(--color-stroke)] focus:border-[var(--color-brand)]"
              }`}
            />
            {errors.city && (
              <span className="text-[11px] text-red-500 font-medium">{errors.city}</span>
            )}
          </div>
        </div>

        {isLoadingReqs ? (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 font-medium">
            <Loader2 className="w-4 h-4 animate-spin text-[#0f172a] shrink-0" />
            <span>Checking address requirements for selected country...</span>
          </div>
        ) : (
          (personReqs.state === "required" || personReqs.postal_code === "required") && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {personReqs.state === "required" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#0f172a]">
                    State / region <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={person.stateRegion}
                    onChange={(e) => handleFieldChange("stateRegion", e.target.value)}
                    placeholder="State, province, or region"
                    className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
                      errors.stateRegion
                        ? "border-red-500 focus:border-red-500"
                        : "border-[var(--color-stroke)] focus:border-[var(--color-brand)]"
                    }`}
                  />
                  {errors.stateRegion && (
                    <span className="text-[11px] text-red-500 font-medium">{errors.stateRegion}</span>
                  )}
                </div>
              )}

              {personReqs.postal_code === "required" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#0f172a]">
                    Postal code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={person.postalCode || ""}
                    onChange={(e) => handleFieldChange("postalCode", e.target.value.replace(/\D/g, ""))}
                    placeholder="Postal or ZIP code"
                    className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
                      errors.postalCode
                        ? "border-red-500 focus:border-red-500"
                        : "border-[var(--color-stroke)] focus:border-[var(--color-brand)]"
                    }`}
                  />
                  {errors.postalCode && (
                    <span className="text-[11px] text-red-500 font-medium">{errors.postalCode}</span>
                  )}
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* Government ID Section */}
      <div className="flex flex-col gap-4 pt-4 border-t border-[var(--color-stroke)]">
        <h4 className="text-sm font-bold text-[#0f172a]">Government ID</h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#0f172a]">
              ID type <span className="text-red-500">*</span>
            </label>
            <select
              value={person.govIdKind}
              onChange={(e) => handleFieldChange("govIdKind", e.target.value)}
              className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
                errors.govIdKind
                  ? "border-red-500 focus:border-red-500"
                  : "border-[var(--color-stroke)] focus:border-[var(--color-brand)]"
              }`}
            >
              <option value="">Select...</option>
              {GOV_ID_KIND_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.govIdKind && (
              <span className="text-[11px] text-red-500 font-medium">{errors.govIdKind}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#0f172a]">
              ID number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={person.govIdNumber}
              onChange={(e) => handleFieldChange("govIdNumber", e.target.value)}
              placeholder="e.g. D1234567"
              className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
                errors.govIdNumber
                  ? "border-red-500 focus:border-red-500"
                  : "border-[var(--color-stroke)] focus:border-[var(--color-brand)]"
              }`}
            />
            {errors.govIdNumber && (
              <span className="text-[11px] text-red-500 font-medium">{errors.govIdNumber}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#0f172a]">
              Issuing country <span className="text-red-500">*</span>
            </label>
            <CountryCombobox
              value={person.govIdCountry}
              onChange={(val) => handleFieldChange("govIdCountry", val)}
              placeholder="Select issuing country..."
              className={errors.govIdCountry ? "border-red-500" : ""}
            />
            {errors.govIdCountry && (
              <span className="text-[11px] text-red-500 font-medium">{errors.govIdCountry}</span>
            )}
          </div>
        </div>

        {person.govIdKind === "passport" ? (
          /* Passport Image Upload */
          <PersonDocDropzone
            title="Passport image"
            isRequired={true}
            subtext="Must be a photo of the data page of your valid passport with all four corners showing."
            docState={person.docs?.passport || person.docs?.idFront}
            error={errors["docs.passport"] || errors["docs.idFront"]}
            onFileSelect={(file) => handleDocFileChange("passport", file)}
            onUpload={onUploadDoc ? (f) => onUploadDoc(person.personRef, f, "passport", "Passport image") : undefined}
            onDelete={() => {
              handleDocFileChange("passport", null);
              if (onDeleteDoc) onDeleteDoc(person.personRef, "passport");
            }}
            isUploading={uploadingDocs[`${person.personRef}_passport`]}
            isUploaded={uploadedDocs[`${person.personRef}_passport`] || person.docs?.passport?.isUploaded}
          />
        ) : (
          <>
            {/* ID Front Image Upload */}
            <PersonDocDropzone
              title="ID front image"
              isRequired={true}
              subtext="Must be a photo of the original document with all four corners showing. Scans / photocopies are not accepted."
              docState={person.docs?.idFront}
              error={errors["docs.idFront"]}
              onFileSelect={(file) => handleDocFileChange("idFront", file)}
              onUpload={onUploadDoc ? (f) => onUploadDoc(person.personRef, f, "identity_card_front", "ID front image") : undefined}
              onDelete={() => {
                handleDocFileChange("idFront", null);
                if (onDeleteDoc) onDeleteDoc(person.personRef, "identity_card_front");
              }}
              isUploading={uploadingDocs[`${person.personRef}_identity_card_front`]}
              isUploaded={uploadedDocs[`${person.personRef}_identity_card_front`] || person.docs?.idFront?.isUploaded}
            />

            {/* ID Back Image Upload */}
            <PersonDocDropzone
              title="ID back image"
              isRequired={true}
              subtext="Must be a photo of the back of the original document with all four corners showing."
              docState={person.docs?.idBack}
              error={errors["docs.idBack"]}
              onFileSelect={(file) => handleDocFileChange("idBack", file)}
              onUpload={onUploadDoc ? (f) => onUploadDoc(person.personRef, f, "identity_card_back", "ID back image") : undefined}
              onDelete={() => {
                handleDocFileChange("idBack", null);
                if (onDeleteDoc) onDeleteDoc(person.personRef, "identity_card_back");
              }}
              isUploading={uploadingDocs[`${person.personRef}_identity_card_back`]}
              isUploaded={uploadedDocs[`${person.personRef}_identity_card_back`] || person.docs?.idBack?.isUploaded}
            />
          </>
        )}
      </div>

      {/* Additional Documents Section */}
      <div className="flex flex-col gap-4 pt-4 border-t border-[var(--color-stroke)]">
        <h4 className="text-sm font-bold text-[#0f172a]">Additional documents</h4>

        {/* Selfie Upload */}
        <PersonDocDropzone
          title="Selfie"
          isRequired={true}
          subtext="Must be a photo taken today on your own device."
          docState={person.docs?.selfie}
          error={errors["docs.selfie"]}
          onFileSelect={(file) => handleDocFileChange("selfie", file)}
          onUpload={onUploadDoc ? (f) => onUploadDoc(person.personRef, f, "selfie", "Selfie") : undefined}
          onDelete={() => {
            handleDocFileChange("selfie", null);
            if (onDeleteDoc) onDeleteDoc(person.personRef, "selfie");
          }}
          isUploading={uploadingDocs[`${person.personRef}_selfie`]}
          isUploaded={uploadedDocs[`${person.personRef}_selfie`] || person.docs?.selfie?.isUploaded}
        />

        {/* Proof of Address Upload */}
        <PersonDocDropzone
          title="Proof of address"
          isRequired={true}
          subtext="Must be a bank statement, utility bill, or rent payment dated within 90 days. If this is not available, we can also accept a residential lease agreement."
          docState={person.docs?.proofOfAddress}
          error={errors["docs.proofOfAddress"]}
          onFileSelect={(file) => handleDocFileChange("proofOfAddress", file)}
          onUpload={onUploadDoc ? (f) => onUploadDoc(person.personRef, f, "proof_of_address", "Proof of address") : undefined}
          onDelete={() => {
            handleDocFileChange("proofOfAddress", null);
            if (onDeleteDoc) onDeleteDoc(person.personRef, "proof_of_address");
          }}
          isUploading={uploadingDocs[`${person.personRef}_proof_of_address`]}
          isUploaded={uploadedDocs[`${person.personRef}_proof_of_address`] || person.docs?.proofOfAddress?.isUploaded}
        />
      </div>
    </div>
  );
}

function PersonDocDropzone({
  title,
  isRequired,
  subtext,
  docState,
  error,
  onFileSelect,
  onUpload,
  onDelete,
  isUploading = false,
  isUploaded = false,
}: {
  title: string;
  isRequired: boolean;
  subtext: string;
  docState?: PersonDocState;
  error?: string;
  onFileSelect: (f: File | null) => void;
  onUpload?: (f: File) => void;
  onDelete?: () => void;
  isUploading?: boolean;
  isUploaded?: boolean;
}) {
  const uploaded = isUploaded || Boolean(docState?.isUploaded);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <label className="text-xs font-medium text-[#0f172a]">
          {title} {isRequired && <span className="text-red-500">*</span>}
        </label>

        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
            isUploading
              ? "bg-[#eff6ff] text-[var(--color-brand)] border-[#bfdbfe]"
              : uploaded
              ? "bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]"
              : error
              ? "bg-red-50 text-red-600 border-red-200"
              : "bg-[#f8fafc] text-[#64748b] border-[var(--color-stroke)]"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isUploading ? "bg-blue-400 animate-pulse" : uploaded ? "bg-green-500" : error ? "bg-red-500" : "bg-gray-400"
            }`}
          />
          {isUploading ? "Uploading..." : uploaded ? "Uploaded" : "Not uploaded"}
        </span>
      </div>

      <p className="text-[11px] text-[#64748b] leading-relaxed">{subtext}</p>

      <FileUploadDropzone
        file={docState?.file || null}
        onFileSelect={onFileSelect}
        onUpload={onUpload}
        onRemove={onDelete}
        isUploading={isUploading}
        isUploaded={uploaded}
        label={uploaded ? `Replace ${title}` : `Drag and drop a file here`}
        sublabel="...or click to choose. Up to 5 MB. Accepted: PDF, JPEG, or PNG."
      />

      {error && (
        <span className="text-[11px] text-red-500 font-medium">{error}</span>
      )}
    </div>
  );
}
