/**
 * KYC/KYB Profile Enum Mappings
 * Maps human-readable display labels to backend enum values.
 */

import { ALL_COUNTRIES } from "@/lib/countries";

export interface KycEnumOption {
  label: string;
  value: string;
}

export const EMPLOYMENT_STATUS_OPTIONS: KycEnumOption[] = [
  { label: "Employee", value: "employee" },
  { label: "Self-employed", value: "self_employed" },
  { label: "Retired", value: "retired" },
  { label: "Unemployed", value: "unemployed" },
  { label: "Homemaker", value: "homemaker" },
  { label: "Student", value: "student" },
  { label: "Other", value: "other" },
];

export const SOURCE_OF_FUNDS_OPTIONS: KycEnumOption[] = [
  { label: "Employment / Salary", value: "employment" },
  { label: "Savings", value: "savings" },
  { label: "Winnings", value: "winnings" },
  { label: "Marital / Spousal", value: "marital" },
  { label: "Real Estate", value: "real_estate" },
  { label: "Trust", value: "trust" },
  { label: "Investment", value: "investment" },
  { label: "Company", value: "company" },
  { label: "Company Capital", value: "company_capital" },
  { label: "Loan", value: "loan" },
  { label: "Private Capital", value: "private_capital" },
  { label: "Grant", value: "grant" },
  { label: "Other", value: "other" },
];

export const ACCOUNT_PURPOSE_OPTIONS: KycEnumOption[] = [
  { label: "Personal Use", value: "personal_use" },
  { label: "Business Operations", value: "business_operations" },
  { label: "Investment", value: "investment" },
  { label: "Crypto Investment", value: "crypto_investment" },
  { label: "Savings", value: "savings" },
  { label: "Remittances", value: "remittances" },
  { label: "Payroll", value: "payroll" },
  { label: "Treasury Management", value: "treasury_management" },
  { label: "Other", value: "other" },
];

/** Helper to look up the backend value from a label */
export function getEnumValue(options: KycEnumOption[], label: string): string {
  return options.find((o) => o.label === label)?.value ?? label;
}

export const HIGH_RISK_ACTIVITY_OPTIONS: KycEnumOption[] = [
  { label: "Adult Entertainment", value: "adult_entertainment" },
  { label: "Drugs", value: "drugs" },
  { label: "Firearms", value: "firearms" },
  { label: "Gambling", value: "gambling" },
  { label: "Marijuana", value: "marijuana" },
  { label: "Crypto Mixing", value: "crypto_mixing" },
];

export const COUNTERPARTY_OPTIONS: KycEnumOption[] = [
  { label: "Self (own accounts)", value: "self_transactions" },
  { label: "Merchants / Suppliers", value: "merchants_suppliers" },
  { label: "Customers", value: "customers" },
  { label: "Employees", value: "employees" },
  { label: "Contractors", value: "contractors" },
  { label: "Friends", value: "friends" },
  { label: "Family", value: "family" },
];

export const ID_DOCUMENT_TYPE_OPTIONS: KycEnumOption[] = [
  { label: "Passport", value: "passport" },
  { label: "Driver's License", value: "drivers_license" },
  { label: "National ID Card", value: "national_id" },
  { label: "Residence Permit", value: "residence_permit" },
  { label: "Voter's Card", value: "voters_card" },
  { label: "Other", value: "other" },
];

/** Convert a country name or 2-letter code to ISO 3166-1 alpha-2 format */
export function toCountryIso2(countryNameOrCode: string): string {
  if (!countryNameOrCode) return "";
  const trimmed = countryNameOrCode.trim();
  if (trimmed.length === 2) return trimmed.toUpperCase();
  const match = ALL_COUNTRIES.find(
    (c) => c.name.toLowerCase() === trimmed.toLowerCase() || c.code === trimmed.toUpperCase()
  );
  if (match) return match.code;
  return trimmed.toUpperCase();
}

/** Map array of items (which might contain legacy display labels or values) strictly to valid enum values */
export function normalizeEnumArray(items: string[], options: KycEnumOption[]): string[] {
  if (!Array.isArray(items)) return [];
  const validValues = new Set(options.map((o) => o.value));
  const result: string[] = [];

  for (const item of items) {
    if (validValues.has(item)) {
      if (!result.includes(item)) result.push(item);
    } else {
      const match = options.find((o) => o.label.toLowerCase() === item.toLowerCase());
      if (match && !result.includes(match.value)) {
        result.push(match.value);
      }
    }
  }
  return result;
}

