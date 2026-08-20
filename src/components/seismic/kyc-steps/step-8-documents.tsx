"use client";

import React from "react";
import { CountryCombobox } from "@/components/CountryCombobox";
import { ID_DOCUMENT_TYPE_OPTIONS } from "@/lib/kycEnums";
import { FileUploadDropzone } from "../file-upload-dropzone";

interface Step8DocumentsProps {
  idType: string;
  setIdType: (val: string) => void;
  idNumber: string;
  setIdNumber: (val: string) => void;
  issuingCountry: string;
  setIssuingCountry: (val: string) => void;
  govtIdFrontFile: File | null;
  setGovtIdFrontFile: (file: File | null) => void;
  govtIdBackFile: File | null;
  setGovtIdBackFile: (file: File | null) => void;
  passportFile?: File | null;
  setPassportFile?: (file: File | null) => void;
  selfieFile: File | null;
  setSelfieFile: (file: File | null) => void;
  proofOfAddressFile: File | null;
  setProofOfAddressFile: (file: File | null) => void;
  uploadingDocs: Record<string, boolean>;
  uploadedDocs: Record<string, boolean>;
  setUploadedDocs: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  handleUploadDocument: (file: File, kind: string, label: string) => Promise<void>;
  fieldErrors: Record<string, string>;
  setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  showToast: (message: string, type?: "success" | "error") => void;
}

export function Step8Documents({
  idType,
  setIdType,
  idNumber,
  setIdNumber,
  issuingCountry,
  setIssuingCountry,
  govtIdFrontFile,
  setGovtIdFrontFile,
  govtIdBackFile,
  setGovtIdBackFile,
  passportFile = null,
  setPassportFile,
  selfieFile,
  setSelfieFile,
  proofOfAddressFile,
  setProofOfAddressFile,
  uploadingDocs,
  uploadedDocs,
  setUploadedDocs,
  handleUploadDocument,
  fieldErrors,
  setFieldErrors,
  showToast,
}: Step8DocumentsProps) {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-xs text-[#64748b] leading-relaxed">
        Government ID, selfie, and proof of address are required for verification. Files must be a PDF, JPEG, or PNG, 10 MB or smaller.
      </p>

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

      <div className="rounded-2xl border border-[var(--color-stroke)] bg-white p-5 flex flex-col gap-4 shadow-2xs">
        <h4 className="text-sm font-bold text-[#0f172a]">
          Government ID <span className="text-red-500">*</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#0f172a]">
              ID type <span className="text-red-500">*</span>
            </label>
            <select
              value={idType}
              onChange={(e) => {
                setIdType(e.target.value);
                if (fieldErrors.idType) setFieldErrors((prev) => ({ ...prev, idType: "" }));
              }}
              className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
                fieldErrors.idType
                  ? "border-red-500 focus:border-red-500"
                  : "border-[var(--color-stroke)] focus:border-kyc-primary"
              }`}
            >
              <option value="">Select...</option>
              {ID_DOCUMENT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {fieldErrors.idType && (
              <span className="text-[11px] text-red-500 font-medium">{fieldErrors.idType}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#0f172a]">
              ID number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={idNumber}
              onChange={(e) => {
                setIdNumber(e.target.value);
                if (fieldErrors.idNumber) setFieldErrors((prev) => ({ ...prev, idNumber: "" }));
              }}
              className={`h-11 w-full rounded-xl border px-3 text-sm outline-none ${
                fieldErrors.idNumber
                  ? "border-red-500 focus:border-red-500"
                  : "border-[var(--color-stroke)] focus:border-kyc-primary"
              }`}
            />
            {fieldErrors.idNumber && (
              <span className="text-[11px] text-red-500 font-medium">{fieldErrors.idNumber}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#0f172a]">
              Issuing country <span className="text-red-500">*</span>
            </label>
            <CountryCombobox
              value={issuingCountry}
              onChange={(val) => {
                setIssuingCountry(val);
                if (fieldErrors.issuingCountry) setFieldErrors((prev) => ({ ...prev, issuingCountry: "" }));
              }}
              placeholder="Select issuing country..."
              className={fieldErrors.issuingCountry ? "border-red-500" : ""}
            />
            {fieldErrors.issuingCountry && (
              <span className="text-[11px] text-red-500 font-medium">{fieldErrors.issuingCountry}</span>
            )}
          </div>
        </div>

        {!idType ? (
          <p className="text-xs text-[#64748b] mt-1">Pick an ID type above to enable image uploads.</p>
        ) : idType === "passport" ? (
          <div className="grid grid-cols-1 gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#0f172a]">
                Passport Image <span className="text-red-500">*</span>
              </label>
              <FileUploadDropzone
                file={passportFile}
                onFileSelect={(f) => {
                  if (setPassportFile) setPassportFile(f);
                  if (f && fieldErrors.hasPassport) setFieldErrors((prev) => ({ ...prev, hasPassport: "" }));
                }}
                onRemove={() => setUploadedDocs((prev) => ({ ...prev, passport: false }))}
                onUpload={(f) => handleUploadDocument(f, "passport", "Passport Image")}
                isUploading={uploadingDocs["passport"]}
                isUploaded={uploadedDocs["passport"]}
                onError={(msg) => showToast(msg, "error")}
              />
              {fieldErrors.hasPassport && (
                <span className="text-[11px] text-red-500 font-medium mt-1">{fieldErrors.hasPassport}</span>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#0f172a]">
                ID Front Image <span className="text-red-500">*</span>
              </label>
              <FileUploadDropzone
                file={govtIdFrontFile}
                onFileSelect={(f) => {
                  setGovtIdFrontFile(f);
                  if (f && fieldErrors.hasGovtIdFront) setFieldErrors((prev) => ({ ...prev, hasGovtIdFront: "" }));
                }}
                onRemove={() => setUploadedDocs((prev) => ({ ...prev, individual_government_id_front: false }))}
                onUpload={(f) => handleUploadDocument(f, "individual_government_id_front", "ID Front Image")}
                isUploading={uploadingDocs["individual_government_id_front"]}
                isUploaded={uploadedDocs["individual_government_id_front"]}
                onError={(msg) => showToast(msg, "error")}
              />
              {fieldErrors.hasGovtIdFront && (
                <span className="text-[11px] text-red-500 font-medium mt-1">{fieldErrors.hasGovtIdFront}</span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#0f172a]">
                ID Back Image <span className="text-red-500">*</span>
              </label>
              <FileUploadDropzone
                file={govtIdBackFile}
                onFileSelect={(f) => {
                  setGovtIdBackFile(f);
                  if (f && fieldErrors.hasGovtIdBack) setFieldErrors((prev) => ({ ...prev, hasGovtIdBack: "" }));
                }}
                onRemove={() => setUploadedDocs((prev) => ({ ...prev, individual_government_id_back: false }))}
                onUpload={(f) => handleUploadDocument(f, "individual_government_id_back", "ID Back Image")}
                isUploading={uploadingDocs["individual_government_id_back"]}
                isUploaded={uploadedDocs["individual_government_id_back"]}
                onError={(msg) => showToast(msg, "error")}
              />
              {fieldErrors.hasGovtIdBack && (
                <span className="text-[11px] text-red-500 font-medium mt-1">{fieldErrors.hasGovtIdBack}</span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-[var(--color-stroke)] bg-white p-5 flex flex-col gap-3 shadow-2xs">
        <div className="flex items-center justify-between gap-4">
          <h4 className="text-sm font-bold text-[#0f172a]">
            Selfie <span className="text-red-500">*</span>
          </h4>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-[#64748b] border border-[var(--color-stroke)] bg-[#f8fafc]">
            <span className={`h-1.5 w-1.5 rounded-full ${selfieFile || uploadedDocs["individual_selfie"] ? "bg-green-500" : "bg-gray-400"}`} />
            {uploadedDocs["individual_selfie"] ? "Uploaded to server" : selfieFile ? "Selected" : "Not uploaded"}
          </span>
        </div>
        <p className="text-xs text-[#64748b]">Must be a photo taken today on your own device.</p>
        <FileUploadDropzone
          file={selfieFile}
          onFileSelect={(f) => {
            setSelfieFile(f);
            if (f && fieldErrors.hasSelfie) setFieldErrors((prev) => ({ ...prev, hasSelfie: "" }));
          }}
          onRemove={() => setUploadedDocs((prev) => ({ ...prev, individual_selfie: false }))}
          onUpload={(f) => handleUploadDocument(f, "individual_selfie", "Selfie")}
          isUploading={uploadingDocs["individual_selfie"]}
          isUploaded={uploadedDocs["individual_selfie"]}
          onError={(msg) => showToast(msg, "error")}
        />
        {fieldErrors.hasSelfie && (
          <span className="text-[11px] text-red-500 font-medium mt-1">{fieldErrors.hasSelfie}</span>
        )}
      </div>

      <div className="rounded-2xl border border-[var(--color-stroke)] bg-white p-5 flex flex-col gap-3 shadow-2xs">
        <div className="flex items-center justify-between gap-4">
          <h4 className="text-sm font-bold text-[#0f172a]">
            Proof of address <span className="text-red-500">*</span>
          </h4>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-[#64748b] border border-[var(--color-stroke)] bg-[#f8fafc]">
            <span className={`h-1.5 w-1.5 rounded-full ${proofOfAddressFile || uploadedDocs["proof_of_address"] ? "bg-green-500" : "bg-gray-400"}`} />
            {uploadedDocs["proof_of_address"] ? "Uploaded to server" : proofOfAddressFile ? "Selected" : "Not uploaded"}
          </span>
        </div>
        <p className="text-xs text-[#64748b] leading-relaxed">
          Must be a bank statement, utility bill, or rent payment dated within 90 days. If this is not available, we can also accept a residential lease agreement.
        </p>
        <FileUploadDropzone
          file={proofOfAddressFile}
          onFileSelect={(f) => {
            setProofOfAddressFile(f);
            if (f && fieldErrors.hasProofOfAddress) setFieldErrors((prev) => ({ ...prev, hasProofOfAddress: "" }));
          }}
          onRemove={() => setUploadedDocs((prev) => ({ ...prev, proof_of_address: false }))}
          onUpload={(f) => handleUploadDocument(f, "proof_of_address", "Proof of address")}
          isUploading={uploadingDocs["proof_of_address"]}
          isUploaded={uploadedDocs["proof_of_address"]}
          onError={(msg) => showToast(msg, "error")}
        />
        {fieldErrors.hasProofOfAddress && (
          <span className="text-[11px] text-red-500 font-medium mt-1">{fieldErrors.hasProofOfAddress}</span>
        )}
      </div>
    </div>
  );
}
